import {describe, expect, test} from 'vitest';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

// ── Lesson content files ────────────────────────────────────────────
const LESSONS_DIR = 'src/content/lessons/python-101/normal';
const lessonFiles = existsSync(LESSONS_DIR)
  ? readdirSync(LESSONS_DIR).filter((f) => f.endsWith('.md'))
  : [];

describe('lesson content files', () => {
  test('at least 5 lesson files exist', () => {
    expect(lessonFiles.length).toBeGreaterThanOrEqual(5);
  });

  test.each(lessonFiles)('%s has required frontmatter fields', (file) => {
    const src = readFileSync(join(LESSONS_DIR, file), 'utf8');
    const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    expect(fm).toMatch(/title:/);
    expect(fm).toMatch(/description:/);
    expect(fm).toMatch(/order:/);
    expect(fm).toMatch(/difficulty:/);
    expect(fm).toMatch(/estimatedMinutes:/);
    expect(fm).toMatch(/learningObjectives:/);
    expect(fm).toMatch(/tags:/);
    expect(fm).toMatch(/xpReward:/);
    expect(fm).toMatch(/module:/);
  });

  test.each(lessonFiles)('%s has content after frontmatter', (file) => {
    const src = readFileSync(join(LESSONS_DIR, file), 'utf8');
    const body = src.replace(/^---[\s\S]*?---\r?\n/, '').trim();
    expect(body.length).toBeGreaterThan(100);
  });

  test.each(lessonFiles)('%s has valid difficulty value', (file) => {
    const src = readFileSync(join(LESSONS_DIR, file), 'utf8');
    const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const diff = fm.match(/difficulty:\s*"?(\w+)"?/)?.[1];
    expect(['beginner', 'intermediate', 'advanced']).toContain(diff);
  });
});

// ── Module content files ────────────────────────────────────────────
const MODULES_DIR = 'src/content/modules/python-101/normal';
const moduleFiles = existsSync(MODULES_DIR)
  ? readdirSync(MODULES_DIR).filter((f) => f.endsWith('.md'))
  : [];

describe('module content files', () => {
  test('at least 2 module files exist', () => {
    expect(moduleFiles.length).toBeGreaterThanOrEqual(2);
  });

  test.each(moduleFiles)('%s has required frontmatter fields', (file) => {
    const src = readFileSync(join(MODULES_DIR, file), 'utf8');
    const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    expect(fm).toMatch(/title:/);
    expect(fm).toMatch(/description:/);
    expect(fm).toMatch(/order:/);
    expect(fm).toMatch(/difficulty:/);
    expect(fm).toMatch(/estimatedHours:/);
    expect(fm).toMatch(/tags:/);
    expect(fm).toMatch(/icon:/);
  });

  test.each(moduleFiles)('%s has content after frontmatter', (file) => {
    const src = readFileSync(join(MODULES_DIR, file), 'utf8');
    const body = src.replace(/^---[\s\S]*?---\r?\n/, '').trim();
    expect(body.length).toBeGreaterThan(50);
  });
});

// ── Lesson viewer page ──────────────────────────────────────────────
describe('lesson viewer page', () => {
  const src = readFileSync('src/pages/learn/python-101/normal/lessons/[lesson].astro', 'utf8');

  test('has data-lesson-id on the article', () => {
    expect(src).toContain('data-lesson-id={lessonId}');
  });

  test('imports InteractiveChallenge', () => {
    expect(src).toContain('InteractiveChallenge');
  });

  test('has mark complete button', () => {
    expect(src).toContain('data-mark-complete');
  });

  test('calls completeLesson on click', () => {
    expect(src).toContain('completeLesson');
  });

  test('checks isLessonComplete on load', () => {
    expect(src).toContain('isLessonComplete');
  });

  test('has prev/next navigation', () => {
    expect(src).toContain('lesson-nav__prev');
    expect(src).toContain('lesson-nav__next');
  });

  test('displays difficulty, time, and XP metadata', () => {
    expect(src).toContain('lesson-head__diff');
    expect(src).toContain('lesson-head__time');
    expect(src).toContain('lesson-head__xp');
  });

  test('displays learning objectives', () => {
    expect(src).toContain('lesson-head__objectives');
    expect(src).toContain('learningObjectives');
  });

  test('has JSON-LD structured data', () => {
    expect(src).toContain("'@type': 'LearningResource'");
    expect(src).toContain("learningResourceType: 'Lesson'");
  });
});

