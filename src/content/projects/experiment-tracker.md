---
title: "Build an Experiment Tracker"
description: "Log ML experiments to JSONL with a run dataclass, guard duplicate IDs, pick the best run per metric, hash artifacts, and drive it all from a CLI."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["cli", "json", "dataclasses", "logging"]
prerequisites:
  - "Python basics (lists, dictionaries, functions, classes)"
  - "Comfortable with files and running scripts in the terminal"
learningObjectives:
  - "Model an experiment run as a dataclass"
  - "Append runs to a JSONL log with a duplicate ID guard"
  - "Rank runs and pick the best per metric with a direction table"
  - "Register artifact files with SHA-256 digests"
  - "Drive add / list / best from a small command-line interface"
---

# 🧪 Build an Experiment Tracker

"Which model won?" is the recurring question of any project that trains models, and a plain `results.txt` can't answer it: same run name, rerun twice, edited columns, and the answer drifts with whatever someone typed last. This project builds the honest alternron: a `runs.jsonl` log where each run is a dataclass (model, metric, value, artifact path), duplicate IDs are refused at the door, the best run per metric comes from a direction table ("lower rmse is better, higher accuracy is better"), artifacts get a SHA-256 fingerprint you can verify later, and a five-command CLI (`add`, `list`, `best`) makes the whole thing feel like a real tool. Everything is standard library and file-based, no database, no ML library required.

This assumes Python 101, lists, dicts, functions, plus dataclasses (`from dataclasses import dataclass`) and comfortable file handling. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Define a `Run` dataclass and see one real record.
2. Append runs to JSONL with a duplicate-id guard that blocks re-logging.
3. Report all runs and pick the best for a metric using a direction table.
4. Hash an artifact file with SHA-256 and copy it into the warehouse.
5. Wire it all into a CLI and register a three-model shootout.

## Where to run this

