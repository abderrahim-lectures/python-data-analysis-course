---
title: "Build a Study-Grade Calculator"
description: "Turn a list of assignment scores into an average and a letter grade, with tests that reject empty input and scores outside 0–100."
difficulty: "beginner"
author: your-id
---

<!--
AUTHOR CHECKLIST — this comment never renders. Delete it before opening a PR.

1. Replace the sample project with your own. Keep the section order used below:
   What you'll do → Where to run this → Setup → Step 1..N → Common pitfalls →
   What you just built → Where to go from here → Share your project → Credit and licence.
   Use `## Step 1: Title` headings; each becomes a click-to-clear step tile.
2. Keep `difficulty` exactly beginner, intermediate, or advanced.
3. Notebook badges: the Colab/Kaggle/Binder links below must point at a real
   notebook. Add examples/YOUR-SLUG/notebook.ipynb before publishing. Run
   `node scripts/generate-notebooks.mjs` to build the English notebook and the
   per-locale twins (notebook.ar.ipynb, notebook.es.ipynb, notebook.fr.ipynb),
   then commit them. Replace YOUR-SLUG in every badge URL.
4. Credit and licence: put your name, profile link and contributor id in the
   final section and keep both licence lines. The lesson text is CC BY 4.0;
   companion code is MIT, matching LICENSE-CONTENT.md.
5. Copy this file to src/content/projects/<your-slug>.md. For the translated
   pages use templates/project.translated.md and keep the English filename.
6. `author: your-id` must be your registered contributor id before this file
   enters src/content/projects/. Copying the template unchanged fails
   tests/unit/contributors.test.ts, which rejects unknown author ids.
-->

# 🧮 Build a Study-Grade Calculator

You have a list of assignment scores and want to know where you stand. A single average summarizes the list; it says nothing about spread, and a careless tool would happily accept an empty list or a score of 120.

Here you will calculate the mean, map it to a letter grade, and make invalid input fail with an error you can read.

This assumes functions, lists, and basic conditionals from Python 101. Nothing from Data Analysis is required. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Calculate the mean of known scores with the standard library.
2. Convert a score to a letter grade with explicit threshold tests.
3. Reject an empty list and scores outside 0–100.
4. Verify every case with plain assertions you can run.

## Where to run this

- **Locally with `uv` (recommended).** The example uses only Python's standard library, so there is nothing to install, and the test file imports `grades.py` from the same folder. The Setup section below walks through it.
- **The course playground.** Paste each complete code chunk into a cell. The functions and the mean calculation work in the browser; keep `test_grades.py` local because it imports across two files.
- **Google Colab, Kaggle Notebooks, or Binder.** The companion notebook mirrors the steps below in order. Colab and Kaggle sessions are temporary, so download anything you want to keep.

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/YOUR-SLUG/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/YOUR-SLUG/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2FYOUR-SLUG%2Fnotebook.ipynb)

## Setup

Create a project folder and two empty Python files:

```bash
uv init study-grade-calculator
cd study-grade-calculator
touch grades.py test_grades.py
```

The test file imports `grades.py`, so run every command below from `study-grade-calculator/`.

**✅ Checklist**

- ✅ `uv --version` prints a version.
- ✅ `grades.py` and `test_grades.py` exist side by side.
- ✅ You can open both files in your editor.

## Step 1: Turn the mean into a function

The arithmetic mean sums the scores and divides by their count. Python's `statistics.mean` already does that; a named function keeps the rest of the project readable.

### 1.1 Calculate the mean

**👟 Starter hint:** Start with three scores whose average you already know: 70, 80, and 90.

```python
# grades.py
from statistics import mean


def average(scores: list[float]) -> float:
    """Return the arithmetic mean of assignment scores."""
    return mean(scores)


if __name__ == "__main__":
    scores = [70, 80, 90]
    print(f"Average: {average(scores):.1f}")
```

`mean` performs the calculation. The `: .1f` format changes only the printed value, not the stored float.

**🎯 Expected output:** `uv run python grades.py` prints `Average: 80.0`.

**🩹 If it's off:** `ModuleNotFoundError` or a missing script means the wrong folder; check `ls grades.py`. A `SyntaxError` usually means the closing quote or parenthesis was not copied.

### 1.2 Check known results

**👟 Starter hint:** Put each expected result in a second file, written as a literal.

```python
# test_grades.py
from grades import average


assert average([70, 80, 90]) == 80
assert average([50]) == 50
print("All Step 1 assertions passed.")
```

The expected values are fixed, so the test cannot inherit a mistake from the function. The one-score case documents a useful boundary.

**🎯 Expected output:** `uv run python test_grades.py` prints `All Step 1 assertions passed.`

**🩹 If it's off:** `ModuleNotFoundError: No module named 'grades'` means the command ran outside the folder holding both files.

### 1.3 Verify

