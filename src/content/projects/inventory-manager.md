---
title: "Build an Inventory Manager"
description: "Build a stock management system with barcode scanning simulation, reorder alerts, warehouse transfers, and sales forecasting."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["cli", "database", "data-analysis"]
learningObjectives:
  - "Design and query a SQLite database for inventory tracking"
  - "Simulate barcode scanning for quick stock updates"
  - "Build a reorder alert system that flags low-stock items"
  - "Implement inter-warehouse transfers with transaction safety"
prerequisites: ["Python 101", "Data Analysis"]
---

# 📦 Build an Inventory Manager

Every warehouse, every retail store, every e-commerce seller faces the same problem: knowing what's in stock, what's running low, and where everything is. This project builds an inventory management system in Python with a SQLite backend: you track stock levels across multiple warehouses, simulate barcode scans for fast updates, get alerts when items hit reorder thresholds, transfer stock between locations, and forecast future needs from historical data. The system runs as a CLI, but the architecture is the same one that powers real inventory platforms.

This assumes Python 101 and basic comfort with pandas from Data Analysis — nothing beyond. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the dependencies you'll need.
2. Design a SQLite database schema for products, warehouses, and stock levels.
3. Build a barcode scanning interface that looks up items and updates stock.
4. Implement a reorder alert system that flags items below their minimum threshold.
5. Create warehouse transfer transactions that move stock between locations atomically.
6. Add a sales forecasting function that predicts future stock needs from historical data.

## Where to run this

**Locally with `uv`** is the primary path — this project reads and writes a SQLite database file on disk, which works best outside a notebook.

**Google Colab, Kaggle Notebooks, and Binder** work for trying the tool. The notebook creates an in-memory database and uses sample data.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/inventory-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/inventory-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Finventory-manager%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment and two packages.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init inventory-manager
cd inventory-manager
uv add click pandas
```

`click` builds the CLI and `pandas` powers the sales forecasting. The project uses SQLite from the standard library for the database — no external database driver needed.

### Create the project structure

```bash
mkdir -p inventory
touch inventory/__init__.py inventory/db.py inventory/scanner.py inventory/alerts.py inventory/transfers.py inventory/forecast.py inventory/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `inventory-manager/` exists with a `pyproject.toml`, and `click` and `pandas` are installed.
- ✅ The `inventory/` directory has all required module files.

## Step 1: Design the database schema

A good inventory database tracks three things: what products exist, where they are, and how many are in each location. Three tables — `products`, `warehouses`, and `stock` — with a junction table linking products to warehouses.

### 1.1 Create the schema

**👟 Starter hint:** Create `inventory/db.py` with functions to create tables and seed sample data.

```python
# inventory/db.py
import sqlite3
from pathlib import Path

DB_PATH = Path("inventory.db")

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables and seed sample data."""
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS products (
            sku TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            reorder_point INTEGER DEFAULT 10
        );
        CREATE TABLE IF NOT EXISTS warehouses (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT
        );
        CREATE TABLE IF NOT EXISTS stock (
            sku TEXT REFERENCES products(sku),
            warehouse_id TEXT REFERENCES warehouses(id),
            quantity INTEGER DEFAULT 0,
            PRIMARY KEY (sku, warehouse_id)
        );
        CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT,
            from_warehouse TEXT,
            to_warehouse TEXT,
            quantity INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            reason TEXT
        );
    """)
    # Seed data (only if empty)
    if conn.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        conn.executemany("INSERT INTO products VALUES (?, ?, ?, ?)", [
            ("WIDGET-A", "Widget A", "Widgets", 10),
            ("WIDGET-B", "Widget B", "Widgets", 5),
            ("GADGET-X", "Gadget X", "Gadgets", 15),
            ("CABLE-USB", "USB Cable", "Accessories", 50),
        ])
        conn.executemany("INSERT INTO warehouses VALUES (?, ?, ?)", [
            ("WH1", "Main Warehouse", "New York"),
            ("WH2", "West Coast Hub", "Los Angeles"),
        ])
        conn.executemany("INSERT INTO stock VALUES (?, ?, ?)", [
            ("WIDGET-A", "WH1", 25),
            ("WIDGET-A", "WH2", 8),
            ("WIDGET-B", "WH1", 3),
            ("GADGET-X", "WH1", 40),
            ("GADGET-X", "WH2", 20),
            ("CABLE-USB", "WH1", 100),
            ("CABLE-USB", "WH2", 75),
        ])
        conn.commit()
    conn.close()
```

