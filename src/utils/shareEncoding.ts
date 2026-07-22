import type {SharePayload} from '@site/src/types/share';

/** URL-safe base64 encode/decode for the compact SharePayload — all client-side, no backend. */
export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const MAX_STRING_LENGTH = 200;
const MAX_COUNT = 10_000;

function isValidCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_COUNT;
}

function isValidOptionalString(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.length <= MAX_STRING_LENGTH);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidOptionalDate(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && ISO_DATE_RE.test(value));
}

/**
 * `data=` comes straight from a URL a student pastes somewhere (WhatsApp,
 * social media) — anyone can craft one by hand, so this can't just trust
 * `JSON.parse(json) as SharePayload` (a compile-time-only cast, no runtime
 * check). Rendering an unvalidated payload's `name` directly as a JSX child
 * (see SharedProgressCard) would crash the page if it turned out to be an
 * object or array instead of a string — not a code-execution risk (React
 * escapes text content, and nothing here uses dangerouslySetInnerHTML), but
 * a real, easy-to-trigger "open this link and the page breaks" one. Bounded
 * string/number ranges here also stop a payload from carrying absurdly large
 * values that would just look broken once rendered.
 */
function isValidSharePayload(value: unknown): value is SharePayload {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    isValidOptionalString(p.name) &&
    typeof p.studentId === 'string' &&
    p.studentId.length <= MAX_STRING_LENGTH &&
    isValidCount(p.completedCount) &&
    isValidCount(p.totalCount) &&
    isValidCount(p.badgeCount) &&
    typeof p.completed === 'boolean' &&
    isValidOptionalDate(p.date)
  );
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(base64)));
    const parsed: unknown = JSON.parse(json);
    return isValidSharePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
