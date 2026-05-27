# Google Calendar Read-Only Integration — Technical Plan

Last updated: 2026-05-27

---

## 1. Current Schedule Data Flow

```
constants.ts          useSchedule.ts         TodayScreen.tsx
┌──────────────┐     ┌──────────────┐       ┌──────────────┐
│ DEFAULT_     │     │ AsyncStorage │       │ ScheduleCard │
│ SCHEDULE     │────▶│ "sh-schedules"│──────▶│ renders      │
│ (5 blocks)   │     │ fallback to  │       │ blocks[]     │
└──────────────┘     │ seed data    │       └──────────────┘
                     └──────┬───────┘
                            │
                            ▼
                     GuideScreen.tsx
                     ┌──────────────┐       Edge Function
                     │ buildContext()│──────▶┌──────────────┐
                     │ maps blocks  │       │ system prompt │
                     │ to {time,    │       │ "Today's      │
                     │  title,type} │       │  schedule:…"  │
                     └──────────────┘       └──────────────┘
```

### Files involved

| File | Role |
|---|---|
| `src/lib/types.ts:26-38` | `ScheduleBlock` and `DaySchedule` type definitions |
| `src/lib/constants.ts:6-42` | `DEFAULT_SCHEDULE` — 5 hardcoded seed blocks |
| `src/hooks/useSchedule.ts` | Reads from AsyncStorage key `sh-schedules`, falls back to `DEFAULT_SCHEDULE` |
| `src/screens/TodayScreen.tsx:26` | Calls `useSchedule()`, passes `blocks` to `<ScheduleCard>` |
| `src/components/today/ScheduleCard.tsx` | Renders timeline UI from `ScheduleBlock[]` |
| `src/screens/GuideScreen.tsx:41-58` | `buildContext()` maps blocks to `{ time, title, type }` for Edge Function |
| `src/hooks/useGuide.ts:53-62` | Sends context (including `scheduleBlocks`) to Edge Function |
| `supabase/functions/studio-hour-guide/index.ts:46-63` | `GuideContext.scheduleBlocks` type definition |
| `supabase/functions/studio-hour-guide/index.ts:65-109` | `buildSystemPrompt()` formats blocks into Claude system prompt |

### Current ScheduleBlock shape

```typescript
type BlockType = "normal" | "now" | "protected" | "soft-block";

interface ScheduleBlock {
  id: string;       // e.g. "settle", "art", "lunch"
  time: string;     // e.g. "9:00", "10:00", "1:00"
  title: string;    // e.g. "Protected art time"
  meta: string;     // e.g. "cobalt mural · no admin · no calls"
  type: BlockType;  // controls color coding in ScheduleCard
}
```

### Current data characteristics
- Schedule is local-only (AsyncStorage)
- Falls back to `DEFAULT_SCHEDULE` when no user-modified schedule exists for today
- No server-side schedule storage
- No external calendar integration
- Guide receives schedule as a flat context array, not from a separate API call

---

## 2. Proposed Target Data Flow

```
                          App startup / Today screen focus
                                    │
                                    ▼
                          ┌───────────────────┐
                          │ Has Google token?  │
                          │ (check Supabase)   │
                          └────────┬──────────┘
                           yes     │     no
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
          ┌─────────────────┐          ┌──────────────────┐
          │ Edge Function:  │          │ Fall back to     │
          │ calendar-sync   │          │ DEFAULT_SCHEDULE │
          │ → Google API    │          │ (current behavior)│
          │ → ScheduleBlock │          └──────────────────┘
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ useSchedule()   │
          │ returns merged  │
          │ blocks[]        │
          └────────┬────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
   TodayScreen        GuideScreen
   (ScheduleCard)     (buildContext → Edge Function)
```

### Key design decisions

