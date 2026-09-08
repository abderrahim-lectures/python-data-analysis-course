---
title: "Defining Functions"
description: "Create reusable code blocks with def, parameters, and return values."
module: "functions"
order: 11
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Define and call functions with def"
  - "Use positional, keyword, and default parameters"
  - "Return values from functions"
  - "Write docstrings for function documentation"
prerequisites: ["10-range-enumerate-zip"]
tags: ["def", "parameters", "return", "docstrings"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Defining a function

Use `def` followed by a name, parentheses, and a colon:

```python
def greet(name):
    """Print a greeting for the given name."""
    print(f"Hello, {name}!")

greet("Alice")  # Hello, Alice!
```

## Parameters and arguments

Parameters are variables listed in the function definition. Arguments are the values you pass when calling it.

```python
def add(a, b):
    return a + b

result = add(3, 5)  # 8
```

## Default parameters

Give parameters a default value — callers can optionally override it:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # Hello, Alice!
print(greet("Bob", "Hey"))         # Hey, Bob!
```

**Rule**: default parameters must come after non-default parameters.

## Keyword arguments

Call functions by parameter name for clarity:

```python
def create_user(name, age, role="student"):
    return {"name": name, "age": age, "role": role}

user = create_user(age=25, name="Alice", role="admin")
```

## *args and **kwargs

Accept any number of positional or keyword arguments:

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4))  # 10

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)
```

## Early returns

Return early for guard clauses — reduces nesting:

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

## Common pitfalls

- **Mutable default arguments**: `def f(items=[])` shares the same list across calls. Use `None` instead: `def f(items=None): items = items or []`
- **Forgetting to return**: a function without `return` yields `None`
- **Too many parameters** (4+): consider using a dictionary or dataclass

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a function `is_palindrome(text)` that returns `True` if the string reads the same forwards and backwards (ignore case).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>def is_palindrome(text): return text.lower() == text.lower()[::-1]</code></p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a function `fizzbuzz(n)` that returns a list from 1 to n, but replaces multiples of 3 with "Fizz", multiples of 5 with "Buzz", and multiples of both with "FizzBuzz".

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else i for i in range(1, n+1)]</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why does Python require default parameters after non-default ones? What would happen if the rule were reversed?
- What problem does `*args` solve that a list parameter doesn't? When would you prefer one over the other?
- How does Python decide which function to call when you have both `def f(x)` and `def f(x, y=5)`?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

<div class="quiz" data-quiz="python-101-functions">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does this return? <code>def f(x, y=3): return x + y; f(5)</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">8</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. What is the output? <code>def f(a, b=[]): b.append(a); return b; print(f(1)); print(f(2))</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1] then [2]</button>
      <button class="quiz-q__opt" data-idx="1">[1] then [1, 2]</button>
      <button class="quiz-q__opt" data-idx="2">[1, 2] then [1, 2]</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>
