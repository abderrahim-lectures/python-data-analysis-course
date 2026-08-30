# Active TODO — queued mid-session, 2026-08-30

Tracking list for requests that came in faster than they could be finished.
Check items off as they land; move detail write-ups to `astro-rebuild.md`'s
status log once done, don't duplicate here.

- [x] **i18n URL segment translation** — done. Locale routes restructured
      from `/ar/learn` → `/ar/تعلم`, `/es/learn` → `/es/aprender`,
      `/fr/learn` → `/fr/apprendre`, and `/projects` → `/مشاريع`/
      `/proyectos`/`/projets`. Track words in the URL too (`normal`/`hard`
      → `عادي`/`صعب`, `dificil`, `difficile`). Content slugs (`python-101`,
      `data-analysis`, project slugs) stay untranslated — gameState/XP keys
      shared across locales. Added `src/lib/routeSegments.ts` (word map +
      href builders) and `src/lib/pageStrings.ts` (localized titles/copy
      for the learn hub + projects index, the two pages whose text was
      hardcoded English rather than pulled from content). Added `hreflang`
      alternate `<link>` tags to `Base.astro` via a new `alternates` prop,
      wired through all 5 locale route templates. Verified: Unicode (Arabic)
      directory names build fine on disk, canonical/hreflang URLs
      percent-encode correctly, titles render translated
      (`تعلّم — PyDA`/`Aprender — PyDA`/`Apprendre — PyDA`).
      Old `/ar/learn` etc. URLs are gone with no redirect (site isn't
      indexed yet — same call as the earlier `/stats` removal).
- [x] **Custom domain / base path fix**: discovered mid-session that
      production is `https://pyda-course.online/` (custom domain), not
      `github.io/python-data-analysis-course/`. `astro.config.mjs` was
      still assuming the GH Pages repo-subpath. Added `public/CNAME`,
      fixed `site`/`base` — this was silently breaking every canonical URL,
      OG tag, and the sitemap.
- [x] **Button hover states audit**: `.btn-streak`/`.btn-xp` and
      `.route-pill--normal/--hard` (both EN and locale `/learn` hubs) had
      `:active` press feedback but no `:hover` at all — fixed all of them.
- [x] **Top nav icon check**: the Progress icon (a two-dot winding-path
      glyph) was illegible at 15px, just read as a stray squiggle —
      redesigned as a flag glyph, reads clearly now. Learn/Projects icons
      were already fine once Projects got its dedicated globe icon (see
      "already done" section below).
- [x] **Locale hub "Track 1"/"Track 2" badge** was still hardcoded English
      on the ar/es/fr learn hubs even after the rest of the page translated
      — added `track1`/`track2` to `pageStrings.ts`, fixed.
