---
title: "Build a Data Masker"
description: "Anonymize sensitive data for development and testing while preserving statistical properties."
difficulty: "intermediate"
estimatedMinutes: 80
tags: ["cli", "csv", "pii", "hashing"]
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries)"
  - "Reading CSV files with the csv module"
learningObjectives:
  - "Detect sensitive columns by name hints and value patterns"
  - "Apply redact, hash, and format-preserving masking strategies"
  - "Auto-build a per-column masking plan from detection"
  - "Mask numeric identifiers while preserving the column's distribution"
  - "Write an audit log of every masking operation"
---

# 🕶️ Build a Data Masker

Copying real customer data into a development database, a bug report, or a demo is how sensitive information leaks — and the fix is the discipline of *masking*: replacing real values with fake-but-plausible ones before data goes anywhere it shouldn't. The craft is in the details: an email must keep its domain (so test code still routes), a phone number should stay phone-shaped, a numeric field like salary must keep its *distribution* (so test analytics don't collapse). This project builds a masker that detects sensitive columns, applies the right strategy per column, preserves what should be preserved, and writes an audit log of every operation.

This assumes Python 101 plus comfortable `csv` and `re` — functions, lists, sets. Nothing from the Data Analysis module is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Detect sensitive columns using name hints (`email`, `phone`, `name`, …) and value-pattern regexes.
2. Implement a strategy zoo: redact, deterministic hash, length-preserving text mask, format-preserving email and phone.
3. Auto-build a per-column masking plan from detection + column-name hints.
4. Mask numeric identifiers by in-column permutation, proving the distribution survives while row-speaks-*about*-id is cut.
5. App a `masker.py` CLI that masks a CSV, writes `masked.csv`, and appends to `audit.jsonl`.

## Where to run this

**Locally with `uv`** is the recommended path — masking is inherently a *file* operation ("mask this CSV, keep that one"), so the local CLI against your own files is the honest home for it.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work well for the strategy-and-planner half — the notebook at [`examples/data-masker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.ipynb) runs every step on bundled sample rows. The honest note: the notebook handles fixed sample data, while the local CLI can be pointed at a real CSV you actually own.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-masker%2Fnotebook.ipynb)

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
uv init data-masker
cd data-masker
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `data-masker/` exists with a `pyproject.toml`.
- ✅ `python -c "import csv, hashlib, re"` succeeds — no third-party packages.

## Step 1: Detect sensitive columns

Masking begins with *finding* the secrets. Two independent signals exist: the column's *name* (almost everything sensitive is honest about being `email` or `phone` in the header) and the *values* (an `@` containing a dot is a strong email hint regardless of what the column is called). Detection trusts both, because either can be the only one that works.

### 1.1 Write the detector

**👟 Starter hint:** Three name-hint groups plus an email/phone `re` pattern, all feeding one set of sensitive columns; run it on a sample CSV with one obviously-named and one slyly-named sensitive column:

```python
# detect.py
import re

EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
PHONE_RE = re.compile(r"\+?\d[\d\s().-]{6,}\d")
NAME_HINTS = ("name", "person", "student", "customer", "user")
PII_HINTS = ("email", "phone", "ssn", "sin", "address", "iban", "credit")

def detect_columns(headers: list[str], rows: list[dict]) -> list[str]:
    sensitive: set[str] = set()
    for col in headers:
        lowered = col.lower()
        if any(hint in lowered for hint in NAME_HINTS):
            sensitive.add(col)
        if any(hint in lowered for hint in PII_HINTS):
            sensitive.add(col)
        values = [row[col] for row in rows]
        joined = " ".join(values)
        if EMAIL_RE.search(joined) or PHONE_RE.search(joined):
            sensitive.add(col)
    return [col for col in headers if col in sensitive]

if __name__ == "__main__":
    csv_text = """id,full_name,email,phone,contact,city
1,Ada Lovelace,ada@example.com,+1 555 0101,ada@example.com,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,grace@navy.mil,Arlington
3,Alan Turing,alan@bletchley.uk,+44 20 7946 0000,alan@bletchley.uk,Bletchley
"""
    lines = [line for line in csv_text.strip().splitlines()]
    import csv
    reader = csv.DictReader(lines)
    headers = reader.fieldnames or []
    rows = list(reader)
    print(detect_columns(headers, rows))
```

`contact` is the test that keeps the detector honest: its header says nothing sensitive, but its values are emails, so `EMAIL_RE.search(joined)` is what catches it. Notice detection works on a *column's joined text*, not cell-by-cell — one regex search over the whole column is both simpler and enough for pattern signals, at the cost of not telling you which *rows* are sensitive (the plan step doesn't need that yet).

**🎯 Expected output:**

```
['full_name', 'email', 'phone', 'contact']
```

**🩹 If it's off:** If `contact` is missed, the joined `EMAIL_RE` search isn't running for every column — confirm the regex block sits inside the `for col` loop. If `city` is flagged, a `NAME_HINTS` fragment like `user` is matching a substring of an innocent header (`city`? no — check for a header like `username_last_change`); the hint list is substring-based by design, and substring matching is exactly as loose as it looks.

### 1.2 Verify detection

**✅ Checklist**

- ✅ The sample detects `full_name`, `email`, `phone`, and `contact`, in that header order.
- ✅ Removing the `contact` column's email *values* (but keeping its header) means it's no longer flagged — value patterns are genuinely value-based.
- ✅ An `address` column and an `iban` column are flagged by name alone, even with empty values.

**🤔 Socratic Question(s)**

- Detection is per-*column*, not per-*cell*: one email in a 10,000-row "notes" column flags the whole column. What would the masker have to gain (and lose) by switching to cell-level detection for free-text columns like `notes`?
- Name hints match substrings (`user` matches `user_name` *and* `userscript_repo`). Why is substring matching the pragmatic default here rather than exact `==` matching — and what single false-positive would change your mind?

## Step 2: Build the strategy zoo

Detection decides *which* columns; strategies decide *how* each is masked. The useful set is: redact (the shredder), hash (deterministic pseudonym — same input always maps to same output, so joins still work), length-preserving text (test fixtures stay plausible), format-preserving email/phone (domain and structure survive routing/matching). Each is a one-idea function.

### 2.1 Write one strategy per function

**👟 Starter hint:** Five small functions, then an `apply` helper any planner can reuse — `mask_email` keeps the domain after the `@`, `mask_phone` keeps only the last four digits, both under a shared strategy dispatch table:

```python
# mask.py
import hashlib
import re

STRATEGY = {}

def mask_redact(value: str) -> str:
    return "****"

def mask_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()[:12]

def mask_text(value: str) -> str:
    if not value.strip():
        return value
    return "".join("*" if ch.isalpha() else ch for ch in value)

def mask_email(value: str) -> str:
    local, sep, domain = value.partition("@")
    if not sep:
        return mask_hash(value)
    return f"{hashlib.sha256(local.encode()).hexdigest()[:8]}@{domain}"

def mask_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) < 5:
        return "****"
    return f"+X{'-' * (len(digits) - 4)}-{digits[-4:]}"

