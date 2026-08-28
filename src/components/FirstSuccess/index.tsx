import React from 'react';
import Translate from '@docusaurus/Translate';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import styles from './styles.module.css';

interface FirstSuccessProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function FirstSuccess({isVisible, onDismiss}: FirstSuccessProps): React.JSX.Element | null {
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.firstSuccess, 'true');
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Confetti animation */}
      <div className={styles.confettiContainer} aria-hidden="true">
        {Array.from({length: 10}).map((_, i) => (
          <div key={i} className={styles.confettiPiece} />
        ))}
      </div>

      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.celebration}>
            <span className={styles.confetti} aria-hidden="true">🎉</span>
          </div>
          
          <h3 className={styles.title}>
            <Translate id="firstSuccess.title">
              You just ran Python!
            </Translate>
          </h3>
          
          <p className={styles.message}>
            <Translate id="firstSuccess.message">
              No install. No setup. Just you and code.
            </Translate>
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.continueButton}
              onClick={handleDismiss}>
              <Translate id="firstSuccess.continue">
                Continue to the lesson →
              </Translate>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
