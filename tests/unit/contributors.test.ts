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

  test('a non-http url is refused rather than rendered as an href', () => {
    // `url` is registry text, not user input, but it still lands in an href on
    // a public page: javascript: and data: would execute on click, and a bare
    // host would silently become a relative link.
    expect(contributorProfileUrl({id: 'x', name: 'X', url: 'javascript:alert(1)'})).toBeNull();
    expect(contributorProfileUrl({id: 'x', name: 'X', url: 'data:text/html,<script>alert(1)</script>'})).toBeNull();
    expect(contributorProfileUrl({id: 'x', name: 'X', url: 'pyda-course.online'})).toBeNull();
    expect(contributorProfileUrl({id: 'x', name: 'X', url: '/relative'})).toBeNull();
  });

  test('a refused url falls back to the GitHub handle when there is one', () => {
    expect(contributorProfileUrl({id: 'x', name: 'X', url: 'javascript:alert(1)', github: 'octocat'}))
      .toBe('https://github.com/octocat');
  });

  test('an http(s) url is kept', () => {
    expect(contributorProfileUrl({id: 'x', name: 'X', url: 'https://example.com/me'})).toBe('https://example.com/me');
    expect(contributorProfileUrl({id: 'x', name: 'X', url: 'http://example.com/me'})).toBe('http://example.com/me');
  });

  test('a handle that is not a plausible GitHub login is not turned into a URL', () => {
    expect(contributorProfileUrl({id: 'x', name: 'X', github: 'has space'})).toBeNull();
    expect(contributorProfileUrl({id: 'x', name: 'X', github: 'a/b'})).toBeNull();
    expect(contributorProfileUrl({id: 'x', name: 'X', github: '"><script>'})).toBeNull();
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

describe('the page shows a count per person, with the projects behind a disclosure', () => {
  // A contributor with 135 projects pushed every other person off the page.
  // The card now shows the count, and the list is a native <details> so it
  // needs no JavaScript and keeps keyboard and screen-reader behaviour.
  const src = readFileSync('src/components/ContributorsPage.astro', 'utf8');

  test('the project list is inside a details element', () => {
    const details = src.indexOf('<details class="contributor__disclosure">');
    const summary = src.indexOf('<summary');
    const list = src.indexOf('<ul class="contributor__projects"');
    const close = src.indexOf('</details>');
    expect(details).toBeGreaterThan(-1);
    expect(summary).toBeGreaterThan(details);
    expect(list).toBeGreaterThan(summary);
    expect(close).toBeGreaterThan(list);
  });

  test('the disclosure starts collapsed, not open', () => {
    expect(src).not.toMatch(/<details[^>]*\bopen\b/);
  });

  test('the count chip stays outside the disclosure', () => {
    const count = src.indexOf('class="contributor__count"');
    const details = src.indexOf('<details class="contributor__disclosure">');
    expect(count).toBeGreaterThan(-1);
    expect(count).toBeLessThan(details);
  });

  test('both toggle labels exist in all four locales and are translated', () => {
    const en = JSON.parse(readFileSync('messages/en.json', 'utf8')) as Record<string, string>;
    for (const key of ['contributors_view_projects', 'contributors_hide_projects']) {
      expect(en[key], key).toBeTruthy();
      for (const loc of ['ar', 'es', 'fr']) {
        const pack = JSON.parse(readFileSync(`messages/${loc}.json`, 'utf8')) as Record<string, string>;
        expect(pack[key], `${loc}:${key}`).toBeTruthy();
        expect(pack[key], `${loc}:${key} should be translated`).not.toBe(en[key]);
      }
    }
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

describe('the contributors page links to pages that exist', () => {
  // Both CTAs on the localized pages were dead: the guide link was built from
  // the English route word plus a locale prefix (`/ar/contributors-guide/`)
  // and the projects link dropped the locale prefix entirely (`/مشاريع`). The
  // page looked right in English, which is why nothing caught it. These pin
  // the helpers the component now uses.
  test('contributorsGuideHref uses each locale\'s own route word', async () => {
    const {contributorsGuideHref, NAV_WORDS} = await import('../../src/lib/routeSegments.ts');
    expect(contributorsGuideHref('en', '/')).toBe('/contributors-guide');
    expect(contributorsGuideHref('es', '/')).toBe('/es/guia-colaboradores');
    expect(contributorsGuideHref('fr', '/')).toBe('/fr/guide-contributeurs');
    // Paraglide percent-encodes non-ASCII path segments, which is what an href
    // should carry; compare after decoding so the assertion reads as the word.
    expect(decodeURIComponent(contributorsGuideHref('ar', '/'))).toBe('/ar/دليل-المساهمة');
    // The English word must not leak under a locale prefix.
    for (const loc of ['ar', 'es', 'fr'] as const) {
      expect(contributorsGuideHref(loc, '/')).not.toContain('contributors-guide');
      expect(decodeURIComponent(contributorsGuideHref(loc, '/'))).toContain(NAV_WORDS[loc].contributorsGuide);
    }
  });

  test('contributorsHref and projectsHref keep the locale prefix', async () => {
    const {contributorsHref, projectsHref} = await import('../../src/lib/routeSegments.ts');
    expect(decodeURIComponent(contributorsHref('ar', '/'))).toBe('/ar/المساهمون');
    expect(contributorsHref('es', '/')).toBe('/es/colaboradores');
    expect(contributorsHref('fr', '/')).toBe('/fr/contributeurs');
    for (const loc of ['ar', 'es', 'fr'] as const) {
      expect(projectsHref(loc, '/')).toMatch(new RegExp(`^/${loc}/`));
    }
    expect(decodeURIComponent(projectsHref('ar', '/'))).toBe('/ar/مشاريع');
    expect(projectsHref('es', '/')).toBe('/es/proyectos');
    expect(projectsHref('fr', '/')).toBe('/fr/projets');
  });

  test('the component builds no top-level href by hand', () => {
    // The failure mode was string-building: `${locale}/contributors-guide`.
    // Anything of that shape in the page is a regression waiting to happen.
    for (const p of ['src/components/ContributorsPage.astro', 'src/components/ContributorsGuide.astro']) {
      const src = readFileSync(p, 'utf8');
      expect(src, p).not.toMatch(/\$\{locale\}\/.*(contributors-guide|colaboradores|contributeurs)/);
      expect(src, p).not.toMatch(/\$\{base\}\$\{NAV_WORDS/);
    }
  });
});
