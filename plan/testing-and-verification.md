# Automated Tests & Verification

Verification is layered: typecheck, unit tests, CDP smoke/visual suites, and CI. All suites run against the built site.

## Typecheck & build

- `npm run check` — `astro check` (tsc over `.astro` + TS); must be 0 errors. Covers content-collection schemas, `pageStrings.ts`/`routeSegments.ts` shape, and component props.
- `npm run build` — clean static build (~860 pages). If `astro check` reports a phantom error on a file that "looks right", it is usually the incremental `.astro/` cache — run `rm -rf .astro && npx astro check` before assuming a real break.

## Unit tests — `tests/unit/` (vitest, `npm run test`)

Nine small, fast suites (498 tests, run in CI):

- `i18n.test.ts` — every locale defines exactly the same `PAGE_STRINGS`/`UI_STRINGS` keys as EN (a missing key fails, not silently undefined), no locale key is empty, non-English locales actually differ from EN (guards hardcoded-English bugs), hub templates render strings not literals, and the shared layout (footer tagline from locale pack, onboarding dialog hidden + labeled) is correct.
- `links.test.ts` — every `public/datasets/index.json` manifest entry maps to a real shipped CSV file.
- `lessonWiring.test.ts`, `moduleWiring.test.ts`, `contentSchema.test.ts` — content-collection wiring and schema compliance across lessons/modules/projects.
- `gameState.test.ts` — XP economy, quest/badge thresholds, streak/legacy-repair math.
- `pythonGuard.test.ts` — the cell sandbox blocks the `js`/`pyodide` bridge modules.
- `jsonLd.test.ts`, `hoverColor.test.ts` — structured-data output and hover-contrast invariants.

## E2E suites — `tests/e2e/` (CDP, no Playwright dependency)

Headless-Chrome via the CDP helper in the smoke scripts. Each runs against the built site (build + serve first):

- `npm run test:e2e` (`smoke.mjs`, **40 checks**) — per-page console/error monitoring; game-state reset; clicking through a lesson to an exact "Mark complete"; XP/level/XP-bar and quest counts reflecting the rebalanced economy (lesson complete 60 XP, milestone 25 XP, 32 quests, legacy repair → 175 XP); streak tracking; project-grid card count consistency with the live DOM (`[data-project]:not([hidden])`, since projects render card count from a hidden filter pass); linked lessons/projects resolve; and a locale/hub round-trip. Onboarding is suppressed in tests via `pda:onboarded` so the dialog doesn't swallow completion clicks.
- `npm run test:contrast` (`contrast.mjs`) — automated WCAG-ish contrast scan over key pages.
- `npm run test:responsive` (`responsive.mjs`) — phone-viewport rendering checks across key pages.
- `npm run test:a11y` (`a11y.mjs`) — accessibility smoke (roles/landmarks/labels on the riskiest interactive components).
- `npm run test:all` — `test` + `test:e2e` + `test:a11y` + `test:contrast` + `test:responsive`.

## Manual checklist (still worth doing on major changes)

- Click through a lesson and confirm the runnable cells execute (Pyodide load, ▶ Run, output, print-wrapping of expression-only cells), the ⛶ button hands code to `/playground`, and dataset references (`open('students-performance.csv')` etc.) resolve from the mounted filesystem.
- Confirm a notebook badge on a lesson opens a real Colab/Binder/nbviewer URL.
- Confirm completion → XP/toast/quest updates, mark-complete stays in all four locales, and reload round-trips through `pda:state`.
- Check Arabic RTL mirrors correctly (nav, hubs, lesson pages) and Spanish/French chrome is translated.
- Phone viewport: cell actions, quiz options, bottom nav, challenge reveal usable one-handed; desktop still intentional.
- Confirm `/playground/<code>` shared links render the code (404-page fallback on a static host).