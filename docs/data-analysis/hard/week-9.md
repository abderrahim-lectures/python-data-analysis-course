---
title: "Week 9: Advanced & Storytelling Visualizations"
sidebar_position: 4
section: data-analysis
track: hard
week: 9
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 9: Advanced & Storytelling Visualizations

<span className="gamified-flourish">🎨 A correct chart and a *convincing* chart aren't automatically the same thing. This week is about the difference.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Build faceted/multi-panel visualizations that show a relationship broken down by a third categorical variable.
- Use color, ordering, and annotation deliberately to make a chart's point clear at a glance.
- Choose a colorblind-friendly, purposeful color palette instead of the first default.
- Critique a chart for what it does and doesn't honestly show.
- Save a finished chart to a file for inclusion in a report.

## Lesson

### Faceting: adding a third dimension with panels

A scatter plot shows two numeric variables; `seaborn`'s faceting tools add a third — usually categorical — dimension by splitting into a grid of small, comparable panels rather than cramming everything into one chart:

```python
import seaborn as sns
import matplotlib.pyplot as plt

sns.relplot(
    data=df,
    x="reading_score",
    y="writing_score",
    col="test_preparation_course",   # one panel per category, side by side
    hue="gender",                     # color within each panel
)
plt.show()
```

This answers a genuinely multivariate question in one figure: does the reading/writing relationship look different for students who completed test prep vs. not, *and* does that differ by gender — all at once, comparable side by side because every panel shares the same axis scales. Adding `row=` alongside `col=` extends this to a full grid — one dimension across columns, another down rows:

```python
sns.relplot(
    data=df, x="reading_score", y="writing_score",
    col="test_preparation_course", row="lunch", hue="gender",
)
```

This is now a genuinely 4-variable figure (reading, writing, test prep, lunch, gender — five, actually) — impressive, but worth weighing against the "too many dimensions on one chart" pitfall below.

### Ordering categories deliberately

By default, categorical axes are often ordered alphabetically or by first appearance — rarely the most readable order. Explicitly ordering by a meaningful value (like the group's mean) makes a bar chart's pattern immediately legible instead of requiring the reader to hunt for it:

```python
order = df.groupby("parental_level_of_education")["math_score"].mean().sort_values().index

sns.barplot(data=df, x="parental_level_of_education", y="math_score", order=order)
plt.xticks(rotation=45, ha="right")
plt.title("Average math score by parental education level (ordered)")
plt.tight_layout()
plt.show()
```

`sns.barplot` (unlike a plain matplotlib bar chart) automatically computes the mean per category and adds error bars representing uncertainty — worth knowing so you don't mistake it for raw counts.

### Choosing a deliberate, colorblind-friendly palette

Seaborn's default palette is a reasonable starting point, but purposeful color choices communicate more: use a **sequential** palette (light to dark) for an ordered numeric variable, a **diverging** palette (two colors meeting at a neutral midpoint) for values that meaningfully go both above and below some center point (like the correlation heatmap's `"coolwarm"` in Week 8), and a **qualitative** palette for unordered categories. Seaborn's `"colorblind"` palette is a safe, deliberate default whenever color needs to distinguish categories reliably for every reader:

```python
sns.barplot(data=df, x="parental_level_of_education", y="math_score", order=order, palette="colorblind")
```

Roughly 1 in 12 men have some form of color vision deficiency — defaulting to a colorblind-safe palette costs nothing and excludes no one, which is why it's a reasonable default rather than a special-case choice.

### Annotating the point directly

A chart with a specific claim ("students who completed test prep scored, on average, N points higher") is more convincing when that number is visible on the chart itself, not left for the reader to compute from axis positions:

```python
means = df.groupby("test_preparation_course")["math_score"].mean()
ax = means.plot(kind="bar")
for i, value in enumerate(means):
    ax.text(i, value + 1, f"{value:.1f}", ha="center")
plt.ylabel("Average math score")
plt.title("Average math score by test preparation status")
plt.show()
```

### Saving a chart for your report

Once a chart is finished, `plt.savefig` writes it to an image file — useful for including in a written report rather than only viewing it inline:

```python
plt.savefig("math_score_by_prep.png", dpi=150, bbox_inches="tight")
```

`dpi=150` controls image resolution (higher = sharper, but a larger file); `bbox_inches="tight"` trims excess whitespace around the figure. Call `plt.savefig(...)` *before* `plt.show()` in the same cell — some environments clear the current figure once it's been displayed.

### Honest charts: what to watch for

A few common ways charts mislead, even without any fabricated numbers:
- **Truncated y-axis**: starting a bar chart's y-axis above 0 exaggerates small differences visually. Bar charts should almost always start at 0; line/scatter plots comparing *change* are a more defensible exception.
- **Cherry-picked axis range**: zooming into a narrow x-range can make noise look like a meaningful trend.
- **Unlabeled or misleading color scales**: a heatmap's color scale should be labeled and, per Week 8, fixed to a consistent range for genuine comparability.
- **Overplotting**: too many overlapping points (fixed with `alpha`, per Week 8, or aggregation) can visually hide the actual density of a relationship.

A storytelling chart earns trust by making its honesty easy to verify, not just by looking polished.

## ⚠️ Common pitfalls

