---
title: "Build a Grant Application Tracker"
description: "Manage grant applications end to end: model them as nested dictionaries, guard budgets, watch deadlines with datetime, persist everything to JSON and CSV, and drive the whole thing from a menu-driven CLI."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["data-management", "csv", "datetime", "json", "cli"]
learningObjectives:
  - Model real-world entities with nested dictionaries and lists
  - Parse, compare, and format dates for deadline tracking
  - Persist and reload structured data with JSON and CSV
  - Build a menu-driven CLI application with input validation
prerequisites:
  - "Python basics (variables, loops, functions)"
  - "Dictionaries and lists"
---

# 🛠️ 💰 Build a Grant Application Tracker

Research offices juggle dozens of proposals at once, each with a funder, a hard deadline, a budget, a team, and a trail of expenses. This project builds a command-line grant tracker that models each application as a nested dictionary, watches spending against its budget, sorts upcoming deadlines, and saves everything to disk so your work survives between sessions.

This assumes Python 101 and comfort with dictionaries and lists — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Model a grant application as a nested dictionary holding a team, a budget, and an expense ledger.
2. Add expenses with validation so a proposal can never silently overspend its budget.
3. Build a deadline dashboard that flags overdue and soon-due applications, sorted by urgency.
4. Persist everything to JSON and export a CSV someone can open in a spreadsheet.
5. Drive the whole thing from an interactive, menu-driven CLI that survives wrong input.

## Where to run this

**Locally with `uv`** is the primary path — but unlike most projects in this series, this one has zero external dependencies: everything uses the standard library (`datetime`, `json`, `csv`, `os`). That makes it one of the friendliest projects for trying the course's local workflow for real: a real project folder, a real script, and real files written to disk every run.

**Google Colab, Binder, and Kaggle Notebooks** run it comfortably too — the notebook mirrors every step below, and because there's no package install needed, the browser path is full-fidelity rather than a downgraded simulation. **JupyterLite**, the in-browser playground, will run the data-model and dashboard steps as well, since nothing here needs native libraries. One honest caveat: the JSON file you save lives on the notebook's ephemeral filesystem in the browser, so treat it as a try-it path and use a local folder when you want the data to actually persist across real sessions.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/grant-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/grant-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgrant-tracker%2Fnotebook.ipynb)

## Setup

Create the project folder. There is no dependency to install — every module this project uses ships with Python.

```bash
uv init grant-tracker
cd grant-tracker
```

```bash
uv run python --version
```

Every module this project uses — `datetime`, `json`, `csv`, `os` — is part of the standard library, so there's no `uv add` step and no `requirements.txt` to get wrong. That's a deliberate feature: the exact same `grant_tracker.py` runs in your terminal, in the course notebook, and in the browser, because none of it needs a native package.

**✅ Checklist**

- ✅ `uv run python --version` prints Python 3.9 or newer (the code uses `list[str]` type hints).
- ✅ `grant-tracker/` exists and `uv init grant-tracker` finished without errors.
- ✅ `uv run python -c "import json, csv, datetime, os"` exits silently — the whole toolchain is present.

## Step 1: Model a grant as a nested dictionary

A grant application is more than a flat row of fields: it has a budget, a team of people, and a growing list of expenses. The natural Python shape for that is a **nested dictionary** — a `dict` whose values are themselves lists and strings — because it lets you carry a whole application around as a single object, pass it to functions, and persist it directly to JSON later.

### 1.1 Write the grant factory

**👟 Starter hint:** Write one function that returns a fully-formed grant dictionary, so every grant you ever create has the same keys from the start — consistency beats convenience when you'll later loop over hundreds of these.

