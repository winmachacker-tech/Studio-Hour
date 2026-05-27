# Studio Hour — Phase Next Roadmap

Last updated: 2026-05-27

---

## 1. Current Product State

Studio Hour is a React Native / Expo mobile app built for a solo creative (Danielle) to manage her studio practice — murals, art, content ideas, and daily rhythm.

### What exists today

| Layer | State |
|---|---|
| **Tabs** | Today, Open Work, Dashboard, Ideas, Guide |
| **Data** | Local-first via AsyncStorage — check-ins, tasks, ideas, rituals, schedule |
| **Auth** | Supabase email/password, JWT-based session |
| **Guide** | Conversational AI via Supabase Edge Function (`studio-hour-guide`), Claude Sonnet, server-side only |
| **Conversation persistence** | Messages stored in Supabase `messages` table, threaded by `conversations` table |
| **Rate limiting** | 30 messages/day/user, server-side atomic check via `use_guide_message()` RPC |
| **Context injection** | Check-in, schedule, rituals, open work, and ideas passed into Claude system prompt each turn |
| **Memory** | Session-level only — recent 10 messages loaded per conversation. No cross-session summarization or long-term user preferences |
| **Suggestions** | Hardcoded post-response suggestions based on intent pattern matching |
| **Build** | Android production-style via Gradle + adb. No Expo Go, no EAS |
| **Database** | Three migrations: `guide_usage`, `conversations`, `messages` |
| **Edge Function** | Single function: `studio-hour-guide` — JWT verification, rate limit, context build, Claude call, response storage |

### What does not exist yet

- No calendar integration
- No push notifications
- No voice input
- No partner/shared features
- No cross-session memory summarization
- No background sync or offline queue
- No analytics or usage tracking
- No onboarding flow

---

## 2. Product Principles for This Phase

1. **Mobile-first** — Every feature ships as a native mobile experience. No web dashboard, no desktop companion.
2. **Production-oriented** — Build with Gradle, test on real devices via adb. No Expo Go shortcuts.
3. **Secure by default** — API keys stay server-side. Auth tokens handled by Supabase SDK. No client-side AI calls.
4. **Server-side AI only** — All Claude interactions route through Supabase Edge Functions. The Anthropic API key never touches the app binary.
5. **No Expo Go / No EAS dependency** — The build and deploy pipeline uses standard Android tooling. EAS may be evaluated later but is not a requirement.
6. **Avoid feature creep** — Each phase delivers one stable, testable slice. No half-built features sitting behind flags.
7. **One stable slice at a time** — Ship, validate, then move on. Do not start the next feature until the current one is solid on-device.

---

## 3. Feature Candidate Analysis

### 3a. Google Calendar Integration

**User value**: High. Danielle's schedule is the backbone of her day. Right now the schedule is hardcoded seed data. Real calendar data would make Today, Guide, and Dashboard dramatically more useful.

**Technical complexity**: Medium-high.
- Google OAuth flow in React Native (expo-auth-session or react-native-app-auth)
- Token exchange and refresh on the server
- Supabase table for encrypted token storage
- New Edge Function (or extension of existing) to fetch calendar events
- System prompt injection of real schedule data

**Security/privacy concerns**:
- OAuth tokens must be stored server-side in Supabase, never in AsyncStorage
- Refresh token rotation must be handled correctly
- Scope should be read-only (`calendar.events.readonly`) to minimize risk
- Calendar data should not be logged or persisted beyond what's needed for the current session

**Dependencies**:
- Google Cloud project with Calendar API enabled
- OAuth consent screen (may require verification for production)
- Supabase table + RLS for token storage
- Edge Function with Google API client

**Recommended priority**: 1st — this is the highest-leverage feature

**Phase**: V1

---

### 3b. Calendar-Aware Claude Planning

**User value**: High. The Guide becomes genuinely useful for daily planning when it knows Danielle's real schedule — not seed data.

**Technical complexity**: Low-medium (once calendar integration exists). The Edge Function already injects `scheduleBlocks` into the system prompt. Replacing seed data with real calendar events is a relatively contained change.