- **Stacking too many dimensions onto one chart.** `row=`/`col=`/`hue=` together can technically show 4-5 variables at once, but a chart that needs a paragraph of explanation to decode has usually gone past the point of being genuinely more informative than two simpler charts.
- **Picking a palette for looks rather than meaning.** A rainbow palette on an ordered variable (like exam scores split into 5 ranges) makes the *order* harder to perceive than a proper sequential palette would.
- **Forgetting `plt.savefig()` must come before `plt.show()`.** Calling them in the wrong order can save a blank image in some environments.
- **Confusing `sns.barplot`'s error bars for something else.** They represent uncertainty in the estimated mean (by default, a bootstrap confidence interval) — not the data's raw spread, which is what a boxplot (Week 7/8) shows instead.

## 🧩 Challenges

<Challenge id="dataanalysis-hard-w9-c1" answer={<><code>sns.relplot(data=df, x="math_score", y="reading_score", col="lunch")</code> — one scatter panel per lunch category, sharing axis scales for direct comparison.</>}>

Create a faceted scatter plot of `math_score` vs. `reading_score`, with one panel per `lunch` category.

</Challenge>

<Challenge id="dataanalysis-hard-w9-c2" answer={<>Compute <code>order = df.groupby("race_ethnicity")["writing_score"].mean().sort_values().index</code> then pass <code>order=order</code> to <code>sns.barplot</code> — this sorts the bars from lowest to highest average instead of an arbitrary default order.</>}>

Build a bar chart of average `writing_score` by `race_ethnicity`, with bars explicitly ordered from lowest to highest average.

</Challenge>

<Challenge id="dataanalysis-hard-w9-c3" answer={<>A y-axis that doesn't start at 0 on a bar chart exaggerates the visual size of differences between bars — two bars that differ by only a few points can look dramatically different in height if the axis is truncated close to their values.</>}>

Take one of your bar charts from this week and deliberately set `plt.ylim(bottom=some_value_above_0)`. Compare the two versions side by side — how does the truncated version visually mislead about the size of the difference?

</Challenge>

<Challenge id="dataanalysis-hard-w9-c4" answer={<>Loop with <code>enumerate</code> over the group means and call <code>ax.text(i, value + 1, f"{'{'}value:.1f{'}'}", ha="center")</code> for each bar — placing the numeric value just above each bar, centered horizontally.</>}>

Take a bar chart of group means and annotate each bar with its numeric value directly above it, as shown in the lesson.

</Challenge>

<Challenge id="dataanalysis-hard-w9-c5" answer={<>Add palette="colorblind" to any of this week's charts that use hue or category colors, e.g. sns.barplot(..., palette="colorblind") or sns.relplot(..., hue="gender", palette="colorblind"), and compare visually to the default palette.</>}>

Take one chart from this week that uses color to distinguish categories, and redo it with `palette="colorblind"`. Does the distinction between categories still read clearly?

</Challenge>

<Challenge id="dataanalysis-hard-w9-c6" answer={<>Call plt.savefig("my_chart.png", dpi=150, bbox_inches="tight") right after building a chart and before plt.show(), then confirm the file exists (e.g. via a file listing) with a reasonable, non-zero size.</>}>

Save one of this week's finished charts to a PNG file using `plt.savefig`, with `dpi=150` and `bbox_inches="tight"`.

</Challenge>

## 🤔 Socratic Questions

- Faceting by `test_preparation_course` and coloring by `gender` puts four combinations of information on one figure. At what point does adding more dimensions to a single chart start making it *harder* to read rather than more informative? How would you decide when to split into separate figures instead?
- `sns.barplot` shows *means with error bars*, while a plain bar chart of raw counts shows something totally different. What could go wrong if a reader assumed a `sns.barplot` was showing counts?
- You now know several ways a chart can mislead without any fabricated numbers (truncated axes, cherry-picked ranges, unlabeled scales). Given that, what's your standard for deciding whether a chart you made for your own Week 10 report is "honest," beyond just "the numbers are correct"?
- Sequential, diverging, and qualitative palettes each match a different *kind* of variable. What would go visually wrong if you used a diverging palette (two colors meeting at a neutral midpoint) on a plain unordered categorical variable like `race_ethnicity`?
- A colorblind-friendly palette costs nothing to use by default. Can you think of other "accessible by default, costs nothing" choices from earlier weeks (axis labels, chart titles, avoiding color as the *only* way to distinguish groups) that follow the same principle?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-hard-week-9"
  questions={[
    {
      id: 'q1',
      prompt: 'Faceting (e.g. sns.relplot with col=...) is used to:',
      options: [
        'Remove outliers automatically',
        'Add a third (often categorical) dimension via a grid of comparable panels',
        'Convert numeric columns to categorical',
        'Compute correlation automatically',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Why should a bar chart\'s y-axis almost always start at 0?',
      options: [
        'It is a matplotlib requirement',
        'Starting above 0 visually exaggerates differences between bars',
        'It makes the chart render faster',
        'It is only a style preference with no real effect',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'sns.barplot, unlike a plain bar chart of raw values, automatically shows:',
      options: [
        'Raw counts only',
        'The mean per category with error bars',
        'A correlation matrix',
        'A boxplot instead of bars',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Explicitly ordering bars by their mean value (rather than alphabetically) mainly improves:',
      options: [
        'The underlying statistics',
        'Readability — the pattern becomes immediately visible',
        'Nothing — order does not affect interpretation',
        'The correlation coefficient',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'A "colorblind" palette is a reasonable default choice because:',
      options: [
        'It is the only palette seaborn supports',
        'It ensures category distinctions remain visible to color-vision-deficient readers, at no real cost',
        'It only works for numeric data',
        'It is required by matplotlib',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-9" />
