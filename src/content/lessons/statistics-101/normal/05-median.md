---
title: "The Median"
description: "Sort first, then take the middle: the measure that one extreme value cannot move."
module: "describing-data"
order: 5
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Compute a median by hand for an odd and an even number of values"
  - "Compute the same median in Python and explain the two middle values case"
  - "Compare mean and median on the same data and say what the gap tells you"
  - "Decide when the median is the measure to report"
prerequisites: []
tags: ["median", "descriptive-statistics", "centre", "outliers"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

The **median** is the middle value once the data is sorted. Half the values are at or below it, half are at or above it. Position is all that matters — the size of the values near the middle is irrelevant, and so is the size of the ones at the edges.

For $n$ values in sorted order $x_{(1)} \le x_{(2)} \le \cdots \le x_{(n)}$:

$$
\text{median} =
\begin{cases}
x_{\left(\frac{n+1}{2}\right)} & n \text{ odd} \\[4pt]
\dfrac{x_{\left(\frac{n}{2}\right)} + x_{\left(\frac{n}{2}+1\right)}}{2} & n \text{ even}
\end{cases}
$$

In words: with an odd count there is one exact middle; with an even count there are two middle values, and you take their mean.

## Why it adds something

The mean can be dragged by one value. The median cannot be dragged by *any* single value, however extreme, because moving a value to 1,000,000 does not change which entry sits in the middle. It answers a different question: not "what is the total shared out?" but "what does a typical case look like?"

This makes the median the honest summary for anything skewed: incomes, house prices, hospital waiting times, file sizes, response times. In every one of those, a small number of very large cases exists and would dominate a mean.

## Worked by hand, odd count

Delivery times again, sorted:

$$
8,\; 10,\; 12,\; 15,\; 45
$$

There are $n = 5$ values, so the middle is position $(5+1)/2 = 3$:

$$
x_{(3)} = 12
$$

The median is 12 minutes. Compare that with the mean, 18. The median is what a customer would call a normal delivery; the mean carries the weight of the 45-minute one.

## Worked by hand, even count

Drop the slowest delivery:

$$
8,\; 10,\; 12,\; 15
$$

Now $n = 4$, and the two middle positions are $4/2 = 2$ and $3$:

$$
\text{median} = \frac{x_{(2)} + x_{(3)}}{2} = \frac{10 + 12}{2} = 11.
$$

Note what happened: with an even count the median can be a value that is not in the data at all (11 is not one of the four times). It is still the correct middle.

## The same thing in Python

```python
times = [8, 12, 10, 15, 45]
ordered = sorted(times)
n = len(ordered)

if n % 2 == 1:
    median = ordered[n // 2]
else:
    median = (ordered[n // 2 - 1] + ordered[n // 2]) / 2

print(median)      # 12
```

The standard library does the same, including the even-case average:

```python
from statistics import median

print(median([8, 12, 10, 15, 45]))   # 12
print(median([8, 10, 12, 15]))       # 11.0
```

## Reading the gap between them

A useful habit: compute both, then look at the difference.

| Data | Mean | Median | What the gap says |
|---|---|---|---|
| 8, 10, 12, 15, 45 | 18 | 12 | A long right tail: a few large values |
| 10, 11, 12, 12, 13 | 11.6 | 12 | Roughly symmetric: mean and median agree |
| −5, 10, 11, 12, 12 | 8 | 11 | A long left tail: a few small values |

When the mean is well above the median, a few large values are pulling it up. When it is well below, a few small ones are pulling it down. When they nearly agree, the data is close to symmetric and either measure is fine.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A company reports "our median salary is 55,000 but our mean salary is 95,000". How many employees are there, at minimum, and what does the gap say about the pay structure?

<p class="challenge__answer">💡 <strong>Answer:</strong> At least two, but the useful reading is about shape: the mean is 40,000 above the median, so a small number of very highly paid people exist while the typical employee earns 55,000. The larger the gap, the more concentrated the top end.</p>

</div>
</details>

## Seeing it geometrically

The median is the point that splits the count in half, not the point that balances the weights. Drag the rightmost point far away in the [GeoGebra mean-and-median explorer](https://www.geogebra.org/m/zsbf4jqm) and watch: the mean jumps, the median stays where the 50/50 split is.

## When to use it

- The data is **skewed** or contains outliers you cannot justify removing.
- You want to describe a **typical** case, not a total.
- The variable is **ordinal**: ratings like "poor, fair, good" have a meaningful order but no meaningful arithmetic, so the median is valid where the mean is not.

## Limitations

- **It ignores most of the data.** Two very different datasets can share a median.
- **It does not add up.** The median of a combined group is not a simple function of the two medians, which is why means dominate later formulas.
- **It needs at least one value.** With an even count it may report a number no case actually has.
- **It is less stable in tiny samples.** With three values, one changed entry can shift it a lot.

## Common pitfalls

- **Forgetting to sort.** The median of the raw list order is meaningless; sorting is step one, every time.
- **Halving the wrong way in the even case.** Average the two middle entries, not the middle and the last.
- **Assuming "median" means "most common".** That is the mode, a different measure.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

The values are 3, 7, 7, 9, 20, 21. Compute both the mean and the median, then add one new value, 100, and recompute both. Which one moved more, in absolute and in percentage terms?

<p class="challenge__answer">💡 <strong>Answer:</strong> Before: sum 67, mean 11.17, median $(7+9)/2 = 8$. After adding 100: sum 167, mean 23.86, median still 8 (now the two middle values of six are 7 and 9). The mean more than doubled; the median did not move at all.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does the median need the data sorted while the mean does not?
- If half the class scores above the median and half below, can everyone be above the mean?
- A hospital says "median waiting time is 4 weeks". What does that hide that a mean would reveal?
- Could two datasets have the same median and completely different shapes? Sketch them.

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-median">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. How do you find the median of an even number of values?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Take the value at position n/2 without averaging.</button>
      <button class="quiz-q__opt" data-idx="1">Take the largest of the two middle values.</button>
      <button class="quiz-q__opt" data-idx="2">Average the two middle values after sorting.</button>
      <button class="quiz-q__opt" data-idx="3">Divide the sum by n and round to the nearest value.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. A dataset has mean 80 and median 45. What does that tell you?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The data is symmetric.</button>
      <button class="quiz-q__opt" data-idx="1">A few large values pull the mean far above the typical value.</button>
      <button class="quiz-q__opt" data-idx="2">Most values sit near 80.</button>
      <button class="quiz-q__opt" data-idx="3">The median is miscalculated, since it must be close to the mean.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
