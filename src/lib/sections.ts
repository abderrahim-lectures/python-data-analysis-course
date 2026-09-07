import type {Locale} from './routeSegments';
import {PAGE_STRINGS} from './pageStrings';

export const SECTION_ICONS: Record<string, string> = {'python-101': '🐍', 'data-analysis': '📊'};
export const TRACK_ICONS: Record<'normal' | 'hard', string> = {normal: '🌿', hard: '⚡'};

/** Localized name for a section slug (python-101 → track1Name, else track2Name). */
export function sectionName(locale: Locale, section: string): string {
  const ps = PAGE_STRINGS[locale];
  return section === 'python-101' ? ps.track1Name : ps.track2Name;
}

/** Localized description for a section slug. */
export function sectionDescription(locale: Locale, section: string): string {
  const ps = PAGE_STRINGS[locale];
  return section === 'python-101' ? ps.track1Desc : ps.track2Desc;
}

export function sectionIcon(section: string): string {
  return SECTION_ICONS[section] ?? '📚';
}

/** Localized name for a track ('normal' | 'hard'). */
export function trackName(locale: Locale, track: 'normal' | 'hard'): string {
  const ps = PAGE_STRINGS[locale];
  return track === 'normal' ? ps.trackNormalLabel : ps.trackHardLabel;
}