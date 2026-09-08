---
title: "Build a Streaming Analytics Engine"
description: "Process a live event stream with sliding-window aggregations, spike detection against a rolling baseline, stream joins, and bounded-buffer backpressure — all in pure Python generators."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["generators", "data-processing", "real-time"]
learningObjectives:
  - Build an infinite-style event generator with Python generators
  - "Aggregate a stream with a sliding time window"
  - Detect spikes against a rolling baseline
  - "Join two correlated streams of events"
  - Apply bounded-buffer backpressure without losing the core pipeline
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "Comfort with generators and yield"
  - "Basic understanding of lists and time math"
---

# 🛠️ ⚡ Build a Streaming Analytics Engine

Dashboards that show "active users right now" don't recompute the whole database on every tick — they consume an endless stream of events and keep a small, constantly-updated window of what just happened. This project builds that engine in pure Python: a generator that emits a realistic event stream, a sliding window that keeps averages up to date, spike detection against a rolling baseline, a join that correlates purchases back to the page views that preceded them, and finally a bounded buffer so a burst of events slows the pipeline down instead of blowing its memory up.

This assumes Python 101 and comfort with generators — no external packages and nothing from Data Analysis beyond that is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Write a generator that emits an unbounded-style feed of timestamped events.
2. Keep a sliding time window and output an up-to-date average per boundary.
3. Flag events that spike above a rolling baseline, not a fixed number.
4. Join purchase events back to each user's preceding page view.
5. Bound the pipeline with a capped buffer and run every stage end to end.

## Where to run this

**Locally with `uv`** is the primary path. This engine is pure standard library — `uv init` and you're running immediately — and each stage is a function you can call, inspect, and re-run from a terminal exactly as written below.

**Google Colab, Kaggle Notebooks, and Binder** run every step identically, because there are no external dependencies to install and no files that need to persist between cells. The honest caveat: a notebook's cells replace this engine's *terminal output* with notebook output, so what you lose is the "re-run the stream and watch it change" feel. Use the badges to see the whole pipeline in one click, and switch to local `uv` once you want to point the generator at a real file or socket.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/streaming-analytics/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/streaming-analytics/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fstreaming-analytics%2Fnotebook.ipynb)

## Setup

Create the project. Because the engine uses only the standard library, there is nothing to install.

```bash
uv init streaming-analytics
cd streaming-analytics
```

```bash
uv run python -c "from collections import deque; import random, datetime; print('ok')"
```

The three imports cover this project's entire dependency surface: `deque` for the sliding windows (Step 2 onward), `random` for the synthetic stream (Step 1), and `datetime`/`timedelta` for the event timestamps every window is measured against.

**✅ Checklist**

- ✅ `uv init streaming-analytics` created a folder with a `pyproject.toml`.
- ✅ `uv run python -c "from collections import deque; import random, datetime"` prints `ok` — zero packages added.

## Step 1: Build a live event stream generator

Every analytics engine starts at the same place: events arriving one at a time, forever. Python generators are the honest way to model that — a function that `yield`s events lazily looks exactly like a live feed to everything downstream, without actually needing a server.

### 1.1 Emit timestamped events

**👟 Starter hint:** Make a dataclass for the event shape, then a generator that `yield`s one event per iteration with a seeded, monotonically-increasing timestamp.

```python
# stream.py
import random
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class Event:
    ts: datetime
    kind: str
    value: float

def event_stream(events: int = 50, seed: int = 3):
    """Yield events lazily, as if arriving from a live feed."""
    random.seed(seed)
    now = datetime(2026, 1, 1, 9, 0, 0)
    for _ in range(events):
        kind = random.choice(["view", "click", "purchase"])
        value = {"view": random.randint(5, 15),
                 "click": random.randint(1, 4),
                 "purchase": random.choice([0, 1])}[kind]
        now += timedelta(seconds=random.randint(1, 3))
        yield Event(ts=now, kind=kind, value=value)

for ev in event_stream(5):
    print(ev.ts.strftime("%H:%M:%S"), ev.kind, ev.value)
```

