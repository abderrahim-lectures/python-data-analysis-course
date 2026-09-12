# UI/UX Deep Review — PyDA Course

Date: 2026-09-09
Scope: every page type x all 4 locales (en, ar=RTL, es, fr). Method: live CDP sweep
(console errors, overflow, RTL geometry, h1/main), source audit of all shared
components, WCAG + i18n pass, and direct verification of every High finding
against the current source. Clean working tree at review time (commit `c9d2f1f`).

## What is healthy (verified, no action needed)

- **Zero console/page errors** on every page type x locale touched in the sweep
  (home, progress, playground, learn hub, section, track, lesson, module,
  projects, project detail, credits, cheatsheets, and the same set in ar/es/fr).
- **No horizontal overflow** at any tested width for the audited pages.
- **Exactly one `<h1>` and one `<main>`** per page; `dir`/`lang` are correct on
  every audited page (ar pages `dir="rtl" lang="ar"`, es/fr `ltr`).
- **Full 4-locale content parity**: lesson/module/project trees are 1:1 across
  locales (135 projects, 19 normal python lessons, etc.). Lesson/module slugs
  stay untranslated as designed (stable identity keys); project *URL* slugs
  are localized per locale (2026-09-11) with the English slug kept as an
  alias route pointing `rel=canonical` at the localized URL, navigational
  words localize via paraglide.
- **Localization catalogs are complete and correct**: sampled `project_completed`,
  `project_done_hint`, `project_mark_done`, `quiz_*` across ar/es/fr.
- Test suites already cover EN journeys: `test:a11y`, `test:contrast`,
  `test:responsive`, `test:e2e` (44 CDP checks), `test:hreflang`, plus 1086 unit
  tests including `recordQuiz`/`recordQuizPerfect` (gameState.test.ts:477-507).

## Severity legend
- **HIGH** — correctness bug, WCAG violation, or untranslated content on a
  localized page. Ship-blocking or disorienting.
- **MED** — real but lower impact / conditional.
- **LOW** — polish, token purity, or copy clarity.

---

## A. Quiz XP is dead: displayed reward never awarded (HIGH, CORRECTNESS)

**Finding.** `Quiz.astro` advertises `+10 XP` in the header (`Quiz.astro:25`) and
`🎉 Perfect! +{xp} XP` on a perfect score (`:106`), but the only gameState call it
makes is `recordChallenge(lessonId)` on a perfect score (`:109-111`). The two
functions that actually credit quiz XP — `recordQuiz(correct)` (+5 per correct,
`gameState.ts:280`) and `recordQuizPerfect()` (+25 perfect, `:296`) — are defined
and unit-tested but **never imported or called by `Quiz.astro`** (the component
that renders the hard-track `quiz:` frontmatter quizzes via
`LessonPage.astro:113`).

(Scope note: the *other* quiz path — the markdown `.quiz[data-quiz]` WeeklyQuiz
blocks handled by `src/lib/quiz.client.ts` — **already** calls `recordQuiz` per
answered question. The dead path reviewed and fixed here is `Quiz.astro` only.)

**Consequence.** Completing a quiz awards no XP and does not move `quizCorrect`/
`quizTotal` in `pda:state`, so the progress page's win-rate and quiz metrics never
advance. A learner who relies on the visible `+10 XP` reward is silently shorted.

**Fix (done in this review, component is opencode surface).** Import
`recordQuiz`/`recordQuizPerfect` into the Quiz script; call `recordQuiz(true)`
per correct answer and `recordQuizPerfect()` on a perfect score (keep
`recordChallenge`). Add an e2e assertion that a perfect quiz advances XP.
This is deliberately conservative: per-question correct => `recordQuiz(true)`,
and `recordQuiz(false)` for any wrong answer so `quizTotal` counts attempts.

---

## B. Quiz radio inputs are `display:none` — keyboard-inaccessible (HIGH, A11Y)

**Finding.** `Quiz.astro:180` — `.quiz-q__opt input { display: none }`. A hidden
input is removed from the **tab order and the accessibility tree**. Keyboard and
screen-reader users cannot tab to, select, or hear the options; only pointer
clicking works.

