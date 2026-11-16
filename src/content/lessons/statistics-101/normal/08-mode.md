---
title: "The Mode"
description: "The most frequent value: the only measure of centre that works for labels, and the one that can be absent."
module: "relationships"
order: 8
difficulty: "beginner"
estimatedMinutes: 14
learningObjectives:
  - "Find the mode of a list of numbers and of a list of categories"
  - "Recognise data with no mode or with several modes"
  - "Explain when the mode is the only valid measure of centre"
  - "Describe what a bimodal distribution suggests about the data"
prerequisites: []
tags: ["mode", "categorical", "frequency", "bimodal"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

The **mode** is the value that occurs most often. Unlike the mean and median it needs no arithmetic at all — only counting — which means it is the one measure of centre that works on names, colours and categories.

$$
\text{mode} = \text{the value with the highest frequency.}
$$

A list can have no mode (every value appears once) or several modes (two or more values tie for most frequent). Both are normal, and neither is an error.

## Why it adds something

Ask "what is the average colour of a car?" and the mean is meaningless while the median is undefined. The mode answers it: white, because white sells most.

The mode also tells you something the mean and median cannot: where the *bulk* of the data is. If a distribution has two peaks, the mean lands between them, in a valley where almost no data sits. The mode points at the peaks instead, and two modes are a strong hint that your dataset is really two groups glued together.

## Worked by hand

Shoe sizes sold in a shop on one day:

$$
38,\;39,\;39,\;40,\;40,\;40,\;41,\;42,\;42
$$

Count each value: 38 once, 39 twice, 40 three times, 41 once, 42 twice. The mode is 40, the size the shop should keep most of in stock.

Now a second shop's day:

$$
38,\;39,\;40,\;41,\;42
$$

Every value appears once. There is **no mode** — and that is a useful finding: no size dominates, so stock evenly rather than stocking up on one size.

## Bimodal data

Wait times at two clinics, pooled into one list:

$$
5,\;6,\;6,\;7,\;8,\;30,\;31,\;31,\;32,\;33
$$

There are two clusters, one around 6 minutes and one around 31. The list is **bimodal**. The mean is about 18.9, a wait nobody actually experienced; the median is about 19.5, also unrepresentative. The modes (6 and 31) are the only summaries that match what is happening.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A pooled clinic list shows two clusters. What would you do before reporting any single number for it?

<p class="challenge__answer">💡 <strong>Answer:</strong> Split the data into the two groups and describe each separately — probably two different clinics, two shifts, or two patient types. A single average across a bimodal dataset describes a group that does not exist, and reporting the modes alone hides the size of the two groups.</p>

</div>
</details>

## The same thing in Python

```python
sizes = [38, 39, 39, 40, 40, 40, 41, 42, 42]

from collections import Counter
counts = Counter(sizes)
print(counts.most_common(1))       # [(40, 3)]

from statistics import multimode
print(multimode([38, 39, 40, 41, 42]))   # [] — no mode at all
print(multimode([1, 1, 2, 2, 3]))        # [1, 2] — two modes
```

`Counter` is the honest way to see the shape before you summarise it; `multimode` returns every tied value rather than silently picking one.

## When to use it

- **Categorical data**: colours, brands, departments, device types — anything with no order and no arithmetic.
- **Discrete data with a dominant value**: the most common shoe size, the most frequent error code.
- **Finding subgroups** before summarising: two modes are a flag to split the data.

## Limitations

- **It can be absent** (nothing repeats) or ambiguous (many ties), which makes it useless as a single summary in those cases.
- **It ignores everything except the peak.** A tiny change in one value can create or destroy a tie.
- **For continuous data it is unstable.** Rounding and bin width change the answer, so it is rarely used for measurements.
- **It says nothing about the rest of the distribution.**

## Common pitfalls

- **Reporting "no mode" as an error.** It is a valid result and worth stating.
- **Using the mode for numeric data because it is easy.** For measurements, the mean or median carries far more information.
- **Ignoring a second mode** when it is the most interesting thing in the data.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Survey responses: 12 people chose "email", 12 chose "phone", 5 chose "chat". What is the mode, and what would you report?

<p class="challenge__answer">💡 <strong>Answer:</strong> There are two modes, email and phone, tied at 12. Report both, with the counts: "email and phone are tied as the most preferred channel (12 each), chat is a distant third (5)". Reporting one arbitrarily loses information the survey paid for.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why can the mode exist for data where the mean is undefined?
- Can a dataset have a mode but no mean? A mean but no mode?
- If a distribution is bimodal, is the mean wrong, or is the question wrong?
- Why does binning continuous data change the mode?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-mode">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. When is the mode the only appropriate measure of centre?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">When the data is normally distributed.</button>
      <button class="quiz-q__opt" data-idx="1">When the data is categorical, with no numerical order.</button>
      <button class="quiz-q__opt" data-idx="2">When there are outliers.</button>
      <button class="quiz-q__opt" data-idx="3">When the sample is very large.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. The values 1, 2, 2, 3, 4, 4, 5 have which mode(s)?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">2 only.</button>
      <button class="quiz-q__opt" data-idx="1">No mode.</button>
      <button class="quiz-q__opt" data-idx="2">2 and 4, tied.</button>
      <button class="quiz-q__opt" data-idx="3">3, the middle value.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
