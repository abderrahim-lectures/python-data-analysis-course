// Game state engine — persists all progress to localStorage.
// Single source of truth for XP, lesson completion, streaks, quizzes, quests, badges.

export interface LessonRecord { completed: boolean; firstRunAt?: string }

export interface PDAState {
  xp: number;
  lessonsCompleted: Record<string, boolean>;
  lessonsRun: Record<string, boolean>;
  quizCorrect: number;
  quizTotal: number;
  streak: number;
  bestStreak: number;
  lastActive: string;       // ISO date
  quests: Record<string, boolean>;
  badges: string[];
}

const STORAGE_KEY = 'pda:state';
const XP_PER_LESSON = 20;
const STREAK_BONUS = 5;

function today(): string { return new Date().toISOString().slice(0, 10); }

function defaults(): PDAState {
  return {
    xp: 0,
    lessonsCompleted: {},
    lessonsRun: {},
    quizCorrect: 0,
    quizTotal: 0,
    streak: 0,
    bestStreak: 0,
    lastActive: '',
    quests: {},
    badges: [],
  };
}

// Earlier builds shipped a streak that could never leave 0 and never awarded
// the milestone quests, so existing learners carry state with real XP but an
// empty quest map. Rebuild what is derivable from the record of completed
// lessons so their history is not silently lost.
function repairLegacy(s: PDAState): PDAState {
  const completed = Object.keys(s.lessonsCompleted);
  if (completed.length === 0) return s;

  // Any completed lesson means at least one active day.
  if (s.streak === 0) s.streak = 1;
  if (!s.lastActive) s.lastActive = today();
  s.bestStreak = Math.max(s.bestStreak, s.streak);

  markQuest(s, `completed-${id}`, 'Lesson complete');
    markQuest(s, `track-${id.split('/')[0]}`, 'Track starter');
  }
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

function markQuest(s: PDAState, id: string, label: string): void {
  if (s.quests[id]) return;
  s.quests[id] = true;
  s.badges = [...s.badges, label];
  write(s);
}

export function loadState(): PDAState { return read(); }

export function saveState(s: PDAState): void { write(s); }

// Advance the daily streak, then stamp today. Must read lastActive BEFORE
// overwriting it — comparing it to today() after assignment always matches,
// which silently pinned every learner's streak at 0.
function bumpStreak(s: PDAState): void {
  const prev = s.lastActive;
  if (prev === today()) {
    if (s.streak === 0) s.streak = 1;   // first activity ever, today
  } else if (prev === new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
    s.streak += 1;
  } else {
    s.streak = 1;
  }
  s.lastActive = today();
  s.bestStreak = Math.max(s.bestStreak, s.streak);
}

function awardLesson(s: PDAState, lessonId: string): void {
  if (s.lessonsCompleted[lessonId]) return;
  s.lessonsCompleted[lessonId] = true;
  s.xp += XP_PER_LESSON + (s.streak >= 3 ? STREAK_BONUS : 0);
  markQuest(s, 'first-lesson', 'First Step');
  markQuest(s, `completed-${lessonId}`, 'Lesson complete');
  markQuest(s, `track-${lessonId.split('/')[0]}`, 'Track starter');
}

// Streak, XP and track-completion quests have no other award site — without
// this pass they stay locked forever no matter how much the learner does.
function evaluateMilestones(s: PDAState): void {
  if (s.streak >= 3) markQuest(s, 'streak-3', '3-day streak');
  if (s.streak >= 7) markQuest(s, 'streak-7', '7-day streak');
  if (s.streak >= 14) markQuest(s, 'streak-14', '14-day streak');
  if (s.xp >= 100) markQuest(s, 'xp-100', '100 XP');
  if (s.xp >= 500) markQuest(s, 'xp-500', '500 XP');

  const doneIn = (section: string, weeks: number[]) =>
    weeks.every(w => s.lessonsCompleted[`${section}/normal/week-${w}`] || s.lessonsCompleted[`${section}/hard/week-${w}`]);
  if (doneIn('python-101', [1, 2, 3, 4, 5])) markQuest(s, 'all-python', 'Python 101 done');
  if (doneIn('data-analysis', [6, 7, 8, 9, 10])) markQuest(s, 'all-data', 'Data Analysis done');
}

