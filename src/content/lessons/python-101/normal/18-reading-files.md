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

## The bridge to disk

Programs that only compute with what the user types are caged in memory. Files open the door: a file is a sequence of lines, and reading it is walking that sequence. The first step is `open()`, which returns a file object attached to the door:

```python
f = open("data.txt", "r")  # read mode
content = f.read()
f.close()  # always close when done!
```

`"r"` means read-only. And the discipline is heavy: `close()` must run when you are finished, or the handle leaks — the file stays held open long after you stopped needing it. Forgetting it is the first generation of file bugs.

## The with statement: closing as a promise

`with` makes the closing automatic, even when an error bursts through the middle:

```python
with open("data.txt") as f:
    content = f.read()
# file is closed here
```

The `with` block declares a contract: open it here, and it will be closed when this block ends — normally or by exception. The handle's lifetime is boxed into the block, so there is nothing left to forget.

## Reading strategies

The one file, three appetites:

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

`f.read()` takes everything at once; `readlines()` splits into a list; and iterating `for line in f` steps through the file one line at a time, holding only the current line in memory. The last is the prescription for a file too large to fit: process each line and move on, never gathering the whole.

## Pathlib: paths with a vocabulary

String path concatenation with `+` reads like archaeology. `pathlib` hands you a `Path` whose methods *say* what they do:

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

The `/` joins parts into a path the way a filesystem joins directories; `exists`, `is_file`, `suffix`, and `stem` query what the path *is*. Paths become data with answers rather than strings to be peeled apart.

## Encoding: the letters' contract

Text is bytes until a convention interprets them. Pin that convention down for portability across machines:

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
```

Without `encoding`, Python falls back to the system's default, which differs by platform — the same file, garbled on a Windows box and clean on Linux. Stating `utf-8` makes the bytes mean the same letters everywhere.

## A worked example: the score file, line by line

The memory-safe walk — accumulate without ever holding the whole file:

```python
with open("scores.txt", encoding="utf-8") as f:
    total = 0
    count = 0
    for line in f:
        total += int(line.strip())
        count += 1

print(f"Avg: {total / count}")
```

Each line is read, stripped of its newline, converted, and dropped before the next arrives — the file flows through, never gathering the whole. The `with` promise closes the file as the block ends, normally or by exception.

## Common pitfalls

- **Forgetting `with`.** Handles leak when nothing closes them; let the block own the file's life.
- **Swallowing huge files.** `f.read()` on a giant file can exhaust memory — iterate `for line in f` instead.
- **Ignoring encoding.** Non-ASCII letters turn to gibberish when the convention is left to chance.
- **Hardcoded paths.** `pathlib.Path` makes the same code walk on every operating system.
- **A consumed file reads empty.** After `f.read()`, the position sits at the end; a second read returns `''` and `readlines()` returns `[]`. Read once, or reopen.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Count the lines of a file without loading it into memory.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>count = 0; with open("file.txt") as f: for line in f: count += 1</code> or the compact <code>sum(1 for _ in open("file.txt"))</code> — a line at a time, never the whole.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

List every `.txt` file in a directory with `pathlib`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>list(Path(".").glob("*.txt"))</code> — a single glob walks the matching names for you.</p>

</div>
</details>

## 🤔 Socratic Questions

- Does `for line in f` include the trailing `\n`? Why does the loop look as it does — and how do you strip the newline?
- What happens when you read a file that doesn't exist? How does `with` fare against the exception?
- When does `f.read()` beat iterating line by line?

## ✅ Quick check

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