STRATEGY.update({
    "redact": mask_redact, "hash": mask_hash, "text": mask_text,
    "email": mask_email, "phone": mask_phone,
})

def apply(rows: list[dict], plan: dict[str, str]) -> list[dict]:
    masked_rows = []
    for row in rows:
        out = dict(row)
        for col, strategy in plan.items():
            out[col] = STRATEGY[strategy](out[col])
        masked_rows.append(out)
    return masked_rows

if __name__ == "__main__":
    rows = [
        {"full_name": "Ada Lovelace", "email": "ada@example.com", "phone": "+1 555 0101", "city": "London"},
        {"full_name": "Grace Hopper", "email": "grace@navy.mil", "phone": "+1 555 0102", "city": "Arlington"},
    ]
    plan = {"full_name": "text", "email": "email", "phone": "phone"}
    for row in apply(rows, plan):
        print(row)
```

The `STRATEGY` dict mapping names to functions is the *dispatch table* — the planner (next step) produces string strategy names and `apply` turns them into behavior, so adding strategy #6 means one function plus one table entry, not a rewrite of the planner. Two formats to admire: `mask_email` keeps everything after the `@` (a joined email still routes to the same domain) and hashes the local part; `mask_phone` counts digits to preserve the dialing *shape* (`+X-----0101`) while destroying the number's identity.

**🎯 Expected output:**

```
{'full_name': '*** ********', 'email': 'fdee430d@example.com', 'phone': '+X-----0101', 'city': 'London'}
{'full_name': '***** ******', 'email': 'e010fd1c@navy.mil', 'phone': '+X-----0102', 'city': 'Arlington'}
```

**🩹 If it's off:** If `mask_email`'s hashes differ every run, you used `random` somewhere instead of `hashlib` — deterministic is the whole point. If `mask_phone`'s mask length is wrong, `len(digits)` counts a country code that shouldn't be visible — that's correct behavior (shape preserved, real prefix destroyed); check the `-` count against `len(digits) - 4` rather than eyeballing.

### 2.2 Verify the strategies

**✅ Checklist**

- ✅ `mask_hash("Ada")` equals `mask_hash("Ada")` across runs, but differs from `mask_hash("ada")` (case matters — that's a real trap, see below).
- ✅ `mask_email("grace@navy.mil")` still ends `@navy.mil`; `mask_phone("+1 555 0102")` still ends `0102`.
- ✅ `mask_text("Ada")` is `***` — same length, no letters.
- ✅ `apply` masks only the columns named by the plan and leaves every other cell untouched.

**🤔 Socratic Question(s)**

- `mask_hash` is deterministic, which is what makes it reversible by guessing: `mask_hash("secret")` is public knowledge once you've seen the hash. When is hash-masking acceptable (what property of the data makes it safe), and when is it trivially unmaskable?
- `mask_email` hashes the *local* part but keeps the domain. What real downstream behavior would a fully-redacted email destroy — and what's the residual privacy risk of keeping the domain visible?

## Step 3: Auto-build the masking plan

Nobody wants to hand-write `{"email": "email", "full_name": "text", ...}` per dataset. The planner closes the loop with detection: sensitive columns get a strategy chosen by *their name's hint* — `email` → email preserver, phone → phone preserver, `name` variants → length-preserving text, everything else sensitive → hash. Detection + one lookup = a complete plan.

### 3.1 Write the planner

**👟 Starter hint:** Reuse `detect_columns`, then walk the detected list choosing a strategy per hint with a small `if/elif` — the plan is a plain dict that `mask.apply` already knows how to execute:

```python
# planner.py
from detect import detect_columns
from mask import apply

