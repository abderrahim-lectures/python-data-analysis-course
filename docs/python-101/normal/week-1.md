---
title: "Week 1: Variables, Types & I/O"
sidebar_position: 1
section: python-101
track: normal
week: 1
description: "Learn Python variables, data types, operators, and input/output — the first week of the Python 101 Normal track, no installs required."
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
- Use arithmetic, comparison, and augmented-assignment operators correctly.
- Read input from a student at the keyboard and print formatted output back.
- Write a first small, complete, interactive program combining all of the above.

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

You'll see this pattern — read the current value, compute something from it, store it back under the same name — so often that Python gives it a shorthand, the **augmented assignment** operators:

```python
x = 5
x += 1     # same as x = x + 1  -> 6
x -= 2     # same as x = x - 2  -> 4
x *= 3     # same as x = x * 3  -> 12
x /= 4     # same as x = x / 4  -> 3.0
```

#### Naming your variables

A name (an **identifier**) must start with a letter or underscore, and can only contain letters, digits, and underscores after that — `2nd_score` is invalid, `second_score` is fine. Python convention (and this course's style throughout) is `snake_case`: lowercase words separated by underscores, like `student_name` or `total_score`, rather than `studentName` or `TotalScore`. A handful of words are **reserved** by the language itself (`if`, `for`, `class`, `True`, and others) and can't be used as variable names at all.

Names should describe *what a value means*, not just satisfy the syntax. `x = 87.5` tells a reader nothing; `quiz_score = 87.5` tells them everything they need at a glance. This matters more than it might seem — you will reread your own code far more often than you write it.

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

#### Converting between types

You can explicitly convert a value from one type to another using `int(...)`, `float(...)`, `str(...)`, and `bool(...)` as functions:

```python
int("42")       # 42        — str -> int
int(3.9)        # 3         — float -> int, truncates (does NOT round!)
float("3.14")   # 3.14      — str -> float
str(42)         # "42"      — int -> str
bool(0)         # False     — 0 (and 0.0, and "") are "falsy"
bool(1)         # True      — any nonzero number (and non-empty string) is "truthy"
```

`int(3.9)` giving `3`, not `4`, trips people up constantly — conversion to `int` always truncates toward zero, it never rounds. Use the built-in `round(3.9)` (giving `4`) if rounding is what you actually want.

Not every conversion is possible: `int("hello")` raises a `ValueError`, since `"hello"` isn't a number in any base. Python fails loudly here rather than silently guessing — a design choice you'll come to appreciate once you're debugging real data in Section 2.

### Operators

Arithmetic operators mirror the ones you already know, with two Python-specific additions:

```python
7 // 2   # 3   — floor division: floor(7/2)
7 % 2    # 1   — remainder, i.e. 7 mod 2
7 ** 2   # 49  — exponentiation, i.e. 7^2
-7 // 2  # -4  — floor division always rounds toward negative infinity, not toward zero
```

That last line is a common surprise: `-7 // 2` is `-4`, not `-3`, because floor division follows the mathematical floor function $\lfloor x \rfloor$, which rounds *down* (toward $-\infty$), not toward zero.

Comparison operators (`==`, `!=`, `<`, `<=`, `>`, `>=`) produce a `bool`. Note `==` (equality test) is not `=` (assignment) — a very common first bug. You can also chain comparisons the way you would in math: `0 <= x < 10` means exactly what $0 \le x < 10$ means, evaluated as a single expression, not two separate ones you'd need `and` to join (you'll meet `and`/`or` properly next week).

Operators combine with the usual precedence: `**` first, then `*`, `/`, `//`, `%`, then `+`, `-`, left to right — the same PEMDAS order you already know. Parentheses override it exactly like in math:

```python
2 + 3 * 4      # 14, not 20
(2 + 3) * 4    # 20
```

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

f-strings can hold more than a bare variable name — any expression works inside the `{ }`, and you can format numbers precisely:

```python
price = 19.999
print(f"Total: ${price:.2f}")        # "Total: $20.00" — :.2f rounds to 2 decimal places
print(f"Double: {price * 2}")         # any expression, not just a variable
print(f"{'yes' if price > 10 else 'no'}")  # even a conditional expression works inline
```

### ⚠️ Common pitfalls

- **Confusing `=` and `==`.** `if score = 60:` is a syntax error (you'll meet `if` properly next week) — Python won't let you assign inside a condition by accident, but the instinct to type `=` when you mean "equals" is common early on.
- **Forgetting `input()` returns a string.** `age = input("Age? ")` then `age + 1` raises `TypeError: can only concatenate str (not "int") to str` — convert first: `age = int(input("Age? "))`.
- **Expecting `int()` to round.** `int(4.7)` is `4`, not `5`. Use `round(4.7)` for rounding.
- **Mixing up `/` and `//`.** `/` always gives a `float` (even `4 / 2` is `2.0`); `//` gives the floored quotient.

## Worked example: a small interactive program

Putting everything from this week together — variables, types, conversion, operators, and I/O — into one short program that computes a simple tip calculator:

```python
bill = float(input("Bill amount: $"))
tip_percent = int(input("Tip percent (e.g. 15): "))

tip_amount = bill * tip_percent / 100
total = bill + tip_amount

print(f"Tip: ${tip_amount:.2f}")
print(f"Total: ${total:.2f}")
```

Notice how each line does one clear thing: read a value, convert it to the right type, compute with it, and print a formatted result. This "read → compute → report" shape is one you'll reuse constantly, all the way through this course.

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

<Challenge id="python101-normal-w1-c5" answer={<>int(-7.9) is -7 (truncates toward zero — chops off the decimal part), while -7.9 // 1 is -8.0 (floors toward negative infinity). They agree for positive numbers but disagree for negative ones, which is exactly the pitfall the "Common pitfalls" section above warns about.</>}>

Predict `int(-7.9)` and `-7.9 // 1`. Are they the same? Run both in the playground and explain any difference using what you learned about truncation versus flooring.

</Challenge>

<Challenge id="python101-normal-w1-c6" answer={<>Extend the tip calculator: read a third input for the number of people, convert it to <code>int</code>, and divide <code>total</code> by that number to get <code>per_person</code>, printed with <code>:.2f</code> formatting like the other amounts.</>}>

Extend the worked example's tip calculator to also ask how many people are splitting the bill, and print each person's share.

</Challenge>

## 🤔 Socratic Questions

- `input()` always returns a `str`. What would go wrong if you tried `age + 10` *without* first converting `age = int(input(...))`? What does the error message actually tell you?
- If `x = 5` and then `y = x`, and then `x = 10`, what is `y`? Explain why in terms of "names point to values" rather than "boxes contain values."
- `0.1 + 0.2` in Python does **not** print exactly `0.3`. Try it in the playground. Why might a `float` — which approximates $\mathbb{R}$ using finite binary digits — not represent $0.1$ exactly, the same way $\frac{1}{3}$ has no finite decimal expansion?
- `bool(0)` is `False` and `bool(1)` is `True` — but what do you predict `bool(-1)` and `bool(2)` are? Test your prediction. What single rule explains all four results?
- The augmented assignment `x += 1` and the plain `x = x + 1` produce the same result for numbers. Can you think of a reason a language might still bother providing both forms, rather than requiring everyone to always write out `x = x + 1`?

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
    {
      id: 'q5',
      prompt: 'What does int(4.9) evaluate to?',
      options: ['5', '4', '4.9', 'A TypeError'],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-1" />
