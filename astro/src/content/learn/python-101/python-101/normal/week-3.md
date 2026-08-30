---
title: "Week 3: Data Structures"
section: python-101
track: normal
week: 3
description: "Work with Python's core data structures — lists, dictionaries, tuples, and sets — through guided challenges and examples."
---

# Week 3: Lists, Dicts, Tuples & Sets

<span class="gamified-flourish">📦 One variable holds one value. This week, one variable holds a whole collection.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Store ordered, mutable collections in a `list`, and index/slice/modify them.
- Store key–value mappings in a `dict`, the Python analogue of a function's lookup table.
- Explain when a `tuple` (immutable) or a `set` (unordered, unique) is the better fit than a `list`.
- Write list and dict comprehensions to build new collections in one line.
- Work with strings as sequences, and nest collections inside each other.

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

Slicing `scores[1:3]` follows the same half-open convention as `range` — it's the same "start included, stop excluded" idea you already used last week. Slicing also accepts a step, `scores[start:stop:step]`, and omitting a bound means "from the beginning" or "to the end":

```python
scores[:2]     # [88, 92]         — everything before index 2
scores[2:]     # [74, 95, 100]    — everything from index 2 onward
scores[::2]    # [88, 74, 100]    — every other element
scores[::-1]   # [100, 95, 74, 92, 88]  — the whole list, reversed
```

Lists are **mutable** — you can change them in place, not just build new ones:

```python
scores[0] = 90          # replace an element
scores.insert(1, 100)   # insert 100 at index 1, shifting the rest right
scores.remove(74)        # remove the first 74 found (by value, not index)
last = scores.pop()       # removes and returns the last element
scores.sort()              # sorts in place, ascending
scores.sort(reverse=True)  # descending
```

`.sort()` changes the list itself and returns `None`; the built-in `sorted(scores)` instead returns a *new*, sorted list and leaves the original untouched — reach for `sorted()` when you need to keep the original order around too.

**List comprehensions** are the Python spelling of set-builder notation. Compare $\{x^2 : x \in \{1,\dots,5\}\}$ to:

```python
squares = [x**2 for x in range(1, 6)]   # [1, 4, 9, 16, 25]
```

Adding a condition mirrors $\{x \in S : P(x)\}$:

```python
evens = [x for x in range(20) if x % 2 == 0]
```

A comprehension can transform *and* filter at once — the expression before `for` doesn't have to be the loop variable unchanged:

```python
passing_doubled = [s * 2 for s in scores if s >= 60]
```

### Strings as sequences

A `str` behaves like a sequence too — indexing, slicing, and `len()` all work the same way they do on a `list`, since a string is really a fixed sequence of characters:

```python
name = "Amina"
name[0]      # "A"
name[-1]     # "a"
name[1:3]    # "mi"
len(name)    # 5
```

