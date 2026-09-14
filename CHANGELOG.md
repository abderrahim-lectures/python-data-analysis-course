# Changelog

All notable changes to this project are documented in this file. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.0.9] — 2026-09-14

### Fixed
- Every XP/progress bar (header gamestrip, homepage hero player-card, /progress player-card, /progress track bars) rendered stuck at 0% width: base rules in `global.css` hardcoded `width: 0` *after* the `.w-pct-N` utility classes in source order, so the hardcoded value always won regardless of the JS-applied percentage. (#305)
- Learner-activity widget ("N learning now") always rendered even at 0 online — `.learner-activity { display: flex }` had no `[hidden]` override, so author CSS beat the browser's default `[hidden]{display:none}`. "Most viewed pages" widget went permanently blank after any soft navigation away from and back to the homepage — its fetch script was an unguarded top-level IIFE with no `astro:page-load` binding. (#306)
- Checklist checkboxes rendered as oversized ~44×44px squares on touch devices — the WCAG touch-target rule applied to every `input`, including checkboxes already wrapped in a tappable label. (#307)
- Notebook-opener chips (Colab/Kaggle/nbviewer/Binder/Deepnote/GitHub) showed their label text top-anchored instead of centered on mobile, a side effect of the same touch-target rule inflating the chip's height with no vertical-centering rule to compensate. (#308)
- Every project step rendered two "Mark complete" buttons instead of one when the project page's first visit in a session happened via a soft navigation — the component-scoped init script's readyState fallback and its `astro:page-load` listener both fired for the same navigation. (#309)
- Checklists in `ai-story-writer.md` and `password-generator.md` (14 checklists total) rendered as plain, non-interactive bullets instead of checkboxes — missing the `✅` prefix the gating script requires; `anomaly-detector.md`'s checklist headings had the same cosmetic gap. (#310)
- `/progress` rendered the same XP bar twice — a redundant standalone `.xpbar-wrap` duplicated the player card's own bar. Removed it and its dead JS/CSS. (#311)
- Project list-view cards misaligned their title/description/tags against the difficulty ribbon on mobile — the body kept the desktop row-layout's `.25rem` inline padding after the mobile media query re-stacked it under the header, which used `1.2rem`. Unified the list-view layout to always stack vertically with consistent padding at every width. (#312)

## [2.0.8] — 2026-09-14

### Fixed
- `pythonGuard.ts` sandbox-escape bypass: `getattr(__builtins__, ...)`, `vars(__builtins__)`, `globals()["__builtins__"]`, and `().__class__.__bases__[0].__subclasses__()`-style dunder introspection were unblocked; now closed as a class (`__import__` stays intentionally allowed).
- CSP `script-src` now fully sha256-hashed at build time instead of `'unsafe-inline'` (postbuild `scripts/harden-csp.mjs`); `style-src` stays `'unsafe-inline'` since KaTeX renders unique per-formula inline styles that can't be hash-allow-listed the same way.
- `upgrade-insecure-requests` only sent in production — it broke every plain-`http://` dev/preview server (`ERR_SSL_PROTOCOL_ERROR` on same-origin subresources).
- The Cache Storage layer meant to survive GitHub Pages' 10-minute `Cache-Control` cap was comparing an absolute URL against a relative prefix and never actually matched, so the ~11MB Pyodide core runtime (wasm, stdlib, lockfile) was never cached — only a 64-byte manifest was.
- The loading overlay and top progress bar stopped showing after any soft navigation: both were `document.createElement()`'d once into a DOMContentLoaded handler that (via Astro's script dedup) only ever ran on the very first hard page load; View Transitions then swapped the node out of the DOM on the next navigation while listeners kept mutating the now-detached element. Made static with `transition:persist` instead.
- `window.__pydaGetAuthToken()` removed from the global scope (was a copyable token getter); replaced with `window.__pydaFetch(url, init)`, which merges auth headers internally.
- `LearnerActivity`'s polling intervals now clear on every `astro:page-load` instead of stacking forever across soft navigations; its Supabase count query uses `Prefer: count=exact` + `Range: 0-0` instead of fetching full rows.
- XP milestone bonuses checked against a live-mutating `s.xp` instead of a before-loop snapshot, letting one milestone's bonus count toward crossing the next threshold in the same pass.
- "See all modules" links on `/learn` 404'd — pointed at a combined-tracks overview page deleted in an earlier redesign; now point at the `normal` track.
- Several sections (`.notfound`, `.head`, `.credits`, `.guide`, `.hero-section`, `.module-head`, the homepage's Most Viewed Pages / learner-activity cards, cheatsheet cards) combined Astro's `.container` utility class with a component padding/border rule on the *same element*; a padding shorthand or an added border on that element silently zeroed or widened past `.container`'s own side padding, so these sections sat flush against the viewport edge instead of inset like every sibling section.
- Decompression-bomb guard in `codeShare.ts` now checks the running byte total mid-stream, not just the final size.
- Runnable-cell and quiz client bundles now lazy-load only on pages that actually have that markup, re-checked on every soft navigation, instead of shipping to every page site-wide.
- Fixed the same "runs once, never rebinds after a soft navigation" class of bug (Astro's script-dedup + View Transitions) in several more places this pass: Google Fonts render-blocking swap, particle DOM leak on level-up, redundant `querySelectorAll` calls in the run-cell handler.
- E2E suite (`tests/e2e/smoke.mjs`) had three stale expectations left over from earlier redesigns/tuning, now corrected to match current, intentional behavior: quiz/lesson XP assertions didn't account for the once-daily +5 login bonus; onboarding assertions (`role="dialog"`, focus-trap, Escape-to-close) predated the switch to a non-blocking `role="status"` corner card.
- `/playground` skipped from `<h1>` straight to the footer's `<h3>`; added a visually-hidden `<h2>` section heading.
- Two WCAG AA contrast failures in light mode only (the "Guided" project badge, the anonymous-analytics footer description) both cleared 4.5:1 in dark mode already.

### Added
- `beforeunload` confirmation once a Python session has actually booted (armed only after a real `Run` click, since a browser reload/close can't be prevented, only warned against).

## [2.0.7] — 2026-09-13

### Added
- Supabase anonymous auth (`src/lib/supabaseAuth.ts`): each visitor signs in once per session; RLS policies on `learners`, `completions`, and `pageviews` are now keyed on `auth.uid()` instead of open `with check (true)` policies, with rate-limit triggers capping writes per user.
- An interactive runtime architecture diagram at `/architecture.html`, linked from the footer ("How this site works").
- View Transitions (`<ClientRouter />`) for true SPA-like soft navigation: one Pyodide Worker per session instead of a fresh engine per page.

### Changed
- Lesson/project XP now splits "run a cell" (5 XP) from "mark complete" (frontmatter `xpReward`, own quest), instead of auto-awarding both on first run.
- CSP tightened: dropped `'unsafe-eval'` from `script-src`.
- Onboarding is a non-blocking dismissible corner card instead of a full-screen modal; the level-up overlay is a legible card instead of oversized borderless text.

### Fixed
- Per-page inline scripts (Mark Complete, quiz, module mastery chips, project checklists, progress page, consent toggle, RTL bidi fix, homepage render) now re-bind on every `astro:page-load`, not just the first page load — Astro's View Transitions router only ever runs an identical inline/module script once per session, so every one of these silently went dead after the first soft navigation.
- Popular-pages widget decodes percent-encoded non-ASCII path segments (e.g. Arabic route slugs) before display instead of showing raw `%D8%..` sequences.
- `pythonGuard.ts`'s exec/eval/compile guard no longer false-positives on `re.compile(...)`.
- Supabase rate-limit trigger's count query, previously a no-op that always evaluated to 0 or 1 regardless of actual row count.
- Assorted lesson-content dataset/cell bugs found via a full run of every lesson's runnable cells across all four locales.

## [2.0.0] — 2026-09-07

Rebuilt the site as a static **Astro** app (replacing Docusaurus/React), reworked the run-code story end to end, and completed the Real-World Projects catalog expansion.

### Added
- Real World Projects rebuilt as an Astro content collection (`src/content/projects/`) with a search + filter + view-toggle index page, per-project difficulty ribbons and tag icons, and category/status filters — current catalog: **137 projects** across five categories.
- Gold-format rewrites of existing projects and 3-locale translations (Arabic/Spanish/French) for project pages.
- A "Related projects" block at the foot of each lesson (`src/components/learn/RelatedProjects.astro` + `src/lib/relatedProjects.ts`, hand-ranked) that suggests 2–3 real-world builds matching the lesson's skill, replacing the removed in-page Practice blocks.
- Generated `.ipynb` notebook companion for every lesson under `notebooks/<section>/<track>/<slug>.ipynb` (49 notebooks, generated by `scripts/generate-notebooks.mjs`, committed), with Colab/Kaggle/nbviewer/Binder/Deepnote/GitHub "open in" badges on each lesson (`src/lib/notebookLinks.ts`).
- A `public/datasets/index.json` manifest mapping the dataset names lessons reference to bundled CSV files; `mountDatasets` in `src/lib/runnable-cell.client.ts` fetches only the CSVs a page's cells reference and mounts them into Pyodide's virtual filesystem under both shipped and referenced names.
- The new-xp-accounting test lifecycle (see tests below).

### Changed
- **Runtime**: the Python playground is now inline Pyodide runnable cells on every lesson (no iframe, no JupyterLite `/lite/` mount). Each cell's code is wrapped so expression results `print()` automatically; beginner-friendly error translation replaces raw tracebacks for common mistakes. The standalone [`/playground`](https://pyda-course.online/playground) page and the 404 page's shared-code fallback share the same `PlaygroundCell` component, and every lesson cell gains a ⛶ "open in full-screen editor" button.
- **i18n**: UI chrome (nav, footer, home, hubs, buttons, XP copy) centrally scoped in `src/lib/pageStrings.ts` per locale, with translated URL segments in `src/lib/routeSegments.ts` (`/ar/تعلم`, `/es/aprender`, `/fr/apprendre`, …) and `hreflang` alternates emitted from `Base.astro`.
- Lesson pages consolidated on a shared `LessonPage.astro` renderer (EN + locale routes are thin wrappers); module-based lesson pages use locale-aware slugs.
- `Mark complete`, "this lesson unlocked", streak/quest/legacy-repair copy, and the XP-ribbon top-nav bar are fully localized in all four locales.
- Lesson cells auto-mount the datasets they reference (see manifest above) instead of requiring a manual upload.

### Removed
- The floating action button (`PlaygroundFab`/`JupyterLiteEmbed`) and everything JupyterLite-related (`/lite/`, `jupyterlite-config` build step, `patch_config_utils.py` language-pack deep-link) — Python execution is inline Pyodide cells now. `jupyterlite-config/` tree and the deploy workflow's JupyterLite build step remain but are no longer referenced by the site.
- React components (Monaco editor, `VsCodePlayground`) not ported to Astro islands.

### Fixed
- `astro check` typecheck at 0 errors (module/test wiring, lesson-slug fallback `?? ''`, content-collection typing); production build is clean (861 pages).
- XP/level/stats in the smoke suite matched to the rebalanced economy (lesson complete 60 XP, milestone 25 XP, quests 32 total) — see tests.
- The topnav XP bar renders with its intended pill + track styling (CSS restored to `global.css`); hero art is cropped at a fixed 2:1 aspect ratio instead of a fixed 140 px height.

### Tests
- `tests/unit` (vitest, 9 files) — manifest mapping, content-config wiring, related-project logic, page-string parity.
- `tests/e2e/smoke.mjs` — headless-Chrome (CDP) smoke suite via `npm run test:e2e`, 40 checks: per-page console/error monitoring, game-state reset, EXACT completeness via the UI, XP/quest tracking, streak, project grid/count consistency, and localize/link round-trips.
- `tests/e2e/contrast.mjs`, `tests/e2e/responsive.mjs`, `tests/e2e/a11y.mjs` — contrast, mobile-viewport, and accessibility smoke checks (`npm run test:contrast`, `test:responsive`, `test:a11y`).

## [1.4.0] — 2026-07-23

### Added
- Full Arabic, Spanish, and French translations of the four Real-World Projects added in 1.3.0 (Build a RAG App, Build an MCP Server, Scrape and Analyze a Website, Train an ML Classifier) — lesson content, category labels, chooser entries, and homepage cards, matching the depth of the existing translated projects.

### Fixed
- Two cross-project links in the RAG project pointed at English heading anchors on the AI Agent project page; in the ar/es/fr translations these now point at that locale's own translated anchor slugs.
- The French translations left "Checklist" section labels untranslated.

## [1.3.1] — 2026-07-23

### Fixed
- Project publish dates were fictional placeholder values, some in the future (e.g. "July 2027" while the site's actual date was 2026-07-23). Replaced with each project's real ship date, taken from git history. Four projects now share the same real date, so `ProjectChooser`'s sort gained a deterministic alphabetical-by-id tiebreak, so the display order is identical everywhere the list renders regardless of the order projects are passed in.
- Each project step's "✅ Checklist" rendered as permanently disabled GFM `- [ ]` checkboxes — impossible to actually check off. Replaced with a new `StepChecklist`/`StepChecklistItem` component: real, clickable checkboxes (session-only, not persisted — this is a "did I do this right" scratch check, not tracked progress).

## [1.3.0] — 2026-07-23

### Added
- Four new Real-World Projects: **Build a RAG App Over Your Own Notes** (local embeddings with `sentence-transformers`, NumPy similarity search, a free-tier LLM for the final answer), **Build an MCP Server** (FastMCP, connects to Claude Desktop), **Scrape and Analyze a Live Website** (`requests`/BeautifulSoup + pandas/matplotlib, no API key needed), and **Train Your First Machine Learning Model** (scikit-learn on the course's own Titanic dataset, the direct sequel to Data Analysis Week 10's EDA). Each ships with a real, runnable `examples/<slug>/` companion, a "Where to run this" section covering local/Codespaces/Colab-Kaggle, and a Checklist + Socratic Question(s) block after every hands-on step, matching the weekly-lesson pattern.
- `ProjectGreeting`: a warm, empathetic, name-personalized greeting at the top of every real-world project page (reads the student's stored name, falls back to "Guest").
- English content only for now — Arabic/Spanish/French translation of these four projects ships as a separate follow-up batch.

### Fixed
- A hydration mismatch on every project page caused by `ProjectGreeting` reading `localStorage` on the very first client render — now gated behind a post-mount check so the first client render always matches the server-rendered fallback.

## [1.2.0] — 2026-07-23

### Added
- **Real-World Projects**: the year-labeled, completion-gated "Capstone Projects" feature is redesigned into an open, ongoing project library — no year in visible titles, no completion gate (browsable/linkable any time), a `tags` field per project (with a `Community` tag ready for future learner-contributed projects via plain PRs), and a new homepage section listing every project. Moved from `/docs/bonus` to `/docs/projects`, with redirects covering the old URLs; existing students' progress/badges keep working since the underlying project ids didn't change.
- New Real-World Project: fine-tune a small open-source language model with LoRA using Unsloth on a free Colab/Kaggle GPU, translated into Arabic, Spanish, and French.
- Completion certificate redesign: PDF export removed (PNG only), with course name, date, website, and student name added in distinct serif typography.
- `plan/` folder: the monolithic `PLAN.md` split into one file per section, with a `plan/README.md` index.

### Fixed
- The mobile navbar hamburger toggle being visible and clickable on desktop but not actually opening the menu, caused by a shared touch-target CSS rule overriding Infima's own responsive behavior.
- Dark mode background forced to white by a leftover CSS override from the hamburger-menu fix above.
- The "Projects" navbar link and sidebar order pointing at the wrong page — the Real-World Projects index page and the "Build an AI Agent" project both had the same sidebar position, so the tie-break sent visitors to the wrong place.
- Project cards not showing when each project was published — added a localized "Month Year" date to both the project chooser and homepage cards.

## [1.1.0] — 2026-07-22

### Added
- Multi-year Capstone projects: a "Choose your Capstone" page lists every year's project (past and current) once the course is unlocked, with per-capstone completion tracking and badges, instead of one fixed page. 2026's AI-agent capstone is the first entry.
- IndexNow key and `llms.txt` for anonymous search/AI-crawler discoverability, plus listings in three community-curated learning-resource directories.

### Fixed
- The JupyterLite playground 404ing on every non-English locale (`/fr/`, `/ar/`, `/es/`) — its iframe URL was built through a locale-aware helper, so it resolved to e.g. `/fr/lite/...`, which doesn't exist (`/lite/` is a single shared, locale-independent build). GitHub Pages' 404 handling then rendered this site's own 404 page inside the panel, which looked like "the website loaded in the playground" rather than an obviously broken embed.
- The browser-language auto-redirect switching a visitor's locale with zero indication anything happened — it now shows a small dismissible banner explaining the switch, with a one-click way back.
- A malformed, non-square (32×27) `favicon.ico`.
- Translated (Arabic/Spanish/French) footer copyright text having drifted out of sync with the English version's author credit and version number.
- The JupyterLite toolbar being easy to miss (thin gray icons on plain white, no visible band) — now has a visible background band and accent border.
- The shared-progress card showing a confusing "0 / 0 weeks" for any student who'd only chosen a track in one of the two sections, instead of counting their real progress in whichever section(s) they'd started.
- The shared-progress link decoder trusting its input's shape without runtime validation — a hand-crafted `?data=` link with an unexpected value type (e.g. an object where a name string was expected) could crash the `/share` page on render. Now validated before use.
- README screenshots, which predated the PWA install button, the Capstone chooser, the custom domain, and the JupyterLite toolbar fix.

## [1.0.0] — 2026-07-22

First stable release: the full 20-week course, translated into four languages, installable and working offline.

### Added
- Full lesson content for all 20 weeks (Python 101 + Data Analysis, Normal and Hard tracks), including an expanded second pass with more depth, examples, and code across every week.
- Complete Arabic, Spanish, and French translations of all lesson content, both section landing pages, the capstone page, and every custom UI page/component (homepage, credits, progress, share, onboarding, track selector, etc.) — not just docs content.
- Capstone Bonus: install Python for real and build an AI agent with LangChain's `deepagents`, supporting six free-tier providers (GitHub Models, Gemini, Groq, Mistral, Cerebras, OpenRouter) via `.env` config. Ships with a real, runnable example agent (`examples/capstone-agent/`) and a student-agent showcase/PR-walkthrough (`examples/student-agents/`).
- GitHub Codespaces support for zero-setup local development.
- Progressive Web App support: installable, works offline once visited (service worker precaches the full site), with an install button on the homepage.
- SEO baseline: `robots.txt`, sitemap tuning, per-page meta descriptions in every locale, `Course` JSON-LD structured data, and a real `og:image`.
- Custom domain (`pyda-course.online`).
- Browser-language auto-detect and locale redirect.
- Gamification system: badges, weekly quizzes, a placement quiz gating the Data Analysis Hard track, bonus content unlocks, and a Gamified/Classical mode toggle.
- Progress sharing: a no-backend shareable progress link and downloadable completion certificate with QR verification.
- Export/import of all course progress as a JSON file, for manual multi-device carry-over.

### Fixed
- JupyterLite failing to boot on the deployed site (missing `base_url` under Docusaurus's `future.v4`).
- The playground losing notebook edits on close, and the close button not actually hiding the panel.
- Admonitions with inline titles (`:::tip Title`) silently failing to render under `future.v4` (needs bracket syntax).
- The PWA's offline mode never actually activating for non-installed visitors — precaching was gated behind an install-only default that didn't match this course's "just works offline" framing.
- Hero button overflow on mobile, and several panels/inputs rendering with a transparent background in light mode (both traced to the same root cause: relying on an Infima variable that's `transparent` by default in light mode).

## [0.1.0] — 2026-07-20

Initial scaffold: Docusaurus + TypeScript + i18n config, core client-side infrastructure (`localStorage` hooks, `UiModeContext`), and the first batch of custom components (playground FAB, track selector, placement quiz, challenges, quizzes, badges, sharing).
