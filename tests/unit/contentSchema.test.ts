import {describe, expect, test} from 'vitest';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

// ── Content collection schema validation ────────────────────────────
// Ensures the new lessons/modules collections have the right fields.
// Walks every locale tree too (ar/es/fr live one level deeper than EN).

function parseFrontmatter(src: string): Record<string, string> {
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const out: Record<string, string> = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const LOCALES = ['ar', 'es', 'fr'];

// A track group is every `{section}/{track}` (EN) or `{locale}/{section}/{track}`
// dir holding .md files — locale dirs sit one level deeper than sections.
function collectGroups(root: string): Array<{label: string; dir: string; files: string[]}> {
  const groups: Array<{label: string; dir: string; files: string[]}> = [];
  const top = existsSync(root) ? readdirSync(root) : [];
  for (const entry of top) {
    const bases: Array<[string, string]> = LOCALES.includes(entry)
      ? (existsSync(join(root, entry)) ? readdirSync(join(root, entry)) : []).map((s) => [join(root, entry, s), `${entry}/${s}`])
      : [[join(root, entry), entry]];
    for (const [base, label] of bases) {
      if (!existsSync(base)) continue;
      for (const track of readdirSync(base)) {
        const dir = join(base, track);
        if (!existsSync(dir)) continue;
        const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
        groups.push({label: `${label}/${track}`, dir, files});
      }
    }
  }
  return groups;
}

// ── Lessons collection ──────────────────────────────────────────────
const LESSONS_DIR = 'src/content/lessons';
const lessonGroups = collectGroups(LESSONS_DIR);

describe('lessons collection', () => {
  for (const g of lessonGroups) {
    describe(g.label, () => {
      test(`${g.files.length} lesson files`, () => {
        expect(g.files.length).toBeGreaterThan(0);
      });

      test.each(g.files)('%s has order field', (file) => {
        const fm = parseFrontmatter(readFileSync(join(g.dir, file), 'utf8'));
        expect(fm.order).toBeDefined();
        expect(Number(fm.order)).toBeGreaterThan(0);
      });

      test.each(g.files)('%s has module field', (file) => {
        const fm = parseFrontmatter(readFileSync(join(g.dir, file), 'utf8'));
        expect(fm.module).toBeDefined();
        expect(fm.module.length).toBeGreaterThan(0);
      });

      test.each(g.files)('%s has xpReward field', (file) => {
        const fm = parseFrontmatter(readFileSync(join(g.dir, file), 'utf8'));
        expect(fm.xpReward).toBeDefined();
        expect(Number(fm.xpReward)).toBeGreaterThan(0);
      });
    });
  }
});

// ── Modules collection ──────────────────────────────────────────────
const MODULES_DIR = 'src/content/modules';
const moduleGroups = collectGroups(MODULES_DIR);

describe('modules collection', () => {
  for (const g of moduleGroups) {
    describe(g.label, () => {
      test(`${g.files.length} module files`, () => {
        expect(g.files.length).toBeGreaterThan(0);
      });

      test.each(g.files)('%s has icon field', (file) => {
        const fm = parseFrontmatter(readFileSync(join(g.dir, file), 'utf8'));
        expect(fm.icon).toBeDefined();
      });

      test.each(g.files)('%s has estimatedHours field', (file) => {
        const fm = parseFrontmatter(readFileSync(join(g.dir, file), 'utf8'));
        expect(fm.estimatedHours).toBeDefined();
        expect(Number(fm.estimatedHours)).toBeGreaterThan(0);
      });
    });
  }
});

// ── Projects collection ─────────────────────────────────────────────
const PROJECTS_DIR = 'src/content/projects';
const projectFiles = existsSync(PROJECTS_DIR)
  ? readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.md'))
  : [];

describe('projects collection', () => {
  test('has project files', () => {
    expect(projectFiles.length).toBeGreaterThan(50);
  });

  test.each(projectFiles.slice(0, 10))('%s has title in frontmatter', (file) => {
    const fm = parseFrontmatter(readFileSync(join(PROJECTS_DIR, file), 'utf8'));
    expect(fm.title).toBeDefined();
    expect(fm.title.length).toBeGreaterThan(2);
  });
});

// ── content.config.ts schema definitions ────────────────────────────
describe('content config', () => {
  const config = readFileSync('src/content.config.ts', 'utf8');

  test('defines lessons collection', () => {
    expect(config).toContain('const lessons = defineCollection');
    expect(config).toMatch(/collections\s*=\s*\{[\s\S]*?lessons/);
  });

  test('defines modules collection', () => {
    expect(config).toContain('const modules = defineCollection');
    expect(config).toMatch(/collections\s*=\s*\{[\s\S]*?modules/);
  });

  test('lessons schema has module field', () => {
    expect(config).toMatch(/const lessons = defineCollection[\s\S]*?module:\s*z/);
  });

  test('lessons schema has order field', () => {
    expect(config).toMatch(/const lessons = defineCollection[\s\S]*?order:\s*z/);
  });

  test('modules schema has icon field', () => {
    expect(config).toMatch(/const modules = defineCollection[\s\S]*?icon:\s*z/);
  });

  test('modules schema has order field', () => {
    expect(config).toMatch(/const modules = defineCollection[\s\S]*?order:\s*z/);
  });
});
