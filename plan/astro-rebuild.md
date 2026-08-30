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

- **`/learn` section cards redesigned for clarity** (user feedback: "this is
  confusion" on a screenshot). Three real UX issues, not just visual polish:
  1. The whole card body was a link to the section overview page (`.sectioncard__hit`)
     *and* the route pills inside it were separate links to specific weeks —
     two different destinations from what looked like one clickable area,
     with no visual distinction between them.
  2. Pill copy was inconsistent between cards: Python 101 said "Normal —
     start here" / "Hard"; Pandas & Data said "Normal" / "Hard" — same
     meaning, different wording, read as possibly-different actions.
  3. Nothing labeled what Normal/Hard actually meant (two difficulty tracks
     of the *same* content, not two different things to build).
  Fixed: removed the card-body link entirely; the route pills are now the
  card's one primary action, restyled as solid tactile buttons (matching
  the site's existing `.btn`/`.btn-primary` press-shadow language, not the
  soft pastel pill style) under an explicit "CHOOSE YOUR ROUTE:" label; "See
  all N weeks →" is a separate, clearly secondary text link below a divider.
  Copy standardized to "Normal — start here" / "Hard — start here" on both
  cards. See `src/pages/learn/index.astro`.

## Pedagogy: evidence base for the current design (2026-08-30)

User asked for research to back the VN/gamification approach. Findings, mapped
to what's actually on this site (not abstract theory):

