---
title: "Query a Database in Plain English with MCP"
description: "Build an MCP server that exposes a local SQLite database, then watch an LLM client write and run its own SQL to answer plain-English questions about it."
---

# 🔌 Query a Database in Plain English with MCP

Databases are usually behind a wall of SQL that only the people who wrote it can query comfortably. MCP changes that shape: instead of teaching everyone SQL, you expose a database through a handful of well-described tools, and let an LLM client write and run the SQL itself, on your behalf, one question at a time. This project builds exactly that — a small local SQLite database (a neighborhood library: books, authors, members, loans) and an MCP server that lets an AI assistant list its tables, inspect a table's schema, and run **read-only** queries against it, so you can ask something like "which books has the library not gotten back yet?" in plain English and watch it get answered correctly.

This assumes Python 101, ideally Data Analysis too (comfort with tables, columns, and querying structured data will make the SQL side click faster), and having already built the [Build an MCP Server](/docs/projects/mcp-server) project — this one reuses that project's `FastMCP` setup and doesn't re-explain it from scratch. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Build a small, realistic SQLite database with a few related tables, using nothing but the standard library's `sqlite3` module.
2. Write plain Python functions to list tables, describe a table's schema, and run a query — with a real, non-hand-wavy safety check that rejects anything that isn't a read-only `SELECT`.
3. Wire those functions up as MCP tools with `FastMCP`, the same decorator-based API from the Build an MCP Server project.
4. Connect your server to Claude Desktop and ask it a genuine plain-English question, watching it write and run its own SQL through your tools.

## Where to run this

**Locally with `uv`** is the primary, recommended path, for the same reason as the Build an MCP Server project: the payoff here is connecting your server to Claude Desktop, and Claude Desktop is an app installed on your own machine — there's no way around doing at least the final step locally. This is a long-running local process meant to sit and wait for a real MCP client to connect to it, not something a hosted notebook can be.

**GitHub Codespaces** works for building the database and writing the tool functions and the server itself: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed), write `seed.py`, `db_tools.py`, and `server.py`, and test with the MCP Inspector through the Codespace's forwarded port. What it can't be is your final Claude Desktop connection point, for the same reason as the earlier MCP project.

**Google Colab and Kaggle can't run the real server either** — same reasoning as Build an MCP Server, a notebook cell can't be a persistent local process a desktop client connects to. What a notebook *can* do here is demo the underlying query and schema-inspection functions in isolation, with plain function calls and no MCP protocol involved at all — that's what [`examples/mcp-sqlite-server/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb) is for. Click a badge to launch it directly, no local install at all:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb)

## Setup

If you already have `uv` from the Build an MCP Server project, skip ahead. Otherwise:

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

Then set up a project and install the official Python MCP SDK, with its optional `cli` extra:

```bash
uv init mcp-sqlite-server
cd mcp-sqlite-server
uv add "mcp[cli]"
```

`sqlite3`, the database library this project actually queries, is part of Python's standard library — nothing to install for it. No external API key is needed to run the server itself either: it's a purely local tool, and the LLM client that connects to it (Claude Desktop, in Step 4) supplies its own model and, if it needs one, its own key.

## Step 1: Build a small sample database

Create `seed.py` — a script that builds a tiny library database with four related tables:

### 1.1 Write the schema and seed script

**👟 Starter hint:** `conn.executescript(SCHEMA)` runs the whole multi-statement `CREATE TABLE` block in one call; insert a handful of rows per table after it, making sure at least one loan's `returned_on` stays `NULL`:

```python
# seed.py
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "library.db"

SCHEMA = """
CREATE TABLE authors (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL,
    country TEXT
);

CREATE TABLE books (
    id         INTEGER PRIMARY KEY,
    title      TEXT NOT NULL,
    author_id  INTEGER NOT NULL REFERENCES authors(id),
    year       INTEGER,
    genre      TEXT
);

CREATE TABLE members (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    joined_on  TEXT NOT NULL
);

CREATE TABLE loans (
    id          INTEGER PRIMARY KEY,
    book_id     INTEGER NOT NULL REFERENCES books(id),
    member_id   INTEGER NOT NULL REFERENCES members(id),
    borrowed_on TEXT NOT NULL,
    returned_on TEXT
);
"""

def build_database(db_path: Path = DB_PATH) -> None:
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(SCHEMA)
        # ... insert a handful of authors, books, members, and loans here —
        # see examples/mcp-sqlite-server/seed.py for a full sample dataset.
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    build_database()
    print(f"Built sample database at {DB_PATH}")
```

Run it once:

```bash
uv run python seed.py
```

`returned_on` being `NULL` for a row is deliberate — it's what makes "which books are still out?" a real, answerable question later, instead of every loan looking identical.

