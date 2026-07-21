---
title: "Week 4: Functions"
sidebar_position: 4
section: python-101
track: normal
week: 4
description: "Write and reason about Python functions: parameters, return values, and scope, with real coding challenges."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Week 4: Functions

<span className="gamified-flourish">🧮 You already know $f(x)$. This week you learn to write your own $f$.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Define a function with `def`, parameters, and a `return` value.
- Explain the difference between a parameter's **default value** and an argument passed at call time.
- Reason about variable **scope**: what a function can and can't see from outside itself.
- Return more than one value from a function, and document what a function does with a docstring.
- Recognize recursion, and know when it mirrors a mathematical definition naturally.

## Lesson

### Functions as $f(x)$

You already read $f(x) = x^2 + 1$ as "a rule that takes a number and returns another number." A Python function is exactly that:

```python
def f(x):
    return x**2 + 1

f(3)   # 10
f(0)   # 1
```

`def` names the function and its parameters; the body computes a result; `return` sends that result back to the caller. A function with no `return` statement implicitly returns `None`.

It's good practice to document what a function does with a **docstring** — a string literal right after the `def` line, which tools (and other programmers, including future you) can read without opening the function's body:

```python
def f(x):
    """Return x squared, plus one."""
    return x**2 + 1
```

### Multiple parameters, default values

Functions can take several inputs, some with defaults — the equivalent of $f(x, y) = x + y$ but where $y$ has an assumed value if the caller doesn't supply one:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Amina")               # "Hello, Amina!"
greet("Youssef", "Hi")        # "Hi, Youssef!"
greet(name="Sara", greeting="Hey")   # keyword arguments — order doesn't matter
```

Parameters with a default must come *after* parameters without one — `def greet(greeting="Hello", name):` is a `SyntaxError`, since Python needs to know which arguments are required before it can figure out which are optional.

### Returning more than one value

A function can only `return` one thing, but that "one thing" can be a `tuple` — and Python's tuple-unpacking syntax (from Week 3) makes this read almost like returning several values directly:

```python
def min_and_max(numbers):
    return min(numbers), max(numbers)   # this builds a tuple: (min, max)

lowest, highest = min_and_max([4, 8, 1, 9, 3])
print(lowest, highest)   # 1 9
```

This is the same pattern you'll use throughout the rest of the course whenever a computation naturally produces more than one related result.

### Scope: what a function can see

A variable created *inside* a function only exists inside it — this is **local scope**:

```python
def compute():
    total = 42
    return total

compute()
print(total)   # NameError: total only existed inside compute()
```

A function *can* read variables defined outside it (**global scope**), but reassigning a global from inside a function without special syntax creates a new local variable instead — a common source of confusion:

```python
counter = 0

def increment():
    counter = counter + 1   # UnboundLocalError! Python sees the assignment
                             # and treats counter as local *throughout* the function,
                             # including on the read before the assignment.
```

The fix (`global counter`) exists but is rarely the right design — prefer passing values in and returning results out, which is also easier to test and reason about.

### Functions calling functions

Because a function is just a value like any other, functions can call other functions, building up complexity from small pieces — the same way $h(x) = g(f(x))$ composes two functions:

```python
def double(x):
    return x * 2

def add_one(x):
    return x + 1

def double_then_add_one(x):
    return add_one(double(x))

double_then_add_one(3)   # double(3)=6, add_one(6)=7
```

### Recursion: a function calling itself

Some functions are most naturally defined in terms of themselves — exactly like a recurrence relation. Factorial, $n! = n \cdot (n-1)!$ with the base case $0! = 1$, translates almost word-for-word:

```python
def factorial(n):
    if n == 0:
        return 1              # base case — stops the recursion
    return n * factorial(n - 1)   # recursive case

