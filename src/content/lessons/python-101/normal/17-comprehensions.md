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

## Set-builder notation come to life

Mathematics has a compact way to describe a collection built from another: the set-builder. The comprehension is that notation, typed directly:

$$
\{x^2 \mid x \in \{0, 1, \ldots, 5\}\} = \{0, 1, 4, 9, 16, 25\}.
$$

Read *"the set of $x^2$, for each $x$ in this source"* — and the Python is the same sentence reversed into code:

```python
# Regular loop
squares = []
for x in range(6):
    squares.append(x ** 2)

# Comprehension
squares = [x ** 2 for x in range(6)]
# [0, 1, 4, 9, 16, 25]
```

The loop spells out three moves — start empty, append, repeat; the comprehension states the whole collection in one line that mirrors the set-builder's anatomy: the expression up front, the ranged variable behind it.

## Filtering with conditions

Set-builder notation also carries membership tests. $\{w \in words \mid |w| > 2\}$ becomes a trailing `if`:

```python
evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]

long_words = [w.upper() for w in ["hi", "hello", "hey"] if len(w) > 2]
# ['HELLO', 'HEY']
```

An `if` at the end is a *filter*: only the elements that pass it reach the expression. The element travels expression → filter → list, in the order the sentence reads.

## If/else as an expression

The `if...else` you already know is an *expression* — it produces a value. Sticking one *before* the `for` plants it in the build line, choosing per element rather than filtering per element:

```python
labels = ["even" if x % 2 == 0 else "odd" for x in range(5)]
# ['even', 'odd', 'even', 'odd', 'even']
```

The two positions are a fork with distinct jobs: after the `for`, the clause *votes* on elements; before the `for`, it *labels* them. One discards, the other transforms.

## Dict comprehensions

The same shape builds mappings — expression on the left of the colon becomes the key, expression on the right the value:

```python
squares_dict = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Invert a dict
original = {"a": 1, "b": 2}
inverted = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b'}
```

The inversion is the elegant classic: walk `items()`, and swap which half of each pair becomes the key.

## Set comprehensions

Braces with a comprehension yield a set — uniqueness applied automatically:

```python
lengths = {len(word) for word in ["hello", "hi", "hey"]}
# {2, 3, 5}  (unique lengths)
```

Three lengths collapse to a set of values, dropping the duplicate as a set must.

## Nested comprehensions: flattener

A matrix is a list of rows, and flattening it is two loops in one expression — read the `for` clauses left to right, outer first:

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

Each `for` unwraps one level: `row` iterates the outer list, `num` iterates each row, and the collection's order follows the loops exactly.

## A worked example: three lines from the set-builder

The lesson's three moves — build, filter, label — one line each:

```python
squares = [x ** 2 for x in range(2, 9)]
# [4, 9, 16, 25, 36, 49, 64]

numbers = [x for x in range(1, 11) if x % 3 == 0]
# [3, 6, 9]

labels = ["even" if x % 2 == 0 else "odd" for x in numbers]
# ['odd', 'even', 'odd']
```

The first is $\{x^2 \mid x \in [2, 9)\}$ typed directly; the second filters the divisors of $3$; the third labels each survivor. What the set-builder states in one breath, the comprehension spells in one line.

## When NOT to use comprehensions

- When the logic turns knotty — a regular `for` loop earns its readability.
- When the body needs `try/except` — comprehensions have no room for it.
- When side effects matter — printing or writing files should be deliberate statements, not silent expressions.
- **Putting `if` before the `for` labels instead of filtering.** `[x if x % 2 == 0 else 'odd' for x in ...]` keeps every element, merely relabeled; only an `if` after the `for` discards. Slot it wrong and the rejects silently stay.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Flatten `[[1, 2], [3, 4], [5, 6]]` into `[1, 2, 3, 4, 5, 6]` with a comprehension.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>[num for row in matrix for num in row]</code> — the outer <code>for</code> opens each row, the inner one unrolls it.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Map words to their lengths with a dict comprehension: `["hi", "hello", "hey"]` → `{"hi": 2, "hello": 5, "hey": 3}`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>{w: len(w) for w in words}</code> — the word is the key and its length the value, one pair per entry.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does `if...else` stand before the `for` in a comprehension while the filter `if` trails after it?
- Where does a comprehension cross the line into harder reading than a loop? Where do you draw it?
- Can `await` appear inside a comprehension — and what syntax makes a whole async version possible?

## ✅ Quick check

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