---
title: "Build a File-Organizer Bot"
description: "Sort a messy folder into category subfolders with a bot that plans before it moves, logs what it did, and can undo it."
difficulty: "beginner"
author: abderrahim-adrabi
---

# 📁 Build a File-Organizer Bot

A folder you have been dumping things into for a year: screenshots, PDFs, a couple of zip files, some song downloads, three scripts, and a file with no extension at all. You could sort it by hand in twenty minutes, or you could write the thing that sorts it, and never do it by hand again.

This is the first project that touches your actual filesystem, which makes it a better teacher than it looks: moving files is destructive, and a program that is careless about it is worse than no program. So the bot is built the way file-manipulating tools are actually built — it plans first, prints the plan, moves only on request, records what it moved, and can undo the last run.

## 🎯 What you'll do

1. Scan a folder and classify each loose file by its extension into a category.
2. Build a **dry run**: compute every move, print it, and touch nothing.
3. Perform the moves, handling name collisions instead of overwriting.
4. Write an operations log, and replay it in reverse to undo.
5. Test it all against a deliberately messy sample folder, never your real one.

## Where to run this

**Locally with `uv`.** The project is pure Python standard library — `pathlib`, `shutil`, `json` — so there is nothing to install, but it does need to run on your machine because it touches real files.

```bash
cd examples/file-organizer
uv run python generate_sample.py          # make a safe folder to experiment on
uv run python organizer.py sample_messy_folder --dry-run
uv run python organizer.py sample_messy_folder
uv run python organizer.py sample_messy_folder --undo
```

The full runnable code is in [`examples/file-organizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/file-organizer).

## Step 1 — Classify by extension

The whole bot rests on one small function: extension to category.

```python
CATEGORIES = {
    'documents': {'.pdf', '.txt', '.doc', '.docx', '.csv'},
    'images': {'.png', '.jpg', '.jpeg', '.gif', '.svg'},
    'archives': {'.zip', '.tar', '.gz'},
    'code': {'.py', '.js', '.ts', '.sh'},
    'audio': {'.mp3', '.wav'},
    'video': {'.mp4', '.mov'},
}
```

Anything not listed lands in `other`. That fallback matters: an unknown extension can never crash the bot, and an extensionless file (`mystery`) is classified deliberately rather than by accident.

## Step 2 — Plan before moving

The dry run computes a list of `(source, destination)` pairs and prints them. Nothing on disk changes.

```
[DRY RUN] No files will be moved. Target: sample_messy_folder

Planned moves (10):
  notes.txt      ->  documents/notes.txt
  photo1.jpg     ->  images/photo1.jpg
  report.pdf     ->  documents/report (1).pdf
  mystery        ->  other/mystery
```

That `report (1).pdf` is not a typo: the sample folder deliberately already contains a `documents/report.pdf`, so the very first run exercises real collision handling.

## Step 3 — Collisions, not overwrites

A naive `shutil.move` would overwrite the existing file and lose it. The bot appends `(1)`, `(2)` until the name is free — the same convention your file manager uses, for the same reason.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Why is handling collisions in the *planning* step, rather than at move time, the safer design?

<p class="challenge__answer">💡 <strong>Answer:</strong> Because the dry run then shows the real destination. If collisions were resolved during the move, the plan you reviewed would not be the plan that ran, which defeats the point of reviewing it.</p>

</div>
</details>

## Step 4 — A log you can replay backwards

Every real run appends to `.organizer_log.json`: source, destination, and timestamp. `--undo` reads the last run's entries and moves each file back, newest first.

This is the difference between a script and a tool. A script that moves files and cannot reverse it is one typo away from a bad afternoon.

## Step 5 — Test on something safe

`generate_sample.py` builds a throwaway folder with a deliberate collision, extensionless files, and a dotfile the organizer must ignore. Run the bot there first, always. The habit is the lesson: the dry run exists because pointing file-moving code at `~/Downloads` the first time is how people lose data.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

The organizer ignores dotfiles. What breaks if it does not?

<p class="challenge__answer">💡 <strong>Answer:</strong> It would move configuration files like `.gitignore`, `.env` and `.organizer_log.json` itself into category folders — including its own log, which `--undo` then cannot find. Dotfiles are settings, not clutter.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why is a dry-run mode worth writing when you could just be careful?
- What should happen if the destination folder already exists but is a file?
- Should `--undo` refuse to run if a file has changed since the move? Why?
- What is the smallest version of this bot you would still trust with your own folder?

## ✅ Quick check

<div class="quiz" data-quiz="projects-file-organizer">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. What does --dry-run do?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Moves the files and then reverses it.</button>
      <button class="quiz-q__opt" data-idx="1">Computes and prints every planned move without touching disk.</button>
      <button class="quiz-q__opt" data-idx="2">Deletes the files instead of moving them.</button>
      <button class="quiz-q__opt" data-idx="3">Runs the organizer without a log.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. A destination name already exists. What should the bot do?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Overwrite it; the newer file is better.</button>
      <button class="quiz-q__opt" data-idx="1">Skip the file silently.</button>
      <button class="quiz-q__opt" data-idx="2">Append (1), (2)… until the name is free.</button>
      <button class="quiz-q__opt" data-idx="3">Delete the older file first.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
