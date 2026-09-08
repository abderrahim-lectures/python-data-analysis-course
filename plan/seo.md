# SEO

A bundle of standard, static-site-appropriate SEO practices, all shipped:
- `public/robots.txt`: allows all crawlers, disallows `/share` (a legacy no-longer-routed path), points at the sitemap.
- `@astrojs/sitemap` (in `astro.config.mjs`): generates `sitemap-0.xml` + `sitemap-index.xml` from the statically-rendered page tree across all four locales.
- Explicit `description` frontmatter on every lesson doc (all weeks ± tracks) and project page (across EN/AR/ES/FR), rather than relying on auto-derived body-text descriptions.
- Site-wide structured data and per-page `<title>`/meta/OG handling in `Base.astro` (including a per-locale `og:image` and locale-aware canonicals).
- Canonical URLs, `hreflang` alternates across the 4 locales, and per-locale `<html lang>`/`dir` are emitted by `Base.astro`'s `<link rel="alternate" hreflang=…>` wiring (see `alternates` prop through all locale route templates) — see [`i18n.md`](./i18n.md).
- All of the above (sitemap URLs, canonical links, `og:url`, `og:image`) track the configured `site` (`https://pyda-course.online/`), so they stay correct with the custom domain.
- The site's author (Abderrahim Adrabi) is credited in `package.json`, `LICENSE`, the footer copyright line, `<meta name="author">`, and the site's structured data.
