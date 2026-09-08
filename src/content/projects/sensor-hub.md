---
title: "Build an IoT Sensor Hub"
description: "Collect and aggregate data from multiple sensors — temperature, humidity, motion — into a simulated live stream, then chart, alert, and save history."
difficulty: "intermediate"
estimatedMinutes: 120
tags: ["simulation", "matplotlib", "csv", "dictionaries", "scripting", "iot"]
learningObjectives:
  - "Represent multiple sensor types and emulate their readings on a tick loop"
  - "Aggregate raw readings into a normalized time-series log"
  - "Trigger threshold alerts and persist them with the stream"
  - "Visualize historical sensor data with Matplotlib"
prerequisites: ["python-101/file-io", "python-101/dictionaries", "python-101/functions", "data-visualization/matplotlib"]
---

# 📡 Build an IoT Sensor Hub

Step into a room and a thermostat reads 21.4 °C; a motion detector blinks every time someone crosses; a humidity chip measures a damp corner. An *IoT sensor hub* is the thing that collects all those readings from every sensor, normalizes them into one stream, flags the ones out of a safe range, and stores them so you can look back at a chart. The physical sensors are optional — this project simulates them honestly with a configurable tick loop, so the entire hub (aggregation, alerting, persistence, and a Matplotlib dashboard) runs on pure Python with no hardware and no network. Everything you build is the same shape a real MQTT-backed hub takes; only the "sensor" source is faked, and you'll know it, because replacing the simulator with a real stream is a documented swap.

This assumes Python 101 plus the course's Matplotlib module. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Build a sensor registry that emulates temperature, humidity, and motion readings on a tick.
2. Aggregate every tick into a normalized time-series log with unified columns.
3. Alert when a reading crosses a per-sensor threshold and record every alert.
4. Persist the stream to CSV and the alert trail alongside it.
5. Chart the history with Matplotlib — the "is my room getting hotter?" visual.

## Where to run this

**Locally with `uv` is the primary path** — the hub is a script you run, watch print, and re-run to append; the CSV and the Matplotlib `PNG` land as real files you can open, and the "run it live and watch the numbers tick" feeling is the whole hobbyist point. `uv add matplotlib` covers the one non-stdlib dependency.

**GitHub Codespaces** runs the identical script: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run it in a browser tab, with `history.csv` and `dashboard.png` visible in the file tree.

**Google Colab, Kaggle Notebooks, and Binder run the pipeline honestly** — the hub is pure simulation and NumPy-free math, and Matplotlib renders the chart *inline* in the notebook, so `dashboard.png` becomes a live cell output instead of a file. The only thing a notebook can't do is tick in *real wall-clock* the way a local loop does — but the simulation is under your control, so "1 second per tick" vs "fast forward 100 ticks" both work, and that's the honest place the notebook really shines (you get the whole stream plus charts in one artifact).

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sensor-hub/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sensor-hub/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsensor-hub%2Fnotebook.ipynb)

## Setup

Python plus Matplotlib, and no hardware.

### Install `uv` and Matplotlib

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
mkdir sensor-hub && cd sensor-hub
uv init --bare
uv add matplotlib
```

### The sensor simulator

Create `sensors.py` — the piece that stands in for physical hardware:

```python
# sensors.py
import random

class Sensor:
    def __init__(self, name, base, noise, unit, low=None, high=None):
        self.name, self.base, self.noise = name, base, noise
        self.unit, self.low, self.high = unit, low, high

    def read(self):
        value = self.base + random.gauss(0, self.noise)
        return round(value, 1), self.unit, self.low, self.high

def make_registry():
    return [
        Sensor("thermostat", base=21.4, noise=0.5, unit="C", low=15, high=26),
        Sensor("humidity", base=43.0, noise=2.0, unit="%", low=20, high=70),
        Sensor("motion", base=0.0, noise=0.0, unit="bool", low=None, high=None),
    ]
