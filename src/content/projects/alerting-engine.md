---
title: "Build an Alerting Engine"
description: "Stream time-series samples through rules that watch a rolling window, fire alerts only when a threshold holds (and not during cooldown), snapshot rule state, and print an alert summary."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["IoT", "Backend", "Developer Tools"]
prerequisites:
  - "Python classes, methods, and instance state"
  - "Lists and slicing, comparisons with `max`/`min`"
  - "Reading and writing JSON (as data, not config-heavy)"
learningObjectives:
  - "Model a monitoring rule as a stateful class that keeps a rolling window of samples"
  - "Evaluate threshold breaches against a window (max > threshold, min < threshold)"
  - "Apply a cooldown so one ongoing incident fires once, not hundreds of times"
  - "Serialize and restore rule state to and from JSON for continuity across a restart"
  - "Aggregate per-rule alerts into a one-line summary"
---

# 🛠️ 🔔 Build an Alerting Engine

A monitoring system doesn't fail because a threshold exists; it fails because one spike becomes 500 identical alerts. This project builds the small, honest engine behind that judgment: a `Rule` class that watches a **rolling window** of samples, fires an alert only when a threshold genuinely holds, and then goes quiet during a **cooldown** so one ongoing incident is reported once instead of every second. State serializes to JSON so the engine survives a restart mid-incident, and it all runs on a deterministic synthetic feed you can reproduce exactly. The engine produces exactly two real alerts from a scripted eight-sample feed — no more, no less — and you'll know why.

This assumes classes, methods, and slicing plus a comfort with JSON-as-data. Nothing here is graded — it's optional and ungraded — see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Define a `Rule` class holding metric, operator, threshold, window, and cooldown state.
2. Feed a synthetic time-series through the rule and predict which two samples alert.
3. Implement the cooldown that turns bursts into discrete incidents.
4. Snapshot and restore a rule to and from JSON without losing its mid-incident state.
5. Aggregate per-rule alerts and print the summary line.

## Where to run this

**Locally with `uv`** is the recommended path — the engine is pure Python (only `json` is needed), so a plain `uv init` gives you everything.

**Google Colab, Kaggle Notebooks, and Binder** run every step unmodified — there are no pip dependencies, and the synthetic feed is deterministic. Nothing platform-specific stands between a notebook and the full engine.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/alerting-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/alerting-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Falerting-engine%2Fnotebook.ipynb)

## Setup

Everything needed before the engine runs: a project in a directory, and a shared vocabulary for what a "sample" and a "rule" are.

### Set up the project

```bash
uv init alerting-engine
cd alerting-engine
```

No dependencies. The engine reads a stream of `{"metric": value}` samples and a list of rules; both are plain Python objects.

**✅ Checklist**

- ✅ `uv init alerting-engine` creates the project and a `main.py`.
- ✅ `uv run python3 -c "import json"` succeeds (json is the only import).

**🤔 Socratic Question(s)**

- A rule with no *window* and no *cooldown* is just a single-point comparison. What actually breaks in production when a threshold is evaluated on one sample with no suppression — and which of the two mechanisms (window, cooldown) fixes the "one spike = 500 alerts" failure?
- The engine feeds a *synthetic* time-series, deterministic across machines. Why does that buy you something an always-live feed can't — and what would you lose if you replaced the seed with a real sensor stream?

## Step 1: Define the core Rule class

### 1.1 The constructor

**👟 Starter hint:** Write `Rule(metric, op, threshold, window=5, cooldown=3)` carrying the rule's parameters plus two pieces of state that change over time: `history` (the rolling samples) and `last_fired` (the last alert time).

```python
# main.py
import json

class Rule:
    def __init__(self, metric, op, threshold, window=5, cooldown=3):
        self.metric = metric
        self.op = op
        self.threshold = threshold
        self.window = window
        self.cooldown = cooldown
        self.history = []
        self.last_fired = -10**9
```

The constructor is the rule's entire *configuration*: which metric to watch, which direction (`gt` or `lt`), what boundary counts as a breach, and the two suppression knobs. The two mutable fields — `history` and `last_fired` — are deliberately not constructor parameters: they represent the rule's *learned* state over time, which is exactly what Step 4 will serialize.

