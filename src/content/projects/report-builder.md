---
title: "Build a Report Builder"
description: "Turn a CSV of sales into a polished report: clean it with pandas, draw bar, line, pie, and scatter charts with matplotlib, format summary tables, and assemble it all into a single report file."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["data-visualization", "matplotlib", "pandas", "reporting"]
learningObjectives:
  - Load and prepare data with pandas for reporting
  - "Build four chart types: bar, line, pie, scatter"
  - Format data into publication-ready text tables
  - Assemble charts plus summaries into one report
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "Understanding of lists and basic arithmetic"
  - "Installing packages with uv"
---

# 🛠️ 📊 Build a Report Builder

Business reporting is a loop that never changes shape: take raw data, summarize it, show it, and share it. This project builds that loop with pandas and matplotlib, load a sales CSV, compute the totals a manager actually asks for, draw a bar, line, pie, and scatter chart, format everything into a clean table, and assemble it all into one report file.

This assumes Python 101 and comfort with basic functions and lists, nothing beyond that is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Generate a realistic sales CSV and load it into a pandas DataFrame.
2. Aggregate revenue by category with `groupby` for the headline totals.
3. Draw four chart types and save each as a high-resolution PNG.
4. Format a summary table that lines up in any terminal.
5. Assemble charts + summary + metadata into one report folder.

## Where to run this

**Locally with `uv`** is the primary path. `pandas` and `matplotlib` install cleanly, matplotlib's non-interactive `Agg` backend (used in Step 2) means charts render even on a headless machine, and the report files genuinely land in your project folder.

**Google Colab and Binder notebook runs** work the same way, install the pair with one `!pip install pandas matplotlib` line, and the notebook mirrors every step with charts saved into the notebook environment. **JupyterLite** can run the pandas portions in the browser, but it's the weakest of the three for this project: matplotlib runs there, yet saving PNG chart *files* to a real disk is awkward, so treat it as a try-it path and use the notebook badges or local `uv` when you want the report artifacts to persist.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/report-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/report-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Freport-builder%2Fnotebook.ipynb)

## Setup

Create the project and install the two libraries the whole project is built on.

```bash
uv init report-builder
cd report-builder
uv add pandas matplotlib
```

```bash
uv run python -c "import pandas, matplotlib; print('ok')"
```

`pandas` is the data layer, load, aggregate, filter, and `matplotlib` is the drawing layer that turns the aggregates into charts. Starting with both installed means every step below is about the *reporting* ideas rather than dependency wrangling.

**✅ Checklist**

- ✅ `uv add pandas matplotlib` finished and `uv run python -c "import pandas, matplotlib"` prints `ok`.
- ✅ A fresh `report-builder/` project exists with a `pyproject.toml`.

## Step 1: Load and prepare the data

Every report starts with data that may or may not exist yet. This step builds a loader that generates a realistic sales CSV when none is present, so the project runs out of the box, and parses dates so time-based reporting works later.

### 1.1 Write the data generator and loader

**👟 Starter hint:** Create a deterministic sample dataset (seeded randomness), save it as CSV, then load it back with `parse_dates=["date"]` so the date column is a real datetime.

```python
# report.py
import os
import random
import pandas as pd

def create_sample_data(filepath: str = "sales_data.csv"):
    """Generate sample sales data for the report."""
    data = {
        "date": pd.date_range("2024-01-01", periods=100, freq="D"),
        "category": ["Electronics", "Clothing", "Food", "Books"] * 25,
        "revenue": [120.50, 89.99, 45.00, 23.50] * 25,
        "units_sold": [3, 5, 12, 8] * 25,
    }
    random.seed(42)
    data["revenue"] = [r * random.uniform(0.7, 1.3) for r in data["revenue"]]
    data["units_sold"] = [max(1, int(u * random.uniform(0.5, 1.5))) for u in data["units_sold"]]

    df = pd.DataFrame(data)
    df.to_csv(filepath, index=False)
    print(f"Sample data saved to {filepath} ({len(df)} rows)")
    return df

def load_data(filepath: str = "sales_data.csv") -> pd.DataFrame:
    """Load sales data from CSV, creating sample data if the file is missing."""
    if not os.path.exists(filepath):
        print("No data file found. Generating sample data...")
        return create_sample_data(filepath)

    df = pd.read_csv(filepath, parse_dates=["date"])
    print(f"Loaded {len(df)} rows from {filepath}")
    return df

df = load_data()
print(df.head(10).to_string(index=False))
```

