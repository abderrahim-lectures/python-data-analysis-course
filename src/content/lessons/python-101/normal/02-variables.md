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

## Why does a value need a name?

Write a program that computes the average of three quiz scores:

$$
\bar{x} = \frac{7.5 + 8.5 + 9.0}{3} = \frac{25.0}{3} \approx 8.33.
$$

Now suppose the scores change, the teacher wants the average of $9.5, 8.5, 10.0$ instead. Without names, the average expression appears in several places and you must find every one of them and edit it by hand. That is a recipe for missing one.

A mathematician solves this by *naming quantities*: write $x_1, x_2, x_3$ once, then refer to them forever after. A program has the same need: values appear again and again, and the machine must find the current one every time. Python's answer is the **variable**, a name that points at a value. Once `score1` names $7.5$, you can write `score1` any number of times and Python looks up its current value each time.

## `=` binds a name to a value

In math, "let $x = 5$" pins the symbol $x$ to the number $5$. Python does the same thing with exactly the same symbol:

```python
score1 = 7.5
score2 = 8.5
score3 = 9.0

average = (score1 + score2 + score3) / 3
print(f"{average:.2f}")    # 8.33
```

The right-hand side is evaluated *first*, and only then does the name on the left start pointing at the result. If you changed the scores and ran the file again, the same computation would use the new values, the names give the machine a place to look up "the current value of $7.5$".

## Names can be re-pointed

Here is where a variable is *not* like a math symbol. In math, $x = x + 1$ is a statement with no solution. In Python it is a perfectly ordinary instruction, read right to left:

$$
x_{n+1} = x_n + 1
$$

says "the next value of $x$ is the current one, plus one." The instant you see this in Python, you are counting:

```python
count = 0
count = count + 1    # old value 0 was read, 1 was computed, the name now points at 1
count = count + 1    # now count names 2
```

Reassignment is *re-pointing a label*, not filling a box. The old value is not "changed" or "replaced", the name simply looks at a different value now.

## Reading-updating-storing is one gesture: `+=`

The pattern above, read `count`, add `1`, point `count` at the result, is so common that Python has a shorthand. Say the step size is $h$ and you are moving through a sequence generically:

$$
x_{n+1} = x_n + h.
$$

Printed out, the update reads `x = x + h`. Python merges the read and the store into one operator:

```python
x = 5
x += 1     # same as x = x + 1   -> 6
x -= 2     # same as x = x - 2   -> 4
x *= 3     # same as x = x * 3   -> 12
x /= 4     # same as x = x / 4   -> 3.0
```

Read `x += h` aloud as *"advance x by h"*, a single motion, the way the recurrence does.

## A name you can say out loud

Almost any word works as a name, but almost anything being *correct* is not the same as being *good*. Which is more informative in a reading of a report script?

```python
x = 87.5                 # names a number, nothing more
quiz_score = 87.5        # names the quantity
```

A few rules and one habit:

- A name starts with a letter or underscore and may only contain letters, digits, underscores, `second_score` ✓, `2nd_score` ✗.
- Python's convention is **snake_case**: lowercase words joined by `_`, so `student_name`, not `studentName`. It matches how the names read aloud: `quiz_score` is the quiz score.
- A small set of words is **reserved**, `if`, `for`, `class`, `True`, `False`, and cannot be names.

You will reread your own code more often than you write it; the name you choose while writing is what pulls meaning back out later.

## A worked example: the running tally

Reassigning pays off the moment a quantity must be built step by step, the recurrence $x_{n+1} = x_n + h$ with the running sum as $x_n$:

```python
total = 0
total += 8.5     # total becomes 8.5
total += 9.0     # then 17.5
total += 10.0    # then 27.5
average = total / 3
print(f"{average:.2f}")   # 9.17
```

Each `+=` advances one step: read the current value, add, point the name at the result. The names `total` and `average` keep the two quantities distinct, so the recipe reads as what it does.

## Common pitfalls

- **Using a reserved word as a name.** `class = "Math"` raises a `SyntaxError`, `class` is reserved.
- **Starting with a digit.** `2nd_place = "B"` is invalid; `second_place = "B"` is fine.
- **Confusing `=` and `==`.** `=` points a name at a value; `==` asks whether two values are equal. The one-character slip changes a statement into a question.
- **`+=` writes to a name that must already exist.** `total += 1` on a name never assigned raises a `NameError`. The gesture reads the current value first; a name with nothing to read has no current value.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

If `x = 5` and then `y = x`, and then `x = 10`, what is `y`? Explain why in terms of "names point to values" rather than "boxes contain values."

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>y</code> is still <code>5</code>. When <code>y = x</code> ran, both names pointed at <code>5</code>. Re-pointing <code>x</code> at <code>10</code> moves <code>x</code>'s label; <code>y</code> still points at <code>5</code>. Labels point; nothing is "copied into a box".</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Write a program that swaps two variables: `a = 7`, `b = 3`. After the swap, `a` should be `3` and `b` should be `7`. Do it without a temporary variable (Python has a neat trick).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>a, b = b, a</code>, Python evaluates the right side first (both old values), then points the left-hand names at them. No temp variable needed.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Which of these are valid variable names, and why do the invalid ones fail: `_count`, `2nd`, `my-name`, `total`, `class`?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>_count</code> ✓ (underscore start is fine), <code>2nd</code> ✗ (starts with a digit), <code>my-name</code> ✗ (the hyphen is the minus operator, not allowed in a name), <code>total</code> ✓, <code>class</code> ✗ (reserved keyword).</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does Python choose `snake_case` over `camelCase`? What does the underscore visual metaphor suggest about how to read variable names?
- `x += 1` and `x = x + 1` give the same result for numbers. Can you think of a reason a language might still offer both forms?
- If variables are *labels, not boxes*, what happens when you write `a = [1, 2, 3]` then `b = a` then `b.append(4)`? Does `a` see the `4`? (Try it, this previews mutable objects, covered much later.)

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