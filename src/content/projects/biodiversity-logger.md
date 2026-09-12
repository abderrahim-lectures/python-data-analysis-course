---
title: "Build a Biodiversity Logger"
description: "A survey agent that ingests weeks of synthetic bird observations, compares recent counts to a season baseline, flags species as SURVEY/WATCH/OK, logs decisions to CSV, and prioritizes which species to check first with an ASCII trend chart."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Environment", "AI Agents", "Data Visualization"]
prerequisites:
  - "pandas groupby, filtering, and merging"
  - "Python functions and lists"
  - "Reading a CSV as a deliverable"
learningObjectives:
  - "Generate a deterministic synthetic observation log with a numpy RNG and pandas dates"
  - "Derive species baselines and recent windows from one DataFrame"
  - "Apply a threshold rule (SURVEY/WATCH/OK) as the agent's decision function"
  - "Ingest weekly observation batches and log per-species decisions to CSV"
  - "Visualize species totals as an ASCII bar chart and order a survey priority queue"
---

# 🛠️ 🦉 Build a Biodiversity Logger

Ecologists don't watch every individual, they watch *signals*. A decline of 30% or more in observed birds across a season is a survey trigger; a wobble near the baseline is worth watching; a steady count is "leave it alone". This project builds that decision loop as a small **survey agent**: it holds a season-long observation log (synthetic, so it's reproducible), computes each species' baseline and recent window, applies a threshold rule to flag `SURVEY` / `WATCH` / `OK`, ingests new weekly batches and logs every decision to a CSV, then renders an ASCII bar chart of species totals and prints a prioritized survey queue. Everything runs in pandas and the standard library, with a fixed seed, the same run flags the same species every time, on any machine.

This assumes pandas `groupby`, filtering, and merging. It is an optional, ungraded project, see [Real-World Projects](/projects) for the full, growing list. One install: `pandas`.

## 🎯 What you'll do

1. Generate a deterministic 111-day observation log for five species across three sites.
2. Write the agent's brain: baseline vs recent windows plus a three-tier threshold rule.
3. Run the ingestion loop: absorb three weekly batches, append one decision row per species.
4. Visualize species totals as an ASCII bar chart.
5. Prioritize: order species for the next survey, SURVEY first.

## Where to run this

**Locally with `uv`** is the recommended path:

```bash
uv init biodiversity-logger && cd biodiversity-logger
uv add pandas
```

**Google Colab, Kaggle Notebooks, and Binder** run every step unmodified, pandas ships preinstalled on both platforms, and the fixed `default_rng(11)` makes the output identical everywhere.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/biodiversity-logger/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/biodiversity-logger/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fbiodiversity-logger%2Fnotebook.ipynb)

## Setup

Everything needed before the first sighting.

### Set up the project

```bash
uv init biodiversity-logger
cd biodiversity-logger
uv add pandas
```

The imports you'll use throughout:

```python
import numpy as np
import pandas as pd
```

**✅ Checklist**

- ✅ `uv run python3 -c "import pandas, numpy"` succeeds.
- ✅ You can picture one row as `date | site | species | count` before typing anything.

**🤔 Socratic Question(s)**

- A "logger" that only stores rows is a spreadsheet. What does this project add that makes it an *agent*, a decision-maker that reacts to data rather than just recording it?
- The species counts are synthetic, with two species deliberately given a downward trend. If every species declined 10% *simultaneously*, would a recent-vs-baseline ratio even detect it, and what blind spot does that reveal about ratio-based monitoring?

## Step 1: Generate the observation log

Every downstream number comes from this block, so it's deterministic: one RNG, one seed, one day range.

### 1.1 The season frame

**👟 Starter hint:** Build a 111-day frame with `pd.date_range`; three sites; five species with per-species base counts, site multipliers, and two downward trends.

