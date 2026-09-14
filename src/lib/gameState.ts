// Game state engine — persists all progress to localStorage.
// Single source of truth for XP, lessons, projects, streaks, quizzes,
// quests, badges, and the full activity log for transparent progress tracking.

import {xpProgressFor} from './levelMath';

export interface ActivityEntry {
  ts: number;          // epoch ms
  type: string;        // 'lesson-run' | 'lesson-complete' | 'quiz' | 'project-view' | 'project-complete' | 'daily-login' | 'streak' | 'milestone'
  label: string;       // human-readable description
  xp: number;          // XP earned (0 if none)
  meta?: string;       // optional extra info (lesson id, project slug, etc.)
}

export interface LessonMastery {
  correct: number;
  total: number;
  firstWrongAt: number | null;
  lastWrongAt: number | null;
}

export interface PDAState {
  xp: number;
  lessonMastery: Record<string, LessonMastery>;
  lessonsCompleted: Record<string, boolean>;
  lessonsRun: Record<string, boolean>;
  projectsViewed: Record<string, boolean>;
  projectsCompleted: Record<string, boolean>;
  projectsSteps: Record<string, boolean>;
  challengesCompleted: Record<string, boolean>;
  quizCorrect: number;
  quizTotal: number;
  streak: number;
  bestStreak: number;
  lastActive: string;       // ISO date
  quests: Record<string, boolean>;
  badges: string[];
  activityLog: ActivityEntry[];
}

const STORAGE_KEY = 'pda:state';

// ── XP Economy ─────────────────────────────────────────────────────
// Balanced so that finishing a whole guided project rewards more than a
// single lesson, and each project step pays meaningfully toward it.
export const XP = {
  LESSON_RUN:         5,    // ran code in playground
  LESSON_COMPLETE:    10,   // finished a lesson (fallback when frontmatter missing)
  PROJECT_VIEW:       5,    // opened a project page
  PROJECT_STEP:       15,   // completed one guided project step
  PROJECT_COMPLETE:  100,   // finished a whole project (rivals a lesson)
  QUIZ_CORRECT:       5,    // got a quiz question right
  QUIZ_PERFECT:       25,   // got all questions in a quiz right
  DAILY_LOGIN:        5,    // opened the site today
  STREAK_BONUS:       15,   // extra per day after day 3
  STREAK_MILESTONE:   30,   // bonus at streak milestones
  MILESTONE_XP:       25,   // XP milestone rewards
  CHALLENGE_COMPLETE: 15,   // solved an interactive challenge
} as const;

function today(): string { return new Date().toISOString().slice(0, 10); }

function defaults(): PDAState {
  return {
    xp: 0,
    lessonMastery: {},
    lessonsCompleted: {},
    lessonsRun: {},
    projectsViewed: {},
    projectsCompleted: {},
    projectsSteps: {},
    challengesCompleted: {},
    quizCorrect: 0,
    quizTotal: 0,
    streak: 0,
    bestStreak: 0,
    lastActive: '',
    quests: {},
    badges: [],
    activityLog: [],
  };
}

// Earlier builds shipped a streak that could never leave 0 and never awarded
// the milestone quests, so existing learners carry state with real XP but an
// empty quest map. Rebuild what is derivable from the record of completed
// lessons so their history is not silently lost.
function repairLegacy(s: PDAState): PDAState {
  const completed = Object.keys(s.lessonsCompleted);
  if (completed.length === 0) return s;

  if (s.streak === 0) s.streak = 1;
  if (!s.lastActive) s.lastActive = today();
  s.bestStreak = Math.max(s.bestStreak, s.streak);

  markQuest(s, 'first-lesson');
  if (Object.keys(s.lessonsRun).length > 0) markQuest(s, 'first-run');
  for (const id of completed) {
    markQuest(s, `completed-${id}`);
    markQuest(s, `track-${id.split('/')[0]}`);
  }
  // Ensure new arrays exist for legacy state
  if (!s.projectsViewed) s.projectsViewed = {};
  if (!s.projectsCompleted) s.projectsCompleted = {};
  if (!s.projectsSteps) s.projectsSteps = {};
  if (!s.challengesCompleted) s.challengesCompleted = {};
  if (!s.lessonMastery) s.lessonMastery = {};
  if (!s.activityLog) s.activityLog = [];
  evaluateMilestones(s);
  return s;
}

