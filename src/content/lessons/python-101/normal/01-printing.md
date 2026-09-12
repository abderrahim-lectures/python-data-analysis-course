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

## An answer locked inside the machine

Try this: evaluate

$$
\frac{17 \cdot 3 + 4^2}{5}.
$$

By hand you would write the steps and the answer on paper:

$$
17 \cdot 3 + 4^2 = 51 + 16 = 67, \qquad \frac{67}{5} = 13.4.
$$

Getting the answer is only half of solving a problem, the other half is **communicating it**. Now hand that same expression to a computer. It computes $13.4$ in a blink, and immediately forgets to tell you. The value sits silently inside the machine, and unless you demand it come out, you will never see it.

That invisible computation is the fundamental problem this lesson solves. A program needs a way to *write its results where a human can read them*, in Python, that instruction is `print()`.

## `print()`, reveal a value

`print()` takes a value and sends it to the screen. Any value works: Python converts it to text first.

```python
print(13.4)        # 13.4
print(42)          # 42
print("hello")     # hello
```

You don't have to print a finished number, `print()` accepts any expression and evaluates it first:

```python
print((17 * 3 + 4**2) / 5)    # 13.4
```

The pattern to keep in mind: **compute something, then hand it to `print()`.** Values have no way out of a program on their own; printing is the exit.

## A number, and its label

A bare number rarely means much. On paper you wouldn't write $13.4$ alone, you would write "Score: 13.4". Give `print()` multiple arguments and it places a space between them:

```python
print("Score:", 87)    # Score: 87
```

The first argument is the label, the second is the value. You can stack as many as you like, and `print()` keeps them apart for you.

## Showing exactly the digits you mean

Here is where the trouble starts. The value

$$
\pi = 3.14159\ldots
$$

carries all of its digits with it at all times. But a table needs $\pi \approx 3.14$, a weather line needs `23.8°C`, not `23.7891°C`. The number of digits shown is a *choice of how to present* the number, it must not change the stored value, or you lose precision forever.

So the rounding must live in the printing, not in the computation. An **f-string** lets you decide at print time: write `f"..."`, put the expression inside `{...}`, and append a format specifier after a colon:

```python
price = 19.999
print(f"Total: ${price:.2f}")        # Total: $20.00   (shown rounded)
print(price)                          # 19.999          (value untouched)
print(f"Double: {price * 2}")         # 39.998          (any expression works)
```

Two things are going on in `{price:.2f}` that are worth teasing apart:

- `{price}` says *put the value here*, the f-string does the conversion to text for you.
- `:.2f` says *render it as a fixed-point number with 2 digits after the decimal*, rounding happens only in the displayed form.

Format specifiers do more than round: they also align. A column of `7.5`, `8.5`, `87.5` looks ragged; give every entry the same width and the column lines up:

```python
print(f"{7.5:>6}")     # "    7.5"   right-aligned in a width of 6
print(f"{87.5:>6}")    # "   87.5"
```

## A worked example: the price column

A shop receipt wants the labels on the left and the numbers lined up by their decimals. Two format directions do both:

```python
print(f"{'item':<10}{'price':>7}")
print(f"{'coffee':<10}{3.5:>7.2f}")
print(f"{'croissant':<10}{2.95:>7.2f}")

# item       price
# coffee      3.50
# croissant   2.95
```

`<10` left-aligns the label across a width of ten columns; `>7.2f` right-aligns the number across seven, keeping two decimals. Alignment is just formatting in the other direction, the same `{value:spec}` you already know, with the arrow telling which way the text leans. This is the seed of every table the course will build: labels one way, numbers the other.

## Common pitfalls

- **`print()` has no return value.** `print("hi")` shows text but evaluates to `None`, you cannot capture what it printed back into a variable. Printing is the *end* of a computation, never a step inside it.
- **Mixing types with `+`.** `print("Score: " + 87)` raises a `TypeError`, because a string and a number cannot be added. F-strings exist precisely to pair a label with a value: `print(f"Score: {87}")`.
- **A literal `{` in an f-string needs `{{`.** `f"{{x}}"` prints `{x}`; a lone `{` is read as the start of an expression. Doubling is the escape hatch.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Evaluate $\dfrac{2^5 + 9}{5}$ on paper, then print it *without* typing the answer yourself, let the computer compute and print in one step.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>print((2**5 + 9) / 5)</code> → <code>8.2</code>. One expression, handed straight to <code>print()</code>: the machine evaluates it and writes the result.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Given `temperature = 23.7891`, print it as `"Today: 23.8°C"` (one decimal place) without touching the stored value.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>print(f"Today: {temperature:.1f}°C")</code> → <code>Today: 23.8°C</code>. The <code>:.1f</code> specifier rounds <em>at display time only</em>; <code>temperature</code> remains <code>23.7891</code>.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does Python use `print()` as a function (with parentheses) rather than a statement? What advantage does that give you?
- `print("A", "B", "C")` prints `A B C` with spaces. How could you print them with no spaces? With commas between them?
- If `x = 3.14`, what does `f"{x}"` produce? What about `f"{x:.0f}"`? Explain the difference in terms of the value versus its rendering.

## ✅ Quick check

<div class="quiz" data-quiz="python-101-printing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Your formula is computed, but the program shows nothing. Why?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The value was computed wrong.</button>
      <button class="quiz-q__opt" data-idx="1">The result was never given to print().</button>
      <button class="quiz-q__opt" data-idx="2">Python discards values it no longer needs.</button>
      <button class="quiz-q__opt" data-idx="3">print() needs at least two arguments.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. How do you print 3.14159 with two decimal places shown, without rounding the stored value?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f"{x:2f}"</button>
      <button class="quiz-q__opt" data-idx="1">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="2">f"{x:.2d}"</button>
      <button class="quiz-q__opt" data-idx="3">print(x, 2)</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>