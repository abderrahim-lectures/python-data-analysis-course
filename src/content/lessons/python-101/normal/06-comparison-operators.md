---
title: "Comparison Operators"
description: "Test equality, inequality, and order, plus chain comparisons in a single expression."
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

## The computer, asked to decide

An evaluation `2 + 3` produces a number. But most of what a program needs to know is not a number, it is a *decision*. Is the score passing? Is the username taken? Is the temperature within range? Comparison operators are the branch of the arithmetical family that produces an answer out of the set $\{\mathrm{True}, \mathrm{False}\}$ instead of out of $\mathbb{R}$.

## The six comparison operators

Each compares two values and yields a `bool`:

```python
5 == 5      # True   — equal
5 != 3      # True   — not equal
5 < 10      # True   — less than
5 <= 5      # True   — less than or equal
5 > 10      # False  — greater than
5 >= 5      # True   — greater than or equal
```

In mathematics you would write these as $\leq$, $\geq$, $\neq$; Python opts for the ASCII-friendly `<=`, `>=`, `!=`. The meaning is unchanged. The double-equals `==` requires a deliberate pause: it is the question *"are these equal?"*, while a single `=` is an order to assign. The doubled sign is what prevents them from ever colliding.

## Chain comparisons like a mathematician

Suppose $x$ belongs to the interval $[0, 10)$. On paper you write the three-part condition in one breath, $0 \leq x < 10$. Python lets you write it exactly that way:

```python
x = 5
0 <= x < 10    # True — both conditions hold
0 <= x < 3     # False — the second fails
```

This is a single expression, evaluated by the same pairing you would read: $0 \leq x$ and then $x < 10$, except the middle value is computed only once. Chained comparison is the same as $0 \leq x$ `and` $x < 10$, but the chained form reads like the mathematics it came from.

## `==` asks about content; `is` asks about identity

Two questions sound alike and answer differently:

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b    # True  — same content
a is b    # False — different objects in memory

c = a
a is c    # True  — the same object
```

`==` compares the values carried; `is` compares the memory locations. There are several boxes that happen to hold the same list; there is only one object. The two coincide for small things (like Python's cached small integers) and diverge for everything else, so the rule of thumb is steady: use `==` for content, and reserve `is` for the single singleton which has no content to compare, `None`:

```python
if x is None:    # correct
if x == None:    # works, but you are asking the wrong question
```

## Comparing across types

Bringing values of different sets into a comparison, $\mathbb{Z}$ versus $\mathbb{S}$, follows a fixed policy:

```python
5 == 5.0      # True  — numeric equality is type-ignorant
"5" == 5      # False — a string and an int are never equal
"5" < 6       # TypeError: '<' not supported between str and int
```

Two rules fall out. For equality, numeric values compare by worth, not by type, while values of unrelated kinds are simply never equal. For ordering, Python refuses to guess: there is no total order that makes sense between a string and an integer, so it raises `TypeError` rather than invent one.

## A worked example: the receipt's tolerance

The float-noise pitfall has a constructive answer. Compare within a tolerance the way a physicist would, or switch to exact whole units:

```python
expected = 0.3
price = 0.1 + 0.2                    # 0.30000000000000004
price == expected                    # False — float noise
abs(price - expected) < 1e-9         # True — within tolerance
```

The pattern is a pair of questions and a decision: are they exactly equal? `False`. Are they within a reasonable proximity? `True`. The second question is the one the real world usually means.

## Common pitfalls

- **`=` vs `==`.** `if score = 60:` is a syntax error, Python will not let you assign inside a condition by accident. The doubled sign is a guardrail, not a formality.
- **Floating-point equality.** `0.1 + 0.2 == 0.3` is `False`. The binary representation of $0.1$ is infinite, so the sum lands at $0.30000000000000004$. Compare within a tolerance instead: `abs((0.1 + 0.2) - 0.3) < 1e-10`.
- **`==` with `None`.** `x == None` happens to work; `x is None` is the question you actually mean.
- **Float equality needs a tolerance; money needs whole units.** `0.1 + 0.2 == 0.3` fails (`False`), so either compare within `abs(a - b) < 1e-9` or count in cents, `120 == 12 * 10` is exact.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Predict each result without running: `5 == 5.0`, `"5" == 5`, `5 < "6"`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>5 == 5.0</code> → True (numeric equality across types), <code>"5" == 5</code> → False (a string is never equal to an int), <code>5 < "6"</code> → TypeError (ordering is not defined between int and str in Python 3).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Write a single chained comparison that checks whether a number $n$ lies in $[1, 100]$, without using `and`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>1 <= n <= 100</code>, the chained form reads exactly like the mathematical interval $1 \leq n \leq 100$.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Why does `0.1 + 0.2 == 0.3` evaluate to `False`? How would you write a correct floating-point equality test?

<p class="challenge__answer">💡 <strong>Answer:</strong> Neither $0.1$ nor $0.2$ has an exact binary representation, so their sum is $0.30000000000000004$, not exactly $0.3$. Test within a tolerance: <code>abs((0.1 + 0.2) - 0.3) &lt; 1e-10</code>.</p>

</div>
</details>

## 🤔 Socratic Questions

- If `a == b` is `True`, must `a is b` be `True` too? In what circumstances can two objects be equal in content yet distinct in identity?
- Why does Python forbid `5 < "6"` yet allow `5 == "5"` to be `False`? What design principle keeps both behaviors consistent?
- When is `is` genuinely the right tool for equality? Think about the singleton `None`, and why comparing content there is meaningless.

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