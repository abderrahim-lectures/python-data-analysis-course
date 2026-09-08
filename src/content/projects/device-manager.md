---
title: "Build a Device Manager"
description: "Track a fleet of connected devices, judge health from heartbeats, roll out firmware, and push remote config."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "json", "datetimes", "file-persistence"]
prerequisites:
  - "Python basics (lists, dictionaries, loops, functions)"
  - "Opening and reading files"
learningObjectives:
  - "Load a device registry from JSON and keep it sorted by device id"
  - "Measure heartbeat age with datetime arithmetic and classify device health"
  - "Detect firmware drift against a latest-version map"
  - "Resolve each device's effective config by layering room overrides"
  - "Print a fleet report and expose it as a CLI"
---

# 📡 Build a Device Manager

A fleet of connected devices is a growing pile of small problems until someone tracks it: sensors report a heartbeat and then go quiet, `cam-01` has been silent for six days, two of your three `temp-hum` sensors are a firmware release behind, and the garage sensor should alert at −5 °C while the rest warn at 28. A device manager turns those scattered facts into a registry you can sort, a health verdict per device, an update queue, a resolved config per device, and a one-screen fleet report — all from JSON and a little `datetime` math, no networking needed.

This assumes Python 101 — lists, dictionaries, loops, functions — plus comfort opening files. Nothing from the Data Analysis module is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Load a device registry from `devices.json`, sorted by id.
2. Classify each device's health from how long ago its last heartbeat was (online / warning / offline).
3. Compare each device's firmware against the latest for its model and build an update queue.
4. Resolve each device's effective configuration by layering room-level overrides onto model defaults.
5. Print a fleet report grouped by room and ship it as a tiny CLI.

## Where to run this

**Locally with `uv`** is the recommended path — a device manager is a file-persistence tool (your own `devices.json`), and that lives on a real filesystem.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work for every step — the notebook at [`examples/device-manager/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.ipynb) runs the same fleet logic on the bundled four-device registry in memory. The honest trade-off: a notebook can't keep a file updated the way a CLI can.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdevice-manager%2Fnotebook.ipynb)

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
uv init device-manager
cd device-manager
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `device-manager/` exists with a `pyproject.toml`.
- ✅ `python -c "import json, datetime"` succeeds — no third-party packages.

## Step 1: Load the device registry

Every decision downstream needs the same starting point: the full, sorted list of devices. A registry is just JSON — one record per device with id, name, room, model, firmware, and last heartbeat — and loading it means opening the file, parsing two views, and deciding on a *stable order* you'll rely on all through the project.

### 1.1 Create `devices.json` and `registry.py`

**👟 Starter hint:** Store the registry, then make `load_devices()` return it `sorted(...)` by device id so every report is deterministic:

```bash
cat > devices.json <<'EOF'
[
  {"id": "th-01", "name": "Living Room Sensor", "room": "living", "model": "temp-hum", "firmware": "1.2.0", "last_seen": "2026-09-06T08:15:00"},
  {"id": "th-02", "name": "Kitchen Sensor", "room": "kitchen", "model": "temp-hum", "firmware": "1.2.0", "last_seen": "2026-09-06T09:00:00"},
  {"id": "cam-01", "name": "Front Door Camera", "room": "entry", "model": "cam-1080", "firmware": "2.0.5", "last_seen": "2026-08-30T22:10:00"},
  {"id": "th-03", "name": "Garage Sensor", "room": "garage", "model": "temp-hum", "firmware": "1.1.9", "last_seen": "2026-09-06T06:40:00"}
]
EOF
```

```python
# registry.py
import json

def load_devices(path: str = "devices.json") -> list[dict]:
    with open(path) as f:
        devices = json.load(f)
    return sorted(devices, key=lambda d: d["id"])

if __name__ == "__main__":
    for d in load_devices():
        print(f"{d['id']:<8} {d['name']:<22} {d['model']:<10} firmware {d['firmware']}  ({d['room']})")
```

```bash
uv run python registry.py
```

`sorted(devices, key=lambda d: d["id"])` is the quiet decision that keeps every later step boring in the good way: `fleet_report` will show `cam-01` before `th-01` *because the loader sorts*, so no other function ever re-implements that rule. The `:<8` / `:<22` format widths are the beginning of every pretty table in this project — a left-aligned column of fixed width.

**🎯 Expected output:**

```
cam-01   Front Door Camera      cam-1080   firmware 2.0.5  (entry)
th-01    Living Room Sensor     temp-hum   firmware 1.2.0  (living)
th-02    Kitchen Sensor         temp-hum   firmware 1.2.0  (kitchen)
th-03    Garage Sensor          temp-hum   firmware 1.1.9  (garage)
```

**🩹 If it's off:** If the order is th-01 before cam-01, the `sorted` is either missing inside `load_devices` or sorting a different field (`key=lambda d: d["id"]`, not `d["name"]`). If `json.decoder.JSONDecodeError` fires, the heredoc wrote malformed JSON — the trailing `]` needs a comma-less last record; `json.load` is merciless with a missing comma.

### 1.2 Verify the registry

**✅ Checklist**

- ✅ `load_devices()` returns four dicts sorted by `id` ascending.
- ✅ Every device has the six keys (`id`, `name`, `room`, `model`, `firmware`, `last_seen`).
- ✅ Re-running the demo prints identical output — JSON preserves the layout, sorting makes it stable.

**🤔 Socratic Question(s)**

- The registry has no `status` field anywhere — health will be *computed* from `last_seen` in Step 2. Why is storing "online" in the JSON a worse idea than always recomputing it from the heartbeat?
- IDs are human-readable (`th-01`) rather than random. When is a human-readable id a footgun (`th-10` sorts before `th-2` lexically — see `sorted` without a key)? What property about string sorting makes ids need padding?

## Step 2: Judge health from heartbeats

The single most useful piece of fleet intelligence is "how long since each device last spoke". `datetime` arithmetic turns a `last_seen` string into an age, and a health verdict is then a small threshold decision: moments → online, under a couple of hours → warning, more than half a day → offline. Same rule set, every device, no field to get out of sync.

### 2.1 Write `health.py`

**👟 Starter hint:** Parse `last_seen` with `datetime.fromisoformat`, subtract from a fixed reference "now", and classify the resulting `timedelta` with a chain of comparisons:

```python
# health.py
from datetime import datetime, timedelta

