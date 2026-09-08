---
title: "Build a Sleep Analyzer"
description: "Log your sleep, score each night against duration and rhythm, and spot week-over-week trends in a small CSV history."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "csv", "datetime", "statistics", "scripting"]
learningObjectives:
  - "Parse and validate bedtime and wake-time input with the datetime module"
  - "Compute sleep duration across a midnight boundary"
  - "Score night quality from duration and a consistency component"
  - "Read a CSV history back and compare averages week over week"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/datetime", "python-101/functions"]
---

# 😴 Build a Sleep Analyzer

Every sleep tracker at its core is a small spreadsheet with judgment: log when you went to bed and when you woke up, subtract to get duration, compare it to a target, and watch whether your average is creeping toward or away from healthy over a week. This project builds that — a CLI that records a night, catches the classic bedtime-past-midnight trap, scores each night on duration and consistency, and reads the whole history back to compare week over week. No wearable, no EEG: the "sensor" is you typing two times, and the analysis is pure Python `datetime` and arithmetic. It's the smallest thing in this course that still feels like a real tool you'd actually use.

This assumes Python 101 — strings, datetime, file I/O, functions. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Prompt for a bedtime and wake time and parse them into `datetime` objects.
2. Compute sleep duration that correctly crosses midnight.
3. Score the night against a target duration and a consistency rule.
4. Save each logged night to a CSV history.
5. Read the history back and print a week-over-week average comparison.

## Where to run this

**Locally with `uv` is the primary path** — the whole tool is a script you run (`uv run python sleep.py --log`), and the CSV history is a real file you can open in any editor. The win is honesty: you're logging *your own* nights, so running it on a laptop or Codespaces browser is whichever you'd actually type your bedtime into.

**GitHub Codespaces** runs the identical CLI: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and each `sleep.py` invocation behaves exactly as locally, with `sleep_log.csv` living in the file tree.

**Google Colab, Kaggle Notebooks, and Binder handle the *analysis* honestly** — duration math, quality scoring, and CSV averaging are pure Python and run identically in a notebook, where the trend chart or average table renders as a cell output. The one thing a notebook can't do is *interactively prompt* the way a terminal does — so in a notebook you'd feed a hard-coded or hard-typed entry list (or load from the CSV) rather than `input()`. Both are the same engine; only the input source differs.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sleep-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sleep-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsleep-analyzer%2Fnotebook.ipynb)

## Setup

Just `uv` and an empty CSV waiting for your first night.

