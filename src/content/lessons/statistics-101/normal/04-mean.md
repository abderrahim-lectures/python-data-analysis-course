---
title: "The Mean"
description: "Add every value, divide by how many: what the average really says, and the one case where it lies."
module: "describing-data"
order: 4
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Compute the mean by hand from a small list of numbers"
  - "Compute the same mean in Python with plain code and with statistics.mean"
  - "Explain the mean as the balance point of the data"
  - "Recognise when a single extreme value pulls the mean away from the rest"
prerequisites: []
tags: ["mean", "average", "descriptive-statistics", "centre"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

The **mean** is the number every value would have to be if they were all equal and the total stayed the same. You compute it by adding everything and dividing by how many values there are.

For values $x_1, x_2, \dots, x_n$:

$$
\bar{x} = \frac{x_1 + x_2 + \cdots + x_n}{n} = \frac{1}{n}\sum_{i=1}^{n} x_i
$$

Read the right-hand side as an instruction: *add the $x$'s, then share the total equally among $n$ places.* Nothing is hidden in that formula, and that is its strength.

## Why it adds something

One number summarises many. Instead of carrying 200 bicycle prices in your head, you carry one number that preserves an important property of the whole list: its total. If you know the mean and the count, you can recover the sum exactly:

$$
\text{sum} = n \cdot \bar{x}.
$$

No other measure of centre keeps the total. This is why the mean appears everywhere money is involved, from average order value to GDP per person: totals matter, and the mean is the total with the count divided out.

## Worked by hand

Take five delivery times in minutes:

$$
8,\; 12,\; 10,\; 15,\; 45
$$

Step 1 — add them:

$$
8 + 12 + 10 + 15 + 45 = 90
$$

Step 2 — divide by the count, $n = 5$:

$$
\bar{x} = \frac{90}{5} = 18
$$

The mean delivery time is 18 minutes. Check the meaning: if all five deliveries had taken 18 minutes, the total would still be 90. That is exactly what the mean promises.

## The same thing in Python

```python
times = [8, 12, 10, 15, 45]

total = sum(times)
n = len(times)
print(total / n)                 # 18.0
```

Doing it by hand first matters, because the library version hides the two steps. Python's standard library has the same computation:

```python
from statistics import mean

print(mean([8, 12, 10, 15, 45]))  # 18
```

Both are correct. The long form is worth knowing because when the answer looks wrong, you need to know which part to check.

## When one value drags it

Look again at those five times. Four of them are between 8 and 15 minutes. The fifth is 45. The mean, 18, is larger than four of the five values — it sits above most of the data.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Remove the 45-minute delivery. What is the mean of the remaining four?

<p class="challenge__answer">💡 <strong>Answer:</strong> $(8+12+10+15)/4 = 45/4 = 11.25$. One value out of five moved the mean from 11.25 to 18, a shift of 6.75 minutes, while four values barely moved at all. Click the 45 out of the picture and the mean jumps back.</p>

</div>
</details>

That sensitivity is not a bug to be patched; it is the mean doing its job. A 45-minute delivery genuinely contributes 45 minutes to the total, and the mean is built from totals. The problem only appears when you use the mean to describe a *typical* value while the data contains a few values that are not typical.

## Seeing it geometrically

Each value can be drawn as a point on a line, and the mean is the point where the line balances, like a see-saw with weights:

- a value far from the mean pulls harder, because its distance counts more;
- the distances above the mean and below it cancel out exactly.

You can drag points on a number line and watch the balance point move in the [GeoGebra mean-and-median explorer](https://www.geogebra.org/m/zsbf4jqm). Notice what happens when you drag one point far to the right: the balance point follows it.

## When to use it

- You care about the **total**, not the individual: average spend per customer, average score, average temperature.
- The data is roughly symmetric, with no extreme values on one side.
- You will do arithmetic with it later: means add up in a way medians do not, which is why nearly every formula later in this course uses the mean.

## Limitations

- **It is pulled by outliers.** A single very large or very small value can move it far from the rest of the data.
- **It needs numbers.** There is no mean of "red, green, blue".
- **It can be a value nobody has.** The mean of 2 and 3 is 2.5; if the variable only takes whole numbers, 2.5 may be impossible.
- **It says nothing about spread.** Two datasets with wildly different variability can share a mean. The next module fixes that.

## Common pitfalls

- **Dividing by the wrong count.** Off-by-one from including a header row or an empty cell is the most common mean bug in real work.
- **Averaging averages.** The mean of three group means is only the overall mean when the groups are the same size. Otherwise you must weight by group size.
- **Reporting more digits than the data supports.** If times are recorded to the nearest minute, report 18 minutes, not 18.0.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Three groups of students take a test. Group A (10 students) averages 70, group B (20 students) averages 80, group C (30 students) averages 90. What is the overall average? Is it 80?

<p class="challenge__answer">💡 <strong>Answer:</strong> No. The unweighted average of the three means is 80, but the groups are different sizes. The overall mean is $(10\cdot70 + 20\cdot80 + 30\cdot90)/60 = (700 + 1600 + 2700)/60 = 5000/60 \approx 83.3$. Group C is the largest, so it pulls the overall figure towards 90.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A dataset of salaries has mean 62,000 and median 48,000. Which measure would you quote in a job advert, and which would a union quote in a negotiation? Explain the difference in terms of who benefits from each number.

<p class="challenge__answer">💡 <strong>Answer:</strong> The advert quotes the mean, because it is higher and flatters the employer; the union quotes the median, because it describes what a typical worker actually earns. When mean and median disagree this sharply, the distribution has a long right tail: a few very high salaries pull the mean up while most people sit near 48,000.</p>

</div>
</details>

## 🤔 Socratic Questions

- If the mean of five numbers is 10, must one of the numbers be 10?
- What happens to the mean if you add a new value equal to the current mean?
- Why does doubling every value double the mean, while adding 5 to every value adds exactly 5 to the mean?
- A shop reports "average customer spends $40" but most customers spend under $20. What would you ask before believing it?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-mean">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does the mean of a list of numbers represent?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The value that appears most often.</button>
      <button class="quiz-q__opt" data-idx="1">The value every entry would have if the total were shared equally.</button>
      <button class="quiz-q__opt" data-idx="2">The middle value once the list is sorted.</button>
      <button class="quiz-q__opt" data-idx="3">The largest value minus the smallest.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. The values 4, 6, 8, 10, 52 have a mean of 16. Which statement is true?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">16 is a typical value in this list.</button>
      <button class="quiz-q__opt" data-idx="1">The mean is wrong; it should be 10.</button>
      <button class="quiz-q__opt" data-idx="2">The single value 52 pulls the mean above four of the five entries.</button>
      <button class="quiz-q__opt" data-idx="3">The mean ignores the 52 because it is an outlier.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
