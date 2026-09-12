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

## From formula to named machine

Mathematics abhors repetition. You learned $f(x) = x^2 - 5x + 6$ as a *rule*, one definition, used a thousand times, on a thousand different inputs:

$$
f(x) = x^2 - 5x + 6, \qquad f(2) = 0.
$$

Python's `def` is the same move: bind a name to a computation, so that any caller can apply it. The function is a machine with labeled input slots and one output door:

```python
def add(a, b):
    return a + b

result = add(3, 5)  # 8
```

The name, the parentheses holding the parameters $a, b$, the colon starting the recipe, this is the definition. The call `add(3, 5)` is applying the rule at $a=3$, $b=5$, exactly as $f(2)$ applies a rule at $x=2$.

## Defining and calling

The first function you write changes the world a greeting at a time:

```python
def greet(name):
    """Print a greeting for the given name."""
    print(f"Hello, {name}!")

greet("Alice")  # Hello, Alice!
```

Three parts deserve names. The **parameters** are the variables in the definition, the input slots $x$. The **arguments** are the concrete values supplied at the call site, the input $2$. And the triple-quoted line inside is the **docstring**: documentation living next to the code, so `help(greet)` can answer what the function does.

## Return: the output door

`print` sends text to the screen; `return` hands a value back to the caller. The distinction is subtle and decisive:

```python
def add(a, b):
    return a + b

result = add(3, 5)          # result == 8
printed = print("8")        # printed is None — print returns nothing
```

A function without `return` quietly returns `None`, the machine produces no output. When you want the arithmetic result of your function to flow onward, remember: `return`, not `print`.

## Default parameters

Some parameters have a natural setting most calls will keep. Give them a default, and callers may override:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # Hello, Alice!
print(greet("Bob", "Hey"))         # Hey, Bob!
```

The rule for ordering is rigid: **default parameters come after non-default ones.** `def f(x, y=5)` is legal; `def f(x=1, y)` is a syntax error, because Python resolves arguments by position from the left, and a gap would be ambiguous.

## Keyword arguments

Arguments can also arrive named, which buys clarity when the parameter set grows:

```python
def create_user(name, age, role="student"):
    return {"name": name, "age": age, "role": role}

user = create_user(age=25, name="Alice", role="admin")
```

Named arguments may be given in any order, the parameter name is the label on each package. A call that names its inputs reads like a sentence instead of a code in need of decoding.

## *args and **kwargs

What if the number of inputs is unknown in advance? A sum doesn't know how many addends it will receive. `*args` collects any number of positional arguments into one tuple; `**kwargs` collects named arguments into one dict:

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4))  # 10

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)
```

The star is the gesture: `*` unfolds the argument list into a bundle. This is the difference between a sum with a fixed signature and a sum that accepts $\sum_{i=1}^{n} a_i$ for any $n$.

## Early return as a guard

Some code starts by checking for the one case that must not proceed. Reasons of the form *"unless you are $b=0$"* are stated as a guard at the top, returning immediately:

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

A guard clause collapses an `if/else` pair into a straight line: the failure case exits early, and the honest path runs un-nested.

## A worked example: the machine f

The quadratic that opened the lesson becomes three `return` statements:

```python
def quad(x):
    """Return x² − 5x + 6."""
    return x * x - 5 * x + 6

quad(2)    # 0
quad(3)    # 0
quad(1)    # 2
```

The same rule, three inputs. The formula $f(x) = x^2 - 5x + 6$ turns into a reusable machine: define once, apply a thousand times, and the docstring records which rule it encloses.

## Common pitfalls

- **Mutable default arguments.** `def f(items=[])` creates *one* list shared across every call, items pile up between calls. Default to `None` and build the list inside.
- **Forgetting `return`.** A function without it returns `None`; you asked for a value and got a shadow.
- **Too many parameters.** Past three or four, the slots turn into a puzzle. Group related arguments in a dict or dataclass.
- **Calling a function defined later.** Python executes top to bottom; calling `f()` before `def f` reaches the interpreter raises a `NameError`. Define before you call.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Write `is_palindrome(text)` returning `True` when the string reads the same forwards and backwards; ignore letter case.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>def is_palindrome(text): return text.lower() == text.lower()[::-1]</code>, lowercasing symmetrizes the comparison, and the reversed slice <code>[::-1]</code> is the mirror image.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Write `fizzbuzz(n)` returning a list from 1 to $n$, replacing multiples of 3 with `"Fizz"`, multiples of 5 with `"Buzz"`, and multiples of both with `"FizzBuzz"`.

<p class="challenge__answer">💡 <strong>Answer:</strong> Multiples of both are multiples of $\mathrm{lcm}(3,5) = 15$, so test that case first: <code>["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else i for i in range(1, n+1)]</code>.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why must default parameters trail non-default ones? What would go wrong if the rule were reversed?
- What does `*args` give you that a single list parameter does not? When would you reach for one over the other?
- How does Python decide which definition applies when both `def f(x)` and `def f(x, y=5)` exist?

## ✅ Quick check

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

  <div class="quiz-q" data-answer="1">
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