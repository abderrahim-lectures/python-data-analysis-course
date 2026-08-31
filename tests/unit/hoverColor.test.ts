import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';

// Bug class: a bare `a:hover { color: var(--accent-strong); }` rule in
// global.css applies to every link on the site. A `.btn-primary:hover` rule
// that changes the background but doesn't re-declare `color` loses the
// specificity tiebreak to that bare `a:hover` (both have one class-level
// selector; a:hover also carries a type selector, which wins ties), so the
// button's own text color got silently overridden by the *link* hover color
// on every filled `<a class="btn ...">` button on hover. On .btn-primary
// this made "Start your first lesson" text and its hover background render
// as the identical violet — invisible.
//
// Fix is per-rule (add `color` to each filled-button hover rule); this test
// guards the actual instances so the fix can't quietly regress.

const GLOBAL_CSS = readFileSync('src/styles/global.css', 'utf8');

// A selector can appear in a comma-joined list shared with other selectors
// (e.g. `.a:hover, .b:hover { transform: ... }`), and its own declarations
// can be split across more than one such block. Concatenate every block
// whose selector list includes the target, since CSS applies all of them.
function declarationsFor(css: string, selector: string): string {
  const blocks = css.matchAll(/([^{}]+)\{([^}]*)\}/g);
  let out = '';
  for (const [, selectorList, body] of blocks) {
    const selectors = selectorList.split(',').map((s) => s.trim());
    if (selectors.includes(selector)) out += body;
  }
  return out;
}

describe('filled buttons declare their own hover color', () => {
  test.each(['.btn-primary', '.btn-streak', '.btn-xp'])('%s:hover declares color', (sel) => {
    expect(declarationsFor(GLOBAL_CSS, `${sel}:hover`)).toMatch(/color\s*:/);
  });

  test.each(['.btn-ghost', '.btn-soft'])('%s:hover already declared color (no regression)', (sel) => {
    expect(declarationsFor(GLOBAL_CSS, `${sel}:hover`)).toMatch(/color\s*:/);
  });
});

describe('route pills declare their own hover color, in every locale', () => {
  const FILES = [
    'src/pages/learn/index.astro',
    'src/pages/ar/تعلم/index.astro',
    'src/pages/es/aprender/index.astro',
    'src/pages/fr/apprendre/index.astro',
  ];

  test.each(FILES)('%s: .route-pill--normal:hover declares color', (path) => {
    expect(declarationsFor(readFileSync(path, 'utf8'), '.route-pill--normal:hover')).toMatch(/color\s*:/);
  });

  test.each(FILES)('%s: .route-pill--hard:hover declares color', (path) => {
    expect(declarationsFor(readFileSync(path, 'utf8'), '.route-pill--hard:hover')).toMatch(/color\s*:/);
  });
});

describe('the root cause is still present and understood', () => {
  // If this bare rule ever gets a class-only selector (e.g. renamed to a
  // utility class) the bug disappears on its own; if it gets removed
  // entirely, that's also fine. This just documents why the above matters.
  test('a global bare a:hover color rule exists in global.css', () => {
    expect(GLOBAL_CSS).toMatch(/(?:^|[^.\w-])a:hover\s*\{[^}]*color\s*:/m);
  });
});
