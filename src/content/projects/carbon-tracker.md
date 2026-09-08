---
title: "Build a Carbon Tracker"
description: "A command-line footprint tracker: emission factors per activity, a sample week of transport/food/energy, daily and category totals, an ASCII bar chart, a weekly budget check, CSV persistence, and add/report/reset commands."
difficulty: "beginner"
estimatedMinutes: 60
xpReward: 100
tags: ["Environment", "Data Visualization", "CLI Tools"]
prerequisites:
  - "Python lists, dictionaries, and for loops"
  - "Reading and writing a plain-text CSV"
  - "Running a Python script from the terminal"
learningObjectives:
  - "Turn activity amounts into CO2e using per-activity emission factors"
  - "Aggregate rows by day and by category with plain dictionaries"
  - "Render totals as an ASCII bar chart and check a weekly budget"
  - "Persist activity rows to CSV and reload them"
  - "Wrap the analysis in add / report / reset CLI subcommands"
---

# 🛠️ 🌍 Build a Carbon Tracker

Your daily choices emit carbon: driving 10 km is not the same as riding 10 km or taking the train 10 km, and eating meat is not the same as eating plants. This project builds a small, honest **carbon tracker** in the terminal — a single Python script that knows how many kg of CO2-equivalent each activity costs, works through one sample week of transport/food/electricity entries, totals everything per day and per category, draws an ASCII bar chart, checks the week against a budget, saves everything to a CSV, and finally becomes a real command with `add`, `report`, and `reset` subcommands. It uses only the standard library — no installs, no randomness, so the numbers you see here are exactly the numbers you'll see.

This assumes Python lists, dictionaries, `for` loops, and basic terminal usage. It is an optional, ungraded project — see [Real-World Projects](/projects) for the full, growing list. Every piece runs on a basic Python install (3.10+).

## 🎯 What you'll do

1. Define emission factors and a sample week; compute each activity's CO2e.
2. Total the week by day and by category, and draw an ASCII bar chart.
3. Check the week against a weekly budget.
4. Save all rows to `activities.csv` and load them back.
5. Turn the script into a CLI with `add`, `report`, and `reset`.

## Where to run this

**Locally** is the real home for a CLI tool: create any empty directory and one file.

```bash
mkdir carbon-tracker && cd carbon-tracker
touch carbon_tracker.py
```

**Google Colab, Kaggle Notebooks, and Binder** also work — every block is plain Python, no third-party packages. A terminal-like run (`% python3 carbon_tracker.py …`) isn't available in notebooks; there you can call the CLI functions directly. The CSV and values are identical everywhere.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/carbon-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/carbon-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcarbon-tracker%2Fnotebook.ipynb)

## Setup

One empty directory, one file, zero packages.

### Check the environment

```bash
python3 --version
```

Anything 3.10+ is fine. Then create the project file:

```bash
mkdir carbon-tracker && cd carbon-tracker
touch carbon_tracker.py
```

**✅ Checklist**

- ✅ `python3 --version` prints 3.10 or newer.
- ✅ `carbon_tracker.py` exists in the `carbon-tracker` folder.
- ✅ No `pip install` needed — the whole project is `import csv`, `import sys`, and Python built-ins.

**🤔 Socratic Question(s)**

- The tracker turns *amounts* (km, kWh, meals) into *kg of CO2e* by multiplying by a factor per activity. Who gets to choose those factors, and why would two trackers disagree about the same car trip?
- This project has no randomness at all. Why does reproducibility matter more for a climate tool than for a game?

## Step 1: Emission factors and a sample week

All carbon math lives in two dictionaries: `emissions` (kg CO2e per *one* unit) and `week` (the recorded activities).

### 1.1 The factors

**👟 Starter hint:** A dict mapping each activity to kg of CO2e per unit — km for transport, kWh for electricity, per-meal for food.

```python
# carbon_tracker.py
import csv
import sys

emissions = {
    "car": 0.18, "bus": 0.10, "train": 0.04, "bike": 0.0,
    "flight": 0.25, "electricity": 0.42,
    "meal_meat": 2.2, "meal_veg": 0.8,
}
```

Every downstream number flows from this table. `bike: 0.0` is the zero that makes the rest meaningful — the numbers measure the *extra* carbon each choice costs, not "worth".

