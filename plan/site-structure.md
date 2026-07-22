# Site Structure

```
python-data-analysis-course/
├── docusaurus.config.js       # site config, GH Pages baseUrl/org/repo settings
├── sidebars.js                # 2 sections x 2 tracks x 5 weeks nav tree
├── package.json
├── src/
│   ├── components/
│   │   ├── PlaygroundFab/     # global floating action button + modal/drawer (full-screen on mobile)
│   │   │   ├── index.tsx
│   │   │   └── styles.module.css
│   │   ├── Challenge/          # collapsible challenge+answer block, remembers reveal state
│   │   ├── ProgressCheckbox/   # per-lesson "mark complete" checkbox, feeds progress tracking
│   │   ├── TrackSelector/      # Normal/Hard picker with objectives comparison, shown on section landing pages
│   │   ├── PlacementQuiz/      # self-check quiz gating entry to Data Analysis Hard track
│   │   ├── WeeklyQuiz/         # short auto-graded quiz at the end of each week, unlocks that week's bonus content
│   │   ├── BonusContent/       # optional/advanced block, gated by WeeklyQuiz pass — framed as "🔓 unlock" (gamified) or plain "available once passed" (classical)
│   │   ├── BadgeCase/          # gamified-only: earned badges + progress bar + unlock toast. Classical mode renders the same facts as a plain text progress summary instead
│   │   ├── LearningStylePicker/ # onboarding + persistent toggle: Gamified vs. Classical, drives UiModeContext
│   │   ├── ModeToggle/         # small persistent switch (navbar) so students can flip modes any time
│   │   ├── WelcomeBackBanner/  # "welcome back, {name} — pick up at Week X" shown after a multi-day gap since last visit
│   │   ├── ShareProgress/      # "Share my progress" button: encodes a compact progress summary into a URL, no backend; at 100% completion adds a client-side PDF/PNG certificate download (html-to-image + jsPDF)
│   │   └── DataTransfer/       # "Export my data" (downloads all pda-course:* keys as one JSON file) / "Import my data" (restores from that file) — manual multi-device carry-over, not live sync
│   ├── context/
│   │   └── UiModeContext.tsx   # React context exposing mode: 'gamified' | 'classical' + setter, backed by useLocalStorage
│   ├── hooks/
│   │   ├── useLocalStorage.ts  # small typed wrapper hook around window.localStorage
│   │   ├── useBadges.ts        # badge-earning logic, shared by ProgressCheckbox/WeeklyQuiz/PlacementQuiz
│   │   ├── useQuizScore.ts     # shared scoring logic for WeeklyQuiz and PlacementQuiz
│   │   └── useUnlockCondition.ts  # shared "is this content unlocked yet" check, used by BonusContent and the Data Analysis Hard track gate
│   ├── utils/
│   │   ├── badges.ts           # badge ID definitions + thresholds (single source of truth)
│   │   └── quizScoring.ts      # pure scoring functions; useQuizScore.ts is the thin React-state wrapper around these
│   ├── types/
│   │   └── progress.ts         # shared TypeScript shapes: progress map, badge IDs, quiz results
│   ├── theme/Root.tsx         # swizzled Root to mount the FAB + UiModeContext site-wide
│   └── pages/
│       ├── index.tsx           # landing page: course overview, section/track picker
│       ├── progress.tsx        # student's badge case + overall completion, reads localStorage
│       ├── share.tsx           # read-only rendering of a shared progress link, decodes ?data= from the URL, no localStorage read
│       └── credits.tsx         # dataset/tool attribution: Titanic mirror, Students Performance in Exams, JupyterLite, Pyodide
├── docs/
│   ├── python-101/
│   │   ├── index.md            # section overview + learning objectives (both tracks, comparison table)
│   │   ├── normal/            # week-1.md ... week-5.md
│   │   └── hard/               # week-1.md ... week-5.md  (SLM-from-scratch PBL, pure Python, no numpy)
│   ├── data-analysis/
│   │   ├── index.md            # section overview + learning objectives + "Why Pandas?" speed-problem intro
│   │   ├── normal/            # week-6.md ... week-10.md (pandas 101 + Kaggle repro)
│   │   └── hard/                # week-6.md ... week-10.md (EDA PBL), gated by PlacementQuiz
│   └── bonus/
│       ├── index.mdx           # "Choose your Capstone" — lists every year's project via <CapstoneChooser>
│       └── 2026-ai-agent/       # this year's: install Python locally, build an agent with LangChain's deepagents + a free API key
├── static/
│   └── datasets/               # bundled CSVs, served at a stable URL so pd.read_csv('/datasets/x.csv') works from JupyterLite
├── jupyterlite-config/
│   ├── jupyter_lite_config.json  # JupyterLite build config (Notebook app only, not full Lab — see Playground section)
│   └── files/                    # starter .ipynb per Data Analysis week, prepopulated into the JupyterLite build
├── i18n/
│   ├── ar/                     # Arabic (RTL) — UI strings + full lesson content translated (all 20 weeks, both landing pages, capstone)
│   ├── es/                     # Spanish — UI strings + full lesson content translated (all 20 weeks, both landing pages, capstone)
│   └── fr/                     # French — UI strings + full lesson content translated (all 20 weeks, both landing pages, capstone)
└── .github/workflows/deploy.yml  # build + deploy to GH Pages on push to main
```
