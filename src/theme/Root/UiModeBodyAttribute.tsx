import {useEffect} from 'react';
import {useUiMode} from '@site/src/context/UiModeContext';

/**
 * Stamps `data-ui-mode` on <body> so plain CSS can hide gamified-only
 * flourishes in Classical mode, e.g.:
 *   body[data-ui-mode="classical"] .gamified-flourish { display: none; }
 */
export default function UiModeBodyAttribute(): null {
  const {mode} = useUiMode();

  useEffect(() => {
    document.body.setAttribute('data-ui-mode', mode);
  }, [mode]);

  return null;
}
