# Studio Hour — Danielle Feedback Roadmap & To-Do

Last updated: 2026-05-29
Status: **Planning only — no code written yet.** This is a spec/roadmap doc to drive future implementation tickets.

---

## 1. Product Interpretation — Why This Matters

Danielle's feedback marks a real shift in what Studio Hour is for.

**Today**, the app is a lightweight creative-task tracker: capture loose work, jot ideas, check in on mood/energy, and let the Guide nudge the day along. It assumes most work is a single small task done in a single sitting.

**Danielle is asking for** something closer to an **artist studio operating system** — a tool that understands her actual practice:

- Real work is **projects**, not one-off tasks. A mural or a tote-bag line takes **multiple sessions across days or weeks**. The app should track that arc, not pretend everything finishes in one quiet block.
- Projects need **structure** (subtasks), a **sense of momentum** (progress), and **accountability** (goals, accomplishments, due dates).
- Ideas aren't a flat list — they fall into a **mental taxonomy** she already uses (social posts by platform, artwork by type, outreach by leads/locations, growth).
- The Guide should graduate from reactive nudges to **proactive planning** — helping her shape a week, protect rest, and slot specific projects and leads into real time.
- The Today screen should let her **author her own plan**, not just mirror calendar events — explicit time blocks with start/end times for what she intends to make.

### Design principles to carry through every phase
1. **Projects span sessions.** Nothing in the model or copy should imply "finish it today." Progress is expected to move a little at a time.
2. **Structure is optional, never required.** A project with zero subtasks and no due date must still work. Don't force ceremony on a quick capture.
3. **Local-first stays.** Everything continues to persist via AsyncStorage unless a phase explicitly calls for sync. No new backend is required for Phases 1–4.
4. **The Guide reads the new structure.** Each data upgrade should also be surfaced to the Guide's context payload so its advice reflects reality (subtasks, progress, due dates, plan blocks).
5. **One ticket at a time.** Phases are ordered so each is shippable on its own.

---

## 2. Prioritized Implementation Roadmap

| Phase | Theme | Why this order | Rough size |
|---|---|---|---|
| **1** | Rename *Open Work* → *Open Projects* | Cheap, sets the vocabulary everything else builds on | Small |
| **2** | Project model upgrades (subtasks, progress, multi-session, goals, accomplishments, due dates) | The heart of the request; everything downstream depends on the richer model | Large |
| **3** | Idea categories & subcategories | Independent of projects; high daily value, self-contained | Medium |
| **4** | Today plan manual time blocks | Builds on existing schedule UI; unblocks Phase 5 | Medium |
| **5** | Claude planning intelligence (plan my week, find timeslots) | Needs Phases 2 & 4 data to plan against | Large |

**Recommended sequencing rationale:** Phase 1 is a rename that defines language used everywhere after it, so it goes first. Phase 2 is the core value and the biggest lift — do it before idea/plan work so the Guide and planning features have real project structure to reason about. Phases 3 and 4 are parallel-safe and could swap order based on Danielle's appetite. Phase 5 is last because good planning needs the structured projects (Phase 2) and manual plan blocks (Phase 4) to exist first.

---

## 3. Phase 1 — Rename "Open Work" to "Open Projects"

**Goal:** Replace the "Open Work" vocabulary across the app with "Open Projects" (and "project" / "projects" in supporting copy), with no behavior change.

**Why first:** It's low-risk, and every later phase refers to "projects." Locking the word now avoids churn later.

### Scope / known touch points (from current codebase)
- `src/lib/types.ts` — `TabId` value `"open-work"`; consider whether to rename to `"open-projects"` (see migration note).
- `src/navigation/MainTabs.tsx` — tab label and route.
- `src/screens/OpenWorkScreen.tsx` — screen file + header copy. (File rename to `OpenProjectsScreen.tsx` optional; can defer to avoid noisy diff.)
- `src/components/icons/TabIcons.tsx` — tab icon mapping keyed by tab id.
- `src/screens/DashboardScreen.tsx` and `src/components/dashboard/SnapGrid.tsx` — any "Open Work" references (note: a dashboard card here is in the *Do Not Implement Yet* list — rename copy if trivial, but do **not** redesign the card).
- `src/screens/GuideScreen.tsx` — copy and any context labels passed to the Guide.
- Guide edge function / system prompt — update the label "open work" → "open projects" so the AI's language matches the UI.