```python
# grant_tracker.py
from datetime import datetime

def create_grant(
    title: str,
    funder: str,
    deadline: str,
    total_budget: float,
    team: list[str] | None = None,
) -> dict:
    """Create a new grant application record."""
    return {
        "id": datetime.now().strftime("%Y%m%d%H%M%S"),
        "title": title,
        "funder": funder,
        "deadline": deadline,
        "total_budget": total_budget,
        "spent": 0.0,
        "team": team or [],
        "status": "draft",
        "created": datetime.now().isoformat(),
        "expenses": [],
    }

grant = create_grant(
    "NSF Career Development",
    "National Science Foundation",
    "2026-10-15",
    500000.00,
    ["Alice", "Bob"],
)
print(grant)
```

The two lines that carry the design are `"team": team or []` and `"expenses": []`. `team or []` collapses both `None` and an empty list into the same safe starting state, so callers can pass nothing and still get a list — never a `None` to trip over later. And `"expenses": []` starts an empty ledger that Step 2 will append to; keeping it inside the grant dict, rather than in a parallel global list, is what makes each grant self-contained.

**🎯 Expected output:** One dictionary whose `id` and `created` match the current time, with `spent: 0.0`, `status: "draft"`, `team: ["Alice", "Bob"]`, and `expenses: []`.

**🩹 If it's off:** If `team` shows `[]` when you passed `["Alice", "Bob"]`, you're probably printing the wrong variable — `create_grant` *returns* a new dict, so reassign the result (`grant = create_grant(...)`) instead of printing a dict you stored under another name. If `NameError: name 'datetime' is not defined`, the `from datetime import datetime` line is missing or sits below the function. If the `list[str]` hint itself errors, you're on Python older than 3.9 — jump to the version checkpoint in Setup.

### 1.2 Create the portfolio you'll track

**👟 Starter hint:** Create three grants with different funders, budgets, and deadlines — including one deadline within the next 30 days, so the dashboard in Step 3 has real variety.

```python
# grant_tracker.py (continued)
grants = [
    create_grant("NSF Career Development", "National Science Foundation", "2026-10-15", 500000.00, ["Alice", "Bob"]),
    create_grant("NIH R01 Proposal", "National Institutes of Health", "2026-11-01", 350000.00, ["Carol"]),
    create_grant("Local Community Grant", "City Foundation", "2026-09-30", 25000.00, ["Bob", "Carol"]),
]

for g in grants:
    print(f"{g['title']:28} {g['funder']:28} {g['deadline']}  ${g['total_budget']:>12,.2f}")
```

A list of dicts is the basic unit every later function will take: sorting it, filtering it, saving it. The f-string width specifiers (`:28`, `:>12`) pad each value so the columns line up — a tiny formatting trick that turns raw dicts into something readable at a glance, without any reporting library.

**🎯 Expected output:** Three aligned lines, one per grant, showing title, funder, deadline, and a formatted budget — for example `Local Community Grant      City Foundation          2026-09-30  $    25,000.00`.

**🩹 If it's off:** If columns run together, your width numbers are smaller than the longest value — bump `:28` up. If you see oddly spaced but numerically correct budgets, that's the `,` thousands separator plus field width doing its job; adjust the width, not the format spec.

### 1.3 Verify the data model

**✅ Checklist**

- ✅ `create_grant(...)` returns a dict with every expected key: `id`, `title`, `funder`, `deadline`, `total_budget`, `spent`, `team`, `status`, `created`, `expenses`.
- ✅ Calling it without a `team` argument produces `team: []`, never `None`.
- ✅ `grants` is a list of three dicts and the loop prints three aligned rows.

**🤔 Socratic Question(s)**

- `team or []` treats `None` and `[]` identically — but what would it do if someone passed the *string* `"Bob"` as the team instead of a list? Why is that a recipe for a confusing bug later, and what one check inside `create_grant` would catch it?
- The deadline is stored as the string `"2026-10-15"`, not a `datetime` object. What breaks the moment you try to store an actual `datetime` in a JSON file — and why, then, is a plain ISO string the more honest representation here?

## Step 2: Guard the budget while tracking expenses

A grant's budget is a hard constraint: spending is only legitimate while it stays inside `total_budget`. This step builds an expense ledger that enforces that rule at the moment of insertion, so an overspend becomes a loud, immediate error instead of a quiet negative number in a report months later.

