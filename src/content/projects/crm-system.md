---
title: "Build a CRM System"
slug: /projects/crm-system
description: "Build a lightweight command-line CRM with persistent SQLite storage, typed data models, pipeline tracking, and a polished rich table interface."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["classes", "sqlite3", "rich", "cli"]
learningObjectives:
  - "Model contacts, deals, and activities as typed dataclasses"
  - "Design and query a SQLite database with foreign keys and parameterized SQL"
  - "Insert, search, and filter records across related tables"
  - "Track deal stages with validation and read back a per-stage pipeline summary"
  - "Log activities and reconstruct a contact's chronological timeline"
  - "Render every view as a styled rich table"
prerequisites: ["Python basics (classes, functions, dicts)", "pip install rich"]
---

# 🛠️ 🤝 Build a CRM System

A CRM is the shared source of truth for a sales team: every contact, every deal, every call and email lives in one place so nothing slips through. This project builds a lightweight CRM from scratch — you'll model contacts, deals, and activities as typed Python dataclasses, design a SQLite schema with real foreign keys, write parameterized queries for search and filtering, push deals through a validated pipeline, reconstruct a contact's timeline, and surface it all in clean `rich` table output.

This assumes Python 101 and enough comfort with SQL to read a SELECT — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Model contacts, deals, and activities as clean `@dataclass` types with date auto-filling.
2. Design a SQLite schema with three related tables and foreign keys between them.
3. Insert records with parameterized queries and search by name, email, or company.
4. Push deals through a validated pipeline and read back a per-stage value summary.
5. Log activities and reconstruct a contact's full chronological timeline.
6. Render every view as styled `rich` tables in the terminal.

## Where to run this

**Locally with `uv`** is the primary, recommended path — SQLite writes to disk when you choose a file path, and `rich` renders full-color tables only in a real terminal (notebook cells truncate them).

