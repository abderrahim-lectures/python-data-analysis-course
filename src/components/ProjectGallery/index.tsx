import React, {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import clsx from 'clsx';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useFavorites} from '@site/src/hooks/useFavorites';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {formatProjectDate, PROJECT_LEVELS, type ProjectLevel} from '@site/src/data/projects';
import ProjectArt from '@site/src/data/projectArt';
import type {ProjectId, ProjectProgressMap} from '@site/src/types/progress';
import styles from './styles.module.css';

export interface GalleryProject {
  id: ProjectId;
  /** ISO "YYYY-MM" date — drives newest-first sort and the card's date eyebrow. */
  date: string;
  url: string;
  tags: string[];
  /** Difficulty bucket — shown as a badge and filterable. */
  level: ProjectLevel;
  /** Compact tool names rendered as pills under the summary. */
  tools: string[];
  /** Already-translated title/summary (a <Translate> element on the homepage,
   *  a plain string on the docs projects page). */
  title: ReactNode;
  summary: ReactNode;
}

/** English defaults for the level badges; real strings come from code.json per locale. */
const LEVEL_LABELS: Record<ProjectLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

interface Props {
  projects: GalleryProject[];
  /** How many cards render on first paint (server + first client render). */
  initialCount?: number;
  /** How many more load each time the sentinel scrolls into view. */
  pageSize?: number;
}

/**
 * Shared "real-world projects" browser used by both the docs projects page and
 * the homepage. Stays fast with 200+ projects because:
 *  - cards render in batches via an IntersectionObserver sentinel (infinite scroll),
 *    never all at once;
 *  - offscreen cards get `content-visibility: auto` so the browser skips their layout;
 *  - progress and favorites are read ONCE here, not once per card;
 *  - tag metadata comes from a Map lookup, not a per-card find.
 * Favorites are shared across both surfaces through the same localStorage key.
 */