### 2.1 Record an expense with validation

**👟 Starter hint:** One function, three jobs: check the amount is positive, check it fits in the remaining budget, and only then append it to the grant's ledger and update `spent`.

```python
# grant_tracker.py (continued)
def add_expense(grant: dict, description: str, amount: float, phase: str) -> dict:
    """Record an expense against a grant."""
    if amount <= 0:
        raise ValueError("Expense amount must be positive")
    if amount > grant["total_budget"] - grant["spent"]:
        raise ValueError("Expense exceeds remaining budget")

    expense = {
        "date": datetime.now().isoformat(),
        "description": description,
        "amount": amount,
        "phase": phase,
    }
    grant["expenses"].append(expense)
    grant["spent"] = round(grant["spent"] + amount, 2)
    return expense

expense = add_expense(grant, "Statistician consultation", 4500.00, "writing")
print(grant["spent"])
print(grant["expenses"][-1]["description"])
```

The validation happens **before** any mutation: both `if` checks raise before a single field changes, so a rejected expense can't corrupt the grant's `spent` total. That ordering — check everything, then mutate — is the same discipline you'll see in bank-ledger code and database transactions. The `round(..., 2)` keeps float arithmetic (which accumulates tiny errors like `0.1 + 0.2`) from drifting into cents over hundreds of entries.

**🎯 Expected output:** Prints `4500.0`, then `Statistician consultation`. Calling `add_expense(grant, "Over", 999999, "writing")` raises `ValueError: Expense exceeds remaining budget` and leaves `spent` untouched.

**🩹 If it's off:** If an oversized expense *adds* to `spent` instead of raising, the second `if` is missing or the raise happens after the mutation. If you see `4500.0` where you expected `4500.00`, that's float display, not a bug — print `f"{grant['spent']:.2f}"`. If you get `KeyError: 'spent'`, the dict you're passing wasn't built by `create_grant` (Step 1), so its keys don't match.

### 2.2 Summarize the budget state

**👟 Starter hint:** Write a *pure* function that reads a grant and returns its budget snapshot — total, spent, remaining, percent used — so every later screen shows identical numbers.

```python
# grant_tracker.py (continued)
def budget_summary(grant: dict) -> dict:
    """Return a budget summary for a single grant."""
    remaining = round(grant["total_budget"] - grant["spent"], 2)
    pct_used = 0.0
    if grant["total_budget"] > 0:
        pct_used = round((grant["spent"] / grant["total_budget"]) * 100, 1)
    return {
        "title": grant["title"],
        "total": grant["total_budget"],
        "spent": grant["spent"],
        "remaining": remaining,
        "percent_used": pct_used,
    }

print(budget_summary(grant))
```

Pure functions — input in, derived numbers out, no state touched — are the heart of a maintainable data script. `budget_summary` doesn't change the budget; it reports it, which is why Step 3 can call it inside a loop without side effects. The explicit `if grant["total_budget"] > 0` guard, instead of dividing blindly, handles the still-being-written proposal with a budget of zero so you get `0.0` rather than a `ZeroDivisionError`.

**🎯 Expected output:** A dict like `{'title': 'NSF Career Development', 'total': 500000.0, 'spent': 4500.0, 'remaining': 495500.0, 'percent_used': 0.9}`.

**🩹 If it's off:** If you hit `ZeroDivisionError`, the total-budget guard is missing. If `percent_used` is a long float like `0.8999999...`, the `round` is missing from the division line — apply `round(x, 1)` to the final percentage.

### 2.3 Verify the budget guard

**✅ Checklist**

- ✅ A valid expense appends to `grant["expenses"]` and bumps `grant["spent"]`.
- ✅ An amount of `0`, a negative amount, or one larger than the remaining budget raises a `ValueError`, and `spent` is unchanged afterward.
- ✅ `budget_summary(grant)` returns `total`, `spent`, `remaining`, and `percent_used`, and never divides by zero.

