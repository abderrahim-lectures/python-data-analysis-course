import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';

// The 404 page recovers from double-encoded URLs by decoding twice and
// redirecting. It used to redirect to whatever came out, which a crafted
// path turned into an off-site redirect: `/%2F%2Fevil.example/%C3%83%C2%A9`
// decodes twice to `///evil.example/é`, and `location.replace('///evil.example/é')`
// resolves as protocol-relative to https://evil.example/. The address bar
// shows the trusted domain right up to the bounce, which is a usable phishing
// primitive. The guard below is the fix.
const PAGE = readFileSync('src/pages/404.astro', 'utf8');

describe('404 recovery redirect stays on this origin', () => {
  test('the redirect is guarded, not unconditional', () => {
    expect(PAGE).toContain('var safe = twice.charAt(0)');
    // The guard refuses a backslash anywhere in the decoded path, because
    // browsers normalise `\` to `/` and `/\evil.example` is protocol-relative.
    expect(PAGE).toContain("twice.indexOf('\\\\') === -1");
  });

  test('the guard rejects protocol-relative and backslash paths', () => {
    // Mirror the inline guard so the shapes are pinned even if the source moves.
    const allowed = (p: string) =>
      p.charAt(0) === '/' && p.charAt(1) !== '/' && p.charAt(1) !== '\\' && p.indexOf('\\') === -1;
    expect(allowed('///evil.example/é')).toBe(false);
    expect(allowed('//evil.example')).toBe(false);
    expect(allowed('/\\evil.example')).toBe(false);
    expect(allowed('/ar/تعلم')).toBe(true);
    expect(allowed('/projects/ai-agent')).toBe(true);
    expect(allowed('/es/proyectos/x?a=1')).toBe(true);
  });

  test('the double-decode that produced the escape is still needed and present', () => {
    // Removing the decode would break the legitimate case it exists for:
    // a UTF-8 path that was percent-encoded twice.
    expect(PAGE).toContain('decodeURIComponent(escape(String.fromCharCode.apply(null, bytes)))');
  });
});
