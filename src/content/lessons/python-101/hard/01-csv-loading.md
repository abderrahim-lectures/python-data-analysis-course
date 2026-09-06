---


title: "Loading CSV Corpus"
description: "Open, parse, and verify the structure of slm-corpus.csv using Python's csv module."
module: "loading-corpus"
order: 1
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Open and parse a CSV file using csv.reader and csv.DictReader"
  - "Inspect column names, row count, and data types in a CSV dataset"
  - "Extract raw text from corpus rows into a single string"
  - "Handle common CSV pitfalls: encoding, newline characters, missing values"
prerequisites: []
tags: ["python", "csv", "corpus", "data-loading"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Why should you pass newline when opening a CSV file for the csv module?"
    options:
      - text: "It prevents the file from being read as binary"
      - text: "It lets the csv module handle line endings correctly"
        correct: true
      - text: "It speeds up reading by bypassing line buffering"
      - text: "It converts all text to lowercase"
  - question: "What does csv.DictReader use as dictionary keys for each row?"
    options:
      - text: "Column indices (0, 1, 2...)"
      - text: "The first data row"
      - text: "The header row values"
        correct: true
      - text: "Auto-generated names like field_1, field_2"
  - question: "Given reader = csv.DictReader(f), what does next(reader) return?"
    options:
      - text: "The header row"
      - text: "The first data row"
        correct: true
      - text: "The last data row"
      - text: "A tuple of all rows"
---
Why start with data?

Every machine learning project begins with data. For a text-based language model, that data is a **corpus** — a collection of text that the model will learn patterns from. Our corpus lives in `slm-corpus.csv`, a small CSV file that ships with the course in `static/datasets/`.

Before you can tokenize, count, or generate anything, you need to load this file into Python. This lesson covers two approaches: `csv.reader` for raw access and `csv.DictReader` for header-aware access.

## Key Concepts

### Opening a CSV file

Python's `csv` module handles the messy parts of CSV parsing (quoted fields, embedded commas, escaped characters). Always open CSV files in text mode and let the module do the work:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)  # first row = column names
    print(header)  # e.g. ['id', 'text']
```

The `newline=""` argument is required by the `csv` module docs — without it, you may get blank rows on Windows or double-spaced output.

### Reading with DictReader

`csv.DictReader` maps each row to a dictionary using the header row as keys. This makes your code self-documenting:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["text"])  # access by column name, not index
```

The first call to `next(reader)` is automatic — `DictReader` consumes the header row itself.

### Extracting the full text

To build a language model, you need all the text concatenated into one long string. Here's how to collect it:

```python
import csv

texts = []
with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        texts.append(row["text"])

full_text = " ".join(texts)
print(f"Loaded {len(texts)} rows, {len(full_text)} characters")
```

The `join()` method concatenates all row texts with a space separator, producing one continuous block of text.

### Verifying the load

Always check your data after loading. Count the rows, peek at a few samples, and look for obvious problems:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Total rows: {len(rows)}")
print(f"Columns: {rows[0].keys()}")
print(f"First row: {rows[0]}")
print(f"Last row:  {rows[-1]}")
```

If the file is large, avoid `list(reader)` — it loads everything into memory. Instead, iterate and process row by row.

## Try It

Load `slm-corpus.csv` and print:
1. The number of rows in the file
2. The column names
3. The text from the first row

Use this skeleton:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Rows: {len(rows)}")
print(f"Columns: {list(rows[0].keys())}")
print(f"Sample: {rows[0]['text'][:200]}")
```

## Key Takeaways

- Always open CSV files with `newline=""` when using the `csv` module
- `csv.DictReader` gives you header-keyed access; `csv.reader` gives you index-based access
- Verify your load: check row counts, column names, and peek at sample data
- For large files, iterate row-by-row instead of converting to a list

## Practice Challenge

Write a function `load_corpus(path)` that takes a CSV file path and returns a list of strings — one per row's `text` column. Handle the case where the file doesn't exist by printing an error message and returning an empty list.

```python
def load_corpus(path):
    import csv
    try:
        with open(path, newline="") as f:
            reader = csv.DictReader(f)
            return [row["text"] for row in reader]
    except FileNotFoundError:
        print(f"File not found: {path}")
        return []
```

## Projects You Can Build

Here are a few real-world projects that reinforce these concepts:

- 🕷️ **Scrape and Analyze** - Load scraped web data from CSV files for analysis and reporting
- 📊 **Spreadsheet Tool** - Build a CSV parser that handles different delimiters and encoding issues
- 🎓 **Gradebook** - Import student grades from CSV files and generate summary reports
