---
title: "Week 8: Cleaning Data"
sidebar_position: 3
section: data-analysis
track: normal
week: 8
description: "Clean real-world data in pandas: handle missing values, fix dtypes, and work with string columns."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 8: Cleaning Data

<span className="gamified-flourish">🧹 Real datasets are messy. This week is about making a dataset trustworthy before you analyze it.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Detect and handle missing values with `.isna()`, `.dropna()`, and `.fillna()`.
- Find and remove duplicate rows.
- Convert a column's dtype explicitly with `.astype()` and `pd.to_numeric()`.
- Use `.str` accessor methods to clean up text columns.
- Apply a custom function to a column with `.apply()` when no built-in method fits.

## Lesson

### Missing values

Pandas represents "no value" as `NaN` (Not a Number) for numeric columns. `.isna()` returns a boolean mask of where values are missing — the same boolean-mask idea from last week, applied to a different question:

```python
df.isna()             # True/False per cell
df.isna().sum()        # count of missing values per column
```

Two strategies for handling them:

```python
df.dropna()                     # remove any row with at least one missing value
df.dropna(subset=["quiz1"])      # only drop rows missing quiz1 specifically
df.fillna(0)                     # replace all NaN with 0
df["quiz1"].fillna(df["quiz1"].mean())   # replace with the column's mean — a common default
```

There's no universally "correct" choice — dropping a row loses that student's other data entirely, while filling with a mean can distort statistics if there's a lot of missing data. Which one is appropriate depends on *why* the data is missing and how much of it there is, a judgment call you'll practice throughout the Hard track's EDA framework.

### Duplicate rows

Real datasets sometimes contain the same record more than once — a data-entry mistake, or a file that got merged with itself by accident:

```python
df.duplicated()             # True/False per row — is this an exact repeat of an earlier row?
df.duplicated().sum()        # how many duplicate rows exist
df = df.drop_duplicates()     # keep only the first occurrence of each duplicate group
```

`.duplicated(subset=["name"])` narrows the check to specific columns — useful when two rows shouldn't both exist for the same *student*, even if some other column (like a timestamp) happens to differ between them.

### Converting dtypes

`pd.read_csv` sometimes infers the wrong dtype — a column of numbers stored as text if even one row has a stray character, for instance. `.astype()` converts explicitly:

```python
df["quiz1"] = df["quiz1"].astype(int)
df["quiz1"] = pd.to_numeric(df["quiz1"], errors="coerce")   # invalid values become NaN instead of crashing
```

`pd.to_numeric(..., errors="coerce")` is usually safer than `.astype(int)` for messy real-world data: instead of raising an error the moment it hits something unconvertible, it quietly turns that value into `NaN`, which you can then handle with the tools above.

### Cleaning text with `.str`

String columns get their own accessor, `.str`, exposing vectorized versions of familiar string methods — the pandas equivalent of Python 101's `.lower()`/`.strip()`, applied to an entire column at once:

```python
df["name"] = df["name"].str.strip()          # remove leading/trailing whitespace
df["name"] = df["name"].str.lower()           # lowercase, same reason as Python 101 tokenize()
df["name"].str.contains("amina")               # boolean mask: does each name contain "amina"?
df["name"] = df["name"].str.replace("amina", "Amina")   # find-and-replace within each value
df["first_name"] = df["name"].str.split(" ").str[0]      # split each name, keep the first piece
```

`.str.split(" ")` produces a Series where every value is itself a *list* of pieces; a second `.str[0]` then reaches into each of those lists and pulls out the first element — chaining `.str` operations like this is a common pattern once a single string method isn't quite enough.

### When no built-in method fits: `.apply()`

For a transformation that doesn't have a ready-made `.str`/numeric method, `.apply()` runs any function of your choosing on every value in a column:

```python
def grade_letter(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "F"

df["quiz1_grade"] = df["quiz1"].apply(grade_letter)
```

This is genuinely just Python 101's functions again — `grade_letter` is an ordinary function, and `.apply()` is what runs it once per value, the vectorized-feeling equivalent of looping over the column yourself and calling `grade_letter` on each value by hand.

## ⚠️ Common pitfalls

- **Calling `.fillna()`/`.dropna()` without reassigning.** Like most pandas operations, these return a *new* Series/DataFrame by default — `df.fillna(0)` alone doesn't change `df`; you need `df = df.fillna(0)` (or `inplace=True`).
- **Filling missing values before understanding why they're missing.** A blanket `df.fillna(0)` on a score column could quietly turn "this student was absent" into "this student scored zero," which are very different facts.
- **Forgetting duplicates can be *partial*, not just exact.** `.duplicated()` with no `subset` only flags rows that match *every* column exactly — two rows for the same student with a typo in one column won't be caught without narrowing the check.
- **Using `.apply()` when a vectorized method already exists.** `.apply()` runs your Python function once per row, which is slower than a built-in vectorized method like `.str.lower()` doing the same work in optimized code — reach for `.apply()` only when nothing built-in fits.

