import React, {createContext, useContext, useMemo, type ReactNode} from 'react';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import type {UiMode} from '@site/src/types/progress';

interface UiModeContextValue {
  mode: UiMode;
  setMode: (mode: UiMode) => void;
  isGamified: boolean;
}

const UiModeContext = createContext<UiModeContextValue | undefined>(undefined);

export function UiModeProvider({children}: {children: ReactNode}): React.JSX.Element {
  const [mode, setMode] = useLocalStorage<UiMode>(STORAGE_KEYS.uiMode, 'gamified');

  const value = useMemo<UiModeContextValue>(
    () => ({mode, setMode, isGamified: mode === 'gamified'}),
    [mode, setMode],
  );

  return <UiModeContext.Provider value={value}>{children}</UiModeContext.Provider>;
}

export function useUiMode(): UiModeContextValue {
  const ctx = useContext(UiModeContext);
  if (!ctx) {
    throw new Error('useUiMode must be used within a UiModeProvider');
  }
  return ctx;
}