**🤔 Socratic Question(s)**

- The overspend check uses `amount > grant["total_budget"] - grant["spent"]`. What would happen if you moved the `round(...)` into that subtraction rather than the update — could a sequence of small valid expenses ever *appear* overspent? (Try `0.1 + 0.2` in a REPL to see why this is a real question.)
- A refund is economically a negative expense. Should `add_expense` accept negative amounts, or would allowing them weaken the guard? What would the call site need to distinguish a legitimate refund from a typo?

## Step 3: Build the deadline dashboard

Deadlines are the thing that actually decides who gets funded. This step turns the raw ISO date strings into time-based decisions: how many days until each deadline, which grants are already overdue, and what order you should work in.

### 3.1 Compute days until each deadline

**👟 Starter hint:** Parse each deadline with `datetime.fromisoformat`, subtract *today*, attach a human-ready `status` label, then sort the whole list by urgency.

```python
# grant_tracker.py (continued)
from datetime import timedelta

def upcoming_deadlines(grants: list[dict], days_ahead: int = 30) -> list[dict]:
    """Return grants with deadlines within the next N days, sorted soonest first."""
    today = datetime.now()
    cutoff = today + timedelta(days=days_ahead)

    results = []
    for grant in grants:
        deadline = datetime.fromisoformat(grant["deadline"])
        days_left = (deadline - today).days
        results.append({
            "title": grant["title"],
            "funder": grant["funder"],
            "deadline": grant["deadline"],
            "days_left": days_left,
            "status": "OVERDUE" if days_left < 0 else f"{days_left} days left",
            "budget_status": budget_summary(grant),
        })

    results.sort(key=lambda g: g["days_left"])
    return results

for item in upcoming_deadlines(grants):
    print(f"{item['status']:>16}  {item['title']}  ({item['budget_status']['percent_used']}% used)")
```

`datetime.fromisoformat` parses the ISO string back into a real `datetime` so subtraction is meaningful: `(deadline - today).days` yields a plain integer, negative when overdue and positive when upcoming. Sorting on `days_left` orders the list from most-overdue to furthest-away in one line, because the sort key already encodes urgency. Nesting `budget_status` inside each item is the payoff of Step 2's pure function: one call, and the dashboard gets budget context for free.

**🎯 Expected output:** Three lines, one per grant, showing `OVERDUE` or `N days left` plus the percent of budget used — with the overdue or most urgent grant first.

**🩹 If it's off:** If you get `ValueError: Invalid isoformat string`, a deadline in your data isn't a clean `YYYY-MM-DD` string — `fromisoformat`'s strictness is exactly why Step 1 stores dates in that one format. If every line shows `0 days left`, you may be comparing a `date` to a `datetime` or parsing at a different midnight — inspect with `print(type(today), type(deadline))`. If ordering looks random, the `key=` sort isn't actually applied to the list you're printing.

### 3.2 Render the dashboard

**👟 Starter hint:** Format the already-computed list as a readable report — a banner, one block per grant, and a heavy `!!!` marker on anything overdue.

```python
# grant_tracker.py (continued)
def print_dashboard(grants: list[dict]) -> None:
    """Display a formatted deadline dashboard."""
    upcoming = upcoming_deadlines(grants)
    print("\n" + "=" * 60)
    print("GRANT DEADLINE DASHBOARD")
    print("=" * 60)
    for item in upcoming:
        marker = "!!!" if item["days_left"] < 0 else "   "
        print(f"{marker} {item['title']}")
        print(f"     Funder: {item['funder']}")
        print(f"     Deadline: {item['deadline']} -- {item['status']}")
        budget = item["budget_status"]
        print(f"     Budget: ${budget['spent']:.2f} / ${budget['total']:.2f} ({budget['percent_used']}% used)")
        print()

print_dashboard(grants)
```

`print_dashboard` has exactly one job — turning already-computed data into readable output — and it deliberately does *no* computation of its own. Splitting "compute" and "display" means you can later swap this text renderer for an HTML page or a chart without touching `upcoming_deadlines` at all.

