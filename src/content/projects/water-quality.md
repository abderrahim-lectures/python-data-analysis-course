---
title: "Build a Water Quality Monitor"
description: "Log time-stamped water samples to CSV, validate them against safe-range specs, compute rolling trends and drift, emit severity-ranked alerts, and chart the results with matplotlib."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["csv", "matplotlib", "automation"]
learningObjectives:
  - "Store time-stamped sample readings in a CSV"
  - Validate readings against safe-range specifications
  - "Compute rolling means and drift from a data series"
  - "Emit severity-ranked alerts for out-of-range or drifting samples"
  - "Chart trends with red safe-range guide lines"
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "Basic matplotlib pyplot (subplots, axhline)"
  - "Comfortable writing and reading CSV files"
---

# 🛠️ 💧 Build a Water Quality Monitor

Fresh-water monitoring is a data pipeline in a cool box: a sensor (your sample log) produces time-stamped readings, a spec (safe ranges per parameter) decides pass/fail, trends decide "getting worse", and an alert list decides attention. This project builds the whole loop with a plain CSV as the sensor: define parameters and their safe ranges, log readings, validate each sample, compute rolling means and drift, emit severity-ranked alerts, and finish with a matplotlib chart whose red dashed lines are the safe-range boundaries.

This assumes Python 101 plus a taste of matplotlib, nothing else is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Define the five monitored parameters and their safe ranges.
2. Log time-stamped readings to a CSV with data that keeps its labels.
3. Validate each reading against the ranges and print a pass/fail table.
4. Compute rolling means and drift to catch slow "getting worse" trends.
5. Alert on failures, borderline values, and drift, ranked by severity.
6. Chart every parameter against its red safe-range guide lines.

## Where to run this

**Locally with `uv`** is a primary home, the CSV lives and grows on your disk, and the chart saves as a real `.png` file. The whole project is utf-8 simple, and every line runs unmodified in the cloud notebooks too, where the only difference is that the chart renders *inline* instead of saving to a file.

**Google Colab, Kaggle Notebooks, and Binder** run all six steps identically (no external data, the CSV is seeded by your own script), with the inline chart at the end. The honest caveat: inline charts are great for exploring, but a monitoring tool wants the file on disk so an operator can look at it later. Use the badges to explore; use the local run for the "real device" feel.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/water-quality/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/water-quality/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwater-quality%2Fnotebook.ipynb)

## Setup

Create the project. The logging and analysis use only the standard library; matplotlib is the single real dependency.

```bash
uv init water-quality
cd water-quality
```

```bash
uv add matplotlib
```

```bash
uv run python -c "import matplotlib; print('plt', matplotlib.__version__)"
```

`csv` turns each sample into a named row (`timestamp`, `ph`, ...) so the data stays decodable years later, and `pathlib` keeps file paths clean. You'll design the *schema* yourself in Step 1, that schema is what makes every later step (validation, rolling means, charts) a name lookup instead of a pile of if-else chains.

**✅ Checklist**

- ✅ `uv init water-quality` created a project with a `pyproject.toml`.
- ✅ `uv add matplotlib` succeeded; the import check printed a matplotlib version.

## Step 1: Define parameters, ranges, and the CSV store

Every monitoring spec starts with the same question: *what are we watching, and what is a safe value?* This step encodes the answer as data, a dictionary of parameters, each with a low/high range and a unit, and writes your first readings to `readings.csv`.

### 1.1 Write `PARAMETERS`, `make_reading`, and `write_reading`

**👟 Starter hint:** Put every parameter's spec (`low`, `high`, `unit`) in one `PARAMETERS` dict, then build readings as plain dicts and append them to CSV, `DictWriter` keeps the column order for you.

```python
# monitor.py
import csv
import json
from pathlib import Path

PARAMETERS = {
    "ph":          {"low": 6.5, "high": 8.5,    "unit": "pH"},
    "turbidity":   {"low": 0.0, "high": 5.0,    "unit": "NTU"},
    "tds":         {"low": 0.0, "high": 500.0,  "unit": "ppm"},
    "temperature": {"low": 5.0, "high": 25.0,   "unit": "C"},
    "chlorine":    {"low": 0.2, "high": 2.0,    "unit": "mg/L"},
}

def make_reading(t: str, ph: float, turb: float, tds: float,
                 temp: float, chlorine: float) -> dict:
    return {"timestamp": t, "ph": ph, "turbidity": turb, "tds": tds,
            "temperature": temp, "chlorine": chlorine}

FIELDNAMES = ["timestamp", "ph", "turbidity", "tds", "temperature", "chlorine"]

def write_reading(path: str, reading: dict) -> None:
    is_new = not Path(path).exists()
    with open(path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        if is_new:
            writer.writeheader()
        writer.writerow(reading)
```