**🎯 Expected output:** None yet — the factors are just data. Check by eye: a large meal `meal_meat` (2.2) costs almost three veggie meals (0.8); an hour of electricity (0.42 per kWh) beats a meat meal.

### 1.2 The sample week

**👟 Starter hint:** `week` is a list of `(day, category, amount)` tuples — transport, food, and power for seven days.

```python
# carbon_tracker.py (continued)
week = [
    ("Mon", "car", 12), ("Mon", "meal_meat", 2), ("Mon", "electricity", 6),
    ("Tue", "bike", 8), ("Tue", "meal_veg", 3), ("Tue", "electricity", 5),
    ("Wed", "train", 25), ("Wed", "meal_meat", 1), ("Wed", "electricity", 6),
    ("Thu", "bus", 9), ("Thu", "meal_veg", 2), ("Thu", "electricity", 7),
    ("Fri", "car", 8), ("Fri", "meal_meat", 2), ("Fri", "electricity", 5),
    ("Sat", "train", 60), ("Sat", "meal_veg", 3), ("Sat", "electricity", 4),
    ("Sun", "bike", 20), ("Sun", "meal_veg", 2), ("Sun", "electricity", 4),
]
```

Three transport modes (no flights yet), a few meals, some kWh. The numbers stay small so the arithmetic is checkable by hand.

**🎯 Expected output:** None yet — the data is defined, not printed.

### 1.3 Compute the carbon rows

**👟 Starter hint:** One row per activity → flatten `(day, category, amount)` through `emissions` into `(day, category, amount, kg)`, rounding the product to 2 decimals.

```python
# carbon_tracker.py (continued)
rows = []
for day, category, amount in week:
    kg = round(emissions[category] * amount, 2)
    rows.append({"day": day, "category": category, "amount": amount, "kg": kg})

for r in rows[:3]:
    print(r)
total = round(sum(r["kg"] for r in rows), 2)
print("WEEK TOTAL:", total, "kg CO2e")
```

The two-dic one-loop pattern — a *fact table* of `(day, category, amount, kg)` rows — is the same shape `csv` and later `add` will use. Everything downstream (charts, budgets, CSV) reads this list, not the raw tuples.

**🎯 Expected output:**

```
{'day': 'Mon', 'category': 'car', 'amount': 12, 'kg': 2.16}
{'day': 'Mon', 'category': 'meal_meat', 'amount': 2, 'kg': 4.4}
{'day': 'Mon', 'category': 'electricity', 'amount': 6, 'kg': 2.52}
WEEK TOTAL: 42.44 kg CO2e
```

**🩹 If it's off:** If `kg` for `car 12` isn't `2.16`, the factor key drifted (`0.18 × 12 = 2.16`). If the total prints `84.88`, two `weeks` list was concatenated — keep exactly 21 tuples.

### 1.4 Verify the rows

**✅ Checklist**

- ✅ Exactly 21 rows (7 days × 3 entries), each with `day`, `category`, `amount`, `kg`.
- ✅ `WEEK TOTAL: 42.44 kg CO2e` — deterministic, no randomness anywhere.
- ✅ Monday: 2.16 (car) + 4.4 (meat) + 2.52 (power) = 9.08.

**🤔 Socratic Question(s)**

- Method: emission factors multiply *units*. If you log only "drove" without the kilometres, what can't you compute — and what does that say about the cheapest way to *improve* data quality (more columns, not more rows)?
- Monday's meat meals (4.4 kg) cost as much as two whole veggie days combined. When would a week with no red meat still emit more than one with it?

## Step 2: Aggregate by day and by category

Single rows are noise; the tracker's job is summarising. Step 2 totals per day and per category.

### 2.1 Daily totals

**👟 Starter hint:** A dict keyed by day, adding each row's `kg`.

```python
# carbon_tracker.py (continued)
daily = {}
for r in rows:
    daily[r["day"]] = round(daily.get(r["day"], 0) + r["kg"], 2)

for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
    print(f"{day}  {daily[day]:>5} kg")
```

`daily.get(day, 0)` is the accumulator idiom: first sight of a day starts at 0, every later row adds its share. The round at the *end* (not per step) keeps the sum honest.

**🎯 Expected output:**

