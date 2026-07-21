import type {ReactNode} from 'react';
import {useEffect, useState} from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's own standalone flag, not covered by the media query above.
    (window.navigator as Navigator & {standalone?: boolean}).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPwaButton(): ReactNode {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    if (isIos()) {
      // iOS Safari never fires beforeinstallprompt — "Add to Home Screen"
      // is a manual Share-sheet action there, so point students at it instead.
      setShowIosHint(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (installed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const {outcome} = await installEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallEvent(null);
    }
  };

  if (installEvent) {
    return (
      <button
        type="button"
        className={clsx('button button--outline button--secondary button--lg', styles.installButton)}
        onClick={handleInstallClick}>
        📲 Install the course app — works offline
      </button>
    );
  }

  if (showIosHint) {
    return (
      <p className={styles.iosHint}>
        📲 On iPhone/iPad: tap <strong>Share</strong> →{' '}
        <strong>Add to Home Screen</strong> to install this course and use already-visited
        lessons offline.
      </p>
    );
  }

  return null;
}
