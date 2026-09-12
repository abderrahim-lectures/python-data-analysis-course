import {beforeEach, describe, expect, test} from 'vitest';
import {el, fakeEl, stubDom} from './_domstub.ts';
import {renderHomepage} from '../../src/lib/homeRender.ts';
import {loadState, saveState} from '../../src/lib/gameState.ts';
import {levelForXp} from '../../src/lib/levelMath.ts';

function seedLocalStorage() {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
    key: () => null,
    length: Object.keys(store).length,
  };
}

beforeEach(() => {
  seedLocalStorage();
  stubDom();
});

function withState(xp: number, streak: number, pythonDone: string[], dataDone: string[]) {
  const s = loadState();
  s.xp = xp;
  s.streak = streak;
  s.bestStreak = streak;
  s.lessonsCompleted = Object.fromEntries([...pythonDone, ...dataDone].map((k) => [k, true]));
  saveState(s);
}

describe('renderHomepage', () => {
  test('writes level/xp/next/fill and rank for the current state', () => {
    withState(90, 0, ['python-101/normal/01-printing'], ['data-analysis/normal/01-series']);
    const stub = stubDom();
    const level = el('player-level', stub);
    const xp = el('player-xp', stub);
    const xpnext = el('player-xpnext', stub);
    const xpfill = el('player-xpfill', stub);
    const rank = el('player-rank', stub);

    renderHomepage();

    expect(level.textContent).toBe(String(levelForXp(90)));
    expect(xp.textContent).toBe('90');
    expect(Number(xpnext.textContent)).toBeGreaterThan(0);
    expect(xpfill.style.width).toMatch(/%$/);
    expect(rank.innerHTML).toContain('badge badge--streak');
    expect(rank.innerHTML).toContain('Bronze');
  });

  test('falls through quietly when DOM nodes are absent', () => {
    seedLocalStorage();
    stubDom();
    expect(() => renderHomepage()).not.toThrow();
  });

  test('badges count + gamestrip streak classes', () => {
    withState(50, 8, ['python-101/normal/01-printing'], []);
    const stub = stubDom();
    const s = loadState();
    s.badges = ['a', 'b'];
    saveState(s);
    const gsLevel = el('gs-level-val', stub);
    const gsStreak = el('gs-streak-val', stub);
    const gsBadges = el('gs-badges-val', stub);
    const gsXp = el('gs-xp-val', stub);
    const streakItem = el('gs-streak', stub);

    renderHomepage();

    expect(gsLevel.textContent).toBe(String(levelForXp(50)));
    expect(gsStreak.textContent).toBe('8');
    expect(gsBadges.textContent).toBe('2');
    expect(gsXp.textContent).toBe('50');
    expect(streakItem.classSet.has('gamestrip__item--blazing')).toBe(true);
    expect(streakItem.classSet.has('gamestrip__item--hot')).toBe(false);
  });

  test('hot (>=3) but not blazing at streak 3', () => {
    withState(50, 3, [], []);
    const stub = stubDom();
    const streakItem = el('gs-streak', stub);
    renderHomepage();
    expect(streakItem.classSet.has('gamestrip__item--hot')).toBe(true);
    expect(streakItem.classSet.has('gamestrip__item--blazing')).toBe(false);
  });

  test('hub progress fills scale against real lesson totals (29/20)', () => {
    withState(0, 0, ['python-101/normal/01-printing', 'python-101/normal/02-strings'], []);
    const stub = stubDom();
    const pythonFill = el('hub-python', stub);
    const dataFill = el('hub-data', stub);
    renderHomepage();
    expect(pythonFill.style.width).toBe((2 / 29 * 100) + '%');
    expect(dataFill.style.width).toBe('0%');
  });

  test('missing progress bars are skipped', () => {
    withState(0, 0, [], []);
    const stub = stubDom();
    const pythonFill = el('hub-python', stub);
    stub.elements.delete('hub-data');
    renderHomepage();
    expect(pythonFill.style.width).toBe('0%');
  });
});

describe('export sanity', () => {
  test('renderHomepage is callable', () => {
    expect(typeof renderHomepage).toBe('function');
  });
});