**Fix (done).** Replace `display:none` with a true `visually-hidden` (1px absolute
clip) so the native radio stays in the tab order and a11y tree, add a visible
`input:focus-visible` ring (`.quiz-q__opt:has(input:focus-visible)`) and a
`checked` state on the label. This keeps the current custom-radio look while
restoring keyboard operability.

---

## C. Quiz retry logic double-fires (HIGH, CORRECTNESS)

**Finding.** `Quiz.astro:69-137`. The outer `click` handler (grades) is **never
detached** when the button becomes "Retry". Each retry click fires both the outer
handler (re-grades, flashes `score`/`feedback`, re-adds another retry listener)
**and** the previous `{once:true}` reset listener. On repeated clicks the
listeners accumulate (`L2, L3, …`), the "% correct" flashes/drifts, and
`recordQuiz` can be called more than once per attempt — over-crediting XP.

**Fix (done).** Introduce an explicit `checked`/state guard in the script so the
outer handler runs only in "check" state and a single handler toggles check/retry
(no stacked `once` listeners).

---

## D. ProgressPage conflates lessons and modules — bars and XP are wrong (HIGH, CORRECTNESS)

**Finding (verified).** `trackProgress(trackId, totalLessons)` counts **lessons**
done (`gameState.ts:428-439`); `python-101/normal` has **19 lessons** but the page
passes `7` as the total (`ProgressPage.astro:24,506`). The trails render 7
"Module 1..7" stations that light when `w <= done` (`:30-37,204,509-513`), so:
- after ~7 lesson completions every python station reads "done" although ~12
  lessons remain — misleading "100%";
- completing all lessons gives "19/7 done" and a `pct` **over 100%**;
- `progress_xp_earned({n: py.done * 100})` (`:214,236,515`) renders
  "+{done}00 XP" — a fabricated unit (no lesson/module awards 100 XP).

Note: `9fc2997` already fixed the *other half* of this (python total 5→7,
server/client week loops now agree). What remains here is the **semantic
conflation**: `done` counts unique lessons, `total` is a module count, and the
stations light on a lesson-derived `done`. `trackProgress` de-dupes normal vs
hard lessons by slug (alternative tracks share stations), which compounds the
labels.

**Ownership.** `ProgressPage.astro` / `progress.astro` are Claude-owned (progress
surface). **Handed back** via `plan/todo.md` with exact refs. Concrete options:
(a) count completed **modules** (map lessons→module, count modules where ≥1 lesson
done) and show per-module stations that reflect actual lesson completion, or
(b) keep lesson-count semantics but relabel the stations "Lessons" and use the real
lesson total (19/10/…), not the module count, so `pct` can never exceed 100 and the
"done" text matches reality. The XP line should be driven by `gameState` award
paths, not `done * 100`.

---

## E. ProgressPage activity-log total is frozen at 0 (HIGH, CORRECTNESS)

**Finding (verified).** `ProgressPage.astro:268` renders
`actlog-total` from `actStats.totalActions` computed **at build/SSR** (`:28`),
where `getActivityStats()` reads a server-side `emptyStats()` → always 0. The
client `render()` (`:478-583`) sets many ids but never `actlog-total`, so the
"actions" badge stays "0" forever even after real activity populates the log.

**Ownership.** Claude-owned. **Handed back**: set `actlog-total` in the client
`render()` from `getActivityStats().totalActions` (with a localized label), like
the other live counters.

---

## F. Untranslated string choices on localized pages (HIGH, i18n)

The site ships 4 locales but several top-level/lesson surfaces hardcode English:

- **`404.astro:24-28`** — `lang="en" dir="ltr"`, "404 — page not found",
  "That page doesn't exist…", "Back to the homepage" are literal English on the
  same route served to ar/es/fr users (including a broken `/ar/…` path or a shared
  `/playground/<code>` link opened from any locale). **Handed back** (404 is a
  shared/route-level surface): detect the locale from the failed path and localize,
  or use `m.*` messages.
- **`RelatedProjects.astro:46-48`** — `aria-label="Related projects"`, heading
  "🚀 Keep building", lead "Put this lesson's skills to work in a guided project:"
  hardcoded English on ar/es/fr lesson pages. **MED severity** (secondary block);
  needs 3 new message keys — **handed back** (shared catalog change).
