# Changelog

All notable changes to this project are documented in this file. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.0.14] — 2026-11-01

The review rounds that came out of auditing the `input()` fix: the game-state module, the page
shell, every remaining component and the shared client modules, plus the run path itself.
Recorded as R1–R53 in [`audit-report-2026-11-runtime.md`](audit-report-2026-11-runtime.md).

### Fixed
- Every mastery chip on a module page appeared **twice** when the page was opened by clicking a module card (the first visit to a module page in a session). Astro's router awaits its script pass and *then* dispatches `astro:page-load`, so a page bundle evaluated during a soft navigation runs both the `readyState === 'complete'` fallback and the listener — and `ModulePage` appended its chip inside an async callback with no per-card guard. Guarded, like the project steps already were.
- A project page could lose its whole gamified UI: the per-step checklist blob is JSON from `localStorage`, and it was shape-checked only as far as `JSON.parse` — a value that was not the expected `Record<string, boolean[]>` threw inside `init()` (`.every()` on a non-array, or a property assignment on a parsed string), which took the rest of the page's wiring with it, including the "Mark complete" button. Both the blob and each entry are now coerced, so a checklist that gained or lost an item keeps its ticks instead of failing.
- `/learn/python-101/normal` advertised **"+2900 XP"** for a track whose lessons actually pay 190. `TrackHub.astro` multiplied the lesson count by a constant from when every lesson paid 100 XP; the section page one click away summed the real frontmatter and said 290. Now both sum `xpReward`.
- The progress page's station trail ticked the first *N* stations, where N was the number of modules reached — finishing module 5 alone ticked module 1 and not module 5. Both the server render and the client re-render now mark the stations actually reached, and the station list is derived from the module collection instead of a hardcoded 7/5.
- Localized homepages showed the English rank name ("Gold") next to a localized `/progress` page ("Oro"). The badge is built from the localised rank table now. The project finder likewise printed "1 of 12 projects" and `"that filter"` in English on `/es/proyectos`, `/fr/projets` and `/ar/مشاريع`; both strings come from the message catalogue.
- The learner-activity pollers (heartbeat + online count, every 30s) kept running on **every other page after one homepage visit**, for the rest of the session — they were only cleared at the start of the next homepage visit. They now stop when their widget leaves the document. "Most viewed pages" no longer renders a heading over an empty list when the RPC returns nothing, and a landing pageview is no longer dropped when anonymous auth takes longer than 3s (the dedupe marker is written when a row is actually posted, and the post retries on `pyda:auth-ready`).
- Two attributes shipped their own source text, because a quoted attribute is a string literal to Astro and `{…}` inside one is never evaluated: the progress page's station list (`class="station{done ? ' station--done' : ''}"`, so no station ever carried `station--done` and the prerendered trail showed zero progress) and the project page's scaffold badge (`class="project-head__scaffold--{scaffold}"`, so "Full guidance" and "Open-ended" were painted identically). Both are template-literal expressions now.
- **Back was broken on every project page after visiting the listing**: the finder rewrote the URL with `history.replaceState(null, …)` on every visit, which destroys the ClientRouter's `history.state.index`, and the router's `onPopState` returns early when a popstate carries a null state — so Back changed the address bar and left the project page on screen. The entry's state is carried through now, and the URL is only rewritten when a filter actually changed the query.
- Six scoped CSS rules could never match: `dir` and `data-theme` are set on `<html>`, which carries the layout's scope class, so `[dir='rtl'] .arrow` compiled to a selector requiring a component scope on `<html>`. On every Arabic module page the prev/next arrows kept their left-to-right glyphs, and two hover/dark-mode touches were lost. All six now use `:global(...)`.
- `PlaygroundCell`'s whole stylesheet was scoped out for the same reason (`.playground-page` belongs to the page, not the component): the "big freeform editor" was one line tall, and the output pane had no height cap, so a loop printing a few thousand lines stretched the page instead of scrolling. The block is global now, and the playground's **Reset** button — previously bound by four page-level inline scripts, so dead after any soft navigation and never bound at all on the `/playground/<code>` shared-link page — is wired from the component itself.
- The header XP bar rendered **before** the daily login was paid, so the first load of each day showed the previous day's XP and streak and a level crossed by the login was never celebrated. It awards first now.
- Two promises the economy did not keep: the progress guide described the 15 XP streak bonus as per-day ("on top of your daily login") when it is paid per finished lesson or project, and the quiz banner said "+25 XP" on every perfect quiz when only the first one each day pays. The guide's copy now matches the code (four locales) and the banner reports what was actually paid. The payouts themselves are untouched — they are product decisions.
- A shared playground link under a locale prefix (`/es/playground/<code>`) fell through to the plain not-found page, because the 404 handler's prefix test was the unlocalised `/playground/`; when it did render, its "browse lessons" fallback pointed at the English `/learn` regardless of locale. Both are locale-aware now.
- **Every code cell was a keyboard trap.** The `<code>` is `contenteditable`, so it sits in the tab order, and its Tab handler swallowed Tab *and* Shift+Tab into four spaces with no Escape handling — a keyboard-only learner who tabbed into any of the ~390 cells could not get back out (WCAG 2.1.2). Tab still indents; Shift+Tab and Escape leave, and the region now announces itself as a multiline textbox.
- A cell's output was announced to nobody: the transcript carried no `role` and no live region, so pressing Run with a screen reader gave no feedback at all. It is a `role="log"` now. Quiz verdicts were silent DOM changes for the same reason and are `role="status"`; answered questions mark their options `aria-disabled` instead of leaving them as silent no-ops.
- The project finder's tag, difficulty and view toggles kept their selected state in a CSS class only, so assistive tech could not tell which filter was narrowing the list or which view was current; they carry `aria-pressed` now. Every XP bar was a `progressbar` with no `aria-valuenow`, which ARIA exposes as indeterminate — `setPctWidth()` keeps the value in step for all five bars.
- The page whose job is explaining the XP economy advertised the schema defaults instead: "10 XP per lesson" is true of 19 of the 49 English lessons (the other 30 pay 100–200) and "100 XP per project" of 16 of the 135 (119 pay 50) — while every lesson and project page prints its own figure. Those two rows are computed from the content now and show the real range, and the intro no longer claims XP is "capped at 9,999" (nothing clamps it; 9,999 is the top rank threshold).
- `PageViews` recorded the landing page's locale on every later page (its listener is bound once, so each post ran in the first page's closure); the locale is read from `<html lang>` at post time. The busy overlay's status text was written while the container was `aria-hidden`, so the site's only "something is running" feedback was never announced; the region is exposed before the text is written. Every localised track page's `<title>` had an English "Track" in the middle, and the quiz header `+{xp} XP/each` was the last hardcoded English fragment on a localised page — both come from the catalogue now.
- A worker that failed to load **was never replaced**, so the "check your connection and try again" the cell prints could never work: `postMessage` to a browser-terminated worker is a silent no-op, so the retry posted into the void and Run stayed disabled on "Executing…" until a hard reload. It is terminated and dropped now, and the next run builds a fresh one (three tests, negative-controlled).
- The trailing-expression wrapper mixed UTF-8 byte offsets with character slicing, so learner code with a non-ASCII character earlier on its last line was **silently corrupted** — `print("café"); 2 + 2` became `2print(repr(…))` and raised `SyntaxError`. The splice is done on bytes now; verified by running the extracted snippet under CPython over six cases. The same pass re-points the worker's message locale per run (it used to freeze at the first page's language, and survives soft navigation) and fixes the "first success" toast, which keyed off a zero XP balance that the daily login had already made unreachable.
- **Known, not fixed:** a cell that never returns (`while True: pass`) still wedges the page — the run has no interrupt, the full-screen busy overlay stays up with pointer events blocked, and every later cell queues behind it, so the only exit is a reload. It needs a Stop control that terminates the worker and settles the in-flight run, which is a new control plus copy in four locales and needs a browser pass; it is recorded as the top open item in the audit report (R49).
- A dark-mode visitor's theme **reset to light on soft navigation**. The ClientRouter copies the incoming document's `<html>` attributes, and every page renders `data-theme="light"`; the script that restores the saved theme is deduped by the router and only ever ran once per session, so nothing corrected it. The saved theme is re-asserted on `astro:page-load` now.
- Every 404 page logged `Uncaught ReferenceError: go is not defined`: one inline script ended by calling `go()`, which is scoped to a *different* inline script's IIFE. The localisation itself worked (that script calls its own `go()`), so the only symptom was the console error.

