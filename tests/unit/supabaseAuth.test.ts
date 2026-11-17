import {beforeEach, describe, expect, test, vi} from 'vitest';

// The Supabase client library was replaced by two REST calls, so its behaviour
// -- session reuse, refresh, and falling back to a fresh sign-in -- is now
// this module's responsibility and needs its own tests. The regression that
// matters most is the one that shipped once: signing in unconditionally on
// every page load creates a new anonymous user each time.
const URL = 'https://ref.supabase.co';
const KEY = 'anon-key';
const STORAGE_KEY = 'sb-ref-auth-token';

type Stored = Record<string, string>;

function stubFetch(handler: (url: string, init?: RequestInit) => any) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    calls.push(String(url));
    const body = handler(String(url), init);
    return {ok: body !== undefined, status: body === undefined ? 400 : 200, json: async () => body};
  });
  return calls;
}

function stubDom() {
  const dispatched: string[] = [];
  vi.stubGlobal('window', {} as any);
  vi.stubGlobal('document', {
    dispatchEvent: (e: any) => { dispatched.push(e.type); return true; },
  });
  return dispatched;
}

let store: Stored;
beforeEach(() => {
  store = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  });
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  });
});

const fresh = async () => {
  vi.resetModules();
  return import('../../src/lib/supabaseAuth.ts');
};

const session = (token: string, expiresIn = 3600) => ({
  access_token: token,
  refresh_token: 'refresh-' + token,
  expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  user: {id: 'user-1'},
});

describe('anonymous auth without the Supabase client', () => {
  test('signs in anonymously on a first visit and persists the session', async () => {
    stubDom();
    const calls = stubFetch((url) => (url.includes('/auth/v1/signup') ? session('T1') : undefined));
    const {initAuth} = await fresh();

    expect(await initAuth(URL, KEY)).toBe('user-1');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('/auth/v1/signup');
    expect(JSON.parse(store[STORAGE_KEY]).access_token).toBe('T1');
  });

  test('reuses a persisted session instead of minting a new user', async () => {
    // This is the regression: the old code called signInAnonymously() on every
    // load, creating one Supabase user per navigation.
    stubDom();
    store[STORAGE_KEY] = JSON.stringify(session('T-STORED'));
    const calls = stubFetch(() => undefined);
    const {initAuth} = await fresh();

    expect(await initAuth(URL, KEY)).toBe('user-1');
    expect(calls).toHaveLength(0);
  });

  test('refreshes an expiring token rather than signing in again', async () => {
    stubDom();
    store[STORAGE_KEY] = JSON.stringify(session('T-OLD', -10)); // already expired
    const calls = stubFetch((url) => (url.includes('grant_type=refresh_token') ? session('T-NEW') : undefined));
    const {initAuth} = await fresh();

    expect(await initAuth(URL, KEY)).toBe('user-1');
    expect(calls[0]).toContain('grant_type=refresh_token');
    expect(JSON.parse(store[STORAGE_KEY]).access_token).toBe('T-NEW');
  });

  test('falls back to a fresh sign-in when the refresh token is rejected', async () => {
    stubDom();
    store[STORAGE_KEY] = JSON.stringify(session('T-DEAD', -10));
    const calls = stubFetch((url) => (url.includes('/auth/v1/signup') ? session('T-FRESH') : undefined));
    const {initAuth} = await fresh();

    expect(await initAuth(URL, KEY)).toBe('user-1');
    expect(calls.some((c) => c.includes('refresh_token'))).toBe(true);
    expect(calls.some((c) => c.includes('/auth/v1/signup'))).toBe(true);
  });

  test('accepts the {current: session} envelope older clients wrote', async () => {
    stubDom();
    store[STORAGE_KEY] = JSON.stringify({current: session('T-WRAPPED')});
    const calls = stubFetch(() => undefined);
    const {initAuth} = await fresh();

    expect(await initAuth(URL, KEY)).toBe('user-1');
    expect(calls).toHaveLength(0);
  });

  test('returns null and stays silent when credentials are absent', async () => {
    stubDom();
    const calls = stubFetch(() => session('T'));
    const {initAuth} = await fresh();

    expect(await initAuth('', '')).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test('dispatches auth-ready so listeners can start', async () => {
    const dispatched = stubDom();
    stubFetch((url) => (url.includes('/auth/v1/signup') ? session('T1') : undefined));
    const {initAuth} = await fresh();

    await initAuth(URL, KEY);
    expect(dispatched).toContain('pyda:auth-ready');
    expect((globalThis as any).window.__pydaUserId).toBe('user-1');
  });

  test('never exposes the token on window', async () => {
    stubDom();
    stubFetch((url) => (url.includes('/auth/v1/signup') ? session('SECRET-TOKEN') : undefined));
    const {initAuth} = await fresh();

    await initAuth(URL, KEY);
    // The credential stays in the module closure; only __pydaFetch is public.
    const serialized = JSON.stringify((globalThis as any).window);
    expect(serialized).not.toContain('SECRET-TOKEN');
    expect(typeof (globalThis as any).window.__pydaFetch).toBe('function');
  });
});
