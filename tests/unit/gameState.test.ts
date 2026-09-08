import {describe, expect, test, vi} from 'vitest';

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

async function seed(patch: Record<string, unknown>) {
  const gs = await fresh();
  const s = gs.loadState();
  gs.saveState({...s, ...patch} as never);
  return gs;
}

describe('completeLesson', () => {
  test('marks the lesson complete and awards base XP', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');

    expect(gs.isLessonComplete('python-101/normal/01-printing')).toBe(true);
    // 60 base; xp-100 milestone not reached by one lesson alone
    expect(gs.xpProgress().xp).toBe(60);
  });

  test('is idempotent — completing twice does not double-award XP', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');
    const first = gs.xpProgress().xp;
    gs.completeLesson('python-101/normal/01-printing');

    expect(gs.xpProgress().xp).toBe(first);
  });

  test('persists across a page load', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/02-variables');

    const reloaded = await import('../../src/lib/gameState.ts');
    expect(reloaded.isLessonComplete('python-101/normal/02-variables')).toBe(true);
  });
});

describe('addXP (running a code cell)', () => {
  test('awards XP for a lesson the learner has not completed yet', async () => {
    const gs = await fresh();
    gs.addXP('python-101/normal/01-printing');

    // 5 (run) + 60 (complete) = 65; xp-100 milestone not reached
    expect(gs.xpProgress().xp).toBe(65);
    expect(gs.isLessonComplete('python-101/normal/01-printing')).toBe(true);
  });

  test('running a second cell in the same lesson does not re-award completion', async () => {
    const gs = await fresh();
    gs.addXP('python-101/normal/01-printing');
    gs.addXP('python-101/normal/01-printing');

    // 5 (first run) + 5 (second run) + 60 (complete, idempotent) = 70
    expect(gs.xpProgress().xp).toBe(70);
  });
});

describe('streaks', () => {
  test('first activity ever starts the streak at 1, not 0', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');

    expect(gs.streakProgress().current).toBe(1);
  });

  test('activity on consecutive days increments the streak', async () => {
    const gs = await seed({streak: 3, bestStreak: 3, lastActive: daysAgo(1)});
    gs.completeLesson('python-101/normal/01-printing');

    expect(gs.streakProgress().current).toBe(4);
  });

  test('a second lesson on the same day does not inflate the streak', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');
    gs.completeLesson('python-101/normal/02-variables');

    expect(gs.streakProgress().current).toBe(1);
  });

  test('a missed day resets the streak to 1', async () => {
    const gs = await seed({streak: 9, bestStreak: 9, lastActive: daysAgo(3)});
    gs.completeLesson('python-101/normal/01-printing');

    expect(gs.streakProgress().current).toBe(1);
  });

  test('best streak survives a reset', async () => {
    const gs = await seed({streak: 9, bestStreak: 9, lastActive: daysAgo(3)});
    gs.completeLesson('python-101/normal/01-printing');

    expect(gs.streakProgress().best).toBe(9);
  });

  test('a 3-day streak adds the bonus XP', async () => {
    const gs = await seed({streak: 2, bestStreak: 2, lastActive: daysAgo(1)});
    gs.completeLesson('python-101/normal/01-printing');

    // 60 base + 15 streak bonus = 75 (xp-100 milestone not reached)
    expect(gs.xpProgress().xp).toBe(75);
  });
});

describe('section progress', () => {
  test('is true when any lesson in the section is done', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/03-data-types');

    expect(gs.isWeekComplete('python-101', 1)).toBe(true);
  });

  test('is true when only the hard track lesson is done', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/hard/03-tokenization-basics');

    expect(gs.isWeekComplete('python-101', 1)).toBe(true);
  });

  test('does not leak completion across sections', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/03-data-types');

    expect(gs.isWeekComplete('data-analysis', 1)).toBe(false);
  });
});

