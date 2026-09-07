---
title: "Quiz Engine"
description: "Build a quiz platform with question banks, timed tests, scoring, and performance analytics."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["classes", "random", "pandas", "matplotlib"]
xpReward: 50
learningObjectives:
  - "Model questions with classes supporting multiple question types"
  - "Implement timed quiz sessions with countdown logic"
  - "Build a scoring engine with weighted grading and partial credit"
  - "Analyze performance with pandas and visualize results"
  - "Persist quiz history to JSON across sessions"
  - "Build a CLI menu for interactive quiz sessions"
prerequisites: ["Python basics (classes, dictionaries, lists)", "Basic pandas and matplotlib"]
---

# Quiz Engine

Build a quiz platform with randomised questions, timed sessions, automatic scoring, and detailed performance reports.

## What you'll do

1. Model three question types — multiple choice, true/false, and fill-in-the-blank — using abstract classes and dataclasses.
2. Build a quiz engine that manages a question bank, selects random questions, and runs timed sessions.
3. Score answers automatically with per-category breakdowns and accuracy percentages.
4. Visualise performance with bar charts and pie charts using matplotlib.
5. Persist quiz history to a JSON file so results survive across sessions.
6. Build a CLI menu for creating quizzes, viewing history, and reviewing past results.
7. Polish the output with colour-coded feedback and formatted score reports.

## Where to run this

- **Locally with `uv` (recommended).** This project needs pandas and matplotlib — a good candidate for running on your own machine. The Setup section below walks through it.
- **Google Colab or Kaggle Notebooks.** Paste the code cells directly into a notebook. Charts render inline, and `input()` works for quiz prompts.
- **JupyterLite playground.** Paste the code cells directly into a notebook — note that file I/O (Step 5) works differently in the browser; the JSON persistence will only work locally.

## Setup

```bash
uv init quiz-engine
cd quiz-engine
uv add pandas matplotlib
```

## Step 1 — Define question types

The foundation of any quiz engine: each question knows its text, category, point value, how to display itself, and how to check an answer. We'll use an abstract base class so every question type follows the same interface, then build three concrete types on top.

### 1.1 Write the abstract base class

**👟 Starter hint:** Use `dataclasses` for clean attribute defaults and `abc.ABC` to enforce the interface. Every question stores `text`, `category`, and `points`, and must implement `check(answer) -> (bool, int)` and `display()`.

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
        """Print the question to the terminal."""
        ...
```

**🎯 Expected output:** Defining this class shouldn't produce visible output — it's a blueprint. You can verify it works by defining a minimal concrete subclass and instantiating it (next sub-step).

**🩹 If it's off:** If you get `TypeError: Can't instantiate abstract class`, you forgot to implement either `check` or `display` in your concrete subclass. If you see `TypeError: __init__() missing required arguments`, double-check that your dataclass fields have defaults where needed.

### 1.2 Implement MultipleChoice

**👟 Starter hint:** Store a list of `options` and the `correct_index` (1-based for display, but 0-based internally). The `check` method converts the user's numeric input to an index.

```python
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
```

**🎯 Expected output:** Running this:

```python
mc = MultipleChoice("What is 2 + 2?", category="math",
                     options=["3", "4", "5", "6"], correct_index=1)
mc.display()
correct, pts = mc.check("2")
print(f"Correct: {correct}, Points: {pts}")
```

Should print:

```
  What is 2 + 2? [10 pts]
    1. 3
    2. 4
    3. 5
    4. 6
Correct: True, Points: 10
```

**🩹 If it's off:** If `check("4")` returns `False`, you're comparing the raw string — make sure you `int(answer)` before comparing to `correct_index + 1` (the +1 accounts for 1-based display numbering).

### 1.3 Implement TrueFalse and FillInBlank

**👟 Starter hint:** TrueFalse stores a boolean `correct_answer` and checks if the user typed "true"/"t" or "false"/"f". FillInBlank stores a list of `accepted_answers` and normalises both the user's input and each accepted answer to lowercase for comparison.