### Changed
- **Dependencies refreshed** (`npm update`, inside the declared ranges): astro 7.3.1 → 7.4.4, vitest 4.1.11 → 4.1.12, `@inlang/paraglide-js` 2.25.0 → 2.29.3, `@supabase/supabase-js` 2.116.0 → 2.118.0, katex 0.18.4 → 0.18.10, `@astrojs/markdown-remark` 7.3.0 → 7.3.5, `@astrojs/check` 0.9.10 → 0.9.12, hastscript 9.0.1 → 9.0.3. Majors (vitest 5, katex 0.19, typescript 7) are deliberately not taken — each needs its own migration pass. astro 7.4 also swapped its wasm compiler for a native one, so the template test now depends on `@astrojs/compiler-rs` explicitly (it had been reaching `@astrojs/compiler` as a hoisted transitive package — the kind of accident that breaks on someone else's release day).
- The deploy workflow still builds on **node 22**, which is fine: astro 7.4's floor is node `>=22.23.4` and `node-version: 22` resolves to the newest 22.x, which is now exactly v22.23.4. Bumping it to 24 (the version this branch is tested against, and the only one that can run the suite in the audit VM) needs a push with the GitHub App's `workflows` permission — this connection does not have it, so that one-line change is left to someone who does.
- Pyodide stays pinned at **0.26.4**. The cell runtime is verified against that exact engine (`input()`'s stdin shim, the scipy/openblas closure), and re-vendoring a new one cannot be validated in this VM — no browser, no `astro build`.

## [2.0.13] — 2026-11-01

### Fixed
- Cells that call `input()` no longer block the page (reported on `/learn/python-101/normal/lessons/04-type-conversion/`). Pyodide's stdin callback is synchronous, so the old design had to answer it with `window.prompt()` on the **main thread** — a second ~11MB engine boot that froze the tab, then a modal dialog that froze it again for as long as it stayed open, with the prompt text lost to the output panel and no access to variables defined in earlier cells (separate engine). Now every cell, `input()` included, runs in the shared worker: `pythonInputs.ts` scans the cell for `input()` call sites, the cell renders one labelled field per call between the code and the output (`cell__stdin`), and the worker replays the values through stdin, echoing each into the transcript (`o-line--in`). Asking past the last value reports EOF — Python raises `EOFError`, the friendly-error line explains it and the form grows one field — so a `while` loop that reads lines still works. `pythonGuard.usesBlockingInput` and the main-thread production path are gone; `CellRuntime.stdin` is now required and the shared engine means `input()` cells see earlier cells' variables.
- `pythonGuard.usesJsBridge` was bypassable, and a fuzz pass over the guard (then one real-browser run per payload) found two more families: aliasing the builtins (`E = exec; E("import " + "js")`) and the stdlib modules that compile and run strings (`code.InteractiveInterpreter().runsource`, `timeit`, `profile`/`cProfile`, `trace`, `runpy`, `pdb`). Both are refused now; `re.compile`, `model.eval()` and prose still pass, and the 1576 lesson fences still do. Earlier payloads: `__import__("\u006a\u0073")`, `__import__("builtins").exec(...)` (bound to a name, or with a base64 payload), `sys.modules["js"]`, `vars()["__builtins__"]`, `print.__self__.exec(...)`, the `__subclasses__` chain, and `marshal` + `types.FunctionType` all passed the scan — a shared `/playground/<code>` link is attacker-written code that runs on the viewer's origin, so that was a live route to the viewer's saved progress. Every one of those is now refused (modules by `import x`/`x.`/`x(`, namespace builtins by call form, the introspection dunders that walk an object to the class graph), without touching `__name__ == "__main__"`, `re.compile`, `getattr` or the `sns.pairplot(..., vars=[...])` keyword: backslash line continuations (`import \<newline>js`, `exe<newline>c(...)`) and dangerous modules that are not first in an import list (`import os, sys`) are caught too, and all 1576 lesson code fences still pass the guard. It is a guardrail, not a boundary — see `audit-report-2026-11-runtime.md` §B3 for why the real fix is to stop executing foreign code in the site's origin.
- A run that fails now shows the exception Python actually raised **and** the beginner hint; the hint used to replace the message, which hid the `ValueError`/`TypeError` that lesson 04 quotes verbatim. Pressing Enter in an editable cell also kept the newline in the wrong place (the next characters landed on the previous line), so editing a cell into two statements ran them as one.
- The progress page's activity metrics were computed from `lastActive` (the *last* active day) as if it were the start date, so for anyone actually reading the page they collapsed to "day 1": lessons/week showed lessons × 7 and the return rate was 100% for everybody. The span now starts at the first activity-log entry. Streak days and the daily-login gate also use the learner's local calendar day instead of UTC (they flipped at 19:00 in New York, and an evening session could pay the daily login twice), a quiz now advances the streak like any other action, and the homepage "Badges" counter shows the visible quests instead of a list that also collected daily-login and per-lesson keys (it grew by one every day). A stored state with a wrong-typed collection is repaired rather than silently reset to zero.
- A failed engine load poisoned the page: `py()` cached the rejected promise, so after one transient failure every later Run failed with the same error until a reload. The cached promise now drops itself and the next click retries. A malformed figure payload is no longer reported as the cell failing, and the first-success toast's CSS moved out of a runtime-injected `<style>` (it could lose the first frame) into `global.css`.
- **scipy was broken for every visitor.** `scripts/vendor-pyodide.mjs` copied only `.whl` files, so `openblas-0.3.26.zip` — the shared library `scipy.linalg._fblas.so` links against — was never vendored (404 on production), and `import scipy.stats` died with `bad export type for 'ztrsm_'`. The closure now accepts `.zip` too; all ten cells of the correlation-analysis lesson run clean.
- The localized learn hubs linked `/es/cheatsheets`, `/ar/cheatsheets` and `/fr/cheatsheets` — the English slug with a locale prefix — all 404. They now point at `/es/referencias`, `/ar/ملخصات` and `/fr/antiseche`.
- The `data-lesson-xp` read in the cell runner was dead (running code pays `XP.LESSON_RUN`; `xpReward` is paid by "Mark complete") — removed. A `FileNotFoundError` now gets a friendly explanation of the literal-filename rule instead of a bare traceback. Enter in a cell's `input()` field moves to the next question and runs from the last one, like a terminal. `input()` is wrapped at engine boot so its prompt is written as a whole line before the read — Pyodide's batched stdout holds a flushed partial line until a newline, which put the learner's answer *above* the question; a real-browser check (Vite + Playwright Firefox, real Pyodide) now shows prompt → answer → output.

## [2.0.12] — 2026-09-15

### Fixed
- The 2.0.10 CSP fix was incomplete: it added a sha256 hash for the ClientRouter's `data:application/javascript,` placeholder script, but CSP hash-source only governs truly inline (no-`src`) scripts — it never applied to `<script src="data:...">` at all, hash or no hash. Added the `data:` scheme directly to `script-src` instead, which does govern `src`-loaded scripts. (#316)
- Because that placeholder script never loaded, the ClientRouter's transition sequencing ran its next step against the pre-swap DOM, surfacing as `Uncaught TypeError: Cannot set properties of null (setting 'className')` on every soft navigation. Root cause once isolated: `initProjectsFinder()` bound itself to the *global* `astro:page-load` event (firing on every soft nav site-wide, not just `/projects`) and grabbed `#project-grid` with a non-null assertion, so any navigation to a page other than `/projects` crashed immediately. Replaced the assertion with an early-return guard. (#317)

## [2.0.11] — 2026-09-14

### Fixed
- "Most viewed pages" showed the same page twice with its views split across two rows (e.g. "Learn" appearing at both rank 2 and rank 4) — `popular_pages()` grouped by the raw `path` column with no normalization, so `/learn` and `/learn/` counted as separate pages competing independently for one of only 10 slots, uncorrectable client-side after the `LIMIT`. New migration groups by the trailing-slash-stripped path instead; `PageViews.astro` now also records paths pre-normalized going forward. `schema.sql` brought back in sync with this and the earlier locale-root exclusion (migration 008), which it had also drifted out of sync with. (#319)

## [2.0.10] — 2026-09-14

### Fixed
- CSP blocked scripts after a soft (client-side) navigation, breaking Astro's own ClientRouter script re-execution and, on any page other than the visitor's entry page, that page's own inline scripts too. `<meta http-equiv="Content-Security-Policy">` is only evaluated from the real, server-delivered HTML document — a soft-navigation DOM swap of a different page's CSP `<meta>` tag never actually takes effect, so only the visitor's first-loaded page's hash list was ever enforced. `scripts/harden-csp.mjs` now computes one global union of every page's inline-script hashes (plus the ClientRouter's own fixed placeholder-script hash) and applies that same set to every page, instead of a different set per page. Invisible in `astro dev` since the hardening pass only runs postbuild against a real `astro build`. (#314)

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
