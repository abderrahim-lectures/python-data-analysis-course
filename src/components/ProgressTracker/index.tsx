import React, {useMemo} from 'react';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import type {ProgressMap, PerSectionTrack, WeekId} from '@site/src/types/progress';
import {getChosenWeeks} from '@site/src/utils/weeks';
import styles from './styles.module.css';

interface XpData {
  total: number;
  weekly: number;
  lastUpdated: string;
}

interface Props {
  showDetails?: boolean;
  /** Removes the outer card chrome so a wrapping panel can supply it. */
  flat?: boolean;
}

/**
 * Displays the student's learning progress with XP, progress bar, and level.
 * Gamification element: Progress visualization (highest ROI per research).
 */
export default function ProgressTracker({showDetails = true, flat = false}: Props): React.JSX.Element {
  const rootClass = flat ? styles.flat : styles.progressTracker;
  const [progress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  const [tracks] = useLocalStorage<PerSectionTrack>(STORAGE_KEYS.track, {});
  const [xp] = useLocalStorage<XpData>(STORAGE_KEYS.xp, {total: 0, weekly: 0, lastUpdated: ''});

  const stats = useMemo(() => {
    const chosenWeeks = getChosenWeeks(tracks);
    const totalWeeks = chosenWeeks ? chosenWeeks.length : 10;
    const completedWeeks = chosenWeeks
      ? chosenWeeks.filter((w) => progress[w.weekId]).length
      : 0;
    const percent = Math.round((completedWeeks / totalWeeks) * 100);
    
    // Calculate level from XP (every 100 XP = 1 level)
    const level = Math.floor(xp.total / 100) + 1;
    const xpInLevel = xp.total % 100;
    const xpToNext = 100 - xpInLevel;

    return {totalWeeks, completedWeeks, percent, level, xpInLevel, xpToNext};
  }, [progress, tracks, xp]);

  return (
    <div className={rootClass}>
      <div className={styles.progressHeader}>
        <div className={styles.levelBadge}>
          <span className={styles.levelNumber}>{stats.level}</span>
          <span className={styles.levelLabel}>
            <Translate id="progress.level">Level</Translate>
          </span>
        </div>
        <div className={styles.xpInfo}>
          <span className={styles.xpTotal}>{xp.total} XP</span>
          <span className={styles.xpWeekly}>
            <Translate id="progress.weeklyXp" values={{xp: xp.weekly}}>
              {'+{xp} this week'}
            </Translate>
          </span>
        </div>
      </div>

      <div className={styles.progressBarContainer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{width: `${stats.percent}%`}}
          />
        </div>
        <span className={styles.progressText}>
          <Translate
            id="progress.weeksCompleted"
            values={{completed: stats.completedWeeks, total: stats.totalWeeks}}>
            {'{completed}/{total} weeks'}
          </Translate>
        </span>
      </div>

      {showDetails && (
        <div className={styles.levelProgress}>
          <div className={styles.levelProgressBar}>
            <div
              className={styles.levelProgressFill}
              style={{width: `${stats.xpInLevel}%`}}
            />
          </div>
          <span className={styles.levelProgressText}>
            <Translate
              id="progress.xpToNext"
              values={{xp: stats.xpToNext}}>
              {'{xp} XP to next level'}
            </Translate>
          </span>
        </div>
      )}
    </div>
  );
}
