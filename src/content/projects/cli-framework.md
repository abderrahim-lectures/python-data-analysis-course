---
title: "CLI Framework"
description: "Build a professional command-line tool with subcommands, colored output, configuration, and progress indicators."
difficulty: "intermediate"
estimatedMinutes: 50
xpReward: 50
tags: ["cli", "argparse", "classes", "json"]
prerequisites: ["Python basics (variables, loops, functions, classes)", "Familiarity with command-line terminals"]
---

# CLI Framework

Every serious Python tool lives on the command line. In this project you will build a reusable CLI framework from scratch — a task manager with subcommands for adding, listing, removing, and searching tasks. Along the way you will learn how `argparse` parses arguments, how to route subcommands, how to color terminal output, how to validate input, how to load settings from a JSON file, and how to show progress bars for slow operations. No third-party frameworks like Click or Typer — just Python's standard library and a few lines of careful design.

This project assumes you know Python basics: variables, loops, functions, classes, and dictionaries. You should also be comfortable opening a terminal and running Python scripts from the command line. This is optional and ungraded. See [Real-World Projects](/projects) for the full list.

## What you'll do

1. Parse positional and optional arguments with `argparse`.
2. Build a subcommand architecture that routes commands like `task add`, `task list`, `task remove`, and `task search`.
3. Add colored terminal output using raw ANSI escape codes.
4. Implement input validation with clear, user-friendly error messages.
5. Load and save settings from a JSON configuration file.
6. Add progress indicators for long-running operations.

## What you'll build

A CLI framework that:

- Parses positional and optional arguments
- Supports subcommands (add, list, remove, search)
- Displays colored text and formatted output
- Validates input with clear error messages
- Loads settings from a config file
- Shows progress bars for long operations

## Where to run this

- **Locally with `uv` (recommended).** CLI tools need a real terminal — this project does not work in notebooks.
- **Google Colab.** Limited — you can test individual functions, but the full CLI experience requires a local terminal.
- **JupyterLite.** Not suitable for CLI execution.

## Setup

`uv` is a single tool that replaces the usual "install Python, then pip, then a virtual environment" chain — it manages Python versions and dependencies together.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

Then set up the project:

```bash
uv init cli-framework
cd cli-framework
```

No third-party packages are needed — everything in this project uses Python's standard library.

## Step 1: Parse arguments with argparse

### Objective

Learn how `argparse` reads the command line and converts raw strings into a structured namespace your code can use.

### Explanation

When you type `python task.py add "Buy milk" --priority high`, Python sees `sys.argv` as the list `["task.py", "add", "Buy milk", "--priority", "high"]`. `argparse` turns that list into a named object where you can access `args.command == "add"`, `args.title == "Buy milk"`, and `args.priority == "high"` — no manual string splitting, no index errors.

The two key concepts are **positional arguments** (required, identified by position) and **optional arguments** (flags like `--priority` that have defaults).

### Starter hint

Import `argparse` and `sys`. Create a function `build_parser()` that returns an `argparse.ArgumentParser`. Use `add_argument` to define what the tool accepts. Call `parser.parse_args()` to get a namespace object.

### Working code

Create a file called `task.py`:

```python
import argparse
import sys


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser for the task manager."""
    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    parser.add_argument(
        "title",
        nargs="?",
        help="Task title (interactive prompt if omitted)",
    )
    parser.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default="medium",
        help="Task priority (default: medium)",
    )
    parser.add_argument(
        "-c", "--category",
        default="general",
        help="Task category (default: general)",
    )
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.title:
        print(f"Task:      {args.title}")
        print(f"Priority:  {args.priority}")
        print(f"Category:  {args.category}")
    else:
        title = input("Enter task title: ").strip()
        if not title:
            print("Error: title cannot be empty.")
            sys.exit(1)
        print(f"Task:      {title}")
        print(f"Priority:  {args.priority}")
        print(f"Category:  {args.category}")


if __name__ == "__main__":
    main()
```

### Expected output

Run from the terminal:

```bash
python task.py "Buy milk" --priority high --category shopping
```

```
Task:      Buy milk
Priority:  high
Category:  shopping
```

Omit the title to trigger the interactive prompt:

```bash
python task.py -p low
```

```
Enter task title: Clean the garage
Task:      Clean the garage
Priority:  low
Category:  general
```

Pass `--help` to see the auto-generated help text:

```bash
python task.py --help
```

```
usage: task [-h] [-p {low,medium,high}] [-c CATEGORY] [title]

A simple task manager from the command line.

positional arguments:
  title                 Task title (interactive prompt if omitted)

options:
  -h, --help            show this help message and exit
  -p {low,medium,high}, --priority {low,medium,high}
                        Task priority (default: medium)
  -c CATEGORY, --category CATEGORY
                        Task category (default: general)
```

### Troubleshooting

**"unrecognized arguments" error.** You passed a flag before a positional argument in the wrong order, or misspelled a flag name. Run `python task.py --help` to see valid options.

