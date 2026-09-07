---
title: "Build an ETL Pipeline"
description: "Extract CSV and JSON sources, clean and join them into records, aggregate revenue, and load idempotently into SQLite."
difficulty: "intermediate"
estimatedMinutes: 85
tags: ["cli", "csv", "json", "sqlite", "pipeline"]
prerequisites:
  - "Python basics (lists, dictionaries, loops, functions)"
  - "Comfortable with csv/json files and the terminal"
learningObjectives:
  - "Extract data from CSV and JSON sources into plain records"
  - "Clean and join two sources, flagging every skipped row"
  - "Aggregate line totals by city into a revenue report"
  - "Load records into SQLite idempotently with primary keys"
  - "Guard the pipeline against a missing source and re-run safely"
---

# 🔄 Build an ETL Pipeline

Every real data job looks like this: take orders from a CSV and customers from a JSON, join them, drop the rows that don't belong, sum things up, and write the result somewhere a tool can query. That pattern — **Extract, Transform, Load** — is what this project builds with nothing but the standard library: a CSV extractor, a JSON extractor, a transform that cleans and joins with every skip reported, aggregation that answers "revenue by city", and a SQLite load that is *idempotent*: run it five times, still exactly four rows. The final step hardens the whole thing against its most common production failure — a missing source file — without leaving the warehouse in a half-written state. No pandas. No framework. Just `csv`, `json`, and `sqlite3` doing a real job.

This assumes Python 101 — lists, dicts, loops, functions — plus comfortable file reading and a terminal. Nothing here needs numpy or pandas. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Extract a `orders.csv` and a `customers.json` into plain Python records.
2. Transform: clean the rows, join in customer names and cities, compute `line_total` — and report the two skipped orders.
3. Aggregate revenue by city, sorted highest first.
4. Load the cleaned records into SQLite with an idempotent upsert — run it twice, still 4 rows.
5. Harden extraction against a missing file and re-run the full pipeline safely.

## Where to run this

