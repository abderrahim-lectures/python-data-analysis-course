import {describe, expect, test} from 'vitest';
import {
  DIFFICULTY_COLORS,
  PROJECT_DIFFICULTY,
  PROJECT_TAGS,
  projectArtEmoji,
  projectArtGradient,
  projectDifficulty,
} from '../../src/lib/projectArt';

describe('projectArtEmoji', () => {
  test('first matching tag in specificity order wins', () => {
    expect(projectArtEmoji(['CLI Tools', 'Git', 'AI Agents'])).toBe('🌿');
    expect(projectArtEmoji(['AI Agents', 'Playwright', 'Automation'])).toBe('🎭');
    expect(projectArtEmoji(['RAG', 'PDFs', 'Embeddings'])).toBe('📚');
    expect(projectArtEmoji(['Machine Learning', 'scikit-learn'])).toBe('🧠');
    expect(projectArtEmoji(['Games', 'CLI Tools'])).toBe('🎮');
    expect(projectArtEmoji(['pandas', 'Finance'])).toBe('🐼');
  });

  test('falls back to the laptop for unknown tags', () => {
    expect(projectArtEmoji([])).toBe('💻');
    expect(projectArtEmoji(['Mystery Tag'])).toBe('💻');
  });

  test('emits an emoji for every project slug (data completeness)', () => {
    for (const [slug, tags] of Object.entries(PROJECT_TAGS)) {
      const emoji = projectArtEmoji(tags);
      expect(emoji, `slug ${slug}`).toBeTruthy();
      expect(emoji, `slug ${slug}`).not.toBe('💻');
      expect(tags.length, `slug ${slug} has tags`).toBeGreaterThan(0);
    }
  });
});

describe('projectArtGradient', () => {
  test('is deterministic for a slug', () => {
    const a = projectArtGradient('chat-with-pdfs');
    expect(a).toEqual(projectArtGradient('chat-with-pdfs'));
  });

  test('returns a known stop pair', () => {
    expect(projectArtGradient('whatever')).toMatchObject({from: expect.stringMatching(/^#/), to: expect.stringMatching(/^#/)});
  });

  test('spreads distinct slugs across gradients', () => {
    const seen = new Set<string>();
    for (const slug of Object.keys(PROJECT_TAGS)) {
      see: {
        const g = projectArtGradient(slug);
        seen.add(`${g.from}->${g.to}`);
      }
    }
    expect(seen.size).toBeGreaterThan(3);
  });
});

describe('projectDifficulty', () => {
  test('known slugs resolve to their declared level', () => {
    expect(projectDifficulty('multi-agent-research')).toBe('advanced');
    expect(projectDifficulty('wordle-clone')).toBe('beginner');
    expect(projectDifficulty('chat-with-pdfs')).toBe('intermediate');
  });

  test('unknown slugs default to beginner', () => {
    expect(projectDifficulty('nope-not-a-project')).toBe('beginner');
  });

  test('every declared difficulty is one of the three levels', () => {
    for (const level of Object.values(PROJECT_DIFFICULTY)) {
      expect(['beginner', 'intermediate', 'advanced']).toContain(level);
    }
  });

  test('difficulty colors are complete and label keys distinct', () => {
    for (const c of Object.values(DIFFICULTY_COLORS)) {
      expect(c.bg).toMatch(/^#/);
      expect(c.text).toMatch(/^#/);
      expect(c.label).toMatch(/^difficulty_/);
    }
    const labels = Object.values(DIFFICULTY_COLORS).map((c) => c.label);
    expect(new Set(labels).size).toBe(3);
  });
});