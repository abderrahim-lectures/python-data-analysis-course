---
title: "مدير المخزون"
description: "أدر مستويات المخزون مع مسح الباركود وتنبيهات إعادة الطلب ودعم مستودعات متعددة."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["cli", "database", "data-analysis"]
learningObjectives:
  - "تصميم قاعدة بيانات SQLite والاستعلام عنها لتتبع المخزون"
  - "محاكاة مسح الباركود لتحديثات مخزون سريعة"
  - "بناء نظام تنبيهات إعادة طلب يرصد العناصر منخفضة المخزون"
  - "تنفيذ تحويلات بين المستودعات مع سلامة المعاملات"
prerequisites: ["Python 101", "Data Analysis"]
---


# 📦 ابنِ مدير مخزون

كل مستودع، وكل متجر بيع بالتجزئة، وكل بائع تجارة إلكترونية يواجه المشكلة نفسها: معرفة ما هو متوفر في المخزون، وما ينفد، وأين يوجد كل شيء. يبني هذا المشروع نظامًا لإدارة المخزون في Python مع قاعدة بيانات SQLite: تتتبع مستويات المخزون عبر مستودعات متعددة، وتحاكي مسح الباركود لتحديثات سريعة، وتحصل على تنبيهات عندما تصل العناصر إلى عتبة إعادة الطلب، وتنقل المخزون بين المواقع، وتتنبأ بالاحتياجات المستقبلية من البيانات التاريخية. يعمل النظام كأداة CLI، لكن البنية هي نفسها التي تشغّل منصات مخزون حقيقية.

هذا يفترض إنهاء Python 101 وإلمامًا أساسيًا بـ pandas من تحليل البيانات — لا شيء أبعد من ذلك. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع باستخدام `uv` وتثبيت التبعيات التي ستحتاجها.
2. تصميم مخطط قاعدة بيانات SQLite للمنتجات والمستودعات ومستويات المخزون.
3. بناء واجهة مسح باركود تبحث عن العناصر وتحدّث المخزون.
4. تنفيذ نظام تنبيهات إعادة طلب يرصد العناصر دون عتبتها الدنيا.
5. إنشاء معاملات تحويل مستودعات تنقل المخزون بين المواقع بشكل ذرّي.
6. إضافة دالة تنبؤ بالمبيعات تتوقع احتياجات المخزون المستقبلية من البيانات التاريخية.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — يقرأ هذا المشروع ملف قاعدة بيانات SQLite ويكتب فيه على القرص، ما يعمل بشكل أفضل خارج دفتر الملاحظات.

**Google Colab وKaggle Notebooks وBinder** تصلح لتجربة الأداة. ينشئ الدفتر قاعدة بيانات في الذاكرة ويستخدم بيانات عينات.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/inventory-manager/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/inventory-manager/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Finventory-manager%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python وحزمتان.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق طرفيتك وأعد فتحها، ثم أكِّد:

```bash
uv --version
```

### أعِدَّ المشروع

```bash
uv init inventory-manager
cd inventory-manager
uv add click pandas
```

يبني `click` أداة CLI ويدعم `pandas` التنبؤ بالمبيعات. يستخدم المشروع SQLite من المكتبة القياسية لقاعدة البيانات — لا حاجة لمُشغّل قاعدة بيانات خارجي.

### أنشئ بنية المشروع