**Security/privacy concerns**:
- Calendar event titles/descriptions flow into Claude prompts. Sensitive meetings (medical, legal) could leak into AI context. Consider a filter or opt-out mechanism later, but not for V1.

**Dependencies**:
- Google Calendar integration (3a) must ship first

**Recommended priority**: 2nd — ships immediately after calendar integration as a natural extension

**Phase**: V1 (same slice as calendar integration)

---

### 3c. Better Memory Summarization

**User value**: Medium-high. The Guide currently loads only 10 recent messages. It has no recall of prior sessions. A summarization layer would let the Guide remember Danielle's patterns, preferences, and ongoing threads across days.

**Technical complexity**: Medium.
- End-of-conversation summarization (Claude call to distill key facts)
- Supabase table for user memory/summaries
- System prompt injection of relevant summaries
- Decay or pruning strategy so memory stays relevant

**Security/privacy concerns**:
- Summaries stored in Supabase should be user-scoped with RLS
- Summaries may contain sensitive personal context — treat as PII

**Dependencies**:
- No hard dependencies, but benefits from calendar integration being live (richer context to summarize)

**Recommended priority**: 3rd

**Phase**: V1.5

---

### 3d. Push Notifications / Reminders

**User value**: Medium. Useful for ritual reminders, upcoming deadlines, and Guide nudges. But not critical until the daily planning flow is solid.

**Technical complexity**: Medium-high.
- expo-notifications setup
- Push token registration with Supabase
- Server-side notification dispatch (Edge Function or Supabase cron)
- Notification permission flow
- Deep linking from notification to relevant screen

**Security/privacy concerns**:
- Push tokens are device identifiers — store securely
- Notification content should not include sensitive details in the preview

**Dependencies**:
- Better if calendar integration exists (schedule-aware reminders)
- Needs a trigger system (time-based, event-based)

**Recommended priority**: 4th

**Phase**: V1.5

---

### 3e. Voice Notes

**User value**: Medium. Natural input for a creative who's often in the studio with paint on her hands. But text input works today, and voice adds significant complexity.

**Technical complexity**: High.
- Audio recording (expo-av or react-native-audio)
- Audio upload to Supabase Storage or a transcription service
- Whisper or similar transcription (server-side)
- Integration with Guide conversation flow
- Playback UI

**Security/privacy concerns**:
- Audio files are sensitive PII
- Transcription service adds a third-party dependency
- Storage costs scale with usage

**Dependencies**:
- Transcription service selection
- Supabase Storage bucket setup

**Recommended priority**: 6th

**Phase**: Later (V2+)

---

### 3f. Shared / Partner Features

**User value**: Low-medium for current use case. Danielle is the primary user. Partner features add social complexity without clear immediate return.

**Technical complexity**: High.
- Shared data model (who sees what)
- Invitation flow
- Real-time sync
- Permission system
- Significant UX design work

**Security/privacy concerns**:
- Multi-user data access requires careful RLS redesign
- Privacy boundaries between partners

**Dependencies**:
- Stable single-user experience must exist first

**Recommended priority**: 7th

**Phase**: Later (V2+)

---

### 3g. Daily Planning Intelligence

**User value**: High. The Guide could proactively suggest a day plan based on energy level, calendar, open work, and deadlines. This is the natural evolution of calendar-aware planning.

**Technical complexity**: Medium.
- Enhanced system prompt with planning heuristics
- Structured output from Claude (schedule blocks, priorities)
- UI to display and accept/modify the suggested plan
- Integration with Today screen

**Security/privacy concerns**:
- Same as calendar-aware planning — calendar data flows through Claude

**Dependencies**:
- Google Calendar integration (3a)
- Calendar-aware Claude planning (3b)

**Recommended priority**: 5th

**Phase**: V1.5

---

### 3h. Guide Context Expansion

**User value**: Medium. Currently the Guide sees check-in, schedule, rituals, open work (6), and ideas (6). Expanding to include Dashboard stats (leads, special projects, due dates) would make the Guide more holistic.

**Technical complexity**: Low.
- Extend the context object passed to the Edge Function
- Update system prompt template
- May need to manage token budget more carefully

