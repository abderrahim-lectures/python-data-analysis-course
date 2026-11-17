---
title: "An Exploratory Pass"
description: "Twelve checks on a real dataset, in order, with the reasoning for each one written down."
module: "applied-statistics"
order: 16
difficulty: "advanced"
estimatedMinutes: 35
learningObjectives:
  - "Profile a CSV's types, missingness and ranges before summarising it"
  - "Compare mean, median and IQR and record the shape they imply"
  - "Justify every exclusion with a stated reason, not a threshold alone"
  - "Write an exploratory finding separately from a confirmed one"
prerequisites: []
tags: ["eda", "data-profiling", "visualisation", "reporting"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 20
section: "statistics-101"
track: "hard"
---

## What it means

An **exploratory pass** is a fixed sequence of checks run before any conclusion is drawn. Its output is not a result but a set of recorded decisions: what is missing, what is implausible, what is grouped, and what you consequently will and will not claim.

The discipline is to separate *looking* from *concluding*. Exploratory findings are hypotheses; confirmatory findings are tested on data the hypothesis was not formed on.

## The twelve checks

1. **Shape of the table** — rows, columns, and what one row represents.
2. **Types** — which columns are numbers that arrived as text.
3. **Missingness** — count per column, and whether it clusters by group.
4. **Ranges** — minimum and maximum per numeric column, looking for impossible values.
5. **Duplicates** — exact rows, and repeated identifiers.
6. **Centre** — mean and median side by side.
7. **Spread** — standard deviation and IQR side by side.
8. **Tail** — how many values lie beyond the fences, and what they are.
9. **Groups** — do the summaries differ by category, site, or batch?
10. **Relationships** — scatter plots before any correlation number.
11. **Decisions** — every exclusion, with a reason recorded.
12. **Claims** — one paragraph of what the data supports, and one of what it does not.

## Worked example

The course bundles a students-performance dataset. Profile it first:

```python
import pandas as pd

df = pd.read_csv('students-performance.csv')
print(df.shape)          # how many rows, columns
print(df.dtypes)         # check that scores are numbers
print(df.isna().sum())   # missing per column
print(df.describe())     # ranges, centre, spread in one view
```

**What the output tells you, in order.**

- If `shape` shows more rows than you expect, check for duplicates before going further.
- If a score column has type `object`, it contains a stray value such as `"absent"` and every arithmetic operation after this will be wrong or silently skipped.
- If `isna().sum()` is non-zero, decide now whether to drop, fill, or model the missingness; the choice must be recorded.
- If `describe()` shows a minimum of 0 in a score column, that may be an absence marker rather than a real zero.

Then check the shape of one score:

```python
score = df['math score']
print(score.mean(), score.median())
q1, q3 = score.quantile([.25, .75])
print(q1, q3, q3 - q1)
print((score < q1 - 1.5*(q3-q1)).sum(), (score > q3 + 1.5*(q3-q1)).sum())
```

**Reading it.** If the mean and median differ by only a point or two, the distribution is close to symmetric and either centre is fair. If the standard deviation is far larger than the IQR divided by 1.35, the tails are heavier than a normal shape and the mean is being tugged. If the fence counts are non-zero, inspect those rows individually.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

`describe()` shows a minimum test-preparation course of 0 and a maximum of 100, with a mean of 35. Does that justify treating 0 as "no preparation" or as missing data? What would you look at?

<p class="challenge__answer">💡 <strong>Answer:</strong> The distribution decides. If the column is otherwise continuous and a large share sits exactly at 0, it is probably a genuine "none" category or a default; if only a handful sit at 0 while the rest are spread out, they are more likely missing values coded as 0. Cross-tabulate the 0s against another variable (e.g. parental education, which should be unrelated to missingness) to check whether they behave like real observations.</p>

</div>
</details>

## Recording decisions

The output of this lesson is a short log, one line per decision:

```
Dropped 3 rows: duplicate student IDs (2) and one score of 1000 (data entry).
Kept 12 rows with test prep = 0: distribution continuous, no other column missing for them.
Grouped by test preparation: 'none' vs 'completed' differ by 8 points in both reading and writing.
```

That log is what makes the analysis reviewable. Without it, a reader cannot tell a considered exclusion from a convenient one.

## When to use it

Before any confirmatory analysis, and before handing data to anyone else. It is cheap — minutes — compared with the cost of a conclusion built on a misread column.

## Limitations

- **Exploratory findings are not evidence.** The same pass that finds a pattern also generates the hypothesis, so the pattern must be checked on fresh data.
- **It scales badly without grouping.** For thousands of categories the twelve checks need a sampling strategy rather than a full listing.
- **It cannot detect what is not in the data.** Missing groups, unrecorded failures and survivorship bias are invisible to a profile of what was collected.

## Common pitfalls

- **Silent coercion.** Converting text to numbers with `pd.to_numeric(errors='coerce')` turns bad values into missing, so the missingness count jumps; both must be recorded.
- **Letting `describe()` stand in for a plot.** It hides multiple peaks entirely.
- **Deleting the tail before checking whether it is a real subpopulation.**

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Your profile shows two peaks in the score histogram. What are the two most likely explanations, and what would distinguish them?

<p class="challenge__answer">💡 <strong>Answer:</strong> Either the dataset contains two different populations (for example two schools, or two test administrations) or the measure is censored/rounded in a way that bunches values. Distinguish them by colouring the histogram by a candidate grouping variable; if the peaks separate cleanly, it is two populations, and every pooled summary should be split by that variable.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why is it important to record decisions rather than only their outcomes?
- Which of the twelve checks would catch Simpson's paradox before you report anything?
- If a column is 30% missing, what are three legitimate ways to proceed, and what does each assume?
- Why is an exploratory finding weaker evidence than a confirmatory one, even when the numbers are identical?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-eda">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. A numeric column arrives as type object. What is the first thing to check?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The mean.</button>
      <button class="quiz-q__opt" data-idx="1">The correlation with other columns.</button>
      <button class="quiz-q__opt" data-idx="2">Which entries are not parseable numbers, and what they represent.</button>
      <button class="quiz-q__opt" data-idx="3">Whether to drop the column.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">2. Why record an exclusion decision?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">To make the report longer.</button>
      <button class="quiz-q__opt" data-idx="1">Because the software requires it.</button>
      <button class="quiz-q__opt" data-idx="2">To speed up the next analysis.</button>
      <button class="quiz-q__opt" data-idx="3">So a reader can tell a considered choice from a convenient one, and reproduce it.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
