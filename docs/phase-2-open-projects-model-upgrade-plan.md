# Phase 2 — Open Projects Model Upgrade — Implementation Plan

Last updated: 2026-05-29
Status: **Planning only. No code written.** This document drives the Phase 2 tickets defined in `docs/danielle-studio-hour-feedback-todo.md`.

Phase 1 (rename "Open Work" → "Open Projects" in user-facing copy) is **complete**. Internal identifiers (`WorkItem`, the `"open-work"` TabId, the `"Open Work"` route name, the `sh-work-items` storage key, the `openWorkItems` payload field) were intentionally left unchanged and remain so.

**Goal of Phase 2:** evolve a project from a flat single-shot task into something that can span multiple sessions and carry structure — subtasks, progress, due dates, goals, and accomplishments — and make the Guide understand that some projects take many short sittings to finish.

---

## 1. Current-State Findings

### 1.1 The data model (`src/lib/types.ts:40–60`)
```ts
export type WorkStatus = "Ready" | "In Progress" | "Waiting" | "Needs Follow-Up" | "Done";
export type WorkGroup  = "Murals" | "Studio art" | "Design" | "Leads";
export type EnergyLevel = "High focus" | "Medium energy" | "Low lift";

export interface WorkItem {
  id: string;
  project: string;      // free-text "project or client" label, shown as the card eyebrow
  title: string;        // the actual task line
  status: WorkStatus;
  energy: EnergyLevel;
  note: string;         // "next small move"
  group: WorkGroup;
  dueDate?: string;     // ALREADY on the type — but currently unused everywhere (see 1.7)
  createdAt: string;
  updatedAt: string;
}
```

**Important nuance:** `project` is just a free-text label (e.g. "Cobalt mural", "Maria — tote line"). The current model has **no concept of a project entity** — each `WorkItem` is one task that happens to carry a project name. Phase 2's "projects with subtasks" means we are promoting today's `WorkItem` (the task) into the project itself, with subtasks nested underneath. Worth confirming this framing with Mark (see Open Decisions).

### 1.2 Open Projects screen & data flow (`src/screens/OpenWorkScreen.tsx`)
- Pulls everything from the `useTasks()` hook.
- Renders a filter row (All / Murals / Studio art / Design / Leads → filters on `group`), an optional `AddWorkForm`, and a list of `WorkCard`s.
- A FAB ("＋ add project") toggles the add form.
- Empty state ("No open projects yet.") shows when hydrated and the list is empty.
- No detail view exists — a card is the only surface for a project. There is no place today to expand a project, see subtasks, or edit fields after creation. **Tapping the title toggles Done; tapping the status chip cycles status.** That's the entire interaction model.

### 1.3 Card & form
- `WorkCard.tsx` displays: project eyebrow, title (tap → toggle done), note, a `StatusChip` (tap → cycle), and an `EnergyChip`. No progress, no due date, no subtasks. `dueDate` is not rendered.
- `AddWorkForm.tsx` collects: title, project, group, energy, note. It does **not** collect `dueDate` even though the field exists on the type. No subtask / goal / progress inputs.

### 1.4 Persistence (`src/hooks/useAsyncStorage.ts` + `src/hooks/useTasks.ts`)
- `useTasks` stores `WorkItem[]` under AsyncStorage key **`sh-work-items`** via the generic `useAsyncStorage<T>` hook.
- `useAsyncStorage` reads with `JSON.parse(stored) as T` — **no schema validation, no versioning, no field defaulting.** Whatever was persisted is trusted as-is and cast to the type.
- It keeps a process-wide `memCache` + listener set so multiple consumers of the same key stay in sync. Writes go to both the cache and AsyncStorage.
- `useTasks` mutations: `addWorkItem` (prepends, sets id `work-…`, `createdAt`/`updatedAt`, default status "Ready"), `toggleDone` (Done ↔ Ready), `cycleStatus` (rotates through `STATUS_CYCLE`). All bump `updatedAt`.
- `SEED_WORK_ITEMS` is now **`[]`** (`src/lib/constants.ts:10`) — seed data was removed in a prior commit, so a fresh install starts empty.

