---
title: "Type Conversion"
description: "Convert between int, float, str, and bool explicitly — and understand when conversions fail."
module: "python-basics"
order: 4
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Convert values with int(), float(), str(), and bool()"
  - "Understand truncation vs rounding"
  - "Recognize when conversions raise ValueError"
  - "Handle input() return type correctly"
prerequisites: ["03-data-types"]
tags: ["conversion", "casting", "int", "float", "str", "input"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Explicit conversion functions

Python provides `int(...)`, `float(...)`, `str(...)`, and `bool(...)` to convert between types:

```python
int("42")       # 42        — str -> int
int(3.9)        # 3         — float -> int, truncates (does NOT round!)
float("3.14")   # 3.14      — str -> float
str(42)         # "42"      — int -> str
bool(0)         # False     — 0 (and 0.0, and "") are "falsy"
bool(1)         # True      — any nonzero number (and non-empty string) is "truthy"
```

## Truncation vs rounding

`int(3.9)` gives `3`, not `4` — conversion to `int` always **truncates toward zero** (chops off the decimal part). It never rounds:

```python
int(3.9)        # 3  — truncates
int(-3.9)       # -3 — truncates toward zero, not toward negative infinity
round(3.9)      # 4  — this is rounding
```

The distinction matters for negative numbers: `int(-3.9)` is `-3` (toward zero), while `math.floor(-3.9)` is `-4` (toward negative infinity).

## When conversions fail

Not every conversion is possible:

```python
int("hello")    # ValueError: invalid literal for int()
int("3.14")     # ValueError: invalid literal for int() — use float() first
float("hello")  # ValueError: could not convert string to float
```

Python fails loudly here rather than silently guessing — a design choice you'll come to appreciate once you're debugging real data.

## The input() gotcha

`input()` **always returns a `str`**, even if the user typed a number:

```python
age_text = input("How old are you? ")   # always a string
age = int(age_text)                      # convert explicitly
print(f"In 10 years you'll be {age + 10}")
```

Forgetting this conversion is one of the most common early bugs:

```python
age = input("Age? ")
print(age + 1)    # TypeError: can only concatenate str (not "int") to str
```

## Common pitfalls

- **`int("3.14")` raises an error.** You can't parse a float string directly with `int()`. Use `int(float("3.14"))` or `round(float("3.14"))`.
- **`int()` truncates, not rounds.** `int(4.7)` is `4`, not `5`. Use `round()` when rounding is what you want.
- **`float("inf")` is valid.** Python represents infinity as `float('inf')` — useful in some algorithms, but can surprise you.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body>

Predict `int(-7.9)` and `-7.9 // 1`. Are they the same? Explain any difference.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>int(-7.9)</code> is <code>-7</code> (truncates toward zero — chops off the decimal part), while <code>-7.9 // 1</code> is <code>-8.0</code> (floors toward negative infinity). They agree for positive numbers but disagree for negative ones.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a program that asks for a name and a birth year (two separate `input()` prompts), computes an approximate age, and prints a sentence like `"Amina, you are about 21 years old."`

<p class="challenge__answer">💡 <strong>Answer:</strong> Read name and birth year with two <code>input()</code> calls, convert the year to <code>int</code>, subtract from the current year (e.g. <code>2026</code>), and print with an f-string: <code>print(f"{name}, you are about {2026 - year} years old.")</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body>

Without running it, compute `15 // 4` and `15 % 4` by hand. Then verify: does `4 * (15 // 4) + (15 % 4)` equal `15`?

<p class="challenge__answer">💡 <strong>Answer:</strong> 15 // 4 is 3 (floor of 3.75), and 15 % 4 is 3 (since 15 = 4·3 + 3). Together: 4 × 3 + 3 = 15. This is the division algorithm identity.</p>

</div>
</details>

## 🤔 Socratic Questions

- `input()` always returns a `str`. What would go wrong if you tried `age + 10` without first converting `age = int(input(...))`? What does the error message actually tell you?
- If you want to convert `"3.14"` to an integer, why does `int("3.14")` fail but `int(float("3.14"))` work? What's the intermediate step doing?
- Python has `math.floor()` and `math.ceil()`. How do they differ from `int()` for negative numbers? When would you choose one over the other?

## Projects You Can Build

Here are a few real-world projects that reinforce these concepts:

- 💰 **Expense Tracker** - Convert user input strings to floats for calculations and format results back to strings
- 🎮 **Wordle Clone** - Convert attempt numbers to strings for display and handle type mismatches in user input
- 🔒 **Password Generator** - Convert random character selections and validate input types for length parameters

## ✅ Quick check

<div class="quiz" data-quiz="python-101-conversion">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What is int(4.7)?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">4</button>
      <button class="quiz-q__opt" data-idx="2">4.7</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. What does input("Name: ") always return?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. What happens with int("3.14")?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">ValueError</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">4</button>
      <button class="quiz-q__opt" data-idx="3">3.14</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
