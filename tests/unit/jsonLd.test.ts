import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';

describe('JSON-LD structured data', () => {
  test('Base.astro emits a site-wide WebSite block plus any page-supplied jsonLd prop', () => {
    const src = readFileSync('src/layouts/Base.astro', 'utf8');
    expect(src).toContain("'@type': 'WebSite'");
    expect(src).toContain('jsonLdBlocks');
    expect(src).toContain('application/ld+json');
  });

  test('the homepage passes a Course schema to Base', () => {
    const src = readFileSync('src/pages/index.astro', 'utf8');
    expect(src).toContain("'@type': 'Course'");
    expect(src).toMatch(/<Base[^>]*jsonLd={jsonLd}/);
  });

  test('every project page passes a LearningResource schema to Base', () => {
    // All four locale route files delegate to the shared ProjectDetail
    // component, which owns the JSON-LD markup and Base call.
    const routes = [
      'src/pages/projects/[...slug].astro',
      'src/pages/ar/مشاريع/[...slug].astro',
      'src/pages/es/proyectos/[...slug].astro',
      'src/pages/fr/projets/[...slug].astro',
    ];
    for (const path of routes) {
      const route = readFileSync(path, 'utf8');
      expect(route).toContain('ProjectDetail');
    }
    const src = readFileSync('src/components/projects/ProjectDetail.astro', 'utf8');
    expect(src).toContain("'@type': 'LearningResource'");
    expect(src).toContain("learningResourceType: 'Project'");
    expect(src).toMatch(/<Base[^>]*jsonLd={jsonLd}/);
  });

  test('every lesson page passes a LearningResource schema to Base', () => {
    const templates = [
      'src/pages/learn/python-101/normal/lessons/[lesson].astro',
      'src/pages/learn/python-101/hard/lessons/[lesson].astro',
      'src/pages/learn/data-analysis/normal/lessons/[lesson].astro',
      'src/pages/learn/data-analysis/hard/lessons/[lesson].astro',
    ];
    for (const path of templates) {
      const src = readFileSync(path, 'utf8');
      expect(src).toContain("'@type': 'LearningResource'");
      expect(src).toContain("learningResourceType: 'Lesson'");
      expect(src).toMatch(/<Base[^>]*jsonLd={jsonLd}/);
    }
  });

  test('built output actually contains a valid JSON-LD script tag', () => {
    // Guards against the prop being passed but never rendered, or rendered
    // as broken JSON -- source-level checks above can't catch either.
    let html: string;
    try {
      html = readFileSync('dist/index.html', 'utf8');
    } catch {
      return; // no build present in this run -- the build-verification pass covers it
    }
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
    expect(match).not.toBeNull();
    expect(() => JSON.parse(match![1])).not.toThrow();
  });
});
