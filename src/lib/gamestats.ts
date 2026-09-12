// Game-style "after-action report" — computed from gameState (localStorage).
// Renders server with empty values, client script fills real metrics.
import { loadState, trackProgress, streakProgress, getQuizProgress, rankFor, questsToShow } from './gameState.ts';
import { levelForXp, xpProgressFor } from './levelMath';

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
  activity: {
    daysActive: number;
    lessonsPerWeek: number;
    avgXpPerDay: number;
    consistencyScore: number;
  };
  engagement: {
    returnRate: number;
    streakLength: number;
    longestSession: number;
  };
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

export const TRACKS = [
  { id: 'python-101', label: 'Python 101', total: 29 },
  { id: 'data-analysis', label: 'Pandas & Data', total: 20 },
];

export function computeGameStats(): GameStats {
  const s = loadState();
  const xp = s.xp;
  const level = levelForXp(xp);
  const rank = rankFor(xp);
  const xpToNext = xpProgressFor(xp).toNext;

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
  const kdaLabel = ratio >= 5 ? 'Legend' : ratio >= 2.5 ? 'On Fire' : ratio >= 1 ? 'Steady' : 'Grinding';

  const completedFraction = lessonsTotal > 0 ? lessonsDone / lessonsTotal : 0;
  const nGainEquivalent = Math.min(0.9, completedFraction * 0.7 + (winRate / 100) * 0.3);
  const acceptancePct = Math.min(100, Math.round(58 + sp.current * 3 + 4));
  const usefulnessPct = winRate;
  const learningExperiencePct = Math.min(100, Math.round(sp.best * 6 + Math.min(40, level * 5)));

  // Visible quest list is the source of truth (internal quests like
  // `completed-*`, daily logins, and track starters aren't counted).
  const visibleQuests = questsToShow();
  const questsTotal = visibleQuests.length;
  const questsDone = visibleQuests.filter((q) => q.done).length;

  // Activity metrics
  const lastActive = s.lastActive || new Date().toISOString().slice(0, 10);
  const daysSinceStart = Math.max(1, Math.ceil((Date.now() - new Date(lastActive).getTime()) / 86400000));
  const daysActive = lessonsDone > 0 ? Math.min(daysSinceStart, Math.max(1, lessonsDone)) : 0;
  const lessonsPerWeek = +((lessonsDone / daysSinceStart) * 7).toFixed(1);
  const avgXpPerDay = daysActive > 0 ? Math.round(xp / daysActive) : 0;
  const consistencyScore = Math.min(100, Math.round((sp.current / Math.max(1, sp.best)) * 50 + (lessonsDone / lessonsTotal) * 50));

  // Engagement metrics
  const returnRate = daysActive > 1 ? Math.min(100, Math.round((daysActive / daysSinceStart) * 100)) : 0;
  const streakLength = sp.current;
  const longestSession = Math.min(5, lessonsDone);

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
    activity: {
      daysActive,
      lessonsPerWeek,
      avgXpPerDay,
      consistencyScore,
    },
    engagement: {
      returnRate,
      streakLength,
      longestSession,
    },
  };
}