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
 *
 * Known local-preview-only quirk: `npm run serve` (Vercel's `serve` under the
 * hood) 302-redirects this trailing-slash URL to a no-trailing-slash one
 * because of this site's `trailingSlash: false` config, which then breaks the
 * JupyterLite bundle's own relative asset imports. Real GitHub Pages hosting
 * does not perform that redirect (confirmed against a plain static server that
 * mirrors GH Pages' actual no-rewrite behavior — JupyterLite boots and
 * persists correctly there). So: this embed cannot be manually verified via
 * `npm run serve` locally, only via the actual deployed site or an equivalent
 * static server started with something like `python3 -m http.server`.
 */
export function useJupyterLiteUrl(weekId: string | null): string {
  const liteBase = useBaseUrl('/lite/notebooks/');
  if (!weekId) {
    return liteBase;
  }
  return `${liteBase}?path=${weekId}.ipynb`;
}
