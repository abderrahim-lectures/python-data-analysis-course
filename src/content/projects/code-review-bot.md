---
title: "Build a Code Review Bot"
description: "A deterministic review agent: a rule registry that flags line-length, trailing whitespace, bare excepts, debug prints, TODOs, and missing docstrings in a simulated PR diff, aggregates severity, emits an ordered comment list plus a JSON payload, and flips REJECT to APPROVE once a human fixes the blockers."
difficulty: "intermediate"
estimatedMinutes: 75
xpReward: 100
tags: ["AI Agents", "Developer Tools", "APIs"]
prerequisites:
  - "Functions, lists, and dicts"
  - "List and dict comprehensions"
  - "Reading a text file and writing JSON"
learningObjectives:
  - "Model a pull request as lines of code with a file name"
  - "Encode review rules as data (name, severity, test) instead of if-branches"
  - "Attach per-line comments and aggregate them by severity"
  - "Compute an APPROVE/REJECT verdict and export the review as JSON"
  - "Re-review the fixed diff and see the verdict flip"
---

# 🛠️ 🤖 Build a Code Review Bot

Review bots read every pull request so humans don't have to, and before any LLM gets involved, a review bot is mostly *rules*. This project builds one: a deterministic **code review agent** that takes a simulated PR diff (`payment.py`), applies a registry of rules (line length, trailing whitespace, bare `except`, debug `print`, unresolved `TODO`, missing docstrings), attaches a per-line comment for each hit, aggregates them by severity, decides `REJECT` when a major issue exists, exports the whole review as a JSON payload, and then re-reviews the *fixed* diff to watch the verdict flip to `APPROVE`. No network, no randomness, the same diff always produces the same review, which is exactly what makes rule bots auditable: every comment is traceable to a test.

This assumes functions, collections, file I/O, and JSON. It is an optional, ungraded project, see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Model a pull request as a named list of lines.
2. Write rules as data, a registry the bot loops over.
3. Review a diff, attach comments, and aggregate by severity.
4. Compute the verdict and export the report as JSON.
5. Fix the blockers, re-review, and see `REJECT` → `APPROVE`.

## Where to run this

**Locally** is the natural home for a review tool that reads and writes files.

```bash
mkdir code-review-bot && cd code-review-bot
touch review_bot.py
```

**Google Colab, Kaggle Notebooks, and Binder** run everything unchanged, every block is plain Python. The JSON export is still a file you can open.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcode-review-bot%2Fnotebook.ipynb)

## Setup

No packages; one specimen file to review.

### Create the specimen PR

```bash
mkdir code-review-bot && cd code-review-bot
touch review_bot.py
```

Save this as `payment.py`, the "PR under review". Note the two trailing-space lines and the `except:` on purpose:

```python
def process_payment(total, tax_rate):       
    """Compute the final total."""
    discount = 0
    if total > 100:
        discount = total * 0.1
    try:
        final = total + (total * tax_rate) - discount
    except:  # noqa: E722
        print("something went wrong")
    return final

# TODO: add tests for negative totals
def apply_coupon(order_total, coupon):
    return order_total - coupon
# This comment is deliberately stretched out far beyond 72 chars to flag long lines. xxxxxxxxxxxxxxxx  
```

**✅ Checklist**

- ✅ `payment.py` has **15 lines**; line 1 and line 15 end with trailing spaces (still visible in an editor).
- ✅ `final` on line 7, the function that received a docstring, works as the healthy baseline.
- ✅ `python3 review_bot.py` runs with no output yet.

**🤔 Socratic Question(s)**

- A smart reviewer *judges*; this bot only *tests*. Where is the boundary between a rule you can encode as `True/False` and a judgment that needs an LLM or a human?
- The bot's verdict is either `APPROVE` or `REJECT`. What information would a third state (`COMMENT`) add for a merge process where "approve with comments" is a real step, and which of the rules here would ever produce it?

## Step 1: Model the PR

A review bot walks lines. First, a `load_pr` that turns the file into a structure the bot can scan.

### 1.1 The PR as lines

**👟 Starter hint:** A small dataclass-free bundle: `{"file": "payment.py", "lines": [...]}`.

