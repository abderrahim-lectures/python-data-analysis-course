---
title: "Build a URL Shortener API"
description: "Build a URL shortener as a real HTTP API: base62 short codes in SQLite, click tracking on every redirect, analytics queries, and a FastAPI layer you can call with curl."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["api", "database", "sqlite"]
learningObjectives:
  - Model links and clicks in a SQLite schema
  - "Generate collision-free short codes with base62"
  - Resolve codes to URLs and record click events
  - "Query click analytics: totals, referrers, and day series"
  - Expose a FastAPI layer with shorten, redirect, and analytics routes
prerequisites:
  - "Python basics (functions, dictionaries, exceptions)"
  - "REST API basics: routes, status codes, JSON"
  - "Installing packages with uv"
---

# 🛠️ 🔗 Build a URL Shortener API

Every link you share in a chat is a short string that hides a longer one, and a redirect that tells whoever owns it exactly how often, from where, and on which day it gets clicked. This project builds that service end to end: base62 short codes stored in SQLite, a click recorded on every redirect, analytics you can query, and finally a real FastAPI layer so you can `curl` your own shortener. It's a small but complete database-backed API, the shape behind many production services.

This assumes Python 101 and a light touch with REST APIs and `curl`, nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Design a SQLite schema for links and click events.
2. Generate collision-free short codes with base62.
3. Resolve a code to its URL while recording a click.
4. Query per-link analytics, totals, referrers, and a day-by-day series.
5. Wrap it all in a FastAPI service you can call with `curl`.

## Where to run this

**Locally with `uv`** is the primary path. A shortener is a *server*: it needs to bind a port and answer HTTP requests, which is what `uvicorn` on your machine does well. The engine steps (1–4) run perfectly fine anywhere, but Step 5's `curl` loop wants a real running server.

**Google Colab, Kaggle Notebooks, and Binder** run the whole engine (SQLite lives happily in a notebook, and the example notebook even exercises the API through FastAPI's `TestClient` without binding a port). The honest caveat: a notebook is a try-it path for the *service* part, you won't leave a long-running server running there, and the SQLite file is ephemeral. Use the badges for the engine + test-client experience, and run `uvicorn` locally when you want the real thing.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/url-shortener/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/url-shortener/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Furl-shortener%2Fnotebook.ipynb)

## Setup

Create the project and install the web layer. The engine uses `sqlite3`, which ships with Python.

```bash
uv init url-shortener
cd url-shortener
uv add fastapi uvicorn
```

```bash
uv run python -c "import fastapi, sqlite3; print('ok')"
```

`sqlite3` is the engine's database, a full SQL database in one file, no server to install. `fastapi` builds the HTTP routes with type-driven validation, and `uvicorn` is the ASGI server that actually binds the port and answers `curl`.

**✅ Checklist**

- ✅ `uv add fastapi uvicorn` finished and the import check prints `ok`.
- ✅ A fresh `url-shortener/` project exists with a `pyproject.toml`.

## Step 1: Design the SQLite schema

A shortener stores two things: the map from code → URL, and every click *on* that code. One `links` table, one `clicks` table, and a foreign key between them.

### 1.1 Create the schema and a connection helper

**👟 Starter hint:** Connect via a small `get_conn()` helper with `row_factory = sqlite3.Row`, and create both tables with `init_db()` using `CREATE TABLE IF NOT EXISTS` so it's safe to call repeatedly.

```python
# shortener.py
import sqlite3
from contextlib import closing
from datetime import datetime

DB = "shortener.db"

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    with closing(get_conn()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS links (
                code       TEXT PRIMARY KEY,
                url        TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS clicks (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                code       TEXT NOT NULL,
                clicked_at TEXT NOT NULL,
                referrer   TEXT
            );
            """
        )

init_db()
print("tables ready")
```

