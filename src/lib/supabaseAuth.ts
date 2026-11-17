// Supabase anonymous auth, spoken directly to the auth REST endpoint.
//
// This module used to import `@supabase/supabase-js`, which is ~57 KB gzipped
// and was loaded on all 1,426 pages for three calls: read a persisted session,
// sign in anonymously, and attach headers to a fetch. The client also carries
// storage adapters, a realtime client, WebAuthn and functions plumbing that
// this site never touches, so it was 99% unused weight on every page.
//
// The anonymous sign-in flow is two requests, so it is written out here:
//
//   POST {url}/auth/v1/signup   {}                    -> session + user
//   POST {url}/auth/v1/token?grant_type=refresh_token -> fresh access token
//
// The session is persisted in localStorage under the same key the library
// used (`sb-<ref>-auth-token`), so a visitor who signed in before this change
// keeps their identity instead of looking like a new learner.
//
// The token stays in this module's closure (not on window). Inline scripts
// read `window.__pydaUserId` and call `window.__pydaFetch()`; the credential
// itself never crosses back into arbitrary script's hands as a value it can
// copy and exfiltrate, though a same-origin script could still act as the
// signed-in visitor through __pydaFetch.

interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user?: {id?: string};
}

let _token: string | null = null;
let _apikey: string | null = null;
let _url: string = '';

/** The localStorage key supabase-js uses: `sb-<project-ref>-auth-token`.
 *  Kept identical so an existing session survives this rewrite. */
function storageKey(url: string): string {
  const ref = /^https?:\/\/([^.]+)\./.exec(url)?.[1] ?? 'anon';
  return `sb-${ref}-auth-token`;
}

function readStored(url: string): Session | null {
  try {
    const raw = localStorage.getItem(storageKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // supabase-js has stored this both as the session itself and wrapped in a
    // `{current: session}` envelope across versions; accept either.
    const s = parsed?.current ?? parsed;
    return s?.access_token ? (s as Session) : null;
  } catch {
    return null;
  }
}

function writeStored(url: string, session: Session): void {
  try {
    localStorage.setItem(storageKey(url), JSON.stringify(session));
  } catch { /* private mode: the session still works for this page */ }
}

/** True when the token is close enough to expiry to be worth refreshing. */
function needsRefresh(s: Session): boolean {
  if (!s.expires_at) return false;
  // 60s of slack, so a token cannot expire between this check and the request.
  return s.expires_at * 1000 - Date.now() < 60_000;
}

async function postJson(url: string, key: string, body?: unknown): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`auth ${res.status}`);
  return res.json();
}

async function refresh(url: string, key: string, refreshToken: string): Promise<Session> {
  return postJson(`${url}/auth/v1/token?grant_type=refresh_token`, key, {refresh_token: refreshToken});
}

async function signInAnonymously(url: string, key: string): Promise<Session> {
  return postJson(`${url}/auth/v1/signup`, key, {});
}

export async function initAuth(url: string, key: string): Promise<string | null> {
  if (!url || !key) return null;
  _url = url;
  _apikey = key;
  try {
    // Reuse the persisted anonymous session when there is one. Signing in
    // unconditionally creates a *new* Supabase user on every page load: it
    // inflated the users table by one row per navigation, reset the per-user
    // rate limit on every reload, and made "learners online" count loads
    // rather than learners.
    let session = readStored(url);

    if (session && needsRefresh(session) && session.refresh_token) {
      try {
        session = await refresh(url, key, session.refresh_token);
        writeStored(url, session);
      } catch {
        // A rejected refresh token means the session is gone; fall through and
        // sign in again rather than leaving the visitor without an identity.
        session = null;
      }
    }

    if (!session?.access_token) {
      session = await signInAnonymously(url, key);
      writeStored(url, session);
    }

    const uid = session?.user?.id ?? null;
    _token = session?.access_token ?? null;
    if (uid) {
      (window as any).__pydaUserId = uid;
      document.dispatchEvent(new Event('pyda:auth-ready'));
    }
    return uid;
  } catch {
    return null;
  }
}

// Fetch wrapper for is:inline scripts (which can't import this module
// directly): merges the current apikey + Authorization headers into the
// caller's own init.headers and performs the request, so the token itself
// never has to be returned to the caller.
function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (_apikey) headers.set('apikey', _apikey);
  headers.set('Authorization', 'Bearer ' + (_token || _apikey || ''));
  return fetch(url, {...init, headers});
}

(window as any).__pydaFetch = authedFetch;

/** For tests: the current in-memory token, without exposing it on window. */
export function _currentTokenForTests(): string | null {
  return _token;
}

/** For tests: reset module state between cases. */
export function _resetForTests(): void {
  _token = null;
  _apikey = null;
  _url = '';
}
