---
title: "Week 6: Series & DataFrame Basics"
sidebar_position: 1
section: data-analysis
track: normal
week: 6
description: "Learn pandas Series and DataFrame basics and how to read CSV files — the first week of the Data Analysis Normal track."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 6: Series & DataFrame Basics

<span className="gamified-flourish">📐 A table isn't a new idea to you — it's a matrix with labels. Pandas just gives Python native support for it.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Explain what a `Series` and a `DataFrame` are, and how they relate to a vector and a matrix.
- Build a `DataFrame` from Python data structures, and load one from a CSV with `pd.read_csv`.
- Inspect a `DataFrame`'s shape, columns, dtypes, index, and summary statistics.
- Select a single column as a `Series`, and know the difference between the two main ways to do it.

## Lesson

### From dict-of-lists to DataFrame

Python 101's Week 5 mini-project computed per-student averages using a `dict`. A `DataFrame` is pandas's purpose-built structure for exactly this kind of tabular data — rows and columns, with labels on both axes:

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["Amina", "Youssef", "Sara"],
    "score": [88, 74, 95],
})
df
```

You can also build one from a list of dicts — the exact "list of records" shape from Python 101 Normal Week 3's nested-collections example:

```python
records = [
    {"name": "Amina", "score": 88},
    {"name": "Youssef", "score": 74},
]
pd.DataFrame(records)
```

Both forms produce the same kind of object; which is more convenient just depends on how your data already happens to be shaped — dict-of-lists when you think "column by column," list-of-dicts when you think "record by record."

A **`Series`** is a single labeled column — think of it as a vector $\mathbf{v} \in \mathbb{R}^n$, except each entry also has a label (its index), not just a position:

```python
df["score"]        # a Series
type(df["score"])   # pandas.core.series.Series
```

A **`DataFrame`** is a 2D table of such columns sharing one row index — the tabular analogue of a matrix $A \in \mathbb{R}^{m \times n}$, except columns can hold different dtypes and both axes carry labels, not just numeric positions.

### The index

Every `DataFrame` (and `Series`) has a row **index** — the labels along the left edge — visible whenever you print one. By default it's just `0, 1, 2, ...`, but it doesn't have to be:

```python
df.index                       # RangeIndex(start=0, stop=3, step=1) by default
df_named = df.set_index("name")   # use the "name" column as the index instead
df_named.loc["Amina"]              # now you can look up a row by name directly
```

`set_index` doesn't modify `df` in place by default — it returns a *new* DataFrame with the change, the same "returns a new value, doesn't mutate" pattern you've already seen with `sorted()` in Python 101.

### Reading a CSV

The same `students-normal.csv` from Python 101 loads in one call — no manual `csv.DictReader` loop, no manual `int(...)` conversions:

```python
df = pd.read_csv("students-normal.csv")
df.head()      # first 5 rows
df.tail(3)      # last 3 rows
```

`pd.read_csv` infers each column's dtype automatically (numbers become `int64`/`float64`, text stays `object`), which is most of what Python 101 Normal Week 5 did by hand, done for you in one line.

### Inspecting a DataFrame

A handful of methods answer "what does this dataset actually look like?" before you do anything else with it:

```python
df.shape        # (rows, columns) — e.g. (10, 4)
df.columns      # column names
df.dtypes       # each column's data type
df.info()       # shape + dtypes + non-null counts, all at once
df.describe()   # count, mean, std, min, quartiles, max — for numeric columns
```

`df.describe()` is worth lingering on: mean and standard deviation are exactly the statistics you already know from a stats course, computed instantly across an entire column instead of by hand. You can rename columns after the fact if the source file's names aren't convenient to work with:

```python
df = df.rename(columns={"quiz1": "quiz_1"})
```

## ⚠️ Common pitfalls

- **Forgetting most DataFrame operations return a new object.** `df.rename(...)`, `df.set_index(...)`, and many others don't change `df` itself unless you either reassign (`df = df.rename(...)`) or pass `inplace=True`.
- **Confusing `df.shape` (no parentheses) with a method call.** `.shape` is an attribute, not a function — `df.shape()` raises a `TypeError`.
- **Assuming `.describe()` covers every column.** By default it only summarizes numeric columns; text columns need a different look (Week 8 covers cleaning and inspecting those).

## 🧩 Challenges

<Challenge id="dataanalysis-normal-w6-c1" answer={<>Use <code>pd.read_csv("students-normal.csv")</code> then <code>df.shape</code> — the first element of the tuple is the row count, the second is the column count.</>}>

Load `students-normal.csv` (from Python 101 Week 5 — reuse the same file) into a DataFrame and print how many rows and columns it has.

</Challenge>

<Challenge id="dataanalysis-normal-w6-c2" answer={<><code>df["quiz1"]</code> or <code>df.quiz1</code> both select the column as a Series; the second only works because <code>quiz1</code> is a valid Python identifier with no spaces.</>}>

Select just the `quiz1` column as a Series. What are two different syntaxes for doing this?

</Challenge>

<Challenge id="dataanalysis-normal-w6-c3" answer={<><code>df["quiz1"].mean()</code> — every Series has statistical methods like <code>.mean()</code>, <code>.median()</code>, <code>.std()</code> built in, no manual sum()/len() needed.</>}>

Compute the mean of the `quiz1` column using a Series method (not `sum()`/`len()` by hand).

</Challenge>

<Challenge id="dataanalysis-normal-w6-c4" answer={<><code>df.describe()</code> summarizes only numeric columns by default (count/mean/std/min/quartiles/max) and silently skips the <code>name</code> column, since none of those statistics are meaningful for text — pandas infers this from each column's dtype.</>}>

Run `df.describe()` on the students DataFrame. Does it include the `name` column? Why or why not?

</Challenge>

<Challenge id="dataanalysis-normal-w6-c5" answer={<>Call df.set_index("name") and store the result (e.g. df_by_name = df.set_index("name")), then use df_by_name.loc["Amina"] to retrieve that row directly by label instead of hunting for the matching row number.</>}>

Set `name` as the index of the students DataFrame, then look up Amina's row directly by her name instead of by row number.

</Challenge>

<Challenge id="dataanalysis-normal-w6-c6" answer={<>Build it either as a dict of lists (one key per column) or a list of dicts (one dict per city) passed to <code>pd.DataFrame(...)</code> — both are valid, matching whichever shape the data started in.</>}>

Construct a small DataFrame by hand (not from a CSV) with two columns, `city` and `population`, for 3 cities of your choice — using either the dict-of-lists or list-of-dicts style.

</Challenge>

## 🤔 Socratic Questions

- A `Series` is often compared to a Python `list` with labels. What can you do with a Series's `.mean()`/`.std()` in one call that you couldn't do with a plain `list` without writing your own function?
- `df.dtypes` shows each column's inferred type. What could go wrong if a numeric-looking column (like `quiz1`) actually contained one row with text in it, like `"absent"`? What dtype would pandas likely infer for the whole column?
- You spent 5 weeks of Python 101 building CSV-reading and averaging logic by hand. Which specific lines of that logic does `pd.read_csv(...).describe()` replace? Is anything actually *lost* by using the shortcut, or only time saved?
- `df.set_index("name")` swaps the default numeric index for a meaningful one. What would go wrong if the `name` column had a duplicate value — could two different students still be told apart afterward?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-normal-week-6"
  questions={[
    {
      id: 'q1',
      prompt: 'A pandas Series is best described as:',
      options: [
        'A 2D table of rows and columns',
        'A single labeled column of data',
        'A CSV file on disk',
        'A Python dict with no labels',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Which function loads a CSV file into a DataFrame?',
      options: ['pd.load_csv()', 'pd.read_csv()', 'pd.DataFrame.open()', 'pd.csv()'],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'df.describe() by default summarizes:',
      options: ['Every column, including text', 'Only numeric columns', 'Only the first row', 'Only column names'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'df.shape returns:',
      options: [
        'The column names',
        'A (rows, columns) tuple',
        'The data types of each column',
        'The first 5 rows',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'df.set_index("name") by default:',
      options: [
        'Modifies df in place and returns None',
        'Returns a new DataFrame, leaving the original df unchanged',
        'Deletes the name column entirely',
        'Only works on numeric columns',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-6" />
