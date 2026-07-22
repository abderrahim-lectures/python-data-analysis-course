# SEO

A bundle of standard, static-site-appropriate SEO practices, all shipped:
- `static/robots.txt`: allows all crawlers, points at the sitemap, disallows `/share` (per-student, query-string-driven content with no canonical value of its own — also marked `noindex, nofollow` on the page itself and excluded from the sitemap).
- Sitemap plugin config (in the `classic` preset's `sitemap` options): excludes `/share`, sets `changefreq`/`priority`. Docusaurus generates `sitemap.xml` automatically from the doc/page tree, no separate plugin needed.
- Explicit `description` frontmatter on every doc page (all 20 weekly lessons, both section landing pages, the capstone page) in every locale, rather than relying solely on Docusaurus's auto-derived description from body text.
- `themeConfig.image` (`img/social-card.jpg`, used for `og:image`/Twitter cards) — generated once as a real asset; this had silently pointed at a nonexistent file before the SEO pass, so `og:image` was broken on every page until fixed.
- Site-wide `Course` JSON-LD structured data (via top-level `headTags`) and global `keywords` metadata.
- Canonical URLs, `hreflang` alternates across the 4 locales, and per-locale `<html lang>`/`dir` are all handled automatically by Docusaurus's i18n system — no custom code needed.
- All of the above (sitemap URLs, canonical links, `og:url`, `og:image`) automatically track whatever `url`/`baseUrl` is configured, so they update correctly with the custom domain described above.
- The site's author (Abderrahim Adrabi) is credited in `package.json`, `LICENSE`, the footer copyright line, a `<meta name="author">` tag, and the JSON-LD `Course` schema's `author` field.
- Google Analytics via Docusaurus's built-in `gtag` preset option (not a raw pasted script tag — the preset correctly tracks client-side route changes in this single-page app, which a bare script tag would miss after the first load).
