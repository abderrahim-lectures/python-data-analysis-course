---
title: "Build a Python Linter"
description: "Build your own linting rules engine on Python's AST, detect unused imports, bare excepts, and oversized functions, then ship it as a CLI that others can run."
difficulty: "advanced"
estimatedMinutes: 90
tags: ["cli", "ast", "static-analysis", "tooling"]
learningObjectives:
  - "Parse Python source into an abstract syntax tree with the ast module"
  - "Traverse the tree with an ast.NodeVisitor and collect nodes by type"
  - "Dot-map imported names to their uses to detect unused imports"
  - "Grade findings by severity and emit an exit-code report for CI"
prerequisites: ["python-101/functions", "python-101/data-structures", "python-101/file-io", "python-101/scope-and-lambdas"]
---

# 🧹 Build a Python Linter

Every serious Python project runs a linter before it merges, and the linter's first job is not rocket science, it's *reading the code's shape*. Python ships a standard-library module called `ast` that parses a `.py` file into a tree of nodes, imports, function definitions, calls, exceptions, that you can walk and inspect. This project builds a working linter on top of it: parse a file, walk the tree, and report three real problems, unused imports, bare `except:` clauses, and functions longer than a line-count limit, with a severity grade per finding and an exit code that lets a CI script fail on them. You're building the engine, and it's small enough to understand every line.

This assumes Python 101, functions, dicts, file I/O, and a feel for variable scope. Nothing beyond that: no packages, no framework, no external services. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Parse a Python file into an AST and inspect what the tree actually looks like.
2. Traverse the tree with `ast.NodeVisitor` to find imports and function definitions.
3. Widen that into the linting pattern: collect every name a file defines and every name it *uses*, then diff.
4. Turn the collected findings into a graded report with line numbers.
5. Wrap the report in a CLI that returns a non-zero exit code when findings are severe, the CI integration habit.

## Where to run this

**Locally with `uv`** is the primary path, a linter's whole reason for existing is pointing it at a real `.py` file in a real repo, and nothing about `ast` cares where the file lives. The steps below write the linter in a small folder with `uv`; pointing it at your own other course projects is the obvious self-test.

**GitHub Codespaces** works identically: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and the exact same commands run in a browser tab, you can even lint the course repo's own root scripts.

**Google Colab, Kaggle Notebooks, and Binder run every step of the engine honestly**, `ast` is pure stdlib, no GPU, no keys, but the *product* here is a CLI over files, and notebooks are the wrong substrate for "run this on my whole project folder." The notebook lints its own bundled scratch file so you can watch the engine work end to end; switch local for the real `python -m pylint`-style use case.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/python-linter/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/python-linter/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpython-linter%2Fnotebook.ipynb)

## Setup

Everything you need before the first parse: `uv`, and a deliberately sloppy test file that demonstrates all three rules at once.

### Install `uv` and scaffold

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then:

```bash
uv --version
mkdir python-linter && cd python-linter
uv init --bare
```

Zero extra packages, `ast` is in the standard library.

### Write a sloppy test file

Paste into `sloppy.py`:

```python
import os
from math import sqrt, floor

def compute(x):
    unused = 42
    result = sqrt(x) + floor(x)
    return result

def process(data):
    try:
        return data["key"]
    except:
        return None

# 11+ line function, to blow past any sane limit
def long_function_start(a, b, c, d):
    one = a
    two = b
    three = c
    four = d
    five = one + two
    six = three + four
    seven = five + six
    eight = seven
    nine = eight
    ten = nine + a
    eleven = ten
    return eleven
```

```bash
uv run python -c "import ast; print('ast ready')"
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `sloppy.py` exists with an unused `import os`, an unused `unused` variable, a bare `except:`, and an over-long `long_function_start`.
- ✅ `uv run python -c "import ast"` succeeds, the whole project is that one line's library.

## Step 1: Parse a file into an AST

A linter sees code the way a compiler does: a tree of nodes, not lines of text. `ast.parse` converts source into that tree, and `ast.dump` shows you the shape, the fastest way to believe the whole approach is a `print(ast.dump(tree))`.

### 1.1 Parse and inspect

```python
# parse_ast.py
import ast
from pathlib import Path

