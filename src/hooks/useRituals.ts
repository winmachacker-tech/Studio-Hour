import { useCallback } from "react";
import { useAsyncStorage } from "./useAsyncStorage";
import { getCalendarDay } from "../lib/dates";
import { DEFAULT_RITUALS } from "../lib/constants";
import type { RitualSet } from "../lib/types";

const STORAGE_KEY = "sh-rituals";

type RitualStore = Record<string, RitualSet>;

export function useRituals() {
  const today = getCalendarDay();
  const [store, setStore, isHydrated] = useAsyncStorage<RitualStore>(
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
