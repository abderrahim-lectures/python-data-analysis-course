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

- **Link audit**: added `src/pages/learn/[section]/index.astro` (was 404 —
  the Learn cards and lesson breadcrumbs link to `/learn/<section>`, which
  had no page). Ran a full internal-link crawl of `dist/` after build; fixed
  the remaining two real breaks: the ar week-1 breadcrumb pointed at a
  nonexistent `/ar/learn/python-101`, and the topnav locale switcher linked
  to `/es/`, `/fr/`, and a nonexistent `/ar/` root — `es`/`fr` are now
  omitted from the switcher (no content yet) and `ar` points at the one real
  Arabic page (`/ar/learn`) instead of a 404 root. Zero broken internal
  `href`s in `dist/` as of this commit — re-run the crawl after adding pages.

- **Lesson content rendering pipeline fixed** — three real bugs found by
  actually reading a rendered lesson page (not just running `astro build`):
  1. ```python fenced code blocks in markdown were completely static —
     `<Content components={{pre: RunnableCell}} />` looked plausible but is
     an **MDX-only** Astro feature; `type: 'content'` (plain markdown, which
     is what every lesson `.md` file is) ignores the `components` prop
     silently. Fixed by adding a rehype plugin
     (`src/lib/rehype-runnable-python.mjs`) that rewrites Shiki-highlighted
     `<pre data-language="python">` blocks (note: Shiki puts the language on
     `data-language` on `<pre>`, **not** a `language-python` class on
     `<code>` — that's the class you'd expect pre-Shiki, and it's gone by
     the time a rehype plugin sees the tree) into the same markup
     `RunnableCell.astro` produces. The Pyodide hydration script used to
     live inline inside `RunnableCell.astro`'s `<script is:inline>` (so it
     only ever ran for hand-authored `<RunnableCell>` usages); it's now
     `src/lib/runnable-cell.client.ts`, loaded once globally from
     `Base.astro`, and hydrates *any* `.cell[data-runnable]` on the page —
     component-based or rehype-generated.
  2. Docusaurus `:::tip[Title] ... :::` admonitions rendered as literal
     `:::tip[...]` text — Astro's markdown pipeline doesn't know Docusaurus
     container syntax. Fixed with a custom remark plugin
     (`src/lib/remark-admonitions.mjs`). Note for future edits: because the
     content has no blank line between the `:::` markers and the body, they
     parse as **one single paragraph** with the markers embedded in the
     first/last text child (soft line breaks), not as separate sibling
     paragraphs — the plugin has to split within one paragraph's children,
     not scan across paragraphs.
  3. LaTeX (`$$ ... $$`) wasn't rendered at all (no math plugin configured).
     Fixed with `remark-math` + `rehype-katex` + `katex/dist/katex.min.css`
     imported in `Base.astro`.
  - Also added base CSS for fenced/inline code and the `.admonition`/`.cell`
    classes to `src/styles/global.css` (previously there was **no** base
    styling for `<pre>`/`<code>` at all outside the hand-authored
    `RunnableCell` component, hence "code block is ugly").
  - **Before reusing any of this on new content**: always `rm -rf .astro`
    (or `node_modules/.astro`) after editing a remark/rehype plugin file —
    Astro's content-collection cache does not reliably pick up plugin
    changes on a warm `astro build`/`astro dev`; a stale cache silently
    runs the *old* (or no) plugin with zero errors, which cost real time
    debugging "why isn't my plugin running" in this session.

- **Two more real UI bugs**, both found by looking at actual screenshots
  (`astro build` succeeding proves nothing about visual correctness):
  1. `/learn` section cards were visually broken — an empty box floating
     next to disconnected route pills. Root cause: `src/pages/learn/index.astro`
     nested `<a class="route-pill">` links inside an outer
     `<a class="sectioncard">` link. **Nesting `<a>` inside `<a>` is invalid
     HTML** — browsers auto-close the outer anchor as soon as they hit the
     inner one, which silently un-nests everything after it (the whole
     `.routes` block) into document flow outside the card. Fixed by making
     the outer element a `<div class="sectioncard">` with an inner
     `<a class="sectioncard__hit">` covering just the icon/title/description,
     and `.routes` as a sibling `<div>` inside the same card. **Grep for
     `<a class="sectioncard"` or similar nested-anchor patterns before
     reusing this card pattern elsewhere.**
  2. Code inside runnable cells (`.cell__code`) rendered as blank/invisible
     bars in real screenshots, not literal strikethrough. Cause:
     `--font-mono` in `global.css` listed `'Space Grotesk'` — the site's
     *display/heading* font, not a monospace font — as its first choice.
     Fixed the stack to `ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo,
     Consolas, 'Liberation Mono', 'Fira Code', monospace`.

- **Syntax highlighting restored in runnable cells** — the earlier fix
  replaced Shiki's highlighted `<code>` children with a flattened plain-text
  node (needed to fix the invisible-text font bug), which lost per-token
  color. `rehype-runnable-python.mjs` now keeps Shiki's highlighted spans and
  only strips the `<pre>`'s own inline background/class, so `.cell__code`'s
  background wins while token colors survive — `textContent` still
  reconstructs the plain source fine for the Pyodide runner even through
  nested spans. Also refactored both custom plugins to build hast nodes with
  `hastscript` (`h(...)`) instead of hand-written object literals — install:
  `hastscript`.
- **Tables**: added `.lesson-content table` styling (100% width,
  `border-collapse`, striped rows, horizontal scroll on mobile) — there was
  none before; markdown tables rendered as plain unstyled browser default.
- **Cleaned up real leftover Docusaurus/MDX JSX debris in content** — not
  cosmetic-only, this was literally malformed markup rendering broken text
  in the browser (e.g. a stray `}>` after each challenge's answer). Found by
  actually reading rendered lesson/project pages, not by `astro build`
  (which stayed green through all of this). Three one-time content-migration
  scripts (run once, not part of the build):
  - **Challenge blocks** (120 across 20 lesson files): source was
    `<div class="challenge">answer text</>}>` + blank line + question
    paragraph + blank line + `</div>` — a mangled leftover of the original
    `<Challenge answer={<>...</>}>question</Challenge>` JSX. Converted to
    `<details class="challenge"><summary>🧩 Challenge — think first, then
    reveal</summary><div class="challenge__body">QUESTION<p
    class="challenge__answer">💡 <strong>Answer:</strong> ANSWER</p></div></details>`
    — a native, no-JS collapsible reveal. Styled in global.css.
  - **Bonus content** (4 blocks, `<BonusContent weekId="...">...</BonusContent>`):
    unwrapped to a styled `<div class="bonus">`.
  - **Project step checklists** (339 items across 27 project files,
    `<StepChecklist><StepChecklistItem>...</StepChecklistItem>...</StepChecklist>`
    plus a leftover `import {StepChecklist, ...} from '@site/...'` line):
    converted to plain markdown bullet lists (`- ✅ item`) rather than raw
    HTML `<li>` tags — **important gotcha**: CommonMark treats a line
    starting with `<li`/`<ul`/`<div`/`<p` etc. as a raw HTML block and does
    **not** process inline markdown (backticks, `*emphasis*`) inside it, so
    emitting raw `<li>` tags would have silently broken every inline code
    span in every checklist item. Real markdown list syntax doesn't have
    this problem and was used instead.
  - **Not yet fixed**: `## ✅ Weekly quiz` headings in every lesson have no
    quiz content — the original `<WeeklyQuiz questions={[...]}>` JSX and its
    question data were already gone by the time this session started (lost
    in an earlier, undocumented porting pass), not something these scripts
    could recover. Needs sourcing quiz questions from somewhere (git history
    of `docs/` pre-Astro-migration, or the i18n copies, might still have
    them — check before assuming they need to be written from scratch).
  - These scripts touched only `src/content/**` (EN content). **The same
    JSX debris almost certainly exists in the untouched `i18n/{ar,es,fr}/`
    source docs** — rerun equivalent fixes when porting those locales
    (gap #1 below), don't assume the translated source is clean just
    because the English copy now is.
- **Projects grid**: added a 🌍 icon and an "Optional · ungraded" badge to
  each card (`src/pages/projects/index.astro`) to match the rest of the
  site's gamified visual language — previously just title + description,
  visually flat compared to the Learn cards.

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
