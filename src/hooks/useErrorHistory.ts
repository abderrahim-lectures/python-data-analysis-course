import {useCallback} from 'react';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';

export interface StoredError {
  /** Error message text (normalized, e.g. "TypeError: can only concatenate str...") */
  message: string;
  /** Week id (e.g. "python-101-normal-week-2") the error happened on. */
  weekId: string;
  /** Seconds since epoch. */
  at: number;
}

/** Max errors kept per student (bounded so localStorage never grows unbounded). */
const MAX_ERRORS = 40;

/** How many errors on the same week before StillStuck shows support. */
export const STUCK_THRESHOLD = 3;

/**
 * Tracks beginner error history in localStorage. Used by StillStuck to detect
 * "this student is stuck" and offer a helping hand instead of letting them churn.
 */
export function useErrorHistory() {
  const [errors, setErrors] = useLocalStorage<StoredError[]>(STORAGE_KEYS.errorHistory, []);

  const recordError = useCallback(
    (rawMessage: string, weekId: string) => {
      // Normalize: strip the line number/source context that tracebacks include
      // so the same conceptual error is deduplicated regardless of line.
      const message = rawMessage.split('\n')[0].slice(0, 200);
      setErrors((prev) => {
        const last = prev[prev.length - 1];
        // Don't record exact repeats in a row — a flurry of identical errors is one struggle.
        if (last && last.message === message && last.weekId === weekId) {
          return prev;
        }
        const next = [...prev, {message, weekId, at: Math.floor(Date.now() / 1000)}];
        return next.slice(-MAX_ERRORS);
      });
    },
    [setErrors],
  );

  const clearErrors = useCallback(() => setErrors([]), [setErrors]);

  return {errors, recordError, clearErrors};
}

/** Count distinct error patterns for a given week. */
export function countErrorsForWeek(errors: StoredError[], weekId: string): number {
  return new Set(errors.filter((e) => e.weekId === weekId).map((e) => e.message)).size;
}