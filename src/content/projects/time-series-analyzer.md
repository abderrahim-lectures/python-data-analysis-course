---
title: "Build a Time Series Analyzer"
description: "Decompose a time series into trend, seasonality, and residual with pandas; forecast forward, score the forecast, flag anomalies against a baseline, and correlate two series into a saved chart."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["pandas", "numpy", "data-viz"]
learningObjectives:
  - Generate and shape a datetime-indexed time series with pandas
  - "Decompose a series into trend, seasonality, and residual"
  - "Forecast forward with a trend-plus-season model"
  - Score forecast error with a backtest
  - Detect anomalies and correlate two series into a chart
prerequisites:
  - "Python basics (functions, loops)"
  - "Pandas DataFrames and Series (indexing, dtypes)"
  - "Installing packages with uv"
---

# 🛠️ 📈 Build a Time Series Analyzer

Temperature records, server load, web traffic, nearly everything real arrives as a sequence over time, and analysts spend their days separating what a series is *doing* into three signals: the slow drift (trend), the repeating rhythm (seasonality), and the leftover noise (residual). This project builds that decomposition from scratch with pandas, then uses the pieces: it forecasts next week with a trend-plus-season model, scores the forecast against a real holdout, flags dates that don't fit the pattern, and correlates two series into a chart you can actually save.

This assumes Python 101 and comfort with pandas Series, nothing from Data Analysis beyond that is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Generate a realistic café-guests series with a datetime index.
2. Decompose it into trend, seasonal, and residual components by hand.
3. Forecast the next week with a trend-plus-season model.
4. Backtest the forecast and measure its error on held-out days.
5. Detect anomalies and chart two correlated series to a PNG.

## Where to run this

**Locally with `uv`** is the primary path. pandas and NumPy install cleanly, matplotlib's non-interactive `Agg` backend (Step 5) renders charts even headless, and your chart files genuinely land in the project folder.

**Google Colab, Kaggle Notebooks, and Binder** run every step identically, all three libraries are pre-installed there. The honest caveat is the usual one for data-viz projects: a notebook's file system is ephemeral, so the saved PNG and any CSV you write may not survive a session restart. Treat them as try-it paths and switch to local `uv` when artifacts need to persist.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-series-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-series-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftime-series-analyzer%2Fnotebook.ipynb)

## Setup

Create the project and install the three libraries the analyzer is built on.

```bash
uv init time-series-analyzer
cd time-series-analyzer
uv add pandas numpy matplotlib
```

```bash
uv run python -c "import pandas, numpy, matplotlib; print('ok')"
```

`pandas` owns the datetime index, resampling, and the `groupby` used for seasonality; `numpy` supplies the seeded randomness and the `polyfit` regression in Step 3; `matplotlib` draws the final artifact. Installing all three up front keeps every later step focused on the *time-series* ideas.

**✅ Checklist**

- ✅ `uv add pandas numpy matplotlib` finished and the import check prints `ok`.
- ✅ A fresh `time-series-analyzer/` project exists with a `pyproject.toml`.

## Step 1: Build and shape a datetime-indexed series

Time series analysis lives or dies on the index: every window, weekday, and lag downstream assumes each row knows *when* it is. This step generates a realistic daily series and gives it a proper `DatetimeIndex`.

### 1.1 Generate the café-guests series

**👟 Starter hint:** Build the series from three deliberately named parts, a linear trend, a weekly sine seasonality keyed on `dayofweek`, and seeded noise, so the decomposition in Step 2 has real structure to recover.

```python
# series.py
import numpy as np
import pandas as pd

def make_cafe_guests(days: int = 365, seed: int = 42) -> pd.Series:
    rng = np.random.default_rng(seed)
    idx = pd.date_range("2025-01-01", periods=days, freq="D")
    trend = np.linspace(100, 140, days)
    weekly = 8 * np.sin(2 * np.pi * idx.dayofweek / 7)
    noise = rng.normal(0, 5, days)
    return pd.Series(trend + weekly + noise, index=idx, name="guests")

s = make_cafe_guests()
print(s.head(3))
print("index type:", type(s.index).__name__, "| dtype:", s.dtype)
```

`idx.dayofweek` is the crucial pandas accessor: it yields 0–6 (Monday–Sunday) for every row, and multiplying by `2π/7` phases the sine so weekdays alternate high and low, real *weekly* seasonality, not a random wobble. `np.random.default_rng(seed)` is the modern NumPy seeding API; the fixed seed makes the noise reproducible. Returning a `Series` with `index=idx, name="guests"` means every later function (rolling windows, `groupby` on weekday, plotting) gets the timestamps for free.

**🎯 Expected output:** Three dated rows (starting `2025-01-01`), values near 100, plus `index type: DatetimeIndex | dtype: float64`.

