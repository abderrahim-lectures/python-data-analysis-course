import React, {type ReactNode} from 'react';
import Translate from '@docusaurus/Translate';
import {useWeeklyBonusUnlocked} from '@site/src/hooks/useUnlockCondition';
import type {WeekId} from '@site/src/types/progress';
import styles from './styles.module.css';

interface Props {
  weekId: WeekId;
  children: ReactNode;
}

/**
 * Optional/advanced content outside the core curriculum, unlocked once this
 * week's WeeklyQuiz is passed. The "lock" is motivational framing, not real
 * access control — there's no backend to enforce it either way.
 */
export default function BonusContent({weekId, children}: Props): React.JSX.Element {
  const unlocked = useWeeklyBonusUnlocked(weekId);

  if (unlocked) {
    return (
      <div className={styles.unlocked}>
        <p className={styles.badge}>
          <span className="gamified-flourish" aria-hidden="true">
            🔓{' '}
          </span>
          <Translate id="bonusContent.unlockedLabel">Bonus (unlocked)</Translate>
        </p>
        {children}
      </div>
    );
  }

  return (
    <div className={styles.locked}>
      <p>
        <span className="gamified-flourish" aria-hidden="true">
          🔒{' '}
        </span>
        <Translate id="bonusContent.lockedLabel">
          Available once you pass this week's quiz.
        </Translate>
      </p>
    </div>
  );
}
