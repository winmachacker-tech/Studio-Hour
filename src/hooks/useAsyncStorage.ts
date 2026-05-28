import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Shared in-memory state per key so multiple hook instances using the same
// AsyncStorage key stay in sync. AsyncStorage remains the persistence source
// of truth; this only mirrors the latest value across React consumers.
const memCache = new Map<string, unknown>();
const listeners = new Map<string, Set<(value: unknown) => void>>();

function getListeners(key: string): Set<(value: unknown) => void> {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  return set;
}

function broadcast(key: string, value: unknown): void {
  memCache.set(key, value);
  for (const listener of getListeners(key)) {
    listener(value);
  }
}

export function useAsyncStorage<T>(
  key: string,
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(() =>
    memCache.has(key) ? (memCache.get(key) as T) : initialValue
  );
  const [isHydrated, setIsHydrated] = useState<boolean>(memCache.has(key));

  useEffect(() => {
    const listener = (next: unknown) => setValue(next as T);
    const subs = getListeners(key);
    subs.add(listener);
    return () => {
      subs.delete(listener);
    };
  }, [key]);

  useEffect(() => {
    if (memCache.has(key)) {
      setIsHydrated(true);
      return;
    }
    AsyncStorage.getItem(key)
      .then((stored) => {
        const parsed =
          stored !== null ? (JSON.parse(stored) as T) : initialValue;
        broadcast(key, parsed);
      })
      .catch(() => {})
      .finally(() => setIsHydrated(true));
  }, [key]);

  const set = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const prev = (memCache.has(key)
        ? (memCache.get(key) as T)
        : initialValue);
      const resolved =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(prev)
          : newValue;
      broadcast(key, resolved);
      AsyncStorage.setItem(key, JSON.stringify(resolved)).catch(() => {});
    },
    [key]
  );

  return [value, set, isHydrated];
}
