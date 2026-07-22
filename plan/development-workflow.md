# Development Workflow

Every unit of work — a component, a week's content, an infra piece, a bug fix, however small — goes through the same GitHub flow, tracked end to end:

1. **Open a GitHub Issue first**, labeled by type (`type:feature`, `type:bug`, `type:content`, `type:infra`, `type:i18n`) and area (`area:python-101`, `area:data-analysis`, `area:playground`, `area:gamification`, `area:design`), via `gh issue create`.
2. **Branch off `main`**, named after the issue (`issue-<number>-<short-slug>`).
3. **Do the work** on that branch.
4. **Open a PR** via `gh pr create` that references/closes the issue (`Closes #N`).
5. **Merge into `main`** — **run autonomously**: you've given standing authorization to merge PRs without confirming each one, so once a PR's checks (build, smoke tests) pass, it merges without waiting on a go-ahead.

"Small" is scoped at roughly the granularity already broken out across this plan — one issue per component, per week's content, per infra piece — not one issue per individual file edit, which would just produce noise given this project's real size (dozens of components, 20 weekly content pages, i18n scaffolding, a JupyterLite build, a gamification system).

**The loop closes with students, not just us:** every doc page footer carries a small "Found a problem with this page? Report it" link that opens a pre-filled `gh` issue (page path + a `type:bug`/`area:*` label pre-selected) — so a typo or a broken playground embed a student hits mid-lesson feeds into the exact same issue → branch → PR pipeline, rather than getting lost in a Slack DM or forgotten.

This adds prerequisites before any content work starts:
- A **public** GitHub repo named **`python-data-analysis-course`** needs to exist and be connected — there is currently no git repo at all in the working directory (currently named `pyda-course`; it gets renamed to `python-data-analysis-course` to match, or the new repo is simply cloned to a matching path), so step one is `git init` plus `gh repo create python-data-analysis-course --public` (under whichever account `gh` is authenticated as), which also fixes `docusaurus.config.js`'s `baseUrl` to `/python-data-analysis-course/`.
- **GitHub Pages must actually be enabled** on the repo (Settings → Pages → Build and deployment source: "GitHub Actions") — pushing the workflow file alone doesn't turn Pages on, this is a one-time manual repo setting done right after repo creation.
- A `LICENSE` file, since the repo is public (MIT for code is the simple default; course content itself can be flagged separately, e.g. CC-BY, on the credits page if that distinction matters).
- The label set (`type:*`, `area:*`) gets created once, up front, via `gh label create`, before the first real issue.
- **Given the real scale here (~40–60 issues across components, 20 weekly content pages, infra, and i18n), a GitHub Project (board) is created up front** to keep "tracked everything, however small" actually navigable at a glance, rather than a flat, unsorted issue list.