`PARAMETERS` being *data rather than scattered literals* is the whole design: "safe range" is now a lookup (`PARAMETERS["ph"]["high"]`), so validation (Step 2), alerts (Step 4), and the chart's guide lines (Step 6) all read the same single source of truth. `make_reading` accepts one value per field in a fixed signature, so a reading can't silently gain a column the CSV schema doesn't know about. `DictWriter` with `writeheader()` writes the labels once, which is what keeps the CSV human-readable later.

### 1.2 Seed six sample readings

**👟 Starter hint:** A half-hour of samples at 15-minute intervals, with the water *drifting bad* at the end, pH climbing, chlorine crashing, so the later steps have something real to catch.

```python
# Seed the log (a sensor as data)
samples = [
    make_reading("08:00", 7.0, 1.1, 220,  17.5, 0.9),
    make_reading("08:15", 7.3, 1.4, 235,  18.0, 0.7),
    make_reading("08:30", 7.7, 4.8, 260,  18.2, 0.4),
    make_reading("08:45", 8.1, 2.1, 300,  18.5, 0.2),
    make_reading("09:00", 8.7, 1.8, 340,  18.6, 0.1),
    make_reading("09:15", 9.4, 1.9, 520,  18.7, 0.02),
]
for reading in samples:
    write_reading("readings.csv", reading)

print(Path("readings.csv").read_text())
```

The seed data is deliberately *not* all-clean: by 09:00 pH is crossing 8.5, tds blows past 500, and chlorine is sliding toward zero. That's what makes the next steps meaningfully report something, a monitor that only ever says "everything fine" is not a monitor you trust.

**🎯 Expected output:** A header row plus six rows in the file `/` memory, ending with `09:15,9.4,1.9,520,18.7,0.02`.

**🩹 If it's off:** If header repeats on every append, `is_new` computed `False`, passing an empty-but-existing file makes `DictWriter` add headings forever. If columns are jumbled, the `reading` dict keys disagree with `FIELDNAMES`, `DictWriter` writes by key, so a typo'd key lands as an empty cell. If `newline=""` is missing from `open`, the file may gain blank lines between rows on Windows.

### 1.3 Verify the store

**✅ Checklist**

- ✅ `readings.csv` exists with exactly one header row and six data rows.
- ✅ Running the seed twice appends, not overwrites, the log is append-only.
- ✅ `PARAMETERS` holds every parameter with `low`, `high`, and `unit`.

**🤔 Socratic Question(s)**

- The CSV stores raw values only, no "alert!" column. If you *did* add a status column at write time, what could go stale about it later, and what does that imply about storing *data* versus storing *decisions derived from data*?
- Sensor logs grow forever. When is this CSV schema fine, and at what volume would you need a real database, and which decisions (schema, indexing, retention) is a CSV making *for* you without you noticing?

## Step 2: Validate readings against the safe ranges

Now the spec does work. Validation is one function over `PARAMETERS`: for each parameter, is the sample's value between low and high? This step prints a readable pass/fail table per sample.

### 2.1 Write `validate` and `print_validation`

**👟 Starter hint:** Loop the parameter names, pull `value = reading[name]` and the spec, and record `ok`, a flag, per parameter; the printer formats the table.

```python
# monitor.py (continued)
def validate(reading: dict) -> dict:
    results = {}
    for name, spec in PARAMETERS.items():
        value = reading[name]
        results[name] = {
            "value": value,
            "ok": spec["low"] <= value <= spec["high"],
            "spec": spec,
        }
    return results

def print_validation(reading: dict) -> None:
    print(f"--- {reading['timestamp']} ---")
    for name, result in validate(reading).items():
        status = "PASS" if result["ok"] else "FAIL"
        width = result["spec"]["high"] - result["spec"]["low"]
        position = (result["value"] - result["spec"]["low"]) / width
        bar = "#" * max(1, int(position * 10)) + "." * max(0, 10 - int(position * 10))
        print(f"{name:>12}: {result['value']:6.2f} {result['spec']['unit']:>4}"
              f"  [{bar}]  {status}")

print_validation(samples[-1])
```

The `ok` flag inside each result is deliberately *composite*: `low <= value <= high` in one expression both reads like the spec and cannot flip when someone widens a range and forgets a second site. The mini bar chart (`#`/`.`) is a cheap visual of *where* inside the range the sample sits, a "PASS" at the very edge of the range is worth looking at even before the borderline logic in Step 4.