### 1.5 Who consumes `WorkItem` (full list)
| Location | Reads | Phase-2 impact |
|---|---|---|
| `src/hooks/useTasks.ts` | all fields, mutates | **Primary** — owns create/update logic |
| `src/screens/OpenWorkScreen.tsx` | list, filter by `group` | Add detail nav + new fields in form |
| `src/components/work/WorkCard.tsx` | project, title, note, status, energy | Add progress bar, due chip, subtask count, multi-session badge |
| `src/components/work/AddWorkForm.tsx` | title, project, group, energy, note | Add due date, goal, multi-session toggle, (optional) initial subtasks |
| `src/components/today/SuggestedFocus.tsx` | status, title, note | Could use progress/multi-session later; **leave logic alone in P2** unless trivial |
| `src/components/dashboard/SnapGrid.tsx` (`workSnap`) | status counts | **Do NOT touch** — dashboard card is out of scope (see §9) |
| `src/screens/GuideScreen.tsx` (`buildContext`) | title, status, energy, group | Add progress, dueDate, subtasks summary, multi-session flag to payload |
| `supabase/functions/studio-hour-guide/index.ts` (`GuideContext.openWorkItems`) | title, status, energy | Mirror payload additions + system-prompt guidance |
| `src/lib/constants.ts` | type only (`SEED_WORK_ITEMS`) | No-op (empty array) |

### 1.6 Guide context flow (current)
- `GuideScreen.buildContext()` (`src/screens/GuideScreen.tsx:61`) filters out Done items and maps each to `{ title, status, energy, group }`, under the key **`openWorkItems`**.
- The edge function (`GuideContext.openWorkItems`, `index.ts:63`) takes the first 6 and renders: `Open projects: "Title" (Status, Energy); …`.
- The system prompt (`index.ts`) already references "Projects, ideas, and rituals" and tells the Guide to plan around fixed calendar blocks. It has **no instruction about multi-session projects, progress, or due dates** yet.

