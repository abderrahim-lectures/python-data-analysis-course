# Site Structure

```
pyda-course/
├── astro.config.mjs           # Astro 5, static output, sitemap, remark/rehype pipeline
├── package.json               # scripts (dev/build/check/test/test:e2e/contrast/responsive/a11y)
├── tsconfig.json              # strict TypeScript used by astro check + tsc
├── public/
│   ├── CNAME                  # pyda-course.online
│   ├── manifest.json, sw.js   # PWA: installable + offline page precache
│   ├── datasets/              # bundled CSVs (slm-corpus, students-*, titanic)
│   │   └── index.json         # manifest: lesson-referenced names -> shipped CSV files
│   └── (favicons, icons, robots.txt, static assets)
├── src/
│   ├── content/
│   │   ├── config.ts          # content-collection schemas (lessons, projects)
│   │   ├── lessons/           # lesson markdown, fully translated per locale
│   │   │   ├── python-101/{normal,hard}/, data-analysis/{normal,hard}/
│   │   │   └── ar/ es/ fr/    # per-locale lesson copies (49 lessons × 4)
│   │   └── projects/          # Real-World Project pages
│   │       ├── <slug>.md      # English
│   │       ├── ar/ es/ fr/    # per-locale translations
│   ├── pages/
│   │   ├── index.astro        # EN home
│   │   ├── playground.astro    # standalone playground (no lesson context)
│   │   ├── 404.astro          # 404 page = /playground/<code> shared-link fallback
│   │   ├── progress.astro, credits.astro, projects/[...slug].astro
│   │   ├── learn/             # EN lesson tree: /learn/learn/[section]/[track]/lessons/[lesson]
│   │   │   └── python-101/ data-analysis/ lessons templates, modules
│   │   └── ar/ es/ fr/        # translated routes: /ar/تعلم/..., /es/aprender/..., /fr/apprendre/...
│   ├── layouts/
│   │   └── Base.astro         # html shell, nav, footer, hreflang alternates, PWA wiring, lang/dir
│   ├── components/
│   │   ├── learn/             # LessonPage.astro, RelatedProjects.astro (shared lesson renderer)
│   │   ├── RunnableCell.astro, NotebookCell.astro, PlaygroundCell.astro, PlaygroundHead.astro
│   │   ├── projects/          # ProjectArt.astro + project listing/filter components
│   │   ├── Quiz.astro, Toast.astro, LearnerActivity.astro, SceneBg.astro, ModuleNav.astro
│   │   └── (gamified: xp-bar, quests — markup inline in Base.astro + messages)
│   ├── lib/
│   │   ├── gameState.ts       # single pda:state localStorage key: XP/lessons/projects/quests/badges
│   │   ├── routeSegments.ts   # NAV_WORDS + detectLocale + translated URL segments + href builders
│   │   ├── projectSlugs.ts    # localizedProjectSlug: per-locale project URL slug map
│   │   ├── runnable-cell.client.ts  # Pyodide engine, print-wrapping, mountDatasets, friendly errors
│   │   ├── notebookLinks.ts   # Colab/Kaggle/nbviewer/Binder/Deepnote/GitHub URLs from notebooks/
│   │   ├── relatedProjects.ts # lesson -> related-project mapping
│   │   └── rehype-*.mjs       # markdown pipeline: runnable python, section blocks, drop h1, docs links
│   └── styles/
│       ├── global.css         # design tokens, nav, buttons (shared, Claude-owned)
│       └── project-detail.css # project page + hero-art styling
├── notebooks/                 # committed .ipynb companions per lesson (49), generated
├── scripts/
│   └── generate-notebooks.mjs # regenerates notebooks/ from lesson content
├── examples/<slug>/           # real, runnable project companions (uv-friendly)
├── jupyterlite-config/        # vestigial (JupyterLite retired) — remove when CI is next touched
├── tests/
│   ├── unit/                  # vitest: manifest mapping, content wiring, related-projects, strings
│   └── e2e/                   # CDP suites: smoke.mjs (40 checks), contrast.mjs, responsive.mjs, a11y.mjs
└── .github/workflows/
    ├── deploy.yml             # GH Pages deploy (still builds JupyterLite — stale, merge /lite no longer used)
    └── ci.yml
```

The lesson tree (`src/pages/learn/...` + the `ar|es|fr` translated mirrors) is generated statically from the `lessons` content collection; project index and detail pages come from the `projects` collection (EN + locale subfolders). `Base.astro` is the single layout — nav, footer, per-locale `lang`/`dir`, `hreflang` alternates, PWA/manifest wiring.