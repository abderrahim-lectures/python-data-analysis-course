---
title: "Standard Error"
description: "How much a sample mean would wobble if you repeated the study: the standard deviation divided by the square root of n."
module: "samples-and-uncertainty"
order: 11
difficulty: "intermediate"
estimatedMinutes: 20
learningObjectives:
  - "Distinguish the standard deviation of the data from the standard error of the mean"
  - "Compute a standard error by hand from a sample"
  - "Explain why quadrupling n only halves the error"
  - "See the sampling distribution of the mean in an experiment you can run yourself"
prerequisites: []
tags: ["standard-error", "sampling-distribution", "uncertainty", "central-limit"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

The **standard deviation** describes how spread out the *data* is. The **standard error** describes how spread out *the mean itself* would be if you repeated the study many times.

$$
\text{SE} = \frac{s}{\sqrt{n}}
$$

where $s$ is the sample standard deviation and $n$ is the sample size.

They answer different questions. If a class of 30 students has a standard deviation of 12 points on a test, students vary by about 12 points. If you repeated the class with 30 new students, the class *average* would vary by only $12/\sqrt{30} \approx 2.2$ points. The first number is about people; the second is about your estimate.

## Why it adds something

Any single mean you compute is one draw from a distribution of possible means. The standard error is the width of that distribution, so it tells you how much to trust the number you are about to report.

It is also the ingredient of nearly every interval in applied statistics: a 95% confidence interval for a mean is roughly $\bar{x} \pm 2\,\text{SE}$, and the t-test is a ratio of a difference to a standard error. Understanding this one quantity demystifies most of the formulas you meet later.

## Worked by hand

A sample of $n = 25$ delivery times has a mean of 18 minutes and a sample standard deviation of 15.3 minutes.

**Step 1 — the square root of n.**

$$
\sqrt{25} = 5
$$

**Step 2 — divide.**

$$
\text{SE} = \frac{15.3}{5} = 3.06 \text{ minutes}
$$

**Step 3 — read it.** Individual deliveries vary by about 15 minutes, but the *average* of 25 of them is only uncertain by about 3 minutes. If the study were repeated with a new set of 25 deliveries, the new mean would typically land within about 3 minutes of 18.

## Why the square root

The square root is the most important part of the formula, because it sets how fast extra data buys precision. To halve the error you must **quadruple** the sample:

| $n$ | SE for $s = 15.3$ |
|---|---|
| 25 | 3.06 |
| 100 | 1.53 |
| 400 | 0.77 |
| 2500 | 0.31 |

Ten times the data gives about three times the precision. This is why surveys stop at around a thousand respondents: beyond that the curve is flat, and the remaining error is dominated by bias rather than sampling.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A poll of 400 people estimates support at 52% with a standard error of 2.5 percentage points. A rival polls 1,600 people. What is their standard error, and does it change the likely conclusion much?

<p class="challenge__answer">💡 <strong>Answer:</strong> Quadrupling $n$ halves the error: about 1.25 points. The estimate is much sharper, but if both polls found 52%, the conclusion is the same — the extra precision does not move the centre, so it only narrows the interval around it.</p>

</div>
</details>

## The same thing in Python

```python
import statistics as st

times = [8, 10, 12, 15, 45]
n = len(times)
s = st.stdev(times)
se = s / (n ** 0.5)
print(round(s, 2), round(se, 2))    # 15.31 6.85
```

And the experiment that makes the concept concrete: draw many samples from the same population and measure how much the sample means vary. That spread should match the standard error.

```python
import random, statistics as st

population = [random.gauss(50, 10) for _ in range(10_000)]
means = [st.mean(random.sample(population, 25)) for _ in range(2000)]

print(round(st.pstdev(means), 2))                                  # ≈ 2.0
print(round(st.pstdev(population) / 25 ** 0.5, 2))                 # ≈ 2.0
```

The two numbers agreeing is the whole lesson, and it is worth running once with your own eyes.

## Seeing it geometrically

The sampling distribution is a bell curve drawn around your estimate, and the standard error is its half-width. Narrow it by increasing $n$ in the [GeoGebra sampling-distribution demo](https://www.geogebra.org/m/tqjfjzpt) and watch the curve tighten as the square root of the sample size.

## When to use it

- Reporting **how precise** an estimate is, as a number or a confidence interval.
- Comparing a difference to its **noise floor**, which is what later significance tests do.
- Planning a study: solve $\text{SE} = s/\sqrt{n}$ for the $n$ that gives an acceptable error.

## Limitations

- **It measures sampling error only.** If the sample is biased, a small standard error just makes the wrong answer more precise.
- **It assumes independent observations.** Repeated measurements on the same person are not independent, and the simple formula understates the error.
- **Small samples need the t distribution**, not the normal 2.0 multiplier.
- **It says nothing about the data itself.** A standard error of 1 does not mean individual values are close to the mean.

## Common pitfalls

- **Confusing it with the standard deviation.** The most common mix-up in all of statistics: "the error bars are tiny" often describes the standard error of a mean, not the spread of the cases.
- **Dividing by n instead of √n.** The error falls much more slowly than people expect.
- **Reporting the SE as a ± range around every value.** It is a range for the mean, not the data.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Two studies estimate the same mean. Study A has $n = 100$ and $s = 20$; study B has $n = 100$ and $s = 5$. Which estimate is more precise, and by how much?

<p class="challenge__answer">💡 <strong>Answer:</strong> A: SE $= 20/10 = 2$. B: SE $= 5/10 = 0.5$. B is four times more precise even though both used 100 observations — precision depends on the data's own variability as well as the sample size. This is why controlling measurement noise beats simply collecting more.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does the standard error shrink while the standard deviation stays roughly the same as $n$ grows?
- If the standard error is small, is the mean accurate? What else must be true?
- Why is the square root in the denominator rather than the count itself?
- What would a standard error of zero mean, and what would make it suspicious?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-standard-error">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. What does the standard error of the mean measure?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">How spread out individual values are.</button>
      <button class="quiz-q__opt" data-idx="1">How large the sample is.</button>
      <button class="quiz-q__opt" data-idx="2">How much the sample mean would vary between repeated studies.</button>
      <button class="quiz-q__opt" data-idx="3">The average distance from the median.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. A sample of 36 has a standard deviation of 12. What is the standard error?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0.33</button>
      <button class="quiz-q__opt" data-idx="1">2.0</button>
      <button class="quiz-q__opt" data-idx="2">6.0</button>
      <button class="quiz-q__opt" data-idx="3">12.0</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