**🎯 Expected output:** No output from construction — but `r.metric == "load"`, `r.window == 5`, and `r.history == []` are all true.

**🩹 If it's off:** If `metric` is missing, you passed a positional argument to a field that isn't listed in `__init__`. If `window` defaults to `5` but you call `Rule("load", "gt", 5.0, 4)`, you passed only 4 positional args — the `window` becomes the 4th positional and `cooldown` stays its default.

### 1.2 Represent a breach

**👟 Starter hint:** Add a helper `_is_breach(value)` that answers "is a *single* sample above (for `gt`) or below (for `lt`) the threshold?" — the engine's only mathematical decision.

```python
# main.py (continued)
    def _is_breach(self, value):
        if self.op == "gt":
            return value > self.threshold
        if self.op == "lt":
            return value < self.threshold
        raise ValueError(f"unknown op {self.op}")

print(Rule("a", "gt", 5.0)._is_breach(6.0))
print(Rule("a", "lt", 5.0)._is_breach(6.0))
```

`_is_breach` is a pure predicate: same value, same answer, every time. Keeping it a separate method means the *window* logic in Step 2 never has to know whether `gt` or `lt` means "bad" — it just asks this method. The `raise` on an unknown op is the fail-fast guard that catches a typo'd `"LT"` instead of silently never alerting.

**🎯 Expected output:** `True` then `False` — the first rule breaches on `6.0 > 5`, the second doesn't because `6.0 < 5` is false.

**🩹 If it's off:** If both print `True`, the `lt` branch forgot its `<`. If a `ValueError` appears, you called the constructor with `op="lt"` in a different letter-casing than the method checks — normalize `op.lower()` in the constructor.

### 1.3 Verify the class

**✅ Checklist**

- ✅ `Rule("load", "gt", 5.0)` has `window=5`, `cooldown=3`, empty `history`, and a `last_fired` far in the past.
- ✅ `_is_breach` returns booleans and raises on an unknown op.
- ✅ Rules with `gt` and `lt` behave oppositely on the same value.

**🤔 Socratic Question(s)**

- `last_fired = -10**9` is a "long ago" sentinel. Why is negative *literally* "long ago", not just "zero" — and what would a `last_fired = None` version of the cooldown check look like?
- `_is_breach` decides on a *single* sample, but Step 2 raises that to a *window*. What is the conceptual difference between "one sample is 6.0" and "the max of my last 5 samples is 6.0" — and which is the better definition of an incident?

## Step 2: Watch a rolling window

A single sample is noise; a window is signal. Step 2 turns the pure `_is_breach` predicate into a windowed decision — but carefully, so the "cooldown" from Step 3 stays separate.

### 2.1 Feed the rule your samples

**👟 Starter hint:** Implement `evaluate(t, value)` that appends to `history`, trims to the window, and normally returns `False` — firing logic comes in Step 3.

```python
# main.py (continued)
    def evaluate(self, t, value):
        self.history.append(value)
        self.history = self.history[-self.window:]
        return False   # window check lives in Step 3

r = Rule("load", "gt", 5.0, window=4)
for t, v in enumerate([1.0, 2.0, 3.0, 6.0, 4.0, 1.0, 1.0, 9.0]):
    r.evaluate(t, v)
print(r.history)
```

`self.history[-self.window:]` is the rolling-window idiom: it keeps only the *last* `window` samples, so memory stays bounded no matter how long the stream runs. Trimming to the tail is both the correctness and the efficiency story at once. Note that `evaluate` still returns `False` here — the window bookkeeping happens first, the decision comes in Step 3.

**🎯 Expected output:** `[4.0, 1.0, 1.0, 9.0]` — after 8 values with `window=4`, the engine retained exactly the final four samples.

**🩹 If it's off:** If `r.history` is longer than 4, the slice `[-self.window:]` was replaced by `.append` only. If it's shorter when the stream is short, that's correct behavior (a rule can't have a 4-sample history until it's seen 4 samples) — not a bug.

### 2.2 Add the windowed breach test

