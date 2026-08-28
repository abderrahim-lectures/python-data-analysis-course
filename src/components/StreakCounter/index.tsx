import React, {useMemo} from 'react';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import styles from './styles.module.css';

interface StreakData {
  current: number;
  longest: number;
  lastActivityDate: string;
  freezes: number;
}

interface Props {
  compact?: boolean;
}

/**
 * Displays the student's daily practice streak.
 * Gamification element: Streaks drive daily habits (3.6x more likely to stay engaged).
 */
export default function StreakCounter({compact = false}: Props): React.JSX.Element {
  const [streak] = useLocalStorage<StreakData>(STORAGE_KEYS.streak, {
    current: 0,
    longest: 0,
    lastActivityDate: '',
    freezes: 3,
  });

  const streakStatus = useMemo(() => {
    const today = new Date().toDateString();
    const lastActivity = streak.lastActivityDate;
    
    if (lastActivity === today) {
      return 'active';
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActivity === yesterday.toDateString()) {
      return 'at-risk';
    }
    
    return 'broken';
  }, [streak.lastActivityDate]);

  if (compact) {
    return (
      <div className={styles.streakCompact}>
        <span className={styles.streakIcon}>🔥</span>
        <span className={styles.streakCount}>{streak.current}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.streakContainer} ${styles[`streak-${streakStatus}`]}`}>
      <div className={styles.streakHeader}>
        <span className={styles.streakFireIcon}>🔥</span>
        <div className={styles.streakInfo}>
          <span className={styles.streakNumber}>{streak.current}</span>
          <span className={styles.streakLabel}>
            <Translate id="streak.dayStreak">Day Streak</Translate>
          </span>
        </div>
      </div>

      <div className={styles.streakDetails}>
        <div className={styles.streakStat}>
          <span className={styles.streakStatValue}>{streak.longest}</span>
          <span className={styles.streakStatLabel}>
            <Translate id="streak.longest">Best</Translate>
          </span>
        </div>
        <div className={styles.streakStat}>
          <span className={styles.streakStatValue}>{streak.freezes}</span>
          <span className={styles.streakStatLabel}>
            <Translate id="streak.freezes">Freezes</Translate>
          </span>
        </div>
      </div>

      {streakStatus === 'at-risk' && (
        <div className={styles.streakWarning}>
          <Translate id="streak.atRisk">
            Practice today to keep your streak! ⏰
          </Translate>
        </div>
      )}

      {streakStatus === 'broken' && streak.current > 0 && (
        <div className={styles.streakBroken}>
          <Translate id="streak.broken">
            Streak broken! Start a new one today 💪
          </Translate>
        </div>
      )}

      {streak.current === 0 && (
        <div className={styles.streakStart}>
          <Translate id="streak.start">
            Start your streak! Practice daily to build habits 🌱
          </Translate>
        </div>
      )}
    </div>
  );
}
