---
title: "Build a Data Quality Monitor"
description: "Turn data quality rules into checks, scores, and a drift alert that compares snapshots over time."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "csv", "dataclasses", "reporting"]
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries)"
  - "dataclasses and reading CSV with the csv module"
learningObjectives:
  - "Model quality rules as data with a Rule dataclass and a JSON rule file"
  - "Implement a check engine that reports per-rule violations with row indices"
  - "Compute an overall quality score from per-rule pass rates"
  - "Detect regressions by comparing pass rates between snapshots"
  - "Ship a CLI that returns a non-zero exit code on quality failure"
---

# 🩺 Build a Data Quality Monitor

"Don't ship data you haven't checked" only works if checking is cheap and repeatable. This project builds the tool that makes it cheap: a rule file written in JSON, an engine that turns each rule into a list of violating rows, a score that summarizes the whole file, a drift comparison that rings a bell when a column quietly gets worse between snapshots, and a CLI whose exit code a build script can actually act on. The whole thing is `csv`, `dataclasses`, and `json` — no framework, no database, just your rules run against your data.

This assumes Python 101 plus `dataclasses` and `csv`. Nothing from the Data Analysis module is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Model quality rules as data: a `Rule` dataclass that a plain JSON file can describe.
2. Write the check engine: five check types (`not_null`, `unique`, `within_range`, `in_set`, plus a guard for unknown ones) that return explicit `Violation` rows.
3. Aggregate results into a report with per-rule pass rates and an overall quality score.
4. Compare three quarterly snapshots and flag columns whose pass rate regressed.
5. CLI it: one command against one CSV + one rules file, exit code = quality verdict.

## Where to run this