**Security/privacy concerns**:
- More context = more data in Claude prompts. Keep within token limits to avoid truncation of important context.

**Dependencies**:
- None — can ship independently

**Recommended priority**: 3rd (can be bundled with memory work)

**Phase**: V1.5

---

## 4. Recommended Implementation Order

| Order | Feature | Phase | Rationale |
|---|---|---|---|
| 1 | Google Calendar integration | V1 | Highest leverage — replaces seed schedule with real data |
| 2 | Calendar-aware Claude planning | V1 | Natural extension, ships in same slice as calendar |
| 3 | Guide context expansion | V1.5 | Low effort, high value — feed more data into Guide |
| 4 | Better memory summarization | V1.5 | Guide becomes genuinely personal across sessions |
| 5 | Daily planning intelligence | V1.5 | Builds on calendar + memory for proactive planning |
| 6 | Push notifications / reminders | V1.5 | Useful once planning is solid |
| 7 | Voice notes | V2+ | High complexity, moderate value — wait until core is strong |
| 8 | Shared / partner features | V2+ | Needs stable single-user foundation first |

---

## 5. Suggested Phase 1 Slice

### Google Calendar Read + Calendar-Aware Guide

**Scope**: The smallest valuable next implementation that connects Danielle's real schedule to the app.

**What ships**:
1. Google OAuth sign-in flow (read-only calendar scope)
2. Supabase table for encrypted Google tokens (per user)
3. New Supabase Edge Function: `calendar-sync` — fetches today's events using stored tokens
4. Today screen displays real calendar events instead of seed data
5. Guide receives real schedule in system prompt context
6. Token refresh handled server-side, transparent to user

**What does not ship** (intentionally deferred):
- No calendar write access
- No multi-day calendar view
- No event creation from the app
- No notification triggers based on calendar
- No memory summarization
- No planning intelligence beyond what the Guide already does with schedule context

**Why this slice**: The schedule is currently seed data. Replacing it with real calendar data is the single change that makes Today, Dashboard, and Guide dramatically more useful — without adding new screens, new tabs, or new interaction patterns.

---

## 6. Google Calendar Architecture Proposal

### High-Level Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Mobile App  │────▶│   Supabase   │────▶│  Google Calendar  │
│              │     │  Edge Func   │     │      API          │
│  OAuth flow  │     │  token mgmt  │     │  events.list      │
│  display     │     │  event fetch │     │                    │
└──────────────┘     └──────────────┘     └──────────────────┘
```

### Step 1: Google OAuth

- Use `expo-auth-session` (or `react-native-app-auth`) for the OAuth flow
- Request scope: `https://www.googleapis.com/auth/calendar.events.readonly`
- Read-only is the correct first step — no write access, no full calendar scope
- OAuth redirect handled in-app
- Authorization code sent to a new Edge Function for token exchange

### Step 2: Token Handling

- New Edge Function: `google-auth-callback`
  - Receives authorization code from app
  - Exchanges code for access + refresh tokens via Google OAuth2 endpoint
  - Stores tokens in Supabase (encrypted at rest)
  - Returns success/failure to app
- Token refresh: handled server-side before each calendar fetch
  - If access token expired, use refresh token to get new one
  - If refresh token revoked, notify app to re-authenticate

### Step 3: Supabase Storage

New table: `google_tokens`

| Column | Type | Notes |
|---|---|---|
| user_id | uuid | FK to auth.users, PK |
| access_token | text | Encrypted |
| refresh_token | text | Encrypted |
| token_expiry | timestamptz | When access token expires |
| scope | text | Granted scope string |
| created_at | timestamptz | |
| updated_at | timestamptz | |

- RLS: users can only read/update their own row
- Service role used by Edge Functions for token operations
- Consider Supabase Vault for encryption if available, otherwise application-level encryption

### Step 4: Edge Function Calendar Fetch

New Edge Function: `calendar-sync`

1. Verify caller JWT
2. Fetch user's Google tokens from `google_tokens` table
3. If access token expired, refresh it
4. Call Google Calendar API: `events.list` for today (timeMin/timeMax)
5. Transform events into `ScheduleBlock[]` format the app already uses
6. Return schedule blocks to app

