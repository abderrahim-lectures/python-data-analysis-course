---
title: "Adjusting for a Second Variable"
description: "Multiple regression as the cure for Simpson's paradox: what an adjusted coefficient means, and when adjusting makes things worse."
module: "inference-and-reporting"
order: 18
difficulty: "advanced"
estimatedMinutes: 35
learningObjectives:
  - "Read a multiple-regression coefficient as an effect holding other variables fixed"
  - "Show how an unadjusted comparison reverses once a grouping variable is included"
  - "Distinguish a confounder from a mediator and from a collider"
  - "Explain why adjusting for the wrong variable creates bias rather than removing it"
prerequisites: []
tags: ["multiple-regression", "confounding", "adjustment", "causal-inference"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "statistics-101"
track: "hard"
---

## What it means

**Multiple regression** fits a model with more than one predictor:

$$
\hat{y} = b_0 + b_1 x_1 + b_2 x_2 + \cdots
$$

Each coefficient is read with a clause attached: *holding the other predictors fixed*, a one-unit increase in $x_1$ is associated with $b_1$ units of change in $y$. That clause is the whole point. Including $x_2$ removes from $b_1$ whatever part of the relationship could equally be attributed to $x_2$.

This is the numerical form of the grouped analysis in the Simpson's-paradox lesson. Pooling without adjustment produces the confounded number; adjusting produces the within-group one.

## Why it adds something

It is the workhorse of applied statistics. Almost no real relationship is clean enough to read from a single-variable regression, and reporting an unadjusted coefficient is how observational data produces confident nonsense.

It also gives you a way to state *what you controlled for*, which is a far more useful sentence than "we found a correlation".

## Worked example

Admissions-style data, two programmes and two applicant strengths:

| Programme | Strong applicants | Admitted | Weak applicants | Admitted |
|---|---|---|---|---|
| A | 20 | 18 | 80 | 24 |
| B | 90 | 72 | 10 | 2 |

**Step 1 — unadjusted comparison.** Programme A: 42 admitted of 100, so 42%. Programme B: 74 of 100, so 74%. B looks far friendlier.

**Step 2 — within each strength group.** Among strong applicants, A admits 90% and B 80%. Among weak applicants, A admits 30% and B 20%. A is better in both.

**Step 3 — the mechanism.** B received far more strong applicants (90 vs 20), and strong applicants are admitted at a higher rate everywhere. B's pooled rate is high because of *who applied*, not how they were treated.

**Step 4 — adjust.** Regress admission on programme *and* applicant strength. The programme coefficient now measures the difference between applicants of equal strength: it flips sign, favouring A.

```python
import pandas as pd
import statsmodels.formula.api as smf

df = pd.DataFrame({
    'programme': ['A']*100 + ['B']*100,
    'strength':  ['strong']*20 + ['weak']*80 + ['strong']*90 + ['weak']*10,
    'admitted':  [1]*18 + [0]*2 + [1]*24 + [0]*56 + [1]*72 + [0]*18 + [1]*2 + [0]*8,
})

# Unadjusted: programme only
print(smf.logit('admitted ~ C(programme)', df).fit().params)

# Adjusted: same data, controlling for applicant strength
print(smf.logit('admitted ~ C(programme) + C(strength)', df).fit().params)
```

The programme coefficient moves from strongly positive for B to negative. Same rows, same arithmetic; only the question changed.

## Confounder, mediator, collider

- A **confounder** affects both the predictor and the outcome. Adjusting for it is the right move — applicant strength above.
- A **mediator** sits *on the path* between predictor and outcome (treatment → recovery → survival). Adjusting for it removes part of the very effect you are measuring, so it is usually wrong.
- A **collider** is caused by both (two symptoms caused by the same disease). Adjusting for it can *create* an association that does not exist.

The distinction is structural, and it cannot be read off the data. It requires knowing what causes what.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A study finds that among hospitalised patients, those who exercised more had worse outcomes. Should you conclude exercise is harmful?

<p class="challenge__answer">💡 <strong>Answer:</strong> No. Hospitalisation is a collider here: both severe illness and exercise can lead to it. Conditioning on hospital admission selects a group in which the two become associated in the opposite direction from reality. The analysis has adjusted for the wrong variable by the act of selecting the sample.</p>

</div>
</details>

## When to use it

- Comparing groups that differ in a measurable way you can control for.
- Reporting an effect that a reader would otherwise call confounded.
- Checking whether an unadjusted finding survives adjustment; if the coefficient moves a great deal, the unadjusted number was measuring something else.

## Limitations

- **It only adjusts for what you measured.** Unmeasured confounding remains, and is usually the dominant threat in observational work.
- **Adjusting for a mediator or collider adds bias** rather than removing it.
- **Collinearity** between predictors makes coefficients unstable and hard to interpret separately.
- **The functional form matters.** Fitting straight lines when the relationship bends misreports every coefficient.
- **An adjusted coefficient is still not a causal effect** unless the design justifies it.

## Common pitfalls

- **Adjusting for everything you have.** More covariates is not more rigour; each one needs a justification.
- **Reading a coefficient without its "holding others fixed" clause.**
- **Dropping a variable because it is insignificant**, which can bias the others.
- **Reporting only the adjusted model**, hiding how much the adjustment moved the answer.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

An unadjusted coefficient for a training programme is +4 points. After adjusting for prior ability it is +1. What are the two possible readings, and how would you distinguish them?

<p class="challenge__answer">💡 <strong>Answer:</strong> Either the programme's apparent benefit was mostly selection (more able people enrolled, and their ability carried the 4 points), or prior ability is a mediator the programme improves. Distinguish by asking whether prior ability was measured before the programme started. If it was prior, it is a confounder and +1 is the honest estimate; if it was measured after, it may lie on the causal path and adjusting removes real effect.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does the adjusted coefficient remove a confounder but not a mediator?
- If adjusting changes a coefficient from +4 to +1, which number would you report?
- Can two predictors be so correlated that neither coefficient is interpretable? What would you look at?
- Why can selecting the sample amount to adjusting for a variable?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-adjustment">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. How do you read a coefficient in a multiple regression?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The total effect of that variable alone.</button>
      <button class="quiz-q__opt" data-idx="1">The correlation between that variable and the outcome.</button>
      <button class="quiz-q__opt" data-idx="2">The change associated with a one-unit increase, holding the other predictors fixed.</button>
      <button class="quiz-q__opt" data-idx="3">The share of variance it explains.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Which variable should you adjust for?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Every variable in the dataset.</button>
      <button class="quiz-q__opt" data-idx="1">A measured cause of both the predictor and the outcome.</button>
      <button class="quiz-q__opt" data-idx="2">A variable measured after the treatment that the treatment caused.</button>
      <button class="quiz-q__opt" data-idx="3">Only variables that are statistically significant.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
