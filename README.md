# Python & Data Analysis Course

[![Deploy to GitHub Pages](https://github.com/abderrahim-lectures/python-data-analysis-course/actions/workflows/deploy.yml/badge.svg)](https://github.com/abderrahim-lectures/python-data-analysis-course/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](./LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/content-CC--BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Live site](https://img.shields.io/badge/live-pyda--course.online-5b3df5)](https://pyda-course.online/)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

A free, browser-based Python and data analysis course — no installs required until you're ready to graduate to the real thing.

**🌐 [pyda-course.online](https://pyda-course.online/)**

- **Section 1: Python 101** (5 weeks) — fundamentals, with a Normal track and a Hard track (build a tiny language model from scratch, pure Python, deliberately no numpy).
- **Section 2: Pandas & Data Analysis** (5 weeks) — pandas basics reproducing a Kaggle-style notebook, with a Hard track doing a full exploratory data analysis project with visualizations.
- **Section 3: Statistics 101** (19 lessons) — vocabulary and measurement scales first, then descriptive statistics (mean, median, spread, quartiles, correlation), the normal distribution, standard error and confidence intervals, Simpson's paradox and hypothesis testing; the Hard track adds an exploratory pass, regression, multiple regression and confounding, and resampling. Every notion is taught three ways: the meaning and its added value, a by-hand worked example, then the Python — with GeoGebra links where a geometric picture helps.
- **Real-World Projects** — 136 projects. Install Python locally for real with `uv` and build something the in-browser playground never could: an AI agent with LangChain's `deepagents`, a fine-tuned small LLM with Unsloth, an MCP server, a RAG app, a file-organizer bot. New ones are added whenever a trending tool or framework is worth a hands-on write-up — browsable any time, not gated behind finishing the course.

Everything is searchable and filterable: the 136 projects by tag and difficulty, and all 272 lessons from a search box on the learn hub that matches titles, descriptions, tags and module names in the reader's own language.

Run entirely in the browser: every lesson's code is a runnable cell powered by Pyodide (Python compiled to WebAssembly) — hit ▶ Run and it executes right on the page, no install, no account. A dedicated [playground page](https://pyda-course.online/playground) offers a big scratch editor with a ⛶ "open in full-screen editor" button on every lesson cell. Each lesson also ships a generated `.ipynb` companion (see `notebooks/`) with one-click Colab/Kaggle/Binder/nbviewer/Deepnote badges for anyone who wants a real Jupyter environment, and bundled datasets (CSVs under `public/datasets/`, served via a manifest) are mounted into the in-browser filesystem automatically so `open('students-performance.csv')` just works.

The whole site ships in four languages — English, Arabic (right-to-left), Spanish and French — with translated URL segments, so a lesson lives at `/learn/python-101/normal/lessons/01-printing`, `/ar/تعلم/python-101/عادي/دروس/01-printing`, `/es/aprender/...` and `/fr/apprendre/...`.

See [`plan/`](./plan/README.md) for the full design plan and rationale behind every major decision.

## Screenshots

| Homepage + onboarding | Lesson + playground | Progress & badges | Mobile |
|---|---|---|---|
| ![Homepage with the onboarding card](./static/img/screenshots/homepage.png) | ![Lesson page with runnable cells](./static/img/screenshots/lesson-page.png) | ![Progress page with badges](./static/img/screenshots/progress-page.png) | ![Mobile lesson view](./static/img/screenshots/mobile-lesson.png) |

## Learning objectives

By the end of the course, a student can:

- Write Python programs using variables, control flow, data structures (lists, dicts, tuples, sets), and functions — without relying on classes or external libraries.
- Explain, from first principles, how a simple language model predicts text (tokenization → frequency counts → conditional probability → weighted sampling) by building one from scratch in pure Python (Hard track).
- Load, clean, filter, group, and aggregate real tabular data with pandas, and explain *why* vectorized tools exist by having personally measured pure Python's performance limits first.
- Run a complete, honest exploratory data analysis project — framing questions before charting, visualizing distributions and relationships appropriately, and stating a finding's confidence and caveats rather than overclaiming causation (Hard track).
- Install Python locally, manage a project with `uv`, and build a real project outside the browser playground (Real-World Projects — e.g. a minimal tool-calling AI agent, handling an API key as a secret).
- Describe a dataset honestly: pick the right measure of centre and spread for its shape, read a correlation without reading a cause into it, and say what a sample can and cannot tell you (Statistics 101).

## Pedagogical approach

- **Math-first framing.** The audience is math/data-analysis students, so new concepts are introduced in the notation they already know — a `for` loop via summation notation before syntax, a function as $f(x)$ before `def`, list comprehensions via set-builder notation — before showing the Python code.
- **Build, don't just read.** Both Hard tracks are project-based: a tiny language model built from nothing but the standard library, and a full EDA report on a real-shaped dataset. Struggling with plain Python's speed limits in Week 5 of Python 101 is the intentional setup for *why* pandas exists in Section 2; the Statistics Hard track then puts those descriptive tools to work on a real analysis, where every claim has to survive its own assumption checks.
- **Challenge + Socratic pattern, every week.** Each lesson pairs 🧩 **Challenges** (a concrete task with a collapsible answer you can self-check) with 🤔 **Socratic Questions** (open-ended, no answer provided — designed to make you reason about edge cases and *why*, not just *how*).
- **Always-on progress, never a wall.** A single gamified layer (XP, levels, streaks, quests, badges, activity log — all in one `localStorage` blob) marks progress as you go, but it never gates access: every lesson, challenge answer, and project is free to read. There is no mode toggle and no hidden unlock; what the progress page shows in your browser is the whole picture. Because that blob is per-browser, the progress page also offers a copyable code to move it to another device or restore it after clearing site data.
- **Honest, not hyped.** The EDA track explicitly teaches correlation-vs-causation and chart-honesty practices (truncated axes, cherry-picked ranges) as core material, not a footnote. With no backend, progress lives in your own browser and there is no certificate — the shareable unit is the content itself (permanent URLs, notebook badges), not a per-student snapshot.
- **Zero-install first, real install as a reward.** Every core week runs in-browser via Pyodide (Python compiled to WebAssembly). Installing Python for real is saved for the real-world projects, once fundamentals are solid enough to make that step feel like graduation rather than a chore.

## Architecture

An interactive runtime architecture diagram is in [architecture.html](https://pyda-course.online/architecture.html) (source: `public/architecture.html`) — open it locally in a browser. It shows the three paths that matter: the static Astro build, the browser-side Python runtime (a shared Pyodide Web Worker, terminated by the Stop control, with the `js`-bridge guard), and the Supabase telemetry path (anonymous session reuse, then page views).

That file is generated, not hand-written: it is an [Archify](https://github.com/tt-a1i/archify) diagram pinned to a commit, and it carries source evidence for each node. Regenerate it with the archify skill (`node .claude/skills/archify/bin/archify.mjs finalize architecture <candidate> public/architecture.html --repo-root . --quality showcase`); `skills-lock.json` records the version the current file was built with. The skill itself is gitignored — reinstall it with `npx skills add https://archify.si --skill archify --agent claude-code --copy`. `scripts/inject-csp.mjs` gives the generated page the same hash-based CSP every Astro page already has.

## Development

Requires **Node >= 22.23.4** (Astro's own floor; `package.json#engines` records it and `.nvmrc` pins it). `npm run dev`/`build` run `scripts/check-node.mjs` first, so a machine that is too old gets the version, the floor and the fix rather than an error about Astro.

```bash
npm install
npm run dev       # local dev server
npm run build     # production build (astro build → inject-csp → harden-csp)
npm run preview   # preview the production build
npm run check     # astro check — reserves a fresh content cache first
npm run typecheck # tsc --noEmit
npm run test          # unit tests (vitest, tests/unit)

# The browser suites need a server. Against a preview build:
npx astro preview --port 4321 &
BASE_URL=http://127.0.0.1:4321 CHROME_BIN=google-chrome node tests/e2e/smoke.mjs
npm run test:e2e        # same thing via the package script
npm run test:a11y       # headings, landmarks, names, focus rings
npm run test:contrast   # WCAG AA ratios, light and dark
npm run test:responsive # horizontal overflow at 320-1440px
npm run test:hreflang   # every alternate link resolves (pure HTTP, no Chrome)
npm run test:lesson     # a real Pyodide run awards XP
```

**CI runs all of it.** `.github/workflows/deploy.yml` builds, typechecks, runs the unit
suite, then serves `dist/` and runs every browser suite before the deploy step. Two
passes in `npm run build` are easy to miss: `scripts/inject-csp.mjs` gives a base policy
to any page that ships without one (the generated `architecture.html`), and
`scripts/harden-csp.mjs` replaces `'unsafe-inline'` with the per-page script hashes
unioned across the whole site, so a soft navigation cannot land on a page whose scripts
the entry page's policy did not cover.

Every lesson's runnable cells execute in-browser via Pyodide, vendored under `public/pyodide/` by `scripts/vendor-pyodide.mjs` during `npm run build` and served from the site's own origin (no runtime CDN). It loads lazily on a cell's first Run click and runs in a Web Worker, so a slow cell can't freeze the page; a cell that calls `input()` first shows one labelled field per call above its output and replays the values through Pyodide's synchronous stdin callback (see `src/lib/pythonInputs.ts` for why they are collected before the run). Lesson notebooks under `notebooks/` are generated by `scripts/generate-notebooks.mjs` and committed; translated lessons keep their own notebooks at `notebooks/<ar|es|fr>/<section>/<track>-<slug>.ipynb` (also committed), and each locale's lesson page links only to its own notebook. `public/datasets/index.json` is the manifest that maps the dataset names lessons reference to the CSV files bundled under `public/datasets/`.

### Internationalization

The site's UI is bilingual-to-quadrilingual: page chrome (nav, home, learn hub, credits, cheatsheets, lesson completion labels…) is translated through [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) into en/ar/es/fr. Source strings live in `messages/{en,ar,es,fr}.json`; generated code lands in `src/paraglide/` (gitignored) and is produced by `npx paraglide-js compile` (run automatically by `astro build`/`astro dev`). `tests/unit/i18n.test.ts` enforces per-locale key parity, non-empty values, and that non-English locales are genuinely translated.

Content coverage: project write-ups, lesson/module body content (68 lessons + 29 modules), and the cheatsheet reference cards are fully translated into ar/es/fr. Locale routing lives in `src/lib/routeSegments.ts`; see `plan/i18n-migration.md` for the design.

### Building from a clean checkout

`npm run build`/`npm run dev` run the `prebuild`/`predev` hooks first, in order: `scripts/reset-astro-cache.cjs` (clears the stale content-collection cache that can silently omit recent edits), `scripts/apply-lix-patch.cjs`, and `scripts/generate-project-slugs.cjs`. The lix patch guarded a known upstream defect: on a fresh project the inlang compiler wrote ~500 entities in one database transaction and the commit failed (lix issue #422). Current dependencies (`@inlang/sdk@4.1.0` via `@lix-js/sdk@0.20.1`) already split that import into chunked commits, so the script is a no-op on them; it still patches older SDKs. If a future SDK changes shape without carrying the chunking, the build fails loudly instead of producing a half-written project — port the patch to the new layout rather than deleting the guard.

### Codespaces

The badge above opens a ready-to-go [GitHub Codespace](https://github.com/features/codespaces) (Node + Python + `uv` preinstalled, via [`.devcontainer/devcontainer.json`](./.devcontainer/devcontainer.json)) — no local setup needed to start contributing.

### Real-world project examples

[`examples/ai-agent/`](./examples/ai-agent/) is a real, runnable copy of the agent built in the [Build an AI Agent](https://pyda-course.online/projects/ai-agent/) project — see its own README for how to run it (locally with `uv run python agent.py`, or directly in Codespaces). Each project gets its own `examples/<slug>/` folder.

Most projects also ship a `notebook.ipynb` alongside their example code, with one-click Colab/Kaggle/Binder badges on the project's own page ("Where to run this") — a lower-setup way to try a project before committing to a local `uv` install. Every project now has per-locale notebooks (`notebook.{ar,es,fr}.ipynb`) generated from each locale's markdown; each locale's badge block points at its own localized notebook. The root-level [`requirements.txt`](./requirements.txt) pre-installs the packages these notebooks need so MyBinder launches build a shared, cached environment instead of reinstalling from scratch every time.

[`examples/finetune-llm-unsloth/`](./examples/finetune-llm-unsloth/) is the local companion to the [Fine-tune a Small Language Model](https://pyda-course.online/projects/finetune-llm-unsloth/) project — dataset prep and local inference scripts; the fine-tuning step itself runs on a free Colab/Kaggle GPU notebook, linked from the project.

[`examples/rag-notes/`](./examples/rag-notes/) is the companion to the [Build a RAG App](https://pyda-course.online/projects/rag-notes/) project — local embeddings with `sentence-transformers`, a NumPy similarity search, and a free-tier LLM call for the final answer.

[`examples/mcp-server/`](./examples/mcp-server/) is the companion to the [Build an MCP Server](https://pyda-course.online/projects/mcp-server/) project — a FastMCP server exposing two tools, ready to connect to Claude Desktop or another MCP client.

[`examples/scrape-analyze/`](./examples/scrape-analyze/) is the companion to the [Scrape and Analyze a Website](https://pyda-course.online/projects/scrape-analyze/) project — scrapes a real, scraping-friendly site with `requests`/BeautifulSoup, then cleans and charts the results with pandas/matplotlib. No API key needed.

[`examples/ml-classifier/`](./examples/ml-classifier/) is the companion to the [Train an ML Classifier](https://pyda-course.online/projects/ml-classifier/) project — trains and compares two scikit-learn classifiers on the course's own Titanic dataset.

[`examples/student-projects/`](./examples/student-projects/) is a gallery of real-world projects students have built — its README walks complete git beginners through forking, branching, and opening a PR to add their own.

## Contributing

Every change — a lesson, a component, a bug fix, a translation — goes through the same flow:

1. **Open an issue** describing the change, labeled by type (`type:feature`, `type:bug`, `type:content`, `type:infra`, `type:i18n`) and area (`area:python-101`, `area:data-analysis`, `area:statistics-101`, `area:playground`, `area:gamification`, `area:design`, `area:i18n`).
2. **Branch off `main`** (`issue-<number>-<short-slug>`) and do the work there.
3. **Open a PR** referencing the issue (`Closes #N`). CI (`.github/workflows/deploy.yml`) runs on every push to `main`: install, build, `tsc --noEmit`, the unit suite, then all six browser suites against the built site. Run the same locally before you open the PR:
   ```bash
   npm run typecheck && npm run test && npm run build
   npx astro preview --port 4321 &
   BASE_URL=http://127.0.0.1:4321 npm run test:e2e
   ```
4. Once checks pass, the PR merges into `main` and the deploy workflow publishes the update.

Note that a route which 404s in `npm run dev` while `dist/` contains it means the **dev server's route table is stale**, not that the code is broken — it does not re-read `src/pages/` while running. Restart it (`npx astro dev stop`, then `npm run dev`); `scripts/reset-astro-cache.cjs` clears the *content* cache and does not help with this.

Found a typo or a broken example while going through a lesson? Lesson content lives in `src/content/lessons/` (and `src/content/projects/` for the Real-World Project pages) — the fastest fix is a PR against that file.

**Ways to contribute:**
- **Content**: write or improve a week's lesson, challenges, or socratic questions — see [`plan/content-pattern.md`](./plan/content-pattern.md) and [`plan/content-style-guide.md`](./plan/content-style-guide.md) for the expected structure and tone.
- **A real-world project**: the full walkthrough — which files to add, how to get credited, and the commands to check your work — is on the site at [pyda-course.online/contributors-guide](https://pyda-course.online/contributors-guide/). In short: one markdown file under `src/content/projects/`, an optional `examples/<slug>/` folder, and your entry in `src/lib/contributors.ts`.
- **Translations**: the whole surface — UI chrome plus lesson, module, project, and cheatsheet body content — is translated for Arabic, Spanish, and French. UI strings live in `messages/{en,ar,es,fr}.json` (compiled by [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) into `src/paraglide/`), route segments in `src/lib/routeSegments.ts`, translated project content under `src/content/projects/<locale>/`. Project URLs are localized per locale (e.g. `/es/proyectos/catalogo-de-datos`) — the English slug still resolves as a canonical alias. A `type:i18n` PR fixing or improving an existing translation is welcome.
- **Components/infra**: bug fixes, accessibility improvements, and performance work on the playground, gamification, or sharing features.

Contributors are credited by what they wrote, on the site's [Contributors page](https://pyda-course.online/contributors/) — authorship is declared (`author:` in a project's frontmatter, resolved through `src/lib/contributors.ts`) rather than derived from git, so a student without a GitHub account is credited just as well as one with.

Please don't open a PR without a linked issue first for anything non-trivial — it avoids duplicated or conflicting work.

## License

Code is MIT-licensed (see [`LICENSE`](./LICENSE)); course content is additionally available under CC-BY 4.0 (see [`LICENSE-CONTENT.md`](./LICENSE-CONTENT.md)). Third-party datasets and tools are credited on the site's [Credits page](https://pyda-course.online/credits).

---

Created by [Abderrahim Adrabi](https://github.com/abderrahim-lectures).
