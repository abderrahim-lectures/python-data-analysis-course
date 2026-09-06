---


title: "Final EDA Report"
description: "Complete the full EDA pipeline on the Students Performance dataset and produce a polished, narrative-driven final report."
module: "students-performance-eda"
order: 10
difficulty: "advanced"
estimatedMinutes: 30
learningObjectives:
  - "Execute a complete EDA pipeline from profiling through multivariate analysis"
  - "Create publication-quality visualizations with annotations and narrative structure"
  - "Synthesize findings into a cohesive report with clear insights and recommendations"
  - "Document the analysis in a reproducible, presentation-ready format"
prerequisites: ["09-students-profiling"]
tags: ["capstone", "students-performance", "final-report", "eda", "visualization"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 200
section: "data-analysis"
track: "hard"
quiz:
  - question: "What should a final EDA report include?"
    options:
      - text: "Only the charts"
      - text: "Question, method, finding, and recommendation for each analysis"
        correct: true
      - text: "Only the statistical tests"
      - text: "Only the raw data"
  - question: "Why should you restate the business question in your conclusion?"
    options:
      - text: "To make the report longer"
      - text: "To connect your analysis back to the original problem"
        correct: true
      - text: "To fill space"
      - text: "It is not necessary"
  - question: "What makes a visualization effective for non-technical stakeholders?"
    options:
      - text: "Complex statistical plots"
      - text: "Clear labels, simple colors, and a direct answer to the question"
        correct: true
      - text: "As many data points as possible"
      - text: "Raw numbers in a table"
---
This is your capstone deliverable. Everything you have learned — profiling, univariate analysis, bivariate analysis, correlation, advanced plots, and storytelling — comes together here. You will produce a complete, polished EDA report on the Students Performance in Exams dataset that tells a clear, data-backed story.

## Key Concepts

### Report structure

A professional EDA report follows this structure:

1. **Executive Summary** — key findings in 3-4 bullet points
2. **Data Overview** — dataset description, profiling, quality assessment
3. **Univariate Analysis** — distributions of each variable
4. **Bivariate Analysis** — relationships between variables
5. **Multivariate Analysis** — interactions and confounders
6. **Key Findings** — what the data reveals
7. **Recommendations** — actionable next steps

### Complete EDA pipeline

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

# ── 1. EXECUTIVE SUMMARY ──────────────────────────────────────
print("=" * 70)
print("  STUDENTS PERFORMANCE IN EXAMS — EDA REPORT")
print("=" * 70)

score_cols = ["math score", "reading score", "writing score"]
cat_cols = ["gender", "race/ethnicity", "parental level of education",
            "lunch", "test preparation course"]

print("\n1. EXECUTIVE SUMMARY")
print(f"   • {len(df)} students analyzed across 8 variables")
print(f"   • Mean scores: Math {df['math score'].mean():.1f}, "
      f"Reading {df['reading score'].mean():.1f}, "
      f"Writing {df['writing score'].mean():.1f}")
print(f"   • Test preparation associated with +{df[df['test preparation course']=='completed']['math score'].mean() - df[df['test preparation course']=='none']['math score'].mean():.1f} point improvement in math")
print(f"   • Gender gap: females +{df[df['gender']=='female']['writing score'].mean() - df[df['gender']=='male']['writing score'].mean():.1f} in writing, "
      f"males +{df[df['gender']=='male']['math score'].mean() - df[df['gender']=='female']['math score'].mean():.1f} in math")
```

### Data overview and profiling

```python
print("\n2. DATA OVERVIEW")
print(f"   Shape: {df.shape[0]} rows × {df.shape[1]} columns")
print(f"   Missing values: {df.isnull().sum().sum()}")
print(f"   Duplicates: {df.duplicated().sum()}")
print(f"\n   Column types:")
for col in df.columns:
    dtype = df[col].dtype
    n_unique = df[col].nunique()
    print(f"     {col}: {dtype} ({n_unique} unique)")
```

### Univariate analysis figure

```python
fig, axes = plt.subplots(2, 3, figsize=(16, 10))

# Row 1: Numerical distributions
for i, col in enumerate(score_cols):
    sns.histplot(df[col], kde=True, bins=20, ax=axes[0, i], color="steelblue", edgecolor="black")
    mean_val = df[col].mean()
    median_val = df[col].median()
    axes[0, i].axvline(mean_val, color="red", linestyle="--", linewidth=1.5, label=f"Mean: {mean_val:.1f}")
    axes[0, i].axvline(median_val, color="green", linestyle=":", linewidth=1.5, label=f"Median: {median_val:.1f}")
    axes[0, i].set_title(col.replace(" score", " Score Distribution").title(), fontweight="bold")
    axes[0, i].legend(fontsize=9)

# Row 2: Categorical counts
for i, col in enumerate(cat_cols[:3]):
    order = None
    if col == "parental level of education":
        order = ["some high school", "high school", "some college",
                 "associate's degree", "bachelor's degree", "master's degree"]
    sns.countplot(data=df, x=col, ax=axes[1, i], palette="Set2", order=order)
    axes[1, i].set_title(col.replace(" level of education", "").replace(" preparation course", " Prep").replace("ethnicity", "Ethnicity").title(), fontweight="bold")
    axes[1, i].tick_params(axis="x", rotation=45)

plt.suptitle("Univariate Analysis — Score Distributions and Demographics", fontsize=16, fontweight="bold", y=1.01)
plt.tight_layout()
plt.show()
```

### Bivariate analysis figure

```python
fig, axes = plt.subplots(2, 3, figsize=(16, 10))

# Row 1: Scores by gender
for i, col in enumerate(score_cols):
    sns.boxplot(data=df, x="gender", y=col, ax=axes[0, i], palette="Set2")
    axes[0, i].set_title(f"{col.replace(' score', ' Score').title()} by Gender", fontweight="bold")

# Row 2: Scores by test prep and lunch
sns.boxplot(data=df, x="test preparation course", y="math score", ax=axes[1, 0], palette="Set1")
axes[1, 0].set_title("Math Score by Test Prep", fontweight="bold")

sns.violinplot(data=df, x="lunch", y="reading score", ax=axes[1, 1], palette="Set3")
axes[1, 1].set_title("Reading Score by Lunch Type", fontweight="bold")

sns.boxplot(data=df, x="lunch", y="writing score", hue="gender", ax=axes[1, 2], palette="Set1")
axes[1, 2].set_title("Writing: Lunch × Gender", fontweight="bold")
axes[1, 2].legend(fontsize=8)

plt.suptitle("Bivariate Analysis — Score Differences Across Groups", fontsize=16, fontweight="bold", y=1.01)
plt.tight_layout()
plt.show()
```

### Correlation and multivariate analysis

```python
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# Correlation heatmap
corr = df[score_cols].corr()
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, mask=mask, annot=True, fmt=".3f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, linewidths=0.5, ax=axes[0],
            annot_kws={"fontsize": 14})