The `stock` table is a junction table: each row says "product X has Y units in warehouse Z." The `stock_movements` table logs every transfer for audit purposes. The `reorder_point` on products defines the threshold below which you should reorder — different products have different thresholds depending on how fast they sell.

**🎯 Expected output:** `init_db()` creates `inventory.db` with 4 products, 2 warehouses, and 7 stock entries.

**🩹 If it's off:** If the database already exists with different data, delete `inventory.db` and re-run `init_db()`.

### 1.2 Verify the schema

```python
# Quick test
from inventory.db import init_db, get_conn

init_db()
conn = get_conn()
products = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
stock = conn.execute("SELECT COUNT(*) FROM stock").fetchone()[0]
conn.close()
assert products == 4
assert stock == 7
```

**🎯 Expected output:** Both assertions pass; the database has the expected number of rows.

**🩹 If it's off:** If the counts are wrong, `init_db()` may have run twice (inserting duplicates). Check the `SELECT COUNT(*)` guard.

### 1.3 Verify the database schema

**✅ Checklist**

- ✅ `init_db()` creates tables for products, warehouses, stock, and stock_movements.
- ✅ Seed data populates 4 products, 2 warehouses, and 7 stock entries.
- ✅ `get_conn()` returns a connection with `Row` factory for dict-like access.

**🤔 Socratic Question(s)**

- Why use a junction table (`stock`) instead of storing a `warehouse_id` directly on the `products` table? What breaks if a product exists in two warehouses?
- The `stock_movements` table logs every transfer. What else would you log in a real system (who initiated the transfer, approval status, tracking number)?

## Step 2: Build the barcode scanner

In a real warehouse, staff scan barcodes to look up items and update stock. This project simulates that with a function that takes a barcode (SKU), looks up the product, and lets you add or remove stock.

### 2.1 Write the scanner functions

**👟 Starter hint:** Create `inventory/scanner.py` with functions to look up a product by SKU and update its stock level.

```python
# inventory/scanner.py
from inventory.db import get_conn

def lookup_product(sku: str) -> dict | None:
    """Look up a product by SKU. Returns a dict or None if not found."""
    conn = get_conn()
    row = conn.execute("SELECT * FROM products WHERE sku = ?", (sku,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_stock(sku: str) -> list[dict]:
    """Get stock levels for a product across all warehouses."""
    conn = get_conn()
    rows = conn.execute(
        "SELECT warehouse_id, quantity FROM stock WHERE sku = ?", (sku,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_stock(sku: str, warehouse_id: str, quantity_change: int, reason: str = "adjustment"):
    """Add or remove stock. quantity_change can be positive or negative."""
    conn = get_conn()
    current = conn.execute(
        "SELECT quantity FROM stock WHERE sku = ? AND warehouse_id = ?",
        (sku, warehouse_id),
    ).fetchone()
    new_qty = (current["quantity"] if current else 0) + quantity_change
    if new_qty < 0:
        conn.close()
        raise ValueError(f"Insufficient stock: {current['quantity'] if current else 0} available, tried to remove {abs(quantity_change)}")
    if current:
        conn.execute(
            "UPDATE stock SET quantity = ? WHERE sku = ? AND warehouse_id = ?",
            (new_qty, sku, warehouse_id),
        )
    else:
        conn.execute(
            "INSERT INTO stock (sku, warehouse_id, quantity) VALUES (?, ?, ?)",
            (sku, warehouse_id, new_qty),
        )
    conn.execute(
        "INSERT INTO stock_movements (sku, to_warehouse, quantity, reason) VALUES (?, ?, ?, ?)",
        (sku, warehouse_id, quantity_change, reason),
    )
    conn.commit()
    conn.close()
```