**🎯 Expected output:** `--- 09:15 ---` then a table: `ph` FAIL (9.40 at the far edge of its bar), `turbidity` PASS high-edge, `tds` FAIL past 500, `temperature` PASS mid-range, `chlorine` FAIL below 0.2.

**🩹 If it's off:** If every row reads `PASS` forever, `validate` compares against the sample's own values (a `spec` typo like `reading[name] <= reading[name]`). If all show `FAIL`, `value` is a string from CSV (`float("9.4")` needed), running `validate` on loaded rows, not literal dicts, usually trips this. If the bar shows negative flanks, a value is above `high`: `position > 1` because the range math assumed value inside it.

### 2.2 Verify validation

**✅ Checklist**

- ✅ The 08:00 sample passes all five parameters.
- ✅ The 09:15 sample fails `ph`, `tds`, and `chlorine`.
- ✅ A value *exactly equal* to a range edge (e.g. `ph = 8.5`) counts as `PASS`, boundaries are inclusive.

**🤔 Socratic Question(s)**

- Inclusive boundaries mean `8.5` passes but `8.51` fails, a one-centimeter-wide "safe" line. Where would read-errors (a noisy sensor) make strict inclusive bounds dangerous, and what would you add?
- Which is more honest in a monitoring log: `ok` as a boolean, or also recording *how far outside* the range the value fell? Where does that distance start making severity decisions (Step 4) for you?

## Step 3: Rolling means and drift

A single sample can be noise; a *trend* is a story. This step computes rolling means (the average of the last few samples) and a drift score (recent mean minus an early baseline) for each parameter, catching slow changes a point-in-time check would miss.

### 3.1 Write `load_readings`, `rolling_mean`, and `drift`

**👟 Starter hint:** `csv.DictReader` returns rows whose values are *strings*, float-convert once. Then rolling mean is a windowed `sum/length`, and drift is `recent_mean - baseline_mean`.

```python
# monitor.py (continued)
def load_readings(path: str = "readings.csv") -> list[dict]:
    with open(path) as f:
        return list(csv.DictReader(f))

def values(readings: list[dict], name: str) -> list[float]:
    return [float(r[name]) for r in readings]

def rolling_mean(readings: list[dict], name: str, window: int = 3) -> list[float]:
    vals = values(readings, name)
    means = []
    for i in range(len(vals)):
        chunk = vals[max(0, i - window + 1) : i + 1]
        means.append(sum(chunk) / len(chunk))
    return means

def drift(readings: list[dict], name: str,
          baseline_window: int = 3, recent_window: int = 3) -> float:
    vals = values(readings, name)
    baseline = sum(vals[:baseline_window]) / baseline_window
    recent = sum(vals[-recent_window:]) / recent_window
    return recent - baseline

for name in PARAMETERS:
    print(f"{name:>12}: drift {drift(samples, name):+6.2f} "
          f"| rolling {rolling_mean(samples, name)[-1]:6.2f}")
```

Converting strings to floats once, in `values()`, is the fix for the classic CSV trap: every later function operates on numbers without sprinkling `float(...)` everywhere. `rolling_mean` grows `window` only when fewer samples exist (`max(0, i - window + 1)`), so the first point has a window of 1 instead of crashing. `drift` is the early-vs-recent comparison, signed so *direction* matters: `+` means rising, `-` falling.

**🎯 Expected output:** `ph: +1.40`, `tds: +148.3`, `chlorine: -0.56`, the three parameters that will later alert, with `turbidity: -0.50` and `temperature: +0.70` trailing behind in magnitude.

**🩹 If it's off:** If `drift` is `0.0` for everything, `values()` got strings and `float(r[name])` comparisons ran on text ordering (`'220' > '500'` is vacuous). If the very first rolling value prints as the whole-sample mean, the `max(0, ...)` slice trick is missing. If `KeyError: 'turbidity'` fires, the CSV's actual column differs from `FIELDNAMES` (a header misspelling), inspect `DictReader.fieldnames`.

### 3.2 Verify drift detection

**✅ Checklist**

- ✅ `rolling_mean(samples, "ph")[-1]` is around 8.7, pulled up by the late high samples.
- ✅ `drift(samples, "chlorine")` is a clear negative, signalling chlorine loss.
- ✅ Replacing the last reading with a copy of `samples[0]` drops `ph` drift from `+1.40` to about `+0.60`, the calculation actually reacts to data.

**🤔 Socratic Question(s)**

