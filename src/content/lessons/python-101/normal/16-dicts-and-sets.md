---
title: "Dicts & Sets"
description: "Map keys to values with dicts and store unique items with sets."
module: "data-structures"
order: 16
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Create and access dictionaries with [] and .get()"
  - "Iterate over dict keys, values, and items"
  - "Use set operations: union, intersection, difference"
  - "Understand dict and set hashing requirements"
prerequisites: ["15-lists-and-tuples"]
tags: ["dict", "set", "keys", "values", "items", "union", "intersection"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Dictionaries

Dicts map keys to values — like a real dictionary maps words to definitions:

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}
print(scores["Alice"])       # 85
print(scores.get("Dave", 0)) # 0 (default if key missing)
```

## Dict methods

```python
scores = {"Alice": 85, "Bob": 92}

scores.keys()         # dict_keys(['Alice', 'Bob'])
scores.values()       # dict_values([85, 92])
scores.items()        # dict_items([('Alice', 85), ('Bob', 92)])

scores["Dave"] = 78   # add new pair
del scores["Bob"]     # remove by key
scores.pop("Alice")   # remove and return value

scores.update({"Eve": 95, "Frank": 88})  # merge
scores.setdefault("Grace", 0)  # set only if key missing
```

## Iterating over dicts

```python
for name in scores:           # keys
    print(name)

for name, score in scores.items():  # key-value pairs
    print(f"{name}: {score}")
```

## Sets

Sets store **unique**, unordered values:

```python
colors = {"red", "blue", "green", "red"}
print(colors)  # {'red', 'blue', 'green'}  (duplicates removed)
```

## Set operations

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

a | b    # {1, 2, 3, 4, 5, 6}  (union)
a & b    # {3, 4}              (intersection)
a - b    # {1, 2}              (difference)
a ^ b    # {1, 2, 5, 6}       (symmetric difference)
```

Sets are fast for membership testing: `x in my_set` is O(1) vs O(n) for lists.

## Hashing requirement

Dict keys and set elements must be **hashable** (immutable): strings, numbers, tuples work. Lists and other dicts don't:

```python
{[1, 2]: "bad"}   # TypeError: unhashable type: 'list'
{(1, 2): "good"}  # Works — tuple is hashable
```

## Common pitfalls

- **Accessing missing keys**: use `.get()` or `in` to avoid `KeyError`
- **Dict ordering**: Python 3.7+ preserves insertion order, but don't rely on it for equality
- **Sets lose order**: never depend on iteration order in a set

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Count the frequency of each character in `"hello world"` using a dict.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>freq = {}; for c in "hello world": freq[c] = freq.get(c, 0) + 1</code></p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given two lists, find the elements that appear in both using a set.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>set(a) & set(b)</code> or <code>set(a).intersection(b)</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why can't you use a list as a dict key? What property does a key need to have?
- When would you use a set instead of a list? What do you lose and what do you gain?
- How does `dict.get(key, default)` differ from `dict[key]`? When would you prefer one?

</section>

<section class="lesson-section lesson-section--projects">
<h2 id="-projects-you-can-build">Projects You Can Build</h2>

<p>Here are a few real-world projects that reinforce these concepts:</p>

<ul>
  <li>✅ <strong>Note-Taking App</strong> - Use dictionaries for storing notes with metadata and sets for tag management</li>
  <li>🧠 <strong>Flashcard App</strong> - Store flashcard decks in dictionaries and track learned cards with sets</li>
  <li>📚 <strong>Knowledge Base</strong> - Build a searchable knowledge base using dictionaries for articles and sets for categorization</li>
</ul>

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

<div class="quiz" data-quiz="python-101-dicts-sets">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. What does <code>{"a": 1, "b": 2}.get("c", 0)</code> return?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">KeyError</button>
      <button class="quiz-q__opt" data-idx="3">'c'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. What is <code>{1, 2, 3} ^ {2, 3, 4}</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{2, 3}</button>
      <button class="quiz-q__opt" data-idx="1">{1, 4}</button>
      <button class="quiz-q__opt" data-idx="2">{1, 2, 3, 4}</button>
      <button class="quiz-q__opt" data-idx="3">{1, 2, 3}</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>
