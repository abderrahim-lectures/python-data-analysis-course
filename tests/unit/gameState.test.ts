import {beforeEach, describe, expect, test, vi} from 'vitest';

// gameState reads/writes localStorage at call time, so a fresh in-memory
// store per test is enough to isolate them.
function installLocalStorage() {
  let store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  });
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

async function fresh() {
  vi.resetModules();
  installLocalStorage();
  return import('../../src/lib/gameState.ts');
}

/** Seed state directly, bypassing the award path, to set up a scenario. */
async function seed(patch: Record<string, unknown>) {
  const gs = await fresh();
  const s = gs.loadState();
  gs.saveState({...s, ...patch} as never);
  return gs;
}

describe('completeLesson', () => {
  test('marks the lesson complete and awards XP', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/week-1');

    expect(gs.isLessonComplete('python-101/normal/week-1')).toBe(true);
    expect(gs.xpProgress().xp).toBe(20);
  });

  test('is idempotent — completing twice does not double-award XP', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/week-1');
    gs.completeLesson('python-101/normal/week-1');

    expect(gs.xpProgress().xp).toBe(20);
  });

  test('persists across a page load', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/week-2');

    // Same backing store, module re-evaluated as if the page reloaded.
    const reloaded = await import('../../src/lib/gameState.ts');
    expect(reloaded.isLessonComplete('python-101/normal/week-2')).toBe(true);
  });
});

describe('addXP (running a code cell)', () => {
  test('awards XP for a lesson the learner has not completed yet', async () => {
    const gs = await fresh();
    gs.addXP('python-101/normal/week-1');

    expect(gs.xpProgress().xp).toBe(20);
    expect(gs.isLessonComplete('python-101/normal/week-1')).toBe(true);
  });

  test('running a second cell in the same lesson does not re-award', async () => {
    const gs = await fresh();
    gs.addXP('python-101/normal/week-1');
    gs.addXP('python-101/normal/week-1');

    expect(gs.xpProgress().xp).toBe(20);
  });
});

describe('streaks', () => {
  test('first activity ever starts the streak at 1, not 0', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/week-1');

    expect(gs.streakProgress().current).toBe(1);
  });

  test('activity on consecutive days increments the streak', async () => {
    const gs = await seed({streak: 3, bestStreak: 3, lastActive: daysAgo(1)});
    gs.completeLesson('python-101/normal/week-1');

    expect(gs.streakProgress().current).toBe(4);
  });

  test('a second lesson on the same day does not inflate the streak', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/week-1');
    gs.completeLesson('python-101/normal/week-2');

    expect(gs.streakProgress().current).toBe(1);
  });

  test('a missed day resets the streak to 1', async () => {
    const gs = await seed({streak: 9, bestStreak: 9, lastActive: daysAgo(3)});
    gs.completeLesson('python-101/normal/week-1');

    expect(gs.streakProgress().current).toBe(1);
  });

  test('best streak survives a reset', async () => {
    const gs = await seed({streak: 9, bestStreak: 9, lastActive: daysAgo(3)});
    gs.completeLesson('python-101/normal/week-1');

    expect(gs.streakProgress().best).toBe(9);
  });

  test('a 3-day streak adds the bonus XP', async () => {
    const gs = await seed({streak: 2, bestStreak: 2, lastActive: daysAgo(1)});
    gs.completeLesson('python-101/normal/week-1');

    // streak becomes 3 -> 20 base + 5 bonus
    expect(gs.xpProgress().xp).toBe(25);
  });
});

describe('isWeekComplete', () => {
  test('is true when the normal track week is done', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/week-3');

    expect(gs.isWeekComplete('python-101', 3)).toBe(true);
  });

  test('is true when only the hard track week is done', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/hard/week-3');

    expect(gs.isWeekComplete('python-101', 3)).toBe(true);
  });

  test('does not leak completion across sections', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/week-3');

    expect(gs.isWeekComplete('data-analysis', 3)).toBe(false);
  });
});

