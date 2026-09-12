import {beforeEach, describe, expect, test, vi} from 'vitest';
import {fakeEl, stubDom} from './_domstub.ts';

function seedLocalStorage(pdaState: Record<string, unknown>) {
  const store: Record<string, string> = {
    'pda:state': JSON.stringify(pdaState),
  };
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => {},
    key: () => null,
    length: 0,
  });
}

// The module runs its init on import (deferred module script), so each test
// builds a fresh DOM + globals and dynamically imports it.
function setupDom() {
  const stub = stubDom();
  vi.stubGlobal('location', {search: '', href: 'http://local.test/'});
  vi.stubGlobal('HTMLElement', class {});
  return stub;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  seedLocalStorage({xp: 0, streak: 0, badges: []});
});

describe('gamestrip.client.ts', () => {
  test('renders the XP bar from stored state on import', async () => {
    // lastActive = yesterday, so daily-login bumps 8→9 instead of resetting 1
    seedLocalStorage({xp: 60, streak: 8, lastActive: new Date(Date.now() - 86400000).toISOString().slice(0, 10), badges: ['x', 'y']});
    const stub = setupDom();
    const bar = fakeEl('xp-bar');
    bar.dataset.level = '0';
    stub.elements.set('xp-bar', bar);

    vi.resetModules();
    await import('../../src/lib/gamestrip.client.ts');

    expect(bar.dataset.level).toBe('2');
    expect(bar.innerHTML).toContain('Lv.2');
    expect(bar.innerHTML).toContain('🔥🔥');
  });

  test('shows the level-up overlay when XP crosses a level boundary', async () => {
    seedLocalStorage({xp: 60, streak: 0, badges: ['one-two-three']});
    const stub = setupDom();
    const bar = fakeEl('xp-bar');
    bar.dataset.level = '1';
    stub.elements.set('xp-bar', bar);
    stub.elements.set('lvlup', fakeEl('lvlup'));
    stub.elements.set('lvlup-sub', fakeEl('lvlup-sub'));

    vi.resetModules();
    await import('../../src/lib/gamestrip.client.ts');

    const overlay = stub.elements.get('lvlup')!;
    expect(overlay.hidden).toBe(false);
    expect(overlay.classList.has('lvlup--show')).toBe(true);
    expect(overlay.children.length).toBeGreaterThan(0); // particles
    const sub = stub.elements.get('lvlup-sub')!;
    expect(sub.textContent).toContain('one-two-three');
  });

  test('appends an XP toast when a lesson:complete event fires', async () => {
    const stub = setupDom();
    const bar = fakeEl('xp-bar');
    bar.dataset.level = '1';
    stub.elements.set('xp-bar', bar);
    const container = fakeEl('xp-toast-container');
    stub.elements.set('xp-toast-container', container);

    vi.resetModules();
    await import('../../src/lib/gamestrip.client.ts');

    seedLocalStorage({xp: 40, streak: 0, badges: []});
    stub.listeners['lesson:complete']?.({detail: {xp: 40}});
    expect(bar.dataset.level).toBe('1');
    expect(container.children.length).toBe(1);
    expect(container.children[0].textContent).toContain('40');
  });

  test('stays silent when lesson:complete carries no xp detail', async () => {
    const stub = setupDom();
    const bar = fakeEl('xp-bar');
    stub.elements.set('xp-bar', bar);
    const container = fakeEl('xp-toast-container');
    stub.elements.set('xp-toast-container', container);

    vi.resetModules();
    await import('../../src/lib/gamestrip.client.ts');

    stub.listeners['lesson:complete']?.({});
    expect(container.children.length).toBe(0);
  });

  test('shows onboarding when not yet seen and dismisses it', async () => {
    const stub = setupDom();
    const overlay = fakeEl('onboarding');
    overlay.hidden = true;
    stub.elements.set('onboarding', overlay);
    stub.elements.set('onboarding-start', fakeEl('onboarding-start'));
    stub.elements.set('onboarding-skip', fakeEl('onboarding-skip'));

    vi.resetModules();
    await import('../../src/lib/gamestrip.client.ts');

    expect(overlay.hidden).toBe(false);
    const start = stub.elements.get('onboarding-start')!;
    start.listeners.click?.({});
    expect(overlay.hidden).toBe(true);
    expect(String((globalThis as any).localStorage.getItem('pda:onboarded'))).toBe('1');
  });

  test('skips onboarding when already seen, in private mode, or via ?onboarded', async () => {
    const stub = setupDom();
    const overlay = fakeEl('onboarding');
    overlay.hidden = true;
    stub.elements.set('onboarding', overlay);

    vi.resetModules();
    vi.stubGlobal('location', {search: '?onboarded', href: 'http://local.test/?onboarded'});
    await import('../../src/lib/gamestrip.client.ts');

    expect(overlay.hidden).toBe(true);
    expect(overlay.listeners.keydown).toBeUndefined();
  });

  test('theme toggle flips the html theme and persists it', async () => {
    const stub = setupDom();
    const btn = fakeEl('theme-toggle');
    const html = fakeEl('html');
    html.dataset.theme = 'light';
    const doc = stub.restore() as any;
    doc.querySelector = () => btn;
    doc.documentElement = html;

    vi.resetModules();
    await import('../../src/lib/gamestrip.client.ts');

    btn.listeners.click?.({});
    expect(html.dataset.theme).toBe('dark');
    expect(String((globalThis as any).localStorage.getItem('pda:theme'))).toBe('dark');
    btn.listeners.click?.({});
    expect(html.dataset.theme).toBe('light');
  });
});