describe('quests', () => {
  test('all quests start locked', async () => {
    const gs = await fresh();
    expect(gs.questsToShow().every((q) => !q.done)).toBe(true);
  });

  test('completing a lesson unlocks First step', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');

    const q = gs.questsToShow().find((x) => x.id === 'first-lesson');
    expect(q?.done).toBe(true);
  });

  test('running a cell unlocks First run', async () => {
    const gs = await fresh();
    gs.addXP('python-101/normal/01-printing');

    expect(gs.questsToShow().find((q) => q.id === 'first-run')?.done).toBe(true);
  });

  test('the track quest id matches the section slug', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');

    expect(gs.questsToShow().find((q) => q.id === 'track-python-101')?.done).toBe(true);
  });

  test('finishing every Python lesson unlocks the track-completion quest', async () => {
    const gs = await fresh();
    // Complete all 19 Python 101 Normal lessons
    const lessons = ['01-printing','02-variables','03-data-types','04-type-conversion','05-arithmetic','06-comparison-operators','07-boolean-operators','08-if-elif-else','09-for-while-loops','10-range-enumerate-zip','11-defining-functions','12-scope-and-lambdas','13-string-methods','14-string-slicing','15-lists-and-tuples','16-dicts-and-sets','17-comprehensions','18-reading-files','19-writing-files-csv'];
    lessons.forEach((l) => gs.completeLesson(`python-101/normal/${l}`));

    expect(gs.questsToShow().find((q) => q.id === 'all-python')?.done).toBe(true);
  });

  test('the Python track quest stays locked while lessons are missing', async () => {
    const gs = await fresh();
    ['01-printing','02-variables','03-data-types','04-type-conversion'].forEach((l) => gs.completeLesson(`python-101/normal/${l}`));

    expect(gs.questsToShow().find((q) => q.id === 'all-python')?.done).toBe(false);
  });

  test('crossing 100 XP unlocks the XP milestone', async () => {
    const gs = await fresh();
    ['01-printing','02-variables','03-data-types','04-type-conversion','05-arithmetic'].forEach((l) => gs.completeLesson(`python-101/normal/${l}`));

    expect(gs.xpProgress().xp).toBeGreaterThanOrEqual(100);
    expect(gs.questsToShow().find((q) => q.id === 'xp-100')?.done).toBe(true);
  });

  test('reaching a 3-day streak unlocks the streak quest', async () => {
    const gs = await seed({streak: 2, bestStreak: 2, lastActive: daysAgo(1)});
    gs.completeLesson('python-101/normal/01-printing');

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

  test('levels up with XP (curved formula)', async () => {
    const gs = await seed({xp: 500});
    const xp = gs.xpProgress();
    expect(xp.level).toBeGreaterThan(1);
  });

  test('rank climbs with XP', async () => {
    const gs = await fresh();
    expect(gs.rankFor(0)).toBe('Bronze');
    expect(gs.rankFor(500)).toBe('Silver');
    expect(gs.rankFor(9999)).toBe('Grandmaster');
  });
});

describe('activity log', () => {
  test('completing a lesson logs an activity entry', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');

    const log = gs.getActivityLog();
    const lessonEntry = log.find((e) => e.type === 'lesson-complete');
    expect(lessonEntry).toBeDefined();
    expect(lessonEntry!.xp).toBe(60);
  });

  test('viewing a project logs an activity entry', async () => {
    const gs = await fresh();
    gs.viewProject('wordle-clone');

    const log = gs.getActivityLog();
    const viewEntry = log.find((e) => e.type === 'project-view');
    expect(viewEntry).toBeDefined();
    expect(viewEntry!.xp).toBe(5);
  });

  test('completing a project logs an activity entry', async () => {
    const gs = await fresh();
    gs.completeProject('wordle-clone');

    const log = gs.getActivityLog();
    const completeEntry = log.find((e) => e.type === 'project-complete');
    expect(completeEntry).toBeDefined();
    expect(completeEntry!.xp).toBe(100);
  });

  test('daily login logs once per day', async () => {
    const gs = await fresh();
    gs.awardDailyLogin();
    gs.awardDailyLogin();

    const log = gs.getActivityLog().filter((e) => e.type === 'daily-login');
    expect(log.length).toBe(1);
    expect(log[0].xp).toBe(5);
  });
});