// ── Module listing page ─────────────────────────────────────────────
describe('module listing page', () => {
  const src = readFileSync('src/pages/learn/python-101/normal/modules/[module].astro', 'utf8');

  test('shows module icon', () => {
    expect(src).toContain('module-head__icon');
    expect(src).toContain('icon');
  });

  test('lists lessons in the module', () => {
    expect(src).toContain('lessons-grid');
    expect(src).toContain('lesson-card');
  });

  test('shows lesson difficulty, time, and XP', () => {
    expect(src).toContain('lesson-card__meta');
  });

  test('has prev/next module navigation', () => {
    expect(src).toContain('ModuleNav');
  });

  test('ModuleNav renders prev/next links', () => {
    const nav = readFileSync('src/components/ModuleNav.astro', 'utf8');
    expect(nav).toContain('module-nav__prev');
    expect(nav).toContain('module-nav__next');
  });
});

// ── Python 101 section index ────────────────────────────────────────
describe('Python 101 section index', () => {
  const src = readFileSync('src/pages/learn/python-101/index.astro', 'utf8');

  test('displays total lessons, hours, and modules', () => {
    expect(src).toContain('normalLessons.length');
    expect(src).toContain('totalHours');
    expect(src).toContain('normalModules.length');
  });

  test('renders module cards with icons', () => {
    expect(src).toContain('module-card__icon');
    expect(src).toContain('icon');
  });

  test('shows per-module lesson count and time', () => {
    expect(src).toContain('lessonCount');
    expect(src).toContain('totalMin');
  });
});

// ── InteractiveChallenge component ───────────────────────────────────
describe('InteractiveChallenge component', () => {
  const src = readFileSync('src/components/InteractiveChallenge.astro', 'utf8');

  test('has contenteditable code area', () => {
    expect(src).toContain('contenteditable="true"');
  });

  test('has Run and Check buttons', () => {
    expect(src).toContain('data-run');
    expect(src).toContain('data-check');
  });

  test('loads Pyodide via CDN singleton', () => {
    expect(src).toContain('cdn.jsdelivr.net/pyodide');
    expect(src).toContain('loadPyodide');
  });

  test('captures stdout for comparison', () => {
    expect(src).toContain('setStdout');
  });

  test('calls recordChallenge for XP', () => {
    expect(src).toContain('recordChallenge');
  });

  test('does not use addXP for challenges', () => {
    expect(src).not.toContain('m.addXP');
  });

  test('awards XP only once per challenge', () => {
    expect(src).toContain('awarded');
  });

  test('blocks js/pyodide bridge imports', () => {
    expect(src).toContain('usesJsBridge');
  });

  test('sets stdin to prevent hanging on input()', () => {
    expect(src).toContain('setStdin');
  });

  test('disables Check button during execution', () => {
    expect(src).toContain('checkBtn.disabled = true');
    expect(src).toContain('checkBtn.disabled = false');
  });

  test('has hint section', () => {
    expect(src).toContain('Need a hint?');
  });

  test('shows XP badge in header', () => {
    expect(src).toContain('ichallenge__xp');
  });
});

// ── NotebookCell component ──────────────────────────────────────────
describe('NotebookCell component', () => {
  const src = readFileSync('src/components/NotebookCell.astro', 'utf8');

  test('supports markdown cell type', () => {
    expect(src).toContain("type === 'markdown'");
  });

  test('supports code cell type via ternary', () => {
    expect(src).toContain("type === 'markdown'");
  });

  test('has run button for code cells', () => {
    expect(src).toContain('data-run');
  });

  test('has expand/playground link', () => {
    expect(src).toContain('data-expand');
  });

  test('uses slot for markdown content', () => {
    expect(src).toContain('<slot />');
  });
});
