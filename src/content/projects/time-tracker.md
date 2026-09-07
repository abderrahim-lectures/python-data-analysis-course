---
title: "Build a Time Tracker"
description: "Track time spent on tasks with start-and-stop sessions, manual entries, daily and weekly reports, and a top-tasks summary — all persisted to CSV with the standard library."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "csv", "productivity"]
learningObjectives:
  - Model a time entry and persist entries to CSV
  - "Track a session with start and stop timestamps"
  - Compute durations from two timestamps
  - "Report daily and weekly totals"
  - Summarize time spent by task
prerequisites:
  - "Python basics (functions, lists, dictionaries)"
  - "Comfort with date and datetime basics"
  - "Optional: a little experience running scripts from the terminal"
---

# 🛠️ ⏱️ Build a Time Tracker

Nobody knows where a workday goes until they record it. This project builds a tiny time tracker: start a session, work, stop it, and the minutes land in a CSV; add a missed entry by hand, then pull daily and weekly reports and a "top 3 tasks" summary. It's standard-library only — dataclasses, `csv`, and `datetime` — so you'll learn the load/append/save rhythm and real timestamp math, and end up with a tool for an answer to "where does my time actually go?"

This assumes Python 101 and comfort with `datetime` basics — nothing beyond that is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Model a time entry and persist a list of entries to CSV.
2. Start and stop a session, computing its duration automatically.
3. Add a missed entry by hand and list recent work.
4. Report totals per day and per week.
5. Summarize where time went, by task.

## Where to run this

**Locally with `uv`** is the primary — and honest — path. A time tracker's entire value is *persistence plus your real clock*, both of which need a disk and a `datetime.now()` that means something. Run it on your own machine.

**Google Colab, Kaggle Notebooks, and Binder** run every code cell just fine (pure standard library), and the notebook mirrors each step with a seeded example. The honest caveat: a notebook's ephemeral filesystem and sandboxed clock make it a try-it path — the `.csv` of *your sessions* won't survive, and `datetime.now()` in a notebook is still a real clock if you want it. Use the badges to see the logic, and switch to local `uv` for the tool you trust with your week.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftime-tracker%2Fnotebook.ipynb)

## Setup

Create the project. The tracker uses only the standard library, so there is nothing to install.

```bash
uv init time-tracker
cd time-tracker
```

```bash
uv run python -c "import csv, json; from datetime import datetime; print('ok')"
```

`csv` is your persistence layer — a human-readable `entries.csv` that Excel or any text editor can open. `json` isn't strictly required here, but it appears in the notebook examples for config-like data, and `datetime` is the module that turns two wall-clock moments into "minutes worked".

**✅ Checklist**

- ✅ `uv init time-tracker` created a folder with a `pyproject.toml`.
- ✅ The import check prints `ok` — zero packages added.

## Step 1: Model a time entry and persist it to CSV

Every command in this tool reads and writes the same store. First you need a shape for an entry — a task, a start moment, an optional end moment, and a computed duration — plus a save/load pair around a CSV file.

### 1.1 Create the `Entry` dataclass and CSV store

**👟 Starter hint:** Define an `Entry` dataclass with `id`, `task`, `start`, `end`, `minutes`; then load via `csv.DictReader` and save via `csv.DictWriter` plus `asdict`.

```python
# tracker.py
import csv
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

FILE = "entries.csv"
FIELDS = ["id", "task", "start", "end", "minutes"]

@dataclass
class Entry:
    id: int
    task: str
    start: str        # ISO-like: "2026-09-06 09:15" or "manual"
    end: str = ""
    minutes: int = 0

def load_entries() -> list[Entry]:
    """Load all entries from entries.csv, or [] if the file doesn't exist."""
    if not Path(FILE).exists():
        return []
    with open(FILE, newline="") as f:
        return [Entry(**row) for row in csv.DictReader(f)]

def save_entries(entries: list[Entry]) -> None:
    """Write all entries to entries.csv."""
    with open(FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(asdict(e) for e in entries)

print(load_entries())
```

