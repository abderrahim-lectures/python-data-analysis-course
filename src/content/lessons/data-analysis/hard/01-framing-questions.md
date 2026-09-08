---

title: "Framing EDA Questions"
description: "Translate vague business problems into structured, testable analytical questions that guide your entire analysis."
module: "eda-framework"
order: 1
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Translate a vague problem statement into focused EDA questions"
  - "Distinguish between descriptive, exploratory, and confirmatory analysis"
  - "Formulate testable hypotheses from analytical questions"
  - "Build a question hierarchy that structures the full EDA workflow"
prerequisites: []
tags: ["eda", "framing", "hypotheses", "questions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "A stakeholder asks why sales are down. What should you do first?"
    options:
      - text: "Load the sales data and plot a time series immediately"
      - text: "Ask what time period and product category they care about"
        correct: true
      - text: "Run a regression model on the sales data"
      - text: "Tell them sales fluctuations are normal"
  - question: "Which type of analytical question asks whether a test course causes higher scores?"
    options:
      - text: "Descriptive"
      - text: "Exploratory"
      - text: "Confirmatory"
        correct: true
      - text: "Prescriptive"
  - question: "What is the purpose of a question hierarchy in EDA?"
    options:
      - text: "To make the analysis look more professional"
      - text: "To structure the analysis from broad to specific"
        correct: true
      - text: "To reduce the number of questions"
      - text: "To avoid asking stakeholders"
---
A good analysis begins with a question, not a plot. Before you load a dataset, before you import matplotlib, you need to know what you are looking for. This lesson teaches you how to translate a vague business problem into a structured set of analytical questions that will guide every decision in your EDA pipeline.

## Key Concepts

### From vague problem to structured questions

A stakeholder says "Do student test scores vary by gender?" — that sounds like a question, but it is actually too broad to answer directly. Good EDA questions are specific, measurable, and scoped. Break the vague question into layers:

```python
# Vague question
"Do student test scores vary by gender?"

# Layer 1 — scope the variable
"What is the distribution of math scores across the dataset?"

# Layer 2 — introduce the comparison
"How do math score distributions differ between male and female students?"

# Layer 3 — add depth
"Does the gender gap in math scores change across different ethnic groups?"

# Layer 4 — actionable insight
"Which subgroups show the largest performance gaps, and what interventions might address them?"
```

### Three types of analytical questions

| Type | Purpose | Example |
|------|---------|---------|
| **Descriptive** | Summarize what happened | "What is the average reading score?" |
| **Exploratory** | Discover patterns and relationships | "Do lunch type and test preparation correlate with scores?" |
| **Confirmatory** | Test a specific hypothesis | "Is the math score difference between genders statistically significant?" |

A strong EDA moves through all three: describe the landscape, explore unexpected patterns, then confirm the most important findings.

### The question hierarchy

Structure your questions into a hierarchy that mirrors the EDA workflow:

1. **Primary question** — the single question the analysis must answer
2. **Secondary questions** — breakdowns and comparisons that support the primary
3. **Tertiary questions** — edge cases, confounders, and "what about X?" follow-ups

```python
# Example for Students Performance dataset

primary = "What factors most strongly predict student performance on exams?"

secondary = [
    "How do scores distribute across subjects (math, reading, writing)?",
    "Do gender and ethnicity interact to produce score differences?",
    "What role does parental education level play?",
    "Is test preparation course completion associated with higher scores?",
]

tertiary = [
    "Does lunch type (standard vs free/reduced) confound the ethnicity effect?",
    "Are the relationships linear or do they plateau?",
    "Do outliers represent data entry errors or genuine high performers?"
]
```

### Hypothesis formulation

Once you have questions, convert them into testable hypotheses. A good hypothesis is falsifiable and specific:

```python
# Weak hypothesis (not testable)
"Gender affects scores."

# Strong hypothesis (testable, specific)
"Female students score higher on reading and writing, while male students score higher on math, with effect sizes greater than 0.2 standard deviations."

# Null hypothesis (for confirmatory analysis)
"There is no statistically significant difference in mean math scores between male and female students (p > 0.05)."
```

### Documenting your question framework

Keep your questions visible throughout the analysis. A simple checklist in your notebook keeps you honest:

```python
eda_questions = {
    "primary": "What factors most strongly predict student performance?",
    "secondary": {
        "score_distributions": "How do scores distribute across subjects?",
        "gender_effects": "Do gender and ethnicity interact?",
        "parental_education": "What role does education level play?",
        "test_prep": "Is test preparation associated with higher scores?",
    },
    "status": {}  # track which questions you've answered
}

for q in eda_questions["secondary"]:
    print(f"  [ ] {q}")
```

## Try It

Open the playground below and practice framing questions for a dataset you want to explore. Write down one primary question, three secondary questions, and convert at least one into a testable hypothesis.

```python
# Your turn: frame EDA questions for a dataset of your choice
# Replace the example below with your own

my_dataset = "Students Performance in Exams"

primary_question = "What factors most strongly predict student performance?"
secondary_questions = [
    "How do scores distribute across subjects?",
    "Do demographic factors correlate with performance gaps?",
    "What is the effect of test preparation course completion?",
]

# Convert one to a hypothesis
hypothesis = (
    "Students who complete a test preparation course will score "
    "at least 5 points higher on average across all three subjects."
)

print(f"Primary: {primary_question}")
print("Secondary:")
for i, q in enumerate(secondary_questions, 1):
    print(f"  {i}. {q}")
print(f"\nHypothesis: {hypothesis}")
```

## Key Takeaways

- Good EDA starts with questions, not code — the quality of your questions determines the quality of your analysis
- Break vague problems into a hierarchy: primary, secondary, and tertiary questions
- Convert questions into falsifiable hypotheses before you start computing
- Descriptive, exploratory, and confirmatory analysis each serve a different purpose; a strong EDA uses all three
- Document your question framework and track which questions you have answered

## Practice Challenge

You are given a dataset called `housing.csv` with columns: `price`, `sqft`, `bedrooms`, `bathrooms`, `neighborhood`, `year_built`, `has_garage`.

Write a primary question, three secondary questions, and one testable hypothesis. Then write a Python dictionary that stores your question hierarchy and prints it formatted.

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

```python
eda_framework = {
    "dataset": "housing.csv",
    "primary": "What factors most strongly predict house price?",
    "secondary": [
        "How does price vary by neighborhood?",
        "Is there a linear relationship between sqft and price?",
        "Do bedrooms and bathrooms interact in their effect on price?",
    ],
    "hypothesis": (
        "Houses with a garage sell for at least 15% more than "
        "comparable houses without one, controlling for sqft and location."
    ),
}

for key, value in eda_framework.items():
    if isinstance(value, list):
        print(f"{key}:")
        for i, item in enumerate(value, 1):
            print(f"  {i}. {item}")
    else:
        print(f"{key}: {value}")
```

</div>
</details>
