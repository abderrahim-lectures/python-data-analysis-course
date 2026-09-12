---
title: "Build a Task Manager CLI"
description: "Manage tasks from the terminal with priorities, deadlines, project grouping, and a kanban-style board, all persisted to a JSON file with the standard library."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["cli", "json", "productivity"]
learningObjectives:
  - Model a task with a dataclass and persist it to JSON
  - Add tasks with priority, project, and deadline fields
  - "List and filter tasks by project"
  - Mark tasks complete and detect overdue deadlines
  - Render tasks as a board grouped by status
prerequisites:
  - "Python basics (functions, lists, dictionaries)"
  - "Comfort with sys.argv and running scripts from a terminal"
  - "Optional: a light touch of datetime and date"
---

# 🛠️ 🗂️ Build a Task Manager CLI

A task that lives nowhere doesn't get done. This project builds the smallest genuinely useful task manager: a command-line tool that stores tasks in a JSON file, lets you add them with a priority, a project, and a deadline, list and filter them, mark them done, and render the whole backlog as a kanban-style board right in the terminal. It's pure standard library, you'll learn dataclasses, JSON persistence, and a little date math, and end up with a tool you'll actually run daily.

This assumes Python 101 and comfort running scripts from a terminal, nothing beyond that is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Model a task as a dataclass and save tasks to a JSON file.
2. Add tasks with priority, project, and deadline.
3. List tasks and filter them by project.
4. Mark tasks done and flag overdue deadlines.
5. Render the backlog as a kanban-style board by status.

## Where to run this

**Locally with `uv`** is the primary, and honestly, the only *real*, path for this one. A task manager's whole purpose is surviving between terminal sessions, and that means writing `tasks.json` to a disk you keep. Run it there so your tasks persist.

**Google Colab, Kaggle Notebooks, and Binder** can each run the code cells perfectly well, they all have Python and the standard library. The honest caveat is that a notebook's filesystem is ephemeral: your `tasks.json` may not survive across sessions, so treat those paths as "see the logic run once" rather than "keep my real tasks". Use the badges to try the code, and switch to local `uv` for the tool you actually rely on.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/task-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/task-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftask-manager%2Fnotebook.ipynb)

## Setup

Create the project. This tool uses only the standard library, so there is nothing to install.

```bash
uv init task-manager
cd task-manager
```

```bash
uv run python -c "import json; from pathlib import Path; print('ok')"
```

`json` is your entire database layer, your tasks will live in a human-readable `tasks.json` file in the project folder. `pathlib.Path` gives you a clean, cross-platform way to check whether that file exists yet.

**✅ Checklist**

- ✅ `uv init task-manager` created a folder with a `pyproject.toml`.
- ✅ `uv run python -c "import json; from pathlib import Path"` prints `ok`, zero packages added.

## Step 1: Model a task and persist it to JSON

Every command in this tool, add, list, complete, board, reads from and writes to the same store. First you need a shape for a task, and a pair of functions that save and load a list of tasks.

### 1.1 Create the `Task` dataclass and the JSON store

**👟 Starter hint:** Define a `Task` dataclass with the fields you'll need (id, title, project, priority, deadline, done), then write `load_tasks`/`save_tasks` around a `tasks.json` file.

```python
# tasks.py
import json
from dataclasses import dataclass, asdict
from pathlib import Path

DB = "tasks.json"

@dataclass
class Task:
    id: int
    title: str
    project: str = "Inbox"
    priority: str = "medium"
    deadline: str = ""
    done: bool = False

def load_tasks() -> list[Task]:
    """Load all tasks from tasks.json, or [] if the file doesn't exist yet."""
    if not Path(DB).exists():
        return []
    with open(DB) as f:
        return [Task(**row) for row in json.load(f)]

def save_tasks(tasks: list[Task]) -> None:
    """Write the task list to tasks.json."""
    with open(DB, "w") as f:
        json.dump([asdict(t) for t in tasks], f, indent=2)

print(load_tasks())
```

`@dataclass` writes the `__init__`, `__repr__`, and equality methods for you, you describe the fields once and get a real object. The persistence pair is the whole storage layer: `asdict(t)` turns each `Task` into a plain dictionary JSON can understand, `json.dump(..., indent=2)` writes a readable file, and on the way back in, `Task(**row)` unpacks each saved dictionary back into a `Task`. The `if not Path(DB).exists()` guard is what makes the *first* run safe: no file yet means no tasks, not an error.

**🎯 Expected output:** `[]` on a fresh project, an empty task list, no crash.

**🩹 If it's off:** If you get a `FileNotFoundError`, the `exists()` guard is missing. If save output is one giant unreadable line, `indent=2` is missing from `json.dump`. If `Task(**row)` raises `TypeError: unexpected keyword argument`, the saved dict has a key the dataclass doesn't, check the fields are spelled the same on both sides.