The `update_stock` function handles three cases: adding stock to an existing location, removing stock (with a negative balance check), and creating a new stock entry for a product-warehouse pair that didn't exist before. Every change is logged to `stock_movements` for audit purposes. The `reason` parameter lets you tag movements as "sale," "restock," "adjustment," or "transfer."

**🎯 Expected output:** `lookup_product("WIDGET-A")` returns a dict with `sku`, `name`, `category`, `reorder_point`. `get_stock("WIDGET-A")` returns two entries (WH1 and WH2).

**🩹 If it's off:** If `lookup_product` returns `None` for a valid SKU, the seed data wasn't inserted. If `update_stock` raises `ValueError` for a valid removal, the quantity check is comparing wrong numbers.

### 2.2 Verify the scanner

```python
from inventory.db import init_db
from inventory.scanner import lookup_product, get_stock, update_stock

init_db()
product = lookup_product("WIDGET-A")
assert product["name"] == "Widget A"

stock = get_stock("WIDGET-A")
assert len(stock) == 2

update_stock("WIDGET-A", "WH1", -5, reason="sale")
updated = get_stock("WIDGET-A")
wh1_stock = next(s for s in updated if s["warehouse_id"] == "WH1")
assert wh1_stock["quantity"] == 20  # was 25, removed 5
```

**🎯 Expected output:** All assertions pass; the stock level updated correctly after the sale.

**🩹 If it's off:** If the stock didn't change, the UPDATE query isn't matching the right row — check the WHERE clause.

### 2.3 Verify the scanner

**✅ Checklist**

- ✅ `lookup_product` returns product details for a valid SKU.
- ✅ `get_stock` returns stock levels across all warehouses.
- ✅ `update_stock` correctly adds or removes quantity and logs the movement.

**🤔 Socratic Question(s)**

- If two staff members scan the same barcode at the same time, they might both read the same stock level and overwrite each other's changes. How would you prevent this race condition in a multi-user system?
- The scanner takes a SKU string. In a real system, the barcode scanner inputs the string directly. How would you add a `--scan` mode that reads from stdin for continuous scanning?

## Step 3: Build the reorder alert system

The reorder alert system compares each product's current total stock against its `reorder_point` and flags items that need restocking. This is the system that prevents stockouts.

### 3.1 Write the alert checker

**👟 Starter hint:** Create `inventory/alerts.py` with a function that finds all products below their reorder threshold.

```python
# inventory/alerts.py
from inventory.db import get_conn

def check_reorder_alerts() -> list[dict]:
    """Find products whose total stock is at or below their reorder point."""
    conn = get_conn()
    rows = conn.execute("""
        SELECT p.sku, p.name, p.reorder_point,
               COALESCE(SUM(s.quantity), 0) as total_stock
        FROM products p
        LEFT JOIN stock s ON p.sku = s.sku
        GROUP BY p.sku
        HAVING total_stock <= p.reorder_point
        ORDER BY (total_stock * 1.0 / p.reorder_point) ASC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]
```

The SQL query joins products with their stock, sums quantities across all warehouses, and filters to products where the total is at or below the reorder point. The `COALESCE` handles products with zero stock (no rows in the `stock` table). Results are sorted by stock-to-reorder ratio so the most urgent items appear first.

**🎯 Expected output:** `check_reorder_alerts()` returns a list including `WIDGET-B` (total stock = 3, reorder point = 5) sorted by urgency.

