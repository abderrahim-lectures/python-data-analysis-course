import React, {useState} from 'react';
import styles from './styles.module.css';

/**
 * A real, clickable checklist for verifying a lesson step went correctly —
 * plain GFM `- [ ]` markdown renders as a *disabled* checkbox (matches
 * GitHub's own read-only rendering outside an issue/PR body), which reads as
 * broken to a student trying to actually check items off. State is
 * intentionally not persisted: this is a "did I do this right, right now"
 * scratch check, not tracked progress like ProjectProgressCheckbox — it's
 * fine for it to reset on reload.
 */
export function StepChecklist({children}: {children: React.ReactNode}): React.JSX.Element {
  return <ul className={styles.checklist}>{children}</ul>;
}

export function StepChecklistItem({children}: {children: React.ReactNode}): React.JSX.Element {
  const [checked, setChecked] = useState(false);

  return (
    <li className={styles.item}>
      <label>
        <input type="checkbox" checked={checked} onChange={() => setChecked((c) => !c)} />
        <span>{children}</span>
      </label>
    </li>
  );
}