```

`Sensor.read()` wraps the physics in an object: a name, a resting *base* value, a *noise* sigma, a unit, and an optional safe *low/high* range. `random.gauss(base, noise)` is the honest stand-in for a sensor's jitter — temperature wobbles around 21.4, humidity around 43, and motion is a special case (a binary detector you'll flake in a moment by hand). `low/high=None` expresses "this sensor has no threshold" — motion just is or isn't moving.

**✅ Checklist**

- ✅ `uv --version` prints a version; `matplotlib` installed via `uv add`.
- ✅ `sensors.py` imports and `make_registry()` returns the three sensors.
- ✅ You can explain why `random.gauss` models a real sensor (jitter around a true value) better than a fixed number.

## Step 1: Emulate a tick loop

The heart of any hub is the *sampling loop*: every tick, ask every sensor for its current reading, and collect the whole batch as one timestamped row. This step runs a fixed number of ticks and prints them with timestamps — the raw feed a real gateway would push.

**👟 Starter hint:** Start by writing `sample()` that stamps a UTC time, loops over `make_registry()` calling each sensor's `.read()`, and returns one row dict with `ts`, `source`, and a value plus `_unit` column per sensor — then print five ticks.

```python
# hub.py
from datetime import datetime, timezone
import os
from sensors import make_registry

SENSORS = make_registry()

def sample(force: dict = None) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    reading = {"ts": now, "source": "sim"}
    for s in SENSORS:
        value, unit, lo, hi = s.read()
        reading[s.name] = value
        reading[f"{s.name}_unit"] = unit
    if force:
        reading.update(force)
    return reading

for tick in range(5):
    print(sample())
```

`sample` builds one hub row: a UTC timestamp, `source: "sim"` (so you know which rows came from simulated vs injected data), and one column per sensor plus its unit. The `force` dict is the injection hatch — it lets you *override* a reading (say, set `motion=1` or push `thermostat=28`) to test thresholds without waiting for a random walk to exceed one. That single parameter is why the hub is testable: you can force-trigger an alert on demand instead of hoping the random number generator cooperates.

**🎯 Expected output:** Five timestamped dict rows, each with `ts`, `source`, `thermostat` (~21±0.5), `humidity` (~43±2), `motion` (0), and the `_unit` columns.

**🩹 If it's off:** If all five thermostats are identical, `random.gauss` isn't being called or `SENSORS` was frozen with the same noise seed — a fresh `Sensors` is fine; a cached `base` means you grabbed `base` instead of `read()`. If timestamps are all equal, `timespec="seconds"` may have truncated them faster than the loop ran — use `timespec="milliseconds"` to see the spread. If `force` never changes output, you passed `force` before the sensor loop so its overrides were clobbered — apply `force` *after* the loop, as written.

**✅ Checklist**

- ✅ Five distinct rows, thermostats jittering around 21.4, humidity around 43.
- ✅ `motion` is 0 and has `unit` `bool`; the `force` hatch overrides on demand.
- ✅ Timestamps differ per tick at millisecond precision.

**🤔 Socratic Question(s)**

- The `force` hatch is deliberately separate from the read loop. If you'd merged an override *into* `Sensor.read()`, what testing superpower would you lose — and what's the risk after you've bought it (a test that passes because it injected `thermostat=28` while a real run never exceeds 24)?
- Time is recorded UTC, not local. Why does a hub *insist* on UTC even in a single-room demo — and at what point does a local-time column become a correctness bug (daylight savings, a room in another timezone, a CDN-analysed chart)?

## Step 2: Aggregate into a normalized log

Sensors don't agree on column layout; the hub's job is to make one *normalized* time-series log out of heterogeneous readings. This step turns the raw dicts from Step 1 into a single list of rows with a fixed `(ts, sensor, value, unit)` shape — the form you can later pivot, alert on, and chart. The reshaping is trivial; the discipline (rename to a canonical schema up front) is what stops every later step from re-parsing.

**👟 Starter hint:** Start by writing `normalize(row)` that pivots one wide hub row into one narrow dict per sensor with the fixed `ts, sensor, value, unit` shape, then print a few normalized ticks.

```python
# hub.py (continued)