`row_factory = sqlite3.Row` is the quality-of-life line: query results come back as dict-like rows (`row["url"]`) instead of anonymous tuples, so the analytics in Step 4 read like Python, not like a jumble of positions. `code TEXT PRIMARY KEY` makes the code the natural key, you *want* insert collisions to be visible. The `clicks.id` autoincrement is separate, because one link gets many clicks and a click is not a link. Wrapping everything in `closing(get_conn())` guarantees the connection closes even if a query raises.

**🎯 Expected output:** `tables ready` printed, and a `shortener.db` file appears in the project folder. Running again prints the same line without error.

**🩹 If it's off:** If the second run raises `OperationalError: table already exists`, the `IF NOT EXISTS` clauses are missing. If `row["url"]` misbehaves later, `row_factory` is set per-connection, verify it's inside `get_conn()`, not only in one calling function. If the file appears elsewhere, connect uses a relative path and your working directory differs, print `DB` to confirm.

### 1.2 Verify the schema

**✅ Checklist**

- ✅ Running `init_db()` twice is harmless.
- ✅ `shortener.db` exists and `sqlite3 shortener.db '.tables'` lists `clicks` and `links`.
- ✅ You can name the three columns of `links` and the four of `clicks`.

**🤔 Socratic Question(s)**

- The clicks table stores `code` but not the URL itself. What does that design choice buy you, and what must stay true about `code` values for the join to be reliable?
- `clicks.id` is `AUTOINCREMENT`, while `links.code` is a text primary key. When is an integer id essential, and when is a natural string key (like `code`) the more honest choice?

## Step 2: Generate and create short codes

Short codes come from counting: every new link gets the next number, and base62 encodes that number into a short, URL-safe string (`1`, `2`, …, `a`, `b`, …). This step adds the encoder and the `create_link` function.

### 2.1 Write base62 encoding and `create_link`

**👟 Starter hint:** Use the alphabet of 62 symbols, `divmod` to reduce any integer to base-62 digits, and derive the next code from the table's current row count so it never collides.

```python
# shortener.py (continued)
ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

def encode_base62(n: int) -> str:
    if n == 0:
        return ALPHABET[0]
    chars = []
    while n > 0:
        n, remainder = divmod(n, 62)
        chars.append(ALPHABET[remainder])
    return "".join(reversed(chars))

def create_link(url: str, custom: str | None = None) -> str:
    with closing(get_conn()) as conn:
        if custom is None:
            row = conn.execute("SELECT COUNT(*) FROM links").fetchone()
            code = encode_base62(row[0] + 1)
        else:
            code = custom
        conn.execute(
            "INSERT INTO links (code, url, created_at) VALUES (?, ?, ?)",
            (code, url, datetime.now().isoformat(timespec="seconds")),
        )
    return code

print(create_link("https://example.com/very/long/path"))
print(create_link("https://python.org", custom="py"))
for i in range(1, 140):
    assert len(encode_base62(i)) <= 2
print("first 138 codes fit in 2 chars")
```

`divmod(n, 62)` is the whole algorithm: it extracts one base-62 digit per loop (`remainder`) and shrinks `n` by a factor of 62, until `n` hits zero, the same "carry" math behind counting in any base. Reversing the collected digits puts the most significant one first, so code ordering matches numeric ordering. `SELECT COUNT(*) from links` is a deliberately simple id source: monotonically increasing as links are added, hence never colliding with code `A`. Base62's real payoff is density, 138 links fit in two characters, and the `assert` loop proves it empirically.

**🎯 Expected output:** `A`, then `py`, then the assert loop passing silently (138 codes ≤ 2 chars), no crashes.

**🩹 If it's off:** If codes come back in wrong order (`B` before `A`), the `reversed(chars)` is missing. If the same `A` appears twice, `COUNT(*)` is being read off the wrong table or the number isn't incremented by 1. If a custom code collides, `sqlite3.IntegrityError` escapes unhandled, Step 5's route will need to catch it, but engine-level, that error *is* the honest "taken" signal.

### 2.2 Verify code generation

**✅ Checklist**

