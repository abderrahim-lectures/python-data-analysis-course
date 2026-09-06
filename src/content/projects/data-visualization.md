---
title: "Data Visualization Explorer"
description: "Create publication-quality charts from CSV data with pandas and matplotlib."
difficulty: "beginner"
estimatedMinutes: 75
tags: ["pandas", "matplotlib", "csv", "visualization", "data-science"]
learningObjectives:
  - Load and explore CSV datasets with pandas
  - Create bar charts, line plots, scatter plots, and histograms
  - Customize chart labels, titles, legends, and colors
  - Save figures to files for reports and presentations
prerequisites:
  - "Python basics (variables, loops, functions)"
  - "Familiarity with lists and dictionaries"
---

## What You'll Learn

- Load CSV data into pandas DataFrames and perform basic exploration
- Create four common chart types: bar, line, scatter, and histogram
- Customize chart aesthetics including colors, labels, titles, and legends
- Save figures as PNG files for use in reports and presentations
- Handle missing data and format numbers for readable displays

## What You'll Build

A data visualization toolkit that generates charts from real-world datasets:

- Bar charts comparing categorical data (e.g., sales by region)
- Line plots showing trends over time (e.g., monthly revenue)
- Scatter plots revealing relationships between variables (e.g., price vs. quantity)
- Histograms displaying data distributions (e.g., age demographics)
- A reusable chart function library you can apply to your own data

## Where to Run It

- **JupyterLite**: Ideal — `pandas` and `matplotlib` are pre-installed, charts render inline
- **Local with `uv`**: Great for saving high-resolution PNG files
- **Google Colab**: Works perfectly with no setup needed

## Setup

```bash
# Create a new project
uv init data-viz-explorer
cd data-viz-explorer

# Install dependencies
uv add pandas matplotlib
```

## Step 1: Create Sample Data and Load It

Build a CSV file with sales data, then load it into a DataFrame for exploration.

```python
import pandas as pd
import matplotlib.pyplot as plt
import os

# Create sample sales data
csv_content = """month,region,product,units_sold,revenue,cost
2026-01,North,Widget A,120,5400.00,3200.00
2026-01,South,Widget A,95,4275.00,2550.00
2026-02,North,Widget A,135,6075.00,3600.00
2026-02,South,Widget A,110,4950.00,2900.00
2026-03,North,Widget B,80,6400.00,4000.00
2026-03,South,Widget B,70,5600.00,3500.00
2026-04,North,Widget A,150,6750.00,4000.00
2026-04,South,Widget B,125,10000.00,6250.00
2026-05,North,Widget B,95,7600.00,4750.00
2026-05,South,Widget A,140,6300.00,3700.00
2026-06,North,Widget A,160,7200.00,4200.00
2026-06,South,Widget B,100,8000.00,5000.00"""

with open("sales_data.csv", "w") as f:
    f.write(csv_content.strip())

# Load and explore
df = pd.read_csv("sales_data.csv")
print(f"Shape: {df.shape}")
print(f"\nColumn types:\n{df.dtypes}")
print(f"\nFirst 5 rows:\n{df.head()}")
print(f"\nBasic stats:\n{df.describe()}")
```

## Step 2: Build Bar and Line Charts

Create a grouped bar chart for regional comparison and a line chart for monthly trends.

```python
# --- Bar Chart: Revenue by Region ---
region_revenue = df.groupby("region")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = ["#2196F3", "#FF9800"]
bars = ax.bar(region_revenue.index, region_revenue.values, color=colors, edgecolor="white")

for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"${height:,.0f}",
            ha="center", va="bottom", fontweight="bold")

ax.set_title("Total Revenue by Region", fontsize=14, fontweight="bold")
ax.set_ylabel("Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_by_region.png", dpi=150)
plt.show()
print("Saved: revenue_by_region.png")

# --- Line Chart: Monthly Revenue Trend ---
monthly = df.groupby("month")[["revenue", "cost"]].sum().sort_index()

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(monthly.index, monthly["revenue"], marker="o", linewidth=2, label="Revenue", color="#4CAF50")
ax.plot(monthly.index, monthly["cost"], marker="s", linewidth=2, label="Cost", color="#F44336")
ax.fill_between(monthly.index, monthly["revenue"], monthly["cost"], alpha=0.1, color="#4CAF50")

ax.set_title("Monthly Revenue vs. Cost", fontsize=14, fontweight="bold")
ax.set_ylabel("Amount ($)")
ax.legend()
ax.grid(axis="y", alpha=0.3)
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("monthly_trend.png", dpi=150)
plt.show()
```

## Step 3: Build Scatter Plots and Histograms