The `@dataclass` gives you a readable, immutable `Event` without writing a constructor. The generator is the load-bearing idea: `event_stream` computes nothing until it is *iterated*, and each `yield` suspends it mid-loop — exactly the shape of a feed that keeps producing after you've consumed 50 events. Timestamps advance by a random 1–3 seconds per event, so later windows and joins have realistic, uneven timing to work with rather than a perfectly regular tick.

**🎯 Expected output:** Five lines like `09:00:00 click 3`, each with a later timestamp than the last and one of the three event kinds.

**🩹 If it's off:** If every timestamp is identical, `now +=` is missing so the clock never advances. If iterating twice gives different kinds, `random.seed(seed)` is missing, making the stream non-reproducible. If `Event` appears unpicklable or verbose, the `@dataclass` decorator is missing so the equality/`__repr__` shortcuts don't exist.

### 1.2 Verify the stream

**✅ Checklist**

- ✅ `event_stream(5)` prints 5 events with strictly increasing timestamps.
- ✅ The same seed produces the same event sequence on repeat runs.
- ✅ You can explain why a *generator* models a live feed better than returning a pre-built list.

**🤔 Socratic Question(s)**

- When you call `event_stream(50)`, no events exist yet — where is the code's memory spent before the first `next()` call, and why is that exactly what a real feed consumer wants?
- Each event advances the clock by a random 1–3 seconds. What would change about Step 2's windows if `timedelta` were always exactly 2 seconds instead?

## Step 2: Add a sliding time window

A stream you can't summarize is just noise. This step builds a sliding window — "the last 10 seconds of events, kept fresh" — and emits a running average each time the window slides forward, which is the shape of a live "recent activity" number.

### 2.1 Aggregate the last `window_s` seconds

**👟 Starter hint:** Use a `deque` as the window, push every event on the right, `popleft` anything older than `window_s` on the left, and emit the average when the clock crosses a step boundary.

```python
# stream.py (continued)
from collections import deque

def windowed_average(stream, window_s: int = 10, step_s: int = 3):
    """Emit the average of the last window_s seconds at each step boundary."""
    window: deque[Event] = deque()
    boundary = None
    for ev in stream:
        window.append(ev)
        while (ev.ts - window[0].ts).total_seconds() > window_s:
            window.popleft()
        if boundary is None or ev.ts >= boundary:
            boundary = ev.ts + timedelta(seconds=step_s)
            avg = sum(e.value for e in window) / len(window)
            yield ev.ts, round(avg, 2)

for ts, avg in windowed_average(event_stream(30), window_s=10, step_s=4):
    print(ts.strftime("%H:%M:%S"), "window avg:", avg)
```

Two things make this O(1)-ish per event instead of a re-scan of history: the `deque` — whose `.append` right and `.popleft` left are both constant-time — and the `while` loop that evicts expired events by comparing against `window[0]`, the oldest survivor. Because events arrive in timestamp order, one check against the left end is enough to keep the whole window fresh. The `boundary` logic is what turns a continuous window into periodic *output*: it only yields when the latest event has passed the next step boundary, so you get one readable average per step instead of one per event.

**🎯 Expected output:** A few printed lines, e.g. `09:00:13 window avg: 6.67`, one per step boundary, each covering roughly the last 10 simulated seconds.

**🩹 If it's off:** If every row's average is huge, the eviction `while` is missing so the window grows forever. If nothing prints, the stream you passed has fewer events than one step — pass a larger `events` count. If timestamps look like they overlap strangely, `window_s`/`step_s` are swapped, making the window longer than the input.

### 2.2 Verify the window

**✅ Checklist**

- ✅ One average prints per ~4 simulated seconds, each covering the prior ~10 seconds.
- ✅ The window size stays bounded: re-running with more events never increases the number of events held at once.
- ✅ You can explain why `window[0]` is the only expiry check needed.

**🤔 Socratic Question(s)**