```python
# main.py
import numpy as np
import pandas as pd

rng = np.random.default_rng(11)
species = ["acorn_woodpecker", "blue_jay", "eastern_bluebird",
           "northern_cardinal", "tree_swallow"]
sites = ["riverside", "meadow", "forest"]
base = {"acorn_woodpecker": 48, "blue_jay": 62, "eastern_bluebird": 70,
        "northern_cardinal": 55, "tree_swallow": 60}
trend = {"acorn_woodpecker": -2.0, "blue_jay": 0.0, "eastern_bluebird": 0.0,
         "northern_cardinal": 0.0, "tree_swallow": -1.5}
site_mult = {"riverside": 1.2, "meadow": 0.8, "forest": 1.4}

day = pd.date_range("2025-04-01", periods=111, freq="D")
rows = []
for s in species:
    for site in sites:
        for i, d in enumerate(day):
            week = i // 7
            mu = base[s] * site_mult[site] + trend[s] * week
            rows.append({"date": d, "site": site, "species": s,
                         "count": max(0, round(mu + rng.normal(0, 4)))})
full = pd.DataFrame(rows)
print(full.head(3).to_string(index=False))
print("shape:", full.shape)
```

The two `trend` entries, acorn woodpecker −2 per week, tree swallow −1.5, are the species the agent must eventually *notice*. The `rng.normal(0, 4)` term is realistic daily noise: counts wobble ±4 even on a stable trend, so a strict "count went down today" would fire constantly. The ratio logic in Step 2 averages that noise away.

**🎯 Expected output:**

```
        date      site          species  count
0 2025-04-01 riverside acorn_woodpecker     58
1 2025-04-02 riverside acorn_woodpecker     63
2 2025-04-03 riverside acorn_woodpecker     62
shape: (1665, 4)
```

**🩹 If it's off:** If the head's first count differs from 58, the RNG seed or call order changed. If `shape` isn't `(1665, 4)`, the loop factored `5 species × 3 sites × 111 days = 1665` wrong.

### 1.2 Hold back the "incoming" weeks

**👟 Starter hint:** Keep days before 2025-06-30 (`<2025-06-30`) as the *observed* season; the last three weeks will be handed to the agent as "new sensor batches" in Step 3.

```python
# main.py (continued)
observed = full[full["date"] < pd.Timestamp("2025-06-30")].copy()
print("observed rows (days 1–90):", len(observed))
```

Step 3 needs fresh batches the agent *hasn't seen*. Rather than regenerate them from scratch (a second RNG stream), the script generated a 111-day season up front and simply withholds the tail: the same frame is the deliverable, and the slicing is the fiction of "new data arriving". This keeps everything on one seed, no second random stream to document.

**🎯 Expected output:** `observed rows (days 1–90): 1350`, 90 days × 30 rows/day.

**🩹 If it's off:** If 1350 shows as 1665, the `<` became `<=` (including the 91st day) or the copy lost the filter. If it shows a different count, the date comparison mixes timezones, compare `Timestamp` objects, not strings.

### 1.3 Verify the data layer

**✅ Checklist**

- ✅ `full.shape == (1665, 4)`; each species has `270` rows (distinct `species` counted in `groupby`).
- ✅ Head rows and counts are deterministic (same run, same numbers).
- ✅ `observed` is exactly the first 90 days, `1350` rows.

**🤔 Socratic Question(s)**

- Three sites multiply the base count differently (`forest` 1.4×, `meadow` 0.8×). When the agent compares *species* totals, should it count raw birds or birds-per-site? What happens to a forest-heavy species' ratio if you compare raw counts across regions with unequal effort?
- The daily `rng.normal(0, 4)` noise means a single day can drop 8 birds by chance. How many days of averaging does it take before the −2/week trend starts to dominate the ±4 noise, and what does that say about why the agent uses *windows*, not single days?

## Step 2: The agent's brain

The decision rule is the whole agent. Step 2 defines the windows and the three-tier threshold.

### 2.1 Baseline and recent windows

**👟 Starter hint:** Compute per-species mean counts for the baseline (first 28 days) and the recent window (June 1 onward), then their ratio.

```python
# main.py (continued)
BASE_END = pd.Timestamp("2025-04-29")
RECENT_START = pd.Timestamp("2025-06-01")

base_mean = observed[observed["date"] < BASE_END].groupby("species")["count"].mean()
recent_mean = observed[observed["date"] >= RECENT_START].groupby("species")["count"].mean()
ratio = recent_mean / base_mean
print(ratio.round(3))
```

The baseline is the species' "normal", spring counts from the first four weeks. The recent window is "what's happening now", the June onwards counts. Dividing recent by baseline gives a dimensionless ratio: `0.66` means "recent sightings are a third lower than baseline", `1.0` means "on par", `1.2` means "booming". Ratios erase scale, so one threshold rule works across species regardless of how common they are.