- [x] **Playground — done, scoped as a pragmatic MVP, not a Monaco/JupyterLite
      port.** Added `/playground.astro`: a bigger, standalone version of the
      inline lesson code cell (same `.cell` markup, same shared Pyodide
      runtime via `runnable-cell.client.ts` — no new execution engine).
      Every code cell site-wide (`RunnableCell.astro` and
      `rehype-runnable-python.mjs`'s generated cells) got a ⛶ "open in
      full-screen editor" button that hands the cell's current code to
      `/playground?code=...` via a query param. Added to the top nav and
      footer for discoverability (this is what "where is the playground?"
      was asking about earlier). Also fixed the stale week-1 admonition
      that promised a "sidebar-toggle Code strip" / notebook mode from the
      old Docusaurus `VsCodePlayground` component — rewrote it to describe
      what's actually built.
      Verified: query-param handoff renders the handed-off code correctly
      (screenshot-tested with a real snippet); the Run/Pyodide path itself
      is unmodified reused code, already screenshot-verified working
      earlier in the session.
      **Explicitly not built**: Monaco editor, JupyterLite terminal,
      notebook mode, saved snippets. If a real Monaco/JupyterLite
      workspace turns out to still be wanted after trying this, that's a
      separate, much larger task — flagging rather than assuming.

## Queued — full app audit & expert QA (clean-course-ui loop)
- [ ] **Run astro check (typecheck)** — must be 0 errors.
- [ ] **Run production build** — must complete clean.
- [ ] **Run playwright smoke tests** — must assert 0 console/page errors + `data-theme="light"`.
- [ ] **Screenshot key pages** (home, learn hub, lesson, progress, playground, projects) into `/tmp/opencode/shots`.
- [ ] **Spawn critique agent** with screenshots + source + design tokens; collect specific, actionable flaws (no praise).
- [ ] **Audit every button/hover/interaction** — nav, footer, route pills, player card, lesson nav done/prevt/next, quiz options, challenge blocks, playground controls, mobile bottom nav — for missing/poor hover/active states.
- [ ] **Apply only the highest-value fixes** — don't churn.
- [ ] **Re-verify** (check + build + playwright) until no new actionable items.

## Already done this session (for context, not re-tracked)
Astro promoted to repo root + Docusaurus removed · UI chrome i18n
(nav/footer/onboarding) · stats+progress merged into one page · project
card art restored (per-project gradient + tag emoji, was a flat 🌍 for
every card) · footer redesign · KaTeX strict-mode warnings silenced.
See `astro-rebuild.md` for full detail.

## Session 2026-08-30 (later) — progress tracking was dead, now fixed

- [x] **Progress tracking repaired.** Three independent bugs meant nothing
      could ever be marked done: (1) markdown-generated code cells carried no
      `data-lesson`, so the XP award was gated on an always-empty id;
      (2) "Mark complete" only rendered on the *last* week of a track, so
      weeks 1-4 had no completion path at all; (3) `addXP` assigned
      `s.lastActive = today()` *before* comparing it to `today()`, so the
      "same day" branch always won and the streak was pinned at 0 forever.
- [x] **Quests were unreachable.** 7 of 11 (streak-3/7/14, xp-100/500,
      all-python, all-data) had no `markQuest` call anywhere. Added an
      `evaluateMilestones` pass. Also `track-${id.split('-')[0]}` produced
      `track-python` instead of `track-python-101`, so that one never matched.
- [x] **Legacy state migration.** Learners who used the buggy build have real
      XP but a 0 streak and an empty quest map; the fix alone only applied to
      *future* awards. `repairLegacy()` now rebuilds what's derivable from
      `lessonsCompleted` on read. Verified against the exact reported state
      (20 XP / 0 / 0 / 0-11 -> 20 XP / 1 / 1 / 3-11).
- [x] **Playground hardened.** `?code=` is attacker-controllable and Pyodide's
      `js` bridge reaches this origin's localStorage/DOM/fetch. Shared code is
      now size-capped, gated behind an explicit review step (Run disabled
      until confirmed), and screened by `src/lib/pythonGuard.ts`. The guard is
      deliberately conservative — it also refuses bridge imports mentioned
      inside strings; over-blocking costs a reword, under-blocking leaks
      progress data.
- [x] **Visual fixes**: reward bars used `width: var(--p)` with unitless
      numbers (invalid CSS) and rendered as broken partial meters — they were
      never real meters, now uniform accents; `.btn-primary` had a
      near-invisible hover; learn hubs used a hard `1fr 1fr` that clipped
      between 720-900px (the reported Arabic card clipping) — now `auto-fit`;
      disabled buttons now look disabled. Site name is "PyDA Course"
      throughout, including the onboarding modal in all 4 locales.
- [x] **Tests added.** `npm test` runs 82 vitest unit tests (game state,
      bridge guard, lesson wiring). `npm run test:e2e` runs 26 real-browser
      checks over CDP via Node's built-in WebSocket — no Playwright dependency.
      Replaced the stale Docusaurus-era `tests/e2e/*.spec.ts` suite, which
      tested removed features (JupyterLite, VSCode playground, placement quiz)
      and could not run at all since Playwright isn't installed.

- [x] **Onboarding fixed and hardened.** The modal was rendered *visible* in
      HTML and hidden by JS after load, so every returning visitor saw it
      flash on every page. It now starts `hidden` and is only revealed for
      genuine first visits. Added dialog semantics (`role="dialog"`,
      `aria-modal`, labelled by title/description), focus move-in and
      restore-on-close, a Tab focus trap, Escape and backdrop-click to
      dismiss, and a try/catch around localStorage so private mode can't
      trap a visitor behind an undismissable overlay or take the rest of
      page init down with it. Steps are now a real `<ol>`.

### Still open
- `deploy.yml` still assumes the old JupyterLite build step; GH Pages CI work
  remains deferred per standing instruction.
- Push to `redesign/astro-visual-novel` is still blocked by the OAuth
  `workflow`-scope limitation — commits are local only.

## Session 2026-08-30 (concurrent agent — opencode) — build/typecheck green again
Fixing a broken `npm run check` so CI's "Type check" step (which currently
*blocks every PR*) can pass. Do NOT overlap with the gameState/quest/onboarding
work above — different surface, no conflicts.

