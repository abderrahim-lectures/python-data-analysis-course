import {useCallback} from 'react';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';

/**
 * Client-side "starred" set of real-world project ids, persisted under a single
 * localStorage key (an array of ids, not an object, so it stays appendable).
 * Shared by every surface that renders project cards — the docs projects page
 * and the homepage gallery — so a favorite set on one shows up on the other.
 */
export function useFavorites() {
  const [ids, setIds] = useLocalStorage<string[]>(STORAGE_KEYS.projectFavorites, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    [setIds],
  );

  return {ids, has, toggle, count: ids.length};
}
