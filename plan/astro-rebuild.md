# Redesign: Astro + Visual-Novel Course (migration off Docusaurus)

## Objective

Rebuild `pyda-course` (currently Docusaurus 3.10.2 / React 19) as a **beginner-first,
gamified, visual-novel-styled** learning platform on **Astro**, preserving every feature
(52 lessons × 4 locales, Monaco+Pyodide playground, JupyterLite, XP/streaks/badges/quests),
deploying to **GitHub Pages**.

Branch: `redesign/astro-visual-novel` (built from `improve/beginner-onboarding`).

## Design principles (inherited from `plan/improvement-plan.md`)

- **Every criticism specific and located** — errors name line + exact mistake.
- **Facts vs. decisions separated** — tutorial facts vs "choose your track" decision.
- **Empathy via personas** — a cast of learner/mentor avatars with distinct personalities guide
  each track, delivering narration in a dialogue box (visual-novel framing).
- **Mistake memory** — "Stuck?" captures common mistakes per week.
- **First success in under 2 minutes** — guaranteed.

## Persona/visual-novel model

- A **mentor narrator** ("Ada"? "Rowan"? — see `src/styles`/content decision) who greets the
  learner, summarizes each week, and reacts to progress in a dialogue box at the bottom.
- Per-track teaching partner with a distinct personality (Normal = patient, beginner;
  Hard = terse, ambitious).
- Characters as inline SVG/CSS avatars (no heavy assets), emotional states (idle/happy/surprised).
- Dialogue advances with space/click; lesson content sits "above" a persistent dialogue bar.

## Architecture

- **Framework**: Astro 5, static output (`output: 'static'`), `@astrojs/sitemap`,
  per-locale prerendered routes (`[lang]/docs/...`), `site` base path for GH Pages.
- **i18n**: Astro Content Collections keyed by locale; UI string dictionaries per locale
  (ported from `i18n/{ar,es,fr}/code.json`). `request`-level locale detection + sticky toggle.
- **Content**: migrate `docs/**` markdown into `src/content/<locale>/...`. Reimplement
  Docusaurus JSX widgets (`Challenge`, `WeeklyQuiz`, `ProgressCheckbox`, runnable cells,
  `StuckHelp`, `BonusContent`) as Astro/`<Script is:inline>` islands.
- **Playground**: keep the working Monaco+Pyodide logic; mount it as an Astro island
  (`client:only`) per lesson.
- **JupyterLite**: keep `jupyterlite-config/_output` build; mount under `/lite/` as-is.
- **Gamification**: port `useXp`, `useStreak`, quests, badges, trail map/rail (fixing the
  Data Analysis week-6..10 bug identified in the Docusaurus survey).
- **Deploy**: a new `deploy.yml` for Astro `astro preview`/`gh-pages` + JupyterLite merge.

## Steps

1. **Scaffold Astro + VN design system** — `astro` skeleton, Tailwind/CSS tokens, persona
   avatar + dialogue-box components, GH Pages base path config. *Verify: `astro build` green.*
2. **i18n routing + UI dictionaries** — port `code.json` → `src/i18n/<locale>.ts`, add
   `[lang]` routes and locale switcher. *Verify: ar/es/fr pages render.*
3. **Content Collections + first lesson** — migrate Python 101 Normal Week 1 into a
   VN-framed page; reimplement runnable cell + challenge + quiz islands. *Verify: runnable
   cell executes via Pyodide.*
4. **Gamification + trail map/rail** — port XP/streak/quests/badges; trail rail with correct
   weeks 6–10 for Data Analysis. *Verify: e2e XP increments.*
5. **Data Analysis + JupyterLite + projects** — migrate remaining content; mount `/lite/`;
   port projects gallery.
6. **GH Pages CI + full verification** — new `deploy.yml`; 4-locale build; Playwright suite.

## Invariants (checked after every step)

- `astro build` succeeds for all 4 locales.
- No dead links in lesson bodies.
- Playground still runs `print`/`input()` via Pyodide.

## Status log (updated 2026-08-30)

**Decision from user**: GH Pages CI deploy (`deploy.yml`) is explicitly deferred —
do not build it until asked. Push all work-in-progress to the current branch
(`redesign/astro-visual-novel`) as it lands, don't wait for a "finished" state.

### Done

