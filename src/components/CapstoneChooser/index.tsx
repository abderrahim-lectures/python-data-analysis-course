import React from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useCourseComplete} from '@site/src/hooks/useUnlockCondition';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import type {CapstoneId, CapstoneProgressMap} from '@site/src/types/progress';
import styles from './styles.module.css';

export interface CapstoneInfo {
  id: CapstoneId;
  year: number;
  title: string;
  summary: string;
  url: string;
}

interface Props {
  capstones: CapstoneInfo[];
}

/**
 * Lists every year's Capstone project (past and current) once the whole
 * course is complete. Unlock is still course-wide (finish all weeks) — same
 * `useCourseComplete()` gate as before, now guarding a list instead of one
 * fixed page. Completion of each individual capstone is tracked separately
 * so a student who's done a past year's project still sees it checked off.
 */
export default function CapstoneChooser({capstones}: Props): React.JSX.Element {
  const unlocked = useCourseComplete();
  const [progress] = useLocalStorage<CapstoneProgressMap>(STORAGE_KEYS.capstoneProgress, {});

  if (!unlocked) {
    return (
      <div className={styles.locked}>
        <p>
          <span className="gamified-flourish" aria-hidden="true">
            🔒{' '}
          </span>
          <Translate id="capstoneChooser.lockedLabel">
            Finish every week of both sections to unlock the Capstone projects.
          </Translate>
        </p>
      </div>
    );
  }

  const sorted = [...capstones].sort((a, b) => b.year - a.year);

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
              {capstone.year} — {capstone.title}
            </h3>
            <p>{capstone.summary}</p>
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