`random.seed(42)` is what makes the sample data *reproducible*: the same seed yields the same "random" variation on every run, so the charts and totals you produce are the charts and totals in the expected outputs, not a different report each time. `parse_dates=["date"]` tells pandas to decode the date column into real `datetime` objects at load time, that's what makes "average daily revenue" and the report's date range in Step 5 computable rather than string-sorting. `index=False` on `to_csv` keeps a stray index column out of the file, so re-loading produces a clean DataFrame again.

**🎯 Expected output:** `Sample data saved to sales_data.csv (100 rows)`, or, on a second run with the file present, `Loaded 100 rows from sales_data.csv`. Then a 10-row preview with columns `date`, `category`, `revenue`, `units_sold`.

**🩹 If it's off:** If the file is regenerated every run, `os.path.exists` is checking a different path than the one used by the generator, pass the same `filepath` default to both. If `df["date"]` prints as strings like `2024-01-01` without a `T`, it's not actually parsed, confirm with `df.dtypes` (`date` should be `datetime64[ns]`). If every revenue value is identical, the `random.seed(42)` multiplication wasn't applied to the list.

### 1.2 Check what you're working with

**👟 Starter hint:** Ask pandas for the shape and the row counts per category, so you know the dataset's scale and balance before drawing anything.

```python
# report.py (continued)
print(f"Rows: {len(df)}, Columns: {list(df.columns)}")
print(df.groupby("category")["revenue"].count())
```

`df.groupby("category")["revenue"].count()` is your first real aggregate: `groupby("category")` splits the frame into one group per category, the `["revenue"]` picks a column to measure, and `.count()` tallies non-null entries per group. It's the same shape of expression you'll use in Step 2 to *sum* revenue by category, the only difference is the final method.

**🎯 Expected output:** `Rows: 100, Columns: ['date', 'category', 'revenue', 'units_sold']`, then a per-category count of `25` for each of the four categories.

**🩹 If it's off:** If a count is not 25, the `* 25` tile pattern in the generator didn't produce a balanced dataset, check the original list length. If `groupby` errors, the `category` column name is misspelled or missing from the CSV.

### 1.3 Verify the data layer

**✅ Checklist**

- ✅ Running once creates `sales_data.csv`; running again loads it instead of regenerating.
- ✅ `df.dtypes` shows `date` as a datetime type.
- ✅ `groupby("category")["revenue"].count()` returns 25 per category.

**🤔 Socratic Question(s)**

- The sample data uses a fixed `random.seed(42)`. What would you *trade* if you removed the seed, and in which real workflow (a demo, an audit trail, a live dashboard) would you actually want non-seeded variation?
- Dates are parsed with `parse_dates=["date"]`. What kind of bug would a report hit if the date column stayed as strings, pick one concrete operation (sorting, finding the min date, plotting a time series) and say how it breaks.

## Step 2: Draw your first chart

A chart is a summary you can see. This step draws the first of four figures, a horizontal bar chart of revenue by category, and establishes the pattern every later chart follows: build a `figure` and `axes`, plot, label, save, close.

### 2.1 Save a revenue-by-category bar chart

**👟 Starter hint:** Switch matplotlib to the `Agg` backend (headless-safe), group and sum revenue by category, and plot with a figure + axis pair so you control sizing.

```python
# report.py (continued)
import matplotlib
matplotlib.use("Agg")  # non-interactive backend: render to files, not windows
import matplotlib.pyplot as plt

def chart_revenue_by_category(df: pd.DataFrame, output: str = "chart_bar.png"):
    """Bar chart of total revenue by category."""
    summary = df.groupby("category")["revenue"].sum().sort_values(ascending=True)

    fig, ax = plt.subplots(figsize=(8, 4))
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    summary.plot(kind="barh", ax=ax, color=colors[:len(summary)])
    ax.set_title("Revenue by Category", fontsize=14, fontweight="bold")
    ax.set_xlabel("Total Revenue ($)")
    ax.set_ylabel("")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Bar chart saved to {output}")

chart_revenue_by_category(df)
```