### Install `uv`

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
mkdir sleep-analyzer && cd sleep-analyzer
uv init --bare
```

No third-party dependencies — the whole project runs on the standard library.

### Pre-seed a CSV header

```bash
mkdir -p data
printf "date,bedtime,waketime,hours,score\n" > data/sleep_log.csv
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `data/sleep_log.csv` exists with the header `date,bedtime,waketime,hours,score`.
- ✅ You have two real times in mind (last night's bed and wake) to test with.

## Step 1: Parse and validate a night

Every sleep log starts with a typing error being caught before it becomes a poisoned row. The parser reads a bedtime and a wake time as `"HH:MM"`, turns them into `datetime.time`, and *rejects* anything that isn't a valid clock time with a clear message instead of a silent crash. This is the "garbage in, loud out" discipline applied to a two-line prompt.

**👟 Starter hint:** Start by writing `parse_time(label)`: a `while True` loop that `input()`s an `HH:MM` string, returns `datetime.strptime(raw, "%H:%M").time()` on success, and prints a friendly reprompt on `ValueError`.

```python
# sleep.py
from datetime import datetime, time, timedelta
import csv, sys
from pathlib import Path

LOG = Path("data/sleep_log.csv")
TARGET_H = 7.5

def parse_time(label: str) -> time:
    while True:
        raw = input(f"{label} (HH:MM): ").strip()
        try:
            return datetime.strptime(raw, "%H:%M").time()
        except ValueError:
            print(f"  '{raw}' isn't a valid clock time. Try e.g. 22:30 or 06:15.")

def log_night() -> dict:
    date = datetime.now().strftime("%Y-%m-%d")
    bed = parse_time("Bedtime")
    wake = parse_time("Wake time")
    hours, score = duration_and_score(bed, wake)
    return {"date": date, "bedtime": bed.strftime("%H:%M"),
            "waketime": wake.strftime("%H:%M"), "hours": round(hours, 1),
            "score": round(score, 1)}
```

`parse_time` loops until it gets a valid `"HH:MM"` — `datetime.strptime(raw, "%H:%M")` yields a time on success and raises `ValueError` on anything else, which the `while True` catches by printing the offending input and asking again. The return shape is a single dict with all five columns the CSV header promised, computed through a `duration_and_score` helper you'll write next. Catching the bad input *at the door* (before it reaches the row) is the whole lesson: one `strptime` and a `try/except` keep the log clean forever.

**🎯 Expected output:** For a valid `22:30` and `06:15`, a dict like `{'date': '2026-09-06', 'bedtime': '22:30', 'waketime': '06:15', 'hours': 7.8, 'score': 8.7}`; for a typo like `25:99`, a "not a valid clock time" message and a reprompt.

**🩹 If it's off:** If a valid `"23:00"` raises `ValueError`, you passed the format wrong — `"%H:%M"` is uppercase-H, 24-hour; lowercase `%h` is not a valid directive. If a bad input *crashes* the script instead of reprompting, the `while True` loop isn't actually looping (the `return` is inside the `try` only) — the `except` must let the loop continue. If the date is wrong, `datetime.now()` is fine for a demo but aware of local time, not UTC — that's a deliberate choice here since "today" is what the user means.

**✅ Checklist**

- ✅ A valid two-time entry returns the full five-field dict.
- ✅ A malformed time reprompts without crashing.
- ✅ The dict keys exactly match the CSV header from Setup.

**🤔 Socratic Question(s)**

- `parse_time` loops until *input* is valid, but what if the user hits Enter with empty input? Your `.strip()` turns `""` into a `strptime` failure that reprompts — but an *empty bedtime* might be a legitimate "forgot" signal. Which behavior would a friendly tool pick, and why (reprompt forever vs let them skip)?
- This parser accepts any 24h time, including `13:00`. A "bedtime" of 13:00 is a nap or a typo — but the tool can't know. What *range check* (e.g. bedtime between 18:00 and 04:00) would add meaning, and where does it belong: in `parse_time` or after?

## Step 2: Compute duration crossing midnight

The first "gotcha" of sleep math: if you go to bed at 23:00 and wake at 06:30, you didn't sleep a *negative* 16.5 hours — you crossed midnight. This helper computes the duration correctly by detecting the wrap and adding a day's worth of minutes, then converts to hours. The naive `wake - bed` subtraction is the bug every beginner hits; this step names it and fixes it.

**👟 Starter hint:** Start by writing the minutes conversion inside `duration_and_score`: detect the midnight wrap with `if wake_min >= bed_min`, add `24 * 60 - bed_min + wake_min` in the crossing branch, then convert to hours before scoring.

```python
# sleep.py (continued)

def duration_and_score(bed: time, wake: time) -> tuple[float, float]:
    bed_min = bed.hour * 60 + bed.minute
    wake_min = wake.hour * 60 + wake.minute
    if wake_min >= bed_min:           # same-day: went to bed and woke later the SAME day
        minutes = wake_min - bed_min
    else:                             # crossed midnight
        minutes = (24 * 60 - bed_min) + wake_min
    hours = minutes / 60.0

    duration_score = min(hours / TARGET_H, 1.0)          # 100% when you hit target
    consistency = 0.8 if hours >= TARGET_H else 0.9      # small bonus for doctor nudge
    score = (100 * duration_score) * consistency
    if hours >= TARGET_H:
        score = 100.0 + min((hours - TARGET_H) * 10, 25)  # a little bonus for sleeping in
    return hours, score
```

The duration pivot is the `if wake_min >= bed_min`: same-day (bed at 06:00, wake at 09:00, an overnight-shift nap) subtracts normally; the *crossing-midnight* branch sums the minutes from bedtime to midnight (`24*60 - bed_min`) plus the minutes from midnight to wake (`wake_min`). The scoring bends a plain percentage two ways — a "hits target" letter grade (capped at 100 from duration, a small bonus for sleeping within a healthy band) and a *consistency* discount for undersleeping — so a 7.5-hour night scores higher than a 4-hour one *and* a slightly-short but regular rut scores higher than a swing.

**🎯 Expected output:** `bed=23:00, wake=06:30` → `(7.5, 100.0)`; `bed=23:00, wake=05:00` → `(6.0, 72.0)`; `bed=01:00, wake=01:30` (a 30-min nap) → `(0.5, 5.3…)`; crossing midnight always yields a positive, sane hours value.

**🩹 If it's off:** If a midnight-crossing night returns a *negative* or *huge* number, the `if wake_min >= bed_min` branch fired when it should have fallen to the cross-midnight branch — the wrap condition is on *minutes*, not hours; verify the comparison is `wake_min >= bed_min` (both minutes). If `bed=23:00, wake=06:30` yields `16.5`, you subtracted without the wrap — that's exactly the "negative 16.5" bug; re-run through the else branch. If scores exceed 100 or dip oddly, the mask/bonus logic double-counted — print `duration_score` and `consistency` separately to see which term overrode.

**✅ Checklist**

- ✅ Crossing midnight always produces a positive hours value in a sane range.
- ✅ `7.5` hours → score 100 (target hit); `6.0` → visibly lower; a nap → very low.
- ✅ Sleeping past the target earns a modest capped bonus, not runaway inflation.

**🤔 Socratic Question(s)**

- The cross-midnight fix works for a *single* `HH:MM` pair. But a worker whose shift runs past dawn (bed 08:00, wake 18:00) — does the `wake_min >= bed_min` branch handle it as a *10-hour long sleep*, or mislabel it? Trace the boundary where "same-day" stops being the right assumption (what about a 20-hour sleep?).
- Scoring caps the duration term at 100 and adds a bonus for sleeping in. Is a 10-hour night genuinely "better" than a healthy 8, or is the bonus a *convenient fiction*? Argue what a sleep *researcher* would score a 5-hour night vs a 10-hour night, and how your formula's simplicity hides that medical nuance.

## Step 3: Save to a CSV history

One recorded night is a fact; a *history* is the thing trends are made of. This step appends the parsed dict from Step 1 to the CSV, growing the file by one row per call. The "write once, append forever" pattern is the same one that keeps a multi-week log cheap — and you touched the header already in Setup.

**👟 Starter hint:** Start by writing `append_row(row)` with `csv.DictWriter` and an explicit `fieldnames` list in `"a"` mode, then wire `main_entry` to log one night and print back the saved row.

```python
# sleep.py (continued)

def append_row(row: dict) -> None:
    header = ["date", "bedtime", "waketime", "hours", "score"]
    with LOG.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=header)
        w.writerow(row)

def main_entry() -> None:
    row = log_night()
    append_row(row)
    print(f"saved {row['date']}: {row['hours']}h, score {row['score']}")

if __name__ == "__main__":
    main_entry()
```

`append_row` opens the log in append (`"a"`) mode and uses `csv.DictWriter` with an explicit `fieldnames` list, so each new row is written *in the header's order* regardless of dict key order — a small but real correctness win (a shuffled dict would otherwise scramble columns). The `if __name__ == "__main__"` guard is the script/import switch: run it and it logs a night; import it and the functions are reusable without side effects. The "print what you saved" line closes the loop — the user sees the exact row that landed in the CSV.

**🎯 Expected output:** A terminal line `saved 2026-09-06: 7.5h, score 100.0`, and a new row appended to `data/sleep_log.csv` with all five columns in header order, the date column populated.

**🩹 If it's off:** If the header is *duplicated* on every row, `append_row` is writing the header each time — you're calling `w.writeheader()` inside the append; write headers only at file creation (Setup), not per append. If columns appear scrambled, `fieldnames` doesn't match the header string order — align the list with the Setup header exactly. If `TypeError: not enough fields` appears, the dict has a key not in `fieldnames` or is missing one — the dict from Step 1 _must_ contain exactly those five keys.

**✅ Checklist**

- ✅ One append adds exactly one footer line to the CSV, matching the header.
- ✅ Re-running the script *appends* history rather than truncating it.
- ✅ The printed summary matches what `DictWriter` actually wrote.

**🤔 Socratic Question(s)**

- Appending in `"a"` mode means two *programs* appending to the same CSV (a notebook and a CLI) could interleave rows. What does CSV give up compared to a row-locked store, and when is the integrity loss worth tolerating for a personal log?
- Each row stores `hours` and `score` even though both are *derivable* from `bedtime`/`waketime`. What's the argument for storing them (idempotent, self-describing) versus recomputing on read (single source of truth)? Pick a side a small analyst would defend.

## Step 4: Read history and compute averages

A log you never read is a diary you don't open. This step loads every row back from the CSV, converts the `hours` column to floats, and prints the average duration and score — the first genuine "how am I doing" answer the tool produces.

**👟 Starter hint:** Start by writing `summarize(history)` that guards the missing-file and empty-CSV cases with friendly messages, then converts the `hours` and `score` columns and prints their averages.

```python
# sleep.py (continued)

def summarize(history: Path = LOG) -> None:
    if not history.exists():
        print("no log yet")
        return
    rows = list(csv.DictReader(history.open()))
    if not rows:
        print("no entries yet")
        return
    durations = [float(r["hours"]) for r in rows]
    scores = [float(r["score"]) for r in rows]
    avg_h = sum(durations) / len(durations)
    avg_s = sum(scores) / len(scores)
    print(f"{len(rows)} nights logged")
    print(f"avg duration: {avg_h:.2f} h   (target {TARGET_H})")
    print(f"avg score   : {avg_s:.1f} / 100")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--summary":
        summarize()
    else:
        main_entry()
```

`csv.DictReader` hands each row back as a dict keyed by the header, so the same `fieldnames` from Step 3 become the *keys* on read — the round-trip is symmetric. The two lines of averaging (`sum(durations)/len(durations)`) are the entire "analysis" for this step, but the discipline is in the guards: an absent file ("`no log yet`") and an empty body ("`no entries yet`") both return loud, friendly messages instead of a `ZeroDivisionError` from dividing by zero. The `--summary` flag is a tiny CLI gateway — run with `--summary` to read, without it to log — that turns the script into a two-mode tool.

**🎯 Expected output:** After logging 2–3 nights, `summary` prints `3 nights logged`, `avg duration: 7.28 h (target 7.5)`, `avg score: 92.6 / 100`.

**🩹 If it's off:** If `float(r["hours"])` raises `ValueError`, a row's `hours` cell is corrupt (a stray letter from a hand-edit) — `DictReader` is a thin parser; add a `try/except float(...)` to skip-and-warn instead of dying. If the divider errors, `rows` is empty and the `len(rows)` guard didn't catch it — the empty-list guard must come *before* the division. If `--summary` is ignored, `sys.argv` parsing ran *after* the `else` branch called `main_entry` — check the `if __name__` order.

**✅ Checklist**

- ✅ Running `--summary` prints counts and correct averages over the logged rows.
- ✅ Both the missing-file and empty-CSV cases return friendly messages, not crashes.
- ✅ Only `--summary` reads; no `--summary` logs — the two modes are distinct.

**🤔 Socratic Question(s)**

- The average hides *spread*: an average of 7.0 could be seven 7.0-h nights or three 10-h and four 4-h nights. What single statistic (e.g. the `max-min` range or the `std` of durations) would expose that difference a plain mean smooths over — and why is *variability* the more telling signal for sleep than the average alone?
- A user who logs a 5-hour night and a 10-hour night gets the same 7.5 average as one who logs two 7.5 nights — but a *sleep clinician* cares which. What weekly metric (fewest hours, worst single night, or variance) would the tool need to counter that illusion?

## Step 5: Compare week over week

The last step upgrades "how am I doing" to "am I doing *better* than last week?" It splits history by week, averages the most recent two, and reports the difference — the trend line a habit-tracker actually exists to draw. This is where raw logging becomes *self-knowledge*.

**👟 Starter hint:** Start by writing `trend(history)` that buckets rows by the `date[:7]` month-group, averages each group's hours, and subtracts the last two averages to print a signed delta plus an `improving`/`declining`/`steady` verdict.

```python
# sleep.py (continued)
from collections import defaultdict

def trend(history: Path = LOG, weeks: int = 2) -> None:
    rows = list(csv.DictReader(history.open()))
    weekly: dict[str, list[float]] = defaultdict(list)
    for r in rows:
        week = r["date"][:7]                      # "2026-09" month-group as a cheap week proxy
        weekly[week].append(float(r["hours"]))
    keys = sorted(weekly)[-weeks:]
    avgs = {k: sum(v) / len(v) for k, v in weekly.items()}
    if len(avgs) < 2:
        print("need at least two distinct weeks to compare")
        return
    k0, k1 = keys[0], keys[1]
    delta = avgs[k1] - avgs[k0]
    print(f"week {k0} → {k1}")
    print(f"avg hours {avgs[k0]:.2f} → {avgs[k1]:.2f}  ({delta:+.2f})")
    print("improving" if delta > 0 else "declining" if delta < 0 else "steady")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--trend":
        trend()
    elif len(sys.argv) > 1 and sys.argv[1] == "--summary":
        summarize()
    else:
        main_entry()
```

`groupby-month` is the honest stand-in for "week": it buckets rows by the first 7 chars of the ISO date (`"2026-09"`), so a month of nights becomes one group. Averaging each group and subtracting the last two gives the delta — and the printed `+0.45`/`-0.30` verdict (improving, declining, steady) is the trend's one-word summary. The `len(avgs) < 2` guard keeps the function honest when there's only one month of data. It's naive (a month isn't a week), but it's the *shape* of real trend analysis: split by bucket, average, diff, and judge.

