# Changelog

All notable changes to this project are documented in this file. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