- **The VN format itself is directly validated**: Prayoga, Muhammad & Taufiq,
  *"Design and Development of Visual Novel-Based Educational Game to Enhance
  Computer Basics Understanding for High School Students"*
  ([doi.org/10.58477/dj.v4i1.348](https://doi.org/10.58477/dj.v4i1.348)) — a
  visual-novel-format CS/computing course, evaluated with pre/post tests
  (N-Gain 0.61, "medium" effectiveness) and 87.6% learner acceptance. Built
  with the **ADDIE** instructional-design model (Analyze/Design/Develop/
  Implement/Evaluate) — worth using as the process checklist for future
  content passes, not just a one-off citation.
- **Self-Determination Theory** (Deci & Ryan — autonomy / competence /
  relatedness) is the load-bearing framework for *why* the gamification here
  should work, and where it's currently thin:
  - Autonomy ✅ — Normal/Hard track choice, switch-anytime messaging already
    on `/learn`.
  - Competence ✅ (as of this session) — the progress trail now actually
    reflects real completion (was silently broken, see below); mastery
    visibility is exactly what SDT competence support needs.
  - Relatedness ❌ — weakest leg. No mentor/persona voice, no community
    signal anywhere. The plan's own "VN persona model" section (mentor
    narrator + per-track teaching partner) was designed to cover exactly
    this gap and is still unbuilt (see gap list). This is the single most
    theory-backed argument for prioritizing that work over further visual
    polish.
  - Caution from the literature: streak/punishment framing can produce only
    shallow "introjected" compliance rather than real motivation — audited
    current copy, found no punitive streak-loss language shipped anywhere
    (good, nothing to fix), but avoid adding any "you lost your streak 😢"
    guilt-style copy later.
- **Testing effect / active retrieval** (the most robust finding in the
  literature for durable learning, and the mechanism behind spaced
  repetition and quiz-style practice) is the **single highest-leverage gap
  on this site**: every lesson has an empty `## ✅ Weekly quiz` heading (see
  "Not yet fixed" note above — the original quiz question data was already
  lost before this session). The Socratic Questions sections (now styled)
  are a partial substitute — open-ended retrieval prompts are still
  retrieval practice — but a real answer-checked quiz would engage the
  testing effect more directly. Didn't fabricate 20 lessons of quiz
  questions here — low-quality invented quiz content would be worse than
  none; this needs either real authored questions or recovering the
  original data (git history / i18n copies, per the earlier note).
- **Mastery learning** (Khan Academy's 5-level model: Not Started → Attempted
  → Familiar → Proficient → Mastered) is a plausible upgrade path for the
  current binary done/not-done badge system, if revisited — cited for future
  reference, not implemented this session (binary completion is a reasonable
  MVP and matches the "one lesson, one XP award" model already built).

Sources: [Design and Development of Visual Novel-Based Educational Game...](https://journal.ypmma.org/index.php/dj/article/view/348) · [Self-Determination Theory: Deci & Ryan's 6 Mini-Theories](https://yukaichou.com/gamification-analysis/self-determination-theory-guide-to-ryan-and-decis-motivation-framework/) · [Self-Determination Theory: Users Want Autonomy, Relatedness, and Competency (NN/g)](https://www.nngroup.com/videos/self-determination-theory-autonomy-relatedness-competency/) · [The impact of educational gamification on cognition, emotions, and motivation: a randomized controlled trial](https://link.springer.com/article/10.1007/s40692-025-00366-x)

- **`/progress` was silently broken** — the whole page (station done/undone
  marks, quest lock states, milestones, "N/5 done" counts) was computed in
  Astro frontmatter by calling `gameState.ts` functions at **build time**,
  where there is no `localStorage` (Node/SSG) — `read()`'s try/catch
  silently returns all-zero defaults, so every visitor always saw a
  fresh-account skeleton regardless of real progress. Only the top XP-bar
  numbers had a client `<script>` patching them in; stations/quests/
  milestones never got the same treatment. Found by reading the actual
  gameState code path, not by looking at a screenshot (a fresh
  never-played browser profile looks identical to "hydration is broken" —
  this needed tracing the data flow). Fixed: `src/pages/progress.astro`'s
  script is now a module that imports `gameState.ts` directly and fully
  re-renders stations (via new `isWeekComplete(section, week)`, which checks
  either the normal or hard variant so hard-track completion isn't invisible
  on the trail), quests, milestones, and the player card from real
  localStorage on load. Also centralized the rank/XP-tier logic
  (`rankFor`, `RANKS`, `RANK_EMOJIS`) into `gameState.ts` — it was
  duplicated inline in `index.astro`'s script and would have drifted from
  `progress.astro`'s copy the next time either was edited; `index.astro` now
  imports the shared version too.
- **`▶ Run` buttons showed up on project code blocks** — `rehype-runnable-python`
  applied to *all* markdown content collections (both `learn/` and
  `projects/` share one `astro.config.mjs` markdown pipeline). Projects are
  explicitly "graduate to real Python on your machine" content (uv, local
  scripts, file I/O) — Pyodide can't run most of it, and offering a Run
  button there is actively misleading, not just superfluous. Fixed: the
  plugin now checks the source file's path (`file.path`, from the vfile
  Astro's pipeline passes through) and skips anything under
  `src/content/projects/`.
- **Nav/footer naming inconsistency**: `/progress` was called "Trail" in the
  top nav, "Progress" in the mobile nav, and "My Progress" in the footer —
  three names for one page. Standardized on "Progress" everywhere (matches
  the URL and the footer, which was already right). Also: the homepage hub
  card said "Real Projects" while the actual page title/H1 is "Real-World
  Projects" — made them match.
- **`/learn` section cards** got icons via the existing `SceneBg.astro`
  component (gradient + particle backdrop, already built and unused) instead
  of a flat CSS-gradient div with nothing on it — 🐍/📊/🚀 now sit in each
  card's scene the way the plan's "no heavy image assets, VN persona
  styling" principle intends. Same fix on the homepage hub cards.
- **Homepage hero "Quest log" terminal was completely unstyled** —
  `.hero__terminal`/`.hero__termbar`/`.hero__termbody` classes were used in
  the markup with zero matching CSS anywhere, so it rendered as plain text
  with no dark terminal chrome at all. Styled as a proper dark terminal
  window (traffic-light dots, monospace body) — fixed colors (not the
  theme-flipping `--ink-hi` etc. vars) since this is a fixed dark visual
  flourish regardless of site light/dark mode.
- **Footer replaced**: was a single copyright line; Docusaurus's original
  had a real 3-column footer (Course/Site/More links) + a copyright line
  with license + version. Rebuilt that in `Base.astro`, pulling the version
  from `package.json` instead of hardcoding it (so it can't drift).
- **Runnable cells are now actually editable** — code was static
  `<pre><code>` with no way to change it before running, which undercuts
  "playground" regardless of whether the full Monaco/JupyterLite editor
  ever gets built (see gap list — that's a separate, much larger task, not
  done here). `runnable-cell.client.ts` now sets
  `contenteditable="plaintext-only"` on the code element and re-reads its
  live `textContent` at Run time instead of caching the original source at
  hydration — Tab inserts 4 spaces instead of moving focus.
- **`/learn/[section]/[track]/[week].astro` full lesson-section styling**:
  wrapped `## 🎯/⚠️/🧩/🤔/✅ <heading>` blocks (Learning objectives, Common
  pitfalls, Challenges, Socratic Questions, Weekly quiz) in a styled
  `<section class="lesson-section lesson-section--kind">` card via a new
  `rehype-section-blocks.mjs` plugin — previously these were bare headings
  + a plain list with no visual grouping. **Do not** convert this plugin
  back to a generic `visit()` over the whole tree — it deliberately scans
  only `tree.children` (top level) because a wrapped section contains the
  same heading as a child; a recursive visitor re-matches it and wraps it
  again forever (hit this exact infinite-recursion bug once already
  building it — `RangeError: Maximum call stack size exceeded` — see the
  comment in the file).

### Known gaps / next steps

1. **i18n content**: only EN lesson content exists in `src/content/learn`.
   `ar/es/fr` still only have the one hand-written static page each
   (`src/pages/ar/learn/...`) — no content-collection-driven locale routing
   yet. 156 translated markdown files sit in `i18n/{ar,es,fr}/` unported.
   **Before porting them**: they almost certainly contain the same
   Docusaurus JSX debris (`</>}>`, `<StepChecklistItem>`, `<BonusContent>`,
   leftover `import ... from '@site/...'` lines) that this session found and
   cleaned out of the EN copies — check for it and reuse the same
   remark/rehype approach rather than copying broken markup forward. This is
   plan step 2, still not done.
2. **Docusaurus JSX widgets — partially resolved this session**:
   `Challenge` and `BonusContent` are now real (native `<details>`/`<div>`
   conversions, see above) — the ones actually missing are `WeeklyQuiz` and
   `ProgressCheckbox`. `WeeklyQuiz` is worse than "not built": the question
   *data* itself is gone (every lesson's `## ✅ Weekly quiz` heading has no
   content under it, and this predates this session — check git history /
   the i18n copies before writing new quiz questions from scratch, don't
   assume they need to be authored fresh). `ProgressCheckbox` was a
   Docusaurus per-lesson "mark as read" checkbox — likely superseded by
   `gameState.completeLesson()` already wired into the runnable-cell flow,
   worth confirming rather than rebuilding.
3. **Trail rail — fixed this session**, was more broken than the original
   plan note anticipated: not just the weeks-6..10 numbering (that part was
   already correct in this Astro build), but the entire `/progress` page
   was computing everything from build-time (localStorage-less) defaults
   and never updating client-side — see the "`/progress` was silently
   broken" note above. Verify this by hand in a real browser: complete a
   lesson, reload `/progress`, confirm the station lights up — this
   session's automated headless-Chrome verification of it hit sandbox/CDP
   tooling issues (websocket origin rejection, background-process timeouts)
   that ate significant time without a clean screenshot confirmation; the
   fix is correct by code review but hasn't been visually confirmed live.
4. **JupyterLite mount** at `/lite/` — not started; original `jupyterlite-config/_output`
   build from the Docusaurus site needs to be copied/mounted as static assets
   under `public/lite/` (or similar) and linked from Data Analysis lessons.
5. **Full Monaco/VS-Code-style playground + notebook mode** — the lesson
   text (the "First time here?" / "Want a bigger workspace?" admonitions)
   promises a "⛶ full editor" button and a notebook-mode sidebar strip that
   don't exist. `RunnableCell` is now at least editable in place (see
   above), which covers the base case, but the full `VsCodePlayground`
   React component (Monaco + JupyterLite terminal, ~615 lines across 4
   files in the old Docusaurus `src/components/VsCodePlayground/`) has not
   been ported as an Astro `client:only` island. This is a large, separate
   task — don't attempt it piecemeal inside an unrelated fix.
6. **GH Pages CI** (`deploy.yml`) — deliberately deferred per user instruction above.
7. Old Docusaurus site + `docs/`/`i18n/` still present at repo root — not yet
   removed; keep both until the Astro site has full content parity.
8. **Relatedness (SDT)** is the weakest-supported psychological need per the
   pedagogy research above — no mentor/persona voice or community signal
   anywhere on the site. The plan's own "VN persona model" section (mentor
   narrator + per-track teaching partner) was designed to cover exactly this
   and is still completely unbuilt — arguably higher-leverage than further
   visual polish at this point.
