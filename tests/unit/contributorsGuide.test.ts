import {describe, expect, test} from 'vitest';
import {existsSync, readFileSync, mkdtempSync, rmSync, writeFileSync as writeFsFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

// The guide is the page a first-time contributor follows on their own. It was
// seven one-sentence steps with five commands and no example of the thing the
// whole task turns on: what the file actually looks like. A reader who has
// never added a project could finish it without knowing what to type into
// `title:` or what an author id is.
const SRC = readFileSync('src/components/ContributorsGuide.astro', 'utf8');
const LOCALES = ['en', 'es', 'fr', 'ar'] as const;
const pack = (loc: string) => JSON.parse(readFileSync(`messages/${loc}.json`, 'utf8')) as Record<string, string>;

describe('contributors guide is a walkthrough, not a summary', () => {
  test('every step has a title and a body in all four locales', () => {
    for (const loc of LOCALES) {
      const m = pack(loc);
      const steps = Object.keys(m).filter((k) => /^guide_step_\d+_title$/.test(k));
      expect(steps.length, loc).toBeGreaterThanOrEqual(14);
      for (let i = 1; i <= steps.length; i++) {
        expect(m[`guide_step_${i}_title`], `${loc} step ${i} title`).toBeTruthy();
        expect(m[`guide_step_${i}_body`], `${loc} step ${i} body`).toBeTruthy();
        // A one-clause body is the old summary shape; a walkthrough step
        // explains why or what, not just what to do.
        expect(m[`guide_step_${i}_body`].length, `${loc} step ${i} too terse`).toBeGreaterThan(60);
      }
    }
  });

  test('every step in the component maps to a message key that exists', () => {
    // The component now builds its steps from a range, so it is the message
    // keys that must exist rather than a literal call per step.
    const en = pack('en');
    expect(SRC).toContain('guide_step_${n}_title');
    for (let i = 1; i <= 14; i++) {
      expect(en[`guide_step_${i}_title`], `step ${i} title`).toBeTruthy();
      expect(en[`guide_step_${i}_steps`], `step ${i} sub-steps`).toBeTruthy();
    }
  });

  test('every step says what success looks like', () => {
    // The "you should see" block is the feedback loop: without it a beginner
    // cannot tell a silent success from a silent failure.
    const en = pack('en');
    for (let i = 1; i <= 14; i++) {
      expect(en[`guide_step_${i}_expect`], `step ${i} expected output`).toBeTruthy();
    }
    expect(SRC).toContain('guide-step__expect');
  });

  test('the English example carries author; translation examples omit it', () => {
    expect(SRC).toContain('FRONTMATTER_EXAMPLE');
    expect(SRC).toContain('TRANSLATED_FRONTMATTER_EXAMPLE');
    for (const field of ['title:', 'description:', 'difficulty:', 'author:']) {
      expect(SRC, field).toContain(field);
    }
    const enExample = SRC.match(/const FRONTMATTER_EXAMPLE = \[([\s\S]*?)\]\.join/)?.[1] ?? '';
    const localizedExample = SRC.match(/const TRANSLATED_FRONTMATTER_EXAMPLE = \[([\s\S]*?)\]\.join/)?.[1] ?? '';
    expect(enExample).toContain('author: your-id');
    expect(localizedExample).not.toContain('author:');
    for (const loc of LOCALES) expect(pack(loc).guide_step_6_translation).toBeTruthy();
  });

  test('the guide shows a registry entry, with the id the author field must match', () => {
    expect(SRC).toContain('REGISTRY_EXAMPLE');
    expect(SRC).toContain("id: 'your-id'");
    // Every field in the example must exist on the real Contributor interface.
    const example = SRC.match(/const REGISTRY_EXAMPLE = \[([\s\S]*?)\]\.join/)?.[1] ?? '';
    const contributors = readFileSync('src/lib/contributors.ts', 'utf8');
    for (const key of ['id', 'name', 'github', 'role']) {
      expect(example, `example uses ${key}`).toContain(`${key}:`);
      expect(contributors, `Contributor declares ${key}`).toMatch(new RegExp(`${key}\\??:`));
    }
  });

  test('the guide shows a small, runnable template instead of a pitch', () => {
    expect(SRC).toContain('BODY_EXAMPLE');
    expect(SRC).toContain('What you will do');
    expect(SRC).toContain('templates/project.md');
    expect(existsSync('templates/project.md')).toBe(true);
    const template = readFileSync('templates/project.md', 'utf8');
    for (const section of [
      '## 🎯 What you’ll do',
      '## Where to run this',
      '## Setup',
      '## Step 1:',
      '**👟 Starter hint:**',
      '**🎯 Expected output:**',
      '**🩹 If it’s off:**',
      '**✅ Checklist**',
      '**🤔 Socratic Questions**',
      '## ⚠️ Common pitfalls',
      '## What you just built',
      '## Where to go from here',
      '## Share your project with the class',
      '## 👤 Credit and licence',
    ]) expect(template.replaceAll('’', "'"), section).toContain(section.replaceAll('’', "'"));
    expect(template).toContain('from statistics import mean');
    expect(template).toContain('assert average([70, 80, 90]) == 80');
    expect(template).toContain('assert grade_letter(89) == "B"');
    // Colab/Kaggle/Binder badges must point at a real notebook path, as on
    // every published project page.
    for (const host of ['colab.research.google.com', 'kaggle.com', 'mybinder.org']) {
      expect(template, host).toContain(host);
    }
    expect(template).toContain('examples/YOUR-SLUG/notebook.ipynb');
    expect(template).toContain('node scripts/generate-notebooks.mjs');
    // Contributors keep their own credit and both repository licences.
    expect(template.toLowerCase()).toContain('credit');
    expect(template).toContain('CC BY 4.0');
    expect(template).toContain('MIT');
    const translated = readFileSync('templates/project.translated.md', 'utf8');
    expect(translated).toContain('ar/<your-slug>.md');
    expect(translated).toContain('es/<your-slug>.md');
    expect(translated).toContain('fr/<your-slug>.md');
    expect(translated.match(/^author:/m)).toBeNull();
    expect(translated).toContain('notebook.ar.ipynb');
    expect(translated).toContain('CC BY 4.0');
    expect(translated).toContain('MIT');
    // Keep the setup to Python's standard library, not a framework template.
    expect(template).toContain('from statistics import mean');
    expect(template).not.toContain('langchain');
  });

  test('the template’s Python files run as documented', () => {
    const template = readFileSync('templates/project.md', 'utf8');
    const chunks = [...template.matchAll(/^```python\n([\s\S]*?)^```$/gm)].map((m) => m[1]);
    const files = new Map<string, string[]>();
    for (const chunk of chunks) {
      const file = /^# (?:Append to )?([\w-]+\.py)$/m.exec(chunk)?.[1];
      if (file) files.set(file, [...(files.get(file) ?? []), chunk]);
    }
    expect([...files.keys()].sort()).toEqual(['grades.py', 'test_grades.py']);
    const dir = mkdtempSync(join(tmpdir(), 'pyda-guide-template-'));
    try {
      for (const [name, parts] of files) writeFsFileSync(join(dir, name), parts.join('\n\n'));
      const programme = spawnSync('python3', ['grades.py'], {cwd: dir, encoding: 'utf8', timeout: 20_000});
      expect(programme.status, programme.stderr).toBe(0);
      expect(programme.stdout).toContain('Average: 80.0');
      const tests = spawnSync('python3', ['test_grades.py'], {cwd: dir, encoding: 'utf8', timeout: 20_000});
      expect(tests.status, tests.stderr).toBe(0);
      expect(tests.stdout).toContain('Step 2 boundaries passed.');
      expect(tests.stdout).toContain('Input validation passed.');
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  test('the setup, preview and publication instructions match the repository', () => {
    expect(SRC).toContain('nvm install 22.23.4 && nvm use');
    expect(pack('en').guide_step_3_steps).toContain('485');
    expect(pack('en').guide_step_10_steps).toContain('about 138 MB');
    expect(SRC).toContain('npm run dev -- --host 127.0.0.1 --port 4322 --ignore-lock');
    expect(SRC).toContain('http://localhost:4321/contributors-guide/');
    expect(SRC.indexOf('npm run build')).toBeLessThan(SRC.indexOf('npm run test\nnpx tsc --noEmit'));
    expect(SRC).toContain('git status --short');
    expect(SRC).toContain('git add -A');
    expect(SRC).toContain('src/lib/projectSlugs.data.json');
    for (const loc of LOCALES) {
      const m = pack(loc);
      expect(m.guide_step_4_body, loc).toMatch(/file-organizer/i);
      expect(m.guide_step_6_body, loc).toContain('author');
      expect(m.guide_step_10_title.length, loc).toBeGreaterThan(0);
      expect(m.guide_step_14_title.length, loc).toBeGreaterThan(0);
      expect(m.guide_step_12_expect.length, loc).toBeGreaterThan(50);
      expect(m.guide_step_12_expect, loc).not.toContain('guarantee');
      expect(m.guide_agent_dev_body.length, loc).toBeGreaterThan(50);
      expect(pack('en').guide_step_14_steps).toContain('no draft flag');
      expect(m.guide_step_13_expect, loc).not.toContain('2 files changed');
      expect(m.guide_step_14_body, loc).toBeTruthy();
      if (loc !== 'en') expect(m.guide_tip_4, loc).not.toBe(pack('en').guide_tip_4);
    }
  });

  test('commands are data, index-aligned with the steps', () => {
    // A chain of `{i === n && <pre>}` blocks is how the guide fell out of step
    // with its own step count when a step was added.
    expect(SRC).toContain('const COMMANDS: Record<number, string>');
    expect(SRC).toContain('EXAMPLES.get(i)');
  });
});