**Locally with `uv`** is the recommended path, an experiment log is a file-out tool (X L in, `runs.jsonl` out), and files belong on your terminal.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work, the notebook at [`examples/experiment-tracker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.ipynb) runs the tracker on in-memory `runs.jsonl`-style records in the same shape.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fexperiment-tracker%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces "install Python, then pip, then a virtual environment tool", and this project is pure standard library.

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
uv init experiment-tracker
cd experiment-tracker
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `experiment-tracker/` exists with a `pyproject.toml`.
- ✅ `python -c "import json, hashlib, shutil"` succeeds, stdlib, nothing to install.

## Step 1: Model a run as a dataclass

The tracker's vocabulary is one record: a **run**, one model + one dataset + one score. Storing it as a plain dict works, but a `@dataclass` gives you the fields as *typed attributes*: `run.model` instead of `run["model"]`, a required list on the class, and free `repr` for printing. The `sha256` field defaults to `""` so a run can be created before it has a real artifact digest.

### 1.1 Define the Run record

**👟 Starter hint:** `@dataclass` above a class of fields; `asdict(run)` later will hand it to `json.dumps`:

```python
# tracker.py
import json
from dataclasses import asdict, dataclass
from pathlib import Path

LOG_FILE = "runs.jsonl"

@dataclass
class Run:
    run_id: str
    model: str
    metric: str
    value: float
    artifact: str
    sha256: str = ""

if __name__ == "__main__":
    run = Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib")
    print(run)
    print(run.model, run.value)
```

Run it:

```bash
uv run tracker.py
```

The dataclass is doing quiet, structural work: `value: float` means a run carrying `value="3.42"` (string) is typed wrong at creation, `sha256: str = ""` documents a deliberate "not yet hashed" state, and `print(run)` renders the whole record in a way a plain dict prints indirectly. Building the vocabulary as a type, not a comment, means every downstream function (`log_run`, `best_run`) names its expectations in the signature.

**🎯 Expected output:**

```
Run(run_id='run_001', model='ridge', metric='rmse', value=3.42, artifact='artifacts/run_001.joblib', sha256='')
ridge 3.42
```

**🩹 If it's off:** If `print(run)` raises a positional-order error, the dataclass fields were declared in a different order than the constructor call, position matters without keyword args. If `run.model` is `AttributeError`, the class wasn't actually decorated (`@dataclass` line missing above `class Run`).

### 1.2 Verify the record shape

**✅ Checklist**

- ✅ `run.run_id`, `run.model`, `run.metric`, `run.value`, `run.artifact` all access cleanly.
- ✅ `run.sha256 == ""` by default, the "unregistered" sentinel works.
- ✅ `asdict(run)` returns a plain dict with the six fields, ready for JSON.

**🤔 Socratic Question(s)**

- It's six attributes today. What would a *seventh* field, `timestamp`, `params` as a nested dict, do to this dataclass, and why does JSONL survive the change while a fixed-column CSV wouldn't?
- `value: float` forces a number, but not which metric it is, `metric` is a sibling field, not a type. What's the line where a *class per metric* (RmsRun, AccuracyRun) becomes better than a generic field, and what breaks when you cross it (add, compare)?

## Step 2: Log runs into JSONL with a duplicate guard

A log that accepts the same run twice is a log that lies, "run_001 ridge" then says "run_001 ridge check, better!" twice and everyone trusts a doubled count. JSONL (JSON per line) is the append-friendly format: `log_run` reads the existing log, works out whether `run_id` already exists, and **raises** if it does. Appending one line is atomic at the file level and survives `Ctrl+C`.

### 2.1 Write the logger and prove the guard

**👟 Starter hint:** `load_runs` reads every existing line; `log_run` checks for duplicates *before* appending with `"a"` (append mode):

```python
# tracker.py
import json
from dataclasses import asdict, dataclass
from pathlib import Path

LOG_FILE = "runs.jsonl"

@dataclass
class Run:
    run_id: str
    model: str
    metric: str
    value: float
    artifact: str
    sha256: str = ""

def load_runs(path: str = LOG_FILE) -> list[Run]:
    if not Path(path).exists():
        return []
    return [Run(**json.loads(line)) for line in
            Path(path).read_text().splitlines() if line.strip()]

def log_run(run: Run, path: str = LOG_FILE) -> None:
    if any(r.run_id == run.run_id for r in load_runs(path)):
        raise ValueError(f"duplicate run_id: {run.run_id}")
    with open(path, "a") as f:
        f.write(json.dumps(asdict(run)) + "\n")

if __name__ == "__main__":
    log_run(Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib"))
    log_run(Run("run_002", "lasso", "rmse", 4.05, "artifacts/run_002.joblib"))
    print(Path("runs.jsonl").read_text())
    try:
        log_run(Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib"))
    except ValueError as e:
        print("duplicate blocked:", e)
    print("loaded runs:", [r.run_id for r in load_runs()])
```

`load_runs` returns `[]` for a missing file, an experiment directory with *no* log yet is legitimate, not an error. `Run(**json.loads(line))` unpacks each JSON object straight into the dataclass, so serialize/deserialize are each one line in opposite directions. The guard reads the *whole* log first, O(n) per append, correct for notebook-scale hundreds of runs, and `any(...)` short-circuits on the first `run_001` match. The `try/except` in the demo is deliberate: refusal is *audible* (`duplicate blocked:`), never a silent overwrite or a doubled row.

**🎯 Expected output:**

```
{"run_id": "run_001", "model": "ridge", "metric": "rmse", "value": 3.42, "artifact": "artifacts/run_001.joblib", "sha256": ""}
{"run_id": "run_002", "model": "lasso", "metric": "rmse", "value": 4.05, "artifact": "artifacts/run_002.joblib", "sha256": ""}

duplicate blocked: duplicate run_id: run_001
loaded runs: ['run_001', 'run_002']
```

**🩹 If it's off:** If the second `log_run("run_001")` appends instead of raising, the `if any(...)` raises only for an *exact* match, check `r.run_id == run.run_id` is the comparison and `load_runs(path)` is being passed the same `path`. If `Run(**json.loads(line))` raises a type error, some line isn't a JSON object (a stray blank line is handled by `if line.strip()`, but a truncated `{"run_id"` from a crash is not, delete that line by hand).

### 2.2 Verify the logger

**✅ Checklist**

- ✅ First run of `tracker.py` creates `runs.jsonl` with 2 lines; a first-run-again is blocked, not doubled.
- ✅ `loaded runs: ['run_001', 'run_002']`, deserialization round-trips cleanly.
- ✅ `LOG_FILE` is a module-level constant, changing the filename is one edit, used everywhere.

**🤔 Socratic Question(s)**

- The guard is O(n), read the whole log per append. At what run count does that become slow enough to matter, and what's the two-line improvement (`run.ids in {r.run_id for r in load_runs()}`, same cost, different story) versus a hash file upfront?
- `log_run` *raises* on duplicates. Name one workflow where raising is the right refusal (a replay guard) and one where a duplicate ID should *replace* the old line (a rerun with new `value`), and what the second needs that `add` doesn't have.

## Step 3: Report runs and pick the best

Now the tracker answers its central question. `report` prints every run; `best_run` takes a metric and returns the winner, but "best" needs a *direction*: rmse is lower-better, accuracy is higher-better. A `BEST_DIRECTION` table turns that judgment into data, so `min` vs `max` falls out of one lookup instead of being re-decided in every call site.

### 3.1 Write the ranking

**👟 Starter hint:** Filter to the metric first, then `min(...) if direction == "min" else max(...)`, same shape, one knob:

```python
# rank.py
from tracker import Run, load_runs

BEST_DIRECTION = {"rmse": "min", "mae": "min", "accuracy": "max"}

def report(runs: list[Run]) -> None:
    for r in runs:
        print(f"  {r.run_id}  {r.model:<18} {r.metric}={r.value:.2f}")

def best_run(runs: list[Run], metric: str) -> Run | None:
    candidates = [r for r in runs if r.metric == metric]
    if not candidates:
        return None
    is_min = BEST_DIRECTION[metric] == "min"
    return (min if is_min else max)(candidates, key=lambda r: r.value)

if __name__ == "__main__":
    runs = load_runs()
    report(runs)
    best = best_run(runs, "rmse")
    print("best:", best.run_id, best.model, best.value)
```

`best_run` does two independent jobs in order: **filter** to the metric's own runs (so an `accuracy` run never competes with an `rmse` run), then **select** with the direction table. The `| None` in the return type declares the empty case deliberately wrong, a metric with zero runs returns `None`, never a `max([])` crash. `report` is display-only: same records, no mutation, no re-ranking.

**🎯 Expected output:**

```
  run_001  ridge              rmse=3.42
  run_002  lasso              rmse=4.05
best: run_001 ridge 3.42
```

**🩹 If it's off:** If "best" selects `run_002` (the larger), `is_min` is inverted, `BEST_DIRECTION[metric] == "max"` would select the largest for rmse. If it crashes on an empty metric, the `if not candidates: return None` guard is missing underneath the filter.

### 3.2 Verify the ranking

**✅ Checklist**

- ✅ `best_run(load_runs(), "rmse")` returns run_001 (3.42 < 4.05).
- ✅ `report` prints both runs with `metric=value` aligned to 2 decimals.
- ✅ Adding `Run("x", "...", "accuracy", 0.9, ...)` makes `best_run(..., "accuracy")` pick *largest*, direction respected.

**🤔 Socratic Question(s)**

- "Best" depends on the metric *and* the direction, a table the caller could forget (`BEST_DIRECTION[metric]` KeyError for an untracked metric). What does a `KeyError` here *teach the operator* vs. a silent wrong `min`, and where should the unknown-metric case surface (validation at `add` time)?
- Ties are silent: two runs with the same `value` return whichever comes first in the log. If the tie-breaker should be *the newer run*, what field does the log need, and what does the filter expression become?

## Step 4: Hash and register artifacts

Scores lie on their own. "rmse 3.42" means nothing if tomorrow the log says the same number for a *different* pickle. The fix is a **fingerprint**: `sha256_of` hashes the artifact file into a 64-hex digest, stored *on the run record*. Later, re-hashing `artifacts/run_002.joblib` and comparing against the logged digest tells you instantly whether the artifact was touched since registration.

### 4.1 Hash a candidate artifact

**👟 Starter hint:** `hashlib.sha256(Path(path).read_bytes()).hexdigest()`, content in, 64 hex chars out:

```python
# artifacts.py
import hashlib
import shutil
from pathlib import Path

def sha256_of(path: str) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

if __name__ == "__main__":
    src = "candidates/ridge.joblib"
    print("sha256 of artifact:", sha256_of(src))
    shutil.copy(src, "artifacts/run_candidate.joblib")
    print("copied:", Path("artifacts/run_candidate.joblib").exists())
    print("same digest after copy:",
          sha256_of(src) == sha256_of("artifacts/run_candidate.joblib"))
```

`read_bytes()` reads the whole file into bytes, fine for a serialized model, the right instinct for integrity checking. Hashing after the `shutil.copy` proves a property worth knowing: **copy is content-preserving**, so the digest is stable across the warehouse boundary. The 64-character hex string is the signature of the file's *content*: change one byte of the pickle and the digest changes beyond recognition (avalanche), and, practically, matching digests means byte-identical files.

**🎯 Expected output:**

```
sha256 of artifact: ff863fe836434899105f08c56435c6bd35561416798f30465ccd22653e9ec950
copied: True
same digest after copy: True
```

**🩹 If it's off:** If the digest prints fewer than 64 chars, `hexdigest()` was swapped for a truncated view (`digest()[:16]`) somewhere. If `copied: False`, `artifacts/` didn't exist before the copy, `Path("artifacts").mkdir(exist_ok=True)` belongs before `shutil.copy`, or the copy fails on a missing directory.

### 4.2 Verify the hashing

**✅ Checklist**

- ✅ `ff863fe8...e9ec950`, the digest *isn't* random: it's the SHA-256 of that exact byte string, reproducible across machines.
- ✅ The copy's digest matches the source's, two paths, one content.
- ✅ Editing one byte of the artifact changes the digest entirely, the "touched?" check works.

**🤔 Socratic Question(s)**

- The digest lives *next to* the artifact (in the log). An attacker who can edit `run_002.joblib` can edit `runs.jsonl` too, hash chains in the same folder is "evidence theater". What's the one-step upgrade (hash stored in a separate `.sha256` file you don't regenerate) and its residual weakness?
- Hashing reads the whole file. For a 4 GB weights file that's a full disk read per registration, acceptable once. Where's the line where per-chunk incremental hashing (read in 1 MB chunks) beats single-shot `read_bytes()`?

## Step 5: Wire it into a CLI

The final step ties everything together into a tool you can actually run: `add RIDGE RMSE 3.42 candidates/ridge.joblib` registers a run (copies the artifact, computes its digest), `list` prints the table, `best rmse` crowns the winner. The shotgun-wielding slice of the pipeline, fewer arguments, the read from the log, the direction table, lives in `cli.py`, importing the tracker and reusing everything built above.

### 5.1 Write the CLI

**👟 Starter hint:** `sys.argv[1:]` splits off the program name; each `cmd` branch is one operation:

```python
# cli.py
import hashlib
import shutil
import sys
from pathlib import Path

from tracker import Run, load_runs, log_run

ART_DIR = "artifacts"
BEST = {"rmse": "min", "mae": "min", "accuracy": "max"}

def digest(path: str) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def register(model: str, metric: str, value: float, src: str) -> Run:
    run_id = f"run_{len(load_runs()) + 1:03d}"
    Path(ART_DIR).mkdir(exist_ok=True)
    dest = f"{ART_DIR}/{run_id}.joblib"
    shutil.copy(src, dest)
    run = Run(run_id, model, metric, value, dest, digest(dest))
    log_run(run)
    return run

if __name__ == "__main__":
    cmd, *args = sys.argv[1:]
    if cmd == "add":
        run = register(args[0], args[1], float(args[2]), args[3])
        print(f"registered {run.run_id} ({run.model}) sha256={run.sha256[:16]}...")
    elif cmd == "list":
        for r in load_runs():
            print(f"{r.run_id:<9} {r.model:<18} {r.metric:<10} {r.value:>8.3f}  {r.artifact}")
    elif cmd == "best":
        cand = [r for r in load_runs() if r.metric == args[0]]
        if not cand:
            print(f"no runs tracked for metric {args[0]}")
        else:
            key = BEST[args[0]]
            best = min(cand, key=lambda r: r.value) if key == "min" \
                else max(cand, key=lambda r: r.value)
            print(f"best {args[0]} ({key}): {best.run_id} {best.model} = {best.value:.3f}")
    else:
        print("usage: cli.py add MODEL METRIC VALUE ARTIFACT | list | best METRIC")
```

`register` is the one place that *creates* state: it numbers the run from the log length (`run_003` after two runs), copies the candidate into `artifacts/` under the run's name, hashes the *warehoused copy* (`digest(dest)`, not the source, the thing that lives is what's fingerprinted), and calls the Step-2 guarded `log_run`. The CLI's `best` guards the empty metric case ("no runs tracked for rmse handles accuracy-untracked politely") and prints the direction with the winner so the operator sees *why* (`best rmse (min)`).

### 5.2 Run the three-model shootout

**👟 Starter hint:** From a clean log, three candidate artifacts in `candidates/`, then three `add`s, a list, and the crown (a fresh `runs.jsonl` keeps the run numbering starting at `run_001`, on your own directory you'd skip the first line, since the duplicate guard protects it anyway):

```bash
rm -f runs.jsonl
mkdir -p candidates artifacts
printf 'serialized ridge weights [0.2, -0.1, 0.4]'  > candidates/ridge.joblib
printf 'serialized lasso weights [0.1, 0.3]'        > candidates/lasso.joblib
printf 'serialized gb weights   [0.15, -0.2, 0.5]'  > candidates/gb.joblib
uv run cli.py add ridge rmse 3.42 candidates/ridge.joblib
uv run cli.py add lasso rmse 4.05 candidates/lasso.joblib
uv run cli.py add gradient_boosting rmse 2.87 candidates/gb.joblib
uv run cli.py list
uv run cli.py best rmse
uv run cli.py best accuracy
```

**🎯 Expected output:**

```
registered run_001 (ridge) sha256=ff863fe836434899...
registered run_002 (lasso) sha256=5ac5290c4de57d97...
registered run_003 (gradient_boosting) sha256=6a542a94df7113c3...
run_001   ridge              rmse          3.420  artifacts/run_001.joblib
run_002   lasso              rmse          4.050  artifacts/run_002.joblib
run_003   gradient_boosting  rmse          2.870  artifacts/run_003.joblib
best rmse (min): run_003 gradient_boosting = 2.870
no runs tracked for metric accuracy
```

**🩹 If it's off:** If `add` reports two identical digests for different models, the same file was passed as `src` twice (different candidates must be *different* byte strings). If `best accuracy` raises instead of printing, the `if not cand` guard is missing, `max([])` cannot happen with it in place.

### 5.3 Verify the shootout

**✅ Checklist**

- ✅ Three runs registered with consecutive `run_001/2/3` IDs and distinct digests; `list` matches them.
- ✅ `best rmse` picks run_003 (2.87), "min" direction respected.
- ✅ `best accuracy` on a never-logged metric prints a friendly message, not a traceback.
- ✅ `artifacts/` now holds three fingerprinted `.joblib` copies plus the log lines that reference them.

**🤔 Socratic Question(s)**

- `register` numbers runs from `len(load_runs())`, order depends on the log, not on a guarantee. What happens when runs are *deleted* from the log (run_002 removed, next ID is `run_003` again → duplicate guard fires), and what's the robust alternative (counter per prefix, timestamped IDs)?
- The CLI reads the log on every `best` and `list`, cheap for today, O(n) forever. What's the shape of a *single peering view* that could be built once and shared (`best_of("rmse")` over a loaded session)? Is that a correctness change or an efficiency one?

## ⚠️ Common pitfalls

- **Doubled runs from missing dedup.** `log_run` without the duplicate check turns a re-run into a lie. The guard is the feature; the append is the plumbing.
- **Min vs. max by memory.** Picking the *smallest* rmse is obvious; picking the *largest* accuracy is the same shape with one `max`. Skip the direction table and the "best" answer flips per metric, silently.
- **Hashing the wrong file.** Fingerprinting *before* copy, or hashing the source path and storing it against the warehouse copy, verifies nothing once the copy diverges. Hash what lives: `digest(dest)`.
- **Empty candidates.** `min([], key=...)` is a crash, not a verdict. Guard before selecting, `"no runs tracked for metric accuracy"` is a datum an operator can act on.
- **Sequential IDs from log length.** `len(load_runs()) + 1` reuses an ID if runs are deleted, and the duplicate guard then fires on a legal append. Order numbers belong to a counter, not to a count.

## What you just built

A five-command experiment tracker that behaves like a real MLE tool: a typed `Run` record, an append-only JSONL log with a duplicate guard, a direction-aware `best` selector, artifact registration with SHA-256 fingerprints, and a CLI that ties it together without importing a framework. The transferable ideas, records as dataclasses, append-only logs, direction tables, content hashes, are the atoms of every serious experiment management system, and you've built them in ~65 lines of stdlib.

:::tip[Run a fuller version without any local setup]
[`examples/experiment-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/experiment-tracker) in the course repo has the complete scripts plus the sample candidate artifacts. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a **`compare` command**, `best` picks one; `compare rmse` prints the full ranking with deltas against the winner (`+0.55`, `+0.18`), the output a valley-plot chart would consume.
- Persist **`params`** as a nested dict per run and log it, `Run(..., params={"alpha": 0.1})` makes the tracker answer "what config won?", not just "which model?".
- Add a **`verify` command** that re-hashes every `artifacts/*.joblib` and reports mismatches against the log in one pass, the integrity check becomes a scheduled habit, not a hunch.
- Switch `register`'s ID to a **UTC timestamp** (`time.strftime("%Y%m%d_%H%M%S")`), collisions become impossible in practice and reruns get sortable identity.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