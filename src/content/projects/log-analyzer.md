---
title: "Build a Log Analyzer & Visualizer"
description: "Tame a messy application log: parse lines into structured records, filter by severity, count patterns with regex, and render a timeline chart — a real operational debugging skill."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "data-viz", "regex", "file-io"]
learningObjectives:
  - "Parse heterogeneous log lines into structured Python dictionaries"
  - "Search and filter logs by severity, source, and keyword"
  - "Detect recurring patterns and anomalies with collections.Counter"
  - "Render a timeline of events per hour with matplotlib"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/data-structures", "data-analysis/groupby-aggregation"]
---

# 📊 Build a Log Analyzer & Visualizer

Every running service produces a log file that grows without mercy — thousands of lines a minute, half of them noise, until one afternoon something breaks and you need to find the three relevant lines in a million. This project builds the first tool a real engineer reaches for: a CLI that parses a log file into structured records, filters by severity and keyword, counts the patterns that repeat, and draws a timeline of events per hour so you can *see* when things went wrong.

This assumes Python 101 — file I/O, strings, dictionaries, and functions — plus a little comfort reading DataFrames from Data Analysis. Nothing beyond that: no frameworks, no APIs, no external services. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Define one line format for a messy log and parse each line into a structured record (timestamp, level, source, message).
2. Search and filter records by severity, source, and free-text keyword.
3. Detect the most frequent messages with a `Counter` — the patterns that dominate your log.
4. Count events per hour and render a timeline chart that shows the outage at a glance.
5. Point the finished tool at a realistic sample `app.log` you generate yourself and find the anomaly.

## Where to run this

**Locally with `uv`** is the primary path here — the tool's whole point is pointing at a real log file on disk and reading it, and that's most natural in a terminal where the file actually lives. The steps below assume a small folder with `uv`, which also makes the torturous `matplotlib` install a single command.

**GitHub Codespaces** works just as well: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and you'll have Node, Python, and `uv` preinstalled in a real clone of the repo.

**Google Colab, Kaggle Notebooks, and Binder are a fine way to *try* the parsing and counting machinery, but the file-heavy Step 1 (`pathlib` + real I/O) shines less in an ephemeral notebook.** The notebook below mirrors the steps with a bundled sample log so everything — parse, filter, count, chart — runs end to end with zero setup. Use it to see the pipeline work; switch to local `uv` or a Codespace when you want to point the tool at logs that are actually yours.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/log-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/log-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flog-analyzer%2Fnotebook.ipynb)

## Setup

Everything you need before a single line of the analyzer: a modern Python via `uv`, one charting package, and a realistic sample log to practice on.

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
mkdir log-analyzer && cd log-analyzer
uv init --bare
uv add matplotlib
```

### Generate a realistic sample log

You need a log to analyze that looks like the real thing — noise, repetition, and one buried spike of errors. Paste this into `make_sample_log.py`:

```python
# make_sample_log.py
from datetime import datetime, timedelta
from pathlib import Path
import random

random.seed(7)
START = datetime(2026, 8, 3, 0, 0)
LINES = [
    ("INFO", "api", "GET /health 200 {}ms"),
    ("INFO", "api", "GET /api/users 200 {}ms"),
    ("INFO", "db", "query OK {}ms"),
    ("DEBUG", "cache", "hit key=user:{}"),
    ("WARN", "db", "slow query {}ms (>1000ms)"),
    ("ERROR", "api", "500 on /api/orders: KeyError 'total'"),
    ("ERROR", "db", "connection reset by peer"),
]

out = []
t = START
for _ in range(1200):
    t += timedelta(seconds=random.randint(1, 12))
    level, src, msg = random.choice(LINES)
    n = random.randint(1, 9999)
    if random.random() < 0.03:
        level, src, msg = "ERROR", "api", "500 on /api/orders: KeyError 'total'"
    out.append(f"{t:%Y-%m-%d %H:%M:%S} {level:<5} [{src}] {msg.format(n)}")

Path("app.log").write_text("\n".join(out) + "\n")
print(f"wrote {len(out)} lines to app.log")
```

Run it:

```bash
uv run python make_sample_log.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `matplotlib` installed via `uv add matplotlib`.
- ✅ `make_sample_log.py` writes `app.log` with 1200 lines — roughly two hours of timestamps with a few dozen ERROR lines sprinkled in.