**🎯 Expected output:** A `GRANT DEADLINE DASHBOARD` banner, then one block per grant sorted by urgency, with `!!!` prefixed to any overdue grant and budget lines like `Budget: $4,500.00 / $500,000.00 (0.9% used)`.

**🩹 If it's off:** If the dashboard prints in creation order, `print_dashboard` is looping over the raw `grants` list instead of calling `upcoming_deadlines`. If `!!!` never appears, no deadline is before today — add a deliberately past-due date to test the marker. If budgets show whole dollars, the `:.2f` specifiers are missing from the budget f-strings.

### 3.3 Verify the dashboard

**✅ Checklist**

- ✅ `upcoming_deadlines(grants)` returns items sorted from most overdue to furthest deadline.
- ✅ An overdue grant shows `OVERDUE` in its `status` and a `!!!` marker in `print_dashboard`.
- ✅ Every dashboard item carries a nested `budget_status` snapshot from Step 2.

**🤔 Socratic Question(s)**

- The dashboard sorts *soonest first*, so the most overdue grant tops the list. For a real research office, is "most overdue first" always the right order — or can you imagine a criterion (budget at risk, funder priority) that should beat it? How would you sort by `days_left` and then a second key?
- `(deadline - today).days` drops time-of-day entirely. If a deadline were `2026-10-15 23:59`, at what moment does `days_left` flip from `0` to `-1`? Is that early warning or late?

## Step 4: Persist to JSON and export to CSV

Right now your grants vanish when the process ends. This step writes them to disk with JSON — the natural format for nested dictionaries — and exports a flattened CSV so anyone with a spreadsheet can work with the same data.

### 4.1 Save and load grants

**👟 Starter hint:** Two small functions, one file, no dependencies: `json.dump` for writing, `json.load` for reading back, and an existence check so a missing file loads as an empty list instead of crashing.

```python
# grant_tracker.py (continued)
import json
import os

DATA_FILE = "grants.json"

def save_grants(grants: list[dict]) -> None:
    """Save all grants to a JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(grants, f, indent=2)
    print(f"Saved {len(grants)} grants to {DATA_FILE}")

def load_grants() -> list[dict]:
    """Load grants from disk, returning an empty list if the file is missing."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)

save_grants(grants)
print(load_grants() == grants)
```

`json.dump(grants, f, indent=2)` writes the nested structure — expenses, teams, budgets — as human-readable text that preserves exactly the shapes `create_grant` produced, because dicts, lists, strings, and floats all have JSON representations. The roundtrip is the real test here: `print(load_grants() == grants)` should be `True`, which proves nothing was lost rewriting data into text and back.

**🎯 Expected output:** Prints `Saved 3 grants to grants.json`, then `True` (the loaded grants equal the originals, dict-for-dict).

**🩹 If it's off:** If the comparison prints `False`, isolate the drift — `load_grants()[0] == grants[0]` tells you whether it's the whole list or one grant. If you get `TypeError: Object of type datetime is not JSON serializable`, a `datetime` object slipped into a grant; JSON can't represent one, which is exactly why Step 1 stores `created` as a string. If the file opens as one long line, `indent=2` was dropped.

### 4.2 Export a spreadsheet-friendly CSV

**👟 Starter hint:** Flatten each nested grant into the six columns a funding office actually wants, and write them with the `csv` module so commas inside values are quoted for you.

```python
# grant_tracker.py (continued)
import csv

def export_grants_csv(grants: list[dict], filepath: str = "grants.csv") -> None:
    """Write grant data to CSV with one row per grant."""
    fieldnames = ["title", "funder", "deadline", "total_budget", "spent", "status"]
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for grant in grants:
            writer.writerow({name: grant.get(name, "") for name in fieldnames})
    print(f"Exported {len(grants)} grants to CSV: {filepath}")

export_grants_csv(grants)
```

