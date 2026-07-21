---
title: "Week 7: Selection, Filtering & Indexing"
sidebar_position: 2
section: data-analysis
track: normal
week: 7
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 7: Selection, Filtering & Indexing

<span className="gamified-flourish">🔍 Last week you looked at the whole table. This week you learn to ask it questions.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Select rows and columns with `.loc` and `.iloc`.
- Filter rows using a **boolean mask**, the pandas equivalent of set-builder notation.
- Combine multiple conditions with `&` and `|`.

## Lesson

### `.loc` vs `.iloc`

Both select rows/columns, but by different kinds of address:

```python
df.loc[0, "name"]      # by label: row labeled 0, column labeled "name"
df.iloc[0, 0]           # by position: first row, first column, regardless of labels
df.loc[0:2]             # rows labeled 0 through 2, INCLUSIVE
df.iloc[0:2]             # rows at positions 0, 1 — EXCLUSIVE stop, like Python slicing
```

`.loc` is inclusive on both ends because it addresses by *label*, not position — an important, easy-to-miss difference from Python's usual half-open slicing (which `.iloc` follows).

### Boolean masks: the pandas set-builder notation

Recall set-builder notation: $\{x \in S : P(x)\}$. In pandas, a condition like `df["score"] >= 60` produces a `Series` of `True`/`False` values — a **boolean mask** — and indexing a DataFrame with that mask keeps only the rows where it's `True`:

```python
mask = df["quiz1"] >= 60
mask                   # a Series of True/False, one per row
df[mask]                # only the rows where quiz1 >= 60

# more commonly written in one line:
df[df["quiz1"] >= 60]
```

This is directly the code form of $\{ \text{row} \in df : \text{row.quiz1} \ge 60 \}$ — the exact same idea as a Python 101 list comprehension filter, just operating on a whole column at once instead of looping element by element.

### Combining conditions

Use `&` (and), `|` (or), `~` (not) — **not** Python's `and`/`or`/`not`, which don't work element-wise on Series. Each condition needs its own parentheses because of operator precedence:

```python
df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]    # passed both quizzes
df[(df["quiz1"] < 60) | (df["quiz2"] < 60)]       # failed at least one
```

### Selecting columns

```python
df["name"]                    # one column, as a Series
df[["name", "quiz1"]]          # multiple columns, as a DataFrame (note the double brackets)
```

## 🧩 Challenges

<Challenge id="dataanalysis-normal-w7-c1" answer={<><code>df[df["quiz1"] &gt;= 90]</code> — a boolean mask keeping only rows where quiz1 is at least 90.</>}>

Using `students-normal.csv`, select all rows where `quiz1` is 90 or above.

</Challenge>

<Challenge id="dataanalysis-normal-w7-c2" answer={<><code>df[(df["quiz1"] &gt;= 60) &amp; (df["quiz2"] &gt;= 60) &amp; (df["quiz3"] &gt;= 60)]</code> — three chained conditions combined with <code>&amp;</code>, each parenthesized.</>}>

Select students who passed (≥60) *all three* quizzes at once, combining three conditions.

</Challenge>

<Challenge id="dataanalysis-normal-w7-c3" answer={<><code>df.iloc[0:3]</code> selects the first three rows by position; <code>df.loc[0:3]</code> would select rows labeled 0, 1, 2, and 3 — four rows — since <code>.loc</code>'s slice end is inclusive.</>}>

Select the first 3 rows of the DataFrame using `.iloc`. Then try `.loc[0:3]` — how many rows does it return, and why does that differ from `.iloc[0:3]`?

</Challenge>

<Challenge id="dataanalysis-normal-w7-c4" answer={<><code>df[["name", "quiz1"]]</code> — double brackets: the outer brackets index the DataFrame, the inner brackets are a Python list of column names.</>}>

Select just the `name` and `quiz1` columns together, as a DataFrame (not a single Series).

</Challenge>

## 🤔 Socratic Questions

- Why does `df[df["quiz1"] >= 60 and df["quiz2"] >= 60]` (using Python's `and`) raise an error, while `df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]` (using `&`) works? What is `and` trying to do with two full Series that doesn't make sense?
- A boolean mask is itself just a `Series` of `True`/`False` values, the same shape as the DataFrame's row index. What would `mask.sum()` compute, and why would that number be meaningful?
- `.loc[0:2]` being inclusive while `.iloc[0:2]` is exclusive is a common source of off-by-one bugs. Can you think of a case where the row *labels* aren't even integers (e.g. after some filtering) — what would `.loc[0:2]` even mean then?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-normal-week-7"
  questions={[
    {
      id: 'q1',
      prompt: 'Which operator combines two boolean masks in pandas (not Python and/or)?',
      options: ['and / or', '&& / ||', '& / |', 'both work identically'],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: '.loc selects by:',
      options: ['Position only', 'Label', 'Random access', 'Column dtype'],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'df[df["score"] >= 60] works because df["score"] >= 60 produces:',
      options: [
        'A single True/False value',
        'A boolean Series, used to filter rows',
        'A new DataFrame with one column',
        'A SyntaxError',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'df[["name", "quiz1"]] (double brackets) returns:',
      options: ['A Series', 'A DataFrame with those two columns', 'A single value', 'A list of column names'],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-7" />