- Step 1 (scaffold): Astro 5 skeleton, VN design tokens in `src/styles/global.css`
  (light/dark via `data-theme`), `Base.astro` layout with topnav, XP bar,
  level-up overlay, onboarding modal — all already present before this session.
- Content collection schema fixed (`src/content/config.ts`): `projects.slug` and
  `learn.section`/`learn.track` were incorrectly `required` — `slug` is an
  Astro-reserved frontmatter field (auto-stripped before validation, so requiring
  it always fails) and the two track-landing pages (`python-101/index.md`,
  `data-analysis/index.md`) legitimately lack `section`/`track`. Both builds now
  pass; verify this still holds before adding new required schema fields.
- **Dynamic lesson route** added: `src/pages/learn/[section]/[track]/[week].astro`
  replaces the old hand-written one-off `week-1.astro` proof-of-concept. Uses
  `getStaticPaths()` over the `learn` collection, so any new lesson `.md` file
  dropped into `src/content/learn/<section>/<section>/<track>/week-N.md` with
  `section`/`track`/`week` frontmatter is picked up automatically — no new page
  file needed. Renders prev/next lesson nav, a track-switch card, and wires
  `completeLesson()` from `src/lib/gameState.ts` on last-lesson "mark complete".
  Currently generates all 20 EN python-101 + data-analysis lessons.
- **Projects gallery** added: `src/pages/projects/index.astro` (card grid from
  the `projects` collection) + `src/pages/projects/[...slug].astro` (detail
  page). Note: project frontmatter `slug: /projects/<name>` becomes the content
  entry's `entry.slug` verbatim (leading `/projects/`) — both pages strip
  `^\/?projects\//` before building the route param / href. If you add a
  project whose `slug:` doesn't follow that `/projects/<name>` shape, this
  strip will silently misroute it.
- **SEO**: `Base.astro` now takes `description`/`image` props and emits
  `<meta name="description">`, canonical link, OG + Twitter card tags.
  `@astrojs/sitemap` installed and wired into `astro.config.mjs`
  (`dist/sitemap-index.xml` on build). `public/robots.txt` added, pointing at
  the sitemap under the GH Pages base path.
- `npm run build` is green: 56 pages generated (up from 7).
- **Dev base path**: `astro dev` now serves from plain `localhost:4321/` (no
  `/python-data-analysis-course/` prefix) — `astro.config.mjs` detects the dev
  command via `process.argv.includes('dev')` and sets `base: '/'` only then;
  `npm run build` still emits the GH Pages base path. (A function-form
  `defineConfig(({command}) => ...)` was tried first and broke `Astro.site`/
  SEO canonical URLs during build for unclear reasons — stick with the
  `process.argv` check, don't revert to the function form without checking
  that `Astro.site` still resolves.)

### Known gaps / next steps

1. **i18n content**: only EN lesson content exists in `src/content/learn`.
   `ar/es/fr` still only have the one hand-written static page each
   (`src/pages/ar/learn/...`) — no content-collection-driven locale routing
   yet. Porting `i18n/{ar,es,fr}/code.json` UI strings + translated lesson
   markdown into `src/content/<locale>/...` (or a `learn` entry `lang` field +
   locale-aware dynamic route) is still open — this is plan step 2, not done.
2. **Reimplement Docusaurus JSX widgets** as Astro islands: `Challenge`,
   `WeeklyQuiz`, `ProgressCheckbox`, `StuckHelp`, `BonusContent`. Not started —
   current lesson markdown is plain (no interactive quiz/challenge blocks
   ported over yet, only the runnable-cell `<RunnableCell>` swap via the
   `Content components={{pre: RunnableCell}}` prop in the dynamic lesson page).
3. **Trail map/rail** (gamification step 4): `src/lib/gameState.ts` +
   `gamestats.ts` exist and track XP/streak/badges/quests, and `stats.astro`/
   `progress.astro` pages exist, but the visual trail rail with the
   weeks-6..10 Data Analysis numbering fix mentioned in the plan hasn't been
   verified/built in Astro yet.
4. **JupyterLite mount** at `/lite/` — not started; original `jupyterlite-config/_output`
   build from the Docusaurus site needs to be copied/mounted as static assets
   under `public/lite/` (or similar) and linked from Data Analysis lessons.
5. **GH Pages CI** (`deploy.yml`) — deliberately deferred per user instruction above.
6. Old Docusaurus site + `docs/`/`i18n/` still present at repo root — not yet
   removed; keep both until the Astro site has full content parity.
