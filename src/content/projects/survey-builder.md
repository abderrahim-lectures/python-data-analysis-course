---
title: "Build a Survey Builder"
description: "Create surveys with branching logic, collect responses, and analyze the results with pandas and charts."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["classes", "pandas", "statistics", "data-analysis"]
learningObjectives:
  - Model survey questions and branching logic with classes
  - Collect and store structured response data
  - Compute frequency distributions and cross-tabulations
  - Visualize survey results with bar charts and heatmaps
prerequisites:
  - "Python basics (classes, lists, dicts)"
  - "Comfort with `input()` for terminal input"
  - "pandas and matplotlib installed (covered in Setup)"
---

# 📋 Build a Survey Builder

Surveys are everywhere — feedback forms, market research, course evaluations — and behind every one is a structured engine: question types, validation, conditional branching, and analysis. This project builds that engine from scratch: a set of Python classes that model different question types (multiple choice, rating scales, open text), a runner that sequences questions with branching logic, and a pandas pipeline that converts raw responses into frequency charts and cross-tabulations.

This assumes Python basics including classes, lists, and dicts, and comfort with `input()` — nothing beyond. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Model different question types (multiple choice, rating scale, open text) as Python classes with shared validation and branching behavior.
2. Build a `Survey` runner that sequences questions, applies branch rules, and collects responses.
3. Simulate realistic response data when `input()` isn't practical for automated runs.
4. Convert responses to a pandas DataFrame and compute frequency counts, averages, and cross-tabulations.
5. Generate bar charts and heatmaps that make survey results easy to interpret at a glance.

## Where to run this

This project runs almost anywhere — pandas and matplotlib are pure Python, and the only interactive piece is `input()`, which works in any terminal.

**JupyterLite playground** works well — paste the cells directly into a notebook. You'll need to `!pip install pandas matplotlib` in a cell first. Note that `input()` works differently in a notebook than in a terminal — the `simulate_responses()` function in Step 3 exists partly because of this.

**Google Colab** works out of the box — both libraries are pre-installed, and `input()` works natively in notebooks.

**Locally with `uv`** is the recommended path for running the real interactive survey loop (Step 2) where `input()` prompts you question by question — follow the Setup section below.

## Setup

Everything you need before writing a survey question.

### Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

### Set up the project

```bash
uv init survey-builder
cd survey-builder
uv add pandas matplotlib
```

`pandas` turns raw responses into a structured DataFrame for statistics and cross-tabulation; `matplotlib` produces the charts. Both are pure Python (with NumPy underneath), so they install cleanly with `uv`.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `survey-builder/` exists with a `pyproject.toml`, and `pandas` and `matplotlib` are installed.
- ✅ `uv run python -c "import pandas, matplotlib; print('all good')"` prints `all good`.

## Step 1: Define question types

A survey isn't one form — it's a series of different questions, each with its own input format, validation rules, and branching behavior. Modeling each type as a class lets you share the common parts (display, validation, branching) in a base class while customizing the details per type.

### 1.1 Create the base `Question` class and two subclasses

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

mc = MultipleChoice("How often do you exercise?", options=["Daily", "Weekly", "Monthly", "Rarely"])
rating = RatingScale("How satisfied are you?", low_label="Not at all", high_label="Very")
mc.display()
rating.display()
print(f"MC valid '2': {mc.validate('2')} | Rating valid '6': {rating.validate('6')}")
```

**👟 Starter hint:** The base `Question` class does only what's common to every question: store the text, validate (trivially, `True`), and look up a branch rule. `MultipleChoice` and `RatingScale` subclass it and override `display()` and `validate()` — exactly the inheritance pattern that lets a `Survey` runner treat every question the same way. Notice `branch_rules` is a dict mapping an answer to the id of the next question.

**🎯 Expected output:**
```
  How often do you exercise?
    1. Daily
    2. Weekly
    3. Monthly
    4. Rarely

  How satisfied are you?
    1 (Not at all) — 5 (Very)