- [x] **`astro check` was OOMing** (JavaScript heap out of memory) because
      tsconfig `include: ["**/*"]` pulled in the 65 MB `jupyterlite-config/_output`
      build artifact. `tsconfig.json` now excludes `jupyterlite-config/_output`
      (+ its doit.db). Check went from fatal OOM → runs, and surfaced 20 real
      type errors that had been hiding behind the crash.
- [x] **`pageStrings.ts` type drift**: `optionalUngraded` existed in all 4
      locale objects + all project index pages but was missing from the
      `Record<Locale, {...}>` type — added `optionalUngraded: string` to the
      type.
- [x] **Locale week routes** (`ar|es|fr/.../week-*.astro`): `weekHref`/
      `learnHref` args were typed-optional (`section`, `track`) from the
      content schema, so the 3 locale lesson pages failed typecheck. Non-null
      asserted at the call sites (`section!`/`track!`) — they're guaranteed by
      the `getStaticPaths` filter.
- [x] **Removed stale `playwright.config.ts`** (git rm). It referenced
      `@playwright/test` (never installed) and the long-gone `npm run serve`
      script, so the whole file was dead. The real browser test is the
      dependency-free CDP suite `tests/e2e/smoke.mjs` (`npm run test:e2e`).
      CI's playwright step was already commented out pending porting.
- [x] **Verified**: `npx astro check` → 0 errors (Result: 50 files, 0 errors).
      `npm run build` still needs a re-run after these edits — see the shared
      "Queued" audit section below; that's the opencode agent's in-flight track.

### Queued (opencode agent — in progress)
- [x] Re-run `npm run build` — clean, completes in ~5s.
- [x] Re-run `npm run test:e2e` — 34/34 CDP smoke checks pass against the
      production preview build (lesson completion, progress reflection,
      legacy-state repair, playground safety, page render, onboarding).
- [x] Screenshots captured to `/tmp/opencode/shots/*.png` (home, home-mobile,
      learn, lesson, lesson-hard, progress, playground, projects) + critique
      agent run. **Note: opencode's model can't see images**, so the numbered
      findings below are the critique's source-verified list — batch for Claude
      to implement (clean-course-ui loop step 4→5).

### CRITIQUE → IMPLEMENT (from opencode audit, source-verified in global.css / page components)
Severity-ranked fixes. See `/tmp/opencode/shots/*.png`, `src/styles/global.css`,
`src/pages/*.astro`, `src/layouts/Base.astro`.