The one difference: strings are **immutable** — `name[0] = "B"` raises a `TypeError`. To "change" a string, you build a new one, often with a method: `name.upper()`, `name.lower()`, `name.strip()` (removes surrounding whitespace), `name.replace("A", "B")`, or `name.split(",")` (splits into a `list` of pieces — the tool Python 101 Normal Week 5 will use to hand-parse a CSV file's rows). None of these change `name` itself; each returns a new string (or list).

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

Looking up a missing key with `ages["missing"]` raises a `KeyError` — use `.get("missing", default)` when a key might not exist. A few more dict operations you'll use constantly:

```python
ages.keys()      # a view of all keys: dict_keys(['amina', 'youssef', 'sara'])
ages.values()     # a view of all values: dict_values([21, 23, 19])
del ages["sara"]   # removes a key entirely
ages.update({"karim": 25, "amina": 22})   # adds/overwrites multiple keys at once
```

**Dict comprehensions** mirror list comprehensions, building a `dict` instead of a `list`:

```python
name_lengths = {name: len(name) for name in ages}
# {'amina': 5, 'youssef': 7, 'karim': 5}
```

### Tuples: immutable, fixed-shape sequences

A `tuple` looks like a list but can't be changed after creation — useful for values that are naturally a fixed group, like a coordinate pair:

```python
point = (3, 4)
x, y = point            # unpacking
```

Because tuples are immutable, they can be used as dict keys; lists cannot. This makes a `dict` with tuple keys a natural way to represent a mapping *from pairs of things*, like a grid coordinate to a value:

```python
grid = {(0, 0): "start", (2, 3): "treasure"}
grid[(0, 0)]   # "start"
```

Tuple unpacking also shows up constantly when looping over a dict's `.items()`, as you already saw above: `for name, age in ages.items():` unpacks each `(name, age)` tuple into two variables in one line.

### Sets: unique, unordered collections

A `set` is the direct Python equivalent of a mathematical set — no order, no duplicates:

```python
a = {1, 2, 3}
b = {2, 3, 4}
a | b   # union: {1, 2, 3, 4}
a & b   # intersection: {2, 3}
a - b   # difference: {1}
```

An empty `{}` is actually a `dict`, not a `set` (a historical quirk of the syntax) — use `set()` to create an empty set. Converting a `list` to a `set` and back is the standard trick for removing duplicates while (mostly) preserving the idea of "just the unique values":

```python
names = ["amina", "youssef", "amina", "sara"]
unique_names = list(set(names))   # order is not guaranteed to match the original
```

### Nesting collections

Collections can hold other collections — a list of dicts, a dict of lists, and so on — which is how you represent genuinely structured data, like several students each with several scores:

```python
students = [
    {"name": "Amina", "scores": [88, 92, 79]},
    {"name": "Youssef", "scores": [74, 68, 81]},
]

for student in students:
    average = sum(student["scores"]) / len(student["scores"])
    print(student["name"], round(average, 1))
```

This exact shape — a list of dicts, one dict per record — is close to what you'll get back from reading a CSV file in Week 5, and is essentially a miniature, hand-built version of what a pandas `DataFrame` represents in Section 2.

## ⚠️ Common pitfalls

- **Confusing `.sort()` and `sorted()`.** `scores.sort()` mutates and returns `None` — `x = scores.sort()` leaves `x` as `None`, a common source of confusion. Use `sorted(scores)` if you need the result as a value.
- **Mutating a list while looping over it.** Removing elements from a list inside a `for item in my_list:` loop skips elements, because the indices shift under you mid-iteration. Loop over a copy (`for item in my_list[:]:`) or build a new list instead.
- **Forgetting `dict` keys must be immutable.** `grid[[0, 0]] = "x"` raises a `TypeError: unhashable type: 'list'` — use a tuple `(0, 0)` instead.
- **Assuming `set`/`dict` preserve insertion order the way you'd expect from math.** Modern Python dicts *do* preserve insertion order as an implementation detail, but sets do not guarantee any particular order — never rely on the order you get back from a `set`.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given `grades = [55, 72, 88, 40, 91, 60]`, write a one-line list comprehension producing only the passing grades (≥ 60).

<p class="challenge__answer">💡 <strong>Answer:</strong> [grade for grade in grades if grade &gt;= 60] — a list comprehension filtering with a condition, the code form of {'{'}g ∈ grades : g ≥ 60{'}'}.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given a list of words, build a `dict` mapping each unique word to how many times it appears (a "word frequency count").

<p class="challenge__answer">💡 <strong>Answer:</strong> Loop over the words, and for each one do <code>counts[word] = counts.get(word, 0) + 1</code> — this is a frequency table, the same structure the Hard track builds on in Week 2.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

You have two lists of student names, `roster_a` and `roster_b`. Find students who are in `roster_a` but *not* in `roster_b`, without writing a manual loop.

<p class="challenge__answer">💡 <strong>Answer:</strong> Convert both lists to sets and use set difference: <code>set(roster_a) - set(roster_b)</code> gives students in A but not B.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Would you store a 2D coordinate `(x, y)` as a `list` or a `tuple`? Justify your choice using what makes each type distinct.

<p class="challenge__answer">💡 <strong>Answer:</strong> Tuples are the right choice: a coordinate pair shouldn't be mutated in place, and its fixed two-element shape matches a tuple's fixed-shape nature better than a list, which implies "a growable sequence."</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given a list of names, write a dict comprehension mapping each name to the length of that name.

<p class="challenge__answer">💡 <strong>Answer:</strong> {"{name: len(name) for name in ['Amina', 'Karim', 'Sara']}"} — a dict comprehension mapping each name to its own length, e.g. {"{'Amina': 5, 'Karim': 5, 'Sara': 4}"}.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Using the `students` list of dicts from the worked example, find the name of the student with the *highest* average score, without hardcoding which one it is.

<p class="challenge__answer">💡 <strong>Answer:</strong> Loop over the list of student dicts, and for each one compute <code>sum(student["scores"]) / len(student["scores"])</code>, then use <code>max(...)</code> with a <code>key</code> function (or track a running best manually) to find whichever student's average is highest.</p>

</div>
</details>

## 🤔 Socratic Questions

- `list1 = [1, 2, 3]; list2 = list1; list2.append(4)`. What is `list1` now? Why does this differ from what you might expect from Week 1's discussion of "names point to values" with plain numbers?
- Why can't a `list` be used as a dict key, but a `tuple` can? What property of the key does a `dict` actually need?
- `{1, 2, 2, 3}` — what does this evaluate to, and why does that make a `set` a natural tool for "remove duplicates from this list"?
- A `list` of `dict`s (like `students` above) and a `dict` of `list`s (e.g. `{"Amina": [88, 92, 79], "Youssef": [74, 68, 81]}`) can represent very similar information. What's one question you could answer easily with one shape but awkwardly with the other?
- Strings are immutable but lists are mutable, even though both support indexing and slicing the same way. What practical difference does that make the first time you try to "edit" a string in place versus a list?

## ✅ Weekly quiz
