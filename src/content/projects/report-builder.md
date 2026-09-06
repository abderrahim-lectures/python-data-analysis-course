---
title: "Report Builder"
description: "Generate business reports from data with charts, tables, and automated scheduling."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["data-visualization", "matplotlib", "pandas", "pdf", "reporting"]
learningObjectives:
  - Load and transform data with pandas for reporting
  - Build bar, line, pie, and scatter charts with matplotlib
  - Format data into publication-ready tables
  - Export reports as PDF files
prerequisites:
  - Basic Python functions and loops
  - Understanding of dictionaries and lists
  - Familiarity with pip/uv for installing packages
---

# Report Builder

Generate business reports from data with charts, tables, and polished output. You'll learn to turn raw CSV data into a formatted PDF report with visualizations and summary statistics.

## What You'll Learn

- How to load, filter, and aggregate data with pandas
- How to build four chart types: bar, line, pie, and scatter
- How to format tables with alignment and styling
- How to export reports as PDF files

## What You'll Build

A Python script that:

- Loads sales data from a CSV file (or generates sample data)
- Creates bar charts for revenue by category, line charts for trends, pie charts for distribution, and scatter charts for correlations
- Formats summary tables with totals and averages
- Exports everything into a multi-page PDF report

## Where to Run It

This project runs anywhere Python is available. You can use:

- **JupyterLite playground** — paste code blocks into cells and run them in the browser
- **Local with uv** — install dependencies and run from your terminal
- **Google Colab** — click the Colab badge on the project page to run in a cloud notebook

## Setup

Create a new project and install dependencies:

```bash
uv init report-builder
cd report-builder
uv add pandas matplotlib
```

You can use `reportlab` for PDF generation, but for this tutorial we will save charts as images and build a simple text-based report that you can later enhance with a PDF library.

## Step 1 — Load and Prepare Data

Start by creating sample sales data and loading it into a pandas DataFrame.

```python
import pandas as pd
import os

def create_sample_data(filepath: str = "sales_data.csv"):
    """Generate sample sales data for the report."""
    data = {
        "date": pd.date_range("2024-01-01", periods=100, freq="D"),
        "category": ["Electronics", "Clothing", "Food", "Books"] * 25,
        "revenue": [120.50, 89.99, 45.00, 23.50] * 25,
        "units_sold": [3, 5, 12, 8] * 25,
    }
    # Add some variation
    import random
    random.seed(42)
    data["revenue"] = [r * random.uniform(0.7, 1.3) for r in data["revenue"]]
    data["units_sold"] = [max(1, int(u * random.uniform(0.5, 1.5))) for u in data["units_sold"]]

    df = pd.DataFrame(data)
    df.to_csv(filepath, index=False)
    print(f"Sample data saved to {filepath} ({len(df)} rows)")
    return df

def load_data(filepath: str = "sales_data.csv") -> pd.DataFrame:
    """Load sales data from CSV, create sample data if file does not exist."""
    if not os.path.exists(filepath):
        print("No data file found. Generating sample data...")
        return create_sample_data(filepath)

    df = pd.read_csv(filepath, parse_dates=["date"])
    print(f"Loaded {len(df)} rows from {filepath}")
    return df

df = load_data()
print(f"\nData preview:")
print(df.head(10).to_string(index=False))
```

The `create_sample_data` function builds a realistic dataset so the report works even without an external CSV file.

## Step 2 — Build Charts

Create four different chart types to cover common business reporting needs.

```python
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for saving files

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

# Generate all charts
chart_revenue_by_category(df)
chart_revenue_trend(df)
chart_category_distribution(df)
chart_price_vs_units(df)
```

Each function saves its chart as a PNG file. The `Agg` backend ensures matplotlib works without a display, which is important for headless servers and CI environments.

## Step 3 — Format Summary Tables

Build formatted text tables from your data for inclusion in the report.

```python
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
print("\n  Sales Summary")
print("  " + "=" * 65)
print(table)
```

This produces a clean text table that renders well in terminals, plain-text reports, or as a pre-formatted block in HTML output.

## Step 4 — Assemble the Report

Combine all charts and tables into a single report document.

```python
from datetime import datetime

def generate_report(df: pd.DataFrame, output_dir: str = "report"):
    """Generate a complete report with charts and tables."""
    os.makedirs(output_dir, exist_ok=True)

    # Generate charts
    chart_revenue_by_category(df, f"{output_dir}/chart_bar.png")
    chart_revenue_trend(df, f"{output_dir}/chart_line.png")
    chart_category_distribution(df, f"{output_dir}/chart_pie.png")
    chart_price_vs_units(df, f"{output_dir}/chart_scatter.png")

    # Generate summary table
    table = format_summary_table(df)

    # Build text report
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
        "  chart_bar.png   - Revenue by category (bar chart)",
        "  chart_line.png  - Daily revenue trend (line chart)",
        "  chart_pie.png   - Units distribution (pie chart)",
        "  chart_scatter.png - Price vs units (scatter chart)",
        "",
        "=" * 65,
    ]

    report_text = "\n".join(report_lines)
    report_path = f"{output_dir}/report.txt"
    with open(report_path, "w") as f:
        f.write(report_text)

    print(f"\nReport generated in {output_dir}/")
    print(report_text)
    return output_dir

report_dir = generate_report(df)
```

The report directory now contains a text summary and four PNG charts. You can later convert this to PDF using `reportlab` or `weasyprint`.

## 🧩 Challenges

### Challenge 1 — Add PDF Export

Install `reportlab` and write a function that creates a multi-page PDF with the summary on page one and each chart on its own page. Use `reportlab.platypus` for layout and `reportlab.lib.pagesizes` for page setup.

### Challenge 2 — Add Filtering

Extend `generate_report` to accept `start_date` and `end_date` parameters. Filter the DataFrame to only include rows within that date range before generating charts and tables.

### Challenge 3 — Add Quarter-over-Quarter Comparison

Calculate Q1 vs Q2 revenue and growth percentage. Add a section to the report that shows the comparison and whether revenue grew or declined.

## Stretch Goals

- [ ] Add interactive dashboards with drill-down capabilities using plotly
- [ ] Build a template system where you can swap in different data sources
- [ ] Implement a scheduling engine with `schedule` to run reports automatically
- [ ] Add email delivery so reports are sent to stakeholders each week

## What You Learned

You loaded and transformed data with pandas, built four types of charts with matplotlib, formatted publication-ready tables, and assembled everything into a structured report. These skills apply to any data reporting or business intelligence task in Python.
