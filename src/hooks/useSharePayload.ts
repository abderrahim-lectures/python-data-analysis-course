import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useStudentIdentity} from '@site/src/hooks/useStudentIdentity';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {getChosenWeeks} from '@site/src/utils/weeks';
import type {PerSectionTrack, ProgressMap} from '@site/src/types/progress';
import type {SharePayload} from '@site/src/types/share';

/** Builds this student's current shareable summary from local state. */
export function useSharePayload(): SharePayload {
  const {name, studentId} = useStudentIdentity();
  const [progress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  const [tracks] = useLocalStorage<PerSectionTrack>(STORAGE_KEYS.track, {});
  const [badges] = useLocalStorage<string[]>(STORAGE_KEYS.badges, []);

  const chosenWeeks = getChosenWeeks(tracks);
  const totalCount = chosenWeeks?.length ?? 0;
  const completedCount = chosenWeeks?.filter((w) => progress[w.weekId]).length ?? 0;

  return {
    name: name || undefined,
    studentId,
    completedCount,
    totalCount,
    badgeCount: badges.length,
    completed: totalCount > 0 && completedCount === totalCount,
  };
}