def normalize(row: dict) -> list[dict]:
    sensor_cols = [s.name for s in SENSORS]          # the numeric reading columns
    out = []
    for name in sensor_cols:
        out.append({
            "ts": row["ts"],
            "sensor": name,
            "value": row[name],
            "unit": row[f"{name}_unit"],
        })
    return out

for row in (sample(force={"thermostat": 21.4}) for _ in range(3)):
    for entry in normalize(row):
        print(f"{entry['ts'][11:]}  {entry['sensor']:<9} {entry['value']:>6} {entry['unit']}")
```

`normalize` is a classic *long-vs-wide* pivot: the wide hub row (`thermostat`, `humidity`, `motion` as columns) becomes one *narrow* row per sensor (`sensor`, `value`, `unit`). This is the canonical time-series "long" format — one observation per row — because it's the shape `pandas` pivots, Matplotlib plots, and thresholds evaluate without any per-sensor `if` branching. The `sensor` name column is the foreign key that joins every future operation back to which device produced the reading.

**🎯 Expected output:** Nine lines (3 ticks × 3 sensors), each `HH:MM:SS  sensor  value  unit`, with one row per sensor — thermostats in °C, humidity in %, motion in `bool`.

**🩹 If it's off:** If a `KeyError` names `thermostat_unit`, the wide row was built before the `_unit` column existed — you normalized a dict that never populated units (create the units in `sample`, before `normalize`). If motion appears with a `float` 0.0 instead of `bool`, the unit column said `bool` but the value wasn't coerced — encode motion as `int(motion)` in `sample`. If row *order* feels wrong, sort by `(ts, sensor)` for reproducibility.

**✅ Checklist**

- ✅ Every hub row becomes exactly `len(SENSORS)` normalized entries.
- ✅ The narrow schema is `ts, sensor, value, unit` — one observation per row.
- ✅ No per-sensor `if` is needed to know a row's unit; the `unit` column carries it.

**🤔 Socratic Question(s)**

- Wide-to-long is the "canonicalize once" move. What goes wrong *later* if you skip it and instead keep `thermostat`, `humidity`, `motion` columns and hard-code an `if name == "thermostat"` in your alert logic? Name the future sensor that makes that `if`-chain collapse.
- `normalize` hard-codes `sensor_cols` by iterating `SENSORS`. If a new sensor type is added to the registry, does `normalize` keep working without edits — and why is *that* property (data-driven columns, not hard-coded ones) the real "hub" test?

## Step 3: Threshold alerting

A hub that merely stores is a log; the *hub* part is deciding something happened. Threshold alerting compares each reading against its sensor's safe `low/high` and records an alert row when it falls outside. The `force` hatch from Step 1 makes this *testable* — you trigger an alert deterministically instead of waiting on randomness.

**👟 Starter hint:** Start by writing `ingest(row)` that normalizes the row, looks up each sensor's `low`/`high` from the registry, and appends an `out_of_range` alert when a value falls outside — then force a spike with `sample(force={"thermostat": 29.0})`.

```python
# hub.py (continued)

ALERTS = []

def ingest(row: dict) -> None:
    for entry in normalize(row):
        lo, hi = None, None
        for s in SENSORS:
            if s.name == entry["sensor"]:
                lo, hi = s.low, s.high
                break
        value = entry["value"]
        if (hi is not None and value > hi) or (lo is not None and value < lo):
            ALERTS.append({**entry, "event": "out_of_range"})
            print(f"ALERT {entry['sensor']}: {value}{entry['unit']} outside {lo}-{hi}")

