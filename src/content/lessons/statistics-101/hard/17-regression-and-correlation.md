---
title: "Regression and Correlation Done Right"
description: "Fit a line, read its slope as a rate, check the four assumptions, and see why r and the slope are two views of one thing."
module: "applied-statistics"
order: 17
difficulty: "advanced"
estimatedMinutes: 40
learningObjectives:
  - "Fit a least-squares line by hand on a small dataset"
  - "Read the slope as a rate with units, and the intercept as a conditional mean"
  - "Compute r and explain its exact relationship to the slope and the standard deviations"
  - "Check the four regression assumptions on a residuals plot"
  - "Explain when a fitted line should not be extrapolated"
prerequisites: []
tags: ["regression", "least-squares", "residuals", "assumptions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 25
section: "statistics-101"
track: "hard"
---

## What it means

A **regression line** summarises how a response $y$ changes with a predictor $x$. The least-squares line minimises the sum of squared vertical distances from the points to the line:

$$
\hat{y} = b_0 + b_1 x, \qquad
b_1 = r\,\frac{s_y}{s_x}, \qquad
b_0 = \bar{y} - b_1 \bar{x}.
$$

The slope is the correlation rescaled into the units of the data: multiply $r$ by the ratio of the two standard deviations and you get "how many units $y$ moves per unit of $x$". This is why $r$ and $b_1$ always share a sign: they are the same relationship expressed on different scales.

## Why it adds something

Correlation says *that* two variables move together; regression says *how much*, in units you can act on. "Correlation 0.7" is hard to use; "each extra hour of study is associated with 6.3 more points" is a sentence a decision can be built on.

Regression also produces the residuals — the parts of $y$ the line fails to explain — and those residuals are where every assumption check happens.

## Worked by hand

Five students again: hours $x = 1,2,3,4,5$; scores $y = 50,55,65,70,80$.

From the correlation lesson: $\bar{x} = 3$, $\bar{y} = 64$, $s_x \approx 1.581$, $s_y \approx 11.94$, $r \approx 0.987$.

**Step 1 — the slope.**

$$
b_1 = 0.987 \times \frac{11.94}{1.581} \approx 0.987 \times 7.55 \approx 7.45
$$

**Step 2 — the intercept.**

$$
b_0 = 64 - 7.45 \times 3 = 64 - 22.35 = 41.65
$$

**Step 3 — the line.** $\hat{y} = 41.65 + 7.45x$.

**Step 4 — read it.** Each additional hour of study is associated with about 7.5 more points. The intercept, 41.65, is the predicted score for zero hours — a conditional mean, not a claim that a student who does nothing scores 41.65 in a causal sense.

**Step 5 — residuals.** Predicted versus actual:

| $x$ | $y$ | $\hat{y}$ | residual |
|---|---|---|---|
| 1 | 50 | 49.1 | +0.9 |
| 2 | 55 | 56.6 | −1.6 |
| 3 | 65 | 64.0 | +1.0 |
| 4 | 70 | 71.4 | −1.4 |
| 5 | 80 | 78.9 | +1.1 |

The residuals sum to zero (up to rounding), alternate sign, and stay small — a healthy fit for a straight line.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Predict the score for 10 hours of study. What is the prediction, and why should you be cautious about it?

<p class="challenge__answer">💡 <strong>Answer:</strong> $\hat{y} = 41.65 + 74.5 = 116.15$ — above the maximum possible score. This is extrapolation: the line was fitted on 1–5 hours and there is no evidence the relationship stays straight beyond that range. A score cannot exceed 100, so the model is already outside its valid domain.</p>

</div>
</details>

## The four assumptions

Check them on the residuals, not on the raw scatter:

1. **Linearity** — residuals show no curve. A U-shaped pattern means the relationship bends.
2. **Equal spread** — residuals fan out (or narrow) as $x$ grows, which is heteroscedasticity; the standard errors from the fit will then be wrong.
3. **Independence** — residuals are not correlated with order of collection, group, or time.
4. **Approximate normality of residuals** — needed for the p-values and intervals, less critical for the slope estimate itself.

```python
import numpy as np

x = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([50, 55, 65, 70, 80], dtype=float)

b1, b0 = np.polyfit(x, y, 1)
print(round(b1, 2), round(b0, 2))         # 7.45 41.65

resid = y - (b0 + b1 * x)
print(np.round(resid, 2))                  # [ 0.9 -1.6  1.0 -1.4  1.1]
```

With pandas and scipy you get the same slope plus the standard error you would report:

```python
from scipy import stats
res = stats.linregress(x, y)
print(res.slope, res.intercept, res.rvalue, res.pvalue, res.stderr)
```

## Seeing it geometrically

The least-squares line is the one that minimises the total area of the squares drawn on each residual. Drag a point in the [GeoGebra regression explorer](https://www.geogebra.org/m/dcpcyc3t) and watch the line swing — and watch a single far-away point at the end of the range lever it much harder than a point near the middle.

## When to use it

- Quantifying a relationship in the data's own units, with a slope you can quote.
- Adjusting for a second variable, which is what multiple regression does and what saves you from Simpson's paradox.
- Producing predictions inside the observed range, with the uncertainty attached.

## Limitations

- **A line cannot represent a curve.** If the residuals show curvature, the model is wrong however high $r$ is.
- **Correlation still is not causation.** A regression slope inherits every confounder the correlation had.
- **Influential points can set the slope.** One point at an extreme $x$ can move the line dramatically; check by refitting without it.
- **Extrapolation is dangerous** beyond the fitted range, as the 10-hour example shows.
- **Restricted range attenuates the slope.** Fit only among high performers and the slope flattens.

## Common pitfalls

- **Reporting $r$ when you fitted a slope** (or the reverse) without saying which.
- **Reading the intercept as a real-world baseline** when $x = 0$ is outside the data.
- **Ignoring the residual plot** because $r$ was high.
- **Calling the slope causal** when the design was observational.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Two variables have $r = 0.6$, $s_x = 2$ and $s_y = 10$. What is the slope of $y$ on $x$? And of $x$ on $y$? Why are they not reciprocals?

<p class="challenge__answer">💡 <strong>Answer:</strong> $b_{y \mid x} = 0.6 \times 10/2 = 3$; $b_{x \mid y} = 0.6 \times 2/10 = 0.12$. Their product is $r^2 = 0.36$, not 1. Least squares minimises vertical distances, so swapping which variable is on the y-axis fits a different line; only when $r = \pm1$ do the two lines coincide.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does the least-squares line pass through the point $(\bar{x}, \bar{y})$?
- If $r = 0$, what is the least-squares slope, and what does the line predict for every $x$?
- Why do the residuals always sum to zero for a model with an intercept?
- What does a fan-shaped residual plot imply about the confidence interval for the slope?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-regression">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. A regression of score on hours gives a slope of 7.45. What does it mean?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">A student with no hours scores 7.45.</button>
      <button class="quiz-q__opt" data-idx="1">Each extra hour is associated with about 7.45 more points.</button>
      <button class="quiz-q__opt" data-idx="2">The correlation is 7.45.</button>
      <button class="quiz-q__opt" data-idx="3">74.5% of the variation is explained.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. The residual plot shows a clear U shape. What is the problem?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The sample is too small.</button>
      <button class="quiz-q__opt" data-idx="1">The slope is negative.</button>
      <button class="quiz-q__opt" data-idx="2">The relationship is curved, so a straight line is the wrong model.</button>
      <button class="quiz-q__opt" data-idx="3">The intercept is not zero.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">3. Why is extrapolating a fitted line beyond the data range risky?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The arithmetic becomes harder.</button>
      <button class="quiz-q__opt" data-idx="1">The correlation drops to zero.</button>
      <button class="quiz-q__opt" data-idx="2">The intercept changes.</button>
      <button class="quiz-q__opt" data-idx="3">Nothing in the data shows that the straight-line pattern continues out there.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