- **`ProjectDetail.astro:89,91,179`** — `⏱ {n} min`, `＋{n} XP per step`, and the
  CSS `::after { content: '✅ cleared · +15 XP' }`. All English; the CSS `content`
  can't be localized without a `data-*`/JS injection. Opencode component.
- **`playground.astro:14-22`** — `title`, `lang="en"`, "Full-screen editor",
  "Write and run any Python here…" literal English, though the route is shared
  across locales (the EN word `/playground` is a deliberate design choice, but the
  copy should still localize per-route). **Handed back** (route-level + language
  detection interplay).
- **`LearnerActivity.astro:16`** — "learning now" hardcoded English on the fixed
  bottom bar for ar/es/fr. Also no `aria-live`, no dismiss, `bottom:0` overlaps
  the mobile nav, and the offline placeholder is "—" (ambiguous). **Handed back**
  (Claude-owned global infra).

---

## G. RTL: module/link arrows and hover transforms point the wrong way (MED, i18n)

Physical `translateX`/`left`/`right` remain in several components; the arrow glyph
flips but the motion/placement does not:

- **`ModuleNav.astro:18,21`** — `←`/`→` hardcoded regardless of locale, and
  `justify-self: start/end` (`:34-35`) is physical grid alignment, so the
  prev/next order does not mirror in Arabic. Needs `locale` (or CSS `[dir]`
  flip). Handed back (threading `locale` through ModulePage→ModuleNav).
- **`ModulePage.astro:131`**, **`TrackHub.astro:116`**,
  **`SectionLanding.astro:120`** — `.module-card__arrow { transform: translateX(4px) }`
  always moves right on hover, even for Arabic where the flipped `←` arrow is the
  *forward* direction. Use `translateX` based on `dir` (or a logical transform).
- **`ModulePage.astro:81`** — renders the **raw difficulty enum**
  (`beginner`/`intermediate`/`advanced`) as text on ar/es/fr pages; must be
  `m[\`difficulty_${d}\`]()`. TrackHub/SectionLanding already localize this — the
  lesson list on ModulePage was missed.

---

## H. Token drift — hardcoded colors bypass the design tokens (MED, consistency)

