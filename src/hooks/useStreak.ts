import {useCallback, useMemo} from 'react';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';

interface StreakData {
  current: number;
  longest: number;
  lastActivityDate: string;
  freezes: number;
  maxFreezes: number;
}

const INITIAL_STREAK: StreakData = {
  current: 0,
  longest: 0,
  lastActivityDate: '',
  freezes: 3,
  maxFreezes: 3,
};

/**
 * Hook for managing daily practice streaks.
 * Streaks drive daily habits and increase engagement by 3.6x.
 */
export function useStreak() {
  const [streak, setStreak] = useLocalStorage<StreakData>(STORAGE_KEYS.streak, INITIAL_STREAK);

  const recordActivity = useCallback(() => {
    const today = new Date().toDateString();
    const lastActivity = streak.lastActivityDate;

    setStreak((prev) => {
      // Already recorded today
      if (lastActivity === today) {
        return prev;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = lastActivity === yesterday.toDateString();

      // Streak continues or starts new
      const newCurrent = isYesterday ? prev.current + 1 : 1;
      const newLongest = Math.max(newCurrent, prev.longest);

      return {
        ...prev,
        current: newCurrent,
        longest: newLongest,
        lastActivityDate: today,
      };
    });
  }, [streak.lastActivityDate, setStreak]);

  const useFreeze = useCallback(() => {
    if (streak.freezes <= 0) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    setStreak((prev) => ({
      ...prev,
      freezes: prev.freezes - 1,
      lastActivityDate: yesterdayStr, // Extend streak by 1 day
    }));

    return true;
  }, [streak.freezes, setStreak]);

  const addFreezes = useCallback((count: number) => {
    setStreak((prev) => ({
      ...prev,
      freezes: Math.min(prev.freezes + count, prev.maxFreezes),
    }));
  }, [setStreak]);

  const resetStreak = useCallback(() => {
    setStreak(INITIAL_STREAK);
  }, [setStreak]);

  const status = useMemo(() => {
    const today = new Date().toDateString();
    const lastActivity = streak.lastActivityDate;

    if (lastActivity === today) return 'active';
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActivity === yesterday.toDateString()) return 'at-risk';
    
    return 'broken';
  }, [streak.lastActivityDate]);

  const daysSinceLastActivity = useMemo(() => {
    if (!streak.lastActivityDate) return null;
    const last = new Date(streak.lastActivityDate);
    const now = new Date();
    const diffTime = now.getTime() - last.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [streak.lastActivityDate]);

  return {
    streak,
    status,
    daysSinceLastActivity,
    recordActivity,
    useFreeze,
    addFreezes,
    resetStreak,
  };
}
