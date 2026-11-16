---
title: "Uncertainty in the Real World"
description: "Bootstrap intervals, the assumptions behind every test, and how to write up an analysis a reviewer can trust."
module: "applied-statistics"
order: 19
difficulty: "advanced"
estimatedMinutes: 35
learningObjectives:
  - "Build a confidence interval by resampling when the formula's assumptions fail"
  - "Explain what the bootstrap assumes and what it cannot fix"
  - "Distinguish sampling error from bias, with an example of each"
  - "Write an analysis summary that states its assumptions and its limits"
prerequisites: []
tags: ["bootstrap", "resampling", "bias", "reporting", "robustness"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 25
section: "statistics-101"
track: "hard"
---

## What it means

Every interval in this course so far came from a formula that assumes something: normality, independence, a known shape. When those assumptions fail, the arithmetic still produces a number and the number is no longer trustworthy.

The **bootstrap** avoids the formula. To estimate how much a statistic would wobble, resample your own data with replacement many times, recompute the statistic on each resample, and look at the spread of what you get:

$$
\text{resample} \to \hat{\theta}^* \quad\text{many times} \to \text{spread of } \hat{\theta}^* .
$$

A 95% bootstrap interval is the middle 95% of those recomputed values. It uses no distributional assumption beyond "the sample looks like the population" — which is the same assumption every sample-based estimate already makes.

## Why it adds something

It extends intervals to statistics that have no simple formula: a median, a correlation, a ratio of two means, the difference between two 90th percentiles. Instead of hunting for a textbook formula, you resample.

It also makes the meaning of uncertainty concrete. You can *see* the variation of the estimate rather than trusting a derivation.

## Worked by hand, conceptually

The median of $1,2,2,3,3,4,5,6,8,12,20,96$ is 4.5. How uncertain is it?

You cannot compute that from a formula without an assumption about the shape. Bootstrap it:

1. draw 12 values from the data, with replacement;
2. compute the median of that resample;
3. repeat a few thousand times;
4. take the 2.5th and 97.5th percentiles of the medians.

With replacement matters: without it every resample would be the original data and every median identical.

```python
import random, statistics as st

hours = [1, 2, 2, 3, 3, 4, 5, 6, 8, 12, 20, 96]
medians = []

for _ in range(5000):
    resample = random.choices(hours, k=len(hours))   # with replacement
    medians.append(st.median(resample))

medians.sort()
lo, hi = medians[125], medians[-126]                # 2.5% and 97.5% tails
print(round(st.median(hours), 1), round(lo, 1), round(hi, 1))
```

The interval around 4.5 is wide — with 12 values and one extreme case, the median is not pinned down nearly as tightly as a formula assuming normality would claim.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Bootstrap the mean of the same data and compare its interval with the median's. Which is wider, and why?

<p class="challenge__answer">💡 <strong>Answer:</strong> The mean's interval is much wider, because the resampling occasionally draws the 96 two or three times and the mean jumps accordingly. The median barely notices. This is the same outlier-sensitivity as the standard deviation, now visible as uncertainty.</p>

</div>
</details>

## What the bootstrap cannot do

- **It cannot fix bias.** If the sample is unrepresentative, resampling it reproduces the same wrong answer with a tight interval around it.
- **It assumes the sample is a fair draw** from the population you care about. That is the assumption doing all the work.
- **It struggles with very small samples**, where resampling has too little variety to work with.
- **It assumes independence.** Clustered data needs a block bootstrap, and time series need care about order.

The distinction worth keeping straight:

| | Sampling error | Bias |
|---|---|---|
| What it is | Random wobble between samples | Systematic offset from the truth |
| Fixed by | More data | A better design |
| Visible in | Intervals, standard errors | Usually nothing — intervals stay narrow |

A tight interval around a biased estimate is the most dangerous output in statistics, because it looks like certainty.

## The same thing in Python

```python
import numpy as np

rng = np.random.default_rng(42)
hours = np.array([1, 2, 2, 3, 3, 4, 5, 6, 8, 12, 20, 96])

def bootstrap(stat, data, n=5000):
    idx = rng.integers(0, len(data), size=(n, len(data)))
    return np.array([stat(data[i]) for i in idx])

for name, fn in [('mean', np.mean), ('median', np.median)]:
    vals = bootstrap(fn, hours)
    print(name, np.round(np.percentile(vals, [2.5, 97.5]), 2))
```

The same function works for any statistic, which is the practical reason to keep it in reach.

## Writing it up

A summary that a reviewer can trust answers these in order:

1. **What was the question**, stated before the data was looked at.
2. **What was measured**, with sample size and how the sample was drawn.
3. **What was found**, as an effect with an interval, not a p-value alone.
4. **What was assumed**, including every exclusion and adjustment.
5. **What could be wrong**, naming the most plausible bias rather than saying "more research is needed".
6. **What follows for a decision**, stated in the units of the decision.

## When to use it

- Any statistic without a clean formula.
- Any dataset where the normal assumption is doubtful.
- As a robustness check alongside a formula-based interval: if the two agree, the conclusion is firmer; if they disagree, the assumption was load-bearing.

## Limitations

- **Bootstrap intervals are not immune to small samples or bias**, as above.
- **They can understate uncertainty when the data is dependent**, unless the resampling scheme respects the dependence.
- **They are computational**, which is cheap now but adds moving parts to a report.
- **They do not replace thinking about the design.** No resampling scheme fixes a biased sample.

## Common pitfalls

- **Resampling without replacement**, which produces zero variation and a point-like interval.
- **Using the bootstrap to paper over a biased sample.**
- **Reporting the point estimate and dropping the interval**, which discards the whole output.
- **Quoting a p-value with no effect size**, in any write-up.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A survey of website visitors reports "average satisfaction 4.6 out of 5, 95% CI [4.55, 4.65]". Why might the interval be misleading despite being narrow?

<p class="challenge__answer">💡 <strong>Answer:</strong> The sample is visitors — people who left. Anyone who bounced away without answering is missing, and their satisfaction is plausibly much lower. That is selection bias: the interval correctly describes the uncertainty of the mean among respondents, and says nothing about the population of all visitors.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does resampling with replacement mimic drawing a fresh sample?
- Which is worse to report: a wide interval or a narrow interval around a biased estimate?
- What does a bootstrap interval assume that a formula-based interval does not, and vice versa?
- If a formula interval and a bootstrap interval disagree on the same data, which would you trust, and what would you investigate?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-uncertainty">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Why must the bootstrap resample with replacement?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">To make the computation faster.</button>
      <button class="quiz-q__opt" data-idx="1">Because statistics requires it.</button>
      <button class="quiz-q__opt" data-idx="2">Without replacement every resample is the original data, so there is no variation to measure.</button>
      <button class="quiz-q__opt" data-idx="3">To remove outliers.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. A narrow confidence interval around a biased estimate tells you what?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The estimate is accurate.</button>
      <button class="quiz-q__opt" data-idx="1">The estimate is precise, and the bias is outside what the interval measures.</button>
      <button class="quiz-q__opt" data-idx="2">The sample is large enough to remove all error.</button>
      <button class="quiz-q__opt" data-idx="3">Nothing at all.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
