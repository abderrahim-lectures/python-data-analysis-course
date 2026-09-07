---
title: "Build a Code Formatter"
description: "A Python code tidy-up tool: trims trailing whitespace, normalizes comments to a space after every #, collapses blank-line runs, checks indentation in 4-space steps, reports what changed, and writes formatted.py — wrapped in a one-argument CLI."
difficulty: "beginner"
estimatedMinutes: 60
xpReward: 100
tags: ["Developer Tools", "CLI Tools", "Utility"]
prerequisites:
  - "Reading and writing text files"
  - "String methods: partition, rstrip, lstrip, join"
  - "Running scripts from the terminal with arguments"
learningObjectives:
  - "Inspect a source file line by line and measure its 'dirty' spots"
  - "Apply safe whitespace and comment normalizations with pure string methods"
  - "Collapse blank-line runs and enforce a final newline"
  - "Diagnose indentation that isn't a multiple of 4"
  - "Report before/after stats and wrap the tool in a sys.argv CLI"
---

# 🛠️ 🧹 Build a Code Formatter

Real code arrives messy: trailing spaces at line ends, `#comment` with no space, two blank lines where one belongs, and indentation that skipped the 4-space rule. This project builds a **code formatter** — a small terminal tool that reads a Python file, applies only *safe* whitespace-and-comment normalizations, collapses blank-line runs, checks indentation, prints a report of exactly what changed, and writes the cleaned copy to `formatted.py`. It deliberately limits itself to whitespace and comment spacing (never renames or reorders code), so running it can't break the program. Pure standard library, deterministic, and it becomes a real command: `python3 code_formatter.py messy.py`.

This assumes file I/O and basic string methods. It is an optional, ungraded project — see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Read a deliberately messy sample and print its "dirty marks".
2. Trim trailing whitespace and normalize `#comment` → `# comment`.
3. Collapse blank-line runs and force a final newline.
4. Check indentation against 4-space steps and print warnings.
5. Wire it up as `code_formatter.py <file>` with a before/after report.

## Where to run this

**Locally** is the natural home — the tool types at a file in your own directory.

```bash
mkdir code-formatter && cd code-formatter
touch code_formatter.py
```

**Google Colab, Kaggle Notebooks, and Binder** also run every block; in a notebook you'd call the functions directly (`format_source(...)`) instead of the sys.argv path. The constants are identical everywhere.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-formatter/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-formatter/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcode-formatter%2Fnotebook.ipynb)

## Setup

Zero dependencies; one source file to attack.

### Create the messy sample

```bash
mkdir code-formatter && cd code-formatter
touch code_formatter.py
```

Copy this file as `messy.py`. The trailing spaces exist on purpose — don't let your editor trim them before the experiment:

```python
#sum module
def add(a,b):  #add two numbers
    """Add a and b."""

        return a + b   

def greet(name):
  msg = "hello " + name
   return msg   #too much indent
```

**✅ Checklist**

