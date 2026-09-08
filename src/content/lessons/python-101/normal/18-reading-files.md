---
title: "Reading Files"
description: "Open, read, and process text files safely with context managers."
module: "file-io"
order: 18
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Open and read files with the with statement"
  - "Read line by line for memory-efficient processing"
  - "Use pathlib for cross-platform file paths"
  - "Handle common file errors gracefully"
prerequisites: ["17-comprehensions"]
tags: ["files", "read", "with", "context-manager", "pathlib"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Opening files

Use `open()` to get a file object:

```python
f = open("data.txt", "r")  # read mode
content = f.read()
f.close()  # always close when done!
```

## The with statement

`with` automatically closes the file, even if an error occurs:

```python
with open("data.txt") as f:
    content = f.read()
# file is closed here
```

**Always use `with`** — it's safer and cleaner.

## Reading strategies

```python
# Read entire file as one string
with open("data.txt") as f:
    text = f.read()

# Read line by line (memory-efficient for large files)
with open("data.txt") as f:
    for line in f:
        print(line.rstrip())  # strip trailing newline

# Read all lines into a list
with open("data.txt") as f:
    lines = f.readlines()  # includes \n in each string
```

## Pathlib (modern approach)

`pathlib` provides object-oriented paths — more readable than string concatenation:

```python
from pathlib import Path

p = Path("data") / "scores.txt"    # Path('data/scores.txt')
text = p.read_text()               # read the whole file
lines = p.read_text().splitlines() # lines without \n

p.exists()   # True/False
p.is_file()  # True/False
p.suffix     # '.txt'
p.stem       # 'scores'
```

## Encoding

Always specify encoding for portability:

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
```

Without `encoding`, Python uses the system default, which varies across platforms.

## Common pitfalls

- **Forgetting `with`**: file handles leak if you don't close them
- **Reading huge files into memory**: use `for line in f` instead of `f.read()`
- **Ignoring encoding**: garbled text on non-ASCII files
- **Hardcoded paths**: use `pathlib.Path` for cross-platform compatibility

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write code that counts the number of lines in a file without loading it all into memory.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>count = 0; with open("file.txt") as f: for line in f: count += 1</code> or simply <code>sum(1 for _ in open("file.txt"))</code></p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Use `pathlib` to list all `.txt` files in a directory.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>list(Path(".").glob("*.txt"))</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why does `for line in f` not include the trailing `\n`? Or does it? How would you strip it?
- What happens if you try to read a file that doesn't exist? How does `with` handle exceptions?
- When would you prefer `f.read()` over iterating line by line?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

<div class="quiz" data-quiz="python-101-file-reading">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does <code>line.rstrip()</code> do in a file loop?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Removes all whitespace</button>
      <button class="quiz-q__opt" data-idx="1">Removes trailing newline (and spaces)</button>
      <button class="quiz-q__opt" data-idx="2">Removes leading newline</button>
      <button class="quiz-q__opt" data-idx="3">Returns the line length</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. What is the correct way to read a file?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f = open("x.txt"); f.read()</button>
      <button class="quiz-q__opt" data-idx="1">read("x.txt")</button>
      <button class="quiz-q__opt" data-idx="2">with open("x.txt") as f: content = f.read()</button>
      <button class="quiz-q__opt" data-idx="3">File.read("x.txt")</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>