- The window emits averages on a fixed *step boundary* rather than per event. In what real dashboard would sample-on-boundary drift badly, and what would you change to emit exactly per event instead?
- The window stores `value` and recomputes the sum on every emit. What separate running variables would make the average emit truly constant-time no matter the window length?

## Step 3: Detect spikes against a rolling baseline

Anomaly detection on a stream can't use a fixed threshold — traffic naturally peaks at lunch and dies at 3am. This step flags events that exceed a *rolling baseline*, so "too high" means "high for right now".

### 3.1 Flag events above the live average

**👟 Starter hint:** Keep a `deque` of recent values as the baseline, compute its mean, and yield anything that clears the mean by a configured multiplier.

```python
# stream.py (continued)
def detect_spikes(stream, window_s: int = 15, multiplier: float = 3.0):
    """Yield events whose value exceeds `multiplier * recent-average`."""
    recent: deque[Event] = deque()
    for ev in stream:
        recent.append(ev)
        while (ev.ts - recent[0].ts).total_seconds() > window_s:
            recent.popleft()
        baseline = sum(e.value for e in recent) / len(recent)
        if baseline > 0 and ev.value > multiplier * baseline:
            yield ev.ts, ev.kind, ev.value, round(baseline, 2)

for ts, kind, value, baseline in detect_spikes(event_stream(200), window_s=15, multiplier=2.5):
    print(ts.strftime("%H:%M:%S"), f"{kind:>8} {value:>3} vs baseline {baseline}")
```

The insight is comparing against *where the stream is right now*, not against a global average. With `multiplier=2.5`, a `view` of 25 triggers an alert when the last 15 seconds averaged 10, but the *same* value stays silent if the baseline is already 30 — because an event that's normal for a busy period is a spike at a quiet one. The `baseline > 0` guard matters: a window that happens to contain only zeros must not turn the comparison into a divide-by-anything pathological `0 > 0`.

**🎯 Expected output:** Fewer output lines than input events (200 → roughly a handful), each showing an event value well above its own rolling baseline — never a flood of every event.

**🩹 If it's off:** If *every* event prints, the multiplier is too low or the baseline window is so short it only ever contains the single loudest event. If two consecutive outputs share the same timestamp, the eviction `while` is missing so the baseline includes future... *past* events forever. If nothing prints at all, `multiplier=2.5` is unlikely with the seed you used — try 1.5 to see detections fire.

### 3.2 Verify spike detection

**✅ Checklist**

- ✅ `detect_spikes` prints only a small fraction of the stream.
- ✅ Each flagged event's value exceeds 2.5× its own rolling baseline.
- ✅ You can explain why the same absolute value is sometimes a spike and sometimes not.

**🤔 Socratic Question(s)**

- A slow, steady week means the rolling baseline *is* the spike — a gradual ramp never clears 2.5×. What extra test would catch a trend that goes from 10 to 30 across an hour?
- The multiplier is constant. How would the detector behave on a platform that is normally quiet but has a legitimate annual burst, and what would you need to keep the alert useful during that burst?

## Step 4: Join two correlated streams

A lone page view is unremarkable; a page view followed quickly by a *purchase* from the same user is the story. Joins correlate events that reference the same key (here, a user) within a time budget — the quiet relative of an SQL `JOIN`, done over time instead of tables.

### 4.1 Correlate purchases to earlier views

**👟 Starter hint:** Give the stream a `user` key, remember each user's most recent page-view time, and yield a "converted" row when a purchase arrives within the lookback window.

