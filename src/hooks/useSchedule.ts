import { useState, useEffect, useCallback } from "react";
import { useAsyncStorage } from "./useAsyncStorage";
import { getCalendarDay } from "../lib/dates";
import { DEFAULT_SCHEDULE } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { onCalendarSyncRequest } from "../lib/calendar/syncSignal";
import type { DaySchedule, ScheduleBlock } from "../lib/types";

const STORAGE_KEY = "sh-schedules";

type ScheduleStore = Record<string, DaySchedule>;
type ScheduleSource = "default" | "local" | "google";

export function useSchedule() {
  const today = getCalendarDay();
  const [store, , isHydrated] = useAsyncStorage<ScheduleStore>(
    STORAGE_KEY,
    {}
  );

  const [calendarBlocks, setCalendarBlocks] = useState<ScheduleBlock[] | null>(
    null
  );
  const [source, setSource] = useState<ScheduleSource>("default");
  const [fetchKey, setFetchKey] = useState(0);

  const localSchedule = store[today] ?? { date: today, blocks: DEFAULT_SCHEDULE };
  const localSource: ScheduleSource = store[today] ? "local" : "default";

  const fetchCalendar = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data, error } = await supabase.functions.invoke(
        "calendar-sync",
        { body: { date: today } }
      );

      if (
        !error &&
        data?.connected === true &&
        Array.isArray(data.blocks) &&
        !data.error
      ) {
        setCalendarBlocks(data.blocks as ScheduleBlock[]);
        setSource("google");
      }
    } catch {
      // Silent failure — keep fallback schedule.
    }
  }, [today]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar, fetchKey]);

  useEffect(() => {
    return onCalendarSyncRequest(() => setFetchKey((k) => k + 1));
  }, []);

  const blocks = calendarBlocks ?? localSchedule.blocks;
  const activeSource = calendarBlocks !== null ? "google" : localSource;

  return { blocks, source: activeSource, isHydrated };
}
