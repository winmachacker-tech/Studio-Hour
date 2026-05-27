"use client";

import { useLocalStorage } from "./useLocalStorage";
import { useCalendarDay } from "./useCalendarDay";
import type { DaySchedule, ScheduleBlock } from "@/lib/types";

const STORAGE_KEY = "sh-schedules";

type ScheduleStore = Record<string, DaySchedule>;

const DEFAULT_BLOCKS: ScheduleBlock[] = [
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

export function useSchedule() {
  const today = useCalendarDay();
  const [store, , isHydrated] = useLocalStorage<ScheduleStore>(
    STORAGE_KEY,
    {}
  );

  const schedule = store[today] ?? { date: today, blocks: DEFAULT_BLOCKS };

  return { blocks: schedule.blocks, isHydrated };
}
