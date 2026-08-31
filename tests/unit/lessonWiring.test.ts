import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';

// These guard the wiring bugs that made progress tracking silently dead:
// the completion button existed on only the last week of a track, and the
// lesson id never reached the code cells that award XP.

const WEEK_TEMPLATES = [
  'src/pages/learn/[section]/[track]/[week].astro',
  'src/pages/es/aprender/[section]/[track]/[week].astro',
  'src/pages/fr/apprendre/[section]/[track]/[week].astro',
  'src/pages/ar/تعلم/[section]/[track]/[week].astro',
];

describe.each(WEEK_TEMPLATES)('%s', (path) => {
  const src = readFileSync(path, 'utf8');

  test('declares the lesson id on the article so code cells can award XP', () => {
    expect(src).toContain('data-lesson-id={lessonId}');
  });

  test('builds the lesson id from canonical section/track, not the localized URL words', () => {
    expect(src).toContain('const lessonId = `${section}/${track}/week-${week}`;');
  });

  test('offers the completion button on every week, not only the last', () => {
    // The bug: the button lived in the `next ? ... : ...` else-branch, so it
    // only rendered when there was no next week.
    const button = src.slice(src.indexOf('data-mark-complete'));
    expect(src).toContain('data-mark-complete');
    expect(button).not.toMatch(/^\s*:/);
  });

  test('reflects already-saved completion when the page loads', () => {
    expect(src).toContain('isLessonComplete');
  });

  test('uses localized completion labels', () => {
    expect(src).toContain('ps.markComplete');
    expect(src).toContain('ps.completed');
  });
});

describe('runnable cells', () => {
  const src = readFileSync('src/lib/runnable-cell.client.ts', 'utf8');

  test('falls back to the page lesson id for markdown-generated cells', () => {
    // Cells built from ```python fences carry no data-lesson attribute, so
    // without this fallback running code awarded nothing.
    expect(src).toContain("document.querySelector('[data-lesson-id]')");
  });

  test('screens code through the bridge guard before executing', () => {
    expect(src).toContain('usesJsBridge(src)');
    expect(src.indexOf('usesJsBridge(src)')).toBeLessThan(src.indexOf('runPythonAsync'));
  });
});

describe('playground', () => {
  // The blank-start page has no shared code to receive; that arrives via
  // /playground/<code>, handled by 404.astro + notFoundPlayground.client.ts
  // (a static site can't pre-build a route for arbitrary shared code — see
  // the comment at the top of 404.astro).
  const shareHandler = readFileSync('src/lib/notFoundPlayground.client.ts', 'utf8');

  test('caps both the compressed segment and the decompressed result', () => {
    // The decompressed cap matters even more than the segment one: gzip lets
    // a tiny URL expand into a decompression bomb.
    expect(shareHandler).toContain('MAX_SEGMENT_LENGTH');
    expect(shareHandler).toContain('MAX_DECODED_LENGTH');
  });

  test('sets shared code as text, never as markup', () => {
    expect(shareHandler).toContain('codeEl.textContent = code');
    expect(shareHandler).not.toContain('innerHTML');
  });

  test('malformed shared code fails closed, not open', () => {
    // A decode/parse error must leave the plain 404 showing, not an
    // undefined-looking blank editor pretending to be a real playground.
    expect(shareHandler).toMatch(/catch\s*\{/);
  });
});
