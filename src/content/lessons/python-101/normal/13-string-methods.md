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

## Strings are immutable

Every string method returns a **new** string — the original is never modified:

```python
name = "alice"
upper = name.upper()
print(name)    # alice  (unchanged)
print(upper)   # ALICE
```

## Splitting and joining

Convert between strings and lists:

```python
sentence = "hello world python"
words = sentence.split()       # ['hello', 'world', 'python']
back = " ".join(words)         # 'hello world python'

csv_line = "apple,banana,cherry"
fruits = csv_line.split(",")   # ['apple', 'banana', 'cherry']
```

## Searching and testing

```python
text = "Hello, World!"

text.startswith("Hello")   # True
text.endswith("!")         # True
text.find("World")         # 7  (index of first match, -1 if not found)
text.count("l")            # 3
text.replace("World", "Python")  # 'Hello, Python!'
```

## Case and whitespace

```python
"hello".upper()        # 'HELLO'
"HELLO".lower()        # 'hello'
"  hi  ".strip()       # 'hi'  (removes leading/trailing whitespace)
"  hi  ".lstrip()      # 'hi ' (left only)
"  hi  ".rstrip()      # '  hi' (right only)
"hello world".title()  # 'Hello World'
```

## Advanced f-string formatting

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

## Common pitfalls

- **Forgetting split() without args** splits on whitespace, not empty string
- **Expecting find() to raise an error** — it returns -1 instead
- **Trying to modify a string in place** — always reassign the result

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a function `title_case(s)` that capitalizes the first letter of every word: `title_case("hello world")` → `"Hello World"`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>return s.title()</code> — Python's built-in does exactly this.</p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given `"one,two,,three"`, write code that splits on commas and removes empty strings.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>[x for x in s.split(",") if x]</code> or <code>list(filter(None, s.split(",")))</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why does `find()` return -1 instead of raising an error? What's the tradeoff?
- How would you reverse a string in Python? Is there a method for that, or do you need a different approach?
- When is `str.replace()` the wrong tool for the job? What would you use instead?

</section>

<section class="lesson-section lesson-section--projects">
<h2 id="-projects-you-can-build">Projects You Can Build</h2>

<p>Here are a few real-world projects that reinforce these concepts:</p>

<ul>
  <li>🎮 <strong>Wordle Clone</strong> - Use string methods for case normalization, letter extraction, and feedback formatting</li>
  <li>🎨 <strong>AI Story Writer</strong> - Apply string methods for text cleaning, formatting, and output presentation</li>
  <li>✅ <strong>Note-Taking App</strong> - Use split/join for parsing tags and format/strip for cleaning user input</li>
</ul>

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

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
</section>