```python
@dataclass
class TrueFalse(Question):
    correct_answer: bool = True

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts] (True / False)")

    def check(self, answer: str) -> tuple[bool, int]:
        normalised = answer.strip().lower()
        user_says_true = normalised in ("true", "t")
        user_says_false = normalised in ("false", "f")
        is_correct = (user_says_true == self.correct_answer)
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
```

**🎯 Expected output:** Running this:

```python
tf = TrueFalse("Python is statically typed.", category="python", correct_answer=False)
fib = FillInBlank("The keyword to define a function is ___", category="python",
                   accepted_answers=["def"])

for q in [tf, fib]:
    q.display()
    correct, pts = q.check("false" if isinstance(q, TrueFalse) else "def")
    print(f"  Correct: {correct}, Points: {pts}")
```

Should print:

```
  Python is statically typed. [10 pts] (True / False)
  Correct: True, Points: 10

  The keyword to define a function is ___ [10 pts]
  Correct: True, Points: 10
```

**🩹 If it's off:** If `TrueFalse` accepts "yes"/"no" input, you forgot to restrict to the `("true", "t", "false", "f")` set — "yes" would bypass your check and silently mark as wrong. If `FillInBlank` is case-sensitive, make sure you call `.lower()` on both sides of the comparison.

### 1.4 Verify all three types

**✅ Checklist**

- ✅ `MultipleChoice` displays numbered options and accepts a numeric string as input.
- ✅ `TrueFalse` accepts "true"/"t"/"false"/"f" (case-insensitive) and rejects other input.
- ✅ `FillInBlank` accepts any of the `accepted_answers` list, case-insensitively.
- ✅ All three return `(bool, int)` from `check()` — `True` with full points for correct, `False` with 0 for wrong.
- ✅ Each displays the question text and point value before prompting for an answer.

**🤔 Socratic Question(s)**

Why does `MultipleChoice` store `correct_index` as 0-based but add 1 when comparing user input? What would break if you asked the user for "0, 1, 2, or 3" instead of "1, 2, 3, or 4"?

## Step 2 — Build the quiz engine

Now that questions know how to check themselves, we need something that collects them, picks a random subset, and runs a timed session. The `QuizEngine` class ties everything together.

### 2.1 Create the engine and populate a question bank

**👟 Starter hint:** The engine starts with an empty list. `add_question` appends to it. `build_quiz` filters by category (if given) then uses `random.sample` to pick without replacement.

```python
import random

class QuizEngine:
    def __init__(self):
        self.questions: list[Question] = []

    def add_question(self, question: Question) -> None:
        self.questions.append(question)

    def build_quiz(self, num_questions: int = 5,
                   categories: list[str] | None = None) -> list[Question]:
        pool = self.questions if not categories else [
            q for q in self.questions if q.category in categories
        ]
        if len(pool) < num_questions:
            raise ValueError(
                f"Only {len(pool)} questions available in pool, need {num_questions}"
            )
        return random.sample(pool, num_questions)
```

**🎯 Expected output:** Populating the engine and building a quiz should return a random subset:

```python
engine = QuizEngine()
engine.add_question(MultipleChoice("What is 2 + 2?", "math", options=["3", "4", "5", "6"], correct_index=1))
engine.add_question(TrueFalse("Python is statically typed.", "python", correct_answer=False))
engine.add_question(FillInBlank("The keyword to define a function is ___", "python", accepted_answers=["def"]))
engine.add_question(MultipleChoice("Capital of France?", "geography", options=["London", "Paris", "Berlin"], correct_index=1))

quiz = engine.build_quiz(num_questions=2)
print(f"Quiz has {len(quiz)} questions")
for q in quiz:
    q.display()
```

**🩹 If it's off:** If you get `ValueError: Only N questions available in pool, need M`, you're asking for more questions than exist in the filtered pool — either add more questions or reduce `num_questions`. If the same question appears twice, you're using `random.choices` (with replacement) instead of `random.sample` (without replacement).

### 2.2 Run a timed quiz session

**👟 Starter hint:** Track a start time with `time.time()`. Before each question, compute remaining time. If it hits zero, end early. Collect results as a list of dicts with question text, category, correctness, and points.

