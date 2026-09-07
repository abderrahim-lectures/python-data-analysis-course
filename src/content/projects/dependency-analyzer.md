---
title: "Build a Dependency Analyzer"
description: "Read a project's declared dependencies, scan its real imports, and flag what's unused or out of policy."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "re", "dependency-management", "file-scanning"]
prerequisites:
  - "Python basics (sets, paths, regex)"
  - "Comfort running Python files from a shell"
learningObjectives:
  - "Parse requirements.txt into structured dependency records with spec types"
  - "Scan a source tree for imports and classify stdlib vs third-party vs local"
  - "Cross-reference declared vs imported to find unused dependencies"
  - "Check declared versions against a local advisory baseline"
  - "Package the pipeline as a CLI whose exit code gates a build"
---

# 🧩 Build a Dependency Analyzer

A `requirements.txt` says a team *intends* to use five packages. The files that were really written say which packages are *actually* imported. The difference between the two is where the waste and the risk live: unused pins bloat installs to this day, and a pinned `numpy==1.26.0` can sit two minor releases behind the security minimum with nobody noticing until a bot scans the manifest. This project builds the little analyzer that closes the gap — parse the manifest, scan the imports, and report what the two disagree on, all with the standard library.

This assumes Python 101 plus comfortable `pathlib` and `re`. Nothing from the Data Analysis module is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Parse `requirements.txt` into `(name, spec)` records and classify each pin as pinned, ranged, or unpinned.
2. Scan a `myapp/` source tree, classify every import as stdlib, third-party, or local.
3. Cross-reference the two: dependencies declared but never imported.
4. Compare declared versions against a local advisory baseline of minimum versions.
5. CLI it with exit codes (`0` = healthy, `1` = unused deps, `2` = policy breach) so a build can act without parsing text.

## Where to run this

**Locally with `uv`** is the recommended path — the tool's whole job is to walk *your* directory, and a directory scanner works best as a local CLI.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work for every step — the notebook at [`examples/dependency-analyzer/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ipynb) runs the same analyzer over a bundled sample project. The honest trade-off: notebooks can't walk an arbitrary repo the way a local CLI can.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdependency-analyzer%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the "install Python, then pip, then a virtual environment tool" chain — and this project is pure standard library.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

Then set up the project:

```bash
uv init dependency-analyzer
cd dependency-analyzer
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `dependency-analyzer/` exists with a `pyproject.toml`.
- ✅ `python -c "import re, sys, pathlib"` succeeds — no third-party packages.

## Step 1: Parse `requirements.txt`

Everything starts from the manifest: one dependency per line, sometimes pinned (`==2.31.0`), sometimes ranged (`>=2.0`, `~=3.0`), sometimes loose (no spec at all). Parsing means extracting `(name, spec)` and classifying the spec, because "is that pin old?" means different things for a locked version than for an open range.

### 1.1 Write the parser

**👟 Starter hint:** Split off inline comments and option lines, take the package name before the first whitespace, and classify the spec with two small regexes:

```python
# parse_req.py
import re

def parse_requirements(path: str) -> list[dict]:
    deps: list[dict] = []
    with open(path) as f:
        for line in f:
            line = line.split("#", 1)[0].strip()
            if not line or line.startswith(("-", ".", "[")):
                continue
            m = re.match(r"^([A-Za-z0-9_.\-]+)\s*(.*)$", line)
            if not m:
                continue
            deps.append({"name": m.group(1).lower(), "spec": m.group(2).strip()})
    return deps

def classify_spec(spec: str) -> str:
    if re.fullmatch(r"==[\d.]+", spec):
        return "pinned"
    return "ranged" if spec else "unpinned"

if __name__ == "__main__":
    for d in parse_requirements("myapp/requirements.txt"):
        print(f"{d['name']:<12} {d['spec'] or '<any>':<16} {classify_spec(d['spec'])}")
```

`line.split("#", 1)[0]` strips inline comments (`requests==2.31.0  # prod`) before anything else; the `line.startswith(...)` guard skips machinery lines like `--index-url` and `.` (a local path dependency). The `classify_spec` regex is deliberately strict about what counts as a pin: `==2.31.0` is locked, while `>=2.0` and `~=3.0` are ranges that drift.

**🎯 Expected output:**

```
requests     ==2.31.0         pinned
pandas       >=2.0            ranged
numpy        ==1.26.0         pinned
flask        ~=3.0            ranged
click        >=8.0            ranged
```

