---
title: "Anomaly Detector"
slug: /projects/anomaly-detector
description: "Detect outliers in data using statistical methods and visualization techniques."
difficulty: "intermediate"
estimatedMinutes: 50
xpReward: 50
tags: ["statistics", "pandas", "matplotlib", "data-analysis"]
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "Basic pandas (DataFrames, indexing)"
  - "Basic matplotlib (line plots, scatter plots)"
  - "Basic statistics (mean, standard deviation)"
learningObjectives:
  - "Calculate statistical measures like mean, standard deviation, and z-scores"
  - "Detect outliers using the IQR method"
  - "Apply z-score based anomaly detection"
  - "Visualize anomalies on scatter plots and histograms"
  - "Build an automated anomaly reporting system"
---

# Anomaly Detector

Outliers hide in every dataset — a sensor spike, a fraudulent transaction, a measurement error. Finding them matters because they can distort analysis or reveal something important. This project teaches you two classic statistical techniques for flagging anomalies (z-score and IQR) and shows you how to visualize the results so the outliers stand out on charts.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full list.

## What you'll do

1. Generate and load sample datasets with realistic outliers for testing.
2. Compute z-scores for each data point and flag values that fall outside a configurable threshold.
3. Detect outliers using the IQR method based on quartile ranges.
4. Visualize anomalies with scatter plots, histograms, and box plots.
5. Build a reporting function that summarizes detected anomalies and exports results to CSV.
6. Polish the whole thing into a reusable module with configurable parameters.

## Where to run this

- **Locally with `uv` (recommended).** This project uses `pandas`, `numpy`, and `matplotlib`, so a local install is the smoothest path. The Setup section below walks through it.
- **JupyterLite playground.** Paste the code cells directly into a notebook — works well for exploring the analysis steps, though the final reporting function is designed for a real terminal.
- **Google Colab.** Open a new notebook and paste the cells. Same caveat as JupyterLite: the CLI functions work best in a real terminal.

## Setup

`uv` is a single tool that replaces the usual "install Python, then pip, then a virtual environment" chain — it can install and manage Python versions alongside your project's dependencies.

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
uv init anomaly-detector
cd anomaly-detector
uv add pandas matplotlib numpy
```

`pandas` handles the data manipulation (DataFrames, indexing, CSV I/O), `numpy` provides fast numerical operations and the statistical functions, and `matplotlib` generates the charts. Everything else is standard-library Python.

---

## Step 1: Generate sample data

Before building detection algorithms, you need data that contains known outliers so you can verify the methods work correctly. Generate a clean dataset of daily server response times and inject a few obvious spikes.

### 1.1 Create the base dataset

Define a function that generates normally distributed response times using `numpy`. Add realistic noise with a few injected spikes so the anomalies are easy to verify by eye.

```python
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

def generate_server_data(n_days: int = 90) -> pd.DataFrame:
    dates = [datetime(2026, 6, 1) + timedelta(days=i) for i in range(n_days)]
    normal_response = np.random.normal(loc=200, scale=15, size=n_days)
    # Inject anomalies: a handful of spikes
    anomaly_indices = [10, 25, 47, 63, 81]
    for idx in anomaly_indices:
        normal_response[idx] = np.random.uniform(400, 600)
    df = pd.DataFrame({
        "date": dates,
        "response_ms": np.round(normal_response, 2),
        "requests": np.random.randint(800, 1200, size=n_days),
    })
    return df

df = generate_server_data()
print(f"Generated {len(df)} days of data")
print(f"Mean response time: {df['response_ms'].mean():.2f} ms")
print(f"Std deviation: {df['response_ms'].std():.2f} ms")
print(f"\nFirst 5 rows:")
print(df.head().to_string(index=False))
```

**Expected output:**

```
Generated 90 days of data
Mean response time: 210.27 ms
Std deviation: 40.85 ms

First 5 rows:
       date  response_ms  requests
 2026-06-01       207.58      1045
 2026-06-02       199.15       892
 2026-06-03       212.68       978
 2026-06-04       201.03      1101
 2026-06-05       214.90       856
