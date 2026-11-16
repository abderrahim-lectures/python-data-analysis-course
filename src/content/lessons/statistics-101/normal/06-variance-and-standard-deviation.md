---
title: "Variance and Standard Deviation"
description: "The average squared distance from the mean, and the square root that puts it back in the data's own units."
module: "spread-and-shape"
order: 6
difficulty: "beginner"
estimatedMinutes: 22
learningObjectives:
  - "Compute deviations from the mean and check that they sum to zero"
  - "Compute a sample variance by hand, one step at a time"
  - "Convert variance to standard deviation and interpret it in the original units"
  - "Explain why the divisor is n − 1 for a sample"
  - "Say how many standard deviations a given value sits from the mean"
prerequisites: []
tags: ["variance", "standard-deviation", "spread", "deviation"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

A measure of **spread** answers: how far from the centre do values typically sit? The simplest is the **range**, largest minus smallest. It is easy and nearly useless, because it is built from only two values and one extreme entry can set it.

The useful measures are built from *every* value's distance to the mean. For values $x_1,\dots,x_n$ with mean $\bar{x}$, the **deviation** of each value is

$$
d_i = x_i - \bar{x}.
$$

Some deviations are positive, some negative, and they always cancel:

$$
\sum_{i=1}^{n} (x_i - \bar{x}) = 0.
$$

That is a property of the mean itself, and it is the reason you cannot simply average the deviations: the answer is always zero. Squaring removes the sign. The **variance** is the average squared deviation:

$$
s^2 = \frac{1}{n-1}\sum_{i=1}^{n} (x_i - \bar{x})^2 .
$$

The **standard deviation** is its square root:

$$
s = \sqrt{s^2}.
$$

Squaring made the units wrong (minutes became minutes-squared), so the square root puts them back. That is the whole reason both numbers exist: variance is the quantity that behaves well in algebra, standard deviation is the one a human can interpret.

## Why it adds something

A centre tells you where the data sits. Spread tells you how much you can trust that centre as a description, how unusual any single value is, and whether two groups that look the same on average actually are.

It is also how uncertainty is expressed anywhere else in statistics: a confidence interval, a t-test and a correlation all consume a standard deviation. Get this quantity right and the rest of the course is mostly bookkeeping.

## Worked by hand

Five delivery times again: $8,\;10,\;12,\;15,\;45$ minutes. The mean is 18.

**Step 1 — deviations from the mean.**

$$
8-18 = -10,\quad 10-18 = -8,\quad 12-18 = -6,\quad 15-18 = -3,\quad 45-18 = 27
$$

**Step 2 — check they cancel.** $-10-8-6-3+27 = 0$. If your deviations do not sum to zero, the mean you subtracted is wrong; this is the cheapest arithmetic check in statistics.

**Step 3 — square each deviation.**

$$
100,\quad 64,\quad 36,\quad 9,\quad 729
$$

**Step 4 — add the squares.** $100 + 64 + 36 + 9 + 729 = 938$.

**Step 5 — divide by $n-1 = 4$.**

$$
s^2 = \frac{938}{4} = 234.5
$$

**Step 6 — take the square root.**

$$
s = \sqrt{234.5} \approx 15.3 \text{ minutes}
$$

Interpretation: a typical delivery sits about 15 minutes away from the mean of 18. That number is large next to the mean, and it should be — four of the five times are within 10 minutes of each other and the fifth is 27 minutes away.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Remove the 45-minute delivery and redo steps 5 and 6 with the remaining four values, whose mean is 11.25. Which changed more, the mean or the standard deviation?

<p class="challenge__answer">💡 <strong>Answer:</strong> Deviations are $-3.25, -1.25, 0.75, 3.75$; squares sum to $10.5625 + 1.5625 + 0.5625 + 14.0625 = 26.75$; $s^2 = 26.75/3 \approx 8.92$; $s \approx 2.99$ minutes. The mean fell from 18 to 11.25, but the standard deviation collapsed from 15.3 to 3.0. One value was responsible for most of the apparent inconsistency.</p>

</div>
</details>

## Why n − 1

When you compute a mean from a sample you have already used the data once, and the deviations are measured from *that* mean rather than the unknown true one. The sample mean sits as close to the data as it possibly can, so the squared deviations you compute are systematically a little too small. Dividing by $n-1$ instead of $n$ corrects for that.

Two honest ways to read it:

- at $n = 5$ the difference is large (divide by 4, not 5, a 25% inflation); at $n = 1000$ it is negligible;
- some quantities (describing a whole population, not estimating from a sample) do divide by $n$, which is why you will see both formulas.

In this course we use $n-1$ whenever the data is a sample, which is almost always.

## The same thing in Python

```python
times = [8, 10, 12, 15, 45]
n = len(times)
mean = sum(times) / n

squared = [(x - mean) ** 2 for x in times]
variance = sum(squared) / (n - 1)
sd = variance ** 0.5

print(round(variance, 2))   # 234.5
print(round(sd, 2))         # 15.31
```

The standard library gives the same, with the $n-1$ divisor by default:

```python
import statistics as st

print(st.variance(times))       # 234.5
print(st.stdev(times))          # 15.313...
print(st.pstdev(times))         # 13.693...  ← divides by n (population)
```

Watch that last line: `pstdev` is the population form, and mixing the two is a common source of answers that disagree with a textbook by a few percent.

## How far is unusual?

Once you have a mean and a standard deviation, you can say how unusual a value is in units of the spread:

$$
z = \frac{x - \bar{x}}{s}.
$$

For the 45-minute delivery, $z = (45-18)/15.3 \approx 1.76$: it sits 1.76 standard deviations above the mean. For a rough guide on roughly bell-shaped data, about two-thirds of values fall within one standard deviation and about 95% within two. The 45 is inside two, which is a fair warning that this is a small sample and "unusual" needs care.

## Seeing it geometrically

Each squared deviation is the area of a square drawn on that gap. The variance is the average area; the standard deviation is the side length of a square with that average area. In the [GeoGebra standard-deviation explorer](https://www.geogebra.org/m/xwqpnvfy) you can drag a point and watch the average area grow much faster than the gap itself, which is why a single extreme value inflates the variance so sharply.

## When to use it

- Comparing **consistency** between groups with the same units (two machines, two classes, two months).
- Turning a raw value into a **standardised** one, which is how later methods (correlation, regression, z-tests) put different variables on one scale.
- Reporting **uncertainty** around a mean: the standard error you will meet later is $s/\sqrt{n}$.

## Limitations

- **Sensitive to outliers, more than the mean.** Deviations are squared, so a value twice as far away contributes four times as much.
- **Only meaningful for numeric data** and only comparable when the units are the same. A standard deviation of 5 means different things in minutes and in dollars.
- **Assumes a sensible centre.** For heavily skewed data, a standard deviation around the mean can be misleading; the interquartile range is often the better summary.
- **It is not a range.** "Within one standard deviation" is not a promise about every value; it is a typical distance.

## Common pitfalls

- **Dividing by $n$ when you meant $n-1$.** Your answer will be slightly low and will disagree with most software.
- **Forgetting the square root** and reporting a variance as if it were a standard deviation.
- **Comparing standard deviations across different units.** Convert to a coefficient of variation ($s/\bar{x}$) first.
- **Rounding in the middle.** Keep full precision through step 5; rounding deviations early can shift the last digit of the answer.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Add 10 to every value in the dataset. What happens to the mean, the variance and the standard deviation?

<p class="challenge__answer">💡 <strong>Answer:</strong> The mean rises by 10; every deviation $x_i - \bar{x}$ is unchanged, so the variance and standard deviation are exactly the same. Shifting data does not change spread. Multiplying every value by 2, by contrast, doubles the mean and the standard deviation, and multiplies the variance by 4.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Two machines fill bottles. Machine A delivers 500 ml with a standard deviation of 2 ml; machine B delivers 505 ml with a standard deviation of 8 ml. Which one would you buy if under-filling is a legal problem, and which if over-filling wastes money?

<p class="challenge__answer">💡 <strong>Answer:</strong> For under-filling, A: its mean is lower but its spread is small, so the worst cases are closer to the target; with B a 2-standard-deviation shortfall lands near 489 ml. For waste, B wastes 5 ml on average but A's tight spread means you can aim closer to the legal minimum safely. The comparison is about the whole distribution, not the average alone.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why do the deviations always sum to zero, whatever the data?
- Can a standard deviation be larger than the mean? What does that imply about the data?
- Why does squaring make the measure more sensitive to extreme values than taking absolute distances would?
- If two datasets have equal means and equal standard deviations, must they look the same? What else could differ?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-variance">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Why do we square the deviations before averaging them?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">To make the numbers bigger.</button>
      <button class="quiz-q__opt" data-idx="1">Because positive and negative deviations would otherwise cancel to zero.</button>
      <button class="quiz-q__opt" data-idx="2">Because squared values are easier to compute.</button>
      <button class="quiz-q__opt" data-idx="3">To remove outliers from the dataset.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. A sample has variance 49. What is its standard deviation?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">49</button>
      <button class="quiz-q__opt" data-idx="1">2401</button>
      <button class="quiz-q__opt" data-idx="2">7</button>
      <button class="quiz-q__opt" data-idx="3">24.5</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. Why divide by n − 1 rather than n for a sample variance?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Because deviations are measured from the sample mean, which is itself fitted to the data and slightly too close to it.</button>
      <button class="quiz-q__opt" data-idx="1">Because one value is always missing from a sample.</button>
      <button class="quiz-q__opt" data-idx="2">Because it makes the answer round.</button>
      <button class="quiz-q__opt" data-idx="3">Because the median needs an adjustment.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
