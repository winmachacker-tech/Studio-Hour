/**
 * Edge Function: calendar-sync
 *
 * Fetches today's (or a specified date's) Google Calendar events and
 * returns them mapped to Studio Hour's ScheduleBlock shape.
 *
 * Trust boundary:
 *   - Google tokens are read server-side from google_tokens. They never
 *     leave this function and are never returned to the app.
 *   - Token values and calendar event details are never logged.
 *   - Calendar events are not persisted — Google Calendar is the source
 *     of truth.
 *   - Only minimal block data is returned: id, time, title, meta, type.
 *     No descriptions, attendees, emails, meeting links, or locations.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_LIST_URL =
  "https://www.googleapis.com/calendar/v3/users/me/calendarList";
const GOOGLE_CALENDAR_EVENTS_BASE =
  "https://www.googleapis.com/calendar/v3/calendars";
const DEFAULT_TIME_ZONE = "America/Los_Angeles";
const MAX_BLOCKS = 20;
const ALLOWED_ROLES = new Set(["owner", "writer", "reader"]);

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

// ── Date helpers ─────────────────────────────────────────────────────

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getUtcOffsetForDate(dateStr: string, tz: string): string {
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  });
  const parts = fmt.formatToParts(probe);
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  if (!tzPart) return "-07:00";
  const raw = tzPart.value; // e.g. "GMT-7" or "GMT-8"
  const match = raw.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/);
  if (!match) return "-07:00";
  const sign = match[1] === "+" ? "+" : "-";
  const hours = match[2].padStart(2, "0");
  const mins = match[3] ?? "00";
  return `${sign}${hours}:${mins}`;
}

function nextDay(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime(isoString: string, timeZone: string): string {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "12";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const period = (parts.find((p) => p.type === "dayPeriod")?.value ?? "am").toLowerCase();
  return minute === "00" ? `${hour}${period}` : `${hour}:${minute}${period}`;
}

function formatDuration(startIso: string, endIso: string): string {
  const mins = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
  );
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

// ── BlockType mapping ────────────────────────────────────────────────

type BlockType = "normal" | "now" | "protected" | "soft-block";

function classifyBlock(
  summary: string,
  status: string,
  startTime: string | undefined,
  endTime: string | undefined
): BlockType {
  const lower = (summary ?? "").toLowerCase();

  if (lower.includes("protected") || lower.includes("focus")) {
    return "protected";
  }

  if (status === "tentative") {
    return "soft-block";
  }

  if (startTime && endTime) {
    const now = Date.now();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (now >= start && now < end) {
      return "now";
    }
  }

  return "normal";
}

// ── Google event → ScheduleBlock ─────────────────────────────────────

interface GoogleEvent {
  id?: string;
  summary?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

interface ScheduleBlock {
  id: string;
  time: string;
  title: string;
  meta: string;
  type: BlockType;
}

function mapEvent(event: GoogleEvent, timeZone: string): ScheduleBlock | null {
  if (event.status === "cancelled") return null;

  const isAllDay = !event.start?.dateTime && !!event.start?.date;
  const startIso = event.start?.dateTime;
  const endIso = event.end?.dateTime;

  const time = isAllDay ? "all day" : startIso ? formatTime(startIso, timeZone) : "—";
  const title = (event.summary ?? "Busy").slice(0, 60);

  let meta = "";
  if (!isAllDay && startIso && endIso) {
    meta = formatDuration(startIso, endIso);
  }

  const type: BlockType = isAllDay
    ? "soft-block"
    : classifyBlock(
        event.summary ?? "",
        event.status ?? "confirmed",
        startIso,
        endIso
      );

  return {
    id: event.id ?? `gcal-${Date.now()}`,
    time,
    title,
    meta,
    type,
  };
}

// ── Token refresh ────────────────────────────────────────────────────

interface RefreshResult {
  accessToken: string;
  expiresIn?: number;
  scope?: string;
}

async function refreshAccessToken(
  clientId: string,
  refreshToken: string
): Promise<RefreshResult | null> {
  let res: Response;
  try {
    res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[calendar-sync] refresh_fetch_failed: ${msg}`);
    return null;
  }

  if (!res.ok) {
    console.error(`[calendar-sync] refresh_error status=${res.status}`);
    try {
      const parsed = await res.json();
      if (parsed.error) {
        console.error(`[calendar-sync] refresh_error_code=${parsed.error}`);
      }
    } catch {
      // Not JSON — skip.
    }
    return null;
  }

  const data = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
  } | null;

  if (!data || !data.access_token) {
    console.error("[calendar-sync] refresh_response_missing_access_token");
    return null;
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
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
    return json({ error: "Sign in to sync your calendar." }, 401);
  }

  // ── Config ──────────────────────────────────────────────────────────

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  if (!clientId) {
    console.error("[calendar-sync] GOOGLE_CLIENT_ID not configured");
    return json({ error: "Calendar sync is not configured yet." }, 500);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error(
      "[calendar-sync] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return json({ error: "Calendar sync is not configured yet." }, 500);
  }

  // ── Parse body ──────────────────────────────────────────────────────

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine — defaults to today.
  }

  const date =
    typeof body.date === "string" && isValidDate(body.date)
      ? body.date
      : todayString();

  // ── Read tokens ─────────────────────────────────────────────────────

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: tokenRow, error: tokenErr } = await admin
    .from("google_tokens")
    .select("access_token, refresh_token, token_expiry, scope")
    .eq("user_id", caller.userId)
    .maybeSingle();

  if (tokenErr) {
    console.error(`[calendar-sync] token_lookup_failed: ${tokenErr.message}`);
    return json({ error: "Could not check calendar connection." }, 500);
  }

  if (!tokenRow) {
    return json({
      connected: false,
      blocks: [],
      source: "google",
      error: "not_connected",
    });
  }

  // ── Ensure valid access token ───────────────────────────────────────

  let accessToken: string | null = tokenRow.access_token;
  const isExpired =
    !tokenRow.token_expiry ||
    new Date(tokenRow.token_expiry).getTime() < Date.now();

  if (!accessToken || isExpired) {
    if (!tokenRow.refresh_token) {
      console.warn("[calendar-sync] no_refresh_token_available");
      return json({
        connected: true,
        blocks: [],
        source: "google",
        date,
        error: "reauth_required",
      });
    }

    console.log("[calendar-sync] refreshing access token");
    const refreshed = await refreshAccessToken(
      clientId,
      tokenRow.refresh_token
    );

    if (!refreshed) {
      return json({
        connected: true,
        blocks: [],
        source: "google",
        date,
        error: "reauth_required",
      });
    }

    accessToken = refreshed.accessToken;

    // Persist new access token. Preserve existing refresh_token.
    const tokenExpiry = refreshed.expiresIn
      ? new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
      : null;

    if (!tokenExpiry) {
      console.warn("[calendar-sync] refresh_response_missing_expires_in");
    }

    const { error: updateErr } = await admin
      .from("google_tokens")
      .update({
        access_token: accessToken,
        token_expiry: tokenExpiry,
        scope: refreshed.scope ?? tokenRow.scope,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", caller.userId);

    if (updateErr) {
      console.error(`[calendar-sync] token_update_failed: ${updateErr.message}`);
      // Non-fatal — we have a working access token for this request.
    }
  }

  // ── Build time bounds ────────────────────────────────────────────────

  const timeZone =
    Deno.env.get("STUDIO_HOUR_TIME_ZONE") || DEFAULT_TIME_ZONE;
  const offset = getUtcOffsetForDate(date, timeZone);
  const timeMin = `${date}T00:00:00${offset}`;
  const timeMax = `${nextDay(date)}T00:00:00${getUtcOffsetForDate(nextDay(date), timeZone)}`;

  console.log(
    `[calendar-sync] bounds date=${date} tz=${timeZone} timeMin=${timeMin} timeMax=${timeMax}`
  );

  // ── Fetch calendar list ────────────────────────────────────────────

  let listRes: Response;
  try {
    listRes = await fetch(GOOGLE_CALENDAR_LIST_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[calendar-sync] calendarList_fetch_failed: ${msg}`);
    return json({
      connected: true,
      blocks: [],
      source: "google",
      date,
      error: "google_api_error",
    });
  }

  if (listRes.status === 401 || listRes.status === 403) {
    console.error(
      `[calendar-sync] calendarList_auth_rejected status=${listRes.status}`
    );
    return json({
      connected: true,
      blocks: [],
      source: "google",
      date,
      error: "reauth_required",
    });
  }

  if (!listRes.ok) {
    console.error(
      `[calendar-sync] calendarList_api_error status=${listRes.status}`
    );
    return json({
      connected: true,
      blocks: [],
      source: "google",
      date,
      error: "google_api_error",
    });
  }

  interface CalendarEntry {
    id?: string;
    primary?: boolean;
    selected?: boolean;
    accessRole?: string;
  }

  const listData = (await listRes.json().catch(() => null)) as {
    items?: CalendarEntry[];
  } | null;

  if (!listData || !Array.isArray(listData.items)) {
    console.error("[calendar-sync] calendarList_response_malformed");
    return json({
      connected: true,
      blocks: [],
      source: "google",
      date,
      error: "google_api_error",
    });
  }

  const calendarIds: string[] = [];
  let primaryIncluded = false;
  for (const cal of listData.items) {
    if (!cal.id) continue;
    if (cal.primary) {
      calendarIds.push(cal.id);
      primaryIncluded = true;
    } else if (ALLOWED_ROLES.has(cal.accessRole ?? "")) {
      calendarIds.push(cal.id);
    }
  }

  console.log(
    `[calendar-sync] calendars total=${listData.items.length} readable=${calendarIds.length} primaryIncluded=${primaryIncluded}`
  );

  if (calendarIds.length === 0) {
    return json({
      connected: true,
      blocks: [],
      source: "google",
      date,
    });
  }

  // ── Fetch events from each selected calendar ───────────────────────

  const allEntries: { block: ScheduleBlock; startMs: number }[] = [];
  let anySuccess = false;

  for (let i = 0; i < calendarIds.length; i++) {
    const calId = calendarIds[i];
    const eventsUrl = `${GOOGLE_CALENDAR_EVENTS_BASE}/${encodeURIComponent(calId)}/events`;
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      timeZone,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: String(MAX_BLOCKS),
    });

    let evtRes: Response;
    try {
      evtRes = await fetch(`${eventsUrl}?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[calendar-sync] calendar_fetch cal=${i} network_error: ${msg}`);
      continue;
    }

    if (evtRes.status === 401 || evtRes.status === 403) {
      console.error(
        `[calendar-sync] calendar_fetch cal=${i} status=${evtRes.status} auth_rejected`
      );
      if (i === 0 && calendarIds.length === 1) {
        return json({
          connected: true,
          blocks: [],
          source: "google",
          date,
          error: "reauth_required",
        });
      }
      continue;
    }

    if (!evtRes.ok) {
      console.error(
        `[calendar-sync] calendar_fetch cal=${i} status=${evtRes.status}`
      );
      continue;
    }

    const evtData = (await evtRes.json().catch(() => null)) as {
      items?: GoogleEvent[];
    } | null;

    if (!evtData || !Array.isArray(evtData.items)) {
      console.error(`[calendar-sync] calendar_fetch cal=${i} status=200 malformed=true`);
      continue;
    }

    anySuccess = true;
    let mapped = 0;
    for (const event of evtData.items) {
      const block = mapEvent(event, timeZone);
      if (block) {
        const startMs = event.start?.dateTime
          ? new Date(event.start.dateTime).getTime()
          : 0;
        allEntries.push({ block, startMs });
        mapped++;
      }
    }

    console.log(
      `[calendar-sync] calendar_fetch cal=${i} status=200 items=${evtData.items.length} mapped=${mapped}`
    );
  }

  if (!anySuccess && calendarIds.length > 0) {
    console.error("[calendar-sync] all_calendar_fetches_failed");
    return json({
      connected: true,
      blocks: [],
      source: "google",
      date,
      error: "google_api_error",
    });
  }

  // ── Sort by absolute start time and limit ─────────────────────────

  allEntries.sort((a, b) => {
    if (a.block.time === "all day") return -1;
    if (b.block.time === "all day") return 1;
    return a.startMs - b.startMs;
  });

  const blocks = allEntries.slice(0, MAX_BLOCKS).map((e) => e.block);

  console.log(
    `[calendar-sync] returning ${blocks.length} blocks for ${date}`
  );

  return json({
    connected: true,
    blocks,
    source: "google",
    date,
  });
});
