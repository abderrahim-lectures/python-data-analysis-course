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

## The four doors

Reading was a one-way door: `"r"` lets data walk in. Writing needs the vocabulary of intention, because each mode promises something different about the file's fate:

```python
open("file.txt", "r")   # read (default)
open("file.txt", "w")   # write (overwrites!)
open("file.txt", "a")   # append (adds to end)
open("file.txt", "x")   # create (errors if file exists)
```

`"w"` throws the old contents away the moment it opens; `"a"` keeps them and tacks on at the end; `"x"` refuses to touch a file that already exists. Choose the mode that states what you truly mean — the file is destroyed or preserved by that choice.

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

`write` delivers one string at a time; `writelines` delivers a whole list in one call. Both respect the same `with` contract you already trust: when the block ends, the file is flushed and closed. Notice the `\n` creeping into every written string — the newline is not added for you, only stored.

## Appending

Logs grow and never rewrite history. `"a"` parks the cursor at the end:

```python
with open("log.txt", "a") as f:
    f.write("New entry\n")  # adds to end, doesn't overwrite
```

Append mode makes the file an accumulator: each run adds a line, and everything written before survives untouched.

## Working with CSV

A CSV is a table on a wire: rows separated by newlines, cells separated by commas. The `csv` module owns the delicate parts — quoting, escaping delimiters, line endings:

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

The writer accepts a list per row and inserts the commas; the reader parses each row back into a list. `next(reader)` peels off the header line, and iteration continues with the data — the same walk you already know, on a file whose rows are structures.

## DictReader and DictWriter

Lists are fine, but named fields stop you from asking what `row[0]` meant. Dicts name the columns once, at the header:

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

`DictReader` reads the header and turns every later row into a dict keyed by it; `DictWriter` does the reverse — declare `fieldnames`, write the header, then feed dicts whose values land under their named columns.

## Pathlib for writing

The object-oriented path works both directions now:

```python
from pathlib import Path

Path("output.txt").write_text("Hello!\n")
content = Path("output.txt").read_text()

# Create directories
Path("data/logs").mkdir(parents=True, exist_ok=True)
```

`write_text` compresses open-write-close into one call, and `mkdir` with `parents=True` grows whole directory trees in a single command rather than one level at a time.

## A worked example: the grade book, committed to CSV

The mapping goes to disk as a table — header first, then a row per entry:

```python
import csv

scores = {"Alice": 85, "Bob": 92, "Charlie": 78}

with open("grades.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    for name, score in scores.items():
        writer.writerow([name, score])
```

The dict's `items()` becomes the rows; the header names the columns. `newline=""` pins the line endings, and the `with` block flushes and closes the file when done.

## Common pitfalls

- **`"w"` overwrites silently.** The old file is gone the instant the mode opens. If the past matters, choose `"a"`.
- **Forgetting `newline=""` in CSV.** On Windows the writer doubles line endings unless you pin `newline=""`; blank rows appear between data.
- **Skipping `writeheader()`.** A `DictWriter` given dicts writes no header row unless you call it — readers lose their keys.
- **`writerow` takes a sequence — and a string is a sequence of characters.** `writer.writerow("Alice")` sprinkles `A,l,i,c,e` across five cells. Wrap the value in a list when the field is one string.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Write a function that takes a list of numbers and writes them to a file, one per line.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>with open("nums.txt", "w") as f: for n in nums: f.write(f"{n}\n")</code> — one string per number, each ending in its own newline.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Read a CSV of student grades and print the average score.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>import csv; with open("grades.csv") as f: rows = list(csv.DictReader(f)); avg = sum(int(r["Score"]) for r in rows) / len(rows); print(f"Average: {avg:.1f}")</code></p>

</div>
</details>

## 🤔 Socratic Questions

- Why does CSV writing need `newline=""` on Windows but not Linux? What is happening under the hood?
- Where lies the difference between `csv.writer` and `csv.DictWriter` — and when do you reach for each?
- If the CSV will be opened in Excel, what extra precautions should you take?

## ✅ Quick check

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