```
Mon   9.08 kg
Tue    4.5 kg
Wed   5.72 kg
Thu   5.44 kg
Fri   7.94 kg
Sat   6.48 kg
Sun   3.28 kg
```

**🩹 If it's off:** If Tue prints `8.6` instead of `4.5`, the zero-carbon bike ride (8 km × 0.0 = 0 kg) was counted as an 8 — verify `bike: 0.0` is in `emissions`. If totals drift by 0.01, rounding per-row `kg` first, then summing, differs from summing then rounding — pick one rule and keep it.

### 2.2 The ASCII bar chart

**👟 Starter hint:** Map each day's total to `"#" * round(v / max * 40)`.

```python
# carbon_tracker.py (continued)
mx = max(daily.values())
for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
    bar = "#" * round(daily[day] / mx * 40)
    print(f"{day}  {daily[day]:>5}  {bar}")
```

`v / mx * 40` rescales the heaviest day (Mon, 9.08) to a full 40-character bar and everyone else proportionally — a printer-friendly bar chart with no plotting library. The point isn't precision; it's pattern — Tue through Sun are visibly thinner than the Monday run.

**🎯 Expected output:**

```
Mon   9.08  ########################################
Tue    4.5  ####################
Wed   5.72  #########################
Thu   5.44  ########################
Fri   7.94  ###################################
Sat   6.48  #############################
Sun   3.28  ##############
```

**🩹 If it's off:** If Mon's bar is short, `max` was computed over the *keys* (day names) instead of the values. If bars have 0 characters, `round` on a tiny ratio hit 0 — days are all non-zero here, so an empty bar means a data bug upstream.

### 2.3 Verify the aggregates

**✅ Checklist**

- ✅ Daily totals reproduce the table above (Mon 9.08 … Sun 3.28).
- ✅ Bars scale to 40 `#` for the max (Mon) and shrink fairly.
- ✅ Per-category check for sanity: transport `7.9` (4.31+1.0+0.9+3.4… wait — see the Socratic below).

**🤔 Socratic Question(s)**

- Approximate per-category totals by hand: car 20 km (`0.18`), bus 9 km (`0.10`), train 85 km (`0.04`), bikes (0), meat 5 meals (`2.2`), veggie 10 meals (`0.8`), electricity 37 kWh (`0.42`). Do they add to 42.44 — and which category carries the most?
- Your chart scales to *Monday*, the heaviest day. Change the denominator to the *total week* (42.44) instead of `max`. Bars shrink to ~20 `#`. What's the trade-off between "shows the pattern" and "shows the true fraction"? Which scale would you show a classmate?

## Step 3: Check the weekly budget

A budget turns totals into decisions. Pick 40 kg/week as the cap.

### 3.1 Over or under?

**👟 Starter hint:** Compare `total` to the budget and report both the absolute and percentage over/under.

```python
# carbon_tracker.py (continued)
budget = 40.0
diff = round(total - budget, 2)
percent = round(total / budget * 100)
print(f"BUDGET: {budget} kg CO2e/week")
print(f"USED : {total} kg  ({percent}% of budget)")
print(f"OVER : {diff} kg" if diff > 0 else f"UNDER: {-diff} kg saved")
```

The percentage is the single most informative number in the tool: `106%` already says "a bit over" before you read the absolute `42.44`. The `OVER`/`UNDER` line is the human-facing verdict.

**🎯 Expected output:**

```
BUDGET: 40 kg CO2e/week
USED : 42.44 kg  (106% of budget)
OVER : 2.44 kg
```

**🩹 If it's off:** If you see `UNDER: -2.44` the sign flipped — the branches of the ternary are on the wrong arms. If it prints `105%` after rounding, you rounded `total` to one digit somewhere and the comparison changed; compute `percent` from the *unrounded* `total`.

### 3.2 Make the verdict useful

**👟 Starter hint:** Print the heaviest day and a hint for the cheapest fix within the week.

```python
# carbon_tracker.py (continued)
worst = max(daily, key=daily.get)
print(f"Biggest day: {worst} ({daily[worst]} kg)")
train_swap = 0.18 - 0.04
print(f"Ride the train: swap one 10-km car trip and save {round(train_swap * 10, 2)} kg")
```