All of these break the "one accent, light-first, theme-aware" system and will
misfire in dark mode (`--accent`/`--success`/`--bad` flip per theme; raw hexes don't):

- **`Quiz.astro:202-216,245-249`** — `#22c55e`, `rgba(34,197,94,.08)`,
  `#ef4444`, `rgba(239,68,68,.08)`, `#16a34a`, `#d97706`, `#dc2626`, `#fff`,
  `#7c3aed`, `#6d28d9` instead of `--success*`, `--bad*`, `--warn`,
  `--accent*`. **Fixed in this review** (opencode component).
- **`styles/projects.css:49`** — `.diff-pill[data-diff=""] .is-active { background:#5b21b6 }`
  hardcodes violet `#5b21b6` while the canonical token is `--accent` (`#7c3aed`,
  flips to `#a78bfa` in dark). **Fixed in this review** → `var(--accent)`.
- **`LearnerActivity.astro:36`** — `.learner-bar__dot { background:#22c55e }`
  → `var(--success)`. Handed back.
- **`ProjectDetail.astro:192`** — `background: rgba(34,197,94,.08)` →
  `var(--success-soft)`. Opencode component.

---

## I. Data/copy accuracy nits (LOW–MED)

- **`LearnHub.astro:58`** — `⚡ {lessons * 100} XP` hardcodes 100 XP/lesson, but
  hard-track lessons award 150 and the real per-lesson award is 60 (`XP.LESSON`).
  The number is a decorating estimate; either relabel "up to" or compute from
  actual awards.
- **`LearnHub.astro:59`** — `📖 {modules} {module_label()}` mixes modules count
  with the lesson-based XP above; fine once the XP math is fixed.
- **`ModulePage.astro:55`** — shows `~{estimatedHours}h` *and* `{totalMinutes} min`
  from two sources that can disagree; pick one, use integer minutes.
- **`ProgressPage.astro:166,491`** — `` `${sp.current}🔥` `` hardcodes the flame
  after the numeral; in RTL the emoji/order reads oddly. Prefer a localized
  template.
- **`ProjectDetail.astro:150`** — step button `aria-label "…(i+1)"` uses the DOM
  index, not the parsed step number; steps in a page that skip numbers are
  mislabeled.

---

## J. Improvement opportunities from web research (no code change yet)

Synthesis of 2026 ed-tech guidance (Studio Mesa, GitNexa, Maatos, Tribulant matters
for this codebase):
1. **Persistent progress in navigation** — show lesson completion next to each
   module/lesson in the track/lesson lists, not only on the separate progress page
   (this is the highest-leverage, low-effort improvement; the site already tracks
   completion, it just doesn't surface it inline).
2. **Progressive disclosure / fewer simultaneous empty blocks** — the progress
   page renders Trails + Quests + Activity Log + Improvement report at once, most
   empty for a new learner (`ProgressPage`); collapse until there is data.
3. **Mobile-first touch targets** — audit buttons/pills to ≥44×44px (route pills,
   module cards, quiz options); several are ~36px.
4. **Contextual "what's next"** — the lesson page already has prev/next + a route
   card; consider a clear "up next" affordance and inline module progress.
5. **Instant feedback + explanations** — the quiz shows explanations for every
   question at once on check; gating per-question after answering would keep
   wrong answers as teaching moments.
6. **Consistent interaction language** — unify card hover (arrow translate) and
   focus-visible across ModulePage/TrackHub/SectionLanding.
7. **Reading level / scannability** — keep lesson intros short and front-loaded;
   existing `learningObjectives` block already does this well.

Track completion-rate, drop-off, and quiz-per-question data (possible via the
existing Supabase `PopularPages`/`PageViews` plumbing) rather than only page views.

---

## Severity-ordered action list

| # | Item | Sev | File | Status |
|---|------|-----|------|--------|
| 1 | Quiz never awards XP (recordQuiz/Perfect dead) | HIGH | Quiz.astro | **fixed** (this review) |
| 2 | Quiz radios `display:none` (keyboard-inaccessible) | HIGH | Quiz.astro | **fixed** |
| 3 | Quiz retry double-fires + XP over-credit | HIGH | Quiz.astro | **fixed** |
| 4 | Progress bars: lesson/module conflation, pct>100, fake XP | HIGH | ProgressPage.astro | **fixed** (module-reached counting, real xpEarnedOn) |
| 5 | Activity-log total frozen at 0 | HIGH | ProgressPage.astro | **fixed** (client `#actlog-total` from `getActivityStats`) |
| 6 | Untranslated 404 / playground / LearnerActivity | HIGH | 404, playground, LearnerActivity | **fixed** (404 locale-aware; playground N/A — per-locale pages exist; LearnerActivity localized+dismissed) |
| 7 | RelatedProjects EN copy + wrong icon feed | MED | RelatedProjects.astro | **fixed** (3 new `related_*` keys; icon was fixed earlier) |
| 8 | RTL arrows/hover + raw difficulty enum | MED | ModuleNav/ModulePage/TrackHub/SectionLanding | **fixed** (CSS `[dir=rtl]` flips; `difficulty_*` messages) |
| 9 | Token drift (Quiz, projects.css, LearnerActivity, ProjectDetail) | MED | multiple | **fixed** (Quiz + projects.css earlier; LearnerActivity `var(--success)`; ProjectDetail success-soft earlier) |
| 10 | XP/copy accuracy (LearnHub, ModulePage minutes) | LOW | LearnHub/ModulePage | **fixed** (summed `xpReward`; single-unit time) |
| 11 | Step aria-label index vs parsed number | LOW | ProjectDetail.astro | **fixed** (parsed `idx+1`, DOM fallback) |

## Gates
All green at current HEAD: `astro check` 0 errors · `npm test` 1086/1086 · build 877
pages · `test:e2e` 49/49 · `test:a11y` 0 · `test:contrast` 0 · `test:responsive` 0 ·
`test:hreflang` 40/40.

## Notes for the other agent (Claude)
- Per user directive ("ignore claude too"), all previously handed-back items were
  implemented by opencode in this session (items 4–11 above). No handoff remains;
  both agents own the full surface. Do not re-implement any of these fixes.
- Remaining open items from section J (inline progress in nav, progressive
  disclosure, touch-target audit, per-question quiz feedback) are enhancement
  ideas, not bugs — no code change yet.