**🩹 If it's off:** If no alerts appear, the seed data stock levels are all above reorder points — check the seed data values. If the total is wrong, the `SUM` is including movements from other products — check the JOIN.

### 3.2 Verify the alerts

```python
from inventory.db import init_db
from inventory.alerts import check_reorder_alerts

init_db()
alerts = check_reorder_alerts()
# WIDGET-B has stock 3 in WH1, reorder point 5
assert any(a["sku"] == "WIDGET-B" for a in alerts)
# WIDGET-A has 25+8=33, reorder 10 — should NOT be an alert
assert not any(a["sku"] == "WIDGET-A" for a in alerts)
```

**🎯 Expected output:** Both assertions pass; WIDGET-B is flagged, WIDGET-A is not.

**🩹 If it's off:** If WIDGET-A appears in alerts, the reorder point may be set too high in the seed data.

### 3.3 Verify alerts

**✅ Checklist**

- ✅ Products with total stock below their reorder point appear in the alert list.
- ✅ Products above their reorder point do not appear.
- ✅ Alerts are sorted by urgency (lowest stock-to-reorder ratio first).

**🤔 Socratic Question(s)**

- The alert system checks total stock across all warehouses. But if WIDGET-A has 25 units in WH1 and 0 in WH2, the WH2 location might stock out while the total looks fine. How would you add per-warehouse alerts?
- What happens when a product's reorder point changes? Should existing alerts be recalculated immediately or batch-processed overnight?

## Step 4: Implement warehouse transfers

Moving stock between warehouses is a two-sided transaction: decrease at the source, increase at the destination. If either side fails, neither should happen — this is the classic atomicity requirement of database transactions.

### 4.1 Write the transfer function

**👟 Starter hint:** Create `inventory/transfers.py` with a function that atomically moves stock between warehouses.

```python
# inventory/transfers.py
from inventory.db import get_conn

def transfer_stock(sku: str, from_wh: str, to_wh: str, quantity: int) -> dict:
    """Atomically transfer stock between warehouses.

    Returns a summary dict. Raises ValueError on insufficient stock.
    """
    if quantity <= 0:
        raise ValueError("Transfer quantity must be positive")
    if from_wh == to_wh:
        raise ValueError("Cannot transfer to the same warehouse")

    conn = get_conn()
    try:
        # Check source stock
        row = conn.execute(
            "SELECT quantity FROM stock WHERE sku = ? AND warehouse_id = ?",
            (sku, from_wh),
        ).fetchone()
        source_qty = row["quantity"] if row else 0
        if source_qty < quantity:
            raise ValueError(f"Insufficient stock at {from_wh}: {source_qty} available, {quantity} requested")

        # Update source (decrease)
        conn.execute(
            "UPDATE stock SET quantity = quantity - ? WHERE sku = ? AND warehouse_id = ?",
            (quantity, sku, from_wh),
        )

        # Update destination (increase)
        dest = conn.execute(
            "SELECT quantity FROM stock WHERE sku = ? AND warehouse_id = ?",
            (sku, to_wh),
        ).fetchone()
        if dest:
            conn.execute(
                "UPDATE stock SET quantity = quantity + ? WHERE sku = ? AND warehouse_id = ?",
                (quantity, sku, to_wh),
            )
        else:
            conn.execute(
                "INSERT INTO stock (sku, warehouse_id, quantity) VALUES (?, ?, ?)",
                (sku, to_wh, quantity),
            )

        # Log the movement
        conn.execute(
            "INSERT INTO stock_movements (sku, from_warehouse, to_warehouse, quantity, reason) VALUES (?, ?, ?, ?, ?)",
            (sku, from_wh, to_wh, quantity, "transfer"),
        )

        conn.commit()
        return {"sku": sku, "from": from_wh, "to": to_wh, "quantity": quantity, "status": "success"}

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
```

