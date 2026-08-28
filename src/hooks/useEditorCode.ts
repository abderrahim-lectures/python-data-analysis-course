import {useState, useEffect, useCallback, useRef} from 'react';
import type {SectionId} from '@site/src/types/progress';
import {starterCodeForSection} from '@site/src/components/VsCodePlayground/starterCode';

interface Props {
  section: SectionId | null;
  embedKey: string;
}

/**
 * Manages the editor code state and resets it when navigating to a different week.
 */
export function useEditorCode({section, embedKey}: Props) {
  const [code, setCode] = useState(() => starterCodeForSection(section));
  const [resetKey, setResetKey] = useState(embedKey);
  const lastEmbedKey = useRef(embedKey);

  // Reset code when navigating to a different week
  useEffect(() => {
    if (embedKey !== lastEmbedKey.current) {
      lastEmbedKey.current = embedKey;
      setResetKey(embedKey);
      setCode(starterCodeForSection(section));
    }
  }, [embedKey, section]);

  const resetCode = useCallback(() => {
    setCode(starterCodeForSection(section));
  }, [section]);

  const getCode = useCallback(() => code, [code]);

  return {code, setCode, resetKey, resetCode, getCode};
}
