---
title: "Build a Course Builder"
description: "Create online courses with modules, quizzes, progress tracking, and completion certificates."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "dataclasses", "json", "stdlib"]
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries)"
learningObjectives:
  - "Model a course as nested dataclasses and load it from JSON"
  - "Track per-student lesson completion and compute percentages"
  - "Score quizzes against an answer key with a pass threshold"
  - "Render a text dashboard of progress and quiz grades"
  - "Generate a completion certificate only when the course is finished"
---

# 🎓 Build a Course Builder

A course is, under the surface, just structured data: modules made of lessons, lessons with content, and students with a set of completed checkpoints. This project builds the engine behind an online course platform — a set of Python classes and functions that load a course from JSON, track a real student's progress through it, score their quizzes against an answer key, print a progress dashboard, and finally issue a completion certificate when — and *only* when — the course is actually finished. No browser, no database: just the data model and the rules that live on top of it.

This assumes Python 101 — functions, dictionaries, and a comfortable `json` import. Nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Model a course as `Lesson`, `Module`, and `Course` dataclasses and load one from a JSON file.
2. Track a student's completed lessons and compute module and course completion percentages.
3. Score a quiz against an answer key and judge pass/fail against a threshold.
4. Print a dashboard showing module progress and quiz grades for one student.
5. Generate a text certificate, refusing politely when the course isn't complete.

## Where to run this

**Locally with `uv`** is the recommended path — this project is pure standard library (dataclasses, JSON, `datetime`), so setup is one command, and the local CLI is where you'll point it at *your* course file.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work fine for the data-modeling half of this project — the notebook at [`examples/course-builder/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.ipynb) runs every step on a bundled sample course. The honest note: certificate *files* (`certificate.txt`) save cleanly in a notebook, but the code is identical either way.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcourse-builder%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the "install Python, then pip, then a virtual environment tool" chain — and this project needs no third-party packages, so setup is genuinely short.

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

Then set up the project:

```bash
uv init course-builder
cd course-builder
```

Everything used from here on — `dataclasses`, `json`, `datetime` — is built into Python, so there is no `uv add` step.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `course-builder/` exists with a `pyproject.toml`.
- ✅ `python -c "from dataclasses import dataclass"` succeeds.

## Step 1: Model a course with dataclasses

A course has a clean hierarchy — a course *contains* modules, each module *contains* lessons — and Python's `dataclasses` exist to turn exactly that into typed, self-documenting objects. JSON, meanwhile, is the actual interchange format courses travel in. This step makes the two meet: a `Course` you can build in Python and load back from a file.

### 1.1 Write the three dataclasses and a JSON loader

**👟 Starter hint:** Define tiny `Lesson`, `Module`, and `Course` dataclasses — nested with a `default_factory` — then `load_course`, which reads JSON and rehydrates the classes with a list comprehension:

```python
# models.py
from dataclasses import dataclass, field
import json

@dataclass
class Lesson:
    title: str
    minutes: int

@dataclass
class Module:
    title: str
    lessons: list[Lesson] = field(default_factory=list)

@dataclass
class Course:
    title: str
    modules: list[Module] = field(default_factory=list)

def load_course(path: str) -> Course:
    with open(path) as f:
        data = json.load(f)
    modules = [
        Module(title=m["title"], lessons=[Lesson(**l) for l in m["lessons"]])
        for m in data["modules"]
    ]
    return Course(title=data["title"], modules=modules)

if __name__ == "__main__":
    sample = {
        "title": "Python 101",
        "modules": [
            {"title": "Basics", "lessons": [
                {"title": "Variables", "minutes": 12},
                {"title": "Loops", "minutes": 15},
            ]},
            {"title": "Functions", "lessons": [
                {"title": "def and return", "minutes": 10},
            ]},
        ],
    }
    with open("course.json", "w") as f:
        json.dump(sample, f, indent=2)
    course = load_course("course.json")
    print(course.title)
    for module in course.modules:
        print(f"- {module.title}: " + ", ".join(l.title for l in module.lessons))
```

