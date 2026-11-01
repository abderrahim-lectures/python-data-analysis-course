#!/usr/bin/env bash
# Files the five issues in this folder and prints their numbers.
#
#   gh auth status          # must be authenticated for this repo
#   ./issues/file-all.sh
#
# Each issue body is a file here; the labels are the ones from
# plan/development-workflow.md (type:* + area:*). Nothing is pushed anywhere
# else — this only creates the issues, so the numbers can be used for the
# branch name and the pull request's "Closes #N" line.
set -euo pipefail

cd "$(dirname "$0")/.."

file() {
  local body="$1" title="$2" labels="$3"
  local url
  url=$(gh issue create --title "$title" --label "$labels" --body-file "issues/$body")
  printf '%s\t%s\n' "${url##*/}" "$title"
}

file 01-input-freeze.md \
  'Runnable cells that call input() freeze the page' \
  'type:bug,area:playground,area:python-101'
file 02-guard-bypass.md \
  'pythonGuard is bypassable: nine routes to js/pyodide without import js' \
  'type:bug,area:playground'
file 03-hint-hides-exception.md \
  'A failing cell shows only the hint, the exception the lesson teaches disappears' \
  'type:bug,area:ui,area:python-101'
file 04-editor-enter-newline.md \
  'Enter in an editable cell puts the caret before the newline, so two statements run as one' \
  'type:bug,area:ui,area:playground'
file 05-i18n-cheatsheets-404.md \
  'Localized learn hubs link /{es,ar,fr}/cheatsheets and 404' \
  'type:bug,area:i18n'
file 06-vendored-openblas-missing.md \
  'Vendored Pyodide is missing openblas, so scipy is broken' \
  'type:bug,area:data-analysis,area:infra'
file 07-fragment-cell-cli-generator.md \
  'A lesson fence is a code fragment, so its cell always fails' \
  'type:bug,area:python-101,area:content'
