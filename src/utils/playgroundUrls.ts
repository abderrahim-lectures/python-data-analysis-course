/**
 * The `/lite/` JupyterLite build is a single shared static directory, not
 * part of Docusaurus's per-locale content — it only ever exists unprefixed
 * (e.g. `/lite/repl/index.html`), never under `/fr/lite/...` etc. It's
 * deliberately hardcoded as an absolute path here rather than resolved
 * through `useBaseUrl`/`siteConfig.baseUrl`: Docusaurus locale-prefixes
 * *both* of those per locale build (confirmed empirically — `siteConfig`
 * itself reports `baseUrl: '/fr/'` when running inside the French build,
 * not just the URLs `useBaseUrl` produces), so either one 404s on every
 * non-default locale. Confirmed live: the iframe then rendered this site's
 * own React 404 page ("Page Not Found") inside the panel — which at a
 * glance looks exactly like a copy of the website, not a broken embed, and
 * is what prompted this fix. This hardcoded path is only correct because
 * the site's actual `baseUrl` is `/` (root, via the custom domain) and
 * JupyterLite's own `base_url` in jupyter_lite_config.json is independently
 * hardcoded to `/lite/` too — if the site ever moves off a custom domain
 * back onto a GH Pages project-page subpath, both of those need updating
 * together.
 */
const LITE_BASE = '/lite';

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
export function useJupyterLiteNotebookUrl(weekId: string | null): string {
  const liteBase = `${LITE_BASE}/notebooks/`;
  if (!weekId) {
    return liteBase;
  }
  return `${liteBase}?path=${weekId}.ipynb`;
}

/**
 * JupyterLite's REPL app: a plain Python console (no notebook cells, no file
 * browser chrome) — the same self-hosted Pyodide runtime as the Notebook app,
 * just a lighter-weight interface, used for Python 101 in place of Trinket
 * (a third-party embed that could never work offline). Every dataset bundled
 * into `jupyterlite-config/files/` is mounted into the REPL's virtual
 * filesystem too, so `open("students-normal.csv")` etc. just works — no
 * manual copy/paste step required, unlike Trinket's sandboxed filesystem.
 */
export function useJupyterLiteReplUrl(): string {
  return `${LITE_BASE}/repl/index.html?kernel=python&toolbar=1`;
}