1. **Calendar fetch happens via Edge Function** — Google tokens never leave the server.
2. **useSchedule stays the single consumer interface** — Today and Guide don't need to know where blocks come from.
3. **Graceful degradation** — If Google is not connected or token refresh fails, the app falls back to seed/local schedule data silently.
4. **No calendar writes** — Read-only scope only.
5. **No persistent event cache** — Fetch fresh each time. Avoids stale data and reduces PII stored in Supabase.

---

## 3. Supabase Table: `google_tokens`

**Migration**: `supabase/migrations/00004_google_tokens.sql`

```sql
create table google_tokens (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  provider       text        not null default 'google',
  access_token   text,
  refresh_token  text,
  token_expiry   timestamptz,
  scope          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table google_tokens enable row level security;
-- No user-facing policies. Only the service role (Edge Functions) can
-- read or write this table.
```

**Connection status RPC** (same migration file):

```sql
create or replace function get_calendar_connection_status()
returns json
language plpgsql
security definer
set search_path = public
as $$
  -- Returns { connected, provider, scope, expired }
  -- Never returns access_token or refresh_token.
  -- SECURITY DEFINER required: google_tokens has no user-facing RLS policies.
$$;
```

### Notes
- Token fields are nullable — they are placeholders for future encrypted token storage and must not be exposed to app logs.
- No user-facing RLS policies (same pattern as `guide_usage`). Only service role (Edge Functions) can read/write.
- The app checks connection status exclusively via `get_calendar_connection_status()`, which uses `auth.uid()` and returns only safe metadata.
- Evaluate Supabase Vault availability on current plan for token encryption. Otherwise, application-level encryption in Edge Functions before insert.

---

## 4. OAuth Flow: Authorization Code + PKCE (Native Android)

### Why PKCE, not a client secret

The Google Cloud OAuth client created for Studio Hour is an **Android native client**, identified by package name (`com.studiohour.app`) + SHA-1 signing certificate. Android native clients do not have a client secret — Google verifies the app's identity via the certificate fingerprint at the authorization step.

PKCE (Proof Key for Code Exchange) replaces the client secret for native apps:
- The app generates a random `code_verifier` and derives a `code_challenge` (SHA-256 hash)
- The `code_challenge` is sent with the authorization request
- The `code_verifier` is sent with the token exchange request
- Google validates that the verifier matches the challenge — proving the same app that started the flow is completing it

### High-level flow

```
┌─────────────┐   1. OAuth + PKCE    ┌──────────────┐
│  Mobile App │──────────────────────▶│  Google Auth  │
│             │   code_challenge      │  Consent      │
│             │◀──────────────────────│  Screen       │
│             │   2. auth code        └──────────────┘
│             │
│             │   3. code +           ┌──────────────┐   4. exchange    ┌──────────────┐
│             │      code_verifier    │  Edge Func:  │───────────────▶│  Google Token │
│             │──────────────────────▶│  google-auth │                │  Endpoint     │
│             │                       │  -callback   │◀───────────────│              │
│             │◀──────────────────────│              │   5. tokens    └──────────────┘
│             │   7. { connected }    │              │
└─────────────┘                       │   6. upsert  │
                                      │   google_    │
                                      │   tokens     │
                                      └──────────────┘
```

**Step by step**:

