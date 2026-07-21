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
```

### Step 2: Frame questions before charting

A common EDA mistake is generating dozens of charts with no guiding question, then retroactively deciding which ones "look interesting" — this invites seeing patterns that are just noise. Instead, write down a small set of specific questions *before* visualizing, based on what the columns plausibly relate to:

- Does `test_preparation_course` completion associate with higher scores?
- Does `lunch` type (a rough proxy for socioeconomic status in this dataset) associate with scores?
- Are the three score columns (`math`, `reading`, `writing`) correlated with each other?

Weeks 7–9 build the tools to answer exactly these kinds of questions rigorously; Week 10 answers a fuller set of them for the final report.

### Step 3: Sanity-check before trusting a pattern

Every summary statistic deserves a moment of skepticism: how many rows is this actually based on? Could missing data be skewing it? Is a difference between two groups large enough to be interesting, or could it plausibly be noise from a small sample?

```python
df.groupby("test_preparation_course")["math_score"].agg(["mean", "count"])
```

Checking `count` alongside `mean` matters: a striking-looking average based on only 3 rows deserves far less confidence than the same average based on 300.

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

## 🤔 Socratic Questions

- Tukey's framing of EDA as "detective work" implies you're forming and testing hypotheses, not just describing data. What's the practical difference between "students who completed test prep scored higher on average" (a description) and treating that as evidence that test prep *causes* higher scores (a claim)? What would you need to be more confident about causation?
- Why does the lesson insist on writing analytical questions down *before* generating charts, rather than after? What bias does looking at charts first introduce into which "questions" you end up asking?
- `df.groupby(...).agg(["mean", "count"])` was used specifically so a small-sample group wouldn't be mistaken for a strong pattern. Can you think of a group in this dataset where a large average difference might still not be very meaningful, even with a reasonably large count?

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
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-6" />
