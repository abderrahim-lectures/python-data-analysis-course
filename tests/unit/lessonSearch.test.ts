import {describe, expect, test} from 'vitest';
import {searchLessons, lessonHrefFor} from '../../src/lib/lessonSearch';
import type {LessonIndexEntry} from '../../src/lib/lessonIndexTypes';

const entry = (over: Partial<LessonIndexEntry>): LessonIndexEntry => ({
  id: 'statistics-101/normal/12-confidence-intervals',
  locale: 'en',
  section: 'statistics-101',
  track: 'normal',
  slug: '12-confidence-intervals',
  title: 'Confidence Intervals',
  description: 'A range that usually contains the truth.',
  module: 'samples-and-uncertainty',
  tags: ['confidence-interval', 'inference'],
  ...over,
});

const INDEX: LessonIndexEntry[] = [
  entry({}),
  entry({id: 'statistics-101/normal/09-correlation', slug: '09-correlation', title: 'Correlation', description: 'How two variables move together.', tags: ['correlation']}),
  entry({id: 'python-101/normal/01-printing', slug: '01-printing', section: 'python-101', title: 'Printing & Output', description: 'Display results with print().', tags: ['print']}),
  entry({id: 'ar/تعلم/statistics-101/عادي/دروس/09-correlation', locale: 'ar', slug: '09-correlation', title: 'الارتباط', description: 'كيف تتحرك متغيرين معًا.', tags: ['الارتباط']}),
];

describe('lesson search', () => {
  test('finds a lesson by a word in its title', () => {
    const hits = searchLessons(INDEX, 'confidence');
    expect(hits).toHaveLength(1);
    expect(hits[0].entry.slug).toBe('12-confidence-intervals');
  });

  test('every term must match, so more typing narrows', () => {
    expect(searchLessons(INDEX, 'confidence')).toHaveLength(1);
    expect(searchLessons(INDEX, 'confidence intervals')).toHaveLength(1);
    expect(searchLessons(INDEX, 'confidence zebra')).toHaveLength(0);
  });

  test('matches a tag when the title does not contain the word', () => {
    const hits = searchLessons(INDEX, 'inference');
    expect(hits.map((h) => h.entry.slug)).toContain('12-confidence-intervals');
  });

  test('a title hit outranks a description-only hit', () => {
    const index = [
      entry({id: 'a', slug: 'a', title: 'Something Else', description: 'about variance'}),
      entry({id: 'b', slug: 'b', title: 'Variance', description: 'unrelated'}),
    ];
    expect(searchLessons(index, 'variance')[0].entry.slug).toBe('b');
  });

  test('is case- and diacritic-insensitive', () => {
    const fr = [entry({id: 'fr/x', locale: 'fr', title: 'Corrélation', slug: 'correlation'})];
    expect(searchLessons(fr, 'correlation')).toHaveLength(1);
    expect(searchLessons(fr, 'CORRÉLATION')).toHaveLength(1);
  });

  test('matches Arabic text', () => {
    const hits = searchLessons(INDEX, 'الارتباط');
    expect(hits).toHaveLength(1);
    expect(hits[0].entry.locale).toBe('ar');
  });

  test('an empty query returns nothing rather than everything', () => {
    expect(searchLessons(INDEX, '')).toEqual([]);
    expect(searchLessons(INDEX, '   ')).toEqual([]);
  });

  test('respects the result limit', () => {
    const many = Array.from({length: 30}, (_, i) =>
      entry({id: `x${i}`, slug: `x${i}`, title: `Test lesson ${i}`}));
    expect(searchLessons(many, 'test', 8)).toHaveLength(8);
  });
});

describe('lesson hrefs use the locale’s own route words', () => {
  const words = {
    en: {learn: 'learn', lessons: 'lessons', tracks: {normal: 'normal', hard: 'hard'}},
    ar: {learn: 'تعلم', lessons: 'دروس', tracks: {normal: 'عادي', hard: 'صعب'}},
    es: {learn: 'aprender', lessons: 'lecciones', tracks: {normal: 'normal', hard: 'dificil'}},
    fr: {learn: 'apprendre', lessons: 'cours', tracks: {normal: 'normal', hard: 'difficile'}},
  } as const;

  test('English stays unprefixed', () => {
    expect(lessonHrefFor(entry({}), words.en))
      .toBe('/learn/statistics-101/normal/lessons/12-confidence-intervals');
  });

  test('Arabic uses its own words, including the track word', () => {
    // Hardcoding 'normal' here is the bug that once broke every localized CTA:
    // Arabic routes its normal track as عادي, so /normal is a 404.
    const href = lessonHrefFor(
      entry({id: 'ar/x', locale: 'ar', slug: '09-correlation', track: 'normal'}),
      words.ar,
    );
    expect(decodeURIComponent(href)).toContain('تعلم');
    expect(decodeURIComponent(href)).toContain('عادي');
    expect(decodeURIComponent(href)).toContain('دروس');
    expect(href).not.toContain('/normal/');
  });

  test.each(['es', 'fr'] as const)('%s uses its localized words', (loc) => {
    const href = lessonHrefFor(entry({id: `${loc}/x`, locale: loc, track: 'hard'}), words[loc]);
    expect(href.startsWith(`/${loc}/`)).toBe(true);
    expect(href).not.toContain('/hard/');
  });
});
