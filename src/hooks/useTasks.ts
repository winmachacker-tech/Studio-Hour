import { useCallback, useEffect, useMemo } from "react";
import { useAsyncStorage } from "./useAsyncStorage";
import { SEED_WORK_ITEMS } from "../lib/constants";
import {
  WORK_ITEM_SCHEMA_VERSION,
  type ProjectSubtask,
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

// When a project tracks progress automatically, keep its progress value in
// sync with subtask completion. Items in "manual" mode are left untouched.
// (No progress UI exists yet — this only keeps stored data coherent so the
// progress slider in a later ticket starts from a correct value.)
function withAutoProgress(item: WorkItem): WorkItem {
  if (item.progressMode !== "auto") return item;
  const subtasks = item.subtasks ?? [];
  if (subtasks.length === 0) return { ...item, progress: 0 };
  const done = subtasks.filter((s) => s.done).length;
  return { ...item, progress: Math.round((done / subtasks.length) * 100) };
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

  const addSubtask = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const subtask: ProjectSubtask = {
            id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            text: trimmed,
            done: false,
            createdAt: new Date().toISOString(),
          };
          return withAutoProgress({
            ...item,
            subtasks: [...(item.subtasks ?? []), subtask],
            updatedAt: new Date().toISOString(),
          });
        })
      );
    },
    [setItems]
  );

  const toggleSubtask = useCallback(
    (id: string, subtaskId: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return withAutoProgress({
            ...item,
            subtasks: (item.subtasks ?? []).map((s) =>
              s.id === subtaskId ? { ...s, done: !s.done } : s
            ),
            updatedAt: new Date().toISOString(),
          });
        })
      );
    },
    [setItems]
  );

  const deleteSubtask = useCallback(
    (id: string, subtaskId: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return withAutoProgress({
            ...item,
            subtasks: (item.subtasks ?? []).filter((s) => s.id !== subtaskId),
            updatedAt: new Date().toISOString(),
          });
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
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    activeCount,
    isHydrated,
  };
}
