---
title: "Arithmetic Operators"
description: "Add, subtract, multiply, divide, floor-divide, modulo, and exponent — all eight arithmetic operators."
module: "operators"
order: 5
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Use all eight arithmetic operators: +, -, *, /, //, %, **"
  - "Understand floor division vs true division"
  - "Apply operator precedence (PEMDAS)"
  - "Use parentheses to override precedence"
prerequisites: ["04-type-conversion"]
tags: ["arithmetic", "division", "modulo", "exponent", "precedence"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## The eight arithmetic operators

Python has the standard four plus four extras:

```python
7 + 2    # 9   — addition
7 - 2    # 5   — subtraction
7 * 2    # 14  — multiplication
7 / 2    # 3.5 — true division (always returns float)
7 // 2   # 3   — floor division (rounds toward -∞)
7 % 2    # 1   — modulo (remainder)
7 ** 2   # 49  — exponentiation (7²)
```

## Floor division vs true division

`/` always gives a `float`, even when both operands are ints and the result is a whole number:

```python
4 / 2    # 2.0  — float, not int
```

`//` gives the **floored** quotient — always rounds toward negative infinity:

```python
7 // 2    # 3   — floor(3.5)
-7 // 2   # -4  — floor(-3.5) = -4, not -3
```

That last line is a common surprise. Floor division follows the mathematical floor function $\lfloor x \rfloor$, which rounds *down* (toward $-\infty$), not toward zero.

## Modulo: the remainder

`%` gives the remainder after floor division. The key identity:

```
a == (a // b) * b + (a % b)
```

```python
15 % 4    # 3   — since 15 = 4×3 + 3
15 // 4   # 3
4 * 3 + 3 # 15  ✓
```

## Operator precedence

Python follows PEMDAS — same order you know from math:

1. `**` first (exponentiation)
2. `*`, `/`, `//`, `%` (left to right)
3. `+`, `-` (left to right)

```python
2 + 3 * 4      # 14, not 20
(2 + 3) * 4    # 20 — parentheses override
2 ** 3 ** 2     # 512, not 64 — ** is right-associative: 2 ** (3 ** 2) = 2 ** 9
```

## Common pitfalls

- **`/` vs `//`.** `7 / 2` is `3.5` (float), `7 // 2` is `3` (int). Use `//` when you want an integer result.
- **Floor division with negatives.** `-7 // 2` is `-4`, not `-3`. This follows the mathematical floor, not truncation.
- **`%` with floats.** `7.5 % 2` is `1.5` — modulo works with floats too, not just ints.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Without running it, compute `15 // 4` and `15 % 4` by hand. Then verify: does `4 * (15 // 4) + (15 % 4)` equal `15`?

<p class="challenge__answer">💡 <strong>Answer:</strong> 15 // 4 is 3 (floor of 3.75), and 15 % 4 is 3 (since 15 = 4·3 + 3). Together: 4 × 3 + 3 = 15. This is the division algorithm identity.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

How would you extract the hundreds digit of a number? For example, given `n = 4567`, extract `5` using arithmetic only (no strings).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>(n // 100) % 10</code> — first divide by 100 to shift right (4567 → 45), then modulo 10 to get the last digit (45 → 5).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Why does Python use `**` for exponentiation instead of `^`? What does `^` actually do in Python? (Hint: it's not exponentiation.)

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>^</code> is the bitwise XOR operator in Python, not exponentiation. Python uses <code>**</code> to avoid ambiguity with C-style languages where <code>^</code> means XOR.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does Python's floor division round toward negative infinity instead of toward zero? What practical benefit does this give you (hint: think about how `divmod()` works)?
- `2 ** 3 ** 2` is `512`, not `64`. Why is `**` right-associative when `+` and `*` are left-associative?
- Can you think of a real-world scenario where modulo arithmetic is essential? (Think about clocks, calendar days, or array indexing.)

## Projects You Can Build

Here are a few real-world projects that reinforce these concepts:

- 💰 **Expense Tracker** - Use arithmetic operators for totals, averages, and percentage calculations
- 🔒 **Password Generator** - Apply modulo arithmetic to select random characters from different character sets
- ⚡ **Weather Dashboard** - Calculate temperature differences, averages, and unit conversions

## ✅ Quick check

<div class="quiz" data-quiz="python-101-arithmetic">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. What is -7 // 2?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">-3</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">-4</button>
      <button class="quiz-q__opt" data-idx="3">-3.5</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. What is the result of 2 ** 3 ** 2?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">512</button>
      <button class="quiz-q__opt" data-idx="1">64</button>
      <button class="quiz-q__opt" data-idx="2">36</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. What is 7 % 3?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">2</button>
      <button class="quiz-q__opt" data-idx="1">1</button>
      <button class="quiz-q__opt" data-idx="2">3</button>
      <button class="quiz-q__opt" data-idx="3">0</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
