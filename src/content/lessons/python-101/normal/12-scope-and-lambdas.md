---
title: "Scope & Lambdas"
description: "Understand variable scope and write concise inline functions."
module: "functions"
order: 12
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Understand local vs global scope"
  - "Use the global and nonlocal keywords"
  - "Write lambda functions for short operations"
  - "Apply lambdas with sorted(), map(), filter()"
prerequisites: ["11-defining-functions"]
tags: ["scope", "global", "lambda", "sorted", "map", "filter"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Where does a name live?

A variable is a name bound to a value — but *where* that binding holds is scope. Mathematics marks this too: in $f(x) = x^2$, the letter $x$ is a placeholder living only inside the definition. Outside, $x$ may mean something entirely different. Python draws the same walls around function bodies: a variable created inside a function is **local** — it exists inside the walls and nowhere else.

```python
def my_func():
    x = 10
    print(x)  # works

my_func()
# print(x)  # NameError: x is not defined
```

Variables defined at the module level, on the other hand, are visible everywhere beneath — they are **global**:

```python
counter = 0

def increment():
    global counter
    counter += 1

increment()
print(counter)  # 1
```

The trouble with `global` is that it lets a function rewrite the world from inside. The binding changes where nothing in the call told you it would. **Prefer returning values over reaching for `global`** — a function that returns is a function you can test and reason about in isolation.

## Nested scope and nonlocal

Functions may nest, and an inner function can *read* an outer variable. Reassigning it, though, requires the `nonlocal` keyword — a confession that the name belongs to the enclosing scope:

```python
def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter()
print(counter())  # 1
print(counter())  # 2
```

The inner `increment` carries its own memory: each call bumps the captured `count`. This is closure — a function with a pocket of state it drags along after its enclosing function has finished.

## Lambda: the inline function

A function that fits on one line has a shorthand. `lambda` creates a small anonymous function — a formula in expression form:

```python
add = lambda a, b: a + b
print(add(3, 5))  # 8
```

It is equivalent to the `def` you already know:

```python
def add(a, b):
    return a + b
```

The difference is one of weight: `def` writes the whole ceremony for anything with steps; `lambda` stays inline for a single expression, no document later, no `return` — the expression after the colon *is* the return value.

## Lambdas with higher-order functions

Lambdas earn their keep when handed to functions that take a function as input. Sorting by score, mapping every element, keeping the elements that pass a test — each is set-builder notation in code:

```python
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]

# Sort by score (second element)
by_score = sorted(students, key=lambda s: s[1])
print(by_score)  # [('Charlie', 78), ('Alice', 85), ('Bob', 92)]

# Map: apply a function to every item — $\{2x \mid x \in \text{nums}\}$
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))
# [2, 4, 6, 8]

# Filter: keep items that pass a test — $\{x \in \text{nums} \mid x \equiv 0 \pmod{2}\}$
evens = list(filter(lambda x: x % 2 == 0, nums))
# [2, 4]
```

`map` transforms each element; `filter` keeps the elements a predicate approves of; `sorted` orders by a chosen key. Three common data operations, each accepting a tiny function as its customization knob.

## A worked example: the clean function

Scope's advice — prefer returning over `global` — has a ready shape: a price with a tax rate as a parameter:

```python
def price_with_tax(price, rate=0.2):
    return round(price * (1 + rate), 2)

price_with_tax(10.0)        # 12.0
price_with_tax(10.0, 0.08)  # 10.8
```

The clean function needs no `global`: the rate arrives as a parameter, the outside world stays untouched, and the formula reads — $\text{price} \cdot (1 + \text{rate})$. Everything happens inside the walls, and the result returns through `return`.

## Common pitfalls

- **Using `global` when a return would do.** It hides the side effect and couples the function to its surroundings.
- **Overusing lambdas.** One expression only; the moment a lambda needs two steps, `def` it.
- **Confusing scope in nested functions.** When a variable is read, Python walks outward looking for it; a `nonlocal` or `global` shout changes who can write it. Read this logic before assuming the binding.
- **`sorted` without a `key` sorts by the element itself.** Tuples sort lexicographically by their first element first; to sort by the second, the `key` is mandatory — `sorted(students, key=lambda s: s[1])`.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Sort the words `words = ["banana", "pie", "Washington", "a"]` by length.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>sorted(words, key=lambda w: len(w))</code> → <code>['a', 'pie', 'banana', 'Washington']</code> — the key function lifts every word into the number being compared.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Use `filter` with a lambda to keep the words longer than three characters from `["hi", "hello", "hey", "howdy", "yo"]`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>list(filter(lambda w: len(w) > 3, words))</code> → <code>['hello', 'howdy']</code> — the predicate is your membership condition, and <code>filter</code> is the set-builder.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does Python demand `nonlocal` instead of letting inner functions reassign an outer variable freely? What mistakes does the requirement prevent?
- `map`/`filter` with a lambda versus a list comprehension — when is each the clearer spelling?
- A lambda accepts a single expression only. What limitation hides behind that rule?

## ✅ Quick check

<div class="quiz" data-quiz="python-101-scope-lambdas">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. What does <code>sorted(["banana", "pie", "a"], key=len)</code> return?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="1">['banana', 'pie', 'a']</button>
      <button class="quiz-q__opt" data-idx="2">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Which keyword lets an inner function modify an outer variable?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nonlocal</button>
      <button class="quiz-q__opt" data-idx="1">global</button>
      <button class="quiz-q__opt" data-idx="2">outer</button>
      <button class="quiz-q__opt" data-idx="3">closure</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>