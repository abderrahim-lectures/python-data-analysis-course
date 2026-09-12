---
title: "Build an Energy Monitor"
description: "Read appliance ratings from CSV, compute daily and monthly energy, price a tiered tariff, audit standby waste, and score a usage scenario."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["cli", "csv", "calculations"]
prerequisites:
  - "Python basics (lists, dictionaries, loops, functions)"
  - "Reading CSV files"
learningObjectives:
  - "Convert watts and hours into kWh per device per day"
  - "Aggregate a monthly total and each device's share"
  - "Price energy with a two-bracket tiered tariff"
  - "Audit standby draw and generate rules-based savings hints"
  - "Compare two usage scenarios and report a savings delta"
---

# ⚡ Build an Energy Monitor

Your electricity bill is a black box: a single number each month and a shrug. This project breaks it open. You'll read real appliance numbers, watts, hours per day, from a CSV, compute energy in the unit utilities actually bill (kWh), rank devices by their share of the total, price a *tiered* tariff (overage costs more), audit what devices burn while just sitting in standby, and score a "what if I use the heater less" scenario in dollars. The math is four arithmetic formulas; the skill is turning scattered ratings into an honest, decision-ready report.

This assumes Python 101, lists, dictionaries, loops, functions, plus comfortable `csv` reading. Nothing here needs pandas. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Load appliance ratings and compute kWh per day and per month for each device.
2. Total the month and rank every device by its share of the bill.
3. Price the total with a two-bracket tiered tariff, over 250 kWh costs more.
4. Audit standby draw and have the code suggest what's worth unplugging.
5. Compare "current" vs. "optimized" usage and report dollars saved.

## Where to run this