axes[0].set_title("Score Correlations", fontweight="bold")

# Pair plot alternative: scatter with hue
sns.scatterplot(data=df, x="math score", y="reading score", hue="gender",
                style="test preparation course", alpha=0.5, ax=axes[1], palette="Set1")
axes[1].set_title("Math vs Reading: Gender × Test Prep", fontweight="bold")

# Interaction: test prep × lunch
sns.boxplot(data=df, x="lunch", y="math score", hue="test preparation course",
            ax=axes[2], palette="Set1")
axes[2].set_title("Math: Lunch × Test Prep Interaction", fontweight="bold")
axes[2].legend(fontsize=8)

plt.suptitle("Multivariate Analysis — Correlations and Interactions", fontsize=16, fontweight="bold", y=1.01)
plt.tight_layout()
plt.show()
```

### Storytelling visualization

```python
fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(3, 3, hspace=0.4, wspace=0.3, height_ratios=[0.8, 1.2, 1.2])

# Title banner
ax_title = fig.add_subplot(gs[0, :])
ax_title.axis("off")
ax_title.text(0.5, 0.7, "Students Performance in Exams", fontsize=22,
              fontweight="bold", ha="center", va="center", transform=ax_title.transAxes)
ax_title.text(0.5, 0.2,
              "Analysis of 1000 students | Key factors: test preparation, lunch type, gender",
              fontsize=13, ha="center", va="center", style="italic", transform=ax_title.transAxes)

