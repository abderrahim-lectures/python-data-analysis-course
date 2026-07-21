---
title: "Week 2: Control Flow"
sidebar_position: 2
section: python-101
track: normal
week: 2
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 2: Control Flow

<span className="gamified-flourish">🔀 This week your programs stop running the same three lines every time and start making decisions.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Branch a program's behavior with `if` / `elif` / `else`.
- Repeat work with `while` and `for` loops, and choose the right one.
- Use `range()` to loop a fixed number of times, and `break`/`continue` to control a loop early.

## Lesson

### Branching: `if` / `elif` / `else`

An `if` statement is a piecewise definition. Compare:

$$
f(x) = \begin{cases} \text{"negative"} & x < 0 \\ \text{"zero"} & x = 0 \\ \text{"positive"} & x > 0 \end{cases}
$$

```python
x = -3
if x < 0:
    print("negative")
elif x == 0:
    print("zero")
else:
    print("positive")
```

Indentation is not style here — it **is** the syntax. Everything indented under `if` belongs to that branch; Python has no `{ }` to mark blocks.

### `while`: repeat until a condition fails

A `while` loop is the closest thing to a mathematical recurrence with a stopping condition:

```python
n = 5
while n > 0:
    print(n)
    n = n - 1
print("liftoff!")
```

This prints `5 4 3 2 1 liftoff!`. The loop re-checks `n > 0` before every iteration — if you forget to update `n` inside the loop, it never becomes false, and you get an infinite loop.

### `for`: repeat over a known sequence

A `for` loop walks through a sequence of values directly — think of it as $\sum_{i \in S}$ where $S$ is whatever you're iterating over, except you're running code for each $i$ instead of adding numbers:

```python
for letter in "cat":
    print(letter)   # c, a, t — one per line
```

`range(n)` produces the sequence $0, 1, \dots, n-1$ — exactly the index set you'd use for $\sum_{i=0}^{n-1}$:

```python
total = 0
for i in range(5):
    total = total + i
print(total)   # 0+1+2+3+4 = 10
```

`range(start, stop)` and `range(start, stop, step)` generalize this, mirroring an arithmetic sequence $a, a+d, a+2d, \dots$

### `break` and `continue`

`break` exits a loop immediately; `continue` skips to the next iteration without finishing the current one:

```python
for i in range(10):
    if i == 5:
        break        # stop entirely once i reaches 5
    if i % 2 == 0:
        continue     # skip printing even numbers
    print(i)          # prints 1, 3
```

## 🧩 Challenges

<Challenge id="python101-normal-w2-c1" answer={<>Use a <code>for</code> loop over <code>range(1, 11)</code>, and inside it an <code>if/elif/else</code> chain checking divisibility by 15, then 3, then 5, with a final <code>else</code> that prints the number itself.</>}>

Write "FizzBuzz" for the numbers 1 through 10: print `"Fizz"` if divisible by 3, `"Buzz"` if divisible by 5, `"FizzBuzz"` if divisible by both, otherwise the number itself.

</Challenge>

<Challenge id="python101-normal-w2-c2" answer={<>A <code>while</code> loop that keeps calling <code>input()</code> and checking <code>== "quit"</code> to decide whether to <code>break</code>, since you don't know in advance how many times the student will respond.</>}>

Write a loop that keeps asking `"Type 'quit' to stop: "` until the student types exactly `quit`. Would `for` or `while` fit this task better, and why?

</Challenge>

<Challenge id="python101-normal-w2-c3" answer={<>Initialize <code>total = 0</code>, loop <code>for i in range(1, 101)</code>, add <code>i</code> to <code>total</code> each time, then print it. The closed-form sum formula n(n+1)/2 with n=100 gives 5050, which lets you check the loop's answer without re-running it.</>}>

Sum the integers from 1 to 100 using a loop, and check your program's answer against the closed-form formula $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$.

</Challenge>

<Challenge id="python101-normal-w2-c4" answer={<>Loop over <code>range(2, n)</code> and check whether <code>n % i == 0</code> for any of them using a flag or <code>break</code>; if no divisor is found, <code>n</code> is prime. This is the same "for every i from 2 up to n-1, n mod i is not 0" definition of primality written as code.</>}>

Write a program that reads a number `n` and prints whether it's prime, by checking whether any integer from 2 up to (but not including) `n` divides it evenly.

</Challenge>

## 🤔 Socratic Questions

- What happens if you write `while True:` with no `break` inside? Try it carefully in the playground (you may need to stop execution manually) — why is this different from a `for` loop over a fixed `range`?
- In FizzBuzz, why does the divisible-by-both case (`FizzBuzz`) need to be checked *before* the separate `Fizz`/`Buzz` checks, or handled with `and`? What would go wrong with a naive `elif` ordering?
- `for i in range(5):` and `i = 0; while i < 5: ...; i += 1` do the same thing. Under what circumstances would you *have* to use `while` because `for` genuinely can't express it?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-normal-week-2"
  questions={[
    {
      id: 'q1',
      prompt: 'What does range(5) produce?',
      options: ['1,2,3,4,5', '0,1,2,3,4', '0,1,2,3,4,5', '5,4,3,2,1'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Which statement immediately exits the nearest enclosing loop?',
      options: ['continue', 'return', 'break', 'pass'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: "What determines which lines belong to an if block in Python?",
      options: ['Curly braces {}', 'Indentation', 'Semicolons', 'Parentheses'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'A while loop with a condition that never becomes False will:',
      options: [
        'Raise a SyntaxError immediately',
        'Run once and stop',
        'Loop forever (infinite loop)',
        'Be automatically converted to a for loop',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-2" />
