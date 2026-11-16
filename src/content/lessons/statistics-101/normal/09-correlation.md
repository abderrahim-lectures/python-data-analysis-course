---
title: "Correlation"
description: "Pearson's r and Spearman's rho: how two variables move together, how to compute it by hand, and the four ways it misleads."
module: "relationships"
order: 9
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Read the direction and tightness of a scatter plot before computing anything"
  - "Compute a Pearson correlation by hand with the standardised formula"
  - "Interpret r as a number between −1 and 1, in both sign and size"
  - "Compute a Spearman rank correlation and say when it beats Pearson"
  - "Explain why r² describes explained variation and r does not"
prerequisites: []
tags: ["correlation", "pearson", "spearman", "scatter-plot", "causation"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 15
section: "statistics-101"
track: "normal"
---

## What it means

Two variables are **correlated** when they tend to move together. A correlation coefficient compresses that tendency into one number between $-1$ and $+1$.

The **Pearson correlation** measures how close the points sit to a *straight line*:

$$
r = \frac{1}{n-1}\sum_{i=1}^{n}
\left(\frac{x_i - \bar{x}}{s_x}\right)
\left(\frac{y_i - \bar{y}}{s_y}\right)
$$

Each value becomes a standardised score — how many standard deviations it sits from its mean — and the formula is the average product of the two standardised scores. When $x$ is above its mean at the same time as $y$ is above its mean, that product is positive; when they disagree, it is negative. The average of those products is $r$.

The **Spearman correlation** is the same formula computed on *ranks* instead of values. That makes it robust to outliers and able to capture any relationship that keeps going in one direction, not only straight ones.

## Why it adds something

Describing one variable is half the job. Almost every interesting claim is relational: a treatment is associated with better outcomes, price with demand, temperature with sales. A correlation is the cheapest quantitative answer, and knowing its limits protects you from the most common bad inference in data work — reading a cause into a coincidence.

It also feeds nearly everything later: regression, feature selection, and the reliability checks that come before fitting any model.

## Worked by hand

Five students, hours studied $x$ and score $y$:

$$
x = 1,2,3,4,5 \qquad y = 50,55,65,70,80
$$

**Step 1 — the means.** $\bar{x} = 3$, $\bar{y} = 64$.

**Step 2 — deviations from each mean.**

| $x$ | $y$ | $x - \bar{x}$ | $y - \bar{y}$ |
|---|---|---|---|
| 1 | 50 | −2 | −14 |
| 2 | 55 | −1 | −9 |
| 3 | 65 | 0 | +1 |
| 4 | 70 | +1 | +6 |
| 5 | 80 | +2 | +16 |

**Step 3 — standard deviations.** $\sum (x-\bar{x})^2 = 10$, so $s_x = \sqrt{10/4} \approx 1.581$. $\sum (y-\bar{y})^2 = 196 + 81 + 1 + 36 + 256 = 570$, so $s_y = \sqrt{570/4} \approx 11.94$.

**Step 4 — standardise and multiply, row by row.** For the first row, $(-2/1.581)(-14/11.94) \approx 1.265 \times 1.173 \approx 1.484$. Doing all five and adding:

$$
\sum \left(\frac{x-\bar{x}}{s_x}\right)\left(\frac{y-\bar{y}}{s_y}\right) \approx 4.949
$$

**Step 5 — divide by $n-1$.**

$$
r = \frac{4.949}{4} \approx 0.987
$$

Nearly 1. Hours studied and score rise together almost perfectly in this sample.

**Step 6 — square it.** $r^2 \approx 0.975$: 97.5% of the variation in scores goes with the linear trend in study hours. Note that $r^2$ is the number to quote when you want to say "how much of it is explained"; $r$ itself overstates that.

## Reading the sign and the size

| $r$ | Reading |
|---|---|
| $+1$ | perfect straight-line increase |
| $+0.7$ | strong upward trend, with visible scatter |
| $+0.2$ | weak upward trend, nearly lost in noise |
| $0$ | no *linear* trend (there may still be a curve) |
| $-0.6$ | moderate downward trend |

The sign says the direction, the magnitude says how tight the straight-line fit is, and nothing more. $r = 0$ is not "no relationship"; it is "no straight-line relationship" — a perfect U-shaped relationship has $r \approx 0$.

## When Pearson misleads: use Spearman

Consider these five points: $x = 1,2,3,4,5$ and $y = 1,4,9,16,25$. The relationship is perfect and upward, but curved. Pearson's $r$ is about $0.98$ — high but not 1, because the curve is not straight. Spearman's rank correlation on the same data is exactly 1: every rank in $x$ matches a rank in $y$.

The practical rule:

- use **Pearson** when both variables are numeric, roughly continuous, and the scatter looks like a line or an ellipse;
- use **Spearman** when the relationship is monotone but curved, when there are outliers, or when one variable is ordinal (a 1–5 satisfaction rating, a competition placing).

## The same thing in Python

```python
x = [1, 2, 3, 4, 5]
y = [50, 55, 65, 70, 80]

import statistics as st
mx, my = st.mean(x), st.mean(y)
sx, sy = st.stdev(x), st.stdev(y)

zx = [(v - mx) / sx for v in x]
zy = [(v - my) / sy for v in y]
r = sum(a * b for a, b in zip(zx, zy)) / (len(x) - 1)
print(round(r, 3))        # 0.987
print(round(r ** 2, 3))   # 0.975
```

NumPy and pandas do the same in one call, and `corr(method='spearman')` switches the rank version:

```python
import numpy as np
print(np.corrcoef(x, y)[0, 1])

import pandas as pd
df = pd.DataFrame({'hours': x, 'score': y})
print(df.corr(method='pearson'))
print(df.corr(method='spearman'))
```

## Seeing it geometrically

On a scatter plot, Pearson's $r$ describes how narrow the cloud is around a straight line. Rotate the cloud and $r$ changes; bend it into a U and $r$ falls to zero while the relationship gets stronger. The [GeoGebra correlation explorer](https://www.geogebra.org/m/gtxfmqsf) lets you drag points and watch $r$ react, including the moment one point drags a formerly tight line into a weak one.

## When to use it

- **Screening relationships** before deciding what to model.
- **Validating** that a feature carries information about a target.
- **Reporting** association honestly, alongside a scatter plot so the reader can see what the number summarises.

## Limitations

- **Correlation is not causation.** Ice-cream sales correlate with drownings; both follow the weather.
- **It measures straight lines only.** Strong curved relationships can show $r$ near zero.
- **It is sensitive to outliers.** One far-away point can lift $r$ from 0.2 to 0.8, or destroy a real one.
- **Restricted ranges shrink it.** Correlating among the top 10% of values can hide a relationship that is strong overall.
- **Combining groups can invent it** (Simpson's paradox): two clusters each with no trend can show a strong trend when pooled.

## Common pitfalls

- **Reading $r^2$ as a percentage and then also quoting $r$ as if it were one.** $r = 0.5$ means 25% of the variation, not 50%.
- **Comparing correlations across different populations** without checking that the ranges are comparable.
- **Ignoring the scatter plot.** The number cannot tell you about curvature, clusters or outliers; the picture can.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Explain why the following is wrong: "the correlation between ice-cream sales and drowning deaths is 0.9, so ice cream makes people swim badly."

<p class="challenge__answer">💡 <strong>Answer:</strong> Correlation measures co-movement, not mechanism. Both variables track a third one — hot weather — which raises both consumption and swimming. The correct reading of $r = 0.9$ is "these move together"; attributing a direction of cause requires an experiment or a much stronger argument than a coefficient.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

You compute Pearson's r on 12 points and get 0.1, but the scatter plot shows a clean U. What should you report, and what would Spearman give?

<p class="challenge__answer">💡 <strong>Answer:</strong> Report that there is a strong non-linear relationship with no linear component; $r \approx 0$ is technically correct but misleading as a summary. Spearman would also be near 0 here, because the ranks do not increase monotonically (they rise, then fall). The right next step is to model curvature — fit $y$ against $x$ and $x^2$, or plot a smoothed curve — rather than quote either coefficient as the finding.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why is $r$ unchanged if you add 10 to every $x$ value, or multiply every $y$ by 3?
- Can $r$ be 0.9 while almost every point sits far from the best-fit line? When?
- If two variables are independent, must their correlation be zero? If their correlation is zero, must they be independent?
- What does it mean for a correlation to be "statistically significant" when $r = 0.05$ and $n$ is 100,000?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-correlation">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Pearson's r is 0.8. What fraction of the variation in y is associated with the linear trend in x?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">80%</button>
      <button class="quiz-q__opt" data-idx="1">0.8%</button>
      <button class="quiz-q__opt" data-idx="2">64%</button>
      <button class="quiz-q__opt" data-idx="3">20%</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. When should you prefer Spearman to Pearson?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">When both variables are normally distributed.</button>
      <button class="quiz-q__opt" data-idx="1">When the relationship is monotone but not straight, or the data has outliers.</button>
      <button class="quiz-q__opt" data-idx="2">When you want to prove causation.</button>
      <button class="quiz-q__opt" data-idx="3">When the sample is large.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">3. A correlation of 0.95 between two variables establishes what?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">That one causes the other.</button>
      <button class="quiz-q__opt" data-idx="1">That both are normally distributed.</button>
      <button class="quiz-q__opt" data-idx="2">That a straight line predicts y perfectly.</button>
      <button class="quiz-q__opt" data-idx="3">That they move together along a strong linear trend.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
