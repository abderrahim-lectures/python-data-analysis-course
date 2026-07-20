import {useCallback} from 'react';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import type {BadgeId, BadgeSet} from '@site/src/types/progress';

/** Shared badge-earning logic — used by ProgressCheckbox, WeeklyQuiz, and PlacementQuiz. */
export function useBadges() {
  const [badges, setBadges] = useLocalStorage<BadgeSet>(STORAGE_KEYS.badges, []);

  const awardBadge = useCallback(
    (badgeId: BadgeId) => {
      setBadges((prev) => (prev.includes(badgeId) ? prev : [...prev, badgeId]));
    },
    [setBadges],
  );

  const hasBadge = useCallback((badgeId: BadgeId) => badges.includes(badgeId), [badges]);

  return {badges, awardBadge, hasBadge};
}
