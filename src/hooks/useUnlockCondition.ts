import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import type {ProgressMap, QuizResult, WeekId, WeeklyQuizResults} from '@site/src/types/progress';

/** Has this week's quiz been passed? Gates that week's BonusContent. */
export function useWeeklyBonusUnlocked(weekId: WeekId): boolean {
  const [weeklyQuiz] = useLocalStorage<WeeklyQuizResults>(STORAGE_KEYS.weeklyQuiz, {});
  return weeklyQuiz[weekId]?.passed ?? false;
}

/** Has the Data Analysis placement quiz been passed (or skipped via "continue anyway")? */
export function usePlacementQuizStatus(): {
  result: QuizResult | null;
  hasTaken: boolean;
} {
  const [result] = useLocalStorage<QuizResult | null>(STORAGE_KEYS.placementQuiz, null);
  return {result, hasTaken: result !== null};
}

/** Has every week across both sections been marked complete? Gates the Capstone Bonus. */
export function useCourseComplete(allWeekIds: WeekId[]): boolean {
  const [progress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  return allWeekIds.length > 0 && allWeekIds.every((id) => progress[id]);
}
