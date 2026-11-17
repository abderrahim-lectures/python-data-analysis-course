// Re-export the KaTeX stylesheet's emitted URL without putting the import in
// a page component's module graph.
//
// `await import('katex/dist/katex.min.css?url')` inside LessonPage resolves
// for every page the component renders, condition or not: Vite treats a
// dynamic import with a literal specifier as a static edge, so the <link>
// appeared on all 1,426 pages even though only 166 render a formula. Keeping
// the specifier here means the edge belongs to this module, which only the
// pages that need it import.
let cached: string | null = null;

export async function katexCssUrl(): Promise<string> {
  if (cached) return cached;
  const mod = await import('katex/dist/katex.min.css?url');
  cached = (mod as {default: string}).default;
  return cached;
}
