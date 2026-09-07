---
title: "Gestor de Inventario"
description: "Gestiona niveles de stock con escaneo de códigos de barras, alertas de reorden y soporte multi-almacén."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["cli", "database", "data-analysis"]
learningObjectives:
  - "Diseñar y consultar una base de datos SQLite para el seguimiento del inventario"
  - "Simular el escaneo de códigos de barras para actualizaciones rápidas de stock"
  - "Construir un sistema de alertas de reorden que marque los artículos con stock bajo"
  - "Implementar transferencias entre almacenes con seguridad transaccional"
prerequisites: ["Python 101", "Data Analysis"]
---

# 📦 Construye un Gestor de Inventario

Cada almacén, cada tienda minorista, cada vendedor de e-commerce se enfrenta al mismo problema: saber qué hay en stock, qué se está agotando y dónde está todo. Este proyecto construye un sistema de gestión de inventario en Python con backend SQLite: haces seguimiento de los niveles de stock en múltiples almacenes, simulas escaneos de códigos de barras para actualizaciones rápidas, recibes alertas cuando los artículos alcanzan los umbrales de reorden, transfieres stock entre ubicaciones y prevés las necesidades futuras a partir de datos históricos. El sistema se ejecuta como CLI, pero la arquitectura es la misma que impulsa las plataformas de inventario reales.

Esto asume Python 101 y comodidad básica con pandas de Análisis de Datos — nada más. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias que necesitarás.
2. Diseñar un esquema de base de datos SQLite para productos, almacenes y niveles de stock.
3. Construir una interfaz de escaneo de códigos de barras que busque artículos y actualice el stock.
4. Implementar un sistema de alertas de reorden que marque los artículos por debajo de su umbral mínimo.
5. Crear transacciones de transferencia entre almacenes que muevan stock entre ubicaciones de forma atómica.
6. Añadir una función de previsión de ventas que prediga las necesidades futuras de stock a partir de datos históricos.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — este proyecto lee y escribe un archivo de base de datos SQLite en disco, lo que funciona mejor fuera de un notebook.

**Google Colab, Kaggle Notebooks y Binder** funcionan para probar la herramienta. El notebook crea una base de datos en memoria y usa datos de muestra.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/inventory-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/inventory-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Finventory-manager%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python y dos paquetes.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init inventory-manager
cd inventory-manager
uv add click pandas
```

`click` construye el CLI y `pandas` impulsa la previsión de ventas. El proyecto usa SQLite de la librería estándar para la base de datos — no se necesita ningún driver de base de datos externo.

### Crea la estructura del proyecto

```bash
mkdir -p inventory
touch inventory/__init__.py inventory/db.py inventory/scanner.py inventory/alerts.py inventory/transfers.py inventory/forecast.py inventory/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `inventory-manager/` existe con un `pyproject.toml`, y `click` y `pandas` están instalados.
- ✅ El directorio `inventory/` tiene todos los archivos de módulo requeridos.

## Paso 1: Diseña el esquema de la base de datos

Una buena base de datos de inventario hace seguimiento de tres cosas: qué productos existen, dónde están y cuántos hay en cada ubicación. Tres tablas — `products`, `warehouses` y `stock` — con una tabla de unión que vincula los productos con los almacenes.

### 1.1 Crea el esquema

**👟 Pista inicial :** Crea `inventory/db.py` con funciones para crear las tablas y sembrar datos de muestra.

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

La tabla `stock` es una tabla de unión: cada fila dice "el producto X tiene Y unidades en el almacén Z." La tabla `stock_movements` registra cada transferencia con fines de auditoría. El `reorder_point` en los productos define el umbral por debajo del cual deberías hacer un reorden — productos diferentes tienen umbrales distintos dependiendo de qué tan rápido se venden.

**🎯 Resultado esperado :** `init_db()` crea `inventory.db` con 4 productos, 2 almacenes y 7 entradas de stock.

**🩹 Si sale mal :** Si la base de datos ya existe con datos diferentes, borra `inventory.db` y vuelve a ejecutar `init_db()`.

### 1.2 Verifica el esquema

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

**🎯 Resultado esperado :** Ambas afirmaciones (assertions) pasan; la base de datos tiene el número esperado de filas.

