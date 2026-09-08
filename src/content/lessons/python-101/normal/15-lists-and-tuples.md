---
title: "Lists & Tuples"
description: "Master Python's ordered sequences — mutable lists and immutable tuples."
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

## Lists

Lists are ordered, mutable sequences:

```python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])       # apple
print(fruits[-1])      # cherry
print(fruits[0:2])     # ['apple', 'banana']
```

## List methods

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

## Modifying in place vs returning new

Some methods modify the list (`append`, `sort`, `reverse`) and return `None`.
Others return a new list (`sorted()`, `list.copy()`):

```python
nums = [3, 1, 2]
result = nums.sort()   # result is None! nums is now [1, 2, 3]
result = sorted(nums)  # result is [1, 2, 3], nums unchanged
```

## Tuples

Tuples are ordered, **immutable** sequences:

```python
point = (3, 4)
print(point[0])   # 3
# point[0] = 5   # TypeError!
```

Use tuples for fixed data: coordinates, RGB colors, database rows.

## Unpacking

Assign sequence elements to variables in one line:

```python
x, y = (3, 4)         # x=3, y=4
a, b, *rest = [1, 2, 3, 4, 5]  # a=1, b=2, rest=[3, 4, 5]
first, *_, last = (1, 2, 3, 4)  # first=1, last=4
```

## Common pitfalls

- **`sort()` returns None** — assign the result of `sorted()` instead if you want a new list
- **Shallow copies**: `a = b` doesn't copy the list; use `a = b.copy()` or `a = list(b)`
- **Mixing types**: `[1, "two", 3.0]` works but makes code harder to reason about

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Remove all duplicates from a list while preserving order: `[1, 3, 2, 3, 1, 4, 2]` → `[1, 3, 2, 4]`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>list(dict.fromkeys(nums))</code> — dict preserves insertion order in Python 3.7+.</p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Swap two variables without a temporary variable using tuple unpacking.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>a, b = b, a</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- When would you choose a tuple over a list? What does immutability give you?
- Why does `sort()` modify in place while `sorted()` returns a new list? When would you prefer each?
- How does `*rest` in unpacking work? Can you use `*_` for named discard?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

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
</section>