## Step 1: Parse a log line into a structured record

Unstructured text is useless for analysis, so the first move is turning every line into a `dict` with named fields. Our format is fixed on purpose: `timestamp LEVEL [source] message`. You'll see this "define a parseable format, then parse it" pair in every logging system in the real world — including Python's own `logging` module.

### 1.1 Write a one-line parser

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    """Turns '2026-08-03 10:14:03 INFO  [api] GET /health 200 12ms' into a dict."""
    parts = line.split(None, 3)
    ts, level, source = parts[0] + " " + parts[1], parts[2], parts[3].strip("[]")
    message = parts[4] if len(parts) > 4 else ""
    return {"timestamp": ts, "level": level, "source": source, "message": message}

def load_log(path: str) -> list[dict]:
    return [parse_line(line) for line in Path(path).read_text().splitlines() if line.strip()]

if __name__ == "__main__":
    records = load_log("app.log")
    print(f"parsed {len(records)} records")
    print(records[0])
```

`line.split(None, 3)` is the workhorse here: splitting on whitespace with a `maxsplit` of 3 keeps the timestamp's internal space intact (`parts[1]` would otherwise split `10:14` and `03` apart) and captures the entire message as one final chunk. The level is always exactly 5 characters wide in our generator (`INFO ` padded), so it survives the split cleanly too.

**👟 Starter hint:** Copy `parse.py` exactly, run `uv run python parse.py`, and confirm the first record is a dict with four keys before you touch anything else.

**🎯 Expected output:** `parsed 1200 records`, followed by a single dict like `{'timestamp': '2026-08-03 00:00:00', 'level': 'INFO', 'source': 'api', 'message': 'GET /health 200 691ms'}`.

**🩹 If it's off:** If you get `ValueError: not enough values`, a blank line or a line with fewer than 4 whitespace-separated parts slipped in — that's why `load_log` filters out `line.strip()`-empty lines. If message is empty for every line, the generator wrote a format with no message separation; re-run `make_sample_log.py` (the `{msg.format(n)}` call collapses when the message has no `{}` placeholder — check it still does after editing).

### 1.2 Verify the parser

**✅ Checklist**

- ✅ `parse.py` prints `parsed 1200 records` from `app.log`.
- ✅ The printed first record is a real `dict` with `timestamp`, `level`, `source`, and `message` keys.
- ✅ You can explain why `split(None, 3)` caps the split at three — and what breaks without the `3`.

**🤔 Socratic Question(s)**

- Our parser assumes a fixed-width level column (`{level:<5}` in the generator). What would change in `parse_line` if the log used variable-width levels like `[ERROR] api` instead — and is there a rewrite that survives both?
- The timestamp is stored as a string. What would break later if you tried to sort records *by time* with strings like `2026-08-03 00:00:00`? (Hint: think about leading zeros and what a `datetime` object gives you for free.)

## Step 2: Filter and search the records

Parsing gives you structure; filtering is where you start answering questions. "Every ERROR in the last 10 minutes" and "every line mentioning `orders`" are the two queries a debugging session actually runs — one by exact field, one by free text.

### 2.1 Query by field and by keyword

```python
# query.py
from parse import load_log

def by_level(records: list[dict], level: str) -> list[dict]:
    return [r for r in records if r["level"] == level]

def by_source(records: list[dict], source: str) -> list[dict]:
    return [r for r in records if r["source"] == source]

def by_keyword(records: list[dict], keyword: str) -> list[dict]:
    return [r for r in records if keyword.lower() in r["message"].lower()]

if __name__ == "__main__":
    records = load_log("app.log")
    errors = by_level(records, "ERROR")
    print(f"ERROR lines: {len(errors)}")
    print(f"first error message: {errors[0]['message']}")
    caches = by_keyword(records, "cache hit")
    print(f"messages containing 'cache hit': {len(caches)}")