- ✅ Codes are base62: letters first, digits later, URL-safe.
- ✅ The first 138 codes are 2 chars or fewer, and 62²+ codes still work if you insert that many.
- ✅ Custom codes insert as-is without touching the counter.

**🤔 Socratic Question(s)**

- Codes are derived from *how many links exist*, so deleting a link never reclaims its code. Is that a bug or a deliberate property, and what would `encode_base62(COUNT(*)+1)` break if codes were ever deleted?
- The alphabet starts with uppercase letters. How does code ordering change if you reordered the alphabet (lowercase first), and does anything downstream depend on that ordering?

## Step 3: Resolve codes to URLs and track clicks

A shortener that doesn't count clicks is half a service. This step resolves a code to its URL, the operation a redirect performs, and records one click row for every resolution, so the analytics in Step 4 have real data.

### 3.1 Write `resolve_url`

**👟 Starter hint:** Read the URL for the code; if it exists, insert a click row with a timestamp and caller-supplied referrer, and return the URL. If it doesn't, return `None` so the caller can raise a 404.

```python
# shortener.py (continued)
def resolve_url(code: str, referrer: str | None = None) -> str | None:
    with closing(get_conn()) as conn:
        row = conn.execute(
            "SELECT url FROM links WHERE code = ?", (code,)
        ).fetchone()
        if row is None:
            return None
        conn.execute(
            "INSERT INTO clicks (code, clicked_at, referrer) VALUES (?, ?, ?)",
            (code, datetime.now().isoformat(timespec="seconds"), referrer),
        )
    return row["url"]

# simulate a redirect being hit three times
resolve_url("A")
resolve_url("A", referrer="x.com")
resolve_url("A")
print("clicks:", resolve_url("missing-code"))
```

The ordering is the design: *look up, record, return*. Looking up first lets a bad code return `None` early without polluting the clicks table; recording *inside* the same connection ensures the click and the read see the same data; and returning the URL is what a redirect handler will hand to `RedirectResponse`. The referrer parameter is passed in by the HTTP layer, not guessed here, so every click row carries who sent the visitor.

**🎯 Expected output:** `clicks: None`, the three `resolve_url("A")` calls recorded three click rows, and `resolve_url("missing-code")` returned `None` instead of crashing.

**🩹 If it's off:** If a bad code crashes with a KeyError or similar, the function is indexing `row["url"]` before checking `row is None`. If clicks never accumulate in the table, the `INSERT` is missing its commit path (a plain `conn.execute` inside `closing` commits on close, drop the connection context and it silently rolls back). If `resolve_url` mutates the shared database during the *lookup* call, you have `UPDATE` instead of `INSERT` in the click path.

### 3.2 Verify resolution and click tracking

**✅ Checklist**

- ✅ Bad codes return `None`; good codes return the stored URL.
- ✅ Each good resolution adds exactly one row to `clicks`.
- ✅ A stored referrer lands in the `referrer` column when provided.

**🤔 Socratic Question(s)**

- Counting clicks *inside* a redirect's resolution means every redirect needs a database write. What would change about latency under heavy traffic, and what batching or caching strategy would a million-clicks-a-day service add here first?
- The referrer comes from the caller. A malicious caller can forge `referrer="victim.example"`. What does a real URL shortener do about that, and what would you print in analytics if you cared?

## Step 4: Query click analytics

Now the real payoff: aggregate the recorded clicks into the three numbers a marketer actually asks for, total, referrers, and a day-by-day series, straight from SQL with no Python loop over data.

### 4.1 Write the analytics query

**👟 Starter hint:** Run three SQL aggregates keyed on `code`: a `COUNT(*)`, a `GROUP BY referrer ORDER BY count`, and a `substr(clicked_at,1,10)` string-truncation for the day series.

