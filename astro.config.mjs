// @ts-check
import {defineConfig} from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkAdmonitions from './src/lib/remark-admonitions.mjs';
import rehypeRunnablePython from './src/lib/rehype-runnable-python.mjs';
import rehypeSectionBlocks from './src/lib/rehype-section-blocks.mjs';
import rehypeDropLeadingH1 from './src/lib/rehype-drop-leading-h1.mjs';
import rehypeFixDocsLinks from './src/lib/rehype-fix-docs-links.mjs';

export default defineConfig({
  output: 'static',
  site: process.env.ASTRO_SITE ?? 'https://pyda-course.online/',
  base: process.env.ASTRO_BASE ?? '/',
  build: {inlineStylesheets: 'auto'},
  markdown: {
    shikiConfig: {theme: 'github-dark-default'},
    remarkPlugins: [remarkAdmonitions, remarkMath],
    rehypePlugins: [
      rehypeFixDocsLinks,
      rehypeDropLeadingH1,
      [rehypeKatex, {strict: false}],
      rehypeRunnablePython,
      rehypeSectionBlocks,
    ],
  },
  integrations: [sitemap()],
});