def build_plan(headers: list[str], rows: list[dict]) -> dict[str, str]:
    sensitive = detect_columns(headers, rows)
    plan: dict[str, str] = {}
    for col in sensitive:
        lowered = col.lower()
        if "email" in lowered:
            plan[col] = "email"
        elif "phone" in lowered:
            plan[col] = "phone"
        elif any(hint in lowered for hint in ("name", "person", "student")):
            plan[col] = "text"
        else:
            plan[col] = "hash"
    return plan

def mask_with_plan(rows: list[dict], plan: dict[str, str]) -> list[dict]:
    return apply(rows, plan)

if __name__ == "__main__":
    import csv
    csv_text = """id,full_name,email,phone,ssn,city
1,Ada Lovelace,ada@example.com,+1 555 0101,111-22-3333,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,444-55-6666,Arlington
"""
    reader = csv.DictReader(csv_text.strip().splitlines())
    rows = list(reader)
    plan = build_plan(reader.fieldnames or [], rows)
    print("plan:", plan)
    for row in mask_with_plan(rows, plan):
        print(row)
```

The cascade `email → phone → name → hash` is deliberately ordered by *how much format must survive*: email keeps the most structure, and everything that falls through ends up as a hash — the privacy-conservative default. Because `build_plan` returns a plain dict and `apply` consumes a plain dict, the two halves could be replaced independently (a YAML-driven planner, a strategy registry) without touching each other.

**🎯 Expected output:**

```
plan: {'full_name': 'text', 'email': 'email', 'phone': 'phone', 'ssn': 'hash'}
{'id': '1', 'full_name': '*** ********', 'email': 'fdee430d@example.com', 'phone': '+X-----0101', 'ssn': '2e54cc08456e', 'city': 'London'}
{'id': '2', 'full_name': '***** ******', 'email': 'e010fd1c@navy.mil', 'phone': '+X-----0102', 'ssn': '74e4145b168a', 'city': 'Arlington'}
```

**🩹 If it's off:** If `ssn` isn't in the plan, `detect_columns` found it sensitive but the plan's "else → hash" branch isn't reached — check the `if/elif` ordering didn't accidentally swallow `ssn` under a `name` hint (it shouldn't). If the masked output *drops* `city`, `apply` is rebuilding rows instead of copying them — it must `dict(row)` then overwrite in place.

### 3.2 Verify the planner

**✅ Checklist**

- ✅ `build_plan` maps all four sensitive columns to `text`/`email`/`phone`/`hash` respectively.
- ✅ `id` and `city` are absent from the plan and unchanged in every masked row.
- ✅ Calling `mask_with_plan` twice on the same rows yields identical output — determinism end to end.

**🤔 Socratic Question(s)**

- The fallback is `hash` "by default". If a dataset had a `date_of_birth` column, `hash` is what it'd get — but hash of a birthday is exactly the *trivially-guessable* case flagged in Step 2's question. What would a smarter fallback key off (the *value* shape, not just the name) and is the current default a bug or a scope decision?
- `build_plan` returns a dict but doesn't know how it'll be applied. Where does that separation become valuable — what's an example of applying the *same* plan to a different pipeline (a database, an API response) without touching the planner?

## Step 4: Preserve distributions for numeric identifiers

Text masking has an easy "preserve" yardstick (same length). For numbers — salary, age, bonus — the yardstick is a *distribution*, and the honest technique for preserving it exactly is **in-column permutation**: shuffle each sensitive numeric column on its own. Every value survives, so mean/median are intact by construction; what's destroyed is the *association* between a row's identity and its number.

### 4.1 Write the permutation masker and stats checkers

**👟 Starter hint:** A seeded shuffle per column plus `column_stats` (mean, median) and a multiset-equality check that *proves* distribution preservation without eyeballing:

```python
# preserve.py
import random

