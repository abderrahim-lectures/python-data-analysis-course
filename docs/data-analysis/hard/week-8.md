---
title: "Week 8: Bivariate & Multivariate Analysis"
sidebar_position: 3
section: data-analysis
track: hard
week: 8
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 8: Bivariate & Multivariate Analysis, Correlation

<span className="gamified-flourish">🔗 Last week: one variable at a time. This week: how do two (or more) variables move together?</span>

## 🎯 Learning objectives

By the end of this week you can:
- Compute and interpret a **correlation coefficient** between two numeric variables.
- Visualize a relationship between two numeric variables with a scatter plot, and between a numeric and categorical variable with grouped boxplots.
- Explain, precisely, why correlation does not imply causation.

## Lesson

### Correlation: how do two numeric variables move together?

The **Pearson correlation coefficient** $r$ measures the strength and direction of a *linear* relationship between two numeric variables, ranging from $-1$ (perfect negative) through $0$ (no linear relationship) to $+1$ (perfect positive):

```python
df["math_score"].corr(df["reading_score"])   # a single number between -1 and 1
```

For the whole set of numeric columns at once, `.corr()` on the DataFrame produces a full correlation matrix — every pair's $r$ value, including each variable trivially correlated $1.0$ with itself:

```python
df[["math_score", "reading_score", "writing_score"]].corr()
```

A heatmap visualizes this matrix at a glance, using color intensity for correlation strength:

```python
import seaborn as sns
import matplotlib.pyplot as plt

corr_matrix = df[["math_score", "reading_score", "writing_score"]].corr()
sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1)
plt.title("Correlation between score types")
plt.show()
```

`annot=True` prints the actual $r$ values on each cell; `vmin=-1, vmax=1` fixes the color scale to the coefficient's true range, so color intensity is comparable across different heatmaps rather than rescaled to whatever range happens to appear in this particular matrix.

### Scatter plots: visualizing a numeric–numeric relationship

A scatter plot shows the raw relationship a correlation coefficient only summarizes with one number:

```python
plt.scatter(df["reading_score"], df["writing_score"], alpha=0.5)
plt.xlabel("Reading score")
plt.ylabel("Writing score")
plt.title("Reading vs. writing scores")
plt.show()
```

`alpha=0.5` makes points semi-transparent, so overlapping points (common with integer scores repeating across many students) show up as darker regions instead of hiding each other completely.

### Grouped boxplots: numeric variable across categories

To compare a numeric variable's *distribution* across categories (not just its average), use `seaborn`'s grouped boxplot — the multi-group extension of last week's single boxplot:

```python
sns.boxplot(data=df, x="test_preparation_course", y="math_score")
plt.title("Math score by test preparation status")
plt.show()
```

This shows more than a single groupby mean: whether the *spread* differs between groups too, and whether outliers cluster in one group more than another.

### Correlation is not causation

$r$ close to $1$ or $-1$ tells you two variables move together — it says nothing about whether one *causes* the other, or whether both are driven by some third factor. A classic textbook example: ice cream sales and drowning incidents correlate strongly across a year, but ice cream doesn't cause drowning — both rise in summer, driven by a third factor (warm weather, more swimming). Whenever you find a strong correlation in this dataset, ask explicitly: is there a plausible third factor that could explain both variables moving together?

## 🧩 Challenges

<Challenge id="dataanalysis-hard-w8-c1" answer={<><code>df["math_score"].corr(df["writing_score"])</code> — a single Pearson correlation coefficient between the two columns.</>}>

Compute the correlation coefficient between `math_score` and `writing_score`.

</Challenge>

<Challenge id="dataanalysis-hard-w8-c2" answer={<><code>df[["math_score","reading_score","writing_score"]].corr()</code> then <code>sns.heatmap(..., annot=True)</code> — the pairwise matrix visualized with color and printed numbers together.</>}>

Build the full 3x3 correlation matrix for the three score columns and visualize it as a heatmap with the actual values annotated on each cell.

</Challenge>

<Challenge id="dataanalysis-hard-w8-c3" answer={<><code>sns.boxplot(data=df, x="lunch", y="math_score")</code> — a grouped boxplot comparing the math_score distribution between the two lunch categories side by side.</>}>

Create a grouped boxplot comparing `math_score` distributions across the two `lunch` categories.

</Challenge>

<Challenge id="dataanalysis-hard-w8-c4" answer={<>A plausible third factor is socioeconomic status: it could independently affect both <code>lunch</code> type (free/reduced lunch programs are tied to household income) and academic preparation/resources (affecting scores) — so lunch type and scores could correlate without lunch itself causing score differences.</>}>

If `lunch` type and `math_score` show a noticeable difference in your boxplot from the previous challenge, propose one plausible *third factor* that could explain both without `lunch` type directly causing score differences.

</Challenge>

## 🤔 Socratic Questions

- The three score columns (`math`, `reading`, `writing`) are very likely to correlate strongly with each other. What's a plausible explanation for that — is it more likely each subject genuinely improves the others, or that both are driven by some shared underlying factor (e.g. general academic preparation, study habits)? How would you even begin to distinguish these?
- A correlation coefficient near 0 means no *linear* relationship. Could two variables still have a strong, real, non-linear relationship (e.g. a U-shape) and still show $r \approx 0$? What would that look like on a scatter plot that a single number would miss entirely?
- Why does the heatmap fix `vmin=-1, vmax=1` explicitly, rather than letting the color scale auto-fit to whatever range of values happens to appear in this particular matrix? What could go wrong when comparing two different heatmaps if their color scales weren't fixed the same way?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-hard-week-8"
  questions={[
    {
      id: 'q1',
      prompt: 'A Pearson correlation coefficient of -0.9 indicates:',
      options: [
        'No relationship at all',
        'A strong positive relationship',
        'A strong negative relationship',
        'That one variable causes the other',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: 'The ice cream sales / drowning incidents example illustrates:',
      options: [
        'A perfect causal relationship',
        'Correlation without causation, both driven by a third factor (weather)',
        'A negative correlation',
        'A chart-reading mistake, not a statistical concept',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'A grouped boxplot (numeric variable split by category) shows more than a groupby mean because it also reveals:',
      options: [
        'The exact sample size only',
        'The spread/outliers within each group, not just the average',
        'Causation between the variables',
        'It shows exactly the same information as a bar chart of means',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'What does alpha=0.5 do in a matplotlib scatter plot?',
      options: [
        'Changes the marker shape',
        'Makes points semi-transparent so overlapping points are visible',
        'Filters out half the data points',
        'Sets the correlation threshold',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-8" />
