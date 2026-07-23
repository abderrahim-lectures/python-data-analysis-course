import type {ProjectId} from '@site/src/types/progress';

export interface ProjectMeta {
  /** Stable id, kept unchanged even across folder/URL renames — see
   *  ProjectProgressCheckbox and ProjectChooser for why this must never
   *  change once a project ships (it's the localStorage/badge key). */
  id: ProjectId;
  /** ISO "YYYY-MM" date, drives newest-first sort and is shown (formatted, localized) on cards. */
  date: string;
  url: string;
  tags: string[];
}

/**
 * Single source of truth for each real-world project's non-translated
 * metadata (id/date/url/tags). Title/summary text still has to be written
 * per-locale (Docusaurus's i18n extraction needs static, non-templated
 * <Translate> ids, so it can't be centralized here) — see docs/projects/index.mdx
 * and src/pages/index.tsx for where those get merged in.
 */
export const PROJECTS: ProjectMeta[] = [
  {
    id: '2027-finetune-llm',
    date: '2027-07',
    url: '/docs/projects/finetune-llm-unsloth',
    tags: ['Fine-tuning', 'LoRA', 'LLMs'],
  },
  {
    id: '2026-ai-agent',
    date: '2026-06',
    url: '/docs/projects/ai-agent',
    tags: ['AI Agents', 'LangChain'],
  },
];

interface TranslatedProjectText {
  id: ProjectId;
  title: string;
  summary: string;
}

/** Merges each locale's translated title/summary with the shared structural metadata, by id. */
export function mergeProjectMeta(translated: TranslatedProjectText[]) {
  return translated.map((t) => {
    const meta = PROJECTS.find((p) => p.id === t.id);
    if (!meta) {
      throw new Error(`No PROJECTS entry for id "${t.id}" — add one to src/data/projects.ts`);
    }
    return {...t, ...meta};
  });
}

/** Formats a project's "YYYY-MM" date as a localized "Month YYYY" string, e.g. "July 2027". */
export function formatProjectDate(date: string, locale: string): string {
  const [year, month] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {year: 'numeric', month: 'long'}).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}