**🎯 Expected output:**

```
acorn_woodpecker     0.659
blue_jay             1.003
eastern_bluebird     1.004
northern_cardinal    1.003
tree_swallow         0.804
Name: count, dtype: float64
```

**🩹 If it's off:** If stable species show ratios like `1.20`, the recent window caught the season peak while the baseline caught the trough, window boundaries matter. If acorn shows ~1.0, the `trend` dict wasn't applied (check `trend[s] * week`).

### 2.2 The tiered rule

**👟 Starter hint:** Turn the ratio into a tier with `alert_level(r)`, `< 0.7` SURVEY, `< 1.0` WATCH, else OK.

```python
# main.py (continued)
def alert_level(r):
    if r < 0.7:
        return "SURVEY"
    if r < 1.0:
        return "WATCH"
    return "OK"

for s in species:
    print(f"{s:<20} {ratio[s]:.3f}  {alert_level(ratio[s])}")
```

The thresholds are the agent's *policy*: a third off the baseline warrants dispatching a field survey; any dip below par gets watching; at-or-above par is left alone. Two species drop below 1.0: acorn woodpecker at 0.659 (deep enough for SURVEY) and tree swallow at 0.804 (a WATCH). The stable ones sit right at 1.00, the noise floor, not a real signal (note the threshold doesn't care that the difference between 1.003 and 0.999 is pure noise).

**🎯 Expected output:**

```
acorn_woodpecker     0.659  SURVEY
blue_jay             1.003  OK
eastern_bluebird     1.004  OK
northern_cardinal    1.003  OK
tree_swallow         0.804  WATCH
```

**🩹 If it's off:** If the tier column is all `OK`, `alert_level` compared `str` to `float` (pass the ratio, not the label). If SURVEY stats show `WATCH`, the `0.7` boundary is `<` vs `<=`, pick one and be consistent.

### 2.3 Verify the brain

**✅ Checklist**

- ✅ Ratios are dimensionless recent/baseline comparisons; stable species sit ≈ 1.00.
- ✅ Tiers: acorn SURVEY (0.659), swallow WATCH (0.804), three OK.
- ✅ `alert_level` is a pure function, same ratio, same tier, every call.

**🤔 Socratic Question(s)**

- The stable species' ratios hover within ±0.005 of 1.00, that's measurement noise, not a trend. A user of `alert_level` sees `WATCH` for 0.999 and `OK` for 1.001. What *deadband* (e.g. treat 0.95–1.05 as "no change") would reduce false alarms, and how would you implement it without changing the three-tier spirit?
- `ratio` divides recent by baseline. If a species was *absent* in the baseline (baseline = 0), the ratio explodes to `inf`. What guard would you add, and what would a sensible alert do for "species newly appeared"?

## Step 3: The ingestion loop

The agent doesn't evaluate once, it receives new data and re-decides. Step 3 feeds it three weeks of "new" batches and logs every decision.

### 3.1 Feed one batch, re-decide

**👟 Starter hint:** For each of the three withheld weeks, merge the chunk into `observed`, recompute ratio/tier per species, and append one `(checked, species, ratio, level)` row per species.

```python
# main.py (continued)
BASE_END = pd.Timestamp("2025-04-29")
RECENT_START = pd.Timestamp("2025-06-01")

def alert_level(r):
    return "SURVEY" if r < 0.7 else ("WATCH" if r < 1.0 else "OK")

def status_of(obs, checked):
    base_mean = obs[obs["date"] < BASE_END].groupby("species")["count"].mean()
    recent_mean = obs[obs["date"] >= RECENT_START].groupby("species")["count"].mean()
    rows = []
    for s in species:
        r = recent_mean[s] / base_mean[s]
        rows.append({"checked_after_days": checked, "species": s,
                     "ratio": round(r, 3), "level": alert_level(r)})
    return pd.DataFrame(rows)

decisions = pd.DataFrame()
weeks = [(pd.Timestamp("2025-06-30"), pd.Timestamp("2025-07-06")),
         (pd.Timestamp("2025-07-07"), pd.Timestamp("2025-07-13")),
         (pd.Timestamp("2025-07-14"), pd.Timestamp("2025-07-20"))]

for week, (start, end) in enumerate(weeks, start=1):
    chunk = full[(full["date"] >= start) & (full["date"] <= end)]
    observed = pd.concat([observed, chunk], ignore_index=True)
    status = status_of(observed, checked=90 + 7 * week)
    decisions = pd.concat([decisions, status], ignore_index=True)

print(decisions.head(10).to_string(index=False))
```

