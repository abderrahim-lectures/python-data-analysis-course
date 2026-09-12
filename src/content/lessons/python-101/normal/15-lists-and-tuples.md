---
title: "Lists & Tuples"
description: "Master Python's ordered sequences, mutable lists and immutable tuples."
module: "data-structures"
order: 15
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Create and access lists and tuples"
  - "Use list methods: append, extend, pop, sort, reverse"
  - "Understand tuple immutability and when to use tuples"
  - "Unpack sequences with assignment and *rest"
prerequisites: ["14-string-slicing"]
tags: ["lists", "tuples", "append", "sort", "unpacking"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## The ordered, editable sequence

A list is a sequence you can grow, shrink, and rearrange. Access obeys everything slicing taught you:

```python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])       # apple
print(fruits[-1])      # cherry
print(fruits[0:2])     # ['apple', 'banana']
```

Indexing from $0$, negative indices counting back, slices taking windows, the same three skills, now aimed at a collection of any objects. Where a string was frozen, the list is clay.

## The list's toolkit

The methods are a workshop of edits:

```python
nums = [3, 1, 4, 1, 5]
nums.append(9)       # [3, 1, 4, 1, 5, 9]
nums.insert(0, 0)    # [0, 3, 1, 4, 1, 5, 9]
nums.extend([2, 6])  # [0, 3, 1, 4, 1, 5, 9, 2, 6]
nums.pop()           # removes 9, returns it
nums.remove(1)       # removes first 1
nums.sort()          # sorts in place
nums.reverse()       # reverses in place
len(nums)            # current length
```

`append` adds one item at the end; `extend` pours a whole sequence in; `insert` slides one in at a chosen position. `pop` removes from the end (or a given index) and hands you the removed value; `remove` deletes the first matching item. The list is the mutable cousin of workhorses like $\pi$'s digit expansion, a growing string of values you keep editing.

## Lists of lists: tables and matrices

A list's elements can themselves be lists, which turns a flat sequence into a table, a matrix is a list of rows, and each row is a list of numbers:

```python
matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]
print(matrix[1][2])     # 6  — row 1, column 2
print(matrix[1])        # [4, 5, 6]
```

`matrix[1]` picks the second row; adding `[2]` descends into that row and picks its third element. Two indices address a cell exactly the way the subscript $M_{1,2}$ names an entry of a matrix on paper. The same trick builds grids, game boards, and spreadsheet rows.

## Mutation vs. new list: a fork that bites

Here is a mismatch that bruises beginners. **Some methods mutate the list and return `None`; others return a fresh list and leave the original.** A method's voice doesn't tell you which:

```python
nums = [3, 1, 2]
result = nums.sort()   # result is None! nums is now [1, 2, 3]
result = sorted(nums)  # result is [1, 2, 3], nums unchanged
```

`nums.sort()` reorders in place and returns nothing, the value of your expression is `None`. `sorted(nums)` computes a new, ordered list and leaves `nums` untouched. The naming is the signal: verbs like `sort` and `reverse` touch the object; `sorted` and `list.copy()` render a copy for a new holder.

## Tuples: the frozen sequence

A tuple is an ordered, **immutable** sequence, a list that lost its editing tools:

```python
point = (3, 4)
print(point[0])   # 3
# point[0] = 5   # TypeError!
```

Immutability is not a handicap; it is a promise. The point $(3, 4)$ is a single mathematical object that should not change under your feet. Coordinates, RGB colors, database rows, data that is *fixed by definition* belongs in tuples, where accidental reassignment becomes an exception instead of a silent corruption.

## Unpacking: one line, many names

A sequence can fold itself into several variables in a single assignment. Python even collects the overflow with a starred name:

```python
x, y = (3, 4)         # x=3, y=4
a, b, *rest = [1, 2, 3, 4, 5]  # a=1, b=2, rest=[3, 4, 5]
first, *_, last = (1, 2, 3, 4)  # first=1, last=4
```

`*rest` swallows everything between the named slots; `*_` is the same gesture wearing the conventional "discard this" name. This is the list version of evaluating a function at a point, inputs and outputs line up by position.

## A worked example: the grading book

Watch the toolkit work on a real task, a class's quiz scores:

```python
scores = []
scores.append(8)
scores.append(6)
scores.extend([9, 7, 10])

total = sum(scores)       # sum() adds every element
best = max(scores)        # max() finds the largest
count = len(scores)       # len() counts them
average = total / count

print(average)            # 8.0
print(best)               # 10
```

Collect with `append`/`extend`, then read with `sum`, `max`, and `len`. Notice the division: `total / count` is the arithmetic mean, the same $\frac{\text{sum}}{\text{count}}$ you know from math, now one line of code. A list is a place to *accumulate* data, and the loop between growing it and reading it is the pattern every real program repeats.

## Common pitfalls

- **`sort()` returns `None`.** If you want a new list, let `sorted()` bear the value.
- **Shallow copy confusion.** `a = b` makes two names for one list; `a = b.copy()` or `a = list(b)` builds a separate list.
- **Mixing types.** `[1, "two", 3.0]` is legal but makes comparisons and reasoning harder; keep collections honest about their contents.
- **`append` vs `extend`.** `nums.append([1, 2])` nests a list as one element; `nums.extend([1, 2])` pours its items in as separate ones.
- **`remove` deletes only the first match.** `[1, 2, 1].remove(1)` leaves `[2, 1]`; wiping every copy needs a loop (a lesson for later).

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Remove duplicates while preserving order: `[1, 3, 2, 3, 1, 4, 2]` → `[1, 3, 2, 4]`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>list(dict.fromkeys(nums))</code>, a dict keeps insertion order (so 3.7+), and duplicate keys collapse to their first position.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Swap two variables without a temporary, using tuple unpacking.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>a, b = b, a</code>, the right side is evaluated to a tuple first, so the exchange is simultaneous, not sequential.</p>

</div>
</details>

## 🤔 Socratic Questions

- When do you reach for a tuple over a list, and what does immutability buy you?
- Why does `sort()` mutate where `sorted()` returns fresh, and when would you prefer each?
- How does `*rest` collect the overflow? Can `*_` stand in for a named discard?

## ✅ Quick check

<div class="quiz" data-quiz="python-101-lists-tuples">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does <code>a = [1, 2]; b = a; b.append(3); print(a)</code> output?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 2, 3]</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Which is correct? <code>a, b, c = [1, 2]</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">a=1, b=2, c=None</button>
      <button class="quiz-q__opt" data-idx="1">a=1, b=2, c=0</button>
      <button class="quiz-q__opt" data-idx="2">ValueError</button>
      <button class="quiz-q__opt" data-idx="3">a=1, b=2, c=[]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>