from registry import load_devices

NOW = datetime.fromisoformat("2026-09-06T09:05:00")

def age_of(device: dict, now: datetime = NOW) -> timedelta:
    return now - datetime.fromisoformat(device["last_seen"])

def health_status(age: timedelta) -> str:
    if age > timedelta(hours=12):
        return "offline"
    if age > timedelta(minutes=30):
        return "warning"
    return "online"

if __name__ == "__main__":
    for d in load_devices():
        age = age_of(d)
        print(f"{d['id']:<8} {health_status(age):<8} age {age}")
```

`NOW` is the honest trick for a system without batteries: real heartbeat code compares against `datetime.now()`, which breaks reproducibility of tests and screenshots. Here `NOW` is a fixed instant, passed in as a default, so the demo output is stable *and* a caller can override it with the live clock. Look at what the boundaries mean to a human: offline isn't "device powered off" — it's literally "nothing heard from this thing for twelve hours", which is the verdict you page someone about.

**🎯 Expected output:**

```
cam-01   offline  age 6 days, 10:55:00
th-01    warning  age 0:50:00
th-02    online   age 0:05:00
th-03    warning  age 2:25:00
```

**🩹 If it's off:** If every age reads `0:00:00`, you passed `datetime.now()` somewhere *after* construction of the default — delete the arg and let `NOW` be used. If timestamps raise `ValueError`, the ISO string contains a `Z` suffix (UTC marker) that `fromisoformat` on this Python version won't take — replace `Z` with `+00:00` before parsing, and treat that as a real-world data-shape gotcha you just leveled up past.

### 2.2 Verify the health check

**✅ Checklist**

- ✅ `cam-01` (6 days 10 h) → offline; `th-03` (2 h 25 m) → warning; `th-02` (5 m) → online.
- ✅ The 30-minute boundary is "warning at more than 30 minutes", not "online until 31" — an *age of exactly* 30:00 is `online`.
- ✅ `health_status` needs no device dict — it takes only the `timedelta`, so any two devices with the same age get the same verdict.

**🤔 Socratic Question(s)**

- Integer thresholds (30 minutes, 12 hours) hard-code a triage policy. What changes in `health_status` if you want "medical freezers page at 10 minutes of silence but cameras page at 2 days" — and does the function's signature say anything about who owns that choice?
- `cam-01` is "offline" at 6 days. If the registry instead *had* a stored `status: "offline"` field (the anti-pattern from Step 1), what's the first thing that happens the moment a monitor backfills a heartbeat but nobody flips the stored field back?

## Step 3: Detect firmware drift

"Out of date" is a comparison: each device's firmware string against the newest version published for *its* model. Version strings aren't numbers, so you compare them properly by splitting on dots and comparing integer tuples — `(1, 2, 0) < (1, 3, 0)` is `True` in every kind of Python that matters, and `"1.2.0" < "1.3.0"` happens to work too, but only until *2.0.0* is next to *11.0.0*.

### 3.1 Write `firmware.py`

**👟 Starter hint:** A `LATEST` map per model, a `version_tuple` splitter, and a `needs_update` predicate that composes them:

```python
# firmware.py
from registry import load_devices

