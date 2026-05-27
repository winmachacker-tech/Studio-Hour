"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useCalendarDay } from "./useCalendarDay";
import type { CheckIn } from "@/lib/types";

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

function formatTime(): string {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function useCheckIn() {
  const today = useCalendarDay();
  const [store, setStore, isHydrated] = useLocalStorage<CheckInStore>(
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
