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

## Local scope

Variables created inside a function are local — they don't exist outside:

```python
def my_func():
    x = 10
    print(x)  # works

my_func()
# print(x)  # NameError: x is not defined
```

## Global scope

Variables defined at the module level are accessible everywhere:

```python
counter = 0

def increment():
    global counter
    counter += 1

increment()
print(counter)  # 1
```

**Prefer returning values over using `global`** — it makes code easier to test and reason about.

## Nested scope and nonlocal

Inner functions can read variables from the outer function, but can't reassign them without `nonlocal`:

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

## Lambda functions

`lambda` creates a small anonymous function in one line:

```python
add = lambda a, b: a + b
print(add(3, 5))  # 8
```

Equivalent to:

```python
def add(a, b):
    return a + b
```

## Lambdas with higher-order functions

Lambdas shine when passed as arguments to other functions:

```python
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]

# Sort by score (second element)
by_score = sorted(students, key=lambda s: s[1])
print(by_score)  # [('Charlie', 78), ('Alice', 85), ('Bob', 92)]

# Map: apply a function to every item
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))
# [2, 4, 6, 8]

# Filter: keep items that pass a test
evens = list(filter(lambda x: x % 2 == 0, nums))
# [2, 4]
```

## Common pitfalls

- **Using `global` when you should return a value** — it hides side effects
- **Overusing lambdas** — if it needs more than one expression, use `def`
- **Confusing scope in nested functions** — always check where a variable is defined

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Sort this list of words by their length: `words = ["banana", "pie", "Washington", "a"]`

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>sorted(words, key=lambda w: len(w))</code> → <code>['a', 'pie', 'banana', 'Washington']</code></p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Use `filter` with a lambda to extract all words longer than 3 characters from `["hi", "hello", "hey", "howdy", "yo"]`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>list(filter(lambda w: len(w) > 3, words))</code> → <code>['hello', 'howdy']</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why does Python use `nonlocal` instead of just letting inner functions reassign outer variables? What problem does this solve?
- When would you use `map`/`filter` with lambdas versus a list comprehension? Is one better?
- Can a lambda have multiple statements? Why or why not?

</section>

<section class="lesson-section lesson-section--projects">
<h2 id="-projects-you-can-build">Projects You Can Build</h2>

<p>Here are a few real-world projects that reinforce these concepts:</p>

<ul>
  <li>🛠️ <strong>CLI Framework</strong> - Use closures for command handlers and lambdas for sorting options</li>
  <li>🧰 <strong>Document Converter</strong> - Apply map/filter with lambdas for text transformations</li>
  <li>💰 <strong>Expense Tracker</strong> - Use lambdas for sorting expenses and closures for category filters</li>
</ul>

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

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
    <p class="quiz-q__prompt">2. Which keyword allows an inner function to modify an outer variable?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nonlocal</button>
      <button class="quiz-q__opt" data-idx="1">global</button>
      <button class="quiz-q__opt" data-idx="2">outer</button>
      <button class="quiz-q__opt" data-idx="3">closure</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>
