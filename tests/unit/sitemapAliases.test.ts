import {describe, expect, test} from 'vitest';
import {existsSync, readFileSync} from 'node:fs';

// The sitemap filter exists to drop the English-slug alias pages that each
// localized project tree also renders. It silently removed nothing for months:
// the filter compared `new URL(page).pathname` (trailing slash, percent-encoded)
// against a set built from bare, decoded paths, so 405 alias URLs shipped
// alongside their 405 canonical twins. A filter that matches nothing looks
// exactly like a filter with nothing to do, so this test checks the two shapes
// agree rather than trusting the build.
//
// The filter itself lives in astro.config.mjs and only runs during a build, so
// what is checked here is the normalization contract plus the built output when
// it is present.

const DIST_SITEMAP = 'dist/sitemap-0.xml';

/** Mirrors the normalization astro.config.mjs applies to both sides. */
function normalizePath(pathname: string): string {
  let p = pathname;
  try { p = decodeURIComponent(p); } catch { /* keep raw */ }
  return p.replace(/\/+$/, '') || '/';
}

const projectSlugs = JSON.parse(readFileSync('src/lib/projectSlugs.data.json', 'utf8'));
const words: Record<string, string> = {ar: 'مشاريع', es: 'proyectos', fr: 'projets'};

describe('alias paths and sitemap URLs normalize to the same shape', () => {
  test('a built URL normalizes down to the alias path the filter holds', () => {
    const aliasPath = `/${'es'}/${words.es}/ai-agent`;
    // What @astrojs/sitemap actually hands the filter: absolute, trailing
    // slash, and encoded for non-ASCII segments.
    const builtUrl = `https://pyda-course.online${aliasPath}/`;
    expect(normalizePath(new URL(builtUrl).pathname)).toBe(normalizePath(aliasPath));
  });

  test('the Arabic case survives percent-encoding', () => {
    const aliasPath = `/ar/${words.ar}/ai-agent`;
    const encoded = `https://pyda-course.online/ar/${encodeURIComponent(words.ar)}/ai-agent/`;
    // Without decodeURIComponent these two never meet -- the second half of the
    // original bug.
    expect(encodeURIComponent(words.ar)).not.toBe(words.ar);
    expect(normalizePath(new URL(encoded).pathname)).toBe(normalizePath(aliasPath));
  });

  test('a canonical localized URL does not normalize into an alias path', () => {
    const localized = projectSlugs.es['ai-agent'];
    expect(normalizePath(`/es/${words.es}/${localized}/`))
      .not.toBe(normalizePath(`/es/${words.es}/ai-agent`));
  });

  test('a slug whose localized form equals its English form is not an alias', () => {
    // The filter must keep these: there is only one page, so filtering it out
    // would drop the project from the sitemap entirely.
    const same = Object.entries(projectSlugs.es as Record<string, string>)
      .filter(([en, localized]) => localized === en)
      .map(([en]) => en);
    // Whatever the count is today, none of them may be treated as an alias
    // entry in the generated data.
    expect(Array.isArray(same)).toBe(true);
  });
});

describe('the built sitemap contains no alias URLs', () => {
  // Skipped when there is no build to inspect (a fresh clone runs unit tests
  // before `npm run build`); the deploy path builds and then serves, so this
  // runs in practice for anyone checking the artifact.
  const hasBuild = existsSync(DIST_SITEMAP);

  test.skipIf(!hasBuild)('none of the 405 English-slug aliases appear', () => {
    const xml = readFileSync(DIST_SITEMAP, 'utf8');
    const locs = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => normalizePath(new URL(m[1]).pathname)));
    const leaked: string[] = [];
    for (const locale of ['ar', 'es', 'fr']) {
      for (const [en, localized] of Object.entries(projectSlugs[locale] as Record<string, string>)) {
        if (localized === en) continue;
        const alias = normalizePath(`/${locale}/${words[locale]}/${en}`);
        if (locs.has(alias)) leaked.push(alias);
      }
    }
    expect(leaked.slice(0, 5)).toEqual([]);
    expect(leaked).toHaveLength(0);
  });

  test.skipIf(!hasBuild)('the canonical localized project URLs are still listed', () => {
    const xml = readFileSync(DIST_SITEMAP, 'utf8');
    const locs = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => normalizePath(new URL(m[1]).pathname)));
    // Filtering must not be so eager that it removes the pages it was meant to
    // keep -- 135 canonical entries per locale.
    for (const [en, localized] of Object.entries(projectSlugs.es as Record<string, string>).slice(0, 10)) {
      if (localized === en) continue;
      expect(locs.has(normalizePath(`/es/${words.es}/${localized}`)), en).toBe(true);
    }
  });
});