# force a thermometer spike and a normal tick
ingest(sample(force={"thermostat": 29.0}))
ingest(sample())
print("alerts:", len(ALERTS))
```

`ingest` is the read-and-react pipeline: normalize the row, look up that sensor's threshold range, and append an alert (with the `event` tag `out_of_range`) when the value crosses. Because thermostats are safe at `low=15, high=26`, forcing 29.0 trips the alert; the quiet tick after it doesn't. The `{**entry, "event": ...}` spread copies the reading *and* adds the alert marker, so an alert row carries all the same columns plus a reason — exactly what you'd want in a log you later audit.

**🎯 Expected output:** A single `ALERT thermostat: 29.0C outside 15.0-26.0` line for the forced spike, `alerts: 1`, and a silent row for the normal tick.

**🩹 If it's off:** If the forced spike *doesn't* alert, `force` hit the wrong column or `SENSORS`' `high` is `None` — print `make_registry()` and confirm `high=26`. If *every* tick alerts, the threshold lookup is comparing against the wrong sensor (an `s.name == entry["sensor"]` miss defaulting to `None` means "no threshold", so a `None is not None` bug would alert on everything) — verify the match branch resolves. If the quiet tick *also* spiked by luck, that's honest randomness — rerun with a lower noise; the forced-path test is what you assert on.

**✅ Checklist**

- ✅ The forced `thermostat=29.0` triggers exactly one alert with `event="out_of_range"`.
- ✅ A normal tick produces zero alerts.
- ✅ Overflow (value > high) and underflow (value < low) are both covered by the range check.

**🤔 Socratic Question(s)**

- Alerts live in a Python list (`ALERTS`) that dies when the process exits. What's the *persistence* argument for writing every alert to disk immediately, and the *latency* counterargument (a disk write per alert vs batching) when a tiny embedded hub must not block the read loop?
- The alert condition `value > high` treats two sensor readings of a *transient* spike the same as a *sustained* high. What would "debounce" look like (require N consecutive in-range ticks before silence) and why is a raw threshold noisy for motion-style binary sensors?

## Step 4: Persist history and alert trail

A live hub is only useful while you watch it; a *storage* layer makes it a historical record you can re-analyze after the fact. This step appends every tick's normalized rows to `history.csv` and every alert to `alerts.csv`, framing CSV as the honest no-database choice for a small timeseries.

**👟 Starter hint:** Start by writing `append_rows(path, rows)` that writes the header once (`if not path.exists()`) and then appends with `csv.DictWriter` in `"a"` mode, then wire it into `run_ticks(n)`.

```python
# hub.py (continued)
import csv
from pathlib import Path

HIST = Path("history.csv")
ALERT_LOG = Path("alerts.csv")

def append_rows(path: Path, rows: list[dict]) -> None:
    if not rows:
        return
    if not path.exists():
        path.write_text(",".join(rows[0].keys()) + "\n")   # header once
    with path.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writerows(rows)

def run_ticks(n: int) -> None:
    for _ in range(n):
        row = sample()
        ingest(row)                       # alerts land on ALERTS + stdout
        append_rows(HIST, normalize(row))
        append_rows(ALERT_LOG, ALERTS)
        ALERTS.clear()

