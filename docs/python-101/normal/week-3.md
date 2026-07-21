---
title: "Week 3: Data Structures"
sidebar_position: 3
section: python-101
track: normal
week: 3
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 3: Lists, Dicts, Tuples & Sets

<span className="gamified-flourish">📦 One variable holds one value. This week, one variable holds a whole collection.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Store ordered, mutable collections in a `list`, and index/slice them.
- Store key–value mappings in a `dict`, the Python analogue of a function's lookup table.
- Explain when a `tuple` (immutable) or a `set` (unordered, unique) is the better fit than a `list`.

## Lesson

### Lists: ordered sequences

A `list` is an ordered, mutable sequence — think of it as a finite sequence $(a_0, a_1, \dots, a_{n-1})$:

```python
scores = [88, 92, 74, 95]
scores[0]        # 88 — indexing starts at 0
scores[-1]       # 95 — negative indices count from the end
scores[1:3]      # [92, 74] — slicing: [start, stop)
scores.append(100)   # adds to the end
len(scores)       # 5
```

Slicing `scores[1:3]` follows the same half-open convention as `range` — it's the same "start included, stop excluded" idea you already used last week.

**List comprehensions** are the Python spelling of set-builder notation. Compare $\{x^2 : x \in \{1,\dots,5\}\}$ to:

```python
squares = [x**2 for x in range(1, 6)]   # [1, 4, 9, 16, 25]
```

Adding a condition mirrors $\{x \in S : P(x)\}$:

```python
evens = [x for x in range(20) if x % 2 == 0]
```

### Dicts: key–value mappings

A `dict` maps keys to values, like a function $f: K \to V$ defined only on a finite domain:

```python
ages = {"amina": 21, "youssef": 23}
ages["amina"]          # 21
ages["sara"] = 19       # adds a new key
"sara" in ages          # True — membership test
for name, age in ages.items():
    print(name, "is", age)
```

Looking up a missing key with `ages["missing"]` raises a `KeyError` — use `.get("missing", default)` when a key might not exist.

### Tuples: immutable, fixed-shape sequences

A `tuple` looks like a list but can't be changed after creation — useful for values that are naturally a fixed group, like a coordinate pair:

```python
point = (3, 4)
x, y = point            # unpacking
```

Because tuples are immutable, they can be used as dict keys; lists cannot.

### Sets: unique, unordered collections

A `set` is the direct Python equivalent of a mathematical set — no order, no duplicates:

```python
a = {1, 2, 3}
b = {2, 3, 4}
a | b   # union: {1, 2, 3, 4}
a & b   # intersection: {2, 3}
a - b   # difference: {1}
```

## 🧩 Challenges

<Challenge id="python101-normal-w3-c1" answer={<>[grade for grade in grades if grade &gt;= 60] — a list comprehension filtering with a condition, the code form of {'{'}g ∈ grades : g ≥ 60{'}'}.</>}>

Given `grades = [55, 72, 88, 40, 91, 60]`, write a one-line list comprehension producing only the passing grades (≥ 60).

</Challenge>

<Challenge id="python101-normal-w3-c2" answer={<>Loop over the words, and for each one do <code>counts[word] = counts.get(word, 0) + 1</code> — this is a frequency table, the same structure the Hard track builds on in Week 2.</>}>

Given a list of words, build a `dict` mapping each unique word to how many times it appears (a "word frequency count").

</Challenge>

<Challenge id="python101-normal-w3-c3" answer={<>Convert both lists to sets and use set difference: <code>set(roster_a) - set(roster_b)</code> gives students in A but not B.</>}>

You have two lists of student names, `roster_a` and `roster_b`. Find students who are in `roster_a` but *not* in `roster_b`, without writing a manual loop.

</Challenge>

<Challenge id="python101-normal-w3-c4" answer={<>Tuples are the right choice: a coordinate pair shouldn't be mutated in place, and its fixed two-element shape matches a tuple's fixed-shape nature better than a list, which implies "a growable sequence."</>}>

Would you store a 2D coordinate `(x, y)` as a `list` or a `tuple`? Justify your choice using what makes each type distinct.

</Challenge>

## 🤔 Socratic Questions

- `list1 = [1, 2, 3]; list2 = list1; list2.append(4)`. What is `list1` now? Why does this differ from what you might expect from Week 1's discussion of "names point to values" with plain numbers?
- Why can't a `list` be used as a dict key, but a `tuple` can? What property of the key does a `dict` actually need?
- `{1, 2, 2, 3}` — what does this evaluate to, and why does that make a `set` a natural tool for "remove duplicates from this list"?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-normal-week-3"
  questions={[
    {
      id: 'q1',
      prompt: 'What does scores[1:3] return for scores = [10, 20, 30, 40, 50]?',
      options: ['[10, 20]', '[20, 30]', '[20, 30, 40]', '[10, 20, 30]'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Which collection type cannot contain duplicate values?',
      options: ['list', 'tuple', 'set', 'dict values'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: "What is the safest way to look up a key that might not exist in a dict?",
      options: ['d[key]', 'd.get(key, default)', 'd.find(key)', 'key in d[...]'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Which type is immutable (cannot be changed after creation)?',
      options: ['list', 'dict', 'set', 'tuple'],
      correctOptionIndex: 3,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-3" />
