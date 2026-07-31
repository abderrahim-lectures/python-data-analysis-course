"""Builds a small, realistic SQLite sample database: a little neighborhood library.

Run this once before starting the server -- it creates library.db (or removes and
rebuilds it, if it already exists) with three related tables: books, members, and
loans. Nothing here is MCP-specific; it's just plain sqlite3, the same standard
library module the server itself uses to open the database.
"""

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

AUTHORS = [
    (1, "Ursula K. Le Guin", "USA"),
    (2, "Italo Calvino", "Italy"),
    (3, "Yoko Ogawa", "Japan"),
    (4, "Chimamanda Ngozi Adichie", "Nigeria"),
    (5, "Jorge Luis Borges", "Argentina"),
]

BOOKS = [
    (1, "The Left Hand of Darkness", 1, 1969, "Science Fiction"),
    (2, "The Dispossessed", 1, 1974, "Science Fiction"),
    (3, "Invisible Cities", 2, 1972, "Fiction"),
    (4, "If on a winter's night a traveler", 2, 1979, "Fiction"),
    (5, "The Memory Police", 3, 1994, "Fiction"),
    (6, "Hotel Iris", 3, 1996, "Fiction"),
    (7, "Half of a Yellow Sun", 4, 2006, "Historical Fiction"),
    (8, "Americanah", 4, 2013, "Fiction"),
    (9, "Ficciones", 5, 1944, "Short Stories"),
    (10, "The Aleph", 5, 1949, "Short Stories"),
]

MEMBERS = [
    (1, "Amara Okafor", "2024-01-15"),
    (2, "Kenji Watanabe", "2024-02-03"),
    (3, "Sofia Rossi", "2024-03-21"),
    (4, "Liam O'Connor", "2024-05-09"),
    (5, "Priya Sharma", "2024-06-30"),
]

LOANS = [
    (1, 1, 1, "2024-06-01", "2024-06-15"),
    (2, 3, 2, "2024-06-05", "2024-06-19"),
    (3, 5, 3, "2024-06-10", None),
    (4, 7, 4, "2024-06-12", "2024-06-26"),
    (5, 2, 1, "2024-07-01", None),
    (6, 9, 5, "2024-07-03", "2024-07-17"),
    (7, 4, 2, "2024-07-08", None),
    (8, 6, 3, "2024-07-10", "2024-07-24"),
    (9, 8, 4, "2024-07-12", None),
    (10, 10, 5, "2024-07-15", None),
]


def build_database(db_path: Path = DB_PATH) -> None:
    """Create (or recreate) the sample library database at db_path."""
    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(SCHEMA)
        conn.executemany("INSERT INTO authors VALUES (?, ?, ?)", AUTHORS)
        conn.executemany("INSERT INTO books VALUES (?, ?, ?, ?, ?)", BOOKS)
        conn.executemany("INSERT INTO members VALUES (?, ?, ?)", MEMBERS)
        conn.executemany("INSERT INTO loans VALUES (?, ?, ?, ?, ?)", LOANS)
        conn.commit()
    finally:
        conn.close()


if __name__ == "__main__":
    build_database()
    print(f"Built sample database at {DB_PATH}")
