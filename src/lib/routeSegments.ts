// Per-locale translations for the *navigational* URL segments (learn,
// projects, progress), track words (normal/hard), and the interior
// lessons/modules words. Content identity slugs (python-101,
// data-analysis, individual project/lesson/module slugs) stay untranslated
// — they're stable identifiers baked into gameState's localStorage/XP keys
// (lessonId shape `${section}/${track}/${slug}`), so progress stays shared
// across locales for the same lesson. The route [track] param carries the
// localized track word in the URL while components keep the canonical
// ('normal'|'hard') track via props — the two never mix.
//
// localizeHref only rewrites the locale *prefix*, never the interior words,
// so these builders feed it fully-localized paths.
import {localizeHref} from '../paraglide/runtime.js';
import {localizedProjectSlug} from './projectSlugs';
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

export const NAV_WORDS: Record<Locale, {learn: string; projects: string; progress: string; credits: string; cheatsheets: string; progressGuide: string; pedagogy: string}> = {
  en: {learn: 'learn', projects: 'projects', progress: 'progress', credits: 'credits', cheatsheets: 'cheatsheets', progressGuide: 'progress-guide', pedagogy: 'teaching-approach'},
  ar: {learn: 'تعلم', projects: 'مشاريع', progress: 'تقدم', credits: 'المصادر', cheatsheets: 'ملخصات', progressGuide: 'دليل-التقدم', pedagogy: 'المنهج-التعليمي'},
  es: {learn: 'aprender', projects: 'proyectos', progress: 'progreso', credits: 'creditos', cheatsheets: 'referencias', progressGuide: 'guia-progreso', pedagogy: 'enfoque-pedagogico'},
  fr: {learn: 'apprendre', projects: 'projets', progress: 'progression', credits: 'credits', cheatsheets: 'antiseche', progressGuide: 'guide-progression', pedagogy: 'approche-pedagogique'},
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

/** `/` for EN, `/<locale>/` for others. */
export function localeBase(locale: Locale, base: string): string {
  return locale === 'en' ? base : `${base}${locale}/`;
}

/** True when a content entry id belongs to the given locale. EN ids are
    unprefixed (`python-101/normal/01-printing`); locale ids carry the
    locale prefix (`ar/python-101/...`, `es/...`, `fr/...`). */
export function idInLocale(locale: Locale, id: string): boolean {
  if (locale === 'en') return !/^(ar|es|fr)\//.test(id);
  return id.startsWith(`${locale}/`);
}

/** Strip the locale prefix from a content entry id, returning the EN-style
    canonical id (`ar/python-101/normal/01-printing` → `python-101/normal/01-printing`). */
export function bareId(id: string): string {
  return id.replace(/^(ar|es|fr)\//, '');
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
  // parts[0] is the project slug (English canonical). Translate it to the
  // locale's URL slug so every card/nav/related/JSON-LD link points at the
  // localized route; EN stays the English slug.
  const [slug, ...rest] = parts;
  const translated: string[] = slug ? [localizedProjectSlug(locale, slug)] : [];
  return withBase(localizedPath([NAV_WORDS[locale].projects, ...translated, ...rest], locale), base);
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

/** hreflang/switcher alternates for a top-level nav page (`learn`, `credits`, …). */
export function navWordAlternates(word: keyof typeof NAV_WORDS[Locale]): Record<Locale, string> {
  return Object.fromEntries(
    ALL_LOCALES.map((locale) => [locale, locale === 'en' ? NAV_WORDS[locale][word] : `${locale}/${NAV_WORDS[locale][word]}`]),
  ) as Record<Locale, string>;
}

/** Top-level `/progress-guide`/`/guia-progreso`/… link. */
export function progressGuideHref(locale: Locale, base: string): string {
  return withBase(localizedPath([NAV_WORDS[locale].progressGuide], locale), base);
}

/** Top-level `/teaching-approach`/`/enfoque-pedagogico`/… link. */
export function pedagogyHref(locale: Locale, base: string): string {
  return withBase(localizedPath([NAV_WORDS[locale].pedagogy], locale), base);
}

/** Build a module href with the localized track word and modules word. */
export function moduleHref(locale: Locale, base: string, section: string, track: 'normal' | 'hard', moduleSlug: string): string {
  return learnHref(locale, base, section, trackWord(locale, track), MODULE_WORDS[locale], moduleSlug);
}

/** Build a lesson href with the localized track word and lessons word. */
export function lessonHref(locale: Locale, base: string, section: string, track: 'normal' | 'hard', lessonSlug: string): string {
  return learnHref(locale, base, section, trackWord(locale, track), LESSON_WORDS[locale], lessonSlug);
}

/** Localized track word for a URL segment, e.g. 'عادي' (ar normal), 'dificil' (es hard). */
export function trackWord(locale: Locale, track: 'normal' | 'hard'): string {
  return TRACK_WORDS[locale][track];
}

/** hreflang/switcher alternates for a learn-tree page, keyed by locale.
    `kind` selects the URL shape: 'section' = /[nav]/[section],
    'track' = .../[track], 'lesson'/'module' add their word + slug. */
export function learnAlternates(
  section: string,
  track: 'normal' | 'hard',
  kind: 'section' | 'track' | 'lesson' | 'module',
  slug = '',
): Record<Locale, string> {
  const strip = (p: string) => p.replace(/^\//, '');
  return Object.fromEntries(
    ALL_LOCALES.map((locale) => [
      locale,
      kind === 'lesson'
        ? strip(lessonHref(locale, '', section, track, slug))
        : kind === 'module'
          ? strip(moduleHref(locale, '', section, track, slug))
          : kind === 'track'
            ? strip(learnHref(locale, '', section, trackWord(locale, track)))
            : strip(learnHref(locale, '', section)),
    ]),
  ) as Record<Locale, string>;
}

