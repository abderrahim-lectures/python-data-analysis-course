---
id: habit-streak-visualizer
title: "Build a Habit-Streak Visualizer"
sidebar_label: "Habit-Streak Visualizer"
slug: /projects/habit-streak-visualizer
description: "Track daily habit check-ins locally and render a GitHub-contributions-graph-style calendar heatmap, with pandas and matplotlib — no ML, no API key."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Habit-Streak Visualizer

<ProjectPublishedDate projectId="2027-habit-streak-visualizer" />

<ProjectGreeting />

This project assumes you're comfortable with Python 101 — variables, functions, reading and writing files, basic loops. Some pandas and matplotlib from Data Analysis (`DataFrame`s, `.groupby()`, plotting a simple chart) will make a few steps feel familiar, but nothing here needs anything beyond that: there's no machine learning, no external API, and no dataset to download. You bring your own data, one day at a time.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. **Design** a simple check-in log format (a CSV: date, habit, done) and **build** a CLI to append to it.
2. **Compute** a habit's current streak and longest streak from that log.
3. **Arrange** a range of days into a GitHub-contributions-graph-style grid: seven weekday rows by however many week columns the range needs.
4. **Render** that grid as a matplotlib heatmap, colored by how long a streak was building on each day, using several months of real-looking sample data so the picture actually looks interesting.

## Where to run this

Three reasonable ways to do this project — pick whichever fits your setup:

