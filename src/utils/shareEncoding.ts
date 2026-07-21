import type {SharePayload} from '@site/src/types/share';

/** URL-safe base64 encode/decode for the compact SharePayload — all client-side, no backend. */
export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}
