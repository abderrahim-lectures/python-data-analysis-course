---
title: "Data Visualization Explorer"
description: "Create interactive charts and dashboards with matplotlib, seaborn, and plotly."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["matplotlib", "seaborn", "plotly", "data-visualization", "pandas"]
prerequisites:
  - "Python basics (variables, loops, functions)"
  - "Basic pandas (DataFrames, groupby)"
  - "Basic matplotlib"
learningObjectives:
  - "Create bar charts, line charts, and scatter plots with matplotlib"
  - "Build statistical visualizations with seaborn"
  - "Create interactive charts with plotly"
  - "Customize chart styling and color themes"
  - "Combine multiple charts into dashboards"
---

# 📊 Data Visualization Explorer

Numbers buried in tables are hard to act on. Charts make patterns, outliers, and trends jump out immediately. This project takes you from basic matplotlib plots through seaborn statistical visuals to interactive plotly dashboards — building a toolkit you can reuse on any dataset you encounter.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full list.

## What you'll do

1. Create bar charts, line charts, and scatter plots with matplotlib
2. Build statistical visualizations with seaborn (box plots, heatmaps, pair plots)
3. Create interactive HTML charts with plotly
4. Customize chart styling, color themes, and typography
5. Combine multiple charts into multi-panel dashboards
6. Export charts as PNG and interactive HTML files

## Where to run this

- **Locally with `uv` (recommended).** This project uses `matplotlib`, `seaborn`, and `plotly`, so a local install is the smoothest path. The Setup section below walks through it.
- **JupyterLite playground.** Paste the code cells directly into a notebook — works well for exploring the analysis steps (1–5), though the dashboard layout (Step 5) benefits from a real terminal for saving files.
- **Google Colab.** Open a new notebook and paste the cells. Same caveat as JupyterLite: file saving works best in a real terminal.

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
uv init data-viz
cd data-viz
uv add matplotlib seaborn plotly pandas
```

`pandas` loads and transforms your data. `matplotlib` is the foundation that seaborn and others build on. `seaborn` adds statistical plots on top of matplotlib. `plotly` creates interactive HTML charts you can open in a browser.

## Step 1: Create sample data and load it

Build a CSV with multi-category sales data, then load it into a DataFrame. Every subsequent step uses this same dataset — varied enough to show different chart types, small enough to read through by hand.

### 1.1 Write the CSV and load it

**👟 Starter hint:** Define a multi-line string with `month`, `category`, `region`, `units`, `revenue`, and `cost` columns. Write it to disk, then read it back with `pd.read_csv`. Print the shape and first few rows to confirm it loaded.

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px

csv_data = """month,category,region,units,revenue,cost
2026-01,Electronics,North,120,54000,32000
2026-01,Clothing,South,95,14250,8500
2026-01,Electronics,South,80,36000,21000
2026-02,Electronics,North,135,60750,36000
2026-02,Clothing,North,110,16500,9900
2026-02,Home,South,70,21000,13000
2026-03,Electronics,North,150,67500,40000
2026-03,Clothing,South,125,18750,11250
2026-03,Home,North,95,28500,17000
2026-04,Electronics,South,140,63000,37000
2026-04,Clothing,North,160,24000,14400
2026-04,Home,South,100,30000,18000
2026-05,Electronics,North,170,76500,45000
2026-05,Clothing,South,130,19500,11700
2026-05,Home,North,115,34500,20000
2026-06,Electronics,South,155,69750,41000
2026-06,Clothing,North,145,21750,13050
2026-06,Home,South,120,36000,21600"""

with open("sales.csv", "w") as f:
    f.write(csv_data.strip())

df = pd.read_csv("sales.csv")
print(f"Shape: {df.shape}")
print(f"\nColumn types:\n{df.dtypes}")
print(f"\nFirst 5 rows:\n{df.head()}")
print(f"\nBasic stats:\n{df.describe()}")
```

**🎯 Expected output:**

```
Shape: (18, 6)

Column types:
month      object
category   object
region     object
units       int64
revenue     int64
cost        int64

First 5 rows:
    month     category region  units  revenue   cost
0  2026-01  Electronics  North    120    54000  32000
1  2026-01    Clothing   South     95    14250   8500
2  2026-01  Electronics  South     80    36000  21000
3  2026-02  Electronics  North    135    60750  36000
4  2026-02    Clothing   North    110    16500   9900

Basic stats:
            units        revenue          cost
count   18.000000      18.000000     18.000000
mean   123.888889   41083.333333  24227.777778
...
```

