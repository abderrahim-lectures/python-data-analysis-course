# Python & Data Analysis Course — Design Plan

The design plan and rationale behind every major decision in this course, split into one file per topic (previously a single `PLAN.md` — see [`context.md`](./context.md#provenance) for why it moved). Start with [`context.md`](./context.md) for the big picture; the rest can be read in any order.

- [`context.md`](./context.md) — what this course is, the core decisions locked in up front, and this plan's own history.
- [`development-workflow.md`](./development-workflow.md) — the issue → branch → PR → auto-merge flow every change goes through, and one-time repo setup.
- [`code-organization.md`](./code-organization.md) — file-size/structure conventions (small components, shared lib files, one source of truth for shared types).
- [`site-structure.md`](./site-structure.md) — the full repo file tree with a one-line purpose per file/folder.
- [`learning-path-flow.md`](./learning-path-flow.md) — the click-path from first visit through onboarding, track choice, and return visits.
- [`playground.md`](./playground.md) — how lessons run code in-browser: inline Pyodide runnable cells, the standalone `/playground` page, and per-lesson notebook companions for cloud runtimes.
- [`persistence.md`](./persistence.md) — the single `pda:state` localStorage key, what it stores, and how export/import/reset work (there's also the interactive challenge response key).
- [`content-style-guide.md`](./content-style-guide.md) — tone, emoji-as-signposts, and the math-first teaching approach.
- [`visual-design-ux.md`](./visual-design-ux.md) — design system, dark mode, accessibility, and mobile-first requirements.
- [`i18n.md`](./i18n.md) — the Astro i18n setup: per-locale UI string dictionaries and translated route segments.
- [`content-pattern.md`](./content-pattern.md) — the five-part skeleton every weekly lesson page follows.
- [`gamification.md`](./gamification.md) — the always-on XP/streak/quest/badge layer over one `pda:state` blob (no mode toggle, no unlock gating).
- [`sharing-progress.md`](./sharing-progress.md) — why the Docusaurus-era share-link/certificate design was dropped, and how progress sharing actually works (permanent content URLs, local-only progress page).
- [`capstones.md`](./capstones.md) — the Real-World Projects architecture: an open, ongoing series (no completion gate, no year prefix), per-project completion tracking.
- [`section-1-python-101.md`](./section-1-python-101.md) — the Python 101 syllabus (both tracks, weeks 1–5).
- [`section-2-data-analysis.md`](./section-2-data-analysis.md) — the Data Analysis syllabus (both tracks, weeks 6–10).
- [`deployment.md`](./deployment.md) — the GitHub Pages deploy workflow and the custom domain setup.
- [`seo.md`](./seo.md) — on-site SEO: sitemap, meta descriptions, structured data, `og:image`, analytics.
- [`discoverability.md`](./discoverability.md) — off-site discoverability: `llms.txt`, IndexNow, directory listings, and what still needs a manual login.
- [`pwa.md`](./pwa.md) — the installable, offline-capable Progressive Web App setup.
- [`testing-and-verification.md`](./testing-and-verification.md) — the vitest + CDP smoke-test suite and the full manual verification checklist.
- [`deferred.md`](./deferred.md) — what was deliberately left out of this pass, and why.