MC valid '2': True | Rating valid '6': False
```

**🩹 If it's off:** If `MultipleChoice.validate('2')` returns `False`, check that `options` has at least 2 entries — the validation builds `range(1, len(options)+1)`. If `RatingScale.validate('6')` returns `True`, the `scale_max` isn't applied — confirm the `int(answer)` conversion and the `<=` comparison order.

### 1.2 Verify the question classes

**✅ Checklist**

- ✅ `MultipleChoice.validate("2")` is `True`, `validate("5")` is `False` for a 4-option question.
- ✅ `RatingScale.validate("3")` is `True`, `validate("0")` and `validate("6")` are both `False`.
- ✅ You can explain why `MultipleChoice` stores options as a list of strings rather than ints.

**🤔 Socratic Question(s)**

- The `RatingScale` class stores `scale_min` and `scale_max` as class attributes with defaults. If you wanted a 1–10 scale, what would you override at instantiation — and would `validate` need to change?
- `MultipleChoice.validate` builds the valid answer list from `len(self.options)`. What would happen if you had 10 options — would the validation code need to change, or does it scale automatically? Why?

## Step 2: Build the survey runner

A `Question` in isolation is inert. The `Survey` class sequences them, applies branching rules to decide which question comes next, and collects answers into a single `SurveyResponse` object you can analyze later.

### 2.1 Create the `Survey` and `SurveyResponse` classes

```python
from dataclasses import dataclass
from typing import Any, Optional

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

**👟 Starter hint:** The `while idx < len(self.order)` loop walks through questions in order. After each answer, it looks up `next_question_id(answer)` — if the branch rules say "answer 2 jumps to question 'followup'", the index jumps there; otherwise it advances by one. `SurveyResponse.__post_init__` stamps a timestamp when one isn't provided — dataclasses run `__post_init__` right after `__init__`, which is the idiomatic place for default-dependent logic.

**🎯 Expected output:** Running `Survey("Health Survey").run()` prompts question by question and returns a `SurveyResponse` with the collected answers and a timestamp.

**🩹 If it's off:** If the runner gets stuck in an infinite loop, `branch` is likely pointing to a question id that isn't in `self.questions` — the `else idx + 1` fallback only runs when the branch is None or not found, so a mistyped id in `branch_rules` causes the loop to repeat the same question. If `input()` immediately errors in a notebook, you're in a non-interactive cell — use the simulation approach from Step 3 instead.

### 2.2 Verify the survey runner

**✅ Checklist**

- ✅ `Survey.run()` completes and returns a `SurveyResponse` with keys matching your question ids.
- ✅ A required question that receives an invalid answer reprompts, never accepting the bad input.
- ✅ An optional question (`required=False`) accepts an empty answer.

**🤔 Socratic Question(s)**

- The runner uses a `while idx < len(self.order)` loop, not a `for` loop over `self.order`. Why is a `while` loop necessary when a branch instruction can jump the index forward or backward?
- If two questions had the same display text but different ids, how would the survey record distinguish them? What does this suggest about why question ids must be unique?

## Step 3: Collect responses — live and simulated

Real surveys need many responses, but running `input()` 30 times in a terminal is impractical. This step builds both paths: a loop that calls `survey.run()` for live collection, and a `simulate_responses()` function that generates realistic random responses so analysis doesn't depend on someone sitting at a keyboard.

### 3.1 Collect live responses

```python
def collect_responses(survey: Survey, count: int) -> list[SurveyResponse]:
    responses = []
    for i in range(count):
        print(f"\n--- Participant {i + 1} of {count} ---")
        responses.append(survey.run())
    return responses
```

### 3.2 Simulate responses for automated analysis