The `matplotlib.use("Agg")` call, placed **before** importing `pyplot`, is what makes this project run on a server or in CI with no display: `Agg` is the pure-raster backend that renders straight to files. `groupby("category")["revenue"].sum().sort_values()` combines aggregation with ordering, so the bar chart renders *sorted*, smallest at the bottom with `barh`, which reads naturally. `plt.savefig(output, dpi=150)` writes a file rather than popping a window, and the disciplined `plt.close()` releases the figure's memory so a long-running loop of charts doesn't leak.

**🎯 Expected output:** A `chart_bar.png` file, plus the printout `Bar chart saved to chart_bar.png`. Open the image: four horizontal bars, one per category, sorted ascending.

**🩹 If it's off:** If you get `UserWarning: Starting a Matplotlib GUI outside of the main thread` or a `TclError` about no display, `matplotlib.use("Agg")` runs *after* `pyplot` is already imported, the `use` must precede every pyplot import. If the file is blank, `savefig` was called before any plotting happened. If colors don't line up with categories, the `colors[:len(summary)]` slice and the sorted series must have the same length and order.

### 2.2 Verify the repeatable chart pattern

**👟 Starter hint:** Re-run the function and confirm the file is rebuilt identically, idempotent output (same input → same PNG) is what makes batch reporting trustworthy.

**🎯 Expected output:** Re-running the chunk overwrites `chart_bar.png` with the same chart and prints `Bar chart saved to chart_bar.png` again, no error, no window popping up.

**🩹 If it's off:** If the second run pops a window or errors about a display, the `Agg` backend line drifted below the pyplot import on a re-paste. If `FileNotFoundError` appears at save, the output directory doesn't exist, `savefig` won't create folders, so `os.makedirs` (or the report step) must.

**✅ Checklist**

- ✅ `chart_bar.png` exists and opens as a four-bar horizontal chart sorted ascending.
- ✅ The `Agg` backend is active before `pyplot` is imported.
- ✅ Running the function twice rebuilds the same file without errors.

**🤔 Socratic Question(s)**

- The chart sorts ascending and uses `barh`. What changes about a viewer's reading of the same data if you plotted the *unsorted* series as vertical bars instead, is there any case where the "wrong" order is the honest one?
- `plt.close()` ends this function, but the initials `fig, ax = plt.subplots(...)` bind a pair of objects. What would happen if you forgot the close in a loop building 200 charts, and why does that failure usually show up late, not immediately?

## Step 3: Add the other three chart types

One chart shows a ranking; a report usually needs the trend, the share, and the relationship too. This step adds the line (revenue over time), pie (share by category), and scatter (revenue vs. units) charts, each following Step 2's figure/plot/save/close pattern.

### 3.1 Draw the revenue trend as a line chart

**👟 Starter hint:** Resample daily revenue by summing per date, then plot with a fill under the curve.

```python
# report.py (continued)
def chart_revenue_trend(df: pd.DataFrame, output: str = "chart_line.png"):
    """Line chart of daily revenue trend."""
    daily = df.groupby("date")["revenue"].sum()

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(daily.index, daily.values, color="#3b82f6", linewidth=1.5)
    ax.fill_between(daily.index, daily.values, alpha=0.1, color="#3b82f6")
    ax.set_title("Daily Revenue Trend", fontsize=14, fontweight="bold")
    ax.set_xlabel("Date")
    ax.set_ylabel("Revenue ($)")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Line chart saved to {output}")

chart_revenue_trend(df)
```

`daily = df.groupby("date")["revenue"].sum()` collapses the frame into one point per date, because `groupby` groups *unique date values*, and every date appears in the data exactly once, this is effectively a full-resolution time series. `ax.plot(daily.index, daily.values, ...)` is the un-pandas-native way of plotting (we took the summary out of the DataFrame), which lets you pass the date index directly to matplotlib. `fill_between` with a low `alpha=0.1` tints the area under the line, a cheap readability win that turns a line into a shape.

**🎯 Expected output:** A `chart_line.png` showing a daily revenue line across the 100-day range, with a light blue fill underneath and rotated date labels along the x-axis.

**🩹 If it's off:** If the x-axis labels overlap into a smear, `rotation=45, ha="right"` was left off. If matplotlib plots an index of raw integers instead of dates, the `parse_dates` from Step 1 wasn't applied. If the line is completely flat, `groupby("date")` may not be summing, check `daily.describe()` for variance.

