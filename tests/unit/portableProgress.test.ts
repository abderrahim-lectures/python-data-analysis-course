import {beforeEach, describe, expect, test, vi} from 'vitest';

// Progress lives only in localStorage, so a cleared browser or a new device
// loses everything. The portable code is the escape hatch, and it has to
// survive two things in particular: lesson ids containing Arabic path
// segments (btoa alone throws on those), and a paste that is malformed or
// truncated (which must return a result, never throw into the UI).
let store: Record<string, string>;

beforeEach(() => {
  store = {};
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  });
});

const fresh = async () => {
  vi.resetModules();
  return import('../../src/lib/gameState.ts');
};

describe('portable progress', () => {
  test('round-trips XP and completed lessons', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');
    const code = gs.exportProgress();
    expect(code.startsWith('PDA1:')).toBe(true);

    // Wipe the device, then restore.
    store = {};
    const gs2 = await fresh();
    expect(gs2.loadState().xp).toBe(0);

    const result = gs2.importProgress(code);
    expect(result.ok).toBe(true);
    const restored = gs2.loadState();
    expect(restored.xp).toBeGreaterThan(0);
    expect(restored.lessonsCompleted['python-101/normal/01-printing']).toBeTruthy();
  });

  test('survives lesson ids with Arabic path segments', async () => {
    // btoa() throws on anything above U+00FF, and every Arabic lesson id has
    // those characters, so a naive base64 here would break on real data.
    const gs = await fresh();
    gs.completeLesson('ar/تعلم/python-101/عادي/دروس/01-printing');
    const code = gs.exportProgress();
    store = {};
    const gs2 = await fresh();
    expect(gs2.importProgress(code).ok).toBe(true);
    expect(Object.keys(gs2.loadState().lessonsCompleted)
      .some((k) => k.includes('تعلم'))).toBe(true);
  });

  test('merges rather than discarding what the device already had', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');
    const code = gs.exportProgress();
    const xpAtExport = gs.loadState().xp;

    // A different device that already earned more XP keeps its own total.
    store = {};
    const gs2 = await fresh();
    gs2.completeLesson('python-101/normal/02-variables');
    gs2.completeLesson('python-101/normal/03-data-types');
    const xpBefore = gs2.loadState().xp;

    gs2.importProgress(code);
    const merged = gs2.loadState();
    expect(merged.xp).toBeGreaterThanOrEqual(Math.max(xpBefore, xpAtExport));
    // Both devices' lessons are present.
    expect(merged.lessonsCompleted['python-101/normal/01-printing']).toBeTruthy();
    expect(merged.lessonsCompleted['python-101/normal/02-variables']).toBeTruthy();
  });

  test.each([
    ['empty', ''],
    ['wrong prefix', 'hello world'],
    ['prefix only', 'PDA1:'],
    ['not base64', 'PDA1:!!!!not-base64!!!!'],
    ['valid base64, not JSON', 'PDA1:' + Buffer.from('not json').toString('base64')],
    ['JSON with the wrong version', 'PDA1:' + Buffer.from(JSON.stringify({v: 9, xp: 1})).toString('base64')],
  ])('rejects a %s code without throwing', async (_label, code) => {
    const gs = await fresh();
    const result = gs.importProgress(code);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    // The device state must be untouched by a bad paste.
    expect(gs.loadState().xp).toBe(0);
  });

  test('a rejected import leaves existing progress intact', async () => {
    const gs = await fresh();
    gs.completeLesson('python-101/normal/01-printing');
    const before = gs.loadState().xp;
    gs.importProgress('PDA1:garbage');
    expect(gs.loadState().xp).toBe(before);
  });
});