Each pass is *redecision*: the baseline stays pinned to the first four weeks (an historical contract), while the recent window absorbs the new batch, so the ratio moves continuously as fresh weeks arrive. Decisions are a growing table, one row per species per check: 5 species × 3 checks = 15 rows by the end.

**🎯 Expected output:**

```
 checked_after_days           species  ratio level
                 97  acorn_woodpecker  0.644 SURVEY
                 97          blue_jay  1.001    OK
                 97  eastern_bluebird  1.003    OK
                 97 northern_cardinal  1.003    OK
                 97      tree_swallow  0.789 WATCH
                104  acorn_woodpecker  0.626 SURVEY
                104          blue_jay  1.000 WATCH
                104  eastern_bluebird  1.001    OK
                104 northern_cardinal  0.998 WATCH
                104      tree_swallow  0.779 WATCH
```

**🩹 If it's off:** If `chunk` merged but the numbers didn't move, `status_of` used a cached global ratio, recompute from `obs` each pass. If decisions has 10 rows at head instead of 5, `status_of` ran per-week *and* per-species twice.

### 3.2 Persist the decisions

**👟 Starter hint:** `to_csv("decisions.csv", index=False)` and read it back to prove the deliverable survives the session.

```python
# main.py (continued)
decisions.to_csv("decisions.csv", index=False)
print(pd.read_csv("decisions.csv").shape)
print(pd.read_csv("decisions.csv").tail(5).to_string(index=False))
```

A decisions CSV is what a non-Python stakeholder actually consumes: 15 rows, five per check, each with `checked_after_days`, species, ratio, level. Reading it back with pandas round-trips the deliverable, the next step's priority queue will read from this same file.

**🎯 Expected output:**

```
(15, 4)
 checked_after_days           species  ratio level
                111  acorn_woodpecker  0.607 SURVEY
                111          blue_jay  0.999 WATCH
                111  eastern_bluebird  0.999 WATCH
                111 northern_cardinal  0.996 WATCH
                111      tree_swallow  0.767 WATCH
```

**🩹 If it's off:** If the round-trip shape isn't `(15, 4)`, `to_csv`/`read_csv` dropped a column (the `index` flag wrote an extra unnamed column). If tail shows stale rows from a prior run, clear the CSV before the loop.

### 3.3 Verify the loop

**✅ Checklist**

- ✅ Three merges → 15 decision rows; check days `97, 104, 111`.
- ✅ Acorn woodpecker is `SURVEY` at every check; its ratio *falls* 0.644 → 0.626 → 0.607 (decline accelerating).
- ✅ `decisions.csv` round-trips `(15, 4)`.

**🤔 Socratic Question(s)**

- Acorn's ratio *fell* across the three checks while the stable species flickered `OK ↔ WATCH` near 1.00. Which pattern is the signal, and which is the noise, and what does the ratio's monotonic decline tell you that a single snapshot at day 97 never could?
- The baseline is pinned to **the first four weeks forever**. A species that recovered to 2.0× baseline still compares against spring. When is a *rolling* baseline (recompute from the last 90 days) better than a fixed one, and what new risk (spinning into a self-fulfilling decline) does it introduce?

## Step 4: Visualize the totals

Decisions tell you *which* species; a chart tells you *how much* each matters. Step 4 renders species totals as an ASCII bar chart, a terminal-friendly visualization.

### 4.1 Total sightings per species

**👟 Starter hint:** `groupby("species")["count"].sum()` over the 111-day season, sorted ascending for the chart.

```python
# main.py (continued)
totals = full.groupby("species")["count"].sum().sort_values()
print(totals.to_dict())
```

Totals answer "who's abundant, who's rare", a reporting instinct, not a decision rule. The two flagged species (acorn 13,223 and swallow 18,954) are mid-pack: not the rarest, which is exactly why the ratio matters, a *rare* species *and* a *common* species both deserve a survey when their counts drop below baseline.

**🎯 Expected output:**

```
{'acorn_woodpecker': 13223, 'tree_swallow': 18954, 'northern_cardinal': 20705, 'blue_jay': 23398, 'eastern_bluebird': 26435}
```