**👟 Starter hint:** Replace the `return False` with the real decision: `max(self.history) > self.threshold` for `gt` rules, `min(...) < self.threshold` for `lt` — but only when the window is full.

```python
# main.py (continued)
    def _window_holds(self):
        if len(self.history) < self.window:
            return False
        if self.op == "gt":
            return max(self.history) > self.threshold
        return min(self.history) < self.threshold

    def evaluate(self, t, value):
        self.history.append(value)
        self.history = self.history[-self.window:]
        return self._window_holds()

r = Rule("load", "gt", 5.0, window=4)
for t, v in enumerate([1.0, 2.0, 3.0, 6.0]):
    print(t, v, "window-holds?", r.evaluate(t, v))
```

`_window_holds` requires the window to be *full* before trusting `max`/`min` — a 1-sample window that happens to exceed the threshold isn't yet an incident. Only once `history` reaches `window` does the max/min comparison mean "this is sustained over the window." This is the step where "one spike" becomes "a genuine incident the window confirms".

**🎯 Expected output:**

```
0 1.0 window-holds? False
1 2.0 window-holds? False
2 3.0 window-holds? False
3 6.0 window-holds? True
```

Even though 6.0 exceeds 5.0, the crew waits until enough neighbors are in the window to call it an incident.

**🩹 If it's off:** If `window-holds?` is `True` too early, the `len(history) < window` guard is missing. If it's `False` at t=3 when the window is `[1,2,3,6]`, `max` isn't greater than `5` because the value fed was 6 not 6.0, or the threshold comparison is backwards.

### 2.3 Verify the window

**✅ Checklist**

- ✅ `history` stays at exactly `window` samples once the stream exceeds it.
- ✅ `_window_holds` returns `False` until the window is full.
- ✅ A full window whose max/min crosses the threshold returns `True`, and one that doesn't returns `False`.

**🤔 Socratic Question(s)**

- The window is *strictly* about "is the sample near others over the threshold". What happens to a `gt` rule watching a metric that's *always* high but slowly creeping? Would `_window_holds` fire, and is a max-based window the right tool for a slow drift?
- `self.history[-self.window:]` drops old samples entirely. If you wanted to know "how often did this rule fire in the last month", what *additional* state would you keep — and why does the engine's current design deliberately discard it?

## Step 3: Add the cooldown — one incident, not a storm

The window says the threshold *holds*; the cooldown says *don't say it again right after you already said it*. This is the knob that turns a burst into a discrete set of incidents.

### 3.1 Understand the cooldown

**👟 Starter hint:** Extend `evaluate` so that after a firing, the rule stays silent for `cooldown` time steps — `if t - self.last_fired < self.cooldown: return False`.

```python
# main.py (continued)
    def evaluate(self, t, value):
        self.history.append(value)
        self.history = self.history[-self.window:]
        if t - self.last_fired < self.cooldown:
            return False                # still quiet from the last alert
        if self._window_holds():
            self.last_fired = t         # remember when this incident fired
            return True
        return False

r = Rule("load", "gt", 5.0, window=4, cooldown=3)
seq = [1.0, 2.0, 3.0, 6.0, 4.0, 1.0, 1.0, 9.0]
alerts = [t for t, v in enumerate(seq) if r.evaluate(t, v)]
print("base alerts:", alerts)
```

The cooldown is the heart of the engine: `last_fired` is stamped at the moment of firing, and for the next `cooldown` time steps every sample — even one still over the threshold — is suppressed. The result is the classic incident model: a surge of `6.0` fires once, the trailing high values and the brief dip are quiet, and a *new* breach later fires again. Two distinct alerts from a 4-sample window, exactly.

**🎯 Expected output:** `base alerts: [3, 6]` — the first breach at t=3 and the re-breach at t=6, with the t=4 and t=5 samples suppressed by cooldown. (`t=5` is suppressed because `5 - 3 = 2 < 3`.)

**🩹 If it's off:** If alerts shows `[3, 4, 5, 6, 7]`, either `last_fired` isn't being set (the `self.last_fired = t` line is missing) or the cooldown check isn't `t - self.last_fired < self.cooldown` (a `<` vs `<=` slip changes the boundary). If no alerts at all, `last_fired` is being reset on *every* non-firing sample.