**Locally with `uv`** is the recommended path, an energy monitor is a file-in/file-out CLI (CSV in, printed report out), and files belong on your terminal.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work, the notebook at [`examples/energy-monitor/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/energy-monitor/notebook.ipynb) runs the same report on the bundled sample appliances in memory.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/energy-monitor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/energy-monitor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fenergy-monitor%2Fnotebook.ipynb)

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
uv init energy-monitor
cd energy-monitor
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `energy-monitor/` exists with a `pyproject.toml`.
- ✅ `python -c "import csv"` succeeds, no third-party packages.

## Step 1: kWh per device

Energy is billed in **kWh**, kilowatt-hours, the power of a 1000-watt device running for one hour. Appliance stickers give *watts* and your habits give *hours*, so the conversion is `watts / 1000 * hours`. A 1500 W heater on for 3 hours drinks `1.5 × 3 = 4.5 kWh` a day, and you'd never guess that from the sticker alone. This step turns ratings into the one number that matters.

### 1.1 Write the appliance loader and converter

**👟 Starter hint:** Keep the raw CSV columns, then *derive* `kwh_per_day` and `kwh_per_month` in the same loop:

```bash
cat > appliances.csv <<'EOF'
device,device_type,watts,avg_hours_per_day
fridge,kitchen,150,24
tv,living_room,120,5
router,network,10,24
heater,bedroom,1500,3
ps5,gaming,200,2
EOF
```

```python
# energy.py
import csv

def load_appliances(path: str = "appliances.csv") -> list[dict]:
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["watts"] = float(row["watts"])
        row["avg_hours_per_day"] = float(row["avg_hours_per_day"])
        row["kwh_per_day"] = row["watts"] / 1000 * row["avg_hours_per_day"]
        row["kwh_per_month"] = row["kwh_per_day"] * 30
    return rows

if __name__ == "__main__":
    for a in load_appliances():
        print(f"{a['device']:<9} {a['device_type']:<11} {a['watts']:>5.0f} W "
              f"{a['avg_hours_per_day']:>5.1f} h/d  {a['kwh_per_day']:>6.2f} kWh/d "
              f"{a['kwh_per_month']:>7.2f} kWh/mo")
```

`list(csv.DictReader(f))` snapshots all rows at once, the loop that enriches them never re-reads the file. Each derived field is a *pure function of the raw columns* within the same row, added right where the row is born. `30` as a month is a deliberate proxy; explicitly a rounded month, not 31 or fractional, so the numbers are stable and reproducible, an energy auditor says "30-day month" out loud instead of pretending the calendar is uniform.

**🎯 Expected output:**

```
fridge    kitchen       150 W  24.0 h/d    3.60 kWh/d   108.00 kWh/mo
tv        living_room   120 W   5.0 h/d    0.60 kWh/d    18.00 kWh/mo
router    network        10 W  24.0 h/d    0.24 kWh/d     7.20 kWh/mo
heater    bedroom      1500 W   3.0 h/d    4.50 kWh/d   135.00 kWh/mo
ps5       gaming        200 W   2.0 h/d    0.40 kWh/d    12.00 kWh/mo
```

**🩹 If it's off:** If a device prints `0.00 kWh`, `watts` or `avg_hours_per_day` was still a string when divided, `float()` is missing on one of them. If heater shows `1500 W` but `4.50` never right-escaping, a column header typo (`watts` vs `watt`) made `row["watts"]` a fresh string key, print `row.keys()` to compare with the header row.

### 1.2 Verify the conversion

**✅ Checklist**

- ✅ Every derived `kwh_per_day` equals `watts / 1000 × hours` by hand (fridge: `150/1000×24 = 3.6`).
- ✅ `kwh_per_month` is exactly 30× `kwh_per_day`, no plant calendar, no slop.
- ✅ The `float()` enrichment covers both raw numeric columns, so `sum(...)` never concatenates strings.

**🤔 Socratic Question(s)**

- `avg_hours_per_day` for the fridge is 24, always on. What would a *new-freezer* or *old-beer-fridge* difference look like in this model, and what's the second input a real monitor would add instead of one average?
- The heater is 1500 W at sticker. Name a real-world number that's *lower* than sticker on average (it cycles, it's not always on) and one that's *higher* (dimmer-set resistive heat resisting the model). Which direction makes `kwh` overshoot, and which undershoot?

## Step 2: Total and share

A per-device table is a menu; the total and each device's *share* are the story. With `total = sum(...)`, the heater at ~48% jumps out as "half your bill", while the router at below 3% is revealed as negligible. This step prints the ratio that decisions get made on.

### 2.1 Write the share report

**👟 Starter hint:** `sum(a["kwh_per_day"] for a in appliances)` once, then `share = device_kwh / total * 100` inside the print loop:

```python
# report.py
import energy
from pathlib import Path

appliances = energy.load_appliances()
total_day = sum(a["kwh_per_day"] for a in appliances)
total_month = total_day * 30

print(f"{'device':<9} {'type':<11} {'kWh/d':>6} {'kWh/mo':>8} {'share':>6}")
for a in sorted(appliances, key=lambda a: a["kwh_per_day"], reverse=True):
    share = a["kwh_per_day"] / total_day * 100
    print(f"{a['device']:<9} {a['device_type']:<11} {a['kwh_per_day']:>6.2f} "
          f"{a['kwh_per_month']:>8.2f} {share:>5.1f}%")

print(f"\ntotal: {total_day:.2f} kWh/day = {total_month:.2f} kWh/month")
```

`sum(a["kwh_per_day"] for a in appliances)` is a generator, no intermediate list, one pass, and the total *can't* drift from the per-row values because it's computed from the same field. `sorted(..., reverse=True)` reorders strictly for display; the underlying list of dicts is untouched, so Step 3 reuses the same rows. Share is `part / whole × 100`, and the denominator comes from the data, never from a magic constant.

**🎯 Expected output:**

```
device    type        kWh/d   kWh/mo   share
heater    bedroom      4.50   135.00   48.2%
fridge    kitchen      3.60   108.00   38.5%
tv        living_room  0.60    18.00    6.4%
ps5       gaming       0.40    12.00    4.3%
router    network      0.24     7.20    2.6%

total: 9.34 kWh/day = 280.20 kWh/month
```

**🩹 If it's off:** If the order feeds magically ascending, `reverse=True` is missing on `sorted`. If EVERY share shows `100.0%` (each device divided by itself), the loop variable `a` is being used *both* as the row and as `total_day`, the sum expression must be computed before the loop, outside it.

### 2.2 Verify the ranking

**✅ Checklist**

- ✅ Total rows: `9.34 × 30 = 280.20`, consistent with Step 1's rows.
- ✅ Shares sum to 100.0% (the whole either is or is not on the bill; no rounding drift above a tenth).
- ✅ Heater is first and router is last, and the gap looks the way behavior does (thermostat ≠ always-on network gear).

**🤔 Socratic Question(s)**

- Shares are *percent of energy*, not *percent of bill*, the two equal only under a flat tariff. Step 3 introduces a tiered tariff. Which device's share will *shrink* under tiering, and why, the last ~30 kWh get billed at the premium rate, but not every device generated them?
- The total is 280.20 kWh/month, a plausible household number. Where would a *real* home's graph differ from this CSV's (peak vs. night, heating season, EV charging)? What's the first column that would make this model seasonal?

## Step 3: Price a tiered tariff

Utilities rarely bill a flat per-kWh rate: below the bracket, energy is cheap; above it, every extra kWh costs more. This step prices the 280.2 kWh with a **first 250 kWh at $0.20, everything above at $0.35** tariff, and shows the premium the last 30.2 kWh quietly add.

### 3.1 Write the tiered bill calculator

**👟 Starter hint:** `bill_for(kwh)` returns the base cost for `kwh <= 250` and splits above it into two brackets:

```python
# tariff.py
import energy

BASE_RATE = 0.20      # $/kWh for the first 250 kWh
BRACKET = 250         # kWh
HIGH_RATE = 0.35      # $/kWh above the bracket

def bill_for(kwh_month: float) -> float:
    if kwh_month <= BRACKET:
        return kwh_month * BASE_RATE
    base_cost = BRACKET * BASE_RATE
    high_cost = (kwh_month - BRACKET) * HIGH_RATE
    return base_cost + high_cost

if __name__ == "__main__":
    appliances = energy.load_appliances()
    total_month = sum(a["kwh_per_day"] for a in appliances) * 30

    for a in sorted(appliances, key=lambda a: a["kwh_per_day"], reverse=True):
        flat = a["kwh_per_day"] * 30 * BASE_RATE
        print(f"{a['device']:<9} flat-rate cost {flat:>6.2f} $/mo")

    flat_total = total_month * BASE_RATE
    tiered = bill_for(total_month)
    print(f"\nflat rate:  {total_month:.2f} kWh @ ${BASE_RATE:.2f} -> ${flat_total:.2f}")
    print(f"tiered:     first {BRACKET} kWh @ ${BASE_RATE:.2f}, then ${HIGH_RATE:.2f} -> ${tiered:.2f}")
    print(f"tiering premium: ${tiered - flat_total:.2f}")
```

`bill_for` is a two-branch function: under the bracket, one multiplication; over it, the *first 250* is priced at the base rate and the *remainder* at the premium. The constants live at the top of the file, so "change the tariff to 275 kWh" is editing three numbers, not hunting a formula. The demo prints both a per-device flat cost (for the "which device is worth chasing" view) and the premium, which is exactly the $4.53 the rate structure adds to a bill that pricing felt like it should have been flat.

**🎯 Expected output:**

```
heater      flat-rate cost  27.00 $/mo
fridge      flat-rate cost  21.60 $/mo
tv          flat-rate cost   3.60 $/mo
ps5         flat-rate cost   2.40 $/mo
router      flat-rate cost   1.44 $/mo

flat rate:  280.20 kWh @ $0.20 -> $56.04
tiered:     first 250 kWh @ $0.20, then $0.35 -> $60.57
tiering premium: $4.53
```

**🩹 If it's off:** If the tiered bill equals the flat bill, `kwh_month <= BRACKET` is comparing a *decimal against a rounded int* on the wrong side, check `bill_for(280.2)` returns 60.57, not 56.04. If high-usage bills come out *cheaper* than low ones, the `- BRACKET` subtotal is missing, above the bracket you're charging the full month at the premium.

### 3.2 Verify the tariff

**✅ Checklist**

- ✅ `bill_for(280.2) == 250×0.20 + 30.2×0.35 == 60.57` by hand.
- ✅ `bill_for(249.9) == 49.98` and is *cheaper per kWh* than `bill_for(280.2)`, the bracket actually bites.
- ✅ The per-device line still uses the flat rate, honestly labeled, device rank and tariff pricing are separate questions.

**🤔 Socratic Question(s)**

- The premium is $4.53 (8% of the bill) but the bracket's kWh are 10.8% of usage. Why are appliances *below* the bracket still implicitly "on base rate", and what would shift per-device cost lines if you priced each device's *overage share* instead?
- The tariff publishes two thresholds. A real utility has *time-of-use* windows (night cheaper than evening). How would `bill_for` change if price became `price(hour)`, and what does that do to the `avg_hours_per_day` model?

## Step 4: Audit standby waste

Most of a bill isn't devices *on*, it's devices *off but plugged in*: the TV's LED, the heater's electronics, the console waiting for a signal. Standby draw is small per device and enormous in aggregate, and this step's audit finds it: load standby watts, convert to monthly kWh, and *suggest* what's worth unplugging with a threshold rule.

### 4.1 Write the standby audit

**👟 Starter hint:** Standby is `watts/1000 × 24` (a day never stops); the hint list fires only when a device clears a `WASTE_THRESHOLD_KWH`:

```bash
cat > standby.csv <<'EOF'
device,standby_watts
tv,4
heater,20
ps5,7
router,8
EOF
```

```python
# standby.py
import csv

WASTE_THRESHOLD_KWH = 5.0  # monthly alert level

def load_standby(path: str = "standby.csv") -> list[dict]:
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["standby_watts"] = float(row["standby_watts"])
        row["kwh_per_day"] = row["standby_watts"] / 1000 * 24
        row["kwh_per_month"] = row["kwh_per_day"] * 30
    return rows

if __name__ == "__main__":
    standby = load_standby()
    for s in sorted(standby, key=lambda s: s["kwh_per_month"], reverse=True):
        print(f"{s['device']:<9} standby {s['standby_watts']:>5.1f} W  "
              f"waste {s['kwh_per_month']:>6.2f} kWh/mo")

    total_month = sum(s["kwh_per_month"] for s in standby)
    print(f"\ntotal standby waste: {total_month:.2f} kWh/mo")
    print(f"cost at $0.20/kWh: ${total_month * 0.20:.2f}/mo")

    print("\n== savings hints ==")
    for s in standby:
        if s["kwh_per_month"] >= WASTE_THRESHOLD_KWH:
            print(f" - unplug {s['device']} at night "
                  f"(saves {s['kwh_per_month']:.1f} kWh/mo)")
```

Standby's defining trait is the `24`, no hours input, because "off and plugged in" never sleeps. The threshold does the judgment work: a device wasting 5+ kWh/month surfaces as an action verb ("unplug ..."), while the TV at 2.88 kWh stays a footnote rather than nag-genius. The audit report *separates measurement from advice*: the numbers table is raw truth, the hints are a rule that can be tuned to 10 kWh or 1, the same data, a different threshold, a different list.

**🎯 Expected output:**

```
heater    standby  20.0 W  waste  14.40 kWh/mo
router    standby   8.0 W  waste   5.76 kWh/mo
ps5       standby   7.0 W  waste   5.04 kWh/mo
tv        standby   4.0 W  waste   2.88 kWh/mo

total standby waste: 28.08 kWh/mo
cost at $0.20/kWh: $5.62/mo

== savings hints ==
 - unplug heater at night (saves 14.4 kWh/mo)
 - unplug ps5 at night (saves 5.0 kWh/mo)
 - unplug router at night (saves 5.8 kWh/mo)
```

**🩹 If it's off:** If the hints list is empty, `>=` became `>` and the 5.04 kWh ps5 slips under the bar, or `WASTE_THRESHOLD_KWH` is a string from a config, compared wrongly against floats. If a device's standby waste prints in *watts* (`0.20 kWh/mo` for heater), the `/1000` is missing, watts aren't kWh yet.

### 4.2 Verify the audit

**✅ Checklist**

- ✅ Heater leads at 14.4 kWh/mo, TV trails at 2.88, the sort's reverse matches reality.
- ✅ The threshold 5.0 admits exactly 3 of 4 devices; changing it to 6 excludes the ps5 and changes the list, not the math.
- ✅ Total = 28.08 kWh/mo, priced at $5.62, the same flat rate Step 3 used, deliberately.

**🤔 Socratic Question(s)**

- "Unplug the heater at night" is the *rule's* advice, but the heater's standby electronics exist to keep its schedule and safety clock alive. What's the trade-off the $5.62 figure can't see, and what would a cost-benefit column add before you yank the plug?
- The router wastes 5.76 kWh/mo and is arguably *always worth powering* (your house internet depends on it). What's dangerous about letting the audit's threshold be the only voice, and what's the second input (device priority, safety, necessity) a decision-grade tool needs?

## Step 5: Compare usage scenarios

The final skill is *what-if*: "if I cut the heater from 3 to 2 hours and the TV from 5 to 3, what happens to the bill?" A `scenario(hours_map)` function takes the appliances CSV, *overrides* hours for chosen devices, recomputes monthly kWh, and prices both the current and optimized worlds with the same tiered tariff. The output, $14.97 saved, an 18.6% cut, is the whole point of the monitor: energy questions become dollar questions.

### 5.1 Write the scenario comparator

**👟 Starter hint:** `hours_map.get(device, avg_hours_per_day)` falls back to the CSV's hours for anything not in the map:

```python
# scenarios.py
import csv
from tariff import bill_for

def scenario(hours_map: dict) -> float:
    total_kwh = 0.0
    with open("appliances.csv", newline="") as f:
        for a in csv.DictReader(f):
            watts = float(a["watts"])
            hours = hours_map.get(a["device"], float(a["avg_hours_per_day"]))
            total_kwh += watts / 1000 * hours
    return total_kwh * 30

if __name__ == "__main__":
    current = scenario({})
    optimized = scenario({"heater": 2.0, "tv": 3.0})

    print(f"current:    {current:.1f} kWh/mo -> ${bill_for(current):.2f}")
    print(f"optimized:  {optimized:.1f} kWh/mo -> ${bill_for(optimized):.2f}")
    saved_kwh = current - optimized
    print(f"savings:    {saved_kwh:.1f} kWh/mo = ${bill_for(current) - bill_for(optimized):.2f} "
          f"({100 * saved_kwh / current:.1f}% cut)")
```

`scenario({})` sends an empty map → every device keeps CSV hours → that *is* "current", reusing the same function instead of hard-coding 280.2. The override map is additive, not a fork: only `heater` and `tv` change, everything else re-reads its CSV hours, so the model can't forget the fridge. The comparison re-prices *both* worlds through `bill_for`, which is what makes the savings figure tariff-aware: a flattened bill would have "saved" $10.44, under the tier, real dollars are $14.97, because cheap kWh were squeezed out of the overage.

**🎯 Expected output:**

```
current:    280.2 kWh/mo -> $60.57
optimized:  228.0 kWh/mo -> $45.60
savings:    52.2 kWh/mo = $14.97 (18.6% cut)
```

**🩹 If it's off:** If `optimized` equals `current`, the override keys miss the CSV's exact `device` values, `"Heater"` (capital H) never matches `"heater"`, so the fallback swallows it. If the savings percent looks like the *kWh* cut rather than an 18.6%, the print divides `saved_kwh` by `current` correctly already, but check you're dividing the right terms, not `optimized/current`.

### 5.2 Verify the scenario

**✅ Checklist**

- ✅ `optimized(228.0) < current(280.2)` and both flow through the tiered `bill_for` (228 stays under the bracket; 280.2 pays the premium).
- ✅ Savings math: `52.2 kWh` removed → `$60.57 − $45.60 = $14.97`; `52.2/280.2 = 18.6%`.
- ✅ An hypothetical extra map entry (e.g. `{"router": 0}`) merges cleanly, the map is the only knob that changes.

**🤔 Socratic Question(s)**

- The tier bites the exceptions: cutting exactly the *overage* kWh saves $0.35 each, while cutting base-rate kWh saves $0.20. With `optimized = 228 kWh`, has this scenario already *selected* which kWh to cut, and how would an "save the top 52 kWh regardless of device" variant differ in outcome?
- Hours maps make no judgment about *comfort*, "heater at 2 hours" is an un-priced premise. What's the honest way to present a suggestion that saves money but cools the room: print the trade-off as a *pair*, or bury the premise?

## ⚠️ Common pitfalls

- **Watts without the /1000.** kWh is `watts/1000 × hours`. Skipping the kilo- conversion prices a 1500 W heater as 45 kWh/day instead of 4.5, a tenfold phantom on the bill.
- **Dividing a string.** CSV cells arrive as text; `float(...)` before arithmetic or `sum` silently concatenates and NaN's the report. Enrich the row once, at load, not at every consumer.
- **A magic `30` doing double duty.** It multiplies *once* in `load_appliances`. If a second `* 30` sneaks into a report, the month turns into 900 days. Define it once, comment it as "30-day month".
- **Computing totals inside a loop.** `total = sum(...)` recomputed per row is O(n²) and, worse, each row's share divides against a *partial* total. Total once, outside.
- **Case or space drift in device names.** `HeroMap` keyed by a CSV name that differs by a space (`"heater "` vs `"heater"`) silently falls back to default hours, the scenario "can't see" the change. Match exact CSV casing.

## What you just built

An energy monitor that reads like a report a landlord would pay for: watts → kWh, totals + shares, a tariff that bites at the overage, a standby audit with tuneable thresholds, and a scenario knock showing real dollars. The through-line is *derivation discipline*: every number is a pure function of the CSV inputs plus explicit constants (`30`, `0.20`, `250`, `5.0`), two print statements never disagree, and the story, heater is half the bill; standby is $5.62; cutting hours and TV is $14.97, comes from the data, not from a vibe.

:::tip[Run a fuller version without any local setup]
[`examples/energy-monitor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/energy-monitor) in the course repo has the complete scripts plus the sample `appliances.csv` and `standby.csv`. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add **time-of-use pricing**: replace the flat brackets with `price(hour)` ranges and pass an `hours_map` per device *per hour* (day schedule, night schedule), the model becomes seasonal for free.
- Make **`scenario` return dollars**, not kWh: refactor Step 5 to compare `bill_for(scenario(map_a))` against `bill_for(scenario(map_b))` and print *both* the kWh delta and the dollar delta, as a `compare(map_a, map_b)` function.
- Load a **real readings file**: replace `avg_hours_per_day` with actual per-hour energy numbers (from a plug meter or the utility's portal) and let `kwh_per_day` come from the file instead of watts×hours, same report, real data.
- Persist the report: serialise the share table to `monthly_report.csv` and re-load it in a markdown table, the audit becomes an artifact you can attach to the landlord-email thread.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