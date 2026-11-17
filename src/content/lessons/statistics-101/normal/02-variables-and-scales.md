---
title: "Variables and Their Scales"
description: "Categorical or numeric, and on which of the four measurement scales: the classification that decides which measures are even legal."
module: "foundations"
order: 2
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Classify a variable as categorical or numeric"
  - "Name the four measurement scales and place a variable on one"
  - "Say which measures of centre and spread are valid for each scale"
  - "Spot a numeric code that is really a category"
prerequisites: []
tags: ["variables", "measurement-scales", "nominal", "ordinal", "context"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

A **variable** is a characteristic that can take different values across cases. Before you summarise one, you need to know what kind it is, because the kind decides which arithmetic is meaningful.

The first split is **categorical versus numeric**:

- **Categorical** values name a group: colour, department, yes/no, device type. You can count them and find the most common, but "average colour" is meaningless.
- **Numeric** values are numbers on which arithmetic makes sense: time, price, count, temperature.

Numeric variables split again by **scale**, which records how much structure the numbers carry.

| Scale | Structure | Examples | Legal summaries |
|---|---|---|---|
| **Nominal** | names only, no order | colour, city, yes/no | mode, counts, proportions |
| **Ordinal** | names with a meaningful order | small/medium/large, 1–5 satisfaction, pain scale | median, mode, IQR |
| **Interval** | ordered, equal gaps, no true zero | temperature in °C, year, IQ score | mean, median, SD |
| **Ratio** | ordered, equal gaps, true zero | time, price, weight, count | everything, including ratios |

The practical rule: **the scale decides which measures are legal.** A mean of a nominal variable is a mistake. A ratio of two interval values ("today is twice as hot as yesterday") is nonsense, because 0 °C is not an absence of temperature.

## Why it adds something

Almost every "the statistics are wrong" story in the press reduces to a variable used at the wrong scale. Averaging star ratings is defensible only if you accept treating an ordinal scale as interval. Quoting "temperature rose 50%" is meaningless without a statement of units. Coding departments as 1, 2, 3 and then averaging the codes produces a number that means nothing at all.

Knowing the scale tells you which question you are even allowed to ask.

## Worked example

A support ticket dataset:

| Column | Values | Type | Scale |
|---|---|---|---|
| ticket_id | T-1001, T-1002 | categorical | nominal |
| priority | low, medium, high | categorical | **ordinal** |
| response_minutes | 3, 45, 1200 | numeric | **ratio** |
| satisfaction | 1, 2, 3, 4, 5 | numeric | **ordinal** |
| agent_id | 12, 47, 3 | numeric-looking | **nominal** |
| opened_at | 2026-03-01 | date | interval |

**Reading the table.**

- `ticket_id` is a label that happens to contain digits. Sorting it means nothing.
- `priority` has an order, so a median is meaningful, but the gaps between low and medium are not equal to the gaps between medium and high, so a mean is a stretch.
- `response_minutes` has a true zero (an instant response) and equal units, so every measure and every ratio is legal. "Twice as slow" is a real statement.
- `satisfaction` is the classic trap: the numbers 1–5 are ordered labels, not measurements. Many teams do average them, which is a convention rather than a fact — worth doing knowingly.
- `agent_id` is the sharpest trap. It is stored as a number, so software will happily compute its mean, and the answer is meaningless.
- `opened_at` is interval: the difference between two dates is meaningful, but "2026 is twice 1013" is not.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A dataset records shirt size as 1, 2, 3, 4. Is that numeric? What can you compute, and what should you not?

<p class="challenge__answer">💡 <strong>Answer:</strong> It is a numeric <em>encoding</em> of an ordinal categorical variable. The median and mode are meaningful; the mean (2.3, say) has no interpretation because the size steps are not equal. A count of how many people fell in each size is the most useful summary.</p>

</div>
</details>

## How the scale changes the analysis

The same question — "is satisfaction higher for team A?" — has different answers depending on the scale:

- on a **nominal** variable, you compare proportions ("a larger share of A's customers picked 'very satisfied'");
- on an **ordinal** variable, you compare medians or distributions, or use a rank test;
- on an **interval or ratio** variable, a mean difference and a t-test are appropriate.

Choosing the wrong one does not just change the number; it can reverse the conclusion. This is why the vocabulary lesson comes before the arithmetic.

## The same thing in Python

```python
import pandas as pd

df = pd.DataFrame({
    'priority': pd.Categorical(['low', 'high', 'medium'], categories=['low', 'medium', 'high'], ordered=True),
    'response': [3, 45, 1200],
    'agent_id': [12, 47, 3],
})

print(df['priority'].cat.ordered)      # True — an ordered categorical
print(df['response'].mean())           # legal: ratio scale
print(df['agent_id'].mean())           # runs, but meaningless — nominal
```

pandas will compute a mean for `agent_id` without warning. The type system does not protect you here; the scale does, and only if you check it.

## When to use it

Before any summary in any analysis. Labelling each column's type and scale takes a minute and prevents most of the errors in the rest of the course.

## Limitations

- **The boundaries are sometimes a judgement.** Is a 1–10 satisfaction score ordinal or interval? Arguably ordinal, routinely treated as interval. State your choice.
- **Scale can change with the question.** Age in years is ratio; age band is ordinal.
- **Real data often mixes types in one column** — a numeric column with `"n/a"` in it is both numeric and missing.
- **The classification does not tell you about the data's quality**, only what arithmetic is legal.

## Common pitfalls

- **Averaging codes.** Postcodes, department numbers and agent ids are nominal.
- **Treating an ordinal scale as interval without saying so.**
- **Computing ratios on interval data.** "Twice the IQ" and "twice the temperature" are not meaningful.
- **Calling a variable numeric because it is stored as one.** Check what the values mean, not how they are typed.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Classify each: (a) number of children, (b) birth order (1st, 2nd, 3rd), (c) height in cm, (d) blood type, (e) exam grade A–F, (f) calendar year.

<p class="challenge__answer">💡 <strong>Answer:</strong> (a) ratio — a true zero and equal steps. (b) ordinal — the order matters, the gap between 1st and 2nd is not the same as 2nd to 3rd. (c) ratio. (d) nominal. (e) ordinal. (f) interval — differences are meaningful, ratios are not.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why can you take a median of an ordinal variable but not a mean?
- Why is 0 °C not "no temperature" while 0 kg is "no mass"?
- What breaks if you average a 1–5 satisfaction score, and is it worth doing anyway?
- Can a variable be categorical and numeric at the same time?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-variables">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Which scale has a meaningful order but unequal gaps?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nominal</button>
      <button class="quiz-q__opt" data-idx="1">interval</button>
      <button class="quiz-q__opt" data-idx="2">ordinal</button>
      <button class="quiz-q__opt" data-idx="3">ratio</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Why is a mean temperature in °C problematic as a ratio statement ("twice as hot")?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Temperatures are always ordinal.</button>
      <button class="quiz-q__opt" data-idx="1">Celsius is an interval scale with no true zero, so ratios are not meaningful.</button>
      <button class="quiz-q__opt" data-idx="2">The numbers are too small.</button>
      <button class="quiz-q__opt" data-idx="3">Temperature cannot be averaged.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
