import { useCallback } from "react";
import { useAsyncStorage } from "./useAsyncStorage";
import { SEED_WORK_ITEMS } from "../lib/constants";
import type { WorkItem, WorkStatus } from "../lib/types";

const STORAGE_KEY = "sh-work-items";

const STATUS_CYCLE: WorkStatus[] = [
  "Ready",
  "In Progress",
  "Needs Follow-Up",
  "Waiting",
  "Done",
];

export function useTasks() {
  const [items, setItems, isHydrated] = useAsyncStorage<WorkItem[]>(
    STORAGE_KEY,
    SEED_WORK_ITEMS
  );

  const toggleDone = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            status: item.status === "Done" ? "Ready" : ("Done" as WorkStatus),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [setItems]
  );

  const cycleStatus = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const currentIdx = STATUS_CYCLE.indexOf(item.status);
          const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length;
          return {
            ...item,
            status: STATUS_CYCLE[nextIdx],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [setItems]
  );

  const activeCount = items.filter((i) => i.status !== "Done").length;

  return { items, toggleDone, cycleStatus, activeCount, isHydrated };
}
