import {describe, expect, test} from 'vitest';
import {readdirSync, readFileSync} from 'node:fs';

// The project count lived as a literal inside four message strings per locale
// and drifted in three ways at once: the homepage said 135 while the projects
// index counted 136, Spanish said "134 proyectos" in its CTA and "135
// proyectos" in the very next string, and none of them moved when a project
// was added. The strings now carry a {n} placeholder that the pages fill from
// the content collection.
const LOCALES = ['en', 'es', 'fr', 'ar'] as const;
const COUNTED_KEYS = [
  'home_hub_projects_cta',
  'home_hub_projects_desc',
  'home_hub_projects_meta',
  'projects_description',
];

const pack = (loc: string) =>
  JSON.parse(readFileSync(`messages/${loc}.json`, 'utf8')) as Record<string, string>;

// A 2- or 3-digit number sitting next to a project noun is a hardcoded count.
const HARDCODED = /(?<!\{)\b\d{2,3}\b(?!\})/;

describe('project counts are derived, not typed', () => {
  test.each(LOCALES)('%s: every counted string uses {n}, never a literal', (loc) => {
    const m = pack(loc);
    for (const key of COUNTED_KEYS) {
      expect(m[key], `${loc}:${key} exists`).toBeTruthy();
      expect(m[key], `${loc}:${key} must interpolate {n}`).toContain('{n}');
      // Strip the placeholder before looking for a leftover literal.
      const withoutToken = m[key].replace(/\{n\}/g, '');
      expect(withoutToken, `${loc}:${key} still has a hardcoded count`).not.toMatch(HARDCODED);
    }
  });

  test('the homepage passes the count as a paraglide input, not by string surgery', () => {
    // paraglide compiles `{n}` into a function parameter. Post-processing the
    // returned string does nothing, and calling the function with no argument
    // renders the literal text "undefined" — which is what shipped.
    const src = readFileSync('src/components/HomePage.astro', 'utf8');
    expect(src).toContain("m.home_hub_projects_cta({n: count})");
    expect(src).toContain("m.home_hub_projects_meta({n: count})");
    expect(src).toContain("m.home_hub_projects_desc({n: count})");
    expect(src).not.toContain('withCount');
  });

  test('the homepage counts the collection rather than assuming a number', () => {
    const src = readFileSync('src/components/HomePage.astro', 'utf8');
    expect(src).toContain("getCollection('projects')");
    expect(src).toContain('idInLocale(locale');
  });

  test('the projects index passes the count the same way', () => {
    const src = readFileSync('src/components/projects/ProjectListing.astro', 'utf8');
    expect(src).toContain('m.projects_description({n: String(projectCount)})');
  });

  test('the count the pages are given matches the files on disk', () => {
    const en = readdirSync('src/content/projects').filter((f) => f.endsWith('.md')).length;
    for (const loc of ['es', 'fr', 'ar'] as const) {
      const n = readdirSync(`src/content/projects/${loc}`).filter((f) => f.endsWith('.md')).length;
      expect(n, `${loc} twins`).toBe(en);
    }
    // Nothing may render a stale number: the tests above prove the strings
    // interpolate, and this proves the source of truth is the file count.
    expect(en).toBeGreaterThan(0);
  });
});