def parse_source(path: str) -> ast.Module:
    source = Path(path).read_text(encoding="utf-8")
    return ast.parse(source)

if __name__ == "__main__":
    tree = parse_source("sloppy.py")
    print("module body has", len(tree.body), "statements")
    for node in tree.body:
        print(f"  {type(node).__name__}: {node.__dict__.get('name', '')!r} at line {node.lineno}")
```

`ast.parse` returns an `ast.Module` whose `.body` is a list of top-level statement nodes, `Import`, `ImportFrom`, `FunctionDef`. Every node carries a `.lineno` attribute, which is what lets you report *line numbers* without tracking them yourself; the `node.__dict__.get('name', '')` peek shows that different node types have different fields, which is why linters branch on node type rather than hoping for a uniform shape.

**👟 Starter hint:** Run it and just *read* the five lines of output, imports, two functions and `long_function_start` all came back as typed nodes with line numbers, before any linting has even been thought about.

**🎯 Expected output:** `module body has 3 statements`, then lines naming `Import` / `ImportFrom` / `FunctionDef` / `FunctionDef` / `FunctionDef` with the correct starting line numbers (1, 2, 4, 9, 14).

**🩹 If it's off:** If `SyntaxError` fires, the test file has a syntax problem, `ast.parse` is a strict parser by design; fix the source (this is also a linter's very first job: a file that won't parse is the highest-severity finding). If `AttributeError: 'Import' object has no attribute 'name'`, your `.get('name', '')` guard isn't used everywhere, every node-printing branch must use `.get`, not `.name`, because `Import` nodes carry `names`, not `name`.

### 1.2 Verify the parse

**✅ Checklist**

- ✅ `ast.parse` succeeds on `sloppy.py` and returns a module whose `.body` has exactly 3 top-level statements.
- ✅ Every printed node shows `type.__name__` and a numeric `lineno`.
- ✅ `node.__dict__` for an `ImportFrom` shows `module='math'` and `names` containing `sqrt` and `floor`.
- ✅ You can explain why the tree is preferred over regex on the source text (hint: indentation and strings).

**🤔 Socratic Question(s)**

- Why would a linter built on regex fail where `ast` succeeds, point at one concrete thing in `sloppy.py` (hint: `import os` inside a *string* would match a regex but is not an import). What makes the tree immune?
- `linting` reads the tree, so your linter can only see things the parser could. What real-world code property is invisible to `ast` by design (hint: it involves names that don't exist yet)? Does that make you *comfortable* limiting which rules you write first?

## Step 2: Walk the tree with NodeVisitor

Manual recursion over `tree.body` works for one level and crumbles at depth: an import inside a function, or a function inside a class, is nested two levels down. `ast.NodeVisitor` is the standard-library answer, you say "call this method every time you see an X node", and it does the recursion for you.

### 2.1 Visit imports and function definitions

```python
# walk.py
import ast
from parse_ast import parse_source

class ImportVisitor(ast.NodeVisitor):
    def __init__(self):
        self.imports = []
        self.functions = []

    def visit_Import(self, node):
        self.imports.append((node.lineno, node.names[0].name))

    def visit_ImportFrom(self, node):
        self.imports.append((node.lineno, f"{node.module}.{node.names[0].name}"))

    def visit_FunctionDef(self, node):
        self.functions.append((node.lineno, node.name, len(node.body)))

if __name__ == "__main__":
    v = ImportVisitor()
    v.visit(parse_source("sloppy.py"))
    print("imports:", v.imports)
    print("functions:", v.functions)
