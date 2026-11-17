---
title: "Hypothesis Testing"
description: "The null hypothesis, the p-value, and the four decisions that follow: what a test establishes and what it never does."
module: "samples-and-uncertainty"
order: 14
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "State a null and an alternative hypothesis for a concrete comparison"
  - "Compute a t statistic by hand from two group means and their errors"
  - "Interpret a p-value correctly, including the three common misreadings"
  - "Explain the difference between statistical and practical significance"
prerequisites: []
tags: ["hypothesis-testing", "p-value", "t-test", "significance"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

A **hypothesis test** asks how surprising the data would be if there were no effect. You state two hypotheses:

- $H_0$, the **null**: there is no difference, the effect is zero;
- $H_1$, the **alternative**: there is a difference, in a direction you state in advance.

Then you compute a statistic measuring how far the observed data sits from what $H_0$ predicts, convert it to a **p-value** — the probability of data at least this extreme *if $H_0$ were true* — and compare it to a threshold you set beforehand, conventionally 0.05.

For comparing two means, the statistic is a ratio:

$$
t = \frac{\bar{x}_1 - \bar{x}_2}{\text{SE of the difference}} .
$$

The numerator is the effect you observed. The denominator is how much that difference would wobble under $H_0$. A large ratio means the effect is large relative to the noise.

## Why it adds something

It gives a disciplined answer to "could this just be chance?" — the question every comparison raises. It forces the direction and the threshold to be decided before seeing the data, which is what protects against the human talent for finding a story in noise.

It is also where a great deal of published statistical error lives, so knowing it is defensive as much as constructive.

## Worked by hand

Two groups of deliveries, one with a new routing system:

- Current route: $n_1 = 30$, mean 18.0 min, standard deviation 6.0.
- New route: $n_2 = 30$, mean 15.0 min, standard deviation 5.0.

**Step 1 — the hypotheses.** $H_0$: the means are equal. $H_1$: the new route is faster.

**Step 2 — standard errors.**

$$
\text{SE}_1 = \frac{6.0}{\sqrt{30}} \approx 1.10, \qquad \text{SE}_2 = \frac{5.0}{\sqrt{30}} \approx 0.91
$$

**Step 3 — the standard error of the difference.** For independent groups the variances add:

$$
\text{SE}_{\text{diff}} = \sqrt{1.10^2 + 0.91^2} \approx \sqrt{1.21 + 0.83} \approx 1.43
$$

**Step 4 — the statistic.**

$$
t = \frac{18.0 - 15.0}{1.43} \approx 2.10
$$

**Step 5 — the p-value.** With roughly 58 degrees of freedom, a $t$ of 2.10 is exceeded in one tail with probability about 0.020. Since $H_1$ says "faster", the one-tailed p-value is about 0.02; two-tailed it is about 0.04. Either way it is below 0.05.

**Step 6 — the decision, stated honestly.** "The new route is associated with a 3-minute shorter mean delivery time, $t \approx 2.10$, $p \approx 0.04$. The confidence interval for the difference is roughly 0.1 to 5.9 minutes." Note how much more the interval says than the verdict: the effect could be trivial or substantial.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

The same 3-minute difference is found with $n = 300$ per group. What happens to the p-value, and does the finding become more important?

<p class="challenge__answer">💡 <strong>Answer:</strong> The standard errors shrink by a factor of about 3.2, so $t$ rises to roughly 6.7 and the p-value becomes tiny. The <em>effect</em> is unchanged at 3 minutes — the finding is more certain, not larger. This is the difference between statistical significance (evidence that an effect exists) and practical significance (whether it is worth acting on).</p>

</div>
</details>

## What a p-value is not

- **Not the probability that $H_0$ is true.** It is computed *assuming* $H_0$ is true.
- **Not the probability you are wrong.** It is a statement about data, not about your conclusion.
- **Not a measure of effect size.** A tiny effect with a huge sample yields a tiny p-value.
- **Not a licence to fish.** Testing many hypotheses and reporting the smallest p-value guarantees false positives; with 20 tests at 0.05 you expect one spurious "significant" result.

## The same thing in Python

```python
from scipy import stats

current = [17, 18, 19, 18, 16, 20]        # illustrative samples
new     = [14, 15, 16, 15, 13, 17]

res = stats.ttest_ind(new, current, alternative='less')
print(round(res.statistic, 2), round(res.pvalue, 4))
```

Always print the effect and its interval alongside the test:

```python
import statistics as st

diff = st.mean(current) - st.mean(new)
se = (st.stdev(current)**2 / len(current) + st.stdev(new)**2 / len(new)) ** 0.5
print(round(diff, 2), round(diff - 2*se, 2), round(diff + 2*se, 2))
```

## Seeing it geometrically

The t statistic is the distance between two sampling distributions measured in their own spread. In the [GeoGebra t-test explorer](https://www.geogebra.org/m/qzxjhqde) you can slide the group means apart or enlarge the samples and watch the overlap shrink — the same picture as the p-value falling.

## When to use it

- A pre-specified comparison between two groups or against a benchmark.
- Checking whether an observed difference is larger than what sampling noise would produce.
- As one input to a decision that also weighs cost, effect size and context.

## Limitations

- **It answers a narrow question** — "is the effect zero?" — and says nothing about size or importance.
- **Assumptions matter.** Independence, and roughly normal data or large samples; violating them invalidates the p-value.
- **Multiple comparisons inflate false positives** unless corrected.
- **It rewards large samples with significance** for effects nobody cares about.
- **It cannot rescue a biased design.** A test on a biased sample gives a precise answer to the wrong question.

## Common pitfalls

- **Choosing the hypothesis after seeing the data**, which quietly converts an exploratory finding into a spurious confirmation.
- **Reporting p < 0.05 as "proven"**; it is evidence against a null model, not proof of a mechanism.
- **Hiding the effect size.** A p-value without a mean difference and an interval is uninterpretable.
- **Confusing one- and two-tailed tests**, which changes the threshold without changing the data.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A study reports "p = 0.049, significant" and another "p = 0.051, not significant" for the same effect size and sample size. Is one finding real and the other not?

<p class="challenge__answer">💡 <strong>Answer:</strong> No. The two p-values are essentially the same number, and the 0.05 line is a convention, not a fact about the world. Treating them as opposite conclusions is the "difference between significant and not significant is not itself significant" error. Report both with their intervals and let the reader see how similar the evidence is.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why must the hypothesis be stated before looking at the data?
- If a test is not significant, have you shown there is no effect?
- What does a 95% confidence interval add that a p-value does not?
- Why does testing twenty hypotheses guarantee roughly one false positive at the 0.05 level?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-hypothesis">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does a p-value of 0.03 mean?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">There is a 3% chance the null hypothesis is true.</button>
      <button class="quiz-q__opt" data-idx="1">If the null were true, data at least this extreme would occur about 3% of the time.</button>
      <button class="quiz-q__opt" data-idx="2">The effect is 3% large.</button>
      <button class="quiz-q__opt" data-idx="3">There is a 97% chance the result replicates.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. A difference is statistically significant with a huge sample. What else must you check?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Nothing; significance settles it.</button>
      <button class="quiz-q__opt" data-idx="1">Whether the p-value is below 0.01 instead of 0.05.</button>
      <button class="quiz-q__opt" data-idx="2">The size of the effect and whether it matters in practice.</button>
      <button class="quiz-q__opt" data-idx="3">Whether the mean or the median is larger.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