```python
import time

def run_quiz(engine: QuizEngine, questions: list[Question],
             time_limit: int = 300) -> list[dict]:
    print(f"\n{'='*50}")
    print(f"  QUIZ — {len(questions)} questions | {time_limit}s time limit")
    print(f"{'='*50}")
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
        results.append({
            "question": q.text,
            "category": q.category,
            "correct": is_correct,
            "points": pts,
            "max_points": q.points,
        })
        print(f"  {'Correct!' if is_correct else 'Wrong.'} (+{pts} pts)")

    elapsed = time.time() - start
    print(f"\n  Quiz finished in {elapsed:.1f}s")
    return results
```

**🎯 Expected output:** Running a quiz prints each question, accepts input, and prints correct/wrong after each answer. When the timer expires, it prints `TIME'S UP!` and stops. The returned list of dicts has one entry per answered question.

**🩹 If it's off:** If the timer doesn't stop the quiz, check that `remaining <= 0` uses `time.time() - start` (elapsed), not `start - time.time()`. If the quiz always stops at the first question, your `remaining` calculation is wrong — make sure you're computing `time_limit - (time.time() - start)`, not just `time.time() - start`.

### 2.3 Verify the engine

**✅ Checklist**

- ✅ `build_quiz(3)` returns exactly 3 random questions from the bank.
- ✅ `build_quiz(3, categories=["python"])` only includes questions from the specified category.
- ✅ `run_quiz` prints a countdown timer and stops early when time runs out.
- ✅ Each answer is recorded with question text, category, correctness, and points.
- ✅ Asking for more questions than available raises a clear `ValueError`.

**🤔 Socratic Question(s)**

If you called `build_quiz(5)` on an engine with only 3 questions, what should happen? Is raising an error the right choice, or would you rather silently return all 3? What tradeoffs does each approach have?

## Step 3 — Score and analyse results

Raw results are just a list of dicts. To turn them into something useful, we need to aggregate scores, compute per-category breakdowns, and identify weak areas. This is also where pandas starts to earn its keep.

### 3.1 Build a summary without pandas

**👟 Starter hint:** Walk through the results once, tallying total points, max points, and per-category stats. Return a summary dict with overall accuracy and per-category breakdowns.

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

    summary = {
        "total_score": total_points,
        "max_score": max_points,
        "accuracy": round(accuracy, 1),
        "questions_answered": len(results),
        "categories": categories,
    }

    print(f"\n{'='*50}")
    print(f"  SCORE: {total_points}/{max_points} ({accuracy:.1f}%)")
    print(f"{'='*50}")
    for cat, data in categories.items():
        cat_pct = data["points"] / data["max"] * 100 if data["max"] else 0
        label = "Strong" if cat_pct >= 70 else "Needs Review"
        print(f"  {cat}: {data['correct']}/{data['total']} correct "
              f"({cat_pct:.0f}%) — {label}")

    return summary
```

**🎯 Expected output:** Running this on sample data:

```python
sample = [
    {"question": "What is 2+2?", "category": "math", "correct": True, "points": 10, "max_points": 10},
    {"question": "Capital of France?", "category": "geo", "correct": False, "points": 0, "max_points": 10},
    {"question": "def defines functions?", "category": "python", "correct": True, "points": 10, "max_points": 10},
]
analyse_results(sample)
```

Should print:

```
==================================================
  SCORE: 20/30 (66.7%)
==================================================
  math: 1/1 correct (100%) — Strong
  geo: 0/1 correct (0%) — Needs Review
  python: 1/1 correct (100%) — Strong
```

**🩹 If it's off:** If accuracy is 0 when you had correct answers, check that `"points"` and `"max_points"` are the keys in your result dicts — a typo like `"max_point"` silently gives 0 via `sum`. If categories are missing, your `for r in results` loop isn't initialising new category entries on first encounter.

### 3.2 Convert to a pandas DataFrame for deeper analysis

**👟 Starter hint:** Once you have a summary, pandas lets you do groupby operations easily. Convert the results list to a DataFrame and use `groupby` for per-category stats.

```python
import pandas as pd

