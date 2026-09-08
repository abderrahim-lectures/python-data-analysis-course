---
title: "Build a Fitness Tracker"
description: "Log workouts and meals, compute training volume and macro percentages, roll your history into pandas, and visualize weight and strength trends over time."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["classes", "pandas", "matplotlib", "data-analysis"]
learningObjectives:
  - "Model exercises and meals as dataclasses with derived properties"
  - "Log full workout sessions and compute total training volume"
  - "Track daily nutrition with macro totals and calorie splits"
  - "Roll a history into pandas and compute a rolling average"
  - "Plot body weight and training volume trends side by side"
prerequisites: ["Python basics (classes, dictionaries, lists)", "pip install pandas matplotlib"]
---

# 🛠️ 💪 Build a Fitness Tracker

A workout log is the simplest data-analysis project there is: you collect numbers every day, and the interesting part is watching them change over time. This project builds that loop from scratch — you'll model exercises and meals as typed dataclasses, log sessions and compute training volume, track macros and calorie percentages, roll everything into a pandas DataFrame, and plot weight and strength trends side by side with matplotlib. No API keys, no credentials, no external services: just your own structured data and a sequence of progressively smarter questions about it.

This assumes Python 101 and basic familiarity with lists and dicts — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Model individual exercises and meals as `@dataclass` types with a `volume` property that computes total weight lifted.
2. Log a full workout session — a list of exercises — and compute total volume and duration.
3. Track a day's meals, sum macro totals, and compute what percentage of calories each macro contributes.
4. Roll your daily history into a pandas `DataFrame` and compute a rolling average.
5. Plot body weight and training volume trends side by side in a two-panel matplotlib figure.

## Where to run this

**Locally with `uv`** is the primary, recommended path — `pandas` and `matplotlib` are both pure Python installs, and any real terminal will render the plots and save the PNGs.

**GitHub Codespaces** works perfectly too: open [the course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run from there. Everything behaves identically.

**Google Colab, Kaggle Notebooks, and Binder are genuinely well-suited for this project** — nothing here depends on system fonts, external binaries, or a local filesystem. The notebook below uses the same synthetic week of data the steps build toward, so `pandas` DataFrames and matplotlib plots render inline with zero setup. This is one of the projects that actually fits the notebook model cleanly, start to finish.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/fitness-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/fitness-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffitness-tracker%2Fnotebook.ipynb)

## Setup

Everything you need is two PyPI libraries — no external binaries, no API keys.

### Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

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

### Set up the project

```bash
uv init fitness-tracker
cd fitness-tracker
uv add pandas matplotlib
```

`pandas` gives you the `DataFrame` — the right structure for tabular, time-series data — and `matplotlib` draws the plots. Everything after this is pure Python plus those two libraries.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `fitness-tracker/` exists with a `pyproject.toml`, and `pandas` and `matplotlib` are installed.

## Step 1: Model exercises and meals as dataclasses

Every exercise has the same shape: a name, a number of sets, reps, weight, and optional duration. A `@dataclass` enforces that shape and gives you a computed `volume` property — the total weight lifted in a set — so you never recompute it by hand.

### 1.1 Define Exercise and Meal

**👟 Starter hint:** Use `@dataclass` with a `@property` for `volume` (sets × reps × weight), and write a human-readable `summary()` method on each class for display.

```python
# fitness_tracker.py
from datetime import date
from dataclasses import dataclass

@dataclass
class Exercise:
    name: str
    sets: int
    reps: int
    weight_kg: float
    duration_min: int = 0

    @property
    def volume(self) -> float:
        """Total weight lifted: sets × reps × weight."""
        return self.sets * self.reps * self.weight_kg

    def summary(self) -> str:
        return f"{self.name}: {self.sets}x{self.reps} @ {self.weight_kg}kg (vol: {self.volume:.0f})"

@dataclass
class Meal:
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

    def summary(self) -> str:
        return f"{self.name}: {self.calories} kcal (P:{self.protein_g}g C:{self.carbs_g}g F:{self.fat_g}g)"

bench = Exercise("Bench Press", sets=4, reps=8, weight_kg=60)
print(bench.summary())
print(f"Volume: {bench.volume:.0f} kg")

chicken = Meal("Grilled Chicken", calories=350, protein_g=40, carbs_g=5, fat_g=10)
print(chicken.summary())
```

