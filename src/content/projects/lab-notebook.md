---
title: "Build a Digital Lab Notebook"
description: "Record experiments with structured data, calculations, and reproducible analysis pipelines."
difficulty: "intermediate"
---
# 📓 Build a Digital Lab Notebook

Scientists track experiments, hypotheses, and versioned results. A digital lab notebook does the same but structurally: each experiment gets a template, measurements feed into calculations, and results export as reproducible reports. This project builds exactly that.

This assumes Python 101 and comfort with pandas from Data Analysis. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the notebook + export dependencies.
2. Define structured experiment templates with typed fields.
3. Add an embedded calculation engine for running analysis on measurements.
4. Implement a version history that tracks every change.
5. Export experiments to a publication-ready PDF report.

## Where to run this

**Locally with `uv`** is the primary path, this is a CLI tool that writes experiment files and PDFs.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lab-notebook/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lab-notebook/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flab-notebook%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment, pandas, and ReportLab.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init lab-notebook
cd lab-notebook
uv add pandas reportlab click
```

`pandas` powers the calculation engine. `reportlab` generates PDF exports. `click` provides the CLI.

### Create the project structure

```bash
mkdir -p notebook
touch notebook/__init__.py notebook/model.py notebook/calculations.py notebook/store.py notebook/export.py notebook/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `lab-notebook/` exists with `pyproject.toml` and all dependencies installed.
- ✅ The `notebook/` directory has all required module files.

## Step 1: Define structured experiment templates

An experiment has a hypothesis, conditions, measurements, and a result. Encoding these as a typed dataclass gives every experiment a consistent shape.

### 1.1 Create the experiment model

**👟 Starter hint:** Create `notebook/model.py`.

```python
# notebook/model.py
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Measurement:
    label: str
    value: float
    unit: str = ""

@dataclass
class Experiment:
    title: str
    hypothesis: str
    measurements: list[Measurement] = field(default_factory=list)
    created: str = field(default_factory=lambda: datetime.now().isoformat())
    versions: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "hypothesis": self.hypothesis,
            "measurements": [m.__dict__ for m in self.measurements],
            "created": self.created,
            "versions": self.versions,
        }
```

**🎯 Expected output:** `Experiment("Grow rate", "Light increases growth")` creates a structured, serializable experiment.

**🩹 If it's off:** If `to_dict` fails, check the dataclass field ordering.

### 1.2 Verify the model

**✅ Checklist**

- ✅ `Experiment` accepts title, hypothesis, and optional measurements.
- ✅ `to_dict()` returns a plain serializable dict.
- ✅ `created` defaults to the current timestamp.

**🤔 Socratic Question(s)**

- How would you add validation so measurements can't be negative when that breaks the experiment's physical meaning?

## Step 2: Build the calculation engine

The engine runs analysis on measurements: mean, standard deviation, and a trend-line formula.

### 2.1 Create the calculations

**👟 Starter hint:** Create `notebook/calculations.py`.

```python
# notebook/calculations.py
import statistics
from notebook.model import Experiment


def analyze(exp: Experiment) -> dict:
    values = [m.value for m in exp.measurements]
    if not values:
        return {"error": "no measurements"}
    result = {
        "count": len(values),
        "min": min(values),
        "max": max(values),
        "mean": statistics.mean(values),
        "stdev": statistics.stdev(values) if len(values) > 1 else 0.0,
    }
    result["cv"] = result["stdev"] / result["mean"] if result["mean"] else 0
    return result


def trend_formula(values: list[float]) -> str:
    """Least-squares slope/intercept as a readable y = mx + b string."""
    n = len(values)
    if n < 2:
        return "y = N/A (need >= 2 points)"
    xs = list(range(n))
    x_mean = sum(xs) / n
    y_mean = sum(values) / n
    slope = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, values)) / \
            sum((x - x_mean) ** 2 for x in xs)
    intercept = y_mean - slope * x_mean
    return f"y = {slope:.3f}x + {intercept:.3f}"
```

**🎯 Expected output:** `analyze(exp)` returns count, min, max, mean, and standard deviation; `trend_formula` returns a readable equation.

**🩹 If it's off:** If `stdev` errors on a single point, the `len(values) > 1` guard handles it.

### 2.2 Verify calculations

**✅ Checklist**

- ✅ `analyze` returns stats for a populated experiment.
- ✅ Empty experiments return a friendly error dict.
- ✅ `trend_formula` produces a `y = mx + b` string for ≥2 points.

**🤔 Socratic Question(s)**

- What additional statistic would a bench scientist expect beyond mean and stdev?

