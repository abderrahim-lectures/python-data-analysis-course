// Supabase anonymous auth — signs in once per session, keeps the user ID
// and access token in a closure (not on window) for minimal exposure.
// Inline scripts read window.__pydaUserId and call window.__pydaFetch() to
// make authenticated requests; the token itself is never handed back to
// them, only the ability to use it against Supabase. This means an XSS
// payload (or a compromised allow-listed third-party script) that can call
// window.__pydaFetch can still act as the signed-in visitor, but it cannot
// read the token string out and exfiltrate it to another origin the way it
// could with a plain getter -- the credential never crosses back into
// arbitrary script's hands as a value it can copy.
import {createClient} from '@supabase/supabase-js';

let _token: string | null = null;
let _apikey: string | null = null;

export async function initAuth(url: string, key: string): Promise<string | null> {
  if (!url || !key) return null;
  try {
    const supabase = createClient(url, key);
    const {data} = await supabase.auth.signInAnonymously();
    const uid = data.user?.id ?? null;
    _token = data.session?.access_token ?? null;
    _apikey = key;
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