### 3.2 Add the pie and the scatter

**👟 Starter hint:** For the pie, sum units per category and let matplotlib render percentages; for the scatter, draw one colored series per category and rely on the figure's saved file for inspection.

```python
# report.py (continued)
def chart_category_distribution(df: pd.DataFrame, output: str = "chart_pie.png"):
    """Pie chart of units sold by category."""
    units = df.groupby("category")["units_sold"].sum()

    fig, ax = plt.subplots(figsize=(6, 6))
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    ax.pie(units, labels=units.index, autopct="%1.1f%%", colors=colors, startangle=90)
    ax.set_title("Units Sold by Category", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Pie chart saved to {output}")

def chart_price_vs_units(df: pd.DataFrame, output: str = "chart_scatter.png"):
    """Scatter chart of price vs units sold."""
    fig, ax = plt.subplots(figsize=(8, 5))
    categories = df["category"].unique()
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

    for cat, color in zip(categories, colors):
        subset = df[df["category"] == cat]
        ax.scatter(subset["revenue"], subset["units_sold"], label=cat, alpha=0.6, color=color, s=50)

    ax.set_title("Revenue vs Units Sold", fontsize=14, fontweight="bold")
    ax.set_xlabel("Revenue ($)")
    ax.set_ylabel("Units Sold")
    ax.legend()
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Scatter chart saved to {output}")

chart_category_distribution(df)
chart_price_vs_units(df)
```

The pie's `autopct="%1.1f%%"` is a mini format spec, matplotlib calls that string with each slice's percentage and it renders one decimal place plus a literal `%`, so a slice of `0.27` becomes `27.0%` (the doubled `%%` escapes the single `%`). The scatter's `for cat, color in zip(...)` loop splits the frame per category and draws each as its own colored series, so a legend can tell four groups apart, and `alpha=0.6` makes overlapping points visible rather than solid blobs. Both functions keep the Step 2 discipline: idempotent input, one PNG out.

**🎯 Expected output:** `chart_pie.png` showing the four categories' unit shares with percentage labels, and `chart_scatter.png` with four colored series, axis labels, and a legend.

**🩹 If it's off:** If the pie's labels overlap or vanish, there are too many or too-similar slices for a clean label, `autopct` is not removing small slices, it just labels them. If the scatter shows a single color or empty legend, the `zip(categories, colors)` pairing mismatched, both sequences must have the same order. If `%1.1f%%` prints a literal `1.1f`, the format string is missing the `%` operator's escape.

### 3.3 Verify all four charts

**✅ Checklist**

- ✅ Four PNGs exist: `chart_bar.png`, `chart_line.png`, `chart_pie.png`, `chart_scatter.png`.
- ✅ Each opens to reveal the chart type its name promises.
- ✅ The `Agg` backend and `plt.close()` discipline held across all four functions.

**🤔 Socratic Question(s)**

- The pie and the bar both show per-category summaries, from the same data. When is a pie chart genuinely the wrong choice for a category comparison, even though it displays fine, and what does a *reader* lose that a bar conveys?
- Each chart function hardcodes its own title. If a report needed every chart themed (same font, same header format), what would change structurally, and why does the `fig, ax = plt.subplots(...)` pattern make that easier than plotting on a global implicit figure?

## Step 4: Format a summary table

Charts answer "what do the numbers say at a glance"; a table answers "what exactly are they." This step builds a text table with aligned columns, totals, and dollar formatting, output that's ready to drop into a report, an email, or a terminal.

### 4.1 Aggregate and align the table

**👟 Starter hint:** Use a single `groupby().agg()` to compute all four summary columns at once, then lay them out with f-string field widths so columns line up to the character.