## Step 3: Track versions

Each time an experiment changes, snapshot it. That makes every prior state recoverable.

### 3.1 Add versioning

**👟 Starter hint:** Create `notebook/store.py`.

```python
# notebook/store.py
import json, copy
from datetime import datetime
from notebook.model import Experiment


class NotebookStore:
    def __init__(self, path="notebook.json"):
        self.path = path
        self.experiments: dict[str, Experiment] = {}

    def add(self, exp: Experiment):
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        self.experiments[exp.title] = exp

    def update(self, exp: Experiment, **changes):
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        for key, value in changes.items():
            setattr(exp, key, value)

    def history(self, title) -> list[dict]:
        exp = self.experiments.get(title)
        return exp.versions if exp else []

    def rollback(self, title, version_index):
        exp = self.experiments[title]
        version = exp.versions[version_index]["snapshot"]
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        exp.measurements = [type(exp.measurements[0])(**m) for m in version["measurements"]]
        exp.hypothesis = version["hypothesis"]

    def save(self):
        with open(self.path, "w") as f:
            json.dump({k: v.to_dict() for k, v in self.experiments.items()}, f, indent=2)
```

**🎯 Expected output:** `store.update(exp, hypothesis="New idea")` records the prior state, and `rollback` restores it.

**🩹 If it's off:** If rollback crashes, the snapshot's measurements may not reconstruct cleanly, check the dict keys.

### 3.2 Verify versioning

**✅ Checklist**

- ✅ Every `add`/`update` appends a version snapshot.
- ✅ `history` returns the version trail.
- ✅ `rollback` restores a prior state and records the transition.

**🤔 Socratic Question(s)**

- The current versioning keeps full snapshots. When would a diff-based approach be better, and why the extra complexity?

## Step 4: Export to PDF

A lab notebook is only useful if others can read it. Generate a clean report from experiment data.

### 4.1 Create the PDF exporter

**👟 Starter hint:** Create `notebook/export.py`.

```python
# notebook/export.py
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from notebook.calculations import analyze
from notebook.model import Experiment


def export_pdf(exp: Experiment, out_path: str):
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(out_path, pagesize=A4)
    story = [
        Paragraph(exp.title, styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"<b>Hypothesis:</b> {exp.hypothesis}", styles["Normal"]),
        Spacer(1, 12),
    ]
    stats = analyze(exp)
    if "error" not in stats:
        story.append(Paragraph(f"Mean: {stats['mean']:.3f}  |  Stdev: {stats['stdev']:.3f}", styles["Normal"]))
    rows = [["Label", "Value", "Unit"]]
    rows += [[m.label, str(m.value), m.unit] for m in exp.measurements]
    story.append(Table(rows))
    doc.build(story)
```

**🎯 Expected output:** `export_pdf(exp, "report.pdf")` writes a PDF with title, hypothesis, stats, and a measurements table.

**🩹 If it's off:** If the table is malformed, check row widths and that each row has the right number of columns.

### 4.2 Verify the export

**✅ Checklist**

- ✅ A PDF file is written to `out_path`.
- ✅ Title, hypothesis, and stats appear in it.
- ✅ The measurements render as a table.

**🤔 Socratic Question(s)**

- What would you add to a "publication-ready" report: a method section? A figure? A reproducibility statement?

## ⚠️ Common pitfalls

- **Mutable default measurements.** A `list` as a dataclass default is shared across instances. Use `field(default_factory=list)` as shown.
- **Forgetting to snapshot before mutation.** `update` truncates or loses data unless you record the old state first. Always snapshot before changing.
- **Division by zero in CV.** When mean is 0, `cv` divides by zero. The `if result["mean"] else 0` guard handles it.
- **ReportLab line-break errors.** Long unbroken strings crash Paragraph. Wrap text or allow word wrapping in cell styles.
- **Statistically empty data.** `analyze` returns `"error"` for zero measurements; check for it before assuming stats exist.

## What you just built

A structured lab notebook: typed experiment templates, a statistics engine that computes mean, stdev, and trend lines, snapshot-based versioning with rollback, and a PDF exporter. The result is a reproducible analysis workflow, record, calculate, version, and share, that mirrors how modern research teams actually work.

:::tip[Run a fuller version without any local setup]
[`examples/lab-notebook/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/lab-notebook) in the course repo has a richer version with chart generation, a searchable record index, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add matplotlib charts to the PDF export so results are visual, not just tabular.
- Implement full-text search across all experiments with a simple inverted index.
- Persist the notebook to SQLite instead of a flat JSON file for safer concurrent writes.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
