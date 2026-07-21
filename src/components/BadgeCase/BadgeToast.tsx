import React, {useEffect, useRef, useState} from 'react';
import {useUiMode} from '@site/src/context/UiModeContext';
import {useBadges} from '@site/src/hooks/useBadges';
import {describeBadge} from '@site/src/utils/describeBadge';
import type {BadgeId} from '@site/src/types/progress';
import styles from './BadgeToast.module.css';

const TOAST_DURATION_MS = 4000;

/** Gamified-only: a brief toast whenever a new badge is earned, anywhere on the site. */
export default function BadgeToast(): React.JSX.Element | null {
  const {isGamified} = useUiMode();
  const {badges} = useBadges();
  const previousCount = useRef<number | null>(null);
  const [toastBadge, setToastBadge] = useState<BadgeId | null>(null);

  useEffect(() => {
    if (previousCount.current !== null && badges.length > previousCount.current) {
      setToastBadge(badges[badges.length - 1]);
      const timer = setTimeout(() => setToastBadge(null), TOAST_DURATION_MS);
      previousCount.current = badges.length;
      return () => clearTimeout(timer);
    }
    previousCount.current = badges.length;
  }, [badges]);

  if (!isGamified || !toastBadge) {
    return null;
  }

  const {emoji, label} = describeBadge(toastBadge);
  return (
    <div className={styles.toast} role="status">
      <span className={styles.emoji}>{emoji}</span>
      <span>Badge earned: {label}</span>
    </div>
  );
}