factorial(5)   # 5 * factorial(4) = 5 * 4 * factorial(3) = ... = 120
```

Every recursive function needs a **base case** that doesn't call itself (otherwise it recurses forever, eventually crashing with a `RecursionError`) and a recursive case that gets *closer* to that base case with each call — here, `n - 1` shrinks toward `0` every time. Anything recursion can do, a loop can also do (and often more efficiently, since each recursive call has some overhead) — but for definitions that are already naturally recursive, like factorial or Week 5's CSV-processing pipeline, the recursive version can be the clearer one to read.

## ⚠️ Common pitfalls

- **Forgetting `return`.** A function that computes a value but never `return`s it gives back `None` — `result = add(2, 3)` silently becomes `None` if `add` forgot its `return` statement, and the bug often doesn't surface until much later when you try to use `result`.
- **Using a mutable default argument.** `def add_item(item, items=[]):` looks reasonable, but that default list is created *once*, when the function is defined, and reused across *every* call that doesn't supply its own `items` — items from one call can leak into the next. The fix: default to `None` and create a fresh list inside the function if needed.
- **No base case in a recursive function.** Forgetting the `if n == 0: return 1` in `factorial` means every call recurses again, without end, until Python gives up with a `RecursionError: maximum recursion depth exceeded`.
- **Shadowing a built-in name.** Naming your own function `sum` or `list` works, but then hides Python's real `sum()`/`list()` for the rest of that file — a confusing bug to track down later.

## 🧩 Challenges

<Challenge id="python101-normal-w4-c1" answer={<><code>def is_even(n): return n % 2 == 0</code> — the function body is just the same divisibility check you already know, wrapped so it can be reused.</>}>

Write a function `is_even(n)` that returns `True` if `n` is even, `False` otherwise.

</Challenge>

<Challenge id="python101-normal-w4-c2" answer={<><code>def average(numbers): return sum(numbers) / len(numbers)</code>. Calling with an empty list raises <code>ZeroDivisionError</code> — worth noting even though handling it gracefully is next week's bonus material.</>}>

Write a function `average(numbers)` that takes a list of numbers and returns their mean. What happens if you call it with an empty list?

</Challenge>

<Challenge id="python101-normal-w4-c3" answer={<>Define <code>def is_prime(n): ...</code> reusing last week's primality loop inside the function body, then call it in a comprehension: <code>[n for n in range(2, 50) if is_prime(n)]</code>.</>}>

Turn last week's "is this number prime?" logic into a function `is_prime(n)`, then use it inside a list comprehension to build a list of all primes below 50.

</Challenge>

<Challenge id="python101-normal-w4-c4" answer={<>def f(x, y=1): return x + y — calling f(5) uses the default (6), f(5, 10) overrides it (15).</>}>

Write a function `f(x, y=1)` that returns `x + y`. Call it once with only `x` and once with both arguments, and explain why the two results differ.

</Challenge>

<Challenge id="python101-normal-w4-c5" answer={<>def fibonacci(n): if n &lt;= 1: return n; return fibonacci(n - 1) + fibonacci(n - 2) — mirrors the mathematical definition F(n) = F(n-1) + F(n-2) directly, with F(0)=0 and F(1)=1 as the two base cases.</>}>

Write a recursive function `fibonacci(n)` that returns the `n`th Fibonacci number, using the definition $F(0) = 0$, $F(1) = 1$, $F(n) = F(n-1) + F(n-2)$.

</Challenge>

<Challenge id="python101-normal-w4-c6" answer={<>def stats(numbers): return min(numbers), max(numbers), sum(numbers) / len(numbers) — returns a 3-tuple, unpacked at the call site as lo, hi, avg = stats(numbers).</>}>

Write a function `stats(numbers)` that returns three values at once — the minimum, maximum, and average — and call it using tuple unpacking to capture all three in separate variables.

</Challenge>

## 🤔 Socratic Questions

- Two functions both use a variable named `total` internally. Do they interfere with each other? Why or why not, given what you learned about scope?
- Why does `return` immediately exit a function, even if there's more code after it? Try writing a function with unreachable code after a `return` and see what the playground does with it.
- `double_then_add_one` composes `double` and `add_one`. Could you write a general `compose(f, g)` function that returns *a new function* combining any two functions? (You don't need `class`es for this — a function can return another function.)
- Your recursive `factorial` and an iterative version using a `for` loop compute the same result. Try timing both on a large input (e.g. `factorial(900)`) — do you notice any difference? What do you think is happening at each recursive call that a loop iteration doesn't need to do?
- The mutable-default-argument pitfall happens because a default value is created *once*, at function-definition time, not fresh on every call. Why might Python have been designed this way, rather than re-creating the default value every single call (which would avoid the gotcha but cost a little more work every time)?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-normal-week-4"
  questions={[
    {
      id: 'q1',
      prompt: 'What does a function return if it has no explicit return statement?',
      options: ['0', 'An empty string', 'None', 'A SyntaxError'],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: 'In def greet(name, greeting="Hello"), what is "Hello"?',
      options: [
        'A required argument',
        'A default value used when greeting is not supplied',
        'A global variable',
        'A return value',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'A variable created inside a function is, by default:',
      options: ['Global', 'Local to that function', 'Shared across all functions', 'A constant'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'What does greet(name="Sara") use to pass the argument?',
      options: ['Positional argument', 'Default parameter', 'Keyword argument', 'Global scope'],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'Every recursive function must have a:',
      options: ['for loop inside it', 'Base case that stops the recursion', 'Default parameter', 'Docstring'],
      correctOptionIndex: 1,
    },
  ]}
/>

## 🎁 Bonus: handling errors with try/except

<BonusContent weekId="python-101-normal-week-4">

Right now, calling `average([])` crashes your whole program with a `ZeroDivisionError`. Python lets you *catch* errors instead of crashing:

```python
def average(numbers):
    try:
        return sum(numbers) / len(numbers)
    except ZeroDivisionError:
        return 0

average([])   # 0, instead of a crash
```

`try` wraps code that might fail; `except <ErrorType>` catches that specific failure and runs alternative code instead. This isn't part of the core curriculum (it's easy to overuse and hide real bugs), but it's a natural next step once functions can fail in predictable ways. Try wrapping your `average` and `is_prime` functions from this week's challenges with a `try`/`except` that handles a bad input gracefully, like a non-numeric value in the list.

</BonusContent>

<ProgressCheckbox weekId="python-101-normal-week-4" />