`volume` as a `@property` rather than a regular method means you write `bench.volume`, not `bench.volume()` — the call-with-parentheses difference is cosmetic, but the `@property` pattern signals "this is a derived fact about the current state, not a command that does something." The two `summary()` methods are regular methods because they produce a *display string*, which is a service, not a property — the naming distinction keeps the API predictable.

**🎯 Expected output:** Prints `Bench Press: 4x8 @ 60kg (vol: 1920)` followed by `Volume: 1920 kg`, then `Grilled Chicken: 350 kcal (P:40g C:5g F:10g)`.

**🩹 If it's off:** If `volume` prints `0.0` despite nonzero inputs, you're calling it without `()` — it's a property, so parentheses would call the property's getter and *return* the value, but printing the result is fine. The error is `volume = sets * reps * weight` in the class body with no `@property` decorator — check the `@property` line is directly above `def volume`.

### 1.2 Verify the models

**✅ Checklist**

- ✅ `Exercise` and `Meal` instances construct cleanly and `volume` computes the correct product.
- ✅ You can explain why `@property` is the right choice for `volume` and a regular method for `summary()`.

**🤔 Socratic Question(s)**

- If you stored `volume` as a regular attribute (computed in `__post_init__`) instead of a `@property`, what happens when you change `sets` or `weight_kg` after construction — and does that matter for this project?
- `Exercise` has `duration_min: int = 0` with a default, while `name` has no default. Why must `duration_min` come after `name` in the field list, and what Python rule enforces that?

## Step 2: Log workout sessions

An exercise is a single movement; a workout session is a collection of exercises done on a single day. The `WorkoutSession` class wraps that collection and computes the day's total volume and duration — the first two numbers worth tracking over time.

### 2.1 Define WorkoutSession

**👟 Starter hint:** Store exercises in a plain list, and compute `total_volume()` as a sum of each exercise's `volume` property — no need for loops if you use a generator expression.

```python
# fitness_tracker.py (continued)
class WorkoutSession:
    def __init__(self, session_date: str | None = None):
        self.date = session_date or date.today().isoformat()
        self.exercises: list[Exercise] = []

    def add_exercise(self, exercise: Exercise) -> None:
        self.exercises.append(exercise)
        print(f"  + {exercise.summary()}")

    def total_volume(self) -> float:
        return sum(ex.volume for ex in self.exercises)

    def duration(self) -> int:
        return sum(ex.duration_min for ex in self.exercises)

    def display(self) -> str:
        lines = [f"Workout — {self.date}", "-" * 40]
        for ex in self.exercises:
            lines.append(f"  {ex.summary()}")
        lines.append(f"  Total volume: {self.total_volume():.0f} kg")
        lines.append(f"  Total duration: {self.duration()} min")
        return "\n".join(lines)

session = WorkoutSession("2025-01-13")
session.add_exercise(Exercise("Bench Press", 4, 8, 60, 15))
session.add_exercise(Exercise("Overhead Press", 3, 10, 30, 10))
session.add_exercise(Exercise("Lateral Raise", 3, 15, 10, 8))
print(session.display())
```

`session_date or date.today().isoformat()` is a practical default: every session is timestamped, but you can override it to backfill a log from a specific day. `sum(ex.volume for ex in self.exercises)` is a generator expression that avoids building an intermediate list — for three exercises it doesn't matter, but it's the right shape when you have dozens and want the memory overhead to be zero.

**🎯 Expected output:** Prints each exercise as it's added, then a summary showing total volume (`1920 + 900 + 450 = 3270 kg`) and total duration (`15 + 10 + 8 = 33 min`).

**🩹 If it's off:** If `total_volume()` is `0.0` despite real exercises, the exercises were appended to a different list (check you're using `self.exercises`, not a local). If `display()` runs but shows no exercises, `add_exercise` was never called between constructing `session` and calling `display()` — the exercises are added manually, not magically.

### 2.2 Verify the session

**✅ Checklist**

- ✅ `session.total_volume()` returns 3270.0, and `session.duration()` returns 33.
- ✅ The `display()` output includes all three exercises, their individual volumes, and the totals.

**🤔 Socratic Question(s)**

