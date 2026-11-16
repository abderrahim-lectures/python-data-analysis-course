---
title: "Quartiles and the Interquartile Range"
description: "Split the sorted data into four, then measure the middle half: a spread that a single extreme value cannot inflate."
module: "spread-and-shape"
order: 7
difficulty: "beginner"
estimatedMinutes: 20
learningObjectives:
  - "Find the three quartiles of a small sorted dataset by hand"
  - "Compute the interquartile range and say what it measures"
  - "Use the 1.5 × IQR rule to flag likely outliers"
  - "Draw and read a five-number summary and a box plot"
prerequisites: []
tags: ["quartiles", "iqr", "box-plot", "outliers"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

The median splits sorted data in half. Split each half again and you have **quartiles**: three cut points that divide the data into four groups of roughly equal size.

- $Q_1$, the first quartile: 25% of values are at or below it.
- $Q_2$, the second quartile: the median, 50% below.
- $Q_3$, the third quartile: 75% below.

The **interquartile range** is the distance between the outer two:

$$
\text{IQR} = Q_3 - Q_1 .
$$

It is the width of the middle half of the data — the range that contains the typical case and ignores both tails.

## Why it adds something

The standard deviation squares its distances, so one extreme value can dominate it. The IQR uses positions, exactly like the median, so no single value — however extreme — can move it. Reach for the IQR when the tails of the data are long or when you suspect a few entries are wrong but have not confirmed it.

The IQR also gives a principled way to say "this value is suspiciously far out": the **1.5 × IQR rule**. Anything below $Q_1 - 1.5\,\text{IQR}$ or above $Q_3 + 1.5\,\text{IQR}$ is flagged. It is a convention, not a law, but it is the one box plots draw.

## Worked by hand

Eleven sorted waiting times in minutes:

$$
2,\;4,\;4,\;5,\;7,\;9,\;11,\;12,\;14,\;18,\;40
$$

**Step 1 — the median.** With $n=11$ the middle position is 6, so $Q_2 = 9$.

**Step 2 — split into halves.** Below the median: $2,4,4,5,7$. Above: $11,12,14,18,40$.

**Step 3 — the quartiles are the medians of those halves.** Each half has five values, so $Q_1 = 4$ and $Q_3 = 14$.

**Step 4 — the IQR.**

$$
\text{IQR} = 14 - 4 = 10 \text{ minutes}
$$

**Step 5 — the outlier fence.** Lower fence $4 - 15 = -11$; upper fence $14 + 15 = 29$. The value 40 lies above 29, so it is flagged. The standard deviation of this data is about 10.6, which is inflated by that same 40; the IQR is unmoved.

Note that the fences are not "delete this value" instructions. They mark a value worth checking: a typo, a different unit, or a genuinely unusual case.

## The five-number summary and the box plot

Five numbers describe the shape without any assumption about it:

$$
\text{min},\; Q_1,\; Q_2,\; Q_3,\; \text{max}
= 2,\; 4,\; 9,\; 14,\; 40 .
$$

A box plot draws exactly those: a box from $Q_1$ to $Q_3$ with a line at the median, whiskers to the most extreme values inside the fences, and points for anything beyond. The width of the box *is* the IQR, so the plot makes spread visible at a glance.

You can build one and drag the values in the [GeoGebra box-plot tool](https://www.geogebra.org/m/b5cct2aq); watching the box stay put while a whisker stretches is the clearest way to see what the IQR tolerates.

## The same thing in Python

```python
times = [2, 4, 4, 5, 7, 9, 11, 12, 14, 18, 40]

import statistics as st
q1 = st.quantiles(times, n=4)      # [4, 9, 14]
iqr = q1[2] - q1[0]
print(q1, iqr)                      # [4, 9, 14] 10

low, high = q1[0] - 1.5 * iqr, q1[2] + 1.5 * iqr
print(low, high)                    # -11.0 29.0
print([t for t in times if t < low or t > high])   # [40]
```

With pandas the same quantities come from `describe()`, which prints the five-number summary plus the mean and standard deviation in one call:

```python
import pandas as pd

s = pd.Series(times)
print(s.describe())
```

## When to use it

- **Skewed data**: incomes, prices, latencies, anything with a long tail.
- **Suspicious data**: the fence rule finds entries worth checking before they distort a mean.
- **Comparing groups** with different sample sizes, where a box plot per group is more informative than two means.

## Limitations

- **It throws away the tails.** Two datasets can share a five-number summary and differ in everything else.
- **Quartile definitions differ.** Different software computes $Q_1$ and $Q_3$ slightly differently for small samples, so a hand answer can be one step off a package's. The IQR is stable enough for practical use.
- **No arithmetic.** Like the median, it does not add across groups.
- **Small samples give coarse quartiles.** With fewer than about eight values the quartiles are barely more informative than the min and max.

## Common pitfalls

- **Not sorting first.** Quartiles are positional like the median; unsorted data gives nonsense.
- **Reading a box plot's whiskers as min and max.** Whiskers stop at the fence; points beyond are drawn separately.
- **Treating an outlier flag as an error.** It is a prompt to look, not a verdict.
- **Comparing IQRs across units.** Minutes and dollars are not comparable; use the coefficient of variation if you must compare spread.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Data: $1, 2, 3, 4, 5, 6, 7, 8, 9, 100$. Compute the IQR and the standard deviation. Which summary describes the middle better, and what would you report to a reader?

<p class="challenge__answer">💡 <strong>Answer:</strong> $Q_1 = 3$, $Q_3 = 8$, IQR $= 5$; the mean is 14.5 and the standard deviation is about 29.4, both dominated by the 100. Report the median (5.5) and the IQR (5), and note the 100 as a separate observation. The five-number summary stays honest where the mean and SD describe a dataset that does not exist.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why can no single value change the IQR the way it changes the range?
- If the box in a box plot is very narrow but the whiskers are long, what does the data look like?
- Why is the 1.5 multiplier a convention rather than a rule derived from the data?
- What does a box plot show that a histogram does not, and what does it hide?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-iqr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. What does the interquartile range measure?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The distance from the smallest to the largest value.</button>
      <button class="quiz-q__opt" data-idx="1">The average distance from the mean.</button>
      <button class="quiz-q__opt" data-idx="2">The width of the middle half of the sorted data.</button>
      <button class="quiz-q__opt" data-idx="3">The most common value.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Q1 = 20 and Q3 = 50. Above what value does the 1.5 × IQR rule flag a point?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">50</button>
      <button class="quiz-q__opt" data-idx="1">95</button>
      <button class="quiz-q__opt" data-idx="2">80</button>
      <button class="quiz-q__opt" data-idx="3">125</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