```

Each filter is a list comprehension over the records with one predicate, and the keyword search folds both sides to lowercase so `ERROR` matches `error`. Because the record is a dict, `by_level` and `by_source` are actually the *same* function in disguise — both just test one field against a value.

**👟 Starter hint:** Start with `by_level` only; verify the ERROR count, then add `by_source` and `by_keyword` one at a time, re-running after each.

**🎯 Expected output:** Three lines: `ERROR lines: <a number around 40>`, the text of a `500 on /api/orders` error, and a `messages containing 'cache hit'` count — something comfortably above zero.

**🩹 If it's off:** If `errors[0]` throws `IndexError`, your sample log has zero ERROR lines — re-run the generator: the `random.random() < 0.03` branch is what injects them. If the keyword count is 0 but you *know* the text is there, check you're searching `records` and not a stale re-imported module — restart the interpreter after editing `parse.py`.

### 2.2 Verify filtering

**✅ Checklist**

- ✅ `by_level(records, "ERROR")` returns a non-empty list whose members all have `level == "ERROR"`.
- ✅ `by_keyword(records, "orders")` returns every line whose message contains that word — and returns the same result regardless of case.
- ✅ You can predict, before running, how many records `by_level` + `by_source` would overlap on a source that only emits INFO lines.

**🤔 Socratic Question(s)**

- `by_keyword` does a literal substring match. What's the first query you could write that it would *fail* — for example, wanting all messages about *either* "orders" *or* "payments"? What does that suggest about composing simple predicates?
- Should `by_level` treat `"error"` (lowercase) as equal to `"ERROR"`? What's a one-line change that makes the comparison case-insensitive — and when might you *not* want that?

## Step 3: Count patterns with a `Counter`

Filtering finds lines you already suspect; counting finds the problems you didn't. The most-repeated message in a log is almost always the thing to look at — a single backoff loop retrying every second will generate thousands of identical lines while a real error fires once.

### 3.1 Count repeated messages

```python
# count.py
from collections import Counter
from parse import load_log

def top_messages(records: list[dict], n: int = 5) -> list[tuple]:
    return Counter(r["message"] for r in records).most_common(n)

def error_rate(records: list[dict]) -> float:
    if not records:
        return 0.0
    errors = sum(1 for r in records if r["level"] == "ERROR")
    return errors / len(records)

if __name__ == "__main__":
    records = load_log("app.log")
    for msg, count in top_messages(records):
        print(f"{count:>4}  {msg}")
    print(f"\nerror rate: {error_rate(records):.2%}")
```

`Counter(...).most_common(n)` does the whole "group by message, sort by frequency, take the top n" job in one line — you'd otherwise write a `defaultdict(int)` loop plus a sort. Note that the message gets *template*-like once a real format string is used (`{n}` replaced at generation time), so distinct parameter values still collapse to one bucket, which is exactly what you want for spotting a repeated pattern.

**👟 Starter hint:** Import `Counter` from `collections` (stdlib — no install) and print the top 5 messages with their counts; the `error_rate` one-liner is a bonus that answers "what fraction of my log is failure?"

**🎯 Expected output:** Five lines like ` 213  query OK 1234ms` with descending counts, then `error rate: 3.4%` (your exact numbers vary — the seed makes them reproducible).

**🩹 If it's off:** If every line shows a count of 1, `{msg.format(n)}` in the generator gave each line a unique parameter and the "template" bucketing collapsed nothing — that's correct behavior, but to see repetition, re-run the generator where `random.seed(7)` makes a few messages recur. If `error_rate` prints `0.00%`, the ERROR branch is missing from your generator (see Step 2's fix).

### 3.2 Verify counting

**✅ Checklist**

- ✅ `top_messages` prints 5 rows with descending counts that sum to the full 1200 lines.
- ✅ `error_rate` returns a percentage between 0% and 100% that matches `len(by_level(records, "ERROR")) / len(records)`.
- ✅ You can name the type each element of `top_messages` returns — and why a plain `list` can't do `most_common`.

**🤔 Socratic Question(s)**

- `Counter` is built on a plain `dict`. What would be lost if you replaced the one-liner with `dict.fromkeys(records, 0)` to "zero everything first" — and what's the actual count when a key is missing from a normal dict?
- `error_rate` divides by total records. If the log were 90% DEBUG lines, would the same 40 ERRORs look better or worse as a percentage? What would a *better* denominator be for "how broken is this hour"?

## Step 4: Visualize events over time

A number can hide a pattern; a chart rarely does. "Every hour had 2 errors except 11:00, which had 140" is a *dashboard you can see*, and it's the step that takes the tool from "search" to "analysis."

### 4.1 Count events per hour and plot

```python
# timeline.py
from collections import Counter
from datetime import datetime
from parse import load_log
import matplotlib.pyplot as plt

