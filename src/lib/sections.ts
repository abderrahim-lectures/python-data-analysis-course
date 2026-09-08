import type {Locale} from './routeSegments';
import {m} from '../paraglide/messages.js';

export const SECTION_ICONS: Record<string, string> = {'python-101': '🐍', 'data-analysis': '📊'};
export const TRACK_ICONS: Record<'normal' | 'hard', string> = {normal: '🌿', hard: '⚡'};

/** Localized name for a section slug (python-101 → track_1_name, else track_2_name). */
export function sectionName(_locale: Locale, section: string): string {
  return section === 'python-101' ? m.track_1_name() : m.track_2_name();
}

/** Localized description for a section slug. */
export function sectionDescription(_locale: Locale, section: string): string {
  return section === 'python-101' ? m.track_1_desc() : m.track_2_desc();
}

export function sectionIcon(section: string): string {
  return SECTION_ICONS[section] ?? '📚';
}

/** Localized name for a track ('normal' | 'hard'). */
export function trackName(_locale: Locale, track: 'normal' | 'hard'): string {
  return track === 'normal' ? m.track_normal_label() : m.track_hard_label();
}