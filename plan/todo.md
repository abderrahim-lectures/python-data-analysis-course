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

## Session 2026-08-30 (later) — progress tracking was dead, now fixed

- [x] **Progress tracking repaired.** Three independent bugs meant nothing
      could ever be marked done: (1) markdown-generated code cells carried no
      `data-lesson`, so the XP award was gated on an always-empty id;
      (2) "Mark complete" only rendered on the *last* week of a track, so
      weeks 1-4 had no completion path at all; (3) `addXP` assigned
      `s.lastActive = today()` *before* comparing it to `today()`, so the
      "same day" branch always won and the streak was pinned at 0 forever.
- [x] **Quests were unreachable.** 7 of 11 (streak-3/7/14, xp-100/500,
      all-python, all-data) had no `markQuest` call anywhere. Added an
      `evaluateMilestones` pass. Also `track-${id.split('-')[0]}` produced
      `track-python` instead of `track-python-101`, so that one never matched.
- [x] **Legacy state migration.** Learners who used the buggy build have real
      XP but a 0 streak and an empty quest map; the fix alone only applied to
      *future* awards. `repairLegacy()` now rebuilds what's derivable from
      `lessonsCompleted` on read. Verified against the exact reported state
      (20 XP / 0 / 0 / 0-11 -> 20 XP / 1 / 1 / 3-11).
- [x] **Playground hardened.** `?code=` is attacker-controllable and Pyodide's
      `js` bridge reaches this origin's localStorage/DOM/fetch. Shared code is
      now size-capped, gated behind an explicit review step (Run disabled
      until confirmed), and screened by `src/lib/pythonGuard.ts`. The guard is
      deliberately conservative — it also refuses bridge imports mentioned
      inside strings; over-blocking costs a reword, under-blocking leaks
      progress data.
- [x] **Visual fixes**: reward bars used `width: var(--p)` with unitless
      numbers (invalid CSS) and rendered as broken partial meters — they were
      never real meters, now uniform accents; `.btn-primary` had a
      near-invisible hover; learn hubs used a hard `1fr 1fr` that clipped
      between 720-900px (the reported Arabic card clipping) — now `auto-fit`;
      disabled buttons now look disabled. Site name is "PyDA Course"
      throughout, including the onboarding modal in all 4 locales.
- [x] **Tests added.** `npm test` runs 82 vitest unit tests (game state,
      bridge guard, lesson wiring). `npm run test:e2e` runs 26 real-browser
      checks over CDP via Node's built-in WebSocket — no Playwright dependency.
      Replaced the stale Docusaurus-era `tests/e2e/*.spec.ts` suite, which
      tested removed features (JupyterLite, VSCode playground, placement quiz)
      and could not run at all since Playwright isn't installed.

- [x] **Onboarding fixed and hardened.** The modal was rendered *visible* in
      HTML and hidden by JS after load, so every returning visitor saw it
      flash on every page. It now starts `hidden` and is only revealed for
      genuine first visits. Added dialog semantics (`role="dialog"`,
      `aria-modal`, labelled by title/description), focus move-in and
      restore-on-close, a Tab focus trap, Escape and backdrop-click to
      dismiss, and a try/catch around localStorage so private mode can't
      trap a visitor behind an undismissable overlay or take the rest of
      page init down with it. Steps are now a real `<ol>`.

### Still open
- `deploy.yml` still assumes the old JupyterLite build step; GH Pages CI work
  remains deferred per standing instruction.
- Push to `redesign/astro-visual-novel` is still blocked by the OAuth
  `workflow`-scope limitation — commits are local only.