```python
# review_bot.py
import json

def load_pr(path):
    with open(path) as f:
        return {"file": path, "lines": f.read().splitlines()}

pr = load_pr("payment.py")
print("file:", pr["file"], "| lines:", len(pr["lines"]))
for i, ln in enumerate(pr["lines"], 1):
    print(f"{i:>2} |{ln}|")
```

`splitlines()` drops the `\n`, so `pr["lines"]` is *pure content*, a list whose index (as line number) is what a comment will point at. A dict bundle (file name + lines) is the smallest shape a review tool can hand to a rule engine, and it mirrors how real bots receive a pull request (name, then changed lines).

**🎯 Expected output:**

```
file: payment.py | lines: 15
 1 |def process_payment(total, tax_rate):       |
 2 |    """Compute the final total."""|
 3 |    discount = 0|
 4 |    if total > 100:|
 5 |        discount = total * 0.1|
 6 |    try:|
 7 |        final = total + (total * tax_rate) - discount|
 8 |    except:  # noqa: E722|
 9 |        print("something went wrong")|
10 |    return final|
11 ||
12 |# TODO: add tests for negative totals|
13 |def apply_coupon(order_total, coupon):|
14 |    return order_total - coupon|
15 |# This comment is deliberately stretched out far beyond 72 chars to flag long lines. xxxxxxxxxxxxxxxx  |
```

**🩹 If it's off:** If `lines` shows 16, a stray trailing newline added an empty element (or your editor appended one), `splitlines()` handles it, but recount the file. If the `|…|` wrappers lose line 1's trailing spaces, your editor auto-trimmed the specimen (re-paste it).

### 1.2 Verify the model

**✅ Checklist**

- ✅ `pr` is a dict with `file` and `lines`; 15 lines total.
- ✅ Line 1 and line 15 visually show trailing spaces inside `|…|`.
- ✅ Indexing matches: `pr["lines"][7]` is the `except:` line (0-based), rule positions map `i+1`.

**🤔 Socratic Question(s)**

- The dict bundles `file` and `lines`. If you reviewed a *real* GitHub PR, what two or three fields would the bot's input need beyond content (e.g. commit SHA, author)? Why are those parts of a comment's *audit trail*?
- Line numbers are 1-based for humans but Python indexes 0-based. Every comment you produce will carry `line = i + 1`. Where is the bug waiting if one rule forgets the `+1`?

## Step 2: Rules as data

The bot's intelligence is a *registry*, rules encoded as data the engine loops over, so adding a rule means adding a dict, not an if-branch.

### 2.1 The registry

**👟 Starter hint:** Each rule is `(name, severity, test)` where `test(line) -> bool`; `MAX_LINE` caps line length.

```python
# review_bot.py (continued)
MAX_LINE = 72

RULES = [
    {"name": "line-length", "severity": "minor",
     "test": lambda ln: len(ln) > MAX_LINE},
    {"name": "trailing-space", "severity": "minor",
     "test": lambda ln: ln != ln.rstrip()},
    {"name": "bare-except", "severity": "major",
     "test": lambda ln: ln.lstrip().startswith("except:")},
    {"name": "debug-print", "severity": "minor",
     "test": lambda ln: "print(" in ln},
    {"name": "todo-marker", "severity": "info",
     "test": lambda ln: "TODO" in ln or "FIXME" in ln},
    {"name": "missing-docstring", "severity": "minor",
     "test": lambda ln: False},  # needs line context, wired next
]
```

Each rule is a plain dict: a name, a severity, and a pure test. The bare-except test is a truthful over-match (`except:`), and `missing-docstring` is deliberately stubbed to `False` until Step 2.2 gives it context. A registry built from data is what makes the bot *maintainable*, you can extend it from a config file later without editing the engine.

**🎯 Expected output:** None yet, RULES is data. Sanity-check each test by hand: `len("…") > 72` is line-length; `ln != ln.rstrip()` is trailing-space.

### 2.2 Docstrings need context

**👟 Starter hint:** A docstring test that looks at the few lines *after* a `def`, a function has a docstring if its next non-blank line `startswith('"""')`.

