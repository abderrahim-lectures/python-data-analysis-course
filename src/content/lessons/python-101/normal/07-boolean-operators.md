---
title: "Boolean Operators"
description: "Combine conditions with and, or, and not, the logical connectives of Python."
module: "operators"
order: 7
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Use and, or, and not to combine boolean expressions"
  - "Understand short-circuit evaluation"
  - "Apply De Morgan's laws in Python"
  - "Write complex conditions clearly"
prerequisites: ["06-comparison-operators"]
tags: ["boolean", "and", "or", "not", "short-circuit", "logic"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Building conditions from conditions

Comparison operators hand you a single truth value: `True` or `False`. The door at the club asks two questions at once, *"are you of age, and do you hold a ticket?"*, and that conjunction is itself a condition. Python, like the logic you met in mathematics, offers the three connectives that combine propositions:

- $A \land B$ is written `and`
- $A \lor B$ is written `or`
- $\lnot A$ is written `not`

## The three connectives

Their behavior is the truth table you already know. Write it out in Python and it reads identically:

```python
True and True      # True
True and False     # False
False or True      # True
not True           # False
```

Where they earn their keep is gluing comparisons into one gate. A venue, a weather alert, a weekday check:

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Welcome in")

temperature = 30
if temperature < 0 or temperature > 40:
    print("Extreme weather!")

is_weekend = False
if not is_weekend:
    print("Time to work")
```

Each of these is a single question assembled from smaller ones, exactly the way $0 \leq x < 10$ from the last lesson assembled intervals.

## Short-circuit evaluation

The full truth table lists four rows, but Python does not always need them. Evaluate $A$ `and` $B$ with $A = \mathrm{False}$: the answer is `False` regardless of $B$, so $B$ is never computed. The same wall applies to `or`: once $A$ is `True`, the result is decided. Python reads left to right and **stops at the first decisive answer**.

That is not a performance nicety; it is a safety device:

```python
x = 0
# No division ever happens — 0 is falsy, so the second half is skipped
result = x != 0 and 10 / x > 2
```

Had Python evaluated both sides, $10/x$ would crash on division by zero. The word `and` is a pre-flight gate: it refuses to fly the second condition unless the first clears it. This is why Python writes `and`/`or` where C-family languages write `&&`/`||`, the words carry the same short-circuit behavior without the cryptic symbols.

## De Morgan's two swaps

Logic's most reusable identities trade a negation across a connective:

- $\neg(A \land B) \equiv (\neg A) \lor (\neg B)$, `not (A and B)` ≡ `not A or not B`
- $\neg(A \lor B) \equiv (\neg A) \land (\neg B)$, `not (A or B)` ≡ `not A and not B`

In Python, the negation of a joined condition becomes a joined condition of negations:

```python
# These are equivalent:
not (age >= 18 and has_ticket)
age < 18 or not has_ticket
```

The rewritten form reads straight: the door opens to no one underage and to no one without a ticket. De Morgan's laws are the tool for turning a dense `not (…)` you must untangle into the plain reading.

## The truth tables, at a glance

| $A$ | $B$ | $A \land B$ | $A \lor B$ |
|-----|-----|-------------|------------|
| True | True | True | True |
| True | False | False | True |
| False | True | False | True |
| False | False | False | False |

And $\lnot$ flips the single truth value: `not True` → `False`, `not False` → `True`.

## A worked example: the club door twice told

One door, one verdict, two wordings. The admission rule refuses anyone who is not of age or holds no ticket:

```python
age = 20
has_ticket = True

denied = not (age >= 18 and has_ticket)      # False
denied_again = age < 18 or not has_ticket    # False — De Morgan, equivalent
```

The first line says "it is not true that (of age AND with ticket)"; the second says "underage OR without ticket", the two sides of De Morgan's law, and both answer the same. The untangled version reads like the sentence it describes.

## Common pitfalls

- **`and`/`or` return an operand, not a boolean.** `0 and 5` is `0`; `0 or 5` is `5`. Python hands back the decisive value itself. Falsey 0 did the deciding, so 0 is returned.
- **`not` binds tighter than `==`.** `not a == b` parses as `not (a == b)`, not `(not a) == b`. Parenthesize when unsure.
- **Words, not bitwise symbols.** `True and False` is `False`; `True & False` is a bitwise operation on booleans with different behavior. Reserve `&`/`|` for bit-level work.
- **`and`/`or` are lazy in a way that hides bugs.** If the decisive side is already truthy/falsy, the far side never runs, `1 or missing_function()` never calls the function. A dead half that never crashed can hide a name you forgot.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Without running it, predict: `0 and 5`, `0 or 5`, `3 and 5`, `3 or 5`. What pattern do you see?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>0 and 5</code> → 0, <code>0 or 5</code> → 5, <code>3 and 5</code> → 5, <code>3 or 5</code> → 3. Pattern: <code>and</code> hands back the first falsey operand (or the last if all are truthy); <code>or</code> hands back the first truthy one (or the last if all are falsey).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Rewrite `not (x > 5 and y < 10)` with De Morgan's law. Is the rewrite easier to read?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>not (x &gt; 5 and y &lt; 10)</code> ≡ <code>x &lt;= 5 or y &gt;= 10</code>, a straightforward reading with no compound negation to untangle.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Write a condition for a leap year: divisible by 4, except centuries (divisible by 100) unless also divisible by 400. Use `and`, `or`, `not`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)</code>, divisible by 4 but not by 100, or divisible by 400.</p>

</div>
</details>

## 🤔 Socratic Questions

- `0 and 5` yields `0`, not `False`. Why does Python return the deciding value rather than a boolean? When does that become useful?
- If `or` returns the first truthy operand, what is `"hello" or "world"`? And `"" or "world"`?
- Why does Python favor the words `and`, `or`, `not` over the symbols `&&`, `||`, `!`? What does the plain English buy a reader?

## ✅ Quick check

<div class="quiz" data-quiz="python-101-boolean">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What is True and False?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">None</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. What does 0 or 5 evaluate to?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">False</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">3. Which is equivalent to not (a and b)?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">not a and not b</button>
      <button class="quiz-q__opt" data-idx="1">a or b</button>
      <button class="quiz-q__opt" data-idx="2">not a or not b</button>
      <button class="quiz-q__opt" data-idx="3">a and not b</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>