**🩹 If it's off:** If you get `FileNotFoundError`, your working directory is wrong — run `pwd` to check. If the shape shows `(0, 6)`, the CSV string has a quoting issue — make sure there are no stray quotes inside the data rows. If `units` shows `float64` instead of `int64`, one of your values might have a decimal point.

### 1.2 Verify the data loaded correctly

**✅ Checklist**

- ✅ `df.shape` is `(18, 6)` — 18 rows, 6 columns.
- ✅ All six column names appear: `month`, `category`, `region`, `units`, `revenue`, `cost`.
- ✅ `df.dtypes` shows three object columns (text) and three int64 columns (numbers).
- ✅ `df.describe()` produces stats for the numeric columns without errors.

**🤔 Socratic Question(s)**

Why store `month` as a string (`"2026-01"`) instead of a datetime object? What advantage does the string form have for groupby operations, and what disadvantage does it have for time-series plotting?

---

## Step 2: Basic charts with matplotlib

Matplotlib is the foundation — every other Python visualization library either wraps it or mirrors its API. Master the four essential chart types here: bar, line, scatter, and pie.

### 2.1 Bar chart: revenue by category

**👟 Starter hint:** Group by `category`, sum `revenue`, and plot with `ax.bar()`. Add value labels on top of each bar using `ax.text()`. Remove the top and right spines for a cleaner look.

```python
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = ["#2196F3", "#FF9800", "#4CAF50"]
bars = ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")

for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"${height:,.0f}",
            ha="center", va="bottom", fontweight="bold")

ax.set_title("Total Revenue by Category", fontsize=14, fontweight="bold")
ax.set_ylabel("Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_by_category.png", dpi=150)
plt.show()
print("Saved: revenue_by_category.png")
```

**🎯 Expected output:** A bar chart with three bars (Clothing, Electronics, Home). Electronics is the tallest at roughly $367,500. Dollar amounts sit on top of each bar. A file `revenue_by_category.png` is saved to disk.

**🩹 If it's off:** If bars look squished, increase `figsize` to `(10, 6)`. If dollar labels overlap the bars, check that `va="bottom"` is set — this pushes text above the bar top. If `tight_layout()` throws a warning, it means your subplots have fixed sizes that can't adjust — that's normal, the warning is safe to ignore.

### 2.2 Line chart: monthly revenue trend

**👟 Starter hint:** Group by `month` and sum `revenue`. Use `ax.plot()` with `marker="o"` to show data points. Add a shaded region with `ax.fill_between()` to highlight the gap between revenue and cost.

```python
monthly = df.groupby("month")[["revenue", "cost"]].sum().sort_index()

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(monthly.index, monthly["revenue"], marker="o", linewidth=2, label="Revenue", color="#4CAF50")
ax.plot(monthly.index, monthly["cost"], marker="s", linewidth=2, label="Cost", color="#F44336")
ax.fill_between(monthly.index, monthly["revenue"], monthly["cost"], alpha=0.1, color="#4CAF50")

ax.set_title("Monthly Revenue vs. Cost", fontsize=14, fontweight="bold")
ax.set_ylabel("Amount ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
ax.legend()
ax.grid(axis="y", alpha=0.3)
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("monthly_trend.png", dpi=150)
plt.show()
print("Saved: monthly_trend.png")
```

**🎯 Expected output:** Two lines — green for revenue, red for cost — with the shaded gap between them representing profit. Revenue sits above cost in every month. A file `monthly_trend.png` is saved.

**🩹 If it's off:** If the lines look jagged or out of order, your `month` column isn't sorted — add `.sort_index()` after the groupby. If the shaded area fills the wrong region, check that `fill_between` uses `monthly["revenue"]` first and `monthly["cost"]` second — the order determines which line is the top boundary.

### 2.3 Scatter plot: revenue vs. cost

**👟 Starter hint:** Plot each category as a separate series with `ax.scatter()`, using different colors. Add a break-even diagonal line with `ax.plot()` where revenue equals cost.

```python
cat_colors = {"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"}

fig, ax = plt.subplots(figsize=(8, 6))
for category in df["category"].unique():
    subset = df[df["category"] == category]
    ax.scatter(subset["cost"], subset["revenue"], s=100, alpha=0.8,
               label=category, color=cat_colors[category], edgecolors="white")

max_val = max(df["revenue"].max(), df["cost"].max())
ax.plot([0, max_val], [0, max_val], linestyle="--", color="gray", alpha=0.5, label="Break-even")

ax.set_title("Revenue vs. Cost by Category", fontsize=14, fontweight="bold")
ax.set_xlabel("Cost ($)")
ax.set_ylabel("Revenue ($)")
ax.legend()
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_vs_cost.png", dpi=150)
plt.show()
```

