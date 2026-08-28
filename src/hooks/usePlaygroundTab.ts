import {useState, useEffect, useMemo} from 'react';
import type {SectionId} from '@site/src/types/progress';

export type PlaygroundTab = 'editor' | 'notebook';
export type PlaygroundMode = 'notebook' | 'repl';

interface Props {
  section: SectionId | null;
  track: string | null;
  week: number | null;
}

/**
 * Manages the active tab state and derives the embed mode from the current section.
 * Resets to editor tab when navigating to a different week.
 */
export function usePlaygroundTab({section, track, week}: Props) {
  const [tab, setTab] = useState<PlaygroundTab>('editor');

  const embedKey = useMemo(() => {
    if (section && track && week != null) {
      return `${section}-${track}-week-${week}`;
    }
    return `${section ?? 'none'}:${track ?? 'none'}:${week ?? 'none'}`;
  }, [section, track, week]);

  const weekId = useMemo(() => {
    if (section && track && week != null) {
      return `${section}-${track}-week-${week}`;
    }
    return null;
  }, [section, track, week]);

  const embedMode: PlaygroundMode = section === 'data-analysis' ? 'notebook' : 'repl';

  // Reset to editor tab when navigating to a different week
  useEffect(() => {
    setTab('editor');
  }, [embedKey]);

  return {tab, setTab, embedKey, weekId, embedMode};
}
