---
title: "Build a Meditation Timer"
description: "Build a terminal meditation timer with interval bells, a guided box-breathing exercise, session logging, and streak tracking, one honest command line, zero distractions."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "time", "file-io", "gamification"]
learningObjectives:
  - "Run blocking and non-blocking waits with time.sleep and cooperative waiting"
  - "Count down from a duration and fire a cue at each interval"
  - "Prompt for feedback and append structured rows to a CSV session log"
  - "Compute streaks across dates with datetime and date arithmetic"
prerequisites: ["python-101/loops", "python-101/functions", "python-101/file-io", "python-101/date-time"]
---

# 🧘 Build a Meditation Timer

Sitting for a timed meditation has one problem no app in the world is allowed to fix, the phone buzzing, the ads, the streak nagging *before* you even close your eyes. A terminal timer has none of that: a plain prompt, a countdown, a soft bell, repeat. This project builds a small CLI that counts down a session, chimes at each interval (so you're not checking the clock), guides a 4-4-4-4 box-breathing cycle, and quietly logs every session so you can see your streak grow with zero judgment about rest days.

This assumes Python 101, loops, functions, reading and writing files, and basic date handling. Nothing beyond that: no GUI, no web, no external services. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Count down a meditation session from minutes to a pleasant "breathe in / breathe out" cue.
2. Fire a bell (terminal bell) every N minutes so you never have to open your eyes to check.
3. Guide a box-breathing cycle where each phase gets its own countdown.
4. Log each finished session to a CSV with date, duration, and a one-line mood note.
5. Read the log back and report your current streak and total minutes meditated.
6. Handle Ctrl+C gracefully so a quit mid-session remembers today's minutes, exactly like a streak app that forgives.

## Where to run this

**Locally with `uv`** is the primary path, and honestly the *only* one where the timer's charms land, because the bells and the breathing cues need either real `time.sleep` against a live terminal or at least a real wall clock to feel like a timer. Everything below runs fine on any of the three notebook paths too, but a meditation timer in a notebook is like a metronome in a spreadsheet: the machinery is there, the point is not.

**GitHub Codespaces** is the same as local, open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and a short `uv run python meditate.py --minutes 1` does a real, honest one-minute session in the terminal tab.

**Google Colab, Kaggle Notebooks, and Binder are a reasonable way to *see the code run*, the countdown logic, the breathing cycle, the CSV log, and the streak math all execute for real**, but the notebook runs each step as a fast, visible snapshot rather than as a realelapsed-wall-clock experience (a 10-minute `time.sleep` cell is a poor meditation). Use the notebook to learn the machinery; run the command for real when you want the timer to actually time something.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meditation-timer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meditation-timer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeditation-timer%2Fnotebook.ipynb)

## Setup

Everything you need before your first session: `uv`, and a folder to hold the project.

### Install `uv` and scaffold

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
mkdir meditation-timer && cd meditation-timer
uv init --bare
```

Zero extra packages, this project is pure standard library (`time`, `datetime`, `csv`).

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `meditation-timer/` exists with a `pyproject.toml` from `uv init --bare`.
- ✅ You can run `uv run python -c "import time, datetime; print('time is real')"` and see the message.
- ✅ You know what a terminal bell is (on most systems it's `\a` in a string and it beeps or flashes). We'll hear it in Step 2.

## Step 1: Count down a simple session

A timer is just a loop over the seconds you have left, printing the remaining time and sleeping one second per tick. The mental model here is the one you'll reuse for breaks, intervals, and the breathing cycle: *decide how long things last, then let the loop drain that duration one tick at a time.*

### 1.1 Write a minute-counting timer

```python
# meditate.py
import time

def countdown(minutes: int) -> None:
    total = minutes * 60
    print(f"Session: {minutes} min — begin. 🧘")
    for remaining in range(total, 0, -1):
        print(f"\r{remaining // 60:02d}:{remaining % 60:02d} left", end="", flush=True)
        time.sleep(1)
    print("\r00:00 left — done. Enjoy the quiet. 🙏")

