# Changelog

All notable changes to this project are documented in this file. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
