---
title: "Variables & Naming"
description: "Store values under names, understand assignment, and follow Python naming conventions."
module: "python-basics"
order: 2
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Assign values to variables and reassign them"
  - "Explain why variables are labels, not boxes"
  - "Use augmented assignment operators (+=, -=, *=, /=)"
  - "Follow snake_case naming conventions"
prerequisites: ["01-printing"]
tags: ["variables", "assignment", "naming", "snake_case"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Variables as names for values

In math, "let $x = 5$" binds a name to a value. Python does exactly this:

```python
x = 5
```

The right-hand side is evaluated first (`5`), then the name `x` is pointed at it. Unlike math, `x` can be **reassigned**:

```python
x = 5
x = x + 1  # x now names 6
```

Read `x = x + 1` as "the new value of $x$ is the old value of $x$ plus one" — the same way you'd read a recurrence relation $x_{n+1} = x_n + 1$.

## Augmented assignment

The read-compute-store-back pattern is so common that Python provides shorthand:

```python
x = 5
x += 1     # same as x = x + 1  -> 6
x -= 2     # same as x = x - 2  -> 4
x *= 3     # same as x = x * 3  -> 12
x /= 4     # same as x = x / 4  -> 3.0
```

## Naming conventions

A name (**identifier**) must start with a letter or underscore, and can only contain letters, digits, and underscores after that — `2nd_score` is invalid, `second_score` is fine.

Python convention is `snake_case`: lowercase words separated by underscores (`student_name`, `total_score`), not `studentName` or `TotalScore`. A handful of words are **reserved** by the language (`if`, `for`, `class`, `True`, etc.) and can't be used as variable names.

Names should describe *what a value means*. `x = 87.5` tells a reader nothing; `quiz_score = 87.5` tells them everything. This matters more than it might seem — you will reread your own code far more often than you write it.

## Common pitfalls

- **Using a reserved word as a name.** `class = "Math"` raises a `SyntaxError` — `class` is reserved.
- **Starting with a digit.** `2nd_place = "B"` is invalid; `second_place = "B"` is fine.
- **Confusing `=` and `==`.** `=` assigns; `==` tests equality. This trips everyone up at least once.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

If `x = 5` and then `y = x`, and then `x = 10`, what is `y`? Explain why in terms of "names point to values" rather than "boxes contain values."

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>y</code> is still <code>5</code>. When <code>y = x</code> executed, both names pointed at the value <code>5</code>. Reassigning <code>x</code> to <code>10</code> moves <code>x</code>'s pointer; <code>y</code> still points at <code>5</code>. Names are labels, not boxes.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a short program that swaps two variables: `a = 7`, `b = 3`. After swapping, `a` should be `3` and `b` should be `7`. Do it without a temporary variable (Python has a neat trick for this).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>a, b = b, a</code> — Python evaluates the right side first, then unpacks into the left side. No temp variable needed.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Which of these are valid variable names? Explain why the invalid ones fail: `_count`, `2nd`, `my-name`, `total`, `class`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>_count</code> ✓ (underscore start is fine), <code>2nd</code> ✗ (starts with digit), <code>my-name</code> ✗ (hyphen is not allowed — it's the minus operator), <code>total</code> ✓, <code>class</code> ✗ (reserved keyword).</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does Python use `snake_case` instead of `camelCase`? What does the underscore visual metaphor suggest about how to read variable names?
- `x += 1` and `x = x + 1` produce the same result for numbers. Can you think of a reason a language might still provide both forms?
- If variables are "labels, not boxes," what happens when you write `a = [1, 2, 3]` then `b = a` then `b.append(4)`? Does `a` see the `4`? (Try it — this previews mutable objects, covered later.)

## Projects You Can Build

Here are a few real-world projects that reinforce these concepts:

- 🎮 **Wordle Clone** - Track game state with variables for current guess, target word, and attempt count
- ✅ **Note-Taking App** - Use variables to store note titles, content, timestamps, and sort order
- 🔒 **Password Generator** - Store length, character sets, and generated passwords in descriptive variables

## ✅ Quick check

<div class="quiz" data-quiz="python-101-variables">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. What is the value of y after: x = 10; y = x; x = 20?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">20</button>
      <button class="quiz-q__opt" data-idx="1">10 and 20</button>
      <button class="quiz-q__opt" data-idx="2">10</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Which is a valid Python variable name?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">_total</button>
      <button class="quiz-q__opt" data-idx="1">2nd</button>
      <button class="quiz-q__opt" data-idx="2">my-var</button>
      <button class="quiz-q__opt" data-idx="3">class</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. What does x evaluate to after: x = 5; x += 3; x -= 1?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">7</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
      <button class="quiz-q__opt" data-idx="3">3</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