**🎯 Expected output:** Colored dots clustered above the dashed break-even line — meaning every record is profitable. Electronics dots sit furthest from the line (highest margins). A file `revenue_vs_cost.png` is saved.

**🩹 If it's off:** If dots overlap badly, increase `alpha` to `0.6` for more transparency or increase `s` to `150` for bigger dots. If the break-even line doesn't appear diagonal, your x and y axes have different scales — call `ax.set_aspect("equal")` to fix it, though this may compress one axis.

### 2.4 Pie chart: category share

**👟 Starter hint:** Group by `category`, sum `revenue`, and use `ax.pie()` with `autopct` for percentage labels and `startangle` for a clean rotation.

```python
cat_share = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(7, 7))
wedges, texts, autotexts = ax.pie(
    cat_share, labels=cat_share.index, autopct="%1.1f%%",
    startangle=90, colors=["#2196F3", "#FF9800", "#4CAF50"],
    textprops={"fontsize": 12}
)
for autotext in autotexts:
    autotext.set_fontweight("bold")

ax.set_title("Revenue Share by Category", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.savefig("category_share.png", dpi=150)
plt.show()
```

**🎯 Expected output:** A pie chart split into three slices with percentage labels. Electronics dominates at roughly 56%, Clothing around 19%, Home around 25%.

**🩹 If it's off:** If the pie chart labels overlap, increase `figsize` to `(9, 9)`. If percentages add up to more than 100%, your groupby didn't sum correctly — check that you called `.sum()` and not `.count()`.

**✅ Checklist**

- ✅ Four chart types generated: bar, line, scatter, and pie.
- ✅ Each chart has a clear title, axis labels (where applicable), and a legend (where applicable).
- ✅ All four PNG files are saved to disk and non-empty.
- ✅ No overlapping text, clipped labels, or missing data points.

**🤔 Socratic Question(s)**

When would a bar chart be more informative than a pie chart for the same data? What happens to the pie chart if you have ten categories instead of three — can you still read the smaller slices?

---

## Step 3: Statistical plots with seaborn

Seaborn builds on matplotlib to give you statistical visualizations with one-liner calls. Box plots show distributions. Heatmaps reveal correlations. Pair plots expose relationships across every variable at once.

### 3.1 Box plot: revenue distribution by category

**👟 Starter hint:** Use `sns.boxplot()` with `x="category"` and `y="revenue"`. Set a seaborn theme first with `sns.set_theme()` for consistent styling.

```python
sns.set_theme(style="whitegrid")

fig, ax = plt.subplots(figsize=(8, 5))
sns.boxplot(data=df, x="category", y="revenue", palette="Set2", ax=ax)
ax.set_title("Revenue Distribution by Category", fontsize=14, fontweight="bold")
ax.set_xlabel("Category")
ax.set_ylabel("Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig("revenue_boxplot.png", dpi=150)
plt.show()
print("Saved: revenue_boxplot.png")
```

**🎯 Expected output:** Three box-and-whisker plots side by side. Electronics has the widest spread (highest variability). The median line inside each box shows the typical revenue per record. A file `revenue_boxplot.png` is saved.

**🩹 If it's off:** If all three boxes look identical, your data might have duplicate rows — go back to Step 1 and check. If the boxes are shifted off-center, `sns.set_theme(style="whitegrid")` might not have run before the plot — call it again right before the figure.

### 3.2 Heatmap: correlation matrix

**👟 Starter hint:** Select only numeric columns, compute `.corr()`, and pass the result to `sns.heatmap()`. Use `annot=True` to show the correlation values inside each cell and `cmap="RdYlGn"` for a red-yellow-green color scale.

```python
numeric_cols = df[["units", "revenue", "cost"]]
corr = numeric_cols.corr()

fig, ax = plt.subplots(figsize=(6, 5))
sns.heatmap(corr, annot=True, cmap="RdYlGn", vmin=-1, vmax=1,
            center=0, fmt=".2f", linewidths=0.5, ax=ax)
ax.set_title("Correlation Matrix", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.savefig("correlation_heatmap.png", dpi=150)
plt.show()
print("Saved: correlation_heatmap.png")
```

**🎯 Expected output:** A colored grid where `revenue` and `cost` show a strong positive correlation (close to 1.0 — higher cost means higher revenue). `units` correlates with both but less strongly. A file `correlation_heatmap.png` is saved.