def results_to_dataframe(results: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(results)

def category_breakdown(df: pd.DataFrame) -> pd.DataFrame:
    breakdown = df.groupby("category").agg(
        total_questions=("correct", "count"),
        correct_answers=("correct", "sum"),
        total_points=("points", "sum"),
        max_points=("max_points", "sum"),
    ).reset_index()
    breakdown["accuracy_pct"] = (
        breakdown["total_points"] / breakdown["max_points"] * 100
    ).round(1)
    breakdown["status"] = breakdown["accuracy_pct"].apply(
        lambda x: "Strong" if x >= 70 else "Needs Review"
    )
    return breakdown
```

**🎯 Expected output:**

```python
df = results_to_dataframe(sample)
print(category_breakdown(df))
```

```
  category  total_questions  correct_answers  total_points  max_points  accuracy_pct       status
0      geo                1                0             0          10           0.0  Needs Review
1     math                1                1            10          10         100.0        Strong
2   python                1                1            10          10         100.0        Strong
```

**🩹 If it's off:** If `correct_answers` shows floats (like `1.0` instead of `1`), that's normal pandas integer coercion with NaN — it won't affect calculations. If you get a `KeyError`, the column name in your DataFrame doesn't match what `groupby` expects — check the exact keys in your result dicts.

## Step 4 — Visualise performance

Charts make patterns obvious at a glance. We'll build two: a horizontal bar chart showing per-category accuracy (coloured green for strong, red for weak), and a pie chart showing overall correct-vs-wrong split.

### 4.1 Build the bar chart

**👟 Starter hint:** Use `matplotlib.pyplot`. Extract category labels and their accuracy percentages. Colour bars green if ≥70%, red otherwise. Add a dashed vertical line at the 70% pass threshold for reference.

```python
import matplotlib.pyplot as plt

def plot_category_bars(summary: dict) -> None:
    cats = summary["categories"]
    labels = list(cats.keys())
    scores = [cats[c]["points"] / cats[c]["max"] * 100 for c in labels]
    colors = ["#2ecc71" if s >= 70 else "#e74c3c" for s in scores]

    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.barh(labels, scores, color=colors)
    ax.set_xlim(0, 100)
    ax.set_xlabel("Accuracy (%)")
    ax.set_title("Score by Category")
    ax.axvline(x=70, color="gray", linestyle="--", alpha=0.5, label="Pass threshold (70%)")
    ax.legend()

    for bar, score in zip(bars, scores):
        ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height() / 2,
                f"{score:.0f}%", va="center", fontsize=10)

    plt.tight_layout()
    plt.savefig("category_bars.png", dpi=150)
    plt.show()
```

**🎯 Expected output:** A horizontal bar chart with category names on the y-axis, accuracy percentages on the x-axis, green bars for categories ≥70%, red bars below, and a dashed gray line at 70%.

**🩹 If it's off:** If the chart is blank, you're probably calling `plt.show()` before adding any data — make sure you create the figure and axes first. If bars are vertical instead of horizontal, you used `bar` instead of `barh`. If the x-axis goes past 100, add `ax.set_xlim(0, 100)`.

### 4.2 Build the pie chart

**👟 Starter hint:** Count total correct and total wrong across all categories. Use `plt.pie` with green and red slices and a percentage label.

```python
def plot_overall_pie(summary: dict) -> None:
    total_correct = sum(d["correct"] for d in summary["categories"].values())
    total_wrong = summary["questions_answered"] - total_correct

    fig, ax = plt.subplots(figsize=(6, 6))
    ax.pie(
        [total_correct, total_wrong],
        labels=["Correct", "Wrong"],
        colors=["#2ecc71", "#e74c3c"],
        autopct="%1.1f%%",
        startangle=90,
        textprops={"fontsize": 12},
    )
    ax.set_title(f"Overall Accuracy — {summary['accuracy']}%")
    plt.tight_layout()
    plt.savefig("overall_pie.png", dpi=150)
    plt.show()