```

The pattern is `visit_X` methods + one `.visit(tree)` call: the visitor framework dispatches each node type to its method and recurses down the tree automatically, including imports nested inside functions, which `tree.body` alone never sees. Each method is free to *collect* into a plain list; the "callbacks as methods, tree traversal as convention" split is the whole design, and it's stronger than manual walking because depth costs nothing.

**👟 Starter hint:** Run it and check `long_function_start` got recorded with its full `len(node.body)`, the visitor recursed into its `body`, which is exactly what manual top-level iteration couldn't.

**🎯 Expected output:** `imports: [(1, 'os'), (2, 'math.sqrt')]`, `functions: [(4, 'compute', 4), (9, 'process', 4), (14, 'long_function_start', 11)]`, note the `11` for the long function.

**🩹 If it's off:** If `functions` is empty, `.visit()` was never called, the visitor only *defines* the methods; the dispatch happens when you pass the tree in. If only top-level functions appear, your visitor recursed manually instead of inheriting `ast.NodeVisitor`, the `super()` traversal (which NodeVisitor does for free) is what descends into nested bodies.

### 2.2 Verify the walk

**✅ Checklist**

- ✅ `ImportVisitor` collects both an `Import` and an `ImportFrom` from top-level *and* from any nested position.
- ✅ Each function's `len(node.body)` reflects its real statement count (11 for `long_function_start`).
- ✅ The visitor recurses, adding a function inside a function inside a function still surfaces it.
- ✅ You can explain why `visit_FunctionDef` collects but does *not* recurse itself (NodeVisitor does the recursion).

**🤔 Socratic Question(s)**

- `NodeVisitor` dispatches on node type name. If two different versions of Python add a *new* statement type your linter has no `visit_` method for, what does the visitor do with it, and is silently ignoring new syntax a feature or a cliff for a linting tool?
- Our visitor records `(lineno, name, body_len)`. What must you store instead if you later want to lint *nested* functions inside a `ClassDef`, and does `.visit()` give that to you for free? Whatever you store, what does it *not* capture?

## Step 3: Detect unused imports

The flavorful lint. An `import os` at the top means nothing if nothing uses it; the detector is a name-diff: collect every name the file *defines* by importing, collect every name the file *uses* as a name (`ast.Name`), and the imports whose aliases never appear in the used set are unused. It's set arithmetic over trees.

### 3.1 Build the name diff

```python
# unused.py
import ast
from parse_ast import parse_source

class NameCollector(ast.NodeVisitor):
    def __init__(self):
        self.imported = {}
        self.used = set()

    def visit_Import(self, node):
        for alias in node.names:
            self.imported[alias.asname or alias.name.split(".")[0]] = node.lineno

    def visit_ImportFrom(self, node):
        for alias in node.names:
            self.imported[alias.asname or alias.name] = node.lineno

    def visit_Name(self, node):
        self.used.add(node.id)

def find_unused_imports(src_path: str) -> list[tuple]:
    v = NameCollector()
    v.visit(parse_source(src_path))
    return [(name, lineno) for name, lineno in v.imported.items()
            if name not in v.used]

if __name__ == "__main__":
    for name, line in find_unused_imports("sloppy.py"):
        print(f"line {line}: unused import {name!r}")
