import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';
import {PAGE_STRINGS} from '../../src/lib/pageStrings.ts';
import {UI_STRINGS} from '../../src/lib/uiStrings.ts';

const LOCALES = ['en', 'ar', 'es', 'fr'] as const;

describe('every locale defines every string', () => {
  const pageKeys = Object.keys(PAGE_STRINGS.en);
  const uiKeys = Object.keys(UI_STRINGS.en);

  test.each(LOCALES)('%s has all page strings', (loc) => {
    expect(Object.keys(PAGE_STRINGS[loc]).sort()).toEqual(pageKeys.sort());
  });

  test.each(LOCALES)('%s has all UI strings', (loc) => {
    expect(Object.keys(UI_STRINGS[loc]).sort()).toEqual(uiKeys.sort());
  });

  test.each(LOCALES)('%s leaves no page string empty', (loc) => {
    for (const [k, v] of Object.entries(PAGE_STRINGS[loc])) {
      expect(typeof v === 'string' && v.trim().length > 0, `${loc}.${k}`).toBe(true);
    }
  });
});

describe('non-English locales are actually translated', () => {
  // Guards the bug where locale pages shipped hardcoded English copy: the
  // Arabic learn hub rendered English track descriptions, which also flipped
  // the sentence punctuation to the wrong side under RTL.
  const shared = new Set(['track1Name']); // proper nouns that stay Latin

  test.each(LOCALES.filter((l) => l !== 'en'))('%s differs from English', (loc) => {
    const identical = Object.entries(PAGE_STRINGS[loc])
      .filter(([k, v]) => !shared.has(k) && v === (PAGE_STRINGS.en as Record<string, string>)[k])
      .map(([k]) => k);

    expect(identical).toEqual([]);
  });

  test.each(LOCALES.filter((l) => l !== 'en'))('%s has a translated footer tagline', (loc) => {
    expect(UI_STRINGS[loc].footer.tagline).not.toBe(UI_STRINGS.en.footer.tagline);
  });
});

describe('locale hub templates render strings, not literals', () => {
  const HUBS = [
    'src/pages/learn/index.astro',
    'src/pages/ar/تعلم/index.astro',
    'src/pages/es/aprender/index.astro',
    'src/pages/fr/apprendre/index.astro',
  ];

  test.each(HUBS)('%s has no hardcoded English track copy', (path) => {
    const src = readFileSync(path, 'utf8');
    expect(src).not.toMatch(/<p>Weeks \d+–\d+\./);
    expect(src).not.toContain('<h2>Pandas &amp; Data</h2>');
    expect(src).not.toContain('Choose your route:');
    expect(src).not.toContain('— start here<');
  });

  test.each(HUBS)('%s collapses its grid responsively rather than at a fixed breakpoint', (path) => {
    // A hard `1fr 1fr` clipped the cards between ~720-900px.
    expect(readFileSync(path, 'utf8')).toContain('repeat(auto-fit, minmax(');
  });
});

describe('shared layout', () => {
  const src = readFileSync('src/layouts/Base.astro', 'utf8');

  test('the footer tagline comes from the locale pack', () => {
    expect(src).toContain('{t.footer.tagline}');
    expect(src).not.toContain('Zero installs, zero boring.</p>');
  });

  test('the onboarding dialog starts hidden so it cannot flash', () => {
    expect(src).toMatch(/id="onboarding"[^>]*\shidden/);
  });

  test('the onboarding dialog is labelled for screen readers', () => {
    expect(src).toContain('role="dialog"');
    expect(src).toContain('aria-modal="true"');
    expect(src).toContain('aria-labelledby="onboarding-title"');
  });
});

describe('locale content is actually translated', () => {
  // The Arabic section index files shipped English placeholder descriptions
  // ("Python 101 — Python fundamentals.") that became the page's meta
  // description, while es/fr were properly translated.
  const frontmatter = (p: string) => {
    const m = readFileSync(p, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    return m ? m[1] : '';
  };
  const field = (fm: string, key: string) => {
    const m = fm.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm'));
    return m ? m[1] : '';
  };
  const arabicRatio = (s: string) => {
    const letters = [...s].filter((c) => /\p{L}/u.test(c));
    if (!letters.length) return 0;
    return letters.filter((c) => /[؀-ۿ]/.test(c)).length / letters.length;
  };

  const AR_SECTIONS = [
    'src/content/learn/ar/python-101/index.md',
    'src/content/learn/ar/data-analysis/index.md',
  ];

  test.each(AR_SECTIONS)('%s has an Arabic description', (path) => {
    const desc = field(frontmatter(path), 'description');
    expect(desc.length).toBeGreaterThan(0);
    // Product names (pandas, CSV, Python) stay Latin, so require a majority
    // rather than the whole string.
    expect(arabicRatio(desc)).toBeGreaterThan(0.5);
  });

  test.each(AR_SECTIONS)('%s has an Arabic title', (path) => {
    expect(arabicRatio(field(frontmatter(path), 'title'))).toBeGreaterThan(0.3);
  });
});

describe('section landing pages resolve their index content', () => {
  // Astro strips a trailing `/index` from slugs and emits a leading slash for
  // a nested `<section>/<section>/index.md`. The routes matched on
  // `.endsWith('<section>/index')`, which never hit, so every section page in
  // every locale fell back to a raw-slug title and `"<slug> lessons."`.
  const ROUTES = [
    'src/pages/learn/[section]/index.astro',
    'src/pages/ar/تعلم/[section]/index.astro',
    'src/pages/es/aprender/[section]/index.astro',
    'src/pages/fr/apprendre/[section]/index.astro',
  ];

  test.each(ROUTES)('%s does not match on a trailing /index', (path) => {
    const src = readFileSync(path, 'utf8');
    expect(src).not.toMatch(/slug\s*===\s*`[^`]*\/index`/);
    expect(src).not.toMatch(/endsWith\(`\$\{section\}\/index`\)/);
  });

  test('the English route normalises the leading slash', () => {
    const src = readFileSync('src/pages/learn/[section]/index.astro', 'utf8');
    expect(src).toContain("replace(/^\\//, '')");
  });
});
