---
title: "Week 10: Guided EDA — the Titanic Dataset"
sidebar_position: 5
section: data-analysis
track: normal
week: 10
description: "Reproduce a classic Titanic exploratory data analysis notebook end to end with pandas."
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
- Bucket a continuous column into ranges with `pd.cut` for grouped analysis.
- Reproduce the structure of a classic Kaggle-style EDA notebook, one cell at a time, and summarize findings in plain English.

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

### Step 5: Bucketing a continuous column with `pd.cut`

`Age` is continuous, but "survival rate by exact age" is too fine-grained to read easily — grouping by age *ranges* (a discretization, the same idea as a histogram's bins) is usually more useful. `pd.cut` does exactly this:

```python
df["age_group"] = pd.cut(df["Age"], bins=[0, 12, 18, 35, 60, 100],
                          labels=["Child", "Teen", "Adult", "Middle-aged", "Senior"])
df.groupby("age_group")["Survived"].mean()
```

`bins` gives the edges of each range; `labels` names them. Now `age_group` is just another categorical column, usable with `.groupby()` exactly like `Pclass` or `Sex`.

### Step 6: Summarizing findings in plain English

A real EDA isn't finished until its numbers become a sentence someone else can read without re-running your code — the same discipline the Hard track's EDA framework treats as central:

```python
class_survival = df.groupby("Pclass")["Survived"].mean()
sex_survival = df.groupby("Sex")["Survived"].mean()

print(f"Overall survival rate: {df['Survived'].mean():.1%}")
print(f"1st class survival rate: {class_survival[1]:.1%}, "
      f"3rd class survival rate: {class_survival[3]:.1%}")
print(f"Female survival rate: {sex_survival['female']:.1%}, "
      f"male survival rate: {sex_survival['male']:.1%}")
```

`{value:.1%}` is an f-string format spec — Week 1 of Python 101 introduced `:.2f`; `.1%` similarly means "as a percentage, one decimal place," turning `0.629` into `"62.9%"` automatically.

## ⚠️ Common pitfalls

- **Answering a question with the wrong slice of data.** Always double-check a filter's boolean condition actually says what you meant — `df["Age"] < 18` and `df["Age"] <= 18` give different (if similar) answers, and the difference matters for edge cases.
- **Forgetting `pd.cut`'s bins are half-open in a specific direction.** By default, `pd.cut` bins are `(left, right]` — the left edge excluded, right edge included — worth checking if a value could plausibly sit exactly on a boundary.
- **Reporting a group's mean without also reporting its size.** A dramatic-looking survival rate for a group of 3 passengers deserves far less confidence than the same rate for a group of 300 — always look at `.count()` alongside `.mean()` when comparing groups, the same caution the Hard track's Week 6 emphasizes.

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

<Challenge id="dataanalysis-normal-w10-c5" answer={<>Use the age_group column from Step 5 and read off its survival rate; compare it to the raw Age &lt; 18 filter from Challenge 2 -- they should be broadly consistent, though the exact boundary (12 vs 18) differs, so the numbers won't match exactly.</>}>

Using the `age_group` column from Step 5, what's the survival rate for the `"Child"` bucket? How does it compare to your Challenge 2 answer for passengers under 18?

</Challenge>

<Challenge id="dataanalysis-normal-w10-c6" answer={<>Group by Pclass and use .agg(["mean", "count"]) on Survived, so both the survival rate and the group size are visible together -- a small group's rate can then be judged with appropriate caution.</>}>

Redo the Pclass survival-rate groupby, but this time include both the mean *and* the count of passengers in each class, in one `.agg(...)` call — so you can judge how much to trust each class's number.

</Challenge>

## 🤔 Socratic Questions

- The combined `.groupby(["Pclass", "Sex"])` result usually shows a *much* bigger gap by sex than by class alone. What does that suggest about which variable was doing more of the "work" in the single-variable groupby results from earlier?
- Filling missing `Age` values with the median assumes the missing ages aren't systematically different from the known ones. Can you think of a reason that assumption might be wrong for this specific dataset (i.e., a reason certain *kinds* of passengers might be more likely to have a missing age)?
- You just answered several real analytical questions using only tools from Weeks 6–9. Which single method (`.groupby()`, boolean masking, `.fillna()`, `.merge()`) did you end up using most? Does that match your expectation of which pandas skill matters most in practice?
- `pd.cut`'s bin edges (`[0, 12, 18, 35, 60, 100]`) were chosen somewhat arbitrarily in this lesson. How much do you think the "Child" survival rate could change if you moved the child/teen boundary from 12 to, say, 15? What does that suggest about being transparent about your binning choices in a real report?
- Step 6's plain-English summary only reports two variables (class, sex) even though you explored several more in the challenges. If you were writing this up for someone who'd never seen the raw numbers, which *one* additional finding from the challenges would you consider most worth including, and why that one?

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
    {
      id: 'q5',
      prompt: 'What does pd.cut do?',
      options: [
        'Removes rows with missing values',
        'Splits a continuous column into labeled ranges (bins)',
        'Merges two DataFrames',
        'Sorts a column in ascending order',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-10" />

---

**🎉 You've completed the Pandas & Data Analysis Normal track — and the whole course, if you took Normal in both sections.** Head to [My Progress](/progress) to see your badges and, if you've finished every week, unlock the [Capstone Bonus](/docs/bonus/capstone-ai-agent): installing Python for real and building your first AI agent.