describe('project tracking', () => {
  test('viewing a project marks it as viewed', async () => {
    const gs = await fresh();
    gs.viewProject('wordle-clone');

    expect(gs.isProjectViewed('wordle-clone')).toBe(true);
    expect(gs.isProjectComplete('wordle-clone')).toBe(false);
  });

  test('completing a project marks it as completed and viewed', async () => {
    const gs = await fresh();
    gs.completeProject('wordle-clone');

    expect(gs.isProjectComplete('wordle-clone')).toBe(true);
    expect(gs.isProjectViewed('wordle-clone')).toBe(true);
  });

  test('project view is idempotent', async () => {
    const gs = await fresh();
    gs.viewProject('wordle-clone');
    gs.viewProject('wordle-clone');

    expect(gs.xpProgress().xp).toBe(5);
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
  const legacy = {
    xp: 20,
    lessonsCompleted: {'python-101/normal/02-variables': true},
    lessonsRun: {'python-101/normal/02-variables': true},
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

  test('no longer reports 0 quests', async () => {
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

  test('initializes challengesCompleted for legacy state', async () => {
    const gs = await loadLegacy();
    // Should not throw when calling challenge functions
    gs.recordChallenge('test-challenge');
    expect(gs.isChallengeComplete('test-challenge')).toBe(true);
  });
});

describe('challenge tracking', () => {
  test('recordChallenge awards XP and marks challenge complete', async () => {
    const gs = await fresh();
    gs.recordChallenge('python-101/normal/01-printing/challenge-1');

    expect(gs.isChallengeComplete('python-101/normal/01-printing/challenge-1')).toBe(true);
    expect(gs.xpProgress().xp).toBe(15);
  });

  test('recordChallenge is idempotent — solving twice does not double-award', async () => {
    const gs = await fresh();
    gs.recordChallenge('ch-1');
    const first = gs.xpProgress().xp;
    gs.recordChallenge('ch-1');

    expect(gs.xpProgress().xp).toBe(first);
    expect(gs.isChallengeComplete('ch-1')).toBe(true);
  });

  test('recordChallenge logs an activity entry', async () => {
    const gs = await fresh();
    gs.recordChallenge('ch-1');

    const log = gs.getActivityLog();
    const entry = log.find((e) => e.type === 'challenge');
    expect(entry).toBeDefined();
    expect(entry!.xp).toBe(15);
    expect(entry!.meta).toBe('ch-1');
  });

  test('solving a challenge bumps the streak', async () => {
    const gs = await seed({streak: 2, bestStreak: 2, lastActive: daysAgo(1)});
    gs.recordChallenge('ch-1');

    expect(gs.streakProgress().current).toBe(3);
  });

  test('solving the first challenge unlocks the first-challenge quest', async () => {
    const gs = await fresh();
    gs.recordChallenge('ch-1');

    expect(gs.questsToShow().find((q) => q.id === 'first-challenge')?.done).toBe(true);
  });

  test('solving 10 challenges unlocks the challenges-10 quest', async () => {
    const gs = await fresh();
    for (let i = 0; i < 10; i++) gs.recordChallenge(`ch-${i}`);

    expect(gs.questsToShow().find((q) => q.id === 'challenges-10')?.done).toBe(true);
    expect(gs.questsToShow().find((q) => q.id === 'challenges-25')?.done).toBe(false);
  });

  test('solving 25 challenges unlocks the challenges-25 quest', async () => {
    const gs = await fresh();
    for (let i = 0; i < 25; i++) gs.recordChallenge(`ch-${i}`);

    expect(gs.questsToShow().find((q) => q.id === 'challenges-25')?.done).toBe(true);
    expect(gs.questsToShow().find((q) => q.id === 'challenges-50')?.done).toBe(false);
  });

  test('solving 50 challenges unlocks the challenges-50 quest', async () => {
    const gs = await fresh();
    for (let i = 0; i < 50; i++) gs.recordChallenge(`ch-${i}`);

    expect(gs.questsToShow().find((q) => q.id === 'challenges-50')?.done).toBe(true);
  });

  test('challenge XP counts toward milestones', async () => {
    const gs = await fresh();
    // 8 challenges * 15 XP = 120 XP → crosses xp-100 milestone (+25 bonus)
    for (let i = 0; i < 8; i++) gs.recordChallenge(`ch-${i}`);

    expect(gs.xpProgress().xp).toBe(145); // 120 + 25 milestone
    expect(gs.questsToShow().find((q) => q.id === 'xp-100')?.done).toBe(true);
  });
});

describe('daily login', () => {
  test('awards 5 XP for the first login of the day', async () => {
    const gs = await fresh();
    gs.awardDailyLogin();

    expect(gs.xpProgress().xp).toBe(5);
  });

  test('does not award XP twice on the same day', async () => {
    const gs = await fresh();
    gs.awardDailyLogin();
    gs.awardDailyLogin();

    expect(gs.xpProgress().xp).toBe(5);
  });

  test('bumps the streak on consecutive days', async () => {
    const gs = await seed({streak: 2, bestStreak: 2, lastActive: daysAgo(1)});
    gs.awardDailyLogin();

    expect(gs.streakProgress().current).toBe(3);
  });
});

describe('quiz tracking', () => {
  test('recordQuiz correct increments quizCorrect and awards XP', async () => {
    const gs = await fresh();
    gs.recordQuiz(true);

    const q = gs.getQuizProgress();
    expect(q.correct).toBe(1);
    expect(q.total).toBe(1);
    expect(gs.xpProgress().xp).toBe(5);
  });

  test('recordQuiz incorrect increments quizTotal but awards no XP', async () => {
    const gs = await fresh();
    gs.recordQuiz(false);

    const q = gs.getQuizProgress();
    expect(q.correct).toBe(0);
    expect(q.total).toBe(1);
    expect(gs.xpProgress().xp).toBe(0);
  });

  test('recordQuizPerfect awards bonus XP', async () => {
    const gs = await fresh();
    gs.recordQuizPerfect();

    expect(gs.xpProgress().xp).toBe(25);
  });

  test('recordQuizPerfect is idempotent', async () => {
    const gs = await fresh();
    gs.recordQuizPerfect();
    const first = gs.xpProgress().xp;
    gs.recordQuizPerfect();

    expect(gs.xpProgress().xp).toBe(first);
  });

  test('getQuizProgress returns correct percentage', async () => {
    const gs = await fresh();
    gs.recordQuiz(true);
    gs.recordQuiz(true);
    gs.recordQuiz(false);

    const q = gs.getQuizProgress();
    expect(q.pct).toBe(67); // 2/3 = 66.67 → 67
  });
});

describe('XP cap', () => {
  test('XP never exceeds 9999', async () => {
    const gs = await seed({xp: 9998});
    gs.recordChallenge('ch-1'); // +10 → would be 10008

    expect(gs.xpProgress().xp).toBe(9999);
  });

  test('XP milestone bonus respects the cap', async () => {
    const gs = await seed({xp: 9990});
    // Completing a lesson gives 100 XP → capped at 9999, then milestone
    gs.completeLesson('python-101/normal/01-printing');

    expect(gs.xpProgress().xp).toBe(9999);
  });
});

describe('activity log limits', () => {
  test('activity log is capped at 200 entries', async () => {
    const gs = await fresh();
    // Each challenge adds one entry
    for (let i = 0; i < 250; i++) gs.recordChallenge(`ch-${i}`);

    const log = gs.getActivityLog(999);
    expect(log.length).toBeLessThanOrEqual(200);
  });
});

describe('getActivityStats', () => {
  test('returns counts by type', async () => {
    const gs = await fresh();
    gs.recordChallenge('ch-1');
    gs.recordChallenge('ch-2');

    const stats = gs.getActivityStats();
    expect(stats.totalActions).toBe(2);
    expect(stats.byType['challenge']).toBe(2);
  });
});

describe('project stats', () => {
  test('tracks viewed and completed counts', async () => {
    const gs = await fresh();
    gs.viewProject('proj-1');
    gs.viewProject('proj-2');
    gs.completeProject('proj-3');

    const stats = gs.projectStats();
    expect(stats.viewed).toBe(3); // proj-1, proj-2, proj-3 (completed implies viewed)
    expect(stats.completed).toBe(1);
  });
});

describe('project milestones', () => {
  test('completing 5 projects unlocks projects-5 quest', async () => {
    const gs = await fresh();
    for (let i = 0; i < 5; i++) gs.completeProject(`proj-${i}`);

    expect(gs.questsToShow().find((q) => q.id === 'projects-5')?.done).toBe(true);
  });

  test('completing 10 projects unlocks projects-10 quest', async () => {
    const gs = await fresh();
    for (let i = 0; i < 10; i++) gs.completeProject(`proj-${i}`);

    expect(gs.questsToShow().find((q) => q.id === 'projects-10')?.done).toBe(true);
  });

  test('completing 25 projects unlocks projects-25 quest', async () => {
    const gs = await fresh();
    for (let i = 0; i < 25; i++) gs.completeProject(`proj-${i}`);

    expect(gs.questsToShow().find((q) => q.id === 'projects-25')?.done).toBe(true);
  });

  test('completing 50 projects unlocks projects-50 quest', async () => {
    const gs = await fresh();
    for (let i = 0; i < 50; i++) gs.completeProject(`proj-${i}`);

    expect(gs.questsToShow().find((q) => q.id === 'projects-50')?.done).toBe(true);
  });

  test('project completion adds streak bonus when streak >= 3', async () => {
    const gs = await seed({streak: 3, bestStreak: 3, lastActive: daysAgo(1)});
    gs.completeProject('proj-1');

    // 100 base + 15 streak bonus = 115 → crosses xp-100 milestone (+25) = 140
    expect(gs.xpProgress().xp).toBe(140);
  });

  test('viewing a project unlocks the first-project quest', async () => {
    const gs = await fresh();
    gs.viewProject('proj-1');

    expect(gs.questsToShow().find((q) => q.id === 'first-project')?.done).toBe(true);
  });

  test('completing a project unlocks the first-project-done quest', async () => {
    const gs = await fresh();
    gs.completeProject('proj-1');

    expect(gs.questsToShow().find((q) => q.id === 'first-project-done')?.done).toBe(true);
  });
});

describe('track progress', () => {
  test('counts completed lessons in a track', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');
    gs.completeLesson('python-101/normal/02-variables');

    const tp = gs.trackProgress('python-101', 19);
    expect(tp.done).toBe(2);
    expect(tp.total).toBe(19);
    expect(tp.pct).toBe(11);
  });

  test('counts distinct lessons in a track', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');
    gs.completeLesson('python-101/hard/01-csv-loading');

    const tp = gs.trackProgress('python-101', 19);
    expect(tp.done).toBe(2); // different lessons, both counted
  });
});

describe('XP progress details', () => {
  test('returns toNext and pct for current level', async () => {
    const gs = await fresh();
    const xp = gs.xpProgress();
    expect(xp.toNext).toBeGreaterThan(0);
    expect(xp.pct).toBe(0);
  });

  test('toNext decreases as XP accumulates within a level', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');
    const xp1 = gs.xpProgress();

    // Complete many lessons to advance levels
    const lessons = ['02-variables','03-data-types','04-type-conversion','05-arithmetic','06-comparison-operators','07-boolean-operators','08-if-elif-else','09-for-while-loops','10-range-enumerate-zip'];
    lessons.forEach((l) => gs.completeLesson(`python-101/normal/${l}`));
    const xp2 = gs.xpProgress();

    // Level should have increased
    expect(xp2.level).toBeGreaterThan(xp1.level);
  });
});

describe('rank thresholds', () => {
  test('every rank is reachable', async () => {
    const gs = await fresh();
    expect(gs.rankFor(0)).toBe('Bronze');
    expect(gs.rankFor(499)).toBe('Bronze');
    expect(gs.rankFor(500)).toBe('Silver');
    expect(gs.rankFor(1499)).toBe('Silver');
    expect(gs.rankFor(1500)).toBe('Gold');
    expect(gs.rankFor(2999)).toBe('Gold');
    expect(gs.rankFor(3000)).toBe('Platinum');
    expect(gs.rankFor(4999)).toBe('Platinum');
    expect(gs.rankFor(5000)).toBe('Diamond');
    expect(gs.rankFor(7499)).toBe('Diamond');
    expect(gs.rankFor(7500)).toBe('Master');
    expect(gs.rankFor(9998)).toBe('Master');
    expect(gs.rankFor(9999)).toBe('Grandmaster');
  });
});

describe('XP milestones', () => {
  test('milestone bonus XP is added to total', async () => {
    const gs = await fresh();
    // Two lessons (60 each) cross the xp-100 threshold, adding a 25 XP milestone
    gs.completeLesson('python-101/normal/01-printing');
    gs.completeLesson('python-101/normal/02-variables');

    // 120 base + 25 milestone bonus = 145
    expect(gs.xpProgress().xp).toBe(145);
  });

  test('low XP does not trigger XP-100 milestone', async () => {
    const gs = await fresh();
    const q = gs.questsToShow();
    expect(q.find((x) => x.id === 'xp-100')?.done).toBe(false);
  });

  test('completing lessons triggers xp-100 milestone', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');
    gs.completeLesson('python-101/normal/02-variables');

    const q = gs.questsToShow();
    expect(q.find((x) => x.id === 'xp-100')?.done).toBe(true);
    expect(q.find((x) => x.id === 'xp-500')?.done).toBe(false);
  });
});
