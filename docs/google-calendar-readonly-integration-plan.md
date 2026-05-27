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

## 3. Proposed Supabase Table: `google_tokens`

```sql
create table public.google_tokens (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  access_token   text not null,
  refresh_token  text not null,
  token_expiry   timestamptz not null,
  scope          text not null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- RLS: users can only read their own connection status (not raw tokens)
alter table public.google_tokens enable row level security;

-- Service role only for token read/write (Edge Functions use service role)
-- No user-facing RLS select policy exposes raw tokens
-- A separate RPC can expose connection status (connected: boolean) to the app
```

### Notes
- `access_token` and `refresh_token` are stored as encrypted text. Evaluate Supabase Vault availability on current plan — if available, use it. Otherwise, application-level encryption in the Edge Function before insert.
- Only the Edge Functions (running with service role key) read/write this table.
- The app never sees raw tokens. It only needs to know: "Am I connected to Google?"

---

## 4. Proposed Edge Functions

### 4a. `google-auth-callback`

**Purpose**: Exchange the OAuth authorization code for tokens and store them.

**Flow**:
1. App completes Google OAuth consent flow, receives authorization code
2. App calls `supabase.functions.invoke('google-auth-callback', { body: { code, redirectUri } })`
3. Edge Function verifies caller JWT
4. Exchanges authorization code for access + refresh tokens via Google OAuth2 token endpoint
5. Stores tokens in `google_tokens` table (upsert on `user_id`)
6. Returns `{ connected: true }` to app

**Secrets required**:
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- Existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Security**:
- Authorization code is single-use and short-lived
- Client secret stays server-side only
- Tokens stored server-side only

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
1. **Initial grant**: `google-auth-callback` exchanges auth code → stores access + refresh tokens
2. **Refresh**: `calendar-sync` checks `token_expiry` before each Google API call. If expired, uses refresh token to get new access token, updates row.
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

### Phase B — Supabase Foundation
- [ ] Create Supabase migration: `google_tokens` table with RLS
- [ ] Create RPC function: `get_calendar_connection_status(p_user_id)` → returns `{ connected: boolean }`
- [ ] Verify migration on Supabase project `nzjfmhldlcpvkqpzkztc`

### Phase C — Google Cloud Setup (manual, not code)
- [ ] Create Google Cloud project (or reuse existing)
- [ ] Enable Google Calendar API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 client ID (type: Android / Web as needed)
- [ ] Note: production distribution requires Google app verification for `calendar.events.readonly` scope

### Phase D — Edge Function: `google-auth-callback`
- [ ] Create Edge Function that exchanges authorization code for tokens
- [ ] Store tokens in `google_tokens` table (encrypted)
- [ ] Set secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
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
- [ ] Add Google sign-in button (settings screen or dedicated connection screen)
- [ ] Use `expo-auth-session` (or `react-native-app-auth`) for OAuth flow
- [ ] Send authorization code to `google-auth-callback` Edge Function
- [ ] On success, trigger `calendar-sync` to load real schedule
- [ ] Package install required: `expo-auth-session` — needs approval

### Phase H — Validation
- [ ] End-to-end test: connect Google → see real calendar events on Today screen
- [ ] Verify Guide receives real schedule context
- [ ] Test fallback: disconnect Google → app falls back to seed schedule
- [ ] Test token expiry: force-expire access token → verify transparent refresh
- [ ] Test revocation: revoke in Google account → verify graceful re-auth prompt

---

## 11. Risks and Open Questions

1. **Google OAuth consent screen verification** — `calendar.events.readonly` is a restricted scope. Google requires verification for apps with >100 users. For a single-user app this may not matter immediately, but could block broader distribution later.

2. **OAuth library compatibility with Gradle build** — `expo-auth-session` and `react-native-app-auth` both need to work without Expo Go. Verify the chosen library works with `expo run:android` before committing to it.

3. **Token encryption** — Need to determine if Supabase Vault is available on the current plan. If not, application-level encryption adds complexity to the Edge Functions.

4. **Timezone handling** — Google Calendar events use the event's timezone. The app needs to display times in the user's local timezone. `ScheduleBlock.time` is currently a simple string like `"9:00"` — this works but may need timezone-aware formatting.

5. **Multi-calendar visibility** — V1 uses primary calendar only. Some users split personal/work across calendars. This is a future concern, not a V1 blocker.

6. **Package approval** — OAuth flow will require installing `expo-auth-session` or equivalent. This needs explicit approval before Phase G.