The `try/except/finally` pattern ensures that if any step fails (insufficient stock, database error), the entire transaction rolls back — no half-finished transfers. The `finally` block always closes the connection. The movement is logged after the stock updates succeed, so the log entry only exists if the transfer actually happened.

**🎯 Expected output:** `transfer_stock("WIDGET-A", "WH1", "WH2", 5)` returns `{"status": "success", "quantity": 5, ...}`. WH1 drops by 5, WH2 increases by 5.

**🩹 If it's off:** If the source stock isn't decreasing, the UPDATE query may be using `quantity = ?` instead of `quantity = quantity - ?`. If the transfer logs but doesn't update stock, the commit is happening before the updates.

### 4.2 Verify transfers

```python
from inventory.db import init_db
from inventory.transfers import transfer_stock
from inventory.scanner import get_stock

init_db()
result = transfer_stock("WIDGET-A", "WH1", "WH2", 5)
assert result["status"] == "success"

stock = get_stock("WIDGET-A")
wh1 = next(s for s in stock if s["warehouse_id"] == "WH1")
wh2 = next(s for s in stock if s["warehouse_id"] == "WH2")
assert wh1["quantity"] == 20  # was 25
assert wh2["quantity"] == 13  # was 8
```

**🎯 Expected output:** All assertions pass; stock moved atomically between warehouses.

**🩹 If it's off:** If the quantities don't match, the transfer may have run twice — check the seed data state.

### 4.3 Verify transfers

**✅ Checklist**

- ✅ A valid transfer decreases source and increases destination by the same amount.
- ✅ Transferring more than available stock raises `ValueError`.
- ✅ The transfer is logged in `stock_movements` with reason "transfer".

**🤔 Socratic Question(s)**

- If the transfer fails halfway (source decreased, destination not yet updated), the rollback undoes everything. But what if the application crashes between `commit()` and `conn.close()`? Is the data safe?
- How would you implement a transfer approval workflow where a manager must approve large transfers before they execute?

## Step 5: Forecast future stock needs

Sales forecasting predicts how much stock you'll need based on historical movement data. This step uses a simple moving average — the average of the last N days of sales — to project future demand.

### 5.1 Write the forecast function

**👟 Starter hint:** Create `inventory/forecast.py` with a function that computes a moving-average forecast from stock movements.

```python
# inventory/forecast.py
import pandas as pd
from inventory.db import get_conn

def get_sales_history(sku: str, days: int = 30) -> pd.DataFrame:
    """Get daily sales counts for a product over the last N days."""
    conn = get_conn()
    df = pd.read_sql_query("""
        SELECT DATE(timestamp) as date, SUM(quantity) as units_sold
        FROM stock_movements
        WHERE sku = ? AND reason = 'sale'
          AND timestamp >= datetime('now', ?)
        GROUP BY DATE(timestamp)
        ORDER BY date
    """, conn, params=(sku, f"-{days} days"))
    conn.close()
    return df

def forecast_demand(sku: str, days_ahead: int = 7, lookback: int = 30) -> dict:
    """Forecast demand using a simple moving average."""
    history = get_sales_history(sku, lookback)
    if history.empty:
        return {"sku": sku, "daily_avg": 0, "forecast_total": 0, "confidence": "low"}

    daily_avg = history["units_sold"].mean()
    forecast = round(daily_avg * days_ahead, 1)

    # Confidence based on data completeness
    data_days = len(history)
    confidence = "high" if data_days >= lookback * 0.7 else "medium" if data_days >= 3 else "low"

    return {
        "sku": sku,
        "daily_avg": round(daily_avg, 2),
        "forecast_total": forecast,
        "confidence": confidence,
        "data_days": data_days,
    }
```

The moving average is the simplest forecasting method: average the last N days of sales, multiply by the forecast horizon. The `confidence` rating is based on data completeness — if you have sales data for most of the lookback period, the forecast is more trustworthy. For a real system, you'd use exponential smoothing or ARIMA, but the moving average captures the core idea.