**Locally with `uv`** is the recommended path — an ETL job is a file-out pipeline (CSV/JSON in, SQLite out) and SQLite files belong on your terminal.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work — the notebook at [`examples/etl-pipeline/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.ipynb) runs the identical ETL on the bundled sample sources in memory.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fetl-pipeline%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces "install Python, then pip, then a virtual environment tool" — and this project is pure standard library.

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
uv init etl-pipeline
cd etl-pipeline
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `etl-pipeline/` exists with a `pyproject.toml`.
- ✅ `python -c "import csv, json, sqlite3"` succeeds — the whole stack, stdlib only.

## Step 1: Extract the two sources

ETL's first act is *just* reading: the CSV orders arrive as dicts via `csv.DictReader`, the JSON customers as a list via `json.load`. Nothing is cleaned yet — extraction is intentionally dumb, so the transform owns every judgment and the two never blur. Real pipelines extract first and *fail hard if a source is missing* later (Step 5); here, Step 1 proves both readers.

### 1.1 Write the source files and the extractor

**👟 Starter hint:** One function reading a CSV, one `json.load` reading the JSON, returning plain records:

```bash
cat > orders.csv <<'EOF'
order_id,customer_id,product,qty,price,status
o1,c1,laptop,1,1200.00,delivered
o2,c2,mouse,2,25.00,delivered
o3,c1,monitor,1,300.00,delivered
o4,c3,keyboard,1,60.00,cancelled
o5,c2,laptop,1,1200.00,pending
o6,c4,usb_cable,3,10.00,delivered
EOF
```

```bash
cat > customers.json <<'EOF'
[
  {"customer_id": "c1", "name": "Ada Lovelace", "city": "London"},
  {"customer_id": "c2", "name": "Grace Hopper", "city": "New York"},
  {"customer_id": "c3", "name": "Alan Turing", "city": "Manchester"}
]
EOF
```

```python
# extract.py
import csv
import json

def extract() -> tuple[list[dict], list[dict]]:
    with open("orders.csv", newline="") as f:
        orders = list(csv.DictReader(f))
    with open("customers.json") as f:
        customers = json.load(f)
    return orders, customers

if __name__ == "__main__":
    orders, customers = extract()
    print(f"extracted {len(orders)} orders, {len(customers)} customers")
    print("first order:", orders[0])
    print("first customer:", customers[0])
```

`csv.DictReader` consumes one header row for the keys, so every row comes out already field-named — `{"order_id": "o1", ...}` — and `list(...)` snapshots all six rows at once. `json.load` parses the array into a list of dicts. The return type hints (a tuple of two lists) are the contract downstream: transform receives exactly what it expects, and anything else breaks at the call site, loudly. Note the `order_id: o1` and `customer_id: c1` values are still *strings* — extraction does no math, no float conversion, no judgment.

**🎯 Expected output:**

```
extracted 6 orders, 3 customers
first order: {'order_id': 'o1', 'customer_id': 'c1', 'product': 'laptop', 'qty': '1', 'price': '1200.00', 'status': 'delivered'}
first customer: {'customer_id': 'c1', 'name': 'Ada Lovelace', 'city': 'London'}
```

**🩹 If it's off:** If `customers` prints as a string or dict instead of a list, `customers.json` isn't a top-level array (the `[` opening line) — `json.load` gives back whatever the file actually is. If `orders` is `[]`, the CSV has no rows with values or the header row is missing the trailing newline — print `open("orders.csv").read()` to see exactly what `DictReader` saw.

### 1.2 Verify the extractor

**✅ Checklist**

- ✅ 6 orders and 3 customers extract; o1/o2/o3/o5 carry the same keys as the header row.
- ✅ `price` is still the string `"1200.00"` — no math at extract time.
- ✅ `customers.json` loads as a list of dicts, one per customer.

**🤔 Socratic Question(s)**

- Extraction is "dumb" on purpose, but it still chose a shape: dict rows with string values. What would a *schema-typed* extractor (numbers parsed, enums enforced) change about downstream trust — and at what cost when the CSV vendor renames a column?
- `csv.DictReader` defaults to comma. Name the two values this step already hard-codes implicitly (delimiter, quoting) and how a real job would make them *explicit* pipeline inputs instead of file-format accidents.

## Step 2: Transform — clean and join

The transform owns the judgment: `cancelled` orders don't count as revenue, an order whose customer doesn't exist can't be joined, `qty ≤ 0` or `price < 0` is garbage, and every skip gets *reported* — never silently swallowed. Rows that pass become enriched records with customer names, cities, and a computed `line_total`. Two of the six orders are rejected exactly as designed, and the pipeline says so.

### 2.1 Write the cleaner/joiner

**👟 Starter hint:** Build the `customer_by_id` lookup first (a dict), then loop, decide *skip or keep*, and report every skip:

```python
# transform.py
import csv
import json

CLEAN_STATUSES = {"delivered", "pending"}

def transform(orders: list[dict], customers: list[dict]) -> tuple[list[dict], list[tuple]]:
    customer_by_id = {c["customer_id"]: c for c in customers}

    cleaned = []
    skipped = []
    for o in orders:
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES:
            skipped.append((o["order_id"], "cancelled"))
            continue
        if customer is None:
            skipped.append((o["order_id"], "no customer"))
            continue
        qty = float(o["qty"])
        price = float(o["price"])
        if qty <= 0 or price < 0:
            skipped.append((o["order_id"], "invalid qty/price"))
            continue
        cleaned.append({
            "order_id": o["order_id"],
            "customer_id": o["customer_id"],
            "customer_name": customer["name"],
            "city": customer["city"],
            "product": o["product"],
            "qty": qty,
            "price": price,
            "line_total": round(qty * price, 2),
            "status": o["status"],
        })
    return cleaned, skipped

if __name__ == "__main__":
    orders = list(csv.DictReader(open("orders.csv", newline="")))
    customers = json.load(open("customers.json"))
    cleaned, skipped = transform(orders, customers)

    print(f"cleaned: {len(cleaned)}  skipped: {len(skipped)}")
    for r in cleaned:
        print(f"  {r['order_id']} {r['customer_name']:<14} {r['product']:<10} "
              f"{r['qty']:.0f} x ${r['price']:.2f} = ${r['line_total']:.2f} ({r['status']})")
    print("skipped:", skipped)
```

The `customer_by_id` dict is the join: `customer_by_id.get(o["customer_id"])` turns a customer-CSV lookup from O(n) per order into O(1), and `None` doubles as the "dangling" signal for o6. The skip list is the audit trail — `("o4", "cancelled")`, `("o6", "no customer")` — and it's returned alongside the clean rows, so analysis can *also* be done on what was thrown away. `float()` conversions happen here, at the boundary: from "somewhat trusted strings" to numbers-under-our-control, right before arithmetic.

**🎯 Expected output:**

```
cleaned: 4  skipped: 2
  o1 Ada Lovelace   laptop     1 x $1200.00 = $1200.00 (delivered)
  o2 Grace Hopper   mouse      2 x $25.00 = $50.00 (delivered)
  o3 Ada Lovelace   monitor    1 x $300.00 = $300.00 (delivered)
  o5 Grace Hopper   laptop     1 x $1200.00 = $1200.00 (pending)
skipped: [('o4', 'cancelled'), ('o6', 'no customer')]
```

**🩹 If it's off:** If o6 appears in `cleaned` with an empty name, the `continue` after `customer is None` is missing and `customer["name"]` hits `None` — the skip must `continue`, not fall through. If nothing is skipped at all, `CLEAN_STATUSES` is missing `"pending"` — wait, that skips o5, not cancels o4 — so re-check the `"cancelled"` string against the CSV's actual `status` value.

### 2.2 Verify the transform

**✅ Checklist**

- ✅ 4 clean / 2 skipped; o1/o2/o3/o5 get real customer names and cities.
- ✅ o4 (cancelled) and o6 (unknown customer) appear in `skipped` with reasons.
- ✅ `line_total` = `qty × price`, rounded to 2 decimals: o2 = `2 × 25 = $50.00`.

**🤔 Socratic Question(s)**

- o6 has a *never-defined* customer id — a foreign-key violation the CSV side can't fix. Where should the authoritative "who is c4" record live, and which side of the pipeline (extract, transform, or the customers source) *should* have caught it?
- A skip reason is a string (`"cancelled"`). If the vendor changed the status vocabulary next month (`"refunded"`, `"reversed"`), every new value silently *passes* the `not in CLEAN_STATUSES` check as revenue. What's the conservative default for an unknown status — and what does the skip audit trail give you that a silent count never would?

## Step 3: Aggregate revenue by city

With clean records in hand, aggregation answers the business question: *who's driving revenue?* A `defaultdict(float)` accumulates `line_total` per city, and sorting by revenue desc puts London first. This is the transform's second act — same cleaned list, new shape, no re-cleaning.

### 3.1 Write the city aggregation

**👟 Starter hint:** `by_city[record["city"]] += record["line_total"]` over the cleaned rows, then `sorted(..., reverse=True)`:

```python
# aggregate.py
import csv
import json
from collections import defaultdict

CLEAN_STATUSES = {"delivered", "pending"}

def transform(orders: list[dict], customers: list[dict]) -> list[dict]:
    customer_by_id = {c["customer_id"]: c for c in customers}
    cleaned = []
    for o in orders:
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES or customer is None:
            continue
        qty, price = float(o["qty"]), float(o["price"])
        if qty <= 0 or price < 0:
            continue
        cleaned.append({"order_id": o["order_id"], "customer_id": o["customer_id"],
                        "customer_name": customer["name"], "city": customer["city"],
                        "product": o["product"], "qty": qty, "price": price,
                        "line_total": round(qty * price, 2), "status": o["status"]})
    return cleaned

def revenue_by_city(records: list[dict]) -> dict:
    by_city = defaultdict(float)
    for r in records:
        by_city[r["city"]] += r["line_total"]
    return dict(by_city)

if __name__ == "__main__":
    orders = list(csv.DictReader(open("orders.csv", newline="")))
    customers = json.load(open("customers.json"))
    cleaned = transform(orders, customers)
    by_city = revenue_by_city(cleaned)

    print("== revenue by city ==")
    for city, revenue in sorted(by_city.items(), key=lambda kv: kv[1], reverse=True):
        print(f"  {city:<10} ${revenue:>9,.2f}")
    print(f"\ntotal revenue: ${sum(by_city.values()):,.2f}")
```

`defaultdict(float)` is the classic accumulator: an unknown city key is born as `0.0` and incremented from there. `sum(by_city.values())` re-derives the total from the aggregation itself, so the grand total can never disagree with the by-city rows — a single source of truth for both. And `sorted(..., key=lambda kv: kv[1], reverse=True)` looks at `(city, revenue)` pairs and sorts on the second element descending — rank, not alphabetical.

**🎯 Expected output:**

```
== revenue by city ==
  London     $ 1,500.00
  New York   $ 1,250.00

total revenue: $2,750.00
```

**🩹 If it's off:** If London and New York swap order, `reverse=True` is missing (ascending rank). If Manchester shows `$ 0.00`, o4's cancelled sale leaked in as a zero — or the two aren't even appearing because the *whole* clean list is empty (a transform bug from Step 2 would surface here as `total revenue: $0.00`).

### 3.2 Verify the aggregation

**✅ Checklist**

- ✅ `London 1500.00` (o1 + o3), `New York 1250.00` (o2 + o5), sorted revenue-descending.
- ✅ `total revenue: $2,750.00` matches `sum` of the two rows by hand.
- ✅ Manchester's cancelled order contributes nothing — cancelled/city membership are unrelated judgments.

**🤔 Socratic Question(s)**

- Zero-revenue cities are *absent from the map*, not listed as zero. If the question were "every city, including none" (a Manchester with only cancelled orders), what second data structure would you need, and what does the reporting difference say about aggregates filling in zeros?
- `revenue_by_city` sums `line_total`, which sums `qty × price`. Name two places an earlier step could have *silently* corrupted this number (float rounding, price-as-string) — and which of the two the transform's `round(..., 2)` actually guards.

## Step 4: Load into SQLite, idempotently

Loading is where pipelines go wrong: run a job twice and every order becomes two rows. The fix is a **primary key** — `order_id` declared `TEXT PRIMARY KEY` — plus `INSERT OR REPLACE`, SQLite's upsert. Re-running the exact same load produces the exact same table: exactly 4 orders, 0 duplicates, both times. That's idempotency, and it's the property that makes scheduled ETL trustworthy.

### 4.1 Write the schema and the loader

**👟 Starter hint:** `CREATE TABLE IF NOT EXISTS` with the PK, and `conn.executemany` with a named `:key` INSERT:

```python
# load.py
import csv
import json
import sqlite3

CLEAN_STATUSES = {"delivered", "pending"}

def build_cleaned() -> list[dict]:
    customer_by_id = {}
    for c in json.load(open("customers.json")):
        customer_by_id[c["customer_id"]] = c
    cleaned = []
    for o in csv.DictReader(open("orders.csv", newline="")):
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES or customer is None:
            continue
        qty, price = float(o["qty"]), float(o["price"])
        if qty <= 0 or price < 0:
            continue
        cleaned.append({"order_id": o["order_id"], "customer_id": o["customer_id"],
                        "customer_name": customer["name"], "city": customer["city"],
                        "product": o["product"], "qty": qty, "price": price,
                        "line_total": round(qty * price, 2), "status": o["status"]})
    return cleaned

def create_schema(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id      TEXT PRIMARY KEY,
            customer_id   TEXT,
            customer_name TEXT,
            city          TEXT,
            product       TEXT,
            qty           REAL,
            price         REAL,
            line_total    REAL,
            status        TEXT
        )
    """)

def load(conn: sqlite3.Connection, records: list[dict]) -> int:
    conn.executemany("""
        INSERT OR REPLACE INTO orders
        (order_id, customer_id, customer_name, city, product, qty, price, line_total, status)
        VALUES (:order_id, :customer_id, :customer_name, :city, :product, :qty, :price, :line_total, :status)
    """, records)
    conn.commit()
    return len(records)

if __name__ == "__main__":
    conn = sqlite3.connect("warehouse.db")
    create_schema(conn)
    n = load(conn, build_cleaned())
    rows = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    print(f"rows after load #1: {rows}")
    conn.close()
```

Two details carry the idempotency. First, `order_id TEXT PRIMARY KEY` — SQLite enforces uniqueness, and any real duplicate *replacing* the old PK row is the entire upside point. Second, `:order_id` etc. are named params bound by dict — a parameterized INSERT that positions fields by name, so a column shuffle in the dict never shifts columns sideways in the table. `CREATE TABLE IF NOT EXISTS` lets the same script run against a fresh database and a pre-existing one without error. `conn.commit()` is what makes the whole batch durable.

**🎯 Expected output:**

```
rows after load #1: 4
```

**🩹 If it's off:** If the count shows `0`, `build_cleaned()` returned `[]` — the connect/SQLite is fine, your transform from Step 2 silently emptied (check the `continue` paths). If the count rises each run (4 → 8 → 12), your INSERT has no `OR REPLACE` and the PK is missing from the schema — re-check `CREATE TABLE`: without `order_id TEXT PRIMARY KEY`, nothing dedupes.

### 4.2 Verify idempotency by re-running

**👟 Starter hint:** Run the same load again against the same database and inspect — duplicates must stay 0 and revenue must not double:

```python
# rerun_check.py
import csv, json, sqlite3

CLEAN_STATUSES = {"delivered", "pending"}

def transform(orders, customers):
    customer_by_id = {c["customer_id"]: c for c in customers}
    cleaned = []
    for o in orders:
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES or customer is None:
            continue
        qty, price = float(o["qty"]), float(o["price"])
        if qty <= 0 or price < 0:
            continue
        cleaned.append({"order_id": o["order_id"], "customer_id": o["customer_id"],
                        "customer_name": customer["name"], "city": customer["city"],
                        "product": o["product"], "qty": qty, "price": price,
                        "line_total": round(qty * price, 2), "status": o["status"]})
    return cleaned

def load(conn, records):
    conn.executemany("""INSERT OR REPLACE INTO orders
        (order_id, customer_id, customer_name, city, product, qty, price, line_total, status)
        VALUES (:order_id, :customer_id, :customer_name, :city, :product, :qty, :price, :line_total, :status)""", records)
    conn.commit()

orders = list(csv.DictReader(open("orders.csv", newline="")))
customers = json.load(open("customers.json"))
cleaned = transform(orders, customers)

conn = sqlite3.connect("warehouse.db")
conn.execute("""CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT, city TEXT,
    product TEXT, qty REAL, price REAL, line_total REAL, status TEXT)""")
load(conn, cleaned)  # load #2 on the same database

n = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
dups = conn.execute("""SELECT COUNT(*) FROM (
    SELECT order_id FROM orders GROUP BY order_id HAVING COUNT(*) > 1)""").fetchone()[0]
total = conn.execute("SELECT ROUND(SUM(line_total),2) FROM orders").fetchone()[0]
print("rows after load #2 (all records):", n)
print("duplicate check:", dups)
print("total revenue in db:", total)
conn.close()
```

**🎯 Expected output:**

```
rows after load #2 (all records): 4
duplicate check: 0
total revenue in db: 2750.0
```

**🩹 If it's off:** If `duplicate check` shows anything but `0`, the load path you're re-running differs from Step 4.1's (e.g. one script has `OR REPLACE`, the other plain insert). If `total revenue` is `5500.0`, the upsert isn't replacing — drop the table with `conn.execute("DROP TABLE IF EXISTS orders")` and re-run 4.1 so the schema gets its PK back.

### 4.3 Verify the load semantics

**✅ Checklist**

- ✅ First load → 4 rows; second load → still 4 rows; duplicate count 0.
- ✅ `SUM(line_total) = 2750.0` — unchanged by the re-run, exactly the by-city total from Step 3.
- ✅ An order that *changed* (say o1's qty) gets replaced, not doubled, because `order_id` is the PK.

**🤔 Socratic Question(s)**

- `INSERT OR REPLACE` deletes-and-reinserts the old PK row. If the upstream cleaned an o1 `price` from `1200.00` to `1100.00`, what does re-running the pipeline *already handle* — and what does it *not* (there's no audit of "o1 changed last Tuesday")?
- Loading a day of orders into `warehouse.db` every midnight is correct. What breaks if two pipelines run against the same DB at once (the write lock), and what's the transaction-level fix (`BEGIN`/`COMMIT` around the executemany)?

## Step 5: Guard against a missing source

The failure every scheduled job eventually has: `orders.csv` isn't there. Unhandled, `FileNotFoundError` crashes mid-pipeline and the warehouse is left holding whatever the *previous* partial run wrote. The hardened pipeline **extracts defensively** — a `try/except` returns `None` for a missing file, and the runner treats `None` as "abort, warehouse unchanged". Then the same pipeline re-runs cleanly once the file is back: idempotency means recovery is *just a re-run*.

### 5.1 Write the guarded extractor and the aborted run

**👟 Starter hint:** `extract_or_none(path)` returns `None` on `FileNotFoundError`; script A demonstrates the abort:

```python
# guarded.py
import csv
import json

def extract_or_none(path: str) -> list[dict] | None:
    try:
        with open(path, newline="") as f:
            return list(csv.DictReader(f))
    except FileNotFoundError:
        return None

if __name__ == "__main__":
    orders = extract_or_none("orders.csv")
    print("extract result:", orders)
    print("pipeline short-circuits:", orders is None)
```

Simulate the failure by moving the source away, then run:

```bash
mv orders.csv orders.csv.bak
python3 - <<'PY'
from guarded import extract_or_none
orders = extract_or_none("orders.csv")
customers = json.load(open("customers.json"))
print("extract result:", orders)
print("pipeline short-circuits:", orders is None)
PY
mv orders.csv.bak orders.csv
```

`extract_or_none` narrows the failure to one symptom (`FileNotFoundError`) and expresses it as a *value* (`None`) instead of an exception — so the caller can *decide*, branch on it, and log it, without a hard crash. The `| None` return type declares the contract: "this might legitimately not exist." Mocking the missing file by `mv` is the honest way to test it — no test framework, just the real filesystem doing real shutdown mutilation and the pipeline staying intact.

**🎯 Expected output** (while `orders.csv` is moved away):

```
extract result: None
pipeline short-circuits: True
```

**🩹 If it's off:** If the script raises `FileNotFoundError` instead of printing `None`, `except FileNotFoundError` is missing or catching a *different* class (`IOError` won't match). If the `mv` back fails (`No such file`), you're in the wrong directory — `orders.csv.bak` must sit beside `orders.csv` in `etl-pipeline/`.

### 5.2 Wire the full pipeline with the guard

**👟 Starter hint:** `run_pipeline()` composes extract → guard → transform → load, prints `ABORTED` on a missing source, and a trailing re-run proves stability:

```python
# run_pipeline.py
import csv, json, sqlite3

CLEAN_STATUSES = {"delivered", "pending"}

def extract_or_none(path: str) -> list[dict] | None:
    try:
        with open(path, newline="") as f:
            return list(csv.DictReader(f))
    except FileNotFoundError:
        return None

def transform(orders, customers):
    customer_by_id = {c["customer_id"]: c for c in customers}
    cleaned = []
    for o in orders:
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES or customer is None:
            continue
        qty, price = float(o["qty"]), float(o["price"])
        if qty <= 0 or price < 0:
            continue
        cleaned.append({"order_id": o["order_id"], "customer_id": o["customer_id"],
                        "customer_name": customer["name"], "city": customer["city"],
                        "product": o["product"], "qty": qty, "price": price,
                        "line_total": round(qty * price, 2), "status": o["status"]})
    return cleaned

def load(conn, records):
    conn.executemany("""INSERT OR REPLACE INTO orders
        (order_id, customer_id, customer_name, city, product, qty, price, line_total, status)
        VALUES (:order_id, :customer_id, :customer_name, :city, :product, :qty, :price, :line_total, :status)""", records)
    conn.commit()

def run_pipeline(db_path: str = "warehouse.db") -> None:
    orders = extract_or_none("orders.csv")
    if orders is None:
        print("ABORTED: orders.csv missing - warehouse unchanged")
        return
    customers = json.load(open("customers.json"))
    cleaned = transform(orders, customers)
    conn = sqlite3.connect(db_path)
    conn.execute("""CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT, city TEXT,
        product TEXT, qty REAL, price REAL, line_total REAL, status TEXT)""")
    load(conn, cleaned)
    n = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    print(f"OK: loaded {len(cleaned)} rows; warehouse now has {n} (no duplicates)")
    conn.close()

if __name__ == "__main__":
    run_pipeline()
    run_pipeline()
```

Run it (twice, in one script — the second run is the idempotency proof):

```bash
uv run run_pipeline.py
```

The guard makes the difference visible: with `orders.csv` deleted, `run_pipeline` prints `ABORTED` and returns *before any database connection* opens — the warehouse row count stays at 4, untouched. With the file back, the same function runs the whole ETL and reports 4 rows again — **no duplicates**, because `order_id TEXT PRIMARY KEY` plus `INSERT OR REPLACE` make "the same input twice" equal "the same output once". Idempotency collapses recovery into a re-run.

**🎯 Expected output:**

```
OK: loaded 4 rows; warehouse now has 4 (no duplicates)
OK: loaded 4 rows; warehouse now has 4 (no duplicates)
```

**🩹 If it's off:** If the first line shows `ABORTED`, `orders.csv` is still renamed from 5.1 — restore it with `mv orders.csv.bak orders.csv`. If the second line shows a different count, both runs aren't connecting to the same `warehouse.db` (check the path, or an absolute vs. relative `db_path` mixup).

### 5.3 Verify the hardened pipeline

**✅ Checklist**

- ✅ `mv orders.csv ...` away → `ABORTED: orders.csv missing`, warehouse row count unchanged.
- ✅ `mv ... back` → `OK: loaded 4 rows`, and the second run stays at 4.
- ✅ No exception escapes the extractor; a missing source is a reportable event, not a crash.

**🤔 Socratic Question(s)**

- `run_pipeline` aborts *before* opening the database connection. Name the alternative failure a production pipeline must still guard: the source is present but a *transform* throws (bad `float`). Where would log-and-skip belong, and what's the danger of catching broadly (`except Exception`) versus narrowly on `FileNotFoundError`?
- The re-run printed `OK` twice — but a *deliberate corruption* (bump o1's price to $9999) is also "handled" silently by `REPLACE`. What's the first artifact that turns a script into an *auditable* data pipeline (row counts per run, source digests, timestamps)?

## ⚠️ Common pitfalls

- **Extraction doing transform.** Casting `float()` or filtering at extract time blurs the two stages — transforms own judgment, extracts own *reading*. Keep extraction dumb or the skip audit stops being the single place to look.
- **Silent skips.** Cleaning without a `skipped` list hides data loss inside a green run. Report every dropped row with a reason; "4 kept, 2 skipped: [('o4','cancelled')...]" is a pipeline you can trust.
- **Non-idempotent loads.** A plain `INSERT` (no `OR REPLACE`, no PK) converts every re-run into a full duplicate. The PK is the whole game; without it, "run twice" means "twice the rows".
- **Escape analysis.** Catching `FileNotFoundError` but *not* branching on it — the demo's `ABORTED` print exists because the pipeline *checks* `orders is None` and returns. A guard that doesn't decide is a crash in a nicer coat.
- **`18:00` style column leaks.** `line_total` computed in transform, then *recomputed* somewhere else with different rounding, produces a SUM that disagrees with itself. Compute once, reuse everywhere.

## What you just built

A complete Extract-Transform-Load pipeline on the standard library: dumb CSV/JSON extraction, a transform that cleans, joins, computes, and *reports* every skipped row, city-level revenue aggregation that agrees with its own total, an idempotent SQLite load that survives re-runs, and a guarded runner that survives a missing source. The transferable skill is the *shape* of the pipeline, not the tools: every stage owns one job, every skip is audible, and idempotency makes recovery boring — which is the highest praise a data job can get.

:::tip[Run a fuller version without any local setup]
[`examples/etl-pipeline/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/etl-pipeline) in the course repo has the complete scripts (extract, transform, aggregate, load, guarded runner) plus the sample sources. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a **daily-batch driver**: a loop that re-runs `run_pipeline()` on incrementing dates (`orders_2026_09_01.csv` → same table), and report `loaded N rows for 2026-09-01` per date — the seed of a scheduled report.
- Make the pipeline **auditable**: after each `load`, write `loads.log` as JSONL with timestamp, row count, and a source-file SHA-256. Re-runs become a history, not a mystery.
- Switch the load stage to **two tables**: `orders` (detail) plus `city_revenue` (aggregate), and let the aggregate derive from the table (not from the transform) — the warehouse owns its reports.
- Add a **schema check** in extract: assert `orders.csv` headers equal the expected set before returning rows — failing fast on a vendor column rename beats failing at `float(float(o['qty']))` deep in transform.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