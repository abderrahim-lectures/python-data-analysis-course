import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';

// These guard the wiring bugs that made progress tracking silently dead:
// the completion button existed on only the last week of a track, and the
// lesson id never reached the code cells that award XP.

// All four legacy static lesson templates were deleted in the redesign; every
// locale's lesson route (learn/, ar/تعلم/, es/aprender/, fr/apprendre) is now a
// thin wrapper over this one shared component, so the guards live here.
const LESSON_TEMPLATES = [
  'src/components/learn/LessonPage.astro',
];

describe.each(LESSON_TEMPLATES)('%s', (path) => {
  const src = readFileSync(path, 'utf8');

  test('declares the lesson id on the article so code cells can award XP', () => {
    expect(src).toContain('data-lesson-id={lessonId}');
  });

  test('builds the lesson id from canonical section/track', () => {
    expect(src).toMatch(/const lessonId = `\$\{section\}\/\$\{track\}\/\$\{slug\}`/);
  });

  test('reflects already-saved completion when the page loads', () => {
    expect(src).toContain('isLessonComplete');
  });

  test('uses localized completion labels', () => {
    expect(src).toContain('m.mark_complete()');
    expect(src).toContain('m.completed()');
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
    // The guard runs inside the extracted runCellCode helper, which every Run
    // handler delegates to — the check must precede any engine execution.
    const guardIdx = src.indexOf('usesJsBridge(code)');
    expect(guardIdx).toBeGreaterThan(-1);
    // Guard runs before any engine execution at the runCellCode call site.
    expect(guardIdx).toBeLessThan(src.indexOf('rt.engine.runPythonAsync('));
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

describe('line-number gutter', () => {
  const src = readFileSync('src/lib/runnable-cell.client.ts', 'utf8');

  test('injects a gutter for every runnable cell, not just the playground', () => {
    expect(src).toContain("gutter.className = 'cell__gutter'");
  });

  test('renumbers on every edit', () => {
    const inputHandler = src.slice(src.indexOf("codeEl.addEventListener('input'"));
    expect(inputHandler).toContain('renumber()');
  });
});

describe('playground shared-link back button', () => {
  const src = readFileSync('src/lib/notFoundPlayground.client.ts', 'utf8');

  test('points back at the referring lesson when the referrer is same-origin', () => {
    expect(src).toContain('fromThisSite');
    expect(src).toContain('document.referrer');
  });

  test('falls back to the learn hub for a pasted/emailed link with no referrer', () => {
    expect(src).toMatch(/`\$\{base\}learn`/);
  });
});

describe('playground and its shared-link fallback share one header component', () => {
  test('both entry points render PlaygroundHead', () => {
    expect(readFileSync('src/pages/playground.astro', 'utf8')).toContain('<PlaygroundHead');
    expect(readFileSync('src/pages/404.astro', 'utf8')).toContain('<PlaygroundHead');
  });
});
