---
title: "File I/O"
description: "Read from and write to files, work with CSV data, and handle paths safely."
order: 7
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 2
lessonCount: 2
tags: ["files", "read", "write", "csv", "context-manager", "with"]
prerequisites: ["module-06-data-structures"]
icon: "📁"
---

## Why This Matters

Every program you write eventually needs to talk to the outside world. A game saves high scores to a file. A data analyst reads a CSV with thousands of rows. A web server loads configuration from a YAML file. Without file I/O, your programs exist in a vacuum — they can process data while running, but nothing persists after they stop.

Consider building a budget tracker. You could calculate totals in memory, but when the program closes, everything is gone. The user would have to re-enter every expense every time. File I/O solves this by letting you save data to disk and load it back later. The `csv` module handles structured data in spreadsheet format. The `pathlib` module handles file paths across Windows, macOS, and Linux without platform-specific hacks.

File I/O is also where Python's context managers (`with` statement) shine. Without them, you'd have to remember to close files manually — forget, and you leak file handles, corrupt data, or crash. The `with` statement guarantees cleanup automatically. It's a pattern you'll use in every real Python project, from simple scripts to production systems.

## What You'll Learn

- Opening and closing files with `open()` and why the `with` statement is essential
- Reading files line by line and as a whole string
- Writing text to files and appending new data
- Working with CSV files using the `csv` module
- Safe file paths with `pathlib` for cross-platform compatibility
- File modes (`r`, `w`, `a`, `r+`) and when to use each

## The Derivation

**The Problem:** Programs run in memory — fast but temporary. Files live on disk — slow but permanent. You need to bridge the two: read data from files into your program, process it, and write results back. Without file I/O, every program would lose its data when it exits.

**The Naive Approach:** Open a file, read everything into memory, process it, write it back, and *remember to close the file*. The problem: if your program crashes between opening and closing, the file handle stays locked. Other programs can't access it. Your data might be corrupted. And you have to write `file.close()` in every code path — including error handlers.

**The Elegant Solution:** Python's `with` statement is a context manager. It opens a file, lets you work with it, and *automatically closes it* when the block exits — even if an exception occurs. No leaks, no forgotten `close()` calls.

```python
with open("data.csv", "r") as file:
    for line in file:
        process(line)
# File is guaranteed to be closed here
```

**Reading vs. Writing:** The file mode determines what you can do. `r` (read) opens for reading — the file must exist. `w` (write) opens for writing — it *overwrites* the file if it exists. `a` (append) opens for writing but adds to the end instead of overwriting. `r+` opens for both reading and writing. Choosing the wrong mode is a common source of data loss — `w` on a file you meant to append to destroys everything.

**Line-by-Line vs. Whole File:** `file.read()` loads the entire file into memory — fine for small files, dangerous for large ones (a 2GB file would crash your program). Iterating `for line in file:` reads one line at a time — memory-efficient and scalable. For CSV files, the `csv` module handles parsing automatically, giving you rows as lists or dictionaries.

**pathlib:** Hardcoded paths like `"C:/Users/data/file.csv"` break on Linux. `"../data/file.csv"` breaks on Windows. `pathlib` abstracts this: `Path("data") / "file.csv"` works everywhere. It also handles exists checks, suffixes, parent directories, and file creation without platform-specific code.

## Gamification

- **XP Reward**: +100 XP per lesson completed (200 XP total for this module)
- **Challenges**: Each lesson includes interactive file I/O challenges
- **Progress**: Complete all 2 lessons to complete the Python 101 Normal track
- **Streak Bonus**: Complete this module in one sitting for +10 XP bonus
- **Achievement Unlocked**: "File Master" — read a CSV, process it, and write the results to a new file

### Lesson Challenges

| Lesson | Challenge | XP |
|--------|-----------|-----|
| Reading & Writing | Read a text file, count lines/words/characters, and write a summary | +100 |
| CSV & Pathlib | Parse a CSV file, filter rows by a condition, and save the result | +100 |

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 💰 **Expense Tracker** — reads/writes expenses to a CSV, calculates running totals
- 📝 **Journal App** — saves daily entries to text files and reads them back
- 📊 **CSV Data Analyzer** — reads CSV files, computes statistics, and writes summary reports
- 🗂️ **File Organizer** — uses pathlib to scan directories and move files by type

## Lessons

1. **Reading & Writing Text Files** — `open()`, `with`, `read()`, `readlines()`, `write()`, `append()`, and file modes
2. **CSV & Pathlib** — the `csv` module for reading/writing structured data, and `pathlib` for safe cross-platform paths
