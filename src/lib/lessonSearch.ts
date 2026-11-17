// Lesson search: a client-side filter over the compile-time index.
//
// The index is inlined as JSON on the learn hub, so there is no fetch and no
// loading state. Matching is deliberately simple -- every term must appear
// somewhere in the title, description, module, tags or slug -- because a
// learner typing "confidence interval" wants the lesson that says it, not a
// ranked retrieval model. Terms are ANDed so more typing narrows the result,
// which is what a search box is for.
import type {LessonIndexEntry} from './lessonIndexTypes';

/** Strip diacritics and case so "Variance" and "variance" match. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Build the lowercase haystack for one entry, once. */
function haystack(e: LessonIndexEntry): string {
  return normalize([e.title, e.description, e.module, e.slug, ...e.tags].join(' '));
}

export interface SearchHit {
  entry: LessonIndexEntry;
  score: number;
}

/**
 * Rank entries against a query.
 *
 * Scores by where the match lands: a title hit beats a tag hit, which beats a
 * description hit. Ties break on title length so a short, specific title
 * ("Correlation") outranks a long one that happens to contain the word.
 */
export function searchLessons(
  index: LessonIndexEntry[],
  query: string,
  limit = 8,
): SearchHit[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const entry of index) {
    const title = normalize(entry.title);
    const desc = normalize(entry.description);
    const tags = normalize(entry.tags.join(' '));
    const rest = haystack(entry);

    let score = 0;
    let all = true;
    for (const term of terms) {
      if (title.includes(term)) score += 10;
      else if (tags.includes(term)) score += 4;
      else if (desc.includes(term)) score += 2;
      else if (rest.includes(term)) score += 1;
      else { all = false; break; }
    }
    if (!all) continue;
    // Prefer a title that starts with the query, and shorter titles overall.
    if (title.startsWith(terms[0])) score += 5;
    score += Math.max(0, 3 - Math.floor(entry.title.length / 20));
    hits.push({entry, score});
  }

  hits.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
  return hits.slice(0, limit);
}

/** The href for an entry in its own locale, using that locale's route words. */
export function lessonHrefFor(entry: LessonIndexEntry, routeWords: {
  learn: string; lessons: string; tracks: Record<string, string>;
}): string {
  const prefix = entry.locale === 'en' ? '' : `${entry.locale}/`;
  const lessonsWord = routeWords.lessons;
  const track = routeWords.tracks[entry.track] ?? entry.track;
  return `/${prefix}${routeWords.learn}/${entry.section}/${track}/${lessonsWord}/${entry.slug}`;
}
