---
title: "Comprehensions"
description: "Build lists, dicts, and sets concisely with comprehension syntax."
module: "data-structures"
order: 17
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Write list comprehensions with filtering and conditions"
  - "Create dict and set comprehensions"
  - "Use nested comprehensions for 2D structures"
  - "Know when to use a comprehension vs a regular loop"
prerequisites: ["16-dicts-and-sets"]
tags: ["comprehensions", "list-comp", "dict-comp", "set-comp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## List comprehensions

A concise way to create lists from iterables:

```python
# Regular loop
squares = []
for x in range(6):
    squares.append(x ** 2)

# Comprehension
squares = [x ** 2 for x in range(6)]
# [0, 1, 4, 9, 16, 25]
```

## Filtering with conditions

Add an `if` clause to filter items:

```python
evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]

long_words = [w.upper() for w in ["hi", "hello", "hey"] if len(w) > 2]
# ['HELLO', 'HEY']
```

## If/else in comprehensions

Use `if...else` **before** the `for` (it's an expression, not a filter):

```python
labels = ["even" if x % 2 == 0 else "odd" for x in range(5)]
# ['even', 'odd', 'even', 'odd', 'even']
```

## Dict comprehensions

```python
squares_dict = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Invert a dict
original = {"a": 1, "b": 2}
inverted = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b'}
```

## Set comprehensions

```python
lengths = {len(word) for word in ["hello", "hi", "hey"]}
# {2, 3, 5}  (unique lengths)
```

## Nested comprehensions

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## When NOT to use comprehensions

- When the logic is complex — a regular `for` loop is more readable
- When you need `try/except` inside the loop
- When side effects matter (printing, writing files)

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Use a list comprehension to flatten `[[1, 2], [3, 4], [5, 6]]` into `[1, 2, 3, 4, 5, 6]`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>[num for row in matrix for num in row]</code></p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Use a dict comprehension to map words to their lengths: `["hi", "hello", "hey"]` → `{"hi": 2, "hello": 5, "hey": 3}`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>{w: len(w) for w in words}</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why does `if...else` go before `for` in a comprehension but after `for` in a regular loop?
- When does a comprehension become harder to read than a regular loop? Where do you draw the line?
- Can you use `await` inside a comprehension? What special syntax do you need?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

<div class="quiz" data-quiz="python-101-comprehensions">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. What does <code>[x * 2 for x in range(4) if x > 1]</code> produce?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[0, 2, 4, 6]</button>
      <button class="quiz-q__opt" data-idx="1">[2, 4]</button>
      <button class="quiz-q__opt" data-idx="2">[4, 6]</button>
      <button class="quiz-q__opt" data-idx="3">[0, 2]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Which is the correct dict comprehension?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{k: v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="1">{k, v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="2">{k: v in items}</button>
      <button class="quiz-q__opt" data-idx="3">dict(k: v for k, v in items)</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>
