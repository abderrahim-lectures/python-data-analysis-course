// Pure deep-practice logic over per-lesson mastery (gameState.lessonMastery).
// Nothing here touches localStorage; callers pass records.
import type {LessonMastery} from './gameState';

const DAY = 86_400_000;
const MASTER_THRESHOLD = 0.75;  // ~Coyle's sweet spot: ≈80% success, ≈20% mistakes

export function accuracy(m: LessonMastery | undefined): number {
  return !m || m.total === 0 ? 0 : m.correct / m.total;
}

export function isMastered(m: LessonMastery | undefined): boolean {
  return !!m && m.total >= 2 && accuracy(m) >= MASTER_THRESHOLD;
}

// A lesson with unanswered misses comes back on the spaced schedule once it
// has sat stale for a day. Interval is derived from history, not stored.
export function dueForRevisit(m: LessonMastery | undefined, now: number = Date.now()): boolean {
  return !!m && !isMastered(m) && m.lastWrongAt !== null && now - m.lastWrongAt >= DAY;
}