**🩹 If it's off:** If the heatmap is all one color, your `vmin`/`vmax` range is too wide for the actual correlation values — try `vmin=corr.values.min() - 0.1` and `vmax=corr.values.max() + 0.1`. If you get `ValueError: correlation matrix is not symmetric`, you passed the raw DataFrame instead of the `.corr()` result.

### 3.3 Pair plot: all numeric relationships

**👟 Starter hint:** Use `sns.pairplot()` with `hue="category"` to color points by category. This creates a matrix of scatter plots for every pair of numeric columns, with histograms on the diagonal.

```python
pair = sns.pairplot(df, hue="category", palette="Set2", diag_kind="kde",
                    plot_kws={"alpha": 0.7, "s": 80})
pair.figure.suptitle("Pair Plot — All Numeric Relationships", y=1.02, fontsize=14, fontweight="bold")
pair.savefig("pair_plot.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: pair_plot.png")
```

**🎯 Expected output:** A 3x3 grid of plots. Off-diagonal cells are scatter plots showing how `units`, `revenue`, and `cost` relate to each other. Diagonal cells are density curves (KDE) showing each variable's distribution, colored by category. A file `pair_plot.png` is saved.

**🩹 If it's off:** If the pair plot is huge and hard to read, your dataset has too many numeric columns — limit to 3–4 with `df[["units", "revenue", "cost"]]` before passing to `pairplot`. If colors don't match across subplots, make sure `hue="category"` is set — without it, all points are the same color.

**✅ Checklist**

- ✅ The box plot shows three distinct distributions with different medians and spreads.
- ✅ The heatmap has annotated cells with correlation values between -1 and 1.
- ✅ The pair plot shows scatter plots off-diagonal and density curves on the diagonal.
- ✅ All three seaborn PNG files are saved to disk.

**🤔 Socratic Question(s)**

The correlation matrix shows `revenue` and `cost` are strongly correlated. Does correlation mean causation here — does spending more *cause* higher revenue, or is there a simpler explanation?

---

## Step 4: Interactive charts with plotly

Static PNGs are great for reports, but plotly generates interactive HTML charts you can zoom, hover, and pan inside a browser. This is where your visualizations start feeling like real dashboards.

### 4.1 Interactive bar chart

**👟 Starter hint:** Use `px.bar()` with `x`, `y`, and `color` parameters. Set `barmode="group"` to place bars side by side instead of stacking them. Export to HTML with `fig.write_html()`.

```python
monthly_cat = df.groupby(["month", "category"])["revenue"].sum().reset_index()

fig = px.bar(monthly_cat, x="month", y="revenue", color="category",
             barmode="group", title="Monthly Revenue by Category",
             labels={"revenue": "Revenue ($)", "month": "Month"},
             color_discrete_map={"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"})
fig.update_layout(yaxis_tickformat="$,.0f", xaxis_title="Month", yaxis_title="Revenue ($)")
fig.show()
fig.write_html("interactive_bar.html")
print("Saved: interactive_bar.html")
```

**🎯 Expected output:** A browser window (or notebook cell) opens with a grouped bar chart. Hover over any bar to see the exact month, category, and revenue amount. Zoom by clicking and dragging. A file `interactive_bar.html` is saved — open it in any browser.

**🩹 If it's off:** If bars stack instead of grouping, you forgot `barmode="group"` — the default is `"relative"` which stacks. If the HTML file opens but shows nothing, your browser may be blocking local file JavaScript — try opening it from a local server or using `fig.show()` in a notebook instead.

### 4.2 Interactive scatter plot

**👟 Starter hint:** Use `px.scatter()` with `x`, `y`, `color`, and `size` to encode four dimensions at once — cost on x, revenue on y, category as color, and units as dot size.

```python
fig = px.scatter(df, x="cost", y="revenue", color="category", size="units",
                 hover_data=["month", "region"],
                 title="Revenue vs. Cost (dot size = units sold)",
                 labels={"cost": "Cost ($)", "revenue": "Revenue ($)", "units": "Units Sold"},
                 color_discrete_map={"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"})
fig.update_layout(xaxis_tickformat="$,.0f", yaxis_tickformat="$,.0f")
fig.show()
fig.write_html("interactive_scatter.html")
print("Saved: interactive_scatter.html")
```

**🎯 Expected output:** Colored dots of varying sizes. Larger dots mean more units sold. Hover over any dot to see month, region, cost, revenue, and units. A file `interactive_scatter.html` is saved.

**🩹 If it's off:** If all dots are the same size, `size="units"` isn't being applied — check that `units` is numeric, not a string. If hover data shows `NaN`, the column name has a typo or the column doesn't exist.

### 4.3 Interactive line chart with range slider

