---
title: "Week 6: The EDA Framework"
sidebar_position: 1
section: data-analysis
track: hard
week: 6
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 6: The EDA Framework

<span className="gamified-flourish">🕵️ Exploratory Data Analysis isn't "make some charts." It's a disciplined way of asking a dataset questions before you trust any conclusion from it.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Explain what Exploratory Data Analysis (EDA) is and why it precedes any modeling or conclusion.
- Profile a new dataset systematically: shape, dtypes, missingness, and basic distributions.
- Frame a set of concrete analytical questions before diving into charts.
- Recognize a skewed distribution from summary statistics alone, before ever plotting it.
- Spot likely outliers using the interquartile range (IQR).

## Lesson

### What is EDA?

EDA is the practice of investigating a dataset's structure, quality, and patterns *before* drawing conclusions from it — a checklist against jumping straight to "here's my finding" without first verifying the data actually supports it. Statistician John Tukey, who popularized the term, framed it as detective work: look for clues, form hypotheses, then check them, rather than assuming the first pattern you notice is real.

This 5-week track builds toward one deliverable: a full EDA report on the **Students Performance in Exams** dataset in Week 10. This week sets up the *framework* you'll apply every week after.

### Step 1: Profile the dataset

Before asking any interesting question, establish the basics — the same first move as Normal track Week 6/10, but treated here as a formal, repeatable first step of any project:

```python
import pandas as pd

df = pd.read_csv("students-performance.csv")
df.shape
df.dtypes
df.isna().sum()
df.describe()
df.head()
```

For each column, ask: what kind of variable is this?
- **Numeric/continuous** (`math_score`, `reading_score`, `writing_score`): summarized by mean, median, std, distribution shape.
- **Categorical** (`gender`, `lunch`, `test_preparation_course`, `parental_level_of_education`): summarized by counts/proportions per category, using `.value_counts()`.

```python
df["gender"].value_counts()
df["parental_level_of_education"].value_counts()
df["gender"].value_counts(normalize=True)   # as proportions (0-1) instead of raw counts
```

`normalize=True` is the vectorized version of what you'd otherwise compute by hand as `count / total` — the same idea as Python 101 Hard track's word probabilities, applied to categories instead of words.

### Step 2: Frame questions before charting

A common EDA mistake is generating dozens of charts with no guiding question, then retroactively deciding which ones "look interesting" — this invites seeing patterns that are just noise. Instead, write down a small set of specific questions *before* visualizing, based on what the columns plausibly relate to:

- Does `test_preparation_course` completion associate with higher scores?
- Does `lunch` type (a rough proxy for socioeconomic status in this dataset) associate with scores?
- Are the three score columns (`math`, `reading`, `writing`) correlated with each other?

Weeks 7–9 build the tools to answer exactly these kinds of questions rigorously; Week 10 answers a fuller set of them for the final report.

### Step 3: Reading skewness from summary statistics alone

Before ever plotting a distribution, `mean` vs. `median` already hints at its shape. For a perfectly symmetric distribution, mean and median are equal (or very close). A mean noticeably *higher* than the median suggests a right (positive) skew — a handful of unusually high values pulling the average up; a mean noticeably *lower* than the median suggests a left (negative) skew:

```python
mean_score = df["math_score"].mean()
median_score = df["math_score"].median()
print(f"Mean: {mean_score:.1f}, Median: {median_score:.1f}")
```

Next week's histograms will let you *see* this shape directly, but being able to read it from two numbers alone is a useful habit before you've even loaded a plotting library.

### Step 4: Spotting outliers with the IQR

The **interquartile range** (IQR) is the span between the 25th and 75th percentiles — the middle 50% of the data — and gives a robust (not distorted by extreme values) way to flag unusually extreme values:

$$
\text{IQR} = Q_3 - Q_1, \quad \text{outlier if } x < Q_1 - 1.5 \cdot \text{IQR} \text{ or } x > Q_3 + 1.5 \cdot \text{IQR}
$$

```python
q1 = df["math_score"].quantile(0.25)
q3 = df["math_score"].quantile(0.75)
iqr = q3 - q1
lower_bound = q1 - 1.5 * iqr
upper_bound = q3 + 1.5 * iqr

outliers = df[(df["math_score"] < lower_bound) | (df["math_score"] > upper_bound)]
len(outliers)
```

The $1.5 \times \text{IQR}$ rule is a widely-used convention (it's also exactly what a boxplot's whiskers mark, which Week 7 covers) — not a law of nature, just a reasonable, standard default for "unusually far from the middle 50%."

### Step 5: Sanity-check before trusting a pattern

Every summary statistic deserves a moment of skepticism: how many rows is this actually based on? Could missing data be skewing it? Is a difference between two groups large enough to be interesting, or could it plausibly be noise from a small sample?

```python
df.groupby("test_preparation_course")["math_score"].agg(["mean", "count"])
```

Checking `count` alongside `mean` matters: a striking-looking average based on only 3 rows deserves far less confidence than the same average based on 300.

## ⚠️ Common pitfalls

