import useBaseUrl from '@docusaurus/useBaseUrl';

/** Generic no-login Python 3 scratch REPL — used for every Python 101 page. */
export const TRINKET_EMBED_URL = 'https://trinket.io/embed/python3?runOption=console';

/**
 * JupyterLite Notebook app URL, optionally deep-linked to a specific week's
 * starter notebook. Falls back to a blank scratch notebook when weekId is null
 * (e.g. opened from the Data Analysis section landing page, not a specific week).
 */
export function useJupyterLiteUrl(weekId: string | null): string {
  const liteBase = useBaseUrl('/lite/notebooks/');
  if (!weekId) {
    return liteBase;
  }
  return `${liteBase}?path=${weekId}.ipynb`;
}