export function addXP(lessonId: string): number {
  const s = read();
  bumpStreak(s);
  markQuest(s, 'first-run', 'First Run');
  awardLesson(s, lessonId);
  s.lessonsRun[lessonId] = true;
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

export function completeLesson(lessonId: string): number {
  const s = read();
  bumpStreak(s);
  awardLesson(s, lessonId);
  evaluateMilestones(s);
  write(s);
  return s.xp;
}

export function recordQuiz(correct: boolean): void {
  const s = read();
  s.quizTotal += 1;
  if (correct) s.quizCorrect += 1;
  s.lastActive = today();
  write(s);
}

export function getQuizProgress(): { correct: number; total: number; pct: number } {
  const s = read();
  return { correct: s.quizCorrect, total: s.quizTotal, pct: s.quizTotal > 0 ? Math.round((s.quizCorrect / s.quizTotal) * 100) : 0 };
}

export function isLessonComplete(lessonId: string): boolean {
  return read().lessonsCompleted[lessonId] ?? false;
}

export function questsToShow(): { id: string; label: string; done: boolean }[] {
  const s = read();
  const all = [
    { id: 'first-run', label: 'First run' },
    { id: 'first-lesson', label: 'First step' },
    { id: 'track-python-101', label: 'Python track' },
    { id: 'track-data-analysis', label: 'Data track' },
    { id: 'streak-3', label: '3-day streak' },
    { id: 'streak-7', label: '7-day streak' },
    { id: 'streak-14', label: '14-day streak' },
    { id: 'xp-100', label: '100 XP' },
    { id: 'xp-500', label: '500 XP' },
    { id: 'all-python', label: 'Python 101 done' },
    { id: 'all-data', label: 'Data Analysis done' },
  ];
  return all.map(q => ({ ...q, done: !!s.quests[q.id] }));
}

export function streakProgress(): { current: number; best: number; target: number } {
  const s = read();
  return { current: s.streak, best: s.bestStreak, target: 7 };
}

export function xpProgress(): { xp: number; level: number; toNext: number; pct: number } {
  const s = read();
  const level = Math.floor(s.xp / 100) + 1;
  const toNext = 100 - (s.xp % 100);
  const pct = s.xp % 100;
  return { xp: s.xp, level, toNext, pct };
}

export function trackProgress(trackId: string, totalWeeks: number): { done: number; total: number; pct: number } {
  const s = read();
  const done = Object.keys(s.lessonsCompleted).filter(k => k.includes(trackId)).length;
  return { done, total: totalWeeks, pct: Math.round((done / totalWeeks) * 100) };
}

// Whether a specific week is complete on EITHER track difficulty — a learner
// who does the hard version of week 3 shouldn't see week 3 as locked.
export function isWeekComplete(section: string, week: number): boolean {
  const s = read();
  return !!s.lessonsCompleted[`${section}/normal/week-${week}`] || !!s.lessonsCompleted[`${section}/hard/week-${week}`];
}

export const RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'] as const;
export const RANK_EMOJIS: Record<string, string> = { Bronze: '🌱', Silver: '⚙️', Gold: '🥇', Platinum: '💠', Diamond: '💎', Master: '🔥', Grandmaster: '👑' };
const RANK_THRESHOLDS: Record<string, number> = { Bronze: 0, Silver: 300, Gold: 800, Platinum: 1600, Diamond: 2800, Master: 4500, Grandmaster: 7000 };

export function rankFor(xp: number): string {
  let r: string = RANKS[0];
  for (const k of RANKS) { if (xp >= (RANK_THRESHOLDS[k] || 0)) r = k; }
  return r;
}