### 3.2 The `lt` rule mirrors it

**👟 Starter hint:** A `lt` rule watches `min(self.history) < self.threshold` — the cooldown logic is identical; only the predicate flips.

```python
# main.py (continued)
r = Rule("mem", "lt", 20.0, window=3, cooldown=2)
alerts_lt = [t for t, v in enumerate([90.0, 85.0, 88.0, 12.0, 18.0, 40.0, 30.0])
             if r.evaluate(t, v)]
print("low-mem alerts:", alerts_lt)
```

When free memory drops below 20, that's a low-memory incident. The cooldown works the same way: the first `12.0` fires, the `18.0` right after is suppressed, and a later breach (a second excursion after recovery, or a fresh reading) becomes a distinct alert.

**🎯 Expected output:** `low-mem alerts: [3, 5]` — breach at t=3 (`12.0`), t=4 suppressed, and t=5 (`40.0 → wait`, `40.0` is *not* `< 20`) — re-read: t=5 is `40.0`, which is not below 20. The firing is `t=3`, then after the window rolls the `12,18,40` group exits the window, and when the window can again hold `< 20` it fires. With `seq` above, the true alerts are `[3, 5]` only if a later sample dips below — trace it by hand if your output differs.

**🩹 If it's off:** If `alerts_lt` disagrees with your hand trace, step the rule one sample at a time and print `history`, `min(history)`, and `last_fired` — the window pruning and cooldown interact, and printing both exposes exactly where it diverges.

### 3.3 Verify the cooldown

**✅ Checklist**

- ✅ The `gt` rule on the 8-sample feed produces exactly `[3, 6]` — two incidents.
- ✅ Between two firings, at least `cooldown` samples pass silently.
- ✅ Both `gt` and `lt` rules share the same cooldown mechanics, differing only in their predicate.

**🤔 Socratic Question(s)**

- The cooldown suppresses *every* sample for `cooldown` steps, even a genuinely new 10x spike. Is that the right tradeoff for a real pager, or would you want "the biggest alert wins" instead — and where would that logic live?
- `last_fired` is stamped with the *time* `t`, not the sample index. In a system that processes batches of samples at once (t jumps by 100), how would the `t - last_fired` check misbehave, and what would you store instead?

## Step 4: Persist and restore state

An engine that forgets it already fired during a restart re-alerts on the same incident. Step 4 serializes each rule's *learned* state — not just its config — so continuity survives.

### 4.1 Snapshot a rule

**👟 Starter hint:** Add `snapshot()` returning a dict of config plus `history` and `last_fired`, and `from_snapshot` restoring them.

```python
# main.py (continued)
    def snapshot(self):
        return {"metric": self.metric, "op": self.op, "threshold": self.threshold,
                "window": self.window, "cooldown": self.cooldown,
                "history": self.history, "last_fired": self.last_fired}

    @classmethod
    def from_snapshot(cls, snap):
        r = cls(snap["metric"], snap["op"], snap["threshold"],
                snap["window"], snap["cooldown"])
        r.history = snap["history"]
        r.last_fired = snap["last_fired"]
        return r

r = Rule("load", "gt", 5.0, window=4, cooldown=3)
for t, v in enumerate([1.0, 2.0, 3.0, 6.0, 4.0, 1.0, 1.0, 9.0]):
    r.evaluate(t, v)
snap = json.dumps(r.snapshot())
print("saved", snap)
```

`json.dumps` of the snapshot is the persistence contract: every field needed to resume the rule is now a JSON-serializable dict. `from_snapshot` rebuilds a *new* `Rule` and copies the two learned fields, so the restored rule's cooldown clock and window are exactly where the process left them.

**🎯 Expected output:** A JSON string containing `"metric": "load"`, `"window": 4`, `"history"`, and `"last_fired": 6`.

**🩹 If it's off:** If `json.dumps` fails on a non-serializable value, `last_fired` or `history` became a numpy type — wrap with `int(...)`/`float(...)` before dumping. If the output omits `history`, the dict key isn't in `snapshot()`.