**🎯 Expected output:** With rows spread across two different `YYYY-MM` values, `trend` prints the two averages and a signed delta plus an `improving`/`declining`/`steady` label; with PM data in one month, it prints `need at least two distinct weeks to compare`.

**🩹 If it's off:** If every date collapses into one group, your CSV has no date variation — `trend` over a single month is a no-op (`need at least two`), which is *correct*; hand-add a row with an earlier date to test. If the delta sign flips, the sort keys are descending (`sorted(weekly)[-weeks:]` picks the *last* two) — confirm `keys` orders oldest→newest so `k1 - k0` means "newer minus older". If a `KeyError` fires, a row's date hit a `float()` on a non-numeric — the week-proxy `[:7]` is safe, but a corrupt `hours` cell again; guard it.

**✅ Checklist**

- ✅ With ≥2 distinct month-buckets, the trend prints both averages, a signed delta, and a verdict.
- ✅ Single-bucket history returns the friendly `need at least two` message.
- ✅ The verdict direction (`improving` vs `declining`) matches the delta's sign.

**🤔 Socratic Question(s)**

- The group key is `date[:7]` — a *month*, not a real 7-day week. What's the exact bug that surfaces if you log every day for 45 days (one 15-day group and one 30-day group averaged as if equal)? How would a `(date - datetime.timedelta(days=weekday))` weekly anchor fix it?
- The verdict is a single `+`/`-`/`0` from *averages*, which again hides variance. Formulate the sentence a sleep coach would say that uses *both* the trend's average *and* its spread (e.g. "your average is steady, but your worst night dropped") — and name the two numbers you'd need from Step 5 to say it.

