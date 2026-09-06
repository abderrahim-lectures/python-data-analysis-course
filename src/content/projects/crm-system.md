---
title: "CRM System"
description: "Customer relationship management with contacts, deals, pipeline tracking, and email integration."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["classes", "sqlite3", "rich", "cli"]
learningObjectives:
  - "Use classes to model contacts, deals, and activities in a CRM"
  - "Design and query a SQLite database for persistent storage"
  - "Build a clean CLI interface with the rich library"
  - "Implement search, filtering, and pipeline visualization"
prerequisites: ["Python basics (classes, functions, dicts)", "pip install rich"]
---

# CRM System

Build a lightweight CRM that stores contacts, tracks deals through a pipeline, and logs every interaction.

## What You'll Learn

1. Design relational data models using classes
2. Create and query SQLite databases for persistent storage
3. Build a polished CLI with rich tables and panels
4. Implement search and filter operations across related data

## What You'll Build

A command-line CRM that lets you:

- **Manage contacts** — store names, emails, companies, and custom notes
- **Track deals** — move opportunities through customizable pipeline stages
- **Log activities** — record calls, emails, and meetings for every contact
- **Search and filter** — find contacts by name, company, or deal status

## Where to Run It

- **Local with uv** — run as a standalone CLI tool
- **Google Colab** — paste into cells (SQLite works in-memory there)
- Not ideal for JupyterLite due to rich terminal output

## Setup

```bash
uv init crm-system
cd crm-system
uv add rich
```

## Step 1 — Define the Data Models

Create classes for Contact, Deal, and Activity that serialize cleanly to dictionaries.

```python
from dataclasses import dataclass, asdict
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
    kind: str  # call, email, meeting
    summary: str
    activity_date: str = ""
    id: Optional[int] = None

    def __post_init__(self):
        if not self.activity_date:
            self.activity_date = date.today().isoformat()

c = Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp")
d = Deal(contact_id=1, title="Enterprise License", value=12000, stage="proposal")
a = Activity(contact_id=1, deal_id=1, kind="meeting", summary="Discussed pricing")
print(f"Contact: {c.name} | Deal: {d.title} (${d.value:,.0f})")
```

## Step 2 — Set Up SQLite and CRUD Operations

Create the database tables and write helper functions for create, read, update, and delete.

```python
import sqlite3

def init_db(db_path: str = ":memory:") -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, email TEXT NOT NULL,
            company TEXT DEFAULT '', phone TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            title TEXT NOT NULL, value REAL DEFAULT 0, stage TEXT DEFAULT 'lead'
        );
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            deal_id INTEGER, kind TEXT NOT NULL,
            summary TEXT NOT NULL, activity_date TEXT NOT NULL
        );
    """)
    conn.commit()
    return conn

def add_contact(conn: sqlite3.Connection, contact: Contact) -> int:
    cur = conn.execute(
        "INSERT INTO contacts (name, email, company, phone) VALUES (?, ?, ?, ?)",
        (contact.name, contact.email, contact.company, contact.phone),
    )
    conn.commit()
    return cur.lastrowid

def search_contacts(conn: sqlite3.Connection, query: str) -> list[dict]:
    pattern = f"%{query}%"
    rows = conn.execute(
        "SELECT * FROM contacts WHERE name LIKE ? OR email LIKE ? OR company LIKE ?",
        (pattern, pattern, pattern),
    ).fetchall()
    return [dict(r) for r in rows]

conn = init_db()
alice_id = add_contact(conn, Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp"))
bob_id = add_contact(conn, Contact(name="Bob Smith", email="bob@globex.com", company="Globex Inc"))
print(f"Added contacts: IDs {alice_id}, {bob_id}")
print(search_contacts(conn, "acme"))
```

## Step 3 — Deal Pipeline and Activity Logging

Add deals and activities, then view the pipeline grouped by stage.

```python
def add_deal(conn: sqlite3.Connection, deal: Deal) -> int:
    cur = conn.execute(
        "INSERT INTO deals (contact_id, title, value, stage) VALUES (?, ?, ?, ?)",
        (deal.contact_id, deal.title, deal.value, deal.stage),
    )
    conn.commit()
    return cur.lastrowid

def add_activity(conn: sqlite3.Connection, activity: Activity) -> int:
    cur = conn.execute(
        "INSERT INTO activities (contact_id, deal_id, kind, summary, activity_date) VALUES (?, ?, ?, ?, ?)",
        (activity.contact_id, activity.deal_id, activity.kind, activity.summary, activity.activity_date),
    )
    conn.commit()
    return cur.lastrowid

def move_deal(conn: sqlite3.Connection, deal_id: int, new_stage: str) -> None:
    if new_stage not in Deal.STAGES:
        raise ValueError(f"Invalid stage: {new_stage}. Choose from {Deal.STAGES}")
    conn.execute("UPDATE deals SET stage = ? WHERE id = ?", (new_stage, deal_id))
    conn.commit()

deal1_id = add_deal(conn, Deal(contact_id=alice_id, title="Enterprise License", value=12000, stage="proposal"))
deal2_id = add_deal(conn, Deal(contact_id=bob_id, title="Consulting Package", value=5000, stage="lead"))
add_activity(conn, Activity(contact_id=alice_id, deal_id=deal1_id, kind="meeting", summary="Reviewed contract"))
add_activity(conn, Activity(contact_id=bob_id, deal_id=deal2_id, kind="call", summary="Initial outreach call"))

for stage in Deal.STAGES:
    deals = conn.execute(
        "SELECT d.*, c.name as contact_name FROM deals d JOIN contacts c ON d.contact_id = c.id WHERE d.stage = ?",
        (stage,),
    ).fetchall()
    if deals:
        print(f"\n--- {stage.upper()} ---")
        for d in deals:
            print(f"  {d['title']} (${d['value']:,.0f}) — {d['contact_name']}")
```

## Step 4 — CLI Display with Rich

Build a polished terminal interface using rich tables and panels.

```python
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
    for row in conn.execute("SELECT d.*, c.name as contact_name FROM deals d JOIN contacts c ON d.contact_id = c.id ORDER BY d.stage"):
        table.add_row(row["title"], row["contact_name"], f"${row['value']:,.0f}", row["stage"])
    console.print(table)

show_contacts(conn)
show_pipeline(conn)
```

## 🧩 Challenges

**Challenge 1 — Activity timeline**
Write a function that, given a contact ID, prints a chronological timeline of all activities (calls, emails, meetings) sorted by date.

**Challenge 2 — Pipeline value report**
Calculate total pipeline value per stage and overall. Print a rich panel showing each stage's total and deal count.

**Challenge 3 — Deal reassignment**
Add a `reassign_deal` function that changes the contact associated with a deal and logs the reassignment as an activity.

## Stretch Goals

- [ ] Add automated lead assignment based on territory or round-robin
- [ ] Build a reporting dashboard with sales forecasting
- [ ] Implement webhook integrations with Slack and calendar apps
- [ ] Add CSV import/export for bulk contact management
- [ ] Implement duplicate detection when adding new contacts

## What You Learned

- Modeling relationships between entities with classes
- Designing and querying a relational SQLite database
- Building a clean, readable CLI with rich tables and panels
- Implementing search, filtering, and pipeline management
