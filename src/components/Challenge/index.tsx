import React, {type ReactNode} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import type {RevealedMap} from '@site/src/types/progress';
import styles from './styles.module.css';

interface Props {
  id: string;
  children: ReactNode;
  answer: ReactNode;
}

/** A challenge with a collapsible, remembered answer reveal. */
export default function Challenge({id, children, answer}: Props): React.JSX.Element {
  const [revealed, setRevealed] = useLocalStorage<RevealedMap>(STORAGE_KEYS.revealed, {});
  const isRevealed = revealed[id] ?? false;

  const toggle = () => {
    setRevealed((prev) => ({...prev, [id]: !prev[id]}));
  };

  return (
    <div className={styles.card}>
      <div className={styles.prompt}>
        <span className="gamified-flourish" aria-hidden="true">
          🧩{' '}
        </span>
        {children}
      </div>
      <button type="button" className="button button--secondary button--sm" onClick={toggle}>
        {isRevealed
          ? translate({id: 'challenge.hide', message: 'Hide answer'})
          : translate({id: 'challenge.reveal', message: 'Reveal answer'})}
      </button>
      {isRevealed && (
        <div className={styles.answer}>
          <strong>
            <Translate id="challenge.answerLabel">Answer:</Translate>
          </strong>{' '}
          {answer}
        </div>
      )}
    </div>
  );
}
