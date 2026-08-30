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
function yesterday(): string {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

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

function read(): PDAState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<PDAState>;
    return { ...defaults(), ...parsed };
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

export function addXP(lessonId: string): number {
  const s = read();
  const wasComplete = s.lessonsCompleted[lessonId];
  s.lastActive = today();

  // streak logic
  if (s.lastActive === today() && s.lastActive !== '') {
    // same day — no change
  } else if (s.lastActive === yesterday()) {
    s.streak += 1;
  } else {
    s.streak = 1;
  }
  s.bestStreak = Math.max(s.bestStreak, s.streak);

  if (!wasComplete) {
    s.lessonsCompleted[lessonId] = true;
    const base = XP_PER_LESSON;
    const bonus = s.streak >= 3 ? STREAK_BONUS : 0;
    s.xp += base + bonus;
    markQuest(s, 'first-run', 'First Run');
    markQuest(s, `completed-${lessonId}`, `Lesson complete`);
    markQuest(s, 'first-lesson', 'First Step');
    markQuest(s, `track-${lessonId.split('-')[0]}`, 'Track starter');
  }
  s.lessonsRun[lessonId] = true;
  write(s);
  return s.xp;
}

export function completeLesson(lessonId: string): number {
  const s = read();
  s.lastActive = today();
  if (!s.lessonsCompleted[lessonId]) {
    s.lessonsCompleted[lessonId] = true;
    s.xp += XP_PER_LESSON + (s.streak >= 3 ? STREAK_BONUS : 0);
    markQuest(s, `completed-${lessonId}`, 'Lesson complete');
  }
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