`csv.DictWriter` with `fieldnames=FIELDS` writes a header row that `csv.DictReader` then maps back onto every future row — so the file itself documents the schema, and `Entry(**row)` reconstructs objects with zero manual string parsing. `asdict(e)` converts each dataclass to a plain dict, which is exactly what `writerows` wants. Storing timestamps as ISO-like strings (`"2026-09-06 09:15"`) keeps the file greppable and sorts lexically by date — chronological order is free until Step 4 needs real parsing.

**🎯 Expected output:** `[]` on a fresh project — an empty entry list, no crash.

**🩹 If it's off:** If `csv.DictReader` returns empty rows, the header row from `writeheader()` is missing so keys don't exist. If `Entry(**row)` raises `TypeError`, a saved row is missing one of the five `FIELDS`. If numbers arrive as strings (`id: "1"`), that's normal for CSV — int conversion can happen at use-site or via an `Entry(**{...cast...})` step.

### 1.2 Verify the store

**✅ Checklist**

- ✅ `uv run python tracker.py` prints `[]` on a fresh run.
- ✅ Saving one `Entry`, then `load_entries()`, round-trips all five fields.
- ✅ You can state what `asdict(e)` does and why `fieldnames` matters.

**🤔 Socratic Question(s)**

- The CSV stores `end` as an empty string for a running session. Why is that a *better* representation than storing a sentinel like `-1` for "still going", and what breaks in Step 4 if a sentinel sneaks in?
- `writerows(asdict(e) for e in entries)` writes every entry, every time. What's the exact scenario where that full-replace approach loses data, and what would you change to append instead?

## Step 2: Start and stop a session

The heart of a time tracker: `start` stamps an entry with the current moment; `stop` finds the running session, stamps its end, and computes the duration.

### 2.1 Write `start_task`, `stop_active`, and `compute_minutes`

**👟 Starter hint:** Track the current time with one `datetime.now()` per stamp, find the running entry by scanning for an empty `end`, and compute minutes as `(end - start) // 60s`.

```python
# tracker.py (continued)
def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")

def next_id(entries: list[Entry]) -> int:
    return max((e.id for e in entries), default=0) + 1

def start_task(entries: list[Entry], task: str) -> None:
    entries.append(Entry(id=next_id(entries), task=task, start=now_str()))
    save_entries(entries)
    print(f"started #{entries[-1].id}: {task} at {entries[-1].start}")

def compute_minutes(start: str, end: str) -> int:
    start_t = datetime.strptime(start, "%Y-%m-%d %H:%M")
    end_t = datetime.strptime(end, "%Y-%m-%d %H:%M")
    return max(0, int((end_t - start_t).total_seconds() // 60))

def stop_active(entries: list[Entry]) -> None:
    for e in reversed(entries):
        if e.end == "":
            e.end = now_str()
            e.minutes = compute_minutes(e.start, e.end)
            save_entries(entries)
            print(f"stopped #{e.id}: {e.task} ({e.minutes} min)")
            return
    print("nothing is running.")

stop_active(load_entries())
```

`now_str()` normalizes the wall clock into the same `"%Y-%m-%d %H:%M"` format Step 1 chose, so start and end stamps always parse back. `stop_active` scans the list *reversed* so it grabs the most recent running session first. The money line is `compute_minutes`: `strptime` parses both stamps into real `datetime` objects, subtracting them yields a `timedelta`, and `.total_seconds() // 60` converts to whole minutes — with `max(0, ...)` as a guard so a clock that was manually moved backward can't produce negative time.

**🎯 Expected output:** On a fresh run `nothing is running.` After `start_task(load_entries(), "Learn dataclasses")` then `stop_active(...)`, a `stopped #1: Learn dataclasses (N min)` line where N is the real elapsed minutes.

**🩹 If it's off:** If `strptime` raises `ValueError`, a stored stamp isn't in `%Y-%m-%d %H:%M` form (months vs month names are the classic mismatch). If stopping reports `0 min` even after real time passed, both stamps came from the same `now_str()` call — each stamp must call it separately. If `reverse` scan stops the wrong session, a completed entry's `end` isn't actually `""`; older sessions need clearing or the loop needs to check the *last* entry first.

