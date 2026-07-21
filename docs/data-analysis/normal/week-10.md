---
title: "Week 10: Guided EDA — the Titanic Dataset"
sidebar_position: 5
section: data-analysis
track: normal
week: 10
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 10: Guided EDA — the Titanic Dataset

<span className="gamified-flourish">🚢 Every tool from Weeks 6–9 comes together this week on one of the most famous beginner datasets in data science.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Load and clean a real-shaped dataset ([`titanic.csv`](pathname:///datasets/titanic.csv)) end to end.
- Answer concrete analytical questions using selection, filtering, and `.groupby()` together.
- Reproduce the structure of a classic Kaggle-style EDA notebook, one cell at a time.

## Lesson

This week is deliberately less "new concept, new syntax" and more "apply everything, in sequence, on one dataset." The Titanic dataset ([credited here](/credits)) has become a standard beginner benchmark for exactly this reason: it's small, has a clear outcome column (`Survived`), and has enough messy real-world texture (missing ages, mixed types) to need every tool from this section.

### Step 1: Load and inspect

```python
import pandas as pd

df = pd.read_csv("titanic.csv")
df.shape
df.head()
df.info()
df.describe()
```

Before analyzing anything, always ask: how many rows, what columns, what dtypes, what's missing? This is Week 6 and Week 8's material, applied as the very first step of any real analysis — not a formality, but the foundation everything after depends on.

### Step 2: Handle missing data

```python
df.isna().sum()
```

`Age` typically has missing values in this dataset. Rather than dropping those rows outright (losing other information about those passengers), a common choice is filling with the median age — the median, not the mean, because age distributions are often skewed by a few very young or very old passengers:

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
```

### Step 3: Ask questions, answer with filtering + groupby

**Question: did survival rate differ by passenger class?**

```python
df.groupby("Pclass")["Survived"].mean()
```

Each group's mean of a 0/1 column is exactly the survival *rate* for that group — the same "mean of a boolean-like column = proportion" trick you'll use constantly in data analysis.

**Question: did survival rate differ by sex?**

```python
df.groupby("Sex")["Survived"].mean()
```

**Question: among passengers who paid the top 25% of fares, what was the survival rate?**

```python
fare_threshold = df["Fare"].quantile(0.75)
top_fare_passengers = df[df["Fare"] >= fare_threshold]
top_fare_passengers["Survived"].mean()
```

This combines a filter (Week 7) with an aggregate (`.mean()`, Week 6) — the same two-step pattern as nearly every question you'll ask of a real dataset: narrow down to the rows you care about, then summarize them.

### Step 4: Combine grouping dimensions

`.groupby()` accepts a *list* of columns, partitioning by every combination of their values at once:

```python
df.groupby(["Pclass", "Sex"])["Survived"].mean()
```

This answers a more specific question than either grouping alone: does the class effect on survival hold *within* each sex, or does it disappear once you control for sex?

## 🧩 Challenges

<Challenge id="dataanalysis-normal-w10-c1" answer={<><code>df.groupby("Embarked")["Survived"].mean()</code> — same one-liner pattern as class/sex, just grouped by the embarkation port column instead.</>}>

Compute the survival rate by `Embarked` port. Which port had the highest survival rate in this dataset?

</Challenge>

<Challenge id="dataanalysis-normal-w10-c2" answer={<><code>df[df["Age"] &lt; 18]["Survived"].mean()</code> compared against <code>df[df["Age"] &gt;= 18]["Survived"].mean()</code> — two filtered subsets, each summarized with the same aggregate.</>}>

Compare the survival rate of passengers under 18 to passengers 18 and older.

</Challenge>

<Challenge id="dataanalysis-normal-w10-c3" answer={<><code>df.groupby(["Pclass", "Sex"])["Survived"].mean()</code>, then read off both entries where Sex is "female" across the three Pclass values.</>}>

Using the combined `["Pclass", "Sex"]` groupby, does passenger class still matter for survival *within* female passengers specifically? Read the relevant rows of the result.

</Challenge>

<Challenge id="dataanalysis-normal-w10-c4" answer={<>Add a new column: <code>df["family_size"] = df["SibSp"] + df["Parch"] + 1</code> (the +1 counts the passenger themself), then group by it: <code>df.groupby("family_size")["Survived"].mean()</code>.</>}>

Create a new column `family_size` as `SibSp + Parch + 1` (siblings/spouses + parents/children + the passenger themself), then compute survival rate grouped by `family_size`.

</Challenge>

## 🤔 Socratic Questions

- The combined `.groupby(["Pclass", "Sex"])` result usually shows a *much* bigger gap by sex than by class alone. What does that suggest about which variable was doing more of the "work" in the single-variable groupby results from earlier?
- Filling missing `Age` values with the median assumes the missing ages aren't systematically different from the known ones. Can you think of a reason that assumption might be wrong for this specific dataset (i.e., a reason certain *kinds* of passengers might be more likely to have a missing age)?
- You just answered several real analytical questions using only tools from Weeks 6–9. Which single method (`.groupby()`, boolean masking, `.fillna()`, `.merge()`) did you end up using most? Does that match your expectation of which pandas skill matters most in practice?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-normal-week-10"
  questions={[
    {
      id: 'q1',
      prompt: 'For a 0/1 (survived/did not) column, what does .mean() within a group represent?',
      options: [
        'The total number of survivors',
        'The survival rate (proportion) within that group',
        'The most common value',
        'Nothing meaningful — mean only works on continuous data',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Why fill missing Age with the median rather than the mean in this lesson?',
      options: [
        'The mean cannot be computed on a column with missing values',
        'Median is less sensitive to a skewed distribution with outliers',
        'They always give identical results',
        'pandas does not support .mean() with NaN present',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'df.groupby(["Pclass", "Sex"]) groups rows by:',
      options: [
        'Pclass only, ignoring Sex',
        'Every unique combination of Pclass and Sex',
        'Sex only, ignoring Pclass',
        'Neither — this raises an error',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'The general EDA pattern this week repeatedly used was:',
      options: [
        'Merge, then sort',
        'Filter/group, then aggregate',
        'Drop all missing data, then plot',
        'Convert every column to string',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-10" />

---

**🎉 You've completed the Pandas & Data Analysis Normal track — and the whole course, if you took Normal in both sections.** Head to [My Progress](/progress) to see your badges and, if you've finished every week, unlock the [Capstone Bonus](/docs/bonus/capstone-ai-agent): installing Python for real and building your first AI agent.