**🩹 If it's off:** If the index type prints `RangeIndex` or `Index`, the `pd.Series(..., index=idx)` assignment is missing and downstream weekday math has nothing to hook onto. If values sit near 1000 rather than ~100–150, `trend` and `weekly` were reversed. If the series is not reproducible across runs, the `seed` argument isn't reaching `default_rng`.

### 1.2 Verify the series shape

**✅ Checklist**

- ✅ `s` has a `DatetimeIndex` covering 365 days at daily frequency.
- ✅ `s.index.dayofweek` runs 0–6 repeatedly and `s.dtype` is a float.
- ✅ The same `seed` produces the identical series on a second call.

**🤔 Socratic Question(s)**

- The seasonality is built from `dayofweek`, so it repeats weekly. How would the model differ if the series instead used `idx.dayofyear`, and which one would you trust for annual (holiday) patterns?
- Values are floats to one implicit precision, but real café counters are integers. When does keeping float noise matter for the decomposition, and when would you round to whole guests first?

## Step 2: Decompose into trend, seasonality, and residual

A trend is "what the series does slowly"; seasonality is "the rhythm that repeats"; residual is "everything else." This step computes all three directly, a rolling mean for the trend, weekday averages for the seasonality, and whatever's left as the residual.

### 2.1 Write the additive decomposition

**👟 Starter hint:** Museum-curator order matters, trend first (rolling mean), then `series - trend` for the detrended remainder, then weekday averages of that remainder as seasonality, then `detrended - seasonal` as residual.

```python
# series.py (continued)
def decompose(series: pd.Series, window: int = 14) -> tuple[pd.Series, pd.Series, pd.Series]:
    trend = series.rolling(window, center=True).mean()
    detrended = series - trend
    seasonal = detrended.groupby(series.index.dayofweek).transform("mean")
    residual = detrended - seasonal
    return trend, seasonal, residual

trend, seasonal, residual = decompose(s)
print(seasonal.groupby(seasonal.index.dayofweek).first().to_string())
print("residual std: {:.2f}".format(residual.std()))
```

The rolling mean with `center=True` is the trend estimator: each point becomes the average of its ±7-day neighborhood, which smooths the weekly cycle while preserving slow drift. Subtracting it (`detrended`) leaves the pure rhythm plus noise, and `groupby(dayofweek).transform("mean")` is the tidy seasonality trick, it computes the average for each weekday *and broadcasts it back* to every row with that weekday, so `seasonal` has the same length as `series`. The residual is just whatever survived both subtractions, and its standard deviation is your first correctness signal: it should be far below the raw series' `std`.

**🎯 Expected output:** Seven rows (one per weekday) of seasonal offset, plus a `residual std` around 4–6, clearly smaller than the raw series' spread of ~16.

**🩹 If it's off:** If `seasonal` has `NaN` rows on the edges, the `center=True` window leaves the first/last 7 days undefined, expected, filter with `.dropna()`. If the residual std is near zero, the noise term never made it into the generator. If weekday offsets vary wildly between rows of the same weekday, `transform` was replaced by `apply`, `transform` is what broadcasts to every row.

### 2.2 Verify the decomposition

**✅ Checklist**

- ✅ `trend + seasonal + residual` reconstructs the original series (within float error).
- ✅ Each of the seven weekdays has exactly one seasonal value.
- ✅ The residual's standard deviation is smaller than the series' `std()`.

**🤔 Socratic Question(s)**

- A rolling mean is a *low-pass filter* on the series. What happens to a genuine one-off spike in Step 4's `residual` if the trend window is enormous (say 90 days) instead of 14, and when would that be useful or harmful?
- The seasonal value is a per-weekday average, so it treats all five Mondays of a month as identical. What would change if seasonality itself drifted across the year (winter vs summer)?

## Step 3: Forecast with trend plus seasonality

Decomposition pays for itself here: instead of fitting one model to raw noise, you extend the learned trend and add the learned rhythm back. This step forecasts the next seven days from the two clean components.

### 3.1 Fit a line on the trend and add back seasonality

**👟 Starter hint:** Fit `np.polyfit` degree-1 on the last 30 real values, extend that line 30→37 days ahead, then add the price of `seasonal` for each future weekday.

```python
# series.py (continued)
def forecast_next(series: pd.Series, seasonal: pd.Series,
                  horizon: int = 7, window: int = 30) -> pd.Series:
    X = np.arange(window)
    y = series.tail(window).values
    slope, intercept = np.polyfit(X, y, 1)

    future = pd.date_range(series.index[-1] + pd.Timedelta(days=1),
                           periods=horizon, freq="D")
    linear = intercept + slope * np.arange(window, window + horizon)
    weekly = seasonal[future.dayofweek].values
    return pd.Series(linear + weekly, index=future, name="forecast")

fc = forecast_next(s, seasonal)
print(fc.round(1).to_string())
```

