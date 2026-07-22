import type {BadgeId, CapstoneId, SectionId, TrackId, WeekId} from '@site/src/types/progress';

/** Score (0-1) a WeeklyQuiz/PlacementQuiz must reach to count as "passed". */
export const QUIZ_PASS_THRESHOLD = 0.8;

/** Badge earned for marking a given week complete. */
export function weekCompleteBadge(weekId: WeekId): BadgeId {
  return `${weekId}-complete`;
}

/** Badge earned for acing (passing) a given week's quiz. */
export function weekQuizAceBadge(weekId: WeekId): BadgeId {
  return `${weekId}-quiz-ace`;
}

/** Badge earned for a section+track fully completed (all its weeks marked done). */
export function trackGraduateBadge(section: SectionId, track: TrackId): BadgeId {
  return `${section}-${track}-graduate`;
}

/** Badge earned for passing the Data Analysis Hard-track placement quiz. */
export const PLACEMENT_QUIZ_PASSED_BADGE: BadgeId = 'placement-quiz-passed';

/** Badge earned once every week across both sections is complete — unlocks the Capstone Bonus. */
export const COURSE_GRADUATE_BADGE: BadgeId = 'course-graduate';

/** Badge earned when a week's bonus content is unlocked. */
export function bonusUnlockedBadge(weekId: WeekId): BadgeId {
  return `${weekId}-bonus-unlocked`;
}

/** Badge earned for marking a given year's Capstone project complete. */
export function capstoneCompleteBadge(capstoneId: CapstoneId): BadgeId {
  return `capstone-${capstoneId}-complete`;
}
