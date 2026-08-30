// @ts-check
import {defineConfig} from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkAdmonitions from './src/lib/remark-admonitions.mjs';
import rehypeRunnablePython from './src/lib/rehype-runnable-python.mjs';
import rehypeSectionBlocks from './src/lib/rehype-section-blocks.mjs';

// Served from the custom domain https://pyda-course.online/ (GitHub Pages
// CNAME, see public/CNAME) — custom domains serve from root, no repo-name
// subpath, so `base` is `/` in both dev and production. `ASTRO_SITE`/
// `ASTRO_BASE` env vars still override both if that ever needs to change.
export default defineConfig({
  output: 'static',
  site: process.env.ASTRO_SITE ?? 'https://pyda-course.online/',
  base: process.env.ASTRO_BASE ?? '/',
  build: {
    inlineStylesheets: 'auto',
  },
  markdown: {
    shikiConfig: {theme: 'github-dark'},
    remarkPlugins: [remarkAdmonitions, remarkMath],
    // strict: false — the es/fr lesson content writes natural-language prose
    // (with accents, French guillemets) inside LaTeX \text{...} inside math
    // spans, e.g. $P(\text{événement}) \approx ...$. That's valid, renders
    // correctly, but KaTeX's default strict mode still warns on raw Unicode
    // in math mode. These are non-fatal warnings, not errors — silencing the
    // console noise, not working around an actual bug.
    rehypePlugins: [[rehypeKatex, {strict: false}], rehypeRunnablePython, rehypeSectionBlocks],
  },
  integrations: [sitemap()],
});
