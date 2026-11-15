# Bug write-ups — November 2026

> **Status: all seven are fixed in the tree. None of these were ever filed.**
> This folder was prepared as a batch to file with `gh issue create`, and the
> fixes landed first (PR #321 and its follow-ups), so filing them now would
> create seven issues that open already-closed. The write-ups are kept because
> each one is the reproduction record for a defect that shipped: what a learner
> saw, why it happened, and what the fix changed. Treat them as history, not as
> a queue.
>
> Verified 2026-11-15 against the tree.

| # | File | Defect | Fixed by |
|---|------|--------|----------|
| 1 | [`01-input-freeze.md`](01-input-freeze.md) | A cell calling `input()` booted a second Pyodide on the main thread and froze the tab behind `window.prompt('')` | `a82ac2c`, `449ec64` — every cell runs in the shared worker; values are collected in an inline form |
| 2 | [`02-guard-bypass.md`](02-guard-bypass.md) | `pythonGuard` was bypassable at least eleven ways (continuations, aliased builtins, stdlib `compile`-and-run modules) | `1a2dc86`, `7db7d13` — every demonstrated route refused, four payloads kept as regression tests |
| 3 | [`03-hint-hides-exception.md`](03-hint-hides-exception.md) | A failing cell showed only the beginner hint, hiding the `ValueError` the lesson quotes | `cabb421` — the raw exception prints first, the hint after |
| 4 | [`04-editor-enter-newline.md`](04-editor-enter-newline.md) | Enter in an editable cell put the caret before the newline, so two statements ran as one | `cabb421` — a trailing `<br>` gives the caret a home after the newline |
| 5 | [`05-i18n-cheatsheets-404.md`](05-i18n-cheatsheets-404.md) | Localized learn hubs linked `/{es,ar,fr}/cheatsheets`, all 404 | `cabb421` — localized words (`referencias`, `ملخصات`, `antiseche`) |
| 6 | [`06-vendored-openblas-missing.md`](06-vendored-openblas-missing.md) | `scipy` was broken for every visitor: `openblas-0.3.26.zip` was never vendored | `d76fe37` — the closure accepts `.zip` as well as `.whl` |
| 7 | [`07-fragment-cell-cli-generator.md`](07-fragment-cell-cli-generator.md) | A lesson fence is a fragment, so its runnable cell always raised `NameError` | `remark-no-run-fences.mjs` — a fence can opt out with ```` ```python no-run ```` |

## Filing something new

`new-issue-links.md` still holds one prefilled "[New issue]" link per entry —
harmless to leave, but each one now duplicates a closed defect. `file-all.sh`
would file all seven and should not be run.

For a new bug, follow [`plan/development-workflow.md`](../plan/development-workflow.md):
issue first, then a branch named `issue-<number>-<slug>`.