**🩹 If it's off:** If names come out capitalized, the `.lower()` on `m.group(1)` is missing — package names are case-insensitive on PyPI but file paths aren't, so normalize to lowercase up front. If `--index-url https://...` ends up as a "dependency", the `-` guard only fires before `.strip()` sliced it — check the guard order: split → strip → skip empties → skip option-looking lines.

### 1.2 Verify the parser

**✅ Checklist**

- ✅ A `#` comment on its own line and inline after a pin are both ignored.
- ✅ `pip freeze`-style `package==1.2.3` and PEP 440 `package>=1.2,<2` both produce `(name, spec)` pairs.
- ✅ Lines never seen in `requirements.txt` — blank, option, `-r other.txt` — are skipped without crashing.

**🤔 Socratic Question(s)**

- Pinned vs ranged vs unpinned is a *one-bit* classification. A `~=3.0` (compatible-release) and a `>=20,<21` (bounded upper) pin differently but both say "ranged". What would a richer spec parser need to add to distinguish "bounded drift" from "open drift" — and which of the two should a security scan treat as riskier?
- `-e .` (editable local installs) and `-r base.txt` (includes another file) both start with `-` and get skipped. What's wrong with lumping them under "options" — what do those two *actually* mean for the dependency set?

## Step 2: Scan the imports

The manifest is one side of the truth; the code is the other. Scanning means walking every `.py` under your project root, pulling the module name out of each `import x` / `from x import y`, and classifying each name as *stdlib* (check against `sys.stdlib_module_names`), *your own* (a project prefix), or *third-party*. The third bucket is the one that gets compared against the manifest.

### 2.1 Write the scanner

**👟 Starter hint:** One line-anchored regex for import statements, `Path.rglob("*.py")` for the walk, and `sys.stdlib_module_names` for classification — all stdlib:

```python
# scan.py
import re
import sys
from pathlib import Path

IMPORT_RE = re.compile(r"^\s*(?:import|from)\s+([\w.]+)", re.M)
STDLIB = set(sys.stdlib_module_names)

def scan_directory(root: str) -> set[str]:
    imports: set[str] = set()
    for path in Path(root).rglob("*.py"):
        imports |= {m for m in IMPORT_RE.findall(path.read_text())}
    return {name.split(".")[0] for name in imports}

def classify(imports: set[str], project: str) -> tuple[set[str], set[str], set[str]]:
    stdl, third, local = set(), set(), set()
    for name in imports:
        if name in STDLIB:
            stdl.add(name)
        elif name == project or name.startswith(project + "."):
            local.add(name)
        else:
            third.add(name)
    return stdl, third, local

if __name__ == "__main__":
    Path("myapp").mkdir(exist_ok=True)
    Path("myapp/app.py").write_text(
        "import os\nimport sys\nimport requests\nimport pandas as pd\n"
        "from myapp.utils import normalize\n")
    Path("myapp/utils.py").write_text(
        "import datetime\nimport numpy as np\n"
        "def normalize(value):\n    return value\n")

    imports = scan_directory("myapp")
    stdl, third, local = classify(imports, project="myapp")
    print("stdlib:", sorted(stdl))
    print("third-party:", sorted(third))
    print("local:", sorted(local))
```

The scan normalizes `from pandas import DataFrame` and `import pandas as pd` to the same top-level name `pandas` — `name.split(".")[0]` cuts `myapp.utils` down to `myapp` too, so every import collapses to the single word the manifest would declare. `sys.stdlib_module_names` is the whole point of this generation of Python: a curated set of stdlib names, no hard-coded list to maintain. The two demo files exist to be *scanned*, not run — `app.py` uses `pandas` which isn't installed here, and that's exactly why you don't execute the code you're analyzing.

**🎯 Expected output:**

```
stdlib: ['datetime', 'os', 'sys']
third-party: ['numpy', 'pandas', 'requests']
local: ['myapp']
```

