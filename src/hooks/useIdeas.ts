import { useCallback } from "react";
import { useAsyncStorage } from "./useAsyncStorage";
import { SEED_IDEAS } from "../lib/constants";
import type { Idea, IdeaStatus } from "../lib/types";

const STORAGE_KEY = "sh-ideas";

const STATUS_CYCLE: IdeaStatus[] = ["saved", "draft", "used"];

export function useIdeas() {
  const [items, setItems, isHydrated] = useAsyncStorage<Idea[]>(
    STORAGE_KEY,
    SEED_IDEAS
  );

  const addIdea = useCallback(
    (idea: Omit<Idea, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const id = `idea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [
        { ...idea, id, createdAt: now, updatedAt: now },
        ...prev,
      ]);
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

  const savedCount = items.filter((i) => i.status === "saved").length;
  const draftCount = items.filter((i) => i.status === "draft").length;

  return { items, addIdea, cycleStatus, savedCount, draftCount, isHydrated };
}
