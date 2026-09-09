import {describe, expect, test} from 'vitest';
import {levelForXp, xpProgressFor} from '../../src/lib/levelMath';
import {highlightPython} from '../../src/lib/pyHighlight';
import {encodeShareCode, decodeShareCode} from '../../src/lib/codeShare';
import {
  notebookGitHubUrl, notebookRawUrl, notebookColabUrl, notebookNbviewerUrl,
  notebookBinderUrl, notebookDeepnoteUrl, NOTEBOOK_OPENERS,
} from '../../src/lib/notebookLinks';
import {
  detectLocale, trackFromWord, localeBase, idInLocale, bareId,
  learnHref, projectsHref, progressHref, playgroundHref, creditsHref,
  cheatsheetsHref, weekHref, moduleHref, lessonHref, trackWord,
  ALL_LOCALES,
} from '../../src/lib/routeSegments';
import {sectionName, sectionDescription, sectionIcon, trackName} from '../../src/lib/sections';
import {relatedProjectSlugs, RELATED_PROJECTS} from '../../src/lib/relatedProjects';
import {PLAYGROUND_STARTER} from '../../src/lib/playgroundStarter';

describe('levelMath', () => {
  test('levelForXp floors at 1 and climbs with the curve', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(-5)).toBe(1);
    expect(levelForXp(10)).toBe(1);
    expect(levelForXp(50)).toBe(1 + Math.floor(Math.pow(50 / 50, 0.6)));
    expect(levelForXp(1e6)).toBeGreaterThan(levelForXp(50));
  });

  test('xpProgressFor shapes a level window', () => {
    const p = xpProgressFor(60);
    expect(p.level).toBe(levelForXp(60));
    expect(p.toNext).toBeGreaterThan(0);
    expect(p.pct).toBeGreaterThanOrEqual(0);
    expect(p.pct).toBeLessThanOrEqual(100);
  });

  test('xpProgressFor clamps pct at 100 when xp saturates the window', () => {
    const atBoundary = xpProgressFor(50); // exactly the level-2 boundary
    expect(atBoundary.level).toBe(2);
    expect(atBoundary.pct).toBeLessThanOrEqual(100);
    // huge xp must not produce NaN/negative progress
    const huge = xpProgressFor(1e15);
    expect(Number.isNaN(huge.pct)).toBe(false);
    expect(Number.isNaN(huge.toNext)).toBe(false);
    expect(huge.level).toBeGreaterThan(1);
  });
});

describe('pyHighlight', () => {
  test('styles keywords, strings, numbers, comments and def names', () => {
    const out = highlightPython('def greet(name):\n    print(f"Hi {name}")  # hi\n    42\n');
    expect(out).toContain('tok-kw');
    expect(out).toContain('tok-def');
    expect(out).toContain('tok-str');
    expect(out).toContain('tok-com');
    expect(out).toContain('tok-num');
    expect(out).toContain('tok-builtin');
  });

  test('escapes HTML in plain text', () => {
    const out = highlightPython('a < b & c > d');
    expect(out).toContain('a &lt; b &amp; c &gt; d');
    expect(out).not.toMatch(/<(?!\/?span)/); // no stray HTML tags
  });

  test('handles matching prefixes and empty input', () => {
    expect(highlightPython('')).toBe('');
    const t = highlightPython("'single'");
    expect(t).toContain('tok-str');
  });

  test('leaves non-token text legible after spans', () => {
    const out = highlightPython('x = 1 + 2   # note');
    const plain = out.replace(/<[^>]+>/g, '');
    expect(plain).toBe('x = 1 + 2   # note');
    expect(out).toContain('tok-num');
  });
});

describe('codeShare gzip+base64url', () => {
  test('round-trips a body of code', async () => {
    const src = 'print("hello")\nfor i in range(3):\n    print(i)\n\u2013 unicode ✓';
    const enc = await encodeShareCode(src);
    expect(enc).not.toMatch(/[+/=]/); // base64url charset
    expect(await decodeShareCode(enc)).toBe(src);
  });

  test('round-trips empty and long payloads', async () => {
    expect(await decodeShareCode(await encodeShareCode(''))).toBe('');
    const big = 'line\n'.repeat(500);
    expect(await decodeShareCode(await encodeShareCode(big))).toBe(big);
  });
});

