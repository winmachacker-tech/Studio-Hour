/**
 * Google Calendar OAuth constants, types, and helpers.
 *
 * Uses expo-auth-session for Authorization Code + PKCE.
 * The Android OAuth client has no client secret — PKCE replaces it.
 *
 * Client ID:
 *   Passed via EXPO_PUBLIC_GOOGLE_CLIENT_ID env var. This is the
 *   Android OAuth client ID from Google Cloud Console. It is a public
 *   identifier (not a secret) — Google verifies the app via package
 *   name + SHA-1 signing certificate.
 *
 * Token handling:
 *   The app never sees Google tokens. It sends only the authorization
 *   code + PKCE code_verifier to the google-auth-callback Edge Function,
 *   which exchanges them server-side and stores tokens in Supabase.
 */

import * as AuthSession from "expo-auth-session";
import { supabase } from "../supabase";

// ── Constants ────────────────────────────────────────────────────────

export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.readonly";

export const GOOGLE_REDIRECT_URI =
  "com.googleusercontent.apps.666099783371-q3hlavndh63puo9m81uadn694ahq9jhr:/oauth2redirect";

export const GOOGLE_AUTH_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

// ── Types ────────────────────────────────────────────────────────────

export interface GoogleAuthResult {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface GoogleAuthCallbackResponse {
  connected: boolean;
  provider: string;
  scope: string | null;
  tokenExpiry: string | null;
  error?: string;
}

export interface CalendarConnectionStatus {
  connected: boolean;
  provider: string | null;
  scope: string | null;
  expired: boolean | null;
}

export interface ConnectResult {
  connected: boolean;
  error: string | null;
}

// ── OAuth helpers ────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function getRedirectUri(): string {
  return GOOGLE_REDIRECT_URI;
}

export function createAuthRequest(): AuthSession.AuthRequest | null {
  if (!GOOGLE_CLIENT_ID) return null;

  return new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: [GOOGLE_CALENDAR_SCOPE],
    redirectUri: getRedirectUri(),
    usePKCE: true,
    extraParams: {
      access_type: "offline",
      prompt: "consent",
    },
  });
}

export async function exchangeCodeWithServer(
  result: GoogleAuthResult
): Promise<ConnectResult> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "google-auth-callback",
      {
        body: {
          code: result.code,
          codeVerifier: result.codeVerifier,
          redirectUri: result.redirectUri,
        },
      }
    );

    if (error) {
      return { connected: false, error: error.message ?? "Connection failed." };
    }

    if (data?.error) {
      return { connected: false, error: data.error };
    }

    return { connected: data?.connected === true, error: null };
  } catch {
    return {
      connected: false,
      error: "Couldn't connect. Check your internet and try again.",
    };
  }
}

// ── Connection status ────────────────────────────────────────────────

export async function fetchConnectionStatus(): Promise<CalendarConnectionStatus> {
  try {
    const { data, error } = await supabase.rpc(
      "get_calendar_connection_status"
    );

    if (error || !data) {
      return { connected: false, provider: null, scope: null, expired: null };
    }

    return data as CalendarConnectionStatus;
  } catch {
    return { connected: false, provider: null, scope: null, expired: null };
  }
}