```python
# report.py (continued)
def format_summary_table(df: pd.DataFrame) -> str:
    """Create a formatted summary table of sales by category."""
    summary = df.groupby("category").agg(
        total_revenue=("revenue", "sum"),
        avg_revenue=("revenue", "mean"),
        total_units=("units_sold", "sum"),
        num_transactions=("revenue", "count"),
    ).round(2)

    lines = []
    header = f"{'Category':<15} {'Revenue':>12} {'Avg Sale':>10} {'Units':>8} {'Sales':>8}"
    lines.append(header)
    lines.append("-" * len(header))

    for cat, row in summary.iterrows():
        line = f"{cat:<15} ${row['total_revenue']:>10,.2f} ${row['avg_revenue']:>8,.2f} {int(row['total_units']):>8} {int(row['num_transactions']):>8}"
        lines.append(line)

    lines.append("-" * len(header))
    total_rev = summary["total_revenue"].sum()
    total_units = int(summary["total_units"].sum())
    total_sales = int(summary["num_transactions"].sum())
    lines.append(f"{'TOTAL':<15} ${total_rev:>10,.2f} {'':>10} {total_units:>8} {total_sales:>8}")

    return "\n".join(lines)

table = format_summary_table(df)
print(table)
```

`df.groupby("category").agg(...)` runs *four* aggregations in one pass, each entry names an output column and the `(source_column, operation)` pair to produce it, which is far readier than four separate `groupby` calls. The f-string widths are doing real layout work: `:>12` right-aligns the revenue in 12 characters and `,` in `:>10,.2f` adds thousands separators, so `2984.5` becomes `  $2,984.50` and every row lines up at the same column. The final `TOTAL` row reuses the same width specifiers with an empty padding string so the footer aligns with the data rows above it.

**🎯 Expected output:** A five-line header, then four data rows (one per category) ending in a `TOTAL` row, each column vertically aligned and dollar values comma-formatted.

**🩹 If it's off:** If columns visibly misalign, the width numbers in the header and the body rows disagree, both must use the same specifiers. If `TOTAL` drifts right, its empty padding field has a different width than the `Avg Sale` column. If values show as `2984.5` without commas, the `,` flag is missing from the `.2f` format.

### 4.2 Verify the table

**✅ Checklist**

- ✅ The table has one row per category plus a bold `TOTAL` row.
- ✅ Revenue columns are right-aligned, comma-grouped, and two-decimal.
- ✅ Re-running the function produces an identical string for the same data.

**🤔 Socratic Question(s)**

- The table is built with fixed-width f-strings, which works because the column *names* fit those widths. What breaks the alignment if a category name is 30 characters long, and what are the two or three options (truncate, dynamic width, a library) when real data outgrows your columns?
- `int(row['total_units'])` deliberately floors fractional unit counts. The `.round(2)` above rounds the averages first. Why is independently rounding the *display* values, rather than the underlying aggregate, usually the safer reporting choice?

## Step 5: Assemble the report

The final step is the payoff: run all four charts and the table into a single report file, complete with a generated timestamp and the date range covered, so a manager can open one folder and see the whole story.

### 5.1 Generate the report folder

**👟 Starter hint:** Have the assembler create its own output directory, regenerate every artifact into it, and write a text report that references each chart by name.

```python
# report.py (continued)
from datetime import datetime

def generate_report(df: pd.DataFrame, output_dir: str = "report"):
    """Generate a complete report with charts and tables."""
    os.makedirs(output_dir, exist_ok=True)

    chart_revenue_by_category(df, f"{output_dir}/chart_bar.png")
    chart_revenue_trend(df, f"{output_dir}/chart_line.png")
    chart_category_distribution(df, f"{output_dir}/chart_pie.png")
    chart_price_vs_units(df, f"{output_dir}/chart_scatter.png")

    table = format_summary_table(df)

    report_lines = [
        "=" * 65,
        "  SALES REPORT",
        f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"  Period: {df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}",
        "=" * 65,
        "",
        "  SUMMARY",
        "  " + "-" * 40,
        f"  Total Revenue:     ${df['revenue'].sum():>12,.2f}",
        f"  Average Sale:      ${df['revenue'].mean():>12,.2f}",
        f"  Total Units Sold:  {df['units_sold'].sum():>12,}",
        f"  Transactions:      {len(df):>12,}",
        "",
        "  REVENUE BY CATEGORY",
        "  " + "-" * 40,
        table,
        "",
        "  CHARTS",
        "  " + "-" * 40,
        "  chart_bar.png     - Revenue by category (bar chart)",
        "  chart_line.png    - Daily revenue trend (line chart)",
        "  chart_pie.png     - Units distribution (pie chart)",
        "  chart_scatter.png - Revenue vs units (scatter chart)",
        "",
        "=" * 65,
    ]

    report_text = "\n".join(report_lines)
    report_path = f"{output_dir}/report.txt"
    with open(report_path, "w") as f:
        f.write(report_text)

    print(f"\nReport generated in {output_dir}/")
    print(report_text)

generate_report(df)
```