## 🧩 Challenges

<Challenge id="dataanalysis-normal-w8-c1" answer={<><code>df.isna().sum()</code> — one number per column, the count of missing (NaN) values in that column.</>}>

Load `students-normal.csv` and print how many missing values each column has.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c2" answer={<>Introduce a NaN manually first (e.g. <code>df.loc[0, "quiz1"] = None</code>), then compare <code>df.dropna(subset=["quiz1"])</code> (fewer rows) against <code>df["quiz1"].fillna(df["quiz1"].mean())</code> (same row count, missing value replaced) to see the row-count difference directly.</>}>

Manually set one `quiz1` value to missing (e.g. `df.loc[0, "quiz1"] = None`), then compare the resulting row count after `.dropna(subset=["quiz1"])` versus after `.fillna(df["quiz1"].mean())`.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c3" answer={<><code>df["name"].str.lower()</code> converts the whole column to lowercase in one call, vectorized — equivalent to looping and calling <code>.lower()</code> on each name individually, but without writing the loop.</>}>

Lowercase every value in the `name` column using `.str`, without writing a manual loop.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c4" answer={<><code>df["name"].str.contains("a")</code> returns a boolean mask; wrap it in <code>df[...]</code> to get only the matching rows, or call <code>.sum()</code> on the mask to just count them.</>}>

Using `.str.contains(...)`, find how many students have the letter "a" anywhere in their name.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c5" answer={<>Duplicate a row first (e.g. pd.concat([df, df.iloc[[0]]])), then run .duplicated().sum() to confirm at least one duplicate is detected, and .drop_duplicates() to remove it, checking df.shape before and after to confirm the row count dropped by one.</>}>

Manually duplicate one row of the DataFrame (append a copy of an existing row), confirm `.duplicated()` catches it, then remove it with `.drop_duplicates()`.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c6" answer={<>Write a function like grade_letter that returns "Pass" if the score is &gt;= 60 and "Fail" otherwise, then apply it: df["quiz1_result"] = df["quiz1"].apply(pass_fail).</>}>

Write your own function that takes a score and returns `"Pass"` or `"Fail"` based on a 60% threshold, then use `.apply()` to add a new `quiz1_result` column built from it.

</Challenge>

## 🤔 Socratic Questions

- `.dropna()` and `.fillna(mean)` give different final row counts and different final statistics. For a dataset where 40% of one column's values are missing, which choice do you think is more likely to mislead someone reading your summary statistics, and why?
- `pd.to_numeric(col, errors="coerce")` silently turns bad values into `NaN` instead of crashing. Is "silent" actually a good thing here? What could go wrong if you ran this on a column and never checked `.isna().sum()` afterward?
- Why do string columns need a separate `.str` accessor (`df["name"].str.lower()`) instead of just `df["name"].lower()`? What would `.lower()` even mean if called directly on a whole Series rather than one string?
- `.duplicated()` with no `subset` argument only catches rows that match on *every* column. Can you think of a realistic scenario in this dataset where two rows represent the same actual student but wouldn't be caught by an exact-match duplicate check?
- `.apply()` can run *any* Python function, including ones with side effects (like printing, or writing to a file) — not just ones that return a transformed value. Why might running code with side effects inside `.apply()` be a bad idea, given you don't control exactly how many times or in what order pandas might call your function internally?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-normal-week-8"
  questions={[
    {
      id: 'q1',
      prompt: 'Which method counts missing values per column?',
      options: ['df.count()', 'df.isna().sum()', 'df.dropna()', 'df.fillna()'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'pd.to_numeric(col, errors="coerce") does what with a value it cannot convert?',
      options: [
        'Raises an exception immediately',
        'Turns it into NaN',
        'Leaves it as the original string',
        'Deletes that row',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'Why use df["col"].str.lower() instead of df["col"].lower()?',
      options: [
        'They are identical, just different style',
        '.str is required to apply string methods element-wise across a Series',
        '.lower() only works on DataFrames, not Series',
        '.str.lower() is faster for numeric columns',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'df.dropna(subset=["quiz1"]) removes rows where:',
      options: [
        'Any column is missing a value',
        'Specifically quiz1 is missing a value',
        'quiz1 is below 60',
        'The row index is missing',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: '.apply() on a Series is best used when:',
      options: [
        'You always want maximum performance',
        'No built-in vectorized method already does what you need',
        'You are working with a DataFrame, never a Series',
        'The column contains only numbers',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-8" />