**🎯 Expected output:** `forecast_demand("WIDGET-A")` returns a dict with `daily_avg`, `forecast_total`, and `confidence` based on the movement history.

**🩹 If it's off:** If the forecast is always 0, there are no movements with `reason='sale'` in the seed data — you'd need to add some sample sales.

### 5.2 Add restock recommendations

```python
# inventory/forecast.py (continued)
from inventory.db import get_conn

def restock_recommendations() -> list[dict]:
    """Combine forecast with current stock to recommend restock quantities."""
    conn = get_conn()
    products = conn.execute("SELECT sku, name, reorder_point FROM products").fetchall()
    conn.close()

    recommendations = []
    for p in products:
        forecast = forecast_demand(p["sku"], days_ahead=14)
        from inventory.scanner import get_stock
        stock = get_stock(p["sku"])
        total = sum(s["quantity"] for s in stock)
        needed = max(0, forecast["forecast_total"] - total + p["reorder_point"])
        if needed > 0:
            recommendations.append({
                "sku": p["sku"],
                "name": p["name"],
                "current_stock": total,
                "forecast_14day": forecast["forecast_total"],
                "reorder_point": p["reorder_point"],
                "recommended_order": round(needed),
            })
    return sorted(recommendations, key=lambda x: x["recommended_order"], reverse=True)
```

**🎯 Expected output:** Products where the forecast exceeds current stock plus reorder point appear in the recommendations, sorted by urgency.

**🩹 If it's off:** If no recommendations appear, the current stock is high enough to cover the forecast — that's correct behavior for well-stocked items.

### 5.3 Verify forecasting

**✅ Checklist**

- ✅ `forecast_demand` returns `daily_avg`, `forecast_total`, and `confidence`.
- ✅ `restock_recommendations` combines forecast with current stock levels.
- ✅ Products with sufficient stock don't appear in recommendations.

**🤔 Socratic Question(s)**

- The moving average treats every day equally. A spike in sales last week would be diluted by quiet days a month ago. How would exponential smoothing give more weight to recent data?
- If a product had a one-time bulk sale (100 units in one day), the moving average would spike. How would you detect and exclude outliers from the forecast?

## ⚠️ Common pitfalls

- **Not using transactions for transfers.** If you decrease source stock but the destination update fails, you've lost inventory. Always wrap multi-step stock changes in a database transaction with rollback.
- **Forgetting to log stock movements.** Every stock change should have an audit trail. Without `stock_movements`, you can't debug discrepancies or answer "where did those 50 units go?"
- **Forecasting from insufficient data.** A moving average with 2 days of data is unreliable. The confidence rating helps, but you should also warn users when the forecast is based on very little history.
- **Race conditions on stock updates.** Two concurrent `update_stock` calls might both read the same quantity and overwrite each other. In production, use `SELECT ... FOR UPDATE` or optimistic locking.
- **Ignoring per-warehouse stockouts.** A product might have 100 units total but 0 at a specific warehouse. The total looks fine, but customers at that location can't buy it. Always check per-warehouse levels for fulfillment.

## What you just built

An inventory management system with a SQLite backend: product catalog, multi-warehouse stock tracking, barcode-style scanning for quick updates, reorder alerts that prevent stockouts, atomic transfers between warehouses with audit logging, and sales forecasting from historical movement data. The architecture — product, warehouse, stock junction table — is the same pattern used by real inventory systems like inFlow, Sortly, and Odoo.

:::tip[Run a fuller version without any local setup]
[`examples/inventory-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/inventory-manager) in the course repo has a richer version with more sample data, a web dashboard, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a web dashboard with Flask that shows stock levels, alerts, and forecasts in a browser.
- Implement barcode generation: print SKU barcodes for physical items using the `python-barcode` library.
- Build a CSV import/export pipeline so you can bulk-load products from a spreadsheet.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