- `drift` here compares *means*, so one huge spike inflates it. What single statistic would insulate drift from an outlier while still detecting a real trend, and at what cost to sensitivity?
- A 3-sample window on a 6-sample log has almost no history. If you instead compared *today's* mean to *this week's whole* mean, what new failure mode appears? (Think about what "baseline" means when the water is already bad.)

## Step 4: Alert on failures, borderline values, and drift

Monitoring earns its keep by telling you *what to look at*. This step turns validation + drift into ranked alerts: hard failures first (out of range), then borderline values hugging a boundary, then slow-drift warnings, and a final "this needs a human" summary.

### 4.1 Write `issue_alerts`

**👟 Starter hint:** Pass the *latest* reading plus drift results per parameter; for each, pick the highest-severity alert that applies (FAIL beats BORDERLINE beats DRIFT beats OK).

```python
# monitor.py (continued)
BORDERLINE_FRACTION = 0.05

def issue_alerts(readings: list[dict]) -> list[dict]:
    latest = readings[-1]
    drift_by_name = {name: drift(readings, name) for name in PARAMETERS}
    alerts = []
    for name, result in validate(latest).items():
        spec = result["spec"]
        value = result["value"]
        if not result["ok"]:
            alerts.append({"severity": "ALERT", "name": name,
                           "message": f"{value:.2f} {spec['unit']} outside "
                                      f"{spec['low']}-{spec['high']}"})
            continue
        low_gap = (value - spec["low"]) / (spec["high"] - spec["low"])
        if low_gap < BORDERLINE_FRACTION or low_gap > 1 - BORDERLINE_FRACTION:
            alerts.append({"severity": "BORDERLINE", "name": name,
                           "message": f"{value:.2f} {spec['unit']} hugging a boundary"})
            continue
        d = drift_by_name[name]
        if abs(d) > 1.0:
            alerts.append({"severity": "DRIFT", "name": name,
                           "message": f"drift {d:+.2f} {spec['unit']} over last samples"})
    return alerts

for alert in issue_alerts(samples):
    print(f"[{alert['severity']:9}] {alert['name']:>12}: {alert['message']}")
```

The `continue` ladder is a priority encoder: each parameter fires its *worst* alert and moves on, because piling "DRIFT" on top of an already-ALERTing pH just buries the headline. `low_gap` normalizes position inside the range to `0..1`, so "within 5% of a boundary" is one check that works for any parameter regardless of its units. `drift` thresholds apply to every parameter, which is coarse, the Socratic question after the table asks where that deserves refinement.

**🎯 Expected output:** `[ALERT] ph: 9.40 pH outside 6.5-8.5`, `[ALERT] tds: 520.00 ppm outside 0.0-500.0`, `[ALERT] chlorine: 0.02 mg/L outside 0.2-2.0`, three hard failures, no runners-up on the same samples.

**🩹 If it's off:** If nothing fires `ALERT` on `ph`, `validate` used the *first* sample rather than `readings[-1]`. If `BORDERLINE` never shows, the `continue` before it ate every in-range row, check the alert ladder's ordering. If `drift` messages cite the wrong unit, `drift_by_name` was keyed by name but read from a different dict.

### 4.2 Verify alerts

**✅ Checklist**

- ✅ The 09:15 sample yields three `ALERT`s, `ph`, `tds`, and `chlorine`.
- ✅ `temperature` produces no alert, it's mid-range and stable.
- ✅ A sample *exactly at* `ph = 8.5` fires `BORDERLINE` (it passes the range check but sits within 5% of the high boundary).
- ✅ The 08:00 sample alone (re-seed) produces zero alerts.

**🤔 Socratic Question(s)**

- `BORDERLINE` uses a flat 5% of the *range width*, for pH that's 0.1 pH, for tds that's 25 ppm. Where does proportional-to-range lump very different physical realities together, and what unit-relative threshold would be fairer?
- The alert ladder drops `DRIFT` when `ALERT` already fired. When is a drift warning *more* actionable than the current failure, and what would your engine emit to say "you'll fail within the hour"?

## Step 5: Chart the trends with safe-range guide lines

Charts turn five parameter tables into one glance. This step plots every parameter as its own subplot with marker points, red dashed `axhline`s at the safe-range boundaries, and a saved PNG, the operator's morning view.

### 5.1 Write `plot_readings`

**👟 Starter hint:** One subplot per parameter, `plot(timestamps, values, marker="o")`, then an `axhline` per boundary; `tight_layout()` before saving.

