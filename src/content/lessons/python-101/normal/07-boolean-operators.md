---
title: "Boolean Operators"
description: "Combine conditions with and, or, and not — the logical connectives of Python."
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

## Three boolean operators

Python has `and`, `or`, and `not` — the logical connectives from propositional logic:

```python
True and True      # True
True and False     # False
False or True      # True
not True           # False
```

## Combining conditions

These are most useful with comparison operators:

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

## Short-circuit evaluation

Python evaluates `and` and `or` from left to right and **stops as soon as the result is determined**:

- `A and B` — if `A` is `False`, `B` is never evaluated (the result is already `False`)
- `A or B` — if `A` is `True`, `B` is never evaluated (the result is already `True`)

```python
x = 0
# This is safe — division never happens because 0 is falsy
result = x != 0 and 10 / x > 2
```

This is why Python uses words (`and`, `or`) instead of symbols (`&&`, `||`): the short-circuit behavior lets you guard against errors without extra `if` statements.

## De Morgan's laws

The identities from logic apply directly in Python:

- `not (A and B)` ≡ `(not A) or (not B)`
- `not (A or B)` ≡ `(not A) and (not B)`

```python
# These are equivalent:
not (age >= 18 and has_ticket)
age < 18 or not has_ticket
```

This is useful for simplifying complex negated conditions.

## Truth tables

| `A` | `B` | `A and B` | `A or B` |
|-----|-----|-----------|----------|
| True | True | True | True |
| True | False | False | True |
| False | True | False | True |
| False | False | False | False |

`not` simply flips: `not True` → `False`, `not False` → `True`.

## Common pitfalls

- **`and`/`or` don't return `True`/`False` — they return one of the operands.** `0 and 5` returns `0`, not `False`. `0 or 5` returns `5`, not `True`. Python uses the "truthy/falsy" value, not a boolean.
- **Forgetting `not` precedence.** `not a == b` is parsed as `not (a == b)`, not `(not a) == b`. Use parentheses when in doubt.
- **Using `and`/`or` instead of bitwise `&`/`|`.** `True and False` is `False`, but `True & False` raises an error. Use `and`/`or` for booleans, `&`/`|` for bits.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Without running it, predict: `0 and 5`, `0 or 5`, `3 and 5`, `3 or 5`. What pattern do you see?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>0 and 5</code> → 0, <code>0 or 5</code> → 5, <code>3 and 5</code> → 5, <code>3 or 5</code> → 3. Pattern: <code>and</code> returns the first falsy value (or the last value if all truthy); <code>or</code> returns the first truthy value (or the last value if all falsy).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Rewrite `not (x > 5 and y < 10)` using De Morgan's law. Is the rewritten version easier to read?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>not (x > 5 and y < 10)</code> ≡ <code>x <= 5 or y >= 10</code> — directly readable without negating a compound expression.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a condition that checks whether a year is a leap year: divisible by 4, except centuries (divisible by 100) unless also divisible by 400. Use `and`, `or`, and `not` to express this clearly.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)</code> — divisible by 4 but not by 100, OR divisible by 400.</p>

</div>
</details>

## 🤔 Socratic Questions

- `0 and 5` returns `0`, not `False`. Why does Python return the actual value rather than converting to a boolean? When is this behavior useful?
- If `or` returns the first truthy value, what does `"hello" or "world"` return? What about `"" or "world"`?
- Why does Python use words (`and`, `or`, `not`) instead of symbols (`&&`, `||`, `!`)? What benefit does this provide for readability?

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
