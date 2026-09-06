---
title: "Data Types"
description: "Identify Python's core types — int, float, str, bool — and understand what each represents."
module: "python-basics"
order: 3
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Identify int, float, str, and bool values"
  - "Use type() to check a value's type"
  - "Understand dynamic typing in Python"
  - "Recognize truthy and falsy values"
prerequisites: ["02-variables"]
tags: ["types", "int", "float", "str", "bool", "dynamic-typing"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Every value has a type

A type is the set a value belongs to — like in math where you distinguish integers from reals:

| Type | Math analogy | Example |
|---|---|---|
| `int` | $\mathbb{Z}$ (integers) | `42`, `-7` |
| `float` | $\mathbb{R}$ (reals, approximated) | `3.14`, `-0.5` |
| `str` | a finite sequence of characters | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

Check a value's type with `type(...)`:

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

## Dynamic typing

Python is **dynamically typed**: a name isn't permanently tied to one type. `x = 5` then `x = "five"` is legal — `x` just points somewhere new:

```python
x = 5
print(type(x))    # <class 'int'>
x = "hello"
print(type(x))    # <class 'str'>
```

This is convenient, but it also means the *type* of a name can only be known by looking at what it currently points to, not by declaring it up front.

## Truthy and falsy values

`bool()` converts any value to `True` or `False`. The rule is simple:

- **Falsy**: `0`, `0.0`, `""` (empty string), `None`
- **Truthy**: everything else

```python
bool(0)         # False
bool(1)         # True
bool(-1)        # True  — any nonzero number is truthy
bool("")        # False
bool("hello")   # True  — any non-empty string is truthy
```

This matters when you write conditions later: `if score:` means "if score is not zero."

## Common pitfalls

- **`4 / 2` is `2.0`, not `2`.** True division (`/`) always returns a `float` in Python 3. Use `4 // 2` for integer division.
- **`True + True` is `2`.** Booleans are subclasses of `int` in Python — `True` behaves like `1` and `False` like `0` in arithmetic.
- **`type()` gives the concrete type.** `type(True)` is `bool`, not `int`, even though `True` acts like `1` in math.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

What is `type(7 / 2)`? Predict it before running it, then check.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>type(7 / 2)</code> is <code>float</code> — true division (<code>/</code>) always produces a float in Python 3, even when both operands are ints and the result is a whole number.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Predict `bool(0)`, `bool(0.0)`, `bool("")`, and `bool("0")`. Which are truthy and which are falsy?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>bool(0)</code> → False, <code>bool(0.0)</code> → False, <code>bool("")</code> → False (empty string), <code>bool("0")</code> → True (non-empty string, even though it contains the character "0").</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

`0.1 + 0.2` in Python does **not** equal exactly `0.3`. Try it. Why might a `float` — which approximates $\mathbb{R}$ using finite binary digits — not represent $0.1$ exactly?

<p class="challenge__answer">💡 <strong>Answer:</strong> 0.1 has no exact representation in binary (just like 1/3 has no exact decimal). Floats use finite binary fractions, so 0.1 + 0.2 accumulates a tiny rounding error: 0.30000000000000004, not 0.3. This is a fundamental limitation of floating-point arithmetic, not a Python bug.</p>

</div>
</details>

## 🤔 Socratic Questions

- If `bool(-1)` is `True`, what single rule explains why `-1` is truthy but `0` is falsy?
- Python has `isinstance(42, int)` which returns `True`. Would `isinstance` be more reliable than `type(x) == int` for checking types? Why or why not?
- Why does Python use `True` and `False` (capitalized) instead of `true` and `false`? What other capitalized words does Python reserve?

## Projects You Can Build

Here are a few real-world projects that reinforce these concepts:

- 💰 **Expense Tracker** - Work with numeric types for amounts, strings for descriptions, and booleans for category flags
- 🎮 **Wordle Clone** - Use different data types to track game state: strings for guesses, integers for attempt counts, booleans for win status
- ✅ **Note-Taking App** - Combine strings for content, lists for tags, and dictionaries for metadata

## ✅ Quick check

<div class="quiz" data-quiz="python-101-types">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What is the type of 3.14?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. What is the result of True + True?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">2</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. Which of these is falsy?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">""</button>
      <button class="quiz-q__opt" data-idx="1">"0"</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">1</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
