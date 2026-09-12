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

## The mapping

Mathematicians call a table that pairs each input to one output a *function*; Python calls it a **dict**. Keys point to values, exactly as a dictionary of words points to their definitions:

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}
print(scores["Alice"])       # 85
print(scores.get("Dave", 0)) # 0 (default if key missing)
```

Indexing with `[]` is the eager lookup: it demands the key exist. `.get(key, default)` is the courteous variant: if the key is missing, return the fallback instead of raising `KeyError`. The distinction is the difference between a claim and a question.

## The dict's toolkit

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

`keys`, `values`, and `items` are three views of the same relation, the domain, the range, and the graph. `update` merges a second dict in; `setdefault` writes only when the key is absent, the conditional assignment that needs no `if`.

## Walking the mapping

Iteration over a dict walks the domain by default; to see both halves, ask for `items`:

```python
for name in scores:           # keys
    print(name)

for name, score in scores.items():  # key-value pairs
    print(f"{name}: {score}")
```

`items` hands you the pair directly, no manual indexing, because unpacking an entry into `name, score` is the natural reading of a row.

## Sets: the mathematical set

A **set** is a set in the mathematical sense: an unordered collection with no duplicates. Repetition dissolves on entry:

```python
colors = {"red", "blue", "green", "red"}
print(colors)  # {'red', 'blue', 'green'}  (duplicates removed)
```

Uniqueness is enforced structurally, there is no second copy waiting to pollute a membership check. Membership in a set is $x \in S$ exactly: an element is in or out, with no in-between and no earlobing.

## Set operations

The algebra of sets is spelled directly. With $A = \{1, 2, 3, 4\}$ and $B = \{3, 4, 5, 6\}$:

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

a | b    # {1, 2, 3, 4, 5, 6}  (union)
a & b    # {3, 4}              (intersection)
a - b    # {1, 2}              (difference)
a ^ b    # {1, 2, 5, 6}       (symmetric difference)
```

$$
A \cup B = \{1, 2, 3, 4, 5, 6\}, \quad A \cap B = \{3, 4\}, \quad A \setminus B = \{1, 2\}, \quad A \mathbin{\triangle} B = \{1, 2, 5, 6\}.
$$

The operators are the notation you already know. And where the theory promises speed, implementation delivers: membership testing on a set runs in $O(1)$ against a list's $O(n)$, because a set stores elements by a computed fingerprint, not by position.

## The hashing requirement

Fingerprints require stability. Dict keys and set elements must be **hashable**, effectively immutable, so their computes stay reproducible. Strings, numbers, and tuples qualify; lists and dicts do not:

```python
{[1, 2]: "bad"}   # TypeError: unhashable type: 'list'
{(1, 2): "good"}  # Works — tuple is hashable
```

A list could not be a reliable key even if allowed: its hash would change the moment its contents do, turning the mapping into a minefield of stale lookups.

## A worked example: the grade book

The relation, the domain, and the range, one table walked in three postures:

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}

for name, score in scores.items():
    print(f"{name}: {score}")

print(scores.get("Dave", "absent"))   # absent — no KeyError

roles = {"student", "teacher", "admin"}
print("student" in roles)             # True — O(1) membership
```

`items` walks the whole graph, `.get` asks courteously when you do not know the key exists, and `in` on a set is the membership $x \in S$, three questions the lesson's structures answer directly.

## Common pitfalls

- **Accessing missing keys.** `.get()` or a check with `in` spares you a `KeyError`.
- **Relying on dict order.** Python 3.7+ preserves insertion order, but treat it as a convenience, not a contract.
- **Trusting set order.** A set keeps no order whatsoever; never make iteration order a dependency.
- **`{}` is an empty dict; `set()` is the empty set.** `{}` is not a set. Write `set()` for the empty one and `{"a", "b"}` for a literal, one symbol, two meanings.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Count the frequency of each character in `"hello world"` with a dict.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>freq = {}; for c in "hello world": freq[c] = freq.get(c, 0) + 1</code>, the <code>.get</code> fallback of $0$ turns the first sighting into an increment from zero.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Given two lists, find the elements appearing in both, using sets.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>set(a) & set(b)</code> or <code>set(a).intersection(b)</code>, the intersection is $A \cap B$, and the set machinery does the work.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why can't a list serve as a dict key? What property must a key carry?
- When does a set beat a list, what do you lose, and what do you gain?
- How does `dict.get(key, default)` differ from `dict[key]`, and when do you prefer one?

## ✅ Quick check

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