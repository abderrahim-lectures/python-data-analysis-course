# Changelog

All notable changes to this project are documented in this file. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
