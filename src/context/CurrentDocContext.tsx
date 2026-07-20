import React, {createContext, useContext, useMemo, useState, type ReactNode} from 'react';
import type {SectionId, TrackId} from '@site/src/types/progress';

export interface CurrentDocInfo {
  section: SectionId | null;
  track: TrackId | null;
  week: number | null;
}

const EMPTY_DOC_INFO: CurrentDocInfo = {section: null, track: null, week: null};

interface CurrentDocContextValue {
  doc: CurrentDocInfo;
  setDoc: (doc: CurrentDocInfo) => void;
}

const CurrentDocContext = createContext<CurrentDocContextValue | undefined>(undefined);

/**
 * Tracks which section/track/week the student is currently reading, sourced from doc
 * frontmatter (see src/theme/DocItem/Content) rather than guessed from the URL — this is
 * what lets PlaygroundFab decide Trinket vs. JupyterLite and which notebook to deep-link to.
 */
export function CurrentDocProvider({children}: {children: ReactNode}): React.JSX.Element {
  const [doc, setDoc] = useState<CurrentDocInfo>(EMPTY_DOC_INFO);
  const value = useMemo(() => ({doc, setDoc}), [doc]);
  return <CurrentDocContext.Provider value={value}>{children}</CurrentDocContext.Provider>;
}

export function useCurrentDoc(): CurrentDocContextValue {
  const ctx = useContext(CurrentDocContext);
  if (!ctx) {
    throw new Error('useCurrentDoc must be used within a CurrentDocProvider');
  }
  return ctx;
}