```python
# review_bot.py (continued)
def has_docstring(lines, idx):
    for ln in lines[idx:idx + 3]:
        if ln.strip() == "":
            continue
        return ln.lstrip().startswith('"""')
    return False

RULES.append({"name": "missing-docstring", "severity": "minor",
              "test": lambda ln: ln.lstrip().startswith("def ") and
                                 not has_docstring(pr["lines"], 0)})
```

Wait, a lambda can't reach the *current* line index, so this naive wiring will check `pr["lines"][0]` forever. The right shape is a test that takes the *index*, not the line. Rewrite the registry so every test gets `(lines, i)`:

```python
# review_bot.py (continued)
def t_missing_docstring(lines, i):
    return lines[i].lstrip().startswith("def ") and not has_docstring(lines, i)

RULES = [
    {"name": "line-length", "severity": "minor",
     "test": lambda lines, i: len(lines[i]) > MAX_LINE},
    {"name": "trailing-space", "severity": "minor",
     "test": lambda lines, i: lines[i] != lines[i].rstrip()},
    {"name": "bare-except", "severity": "major",
     "test": lambda lines, i: lines[i].lstrip().startswith("except:")},
    {"name": "debug-print", "severity": "minor",
     "test": lambda lines, i: "print(" in lines[i]},
    {"name": "todo-marker", "severity": "info",
     "test": lambda lines, i: "TODO" in lines[i] or "FIXME" in lines[i]},
    {"name": "missing-docstring", "severity": "minor",
     "test": t_missing_docstring},
]
```

All tests now receive `(lines, i)`, most ignore the index; the docstring rule needs it. That uniformity is the contract that lets the engine (Step 3) stay dumb and correct.

**🎯 Expected output:** None, but re-reading the list, you can already predict which lines each test will fire on (1 and 15 for trailing-space, 8 for bare-except, 9 for debug-print, 12 for todo, 13 for docstring, 15 for length).

### 2.3 Verify the registry

**✅ Checklist**

- ✅ Six named rules with severities; each a pure test on `(lines, i)`.
- ✅ `missing-docstring` uses the `t_missing_docstring` context test, not the naive stub.
- ✅ Severities map to policy: `major` only for bare-`except`; the rest `minor`/`info`.

**🤔 Socratic Question(s)**

- The bare-except test matches `except:` but not `except Exception:`, the latter is *more* specific and, arguably, acceptable. Would you encode `except Exception:` as its own rule or teach the test about `except ValueError:`? What's the one-line upgrade?
- Rules-as-data means the engine doesn't know what a "rule" means. If a future bot added an *ML* rule (「this line smells like a bug」), how would severity get assigned there, and what makes the deterministic rules here a good *baseline* to hedge an ML rule against?

## Step 3: Run the review

The engine: loop every rule against every line, attach a comment per hit.

### 3.1 The comment engine

**👟 Starter hint:** `review(pr)` iterates `(rule, line_index)`, runs `rule["test"]`, appends a comment dict.

```python
# review_bot.py (continued)
def review(pr):
    comments = []
    lines = pr["lines"]
    for i in range(len(lines)):
        for rule in RULES:
            if rule["test"](lines, i):
                comments.append({
                    "file": pr["file"],
                    "line": i + 1,            # 1-based for humans
                    "rule": rule["name"],
                    "severity": rule["severity"],
                    "code": lines[i].rstrip(),
                })
    return comments

comments = review(pr)
print("comments:", len(comments))
for c in comments:
    print(f"{c['line']:>2} {c['severity']:<5} {c['rule']:<16} {c['code'][:40]}")
```

One nested loop over rules × lines is the whole engine, adding a rule or a line changes nothing here. Each comment carries `file`, 1-based `line`, `rule`, `severity`, and the *stripped* code snippet, so a human can read it without opening the file. `code = lines[i].rstrip()` keeps the message short while `line` pins the exact location.

**🎯 Expected output:**