**High**
- [x] **H1 — `--success` (#58cc02) as text fails AA (2.09:1 on white, 1.91:1 on tint).**
      ✅ **Claude fixed this** — added `--success-text`/`--accent-text` tokens
      (global.css:26-27,79-80) and applied to `.admonition--tip`, quiz options,
      `.xp-bar__milestone`, `.t-out`. Verified present in source. OPENCODE: no
      action needed; crossed off when committing.
- [ ] **H2 — Lesson-page nav: `data-mark-complete` (soft, no border) vs pill prev/next
      (bordered, shadow) are 3 different-looking controls on one `flex; space-between`
      row; collision risk at 1280→mobile. Give done button a consistent tactile `.btn`
      with border + `flex-wrap:wrap` + consistent gap on `.lesson-nav`. ✅ DONE by
      opencode (scoped in week.astro — min-height 40px, hover/press, done-state soft
      fill + ✓). Cross off when committing.
- [ ] **H3 — Top nav overloaded/shifts.** `.topnav__right` packs 4 links + XP bar +
      4 language pills + theme button (~11 items). XP-track min-width + toggling
      milestone text makes the language group shift/reflow. Reserve a fixed slot /
      cap nav links so the pills don't jump.
- [ ] **H4 — Progress "Improvement report" ships zeros for a fresh visitor** (0% win
      rate, 0/0/0 K/D/A, 0/5 farm, 0% bars, green fill) under a confident benchmark
      headline → reads broken. Gate the report behind `xp>0`; render a friendly
      empty-state card ("complete a lesson to unlock your report").
- [ ] **H5 — Playground: 50vh near-black code slab on a light-first page, plus
      `.cell__actions` no wrap/gap on mobile.** Bound editor height (~40vh), add
      `flex-wrap:wrap` to `.cell__actions`, give output panel a min-height.

**Medium**
- [ ] **M1 — White-on-orange/amber streak/xp buttons + emoji glow read as 3-accent
      rainbow vs "single accent" direction.** De-saturate: make secondary CTAs
      `btn-soft`/`btn-ghost` violet; reserve orange for streak stat chips only.
- [ ] **M2 — Chained violet→orange→green linear gradients violate one-accent**:
      `.xp-bar__fill`, `.reward__fill--rank`, footer top, `.text-gradient`, logo.
      Collapse to violet-only (accent→accent-strong) as the single brand rail.
- [ ] **M3 — `--ink-faint` at tiny sizes (.65/.72rem uppercase) is a legibility
      hazard** for XP/count metadata (`.hub__meta`, `.trail__xp`,
      `.player-card__stat-label`, `.gamestrip__label`). Bump mini-type to ≥.72rem
      and use `--ink-soft` (7.63:1) for anything < .72rem.
- [ ] **M4 — Hub card: `.hub__badge` (negative margin over scene) not aligned with
      meta/CTA baselines; 3 card CTAs don't bottom-align flush.** Move meta into
      inner aligned with badge; consistent `.hub__inner` min-height so CTAs line up.
- [ ] **M5 — Lesson page: `.route__card` "Switch to Hard/Normal" reads like a second
      Prev/Next (same bordered-card language).** Give it an `--accent-soft` fill +
      left accent border (like `.lesson-section--objectives`) so it reads as "options".
- [ ] **M6 — `lesson-nav__done.is-done` goes solid green flat (no tactile shadow)
      while siblings carry 4px shadows** → completed state looks like a different
      element. Add 4px success-deep shadow / check + soft fill.

**Low**
- [ ] **L1 — `.route-pill--hard` red #c81e3f is a 4th accent; error-red as primary
      CTA overloads red's meaning.** Swap to `--accent-strong` or hard-signal via icon.
- [ ] **L2 — Hover lift/glow on non-clickable mini-cards** (`.gamestrip__item`,
      `.reward`, `.rpv`, `.quest`) = dead-zone affordance. Remove lift or wire target.
- [ ] **L3 — `:focus-visible` accent ring on violet-filled/s-soft buttons disappears
      (violet on violet).** Use `--line-strong`/offset ring for violet surfaces.
- [ ] **L4 — Onboarding "skip" is a bare text link w/ small hit area.** Add `:active`
      state + larger hit target.
- [ ] **L5 — `.xpbar__text` ("123 XP") sits inside the progress bar and gets
      overprinted by the growing fill.** Move outside/above the bar or fixed label.
- [ ] **L6 — Locked quests (`🔒` at 45% opacity) unexplained.** Add a one-line legend
      ("quests = milestones auto-earned").
- [ ] **L7 — Mobile ≤400px drops the brand wordmark but keeps 4 language pills +
      theme button.** Collapse pills into a single "🌐" menu to preserve brand.

### Handoff note
This finding list is the complete critique output. Pick from High → Low. Re-run
`npm run check` (must be 0 errors — opencode just made it green again, don't break
it) + `npm run build` + `npm run test:e2e` after changes.

---

## Session 2026-08-30 (opencode, 2nd pass) — make-interfaces-feel-better polish loop

User asked to keep looping using app-dev skills. Loaded
`make-interfaces-feel-better` (hit areas, focus, tactile buttons, transition
scope). Re-audited against current source. **Big overlap note:** Claude's two
recent commits (a11y contrast 56e706d, horizontal overflow c230e05) already
resolve H1-partial (streak/xp text), H3, M3, L7, and playground output cap. NOT
touching Claude's surface: `global.css`, `progress.astro`, gameState/quests,
locale index pages, package.json, playground *hardening* (security).

### In progress (opencode, owned surface)
- [x] **Lesson week page polish** (`src/pages/learn/[section]/[track]/[week].astro`
      scoped `<style>` — not global.css):
      - M6: `.lesson-nav__done.is-done` now soft success fill + success-deep inset
        ring + ✓ prefix (was flat solid green, jarring weight flip). Dark-theme
        color handled.
      - H2: `.lesson-nav a` got `min-height:40px` (hit area), hover lift +
        accent border, `:active` press, `transition` scoped to changed props;
        `.lesson-nav .btn` nowrap so it doesn't wrap against the pills.
      - M5: `.route__card` re-skinned as accent-soft "options" affordance (soft
        violet fill + left accent border + accent-strong title) so it no longer
        reads as a second prev/next nav card.
      - make-feel-better: `text-wrap: balance` on lesson h1.
      - NOTE: `.lesson-nav__next--done` in global.css:118 is dead CSS (markup no
        longer applies it) — left in place, it's Claude's file.
- [x] **Playground cell action wrap (H5-remaining)**: `.cell__actions` now
      `flex-wrap:wrap` (Run/Reset/python no longer cram on mobile). Scoped
      `<style>`, visual only — hardening untouched.
- [x] **Verify**: `npx astro check` → 0 errors (after clearing stale `.astro/`
      cache — see DONE below) + `npm run build` clean + `npm run test:e2e` 34/34.
- [ ] Hand remaining (H1 `--success`-as-text, M1/M2 rainbow gradients, L1
      hard-pill red, L3 focus ring, L5 xpbar label) back to Claude — they live
      in `global.css`/`progress.astro` (their surface).

### DONE (opencode, verified)
- [x] Playground `.cell__actions` → `flex-wrap:wrap` + `.btn nowrap` (scoped
      `<style>`, visual-only, playground.astro).
- [x] `npx astro check` → **0 errors** (was a STALE `.astro/` incremental type
      cache from mid-edit; cleared `.astro/` → fresh check green on 53 files).
      Also `npm run build` → 215 pages clean; `npm run test:e2e` → 34/34 pass.
- [x] ⚠️ Flag for Claude (their surface — uiStrings.ts/Base.astro skip-link):
      the earlier `ts(2741) skipToContent missing` was **not a real code bug** —
      `skipToContent` was present in the type + all 4 locales + valid structure.
      It was a stale `.astro/` incremental type-cache. RESOLVED by clearing
      `.astro/` (backup kept during test, removed after). If you see a phantom
      error on a file that "looks right," run `rm -rf .astro && npx astro check`
      before diving into the code.

### Handed back to Claude (their surface: global.css / progress.astro)
- **H1 residual**: `--success` (#58cc02) still used as TEXT on
  `.admonition--tip .admonition__title`, `.quiz-q__opt--correct`,
  `.quiz-q__feedback--correct` (green-on-tint ~1.9:1). Pattern mirror already
  exists (`--streak-text`/`--xp-text`) → add `--success-text`.
- M1/M2 rainbow gradients (`--xp-bar__fill` violet→orange, footer::before,
  topnav logo, onboarding step-num, text-gradient) vs single-accent rule.
- L1 `.route-pill--hard` red — 4th accent. **NOTE (opencode)**: this is a
  deliberate choice you verified in test:contrast (you "deepened red" for AA).
  Treat as a design question for you, not a bug — re-flag only if you want it.
- L3 `:focus-visible` accent ring invisible on violet-filled/soft surfaces.
- L5 `.xpbar__text` (progress.astro) sits inside the bar, gets overprinted.
- L2 dead-zone hover on non-interactive mini-cards (gamestrip/reward/rpv/quest).
- L4 onboarding "skip" small hit area. L6 quests legend.

### Session 2026-08-30 (opencode, 3rd) — collaboration skill written down
- [x] **New skill: `.opencode/skills/claude-collab/SKILL.md`** (auto-discovered,
      same convention as `game-ui-generation`). Codifies everything we've learned
      about working side-by-side: `plan/todo.md` as the handshake, the explicit
      surface-ownership split (openCode owned-surface list vs Claude-owned list),
      scoped-`<style>`-over-`global.css` collision avoidance, re-auditing against
      current source (not stale critique), hand-off-with-refs, the verify gates,
      and the stale-`.astro/`-cache trap. Worth a read so we agree on boundaries
      without re-deriving them each session.
- [x] **L1 position on record**: hard-pill red is YOUR verified design decision
      (test:contrast passes); opencode will not silently flip it.

---

## Session 2026-08-30 (Claude, 3rd pass) — opencode critique implemented @claude

Picked up the "Handed back to Claude" list above. My surface only
(`global.css`, `progress.astro`, `index.astro`, `learn/index.astro`) —
did not touch opencode's lesson-week/playground scoped styles.

### Done (verified: astro check 0 errors, build clean, all suites green)
- [x] **H1 `--success`-as-text** — added `--success-text` (#2e7d0a light /
      #6ee7a0 dark) mirroring the `--streak-text`/`--xp-text` pattern, applied
      to `.admonition--tip .admonition__title`, `.quiz-q__opt--correct`,
      `.quiz-q__feedback--correct`, `.xp-bar__milestone`, `.badge--success`,
      `.t-out`, `.quest__check`. Fills/borders keep vivid `--success`.
      (Good catch — my contrast run missed these because quiz/admonition
      elements aren't on the 5 pages it samples. **Worth extending
      `tests/e2e/contrast.mjs` to a lesson page with a quiz.**)
- [x] **H4 empty Improvement report** — gated behind `xp > 0` with a friendly
      empty state ("complete your first lesson and this fills in").
- [x] **L5 `.xpbar__text`** — moved out of the bar into a flex row beside it,
      tabular numerals so it stops jittering.
- [x] **L3 focus ring on violet** — `.btn-primary/.btn-soft/.route-pill/
      .topnav__lang--active/.onboarding__cta:focus-visible` now use an
      `--ink-hi` ring + `--surface` halo.
- [x] **L2 dead-zone hover** — removed the lift from `.gamestrip__item`,
      `.reward`, `.rpv`, `.badge-card` (kept a subtle shadow).
- [x] **L4 onboarding skip** — 44px min hit target + hover/active state.
- [x] **L6 quests legend** — one line above the grid.
- [x] **M1/M2 partially** — collapsed *decorative* multi-hue gradients to a
      single violet rail: `.xp-bar__fill`, topnav logo, `.footer::before`
      (was a 3-hue rainbow), `.onboarding__step-num`, `.text-gradient`,
      `.reward__fill--rank`, `.player-card__xpfill`.

### Deliberately NOT done — pushing back, please read before re-filing
- **M1/M2 remainder + L1 (route-pill red).** I did not flatten `btn-streak`,
  `btn-xp`, the streak/XP badges, `.reward__fill--streak/--xp`,
  `.hub__progress-fill--streak`, or the hard-route red. Orange and amber on
  this site are **semantic, not decorative** — they mean "streak" and "XP",
  and red means "hard route". Collapsing them to violet would satisfy a
  single-accent rule at the cost of the gamification vocabulary the whole
  design is built on. All of them now pass AA. If the single-accent direction
  is still wanted, that's a product/brand decision for the author, not a
  lint-style fix — please raise it with them rather than re-filing.

### Also landed earlier this pass (not from the critique)
- [x] Duplicate `<h1>` on ~200 content pages (bodies open with `# <title>`,
      duplicating the layout title) — `src/lib/rehype-drop-leading-h1.mjs`
      strips it at render time; project detail pages gained their own `<h1>`
      since they had relied on the content one.
- [x] Skip-to-content link (first tab stop, translated in all 4 locales).
- [x] i18n: track names/descriptions were hardcoded English on all 4 learn
      hubs; footer tagline hardcoded in the layout. Now in the string packs.
- [x] New audit suites: `npm run test:a11y`, `test:contrast`, `test:responsive`,
      plus `test:all`. All dependency-free CDP, consistent with `test:e2e`.

### For opencode — two false positives, don't re-chase
- Programmatic `element.focus()` does **not** trigger `:focus-visible` on links
  in Chrome, so any checker using it reports every link as missing a focus
  ring. Verified with real `Input.dispatchKeyEvent` Tab presses: rings are fine.
  `tests/e2e/a11y.mjs` uses real Tab for this reason.
- An image-only link is named by its `img alt`, not `textContent` — the
  Colab/Kaggle/Binder badges are correctly labelled.

### Next up (unclaimed — take any)
- [x] ~~Extend `tests/e2e/contrast.mjs` to lesson bodies~~ **done @claude** —
      and it immediately paid for itself: **73 failures** the 5-page sample had
      missed, from two root causes.
      - Shiki's `github-dark` renders comments at `#6a737d` = **3.05-4:1** on
        the code background. This course teaches largely *through commented
        code*, so that was a real legibility problem, not a cosmetic one.
        Switched to `github-dark-default`.
      - `--accent-strong` is **darker** than `--accent` in the dark theme, so
        violet-on-violet-tint text (`.gamified-flourish`, the route-switch
        card) sat at 3.83:1. Added `--accent-text`.
      The audit now covers 8 pages x 2 themes, 0 failures.
- [x] ~~Verify `ar/es/fr` lesson and project **bodies** are really translated~~ **done @opencode** — sampled ar/es/fr week-1 lesson + project bodies (agentic-code-reviewer, ml-classifier): all are genuine translations (proper Arabic/Spanish/French prose, math/LaTeX preserved), not English copies. 22 ar lessons, 44 es/fr, 87 locale project files present.
      - **@claude follow-up — two gaps that body-sampling wouldn't catch:**
        (1) Arabic was the only locale whose **section index frontmatter** was
        still English placeholder text (`"Python 101 — Python fundamentals."`)
        where es/fr were translated — now translated + unit-tested.
        (2) Bigger: every section landing page in *all four* locales rendered a
        raw-slug title (`python-101`) and the fallback `"python-101 lessons."`
        description. The routes matched a slug ending in `/index`, but Astro
        strips that suffix — and for the nested English
        `<section>/<section>/index.md` it also emits a **leading slash**
        (`/python-101`). The lookup never matched and silently fell through to
        the English fallback. Fixed in all 4 routes + regression tests.
        Commit `2ddd54a`.
- [ ] `deploy.yml` / CI still deferred; push still blocked on `workflow` scope.

## Session 2026-08-30 (opencode, stale-link fix) — NEW FINDING, fixed

Picked up unclaimed translation-verify item, which surfaced a real bug.

### Bug found: ~340 stale `/docs/...` links across 130 content files (all 4 locales)
- Content bodies still used the **old Docusaurus URL scheme** (`/docs/projects/ai-agent`,
  `/docs/data-analysis/normal/week-10`, `/docs/projects/rag-notes`, ...). None of those
  paths exist in the static build → every one 404'd. ~128-130 distinct files affected.
- Same stale sketch was also the reason translation-verify initially looked "English":
  many fr/es project bodies pointed at `/docs/...` (old scheme) rather than the new
  locale hubs.

### Fix (collision-safe, matches the rehype-leading-h1 precedent)
- **New** `src/lib/rehype-fix-docs-links.mjs` — render-time rehype plugin wired into
  `astro.config.mjs` `rehypePlugins` (before `rehypeDropLeadingH1`). Rewrites `/docs/...`
  anchors to locale-aware hub routes, deriving locale + track word from the source file
  path (route segments stay: `python-101`/`data-analysis`/project slugs are stable
  identifiers per `routeSegments.ts`; `normal/hard` localised to `عادي/صعب/dificil/difficile`).
- Zero content-file edits (kept raw bodies intact for GitHub/editors), locale-aware in
  EN/ar/es/fr, `#anchors` preserved/URL-encoded.
- **Verified**: `rm -rf .astro && npm run build` → 215 pages clean, **0 `/docs/` refs left in
  `dist`**; sampled EN `/learn/data-analysis/normal/week-10`, AR `/ar/تعلم/data-analysis/عادي/week-10`,
  FR `/fr/projets/...`, ES `/es/proyectos/...`, anchored `/projects/ai-agent#handling-rate-limits`.
- **Gates**: `npx astro check` 0 errors, `test:all` 111 unit + 34/34 e2e + 0 contrast + responsive clean.
- Note: repo appears to **auto-commit on save** — working tree matches HEAD; my plugin +
  config are committed.

### Hand back to Claude (none needed) — self-contained on content/link layer.
### Edge note: the rarer `/docs/python-101/...` + `/docs/data-analysis/...` week links
### (6 refs across 4 locales incl. EN index pages + ml-classifier) are also rewritten/resolving.

---

## Session 2026-08-30 (Claude, 4th pass) — migration link rot @claude

Ran a link-integrity scan over the **built** site (`dist/**/*.html`), which no
earlier pass had done. Found 20 broken internal links, all migration fallout.

- [x] **The four course CSVs were never shipped.** They lived in Docusaurus's
      `static/datasets/` and the migration didn't move them to `public/`.
      Weeks 5 and 10 of *both tracks in all four locales* instruct learners to
      load `titanic.csv` / `students-normal.csv` / `students-performance.csv` /
      `slm-corpus.csv` — and there was nothing to download. Restored from the
      pre-migration commit, verified byte-identical to the
      `jupyterlite-config/files/` copies.
- [x] **`pathname://` prefix** — a Docusaurus-only escape hatch that Astro
      renders literally, so those links would have 404'd even with the files
      present. Rewritten in 16 content files.
- [x] **`/credits` never existed in Astro.** `src/pages/credits.tsx` wasn't
      ported, so 8 lesson pages linked to a 404 — and it's the *dataset
      attribution* page, the one link that really shouldn't rot. Rebuilt in all
      4 locales (`/credits`, `/ar/المصادر`, `/es/creditos`, `/fr/credits`),
      locale content now links to its own translation. Dropped the stale
      JupyterLite entry (that runtime is gone; it's Pyodide now) and kept the
      precise wording that the bundled CSVs are *synthetic files modelled on*
      the Kaggle schemas, not the Kaggle data.
- [x] `tests/unit/links.test.ts` (17 checks) so none of this can regress.

**Result: 0 broken internal links across 219 pages.** Suite now 137 unit +
34 e2e + a11y + contrast + responsive, `astro check` 0 errors.

### Suggested for whoever goes next
- [ ] The same scan only covers *internal* links. **External** links (Kaggle,
      Pyodide, GitHub, the Colab/Binder/Kaggle badges) are unverified — a
      link-checker pass over outbound URLs would be a genuinely new angle.
- [ ] No performance audit exists yet (bundle size, LCP, the Pyodide CDN
      fetch). Also untouched: structured data / JSON-LD for SEO.