**`title` is always `None`.** The `nargs="?"` makes the positional argument optional. If you want it required, remove `nargs="?"` and the `if args.title` check.

**Priority flag accepts invalid values.** The `choices=["low", "medium", "high"]` constraint rejects anything else. If you need custom priorities, use `type=str` instead of `choices`.

### Checklist

- `python task.py "Write report" --priority high` prints the title, priority, and category.
- `python task.py --help` shows a formatted help message with all flags.
- `python task.py -p low` with no title prompts the user for input.
- Invalid priority values like `--priority urgent` produce a clear error.
- `python task.py` with no arguments and no stdin triggers the prompt.

### Socratic question

Why does `argparse` handle the `--help` flag automatically? What would you have to write manually if you had to parse `sys.argv` yourself and detect `-h` or `--help`?

## Step 2: Build subcommands

### Objective

Extend the parser to support multiple commands — `add`, `list`, `remove`, `search` — each with its own arguments, all routed through one entry point.

### Explanation

Real CLI tools don't dump everything into one parser. They use subcommands: `git commit`, `docker run`, `pip install`. `argparse` supports this with `add_subparsers()`. Each subparser is its own mini-parser with its own arguments, but they all live under one parent. The `dest="command"` parameter stores which subcommand was chosen.

### Starter hint

Inside `build_parser()`, call `parser.add_subparsers(dest="command")`. Then add each subcommand with `sub.add_parser("add", ...)`. Give each subparser its own arguments. In `main()`, switch on `args.command` to dispatch to the right handler.

### Working code

Replace the contents of `task.py` with:

```python
import argparse
import sys
import json
from datetime import datetime


TASKS_FILE = "tasks.json"


def load_tasks() -> list[dict]:
    """Load tasks from the JSON file."""
    try:
        with open(TASKS_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_tasks(tasks: list[dict]) -> None:
    """Save tasks to the JSON file."""
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f, indent=2)


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser with subcommands."""
    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # add
    add_p = sub.add_parser("add", help="Add a new task")
    add_p.add_argument("title", help="Task title")
    add_p.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default="medium",
        help="Task priority (default: medium)",
    )
    add_p.add_argument(
        "-c", "--category",
        default="general",
        help="Task category (default: general)",
    )

    # list
    list_p = sub.add_parser("list", help="List all tasks")
    list_p.add_argument(
        "--category",
        help="Filter by category",
    )
    list_p.add_argument(
        "--priority",
        choices=["low", "medium", "high"],
        help="Filter by priority",
    )
    list_p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of tasks to show (0 = all)",
    )

    # remove
    remove_p = sub.add_parser("remove", help="Remove a task by index")
    remove_p.add_argument("index", type=int, help="Task index (from list)")

    # search
    search_p = sub.add_parser("search", help="Search tasks by keyword")
    search_p.add_argument("keyword", help="Search term")

    return parser


def cmd_add(args):
    """Add a new task."""
    tasks = load_tasks()
    task = {
        "title": args.title,
        "priority": args.priority,
        "category": args.category,
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)
    print(f"Added: {task['title']} [{task['priority']}]")


def cmd_list(args):
    """List tasks with optional filters."""
    tasks = load_tasks()
    if not tasks:
        print("No tasks found.")
        return

    if args.category:
        tasks = [t for t in tasks if t["category"] == args.category]
    if args.priority:
        tasks = [t for t in tasks if t["priority"] == args.priority]
    if args.limit > 0:
        tasks = tasks[: args.limit]

    if not tasks:
        print("No tasks match the filters.")
        return

    print(f"\n  {'#':<4} {'Title':<30} {'Priority':<10} {'Category':<12} {'Status'}")
    print(f"  {'─'*4} {'─'*30} {'─'*10} {'─'*12} {'─'*10}")
    for i, t in enumerate(tasks, 1):
        status = "done" if t["done"] else "open"
        print(f"  {i:<4} {t['title']:<30} {t['priority']:<10} {t['category']:<12} {status}")
    print()


def cmd_remove(args):
    """Remove a task by its index."""
    tasks = load_tasks()
    if not tasks:
        print("No tasks to remove.")
        return

    idx = args.index - 1
    if idx < 0 or idx >= len(tasks):
        print(f"Error: index {args.index} is out of range (1-{len(tasks)}).")
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"Removed: {removed['title']}")


def cmd_search(args):
    """Search tasks by keyword in the title."""
    tasks = load_tasks()
    keyword = args.keyword.lower()
    matches = [t for t in tasks if keyword in t["title"].lower()]

    if not matches:
        print(f"No tasks contain '{args.keyword}'.")
        return

    print(f"\n  Found {len(matches)} task(s) matching '{args.keyword}':")
    for i, t in enumerate(matches, 1):
        print(f"  {i}. {t['title']} [{t['priority']}]")
    print()


def main():
    parser = build_parser()
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
```

### Expected output