**🩹 Si sale mal :** Si los conteos son incorrectos, `init_db()` puede haberse ejecutado dos veces (insertando duplicados). Revisa la guarda `SELECT COUNT(*)`.

### 1.3 Verifica

**✅ Lista de verificación**

- ✅ `init_db()` crea tablas para products, warehouses, stock y stock_movements.
- ✅ Los datos de semilla pueblan 4 productos, 2 almacenes y 7 entradas de stock.
- ✅ `get_conn()` devuelve una conexión con la factory `Row` para acceso tipo dict.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué usar una tabla de unión (`stock`) en lugar de almacenar un `warehouse_id` directamente en la tabla `products`? ¿Qué se rompe si un producto existe en dos almacenes?
- La tabla `stock_movements` registra cada transferencia. ¿Qué más registrarías en un sistema real (quién inició la transferencia, estado de aprobación, número de seguimiento)?

## Paso 2: Construye el escáner de códigos de barras

En un almacén real, el personal escanea códigos de barras para buscar artículos y actualizar el stock. Este proyecto lo simula con una función que toma un código de barras (SKU), busca el producto y te permite añadir o quitar stock.

### 2.1 Escribe las funciones del escáner

**👟 Pista inicial :** Crea `inventory/scanner.py` con funciones para buscar un producto por SKU y actualizar su nivel de stock.

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

La función `update_stock` maneja tres casos: añadir stock a una ubicación existente, quitar stock (con un chequeo de balance negativo) y crear una entrada de stock nueva para un par producto-almacén que no existía antes. Cada cambio se registra en `stock_movements` con fines de auditoría. El parámetro `reason` te permite etiquetar los movimientos como "sale" (venta), "restock" (reabastecimiento), "adjustment" (ajuste) o "transfer" (transferencia).

**🎯 Resultado esperado :** `lookup_product("WIDGET-A")` devuelve un dict con `sku`, `name`, `category`, `reorder_point`. `get_stock("WIDGET-A")` devuelve dos entradas (WH1 y WH2).

**🩹 Si sale mal :** Si `lookup_product` devuelve `None` para un SKU válido, los datos de semilla no se insertaron. Si `update_stock` lanza `ValueError` para una eliminación válida, la verificación de cantidad está comparando números equivocados.

### 2.2 Verifica el escáner

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

**🎯 Resultado esperado :** Todas las afirmaciones pasan; el nivel de stock se actualizó correctamente después de la venta.

**🩹 Si sale mal :** Si el stock no cambió, la consulta UPDATE no está coincidiendo con la fila correcta — revisa la cláusula WHERE.

### 2.3 Verifica

**✅ Lista de verificación**

- ✅ `lookup_product` devuelve los detalles del producto para un SKU válido.
- ✅ `get_stock` devuelve los niveles de stock en todos los almacenes.
- ✅ `update_stock` añade o quita cantidad correctamente y registra el movimiento.

**🤔 Pregunta(s) socrática(s)**

- Si dos miembros del personal escanean el mismo código de barras al mismo tiempo, ambos podrían leer el mismo nivel de stock y sobrescribir los cambios del otro. ¿Cómo evitarías esta condición de carrera en un sistema multiusuario?
- El escáner toma una cadena SKU. En un sistema real, el escáner de códigos de barras introduce la cadena directamente. ¿Cómo añadirías un modo `--scan` que lea de stdin para el escaneo continuo?

## Paso 3: Construye el sistema de alertas de reorden

El sistema de alertas de reorden compara el stock total actual de cada producto contra su `reorder_point` y marca los artículos que necesitan reabastecimiento. Es el sistema que previene los desabastecimientos (stockouts).

### 3.1 Escribe el verificador de alertas

**👟 Pista inicial :** Crea `inventory/alerts.py` con una función que encuentre todos los productos por debajo de su umbral de reorden.

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

La consulta SQL une los productos con su stock, suma las cantidades en todos los almacenes y filtra a los productos cuyo total está en o por debajo del punto de reorden. El `COALESCE` maneja los productos con stock cero (sin filas en la tabla `stock`). Los resultados se ordenan por la relación stock-a-reorden para que los artículos más urgentes aparezcan primero.

**🎯 Resultado esperado :** `check_reorder_alerts()` devuelve una lista que incluye `WIDGET-B` (stock total = 3, punto de reorden = 5) ordenada por urgencia.

