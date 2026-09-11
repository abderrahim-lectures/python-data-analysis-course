import {describe, expect, test} from 'vitest';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

function walkSrc(): string[] {
  const out: string[] = [];
  const rec = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        if (name === 'paraglide') continue;
        rec(p);
      } else if (p.endsWith('.astro') || p.endsWith('.ts')) {
        out.push(p);
      }
    }
  };
  rec('src');
  return out;
}

describe('string packs are gone', () => {
  const PACKS = ['pageStrings', 'uiStrings', 'creditsStrings', 'cheatsheetsStrings'];

  test.each(PACKS)('no source file imports %s', (pack) => {
    const files = walkSrc();
    const offenders = files.filter((f) => readFileSync(f, 'utf8').includes(`lib/${pack}`));
    expect(offenders).toEqual([]);
  });

  test.each(PACKS)('%s.ts no longer exists', (pack) => {
    expect(() => readFileSync(`src/lib/${pack}.ts`, 'utf8')).toThrow();
  });
});

describe('message files stay complete and translated', () => {
  const LOCALES = ['en', 'ar', 'es', 'fr'] as const;
  const EN = JSON.parse(readFileSync('messages/en.json', 'utf8')) as Record<string, string>;
  const ALL: Record<string, Record<string, string>> = Object.fromEntries(
    LOCALES.map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, 'utf8')) as Record<string, string>])
  );
  // Keys that intentionally read the same in every locale: brand names
  // (Pyodide, "Python 101", GitHub, "Students Performance in Exams"),
  // shell/commands, the shared "Changelog"/"Module"/"Site"/"Playground"/
  // "Normal"/"XP" labels, and the message-format schema field. Reviewed
  // 2026-09-08: "Changelog"/"Playground" could legitimately be translated
  // (es "Registro de cambios", fr "Terrain de jeu") — flagged for the
  // translation backlog rather than force-changed mid-migration.
  const SHARED = new Set([
    '$schema', 'credits_entry_1_name', 'credits_entry_3_name',
    'footer_changelog', 'footer_github', 'footer_python_101', 'footer_site_col',
    'home_hub_track_1_name', 'home_terminal_line_1', 'mobile_nav_playground',
    'module_label', 'nav_playground', 'playground_title',
    'track_1_name', 'track_normal_label', 'ui_changelog', 'xp_toast',
    // Progress page: the XP acronym, the K/D/A gaming acronym, the external
    // study citation, and the French rank "Bronze" are universal tokens that
    // read identically in every locale by design.
    'progress_xp_unit', 'progress_report_lede_study', 'progress_kpi_kda',
    'progress_rank_bronze', 'progress_report_lede_end',
    // Progress guide: same K/D/A acronym and same study citation token as
    // above; the guide repeats them verbatim on its own page.
    'progress_guide_report_kda', 'progress_guide_report_study_link',
    // Learn hub: "modules" is the same word in French; "lessons" is genuinely
    // translated everywhere (leçons, lecciones, دروس).
    'learn_hub_modules',
    // Progress guide: "Engagement" is the same word in French, matching the
    // learn-hub "modules" precedent.
    'progress_guide_report_engagement',
  ]);

  test.each(LOCALES)('%s has every message key (parity with en)', (loc) => {
    const keys = Object.keys(ALL[loc]).sort();
    expect(keys).toEqual(Object.keys(EN).sort());
  });

  test.each(LOCALES)('%s leaves no message empty', (loc) => {
    const empty = Object.entries(ALL[loc]).filter(([, v]) => !v.trim()).map(([k]) => k);
    expect(empty).toEqual([]);
  });

  test.each(LOCALES.filter((l) => l !== 'en'))('%s is actually translated, not English copy', (loc) => {
    // Guards the regression where an Arabic hub rendered English track text.
    const identical = Object.keys(ALL[loc])
      .filter((k) => !SHARED.has(k) && ALL[loc][k] === EN[k]);
    expect(identical).toEqual([]);
  });
});

describe('locale hub templates render strings, not literals', () => {
  const HUBS = [
    'src/pages/learn/index.astro',
    'src/components/learn/LearnHub.astro',
  ];

  test.each(HUBS)('%s has no hardcoded English track copy', (path) => {
    const src = readFileSync(path, 'utf8');
    expect(src).not.toMatch(/<p>Weeks \d+–\d+\./);
    expect(src).not.toContain('<h2>Pandas &amp; Data</h2>');
    expect(src).not.toContain('Choose your route:');
    expect(src).not.toContain('— start here<');
    expect(src).not.toContain('What you\'ll earn');
    expect(src).not.toContain('along the way');
    expect(src).not.toContain('total lesson XP');
    expect(src).not.toContain('of content');
  });

  test.each(HUBS)('%s renders the module-explanation note via paraglide', (path) => {
    const src = readFileSync(path, 'utf8');
    expect(src).toContain('learn_hub_module_explanation');
    expect(src).toContain('learn_hub_switch_routes');
    expect(src).toContain('learn_hub_cheatsheets_hint');
    expect(src).not.toContain('A <strong>module</strong> is your path');
  });

  test.each(HUBS)('%s collapses its grid responsively rather than at a fixed breakpoint', (path) => {
    // A hard `1fr 1fr` clipped the cards between ~720-900px.
    expect(readFileSync(path, 'utf8')).toContain('repeat(auto-fit, minmax(');
  });
});

describe('shared layout', () => {
  const src = readFileSync('src/layouts/Base.astro', 'utf8');

  test('the footer tagline comes from the paraglide message layer', () => {
    expect(src).toContain('{m.footer_tagline()}');
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

describe('module pages have proper structure', () => {
  // Legacy static module templates were deleted in the redesign; the shared
  // ModulePage component backs the lesson-class templates for every locale.
  const MODULE_TEMPLATES = [
    'src/components/learn/ModulePage.astro',
  ];

  test.each(MODULE_TEMPLATES)('%s lists lessons for the module', (path) => {
    const src = readFileSync(path, 'utf8');
    expect(src).toContain('moduleLessons');
    expect(src).toContain('lesson-card');
  });
});