```bash
python task.py add "Buy milk" --priority high --category shopping
python task.py add "Write report" --category work
python task.py add "Clean garage" --priority low --category home
```

```
Added: Buy milk [high]
Added: Write report [medium]
Added: Clean garage [low]
```

```bash
python task.py list
```

```
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Buy milk                       high       shopping     open
  2    Write report                   medium     work         open
  3    Clean garage                   low        home         open
```

```bash
python task.py list --category work --priority medium
```

```
  Found 1 task(s):
  1. Write report [medium]
```

```bash
python task.py search milk
```

```
  Found 1 task(s) matching 'milk':
  1. Buy milk [high]
```

```bash
python task.py remove 2
```

```
Removed: Write report
```

```bash
python task.py list
```

```
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Buy milk                       high       shopping     open
  2    Clean garage                   low        home         open
```

### Troubleshooting

**"the following arguments are required: command" error.** You forgot the subcommand name. Every invocation must start with a subcommand: `python task.py add ...`, not `python task.py ...`.

**Index out of range when removing.** The `remove` command uses 1-based indexing (matching what the user sees in `list`). If you pass `0` or a number larger than the task count, you get a clear error. Check the `list` output to confirm the correct index.

**JSON decode error on startup.** If `tasks.json` contains invalid JSON (maybe you edited it by hand), the `load_tasks` function returns an empty list and starts fresh. To recover, delete the file and re-add tasks.

**Filters return nothing.** `--category work` is case-sensitive. A task with category "Work" won't match "work". Consider adding `.lower()` normalization in the filter if you want case-insensitive matching.

### Checklist

- `python task.py add "Test" --priority high` creates a task and confirms with output.
- `python task.py list` shows all tasks in a formatted table.
- `python task.py list --category work` shows only tasks in the "work" category.
- `python task.py remove 1` removes the first task and confirms the title.
- `python task.py remove 99` prints a clear out-of-range error.
- `python task.py search keyword` finds tasks with matching titles.
- Tasks persist across commands — add three, list, and all three appear.

### Socratic question

Why does the `load_tasks` function return an empty list on `FileNotFoundError` instead of crashing? What design pattern does this represent — and how does it change the user experience when they run the tool for the first time?

## Step 3: Add colored output

### Objective

Make the terminal output visually distinct by wrapping text in ANSI color codes — so priorities, statuses, and errors are instantly recognizable.

### Explanation

Terminals interpret special escape sequences as color commands. The sequence `\033[91m` tells the terminal to switch to red text, and `\033[0m` resets to the default. By wrapping output in these codes, you make high-priority tasks red, low-priority tasks dim, and success messages green — without any third-party libraries.

### Starter hint

Define a `Color` class with class-level string constants for each color. Write a `colored(text, color)` helper that wraps text in the escape codes. Use it in your `cmd_list` and `cmd_add` functions to highlight different parts of the output.

### Working code

Add the following `Color` class and `colored` function at the top of `task.py`, after the imports:

```python
class Color:
    """ANSI color codes for terminal output."""
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def colored(text: str, color: str) -> str:
    """Wrap text in an ANSI color code."""
    return f"{color}{text}{Color.RESET}"
```

Now update `cmd_add` to use colors:

```python
def cmd_add(args):
    """Add a new task with colored confirmation."""
    tasks = load_tasks()
    task = {
        "title": args.title,
        "priority": args.priority,
        "category": args.category,
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }
    p_color = priority_colors.get(args.priority, "")
    print(f"  {colored('+', Color.GREEN)} {task['title']} [{colored(args.priority, p_color)}]")
```

Update `cmd_list` to color-code priorities and status:

```python
def cmd_list(args):
    """List tasks with colored output."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks found.", Color.DIM))
        return

    if args.category:
        tasks = [t for t in tasks if t["category"] == args.category]
    if args.priority:
        tasks = [t for t in tasks if t["priority"] == args.priority]
    if args.limit > 0:
        tasks = tasks[: args.limit]

    if not tasks:
        print(colored("  No tasks match the filters.", Color.DIM))
        return

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }

    print()
    header = f"  {'#':<4} {'Title':<30} {'Priority':<10} {'Category':<12} {'Status'}"
    print(colored(header, Color.BOLD))
    print(f"  {'─'*4} {'─'*30} {'─'*10} {'─'*12} {'─'*10}")

    for i, t in enumerate(tasks, 1):
        status = colored("done", Color.GREEN) if t["done"] else colored("open", Color.CYAN)
        p_color = priority_colors.get(t["priority"], "")
        p_display = colored(t["priority"], p_color)
        print(f"  {i:<4} {t['title']:<30} {p_display:<19} {t['category']:<12} {status}")
    print()
```

Update `cmd_remove` to color the confirmation:

```python
def cmd_remove(args):
    """Remove a task with colored confirmation."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks to remove.", Color.DIM))
        return

    idx = args.index - 1
    if idx < 0 or idx >= len(tasks):
        print(colored(f"  Error: index {args.index} is out of range (1-{len(tasks)}).", Color.RED))
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"  {colored('-', Color.RED)} {removed['title']}")
```

