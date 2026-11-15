# Progressive Web App (PWA)

> **Status: not implemented.** This file describes a design that was written
> during the Docusaurus-era plan and never carried into the Astro build. There
> is no `public/manifest.json`, no `public/sw.js`, and no service-worker
> registration in `src/`. The paragraphs below are kept as the design to build
> against, not as a description of the current site — verified 2026-11-15
> against the tree (`ls public/` shows no manifest, the service worker, or a
> registration call in `Base.astro`).

The design, if it is picked up: fits the course's "no installs, on your phone"
framing — the site is installable and the key pages work offline after a first
visit, without any external service:

- `public/manifest.json`: name/short_name, display `standalone`, theme/background colors, and 192/512 icons (rendered from the logo). Wired from `src/layouts/Base.astro` `<link rel="manifest">`.
- `public/sw.js`: a hand-written service worker (no plugin — the Astro build has no PWA dependency). It precaches the core routes (`/`, `/learn`, `/playground`, `/progress`, `/projects`) on install, then on `fetch`: **network-first for navigations** (fresh course content always wins over the cache; the cached page is only an offline fallback), and stale-while-revalidate for same-origin assets. Skips waiting, claims clients, and deletes any cache other than the current versioned one on activation — bump `CACHE_NAME` to force a clean re-precache. Registered from `Base.astro`'s head script.
- There is no `beforeinstallprompt` install button in the current build (the old Docusaurus `InstallPwaButton` was not carried over) — browsers' native install affordances apply once a manifest exists.
- **Offline caveat.** Pyodide is *not* CDN-loaded any more: `scripts/vendor-pyodide.mjs` copies the runtime and its wheel closure into `public/pyodide/` at build time, so the browser fetches it from the site's own origin and the CSP's `connect-src 'self'` covers it. That makes offline execution closer than this design assumed — the bytes are same-origin and `pythonRunnerCore.ts` already funnels them through the Cache Storage API (`pyodide-<version>`), which is what lets a returning learner re-run a cell. A service worker prefetching `/pyodide/` would finish the job; a cold offline visit still cannot execute a cell.