// Numeric fields render straight into innerHTML in gamestrip.client.ts /
// ProgressPage.astro (level, xp, streak, pct, toNext all interpolated into
// template strings, not built via textContent). Coercing them to actual
// numbers here -- the one place every read() passes through -- means a
// tampered localStorage value (devtools, a buggy import feature, a prior
// unrelated XSS planting state for later) can never smuggle a markup string
// into one of those templates; a non-numeric value becomes 0, never itself.
function coerceNumericFields(s: PDAState): PDAState {
  s.xp = Number(s.xp) || 0;
  s.streak = Number(s.streak) || 0;
  s.bestStreak = Number(s.bestStreak) || 0;
  return s;
}

function read(): PDAState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<PDAState>;
    return repairLegacy(coerceNumericFields({ ...defaults(), ...parsed }));
  } catch { return defaults(); }
}

function write(s: PDAState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* quota */ }
}

function addLog(s: PDAState, type: string, label: string, xp: number, meta?: string): void {
  s.activityLog.push({ ts: Date.now(), type, label, xp, meta });
  // Keep last 200 entries
  if (s.activityLog.length > 200) s.activityLog = s.activityLog.slice(-200);
}

function markQuest(s: PDAState, id: string): void {
  if (s.quests[id]) return;
  s.quests[id] = true;
  s.badges = [...s.badges, id];
}

export function loadState(): PDAState { return read(); }

export function saveState(s: PDAState): void { write(s); }

// Advance the daily streak, then stamp today.
function bumpStreak(s: PDAState): void {
  const prev = s.lastActive;
  if (prev === today()) {
    if (s.streak === 0) s.streak = 1;
  } else if (prev === new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
    s.streak += 1;
  } else {
    s.streak = 1;
  }
  s.lastActive = today();
  s.bestStreak = Math.max(s.bestStreak, s.streak);
}