```python
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

**👟 Starter hint:** `collect_responses` is the live path — call it with a `Survey` and a count and it runs the survey that many times, each producing a `SurveyResponse`. `simulate_responses` is the automated path — it uses `random` to generate 30 plausible responses with the same keys your survey questions would produce. The keys must match your question ids exactly, or the pandas step below won't find the right columns.

**🎯 Expected output:**
```
Collected 30 simulated responses
```

**🩹 If it's off:** If `random.choice([1, 2, 3, 4])` returns a numpy int that breaks downstream code, the values are stored as strings (`str(...)`) — that's deliberate. If you see a `KeyError` when building the DataFrame later, a simulated response is missing a key that your survey questions produce — check that the `simulate_responses` dict keys match your question ids.

### 3.3 Verify response collection

**✅ Checklist**

- ✅ `simulate_responses()` returns a list of 30 dicts, each with the same four keys.
- ✅ Each response's values are strings (not ints), matching what `Survey.run()` would produce from `input()`.
- ✅ `collect_responses` produces a list of `SurveyResponse` objects when given a real `Survey`.

**🤔 Socratic Question(s)**

- Responses are stored as strings (`"2"`, `"4"`) even though they represent numbers. Why does that match reality — what does `input()` return, and how does storing it raw preserve information?
- `simulate_responses` uses `random.choice` for everything. What would the distribution look like if you used `random.randint(1, 4)` instead of `random.choice([1, 2, 3, 4])`? How would that change the analysis?

## Step 4: Analyze results with pandas

The data is collected — now it needs to become insight. This step converts the response list to a DataFrame, maps raw numeric answers to readable labels, and computes frequency counts and averages that answer questions like "how often do people exercise?" and "how satisfied are they, on average?"

### 4.1 Convert to a DataFrame and compute statistics

```python
import pandas as pd

df = pd.DataFrame(responses)

freq_map = {"1": "Daily", "2": "Weekly", "3": "Monthly", "4": "Rarely"}
df["exercise_label"] = df["exercise_freq"].map(freq_map)
exercise_counts = df["exercise_label"].value_counts()
satisfaction_counts = df["satisfaction"].value_counts().sort_index()

print("Exercise Frequency:")
print(exercise_counts)
print(f"\nAverage Satisfaction: {df['satisfaction'].astype(int).mean():.2f}")
```

**👟 Starter hint:** `pd.DataFrame(responses)` turns a list of dicts into rows and columns automatically. `.map(freq_map)` converts the raw `"1"` to the readable `"Daily"` string — this is the classic lookup/recode step in survey analysis. `value_counts()` counts how often each value appears, and `df[...].astype(int).mean()` computes the numeric average by converting the string column to integers first.

**🎯 Expected output:**
```
Exercise Frequency:
Daily         <count>
Weekly        <count>
Monthly        <count>
Rarely        <count>
Name: exercise_label, dtype: int64

Average Satisfaction: <number between 1.0 and 5.0>
```

**🩹 If it's off:** A `KeyError: 'exercise_freq'` means `responses` doesn't have that column — check that `simulate_responses`' keys match `exercise_freq`, `satisfaction`, etc. exactly. If `exercise_counts` is empty, `value_counts()` found only NaN values — check whether `df["exercise_freq"]` is None or NaN in some rows. If `.astype(int)` fails, a response value isn't a clean integer string — check for whitespace or extra characters.

### 4.2 Build a cross-tabulation

```python
cross_tab = pd.crosstab(df["exercise_label"], df["satisfaction"])
print("\nExercise Frequency vs Satisfaction:")
print(cross_tab)
```

**🎯 Expected output:** A 4-row by 5-column table where each cell is the count of respondents with that exercise frequency and that satisfaction score.

**🩹 If it's off:** If `pd.crosstab` returns an error about duplicate indices, you may have duplicate exercise labels — unlikely with a clean `map`, but check for typos in `freq_map`. If the table has NaN cells, `pd.crosstab` handles empty combinations as 0 by default — verify you're not looking at missing data instead of an actual zero-count.

### 4.3 Verify the analysis

**✅ Checklist**

- ✅ `pd.DataFrame(responses)` creates a DataFrame with the same keys as columns.
- ✅ `exercise_counts` shows a frequency distribution across all four labels — no label is ever missing when represented in the data.
- ✅ `pd.crosstab(df["exercise_label"], df["satisfaction"])` produces a non-trivial table (rows > 1).

**🤔 Socratic Question(s)**

- `value_counts()` drops missing values by default, while `crosstab` treats a non-appearing combination as 0. When does that distinction matter — can you think of a case where you'd *want* a missing row to stay missing rather than become 0?
- If you changed the satisfaction scale from 1–5 to 1–10, what code would break? The `crosstab` will automatically show 10 columns — would any other step need changes?

## Step 5: Visualize the results

Numbers in a DataFrame are precise but slow to absorb. Two bar charts — one for exercise frequency, one for satisfaction distribution — turn the counts into an at-a-glance picture.

### 5.1 Build the charts

```python
import matplotlib.pyplot as plt

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