### 1.2 Verify the store

**✅ Checklist**

- ✅ `uv run python tasks.py` prints `[]` on a fresh run.
- ✅ `save_tasks([Task(id=1, title="hi")])` then `load_tasks()` round-trips the task intact.
- ✅ You can explain what `asdict(t)` is for, in your own words.

**🤔 Socratic Question(s)**

- After `save_tasks`, the task data exists as literal text you could open in any editor. What does that give you that a `pickle`-based save wouldn't, and what does it cost in speed?
- `Task(**row)` unpacks a dictionary into keyword arguments. What breaks if a saved `tasks.json` is missing the `done` field on one row, given `done` has a default but `id` and `title` don't?

## Step 2: Add tasks with priority, project, and deadline

With a working store, you can start filling it. This step adds the `add` command: it hands each new task a fresh id, slots it into the list, saves, and tells you what happened.

### 2.1 Write the `add_task` command and a helper id generator

**👟 Starter hint:** Compute the next id from the biggest id already present (defaulting to 0 on an empty list), build a `Task`, append, save, and print a confirmation.

```python
# tasks.py (continued)
def next_id(tasks: list[Task]) -> int:
    return max((t.id for t in tasks), default=0) + 1

def add_task(tasks: list[Task], title: str,
             project: str = "Inbox", priority: str = "medium",
             deadline: str = "") -> None:
    task = Task(id=next_id(tasks), title=title,
                project=project, priority=priority, deadline=deadline)
    tasks.append(task)
    save_tasks(tasks)
    print(f"Added #{task.id}: {task.title} [{task.priority}] ({task.project})")

add_task(load_tasks(), "Review pull requests", project="Work", priority="high")
add_task(load_tasks(), "Buy groceries", project="Home", deadline="2026-09-10")
```

Two details make this safe rather than cute. `max((t.id for t in tasks), default=0)` satisfies two cases at once, an empty list has no ids, so `default=0` makes the first task `#1`, and recomputing from the stored list means the id can never collide with one you already saved. Appending *before* you save is intentional: if anything in that list changes across a session, only the final written state matters.

**🎯 Expected output:** On first run, `Added #1: Review pull requests [high] (Work)` and `Added #2: Buy groceries [medium] (Home)`.

**🩹 If it's off:** If both tasks print as `#1`, `next_id` isn't recomputing against the *saved* list, check each `add_task` call loads fresh tasks rather than reusing the same list object. If ids jump to large numbers, the empty-list `default=0` is missing. If priorities never appear in the confirmation, the f-string has `task.priority` swapped for `priority`.

### 2.2 Verify `add`

**✅ Checklist**

- ✅ Running the two `add_task` calls twice in a row produces ids `1, 2`, then `3, 4`, no collisions.
- ✅ `tasks.json` now contains two readable task objects.
- ✅ Empty project and deadline fall back to `"Inbox"` and `""` without error.

**🤔 Socratic Question(s)**

- The `priority` argument has a default, so a user who forgets to pass it gets `"medium"` silently. Is that a friendly default or a data-quality trap, and what would you add to keep bad priorities out of the file?
- A deadline is stored as a plain string. When do you think that string will stop being enough (hint: think about Step 4), and what type would you use instead?

## Step 3: List and filter tasks by project

Adding tasks is useless if you can't see them. This step adds listing, sorted by priority so the important stuff surfaces, and a `project` filter so each project is its own clear view.

### 3.1 Write the listing and filtering command

**👟 Starter hint:** Sort the loaded tasks by a priority order you define, then optionally narrow to a single project before printing each row.

```python
# tasks.py (continued)
PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}

def list_tasks(tasks: list[Task], project: str | None = None) -> None:
    items = tasks if project is None else [t for t in tasks if t.project == project]
    items.sort(key=lambda t: (PRIORITY_ORDER[t.priority], t.id))
    if not items:
        print("Nothing here yet.")
        return
    for t in items:
        flag = "[x]" if t.done else "[ ]"
        print(f"{t.id:>3} {flag} {t.priority:<6} {t.project:<8} {t.title}")

print("-- all --")
list_tasks(load_tasks())
print("-- Home only --")
list_tasks(load_tasks(), project="Home")
```

The sort key `(PRIORITY_ORDER[t.priority], t.id)` is doing two jobs: primary sort by the numeric priority map (so `high` comes before `medium`, alphabetical order would get this backwards), and a stable secondary sort by id so tasks with equal priority keep insertion order. The `[x]`/`[ ]` flag is a board-style done marker you'll build on in Step 5. Filtering with a list comprehension keeps the print loop simple, one code path, two inputs.

