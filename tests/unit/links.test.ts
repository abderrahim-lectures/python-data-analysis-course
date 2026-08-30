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

  test('every dataset referenced in content is actually present', () => {
    const referenced = new Set<string>();
    for (const f of CONTENT) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\/datasets\/([\w.-]+\.csv)/g)) {
        referenced.add(m[1]);
      }
    }
    expect(referenced.size).toBeGreaterThan(0);
    const missing = [...referenced].filter((n) => !existsSync(join('public/datasets', n)));
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

  test('credits copy keeps the synthetic-dataset attribution accurate', async () => {
    const {CREDITS} = await import('../../src/lib/creditsStrings.ts');
    for (const loc of ['en', 'ar', 'es', 'fr'] as const) {
      expect(CREDITS[loc].entries.length).toBeGreaterThanOrEqual(3);
      // The bundled CSVs are synthetic files modelled on the Kaggle schemas,
      // not the Kaggle data — the wording must not claim otherwise.
      const kaggle = CREDITS[loc].entries.filter((e) => e.href.includes('kaggle.com'));
      expect(kaggle.length).toBe(2);
      for (const e of kaggle) expect(e.note.length).toBeGreaterThan(40);
    }
  });

  test('no credits entry still references the removed JupyterLite runtime', async () => {
    const {CREDITS} = await import('../../src/lib/creditsStrings.ts');
    for (const loc of ['en', 'ar', 'es', 'fr'] as const) {
      const text = JSON.stringify(CREDITS[loc]);
      expect(text).not.toMatch(/jupyterlite/i);
    }
  });
});
