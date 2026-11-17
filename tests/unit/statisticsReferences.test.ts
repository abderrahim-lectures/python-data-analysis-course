import {describe, expect, test} from 'vitest';
import {existsSync, readFileSync} from 'node:fs';

// The references page names the books the Statistics 101 section is built
// from. The failure mode it guards against is quiet: a route that exists in
// English only, or a book that is listed but whose "best for" chips point at
// topics no other part of the site uses.
const LOCALES = ['en', 'es', 'fr', 'ar'] as const;
const ROUTES: Record<string, string> = {
  en: 'src/pages/statistics-references.astro',
  es: 'src/pages/es/bibliografia-estadistica.astro',
  fr: 'src/pages/fr/references-statistiques.astro',
  ar: 'src/pages/ar/مراجع-الإحصاء.astro',
};

describe('statistics references page', () => {
  test.each(Object.entries(ROUTES))('%s route exists', (_loc, path) => {
    expect(existsSync(path), path).toBe(true);
  });

  test.each(Object.entries(ROUTES))('%s wrapper uses the shared component', (_loc, path) => {
    expect(readFileSync(path, 'utf8')).toContain('StatisticsReferences');
  });

  test('every book lists at least one topic it is good for', () => {
    const src = readFileSync('src/components/StatisticsReferences.astro', 'utf8');
    const covers = [...src.matchAll(/covers: \[([^\]]*)\]/g)].map((m) => m[1]);
    expect(covers.length).toBeGreaterThanOrEqual(4);
    for (const c of covers) expect(c.trim().length).toBeGreaterThan(0);
  });

  test('every topic chip key exists in all four locales', () => {
    const src = readFileSync('src/components/StatisticsReferences.astro', 'utf8');
    const keys = [...src.matchAll(/'(guide_topic_[a-z_]+)'/g)].map((m) => m[1]);
    expect(new Set(keys).size).toBeGreaterThanOrEqual(6);
    for (const loc of LOCALES) {
      const pack = JSON.parse(readFileSync(`messages/${loc}.json`, 'utf8')) as Record<string, string>;
      for (const k of new Set(keys)) expect(pack[k], `${loc}:${k}`).toBeTruthy();
    }
  });

  test('the section landing links to it, so it is reachable', () => {
    const src = readFileSync('src/components/learn/SectionLanding.astro', 'utf8');
    expect(src).toContain('referencesHref');
    expect(src).toContain("section === 'statistics-101'");
  });

  test('the back-link uses the localized track word, not "normal"', () => {
    // Arabic routes its normal track as /…/عادي, so a hardcoded English
    // 'normal' produced /ar/تعلم/statistics-101/normal, which 404s. The same
    // bug class broke every localized project CTA before.
    const src = readFileSync('src/components/StatisticsReferences.astro', 'utf8');
    expect(src).toContain("trackWord(locale, 'normal')");
    expect(src).not.toMatch(/learnHref\(locale, base, 'statistics-101', 'normal'\)/);
  });

  test('the localized route words are distinct from the cheatsheets word', () => {
    // Spanish already has /es/referencias (cheatsheets); a references page at
    // the same word would be ambiguous even though the paths differ.
    const src = readFileSync('src/lib/routeSegments.ts', 'utf8');
    const es = /es: \{[^}]*cheatsheets: '([^']+)'[^}]*statisticsReferences: '([^']+)'/.exec(src);
    expect(es).not.toBeNull();
    expect(es![1]).not.toBe(es![2]);
  });
});
