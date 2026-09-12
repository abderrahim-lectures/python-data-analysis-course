import {describe, expect, test} from 'vitest';
import {localizedProjectSlug} from '../../src/lib/projectSlugs';
import projectSlugs from '../../src/lib/projectSlugs.data.json';

const PROJECT_SLUGS = projectSlugs as Record<'ar' | 'es' | 'fr', Record<string, string>>;

describe('localizedProjectSlug', () => {
  test('EN always returns the canonical English slug', () => {
    expect(localizedProjectSlug('en', 'data-catalog')).toBe('data-catalog');
    expect(localizedProjectSlug('en', 'wordle-clone')).toBe('wordle-clone');
  });

  test('returns the localized slug for ar/es/fr when known', () => {
    expect(typeof localizedProjectSlug('ar', 'data-catalog')).toBe('string');
    expect(localizedProjectSlug('ar', 'data-catalog')).toBe(PROJECT_SLUGS.ar['data-catalog']);
    expect(localizedProjectSlug('es', 'data-catalog')).toBe(PROJECT_SLUGS.es['data-catalog']);
    expect(localizedProjectSlug('fr', 'data-catalog')).toBe(PROJECT_SLUGS.fr['data-catalog']);
  });

  test('falls back to the English slug for unknown projects', () => {
    expect(localizedProjectSlug('ar', 'not-a-real-project')).toBe('not-a-real-project');
    expect(localizedProjectSlug('fr', '')).toBe('');
  });
});

describe('generated project slug data', () => {
  test('covers every project per locale with non-empty slugs', () => {
    for (const locale of ['ar', 'es', 'fr'] as const) {
      const map = PROJECT_SLUGS[locale];
      for (const [en, localized] of Object.entries(map)) {
        expect(en).not.toBe('');
        expect(localized, `${locale}/${en}`).toBeTruthy();
      }
    }
  });

  test('localized slugs differ from their English slug (no self-aliasing)', () => {
    for (const locale of ['ar', 'es', 'fr'] as const) {
      for (const [en, localized] of Object.entries(PROJECT_SLUGS[locale])) {
        expect(localized, `${locale}/${en}`).not.toBe(en);
      }
    }
  });

  test('slugs within a locale are unique (incl. vs English filenames)', () => {
    for (const locale of ['ar', 'es', 'fr'] as const) {
      const map = PROJECT_SLUGS[locale];
      const seen = new Set<string>();
      // The English slug is an alias route param on localized pages, so a
      // localized slug colliding with an English filename would break the
      // getStaticPaths dedupe. Every generated slug must therefore not shadow
      // any English filename.
      const all = [
        ...Object.keys(map),
        ...Object.values(map),
      ];
      for (const slug of all) {
        expect(seen.has(slug), `${locale} duplicate: ${slug}`).toBe(false);
        seen.add(slug);
      }
    }
  });

  test('localized slugs are URL-safe (no spaces, no diacritics/tatweel)', () => {
    for (const locale of ['ar', 'es', 'fr'] as const) {
      for (const [en, localized] of Object.entries(PROJECT_SLUGS[locale])) {
        expect(localized, `${locale}/${en}`).not.toMatch(/\s/);
        // Latin slugs: [a-z0-9-]. Arabic slugs: Arabic letters + [0-9-].
        if (locale === 'ar') {
          expect(localized, `${locale}/${en}`).toMatch(/^[\u0600-\u06FF0-9-]+$/);
        } else {
          expect(localized, `${locale}/${en}`).toMatch(/^[a-z0-9-]+$/);
        }
      }
    }
  });
});