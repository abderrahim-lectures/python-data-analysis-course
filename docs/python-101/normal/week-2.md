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
- Combine conditions with `and`, `or`, and `not`.
- Repeat work with `while` and `for` loops, and choose the right one.
- Use `range()` to loop a fixed number of times, and `break`/`continue` to control a loop early.
- Nest loops and conditionals to solve problems with more than one moving part.

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

Indentation is not style here — it **is** the syntax. Everything indented under `if` belongs to that branch; Python has no `{ }` to mark blocks. A block needs at least one statement — if you want a branch that deliberately does nothing (e.g. while sketching out a program's shape before filling it in), use `pass`, a statement whose only job is to do nothing:

```python
if x < 0:
    pass   # TODO: handle negative numbers later
else:
    print("non-negative")
```

### Combining conditions: `and`, `or`, `not`

Just like $\land$, $\lor$, $\neg$ in logic, Python has `and`, `or`, `not` for combining boolean expressions:

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Welcome in")

if age < 13 or age > 65:
    print("Discount applies")

if not has_ticket:
    print("Buy a ticket first")
```

They follow the same truth tables you'd expect: `and` is true only when *both* sides are true; `or` is true when *at least one* side is true; `not` flips a boolean. Python also short-circuits: in `a and b`, if `a` is already `False`, Python never even evaluates `b`, since the whole expression must be `False` regardless. This matters when `b` might be expensive or unsafe to evaluate — e.g. `x != 0 and 10 / x > 1` never risks dividing by zero, because if `x != 0` is `False`, the division is skipped entirely.

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

`while` is the right tool when you don't know in advance how many iterations you'll need — the stopping condition depends on something that happens *during* the loop, like user input or a search that could finish early:

```python
guess = None
target = 42
while guess != target:
    guess = int(input("Guess the number: "))
print("Correct!")
```

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

`range(start, stop)` and `range(start, stop, step)` generalize this, mirroring an arithmetic sequence $a, a+d, a+2d, \dots$:

```python
for i in range(2, 10, 2):
    print(i)   # 2, 4, 6, 8 — start at 2, stop before 10, step by 2
```

A negative step counts down: `range(5, 0, -1)` produces `5, 4, 3, 2, 1`, the same sequence Week 1's `while` liftoff example built by hand.

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

### Nesting: loops and conditionals inside each other

A loop body — or an `if` branch — can contain another loop or `if`, exactly the way a piecewise function's cases can themselves involve further conditions. Each level of nesting adds one more level of indentation:

```python
for row in range(1, 4):
    for col in range(1, 4):
        print(row * col, end=" ")   # end=" " prints a space instead of a newline
    print()                          # move to the next line after each row
```

This prints a small 3×3 multiplication table:

```
1 2 3
2 4 6
3 6 9
```

The inner loop runs to completion for *every* iteration of the outer loop — for 3 outer iterations and 3 inner iterations each, that's $3 \times 3 = 9$ total print statements, the same counting principle behind a double sum $\sum_{r=1}^{3}\sum_{c=1}^{3}$.

## ⚠️ Common pitfalls

- **Off-by-one errors with `range`.** `range(1, 10)` stops *before* 10, giving `1..9`. If you want to include 10, you need `range(1, 11)`.
- **Forgetting to update the loop variable in a `while`.** `while n > 0: print(n)` with no `n -= 1` inside never terminates.
- **Using `=` instead of `==` in a condition.** Python actually catches this one for you (`if x = 5:` is a `SyntaxError`), unlike some other languages — but it's still worth knowing why it would be a bug if it were allowed.
- **Assuming `elif` chains check every branch.** Once one `elif`/`if` condition matches, the rest are skipped entirely — order matters, especially for overlapping conditions like FizzBuzz's "divisible by both 3 and 5" case.

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

<Challenge id="python101-normal-w2-c5" answer={<>Use nested for loops like the multiplication-table example: an outer loop over rows and an inner loop over columns, printing a fixed character (e.g. <code>"*"</code>) with <code>end=""</code> in the inner loop, and a plain <code>print()</code> after the inner loop to move to the next row.</>}>

Using nested loops, print a square of asterisks, `n` rows by `n` columns, for a number `n` you choose (e.g. a 4×4 block of `*` characters).

</Challenge>

<Challenge id="python101-normal-w2-c6" answer={<>if 18 &lt;= age &lt; 65 and has_ticket: ... — combining the chained comparison from Week 1 with and, exactly mirroring 18 ≤ age {"<"} 65.</>}>

Write a condition using `and` that checks whether a variable `age` is between 18 and 65 (inclusive of 18, exclusive of 65) *and* a boolean `has_ticket` is `True`.

</Challenge>

## 🤔 Socratic Questions

- What happens if you write `while True:` with no `break` inside? Try it carefully in the playground (you may need to stop execution manually) — why is this different from a `for` loop over a fixed `range`?
- In FizzBuzz, why does the divisible-by-both case (`FizzBuzz`) need to be checked *before* the separate `Fizz`/`Buzz` checks, or handled with `and`? What would go wrong with a naive `elif` ordering?
- `for i in range(5):` and `i = 0; while i < 5: ...; i += 1` do the same thing. Under what circumstances would you *have* to use `while` because `for` genuinely can't express it?
- Short-circuit evaluation means `a and b` skips evaluating `b` if `a` is already `False`. Can you think of a situation (beyond the division-by-zero example above) where this matters for more than just performance — where evaluating `b` when it shouldn't be evaluated would actually be *wrong*, not just wasteful?
- The multiplication-table example nests a `for` inside a `for`. What would nesting a `while` inside a `for` look like, and can you think of a real task (not just a made-up example) where that combination would be the natural choice?

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
    {
      id: 'q5',
      prompt: 'In "a and b", if a evaluates to False, what happens to b?',
      options: [
        'It is still evaluated, but ignored',
        'It is never evaluated (short-circuiting)',
        'It raises a SyntaxError',
        'It is evaluated first, before a',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-2" />
