---
title: "Week 5: Working with CSV Files"
sidebar_position: 5
section: python-101
track: normal
week: 5
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Week 5: Reading & Writing CSV Files

<span className="gamified-flourish">📊 Everything you learned this month was building toward one thing: real data lives in files, not in code you typed by hand.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Read a CSV file's rows into Python using the built-in `csv` module.
- Combine lists, dicts, loops, and functions to summarize a real dataset.
- Write a small mini-project end-to-end, without help, using only what you've learned in Weeks 1–4.

## Lesson

### CSV: rows of comma-separated values

A CSV (comma-separated values) file is a plain-text table — one line per row, values separated by commas. This week's dataset, [`students-normal.csv`](pathname:///datasets/students-normal.csv), has a header row (`name,quiz1,quiz2,quiz3`) followed by one row per student.

:::tip Using this file in the Trinket playground
The FAB's Trinket playground is a sandboxed third-party editor — it can't reach files on this site directly. Open the dataset link above, copy its contents, then in Trinket create a new file named `students.csv` (use the file-tree "+" button) and paste the contents in. Your `open("students.csv")` calls will then find it.
:::

```python
import csv

with open("students.csv", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)          # first row: column names
    for row in reader:
        print(row)                  # each row is a list of strings
```

Every value read this way is a `str` — a number like `"87"` in the file arrives as the string `"87"`, not the int `87`. You must convert it yourself, exactly like `input()` in Week 1.

### `csv.DictReader`: rows as dicts

Rather than tracking column positions by index, `csv.DictReader` gives you each row as a `dict` keyed by the header names — this is usually the more readable option:

```python
with open("students.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["name"]
        score = int(row["score"])   # still a str until you convert it
        print(name, score)
```

### Writing CSV files

`csv.writer` and `csv.DictWriter` are the mirror image — useful for saving a summary you've computed back out to a file:

```python
with open("summary.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "average"])
    writer.writerow(["Amina", 91.5])
```

### Putting it together: a mini project

This week's project combines everything from Weeks 1–4: read a CSV of student scores, compute per-student averages with a function, store them in a `dict`, and print a summary sorted from highest to lowest — using `sorted()` with a `key` function, which itself takes a function as an argument, exactly like `compose` from last week's socratic question:

```python
def average(scores):
    return sum(scores) / len(scores)

averages = {}   # name -> average
with open("students.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["name"]
        scores = [int(row["quiz1"]), int(row["quiz2"]), int(row["quiz3"])]
        averages[name] = average(scores)

for name in sorted(averages, key=lambda n: averages[n], reverse=True):
    print(name, round(averages[name], 1))
```

`lambda n: averages[n]` is a small, unnamed function — read it as "the rule that maps a name to its average," used only to tell `sorted()` what to sort by.

## 🧩 Challenges

<Challenge id="python101-normal-w5-c1" answer={<>Open the file with <code>csv.DictReader</code>, loop over rows, convert the score column with <code>int(...)</code>, and keep a running <code>total</code> and <code>count</code> (or use a list and <code>sum()</code>/<code>len()</code>) to compute the class average.</>}>

Given a CSV with columns `name,score`, write a program that computes and prints the average score across *all* students in the file.

</Challenge>

<Challenge id="python101-normal-w5-c2" answer={<>Loop over the DictReader rows, keep a running <code>best_name</code>/<code>best_score</code> pair, and update them whenever you see a higher score — the same "track the running maximum" pattern as finding the max of a list.</>}>

Extend the previous program to also print the name of the student with the *highest* single score.

</Challenge>

<Challenge id="python101-normal-w5-c3" answer={<>Use <code>csv.writer</code>, write a header row, then loop over your averages dict writing one row per student — mirroring the read side but with <code>writerow</code> instead of iterating a reader.</>}>

Write the per-student averages you computed above out to a new file `summary.csv` with columns `name,average`.

</Challenge>

<Challenge id="python101-normal-w5-c4" answer={<>Wrap the int(...) conversion so a missing/blank value is skipped or defaulted (e.g. treat it as 0, or exclude that quiz from the average) rather than crashing the whole program — this is exactly the kind of situation try/except (this week's bonus) is designed for.</>}>

What would happen if one row in the CSV had a missing score (an empty string instead of a number)? Modify your program so it doesn't crash on that row.

</Challenge>

## 🤔 Socratic Questions

- Why does everything read from a CSV arrive as a `str`, even numeric-looking columns? Where else in this course have you seen this same "text in, conversion required" pattern?
- `sorted(averages, key=lambda n: averages[n], reverse=True)` — what would change if you removed `reverse=True`? What would change if you removed `key=...` entirely and just wrote `sorted(averages)`?
- You've now built a small pipeline: read → transform → summarize → write. Which of Weeks 1–4's concepts did each stage actually depend on? Which week's material would this project have been impossible without?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-normal-week-5"
  questions={[
    {
      id: 'q1',
      prompt: 'What type is every value read from a CSV file with the csv module, before you convert it?',
      options: ['int', 'float', 'str', 'Depends on the column'],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: 'What does csv.DictReader give you for each row, compared to csv.reader?',
      options: [
        'A list of strings, same as csv.reader',
        'A dict keyed by the header column names',
        'A tuple of ints',
        'A single string of the whole row',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'In sorted(names, key=lambda n: averages[n]), what is the key argument for?',
      options: [
        'It filters out some names',
        'It tells sorted() what value to sort each item by',
        'It converts names to numbers permanently',
        'It reverses the order',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: "Which module from Python's standard library was used to read/write CSV files this week?",
      options: ['json', 'os', 'csv', 'io'],
      correctOptionIndex: 2,
    },
  ]}
/>

## 🎁 Bonus: a first taste of classes

<BonusContent weekId="python-101-normal-week-5">

Every student this week was a loose collection of separate values — a name in one dict, a list of scores in another. A `class` lets you bundle related data and behavior into one object:

```python
class Student:
    def __init__(self, name, scores):
        self.name = name
        self.scores = scores

    def average(self):
        return sum(self.scores) / len(self.scores)

amina = Student("Amina", [88, 92, 79])
print(amina.average())   # 86.33...
```

`__init__` runs when you create a `Student(...)`; `self` refers to *this particular* student object. This isn't part of the core curriculum — everything in Weeks 1–5 was deliberately solvable with just functions, lists, and dicts — but classes become genuinely useful once a program has many related pieces of state and behavior that travel together, which you'll start to feel in the **Data Analysis** section's larger projects. Try rewriting this week's mini-project so each student is a `Student` object instead of a name-keyed dict.

</BonusContent>

<ProgressCheckbox weekId="python-101-normal-week-5" />
