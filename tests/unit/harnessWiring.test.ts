import {describe, expect, test} from 'vitest';
import {readFileSync, existsSync} from 'node:fs';

// Several of the site's bugs have been "a check that could never have failed":
// e2e suites that never ran in CI, an astro check that silently skipped, a CSP
// hardener that skipped pages without a policy. These pin the wiring so a
// future edit cannot quietly unwire it again.
const CONFIG = readFileSync('astro.config.mjs', 'utf8');
const BASE = readFileSync('src/layouts/Base.astro', 'utf8');
const WORKFLOW = readFileSync('.github/workflows/deploy.yml', 'utf8');
const PKG = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>;
  engines?: {node?: string};
  dependencies?: Record<string, string>;
};

describe('the browser suites run in CI, not just locally', () => {
  test('the workflow serves the built site before the suites', () => {
    expect(WORKFLOW).toContain('astro preview');
    expect(WORKFLOW).toMatch(/wait-on|wait_on|sleep/);
  });

  test('every e2e suite is named in the workflow', () => {
    for (const suite of ['smoke', 'a11y', 'contrast', 'responsive', 'hreflang', 'lesson-runtime']) {
      expect(WORKFLOW, `${suite} not run in CI`).toContain(suite);
      expect(existsSync(`tests/e2e/${suite}.mjs`), `${suite}.mjs missing`).toBe(true);
    }
  });

  test('the workflow typechecks', () => {
    expect(WORKFLOW).toContain('tsc --noEmit');
  });
});

describe('prefetch does not punish keyboard users', () => {
  test('prefetchAll is off, so tabbing does not prefetch every anchor', () => {
    // 136 anchors on /projects/ each scheduled a prefetch on focus.
    expect(CONFIG).toContain('prefetchAll: false');
  });

  test('the links worth prefetching opt in explicitly', () => {
    const lesson = readFileSync('src/components/learn/LessonPage.astro', 'utf8');
    expect(lesson).toContain('data-astro-prefetch');
    expect(BASE).toContain('data-astro-prefetch');
  });
});

describe('the payload is not paid for on pages that do not use it', () => {
  test('supabase-js is not a dependency any more', () => {
    // It was 57 KB gzip on all 1,426 pages for three REST calls.
    expect(PKG.dependencies?.['@supabase/supabase-js']).toBeUndefined();
    // The module's comments explain the removal, so match an import statement
    // rather than any mention of the package name.
    const auth = readFileSync('src/lib/supabaseAuth.ts', 'utf8');
    expect(auth).not.toMatch(/^import .*@supabase\/supabase-js/m);
  });

  test('the KaTeX stylesheet is emitted from a flag, not imported unconditionally', () => {
    const lesson = readFileSync('src/components/learn/LessonPage.astro', 'utf8');
    expect(lesson).toContain('lessonHasMath');
    expect(lesson).not.toMatch(/^import 'katex\/dist\/katex\.min\.css';?$/m);
    expect(readFileSync('src/lib/remark-record-math.mjs', 'utf8')).toContain('hasMath');
  });

  test('Base supports a per-page head tag for that link', () => {
    expect(BASE).toContain('headExtra');
  });
});

describe('crawlable duplicates and error visibility', () => {
  test('alias project routes are noindex', () => {
    const detail = readFileSync('src/components/projects/ProjectDetail.astro', 'utf8');
    expect(detail).toContain('isAliasRoute');
    expect(detail).toContain('noindex={isAliasRoute}');
    expect(BASE).toContain('noindex,follow');
  });

  test('client errors and CSP violations are reported', () => {
    expect(BASE).toContain('unhandledrejection');
    expect(BASE).toContain('securitypolicyviolation');
    expect(BASE).toContain("'exception'");
  });
});

describe('the Node floor explains itself', () => {
  test('a preflight names the installed version and the required floor', () => {
    expect(existsSync('scripts/check-node.mjs')).toBe(true);
    const check = readFileSync('scripts/check-node.mjs', 'utf8');
    expect(check).toContain('process.versions.node');
    expect(check).toContain('nvm install');
  });

  test('dev and build run it before anything else', () => {
    for (const script of ['predev', 'prebuild']) {
      expect(PKG.scripts[script], script).toMatch(/^node scripts\/check-node\.mjs/);
    }
  });

  test('the devcontainer image satisfies the floor', () => {
    // It shipped Node 20, so every Codespaces user hit the wall.
    const devcontainer = readFileSync('.devcontainer/devcontainer.json', 'utf8');
    expect(devcontainer).not.toContain('javascript-node:20');
    expect(devcontainer).toContain('javascript-node:22');
  });
});
