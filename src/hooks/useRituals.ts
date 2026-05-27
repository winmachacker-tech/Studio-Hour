"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useCalendarDay } from "./useCalendarDay";
import type { RitualSet, Ritual } from "@/lib/types";

const STORAGE_KEY = "sh-rituals";

type RitualStore = Record<string, RitualSet>;

const DEFAULT_RITUALS: Ritual[] = [
  { id: "pages", text: "Morning pages — three.", done: false },
  { id: "walk", text: "A short studio walk.", done: false },
  { id: "phone", text: "Phone in the other room after 9:30.", done: false },
  { id: "lunch", text: "One real lunch, no plate over the sink.", done: false },
];

export function useRituals() {
  const today = useCalendarDay();
  const [store, setStore, isHydrated] = useLocalStorage<RitualStore>(
    STORAGE_KEY,
    {}
  );

  const ritualSet = store[today] ?? { date: today, rituals: DEFAULT_RITUALS };
  const rituals = ritualSet.rituals;
  const doneCount = rituals.filter((r) => r.done).length;

  const toggle = useCallback(
    (id: string) => {
      setStore((prev) => {
        const existing = prev[today] ?? {
          date: today,
          rituals: DEFAULT_RITUALS,
        };
        return {
          ...prev,
          [today]: {
            ...existing,
            rituals: existing.rituals.map((r) =>
              r.id === id ? { ...r, done: !r.done } : r
            ),
          },
        };
      });
    },
    [today, setStore]
  );

  return { rituals, doneCount, total: rituals.length, toggle, isHydrated };
}