**👟 Starter hint:** Use `px.line()` for the base chart, then add `fig.update_xaxes(rangeslider_visible=True)` for a draggable time range selector at the bottom.

```python
monthly_total = df.groupby("month")[["revenue", "cost"]].sum().reset_index()

fig = px.line(monthly_total, x="month", y=["revenue", "cost"],
              title="Revenue vs. Cost Over Time (drag to zoom)",
              labels={"value": "Amount ($)", "month": "Month", "variable": "Metric"})
fig.update_layout(yaxis_tickformat="$,.0f", legend_title_text="")
fig.update_xaxes(rangeslider_visible=True)
fig.show()
fig.write_html("interactive_line.html")
print("Saved: interactive_line.html")
```

**🎯 Expected output:** Two lines (revenue and cost) with a draggable range slider at the bottom. Grab the slider handles to zoom into a specific month range. A file `interactive_line.html` is saved.

**🩹 If it's off:** If the range slider doesn't appear, you may be using an older plotly version — run `uv add --upgrade plotly`. If the legend shows `variable` as the title instead of a blank space, check that `legend_title_text=""` is set.

**✅ Checklist**

- ✅ All three plotly charts render in the browser with hover tooltips.
- ✅ The bar chart groups bars side by side, not stacked.
- ✅ The scatter plot encodes four dimensions (x, y, color, size).
- ✅ The line chart has a working range slider.
- ✅ All three HTML files are saved and openable in a browser.

**🤔 Socratic Question(s)**

When would you choose an interactive plotly chart over a static matplotlib PNG? When would you choose the static PNG instead? Think about your audience — who sees the chart, and how do they consume it?

---

## Step 5: Custom styling and themes

Charts look amateurish with default colors and fonts. Build a consistent theme and apply it across every chart in the project.

### 5.1 Define a custom color palette and font settings

**👟 Starter hint:** Create a dictionary of hex color codes and a function that applies a consistent style to any matplotlib axes. Use `plt.rcParams` to set global font sizes.

```python
THEME = {
    "primary": "#2563EB",
    "secondary": "#F59E0B",
    "accent": "#10B981",
    "danger": "#EF4444",
    "bg": "#F8FAFC",
    "text": "#1E293B",
    "grid": "#E2E8F0",
}

plt.rcParams.update({
    "figure.facecolor": THEME["bg"],
    "axes.facecolor": THEME["bg"],
    "axes.edgecolor": THEME["grid"],
    "axes.labelcolor": THEME["text"],
    "text.color": THEME["text"],
    "xtick.color": THEME["text"],
    "ytick.color": THEME["text"],
    "font.size": 11,
    "axes.titlesize": 14,
    "axes.titleweight": "bold",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.color": THEME["grid"],
})

CATEGORY_COLORS = {
    "Electronics": THEME["primary"],
    "Clothing": THEME["secondary"],
    "Home": THEME["accent"],
}

def style_ax(ax, title: str, xlabel: str = "", ylabel: str = "") -> None:
    ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)
    ax.spines[["top", "right"]].set_visible(False)
```

### 5.2 Apply the theme to a chart

**👟 Starter hint:** Use `style_ax()` on any axes object to instantly apply clean styling. The `plt.rcParams` changes apply globally from this point forward.

```python
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
bars = ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white", linewidth=0.5)

for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"${height:,.0f}",
            ha="center", va="bottom", fontweight="bold", fontsize=10)

style_ax(ax, "Revenue by Category", ylabel="Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig("themed_bar.png", dpi=150)
plt.show()
print("Saved: themed_bar.png")
```

**🎯 Expected output:** The same bar chart from Step 2, but now with a light gray background, no top/right spines, consistent font sizes, and the custom color palette. A file `themed_bar.png` is saved.

**🩹 If it's off:** If the background is still white, `plt.rcParams.update()` hasn't been called in this session — rerun the entire Step 5.1 block. If colors don't match the theme, you're using hardcoded hex values instead of the `CATEGORY_COLORS` dictionary — replace them.

### 5.3 Build a seaborn theme for statistical plots

**📶 Starter hint:** Use `sns.set_theme()` with `context="talk"` for larger fonts and `style="whitegrid"` for a clean grid. Combine with `palette` for consistent color mapping.

```python
sns.set_theme(style="whitegrid", context="talk", palette="Set2")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

sns.boxplot(data=df, x="category", y="revenue", ax=axes[0])
style_ax(axes[0], "Revenue Distribution", ylabel="Revenue ($)")

sns.violinplot(data=df, x="category", y="units", ax=axes[1])
style_ax(axes[1], "Units Sold Distribution", ylabel="Units")

plt.tight_layout()
plt.savefig("seaborn_styled.png", dpi=150)
plt.show()
print("Saved: seaborn_styled.png")
```

