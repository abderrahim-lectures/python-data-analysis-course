import {m} from '../paraglide/messages.js';

// Sections are declared here so every page that lists or names a track reads
// the same list. Before Statistics 101 this file assumed exactly two sections
// (a `section === 'python-101' ? … : …` ternary), which silently gave any new
// section the second section's name and description.
export const SECTION_ORDER = ['python-101', 'data-analysis', 'statistics-101'] as const;
export type SectionId = (typeof SECTION_ORDER)[number];

export const SECTION_ICONS: Record<string, string> = {
  'python-101': '🐍',
  'data-analysis': '📊',
  'statistics-101': '🎲',
};

export const TRACK_ICONS: Record<'normal' | 'hard', string> = {normal: '🌿', hard: '⚡'};

const SECTION_MESSAGES: Record<string, {name: () => string; desc: () => string; badge: () => string}> = {
  'python-101': {name: () => m.track_1_name(), desc: () => m.track_1_desc(), badge: () => m.track_1()},
  'data-analysis': {name: () => m.track_2_name(), desc: () => m.track_2_desc(), badge: () => m.track_2()},
  'statistics-101': {name: () => m.track_3_name(), desc: () => m.track_3_desc(), badge: () => m.track_3()},
};

/** Localized name for a section slug. Unknown slugs fall back to their raw
 *  slug rather than to another section's name, so a half-registered section is
 *  visibly wrong instead of quietly mislabelled. */
export function sectionName(section: string): string {
  return SECTION_MESSAGES[section]?.name() ?? section;
}

/** Localized description for a section slug. */
export function sectionDescription(section: string): string {
  return SECTION_MESSAGES[section]?.desc() ?? '';
}

/** Localized "Track N" badge for a section slug. */
export function sectionBadge(section: string): string {
  return SECTION_MESSAGES[section]?.badge() ?? '';
}

export function sectionIcon(section: string): string {
  return SECTION_ICONS[section] ?? '📚';
}

/** Sections in display order, with their localized copy resolved once. */
export function sectionList(): {slug: string; icon: string; badge: string; name: string; desc: string}[] {
  return SECTION_ORDER.map((slug) => ({
    slug,
    icon: sectionIcon(slug),
    badge: sectionBadge(slug),
    name: sectionName(slug),
    desc: sectionDescription(slug),
  }));
}

/** Localized name for a track ('normal' | 'hard'). */
export function trackName(track: 'normal' | 'hard'): string {
  return track === 'normal' ? m.track_normal_label() : m.track_hard_label();
}
