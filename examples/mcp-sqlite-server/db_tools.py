"""Plain Python functions for inspecting and querying the sample library database.

Deliberately kept free of any MCP import -- these are just functions that take a
sqlite3 connection and return plain data. server.py wraps each one with
@mcp.tool(); the notebook calls them directly, with no MCP protocol involved at
all, to demo the same logic in isolation.
"""

import re
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "library.db"

# Only a single, standalone SELECT is allowed. This blocks the obvious ways an
# LLM-composed (or user-typed) query could do something other than read data:
# a second statement smuggled in after a semicolon, or a write/DDL keyword
# anywhere in the query. It's a deliberately simple, readable check -- not a
# full SQL parser -- see the lesson's Step 2 for why that's still a real,
# meaningful safety boundary and not just for show.
_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|PRAGMA|VACUUM)\b",
    re.IGNORECASE,
)


class UnsafeQueryError(ValueError):
    """Raised when a query isn't a single, read-only SELECT."""


def _connect(db_path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def list_tables(db_path: Path = DB_PATH) -> list[str]:
    """Return the names of every user table in the database."""
    conn = _connect(db_path)
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
        return [row["name"] for row in rows]
    finally:
        conn.close()


def describe_table(table_name: str, db_path: Path = DB_PATH) -> list[dict]:
    """Return each column's name, declared type, and nullability for a table.

    Raises ValueError if table_name isn't a real table -- checked against
    list_tables() rather than trusted directly, since table_name ends up
    inside an f-string for PRAGMA (which doesn't support "?" placeholders
    for identifiers), and this keeps that safe.
    """
    if table_name not in list_tables(db_path):
        raise ValueError(f"No such table: {table_name!r}. Call list_tables() to see what's available.")

    conn = _connect(db_path)
    try:
        rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
        return [
            {
                "name": row["name"],
                "type": row["type"],
                "nullable": not row["notnull"],
                "primary_key": bool(row["pk"]),
            }
            for row in rows
        ]
    finally:
        conn.close()


def run_read_only_query(sql: str, db_path: Path = DB_PATH) -> list[dict]:
    """Run a single read-only SELECT query and return the matching rows.

    Rejects anything that isn't exactly one SELECT statement: a semicolon
    followed by more SQL, or any write/DDL keyword (INSERT, UPDATE, DELETE,
    DROP, ...) anywhere in the text, raises UnsafeQueryError instead of
    running it. The connection itself is also opened in SQLite's own
    read-only mode as a second, independent layer of defense -- even a
    query that somehow slipped past the text check would still fail at the
    database level.
    """
    stripped = sql.strip().rstrip(";")
    if not stripped:
        raise UnsafeQueryError("Empty query.")
    if ";" in stripped:
        raise UnsafeQueryError("Only a single statement is allowed -- no ';' inside the query.")
    if not stripped.upper().startswith("SELECT"):
        raise UnsafeQueryError("Only SELECT queries are allowed.")
    if _FORBIDDEN_KEYWORDS.search(stripped):
        raise UnsafeQueryError("Query contains a write/DDL keyword, which isn't allowed.")

    # mode=ro opens the SQLite file itself as read-only at the OS level --
    # a real, second enforcement layer independent of the text checks above.
    uri = f"file:{Path(db_path).resolve()}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(stripped).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