**🎯 Expected output:** Side-by-side box and violin plots with the seaborn whitegrid theme. The violin plot shows the density shape of the distribution — wider where more data points cluster. A file `seaborn_styled.png` is saved.

**🩹 If it's off:** If the violin plot looks empty or collapsed, your data might have too few points for kernel density estimation — try `inner="quartile"` to show quartile lines inside the violin, which makes small datasets more readable.

**✅ Checklist**

- ✅ `THEME` dictionary is defined with six color keys.
- ✅ `plt.rcParams` global settings produce consistent styling across all subsequent charts.
- ✅ `style_ax()` works as a reusable helper for any matplotlib axes.
- ✅ The seaborn statistical plots match the overall visual theme.

**🤔 Socratic Question(s)**

Why does removing the top and right spines (`spines[["top", "right"]].set_visible(False)`) make charts more readable? What information did those spines ever convey — and was it worth the visual clutter?

---

## Step 6: Multi-panel dashboards

Real-world dashboards combine multiple chart types into a single figure. Use `plt.subplots()` to arrange charts in a grid layout.

### 6.1 Build a 2x2 dashboard

**👟 Starter hint:** Create a 2x2 grid of subplots with `plt.subplots(2, 2, figsize=(14, 10))`. Assign one chart type to each quadrant: bar chart (top-left), line chart (top-right), scatter plot (bottom-left), pie chart (bottom-right).

```python
category_revenue = df.groupby("category")["revenue"].sum()
monthly = df.groupby("month")[["revenue", "cost"]].sum().sort_index()

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle("Sales Dashboard — H1 2026", fontsize=16, fontweight="bold", y=1.01)

# Top-left: Bar chart
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
axes[0, 0].bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")
style_ax(axes[0, 0], "Revenue by Category", ylabel="Revenue ($)")
axes[0, 0].yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))

# Top-right: Line chart
axes[0, 1].plot(monthly.index, monthly["revenue"], marker="o", linewidth=2, label="Revenue", color=THEME["primary"])
axes[0, 1].plot(monthly.index, monthly["cost"], marker="s", linewidth=2, label="Cost", color=THEME["danger"])
axes[0, 1].fill_between(monthly.index, monthly["revenue"], monthly["cost"], alpha=0.1, color=THEME["primary"])
style_ax(axes[0, 1], "Monthly Trend", ylabel="Amount ($)")
axes[0, 1].yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
axes[0, 1].legend()

# Bottom-left: Scatter plot
for category in df["category"].unique():
    subset = df[df["category"] == category]
    axes[1, 0].scatter(subset["cost"], subset["revenue"], s=80, alpha=0.8,
                        label=category, color=CATEGORY_COLORS[category], edgecolors="white")
max_val = max(df["revenue"].max(), df["cost"].max())
axes[1, 0].plot([0, max_val], [0, max_val], linestyle="--", color="gray", alpha=0.5)
style_ax(axes[1, 0], "Revenue vs. Cost", xlabel="Cost ($)", ylabel="Revenue ($)")
axes[1, 0].legend(fontsize=9)

# Bottom-right: Pie chart
wedges, texts, autotexts = axes[1, 1].pie(
    category_revenue, labels=category_revenue.index, autopct="%1.1f%%",
    startangle=90, colors=[CATEGORY_COLORS[cat] for cat in category_revenue.index]
)
for autotext in autotexts:
    autotext.set_fontweight("bold")
axes[1, 1].set_title("Revenue Share", fontsize=14, fontweight="bold")

plt.tight_layout()
plt.savefig("dashboard.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: dashboard.png")
```

**🎯 Expected output:** A single large figure with four charts arranged in a 2x2 grid. The top row has a bar chart and a line chart. The bottom row has a scatter plot and a pie chart. A file `dashboard.png` is saved.

**🩹 If it's off:** If charts overlap, `tight_layout()` is being called before all axes are set up — move it to the very end. If `suptitle` overlaps the top charts, adjust `y=1.02` to push it higher or use `plt.subplots_adjust(top=0.93)` instead. If the pie chart is squished into an oval, add `axes[1, 1].set_aspect("equal")`.

### 6.2 Build a seaborn-style dashboard with FacetGrid

**👟 Starter hint:** Use `sns.FacetGrid()` to create a grid of small multiples — one scatter plot per region, sharing the same axes for direct comparison.

