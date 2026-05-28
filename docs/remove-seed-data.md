# Seed Data Removal

Date: 2026-05-27

---

## What changed

### Phase 1: Constants emptied

All seed/demo content in `src/lib/constants.ts` replaced with empty arrays:

| Constant | Was | Now |
|---|---|---|
| `DEFAULT_SCHEDULE` | 5 demo schedule blocks | `[]` |
| `DEFAULT_RITUALS` | 4 demo rituals | `[]` |
| `SEED_WORK_ITEMS` | 4 demo work items | `[]` |
| `SEED_IDEAS` | 6 demo ideas | `[]` |
| `SEED_DUE_ITEMS` | 3 demo deadlines | `[]` |
| `SEED_MURAL_LEADS` | 3 demo leads | `[]` |
| `SEED_SPECIAL_PROJECTS` | 2 demo projects | `[]` |

### Phase 2: AsyncStorage cleanup migration

Emptying constants only helps fresh installs. Existing installs have old seed data persisted in AsyncStorage from earlier app runs. `src/lib/cleanSeedData.ts` runs a one-time migration on app launch (before any data hooks mount) that removes known seed items by ID.

**Storage keys cleaned:**

| Key | Seed IDs removed |
|---|---|
| `sh-work-items` | `cobalt-mural`, `tote-art`, `maya-lead`, `workshop-deck` |
| `sh-ideas` | `cobalt-mix`, `wall-carousel`, `lavender-cobalt-series`, `mural-day-longform`, `open-studio-tea`, `wildflower-tote` |
| `sh-rituals` | `pages`, `walk`, `phone`, `lunch` (per-date entries) |
| `sh-schedules` | `settle`, `art`, `lunch`, `spa`, `kids` (per-date entries) |

**Safety guarantees:**
- Only items with known seed IDs are removed
- User-created items (e.g., ideas added via AddIdeaForm) are preserved
- Migration flag `sh-seed-cleaned-v1` prevents re-running
- Migration runs before `MainTabs` mounts, so hooks see clean data on first render
- Silent failure — if migration errors, it retries on next launch

### Phase 2b: Other demo content removed

| Source | Was | Now |
|---|---|---|
| `PromptStack.tsx` | "Help me follow up on a mural lead" | "Help me write a follow-up message" |
| `DashboardScreen.tsx` | Rendered `DueSoonCard`, `LeadsCard`, `SpecialProjects` with empty seed arrays | Components and imports removed |
| `AuthScreen.tsx` | Placeholder "danielle@studio.com" | "Email" |

## Why

With Google Calendar connected and real schedule data flowing through, demo content caused confusion:
- Guide referenced fictional work items ("cobalt mural", "send the final art file") as if they were real
- SuggestedFocus on Today recommended fake follow-ups and tasks
- Dashboard showed fake leads, deadlines, and special projects
- Ideas page showed fake ideas from old AsyncStorage data even after constants were emptied
- The app felt like a demo rather than a real tool

## Empty states

Every screen that consumed seed data handles empty gracefully:

| Screen / Component | Empty behavior |
|---|---|
| **ScheduleCard** | "No calendar events today" / "Your studio time is open." |
| **OpenWorkScreen** | "No open work yet." Filter row hidden. |
| **IdeasScreen** | "No ideas yet." Filter row hidden. FAB still visible. |
| **RitualsCard** | Hidden when no rituals exist |
| **Dashboard** | SnapGrid shows zero-state snaps. DueSoon/Leads/SpecialProjects removed. |
| **SnapGrid** | "Everything is done." / "The drawer is empty." |
| **SuggestedFocus** | "Take it easy. The studio will be here tomorrow." |

## Guide behavior

With seed data removed from both constants and AsyncStorage:
- Guide context has empty `openWorkItems` and `ideas` arrays when no user-created data exists
- Calendar blocks (when connected) are the primary real context
- System prompt Source awareness instructions prevent Claude from inventing work or asserting fake urgency

## Known remaining demo reference

`supabase/functions/studio-hour-guide/index.ts` line 131 contains a hardcoded suggestion "Help me reply to Maya" which references the old seed lead. This is in the Edge Function (not modified per constraint) and will fire when a user message contains "low-energy" or "tired". Fix requires Edge Function redeployment.

## What was NOT changed

- Edge Functions (calendar-sync, studio-hour-guide) — not modified
- Google Calendar integration — untouched
- Navigation — untouched
- Type definitions — untouched (WorkGroup, MuralLead types preserved for future use)
- Filter categories (Murals, Studio art, Design, Leads) — structural UI, not demo content
- Exported constant names — preserved (empty arrays, imports still work)
