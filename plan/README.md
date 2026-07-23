# Python & Data Analysis Course — Design Plan

The design plan and rationale behind every major decision in this course, split into one file per topic (previously a single `PLAN.md` — see [`context.md`](./context.md#provenance) for why it moved). Start with [`context.md`](./context.md) for the big picture; the rest can be read in any order.

- [`context.md`](./context.md) — what this course is, the core decisions locked in up front, and this plan's own history.
- [`development-workflow.md`](./development-workflow.md) — the issue → branch → PR → auto-merge flow every change goes through, and one-time repo setup.
- [`code-organization.md`](./code-organization.md) — file-size/structure conventions (small components, shared hooks/utils, one source of truth for shared types).
- [`site-structure.md`](./site-structure.md) — the full repo file tree with a one-line purpose per file/folder.
- [`learning-path-flow.md`](./learning-path-flow.md) — the click-path from first visit through onboarding, track choice, and return visits.
- [`playground.md`](./playground.md) — the self-hosted JupyterLite playground (REPL for Python 101, Notebook for Data Analysis) behind the floating action button.
- [`persistence.md`](./persistence.md) — every `localStorage` key this site writes, what it's for, and the export/import/reset mechanism.
- [`content-style-guide.md`](./content-style-guide.md) — tone, emoji-as-signposts, and the math-first teaching approach.
- [`visual-design-ux.md`](./visual-design-ux.md) — design system, dark mode, accessibility, and mobile-first requirements.
- [`i18n.md`](./i18n.md) — the Docusaurus i18n setup and the full Arabic/Spanish/French translation of every page and component.
- [`content-pattern.md`](./content-pattern.md) — the five-part skeleton every weekly lesson page follows.
- [`gamification.md`](./gamification.md) — badges, quiz-gated bonus content, and the Gamified/Classical mode toggle.
- [`sharing-progress.md`](./sharing-progress.md) — the no-backend shareable progress link and downloadable completion certificate.
- [`capstones.md`](./capstones.md) — the Real-World Projects architecture: an open, ongoing series (no completion gate, no year prefix), per-project completion tracking.
- [`section-1-python-101.md`](./section-1-python-101.md) — the Python 101 syllabus (both tracks, weeks 1–5).
- [`section-2-data-analysis.md`](./section-2-data-analysis.md) — the Data Analysis syllabus (both tracks, weeks 6–10).
- [`deployment.md`](./deployment.md) — the GitHub Pages deploy workflow and the custom domain setup.
- [`seo.md`](./seo.md) — on-site SEO: sitemap, meta descriptions, structured data, `og:image`, analytics.
- [`discoverability.md`](./discoverability.md) — off-site discoverability: `llms.txt`, IndexNow, directory listings, and what still needs a manual login.
- [`pwa.md`](./pwa.md) — the installable, offline-capable Progressive Web App setup.
- [`testing-and-verification.md`](./testing-and-verification.md) — the Playwright smoke-test suite and the full manual verification checklist.
- [`deferred.md`](./deferred.md) — what was deliberately left out of this pass, and why.