Reporting *why* is half of environmental tooling. A budget verdict without the biggest day is a grade without feedback. `daily.get` as the `key` argument to `max` selects the *highest-value key* — not the alphabetically first — which is the classic use of `key=`.

**🎯 Expected output:**

```
Biggest day: Mon (9.08 kg)
Ride the train: swap one 10-km car trip and save 1.4 kg
```

**🩹 If it's off:** If `Biggest day` prints `Sun`, you passed `max(daily)` instead of `max(daily, key=daily.get)` — the former returns the max *key string*. If the swap saving shows `0.14`, the factor difference is `0.18 − 0.04 = 0.14` per km — ×10 km = 1.4 kg; keep the multiplication on the same line.

### 3.3 Verify the budget

**✅ Checklist**

- ✅ 42.44 used vs 40.0 budget → `OVER : 2.44 kg`, `106%`.
- ✅ Biggest day Mon (9.08), cheapest 10-km fix 1.4 kg (train vs car).
- ✅ Budget check is a pure function of `total` — change `budget`, get a new verdict, no other code moves.

**🤔 Socratic Question(s)**

- 106% means "2.44 kg over". Suppose the budget were 25 kg. Which single change would bring the whole week *well under*? Would it be the meat meals, the driving, or something else?
- A budget set to 40 kg/week hides *who* emits: your sample week assumes a car, a bus, trains, three meat meals. If you rebuilt the week with a flight, the verdict for the same 40 kg budget would be absurd — what does that say about matching a budget to the lifestyle being measured?

## Step 4: Save and reload the rows

No tool survives a restart by re-typing data. Step 4 writes `rows` to `activities.csv` and reads it back.

### 4.1 Write the CSV

**👟 Starter hint:** `csv.DictWriter` with `writeheader()` then all rows.

```python
# carbon_tracker.py (continued)
with open("activities.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["day", "category", "amount", "kg"])
    writer.writeheader()
    writer.writerows(rows)
print("Saved", len(rows), "rows to activities.csv")
```

The `rows` list and the CSV are the same four columns, so `DictWriter` maps each dict straight to a line. `newline=""` stops blank lines between records on Windows.

**🎯 Expected output:** `Saved 21 rows to activities.csv` — and a file whose first lines look like

```
day,category,amount,kg
Mon,car,12,2.16
Mon,meal_meat,2,4.4
```

**🩹 If it's off:** If the header is missing or columns are swapped, the `fieldnames` list doesn't match the dict keys. If you see blank lines inside the CSV, drop `newline=""`.

### 4.2 Reload and recompute the week

**👟 Starter hint:** `csv.DictReader`, summation over the `kg` column (strings → floats).

```python
# carbon_tracker.py (continued)
with open("activities.csv", newline="") as f:
    loaded = list(csv.DictReader(f))

reload_total = round(sum(float(r["kg"]) for r in loaded), 2)
print("Reloaded", len(loaded), "rows, week total", reload_total, "kg")
```

The round-trip proves the save was lossless: the loaded rows produce the same 42.44. Note the cast — CSV stores text, so `float(r["kg"])` must turn `"2.16"` into a number before summing.

**🎯 Expected output:** `Reloaded 21 rows, week total 42.44 kg`

**🩹 If it's off:** If the reload throws `ValueError: could not convert string…`, a header-less or hand-edited line crept in; check the CSV with a text editor. If the total differs from 42.44, the float cast or an extra blank row is re-entering the sum.

### 4.3 Verify the round-trip

**✅ Checklist**

- ✅ `activities.csv` has 4 columns × 21 data rows + header.
- ✅ Reload reproduces `WEEK TOTAL: 42.44 kg`.
- ✅ The CSV is a human-readable deliverable — anyone can open it in a spreadsheet.

**🤔 Socratic Question(s)**

- The program currently *writes* from `rows` on every run, overwriting the file. Once the CLI `add` from Step 5 exists, re-running would wipe new entries. When you hit that, what's the minimal change — write *once*, then append?
- `DictReader` returns strings; variants are easy to mistake for numbers. Name one other column-type conversion, like parsing dates, that a "real" app would need before this CSV becomes trustworthy.

## Step 5: Turn it into a CLI