### 2.2 Verify start/stop

**✅ Checklist**

- ✅ A start then stop round-trip writes `start`, `end`, and a positive `minutes` to the CSV.
- ✅ Starting two sessions and stopping once leaves exactly one running entry.
- ✅ `stop_active` on a fully-stopped list prints `nothing is running.`

**🤔 Socratic Question(s)**

- `start_task` refuses nothing — you can start a second session while one runs. What would happen to `stop_active`'s scan if a user started two and stopped once, and what rule would you add at `start` time to prevent it?
- The duration uses whole minutes, truncating seconds (`// 60`). When a session is 2 minutes 59 seconds, what does the report claim — and is that a rounding bug or a reasonable design for a human tracker?

## Step 3: Add entries by hand and list them

Sessions get forgotten. This step adds the manual-entry path — `add` lets you log a task and minutes directly, with `start="manual"` — and a `list` view that shows your most recent entries.

### 3.1 Write `add_manual` and `list_entries`

**👟 Starter hint:** Build an `Entry` with `minutes` provided and `start="manual"` (a deliberate marker), and list entries sorted newest-first with a readable one-line format.

```python
# tracker.py (continued)
from datetime import timedelta

def add_manual(entries: list[Entry], task: str, minutes: int) -> None:
    entries.append(Entry(id=next_id(entries), task=task,
                         start="manual", minutes=int(minutes)))
    save_entries(entries)
    print(f"added #{entries[-1].id}: {task} ({minutes} min)")

def list_entries(entries: list[Entry], n: int = 8) -> None:
    recent = sorted(entries, key=lambda e: e.id, reverse=True)[:n]
    for e in recent:
        when = e.start[:10] if e.start != "manual" else "manual"
        marker = f"{e.minutes:>4} min" if e.minutes else "running"
        print(f"#{e.id:>3}  {marker:>7}  {e.task:<24} {when}")

add_manual(load_entries(), "Write tracker docs", 25)
list_entries(load_entries())
```

`start="manual"` is a deliberate sentinel — it marks an entry *without* a real session clock, and Step 4 will branch on it. Storing a plain `minutes` for manual entries is the honest trade: you logged the number directly, so there's no timestamp math to redo. Sorting by `e.id` descending gives newest-first ordering for free (ids are monotonic), and the format column `{e.minutes:>4}` right-aligns the numbers so a mixed list of `running`/`25 min` reads cleanly.

**🎯 Expected output:** `added #1: Write tracker docs (25 min)`, then a `list` output with `25 min` visible and a `manual` marker in the date column.

**🩹 If it's off:** If `int(minutes)` raises on `"25"` vs `25`, the calling code passed a string — cast once at the boundary. If manual entries show `0 min`, the `int` cast ran before the dataclass assignment landed. If the listing isn't newest-first, the `reverse=True` sort key is inverted.

### 3.2 Verify manual entry and listing

**✅ Checklist**

- ✅ `add_manual(...)` persists an entry with `start="manual"` and the right minutes.
- ✅ `list_entries` shows manual and timed sessions in one readable view.
- ✅ Truncating to `n=3` never raises on a 1-entry file.

**🤔 Socratic Question(s)**

- A manual entry has no start/end, yet it shares the `Entry` type. What report logic gets *simpler* because manual entries declare themselves with `"manual"`, and what could still go wrong if you never validated that sentinel?
- `list_entries` shows `running` for minutes==0. Is that marker trustworthy — and when would a legitimate entry also have exactly 0 minutes?

## Step 4: Report daily and weekly totals

Reports turn raw entries into the summary a time audit actually reads: how many minutes this day, this week. The key discipline — skip `"manual"` entries when splitting by date — is taught head-on because real data won't always be tidy.

### 4.1 Write the daily and weekly reports

**👟 Starter hint:** For date-based reports, parse each real `start`, group minutes by date (daily) or by ISO `(year, week)` (weekly); keep manual entries out of both.

