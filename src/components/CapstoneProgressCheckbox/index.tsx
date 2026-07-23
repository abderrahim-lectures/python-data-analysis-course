import React from 'react';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useBadges} from '@site/src/hooks/useBadges';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {capstoneCompleteBadge} from '@site/src/utils/badges';
import type {CapstoneId, CapstoneProgressMap} from '@site/src/types/progress';
import styles from './styles.module.css';

interface Props {
  capstoneId: CapstoneId;
}

/** "Mark this project complete" checkbox — same pattern as ProgressCheckbox, one level up. */
export default function CapstoneProgressCheckbox({capstoneId}: Props): React.JSX.Element {
  const [progress, setProgress] = useLocalStorage<CapstoneProgressMap>(
    STORAGE_KEYS.capstoneProgress,
    {},
  );
  const {awardBadge} = useBadges();
  const isComplete = progress[capstoneId] ?? false;

  const toggle = () => {
    const next = !isComplete;
    setProgress((prev) => ({...prev, [capstoneId]: next}));
    if (next) {
      awardBadge(capstoneCompleteBadge(capstoneId));
    }
  };

  return (
    <label className={styles.wrapper}>
      <input type="checkbox" checked={isComplete} onChange={toggle} />
      <span>
        <Translate id="capstoneProgressCheckbox.label">Mark this project complete</Translate>
      </span>
    </label>
  );
}