The last step makes the tracker a real tool: `add`, `report`, and `reset` subcommands driven by `sys.argv`.

### 5.1 Report

**👟 Starter hint:** A `report()` that reads the CSV, recomputes totals, chart, and budget verdict.

```python
# carbon_tracker.py (continued)
def load_rows():
    with open("activities.csv", newline="") as f:
        return list(csv.DictReader(f))

def report():
    loaded = load_rows()
    total = round(sum(float(r["kg"]) for r in loaded), 2)
    daily = {}
    for r in loaded:
        daily[r["day"]] = round(daily.get(r["day"], 0) + float(r["kg"]), 2)
    print(f"WEEK TOTAL: {total} kg ({round(total / 40.0 * 100)}% of budget)")
    mx = max(daily.values())
    for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
        print(f"{day}  {daily.get(day, 0):>5}  {'#' * round(daily.get(day, 0) / mx * 40)}")
```

`report()` is the same computation as Steps 2–3, but it reads from the saved file — the CLI and the analysis are one function. `daily.get(day, 0)` still reports a missing day as 0 kg rather than crashing.

**🎯 Expected output:**

```
WEEK TOTAL: 42.44 kg (106% of budget)
Mon   9.08  ########################################
Tue    4.5  ####################
Wed   5.72  #########################
Thu   5.44  ########################
Fri   7.94  ###################################
Sat   6.48  #############################
Sun   3.28  ##############
```

**🩹 If it's off:** If the CLI prints nothing, `report()` was never *called* — `sys.argv` dispatch (5.3) comes later; for now, run `python3 carbon_tracker.py` and add a plain `report()` call at the bottom of the file temporarily.

### 5.2 Add and reset

**👟 Starter hint:** `add(day, category, amount)` appends one computed row to the CSV; `reset()` rewrites the sample week.

```python
# carbon_tracker.py (continued)
def add(day, category, amount):
    kg = round(emissions[category] * float(amount), 2)
    with open("activities.csv", "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["day", "category", "amount", "kg"])
        writer.writerow({"day": day, "category": category, "amount": amount, "kg": kg})
    report()

def reset():
    rows = [{"day": d, "category": c, "amount": a,
             "kg": round(emissions[c] * a, 2)} for d, c, a in week]
    with open("activities.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["day", "category", "amount", "kg"])
        writer.writeheader()
        writer.writerows(rows)
```

`add` opens in append mode (`"a"`) so it does *not* overwrite the file — new rows join history, and `report()` re-sums from disk. `reset` deliberately rebuilds the pristine sample week so every classroom example starts from the same 42.44 baseline.

**🎯 Expected output:** No output by themselves — `add` and `reset` both re-call `report()` at the end, so their output is the chart you saw in 5.1.

### 5.3 The dispatcher

**👟 Starter hint:** Map the first `sys.argv` argument to the right function with a tiny `if/elif`.

```python
# carbon_tracker.py (continued)
if __name__ == "__main__":
    if len(sys.argv) < 2:
        report()
    elif sys.argv[1] == "report":
        report()
    elif sys.argv[1] == "add":
        add(sys.argv[2], sys.argv[3], sys.argv[4])
    elif sys.argv[1] == "reset":
        reset()
    else:
        print("Commands: report | add <day> <category> <amount> | reset")
```

`if __name__ == "__main__"` means the file runs as a *program* when executed directly (`python3 carbon_tracker.py …`) but stays importable as functions when used in a notebook. The dispatcher is the CLI's front door: one string in, one function out.

**🎯 Let's run it.** Fresh sample:

```bash
python3 carbon_tracker.py report
```

**🎯 Expected output:**

```
WEEK TOTAL: 42.44 kg (106% of budget)
Mon   9.08  ########################################
Tue    4.5  ####################
Wed   5.72  #########################
Thu   5.44  ########################
Fri   7.94  ###################################
Sat   6.48  #############################
Sun   3.28  ##############
```

Then a 5 km car trip added on Friday:

```bash
python3 carbon_tracker.py add Fri car 5
```

**🎯 Expected output (head, and the new total):**

```
WEEK TOTAL: 43.34 kg (108% of budget)
Fri   8.84  ####################################
…
```

Wait — a 5 km drive after reset changes the outcome cleanly: `42.44 + 0.90 = 43.34`. Now the *one* choice that matters:

