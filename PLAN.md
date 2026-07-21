# Python & Data Analysis Course — Docusaurus Site

## Context

Building a from-scratch university-level Python and data analysis course, hosted on GitHub Pages, covering two 5-week sections:

1. **Python 101** — fundamentals
2. **Pandas & Data Analysis** — Kaggle-style EDA

Each section offers two parallel tracks (**Normal** and **Hard**) so students can self-select difficulty. Because students won't have Python installed in the early weeks, every page needs a zero-install way to run code, surfaced through a persistent **FAB (floating action button)** that opens an embedded playground. Students are math/data-analysis majors on their phones, not at a desk — the site and its interactions need to read that way; this also motivates the Arabic/French/Spanish/English i18n requirement below. The working directory is currently empty, so this is a greenfield build — no existing code/conventions to reconcile with.

Decisions locked in with the user:
- **Site generator:** Docusaurus
- **Playground (dual, section-aware):** **Trinket.io** for Section 1 (Python 101) — a simple no-login script editor, the right weight for basics without notebooks. **Self-hosted JupyterLite** for Section 2 (Data Analysis) — a full Jupyter Notebook UI running in-browser via Pyodide/WebAssembly, no login, no external server, deployed as static files alongside the rest of the site; it matches the cell-based, Kaggle-notebook feel that Section 2's pedagogy is built around, and ships pandas/numpy/matplotlib out of the box.
- **Content depth:** full content for all 10 weeks × 2 tracks in this pass (not just scaffolding)
- **Languages:** English (default) plus Arabic, Spanish, and French via Docusaurus's built-in i18n system — see Internationalization section below for what's fully written now vs. scaffolded. Arabic content translation (all 20 weeks, both section landing pages, and the capstone bonus page) is complete; Spanish and French content translation followed the same one-language-at-a-time approach and is in progress.
- **Pedagogy pattern:** replace plain "Exercises" with **Challenges (with revealable answers)** + **Socratic Questions** (open-ended, no-answer reflection prompts) on every lesson page
- **Client-side persistence:** since there's no backend/login, per-student state (progress, revealed answers, playground scratch code, track choice, quiz result) lives in the browser's `localStorage`
- **Mobile-first, layout and performance both:** design and test every component (FAB, quiz, challenge blocks, track comparison) at phone width first, desktop is the enhancement, not the baseline — and mobile performance (small initial bundle, heavy dependencies loaded only when actually needed) is treated as seriously as mobile layout, since this audience is on phones and often not on Wi-Fi
- **Section 1 hard track builds no numpy** — it uses only Python's built-in types, deliberately, so its performance pain becomes the motivating hook for Section 2 (see below)
- **Choosing a track is gated by information, and choosing Hard for Data Analysis is additionally gated by a self-check quiz** (see Learning Path Flow below)
- **Gamification is optional and reversible:** a badge system plus quiz-gated bonus content (try/except, classes — deliberately excluded from the core "no classes" curriculum, offered as optional extensions for students who pass a week's quiz) — but students choose **Gamified vs. Classical (minimal)** presentation up front and can flip it anytime mid-course; both modes read the same underlying progress data, so nothing is lost switching back and forth
- **Visual design/UX must be built for this specific audience** (math majors, on phones, motivated by small wins) — not a generic docs theme reskin
- **A capstone bonus at the very end of the whole course**: install Python locally for real (graduating off the in-browser playgrounds) and build a first AI agent with LangChain's `deepagents`, using a free-tier AI API. Students are free to pick whichever provider they like — GitHub Models is the suggested default (no separate signup, ties into the GitHub account every student already has, and a more forgiving free tier than most alternatives), with Gemini, Groq, Mistral, Cerebras, and OpenRouter documented as equally valid options. This is teased on the welcome page's learning-objectives summary from day one as motivation to finish, not sprung on students at the end — see the dedicated Capstone Bonus section below.

## Development Workflow

Every unit of work — a component, a week's content, an infra piece, a bug fix, however small — goes through the same GitHub flow, tracked end to end:

1. **Open a GitHub Issue first**, labeled by type (`type:feature`, `type:bug`, `type:content`, `type:infra`, `type:i18n`) and area (`area:python-101`, `area:data-analysis`, `area:playground`, `area:gamification`, `area:design`), via `gh issue create`.
2. **Branch off `main`**, named after the issue (`issue-<number>-<short-slug>`).
3. **Do the work** on that branch.
4. **Open a PR** via `gh pr create` that references/closes the issue (`Closes #N`).
5. **Merge into `main`** — **run autonomously**: you've given standing authorization to merge PRs without confirming each one, so once a PR's checks (build, smoke tests) pass, it merges without waiting on a go-ahead.

"Small" is scoped at roughly the granularity already broken out across this plan — one issue per component, per week's content, per infra piece — not one issue per individual file edit, which would just produce noise given this project's real size (dozens of components, 20 weekly content pages, i18n scaffolding, a JupyterLite build, a gamification system).

**The loop closes with students, not just us:** every doc page footer carries a small "Found a problem with this page? Report it" link that opens a pre-filled `gh` issue (page path + a `type:bug`/`area:*` label pre-selected) — so a typo or a broken Trinket embed a student hits mid-lesson feeds into the exact same issue → branch → PR pipeline, rather than getting lost in a Slack DM or forgotten.

This adds prerequisites before any content work starts:
- A **public** GitHub repo named **`python-data-analysis-course`** needs to exist and be connected — there is currently no git repo at all in the working directory (currently named `pyda-course`; it gets renamed to `python-data-analysis-course` to match, or the new repo is simply cloned to a matching path), so step one is `git init` plus `gh repo create python-data-analysis-course --public` (under whichever account `gh` is authenticated as), which also fixes `docusaurus.config.js`'s `baseUrl` to `/python-data-analysis-course/`.
- **GitHub Pages must actually be enabled** on the repo (Settings → Pages → Build and deployment source: "GitHub Actions") — pushing the workflow file alone doesn't turn Pages on, this is a one-time manual repo setting done right after repo creation.
- A `LICENSE` file, since the repo is public (MIT for code is the simple default; course content itself can be flagged separately, e.g. CC-BY, on the credits page if that distinction matters).
- The label set (`type:*`, `area:*`) gets created once, up front, via `gh label create`, before the first real issue.
- **Given the real scale here (~40–60 issues across components, 20 weekly content pages, infra, and i18n), a GitHub Project (board) is created up front** to keep "tracked everything, however small" actually navigable at a glance, rather than a flat, unsorted issue list.

## Code Organization & Engineering Practices

Given the real scale here (a dozen-plus custom components, several cross-cutting concerns like localStorage/i18n/gamification), a few practices keep things manageable rather than accumulating into sprawling files:

- **Small, single-responsibility files**: a component's `index.tsx` handles composition/rendering; state and business logic move into their own hook (e.g. `useBadges`, `useProgress`, `useQuizScore`) rather than living inline in a large component body. If a component's `index.tsx` is creeping past roughly 150–200 lines, that's the signal to split out a subcomponent or extract a hook, not push through in one file.
- **Logic that repeats across components is centralized once, not copy-pasted**: badge-earning rules, quiz-scoring, and "is this content unlocked" checks are each exactly one small module (e.g. `src/utils/badges.ts`, `src/utils/quizScoring.ts`, `src/hooks/useUnlockCondition.ts`) that `PlacementQuiz`, `WeeklyQuiz`, and `BonusContent` all call into — since these three components all implement variations of the same "score → gate → unlock" pattern, they should share one implementation instead of three near-duplicate ones.
- **Shared types live in one place** (`src/types/`) — the shape of progress data, badge IDs, quiz results, etc. — so components and hooks reference the same source of truth instead of each redefining its own local shape that can drift.
- **This also fits the Development Workflow's per-component-issue granularity above**: small, focused files map naturally onto small, focused PRs — a component that's already split into composition + hooks + utils is easier to review and land incrementally than one monolithic file touched by every related PR.

## Site Structure

```
python-data-analysis-course/
├── docusaurus.config.js       # site config, GH Pages baseUrl/org/repo settings
├── sidebars.js                # 2 sections x 2 tracks x 5 weeks nav tree
├── package.json
├── src/
│   ├── components/
│   │   ├── PlaygroundFab/     # global floating action button + modal/drawer (full-screen on mobile)
│   │   │   ├── index.tsx
│   │   │   └── styles.module.css
│   │   ├── Challenge/          # collapsible challenge+answer block, remembers reveal state
│   │   ├── ProgressCheckbox/   # per-lesson "mark complete" checkbox, feeds progress tracking
│   │   ├── TrackSelector/      # Normal/Hard picker with objectives comparison, shown on section landing pages
│   │   ├── PlacementQuiz/      # self-check quiz gating entry to Data Analysis Hard track
│   │   ├── WeeklyQuiz/         # short auto-graded quiz at the end of each week, unlocks that week's bonus content
│   │   ├── BonusContent/       # optional/advanced block, gated by WeeklyQuiz pass — framed as "🔓 unlock" (gamified) or plain "available once passed" (classical)
│   │   ├── BadgeCase/          # gamified-only: earned badges + progress bar + unlock toast. Classical mode renders the same facts as a plain text progress summary instead
│   │   ├── LearningStylePicker/ # onboarding + persistent toggle: Gamified vs. Classical, drives UiModeContext
│   │   ├── ModeToggle/         # small persistent switch (navbar) so students can flip modes any time
│   │   ├── WelcomeBackBanner/  # "welcome back, {name} — pick up at Week X" shown after a multi-day gap since last visit
│   │   ├── ShareProgress/      # "Share my progress" button: encodes a compact progress summary into a URL, no backend; at 100% completion adds a client-side PDF/PNG certificate download (html-to-image + jsPDF)
│   │   └── DataTransfer/       # "Export my data" (downloads all pda-course:* keys as one JSON file) / "Import my data" (restores from that file) — manual multi-device carry-over, not live sync
│   ├── context/
│   │   └── UiModeContext.tsx   # React context exposing mode: 'gamified' | 'classical' + setter, backed by useLocalStorage
│   ├── hooks/
│   │   ├── useLocalStorage.ts  # small typed wrapper hook around window.localStorage
│   │   ├── useBadges.ts        # badge-earning logic, shared by ProgressCheckbox/WeeklyQuiz/PlacementQuiz
│   │   ├── useQuizScore.ts     # shared scoring logic for WeeklyQuiz and PlacementQuiz
│   │   └── useUnlockCondition.ts  # shared "is this content unlocked yet" check, used by BonusContent and the Data Analysis Hard track gate
│   ├── utils/
│   │   ├── badges.ts           # badge ID definitions + thresholds (single source of truth)
│   │   └── quizScoring.ts      # pure scoring functions; useQuizScore.ts is the thin React-state wrapper around these
│   ├── types/
│   │   └── progress.ts         # shared TypeScript shapes: progress map, badge IDs, quiz results
│   ├── theme/Root.tsx         # swizzled Root to mount the FAB + UiModeContext site-wide
│   └── pages/
│       ├── index.tsx           # landing page: course overview, section/track picker
│       ├── progress.tsx        # student's badge case + overall completion, reads localStorage
│       ├── share.tsx           # read-only rendering of a shared progress link, decodes ?data= from the URL, no localStorage read
│       └── credits.tsx         # dataset/tool attribution: Titanic mirror, Students Performance in Exams, Trinket, JupyterLite, Pyodide
├── docs/
│   ├── python-101/
│   │   ├── index.md            # section overview + learning objectives (both tracks, comparison table)
│   │   ├── normal/            # week-1.md ... week-5.md
│   │   └── hard/               # week-1.md ... week-5.md  (SLM-from-scratch PBL, pure Python, no numpy)
│   ├── data-analysis/
│   │   ├── index.md            # section overview + learning objectives + "Why Pandas?" speed-problem intro
│   │   ├── normal/            # week-6.md ... week-10.md (pandas 101 + Kaggle repro)
│   │   └── hard/                # week-6.md ... week-10.md (EDA PBL), gated by PlacementQuiz
│   └── bonus/
│       └── capstone-ai-agent.md  # course-completion capstone: install Python locally, build an agent with LangChain's deepagents + a free API key
├── static/
│   └── datasets/               # bundled CSVs, served at a stable URL so pd.read_csv('/datasets/x.csv') works from JupyterLite
├── jupyterlite-config/
│   ├── jupyter_lite_config.json  # JupyterLite build config (Notebook app only, not full Lab — see Playground section)
│   └── files/                    # starter .ipynb per Data Analysis week, prepopulated into the JupyterLite build
├── i18n/
│   ├── ar/                     # Arabic (RTL) — UI strings + full lesson content translated (all 20 weeks, both landing pages, capstone)
│   ├── es/                     # Spanish — UI strings now, content translation in progress
│   └── fr/                     # French — UI strings now, content translation in progress
└── .github/workflows/deploy.yml  # build + deploy to GH Pages on push to main
```

## Learning Path Flow

Nobody lands inside a track blind. The click-path is:

1. **Welcome page** (`src/pages/index.tsx`) — what the course is, the two sections, a short "how this site works" (FAB playground, challenges, tracks), and a one-line teaser for the Capstone Bonus ("🎁 Finish the course to unlock a guided walkthrough: install Python for real and build your own AI agent") so the payoff is visible from day one, not just discovered at the end.
2. **Onboarding** (`LearningStylePicker`, shown once on first visit) — a first-name field (optional — used to personalize copy like "Welcome back, Amina!" and badge toasts, falls back to generic phrasing if skipped) plus "How do you like to learn? 🎮 Gamified (badges, quizzes, bonus unlocks, playful UI) or 📄 Classical (clean, minimal, no gamification chrome)." Sets `UiModeContext`, `pda-course:student-name`, and silently generates `pda-course:student-id`. Not a one-time lock-in: a small `ModeToggle` stays in the navbar so the learning-style choice can be flipped at any point mid-course — both modes render off the exact same progress data (see Client-Side Persistence), so switching loses nothing.
3. **Section overview** (`docs/python-101/index.md`, `docs/data-analysis/index.md`) — plain-English learning objectives for that section, then a **side-by-side Normal vs. Hard comparison** (what you'll build, prerequisite knowledge, time commitment) via `TrackSelector`. On mobile this comparison stacks into two swipeable/stacked cards rather than a side-by-side table.
4. **Track choice**:
   - Python 101: no gate — nobody has prior Python knowledge yet, so Hard is available directly after reading the objectives.
   - Data Analysis: choosing **Hard** first opens `PlacementQuiz` — an 8–10 question self-check on Python 101 fundamentals (variables, loops, dicts/lists, functions, reading a CSV). It's a **soft gate**: instant client-side scoring, no backend to enforce anything, so a low score shows a friendly "you may want to revisit Python 101 Normal weeks 2–5 first" nudge with links, but a "continue anyway" button always proceeds. Result is stored in `localStorage` so it isn't re-asked every visit (with a visible "retake quiz" link).
5. Into the chosen track's Week 1.
6. **On every return visit**, `WelcomeBackBanner` compares "now" against `pda-course:last-visit`; after a multi-day gap it shows a dismissible "Welcome back, {name} — you left off at Week X" banner linking straight to the next incomplete week. No push notifications, no backend — this is the closest no-infrastructure equivalent to a Duolingo-style nudge, triggered on the next visit rather than while the student is away.

## Playground (FAB) — dual, section-aware

- `src/components/PlaygroundFab`: a fixed-position, thumb-reachable button (bottom-right, all pages) that opens the playground. **On mobile it opens full-screen** (not a small modal — neither a code editor nor a notebook UI is usable in a tiny modal on a phone); on desktop it's a docked drawer/modal.
- **Which tool it opens depends on where the student is:**
  - On any **Python 101** page → a Trinket.io iframe (`https://trinket.io/embed/python3/...`), a simple no-login scratch REPL.
  - On any **Data Analysis** page → the self-hosted **JupyterLite** instance, deep-linked to that week's starter notebook (`/lite/notebooks/?path=week-6.ipynb`) when opened from a specific week, or a blank scratch notebook from the generic FAB on the section landing page.
  - Detected via the current doc's frontmatter/route (`section: python-101 | data-analysis`), not guessed from the URL string.
- **JupyterLite uses its "Notebook" app, not the full "Lab" app** — Lab's multi-panel layout (file browser + tabs + sidebars) doesn't work on a phone; the single-document Notebook view does, which also keeps this consistent with the mobile-first requirement.
- Mounted globally via a swizzled `src/theme/Root.tsx` so it appears on every doc page and the landing page.
- Individual Python 101 lesson pages additionally embed **inline** Trinket iframes next to code examples/challenges where students should run that specific snippet. Data Analysis lesson pages link/deep-link into the relevant cell of that week's JupyterLite notebook instead of embedding a separate inline iframe per snippet (a notebook is the unit of interaction there, not a single snippet). All embeds are sized responsively so they don't overflow on narrow screens.
- **First-load weight is a real risk on mobile data**: Pyodide plus pandas/numpy/matplotlib wheels are tens of MB. The FAB shows an explicit loading state ("Loading the notebook environment — first load can take a moment, faster on Wi-Fi") rather than a blank iframe that looks frozen; the browser caches it after the first visit so this cost is paid once per device, not once per page.
- **Iframes are mounted lazily, not eagerly**: neither the Trinket nor the JupyterLite iframe gets an `src` (or gets rendered at all) until the student actually opens the FAB or an inline embed — a student who never opens the playground on a given page pays zero extra network/JS cost for it, which matters a lot on mobile data.

## Client-Side Persistence (localStorage)

No backend/login exists, so all per-student state lives in the browser via a single small `useLocalStorage` hook (JSON-serialized, namespaced under a `pda-course:` prefix so it doesn't collide with anything else on the domain). **Every key below stores plain facts, not presentation** (a completed week, a quiz score, a revealed answer) — `UiModeContext` is the only thing that decides whether `BadgeCase` renders those facts as badges-and-confetti or `ModeToggle`'s classical sibling renders them as a plain checklist. This is what makes switching Gamified↔Classical lossless: there's one data model underneath, not two. Concerns, each with its own key so they can be cleared/reset independently:

- **UI mode** (`pda-course:ui-mode`): `"gamified" | "classical"`, written by `LearningStylePicker`/`ModeToggle`, read by every component that has a gamified vs. classical presentation.

- **Progress tracking** (`pda-course:progress`): a map of `weekId -> completed boolean`, written by a `ProgressCheckbox` on each week page. The section landing pages read this to render a progress bar/checklist across the 5 weeks.
- **Challenge answers revealed** (`pda-course:revealed`): a map of `challengeId -> boolean`, written by the `Challenge` component so a previously-revealed answer stays expanded on return visits instead of re-hiding.
- **Playground scratch code** (`pda-course:playground-code`): the FAB's own textarea/state (for any parts of the playground UI we control directly, e.g. a "notes/scratch" pane next to the Trinket embed) persists across reloads. Code typed *inside* the embedded Trinket iframe itself is sandboxed and outside our control — Trinket has its own save/fork mechanism. JupyterLite needs nothing from us here: it persists notebook edits itself via its own browser storage (IndexedDB) automatically.
- **Track selection** (`pda-course:track`): `"normal" | "hard"` per section, written by `TrackSelector`. Section landing pages and the sidebar default to the student's last-chosen track (with an obvious way to switch).
- **Placement quiz result** (`pda-course:quiz-data-analysis`): score + pass/fail + timestamp from `PlacementQuiz`, so returning students who already took it aren't asked again (a "retake" link resets just this key).
- **Weekly quiz results** (`pda-course:weekly-quiz`): a map of `weekId -> {score, passed}`, written by `WeeklyQuiz`. `BonusContent` on that week's page reads this to decide whether to render unlocked or show a "🔒 pass this week's quiz to unlock" teaser.
- **Badges** (`pda-course:badges`): a set of earned badge IDs (e.g. `week-1-complete`, `week-1-quiz-ace`, `python101-hard-graduate`, `bonus-try-except-unlocked`, `course-graduate` for finishing all 10 weeks and unlocking the Capstone Bonus), written whenever `ProgressCheckbox`/`WeeklyQuiz`/`PlacementQuiz` cross a threshold. `BadgeCase` (and the `progress.tsx` page) render these; a small toast fires the moment a new one is earned.
- **Student name** (`pda-course:student-name`): optional first name captured at onboarding, used to personalize copy ("Welcome back, {name}!"). Never required — components fall back to generic phrasing ("Welcome back!") if empty.
- **Last visit** (`pda-course:last-visit`): a timestamp updated on every page load, read by `WelcomeBackBanner` to decide whether to show a "pick up where you left off" nudge.
- **Student ID** (`pda-course:student-id`): a random, short, easy-to-read-aloud ID (e.g. 8 alphanumeric characters) generated once at onboarding — the thing an instructor can ask a student to state for a quick spot-check against what the certificate/QR code shows (see Capstone/Sharing Progress).

All of this is best-effort, client-only, and per-browser. There's no live cross-device sync (that would need an account/backend), but `DataTransfer` gives students a manual way to move between devices: **Export** bundles every `pda-course:*` key into one downloadable JSON file; **Import** (on another device/browser) reads that file back in and reloads, so opening the course on a laptop after starting on a phone doesn't mean losing progress — the student just has to remember to export/carry the file themselves, since nothing here is automatic. Import validates the file only contains recognized `pda-course:*` keys before writing, and warns that it overwrites whatever's already on that device. A visible "reset my progress" control (same settings area as `DataTransfer`) clears the namespaced keys.

## Content Style Guide

The audience is **university math/data-analysis students** on their **phones**, who may disengage fast if content reads like a dry manual. So, across every page:

- **Plain, academic English** — short sentences, define jargon the first time it's used, no filler.
- **Emojis used purposefully** as visual signposts (e.g. 🎯 for objectives, ⚠️ for common pitfalls, 🧩 for challenges, 🤔 for socratic questions) — not decoration on every line.
- **A light meme/motivational beat per week** — one relatable image/reference or a wry one-liner at the top of each week, kept tasteful and not distracting from the material.
- **Math as the primary teaching tool, especially in Weeks 1–5**, since these students already think in this language: introduce a `for` loop via summation notation (∑) before syntax, frame a function as `f(x)` before `def`, frame filtering a list as set-builder notation before a list comprehension, frame the SLM's word-sampling step (Hard track Week 4) as a discrete probability distribution before `random.choices`. Data Analysis weeks lean on this too: groupby↔partitioning a set, correlation↔the statistics they already know.

## Visual Design & UX

Not a stock docs-theme reskin — the UI needs to feel built for this audience, and explicitly **not generic or default-looking**:

- **A real design pass before component-by-component styling**: pick a distinct color palette, type scale, and badge/icon treatment *up front* (one small design/tokens issue, before the individual component PRs), so the site reads as one coherent system rather than default Docusaurus Infima blue with ad hoc tweaks bolted on per-component later. Badges in particular get an actual designed frame/shape/color around the emoji, not a bare emoji floating with no styling.
- **Math rendering:** wire up `remark-math` + `rehype-katex` (KaTeX) in `docusaurus.config.js` so the math-first framing from the style guide (∑, `f(x)`, set-builder notation, probability notation) renders properly instead of as raw LaTeX text.
- **Theme:** dark mode as a first-class, likely-default option (Docusaurus ships this — just tune the palette so it doesn't look like the unmodified default), a palette and typography with real personality rather than default Docusaurus blue/Infima defaults, generous touch targets (≥44px) and spacing tuned for thumbs, not mouse pointers.
- **Gamification visuals:** badges, progress bars, and the quiz/challenge components use consistent iconography and a bit of motion (unlock toast, checkmark animation on completing a challenge) — small, tasteful, CSS-only, no heavy animation library needed.
- **Navigation built for a phone sidebar:** Docusaurus's mobile sidebar (hamburger drawer) is the baseline; keep the 2-section × 2-track × 5-week tree shallow enough that it doesn't require excessive scrolling/nesting on a small screen.
- Chart-heavy pages (Data Analysis Hard track EDA visualizations) should follow the repo's `dataviz` skill guidance at build time for consistent, accessible chart styling in both light and dark mode.
- **Accessibility on custom components isn't optional** since they carry real course function, not decoration: `PlaygroundFab` and its full-screen mobile view are keyboard-operable and properly labeled (`aria-label`, focus trap while open, `Esc` to close); `Challenge`'s answer-reveal and `WeeklyQuiz`'s question controls are real buttons/inputs (not click-only `div`s) so they work with a keyboard or screen reader; color contrast is checked in both themes, not just eyeballed in light mode.
- **Site search**: Docusaurus's local search plugin (`@easyops-cn/docusaurus-search-local`) — no external account/service needed (keeps the no-login, self-hosted ethos consistent), works offline once loaded, and indexes all locales.
- **Meme/illustration images are compressed and served in a modern format** (WebP, with sizing appropriate to a phone viewport) and lazy-loaded below the fold — the weekly "light meme beat" from the Content Style Guide shouldn't quietly become a mobile-data tax.
- **A mobile Lighthouse pass is part of Verification, not just eyeballing devtools** — see Verification below for the concrete target.

## Internationalization (i18n)

Uses Docusaurus's **built-in i18n system** (no separate library needed/added — this *is* the standard i18n approach for a Docusaurus site, config-driven, not a bolt-on):

- `docusaurus.config.js` declares `i18n: { defaultLocale: 'en', locales: ['en', 'ar', 'es', 'fr'] }`; Arabic gets `direction: 'rtl'`, which flips Docusaurus's built-in layout (sidebar, nav, breadcrumbs) automatically. Our custom components (FAB, badges, quiz UI) get spot-checked in RTL since fixed-position elements like the FAB don't auto-flip.
- All UI strings in custom components (`PlaygroundFab`, `Challenge`, `WeeklyQuiz`, `PlacementQuiz`, `BadgeCase`, `TrackSelector`, `BonusContent`) use `@docusaurus/Translate`'s `<Translate>`/`translate()` API instead of hardcoded English, with translations supplied per-locale in `i18n/<locale>/code.json`.
- **Content translation scope, revised:** writing full lesson content for all 10 weeks × 2 tracks was the agreed scope for English at launch. Full translation into Arabic, Spanish, and French was deliberately deferred to a follow-up pass, one locale at a time, rather than done all at once. Arabic went first (chosen since it also exercises RTL layout) and is now fully translated: all 20 weekly lesson pages, both section landing pages (`docs/python-101/index.mdx`, `docs/data-analysis/index.mdx`), and the capstone bonus page, each shipped in small batches via the standard issue → branch → PR → auto-merge flow (`type:i18n`, `area:*` labels). Spanish and French are being translated next, following the same per-batch workflow and the same conventions established for Arabic: `weekId`/`Challenge id` values stay byte-identical across locales (they back shared `localStorage` progress keys), code/identifiers/type names stay in Latin script, and math-block labels needing special glyph handling are evaluated per locale (Arabic's KaTeX limitation doesn't apply to Spanish/French, which use Latin script).
- **This is intentional, not broken:** Docusaurus automatically falls back to the default-locale (English) copy of any doc page that has no translated version yet, so browsing the site in `/es/` or `/fr/` currently shows English lesson content mixed with translated UI chrome until their content translation passes land (already true; `/ar/` no longer falls back, since its content is fully translated) — worth knowing up front so it doesn't get mistaken for a bug during review. Content translation work follows the same per-week issue → branch → PR flow as everything else (`type:i18n`, `area:*`).

## Content Pattern (every week, every track)

Each `week-N.md` follows the same skeleton:
1. **🎯 Learning objectives** — 2–3 bullet statements of what you'll be able to do by the end
2. **Lesson** — concept explanation (math-first where it fits) + runnable inline Trinket examples
3. **🧩 Challenges** — 3–5 coding tasks of increasing difficulty, each answer hidden in a collapsible `<details>`/admonition block so students can self-check without seeing it prematurely
4. **🤔 Socratic Questions** — 2–4 open-ended questions with no provided answer, designed to make students reason about *why* (e.g., "What would happen if you used `>` instead of `>=` here? Try it and explain the boundary case.")
5. **✅ Weekly quiz** — 3–5 short auto-graded questions on that week's material via `WeeklyQuiz`; completing the week awards a completion badge, and passing the quiz (e.g. ≥80%) unlocks that week's `BonusContent` block

## Gamification: Badges & Bonus Content (mode-aware)

- **Badges** mark concrete milestones: finishing a week, passing a week's quiz, finishing a track, passing the Data Analysis placement quiz. In **Gamified** mode these render as simple emoji/CSS-based icons (no custom illustration work needed) in `BadgeCase`, with a small celebratory toast the moment one is earned and a `progress.tsx` page as the permanent "trophy case." In **Classical** mode the exact same milestone facts render as a plain progress list/percentage — no icons, no toast, no confetti — because the underlying data (`pda-course:badges`) is written identically regardless of mode; only `BadgeCase`'s render branch differs.
- **Bonus content** is real course material that's intentionally *outside* the core "no classes" curriculum, offered as an optional deeper track for students who pass a week's quiz — not busywork:
  - **Python 101** bonus: `try`/`except` error handling (unlocked by passing the Week 4 or 5 quiz) and an intro to `class`es/OOP (unlocked by passing the Week 5 quiz) — both explicitly excluded from the core lessons per the course design, but available as a taste of "what's next" for students who want to go further.
  - **Data Analysis** bonus: a short extension for each unlocked week (e.g. method chaining, `pivot_table`, an extra seaborn plot type) for students who clear that week's quiz.
- Bonus content is a soft unlock (rendered as a locked teaser in Gamified mode, or a plain "available once you pass this week's quiz" note in Classical mode) — same reasoning as the placement quiz: no backend to truly gate it, so the "lock" is motivational framing, not access control, and it's identical framing intensity-wise either way (just louder in Gamified mode).
- Decorative/motivational elements only — signpost emoji (🎯🧩🤔), meme beats, unlock toasts, confetti — are wrapped so `ModeToggle`'s classical setting can hide them via a body-level `data-ui-mode` attribute (e.g. `body[data-ui-mode="classical"] .gamified-flourish { display: none }`), so lesson markdown doesn't need two copies of every heading — just one small CSS-hookable span per flourish.

## Sharing Progress (no backend, Duolingo-style)

`ShareProgress` (on `progress.tsx`) lets a student generate a read-only link to send over WhatsApp/social media, without any server-side storage of student data:

- It compresses a small summary — name (if given), weeks completed, track(s) chosen, badge count — into a URL-safe encoded string appended as a query param, e.g. `https://.../share?data=<encoded>`.
- `share.tsx` decodes that param **client-side, in the visitor's browser** and renders a read-only summary card — it never reads the visitor's own `localStorage`, so it's safe to open on any device, including one that never touched the course.
- At full completion (all 10 weeks of a section, or the whole course), the same card renders in a "🎓 completed" variant with a **"Download certificate" button**: `html-to-image` renders the styled certificate card to a PNG, and `jsPDF` wraps that image into a downloadable PDF — both run entirely client-side in the browser, no backend, consistent with everything else here (unlike hosted certificate services like Accredible/Badgr, which need accounts/a server).
- The certificate includes a **QR code** (generated client-side via the `qrcode` npm package, no backend) encoding the student's ID (`pda-course:student-id`), name, and completion summary. **This is a convenience/spot-check tool, not a verifiable credential**: since the whole site is static with no server-side secret, nothing stops a determined student from editing their own `localStorage` before generating one — the QR just makes it fast to scan a certificate and cross-check the decoded ID against what the student states out loud, catching casual copy-paste fakes, not sophisticated ones. This tradeoff (vs. real cryptographic signing, which would need a small server component) was discussed and this lighter approach was chosen deliberately.
- **`html-to-image`, `jsPDF`, and `qrcode` are dynamically imported (`import()`) inside `ShareProgress`, not bundled into the site's main JS**: almost nobody hits the certificate flow on a first page load, so shipping those libraries to every mobile visitor up front would be pure waste — they load only when a student who's actually completed the course clicks "Download certificate."
- **Honest limitation:** WhatsApp/Twitter/etc. link-preview thumbnails are generated by crawling static Open Graph tags, which can't be personalized per-share without a server rendering a unique image per link (that's how Duolingo does it, via its backend). This plan's version will unfurl with one shared, generic course preview image — the personalized card only shows once the link is actually opened. Flagging this now so the "like Duolingo" comparison doesn't overpromise a technical detail this static-site architecture can't cheaply replicate.

## Capstone Bonus: "Graduate to Real Python + Build an AI Agent"

The one big reward at the very end of the whole course — deliberately teased on the welcome page's learning-objectives summary from the first visit, not a surprise:

- **Unlock condition:** finishing both sections (all 10 weeks, either track) — this is course-level completion, not a single week's quiz, so it's checked against `pda-course:progress` rather than `pda-course:weekly-quiz`. Earning it awards a `course-graduate` badge and surfaces the capstone link prominently on `progress.tsx` (and in the welcome page teaser for anyone who hasn't reached it yet).
- **What it covers**, in `docs/bonus/capstone-ai-agent.md`:
  1. Installing Python locally for real (a short, OS-by-OS guide — python.org installer, verifying `python --version`/`pip`) — the natural "graduation" off the in-browser Trinket/JupyterLite playgrounds the rest of the course relies on.
  2. Getting a **free-tier AI API key** from whichever provider the student prefers (GitHub Models is the suggested default; Gemini, Groq, Mistral, Cerebras, and OpenRouter are documented alternatives) and setting it as a local environment variable or `.env` file — never a key embedded in course content or committed to the repo.
  3. Installing and configuring LangChain's **`deepagents`** against that key.
  4. Building and running one small example agent locally, wrapping up the course on "here's where this goes next" rather than ending cold at Week 10.
- **Why it's a good fit here:** it's a genuine motivator (a taste of applied AI work) that only makes sense once someone has finished the fundamentals, and it's a clean place to introduce local installs/environment variables/API keys — topics that would be premature in Weeks 1–10 given the "students can't install Python yet" constraint the whole playground architecture is built around.

## Section 1: Python 101 (Weeks 1–5)

**Normal track** (no classes):
- Week 1: variables, types, operators, input/output
- Week 2: control flow (if/else, loops)
- Week 3: data structures (lists, dicts, tuples, sets)
- Week 4: functions
- Week 5: working with CSV files (`csv` module, read/write) + mini wrap-up project

**Hard track — PBL: "Build a Tiny Language Model from a CSV corpus"** (functional style, no classes, **built-in types only — deliberately no numpy**, so students feel plain-Python's limits firsthand):
- Week 1: recap + loading a small text corpus from CSV
- Week 2: tokenization functions, word-frequency counting with dicts (math framing: frequency table ≈ a discrete distribution)
- Week 3: building bigram probability tables as nested dicts (`dict[str, dict[str, float]]`)
- Week 4: a `generate_text()` function sampling the next word via `random.choices` weighted by those probabilities
- Week 5: assembling the pieces into a simple CLI text generator + a "temperature" tuning knob, then **timing it** on a slightly larger corpus to feel it get sluggish — this timing becomes the hook picked up at the start of Section 2

A small hand-authored sentence corpus (public-domain/original, avoiding copyright issues) ships in `static/datasets/slm-corpus.csv`.

## Section 2: Pandas & Data Analysis (Weeks 6–10)

**Section intro — "Why Pandas? The Speed Problem"** (`docs/data-analysis/index.md`, read by both tracks before Week 6): a short motivating demo — pure-Python word counting over a CSV (the Hard-track SLM students already timed this in Week 5; Normal-track students get a small equivalent snippet inline) run again with numpy/pandas, showing the wall-clock difference. This is the pitch for *why* vectorized tools exist, not a full lesson — it frames everything that follows.

**Normal track** (pandas 101 → reproduce a Kaggle-style notebook):
- Week 6: Series/DataFrame basics, reading CSV
- Week 7: selection, filtering, indexing
- Week 8: cleaning (missing values, dtypes, string ops)
- Week 9: groupby, aggregation, merging
- Week 10: guided end-to-end reproduction of a classic Titanic EDA notebook (loaded via a well-known public raw-CSV URL, e.g. the datasciencedojo Titanic mirror commonly used in tutorials)

**Hard track — PBL: full EDA with visualizations:**
- Week 6: EDA framework — framing questions, dataset overview/profiling
- Week 7: univariate analysis + matplotlib/seaborn visualizations
- Week 8: bivariate/multivariate analysis, correlation
- Week 9: advanced/storytelling visualizations
- Week 10: final deliverable — full EDA report on **"Students Performance in Exams"** (scores in math/reading/writing vs. gender, parental education, lunch type, test-prep completion) — one of Kaggle's most-voted beginner EDA datasets, and thematically on-topic for a course about education — loaded via a public raw-CSV URL, with a required set of charts

Every external dataset/tool used (Titanic mirror, the Students Performance in Exams dataset, Trinket, JupyterLite/Pyodide) is credited on the `credits.tsx` page — good academic practice for a course aimed at students who'll be expected to cite sources themselves.

## Plan Copy in Repo

Once approved, the first commit copies this plan file into the project itself at `python-data-analysis-course/PLAN.md` (source of truth for the course design going forward, alongside the code) — not written yet since plan mode only allows edits to the plan file at its `~/.claude/plans/` path.

## GH Pages Deployment

- `.github/workflows/deploy.yml`: on push to `main`:
  1. Build JupyterLite first — `pip install jupyterlite-core jupyterlite-pyodide-kernel`, then `jupyter lite build --config jupyterlite-config/jupyter_lite_config.json --output-dir build/lite` (needs a Python setup step in CI in addition to Node). **Cache the pip/Pyodide wheel downloads** (`actions/cache`) — pandas/numpy/matplotlib wheels are large and re-downloading them on every single-PR build (of which there will be many, per the Development Workflow) would make CI slow and eat Actions minutes for no reason.
  2. `npm ci && npm run build` for the Docusaurus site, copying/merging the JupyterLite build output into the Docusaurus `build/lite/` subpath so both are served from the same GH Pages deployment.
  3. Deploy the combined `build/` via `actions/deploy-pages` (or `docusaurus deploy` using `GIT_USER`/deploy keys, whichever is simpler once the GitHub repo/org name is known).
- `docusaurus.config.js`: `projectName: 'python-data-analysis-course'`, `organizationName` set to whichever account `gh repo create` ends up under.
- **Custom domain:** the site is served from `https://www.pyda-course.online/` rather than the default `abderrahim-lectures.github.io/python-data-analysis-course/` project-page URL, via a `static/CNAME` file (containing `www.pyda-course.online`, copied into the build output and picked up by `actions/deploy-pages`) plus DNS pointed at GitHub Pages and the custom domain configured in the repo's Settings → Pages (both one-time, outside-the-repo steps). Because of this, `baseUrl` is `/` (root), not a `/python-data-analysis-course/` subpath — that subpath convention only applies to the default project-page URL.
- **Known GH Pages footguns to get right up front**, since they're easy to miss until something 404s in production: for a project page *without* a custom domain, `baseUrl` must match the repo name exactly (`/python-data-analysis-course/`, not `/`) — with a custom domain and `baseUrl: '/'` as configured here, this doesn't apply, but it's worth knowing if the custom domain is ever removed. `trailingSlash` needs an explicit, consistent value (`false` is the common safe choice) — GH Pages' static-file serving behaves differently from `docusaurus start`'s dev server here, so this only actually gets exercised by the deployed site, not local `npm run serve`.

## SEO

A bundle of standard, static-site-appropriate SEO practices, all shipped:
- `static/robots.txt`: allows all crawlers, points at the sitemap, disallows `/share` (per-student, query-string-driven content with no canonical value of its own — also marked `noindex, nofollow` on the page itself and excluded from the sitemap).
- Sitemap plugin config (in the `classic` preset's `sitemap` options): excludes `/share`, sets `changefreq`/`priority`. Docusaurus generates `sitemap.xml` automatically from the doc/page tree, no separate plugin needed.
- Explicit `description` frontmatter on every doc page (all 20 weekly lessons, both section landing pages, the capstone page) in every locale, rather than relying solely on Docusaurus's auto-derived description from body text.
- `themeConfig.image` (`img/social-card.jpg`, used for `og:image`/Twitter cards) — generated once as a real asset; this had silently pointed at a nonexistent file before the SEO pass, so `og:image` was broken on every page until fixed.
- Site-wide `Course` JSON-LD structured data (via top-level `headTags`) and global `keywords` metadata.
- Canonical URLs, `hreflang` alternates across the 4 locales, and per-locale `<html lang>`/`dir` are all handled automatically by Docusaurus's i18n system — no custom code needed.
- All of the above (sitemap URLs, canonical links, `og:url`, `og:image`) automatically track whatever `url`/`baseUrl` is configured, so they update correctly with the custom domain described above.

## Automated Smoke Tests

Given the Development Workflow above means many small, independent PRs over time, a handful of Playwright smoke tests (run in CI on every PR, alongside `npm run build`) catch regressions in the riskiest custom logic cheaply — this is deliberately a *small* suite, not full coverage:
- `localStorage` round-trip: progress/badges/quiz-result/ui-mode survive a reload.
- `UiModeContext` toggle actually changes rendering (gamified flourishes present/absent).
- `PlacementQuiz` gate: choosing Hard on Data Analysis shows the quiz; "continue anyway" reaches Week 6.
- `PlaygroundFab` opens the correct tool (Trinket vs. JupyterLite) depending on section.

## Verification

- `npm run build` succeeds with no broken links (Docusaurus's built-in broken-link checker).
- **The actual deployed GH Pages URL loads correctly** (not just local `npm run serve`) — this is the real test of `baseUrl`/`trailingSlash` correctness, since GH Pages' static-file serving can behave differently from the local dev server.
- `npm run serve` locally; click through every week page in both tracks/sections to confirm nav, challenge answer-reveal, and socratic question rendering.
- Manually click the FAB on a Python 101 page to confirm the Trinket iframe loads and a sample snippet runs inside it.
- Manually click the FAB on a Data Analysis week page to confirm it opens JupyterLite's Notebook app (not Lab), deep-linked to that week's starter notebook, and that a `pandas`/`pd.read_csv(...)` cell against a bundled dataset actually executes and returns a DataFrame.
- Spot-check inline per-lesson Trinket embeds on at least one Python 101 page per track.
- Confirm localStorage persistence: mark a week complete, reveal a challenge answer, pick a track, take the quiz, reload the page, and verify all states survive; then use the reset control and confirm the namespaced keys clear.
- Walk the full flow end-to-end: welcome page → section objectives → choose Hard on Data Analysis → confirm `PlacementQuiz` appears and both a high score and "continue anyway" on a low score correctly proceed into Week 6.
- Complete a week's `WeeklyQuiz` with a passing score and confirm: a badge toast fires, the badge appears on `progress.tsx`, and that week's `BonusContent` (try/except or classes teaser) switches from locked to unlocked and stays unlocked on reload.
- Earn progress/badges in Gamified mode, flip `ModeToggle` to Classical, and confirm the same completions/quiz results still show (as plain text/checklist, no badges/toasts) with nothing lost; flip back to Gamified and confirm the badges reappear exactly as before.
- Test primarily at a phone viewport (e.g. 375px wide) in browser devtools: FAB reachability, full-screen Trinket and full-screen JupyterLite Notebook both usable one-handed (this is the highest-risk mobile item — JupyterLite's Notebook app must be confirmed genuinely workable at phone width, not just "technically renders"), stacked track-comparison cards, quiz and challenge components usable one-handed, inline Trinket embeds not overflowing horizontally. Then confirm desktop still looks intentional, not just "stretched mobile."
- Run a mobile Lighthouse pass on a representative lesson page (not one with the FAB open) and confirm the performance score reflects lazy-loaded iframes and dynamically-imported certificate libraries actually working — a low score here likely means something is loading eagerly that shouldn't be.
- Switch the locale to Arabic and confirm the layout mirrors correctly (RTL) including the FAB, sidebar, and badge/quiz components; switch to Spanish/French and confirm the UI chrome (buttons, quiz prompts, badge labels) is translated even where lesson content itself is still English-only.
- Enter a name at onboarding and confirm it's used in personalized copy (badge toast, welcome-back banner); skip the name field on a fresh profile and confirm everything still reads naturally with generic phrasing.
- Manually backdate `pda-course:last-visit` (devtools) to simulate a multi-day gap, reload, and confirm `WelcomeBackBanner` appears and links to the correct next-incomplete week; dismiss it and confirm it doesn't reappear the same day.
- Generate a `ShareProgress` link, open it in a fresh incognito/private window (no localStorage from the original session) and confirm the read-only summary renders correctly purely from the URL — then complete a full track and confirm the link's "🎓 completed" variant renders instead, including a working "Download certificate" PNG/PDF export.
- Scan the certificate's QR code with a phone and confirm it decodes to the expected student ID/name/completion summary; edit `pda-course:progress` directly in devtools to fake completion and confirm (for your own awareness, not as a "bug") that the certificate/QR still generates — this is the expected, documented limitation of the lightweight verification approach, not something to try to "fix" without adding a backend.
- Mark all 10 weeks complete across both sections and confirm the `course-graduate` badge fires and the Capstone Bonus page becomes reachable/highlighted from `progress.tsx`; confirm the welcome-page teaser for it is visible even to a brand-new profile that hasn't completed anything yet.
- Build up some progress/badges, use `DataTransfer`'s Export to download the JSON file, clear all `pda-course:*` localStorage (simulating a second device), Import that file, and confirm every piece of state (progress, badges, name, track, ui-mode, quiz results) comes back identical; also confirm importing a malformed/unrelated JSON file is rejected with a clear error rather than silently corrupting localStorage.

## Deliberately deferred (flagged, not built in this pass)
- **Real push notifications while away from the site** (Duolingo-style) — would need a minimal server component (scheduled job + Web Push/VAPID) that this plan's fully-static architecture deliberately doesn't include; `WelcomeBackBanner`'s on-visit nudge is the chosen no-infrastructure alternative.
- **Docusaurus versioned docs** if the course gets re-run for a future cohort and old content needs to stay addressable — not needed for a first run.
