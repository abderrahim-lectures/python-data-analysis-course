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

## If statements

An `if` block runs its body only when the condition is `True`:

```python
score = 85
if score >= 60:
    print("Passing!")
```

## Adding else

`else` catches everything the `if` didn't match:

```python
score = 45
if score >= 60:
    print("Passing!")
else:
    print("Needs more work")
```

## Elif for multiple branches

`elif` (short for "else if") checks conditions in order, stopping at the first match:

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

Only one branch runs — the first condition that's `True`.

## Truthiness and falsy values

Python treats some values as `True` and others as `False` in boolean context:

```python
# These are all "falsy":
bool(0)       # False
bool(0.0)     # False
bool("")      # False
bool([])      # False
bool(None)    # False

# Everything else is "truthy":
bool(1)       # True
bool("hello") # True
bool([1, 2])  # True
```

This means you can write clean conditions without explicit comparisons:

```python
name = ""
if not name:
    print("Name is empty")

items = [1, 2, 3]
if items:
    print("We have items")
```

## Nesting

You can put `if` blocks inside other `if` blocks, but keep nesting shallow for readability:

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

## Common pitfalls

- **Forgetting the colon** after `if`, `elif`, or `else`
- **Using `=` instead of `==`** in conditions (`=` assigns, `==` compares)
- **Over-nesting** when `elif` or early `return` would be cleaner

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a function `classify_temp(temp)` that returns:
- `"freezing"` if temp < 0
- `"cold"` if 0 <= temp < 15
- `"warm"` if 15 <= temp < 30
- `"hot"` if temp >= 30

<p class="challenge__answer">💡 <strong>Answer:</strong> Use <code>elif</code> chain: <code>if temp &lt; 0: return "freezing" elif temp &lt; 15: return "cold" elif temp &lt; 30: return "warm" else: return "hot"</code></p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given `text = "Hello, World!"`, write a check that prints `"uppercase"` if the text is all uppercase, `"lowercase"` if all lowercase, or `"mixed"` otherwise.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>if text.isupper(): print("uppercase") elif text.islower(): print("lowercase") else: print("mixed")</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why does Python use `elif` instead of `else if`? What would happen if you wrote `else if`?
- If `score = 85`, how many conditions does `if score >= 90: ... elif score >= 80: ... elif score >= 70: ...` evaluate before entering a branch?
- What's the difference between `if x:` and `if x is not None:`? When does each matter?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

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
</section>
