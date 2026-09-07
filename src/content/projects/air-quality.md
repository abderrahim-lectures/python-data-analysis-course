---
title: "Build an Air Quality Dashboard"
description: "Load a week's worth of PM2.5 readings (live when reachable, otherwise a realistic sample), turn raw concentrations into EPA AQI values with a piecewise formula, winnow out the worst hour, and ship a text report plus a plotted chart."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Environment", "APIs", "Data Visualization"]
prerequisites:
  - "Tidy data basics: DataFrames, dtypes, describing a column"
  - "Applying a Python function to every row of a DataFrame"
  - "Grouping and counting with pandas"
learningObjectives:
  - "Load a tidy, time-indexed dataset and inspect its shape and dtypes"
  - "Translate raw PM2.5 concentrations into EPA AQI numbers with a piecewise (breakpoint) formula"
  - "Label every hour with a category and find the worst and best readings"
  - "Aggregate hourly readings across a week and print a plain-language health report"
  - "Plot hourly AQI against category thresholds and save the figure to disk"
---

# 🛠️ 🌬️ Build an Air Quality Dashboard

Air quality is a number crunching problem hiding inside a sensor feed. This project takes a week of PM2.5 readings — tiny airborne particles that are the most common urban pollutant — converts each hourly concentration into an EPA Air Quality Index (AQI) value, buckets those values into health categories, and produces the two things a concerned citizen actually wants: a plain-language report ("Tuesday evening was the worst stretch") and a chart that shows the week at a glance. The data is real-shaped but honest: the project tries to fetch live readings from a public API and falls back to a deterministic sample you can reproduce to the decimal, so your reported numbers are always checkable.

This assumes basic tidy data work and none of it is graded; it's optional and ungraded — see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Load a tidy week of PM2.5 readings into a DataFrame and sanity-check its shape and dtypes.
2. Write the EPA breakpoint formula that turns concentration into a whole-number AQI.
3. Label every hour with a category, and find the worst hour and best hour of the week.
4. Aggregate the week into a readable text report with health advice.
5. Plot mean AQI by hour against the safe/threshold lines and save a PNG.

## Where to run this

**Locally with `uv`** is the recommended path: this project lives and dies on pandas + matplotlib, both one `uv add` away, and the saved `aqi_week.png` lands on your own disk.

**Google Colab, Kaggle Notebooks, and Binder** are all first-class here — pandas and matplotlib are pre-installed in each, `!pip install requests` covers the live-fetch wrapper, and `matplotlib.use("Agg")` in Step 5 keeps plotting headless-friendly in every environment. Notebooks are a great fit if your course machine lacks a local Python; just remember any live API data will change between sessions, which is exactly what the deterministic sample is for.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/air-quality/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/air-quality/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fair-quality%2Fnotebook.ipynb)

## Setup

Everything needed before the dashboard runs: a project with pandas, and a deterministic week of readings to feed it.

### Set up the project

```bash
uv init air-quality
cd air-quality
uv add pandas numpy matplotlib requests
```

`pandas` does the dataframe work, `numpy` builds the deterministic sample, `matplotlib` draws the chart, and `requests` powers the optional live fetch. If you skip `requests`, delete `fetch_live()` in Step 1 — every Expected output in this project is computed from the deterministic sample, so nothing downstream breaks.

**✅ Checklist**

- ✅ `uv add pandas numpy matplotlib requests` completes with no errors.
- ✅ You can `import pandas as pd` from inside the project directory.

**🤔 Socratic Question(s)**

- Why does the live-fetch path in this project *need* a fallback at all — what makes an API a bad guarantee to build a whole report on, and how does a deterministic sample keep the numbers honest anyway?
- A week of hourly readings is 168 rows. Before you write any code, what do you predict the shape and dtypes columns of that tidy frame will be?

## Step 1: Load a tidy week of readings

