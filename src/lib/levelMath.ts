// Pure XP → level math shared by the progress page, the layout gamestrip,
// and the learner bar. Single source of truth for the curved formula.
// Curved level formula: levels feel rewarding at every stage.
// Level 10 ~ 1500 XP, Level 20 ~ 4500 XP, Level 30 ~ 8500 XP
export function levelForXp(xp: number): number {
  return Math.max(1, 1 + Math.floor(Math.pow(xp / 50, 0.6)));
}

export function xpProgressFor(xp: number): { xp: number; level: number; toNext: number; pct: number } {
  const level = levelForXp(xp);
  const nextLevelXp = Math.pow(level, 1 / 0.6) * 50;
  const prevLevelXp = Math.pow(level - 1, 1 / 0.6) * 50;
  const toNext = Math.max(0, Math.ceil(nextLevelXp - xp));
  const span = nextLevelXp - prevLevelXp;
  const pct = span > 0 ? Math.min(100, Math.round(((xp - prevLevelXp) / span) * 100)) : 0;
  return { xp, level, toNext, pct };
}