**🩹 If it's off:** If the values sum wildly above 1665×~50, `concat` duplicated chunks (Step 4 runs before the loop, compute over `full`, not `observed` mid-ingestion).

### 4.2 Render the ASCII bars

**👟 Starter hint:** Map each total to `"#" * round(v / max * 40)` for a fixed-width 40-bar chart.

```python
# main.py (continued)
mx = totals.max()
for s, v in totals.items():
    bar = "#" * round(v / mx * 40)
    print(f"  {s:<20} {v:6d}  {bar}")
```

`v / mx * 40` rescales the biggest species (eastern bluebird, 26,435) to 40 characters and everyone else proportionally, a bar chart that doesn't depend on the absolute magnitude. It's a visualization primitive that works in any terminal, any notebook, any platform, and it makes the *relative* abundance visible at a glance.

**🎯 Expected output:**

```
  acorn_woodpecker      13223  ####################
  tree_swallow          18954  #############################
  northern_cardinal     20705  ###############################
  blue_jay              23398  ###################################
  eastern_bluebird      26435  ########################################
```

**🩹 If it's off:** If a bar is empty (`""`) the species total bottomed at 0 (ratio guard from Step 2's Socratic should warn). If bars overflow the line, `round(v / mx * 40)` capped at 40 only if `v <= mx`, it is, by definition of `max`.

### 4.3 Verify the chart

**✅ Checklist**

- ✅ Totals match the sorted dict: acorn 13,223 … bluebird 26,435.
- ✅ Longest bar (40 `#`) belongs to the largest total (eastern bluebird).
- ✅ Flags and bars come from the same deterministic frame, chart and decisions can't disagree.

**🤔 Socratic Question(s)**

- The chart ranks by *total*, the agent by *ratio*. Eastern bluebird tops the chart (26,435) but is `OK`; acorn is second-least (13,223) but is `SURVEY`. Where would a chart that only showed totals send a survey, and what does that teach about "most birds" vs "most endangered"?
- 40 `#` gives 2.6% resolution per char, 13,223 vs 13,223+300 can't be told apart. For *decision* signaling you'd want a bigger scale or a log scale. When is the ASCII bar chart the *wrong* visualization to put next to a priority queue?

## Step 5: The survey priority queue

Decisions + totals aren't an action plan; the agent must say *who goes first*. The `SURVEY` species first, then `WATCH` species by severity (lowest ratio), then OK.

### 5.1 Order the species

**👟 Starter hint:** Read the latest decisions, map levels to a priority number (`SURVEY=0 < WATCH=1 < OK=2`), and sort by `(priority, ratio, species)`.

```python
# main.py (continued)
latest = pd.read_csv("decisions.csv")
latest = latest[latest["checked_after_days"] == latest["checked_after_days"].max()]
prio = {"SURVEY": 0, "WATCH": 1, "OK": 2}
latest["priority"] = latest["level"].map(prio)
latest = latest.sort_values(["priority", "ratio", "species"])

for i, row in latest.iterrows():
    print(f"{i+1:>2}. {row['level']:<6} {row['species']:<20} ratio {row['ratio']:.3f}")
```

Filtering to the newest check (`checked_after_days == max`) keeps only the *current* picture, decisions from week 1 are history, not priorities. Mapping the level to a number lets `sort_values` do the policy work: all `SURVEY` ahead of all `WATCH` ahead of all `OK`, ties broken by severity (lower ratio = worse) and then by name for determinism.

**🎯 Expected output:**

```
 1. SURVEY  acorn_woodpecker      ratio 0.607
 2. WATCH   tree_swallow          ratio 0.767
 3. WATCH   northern_cardinal     ratio 0.996
 4. WATCH   blue_jay              ratio 0.999
 5. WATCH   eastern_bluebird      ratio 0.999
```

**🩹 If it's off:** If acorn isn't first, the priority map or sort keys are swapped (sort by `("priority", "ratio")`, not by name). If more than 5 rows print, the filter to the max `checked_after_days` didn't run.

### 5.2 Ship the plan

**👟 Starter hint:** Emit a one-line plan string so the deliverable doubles as an actionable message.

```python
# main.py (continued)
plan = "; ".join(f"{row['level']}:{row['species']}"
                 for _, row in latest.iterrows())
print("SURVEY PLAN ->", plan)
```

