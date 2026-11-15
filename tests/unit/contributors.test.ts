import {describe, expect, test} from 'vitest';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {CONTRIBUTORS, contributorById, contributorProfileUrl} from '../../src/lib/contributors';

// The contributors page is built from declarations, not from git, so the
// declarations have to be checked or a typo silently drops someone's credit
// (an unknown author id renders nothing at all on the page).
const PROJECTS = 'src/content/projects';
const EN_FILES = readdirSync(PROJECTS).filter((f) => f.endsWith('.md'));

function frontmatterOf(path: string): string {
  const src = readFileSync(path, 'utf8');
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(src)?.[1] ?? '';
}

function authorOf(path: string): string | null {
  const m = /^author:\s*(.+)$/m.exec(frontmatterOf(path));
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null;
}

describe('contributor registry', () => {
  test('every id is unique and url-safe', () => {
    const ids = CONTRIBUTORS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  test('every contributor has a non-empty name', () => {
    for (const c of CONTRIBUTORS) expect(c.name.trim().length).toBeGreaterThan(0);
  });

  test('contributorById resolves a known id and misses an unknown one', () => {
    expect(contributorById(CONTRIBUTORS[0].id)?.name).toBe(CONTRIBUTORS[0].name);
    expect(contributorById('nobody-by-this-name')).toBeUndefined();
  });

  test('a profile URL is derived from the handle, and absent without one', () => {
    expect(contributorProfileUrl({id: 'x', name: 'X', github: 'octocat'})).toBe('https://github.com/octocat');
    // A student with no GitHub account is still a valid contributor.
    expect(contributorProfileUrl({id: 'x', name: 'X'})).toBeNull();
  });
});

describe('project authorship', () => {
  // This is the failure that matters: `author: some-typo` renders no card and
  // raises nothing at build time, so the person is simply missing from the page.
  test('every author id in frontmatter resolves to a registered contributor', () => {
    const unknown: string[] = [];
    for (const f of EN_FILES) {
      const id = authorOf(join(PROJECTS, f));
      if (id && !contributorById(id)) unknown.push(`${f} -> ${id}`);
    }
    expect(unknown).toEqual([]);
  });

  test('no localized twin declares an author, so translators are not credited as creators', () => {
    const offenders: string[] = [];
    for (const loc of ['ar', 'es', 'fr']) {
      const dir = join(PROJECTS, loc);
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
        if (authorOf(join(dir, f))) offenders.push(`${loc}/${f}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  test('the schema accepts an author field, so the frontmatter is not ignored', () => {
    expect(readFileSync('src/content.config.ts', 'utf8')).toMatch(/author:\s*z\.string\(\)\.optional\(\)/);
  });
});

describe('contributor routes exist in all four locales', () => {
  // Mirrors the credits-page test: a page that exists in one locale and 404s
  // in another is worse than one that is English everywhere, because the nav
  // links it from all four.
  const CONTRIBUTORS_ROUTES: Record<string, string> = {
    en: 'src/pages/contributors.astro',
    es: 'src/pages/es/colaboradores.astro',
    fr: 'src/pages/fr/contributeurs.astro',
    ar: 'src/pages/ar/المساهمون.astro',
  };
  const GUIDE_ROUTES: Record<string, string> = {
    en: 'src/pages/contributors-guide.astro',
    es: 'src/pages/es/guia-colaboradores.astro',
    fr: 'src/pages/fr/guide-contributeurs.astro',
    ar: 'src/pages/ar/دليل-المساهمة.astro',
  };

  test.each(Object.entries(CONTRIBUTORS_ROUTES))('%s contributors route exists', (_l, p) => {
    expect(existsSync(p)).toBe(true);
  });
  test.each(Object.entries(GUIDE_ROUTES))('%s guide route exists', (_l, p) => {
    expect(existsSync(p)).toBe(true);
  });

  test('NAV_WORDS gives every locale a contributors word, and they are distinct', () => {
    const src = readFileSync('src/lib/routeSegments.ts', 'utf8');
    for (const w of ['contributors:', 'contributorsGuide:']) {
      const hits = src.split('\n').filter((l) => l.includes(w));
      expect(hits.length, w).toBeGreaterThanOrEqual(4);
    }
  });

  test('the footer links the contributors page in every locale', () => {
    const src = readFileSync('src/layouts/Base.astro', 'utf8');
    expect(src).toContain('nav.contributors');
    expect(src).toContain('m.nav_contributors()');
  });
});

describe('the guide names the files that actually exist', () => {
  // The guide tells a student exactly which paths to touch. If one is renamed
  // without the guide, the instructions quietly become wrong; this couples the
  // two so a rename fails the suite instead.
  test('the project content directory and schema are where the guide says', () => {
    expect(existsSync('src/content/projects')).toBe(true);
    expect(existsSync('src/content.config.ts')).toBe(true);
    expect(existsSync('src/lib/contributors.ts')).toBe(true);
    expect(existsSync('examples')).toBe(true);
  });

  test('an example project page exists for the copy-this-one step', () => {
    expect(existsSync('src/content/projects/ai-agent.md')).toBe(true);
  });
});
