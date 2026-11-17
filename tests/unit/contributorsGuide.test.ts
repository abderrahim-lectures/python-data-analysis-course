import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';

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
      expect(steps.length, loc).toBeGreaterThanOrEqual(12);
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
    for (let i = 1; i <= 12; i++) {
      expect(en[`guide_step_${i}_title`], `step ${i} title`).toBeTruthy();
      expect(en[`guide_step_${i}_steps`], `step ${i} sub-steps`).toBeTruthy();
    }
  });

  test('every step says what success looks like', () => {
    // The "you should see" block is the feedback loop: without it a beginner
    // cannot tell a silent success from a silent failure.
    const en = pack('en');
    for (let i = 1; i <= 12; i++) {
      expect(en[`guide_step_${i}_expect`], `step ${i} expected output`).toBeTruthy();
    }
    expect(SRC).toContain('guide-step__expect');
  });

  test('the guide shows a real frontmatter example', () => {
    expect(SRC).toContain('FRONTMATTER_EXAMPLE');
    // The four required fields, as the content schema enforces them.
    for (const field of ['title:', 'description:', 'difficulty:', 'author:']) {
      expect(SRC, field).toContain(field);
    }
  });

  test('the guide shows a registry entry, with the id the author field must match', () => {
    expect(SRC).toContain('REGISTRY_EXAMPLE');
    expect(SRC).toContain("id: 'your-id'");
  });

  test('the guide shows a body example, not just tells you to write one', () => {
    expect(SRC).toContain('BODY_EXAMPLE');
    expect(SRC).toContain('What you will do');
  });

  test('commands are data, index-aligned with the steps', () => {
    // A chain of `{i === n && <pre>}` blocks is how the guide fell out of step
    // with its own step count when a step was added.
    expect(SRC).toContain('const COMMANDS: Record<number, string>');
    expect(SRC).toContain('COMMANDS[i]');
  });
});