CSV is a *flat* format — it can't hold a nested `team` list or an `expenses` ledger in one cell — so exporting is a deliberate simplification: you pick the six scalar columns that survive the flatten. `csv.DictWriter` takes a dict per row and handles quoting itself (a title containing a comma stays one field), which is exactly the class of bug that hand-string-building CSV invites.

**🎯 Expected output:** A `grants.csv` file with a header row plus three data rows, and the printout `Exported 3 grants to CSV: grants.csv`.

**🩹 If it's off:** If the CSV opens as one run-on line, the `open` is missing `newline=""` — a line-ending artifact the `csv` module doesn't fix for you. If columns arrive in the wrong order, `fieldnames` is the ordering authority — reorder it, not the dict. If `writerow` complains about a missing key, a grant dict lacks one of the listed fields; `.get(name, "")` covers exactly that.

### 4.3 Verify persistence and export

**✅ Checklist**

- ✅ `grants.json` exists and its content survives a re-run — `load_grants()` returns the same grants you saved.
- ✅ `grants.csv` opens in a spreadsheet with the expected six columns and one row per grant.
- ✅ `load_grants()` returns `[]` without crashing when the file is absent.

**🤔 Socratic Question(s)**

- The JSON roundtrip proved `load_grants() == grants`, yet the CSV export deliberately throws away the team and the expenses. What is the CSV file usefully doing that JSON can't, and what would you lose if CSV were the only format you kept?
- Versioning thought experiment: six months in, you add a `cost_share` key to `create_grant`. What happens when `load_grants()` reads the old file in which that key doesn't exist at all — and what does that imply about where data migrations should live as a stored schema evolves?

## Step 5: Drive it all from a menu-driven CLI

The functions you've built are a library; a CLI makes them usable by a person. This step wraps them in a loop that shows a menu, reads a choice, validates it, and routes to the right action — the same skeleton behind dozens of real admin tools.

### 5.1 Write the main menu loop

**👟 Starter hint:** Start a `while True` loop, print numbered choices, read input, and dispatch. Always validate before touching any data, and compare choices as strings so a stray `"q"` can't crash anything.

```python
# grant_tracker.py (continued)
grants = load_grants() or grants  # pick up any saves from earlier runs

def menu() -> None:
    while True:
        print("\n--- GRANT TRACKER MENU ---")
        print("1. Show deadline dashboard")
        print("2. Add an expense")
        print("3. Export to CSV")
        print("4. Save")
        print("5. Quit")
        choice = input("> ").strip()

        if choice == "1":
            print_dashboard(grants)
        elif choice == "2":
            title = input("Grant title: ").strip()
            grant = next((g for g in grants if g["title"] == title), None)
            if grant is None:
                print(f"No grant titled '{title}'.")
                continue
            desc = input("Description: ").strip()
            amount = input("Amount: ").strip()
            try:
                add_expense(grant, desc, float(amount), input("Phase: ").strip())
                print("Expense recorded.")
            except ValueError as exc:
                print(f"Invalid: {exc}")
        elif choice == "3":
            export_grants_csv(grants)
        elif choice == "4":
            save_grants(grants)
        elif choice == "5":
            save_grants(grants)
            print("Bye!")
            break
        else:
            print(f"Unknown choice: {choice}")

menu()
```

Three decisions make this loop tolerant of mistakes. Input is read as a **string** and compared to string literals, so stray characters can't crash the type system. `float(amount)` is wrapped in `try/except ValueError`, catching the *expected* failure ("abc" is not a number) and showing the user a message instead of a traceback. And `next((g for g in grants if g["title"] == title), None)` searches the list by a unique field — `title` here, though a production tool would use the grant `id` from Step 1 to survive duplicate names.

**🎯 Expected output:** The menu prints; option `1` shows the Step 3 dashboard, option `2` with a real title and amount records an expense (raising `ValueError` on overspend), option `3` writes `grants.csv`, and `5` saves before exiting.

