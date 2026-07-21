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
- Combine multiple conditions with `&`, `|`, and `~`.
- Use `.isin()` and `.between()` for common filtering shortcuts.

## Lesson

### `.loc` vs `.iloc`

Both select rows/columns, but by different kinds of address:

```python
df.loc[0, "name"]      # by label: row labeled 0, column labeled "name"
df.iloc[0, 0]           # by position: first row, first column, regardless of labels
df.loc[0:2]             # rows labeled 0 through 2, INCLUSIVE
df.iloc[0:2]             # rows at positions 0, 1 — EXCLUSIVE stop, like Python slicing
```

`.loc` is inclusive on both ends because it addresses by *label*, not position — an important, easy-to-miss difference from Python's usual half-open slicing (which `.iloc` follows). Both accept a *combination* of row and column selectors, filtering both axes in one call:

```python
df.loc[0:2, "name"]              # rows 0-2, just the name column, as a Series
df.loc[0:2, ["name", "quiz1"]]    # rows 0-2, two columns, as a DataFrame
```

### Boolean masks: the pandas set-builder notation

Recall set-builder notation: $\{x \in S : P(x)\}$. In pandas, a condition like `df["score"] >= 60` produces a `Series` of `True`/`False` values — a **boolean mask** — and indexing a DataFrame with that mask keeps only the rows where it's `True`:

```python
mask = df["quiz1"] >= 60
mask                   # a Series of True/False, one per row
df[mask]                # only the rows where quiz1 >= 60

# more commonly written in one line:
df[df["quiz1"] >= 60]
```

This is directly the code form of $\{ \text{row} \in df : \text{row.quiz1} \ge 60 \}$ — the exact same idea as a Python 101 list comprehension filter, just operating on a whole column at once instead of looping element by element. A mask can also be combined with `.loc` to filter rows *and* pick columns in one call:

```python
df.loc[df["quiz1"] >= 60, ["name", "quiz1"]]   # only passing students, just these 2 columns
```

### Combining conditions

Use `&` (and), `|` (or), `~` (not) — **not** Python's `and`/`or`/`not`, which don't work element-wise on Series. Each condition needs its own parentheses because of operator precedence:

```python
df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]    # passed both quizzes
df[(df["quiz1"] < 60) | (df["quiz2"] < 60)]       # failed at least one
df[~(df["quiz1"] >= 60)]                            # NOT passing quiz1 — same as df["quiz1"] < 60
```

### Filtering shortcuts: `.isin()` and `.between()`

Two common filtering patterns have dedicated, more readable methods instead of chains of `|`/comparisons:

```python
df[df["name"].isin(["Amina", "Sara"])]        # rows where name is one of a list of values
df[df["quiz1"].between(60, 80)]                 # rows where 60 <= quiz1 <= 80, inclusive
```

`df["name"].isin([...])` is the vectorized equivalent of Python 101's `value in some_list` membership test, applied to every row's `name` at once — and it saves you from writing out `(df["name"] == "Amina") | (df["name"] == "Sara")` by hand.

### Selecting columns

```python
df["name"]                    # one column, as a Series
df[["name", "quiz1"]]          # multiple columns, as a DataFrame (note the double brackets)
```

## ⚠️ Common pitfalls

- **Using Python's `and`/`or` instead of `&`/`|`.** `df["quiz1"] >= 60 and df["quiz2"] >= 60` raises `ValueError: The truth value of a Series is ambiguous` — Python's `and`/`or` expect a single `True`/`False`, not a whole Series of them.
- **Forgetting parentheses around each condition.** `df[df["quiz1"] >= 60 & df["quiz2"] >= 60]` (no parens) is a precedence trap — `&` binds *tighter* than `>=`, so this parses very differently from what you intended. Always parenthesize each condition when combining with `&`/`|`.
- **Mixing up `.loc[0:2]` (inclusive) and `.iloc[0:2]` (exclusive).** This is the single most common `.loc`/`.iloc` bug — double-check which one you're using whenever a slice's row count looks off by one.
- **Single brackets when you meant a DataFrame.** `df["name", "quiz1"]` (single brackets, comma inside) is not valid — you need the double-bracket form `df[["name", "quiz1"]]`.

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

<Challenge id="dataanalysis-normal-w7-c5" answer={<><code>df[df["name"].isin(["Amina", "Karim", "Sara"])]</code> — filters to just the rows whose name matches one of the three given values.</>}>

Using `.isin()`, select rows for three specific students by name (pick any three names from the dataset).

</Challenge>

<Challenge id="dataanalysis-normal-w7-c6" answer={<><code>df.loc[df["quiz1"] &lt; 60, ["name", "quiz1"]]</code> — combines a boolean mask (rows) with a column list, in one .loc call.</>}>

Using `.loc` with a boolean mask *and* a column list in the same call, select just the `name` and `quiz1` columns for students who failed `quiz1` (below 60).

</Challenge>

## 🤔 Socratic Questions

- Why does `df[df["quiz1"] >= 60 and df["quiz2"] >= 60]` (using Python's `and`) raise an error, while `df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]` (using `&`) works? What is `and` trying to do with two full Series that doesn't make sense?
- A boolean mask is itself just a `Series` of `True`/`False` values, the same shape as the DataFrame's row index. What would `mask.sum()` compute, and why would that number be meaningful?
- `.loc[0:2]` being inclusive while `.iloc[0:2]` is exclusive is a common source of off-by-one bugs. Can you think of a case where the row *labels* aren't even integers (e.g. after some filtering) — what would `.loc[0:2]` even mean then?
- `df["name"].isin([...])` and a chain of `|` comparisons produce the same rows. Beyond being shorter to write, can you think of a reason `.isin()` might also be *less* error-prone for a list with many values?
- `~` negates a boolean mask. Is `~(df["quiz1"] >= 60)` always exactly the same as `df["quiz1"] < 60`? What could make them differ if the column had missing values (`NaN`) in it — a topic next week covers in depth?

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
    {
      id: 'q5',
      prompt: 'df["quiz1"].between(60, 80) selects rows where quiz1 is:',
      options: [
        'Exactly 60 or exactly 80',
        'Between 60 and 80, inclusive',
        'Greater than 80 only',
        'Not equal to either 60 or 80',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-7" />