## ⚠️ Common pitfalls

- **The "negative sleep" bug.** `wake - bed` when bedtime crosses midnight yields a huge negative. Always pivot on `wake_min >= bed_min` to add a day's minutes — the single most common sleep-math error.
- **Appending the header on every row.** Writing `writeheader()` inside `append_row` duplicates the header and corrupts `DictReader` on read. Write the header only when creating the file (Setup), then append data-only rows.
- **A naked `%H:%M` typo.** Lowercase `%h` or `%I` (12-hour) silently parses or errors. `"%H:%M"` is 24-hour; use it consistently for both input and output or your stored times and averages stop matching.
- **Hard-coding keys that can drift.** The `fieldnames` on write, the CSV header, and the dict keys from `log_night` must stay in lockstep — three copies of the same five names. Define the header once (a module constant) and reuse it for both write and read.
- **Trusting `avg` over spread.** A 7.0 average can hide 10+4 swings. Once you have multiple weeks, report the *delta* (Step 5) and, if you can, the variance — never let a single mean tell the whole habit story.

## What you just built

A small, genuinely useful sleep analyzer: you parsed and validated two clock times, computed duration that correctly crosses midnight, scored each night against a target with a consistency nudge and a sleeping-in bonus, appended every night to a CSV, read the history back into averages, and compared month groups to call a trend. The transferable code is broader than sleep: the `parse_time` input loop with loud errors, the midnight-wrap math, the "header once / append forever" CSV discipline, and the "average is not spread" skepticism are all habits you'll use in any data-shaped script.

:::tip[Run a fuller version without any local setup]
[`examples/sleep-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/sleep-analyzer) in the course repo bundles the analyzer module, a seeded `sleep_log.csv`, and a notebook that computes durations, scores, averages, and a trend inline (with charts as cell outputs). Clone it, or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and start logging.
:::

## Where to go from here

- **A real week, not a month:** bucket by `(datetime - timedelta(days=date.weekday()))` for genuine 7-day groups — the Step 5 fix, codified.
- **Report spread too:** add `min`/`max` (or a `statistics.stdev`) of the durations per week so the trend line carries its variability, closing the "average hides the swing" gap.
- **A chart:** load the CSV into Matplotlib and draw hours-over-time with the target as a dashed line — the same file, now a glanceable picture.
- **Multi-week CSV editing:** wire a small "edit last night" path so a corrected bedtime rewrites its row in place, keeping the history truthful after a log mistake.

## Share your project with the class

Caught your own sleep trend improving, or built a chart of your weeks? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