### 1.2 Verify the database and its relationships

**🎯 Expected output:** `Built sample database at .../library.db`, and a real `library.db` file on disk with four tables connected by foreign keys.

**🩹 If it's off:** A `sqlite3.OperationalError` mentioning a table name usually means a foreign key references a table defined *after* it in `SCHEMA` — SQLite runs `CREATE TABLE` statements in order, so `books` (which references `authors`) must come after `authors`, not before. If `library.db` doesn't rebuild on a second run, check `db_path.unlink()` actually ran before reconnecting — otherwise old data lingers alongside new inserts.

**✅ Checklist**

- ✅ `uv run python seed.py` runs without errors and creates `library.db`.
- ✅ The database has at least three related tables, connected by foreign keys (not one flat table).
- ✅ At least one row has a `NULL` in a nullable column (e.g. an unreturned loan) — real data has gaps.

**🤔 Socratic Question(s)**

- Why does this project use several small related tables instead of one wide table with every column in it? What would a query for "which member borrowed which book" look like in each shape?
- What would break, later, if `book_id` in `loans` didn't actually reference a real row in `books`?

## Step 2: Write the query and schema functions, safely

Create `db_tools.py` — plain Python functions, with no MCP import at all, that the server will wrap in Step 3.

### 2.1 Write `list_tables` and the layered `run_read_only_query` check

**👟 Starter hint:** `list_tables` is a plain query against `sqlite_master`; `run_read_only_query` layers three text checks (no semicolon, must start with `SELECT`, no forbidden keyword) *and* opens the connection with SQLite's `mode=ro` URI as an independent second line of defense:

```python
# db_tools.py
import re
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "library.db"

_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|PRAGMA|VACUUM)\b",
    re.IGNORECASE,
)

class UnsafeQueryError(ValueError):
    """Raised when a query isn't a single, read-only SELECT."""

def list_tables(db_path: Path = DB_PATH) -> list[str]:
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()

def run_read_only_query(sql: str, db_path: Path = DB_PATH) -> list[dict]:
    stripped = sql.strip().rstrip(";")
    if not stripped:
        raise UnsafeQueryError("Empty query.")
    if ";" in stripped:
        raise UnsafeQueryError("Only a single statement is allowed -- no ';' inside the query.")
    if not stripped.upper().startswith("SELECT"):
        raise UnsafeQueryError("Only SELECT queries are allowed.")
    if _FORBIDDEN_KEYWORDS.search(stripped):
        raise UnsafeQueryError("Query contains a write/DDL keyword, which isn't allowed.")

    # A second, independent layer of defense: open the file itself read-only
    # at the OS/SQLite level, so even a query that slipped past the text
    # checks above still can't write anything.
    uri = f"file:{Path(db_path).resolve()}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(stripped).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
```

Two things worth noticing. First, `run_read_only_query` doesn't try to be a full SQL parser — it can't be, not in a few lines — but it doesn't need to be, either: rejecting anything with a semicolon-chained second statement, anything that isn't a `SELECT`, and anything containing a write or schema keyword closes off the realistic ways a model-composed query could do damage, without pretending to catch every conceivable SQL trick. Second, opening the connection itself with SQLite's `mode=ro` URI parameter is a real second layer, independent of the text check — if the regex ever missed something, the database file being genuinely read-only at the OS level still stops a write from happening. (`describe_table`, the third function this project needs, is a short addition — see `examples/mcp-sqlite-server/db_tools.py` for the full version, including it.)

