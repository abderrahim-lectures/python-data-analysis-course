import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {getChosenWeeks} from '@site/src/utils/weeks';
import type {
  PerSectionTrack,
  ProgressMap,
  QuizResult,
  WeekId,
  WeeklyQuizResults,
} from '@site/src/types/progress';

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

/**
 * Has every week of the student's chosen tracks (both sections) been marked
 * complete? Gates the Capstone Bonus. False if either section's track hasn't
 * been chosen yet — completion can't be evaluated without knowing which 5
 * weeks apply per section.
 */
export function useCourseComplete(): boolean {
  const [progress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  const [tracks] = useLocalStorage<PerSectionTrack>(STORAGE_KEYS.track, {});
  const chosenWeeks = getChosenWeeks(tracks);
  return chosenWeeks !== null && chosenWeeks.every((w) => progress[w.weekId]);
}
