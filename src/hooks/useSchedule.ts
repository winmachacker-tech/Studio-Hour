import { useAsyncStorage } from "./useAsyncStorage";
import { getCalendarDay } from "../lib/dates";
import { DEFAULT_SCHEDULE } from "../lib/constants";
import type { DaySchedule } from "../lib/types";

const STORAGE_KEY = "sh-schedules";

type ScheduleStore = Record<string, DaySchedule>;

export function useSchedule() {
  const today = getCalendarDay();
  const [store, , isHydrated] = useAsyncStorage<ScheduleStore>(
    STORAGE_KEY,
    {}
  );

  const schedule = store[today] ?? { date: today, blocks: DEFAULT_SCHEDULE };

  return { blocks: schedule.blocks, isHydrated };
}
