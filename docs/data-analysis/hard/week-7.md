---
title: "Week 7: Univariate Analysis & Visualization"
sidebar_position: 2
section: data-analysis
track: hard
week: 7
description: "Perform univariate analysis and build matplotlib/seaborn visualizations of single variables."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 7: Univariate Analysis & Visualization

<span className="gamified-flourish">📈 "Univariate" sounds intimidating. It just means: look at one variable at a time, properly, before comparing it to anything else.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Visualize a numeric column's distribution with a histogram, and a categorical column's distribution with a bar chart.
- Read a boxplot as a compact summary of a distribution's quartiles and outliers.
- Choose the right chart type for a variable's type, and label charts so they're readable on their own.
- Explain why the number of histogram bins is itself a meaningful choice, not an arbitrary default.

## Lesson

### Why visualize, not just summarize with numbers?

Week 6's `mean`/`median`/`std` describe a distribution with three numbers — but very different distributions can share the same mean and std. A chart shows *shape*: is it symmetric, skewed, bimodal (two humps), full of outliers? This is the core reason univariate visualization comes before anything more advanced.

### Histograms: distribution of a numeric variable

A histogram bins a numeric column's values and shows how many fall in each bin — a direct visual of the frequency distribution, the plotted version of last week's `mean`/`median`/`std` numbers:

```python
import matplotlib.pyplot as plt

df["math_score"].hist(bins=20, edgecolor="black")
plt.xlabel("Math score")
plt.ylabel("Number of students")
plt.title("Distribution of math scores")
plt.show()
```

Always label your axes and title your chart — a chart that only makes sense with the code that produced it next to it isn't finished.

#### Bin count is a real choice, not a default to ignore

Too few bins hides real structure (everything blurs into one or two lumps); too many bins shows noise as if it were meaningful structure (each bin has too few points to say anything reliable). There's no single universally correct number — try a couple of values and see which one tells the clearest, most honest story:

```python
fig, axes = plt.subplots(1, 3, figsize=(12, 4))
for ax, n_bins in zip(axes, [5, 20, 50]):
    df["math_score"].hist(bins=n_bins, ax=ax, edgecolor="black")
    ax.set_title(f"{n_bins} bins")
plt.tight_layout()
plt.show()
```

`plt.subplots(1, 3, figsize=(12, 4))` creates one figure with 3 side-by-side panels (`axes` is then a list of 3 individual plot areas) — a useful pattern whenever you want to compare a few variations of the same chart at once, which you'll reuse in Week 9.

### Boxplots: quartiles and outliers at a glance

A boxplot draws the 25th percentile, median, and 75th percentile as a box, with "whiskers" extending to the typical range and individual points beyond that marked as potential outliers — a compact visual of exactly the quartile numbers `.describe()` already gave you, and exactly the same $1.5 \times \text{IQR}$ rule from last week, drawn out visually:

```python
df.boxplot(column="math_score")
plt.ylabel("Math score")
plt.title("Math score spread")
plt.show()
```

Boxplots become especially useful once you compare *several* groups' distributions side by side — which is exactly next week's bivariate topic.

### Bar charts: distribution of a categorical variable

For a categorical column, `.value_counts()` (Week 6) plotted directly as a bar chart shows which categories are common vs. rare:

```python
df["parental_level_of_education"].value_counts().plot(kind="bar")
plt.xlabel("Parental level of education")
plt.ylabel("Number of students")
plt.title("Parental education levels in the dataset")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.show()
```

`plt.xticks(rotation=45, ha="right")` rotates long category labels so they don't overlap — a small but common fix for readability once labels get longer than a couple of characters. `plt.tight_layout()` prevents rotated/long labels from getting cut off at the figure's edge.

### Choosing the right chart

| Variable type | Chart |
|---|---|
| Numeric, want distribution shape | Histogram |
| Numeric, want quartiles/outliers, especially across groups | Boxplot |
| Categorical, want frequency of each category | Bar chart |

A bar chart of a numeric column (treating each unique score as its own "category") or a histogram of a categorical column are both usually wrong choices — matching the chart to the variable's actual type is the first design decision, before any styling.

## ⚠️ Common pitfalls

- **Forgetting axis labels and a title.** A chart that requires the reader to already know what it shows isn't finished — always label both axes and add a title, even for a "just exploring" chart you'll delete later.
- **Picking one bin count and never questioning it.** As shown above, the same data can tell noticeably different visual stories at 5 vs. 20 vs. 50 bins — always sanity-check with at least two bin counts before trusting what a histogram's shape seems to say.
- **Using the wrong chart for the variable type.** A histogram of a categorical column (like `gender`) or a bar chart of raw, un-aggregated numeric values are both signs the chart-choice table above wasn't consulted first.
- **Forgetting `plt.show()` (or a trailing bare expression) to actually display the chart**, especially when chaining several plotting calls — depending on your environment, a chart built across multiple lines may not render until explicitly shown.

