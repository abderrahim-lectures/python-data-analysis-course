---
title: "Comparison Operators"
description: "Test equality, inequality, and order — plus chain comparisons in a single expression."
module: "operators"
order: 6
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Use ==, !=, <, <=, >, >= to compare values"
  - "Chain comparisons like 0 <= x < 10"
  - "Understand how == differs from is"
  - "Compare values of different types"
prerequisites: ["05-arithmetic"]
tags: ["comparison", "equality", "chaining", "bool"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Six comparison operators

Comparison operators produce a `bool` — `True` or `False`:

```python
5 == 5      # True   — equal
5 != 3      # True   — not equal
5 < 10      # True   — less than
5 <= 5      # True   — less than or equal
5 > 10      # False  — greater than
5 >= 5      # True   — greater than or equal
```

## Chained comparisons

Python lets you chain comparisons the way you would in math:

```python
x = 5
0 <= x < 10    # True — both conditions hold
0 <= x < 3     # False — x < 3 fails
```

This is evaluated as a single expression, not two separate ones joined by `and`. It's equivalent to `0 <= x and x < 10`, but reads more naturally.

## `==` vs `is`

`==` tests **value equality** — do these two things have the same content?
`is` tests **identity** — are these the exact same object in memory?

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b    # True  — same content
a is b    # False — different objects

c = a
a is c    # True  — same object
```

**Rule of thumb:** always use `==` for value comparison. Only use `is` when checking for `None`:

```python
if x is None:    # correct
if x == None:    # works but non-idiomatic
```

## Comparing different types

Python allows comparing values of different types, but the result may be surprising:

```python
5 == 5.0      # True  — int and float compared numerically
"5" == 5      # False — string and int are never equal
"5" < 6       # TypeError: '<' not supported between str and int
```

In Python 3, ordering comparisons (`<`, `>`) between incompatible types raise a `TypeError`. Only `==` and `!=` work across types.

## Common pitfalls

- **`=` vs `==`.** `if score = 60:` is a syntax error — Python won't let you assign inside a condition by accident. Use `==`.
- **Floating-point comparison.** `0.1 + 0.2 == 0.3` is `False` due to floating-point imprecision. Use `abs((0.1 + 0.2) - 0.3) < 1e-10` instead.
- **`==` with `None`.** `x == None` works but `x is None` is the Pythonic way.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body>

Predict the result of each without running: `5 == 5.0`, `"5" == 5`, `5 < "6"`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>5 == 5.0</code> → True (numeric equality), <code>"5" == 5</code> → False (different types), <code>5 < "6"</code> → TypeError (ordering between int and str is not allowed in Python 3).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a chained comparison that checks whether a number `n` is between 1 and 100 inclusive, using a single expression (no `and`).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>1 <= n <= 100</code> — Python's chained comparison makes this read like mathematical notation.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Why does `0.1 + 0.2 == 0.3` evaluate to `False`? How would you write a correct floating-point equality test?

<p class="challenge__answer">💡 <strong>Answer:</strong> 0.1 and 0.2 have no exact binary representation, so their sum is 0.30000000000000004, not exactly 0.3. Correct test: <code>abs((0.1 + 0.2) - 0.3) < 1e-10</code> — check if the difference is within a tiny tolerance.</p>

</div>
</details>

## 🤔 Socratic Questions

- If `a == b` is `True`, does that mean `a is b` must also be `True`? Under what circumstances can two objects be equal but not identical?
- Why does Python forbid `5 < "6"` but allow `5 == "5.0"` to be `False`? What design principle is at work?
- In what scenarios might `is` be more useful than `==` for checking equality? (Think about singletons like `None`.)

## ✅ Quick check

<div class="quiz" data-quiz="python-101-comparison">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. What is 5 == 5.0?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">TypeError</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. What does 0 <= 5 < 10 evaluate to?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">False</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. Which is the Pythonic way to check if x is None?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x == None</button>
      <button class="quiz-q__opt" data-idx="1">x is None</button>
      <button class="quiz-q__opt" data-idx="2">x = None</button>
      <button class="quiz-q__opt" data-idx="3">None is x</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
