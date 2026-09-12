// Gamestrip + XP bar + onboarding + level-up overlay, extracted from
// Base.astro's untyped inline script so the whole client bundle type-checks
// under the strict tsconfig (no @ts-nocheck). Runs once as a deferred module.
import {xpProgressFor} from './levelMath.ts';
import type {PDAState} from './gameState.ts';
import {awardDailyLogin} from './gameState.ts';
import {badgeLabel} from './badgeLabel.ts';
import {m} from '../paraglide/messages.js';

const STORAGE_KEY = 'pda:state';

function readState(): Partial<PDAState> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<PDAState>;
  } catch {
    return {};
  }
}

function xpProgress(s: Partial<PDAState>) {
  return xpProgressFor(s.xp || 0);
}

function streakEmoji(streak: number): string {
  if (streak >= 14) return '🔥🔥🔥';
  if (streak >= 7) return '🔥🔥';
  if (streak >= 3) return '🔥';
  return '';
}

let prevLevel = 0;

function renderXPBar() {
  const bar = document.getElementById('xp-bar');
  if (!bar) return;
  const s = readState();
  const {xp, level, pct, toNext} = xpProgress(s);
  const streak = s.streak || 0;
  prevLevel = parseInt(bar.dataset.level || '0');
  bar.dataset.level = String(level);
  bar.innerHTML = `
    <div class="xp-bar" title="${m.level_label()} ${level} · ${xp} XP · ${streakEmoji(streak)}">
      <span class="xp-bar__level">Lv.${level}</span>
      <div class="xp-bar__track"><div class="xp-bar__fill" style="width:${pct}%"></div></div>
      <span class="xp-bar__streak">${streakEmoji(streak)}</span>
      ${toNext <= 20 && xp > 0 ? `<span class="xp-bar__milestone">${toNext} XP!</span>` : ''}
    </div>`;
  if (prevLevel && level > prevLevel) {
    showLevelUp(level, xp, s.badges || []);
  }
}

function showLevelUp(level: number, xp: number, badges: string[]) {
  const overlay = document.getElementById('lvlup');
  if (!overlay) return;
  const subEl = document.getElementById('lvlup-sub');
  const newBadges = badges.slice(-3).map(badgeLabel);
  if (subEl) subEl.textContent = newBadges.length ? `${m.unlocked_prefix()}${newBadges.join(', ')}` : `${xp} ${m.total_xp_label()}`;
  overlay.hidden = false;
  overlay.classList.remove('lvlup--hide');
  overlay.classList.add('lvlup--show');
  spawnParticles();
  setTimeout(() => {
    overlay.classList.remove('lvlup--show');
    overlay.classList.add('lvlup--hide');
    setTimeout(() => {
      overlay.hidden = true;
    }, 600);
  }, 2200);
}

function spawnParticles() {
  const container = document.getElementById('lvlup');
  if (!container) return;
  const colors = ['#5b21b6', '#4c1d95', '#8b5cf6', '#a78bfa', '#fbbf24', '#34d399'];
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const dx = (Math.random() - 0.5) * 160;
    const dy = -(40 + Math.random() * 120);
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)]);
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');
    p.style.animationDelay = Math.random() * 0.4 + 's';
    container.appendChild(p);
  }
}

function initOnboarding() {
  const overlay = document.getElementById('onboarding');
  if (!overlay) return;

  // A blocked/absent localStorage must not take the rest of init down
  // with it, and must not trap the visitor behind an undismissable modal.
  let seen = true;
  try {
    seen = !!localStorage.getItem('pda:onboarded');
  } catch {
    seen = true;
  }
  if (seen || new URLSearchParams(location.search).has('onboarded')) return;

  const opener = document.activeElement;
  const dismiss = () => {
    try {
      localStorage.setItem('pda:onboarded', '1');
    } catch {
      // private mode
    }
    overlay.hidden = true;
    document.removeEventListener('keydown', onKey);
    if (opener instanceof HTMLElement) opener.focus();
  };
  const focusable = (): HTMLElement[] => Array.from(
    overlay.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  );
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      dismiss();
      return;
    }
    if (e.key !== 'Tab') return;
    // Keep focus inside the dialog while it is open.
    const items = focusable();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  overlay.hidden = false;
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });
  document.getElementById('onboarding-start')?.addEventListener('click', dismiss);
  document.getElementById('onboarding-skip')?.addEventListener('click', dismiss);
  focusable()[0]?.focus();
}

function initXPToastListener() {
  document.addEventListener('lesson:complete', (e) => {
    renderXPBar();
    const container = document.getElementById('xp-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'floating-xp';
    // Every dispatcher sends the exact amount it awarded (state delta), so the
    // toast never leaks unrelated XP. Missing detail = silent.
    const gained = (e as CustomEvent<{xp?: number}>).detail?.xp ?? 0;
    if (gained <= 0) return;
    toast.textContent = m.xp_toast({amount: gained});
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  });
}

function initThemeToggle() {
  const btn = document.querySelector('[data-theme-toggle]');
  btn?.addEventListener('click', () => {
    const el = document.documentElement;
    const next = el.dataset.theme === 'dark' ? 'light' : 'dark';
    el.dataset.theme = next;
    localStorage.setItem('pda:theme', next);
    renderXPBar();
  });
}

if (typeof document !== 'undefined') {
  renderXPBar();
  initOnboarding();
  initXPToastListener();
  initThemeToggle();
  // Daily login: awards 5 XP and bumps the streak once per day (idempotent).
  awardDailyLogin();
  renderXPBar();
}