export default function ProjectGallery({projects, initialCount = 12, pageSize = 12}: Props): React.JSX.Element {
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();
  const [progress] = useLocalStorage<ProjectProgressMap>(STORAGE_KEYS.projectProgress, {});
  const {has: isFavorite, toggle: toggleFavorite, count: favoriteCount} = useFavorites();

  // Newest date first; same-day ties break alphabetically by id, so the order
  // is identical everywhere (docs page, homepage) regardless of input order.
  const sorted = useMemo(
    () =>
      [...projects].sort((a, b) => {
        if (a.date !== b.date) {
          return a.date < b.date ? 1 : -1;
        }
        return a.id < b.id ? -1 : 1;
      }),
    [projects],
  );

  const tags = useMemo(() => {
    const seen = new Set<string>();
    for (const p of projects) {
      for (const tag of p.tags) {
        seen.add(tag);
      }
    }
    return [...seen];
  }, [projects]);

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<ProjectLevel | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const filtered = useMemo(() => {
    let list = sorted;
    if (activeTag !== null) {
      list = list.filter((p) => p.tags.includes(activeTag));
    }
    if (activeLevel !== null) {
      list = list.filter((p) => p.level === activeLevel);
    }
    if (favoritesOnly) {
      list = list.filter((p) => isFavorite(p.id));
    }
    return list;
  }, [sorted, activeTag, activeLevel, favoritesOnly, isFavorite]);

  // A filter change starts a fresh scroll batch.
  useEffect(() => {
    setVisibleCount(initialCount);
  }, [activeTag, activeLevel, favoritesOnly, initialCount]);

  const shown = Math.min(visibleCount, filtered.length);
  const hasMore = shown < filtered.length;
  const visible = filtered.slice(0, shown);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined' || !hasMore) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisibleCount((c) => Math.min(c + pageSize, filtered.length));
          }
        }
      },
      // Preload a screen-and-a-bit ahead so scrolling feels continuous.
      {rootMargin: '800px 0px'},
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, pageSize, filtered.length]);

  return (
    <>
      <div className={styles.filters} role="group" aria-label={translate({id: 'projectGallery.filtersLabel', message: 'Filter projects'})}>
        <button
          type="button"
          className={clsx(styles.filterChip, activeTag === null && !favoritesOnly && styles.filterChipActive)}
          onClick={() => {
            setActiveTag(null);
            setActiveLevel(null);
            setFavoritesOnly(false);
          }}>
          <Translate id="projectGallery.filterAll" description="Project filter chip: all projects">
            All
          </Translate>
        </button>
        <button
          type="button"
          aria-pressed={favoritesOnly}
          className={clsx(styles.filterChip, favoritesOnly && styles.filterChipActive)}
          onClick={() => setFavoritesOnly((v) => !v)}>
          <span aria-hidden="true" className={styles.favoriteStar}>
            ★
          </span>{' '}
          <Translate id="projectGallery.favoritesFilter" description="Project filter chip: favorites only">
            Favorites
          </Translate>
          <span className={styles.chipCount}>{favoriteCount}</span>
        </button>
        {PROJECT_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            aria-pressed={activeLevel === level}
            data-testid={`level-filter-${level}`}
            className={clsx(styles.filterChip, activeLevel === level && styles.filterChipActive)}
            onClick={() => setActiveLevel((current) => (current === level ? null : level))}>
            <span aria-hidden="true" className={clsx(styles.levelDot, styles[`levelDot-${level}`])} />
            {translate({id: `projectLevel.${level}`, message: LEVEL_LABELS[level]})}
          </button>
        ))}
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={clsx(styles.filterChip, activeTag === tag && styles.filterChipActive)}
            onClick={() => setActiveTag((current) => (current === tag ? null : tag))}>
            {tag}
          </button>
        ))}
      </div>

      <p className={styles.counter} data-testid="gallery-counter" aria-live="polite">
        <Translate
          id="projectGallery.showing"
          description="Result counter: how many of the total are currently rendered"
          values={{shown: shown, total: filtered.length}}>
          {'Showing {shown} of {total}'}
        </Translate>
      </p>

      {filtered.length === 0 ? (
        <p className={styles.empty} data-testid="gallery-empty">
          <Translate id="projectGallery.empty" description="Empty state when no projects match the active filters">
            No projects match your filters.
          </Translate>
        </p>
      ) : (
        <div className={styles.grid}>
          {visible.map((project) => {
            const completed = progress[project.id] ?? false;
            const favorite = isFavorite(project.id);
            return (
              <div
                key={project.id}
                className={clsx(styles.card, completed && styles.cardCompleted, favorite && styles.cardFavorite)}
                data-testid="gallery-card">
                <Link to={project.url} className={styles.cardBody}>
                  <div className={styles.thumb} data-testid="card-thumb">
                    <ProjectArt project={project} className={styles.thumbArt} />
                    <span
                      className={clsx(styles.levelBadge, styles[`levelBadge-${project.level}`])}
                      data-testid="level-badge">
                      {translate({id: `projectLevel.${project.level}`, message: LEVEL_LABELS[project.level]})}
                    </span>
                  </div>
                  <div className={styles.cardContent}>
                    <p className={styles.date}>{formatProjectDate(project.date, currentLocale)}</p>
                    <h3>{project.title}</h3>
                    <p className={styles.summary}>{project.summary}</p>
                    {project.tools.length > 0 && (
                      <div
                        className={styles.tools}
                        data-testid="card-tools"
                        role="list"
                        aria-label={translate({id: 'projectGallery.toolsLabel', message: 'Tools'})}>
                        {project.tools.map((tool) => (
                          <span key={tool} className={styles.tool} role="listitem">
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.tags.length > 0 && (
                      <div className={styles.tags}>
                        {project.tags.map((tag) => (
                          <span key={tag} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {completed && (
                      <p className={styles.completedLabel}>
                        <Translate id="projectGallery.completed" description="Project card completed label">
                          Completed
                        </Translate>
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  type="button"
                  data-testid="favorite-button"
                  aria-pressed={favorite}
                  aria-label={
                    favorite
                      ? translate({
                          id: 'projectGallery.favorite.remove',
                          message: 'Remove from favorites',
                        })
                      : translate({
                          id: 'projectGallery.favorite.add',
                          message: 'Add to favorites',
                        })
                  }
                  className={styles.favoriteButton}
                  onClick={() => toggleFavorite(project.id)}>
                  <span aria-hidden="true">★</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {hasMore ? (
        <div className={styles.sentinel} ref={sentinelRef} data-testid="gallery-sentinel" aria-hidden="true" />
      ) : (
        filtered.length > 0 && (
          <p className={styles.end} data-testid="gallery-end">
            <Translate
              id="projectGallery.end"
              description="End of list message with the total project count"
              values={{total: filtered.length}}>
              {"You've seen all {total} projects."}
            </Translate>
          </p>
        )
      )}
    </>
  );
}
