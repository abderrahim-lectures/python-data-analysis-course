# i18n migration design — Paraglide JS 2.x on Astro 7 (SSG)

Status: design complete. Validated end-to-end in a PoC
(`/tmp/opencode/i18n-poc`, astro 7.3.1 + `@inlang/paraglide-js` 2.25.0).
Not yet implemented on main.

Constraint this design answers: **no hardcoded i18n** (no hand-rolled
`Record<Locale, string>` maps — the current `pageStrings`/`uiStrings`
approach). We want a compiler-based, tree-shakable message layer where the
translation source of truth is a flat message file, not TypeScript maps.

---

## 1. Why Paraglide over staying with the string packs

The current site already has clean per-locale routing (`routeSegments.ts`),
per-locale content collections, and `hreflang` alternates. What it lacks:

- `pageStrings`/`uiStrings`/`creditsStrings`/`cheatsheetsStrings` are
  TypeScript maps — every locale ships every key (unused keys still ship),
  keys can drift, and there's no IDE support for translators.
- A handful of components still hardcode English (Quiz, PlaygroundCell,
  NotebookCell, RunnableCell, PlaygroundHead, `diffColor.label`).

Paraglide compiles `messages/*.json` into per-message JS modules. Only the
messages a page imports get bundled (tree-shakable), keys are type-safe
(`m.hero_title()`), and translations live in editable JSON that inlang's
tooling (Sherlock/Fink/CLI) can manage.

Verified in PoC:
- SSG works (no server output). Locale must be set at build time via
  middleware `setLocale(assertIsLocale(context.currentLocale ?? baseLocale))`.
- `astro.config` `i18n` block with `locales`/`defaultLocale`/`routing`
  (EN at root, no prefix; es/ar/fr prefixed) — matches the live site exactly.
- `localizeHref(path, {locale})` produces correct prefixed URLs
  (`/lessons/reading-files` → `/es/lessons/reading-files`), and unprefixed
  URLs for `en`.
- `getTextDirection()` returns `rtl` for `ar` automatically.
- Per-locale content collections + `render(entry)` (the Astro 7 Content
  Layer API, same one main now uses after the astro@7 upgrade) work as-is.

## 2. Key findings / decisions

### 2.1 Message keys must be flat (snake_case)
The compiler rejects dot-nested keys for ergonomic use: `hero.title`
compiles to `m["hero.title"]()` (exported as a quoted key), which is ugly
in Astro templates and defeats type-checked calls. Use flat keys:
`hero_title`, `nav_learn`. The current string packs already use
PascalCase-style keys (`LEARN`, `PROJECTS`); during migration, map them to
snake_case message keys (`nav_learn`, etc.).

### 2.2 Route slug parity — the one real risk
`localizeHref` only rewrites the locale prefix; it does **not** rewrite
slugs. If one locale's content uses a different slug (`leer-archivos` vs
`reading-files`), the alternate URL breaks. Verified in PoC.

On main: project/lesson files are identical slugs per locale (verified).
So prefix-swap alone is sufficient. Two exceptions to keep mapped in the
route helper:
- `data-visualization` exists as EN-only (8 references) — its
  ar/es/fr alternates must fall back to the EN page until twins exist
  (content task, on the backlog).
- ESL (English second language) lessons that exist only in EN — same
  fallback rule.

Design: keep the existing `routeSegments.ts` slug tables as the canonical
slug map; only replace its *href builders* with `localizeHref`.

### 2.3 Build-time locale resolution (SSG)
No `paraglideMiddleware()` — that's for SSR. Instead:
- global `setLocale()` in middleware (Astro middleware runs during the
  static render).
- `src/middleware.ts`:
  ```
  import {defineMiddleware} from 'astro:middleware';
  import {assertIsLocale, baseLocale, setLocale} from './paraglide/runtime.js';
  export const onRequest = defineMiddleware((context, next) => {
    setLocale(assertIsLocale(context.currentLocale ?? baseLocale));
    return next();
  });
  ```
- `vite.plugins` gets `paraglideVitePlugin({project, outdir,
  strategy: ['url', 'globalVariable', 'baseLocale']})`.
- `emitTsDeclarations: true` requires `typescript` installed (it is).
- `astro.config` `i18n.locales` must match `project.inlang` `languageTags`.

