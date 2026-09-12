---
name: clean-course-ui
description: Build and iterate on a beautiful, modern UI for the Astro course site. Use when restyling pages, building new pages, or running the screenshot→critique→improve loop. Enforces the design tokens and the collaboration loop.
---

# Beautiful Course UI

Purpose: give the Astro course site a beautiful, professional, modern look — light-first,
generous whitespace, one accent color, refined palette. No dark-game chrome, no character
avatars, no dialogue/narration boxes. Gamification (XP/ranks/streaks/bars) is a tidy
dashboard. Scene backgrounds use CSS gradients, not images (no public assets).

## Design tokens (source of truth: `astro/src/styles/global.css`)
Light is the DEFAULT (Base.astro sets `data-theme="light"`; dark supported via toggle).
- `--bg:#faf9fc`, `--surface:#fff`, `--surface-2:#f5f3f8`, `--surface-3:#eae6f1`
- `--ink:#1a1a2e`, `--ink-soft:#57534e`, `--ink-faint:#9a95a4`
- single accent `--accent:#5b21b6` (violet) + `--accent-strong` + `--accent-soft`
- semantic `--good:#15803d`, `--bad:#b91c1c`, `--warn:#b45309` (+ soft variants)
- radii: `--radius-lg:16px / md:10px / sm:6px`
- fonts: Inter (body + display)

## Rules
1. NO game chrome: no clip-path panels, no gold, no `--primary/--gold` tokens, no
   character avatars, no dialogue/narration boxes. Those were removed.
2. Beautiful primitives: rounded cards, layered shadows, one accent, Inter font.
3. Gamified stats (StatsProfile) use soft rounded bars driven by `--accent`.
4. Scene backgrounds are CSS gradients in `SceneBg.astro` — NO images/assets in public.
5. NEVER fetch/use external assets; everything is self-contained.

## The loop (run forever; improve each pass)
1. Edit components/pages to the tokens above.
2. VERIFY (must be green): `npx astro check` → 0 errors; `npm run build`; playwright to
   assert 0 console/page errors and `data-theme="light"`.
3. SCREENSHOT: full-page PNG into /tmp/opencode/shots.
4. CRITIQUE: spawn a free opencode model via a `task` general agent with screenshots +
   source + tokens. Ask for specific, actionable flaws — no praise.
5. IMPROVE: apply only the highest-value fixes; don't churn.
6. Re-run until no new actionable items.