run_ticks(50)
print("history rows:", sum(1 for _ in open(HIST)) - 1)
print("alert rows  :", sum(1 for _ in open(ALERT_LOG)) - 1 if ALERT_LOG.exists() else 0)
```

`append_rows` writes the header *once* (`if not path.exists()`), then appends with `csv.DictWriter` — the "write once, append forever" pattern that keeps a growing timeseries cheap. `run_ticks(50)` is the whole hub under one roof: sample → ingest (which appends alerts in-process) → persist history and the current alert batch → clear the per-tick buffer. On 50 ticks × 3 sensors you get ~150 history rows and (unless a random walk spiked) 0 alert rows; forcing a spike before it would add alerts to a real `alerts.csv`.

**🎯 Expected output:** `history.csv` with a header + ~150 rows (~50 ticks × 3 sensors), `alerts.csv` with a header + however many alerts ran; the count lines print row counts.

**🩹 If it's off:** If the header is written on *every* append, `path.exists()` was checked after writing or the file is opened in `w` (truncate) mode — the `if not path.exists()` write must precede the `a`-mode append. If `writerows` raises a `ValueError` on a missing key, the normalized dicts lack one of `fieldnames` — the `sensor`/`value`/`unit` schema drifted from `normalize`; align them. If `alerts.csv` is empty after a forced spike, `append_rows(ALERT_LOG, ALERTS)` ran before the spike was ingested — order the calls `ingest` then `append`.

**✅ Checklist**

- ✅ `history.csv` holds exactly 1 + 3*n ticks rows with a single header.
- ✅ `alerts.csv` has a header line and one row per alert via `force`-testing.
- ✅ Re-running `run_ticks(50)` *appends* rather than truncating the CSVs.

**🤔 Socratic Question(s)**

- The header-once write is the CSV equivalent of a schema migration. If a sensor's column list changes *mid-file* (say a fourth sensor is added), what happens to the existing rows' columns — and which CSV `DictWriter` behavior masks or exposes that drift?
- CSV is append-friendly but has no transactions — a crash between `writerows` for history and for alerts leaves the two files out of sync. For a hub that must tolerate power loss, what's the *atomic* alternative (write both to a temp, rename) that a single-file storage layer provides for free?

## Step 5: Chart the history

Numbers in a CSV are the raw material; the *dashboard* is the product a person actually reads. This step loads `history.csv` into Matplotlib and draws two time-series subplots — temperature and humidity over their thresholds — turning "is the room getting hotter?" into a glance.

**👟 Starter hint:** Start by setting `matplotlib.use("Agg")` first, then write `chart()` to read `history.csv` with `csv.DictReader`, bucket rows by sensor, and plot the thermostat and humidity streams with `axhline` threshold fences before `plt.savefig(out)`.

```python
# hub.py (continued)
import matplotlib
matplotlib.use("Agg")                       # headless: save PNG, no window
import matplotlib.pyplot as plt
import csv

def chart(path: Path = HIST, out: str = "dashboard.png") -> None:
    rows = list(csv.DictReader(open(path)))
    by = {}
    for r in rows:
        by.setdefault(r["sensor"], []).append((r["ts"], float(r["value"])))
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    th = by.get("thermostat", [])
    hu = by.get("humidity", [])
    ax1.plot([t for t, _ in th], [v for _, v in th]  if th else [], marker="o", label="thermostat")
    ax2.plot([t for t, _ in hu], [v for _, v in hu]  if hu else [], marker="o", label="humidity")
    ax1.axhline(26, color="r", ls="--"); ax1.axhline(15, color="r", ls="--")
    ax2.axhline(70, color="r", ls="--"); ax2.axhline(20, color="r", ls="--")
    ax1.set_ylabel("°C"); ax2.set_ylabel("%")
    ax2.set_xlabel("time"); ax2.tick_params(axis="x", rotation=30)
    for ax in (ax1, ax2):
        ax.legend(); ax.grid(alpha=0.3)
    plt.tight_layout(); plt.savefig(out)
    print("wrote", out)

