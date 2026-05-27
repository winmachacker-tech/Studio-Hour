import type {
  ScheduleBlock, Ritual, WorkItem, Idea,
  DueItem, MuralLead, SpecialProject,
} from "./types";

export const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  {
    id: "settle",
    time: "9:00",
    title: "Settle in.",
    meta: "coffee · sketchbook · the slow start",
    type: "now",
  },
  {
    id: "art",
    time: "10:00",
    title: "Protected art time",
    meta: "cobalt mural · no admin · no calls",
    type: "protected",
  },
  {
    id: "lunch",
    time: "1:00",
    title: "Lunch & the paint pickup.",
    meta: "walk · Blick on Pine for cobalt + alizarin",
    type: "normal",
  },
  {
    id: "spa",
    time: "2:30",
    title: "Spa — closing shift.",
    meta: "in by 2:45 · out by 5:45",
    type: "normal",
  },
  {
    id: "kids",
    time: "4:00",
    title: "Kids home.",
    meta: "creative brain rests · admin only if you must",
    type: "soft-block",
  },
];

export const DEFAULT_RITUALS: Ritual[] = [
  { id: "pages", text: "Morning pages — three.", done: false },
  { id: "walk", text: "A short studio walk.", done: false },
  { id: "phone", text: "Phone in the other room after 9:30.", done: false },
  { id: "lunch", text: "One real lunch, no plate over the sink.", done: false },
];

export const SEED_WORK_ITEMS: WorkItem[] = [
  {
    id: "cobalt-mural",
    project: "Cobalt Café · 14th Ave",
    title: "Cobalt mural — figure sketch.",
    status: "In Progress",
    energy: "High focus",
    note: "Picked up after last Friday. About 40% there.",
    group: "Murals",
    createdAt: "2026-05-20T10:00:00Z",
    updatedAt: "2026-05-23T10:00:00Z",
  },
  {
    id: "tote-art",
    project: "Spring tote · botanical",
    title: "Send the final art file to the printer.",
    status: "Ready",
    energy: "High focus",
    note: "Print run is waiting on the flat file. ~2 hours.",
    group: "Design",
    createdAt: "2026-05-18T10:00:00Z",
    updatedAt: "2026-05-22T10:00:00Z",
  },
  {
    id: "maya-lead",
    project: "Lead · Maya at Westside",
    title: "Reply to Maya about the coffee shop wall.",
    status: "Needs Follow-Up",
    energy: "Medium energy",
    note: "Six days since she wrote. A short, warm note today is plenty.",
    group: "Leads",
    createdAt: "2026-05-19T10:00:00Z",
    updatedAt: "2026-05-20T10:00:00Z",
  },
  {
    id: "workshop-deck",
    project: "Sat · Intro to gouache",
    title: "Finish the workshop deck.",
    status: "In Progress",
    energy: "Medium energy",
    note: "8 of 12 slides drafted. The rest can wait until Wednesday.",
    group: "Design",
    createdAt: "2026-05-17T10:00:00Z",
    updatedAt: "2026-05-24T10:00:00Z",
  },
];

export const SEED_IDEAS: Idea[] = [
  {
    id: "cobalt-mix",
    platform: "tiktok",
    title: "“How I mix the cobalt.” — slow pour, voiceover.",
    status: "draft",
    note: "pairs well with low-energy days",
    kind: "Voiceover",
    createdAt: "2026-05-22T10:00:00Z",
    updatedAt: "2026-05-22T10:00:00Z",
  },
  {
    id: "wall-carousel",
    platform: "instagram",
    title: "Carousel: the wall before, sketched, painted.",
    status: "saved",
    note: "use last Tuesday’s photos",
    kind: "Posts",
    createdAt: "2026-05-21T10:00:00Z",
    updatedAt: "2026-05-21T10:00:00Z",
  },
  {
    id: "lavender-cobalt-series",
    platform: "artwork",
    title: "Series: small interiors in lavender + cobalt.",
    status: "saved",
    note: "three studies sketched · expand to eight",
    kind: "Artwork",
    createdAt: "2026-05-20T10:00:00Z",
    updatedAt: "2026-05-20T10:00:00Z",
  },
  {
    id: "mural-day-longform",
    platform: "facebook",
    title: "Long-form: what a mural day actually feels like.",
    status: "draft",
    note: "good for a Sunday post",
    kind: "Posts",
    createdAt: "2026-05-19T10:00:00Z",
    updatedAt: "2026-05-19T10:00:00Z",
  },
  {
    id: "open-studio-tea",
    platform: "nextdoor",
    title: "Open studio Saturday tea — three slots.",
    status: "saved",
    note: "tie to the spring tote launch",
    kind: "Posts",
    createdAt: "2026-05-18T10:00:00Z",
    updatedAt: "2026-05-18T10:00:00Z",
  },
  {
    id: "wildflower-tote",
    platform: "artwork",
    title: "Tote — wildflower edition for summer.",
    status: "saved",
    note: "",
    kind: "Artwork",
    createdAt: "2026-05-17T10:00:00Z",
    updatedAt: "2026-05-17T10:00:00Z",
  },
];

export const SEED_DUE_ITEMS: DueItem[] = [
  { title: "Tote art file", deadline: "Printer · Thu" },
  { title: "Workshop materials list", deadline: "Students · Fri" },
  { title: "Nora's portrait — first pass", deadline: "Sun" },
];

export const SEED_MURAL_LEADS: MuralLead[] = [
  {
    id: "maya-westside",
    name: "Maya · Westside coffee.",
    description: "Six days since reply. A short, warm note today is plenty.",
    status: "Needs Follow-Up",
  },
  {
    id: "bryant-park",
    name: "Bryant Park library wing.",
    description: "Proposal packet sent Monday. Quiet for now.",
    status: "In Progress",
  },
  {
    id: "olive-vine",
    name: "Olive & Vine restaurant.",
    description: "Asked for a quote Saturday — reply by Wednesday.",
    status: "In Progress",
  },
];

export const SEED_SPECIAL_PROJECTS: SpecialProject[] = [
  {
    id: "solo-show",
    tag: "solo show",
    title: "August · Bay 3.",
    description: "12 of 18 pieces resolved.",
    progress: 66,
    progressColor: "gold",
  },
  {
    id: "field-notes",
    tag: "book",
    tagColor: "#119999",
    title: "Field notes · vol. 2.",
    description: "Cover ideas saved in the drawer.",
    progress: 20,
    progressColor: "teal",
  },
];