def events_per_hour(records: list[dict], level: str = None) -> Counter:
    hours = Counter()
    for r in records:
        if level is not None and r["level"] != level:
            continue
        hour = datetime.strptime(r["timestamp"], "%Y-%m-%d %H:%M:%S").replace(
            minute=0, second=0, microsecond=0
        )
        hours[hour] += 1
    return hours

if __name__ == "__main__":
    records = load_log("app.log")
    totals = events_per_hour(records)
    errors = events_per_hour(records, "ERROR")
    hours = sorted(set(totals) | set(errors))
    x = range(len(hours))
    plt.bar([h for h in x], [totals[h] for h in hours], label="all events")
    plt.bar([h for h in x], [errors[h] for h in hours], color="red", label="errors")
    plt.xticks(list(x), [h.strftime("%H:%M") for h in hours], rotation=45)
    plt.xlabel("hour")
    plt.ylabel("events")
    plt.title("Log events per hour")
    plt.legend()
    plt.tight_layout()
    plt.savefig("timeline.png", dpi=120)
    print("wrote timeline.png")
    print("error peak:", errors.most_common(1))
```

Two bars summed on the same axis is the trick of a stacked chart: the total shows volume, and the red overlay shows *where the volume was errors*. Both are built from the same `events_per_hour` — the `level` filter is an optional stop inside the counting loop, so one function answers "how busy" and "how broken" without a second implementation.

**👟 Starter hint:** Get `saved timeline.png` printed and open the file before worrying about labels — a boring flat blue bar with one red spike is the expected, correct first output.

**🎯 Expected output:** `wrote timeline.png` and `error peak: (<a datetime near 11:00>, <a count in the hundreds>)` — a red bar that dominates one hour in the saved image.

**🩹 If it's off:** If `plt.bar` errors with mismatched lengths, `x` and the two value lists must be equal length — the `hours = sorted(set(totals) | set(errors))` union line exists to guarantee that, so don't replace it with just `set(totals)`. If `strptime` raises `ValueError: time data ... does not match format`, your `parse_line` stored milliseconds or a date-only timestamp — check the generator's `%H:%M:%S` format matches the `"%Y-%m-%d %H:%M:%S"` in `strptime`.

### 4.2 Verify the timeline

**✅ Checklist**

- ✅ `timeline.png` exists and shows one hour with a tall red bar — the anomaly is visible without reading a number.
- ✅ The bars for every other hour are close to flat, reflecting an even background stream.
- ✅ The hour with the error peak matches `error_rate` being noticeably higher in that hour's slice.

**🤔 Socratic Question(s)**

- The chart stacks total and errors on the same axis, which visually *hides* the error baseline where the red is minuscule. What's an alternative encoding (hint: two subplots, or errors on a log scale) that would surface a small error rate on a high-volume log?
- We bucket by calendar hour. If an outage happens at 11:59 and is fixed at 12:01, the standard `replace(minute=0)` bucketing smears it across two bars. How would you bucket if you wanted the chart to align with "one burst," not "two partial hours"?

## Step 5: Point the analyzer at a real anomaly

The whole tool is more than the sum of its steps when you run it on a log where you *haven't* already read the answer. This step generates a log with a hidden burst, then uses your own filters, counter, and chart to find it — the genuine workflow.

### 5.1 Find the buried spike

```python
# analyze.py
from parse import load_log
from query import by_level
from count import top_messages
from timeline import events_per_hour

if __name__ == "__main__":
    records = load_log("app.log")
    errors = by_level(records, "ERROR")
    print(f"total lines: {len(records)} | errors: {len(errors)}")
    print("\nmost common error-level messages:")
    for msg, cnt in top_messages(errors, 3):
        print(f"  {cnt:>3}  {msg}")
    peak_hour, peak_count = events_per_hour(errors).most_common(1)[0]
    print(f"\nerror peak at {peak_hour:%H:%M} with {peak_count} errors")
