---
title: "Confidence Intervals"
description: "A range that usually contains the truth, built from a mean, a standard error and a multiplier you can justify."
module: "samples-and-uncertainty"
order: 12
difficulty: "intermediate"
estimatedMinutes: 22
learningObjectives:
  - "Build a 95% confidence interval for a mean by hand"
  - "Interpret a confidence interval correctly, including what it does not say"
  - "Explain what the 95% refers to, using repeated sampling"
  - "Choose a wider or narrower interval and say what each buys"
prerequisites: []
tags: ["confidence-interval", "inference", "margin-of-error", "uncertainty"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

A **confidence interval** is a range of plausible values for a population parameter, built from a sample estimate plus and minus a margin:

$$
\bar{x} \pm t_{n-1,\,0.975}\cdot \frac{s}{\sqrt{n}}
$$

For large samples the multiplier $t$ is close to 2, which is where the familiar "±2 standard errors" comes from. Its interpretation is the subtle part:

> If you repeated the study many times, about 95% of the intervals you build this way would contain the true parameter.

The 95% describes the **procedure**, not your particular interval. Any single interval either contains the truth or it does not, and you cannot know which. What you can say is that the method is right 95% of the time.

## Why it adds something

A point estimate pretends to a precision it does not have. "Average delivery time is 18 minutes" sounds exact and is almost certainly wrong in the third digit. "Between 11.7 and 24.3 minutes, with 95% confidence" is a statement you can act on: it tells a manager they cannot yet promise a 15-minute service, because 15 is inside the plausible range.

Intervals also make comparisons honest. Two groups whose intervals overlap substantially are not clearly different, whatever their means suggest.

## Worked by hand

Sample of $n=25$ deliveries: mean 18 minutes, standard deviation 15.3 minutes, standard error 3.06 minutes.

**Step 1 — choose the confidence level.** 95% is conventional. For $n=25$ the correct multiplier is the $t$ value with 24 degrees of freedom, which is about 2.064.

**Step 2 — the margin.**

$$
2.064 \times 3.06 \approx 6.3 \text{ minutes}
$$

**Step 3 — the interval.**

$$
18 \pm 6.3 \;=\; (11.7,\; 24.3) \text{ minutes}
$$

**Step 4 — say what it means.** "We estimate the mean delivery time at 18 minutes, with a 95% confidence interval from 11.7 to 24.3." A service promise of under 12 minutes is at the very edge of plausibility; a promise of 30 is comfortably above it.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

The same study with $n=100$ deliveries gives the same mean and standard deviation. What is the new interval, and how much narrower is it?

<p class="challenge__answer">💡 <strong>Answer:</strong> The standard error becomes $15.3/10 = 1.53$, the $t$ multiplier shrinks slightly to about 1.984, and the margin is about 3.0 minutes. The interval is $(15.0, 21.0)$, roughly half the width. Four times the data halves the uncertainty — the same square-root law as the standard error.</p>

</div>
</details>

## What it does not say

Four common misreadings, all worth recognising in other people's reports:

- **"There is a 95% chance the true mean is between 11.7 and 24.3."** In the frequentist reading, the true mean is a fixed number; it is the interval that is uncertain.
- **"95% of deliveries take between 11.7 and 24.3 minutes."** No — that would be a prediction interval, which is much wider.
- **"The interval contains 95% of the data."** It contains the mean, not the data.
- **"Overlapping intervals mean no difference."** Overlap is a rough hint, not a test; intervals can overlap while the difference is still clear.

## The same thing in Python

The arithmetic by hand, then the library version:

```python
import statistics as st

times = [8, 10, 12, 15, 45]
n = len(times)
m = st.mean(times)
se = st.stdev(times) / n ** 0.5
margin = 2.064 * se            # t for 24 df, 95%; for n=5 use your own df
print(round(m - margin, 1), round(m + margin, 1))
```

`scipy` computes the multiplier for any sample size and confidence level:

```python
from scipy import stats

lo, hi = stats.t.interval(0.95, df=n - 1, loc=m, scale=se)
print(round(lo, 1), round(hi, 1))
```

And the experiment behind the interpretation: build many intervals from many samples and count how often they contain the truth.

```python
import random, statistics as st
from scipy import stats

population = [random.gauss(50, 10) for _ in range(10_000)]
truth = st.mean(population)
hits = 0
for _ in range(500):
    sample = random.sample(population, 25)
    lo, hi = stats.t.interval(0.95, df=24, loc=st.mean(sample), scale=st.stdev(sample) / 5)
    hits += lo <= truth <= hi
print(hits / 500)      # ≈ 0.95
```

That output — around 95% — is the entire meaning of the phrase.

## Seeing it geometrically

Picture the sampling distribution from the last lesson: the interval is the central 95% of it, translated back to the data scale. In the [GeoGebra confidence-interval demo](https://www.geogebra.org/m/sfqjzhcm) you can change the confidence level and see the interval widen as you demand more certainty, and narrow it again by raising $n$.

## When to use it

- Reporting any estimate whose precision matters: survey results, benchmark timings, quality measurements.
- Comparing two groups where you want to show the size of a plausible difference.
- Deciding whether a decision is safe under the worst plausible value, not just the best estimate.

## Limitations

- **Valid only if the sampling is unbiased.** A confidence interval around a biased estimate is a precise statement about the wrong thing.
- **Assumes independence.** Clustered or repeated measurements need a different formula.
- **Narrow intervals are not important intervals.** With a huge $n$, a trivial difference can have a tight interval.
- **It is not a prediction interval.** Individual values are far more variable than the mean.

## Common pitfalls

- **Using 1.96 for small samples.** That is the large-sample value; with $n=5$ the correct multiplier is above 2.7.
- **Reporting the interval without saying what it is for.** The mean, a difference, or a proportion — each has its own interval.
- **Treating non-overlap as proof of difference.** It is suggestive; a proper comparison is the right tool.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A report says "mean score 70, 95% CI [69.5, 70.5]" from a sample of 10,000 students, and concludes "the teaching method is clearly effective". What is missing from that argument?

<p class="challenge__answer">💡 <strong>Answer:</strong> A comparison. The interval says the mean is precisely known, not that it is good. Without a control group, a baseline, or a comparison interval, "70 ± 0.5" establishes only that the estimate is tight — a large $n$ makes almost any difference statistically visible, which is exactly why confidence intervals must be read alongside effect size.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does a 99% interval have to be wider than a 95% one on the same data?
- If two studies give very different intervals for the same quantity, what could explain it besides a mistake?
- Why can a confidence interval never tell you the probability that your specific interval is correct?
- What would you need to build a confidence interval for a median instead of a mean?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-ci">
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">1. What does "95% confidence" refer to?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The probability that this particular interval contains the truth.</button>
      <button class="quiz-q__opt" data-idx="1">The share of the data inside the interval.</button>
      <button class="quiz-q__opt" data-idx="2">The probability the sample mean is correct.</button>
      <button class="quiz-q__opt" data-idx="3">The share of intervals built this way that would contain the true value.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Which change makes a confidence interval narrower?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Raising the confidence level from 95% to 99%.</button>
      <button class="quiz-q__opt" data-idx="1">Increasing the sample size.</button>
      <button class="quiz-q__opt" data-idx="2">Increasing the variability in the sample.</button>
      <button class="quiz-q__opt" data-idx="3">Taking a biased sample.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
