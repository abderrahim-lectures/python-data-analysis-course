// Per-locale translations for the *navigational* URL segments (learn,
// projects, progress) and track words (normal, hard). Content identity
// slugs (python-101, data-analysis, individual project slugs) are
// deliberately NOT translated here — they're stable identifiers baked into
// gameState's localStorage/XP keys (see gameState.ts's lessonId shape,
// `${section}/${track}/week-${n}`), and progress is shared across locales
// for the same lesson. Renaming those would require decoupling the URL
// slug from the progress-tracking key, which is a separate, larger task.
//
// The builders keep these slug tables as the source of truth for interior
// URL words (localizeHref only rewrites the locale *prefix*, never slugs —
// verified in the i18n PoC), and delegate the prefix swap to localizeHref.
import {localizeHref} from '../paraglide/runtime.js';
export type Locale = 'en' | 'ar' | 'es' | 'fr';

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

export const NAV_WORDS: Record<Locale, {learn: string; projects: string; progress: string; credits: string; cheatsheets: string}> = {
  en: {learn: 'learn', projects: 'projects', progress: 'progress', credits: 'credits', cheatsheets: 'cheatsheets'},
  ar: {learn: 'تعلم', projects: 'مشاريع', progress: 'تقدم', credits: 'المصادر', cheatsheets: 'ملخصات'},
  es: {learn: 'aprender', projects: 'proyectos', progress: 'progreso', credits: 'creditos', cheatsheets: 'referencias'},
  fr: {learn: 'apprendre', projects: 'projets', progress: 'progression', credits: 'credits', cheatsheets: 'antiseche'},
};

export const TRACK_WORDS: Record<Locale, {normal: string; hard: string}> = {
  en: {normal: 'normal', hard: 'hard'},
  ar: {normal: 'عادي', hard: 'صعب'},
  es: {normal: 'normal', hard: 'dificil'},
  fr: {normal: 'normal', hard: 'difficile'},
};

export const MODULE_WORDS: Record<Locale, string> = {
  en: 'modules',
  ar: 'وحدات',
  es: 'modulos',
  fr: 'modules',
};

export const LESSON_WORDS: Record<Locale, string> = {
  en: 'lessons',
  ar: 'دروس',
  es: 'lecciones',
  fr: 'cours',
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
  return locale === 'en' ? base : `${base}${locale}/`;
}

/** Root-absolute path (leading `/`) via localizeHref's prefix swap.
    Interior words come from the slug tables — localizeHref never rewrites
    slugs, it only adds/replaces the `/locale/` segment (or none for EN). */
function localizedPath(parts: string[], locale: Locale): string {
  return localizeHref(`/${parts.filter(Boolean).join('/')}`, {locale});
}

/** localizeHref returns a root-absolute path; re-apply an Astro subpath
    base (normally `/` or `''`, where the path is already correct). */
function withBase(path: string, base: string): string {
  if (base === '/' || base === '') return path;
  return `${base}${path.replace(/^\//, '')}`;
}

export function learnHref(locale: Locale, base: string, ...parts: string[]): string {
  return withBase(localizedPath([NAV_WORDS[locale].learn, ...parts], locale), base);
}

export function projectsHref(locale: Locale, base: string, ...parts: string[]): string {
  return withBase(localizedPath([NAV_WORDS[locale].projects, ...parts], locale), base);
}

/** Top-level `/progress` / `/progreso` / … link (player card on the home page). */
export function progressHref(locale: Locale, base: string): string {
  return withBase(localizedPath([NAV_WORDS[locale].progress], locale), base);
}

/** Top-level `/playground` link. The playground route keeps its EN word in
    every locale (like `modules`/`lessons` interior words). */
export function playgroundHref(locale: Locale, base: string): string {
  return withBase(localizedPath(['playground'], locale), base);
}

/** Top-level `/credits`/`/creditos`/… link. */
export function creditsHref(locale: Locale, base: string): string {
  return withBase(localizedPath([NAV_WORDS[locale].credits], locale), base);
}

/** Top-level `/cheatsheets`/`/referencias`/… link. */
export function cheatsheetsHref(locale: Locale, base: string): string {
  return withBase(localizedPath([NAV_WORDS[locale].cheatsheets], locale), base);
}

export function weekHref(locale: Locale, base: string, section: string, track: 'normal' | 'hard', week: number): string {
  return learnHref(locale, base, section, track, `week-${week}`);
}

/** Build a module href. Track words stay untranslated in URLs — only the
    learn nav word is localized (see NAV_WORDS). */
export function moduleHref(locale: Locale, base: string, section: string, track: 'normal' | 'hard', moduleSlug: string): string {
  return learnHref(locale, base, section, track, 'modules', moduleSlug);
}

/** Build a lesson href. Track words stay untranslated in URLs — only the
    learn nav word is localized (see NAV_WORDS). */
export function lessonHref(locale: Locale, base: string, section: string, track: 'normal' | 'hard', lessonSlug: string): string {
  return learnHref(locale, base, section, track, 'lessons', lessonSlug);
}