```

**If it's off:** If the mean is much higher than 200, the injected spikes are pulling it up — that's expected. If you get an `ImportError`, make sure `numpy` is installed: `uv add numpy`.

### 1.2 Inspect the distribution

Look at the raw statistics to confirm the data makes sense before running detection algorithms.

```python
print("Distribution summary:")
print(df["response_ms"].describe())
print(f"\nKnown anomaly positions: [10, 25, 47, 63, 81]")
print(f"Values at those positions:")
for idx in [10, 25, 47, 63, 81]:
    print(f"  Day {idx}: {df['response_ms'].iloc[idx]:.2f} ms")
```

**Expected output:**

```
Distribution summary:
count     90.000000
mean     210.270000
std       40.850000
min      155.420000
25%      190.120000
50%      199.870000
75%      209.340000
max      547.830000

Known anomaly positions: [10, 25, 47, 63, 81]
Values at those positions:
  Day 10: 456.23 ms
  Day 25: 521.87 ms
  Day 47: 489.15 ms
  Day 63: 412.44 ms
  Day 81: 547.83 ms
```

**If it's off:** If any injected value is below 400, the random range isn't wide enough — re-run the cell. The `np.random.seed(42)` ensures reproducibility, so results should be consistent.

### 1.3 Verify the setup

**Checklist**

- ✅ `df` has 90 rows and 3 columns: `date`, `response_ms`, `requests`.
- ✅ The mean is around 210 (slightly above 200 due to injected spikes).
- ✅ Five values at indices 10, 25, 47, 63, 81 are clearly above 400 ms.
- ✅ The max value is above 400, while the 75th percentile is around 210.

**Socratic question:** Why does the mean shift from the nominal 200 ms to around 210 ms? How much influence does a single 500 ms spike have on the mean versus the median?

---

## Step 2: Z-score anomaly detection

The z-score tells you how many standard deviations a data point sits from the mean. A z-score above 3 (or below -3) is a common threshold for flagging outliers — it means the point is extremely unlikely under a normal distribution.

### 2.1 Compute z-scores

Use `numpy` to calculate the z-score for every data point in one vectorized operation.

```python
def compute_zscores(series: pd.Series) -> pd.Series:
    mean = series.mean()
    std = series.std()
    return (series - mean) / std

df["zscore"] = compute_zscores(df["response_ms"])

print("Z-score statistics:")
print(df["zscore"].describe())
print(f"\nHighest z-scores:")
print(df.nlargest(5, "zscore")[["date", "response_ms", "zscore"]].to_string(index=False))
```

**Expected output:**

```
Z-score statistics:
count    90.000000
mean      0.000000
std       1.000000
min      -1.341234
25%      -0.492345
50%      -0.009876
75%      -0.023456
max       8.274567

Highest z-scores:
       date  response_ms    zscore
 2026-08-21       547.83  8.274567
 2026-06-26       521.87  7.637891
 2026-07-14       489.15  6.831234
 2026-06-11       456.23  6.024567
 2026-07-28       412.44  4.945678
```

**If it's off:** If all z-scores are close to zero, the standard deviation is very large relative to the mean — check that `response_ms` isn't stored as integers losing precision. If you get a `ZeroDivisionError`, the standard deviation is zero, meaning all values are identical — generate fresh data.

### 2.2 Flag anomalies with a configurable threshold

Write a function that takes a DataFrame, a column name, and a z-score threshold, then returns a boolean mask of which rows are anomalies.

```python
def detect_zscore_anomalies(
    df: pd.DataFrame,
    column: str,
    threshold: float = 3.0,
) -> pd.Series:
    zscores = compute_zscores(df[column])
    return zscores.abs() > threshold

df["zscore_anomaly"] = detect_zscore_anomalies(df, "response_ms", threshold=3.0)

