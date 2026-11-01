## 5. Localized learn hubs link `/{es,ar,fr}/cheatsheets` — 404

**Labels:** `type:bug`, `area:i18n`
**Severity:** low (dead end in navigation)

### What a learner saw

On `/es/aprender` (and the Arabic and French equivalents), the "Python cheatsheets" link in the
hub note goes to `/es/cheatsheets` → **404**. The cheatsheet page exists at `/es/referencias`
(`/ar/ملخصات`, `/fr/antiseche`).

### Root cause

The `learn_hub_cheatsheets_hint` messages embed their own `<a href>` and carried the *English*
slug behind a locale prefix. Found by crawling the live site from `/`: 1047 pages, every internal
link followed, **3 non-200s — exactly these three**.

### Fix (PR #321)

The three messages point at the localized routes. Everything else on the site resolved 200.