```python
# shortener.py (continued)
def click_stats(code: str) -> dict:
    with closing(get_conn()) as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM clicks WHERE code = ?", (code,)
        ).fetchone()[0]
        referrers = conn.execute(
            "SELECT referrer, COUNT(*) AS n FROM clicks "
            "WHERE code = ? GROUP BY referrer ORDER BY n DESC LIMIT 10",
            (code,),
        ).fetchall()
        per_day = conn.execute(
            "SELECT substr(clicked_at, 1, 10) AS day, COUNT(*) AS n "
            "FROM clicks WHERE code = ? GROUP BY day ORDER BY day",
            (code,),
        ).fetchall()
    return {
        "code": code,
        "total_clicks": total,
        "top_referrers": [dict(r) for r in referrers],
        "clicks_per_day": [dict(r) for r in per_day],
    }

print(click_stats("A"))
```

Three aggregates, one shape. `total` is the headline number; `GROUP BY referrer … ORDER BY n DESC` ranks where traffic comes from; and `substr(clicked_at, 1, 10)` truncates the ISO timestamp to its date (`2026-09-06`), which is the bargain-basement way to get a day-series without a date function, SQLite is happy to `GROUP BY` that string. Each result row is `dict(r)` so the output is plain JSON-serializable dictionaries, ready for Step 5's API.

**🎯 Expected output:** A dict with `total_clicks` = 3 for code `A`, two referrer entries (`x.com` then `None`-bucket), and a `clicks_per_day` list with one day row counting all 3.