:::tip[Don't skip the read-only enforcement, even for a toy database]
It's tempting to think "it's just a demo, nobody's going to type `DROP TABLE`." The point isn't a malicious *user* — it's that the query text here is written by an LLM, not by you, and LLMs occasionally produce exactly the query that seemed reasonable given an ambiguous request but does something you didn't intend. Treat any tool that runs model-composed SQL against a real database as needing this check for real, not as an afterthought — this is the same discipline that matters (at much higher stakes) the first time you point a tool like this at a database that isn't just a sample you built for a lesson.
:::

### 2.2 Verify the safety checks reject real attack shapes

**🎯 Expected output:** A real `SELECT` returns a list of dicts, one per row; `run_read_only_query("DROP TABLE books")` and `run_read_only_query("SELECT * FROM books; DROP TABLE books")` both raise `UnsafeQueryError` instead of touching the database.

**🩹 If it's off:** If the chained-statement query slips through, check the semicolon check runs on `stripped` (post-`.rstrip(";")`, which only strips a *trailing* semicolon) — an embedded semicolon should still be caught. If a legitimate `SELECT` gets rejected, check `_FORBIDDEN_KEYWORDS` isn't matching a column or table name that happens to contain one of the forbidden words as a substring (the `\b` word-boundary in the regex is what prevents this — confirm it's still there).

**✅ Checklist**

- ✅ `db_tools.py` has no `import` of `mcp` anywhere in it — it's pure `sqlite3` and stdlib.
- ✅ `run_read_only_query("DROP TABLE books")` raises `UnsafeQueryError` instead of running.
- ✅ `run_read_only_query("SELECT * FROM books; DROP TABLE books")` also raises `UnsafeQueryError` — the semicolon check catches chained statements.
- ✅ A real `SELECT` query against your database returns the correct rows as a list of dicts.

**🤔 Socratic Question(s)**

- The `mode=ro` URI check and the text-based keyword check both reject unsafe queries. If you had to keep only one, which would you keep, and what would you lose by dropping the other?
- `describe_table` builds a query with an f-string (`f"PRAGMA table_info({table_name})"`) instead of a parameterized `?` placeholder. Why can't table and column names use the same `?` placeholder approach as values do, and what has to happen instead to keep that safe?

## Step 3: Wire the functions up as MCP tools

Create `server.py`, importing the functions from Step 2 and wrapping each one with `@mcp.tool()`, exactly like the Build an MCP Server project's `FastMCP` pattern.

### 3.1 Wrap the three tools

**👟 Starter hint:** Each `@mcp.tool()` function is a thin wrapper calling straight into Step 2's functions — the only new logic is `query_db` catching `UnsafeQueryError` and returning it as `{"error": ...}` instead of letting it raise:

```python
# server.py
from mcp.server.fastmcp import FastMCP

from db_tools import DB_PATH, UnsafeQueryError, describe_table, list_tables, run_read_only_query

mcp = FastMCP("library-db")

@mcp.tool()
def list_db_tables() -> list[str]:
    """List every table in the library database.

    Call this first when you don't yet know what data is available.
    """
    return list_tables(DB_PATH)

@mcp.tool()
def describe_db_table(table_name: str) -> list[dict]:
    """Describe a table's columns: name, type, nullability, and primary key.

    Call this after list_db_tables() to learn a table's shape before
    writing a SELECT query against it.
    """
    return describe_table(table_name, DB_PATH)

@mcp.tool()
def query_db(sql: str) -> list[dict]:
    """Run a read-only SELECT query against the library database.

    Only a single SELECT statement is allowed -- no chained statements and
    no write/DDL keywords. Call list_db_tables() and describe_db_table()
    first if you're unsure what tables or columns exist.
    """
    try:
        return run_read_only_query(sql, DB_PATH)
    except UnsafeQueryError as exc:
        return [{"error": str(exc)}]

if __name__ == "__main__":
    mcp.run()
```

### 3.2 Test all three in the Inspector, including a rejected query

Test it exactly like the earlier MCP project, with the Inspector, before touching any real client:

```bash
uv run mcp dev server.py
```

Call `list_db_tables`, then `describe_db_table` with `"books"`, then `query_db` with a real `SELECT` — and, deliberately, once with something like `DROP TABLE books`, to see it come back as a clear rejection instead of an Inspector-level error.

Notice `query_db` catches `UnsafeQueryError` itself and returns a plain `{"error": ...}` result, rather than letting the exception propagate up through MCP. That's a small but real design choice: an unhandled exception from a tool call generally surfaces to the client as an opaque protocol-level failure, while a returned error message is something the model can read, understand, and react to — for instance, by rephrasing its own query.

**🎯 Expected output:** All three tools listed in the Inspector; `list_db_tables` returns your four table names; `describe_db_table("books")` returns its columns; `query_db` with a real `SELECT` returns rows, and with `DROP TABLE books` returns `{"error": "..."}`, not a crash or an Inspector-level failure.

**🩹 If it's off:** If a rejected query shows up as an Inspector error/crash instead of a clean `{"error": ...}` result, the `try`/`except UnsafeQueryError` in `query_db` is missing or catching the wrong exception type.

**✅ Checklist**

- ✅ `uv run mcp dev server.py` starts cleanly and the Inspector lists all three tools.
- ✅ `list_db_tables` and `describe_db_table` both return real, correct data in the Inspector.
- ✅ `query_db` with a real `SELECT` returns rows; `query_db` with a write/DDL query returns a clear `{"error": ...}` instead of crashing.

**🤔 Socratic Question(s)**

- Each tool's docstring tells the model both what it does and, in `list_db_tables`'s case, roughly when to call it first. What would happen to the model's tool choices if all three docstrings just said `"""Database tool."""`?
- Why wrap `UnsafeQueryError` into a returned `{"error": ...}` value instead of letting it raise all the way up?

## Step 4: Connect to Claude Desktop and ask a real question

Add your server to `claude_desktop_config.json` (same file the Build an MCP Server project used — macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

### 4.1 Edit the config file

**👟 Starter hint:** Same shape as the earlier MCP project's config — replace `/absolute/path/to/mcp-sqlite-server` with your project's real, full path:

```json
{
  "mcpServers": {
    "library-db": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-sqlite-server", "python", "server.py"]
    }
  }
}
```

### 4.2 Restart Claude Desktop and ask a real multi-table question

**Fully quit and restart Claude Desktop.** Once it's back, ask a genuine plain-English question that needs more than one table to answer, for example:

> Using the library-db tools, which books are currently checked out and haven't been returned yet? Give me the titles and who has them.

Watch what happens: Claude should call `list_db_tables`, then `describe_db_table` on `books`, `loans`, and `members` to learn the column names, then compose and run its own `SELECT ... JOIN ...` through `query_db` — and answer using the real result, not a guess. This is the actual payoff of the whole project: you never wrote that join yourself.

**🎯 Expected output:** A visible sequence of tool calls — `list_db_tables`, then `describe_db_table` on the relevant tables, then `query_db` with a genuine `JOIN` — followed by an answer naming real, correct book titles and member names.

**🩹 If it's off:** If Claude answers without calling any tools, rephrase to explicitly reference "the library-db tools," same tool-selection nudge as the earlier MCP projects. If the SQL it writes references a column that doesn't exist, check `describe_db_table`'s actual output — a wrong or incomplete schema description is the most likely reason a model would guess a plausible-but-wrong column name.

**✅ Checklist**

- ✅ `library-db` appears in Claude Desktop's tool list after a full restart.
- ✅ Asking the sample question above shows Claude actually calling `list_db_tables`, `describe_db_table`, and `query_db` in sequence, not just answering from memory.
- ✅ The SQL Claude wrote (visible in the expanded tool-call details) is a genuine multi-table join, and the answer matches what you'd get running that query yourself.

**🤔 Socratic Question(s)**

- Claude wrote its own SQL here, without you ever showing it a query to imitate. What in the tools' docstrings and the schema `describe_db_table` returns gave it enough to work from?
- If you asked an ambiguous question — "show me the popular books," say, with no definition of "popular" in your schema — what would you expect Claude to do: guess a definition, ask you to clarify, or something else? Try it.

## ⚠️ Common pitfalls

- **Trusting `table_name` directly in an f-string without checking it against `list_tables()` first.** `PRAGMA table_info(...)` can't take a `?` placeholder for a table name, so it's tempting to just interpolate it — but only after confirming it's a real table name your own code already knows about, never a raw model-supplied string used unchecked.
- **Forgetting the semicolon check.** A keyword filter alone (blocking `DROP`, `DELETE`, etc.) doesn't stop `SELECT * FROM books; DROP TABLE books` if you only scan for keywords in the *first* statement — reject on any semicolon in the query, not just on forbidden keywords.
- **A relative path, or forgetting to fully restart Claude Desktop, in Step 4.** Same two pitfalls as the Build an MCP Server project — Claude Desktop needs an absolute path in the config and only reads it on a full restart, not a window close/reopen.
- **Running the server with plain `python server.py` instead of `uv run python server.py`.** Without `uv run`, you may not be in the virtual environment `uv add` installed `mcp` into, and get a `ModuleNotFoundError`.

## What you just built

A real, if small, instance of a pattern that's genuinely useful beyond a lesson: an LLM client answering natural-language questions about structured data it has never seen before, by discovering the schema and writing its own SQL through tools you exposed — with a real safety boundary between "read" and "write" enforced in your own code, not assumed away. The database here is a toy library, but nothing about `list_db_tables`, `describe_db_table`, or the read-only enforcement in `query_db` is toy-specific — point the same server at a different SQLite file and it works unmodified.

## Where to go from here

- Point this server at a real SQLite database you actually use — a personal finance export, a small project's data, anything you already have as a `.db` file — and see how the same three tools hold up against real schema and real questions.
- Add a row-count or result-size limit to `run_read_only_query`, so a broad `SELECT *` on a much larger table can't return an unreasonably large result to the model.
- Read about MCP **resources** — this project only covers *tools*, but the schema information `describe_db_table` returns is arguably a better fit for a resource (readable data) than a tool (an action). The [SDK's own docs](https://github.com/modelcontextprotocol/python-sdk) cover the difference.

:::tip[Run a fuller version without any local setup — for the tool logic, at least]
[`examples/mcp-sqlite-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-sqlite-server) in the course repo has the full `seed.py`, `db_tools.py`, and `server.py` from this lesson, plus a notebook demoing the query/schema functions in isolation. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), to try all three tools with `uv run mcp dev server.py` — remembering that the real Claude Desktop connection still needs to happen locally, per "Where to run this" above.
:::

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to letting an AI write its own SQL — carefully. 🎓