Update `cmd_search` to highlight matches:

```python
def cmd_search(args):
    """Search tasks and highlight matches."""
    tasks = load_tasks()
    keyword = args.keyword.lower()
    matches = [t for t in tasks if keyword in t["title"].lower()]

    if not matches:
        print(colored(f"  No tasks contain '{args.keyword}'.", Color.DIM))
        return

    print(f"\n  {colored('Found', Color.GREEN)} {len(matches)} task(s) matching '{args.keyword}':")
    for i, t in enumerate(matches, 1):
        print(f"  {i}. {colored(t['title'], Color.CYAN)} [{t['priority']}]")
    print()
```

### Expected output

```bash
python task.py add "Deploy to production" --priority high --category work
python task.py add "Read a book" --priority low --category personal
python task.py list
```

```
  + Deploy to production [high]
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Deploy to production           high       work         open
  2    Read a book                    low        personal     open
```

On a terminal that supports ANSI colors, "high" appears in red, "low" is dimmed, "open" is cyan, and the header row is bold. The `+` sign is green and the `-` sign on remove is red.

### Troubleshooting

**Colors appear as raw escape codes like `[91m`.** Your terminal does not interpret ANSI codes. Try `export TERM=xterm-256color` before running. On Windows, use Windows Terminal or PowerShell 7+ — the old `cmd.exe` does not support ANSI by default.

**Colors appear in files but not in terminal.** You might be piping output to a file (`python task.py list > output.txt`). ANSI codes are for interactive terminals only. If you need to write to files, strip the codes or use a flag like `--no-color`.

**The `colored` function returns empty string.** Check that you are passing a `Color` constant, not a `Color` attribute that does not exist. For example, `Color.RED` works, but `Color.rED` does not.

**Bold text does not look bold.** Some terminal themes override ANSI bold with a lighter shade instead of actual bold. Try a different terminal theme or use `\033[1m` combined with a color code for emphasis.

### Checklist

- High-priority tasks show in red in the list output.
- Low-priority tasks are dimmed.
- The `+` add confirmation is green.
- The `-` remove confirmation is red.
- The table header row is bold.
- The "open" status label is cyan.
- Running `python task.py list > out.txt` produces a file without escape sequences if piped through a tool that strips them, or with escape sequences if the pipe preserves them — either way, the tool does not crash.

### Socratic question

Why should color codes only be applied to terminal output and never written to log files or data files? What happens if a user pipes your colored output to `less`, `grep`, or a CI/CD log parser?

## Step 4: Input validation

### Objective

Reject bad input early with clear, actionable error messages instead of letting invalid data corrupt your task list.

### Explanation

Input validation is the boundary between user error and program failure. A task with an empty title, a priority outside the allowed set, or a category with special characters should be caught *before* it is saved. The goal is to produce error messages that tell the user exactly what is wrong and how to fix it — no tracebacks, no silent corruption.

### Starter hint

Write a `validate_task_input(title, priority, category)` function that checks each field. Raise `ValueError` with a descriptive message for any invalid input. Call it at the start of `cmd_add` before saving.

### Working code

Add a validation function and update `cmd_add`:

```python
def validate_task_input(title: str, priority: str, category: str) -> None:
    """Validate task fields before saving. Raises ValueError on failure."""
    if not title or not title.strip():
        raise ValueError("Title cannot be empty or whitespace.")
    if len(title) > 200:
        raise ValueError(f"Title is too long ({len(title)} chars, max 200).")
    if priority not in ("low", "medium", "high"):
        raise ValueError(f"Invalid priority '{priority}'. Use: low, medium, high.")
    if not category or not category.strip():
        raise ValueError("Category cannot be empty.")
    if len(category) > 50:
        raise ValueError(f"Category is too long ({len(category)} chars, max 50).")
    # Check for characters that break JSON storage or display
    forbidden = set('/\\:"*?<>|')
    bad_chars = set(category) & forbidden
    if bad_chars:
        raise ValueError(
            f"Category contains invalid characters: {''.join(bad_chars)}"
        )


def cmd_add(args):
    """Add a new task with input validation."""
    try:
        validate_task_input(args.title, args.priority, args.category)
    except ValueError as e:
        print(colored(f"  Error: {e}", Color.RED))
        sys.exit(1)

    tasks = load_tasks()
    task = {
        "title": args.title.strip(),
        "priority": args.priority,
        "category": args.category.strip(),
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }
    p_color = priority_colors.get(args.priority, "")
    print(f"  {colored('+', Color.GREEN)} {task['title']} [{colored(args.priority, p_color)}]")
```

Also validate the `remove` index in `cmd_remove`:

