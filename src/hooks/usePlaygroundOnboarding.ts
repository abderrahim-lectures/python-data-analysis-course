import {useState, useCallback} from 'react';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';

/**
 * Manages onboarding state for first-time users: tutorial, first success celebration,
 * and tips of the day.
 */
export function usePlaygroundOnboarding() {
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(STORAGE_KEYS.editorTutorialSeen);
  });

  const [showFirstSuccess, setShowFirstSuccess] = useState(false);

  const [showTips, setShowTips] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem(STORAGE_KEYS.editorTutorialSeen) === 'true' &&
      !localStorage.getItem('tipsSeen')
    );
  });

  const handleTutorialComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.editorTutorialSeen, 'true');
    setShowTutorial(false);
  }, []);

  const handleTutorialSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.editorTutorialSeen, 'true');
    setShowTutorial(false);
  }, []);

  const handleFirstSuccessDismiss = useCallback(() => {
    setShowFirstSuccess(false);
  }, []);

  const handleTipsDismiss = useCallback(() => {
    localStorage.setItem('tipsSeen', 'true');
    setShowTips(false);
  }, []);

  const triggerFirstSuccess = useCallback(() => {
    if (!localStorage.getItem(STORAGE_KEYS.firstSuccess)) {
      setTimeout(() => {
        setShowFirstSuccess(true);
      }, 1000);
    }
  }, []);

  return {
    showTutorial,
    showFirstSuccess,
    showTips,
    handleTutorialComplete,
    handleTutorialSkip,
    handleFirstSuccessDismiss,
    handleTipsDismiss,
    triggerFirstSuccess,
  };
}