```python
# tracker.py (continued)
from collections import defaultdict

def daily_total(entries: list[Entry]) -> dict:
    total = defaultdict(int)
    for e in entries:
        if e.start == "manual":
            continue
        day = datetime.strptime(e.start, "%Y-%m-%d %H:%M").date()
        total[day] += e.minutes
    return dict(total)

def weekly_total(entries: list[Entry]) -> dict:
    total = defaultdict(int)
    for e in entries:
        if e.start == "manual":
            continue
        day = datetime.strptime(e.start, "%Y-%m-%d %H:%M").date()
        y, w, _ = day.isocalendar()
        total[(y, w)] += e.minutes
    return dict(total)

for day, minutes in sorted(daily_total(load_entries()).items()):
    print(day.isoformat(), minutes, "min")
print("---")
for (y, w), minutes in sorted(weekly_total(load_entries()).items()):
    print(f"{y}-W{w:02d}", minutes, "min")
```

The `if e.start == "manual": continue` at the top of both functions is the design: a manual entry's `start` is the sentinel, not a date, so parsing it would raise — skipping it makes the report robust *and* honest (the minutes are still counted elsewhere, in Step 5's task summary). `defaultdict(int)` makes "add minutes to maybe-unseen date" a one-liner instead of a `get` dance. `day.isocalendar()` returns `(ISO-year, ISO-week, weekday)` — grouping on the first two is the standard way to say "this week" across year boundaries.

**🎯 Expected output:** One row per real session date and one per ISO week, minutes summed — with manual entries absent from both tables, and no `ValueError`.

**🩹 If it's off:** If a `Manual` entry crashes the report, the `continue` guard is missing or checking `e.keyword` spelled differently than `"manual"`. If a week's total vanishes on New Year's Eve, `day.isocalendar()`'s `(y, w)` edges don't line up with the calendar year — that's the standard quirk baked into ISO weeks, not a bug. If everything sums into one giant day, `day.isocalendar()` wasn't called and grouping collapsed on the whole `(y, w)` tuple.

### 4.2 Verify the reports

**✅ Checklist**

- ✅ Daily and weekly tables print without crashing, manual entries excluded.
- ✅ Summing a known day's sessions matches what you typed.
- ✅ You can explain `isocalendar()`'s `(year, week)` trip and why "week" is ambiguous.

**🤔 Socratic Question(s)**

- These reports keep manual entries out entirely. Why is hiding them a *worse* choice for a real time audit than showing them under an explicit `(manual)` bucket — and what would you print to make the omission visible?
- A session that starts Monday 23:50 and ends Tuesday 00:40 is split by **start-time into Monday**. Which reports deserve per-minute splitting across days, and why does that only matter at the daily granularity?

## Step 5: Build the top-tasks summary and CLI router

The last feature answers the question that started the project: *where did my time go?* — plus a tiny command router so every function is reachable from the terminal with one word.

### 5.1 Write `summarize` and the `main` router

