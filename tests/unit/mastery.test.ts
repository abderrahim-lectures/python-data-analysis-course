import {describe, expect, test} from 'vitest';
import {accuracy, isMastered, dueForRevisit} from '../../src/lib/mastery';
import type {LessonMastery} from '../../src/lib/gameState';

const DAY = 86_400_000;

function rec(over: Partial<LessonMastery> = {}): LessonMastery {
  return {correct: 3, total: 4, firstWrongAt: null, lastWrongAt: null, ...over};
}

// mastery.ts had no tests at all (0% coverage) even though it decides whether a
// module page shows "mastered", "blocked" or nothing -- the labels a learner
// reads as feedback on their own progress.
describe('accuracy', () => {
  test('an absent record is 0, not NaN', () => {
    expect(accuracy(undefined)).toBe(0);
    expect(Number.isNaN(accuracy(undefined))).toBe(false);
  });

  test('an empty record is 0 rather than a division by zero', () => {
    expect(accuracy({correct: 0, total: 0, firstWrongAt: null, lastWrongAt: null})).toBe(0);
  });

  test('otherwise correct / total', () => {
    expect(accuracy(rec({correct: 3, total: 4}))).toBe(0.75);
    expect(accuracy(rec({correct: 0, total: 5}))).toBe(0);
    expect(accuracy(rec({correct: 5, total: 5}))).toBe(1);
  });
});

describe('isMastered', () => {
  test('needs at least two attempts', () => {
    // One correct answer is not evidence of mastery.
    expect(isMastered(rec({correct: 1, total: 1}))).toBe(false);
    expect(isMastered(rec({correct: 2, total: 2}))).toBe(true);
  });

  test('the threshold is inclusive at exactly 0.75', () => {
    expect(isMastered(rec({correct: 3, total: 4}))).toBe(true);
    expect(isMastered(rec({correct: 2, total: 3}))).toBe(false);
  });

  test('an absent or empty record is never mastered', () => {
    expect(isMastered(undefined)).toBe(false);
    expect(isMastered({correct: 0, total: 0, firstWrongAt: null, lastWrongAt: null})).toBe(false);
  });
});

describe('dueForRevisit', () => {
  const now = 1_700_000_000_000;

  test('an unmastered lesson with a miss comes back after a day', () => {
    const m = rec({correct: 1, total: 3, lastWrongAt: now - DAY});
    expect(dueForRevisit(m, now)).toBe(true);
  });

  test('exactly one day old counts as due', () => {
    expect(dueForRevisit(rec({correct: 1, total: 3, lastWrongAt: now - DAY}), now)).toBe(true);
    expect(dueForRevisit(rec({correct: 1, total: 3, lastWrongAt: now - DAY + 1}), now)).toBe(false);
  });

  test('a mastered lesson is not revisited even if it was once wrong', () => {
    const m = rec({correct: 4, total: 4, lastWrongAt: now - 10 * DAY});
    expect(dueForRevisit(m, now)).toBe(false);
  });

  test('a lesson with no recorded miss is not scheduled', () => {
    expect(dueForRevisit(rec({lastWrongAt: null}), now)).toBe(false);
    expect(dueForRevisit(undefined, now)).toBe(false);
  });

  test('the interval is derived from history, so two calls a day apart agree', () => {
    const m = rec({correct: 1, total: 3, lastWrongAt: now});
    expect(dueForRevisit(m, now + DAY / 2)).toBe(false);
    expect(dueForRevisit(m, now + DAY)).toBe(true);
  });
});
