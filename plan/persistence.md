# Client-Side Persistence (localStorage)

No backend/login exists, so all per-student progress lives in the browser. The model is deliberately small: **one JSON blob under `pda:state`** plus two tiny flags.

## Keys

- **`pda:state`** — the whole game-state object, written by `src/lib/gameState.ts`:
  - `xp` (uncapped) and the economy constants (`LESSON_COMPLETE` 60, `LESSON_RUN` 5, `PROJECT_VIEW` 5, `PROJECT_STEP` 15, `PROJECT_COMPLETE` 100, `QUIZ_CORRECT` 5, `QUIZ_PERFECT` 25, `DAILY_LOGIN` 5, `STREAK_BONUS` 15, `STREAK_MILESTONE` 30, `MILESTONE_XP` 25, `CHALLENGE_COMPLETE` 15);
  - `lessonsCompleted` / `lessonsRun` (per lesson id, shared across locales — ids stay byte-identical);
  - `projectsViewed` / `projectsCompleted` / `projectsSteps`;
  - `challengesCompleted`; `quizCorrect` / `quizTotal`;
  - `streak` / `bestStreak` / `lastActive`;
  - `quests` (31 quests) and `badges`;
  - `activityLog` — a timestamped log of every earning event (`lesson-run`, `lesson-complete`, `quiz`, `project-view`, `project-complete`, `daily-login`, `streak`, `milestone`), which is what the transparent progress/stats rendering reads.
  - Reads/writes go through `load()/save()` with a try/catch quota guard; there is a legacy-state repair path that backfills milestones/quests/streak for students who have pre-rebalance saves.
- **`pda:onboarded`** — `"1"` once the onboarding dialog is dismissed; the dialog is gated on it so it never reappears for returning visitors (and never flashes on first load).
- **`pda-course:editor-tutorial-seen`** — `"1"` once the in-editor tutorial is dismissed.
- **`pda-course:tutorial-step`** — `sessionStorage`, the editor tutorial's current step (session-only).

No per-page keys, no namespaced scatter: because the whole state is one key, a hard reset is a single `localStorage.clear()` (that's exactly what the e2e suite does between scenarios). There is no cross-device sync and no export/import mechanism in the current build — the course is per-browser by design; sharing is limited to the "open in Colab/notebook" story and progress visibility, not state transfer.

## Progress week model (decision, 2026-09-09)

- The progress page's "stations" follow **per-track week numbering equal to the track's module count**: python-101 = weeks 1–7 (7 normal modules), data-analysis = weeks 1–5. `trackProgress` totals are 7 and 5 respectively; both the server render and the client loop compute station done-state as `week <= trackProgress(section, total).done`.
- `isWeekComplete` in `gameState.ts` is **legacy and unused by the page** (it returns "any lesson in the section complete" and ignores the week argument). Kept for the unit tests that exercise it; do not use it for new progress UI.

## `pda:state` cross-locale scope (decision, 2026-09-09)

- **Keep the single shared `pda:state` bucket across all four locales — do not namespace.** Lesson/module/project ids are deliberately byte-identical across locales (a lesson completed in English stays completed in Arabic; XP and streak carry over), so a per-locale store would double-count the same work and split streaks. This is intended behavior, not a bug; the earlier audit flag to namespace it is closed as "by design".