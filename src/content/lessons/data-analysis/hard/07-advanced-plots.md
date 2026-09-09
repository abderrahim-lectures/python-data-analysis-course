---

title: "Advanced Plot Types"
description: "Build faceted grids, pair grids, multi-panel figures, and combined plot types for complex multivariate views."
module: "storytelling-viz"
order: 7
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Create FacetGrid and catplot for multi-panel categorical comparisons"
  - "Build pair plots and pair grids with custom diagonal and off-diagonal functions"
  - "Combine multiple plot types in a single figure with gridspec and subplots"
  - "Use inset axes and twin axes for layered information display"
prerequisites: ["06-correlation-analysis"]
tags: ["advanced-plots", "facetgrid", "pairgrid", "matplotlib", "seaborn"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "When should you use a violin plot instead of a box plot?"
    options:
      - text: "When you want to see the full distribution shape including density"
        correct: true
      - text: "When you have only categorical data"
      - text: "When you want to hide outliers"
      - text: "When you have more than 10 groups"
  - question: "What is the advantage of faceted plots?"
    options:
      - text: "They use less memory"
      - text: "They show subgroups side by side for comparison"
        correct: true
      - text: "They automatically fix data quality issues"
      - text: "They work only with numerical data"
  - question: "What does plt.subplot(2, 2, 1) create?"
    options:
      - text: "A single large plot"
      - text: "A 2x2 grid of plots, activating the first one"
        correct: true
      - text: "Two separate figures"
      - text: "A plot with 2 axes and 2 data series"
---
Simple plots reveal single relationships. Advanced multi-panel figures reveal the structure of your entire dataset. This lesson covers seaborn's FacetGrid and PairGrid, matplotlib's gridspec for custom layouts, and techniques for combining multiple plot types in a single figure.

## Key Concepts

### FacetGrid for categorical faceting

FacetGrid splits data by one or more categorical variables and creates a panel for each combination:

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Single faceting variable
g = sns.FacetGrid(df, col="gender", row="lunch", height=4, aspect=1.2)
g.map(sns.histplot, "math score", kde=True, bins=15)
g.set_axis_labels("Math Score", "Count")
g.fig.suptitle("Math Score Distributions by Gender and Lunch Type", y=1.03)
plt.show()
```

### catplot (easier alternative to FacetGrid)

`catplot` is a higher-level interface that handles faceting automatically:

```python
# Count plot faceted by gender and test prep
sns.catplot(
    data=df,
    x="race/ethnicity",
    col="gender",
    hue="test preparation course",
    kind="count",
    height=5,
    aspect=1.2,
    palette="Set2"
)
plt.show()

# Box plot faceted by lunch type
sns.catplot(
    data=df,
    x="gender",
    y="math score",
    col="lunch",
    kind="box",
    height=5,
    aspect=0.8,
    palette="Set2"
)
plt.show()
```

### PairGrid for custom pairwise plots

PairGrid gives you full control over what goes on the diagonal, upper triangle, and lower triangle:

```python
g = sns.PairGrid(
    df,
    vars=["math score", "reading score", "writing score"],
    hue="gender",
    height=3
)

# Diagonal: KDE
g.map_diag(sns.kdeplot, fill=True, alpha=0.5)

# Upper triangle: scatter
g.map_upper(sns.scatterplot, alpha=0.4)

# Lower triangle: regression
g.map_lower(sns.regplot, scatter_kws={"alpha": 0.3})

g.add_legend()
g.fig.suptitle("Custom Pair Grid: Scores by Gender", y=1.02)
plt.show()
```

### Multi-panel figures with gridspec

For layouts where subplots need different sizes, use GridSpec:

```python
import matplotlib.gridspec as gridspec

fig = plt.figure(figsize=(14, 10))
gs = gridspec.GridSpec(2, 3, height_ratios=[1, 1.5], width_ratios=[1, 1, 1])

# Top row: three histograms
for i, subject in enumerate(["math score", "reading score", "writing score"]):
    ax = fig.add_subplot(gs[0, i])
    sns.histplot(df[subject], kde=True, ax=ax, bins=15, color="steelblue")
    ax.set_title(subject.replace(" score", " Scores"))

# Bottom row: wide scatter plot spanning two columns
ax_scatter = fig.add_subplot(gs[1, :2])
ax_scatter.scatter(df["math score"], df["reading score"], alpha=0.4, c="steelblue")
ax_scatter.set_title("Math vs Reading")
ax_scatter.set_xlabel("Math Score")
ax_scatter.set_ylabel("Reading Score")

# Bottom right: box plot
ax_box = fig.add_subplot(gs[1, 2])
sns.boxplot(data=df, x="gender", y="writing score", ax=ax_box, palette="Set2")
ax_box.set_title("Writing by Gender")

plt.tight_layout()
plt.show()
```

### Combining plot types on one axes

Overlay different plot types to add layers of information:

```python
fig, ax = plt.subplots(figsize=(10, 6))

# Layer 1: scatter
ax.scatter(df["math score"], df["reading score"], alpha=0.3, label="Students", c="steelblue")

# Layer 2: regression line
z = np.polyfit(df["math score"], df["reading score"], 1)
p = np.poly1d(z)
x_line = np.linspace(df["math score"].min(), df["math score"].max(), 100)
ax.plot(x_line, p(x_line), "r--", linewidth=2, label=f"Trend (slope={z[0]:.2f})")

# Layer 3: means
mean_math = df["math score"].mean()
mean_reading = df["reading score"].mean()
ax.axvline(mean_math, color="green", linestyle=":", alpha=0.7, label=f"Mean Math: {mean_math:.1f}")
ax.axhline(mean_reading, color="orange", linestyle=":", alpha=0.7, label=f"Mean Reading: {mean_reading:.1f}")

ax.set_title("Math vs Reading Scores with Trend and Means")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
ax.legend()
plt.show()
```

### Inset axes for zoomed views

Show a zoomed-in view of a region within a larger plot:

```python
from mpl_toolkits.axes_grid1.inset_locator import inset_axes

fig, ax = plt.subplots(figsize=(10, 6))
ax.scatter(df["math score"], df["reading score"], alpha=0.3, s=20)
ax.set_title("Math vs Reading (with inset zoom)")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")

# Inset: zoom into the dense center region
axins = inset_axes(ax, width="40%", height="40%", loc="upper left")
axins.scatter(df["math score"], df["reading score"], alpha=0.3, s=10)
axins.set_xlim(50, 70)
axins.set_ylim(50, 70)
axins.set_title("Zoomed Region", fontsize=8)

plt.show()
```

### Twin axes for dual y-scales

When two variables have different scales but share an x-axis:

```python
fig, ax1 = plt.subplots(figsize=(10, 6))

# Left y-axis
color1 = "steelblue"
ax1.hist(df["math score"], bins=20, alpha=0.6, color=color1, label="Math Score")
ax1.set_xlabel("Score")
ax1.set_ylabel("Math Score Count", color=color1)
ax1.tick_params(axis="y", labelcolor=color1)

# Right y-axis
ax2 = ax1.twinx()
color2 = "coral"
ax2.hist(df["reading score"], bins=20, alpha=0.6, color=color2, label="Reading Score")
ax2.set_ylabel("Reading Score Count", color=color2)
ax2.tick_params(axis="y", labelcolor=color2)

ax1.set_title("Math vs Reading Score Distributions (Dual Axis)")
fig.legend(loc="upper right", bbox_to_anchor=(0.9, 0.9))
plt.show()
```

## Try It

Build a comprehensive multi-panel figure for the Students Performance dataset.

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(2, 3, hspace=0.35, wspace=0.3)

# Panel 1: Math score distribution by gender
ax1 = fig.add_subplot(gs[0, 0])
sns.histplot(data=df, x="math score", hue="gender", kde=True, ax=ax1, alpha=0.5, bins=15)
ax1.set_title("Math by Gender")

# Panel 2: Reading score distribution by lunch
ax2 = fig.add_subplot(gs[0, 1])
sns.violinplot(data=df, x="lunch", y="reading score", ax=ax2, palette="Set2")
ax2.set_title("Reading by Lunch Type")

# Panel 3: Ethnicity counts
ax3 = fig.add_subplot(gs[0, 2])
sns.countplot(data=df, x="race/ethnicity", ax=ax3, palette="Set3")
ax3.set_title("Ethnicity Distribution")
ax3.tick_params(axis="x", rotation=45)

# Panel 4: Math vs Writing scatter
ax4 = fig.add_subplot(gs[1, 0])
ax4.scatter(df["math score"], df["writing score"], alpha=0.3, c="steelblue")
ax4.set_title("Math vs Writing")
ax4.set_xlabel("Math Score")
ax4.set_ylabel("Writing Score")

# Panel 5: Correlation heatmap
ax5 = fig.add_subplot(gs[1, 1])
corr = df[["math score", "reading score", "writing score"]].corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, ax=ax5, cbar_kws={"shrink": 0.8})
ax5.set_title("Correlation Matrix")

# Panel 6: Test prep comparison
ax6 = fig.add_subplot(gs[1, 2])
sns.boxplot(data=df, x="test preparation course", y="math score",
            hue="gender", ax=ax6, palette="Set1")
ax6.set_title("Test Prep Effect")

fig.suptitle("Students Performance — Multi-Panel Overview", fontsize=16, fontweight="bold", y=1.01)
plt.show()
```

## Key Takeaways

- FacetGrid and catplot create multi-panel views split by categorical variables — essential for comparing distributions across groups
- PairGrid gives full control over diagonal, upper, and lower triangle plot types
- GridSpec creates custom layouts where subplots have different sizes
- Combining plot types on one axes (scatter + regression + means) layers information efficiently
- Inset axes and twin axes add zoomed or dual-scale views without creating new figures

## Practice Challenge

Create a 2×2 figure: (1) FacetGrid of math score histograms split by gender, (2) PairGrid of all three scores with KDE on diagonal and scatter below, (3) a combined scatter + regression + mean lines plot, and (4) a correlation heatmap. Set a single figure title across all four.

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig = plt.figure(figsize=(16, 14))
gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

# Panel 1: FacetGrid-like — math by gender (two histograms)
ax1 = fig.add_subplot(gs[0, 0])
for gender in df["gender"].unique():
    ax1.hist(df[df["gender"] == gender]["math score"], alpha=0.5, bins=15, label=gender)
ax1.set_title("Math Score by Gender")
ax1.set_xlabel("Math Score")
ax1.set_ylabel("Count")
ax1.legend()

# Panel 2: PairGrid-like — scatter below diagonal, KDE on diagonal
ax2 = fig.add_subplot(gs[0, 1])
ax2.scatter(df["math score"], df["reading score"], alpha=0.3, c="steelblue")
mean_m, mean_r = df["math score"].mean(), df["reading score"].mean()
ax2.axvline(mean_m, color="green", linestyle="--", alpha=0.7, label=f"Mean Math: {mean_m:.1f}")
ax2.axhline(mean_r, color="orange", linestyle="--", alpha=0.7, label=f"Mean Reading: {mean_r:.1f}")
ax2.set_title("Math vs Reading with Means")
ax2.set_xlabel("Math Score")
ax2.set_ylabel("Reading Score")
ax2.legend(fontsize=8)

# Panel 3: Scatter + regression + means
ax3 = fig.add_subplot(gs[1, 0])
sns.regplot(data=df, x="math score", y="writing score", ax=ax3,
            scatter_kws={"alpha": 0.3}, line_kws={"color": "red"})
ax3.set_title("Math vs Writing (Regression)")
ax3.set_xlabel("Math Score")
ax3.set_ylabel("Writing Score")

# Panel 4: Correlation heatmap
ax4 = fig.add_subplot(gs[1, 1])
corr = df[["math score", "reading score", "writing score"]].corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, ax=ax4, linewidths=0.5)
ax4.set_title("Correlation Matrix")

fig.suptitle("Students Performance — Comprehensive Overview", fontsize=16, fontweight="bold", y=1.01)
plt.show()
```

</div>
</details>