LATEST = {"temp-hum": "1.3.0", "cam-1080": "2.0.5"}

def version_tuple(version: str) -> tuple[int, ...]:
    return tuple(int(part) for part in version.split("."))

def needs_update(device: dict) -> bool:
    target = LATEST[device["model"]]
    return version_tuple(device["firmware"]) < version_tuple(target)

if __name__ == "__main__":
    for d in load_devices():
        target = LATEST[d["model"]]
        flag = f"-> update to {target}" if needs_update(d) else "up to date"
        print(f"{d['id']:<8} {d['model']:<10} {d['firmware']:<8} {flag}")
```

Three of four devices are on `temp-hum`'s old release and one is current — good demo, because the current one proves the comparison isn't just marking everything. The `needs_update` predicate is stateless: no update queue to carry around, no "last update run" to store, just *device → boolean* per the `LATEST` map. Note what this step deliberately doesn't do: it reports what *would* update — actually pushing versions over the wire is firmware OTA territory, and you'll fake the acknowledgment in the report.

**🎯 Expected output:**

```
cam-01   cam-1080   2.0.5    up to date
th-01    temp-hum   1.2.0    -> update to 1.3.0
th-02    temp-hum   1.2.0    -> update to 1.3.0
th-03    temp-hum   1.1.9    -> update to 1.3.0
```

**🩹 If it's off:** If *every* device reports `up to date`, `version_tuple` is probably splitting on something else ("`1.2.0rc1`" splits into four pieces, but the demo uses three-part versions) — check that the int conversion isn't choking on a pre-release marker. If an unknown model raises `KeyError`, that's the *right* reaction (a fleet with firmware info missing is a data problem, not a tolerated one) — but you may still prefer `LATEST.get(model)` returning `None` for devices you genuinely don't track.

### 3.2 Verify firmware drift

**✅ Checklist**

- ✅ `version_tuple("1.2.0") == (1, 2, 0)` and `(1, 2, 0) < (1, 3, 0)` — int tuples, so `2.10` beats `2.9` numerically.
- ✅ `cam-01` reports up to date (its 2.0.5 equals the map's target); three `temp-hum` devices schedule an update to 1.3.0.
- ✅ The demo operates on the sorted `load_devices()` registry, so rows always print in the Step 1 order.

**🤔 Socratic Question(s)**

- `LATEST` is a hard-coded dict in the source. In production it would come from the vendor's API or a manifest. What *contract* does `needs_update` (device, dict only) already satisfy that a version feed just plugs into — i.e., what shape would the vendor's endpoint have to match for nothing else in the code to change?
- `th-03` is on 1.1.9 while its siblings are on 1.2.0 — same model, older release. What causes of "fleet firmware skew" (besides laziness) does a report that shows *model+release* per row help a stakeholder actually see?

## Step 4: Resolve the effective configuration

Config is *layered*: every `temp-hum` defaults to alerting at 28 °C, but the garage one should alert at −5 °C. The pattern is defaults → model defaults → room overrides → per-device overrides (last one wins), and the correct word for the output is the *effective* config — the single dict a device actually runs, after all layers fold in.

### 4.1 Write the resolver

**👟 Starter hint:** Copy the model defaults, then `.update()` them with room-level overrides (and leave room for a device-level pass later):

```python
# config.py
from registry import load_devices