```

**🎯 Expected output:** A pie chart with two slices — green for correct, red for wrong — with percentage labels and the overall accuracy in the title.

**🩹 If it's off:** If `total_wrong` is negative, your `questions_answered` count is off — make sure you're counting `len(results)`, not just the correct ones. If the pie chart has no labels, check that you passed the `labels` parameter to `plt.pie`.

### 4.3 Combine both charts

**👟 Starter hint:** Use `plt.subplots(1, 2)` to place both charts side by side in one figure.

```python
def plot_results(summary: dict) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    cats = summary["categories"]
    labels = list(cats.keys())
    scores = [cats[c]["points"] / cats[c]["max"] * 100 for c in labels]
    colors = ["#2ecc71" if s >= 70 else "#e74c3c" for s in scores]

    axes[0].barh(labels, scores, color=colors)
    axes[0].set_xlim(0, 100)
    axes[0].set_title("Score by Category (%)")
    axes[0].axvline(x=70, color="gray", linestyle="--", alpha=0.5, label="Pass threshold")
    axes[0].legend()

    total_correct = sum(d["correct"] for d in cats.values())
    total_wrong = summary["questions_answered"] - total_correct
    axes[1].pie(
        [total_correct, total_wrong],
        labels=["Correct", "Wrong"],
        colors=["#2ecc71", "#e74c3c"],
        autopct="%1.1f%%",
        startangle=90,
    )
    axes[1].set_title("Overall Accuracy")

    plt.tight_layout()
    plt.savefig("quiz_results.png", dpi=150)
    plt.show()
```

**🎯 Expected output:** A single figure with a horizontal bar chart on the left and a pie chart on the right, saved as `quiz_results.png`.

**🩹 If it's off:** If only one chart appears, the other axes might be hidden — check that you're indexing `axes[0]` and `axes[1]`, not using `axes` directly. If the figure is squished, increase the `figsize` width (e.g., `(14, 5)`).

## Step 5 — Save results to JSON

A quiz is only useful if you can remember what happened. Saving results to a JSON file means a student can track their progress over days or weeks.

### 5.1 Write load and save helpers

**👟 Starter hint:** Use `json` plus `pathlib.Path`. Create a `HistoryFile` class that loads existing history (or starts fresh) and saves after every quiz. Store a list of quiz sessions, each with a timestamp and its results.

```python
import json
from pathlib import Path
from datetime import datetime

HISTORY_FILE = Path("quiz_history.json")

class HistoryFile:
    def __init__(self, path: Path = HISTORY_FILE):
        self.path = path
        self.sessions: list[dict] = self._load()

    def _load(self) -> list[dict]:
        if not self.path.exists():
            return []
        with self.path.open() as f:
            return json.load(f)

    def save(self) -> None:
        with self.path.open("w") as f:
            json.dump(self.sessions, f, indent=2)

    def add_session(self, results: list[dict], summary: dict) -> None:
        session = {
            "timestamp": datetime.now().isoformat(),
            "num_questions": summary["questions_answered"],
            "accuracy": summary["accuracy"],
            "total_score": summary["total_score"],
            "max_score": summary["max_score"],
            "results": results,
        }
        self.sessions.append(session)
        self.save()
```

**🎯 Expected output:** Running this creates `quiz_history.json` on disk:

```python
history = HistoryFile()
history.add_session(sample, analyse_results(sample))
print(f"Saved {len(history.sessions)} session(s)")
print(f"File exists: {HISTORY_FILE.exists()}")
```

**🩹 If it's off:** If you get `TypeError: Object of type datetime is not JSON serializable`, you're storing the datetime object directly — convert it to a string with `.isoformat()` first. If the file is empty after saving, you're calling `save()` before `add_session()`, or `self.sessions` is being reassigned instead of appended to.

### 5.2 Load and display past sessions

**👟 Starter hint:** Add a method that prints a summary table of all past sessions — timestamp, accuracy, score — so the student can see their progress at a glance.

```python
def show_history(history: HistoryFile) -> None:
    if not history.sessions:
        print("\n  No quiz history yet. Take a quiz first!")
        return

    print(f"\n{'='*60}")
    print(f"  QUIZ HISTORY ({len(history.sessions)} sessions)")
    print(f"{'='*60}")
    for i, session in enumerate(history.sessions, 1):
        ts = session["timestamp"][:10]  # just the date part
        acc = session["accuracy"]
        score = f"{session['total_score']}/{session['max_score']}"
        print(f"  {i}. {ts}  |  {score}  |  {acc}%")
    print(f"{'='*60}")
