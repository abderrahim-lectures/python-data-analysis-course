# Production Audit — Sep 2026

**Branch:** `redesign/astro-visual-novel`
**Method:** Real screenshots (CDP, 21 captures), runtime layout geometry at 320/375/414 px, Supabase/GA code review, gameState.ts economy audit, content/translation spot-checks, README vs shipped feature comparison.
**Claim:** "brutally honest."

---

## Verdict

**Ship the mobile fixes in this batch. The economy copy-vs-code drift (F1/F2/F3) and privacy divergence (F5) are the real blockers before any public launch.**

| # | Severity | Area | Finding |
|---|----------|------|---------|
| F1 | **HIGH** | Economy / correctness | Lessons advertise `xpReward` (10/50/100/150/200 XP) on headings, module pages, and summed into hub track totals — but `gameState.ts` awards a flat `LESSON_COMPLETE: 60` for every lesson, ignoring `xpReward` entirely. Displayed reward never equals awarded reward. |
| F2 | **HIGH** | Economy / copy drift | `STREAK_MILESTONE: 30` defined but **never awarded** anywhere in `gameState.ts`. Progress guide copy (`progress_guide_streak_bonus`) promises "streak milestones (3/7/14/30 days) pay a 30 XP bonus." Copy documents a reward the code doesn't pay. |
| F3 | **MED** | Economy / dead code | `awardDailyLogin()` has **zero callers** anywhere in the codebase. The +5 daily login XP and "Daily login" badge never fire. Progress guide copy ("on top of your daily login") references an economy path that doesn't exist. |
| F4 | **MED** | i18n | `markQuest` badge labels are hard-coded English strings (`'First Step'`, `'Explorer'`, etc.). AR/ES/FR progress pages show English badge names. |
| F5 | **MED** | Privacy / consent | GA4 is consent-gated (`pda:analytics-consent`), but nothing sets that key — GA never fires. Supabase pageviews/learners/completions run ungated on every page load. No privacy notice, consent mechanism, or opt-out exists. `referrer` (up to 500 chars) captured into `pageviews` with no consent. |
| F6 | **MED** | Security (by design) | Supabase anon key embedded in every HTML page. RLS is coarse: `select using (true)` / `with check (true)` on all three tables. Anyone can read every row and spam-insert. `update using (true)` on `learners` lets anyone heartbeat-bump any UUID. Documented honestly in `supabase/schema.sql` — no auth exists to fix it. Acceptable for social-proof widgets; note for hardening later. |
| F7 | **LOW** | Supply chain | Pyodide loaded from `cdn.jsdelivr.net` — version pinned (`v0.26.4`) but no SRI subresource integrity. jsdelivr compromise → arbitrary page-scoped code execution. |
| F8 | **LOW** | README / docs | 4 screenshot `.webp` files referenced in README (`homepage.webp`, `lesson-page.webp`, `progress-page.webp`, `mobile-lesson.webp`) don't exist in the repo. Broken README assets. |
| F9 | **LOW** | CI / build | `.github/workflows/deploy.yml` still builds JupyterLite (`jupyter lite build`, lines 30–48) and merges into `build/lite`. Vestigial — the site runs Pyodide, not JupyterLite. Dead build time. |
| F10 | **INFO** | Security | `pythonGuard` regex is bypassable via Unicode escapes (e.g., `import \u006as`). Impact is self-only (attacker on their own page accessing their own `localStorage`); not a real attacker vector against other users. |
| F11 | **INFO** | Content | Lesson 01-printing's KaTeX formula overflows the 288px column at 320px (contained inside `overflow-x: auto`; user must scroll horizontally to read the math). Minor authoring note — wide formulas in narrow columns. |

---

## What's already good

- **49 lessons × 4 locales, 22 modules × 4 locales, 135 projects × 4 locales** — counts all match homepage/hub copy and README claims.
- **Quest count:** `questsToShow()` returns exactly **31** entries — matches "31 quests" in plan/persistence.md.
- **XP values** in `gameState.ts` match `plan/testing-and-verification.md` (lesson complete 60, milestone 25).
- **AR translation quality** (sampled: Python 101/14-string-slicing) is genuinely excellent — literary Fusha, clean Arabic typography, correct tanween and math annotations. No quality compromise vs English.
- **Quiz radio a11y** (`display:none` on inputs): **fixed** in the current uncommitted batch (no longer in codebase).
- **Mobile overflow bugs** (hero gutter cascade, projects list/grid card clip, playground cell action bar at 320px): all **fixed** in this batch, verified via CDP at 320/375/414.
- **`plan/uiux-review.md`** already documents A–F findings (quiz XP dead, radio a11y, retry double-fire, progress bars wrong, activity log frozen, untranslated strings) — the known backlog.
- **Supabase schema** (`supabase/schema.sql`) is honest about RLS limitations (documented in SQL comments).
- **Notebooks:** 196 `.ipynb` files across `notebooks/{ar,es,fr}` (49 lessons × 4 locales). Per-lesson, not per-project. README claim holds.
- **No leaked keys** in repo history or working tree (only `.env.example` placeholders).

---

## Mobile fixes (this batch — ship these)

| File | What changed |
|------|-------------|
| `src/styles/global.css` | Moved `.hero`/`.hero__grid`/`.hero__lead` mobile overrides to a `@media` block placed AFTER the base hero rules (was silently dead due to cascade ordering). Added `.cell__actions { gap: .5rem; padding: .55rem .75rem; flex-wrap: wrap; }` at ≤640px to stop 15px overflow on 320px. |
| `src/styles/projects.css` | Changed `.grid { minmax(300px, 1fr) }` → `minmax(min(300px, 100%), 1fr)` to prevent card clip at 320px. Added `.card__body { min-width: 0 }` to base + list view to stop flexbox min-width clip. Added `@media (max-width: 640px) { .list .card { flex-direction: column } }` to stack header/body on phones instead of the cramped 201px+87px row layout. |

All verified: `npm run check` → 0 errors, 0 warnings; `npm run build` → 1290 pages; CDP layout QA → no `OVER` except KaTeX/cell code scroll containers (intended, `scrollW == innerW`).

---

## Recommended issues to open

1. **F1 — XP display ≠ XP awarded** (HIGH): Lesson `xpReward` values ignored by `gameState.ts`; progress page XP sums diverge from real economy.
2. **F2 — `STREAK_MILESTONE` never paid** (HIGH): `evaluateMilestones` marks a badge but never awards the 30 XP; copy promises it.
3. **F3 — `awardDailyLogin()` dead** (MED): Zero callers; daily login badge and +5 XP never fire.
4. **F4 — Badge labels hardcoded English** (MED): AR/ES/FR progress pages show untranslated badge names.
5. **F5 — Supabase collection ungated, no consent/privacy story** (MED): GA gated, Supabase not; no privacy notice.
6. **F8 — README screenshot assets missing** (LOW): 4 `.webp` files referenced but don't exist.
7. **F9 — Vestigial JupyterLite build in deploy.yml** (LOW): Dead CI step, ~45s wasted per deploy.
