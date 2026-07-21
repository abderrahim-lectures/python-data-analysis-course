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
- Group by more than one column at once, and turn a grouped result back into a plain DataFrame.
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

### Grouping by more than one column

Passing a *list* of column names groups by every unique combination of their values at once — the same idea as partitioning by a pair $(a, b)$ instead of a single value:

```python
df.groupby(["lunch", "gender"])["math_score"].mean()
```

This answers a more specific question than either column alone: does the effect of `lunch` on `math_score` hold the same way within each `gender`, or does it look different once you separate them out?

### Getting a plain DataFrame back

A groupby-aggregate result uses the grouped column(s) as its index rather than a plain `0, 1, 2, ...` row index — convenient for further lookups, but sometimes you want an ordinary DataFrame back (for example, to sort it, or to merge it with something else). `.reset_index()` does that:

```python
summary = df.groupby("lunch")["math_score"].mean().reset_index()
# lunch          math_score
# free/reduced   58.2
# standard       66.9

summary.sort_values("math_score", ascending=False)   # now a plain column you can sort by
```

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

`how="inner"` (the default) keeps only rows where the key exists in *both* DataFrames; `how="left"`/`"right"`/`"outer"` control what happens to rows whose key is missing from the other side — worth checking explicitly whenever row counts might not match after a merge. If the key columns have different names in each DataFrame, use `left_on`/`right_on` instead of `on`:

```python
students.merge(scores, left_on="student_id", right_on="id")
```

## ⚠️ Common pitfalls

- **Forgetting `.groupby()` alone computes nothing.** `df.groupby("lunch")` by itself is just a description of the split — you always need an aggregation (`.mean()`, `.agg(...)`, etc.) attached to actually see numbers.
- **Assuming a merge preserves the original row count.** A `merge` with a duplicated key on either side can produce *more* rows than either input had — always sanity-check `.shape` after a merge you're not 100% sure about.
- **Not checking `how=` explicitly.** The default `"inner"` silently drops any row whose key doesn't exist on the other side — fine when that's genuinely what you want, but worth being a deliberate choice, not an accident.
- **Forgetting `.reset_index()` when you need a plain column back.** Trying to `.sort_values()` or `.merge()` using a groupby result's index (rather than a regular column) as if it were a normal column will fail or behave unexpectedly until you `.reset_index()`.

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

<Challenge id="dataanalysis-normal-w9-c5" answer={<><code>df.groupby(["lunch", "test_preparation_course"])["math_score"].mean()</code> — groups by every combination of the two columns, showing whether the effects combine, cancel out, or hold independently.</>}>

Group by both `lunch` and `test_preparation_course` together, and compute the average `math_score` for each combination. Does the pattern from Challenge 3 hold within *both* test-prep groups, or does it look different?

</Challenge>

<Challenge id="dataanalysis-normal-w9-c6" answer={<>Chain .reset_index() after the groupby-aggregate, then .sort_values("math_score", ascending=False) on the resulting plain column, e.g. df.groupby("lunch")["math_score"].mean().reset_index().sort_values("math_score", ascending=False).</>}>

Take your Challenge 1 result (average `math_score` by `gender`), turn it into a plain DataFrame with `.reset_index()`, and sort it from highest to lowest average.

</Challenge>

## 🤔 Socratic Questions

- `.groupby("lunch")` alone (with no aggregation attached) doesn't print a table of numbers — what do you think it actually returns, and why does pandas wait to compute anything until you specify an aggregation?
- If two DataFrames being merged share a key column but one DataFrame has a *duplicate* key (two rows with the same `student_id`), what do you predict happens to the row count after merging? Test it.
- `.groupby(...).agg({...})` lets you apply a *different* aggregation to each column (e.g. mean of one, max of another) in one call. Why might averaging every column with the same statistic not always make sense for a real dataset?
- Grouping by two columns at once (`["lunch", "test_preparation_course"]`) can reveal a pattern that grouping by either column alone hides, or make a pattern that looked strong actually look weaker once you account for the second factor. Why does splitting into finer groups sometimes change the story so much?
- A groupby-aggregate result uses the grouped column as its index instead of a plain integer index. What practical difference does that make the first time you try to use `.iloc[0]` on it, versus on an ordinary DataFrame?

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
    {
      id: 'q5',
      prompt: 'What does .reset_index() do after a groupby-aggregate?',
      options: [
        'Deletes the aggregated values',
        'Turns the grouped column back into a plain column, with a normal integer index',
        'Groups the data again',
        'Merges with another DataFrame',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-9" />