### 2.4 Content stays content; UI chrome becomes messages
Content bodies (lesson/project markdown) are already per-locale and stay in
content collections — Paraglide does not touch them. Only chrome/labels
(nav, buttons, empty states, difficulty labels) migrate to messages. This
bounds the migration to components, not 537 content files.

## 3. Migration steps (adoption order, each verified)

1. **Scaffold Paraglide**
   - `project.inlang/settings.json` (schema without `.json` suffix — a
     wrong schema URL silently yields zero messages; that cost a debug
     cycle in the PoC).
   - `messages/{en,ar,es,fr}.json` — start with the keys extracted from
     `pageStrings`/`uiStrings`/`creditsStrings`/`cheatsheetsStrings`
     (dedupe by meaning, flat snake_case).
   - `paraglideVitePlugin` in `astro.config.mjs`; `i18n` block;
     `src/middleware.ts`.
   - Gate: build still 874 pages; `astro check` baseline 1; unit 498.
2. **Base.astro head/layout** — replace hardcoded aria-labels / lang
   attributes / title suffix with `m.*` reads via `getLocale()` from the
   middleware-set runtime. Gate: contrast/a11y suites green, html
   `lang`/`dir` correct per locale in built output.
3. **Route helpers** — swap `routeSegments` href builders to
   `localizeHref` (keep slug tables; keep `data-visualization` fallback
   rule). **DONE** (2026-09-08): builders delegate the locale prefix to
   `localizeHref` while interior words stay from the slug tables;
   `data-visualization` (the only EN-only project, 135 vs 134 files) now
   falls back to its EN URL in ProjectDetail alternates; localized wrappers
   keep all four. Added regression tests: unit (twin parity) + e2e
   `tests/e2e/hreflang.mjs` (every alternate resolves in dist). Gate:
   build 874, astro check baseline 1, unit 500, smoke 40/40,
   hreflang 40 links all resolve.
4. **Components** — migrate hardcoded EN (Quiz, PlaygroundCell,
   NotebookCell, RunnableCell, PlaygroundHead, `diffColor.label` in
   `projectArt.ts`) to messages. **DONE** (2026-09-08): 64 message keys ×
   4 locales (was 150, now 168 incl. `$schema`). Quiz (title/Check/
   Retry/score/perfect/partial/wrong), the three cell components
   (Run + aria, Clear, Reset), PlaygroundHead (h1, back link), and
   `projectArt.ts` difficulty labels → `m.difficulty_*` resolved in
   ProjectDetail. `runnable-cell.client.ts` (browser hydration, imported
   `m` from paraglide) localizes run/loading/blocked-bridge strings; it
   also re-stamps Run/Clear text at mount so cells emitted by the markdown
   rehype plugin (one EN render shared across locale trees) hydrate to the
   viewer's locale. Gate: build 874, astro check back to baseline 1,
   unit 500/500, smoke 40/40, a11y 0, contrast 0, responsive clean,
   hreflang 40 links all resolve.
   - Backlog (flagged, intentionally out of scope here): the Python-error
     phrase map in `runnable-cell.client.ts` (`friendlyError`, ~10 strings)
     stays EN — it is engine-error copy, near-identical across locales, and
     the design list did not include it.
5. **String packs deleted** — remove `pageStrings.ts`/`uiStrings.ts`/
    `creditsStrings.ts`/`cheatsheetsStrings.ts` when all consumers are on
    messages. Add unit test asserting no `import` of the removed modules.
    **DONE** (2026-09-08): migrated the last 14 legacy EN learn pages off
    `PAGE_STRINGS` (2 section indexes `ps.track1Desc`/`track2Desc` →
    `m.track_1_desc()`/`m.track_2_desc()`; 4 lesson templates
    `ps.completed`/`courseDescription`/`markComplete` → `m.*()`;
    8 track/module pages had dead imports, dropped). Credits entries
    (names/notes) were already message keys; their hrefs are hardcoded URLs
    in the 4 credits pages. Rewrote `links.test.ts` credits tests to read
    `messages/*.json` + page source, `lessonWiring.test.ts` to assert
    `m.*()`, and `i18n.test.ts` to keep a no-import/gone guard for the 4
    packs. Deleted the 4 packs + the one-time `scripts/gen-messages.mjs`
    bootstrap (it read the packs; untracked, unwired). Gate: paraglide
    compile OK, build 874 pages, astro check back to baseline 1 error/136
    hints, unit 501/501 (pack-parity describes replaced with message-level
    guards over `messages/*.json`: key-set parity per locale, no-empty, and
    "non-EN locales actually translated" with a whitelist of intentional
    EN-held labels). E2E gate green too: smoke 40/40, a11y 0,
    contrast 0, responsive clean, hreflang 40 links all resolve.

