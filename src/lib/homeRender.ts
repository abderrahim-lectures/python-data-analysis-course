import {xpProgress, streakProgress, loadState, rankFor, RANK_EMOJIS} from './gameState.ts';
import {TRACKS} from './gamestats.ts';

const TRACK_TOTAL = Object.fromEntries(TRACKS.map((t) => [t.id, t.total]));

export function renderHomepage() {
  const xp = xpProgress();
  const sp = streakProgress();
  const s = loadState();
  const badges = s.badges || [];
  const rank = rankFor(xp.xp);

  const levelEl = document.getElementById('player-level');
  const xpEl = document.getElementById('player-xp');
  const xpnextEl = document.getElementById('player-xpnext');
  const xpfillEl = document.getElementById('player-xpfill') as HTMLElement | null;
  const rankEl = document.getElementById('player-rank');
  if (levelEl) levelEl.textContent = String(xp.level);
  if (xpEl) xpEl.textContent = String(xp.xp);
  if (xpnextEl) xpnextEl.textContent = String(xp.toNext);
  if (xpfillEl) xpfillEl.style.width = xp.pct + '%';
  if (rankEl) rankEl.innerHTML = `<span class="badge badge--streak">${RANK_EMOJIS[rank] ?? '🌱'} ${rank}</span>`;

  const gsLevel = document.getElementById('gs-level-val');
  const gsStreak = document.getElementById('gs-streak-val');
  const gsBadges = document.getElementById('gs-badges-val');
  const gsXp = document.getElementById('gs-xp-val');
  if (gsLevel) gsLevel.textContent = String(xp.level);
  if (gsStreak) gsStreak.textContent = String(sp.current);
  if (gsBadges) gsBadges.textContent = String(badges.length);
  if (gsXp) gsXp.textContent = String(xp.xp);

  const streakItem = document.getElementById('gs-streak');
  if (streakItem) {
    streakItem.classList.remove('gamestrip__item--hot', 'gamestrip__item--blazing');
    if (sp.current >= 7) streakItem.classList.add('gamestrip__item--blazing');
    else if (sp.current >= 3) streakItem.classList.add('gamestrip__item--hot');
  }

  const pythonDone = Object.keys(s.lessonsCompleted || {}).filter((k: string) => k.includes('python-101')).length;
  const dataDone = Object.keys(s.lessonsCompleted || {}).filter((k: string) => k.includes('data-analysis')).length;
  const pythonFill = document.getElementById('hub-python') as HTMLElement | null;
  const dataFill = document.getElementById('hub-data') as HTMLElement | null;
  if (pythonFill) pythonFill.style.width = (pythonDone / TRACK_TOTAL['python-101'] * 100) + '%';
  if (dataFill) dataFill.style.width = (dataDone / TRACK_TOTAL['data-analysis'] * 100) + '%';
}
