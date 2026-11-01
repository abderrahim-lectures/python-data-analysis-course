# Ready-to-file issues — November 2026

The `input()` investigation and the real-user pass that followed produced five issues. Each file
here is one issue body, ready for the repo workflow in `plan/development-workflow.md`
(issue first, then a branch named `issue-<number>-<slug>`).

The fixes for all five are in PR #321; add `Closes #N` to the PR body once the numbers exist.

| # | File | Title | Labels |
|---|---|---|---|
| 1 | `01-input-freeze.md` | Runnable cells that call input() freeze the page | `type:bug,area:playground,area:python-101` |
| 2 | `02-guard-bypass.md` | pythonGuard is bypassable: nine routes to js/pyodide without `import js` | `type:bug,area:playground` |
| 3 | `03-hint-hides-exception.md` | A failing cell shows only the hint — the exception the lesson teaches disappears | `type:bug,area:ui,area:python-101` |
| 4 | `04-editor-enter-newline.md` | Enter in an editable cell puts the caret before the newline, so two statements run as one | `type:bug,area:ui,area:playground` |
| 5 | `05-i18n-cheatsheets-404.md` | Localized learn hubs link /{es,ar,fr}/cheatsheets — 404 | `type:bug,area:i18n` |

No authenticated `gh`? [`new-issue-links.md`](new-issue-links.md) has one prefilled
"[New issue]" link per entry — title, body and labels already in the form; press Submit.

One command files all seven and prints their numbers (needs an authenticated `gh`):

```bash
./issues/file-all.sh
```

Or one at a time:

```bash
gh issue create --title 'Runnable cells that call input() freeze the page' --label 'type:bug,area:playground,area:python-101' --body-file issues/01-input-freeze.md
gh issue create --title 'pythonGuard is bypassable: nine routes to js/pyodide without `import js`' --label 'type:bug,area:playground' --body-file issues/02-guard-bypass.md
gh issue create --title 'A failing cell shows only the hint — the exception the lesson teaches disappears' --label 'type:bug,area:ui,area:python-101' --body-file issues/03-hint-hides-exception.md
gh issue create --title 'Enter in an editable cell puts the caret before the newline, so two statements run as one' --label 'type:bug,area:ui,area:playground' --body-file issues/04-editor-enter-newline.md
gh issue create --title 'Localized learn hubs link /{es,ar,fr}/cheatsheets — 404' --label 'type:bug,area:i18n' --body-file issues/05-i18n-cheatsheets-404.md
gh issue create --title 'Vendored Pyodide is missing openblas, so scipy is broken' --label 'type:bug,area:data-analysis,area:infra' --body-file issues/06-vendored-openblas-missing.md
gh issue create --title 'A lesson fence is a code fragment, so its cell always fails' --label 'type:bug,area:python-101,area:content' --body-file issues/07-fragment-cell-cli-generator.md
```