```python
def cmd_remove(args):
    """Remove a task with input validation."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks to remove.", Color.DIM))
        return

    if args.index < 1:
        print(colored("  Error: index must be 1 or greater.", Color.RED))
        sys.exit(1)

    idx = args.index - 1
    if idx >= len(tasks):
        print(colored(
            f"  Error: index {args.index} is out of range (1-{len(tasks)}).",
            Color.RED,
        ))
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"  {colored('-', Color.RED)} {removed['title']}")
```

### Expected output

```bash
python task.py add "" --priority high
```

```
  Error: Title cannot be empty or whitespace.
```

```bash
python task.py add "A" * 50 --priority extreme
```

```
  Error: Invalid priority 'extreme'. Use: low, medium, high.
```

```bash
python task.py add "Valid task" --category "work/special"
```

```
  Error: Category contains invalid characters: /
```

```bash
python task.py remove 0
```

```
  Error: index must be 1 or greater.
```

```bash
python task.py remove 999
```

```
  Error: index 999 is out of range (1-3).
```

Valid input passes through cleanly:

```bash
python task.py add "Write documentation" --priority medium --category work
```

```
  + Write documentation [medium]
```

### Troubleshooting

**Validation passes but data is corrupt.** Make sure `validate_task_input` is called *before* the task is appended to the list. If you validate after appending, the bad data is already saved.

**Error message is cut off.** If the title is very long, the error message includes the character count. This is intentional — it tells the user exactly how much they need to shorten it.

**`strip()` removes useful whitespace.** If a user intentionally enters a title with leading spaces, `strip()` removes them. This is usually the right behavior for a task title, but if you need to preserve whitespace, remove the `.strip()` calls and document the policy.

**Category validation is too strict.** The forbidden character list is conservative. If you need categories with slashes (like "work/urgent"), adjust the validation to allow `/` but disallow `\`, `"`, and other JSON-breaking characters.

### Checklist