```python
# monitor.py (continued)
import matplotlib.pyplot as plt

def plot_readings(readings: list[dict], path: str = "water_quality.png") -> None:
    timestamps = [r["timestamp"] for r in readings]
    names = list(PARAMETERS)
    fig, axes = plt.subplots(len(names), 1, figsize=(8, 2.0 * len(names)), sharex=True)
    for ax, name in zip(axes, names):
        series = [float(r[name]) for r in readings]
        ax.plot(timestamps, series, marker="o", label=name)
        ax.axhline(PARAMETERS[name]["high"], color="red", ls="--", lw=1)
        ax.axhline(PARAMETERS[name]["low"], color="red", ls="--", lw=1)
        ax.set_ylabel(f"{name} ({PARAMETERS[name]['unit']})")
        ax.legend(loc="best", fontsize=8)
    fig.suptitle("Water quality over the morning")
    fig.tight_layout()
    fig.savefig(path)
    print(f"saved {path}")

plot_readings(samples)
```

The bound-guide lines come from the *same* `PARAMETERS` dict the validator uses, so a spec change redraws the chart correctly with zero maintenance, the payoff of Step 1's "single source of truth" design. `sharex=True` forces every parameter onto the same time axis, so the eye compares *when* failures stack up. `marker="o"` marks the discrete samples, and saving to PNG is what makes the chart a durable artifact rather than a transient window.

**🎯 Expected output:** `saved water_quality.png`, a figure with five stacked subplots sharing the `08:00`..`09:15` axis, red dashed boundaries visible on every plot, and pH/tds/chlorine crossing their red lines by the end of the morning.

**🩹 If it's off:** If the image is blank, `savefig` ran with no prior `plot` call or the axes were overwritten by a second `subplots`. If subplots don't share the axis, `sharex=True` was dropped. If numbering interleaves weirdly (`01` vertical strides), `tight_layout()` is missing and labels collide, call it before saving.

### 5.2 Verify the chart

**✅ Checklist**

- ✅ One subplot per parameter, timestamps on the shared x-axis.
- ✅ Red dashed `axhline`s show both boundaries on *every* subplot.
- ✅ The image file exists on disk and pH visibly crosses its upper line by 09:15.

**🤔 Socratic Question(s)**

- The chart replays history. If a monitoring tool can only *store* raw readings and *recompute* everything at render time, what does that mean for where validation, drift, and alerts live, in the write path or the read path?
- Five tiny subplots make outliers obvious but magnitudes hard to compare. If turbidity (0-5 NTU) and tds (0-500 ppm) shared one axis, what would the eye *wrongly* conclude, and does that argue for or against per-parameter scaling?

## ⚠️ Common pitfalls

- **String inflation from CSV.** `DictReader` returns every cell as text, so `float(r["ph"]) > 9.0` silently sorts *strings* ("9.40" > "9.4"? unreliable). Fix: float-convert once at load, ideally in `values()`.
- **Boundaries that silently exclude.** `low < value < high` (strict) reads like the spec but rejects a sample *exactly* on the edge. Fix: use `<=`/`>=`, then decide explicitly whether the edge is safe.
- **A "sensor" that fakes history.** Seeding the CSV by hand in Share mode overwrites the append session's data, the file stays but the sequence lies. Fix: an append-only `write_reading` and a separation between "seed" and "live".
- **Rolling windows that look backward into nothing.** `vals[i-window:i]` at index 0 yields an empty slice → `sum/0`. Fix: clamp the window with `max(0, i - window + 1)`.
- **Charts whose red lines drift from the spec.** Copy-pasting boundary numbers into `axhline` means a spec change silently misdraws the chart. Fix: always read boundaries from `PARAMETERS`.

## What you just built

A monitoring pipeline in one file: a durable CSV log, spec-driven validation, rolling means and drift, a severity-ranked alert engine, and a chart with spec-derived guide lines. The transferable idea is that *"watch this thing" is a data shape*: a source (samples), a model (spec dict), derived signals (validation, drift), and a reader (alerts, chart). That same shape drives dashboards, anomaly systems, and every CI status panel you've ever seen, you've now built one end to end.

:::tip[Run a fuller version without any local setup]
[`examples/water-quality/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/water-quality) in the course repo is a fuller version of the code above, with a live sample loop and export helpers. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a *source* field to each reading (tap, well, river) and build a per-source filter so alerts say *which* source is failing.
- Turn the alert engine into a rule table, then into a `live()` loop that polls a CSV every N seconds and re-renders the chart, a real streaming monitor.
- Export alerts to a second CSV (`alerts.csv`) and compute its own rolling rate, alert fatigue is itself a metric worth watching.
- Compute an aggregate "risk score" per source by summing severity weights over all parameters, and chart *that* as the headline line.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