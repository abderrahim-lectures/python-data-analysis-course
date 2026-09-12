---
title: "Data Types"
description: "Identify Python's core types, int, float, str, bool, and understand what each represents."
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

## The set a number belongs to

Answer two questions: you have $7$ apples and you cut one of them in half. Are you now holding $7 + \frac{1}{2}$ apples *in the same sense* as you held $7$? Half an apple is not a whole number of apples, $7$ lives in $\mathbb{Z}$, and $7\frac{1}{2}$ lives in $\mathbb{Q}$.

A mathematician answers by asking which **set** a value belongs to. The same distinction haunts every program: the machine stores $42$ differently from $42.5$, and $42$ differently from `"42"`. The word Python uses for "which set this value lives in" is **type**.

So: how many sets are worth distinguishing? Four, at first.

| Type | What it is, mathematically | Examples |
|---|---|---|
| `int` | $\mathbb{Z}$, the integers, stored exactly | `42`, `-7` |
| `float` | $\mathbb{R}$, approximated with a fixed number of binary digits | `3.14`, `-0.5` |
| `str` | a finite sequence of characters | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

The `float` row has a deliberate hedge in it, *approximated*. An integer is stored exactly, every time. A real number almost never is: how would you store $1/3 = 0.333\ldots$ with a finite number of digits? You cannot, so Python keeps a finite approximation and the accounts differ in the trailing digits. That single fact explains a famous surprise you will meet shortly.

## Asking which set

Given a value, you can ask its type directly:

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

Two notational notes. First, `type(...)` *is* a function, you hand it a value and it returns the *type object* that value belongs to. Second, the answer prints as `<class 'int'>`; the word `class` is Python's term for a type, and the word in quotes is the set's name. Read `<class 'float'>` as *"belongs to the set float"*.

## A name does not commit to a set

Now the payoffs begin. In a language with static types you would declare up front: *x is an integer*. Python instead lets a name point wherever it likes:

```python
x = 5
print(type(x))    # <class 'int'>
x = "hello"
print(type(x))    # <class 'str'>
```

Re-pointing a name to a different set is legal, so the type of `x` cannot be read from any declaration, only by asking what it currently points at. This is **dynamic typing**. It is convenient, and it is also the reason your program can silently hand a string to a function that expects numbers: nothing stops it until the operation itself fails.

## Which values act like True?

Every value is either **truthy** or **falsy**, either it behaves as `True` in a condition or as `False`. The rule is compact, and it is worth verifying:

- **Falsy**: $0$, $0.0$, the empty string `""`, and `None`
- **Truthy**: everything else

```python
bool(0)         # False
bool(1)         # True
bool(-1)        # True   — any nonzero number is truthy
bool("")        # False
bool("hello")   # True   — any non-empty string is truthy
```

Notice what is in the list and what is left out. `-1` is True; `0` is not. The string `"0"` is True, it is non-empty, and emptiness is the criterion for strings, not the value of its content. This rule pays for itself the moment you write your first `if`: `if score:` means *if score is not zero*.

## A worked example: auditing an expression

The sets pay for themselves the moment an expression mixes them. Read the receipt line by line and ask the set of each result:

```python
unit_price = 4.75
quantity = 4
bill = unit_price * quantity     # float: the float absorbed the int
type(bill)                       # <class 'float'>
bool(bill)                       # True — any nonzero is truthy

type(10 / 2)                     # <class 'float'> — true division never returns int
```

Read `bill` as the product of two different sets. The sets do not "mix", the `float` wins, because the proportion is not a whole number of any scale and the wider set must hold it. The audit habit is to ask the set directly: `type(...)` confirms what you suspected instead of betting on luck.

## Common pitfalls

- **`4 / 2` is `2.0`, not `2`.** True division (`/`) always returns a `float` in Python 3, even when the division is exact. For an integer result, ask for floor division: `4 // 2` → `2`.
- **`True + True` is `2`.** `bool` is a subclass of `int` in Python: `True` behaves as $1$ and `False` as $0$ in arithmetic. The two sets overlap, but `type(True)` still answers `bool`.
- **`type()` tells the concrete type.** `type(True)` is `bool`, not `int`, no matter how comfortably `True` plays along in sums.
- **`type()` describes the result, not the operands.** `type(2 * 3.0)` is `float`, an `int` times a `float` lives in the `float` set. Do not predict from the pieces; ask the answer.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Predict `type(7 / 2)`, then check.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>type(7 / 2)</code> is <code>float</code>, true division (<code>/</code>) always produces a float in Python 3, even when both operands are ints and the quotient is a whole number.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Predict `bool(0)`, `bool(0.0)`, `bool("")`, and `bool("0")`. Which are truthy, which falsy?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>bool(0)</code> → False, <code>bool(0.0)</code> → False, <code>bool("")</code> → False (empty string), <code>bool("0")</code> → True (non-empty string, even though its content is the character "0").</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

In Python, `0.1 + 0.2` does **not** equal `0.3`. Here is the same problem on paper: what happens when you represent $1/3 = 0.333\ldots$ with two decimal digits? Now explain why a `float`, which approximates $\mathbb{R}$ with finitely many binary digits, cannot represent $0.1$ exactly.

<p class="challenge__answer">💡 <strong>Answer:</strong> With two digits, $1/3$ must become $0.33$, a loss already made before any arithmetic. Likewise $0.1$ has no exact binary form; the float stores a nearby value, and adding two of these involves minuscule errors: <code>0.1 + 0.2</code> yields <code>0.30000000000000004</code>, not <code>0.3</code>. Finite precision, not a Python bug.</p>

</div>
</details>

## 🤔 Socratic Questions

- If `bool(-1)` is `True`, what single rule explains why $-1$ is truthy but $0$ is falsy? Does the rule generalize from numbers to strings?
- Python has `isinstance(42, int)` which returns `True`. Would `isinstance` be more reliable than `type(x) == int` for checking types? Why?
- Why does Python write `True` and `False` capitalized instead of `true` and `false`? What other capitalized words does Python reserve?

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