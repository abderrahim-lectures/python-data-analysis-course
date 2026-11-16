---
title: "The Normal Distribution"
description: "The bell curve, the 68–95–99.7 rule, and what it means for a value to be two standard deviations out."
module: "samples-and-uncertainty"
order: 10
difficulty: "intermediate"
estimatedMinutes: 20
learningObjectives:
  - "Recognise the normal curve from its shape, centre and spread"
  - "Apply the 68–95–99.7 rule without a table"
  - "Standardise a value into a z-score and read it as a position"
  - "Name the situations where assuming normality is a mistake"
prerequisites: []
tags: ["normal-distribution", "z-score", "bell-curve", "probability"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

The **normal distribution** is a family of symmetric bell-shaped curves, each fixed by two numbers: its centre $\mu$ and its spread $\sigma$. Its density has a specific form,

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}}\, e^{-\frac{(x-\mu)^2}{2\sigma^2}},
$$

but you rarely need to evaluate that by hand. What matters is the shape's consequence for distances.

Because the curve is symmetric and its spread is measured by $\sigma$, distances from the mean have fixed probabilities:

- about **68%** of values lie within $1\sigma$ of the mean;
- about **95%** within $2\sigma$;
- about **99.7%** within $3\sigma$.

That is the 68–95–99.7 rule, and it is the reason standard deviation is worth reporting.

## Why it adds something

The normal curve is the reference model that turns a raw measurement into a statement about rarity. A baby weighing 3.1 kg means nothing on its own; the same weight at 1.9 standard deviations below the mean is a different clinical situation entirely.

It is also the distribution behind the standard error and most interval formulas in later lessons, because averages of many independent things tend towards a normal shape whatever the original data looked like. That is the Central Limit Theorem, and it is why this curve shows up even when the data itself is not remotely bell-shaped.

## Worked by hand: a z-score

Adult heights in a population have mean $\mu = 170$ cm and standard deviation $\sigma = 10$ cm. A person is 185 cm tall. How unusual is that?

**Step 1 — standardise.**

$$
z = \frac{x - \mu}{\sigma} = \frac{185 - 170}{10} = 1.5
$$

**Step 2 — read the position.** The height is 1.5 standard deviations above the mean. Under the 68–95–99.7 rule, 68% of people lie between $160$ and $180$ cm, so 32% lie outside; half of those are above 180, about 16%. Our person is further out than 180 but less far than 190 (two standard deviations), so roughly 7% of people are taller.

**Step 3 — say it in words.** "About 7 in 100 adults are taller than this." That is the sentence a table or a library function gives you exactly, and the rule approximates without one.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A machine fills jars with a mean of 500 g and a standard deviation of 4 g, normally distributed. Roughly what proportion of jars weigh more than 508 g?

<p class="challenge__answer">💡 <strong>Answer:</strong> $z = (508-500)/4 = 2$, so the jar is two standard deviations above the mean. The 68–95–99.7 rule puts about 5% outside two standard deviations, half of it above, so roughly 2.5% — about 1 jar in 40.</p>

</div>
</details>

## The same thing in Python

```python
import statistics as st

heights = [158, 162, 165, 167, 170, 171, 174, 176, 179, 188]
mu = st.mean(heights)
sigma = st.pstdev(heights)      # population form, matching the model above

z = (185 - mu) / sigma
print(round(mu, 1), round(sigma, 2), round(z, 2))
```

For exact proportions, the standard normal cumulative distribution gives the area below a z-score:

```python
from statistics import NormalDist

normal = NormalDist(mu=170, sigma=10)
print(normal.cdf(185))              # ≈ 0.9332, the share below 185
print(1 - normal.cdf(185))          # ≈ 0.0668, the share above
```

`NormalDist` ships with Python's standard library, so this needs no installation.

## Seeing it geometrically

The area under the curve is probability, and the 68–95–99.7 rule is just a statement about areas between vertical lines. In the [GeoGebra normal-distribution tool](https://www.geogebra.org/m/yjz6bqtn) you can set the mean and standard deviation and drag the boundary to watch the shaded area change — including the moment you move from one to two standard deviations and the area collapses from a third to a twentieth.

## When to use it

- The data is **symmetric and unimodal**, and you want approximate tail proportions.
- You are working with **means of many observations**, where the Central Limit Theorem applies even if the raw data is skewed.
- You need a **standard scale** to compare measurements with different units, which is exactly what z-scores provide.

## Limitations

- **Most real data is not normal.** Incomes, prices, waiting times, populations and counts are skewed; forcing a bell curve onto them produces confident nonsense.
- **It is unbounded.** The model allows negative heights and negative waiting times, which cannot happen.
- **Tails are thinner than reality.** Real data produces extreme events far more often than the normal curve predicts.
- **It says nothing about the mechanism.** A bell shape is a description, not an explanation.

## Common pitfalls

- **Using the sample standard deviation where the population one belongs** (or the reverse when building z-scores), which shifts every probability slightly.
- **Assuming normality because the summary statistics look plausible.** Plot the data; check for skew and multiple peaks first.
- **Quoting z-scores for heavily skewed data** and interpreting them as proportions.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Scores on a test have mean 60 and standard deviation 8. Two students score 76 and 52. Which is more unusual, and what are their z-scores?

<p class="challenge__answer">💡 <strong>Answer:</strong> Both are two standard deviations from the mean in opposite directions: $(76-60)/8 = +2$ and $(52-60)/8 = -1$. The 76 is the more unusual one in tail terms; a score 16 points above the mean sits further into the tail than 8 points below, and the normal rule is not symmetric in *raw* distance, only in standardised distance.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does the rule give the same percentages regardless of the mean and standard deviation?
- If a dataset is not normal, can a z-score still be computed? What does it mean then?
- Why do averages of many values tend towards a bell shape even when the values themselves do not?
- What would you look for in a histogram before trusting a normal-based conclusion?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-normal">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Roughly what share of a normal distribution lies within one standard deviation of the mean?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">50%</button>
      <button class="quiz-q__opt" data-idx="1">68%</button>
      <button class="quiz-q__opt" data-idx="2">95%</button>
      <button class="quiz-q__opt" data-idx="3">99.7%</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. A value has z = −2.4. What does that mean?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">It is 2.4 units below the mean.</button>
      <button class="quiz-q__opt" data-idx="1">It is 2.4% of the mean.</button>
      <button class="quiz-q__opt" data-idx="2">It is 2.4 standard deviations below the mean.</button>
      <button class="quiz-q__opt" data-idx="3">It is the 24th percentile.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