`Lesson(**l)` is the deliberate trick: each JSON dict under `lessons` has exactly the same keys as the `Lesson` dataclass fields, so the `**` unpacking maps them position-by-name for free. The `field(default_factory=list)` on the *containers* matters because of a classic dataclass trap — a bare `= []` default would be shared by every `Module` and `Course` instance ever created.

**🎯 Expected output:**

```
Python 101
- Basics: Variables, Loops
- Functions: def and return
```

**🩹 If it's off:** A `TypeError: __init__() got an unexpected keyword argument` from `Lesson(**l)` means a JSON dict has a key that doesn't match a field (a typo like `minuts`) — align the JSON keys with the field names. If every module seems to share one lesson list, you used `= []` instead of `field(default_factory=list)` — that's the shared-mutable-default bug made concrete.

### 1.2 Verify the model

**✅ Checklist**

- ✅ `load_course("course.json")` produces three objects whose `title` attributes print as above.
- ✅ `course.modules[0].lessons` is a length-2 `list[Lesson]`, not a list of dicts.
- ✅ Adding a second `Module()` with no arguments does *not* share the first module's lessons list.

**🤔 Socratic Question(s)**

- Why is a JSON `{"title": "Variables", "minutes": 12}` dict "the same shape" as a `Lesson` dataclass, and what happens the day a course file ships a *new* field that the dataclass doesn't know about — where does that fail, and how loudly?
- The dataclass stores `minutes` per lesson. Who should compute "total minutes", the class or the code printing a report, and what's the argument for keeping `Course` a pure data holder?

## Step 2: Track student progress

Students need per-student state — *which* lessons they've completed — separate from the course definition. Lean and correct here means: the course object never changes per student; instead a `ProgressTracker` owns a `set` of `(module_index, lesson_index)` pairs and answers the question "what percent is done?" with a little counting.

### 2.1 Write the tracker

**👟 Starter hint:** One class with three methods — `complete_lesson` (storing a tuple key), `module_percent`, and `course_percent` — then drive it with the course from Step 1:

```python
# progress.py
from models import Course

class ProgressTracker:
    def __init__(self, course: Course, student: str):
        self.course = course
        self.student = student
        self.completed: set[tuple[int, int]] = set()

    def complete_lesson(self, module_index: int, lesson_index: int) -> None:
        self.completed.add((module_index, lesson_index))

    def module_percent(self, module_index: int) -> float:
        lessons = self.course.modules[module_index].lessons
        done = sum(1 for (mi, _) in self.completed if mi == module_index)
        return 100.0 * done / len(lessons)

    def course_percent(self) -> float:
        total = sum(len(m.lessons) for m in self.course.modules)
        return 100.0 * len(self.completed) / total

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    tracker.complete_lesson(0, 0)
    tracker.complete_lesson(0, 1)
    print(f"{tracker.student}: {tracker.course_percent():.0f}% complete")
    print(f"Module 0: {tracker.module_percent(0):.0f}% | Module 1: {tracker.module_percent(1):.0f}%")
```

A `set` is the right data structure twice over: re-marking the same lesson is a *no-op* (idempotent — calling `complete_lesson(0, 0)` twice still counts once), and `len(self.completed)` is the course-wide total for free, because no tuple can appear twice. The sum inside `module_percent` over `self.completed` computes "how many completed pairs belong to this module" without any separate per-module bookkeeping.

**🎯 Expected output:**

```
Ada: 67% complete
Module 0: 100% | Module 1: 0%
```

**🩹 If it's off:** If percentages come out as floats like `66.66666666666666`, that's diagnostic, not broken — it means you printed the float without the `:.0f` format; format it. If marking the same lesson twice inches a percentage upward, the storage isn't a `set` — a `list` of tuples re-counts duplicates.

### 2.2 Verify tracking

**✅ Checklist**

- ✅ Completing both Basics lessons makes `course_percent()` print `67%` and `module_percent(0)` print `100%`.
- ✅ Calling `complete_lesson(0, 0)` twice does not raise or inflate the count.
- ✅ A fresh tracker on the same course reports `0%`, proving progress is per-student state.