**🩹 If it's off:** If `total_clicks` stays 0, the insert in Step 3 isn't committing (see Step 3's pitfall). If `referrer` shows a `None` row that refuses to group with others, `GROUP BY referrer` treats SQL `NULL` distinctly from the empty string, coalesce with `IFNULL` if you want them merged. If the day series buckets everything into one day, `substr(clicked_at,1,10)` is slicing the wrong format.

### 4.2 Verify analytics

**✅ Checklist**

- ✅ `click_stats("A")` returns total, top referrers, and a day series for the 3 recorded clicks.
- ✅ Each referrer count matches the number of `resolve_url` calls with that referrer.
- ✅ The returned dict converts to JSON without a custom serializer.

**🤔 Socratic Question(s)**

- The slices of `referrer`, including `NULL`, leak through into analytics. What does a `GROUP BY referrer` row of `null: 0` imply, and would you *hide* that row or label it for the user?
- These three aggregates run as three separate queries. What single `GROUP BY` + `UNION` could produce all three, and when would the extra SQL complexity be worth the one round-trip?

## Step 5: Expose it as a FastAPI service

The engine is complete, now it becomes something you can `curl`. This step wraps the three operations in HTTP routes: `POST /shorten`, `GET /u/{code}` (which redirects, and records the click), and `GET /analytics/{code}`.

### 5.1 Write the FastAPI app

**👟 Starter hint:** Build the routes on top of the already-written engine functions, map "bad code" to an HTTP `404`, catch the custom-code `IntegrityError` as a `409`, and keep a `__main__` guard so `uvicorn` can run the app.

```python
# shortener.py (continued)
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
import uvicorn

app = FastAPI(title="URL Shortener")

@app.post("/shorten")
def shorten(url: str, custom: str | None = None) -> dict:
    code = create_link(url, custom=custom)
    return {"short_url": f"/u/{code}", "code": code}

@app.get("/u/{code}")
def go(code: str):
    url = resolve_url(code, referrer=None)
    if url is None:
        raise HTTPException(status_code=404, detail="Unknown short code.")
    return RedirectResponse(url)

@app.get("/analytics/{code}")
def analytics(code: str) -> dict:
    return click_stats(code)

if __name__ == "__main__":
    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

Each route is a one-liner because the engine already owns the logic. `@app.post("/shorten")` lets FastAPI take the URL as a query parameter today and a JSON body tomorrow; `@app.get("/u/{code}")` is the redirect that Step 3's click-tracking powers, every hit on this route is a click; and `HTTPException(404)` is how a missing code surfaces as a *web* error rather than a Python `None`. Running `uvicorn.run(app, ...)` behind `if __name__ == "__main__":` keeps `shortener.py` importable by tests and notebooks while still being a runnable server.

**🎯 Expected output:** Running `uv run python shortener.py` starts a server on `127.0.0.1:8000`. In another terminal, `curl -s "http://127.0.0.1:8000/shorten?url=https://example.com/x"` returns `{"short_url":"/u/B","code":"B"}` (or similar), `curl -L` on `/u/B` follows the redirect, and `/analytics/B` reports real click counts.

**🩹 If it's off:** If `curl` gets `Connection refused`, the server isn't running or it bound a different port, check `uvicorn.run`'s `port`. If `POST /shorten` returns `422 Unprocessable Entity`, the `url` parameter wasn't provided or the type annotation is wrong, `url: str` is required, so a misspelled query key 422s. If `/u/{code}` with a custom code raises 500 instead of 409 on duplicates, the `IntegrityError` isn't being caught in `create_link`, wrap the insert.

### 5.2 Verify the full service

**✅ Checklist**

- ✅ `uv run python shortener.py` starts the server on port 8000.
- ✅ `curl` on `/shorten`, `/u/{code}`, and `/analytics/{code}` returns sensible JSON/redirects.
- ✅ Following `/u/{code}` increments that code's `total_clicks`.
- ✅ An unknown code returns HTTP 404 with a JSON detail.

**🤔 Socratic Question(s)**

- Every hit on `/u/{code}` records a click, including humans who click the shortened link by accident. What would you add to distinguish "real" clicks (bot filters, first-click attribution, geo) and where would that data go, if the schema were reopened?
- `shorten` today takes the URL as a query parameter, which leaks URLs into server logs. What does switching to a `POST` JSON body change about caching, logging, and how browsers send the request?

## ⚠️ Common pitfalls

- **Forgetting `row_factory` per connection.** It's set inside `get_conn()`, so any function that creates its own `sqlite3.connect` gets tuples back and `row["url"]` crashes. Fix: all access goes through `get_conn()`.
- **Not committing the click.** A plain `INSERT` on a connection that never closes cleanly can roll back silently, leaving `resolve_url` returning URLs but analytics at zero. Fix: use the `closing(get_conn())` context so close-time commit always runs.
- **Colliding custom codes.** `INSERT` with an existing code raises `sqlite3.IntegrityError`, the signal is honest but raw. Fix: catch it in `create_link` and map it to a `409 Conflict` in Step 5.
- **Codes that never stop growing.** `COUNT(*) + 1` produces codes only for *existing* rows; if you delete links, codes get reused, breaking old redirects. Fix: reserve the code by uniqueness, or keep a monotonic counter in its own table.
- **Trusting referrer headers.** Referrers come from the caller and are forgeable. Fix: treat them as the marketing hint they are, and never let a claimed `referrer` drive security decisions.

## What you just built

A genuinely database-backed URL shortener: base62 codes, SQLite persistence, click tracking on every redirect, SQL-powered analytics, and a FastAPI service you drove yourself with `curl`. The transferable skill is the *database-backed API loop*, schema first, engine functions second, HTTP wrapper last, which is the same three-layer shape behind todo apps, dashboards, and most configurations of "collect data, store it, expose it."

:::tip[Run a fuller version without any local setup]
[`examples/url-shortener/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/url-shortener) in the course repo is a fuller version of the code above, with `POST` body handling, expiry support, and a `TestClient`-driven demo you can run entirely inside a notebook. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a `GET /latest` route that lists the most recent links with their click totals, one `ORDER BY created_at DESC LIMIT 10` query.
- Implement expiry: a column storing `expires_at`, and `resolve_url` returns `404` when `datetime.now()` is past it.
- Rate-limit `/shorten` per IP so a scraped key can't mint a thousand links a second.
- Generate QR codes for each short URL (the `qrcode` library is one install) and serve them from `/u/{code}.png`.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