**✅ Checklist**

- ✅ `uv run python grades.py` prints `Average: 80.0`.
- ✅ `uv run python test_grades.py` passes both assertions.
- ✅ `(70 + 80 + 90) / 3` agrees with `80.0`.

**🤔 Socratic Questions**

- Why can two different lists have the same mean?
- What changes if the final assignment counts twice?

## Step 2: Separate the grading policy

A letter grade is a policy over score ranges. Isolating it means the thresholds can be tested and changed without touching the mean.

### 2.1 Implement and test the boundaries

**👟 Starter hint:** Write the highest band first, then test values on both sides of every boundary.

```python
# Append to grades.py
def grade_letter(score: float) -> str:
    """Apply this example's two letter-grade thresholds."""
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    return "C or below"
```

Python checks conditions from top to bottom, so 95 returns `"A"` before reaching the `B` band. Append the tests to `test_grades.py`:

```python
# Append to test_grades.py
from grades import grade_letter


assert grade_letter(79) == "C or below"
assert grade_letter(80) == "B"
assert grade_letter(89) == "B"
assert grade_letter(90) == "A"
print("Step 2 boundaries passed.")
```

Each expected grade is written in the test rather than computed by the function.

**🎯 Expected output:** `uv run python test_grades.py` prints the Step 1 message followed by `Step 2 boundaries passed.`

**🩹 If it's off:** `ImportError: cannot import name 'grade_letter'` means the function was not added to `grades.py`. An `IndentationError` means a `return` is outside its `if`.

### 2.2 Verify

**✅ Checklist**

- ✅ The checks cover 79, 80, 89, and 90.
- ✅ The earlier mean assertions still pass.
- ✅ The highest threshold appears first.

**🤔 Socratic Questions**

- Where should 89.9 land, and who decides?
- What tests would you add for a `D` band?

## Step 3: Reject invalid scores

An empty list has no mean, and this program accepts only scores from 0 to 100. Clear errors separate bad input from a bug in the calculation.

### 3.1 Validate before calculating

**👟 Starter hint:** Validate in a named function and leave the mean calculation unchanged.

```python
# Append to grades.py
def safe_average(scores: list[float]) -> float:
    """Return the mean of valid assignment scores."""
    if not scores:
        raise ValueError("Add at least one score.")
    if any(score < 0 or score > 100 for score in scores):
        raise ValueError("Every score must be between 0 and 100.")
    return average(scores)
```

Invalid input raises before any arithmetic. Valid input flows through the tested `average` function. Append the failure tests:

```python
# Append to test_grades.py
from grades import safe_average


assert safe_average([0, 100]) == 50
for bad_scores in ([], [-1, 80], [80, 101]):
    try:
        safe_average(bad_scores)
    except ValueError:
        pass
    else:
        raise AssertionError(f"Expected ValueError for {bad_scores}")
print("Input validation passed.")
```

The `else` branch runs only when no exception was raised, so a missing error fails the test.

**🎯 Expected output:** `uv run python test_grades.py` prints all three success messages in order. `safe_average([80, 90])` returns `85`.

**🩹 If it's off:** An `AssertionError` here means the validation policy failed. Trace `[]`, `[-1, 80]`, and `[80, 101]` and confirm each reaches its `raise`.

### 3.2 Verify

**✅ Checklist**

- ✅ `[0, 100]`, `[]`, `-1`, and `101` are all covered.
- ✅ A missing exception fails the test.
- ✅ Valid scores give the Step 1 average.

**🤔 Socratic Questions**

- Should a bad score be skipped or rejected? What must be reported either way?
- Which checks would a destructive file operation need instead?

## ⚠️ Common pitfalls

- **An average without context.** Report the score count and consider showing the minimum and maximum before comparing students.
- **Tested output that was never run.** Execute every command from the documented folder and copy the output you actually saw.
- **Silently accepting bad input.** Raise a clear error and test that its absence fails the test.

## What you just built

A small Python program calculates an average, maps it to a grade, and rejects invalid scores. Separate functions keep arithmetic, policy, and validation understandable, and assertion-based tests cover normal, boundary, and invalid input.

The runnable copy belongs in [`examples/YOUR-SLUG/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/YOUR-SLUG) with a README that explains how to run it.

## Where to go from here

1. **Weight the final assignment.** Store a weight with each score and divide the weighted sum by the total weight.
2. **Read a CSV.** Use the standard-library `csv` module and report a missing or malformed row.
3. **Describe the spread.** Add minimum, maximum, and median.

## Share your project with the class

Browse the [student-project gallery](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects), then follow the [project contribution guide](https://pyda-course.online/contributors-guide/) to submit all four language versions.

## 👤 Credit and licence

Written by **[Your Name](https://github.com/your-handle)**, contributor `your-id`.

The lesson text is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and the companion code under the repository's [MIT licence](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/LICENSE).
