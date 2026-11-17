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

async function fresh() {
  vi.resetModules();
  installLocalStorage();
  const gs = await import('../../src/lib/gamestats.ts');
  const state = await import('../../src/lib/gameState.ts');
  return {gs, state};
}

describe('TRACKS totals stay the single source of truth', () => {
  test('three tracks with the real lesson counts (normal + hard)', async () => {
    const {gs} = await fresh();
    expect(gs.TRACKS).toEqual([
      {id: 'python-101', label: 'Python 101', total: 29},
      {id: 'data-analysis', label: 'Pandas & Data', total: 20},
      {id: 'statistics-101', label: 'Statistics 101', total: 19},
    ]);
  });

  test('every module lessonCount matches the lessons that name it', async () => {
    // A module page prints "N lessons"; a stale count contradicts the list
    // directly beneath it. Four were wrong when this was added: relationships
    // said 3 for 2 lessons, samples-and-uncertainty said 3 for 6,
    // applied-statistics said 2 for 4, and inference-and-reporting said 2
    // for 0 because its lessons were attributed to the wrong module.
    const {readdirSync, readFileSync} = await import('node:fs');
    const {join} = await import('node:path');
    const mismatches: string[] = [];
    for (const section of ['statistics-101']) {
      for (const track of ['normal', 'hard']) {
        const mdir = `src/content/modules/${section}/${track}`;
        const ldir = `src/content/lessons/${section}/${track}`;
        for (const f of readdirSync(mdir)) {
          const src = readFileSync(join(mdir, f), 'utf8');
          const declared = Number(/^lessonCount:\s*(\d+)$/m.exec(src)?.[1]);
          const key = f.replace(/^module-\d+-/, '').replace(/\.md$/, '');
          const actual = readdirSync(ldir).filter((l) =>
            new RegExp(`^module:\\s*"?${key}"?$`, 'm').test(readFileSync(join(ldir, l), 'utf8')),
          ).length;
          if (declared !== actual) mismatches.push(`${track}/${f}: says ${declared}, has ${actual}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  test('every declared total matches the lesson files on disk', async () => {
    // The total is a denominator: a stale one silently caps a progress bar at
    // under 100% forever. Count the markdown instead of trusting the literal.
    const {readdirSync} = await import('node:fs');
    const {gs} = await fresh();
    for (const t of gs.TRACKS) {
      const dir = `src/content/lessons/${t.id}`;
      const count = readdirSync(dir, {recursive: true} as never)
        .filter((f: unknown) => String(f).endsWith('.md')).length;
      expect(count, `${t.id} lesson files`).toBe(t.total);
    }
  });
});

describe('computeGameStats', () => {
  test('fresh state → level 1, bronze, zero lanes', async () => {
    const {gs} = await fresh();
    const r = gs.computeGameStats();
    expect(r.level).toBe(1);
    expect(r.rank).toBe('Bronze');
    expect(r.xpToNext).toBeGreaterThan(0);
    expect(r.lanes.map((l: {id: string}) => l.id)).toEqual(['python-101', 'data-analysis', 'statistics-101']);
    expect(r.lanes.reduce((a: number, l: {done: number}) => a + l.done, 0)).toBe(0);
    expect(r.quiz).toEqual({correct: 0, total: 0, winRate: 0});
    expect(r.badges).toEqual([]);
  });

  test('fresh state is a zeroed, structurally complete report', async () => {
    const {gs} = await fresh();
    const e = gs.computeGameStats();
    expect(e.level).toBe(1);
    expect(e.xp).toBe(0);
    expect(e.lessonsDone).toBe(0);
    expect(e.streak).toBe(0);
    expect(e.bestStreak).toBe(0);
    expect(e.kda.ratio).toBe(0);
    expect(e.questsTotal).toBeGreaterThan(0);
    expect(e.questsDone).toBe(0);
    expect(e.lanes).toHaveLength(3);
    for (const lane of e.lanes) {
      expect(lane.done).toBe(0);
      expect(lane.pct).toBe(0);
    }
    expect(e.diagnostics.improvementPct).toBe(0);
    expect(e.activity.daysActive).toBe(0);
    expect(e.engagement.returnRate).toBe(0);
  });

  test('reflects seeded lessons + quizzes', async () => {
    const {gs, state} = await fresh();
    const s = state.loadState();
    s.lessonsCompleted = {'python-101/normal/01-printing': true};
    s.quizCorrect = 3;
    s.quizTotal = 5;
    s.streak = 2;
    s.bestStreak = 4;
    state.saveState(s);

    const r = gs.computeGameStats();
    expect(r.lessonsDone).toBe(1);
    expect(r.lessonsTotal).toBe(gs.TRACKS.reduce((a: number, t: {total: number}) => a + t.total, 0));
    expect(r.lanes[0].done).toBe(1);
    expect(r.lanes[0].total).toBe(29);
    expect(r.lanes[1].done).toBe(0);
    expect(r.quiz.winRate).toBe(60);
    expect(r.quiz.correct).toBe(3);
    expect(r.kda.kills).toBe(3);
    expect(r.kda.deaths).toBe(2);
    expect(r.kda.assists).toBe(1);
    expect(r.kda.label).not.toBe('');
    expect(r.streak).toBe(2);
    expect(r.bestStreak).toBe(4);
  });

  test('diagnostic percentages are clamped to [0, 100]', async () => {
    const {gs, state} = await fresh();
    const s = state.loadState();
    // Extreme-but-legal intensities: all lessons done, perfect quiz, long streak
    s.lessonsCompleted = Object.fromEntries(
      gs.TRACKS.flatMap((t: {id: string; total: number}) =>
        Array.from({length: t.total}, (_, i) => [`${t.id}/normal/day-${i}`, true]),
      ),
    );
    s.quizTotal = s.quizCorrect = 100;
    s.lessonsRun = s.lessonsCompleted;
    s.streak = s.bestStreak = 30;
    s.quests = Object.fromEntries(Array.from({length: 11}, (_, i) => [`q${i}`, true]));
    state.saveState(s);

    const r = gs.computeGameStats();
    for (const k of ['improvementPct', 'acceptancePct', 'usefulnessPct', 'learningExperiencePct']) {
      expect(r.diagnostics[k as keyof typeof r.diagnostics]).toBeLessThanOrEqual(100);
      expect(r.diagnostics[k as keyof typeof r.diagnostics]).toBeGreaterThanOrEqual(0);
    }
    expect(r.lessonsDone).toBe(gs.TRACKS.reduce((a: number, t: {total: number}) => a + t.total, 0));
    expect(r.lanes[0].done).toBe(29);
    expect(r.lanes[1].done).toBe(20);
    expect(r.lanes[2].done).toBe(19);
    expect(r.activity.daysActive).toBeGreaterThan(0);
    expect(r.engagement.longestSession).toBeLessThanOrEqual(5);
  });

  test('KDA label buckets Legend and On Fire', async () => {
    const {gs, state} = await fresh();
    let s = state.loadState();
    s.quizCorrect = 5;
    s.quizTotal = 5;
    state.saveState(s);
    expect(gs.computeGameStats().kda.label).toBe('Legend');

    s = state.loadState();
    s.quizCorrect = 3;
    s.quizTotal = 4;
    state.saveState(s);
    expect(gs.computeGameStats().kda.label).toBe('On Fire');
  });

  test('returnRate counts returning days when activity spans multiple days', async () => {
    const {gs, state} = await fresh();
    const s = state.loadState();
    s.lessonsCompleted = {
      'python-101/normal/01-printing': true,
      'python-101/normal/02-variables': true,
      'python-101/normal/03-strings': true,
    };
    // Two calendar days before the current UTC date: daysSinceStart is 3 at
    // any time of day (ceil topology), keeping returnRate deterministic and
    // independent of when the suite runs.
    const twoDaysAgoIso = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    s.lastActive = twoDaysAgoIso;
    state.saveState(s);

    const r = gs.computeGameStats();
    expect(r.activity.daysActive).toBeGreaterThan(1);
    expect(r.engagement.returnRate).toBe(100);
  });

  test('zero XP on a day with no activity keeps daysActive at 0', async () => {
    const {gs} = await fresh();
    const r = gs.computeGameStats();
    expect(r.activity.daysActive).toBe(0);
    expect(r.activity.avgXpPerDay).toBe(0);
    expect(r.engagement.returnRate).toBe(0);
    expect(r.engagement.streakLength).toBe(0);
  });
});
describe('the activity window', () => {
  test('starts at the first logged action, not at the last active day', async () => {
    const {gs, state} = await fresh();
    const s = state.loadState();
    s.lessonsCompleted = {
      'python-101/normal/01-printing': true,
      'python-101/normal/02-variables': true,
    };
    // A reader is, by definition, active today: lastActive is today. The span
    // must come from the log, or every metric collapses to "day 1".
    s.lastActive = new Date().toISOString().slice(0, 10);
    s.activityLog = [{ts: Date.now() - 10 * 86400000, type: 'lesson-complete', label: 'x', xp: 10}];
    state.saveState(s);

    const r = gs.computeGameStats();
    // 2 lessons over ~10 days → ~1.4/week, and 2 active days out of 10.
    expect(r.activity.lessonsPerWeek).toBeLessThanOrEqual(2);
    expect(r.engagement.returnRate).toBeLessThan(100);
  });
});