if __name__ == "__main__":
    countdown(1)  # start with one real minute
```

`range(total, 0, -1)` walks *down* from the full seconds to 1, and each iteration prints the remaining time then blocks `time.sleep(1)`. The `\r` carriage return (with `end=""` and `flush=True`) rewrites the same line in place instead of printing 60 lines, and `//` plus `%` split the seconds into `MM:SS` for a clock that reads like a real timer.

**👟 Starter hint:** Run `countdown(1)` and *sit through the full minute*, you'll feel why `\r` beats 60 printed lines, and why a one-second `time.sleep` inside the loop is the whole heartbeat of a timer.

**🎯 Expected output:** One line that shows `01:00 left`, ticks down in place to `00:00 left`, then prints the done message, a full 60 seconds later.

**🩹 If it's off:** If 60 lines print instead of one overwritten line, the `\r`/`end=""`/`flush=True` trio isn't all present, the carriage return alone (without `flush=True`) often doesn't redraw inside captured output. If the countdown finishes instantly, `time.sleep(1)` may have been placed *outside* the loop, it must tick every iteration.

### 1.2 Verify the countdown

**✅ Checklist**

- ✅ `countdown(1)` takes a real 60 seconds and draws a single `MM:SS` line that reaches `00:00`.
- ✅ `countdown(5)` formats `05:00` → `04:59` → … without skipping, the `// 60`/`% 60` math is stable.
- ✅ `countdown(0)` prints the done message immediately (a pythonically honest zero-session).

**🤔 Socratic Question(s)**

- The loop sleeps exactly 1 second per tick but *printing also takes time*, so real elapsed time always slightly exceeds `minutes * 60`. Where does the drift accumulate, and what's a `time.monotonic()`-based rewrite (compute the deadline, then `sleep` until it) that keeps a 10-minute timer honest to the second?
- After the loop, remaining is `0`, but you never *see* a `00:00` iteration, only the post-loop message. What single change would make a real `00:00` line print as part of the loop's progress rather than as the finishing message?

## Step 2: Bell at each interval

A meditation timer that can't do interval bells isn't a meditation timer, the whole point is a cue at fixed points so you never check the clock mid-session. On a terminal, "the bell" is the humble `\a` character (BEL): in most terminals it beeps or flashes invisibly, and even where it doesn't, the Python `bell()` via `print("\a", end="")` is the same primitive the big apps draw sound from under the hood.

### 2.1 Add interval bells

```python
# meditate.py (continued)

def countdown_with_bells(minutes: int, bell_every: int = 5) -> None:
    total = minutes * 60
    print(f"Session: {minutes} min, bell every {bell_every} min — begin. 🧘")
    for remaining in range(total, 0, -1):
        el = total - remaining                        # seconds elapsed since the start
        if el % (bell_every * 60) == 0 and el > 0:    # exactly on an interval boundary
            print(f"\n   +bell at {el // 60:02d}:00   ({remaining // 60:02d}:{remaining % 60:02d} left)\a",
                  flush=True)
        print(f"\r{remaining // 60:02d}:{remaining % 60:02d} left", end="", flush=True)
        time.sleep(1)

if __name__ == "__main__":
    countdown_with_bells(2, bell_every=1)  # 2 minutes, chime at the 1-minute mark
```

The line that makes bells work is `el % (bell_every * 60) == 0`, elapsed seconds modulo the interval, so the bell fires *exactly* every `bell_every` minutes (and never at 0 because of `el > 0`). The `\a` rides on the bell line's `end` so it's part of the printed second, not a separate invisible write, and `el` is recomputed each tick from the countdown so the check stays correct no matter how the loop is later reordered.