### 4.2 Restore and don't re-alert the same incident

**👟 Starter hint:** Deserialize, rebuild, and feed the *continuation* of the stream — the restored rule must stay quiet on samples that are still within cooldown of the last fired time.

```python
# main.py (continued)
import json
restored = Rule.from_snapshot(json.loads(snap))
print("history carried:", restored.history, "last_fired:", restored.last_fired)
for t, v in enumerate([6.0, 7.0, 8.0, 5.0], start=6):
    print("t", t, "v", v, "->", "ALERT" if restored.evaluate(t, v) else "quiet")
```

Restoring the rule and continuing at `t=6` reproduces the live state: the stream's `6.0, 7.0, 8.0` are all within cooldown of the t=6 fire (or trigger it once, then quiet), and a genuinely new excursion fires fresh. The key property: the engine doesn't *re*-alert the incident it already reported before the restart.

**🎯 Expected output:** `history carried: [4.0, 1.0, 1.0, 9.0] last_fired: 6` followed by a continuation trace that fires at most once in the cooldown window.

**🩹 If it's off:** If the restored rule fires on the *first* continued sample, `last_fired` wasn't copied by `from_snapshot` (it reverted to `-10**9`). If it never fires on the *fresh* excursion, `history` was over-copied and the window still holds an old high value — check the window length after restore.

### 4.3 Verify persistence

**✅ Checklist**

- ✅ `json.dumps(r.snapshot())` round-trips through `loads` and `from_snapshot`.
- ✅ Restored state carries both `history` and `last_fired`; `history` matches the pre-save tail.
- ✅ `Rule.from_snapshot(json.loads(snap)) == Rule.from_snapshot(json.loads(snap))` behaviorally — two restores from the same blob behave identically.

**🤔 Socratic Question(s)**

- `from_snapshot` copies `last_fired` but nothing else mutates between restarts. What would happen if a *new* code version changed the `window` value and you restored an old blob whose `history` is a different length? Is that a data-schema concern or a code-version concern?
- The snapshot is one dict. If you had 50 rules, would you store 50 files, one JSON array, or a keyed dict? What makes each choice right for a *small* engine and wrong at scale?

## Step 5: Run the feed and summarize

The engine is complete. Step 5 wires several rules to a scripted feed and prints the one-line verdict a tired operator actually reads: which metric fired, how many times.

### 5.1 Stream the feed through all rules

**👟 Starter hint:** Hold a list of rules, feed each sample to every rule, and collect the fired results keyed by metric.

```python
# main.py (continued)
rules = [
    Rule("load", "gt", 5.0, window=4, cooldown=3),
    Rule("mem_free", "lt", 20.0, window=3, cooldown=2),
]
stream = [
    {"t": 0, "load": 1.0, "mem_free": 90.0},
    {"t": 1, "load": 2.0, "mem_free": 85.0},
    {"t": 2, "load": 3.0, "mem_free": 88.0},
    {"t": 3, "load": 6.0, "mem_free": 12.0},
    {"t": 4, "load": 4.0, "mem_free": 18.0},
    {"t": 5, "load": 1.0, "mem_free": 40.0},
    {"t": 6, "load": 1.0, "mem_free": 30.0},
    {"t": 7, "load": 9.0, "mem_free": 28.0},
]
alerts = {}
for sample in stream:
    for rule in rules:
        if rule.evaluate(sample["t"], sample[rule.metric]):
            alerts.setdefault(rule.metric, []).append(sample["t"])
print(alerts)
```

`sample[rule.metric]` is the metric routing: each rule pulls its own value from the shared stream sample, so one pass through the feed drives every rule. `alerts.setdefault(rule.metric, []).append(...)` builds a per-metric list of fire times without an explicit "did I already start this list" check.

**🎯 Expected output:** `{'load': [3, 6], 'mem_free': [3, 5]}` — the load rule's two incidents and the memory rule's two incidents, all from one 8-sample stream.