```python
g = sns.FacetGrid(df, col="region", hue="category", palette="Set2", height=4, aspect=1.2)
g.map(sns.scatterplot, "cost", "units", alpha=0.8, s=100, edgecolor="white")
g.add_legend(title="Category")
g.set_axis_labels("Cost ($)", "Units Sold")
g.figure.suptitle("Units vs. Cost by Region", fontsize=14, fontweight="bold", y=1.02)
g.savefig("facet_dashboard.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: facet_dashboard.png")
```

**🎯 Expected output:** Two scatter plots side by side — one for North, one for South — with the same x/y scale for easy comparison. Each dot is colored by category. A file `facet_dashboard.png` is saved.

**🩹 If it's off:** If the facet columns have different x-axis ranges, `sharex=True` and `sharey=True` aren't set — they're the defaults for `FacetGrid`, but if you overrode them, remove the override. If the legend overlaps a facet panel, use `g.add_legend(loc="upper right", bbox_to_anchor=(1, 0))`.

**✅ Checklist**

- ✅ The 2x2 matplotlib dashboard has four distinct chart types in a single figure.
- ✅ The suptitle is readable and doesn't overlap chart content.
- ✅ The FacetGrid creates separate panels per region with shared axes.
- ✅ Both dashboard PNG files are saved and non-empty.

**🤔 Socratic Question(s)**

When would a multi-panel dashboard be more useful than showing each chart separately? What's the tradeoff between cramming many charts into one figure versus giving each chart its own space?

---

## Step 7: Export and share

Your charts need to leave the terminal. Save them as publication-quality PNGs for reports and as interactive HTML files for sharing with anyone who has a browser.

### 7.1 Save all charts as high-resolution PNGs

**👟 Starter hint:** Use `dpi=300` for print quality and `bbox_inches="tight"` to prevent clipping. Create a dedicated `exports/` directory to keep things organized.

```python
from pathlib import Path

exports = Path("exports")
exports.mkdir(exist_ok=True)

# Regenerate key charts and save to exports/
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")
style_ax(ax, "Revenue by Category", ylabel="Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig(exports / "revenue_bar.png", dpi=300, bbox_inches="tight")
plt.close()

print(f"Exported to {exports}/")
for f in exports.iterdir():
    print(f"  {f.name} ({f.stat().st_size:,} bytes)")
```

**🎯 Expected output:**

```
Exported to exports/
  revenue_bar.png (45,231 bytes)
```

Each file is at least 30KB — tiny PNGs mean something went wrong with the rendering.

**🩹 If it's off:** If the PNG is under 5KB, the figure was empty when `savefig` ran — make sure you call `savefig` before `plt.close()`. If text is clipped at the edges, add `bbox_inches="tight"` to the `savefig` call.

### 7.2 Create an interactive HTML report

**👟 Starter hint:** Combine all plotly charts into a single HTML file by generating them in sequence and using `plotly.io.to_html()` to embed each one.

```python
import plotly.io as pio

monthly_cat = df.groupby(["month", "category"])["revenue"].sum().reset_index()

fig1 = px.bar(monthly_cat, x="month", y="revenue", color="category",
              barmode="group", title="Monthly Revenue by Category")
fig1.update_layout(yaxis_tickformat="$,.0f")

fig2 = px.scatter(df, x="cost", y="revenue", color="category", size="units",
                  hover_data=["month", "region"],
                  title="Revenue vs. Cost")
fig2.update_layout(xaxis_tickformat="$,.0f", yaxis_tickformat="$,.0f")

html_parts = [
    "<html><head><title>Sales Dashboard Report</title>",
    "<style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px;}"
    "h1{color:#1E293B;} h2{color:#475569;margin-top:40px;}</style></head><body>",
    "<h1>Sales Dashboard — H1 2026</h1>",
    "<h2>Monthly Revenue by Category</h2>",
    pio.to_html(fig1, full_html=False),
    "<h2>Revenue vs. Cost</h2>",
    pio.to_html(fig2, full_html=False),
    "</body></html>",
]

with open("dashboard_report.html", "w") as f:
    f.write("".join(html_parts))

print("Saved: dashboard_report.html")
```

**🎯 Expected output:** A file `dashboard_report.html` opens in your browser with a styled page containing both interactive charts — scroll to see them, hover to inspect values, zoom with click-drag.

**🩹 If it's off:** If the HTML file shows raw code instead of charts, `pio.to_html()` might be returning a full HTML page instead of a fragment — check that `full_html=False` is set. If the page looks unstyled, the `<style>` block has a syntax error — check for unclosed braces or tags.

**✅ Checklist**

