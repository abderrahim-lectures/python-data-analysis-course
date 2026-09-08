---
title: "Printing & Output"
description: "Display results with print(), format text with f-strings, and control what appears on screen."
module: "python-basics"
order: 1
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Use print() to display values and messages"
  - "Format output with f-strings and format specifiers"
  - "Combine multiple values in a single print() call"
prerequisites: []
tags: ["output", "print", "f-strings", "formatting"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Printing values

`print()` sends output to the screen. Pass it any value and Python converts it to text:

```python
print(42)         # 42
print(3.14)       # 3.14
print("hello")    # hello
```

Multiple arguments are joined with a space:

```python
print("Score:", 87)    # Score: 87
```

## F-strings: formatted output

Prefix a string with `f` and put expressions inside `{ }`:

```python
name = "Amina"
score = 87.5
print(f"{name} scored {score}%")    # Amina scored 87.5%
```

Format specifiers control precision and alignment:

```python
price = 19.999
print(f"Total: ${price:.2f}")       # Total: $20.00 — rounds to 2 decimal places
print(f"Double: {price * 2}")       # any expression works inside { }
```

Even conditionals work inline:

```python
passing = "yes" if score >= 60 else "no"
print(f"Passing? {passing}")
```

## Common pitfalls

- **Forgetting `print()` has no return value.** `print("hi")` displays text but evaluates to `None` — you can't capture its result.
- **Mixing types in concatenation.** `print("Score: " + 87)` raises a `TypeError`. Use f-strings instead: `print(f"Score: {87}")`.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Print your name, age, and a favorite number, each on its own line, using three separate `print()` calls. Then do it again with a single f-string that includes newlines (`\n`).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>print(f"Name: {name}\nAge: {age}\nFavorite: {num}")</code> — the <code>\n</code> inside the f-string produces a newline.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given `temperature = 23.7891`, print it as `"Today: 23.8°C"` (one decimal place).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>print(f"Today: {temperature:.1f}°C")</code> — the <code>:.1f</code> format specifier rounds to one decimal place.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does Python use `print()` as a function (with parentheses) rather than a statement? What advantage does that give you?
- `print("A", "B", "C")` prints `A B C` with spaces. How could you print them with no spaces? With commas between them?
- If `x = 3.14`, what does `f"{x}"` produce? What about `f"{x:.0f}"`? Explain the difference.

## ✅ Quick check

<div class="quiz" data-quiz="python-101-printing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does print(f"{'yes' if 5 > 3 else 'no'}") display?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5 > 3</button>
      <button class="quiz-q__opt" data-idx="1">yes</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. How do you print 3.14159 as 3.14 (two decimal places)?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f"{x:2f}"</button>
      <button class="quiz-q__opt" data-idx="1">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="2">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="3">f"{x:2.0f}"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
