# Guide — Calendar & Source Awareness

Last updated: 2026-05-27

---

## How Guide receives context

`GuideScreen.buildContext()` sends the following to the `studio-hour-guide` Edge Function:

| Field | Source | May be seed data? |
|---|---|---|
| `scheduleBlocks` | `useSchedule()` → Google Calendar or `DEFAULT_SCHEDULE` | Yes, when `scheduleSource` is `"default"` |
| `scheduleSource` | `useSchedule().source` — `"google"`, `"local"`, or `"default"` | No (it's a flag) |
| `checkIn` | `useCheckIn()` — only sent when `completed === true` | No (always user-entered) |
| `openWorkItems` | `useTasks()` → AsyncStorage, defaults to `SEED_WORK_ITEMS` | Yes |
| `ideas` | `useIdeas()` → AsyncStorage, defaults to `SEED_IDEAS` | Yes |
| `rituals` | `useRituals()` → AsyncStorage, defaults to `DEFAULT_RITUALS` | Yes |

## Source discipline in the system prompt

The `studio-hour-guide` system prompt includes a "Source awareness" section that instructs Claude to:

1. **Calendar blocks** (when `scheduleSource === "google"`): treat as real, fixed commitments. Plan around them.
2. **Work items, ideas, rituals**: reference gently. These may be starter examples — say "it looks like you have…" not "your mural is ready to go."
3. **No invented urgency**: never assert deadlines, readiness, or status the context doesn't state.
4. **Planning anchor**: start from fixed calendar blocks, then suggest one or two realistic moves for open gaps.

## Privacy protections

Only minimal, safe fields are sent to Claude:

- **Schedule**: `{ time, title, type }` — no descriptions, attendees, emails, links, locations, or calendar names
- **Work/ideas**: `{ title, status, energy, group }` / `{ title, status, platform }` — no notes or full content
- **Rituals**: `{ text, done }` — ritual text only
- **Check-in**: numeric scores only
- **`scheduleSource`**: simple string enum, not a calendar identifier

No Google tokens, event IDs, user IDs, or raw API payloads reach the Guide.

## Future improvement

If work items and ideas gain user-created vs. seed tracking (e.g., an `isUserCreated` flag or comparing against known seed IDs), the app could pass a source hint alongside those items. This would let the prompt distinguish real projects from defaults without relying solely on Claude's hedging. Not required now — the prompt-level approach is sufficient for the current single-user context.
