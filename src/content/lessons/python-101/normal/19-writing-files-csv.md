---
title: "Writing Files & CSV"
description: "Write text to files and work with structured CSV data."
module: "file-io"
order: 19
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Write and append to text files"
  - "Read and write CSV files with the csv module"
  - "Use pathlib for file creation and manipulation"
  - "Understand file modes (r, w, a, x)"
prerequisites: ["18-reading-files"]
tags: ["write", "csv", "append", "file-modes", "csv-module"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## File modes

```python
open("file.txt", "r")   # read (default)
open("file.txt", "w")   # write (overwrites!)
open("file.txt", "a")   # append (adds to end)
open("file.txt", "x")   # create (errors if file exists)
```

## Writing text files

```python
# "w" mode creates or overwrites
with open("output.txt", "w") as f:
    f.write("Hello, World!\n")
    f.write("Second line\n")

# writelines for multiple strings
lines = ["line 1\n", "line 2\n", "line 3\n"]
with open("output.txt", "w") as f:
    f.writelines(lines)
```

## Appending

```python
with open("log.txt", "a") as f:
    f.write("New entry\n")  # adds to end, doesn't overwrite
```

## Working with CSV

The `csv` module handles the tricky parts (quoting, delimiters):

```python
import csv

# Writing CSV
with open("data.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    writer.writerow(["Alice", 85])
    writer.writerow(["Bob", 92])

# Reading CSV
with open("data.csv") as f:
    reader = csv.reader(f)
    header = next(reader)  # ['Name', 'Score']
    for row in reader:
        print(f"{row[0]}: {row[1]}")
```

## DictReader and DictWriter

Map CSV rows to dictionaries for cleaner code:

```python
import csv

# DictReader — rows become dicts with header keys
with open("data.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['Name']}: {row['Score']}")

# DictWriter — write from dicts
with open("output.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Name", "Score"])
    writer.writeheader()
    writer.writerow({"Name": "Charlie", "Score": 88})
```

## Pathlib for writing

```python
from pathlib import Path

Path("output.txt").write_text("Hello!\n")
content = Path("output.txt").read_text()

# Create directories
Path("data/logs").mkdir(parents=True, exist_ok=True)
```

## Common pitfalls

- **`"w"` overwrites silently** — you lose old data. Use `"a"` to append
- **Forgetting `newline=""`** in CSV on Windows — causes blank rows
- **Not calling `writeheader()`** with `DictWriter` — output has no header row

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a function that takes a list of numbers and writes them to a file, one per line.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>with open("nums.txt", "w") as f: for n in nums: f.write(f"{n}\n")</code></p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Read a CSV of student grades and print the average score.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>import csv; with open("grades.csv") as f: rows = list(csv.DictReader(f)); avg = sum(int(r["Score"]) for r in rows) / len(rows); print(f"Average: {avg:.1f}")</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why does CSV writing need `newline=""` on Windows but not Linux? What's happening under the hood?
- What's the difference between `csv.writer` and `csv.DictWriter`? When would you prefer one?
- If you're writing a CSV that will be opened in Excel, what extra precautions should you take?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

<div class="quiz" data-quiz="python-101-file-writing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Which mode creates a file or overwrites it?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"r"</button>
      <button class="quiz-q__opt" data-idx="1">"w"</button>
      <button class="quiz-q__opt" data-idx="2">"a"</button>
      <button class="quiz-q__opt" data-idx="3">"x"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. What does <code>csv.DictReader</code> use as dictionary keys?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">The first row (headers)</button>
      <button class="quiz-q__opt" data-idx="1">Column indices (0, 1, 2...)</button>
      <button class="quiz-q__opt" data-idx="2">Auto-generated names</button>
      <button class="quiz-q__opt" data-idx="3">The last row</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>