describe('notebookLinks', () => {
  const a = ['data-analysis', 'normal', '09-titanic-loading'] as const;
  test('github blob + raw embed owner/repo/branch', () => {
    expect(notebookGitHubUrl(...a)).toContain('github.com/abderrahim-lectures/python-data-analysis-course/blob/main/notebooks/data-analysis/normal/09-titanic-loading.ipynb');
    expect(notebookRawUrl(...a)).toContain('raw.githubusercontent.com/abderrahim-lectures/python-data-analysis-course/main/notebooks/');
  });

  test('external openers rewrite the raw path', () => {
    expect(notebookColabUrl(...a)).toMatch(/^https:\/\/colab\.research\.google\.com\/github\//);
    expect(notebookNbviewerUrl(...a)).toMatch(/^https:\/\/nbviewer\.org\/urls\//);
    expect(notebookBinderUrl(...a)).toContain('mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/HEAD');
    expect(notebookDeepnoteUrl(...a)).toMatch(/^https:\/\/deepnote\.com\/launch\?url=/);
  });

  test('NOTEBOOK_OPENERS references every provider', () => {
    const labels = NOTEBOOK_OPENERS.map((o) => o.label);
    expect(labels).toContain('Colab');
    expect(labels).toContain('Binder');
    expect(labels).toContain('GitHub');
  });
});

describe('routeSegments', () => {
  test('detectLocale reads the first or second segment', () => {
    expect(detectLocale('/')).toBe('en');
    expect(detectLocale('/learn/...')).toBe('en');
    expect(detectLocale('/ar/')).toBe('ar');
    expect(detectLocale('/fr/learn/aprender')).toBe('fr');
  });

  test('trackFromWord maps words per locale and rejects strangers', () => {
    expect(trackFromWord('en', 'hard')).toBe('hard');
    expect(trackFromWord('ar', 'عادي')).toBe('normal');
    expect(trackFromWord('es', 'dificil')).toBe('hard');
    expect(trackFromWord('fr', 'normale')).toBeNull();
    expect(trackFromWord('en', 'bogus')).toBeNull();
  });

  test('localeBase and trackWord', () => {
    expect(localeBase('en', '/')).toBe('/');
    expect(localeBase('ar', '/')).toBe('/ar/');
    for (const l of ALL_LOCALES) {
      expect(trackWord(l, 'normal')).toBeTruthy();
      expect(trackWord(l, 'hard')).toBeTruthy();
    }
  });

  test('idInLocale and bareId', () => {
    expect(idInLocale('en', 'python-101/normal/01-printing')).toBe(true);
    expect(idInLocale('en', 'ar/python-101/normal/01-printing')).toBe(false);
    expect(idInLocale('ar', 'ar/python-101/normal/01-printing')).toBe(true);
    expect(idInLocale('ar', 'python-101/normal/01-printing')).toBe(false);
    expect(bareId('ar/python-101/normal/01-printing')).toBe('python-101/normal/01-printing');
    expect(bareId('python-101/normal/01-printing')).toBe('python-101/normal/01-printing');
    expect(bareId('fr/data-analysis/hard/01-x')).toBe('data-analysis/hard/01-x');
  });

  test('href builders localize nav + interior words with base prefix', () => {
    const dec = (p: string) => decodeURIComponent(p);
    expect(learnHref('en', '', 'python-101', trackWord('en', 'hard'), 'lessons', '01-x')).toBe('/learn/python-101/hard/lessons/01-x');
    expect(dec(learnHref('ar', '', 'python-101', trackWord('ar', 'normal'), 'وحدات', 'a'))).toBe('/ar/تعلم/python-101/عادي/وحدات/a');
    expect(dec(projectsHref('es', '', ...[] as string[]))).toBe('/es/proyectos');
    expect(progressHref('fr', '')).toBe('/fr/progression');
    expect(playgroundHref('ar', '')).toBe('/ar/playground');
    expect(creditsHref('es', '')).toBe('/es/creditos');
    expect(cheatsheetsHref('fr', '')).toBe('/fr/antiseche');
    expect(learnHref('en', '/base/', 'python-101', 'normal', 'modules', 'm1')).toBe('/base/learn/python-101/normal/modules/m1');
  });

  test('week/module/lesson hrefs compose interior words', () => {
    const dec = (p: string) => decodeURIComponent(p);
    expect(weekHref('en', '', 'python-101', 'normal', 3)).toBe('/learn/python-101/normal/week-3');
    expect(dec(moduleHref('fr', '', 'data-analysis', 'hard', 'm1'))).toBe('/fr/apprendre/data-analysis/difficile/modules/m1');
    expect(dec(lessonHref('ar', '', 'data-analysis', 'normal', 'l9'))).toBe('/ar/تعلم/data-analysis/عادي/دروس/l9');
  });
});

describe('sections', () => {
  test('names/descriptions resolve per section and icon fallback works', () => {
    expect(sectionName('en', 'python-101')).toBeTruthy();
    expect(sectionDescription('en', 'data-analysis')).toBeTruthy();
    expect(sectionName('en', 'unknown-slug')).toBeTruthy();
    expect(sectionIcon('python-101')).toBe('🐍');
    expect(sectionIcon('data-analysis')).toBe('📊');
    expect(sectionIcon('nope')).toBe('📚');
    expect(trackName('en', 'normal')).toBeTruthy();
    expect(trackName('en', 'hard')).toBeTruthy();
  });
});

describe('relatedProjects', () => {
  test('every mapped lesson has a non-empty pair', () => {
    for (const [key, slugs] of Object.entries(RELATED_PROJECTS)) {
      expect(key.split('/')).toHaveLength(3);
      expect(Array.isArray(slugs)).toBe(true);
      expect(slugs.length).toBeGreaterThan(0);
    }
  });

  test('lookup returns [] for unknown lessons', () => {
    expect(relatedProjectSlugs('python-101', 'normal', '99-unknown')).toEqual([]);
    expect(relatedProjectSlugs('data-analysis', 'normal', '09-titanic-loading')).not.toEqual([]);
  });
});

describe('playgroundStarter', () => {
  test('starter is a working snippet with a def + call', () => {
    expect(PLAYGROUND_STARTER).toContain('def greet(name):');
    expect(PLAYGROUND_STARTER).toContain('print(greet("world"))');
  });
});