**🤔 Socratic Question(s)**

- Why is progress stored as *coordinates* (`(module 0, lesson 1)`) instead of lesson titles? What happens to the coordinate-based system if a lesson is renamed — and would title-based tracking survive that?
- The tracker knows nothing about modules except their index. What would change if a course inserted a *new* module at the front — two weeks after students started, with their `completed` sets already full? Is a coordinate-based key robust to that?

## Step 3: Score quizzes

Progress answers "did they read it?", quizzes answer "does it stick?". A quiz is a set of questions — prompt, choices, the index of the correct answer — and grading is a `zip` over the student's answers comparing each to the key. The pass/fail decision then applies a threshold to the ratio.

### 3.1 Write the question model and grader

**👟 Starter hint:** A `Question` dataclass, a `score_quiz` that zips given answers against the key into a list of booleans, and a `passed` helper that compares earned-to-total against a mark:

```python
# quizzes.py
from dataclasses import dataclass

@dataclass
class Question:
    prompt: str
    choices: list[str]
    answer_index: int
    points: int = 1

def score_quiz(questions: list[Question], answers: list[int]) -> tuple[int, int, list[bool]]:
    """Returns (earned, total, per-question correctness)."""
    correct = [given == q.answer_index for q, given in zip(questions, answers)]
    earned = sum(q.points for q, ok in zip(questions, correct) if ok)
    total = sum(q.points for q in questions)
    return earned, total, correct

def passed(results: tuple[int, int, list[bool]], pass_mark_pct: int = 70) -> bool:
    earned, total, _ = results
    return 100 * earned / total >= pass_mark_pct

if __name__ == "__main__":
    quiz = [
        Question("What is 2+2?", ["3", "4", "5"], 1),
        Question("Which type is a boolean?", ["int", "bool", "str"], 1),
    ]
    results = score_quiz(quiz, [1, 1])
    print(f"score: {results[0]}/{results[1]}")          # 2/2
    print("passed at 70%:", passed(results))             # True
    print("passed at 100%:", passed(results, 100))       # False
```

`zip` is doing the honest work: it pairs each question with the student's corresponding answer *positionally*, and the one-line list comprehension turns that pairing into correctness flags. Worth noticing is that `score_quiz` returns *three* things — earned, total, and per-question flags — because a grader that only reports a number is useless for telling a student *where* they went wrong; the flags power the "retake" verdict later.

**🎯 Expected output:**

```
score: 2/2
passed at 70%: True
passed at 100%: False
```

**🩹 If it's off:** A wrong `score: 0/2` with correct-looking answers usually means the `answers` list indexes are off by one — answers are given as *choice indexes* (`1` = "4"), not choice text. If `passed at 100%` prints `True` for a 2/2... that's right; make a real mistake case, or check the comparison operator — `>=` vs `>` changes whether exactly-70% passes.

### 3.2 Verify the grader

**✅ Checklist**

- ✅ A perfect quiz prints `score: 2/2` and your `passed()` call returns `True` at every reasonable threshold.
- ✅ The per-question correctness list can tell you exactly which question the student missed.
- ✅ `passed()` with one wrong answer on a two-question quiz returns `False` at 70%.

**🤔 Socratic Question(s)**

- `score_quiz` returns correctness flags *and* a score. If a UI builds its "review your answers" screen from `correct`, what would it break if you simplified the return to just `(earned, total)` — and is that a design regression or a fine simplification for a small project?
- `passed` compares a percentage to a threshold. Why might a 10-question quiz where the threshold is 70% behave surprisingly with this exact integer math (hint: try to engineer a score that *rounds* to exactly 70%)?

## Step 4: Build the dashboard

The separate pieces — course, progress, quizzes — need a single read surface: the dashboard. It's the "product view" of everything built so far, rendering module status, percentages, and quiz results into one terminal panel, and it introduces the small idea of turning a number into a *status word* ("done"/"active"/"todo").

### 4.1 Render the dashboard

