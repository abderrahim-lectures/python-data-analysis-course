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

## The operators a machine must steal from a mathematician

You have written helper functions in earlier lessons: store a value, print a value, change its type. None of that is useful until a program can *do something* to numbers. So pause and take stock: a computer exists to evaluate expressions, and every expression is built from **operators** joining values. You already know the arithmetic ones from paper — but the machine splits two of them in half.

## The operators and their meanings

Python provides eight. The first four are exactly what you expect:

```python
7 + 2    # 9   — addition
7 - 2    # 5   — subtraction
7 * 2    # 14  — multiplication
7 / 2    # 3.5 — true division (always returns a float)
```

Then come three that answer questions you only ever asked in homework:

```python
7 // 2   # 3   — floor division (rounds toward −∞)
7 % 2    # 1   — modulo (the remainder)
7 ** 2   # 49  — exponentiation (7²)
```

`**` is Python's writing of a power: $7^2 = 49$. The two newcomers are `//` and `%`, and they are not variations — they are two halves of one legal question.

## Two halves of one division

Ask a real question: *how many whole groups of 4 fit into 15, and what is left over?*

$$
15 = 4 \cdot 3 + 3.
$$

The answer has two parts — the quotient $3$ and the remainder $3$. Python's `//` answers the first part and `%` answers the second:

$$
a = (a \mathbin{//} b) \cdot b + (a \mathbin{\%} b)
$$

```python
15 // 4   # 3   — how many groups of 4
15 % 4    # 3   — what's left over
4 * 3 + 3 # 15  ✓ the identity holds
```

That identity is not decoration — it is the definition of both operators, and it cannot fail while the two parts are calculated by the same machine.

There is one wrinkle. Which quotient does Python report for $-7 \div 2$? Write it as a grouping question:

$$
-7 = 2 \cdot ? + ?.
$$

The options are $2 \cdot (-3) + (-1)$ or $2 \cdot (-4) + 1$. Python floors, like the mathematical function $\lfloor x \rfloor$:

```python
-7 // 2   # -4 — floor(-3.5) = -4, not -3
-7 % 2    # 1  — consistent with the floor: -7 = 2·(-4) + 1
```

The two operators stay honest to each other — the identity $a = (a//b)\cdot b + (a\%b)$ holds with no exceptions, and that is worth more than "the intuitive answer."

## The order of operations, settled

Expressions containing several operators need a fixed sequencing, or every reader would compute a different value for $2 + 3 \cdot 4$. Python adopts the order you learned as PEMDAS:

- `**` first (exponentiation)
- then `*`, `/`, `//`, `%` (left to right)
- then `+`, `-` (left to right)

```python
2 + 3 * 4      # 14, not 20
(2 + 3) * 4    # 20 — parentheses override
2 ** 3 ** 2    # 512, not 64
```

That last one is a genuine surprise. `**` is **right-associative**, so `2 ** 3 ** 2` reads as $2^{(3^2)} = 2^9 = 512$, matching the stacked notation where powers climb upward in one direction. When in doubt, spell parentheses out — a reader who does not see them will not guess your intent.

## A worked example: change for the reading plan

The quotient/remainder pair runs a reading plan:

```python
pages = 301
per_day = 30
days = pages // per_day      # 10 — whole days of reading
leftover = pages % per_day   # 1  — the 11th day's remnant

print(f"{days} full days, {leftover} leftover")
days * per_day + leftover    # 301 — the identity holds
```

The division identity $a = (a \mathbin{//} b) \cdot b + (a \mathbin{\%} b)$ becomes a ledger: `days` and `leftover` are its two columns, and the identity is the receipt that proves nothing was lost.

## Common pitfalls

- **`/` vs `//`.** `7 / 2` is `3.5` (a float); `7 // 2` is `3` (an int). Reach for `//` only when the whole-quotient is what the problem needs.
- **Floor division with negatives.** `-7 // 2` is `-4`, not `-3`. The floor goes toward $-\infty$, not toward zero.
- **`%` works on floats too.** `7.5 % 2` is `1.5` — the identity above holds for reals as well as integers.
- **`**` binds tighter than `*`.** `2 * 3 ** 2` is `18`, not `36` — the power is computed first. Parenthesize when you mean `(2 * 3) ** 2` = 36.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Without running it, compute `15 // 4` and `15 % 4` by hand, then verify that $4 \cdot (15 // 4) + (15 \% 4)$ reproduces $15$.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>15 // 4</code> is <code>3</code> (the floor of $3.75$), and <code>15 % 4</code> is <code>3</code>, since $15 = 4\cdot 3 + 3$. Together <code>4 * 3 + 3 = 15</code> — the division identity, verified.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

How would you extract the hundreds digit of any number? Given `n = 4567`, get `5` using arithmetic only, no strings.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>(n // 100) % 10</code> — first divide by 100 to shift the digit right (<code>4567 → 45</code>), then modulo 10 to keep only the last digit (<code>45 → 5</code>).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Why does Python use `**` for exponentiation instead of `^`? What does `^` actually do in Python?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>^</code> is the bitwise XOR operator in Python, not exponentiation. Python uses <code>**</code> to avoid clashing with the convention of languages where <code>^</code> means XOR.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does floor division round toward negative infinity rather than toward zero? What practical benefit falls out of that choice (hint: think of `divmod()` returning a consistent pair)?
- `2 ** 3 ** 2` is `512`, not `64`. Why is `**` right-associative when `+` and `*` are left-associative?
- Where does modulo arithmetic earn its keep in real life? Think of clocks, calendar days, or array indices.

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