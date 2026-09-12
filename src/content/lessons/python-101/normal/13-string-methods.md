---
title: "String Methods"
description: "Split, join, replace, and transform text with Python's rich string toolkit."
module: "strings"
order: 13
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Use split() and join() to convert between strings and lists"
  - "Apply strip(), replace(), find(), startswith(), endswith()"
  - "Format strings with advanced f-string syntax"
  - "Understand immutability — string methods return new strings"
prerequisites: ["12-scope-and-lambdas"]
tags: ["strings", "methods", "split", "join", "strip", "replace"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## The immutable string

A string is finished the moment it is created. Every method that appears to edit it actually returns a **new** string, leaving the original untouched:

```python
name = "alice"
upper = name.upper()
print(name)    # alice  (unchanged)
print(upper)   # ALICE
```

This is worth internalizing as a law: string methods never mutate; they hand back freshly built copies. Once you expect new strings, the toolset becomes predictable — and the occasional `while` loop that seemingly does nothing collapses into a reassignment.

## Splitting and joining

The two most transportable operations are exact inverses. Splitting breaks a string on a delimiter; joining glues a sequence back together with a delimiter:

```python
sentence = "hello world python"
words = sentence.split()       # ['hello', 'world', 'python']
back = " ".join(words)         # 'hello world python'

csv_line = "apple,banana,cherry"
fruits = csv_line.split(",")   # ['apple', 'banana', 'cherry']
```

Written as equations, they undo each other:

$$
\text{split}(s, \text{sep}) = [w_1, w_2, \ldots, w_n] \qquad \text{join}(\text{sep}, [w_1, \ldots, w_n]) = w_1 + \text{sep} + w_2 + \cdots + w_n.
$$

Note the asymmetry: `split()` with no argument splits on runs of whitespace — multiple spaces collapse — while a lowercase space is your delimiter in `" ".join(words)`. The join delimiter is what you want *between* pieces, hence `","`, not `""`.

## Searching and testing

```python
text = "Hello, World!"

text.startswith("Hello")   # True
text.endswith("!")         # True
text.find("World")         # 7  (index of first match, -1 if not found)
text.count("l")            # 3
text.replace("World", "Python")  # 'Hello, Python!'
```

`startswith` and `endswith` are yes/no questions about the edges of the string — cheap guards that replace slicing. `find` answers *where*, returning the first index where the substring begins, or $-1$ when the search fails. `count` tallies non-overlapping occurrences; `replace` swaps every match for a substitute.

## Case and whitespace

```python
"hello".upper()        # 'HELLO'
"HELLO".lower()        # 'hello'
"  hi  ".strip()       # 'hi'  (removes leading/trailing whitespace)
"  hi  ".lstrip()      # 'hi ' (left only)
"  hi  ".rstrip()      # '  hi' (right only)
"hello world".title()  # 'Hello World'
```

`strip` trims the padding that pollution adds — the stray spaces around pasted input. `title` capitalizes each word's first letter, the suburban disguise for data entry sloppiness. Each is a transformation with one purpose, best reached for by its name rather than memorized.

## Advanced f-string formatting

The f-string is a layout function: declarative columns and precision. Alignment with a width, and number formatting with a spec:

```python
price = 19.999
name = "Widget"

# Width and alignment
print(f"|{name:<15}|")   # |Widget          |  (left-align, width 15)
print(f"|{name:>15}|")   # |          Widget|  (right-align)
print(f"|{name:^15}|")   # |     Widget     |  (center)

# Number formatting
print(f"{price:.2f}")     # 20.00
print(f"{42:05d}")        # 00042  (zero-padded)
print(f"{0.857:.1%}")     # 85.7%  (percentage)
```

The `%` spec is a small multiplication by $100$ and a sign: $\{0.857 \mapsto 85.7\%\}$. The `.2f` rounds to two decimals in the display while the underlying number stays whole. Alignment turns a ragged column of values into a named table — presentation without arithmetic in the body.

## A worked example: cleaning the pasted line

The tools snap into a pipeline for the messiest real-world input — a line pasted from a table:

```python
raw = "  apple, banana, cherry  "
cleaned = raw.strip()
fruits = cleaned.split(", ")
print(fruits)          # ['apple', 'banana', 'cherry']
back = ", ".join(fruits)
print(back)            # 'apple, banana, cherry'
```

Three gestures, one circuit: `strip` peels the padding that pasting brings, `split` cuts it into pieces, `join` re-glues with the chosen separator. The inverse pair `split`/`join` is the bridge between text and list — the same relation as the opening equation.

## Common pitfalls

- **Forgetting what no-argument `split()` is.** It splits on runs of whitespace; asking it to split on the empty string is not a choice it offers.
- **Expecting `find()` to raise on absent substrings.** It returns $-1$. Check before slicing on it.
- **Trying to modify a string in place.** There is no in-place edit; reassign the result.
- **`join` sits on the delimiter, `split` on the string.** `" ".join(words)`, not `words.join(" ")` — the separator owns the method, and forgetting which is which yields an `AttributeError`.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write `title_case(s)` that capitalizes the first letter of every word: `title_case("hello world")` → `"Hello World"`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>return s.title()</code> — Python's built-in does exactly this; sometimes one line is the whole solution.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given `"one,two,,three"`, split on commas and drop the empty strings.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>[x for x in s.split(",") if x]</code> or <code>list(filter(None, s.split(",")))</code> — the empty string is falsy, so the truthiness filter discards it without a length check.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does `find()` return $-1$ instead of raising an error? What does each choice cost?
- How do you reverse a string? Is there a method for that, or does the answer live elsewhere?
- When is `str.replace()` the wrong tool — and what fits a more delicate substitution instead?

## ✅ Quick check

<div class="quiz" data-quiz="python-101-string-methods">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does <code>"a,b,c".split(",")</code> return?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['abc']</button>
      <button class="quiz-q__opt" data-idx="1">['a', 'b', 'c']</button>
      <button class="quiz-q__opt" data-idx="2">'abc'</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. What does <code>"hello".find("xyz")</code> return?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>