import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {isChallengeComplete, isProjectStepDone, loadState, recordChallenge, recordProjectStep} from '../../src/lib/gameState';

function storage(seed: Record<string, string>): Storage {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => '',
    length: map.size,
  } as Storage;
}

function seedState(overrides: Record<string, unknown> = {}) {
  const base = {
    version: 1,
    xp: 0,
    lessonsRun: {},
    lessonsCompleted: {},
    projectsSteps: {},
    projectsViewed: {},
    projectsCompleted: {},
    challengesCompleted: {},
    quests: {},
    badges: [],
    streak: 0,
    lastActive: '',
    activityLog: [],
  };
  const state = {...base, ...overrides};
  vi.stubGlobal('localStorage', storage({'pda:state': JSON.stringify(state)}));
}

describe('recordProjectStep', () => {
  beforeEach(() => {
    seedState();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('awards step XP and the first-step quest the first time', () => {
    const gained = recordProjectStep('street-fighter-cid', 0);
    expect(gained).toBe(15);
    const s = loadState();
    expect(s.quests['first-project-step']).toBe(true);
    expect(s.badges).toContain('Step by Step');
    expect(isProjectStepDone('street-fighter-cid', 0)).toBe(true);
  });

  test('a repeated step does not award twice', () => {
    recordProjectStep('street-fighter-cid', 0);
    const before = loadState().xp;
    const after = recordProjectStep('street-fighter-cid', 0);
    expect(after).toBe(before);
    expect(after).toBe(15);
  });

  test('tracks distinct steps and unlocks the ten-step quest', () => {
    for (let i = 0; i < 9; i++) recordProjectStep('street-fighter-cid', i);
    expect(loadState().quests['project-steps-10'] ?? false).toBe(false);
    recordProjectStep('street-fighter-cid', 9);
    const s = loadState();
    expect(s.quests['project-steps-10']).toBe(true);
    expect(s.badges).toContain('10 Steps');
  });

  test('isProjectStepDone reflects recorded steps only', () => {
    expect(isProjectStepDone('other-project', 0)).toBe(false);
    recordProjectStep('other-project', 0);
    expect(isProjectStepDone('other-project', 0)).toBe(true);
    expect(isProjectStepDone('other-project', 1)).toBe(false);
  });
});

describe('track and challenge quests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('completing every lesson in a track unlocks the track quests', () => {
    const lessonsCompleted: Record<string, boolean> = {};
    for (let i = 0; i < 19; i++) lessonsCompleted[`python-101/normal/day-${i}`] = true;
    for (let i = 0; i < 10; i++) lessonsCompleted[`data-analysis/normal/day-${i}`] = true;
    seedState({lessonsCompleted});
    const s = loadState();
    expect(s.quests['all-python']).toBe(true);
    expect(s.quests['all-data']).toBe(true);
  });

  test('recordChallenge awards once and isChallengeComplete reports it', () => {
    seedState();
    expect(isChallengeComplete('syntax-breaker')).toBe(false);
    recordChallenge('syntax-breaker');
    expect(isChallengeComplete('syntax-breaker')).toBe(true);
    const before = loadState().xp;
    recordChallenge('syntax-breaker');
    expect(loadState().xp).toBe(before);
  });

  test('streak and challenge-count quest lines unlock at their thresholds', () => {
    const challengesCompleted: Record<string, boolean> = {};
    for (let i = 0; i < 49; i++) challengesCompleted[`ch-${i}`] = true;
    seedState({
      streak: 30,
      bestStreak: 30,
      challengesCompleted,
      lessonsCompleted: {'python-101/normal/01-printing': true},
    });
    loadState(); // repairLegacy runs evaluateMilestones
    for (const id of ['streak-3', 'streak-7', 'streak-14', 'streak-30']) {
      expect(loadState().quests[id]).toBe(true);
    }
    recordChallenge('ch-50');
    expect(loadState().quests['challenges-25']).toBe(true);
    expect(loadState().quests['challenges-50']).toBe(true);
  });

  test('xp milestone quests unlock up to the ceiling', () => {
    seedState({xp: 9999, lessonsCompleted: {'python-101/normal/01-printing': true}});
    const s = loadState();
    for (const id of ['xp-100', 'xp-500', 'xp-1000', 'xp-2000', 'xp-3000', 'xp-5000', 'xp-7500', 'xp-max']) {
      expect(s.quests[id]).toBe(true);
    }
  });
});