**🩹 Si sale mal :** Si no aparecen alertas, los niveles de stock de los datos de semilla están todos por encima de los puntos de reorden — revisa los valores de los datos de semilla. Si el total es incorrecto, el `SUM` está incluyendo movimientos de otros productos — revisa el JOIN.

### 3.2 Verifica las alertas

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

**🎯 Resultado esperado :** Ambas afirmaciones pasan; WIDGET-B está marcado y WIDGET-A no.

**🩹 Si sale mal :** Si WIDGET-A aparece en las alertas, el punto de reorden puede estar establecido demasiado alto en los datos de semilla.

### 3.3 Verifica las alertas

**✅ Lista de verificación**

- ✅ Los productos con stock total por debajo de su punto de reorden aparecen en la lista de alertas.
- ✅ Los productos por encima de su punto de reorden no aparecen.
- ✅ Las alertas se ordenan por urgencia (menor relación stock-a-reorden primero).

**🤔 Pregunta(s) socrática(s)**

- El sistema de alertas revisa el stock total en todos los almacenes. Pero si WIDGET-A tiene 25 unidades en WH1 y 0 en WH2, la ubicación WH2 podría quedarse sin stock mientras el total parece bien. ¿Cómo añadirías alertas por almacén?
- ¿Qué pasa cuando cambia el punto de reorden de un producto? ¿Deberían recalcularse las alertas existentes inmediatamente o procesarse por lotes durante la noche?

## Paso 4: Implementa transferencias entre almacenes

Mover stock entre almacenes es una transacción de dos lados: restar en el origen, sumar en el destino. Si falla cualquiera de los dos lados, no debería ocurrir ninguno — este es el requisito clásico de atomicidad de las transacciones de base de datos.

### 4.1 Escribe la función de transferencia

**👟 Pista inicial :** Crea `inventory/transfers.py` con una función que mueva stock entre almacenes de forma atómica.

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

El patrón `try/except/finally` garantiza que si falla cualquier paso (stock insuficiente, error de base de datos), toda la transacción se revierte — sin transferencias a medias. El bloque `finally` siempre cierra la conexión. El movimiento se registra después de que las actualizaciones de stock tengan éxito, así que la entrada del registro solo existe si la transferencia realmente ocurrió.

**🎯 Resultado esperado :** `transfer_stock("WIDGET-A", "WH1", "WH2", 5)` devuelve `{"status": "success", "quantity": 5, ...}`. WH1 baja 5 y WH2 sube 5.

**🩹 Si sale mal :** Si el stock del origen no está bajando, la consulta UPDATE puede estar usando `quantity = ?` en lugar de `quantity = quantity - ?`. Si la transferencia se registra pero no actualiza el stock, el commit está ocurriendo antes de las actualizaciones.

### 4.2 Verifica las transferencias

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

**🎯 Resultado esperado :** Todas las afirmaciones pasan; el stock se movió de forma atómica entre almacenes.

**🩹 Si sale mal :** Si las cantidades no coinciden, la transferencia puede haberse ejecutado dos veces — revisa el estado de los datos de semilla.

### 4.3 Verifica las transferencias

**✅ Lista de verificación**

- ✅ Una transferencia válida resta del origen y suma al destino la misma cantidad.
- ✅ Transferir más stock que el disponible lanza `ValueError`.
- ✅ La transferencia se registra en `stock_movements` con la razón "transfer".

**🤔 Pregunta(s) socrática(s)**

- Si la transferencia falla a la mitad (origen reducido, destino aún no actualizado), el rollback lo deshace todo. Pero ¿qué pasa si la aplicación se bloquea entre `commit()` y `conn.close()`? ¿Están los datos seguros?
- ¿Cómo implementarías un flujo de trabajo de aprobación de transferencias donde un gerente tenga que aprobar las transferencias grandes antes de que se ejecuten?

## Paso 5: Prevée las necesidades futuras de stock

La previsión de ventas predice cuánto stock necesitarás basándose en los datos históricos de movimiento. Este paso usa una media móvil simple — el promedio de los últimos N días de ventas — para proyectar la demanda futura.

### 5.1 Escribe la función de previsión

**👟 Pista inicial :** Crea `inventory/forecast.py` con una función que calcule una previsión de media móvil a partir de los movimientos de stock.

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

