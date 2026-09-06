---
title: "For & While Loops"
description: "Repeat actions over sequences and until conditions change."
module: "control-flow"
order: 9
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Iterate over lists, strings, and ranges with for loops"
  - "Use while loops for condition-based repetition"
  - "Control loop flow with break, continue, and pass"
  - "Avoid infinite loops"
prerequisites: ["08-if-elif-else"]
tags: ["for", "while", "loops", "break", "continue"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## For loops

A `for` loop iterates over each item in a sequence:

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
# apple
# banana
# cherry
```

Works with strings too — it iterates over characters:

```python
for letter in "Python":
    print(letter)
```

## While loops

A `while` loop runs as long as its condition is `True`:

```python
count = 0
while count < 5:
    print(count)
    count += 1
# 0 1 2 3 4
```

**Always make sure the condition eventually becomes `False`**, or you'll create an infinite loop.

## Break and continue

`break` exits the loop immediately. `continue` skips to the next iteration:

```python
# break — stop at the first even number
for n in [1, 3, 4, 7, 8]:
    if n % 2 == 0:
        print(f"Found even: {n}")
        break

# continue — skip odd numbers
for n in range(6):
    if n % 2 != 0:
        continue
    print(n)  # 0 2 4
```

## Pass

`pass` is a placeholder that does nothing. Use it when you need a syntactically valid block:

```python
for n in range(10):
    if n % 3 == 0:
        pass  # TODO: handle multiples of 3 later
    else:
        print(n)
```

## Common pitfalls

- **Infinite `while` loops**: forgetting to update the condition variable
- **Modifying a list during iteration**: use a copy or list comprehension instead
- **`for` with `range(len(...))`**: Pythonic code usually iterates directly over the sequence

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a `for` loop that prints the first 10 numbers divisible by 3 (3, 6, 9, ..., 30).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>for i in range(3, 31, 3): print(i)</code> — <code>range(3, 31, 3)</code> starts at 3, goes up to 30, stepping by 3.</p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a `while` loop that repeatedly asks for input (simulate with a list) and stops when it sees `"quit"`. Print each input.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>inputs = ["hello", "world", "quit"]; i = 0; while i < len(inputs) and inputs[i] != "quit": print(inputs[i]); i += 1</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- When would you choose `while` over `for`? Give a real-world example of each.
- What happens if you modify a list inside a `for` loop that's iterating over it? How could you avoid the issue?
- Why does Python not have a `do...while` loop like C or JavaScript? How do you simulate one?

</section>

<section class="lesson-section lesson-section--projects">
<h2 id="-projects-you-can-build">Projects You Can Build</h2>

<p>Here are a few real-world projects that reinforce these concepts:</p>

<ul>
  <li>🎮 <strong>Wordle Clone</strong> - Use loops to iterate through attempts and check each letter position</li>
  <li>💬 <strong>Trivia Bot</strong> - Loop through questions, collect answers, and track score across rounds</li>
  <li>🎓 <strong>Quiz Engine</strong> - Implement game loops with for/while to manage question flow and user attempts</li>
</ul>

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

<div class="quiz" data-quiz="python-101-loops">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does <code>for i in range(0, 10, 3): print(i, end=" ")</code> print?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0 1 2 3 4 5 6 7 8 9</button>
      <button class="quiz-q__opt" data-idx="1">0 3 6 9</button>
      <button class="quiz-q__opt" data-idx="2">3 6 9</button>
      <button class="quiz-q__opt" data-idx="3">0 3 6</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Which keyword skips the rest of the current loop iteration?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">break</button>
      <button class="quiz-q__opt" data-idx="1">pass</button>
      <button class="quiz-q__opt" data-idx="2">continue</button>
      <button class="quiz-q__opt" data-idx="3">skip</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>
