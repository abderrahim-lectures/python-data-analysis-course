---
title: "Range, Enumerate & Zip"
description: "Generate number sequences, track indices, and combine iterables."
module: "control-flow"
order: 10
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Use range() to generate number sequences"
  - "Use enumerate() to get index + value during iteration"
  - "Use zip() to iterate over multiple sequences in parallel"
  - "Write Pythonic loops that avoid manual index tracking"
prerequisites: ["09-for-while-loops"]
tags: ["range", "enumerate", "zip", "iteration"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Range

`range()` generates a sequence of integers — useful for repeating code a specific number of times:

```python
for i in range(5):
    print(i)  # 0 1 2 3 4
```

Three forms:

```python
range(5)       # 0, 1, 2, 3, 4
range(2, 8)    # 2, 3, 4, 5, 6, 7
range(0, 20, 3) # 0, 3, 6, 9, 12, 15, 18
```

`range` is lazy — it doesn't create all numbers at once. This makes it memory-efficient for large sequences.

## Enumerate

`enumerate()` adds a counter to any iterable, so you don't need manual index variables:

```python
fruits = ["apple", "banana", "cherry"]

# Clunky:
i = 0
for fruit in fruits:
    print(f"{i}: {fruit}")
    i += 1

# Pythonic:
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# Start counting from 1:
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}: {fruit}")
```

## Zip

`zip()` combines multiple iterables, pairing elements by position:

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 85
# Bob: 92
# Charlie: 78
```

Stop at the shortest iterable by default, or use `itertools.zip_longest` to go to the longest.

## Common pitfalls

- **Forgetting that `range` is exclusive** at the top end: `range(5)` gives 0–4, not 0–5
- **Using `enumerate` on a `dict`** — iterating a dict gives keys by default; use `.items()` for key-value pairs
- **Zipping unequal lengths** — you silently lose elements; consider `zip_longest` with a fill value

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Use `enumerate` to print each item in `colors = ["red", "green", "blue"]` with its position starting at 1.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>for i, color in enumerate(colors, 1): print(f"{i}. {color}")</code></p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given `keys = ["a", "b"]` and `values = [1, 2]`, use `zip` to create a dictionary.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>dict(zip(keys, values))</code> → <code>{"a": 1, "b": 2}</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why is `range` preferred over creating a list `[0, 1, 2, 3, 4]`? What happens when you need a million numbers?
- If `zip` stops at the shortest iterable, how would you detect which inputs were shorter? When would that matter?
- Can you `enumerate` a `dict`? What do the indices represent?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

<div class="quiz" data-quiz="python-101-range-enumerate-zip">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What is <code>list(range(1, 10, 2))</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2, 3, 4, 5, 6, 7, 8, 9]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 3, 5, 7, 9]</button>
      <button class="quiz-q__opt" data-idx="2">[2, 4, 6, 8]</button>
      <button class="quiz-q__opt" data-idx="3">[1, 2, 4, 8]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. What does <code>list(zip([1, 2], [3, 4, 5]))</code> return?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[(1, 3), (2, 4), (5,)]</button>
      <button class="quiz-q__opt" data-idx="1">[(1, 3, 5), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="2">[(1, 3), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="3">[(1, 2), (3, 4, 5)]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>
