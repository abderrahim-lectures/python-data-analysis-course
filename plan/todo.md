# Active TODO — queued mid-session, 2026-08-30

Tracking list for requests that came in faster than they could be finished.
Check items off as they land; move detail write-ups to `astro-rebuild.md`'s
status log once done, don't duplicate here.

- [x] **i18n URL segment translation** — done. Locale routes restructured
      from `/ar/learn` → `/ar/تعلم`, `/es/learn` → `/es/aprender`,
      `/fr/learn` → `/fr/apprendre`, and `/projects` → `/مشاريع`/
      `/proyectos`/`/projets`. Track words in the URL too (`normal`/`hard`
      → `عادي`/`صعب`, `dificil`, `difficile`). Content slugs (`python-101`,
      `data-analysis`, project slugs) stay untranslated — gameState/XP keys
      shared across locales. Added `src/lib/routeSegments.ts` (word map +
      href builders) and `src/lib/pageStrings.ts` (localized titles/copy
      for the learn hub + projects index, the two pages whose text was
      hardcoded English rather than pulled from content). Added `hreflang`
      alternate `<link>` tags to `Base.astro` via a new `alternates` prop,
      wired through all 5 locale route templates. Verified: Unicode (Arabic)
      directory names build fine on disk, canonical/hreflang URLs
      percent-encode correctly, titles render translated
      (`تعلّم — PyDA`/`Aprender — PyDA`/`Apprendre — PyDA`).
      Old `/ar/learn` etc. URLs are gone with no redirect (site isn't
      indexed yet — same call as the earlier `/stats` removal).
- [x] **Custom domain / base path fix**: discovered mid-session that
      production is `https://pyda-course.online/` (custom domain), not
      `github.io/python-data-analysis-course/`. `astro.config.mjs` was
      still assuming the GH Pages repo-subpath. Added `public/CNAME`,
      fixed `site`/`base` — this was silently breaking every canonical URL,
      OG tag, and the sitemap.
- [x] **Button hover states audit**: `.btn-streak`/`.btn-xp` and
      `.route-pill--normal/--hard` (both EN and locale `/learn` hubs) had
      `:active` press feedback but no `:hover` at all — fixed all of them.
- [x] **Top nav icon check**: the Progress icon (a two-dot winding-path
      glyph) was illegible at 15px, just read as a stray squiggle —
      redesigned as a flag glyph, reads clearly now. Learn/Projects icons
      were already fine once Projects got its dedicated globe icon (see
      "already done" section below).
- [x] **Locale hub "Track 1"/"Track 2" badge** was still hardcoded English
      on the ar/es/fr learn hubs even after the rest of the page translated
      — added `track1`/`track2` to `pageStrings.ts`, fixed.
- [x] **Playground — done, scoped as a pragmatic MVP, not a Monaco/JupyterLite
      port.** Added `/playground.astro`: a bigger, standalone version of the
      inline lesson code cell (same `.cell` markup, same shared Pyodide
      runtime via `runnable-cell.client.ts` — no new execution engine).
      Every code cell site-wide (`RunnableCell.astro` and
      `rehype-runnable-python.mjs`'s generated cells) got a ⛶ "open in
      full-screen editor" button that hands the cell's current code to
      `/playground?code=...` via a query param. Added to the top nav and
      footer for discoverability (this is what "where is the playground?"
      was asking about earlier). Also fixed the stale week-1 admonition
      that promised a "sidebar-toggle Code strip" / notebook mode from the
      old Docusaurus `VsCodePlayground` component — rewrote it to describe
      what's actually built.
      Verified: query-param handoff renders the handed-off code correctly
      (screenshot-tested with a real snippet); the Run/Pyodide path itself
      is unmodified reused code, already screenshot-verified working
      earlier in the session.
      **Explicitly not built**: Monaco editor, JupyterLite terminal,
      notebook mode, saved snippets. If a real Monaco/JupyterLite
      workspace turns out to still be wanted after trying this, that's a
      separate, much larger task — flagging rather than assuming.

## Already done this session (for context, not re-tracked)
Astro promoted to repo root + Docusaurus removed · UI chrome i18n
(nav/footer/onboarding) · stats+progress merged into one page · project
card art restored (per-project gradient + tag emoji, was a flat 🌍 for
every card) · footer redesign · KaTeX strict-mode warnings silenced.
See `astro-rebuild.md` for full detail.
