---
title: "Week 9: Groupby, Aggregation & Merging"
sidebar_position: 4
section: data-analysis
track: normal
week: 9
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 9: Groupby, Aggregation & Merging

<span className="gamified-flourish">🗂️ "Break the dataset into groups, then summarize each group" is one sentence in pandas and about ten lines in plain Python.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Partition a DataFrame into groups with `.groupby()`, and explain the connection to partitioning a set.
- Compute per-group aggregates (`.mean()`, `.sum()`, `.count()`, and multiple at once with `.agg()`).
- Combine two DataFrames with `.merge()`, matching rows by a shared key.

## Lesson

### `.groupby()`: partitioning a set

Recall that a **partition** of a set $S$ splits it into disjoint subsets whose union is $S$. `.groupby("column")` does exactly this: it splits a DataFrame's rows into groups, one per distinct value in that column:

```python
df.groupby("lunch")               # a GroupBy object — groups formed, nothing computed yet
df.groupby("lunch")["math_score"].mean()   # mean math_score within each lunch group
```

Nothing is computed until you attach an aggregation — `.groupby()` alone just describes *how* to split the rows.

### Aggregating

Standard aggregations map directly onto statistics you already know:

```python
df.groupby("lunch")["math_score"].mean()     # average math_score per lunch type
df.groupby("lunch")["math_score"].count()     # how many rows (students) per group
df.groupby("lunch").agg({                      # multiple columns/stats at once
    "math_score": "mean",
    "reading_score": "mean",
})
```

`.groupby(...)[...]` reads left to right as "partition by this column, then look at this other column within each part" — the pandas phrasing of "for each group, compute a statistic over a different variable."

### Merging: combining two DataFrames

`.merge()` joins two DataFrames on a shared key column, the same idea as a database join or matching entries between two lookup tables by a common ID:

```python
students = pd.DataFrame({"student_id": [1, 2, 3], "name": ["Amina", "Youssef", "Sara"]})
grades = pd.DataFrame({"student_id": [1, 2, 3], "grade": ["A", "B", "A"]})

merged = students.merge(grades, on="student_id")
# student_id | name    | grade
#     1      | Amina   |   A
#     2      | Youssef |   B
#     3      | Sara    |   A
```

`how="inner"` (the default) keeps only rows where the key exists in *both* DataFrames; `how="left"`/`"right"`/`"outer"` control what happens to rows whose key is missing from the other side — worth checking explicitly whenever row counts might not match after a merge.

## 🧩 Challenges

<Challenge id="dataanalysis-normal-w9-c1" answer={<><code>df.groupby("gender")["math_score"].mean()</code> — groups the students by gender, then averages math_score within each group.</>}>

Using a students-performance-style DataFrame (columns include `gender` and `math_score`), compute the average `math_score` for each `gender`.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c2" answer={<><code>df.groupby("test_preparation_course")["math_score"].agg(["mean", "count"])</code> — <code>.agg</code> with a list computes multiple statistics for the same column at once, as separate result columns.</>}>

Group by `test_preparation_course` and compute *both* the mean and the count of `math_score` for each group, in a single `.agg(...)` call.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c3" answer={<>Compare <code>df.groupby("lunch")["reading_score"].mean()</code> across the two lunch categories directly — whichever group's mean is higher answers the question.</>}>

Which `lunch` category has a higher average `reading_score`? Answer using `.groupby()`, not manual filtering.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c4" answer={<>Create two small DataFrames sharing a key column (e.g. <code>student_id</code>) and call <code>left.merge(right, on="student_id")</code>; try mismatched keys on each side to see how <code>how="inner"</code> silently drops unmatched rows compared to <code>how="outer"</code>.</>}>

Create two small DataFrames by hand (e.g. one with student names, one with a separate score for each), sharing a common key column, and merge them. Then try mismatching one key on purpose and observe what `how="inner"` does with it versus `how="outer"`.

</Challenge>

## 🤔 Socratic Questions

- `.groupby("lunch")` alone (with no aggregation attached) doesn't print a table of numbers — what do you think it actually returns, and why does pandas wait to compute anything until you specify an aggregation?
- If two DataFrames being merged share a key column but one DataFrame has a *duplicate* key (two rows with the same `student_id`), what do you predict happens to the row count after merging? Test it.
- `.groupby(...).agg({...})` lets you apply a *different* aggregation to each column (e.g. mean of one, max of another) in one call. Why might averaging every column with the same statistic not always make sense for a real dataset?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-normal-week-9"
  questions={[
    {
      id: 'q1',
      prompt: 'df.groupby("lunch") on its own (no aggregation attached) does what?',
      options: [
        'Immediately prints group means',
        'Describes how to split rows into groups, computing nothing yet',
        'Raises an error',
        'Deletes rows with missing lunch values',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Which merge type keeps only rows whose key exists in both DataFrames?',
      options: ['outer', 'left', 'inner', 'cross'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'df.groupby("lunch").agg({"math_score": "mean", "reading_score": "mean"}) computes:',
      options: [
        'One combined average across both columns',
        'The mean of each listed column, separately, within each group',
        'A merge between math_score and reading_score',
        'The overall mean, ignoring groups',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'A DataFrame .merge() is conceptually most similar to:',
      options: [
        'A boolean mask filter',
        'Sorting by a column',
        'A database-style join on a shared key',
        'Dropping missing values',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-9" />