- **Locally with `uv` (recommended).** This project has zero external dependencies beyond `pandas` and `matplotlib`, no API key, no GPU — about as friction-free as a "real Python project on your own machine" gets. Steps 1–4 below assume this path, and your check-in log lives as a plain CSV file you keep adding to over time.
- **GitHub Codespaces.** Open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) to get a cloud dev environment with Node, Python, and `uv` already installed (see [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — the exact same commands below work from a browser tab, no local install at all.
- **Google Colab, Kaggle Notebooks, or Binder.** A genuinely good fit: nothing here needs a GPU or an API key, and the whole pipeline (load a log, compute streaks, build a grid, render a heatmap) fits comfortably in a few notebook cells against the course's bundled sample data.

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhabit-streak-visualizer%2Fnotebook.ipynb)

  Be honest with yourself about the tradeoff, though: a notebook is a lower-fidelity way to experience this project than a real local `uv` project with its own `checkins.csv` you add to day after day — treat it as a quick way to explore the code, not the primary path.

## Setup

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

Then set up the project:

```bash
uv init habit-streak-visualizer
cd habit-streak-visualizer
uv add pandas matplotlib
```

No API key needed anywhere in this project — everything runs on data that lives entirely on your own machine.

## Step 1: Design the check-in log and a CLI to write it

The log is a plain CSV with three columns: `date`, `habit`, `done`. One row per check-in. A flat file like this — rather than, say, a separate file per habit — means several habits can share one log and still be filtered independently with ordinary pandas boolean indexing later.

```python
# log.py
import csv
from pathlib import Path

COLUMNS = ["date", "habit", "done"]

def ensure_log(path: Path) -> None:
    if not path.exists():
        with path.open("w", newline="") as f:
            csv.writer(f).writerow(COLUMNS)

def append_checkin(path: Path, date: str, habit: str, done: bool) -> None:
    ensure_log(path)
    with path.open("a", newline="") as f:
        csv.writer(f).writerow([date, habit, "y" if done else "n"])
```

A small CLI wraps this with the "did you do it today? y/n" interaction:

```python
# checkin.py
import argparse
import datetime as dt
from pathlib import Path
from log import append_checkin

LOG_PATH = Path(__file__).parent / "checkins.csv"

parser = argparse.ArgumentParser()
parser.add_argument("habit")
parser.add_argument("--date", default=None)
parser.add_argument("--done", choices=["y", "n"], default=None)
args = parser.parse_args()

date = args.date or dt.date.today().isoformat()
answer = args.done or input(f"Did you do '{args.habit}' on {date}? (y/n): ").strip().lower()
append_checkin(LOG_PATH, date, args.habit, answer.startswith("y"))
print(f"Logged: {date} — {args.habit} — {'done' if answer.startswith('y') else 'missed'}")
```

```bash
uv run python checkin.py "Exercise"
```

Run that a handful of times with `--date`/`--done` for different days to build up a little history to test with, before moving on.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Running `checkin.py` twice for the same habit and date, once "y" and once "n", leaves the log with both rows — you'll need to decide (next step) which one wins.</StepChecklistItem>
<StepChecklistItem>Opening `checkins.csv` in a text editor shows exactly three columns, one row per check-in, human-readable.</StepChecklistItem>
<StepChecklistItem>You can log a check-in for a past date with `--date` and `--done`, without the interactive prompt.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

If you log the same habit twice for the same date (once by mistake, once to correct it), should the log keep both rows, overwrite the first, or something else? What would each choice do to a later `.groupby("date")` on this file?

## Step 2: Compute streaks

A streak is a run of *consecutive calendar days* logged as done, with no gap. The important design decision: a day that was never logged at all is treated exactly like a day explicitly logged "n" — both break the streak. That's simpler than adding a third "unknown" state, at the cost of punishing forgetting to log the same as actually skipping the habit.

Reading a sparse log (only the days someone bothered to log) has to become a *dense* day-by-day series before streaks make sense — otherwise a gap in the log looks identical to a genuine break, but you can't tell which day it happened on without a full calendar to check against:

```python
import pandas as pd

df = pd.read_csv("checkins.csv", parse_dates=["date"])
df["done"] = df["done"].astype(str).str.lower().isin(["y", "yes", "true", "1"])
df = df.drop_duplicates(subset=["date", "habit"], keep="last")  # last logged answer wins

habit_df = df[df["habit"] == "Exercise"].set_index("date")["done"]
daily = habit_df.reindex(pd.date_range(df["date"].min(), df["date"].max(), freq="D"), fill_value=False)
```

`reindex` is doing the real work here: it takes a `Series` with only the dates actually present and expands it onto *every* date in the range, filling anything missing with `False`. Now streaks are a plain sequential scan:

```python
def compute_streaks(daily: pd.Series) -> dict:
    longest = 0
    current_run = 0
    for i, done in enumerate(daily):
        current_run = current_run + 1 if done else 0
        longest = max(longest, current_run)
        if i == len(daily) - 1:
            streak_ending_at_last_day = current_run
    return {
        "current_streak": streak_ending_at_last_day,
        "longest_streak": longest,
        "total_done": int(daily.sum()),
        "total_days": len(daily),
    }
```

`current_streak` is the run ending on the *last* day in the series (today, if your log is up to date) — it resets to 0 the moment you check the day after a miss. `longest_streak` is the best run anywhere in the whole history, which can obviously be much bigger, and never shrinks.

:::tip[`current_streak` needs an up-to-date log to mean anything]
If you haven't logged today yet, `daily`'s last day is `False` by default (from the `reindex` fill), so `current_streak` reports 0 even if yesterday extended a real streak. Either log every day before checking your streak, or compute `current_streak` against yesterday instead of "the last row in the series" if you want it to tolerate today not being logged yet.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`daily.index` contains every calendar day between your first and last log entry, with no gaps — `len(daily)` matches that day count exactly.</StepChecklistItem>
<StepChecklistItem>Manually counting a known run of consecutive "y" days in your test log matches what `compute_streaks` reports for `longest_streak`.</StepChecklistItem>
<StepChecklistItem>Logging a "n" (or skipping a day) resets `current_streak` to 0 the next time you compute it.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

Why does `daily = habit_df.reindex(...)` need to happen *before* the streak-counting loop, rather than just looping over `df`'s rows directly? What specifically would go wrong with `longest_streak` if you skipped it?

## Step 3: Lay the days out into a GitHub-style grid

This is the real teaching moment of the project. A GitHub contributions graph is a grid: seven rows (one per weekday) by however many columns a year needs (roughly 52-53), read top-to-bottom then left-to-right. Turning a plain list of dates into that 2D layout takes two pieces of date arithmetic:

**The row** is just the weekday: `date.weekday()` returns 0 for Monday through 6 for Sunday, directly usable as a row index.

**The column** is the tricky part. The tempting shortcut is `date.isocalendar()[1]`, the ISO week number — but ISO week numbers reset to 1 every January. A habit log that spans a year boundary (say, December into January) would have late-December dates and early-January dates land in the *same low week numbers*, scrambling the grid into overlapping columns instead of a clean left-to-right timeline. The fix: pick one fixed anchor date — the Monday on or before the very first logged day — and compute every column as a plain day-offset from that anchor:

```python
import numpy as np

def build_grid(daily: pd.Series):
    dates = daily.index
    anchor = dates[0] - pd.Timedelta(days=dates[0].weekday())  # Monday on/before the first day
    weeks = (dates - anchor).days // 7
    rows = dates.weekday

    num_weeks = int(weeks.max()) + 1
    grid = np.full((7, num_weeks), np.nan)
    for row, week, done in zip(rows, weeks, daily):
        grid[row, week] = 1.0 if done else 0.0

    return grid, dates
```

`(dates - anchor).days // 7` only ever increases — it doesn't care whether the log spans one year or five. Cells that fall outside the actual logged range (because the first logged day isn't necessarily a Monday, or the last isn't necessarily a Sunday) are left as `NaN`, so they can be drawn differently from a genuine "missed" day in the next step.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`grid.shape[0]` is exactly 7 (one row per weekday), regardless of how long the date range is.</StepChecklistItem>
<StepChecklistItem>Feeding `build_grid` a date range that crosses a January 1st does *not* produce two clusters of low week-numbered columns — the columns increase steadily across the boundary.</StepChecklistItem>
<StepChecklistItem>The first and last few cells in the grid (before the first logged day, after the last) are `NaN`, not `0`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

GitHub's own contributions graph starts weeks on Sunday, not Monday. What would you need to change in `build_grid` to match that convention — and would it change which *column* a given date lands in, which *row*, or both?

## Step 4: Render it as a heatmap

Color intensity shouldn't just be binary (done/not done) — a day that's the 15th in a row of a streak should read as visually different from the very first day of a new streak, even though both are "done." Compute intensity as a function of the *current* streak length on each day, capped so it doesn't keep darkening forever:

```python
def streak_intensity(daily: pd.Series, cap: int = 10) -> list[float]:
    values, run = [], 0
    for done in daily:
        run = run + 1 if done else 0
        values.append(min(run, cap) / cap if done else 0.0)
    return values
```

Feed that into `build_grid` in place of the plain 0/1 fill, then render with matplotlib — a single-hue sequential ramp (light to dark blue), not a rainbow, since this is one continuous magnitude, not several categories:

```python
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, ListedColormap

sequential_blue = LinearSegmentedColormap.from_list(
    "habit_blue", ["#eaf2fc", "#9ec5f4", "#3987e5", "#0d366b"]
)

fig, ax = plt.subplots(figsize=(max(6, grid.shape[1] * 0.32), 2.4))
display = np.where(np.isnan(grid), 0.0, grid)
ax.imshow(display, cmap=sequential_blue, vmin=0, vmax=1, aspect="equal")

no_data = np.ma.masked_where(~np.isnan(grid), np.ones_like(grid))
ax.imshow(no_data, cmap=ListedColormap(["#e8e8ea"]), aspect="equal")

ax.set_yticks(range(7))
ax.set_yticklabels(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
fig.savefig("habit_heatmap.png", bbox_inches="tight")
```

The full version — with month labels along the x-axis and gridlines between cells — lives in [`examples/habit-streak-visualizer/heatmap.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/heatmap.py). Run it against the bundled sample data (several months, two habits, real streaks and a real slump) to see the full picture immediately, without logging anything by hand first:

```bash
uv run python visualize.py --habit "Exercise"
```

:::tip[Gray "no data" is not the same as blue "0 intensity"]
Drawing unlogged cells at the palest step of the same blue ramp as a genuine miss would visually claim "this habit existed and you skipped it" for days before you'd even started tracking. Painting them a flat neutral gray, layered on top with a separate `imshow` call and a masked array, keeps "no data" honestly distinct from "data, and the answer was no."
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>The rendered heatmap visibly darkens across a real multi-day streak in your data, rather than every "done" cell looking identical.</StepChecklistItem>
<StepChecklistItem>Cells outside your logged date range render as flat gray, distinguishable at a glance from a pale-blue "missed" day.</StepChecklistItem>
<StepChecklistItem>Running the visualizer against the bundled sample data produces a grid that's recognizably GitHub-contributions-shaped: seven rows, many columns, a clear left-to-right time axis.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

If you tracked two habits and wanted to compare them side by side, would you rather see two separate heatmaps stacked vertically, or one heatmap where each cell encodes *both* habits somehow? What would you lose either way?

## ⚠️ Common pitfalls

- **Off-by-one weekday/date bugs.** `date.weekday()` is 0-indexed starting Monday; `date.isoweekday()` is 1-indexed starting Monday; `date.strftime("%w")` is 0-indexed starting *Sunday*. Mixing these up is the single easiest way to end up with a grid that's subtly shifted by one row.
- **Timezone issues from `datetime.now()`.** If your CLI computes "today" with `datetime.now()` instead of `date.today()`, a check-in logged late at night can land on the wrong calendar day depending on the machine's timezone, especially if you ever run the script from a different timezone (or a cloud notebook, which is very likely UTC). Stick to plain `date` objects for anything that's meant to represent a calendar day rather than a moment in time.
- **Year-boundary bugs in the grid layout**, covered in Step 3 — using `isocalendar()`'s week number directly as a grid column instead of a fixed-anchor day-offset. Test this explicitly with a date range that crosses a January 1st, since it's easy to write code that looks correct against a single year of sample data and only breaks once the range spans two.
- **Forgetting `drop_duplicates(..., keep="last")`** when loading the log — if a habit/date is logged twice (a genuine correction, or an accidental double-run of the CLI), leaving both rows in means a later `.groupby()` or reindex can silently pick whichever happened to come first, not the intended final answer.

## What you just built

A small local tool with two real, separable pieces: a data-persistence layer (append-only CSV, deduplicated on load) and a from-scratch calendar-grid visualization, the kind that's normally hidden behind a library call. Building the grid layout yourself — rather than importing a ready-made "GitHub heatmap" package — is what makes the date arithmetic in Step 3 actually stick: the difference between an ISO week number and a fixed-anchor day-offset is a real bug you'd hit in any project that lays time-series data out on a calendar, not just this one.

:::tip[This same log format scales to more than a heatmap]
Nothing about `checkins.csv` is heatmap-specific — it's just a dated event log. The same file could feed a bar chart of weekly completion rate, a `.groupby(df["date"].dt.month)` monthly summary, or a simple "how many days until I beat my longest streak" countdown. The heatmap is one view onto data that's useful in plenty of other shapes too.
:::

## Where to go from here

- **Multiple habits side by side.** Extend `visualize.py` to render one heatmap per habit, stacked in a single figure with `plt.subplots(nrows=...)`, so you can compare consistency across habits at a glance.
- **A terminal-only ASCII version.** Skip matplotlib entirely and print the grid as colored Unicode blocks (`░▒▓█` or ANSI background colors) directly to the terminal — the exact same grid-layout logic from Step 3, just a different renderer, and a nice way to check your streak without opening an image.
- **Exporting as a shareable image.** `fig.savefig(..., dpi=300)` for a crisp PNG, or wire up a small script that regenerates the heatmap automatically after every `checkin.py` run, so there's always an up-to-date image ready to share.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-habit-streak-visualizer" />

