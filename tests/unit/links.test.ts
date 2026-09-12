import {describe, expect, test} from 'vitest';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const CONTENT = walk('src/content').filter((f) => f.endsWith('.md'));

describe('Docusaurus link artifacts', () => {
  // `pathname://` was a Docusaurus escape hatch to bypass its link processing.
  // Astro renders it literally, so every dataset download 404'd.
  test('no content file uses the pathname:// prefix', () => {
    const offenders = CONTENT.filter((f) => readFileSync(f, 'utf8').includes('pathname://'));
    expect(offenders).toEqual([]);
  });
});

describe('course datasets are shipped', () => {
  // These were lost in the migration: they lived in Docusaurus's static/ and
  // were never moved to public/, so weeks 5 and 10 pointed at nothing.
  const DATASETS = ['titanic.csv', 'students-normal.csv', 'students-performance.csv', 'slm-corpus.csv'];

  test.each(DATASETS)('public/datasets/%s exists', (name) => {
    expect(existsSync(join('public/datasets', name))).toBe(true);
  });

  test.each(DATASETS)('public/datasets/%s has a header and rows', (name) => {
    const lines = readFileSync(join('public/datasets', name), 'utf8').trim().split('\n');
    expect(lines.length).toBeGreaterThan(1);
    // slm-corpus is legitimately single-column, so don't require a comma.
    expect(lines[0].trim().length).toBeGreaterThan(0);
  });

  test('every manifest entry maps to a real shipped file', () => {
    // Bare-filename references (open("slm-corpus.csv") / pd.read_csv(...))
    // resolve through this manifest at runtime (runnable-cell.client.ts).
    // The explicit /datasets/<name>.csv URL form the old test checked no
    // longer exists in content — git history shows those links 404'd, which
    // is exactly why bare-filename + manifest resolution replaced them.
    const manifest = JSON.parse(readFileSync('public/datasets/index.json', 'utf8')) as Record<string, string>;
    const entries = Object.entries(manifest);
    expect(entries.length).toBeGreaterThan(0);
    const missing = entries.filter(([, shipped]) => !existsSync(join('public/datasets', shipped)));
    expect(missing).toEqual([]);
  });
});

describe('credits page', () => {
  const ROUTES: Record<string, string> = {
    en: 'src/pages/credits.astro',
    ar: 'src/pages/ar/المصادر.astro',
    es: 'src/pages/es/creditos.astro',
    fr: 'src/pages/fr/credits.astro',
  };

  test.each(Object.entries(ROUTES))('%s credits route exists', (_loc, path) => {
    expect(existsSync(path)).toBe(true);
  });

  test('content links to credits resolve to a route that exists', () => {
    const words: Record<string, string> = {ar: 'المصادر', es: 'creditos', fr: 'credits'};
    for (const f of CONTENT) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\]\((\/[^)]*(?:credits|creditos|المصادر))\)/g)) {
        const href = m[1].replace(/^\//, '');
        const locale = Object.keys(words).find((l) => f.includes(`/${l}/`));
        // A locale page must not send the reader to the English credits page.
        if (locale) expect(href, f).toBe(`${locale}/${words[locale]}`);
        else expect(href, f).toBe('credits');
      }
    }
  });

  test('credits copy keeps the synthetic-dataset attribution accurate', () => {
    const LOCALES = ['en', 'ar', 'es', 'fr'] as const;
    for (const loc of LOCALES) {
      const msgs = JSON.parse(readFileSync(`messages/${loc}.json`, 'utf8')) as Record<string, string>;
      // 3 dataset/tool entry pairs (name + note) live as message keys.
      const names = [1, 2, 3].map((n) => msgs[`credits_entry_${n}_name`]);
      expect(names.filter(Boolean).length).toBe(3);
      // Entries 2 & 3 are the synthetic datasets modelled on the Kaggle
      // schemas — the wording must remain long enough to stay precise.
      for (const n of [2, 3]) {
        if (typeof msgs[`credits_entry_${n}_note`] === 'string') {
          expect(msgs[`credits_entry_${n}_note`].length).toBeGreaterThan(40);
        }
      }
    }
  });

  test('no credits entry still references the removed JupyterLite runtime', () => {
    for (const path of Object.values(ROUTES)) {
      const src = readFileSync(path, 'utf8');
      expect(src).not.toMatch(/jupyterlite/i);
    }
  });
});

describe('project tags are consistent for the /projects filter UI', () => {
  test('no tag differs from another only by case', async () => {
    const {PROJECT_TAGS} = await import('../../src/lib/projectArt.ts');
    const allTags = Object.values(PROJECT_TAGS).flat();
    const byLower = new Map<string, Set<string>>();
    for (const tag of allTags) {
      const key = tag.toLowerCase();
      if (!byLower.has(key)) byLower.set(key, new Set());
      byLower.get(key)!.add(tag);
    }
    const inconsistent = [...byLower.entries()].filter(([, variants]) => variants.size > 1);
    expect(inconsistent).toEqual([]);
  });
});

describe('EN-only project alternate fallback (i18n route helper)', () => {
  // design: project pages for locales with no translated twin must fall back
  // to the EN page in the hreflang alternates, never advertise a 404.
  const PROJECTS = walk('src/content/projects')
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice('src/content/projects/'.length).replace(/\.md$/, ''));

  function setByLocale(): Record<string, Set<string>> {
    const by = {ar: new Set<string>(), es: new Set<string>(), fr: new Set<string>()};
    for (const f of PROJECTS) {
      const m = /^(ar|es|fr)\/(.+)$/.exec(f);
      if (m) by[m[1] as keyof typeof by].add(m[2].replace(/^\/?projects?\//, ''));
    }
    return by;
  }

  const hasAllTwins = (slug: string) => {
    const by = setByLocale();
    return new Set(by.ar).has(slug) && new Set(by.es).has(slug) && new Set(by.fr).has(slug);
  };

  test('every EN project ships ar/es/fr twins (i18n coverage is complete)', () => {
    // The last EN-only project (data-visualization) got its twins; the
    // ProjectDetail EN-fallback stays as defense for temporary future gaps,
    // so any new EN project without all three twins fails this test on purpose.
    const enOnly = PROJECTS.filter((f) => !/^(ar|es|fr)\//.test(f)).filter((slug) => !hasAllTwins(slug));
    expect(enOnly).toEqual([]);
  });

  test('every localized project slug has a matching EN page', () => {
    const enSlugs = new Set(PROJECTS.filter((f) => !/^(ar|es|fr)\//.test(f)));
    for (const f of PROJECTS) {
      const m = /^(ar|es|fr)\/(.+)$/.exec(f);
      if (m) expect(enSlugs, f).toContain(m[2]);
    }
  });
});
