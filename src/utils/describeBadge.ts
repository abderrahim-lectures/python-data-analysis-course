import type {BadgeId} from '@site/src/types/progress';

export interface BadgeDescription {
  emoji: string;
  label: string;
}

/**
 * Turns a badgeId (many of them dynamically built from a weekId, e.g.
 * "python-101-normal-week-1-complete") into something displayable, without
 * needing a hardcoded entry per week.
 */
export function describeBadge(badgeId: BadgeId): BadgeDescription {
  if (badgeId === 'course-graduate') {
    return {emoji: '🎓', label: 'Course graduate'};
  }
  if (badgeId === 'placement-quiz-passed') {
    return {emoji: '✅', label: 'Placement quiz passed'};
  }
  if (badgeId.endsWith('-graduate')) {
    return {emoji: '🏆', label: `${formatWeekId(badgeId, '-graduate')} track complete`};
  }
  if (badgeId.endsWith('-quiz-ace')) {
    return {emoji: '🌟', label: `${formatWeekId(badgeId, '-quiz-ace')} quiz ace`};
  }
  if (badgeId.endsWith('-bonus-unlocked')) {
    return {emoji: '🔓', label: `${formatWeekId(badgeId, '-bonus-unlocked')} bonus unlocked`};
  }
  if (badgeId.endsWith('-complete')) {
    return {emoji: '🏁', label: `${formatWeekId(badgeId, '-complete')} complete`};
  }
  return {emoji: '🏅', label: badgeId};
}

function formatWeekId(badgeId: BadgeId, suffix: string): string {
  const weekId = badgeId.slice(0, -suffix.length);
  return weekId
    .split('-')
    .map((part) => (Number.isNaN(Number(part)) ? part[0]?.toUpperCase() + part.slice(1) : part))
    .join(' ');
}
