import { useCallback } from "react";
import { useAsyncStorage } from "./useAsyncStorage";
import { getCalendarDay, formatTime } from "../lib/dates";
import type { CheckIn } from "../lib/types";

const STORAGE_KEY = "sh-checkins";

type CheckInStore = Record<string, CheckIn>;

function blankCheckIn(date: string): CheckIn {
  return {
    date,
    time: "",
    mood: 0,
    energy: 0,
    focus: 0,
    overwhelm: 0,
    headline: "",
    completed: false,
  };
}

export function useCheckIn() {
  const today = getCalendarDay();
  const [store, setStore, isHydrated] = useAsyncStorage<CheckInStore>(
    STORAGE_KEY,
    {}
  );

  const checkIn = store[today] ?? blankCheckIn(today);

  const update = useCallback(
    (patch: Partial<CheckIn>) => {
      setStore((prev) => {
        const existing = prev[today] ?? blankCheckIn(today);
        return {
          ...prev,
          [today]: {
            ...existing,
            ...patch,
            date: today,
            time: existing.time || formatTime(),
            completed: true,
          },
        };
      });
    },
    [today, setStore]
  );

  return { checkIn, update, isHydrated, today };
}