The plan line is what an ecologist actually reads: `SURVEY:acorn_woodpecker; WATCH:tree_swallow; …`. The agent's complete turn, ingest → decide → log → prioritize → message, is now a single pipeline output a human can act on.

**🎯 Expected output:** `SURVEY PLAN -> SURVEY:acorn_woodpecker; WATCH:tree_swallow; WATCH:northern_cardinal; WATCH:blue_jay; WATCH:eastern_bluebird`

**🩹 If it's off:** If the plan lists species in file order, the `sort_values` ahead of the plan line was dropped. Column name mismatches (`ratio` vs `Ratios`) break the join silently, keep the CSV schema from Step 3.2 exactly.

### 5.3 Verify the queue

**✅ Checklist**

- ✅ Priority order: SURVEY (acorn) before all WATCH; WATCH sorted by ascending ratio.
- ✅ The `plan` line strings every species into the same order as the printed list.
- ✅ Everything reads from `decisions.csv`, the file **is** the system of record.

**🤔 Socratic Question(s)**

- The queue sorts `WATCH` by ratio, so tree swallow (0.767) precedes northern cardinal (0.996). But a *rare* species at 0.996 may be more fragile than a common one at 0.767. What weight would combine ratio **and** absolute abundance into one priority score, and what does it cost in explainability?
- This agent decided by thresholds a human chose (0.7/1.0). An "automated" pipeline with hand-picked thresholds is automation with a human in the loop. Where in this project would you *record* the threshold choice so a future agent run isn't a silent black box?

## ⚠️ Common pitfalls

- **Two random streams.** If chunks regenerated with their own RNG, the "new" data breaks reproducibility and the decision history can't be explained. Keep the entire season on one `default_rng(11)` and slice.
- **Windows that include the future.** `date >= 2025-06-01` where the observed frame already ends 06-29 is fine; but filtering with `<=` on the *chunk window* can double-count days shared between merge and status. Use half-open comparisons (`>= start & < end_next`).
- **Ratio on a zero baseline.** A species absent in spring yields `inf` ratio and wrong tier. Guard with a `baseline == 0` branch (always `SURVEY` for a vanished baseline).
- **`concat` versus mutation.** `pd.concat([observed, chunk])` rebinds the name, a `.append`-in-place habit silently replays old chunks and inflates ratios. Always rebind explicitly and drop duplicates if re-running.
- **Reading `decisions.csv` mid-loop.** If the file already exists from a prior run, `to_csv` without overwrite semantics doubles rows. Truncate or rebuild before each loop.
- **Sorting the wrong keys.** Prioritizing by `ratio` alone puts a 0.60 OK before a 0.90 SURVEY. The policy order is `level` first, then `ratio`, then species name.

## What you just built

A survey agent that turns a stream of observations into an actionable conservation plan: synthetic season logs, per-species baselines and recent windows, a three-tier threshold policy, an ingestion loop that re-decides as new weeks land and appends every decision to a CSV, an ASCII bar chart that ranks abundance, and a priority queue that says who to survey first. The core ideas transfer anywhere thresholds + time windows appear: **compare recent behavior to a pinned baseline, decide with a small human-readable policy, log every decision as data, and always pair a signal (the ratio) with its magnitude (the totals)**, because "down 40%" means nothing until you know it's the acorn woodpecker, and a stable species is a reason to look elsewhere, not to look away.

:::tip[Run a fuller version without any local setup]
[`examples/biodiversity-logger/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/biodiversity-logger) in the course repo is the complete agent as a notebook, season generation, windows, the three-week ingestion loop, the ASCII chart, and the priority plan, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a **deadband** to `alert_level` (`WATCH` only for ratios in `[0.7, 0.95)`, treat `0.95–1.05` as `OK`) so boundary noise stops flipping the queue.
- Add site-level breakdowns: instead of one ratio per species, flag *site×species* pairs (e.g. `tree_swallow@meadow`), and stack the ASCII chart by site.
- Visualize with a real plotting lib: `totals.plot.barh()` or `sevplot`, the same groupby data feeds both the ASCII chart and a matplotlib figure.
- Schedule the loop: wrap steps 3–5 in a function `run_check(observed, new_chunk)` and call it nightly, loading `observed` from the previous CSV instead of regenerating.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