```

The two collections grew symmetrically: `imported` is a `dict` of alias → line (aliases are what other code refers to, `import os` binds `os`, `import math.sqrt` binds `sqrt` as `asname or name.split(".")[0]`, and `from math import sqrt` binds `sqrt` directly), and `used` is the set of every `ast.Name` id the file mentions. An import is "unused" exactly when its bound alias is absent from the used set, and a name *re-exported* deliberately (`__all__`) is the classic false positive this simple version invites (see the pitfalls).

**👟 Starter hint:** Before running, predict what should be flagged: `os` was imported (line 1) and never used, one finding. `sqrt` and `floor` are both used in `compute`. Confirm the tool agrees, then add `print(floor(2.7))` somewhere and watch `math.floor` become "used", seeing the set update is the whole model.

**🎯 Expected output:** Exactly one line: `line 1: unused import 'os'`. `sqrt` and `floor` do not appear.

**🩹 If it's off:** If `sqrt` is wrongly flagged unused, your `visit_Name` deliberately collected *only* top-level names or you never visited the `FunctionDef` bodies, the visitor must collect `Name` use from *every* scope; recursion via `NodeVisitor` handles that. If `os` isn't flagged, you're diffing the wrong collection, `os` is in `imported`, but `used` needs to *not* contain it; print both sets and the diff filters itself.

### 3.2 Verify the unused-import rule

**✅ Checklist**

- ✅ `sloppy.py` yields exactly the one `os` finding.
- ✅ Using `floor` anywhere in a function body clears `floor` from the results, scope doesn't matter.
- ✅ `from x import y as z` binds `z`, not `y`, the `asname or ...` fallback is doing its job.
- ✅ You can state the rule in one sentence: an import is unused iff its bound alias never appears as a used name.

**🤔 Socratic Question(s)

- A name used in a *string* (`"os.path.join..."`) or as a *literal* isn't an `ast.Name`, but a file that does `__all__ = ["os"]` *is* a use. Which direction is the false positive, and what would the code have to add to treat `__all__` correctly? What's the smallest change that keeps your simple version?
- `visit_Name` collects *every* name, including side-effect-free reads like the bare `unused = 42` variable, whose *definition* is a `Name` too. Is "the name appears somewhere" enough for "import is used", or does your rule need to distinguish *reads* from *writes* (hint: `ast.Name` has a `ctx` field, `Store` vs `Load`)?

## Step 4: Grade and report findings

Linters earn their keep by *grading*: a bare `except:` is worse than a long function, and a maintenance-candidate is worse than a style nit. This step widens the collector from one rule to three, assigns each a severity, and produces the printable report your CLI will hand back.

### 4.1 Collect three rule families

```python
# rules.py
from unused import NameCollector, find_unused_imports
from walk import ImportVisitor
from parse_ast import parse_source
import ast

SEVERITY = {"error": 2, "warning": 1, "suggestion": 0}
LIMIT_FUNCTION_LINES = 10

def bare_excepts(src_path: str) -> list[tuple]:
    findings = []
    for node in ast.walk(parse_source(src_path)):
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            findings.append((node.lineno, "bare except: catches everything"))
    return findings

def long_functions(src_path: str, limit: int = LIMIT_FUNCTION_LINES) -> list[tuple]:
    v = ImportVisitor()
    v.visit(parse_source(src_path))
    return [(ln, f"{name} is {bl} lines (>{limit})")
            for ln, name, bl in v.functions if bl > limit]

def lint(src_path: str) -> list[tuple[str, int, str]]:
    report = []
    for name, line in find_unused_imports(src_path):
        report.append(("suggestion", line, f"unused import {name!r}"))
    for line, msg in bare_excepts(src_path):
        report.append(("error", line, msg))
    for line, msg in long_functions(src_path):
        report.append(("warning", line, msg))
    return sorted(report, key=lambda r: (-SEVERITY[r[0]], r[1]))

if __name__ == "__main__":
    for sev, line, msg in lint("sloppy.py"):
        print(f"{sev:>10}  line {line:>3}  {msg}")