def shuffle_column(values: list[str], seed: int = 42) -> list[str]:
    rng = random.Random(seed)
    shuffled = list(values)
    rng.shuffle(shuffled)
    return shuffled

def column_stats(values: list[float]) -> dict[str, float]:
    mean = sum(values) / len(values)
    ordered = sorted(values)
    n = len(ordered)
    if n % 2:
        median = ordered[n // 2]
    else:
        median = (ordered[n // 2 - 1] + ordered[n // 2]) / 2
    return {"mean": mean, "median": median}

if __name__ == "__main__":
    original = [52000.0, 61000.0, 47000.0, 75000.0, 66000.0, 58000.0]
    masked = [float(v) for v in shuffle_column([str(v) for v in original])]

    print("same multiset of values:", sorted(masked) == sorted(original))
    before = column_stats(original)
    after = column_stats(masked)
    print(f"mean  before {before['mean']:>9,.2f}  after {after['mean']:>9,.2f}")
    print(f"median before {before['median']:>9,.2f}  after {after['median']:>9,.2f}")
```

Shuffling is *exactly* distribution-preserving because the result is the same multiset of values — `sorted(masked) == sorted(original)` is not a heuristic, it's a proof. What permutation buys privacy-wise is subtler and more valuable: the mapping *person ↔ salary* is cut, while the *shape* the analysts model ("six salaries averaging ~59.8k, median ~59.5k") survives untouched. The `seed` argument is what makes runs reproducible — without it, every mask run would scatter your test fixtures differently.

**🎯 Expected output:**

```
same multiset of values: True
mean  before 59,833.33  after 59,833.33
median before 59,500.00  after 59,500.00
```

**🩹 If it's off:** If the mean differs, you mutated values instead of permuting them — a transform like `value * factor` changes the distribution; a *shuffle* cannot. If the same `seed` produces different shuffles across runs, `random.Random(seed)` is being recreated inside a loop instead of once.

### 4.2 Verify preservation

**✅ Checklist**

- ✅ `sorted(masked) == sorted(original)` is `True`.
- ✅ Both mean and median are identical before and after, to the penny.
- ✅ Re-running with the same seed reproduces the exact same masked ordering.

**🤔 Socratic Question(s)**

- Permutation preserves each column's distribution but *breaks nothing about other columns' distributions either*. So what is actually lost to a downstream analyst — can they still answer "do engineers out-earn designers here", and can they still answer "which *person* earns most"? Which loss is the privacy win?
- `column_stats` reports mean and median. Which *other* distribution property would two columns with the same mean/median still differ on, and does permutation preserve that property too — or is it only the association that broke?

## Step 5: Audit log and the CLI

Masking without records is a compliance hole — you need to be able to prove *which* file was masked, *which* columns, *how many rows*, and *when*. An append-only JSONL audit log provides that, and a `masker.py` CLI composes detection → plan → apply → save → audit into one command.

### 5.1 Write `AuditLog` and the CLI

**👟 Starter hint:** An append-only `audit.jsonl` writer (one JSON object per line), then a CLI that reads a CSV, builds the plan, writes `masked.csv` via `csv.DictWriter`, and records the operation:

```python
# masker.py
import argparse
import csv
import json
from datetime import datetime, timezone

from planner import build_plan, mask_with_plan

class AuditLog:
    def __init__(self, path: str = "audit.jsonl"):
        self.path = path

    def record(self, source: str, masked_columns: list[str], rows_masked: int) -> None:
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "masked_columns": masked_columns,
            "rows_masked": rows_masked,
        }
        with open(self.path, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def count(self) -> int:
        try:
            with open(self.path) as f:
                return sum(1 for _ in f)
        except FileNotFoundError:
            return 0

def main() -> None:
    parser = argparse.ArgumentParser(description="Mask sensitive columns of a CSV, preserving the rest.")
    parser.add_argument("csv_path")
    parser.add_argument("--output", default="masked.csv")
    args = parser.parse_args()

    with open(args.csv_path, newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)

    plan = build_plan(headers, rows)
    masked = mask_with_plan(rows, plan)

    with open(args.output, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(masked)

    audit = AuditLog()
    audit.record(args.csv_path, list(plan), len(rows))
    print(f"masked {len(plan)} columns across {len(rows)} rows -> {args.output}")
    print(f"audit entries: {audit.count()}")
```

```bash
cat > users.csv <<'EOF'
id,full_name,email,phone,ssn,city
1,Ada Lovelace,ada@example.com,+1 555 0101,111-22-3333,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,444-55-6666,Arlington
EOF
uv run python masker.py users.csv --output masked.csv
```

The audit log's append-only shape is the discipline: *never rewrite* — each `record` appends a newline-delimited JSON line, so the log is the complete history, impossible to accidentally shrink. The CLI composes the entire pipeline in eleven lines because every stage is a function you already wrote: `build_plan(headers, rows)` → `mask_with_plan(rows, plan)` → `DictWriter`.

**🎯 Expected output:** `masked 4 columns across 2 rows -> masked.csv` then `audit entries: 1` — and `masked.csv` shares the headers of the input with sensitive cells masked, `audit.jsonl` containing one ISO-timestamped JSON line.

**🩹 If it's off:** If `masked.csv` is empty, `DictReader` consumed the file but no rows were read — check the CSV isn't a single header with no data and that you didn't open `args.output` before closing the reader. If the audit count climbs by more than one per run, you called `record` inside a loop instead of once.

### 5.2 Verify the CLI

**✅ Checklist**

- ✅ After one run, `masked.csv` has identical headers to the source and identical values in all non-sensitive columns.
- ✅ `audit.jsonl` contains exactly one line per run, with a UTC timestamp, source, masked columns, and row count.
- ✅ Re-masking the same file still works (masking masked data is fine — the plans target the same columns).

**🤔 Socratic Question(s)**

- The audit records *what was masked* but not the masking *secrets* (the hash seeds or the specific transform). Would recording the seed make the log more auditable or more dangerous — and what does that tell you about audit logs holding *just enough* to reproduce results without revealing data?
- `masker.py` writes a new file and never touches the source. What would an `--in-place` flag have to add (hint: audit — and what about `output == csv_path`) before it were safe enough to ship?

## ⚠️ Common pitfalls

- **Using unseeded randomness.** `random.shuffle` with no seed produces a different masked dataset every run, which breaks tests and makes "reproduce this masking job" impossible. Always construct `random.Random(seed)` explicitly.
- **Hashing without determinism in mind.** `hash()` is salted per-process in Python and useless here; `hashlib.sha256(...)` is stable. Also lowercase/whitespace differences quietly change hashes — normalize input or document that case matters.
- **Masking by replacing values instead of permuting.** `salary * 1.1` changes the distribution your test analytics depend on. If shape must survive, permute; transform only when you want shape to drift.
- **Preserving the format past the point of privacy.** Keeping 8 of 10 phone digits "for realism" leaks most of the number. Preserve *shape*, not digits — the last 4 are the informationally-densest anyway, so even that is a judgment call worth revisiting.
- **No audit trail.** A masker that can't answer "what got masked, when, where" fails the compliance purpose it exists for. Append-only JSONL is ten lines; the absence of it is a red flag in any real review.

## What you just built

A working data masker: column detection by names and value patterns, a strategy zoo from redact to format-preserving, an auto-building plan, distribution-preserving permutation for numbers, and an append-only audit trail — all standard library, all behind one CLI verb. The transferable skill is *purpose-fit anonymization*: choosing destruction (redact), pseudonymity (hash), structure-preservation (format), or distribution-preservation (permute) by asking what the downstream data actually needs, then proving each choice with a check instead of a hope.

:::tip[Run a fuller version without any local setup]
[`examples/data-masker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-masker) in the course repo has these complete scripts plus sample CSVs and a pre-written audit. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a **cell-level** mode for free-text columns (mask only the cells that match the email/phone regex), keeping the column's non-sensitive values intact — the honest answer to Step 1's Socratic question.
- Make the `ssn`-style fallback smarter with a **value-shape registry** (groups of `\d{3}-\d{2}-\d{4}` → dedicated SSN mask) instead of the catch-all hash.
- Emit per-strategy statistics in the audit entry (columns preserved-format, columns permuted, columns hashed) so compliance reviews can skim one line per job.
- Add `--seed` as a CLI flag so a partner team can reproduce *your exact* masked snapshot for their own tests — reproducibility as a public API.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