## 🧩 Challenges

<Challenge id="dataanalysis-hard-w7-c1" answer={<><code>df["reading_score"].hist(bins=20, edgecolor="black")</code> with axis labels and a title — a direct histogram of the numeric column.</>}>

Plot a histogram of `reading_score` with labeled axes and a title.

</Challenge>

<Challenge id="dataanalysis-hard-w7-c2" answer={<><code>df.boxplot(column="writing_score")</code> — read the box's three lines as the 25th percentile, median, and 75th percentile, and any points beyond the whiskers as potential outliers.</>}>

Create a boxplot of `writing_score`. Looking at it, does the distribution appear symmetric, or is the median noticeably closer to one edge of the box?

</Challenge>

<Challenge id="dataanalysis-hard-w7-c3" answer={<><code>df["test_preparation_course"].value_counts().plot(kind="bar")</code> with axis labels/title — since this column only has two categories, rotation usually isn't necessary.</>}>

Plot a bar chart of the `test_preparation_course` column's category counts, with labeled axes.

</Challenge>

<Challenge id="dataanalysis-hard-w7-c4" answer={<>A histogram of <code>gender</code> makes little sense: it's categorical (only "male"/"female"), so binning it numerically is meaningless — the right chart is a bar chart of <code>.value_counts()</code>, exactly like <code>test_preparation_course</code> above.</>}>

Someone plots `df["gender"].hist()`. Explain why this is the wrong chart choice, and what they should use instead.

</Challenge>

<Challenge id="dataanalysis-hard-w7-c5" answer={<>Plot writing_score with a small bin count (e.g. 5) and a large one (e.g. 50), comparing them side by side using the subplots pattern from the lesson. The 5-bin version likely looks smoother/more general; the 50-bin version may look noisier/spikier, especially in regions with fewer students.</>}>

Plot `writing_score` as a histogram with 5 bins, then again with 50 bins. Describe how the apparent shape of the distribution changes between the two.

</Challenge>

<Challenge id="dataanalysis-hard-w7-c6" answer={<>Build a boxplot for each of the three score columns using df.boxplot(column=["math_score", "reading_score", "writing_score"]), which draws all three side by side in one call for direct visual comparison.</>}>

Create a single boxplot showing all three score columns (`math_score`, `reading_score`, `writing_score`) side by side, so their spreads can be compared at a glance.

</Challenge>

## 🤔 Socratic Questions

- Two distributions can have identical mean and standard deviation but very different shapes (e.g. one symmetric, one with two separate humps). Why does a histogram catch this difference while `mean`/`std` alone cannot?
- A boxplot marks points beyond the whiskers as potential "outliers." Does that automatically mean those data points are errors that should be removed? What else might explain a legitimately unusual but correct value?
- Why does `plt.xticks(rotation=45, ha="right")` matter more for `parental_level_of_education` (long category names) than for `gender` (short ones)? What general rule about label length and chart readability does this suggest?
- If a colleague showed you only a 50-bin histogram of a variable and claimed to see "three distinct clusters," what would you want to check before trusting that claim, given what you now know about bin-count sensitivity?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-hard-week-7"
  questions={[
    {
      id: 'q1',
      prompt: 'A histogram is the right chart choice for:',
      options: [
        'A categorical column\'s category counts',
        'A numeric column\'s distribution shape',
        'Comparing two DataFrames',
        'Showing missing value counts',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'A boxplot\'s box represents:',
      options: [
        'The minimum and maximum only',
        'The 25th percentile, median, and 75th percentile',
        'The mean and standard deviation',
        'Every individual data point',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'Why do two distributions with the same mean and std still need a chart to compare properly?',
      options: [
        'They cannot actually have the same mean and std',
        'Charts are always more accurate than numbers',
        'The same mean/std can come from very differently-shaped distributions',
        'pandas requires a chart before computing statistics',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q4',
      prompt: 'The right chart for a categorical column\'s value_counts() is:',
      options: ['A histogram', 'A boxplot', 'A bar chart', 'A scatter plot'],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'Why check a histogram at more than one bin count?',
      options: [
        'It is not necessary, one bin count is always sufficient',
        'Too few bins can hide structure, too many can show noise as if it were structure',
        'matplotlib requires at least two different bin counts to render',
        'It only matters for categorical columns',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-7" />
