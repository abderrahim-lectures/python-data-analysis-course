import {useState, useCallback} from 'react';

/**
 * Manages user preferences for the playground editor.
 */
export function usePlaygroundPreferences() {
  const [minimapEnabled, setMinimapEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('minimapEnabled') === 'true';
  });

  const toggleMinimap = useCallback(() => {
    setMinimapEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem('minimapEnabled', newValue ? 'true' : 'false');
      return newValue;
    });
  }, []);

  return {minimapEnabled, toggleMinimap};
}
