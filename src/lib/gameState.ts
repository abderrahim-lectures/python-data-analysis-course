// Game state engine — persists all progress to localStorage.
// Single source of truth for XP, lessons, projects, streaks, quizzes,
// quests, badges, and the full activity log for transparent progress tracking.

import {xpProgressFor} from './levelMath';

export interface LessonRecord { completed: boolean; firstRunAt?: string }

export interface ActivityEntry {
  ts: number;          // epoch ms
  type: string;        // 'lesson-run' | 'lesson-complete' | 'quiz' | 'project-view' | 'project-complete' | 'daily-login' | 'streak' | 'milestone'
  label: string;       // human-readable description
  xp: number;          // XP earned (0 if none)
  meta?: string;       // optional extra info (lesson id, project slug, etc.)
}

export interface PDAState {
  xp: number;
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

// ── XP Economy (max 9999) ──────────────────────────────────────────
// Balanced so that finishing a whole guided project rewards more than a
// single lesson, and each project step pays meaningfully toward it.
export const XP = {
  LESSON_RUN:         5,    // ran code in playground
  LESSON_COMPLETE:    60,   // finished a lesson
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

const MAX_XP = 9999;

function today(): string { return new Date().toISOString().slice(0, 10); }

function defaults(): PDAState {
  return {
    xp: 0,
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

  markQuest(s, 'first-lesson', 'First Step');
  if (Object.keys(s.lessonsRun).length > 0) markQuest(s, 'first-run', 'First Run');
  for (const id of completed) {
    markQuest(s, `completed-${id}`, 'Lesson complete');
    markQuest(s, `track-${id.split('/')[0]}`, 'Track starter');
  }
  // Ensure new arrays exist for legacy state
  if (!s.projectsViewed) s.projectsViewed = {};
  if (!s.projectsCompleted) s.projectsCompleted = {};
  if (!s.projectsSteps) s.projectsSteps = {};
  if (!s.challengesCompleted) s.challengesCompleted = {};
  if (!s.activityLog) s.activityLog = [];
  evaluateMilestones(s);
  return s;
}

function read(): PDAState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<PDAState>;
    return repairLegacy({ ...defaults(), ...parsed });
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

function clampXp(s: PDAState): void {
  if (s.xp > MAX_XP) s.xp = MAX_XP;
}

function markQuest(s: PDAState, id: string, label: string): void {
  if (s.quests[id]) return;
  s.quests[id] = true;
  s.badges = [...s.badges, label];
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
  clampXp(s);
  markQuest(s, key, 'Daily login');
  addLog(s, 'daily-login', 'Daily login', XP.DAILY_LOGIN);
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

// ── Lessons ─────────────────────────────────────────────────────────
function awardLessonComplete(s: PDAState, lessonId: string): void {
  if (s.lessonsCompleted[lessonId]) return;
  s.lessonsCompleted[lessonId] = true;
  const streakBonus = s.streak >= 3 ? XP.STREAK_BONUS : 0;
  const earned = XP.LESSON_COMPLETE + streakBonus;
  s.xp += earned;
  clampXp(s);
  markQuest(s, 'first-lesson', 'First Step');
  markQuest(s, `completed-${lessonId}`, 'Lesson complete');
  markQuest(s, `track-${lessonId.split('/')[0]}`, 'Track starter');
  addLog(s, 'lesson-complete', `Completed lesson`, earned, lessonId);
}

export function addXP(lessonId: string): number {
  const s = read();
  bumpStreak(s);
  markQuest(s, 'first-run', 'First Run');
  s.xp += XP.LESSON_RUN;
  clampXp(s);
  addLog(s, 'lesson-run', 'Ran code', XP.LESSON_RUN, lessonId);
  awardLessonComplete(s, lessonId);
  s.lessonsRun[lessonId] = true;
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

export function completeLesson(lessonId: string): number {
  const s = read();
  bumpStreak(s);
  awardLessonComplete(s, lessonId);
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
    clampXp(s);
    addLog(s, 'project-view', 'Viewed project', XP.PROJECT_VIEW, slug);
    markQuest(s, 'first-project', 'Explorer');
  }
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

export function completeProject(slug: string): number {
  const s = read();
  bumpStreak(s);
  if (!s.projectsCompleted[slug]) {
    s.projectsCompleted[slug] = true;
    s.projectsViewed[slug] = true;
    const streakBonus = s.streak >= 3 ? XP.STREAK_BONUS : 0;
    const earned = XP.PROJECT_COMPLETE + streakBonus;
    s.xp += earned;
    clampXp(s);
    addLog(s, 'project-complete', 'Completed project', earned, slug);
    markQuest(s, 'first-project-done', 'Builder');
    const count = Object.keys(s.projectsCompleted).length;
    if (count >= 5) markQuest(s, 'projects-5', '5 Projects');
    if (count >= 10) markQuest(s, 'projects-10', '10 Projects');
    if (count >= 25) markQuest(s, 'projects-25', '25 Projects');
    if (count >= 50) markQuest(s, 'projects-50', '50 Projects');
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
    clampXp(s);
    addLog(s, 'project-step', `Project step ${stepIdx + 1}`, XP.PROJECT_STEP, projectSlug);
    markQuest(s, 'first-project-step', 'Step by Step');
    const stepCount = Object.keys(s.projectsSteps).filter(k => k.startsWith(`${projectSlug}:step:`)).length;
    if (stepCount >= 10) markQuest(s, 'project-steps-10', '10 Steps');
    if (stepCount >= 25) markQuest(s, 'project-steps-25', '25 Steps');
    if (stepCount >= 50) markQuest(s, 'project-steps-50', '50 Steps');
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
export function recordQuiz(correct: boolean): void {
  const s = read();
  s.quizTotal += 1;
  if (correct) {
    s.quizCorrect += 1;
    s.xp += XP.QUIZ_CORRECT;
    clampXp(s);
    addLog(s, 'quiz', 'Quiz correct', XP.QUIZ_CORRECT);
  } else {
    addLog(s, 'quiz', 'Quiz attempt', 0);
  }
  s.lastActive = today();
  evaluateMilestones(s);
  write(s);
}

export function recordQuizPerfect(): void {
  const s = read();
  const key = 'quiz-perfect-' + today();
  if (s.quests[key]) return;
  s.xp += XP.QUIZ_PERFECT;
  clampXp(s);
  markQuest(s, key, 'Perfect quiz!');
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
    clampXp(s);
    addLog(s, 'challenge', 'Solved challenge', XP.CHALLENGE_COMPLETE, challengeId);
    markQuest(s, 'first-challenge', 'Problem Solver');
    const count = Object.keys(s.challengesCompleted).length;
    if (count >= 10) markQuest(s, 'challenges-10', '10 Challenges');
    if (count >= 25) markQuest(s, 'challenges-25', '25 Challenges');
    if (count >= 50) markQuest(s, 'challenges-50', '50 Challenges');
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
  if (s.streak >= 3) markQuest(s, 'streak-3', '3-day streak');
  if (s.streak >= 7) markQuest(s, 'streak-7', '7-day streak');
  if (s.streak >= 14) markQuest(s, 'streak-14', '14-day streak');
  if (s.streak >= 30) markQuest(s, 'streak-30', '30-day streak');

  // XP milestones (progressive rewards)
  const xpMilestones = [
    {xp: 100, id: 'xp-100', label: '100 XP'},
    {xp: 500, id: 'xp-500', label: '500 XP'},
    {xp: 1000, id: 'xp-1000', label: '1K XP'},
    {xp: 2000, id: 'xp-2000', label: '2K XP'},
    {xp: 3000, id: 'xp-3000', label: '3K XP'},
    {xp: 5000, id: 'xp-5000', label: '5K XP'},
    {xp: 7500, id: 'xp-7500', label: '7.5K XP'},
    {xp: 9999, id: 'xp-max', label: 'MAX XP'},
  ];
  for (const m of xpMilestones) {
    if (s.xp >= m.xp && !s.quests[m.id]) {
      markQuest(s, m.id, m.label);
      s.xp += XP.MILESTONE_XP;
      clampXp(s);
      addLog(s, 'milestone', `Milestone: ${m.label}`, XP.MILESTONE_XP);
    }
  }

  // Section completion: check if all lessons in a section are done
  const pythonLessons = Object.keys(s.lessonsCompleted).filter(k => k.startsWith('python-101/'));
  if (pythonLessons.length >= 19) markQuest(s, 'all-python', 'Python 101 done');  // 19 lessons total
  const dataLessons = Object.keys(s.lessonsCompleted).filter(k => k.startsWith('data-analysis/'));
  if (dataLessons.length >= 10) markQuest(s, 'all-data', 'Data Analysis done');   // 10 lessons total
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
    { id: 'xp-max', label: 'MAX XP' },
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

export function isWeekComplete(section: string, week: number): boolean {
  const s = read();
  // Legacy function - now checks if any lesson in the section is complete
  return Object.keys(s.lessonsCompleted).some(k => k.startsWith(`${section}/`));
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
// Scaled for 9999 max XP
const RANK_THRESHOLDS: Record<string, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 1500,
  Platinum: 3000,
  Diamond: 5000,
  Master: 7500,
  Grandmaster: 9999,
};

export function rankFor(xp: number): string {
  let r: string = RANKS[0];
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
