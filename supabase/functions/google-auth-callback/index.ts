/**
 * Edge Function: google-auth-callback
 *
 * Receives an OAuth authorization code + PKCE code_verifier from the
 * mobile app, exchanges them at Google's token endpoint, and stores
 * the resulting tokens in the google_tokens table.
 *
 * Trust boundary:
 *   - GOOGLE_CLIENT_ID lives only in this function's secrets.
 *   - No GOOGLE_CLIENT_SECRET — Android native clients use PKCE.
 *   - Callers must present a valid Supabase auth bearer token.
 *   - Access tokens and refresh tokens are never returned to the app.
 *   - Token values are never logged.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// ── HTTP helpers ──────────────────────────────────────────────────────

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}

// ── Caller auth (same pattern as studio-hour-guide) ─────────────────

async function verifyCaller(
  authHeader: string
): Promise<{ userId: string } | null> {
  if (!authHeader.startsWith("Bearer ")) return null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return null;

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: anonKey,
    },
  });
  if (!res.ok) return null;
  const caller = (await res.json().catch(() => null)) as {
    id?: string;
  } | null;
  if (!caller || typeof caller.id !== "string") return null;
  return { userId: caller.id };
}

// ── Handler ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // ── Auth ────────────────────────────────────────────────────────────

  const authHeader =
    req.headers.get("authorization") ??
    req.headers.get("Authorization") ??
    "";
  const caller = await verifyCaller(authHeader);
  if (!caller) {
    return json({ error: "Sign in to connect Google Calendar." }, 401);
  }

  // ── Config ──────────────────────────────────────────────────────────

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  if (!clientId) {
    console.error("[google-auth-callback] GOOGLE_CLIENT_ID not configured");
    return json({ error: "Google Calendar is not configured yet." }, 500);
  }

  // ── Parse body ──────────────────────────────────────────────────────

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const code =
    typeof body.code === "string" ? body.code.trim() : "";
  const codeVerifier =
    typeof body.codeVerifier === "string" ? body.codeVerifier.trim() : "";
  const redirectUri =
    typeof body.redirectUri === "string" ? body.redirectUri.trim() : "";

  if (!code) {
    return json({ error: "code is required." }, 400);
  }
  if (!codeVerifier) {
    return json({ error: "codeVerifier is required." }, 400);
  }
  if (!redirectUri) {
    return json({ error: "redirectUri is required." }, 400);
  }

  // ── Exchange at Google token endpoint ───────────────────────────────

  console.log("[google-auth-callback] exchanging authorization code");

  let tokenRes: Response;
  try {
    tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[google-auth-callback] token_fetch_failed: ${msg}`);
    return json({ error: "Could not reach Google. Try again." }, 502);
  }

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text().catch(() => "(unreadable)");
    console.error(
      `[google-auth-callback] google_token_error status=${tokenRes.status}`
    );
    // Do not log errBody — it may contain sensitive grant details.
    // Log only the error code if parseable.
    try {
      const parsed = JSON.parse(errBody);
      if (parsed.error) {
        console.error(
          `[google-auth-callback] google_error_code=${parsed.error}`
        );
      }
    } catch {
      // Not JSON — skip.
    }
    return json(
      { error: "Google rejected the authorization code. Please try again." },
      400
    );
  }

  const tokenData = (await tokenRes.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  } | null;

  if (!tokenData || !tokenData.access_token) {
    console.error("[google-auth-callback] google_response_missing_access_token");
    return json({ error: "Google returned an unexpected response." }, 502);
  }

  // ── Upsert into google_tokens ──────────────────────────────────────

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("[google-auth-callback] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Calendar connection is not configured yet." }, 500);
  }
  const admin = createClient(supabaseUrl, serviceKey);

  let tokenExpiry: string | null = null;
  if (tokenData.expires_in) {
    tokenExpiry = new Date(
      Date.now() + tokenData.expires_in * 1000
    ).toISOString();
  } else {
    console.warn("[google-auth-callback] google_response_missing_expires_in");
  }

  // If Google did not return a refresh_token (happens on subsequent
  // authorizations when the user has already granted access), preserve
  // the existing refresh_token rather than overwriting with null.
  if (tokenData.refresh_token) {
    // Full upsert — we have a new refresh token.
    const { error: upsertErr } = await admin.from("google_tokens").upsert(
      {
        user_id: caller.userId,
        provider: "google",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiry: tokenExpiry,
        scope: tokenData.scope ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      console.error(
        `[google-auth-callback] upsert_failed: ${upsertErr.message}`
      );
      return json({ error: "Could not save connection." }, 500);
    }
  } else {
    // Partial update — preserve existing refresh_token.
    // Try update first; if no row exists, insert without refresh_token.
    const { data: existing, error: existingErr } = await admin
      .from("google_tokens")
      .select("user_id")
      .eq("user_id", caller.userId)
      .maybeSingle();

    if (existingErr) {
      console.error(
        `[google-auth-callback] existing_lookup_failed: ${existingErr.message}`
      );
      return json({ error: "Could not save connection." }, 500);
    }

    if (existing) {
      const { error: updateErr } = await admin
        .from("google_tokens")
        .update({
          access_token: tokenData.access_token,
          token_expiry: tokenExpiry,
          scope: tokenData.scope ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", caller.userId);

      if (updateErr) {
        console.error(
          `[google-auth-callback] update_failed: ${updateErr.message}`
        );
        return json({ error: "Could not save connection." }, 500);
      }
    } else {
      // First connection but no refresh_token — unusual but handle it.
      const { error: insertErr } = await admin
        .from("google_tokens")
        .insert({
          user_id: caller.userId,
          provider: "google",
          access_token: tokenData.access_token,
          refresh_token: null,
          token_expiry: tokenExpiry,
          scope: tokenData.scope ?? null,
        });

      if (insertErr) {
        console.error(
          `[google-auth-callback] insert_failed: ${insertErr.message}`
        );
        return json({ error: "Could not save connection." }, 500);
      }
    }
  }

  console.log(
    `[google-auth-callback] connected scope=${tokenData.scope ?? "unknown"}`
  );

  // ── Safe response — never return raw tokens ────────────────────────

  return json({
    connected: true,
    provider: "google",
    scope: tokenData.scope ?? null,
    tokenExpiry,
  });
});
