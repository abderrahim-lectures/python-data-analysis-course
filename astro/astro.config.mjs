// @ts-check
import {defineConfig} from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages deploys to `https://<user>.github.io/<repo>/`, so production
// builds live under that base path. Locally we want plain `localhost:4321/`
// with no prefix, so `astro dev`/`astro preview` default `base` to `/`.
// Custom-domain endpoints override both via `ASTRO_SITE`/`ASTRO_BASE` env in CI.
const isDev = process.argv.includes('dev');

export default defineConfig({
  output: 'static',
  site: process.env.ASTRO_SITE ?? 'https://abderrahim-lectures.github.io/python-data-analysis-course/',
  base: process.env.ASTRO_BASE ?? (isDev ? '/' : '/python-data-analysis-course/'),
  build: {
    inlineStylesheets: 'auto',
  },
  markdown: {
    shikiConfig: {theme: 'github-dark'},
  },
  integrations: [sitemap()],
});