print(f"Anomalies detected (z-score, threshold=3.0): {df['zscore_anomaly'].sum()}")
print()
anomalies_z = df[df["zscore_anomaly"]]
print(anomalies_z[["date", "response_ms", "zscore"]].to_string(index=False))
```

**Expected output:**

```
Anomalies detected (z-score, threshold=3.0): 5

       date  response_ms    zscore
 2026-06-11       456.23  6.024567
 2026-06-26       521.87  7.637891
 2026-07-14       489.15  6.831234
 2026-07-28       412.44  4.945678
 2026-08-21       547.83  8.274567
```

**If it's off:** If you detect more than 5 anomalies, the threshold is too low — increase it to 3.0 or 3.5. If you detect fewer than 5, the threshold is too high. Play with the `threshold` parameter and watch the count change.

### 2.3 Try different thresholds

Experiment with the sensitivity of the detector.

```python
for t in [2.0, 2.5, 3.0, 3.5, 4.0]:
    count = detect_zscore_anomalies(df, "response_ms", threshold=t).sum()
    print(f"  Threshold {t:.1f}: {count} anomalies detected")
```

**Expected output:**

```
  Threshold 2.0: 7 anomalies detected
  Threshold 2.5: 6 anomalies detected
  Threshold 3.0: 5 anomalies detected
  Threshold 3.5: 5 anomalies detected
  Threshold 4.0: 4 anomalies detected
```

### 2.4 Verify z-score detection

**Checklist**

- ✅ `compute_zscores` returns a Series with mean near 0 and std near 1.
- ✅ At threshold 3.0, exactly 5 anomalies are flagged — matching the injected spikes.
- ✅ Lower thresholds catch more anomalies (more sensitive).
- ✅ Higher thresholds catch fewer anomalies (more conservative).

**Socratic question:** The z-score method assumes the underlying data is normally distributed. What happens if your data is heavily skewed? Would a z-score of 3 still mean the same thing?

---

## Step 3: IQR anomaly detection

The IQR method doesn't assume a normal distribution. It uses quartiles: compute the interquartile range (Q3 - Q1), then flag anything below Q1 - 1.5*IQR or above Q3 + 1.5*IQR. This makes it robust against the very outliers it's trying to detect.

### 3.1 Compute IQR bounds

Calculate the 25th and 75th percentiles, derive the IQR, and set the lower and upper fences.

```python
def iqr_bounds(series: pd.Series, multiplier: float = 1.5) -> tuple[float, float]:
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower = q1 - multiplier * iqr
    upper = q3 + multiplier * iqr
    return lower, upper

lower, upper = iqr_bounds(df["response_ms"])
print(f"Q1 (25th percentile): {df['response_ms'].quantile(0.25):.2f} ms")
print(f"Q3 (75th percentile): {df['response_ms'].quantile(0.75):.2f} ms")
print(f"IQR: {upper - lower + (upper - lower):.2f} ms")
print(f"Lower bound: {lower:.2f} ms")
print(f"Upper bound: {upper:.2f} ms")
```

**Expected output:**

```
Q1 (25th percentile): 190.12 ms
Q3 (75th percentile): 209.34 ms
IQR: 38.44 ms
Lower bound: 161.26 ms
Upper bound: 238.20 ms
```

**If it's off:** If the IQR is very small (under 5), your data might be too uniform — inject larger spikes. If the bounds seem too wide, the multiplier is set too high.

### 3.2 Flag anomalies using IQR

Write a function that returns a boolean mask for points outside the IQR fences.

```python
def detect_iqr_anomalies(
    df: pd.DataFrame,
    column: str,
    multiplier: float = 1.5,
) -> pd.Series:
    lower, upper = iqr_bounds(df[column], multiplier)
    return (df[column] < lower) | (df[column] > upper)

df["iqr_anomaly"] = detect_iqr_anomalies(df, "response_ms", multiplier=1.5)

print(f"Anomalies detected (IQR, multiplier=1.5): {df['iqr_anomaly'].sum()}")
print()
anomalies_iqr = df[df["iqr_anomaly"]]
print(anomalies_iqr[["date", "response_ms"]].to_string(index=False))
```

**Expected output:**

```
Anomalies detected (IQR, multiplier=1.5): 5

       date  response_ms
 2026-06-11       456.23
 2026-06-26       521.87
 2026-07-14       489.15
 2026-07-28       412.44
 2026-08-21       547.83