// ── Daily Login XP ──────────────────────────────────────────────────
export function awardDailyLogin(): number {
  const s = read();
  const key = `login-${today()}`;
  if (s.quests[key]) return s.xp; // already awarded today
  bumpStreak(s);
  s.xp += XP.DAILY_LOGIN;
  markQuest(s, key);
  addLog(s, 'daily-login', 'Daily login', XP.DAILY_LOGIN);
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

// ── Lessons ─────────────────────────────────────────────────────────
function awardLessonComplete(s: PDAState, lessonId: string, reward?: number): void {
  if (s.lessonsCompleted[lessonId]) return;
  s.lessonsCompleted[lessonId] = true;
  const streakBonus = s.streak >= 3 ? XP.STREAK_BONUS : 0;
  const earned = (reward ?? XP.LESSON_COMPLETE) + streakBonus;
  s.xp += earned;
  markQuest(s, 'first-lesson');
  markQuest(s, `completed-${lessonId}`);
  markQuest(s, `track-${lessonId.split('/')[0]}`);
  addLog(s, 'lesson-complete', `Completed lesson`, earned, lessonId);
}

// Returns both the new total and the amount gained, computed from the same
// read-modify-write as the rest of this function (no separate loadState()
// call before/after): a caller that snapshots xp before calling addXP and
// diffs against a loadState() after can read a delta that includes another
// concurrent addXP/completeLesson call's gain too, since there's an await
// point between the two loadState() calls in an async caller. Keeping the
// "before" xp inside this synchronous call closes that window.
export function addXP(lessonId: string): {xp: number; gained: number} {
  const s = read();
  const xpBefore = s.xp;
  bumpStreak(s);
  markQuest(s, 'first-run');
  s.xp += XP.LESSON_RUN;
  addLog(s, 'lesson-run', 'Ran code', XP.LESSON_RUN, lessonId);
  s.lessonsRun[lessonId] = true;
  evaluateMilestones(s);
  write(s);
  return {xp: s.xp, gained: s.xp - xpBefore};
}

export function completeLesson(lessonId: string, reward?: number): number {
  const s = read();
  bumpStreak(s);
  awardLessonComplete(s, lessonId, reward);
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

// ── Projects ────────────────────────────────────────────────────────
export function viewProject(slug: string): number {
  const s = read();
  bumpStreak(s);
  if (!s.projectsViewed[slug]) {
    s.projectsViewed[slug] = true;
    s.xp += XP.PROJECT_VIEW;
    addLog(s, 'project-view', 'Viewed project', XP.PROJECT_VIEW, slug);
    markQuest(s, 'first-project');
  }
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

export function completeProject(slug: string, reward?: number): number {
  const s = read();
  bumpStreak(s);
  if (!s.projectsCompleted[slug]) {
    s.projectsCompleted[slug] = true;
    s.projectsViewed[slug] = true;
    const streakBonus = s.streak >= 3 ? XP.STREAK_BONUS : 0;
    const earned = (reward ?? XP.PROJECT_COMPLETE) + streakBonus;
    s.xp += earned;
    addLog(s, 'project-complete', 'Completed project', earned, slug);
    markQuest(s, 'first-project-done');
    const count = Object.keys(s.projectsCompleted).length;
    if (count >= 5) markQuest(s, 'projects-5');
    if (count >= 10) markQuest(s, 'projects-10');
    if (count >= 25) markQuest(s, 'projects-25');
    if (count >= 50) markQuest(s, 'projects-50');
  }
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

export function isProjectViewed(slug: string): boolean {
  return read().projectsViewed[slug] ?? false;
}

export function isProjectComplete(slug: string): boolean {
  return read().projectsCompleted[slug] ?? false;
}

export function recordProjectStep(projectSlug: string, stepIdx: number): number {
  const s = read();
  bumpStreak(s);
  const key = `${projectSlug}:step:${stepIdx}`;
  if (!s.projectsSteps[key]) {
    s.projectsSteps[key] = true;
    s.xp += XP.PROJECT_STEP;
    addLog(s, 'project-step', `Project step ${stepIdx + 1}`, XP.PROJECT_STEP, projectSlug);
    markQuest(s, 'first-project-step');
    const stepCount = Object.keys(s.projectsSteps).filter(k => k.startsWith(`${projectSlug}:step:`)).length;
    if (stepCount >= 10) markQuest(s, 'project-steps-10');
    if (stepCount >= 25) markQuest(s, 'project-steps-25');
    if (stepCount >= 50) markQuest(s, 'project-steps-50');
  }
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

export function isProjectStepDone(projectSlug: string, stepIdx: number): boolean {
  const s = read();
  const key = `${projectSlug}:step:${stepIdx}`;
  return !!s.projectsSteps[key];
}

// ── Quizzes ─────────────────────────────────────────────────────────
export function recordQuiz(correct: boolean, lessonId?: string): void {
  const s = read();
  s.quizTotal += 1;
  if (correct) {
    s.quizCorrect += 1;
    s.xp += XP.QUIZ_CORRECT;
    addLog(s, 'quiz', 'Quiz correct', XP.QUIZ_CORRECT);
  } else {
    addLog(s, 'quiz', 'Quiz attempt', 0);
  }
  if (lessonId) {
    const m = s.lessonMastery[lessonId] ?? {correct: 0, total: 0, firstWrongAt: null, lastWrongAt: null};
    m.total += 1;
    if (correct) {
      m.correct += 1;
    } else {
      if (m.firstWrongAt === null) m.firstWrongAt = Date.now();
      m.lastWrongAt = Date.now();
    }
    s.lessonMastery[lessonId] = m;
  }
  s.lastActive = today();
  evaluateMilestones(s);
  write(s);
}

export function getLessonMastery(): Record<string, LessonMastery> {
  return read().lessonMastery;
}

export function recordQuizPerfect(): void {
  const s = read();
  const key = 'quiz-perfect-' + today();
  if (s.quests[key]) return;
  s.xp += XP.QUIZ_PERFECT;
  markQuest(s, key);
  addLog(s, 'quiz', 'Perfect quiz!', XP.QUIZ_PERFECT);
  evaluateMilestones(s);
  write(s);
}

export function getQuizProgress(): { correct: number; total: number; pct: number } {
  const s = read();
  return { correct: s.quizCorrect, total: s.quizTotal, pct: s.quizTotal > 0 ? Math.round((s.quizCorrect / s.quizTotal) * 100) : 0 };
}

export function isLessonComplete(lessonId: string): boolean {
  return read().lessonsCompleted[lessonId] ?? false;
}

// ── Challenges ─────────────────────────────────────────────────────
export function recordChallenge(challengeId: string): number {
  const s = read();
  bumpStreak(s);
  if (!s.challengesCompleted[challengeId]) {
    s.challengesCompleted[challengeId] = true;
    s.xp += XP.CHALLENGE_COMPLETE;
    addLog(s, 'challenge', 'Solved challenge', XP.CHALLENGE_COMPLETE, challengeId);
    markQuest(s, 'first-challenge');
    const count = Object.keys(s.challengesCompleted).length;
    if (count >= 10) markQuest(s, 'challenges-10');
    if (count >= 25) markQuest(s, 'challenges-25');
    if (count >= 50) markQuest(s, 'challenges-50');
  }
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

export function isChallengeComplete(challengeId: string): boolean {
  return read().challengesCompleted[challengeId] ?? false;
}

// ── Milestones ──────────────────────────────────────────────────────
function evaluateMilestones(s: PDAState): void {
  // Streak milestones pay a bonus the first time each target is hit.
  const streakMilestones = [
    {d: 3, id: 'streak-3'},
    {d: 7, id: 'streak-7'},
    {d: 14, id: 'streak-14'},
    {d: 30, id: 'streak-30'},
  ];
  for (const m of streakMilestones) {
    if (s.streak >= m.d && !s.quests[m.id]) {
      markQuest(s, m.id);
      s.xp += XP.STREAK_MILESTONE;
      addLog(s, 'streak', `Streak ${m.d} days`, XP.STREAK_MILESTONE);
    }
  }

  // XP milestones (progressive rewards)
  const xpMilestones = [
    {xp: 100, id: 'xp-100', label: '100 XP'},
    {xp: 500, id: 'xp-500', label: '500 XP'},
    {xp: 1000, id: 'xp-1000', label: '1K XP'},
    {xp: 2000, id: 'xp-2000', label: '2K XP'},
    {xp: 3000, id: 'xp-3000', label: '3K XP'},
    {xp: 5000, id: 'xp-5000', label: '5K XP'},
    {xp: 7500, id: 'xp-7500', label: '7.5K XP'},
  ];
  // Checked against a snapshot taken before the loop, not the live s.xp:
  // each milestone hit adds XP.MILESTONE_XP to s.xp, and checking `s.xp >=
  // m.xp` against that same mutating value would let one milestone's bonus
  // count toward crossing the next threshold in the same pass. With today's
  // constants (25 XP bonus, >=400 XP between thresholds) that can't actually
  // cascade, but the check should reflect genuine progress regardless of how
  // those constants are tuned later, not rely on the gap staying that wide.
  const xpBeforeMilestones = s.xp;
  for (const m of xpMilestones) {
    if (xpBeforeMilestones >= m.xp && !s.quests[m.id]) {
      markQuest(s, m.id);
      s.xp += XP.MILESTONE_XP;
      addLog(s, 'milestone', `Milestone: ${m.label}`, XP.MILESTONE_XP);
    }
  }

  // Section completion: check if all lessons in a section are done (normal + hard)
  const pythonLessons = Object.keys(s.lessonsCompleted).filter(k => k.startsWith('python-101/'));
  if (pythonLessons.length >= 29) markQuest(s, 'all-python');  // 29 lessons total
  const dataLessons = Object.keys(s.lessonsCompleted).filter(k => k.startsWith('data-analysis/'));
  if (dataLessons.length >= 20) markQuest(s, 'all-data');   // 20 lessons total
}

// ── Quests ──────────────────────────────────────────────────────────
export function questsToShow(): { id: string; label: string; done: boolean }[] {
  const s = read();
  const all = [
    { id: 'first-run', label: 'First run' },
    { id: 'first-lesson', label: 'First step' },
    { id: 'first-project', label: 'Explorer' },
    { id: 'first-project-done', label: 'Builder' },
    { id: 'first-project-step', label: 'Step by Step' },
    { id: 'project-steps-10', label: '10 Steps' },
    { id: 'project-steps-25', label: '25 Steps' },
    { id: 'project-steps-50', label: '50 Steps' },
    { id: 'track-python-101', label: 'Python track' },
    { id: 'track-data-analysis', label: 'Data track' },
    { id: 'streak-3', label: '3-day streak' },
    { id: 'streak-7', label: '7-day streak' },
    { id: 'streak-14', label: '14-day streak' },
    { id: 'streak-30', label: '30-day streak' },
    { id: 'xp-100', label: '100 XP' },
    { id: 'xp-500', label: '500 XP' },
    { id: 'xp-1000', label: '1K XP' },
    { id: 'xp-2000', label: '2K XP' },
    { id: 'xp-3000', label: '3K XP' },
    { id: 'xp-5000', label: '5K XP' },
    { id: 'xp-7500', label: '7.5K XP' },
    { id: 'projects-5', label: '5 Projects' },
    { id: 'projects-10', label: '10 Projects' },
    { id: 'projects-25', label: '25 Projects' },
    { id: 'projects-50', label: '50 Projects' },
    { id: 'first-challenge', label: 'Problem Solver' },
    { id: 'challenges-10', label: '10 Challenges' },
    { id: 'challenges-25', label: '25 Challenges' },
    { id: 'challenges-50', label: '50 Challenges' },
    { id: 'all-python', label: 'Python 101 done' },
    { id: 'all-data', label: 'Data Analysis done' },
  ];
  return all.map(q => ({ ...q, done: !!s.quests[q.id] }));
}

// ── Streak ──────────────────────────────────────────────────────────
export function streakProgress(): { current: number; best: number; target: number } {
  const s = read();
  return { current: s.streak, best: s.bestStreak, target: 7 };
}

// ── XP & Level ──────────────────────────────────────────────────────
export function xpProgress(): { xp: number; level: number; toNext: number; pct: number } {
  const s = read();
  return xpProgressFor(s.xp);
}

// ── Track Progress ──────────────────────────────────────────────────
export function trackProgress(trackId: string, totalLessons: number): { done: number; total: number; pct: number } {
  const s = read();
  const completedKeys = Object.keys(s.lessonsCompleted).filter(k => k.startsWith(trackId));
  // Deduplicate: count each lesson only once (normal and hard are alternatives)
  const lessonsDone = new Set<string>();
  for (const k of completedKeys) {
    const lesson = k.split('/').pop();
    if (lesson) lessonsDone.add(lesson);
  }
  const done = lessonsDone.size;
  return { done, total: totalLessons, pct: Math.round((done / totalLessons) * 100) };
}

// ── Activity Log ────────────────────────────────────────────────────
export function getActivityLog(limit: number = 50): ActivityEntry[] {
  const s = read();
  return s.activityLog.slice(-limit).reverse();
}

export function getActivityStats(): { totalActions: number; byType: Record<string, number> } {
  const s = read();
  const byType: Record<string, number> = {};
  for (const e of s.activityLog) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }
  return { totalActions: s.activityLog.length, byType };
}

// ── Ranks ───────────────────────────────────────────────────────────
export const RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'] as const;
export const RANK_EMOJIS: Record<string, string> = { Bronze: '🌱', Silver: '⚙️', Gold: '🥇', Platinum: '💠', Diamond: '💎', Master: '🔥', Grandmaster: '👑' };
// Rank tiers, Grandmaster at 9999 XP
const RANK_THRESHOLDS: Record<string, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 1500,
  Platinum: 3000,
  Diamond: 5000,
  Master: 7500,
  Grandmaster: 9999,
};

export function rankFor(xp: number): (typeof RANKS)[number] {
  let r: (typeof RANKS)[number] = RANKS[0];
  for (const k of RANKS) { if (xp >= (RANK_THRESHOLDS[k] || 0)) r = k; }
  return r;
}

// ── Project Stats ───────────────────────────────────────────────────
export function projectStats(): { viewed: number; completed: number; steps: number } {
  const s = read();
  return {
    viewed: Object.keys(s.projectsViewed).length,
    completed: Object.keys(s.projectsCompleted).length,
    steps: Object.keys(s.projectsSteps).length,
  };
}
