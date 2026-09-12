---
title: "Type Conversion"
description: "Convert between int, float, str, and bool explicitly, and understand when conversions fail."
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

## Why would a value need to change set?

You type a birth year into a form. Python's `input()` hands you back a **string**, `"2004"`. But `"2004"` is not a number in any arithmetic sense: try `"2004" + 26` and Python answers `"200426"`, because to a string `+` means *join*, not *add*.

You hold the digits of a number without the number. The set it belongs to is wrong. A value that crossed from the keyboard into a program arrives as text, and text cannot do arithmetic.

So a program constantly needs to **convert** a value from one set to another: from `str` to `int` before computing a year, from `int` to `str` before printing alongside a label. Python gives you four functions for this, one per target set.

## Four conversion functions

Each is named after the set it produces:

```python
int("42")       # 42     — str -> int   "42" was digits, now it's a number
float("3.14")   # 3.14   — str -> float
str(42)         # "42"   — int -> str    the number becomes text
bool(0)         # False  — number -> truth value
```

Reading these out loud says what they are: `str(42)` is "give me the string version of $42$". The function name is the name of the target set, and the parentheses are the conversion machine itself.

## Conversion does not round, it truncates

Now a subtlety that costs beginners real bugs. You want the whole part of $3.9$. What should the answer be?

$$
3.9 = 3 + 0.9
$$

The natural instinct is to round: $4$. Python's `int(3.9)` instead returns **$3$**:

```python
int(3.9)        # 3   — the decimal part is chopped off, not rounded
round(3.9)      # 4   — this is rounding
```

`int()` **truncates**: it discards the fractional part and keeps what remains, moving **toward zero**. The difference shows up once numbers go negative:

```python
int(-3.9)       # -3  — toward zero
import math
math.floor(-3.9)  # -4 — toward negative infinity
```

The number line settles it: truncation walks toward $0$, `math.floor` walks down (toward $-\infty$), and `round` walks to the nearest integer. Choose the one that matches what *you* meant by "the whole part".

## Some conversions must fail

Crossing from one set to another is not always possible. Which of these can you picture working?

```python
int("hello")    # ValueError: invalid literal for int()
int("3.14")     # ValueError: invalid literal for int()  ("3.14" is digits with a dot)
float("hello")  # ValueError: could not convert string to float
```

`"hello"` contains no digits at all, nothing to convert, so Python refuses. `int("3.14")` is trickier: it *has* digits, but the conversion function `int` accepts only a whole literal, and `3.14` is not whole. You must pass through `float` if you want to shrink it:

```python
int(float("3.14"))   # 3  — parse 3.14, truncate to 3
```

Notice the philosophy: Python fails loudly rather than guessing what you meant. A silent guess would corrupt your data; a loud error stops the program so *you* decide.

## The daily trap: `input()` returns a string

Every single time, `input()` returns a `str`, even when the user types `2004`. The number you wanted is still on the other side of a conversion:

```python
year_text = input("Birth year? ")   # str, always
year = int(year_text)                # now it can do arithmetic
print(f"About {2026 - year} years old")
```

Forgetting the conversion is one of the most common early bugs, and here is exactly what forgetting looks like:

```python
age = input("Age? ")
print(age + 1)    # TypeError: can only concatenate str (not "int") to str
```

The error is the machine being honest: `age` sits in $\mathbb{S}$ (strings), and `+` with a string does not mean addition. The lesson is a habit: *if a value came from the outside, convert it before doing math with it.*

## A worked example: the cut-off measurement

A sensor reports `"3.9"` as text, and a display shows whole units only. Two conversions, one intention each:

```python
raw = "3.9"
numeric = float(raw)     # 3.9 — parse the real number
whole = int(numeric)     # 3   — truncate toward zero
print(f"{whole} units")  # 3 units — the .9 is chopped, not rounded
```

The funnel matters because each step is a different promise: `float(...)` turns text into a real value, `int(...)` then chops toward zero, and you never ask one function to do both. Say which promise you mean and the conversion stops surprising you.

## Common pitfalls

- **`int("3.14")` raises an error.** You cannot parse a float string straight into `int()`. Shrink it by hand: `int(float("3.14"))`, or `round(float("3.14"))`.
- **`int()` truncates, `round()` rounds.** `int(4.7)` is `4`, not `5`. Ask yourself which operation you actually describe when you say "convert this to an integer."
- **`float("inf")` is valid.** Python knows infinity: `float('inf')`. Handy in optimization algorithms, startling when it slips into a result you expected to be finite.
- **`int()` and `bool()` truncate and reinterpret silently.** `int(3.9)` quietly chops the fraction; `bool("")` quietly returns `False`. Parsing text fails loudly (`ValueError`), but number-to-number conversions are quiet, those are the ones to double-check.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Predict `int(-7.9)` and `-7.9 // 1`. Are they the same? Explain any difference.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>int(-7.9)</code> is <code>-7</code> (truncates toward zero, chops the decimal part), while <code>-7.9 // 1</code> is <code>-8.0</code> (floors toward negative infinity). They agree for positive numbers and differ for negative ones.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Write a program that asks for a name and a birth year (two separate `input()` prompts), computes an approximate age, and prints a sentence like `"Amina, you are about 21 years old."`

<p class="challenge__answer">💡 <strong>Answer:</strong> Read name and birth year with two <code>input()</code> calls, convert the year with <code>int()</code>, subtract from the current year (e.g. <code>2026</code>), and print with an f-string: <code>print(f"{name}, you are about {2026 - year} years old.")</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Without running it, compute `15 // 4` and `15 % 4` by hand, then verify whether $4 \cdot (15 // 4) + (15 \% 4)$ reproduces $15$.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>15 // 4</code> is <code>3</code> (the floor of $3.75$), and <code>15 % 4</code> is <code>3</code>, since $15 = 4 \cdot 3 + 3$. Together <code>4 * 3 + 3 = 15</code>, the division identity $\text{dividend} = \text{divisor} \cdot \text{quotient} + \text{remainder}$.</p>

</div>
</details>

## 🤔 Socratic Questions

- `input()` always returns a `str`. What goes wrong with `age + 10` if you skip converting first? What does the error message actually tell you?
- To convert `"3.14"` to an integer, why does `int("3.14")` fail but `int(float("3.14"))` work? What is the intermediate step doing?
- Python has `math.floor()` and `math.ceil()`. How do they differ from `int()` for negative numbers? When would you pick one over the others?

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