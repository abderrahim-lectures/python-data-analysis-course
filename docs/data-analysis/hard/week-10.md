---
title: "Week 10: Final Deliverable — Students Performance EDA Report"
sidebar_position: 5
section: data-analysis
track: hard
week: 10
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 10: Final Deliverable — Students Performance EDA Report

<span className="gamified-flourish">🏁 Everything from Weeks 6–9 — the framework, the univariate charts, the correlation analysis, the storytelling polish — converges into one report this week.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Independently plan and execute a complete EDA project on a new dataset, from framing questions to final charts.
- Produce a short written report combining findings, evidence (charts/statistics), and appropriately cautious interpretation.
- Identify this dataset's real-world limitations and what conclusions it can't support.

## Lesson

### The dataset: Students Performance in Exams

[`students-performance.csv`](pathname:///datasets/students-performance.csv) ([credited here](/credits)) is one of Kaggle's most-used beginner EDA datasets, with 8 columns: `gender`, `race_ethnicity`, `parental_level_of_education`, `lunch`, `test_preparation_course`, and three numeric outcome columns — `math_score`, `reading_score`, `writing_score`.

### The required deliverable

Produce a short EDA report (a notebook with markdown cells explaining each step, or a written summary alongside your code) that includes, at minimum:

1. **Dataset profile** (Week 6): shape, dtypes, missingness, basic distributions of each column.
2. **At least 3 framed questions**, written before you analyze them, covering both:
   - a univariate question (Week 7) — e.g. "what does the math_score distribution look like?"
   - a bivariate or multivariate question (Week 8/9) — e.g. "does test_preparation_course associate with scores, and does that hold across genders?"
3. **A correlation analysis** (Week 8) of the three score columns, with a heatmap.
4. **At least one faceted or annotated storytelling chart** (Week 9).
5. **A short written conclusion** for each question: what you found, how confident you are (referencing sample size per group, per Week 6), and one plausible alternative explanation you can't rule out (per Week 8's correlation-is-not-causation discussion).

### A worked starting example

Here's a complete mini-example of the pattern each of your questions should follow — profile → visualize → interpret with appropriate caution:

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

df = pd.read_csv("students-performance.csv")

# Question: does completing test preparation associate with a higher average score
# across all three subjects?
df["average_score"] = df[["math_score", "reading_score", "writing_score"]].mean(axis=1)

summary = df.groupby("test_preparation_course")["average_score"].agg(["mean", "count"])
print(summary)

sns.boxplot(data=df, x="test_preparation_course", y="average_score")
plt.title("Average score by test preparation status")
plt.show()
```

> **Finding:** Students who completed test preparation had a higher average score than those who didn't, based on a reasonably sized sample in both groups (see `count`).
> **Caveat:** This is an association, not proof that test prep *caused* the difference — students motivated enough to complete optional test prep may differ from those who didn't in other ways (e.g. general study habits, family support) that independently affect scores.

`.mean(axis=1)` computes a row-wise mean across the three score columns (`axis=1` means "across columns, for each row" — as opposed to the default `axis=0`, "down each column"), producing one combined `average_score` per student.

### Wrapping up: what this dataset can't tell you

Before finalizing your report, note explicitly what conclusions this dataset does *not* support: it's a single snapshot (not a study over time), the exact population and collection methodology aren't specified in the version of the dataset used here, and — as emphasized throughout Weeks 8-9 — none of these associations establish causation. A rigorous EDA report is honest about these boundaries, not just about what it found.

## 🧩 Challenges

<Challenge id="dataanalysis-hard-w10-c1" answer={<>Following the worked example's pattern: group by <code>parental_level_of_education</code>, compute mean and count of <code>average_score</code> per group, then visualize with an ordered bar chart or grouped boxplot (Week 9's techniques), and write a finding + caveat pair like the worked example.</>}>

Answer this question for your report: does `parental_level_of_education` associate with `average_score`? Follow the full pattern — summary table, chart, finding, and caveat.

</Challenge>

<Challenge id="dataanalysis-hard-w10-c2" answer={<>Use <code>sns.relplot</code> or <code>sns.boxplot</code> with both <code>col="gender"</code> (or <code>hue="gender"</code>) and grouping by <code>test_preparation_course</code>, following Week 9's faceting pattern, to see whether the test-prep effect on scores looks similar for both genders or differs.</>}>

Extend the worked example's test-preparation question to check whether the effect looks the same across `gender` — does test prep seem to associate with a bigger score gain for one gender than the other?

</Challenge>

<Challenge id="dataanalysis-hard-w10-c3" answer={<>Build the 3-column correlation matrix and heatmap exactly as in Week 8, then write a short interpretation noting which pair correlates most strongly and offering a plausible shared-cause explanation (e.g. general academic preparation) rather than claiming one score causes another.</>}>

Produce the required correlation heatmap for the three score columns, and write one sentence interpreting the strongest pairwise correlation, being explicit about what it does and doesn't imply.

</Challenge>

<Challenge id="dataanalysis-hard-w10-c4" answer={<>A reasonable answer notes at least one real limitation, e.g.: the dataset doesn't record when/where it was collected, so results may not generalize to other schools, regions, or years; "test scores" as an outcome captures only one narrow measure of educational success; and group sizes for some categories may be small enough that averages carry real uncertainty.</>}>

Write one paragraph for your report's conclusion, listing at least one specific limitation of this dataset that should make a reader cautious about generalizing your findings beyond it.

</Challenge>

## 🤔 Socratic Questions

- Across your full report, which finding do you feel most confident about, and which do you feel least confident about? What specifically (sample size, effect size, plausibility of a confound) drives that difference in confidence?
- If you had to pick just *one* chart from your entire report to show someone with 10 seconds of attention, which would it be, and why? What does that choice tell you about which finding is actually the most important one?
- You've now completed a full EDA cycle — question, evidence, honest interpretation — on a real-shaped dataset. Which specific week's material (6 through 9) did you personally lean on most while doing it? Does that match what you expected going in?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="data-analysis-hard-week-10"
  questions={[
    {
      id: 'q1',
      prompt: 'df[["math_score","reading_score","writing_score"]].mean(axis=1) computes:',
      options: [
        'The mean of each column separately',
        'A row-wise mean across the three columns, one value per student',
        'The overall mean of the whole DataFrame',
        'A correlation matrix',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: "A rigorous EDA report's conclusion should:",
      options: [
        'State findings as proven facts with no caveats',
        'Include findings, confidence level, and plausible alternative explanations',
        'Only include charts, no written interpretation',
        'Avoid mentioning sample sizes',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'Which of these is NOT something this dataset can support, per the lesson?',
      options: [
        'Associations between test prep and scores',
        'A description of score distributions',
        'A causal claim that test prep directly causes higher scores',
        'A comparison of average scores across categories',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q4',
      prompt: 'The required deliverable this week must include at minimum:',
      options: [
        'Only a correlation heatmap',
        'Dataset profile, framed questions, correlation analysis, a storytelling chart, and written conclusions',
        'A machine learning model trained on the data',
        'Just the raw pandas output with no interpretation',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-10" />

---

**🎉 You've completed the Pandas & Data Analysis Hard track — and the whole course, if you took Hard/Hard or any combination across both sections.** Head to [My Progress](/progress) to see your badges and, if you've finished every week, unlock the [Capstone Bonus](/docs/bonus/capstone-ai-agent): installing Python for real and building your first AI agent.