```

**👟 Starter hint:** `analyze.py` borrows from every earlier module — run it, then *go read* the count and the peak hour, and confirm they're consistent with `timeline.png` from Step 4. Reading the two together is the payoff.

**🎯 Expected output:** Three clear conclusions that agree with each other — an ERROR count near 40 total, one recurring `500 on /api/orders` message dominating the error list, and an error peak hour that visibly matches the red spike in the saved chart.

**🩹 If it's off:** If the peak hour looks random (counts of 1–3 everywhere), your generator reached the 0.03 injection too evenly or not at all — re-run `make_sample_log.py`; the seed guarantees a burst. If `top_messages(errors, 3)` shows three *different* single-count messages, the error pattern is too varied to be "one bug" — that itself is a finding worth writing down.

### 5.2 Verify the full analysis

**✅ Checklist**

- ✅ The three printed facts (total/errors, top error message, peak hour) are mutually consistent and match `timeline.png`.
- ✅ You can name, for each fact, exactly which step's function produced it — parse, filter, count, or bucket.
- ✅ You've deleted and regenerated `app.log` at least once to confirm the tool is reading the file fresh, not a cached result.

**🤔 Socratic Question(s)**

- The spike was engineered with `random.random() < 0.03` — a 3% injection. If you changed that to `0.5`, which of the four functions would *still* be the right one to detect it, and which output would stop being trustworthy?
- This tool answers "what happened" but not "why." What's the single next query you'd want to run against the peak hour — and what would you build (hint: a drill-down that shows the raw lines) to answer it?

## ⚠️ Common pitfalls

- **Parsing format drift.** The moment a real log changes its message format (a new field, a longer level), `split(None, 3)` silently produces mislabeled records and every downstream count quietly lies. The fix is a schema check in `load_log`: raise a clear error when a line can't be split into 4+ parts, listing the offending line, instead of letting garbage through.
- **Counting raw messages instead of templates.** Counting `r["message"]` bucketed by exact text suddenly explodes into thousands of unique entries the moment a message embeds a per-request value (`user:4311` vs `user:4312`). For log analysis you usually want to normalize numbers before counting — a regex replacing `\d+` with `{N}` — so `user:{N}` counts as one pattern. That normalization is what real error-aggregation tools do.
- **Calling `strptime` on every line.** Parsing 10,000 strings for a 5-line chart is fine; parsing 10 million slows the whole pipeline. It buys a real `datetime` for sorting and bucketing, but benchmark before you assume — and consider a one-time `sorted(records, key=lambda r: r["timestamp"])` if all you need is order, since ISO-style timestamps sort correctly as strings.
- **The empty-log footgun.** `error_rate` and `most_common(1)[0]` both blow up (`IndexError`) on an empty file, and `dataframe`-style tools are worse — they silently compute on zero rows. Guard every entry point: `if not records: print("empty log")` before the very first filter, not after three steps have already assumed data exists.
- **Saving one PNG and calling it a dashboard.** A static file is a great checkpoint, but "seeing the anomaly" at 3 a.m. usually means an alert. The natural next step (and a classic pitfall) is forgetting that a chart *you* look at weekly is not an alerting system — set a threshold check (`if errors > 100: print("ALERT")`) long before you build fancier dashboards.

## What you just built

A real, working log-analysis pipeline: `parse.py` turns 1200 raw lines into structured dicts, `query.py` filters them, `count.py` finds the repeating patterns and the error rate, and `timeline.py` renders the one spiky hour where everything went wrong. Nothing here is a scaffold — generate a new log, point the tool at it, and the anomaly jumps out. The transferable skill is bigger than logs, though: parse → normalize → count → visualize is the exact skeleton of every "make sense of a messy text source" task, from server logs to survey responses to git commit messages.

:::tip[Run a fuller version without any local setup]
[`examples/log-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/log-analyzer) in the course repo bundles all five modules plus a sample `app.log` and a ready-to-run notebook. Clone or open the repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run it from there.
:::

## Where to go from here

- Normalize count-busting values before counting — replace `\d+` with `{N}` so `user:4311` and `user:4312` collapse into one pattern, and watch your `Counter` start finding real repetitions.
- Add an alerting rule: `warn_threshold.py` that prints `ALERT: <n> errors in the last hour` when `events_per_hour` crosses a number — the seed of a pager, without the pager.
- Add a source-vs-hour heatmap (one row per `source`, one column per hour, cell color = count) — the classic way to spot "the db was troubled at 02:00 while the api was fine."
- Port the pipeline onto Python's `logging` module: emit *structured* records (already dicts and a documented format) instead of parsing someone else's text — future-you will never need Step 1.

## Share your project with the class

Built something you're proud of — a real log you tamed, a chart that found an actual spike? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