```bash
mkdir -p inventory
touch inventory/__init__.py inventory/db.py inventory/scanner.py inventory/alerts.py inventory/transfers.py inventory/forecast.py inventory/cli.py
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ يوجد مجلد `inventory-manager/` مع `pyproject.toml`، وحزمتا `click` و`pandas` مثبَّتتان.
- ✅ يحتوي مجلد `inventory/` على جميع ملفات الوحدات المطلوبة.

## الخطوة 1: صمّم مخطط قاعدة البيانات

قاعدة مخزون جيدة تتتبع ثلاثة أشياء: ما المنتجات الموجودة، وأين هي، وكم عددها في كل موقع. ثلاث جدو — `products` و`warehouses` و`stock` — مع جدول وصلة يربط المنتجات بالمستودعات.

### 1.1 أنشئ المخطط

**👟 تلميح البداية :**

أنشئ `inventory/db.py` مع دوال لإنشاء الجداول وتهيئة بيانات العينات.

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

جدول `stock` جدول وصلة: كل صف يقول «المنتج X لديه Y وحدة في المستودع Z». يسجّل جدول `stock_movements` كل تحويل لأغراض التدقيق. ويعرّف `reorder_point` على المنتجات العتبة التي يجب إعادة الطلب دونها — المنتجات المختلفة لها عتبات مختلفة حسب سرعة بيعها.

**🎯 الناتج المتوقع :**

ينشئ `init_db()` ملف `inventory.db` مع 4 منتجات ومستودعين و7 إدخالات مخزون.

**🩹 إذا لم يعمل :**

إذا كانت قاعدة البيانات موجودة مسبقًا ببيانات مختلفة، احذف `inventory.db` وأعد تشغيل `init_db()`.

### 1.2 تحقّق من المخطط

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

**🎯 الناتج المتوقع :**

تمر التوكيدات كلها؛ قاعدة البيانات تملك العدد المتوقع من الصفوف.

**🩹 إذا لم يعمل :**

إذا كانت الأعداد خاطئة، فقد شُغِّل `init_db()` مرتين (مدرِجًا نسخًا مكررة). تحقّق من حارس `SELECT COUNT(*)`.

### 1.3 تحقّق

**✅ قائمة التحقق**

- ✅ ينشئ `init_db()` جداول للمنتجات والمستودعات والمخزون وحركات المخزون.
- ✅ تملأ بيانات العينات 4 منتجات ومستودعين و7 إدخالات مخزون.
- ✅ يُعيد `get_conn()` اتصالًا بمصنع `Row` للوصول الشبيه بالقواميس.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا نستخدم جدول وصلة (`stock`) بدلًا من تخزين `warehouse_id` مباشرةً في جدول `products`؟ ماذا ينكسر إذا وُجد المنتج في مستودعين؟
- يسجّل جدول `stock_movements` كل تحويل. ماذا غير ذلك ستسجّله في نظام حقيقي (من بدأ التحويل، حالة الموافقة، رقم التتبع)؟

## الخطوة 2: ابنِ ماسح الباركود

في مستودع حقيقي، يمسح الموظفون الباركود للبحث عن العناصر وتحديث المخزون. يحاكي هذا المشروع ذلك بدالة تأخذ باركودًا (SKU)، وتبحث عن المنتج، وتتيح لك إضافة المخزون أو إزالته.

### 2.1 اكتب دوال الماسح

**👟 تلميح البداية :**

أنشئ `inventory/scanner.py` مع دوال للبحث عن منتج بواسطة SKU وتحديث مستوى مخزنه.

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

تتعامل دالة `update_stock` مع ثلاث حالات: إضافة مخزون إلى موقع موجود، وإزالة مخزون (مع فحص رصيد سالب)، وإنشاء إدخال مخزون جديد لزوج منتج-مستودع لم يكن موجودًا من قبل. يُسجَّل كل تغيير في `stock_movements` لأغراض التدقيق. يتيح معامل `reason` وضع علامات على الحركات بأنها «بيع» أو «إعادة تخزين» أو «تعديل» أو «تحويل».

**🎯 الناتج المتوقع :**

تُعيد `lookup_product("WIDGET-A")` قاموسًا مع `sku` و`name` و`category` و`reorder_point`. وتُعيد `get_stock("WIDGET-A")` إدخالين (WH1 وWH2).

**🩹 إذا لم يعمل :**

إذا أعادت `lookup_product` قيمة `None` لـ SKU صالح، فبيانات العينات لم تُدرج. إذا رفعت `update_stock` خطأ `ValueError` لإزالة صالحة، ففحص الكمية يقارن أرقامًا خاطئة.

### 2.2 تحقّق من الماسح

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

**🎯 الناتج المتوقع :**

تمر التوكيدات كلها؛ تحدّث مستوى المخزون بشكل صحيح بعد البيع.

**🩹 إذا لم يعمل :**

إذا لم يتغير المخزون، فلن يطابق استعلام UPDATE الصف الصحيح — تحقّق من جملة WHERE.

### 2.3 تحقّق

**✅ قائمة التحقق**

- ✅ تُعيد `lookup_product` تفاصيل المنتج لـ SKU صالح.
- ✅ تُعيد `get_stock` مستويات المخزون عبر جميع المستودعات.
- ✅ تضيف `update_stock` الكمية أو تزيلها بشكل صحيح وتسجّل الحركة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا مسح موظفان الباركود نفسه في الوقت نفسه، فقد يقرأ كلاهما مستوى المخزون نفسه ويلغي أحدهما تغييرات الآخر. كيف تمنع حالة السباق هذه في نظام متعدد المستخدمين؟
- يأخذ الماسح سلسلة SKU. في نظام حقيقي، يدخل ماسح الباركود السلسلة مباشرةً. كيف تضيف وضع `--scan` يقرأ من stdin للمسح المستمر؟

## الخطوة 3: ابنِ نظام تنبيهات إعادة الطلب

يقارن نظام تنبيهات إعادة الطلب المخزون الإجمالي الحالي لكل منتج مع `reorder_point` الخاص به ويرصد العناصر التي تحتاج إعادة تخزين. هذا هو النظام الذي يمنع نفاد المخزون.

### 3.1 اكتب فاحص التنبيهات

**👟 تلميح البداية :**

أنشئ `inventory/alerts.py` مع دالة تجد جميع المنتجات دون عتبة إعادة الطلب الخاصة بها.

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

يربط استعلام SQL المنتجات بمخزونها، ويجمع الكميات عبر جميع المستودعات، ويصفّي المنتجات التي يكون مجموعها عند نقطة إعادة الطلب أو دونها. يتعامل `COALESCE` مع المنتجات ذات المخزون الصفري (لا صفوف في جدول `stock`). تُرتَّب النتائج حسب نسبة المخزون إلى إعادة الطلب حتى تظهر العناصر الأكثر إلحاحًا أولًا.

**🎯 الناتج المتوقع :**

تُعيد `check_reorder_alerts()` قائمة تشمل `WIDGET-B` (المخزون الإجمالي = 3، نقطة إعادة الطلب = 5) مرتّبة حسب الإلحاح.

**🩹 إذا لم يعمل :**

إذا لم تظهر تنبيهات، فمستويات مخزون بيانات العينات كلها فوق نقاط إعادة الطلب — تحقّق من قيم بيانات العينات. إذا كان المجموع خاطئًا، فـ`SUM` شام لحركات من منتجات أخرى — تحقّق من JOIN.

### 3.2 تحقّق من التنبيهات

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

**🎯 الناتج المتوقع :**

تمر التوكيدات كلها؛ يُرصد WIDGET-B ولا يُرصد WIDGET-A.

**🩹 إذا لم يعمل :**

إذا ظهر WIDGET-A في التنبيهات، فقد تكون نقطة إعادة الطلب مضبوطةً على قيمة مرتفعة جدًا في بيانات العينات.

### 3.3 تحقّق

**✅ قائمة التحقق**

- ✅ المنتجات ذات المخزون الإجمالي دون نقطة إعادة الطلب تظهر في قائمة التنبيهات.
- ✅ المنتجات فوق نقطة إعادة الطلب لا تظهر.
- ✅ تُرتَّب التنبيهات حسب الإلحاح (أدنى نسبة مخزون إلى إعادة طلب أولًا).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يفحص نظام التنبيهات المخزون الإجمالي عبر جميع المستودعات. لكن إذا كان WIDGET-A يملك 25 وحدة في WH1 و0 في WH2، فقد ينفد موقع WH2 بينما يبدو الإجمالي جيدًا. كيف تضيف تنبيهات لكل مستودع؟
- ماذا يحدث عندما تتغير نقطة إعادة طلب منتج؟ هل يجب إعادة حساب التنبيهات الموجودة فورًا أم معالجتها دفعةً واحدة ليلًا؟

## الخطوة 4: نفّذ تحويلات المستودعات

نقل المخزون بين المستودعات معاملة ذات وجهين: نقصان عند المصدر، وزيادة عند الوجهة. إذا فشل أي من الجانبين، لا يجب أن يحدث أي منهما — هذا هو شرط الذرّية الكلاسيكي لمعاملات قواعد البيانات.

### 4.1 اكتب دالة التحويل

**👟 تلميح البداية :**

أنشئ `inventory/transfers.py` مع دالة تنقل المخزون بين المستودعات بشكل ذرّي.

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

نمط `try/except/finally` يضمن أن أي خطوة فشلت (مخزون غير كافٍ، خطأ قاعدة بيانات) تُرجع المعاملة بأكملها إلى الوراء — لا تحويلات نصف منجزة. تغلق كتلة `finally` الاتصال دائمًا. تُسجَّل الحركة بعد نجاح تحديثات المخزون، لذا إدخال السجل موجود فقط إذا حدث التحويل فعلًا.

**🎯 الناتج المتوقع :**

تُعيد `transfer_stock("WIDGET-A", "WH1", "WH2", 5)` قاموسًا `{"status": "success", "quantity": 5, ...}`. ينخفض WH1 بمقدار 5 ويزيد WH2 بمقدار 5.

**🩹 إذا لم يعمل :**

إذا لم ينقص مخزون المصدر، فقد يستخدم استعلام UPDATE `quantity = ?` بدلًا من `quantity = quantity - ?`. إذا سجّل التحويل لكنه لم يحدّث المخزون، فالالتزام يحدث قبل التحديثات.

### 4.2 تحقّق من التحويلات

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

**🎯 الناتج المتوقع :**

تمر التوكيدات كلها؛ انتقل المخزون بين المستودعات بشكل ذرّي.

**🩹 إذا لم يعمل :**

إذا لم تتطابق الكميات، فقد شُغِّل التحويل مرتين — تحقّق من حالة بيانات العينات.

### 4.3 تحقّق

**✅ قائمة التحقق**

- ✅ التحويل الصالح ينقص المصدر ويزيد الوجهة بنفس المقدار.
- ✅ تحويل أكثر من المخزون المتاح يرفع خطأ `ValueError`.
- ✅ يُسجَّل التحويل في `stock_movements` بسبب «transfer».

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا فشل التحويل في منتصفه (نقص المصدر، والوجهة لم تُحدَّث بعد)، تلغي `rollback` كل شيء. لكن ماذا لو انهار التطبيق بين `commit()` و`conn.close()`؟ فهل البيانات آمنة؟
- كيف تنفّذ سير عمل موافقة على التحويل حيث يجب أن يوافق مدير على التحويلات الكبيرة قبل تنفيذها؟

## الخطوة 5: تنبّأ بالاحتياجات المستقبلية من المخزون

يتنبأ تنبؤ المبيعات بكمية المخزون التي ستحتاجها بناءً على بيانات الحركة التاريخية. تستخدم هذه الخطوة متوسطًا متحركًا بسيطًا — متوسط آخر N أيام من المبيعات — لإسقاط الطلب المستقبلي.

### 5.1 اكتب دالة التنبؤ

**👟 تلميح البداية :**

أنشئ `inventory/forecast.py` مع دالة تحسب تنبؤ متوسط متحرك من حركات المخزون.

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

المتوسط المتحرك أبسط طرق التنبؤ: متوسط آخر N أيام من المبيعات، مضروبًا في أفق التنبؤ. يعتمد تصنيف `confidence` على اكتمال البيانات — إذا كان لديك بيانات مبيعات لمعظم فترة الاسترجاع، فالتنبؤ أجدَر بالثقة. لنظام حقيقي، ستستخدم تنعيمًا أسيًا أو ARIMA، لكن المتوسط المتحرك يلتقط الفكرة الأساسية.

**🎯 الناتج المتوقع :**

تُعيد `forecast_demand("WIDGET-A")` قاموسًا مع `daily_avg` و`forecast_total` و`confidence` بناءً على سجل الحركات.

**🩹 إذا لم يعمل :**

إذا كان التنبؤ دائمًا 0، فلا توجد حركات بسبب `reason='sale'` في بيانات العينات — ستحتاج إلى إضافة بعض مبيعات العينات.

### 5.2 أضف توصيات إعادة التخزين

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

**🎯 الناتج المتوقع :**

تظهر المنتجات التي يتجاوز فيها التنبؤ المخزون الحالي الإضافي إلى نقطة إعادة الطلب في التوصيات، مرتّبةً حسب الإلحاح.

**🩹 إذا لم يعمل :**

إذا لم تظهر توصيات، فالمخزون الحالي مرتفع بما يكفي لتغطية التنبؤ — هذا سلوك صحيح للعناصر عالية التخزين.

### 5.3 تحقّق

**✅ قائمة التحقق**

- ✅ تُعيد `forecast_demand` قيم `daily_avg` و`forecast_total` و`confidence`.
- ✅ تجمع `restock_recommendations` بين التنبؤ ومستويات المخزون الحالية.
- ✅ المنتجات ذات المخزون الكافي لا تظهر في التوصيات.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعامل المتوسط المتحرك كل يوم بالتساوي. ارتفاع المبيعات الأسبوع الماضي سيتخفف بأيام هادئة قبل شهر. كيف يمنحك التنعيم الأسي وزنًا أكبر للبيانات الحديثة؟
- إذا كان للمنتج بيع بالجملة لمرة واحدة (100 وحدة في يوم واحد)، سيقفز المتوسط المتحرك. كيف تكتشف القيم المتطرفة وتستبعدها من التنبؤ؟

## ⚠️ مآزق شائعة

- **عدم استخدام المعاملات للتحويلات.** إذا نقّصت مخزون المصدر لكن فشل تحديث الوجهة، فقد فقدت مخزونًا. لفّ دائمًا تغييرات المخزون متعددة الخطوات في معاملة قاعدة بيانات مع تراجع (rollback).
- **نسيان تسجيل حركات المخزون.** يجب أن يكون لكل تغيير مخزون أثر تدقيق. دون `stock_movements`، لا يمكنك تصحيح الاختلالات أو الإجابة عن «أين ذهبت تلك الـ 50 وحدة؟»
- **التنبؤ من بيانات غير كافية.** متوسط متحرك ببيانات يومين غير موثوق. تصنيف الثقة يساعد، لكن يجب أن تحذر المستخدمين أيضًا عندما يعتمد التنبؤ على تاريخ قصير جدًا.
- **حالات السباق على تحديثات المخزون.** قد يقرأ استدعاءان متزامنان لـ `update_stock` الكمية نفسها ويلغي أحدهما الآخر. في الإنتاج، استخدم `SELECT ... FOR UPDATE` أو القفل المتفائل.
- **تجاهل نفاد مخزون كل مستودع على حدة.** قد يملك المنتج 100 وحدة إجمالًا لكن 0 في مستودع محدد. الإجمالي يبدو جيدًا، لكن العملاء هناك لا يمكنهم شراؤه. تحقّق دائمًا من مستويات كل مستودع للتنفيذ.

## ما بنيته للتو

نظام إدارة مخزون مع قاعدة بيانات SQLite: كتالوج منتجات، وتتبع مخزون متعدد المستودعات، ومسح على نمط الباركود لتحديثات سريعة، وتنبيهات إعادة طلب تمنع نفاد المخزون، وتحويلات ذرّية بين المستودعات مع تسجيل تدقيق، وتنبؤ مبيعات من بيانات الحركة التاريخية. البنية — المنتج، والمستودع، وجدول وصلة المخزون — هي النمط نفسه الذي تستخدمه أنظمة مخزون حقيقية مثل inFlow وSortly وOdoo.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/inventory-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/inventory-manager) في مستودع الدورة نسخة أغنى ببيانات عينات أكثر، ولوحة تحكم ويب، وأداة CLI موصولة من البداية للنهاية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف لوحة تحكم ويب بـ Flask تعرض مستويات المخزون والتنبيهات والتنبؤات في المتصفح.
- نفّذ توليد الباركود: اطبع باركود SKU للعناصر المادية باستخدام مكتبة `python-barcode`.
- ابنِ خط أنابيب استيراد/تصدير CSV فتتمكن من تحميل المنتجات بكميات كبيرة من جدول بيانات.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