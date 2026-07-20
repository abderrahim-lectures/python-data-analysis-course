import {useCallback, useEffect, useState} from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

function readValue<T>(key: string, initialValue: T): T {
  if (!ExecutionEnvironment.canUseDOM) {
    return initialValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? initialValue : (JSON.parse(raw) as T);
  } catch {
    return initialValue;
  }
}

/**
 * Typed, SSR-safe wrapper around a single `localStorage` key.
 * Every piece of client-side course state (progress, badges, mode, etc.)
 * goes through this hook rather than touching `window.localStorage` directly.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => readValue(key, initialValue));

  useEffect(() => {
    setStoredValue(readValue(key, initialValue));
    // Only re-sync when the key itself changes, not on every initialValue identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback<SetValue<T>>(
    (value) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        if (ExecutionEnvironment.canUseDOM) {
          try {
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch {
            // localStorage can throw (quota, private mode) — state still updates in-memory.
          }
        }
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