DEFAULTS = {
    "temp-hum": {"poll_rate_s": 60, "alert_threshold_c": 28, "units": "c"},
    "cam-1080": {"recording": False, "motion": True, "retention_days": 7},
}
ROOM_OVERRIDES = {"garage": {"alert_threshold_c": -5}, "entry": {"recording": True}}

def resolve_config(device: dict) -> dict:
    config = dict(DEFAULTS[device["model"]])
    config.update(ROOM_OVERRIDES.get(device["room"], {}))
    return config

if __name__ == "__main__":
    for d in load_devices():
        print(f"{d['id']:<8} {resolve_config(d)}")
```

`dict(DEFAULTS[...])` *copies* the shared model defaults before `.update()` — that copy is the difference between "garage gets −5 while living room stays 28" and "every `temp-hum` silently inherits −5 because they all share one dict in memory". Laying this out as a pipeline (defaults → overrides) rather than writing a `winter` dict and a `summer` dict keeps every device on a *derived* truth: when you change units to `f`, one base layer updates it fleet-wide.

**🎯 Expected output:**

```
cam-01   {'recording': True, 'motion': True, 'retention_days': 7}
th-01    {'poll_rate_s': 60, 'alert_threshold_c': 28, 'units': 'c'}
th-02    {'poll_rate_s': 60, 'alert_threshold_c': 28, 'units': 'c'}
th-03    {'poll_rate_s': 60, 'alert_threshold_c': -5, 'units': 'c'}
```

**🩹 If it's off:** If th-01 also shows `-5`, `resolve_config` is mutating `DEFAULTS[model]` in place (the `.update` happens on the shared dict, not the copy). If the entry camera lost `recording`, an `else` branch is replacing the whole config instead of merging — the guard `ROOM_OVERRIDES.get(device["room"], {})` should be an *empty merge*, never a replace.

### 4.2 Verify config resolution

**✅ Checklist**

- ✅ `th-03` has `alert_threshold_c: -5`; `th-01` and `th-02` keep the 28 default — the garage override touched one device.
- ✅ `cam-01` flips `recording` from the default `False` to `True`; every other `cam-1080` key is unchanged.
- ✅ The defaults dict itself is untouched after the run (each call got a copy).

**🤔 Socratic Question(s)**

- Room overrides resemble a *policy*: "garage freezes". If the same device type is used by two tenants with different needs, your layers would need a per-tenant step. Where in this pipeline does per-tenant belong (before or after the room layer), and how would a merge function order it without contradicting the room override?
- The resolved dict has an `alert_threshold_c` a device might not honor (crufty firmware). What's the difference between the *desired* config and the *applied* config — and which is this function genuinely responsible for?

## Step 5: Fleet report and CLI

All four capabilities are functions; the deliverable is the one screen that shows everything: grouped by room, one line per device with its health, and a summary line. Then the same report gets a one-flag CLI so "what's the fleet doing?" is one command instead of five `__main__` runs.

### 5.1 Write `report.py` and `manage.py`

**👟 Starter hint:** Reuse `age_of`/`health_status` from Step 2, group by room with a sorted room set, count statuses with `collections.Counter`, and let `manage.py --report` print the whole thing:

```python
# report.py
from collections import Counter

from health import NOW, age_of, health_status
from registry import load_devices

def fleet_report(devices: list[dict] | None = None, now=NOW) -> str:
    if devices is None:
        devices = load_devices()
    lines = [f"Fleet report — {len(devices)} devices"]
    statuses = Counter()
    for room in sorted({d["room"] for d in devices}):
        lines.append(f"== {room}")
        for d in devices:
            if d["room"] != room:
                continue
            status = health_status(age_of(d, now))
            statuses[status] += 1
            lines.append(f"  {d['id']:<8} {d['name']:<22} {status}")
    counts = ", ".join(f"{n} {s}" for s, n in sorted(statuses.items()))
    lines.append(f"summary: {counts}")
    return "\n".join(lines)
```

```python
# manage.py
import argparse

from report import fleet_report