Reveal relationships in your data with scatter plots and visualize distributions with histograms.

```python
# --- Scatter Plot: Revenue vs. Cost by Product ---
product_colors = {"Widget A": "#2196F3", "Widget B": "#FF5722"}

fig, ax = plt.subplots(figsize=(8, 6))
for product in df["product"].unique():
    subset = df[df["product"] == product]
    ax.scatter(subset["cost"], subset["revenue"], s=100, alpha=0.8,
               label=product, color=product_colors[product], edgecolors="white")

# Add break-even line
max_val = max(df["revenue"].max(), df["cost"].max())
ax.plot([0, max_val], [0, max_val], linestyle="--", color="gray", alpha=0.5, label="Break-even")

ax.set_title("Revenue vs. Cost by Product", fontsize=14, fontweight="bold")
ax.set_xlabel("Cost ($)")
ax.set_ylabel("Revenue ($)")
ax.legend()
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_vs_cost.png", dpi=150)
plt.show()

# --- Histogram: Distribution of Units Sold ---
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["units_sold"], bins=8, color="#9C27B0", edgecolor="white", alpha=0.8)
ax.axvline(df["units_sold"].mean(), color="red", linestyle="--", linewidth=2, label=f"Mean: {df['units_sold'].mean():.0f}")

ax.set_title("Distribution of Units Sold", fontsize=14, fontweight="bold")
ax.set_xlabel("Units Sold")
ax.set_ylabel("Frequency")
ax.legend()
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("units_distribution.png", dpi=150)
plt.show()
```

## Step 4: Build a Reusable Chart Library

Package your chart functions into a reusable module so you can apply them to any dataset.

```python
def bar_chart(data: pd.DataFrame, x_col: str, y_col: str, title: str, filename: str | None = None) -> None:
    """Generic bar chart from a DataFrame."""
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(data[x_col], data[y_col], color="#2196F3", edgecolor="white")
    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.set_ylabel(y_col.replace("_", " ").title())
    ax.spines[["top", "right"]].set_visible(False)
    plt.tight_layout()
    if filename:
        plt.savefig(filename, dpi=150)
    plt.show()


def multi_line(data: pd.DataFrame, x_col: str, y_cols: list[str], title: str, filename: str | None = None) -> None:
    """Multi-series line chart."""
    fig, ax = plt.subplots(figsize=(10, 5))
    for col in y_cols:
        ax.plot(data[x_col], data[col], marker="o", linewidth=2, label=col.replace("_", " ").title())
    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    ax.spines[["top", "right"]].set_visible(False)
    plt.tight_layout()
    if filename:
        plt.savefig(filename, dpi=150)
    plt.show()


# Example usage with your own data
product_revenue = df.groupby("product")["revenue"].sum().reset_index()
bar_chart(product_revenue, "product", "revenue", "Revenue by Product", "product_revenue.png")
```

## Challenges

<details>
<summary><strong>Challenge 1: Profit Margin Chart</strong></summary>

Calculate profit margin as `(revenue - cost) / revenue * 100` and create a grouped bar chart showing margin by region and product. Use different colors for each product.

```python
df["margin"] = ((df["revenue"] - df["cost"]) / df["revenue"] * 100).round(1)
pivot = df.pivot_table(index="region", columns="product", values="margin")
pivot.plot(kind="bar", figsize=(8, 5))
plt.title("Profit Margin by Region and Product (%)")
plt.ylabel("Margin (%)")
plt.tight_layout()
plt.savefig("profit_margin.png", dpi=150)
plt.show()
```

</details>

<details>
<summary><strong>Challenge 2: Interactive Filtering</strong></summary>

Write a function that takes a region name as input and generates a line chart showing only that region's monthly revenue trend. Call it for each region in your data.

</details>

<details>
<summary><strong>Challenge 3: Subplot Dashboard</strong></summary>

Combine all four chart types into a single 2x2 figure using `plt.subplots(2, 2)`. Title it "Sales Dashboard — Q1 2026" and save it as a single high-resolution image.

</details>

## Stretch Goals

- [ ] Add pie charts for market share breakdowns
- [ ] Use `seaborn` for statistical visualizations (heatmaps, box plots)
- [ ] Create animated charts with `matplotlib.animation`
- [ ] Build a simple Streamlit dashboard for interactive exploration
- [ ] Export charts as SVG for vector-quality publication output

## What You Learned

- Loaded and explored CSV data with pandas DataFrames
- Created bar charts, line plots, scatter plots, and histograms with matplotlib
- Customized chart aesthetics: colors, labels, titles, legends, and grid lines
- Saved figures as high-resolution PNG files
- Built reusable chart functions for applying to any dataset
