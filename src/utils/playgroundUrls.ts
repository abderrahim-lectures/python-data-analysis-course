import useBaseUrl from '@docusaurus/useBaseUrl';

/**
 * Generic no-login Python 3 scratch playground — used for every Python 101 page.
 * No `runOption` param: this keeps Trinket's default split editor+console view
 * (with its own visible "Run" button) instead of the console-only REPL, so
 * students see and edit code rather than just an output console.
 */
export const TRINKET_EMBED_URL = 'https://trinket.io/embed/python3';

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
