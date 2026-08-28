import {useEffect} from 'react';

/**
 * Stamps `data-ui-mode="gamified"` on <body> for CSS styling.
 */
export default function UiModeBodyAttribute(): null {
  useEffect(() => {
    document.body.setAttribute('data-ui-mode', 'gamified');
  }, []);

  return null;
}