**Locally with `uv`** is the recommended path — the whole point is the tiny CLI that a build or cron script can call, and that needs a real filesystem.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work for every step — the notebook at [`examples/data-quality-monitor/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.ipynb) runs the same rules engine over the bundled quarterly snapshots in memory.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-quality-monitor%2Fnotebook.ipynb)

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
uv init data-quality-monitor
cd data-quality-monitor
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `data-quality-monitor/` exists with a `pyproject.toml`.
- ✅ `python -c "import csv, json, dataclasses"` succeeds — no third-party packages.

## Step 1: Model a rule as data

A quality check is a small thing: *which column*, *what check*, *under what parameters*. The moment you write those checks as `if` statements sprayed through functions, you've coupled "what to check" to "how to run it". The `Rule` dataclass decouples them — rules become *data*, loadable from JSON, so your principal adds a rule by editing a file, not your code.

### 1.1 Write the `Rule` dataclass

**👟 Starter hint:** One dataclass with `name`, `column`, `check`, and a `params` dict; a `from_dict` classmethod that scoops up whatever extra keys the JSON rule carries:

```python
# rules.py
from dataclasses import dataclass
from typing import Any

@dataclass
class Rule:
    name: str
    column: str
    check: str
    params: dict[str, Any] = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Rule":
        return cls(
            name=data["name"],
            column=data["column"],
            check=data["check"],
            params={k: v for k, v in data.items()
                    if k not in {"name", "column", "check"}},
        )

if __name__ == "__main__":
    import json

    raw = json.loads(
        '[{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100}]'
    )
    rule = Rule.from_dict(raw[0])
    print(rule.name, "->", rule.check, rule.params)
```

`from_dict` is the quiet trick: rules in JSON are written as `{"name": ..., "column": ..., "check": ..., "min": ..., "max": ...}` and the method *whitelists* the three structural keys, sweeping everything else into `params` — so a future `"description": "..."` key drops harmlessly into params instead of crashing the loader. Type hints on params (`dict[str, Any]`) cover the fact that `allowed` is a list but `min` is a float.

**🎯 Expected output:**

```
age in range -> within_range {'min': 0, 'max': 100}
```

**🩹 If it's off:** If params is empty, `data["name"]` etc. aren't the only keys — check you didn't also put `"params": {...}` *inside* the JSON rule (from_dict doesn't unwrap a nested dict; it flattens sibling keys). If `Rule` raises `TypeError`, the `params` default field uses `None` not `field(default_factory=dict)` — still valid here, but you'll pass params explicitly everywhere, so prefer that.

### 1.2 Verify the rule model

**✅ Checklist**

- ✅ `Rule.from_dict({"name": "x", "column": "age", "check": "unique"})` builds with empty params.
- ✅ Passing a JSON rule with `"allowed": [... ]` lands that list in `rule.params["allowed"]`.
- ✅ `Rule` is a dataclass: comparing `Rule(name="a", column="age", check="unique")` to an equal one is `True`.

**🤔 Socratic Question(s)**

- Why is a rule surviving as a *dict/dataclass* (data) instead of a function better for a team where analysts, not engineers, define checks?
- `from_dict` ignores unknown extra keys by sweeping them into `params`. When is that permissiveness a bug (typo'd `"minn": 0` silently makes a rule check-nothing many times do)?

## Step 2: Write the check engine

The engine is: *given one rule and all rows, return the violating rows*. Each check type is one narrow predicate (`_fails`), and `rule_failures` walks rows collecting `Violation` records that say *which rule, which column, which row index, which value*. Violations are first-class here — not `print`s, not `assert`s — because the report, drift, and CLI steps all consume them.

### 2.1 Implement `_fails` and `rule_failures`

**👟 Starter hint:** One `_fails(rule, value, rows) -> bool` predicate per check name, then a collector that maps failures to `Violation`s with row indices:

```python
# checks.py
from collections import Counter
from dataclasses import dataclass
from typing import Any

from rules import Rule

@dataclass
class Violation:
    rule: str
    column: str
    row_index: int
    value: Any

def _fails(rule: Rule, value: Any, rows: list[dict]) -> bool:
    if rule.check == "not_null":
        return value is None or str(value).strip() == ""
    if rule.check == "within_range":
        try:
            num = float(value)
        except (TypeError, ValueError):
            return True
        return not (rule.params["min"] <= num <= rule.params["max"])
    if rule.check == "in_set":
        return value not in rule.params["allowed"]
    if rule.check == "unique":
        non_null = [str(r.get(rule.column)) for r in rows if r.get(rule.column) is not None]
        return Counter(non_null)[str(value)] > 1
    raise ValueError(f"unknown check: {rule.check}")

def rule_failures(rows: list[dict], rule: Rule) -> list[Violation]:
    failures: list[Violation] = []
    for i, row in enumerate(rows):
        value = row.get(rule.column)
        if _fails(rule, value, rows):
            failures.append(Violation(rule.name, rule.column, i, value))
    return failures

if __name__ == "__main__":
    rows = [{"id": "1", "age": "36"}, {"id": "2", "age": "101"}, {"id": "3", "age": ""}]
    rule = Rule(name="age in range", column="age", check="within_range",
                params={"min": 0, "max": 100})
    for v in rule_failures(rows, rule):
        print(v.rule, "row", v.row_index, "->", repr(v.value))
```

`unique` is the odd one out and worth reading twice: it can't be decided cell-by-cell, so it counts every column value across *all* rows, then returns "fails" for any value occurring more than once. The `{..., ...} > 1` shape is a membership test, not a comparison — `Counter` returns the count and 2 > 1 is the duplicate signal. The `raise ValueError` for unknown checks is deliberate: a typo'd check name in the rules file should fail loudly at check time, not silently pass every row.

**🎯 Expected output:**

```
age in range row 1 -> '101'
age in range row 2 -> ''
```

**🩹 If it's off:** If row 2 isn't caught, `float("")` raised but your `except` doesn't catch `ValueError` — both `ValueError` and `TypeError` must be in the tuple. If every value reports as duplicate, the `Counter` in `unique` is being rebuilt per row instead of once per rule — hoist it out of `_fails` or rely on `rule_failures` passing the full row list.

### 2.2 Verify the engine

**✅ Checklist**

- ✅ `not_null` fails on `""`, `"   "`, and a missing key (none of the three crash).
- ✅ `within_range` fails on `"101"` with max 100 and on `"abc"` (unparseable → fails).
- ✅ `in_set` treats `"platinum"` as a failure against `["free", "pro", "business"]`, a set membership question, not a substring question.
- ✅ An unknown `check` raises `ValueError` rather than silently passing.

**🤔 Socratic Question(s)**

- `within_range` returns `True` (fails) for unparseable numbers like `"abc"`. Is a garbage value a *range* violation or a *format* violation — and what happens to a column's score if both disagree?
- `unique` counts `str(value)` while `in_set` compares raw values. What does `"1"` vs `1` (string versus int) do to each check — when would `unique` call two apparently-different values duplicates?

## Step 3: Aggregate into a report and a score

Violations are the evidence; a score is the verdict. The report turns 5 rows × 4 rules into one line per rule — pass rate and failing-row count — and the score averages the pass rates. A single `0.80 / 1.00` is what a human or a build log can parse at a glance and compare to last quarter.

### 3.1 Write `QualityReport` and `render`

**👟 Starter hint:** A dataclass holding results, a `pass_rate` method, a `score` that averages them, and a `render` that prints the human version:

```python
# report.py
from dataclasses import dataclass

from checks import Violation, rule_failures
from rules import Rule

@dataclass
class QualityReport:
    rules: list[Rule]
    failures: dict[str, list[Violation]]
    n_rows: int

    def pass_rate(self, rule_name: str) -> float:
        n = len(self.failures[rule_name])
        return 1 - n / max(self.n_rows, 1)

    def score(self) -> float:
        if not self.rules:
            return 0.0
        return sum(self.pass_rate(r.name) for r in self.rules) / len(self.rules)

def build_report(rows: list[dict], rules: list[Rule]) -> QualityReport:
    failures = {r.name: rule_failures(rows, r) for r in rules}
    return QualityReport(rules=rules, failures=failures, n_rows=len(rows))

def render(report: QualityReport) -> str:
    lines = [f"checked {report.n_rows} rows against {len(report.rules)} rules"]
    for rule in report.rules:
        rate = report.pass_rate(rule.name)
        fails = len(report.failures[rule.name])
        mark = "PASS" if rate == 1.0 else "FAIL"
        lines.append(f"[{mark}] {rule.name:<16} {rate:.1%} ({fails} violating rows)")
    lines.append(f"overall quality score: {report.score():.2f} / 1.00")
    return "\n".join(lines)

if __name__ == "__main__":
    import csv
    import json

    csv_text = """id,name,email,age,plan
1,Ada,ada@example.com,36,free
2,Grace,,44,pro
3,Alan,alan@bletchley.uk,,free
4,Katherine,kj@nasa.gov,101,platinum
5,Margaret,mh@mit.edu,66,free
"""
    rules = [Rule.from_dict(r) for r in json.loads(
        '[{"name": "id unique", "column": "id", "check": "unique"},'
        '{"name": "email present", "column": "email", "check": "not_null"},'
        '{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100},'
        '{"name": "plan valid", "column": "plan", "check": "in_set", "allowed": ["free", "pro", "business"]}]'
    )]

    rows = list(csv.DictReader(csv_text.strip().splitlines()))
    print(render(build_report(rows, rules)))
```

The average is *unweighted by design*: four rules, four pass rates, equal say. `pass_rate` uses `max(self.n_rows, 1)` so an *empty* file scores every rule 0% (all of zero rows fail is the honest reading) instead of crashing on a zero division. The `:[FAIL]`/`:PASS` prefix and the `:.1%` formatting are the report's whole UX — a column that scores 80% or a drift of −13.3% should be visible in one scan, not after counting stars.

**🎯 Expected output:**

```
checked 5 rows against 4 rules
[PASS] id unique        100.0% (0 violating rows)
[FAIL] email present    80.0% (1 violating rows)
[FAIL] age in range     60.0% (2 violating rows)
[FAIL] plan valid       80.0% (1 violating rows)
overall quality score: 0.80 / 1.00
```

**🩹 If it's off:** If `age in range` shows 80% instead of 60%, the empty `''` in row 3 isn't being counted — `float('')` raising is being handled, but check that the `except (TypeError, ValueError)` clause returns `True` (fails); if it `pass`ed, the empty cell falls through to the range comparison and silently passes. If the score line is 1.00, the `score` method is averaging something other than your rules — confirm `len(self.rules)` divides *four* pass rates.

### 3.2 Verify the report

**✅ Checklist**

- ✅ Rows 2 (Grace, empty email), 3 (Alan, empty age), and 4 (Katherine, age 101, plan `platinum`) are exactly the violating rows counted.
- ✅ `render()` prints one line per rule plus the score; the count column matches `len(rule_failures(...))`.
- ✅ An empty CSV scores 0.00 without crashing in `pass_rate`.

**🤔 Socratic Question(s)**

- The score is a plain mean. A column failing 40% of the time and a column failing 10% of the time both drag the mean by their own weight. What kind of *weighted* scoring would a hospital dashboard or a payroll system want — and does `render` still make sense, or would you split the report into tiers?
- `PASS` requires exactly 100%. Two data-quality teams differ on whether 99.5% email coverage should be green. Where does the pass threshold belong — in `render` or in the score?

## Step 4: Detect drift between snapshots

A single clean file is nice; a *getting dirtier* column is the emergency. Drift compares each rule's pass rate between consecutive snapshot files and flags any column whose rate dropped by more than a threshold (5 points) with the `  <-- regression` marker — so a build can page the person who owns `email present`.

### 4.1 Write the comparator

**👟 Starter hint:** Reuse `build_report` per file to get pass rates, then walk file-to-file printing rates and deltas, flagging drops past the threshold:

```python
# drift.py
from report import build_report

def pass_rates_for_file(path: str, rules: list) -> dict[str, float]:
    import csv
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    report = build_report(rows, rules)
    return {r.name: report.pass_rate(r.name) for r in rules}

def compare(files: list[str], rules: list, threshold: float = 0.05) -> list[str]:
    lines: list[str] = []
    prev = None
    for path in files:
        rates = pass_rates_for_file(path, rules)
        if prev is None:
            lines.append(f"== {path} (baseline)")
            for name, rate in rates.items():
                lines.append(f"   {name:<16} {rate:.1%}")
        else:
            lines.append(f"== {path}")
            for name, rate in rates.items():
                delta = rate - prev[name]
                flag = "   <-- regression" if delta < -threshold else ""
                lines.append(f"   {name:<16} {rate:.1%} ({delta:+.1%}){flag}")
        prev = rates
    return lines

if __name__ == "__main__":
    import csv
    import json

    from rules import Rule

    snapshots = {
        "customers_q1.csv": [
            ["id", "name", "email", "age", "plan"],
            ["1", "Ada", "ada@example.com", "36", "free"],
            ["2", "Grace", "", "44", "pro"],
            ["3", "Alan", "alan@bletchley.uk", "", "free"],
            ["4", "Katherine", "kj@nasa.gov", "101", "platinum"],
            ["5", "Margaret", "mh@mit.edu", "66", "free"],
        ],
        "customers_q2.csv": [
            ["id", "name", "email", "age", "plan"],
            ["6", "Tim", "td@example.com", "44", "free"],
            ["7", "Barbara", "", "29", "free"],
            ["8", "Don", "don@example.com", "118", "pro"],
        ],
        "customers_q3.csv": [
            ["id", "name", "email", "age", "plan"],
            ["9", "Carol", "carol@example.com", "51", "pro"],
            ["10", "David", "david@example.com", "52", "business"],
            ["11", "Ellen", "ellen@example.com", "", "free"],
        ],
    }
    for path, rows in snapshots.items():
        with open(path, "w", newline="") as f:
            csv.writer(f).writerows(rows)

    rules = [Rule.from_dict(r) for r in json.loads(
        '[{"name": "id unique", "column": "id", "check": "unique"},'
        '{"name": "email present", "column": "email", "check": "not_null"},'
        '{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100},'
        '{"name": "plan valid", "column": "plan", "check": "in_set", "allowed": ["free", "pro", "business"]}]'
    )]

    for line in compare(["customers_q1.csv", "customers_q2.csv", "customers_q3.csv"], rules):
        print(line)
```

The baseline is the *first* file by position in the list — comparing pass rates to the immediately-previous snapshot (q2 vs q1, q3 vs q2), not always to q1. That's the honest "was this team's last upload worse than their prior one" question; comparing everything to q1 would answer "is it worse than three months ago", which is a different (still valid) chart. The `%(+...%)` delta formatting makes +/− sign ambiguity impossible to read wrong.

**🎯 Expected output:**

```
== customers_q1.csv (baseline)
   id unique        100.0%
   email present    80.0%
   age in range     60.0%
   plan valid       80.0%
== customers_q2.csv
   id unique        100.0% (+0.0%)
   email present    66.7% (-13.3%)   <-- regression
   age in range     66.7% (+6.7%)
   plan valid       100.0% (+20.0%)
== customers_q3.csv
   id unique        100.0% (+0.0%)
   email present    100.0% (+33.3%)
   age in range     66.7% (+0.0%)
   plan valid       100.0% (+0.0%)
```

**🩹 If it's off:** If no `regression` marker ever shows, `threshold` (default `0.05`) is being compared against the wrong sign — a *drop* is `delta < -threshold`, so check the minus. If q2's email drop shows as `+13.3%`, the delta is being computed `prev - rate` instead of `rate - prev` — sign, flipped.

### 4.2 Verify drift

**✅ Checklist**

- ✅ `customers_q2.csv` flags exactly one regression: `email present`.
- ✅ `age in range` *improves* q1→q2 (+6.7%) and holds steady q2→q3, never falsely flagged.
- ✅ Files are written by the demo (so the comparator runs on real files), and pass rates on disk match the baseline row above.

**🤔 Socratic Question(s)**

- The threshold (5 points) is the same for all rules. `email present` dipping 13.3 points trips the flag; `age in range` rising 6.7 points is a pass. What kind of rule deserves a *per-rule* threshold — and where in `compare`'s signature would it live without changing the API?
- Drift compares rate-to-rate, ignoring *volume* (q2 checks 3 rows, q1 checked 5). A one-row regression signal from a 3-row file is statistically weak. What would a confidence-weighted comparison look like — and when is "flag everything, verify by hand" the pragmatic choice anyway?

## Step 5: The CLI and the exit code

The engine is finished; the part that changes how a team *contracts* with the tool is the exit code. `monitor.py` reads a CSV and a rules file, prints the report, and exits `0` if everything passed or `2` if anything failed — a CI step or cron script can treat non-zero as "block the deploy / page the owner" without parsing a single line of output.

### 5.1 Write `monitor.py`

**👟 Starter hint:** `argparse` for `csv_path` + optional `--rules`, reuse `build_report`/`render`, set `sys.exit` from the score:

```python
# monitor.py
import argparse
import csv
import json
import sys

from report import build_report, render
from rules import Rule

def main() -> None:
    parser = argparse.ArgumentParser(description="Check CSV data quality against a rules file.")
    parser.add_argument("csv_path")
    parser.add_argument("--rules", default="rules.json")
    args = parser.parse_args()

    with open(args.rules) as f:
        rules = [Rule.from_dict(r) for r in json.load(f)]

    with open(args.csv_path, newline="") as f:
        rows = list(csv.DictReader(f))

    report = build_report(rows, rules)
    print(render(report))
    sys.exit(0 if report.score() == 1.0 else 2)

if __name__ == "__main__":
    main()
```

**✅ Checklist**

- ✅ The CLI runs with `uv run python monitor.py customers_q1.csv` and prints the report.
- ✅ `echo $?` shows `2` for the customers_q1.csv (score 0.80); a clean file exits `0`.
- ✅ `--rules` honors a custom path (e.g. `uv run python monitor.py data.csv --rules my-rules.json`).

The score is the only thing the exit code knows about, and that's a real design decision. "Quality gate" means *score must be exactly 1.00* — strictest possible. If you'd rather gate on "worse than 0.95", you change one constant; the report, the engine, and the CLI contract stay put.

### 5.2 Verify the CLI end to end

**🩹 If it's off:** If `sys.exit(2)` seems to do nothing, remember `argparse` help/versions exit with their own codes before `main()` even reaches the gate — and a `--help` run reporting 0 is correct. If the exit code is `1` instead of `2`, an exception escaped `main()` before the gate ran — read the traceback; it's a file path problem, not a gate problem.

**🤔 Socratic Question(s)**

- The exit code knows only pass/fail; the report knows which rules drifted. Why is that separation *right* for a CI gate, and what would your pipeline lose if the CLI printed "score 0.80" but *always* exited 0?
- `--rules rules.json` defaults to a fixed filename. What does `--rules` *not* allow that a team might want (per-directory rules, env-var overrides) — and would adding those change the exit-code contract?

## ⚠️ Common pitfalls

- **Turning empty into a pass.** `float("")` raises; if your `except` clause returns `False` (passes) or re-raises silently, blank cells sail through `within_range`. Empty is a failure; unparseable is a failure; an unhandled exception is *not* an outcome.
- **`unique` re-counting for every row.** Building the `Counter` inside the per-row predicate turns a 100k-row file into O(n²) work. Count once per rule (or accept it for demo data) — and remember `"1"` and `1` are different strings.
- **Sign flips in drift deltas.** `delta = rate - prev` flags drops correctly; `prev - rate` flags rises. It's a one-character flush of a report's credibility.
- **Score `0/0`.** An empty CSV must score 0.00 through a `max(self.n_rows, 1)` guard, not crash in a zero-division. The empty-file question to ask is "should 0 rows be a fail or a skip".
- **Exit-code drift.** A tool that *prints* PASS/FAIL but exits 0 always is decorative. If you embed the gate in a script, `cmd /c` (Windows) and `&&` chaining both honor the real exit code — choose the exit code deliberately and test it.

## What you just built

A self-contained data quality suite: rules as JSON data, a check engine with per-row violations, a scored one-screen report, a snapshot-to-snapshot drift comparison with regression flags, and a CLI whose exit code is a deploy gate. The reusable skill is *separating the judgment from the execution*: `Rule` data in a file, engine in `checks.py`, presentation in `render`, decision in an exit code — any one can change (new check type, new report format, new gate rule) without touching the other three.

:::tip[Run a fuller version without any local setup]
[`examples/data-quality-monitor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-quality-monitor) in the course repo has the complete scripts, the quarterly snapshot CSVs, and a sample `rules.json`. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a **`--threshold`** CLI flag that overrides the `compare` default, answering Step 4's Socratic question about per-rule sensitivity without changing the engine.
- Emit a **JSON report** (`--json report.json`) alongside the human one: same score, same violations, machine-readable — the exit code's verbose sibling.
- Add **per-column volume counts** to the drift table (3 rows this quarter vs 5 last quarter) so human readers can see *confidence* as well as rate.
- Support **stale-snapshot detection**: flag snapshots whose `as_of` timestamp column is older than N days — drift is measured in time, not just in file order.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