### Decisions to make
- **Tab id migration:** changing `"open-work"` → `"open-projects"` is cleaner long-term but may invalidate any persisted nav/UI state. Safer interim option: keep the internal id `"open-work"`, change only user-facing labels. **Recommendation:** keep the internal id for Phase 1; revisit during Phase 2 when the model is touched anyway.
- **Data key:** the underlying type is `WorkItem`. Renaming the type to `Project` belongs in Phase 2 (it's a model change), not here. Phase 1 is copy-only.

### Acceptance criteria
- No user-visible string says "Open Work" / "Work" where "Open Projects" / "Project" is meant.
- Tab, screen header, empty states, and Guide copy all read "Project(s)."
- App builds and navigates exactly as before; persisted data still loads.

---

## 4. Phase 2 — Project Model Upgrades

**Goal:** Evolve the current flat `WorkItem` into a real **Project** that can hold subtasks, show progress, span multiple sessions, and carry goals, accomplishments, and a due date.

### 4.1 New / upgraded data model (proposed)
Current `WorkItem` (in `src/lib/types.ts`):
```ts
interface WorkItem {
  id; project; title; status; energy; note; group; dueDate?; createdAt; updatedAt;
}
```
Proposed `Project` shape (illustrative — finalize in the ticket):
```ts
interface Subtask {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  group: WorkGroup;              // Murals | Studio art | Design | Leads (existing)
  status: WorkStatus;            // existing enum
  energy: EnergyLevel;           // existing enum
  note: string;

  // NEW — structure
  subtasks: Subtask[];

  // NEW — progress
  progress: number;              // 0–100. Manual slider OR derived from subtasks (see decision)
  progressMode: "manual" | "auto"; // how progress is computed

  // NEW — multi-session awareness
  isMultiSession: boolean;       // hint that this won't finish in one block
  sessionCount?: number;         // optional: how many sittings logged so far

  // NEW — accountability
  goal?: string;                 // what "done" looks like in Danielle's words
  accomplishments: { text: string; date: string }[]; // log of wins as it progresses
  dueDate?: string;              // already exists today

  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Features in this phase
1. **Subtasks / sub-points**
   - Add, edit, check off, reorder, delete subtasks within a project.
   - Show count "3 of 7 done" on the project card.
2. **Progress slider**
   - A 0–100 slider on the project detail view.
   - **Decision:** auto-derive from subtask completion *or* let Danielle drag it manually. **Recommendation:** support both via `progressMode` — default `auto` when subtasks exist, `manual` when they don't. Let her override.
3. **Multi-session understanding** *(this is the explicit "help Claude understand" item)*
   - `isMultiSession` flag + optional session count.
   - Card copy and Guide context should say things like "ongoing — picks up across sessions" rather than implying same-day completion.
   - The Guide's system prompt must be told: *projects can take many short sessions; suggest the next increment, not the whole thing.*
4. **Goals**
   - Free-text "what finished looks like" per project.
5. **Accomplishments log**
   - Append-only list of small wins with dates — fuels motivation and gives the Guide material for encouragement and weekly recaps.
6. **Progress tracking & due dates**
   - Due date already exists on the model; surface it more prominently (countdown / "due in 4 days"), and feed it to planning (Phase 5).

### 4.3 UI surfaces to update
- `src/components/work/WorkCard.tsx` → show progress bar, subtask count, due-date chip, multi-session badge.
- `src/components/work/AddWorkForm.tsx` → add fields for goal, due date, subtasks, multi-session toggle.
- New **Project detail view** (likely new screen/component) for subtasks, slider, accomplishments. *(Confirm with Danielle whether she wants a dedicated detail screen or inline expansion.)*
- Guide context builder (edge function) → include subtasks, progress, goal, due date, multi-session flag.

### 4.4 Migration
- Existing persisted `WorkItem`s must upgrade cleanly: default `subtasks: []`, `progress: 0`, `accomplishments: []`, `isMultiSession: false`, `progressMode: "manual"`. Write a one-time, non-destructive migration on load.
- If renaming `WorkItem` → `Project` and the tab id (`"open-work"` → `"open-projects"`), do it here since the model is already being touched. Preserve data under any storage-key change.

### Acceptance criteria
- A project can hold subtasks; checking them updates progress (in auto mode).
- A project can be marked multi-session and shows it on the card.
- Goal, accomplishments, and due date are visible and editable.
- Old data loads without loss after migration.
- Guide responses reflect subtasks/progress/due dates and never imply a multi-session project should finish in one block.

---

## 5. Phase 3 — Idea Categories & Subcategories

**Goal:** Replace the flat idea list with Danielle's real taxonomy. Current `Idea` has `kind: "Posts" | "Artwork" | "Voiceover"` and `platform`. Her structure is richer and hierarchical.

### 5.1 Target taxonomy (from Danielle)
```
Social Media Posts
  └─ platform subcategories (TikTok, Instagram, Facebook, Nextdoor, …)
Artwork
  ├─ Mural ideas
  ├─ Tote Bags
  └─ Other
Outreach
  ├─ Leads
  └─ Locations
Growth
```

### 5.2 Proposed model
```ts
type IdeaCategory = "social" | "artwork" | "outreach" | "growth";

type IdeaSubcategory =
  // social → handled via existing `platform`
  | "mural" | "tote-bags" | "artwork-other"   // artwork
  | "leads" | "locations"                      // outreach
  | null;                                       // growth (no subcategory)

interface Idea {
  id: string;
  category: IdeaCategory;
  subcategory: IdeaSubcategory;   // null when category has none
  platform?: Platform;            // only relevant when category === "social"
  title: string;
  status: IdeaStatus;             // existing: saved | draft | used
  note: string;
  createdAt: string;
  updatedAt: string;
}
```

### 5.3 Features
- Category + subcategory selector in `AddIdeaForm.tsx`.
- For **Social Media Posts**, keep the existing platform tag (`PlatformTag.tsx`) as the subcategory.
- Grouped/filterable display in the Ideas screen — collapse by category, filter by subcategory.
- `IdeaCard.tsx` shows category + subcategory (and platform for social).

### 5.4 Migration
- Map existing `kind` values onto the new categories:
  - `"Posts"` → `social` (carry over `platform`).
  - `"Artwork"` → `artwork`, subcategory `artwork-other` (let Danielle re-sort to mural/tote later).
  - `"Voiceover"` → decide: likely `social` or a retained note. **Confirm with Danielle.**
- Non-destructive default for anything unmapped.

### Acceptance criteria
- New ideas can be filed under the full category/subcategory tree.
- Social posts retain platform tagging.
- Ideas screen can be browsed by category and subcategory.
- Old ideas survive migration and are reasonably categorized.

---

## 6. Phase 4 — Today Plan Manual Time Blocks

**Goal:** Let Danielle author her own plan on the Today screen with explicit time blocks, showing start and end times — not just mirrored calendar events.

### 6.1 Current state
- `ScheduleCard.tsx` renders `ScheduleBlock[]` from `DaySchedule`, each block currently has a single `time` string, a `title`, `meta`, and a `type` (`normal | now | protected | soft-block`).
- Blocks today come largely from calendar sync; there's no in-app "add a plan item" affordance.

### 6.2 Features
1. **"Add plan" button** on Today's Plan Card.
2. **Manual time blocks** the user creates: pick what to work on (free text, or link to a Project from Phase 2), set **start and end time**.
3. **Show start AND end times** on plan items (today the model has a single `time`; extend it).
4. Visually distinguish user-authored plan blocks from calendar-sourced blocks.

### 6.3 Model change
```ts
interface ScheduleBlock {
  id: string;
  // CHANGE: support a start/end window. Keep `time` working for calendar blocks,
  // or migrate to startTime/endTime and derive a display string.
  startTime: string;     // NEW
  endTime?: string;      // NEW
  title: string;
  meta: string;
  type: BlockType;
  source?: "manual" | "calendar"; // NEW — who created it
  projectId?: string;             // NEW — optional link to a Phase 2 Project
}
```
- **Decision:** whether to keep the legacy single `time` for calendar blocks or normalize everything to `startTime`/`endTime`. **Recommendation:** add `startTime`/`endTime`, keep a derived display string, and backfill calendar blocks' `startTime` from existing `time`.

### 6.4 UI surfaces
- `src/components/today/ScheduleCard.tsx` → add button, render start–end, badge manual vs calendar.
- New add-plan form/modal (mirror the lightweight style of `AddWorkForm` / `AddIdeaForm`).

### Acceptance criteria
- Danielle can add a plan item with a start and end time from the Today screen.
- Plan items display their start and end times.
- Manual blocks coexist with calendar blocks and are visually distinct.
- Manual plan blocks persist locally and survive reload.

---

## 7. Phase 5 — Claude Planning Intelligence

**Goal:** Move the Guide from reactive nudging to **proactive planning**. Depends on Phase 2 (structured projects, due dates) and Phase 4 (manual plan blocks with real times).

### 7.1 Capabilities Danielle asked for
1. **"Plan my week"** — the Guide proposes a week shaped around her projects, due dates, energy, and rituals.
2. **Find timeslots** — for rest, for a specific project, for working leads/outreach, etc. The Guide looks at calendar + manual plan blocks and suggests open windows.

### 7.2 What the Guide needs (context payload additions)
- Projects with: status, progress, due date, multi-session flag, next-best subtask, energy level.
- Today/this-week's schedule: calendar blocks + manual plan blocks with start/end times → so it can find genuine gaps.
- Rituals and check-in (energy/overwhelm) → so it protects rest and matches tasks to energy.
- Outreach leads/locations (from Phase 3 Outreach category) → so "work my leads" is actionable.

### 7.3 Behaviors / guardrails
- **Respect multi-session reality:** suggest the *next increment* of a long project, not "finish the mural today."
- **Protect rest:** explicitly schedule rest/quiet blocks; don't pack every gap.
- **Honor due dates:** front-load work whose due date is near; flag at-risk projects.
- **Suggest, don't auto-write:** the Guide proposes plan blocks; Danielle confirms before they're added to Today (Phase 4 blocks). *(Confirm whether she wants one-tap "add this to my plan.")*
- **Energy-aware:** match "High focus" work to high-energy windows, "Low lift" to tired ones.

### 7.4 Implementation notes
- Extend the `studio-hour-guide` edge function's context builder (the system prompt already injects check-in, schedule, rituals, open work, ideas — add the structured fields above).
- Consider new intent patterns / suggestions for "plan my week" and "find time for X."
- This likely benefits from cross-session memory (currently session-level only) so the Guide remembers a plan it proposed — flag as a dependency/stretch.

### Acceptance criteria
- Asking the Guide to "plan my week" returns a coherent, energy- and due-date-aware week that respects rest and multi-session projects.
- Asking the Guide to "find time for [project/rest/leads]" returns specific open windows based on real schedule + plan data.
- Suggested blocks can be reviewed before being added to the Today plan.

---

## 8. Do NOT Implement Yet

Danielle explicitly marked these **"ignore for now."** Do not build, redesign, or remove them as part of Phases 1–5. Leave the existing implementations untouched except for trivial copy renames required by Phase 1.

- **Dashboard "Guide card" synopsis** — the Guide summary card on the Dashboard. Leave as-is.
- **"Open Work" dashboard card** — the dashboard card surfacing open work/projects. Do **not** redesign it for the new project model. (If Phase 1's rename touches its label, that's fine, but no structural changes.)
- **Bottom ritual card** — the ritual card at the bottom. Leave as-is.

> If a later phase seems to *require* touching one of these, stop and confirm with Danielle/Mark first rather than assuming.

---

## 9. Notes for Future Claude Implementation Tickets

**Process**
- **One ticket at a time.** Each phase (and within Phase 2, ideally each feature) is its own ticket. No feature creep mid-task.
- **Read the versioned Expo docs first.** Per `AGENTS.md`: read `https://docs.expo.dev/versions/v56.0.0/` before writing code. (Note: roadmap doc references the project as Expo SDK 54/56 — confirm the live SDK in `package.json` / `app.json` at ticket time.)
- **Local-first.** Phases 1–4 need no backend changes. Only Phase 5 touches the Supabase edge function.
- **Build path:** Android production-style via Gradle + adb (no Expo Go, no EAS). Do not run Gradle or install anything as part of *planning*.

**Data & migrations**
- Every model change ships with a **non-destructive, run-once migration** on load. Default new fields; never drop existing data.
- Keep storage keys stable, or explicitly copy data when a key is renamed.
- When the type `WorkItem` becomes `Project` (Phase 2) and `kind` becomes `category` (Phase 3), update **all** references (`types.ts`, screens, components, the Guide context builder) in the same ticket.

**Keep the Guide honest**
- Any time the data model gains a field that affects advice (progress, due date, multi-session, plan times, idea categories), **also** add it to the edge-function context payload and system prompt — otherwise the Guide gives advice that contradicts the UI.

**Open decisions to confirm with Danielle/Mark before/early in each ticket**
- Phase 1: rename the internal tab id `"open-work"` now, or only labels? (Recommended: labels now, id in Phase 2.)
- Phase 2: dedicated Project **detail screen** vs inline expansion? Auto vs manual progress default?
- Phase 3: where does the existing `"Voiceover"` idea kind map?
- Phase 4: normalize all schedule blocks to start/end, or keep legacy `time` for calendar blocks?
- Phase 5: one-tap "add suggested block to my plan," and is cross-session memory in scope?

**Known current touch points (verified against the repo on 2026-05-29)**
- Projects: `src/lib/types.ts` (`WorkItem`, `WorkStatus`, `WorkGroup`, `EnergyLevel`), `src/screens/OpenWorkScreen.tsx`, `src/components/work/WorkCard.tsx`, `src/components/work/AddWorkForm.tsx`.
- Ideas: `src/lib/types.ts` (`Idea`, `IdeaKind`, `Platform`, `IdeaStatus`), `src/components/ideas/{AddIdeaForm,IdeaCard,PlatformTag}.tsx`.
- Today plan: `src/lib/types.ts` (`ScheduleBlock`, `DaySchedule`, `BlockType`), `src/components/today/ScheduleCard.tsx`.
- Navigation/labels: `src/navigation/MainTabs.tsx`, `src/components/icons/TabIcons.tsx`.
- Guide: `src/screens/GuideScreen.tsx` + the `studio-hour-guide` Supabase edge function (context builder + system prompt).
- Dashboard (mostly hands-off — see §8): `src/screens/DashboardScreen.tsx`, `src/components/dashboard/SnapGrid.tsx`.

---

*This document is a plan only. No app code has been changed. Build phases as separate, confirmed tickets.*