### 1.7 Latent / unused field
- `dueDate?: string` already exists on `WorkItem` but is **wired to nothing** — not collected, not displayed, not sent to the Guide. Phase 2 can adopt it directly with zero migration cost (it's already optional).

### 1.8 Date helpers (`src/lib/dates.ts`)
- Exports `formatDateLine`, `getGreeting`, `getCalendarDay`, `formatTime`. **No relative-date / "due in N days" / countdown helper exists** — one will need to be added for due-date display.

---

## 2. Recommended Data Model Shape

Additive and backward-compatible. All new fields are optional or default-filled on migration so old persisted records keep working.

```ts
// NEW — a sub-point within a project
export interface Subtask {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

// NEW — a logged win / progress note
export interface Accomplishment {
  id: string;
  text: string;
  date: string;        // ISO timestamp
}

export type ProgressMode = "manual" | "auto";   // auto = derived from subtasks

export interface WorkItem {
  // ── existing (unchanged) ──
  id: string;
  project: string;
  title: string;
  status: WorkStatus;
  energy: EnergyLevel;
  note: string;
  group: WorkGroup;
  createdAt: string;
  updatedAt: string;

  // ── existing but newly adopted ──
  dueDate?: string;                    // already on type; wire it up

  // ── NEW (all optional / defaulted) ──
  subtasks?: Subtask[];                // default []
  progress?: number;                   // 0–100, default 0
  progressMode?: ProgressMode;         // default "auto" if subtasks exist, else "manual"
  isMultiSession?: boolean;            // default false
  goal?: string;                       // "what done looks like"
  accomplishments?: Accomplishment[];  // default []
  schemaVersion?: number;              // NEW — see migration strategy (§3)
}
```

**Why optional, not required:** the persistence layer casts stored JSON straight to the type with no defaulting (§1.4). If we made these required, every existing stored record would be structurally invalid at runtime and any `item.subtasks.length` access would throw. Optional + a normalization pass (next section) is the safe path.

**Progress derivation rule (recommended):**
- If `progressMode === "auto"` and `subtasks.length > 0` → `progress = round(doneSubtasks / totalSubtasks * 100)`.
- If `progressMode === "manual"` → `progress` is whatever the slider set, untouched by subtask changes.
- Default new projects to `auto`; flip to `manual` automatically the moment the user drags the slider (and offer a way back). Confirm this UX with Mark.

---

## 3. Migration / Backward-Compatibility Strategy

The risk is entirely on the **read path**: existing installs have `WorkItem[]` in `sh-work-items` written under the old shape (no `subtasks`, etc.). We must normalize on load.

### 3.1 Recommended approach — a one-time normalizer in `useTasks`
Rather than change `useAsyncStorage` (generic, shared by check-ins, ideas, rituals, schedule), add a **project-specific normalization step in `useTasks`** that runs over hydrated items and fills defaults:

```
normalizeWorkItem(raw) -> WorkItem {
  subtasks:        raw.subtasks ?? [],
  progress:        raw.progress ?? 0,
  progressMode:    raw.progressMode ?? (raw.subtasks?.length ? "auto" : "manual"),
  isMultiSession:  raw.isMultiSession ?? false,
  accomplishments: raw.accomplishments ?? [],
  schemaVersion:   2,
  ...raw
}
```

- Run it once after `isHydrated` flips true, then write the normalized array back to storage so the upgrade is persisted (idempotent — guarded by `schemaVersion`).
- Keep it **non-destructive**: never drop unknown fields, never reset existing values.

### 3.2 Why a `schemaVersion` field
- Lets the normalizer no-op on already-migrated data (`if schemaVersion >= 2 skip`).
- Gives future phases (categories, plan blocks) a clean hook for their own migrations.
- Cheap to add now; expensive to retrofit later.

### 3.3 Storage key
- **Keep `sh-work-items`.** Renaming the key would orphan existing data and force a copy migration for no benefit. The key is internal and not user-facing.

### 3.4 Defensive reads everywhere
- Even with normalization, all consumers should read new array fields defensively (`item.subtasks ?? []`) for the first release, in case a record slips through (e.g. written by an older app version after downgrade). Cheap insurance.

### 3.5 Edge cases to cover in the migration ticket
- Empty store (fresh install) → nothing to migrate; `SEED_WORK_ITEMS` is `[]`.
- Partial records (some fields present, some not) → fill only the missing ones.
- A project marked `Done` before Phase 2 → `progress` should arguably show 100; decide whether the normalizer infers `progress = status === "Done" ? 100 : 0`. **Recommend yes** for nicer first-render, but flag as a decision.

---

## 4. UI Plan

### 4.1 New: Project detail view
The current card-only model has nowhere to put subtasks, a slider, goal text, or an accomplishments log without overcrowding the list. Recommend a **dedicated detail view** (modal or pushed screen) opened by tapping a card.

- Tapping the card body → open detail (today it toggles Done; that interaction moves to an explicit checkbox/affordance on the card — call this out, it's a behavior change).
- Detail contains: title/project (editable), status, energy, **due date picker**, **goal field**, **subtask list** (add/check/edit/reorder/delete), **progress slider** (with auto/manual indicator), **accomplishments log** (append-only with timestamps), and a multi-session toggle.

### 4.2 Card upgrades (`WorkCard.tsx`)
- Progress bar / percentage (only when `subtasks.length > 0` or `progress > 0`).
- Subtask count chip ("3 of 7").
- Due-date chip with relative copy ("due in 4 days", "due today", "overdue") — needs a new `dates.ts` helper.
- Small "ongoing" / multi-session badge when `isMultiSession`.
- Keep the calm visual language; don't let the card become a dashboard. Progressive disclosure: summary on the card, full editing in detail.

### 4.3 Add form (`AddWorkForm.tsx`)
- Add: due date (optional), goal (optional), multi-session toggle, and optionally a quick "add a few subtasks" affordance.
- Keep it lightweight — none of the new fields should be required. A title-only quick capture must still work exactly as today.

### 4.4 Slider component
- No slider primitive exists in `src/components/shared/`. Either add `@react-native-community/slider` (an **install** — out of scope for planning; needs Mark's go-ahead) or build a simple tap/drag progress control. **Recommend** evaluating a custom lightweight control first to avoid a new native dependency. Flag as a decision.

### 4.5 Today screen (`SuggestedFocus.tsx`)
- Out of scope to redesign in Phase 2. It may *optionally* gain awareness of multi-session/progress later, but leave its logic alone unless a change is trivial and additive.

---

## 5. Guide / Claude Context Plan

### 5.1 Payload additions (`GuideScreen.buildContext`)
Extend each `openWorkItems` entry with the new signal (keeping the `openWorkItems` key name):
```ts
openWorkItems: workItems.filter(w => w.status !== "Done").map(w => ({
  title: w.title,
  status: w.status,
  energy: w.energy,
  group: w.group,
  progress: w.progress ?? 0,
  dueDate: w.dueDate,                          // optional
  isMultiSession: w.isMultiSession ?? false,
  subtasks: (w.subtasks ?? []).map(s => ({ text: s.text, done: s.done })),
  nextSubtask: (w.subtasks ?? []).find(s => !s.done)?.text,   // the next small move
  goal: w.goal,
}))
```

### 5.2 Edge function (`GuideContext` + render)
- Extend the `openWorkItems` interface to match.
- Update the `Open projects:` render line to include progress / due / next-subtask, e.g.:
  `"Cobalt mural" (In Progress, 40%, due in 4 days, next: "prime the wall", ongoing)`.
- Keep the 6-item slice (or revisit the cap; flag).

### 5.3 System-prompt guidance (the "multi-session" requirement)
Add explicit instruction so the Guide stops implying everything finishes today:
- *"Projects can take many short sessions across days or weeks. When a project is marked ongoing or has subtasks, suggest the next single increment (the next unchecked subtask), not the whole project. Celebrate incremental progress."*
- *"Honor due dates: gently flag what's near or overdue; never invent deadlines the context doesn't state."*
- *"Match work to energy: high-focus work for high-energy windows, low-lift for tired days."*

### 5.4 Sequencing note
Payload and edge-function changes should ship **together** (client sends new fields; server reads them). The client can send extra fields safely before the server reads them, but the *value* only lands once both are deployed. Note the edge function is a separate deploy (`supabase functions deploy`) — call this out in the ticket; **do not deploy as part of planning.**

---

## 6. Risks

1. **Runtime crashes from un-normalized old data.** Highest risk. Mitigated by the §3 normalizer + defensive `?? []` reads. Must land in the *first* Phase 2 ticket, before any UI reads new fields.
2. **Behavior change: tap-to-toggle-Done.** Moving the card's primary tap from "toggle done" to "open detail" changes muscle memory. Needs a clear Done affordance and Mark's sign-off.
3. **New native dependency (slider).** Installing `@react-native-community/slider` touches the native build (Gradle/Pods) and is an install — explicitly out of scope until approved. A custom control avoids this.
4. **Scope creep into Today / Dashboard.** `SuggestedFocus` and `SnapGrid` both read `WorkItem`. Easy to "improve while we're here" — resist. Dashboard card is explicitly out of scope (§9).
5. **Progress source-of-truth ambiguity.** Auto vs manual progress can confuse if the rules aren't crisp. Pin the derivation rule (§2) before building the slider.
6. **Guide saying too much.** Adding subtasks/goals to the payload risks verbose or presumptuous responses. The "reference gently / next increment only" prompt guidance is the guardrail.
7. **`project` vs project-entity confusion.** Because `project` is just a label today, "projects with subtasks" is really "tasks promoted to projects." If Mark actually wants a true parent-project grouping multiple tasks, that's a bigger model change — clarify early (Open Decisions).
8. **AsyncStorage write-back loop.** The normalizer writes migrated data back; ensure it's guarded by `schemaVersion` so it doesn't rewrite on every mount and thrash storage.

---

## 7. Open Decisions for Mark

1. **Project framing.** Is each existing card a project (promote task → project + subtasks), or do you want a new parent "Project" that groups several task cards? *(Recommendation: promote the existing item — smallest change, matches your feedback wording.)*
2. **Internal rename.** Keep `WorkItem` for now, or rename to `Project`/`ProjectItem` this phase? *(Recommendation: keep `WorkItem` in Phase 2; do a dedicated mechanical rename later — see §8.)*
3. **Progress control.** Custom lightweight slider (no install) vs `@react-native-community/slider` (native dependency, needs build)? *(Recommendation: custom first.)*
4. **Progress default mode.** Auto-from-subtasks by default, flipping to manual on first drag — acceptable?
5. **Done → 100% inference.** Should the migration set `progress = 100` for already-Done projects?
6. **Card tap behavior.** OK to change card tap from "toggle Done" to "open detail," with a separate Done control?
7. **Detail surface.** Modal sheet vs pushed screen for the project detail view?
8. **Guide verbosity.** How much project detail should the Guide receive — full subtask list, or just `nextSubtask` + counts? *(Recommendation: counts + next subtask, to keep it concise.)*

---

## 8. Should we keep `WorkItem` or rename to `ProjectItem`?

**Recommendation: keep `WorkItem` (and `useTasks`, `sh-work-items`, `openWorkItems`) for Phase 2. Defer any rename to a separate, dedicated ticket after Phase 2 ships.**

Reasoning:
- Phase 1 deliberately separated *user-facing copy* from *internal identifiers*; Phase 2 is a **semantic model change** (adding structure). Mixing a large mechanical rename into the same diff makes review harder and raises the chance of breakage.
- A rename touches ~10 files (every consumer in §1.5) plus the storage key and payload key. As its own ticket it's a clean, low-risk, mechanical sweep with a focused diff.
- Optional bridge if the naming friction bites mid-phase: add `export type Project = WorkItem;` as an alias and use `Project` in *new* code only, without touching existing references. Lets new components read naturally while deferring the full sweep.
- The storage key (`sh-work-items`) and payload key (`openWorkItems`) should be renamed only with a migration/contract update — another reason to isolate it.

---

## 9. Out of Scope (explicitly NOT in Phase 2)

- **Idea categories / subcategories** (Phase 3) — no changes to `Idea`, `IdeaKind`, ideas screen/components.
- **Today plan manual time blocks** (Phase 4) — no changes to `ScheduleBlock`/`DaySchedule`/`ScheduleCard`.
- **Claude weekly planning / find-timeslots** (Phase 5) — only the *context payload* additions above; no new planning features.
- **Dashboard items marked "Do NOT implement yet"** — the Dashboard "Open Projects" snap card (`SnapGrid.workSnap`), the Guide synopsis card, and the bottom ritual card. Do not restructure them. (A trivial label already handled in Phase 1; nothing further.)
- **Internal rename** of `WorkItem` / routes / storage keys (deferred — §8).
- **Installing new dependencies** (e.g. a slider package) — requires explicit approval; default to a no-install approach.
- **Redesigning `SuggestedFocus`** (Today screen) — leave its logic as-is.
- **Deploying the edge function** — code change planned, deploy is a separate approved step.

---

## 10. Proposed Implementation Tickets (in order)

Each ticket is independently shippable and ordered so nothing reads a field before it's safely defaulted. One ticket at a time.

**Ticket 2.0 — Model + migration foundation (no UI)**
- Add `Subtask`, `Accomplishment`, `ProgressMode`, and the new optional `WorkItem` fields + `schemaVersion` to `types.ts`.
- Add the normalizer in `useTasks` (default-fill, write-back once, guarded by `schemaVersion`).
- Add defensive `?? []` reads where arrays are accessed.
- Add a `dates.ts` relative-due helper ("due in N days" / "today" / "overdue").
- **Acceptance:** existing data loads and is upgraded without loss; `tsc` clean; no visual change yet.

**Ticket 2.1 — Subtasks (data + minimal UI)**
- `useTasks` mutations: add/toggle/edit/delete/reorder subtask.
- Show subtask count on the card; basic subtask list (in detail view or inline). Auto-progress derivation when `progressMode === "auto"`.
- **Acceptance:** can add and check subtasks; count and derived progress update.

**Ticket 2.2 — Project detail view**
- New detail surface (modal or screen) opened from a card; move editing here.
- Introduce explicit Done affordance; repoint card tap to open detail.
- **Acceptance:** can open a project, edit fields, return to list with changes persisted.

**Ticket 2.3 — Progress slider**
- Progress control (custom unless slider package approved); manual/auto handling; card progress bar.
- **Acceptance:** dragging sets manual progress; subtasks drive auto progress; persists.

**Ticket 2.4 — Due dates**
- Wire existing `dueDate`: picker in add form + detail; relative chip on card.
- **Acceptance:** can set/clear a due date; card shows relative copy.

**Ticket 2.5 — Goals + accomplishments**
- Goal field (add form + detail); append-only accomplishments log with timestamps.
- **Acceptance:** can set a goal and log wins; both persist and display.

**Ticket 2.6 — Guide context + multi-session intelligence**
- Add `isMultiSession` toggle (form + detail) and badge.
- Extend `buildContext` payload and the edge-function `GuideContext` + render line.
- Add system-prompt guidance (multi-session = suggest next increment; honor due dates; energy-match).
- **Acceptance:** Guide references progress/due/next-subtask and never tells her to finish a multi-session project in one block. (Edge-function deploy is a separate approved step.)

> Tickets 2.3, 2.4, 2.5 are independent of each other and can be reordered by appetite. 2.0 must come first; 2.6 should come after the fields it reports on exist (2.1–2.5).

---

*Plan only. No app code changed, nothing installed, built, or deployed.*
