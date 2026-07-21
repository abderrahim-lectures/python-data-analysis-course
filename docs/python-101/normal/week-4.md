---
title: "Week 4: Functions"
sidebar_position: 4
section: python-101
track: normal
week: 4
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

### Multiple parameters, default values

Functions can take several inputs, some with defaults — the equivalent of $f(x, y) = x + y$ but where $y$ has an assumed value if the caller doesn't supply one:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Amina")               # "Hello, Amina!"
greet("Youssef", "Hi")        # "Hi, Youssef!"
greet(name="Sara", greeting="Hey")   # keyword arguments — order doesn't matter
```

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

## 🤔 Socratic Questions

- Two functions both use a variable named `total` internally. Do they interfere with each other? Why or why not, given what you learned about scope?
- Why does `return` immediately exit a function, even if there's more code after it? Try writing a function with unreachable code after a `return` and see what the playground does with it.
- `double_then_add_one` composes `double` and `add_one`. Could you write a general `compose(f, g)` function that returns *a new function* combining any two functions? (You don't need `class`es for this — a function can return another function.)

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