```
comments: 7
 1 minor trailing-space    def process_payment(total, tax_rate):
 8 major bare-except       except:  # noqa: E722
 9 minor debug-print       print("something went wrong")
12 info  todo-marker       # TODO: add tests for negative totals
13 minor missing-docstring def apply_coupon(order_total, coupon):
15 minor line-length       # This comment is deliberately stretched out far beyond 72 chars to flag long line
15 minor trailing-space    # This comment is deliberately stretched out far beyond 72 chars to flag long line
```

**🩹 If it's off:** If line 15 appears only once, one of its two rules didn't fire (it's *both* long *and* trailing-spaced, two independent tests, two comments). If line 8 is missing, `lstrip().startswith("except:")` tripped on the `  # noqa` suffix, it shouldn't; the rule tests the *start*.

### 3.2 Severity summary

**👟 Starter hint:** `Counter` over severities, then the verdict: `REJECT` if any `major`.

```python
# review_bot.py (continued)
from collections import Counter

counts = Counter(c["severity"] for c in comments)
print("BY SEVERITY:", dict(counts))
verdict = "REJECT" if counts.get("major", 0) else "APPROVE"
print("VERDICT:", verdict)
```

Seven comments is noise; `{major:1, minor:5, info:1}` is the signal. The verdict is one boolean: the bare `except` that swallows every exception type is the blocker, everything else is polish. Severity aggregation is what turns a wall of comments into a merge decision.

**🎯 Expected output:**

```
BY SEVERITY: {'major': 1, 'minor': 5, 'info': 1}
VERDICT: REJECT
```

**🩹 If it's off:** If `minor` tallies 4, a rule stalled (e.g. `missing-docstring` still on the stub from before Step 2.2, it adds one). If the verdict reads `APPROVE`, `counts.get("major", 0)` changed to `counts["major"]` and crashed/no-op'd, keep the `.get`.

### 3.3 Verify the run

**✅ Checklist**

- ✅ 7 comments: trailing-space ×2 (1, 15), line-length (15), bare-except (8), debug-print (9), todo (12), missing-docstring (13).
- ✅ `{'major': 1, 'minor': 5, 'info': 1}`; `VERDICT: REJECT`.
- ✅ Every comment carries file, 1-based line, rule, severity, and a stripped code snippet.

**🤔 Socratic Question(s)**

- Line 15 earned *two* comments from *two* rules. Is there such a thing as too many comments on one line, and what dedupe policy (e.g. one comment per rule per line, or collapse by line) would a human reviewer thank the bot for?
- The verdict ignores `info` entirely. If the repo policy were "TODOs must be resolved to merge", `todo-marker` would become a *major*. What does that say about whose policy the bot encodes, and how would you parameterize it per-repo without rewriting rules?

## Step 4: Export the report

A review nobody can act on is a thought. Step 4 exports comments as JSON and prints a human summary.

### 4.1 The JSON payload

**👟 Starter hint:** `json.dump` the full review on an API-shaped payload: `verdict`, `counts`, `comments`.

```python
# review_bot.py (continued)
report = {
    "verdict": verdict,
    "counts": dict(counts),
    "comments": comments,
}

with open("review.json", "w") as f:
    json.dump(report, f, indent=2)
print("Wrote review.json with", len(comments), "comments")
```

`review.json` is the *machine* deliverable, an API-shaped payload (`verdict`, `counts`, `comments`) another tool (a GitHub bot, a CI gate, a notification hook) can consume without re-running Python logic. `indent=2` keeps the file human-readable too.

**🎯 Expected output:** `Wrote review.json with 7 comments`, and the file opens with

```json
{
  "verdict": "REJECT",
  "counts": {
    "major": 1,
    "minor": 5,
    "info": 1
  },
  "comments": [...]
}
```

**🩹 If it's off:** If the JSON is one incompressible line, `indent=2` was dropped. If `report["comments"]` renders as `[]`, you appended each comment dict to a *copy* (e.g. `c = review(pr)` twice), call `review` once.

### 4.2 The human summary

**👟 Starter hint:** Print a top-3 "what to fix first" from `major` then severity order, and where to look.

```python
# review_bot.py (continued)
order = {"major": 0, "minor": 1, "info": 2}
lines_by_rule = {}
for c in comments:
    lines_by_rule.setdefault(c["rule"], []).append(c["line"])

print("SUMMARY")
print(f"  verdict: {verdict}")
print(f"  comments: {len(comments)} ({counts.get('major', 0)} major, "
      f"{counts.get('minor', 0)} minor, {counts.get('info', 0)} info)")
for rule in sorted(lines_by_rule, key=lambda r: order.get(
        RULES[[x['name'] for x in RULES].index(r)]['severity'], 2)):
    print(f"  {rule}: lines {sorted(lines_by_rule[rule])}")
```

The summary re-orders rules by severity so the *first* thing a developer reads is the blocker, then the polish items. Sorted line numbers let them jump straight to each fix.

**🎯 Expected output:**

```
SUMMARY
  verdict: REJECT
  comments: 7 (1 major, 5 minor, 1 info)
  bare-except: lines [8]
  line-length: lines [15]
  missing-docstring: lines [13]
  trailing-space: lines [1, 15]
  debug-print: lines [9]
  todo-marker: lines [12]
```

**🩹 If it's off:** If the rule ordering is alphabetical regardless of severity, the `key` mapping lookup is broken, that index dance is fragile; simplify by storing `severity` inside each comment and sorting comments directly (`sorted(comments, key=lambda c: order[c["severity"]])`).

### 4.3 Verify the export

**✅ Checklist**

- ✅ `review.json` has verdict, counts, comments; 7 comments inside.
- ✅ Human summary lists bare-except first (the only major), others grouped by rule with sorted line numbers.
- ✅ JSON and summary tell the same story, identical counts both places.

**🤔 Socratic Question(s)**

- The `comment` dict already carries `severity`, yet the summary re-derives it from `RULES` by name. What bug in that lookup (a renamed rule) reveals about the *duplication* between data-source-of-truth and the report, and what one-line change would make comments self-describing?
- A real bot posts `review.json` to an API endpoint. What fields would you *add* before shipping it to GitHub's API, e.g. `commit_sha`, `pull_request`, `author`, and why does an audit want them in the payload, not just in the log?

## Step 5: Re-review after fixes

The payoff: a developer fixes the blockers, the bot re-runs, and the verdict flips.

### 5.1 Fix the diff

**👟 Starter hint:** Patch the two `major`-adjacent problems, a specific exception instead of bare `except`, and a sane line 15.

```python
# review_bot.py (continued)
fixed_lines = list(pr["lines"])
fixed_lines[7] = "    except ValueError:  # noqa: E722"
fixed_lines[14] = "# This comment is now a sane length."

fixed_pr = {"file": "payment.py", "lines": fixed_lines}
fixed_comments = review(fixed_pr)
fixed_counts = Counter(c["severity"] for c in fixed_comments)
fixed_verdict = "REJECT" if fixed_counts.get("major", 0) else "APPROVE"
print("FIXED BY SEVERITY:", dict(fixed_counts))
print("NEW VERDICT:", fixed_verdict)
```

A list copy (`list(pr["lines"])`) then targeted index writes stand in for "the developer's edits". `except ValueError:` keeps the handler specific (a bare `except` must become a *named* exception or the rule still fires).

**🎯 Expected output:**

```
FIXED BY SEVERITY: {'minor': 3, 'info': 1}
NEW VERDICT: APPROVE
```

**🩹 If it's off:** If `major` still equals 1, the replace didn't land on `fixed_lines[7]` (index 7 is line 8, check 0-based!). If minor is still 5, line 15 wasn't actually shortened to under 72 chars.

### 5.2 The full agent loop

**👟 Starter hint:** A `run_review(pr)` that returns verdict + report, so a caller can review, fix, and re-review in a loop.

```python
# review_bot.py (continued)
def run_review(pr, out="review.json"):
    comments = review(pr)
    counts = Counter(c["severity"] for c in comments)
    verdict = "REJECT" if counts.get("major", 0) else "APPROVE"
    report = {"verdict": verdict, "counts": dict(counts), "comments": comments}
    with open(out, "w") as f:
        json.dump(report, f, indent=2)
    return verdict, report

v1, r1 = run_review(pr)
v2, r2 = run_review(fixed_pr, out="review_v2.json")
print(v1, "->", v2)
print("comments", len(r1["comments"]), "->", len(r2["comments"]))
```

Wrapping the whole pipeline in one `run_review(pr, out=…)` makes the bot *reusable*, review, fix, re-review with two calls. The versioned output file (`review_v2.json`) is the audit trail the loop produces.

**🎯 Expected output:**

```
REJECT -> APPROVE
comments 7 -> 4
```

**🩹 If it's off:** If the first line prints `APPROVE -> APPROVE`, `run_review` didn't inherit the severity logic (copy-paste drift between `review` and the verdict line). If counts read `7 -> 5`, the fixed line 15 still carries trailing space.

### 5.3 Verify the loop

**✅ Checklist**

- ✅ First review: 7 comments, `REJECT` (bare-except is major).
- ✅ After fixing `except:` → `except ValueError:` and shortening line 15: 4 comments, `APPROVE`.
- ✅ `review.json` and `review_v2.json` both written, the bot's full decision history survives.

**🤔 Socratic Question(s)**

- The loop is manual here (you ran `run_review` twice). A real bot would call `run_review` on *every* push. What stop-condition or timeout would keep an autonomous bot from re-reviewing forever on a PR that never converges?
- `REJECT` here means "one major issue". This bot has no notion of *recall rate* (did it miss a real bug?) or *precision* (were its comments noise?). Review bots are usually tuned on both. If you had a corpus of already-merged PRs, how would you measure precision vs recall of these six rules?

## ⚠️ Common pitfalls

- **0-based vs 1-based drift.** The engine indexes `lines[i]` 0-based; every *comment* reports `i + 1`. One rule that forgets the `+1` pins its comment one line off forever.
- **Context rules as lambdas.** `t_missing_docstring` demands `(lines, i)`; a lambda stuck checking `pr["lines"][0]` silently flags every `def` (or, worse, none). Give *all* rules the same `(lines, i)` signature.
- **Bare-except false negatives.** `except:` is caught; `except Exception:` isn't. Decide the policy and encode the startswith exactly (`except:`), never `"except" in line` (which fires on comments like `# except: …`).
- **Trailing-space = whitespace-only lines.** A line of three spaces fails `ln != ln.rstrip()`, flagged as trailing-space, which is arguably *blank-line* noise. Dedupe blank runs before the review loop if that offends the report.
- **Mutating the specimen in place.** `fixed_lines = pr["lines"]` (no copy) would modify the *original* PR while you "fix" it, and `review.json` would silently reflect the edits. Copy before rewriting.
- **Verifying JSON twice.** Opening `review.json` before `run_review` finished (or re-running `review` twice) gives stale or doubled payloads. One `run_review` call per state, one write.

## What you just built

A code review bot end to end: a PR modeled as `{file, lines}`, a rules-as-data registry of six deterministic tests, a two-line engine that scores every rule × every line, per-line comments with severity and code snippet, a `REJECT`/`APPROVE` verdict gated on `major`, a JSON payload plus a human summary, and a re-review loop that flipped the verdict once the bare `except` was named. The transferable spine, **rules as data so the engine stays generic**, **comments pinned to 1-based line numbers with a programmatic payload**, **severity aggregation driving one boolean verdict**, **fixed diff re-reviewed to prove the loop**, is exactly how real CI review bots are built before (or alongside) any LLM judgment layer.

:::tip[Run a fuller version without any local setup]
[`examples/code-review-bot/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/code-review-bot) in the course repo holds the complete bot as a notebook, PR model, rule registry, engine, JSON export, and the fix-and-re-review loop, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Everything is data, **load rules from JSON** instead of hard coding `RULES`, so `review_bot.py` stays unchanged when a rule changes.
- Make the bot a **CLI**: `python3 review_bot.py payment.py [--out review.json]`, reading `sys.argv` like the earlier projects.
- Add a **context rule**: flag `try:` blocks whose `except` is *bare* only when the broad width matters, or a rule that checks `return` on every branch of an `if`.
- Compare against a real reviewer: run **ruff** (`pip install ruff`) on `payment.py` and map each `E…`/`W…` code back to your rules, a honest audit of what hand-written rules miss.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