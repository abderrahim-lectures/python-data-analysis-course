import React from 'react';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

interface StickyRunButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

/**
 * Sticky run button that appears at the bottom of the screen on mobile
 * when the editor is not open. Provides quick access to run code.
 */
export default function StickyRunButton({onClick, isVisible}: StickyRunButtonProps): React.JSX.Element | null {
  if (!isVisible) return null;

  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      aria-label="Run code">
      <span className={styles.icon}>▶</span>
      <span className={styles.label}>
        <Translate id="stickyRun.run">Run</Translate>
      </span>
    </button>
  );
}
