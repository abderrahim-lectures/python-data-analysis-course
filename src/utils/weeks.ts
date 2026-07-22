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

/**
 * Same idea as `getChosenWeeks`, but for "how far along am I" displays
 * (BadgeCase, the share card) rather than the strict "is the whole course
 * done" gate — includes weeks from whichever section(s) already have a
 * track chosen, instead of collapsing to nothing until *both* do. Most
 * students work through one section before touching the other, so the
 * all-or-nothing version showed a confusing "0 / 0 weeks" for anyone with
 * real, in-progress work in just one section. Never null: an empty array
 * when no track is chosen anywhere yet.
 */
export function getChosenWeeksPartial(tracks: PerSectionTrack): WeekMeta[] {
  const sections: SectionId[] = ['python-101', 'data-analysis'];
  const weeks: WeekMeta[] = [];
  for (const section of sections) {
    const track = tracks[section];
    if (track) weeks.push(...weeksForTrack(section, track));
  }
  return weeks;
}
