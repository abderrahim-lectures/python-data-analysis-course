import React, {useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useStudentIdentity} from '@site/src/hooks/useStudentIdentity';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {getChosenWeeks} from '@site/src/utils/weeks';
import type {PerSectionTrack, ProgressMap} from '@site/src/types/progress';
import styles from './styles.module.css';

const GAP_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** On-visit "welcome back" nudge after a multi-day gap — the no-backend alternative to push notifications. */
export default function WelcomeBackBanner(): React.JSX.Element | null {
  const {name} = useStudentIdentity();
  const [lastVisit, setLastVisit] = useLocalStorage<number | null>(STORAGE_KEYS.lastVisit, null);
  const [dismissedDate, setDismissedDate] = useLocalStorage<string | null>(
    STORAGE_KEYS.welcomeBackDismissedDate,
    null,
  );
  const [progress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  const [tracks] = useLocalStorage<PerSectionTrack>(STORAGE_KEYS.track, {});

  const [showBanner, setShowBanner] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const now = Date.now();
    const previousVisit = lastVisit;
    setLastVisit(now);

    if (
      previousVisit !== null &&
      now - previousVisit >= GAP_THRESHOLD_MS &&
      dismissedDate !== todayString()
    ) {
      setShowBanner(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!showBanner) {
    return null;
  }

  const chosenWeeks = getChosenWeeks(tracks);
  const nextWeek = chosenWeeks?.find((w) => !progress[w.weekId]);
  const greeting = name ? `Welcome back, ${name}!` : 'Welcome back!';

  return (
    <div className={styles.banner}>
      <p>
        {greeting}{' '}
        {nextWeek ? (
          <Translate id="welcomeBack.pickUp">You left off at</Translate>
        ) : (
          <Translate id="welcomeBack.noTrack">Pick a track to get started.</Translate>
        )}{' '}
        {nextWeek && (
          <Link to={nextWeek.path}>
            Week {nextWeek.week} →
          </Link>
        )}
      </p>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => {
          setDismissedDate(todayString());
          setShowBanner(false);
        }}
        aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