**🩹 If it's off:** If a non-numeric amount produces a traceback, `try/except ValueError` isn't wrapped around `float(amount)`. If typing `1` does nothing, compare the raw branch — a stray `.rstrip()` may have eaten the digit, or the menu code never got saved. If the menu never shows today's data, the `grants = load_grants() or grants` line isn't above the loop.

### 5.2 Verify the interactive app

**✅ Checklist**

- ✅ Every menu option executes its action: dashboard, expense add, CSV export, save.
- ✅ A bad menu choice prints a friendly message instead of crashing.
- ✅ A bad amount (`"abc"`, negative, over budget) is caught and reported without exiting the loop or corrupting `spent`.
- ✅ Quitting saves the current grants to `grants.json`.

**🤔 Socratic Question(s)**

- Option 5 both saves and breaks. What happens if the user closes the terminal instead of choosing it — and what would a `try/finally` around the loop give you that the happy-path save doesn't?
- The menu validates the *amount* but asks you to type the grant title by hand. If two grants shared a title, what ambiguity does that create, and why would indexing grants by the `id` from `create_grant` be the more robust design?

## ⚠️ Common pitfalls

- **Overspending silently corrupts the ledger.** If validation doesn't live *inside* `add_expense`, a bad entry just makes `remaining` go negative — and the dashboard cheerfully reports `-12.3% used`. Fix: keep both `ValueError` guards before any mutation (Step 2), and treat a negative remaining as a bug, not a report.
- **Inconsistent deadline strings break `fromisoformat`.** One grant stored as `"Oct 15, 2026"` and another as `"2026-10-15"` makes `datetime.fromisoformat` raise on the first. Fix: enforce ISO format at the source — validate the string inside `create_grant` with `datetime.fromisoformat(deadline)`, and only ever write deadlines through that one function.
- **Money as raw floats.** `round(0.1 + 0.2, 2)` is fine for display, but unrounded floats drift over hundreds of expenses. Fix: round at every mutation (as `add_expense` does), keep display formatting (`:.2f`) separate from stored values, and reach for `decimal.Decimal` when cents truly matter.
- **Forgetting to save.** Every menu action mutates the in-memory list; a crash mid-session loses everything since the last `save_grants`. Fix: save after every mutating action (the menu's option 5 does this), and consider saving before accepting an expense.
- **Storing datetimes in JSON.** A `datetime` isn't JSON-serializable (you get a `TypeError` on dump) and stringifies badly on reload. Fix: store ISO strings from the start (Step 1) and parse to `datetime` only inside the functions that need real date math.

## What you just built

A working grant-application tracker: nested dictionaries model each proposal, `add_expense` enforces budget limits at write time, `datetime` turns deadlines into an urgency-sorted dashboard, and JSON plus CSV let the data persist and interoperate. The transferable skill is *data modeling plus persistence discipline*: representing a real-world entity as nested data, guarding its invariants, and moving it between memory and disk — the same shape behind contact books, order systems, and inventory tools.

:::tip[Run a fuller version without any local setup]
[`examples/grant-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/grant-tracker) in the course repo ships the complete script with a status workflow and a team workload report already included. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a **status workflow** so grants move in a legal order — `draft` → `submitted` → `review` → `funded`/`rejected`. A `VALID_TRANSITIONS` dict (one key per status, values = allowed next steps) is the entire spec; the tracker then refuses illegal jumps like a skeptical program officer.
- Build a **team workload report** counting grants and total managed budget per team member — a one-`Counter` addition to Step 2's summary function, and genuinely how an office spots an over-allocated collaborator.
- Send **email reminders** for approaching deadlines with `smtplib` — you already have `upcoming_deadlines()` producing exactly the list a reminder job needs. The tiny hint: `smtplib` needs credentials and a real or test server, so fire it at a local SMTP server first.
- Swap the JSON store for `sqlite3` once queries get complex (filtering by funder plus status). `load_grants` becomes a `SELECT`, and everything downstream — every function above it — stays exactly the same.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to managing data like a research office. 🎓