**🎯 Expected output:** "all" shows both tasks with `#1 Review pull requests [high]` above `#2 Buy groceries [medium]`; "Home only" shows just the groceries task.

**🩹 If it's off:** If `low` sorts above `high`, the sort key is using the raw string instead of `PRIORITY_ORDER`. If "Home only" prints the Work task too, the comprehension compares `t.project == project` but project values have trailing spaces. If  `t.priority:<6` looks ragged, the format spec width is missing.

### 3.2 Verify listing and filtering

**✅ Checklist**

- ✅ `list_tasks` sorts high-priority tasks first across all projects.
- ✅ Passing `project="Home"` shows only Home tasks.
- ✅ An empty result prints `Nothing here yet.` instead of an empty heading.

**🤔 Socratic Question(s)**

- The sort is *stable* on id once priority is equal. Why does relying on stable sort matter for insertion order, and where would an unstable sort visibly surprise a user?
- Filtering happens before sorting. Would it ever be correct to sort first and filter after, and what would the output order imply about how the tool "reads" your projects?

## Step 4: Complete tasks and flag overdue deadlines

A task manager that only adds and lists is just a shelf. This step adds `done`, actually completing a task, plus the date math that flags deadlines that have slipped.

### 4.1 Write `complete_task` and the overdue check

**👟 Starter hint:** Find the task by id, flip its `done` flag, save, and confirm. Then add `is_overdue`, which returns `False` for done tasks and deadline-free tasks and compares a real parsed date to today's.

```python
# tasks.py (continued)
from datetime import date, datetime

def complete_task(tasks: list[Task], task_id: int) -> None:
    for t in tasks:
        if t.id == task_id:
            t.done = True
            save_tasks(tasks)
            print(f"Completed #{task_id}: {t.title}")
            return
    print(f"No task with id {task_id}.")

def is_overdue(t: Task) -> bool:
    if t.done or not t.deadline:
        return False
    deadline = datetime.strptime(t.deadline, "%Y-%m-%d").date()
    return deadline < date.today()

tasks = load_tasks()
complete_task(tasks, 2)
for t in tasks:
    status = "OVERDUE" if is_overdue(t) else ("done" if t.done else "open")
    print(f"#{t.id} {t.title}: {status}")
```

`complete_task` is deliberately linear, scan for the id, mutate in place, save once, return. The early `return` inside the loop is the whole success path: it both prevents double-saving and lets the trailing `print` serve as the "not found" branch. `is_overdue` makes two deliberate guard decisions first: a done task can't be overdue, and a task with no deadline can't be overdue, both are *absence of scheduling*, not schedule failures. `strptime` converting the stored string into a real `date` is what makes `<` comparison possible at all.

**🎯 Expected output:** `Completed #2: Buy groceries`; the loop prints `#1 Review pull requests: open` and `#2 Buy groceries: done`, plus `OVERDUE` for any task whose deadline predates today.

**🩹 If it's off:** If `strptime` raises `ValueError`, a stored deadline isn't in `%Y-%m-%d` form (e.g. `"2026/09/10"`), that's the string-deadline trap from Step 2. If *every* task reads OVERDUE, `is_overdue` is comparing a `datetime` to a `date` or missing the `not t.deadline` guard so empty strings parse and fail. If completing one task marks several done, the loop mutates the wrong comparision, ids must compare exactly.

### 4.2 Verify completion and overdue logic

**✅ Checklist**

- ✅ Completing a real id flips `done` to `true` in `tasks.json`.
- ✅ Completing a nonexistent id prints `No task with id …` and writes nothing.
- ✅ A task with a past deadline and `done=False` reports `OVERDUE`; the same task marked done does not.

**🤔 Socratic Question(s)**

- `is_overdue` ignores a deadline that is *today*, only `< today` counts. A task due today looks exactly like a task due next week in this output. What would you print instead to make "due today" a distinct, urgent state?
- The deadline is compared against your machine's `date.today()`. In what real scenario is the machine's clock the *wrong* clock, and how would time zones change what "overdue" means?

## Step 5: Render a kanban-style board

The board is the payoff, the daily view a kanban user actually looks at. It groups the backlog into status columns, flags the urgent bits, and doubles as the tool's main command.

### 5.1 Write the board and a tiny command router

**👟 Starter hint:** Partition tasks into "To do" and "Done" columns, mark overdue items in the To-do column, and build a `main` that routes `add` / `done` / `board` from `sys.argv`.