- Empty title produces a clear error, not a traceback.
- Title longer than 200 characters is rejected with the character count.
- Invalid priority values are rejected with the list of valid options.
- Empty category produces an error.
- Category with forbidden characters (`/`, `\`, `"`, etc.) is rejected.
- Removing index 0 produces a helpful error message.
- Removing an index larger than the task count shows the valid range.
- Valid input is saved correctly and confirmed with output.

### Socratic question

Why is it better to validate input at the boundary (when the user provides it) rather than deep inside the save function? What happens to debugging difficulty if validation and storage are tangled together?

## Step 5: Configuration file support

### Objective

Let users customize default behavior — default priority, default category, color preferences — by loading settings from a JSON file.

### Explanation

Hard-coded defaults work for a demo, but real tools need configuration. A JSON config file lets users set their preferences once and forget about them. The pattern is: look for a config file at a known path, load it if it exists, use it to set defaults, and fall back to built-in values if the file is missing or incomplete.

### Starter hint

Write a `Config` class that loads `~/.taskconfig.json` (or a path you specify). The `get(key, default)` method returns the config value or the default. Call it in `build_parser` to override default values for `--priority` and `--category`.

### Working code

Add a `Config` class and wire it into the CLI:

```python
import os
from pathlib import Path


DEFAULT_CONFIG_PATH = Path.home() / ".taskconfig.json"

DEFAULT_SETTINGS = {
    "default_priority": "medium",
    "default_category": "general",
    "colors_enabled": True,
    "date_format": "%Y-%m-%d",
}


class Config:
    """Load and access settings from a JSON config file."""

    def __init__(self, path: str | Path | None = None):
        self.path = Path(path) if path else DEFAULT_CONFIG_PATH
        self.settings: dict = {}
        self.load()

    def load(self) -> None:
        """Load settings from disk, falling back to defaults."""
        self.settings = dict(DEFAULT_SETTINGS)
        if self.path.exists():
            try:
                with open(self.path) as f:
                    user_settings = json.load(f)
                self.settings.update(user_settings)
            except (json.JSONDecodeError, KeyError) as e:
                print(colored(f"  Warning: config file error ({e}), using defaults.", Color.YELLOW))

    def save(self) -> None:
        """Save current settings to disk."""
        with open(self.path, "w") as f:
            json.dump(self.settings, f, indent=2)

    def get(self, key: str, default=None):
        """Get a setting value with a fallback default."""
        return self.settings.get(key, default)


def build_parser(config: Config | None = None) -> argparse.ArgumentParser:
    """Build the argument parser, optionally using config for defaults."""
    default_priority = config.get("default_priority", "medium") if config else "medium"
    default_category = config.get("default_category", "general") if config else "general"

    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # add
    add_p = sub.add_parser("add", help="Add a new task")
    add_p.add_argument("title", help="Task title")
    add_p.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default=default_priority,
        help=f"Task priority (default: {default_priority})",
    )
    add_p.add_argument(
        "-c", "--category",
        default=default_category,
        help=f"Task category (default: {default_category})",
    )

    # list
    list_p = sub.add_parser("list", help="List all tasks")
    list_p.add_argument("--category", help="Filter by category")
    list_p.add_argument(
        "--priority",
        choices=["low", "medium", "high"],
        help="Filter by priority",
    )
    list_p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of tasks to show (0 = all)",
    )

    # remove
    remove_p = sub.add_parser("remove", help="Remove a task by index")
    remove_p.add_argument("index", type=int, help="Task index (from list)")

    # search
    search_p = sub.add_parser("search", help="Search tasks by keyword")
    search_p.add_argument("keyword", help="Search term")

    # config (new subcommand)
    cfg_p = sub.add_parser("config", help="Show or update configuration")
    cfg_p.add_argument(
        "--show",
        action="store_true",
        help="Show current configuration",
    )
    cfg_p.add_argument(
        "--set",
        nargs=2,
        metavar=("KEY", "VALUE"),
        help="Set a configuration value",
    )
    cfg_p.add_argument(
        "--init",
        action="store_true",
        help="Create a default config file",
    )

    return parser
```

Add the config subcommand handler:

```python
def cmd_config(args, config: Config):
    """Handle the config subcommand."""
    if args.init:
        if config.path.exists():
            print(colored(f"  Config already exists at {config.path}", Color.YELLOW))
        else:
            config.save()
            print(f"  Created config at {config.path}")
    elif args.show:
        print(f"\n  {colored('Configuration', Color.BOLD)} ({config.path})")
        print(f"  {'─' * 40}")
        for key, value in sorted(config.settings.items()):
            print(f"  {key:<25} {value}")
        print()
    elif args.set:
        key, value = args.set
        if key not in config.settings:
            print(colored(f"  Unknown setting: {key}", Color.RED))
            print(f"  Valid settings: {', '.join(sorted(config.settings.keys()))}")
            sys.exit(1)
        # Type-coerce value to match the default's type
        default = config.settings[key]
        if isinstance(default, bool):
            value = value.lower() in ("true", "1", "yes")
        elif isinstance(default, int):
            value = int(value)
        config.settings[key] = value
        config.save()
        print(f"  Set {key} = {value}")
    else:
        print(colored("  Use --show, --set KEY VALUE, or --init.", Color.DIM))
```

Update `main()` to create the config and pass it through:

```python
def main():
    config = Config()
    parser = build_parser(config)
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
    }

    if args.command == "config":
        cmd_config(args, config)
    else:
        commands[args.command](args)
```

### Expected output

Initialize a config file:

```bash
python task.py config --init
```

```
  Created config at /home/you/.taskconfig.json
```

View the config:

```bash
python task.py config --show
```

```
  Configuration (/home/you/.taskconfig.json)
  ────────────────────────────────────────
  colors_enabled            True
  date_format               %Y-%m-%d
  default_category          general
  default_priority          medium
```

Change the default priority:

```bash
python task.py config --set default_priority high
```

```
  Set default_priority = high
```

Now new tasks use the configured default:

```bash
python task.py add "Urgent task"
```

```
  + Urgent task [high]
```

If the config file has invalid JSON, the tool warns and continues with defaults:

```bash
echo "not json" > ~/.taskconfig.json
python task.py config --show
```

```
  Warning: config file error (...), using defaults.

  Configuration (/home/you/.taskconfig.json)
  ────────────────────────────────────────
  colors_enabled            True
  date_format               %Y-%m-%d
  default_category          general
  default_priority          medium
```

### Troubleshooting

**Config file not found on Windows.** `Path.home()` returns `C:\Users\YourName` on Windows. The path `~/.taskconfig.json` translates correctly, but if you are running in a container or WSL, the home directory might differ. Print `config.path` to see the actual path.

**Type coercion fails.** If you set `default_priority` to `3` (a string), it stays a string instead of becoming an integer. The coercion logic checks the type of the *default* value — if the default is a string, the new value stays a string. This is intentional: you cannot change a string setting to an int through `--set`.

**Config file is overwritten on every save.** The `save` method writes the entire settings dict. If you add custom keys manually, they will be lost on the next save. Only keys in `DEFAULT_SETTINGS` are preserved.

**Permissions error writing to home directory.** On some systems, the home directory has strict permissions. Check with `ls -la ~` and ensure your user can write files there.

### Checklist

- `python task.py config --init` creates `~/.taskconfig.json` with default values.
- `python task.py config --show` prints all settings with their current values.
- `python task.py config --set default_priority low` updates the file.
- After changing `default_priority`, `python task.py add "Task"` uses the new default.
- A corrupted config file produces a warning, not a crash.
- Unknown setting names produce an error with the list of valid keys.
- `python task.py add "Task"` without a config file works with built-in defaults.

### Socratic question

Why does the config loader fall back to defaults instead of requiring the user to fix the file? What trade-off does this make between robustness and data correctness?

## Step 6: Progress indicators

### Objective

Show a progress bar for operations that take time — loading, filtering, or simulating work — so the user knows the tool is doing something, not stuck.

### Explanation

A progress bar is visual feedback. It tells the user how much work is done and how much remains. For a task manager, the most realistic use case is bulk operations: importing tasks from a file, running a search across a large dataset, or simulating a slow operation for learning purposes. The technique is simple: print a line with `\r` (carriage return) to overwrite itself as the progress updates.

### Starter hint

Write a `ProgressBar` class that tracks `current` and `total`. The `update()` method calculates the percentage, draws a bar of `#` and `-` characters, and prints it on the same line using `\r`. Add a `finish()` method that prints a newline when done.

### Working code

Add a `ProgressBar` class and use it in a bulk import simulation:

```python
import time


class ProgressBar:
    """A simple terminal progress bar."""

    def __init__(self, total: int, label: str = "Progress"):
        self.total = total
        self.current = 0
        self.label = label
        self.bar_width = 30

    def update(self, increment: int = 1) -> None:
        """Advance the progress bar by the given amount."""
        self.current = min(self.current + increment, self.total)
        percent = self.current / self.total if self.total > 0 else 1
        filled = int(self.bar_width * percent)
        bar = "#" * filled + "-" * (self.bar_width - filled)
        sys.stdout.write(f"\r  {self.label}: [{bar}] {self.current}/{self.total}")
        sys.stdout.flush()

    def finish(self) -> None:
        """Complete the progress bar and print a newline."""
        self.current = self.total
        self.update(0)
        sys.stdout.write("\n")
        sys.stdout.flush()
```

Add a `cmd_import` subcommand and a sample data file generator:

```python
def generate_sample_data(filename: str, count: int = 50) -> None:
    """Generate a sample tasks file for import."""
    import random

    titles = [
        "Review pull request", "Write documentation", "Fix login bug",
        "Deploy to staging", "Update dependencies", "Run test suite",
        "Clean up unused imports", "Refactor database queries",
        "Add error handling", "Write unit tests",
    ]
    priorities = ["low", "medium", "high"]
    categories = ["work", "personal", "urgent", "learning"]

    tasks = []
    for _ in range(count):
        tasks.append({
            "title": random.choice(titles),
            "priority": random.choice(priorities),
            "category": random.choice(categories),
        })

    with open(filename, "w") as f:
        json.dump(tasks, f, indent=2)
```

Add the import subcommand to `build_parser`:

```python
    # import (new subcommand)
    import_p = sub.add_parser("import", help="Import tasks from a JSON file")
    import_p.add_argument("file", help="JSON file with tasks to import")
    import_p.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be imported without saving",
    )
```

Add the import handler:

```python
def cmd_import(args):
    """Import tasks from a JSON file with a progress bar."""
    try:
        with open(args.file) as f:
            new_tasks = json.load(f)
    except FileNotFoundError:
        print(colored(f"  Error: file '{args.file}' not found.", Color.RED))
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(colored(f"  Error: invalid JSON in '{args.file}': {e}", Color.RED))
        sys.exit(1)

    if not isinstance(new_tasks, list):
        print(colored("  Error: expected a JSON array of tasks.", Color.RED))
        sys.exit(1)

    print(f"  Importing {len(new_tasks)} tasks from {args.file}...")
    progress = ProgressBar(len(new_tasks), label="Importing")

    existing = load_tasks() if not args.dry_run else []
    imported = 0

    for task in new_tasks:
        # Validate each task before importing
        try:
            validate_task_input(
                task.get("title", ""),
                task.get("priority", "medium"),
                task.get("category", "general"),
            )
            cleaned = {
                "title": task["title"].strip(),
                "priority": task.get("priority", "medium"),
                "category": task.get("category", "general"),
                "created_at": task.get("created_at", datetime.now().isoformat()),
                "done": task.get("done", False),
            }
            if not args.dry_run:
                existing.append(cleaned)
            imported += 1
        except ValueError as e:
            print(f"\n  {colored('Skipped', Color.YELLOW)}: {task.get('title', '?')} — {e}")
        progress.update()

    progress.finish()

    if not args.dry_run:
        save_tasks(existing)

    status = "would import" if args.dry_run else "imported"
    print(f"  {colored('Done!', Color.GREEN)} {status} {imported}/{len(new_tasks)} tasks.")
```

Add `import` to the commands dict in `main()`:

```python
def main():
    config = Config()
    parser = build_parser(config)
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
        "import": cmd_import,
    }

    if args.command == "config":
        cmd_config(args, config)
    else:
        commands[args.command](args)
```

### Expected output

Generate a sample data file:

```bash
python -c "
import json, random
titles = ['Review PR', 'Write docs', 'Fix bug', 'Deploy', 'Refactor']
priorities = ['low', 'medium', 'high']
categories = ['work', 'personal']
tasks = [{'title': random.choice(titles), 'priority': random.choice(priorities), 'category': random.choice(categories)} for _ in range(40)]
with open('sample_tasks.json', 'w') as f:
    json.dump(tasks, f, indent=2)
print('Created sample_tasks.json with 40 tasks')
"
```

Import with a progress bar:

```bash
python task.py import sample_tasks.json
```

```
  Importing 40 tasks from sample_tasks.json...
  Importing: [##########################------] 34/40
```

(The bar animates as it fills.)

```
  Importing: [##############################] 40/40
  Done! imported 40/40 tasks.
```

Dry run shows what would happen without saving:

```bash
python task.py import sample_tasks.json --dry-run
```

```
  Importing 40 tasks from sample_tasks.json...
  Importing: [##############################] 40/40
  Done! would import 40/40 tasks.
```

Tasks with invalid data are skipped with a warning:

```bash
python -c "
import json
bad = [{'title': '', 'priority': 'high'}, {'title': 'Good task', 'priority': 'low'}]
with open('bad_tasks.json', 'w') as f:
    json.dump(bad, f)
"
python task.py import bad_tasks.json
```

```
  Importing 2 tasks from bad_tasks.json...
  Skipped: ? — Title cannot be empty or whitespace.
  Importing: [##########################------] 2/2
  Done! imported 1/2 tasks.
```

### Troubleshooting

**Progress bar does not animate.** `sys.stdout.write("\r...")` only works if stdout is a terminal. If you are running in an IDE output panel or piping to a file, the `\r` character is treated as a literal and the bar appears on separate lines. Run from a real terminal.

**Progress bar text overlaps previous output.** If you print something after calling `update()` but before `finish()`, the progress bar line gets mixed with new output. Always call `finish()` before printing anything else.

**Import is too fast to see the progress bar.** For small files, the import finishes instantly. To see the bar animate for testing, add `time.sleep(0.02)` inside the import loop. Do not leave the sleep in production code.

**The progress bar counts are off.** The `min()` in `update()` prevents the bar from exceeding 100%. If the count is wrong, check that `len(new_tasks)` matches the number of items in the loop.

### Checklist

- `python task.py import sample_tasks.json` shows an animated progress bar that fills from left to right.
- The bar reaches `[##############################]` at completion.
- `--dry-run` imports without saving to `tasks.json`.
- Invalid tasks in the import file are skipped with a warning, and the count reflects only valid imports.
- The progress bar does not leave orphaned `\r` characters or extra newlines.
- `python task.py import nonexistent.json` produces a clear file-not-found error.

### Socratic question

Why does the progress bar use `\r` (carriage return) instead of printing a new line for each update? What would the output look like if it printed 40 separate lines instead of overwriting one?

## Challenges

<details>
<summary><strong>Challenge 1: Mark tasks as done</strong></summary>

Add a `done` subcommand that takes a task index and marks it as complete. Update `cmd_list` to show a checkmark or strikethrough for done tasks. Handle edge cases: already-done tasks, invalid indices.

</details>

<details>
<summary><strong>Challenge 2: Due dates and overdue detection</strong></summary>

Add a `--due` flag to the `add` subcommand that accepts a date string (YYYY-MM-DD). When listing tasks, highlight overdue tasks in red and tasks due today in yellow. Use `datetime.strptime` to parse dates and compare against today.

</details>

<details>
<summary><strong>Challenge 3: Colored help output</strong></summary>

Override `argparse`'s default help formatter to produce colored help text. Subcommands should appear in cyan, optional flags in yellow, and descriptions in the default color. This requires writing a custom `argparse.HelpFormatter` subclass.

</details>

## Stretch goals

- [ ] Add a `stats` subcommand that shows task counts by priority and category.
- [ ] Implement task editing: `task edit 3 --title "New title" --priority low`.
- [ ] Build a `task export --format csv` command that writes tasks to a CSV file.
- [ ] Add shell completion generation for bash and zsh.
- [ ] Implement a `task log` command that shows a history of add/remove operations.

## What you just built

A reusable CLI framework in pure Python: subcommand routing with `argparse`, colored terminal output using ANSI codes, input validation with clear error messages, JSON configuration file support, and a progress bar for bulk operations. Every piece uses only the standard library — no Click, no Typer, no third-party dependencies.

The patterns here scale directly to production tools. `argparse` subcommands are how `pip`, `git`, and `docker` structure their CLIs. Input validation at the boundary prevents bad data from reaching your storage layer. Configuration files separate user preferences from code. Progress indicators turn opaque operations into transparent ones. Understanding these building blocks means you can build any CLI tool — and know *why* each part exists.

## Where to go from here

- **Switch to Click or Typer.** Now that you understand the raw mechanics, explore how higher-level frameworks automate argument parsing, validation, and help generation. You will appreciate what they do because you have built it by hand.
- **Add a database backend.** Replace the JSON file with SQLite for concurrent access, queries, and better performance on large task lists.
- **Build a plugin system.** Load additional subcommands from Python files in a `plugins/` directory, similar to the original version of this project.
- **Add interactive mode.** A `task interactive` command that reads commands in a loop — like a REPL — without re-launching the process each time.
- **Write tests.** Use `unittest` or `pytest` to test each subcommand by calling the handler functions directly with mocked `argparse` namespaces.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser.