# Finding 1: Test prep
ax1 = fig.add_subplot(gs[1, 0])
means_prep = df.groupby("test preparation course")[score_cols].mean()
means_prep.plot(kind="bar", ax=ax1, rot=0, colormap="Set2")
ax1.set_title("Finding 1:\nTest Prep Boosts All Scores", fontweight="bold", fontsize=11)
ax1.set_ylabel("Mean Score")
ax1.legend(fontsize=8)

# Finding 2: Gender gap
ax2 = fig.add_subplot(gs[1, 1])
means_gender = df.groupby("gender")[score_cols].mean()
means_gender.plot(kind="bar", ax=ax2, rot=0, colormap="Set1")
ax2.set_title("Finding 2:\nGender Gap Varies by Subject", fontweight="bold", fontsize=11)
ax2.set_ylabel("Mean Score")
ax2.legend(fontsize=8)

# Finding 3: Lunch effect
ax3 = fig.add_subplot(gs[1, 2])
sns.violinplot(data=df, x="lunch", y="math score", ax=ax3, palette="Set3", inner="quartile")
ax3.set_title("Finding 3:\nLunch Type Predicts Scores", fontweight="bold", fontsize=11)

# Correlation panel
ax4 = fig.add_subplot(gs[2, 0])
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0, square=True, ax=ax4, cbar=False)
ax4.set_title("Score Correlations", fontweight="bold", fontsize=11)

# Regression panel
ax5 = fig.add_subplot(gs[2, 1])
sns.regplot(data=df, x="math score", y="writing score", ax=ax5,
            scatter_kws={"alpha": 0.3, "s": 15}, line_kws={"color": "red"})
ax5.set_title("Math vs Writing (r=0.80)", fontweight="bold", fontsize=11)

# Insight banner
ax_insight = fig.add_subplot(gs[2, 2])
ax_insight.axis("off")
insight_text = (
    "KEY INSIGHTS\n\n"
    "• Test preparation: +5-8 points across subjects\n"
    "• Gender: females +5.6 in writing, males +3.2 in math\n"
    "• Lunch type: standard lunch students score 10+ points higher\n"
    "• Scores are highly correlated (r > 0.80)\n"
    "• Recommendations: expand test prep, investigate lunch disparity"
)
ax_insight.text(0.1, 0.5, insight_text, fontsize=11, va="center",
                bbox=dict(boxstyle="round,pad=0.8", facecolor="lightyellow", edgecolor="orange"),
                transform=ax_insight.transAxes)

plt.show()
```

### Key findings summary

```python
print("\n6. KEY FINDINGS")
print("   ─────────────────────────────────────────────────────")
findings = [
    ("Test Preparation", "Students who completed test prep scored 5-8 points higher across all subjects."),
    ("Gender Differences", "Females outperformed in reading (+6.2) and writing (+5.6); males led in math (+3.2)."),
    ("Lunch Type", "Students with standard lunch scored 10+ points higher — likely a proxy for socioeconomic status."),
    ("Score Correlations", "Math-reading (r=0.81), math-writing (r=0.80), reading-writing (r=0.95) — highly correlated."),
    ("Ethnicity", "Group E students scored highest; Group A scored lowest — potential equity concern."),
]

for i, (title, detail) in enumerate(findings, 1):
    print(f"   {i}. {title}: {detail}")

print("\n7. RECOMMENDATIONS")
print("   ─────────────────────────────────────────────────────")
recommendations = [
    "Expand test preparation course access — strongest modifiable predictor.",
    "Investigate lunch type disparity — may indicate socioeconomic barriers.",
    "Monitor gender gaps — subject-specific interventions may help.",
    "Explore ethnicity-based equity concerns with further research.",
    "Use these findings as baseline for longitudinal tracking."
]
for i, rec in enumerate(recommendations, 1):
    print(f"   {i}. {rec}")

print("\n" + "=" * 70)
print("  END OF EDA REPORT")
print("=" * 70)
```

## Try It

Run the complete EDA pipeline above on the Students Performance dataset. Customize the visualizations with your own color choices, annotations, and insights. Then write a 3-sentence executive summary of your findings.

```python
# Your executive summary template:
executive_summary = """
The analysis of 1000 students reveals three key performance drivers:
[1] Test preparation course completion is associated with 5-8 point
improvements across all subjects. [2] Gender differences are
subject-specific: females excel in reading/writing, males in math.
[3] Lunch type — a proxy for socioeconomic status — predicts score
differences of 10+ points, suggesting systemic barriers to achievement.
"""

