import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';

// The project index advertised "Search all 540 projects" in every locale:
// 135 projects x 4 locales. The wrapper pages interpolated {n} with
// `projects.length` -- the *whole* collection, every locale -- and then
// ProjectListing's own `.replace('{n}', String(projectCount))` had nothing
// left to replace, so the per-locale filter never reached the placeholder.
// The count label beside the grid was right (it is computed in the component
// from the filtered list), which is why the inconsistency was easy to miss.
//
// These pin the shape of the fix: the wrappers pass the token through, the
// component substitutes the filtered count.
const WRAPPERS: Record<string, string> = {
  en: 'src/pages/projects/index.astro',
  es: 'src/pages/es/proyectos/index.astro',
  fr: 'src/pages/fr/projets/index.astro',
  ar: 'src/pages/ar/مشاريع/index.astro',
};

describe('project index count is per locale, not the whole collection', () => {
  test.each(Object.entries(WRAPPERS))('%s wrapper passes the {n} token through', (_loc, path) => {
    const src = readFileSync(path, 'utf8');
    expect(src).toContain("m.filter_search_placeholder({n: '{n}'})");
    // The bug itself: interpolating the unfiltered collection size.
    expect(src).not.toMatch(/filter_search_placeholder\(\{n:\s*projects\.length\}/);
  });

  test.each(Object.entries(WRAPPERS))('%s wrapper does not compute a locale-filtered length itself', (_loc, path) => {
    // Duplicating the filter in four wrappers is what let them drift. The
    // component owns it (src/lib/routeSegments.ts `idInLocale`).
    const src = readFileSync(path, 'utf8');
    expect(src).not.toMatch(/filter\(\s*\(?p\)?\s*=>/);
  });

  test('the component substitutes the filtered count into the placeholder', () => {
    const src = readFileSync('src/components/projects/ProjectListing.astro', 'utf8');
    expect(src).toContain("fs.searchPlaceholder.replace('{n}', String(projectCount))");
    expect(src).toContain('const localeProjects = rawProjects.filter(');
    expect(src).toContain('const projectCount = localeProjects.length;');
  });

  test('the live count label is filled from the rendered cards, not a constant', () => {
    const src = readFileSync('src/lib/projectsRender.ts', 'utf8');
    expect(src).toContain(".replace('{visible}', String(visible))");
    expect(src).toContain(".replace('{total}', String(cards.length))");
  });

  test('the locale filter the component uses matches routeSegments.idInLocale', async () => {
    const {idInLocale} = await import('../../src/lib/routeSegments.ts');
    expect(idInLocale('en', 'ai-agent')).toBe(true);
    expect(idInLocale('en', 'es/proyectos/ai-agent')).toBe(false);
    expect(idInLocale('es', 'es/proyectos/ai-agent')).toBe(true);
    expect(idInLocale('es', 'ai-agent')).toBe(false);
    expect(idInLocale('ar', 'ar/مشاريع/ai-agent')).toBe(true);
  });
});