- If you logged the *same* exercise twice (duplicate append), `total_volume()` would double-count it silently. What simple guard could you add inside `add_exercise` to prevent exact duplicates, and when would that guard be *wrong* (i.e., you genuinely want to log the same exercise twice)?
- `duration_min` defaults to `0` for exercises where you only track sets and reps. Should `total_volume()` still count duration as part of a workout's "effort" — and if so, how would you change the calculation?

## Step 3: Track daily nutrition

A workout tells you how much you lifted; nutrition tells you what you're building with. A `DailyLog` collects all the day's meals and computes total calories plus the protein/carbs/fat split — the macro percentage of each calorie source, accounting for the fact that protein and carbs have 4 kcal/g while fat has 9.

### 3.1 Define DailyLog

**👟 Starter hint:** `totals()` sums raw gram amounts across all meals; a new `macro_split()` method converts grams to calories using the 4/4/9 factors, then divides by the total to get percentages.

```python
# fitness_tracker.py (continued)
class DailyLog:
    def __init__(self, log_date: str | None = None):
        self.date = log_date or date.today().isoformat()
        self.meals: list[Meal] = []

    def add_meal(self, meal: Meal) -> None:
        self.meals.append(meal)
        print(f"  + {meal.summary()}")

    def totals(self) -> dict:
        return {
            "calories": sum(m.calories for m in self.meals),
            "protein": sum(m.protein_g for m in self.meals),
            "carbs": sum(m.carbs_g for m in self.meals),
            "fat": sum(m.fat_g for m in self.meals),
        }

    def macro_split(self) -> dict:
        """Percentage of total calories coming from protein, carbs, and fat."""
        grams = self.totals()
        by_macro_cal = {
            "protein": grams["protein"] * 4,
            "carbs":   grams["carbs"]   * 4,
            "fat":     grams["fat"]     * 9,
        }
        total_cal = sum(by_macro_cal.values()) or 1
        return {k: round(v / total_cal * 100, 1) for k, v in by_macro_cal.items()}

    def display(self) -> str:
        t = self.totals()
        s = self.macro_split()
        lines = [f"Daily Log — {self.date}", "-" * 40]
        for m in self.meals:
            lines.append(f"  {m.summary()}")
        lines.append(f"  TOTAL: {t['calories']} kcal  |  P:{t['protein']}g  C:{t['carbs']}g  F:{t['fat']}g")
        lines.append(f"  SPLIT: P:{s['protein']}%  C:{s['carbs']}%  F:{s['fat']}%")
        return "\n".join(lines)

log = DailyLog("2025-01-13")
log.add_meal(Meal("Breakfast Oats", 300, 10, 50, 8))
log.add_meal(Meal("Grilled Chicken", 350, 40, 5, 10))
log.add_meal(Meal("Protein Shake", 120, 25, 5, 1))
print(log.display())
```

The `or 1` in `macro_split` prevents division by zero on an empty log — Python lets you add meals later, so the first call could have no data. The 4/4/9 factors are the standard Atwater factors: protein and carbohydrates each contribute 4 kilocalories per gram, fat contributes 9. Getting those numbers wrong (say, 4/4/4) silently shifts the percentages, so the factors are written explicitly rather than buried in a constant — for three numbers, readability beats abstraction.

**🎯 Expected output:** Prints three meals as they're added, then a total (`770 kcal | P:75g C:60g F:19g`) and a macro split (`P:39.0% C:31.2% F:29.8%`).

**🩹 If it's off:** If macro percentages don't add up to 100%, rounding is slightly off — `round(..., 1)` can produce 99.9 or 100.1 depending on values, which is acceptable. If `totals()` returns all zeros despite meals, `add_meal` was never called — trace back to the `log.add_meal(...)` calls.

### 3.2 Verify the daily log

**✅ Checklist**

- ✅ `log.totals()` returns `calories: 770, protein: 75, carbs: 60, fat: 19`.
- ✅ `log.macro_split()` percentages sum to ~100% and protein is the largest share.

**🤔 Socratic Question(s)**

- If you ate only fat (0g protein, 0g carbs, 100g fat), what would `macro_split` return, and why is that degenerate case worth thinking about before it happens in real data?
- `totals()` recomputes every time it's called. For a `DailyLog` that gets 20 meals added throughout the day, would caching the result be worthwhile — and what `dataclass` or Python feature would make that caching happen automatically?

## Step 4: Roll your history into pandas