**GitHub Codespaces** works perfectly too: open [the course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run from there. A real terminal with real color support.

**Google Colab and Kaggle Notebooks** are a genuine way to run this — SQLite works in memory (`:memory:`), and the Python code is fully compatible. The honest caveat is `rich`: notebook cells render tables in plain text (the colors vanish), and there's no persistent data between sessions. The notebook below uses an in-memory database seeded with two sample contacts and their deals, so every query returns real-looking results even though nothing persists after the kernel restarts. Use it to see the schema and queries work end to end; switch to local `uv` or a Codespace once you want your own data to stick around.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/crm-system/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/crm-system/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcrm-system%2Fnotebook.ipynb)

## Setup

Everything you need lives in two packages: one PyPI library for the terminal UI, and one stdlib module for storage.

### Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

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

### Set up the project

```bash
uv init crm-system
cd crm-system
uv add rich
```

`rich` makes terminal tables and panels look like a real application — colors, borders, aligned columns. `sqlite3` ships with Python; no extra install needed. Your CRM data lives in a `.db` file you point the script at, or in memory if you don't specify a path.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `crm-system/` exists with a `pyproject.toml`, and `rich` is installed.

## Step 1: Model the data with dataclasses

Every record in a CRM has a rigid shape — a contact always has a name and email; a deal always has a value and a stage. `@dataclass` enforces that shape at definition time, prevents accidental attribute drift, and gives you a readable `repr` and dict serialization for free. The `Optional[int]` id field stays `None` until a record is inserted and the database assigns one.

### 1.1 Define Contact, Deal, and Activity

**👟 Starter hint:** Give each class the exact set of columns it maps to, make `id` a nullable `Optional[int]` with default `None`, and set sensible empty-string defaults for optional text fields.

```python
# crm_system.py
from dataclasses import dataclass
from datetime import date
from typing import Optional

@dataclass
class Contact:
    name: str
    email: str
    company: str = ""
    phone: str = ""
    id: Optional[int] = None

@dataclass
class Deal:
    contact_id: int
    title: str
    value: float
    stage: str = "lead"
    id: Optional[int] = None
    STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]

@dataclass
class Activity:
    contact_id: int
    deal_id: Optional[int]
    kind: str      # call, email, meeting
    summary: str
    activity_date: str = ""
    id: Optional[int] = None

    def __post_init__(self):
        if not self.activity_date:
            self.activity_date = date.today().isoformat()

c = Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp")
d = Deal(contact_id=1, title="Enterprise License", value=12_000, stage="proposal")
a = Activity(contact_id=1, deal_id=1, kind="meeting", summary="Discussed pricing")
print(f"Contact: {c.name} | Deal: {d.title} (${d.value:,.0f})")
```

The `__post_init__` on `Activity` is the only non-trivial bit: it auto-fills the date with today's ISO string when you forget, so every activity gets a valid timestamp even in a quick test run. `Deal.STAGES` is a class-level constant — not an instance attribute — which means `Deal.STAGES` reads cleanly without constructing a `Deal`, and every instance implicitly knows the allowed progression.

**🎯 Expected output:** Prints `Contact: Alice Chen | Deal: Enterprise License ($12,000)`.

**🩹 If it's off:** If `Optional` from `typing` isn't recognized, your Python is <3.10 — use `from __future__ import annotations` at the top, or `Optional[int]` remains valid either way. If `__post_init__` isn't running, check it's indented under `Activity`, not a standalone function — it's a dataclass magic method, not a regular method.

### 1.2 Verify the models

**✅ Checklist**

- ✅ Constructing `Contact`, `Deal`, and `Activity` with named keyword arguments produces a clean `repr` and no `TypeError`.
- ✅ Creating an `Activity` without a date auto-fills `activity_date` with today's ISO date.

**🤔 Socratic Question(s)**

- A plain `dict` like `{"name": "Alice", "email": "alice@acme.com"}` would store the same data without importing anything. What specific *guarantee* does `@dataclass` add that a dict doesn't, and when does that guarantee matter?
- `Deal.STAGES` is defined directly on the class body. Why is that preferable to a top-level `STAGES` list, and what happens to `move_deal` in Step 4 if a stage string doesn't match one of those values?

## Step 2: Design the SQLite schema and insert contacts

`sqlite3` is the smallest reliable database in existence — no install, no daemon, no config file — and it's in Python's stdlib. The schema mirrors your dataclasses exactly: three tables with a foreign key from `deals` and `activities` to `contacts`, so the database itself enforces the relationship your code depends on.

### 2.1 Create the database and the schema

**👟 Starter hint:** Use `conn.row_factory = sqlite3.Row` so every `SELECT` result acts as a readable dictionary, and `executescript` to run multiple `CREATE TABLE` statements in one call.

```python
# crm_system.py (continued)
import sqlite3

def init_db(db_path: str = ":memory:") -> sqlite3.Connection:
    """Create the three tables and return a ready-to-use connection."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            company TEXT DEFAULT '',
            phone TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            title TEXT NOT NULL,
            value REAL DEFAULT 0,
            stage TEXT DEFAULT 'lead'
        );
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            deal_id INTEGER,
            kind TEXT NOT NULL,
            summary TEXT NOT NULL,
            activity_date TEXT NOT NULL
        );
    """)
    conn.commit()
    return conn

conn = init_db()
```

`"refereences contacts(id)"` is a foreign key declaration, but SQLite only enforces it if you run `PRAGMA foreign_keys = ON` — and deliberately, we don't do that here. Full FK enforcement is the right production default, but for a teaching CRM where you might temporarily insert a deal before its contact exists, the pragmatic choice is to let the Python code own the constraint. `conn.row_factory = sqlite3.Row` means every fetched row behaves as both a dict and an object — you can use `row["name"]` and `row.name` interchangeably, which is the single most useful `sqlite3` feature.

**🎯 Expected output:** `init_db()` returns a live `sqlite3.Connection` without errors; calling `conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()` prints the three table names.

**🩹 If it's off:** If `executescript` raises `ProgrammingError`, you forgot to `conn.commit()` — the schema writes are transactions, and without committing they're invisible to subsequent queries. If a table already exists from a previous run against a file (not `:memory:`), `CREATE TABLE IF NOT EXISTS` silently does nothing — drop the file or the table if you need a fresh schema.

### 2.2 Insert and search contacts

**👟 Starter hint:** Write `add_contact` and `search_contacts` as pure functions of the connection — never of a global variable — so they're trivially testable and composable.

```python
# crm_system.py (continued)
def add_contact(conn: sqlite3.Connection, contact: Contact) -> int:
    cur = conn.execute(
        "INSERT INTO contacts (name, email, company, phone) VALUES (?, ?, ?, ?)",
        (contact.name, contact.email, contact.company, contact.phone),
    )
    conn.commit()
    return cur.lastrowid

def search_contacts(conn: sqlite3.Connection, query: str) -> list[dict]:
    """Search by name, email, or company using parameterized LIKE."""
    pattern = f"%{query}%"
    rows = conn.execute(
        "SELECT * FROM contacts WHERE name LIKE ? OR email LIKE ? OR company LIKE ?",
        (pattern, pattern, pattern),
    ).fetchall()
    return [dict(r) for r in rows]

alice_id = add_contact(conn, Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp"))
bob_id   = add_contact(conn, Contact(name="Bob Smith", email="bob@globex.com", company="Globex Inc"))
print(f"Added contacts: IDs {alice_id}, {bob_id}")
print(search_contacts(conn, "acme"))
```

`?` placeholders in the SQL string are the entire point of parameterized queries: the database never interprets your string values as SQL fragments, which is both a security rule (no injection) and a correctness rule (no escaping bugs). `cur.lastrowid` is the integer primary key the database just assigned — it's the foreign key value your deals and activities need in the next steps, so `add_contact` returning it is a deliberate design choice.

**🎯 Expected output:** Prints `Added contacts: IDs 1, 2` followed by a list containing one dict for Alice Chen.

**🩹 If it's off:** If `search_contacts(conn, "acme")` returns an empty list despite Alice being inserted, check that both `add_contact` calls ran before the query — if `conn.commit()` is missing inside `add_contact`, the inserts are invisible to subsequent reads. If you get `ProgrammingError: wrong number of arguments`, the query string has a different number of `?` placeholders than values in the tuple — count them.

### 2.3 Verify the schema and insert

**✅ Checklist**

- ✅ Two contacts exist with auto-assigned IDs (`1` and `2`), and `search_contacts(conn, "Globex")` returns exactly Bob.
- ✅ You can explain why `?` placeholders are not just a best practice but a security boundary.

**🤔 Socratic Question(s)**

- `search_contacts` returns `[dict(r) for r in rows]`, converting each `sqlite3.Row` to a plain dict. What would change if you returned the `Row` objects directly — is there a case where that's better, and a case where it breaks something?
- A junior colleague suggests storing the company as an integer foreign key to a `companies` table "for normalization." What are the trade-offs in a small CRM where a company name is really just a label?

## Step 3: Search and filter with joins

A CRM isn't useful until you can ask relational questions: "which deals are in the proposal stage?" "which contacts are associated with a deal worth over $5K?" These are JOINs — pulling rows from two tables using the foreign key that connects them — and they're the query pattern that makes a database genuinely more powerful than a flat file.

### 3.1 Write filtered deal queries

**👟 Starter hint:** Write a function that counts contacts per company (a simple GROUP BY), and a function that lists deals filtered by stage — both using parameterized values.

```python
# crm_system.py (continued)
def contacts_by_company(conn: sqlite3.Connection, company: str) -> list[dict]:
    """Return all contacts whose company matches the query."""
    rows = conn.execute(
        "SELECT * FROM contacts WHERE company LIKE ?", (f"%{company}%",)
    ).fetchall()
    return [dict(r) for r in rows]

def deals_by_stage(conn: sqlite3.Connection, stage: str) -> list[dict]:
    """List deals at a given stage, joined with contact name."""
    rows = conn.execute(
        "SELECT d.id, d.title, d.value, d.stage, c.name AS contact_name "
        "FROM deals d JOIN contacts c ON d.contact_id = c.id "
        "WHERE d.stage = ? ORDER BY d.value DESC",
        (stage,),
    ).fetchall()
    return [dict(r) for r in rows]

# Demo: search contacts and list deals by stage
print("Acme contacts:", contacts_by_company(conn, "Acme"))
# (deals_by_stage will return [] until Step 4 inserts deals)
```

The `JOIN contacts c ON d.contact_id = c.id` is the key line: it matches each deal to the contact who owns it by integer foreign key, and `c.name AS contact_name` brings the name into the result so your display logic doesn't need a second query. Sorting by `value DESC` is an intentional bias toward the information you'd want first when scanning a pipeline — the biggest numbers up top.

**🎯 Expected output:** `Acme contacts: [{'id': 1, 'name': 'Alice Chen', ...}]`; `deals_by_stage(conn, "proposal")` returns an empty list (deals don't exist yet — they come in Step 4).

**🩹 If it's off:** If `contacts_by_company` returns a case-sensitive mismatch (e.g., searching "ACME" for "Acme"), SQLite `LIKE` is case-insensitive only for ASCII characters; use `LOWER()` in the query if you're working with mixed-case input. If `deals_by_stage` raises `OperationalError: no such column`, the column alias in your JOIN doesn't match the SELECT list.

### 3.2 Verify the filtered queries

**✅ Checklist**

- ✅ `contacts_by_company(conn, "Globex")` returns exactly Bob, and `contacts_by_company(conn, "Nonexistent")` returns `[]`.
- ✅ `deals_by_stage` returns an empty list before any deals are inserted — confirming it's not silently reusing stale data.

**🤔 Socratic Question(s)**

- Both `search_contacts` and `contacts_by_company` filter by a `LIKE ?` pattern. Why not just write one function with a `WHERE` clause that checks every column with `OR` — is there a reason to keep the two separate, or is it just code style?
- `deals_by_stage` joins but `contacts_by_company` doesn't. When does a single-table query work, and when does leaving the JOIN out silently give you the wrong answer?

## Step 4: Track deals through the pipeline

A deal's *stage* is its position in the sales pipeline, and moving it forward without validation is how CRMs turn into garbage. This step builds the pipeline logic: add deals, validate stage transitions, move a deal forward, and read back a per-stage summary of how many deals and how much value sits at each point.

### 4.1 Insert deals and move them through the pipeline

**👟 Starter hint:** `add_deal` and `move_deal` should live on `Deal`'s class constants — `deal_id` and `new_stage` are arguments, not attributes — and `move_deal` must reject invalid stages *before* the UPDATE runs.

```python
# crm_system.py (continued)
def add_deal(conn: sqlite3.Connection, deal: Deal) -> int:
    cur = conn.execute(
        "INSERT INTO deals (contact_id, title, value, stage) VALUES (?, ?, ?, ?)",
        (deal.contact_id, deal.title, deal.value, deal.stage),
    )
    conn.commit()
    return cur.lastrowid

def move_deal(conn: sqlite3.Connection, deal_id: int, new_stage: str) -> None:
    if new_stage not in Deal.STAGES:
        raise ValueError(f"Invalid stage: {new_stage}. Choose from {Deal.STAGES}")
    conn.execute("UPDATE deals SET stage = ? WHERE id = ?", (new_stage, deal_id))
    conn.commit()

deal1_id = add_deal(conn, Deal(contact_id=alice_id, title="Enterprise License", value=12_000, stage="proposal"))
deal2_id = add_deal(conn, Deal(contact_id=bob_id, title="Consulting Package", value=5_000, stage="lead"))
move_deal(conn, deal1_id, "negotiation")
```

The validation check — `if new_stage not in Deal.STAGES` — runs as a Python-level guard, not a database constraint, because SQLite doesn't have `CHECK` constraints in `DEFAULT`. This is the deliberate trade-off: you get a clear `ValueError` with the valid options printed, rather than a silent `UPDATE` that writes a meaningless string and breaks the pipeline view later.

**🎯 Expected output:** Two deals exist; deal1 is now at `"negotiation"` after the move; deal2 remains at `"lead"`.

**🩹 If it's off:** If `move_deal` raises `ValueError` for a valid stage, the string has a typo — capitalization matters exactly as listed in `Deal.STAGES`. If the UPDATE runs but `deals_by_stage` still shows the deal at its old stage, you forgot `conn.commit()` — the write happened in memory but wasn't persisted.

### 4.2 Read back the pipeline summary

**👟 Starter hint:** Aggregate with `GROUP BY stage` and `ORDER BY stage` to get one row per stage in pipeline order, including a deal count and a total value.

```python
# crm_system.py (continued)
def pipeline_summary(conn: sqlite3.Connection) -> dict:
    """Return {stage: {count, total_value}} for every stage in the pipeline."""
    rows = conn.execute(
        "SELECT stage, COUNT(*) AS deals, SUM(value) AS total "
        "FROM deals GROUP BY stage ORDER BY stage"
    ).fetchall()
    return {r["stage"]: {"count": r["deals"], "value": r["total"] or 0.0} for r in rows}

for stage, info in pipeline_summary(conn).items():
    print(f"  {stage:<15} {info['count']} deals  ${info['value']:>10,.0f}")
```

`r["total"] or 0.0` handles the case where a stage has no deals at all — `SUM` returns `NULL` on an empty group, and Python's `or` catches it. Ordering by `stage` alphabetically is a simplification for the teaching pipeline; a production CRM would define an explicit ordering via `CASE WHEN stage = 'lead' THEN 1 ...`.

**🎯 Expected output:** Prints each stage with its deal count and total value — `negotiation` shows 1 deal ($12,000), `lead` shows 1 deal ($5,000), and all other stages show 0 deals and $0.

**🩹 If it's off:** If every stage shows 0 deals despite inserts, your `GROUP BY` is working against a different connection or database file — confirm you're passing the same `conn` object, not re-initializing from scratch. If the stage names don't match the `STAGES` constant, `SUM` on a non-existent group returns nothing — check for stray whitespace in stage strings.

### 4.3 Verify the pipeline

**✅ Checklist**

- ✅ `deal1_id`'s stage is `"negotiation"` after `move_deal`, and `deal2_id`'s is still `"lead"`.
- ✅ `pipeline_summary(conn)` returns a dict with exactly two non-zero stages and their correct deal counts.

**🤔 Socratic Question(s)**

- A user wants to move a deal *backward* from `"negotiation"` to `"qualified"`. Is the current `move_deal` function correct for that use case, and what additional logic would prevent abuse if you were deploying this as a real sales tool?
- The pipeline summary is ordered alphabetically by stage name. What's wrong with that ordering for a real sales pipeline, and how would you fix it without leaving SQL?

## Step 5: Log activities and read back a timeline

A deal without context is a number; a deal with a timeline of calls, emails, and meetings is a *story*. This step writes activities to the database and reconstructs that story for any contact — ordered by date, so a manager can read the relationship history without scrolling.

### 5.1 Insert activities and fetch the timeline

**👟 Starter hint:** `add_activity` is almost identical in shape to `add_deal` — the pattern is always `INSERT with ? placeholders, commit, return lastrowid`. Write a `timeline_for_contact` that joins activities to contacts and sorts by `activity_date, id`.

```python
# crm_system.py (continued)
def add_activity(conn: sqlite3.Connection, activity: Activity) -> int:
    cur = conn.execute(
        "INSERT INTO activities (contact_id, deal_id, kind, summary, activity_date) "
        "VALUES (?, ?, ?, ?, ?)",
        (activity.contact_id, activity.deal_id, activity.kind, activity.summary, activity.activity_date),
    )
    conn.commit()
    return cur.lastrowid

def timeline_for_contact(conn: sqlite3.Connection, contact_id: int) -> list[dict]:
    """Return all activities for a contact, ordered by date then insertion order."""
    rows = conn.execute(
        "SELECT kind, summary, activity_date FROM activities "
        "WHERE contact_id = ? ORDER BY activity_date, id",
        (contact_id,),
    ).fetchall()
    return [dict(r) for r in rows]

add_activity(conn, Activity(contact_id=alice_id, deal_id=deal1_id, kind="meeting", summary="Reviewed contract"))
add_activity(conn, Activity(contact_id=bob_id,   deal_id=deal2_id, kind="call",    summary="Initial outreach call"))
add_activity(conn, Activity(contact_id=alice_id, deal_id=deal1_id, kind="email",   summary="Sent revised terms"))

print("Alice's timeline:")
for a in timeline_for_contact(conn, alice_id):
    print(f"  {a['activity_date']}  [{a['kind']}]  {a['summary']}")
```

`ORDER BY activity_date, id` is a two-part sort: dates first, then insertion order for activities on the same day. Without the `, id` tiebreaker, same-day activities appear in arbitrary order, which is fine for a toy but confusing in any real timeline. The `deal_id` being `Optional[int]` matters here — an activity can be about a contact in general, not tied to a specific deal.

**🎯 Expected output:** Prints Alice's timeline: the meeting on today's date, then the email, both listed with kind tag and summary.

**🩹 If it's off:** If activities for Alice show Bob's entries (or vice versa), the `contact_id` value passed to `timeline_for_contact` doesn't match — trace back the IDs returned by `add_contact` in Step 2. If the timeline is empty despite inserts, you're querying a different connection that hasn't committed — always use the same `conn` object.

### 5.2 Verify the activity log

**✅ Checklist**

- ✅ Alice has exactly two activities and Bob has exactly one, each showing the correct kind, summary, and today's date.
- ✅ Activities on the same day are ordered by their insertion order (meeting before email), not alphabetically by summary.

**🤔 Socratic Question(s)**

- `deal_id` is `Optional[int]` in `Activity`, but the `activities` table stores it as a bare `INTEGER` with no `REFERENCES` clause. What could go wrong in production if someone inserts an activity with a `deal_id` that doesn't exist in the `deals` table?
- How would you extend `timeline_for_contact` to include the deal title alongside each activity (for activities that have a `deal_id`), and why does that require a `LEFT JOIN` rather than a regular `JOIN`?

## Step 6: Surface it all with rich tables

The CRM is functional — contacts are stored, deals flow through a pipeline, activities are logged. But all the output so far is bare `print()` statements. `rich` turns that into a real terminal application: colored tables with aligned columns, visible borders, and headers that make scanning fast.

### 6.1 Render contacts and the pipeline as rich tables

**👟 Starter hint:** Import `Console` and `Table` from `rich`, create one table per view, add columns with `style` for color coding, and print each table with `console.print(table)`.

```python
# crm_system.py (continued)
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

def show_contacts(conn: sqlite3.Connection) -> None:
    table = Table(title="Contacts")
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="green")
    table.add_column("Email")
    table.add_column("Company", style="yellow")
    for row in conn.execute("SELECT * FROM contacts"):
        table.add_row(str(row["id"]), row["name"], row["email"], row["company"])
    console.print(table)

def show_pipeline(conn: sqlite3.Connection) -> None:
    table = Table(title="Deal Pipeline")
    table.add_column("Deal", style="cyan")
    table.add_column("Contact", style="green")
    table.add_column("Value", justify="right")
    table.add_column("Stage", style="yellow")
    for row in conn.execute(
        "SELECT d.title, d.value, d.stage, c.name AS contact_name "
        "FROM deals d JOIN contacts c ON d.contact_id = c.id "
        "ORDER BY d.stage, d.value DESC"
    ):
        table.add_row(row["title"], row["contact_name"], f"${row['value']:,.0f}", row["stage"])
    console.print(table)

show_contacts(conn)
show_pipeline(conn)
```

`style="cyan"` and `style="green"` are `rich` color directives — they add meaning without overloading the output: IDs are always one color, names another, stages a third. The `justify="right"` on Value makes dollar amounts line up by decimal, not by first digit, which is what your eye expects from a spreadsheet. One `Console()` instance shared by all functions keeps the color and width settings consistent.

**🎯 Expected output:** Two `rich` tables in the terminal — one listing both contacts with colored ID/Name/Company columns, the second showing both deals with the contact name joined in, dollar values right-aligned, and stages color-coded.

**🩹 If it's off:** If the output is garbled plain text, you're running in a notebook cell rather than a real terminal — `rich` detects non-TTY output and strips colors. Use a terminal or a Codespace. If the Value column has misaligned decimals, the `justify="right"` is missing or the values are being formatted as strings before insertion.

### 6.2 Verify the rich display

**✅ Checklist**

- ✅ Two styled tables render with color — one for contacts, one for the deal pipeline.
- ✅ Dollar values in the pipeline table are right-aligned, with commas in thousands.

**🤔 Socratic Question(s)**

- `rich.Console()` auto-detects the terminal width and truncates columns that are too long. What happens if a contact's email is 80 characters, and how would you fix it without losing data?
- The pipeline table orders by `stage, value DESC`. Why not sort by stage only, and what visual problem would that create when scanning a pipeline with multiple deals in the same stage?

## ⚠️ Common pitfalls

- **SQL injection via f-strings.** `"SELECT * FROM contacts WHERE name LIKE f'%{query}%'"` is a textbook injection vector — always use `?` placeholders with a separate parameters tuple. The `search_contacts` function above demonstrates the right shape; any query that interpolates user input directly is wrong, no matter how quick the prototype.
- **Forgetting `conn.commit()`.** Every `INSERT` and `UPDATE` is a transaction; without a commit, the write is invisible to the next `SELECT` and silently vanishes. The symptom is "I inserted a row but the query returns nothing" — almost always a missing commit.
- **Stage string typos silently create new stages.** `move_deal` rejects invalid stages in the Python guard, but if you bypass it with a raw `UPDATE`, SQLite will happily store any string as a stage — and `deals_by_stage` will never find those rows under the expected stage name. Keep the guard.
- **Alphabetical ordering of pipeline stages.** `ORDER BY stage` sorts "lead" before "negotiation" — which *happens* to match the pipeline order in this small example, but is fragile. A production CRM needs an explicit stage ordering, either via a `CASE` expression or a lookup table.
- **`dict(row)` on sqlite3.Row doesn't nest.** The foreign-key relationships (`contact_name` from the JOIN) appear as flat keys, not a nested `{"contact": {"name": ...}}` structure. Any code that expects nesting will silently get `KeyError`; work with the flat dict shape or build the nesting explicitly.

## What you just built

A working command-line CRM: it stores contacts, tracks deals through a validated six-stage pipeline, logs activities with dates, reconstructs contact timelines, and presents everything through styled `rich` tables — all backed by a real SQLite database with parameterized queries and foreign keys. Point it at your own `.db` file and the data persists between runs; no simulation, no fake data.

:::tip[Run a fuller version without any local setup]
[`examples/crm-system/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/crm-system) in the course repo is a runnable notebook version: an in-memory SQLite database seeded with sample contacts and deals, every query and table from Steps 1–6 executing end to end, and the rich output rendered inline. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Build a **pipeline value report panel**: use `rich.panel.Panel` to print the total pipeline value, count of open deals, and average deal size — all from `pipeline_summary` — inside a single colored panel that fits at the top of every `show_pipeline` call.
- Add **deal reassignment**: write `reassign_deal(conn, deal_id, new_contact_id)` that changes the contact, then log the reassignment as an activity so the timeline shows who the deal belonged to before and after.
- Implement **CSV import/export**: add `import_csv(conn, path)` using Python's `csv.DictReader` to bulk-load contacts, and `export_deals(conn, path)` to dump the pipeline to a spreadsheet — the simplest path from a CRM to a reporting tool.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python that tracks real relationships. 🎓