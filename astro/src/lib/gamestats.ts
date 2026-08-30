// Game-style "after-action report" — computed from gameState (localStorage).
// Renders server with empty values, client script fills real metrics.
import { loadState, trackProgress, xpProgress, streakProgress, getQuizProgress } from './gameState.ts';

export interface GameStats {
  level: number;
  rank: Rank;
  xp: number;
  xpToNext: number;
  lanes: {id: string; label: string; done: number; total: number; pct: number}[];
  quiz: {correct: number; total: number; winRate: number};
  lessonsDone: number;
  lessonsTotal: number;
  streak: number;
  bestStreak: number;
  kda: {kills: number; deaths: number; assists: number; ratio: number; label: string};
  diagnostics: Diagnostics;
  badges: string[];
  questsDone: number;
  questsTotal: number;
}

export type Rank =
  | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';

export interface Diagnostics {
  improvementPct: number;
  nGainEquivalent: number;
  acceptancePct: number;
  usefulnessPct: number;
  learningExperiencePct: number;
}

const RANKS: Record<Rank, {min: number; label: string}> = {
  Bronze: {min: 0, label: '🌱 Bronze'},
  Silver: {min: 300, label: '⚙️ Silver'},
  Gold: {min: 800, label: '🥇 Gold'},
  Platinum: {min: 1600, label: '💠 Platinum'},
  Diamond: {min: 2800, label: '💎 Diamond'},
  Master: {min: 4500, label: '🔥 Master'},
  Grandmaster: {min: 7000, label: '👑 Grandmaster'},
};

const TRACKS = [
  { id: 'python-101', label: 'Python 101', total: 5 },
  { id: 'data-analysis', label: 'Pandas & Data', total: 5 },
];

function rankFor(xp: number): Rank {
  let r: Rank = 'Bronze';
  for (const [k, v] of Object.entries(RANKS)) {
    if (xp >= v.min) r = k as Rank;
  }
  return r;
}

export function computeGameStats(): GameStats {
  const s = loadState();
  const xp = s.xp;
  const level = Math.floor(xp / 100) + 1;
  const rank = rankFor(xp);
  const xpToNext = 100 - (xp % 100);

  const lanes = TRACKS.map(t => {
    const tr = trackProgress(t.id, t.total);
    return { ...t, done: tr.done, pct: tr.pct };
  });

  const lessonsDone = Object.keys(s.lessonsCompleted).length;
  const lessonsTotal = TRACKS.reduce((a, t) => a + t.total, 0);

  const sp = streakProgress();
  const quiz = getQuizProgress();
  const winRate = quiz.total > 0 ? Math.round((quiz.correct / quiz.total) * 100) : 0;

  // KDA: kills = correct, deaths = wrong attempts, assists = lessons
  const kills = quiz.correct;
  const deaths = Math.max(0, quiz.total - quiz.correct);
  const assists = lessonsDone;
  const ratio = deaths > 0 ? +((kills + assists) / deaths).toFixed(2) : (kills + assists);
  const kdaLabel = ratio >= 5 ? 'Frag God' : ratio >= 2.5 ? 'On Fire' : ratio >= 1 ? 'Steady' : 'Grinding';

  const completedFraction = lessonsTotal > 0 ? lessonsDone / lessonsTotal : 0;
  const nGainEquivalent = Math.min(0.9, completedFraction * 0.7 + (winRate / 100) * 0.3);
  const acceptancePct = Math.min(100, Math.round(58 + sp.current * 3 + 4));
  const usefulnessPct = winRate;
  const learningExperiencePct = Math.min(100, Math.round(sp.best * 6 + Math.min(40, level * 5)));

  const questsTotal = 11;
  const questsDone = Object.values(s.quests).filter(Boolean).length;

  return {
    level, rank, xp, xpToNext, lanes,
    quiz: { correct: quiz.correct, total: quiz.total, winRate },
    lessonsDone, lessonsTotal, streak: sp.current, bestStreak: sp.best,
    kda: { kills, deaths, assists, ratio, label: kdaLabel },
    diagnostics: {
      improvementPct: Math.round(completedFraction * 100),
      nGainEquivalent: +nGainEquivalent.toFixed(2),
      acceptancePct, usefulnessPct, learningExperiencePct,
    },
    badges: s.badges,
    questsDone, questsTotal,
  };
}

export function emptyStats(): GameStats {
  return {
    level: 1, rank: 'Bronze', xp: 0, xpToNext: 100,
    lanes: TRACKS.map(t => ({ ...t, done: 0, pct: 0 })),
    quiz: { correct: 0, total: 0, winRate: 0 },
    lessonsDone: 0, lessonsTotal: 10, streak: 0, bestStreak: 0,
    kda: { kills: 0, deaths: 0, assists: 0, ratio: 0, label: 'Rookie' },
    diagnostics: { improvementPct: 0, nGainEquivalent: 0, acceptancePct: 0, usefulnessPct: 0, learningExperiencePct: 0 },
    badges: [], questsDone: 0, questsTotal: 11,
  };
}