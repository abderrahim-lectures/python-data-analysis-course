import {buildWeekId} from '@site/src/utils/weekId';
import type {PerSectionTrack, SectionId, TrackId, WeekId} from '@site/src/types/progress';

export interface WeekMeta {
  section: SectionId;
  track: TrackId;
  week: number;
  weekId: WeekId;
  path: string;
}

const WEEK_NUMBERS: Record<SectionId, number[]> = {
  'python-101': [1, 2, 3, 4, 5],
  'data-analysis': [6, 7, 8, 9, 10],
};

/** The 5 weeks of a given section+track, in order. */
export function weeksForTrack(section: SectionId, track: TrackId): WeekMeta[] {
  return WEEK_NUMBERS[section].map((week) => ({
    section,
    track,
    week,
    weekId: buildWeekId(section, track, week),
    path: `/docs/${section}/${track}/week-${week}`,
  }));
}

/**
 * The 10 weekIds a student is actually on the hook for, given their per-section
 * track choices — or null if either section's track hasn't been chosen yet
 * (in which case "course complete" can't be evaluated meaningfully).
 */
export function getChosenWeeks(tracks: PerSectionTrack): WeekMeta[] | null {
  const sections: SectionId[] = ['python-101', 'data-analysis'];
  const weeks: WeekMeta[] = [];
  for (const section of sections) {
    const track = tracks[section];
    if (!track) return null;
    weeks.push(...weeksForTrack(section, track));
  }
  return weeks;
}
