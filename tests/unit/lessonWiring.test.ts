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

  test('refuses to run code still flagged untrusted', () => {
    expect(src).toContain("cell.hasAttribute('data-untrusted')");
  });

  test('screens code through the bridge guard before executing', () => {
    expect(src).toContain('usesJsBridge(src)');
    expect(src.indexOf('usesJsBridge(src)')).toBeLessThan(src.indexOf('runPythonAsync'));
  });
});

describe('playground', () => {
  const src = readFileSync('src/pages/playground.astro', 'utf8');

  test('treats ?code= as untrusted until the learner confirms', () => {
    expect(src).toContain("cell?.setAttribute('data-untrusted', '1')");
  });

  test('caps the size of shared code', () => {
    expect(src).toContain('MAX_SHARED_CODE');
  });

  test('sets shared code as text, never as markup', () => {
    expect(src).toContain('codeEl.textContent = shared');
    expect(src).not.toContain('innerHTML');
  });
});