def main() -> None:
    parser = argparse.ArgumentParser(description="Manage a fleet of devices.")
    parser.add_argument("--report", action="store_true")
    args = parser.parse_args()
    if args.report:
        print(fleet_report())
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
```

```bash
uv run python manage.py --report
```

The report is *composition over branching*: it only orchestrates functions you already built (`health_status`, `age_of`, `load_devices`), which is why it's ~12 lines. `Counter()` with a string key is the one-new-trick moment — `statuses["offline"] += 1` magically starts at 0 instead of raising, which is the convenient thing `dict` doesn't do. The `action="store_true"` flag keeps the CLI to one verb (`--report`), which is exactly enough for this project and a very deliberate ceiling — real device managers grow into `--update`, `--push-config`, `--add-device`, and your architecture already has the functions they'd call.

**🎯 Expected output:**

```
Fleet report — 4 devices
== entry
  cam-01   Front Door Camera      offline
== garage
  th-03    Garage Sensor          warning
== kitchen
  th-02    Kitchen Sensor         online
== living
  th-01    Living Room Sensor     warning
summary: 1 offline, 1 online, 2 warning
```

**🩹 If it's off:** If the summary says `0 offline`, the `Counter` is being incremented on a *raw boolean* (`statuses[is_offline]`) instead of the status string. If `--report` prints the argparse help instead of the fleet, the `if args.report:` branch is checking something else — confirm it reads `args.report`, the `store_true` attribute.

### 5.2 Verify the fleet report

**✅ Checklist**

- ✅ Rooms appear alphabetically; devices within a room keep `load_devices()` order (id sort).
- ✅ Summary counts sum to 4 and match the per-device lines (1 offline / 1 online / 2 warning).
- ✅ `uv run python manage.py --report` prints the report; no flag prints usage

**🤔 Socratic Question(s)**

- The summary is `sorted(statuses.items())` — an *alphabetical* sort of status names. If you'd rather summarize "1 offline, 2 warning, 1 online" in severity order, what argument to `sorted` (with a tiny helper) fixes that, and is severity order worth the extra two lines?
- `fleet_report` has `devices` and `now` parameters with defaults. Who (a human, a cron job, a test) calls it with a *different* `now`, and what does that parameter say about the part of the report that is a snapshot rather than a live truth?

## ⚠️ Common pitfalls

- **Storing status instead of computing it.** A saved `"online"` field goes stale the moment a heartbeat arrives or dies. Derive health from `last_seen`; never trust a persisted verdict.
- **Sorting by string when a number hides behind a string.** `cam-2` sorts *after* `cam-10` lexically. If IDs ever number past 9, pad (`cam-02`) or sort with an int key — the registry `sorted(... by id)` will silently reorder on you at exactly the wrong time.
- **Timezone-shape surprises.** `2026-09-06T08:15:00Z` (a trailing `Z`) crashes `fromisoformat` on most Pythons. Handle the `Z → +00:00` normalization exactly once, in `age_of`, not at every call site.
- **Mutating the shared defaults dict.** `DEFAULTS[model].update(...)` without a copy makes every device inherit the first override. `dict(DEFAULTS[model])` first, *then* update.
- **Version comparisons done as strings.** `"2.10.0" < "2.9.0"` is `True` lexically and absurd semantically. Tuple-ify versions before comparing — once, in one place, everywhere.

## What you just built

A four-layer device manager: registry (sorted JSON), health (computed from heartbeat age), firmware drift detection, and layered config resolution — all composed into a single `manage.py --report`. The pattern to carry forward is *derive, don't store*: health, update-need, and effective config are all functions of the registry, so the registry never lies about what's current, and each new report or command you add is one more consumer of the same honest, sorted, versioned source.

:::tip[Run a fuller version without any local setup]
[`examples/device-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/device-manager) in the course repo has the complete scripts plus a starter `devices.json`. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a device-level override layer (`PER_DEVICE`) that wins over the room layer — the one-fourths-of-your-rooms-freeze rule, without touching the room defaults.
- Emit a **JSON snapshot** of the fleet report (`manage.py --report --json`) — a machine-readable view of the same letters a human reads.
- Track **config change history**: `resolve_config` gains a `when` and a `who`, and the report gains a `--changes` flag showing the last N actions.
- Simulate **OTA acknowledgments**: `needs_update` returns a target but nothing stores an ack — add `ack_at` to the registry, and fleet report marks "update pending" devices.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