import {useCallback, useMemo} from 'react';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

interface AchievementsData {
  unlocked: string[];
  progress: Record<string, number>;
}

const INITIAL_ACHIEVEMENTS: AchievementsData = {
  unlocked: [],
  progress: {},
};

// All available achievements
export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // Common achievements
  {id: 'first-run', name: 'First Steps', description: 'Run your first code', icon: '🚀', rarity: 'common', maxProgress: 1},
  {id: 'complete-week-1', name: 'Week 1 Complete', description: 'Finish Week 1', icon: '📚', rarity: 'common', maxProgress: 1},
  {id: 'perfect-quiz', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '⭐', rarity: 'common', maxProgress: 1},
  {id: 'help-others', name: 'Helper', description: 'Use the error reporter', icon: '🤝', rarity: 'common', maxProgress: 1},
  
  // Rare achievements
  {id: 'streak-7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', rarity: 'rare', maxProgress: 7},
  {id: 'complete-section', name: 'Section Master', description: 'Complete all weeks in a section', icon: '🎓', rarity: 'rare', maxProgress: 5},
  {id: 'no-errors', name: 'Clean Coder', description: 'Run 10 times without errors', icon: '✨', rarity: 'rare', maxProgress: 10},
  
  // Epic achievements
  {id: 'streak-30', name: 'Monthly Master', description: '30-day streak', icon: '💎', rarity: 'epic', maxProgress: 30},
  {id: 'complete-course', name: 'Course Graduate', description: 'Complete the entire course', icon: '🏆', rarity: 'epic', maxProgress: 10},
  {id: 'xp-1000', name: 'XP Collector', description: 'Earn 1000 XP', icon: '💰', rarity: 'epic', maxProgress: 1000},
  
  // Legendary achievements
  {id: 'streak-100', name: 'Century Streak', description: '100-day streak', icon: '👑', rarity: 'legendary', maxProgress: 100},
  {id: 'perfect-course', name: 'Perfectionist', description: 'Complete all quizzes with 100%', icon: '🌟', rarity: 'legendary', maxProgress: 10},
];

/**
 * Hook for managing achievements and their unlock status.
 * Achievements recognize accomplishments and provide long-term goals.
 */
export function useAchievements() {
  const [achievements, setAchievements] = useLocalStorage<AchievementsData>(
    STORAGE_KEYS.achievements,
    INITIAL_ACHIEVEMENTS
  );

  const updateProgress = useCallback((achievementId: string, progress: number) => {
    setAchievements((prev) => {
      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!achievement) return prev;

      const newProgress = Math.min(progress, achievement.maxProgress);
      const wasUnlocked = prev.unlocked.includes(achievementId);
      const isNowUnlocked = newProgress >= achievement.maxProgress;

      return {
        unlocked: isNowUnlocked && !wasUnlocked
          ? [...prev.unlocked, achievementId]
          : prev.unlocked,
        progress: {
          ...prev.progress,
          [achievementId]: newProgress,
        },
      };
    });
  }, [setAchievements]);

  const incrementProgress = useCallback((achievementId: string, amount: number = 1) => {
    setAchievements((prev) => {
      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!achievement) return prev;

      const currentProgress = prev.progress[achievementId] ?? 0;
      const newProgress = Math.min(currentProgress + amount, achievement.maxProgress);
      const wasUnlocked = prev.unlocked.includes(achievementId);
      const isNowUnlocked = newProgress >= achievement.maxProgress;

      return {
        unlocked: isNowUnlocked && !wasUnlocked
          ? [...prev.unlocked, achievementId]
          : prev.unlocked,
        progress: {
          ...prev.progress,
          [achievementId]: newProgress,
        },
      };
    });
  }, [setAchievements]);

  const unlock = useCallback((achievementId: string) => {
    setAchievements((prev) => {
      if (prev.unlocked.includes(achievementId)) return prev;
      return {
        ...prev,
        unlocked: [...prev.unlocked, achievementId],
      };
    });
  }, [setAchievements]);

  const getAchievement = useCallback((id: string): Achievement | null => {
    const template = ACHIEVEMENTS.find((a) => a.id === id);
    if (!template) return null;

    const isUnlocked = achievements.unlocked.includes(id);
    const progress = achievements.progress[id] ?? 0;

    return {
      ...template,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? new Date().toISOString() : undefined,
      progress,
    };
  }, [achievements]);

  const allAchievements = useMemo(() => {
    return ACHIEVEMENTS.map((template) => ({
      ...template,
      unlocked: achievements.unlocked.includes(template.id),
      progress: achievements.progress[template.id] ?? 0,
    }));
  }, [achievements]);

  const unlockedCount = achievements.unlocked.length;
  const totalCount = ACHIEVEMENTS.length;
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

  return {
    achievements,
    allAchievements,
    unlockedCount,
    totalCount,
    completionPercent,
    updateProgress,
    incrementProgress,
    unlock,
    getAchievement,
  };
}
