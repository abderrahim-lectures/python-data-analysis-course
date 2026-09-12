---
title: "If / Elif / Else"
description: "Branch your code based on conditions — the foundation of decision-making in Python."
module: "control-flow"
order: 8
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Write if/elif/else blocks to branch logic"
  - "Use comparison and boolean operators in conditions"
  - "Understand truthiness and falsy values in Python"
  - "Write nested conditions when needed"
prerequisites: ["07-boolean-operators"]
tags: ["if", "elif", "else", "conditionals", "truthiness"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## From condition to decision

Arithmetic evaluates; comparisons decide; but a program that only evaluates runs one straight line from top to bottom. Life is not a straight line. A letter grade is a *piecewise function*: its formula changes at thresholds. Mathematically you write

$$
\mathrm{grade}(s) =
\begin{cases}
A & s \geq 90,\\
B & s \geq 80,\\
C & s \geq 70,\\
F & \text{otherwise}.
\end{cases}
$$

Python's `if`/`elif`/`else` is the transcription of a piecewise formula. Each piece guards its range, and exactly one piece fires.

## The single fork

The simplest branch runs its body only when the condition is `True`:

```python
score = 85
if score >= 60:
    print("Passing!")
```

The statement begins with `if`, then the condition, then a colon — the colon is what tells Python a block is coming. Everything indented under it belongs to that branch and runs only if the condition held.

## The two-way fork

`else` catches everything the `if` did not:

```python
score = 45
if score >= 60:
    print("Passing!")
else:
    print("Needs more work")
```

A two-way branch is a partition of the outcomes: the condition divides the value space into two halves, and every case lands in exactly one.

## The many-way fork: elif

Real piecewise formulas have more than two pieces. `elif` — a contraction of "else if" — appends further conditions, checked in order, stopping at the first that is `True`:

```python
score = 78
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(grade)  # B
```

Notice the economy: each `elif` condition needs only a lower bound, because the cases above have already been decided. With $s = 85$, the first piece fails and the second matches — later branches never run. Only **one** branch can fire, which is what makes this a true function.

## Truthiness: values as conditions

The condition after `if` need not be a comparison at all. Python asks, *"is this value truthy or falsy?"* — and the answer is uniform:

```python
# These are all falsy — they behave like False in a condition:
bool(0)       # False
bool(0.0)     # False
bool("")      # False
bool([])      # False
bool(None)    # False

# Everything else is truthy — it behaves like True:
bool(1)       # True
bool("hello") # True
bool([1, 2])  # True
```

The collection of falsy values is deliberately small: zero, empty text, empty containers, and `None`. Everything else counts. That buys terse conditions that read like a natural-language check:

```python
name = ""
if not name:
    print("Name is empty")

items = [1, 2, 3]
if items:
    print("We have items")
```

An empty string is falsy, so `not name` is `True`; a non-empty list is truthy, so `if items` fires. You skip the explicit `== ""` and `!= []` — the check is the emptiness itself.

## Nesting: when one question depends on another

Some decisions are sequential: *first*, are you of age; *then*, do you carry identification? Those nest:

```python
age = 25
has_id = True

if age >= 21:
    if has_id:
        print("Entry allowed")
    else:
        print("Need ID")
else:
    print("Too young")
```

Nesting works, but each level doubles the paths a reader must hold in their head. Flat `elif` chains read like the piecewise formula itself; reach for those first, and reserve nesting for genuinely dependent questions.

## A worked example: the thermostat

A thermostat is a piecewise function with three pieces. The chain transcribes it directly:

```python
temperature = 22

if temperature <= 10:
    state = "heating"
elif temperature >= 30:
    state = "cooling"
else:
    state = "steady"
print(state)  # steady
```

It reads like the formula it is. The order of the pieces matters: each `elif` assumes the ones above failed, so exactly one branch fires and exactly one state prints.

## Common pitfalls

- **Forgetting the colon** after `if`, `elif`, or `else` — without it, the block never begins.
- **`=` instead of `==`.** `if score = 60` is a syntax error, on purpose.
- **Over-nesting** when an `elif` chain (or an early `return`) would state the shape of the formula in one pass.
- **The first `True` wins, not the most specific match.** In `if x > 5: ... elif x > 3: ...`, an `x = 4` enters the second branch only if the first already failed — and a value below 3 falls to `else`. Ordering the pieces from narrow to wide is what keeps the formula correct.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write `classify_temp(temp)` returning `"freezing"` under $0$, `"cold"` in $[0,15)$, `"warm"` in $[15,30)$, and `"hot"` from $30$ up.

<p class="challenge__answer">💡 <strong>Answer:</strong> An <code>elif</code> chain, using the fact that each later check assumes the earlier ones failed: <code>if temp &lt; 0: return "freezing" elif temp &lt; 15: return "cold" elif temp &lt; 30: return "warm" else: return "hot"</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given `text = "Hello, World!"`, print `"uppercase"` if the text is all caps, `"lowercase"` if all lower, `"mixed"` otherwise.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>if text.isupper(): print("uppercase") elif text.islower(): print("lowercase") else: print("mixed")</code> — the whole condition set forms a partition.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why `elif` and not `else if`? What would Python make of the two words appearing side by side?
- With `s = 85`, how many conditions does the grade chain evaluate before entering a branch? (Hint: which piece fails, and which fires?)
- What is the difference between `if x:` and `if x is not None:`? When does each one matter?

## ✅ Quick check

<div class="quiz" data-quiz="python-101-control-flow">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. What does this print? <code>x = 0; if x: print("yes") else: print("no")</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">yes</button>
      <button class="quiz-q__opt" data-idx="1">Error</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Which condition is checked first? <code>if x > 5: ... elif x > 10: ... elif x > 3: ...</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x > 10</button>
      <button class="quiz-q__opt" data-idx="1">x > 5</button>
      <button class="quiz-q__opt" data-idx="2">x > 3</button>
      <button class="quiz-q__opt" data-idx="3">They run in parallel</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>