1. App opens system browser / Chrome Custom Tab to Google's authorization endpoint with:
   - `client_id` (the Android OAuth client ID)
   - `redirect_uri` (the app's custom scheme, e.g. `com.studiohour.app://redirect`)
   - `scope=https://www.googleapis.com/auth/calendar.events.readonly`
   - `code_challenge` (SHA-256 of a random code_verifier)
   - `code_challenge_method=S256`
   - `response_type=code`
   - `access_type=offline` (to receive a refresh_token)
   - `prompt=consent` (required on first connect to get refresh_token)

2. User consents. Google redirects to the app's custom scheme URI with an authorization code.

3. App sends `{ code, codeVerifier, redirectUri }` to the Edge Function via:
   ```typescript
   supabase.functions.invoke('google-auth-callback', {
     body: { code, codeVerifier, redirectUri }
   })
   ```

4. Edge Function exchanges the code at `https://oauth2.googleapis.com/token`:
   ```
   POST /token
   grant_type=authorization_code
   code=<auth_code>
   client_id=<GOOGLE_CLIENT_ID>
   code_verifier=<code_verifier>
   redirect_uri=<redirect_uri>
   ```
   No `client_secret` field — not needed for Android native clients.

5. Google returns `{ access_token, refresh_token, expires_in, scope }`.

6. Edge Function upserts tokens into `google_tokens` table.

7. Edge Function returns `{ connected: true }` to app. Tokens never reach the device.

### Token refresh (in `calendar-sync`, no client secret needed)

```
POST https://oauth2.googleapis.com/token
grant_type=refresh_token
refresh_token=<refresh_token>
client_id=<GOOGLE_CLIENT_ID>
```

No `client_secret` for refresh either — Google allows this for Android native clients.

### Library recommendation: `expo-auth-session`

**`expo-auth-session`** is the recommended package for the OAuth flow in the app.

- Built for Expo projects, compatible with `expo run:android` (production-style Gradle builds)
- Handles browser interaction and redirect capture
- Provides PKCE `code_verifier` / `code_challenge` generation
- Does not require Expo Go — works with dev clients and standalone builds
- Not currently installed — **requires `npx expo install expo-auth-session expo-crypto` with approval**

`expo-crypto` is a peer dependency used by `expo-auth-session` for PKCE challenge generation.

**Alternative**: `react-native-app-auth` (wraps AppAuth-Android directly). More mature for OAuth specifically, but `expo-auth-session` is the standard Expo path and avoids manual Android build config.

### Prerequisite: `scheme` in app.json

`expo-auth-session` requires a `scheme` field in `app.json` to register a custom URI scheme for the redirect. Currently missing:

```json
{
  "expo": {
    "scheme": "studiohour",
    ...
  }
}
```

This generates a redirect URI like `studiohour://redirect` that `expo-auth-session` uses to capture the authorization code after consent. The scheme must also be registered in the Google Cloud Console under the Android OAuth client's redirect URIs (or handled via `com.studiohour.app` custom scheme).

### Edge Function: `google-auth-callback`

**Purpose**: Receive authorization code + PKCE verifier from app, exchange for tokens at Google, store in Supabase.

**Secrets required**:
- `GOOGLE_CLIENT_ID` — the Android OAuth client ID from Google Cloud Console
- Existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**No `GOOGLE_CLIENT_SECRET`** — Android native OAuth clients do not use one.

**Security**:
- Authorization code is single-use and short-lived
- PKCE code_verifier proves the exchange request came from the same app that started the flow
- Tokens are stored server-side only — they never reach the mobile app
- Edge Function verifies caller JWT before processing

### 4b. `calendar-sync`

**Purpose**: Fetch today's Google Calendar events and return them as `ScheduleBlock[]`.

**Flow**:
1. App calls `supabase.functions.invoke('calendar-sync')`
2. Edge Function verifies caller JWT
3. Reads tokens from `google_tokens` for this user
4. If no tokens → return `{ connected: false, blocks: [] }`
5. If access token expired → refresh using refresh token
6. If refresh fails → return `{ connected: false, error: "reauth_needed", blocks: [] }`
7. Call Google Calendar API: `events.list` with `timeMin` = start of today, `timeMax` = end of today, `singleEvents: true`, `orderBy: startTime`
8. Map Google events to `ScheduleBlock[]` (see mapping below)
9. Return `{ connected: true, blocks: ScheduleBlock[] }`

**No persistent storage** — events are fetched live and returned. No Supabase table for events.

---

## 5. OAuth Scope Recommendation

```
https://www.googleapis.com/auth/calendar.events.readonly
```

**Why this scope**:
- Read-only access to calendar events (not full calendar management)
- Sufficient for schedule display and Guide context injection
- Minimizes OAuth consent screen friction
- Reduces security surface area — the app cannot create, modify, or delete events
- If write access is needed later (e.g., blocking focus time), it can be requested as a scope upgrade

**Not recommended for V1**:
- `calendar` (full read-write) — unnecessary
- `calendar.readonly` (reads all calendar metadata, not just events) — unnecessary

---

## 6. Token Storage Strategy

### Storage location
- Tokens stored in Supabase `google_tokens` table, accessed only by Edge Functions via service role
- The mobile app never sees, stores, or transmits Google tokens

### Token lifecycle
1. **Initial grant**: `google-auth-callback` exchanges auth code + PKCE verifier → stores access + refresh tokens. No client secret used.
2. **Refresh**: `calendar-sync` checks `token_expiry` before each Google API call. If expired, sends refresh_token + client_id to Google's token endpoint (no client secret). Updates row with new access token + expiry.
3. **Revocation**: If refresh fails with `invalid_grant`, the Edge Function deletes the token row and returns `{ connected: false, error: "reauth_needed" }`. The app shows a reconnect prompt.
4. **Disconnect**: A future `google-disconnect` Edge Function (or extension of `google-auth-callback`) can delete the token row and revoke the token with Google.

### Encryption
- **Preferred**: Supabase Vault (if available on current Supabase plan)
- **Fallback**: Application-level AES-256-GCM encryption in Edge Functions using a dedicated `GOOGLE_TOKEN_ENCRYPTION_KEY` secret. Tokens encrypted before insert, decrypted after read.

---

## 7. Fallback Behavior

### When Google is not connected
- `useSchedule()` continues to return `DEFAULT_SCHEDULE` from constants — identical to current behavior
- No error shown. No prompt to connect. The app works exactly as it does today.
- A future "Connect Google Calendar" option can appear in a settings or profile screen when ready.

### When token refresh fails
- `calendar-sync` returns `{ connected: false, error: "reauth_needed", blocks: [] }`
- `useSchedule()` falls back to local/seed schedule
- The app can optionally show a subtle indicator (e.g., "Calendar disconnected" label on ScheduleCard) — but this is a UX decision for later
- The Guide receives seed schedule context instead of real calendar — it works, just less precisely

### When Google API call fails (network error, rate limit, etc.)
- `calendar-sync` returns `{ connected: true, error: "fetch_failed", blocks: [] }`
- `useSchedule()` falls back to local/seed schedule
- Silent failure — no crash, no modal, no interruption

---

## 8. Google Calendar → ScheduleBlock Mapping

### Google Calendar event shape (relevant fields)

```typescript
// From Google Calendar API v3 events.list response
interface GoogleCalendarEvent {
  id: string;
  summary: string;          // event title
  description?: string;     // event description/notes
  start: {
    dateTime?: string;      // ISO 8601 (timed events)
    date?: string;          // YYYY-MM-DD (all-day events)
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;           // "confirmed", "tentative", "cancelled"
  transparency?: string;    // "opaque" (busy) or "transparent" (free)
}
```

### Mapping rules

| ScheduleBlock field | Source |
|---|---|
| `id` | `event.id` |
| `time` | Extract `HH:MM` from `event.start.dateTime`. All-day events → `"all day"` |
| `title` | `event.summary` (truncate to 60 chars if needed) |
| `meta` | `event.description` first line (truncate to 80 chars), or empty string |
| `type` | See type mapping below |

### BlockType mapping

| Condition | BlockType |
|---|---|
| Event title or description contains "protected" or "focus" (case-insensitive) | `"protected"` |
| Event overlaps with current time | `"now"` |
| Event marked as tentative (`status === "tentative"`) | `"soft-block"` |
| All other events | `"normal"` |

### All-day events
- Included at the top of the schedule with `time: "all day"`
- Mapped as `"soft-block"` by default
- Useful for context (e.g., "Field trip" or "Studio closed") but don't dominate the timeline

### Cancelled events
- Filtered out (`status === "cancelled"` → skip)

### Multi-calendar
- V1: primary calendar only. Reduces complexity and avoids noisy calendars.
- Later: allow selecting which calendars to include.

---

## 9. How Guide Should Receive Calendar Context

### Current behavior (no change needed to interface)

`GuideScreen.buildContext()` already maps schedule blocks to:
```typescript
scheduleBlocks: blocks.map((b) => ({
  time: b.time,
  title: b.title,
  type: b.type,
}))
```

This shape is consumed by the Edge Function's `buildSystemPrompt()` as:
```
Today's schedule: 9:00 — Settle in. (now); 10:00 — Protected art time (protected); …
```

### What changes with calendar integration

**Nothing in the interface.** The `useSchedule()` hook returns `ScheduleBlock[]` regardless of source. The Guide receives the same shape whether blocks come from seed data or Google Calendar.

The only difference is the content is real.

### Optional future enhancement

Add a `source` field to the context so the Guide knows the schedule is real vs. seed:
```typescript
scheduleBlocks: blocks.map((b) => ({
  time: b.time,
  title: b.title,
  type: b.type,
})),
scheduleSource: "google_calendar" | "default"
```

This lets the Guide say "I see you have a dentist appointment at 2" with confidence vs. treating seed data as a rough template. Not required for V1 — the Guide works either way.

---

## 10. Implementation Phases (Small Tickets)

### Phase A — Readiness (this ticket ✓)
- [x] Inspect current schedule architecture
- [x] Document data flow and files involved
- [x] Write this technical plan
- [x] Add lightweight calendar TypeScript types

### Phase B — Supabase Foundation ✓
- [x] Create Supabase migration `00004_google_tokens.sql`: `google_tokens` table, RLS enabled, no user-facing policies
- [x] Create RPC function `get_calendar_connection_status()` — uses `auth.uid()`, returns `{ connected, provider, scope, expired }`, never exposes raw tokens
- [ ] Run migration on Supabase project `nzjfmhldlcpvkqpzkztc` (manual: `supabase db push`)

### Phase C — Google Cloud Setup ✓
- [x] Create Google Cloud project: Studio Hour
- [x] Enable Google Calendar API
- [x] Configure OAuth consent screen (testing mode)
- [x] Add test users: winmachacker@gmail.com, Danielle.tishkun@gmail.com
- [x] Add scope: `https://www.googleapis.com/auth/calendar.events.readonly`
- [x] Create Android OAuth client: Studio Hour Android Debug (`com.studiohour.app`)
- [ ] Note: production distribution requires Google app verification for `calendar.events.readonly` scope

### Phase D — Edge Function: `google-auth-callback`
- [ ] Create Edge Function that receives auth code + PKCE code_verifier from app
- [ ] Exchange at Google token endpoint (no client secret — Android native PKCE flow)
- [ ] Upsert tokens into `google_tokens` table
- [ ] Set secret: `GOOGLE_CLIENT_ID` (no `GOOGLE_CLIENT_SECRET` needed)
- [ ] Test with curl

### Phase E — Edge Function: `calendar-sync`
- [ ] Create Edge Function that fetches today's events from Google Calendar API
- [ ] Handle token refresh transparently
- [ ] Map Google events to `ScheduleBlock[]` shape
- [ ] Return `{ connected, blocks, error? }`
- [ ] Handle all failure modes (no token, expired, revoked, network error)
- [ ] Test with curl

### Phase F — App Integration
- [ ] Update `useSchedule()` to optionally fetch from `calendar-sync` Edge Function
- [ ] Maintain fallback to `DEFAULT_SCHEDULE` when not connected
- [ ] Add connection status check (call `get_calendar_connection_status` RPC or infer from `calendar-sync` response)
- [ ] No UI changes to ScheduleCard — it already renders `ScheduleBlock[]`

### Phase G — OAuth Flow in App
- [ ] Add `scheme: "studiohour"` to `app.json` (required for redirect URI)
- [ ] Install `expo-auth-session` + `expo-crypto` (requires approval, triggers native rebuild)
- [ ] Implement Google OAuth with PKCE via `expo-auth-session`
- [ ] Send auth code + code_verifier + redirect_uri to `google-auth-callback` Edge Function
- [ ] On success, trigger `calendar-sync` to load real schedule
- [ ] Add connect/disconnect UI (settings screen or dedicated connection screen)

### Phase H — Validation
- [ ] End-to-end test: connect Google → see real calendar events on Today screen
- [ ] Verify Guide receives real schedule context
- [ ] Test fallback: disconnect Google → app falls back to seed schedule
- [ ] Test token expiry: force-expire access token → verify transparent refresh
- [ ] Test revocation: revoke in Google account → verify graceful re-auth prompt

---

## 11. Google Cloud Setup Status

Completed: 2026-05-27

### Project
- **Google Cloud project**: Studio Hour
- **Google Calendar API**: enabled

### OAuth Consent Screen
- **Status**: testing mode
- **Test users**:
  - winmachacker@gmail.com
  - Danielle.tishkun@gmail.com
- **Scope**: `https://www.googleapis.com/auth/calendar.events.readonly`

### Android OAuth Client
- **Name**: Studio Hour Android Debug
- **Package**: `com.studiohour.app`
- **SHA-1**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

### Important notes
- This is an **Android native OAuth client** — it has no client secret. App identity is verified by package name + SHA-1 signing certificate.
- This client is for the current debug/local Android build. A separate client will be required for production/release signing or Play signing.
- Client ID is not a secret, but downloaded OAuth JSON files should not be committed unless explicitly reviewed.
- The token exchange uses PKCE (code_verifier / code_challenge) instead of a client secret. See section 4 for the full flow.

---

## 12. Risks and Open Questions

1. **Google OAuth consent screen verification** — `calendar.events.readonly` is a restricted scope. Google requires verification for apps with >100 users. For a single-user app this may not matter immediately, but could block broader distribution later.

2. **`expo-auth-session` redirect URI in Gradle builds** — `expo-auth-session` uses the `scheme` field from `app.json` to generate redirect URIs (e.g. `studiohour://redirect`). This works in production-style `expo run:android` builds, but the exact redirect URI format should be verified on-device before relying on it. If the custom scheme redirect does not work, fallback options include using `WebBrowser.openAuthSessionAsync` directly or switching to `react-native-app-auth`.

3. **PKCE in `expo-auth-session`** — `expo-auth-session` generates PKCE challenges internally via `expo-crypto`. The code_verifier must be extracted and sent to the Edge Function for server-side token exchange. Verify that `expo-auth-session` exposes the raw code_verifier (not just the code_challenge) — if it only does the full exchange internally, a manual PKCE implementation may be needed.

4. **Token encryption** — Need to determine if Supabase Vault is available on the current plan. If not, application-level encryption adds complexity to the Edge Functions.

5. **Timezone handling** — Google Calendar events use the event's timezone. The app needs to display times in the user's local timezone. `ScheduleBlock.time` is currently a simple string like `"9:00"` — this works but may need timezone-aware formatting.

6. **Multi-calendar visibility** — V1 uses primary calendar only. Some users split personal/work across calendars. This is a future concern, not a V1 blocker.

7. **Package approval** — OAuth flow requires installing `expo-auth-session` and `expo-crypto`. Both need explicit approval before Phase G. Installing triggers a native rebuild (`expo run:android` again).

8. **Debug vs. release SHA-1** — The current Android OAuth client uses the debug keystore SHA-1. A production release (or Play App Signing) uses a different certificate. A second OAuth client must be created for production before any public release.
