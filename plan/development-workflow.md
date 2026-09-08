# Development Workflow

Every unit of work — a component, content, an infra piece, a bug fix, however small — goes through the same GitHub flow, tracked end to end:

1. **Open a GitHub Issue first**, labeled by type (`type:feature`, `type:bug`, `type:content`, `type:infra`, `type:i18n`) and area (`area:python-101`, `area:data-analysis`, `area:projects`, `area:playground`, `area:ui`, `area:infra`), via `gh issue create`.
2. **Branch off `main`**, named after the issue (`issue-<number>-<short-slug>`); the repo has a long-lived feature branch (`redesign/astro-visual-novel`) that the bulk of the Astro migration landed on and merged to `main`.
3. **Do the work** on that branch.
4. **Open a PR** via `gh pr create` that references/closes the issue (`Closes #N`).
5. **Merge into `main`** — **run autonomously**: you've given standing authorization to merge PRs without confirming each one, so once a PR's checks (build, unit suite, CDP smoke suites) pass, it merges without waiting on a go-ahead. On merge, `deploy.yml` redeploys to GitHub Pages (the live site is `https://pyda-course.online/`, the repo is `github.com/abderrahim-lectures/python-data-analysis-course` — Pages is already enabled with Actions as the build source, custom domain configured via `public/CNAME`).

"Small" is scoped at roughly the granularity already broken out across this plan — one issue per component, per content batch, per infra piece — not one issue per individual file edit, which would produce noise.

**The loop closes with students, not just us:** lesson/project pages carry a "Report" affordance that opens a pre-filled `gh` issue (page path + a `type:bug`/`area:*` label pre-selected), so a typo or a broken runnable cell a student hits mid-lesson feeds into the exact same issue → branch → PR pipeline instead of getting lost.

Prerequisites already satisfied (all done during the Astro migration):
- Public repo `abderrahim-lectures/python-data-analysis-course` (the working directory is `pyda-course`, cloned from that remote — no rename needed).
- GitHub Pages enabled with source "GitHub Actions"; `deploy.yml` builds on `main` and deploys.
- `LICENSE` present (MIT for code; course content distinction is flagged on the `/credits` page).
- The label set (`type:*`, `area:*`) and a project board exist for navigability.

Collaboration note (pairing with a Claude-agent on this same repo): the work is split — Claude owns `src/styles/global.css`, `Base.astro`, locale index pages, `gameState.ts`, `package.json`, and `.github/workflows/`; opencode owns `plan/todo.md`, `plan/astro-rebuild.md`, `tests/e2e/smoke.mjs`, and astro-check health. See the `claude-collab` skill for the coordination protocol.

**Verification before merge** (all local, scriptable): `npm run check` (astro check + typecheck), `npm run test` (vitest suites, currently 9 files / ~498 assertions), `npm run build` (~861 pages), then `tests/e2e/smoke.mjs` + the CDP contrast/responsive/a11y suites against `npm run preview` — see [`testing-and-verification.md`](./testing-and-verification.md).