```python
# tasks.py (continued)
import sys

def show_board(tasks: list[Task]) -> None:
    todo = [t for t in tasks if not t.done]
    done = [t for t in tasks if t.done]

    print("┌─ TO DO ─────────────────────────────┐")
    for t in sorted(todo, key=lambda t: (is_overdue(t) is not True,
                                         PRIORITY_ORDER[t.priority], t.id)):
        flag = "OVERDUE!" if is_overdue(t) else "        "
        print(f"  {t.id:>2} {flag} {t.title}")
    if not todo:
        print("  (nothing to do)")

    print("┌─ DONE ──────────────────────────────┐")
    for t in done:
        print(f"  {t.id:>2}  [x] {t.title}")

def main() -> None:
    args = sys.argv[1:]
    if not args or args[0] == "board":
        show_board(load_tasks())
    elif args[0] == "add":
        title = " ".join(args[1:])
        add_task(load_tasks(), title)
    elif args[0] == "done":
        complete_task(load_tasks(), int(args[1]))
    else:
        print("Commands: board | add <title> | done <id>")

if __name__ == "__main__":
    main()
```

The sort key in `show_board` is the interesting line: `(is_overdue(t) is not True, PRIORITY_ORDER[t.priority], t.id)` puts `False` before `True` in a boolean sort, so *not*-overdue tasks sort first and `OVERDUE!` tasks float to the top of the column, ahead even of high priority. Rendering the board as box-drawing text is pure presentation, but the partition (`todo`/`done`) reuses the same `done` flag Step 4 mutated, so the board *is* the data. The `main` router keeps each command one line tall so the tool reads like a tiny application rather than a script.

**🎯 Expected output:** `uv run python tasks.py` prints a two-column board: overdue tasks first in TO DO with an `OVERDUE!` marker, done tasks under DONE. `board`, `add`, and `done` all work from the terminal.

**🩹 If it's off:** If sort errors mention sorting `bool` against `int`, the key tuple is assembled wrong, `is_overdue(t) is not True` must stay a bool. If the router never reaches `done`, `sys.argv[1]` was consumed by `args[0] == "add"` matching an empty title. If the board looks mangled in some terminals, the box-drawing `┌─` characters aren't rendering, plain `==` lines are the portable fallback.

### 5.2 Verify the app end to end

**✅ Checklist**

- ✅ `uv run python tasks.py board` (or no argument) renders the two-column board.
- ✅ `uv run python tasks.py add "Ship v1"`, `done 3`, and `board` round-trip through `tasks.json`.
- ✅ Overdue tasks appear at the top of TO DO with the marker.
- ✅ You've used the tool on at least your own real tasks once.

**🤔 Socratic Question(s)**

- The board has exactly two columns because a `Task` stores only a `done` boolean. What single field would add a third "In progress" column, and what workflow change would that suggest to users?
- `show_board` calls `is_overdue` three times per to-do task. For a few dozen tasks that's nothing, at what scale would you cache that result, and how would you cache it *right* (so it recomputes when a task completes)?

## ⚠️ Common pitfalls

- **Read once, use the same list for everything.** Calling `add_task(load_tasks(), …)` twice in one session, reuse the same loaded list object for both calls, and the second save clobbers the first's new work. Fix: reload (or re-save) at each command boundary, exactly like `main` does.
- **Deadlines as free-form strings.** `"9/10/2026"` and `"next week"` both parse into a `ValueError` in Step 4's `strptime`. Fix: accept one canonical `%Y-%m-%d` format and reject anything else at add-time.
- **Deleting the file between runs.** A task manager that crashes on a missing `tasks.json` is broken on its first boot. The `exists()` guard in `load_tasks` is what makes an empty file an empty list.
- **Ids guessed instead of derived.** Hardcoding `id=1` guarantees a collision the second time you add. Derive from `max(..., default=0) + 1` so the store is the single source of truth.
- **Sorting priority alphabetically.** `"high"` sorts *before* `"medium"` as text but a `low` fix sorts after both, the wrong order for a to-do list. Always sort through an explicit `PRIORITY_ORDER` map.

## What you just built

A real, working task manager that survives restarts: dataclass modeling, JSON persistence, priority-sorted listing, project filters, completion, overdue detection, and a kanban board render, the entire app in one standard-library script you'll genuinely run. The transferable skill is *persistence*: the load/modify/save trio behind `tasks.json` is the same shape behind your future config files, note apps, and any "make my changes survive a restart" feature.

:::tip[Run a fuller version without any local setup]
[`examples/task-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/task-manager) in the course repo is a fuller version of the code above, with edit and delete commands and a richer board. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add `rm <id>` and `edit <id>` commands with the same load/save pattern, removal is just a list filter and a save.
- Show "due today" separately from OVERDUE by printing the actual date, not just the flag.
- Sort each column by *deadline* too, so a high-priority task that's overdue and a medium one due tomorrow order themselves by time pressure.
- Add a `--due` view that prints only unfinished tasks with deadlines, the go-to morning filter once you have real tasks in the file.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