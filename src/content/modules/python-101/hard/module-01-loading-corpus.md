---
title: "Loading a Text Corpus"
description: "Load, inspect, and understand the structure of a text corpus stored in CSV, the raw material for our tiny language model."
order: 1
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 1.5
lessonCount: 2
tags: ["csv", "corpus", "data-loading", "nlp", "text-generation"]
prerequisites: []
icon: "📚"
---

## Why This Matters

Every language model, from the autocomplete on your phone to ChatGPT, was trained on a corpus: a large collection of text. Before any model can learn patterns, predict the next word, or generate poetry, someone has to load that text into a program. This is step zero of all natural language processing, and it's where most beginners get stuck.

Imagine you have a CSV file with thousands of English sentences. You want to feed those sentences into a Python program so it can learn language patterns. But a CSV file is just bytes on disk, a stream of characters separated by commas. Python needs to open it, parse it, and give you the text in a usable form. If you've ever tried to load a dataset and gotten a `FileNotFoundError`, a `csv.Error`, or a garbled string of Unicode characters, you've felt the pain of this step. Getting it right is non-negotiable.

In this module you'll load a small English corpus (`slm-corpus.csv`) that ships with the course. By the end, you'll understand CSV parsing, how to extract raw text from structured rows, and what a "corpus" actually looks like once you crack it open. This is the foundation everything else in this track is built on, tokenization, bigram tables, and ultimately your text generator all start here.

## What You'll Learn

- Load a CSV file using `csv.reader` and `csv.DictReader` and understand the difference between them
- Inspect the shape, column names, and sample rows of a dataset
- Extract raw text from corpus rows and concatenate it into a single string
- Understand what a text corpus is and why CSV is a practical storage format for training data
- Debug common file-loading errors: encoding issues, path mistakes, and malformed rows

## The Derivation

**The problem:** You have a file full of text, and you want to work with it in Python. Where do you start?

**The naive approach:** You might try `open("data.csv").read()`, and sometimes that works. But for structured data like CSV, you'll quickly hit problems. Commas inside quoted fields break naive splitting. Different operating systems use different line endings. Some CSVs have headers, some don't. Hardcoding string splits is brittle and fails the moment the data changes shape.

**The solution:** Python's built-in `csv` module handles all of this. It understands quoting rules, delimiter handling, and line endings across platforms. You can use `csv.reader` for raw rows (lists of strings) or `csv.DictReader` for named columns (dicts with header keys). The choice matters: `DictReader` is more readable when you know the column names, while `csv.reader` gives you positional access.

**How it works:** When you call `csv.DictReader(open("file.csv"))`, the module reads the first row as headers and yields each subsequent row as an `OrderedDict` keyed by those headers. You can iterate through it like any Python iterator, it's memory-efficient because it doesn't load the entire file at once. For a corpus, you'll typically extract one column (the text) and concatenate all rows into one long string. That string becomes the input for tokenization in the next module.

## Gamification

- **XP Reward**: +60 XP per lesson completed (120 XP total for this module)
- **Challenges**: Each lesson has interactive challenges, load a CSV, inspect its structure, extract and verify text content
- **Progress**: Complete both lessons to finish this module
- **Streak Bonus**: +15 XP extra per day once your streak passes 3 days
- **PBL Milestone**: This is the starting point of the full text generator pipeline, Module 1 of 5 toward your capstone project

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 🤖 **AI Story Writer**, needs corpus loading as the first step in any text generation pipeline
- 📰 **Newsletter Builder**, loads article data from CSV to generate content automatically
- 🔍 **Semantic Search Engine**, corpus loading is the prerequisite for building search indexes
- 📊 **Text Analytics Dashboard**, load and inspect text data before analysis
- 🗞️ **Sentiment Analyzer**, load labeled text data for training a sentiment classifier

## Lessons

1. **Loading CSV Corpus**, open, parse, and verify the structure of `slm-corpus.csv`
2. **Exploring the Corpus**, compute row counts, column names, and preview sample text