```

**🎯 Expected output:**

```
============================================================
  QUIZ HISTORY (3 sessions)
============================================================
  1. 2026-09-06  |  35/50  |  70.0%
  2. 2026-09-06  |  40/50  |  80.0%
  3. 2026-09-06  |  45/50  |  90.0%
============================================================
```

**🩹 If it's off:** If `timestamp[:10]` gives you the wrong substring, check that you stored it as an ISO format string, not a `datetime` object. If history shows 0 sessions after adding one, your `add_session` method is creating a new list instead of appending to `self.sessions`.

### 5.3 Verify persistence

**✅ Checklist**

- ✅ After running a quiz and calling `add_session`, `quiz_history.json` exists on disk with valid JSON.
- ✅ Restarting the program and creating a new `HistoryFile` loads the previous sessions.
- ✅ `show_history` displays all past sessions with date, score, and accuracy.
- ✅ Deleting `quiz_history.json` and rerunning doesn't crash — it starts with an empty list.

## Step 6 — CLI interface

The final piece: a menu that ties everything together so a student can interact with the quiz engine without editing code.

### 6.1 Build the main menu

**👟 Starter hint:** Use a `while True` loop with numbered options. Load the engine and history once at startup, then dispatch to the right function based on user input.

```python
def build_default_engine() -> QuizEngine:
    engine = QuizEngine()
    engine.add_question(MultipleChoice("What is 2 + 2?", "math",
                         options=["3", "4", "5", "6"], correct_index=1))
    engine.add_question(MultipleChoice("Capital of France?", "geography",
                         options=["London", "Paris", "Berlin"], correct_index=1))
    engine.add_question(MultipleChoice("Largest planet?", "science",
                         options=["Earth", "Mars", "Jupiter"], correct_index=2))
    engine.add_question(TrueFalse("Python is statically typed.", "python",
                         correct_answer=False))
    engine.add_question(TrueFalse("The Earth orbits the Sun.", "science",
                         correct_answer=True))
    engine.add_question(FillInBlank("The keyword to define a function is ___",
                         "python", accepted_answers=["def"]))
    engine.add_question(FillInBlank("The keyword to import a module is ___",
                         "python", accepted_answers=["import"]))
    engine.add_question(MultipleChoice("Which data structure is FIFO?", "cs",
                         options=["Stack", "Queue", "Tree", "Graph"], correct_index=1))
    return engine

def main():
    engine = build_default_engine()
    history = HistoryFile()

    while True:
        print(f"\n{'='*40}")
        print("  QUIZ ENGINE")
        print(f"{'='*40}")
        print("  1. Take a quiz")
        print("  2. View history")
        print("  3. Quit")
        print(f"{'='*40}")

        choice = input("  Choose (1-3): ").strip()

        if choice == "1":
            num = input("  How many questions? (default 5): ").strip()
            num = int(num) if num.isdigit() else 5
            try:
                questions = engine.build_quiz(num_questions=num)
            except ValueError as e:
                print(f"  Error: {e}")
                continue
            results = run_quiz(engine, questions)
            summary = analyse_results(results)
            plot_results(summary)
            history.add_session(results, summary)
        elif choice == "2":
            show_history(history)
        elif choice == "3":
            print("  Goodbye!")
            break
        else:
            print("  Invalid choice. Enter 1, 2, or 3.")