**👟 Starter hint:** One `render_dashboard` function that formats headers with `"=" * 40`, maps each module's percentage to a status label, and grades each stored quiz result via the `passed` helper:

```python
# dashboard.py
from progress import ProgressTracker
from quizzes import passed

def _status(pct: float) -> str:
    if pct == 100.0:
        return "done"
    if pct > 0:
        return "active"
    return "todo"

def render_dashboard(tracker: ProgressTracker, quiz_results: dict[str, tuple[int, int, list[bool]]]) -> None:
    print(f"Dashboard for {tracker.student}")
    print("=" * 40)
    for i, module in enumerate(tracker.course.modules):
        pct = tracker.module_percent(i)
        print(f"[{_status(pct):>6}] {module.title}: {pct:.0f}%")
    print("-" * 40)
    for name, (earned, total, _) in quiz_results.items():
        grade = "pass" if passed((earned, total, [])) else "retake"
        print(f"Quiz '{name}': {earned}/{total}  {grade}")
    print("=" * 40)
    print(f"Course complete: {tracker.course_percent():.0f}%")

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    tracker.complete_lesson(0, 0)
    tracker.complete_lesson(0, 1)
    render_dashboard(tracker, {"Basics quiz": (1, 2, [])})
```

The status helper is a tiny piece of "rendering logic" — it turns a float into a word so the screen reads like a product rather than a spreadsheet. `quiz_results` comes in as a *dict* keyed by quiz name because the dashboard is read-only: it shows each quiz's stored earned/total and re-judges the pass verdict on display, rather than mutating any quiz state.

**🎯 Expected output:**

```
Dashboard for Ada
========================================
[  done] Basics: 100%
[  todo] Functions: 0%
----------------------------------------
Quiz 'Basics quiz': 1/2  retake
========================================
Course complete: 67%
```

**🩹 If it's off:** If a module that's 0% prints as `[  done]`, the `== 100.0` comparison in `_status` is running on an unformatted float that barely misses — percentages are computed as floats, so compare against `100.0` exactly as written. If the `Quiz 'Basics quiz'` line shows a pass that contradicts your grader, the `tuple` being passed to `passed()` has `average` swapped with `earned` — keep the `(earned, total, flags)` order consistent everywhere.

### 4.2 Verify the dashboard

**✅ Checklist**

- ✅ The dashboard header names the student and both module rows show the expected status words.
- ✅ Quiz results render as `X/Y` with a `pass` or `retake` verdict that matches Step 3's grader on the same numbers.
- ✅ `render_dashboard` prints without error for an empty `quiz_results` dict.

**🤔 Socratic Question(s)**

- `render_dashboard` adds the header/status/verdict polish, but it doesn't change any tracker state. Why is keeping *rendering* separate from *mutating* a design worth defending as the course grows a `--json` output flag?
- The `tuple[int, int, list[bool]]` type recurs everywhere a quiz result moves around. What would change if a quiz result became a `@dataclass` — where does a bare tuple stop being expressive enough?

## Step 5: Certificates — earned, not assumed

A certificate that prints whenever asked is worthless; one that prints *only when the course is complete* is meaningful. The final step enforces the invariant at the boundary: build the certificate text, but refuse with a clear reason if `course_percent()` hasn't reached 100.

### 5.1 Write `build_certificate`

**👟 Starter hint:** Guard with an early `raise ValueError` using a precise message, then build the certificate with the tracker's real data and today's date:

```python
# certificate.py
from datetime import date

from progress import ProgressTracker

def build_certificate(tracker: ProgressTracker) -> str:
    pct = tracker.course_percent()
    if pct < 100.0:
        raise ValueError(
            f"{tracker.student} is only {pct:.0f}% complete -- finish the course first."
        )
    module_line = ", ".join(m.title for m in tracker.course.modules)
    return f"""
================================================
            COURSE COMPLETION CERTIFICATE
================================================

  This certifies that

        {tracker.student}

  has completed the course

        {tracker.course.title}

  covering: {module_line}

  Date: {date.today().isoformat()}
  Signature: Course Instructor
================================================
"""

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    for mi, module in enumerate(tracker.course.modules):
        for li in range(len(module.lessons)):
            tracker.complete_lesson(mi, li)
    with open("certificate.txt", "w") as f:
        f.write(build_certificate(tracker))
    print("Wrote certificate.txt")
```