**👟 Starter hint:** Start with `bell_every=1` on a short session, two minutes, one bell, and confirm the bell (a beep or a flash) lands at the 1:00 mark, not at 0:59 or 1:01.

**🎯 Expected output:** A session where at precisely one elapsed minute a bell line prints (with the terminal beep/flash), the countdown continues, and the done message arrives at the end.

**🩹 If it's off:** If the bell never fires, `el % (bell_every * 60) == 0` is comparing against the wrong interval, check you multiplied `bell_every` by 60, not compared against `bell_every`. If bells fire every single tick, the `el > 0` guard is missing, without it, `el == 0` at the first tick makes `0 % anything == 0`, so a "0elapsed" bell fires immediately.

### 2.2 Handle an interrupt gracefully

```python
# meditate.py (continued)

def countdown_forgiving(minutes: int, bell_every: int = 5) -> None:
    total = minutes * 60
    done = 0.0
    try:
        print(f"Session: {minutes} min — begin. 🧘")
        for remaining in range(total, 0, -1):
            el = total - remaining
            if el % (bell_every * 60) == 0 and el > 0:
                print(f"\n   +bell at {el // 60:02d}:00\a", flush=True)
            print(f"\r{remaining // 60:02d}:{remaining % 60:02d} left", end="", flush=True)
            time.sleep(1)
            done = float(el + 1)
    except KeyboardInterrupt:
        pass
    finally:
        print(f"\n— interrupted or finished after {done:.0f}s ({done / 60:.1f} min) —")

if __name__ == "__main__":
    countdown_forgiving(2, bell_every=1)
```

The `try/finally` shape is the graceful-quit pattern: `Ctrl+C` raises `KeyboardInterrupt`, the `except` swallows it, and the `finally` block *always* runs to report the seconds actually completed. `done` is updated only after each real second completes, so an interrupt mid-sleep still counts the completed ticks and never lies about "0 minutes done" when you really did 42.

**👟 Starter hint:** Run `countdown_forgiving(5, bell_every=2)`, wait ~15 seconds, then hit Ctrl+C, the terminal should report `158s / 2.6 min`-style reality, not a traceback or a fake `0s`.

**🎯 Expected output:** Pressing Ctrl+C mid-session prints a single clean line saying how many seconds you actually did, no traceback, no partial redraw, and `finally` guarantees that line prints even if the interrupt lands exactly on a bell tick.

**🩹 If it's off:** If Ctrl+C shows a traceback, the `except KeyboardInterrupt` is missing or placed on the wrong `try`, it must wrap the loop, not just the `sleep`. If the reported seconds are wrong, `done` is updated before the sleep completes, only bump it *after* a full second passes.

### 2.3 Verify the bells

**✅ Checklist**

- ✅ `countdown_with_bells(2, 1)` fires one audible-bell line at exactly the 1-minute mark.
- ✅ `countdown_forgiving` reports real completed seconds when you interrupt it, never a traceback, never a rounded-up lie.
- ✅ No bell ever fires at the very first tick (the `el > 0` guard holds).
- ✅ You can explain why `el` is *elapsed*, computed as `total - remaining`, rather than just `remaining`.

**🤔 Socratic Question(s)**

- Using `time.sleep(1)` per tick, the bell check runs at most once per second. That's fine, but what real-world drift would a *30-second* `sleep` introduce if you "optimized" the loop that way, and what would `el` still correctly capture?
- The bell prints its own line, clobbering the countdown's `\r` for one frame. What's the render-order bug between "print bell line" and "redraw countdown" that a longer message could expose, and how would your output survive it?

## Step 3: Guide a box-breathing cycle

Box breathing is a fixed rhythm, breathe in 4s, hold 4s, out 4s, hold 4s, repeat, and it's the *same countdown loop* from Step 1 with one extra idea: instead of a single timer draining once, the cycle repeats a fixed *sequence* of phases, printing a spoken cue for each phase as it runs.

