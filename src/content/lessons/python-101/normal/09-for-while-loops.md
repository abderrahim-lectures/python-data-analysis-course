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

## The two machines that repeat

Write a program to sum the first hundred integers and your hands will cramp. Mathematicians abstracted the repetition into a symbol long before computers existed:

$$
\sum_{i=1}^{100} i = 1 + 2 + \cdots + 100
$$

The $\sum$ sign is an instruction to repeat. A loop is the computer's $\sum$, and Python splits the idea into two machines for two different kinds of repetition. `for` repeats over a *known sequence*. `while` repeats *until a condition stops being true*.

## For: repetition over a sequence

A `for` loop visits each item of a sequence, one per round:

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
# apple
# banana
# cherry
```

Read it the way it runs: *"for each fruit **in** the list, do this."* The loop variable, `fruit`, takes a new value every round until the list is exhausted.

Strings are sequences too, the items are characters:

```python
for letter in "Python":
    print(letter)
```

Since a character is a single item, the math and the machine agree: iterating over a string of length $n$ runs exactly $n$ rounds.

## The numerical sequence: range

Most sums are over numbers, so Python supplies `range`, a sequence you can step across:

```python
for n in range(5):
    print(n)   # 0 1 2 3 4
```

`range(5)` produces the arithmetic progression $0, 1, 2, 3, 4$ like the index set of $\sum_{i=0}^{4} a_i$. Two more arguments give it the shape you need: `range(start, stop, step)` walks from `start`, in steps of `step`, stopping before `stop`:

```python
for n in range(10, 0, -2):
    print(n)   # 10 8 6 4 2
```

The stopping rule is worth stating exactly: $n$ travels while $n < \text{stop}$ (or $n > \text{stop}$ with a negative step), like a half-open interval $[\text{start}, \text{stop})$.

## While: repetition until a condition

Some tasks cannot enumerate their rounds in advance, you keep going until some condition flips. Newton's approximation is the prototype: refine until the change shrinks below a tolerance. That is a `while` loop:

```python
count = 0
while count < 5:
    print(count)
    count += 1
# 0 1 2 3 4
```

The condition sits at the top and is re-checked every round. **Make sure it eventually turns `False`**, if nothing inside the body changes the variables the condition reads, the loop never ends. A sum that must terminate is written with `for`; a search that ends only when it finds its answer is written with `while`.

## Break and continue

Two keywords fine-tune the flow from inside.

`break` abandons the loop immediately, no matter how many rounds remain:

```python
for n in [1, 3, 4, 7, 8]:
    if n % 2 == 0:
        print(f"Found even: {n}")
        break
```

`continue` abandons only *this* round, jumping to the next one:

```python
for n in range(6):
    if n % 2 != 0:
        continue
    print(n)  # 0 2 4
```

Between them, the concepts map onto the number line: `break` cuts off the tail $\{n \in \mathbb{Z} : n \geq m\}$; `continue` excises a subset of rounds like filtering a progress with a sieve.

## Pass: an empty placeholder

Every `if`, `for`, `while`, and function body needs at least one statement, but sometimes you have not written it yet. `pass` is the no-op that occupies the space:

```python
for n in range(10):
    if n % 3 == 0:
        pass  # TODO: handle multiples of 3 later
    else:
        print(n)
```

It does nothing, which is precisely its job: keeping the block syntactically valid while the real statement is being drafted.

## A worked example: the Σ machine at work

The tooling of this lesson composes into the summation symbol from the opening:

```python
total = 0
for n in range(1, 11):
    if n % 2 != 0:
        continue          # evens only
    total += n
print(total)              # 2 + 4 + 6 + 8 + 10 = 30
```

The loop is $\sum$ mechanized: each round adds one term, `continue` sieves out the odd rounds, and `total` accumulates exactly like the running tally of lesson 02.

## Common pitfalls

- **Infinite `while` loops.** Forget to update the variable the condition reads, and the loop spins forever. Verify the body moves the state toward `False`.
- **Modifying a list while iterating over it.** Slicing or deleting items mid-loop shifts the indices under you. Iterate over a copy, or build a fresh list.
- **`for i in range(len(items))`.** Unless you need the index itself, iterate over the sequence directly, `for fruit in fruits` says what you mean.
- **`continue` skips the round; `break` abandons the loop.** `continue` skips only the current iteration; `break` ends the whole loop. Confusing the two is how a loop that was meant to stop keeps spinning.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Write a `for` loop that prints the first ten multiples of 3: $3, 6, 9, \ldots, 30$.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>for i in range(3, 31, 3): print(i)</code>, <code>range(3, 31, 3)</code> starts at 3, advances by 3, and stops before 31, so it lands exactly on $3, 6, \ldots, 30$.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Write a `while` loop that walks a queue (simulate with a list) and stops at the queued item `"quit"`, printing each item it passes over.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>inputs = ["hello", "world", "quit"]; i = 0; while inputs[i] != "quit": print(inputs[i]); i += 1</code>, the condition guards the sentinel, and the index moves the state toward it.</p>

</div>
</details>

## 🤔 Socratic Questions

- When do you reach for `while` instead of `for`? Give a real task for each, one you can count in advance, one you cannot.
- What happens to a list you modify while a `for` loop is walking it? How do you sidestep it?
- Python has no `do…while` like C. How do you write a body that must run at least once before any condition is checked?

## ✅ Quick check

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