Individual days are data; a *week* of days is a trend. This step builds a pandas `DataFrame` from a list of daily summaries — volume, calories, body weight — and adds a rolling average to smooth out day-to-day noise. That rolling average is the first real data-analysis move in the project, and it turns a noisy list of numbers into something you can actually read.

### 4.1 Build a history DataFrame

**👟 Starter hint:** Construct a `DataFrame` from a list of dicts, convert the `date` column to datetime objects, set it as the index, and compute a rolling mean with `df["volume"].rolling(3, min_periods=1).mean()`.

```python
# fitness_tracker.py (continued)
import pandas as pd

def build_history(rows: list[dict]) -> pd.DataFrame:
    """Turn daily {date, volume, calories, weight_kg} dicts into a sorted DataFrame."""
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    df["volume_roll3"] = df["volume"].rolling(3, min_periods=1).mean()
    return df

history = build_history([
    {"date": "2025-01-06", "volume": 3270.0, "calories": 2550, "weight_kg": 82.0},
    {"date": "2025-01-08", "volume": 3420.0, "calories": 2600, "weight_kg": 81.5},
    {"date": "2025-01-10", "volume": 3560.0, "calories": 2500, "weight_kg": 81.0},
    {"date": "2025-01-12", "volume": 3640.0, "calories": 2480, "weight_kg": 80.8},
    {"date": "2025-01-14", "volume": 3780.0, "calories": 2520, "weight_kg": 80.5},
])
print(history[["volume", "volume_roll3", "weight_kg"]])
```

`rolling(3, min_periods=1)` is the important line: it takes a 3-row sliding window and computes the mean, but `min_periods=1` lets the first and second rows have a partial average (window size 1 and 2) instead of `NaN` — so you don't lose the start of your trend to missing data. `sort_index()` ensures the dates are in chronological order before the rolling window moves across them; without it, the rolling average reflects arbitrary input order, not time.

**🎯 Expected output:** Prints a 5-row DataFrame with columns `volume`, `volume_roll3` (the 3-day moving average), and `weight_kg`, sorted by date — `volume_roll3` is close to `volume` for most rows but smoother.

**🩹 If it's off:** If `volume_roll3` contains `NaN` values at the top, `min_periods` is too high (default is the window size, which means the first two rows get `NaN`); confirm `min_periods=1` is in the call. If the index is not sorted by date, `sort_index()` is missing or was removed — the rolling window needs chronological order to be meaningful.

### 4.2 Verify the history

**✅ Checklist**

- ✅ `history` has exactly 5 rows, indexed by date, with `volume_roll3` showing a smoothed trend.
- ✅ `volume_roll3` for the first row equals `volume` for that row (a window of 1 has no smoothing).

**🤔 Socratic Question(s)**

- If you changed `rolling(3)` to `rolling(5)`, what happens to the first four rows' moving average, and when would a larger window be better vs. worse for a short dataset like this one?
- `set_index("date")` makes the date the row identifier. What query would you write in pandas to select only the workouts from the second half of January — and how does that compare to a SQL `WHERE` clause on a date column?

## Step 5: Plot progress over time

A DataFrame is a table; a chart is a picture of the same data that makes trends visible at a glance — weight going down, volume going up, and where the inflection points are. This step builds a two-panel matplotlib figure: a weight trend on the left and a training volume trend on the right.

### 5.1 Build the two-panel plot

**👟 Starter hint:** Use `plt.subplots(1, 2, ...)` to create side-by-side axes, plot each metric on its own axis with `marker="o"` for distinct data points, and save the figure as a PNG.

```python
# fitness_tracker.py (continued)
import matplotlib.pyplot as plt

def plot_progress(history: pd.DataFrame, filepath: str = "fitness_progress.png") -> None:
    """Plot body weight and training volume trends side by side."""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    axes[0].plot(history.index, history["weight_kg"], marker="o", color="#2ecc71")
    axes[0].set_title("Body Weight Trend")
    axes[0].set_ylabel("kg")
    axes[0].tick_params(axis="x", rotation=45)

    axes[1].plot(history.index, history["volume"], marker="o", color="#3498db", label="Daily")
    axes[1].plot(history.index, history["volume_roll3"], marker="s", color="#e74c3c", linestyle="--", label="3-day avg")
    axes[1].set_title("Training Volume")
    axes[1].set_ylabel("Volume (kg)")
    axes[1].legend()
    axes[1].tick_params(axis="x", rotation=45)

    plt.tight_layout()
    plt.savefig(filepath, dpi=150)
    print(f"Chart saved to {filepath}")
    plt.show()

plot_progress(history)
```

