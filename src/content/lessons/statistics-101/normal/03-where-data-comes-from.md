---
title: "Where Data Comes From"
description: "Surveys, sensors, logs and experiments: how the collection method decides what the data can and cannot answer."
module: "foundations"
order: 3
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Name the main ways data is collected and what each one is good for"
  - "Explain sampling bias and give two concrete examples"
  - "Distinguish an observational study from an experiment"
  - "Ask the four questions that should come before any analysis"
prerequisites: []
tags: ["data-collection", "sampling", "bias", "context", "experiment"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## What it means

Every dataset has a **provenance**: who or what produced each row, when, and under what conditions. The provenance decides what the data can answer, and no amount of analysis can add information the collection step never captured.

The main sources you will meet:

| Source | What it gives | What it usually lacks |
|---|---|---|
| **Survey** | opinions, self-reported facts | honesty, the people who did not answer |
| **Sensor / log** | precise timings, counts | context — why the value happened |
| **Administrative records** | complete coverage of a process | anything outside that process |
| **Experiment** | evidence about cause | realism — the setting is artificial |
| **Web analytics** | behaviour at scale | identity, and the reason behind a click |

**Sampling bias** is what happens when the observed cases differ systematically from the population. Two examples make it concrete:

- an online satisfaction survey answered only by people who did not abandon the site — the abandoned users are exactly the unhappy ones, and they are missing;
- a study of app usage from logs, where anyone who never installed the app cannot appear at all.

In both, the sample is large, clean and precisely measured, and it answers a different question than the one that was asked.

## Why it adds something

It sets the ceiling on what any later analysis can claim. A confidence interval tells you how precisely you measured *the sample's population*; it cannot tell you whether that population is the one you care about. Knowing the provenance tells you which caveat to attach before you even compute a mean.

The other distinction that matters is **observational versus experimental**:

- in an **observational** study you watch what happens: some people chose to exercise, some did not, and you compare them;
- in an **experiment** you assign the treatment: you decide who exercises and who does not.

Only the second can support a causal claim on its own, because random assignment breaks the link between the treatment and everything else about the person.

## Worked example

A company wants to know whether a new checkout flow increases purchases.

- **If they compare customers who happened to see the new flow with those who did not**, they have an observational comparison. The two groups differ in ways that matter: the new flow may have been rolled out on a particular device, or to newer accounts, and those differences are tangled with the outcome. Any difference is a mixture of the flow and the rollout.
- **If they randomly assign visitors to old or new flow**, they have an experiment. The groups differ only by chance, so a difference in purchase rate is attributable to the flow — within the range of sampling error.

The arithmetic afterwards is identical. The difference is entirely in the collection step, and it is the difference between a suggestion and evidence.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A city measures air quality with 10 sensors, all placed near schools. Can the data answer "what is the average air quality in the city"?

<p class="challenge__answer">💡 <strong>Answer:</strong> Not without qualification. The sensors are a biased sample: schools may sit away from industrial areas or, conversely, beside busy drop-off roads. The data describes air quality near schools well, and generalises to the city only if sensor placement is unrelated to pollution levels — which it plainly is not. Report it as "air quality near schools" unless a placement-independent sampling scheme is used.</p>

</div>
</details>

## The four questions before any analysis

1. **What is one row?** A delivery, a person, a session, a day? Getting this wrong makes every count wrong.
2. **Who is missing from this data?** Non-responders, uninstalled users, failed transactions before logging.
3. **How were cases selected?** Randomly, by convenience, by whoever was logged in?
4. **Was anything assigned, or only observed?** This decides whether a causal claim is available at all.

## The same thing in Python

Provenance is rarely in the file, so record it next to the data. A minimal habit:

```python
meta = {
    'source': 'checkout-log',
    'one_row': 'one completed checkout attempt',
    'window': '2026-10-01 to 2026-10-31',
    'missing': 'abandoned carts before payment are not logged',
    'assignment': 'observational — flow determined by device',
}

for k, v in meta.items():
    print(f'{k}: {v}')
```

Ten lines that prevent the most expensive class of mistake: analysing a column that does not mean what everyone assumed.

## When to use it

Every time you open an unfamiliar dataset, and whenever a result is about to inform a decision. The provenance check is cheap and it is the one step that cannot be recovered later.

## Limitations

- **Provenance is often undocumented.** Then you have to reconstruct it, or treat the conclusions as provisional.
- **Even a clean sample cannot fix a missing variable.** If satisfaction was never recorded for cancellations, no analysis recovers it.
- **Randomisation is not always ethical or possible.** Then observational methods with careful adjustment are the honest alternative, with their limits stated.

## Common pitfalls

- **Confusing a large sample with a representative one.** A million biased rows are still biased.
- **Assuming logs are complete.** Logging fails, ad blockers exist, and bot traffic is real.
- **Reading causation from an observational comparison** because the arithmetic was sophisticated.
- **Ignoring the non-responders**, who are usually the most informative group in a survey.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

A streaming service finds that users who watch more than 10 hours a week rate it highest, and concludes that encouraging more watching will improve satisfaction. What is wrong with the reasoning?

<p class="challenge__answer">💡 <strong>Answer:</strong> The comparison is observational and plausibly reversed: people who already like the service watch more. Satisfaction may cause viewing rather than the reverse, and both may be driven by a third factor such as having spare time. To test the claim you would need to encourage viewing in a randomised group and compare satisfaction.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does a large sample not compensate for a biased one?
- What can an experiment tell you that an observational study cannot, and what can it not?
- If the non-responders differ from the responders, what does the survey actually estimate?
- Why is "one row = one person" sometimes the wrong assumption, even when the data is about people?

## ✅ Quick check

<div class="quiz" data-quiz="statistics-101-provenance">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does sampling bias mean?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The sample is too small.</button>
      <button class="quiz-q__opt" data-idx="1">The observed cases differ systematically from the population of interest.</button>
      <button class="quiz-q__opt" data-idx="2">The measurements contain random errors.</button>
      <button class="quiz-q__opt" data-idx="3">The data was collected too quickly.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">2. Which design can support a causal claim on its own?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">A large observational sample.</button>
      <button class="quiz-q__opt" data-idx="1">A survey with a high response rate.</button>
      <button class="quiz-q__opt" data-idx="2">A dataset with many variables.</button>
      <button class="quiz-q__opt" data-idx="3">A randomised experiment.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