Two design choices make this a genuine report tool rather than a demo. It's *regenerable*: the assembler recreates every artifact into its own directory, so the same command on updated data produces an updated report, and the directory always contains exactly the current set. It carries *metadata*: `datetime.now()` stamps when it ran and `df['date'].min() ... max()` records the period covered, so a reader (or an email recipient) can tell whether the report is current or stale at a glance. Every function this project built is now assembled in one place, the whole Step 1→4 pipeline, invoked by one call.

**🎯 Expected output:** A `report/` folder containing `report.txt` and the four chart PNGs. The text report opens with the timestamped header, summary stats, the aligned category table, and a chart manifest.

**🩹 If it's off:** If the header prints `Period: NaT to NaT`, the dates weren't parsed on load (Step 1's `parse_dates` is missing). If charts are missing from the folder, one of the four chart functions failed before saving, run each function's "if it's off" independently. If `report.txt` is rejected by an email system for weird characters, check whether the f-strings inserted a stray field; rerunning should be atomic.

### 5.2 Verify the assembled report

**✅ Checklist**

- ✅ `report/` contains `report.txt` and all four chart PNGs.
- ✅ The report's `Period:` line matches the true date range in `df`.
- ✅ Re-running `generate_report(df)` overwrites the folder cleanly with current artifacts.

**🤔 Socratic Question(s)**

- The report writes charts and text *together* on every run. What does a broken run, say, an exception halfway through the chart section, leave on disk, and what two small changes (temp directory + rename, or try/finally) would make regeneration atomic?
- The timestamp is the report's freshness signal. If the report ran on a schedule every Monday, would `Generated:` alone tell a reader whether the *data* was current? What second field would you add to separate "when the report was made" from "how old the data is"?

## ⚠️ Common pitfalls

- **`Agg` import order.** `matplotlib.use("Agg")` must execute *before* `import matplotlib.pyplot as plt`, or the GUI backend wins and headless runs crash with a "no display" error. Fix: keep the `use` line physically above the pyplot import, the file's import block does this deliberately.
- **Unparsed dates.** Without `parse_dates=["date"]`, the date column stays strings, so `df['date'].min()` sorts textually and line charts put strange ticks on the axis. Fix: parse at load time (Step 1) and confirm with `df.dtypes`.
- **Running charts without a display.** The `Agg` backend renders to files, that's the entire reason it's switched on here. Fix: never remove the `use` line for this project; charts are saved, not shown.
- **Misaligned tables.** Mixing header widths and body widths quietly breaks column alignment. Fix: keep the format strings for header and data rows identical, and let the `TOTAL` row reuse them.
- **Extra columns from an index.** `df.to_csv(...)` without `index=False` writes an unnamed index column that loads back as noise. Fix: always pass `index=False`, as the generator does.

## What you just built

A report generator that takes raw sales CSV and produces a complete package: a cleaned DataFrame, four intentional chart types, a publication-ready summary table, and a timestamped report file that names every artifact. The transferable skill is the *data-to-deliverable loop*, load, aggregate, visualize, assemble, which is the identical skeleton behind dashboards, executive summaries, and any "email me this week's numbers" automation you'll encounter in a job.

:::tip[Run a fuller version without any local setup]
[`examples/report-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/report-builder) in the course repo ships the complete assembler plus a `reportlab`-based PDF export and date-range filtering. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a **PDF export** with `reportlab`, the summary on page one and one chart per page. The tiny hint: `uv add reportlab` and `from reportlab.platypus import SimpleDocTemplate, Paragraph, Image` covers ~90% of what you need.
- Give `generate_report` **date filtering**, accept `start_date`/`end_date` and slice `df` before charting, so one function produces weekly, monthly, or quarterly reports from the same source.
- Add a **quarter-over-quarter section**: aggregate revenue into two quarters and print the growth percent plus up/down arrow, a six-line addition to `format_summary_table`'s sibling.
- Schedule it with the `schedule` package so Monday's `generate_report(df)` runs itself, then move the text report's path into an email via `smtplib` and you've built the classic "auto-reporting to stakeholders" pipeline.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to turning spreadsheets into stories. 🎓