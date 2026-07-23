import React from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import type {CapstoneId, CapstoneProgressMap} from '@site/src/types/progress';
import styles from './styles.module.css';

export interface CapstoneInfo {
  id: CapstoneId;
  /** ISO date, used only to sort newest-first — never rendered. */
  date: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
}

interface Props {
  capstones: CapstoneInfo[];
}

/**
 * Lists every real-world project, newest first. Freely browsable any time —
 * no completion gate. Each project's own completion is still tracked
 * separately (optional, student-driven) so a project already built shows a
 * checkmark on return visits.
 */
export default function CapstoneChooser({capstones}: Props): React.JSX.Element {
  const [progress] = useLocalStorage<CapstoneProgressMap>(STORAGE_KEYS.capstoneProgress, {});

  const sorted = [...capstones].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className={styles.grid}>
      {sorted.map((capstone) => {
        const completed = progress[capstone.id] ?? false;
        return (
          <Link key={capstone.id} to={capstone.url} className={styles.card}>
            <h3>
              {completed && (
                <span aria-hidden="true" className={styles.checkmark}>
                  ✅{' '}
                </span>
              )}
              {capstone.title}
            </h3>
            <p>{capstone.summary}</p>
            {capstone.tags.length > 0 && (
              <div className={styles.tags}>
                {capstone.tags.map((tag) => (
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
  );
}