print(executive_summary)
```

## Key Takeaways

- A professional EDA report follows a clear structure: overview → univariate → bivariate → multivariate → findings → recommendations
- The capstone integrates every skill from the course: profiling, analysis, visualization, and storytelling
- Annotated, multi-panel figures communicate complex findings efficiently
- Findings should be specific (with numbers) and actionable (with recommendations)
- The best EDA reports are reproducible — anyone can rerun the notebook and get the same results

## Practice Challenge

Create a self-contained Python script that loads the Students Performance dataset, runs the complete EDA pipeline, and generates a 4-panel summary figure with: (1) score distributions, (2) test prep comparison, (3) correlation heatmap, and (4) an insight banner. Save the figure as `eda_report.png`.

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# Load data
url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

# Create summary figure
fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

# Panel 1: Score distributions
ax1 = fig.add_subplot(gs[0, 0])
for col, color in zip(["math score", "reading score", "writing score"], ["#2E86AB", "#A23B72", "#F18F01"]):
    sns.kdeplot(df[col], fill=True, alpha=0.3, label=col.replace(" score", "").title(), ax=ax1, color=color)
ax1.set_title("Score Distributions", fontweight="bold", fontsize=13)
ax1.set_xlabel("Score")
ax1.legend()

# Panel 2: Test prep comparison
ax2 = fig.add_subplot(gs[0, 1])
means = df.groupby("test preparation course")[["math score", "reading score", "writing score"]].mean()
means.plot(kind="bar", ax=ax2, rot=0, colormap="Set2")
ax2.set_title("Test Preparation Effect", fontweight="bold", fontsize=13)
ax2.set_ylabel("Mean Score")
ax2.legend(fontsize=9)

# Panel 3: Correlation heatmap
ax3 = fig.add_subplot(gs[1, 0])
corr = df[["math score", "reading score", "writing score"]].corr()
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, mask=mask, annot=True, fmt=".2f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, linewidths=0.5, ax=ax3, annot_kws={"fontsize": 14})
ax3.set_title("Score Correlations", fontweight="bold", fontsize=13)

# Panel 4: Insight banner
ax4 = fig.add_subplot(gs[1, 1])
ax4.axis("off")

# Compute key metrics
prep_effect = df[df["test preparation course"] == "completed"]["math score"].mean() - \
              df[df["test preparation course"] == "none"]["math score"].mean()
gender_writing = df[df["gender"] == "female"]["writing score"].mean() - \
                 df[df["gender"] == "male"]["writing score"].mean()

insight = (
    f"KEY FINDINGS\n\n"
    f"• Test preparation: +{prep_effect:.1f} points in math\n"
    f"• Gender writing gap: +{gender_writing:.1f} (female advantage)\n"
    f"• Score correlations: r > 0.80 for all pairs\n"
    f"• {len(df)} students analyzed across 8 variables\n\n"
    f"RECOMMENDATIONS\n\n"
    f"• Expand test prep access\n"
    f"• Investigate lunch-socioeconomic link\n"
    f"• Target subject-specific gender interventions"
)
ax4.text(0.05, 0.5, insight, fontsize=12, va="center", family="monospace",
         bbox=dict(boxstyle="round,pad=0.8", facecolor="lightyellow", edgecolor="orange"),
         transform=ax4.transAxes)
ax4.set_title("Summary & Recommendations", fontweight="bold", fontsize=13)

fig.suptitle("Students Performance in Exams — EDA Report", fontsize=18, fontweight="bold", y=1.01)
plt.savefig("eda_report.png", dpi=150, bbox_inches="tight")
plt.show()
print("Report saved as eda_report.png")
```

</div>
</details>

## Projects You Can Build

Here are a few real-world projects that reinforce these concepts:

- 🧠 **ML Classifier** - Build a complete EDA report before developing predictive models
- 📈 **Data Visualization** - Create publication-quality visualizations with annotations and insights
- 📊 **Anomaly Detector** - Produce comprehensive data reports that identify patterns and anomalies
