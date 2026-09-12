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

## Three tools that supersede manual counting

Loops gave you repetition; this lesson hands you the three helpers that keep the counting out of your hands. Each replaces a habit you were taught to write by hand, and each is the answer to a recurring irritation: generating numbers, needing the position of an item, and pairing two lists. Together they are the difference between a loop that types and a loop that reads.

## Range: the arithmetic sequence, lazily

In the last lesson you summed with `range(5)`. It deserves a closer look — it is the classical tool for *"do this a known number of times"*:

```python
for i in range(5):
    print(i)  # 0 1 2 3 4
```

`range` has three forms, mirroring the arithmetic progression $a, a+d, a+2d, \ldots$:

```python
range(5)        # 0, 1, 2, 3, 4
range(2, 8)     # 2, 3, 4, 5, 6, 7
range(0, 20, 3) # 0, 3, 6, 9, 12, 15, 18
```

One argument gives $0, 1, \ldots, n-1$; two give the half-open interval $[\text{start}, \text{stop})$; three add the common difference $d$. Crucially, `range` is **lazy**: it records the parameters and computes each value only as the loop asks for it. Asking for a million steps costs no more memory than asking for five — the sequence is never materialized.

## Enumerate: the position, without the counter

Want the position of each item? The freshman instinct is a manual counter:

```python
fruits = ["apple", "banana", "cherry"]

i = 0
for fruit in fruits:
    print(f"{i}: {fruit}")
    i += 1
```

The `i += 1` is a temptation to drift out of sync: forget one, and position labels scramble. `enumerate` produces both halves in one step — the index and the item — so there is nothing to keep in sync:

```python
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# Respondents number people from 1:
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}: {fruit}")
```

Where a mathematician writes $b_i = a_i + i$ to attach position to value, `enumerate` hands the pair $(i, a_i)$ to the loop body directly.

## Zip: alignment by position

Two parallel lists — names and scores — cry out to be read together. `zip` aligns them element by element:

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 85
# Bob: 92
# Charlie: 78
```

The pairing is the Cartesian trick of running along both lists with a single cursor, forming the tuples $(n_0, s_0), (n_1, s_1), \ldots$. When the lists differ in length, the pairing stops at the shorter one, so nothing is ever half-paired. If you need the crooked tail too, `itertools.zip_longest` fills it:

```python
import itertools
for pair in itertools.zip_longest([1, 2], [3, 4, 5], fillvalue=0):
    print(pair)  # (1, 3), (2, 4), (0, 5) — no value is dropped
```

## A worked example: the class ledger

Watch the three tools compose. A teacher holds a list of names and a parallel list of scores, and wants a numbered report:

```python
names = ["Dina", "Omar", "Sara"]
scores = [78, 91, 85]

for i, (name, score) in enumerate(zip(names, scores), start=1):
    print(f"#{i} {name}: {score}")
# #1 Dina: 78
# #2 Omar: 91
# #3 Sara: 85

print(f"Top score: {max(scores)}")   # Top score: 91
```

Read the loop header from the inside out: `zip` pairs each name with its score; the parentheses `(name, score)` unpack that pair; `enumerate` numbers the pairs starting at one; and `i` receives the number. Four gestures that would have cost you a hand-written counter now read like the sentence they describe — position attaches to value, pair by pair, exactly as $b_i = a_i + i$ attaches an index to every term.

## Common pitfalls

- **`range` is exclusive at the top.** `range(5)` yields $0, 1, 2, 3, 4$ — five numbers, none equal to $5$. Think half-open interval, $[0, 5)$.
- **`enumerate` on a dict.** Iterating a dict gives its keys; `enumerate` would number the keys, not the pairs. Use `dict.items()` when you want key and value.
- **`zip` with unequal lengths.** Elements past the shorter input vanish silently. Notice the loss, or fill with `zip_longest`.
- **`zip` is a one-shot iterator.** In Python 3, `p = zip(a, b)` hands you an iterator, not a list: `list(p)` consumes it, and a second `list(p)` is empty. Convert eagerly with `list(zip(a, b))` when you'll revisit the pairs.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Use `enumerate` to print each color in `colors = ["red", "green", "blue"]` with its position starting at 1.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>for i, color in enumerate(colors, 1): print(f"{i}. {color}")</code> — the <code>start</code> argument renumbers the pairings from one.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given `keys = ["a", "b"]` and `values = [1, 2]`, use `zip` to build a dictionary.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>dict(zip(keys, values))</code> → <code>{"a": 1, "b": 2}</code> — the aligned pairs become the mapping's entries.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why prefer `range` over spelling the list `[0, 1, 2, 3, 4]`? What changes when the list would hold a million numbers?
- Since `zip` stops at the shortest input, how would you detect which side was shorter? When does that distinction matter?
- Can `enumerate` walk a dict? What exactly do the indices number?

## ✅ Quick check

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