```

`ast.walk` is the unvisited twin of `NodeVisitor`, a one-shot generator that yields *every* node in the tree, which is perfect for a rule that cares only about one node type anywhere in the file (`ExceptHandler` with no `type`). The report is a sorted list of `(severity, line, message)` triples, sorted by severity weight first, line second, so `error`s surface before `suggestion`s inside one consistent pass. Rule functions stay independent and share nothing but the report list, which is how a rules engine stays *additive*: new rules are new independent tests, not edits to one spaghetti function.

**👟 Starter hint:** Run the report and confirm all *three* rule families fire on `sloppy.py`, the unused import, the bare except (error, highest), and the long function (warning). Then add `os.getcwd()` to `compute` and watch the unused-import suggestion disappear while the other two stay, each rule is independent.

**🎯 Expected output:** Three lines, `error  line 11: bare except: catches everything`, `warning  line 14: long_function_start is 11 lines (>10)`, `suggestion  line 1: unused import 'os'`, in exactly that severity order.

**🩹 If it's off:** If severity order comes out wrong, the sort key `(-SEVERITY[r[0]], r[1])` values `error=2` → `-2`, and higher weights must sort first, check the `SEVERITY` dict's numbers match the meaning. If the long function reports `11 (>10)` but you set `LIMIT_FUNCTION_LINES = 10`, the `body = 11` count is correct, the limit is a *threshold*, so `> limit` is right; change `>` to `>=` only if you want exactly-10 to count as too long.

### 4.2 Verify the graded report

**✅ Checklist**

- ✅ All three rule families fire on `sloppy.py`, no rule suppresses another.
- ✅ Report lines sort by severity (error → warning → suggestion), each with a real line number.
- ✅ Deleting the bare `except` line removes the error and nothing else, the rules are independent functions.
- ✅ `ast.walk` vs `NodeVisitor` choice is deliberate: `walk` for one-shot whole-tree scans, a visitor when a rule needs accumulated state (like the name-diff).

**🤔 Socratic Question(s)**

- Bumping `LIMIT_FUNCTION_LINES` is a config knob inside the function signature. If a project wants *per-file* limits, what's the smallest change (hint: a `config` dict passed to `lint`) that keeps each rule pure? When does "config" start being worth it, 3 rules or 30?
- Our `ast.walk` for bare excepts scans the entire tree for one node type. The unused-import rule *needs* the two-pass collection from Step 3. What would a linting session that had to re-parse the file for *every rule* cost at 50 rules, and what's the refactor (parse once, pass the tree to each rule) that avoids it?

## Step 5: Ship the CLI

A linter library nobody can run from a terminal is a worksheet, not a tool. Step 5 wraps `lint` in a real command: `argparse` for the path, a human-facing print, a count, and, the CI chef-d'oeuvre, a non-zero exit code when any `error`-or-worse finding is present, so a build script can *fail* on the report.

### 5.1 Write the entry point with exit code

```python
# linter.py
import argparse
import sys
from rules import lint, SEVERITY

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="lint a Python file with ast-based rules")
    parser.add_argument("path", help="path to the .py file to lint")
    parser.add_argument("--fail-on", choices=["error", "warning", "suggestion"],
                        default="error", help="minimum severity that sets a non-zero exit")
    args = parser.parse_args(argv)
    report = lint(args.path)
    for sev, line, msg in report:
        print(f"{args.path}:{line}: {sev}: {msg}")
    failures = [r for r in report if SEVERITY[r[0]] >= SEVERITY[args.fail_on]]
    print(f"{len(report)} finding(s), {len(failures)} at/above '{args.fail_on}'")
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
```

The exit-code contract is the whole step: `main` *returns* an int (0 clean, 1 dirty) and the guard `sys.exit(main())` turns the return value into the process status. `--fail-on` makes the threshold a decision the caller owns, `linter.py sloppy.py` exits 1 by default (an error exists) while `--fail-on suggestion` would exit 1 for the unused import alone, giving CI exactly the toggle a project needs as its standards evolve.

**👟 Starter hint:** Run `uv run python linter.py sloppy.py` and immediately check `$?` (or print the return value), the file *has* an error, so the exit code must be 1. Then fix the bare except in `sloppy.py` and re-run to see the exit fall back to 0.

**🎯 Expected output:** Five lines total, three findings, then `3 finding(s), 1 at/above 'error'`, and the shell's `$?` (equivalently, `main()`'s return) is `1`. After the except fix: exit becomes `0`.

**🩹 If it's off:** If the exit code is always 0 despite findings, `sys.exit(main())` isn't the last line, the return value must land in `sys.exit`, not a print. If `--fail-on suggestion` doesn't flip the exit, the `>=` comparison against the severity weights is inverted or `SEVERITY` numbers are reversed, check by printing `SEVERITY[args.fail_on]`.

### 5.2 Verify the CLI

**✅ Checklist**

- ✅ `uv run python linter.py sloppy.py` prints findings with `path:line: severity: message` and exits `1`.
- ✅ `--fail-on warning` and `--fail-on suggestion` both widen the failing set; `--fail-on error` keeps it narrow.
- ✅ A clean file (or a fixed `sloppy.py`) exits `0` with `0 finding(s)`.
- ✅ A *syntax-error* file, if it won't parse, Step 1's `SyntaxError` actually propagates as a loud crash rather than a silent empty report; you decide later whether to catch it and print a nicer message.

**🤔 Socratic Question(s)

- The exit code distinguishes "0 findings" from "findings below my threshold", both can return 0. For a CI script, is that the contract you want, or would you prefer exit codes 0/1/2 to distinguish clean-from-warnings-and-clean-from-clean? What breaks in the shell either way?
- `--fail-on` toggles *strictness* at runtime. What's the argument for keeping thresholds in the linter's source (per-project config) instead, and what's the concrete downside of the flag when the linter runs in a 30-job pipeline, each with its own threshold?

## ⚠️ Common pitfalls

- **Skipping the parse-fail case.** The first finding in real linting is "file won't parse", `SyntaxError` from `ast.parse` is a crash, and a linter that crashes on bad syntax is worse than one that reports it. Decide early: catch `SyntaxError` and print it as the highest-severity finding (the honest choice), or let it crash loudly (tolerable while you own every input file).
- **Name-based rules tripping on `__all__` and re-exports.** A module that does `from .utils import retry` *to re-export it* has a used-looking name only inside `__all__`, the naive diff flags it unused and a real codebase floods with false positives. The fix is explicitly allowing names listed in `__all__`, or documenting that your linter trades that precision for simplicity.
- **Conflating `Store` and `Load`.** `unused = 42` *defines* a name in a `Store` context; `print(the_name)` *reads* it in a `Load` context. A rule that counts any `ast.Name` as a "use" can't tell "imported and read" from "imported and overwritten", check `node.ctx` and decide per rule whether both sides count.
- **Re-parsing per rule.** One `ast.parse` per rule is fine at 3 rules and quadratic-feeling at 50. Since *every* rule wants the same tree, parse once and pass the tree (or cache it per path) into each independent rule, the same discipline as Step 4's report composition.
- **Exit-code amnesia.** A linter that *prints* findings but exits 0 is theater in CI, the pipeline sees green and merges the bare `except`. The exit code is the product; returning it from `main()` and `sys.exit`-ing it is the inseparable last 1% that makes the other 99% matter.

## What you just built

A working Python linter: `ast.parse` in, a graded, line-numbered report out, with three independent rules, unused imports via a name-diff, bare excepts via whole-tree scans, oversized functions via visitor counts, and a CLI whose exit code can actually gate a build. Every finding is directly tracable to a node in the tree, so nothing here is magic; you can point the same engine at a brand-new rule in ten minutes. The transferable skill is AST programming itself, walking a tree of statements is the backend of linters, formatters, transpilers, test coverers, and code generators, and the "parse once, walk deliberately, diff names" pattern now lives in your hands for every one of them.

:::tip[Run a fuller version without any local setup]
[`examples/python-linter/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/python-linter) in the course repo bundles the visitor, name-diff, rules, and CLI modules plus `sloppy.py` and a notebook that runs the engine step by step. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and lint the bundled file in a browser tab.
:::

## Where to go from here

- **Add a fourth rule:** detect unreachable code with `ast.After`-style analysis, walk for `return` followed by further statements in the same body, the rule that catches dead `print` cleanup before it ships.
- **Auto-fix the easy one:** `--fix` that rewrites the file with the unused-import lines removed, you already know their line numbers, and removing while *also* linting is the honest two-step.
- **Multi-file with `--recursive`:** walk a directory with `pathlib.Path.rglob("*.py")` and merge every file's report into one stream, sorted globally by severity, the step that makes it a real project linter rather than a single-file toy.
- **lint your own code:** point `linter.py` at the course repo's `examples/` and see what the rules say about a mature codebase, then pick the finding you'd fix first and make a PR in your own fork with it.

## Share your project with the class

Built something you're proud of, a rule that caught a real bug in your own code, a linter your teammates adopted? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