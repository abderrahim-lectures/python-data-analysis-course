---
title: "Survey Builder"
description: "Create and analyze surveys with branching logic, response collection, and statistical analysis."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["classes", "pandas", "statistics", "data-analysis"]
learningObjectives:
  - "Model survey questions and branching logic with classes"
  - "Collect and store structured response data"
  - "Compute frequency distributions and cross-tabulations"
  - "Visualize survey results with bar charts and heatmaps"
prerequisites: ["Python basics (classes, lists, dicts)", "pip install pandas matplotlib"]
---

# Survey Builder

Create surveys with conditional question flow, collect responses, and analyze the results with charts and statistics.

## What You'll Learn

1. Use classes to represent different question types with branching logic
2. Store responses in a structured format suitable for analysis
3. Compute frequency distributions and cross-tabulations with pandas
4. Build charts that make survey results easy to interpret

## What You'll Build

A survey engine that lets you:

- **Define questions** — multiple choice, rating scales, and open text
- **Branch conditionally** — show or skip questions based on previous answers
- **Collect responses** — store each submission with timestamps
- **Analyze results** — frequency counts, averages, and cross-tabulations

## Where to Run It

- **JupyterLite playground** — paste the code cells directly into a notebook
- **Local with uv** — run as a standalone script
- **Google Colab** — open a new notebook and paste the cells

## Setup

```bash
uv init survey-builder
cd survey-builder
uv add pandas matplotlib
```

## Step 1 — Define Question Types

Create classes for each question type. Each handles display, validation, and branching.

```python
from dataclasses import dataclass, field
from typing import Any, Optional

@dataclass
class Question:
    text: str
    required: bool = True
    branch_rules: dict[str, str] = field(default_factory=dict)

    def display(self) -> None:
        print(f"\n  {self.text}")

    def validate(self, answer: Any) -> bool:
        return True

    def next_question_id(self, answer: Any) -> Optional[str]:
        return self.branch_rules.get(str(answer))

@dataclass
class MultipleChoice(Question):
    options: list[str] = field(default_factory=list)

    def display(self) -> None:
        print(f"\n  {self.text}")
        for i, opt in enumerate(self.options, 1):
            print(f"    {i}. {opt}")

    def validate(self, answer: str) -> bool:
        return answer in [str(i) for i in range(1, len(self.options) + 1)]

@dataclass
class RatingScale(Question):
    low_label: str = "Poor"
    high_label: str = "Excellent"
    scale_min: int = 1
    scale_max: int = 5

    def display(self) -> None:
        print(f"\n  {self.text}")
        print(f"    {self.scale_min} ({self.low_label}) — {self.scale_max} ({self.high_label})")

    def validate(self, answer: str) -> bool:
        try:
            return self.scale_min <= int(answer) <= self.scale_max
        except ValueError:
            return False

@dataclass
class OpenText(Question):
    max_length: int = 500

    def validate(self, answer: str) -> bool:
        return 0 < len(answer) <= self.max_length

mc = MultipleChoice("How often do you exercise?", options=["Daily", "Weekly", "Monthly", "Rarely"])
rating = RatingScale("How satisfied are you?", low_label="Not at all", high_label="Very")
mc.display()
rating.display()
print(f"MC valid '2': {mc.validate('2')} | Rating valid '6': {rating.validate('6')}")
```

## Step 2 — Build the Survey Runner

Create a `Survey` class that sequences questions, handles branching, and collects answers.

```python
@dataclass
class SurveyResponse:
    survey_title: str
    answers: dict[str, Any]
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            from datetime import datetime
            self.timestamp = datetime.now().isoformat()

class Survey:
    def __init__(self, title: str):
        self.title = title
        self.questions: dict[str, Question] = {}
        self.order: list[str] = []

    def add_question(self, q_id: str, question: Question) -> None:
        self.questions[q_id] = question
        self.order.append(q_id)

    def run(self) -> SurveyResponse:
        print(f"\n  Survey: {self.title}")
        answers: dict[str, Any] = {}
        idx = 0
        while idx < len(self.order):
            q_id = self.order[idx]
            question = self.questions[q_id]
            question.display()
            while True:
                answer = input("  Your answer: ").strip()
                if not question.required and answer == "":
                    break
                if question.validate(answer):
                    answers[q_id] = answer
                    break
                print("  Invalid answer, please try again.")
            branch = question.next_question_id(answer)
            idx = self.order.index(branch) if branch and branch in self.questions else idx + 1
        print("  Thank you for completing the survey!")
        return SurveyResponse(survey_title=self.title, answers=answers)
```

## Step 3 — Collect Multiple Responses

Run the survey for several participants and store all responses in a list.

```python
def collect_responses(survey: Survey, count: int) -> list[SurveyResponse]:
    responses = []
    for i in range(count):
        print(f"\n--- Participant {i + 1} of {count} ---")
        responses.append(survey.run())
    return responses

# For demo, simulate responses without input()
def simulate_responses() -> list[dict]:
    import random
    return [{
        "exercise_freq": str(random.choice([1, 2, 3, 4])),
        "satisfaction": str(random.randint(1, 5)),
        "recommend": str(random.choice([1, 2, 3, 4, 5])),
        "feedback": random.choice(["Great service", "Needs improvement", "Excellent", "Could be better"]),
    } for _ in range(30)]

responses = simulate_responses()
print(f"Collected {len(responses)} simulated responses")
```

## Step 4 — Analyze and Visualize Results

Convert responses to a DataFrame and compute statistics and charts.

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame(responses)

freq_map = {"1": "Daily", "2": "Weekly", "3": "Monthly", "4": "Rarely"}
df["exercise_label"] = df["exercise_freq"].map(freq_map)
exercise_counts = df["exercise_label"].value_counts()
satisfaction_counts = df["satisfaction"].value_counts().sort_index()

print("Exercise Frequency:")
print(exercise_counts)
print(f"\nAverage Satisfaction: {df['satisfaction'].astype(int).mean():.2f}")

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

colors_ex = ["#2ecc71", "#3498db", "#f39c12", "#e74c3c"]
exercise_counts.plot(kind="bar", ax=axes[0], color=colors_ex)
axes[0].set_title("Exercise Frequency")
axes[0].set_ylabel("Responses")
axes[0].tick_params(axis="x", rotation=45)

colors_sat = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"]
satisfaction_counts.plot(kind="bar", ax=axes[1], color=colors_sat[:len(satisfaction_counts)])
axes[1].set_title("Satisfaction Ratings")
axes[1].set_ylabel("Responses")

plt.tight_layout()
plt.savefig("survey_results.png", dpi=150)
plt.show()
```

## 🧩 Challenges

**Challenge 1 — Cross-tabulation**
Build a cross-tab of exercise frequency vs. satisfaction rating. Print the table and create a heatmap using matplotlib's `imshow`.

**Challenge 2 — Response filtering**
Write a function that filters responses by answer (e.g., "show me all respondents who selected Daily exercise") and computes their average satisfaction.

**Challenge 3 — Conditional follow-up**
Extend the branching logic to support multi-level branches — when answer A is given, show question X, and if answer to X is B, skip to question Y.

## Stretch Goals

- [ ] Add A/B testing for survey variants
- [ ] Build a panel management system for targeted distribution
- [ ] Implement natural language analysis for open-ended responses
- [ ] Export results to CSV for external tools
- [ ] Add weighted scoring for composite satisfaction indices

## What You Learned

- Modeling different data types with specialized classes
- Implementing branching logic with rule-based question routing
- Computing frequency distributions and averages with pandas
- Building side-by-side charts for multi-question surveys
