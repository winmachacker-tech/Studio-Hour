# Seed Data Removal

Date: 2026-05-27

---

## What changed

All seed/demo content in `src/lib/constants.ts` has been replaced with empty arrays. The exported constant names are preserved so existing imports continue to work.

| Constant | Was | Now |
|---|---|---|
| `DEFAULT_SCHEDULE` | 5 demo schedule blocks | `[]` |
| `DEFAULT_RITUALS` | 4 demo rituals | `[]` |
| `SEED_WORK_ITEMS` | 4 demo work items | `[]` |
| `SEED_IDEAS` | 6 demo ideas | `[]` |
| `SEED_DUE_ITEMS` | 3 demo deadlines | `[]` |
| `SEED_MURAL_LEADS` | 3 demo leads | `[]` |
| `SEED_SPECIAL_PROJECTS` | 2 demo projects | `[]` |

## Why

With Google Calendar connected and real schedule data flowing through, demo content caused confusion:
- Guide referenced fictional work items ("cobalt mural", "send the final art file") as if they were real
- SuggestedFocus on Today recommended fake follow-ups and tasks
- Dashboard showed fake leads, deadlines, and special projects
- The app felt like a demo rather than a real tool

## Empty states

Every screen that consumed seed data now handles empty gracefully:

| Screen / Component | Empty behavior |
|---|---|
| **ScheduleCard** | "No calendar events today" / "Your studio time is open." (already existed) |
| **OpenWorkScreen** | "No open work yet." Filter row hidden. |
| **IdeasScreen** | "No ideas yet." Filter row hidden. FAB still visible. |
| **RitualsCard** | Hidden when no rituals exist (avoids "0 of 0") |
| **DueSoonCard** | Returns null when empty (already existed) |
| **LeadsCard** | Returns null when empty (already existed) |
| **SpecialProjects** | Returns null when empty (already existed) |
| **SnapGrid** | "Everything is done." / "The drawer is empty." (already existed) |
| **SuggestedFocus** | "Take it easy. The studio will be here tomorrow." (already existed) |

## Guide behavior

With empty seed data, Guide context will have empty `openWorkItems` and `ideas` arrays. The system prompt's "Source awareness" section already instructs Claude to:
- Not reference work items that may be starter examples
- Not invent deadlines or urgency
- Anchor planning on fixed calendar blocks first

With seed data removed, this is now moot for fresh installs — there are no starter examples to misreference. Users who previously had seed data in AsyncStorage will still have it until they clear app data; the Source awareness prompt instructions handle that case.

## What was NOT changed

- Edge Functions (calendar-sync, studio-hour-guide) — untouched
- Google Calendar integration — untouched
- Navigation — untouched
- UI components — no visual changes, only conditional rendering for empty states
- Type definitions — untouched
- Exported constant names — preserved (empty arrays)