La media móvil es el método de previsión más simple: promedia los últimos N días de ventas y multiplica por el horizonte de previsión. La calificación `confidence` se basa en la completitud de los datos — si tienes datos de ventas de la mayor parte del período de retroceso (lookback), la previsión es más confiable. Para un sistema real usarías suavizado exponencial o ARIMA, pero la media móvil captura la idea central.

**🎯 Resultado esperado :** `forecast_demand("WIDGET-A")` devuelve un dict con `daily_avg`, `forecast_total` y `confidence` basados en el historial de movimientos.

**🩹 Si sale mal :** Si la previsión es siempre 0, no hay movimientos con `reason='sale'` en los datos de semilla — necesitarías añadir algunas ventas de muestra.

### 5.2 Añade recomendaciones de reposición

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

**🎯 Resultado esperado :** Los productos donde la previsión supera el stock actual más el punto de reorden aparecen en las recomendaciones, ordenados por urgencia.

**🩹 Si sale mal :** Si no aparecen recomendaciones, el stock actual es suficiente para cubrir la previsión — ese es el comportamiento correcto para artículos bien surtidos.

### 5.3 Verifica la previsión

**✅ Lista de verificación**

- ✅ `forecast_demand` devuelve `daily_avg`, `forecast_total` y `confidence`.
- ✅ `restock_recommendations` combina la previsión con los niveles de stock actuales.
- ✅ Los productos con stock suficiente no aparecen en las recomendaciones.

**🤔 Pregunta(s) socrática(s)**

- La media móvil trata cada día por igual. Un pico de ventas la semana pasada quedaría diluido por los días tranquilos de hace un mes. ¿Cómo daría el suavizado exponencial más peso a los datos recientes?
- Si un producto tuvo una venta masiva única (100 unidades en un día), la media móvil se dispararía. ¿Cómo detectarías y excluirías los valores atípicos (outliers) de la previsión?

## ⚠️ Errores comunes

- **No usar transacciones para las transferencias.** Si restringes el stock del origen pero falla la actualización del destino, has perdido inventario. Envuelve siempre los cambios de stock de varios pasos en una transacción de base de datos con rollback.
- **Olvidar registrar los movimientos de stock.** Cada cambio de stock debería tener una pista de auditoría. Sin `stock_movements`, no puedes depurar discrepancias ni responder "¿a dónde fueron esas 50 unidades?"
- **Prever a partir de datos insuficientes.** Una media móvil con 2 días de datos no es confiable. La calificación de confianza ayuda, pero también deberías advertir a los usuarios cuando la previsión se base en muy poca historia.
- **Condiciones de carrera en las actualizaciones de stock.** Dos llamadas `update_stock` concurrentes podrían leer ambas la misma cantidad y sobrescribirse. En producción, usa `SELECT ... FOR UPDATE` o bloqueo optimista.
- **Ignorar los desabastecimientos por almacén.** Un producto puede tener 100 unidades en total pero 0 en un almacén específico. El total parece bien, pero los clientes en esa ubicación no pueden comprarlo. Revisa siempre los niveles por almacén para el cumplimiento de pedidos.

## Lo que acabas de construir

Un sistema de gestión de inventario con backend SQLite: catálogo de productos, seguimiento de stock multi-almacén, escaneo estilo código de barras para actualizaciones rápidas, alertas de reorden que previenen desabastecimientos, transferencias atómicas entre almacenes con registro de auditoría y previsión de ventas a partir de los datos históricos de movimiento. La arquitectura — producto, almacén, tabla de unión de stock — es el mismo patrón que usan los sistemas de inventario reales como inFlow, Sortly y Odoo.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/inventory-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/inventory-manager) en el repositorio del curso tiene una versión más rica con más datos de muestra, un panel web y el CLI conectado de principio a fin. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Añade un panel web con Flask que muestre los niveles de stock, las alertas y las previsiones en el navegador.
- Implementa la generación de códigos de barras: imprime códigos de barras SKU para los artículos físicos con la librería `python-barcode`.
- Construye una canalización de importación/exportación CSV para poder cargar productos en masa desde una hoja de cálculo.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa y apta para principiantes sobre cómo añadir el tuyo mediante una **pull request**, incluso si nunca has usado git: hacer un fork del repositorio, crear una rama, hacer commit de tus archivos y abrir la PR, paso a paso. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