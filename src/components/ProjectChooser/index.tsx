import React, {useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import clsx from 'clsx';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {formatProjectDate} from '@site/src/data/projects';
import type {ProjectId, ProjectProgressMap} from '@site/src/types/progress';
import styles from './styles.module.css';

export interface ProjectInfo {
  id: ProjectId;
  /** ISO "YYYY-MM" date — drives newest-first sort and is shown, formatted, on the card. */
  date: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
}

interface Props {
  projects: ProjectInfo[];
}

/**
 * Lists every real-world project, newest first. Freely browsable any time —
 * no completion gate. Each project's own completion is still tracked
 * separately (optional, student-driven) so a project already built shows a
 * checkmark on return visits.
 */
export default function ProjectChooser({projects}: Props): React.JSX.Element {
  const [progress] = useLocalStorage<ProjectProgressMap>(STORAGE_KEYS.projectProgress, {});
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();

  // Newest date first; same-day ties break alphabetically by id, so the
  // order is identical everywhere this list is rendered (docs page,
  // homepage) regardless of the order projects happen to be passed in.
  const sorted = [...projects].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return a.id < b.id ? -1 : 1;
  });

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
  const filtered = activeTag === null ? sorted : sorted.filter((p) => p.tags.includes(activeTag));

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filter projects by topic">
        <button
          type="button"
          className={clsx(styles.filterChip, activeTag === null && styles.filterChipActive)}
          onClick={() => setActiveTag(null)}>
          <Translate id="capstoneChooser.filterAll">All</Translate>
        </button>
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
      <div className={styles.grid}>
        {filtered.map((project) => {
          const completed = progress[project.id] ?? false;
          return (
            <Link key={project.id} to={project.url} className={styles.card}>
              <h3>
                {completed && (
                  <span aria-hidden="true" className={styles.checkmark}>
                    ✅{' '}
                  </span>
                )}
                {project.title}
              </h3>
              <p className={styles.date}>{formatProjectDate(project.date, currentLocale)}</p>
              <p>{project.summary}</p>
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
                  <Translate id="capstoneChooser.completedLabel">Completed</Translate>
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
