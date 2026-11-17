---
title: "Simpson's Paradox"
description: "How a trend that holds in every group can reverse when the groups are pooled, and how to spot it before it embarrasses you."
module: "samples-and-uncertainty"
order: 13
difficulty: "intermediate"
estimatedMinutes: 18
learningObjectives:
  - "Recognise a grouped dataset whose pooled trend contradicts every group's trend"
  - "Explain how unequal group sizes create the reversal"
  - "Check for the paradox by plotting groups separately before pooling"
  - "Say which summary is the honest one to report"
prerequisites: []
tags: ["simpsons-paradox", "confounding", "grouping", "aggregation"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

**Simpson's paradox** is the reversal of a trend that appears when groups are combined. A treatment can look better than a control in every subgroup, and worse when the subgroups are pooled. Nothing is miscalculated; the pooled number is real, and it answers a different question than the grouped ones.

It happens when the groups differ in size *and* in their baseline level. The larger group drags the pooled average towards its own corner, and if it also happens to receive one treatment more often, the treatment inherits the group's disadvantage.

## Why it adds something

It is the clearest example of a summary that is arithmetically correct and substantively wrong. Every analyst aggregates; the paradox is the reason to look at groups before trusting a pooled figure. Recognising it turns a confusing disagreement between two reports into a structural explanation.

## Worked by hand

Two hospitals, two severity groups, recovery rates:

| Hospital | Mild cases | Recovery | Severe cases | Recovery |
|---|---|---|---|---|
| A | 90 | 81 (90%) | 10 | 6 (60%) |
| B | 10 | 8 (80%) | 90 | 45 (50%) |

**Step 1 — compare within each severity.** Hospital A recovers 90% of mild cases against B's 80%, and 60% of severe cases against B's 50%. A wins in both groups.

**Step 2 — pool the totals.** Hospital A: $81 + 6 = 87$ recoveries out of 100, so 87%. Hospital B: $8 + 45 = 53$ out of 100, so 53%.

**Step 3 — check the arithmetic.** A wins overall as well — so this table is *not* the paradox, it is the ordinary case. To see the reversal, give B the larger mild group:

| Hospital | Mild cases | Recovery | Severe cases | Recovery |
|---|---|---|---|---|
| A | 20 | 18 (90%) | 80 | 48 (60%) |
| B | 90 | 72 (80%) | 10 | 5 (50%) |

Now A recovers 90% of mild against B's 80%, and 60% of severe against B's 50% — A still wins both groups. Pooled: A has $18+48 = 66$ of 100, i.e. 66%; B has $72+5 = 77$ of 100, i.e. 77%. **B wins overall while losing in every subgroup.**

**Step 4 — say why.** A treats mostly severe cases, which have a low recovery rate regardless of hospital. B treats mostly mild cases, which have a high rate. The pooled figure measures *who each hospital treats* as much as *how well it treats them*.

## Seeing it geometrically

Plot each group as a point with $x$ = group size and $y$ = recovery rate. The pooled average is a weighted mean, and its position depends on where the weights sit. In the [GeoGebra Simpson's paradox explorer](https://www.geogebra.org/m/dqzxhqzy) you can drag group sizes and watch the pooled point cross over the individual lines.

## The same thing in Python

```python
a = {'mild': (20, 18), 'severe': (80, 48)}
b = {'mild': (90, 72), 'severe': (10, 5)}

for name, g in [('A', a), ('B', b)]:
    for sev, (n, rec) in g.items():
        print(name, sev, f"{rec/n:.0%}")
    total_n = sum(n for n, _ in g.values())
    total_r = sum(r for _, r in g.values())
    print(name, 'pooled', f"{total_r/total_n:.0%}")
```

The grouped percentages favour A in both rows and the pooled percentage favours B. Reading that output is the whole exercise; the code adds nothing except speed.

## When to look for it

- Any comparison where groups are **unequal in size** and differ in baseline risk.
- Reporting a **pooled rate** from data that arrived in batches, sites, weeks or cohorts.
- A result that contradicts a domain expert's expectation — paradox is one of the first things to rule out.

## Limitations

- **It is not an error to be "corrected".** The pooled average is a legitimate number for the pooled population; the question is which population you mean.
- **The grouped analysis can be the wrong one** if you condition on a variable that is a consequence of the treatment rather than a pre-existing characteristic.
- **It needs a clear grouping variable.** If you do not know the groups, you cannot adjust for them.

## Common pitfalls

- **Reporting the pooled figure without the groups**, which hides the reversal entirely.
- **Adjusting for the wrong variable**, which can create a paradox rather than remove one.
- **Assuming small samples are immune.** The paradox is arithmetic; size does not prevent it.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A company's overall conversion rate fell after a redesign, but conversion rose in both mobile and desktop separately. What is the most likely explanation?

<p class="challenge__answer">💡 <strong>Answer:</strong> The traffic mix changed. If mobile (with a lower conversion rate) grew as a share of visits while desktop stayed flat, the pooled rate falls even though each platform improved. Segment by device and report the two rates with their volumes; the pooled number is measuring mix, not the redesign.</p>

</div>
</details>

## 🤔 Socratic Questions

- Can Simpson's paradox appear with continuous variables, not just counts?
- Which is the "true" answer, the pooled rate or the group rates?
- If you did not know the groups existed, what would the pooled figure lead you to conclude?
- Does randomising who receives each treatment prevent the paradox?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-simpson">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Simpson's paradox describes a situation where…</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">the arithmetic in a table is wrong.</button>
      <button class="quiz-q__opt" data-idx="1">the sample is too small to conclude anything.</button>
      <button class="quiz-q__opt" data-idx="2">a trend in every group reverses when the groups are pooled.</button>
      <button class="quiz-q__opt" data-idx="3">two variables correlate without a causal link.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. What usually causes the reversal?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Rounding in the percentages.</button>
      <button class="quiz-q__opt" data-idx="1">Unequal group sizes, with the groups also differing in baseline level.</button>
      <button class="quiz-q__opt" data-idx="2">Using the median instead of the mean.</button>
      <button class="quiz-q__opt" data-idx="3">Outliers inside each group.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
