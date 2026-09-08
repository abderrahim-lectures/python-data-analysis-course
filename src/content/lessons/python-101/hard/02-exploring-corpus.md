---

title: "Exploring the Corpus"
description: "Compute row counts, column names, and preview sample text to understand your dataset before processing."
module: "loading-corpus"
order: 2
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Compute basic statistics: row count, column count, character length"
  - "Preview sample rows and inspect text content"
  - "Understand what makes a corpus suitable for a language model"
  - "Identify data quality issues: empty rows, encoding errors, duplicates"
prerequisites: ["01-csv-loading"]
tags: ["python", "corpus", "data-exploration", "text-analysis"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "What is the first step when exploring a new CSV corpus?"
    options:
      - text: "Start tokenizing immediately"
      - text: "Check column names, row count, and a sample of the data"
        correct: true
      - text: "Load it into a pandas DataFrame"
      - text: "Delete rows with missing values"
  - question: "How do you extract the text column from a CSV DictReader?"
    options:
      - text: "reader[0]"
      - text: "reader.text"
      - text: "row text for each row in reader"
        correct: true
      - text: "reader.get_text()"
  - question: "What does len(list(reader)) tell you?"
    options:
      - text: "The number of columns"
      - text: "The number of data rows (excluding header)"
        correct: true
      - text: "The total file size"
      - text: "The number of characters"
---
Explore before you process

Loading data is step one. Step two is understanding what you loaded. A corpus might have missing values, duplicate rows, encoded characters that look like garbage, or text that's too short to be useful. Spending five minutes exploring now saves hours of debugging later.

## Key Concepts

### Counting rows and columns

The simplest statistics tell you a lot. A corpus with 5 rows won't produce a useful model; one with 50,000 rows might need chunked loading:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Rows:    {len(rows)}")
print(f"Columns: {list(rows[0].keys())}")
```

### Measuring text length

Language models need enough text to learn patterns. Check the total character count and the average row length:

```python
total_chars = sum(len(row["text"]) for row in rows)
avg_len = total_chars / len(rows) if rows else 0

print(f"Total characters: {total_chars:,}")
print(f"Average row length: {avg_len:.0f} characters")
```

A corpus with an average of 10 characters per row is too short — the model won't have enough context to learn word sequences.

### Previewing sample text

Read a few rows to get a feel for the content. What language is it? What topics does it cover? Is the text clean or noisy?

```python
for i, row in enumerate(rows[:5]):
    preview = row["text"][:150].replace("\n", " ")
    print(f"[{i}] {preview}...")
```

### Finding duplicates

Duplicate rows inflate word counts without adding new information. Detect them by converting rows to a set:

```python
unique_texts = set(row["text"] for row in rows)
print(f"Unique rows: {len(unique_texts)} / {len(rows)}")

if len(unique_texts) < len(rows):
    print(f"Warning: {len(rows) - len(unique_texts)} duplicate rows found")
```

### Checking for empty or short rows

Empty or very short rows won't contribute useful bigrams. Filter them out:

```python
short_rows = [row for row in rows if len(row["text"].split()) < 3]
print(f"Rows with fewer than 3 words: {len(short_rows)}")
```

A corpus summary function combines all of these checks:

```python
def corpus_summary(path):
    import csv
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    texts = [row["text"] for row in rows]
    total_chars = sum(len(t) for t in texts)
    unique = len(set(texts))

    print(f"Rows: {len(rows)}")
    print(f"Unique: {unique}")
    print(f"Total chars: {total_chars:,}")
    print(f"Avg length: {total_chars / len(rows):.0f}")
    print(f"Columns: {list(rows[0].keys())}")
```

## Try It

Run `corpus_summary("slm-corpus.csv")` and note:
1. How many rows are in the corpus?
2. Are there any duplicates?
3. Is the average text length long enough to build meaningful bigrams (at least 20+ words per row)?

## Key Takeaways

- Always explore your data before processing — check counts, lengths, and duplicates
- Short or empty rows add noise; filter them based on a minimum word count
- Duplicate rows inflate frequency counts without adding new patterns
- A quick summary function saves time across projects

## Practice Challenge

Write a function `corpus_quality(path)` that loads a CSV and returns a dict with these keys: `"rows"`, `"unique"`, `"total_chars"`, `"avg_length"`, `"min_length"`, `"max_length"`. Use it to assess whether `slm-corpus.csv` is suitable for bigram modeling.

```python
def corpus_quality(path):
    import csv
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    texts = [row["text"] for row in rows]
    lengths = [len(t.split()) for t in texts]

    return {
        "rows": len(rows),
        "unique": len(set(texts)),
        "total_chars": sum(len(t) for t in texts),
        "avg_length": sum(lengths) / len(lengths) if lengths else 0,
        "min_length": min(lengths) if lengths else 0,
        "max_length": max(lengths) if lengths else 0,
    }
```
