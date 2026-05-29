import { useCallback, useEffect, useMemo } from "react";
import { useAsyncStorage } from "./useAsyncStorage";
import { SEED_WORK_ITEMS } from "../lib/constants";
import {
  WORK_ITEM_SCHEMA_VERSION,
  type WorkItem,
  type WorkStatus,
} from "../lib/types";

const STORAGE_KEY = "sh-work-items";

const STATUS_CYCLE: WorkStatus[] = [
  "Ready",
  "In Progress",
  "Needs Follow-Up",
  "Waiting",
  "Done",
];

// Backfill Phase 2 fields on items persisted under an older shape. Purely
// additive and non-destructive: existing values are never overwritten and
// unknown fields are preserved. Idempotent — items already at the current
// schema version are returned untouched (same reference), so re-running
// this never thrashes storage.
function normalizeWorkItem(item: WorkItem): WorkItem {
  if (item.schemaVersion === WORK_ITEM_SCHEMA_VERSION) return item;
  const subtasks = item.subtasks ?? [];
  return {
    ...item,
    subtasks,
    accomplishments: item.accomplishments ?? [],
    progress: item.progress ?? 0,
    progressMode:
      item.progressMode ?? (subtasks.length > 0 ? "auto" : "manual"),
    isMultiSession: item.isMultiSession ?? false,
    schemaVersion: WORK_ITEM_SCHEMA_VERSION,
  };
}

export function useTasks() {
  const [items, setItems, isHydrated] = useAsyncStorage<WorkItem[]>(
    STORAGE_KEY,
    SEED_WORK_ITEMS
  );

  // Consumers always see normalized items, even before the one-time
  // migration write-back below has persisted. New array fields are safe
  // to read directly off these.
  const normalizedItems = useMemo(() => items.map(normalizeWorkItem), [items]);

  // Persist the upgrade once any legacy item is detected. Guarded by the
  // schema version so it runs at most once per stored dataset, not on
  // every mount.
  useEffect(() => {
    if (!isHydrated) return;
    const needsMigration = items.some(
      (i) => i.schemaVersion !== WORK_ITEM_SCHEMA_VERSION
    );
    if (needsMigration) {
      setItems((prev) => prev.map(normalizeWorkItem));
    }
  }, [isHydrated, items, setItems]);

  const addWorkItem = useCallback(
    (
      item: Omit<WorkItem, "id" | "createdAt" | "updatedAt" | "status"> & {
        status?: WorkStatus;
      }
    ) => {
      const now = new Date().toISOString();
      const id = `work-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [
        normalizeWorkItem({
          ...item,
          status: item.status ?? "Ready",
          id,
          createdAt: now,
          updatedAt: now,
        }),
        ...prev,
      ]);
    },
    [setItems]
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

  const activeCount = normalizedItems.filter(
    (i) => i.status !== "Done"
  ).length;

  return {
    items: normalizedItems,
    addWorkItem,
    toggleDone,
    cycleStatus,
    activeCount,
    isHydrated,
  };
}
