---

title: "Univariate Numerical Analysis"
description: "Analyze distributions, central tendency, spread, and shape of numerical variables using histograms, KDE plots, and box plots."
module: "univariate-analysis"
order: 3
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Compute and interpret mean, median, mode, std, skewness, and kurtosis for numerical columns"
  - "Create histograms, KDE plots, box plots, and violin plots with matplotlib and seaborn"
  - "Read distribution shapes to identify skewness, modality, and outliers"
  - "Choose the right plot type based on data characteristics and analysis goals"
prerequisites: ["02-dataset-profiling"]
tags: ["univariate", "matplotlib", "seaborn", "distributions", "histograms"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "What does describe() tell you about a numerical column?"
    options:
      - text: "Only the mean"
      - text: "Count, mean, std, min, quartiles, and max"
        correct: true
      - text: "Only the median"
      - text: "Only the standard deviation"
  - question: "When should you use a histogram vs a box plot?"
    options:
      - text: "They are always interchangeable"
      - text: "Histogram shows distribution shape, box plot shows outliers and quartiles"
        correct: true
      - text: "Box plot is better for categorical data"
      - text: "Histogram is better for small datasets"
  - question: "What does a skewed distribution indicate?"
    options:
      - text: "The data is normally distributed"
      - text: "Most values cluster on one side with a tail on the other"
        correct: true
      - text: "All values are the same"
      - text: "There are no outliers"
---
Univariate numerical analysis examines one numerical variable at a time. The goal is to understand its distribution: where values cluster, how spread they are, whether the distribution is symmetric or skewed, and whether outliers exist. This lesson covers the core plot types and summary statistics for numerical data.

## Key Concepts

### Summary statistics

Before plotting, compute the numbers that describe the distribution:

```python
import pandas as pd
import numpy as np

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

scores = df["math score"]

# Central tendency
print(f"Mean:   {scores.mean():.2f}")
print(f"Median: {scores.median():.2f}")

# Spread
print(f"Std:    {scores.std():.2f}")
print(f"IQR:    {scores.quantile(0.75) - scores.quantile(0.25):.2f}")
print(f"Range:  {scores.max() - scores.min()}")

# Shape
print(f"Skewness:  {scores.skew():.2f}")
print(f"Kurtosis:  {scores.kurtosis():.2f}")
```

Interpretation:
- **Skewness > 0**: right-skewed tail (e.g., most scores low, a few very high)
- **Skewness < 0**: left-skewed tail (e.g., most scores high, a few very low)
- **Kurtosis > 0**: heavy tails (more outliers than normal)
- **Kurtosis < 0**: light tails (fewer outliers than normal)

### Histograms

The histogram is the foundation of univariate numerical analysis. It shows the frequency distribution:

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Basic histogram
axes[0].hist(scores, bins=20, edgecolor="black", alpha=0.7)
axes[0].set_title("Math Score Distribution (histogram)")
axes[0].set_xlabel("Math Score")
axes[0].set_ylabel("Frequency")

# Histogram with KDE overlay
sns.histplot(scores, kde=True, bins=20, ax=axes[1], color="steelblue")
axes[1].set_title("Math Score Distribution (histogram + KDE)")

plt.tight_layout()
plt.show()
```

Key decisions:
- **Number of bins**: Too few hides detail, too many creates noise. `bins=20` is a reasonable default for datasets under 10,000 rows. Use `bins="auto"` for automatic selection.
- **Edge color**: `edgecolor="black"` makes bin boundaries visible.

### KDE plots (Kernel Density Estimation)

KDE plots smooth the histogram into a continuous curve, making it easier to compare distributions and identify modality:

```python
fig, ax = plt.subplots(figsize=(8, 5))

# Single KDE
sns.kdeplot(scores, fill=True, alpha=0.5, ax=ax)
ax.set_title("Math Score KDE")
ax.set_xlabel("Math Score")
plt.show()

# Compare distributions
fig, ax = plt.subplots(figsize=(8, 5))
for subject in ["math score", "reading score", "writing score"]:
    sns.kdeplot(df[subject], fill=True, alpha=0.3, label=subject, ax=ax)
ax.set_title("Score Distributions by Subject")
ax.legend()
plt.show()
```

### Box plots

Box plots show the five-number summary (min, Q1, median, Q3, max) and highlight outliers:

```python
fig, ax = plt.subplots(figsize=(8, 5))

sns.boxplot(x=scores, ax=ax, color="lightblue", flierprops=dict(marker="o", markersize=5))
ax.set_title("Math Score Box Plot")
ax.set_xlabel("Math Score")
plt.show()
```

Reading a box plot:
- **Box**: Interquartile range (IQR), the middle 50% of data
- **Line inside box**: Median
- **Whiskers**: 1.5 × IQR from Q1 and Q3
- **Points beyond whiskers**: Outliers (typically > 1.5 × IQR)

### Violin plots

Violin plots combine the box plot with the KDE, showing both summary statistics and the full distribution shape:

```python
fig, ax = plt.subplots(figsize=(8, 5))

sns.violinplot(x=scores, ax=ax, inner="quartile", color="lightgreen")
ax.set_title("Math Score Violin Plot")
ax.set_xlabel("Math Score")
plt.show()
```

The `inner` parameter controls what is drawn inside the violin:
- `"quartile"`: shows Q1, median, Q3 lines
- `"box"`: shows a miniature box plot
- `"stick"`: shows all data points as ticks

### Choosing the right plot

| Plot | Best for | Shows |
|------|----------|-------|
| Histogram | Frequency distribution, shape | Bins and counts |
| KDE | Smooth distribution, comparing groups | Continuous density curve |
| Box plot | Summary statistics, outliers | Five-number summary |
| Violin plot | Full distribution + summary | KDE + box plot combined |

### Comparing distributions across groups

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5), sharey=True)

for i, subject in enumerate(["math score", "reading score", "writing score"]):
    sns.boxplot(data=df, x="gender", y=subject, ax=axes[i])
    axes[i].set_title(subject.replace(" score", " Scores").title())

plt.tight_layout()
plt.show()
```

## Try It

Analyze the reading score distribution from the Students Performance dataset.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

reading = df["reading score"]

# Summary statistics
print("Summary Statistics:")
print(f"  Mean:   {reading.mean():.2f}")
print(f"  Median: {reading.median():.2f}")
print(f"  Std:    {reading.std():.2f}")
print(f"  Skew:   {reading.skew():.2f}")

# Distribution plots
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

sns.histplot(reading, kde=True, bins=20, ax=axes[0], color="steelblue")
axes[0].set_title("Histogram + KDE")

sns.kdeplot(reading, fill=True, ax=axes[1], color="coral")
axes[1].set_title("KDE Only")

sns.boxplot(x=reading, ax=axes[2], color="lightgreen")
axes[2].set_title("Box Plot")

plt.tight_layout()
plt.show()
```

## Key Takeaways

- Always compute summary statistics before plotting, they tell you what to look for in the visual
- Histograms show frequency; KDE plots show density; box plots show summary statistics; violin plots combine both
- Skewness and kurtosis quantify distribution shape in numbers
- Box plots make outliers obvious; histograms reveal modality (unimodal vs bimodal)
- Compare distributions across groups by plotting them side by side with shared axes

## Practice Challenge

Create a single figure with four subplots showing the distribution of `math score` using: (1) a histogram, (2) a KDE plot, (3) a box plot, and (4) a violin plot. Add a vertical line at the mean on each plot. Set the figure title to "Math Score Distribution Analysis".

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

math = df["math score"]
mean_val = math.mean()

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
fig.suptitle("Math Score Distribution Analysis", fontsize=14, fontweight="bold")

# Histogram
sns.histplot(math, kde=False, bins=20, ax=axes[0, 0], color="steelblue", edgecolor="black")
axes[0, 0].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[0, 0].set_title("Histogram")
axes[0, 0].legend()

# KDE
sns.kdeplot(math, fill=True, ax=axes[0, 1], color="coral")
axes[0, 1].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[0, 1].set_title("KDE Plot")
axes[0, 1].legend()

# Box plot
sns.boxplot(x=math, ax=axes[1, 0], color="lightgreen", flierprops=dict(marker="o", markersize=5))
axes[1, 0].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[1, 0].set_title("Box Plot")
axes[1, 0].legend()

# Violin
sns.violinplot(x=math, ax=axes[1, 1], inner="quartile", color="lightyellow")
axes[1, 1].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[1, 1].set_title("Violin Plot")
axes[1, 1].legend()

plt.tight_layout()
plt.show()
```

</div>
</details>