**🩹 If it's off:** If `myapp` appears in the stdlib bucket, `sys.stdlib_module_names` isn't present (Python < 3.10) — the whole `STDLIB` set is empty then, so everything falls through to third-party; run on 3.10+. If imports in the middle of a file are missed, `IMPORT_RE` uses `^` *with* the `re.M` flag — drop the `re.M` and only line-*started* `import`s match, which will silently skip indented imports inside functions (valid Python, and the regex can't tell them apart).

### 2.2 Verify the scan

**✅ Checklist**

- ✅ Standard library names (`os`, `sys`, `datetime`) land in stdlib, not third-party — the classification uses `sys.stdlib_module_names`, not a typewriter guess.
- ✅ `import pandas as pd`, `from myapp.utils import normalize`, and `import requests` all collapse to `pandas`/`myapp`/`requests`.
- ✅ A directory with no `.py` files yields an empty import set, not a crash.

**🤔 Socratic Question(s)**

- The scanner is text-based: it reads `import` *tokens*, not code. `import numpy as np  # in a comment` would be caught, and `if False: import numpy` too. What does an AST-based scanner (the `ast` module) add over regex — and what does it still *not* know that a runtime profile (`import foo` then `foo()` at runtime) would?
- Relative imports (`from . import x`, `from ..y import z`) silently vanish from this scanner. Why does `.` fail the `\w`-anchored regex — and is missing a relative import a *safe* failure for an "unused dependency" report or a *dangerous* one?

## Step 3: Find unused dependencies

Now the payoff of having both sides: **declared** (from `requirements.txt`) minus **imported** (what the code actually pulls in). Anything declared-but-not-imported is either dead weight to cut or a sign the scan is missing something — both are worth a human looking. The check is a set difference; the honesty is in admitting the set difference is only as good as the scanner.

### 3.1 Write `find_unused`

**👟 Starter hint:** One function, one set subtraction, a sorted list out — the value isn't the arithmetic, it's that you *have* two trustworthy sets to subtract:

```python
# unused.py
def find_unused(declared: set[str], imported: set[str]) -> list[str]:
    return sorted(declared - imported)
```

### 3.2 Run it on the project

```python
# step3.py
from parse_req import parse_requirements
from scan import scan_directory
from unused import find_unused

declared = {d["name"] for d in parse_requirements("myapp/requirements.txt")}
imported = scan_directory("myapp")
for name in find_unused(declared, imported):
    print(f"unused: {name}")
```

Three imported packages (`requests`, `pandas`, `numpy`) match three declared ones; `flask` and `click` are declared but never imported. The reverse direction — *imported but not declared* — is just as juicy and a one-line change (`imported - declared`), but it's a different bug: your code won't install in a fresh env at all. Scope decided here is "declared but unused", because it's the branch you can act on immediately (delete the lines) and because the fresh-env job is often a separate tool's job.

**🎯 Expected output:**

```
unused: click
unused: flask
```

**🩹 If it's off:** If pandas shows as unused, the classifier sent it to the *local* bucket (did the project prefix match `pandas.`?) — then it never lands in `imported` for the subtraction. Check `classify`'s `elif` ordering. If *everything* is unused, `scan_directory` walked the wrong root — the demo scans `myapp/`, so confirm the `requirements.txt` path and the `--dir` are the same tree.

### 3.3 Verify the unused list

**✅ Checklist**

- ✅ Declared set is `{requests, pandas, numpy, flask, click}`; imported set is `{os, sys, datetime, requests, pandas, numpy, myapp}`; difference is exactly `{click, flask}`.
- ✅ Unused output is alphabetized (sorted), so tests can depend on the order.
- ✅ Removing `flask~=3.0` and `click>=8.0` from `requirements.txt` empties the unused list — the tool finds dead pins, it doesn't imagine them.

**🤔 Socratic Question(s)**

- Regional name collision: you declare `requests` (the PyPI package) but you *also* have a local `requests/` module — the set subtraction sees a used dependency and stays quiet. What does a tool have to add (scenario: check *how* a name is imported, e.g. `from requests import Session` vs `import requests.utils` picking a local file) before it can call this column "verified used"?
- `click` and `flask` are "unused" per the scan, but `flask` often loads another declared plugin by *entry point*, not by import. What does that say about an analyzer that only sees `import` lines — is "unused" a verdict or an alert?

## Step 4: Check versions against the advisory baseline

Unused is waste; *out of policy* is risk. This step compares every declared spec against a local advisory registry — a dict of minimum acceptable versions. It stands in for the real-world plumbing (`pip-audit`, OSV, PyPI metadata), which needs network calls; same shape, honest about the substitution. A pinned `==1.26.0` below the `>=1.30` floor gets the red line.

### 4.1 Write the version checker

**👟 Starter hint:** Extract a numeric version from each spec side with one loose regex, compare as integer tuples, and describe the outcome per dependency:

```python
# health.py
import re

ADVISORY = {
    "requests": ">=2.28",
    "numpy": ">=1.30",
    "flask": ">=2.2",
    "pandas": ">=1.5",
}

def version_tuple(spec_part: str) -> tuple[int, ...]:
    m = re.search(r"\d+(?:\.\d+)*", spec_part)
    return tuple(int(p) for p in m.group(0).split(".")) if m else (0,)

def check_advisories(name: str, spec: str) -> str:
    rule = ADVISORY.get(name)
    if not rule:
        return "not in advisory registry"
    mine = version_tuple(spec) if spec else (0,)
    minimum = version_tuple(rule)
    state = "ok" if mine >= minimum else "BELOW ADVISORY MINIMUM"
    have = ".".join(map(str, mine))
    return f"{state} (have {have}, min {'.'.join(map(str, minimum))})"
```

```python
# step4.py
from parse_req import parse_requirements
from health import check_advisories

for d in sorted(parse_requirements("myapp/requirements.txt"), key=lambda d: d["name"]):
    print(f"{d['name']:<12} {d['spec'] or '<any>':<16} {check_advisories(d['name'], d['spec'])}")
```

`version_tuple` is the whole comparison in eight lines: it grabs the first `major.minor(.patch)` run out of any spec string, so `==2.31.0`, `~=3.0`, and `>=2.28` all become integer tuples worth comparing. int-tuple comparison is Python's built-in version ordering: `(2, 31, 0) >= (2, 28)` is `True`, `(1, 26, 0) >= (1, 30)` is `False` — no string-sorting traps. An *unpinned* declared dep (`click` with no spec) gets `(0, ...)` — treated as "could be anything", so the registry's letter decides it.

**🎯 Expected output:**

```
click        >=8.0            not in advisory registry
flask        ~=3.0            ok (have 3.0, min 2.2)
numpy        ==1.26.0         BELOW ADVISORY MINIMUM (have 1.26.0, min 1.30)
pandas       >=2.0            ok (have 2.0, min 1.5)
requests     ==2.31.0         ok (have 2.31.0, min 2.28)
```

**🩹 If it's off:** If `version_tuple("~=3.0")` returns `(0,)`, the regex is looking for digits *anchored* (`^\d+`) instead of a search — `~` precedes the `3`. If `click` shows `ok` instead of `not in advisory registry`, `ADVISORY.get(name)` is defaulting, meaning a `numpy`-style key isn't `click` — string keys are exact; registry misses are the *designed* outcome, not a fallback.

### 4.2 Verify the advisory check

**✅ Checklist**

- ✅ A package below its minimum (`numpy`) is flagged; one at/above (`requests`, `flask`, `pandas`) is "ok".
- ✅ A package with no registry entry (`click`) is reported as un-reviewed, not silently absent.
- ✅ `--no ad` string-tricks: `~=3.1` and `>=3.1` compare equal as tuples, and `2.28` ≠ `2.28.1` — tuple length is part of the ordering.

**🤔 Socratic Question(s)**

- `version_tuple("~=3.0")` returns `(3, 0)` and compares it as *at least* 3.0. In PEP 440, `~=3.0` really means `>=3.0, <4` — "compatible release". What does ignoring the upper bound make your analyzer claim that it can't actually promise?
- The registry is a local dict. In a real project it would come from a queryable feed (PyPI JSON, OSV). What does the comparison *shape* change when the source of truth is a live API — and what starts failing when there's no network in CI?

## Step 5: The CLI and the exit code

The analyzer's job is done when a build script can treat the answer as a *verdict*, not a text dump. The CLI takes `--dir`, composes parse → scan → unused → advisory, prints three lines of summary, and returns `0` (healthy), `1` (unused deps), or `2` (advisory breach) — so CI can fail on `$?` without reading your report at all.

### 5.1 Write `analyze.py`

**👟 Starter hint:** `argparse` for `--dir`, reuse every function from the previous steps, and set `sys.exit` from the two failure buckets:

```python
# analyze.py
import argparse
import sys
from pathlib import Path

from health import check_advisories
from parse_req import parse_requirements
from scan import scan_directory
from unused import find_unused

def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze a project's Python dependencies.")
    parser.add_argument("--dir", default=".")
    args = parser.parse_args()

    root = Path(args.dir)
    req = parse_requirements(root / "requirements.txt")
    imported = scan_directory(str(root))
    declared = {d["name"] for d in req}

    unused = find_unused(declared, imported)
    policy_budget = 0
    warnings = []
    for d in sorted(req, key=lambda d: d["name"]):
        report = check_advisories(d["name"], d["spec"])
        if "BELOW" in report:
            policy_budget = 2
            warnings.append(f"{d['name']} {d['spec']}: {report}")

    print(f"declared: {len(req)}  used: {len(declared & imported)}  unused: {len(unused)}")
    for name in unused:
        print(f"unused: {name}")
    for w in warnings:
        print(f"advisory: {w}")
    print("result:", "FAIL" if (unused or policy_budget) else "OK")
    sys.exit(1 if unused else policy_budget)

if __name__ == "__main__":
    main()
```

```bash
uv run python analyze.py --dir myapp
```

Exit-code policy is a *choice*, written where a reviewer can see it: unused wins (`1`) over advisory (`2`); clean wins (`0`). Composing the whole pipeline from functions you own means a future "block on unused" tuning is a one-line `.py` change, not a rewrite.

**🎯 Expected output:**

```
declared: 5  used: 3  unused: 2
unused: click
unused: flask
advisory: numpy ==1.26.0: BELOW ADVISORY MINIMUM (have 1.26.0, min 1.30)
result: FAIL
```

Rerun the shell command and `echo $?` prints `1`.

**🩹 If it's off:** If `FileNotFoundError` fires for `requirements.txt`, `--dir` points at a directory that doesn't contain one — the CLI expects your manifest *inside* the scanned root, matching what the analyzer checks. If `exit code: 0` prints despite unused packages, `sys.exit(1 if unused else policy_budget)` is missing — the `print("result: ...")` line is truthy, the exit code is the contract.

### 5.2 Verify the CLI

**✅ Checklist**

- ✅ `uv run python --dir myapp` prints the summary above and `echo $?` is `1`.
- ✅ Deleting `click`/`flask` from `requirements.txt` turns the run into `result: OK`, exit `0`.
- ✅ Raising `numpy`'s pin to `==1.30.0` clears the advisory *and* keeps `unused` at zero — exit code both derives from data and reads the same files you skim.

**🤔 Socratic Question(s)**

- Exit codes 1 and 2 collapse when both conditions hold (resolved `1` wins). If a build wants to distinguish "dead code, block" from "security release pending, warn", the codes need composing (e.g. 1 = unused, 2 = advisory, 3 = both). What changes in `sys.exit(...)` to make 3 = both a one-liner — and does CI care?
- `declared & imported` counts a package used *once* as used; there's no "imported eleven times in nine files" intensity signal. What would a *frequency* dimension add to the report's sorting — and who is the report's reader who'd actually use it?

## ⚠️ Common pitfalls

- **Substring import matching.** Matching `import os` against `os.path` or `osx-tools` needs word boundaries — the token-regex `([\w.]+)` right after `import|from` already gives you the top-level name, so don't `in`-test module names.
- **Trusting one side.** Declared-without-imported = unused; imported-without-declared = broken fresh installs. An analyzer that only answers one direction writes a half-report. (Reverse the subtraction and the second bug is free.)
- **Manifest noise.** `--index-url`, `-r`, `.`, `#comment` lines are not dependencies. A parser that mints a "dependency" called `--index-url` corrupts every number downstream of it.
- **Version tuples aren't strings.** `"9.0" < "10.0"` is `False` lexically but `(9,0) < (10,0)` is `True` numerally — always compare via integer tuples in this project.
- **Spec-prefix swallowing.** `version_tuple` grabbing `29` from `>=29,<30` misses the `<30` cap and the name-mapping gap (`python-dateutil` imports as `dateutil`) means a "harmless" analyzer silently blesses a really used package as unused. Report reads as a scan, judges as a human.

## What you just built

A dependency analyzer with no dependencies of its own: manifest parser, import scanner, set-difference differ, advisory version checker, and an exit-code gate — five files, one CLI verb, and a report that three lines summarize. The transferable lesson is *triangulation*: a manifest and a code scan each tell a partial story, and the tool's value is precisely the places the two disagree — unused pins to trim, out-of-policy versions to bump, and (with the subtraction flipped) dependencies you forgot to declare at all.

:::tip[Run a fuller version without any local setup]
[`examples/dependency-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/dependency-analyzer) in the course repo has the complete scripts, the sample `myapp/` project, and a sample advisory registry. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Scan the **reverse direction** (`imported - declared`) as a second report column: "declared nowhere but imported everywhere = fresh installs crash" — free bug-finder now that the machinery exists.
- Publish the **summary as JSON** (`--json`), so a dashboard or PR bot can render verdicts without re-parsing your human report.
- Add an **`ast`-based scanner** as a second import source, and flag the packages where the regex and AST scanners disagree — triage where the dodgy imports live.
- Match the **name-mapping gap** with an alias dict (`python-dateutil` → `dateutil`, `beautifulsoup4` → `bs4`) so the set difference stops misfiring on half of PyPI's naming.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