describe('quests', () => {
  test('all quests start locked', async () => {
    const gs = await fresh();
    expect(gs.questsToShow().every((q) => !q.done)).toBe(true);
  });

  test('completing a lesson unlocks First step', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/week-1');

    const q = gs.questsToShow().find((x) => x.id === 'first-lesson');
    expect(q?.done).toBe(true);
  });

  test('running a cell unlocks First run', async () => {
    const gs = await fresh();
    gs.addXP('python-101/normal/week-1');

    expect(gs.questsToShow().find((q) => q.id === 'first-run')?.done).toBe(true);
  });

  test('the track quest id matches the section slug, not a truncated prefix', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/week-1');

    expect(gs.questsToShow().find((q) => q.id === 'track-python-101')?.done).toBe(true);
  });

  test('finishing every Python week unlocks the track-completion quest', async () => {
    const gs = await fresh();
    [1, 2, 3, 4, 5].forEach((w) => gs.completeLesson(`python-101/normal/week-${w}`));

    expect(gs.questsToShow().find((q) => q.id === 'all-python')?.done).toBe(true);
  });

  test('the Python track quest stays locked while a week is missing', async () => {
    const gs = await fresh();
    [1, 2, 3, 4].forEach((w) => gs.completeLesson(`python-101/normal/week-${w}`));

    expect(gs.questsToShow().find((q) => q.id === 'all-python')?.done).toBe(false);
  });

  test('crossing 100 XP unlocks the XP milestone', async () => {
    const gs = await fresh();
    [1, 2, 3, 4, 5].forEach((w) => gs.completeLesson(`python-101/normal/week-${w}`));

    expect(gs.xpProgress().xp).toBeGreaterThanOrEqual(100);
    expect(gs.questsToShow().find((q) => q.id === 'xp-100')?.done).toBe(true);
  });

  test('reaching a 3-day streak unlocks the streak quest', async () => {
    const gs = await seed({streak: 2, bestStreak: 2, lastActive: daysAgo(1)});
    gs.completeLesson('python-101/normal/week-1');

    expect(gs.questsToShow().find((q) => q.id === 'streak-3')?.done).toBe(true);
  });
});

describe('levels and ranks', () => {
  test('a new learner is level 1 with 0 XP', async () => {
    const gs = await fresh();
    const xp = gs.xpProgress();

    expect(xp.level).toBe(1);
    expect(xp.xp).toBe(0);
  });

  test('levels up every 100 XP', async () => {
    const gs = await seed({xp: 250});
    expect(gs.xpProgress().level).toBe(3);
  });

  test('rank climbs with XP', async () => {
    const gs = await fresh();
    expect(gs.rankFor(0)).toBe('Bronze');
    expect(gs.rankFor(300)).toBe('Silver');
    expect(gs.rankFor(7000)).toBe('Grandmaster');
  });
});

describe('corrupt storage', () => {
  test('falls back to defaults instead of throwing', async () => {
    vi.resetModules();
    installLocalStorage();
    localStorage.setItem('pda:state', '{not valid json');

    const gs = await import('../../src/lib/gameState.ts');
    expect(gs.xpProgress().xp).toBe(0);
  });
});

describe('repairing state saved by the buggy build', () => {
  // What earlier builds left behind: real XP and completed lessons, but a
  // streak pinned at 0 and an empty quest map. This is the exact shape a
  // returning learner has in localStorage.
  const legacy = {
    xp: 20,
    lessonsCompleted: {'python-101/normal/week-2': true},
    lessonsRun: {'python-101/normal/week-2': true},
    quizCorrect: 0, quizTotal: 0,
    streak: 0, bestStreak: 0,
    lastActive: '', quests: {}, badges: [],
  };

  async function loadLegacy() {
    vi.resetModules();
    installLocalStorage();
    localStorage.setItem('pda:state', JSON.stringify(legacy));
    return import('../../src/lib/gameState.ts');
  }

  test('keeps the XP the learner already earned', async () => {
    const gs = await loadLegacy();
    expect(gs.xpProgress().xp).toBe(20);
  });

  test('lifts the stuck 0 streak to 1', async () => {
    const gs = await loadLegacy();
    expect(gs.streakProgress().current).toBe(1);
  });

  test('backfills the quests that were never awarded', async () => {
    const gs = await loadLegacy();
    const done = gs.questsToShow().filter((q) => q.done).map((q) => q.id);

    expect(done).toContain('first-lesson');
    expect(done).toContain('first-run');
    expect(done).toContain('track-python-101');
  });

  test('no longer reports 0/11 quests', async () => {
    const gs = await loadLegacy();
    expect(gs.questsToShow().filter((q) => q.done).length).toBeGreaterThan(0);
  });

  test('does not invent progress for a brand-new learner', async () => {
    const gs = await fresh();
    expect(gs.streakProgress().current).toBe(0);
    expect(gs.questsToShow().filter((q) => q.done)).toHaveLength(0);
  });

  test('does not retroactively unlock milestones that were not reached', async () => {
    const gs = await loadLegacy();
    const done = gs.questsToShow().filter((q) => q.done).map((q) => q.id);

    expect(done).not.toContain('xp-100');
    expect(done).not.toContain('all-python');
    expect(done).not.toContain('streak-3');
  });
});
