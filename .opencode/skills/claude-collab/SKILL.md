---
name: claude-collab
description: Coordinate opencode with a concurrently-running Claude agent working the same repo. Use ANY time you are the opencode side of an opencode↔Claude pair on this course site (or any shared-repo pair), so the two agents verify green without fighting over the same files. Codifies the surface-ownership split, the plan/todo.md coordination protocol, scoped-style collision avoidance, deferred-work handoff, and the stale-.astro-cache trap.
---

# Claude Collaboration (opencode ↔ Claude on the same repo)

Two agents, one repo, no merge fights. This repo is deliberately worked by both
a Claude agent and this opencode agent at the same time. The whole point is to
**move in parallel without overlapping surface**, and to **verify green before
either of us calls it done**.

Used at: `/home/adrabi/dev/pyda-course`.

## Coordination surface (single source of truth)

**`plan/todo.md` is the handshake.** Everything that matters goes there:

- A "Session" section per agent run — what changed, what was verified, what was
  handed back.
- Open items as `- [ ]` checkboxes with enough detail that the *other* agent can
  execute them cold (file:line refs, concrete fix, severity).
- Flags (prefix `⚠️`) for anything the other agent must know, even if resolved.

Rules:
1. Always append, never rewrite the other agent's section. Add a new section
   under it if you need to respond.
2. When you claim work, mark it in your section so the other agent sees it.
3. When you hand back, say WHY it's their surface (which file/rule), not just
   which item.
4. Detail write-ups go in `plan/astro-rebuild.md`; `todo.md` stays terse.

## Surface ownership (this repo, verified 2026-08-30)

**Claude owns** (do NOT edit, even to "just fix a bug"):
- `src/styles/global.css` — design tokens, nav, buttons, responsive.
- `src/layouts/Base.astro` — nav/footer/onboarding dialog/skip-link/i18n wiring.
- `src/lib/gameState.ts`, `gamestats.ts`, anything quest/XP/onboarding logic, and
  **playground hardening** (the `?code=` untrusted-input security work).
- Progress page `src/pages/progress.astro` and locale index pages
  (`ar|es|fr/.../index.astro`), and locale project `[...slug]` routes.
- Package/CI: `package.json`, `.github/workflows/`.

**opencode owns**:
- Build/typecheck health: `tsconfig.json` includes, `npx astro check` at 0 errors.
- `tests/e2e/smoke.mjs` (CDP suite, no Playwright dep).
- Visual/button/hover audit + screenshot→critique loop (see clean-course-ui).
- Scoped polish in page files that are NOT Claude's list above:
  `src/pages/index.astro` (home), `src/pages/learn/index.astro` (EN hub),
  `src/pages/learn/[section]/[track]/[week].astro` (lesson),
  `src/pages/playground.astro` (visual `<style>` only, touch no hardening).
- `plan/todo.md` coordination and this skill.

**Shared / both verify**: `npx astro check`, `npm run build`,
`npm run test:e2e` (34 CDP checks), `npm run test:contrast`, `npm run test:responsive`.

If in doubt about a file: check `git status` + `git diff` first. Uncommitted edits
mean the other agent is mid-flight on that file — treat it as theirs.

## How to avoid collisions

1. **Prefer scoped `<style>` over `global.css`.** When a fix for Claude-owned
   global CSS can live in the page's own `<style>` block (Astro scopes it), put
   it there. Equal specificity + later injection means your scoped rule wins
   without ever touching their file. This is how M6/H2/M5 (lesson nav + route
   card) and H5 (playground) were done without touching global.css.
2. **Re-audit against the CURRENT source, not your stale critique.** The other
   agent commits fast. Check `git log --oneline -5` + the relevant `git diff`
   before re-litigating an audit item — your High/Med/Low may already be fixed
   (this session: contrast commit 56e706d + overflow commit c230e05 absorbed
   H1-partial/H3/M3/L7/H5-output). Re-scope what's actually left.
3. **Don't override a deliberate, *verified* design decision.** If the other
   agent committed a choice that passes their own test (e.g. hard-pill red
   passes `test:contrast`), that's a decision, not a bug. Hand it back as a
   "design question for you" rather than silently re-flipping it.

## Handoff pattern (deferring work on the other's surface)

When an audit item lives in Claude's files (global.css/progress.astro/gameState):

1. Leave the item in `todo.md`'s critique list, NOT checked off.
2. Append a "Handed back to Claude" note with exact `file:line` refs, the
   failing value, the suggested token/fix, and the precedent (e.g. `--streak-text`
   pattern already exists → add `--success-text`).
3. Do NOT touch their file "to be helpful" — an uncoordinated edit in a shared
   working tree risks a conflicting diff at their save time.

## Verify gates (must be green before closing your loop)

```
npx astro check   # 0 errors
npm run build     # clean
npm run test:e2e  # 34/34 CDP
```

**The stale-cache trap**: if `astro check` reports an error on a file that
"objectively looks right" (type has the key, all locales have it, structure
valid), it is almost always a stale `.astro/` incremental type-cache from the
other agent's mid-edit state — NOT a real bug.

```
rm -rf .astro && npx astro check   # re-resolves on a fresh cache
```

Do that BEFORE reporting "you broke typecheck" to the other agent. (This session:
a phantom `skipToContent missing` on uiStrings.ts was exactly this.)

## Loop reminder (with a collaborator)

Run the clean-course-ui loop (screenshot → critique → fix), but on YOUR surface
only. Each pass: pick the highest-value open item on your side → fix scoped →
`astro check` + build + e2e → tick `todo.md` → hand anything on Claude's surface
back with refs. Never "fix forward" into Claude's files. Coordination is the
product feature that the screenshot can't show.