### 3.1 Run the four-phase cycle

```python
# breathe.py
import time

BOX = [("Inhale", 4), ("Hold", 4), ("Exhale", 4), ("Hold", 4)]

def breath_cycle(rounds: int = 3, phase_seconds: int = 4) -> None:
    print("Box breathing: In 4 - Hold 4 - Out 4 - Hold 4. Begin. 🌬️")
    for r in range(rounds):
        for name, secs in BOX:
            for left in range(secs, 0, -1):
                print(f"\r{' ' * 20}  {name}… {left}", end="", flush=True)
                time.sleep(1)
    print(f"\r{' ' * 20}  Complete — {rounds} rounds. 👌")

if __name__ == "__main__":
    breath_cycle(rounds=2)
```

The tuple list `BOX` *is* the technique: the inner loop over `(name, secs)` turns four hardcoded phases into data, so a 4-4-8 style (athletes' long-exhale breathing) is a one-line data change instead of a code change. The eight-space `' ' * 20` pad in each `\r` prevents short phase names ("Inhale") leaving ghost characters from longer ones ("Complete").

**👟 Starter hint:** Run `breath_cycle(rounds=1)`, a single 16-second round, and *actually do the breathing*; you'll notice the cue changes phase exactly on the 1-second grid, which is the whole experience Step 1's loop made possible.

**🎯 Expected output:** Two rounds of `Inhale… 4` → `Hold… 4` → `Exhale… 4` → `Hold… 4`, each phase counting down one number per second, ending with `Complete, 2 rounds`.

**🩹 If it's off:** If phase names bleed into each other (`Exhale… 3Exhale… 2`), the `\r` pad is too short or missing, pad to at least the longest message's length. If breaths skip a number, the inner `range(secs, 0, -1)` is inverted (try `-1` vs. `1`) or `time.sleep(1)` is being skipped by a stray `continue`.

### 3.2 Verify the breath guide

**✅ Checklist**

- ✅ `breath_cycle(1, 4)` takes 16 seconds and shows four distinct phases, each counted 4→1 in place.
- ✅ The sequence matches `BOX`: Inhale → Hold → Exhale → Hold, never Out → In.
- ✅ Running `breath_cycle(2)` doubles the total time without repeating setup text, setup prints once, phases repeat.

**🤔 Socratic Question(s)**

- `BOX` is data, the loops are code. If you wanted a *ratio*-based cycle like 4-7-8, what's the smallest edit to `BOX`, and what does that say about encoding technique as data versus recompiling logic?
- The cue prints *before* the second it represents (`Inhale… 4` means "inhabit the next 4 seconds"). Where does `sleep` fit in that phrasing, and would printing `0` at the end of each phase read better or worse for an actual breath?

## Step 4: Log a session to CSV

A habit tracker that forgets is a toy; the whole streak value of meditation comes from a growing file. Step 4 makes each *finished* (or gracefully interrupted) session a row: date, minutes, and a one-word mood. CSV is chosen because it's a file a human can open in any spreadsheet and audit, logging code you can't read back is the fastest kind of trust lost.

### 4.1 Append a session row

```python
# log.py
from datetime import date
import csv
from pathlib import Path

LOG = Path("sessions.csv")

def log_session(minutes: int, mood: str = "ok") -> None:
    header = ["date", "minutes", "mood"]
    exists = LOG.exists()
    with open(LOG, "a", newline="") as f:
        writer = csv.writer(f)
        if not exists:
            writer.writerow(header)
        writer.writerow([date.today().isoformat(), minutes, mood])

def show_log() -> None:
    with open(LOG, newline="") as f:
        for row in csv.reader(f):
            print(f"{row[0]} — {row[1]:>3} min — {row[2]}")

if __name__ == "__main__":
    log_session(5, "calm")
    log_session(2, "restless")
    show_log()
```

The two decisions that carry this step: the header is written only when the file is *new* (re-running the script appends rows instead of duplicating the header), and `date.today().isoformat()` stores dates as `YYYY-MM-DD`, a format that sorts correctly as a plain string, which Step 5's streak math will lean on hard.

**👟 Starter hint:** Run `log.py` twice. First run: two rows plus the header are new. Second run: the same two rows appended again, *no* second header, that's the append-vs-header test passing.

**🎯 Expected output:** Running `log.py` twice prints on the second run a clean two-data-row history (4 lines total on first run, 4 lines again on second, not 6), each row `YYYY-MM-DD, N min, mood`.

**🩹 If it's off:** If the header reappears on the second run, `exists` was computed *after* opening the file (which creates it), compute it before `open(LOG, "a")`. If rows show `manual override`-style garbage, a stray trailing newline in the CSV is splitting one row into two, check the file is ending with a single newline, not a blank row.

### 4.2 Verify logging

**✅ Checklist**

- ✅ Appending twice adds two rows and never a duplicate header.
- ✅ Every row is `date,minutes,mood` with an ISO date, you can open `sessions.csv` in a spreadsheet and read it.
- ✅ `show_log` renders the file back line by line, including after a fresh run.

**🤔 Socratic Question(s)**

- We log only the *date*, not the time of day, so two sessions in one day overwrite nothing (two rows, same date). Would you want the tool to *merge* same-day minutes? What would the streak math in Step 5 prefer, and what does your answer reveal about the data model's customer?
- `append` mode writes a new line at the end. If you ran the tool on two machines (a laptop and a phone), what filesystem-level disaster does a shared append-only log risk, and what's the cheap fix (hint: read the file, merge, rewrite)?

## Step 5: Compute your streak

The log exists to be read back; the streak is the readback that makes you show up tomorrow. This step parses the CSV, sorts the dates, and finds the longest run of consecutive days *and* the current run ending at today, the two numbers every habit tracker shows. The core idea is that "consecutive" is just date arithmetic: each date is the previous one plus one day.

### 5.1 Parse and streak

```python
# streak.py
from datetime import date, timedelta
import csv
from pathlib import Path

LOG = Path("sessions.csv")

def session_dates(path: Path = LOG) -> list[date]:
    days = set()
    with open(path, newline="") as f:
        for row in csv.reader(f):
            if row and row[0].lower() != "date":
                days.add(date.fromisoformat(row[0]))
    return sorted(days)

def best_streak(days: list[date]) -> tuple[int, date]:
    best = 0
    run = 0
    end = None
    prev = None
    for d in days:
        run = run + 1 if prev is None or (d - prev).days == 1 else 1
        if run > best:
            best, end = run, d
        prev = d
    return best, end

if __name__ == "__main__":
    days = session_dates()
    print(f"{len(days)} meditated day(s) on record")
    print(f"longest streak: {best_streak(days)[0]} days")
```

The streak *definition* lives in one line: `(d - prev).days == 1`, a day continues a run only when it's exactly the next calendar day after the previous. A `set()` up front dedupes same-day double sessions, and `sorted()` guarantees the loop always walks dates in increasing order regardless of the CSV's append order.

**👟 Starter hint:** Write a quick battery of tiny date lists (`["2026-08-03","2026-08-04","2026-08-05"]` should be `best == 3`) *before* pointing it at real sessions, the streak function is where off-by-ones hide, and hand-checked fixtures find them fastest.

**🎯 Expected output:** With the Step 4 sample (`08-03`, `08-05`, a one-day gap), output is `2 meditated day(s) on record` and `longest streak: 1 days`, because the two dates are *not* consecutive.

**🩹 If it's off:** If a three-day run reports `2`, the `== 1` check is mis-cast (say `(d - prev).days >= 1` does include gaps, it must be exactly `1`). If the CSV's header row pollutes the set, the `row[0].lower() != "date"` guard is missing or the header isn't `date`; print the first few parsed dates to see.

### 5.2 Verify the streak

**✅ Checklist**

- ✅ `best_streak` on hand-built lists returns the correct longest run (3 for three consecutive days, 1 for two dates a day apart).
- ✅ Header rows never become session dates.
- ✅ Two sessions on the same date count as one day, the `set` dedup holds.
- ✅ You can explain whether this counts a streak that *ended yesterday* as equal to one still running today.

**🤔 Socratic Question(s)**

- `best_streak` returns the longest *ever* run but not the "am I on a streak right now?" current run. What's the extra check, comparing the last date to `date.today()`, that turns `best` into "current", and what should it report when today is a rest day but yesterday was meditated?
- The streak definition treats *any* gap as a reset. Real habit apps forgive one missed day (a "lapse" vs a "relapse"). How would the check change to forgive a single gap, and what does that do to the meaning of the number?

## ⚠️ Common pitfalls

- **Forgetting to flush.** The countdown works locally but looks frozen in captured logs or notebooks because `print(..., end="")` buffers. `flush=True` on every `\r` write is not optional when output is piped or captured.
- **Off-by-one in the bell check.** `el % interval == 0` fires at `0`, which lands the "first bell" one tick early, the `el > 0` guard is the whole fix, and omitting it makes a 1-minute session weirdly clap at second 0.
- **Skipping the `try/finally` on interrupts.** A timer that dies with a traceback on Ctrl+C reports lies ("did 0 minutes") and corrupts the session log's story. The `finally` that always prints completed seconds is what makes quitting *not* a failure.
- **Same-date double counting in streaks.** Running the timer twice in a day appends two rows, and a naive scanner counts two "days", inflating the streak by two for zero extra days. Dedupe dates (a `set`) before any consecutive-day math.
- **A header row that becomes a date.** The CSV starts with `date,minutes,mood`, and `date.fromisoformat("date")` raises, turning a trivial log-shot into a crash. Either skip the header in the reader (the `!= "date"` guard) or separate data rows from headers; pick one and be consistent.
- **`time.sleep` drift on long sessions.** Each 1-second tick plus print overhead pushes a 30-minute session past 30:00. For *meditation* this is practically irrelevant; if you ever timer more precisely, an absolute-deadline loop with `time.monotonic()` removes the drift, and `sleep(1)` stays happy in the meantime.

## What you just built

A real meditation timer: a countdown that draws one clean line, interval bells you never have to check, a box-breathing guide, an append-only CSV session log, and honest streak math that doesn't flatter. The transferable skill is the whole *event-loop in a terminal* toolset: elapsed-vs-remaining bookkeeping, cooperative `time.sleep` ticking, graceful interruption, and file-backed state, the exact primitives behind every interval timer, uptime monitor, countdown app, and habit tracker you'll write from here on. A friend's 10-minute session is 600 honest, print-redrawn, bell-when-it-should seconds away.

:::tip[Run a fuller version without any local setup]
[`examples/meditation-timer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meditation-timer) in the course repo bundles the timer, breathing guide, log, and streak modules plus a notebook that runs each piece as a visible snapshot. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run the cells in a browser tab.
:::

## Where to go from here

- Add a **current-streak** line: check the last date against `date.today()` and report "you're on day N", one more `best_streak` variant, and the number you'll actually check daily.
- Add a **weekly report**: sum minutes by ISO week and print a small bar chart of ascii `▁▃▅▇`, the same grouping habit from the log, now over a rolling 8 weeks.
- Add **history commands** (`--last 7`, `--since 2026-08-01`) that filter the CSV before the streak math, built on the same `csv` reading you already trust.
- Swap the fixed `BOX` for a `--technique` flag, `box`, `478`, `long-exhale`, each a different tuple list; the loops don't change, the data does.

## Share your project with the class

Built something you're proud of, a timer that actually ran, a streak you didn't break, a breathing session you finished? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