import React from 'react';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useBadges} from '@site/src/hooks/useBadges';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {projectCompleteBadge} from '@site/src/utils/badges';
import type {ProjectId, ProjectProgressMap} from '@site/src/types/progress';
import styles from './styles.module.css';

interface Props {
  projectId: ProjectId;
}

/** "Mark this project complete" checkbox — same pattern as ProgressCheckbox, one level up. */
export default function ProjectProgressCheckbox({projectId}: Props): React.JSX.Element {
  const [progress, setProgress] = useLocalStorage<ProjectProgressMap>(
    STORAGE_KEYS.projectProgress,
    {},
  );
  const {awardBadge} = useBadges();
  const isComplete = progress[projectId] ?? false;

  const toggle = () => {
    const next = !isComplete;
    setProgress((prev) => ({...prev, [projectId]: next}));
    if (next) {
      awardBadge(projectCompleteBadge(projectId));
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