Two panels share one `figsize=(12, 5)` so the figure is wide enough for two plots without squishing. `plt.tight_layout()` prevents the two y-axis labels from overlapping — without it, the right plot's `ylabel` often collides with the left plot's ticks. `marker="o"` and `marker="s"` (square) with `linestyle="--"` for the moving average let you distinguish the daily value from its smoothed version even in grayscale, which matters when someone prints the chart.

**🎯 Expected output:** A chart saved to `fitness_progress.png` — left panel shows body weight declining steadily from 82 to 80.5 kg; right panel shows training volume increasing, with the dashed red 3-day average smoothing the upward trend.

**🩹 If it's off:** If the chart shows an empty frame with no data lines, the `history` DataFrame is empty or the column names don't match — confirm `weight_kg` and `volume` exist as column names. If the x-axis labels overlap badly, `rotation=45` is missing from `tick_params`. If the plot window opens but immediately closes in a script, add `plt.show()` at the end (it blocks until you close the window) or save without displaying.

### 5.2 Verify the visualization

**✅ Checklist**

- ✅ `fitness_progress.png` exists and shows two side-by-side panels: weight trending down, volume trending up.
- ✅ The dashed red line (3-day average) is smoother than the solid blue line (daily volume) — you can see the smoothing effect directly.

**🤔 Socratic Question(s)**

- The weight panel has a single line. If you added a second axis (via `ax.twinx()`) to show calories on the right y-axis, how would you interpret a day where weight goes up but calories are low — and would that chart be misleading or useful?
- The volume chart shows daily values and a 3-day average. If a coach asked you to add a *7-day* average on the same plot, how would you compute it, and what's the cost of overlapping too many lines on one chart?

## ⚠️ Common pitfalls

- **Fat has 9 kcal/g, not 4.** Using 4 for all three macros is the single most common fitness-nutrition bug: it underestimates fat calories by more than half, which silently makes the macro split look balanced when it's skewed. The `macro_split` function uses the correct factors (4, 4, 9) — never round them to one constant.
- **Rolling average on unsorted data.** `df.rolling(3).mean()` operates on row order, not time order. If your DataFrame isn't sorted by date, the rolling average mixes future and past values, producing a line that looks plausible but is wrong. Always `sort_index()` before rolling.
- **Dataclass field ordering.** In a `@dataclass`, fields with default values must come after fields without them — `name: str = ""` before `sets: int` is a `SyntaxError`. Python enforces this because positional construction would be ambiguous otherwise.
- **Division by zero in `macro_split`.** An empty `DailyLog` with no meals returns zero for every macro total. `sum(...) or 1` catches this gracefully; without it, the division raises `ZeroDivisionError`, which is technically correct but not user-friendly.
- **`plt.show()` blocking in scripts.** In a `.py` file run from a terminal, `plt.show()` opens a window and blocks until you close it — fine for interactive exploration, but it halts the rest of your script. Save the figure with `plt.savefig()` first so the file exists even if you never close the window.

## What you just built

A working fitness logging application: you model individual exercises and meals with derived properties, aggregate them into sessions and daily logs, compute training volume and macro percentages, roll a multi-week history into a pandas DataFrame, and visualize weight and strength trends in a two-panel chart saved as a PNG. Nothing here is a simulation — the dataclasses are reusable, the pandas operations are the same ones you'd use on a real export from any tracking app, and the plot is the beginning of a real progress dashboard.

:::tip[Run a fuller version without any local setup]
[`examples/fitness-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/fitness-tracker) in the course repo is a runnable notebook version: a complete week of synthetic workout and nutrition data, every class and function from Steps 1–5, and the two-panel plot rendered inline. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Write a **workout streak calculator**: given a list of session dates, compute the current consecutive-day streak and the all-time longest streak — a simple loop that tests your date-handling instincts.
- Add a **WeeklyGoal** class that defines a target number of workouts per week and a calorie budget, compares actual logged data against the goal, and prints a pass/fail summary — the first step from "tracking" to "accountability."
- Compute and plot a **1RM (one-rep max)** using the Epley formula — `weight × (1 + reps / 30)` — for each exercise over time to track strength progression independently of volume.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to making data work for your own goals. 🎓