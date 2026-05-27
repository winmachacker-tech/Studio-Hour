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
