---

title: "Bivariate Numerical Analysis"
description: "Explore relationships between two numerical variables with scatter plots, regression lines, and grouped comparisons."
module: "bivariate-analysis"
order: 5
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Create scatter plots, reg plots, and joint plots to visualize numerical-numerical relationships"
  - "Interpret regression lines, R-squared values, and residual patterns"
  - "Build grouped box plots and violin plots for numerical-categorical comparisons"
  - "Identify non-linear relationships, heteroscedasticity, and influential points from plots"
prerequisites: ["04-univariate-categorical"]
tags: ["bivariate", "scatter-plots", "regression", "joint-plots", "seaborn"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "What does a scatter plot reveal about two numerical variables?"
    options:
      - text: "Their individual distributions"
      - text: "Their relationship and correlation pattern"
        correct: true
      - text: "Only the mean of each variable"
      - text: "The number of missing values"
  - question: "What does a correlation coefficient of -0.8 indicate?"
    options:
      - text: "Strong positive relationship"
      - text: "Strong negative relationship"
        correct: true
      - text: "No relationship"
      - text: "Weak positive relationship"
  - question: "When should you use a heatmap instead of individual scatter plots?"
    options:
      - text: "When you have only 2 variables"
      - text: "When you want to see correlations across many variables at once"
        correct: true
      - text: "When you have categorical data only"
      - text: "When you have missing values"
---
When you examine how two numerical variables relate to each other, you enter the domain of bivariate analysis. This lesson covers scatter plots (the workhorse of bivariate analysis), regression lines that quantify the relationship, joint plots that combine marginal and joint distributions, and grouped plots that introduce a categorical dimension.

## Key Concepts

### Scatter plots

The scatter plot is the most fundamental bivariate visualization. Each point represents one observation, plotted on two numerical axes:

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, ax = plt.subplots(figsize=(8, 6))
ax.scatter(df["math score"], df["reading score"], alpha=0.5, edgecolors="black", linewidth=0.5)
ax.set_title("Math vs Reading Scores")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
plt.show()
```

Alpha transparency (`alpha=0.5`) is critical, it reveals point density where points overlap.

### Regression plots

Seaborn's `regplot` adds a regression line that quantifies the linear relationship:

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

pairs = [
    ("math score", "reading score"),
    ("math score", "writing score"),
    ("reading score", "writing score"),
]

for i, (x, y) in enumerate(pairs):
    sns.regplot(data=df, x=x, y=y, ax=axes[i], scatter_kws={"alpha": 0.4})
    axes[i].set_title(f"{x.split()[0].title()} vs {y.split()[0].title()}")

plt.tight_layout()
plt.show()
```

Reading a regression plot:
- **Slope**: positive slope means positive correlation; steeper means stronger
- **Confidence interval** (shaded region): wider means more uncertainty
- **Residuals**: points far from the line are poorly predicted

### Joint plots

Joint plots combine the scatter plot with marginal distributions on each axis:

```python
sns.jointplot(
    data=df,
    x="math score",
    y="reading score",
    kind="scatter",      # or "reg", "kde", "hist"
    height=7,
    alpha=0.4
)
plt.suptitle("Math vs Reading (Joint Plot)", y=1.02)
plt.show()
```

The `kind` parameter changes the joint plot type:
- `"scatter"`: raw scatter with marginal histograms
- `"reg"`: scatter with regression line and marginal histograms
- `"kde"`: 2D kernel density with marginal KDEs
- `"hist"`: 2D histogram with marginal histograms

### Hexbin plots for density

When datasets are large, scatter plots become overplotted. Hexbin plots solve this:

```python
fig, ax = plt.subplots(figsize=(8, 6))
hb = ax.hexbin(df["math score"], df["reading score"], gridsize=20, cmap="YlOrRd")
ax.set_title("Math vs Reading (Hexbin Density)")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
plt.colorbar(hb, label="Count")
plt.show()
```

### Numerical-categorical comparisons

When one variable is categorical, compare distributions across groups:

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Grouped box plots
sns.boxplot(data=df, x="gender", y="math score", ax=axes[0], palette="Set2")
axes[0].set_title("Math Scores by Gender")

# Grouped violin plots
sns.violinplot(data=df, x="lunch", y="reading score", ax=axes[1], palette="Set3")
axes[1].set_title("Reading Scores by Lunch Type")

# Grouped with multiple categories
sns.boxplot(
    data=df,
    x="test preparation course",
    y="writing score",
    hue="gender",
    ax=axes[2],
    palette="Set1"
)
axes[2].set_title("Writing Scores by Test Prep & Gender")

plt.tight_layout()
plt.show()
```

### Swarm plots and strip plots

For smaller datasets, show individual points with jitter:

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Strip plot (jittered points)
sns.stripplot(data=df, x="gender", y="math score", ax=axes[0],
              alpha=0.3, jitter=True, palette="Set2")
axes[0].set_title("Math Scores — Strip Plot")

# Swarm plot (non-overlapping points — slower for large datasets)
sns.swarmplot(data=df, x="gender", y="math score", ax=axes[1],
              size=3, palette="Set2")
axes[1].set_title("Math Scores — Swarm Plot")

plt.tight_layout()
plt.show()
```

### Identifying relationships from plots

| Pattern | What it means | Plot to use |
|---------|---------------|-------------|
| Linear trend | Variables increase together | Scatter + reg plot |
| Non-linear trend | Relationship changes across range | Scatter with LOWESS |
| Heteroscedasticity | Spread changes across range | Residual plot |
| Clusters | Distinct subgroups exist | Scatter with hue |
| Outliers | Points far from pattern | Scatter with annotations |

```python
# Highlighting clusters with hue
fig, ax = plt.subplots(figsize=(8, 6))
sns.scatterplot(
    data=df,
    x="math score",
    y="reading score",
    hue="gender",
    style="test preparation course",
    alpha=0.6,
    ax=ax
)
ax.set_title("Math vs Reading: Gender and Test Prep")
plt.show()
```

## Try It

Explore the relationship between math and reading scores, grouped by gender and test preparation.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Scatter with regression
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

sns.regplot(data=df, x="math score", y="reading score", ax=axes[0],
            scatter_kws={"alpha": 0.3}, line_kws={"color": "red"})
axes[0].set_title("Math vs Reading (Regression)")

sns.jointplot(data=df, x="math score", y="reading score",
              kind="kde", height=7)
plt.suptitle("Math vs Reading (Density)", y=1.02)
plt.show()

# Grouped comparison
fig, axes = plt.subplots(1, 2, figsize=(12, 5))
sns.boxplot(data=df, x="gender", y="math score", ax=axes[0], palette="Set2")
axes[0].set_title("Math by Gender")
sns.violinplot(data=df, x="lunch", y="math score", ax=axes[1], palette="Set3")
axes[1].set_title("Math by Lunch Type")
plt.tight_layout()
plt.show()
```

## Key Takeaways

- Scatter plots are the foundation of bivariate analysis; always use alpha transparency for overlapping points
- Regression lines quantify linear relationships; the shaded region shows uncertainty
- Joint plots combine scatter plots with marginal distributions for a complete picture
- Hexbin plots solve overplotting for large datasets by showing density
- Grouped box plots and violin plots compare numerical distributions across categorical groups
- Use hue and style to add third and fourth dimensions to scatter plots

## Practice Challenge

Create a figure with 4 panels showing: (1) scatter plot of math vs writing scores, (2) scatter with regression line, (3) hexbin density plot, and (4) scatter colored by lunch type. Add appropriate titles and axis labels.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, axes = plt.subplots(2, 2, figsize=(14, 12))
fig.suptitle("Math vs Writing Scores — Four Views", fontsize=14, fontweight="bold")

# Panel 1: Basic scatter
axes[0, 0].scatter(df["math score"], df["writing score"], alpha=0.4, edgecolors="black", linewidth=0.5)
axes[0, 0].set_title("Basic Scatter")
axes[0, 0].set_xlabel("Math Score")
axes[0, 0].set_ylabel("Writing Score")

# Panel 2: Regression
sns.regplot(data=df, x="math score", y="writing score", ax=axes[0, 1],
            scatter_kws={"alpha": 0.3}, line_kws={"color": "red"})
axes[0, 1].set_title("With Regression Line")

# Panel 3: Hexbin
hb = axes[1, 0].hexbin(df["math score"], df["writing score"], gridsize=20, cmap="YlOrRd")
axes[1, 0].set_title("Hexbin Density")
axes[1, 0].set_xlabel("Math Score")
axes[1, 0].set_ylabel("Writing Score")
plt.colorbar(hb, ax=axes[1, 0], label="Count")

# Panel 4: Colored by lunch
sns.scatterplot(data=df, x="math score", y="writing score", hue="lunch",
                alpha=0.5, ax=axes[1, 1], palette="Set1")
axes[1, 1].set_title("Colored by Lunch Type")

plt.tight_layout()
plt.show()
```

</div>
</details>
