---
title: "Grant Application Tracker"
description: "Manage grant applications with deadlines, budgets, and collaboration workflows."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["data-management", "csv", "datetime", "json"]
learningObjectives:
  - Model real-world entities with dictionaries and lists
  - Parse and manipulate dates for deadline tracking
  - Read and write structured data with CSV and JSON
  - Build a menu-driven CLI application with input validation
prerequisites:
  - "Python basics (variables, loops, functions)"
  - "Dictionaries and lists"
---

## What You'll Learn

- Model complex data with nested dictionaries and lists
- Parse, compare, and format dates using the `datetime` module
- Persist data to CSV and JSON files for portability
- Build an interactive CLI menu with input validation
- Calculate budget summaries and track spending against limits

## What You'll Build

A command-line grant tracking application that lets you:

- Register new grant applications with funder details, deadlines, and budgets
- Track proposal development costs across phases (writing, review, submission)
- Assign team members and set review milestones
- View a dashboard with upcoming deadlines and budget status
- Save and load all data from local JSON files

## Where to Run It

- **JupyterLite**: Works with `pandas` available by default — great for exploring budget data
- **Local with `uv`**: Full CLI experience with file persistence
- **Google Colab**: Run the notebook version for quick experimentation

## Setup

```bash
# Create a new project
uv init grant-tracker
cd grant-tracker

# No external packages needed — only standard library modules
# This project uses: datetime, csv, json, os
```

## Step 1: Define the Data Model

Start by building the core data structures. Each grant is a dictionary with nested fields for the team and budget.

```python
from datetime import datetime, timedelta
import json
import os

DATA_FILE = "grants.json"

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
```

## Step 2: Add Expense Tracking

Build functions to record expenses and calculate budget summaries. Each expense links back to its grant.

```python
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


def budget_summary(grant: dict) -> dict:
    """Return a budget summary for a single grant."""
    remaining = round(grant["total_budget"] - grant["spent"], 2)
    pct_used = round((grant["spent"] / grant["total_budget"]) * 100, 1) if grant["total_budget"] > 0 else 0
    return {
        "title": grant["title"],
        "total": grant["total_budget"],
        "spent": grant["spent"],
        "remaining": remaining,
        "percent_used": pct_used,
    }
```

## Step 3: Build the Deadline Dashboard

Create a function that filters and sorts grants by upcoming deadlines, highlighting any that are overdue.

```python
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
        print(f"     Deadline: {item['deadline']} — {item['status']}")
        budget = item["budget_status"]
        print(f"     Budget: ${budget['spent']:.2f} / ${budget['total']:.2f} ({budget['percent_used']}% used)")
        print()
```

## Step 4: Persist Data with JSON

Save grants to disk so your work survives between sessions. Load them back on startup.

```python
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


# --- Demo: build a sample dataset ---
grants = [
    create_grant("NSF Career Development", "National Science Foundation", "2026-10-15", 500000.00, ["Alice", "Bob"]),
    create_grant("NIH R01 Proposal", "National Institutes of Health", "2026-11-01", 350000.00, ["Carol"]),
    create_grant("Local Community Grant", "City Foundation", "2026-09-30", 25000.00, ["Bob", "Carol"]),
]

add_expense(grants[0], "Statistician consultation", 4500.00, "writing")
add_expense(grants[0], "Travel to collaborator", 1200.00, "writing")
add_expense(grants[2], "Community survey printing", 350.00, "outreach")

save_grants(grants)
print_dashboard(grants)
```

## Challenges

<details>
<summary><strong>Challenge 1: Status Workflow</strong></summary>

Add a `status` transition system. Grants should only move from `draft` → `submitted` → `review` → `funded` or `rejected`. Write a function `advance_status(grant, new_status)` that validates the transition and raises an error for invalid moves.

```python
VALID_TRANSITIONS = {
    "draft": ["submitted"],
    "submitted": ["review"],
    "review": ["funded", "rejected"],
    "funded": [],
    "rejected": [],
}

def advance_status(grant: dict, new_status: str) -> None:
    current = grant["status"]
    if new_status not in VALID_TRANSITIONS[current]:
        raise ValueError(f"Cannot move from '{current}' to '{new_status}'")
    grant["status"] = new_status
    print(f"  {grant['title']}: {current} -> {new_status}")
```

</details>

<details>
<summary><strong>Challenge 2: Team Workload Report</strong></summary>

Build a function that shows how many grants each team member is assigned to, and how much budget they manage. This helps identify over-allocated collaborators.

</details>

<details>
<summary><strong>Challenge 3: CSV Export</strong></summary>

Add an export function that writes all grant data to a CSV file using the `csv` module. Include columns for title, funder, deadline, budget, spent, and status. This lets you open the data in a spreadsheet application.

</details>

## Stretch Goals

- [ ] Add integration with university grant management systems
- [ ] Build a template library for common grant proposal sections
- [ ] Implement automated compliance checking against funder requirements
- [ ] Add email reminder functionality using `smtplib`
- [ ] Create a simple Flask dashboard to view grants in a browser

## What You Learned

- Modeled complex, nested data with dictionaries and lists
- Used `datetime` for deadline calculations and date formatting
- Persisted data to JSON and handled file I/O errors
- Built a menu-driven CLI with input validation
- Calculated budget summaries and filtered data by date ranges
