export type TabId = "today" | "open-work" | "dashboard" | "ideas" | "guide";

export interface CheckIn {
  date: string;
  time: string;
  mood: number;
  energy: number;
  focus: number;
  overwhelm: number;
  headline: string;
  completed: boolean;
}

export interface Ritual {
  id: string;
  text: string;
  done: boolean;
}

export interface RitualSet {
  date: string;
  rituals: Ritual[];
}

export type BlockType = "normal" | "now" | "protected" | "soft-block";

export interface ScheduleBlock {
  id: string;
  time: string;
  title: string;
  meta: string;
  type: BlockType;
}

export interface DaySchedule {
  date: string;
  blocks: ScheduleBlock[];
}

export type WorkStatus =
  | "Ready"
  | "In Progress"
  | "Waiting"
  | "Needs Follow-Up"
  | "Done";

export type WorkGroup = "Murals" | "Studio art" | "Design" | "Leads";
export type EnergyLevel = "High focus" | "Medium energy" | "Low lift";

// ── Phase 2: Open Projects model (additive, backward-compatible) ──────
// A WorkItem is treated as the project entity for this phase. The fields
// below are all optional so existing persisted items keep loading; the
// normalizer in useTasks fills safe defaults on hydration.

// How a project's progress value is determined.
//   "auto"   → derived from subtask completion
//   "manual" → set directly by the user (e.g. a slider)
export type ProgressMode = "auto" | "manual";

// Current schema version for persisted WorkItems. Bump when the shape
// changes so the normalizer can no-op on already-migrated data.
export const WORK_ITEM_SCHEMA_VERSION = 2;

// A sub-point within a project.
export interface ProjectSubtask {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

// A logged win / progress note on a project.
export interface ProjectAccomplishment {
  id: string;
  text: string;
  date: string; // ISO timestamp
}

export interface WorkItem {
  id: string;
  project: string;
  title: string;
  status: WorkStatus;
  energy: EnergyLevel;
  note: string;
  group: WorkGroup;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;

  // ── Phase 2 additions (all optional; defaulted by the normalizer) ──
  subtasks?: ProjectSubtask[];
  accomplishments?: ProjectAccomplishment[];
  progress?: number; // 0–100
  progressMode?: ProgressMode;
  isMultiSession?: boolean;
  goal?: string;
  schemaVersion?: number;
}

export type Platform =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "nextdoor"
  | "artwork";

export type IdeaStatus = "saved" | "draft" | "used";
export type IdeaKind = "Posts" | "Artwork" | "Voiceover";

export interface Idea {
  id: string;
  platform: Platform;
  title: string;
  status: IdeaStatus;
  note: string;
  kind: IdeaKind;
  createdAt: string;
  updatedAt: string;
}

export interface DueItem {
  title: string;
  deadline: string;
}

export interface MuralLead {
  id: string;
  name: string;
  description: string;
  status: WorkStatus;
}

export interface SpecialProject {
  id: string;
  tag: string;
  tagColor?: string;
  title: string;
  description: string;
  progress: number;
  progressColor?: "gold" | "teal";
}

// ── Calendar integration (type-only, not wired yet) ──────────────────

export type CalendarProvider = "google";

export type CalendarConnectionStatus =
  | "not_connected"
  | "connected"
  | "reauth_needed";

export type CalendarEventSource = "google_calendar" | "default";

export interface CalendarSyncResult {
  connected: boolean;
  blocks: ScheduleBlock[];
  source: CalendarEventSource;
  error?: "reauth_needed" | "fetch_failed";
}