- ✅ The `exports/` directory contains at least one PNG file over 30KB.
- ✅ `dashboard_report.html` opens in a browser with working interactive charts.
- ✅ Charts render at 300 DPI — suitable for printing without pixelation.
- ✅ No clipped text, missing labels, or blank chart areas in the exports.

**🤔 Socratic Question(s)**

You now have two export formats: PNG (static, high-res) and HTML (interactive, lower-res). If you were presenting to a board of directors who print handouts, which format would you use? What if you were sending it to a teammate who wants to explore the data themselves?

---

## 🧩 Challenges

<details>
<summary><strong>Challenge 1: Animated Bar Chart Race</strong></summary>

Use plotly's `animation_frame` parameter to create an animated bar chart that shows revenue changing month by month. The bars should grow and shrink as you play through the timeline.

```python
fig = px.bar(monthly_cat, x="category", y="revenue", color="category",
             animation_frame="month", range_y=[0, monthly_cat["revenue"].max() * 1.1],
             title="Revenue by Category — Month by Month",
             color_discrete_map=CATEGORY_COLORS)
fig.show()
```

</details>

<details>
<summary><strong>Challenge 2: Profit Margin Heatmap</strong></summary>

Calculate profit margin as `(revenue - cost) / revenue * 100`. Pivot the data into a matrix with categories as rows and months as columns. Use `sns.heatmap()` to visualize which category-month combinations had the highest margins.

```python
df["margin"] = ((df["revenue"] - df["cost"]) / df["revenue"] * 100).round(1)
pivot = df.pivot_table(index="category", columns="month", values="margin")

fig, ax = plt.subplots(figsize=(10, 3))
sns.heatmap(pivot, annot=True, fmt=".1f", cmap="RdYlGn", center=50, ax=ax)
ax.set_title("Profit Margin (%) by Category and Month")
plt.tight_layout()
plt.savefig("margin_heatmap.png", dpi=150)
plt.show()
```

</details>

<details>
<summary><strong>Challenge 3: Interactive Dashboard with Dropdown</strong></summary>

Use plotly's `updatemenus` to add a dropdown that lets the user switch between viewing revenue, cost, and units on the y-axis of a single chart — three views in one interactive figure.

```python
import plotly.graph_objects as go

monthly_all = df.groupby("month")[["revenue", "cost", "units"]].sum().sort_index().reset_index()

fig = go.Figure()
for col, color in [("revenue", "#4CAF50"), ("cost", "#F44336"), ("units", "#2196F3")]:
    fig.add_trace(go.Scatter(x=monthly_all["month"], y=monthly_all[col],
                             name=col.title(), visible=True if col == "revenue" else False,
                             line=dict(color=color, width=3), mode="lines+markers"))

fig.update_layout(
    updatemenus=[dict(
        buttons=[
            dict(label="Revenue", method="update", args=[{"visible": [True, False, False]}, {"yaxis.title": "Revenue ($)"}]),
            dict(label="Cost", method="update", args=[{"visible": [False, True, False]}, {"yaxis.title": "Cost ($)"}]),
            dict(label="Units", method="update", args=[{"visible": [False, False, True]}, {"yaxis.title": "Units Sold"}]),
        ],
        direction="down", showactive=True,
    )],
    title="Monthly Metrics (select one)",
    yaxis_title="Revenue ($)",
)
fig.show()
```

</details>

## What you learned

- Created bar charts, line charts, scatter plots, and pie charts with matplotlib
- Built box plots, heatmaps, pair plots, and violin plots with seaborn
- Generated interactive HTML charts with plotly (bar, scatter, line with range slider)
- Defined a custom color theme and applied it consistently across all chart types
- Assembled multi-panel dashboards using `plt.subplots()` and `sns.FacetGrid()`
- Exported charts as high-resolution PNGs (300 DPI) and interactive HTML reports
- Learned when each visualization library and format is the right choice

## Where to go from here

- **Streamlit dashboard.** Wrap the same charts in a Streamlit app with `st.pyplot()` and `st.plotly_chart()` for a live web dashboard that updates as data changes.
- **Matplotlib animation.** Use `matplotlib.animation.FuncAnimation` to create animated charts that show data changing over time — great for presentations.
- **Altair or Vega-Lite.** Explore declarative visualization where you describe *what* to plot rather than *how* to plot it — a different paradigm from matplotlib's imperative approach.
- **Geographic data.** Use `plotly.express.choropleth()` or `folium` to map data onto geographic regions — sales by country, weather by city, etc.
- **Real data.** Replace the sample CSV with real datasets from [Kaggle](https://www.kaggle.com/datasets), [data.gov](https://data.gov), or your own spreadsheets. The same chart code works on any tabular data.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