- **Treating the $1.5 \times \text{IQR}$ outlier rule as absolute truth.** It's a convention, not a law — a flagged "outlier" might be a genuinely correct, if unusual, data point, not an error to remove.
- **Confusing skew direction.** A right (positive) skew means a *longer tail toward high values*, with the mean pulled above the median — it's easy to misremember which direction is which; anchoring on "mean vs. median" rather than trying to memorize "left/right" avoids the confusion.
- **Charting before framing a question.** It's tempting to jump straight to `df.plot()` — resist it until you've written down what you're actually trying to find out, per Step 2.

## 🧩 Challenges

<Challenge id="dataanalysis-hard-w6-c1" answer={<><code>df["lunch"].value_counts()</code> — counts each distinct category and how often it appears, sorted from most to least common by default.</>}>

Load `students-performance.csv` and use `.value_counts()` to see the distribution of the `lunch` column's categories.

</Challenge>

<Challenge id="dataanalysis-hard-w6-c2" answer={<>Write down at least 2–3 specific questions in plain English (e.g. "Does parental education level associate with reading_score?") before writing any pandas code to answer them — the discipline is in ordering, not in the code itself.</>}>

Before writing any analysis code, write down (in a markdown cell, or just as comments) three specific questions this dataset could plausibly answer, based only on its column names.

</Challenge>

<Challenge id="dataanalysis-hard-w6-c3" answer={<><code>df.groupby("parental_level_of_education")["writing_score"].agg(["mean", "count"])</code> — checking count alongside mean surfaces whether any group's average is based on too few rows to trust.</>}>

Compute mean `writing_score` grouped by `parental_level_of_education`, along with the count of students in each group. Are any groups small enough that their mean deserves less confidence?

</Challenge>

<Challenge id="dataanalysis-hard-w6-c4" answer={<>Compute all three: <code>df["math_score"].mean()</code>, <code>.median()</code>, <code>.std()</code>. A mean well above or below the median, or a very large std relative to the score range (0–100), would be signs of a skewed or spread-out distribution worth investigating with a histogram next week.</>}>

Compute the mean, median, and standard deviation of `math_score`. Based on these three numbers alone (no chart yet), do you expect the distribution to be roughly symmetric, or skewed?

</Challenge>

<Challenge id="dataanalysis-hard-w6-c5" answer={<>Compute Q1, Q3, and IQR for reading_score the same way as the math_score example, then filter for values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR] and count how many rows qualify.</>}>

Repeat the IQR outlier check from Step 4, but for the `reading_score` column instead of `math_score`. How many outliers do you find?

</Challenge>

<Challenge id="dataanalysis-hard-w6-c6" answer={<>Call df["test_preparation_course"].value_counts(normalize=True) to get the proportion completing vs. not completing test prep, and multiply by 100 (or format as a percent) to read it as a percentage.</>}>

Using `.value_counts(normalize=True)`, what proportion of students completed the `test_preparation_course`?

</Challenge>

## 🤔 Socratic Questions

- Tukey's framing of EDA as "detective work" implies you're forming and testing hypotheses, not just describing data. What's the practical difference between "students who completed test prep scored higher on average" (a description) and treating that as evidence that test prep *causes* higher scores (a claim)? What would you need to be more confident about causation?
- Why does the lesson insist on writing analytical questions down *before* generating charts, rather than after? What bias does looking at charts first introduce into which "questions" you end up asking?
- `df.groupby(...).agg(["mean", "count"])` was used specifically so a small-sample group wouldn't be mistaken for a strong pattern. Can you think of a group in this dataset where a large average difference might still not be very meaningful, even with a reasonably large count?
- The $1.5 \times \text{IQR}$ outlier rule flags points as "unusual" purely based on their position in the distribution, with no knowledge of *why* they're unusual. Can you think of a legitimate reason a student's score might be a genuine outlier without being a data-entry error?
- Comparing mean and median is a cheap way to detect skew without plotting anything. What information does this trick *not* give you that an actual histogram (next week) would reveal?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-hard-week-6"
  questions={[
    {
      id: 'q1',
      prompt: 'EDA is best described as:',
      options: [
        'Building a predictive model as fast as possible',
        'Systematically investigating a dataset\'s structure and quality before drawing conclusions',
        'Making as many charts as possible',
        'Cleaning data only, with no analysis',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'For a categorical column, which method summarizes the distribution of its categories?',
      options: ['.describe()', '.mean()', '.value_counts()', '.std()'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'Why check count alongside mean when comparing groups?',
      options: [
        'It is not actually useful',
        'A striking mean based on very few rows deserves less confidence',
        'count is required syntax for .groupby()',
        'It converts the mean into a percentage',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'The lesson recommends framing analytical questions:',
      options: [
        'After making all your charts',
        'Only at the very end of the report',
        'Before generating charts, to avoid retroactively picking "interesting" patterns',
        'It does not matter when',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'A mean noticeably higher than the median suggests:',
      options: [
        'A left (negative) skew',
        'A right (positive) skew',
        'A perfectly symmetric distribution',
        'Nothing — mean and median are unrelated',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-6" />
