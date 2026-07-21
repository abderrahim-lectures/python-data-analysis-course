import React from 'react';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useBadges} from '@site/src/hooks/useBadges';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {weekCompleteBadge} from '@site/src/utils/badges';
import type {ProgressMap, WeekId} from '@site/src/types/progress';
import styles from './styles.module.css';

interface Props {
  weekId: WeekId;
}

/** "Mark this week complete" checkbox — feeds progress tracking and awards a badge. */
export default function ProgressCheckbox({weekId}: Props): React.JSX.Element {
  const [progress, setProgress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  const {awardBadge} = useBadges();
  const isComplete = progress[weekId] ?? false;

  const toggle = () => {
    const next = !isComplete;
    setProgress((prev) => ({...prev, [weekId]: next}));
    if (next) {
      awardBadge(weekCompleteBadge(weekId));
    }
  };

  return (
    <label className={styles.wrapper}>
      <input type="checkbox" checked={isComplete} onChange={toggle} />
      <span>
        <Translate id="progressCheckbox.label">Mark this week complete</Translate>
      </span>
    </label>
  );
}
