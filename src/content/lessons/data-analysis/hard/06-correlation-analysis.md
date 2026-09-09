---

title: "Correlation Analysis"
description: "Compute and visualize Pearson and Spearman correlations, detect multicollinearity, and interpret correlation matrices."
module: "bivariate-analysis"
order: 6
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Compute Pearson and Spearman correlation coefficients and interpret their values"
  - "Build correlation matrices and heatmaps for multivariate relationship overview"
  - "Distinguish correlation from causation and identify confounders"
  - "Detect multicollinearity and decide when to drop or combine correlated features"
prerequisites: ["05-bivariate-numerical"]
tags: ["correlation", "heatmap", "pearson", "spearman", "multicollinearity"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "What is the difference between Pearson and Spearman correlation?"
    options:
      - text: "Pearson measures linear relationships, Spearman measures monotonic relationships"
        correct: true
      - text: "Pearson is always more accurate"
      - text: "Spearman only works with binary data"
      - text: "There is no difference"
  - question: "What does a correlation of 0 mean?"
    options:
      - text: "The variables are identical"
      - text: "There is no linear relationship between the variables"
        correct: true
      - text: "One variable is always zero"
      - text: "The variables are perfectly correlated"
  - question: "Why should you check for multicollinearity?"
    options:
      - text: "It makes plots look bad"
      - text: "Highly correlated predictors can destabilize statistical models"
        correct: true
      - text: "It reduces the sample size"
      - text: "It causes missing values"
---
Correlation measures the strength and direction of a linear relationship between two numerical variables. This lesson covers Pearson and Spearman correlation, how to build and read correlation heatmaps, and how to detect multicollinearity — the silent destroyer of regression models.

## Key Concepts

### Pearson correlation

Pearson correlation (r) measures linear association between two continuous variables:

```python
import pandas as pd
import numpy as np

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Compute Pearson correlation between two variables
r = df["math score"].corr(df["reading score"], method="pearson")
print(f"Pearson r (math vs reading): {r:.4f}")
```

Interpreting r:
| Range | Strength | Direction |
|-------|----------|-----------|
| 0.00 – 0.19 | Very weak | — |
| 0.20 – 0.39 | Weak | — |
| 0.40 – 0.59 | Moderate | — |
| 0.60 – 0.79 | Strong | — |
| 0.80 – 1.00 | Very strong | — |

The sign indicates direction: positive (both increase together) or negative (one increases as the other decreases).

### Spearman correlation

Spearman correlation (ρ) measures monotonic relationships — it works with ordinal data and is robust to outliers:

```python
rho = df["math score"].corr(df["reading score"], method="spearman")
print(f"Spearman ρ (math vs reading): {rho:.4f}")

# Compare Pearson vs Spearman
pearson = df["math score"].corr(df["reading score"], method="pearson")
spearman = df["math score"].corr(df["reading score"], method="spearman")
print(f"Pearson: {pearson:.4f}  |  Spearman: {spearman:.4f}")
```

When Pearson and Spearman diverge:
- **Spearman > Pearson**: relationship is monotonic but not linear (curved)
- **Pearson > Spearman**: outliers are inflating the linear correlation
- **Both similar**: relationship is linear and monotonic

### Correlation matrix

Compute correlations for all numerical columns at once:

```python
# Full correlation matrix
num_cols = df.select_dtypes(include="number")
corr_matrix = num_cols.corr(method="pearson")
print(corr_matrix.round(3))
```

### Heatmap visualization

A heatmap makes the correlation matrix visual and scannable:

```python
import seaborn as sns
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    corr_matrix,
    annot=True,          # show correlation values
    fmt=".2f",           # two decimal places
    cmap="RdBu_r",       # red-blue diverging colormap
    center=0,            # center colormap at zero
    vmin=-1, vmax=1,     # full correlation range
    square=True,         # square cells
    linewidths=0.5,      # cell borders
    ax=ax
)
ax.set_title("Correlation Matrix — Students Performance")
plt.tight_layout()
plt.show()
```

### Triangular heatmap (remove redundancy)

The full matrix is symmetric — the upper triangle repeats the lower triangle. Remove it:

```python
import numpy as np

mask = np.triu(np.ones_like(corr_matrix, dtype=bool))

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    corr_matrix,
    mask=mask,
    annot=True,
    fmt=".2f",
    cmap="RdBu_r",
    center=0,
    vmin=-1, vmax=1,
    square=True,
    linewidths=0.5,
    ax=ax
)
ax.set_title("Correlation Matrix (Lower Triangle)")
plt.tight_layout()
plt.show()
```

### Pair plot for multivariate overview

Pair plots show every pairwise relationship in one figure:

```python
sns.pairplot(
    df,
    vars=["math score", "reading score", "writing score"],
    hue="gender",
    diag_kind="kde",
    plot_kws={"alpha": 0.4},
    height=3
)
plt.suptitle("Pair Plot: Scores by Gender", y=1.02)
plt.show()
```

### Correlation does not imply causation

The most important caveat in statistics. Three reasons a correlation might be misleading:

1. **Confounding**: a third variable drives both. Example: parental education correlates with student scores, but it might be income driving both.
2. **Reverse causation**: the direction is backwards. Example: does test prep cause higher scores, or do high-scoring students self-select into test prep?
3. **Spurious correlation**: two unrelated variables happen to correlate. Example: ice cream sales and drowning rates both increase in summer (temperature is the confounder).

```python
# Check for confounders
# Does the math-reading correlation change after controlling for gender?
for gender in df["gender"].unique():
    subset = df[df["gender"] == gender]
    r = subset["math score"].corr(subset["reading score"])
    print(f"{gender}: math-reading r = {r:.3f}")
```

### Multicollinearity detection

When two or more features in a regression model are highly correlated, multicollinearity inflates standard errors and makes coefficient estimates unstable.

Rules of thumb:
- |r| > 0.7: investigate — may need to drop one variable
- |r| > 0.9: serious multicollinearity — drop or combine

```python
# Find highly correlated pairs
high_corr_pairs = []
for i in range(len(corr_matrix.columns)):
    for j in range(i+1, len(corr_matrix.columns)):
        if abs(corr_matrix.iloc[i, j]) > 0.7:
            high_corr_pairs.append((
                corr_matrix.columns[i],
                corr_matrix.columns[j],
                corr_matrix.iloc[i, j]
            ))

print("Highly correlated pairs (|r| > 0.7):")
for col1, col2, r in high_corr_pairs:
    print(f"  {col1} <-> {col2}: r = {r:.3f}")
```

## Try It

Build a complete correlation analysis for the Students Performance dataset.

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

num_cols = df.select_dtypes(include="number")
corr = num_cols.corr()

# Triangular heatmap
mask = np.triu(np.ones_like(corr, dtype=bool))
fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(corr, mask=mask, annot=True, fmt=".2f", cmap="RdBu_r",
            center=0, vmin=-1, vmax=1, square=True, linewidths=0.5, ax=ax)
ax.set_title("Correlation Heatmap")
plt.tight_layout()
plt.show()

# Pair plot
sns.pairplot(df, vars=["math score", "reading score", "writing score"],
             hue="gender", diag_kind="kde", plot_kws={"alpha": 0.4}, height=3)
plt.suptitle("Pair Plot: Scores by Gender", y=1.02)
plt.show()

# Find high correlations
for i in range(len(corr.columns)):
    for j in range(i+1, len(corr.columns)):
        if abs(corr.iloc[i, j]) > 0.5:
            print(f"{corr.columns[i]} <-> {corr.columns[j]}: r = {corr.iloc[i, j]:.3f}")
```

## Key Takeaways

- Pearson measures linear correlation; Spearman measures monotonic correlation — use both when the relationship might be non-linear
- Heatmaps make correlation matrices visual; triangular heatmaps remove redundant information
- Pair plots give a complete multivariate overview with marginal distributions
- Correlation never implies causation — confounders, reverse causation, and spurious correlations are always possible
- Multicollinearity (|r| > 0.7) inflates standard errors in regression models and should be addressed

## Practice Challenge

Compute both Pearson and Spearman correlations for all score pairs. Create a figure with two heatmaps side by side (one for each method). Annotate which pairs have the biggest discrepancy between Pearson and Spearman, and explain what that discrepancy means.

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

scores = df[["math score", "reading score", "writing score"]]

pearson_corr = scores.corr(method="pearson")
spearman_corr = scores.corr(method="spearman")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Pearson
sns.heatmap(pearson_corr, annot=True, fmt=".3f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, linewidths=0.5, ax=axes[0])
axes[0].set_title("Pearson Correlation")

# Spearman
sns.heatmap(spearman_corr, annot=True, fmt=".3f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, linewidths=0.5, ax=axes[1])
axes[1].set_title("Spearman Correlation")

plt.tight_layout()
plt.show()

# Find discrepancies
mask = np.triu(np.ones_like(pearson_corr, dtype=bool))
diff = (pearson_corr - spearman_corr).abs()
for i in range(len(diff.columns)):
    for j in range(i+1, len(diff.columns)):
        d = diff.iloc[i, j]
        if d > 0.01:
            print(f"{diff.columns[i]} <-> {diff.columns[j]}: "
                  f"Pearson={pearson_corr.iloc[i,j]:.3f}, "
                  f"Spearman={spearman_corr.iloc[i,j]:.3f}, "
                  f"Diff={d:.3f}")
```

</div>
</details>
