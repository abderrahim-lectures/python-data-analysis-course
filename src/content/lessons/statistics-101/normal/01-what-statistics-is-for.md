---
title: "What Statistics Is For"
description: "Statistics as a discipline for answering questions with uncertain data: the vocabulary, the two families, and the questions it cannot answer."
module: "foundations"
order: 1
difficulty: "beginner"
estimatedMinutes: 16
learningObjectives:
  - "State what statistics is for in one sentence"
  - "Distinguish descriptive from inferential statistics with an example of each"
  - "Name the six words every later lesson assumes: population, sample, parameter, statistic, variable, observation"
  - "Recognise a question that statistics cannot answer"
prerequisites: []
tags: ["vocabulary", "definitions", "descriptive", "inferential"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

**Statistics** is the discipline of answering questions using data that is incomplete and uncertain.

That sentence has three parts worth separating, because each one is where a different kind of mistake happens.

- **Answering questions.** If there is no question, there is no statistics — just arithmetic. "What is the mean of these numbers?" is arithmetic. "Is the new routing system faster *in general*?" is a statistical question, because you only ever see some deliveries.
- **Using data.** The answer has to come from observations rather than from opinion or authority.
- **Incomplete and uncertain.** You never see everything. A sample, a month out of a year, thirty parts out of a million. Every conclusion therefore carries a caveat about how much it could be wrong.

Statistics has two families:

| | Descriptive | Inferential |
|---|---|---|
| Question | What does *this* data look like? | What does this data say about the wider world? |
| Tools | mean, median, spread, plots | standard error, confidence intervals, tests |
| Risk | Summarising badly | Generalising wrongly |

The first half of this course is descriptive; the second half is inferential. Neither is harder, but they answer different questions and the second always rests on the first.

## Why it adds something

Without statistics you are left with anecdotes. "Our last customer was happy" and "most of our customers are happy" are different claims, and only the second one can support a decision. Statistics is the machinery that turns a pile of observations into a claim you can defend, and — just as importantly — tells you when the pile is too small or too unrepresentative to defend anything.

## The six words everything else uses

Learn these now; every later lesson uses them without definition.

- **Population** — the entire set of things you want to talk about. All deliveries this year. All adults in the country. Every part the factory will ever make.
- **Sample** — the subset you actually observed. The 25 deliveries you timed. The 400 people you surveyed.
- **Parameter** — a number describing the **population**. The true mean delivery time. Usually unknown, and the thing you are trying to estimate.
- **Statistic** — a number describing the **sample**. The mean of your 25 deliveries. Known, but it wobbles.
- **Variable** — a characteristic that can differ between cases. Delivery time, satisfaction rating, whether a package was damaged.
- **Observation** (or case, or row) — one thing measured. One delivery, one person, one part.

The parameter/statistic pair is the one that matters most. A parameter is fixed and unknown; a statistic is known and variable. Every inferential method in this course is a way of going from the second to the first.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A university surveys 500 of its 20,000 students and finds 62% would use a new late-night library. Identify the population, the sample, the parameter and the statistic.

<p class="challenge__answer">💡 <strong>Answer:</strong> Population: all 20,000 students. Sample: the 500 surveyed. Parameter: the true share of all 20,000 who would use it — unknown. Statistic: 62%, the share in the sample — known, and only an estimate of the parameter. The gap between them is the entire subject of inferential statistics.</p>

</div>
</details>

## Descriptive and inferential in one picture

You measure 25 deliveries and compute a mean of 18 minutes. That is describing your data.

Then you ask whether the mean of *all* deliveries is probably near 18, and you attach a range to it. That is inferring.

The second step is only legitimate if the sample was drawn without bias. A perfect interval around a biased sample describes a population you will never meet. This is why the design of the data collection matters more than the sophistication of the analysis.

## What statistics cannot do

- **It cannot turn a bad question into a good one.** "Is our product good?" has no measurable answer until "good" is defined as a variable.
- **It cannot fix a biased sample.** Resampling bias reproduces it precisely.
- **It cannot establish causation from observational data alone**, however strong the association or the software's output.
- **It cannot invent information that was never recorded.** A missing variable stays missing; no method recovers it.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Which of these are statistical questions? (a) What is the average height in this room? (b) Are people in this city taller than people in that city? (c) What is 7 × 6? (d) Should we raise the price?

<p class="challenge__answer">💡 <strong>Answer:</strong> (a) is descriptive: it is arithmetic on a complete set. (b) is inferential: each city's people are populations you sample, and the comparison needs uncertainty. (c) is arithmetic. (d) is a decision, not a statistical question — data can inform it (price elasticity), but the question itself is about goals, not about numbers.</p>

</div>
</details>

## The same thing in Python

The distinction shows up in the code you write. Describing a sample is one line:

```python
deliveries = [8, 12, 10, 15, 45]
mean = sum(deliveries) / len(deliveries)
print(mean)            # 18.0 — a statistic about the sample
```

Saying something about the population takes more: a standard error, an interval, and an assumption about how the sample was drawn. That is the subject of modules 4 and beyond.

## When to use it

This vocabulary is for every conversation about data. When someone says "the average user", ask: average of which sample, standing in for which population?

## Limitations

- **The definitions are precise and the world is not.** Deciding what counts as the population is a judgement, and a different judgement gives a different answer.
- **The descriptive/inferential split is not a quality ranking.** A careful description of a complete dataset is more valuable than a sloppy inference.
- **The vocabulary does not tell you how to design a study.** That belongs to the domain and to experimental design.

## Common pitfalls

- **Saying "population" when you mean "sample"**, which makes every uncertainty statement wrong afterwards.
- **Treating a convenience sample as if it were random.** Whoever answered is rarely whoever you wanted.
- **Reporting a statistic and calling it a parameter.** "The average is 18" is a claim about your sample; the population mean is unknown.
- **Skipping the question.** "Let's analyse the data" without a question produces charts nobody asked for.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A hospital reports "our median waiting time is 4 weeks". Someone repeats this as "the median waiting time in the country is 4 weeks". What went wrong, in the vocabulary of this lesson?

<p class="challenge__answer">💡 <strong>Answer:</strong> A statistic about one hospital's sample was reported as a parameter of the national population. That is a generalisation with no sampling basis: the hospital's patients are not a random sample of the country, so the statistic estimates only that hospital's population — and not even that, if the hospital serves a particular region or condition.</p>

</div>
</details>

## 🤔 Socratic Questions

- If you could measure the whole population, would you still need statistics?
- Why is the sample mean "known but variable" while the population mean is "fixed but unknown"?
- What kind of question have you seen reported with statistics that would have been better answered without them?
- Why does the quality of the sample matter more than the complexity of the method?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-what-is-stats">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What distinguishes inferential from descriptive statistics?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Inferential uses harder arithmetic.</button>
      <button class="quiz-q__opt" data-idx="1">Inferential generalises from a sample to a population, with stated uncertainty.</button>
      <button class="quiz-q__opt" data-idx="2">Descriptive uses graphs and inferential does not.</button>
      <button class="quiz-q__opt" data-idx="3">Inferential only applies to medical data.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. A number computed from your sample is called a…</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">parameter</button>
      <button class="quiz-q__opt" data-idx="1">population</button>
      <button class="quiz-q__opt" data-idx="2">statistic</button>
      <button class="quiz-q__opt" data-idx="3">variable</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
