import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useStudentIdentity} from '@site/src/hooks/useStudentIdentity';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {getChosenWeeksPartial} from '@site/src/utils/weeks';
import type {PerSectionTrack, ProgressMap} from '@site/src/types/progress';
import type {SharePayload} from '@site/src/types/share';

/** Builds this student's current shareable summary from local state. */
export function useSharePayload(): SharePayload {
  const {name, studentId} = useStudentIdentity();
  const [progress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  const [tracks] = useLocalStorage<PerSectionTrack>(STORAGE_KEYS.track, {});
  const [badges] = useLocalStorage<string[]>(STORAGE_KEYS.badges, []);

  // Partial on purpose: counts progress in whichever section(s) already
  // have a track chosen, so a student who's only started Python 101 gets a
  // real "3 / 5" instead of "0 / 0". Full-course completion (both sections)
  // is still judged separately by useCourseComplete's strict version.
  const chosenWeeks = getChosenWeeksPartial(tracks);
  const totalCount = chosenWeeks.length;
  const completedCount = chosenWeeks.filter((w) => progress[w.weekId]).length;

  return {
    name: name || undefined,
    studentId,
    completedCount,
    totalCount,
    badgeCount: badges.length,
    completed: totalCount > 0 && completedCount === totalCount,
  };
}