**👟 Starter hint:** `plt.subplots(1, 2, figsize=(12, 5))` creates a single figure with two side-by-side axes. Each `Series.plot(kind="bar", ax=axes[n])` draws onto a specific subplot; the color arrays are ordered so that low satisfaction is red and high satisfaction is green — an intentional visual choice that matches intuitive "red = bad, green = good" associations. `color=colors_sat[:len(satisfaction_counts)]` slices the palette down to the actual number of rating values present, so a survey where nobody chose 5 doesn't show an empty bar.

**🎯 Expected output:** Two bar charts in one figure: exercise frequency on the left (4 colored bars), satisfaction ratings on the right (up to 5 colored bars). The figure saves to `survey_results.png` in your project folder and displays on screen.

**🩹 If it's off:** A blank figure (no bars) means the Series you're plotting is empty — check that `exercise_counts` and `satisfaction_counts` have data. If the satisfaction chart shows only 3 colors but 5 ratings, `satisfaction_counts` has fewer than 5 unique values — that's data, not a bug, and the slice is what keeps the palette aligned. If `plt.show()` shows nothing in a headless environment, the `savefig` still wrote the file — check that one.

### 5.2 Verify the visualization

**✅ Checklist**

- ✅ `survey_results.png` exists in your project folder (or the notebook outputs the figure).
- ✅ Both subplots have titles (`Exercise Frequency`, `Satisfaction Ratings`) and y-axis labels.
- ✅ The satisfaction bars use color ordering that visually communicates low-to-high satisfaction.

**🤔 Socratic Question(s)**

- The color arrays are hardcoded with five hex codes. What would happen if you ran the survey with a 10-point scale — would the colors still map sensibly, or would you need to generate them programmatically?
- `plt.savefig("survey_results.png")` writes to the current directory. What would break if you ran this script from a different working directory, and what does `Path(__file__).parent` give you instead?

## ⚠️ Common pitfalls

- **Question ids don't match response keys.** `Survey.run()` stores answers under the question ids you pass to `add_question`, and `simulate_responses()` returns dicts with hardcoded keys. If the id in `add_question` is `"exercise_freq_x"` but the simulation uses `"exercise_freq"`, your DataFrame will be missing a column. Keep the two in sync — or better, drive the simulation keys from the survey itself.
- **String vs int confusion.** `input()` returns strings, so comments like "`6` isn't in range" are string comparisons. `df["satisfaction"].astype(int).mean()` converts before averaging; a stray non-numeric string (like a blank from an optional question) makes `.astype(int)` throw. Filter or fill NaN before converting.
- **The branch loop can spin forever.** If `branch_rules` maps an answer to a question id that isn't `in self.questions`, the `else idx + 1` doesn't fire and the runner re-asks the same question. Mistyped ids are the classic cause — keep a single source of truth for question ids.
- **`value_counts` drops missing vs `crosstab` counting-0 difference.** A respondent who skips an optional question vanishes from `value_counts()` but appears as a 0 count in `crosstab` only if the category exists elsewhere. Know which behavior your analysis needs before interpreting the chart.

## What you just built

A complete survey platform: type-safe question classes with validation, a branching survey runner, live and simulated response collection, and a pandas-driven analysis pipeline that turns raw answers into frequency counts, averages, cross-tabulations, and side-by-side charts. You also learned the core pattern of any data-analysis workflow: raw → structured → statistics → visualization.

:::tip[Run a fuller version without any local setup]
[`examples/survey-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/survey-builder) in the course repo is a fuller version with a heatmap cross-tabulation, response-filtering functions (show all Daily exercisers and compute their average satisfaction), and multi-level branching. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run it from there.
:::

## Where to go from here

- Add a cross-tabulation heatmap: use `pd.crosstab` + `matplotlib.imshow` (or Seaborn's `heatmap`) to visualize exercise frequency vs. satisfaction as a color grid instead of a number table.
- Add response filtering: write a function that returns only the respondents who chose a specific answer (e.g., all Daily exercisers) and compute their average satisfaction — the filter reveals subgroup insight the aggregate misses.
- Extend branching to multi-level: when answer A on question 1 jumps to question X, and answer B on question X jumps to question Y, your `next_question_id` and `order.index(branch)` logic needs to handle chains of branches, not just single jumps.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