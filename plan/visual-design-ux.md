# Visual Design & UX

> **SUPERSEDED (2026-09-09).** This file describes the **Docusaurus-era** site
> (Infima theming, `docusaurus.config.js` KaTeX, the Docusaurus search plugin,
> the mobile hamburger drawer). The site is now **Astro with a custom design
> system** — see `plan/site-structure.md`, `plan/astro-rebuild.md`, and
> `plan/gamification.md` for the current architecture, and `src/styles/global.css`
> (design tokens) for the palette/type system that replaced the "tune the
> Docusaurus default" pass. KaTeX is wired via Astro's remark/rehype plugins, not
> `docusaurus.config.js`. Retained only as historical context; do not implement
> anything from this file as-is.

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