**👟 Starter hint:** Aggregate minutes by task across all entries (manual included — they're real work), and route `start` / `stop` / `add` / `list` / `daily` / `weekly` / `summary` from `sys.argv`.

```python
# tracker.py (continued)
import sys

def summarize(entries: list[Entry], n: int = 3) -> None:
    by_task = defaultdict(int)
    for e in entries:
        by_task[e.task] += e.minutes
    print("top", n, "tasks by time:")
    for task, minutes in sorted(by_task.items(), key=lambda x: x[1], reverse=True)[:n]:
        print(f"  {minutes:>5} min  {task}")
    print(f"  TOTAL {sum(by_task.values())} min across {len(by_task)} tasks")

def main() -> None:
    args = sys.argv[1:]
    entries = load_entries()
    cmd = args[0] if args else "list"
    if cmd == "start":
        start_task(entries, args[1])
    elif cmd == "stop":
        stop_active(load_entries())
    elif cmd == "add":
        add_manual(entries, args[1], int(args[2]))
    elif cmd == "list":
        list_entries(entries)
    elif cmd == "daily":
        for day, m in sorted(daily_total(entries).items()):
            print(day.isoformat(), m, "min")
    elif cmd == "weekly":
        for (y, w), m in sorted(weekly_total(entries).items()):
            print(f"{y}-W{w:02d}", m, "min")
    elif cmd == "summary":
        summarize(entries)
    else:
        print("commands: start <task> | stop | add <task> <min> | list | daily | weekly | summary")

if __name__ == "__main__":
    main()
```

`summarize` deliberately counts manual entries alongside timed ones — unlike the date reports — because "task took 125 minutes total" is true whether it came from a stopwatch or a note. The router is intentionally thin: each command one line, each reusing the same loaded `entries`. Notice `stop_active(load_entries())` reloads rather than mutating the caller's copy — a deliberate asymmetry so "stop" always sees the freshest disk state, and a good example of why command routers reload at each boundary.

**🎯 Expected output:** `uv run python tracker.py summary` prints top tasks with minutes plus a total; every other command above works identically from a shell.

**🩹 If it's off:** If `summary` shows the empty `TOTAL 0`, the loaded file has no entries or `e.minutes` is being read as a string — CSV strings need an `int()` cast in the summary loop. If `start` with two words like `"Learn dataclasses"` consumes only `args[1]`, you need `" ".join(args[1:])` for multi-word tasks. If `stop` from the CLI doesn't affect the interactive session, the two are holding different lists — reload after any write.

### 5.2 Verify the finished tracker

**✅ Checklist**

- ✅ `uv run python tracker.py summary` prints top tasks and a total.
- ✅ `start` / `stop` / `add` / `list` / `daily` / `weekly` all respond from the terminal.
- ✅ Manual entries count in `summary` but are excluded from `daily`/`weekly`.
- ✅ You've recorded at least one real session and one manual entry yourself.

**🤔 Socratic Question(s)**

- The router reloads for every command; `stop` even reloads twice. What **stale-data bug** would appear if the router instead shared one list across two commands (e.g. `add` then immediately `list`), and why is reload-per-command the cheap immunity against it?
- `summary` ranks tasks by total minutes, so one 5-hour session beats eight 30-minute ones. What would you plot instead to show *consistency* rather than raw mass — and what would change for a user who wants both?

## ⚠️ Common pitfalls

- **Stamps in incompatible formats.** `now_str()` writes `%Y-%m-%d %H:%M`; if any hand-edited CSV uses `%m/%d/%Y`, `strptime` raises. Fix: one format constant, used by both writer and every parser.
- **Double-stamping a session.** Calling `now_str()` once and reusing the value for `start` *and* `end` produces a 0-minute session after real elapsed time. Fix: stamp each timestamp at its own moment.
- **Manual entries with a real-looking `start`.** If manual entries reuse the current time instead of `"manual"`, daily totals silently claim a pasted 25 minutes happened today. Fix: keep the `"manual"` sentinel, not today's date.
- **Counting strings as numbers.** CSV delivers everything as strings; `sum(by_task.values())` over string minutes concatenates (`"25" + "10"` = `"2510"`). Fix: cast `int()` once at load or in `summarize`.
- **One shared list across commands.** Mutating the same Python list in `add` then reading it in `list` without re-saving/loading produces stale views. Fix: reload at each command boundary as `main` does.

## What you just built

A working, CSV-backed time tracker: start/stop session tracking with real timestamp math, manual entry, daily and ISO-weekly reports, and a top-tasks summary routed entirely through a one-word CLI. The transferable skill is *recording reality rather than guessing it*: the same "stamp a moment, store a row, aggregate groups" pattern powers habit logs, jira worklogs, package delivery histories — any question of the shape "how much, and when, and for what?"

:::tip[Run a fuller version without any local setup]
[`examples/time-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/time-tracker) in the course repo is a fuller version of the code above, with an editable ledger and a day-over-day summary option. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add `edit <id> <minutes>` so a forgotten session can be fixed in place, reusing the load-modify-save pattern from Step 1.
- Render the daily report as a text bar chart (`10 min ██`) so trends are visible at a glance without any plotting library.
- Split sessions across midnight so a 23:50–00:40 block contributes to both days — the honest fix for Step 4's Socratic question.
- Write the weekly totals to a `report.csv` your invoicing doc can import, closing the loop the pitch originally promised.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