const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatDateLine(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${DAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function getGreeting(): { timeOfDay: string; greeting: string } {
  const h = new Date().getHours();
  if (h < 12) return { timeOfDay: "morning", greeting: "Good morning" };
  if (h < 17) return { timeOfDay: "afternoon", greeting: "Good afternoon" };
  return { timeOfDay: "evening", greeting: "Good evening" };
}

export function getCalendarDay(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTime(): string {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Turn a YYYY-MM-DD due date into a short, friendly label with a light
// relative hint ("due today", "due tomorrow", "due Jun 12", "overdue · Jun 12").
// Falls back to the raw string if it doesn't parse, so freeform text still shows.
export function formatDueDate(dueDate: string): string {
  const trimmed = dueDate.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return trimmed;
  const month = MONTHS_SHORT[Number(match[2]) - 1];
  if (!month) return trimmed;
  const label = `${month} ${Number(match[3])}`;

  // Compare calendar days at noon to avoid timezone/DST drift.
  const due = new Date(`${trimmed}T12:00:00`);
  const today = new Date(getCalendarDay() + "T12:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "due today";
  if (diffDays === 1) return "due tomorrow";
  if (diffDays < 0) return `overdue · ${label}`;
  return `due ${label}`;
}
