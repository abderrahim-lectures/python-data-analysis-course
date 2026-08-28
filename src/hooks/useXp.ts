import {useCallback, useMemo} from 'react';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';

interface XpData {
  total: number;
  weekly: number;
  lastUpdated: string;
  history: XpEvent[];
}

interface XpEvent {
  amount: number;
  reason: string;
  timestamp: string;
}

const INITIAL_XP: XpData = {
  total: 0,
  weekly: 0,
  lastUpdated: '',
  history: [],
};

/**
 * Hook for managing XP (experience points) with weekly tracking.
 * XP is earned by completing activities and mastering content.
 */
export function useXp() {
  const [xp, setXp] = useLocalStorage<XpData>(STORAGE_KEYS.xp, INITIAL_XP);

  const addXp = useCallback((amount: number, reason: string) => {
    const now = new Date().toISOString();
    const today = new Date().toDateString();
    const lastUpdate = xp.lastUpdated ? new Date(xp.lastUpdated).toDateString() : '';

    setXp((prev) => {
      // Reset weekly XP if it's a new week
      const isNewWeek = lastUpdate && isMoreThan7DaysApart(lastUpdate, today);
      
      return {
        total: prev.total + amount,
        weekly: isNewWeek ? amount : prev.weekly + amount,
        lastUpdated: now,
        history: [
          {amount, reason, timestamp: now},
          ...prev.history.slice(0, 49), // Keep last 50 events
        ],
      };
    });
  }, [xp.lastUpdated, setXp]);

  const getLevel = useCallback((totalXp: number) => {
    return Math.floor(totalXp / 100) + 1;
  }, []);

  const getXpInLevel = useCallback((totalXp: number) => {
    return totalXp % 100;
  }, []);

  const getXpToNextLevel = useCallback((totalXp: number) => {
    return 100 - (totalXp % 100);
  }, []);

  const stats = useMemo(() => ({
    level: getLevel(xp.total),
    xpInLevel: getXpInLevel(xp.total),
    xpToNextLevel: getXpToNextLevel(xp.total),
    percentToNext: getXpInLevel(xp.total),
  }), [xp.total, getLevel, getXpInLevel, getXpToNextLevel]);

  return {
    xp,
    addXp,
    stats,
    getXpForActivity: (activity: string) => XP_REWARDS[activity] ?? 0,
  };
}

// XP rewards for different activities
export const XP_REWARDS: Record<string, number> = {
  'complete-lesson': 10,
  'pass-quiz': 20,
  'complete-week': 50,
  'first-run': 5,
  'daily-practice': 10,
  'streak-7': 25,
  'streak-30': 100,
  'complete-section': 200,
  'help-others': 15,
  'perfect-quiz': 30,
};

function isMoreThan7DaysApart(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 7;
}