```python
# stream.py (continued)
def user_stream(events: int = 80, seed: int = 5):
    random.seed(seed)
    users = [f"u{i}" for i in range(8)]
    now = datetime(2026, 1, 1, 9, 0, 0)
    for _ in range(events):
        uid = random.choice(users)
        kind = random.choices(["page_view", "purchase"], weights=[80, 20])[0]
        now += timedelta(seconds=random.randint(1, 4))
        yield {"ts": now, "user": uid, "kind": kind}

def correlated_join(stream, lookback_s: int = 30):
    """Yield (user, seconds-after-view) for purchases within lookback_s of a view."""
    last_view: dict[str, datetime] = {}
    for ev in stream:
        if ev["kind"] == "page_view":
            last_view[ev["user"]] = ev["ts"]
        elif ev["kind"] == "purchase" and ev["user"] in last_view:
            age = (ev["ts"] - last_view[ev["user"]]).total_seconds()
            if age <= lookback_s:
                yield ev["user"], round(age, 1), "converted"

for user, age, label in correlated_join(user_stream(120)):
    print(f"{user} purchased {age}s after viewing -> {label}")
```

The join is a dictionary keyed by the join key (`user`) plus a time budget: `last_view` remembers *only* each user's most recent view, and a purchase consults it rather than re-scanning all earlier events. The `age <= lookback_s` comparison is what turns an unconditional correlation into a time-boxed one — a purchase five minutes after a view probably isn't the same journey. Because the buffer stores one timestamp per active user, its memory is proportional to the number of distinct users, not the number of events — the same reason real engines keep per-key state and expire stale keys.

**🎯 Expected output:** A handful of printed conversions (about 20% of events are purchases, and only some have a view within 30s), each like `u3 purchased 12.3s after viewing -> converted`.

**🩹 If it's off:** If every purchase converts, the `age <= lookback_s` check isn't there or `lookback_s` is huge. If nothing converts, `user_stream`'s `kind` values don't match the strings the join checks. If a user's *old* view keeps matching purchases minutes later, `last_view[user] = ev["ts"]` is overwriting only on views as intended — but stale keys are never evicted, which is the drift to watch for in a long stream.

### 4.2 Verify the join

**✅ Checklist**

- ✅ Each yielded conversion shows a purchase arriving after its user's view.
- ✅ The output row count is well below the purchase count (time-boxed join).
- ✅ You can name the join key (`user`) and the time budget (`lookback_s`) without looking at the code.

**🤔 Socratic Question(s)**

- The join buffers only the *most recent* view per user. What would change about the conversions if you instead buffered the user's first view of the day?
- Real stream joins also have to *expire* keys nobody touches. If `lookback_s` bounded the join window, why isn't the `last_view` dict already bounded — and what could grow without bound in a long-lived join?

## Step 5: Bound the pipeline with backpressure

A real stream can outrun its consumer — a burst of a thousand events prevents the process from keeping up, and the naive answer (keep everything) is how a one-second spike becomes an out-of-memory crash. Backpressure means the consumer *tells* the producer to slow down, rendered here honestly as a bounded buffer that drops rather than grows.

### 5.1 Add a bounded buffer and run everything

**👟 Starter hint:** Cap the pending pile at `max_pending` events, call a hook when the cap is hit, then compose every stage so the whole engine runs from one `__main__`.

```python
# stream.py (continued)
def with_backpressure(stream, max_pending: int = 8, on_overflow=None):
    """Mirror a bounded queue: absorb up to max_pending events, drop the rest."""
    on_overflow = on_overflow or (lambda ev: None)
    pending: list = []
    for ev in stream:
        if len(pending) < max_pending:
            pending.append(ev)
        else:
            on_overflow(ev)
    return pending

def main() -> None:
    dropped: list = []
    def count_drop(ev): dropped.append(ev)

    feed = event_stream(300)
    buffered = with_backpressure(feed, max_pending=8, on_overflow=count_drop)

    windows = list(windowed_average(iter(buffered), window_s=10, step_s=4))
    spikes = list(detect_spikes(iter(buffered), window_s=15, multiplier=2.5))
    joins = list(correlated_join(user_stream(200)))

    print(f"buffered: {len(buffered)}  dropped: {len(dropped)}")
    print(f"windows emitted: {len(windows)}  spikes: {len(spikes)}  conversions: {len(joins)}")

if __name__ == "__main__":
    main()
```