`np.polyfit(X, y, 1)` finds the best straight line through the last `window` real values, the slopes you get, and the intercept places it. Forecasting is then arithmetic: extend that line to indices `window … window+horizon` (X-axis positions *after* the training window), and add `seasonal[future.dayofweek]` so each day's weekly rhythm rides on top of the line. Doing the trend and rhythm separately, rather than forecasting raw noisy values with one model, is the whole point of Step 2.

**🎯 Expected output:** Seven dated values, roughly 140–160 and *not* a straight ramp, weekdays visibly ride the weekly sine.

**🩹 If it's off:** If the forecast is constant, `np.polyfit` returned a ~zero slope because `window` was too short or `y` wasn't the tail. If the forecast is jagged noise, `weekly` hasn't been added and only the line survived. If dates land *before* the series end, the `pd.Timedelta(days=1)` offset is missing.

### 3.2 Verify the forecast

**✅ Checklist**

- ✅ The forecast covers exactly the 7 days after the series' last date.
- ✅ Forecast values track the weekly rhythm (peaks/valleys per weekday), not a straight line.
- ✅ Extending the horizon to 14 still lands after a plausible continuation.

**🤔 Socratic Question(s)**

- Fitting a straight line assumes a constant rate of growth. What shape would the forecast take if the *true* trend were accelerating, and where does the straight-line assumption fail most visibly on real data?
- The forecast uses the last 30 points' slope. How would the next-week forecast change if you instead fit the line on the *entire* year's trend component, and which choice feels more robust, and why?

## Step 4: Backtest the forecast and measure error

A forecast you can't score is a guess. Backtesting re-fits the model on the data *before* a held-out week and compares its predictions to the values that week actually took, the honest way to know if your model is any good before you trust it forward.

### 4.1 Score the forecast against holdout

**👟 Starter hint:** Repeat Step 3's forecast using only `series.iloc[:-horizon]` for training, then compute the mean absolute error against the held-out last week.

```python
# series.py (continued)
def backtest(series: pd.Series, seasonal: pd.Series,
             horizon: int = 7, window: int = 30) -> float:
    train = series.iloc[:-horizon]
    fc = forecast_next(train, seasonal, horizon=horizon, window=window)
    actual = series.iloc[-horizon:]
    mae = float((fc - actual).abs().mean())
    return mae

print("MAE on held-out week: {:.2f} guests".format(backtest(s, seasonal)))
```

`series.iloc[:-horizon]` carves off the last week, the model literally cannot see those days, and `forecast_next` runs on what remains, so the comparison `fc - actual` is a genuine out-of-sample test. Reporting **mean absolute error** (`abs().mean()`) keeps the units human: "off by ~4 guests", not a squared number nobody feels. The seasonal component is passed in unchanged; the honest shortcut is that the *rhythm* was learned from the full series, while the *trend* was refit on the truncated data, a fixable tightening documented as such.

**🎯 Expected output:** A MAE in the low single digits (roughly 3–6 guests), consistently far below a naive guess like predicting the overall mean.

**🩹 If it's off:** If MAE inflates to 20+, the forecast still includes next-week seasonality built from the full series but the trend fit is being computed on an empty frame, check `train` isn't empty. If `fc` and `actual` misalign, `forecast_next` produces dates beyond `train.index[- horizon]`, confirm the `days=1` offset. If the score drifts between runs, `seasonal` came from a differently-seeded series.

### 4.2 Verify the backtest

**✅ Checklist**

- ✅ `backtest` reports a single float in guest units.
- ✅ The training set ends *before* the held-out week begins.
- ✅ Re-running with `horizon=14` produces a larger (or equal) error than 7.

**🤔 Socratic Question(s)**

- MAE treats over- and under-prediction equally. What would **root mean squared error (RMSE)** emphasize instead, and why would a café with occasional huge holiday spikes prefer it despite being less intuitive?
- The trend is refit on `train` but seasonality leaks from the full series. In what real workflow is that leak acceptable, and how would you close it completely if a client asked for a strict evaluation?

## Step 5: Detect anomalies and chart the pair

Two closing moves turn the analyzer into a finished artifact: flag dates where reality didn't fit the model (large residuals), and chart the series against a correlated peer, saved as a file you can share.

### 5.1 Flag anomalies and draw the correlation chart

**👟 Starter hint:** Z-score the residual to find outliers, then correlate the guests series with a spend series and save the overlay as a PNG with the headless `Agg` backend.

