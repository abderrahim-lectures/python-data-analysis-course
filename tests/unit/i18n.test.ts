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
