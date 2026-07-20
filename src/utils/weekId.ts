import type {SectionId, TrackId, WeekId} from '@site/src/types/progress';

/** Builds the canonical weekId used as a key across progress/quiz/badge maps. */
export function buildWeekId(section: SectionId, track: TrackId, week: number): WeekId {
  return `${section}-${track}-week-${week}`;
}