```python
# series.py (continued)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def detect_anomalies(residual: pd.Series, threshold: float = 2.5) -> pd.Series:
    z = (residual - residual.mean()) / residual.std()
    return z[z.abs() > threshold]

anoms = detect_anomalies(residual.dropna())
print(f"anomalies: {len(anoms)} -> {anoms.index[:8].tolist()}")

def make_spend(seed: int = 7) -> pd.Series:
    guests = make_cafe_guests(seed=seed)
    rng = np.random.default_rng(seed)
    return guests * 3.2 + rng.normal(0, 30, len(guests))

spend = make_spend()
print("correlation:", round(s.corr(spend), 2))

fig, ax = plt.subplots(figsize=(11, 4))
ax.plot(s.index, s.values, label="guests")
ax.plot(spend.index, spend.values / 3.2, alpha=0.5, label="spend / 3.2")
ax.legend(); ax.set_title("Café guests vs spend (scaled)")
fig.tight_layout()
fig.savefig("series.png", dpi=100)
```

`(residual - residual.mean()) / residual.std()` converts each residual into a z-score, "how many standard deviations off-pattern is this day?", and the `> 2.5` cutoff keeps honest outliers (a 3-sigma day) without flagging half the file. The correlation is the summary statistic: `s.corr(spend)` returns one number in [-1, 1], and values near 0.9 tell you the two metrics move together. On the chart, dividing `spend` by its rough multiplier overlays both series on the same scale, a visual claim the `.corr()` number then confirms.

**🎯 Expected output:** A count of anomalies (a handful at most), a correlation near `0.9`, and a `series.png` file showing the two series tracking each other.

**🩹 If it's off:** If `detect_anomalies` flags dozens of days, the data was decomposed with a `window` too small to smooth noise, widen it. If the correlation prints `NaN`, one series has a different index alignment after `.dropna()`, align with `.align()` or compute on the shared index. If no PNG appears, `savefig` runs from a working directory you can't see, print `Path("series.png").resolve()` to confirm where it landed.

### 5.2 Verify the finished analyzer

**✅ Checklist**

- ✅ Anomaly count is small (single digits per year of data) and the flagged dates are plausible surprises.
- ✅ `s.corr(spend)` is a float clearly above 0.5.
- ✅ `series.png` exists on disk showing both series moving together.
- ✅ The whole pipeline runs top to bottom as one script with zero edits.

**🤔 Socratic Question(s)**

- The spend series was *built* from guests, so the near-1.0 correlation is engineered. What does a real, lower correlation (say 0.4) imply about whether a café should plan staffing from guest counts, and what does it *not* prove about one causing the other?
- Anomaly flags point to model failures and real events at the same time. If the café closed for a renovation, would that show up as a positive or negative z-score, and how would you tell "interesting anomaly" from "broken model" without calling the café?

## ⚠️ Common pitfalls

- **A plain `RangeIndex` instead of `DatetimeIndex`.** Rolling windows still run, but `dayofweek`, resampling, and future-date generation all break. Fix: construct every series with `index=idx` from Step 1 and verify `type(s.index)` early.
- **`NaN` from centered windows.** `rolling(center=True)` leaves undefined edges; feeding those into `groupby` or plotting makes the chart and stats quietly drop days. Fix: `.dropna()` on trend, seasonal, and residual at the boundary you need.
- **Fitting trend on noise instead of the tail.** `polyfit` on a too-short `window` produces a slope that's mostly the noise. Fix: fit on at least a month of real values (30+) and let seasonality be added after, not during.
- **Seasonality that leaks into a "strict" backtest.** Passing the full-series `seasonal` into `backtest` makes the score flattering. Fix: recompute seasonal from `train` inside the backtest if the number is for a client.
- **Correlation with misaligned indices.** After `.dropna()` or a filtered morning slice, two series can disagree on dates and `.corr()` returns `NaN` or a misleading number. Fix: `.align()` or slice both to the shared index before scoring.

## What you just built

A complete time series analyzer: a generated daily series, a hand-built additive decomposition into trend/seasonality/residual, a trend-plus-season forecast with a backtested MAE, anomaly detection on the residual, and a correlated pair chart saved to disk. The transferable skill is *separating signal from noise*: break any noisy sequence into slow drift, repeating rhythm, and leftover residual, then forecast the parts and flag the rest, the same recipe behind demand planning, monitoring, and the "what actually changed?" question.

:::tip[Run a fuller version without any local setup]
[`examples/time-series-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/time-series-analyzer) in the course repo is a fuller version of the code above, with a four-component decomposition and SARIMA-style trend fitting. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add the missing fourth component, trading-day or holiday effects, by one more `groupby` pass over the residual.
- Replace the manual line fit with `numpy.polyfit` degree 2 and use the AIC-style comparison to decide whether the curve earned its extra parameter.
- Sweep the `threshold` in `detect_anomalies` from 1.5 to 4 and print how many days each flags, so the cutoff stops being magic.
- Write the forecast plus the z-scores to a single CSV so the shell script that emails the café manager can read one file, not three.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