- ✅ `messy.py` has **10 lines**, and the trailing spaces after `#sum module`, `#add two numbers`, and `return a + b` are still visible in a text editor.
- ✅ `python3 code_formatter.py` runs and prints nothing yet (it's an empty file).

**🤔 Socratic Question(s)**

- Some transformations are *safe* (removing trailing spaces never changes what a program does) and some are not (reordering code). Why is "safe only" a good first formatter — and what would a file full of comments *between* functions break if you reordered lines?
- The sample's line `   return msg   #too much indent` is guilty of three crimes at once. Before writing code, name all three from memory.

## Step 1: Read and inspect the file

First you must *see* the mess. Step 1 reads `messy.py` and reports where it's dirty.

### 1.1 Read all lines

**👟 Starter hint:** `open(...).read().splitlines()` — lines without the trailing `\n`, so each entry is pure content.

```python
# code_formatter.py
import sys

def read_lines(path):
    with open(path) as f:
        return f.read().splitlines()

lines = read_lines("messy.py")
print("lines:", len(lines))
for i, ln in enumerate(lines, 1):
    print(f"{i:>2} |{ln}|")
```

`splitlines()` keeps every line's *content* but drops the newline, so the report can show a line's exact characters — trailing spaces become visible in the `|…|` wrappers. The `|` bars matter: they make invisible whitespace legible.

**🎯 Expected output:**

```
lines: 10
 1 |#sum module   |
 2 |def add(a,b):  #add two numbers   |
 3 |    """Add a and b."""|
 4 ||
 5 |        return a + b   |
 6 ||
 7 |   |
 8 |def greet(name):|
 9 |  msg = "hello " + name|
10 |   return msg   #too much indent|
```

**🩹 If it's off:** If line 1 shows `#sum module` without trailing spaces, your editor auto-trimmed — recreate `messy.py` with a plain `echo`/paste. If line 7 shows nothing inside `|   |`, the whitespace-only line survived — good.

### 1.2 Find the dirty marks

**👟 Starter hint:** Three scans: trailing whitespace, comments glued to text, and non-4 indentation.

```python
# code_formatter.py (continued)
trailing = [i for i, ln in enumerate(lines, 1) if ln != ln.rstrip()]
print("trailing whitespace on:", trailing)

comment_lines = [i for i, ln in enumerate(lines, 1)
                 if "#" in ln and not ln.lstrip().startswith("#!")]
print("comment lines:", comment_lines)

indent_bad = []
for i, ln in enumerate(lines, 1):
    body = ln.lstrip(" ")
    if body and not body.startswith("#"):
        lead = len(ln) - len(ln.lstrip(" "))
        if lead % 4 != 0:
            indent_bad.append((i, lead))
print("indent warnings:", indent_bad)
```

`ln != ln.rstrip()` is the trailing-space test — `rstrip` removes spaces from the *end* only, so any difference is trailing junk. Indentation is measured by *counting* leading spaces: the `lstrip(" ")` gives the body, and `len(ln) - len(body)` is the lead — flagged when it isn't a multiple of 4.

**🎯 Expected output:**

```
trailing whitespace on: [1, 2, 5, 7]
comment lines: [1, 2, 10]
indent warnings: [(9, 2), (10, 3)]
```

**🩹 If it's off:** If any trailing list has different indices, your copy of `messy.py` lost its spaces (see 1.1). If `comment lines` shows different entries, check the `#`-in-line test against the actual file.

### 1.3 Verify the inspection

**✅ Checklist**

- ✅ 10 lines read; trailing whitespace on 1, 2, 5, 7 (line 7 is whitespace-only).
- ✅ Comments exist on 1, 2, 10 — all three glued to text with no space after `#`.
- ✅ Indent warnings at (9, 2) and (10, 3) — running a warning *without* silently rewriting keeps the tool honest.

**🤔 Socratic Question(s)**

- Line 7 contains three spaces and nothing else. Is `isspace()` a better detector of "blank" than `== ""`? Where would a tab-filled line look "blank" under `== ""` but not under `isspace()`?
- `indent_bad` ignores comment-only lines (`startswith("#")`). Why should a *comment* at column 3 be legal even though a *statement* at column 3 isn't?

## Step 2: Trim and fix comments

The safe cleanup: strip trailing whitespace, then put a space after every `#`.

### 2.1 The per-line normalizers

**👟 Starter hint:** A `fix_line` that rstrips and then repairs the comment part with `partition("#")`.

```python
# code_formatter.py (continued)
def fix_line(ln):
    fixed = ln.rstrip()
    if "#" not in fixed or fixed.startswith("#!"):
        return fixed
    pre, _, comment = fixed.partition("#")
    comment = comment.strip()
    if comment == "":
        return pre.rstrip()
    if pre.strip() == "":
        return "# " + comment
    return pre.rstrip() + "  # " + comment
```

The `partition("#")` split keeps the left side (code) separate from the comment, so each side normalizes independently. Comment-at-column-0 → `# sum module`; inline comment → code, two spaces, `# comment`. `#!` (a shebang script header) is left individually alone — it has its own convention.

**🎯 Expected output:** A function, not output yet — but reason through what it does to line 10: `   return msg   #too much indent` → `   return msg  # too much indent`.

### 2.2 Apply it to the whole file

**👟 Starter hint:** Map `fix_line` over all lines and print the result.

```python
# code_formatter.py (continued)
fixed = [fix_line(ln) for ln in lines]
for i, ln in enumerate(fixed, 1):
    print(f"{i:>2} |{ln}|")
```

**🎯 Expected output:**

```
 1 |# sum module|
 2 |def add(a,b):  # add two numbers|
 3 |    """Add a and b."""|
 4 ||
 5 |        return a + b|
 6 ||
 7 ||
 8 |def greet(name):|
 9 |  msg = "hello " + name|
10 |   return msg  # too much indent|
```

**🩹 If it's off:** If line 1 became `  # sum module`, the column-0 branch (`pre.strip() == ""`) didn't run — check you *partitioned* before inspecting `pre`. If `#` still touches text, `comment.strip()` was skipped and the space never inserted.

### 2.3 Verify the cleanup

**✅ Checklist**

- ✅ Trailing spaces gone from 1, 2, 5, 7.
- ✅ `#sum module` → `# sum module`; `#add two numbers` → `# add two numbers`; `#too much indent` → `# too much indent`.
- ✅ Code and comment keep exactly two spaces between them — the `pre.rstrip() + "  # "` contract.

**🤔 Socratic Question(s)**

- `fix_line` treats the *left* side as code. What would happen to a Python *string* containing `#` (`s = "color #ff00aa"`)? Is a string-aware formatter even worth the complexity for a first tool — and what does that say about the "safe subset" boundary?
- `#!` is excluded by a special case. Bash-line comments (`#!`, `##`), docstrings (`"""`), and inline strings all overload `#`. Which single rule of thumb keeps a beginner formatter from corrupting valid files?

## Step 3: Collapse blank runs and force a final newline

Whitespace-only lines and repeated blanks are layout noise. Step 3 tightens them.

### 3.1 One blank at a time

**👟 Starter hint:** Walk the fixed lines, dropping any blank (`""` or whitespace-only) that directly follows another blank.

```python
# code_formatter.py (continued)
def collapse_blanks(lines):
    out = []
    for ln in lines:
        blank = ln.strip() == ""
        if blank and out and out[-1].strip() == "":
            continue
        out.append(ln)
    return out

collapsed = collapse_blanks(fixed)
print("lines after collapse:", len(collapsed))
for i, ln in enumerate(collapsed, 1):
    print(f"{i:>2} |{ln}|")
```

`strip() == ""` calls a blank *whether* it's a truly empty line or a whitespace-only line (`   `) — both are layout, neither carries content. The `out and out[-1].strip() == ""` guard keeps only the *first* of a run, so 2+ blanks collapse to 1 everywhere in one pass.

**🎯 Expected output:**

```
lines after collapse: 9
 1 |# sum module|
 2 |def add(a,b):  # add two numbers|
 3 |    """Add a and b."""|
 4 ||
 5 |        return a + b|
 6 ||
 7 |def greet(name):|
 8 |  msg = "hello " + name|
 9 |   return msg  # too much indent|
```

**🩹 If it's off:** If line 7 still prints as blank, the whitespace-only line wasn't blanked by `strip() == ""` — it was, unless the line holds non-space invisible chars. If a *run of three* leaves two blanks, the guard checked the raw `ln` instead of the last appended line.

### 3.2 The final newline

**👟 Starter hint:** Rejoin with `"\n"` and always end the text with `"\n"`.

```python
# code_formatter.py (continued)
def build_text(lines):
    return "\n".join(lines) + "\n"

text = build_text(collapsed)
print("ends with newline:", text.endswith("\n"))
print("input bytes:", len(open("messy.py").read().encode()),
      "output bytes:", len(text.encode()))
```

A file's last line should end with a newline — the POSIX convention, and the thing `join + "\n"` guarantees even when the source forgot. Byte counts are a quick health check: the cleanup *shrinks* the file (177 → 166 bytes) because junk whitespace is real bytes.

**🎯 Expected output:**

```
ends with newline: True
input bytes: 177 output bytes: 166
```

**🩹 If it's off:** If `ends with newline: False`, the `+ "\n"` landed before the `join`. If output bytes are *larger*, comment normalization added spaces faster than trailing-trim removed them — measure honestly, that's the tool's verdict.

### 3.3 Verify the collapse

**✅ Checklist**

- ✅ 10 lines → 9: the `   ` whitespace-only line collapsed with the blank above it.
- ✅ Exactly one blank line remains between the function bodies.
- ✅ `text` ends in a newline; output (166 bytes) is smaller than input (177).

**🤔 Socratic Question(s)**

- `build_text` adds one `\n` for the whole file. Why is that the *only* newline that count needs — and what would `"\n".join(lines)` *without* the trailing newline do to `splitlines()` on the next read?
- Blank-line collapse is idempotent (running it twice changes nothing the second time). Why is idempotence a *nice property* for a formatter — and which transform in this project is *not* idempotent?

## Step 4: Indentation diagnostics

Indentation is semantics in Python, so the formatter *diagnoses* instead of guessing.

### 4.1 Emit warnings

**👟 Starter hint:** Re-run the lead-count scan and print each non-multiple-of-4 line with its current space count.

```python
# code_formatter.py (continued)
print("INDENT WARNINGS")
for i, ln in enumerate(collapsed, 1):
    body = ln.lstrip(" ")
    if body and not body.startswith("#"):
        lead = len(ln) - len(ln.lstrip(" "))
        if lead % 4 != 0:
            print(f"  line {i}: {lead} spaces (should be a multiple of 4)")
```

The formatter refuses to *guess* the fix — `2` spaces on line 8 and `3` on line 9 are ambiguous (`2` belongs under the `def`, but the tool can't know context), so it surfaces them for the developer's eye.

**🎯 Expected output:**

```
INDENT WARNINGS
  line 8: 2 spaces (should be a multiple of 4)
  line 9: 3 spaces (should be a multiple of 4)
```

**🩹 If it's off:** If the warnings name different lines, the collapsed list has different positions than `messy.py` — the report is about the *current* text. If nothing prints, `lstrip(" ")` on a tab-indented line hides the lead (see the Socratic below).

### 4.2 The tab contract

**👟 Starter hint:** Convert any existing tab runs to 4-space blocks and record whether any existed.

```python
# code_formatter.py (continued)
has_tabs = any("\t" in ln for ln in collapsed)
print("tabs found in source:", has_tabs)
```

`\t` is banned in the sample (and usually in Python source by PEP 8). The check is one `any(...)` over lines; if found, `.expandtabs(4)` would rewrite them — but since `messy.py` has none, the printed answer is `False`, and the tab story stays a documented contract rather than a hidden mutation.

**🎯 Expected output:** `tabs found in source: False`

**🩹 If it's off:** If `True` prints, your copy gained a tab somewhere — decide: keep it diagnostic (report the line) or expand it with `.expandtabs(4)`, replacing later whitespace accounting.

### 4.3 Verify the diagnostics

**✅ Checklist**

- ✅ Warnings name lines 8 (2 spaces) and 9 (3 spaces) — both statements, not comments.
- ✅ `tabs found in source: False`.
- ✅ Nothing was *written* in this step — diagnosis is read-only by design.

**🤔 Socratic Question(s)**

- A line indented with a *tab* silently fails `lstrip(" ")` (its lead is invisible). What single change makes the diagnostic also catch tabs — and which tab width (4 vs 8) would the `% 4` rule assume?
- `def` is at column 0, its body at 4, nested bodies at 8. Given those three facts, is there *any* unambiguous rule for "fix" an indented line's leading spaces — or is the warning the correct product here?

## Step 5: Save the result and make it a CLI

The tool needs a file output and a command-line front door.

### 5.1 Write formatted.py

**👟 Starter hint:** Write `build_text(...)` back through `open(..., "w")` and re-read to prove it round-trips.

```python
# code_formatter.py (continued)
with open("formatted.py", "w") as f:
    f.write(text)

again = open("formatted.py").read()
print("formatted.py lines:", len(again.splitlines()))
print("round-trip identical:", again == text)
```

Persisting the result makes the tool *useful* — `messy.py` stays as the specimen, `formatted.py` is the clean copy. Re-reading and comparing `== text` is the same lossless round-trip discipline you'd use in any pipeline: write, read back, assert equal.

**🎯 Expected output:**

```
formatted.py lines: 9
round-trip identical: True
```

**🩹 If it's off:** If the round-trip says `False`, the extra `"\n"` handling or trailing spaces changed — compare with `repr(text)` vs `repr(again)`.

### 5.2 The dispatcher

**👟 Starter hint:** Read `sys.argv[1]` as the file name, format it, and print the before/after summary.

```python
# code_formatter.py (continued)
def format_file(path):
    lines = open(path).read().splitlines()
    fixed = [fix_line(ln) for ln in lines]
    collapsed = collapse_blanks(fixed)
    text = build_text(collapsed)
    with open("formatted.py", "w") as f:
        f.write(text)
    trailing = [i for i, ln in enumerate(lines, 1) if ln != ln.rstrip()]
    print(f"{path}: {len(lines)} -> {len(collapsed)} lines; "
          f"{len(trailing)} trailing-whitespace fixes; "
          f"see formatted.py")

if __name__ == "__main__":
    format_file(sys.argv[1])
```

The whole pipeline — read, fix, collapse, join, write, summarize — is now *one* function of a file path. `sys.argv[1]` makes it a CLI: type `python3 code_formatter.py messy.py` and the tool edits from the command line.

**🎯 Let's run it:**

```bash
python3 code_formatter.py messy.py
```

**🎯 Expected output:**

```
messy.py: 10 -> 9 lines; 4 trailing-whitespace fixes; see formatted.py
```

**🩹 If it's off:** If an `IndexError` appears, `sys.argv[1]` was missing (run it *with* the file name). If the counts are off from 10→9 and 4, `format_file` re-read a `formatted.py` that already existed — always operate on the specimen file.

### 5.3 Verify the CLI

**✅ Checklist**

- ✅ `python3 code_formatter.py messy.py` writes `formatted.py` (9 lines) and prints the summary.
- ✅ Summary numbers agree with the earlier steps: 10→9 lines, 4 trailing fixes.
- ✅ `messy.py` is untouched (read-only input) — the tool never rewrites the source.

**🤔 Socratic Question(s)**

- `format_file` writes to a *fixed* name `formatted.py`. Second run overwrites the first output. Would you prefer `f"formatted_{path}"` or an `--out` flag — and what's the argument for *not* overwriting the source file directly?
- This formatter is whitespace-only today. If you added one more transform (e.g. blank line after each function `def`), what test would prove it *never* breaks `messy.py`'s meaning — and what does "never changes meaning" even mean for indentation-critical Python?

## ⚠️ Common pitfalls

- **`splitlines` vs `read().split("\n")`.** `splitlines()` ignores the final empty element that a naive `"\n"` split produces — ending up with a spurious blank last line.
- **`lstrip()` strips tabs too.** Counting indent with `len(ln) - len(ln.lstrip())` counts spaces *and* tabs as one char each; use `lstrip(" ")` or a tab-aware pass. (This project checks for tabs separately.)
- **Blank collapse over the wrong list.** Collapsing before trimming means a whitespace-only line (`   `) behaves as *content* and never merges with the blank above it. Order: trim → fix → collapse.
- **`partition` vs `split`.** `partition("#")` keeps all three pieces (pre, "#", post); `split("#")` would mis-handle a comment containing `#` or destroy the limit on the first separator.
- **Comment spacing on strings.** `s = "#ff00aa"` contains a `#` *inside a string literal* — a whitespace-only formatter happily rewrites it. The "safe subset" boundary is your shield; document it.
- **Overwriting the specimen.** Writing `messy.py` back destroys the thing you're measuring. Output to `formatted.py`; keep input read-only.

## What you just built

A working code formatter with a real CLI: line inspection with visible `|…|` bars, trailing-whitespace trimming and `#`-comment spacing via string built-ins, blank-run collapse with an idempotent one-pass sweep, a final-newline guarantee with byte-count proof, read-only indentation diagnostics in 4-space steps, a tab contract check, and a `formatted.py` writer that round-trips byte-identical. Underneath, the patterns are reusable anywhere: **measure the dirty spots before normalizing**, **apply only safe, reversible transforms**, **make blank detection whitespace-aware (`strip() == ""`)**, **diagnose rather than guess when a fix is ambiguous**, and **keep input read-only while shipping output separately**.

:::tip[Run a fuller version without any local setup]
[`examples/code-formatter/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/code-formatter) in the course repo holds the complete formatter as a notebook — inspection, fixes, collapse, diagnostics, and CLI, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Run it on a real file of *yours*: `python3 code_formatter.py some_script.py` and read what it reports.
- Add `.expandtabs(4)` handling so tab-indented files are converted in the same run, with a `Tabs converted: N` line.
- Make output naming smart: `formatted_<basename>` rather than a fixed name, or an `--check` flag that only prints the report without writing a file (CI-friendly).
- Compare against the real thing: run Black (`pip install black`) on the same specimen and diff `formatted.py` vs Black's output — a humbling lesson in how much deeper a *real* formatter goes.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