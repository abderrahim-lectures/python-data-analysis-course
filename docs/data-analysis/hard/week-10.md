---
title: "Week 10: Final Deliverable — Students Performance EDA Report"
sidebar_position: 5
section: data-analysis
track: hard
week: 10
description: "Deliver a full exploratory data analysis report on the Students Performance in Exams dataset."
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
- Assemble a full report structure from the individual techniques of Weeks 6–9.

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

### The full toolkit, at a glance

Every technique from this section maps onto one part of the report:

| Report section | Techniques (from) |
|---|---|
| Dataset profile | `.shape`, `.dtypes`, `.isna().sum()`, `.value_counts()`, mean/median skew check (Week 6) |
| Univariate question | Histogram, boxplot, bar chart, bin-count sensitivity (Week 7) |
| Bivariate/multivariate question | `.corr()`, heatmap, scatter plot with `hue`, grouped boxplot, `pd.crosstab` (Week 8) |
| Storytelling chart | Faceting (`col=`/`row=`), deliberate ordering, colorblind-safe palette, annotation (Week 9) |
| Conclusion | Finding + confidence (sample size) + alternative explanation, per question |

Treat this table as your report's outline before you write a single cell — the same "frame the structure before diving in" discipline Week 6 introduced for individual questions, now applied to the whole deliverable.

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

### A second worked example: a multivariate storytelling chart

Combining Week 8's correlation work with Week 9's faceting into one report-ready figure:

```python
sns.relplot(
    data=df, x="reading_score", y="writing_score",
    col="test_preparation_course", hue="lunch", palette="colorblind",
)
plt.show()
```

> **Finding:** The strong positive relationship between reading and writing scores holds in both test-preparation panels, suggesting it isn't specific to either group — likely reflecting a shared underlying factor (general literacy/verbal skill) rather than one subject's score influencing the other directly.
> **Caveat:** Faceting by two categorical variables (`col` and `hue`) at once starts to strain how much a reader can take in from one figure — worth a sentence acknowledging that, and considering whether this would be clearer split into two simpler figures for a real report.

### Wrapping up: what this dataset can't tell you

Before finalizing your report, note explicitly what conclusions this dataset does *not* support: it's a single snapshot (not a study over time), the exact population and collection methodology aren't specified in the version of the dataset used here, and — as emphasized throughout Weeks 8-9 — none of these associations establish causation. A rigorous EDA report is honest about these boundaries, not just about what it found.

## ⚠️ Common pitfalls

- **Skipping the profile step because the dataset "looks clean."** Always run the Week 6 profiling steps first, even on a dataset that seems tidy — confirming there's nothing missing or miscoded is part of the deliverable, not an optional formality.
- **Writing conclusions before checking sample sizes.** A dramatic-looking difference in a small subgroup (e.g. one `race_ethnicity` category with few students) deserves a caveat about sample size, the same discipline from Week 6.
- **Treating "correlation is not causation" as a footnote instead of load-bearing.** Every finding in the required deliverable needs its own honest caveat, not one generic disclaimer at the very end covering everything.
- **Running out of time on polish before finishing the required content.** All 5 deliverable pieces (profile, 3 questions, correlation analysis, storytelling chart, conclusions) matter more than making any single chart perfect — get a complete draft first, then improve it.

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

<Challenge id="dataanalysis-hard-w10-c5" answer={<>Use the mean-vs-median skew check and IQR outlier count from Week 6 on average_score, then a histogram from Week 7 to confirm visually -- combining a "before you plot" numeric check with the chart that verifies it, exactly the workflow Week 7 was built around.</>}>

Complete the required "dataset profile" section for your report: use Week 6's mean-vs-median skew check and IQR outlier count on the `average_score` column, and confirm what you find with a Week 7 histogram.

</Challenge>

<Challenge id="dataanalysis-hard-w10-c6" answer={<>Assemble a single markdown/text section combining: a one-sentence summary of the profile, the 3+ questions with findings and caveats, the correlation heatmap's headline finding, and the closing limitations paragraph -- essentially copying the report's required pieces into one continuous narrative a first-time reader could follow start to finish.</>}>

Assemble everything from this week's challenges into one continuous written narrative (not just a list of separate code cells) that a reader could follow from start to finish without needing to see your code.

</Challenge>

## 🤔 Socratic Questions

- Across your full report, which finding do you feel most confident about, and which do you feel least confident about? What specifically (sample size, effect size, plausibility of a confound) drives that difference in confidence?
- If you had to pick just *one* chart from your entire report to show someone with 10 seconds of attention, which would it be, and why? What does that choice tell you about which finding is actually the most important one?
- You've now completed a full EDA cycle — question, evidence, honest interpretation — on a real-shaped dataset. Which specific week's material (6 through 9) did you personally lean on most while doing it? Does that match what you expected going in?
- The second worked example's caveat admits that faceting by two variables at once might already be "too much" for one figure. Looking back at your own report, is there a chart you built that you'd now consider simplifying, having gone through this whole process?
- Now that you've built a complete EDA report from scratch, how would you explain the *difference* between "exploratory data analysis" and "just making some charts" to someone who hasn't taken this course — in your own words, not the lesson's?

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
    {
      id: 'q5',
      prompt: 'Per the lesson, when should you check sample size (count) per group?',
      options: [
        'Only for the final chart',
        'Never — mean alone is always sufficient',
        'Whenever comparing group means, since small groups deserve less confidence',
        'Only if the dataset has missing values',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-10" />

---

**🎉 You've completed the Pandas & Data Analysis Hard track — and the whole course, if you took Hard/Hard or any combination across both sections.** Head to [My Progress](/progress) to see your badges and, if you've finished every week, unlock the [Capstone projects](/docs/bonus): installing Python for real and building a Capstone project.
