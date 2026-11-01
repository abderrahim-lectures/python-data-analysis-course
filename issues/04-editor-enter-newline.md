## 4. Enter in an editable cell puts the caret before the newline, so two statements run as one

**Labels:** `type:bug`, `area:ui`, `area:playground`
**Severity:** medium (silently wrong code)

### What a learner saw

Click into a runnable cell's code, type `a = 1`, press Enter, type `b = 2`. The cell shows two
lines, but the code that runs is `a = 1b = 2` — a `SyntaxError` at best, a silently different
statement at worst. Same in the playground, where longer snippets are the point.

### Root cause

A caret cannot be placed after a trailing newline inside a `<pre>`: the browser normalises it to
*just before* the newline. `codeEditor.ts` re-renders the highlighted HTML on every keystroke and
restores the caret by character offset, so every following character was inserted before the
newline and the newline drifted to the end.

### Fix (PR #321)

When the source ends with a newline, the re-rendered HTML gets a trailing `<br>`, which gives the
caret a place to sit after it. Verified by typing two lines and running them in the browser.
