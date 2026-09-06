---
title: "Quiz Engine"
description: "Build a quiz platform with question banks, timed tests, scoring, and performance analytics."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["classes", "random", "pandas", "matplotlib"]
learningObjectives:
  - "Model questions with classes supporting multiple question types"
  - "Implement timed quiz sessions with countdown logic"
  - "Build a scoring engine with partial credit support"
  - "Analyze performance with pandas and visualize results"
prerequisites: ["Python basics (classes, dictionaries, lists)", "pip install pandas matplotlib"]
---

# Quiz Engine

Create quizzes with randomised questions, timed sessions, automatic scoring, and detailed performance reports.

## What You'll Learn

1. Use classes to represent different question types with scoring rules
2. Implement a timer-based quiz session with configurable time limits
3. Calculate scores with weighted grading and partial credit
4. Analyse results to identify strengths and weak areas

## What You'll Build

A quiz platform that lets you:

- **Build question banks** — multiple choice, true/false, and fill-in-the-blank questions
- **Run timed quizzes** — configurable time limits per quiz and per question
- **Score automatically** — full credit, partial credit, and penalty for wrong answers
- **View performance reports** — category breakdowns and score visualisations

## Where to Run It

- **JupyterLite playground** — paste the code cells directly into a notebook
- **Local with uv** — run as a standalone script
- **Google Colab** — open a new notebook and paste the cells

## Setup

```bash
uv init quiz-engine
cd quiz-engine
uv add pandas matplotlib
```

## Step 1 — Define Question Types

Create classes for each question type. Each stores the question text, correct answer, and knows how to score itself.

```python
from dataclasses import dataclass, field
from abc import ABC, abstractmethod

@dataclass
class Question(ABC):
    text: str
    category: str
    points: int = 10

    @abstractmethod
    def check(self, answer: str) -> tuple[bool, int]:
        """Return (is_correct, points_awarded)."""
        ...

    @abstractmethod
    def display(self) -> None:
        ...

@dataclass
class MultipleChoice(Question):
    options: list[str] = field(default_factory=list)
    correct_index: int = 0

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts]")
        for i, opt in enumerate(self.options, 1):
            print(f"    {i}. {opt}")

    def check(self, answer: str) -> tuple[bool, int]:
        try:
            is_correct = int(answer) == self.correct_index + 1
        except ValueError:
            is_correct = False
        return is_correct, self.points if is_correct else 0

@dataclass
class TrueFalse(Question):
    correct_answer: bool = True

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts] (True / False)")

    def check(self, answer: str) -> tuple[bool, int]:
        is_correct = answer.strip().lower() in ("true", "t") == self.correct_answer
        return is_correct, self.points if is_correct else 0

@dataclass
class FillInBlank(Question):
    accepted_answers: list[str] = field(default_factory=list)

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts]")

    def check(self, answer: str) -> tuple[bool, int]:
        normalised = answer.strip().lower()
        is_correct = any(normalised == a.lower() for a in self.accepted_answers)
        return is_correct, self.points if is_correct else 0

mc = MultipleChoice("What is 2 + 2?", category="math", options=["3", "4", "5", "6"], correct_index=1)
tf = TrueFalse("Python is statically typed.", category="python", correct_answer=False)
fib = FillInBlank("The keyword to define a function is ___", category="python", accepted_answers=["def"])
for q in [mc, tf, fib]:
    q.display()
    correct, pts = q.check(input("  Answer: "))
    print(f"  {'Correct' if correct else 'Wrong'} (+{pts} pts)")
```

## Step 2 — Build the Quiz Engine

Create a `QuizEngine` that manages a question bank, assembles quizzes, and runs timed sessions.

