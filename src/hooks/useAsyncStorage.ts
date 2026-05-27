import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useAsyncStorage<T>(
  key: string,
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((stored) => {
        if (stored !== null) {
          setValue(JSON.parse(stored));
        }
      })
      .catch(() => {})
      .finally(() => setIsHydrated(true));
  }, [key]);

  const set = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;
        AsyncStorage.setItem(key, JSON.stringify(resolved)).catch(() => {});
        return resolved;
      });
    },
    [key]
  );

  return [value, set, isHydrated];
}
