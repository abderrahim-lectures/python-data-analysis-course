---
title: "Reading a Dataset Honestly"
description: "A workflow that catches the errors the earlier lessons describe: look first, group second, summarise third."
module: "samples-and-uncertainty"
order: 15
difficulty: "intermediate"
estimatedMinutes: 22
learningObjectives:
  - "Run a fixed sequence of checks on an unfamiliar dataset"
  - "Compare mean and median and use the gap diagnostically"
  - "Detect suspicious values with fences and inspect them before removing anything"
  - "Report a summary that states its own limitations"
prerequisites: []
tags: ["workflow", "data-quality", "outliers", "reporting"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

This lesson is a checklist rather than a new quantity. Every measure in this course is easy to compute and easy to misuse, and the misuse is almost always a skipped step rather than a wrong formula.

The sequence that prevents most of it:

1. **Look at the data** before summarising it: counts, missing values, types, and a histogram.
2. **Compute the centre two ways** and compare them; a large gap is information about the shape.
3. **Measure spread two ways** and compare them; the same gap shows up.
4. **Flag suspicious values** and inspect each one rather than deleting it.
5. **Group before pooling** when the data arrived in batches or categories.
6. **Report the summary with its uncertainty and its limitations.**

## Why it adds something

An analysis that skips step 1 is a calculation, not an analysis. The checklist turns the individual lessons into a habit, and the habit is what catches Simpson's paradox, an outlier that was a typo, and a mean that describes nobody.

## Worked example

A dataset of 12 support tickets, resolution times in hours:

$$
1,\;2,\;2,\;3,\;3,\;4,\;5,\;6,\;8,\;12,\;20,\;96
$$

**Step 1 — look.** Twelve values, all numeric, no obvious missing entries. The maximum is far from everything else.

**Step 2 — centre two ways.** Mean: total 162, so 13.5. Median: $(4+5)/2 = 4.5$. A gap of 9 hours: the data has a long right tail.

**Step 3 — spread two ways.** Standard deviation about 27.6; IQR: $Q_1 = 2.75$, $Q_3 = 11$, so 8.25. The standard deviation is more than three times the IQR, which is another way of saying the tail dominates it.

**Step 4 — flag and inspect.** Upper fence: $11 + 1.5(8.25) \approx 23.4$. The 96 is flagged. Inspect it: if it is a ticket that was reopened after a month, it may be a genuine case but belongs to a different process; if it is a data-entry error (96 minutes recorded as hours), fix it. Do not silently delete it.

**Step 5 — group.** Are these tickets from one team, or several? A mix of easy and hard queues would produce exactly this shape.

**Step 6 — report.** Something like: "Median resolution time was 4.5 hours (IQR 2.75–11). The mean, 13.5 hours, is pulled up by one 96-hour ticket; it does not describe a typical ticket. Excluding that case, the median is unchanged and the mean falls to 6.0."

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A colleague reports "average response time 13.5 hours" for these tickets. What single additional number would you ask for first, and why?

<p class="challenge__answer">💡 <strong>Answer:</strong> The median. It is 4.5 hours here against a mean of 13.5, and that gap tells the reader more about the dataset than the mean does on its own. Whether the 96-hour case is real is the second question.</p>

</div>
</details>

## The same thing in Python

```python
from statistics import mean, median, stdev, quantiles

hours = [1, 2, 2, 3, 3, 4, 5, 6, 8, 12, 20, 96]

q1, _, q3 = quantiles(hours, n=4)
iqr = q3 - q1
print('n', len(hours))
print('mean', round(mean(hours), 2), 'median', median(hours))
print('sd', round(stdev(hours), 2), 'iqr', iqr)
print('fences', round(q1 - 1.5*iqr, 2), round(q3 + 1.5*iqr, 2))
print('flagged', [h for h in hours if h < q1 - 1.5*iqr or h > q3 + 1.5*iqr])
```

pandas gives the same summary in one call and makes the missing-values check trivial:

```python
import pandas as pd

s = pd.Series(hours)
print(s.describe())
print(s.isna().sum())
```

## A reporting template

The shape of a summary that survives review:

- **what was measured**, with units and sample size;
- **centre**, giving the median first when the data is skewed;
- **spread**, choosing the IQR or the standard deviation to match the centre;
- **what was excluded and why**, never a silent deletion;
- **what it cannot tell you**, in one sentence.

## When to use it

Every time. The checklist is most valuable on data you did not collect, which is most data.

## Limitations

- **The checklist does not replace domain knowledge.** Whether a 96-hour ticket is plausible depends on what a ticket is.
- **It catches one-variable problems best.** Relationships need a scatter plot, and grouping needs enough data per group to be meaningful.
- **It is a starting point, not a full analysis.** Questions about change over time, or about a specific causal claim, need their own designs.

## Common pitfalls

- **Deleting outliers before inspecting.** Often the most informative cases, and the deletion biases every number that follows.
- **Reporting only the mean**, which hides the shape entirely.
- **Pooling groups** before checking whether the groups differ.
- **Reporting two decimal places** on a measurement recorded to the nearest hour.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Design the three-line summary you would send to a manager who has never heard of a median, using the support-ticket data, without using any statistical jargon.

<p class="challenge__answer">💡 <strong>Answer:</strong> "Half the tickets closed within 4.5 hours, and half took longer. A typical ticket sits between about 3 and 11 hours. One ticket took 96 hours, which is what drags the average up to 13.5; that case is worth checking before we quote the average to customers." No jargon, and every number carries its meaning.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why is comparing the mean and median a cheap diagnostic for the shape of the data?
- When is the standard deviation a better companion to the mean than the IQR?
- What is the difference between an error and an outlier?
- If you must report a single number for a skewed dataset, which would you choose, and what would you add to it?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-reading-data">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. The mean is 40 and the median is 25. What does the gap suggest?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">A calculation error.</button>
      <button class="quiz-q__opt" data-idx="1">The data is symmetric.</button>
      <button class="quiz-q__opt" data-idx="2">A right-skewed distribution with large values pulling the mean up.</button>
      <button class="quiz-q__opt" data-idx="3">The sample is too small.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. You find a value above the 1.5 × IQR fence. What should you do first?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Delete it and recompute.</button>
      <button class="quiz-q__opt" data-idx="1">Inspect it to decide whether it is an error, a different process, or a genuine extreme case.</button>
      <button class="quiz-q__opt" data-idx="2">Replace it with the mean.</button>
      <button class="quiz-q__opt" data-idx="3">Report only the mean, ignoring it.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