chart()
```

`matplotlib.use("Agg")` forces a headless backend — no display window, just a saved `dashboard.png` — which is what makes this script a *cron-able* report rather than an interactive tool. The code is deliberately explicit (`.setdefault` buckets by sensor; `axhline` draws the safe-range fences; times are raw ISO strings so Matplotlib treats them as labels). The fences are the dashboard's message: readings bouncing that cross the red dashed line are the things a human wants to notice, and 50 simulated ticks below `high` won't cross mostly — but a forced spike would.

**🎯 Expected output:** `dashboard.png` written (saved, no popup) — two subplots: thermostat °C over time with red fences at 15/26, humidity % at 20/70, both jittering around their bases.

**🩹 If it's off:** If `plt.savefig` raises `RuntimeError` about the backend, `Agg` didn't take effect before a figure was created — set it as the *first* matplotlib call (before `pyplot` is used). If the x-axis is empty or rotated oddly, the ISO timestamps render as strings — cast `ts` to `datetime.strptime` or let the string labels stand; for a 50-point jitter chart, string labels are honest. If one subplot is blank, `by.get("sensor")` returned `[]` for a missing sensor — confirm the CSV actually holds a `humidity` column.

**✅ Checklist**

- ✅ `dashboard.png` exists and shows both subplots with clear red thresholds.
- ✅ The chart renders headlessly (`Agg`) — no window blocking a script run.
- ✅ Reading the file back drives the chart, so re-running after more ticks shows the updated trend.

**🤔 Socratic Question(s)**

- `sharex=True` forces the same x-axis across both subplots. When the two sensors' streams have very different dynamics (temperature creeps, motion spikes), what does sharing the axis *hide* about the noisier stream — and when would independent axes tell the honest story better?
- A dashboard show a day of data, and a spike crossing the fence is obvious. What's the *surprising* signal a raw line chart *can't* show but a rolling *mean* (averaging the last N ticks) reveals reliably — and what's the latency cost of smoothing that hides a fast spike?

## ⚠️ Common pitfalls

- **Random sensor ≠ deterministic test.** `random.gauss` makes replays non-reproducible. Assert alerts via the `force` hatch (`sample(force={"thermostat": 29.0})`), never by hoping a random walk crosses a threshold in the first 50 ticks.
- **Wide rows forever.** Keeping `thermostat`, `humidity`, `motion` as columns and `if name == ...` per sensor means adding a sensor means editing the loop. Normalize to `(ts, sensor, value, unit)` once and let data drive the logic.
- **Re-writing the header on every append.** Opening in `w` mode truncates history. Use `a`-append and write the header only when the file doesn't exist yet — the single-header invariant is what keeps later `csv.DictReader` parses consistent.
- **Skipping the headless backend.** A `savefig` that pops a window blocks the loop on a GUI you might not have. `matplotlib.use("Agg")` *first* turns the chart into a side-effect-free file the hub can emit on a schedule.
- **Forgetting `force` order.** Passing `force` into `sample` *before* the sensor loop means the loop clobbers your override. Apply `force` *after* the reads so the injection actually lands.

## What you just built

An honest IoT sensor hub: you modeled three sensor types, emulated them on a configurable tick loop, normalized heterogeneous readings into a unified time-series log, tripped threshold alerts with an injection hatch, persisted history and alerts to CSV, and charted the result with a headless Matplotlib dashboard. The transferable ideas scale past a mock: the `force`-injection pattern is how you make a live system *testable*; wide-to-long normalization is the schema discipline every downstream tool expects; and the "one header, append forever, headless render" habits are the difference between a scratch script and a dashboard a room-monitor can actually rely on.

:::tip[Run a fuller version without any local setup]
[`examples/sensor-hub/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/sensor-hub) in the course repo bundles the hub module, the sensor registry, and a notebook that ticks, ingests, persists, and charts inline (the chart renders as a cell output). Clone it, or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and watch the room warm up on screen.
:::

## Where to go from here

- **Real MQTT (optional):** install `paho-mqtt` and replace the `sample()` sim with a `client.on_message` handler — the hub logic stays the same; only the "source" changes from `sim` to `mqtt`, which is the exact swap the design anticipated.
- **A `dashboard` report on a schedule:** wrap `run_ticks(60)` + `chart()` in a `while True: sleep(60)` loop (or a cron line) so a room-monitor emits a fresh PNG every minute.
- **Anomaly detection (stretch):** instead of hard thresholds, compute a rolling mean/std and alert when a reading drifts `> 3σ` from the recent window — the "surprising" signal from Step 5's Socratic hook.
- **A plugin registry:** turn `make_registry` into a `register(name, reader)` API so new sensor types self-add without editing `SENSORS` — the data-driven-column lesson, promoted to architecture.

## Share your project with the class

Monitored a (simulated) room, caught a forced spike, or wired a chart you like? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