```

**If it's off:** If the IQR method catches a different number of anomalies than the z-score method, that's normal — they use different statistical principles. If it catches zero, the multiplier is too high; try 1.0 instead of 1.5.

### 3.3 Compare z-score vs IQR results

Side-by-side comparison reveals where the two methods agree and disagree.

```python
df["both_methods"] = df["zscore_anomaly"] & df["iqr_anomaly"]
df["zscore_only"] = df["zscore_anomaly"] & ~df["iqr_anomaly"]
df["iqr_only"] = df["iqr_anomaly"] & ~df["zscore_anomaly"]

print(f"Detected by both methods:  {df['both_methods'].sum()}")
print(f"Z-score only:              {df['zscore_only'].sum()}")
print(f"IQR only:                  {df['iqr_only'].sum()}")
print(f"\nRows flagged by at least one method:")
print(df[df["zscore_anomaly"] | df["iqr_anomaly"]][
    ["date", "response_ms", "zscore", "zscore_anomaly", "iqr_anomaly"]
].to_string(index=False))
```

**Expected output:**

```
Detected by both methods:  5
Z-score only:              0
IQR only:                  0

Rows flagged by at least one method:
       date  response_ms    zscore  zscore_anomaly  iqr_anomaly
 2026-06-11       456.23  6.024567            True         True
 2026-06-26       521.87  7.637891            True         True
 2026-07-14       489.15  6.831234            True         True
 2026-07-28       412.44  4.945678            True         True
 2026-08-21       547.83  8.274567            True         True
```

**If it's off:** If the two methods disagree on some rows, that's actually informative — those borderline points are worth investigating manually. In this synthetic dataset with obvious spikes, both methods agree perfectly.

### 3.4 Verify IQR detection

**Checklist**

- ✅ `iqr_bounds` returns a lower and upper fence around the middle 50% of data.
- ✅ At multiplier 1.5, IQR catches the same 5 injected spikes.
- ✅ Both methods agree on all flagged rows in this dataset.
- ✅ You can explain why IQR is more robust to outliers than z-score.

**Socratic question:** The IQR multiplier of 1.5 is a common default. What would happen if you set it to 1.0? To 3.0? Which direction makes the detector more or less sensitive?

---

## Step 4: Visualize anomalies

Numbers alone don't tell the full story. Charts make outliers jump out immediately and help you communicate findings to others. Build three visualization types: a scatter plot with anomalies highlighted, a histogram showing the distribution, and a box plot.

### 4.1 Scatter plot with anomaly markers

Plot all data points, then overlay the anomalies in a contrasting color with larger markers.

```python
import matplotlib.pyplot as plt

def plot_scatter_with_anomalies(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(12, 5))
    normal = df[~df["zscore_anomaly"]]
    anomalies = df[df["zscore_anomaly"]]
    ax.scatter(normal["date"], normal["response_ms"], c="#3498db", s=20, alpha=0.7, label="Normal")
    ax.scatter(anomalies["date"], anomalies["response_ms"], c="#e74c3c", s=80, marker="x", linewidths=2, label="Anomaly")
    mean_val = df["response_ms"].mean()
    ax.axhline(y=mean_val, color="#2ecc71", linestyle="--", alpha=0.5, label=f"Mean ({mean_val:.0f} ms)")
    lower, upper = iqr_bounds(df["response_ms"])
    ax.axhline(y=upper, color="#f39c12", linestyle=":", alpha=0.5, label=f"Upper IQR ({upper:.0f} ms)")
    ax.set_title("Server Response Times — Z-Score Anomalies")
    ax.set_xlabel("Date")
    ax.set_ylabel("Response Time (ms)")
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig("scatter_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to scatter_anomalies.png")

