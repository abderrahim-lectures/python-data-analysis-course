---
title: "Week 1: Variables, Types & I/O"
sidebar_position: 1
section: python-101
track: normal
week: 1
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 1: Variables, Types & I/O

<span className="gamified-flourish">🐍 Every language starts with naming things. This week, you learn Python's version of "let $x$ be...".</span>

## 🎯 Learning objectives

By the end of this week you can:
- Store a value under a name (a **variable**) and explain why that name is just a label, not a box.
- Identify Python's core built-in types: `int`, `float`, `str`, `bool`.
- Read input from a student at the keyboard and print formatted output back.

## Lesson

### Variables as names for values

In math, when you write "let $x = 5$", you're binding a name to a value for the rest of the argument. Python does exactly this:

```python
x = 5
```

The right-hand side is evaluated first (`5`), then the name `x` is pointed at it. Unlike math, `x` can be **reassigned** — `x = 5` followed later by `x = x + 1` doesn't contradict itself, it just re-points the label:

```python
x = 5
x = x + 1  # x now names 6
```

Read `x = x + 1` as "the new value of $x$ is the old value of $x$ plus one," the same way you'd read a recurrence relation $x_{n+1} = x_n + 1$.

### Types: what kind of value is this?

Every value has a type — the set it belongs to, in math terms:

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

Python is **dynamically typed**: a name isn't permanently tied to one type. `x = 5` then `x = "five"` is legal — `x` just points somewhere new. This is convenient, but it also means the *type* of a name can only be known by looking at what it currently points to, not by declaring it up front.

### Operators

Arithmetic operators mirror the ones you already know, with two Python-specific additions:

```python
7 // 2   # 3   — floor division: floor(7/2)
7 % 2    # 1   — remainder, i.e. 7 mod 2
7 ** 2   # 49  — exponentiation, i.e. 7^2
```

Comparison operators (`==`, `!=`, `<`, `<=`, `>`, `>=`) produce a `bool`. Note `==` (equality test) is not `=` (assignment) — a very common first bug.

### Input and output

`input()` reads a line of text typed by the student — it **always returns a `str`**, even if they typed a number:

```python
name = input("What's your name? ")
print("Hello,", name)
```

Because `input()` always gives you a `str`, converting is common:

```python
age_text = input("How old are you? ")
age = int(age_text)      # str -> int
print("In 10 years you'll be", age + 10)
```

`print()` accepts multiple comma-separated arguments (joined with a space) or an f-string for more control:

```python
score = 87.5
print(f"Your score is {score}%")   # f-strings interpolate {expressions} directly
```

## 🧩 Challenges

<Challenge id="python101-normal-w1-c1" answer={<><code>type(7 / 2)</code> is <code>float</code> — true division (<code>/</code>) always produces a float in Python 3, even when both operands are ints and the result is a whole number.</>}>

What is `type(7 / 2)`? Predict it before running it in the playground, then check.

</Challenge>

<Challenge id="python101-normal-w1-c2" answer={<>Yes: <code>"3" + "4"</code> is the string <code>"34"</code> (concatenation), not <code>7</code>. Adding a <code>str</code> and an <code>int</code> directly (<code>"3" + 4</code>) raises a <code>TypeError</code> — you must convert first.</>}>

Predict the output of `"3" + "4"`. Is it the same as `3 + 4`?

</Challenge>

<Challenge id="python101-normal-w1-c3" answer={<>Write a small program: read a name and a birth year with two <code>input()</code> calls, convert the year to <code>int</code>, subtract from the current year, and print a sentence with an f-string, e.g. <code>{"f\"{name}, you are about {age} years old.\""}</code>.</>}>

Write a program that asks for a name and a birth year (as two separate `input()` prompts), computes an approximate age, and prints a sentence like `"Amina, you are about 21 years old."` Try it in the playground.

</Challenge>

<Challenge id="python101-normal-w1-c4" answer={<>15 // 4 is 3 (floor of 3.75), and 15 % 4 is 3 (since 15 = 4·3 + 3). Together they satisfy 15 = 4·(15 // 4) + (15 % 4), the same identity as the division algorithm you know from number theory.</>}>

Without running it, compute `15 // 4` and `15 % 4` by hand. Then verify: does `4 * (15 // 4) + (15 % 4)` equal `15`?

</Challenge>

## 🤔 Socratic Questions

- `input()` always returns a `str`. What would go wrong if you tried `age + 10` *without* first converting `age = int(input(...))`? What does the error message actually tell you?
- If `x = 5` and then `y = x`, and then `x = 10`, what is `y`? Explain why in terms of "names point to values" rather than "boxes contain values."
- `0.1 + 0.2` in Python does **not** print exactly `0.3`. Try it in the playground. Why might a `float` — which approximates $\mathbb{R}$ using finite binary digits — not represent $0.1$ exactly, the same way $\frac{1}{3}$ has no finite decimal expansion?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-normal-week-1"
  questions={[
    {
      id: 'q1',
      prompt: "What is the type of the result of 7 / 2 in Python 3?",
      options: ['int', 'float', 'str', 'bool'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: "What does input() always return, regardless of what the user types?",
      options: ['int', 'float', 'str', 'bool'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'What does 17 % 5 evaluate to?',
      options: ['3', '2', '5', '0'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: "Which operator tests equality (not assignment)?",
      options: ['=', '==', '===', 'is'],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-1" />
