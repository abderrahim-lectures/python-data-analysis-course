// Per-locale translations for the *navigational* URL segments (learn,
// projects, progress) and track words (normal, hard). Content identity
// slugs (python-101, data-analysis, individual project slugs) are
// deliberately NOT translated here — they're stable identifiers baked into
// gameState's localStorage/XP keys (see gameState.ts's lessonId shape,
// `${section}/${track}/week-${n}`), and progress is shared across locales
// for the same lesson. Renaming those would require decoupling the URL
// slug from the progress-tracking key, which is a separate, larger task.
export type Locale = 'en' | 'ar' | 'es' | 'fr';

export const LOCALES: Locale[] = ['ar', 'es', 'fr'];
export const ALL_LOCALES: Locale[] = ['en', 'ar', 'es', 'fr'];

/** Detect locale from a URL pathname. Checks locale prefixes first,
    then falls back to 'en' for the root path. */
export function detectLocale(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && ALL_LOCALES.includes(segments[0] as Locale)) {
    return segments[0] as Locale;
  }
  if (segments.length > 1 && ALL_LOCALES.includes(segments[1] as Locale)) {
    return segments[1] as Locale;
  }
  return 'en';
}

export const NAV_WORDS: Record<Locale, {learn: string; projects: string; progress: string; credits: string}> = {
  en: {learn: 'learn', projects: 'projects', progress: 'progress', credits: 'credits'},
  ar: {learn: 'تعلم', projects: 'مشاريع', progress: 'تقدم', credits: 'المصادر'},
  es: {learn: 'aprender', projects: 'proyectos', progress: 'progreso', credits: 'creditos'},
  fr: {learn: 'apprendre', projects: 'projets', progress: 'progression', credits: 'credits'},
};

export const TRACK_WORDS: Record<Locale, {normal: string; hard: string}> = {
  en: {normal: 'normal', hard: 'hard'},
  ar: {normal: 'عادي', hard: 'صعب'},
  es: {normal: 'normal', hard: 'dificil'},
  fr: {normal: 'normal', hard: 'difficile'},
};

/** Reverse lookup: URL track word -> canonical 'normal' | 'hard', per locale. */
export function trackFromWord(locale: Locale, word: string): 'normal' | 'hard' | null {
  const w = TRACK_WORDS[locale];
  if (word === w.normal) return 'normal';
  if (word === w.hard) return 'hard';
  return null;
}

/** `/` for EN, `/<locale>/` for others. */
export function localeBase(locale: Locale, base: string): string {
  return locale === 'en' ? '' : `${base}${locale}/`;
}

export function learnHref(locale: Locale, base: string, ...parts: string[]): string {
  const segs = [NAV_WORDS[locale].learn, ...parts].filter(Boolean);
  return `${localeBase(locale, base)}${segs.join('/')}`;
}

export function projectsHref(locale: Locale, base: string, ...parts: string[]): string {
  const segs = [NAV_WORDS[locale].projects, ...parts].filter(Boolean);
  return `${localeBase(locale, base)}${segs.join('/')}`;
}

export function progressHref(locale: Locale, base: string): string {
  return `${localeBase(locale, base)}${NAV_WORDS[locale].progress}`;
}

export function weekHref(locale: Locale, base: string, section: string, track: 'normal' | 'hard', week: number): string {
  return learnHref(locale, base, section, TRACK_WORDS[locale][track], `week-${week}`);
}

/** `/credits`, `/ar/المصادر`, ... */
export function creditsHref(locale: Locale, base: string): string {
  return `${localeBase(locale, base)}${NAV_WORDS[locale].credits}`;
}
