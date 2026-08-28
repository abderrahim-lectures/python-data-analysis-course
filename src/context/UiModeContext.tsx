import React, {createContext, useContext, useMemo, type ReactNode} from 'react';

interface UiModeContextValue {
  mode: 'gamified';
  setMode: (mode: 'gamified') => void;
  isGamified: true;
}

const UiModeContext = createContext<UiModeContextValue | undefined>(undefined);

export function UiModeProvider({children}: {children: ReactNode}): React.JSX.Element {
  const value = useMemo<UiModeContextValue>(
    () => ({
      mode: 'gamified',
      setMode: () => {}, // No-op - gamified is always on
      isGamified: true,
    }),
    [],
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