Every rule in this project converges on this guard. The `if pct < 100.0: raise` is a *business invariant enforced in code* — no path prints a certificate for an 89%-complete course, because the guard sits before any of the certificate text is even assembled. `date.today().isoformat()` gives you a real, sortable date string with no string formatting at all, and the `__main__` block walks modules-by-index to mark everything complete — the same coordinate key the tracker has understood since Step 2.

**🎯 Expected output:** `Wrote certificate.txt` — and opening `certificate.txt` shows the ASCII certificate with `Ada`, `Python 101`, the module list, today's date, and a signature line.

**🩹 If it's off:** A `ValueError` saying `finish the course first` is *correct behavior* for an incomplete course — complete the loop in `__main__` fully (both modules) if you want a certificate. If the certificate prints the module titles in the wrong order, `tracker.course.modules` is being iterated over a list you mutated between load and print — reload the course fresh in the demo.

### 5.2 Verify the certificate rule

**✅ Checklist**

- ✅ Completing every lesson of the course writes `certificate.txt` and prints `Wrote certificate.txt`.
- ✅ Removing one `complete_lesson` call makes the same script raise `ValueError` before writing any file.
- ✅ The certificate contains the student's real name, the real course title, and today's date — nothing hardcoded.

**🤔 Socratic Question(s)**

- The guard raises `ValueError`. What would change if a caller silently *caught* that error to print "in progress" instead — is raising the honest choice, or is a return value like `None` more forgiving for UI code?
- `build_certificate` computes the percent *itself* rather than trusting a `fully_complete` bool passed in. Why is checking the derived truth more robust than trusting a flag that could be set optimistically?

## ⚠️ Common pitfalls

- **Shared mutable defaults.** `lessons=[]` on a dataclass field is evaluated *once* — every `Module()` shares one list, so adding a lesson to one module "appears" in all. Always `field(default_factory=list)`.
- **Storing progress as titles, not coordinates.** Renaming "Loops" resets every student who completed it. Tuples of indexes survive renames and serialization identically.
- **Answer keys as strings vs. indexes.** Grading `answers = ["4", "bool"]` against a key of integers never matches. Decide once that choices are identified by *index*, and keep the grader comparisons index-to-index.
- **Comparing floats exactly.** `pct == 100` where `pct` is `99.9999999` from float arithmetic returns `False`. Compare with `< 100.0` for the guard and a `>=` for pass marks, as the code above does.
- **Letting any code print secrets or certificates early.** Like the certificate guard, every "meaningful only if earned" artifact deserves a boundary check before text is built — the same instinct that keeps `config-manager` (this course's companion project) from printing secrets.

## What you just built

A working course engine: nested dataclasses hydrated from JSON, per-student progress tracking with idempotent completion, a quiz grader with a pass threshold, a readable dashboard, and an earned-not-assumed certificate — all standard library, all runnable from a terminal. The transferable skill is *modeling a real-world domain in data structures and invariants*: turning "a student finished their course" from a vibe into a verifiable `course_percent() == 100.0`, enforced by code rather than goodwill.

:::tip[Run a fuller version without any local setup]
[`examples/course-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/course-builder) in the course repo has these complete scripts plus a sample `course.json`. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Write progress to disk as JSON (`tracker.completed` is already a serializable set of tuples) so a student can close the terminal and resume — the persistence layer over an already-clean model.
- Add a `Course` factory that *validates* JSON on load (unique lesson titles, non-negative minutes) instead of trusting the file — cheap insurance that reuses Step 1's shapes.
- Print the certificate as a **PDF** by hand-emitting a minimal valid PDF, or go the pragmatic route and render Markdown that a course platform renders.
- Add a second student and let the dashboard accept `--student ada|grace` — you'll discover progress is fully decomposed from the course (Step 2 did that on purpose).

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