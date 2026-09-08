// @ts-check
import {defineConfig} from 'astro/config';
import sitemap from '@astrojs/sitemap';
import {paraglideVitePlugin} from '@inlang/paraglide-js';
import {unified} from '@astrojs/markdown-remark';
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
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar', 'es', 'fr'],
    routing: {prefixDefaultLocale: false},
  },
  vite: {
    plugins: [
      paraglideVitePlugin({
        project: './project.inlang',
        outdir: './src/paraglide',
        emitTsDeclarations: true,
        strategy: ['url', 'globalVariable', 'baseLocale'],
      }),
    ],
  },
  build: {inlineStylesheets: 'auto'},
  compressHTML: true,
  markdown: {
    shikiConfig: {theme: 'github-dark-default'},
    processor: unified({
      remarkPlugins: [remarkAdmonitions, remarkMath],
      rehypePlugins: [
        rehypeFixDocsLinks,
        rehypeDropLeadingH1,
        [rehypeKatex, {strict: false}],
        rehypeRunnablePython,
        rehypeSectionBlocks,
      ],
    }),
  },
  integrations: [
    // No sitemap-level x-default/hreflang here: the @astrojs/sitemap
    // integration cannot derive alternates across the translated URL
    // segments (تعلم vs learn etc.), and a self-referential x-default
    // is a wrong signal. The pages' <head> tags carry the correct
    // alternates (verified by tests/e2e/hreflang.mjs).
    sitemap(),
  ],
});