```

**🎯 Expected output:** Running `main()` shows a menu, lets you take a quiz (with timed questions, scoring, and charts), view past history, or quit. Each quiz is saved automatically.

**🩹 If it's off:** If the menu loops forever without accepting input, you're using `input` inside a `try/except` that swallows `EOFError` — remove the broad exception. If "Take a quiz" crashes with `IndexError`, your `build_quiz` is trying to sample more questions than the bank holds — the `try/except ValueError` around it should catch that.

### 6.2 Add coloured feedback

**👟 Starter hint:** Use ANSI escape codes for terminal colours. Wrap correct/wrong messages in green/red, and add colour to the score summary. No external libraries needed.

```python
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def coloured(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"

def print_feedback(is_correct: bool, points: int) -> None:
    if is_correct:
        print(coloured(f"  Correct! (+{pts} pts)", GREEN))
    else:
        print(coloured(f"  Wrong. (+{pts} pts)", RED))

def print_score_bar(summary: dict) -> None:
    acc = summary["accuracy"]
    bar_length = 30
    filled = int(bar_length * acc / 100)
    bar = "█" * filled + "░" * (bar_length - filled)
    color = GREEN if acc >= 70 else RED
    print(f"\n  {coloured(bar, color)} {acc}%")
    print(f"  Score: {summary['total_score']}/{summary['max_score']}")
```

**🎯 Expected output:** Running `print_score_bar({"accuracy": 75.0, "total_score": 30, "max_score": 40})` prints a coloured progress bar in the terminal — green if ≥70%, red if below.

**🩹 If it's off:** If you see raw escape codes like `[92m` instead of colours, your terminal doesn't support ANSI codes — most modern terminals do, but Windows Command Prompt may need `os.system("")` called once at startup to enable them. If the bar is misaligned, check that `filled` doesn't exceed `bar_length`.

### 6.3 Verify the full application

**✅ Checklist**

- ✅ The menu displays three options and accepts input without crashing.
- ✅ "Take a quiz" runs a timed quiz, scores it, shows charts, and saves results.
- ✅ "View history" shows all past sessions with dates and scores.
- ✅ "Quit" exits cleanly.
- ✅ Coloured feedback appears in the terminal for correct/wrong answers and score bars.
- ✅ Results persist in `quiz_history.json` across program restarts.

## ⚠️ Common pitfalls

- **Forgetting to normalise input.** `"True"` and `"true"` are different strings in Python. Every `check()` method should `.strip().lower()` user input before comparing. The same applies to fill-in-the-blank answers — `"def"` and `"Def"` should both be accepted.
- **Timer drift.** If you compute `time.time() - start` only at the start of each question (not before each answer), the timer won't account for how long the user takes to type. Call `remaining = time_limit - (time.time() - start)` right before each prompt.
- **Mutating the default list.** If `build_quiz` modifies `self.questions` instead of filtering into a new `pool` list, you'll permanently remove questions from the bank. Always use a list comprehension to create a filtered copy.
- **Saving only at exit.** If you only write `quiz_history.json` when the user quits, a crash or `Ctrl+C` loses the entire session. Call `history.save()` inside `add_session`, immediately after appending — same principle as the Wordle stats pattern.
- **`random.sample` vs `random.choices`.** `sample` picks without replacement (each question appears at most once). `choices` picks with replacement (the same question can appear twice in one quiz). Use `sample` unless you explicitly want repeats.

## What you just built

A complete quiz platform: three question types backed by abstract classes, a quiz engine with random selection and timed sessions, automatic scoring with per-category breakdowns, matplotlib visualisations, JSON persistence across sessions, and a coloured CLI menu tying it all together. Every piece builds on core Python — classes, dictionaries, lists, `random`, `time`, `json` — plus pandas and matplotlib for the analysis and visualisation layer.

## Where to go from here

- **Difficulty levels.** Add a `difficulty` attribute to questions (easy/medium/hard) and filter by both category and difficulty when building a quiz.
- **Spaced repetition.** Track which questions were answered wrong and increase their probability of appearing in future quizzes using weighted random sampling.
- **Question import/export.** Let users write question banks as CSV or JSON files and load them at startup, so quizzes can be shared between students.
- **Adaptive quizzes.** Start with easy questions, and only advance to harder ones once the student proves mastery — a simple form of computer-adaptive testing.
- **GUI with Streamlit.** Replace the CLI with a web interface using Streamlit — the same backend logic works, just swap `input()` for Streamlit widgets.
