# Active TODO — queued mid-session, 2026-08-30

Tracking list for requests that came in faster than they could be finished.
Check items off as they land; move detail write-ups to `astro-rebuild.md`'s
status log once done, don't duplicate here.

- [ ] **i18n URL segment translation** (in progress): restructure `/ar/learn`,
      `/es/learn`, `/fr/learn` etc. into locale-native segment words
      (`/es/aprender/`, `/fr/apprendre/`, `/ar/تعلم/`, and `/proyectos/`,
      `/projets/`, `/مشاريع/` for projects). Content slugs (`python-101`,
      `data-analysis`, project slugs) stay untranslated — they're
      gameState/XP-tracking keys shared across locales, not display text.
      Also: localize `<title>`/description per locale page (currently
      hardcoded English even on ar/es/fr — real bug), add `hreflang`
      alternate `<link>` tags for SEO.
- [ ] **Button hover states audit**: `.btn-streak`/`.btn-xp` had `:active`
      but no `:hover` at all — fixed. Still need to sweep other custom
      buttons (`.route-pill--normal/--hard` on `/learn` hub, hub card CTAs,
      onboarding buttons) for the same gap.
- [ ] **Top nav icon check**: verify Learn/Projects/Progress nav icons look
      right visually (not just that the name resolves) — screenshot and
      inspect at normal size, not just crop.
- [ ] **Add the full playground**: known gap from earlier in the session —
      no dedicated `/playground` page exists yet, only inline `RunnableCell`
      cells per-lesson. The old Docusaurus `VsCodePlayground` React
      component (Monaco + JupyterLite terminal, ~615 lines across 4 files)
      was never ported. This is a large, separate feature — needs its own
      scoping pass (what's the MVP: just a bigger Monaco editor + run
      button? A saved-snippets sidebar? JupyterLite notebook mode?) before
      implementation starts.

## Already done this session (for context, not re-tracked)
Astro promoted to repo root + Docusaurus removed · UI chrome i18n
(nav/footer/onboarding) · stats+progress merged into one page · project
card art restored (per-project gradient + tag emoji, was a flat 🌍 for
every card) · footer redesign · KaTeX strict-mode warnings silenced.
See `astro-rebuild.md` for full detail.