`with_backpressure` makes the trade visible: up to `max_pending` events wait in line, anything beyond that is *dropped* and reported through the `on_overflow` hook instead of silently lost or silently hoarded. Composing each stage over `iter(buffered)` shows the other property worth testing — every downstream function in Steps 2–4 consumes any iterable lazily, so the pipeline stays a chain of small readers rather than one monolithic loop. The `main()` counts gives you an end-to-end signal: windows, spikes, and conversions all computed from the same bounded feed, with overflow visible as a number rather than a crash.

**🎯 Expected output:** A single summary block, e.g. `buffered: 300  dropped: 0  windows emitted: 54  spikes: 9  conversions: 4` — every stage ran, nothing raised.

**🩹 If it's off:** If a `TypeError` about a missing argument appears, a stage is being handed the *result* of a stage instead of an iterable — pass `iter(buffered)` consistently. If `dropped` is nonzero on a 300-event feed, `max_pending=8` is being hit mid-stream, which is correct behavior; confirm dropping matched your intent before panicking. If `detect_spikes` needs a longer feed, increase the `events` count, not the multiplier.

### 5.2 Verify end to end

**✅ Checklist**

- ✅ `uv run python stream.py` prints the summary block with no traceback.
- ✅ Every stage from the listing consumed the same bounded `buffered` feed.
- ✅ `main()` is guarded by `if __name__ == "__main__":` so importing `stream.py` in a test doesn't run the pipeline.

**🤔 Socratic Question(s)**

- `with_backpressure` drops events rather than blocking the producer. What does a consumer *lose* by dropping during a burst, and what would you record alongside each dropped event to make the loss auditable?
- All four stages read the same `buffered` list in sequence, so the whole pipeline must finish Stage 1 before Stage 2 starts. What would change about latency if the stages ran *concurrently* — and what synchronization problem would you suddenly need to solve?

## ⚠️ Common pitfalls

- **Re-generating your stream halfway down the pipeline.** Stages consume iterators once; calling `event_stream()` a second time produces a fresh (seeded) stream, so windows and spikes compute over *different* events and the numbers disagree. Fix: generate once and pass it (or `iter(buffered)`) to every stage, as in Step 5.
- **Windows that never evict.** Forgetting the `while … popleft` loop makes the window grow forever, so the "average of the last 10 seconds" silently becomes "average of everything so far." Fix: always evict from the left end after appending.
- **Comparing a fixed threshold instead of a baseline.** A hardcoded `value > 25` fires constantly during busy hours and never at quiet ones; `multiplier * rolling_average` from Step 3 is what keeps detections relative to current traffic.
- **Joins on a dictionary that never ages out.** `last_view` grows one slot per distinct user and never shrinks, so a long-running join leaks memory. Fix: expire stale keys you haven't seen within the lookback window.
- **Bounded buffers that silently drop.** A real backpressure design can't just `discard`; it must surface overflow. The `on_overflow` hook in Step 5 is the difference between an instrumented drop and a silent data loss.

## What you just built

A working streaming analytics engine: an event generator, a sliding-window summarizer, rolling-baseline spike detection, a time-boxed join, and a bounded buffer with visible backpressure — every stage a small, composeable function in pure Python, no third-party packages. The transferable skill is *processing data as it arrives rather than after it's stored*: once you've built one `deque` window and one generator, live dashboards, monitoring loops, and event processors all stop being mysterious and become the same five functions.

:::tip[Run a fuller version without any local setup]
[`examples/streaming-analytics/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/streaming-analytics) in the course repo is a fuller version of the code above, including a printable event feed and a per-stage breakdown. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Point the generator at a real source — a file being appended to, or a socket — so the "stream" is actual live events instead of seeded randomness.
- Add sessionization to the join: group a user's views into one logical session, then attribute a purchase to the session it landed in (this is how real attribution tools report "conversions per session").
- Replace `windowed_average`'s recomputed mean with incremental `count`/`sum` variables so the emit is constant-time at any window length.
- Persist windows and spikes to a JSONL file with a flush-per-batch writer, turning the live pipeline into something a dashboard can read.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