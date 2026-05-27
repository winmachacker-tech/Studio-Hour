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

export interface GuideMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface GuideSession {
  id: string;
  startedAt: string;
  messages: GuideMessage[];
  summary?: string;
}