## 4. What stays manual (flagged)
- **`pda:state` locale namespace** — localStorage key is not locale-scoped
  (one progress bucket shared across locales, by design for cross-locale
  learners). This is orthogonal to Paraglide; still an open product
  decision. Paraglide does not change it.
- **Translation completeness** — Paraglide makes *inserting* translations
  easy but doesn't translate content. The body-translation backlog remains
  (49 lessons, 22 modules, `data-visualization` twins).
- **CI workflow Node 20→22** was bumped for astro@7 already; Paraglide's
  vite plugin runs on Node 22 fine.

## 5. Explicit non-goals in the PoC
- No server adapter (`output: 'server'` is the *other* Paraglide path).
- No `paraglideMiddleware`. Static rendering + build-time `setLocale` only.
- No per-locale URL slug translation (matches current behavior — slugs are
  shared identifiers; only "track words" like `normal/hard` are localized,
  handled by the existing routeSegments module).

## Appendix: PoC validation evidence
- Files built: `/` (en), `/es/`, `/ar/`, `/fr/`, `/lessons/reading-files`,
  `/es/lessons/leer-archivos` — no `/en/` duplicate, no `/fr/lessons`
  (fr has no content yet) because `[locale]` routes skip `baseLocale`.
- `dist/index.html`: `lang="en" dir="ltr"`, hreflang alternates
  `/`, `/ar/`, `/es/`, `/fr/` + `x-default="/"`.
- `dist/ar/index.html`: `lang="ar" dir="rtl"`.
- ES lesson page lang-switcher: `/ar/lessons/...`, `/es/lessons/...`
  (current), `/fr/...`, and unprefixed EN — all via `localizeHref`.
- ES homepage renders Spanish nav message `switch_locale` → `Idioma`; EN →
  `Language`.
## 6. Status after adoption + brutal review (2026-09-08)
- **Durable lix patch**: the fresh-project import workaround is now repo-owned
  — `scripts/apply-lix-patch.cjs` (idempotent, failure-loud) runs automatically
  via `prebuild`/`predev`. Previously required re-applying
  `/tmp/opencode/patch-importfiles.cjs` by hand after every `npm ci`; the new
  script is trigger-free and CI/deploy build paths apply it implicitly.
  Reference: lix issue #422, `@lix-js/sdk@0.15.1` no released fix. Option for
  killing the patch entirely: commit `project.inlang/` (drop
  `cache/paraglide-js/*` from `.gitignore`) so new and CI checkouts share the
  imported DB — proposed, not executed (product/repo decision).
- **EN learn tree consolidated**: the 14 static EN learn templates
  (`/learn/python-101|data-analysis/*`) were replaced by the same shared
  component wrappers the locale trees use (SectionLanding / TrackHub /
  ModulePage / LessonPage, `locale='en'`). Public URLs unchanged; the four
  unit-test files that asserted against the 14 templates were re-pointed at
  the shared components. Lesson and module ID wiring, JSON-LD, completion
  labels all covered by the same guards as before.
- **Coverage truth**: UI chrome is en/ar/es/fr; lesson + module *body*
  content stays EN-only (backlog below). README now states this directly.
- **Gate**: build 874 pages · astro check 0 errors (Quiz.astro cast fix) ·
  486 unit tests · smoke 40/40 · hreflang 40/40 · a11y/contrast/responsive
  clean. CI gained the vitest unit step + a self-contained smoke step and a
  hreflang job.
- **Remaining translation backlog (locale CONTENT)**: 49 lessons + 22 modules
  ar/es/fr · `data-visualization` ar/es/fr twins · es/fr cross-locale link
  sweep · frontmatter drift (es 10, fr 5) · `pda:state` namespace product
  call · EN-held message labels to review (Changelog, Playground, Module fr,
  Students Performance in Exams, Site fr).