No persistent event storage — fetch fresh each time. Avoids stale data and reduces PII surface area.

### Step 5: Claude Schedule Context Injection

Minimal change to `studio-hour-guide` Edge Function:
- Accept `scheduleBlocks` from the app as before
- The app now passes real calendar blocks instead of seed data
- No Edge Function change needed if the app handles the calendar fetch and passes results

Alternative (preferred): The Guide Edge Function fetches calendar data directly, so the app doesn't need to pass schedule context at all. This keeps calendar tokens entirely server-side.

### Step 6: Read-Only Calendar Scope

`calendar.events.readonly` is the right first scope:
- Minimizes OAuth consent screen friction
- Reduces security surface area
- Sufficient for schedule display and Guide context
- Write access can be added later if needed (e.g., blocking focus time)

---

## 7. Risks / Decisions Needed Before Implementation

### Technical Decisions

1. **OAuth library choice**: `expo-auth-session` vs `react-native-app-auth`. The former is more Expo-native; the latter has broader OAuth provider support. Need to verify both work with the current Gradle-based build (no Expo Go).

2. **Token encryption strategy**: Supabase Vault (if available on the current plan) vs application-level encryption in the Edge Function. Vault is preferred but may not be available.

3. **Calendar fetch architecture**: Should the app fetch calendar events and pass them to the Guide, or should the Guide Edge Function fetch calendar data directly? Direct fetch is more secure (tokens never leave the server) but adds coupling.

4. **Google Cloud project setup**: Need a GCP project with Calendar API enabled and OAuth consent screen configured. If targeting more than test users, Google may require app verification (can take weeks).

### Product Risks

5. **Google OAuth consent screen verification**: For production distribution, Google requires verification of apps requesting sensitive scopes. `calendar.events.readonly` is a restricted scope. Plan for the verification timeline.

6. **Seed data migration**: The app currently uses `DEFAULT_SCHEDULE` from constants. Switching to real calendar data means handling the case where the user hasn't connected Google yet — need a graceful fallback to the current seed data.

7. **Token revocation handling**: If Danielle revokes Google access, the app needs to degrade gracefully — not crash, not show stale data, and prompt re-authentication.

8. **Rate limits**: Google Calendar API has per-user and per-project quotas. For a single user this is not a concern, but worth noting for future multi-user scenarios.

### Process Risks

9. **No lint or typecheck scripts**: The project has no `npm run lint` or `npm run typecheck` in package.json. TypeScript strict mode is on, but there's no CI gate. Consider adding `tsc --noEmit` as a script before this phase.

10. **No automated tests**: No test framework is configured. The production-style workflow (Gradle + adb) catches runtime issues, but type-level and logic-level regressions are possible.

---

## 8. Claude Implementation Rules

When Claude Code works on this project, the following rules apply without exception:

1. **Do not commit.** All commits are made by the human operator after review.
2. **Do not auto-build.** No `npx expo run:android`, no Gradle invocations, no `adb install`. The human runs builds.
3. **Do not install APK.** No `adb install` or `adb push` commands.
4. **Do not move secrets into the app.** The `ANTHROPIC_API_KEY` and any future Google OAuth client secrets stay in Supabase Edge Function environment variables. Never in `.env`, never in app code, never in AsyncStorage.
5. **Do not bypass Supabase Edge Functions for AI.** All Claude / Anthropic API calls go through Edge Functions. No direct `fetch` to `api.anthropic.com` from the React Native app.
6. **Preserve current navigation and visual identity.** The five tabs (Today, Open Work, Dashboard, Ideas, Guide), the custom SVG icons, the dark plum/teal theme, and the BricolageGrotesque typography are the app's identity. Do not reorganize tabs, swap icons, or change the color palette without explicit instruction.
7. **Do not use Expo Go.** The app runs via `expo run:android` with Gradle.
8. **Do not use EAS.** Build and deploy tooling stays local.
9. **Do not install new packages without approval.** Dependency additions require human sign-off.
10. **One slice at a time.** Do not start implementing the next feature until the current one is confirmed working on-device.