This step builds the DataFrame every later step consumes. The core is a *synthetic but deterministic* week — a 24-hour rhythm plus noise, seeded, so the exact same numbers appear on every machine. A thin live-fetch wrapper tries the OpenAQ API and is skipped when the network or API is unavailable.

### 1.1 Generate the deterministic week

**👟 Starter hint:** Build a believable pollution week: a sinusoidal 24-hour profile (this synthetic city's air worsens in the small hours — a classic "morning inversion"), Gaussian noise, values clipped so they never go negative, and timestamped hourly rows.

```python
# aqi.py
import numpy as np
import pandas as pd

def load_week() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    hours = np.arange(168)
    daily = 20 + 10 * np.sin(2 * np.pi * hours / 24)   # daily rhythm
    noise = rng.normal(0, 5, size=168)
    pm25 = np.clip(daily + noise, 0, None).round(1)    # µg/m³, never negative
    dates = pd.date_range("2025-03-03", periods=168, freq="h")
    return pd.DataFrame({"date": dates, "pm25": pm25})

df = load_week()
print(df.shape)
```

`np.random.default_rng(42)` is the reproducible-randomness idiom: the same seed produces the same "noise" on every machine, which is why every Expected output in this project is exact. The `20 + 10·sin(2πh/24)` profile makes the underlying physics visible, and `.round(1)` keeps concentrations to the tenth of a µg/m³ the way a real monitor reports them.

**🎯 Expected output:** `(168, 2)` — seven days of hourly readings, two columns (`date`, `pm25`).

**🩹 If it's off:** If the shape's *rows* differ from 168, check `periods=168` and `freq="h"` in `date_range`. If it's `(168, 3)` or more, a stray column (like the `hour` from a later step) leaked into `load_week` — keep the generator building exactly the two tidy columns.

### 1.2 Inspect the frame

**👟 Starter hint:** Sanity-check with `describe()` and look for the dtype story: `date` should be datetime, `pm25` float, and the concentration spread should look like real urban air.

```python
# aqi.py (continued)
print(df.info())
```

**🎯 Expected output:** 168 non-null entries in both columns; `date` is `datetime64[ns]` (or `datetime64[us]`), `pm25` is `float64`. No nulls — a tidy frame.

**🩹 If it's off:** If `date` shows as `object`, `date_range` wasn't assigned to the column (a plain list of strings instead). If `pm25` shows 168 *non-null* but prints as `object`, the `.round(1)` was applied to a mixed-type list — rebuild the column with the numpy array.

### 1.3 Optional: which path are you on?

**👟 Starter hint:** Print one line to state plainly whether you're analyzing live data or the deterministic sample — a report should never lie about its source.

```python
# aqi.py (continued)
SOURCE = "sample (deterministic)"
try:
    import requests
    r = requests.get("https://api.openaq.org/v2/measurements",
                     params={"city": "Stockholm", "parameter": "pm25", "limit": 168},
                     timeout=10)
    r.raise_for_status()
    results = r.json().get("results", [])
    if results:
        live = pd.DataFrame({
            "date": pd.to_datetime([m["date"]["utc"] for m in results]),
            "pm25": [float(m["value"]) for m in results],
        })
        df = live.sort_values("date").reset_index(drop=True)
        SOURCE = "live OpenAQ"
except Exception:
    pass   # network down, key missing, or API changed — sample it is

print("analyzing:", SOURCE)
```

The `try/except` blanket on the fetch is deliberate: an API that is down, moved, or needs a key should never kill a report. When the live path succeeds, `df` becomes real Stockholm air and the numbers in the rest of this project will differ — every Expected output below *assumes the deterministic sample*, so the source line keeps you grounded.

**🎯 Expected output:** `analyzing: sample (deterministic)` on a machine with no reliable OpenAQ access — and `analyzing: live OpenAQ` on one where the fetch lands.

**🩹 If it's off:** If you see a `KeyError` on `m["date"]` from a *successful* API call, OpenAQ's response shape changed — printing `results[0].keys()` is the fastest way to see the new fields, and the sample path still saves the project.

### 1.4 Verify the load

**✅ Checklist**

- ✅ `load_week()` returns `(168, 2)` with no nulls and no negative concentrations.
- ✅ `df["pm25"].min()` is about `3.1` and `df["pm25"].max()` about `40.7` (µg/m³) — believable urban range.
- ✅ One source line states whether you're running sample or live data.

**🤔 Socratic Question(s)**

- The sample's concentration profile *peaks at 6 a.m.*, the classic "morning inversion" when the layer where we breathe is at its shallowest. Which future step's math would change if you flipped the profile to peak at 3 p.m. instead — and why would the *category* labels be the real headache, not the averaging?
- Why cap the fetch at 168 rows (`limit=168`) instead of pulling "everything"? What breaks in a weekly report if a day's sensor goes silent mid-archive?

## Step 2: Turn concentrations into AQI

Raw µg/m³ means nothing to a non-scientist. The EPA turns it into the 0–500 AQI scale with a **breakpoint table**: ranges of concentrations map to ranges of AQI, connected by straight lines. This step writes that piecewise formula as a single honest Python function.

### 2.1 Write the breakpoint formula

**👟 Starter hint:** Implement `pm25_to_aqi(pm25)` — walk the EPA's PM2.5 breakpoint table in order, and for the matching band linearly scale the concentration into its AQI range.

```python
# aqi.py (continued)
def pm25_to_aqi(pm25: float) -> int:
    breakpoints = [
        (0.0, 12.0,  0,  50),   # Good
        (12.1, 35.4, 51, 100),  # Moderate
        (35.5, 55.4, 101, 150), # USG
        (55.5, 150.4, 151, 200),# Unhealthy
        (150.5, 250.4, 201, 300),
    ]
    for low, high, aqi_low, aqi_high in breakpoints:
        if low <= pm25 <= high:
            return round((aqi_high - aqi_low) / (high - low) * (pm25 - low) + aqi_low)
    return round((300 - 201) / (250.4 - 150.5) * (pm25 - 150.5) + 201) if pm25 > 250.4 else 0

print(pm25_to_aqi(12.0), pm25_to_aqi(30.0), pm25_to_aqi(35.4), pm25_to_aqi(50.0))
```

`(aqi_high - aqi_low) / (high - low)` is the slope of one AQI vs. concentration line segment; scaling `(pm25 - low)` and adding `aqi_low` slides you up that line — ordinary linear interpolation over the band. This is the entire EPA "standard" encoded in a `for` loop, which is exactly why the EPA itself publishes it as a table: four numbers per band, no magic.

**🎯 Expected output:** `50 89 100 137` — the clean-band edges map to integers (12.0 → 50, 35.4 → 100) and mid-band points interpolate (30.0 → 89, 50.0 → 137).

**🩹 If it's off:** If a band edge like `pm25_to_aqi(12.0)` prints `51` instead of `50`, your band boundary `(0.0, 12.0)` is exclusive on the left — every band must be `low <= pm25 <= high`. If output is a float with decimals, `round(...)` is missing; the AQI is a whole number by definition.

### 2.2 Apply it to the whole week

**👟 Starter hint:** `.apply(pm25_to_aqi)` on the `pm25` column — one function, 168 rows, one new integer column.

```python
# aqi.py (continued)
df["aqi"] = df["pm25"].apply(pm25_to_aqi)
print(df["aqi"].min(), df["aqi"].max())
print(df[df["date"] == "2025-03-04 06:00"])   # the worst hour, we suspect
```

`.apply` broadcasts the *same* pure function across every row — no loops, and no way to accidentally treat rows differently. Because the function has no state, it's trivially testable: verify three hand-computed values once, and the whole column inherits that confidence.

**🎯 Expected output:** `13 114`, and the row for `2025-03-04 06:00` shows `aqi` = `114` — the week's worst single reading, a "Unhealthy for Sensitive Groups" hour.

**🩹 If it's off:** If `min`/`max` are negative or absurd, `pm25_to_aqi` returned the `else 0` / fallback branch for most rows — print `df["pm25"].describe()` and spot-check a `pm25_to_aqi` call against a known band edge. If the 06:00 row prints a different `aqi`, your sample is live-path data (different numbers entirely — the sample is `(168, 2)` with pm25 max `40.7`).

### 2.3 Verify the conversion

**✅ Checklist**

- ✅ Hand-checked band edges hold: `12.0 → 50`, `35.4 → 100`.
- ✅ The whole-column range is `13..114`, integer, no NaNs.
- ✅ `.apply` added exactly one new column (`aqi`) without disturbing `date` or `pm25`.

**🤔 Socratic Question(s)**

- The piecewise formula interpolates *within* a band but jumps where bands meet (12.0 → AQI 50, but 12.1 → AQI 51). Invent a concentration, solve the formula, and tell me what AQI 50.6 would *mean* if the EPA hadn't rounded to integers — why does rounding to a whole number actually *help* public messaging?
- `pm25_to_aqi` returns `0` for anything below 0.0, yet `.clip(0, None)` guarantees non-negative input. When is the `return 0` branch still genuinely reachable, and what would a *functionally purist* reviewer say about keeping dead code around?

## Step 3: Label categories and hunt the worst hour

Now the frame gets its third and fourth columns: a human category for every AQI, then the roll-up questions — which hour of the week was worst, which was best, and what did the week look like by category?

### 3.1 Bucket AQI values into categories

**👟 Starter hint:** Write `category(aqi)` walking the EPA's category cutoffs, then `.apply` it and count with `value_counts()`.

```python
# aqi.py (continued)
def category(aqi: int) -> str:
    if aqi <= 50:   return "Good"
    if aqi <= 100:  return "Moderate"
    if aqi <= 150:  return "Unhealthy for Sensitive Groups"
    if aqi <= 200:  return "Unhealthy"
    return "Very Unhealthy"

df["category"] = df["aqi"].apply(category)
print(df["category"].value_counts())
```

Ordering the `if`s from cleanest to dirtiest and using `<=` at every cutoff means the *first* matching band wins — the classic "mutually exclusive bucket" rule. `value_counts()` descends by count, so the number-one line of the output is simultaneously the answer to "what kind of week was this?"

**🎯 Expected output:** `Moderate 132`, `Good 33`, `Unhealthy for Sensitive Groups 3` — a moderately polluted week with a handful of sensitive-group hours and no truly unhealthy air.

**🩹 If it's off:** If the counts don't sum to 168, the categories overlap or gap — check the `<=` boundaries for off-by-one overlap, or re-run with `df["category"].isna().sum()` to catch unlabeled rows. If everything is one bucket, `category` was applied to `aqi` but a cutoff ordering (e.g. `<= 100` before `<= 50`) made the early returns swallow everything.

### 3.2 Find the worst and best hours

**👟 Starter hint:** `idxmax`/`idxmin` on the `aqi` column, then row-lookup those indices — the week's story in two printouts.

```python
# aqi.py (continued)
worst = df.loc[df["aqi"].idxmax()]
best = df.loc[df["aqi"].idxmin()]
print("worst:", worst["date"], worst["pm25"], worst["aqi"])
print("best: ", best["date"], best["pm25"], best["aqi"])
```

`df["aqi"].idxmax()` returns the *index label* of the max row — pairing it with `.loc` is the two-step idiom for "find and show the record" that generalizes to any keyed lookup. With a datetime index this becomes time-series-native, which is exactly how a monitoring dashboard pulls "the alert was here, at this second".

**🎯 Expected output:** `worst: 2025-03-04 06:00:00 40.7 114` and `best:  2025-03-07 17:00:00 3.1 13` — Tuesday pre-dawn versus Friday late afternoon.

**🩹 If it's off:** If the wrong row shows, `idxmax` returned the max of a *float* column when `.loc[...]` matched a different frame — confirm `worst` is a row from `df`, not from a regrouped copy. If both print the same date, the `date` column isn't the index and `.loc[df["aqi"].idxmax()]` silently reused the integer label.

### 3.3 Verify the hunt

**✅ Checklist**

- ✅ Category counts sum to 168 with three distinct buckets.
- ✅ The worst hour's `aqi` (114) is `USG`, the best hour's (13) is `Good`.
- ✅ `worst` and `best` are real rows of `df`, not regrouped or copied frames.

**🤔 Socratic Question(s)**

- The weekday means were all within a couple of µg/m³ of each other, yet the *peak day* stands out in a report. Where does "aggregate by day, then rank days" start to mislead, and what single-row fact (the worst hour) do daily means actively hide?
- `value_counts()` sorts descending by default. Why is descending order the right *default* for this report — and what question would ascending order answer instead?

## Step 4: Print the citizen report

Charts are for eyeballing; a report is for acting. This step turns the aggregates from Step 3 into a few plain lines a reader can act on tonight — percentages, a peak hour, and the concrete advice dictionary that goes with each category.

### 4.1 Write the advice dictionary

**👟 Starter hint:** Map each category to one actionable sentence — the public-health "so what" of every AQI.

```python
# aqi.py (continued)
ADVICE = {
    "Good": "Open the windows — air is clean today.",
    "Moderate": "Fine for most people; sensitive folks, take it easy outside.",
    "Unhealthy for Sensitive Groups": "Sensitive groups: reduce prolonged outdoor exertion.",
    "Unhealthy": "Everyone: cut back prolonged or heavy outdoor effort.",
    "Very Unhealthy": "Stay indoors; keep windows shut.",
}
```

A dictionary maps the exact category strings to advice, so the report never *decides* what to say — it looks it up. Keeping advice as data rather than `if/elif` prose means the same dictionary could drive an SMS alert, a dashboard pill, or a poster, unchanged.

**🎯 Expected output:** No output from definition alone — but the dictionary must contain a key for exactly every string `category()` can produce.

**🩹 If it's off:** If the report later throws `KeyError`, a category string in `df["category"]` isn't in `ADVICE` — run `set(df["category"]) - set(ADVICE)` to print the orphans in one line.

### 4.2 Aggregate and print

**👟 Starter hint:** Compute the category percentages, the hour with the highest *mean* AQI, and the worst single reading, then `print` a tidy 6-line report.

```python
# aqi.py (continued)
df["hour"] = df["date"].dt.hour  # pull the clock value for hour-of-day aggregation

def print_report(df: pd.DataFrame, advice: dict[str, str]) -> None:
    counts = df["category"].value_counts()
    n = len(df)
    hourly_mean = df.groupby("hour")["aqi"].mean()
    peak_hour = int(hourly_mean.idxmax())
    peak_value = round(float(hourly_mean.max()))
    worst = df.loc[df["aqi"].idxmax()]

    print(f"Week: {n} hourly readings")
    print(f"Most common category: {counts.index[0]} ({counts.iloc[0]}h, {counts.iloc[0] / n * 100:.0f}%)")
    print(f"Peak pollution hour (avg AQI): {peak_hour:02d}:00 (~{peak_value})")
    print(f"Worst single hour: {worst['date']}  AQI {worst['aqi']}")
    print("Advice:", advice[counts.index[0]])

print_report(df, ADVICE)
```

`df["hour"] = df["date"].dt.hour` projects the timestamp down to the clock value — one `.dt` accessor call that turns a datetime column into the 24-way partition the report needs. Then `groupby("hour")["aqi"].mean()` collapses the week into 24 hourly averages, and `idxmax()` on that series finds the peak hour *per hour-of-day* — a natural-language fact ("pre-dawn is the worst stretch") rather than a spreadsheet artifact. `counts.index[0]` is the mode category, which the report pairs with its advice line so the reader gets one actionable sentence.

**🎯 Expected output:**

```
Week: 168 hourly readings
Most common category: Moderate (132h, 79%)
Peak pollution hour (avg AQI): 06:00 (~94)
Worst single hour: 2025-03-04 06:00:00  AQI 114
Advice: Fine for most people; sensitive folks, take it easy outside.
```

**🩹 If it's off:** If `counts.iloc[0] / n * 100` prints `79.0%` instead of `79%`, the `:.0f` format got dropped. If `peak_hour:02d` errors, `idxmax()` returned `numpy.float64` — wrap with `int(...)`. If the advice is for the wrong category, `advice[counts.index[0]]` looked up the mode row, but a wrong *mode* means `value_counts` wasn't run on the full week.

### 4.3 Verify the report

**✅ Checklist**

- ✅ The five lines reproduce the Expected output with the sample.
- ✅ Percentages sum to ~100 across categories.
- ✅ The advice line matches the mode category, not the worst hour's.

**🤔 Socratic Question(s)**

- The report prints advice for the *mode* category while flagging the *worst* hour. When does advising from the mode actively mislead — and how would you change one line to make the report's single actionable message honest for both a 79%-Moderate week and a 2%-Very-Unhealthy day?
- `hourly_mean.idxmax()` ignores *which* day the peak falls on, so "06:00" appears even though the worst hour was Tuesday. Re-express that Socratic gap as a one-line pandas operation that reports "Tuesday 06:00" instead — what does it change conceptually?

## Step 5: Plot the week and save it

A report tells; a chart shows. This step draws 24 hourly-mean AQI points with the 50 and 100 threshold lines annotated, and saves the figure as a PNG — the artifact you can actually put in a slides deck or message to a friend.

### 5.1 Plot mean AQI by hour

**👟 Starter hint:** `groupby("hour")["aqi"].mean()` again, `plt.plot` with markers, two threshold `axhline`s, and `Agg` so the plot renders headless (no display) in any environment.

```python
# aqi.py (continued)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def plot_week(df: pd.DataFrame, out: str = "aqi_week.png") -> None:
    hourly = df.groupby("hour")["aqi"].mean()
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(hourly.index, hourly.values, marker="o", label="mean AQI")
    ax.axhline(50, color="green", ls="--", lw=1, label="Good / Moderate")
    ax.axhline(100, color="orange", ls="--", lw=1, label="Moderate / USG")
    ax.set_xlabel("Hour of day")
    ax.set_ylabel("Mean AQI")
    ax.set_title("Average weekly AQI by hour of day")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out)
    plt.close(fig)

plot_week(df)
```

`matplotlib.use("Agg")` selects the headless renderer — it draws to a buffer and `savefig` writes the PNG, with zero dependence on a window system, which is what makes this cell platform-proof across notebooks and servers. The two `axhline`s carry the same breakpoint boundaries you encoded numerically in Step 2, but here as *visual* cut lines: any point above `100` is an orange-line violation at a glance.

**🎯 Expected output:** The figure shows an early-morning hump crossing the orange (USG) boundary around 06:00 and afternoon readings dipping into Good territory — matching `hourly_mean.max()` ≈ 94 in Step 4.

**🩹 If it's off:** If no file appears, `plt.close(fig)` ran before `savefig` or the path is wrong — put `savefig` before `close`. If the plot is empty, `hourly` is empty because `"hour"` column doesn't exist — the `hour` extraction happened in a copy, not on `df`. If the axes are swapped (hours on the y-axis), `hourly.index` and `hourly.values` went to the wrong arguments.

### 5.2 Confirm the artifact

**👟 Starter hint:** Verify the PNG exists and is non-empty before you sign off — the file on disk is the deliverable.

```python
# aqi.py (continued)
import os
print("exists:", os.path.exists("aqi_week.png"), "size:", os.path.getsize("aqi_week.png"), "bytes")
```

**🎯 Expected output:** `exists: True size: <a few tens of kB> bytes` — a real, openable PNG.

**🩹 If it's off:** If `exists: False`, the plot function never ran (check the file name passed to `savefig` vs the name checked). If the size is a handful of bytes, the renderer wrote an empty or placeholder file — re-run the cell and watch for an exception between `plot_week(df)` and the check.

### 5.3 Verify the plot

**✅ Checklist**

- ✅ The PNG exists, is non-empty, and shows the pre-dawn AQI hump crossing the 100 line.
- ✅ The 50 and 100 threshold lines have labels, and the legend renders.
- ✅ The chart is saved as `aqi_week.png` in the project directory.

**🤔 Socratic Question(s)**

- The two `axhline`s encode the *cutoffs* but not the *bands* — the chart can't show "USG hours" as shaded regardless of where the dots sit. What one matplotlib call would shade the band between 51 and 100, and why is shading usually *more* honest than the cut-lines for a lay reader?
- `savefig` writes pixels, so the chart is frozen the moment it's made. If you wanted the *same* notebook to ship a chart whose numbers updated with next week's data, which parts of `plot_week` would have to stay pure — and which part is inherently a side effect?

## ⚠️ Common pitfalls

- **Band boundaries that overlap.** If any band uses `< low` and the next uses `<= high`, the EPA cutoffs double-count and `value_counts` sums over 168. Every band must be `low <= pm25 <= high` and the bands must touch exactly.
- **Forgetting `.round(1) → AQI is an integer.** The AQI is whole numbers by definition; returning floats from `pm25_to_aqi` passes tests green but makes `groupby` means look absurd (e.g. `94.3333`).
- **`idxmax` on the wrong column.** `.idxmax` returns an *index label*; use `.loc[label]` on the *same* frame, or you'll silently display a different row's census.
- **Cat-and-mute dtypes in the report.** `f"{peak_hour:02d}"` needs an `int`; numpy floats raise `TypeError` on `:02d`. Wrap with `int(...)`.
- **Plotting on a headless runner without `Agg`.** Notebooks and servers have no display; `matplotlib.use("Agg")` before importing `pyplot` is the difference between a saved PNG and a `TclError`.
- **Advice dictionary drift.** `ADVICE` must contain a key for *every* string `category()` can emit; a new category added without a dictionary entry crashes the report at runtime.

## What you just built

A real air-quality pipeline: tidy hourly data in, a human report and a chart out. Along the way you encoded an entire regulatory standard (the EPA breakpoint table) as data, turned a numeric sensor column into categorical insight, and produced the two artifacts people actually consume — a plain-text statement of the week and a PNG that shows it. The transferable shape — load → transform with pure functions → aggregate → report + visualize — is the same skeleton behind sensor monitors, product dashboards, and weekly analytics emails.

:::tip[Run a fuller version without any local setup]
[`examples/air-quality/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/air-quality) in the course repo is the complete dashboard as a notebook — sample and live paths, report, and chart all in one place. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a second pollutant (PM10 or ozone) and a *combined* AQI — the pollutant that scores worst on a given hour drives the reporting value, which is how the real EPA AQI works.
- Re-key the frame on `df["date"]` and add `resample("D").mean()` so the weekly report can flag whole *days* above a threshold.
- Build the alert half: a function that returns "send SMS" when a category like `Unhealthy` appears more than N hours in a rolling 24 — then wire it to a cron/Playwright job.
- Swap the deterministic seed for your city's real OpenAQ data and diff the two reports — a memorable lesson in how much averages can hide.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