```python
import random
import time

class QuizEngine:
    def __init__(self):
        self.questions: list[Question] = []

    def add_question(self, question: Question) -> None:
        self.questions.append(question)

    def build_quiz(self, num_questions: int = 5, categories: list[str] | None = None) -> list[Question]:
        pool = self.questions if not categories else [q for q in self.questions if q.category in categories]
        if len(pool) < num_questions:
            raise ValueError(f"Only {len(pool)} questions available, need {num_questions}")
        return random.sample(pool, num_questions)

    def run_quiz(self, questions: list[Question], time_limit: int = 300) -> list[dict]:
        print(f"\n  Quiz — {len(questions)} questions | {time_limit}s time limit")
        results = []
        start = time.time()

        for i, q in enumerate(questions, 1):
            remaining = time_limit - (time.time() - start)
            if remaining <= 0:
                print("\n  TIME'S UP!")
                break
            print(f"\n  Question {i}/{len(questions)} (time left: {remaining:.0f}s)")
            q.display()
            answer = input("  Your answer: ").strip()
            is_correct, pts = q.check(answer)
            results.append({"question": q.text, "category": q.category, "correct": is_correct, "points": pts, "max_points": q.points})
            print(f"  {'Correct!' if is_correct else 'Wrong.'} (+{pts} pts)")

        print(f"\n  Quiz finished in {time.time() - start:.1f}s")
        return results
```

## Step 3 — Score and Analyse Results

Aggregate results into a summary with per-category breakdowns and identify weak areas.

```python
def analyse_results(results: list[dict]) -> dict:
    total_points = sum(r["points"] for r in results)
    max_points = sum(r["max_points"] for r in results)
    accuracy = total_points / max_points * 100 if max_points else 0

    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"correct": 0, "total": 0, "points": 0, "max": 0}
        categories[cat]["total"] += 1
        categories[cat]["max"] += r["max_points"]
        categories[cat]["points"] += r["points"]
        if r["correct"]:
            categories[cat]["correct"] += 1

    summary = {"total_score": total_points, "max_score": max_points, "accuracy": round(accuracy, 1),
               "questions_answered": len(results), "categories": categories}

    print(f"\n  SCORE: {total_points}/{max_points} ({accuracy:.1f}%)")
    for cat, data in categories.items():
        cat_pct = data["points"] / data["max"] * 100 if data["max"] else 0
        print(f"  {cat}: {data['correct']}/{data['total']} correct ({cat_pct:.0f}%) — {'Strong' if cat_pct >= 70 else 'Needs Review'}")

    return summary
```

## Step 4 — Visualise Performance

Generate charts showing overall accuracy and per-category performance.

```python
import pandas as pd
import matplotlib.pyplot as plt

def plot_results(summary: dict) -> None:
    cats = summary["categories"]
    labels = list(cats.keys())
    scores = [cats[c]["points"] / cats[c]["max"] * 100 for c in labels]

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    colors = ["#2ecc71" if s >= 70 else "#e74c3c" for s in scores]
    axes[0].barh(labels, scores, color=colors)
    axes[0].set_xlim(0, 100)
    axes[0].set_title("Score by Category (%)")
    axes[0].axvline(x=70, color="gray", linestyle="--", alpha=0.5, label="Pass threshold")
    axes[0].legend()

    total_correct = sum(d["correct"] for d in cats.values())
    total_wrong = summary["questions_answered"] - total_correct
    axes[1].pie([total_correct, total_wrong], labels=["Correct", "Wrong"],
                colors=["#2ecc71", "#e74c3c"], autopct="%1.1f%%", startangle=90)
    axes[1].set_title("Overall Accuracy")

    plt.tight_layout()
    plt.savefig("quiz_results.png", dpi=150)
    plt.show()

demo = {"total_score": 35, "max_score": 50, "accuracy": 70.0, "questions_answered": 5,
        "categories": {"python": {"correct": 2, "total": 2, "points": 20, "max": 20},
                       "math": {"correct": 1, "total": 2, "points": 10, "max": 20},
                       "general": {"correct": 1, "total": 1, "points": 5, "max": 10}}}
plot_results(demo)
```

## 🧩 Challenges

**Challenge 1 — Question randomisation**
Extend `build_quiz` to support difficulty levels (easy, medium, hard). Filter by both category and difficulty when building a quiz.

**Challenge 2 — Spaced repetition tracker**
After each quiz, record which questions were answered wrong. On the next quiz, increase the probability of re-appearing wrong questions by 2x using weighted random sampling.

**Challenge 3 — Export report**
Write quiz results to a JSON file with timestamps so a student can track progress across multiple sessions.

## Stretch Goals

- [ ] Add question randomization and difficulty levels
- [ ] Implement spaced repetition for review recommendations
- [ ] Build a shared quiz repository with import/export

## What You Learned

- Modelling different data types with abstract classes and dataclasses
- Implementing timed sessions with Python's `time` module
- Building a scoring engine with weighted and partial credit
- Analysing quiz results with pandas and visualising with matplotlib