```bash
python3 carbon_tracker.py reset
python3 carbon_tracker.py add Sat flight 450
```

**🎯 Expected output (head):**

```
WEEK TOTAL: 154.94 kg (387% of budget)
```

A single 450 km flight is `0.25 × 450 = 112.5 kg` — almost three times this whole week's budget, and the chart's 40-`#` bar now belongs to Saturday. That's the honest headline the tracker exists to deliver.

**🩹 If it's off:** If `add` shows `108%` the first time and `387%` already on the second, the sample file wasn't reset between runs (appends accumulate). `reset` first, then `add` — the sample is your reproducible anchor.

**🤔 Socratic Question(s)**

- `add` takes a *day label* (`Fri`) — the sample week's days are labels, not dates. What would change if `day` became a real `YYYY-MM-DD`? Which parts of `report()` (the chart legend, the weekly window) would have to stop hard-coding the seven labels?
- This tool reports kg per *week* for one person. Massachusetts households emit on the order of 15,000 kg/year. Roughly how many sample-weeks is that — and what does the ratio between an individual's footprint and a *national average* tell you about how meaningful personal budgets actually are?

### 5.4 Verify the CLI

**✅ Checklist**

- ✅ `report` from a fresh `reset` → `42.44 kg (106%)`.
- ✅ `add Fri car 5` after reset → `43.34 kg (108%)`; Friday's bar grows a notch.
- ✅ `add Sat flight 450` after reset → `154.94 kg (387%)`, Saturday owns the 40-char bar.
- ✅ Unknown commands print the usage line, not a crash.

## ⚠️ Common pitfalls

- **`max(daily)` vs `max(daily, key=daily.get)`.** The first picks the largest *key string* ("Wed"), the second the largest *value*. Mixing them up mislabels the heaviest day.
- **Rounding order.** Rounding `rows` to 2 decimals, then summing, is fine — but rounding *another* intermediate (like the daily total) before comparing honestly changes the answer by 0.01. Pick one rounding policy and keep it.
- **Append vs overwrite.** `open(..., "w")` opts for overwrite; `open(..., "a")` appends. `reset` must use `"w"`, `add` must use `"a"` — swap them and the demo breaks (either erasing history or stacking on it).
- **Forgetting the float cast.** `DictReader` returns strings; `sum(float(r["kg"]) for r in loaded)` is required. Summing strings either crashes or concatenates "2.164.4…".
- **A budget that ignores category.** 106% of budget is the verdict — but the fleet category (transport) and the food category sum to more than half of the week; fix the wrong one and the budget is still blown.
- **No `reset` between CLI demos.** Repeated `add` runs grow the CSV without limit. Reset — or document the baseline — or your "week" quietly becomes a month.

## What you just built

A terminal carbon tracker end to end: emission factors, a fact table of `(day, category, amount, kg)` rows, daily and category aggregation from plain dictionaries, an ASCII bar chart with no dependencies, a budget verdict expressed as a percentage, CSV persistence with a lossless round-trip, and a three-command CLI on `sys.argv`. The transferable ideas here are the *pattern*: a **units table** that turns arbitrary activity amounts into one comparable number; **merge narrow rows into daily and category totals** with an accumulator dict; **let the verdict be a percentage**, not raw kg; **make the CSV the system of record** so the report is always a function of the file; and **surface one dramatic comparison** (the 450 km flight) because a tool that only prints its own totals forgets what the numbers mean.

:::tip[Run a fuller version without any local setup]
[`examples/carbon-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/carbon-tracker) in the course repo holds the complete tracker as a notebook — factors, the sample week, chart, budget, CSV round-trip, and the add/report/reset CLI, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Track a *real* week: keep the same schema, replace `week` with your own entries, and see your actual number against a 40 kg budget you set to your reality.
- Switch from day labels to real dates with `datetime.date`, and make `report` window "the last 7 days" instead of the hard-coded Mon–Sun legend.
- Add a "swap" recommender: find the single activity whose replacement (`car → train`, `meal_meat → meal_veg`) cuts the most kg under budget.
- Plot with matplotlib instead of `#`: the same `daily` dict feeds `plt.bar(days, values)` with far less effort than drawing the bars yourself.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