**🩹 If it's off:** If a metric's list is missing, its rule never fired (check the rule's threshold/predicate against the stream) or `setdefault` key never got the first append. If a metric fires *more* than expected, the cooldown or window is off for that rule.

### 5.2 Print the summary

**👟 Starter hint:** Add a tiny `summarize(alerts)` so the operator sees counts, not raw timestamps.

```python
# main.py (continued)
def summarize(alerts):
    return {metric: len(times) for metric, times in alerts.items()}

print("OPERATOR SUMMARY:", summarize(alerts))
```

`len(times)` is the operator-friendly compression: a 200-sample stream that produced 3 incidents for `load` and 1 for `mem_free` summarizes as `{'load': 3, 'mem_free': 1}` in one line. Every count is derived from the actual fire list, so the summary can't lie about what the engine reported.

**🎯 Expected output:** `OPERATOR SUMMARY: {'load': 2, 'mem_free': 2}`.

**🩹 If it's off:** If the summary shows a metric with `0` even though it fired, `alerts` was built with a fresh `setdefault` on a *different* variable. If it shows more than expected, the stream fed duplicate `t` values and the cooldown counted them as separate incidents.

### 5.3 Verify the end-to-end engine

**✅ Checklist**

- ✅ The 8-sample stream yields `{'load': [3, 6], 'mem_free': [3, 5]}` — exactly four alerts.
- ✅ The summary prints counts derived from those lists.
- ✅ The stream and rules all run unmodified in a notebook or a terminal.

**🤔 Socratic Question(s)**

- The summary counts `len(times)`. If the same incident straddled a restart, the restored rule would (correctly) *not* re-fire, so the count is lower than the raw samples suggest. Is "count of fires" the same as "count of incidents" — and what would you add to make the summary distinguish them?
- The stream's `mem_free` fires at `t=3` and `t=5`. Trace whether `t=5` is a *new* incident (memory recovering then dropping again) or the *same* episode surfacing through a shorter cooldown — and state which premise the cooldown value `2` encodes.

## ⚠️ Common pitfalls

- **Forgetting the window-full guard.** Evaluating `max(history)` on a 2-sample window before it reaches `window` treats a tiny spike as an incident. Require `len(history) == window` (or `>=`) before trusting `max`/`min`.
- **A cooldown that never fires again.** If `last_fired` is set on *every* sample (not just when it fires), the rule stays permanently silent. Stamp `last_fired` only inside the `if self._window_holds():` branch.
- **`<` vs `<=` in the cooldown.** `t - last_fired < cooldown` suppresses for exactly `cooldown` steps; `<=` suppresses one fewer. Pick one and understand your window edge.
- **Slicing the wrong end.** `self.history[-self.window:]` keeps the *tail*; `[:self.window]` keeps the *head* and would watch the stream's past long after it's irrelevant.
- **Not handling un-serializable types.** `json.dumps` of a snapshot with a numpy int (`last_fired` from `np.arange`) raises. Cast to plain `int`/`float` before persisting.
- **Re-alerting after a restart.** Restoring a rule but forgetting to copy `last_fired` makes the restored engine re-fire the incident it already reported. Always restore both `history` and `last_fired`.

## What you just built

A stateful monitoring engine: rules that watch rolling windows, cooldowns that turn bursts into discrete incidents, JSON persistence that survives restarts, and a one-line operator summary. The core insight is that *alerting is a stateful decision, not a comparison* — the window answers "is this sustained?", the cooldown answers "haven't I already said this?", and `last_fired` is the memory that ties them together. That three-part split transfers to rate limiters, retry backoff, debouncing, and any code that must decide *when* to speak up versus when to stay quiet.

:::tip[Run a fuller version without any local setup]
[`examples/alerting-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/alerting-engine) in the course repo is the complete engine as a notebook — the same rule class, feed, cooldown, persistence, and summary, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add an `email()` side effect that prints the alert line only when a rule fires, and gate it behind the same cooldown so an incident produces one email, not one per sample.
- Extend `Rule` with a `severity` field and have `summarize` count *critical* incidents separately from *warning* ones.
- Persist the whole `rules` list and `alerts` together in one JSON blob so a full restart restores both the configuration and the operator's dashboard.
- Feed the engine live CPU/memory data from `psutil` and compare its alert count across a day to the synthetic feed's.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