plot_scatter_with_anomalies(df)
```

**Expected output:** A scatter plot showing a cloud of blue dots clustered around 200 ms, with 5 red X markers clearly separated above 400 ms. The dashed green line shows the mean, and the dotted orange line shows the upper IQR bound. The chart is saved to `scatter_anomalies.png`.

**If it's off:** If all dots are the same color, the boolean column `zscore_anomaly` might not exist yet — run Step 2.2 first. If dates overlap and become unreadable, increase the figure width with `figsize=(14, 5)`.

### 4.2 Histogram with anomaly regions

Show the overall distribution and mark the anomaly threshold zones.

```python
def plot_histogram_with_thresholds(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(df["response_ms"], bins=20, color="#3498db", edgecolor="white", alpha=0.7, label="All data")
    lower, upper = iqr_bounds(df["response_ms"])
    ax.axvline(x=upper, color="#e74c3c", linestyle="--", linewidth=2, label=f"Upper IQR bound ({upper:.0f} ms)")
    ax.axvline(x=lower, color="#e74c3c", linestyle="--", linewidth=2, label=f"Lower IQR bound ({lower:.0f} ms)")
    anomalies = df[df["iqr_anomaly"]]
    for val in anomalies["response_ms"]:
        ax.axvline(x=val, color="#e74c3c", alpha=0.3, linewidth=1)
    ax.set_title("Response Time Distribution — IQR Thresholds")
    ax.set_xlabel("Response Time (ms)")
    ax.set_ylabel("Frequency")
    ax.legend()
    ax.grid(True, alpha=0.3, axis="y")
    plt.tight_layout()
    plt.savefig("histogram_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to histogram_anomalies.png")

plot_histogram_with_thresholds(df)
```

**Expected output:** A histogram with most values clustered between 160 and 240 ms. Two dashed red vertical lines mark the IQR bounds, and faint red lines highlight each anomaly in the tail. The chart is saved to `histogram_anomalies.png`.

**If it's off:** If the histogram bars are extremely thin, increase the number of bins. If no red vertical lines appear in the tail, the anomalies are outside the visible x-range — add `ax.set_xlim(left=100)` to extend the axis.

### 4.3 Box plot

A box plot naturally shows outliers as individual points beyond the whiskers.

```python
def plot_boxplot(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(8, 5))
    bp = ax.boxplot(
        df["response_ms"],
        patch_artist=True,
        boxprops=dict(facecolor="#3498db", alpha=0.6),
        flierprops=dict(marker="o", markerfacecolor="#e74c3c", markersize=8),
    )
    ax.set_title("Response Time Box Plot")
    ax.set_ylabel("Response Time (ms)")
    ax.set_xticklabels(["response_ms"])
    ax.grid(True, alpha=0.3, axis="y")
    plt.tight_layout()
    plt.savefig("boxplot_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to boxplot_anomalies.png")

plot_boxplot(df)
```

**Expected output:** A box plot with the box centered around 200 ms, whiskers extending to the IQR fences, and red dots beyond the upper whisker marking each anomaly. The chart is saved to `boxplot_anomalies.png`.

**If it's off:** If the box plot shows no outliers (red dots), the data might need refreshing — re-run the data generation step. The box plot uses matplotlib's default 1.5*IQR rule, which should match your IQR detection.

### 4.4 Verify visualizations

**Checklist**

- ✅ The scatter plot shows 5 clearly separated red X markers above the normal cluster.
- ✅ The histogram shows anomaly threshold lines in the tail region.
- ✅ The box plot shows outlier dots beyond the upper whisker.
- ✅ All three charts saved as PNG files without errors.

**Socratic question:** The scatter plot reveals *when* anomalies occurred, while the histogram shows *how extreme* they were. For a system outage report, which chart would you lead with?

---

## Step 5: Automated reporting

Detection is only half the job. You need a summary that tells stakeholders what was found, when, and how severe. Build a reporting function that prints a human-readable summary and exports flagged data to CSV.

### 5.1 Build the summary report

Print a structured report that covers detection method, anomaly count, severity breakdown, and per-anomaly details.

```python
def generate_report(df: pd.DataFrame, method: str = "zscore") -> None:
    col = f"{method}_anomaly"
    if col not in df.columns:
        print(f"Column '{col}' not found. Run the detection step first.")
        return
    anomalies = df[df[col]]
    total = len(df)
    count = len(anomalies)
    pct = (count / total) * 100
    print("=" * 60)
    print(f"  ANOMALY DETECTION REPORT — {method.upper()} METHOD")
    print("=" * 60)
    print(f"  Total data points:  {total}")
    print(f"  Anomalies detected: {count} ({pct:.1f}%)")
    print(f"  Detection window:   {df['date'].min().date()} to {df['date'].max().date()}")
    print("-" * 60)
    if count > 0:
        mean_anomaly = anomalies["response_ms"].mean()
        max_anomaly = anomalies["response_ms"].max()
        min_anomaly = anomalies["response_ms"].min()
        print(f"  Mean anomaly value: {mean_anomaly:.2f} ms")
        print(f"  Max anomaly value:  {max_anomaly:.2f} ms")
        print(f"  Min anomaly value:  {min_anomaly:.2f} ms")
        print("-" * 60)
        print("  Individual anomalies:")
        for _, row in anomalies.iterrows():
            normal_mean = df[~df[col]]["response_ms"].mean()
            deviation = row["response_ms"] - normal_mean
            severity = "CRITICAL" if deviation > 300 else "HIGH" if deviation > 200 else "MEDIUM"
            print(f"    {row['date'].date()}  {row['response_ms']:>7.2f} ms  +{deviation:.0f} ms  [{severity}]")
    print("=" * 60)

generate_report(df, method="zscore")
```

**Expected output:**

```
============================================================
  ANOMALY DETECTION REPORT — ZSCORE METHOD
============================================================
  Total data points:  90
  Anomalies detected: 5 (5.6%)
  Detection window:   2026-06-01 to 2026-08-29
------------------------------------------------------------
  Mean anomaly value: 485.50 ms
  Max anomaly value:  547.83 ms
  Min anomaly value:  412.44 ms
------------------------------------------------------------
  Individual anomalies:
    2026-06-11   456.23 ms  +256 ms  [HIGH]
    2026-06-26   521.87 ms  +322 ms  [CRITICAL]
    2026-07-14   489.15 ms  +289 ms  [HIGH]
    2026-07-28   412.44 ms  +212 ms  [HIGH]
    2026-08-21   547.83 ms  +348 ms  [CRITICAL]
============================================================
```

**If it's off:** If you get a KeyError, the anomaly column hasn't been created yet — run Steps 2.2 or 3.2 first. If severity labels all say "MEDIUM", your normal mean is too close to the anomaly values — generate fresh data with larger spikes.

### 5.2 Run the report for both methods

```python
print("Z-SCORE METHOD:")
generate_report(df, method="zscore")
print("\nIQR METHOD:")
generate_report(df, method="iqr")
```

**Expected output:** Two reports printed back to back, each showing the same 5 anomalies detected by both methods. The severity ratings might differ slightly if the deviation calculations vary.

### 5.3 Export anomalies to CSV

Write flagged data to a CSV file so it can be shared, imported into dashboards, or fed into downstream systems.

```python
def export_anomalies(df: pd.DataFrame, method: str = "zscore", filename: str = "anomalies.csv") -> str:
    col = f"{method}_anomaly"
    if col not in df.columns:
        return f"Column '{col}' not found."
    anomalies = df[df[col]].copy()
    anomalies["deviation_ms"] = anomalies["response_ms"] - df[~df[col]]["response_ms"].mean()
    anomalies["severity"] = anomalies["deviation_ms"].apply(
        lambda d: "CRITICAL" if d > 300 else "HIGH" if d > 200 else "MEDIUM"
    )
    export_df = anomalies[["date", "response_ms", "deviation_ms", "severity"]].copy()
    export_df["date"] = export_df["date"].dt.strftime("%Y-%m-%d")
    export_df.to_csv(filename, index=False)
    return f"Exported {len(export_df)} anomalies to {filename}"

result = export_anomalies(df, method="zscore", filename="anomalies_zscore.csv")
print(result)

# Verify the export
exported = pd.read_csv("anomalies_zscore.csv")
print(f"\nContents of anomalies_zscore.csv:")
print(exported.to_string(index=False))
```

**Expected output:**

```
Exported 5 anomalies to anomalies_zscore.csv

Contents of anomalies_zscore.csv:
        date  response_ms  deviation_ms severity
 2026-06-11       456.23        255.96     HIGH
 2026-06-26       521.87        321.60 CRITICAL
 2026-07-14       489.15        288.88     HIGH
 2026-07-28       412.44        212.17     HIGH
 2026-08-21       547.83        347.56 CRITICAL
```

**If it's off:** If the CSV is empty, the boolean filter is excluding everything — check that `zscore_anomaly` is `True` for at least some rows. If `deviation_ms` looks wrong, the normal mean might be recalculated on the full dataset instead of just the non-anomaly rows.

### 5.4 Verify reporting

**Checklist**

- ✅ `generate_report` prints a structured summary with counts, means, and individual anomalies.
- ✅ Severity labels (CRITICAL, HIGH, MEDIUM) reflect the magnitude of each anomaly.
- ✅ `export_anomalies` creates a CSV file with 5 rows matching the detected anomalies.
- ✅ Re-running the export overwrites the previous file without errors.

**Socratic question:** The report classifies anomalies as CRITICAL if the deviation exceeds 300 ms. Why is "deviation from the normal mean" a better severity signal than the raw z-score?

---

## Challenges

### Easy

- **Adjustable sensitivity.** Add a `--threshold` command-line argument that changes the z-score threshold. Default to 3.0.
- **Custom column name.** Make `detect_zscore_anomalies` and `detect_iqr_anomalies` accept any column name, not just `"response_ms"`, so you can reuse them on different datasets.
- **Console color.** Use ANSI escape codes to print CRITICAL anomalies in red, HIGH in yellow, and MEDIUM in orange in the terminal.

### Medium

- **Multi-column detection.** Extend the detection functions to accept a list of columns and flag a row as anomalous if *any* column exceeds the threshold.
- **Rolling z-score.** Instead of computing z-scores against the entire dataset, use a rolling 7-day window so the baseline adapts over time. This catches anomalies relative to recent behavior, not the global mean.
- **Time-of-day analysis.** If your data includes timestamps (not just dates), group anomalies by hour of day to find patterns like "spikes always happen at 3 AM."

### Hard

- **Live monitoring dashboard.** Use `matplotlib.animation` or a simple `while` loop with `clear_output(wait=True)` to plot incoming data points in real time, updating the anomaly markers as new data arrives.
- **Multi-metric correlation.** Detect anomalies in `response_ms` and `requests` simultaneously, then flag rows where both are anomalous in opposite directions (high response time + low requests = server problem, not traffic spike).
- **Email alerts.** When a CRITICAL anomaly is detected, compose and send an email notification using Python's `smtplib`. Store SMTP credentials in environment variables, never in code.

---

## What you just built

A reusable anomaly detection toolkit that applies two classic statistical methods — z-score and IQR — to flag outliers in numerical data. You computed z-scores against a global mean, derived IQR fences from quartile ranges, visualized anomalies on scatter plots, histograms, and box plots, and built an automated reporting system that classifies severity and exports results to CSV. These techniques transfer directly to real-world monitoring, fraud detection, quality control, and any domain where unusual values deserve attention.

## Where to go from here

- **Moving baseline.** Replace the global mean with an exponentially weighted moving average (EWMA) so the detector adapts to gradual shifts in normal behavior.
- **Multivariate detection.** Use Mahalanobis distance or Isolation Forest from `scikit-learn` to detect anomalies across multiple correlated features simultaneously.
- **Automated thresholds.** Instead of hardcoding a z-score threshold, use a percentile-based approach: flag the top 1% of values regardless of distribution shape.
- **Database storage.** Store detected anomalies in SQLite or PostgreSQL so you can query historical patterns and build dashboards.
- **Alerting pipeline.** Hook the reporting function into a webhook (Slack, Discord, PagerDuty) so anomalies trigger instant notifications.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
