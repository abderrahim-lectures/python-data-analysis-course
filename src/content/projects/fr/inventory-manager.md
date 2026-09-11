---
title: "Gestionnaire d'Inventaire"
description: "Gérez les niveaux de stock avec scan de codes-barres, alertes de réapprovisionnement et support multi-entrepôts."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["cli", "database", "data-analysis"]
learningObjectives:
  - "Concevoir et interroger une base SQLite pour le suivi d'inventaire"
  - "Simuler un scan de codes-barres pour des mises à jour rapides de stock"
  - "Construire un système d'alertes de réapprovisionnement qui signale les articles à stock bas"
  - "Implémenter des transferts inter-entrepôts avec sécurité transactionnelle"
prerequisites: ["Python 101", "Analyse de Données"]
---

# 📦 Construire un Gestionnaire d'Inventaire

Chaque entrepôt, chaque magasin de détail, chaque vendeur e-commerce fait face au même problème : savoir ce qui est en stock, ce qui commence à manquer, et où tout se trouve. Ce projet construit un système de gestion d'inventaire en Python avec un backend SQLite : tu suis les niveaux de stock dans plusieurs entrepôts, tu simules des scans de codes-barres pour des mises à jour rapides, tu reçois des alertes quand les articles atteignent leurs seuils de réapprovisionnement, tu transfères du stock entre les emplacements, et tu prévois les besoins futurs à partir des données historiques. Le système fonctionne en CLI, mais l'architecture est la même que celle qui alimente les vraies plateformes d'inventaire.

Cela suppose Python 101 et une aisance de base avec pandas de Analyse de Données — rien de plus. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Mettre en place un projet avec `uv` et installer les dépendances dont tu auras besoin.
2. Concevoir un schéma de base SQLite pour les produits, les entrepôts et les niveaux de stock.
3. Construire une interface de scan de codes-barres qui recherche les articles et met à jour le stock.
4. Implémenter un système d'alertes de réapprovisionnement qui signale les articles sous leur seuil minimum.
5. Créer des transactions de transfert d'entrepôt qui déplacent le stock entre les emplacements de façon atomique.
6. Ajouter une fonction de prévision des ventes qui prédit les besoins de stock futurs à partir des données historiques.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — ce projet lit et écrit un fichier de base SQLite sur disque, ce qui fonctionne le mieux en dehors d'un notebook.

**Google Colab, Kaggle Notebooks et Binder** fonctionnent pour essayer l'outil. Le notebook crée une base de données en mémoire et utilise des données d'exemple.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/inventory-manager/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/inventory-manager/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Finventory-manager%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python et deux packages.

### Installe `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Met en place le projet

```bash
uv init inventory-manager
cd inventory-manager
uv add click pandas
```

`click` construit le CLI et `pandas` alimente la prévision des ventes. Le projet utilise SQLite depuis la bibliothèque standard pour la base de données — aucun pilote de base de données externe n'est nécessaire.

### Crée la structure du projet

```bash
mkdir -p inventory
touch inventory/__init__.py inventory/db.py inventory/scanner.py inventory/alerts.py inventory/transfers.py inventory/forecast.py inventory/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `inventory-manager/` existe avec un `pyproject.toml`, et `click` et `pandas` sont installés.
- ✅ Le répertoire `inventory/` a tous les fichiers de modules requis.

## Étape 1 : Conçois le schéma de la base de données

Une bonne base d'inventaire suit trois choses : quels produits existent, où ils se trouvent, et combien il y en a dans chaque emplacement. Trois tables — `products`, `warehouses` et `stock` — avec une table de jonction qui relie les produits aux entrepôts.

### 1.1 Crée le schéma

**👟 Indice de départ :** Crée `inventory/db.py` avec des fonctions pour créer les tables et amorcer les données d'exemple.

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

La table `stock` est une table de jonction : chaque ligne dit « le produit X a Y unités dans l'entrepôt Z ». La table `stock_movements` journalise chaque transfert à des fins d'audit. Le `reorder_point` sur les produits définit le seuil sous lequel tu devrais réapprovisionner — différents produits ont différents seuils selon la vitesse à laquelle ils se vendent.

**🎯 Résultat attendu :** `init_db()` crée `inventory.db` avec 4 produits, 2 entrepôts et 7 entrées de stock.

**🩹 Si ça ne marche pas :** Si la base de données existe déjà avec des données différentes, supprime `inventory.db` et ré-exécute `init_db()`.

### 1.2 Vérifie le schéma

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

**🎯 Résultat attendu :** Les deux assertions passent ; la base de données a le nombre attendu de lignes.

**🩹 Si ça ne marche pas :** Si les comptages sont faux, `init_db()` a peut-être tourné deux fois (insérant des doublons). Vérifie le garde `SELECT COUNT(*)`.

### 1.3 Vérifie le schéma de la base de données

**✅ Liste de vérification**

- ✅ `init_db()` crée des tables pour les produits, les entrepôts, le stock et les mouvements de stock.
- ✅ Les données d'exemple peuplent 4 produits, 2 entrepôts et 7 entrées de stock.
- ✅ `get_conn()` retourne une connexion avec la factory `Row` pour un accès de type dictionnaire.

**🤔 Question(s) socratique(s)**

- Pourquoi utiliser une table de jonction (`stock`) au lieu de stocker un `warehouse_id` directement sur la table `products` ? Qu'est-ce qui casse si un produit existe dans deux entrepôts ?
- La table `stock_movements` journalise chaque transfert. Quoi d'autre journaliserais-tu dans un vrai système (qui a initié le transfert, statut d'approbation, numéro de suivi) ?

## Étape 2 : Construis le scanneur de codes-barres

Dans un vrai entrepôt, le personnel scanne les codes-barres pour rechercher les articles et mettre à jour le stock. Ce projet simule cela avec une fonction qui prend un code-barres (SKU), retrouve le produit et te laisse ajouter ou retirer du stock.

### 2.1 Écris les fonctions du scanneur

**👟 Indice de départ :** Crée `inventory/scanner.py` avec des fonctions pour rechercher un produit par SKU et mettre à jour son niveau de stock.

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

La fonction `update_stock` gère trois cas : ajouter du stock à un emplacement existant, retirer du stock (avec une vérification de solde négatif) et créer une nouvelle entrée de stock pour une paire produit-entrepôt qui n'existait pas avant. Chaque changement est journalisé dans `stock_movements` à des fins d'audit. Le paramètre `reason` te permet d'étiqueter les mouvements comme « sale » (vente), « restock » (réapprovisionnement), « adjustment » (ajustement) ou « transfer ».

**🎯 Résultat attendu :** `lookup_product("WIDGET-A")` retourne un dict avec `sku`, `name`, `category`, `reorder_point`. `get_stock("WIDGET-A")` retourne deux entrées (WH1 et WH2).

**🩹 Si ça ne marche pas :** Si `lookup_product` retourne `None` pour un SKU valide, les données d'exemple n'ont pas été insérées. Si `update_stock` lève `ValueError` pour un retrait valide, la vérification de quantité compare de mauvais nombres.

### 2.2 Vérifie le scanneur

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

**🎯 Résultat attendu :** Toutes les assertions passent ; le niveau de stock s'est mis à jour correctement après la vente.

**🩹 Si ça ne marche pas :** Si le stock n'a pas changé, la requête UPDATE ne correspond pas à la bonne ligne — vérifie la clause WHERE.

### 2.3 Vérifie le scanneur

**✅ Liste de vérification**

- ✅ `lookup_product` retourne les détails du produit pour un SKU valide.
- ✅ `get_stock` retourne les niveaux de stock dans tous les entrepôts.
- ✅ `update_stock` ajoute ou retire correctement la quantité et journalise le mouvement.

**🤔 Question(s) socratique(s)**

- Si deux employés scannent le même code-barres en même temps, ils peuvent tous deux lire le même niveau de stock et s'écraser mutuellement leurs modifications. Comment empêcherais-tu cette condition de course dans un système multi-utilisateurs ?
- Le scanneur prend une chaîne SKU. Dans un vrai système, le lecteur de codes-barres saisit directement la chaîne. Comment ajouterais-tu un mode `--scan` qui lit depuis stdin pour un scan continu ?

## Étape 3 : Construis le système d'alertes de réapprovisionnement

Le système d'alertes de réapprovisionnement compare le stock total actuel de chaque produit à son `reorder_point` et signale les articles qui ont besoin d'être réapprovisionnés. C'est le système qui prévient la rupture de stock.

### 3.1 Écris le vérificateur d'alertes

**👟 Indice de départ :** Crée `inventory/alerts.py` avec une fonction qui trouve tous les produits sous leur seuil de réapprovisionnement.

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

La requête SQL joint les produits avec leur stock, additionne les quantités dans tous les entrepôts et filtre les produits dont le total est au niveau ou sous le point de réapprovisionnement. Le `COALESCE` gère les produits à stock nul (aucune ligne dans la table `stock`). Les résultats sont triés par ratio stock-sur-réapprovisionnement pour que les articles les plus urgents apparaissent en premier.

**🎯 Résultat attendu :** `check_reorder_alerts()` retourne une liste incluant `WIDGET-B` (stock total = 3, point de réapprovisionnement = 5) triée par urgence.

**🩹 Si ça ne marche pas :** Si aucune alerte n'apparaît, les niveaux de stock des données d'exemple sont tous au-dessus des points de réapprovisionnement — vérifie les valeurs des données d'exemple. Si le total est faux, le `SUM` inclut des mouvements d'autres produits — vérifie la jonction.

### 3.2 Vérifie les alertes

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

**🎯 Résultat attendu :** Les deux assertions passent ; WIDGET-B est signalé, WIDGET-A ne l'est pas.

**🩹 Si ça ne marche pas :** Si WIDGET-A apparaît dans les alertes, le point de réapprovisionnement est peut-être trop haut dans les données d'exemple.

### 3.3 Vérifie les alertes

**✅ Liste de vérification**

- ✅ Les produits dont le stock total est sous leur point de réapprovisionnement apparaissent dans la liste d'alertes.
- ✅ Les produits au-dessus de leur point de réapprovisionnement n'apparaissent pas.
- ✅ Les alertes sont triées par urgence (ratio stock-sur-réapprovisionnement le plus bas d'abord).

**🤔 Question(s) socratique(s)**

- Le système d'alertes vérifie le stock total dans tous les entrepôts. Mais si WIDGET-A a 25 unités dans WH1 et 0 dans WH2, l'emplacement WH2 pourrait être en rupture alors que le total semble correct. Comment ajouterais-tu des alertes par entrepôt ?
- Que se passe-t-il quand le point de réapprovisionnement d'un produit change ? Les alertes existantes devraient-elles être recalculées immédiatement ou traitées par lots pendant la nuit ?

## Étape 4 : Implémente les transferts d'entrepôt

Déplacer du stock entre entrepôts est une transaction à deux faces : diminuer à la source, augmenter à la destination. Si l'un des deux côtés échoue, aucun ne devrait se produire — c'est l'exigence classique d'atomicité des transactions de base de données.

### 4.1 Écris la fonction de transfert

**👟 Indice de départ :** Crée `inventory/transfers.py` avec une fonction qui déplace atomiquement le stock entre les entrepôts.

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

Le motif `try/except/finally` garantit que si une étape échoue (stock insuffisant, erreur de base de données), toute la transaction est annulée — pas de transferts à moitié terminés. Le bloc `finally` ferme toujours la connexion. Le mouvement est journalisé après que les mises à jour de stock réussissent, donc l'entrée de journal n'existe que si le transfert a réellement eu lieu.

**🎯 Résultat attendu :** `transfer_stock("WIDGET-A", "WH1", "WH2", 5)` retourne `{"status": "success", "quantity": 5, ...}`. WH1 baisse de 5, WH2 augmente de 5.

**🩹 Si ça ne marche pas :** Si le stock source ne diminue pas, la requête UPDATE utilise peut-être `quantity = ?` au lieu de `quantity = quantity - ?`. Si le transfert journalise mais ne met pas à jour le stock, le commit se produit avant les mises à jour.

### 4.2 Vérifie les transferts

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

**🎯 Résultat attendu :** Toutes les assertions passent ; le stock a été déplacé atomiquement entre les entrepôts.

**🩹 Si ça ne marche pas :** Si les quantités ne correspondent pas, le transfert a peut-être tourné deux fois — vérifie l'état des données d'exemple.

### 4.3 Vérifie les transferts

**✅ Liste de vérification**

- ✅ Un transfert valide diminue la source et augmente la destination d'autant.
- ✅ Transférer plus que le stock disponible lève `ValueError`.
- ✅ Le transfert est journalisé dans `stock_movements` avec la raison « transfer ».

**🤔 Question(s) socratique(s)**

- Si le transfert échoue à mi-chemin (source diminuée, destination pas encore mise à jour), le rollback défait tout. Mais que se passe-t-il si l'application plante entre `commit()` et `conn.close()` ? Les données sont-elles sûres ?
- Comment implémenterais-tu un flux d'approbation de transfert où un gestionnaire doit approuver les gros transferts avant qu'ils ne s'exécutent ?

## Étape 5 : Prévois les besoins de stock futurs

La prévision des ventes prédit la quantité de stock dont tu auras besoin à partir des données de mouvement historiques. Cette étape utilise une simple moyenne mobile — la moyenne des ventes des N derniers jours — pour projeter la demande future.

### 5.1 Écris la fonction de prévision

**👟 Indice de départ :** Crée `inventory/forecast.py` avec une fonction qui calcule une prévision par moyenne mobile depuis les mouvements de stock.

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

La moyenne mobile est la méthode de prévision la plus simple : moyenne les ventes des N derniers jours, multiplie par l'horizon de prévision. La note `confidence` repose sur la complétude des données — si tu as des données de ventes sur la majeure partie de la période de recul, la prévision est plus fiable. Pour un vrai système, tu utiliserais un lissage exponentiel ou ARIMA, mais la moyenne mobile capture l'idée centrale.

**🎯 Résultat attendu :** `forecast_demand("WIDGET-A")` retourne un dict avec `daily_avg`, `forecast_total` et `confidence` basés sur l'historique des mouvements.

**🩹 Si ça ne marche pas :** Si la prévision est toujours 0, il n'y a aucun mouvement avec `reason='sale'` dans les données d'exemple — tu devrais ajouter quelques ventes d'exemple.

### 5.2 Ajoute des recommandations de réapprovisionnement

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

**🎯 Résultat attendu :** Les produits où la prévision dépasse le stock actuel plus le point de réapprovisionnement apparaissent dans les recommandations, triés par urgence.

**🩹 Si ça ne marche pas :** Si aucune recommandation n'apparaît, le stock actuel est assez haut pour couvrir la prévision — c'est un comportement correct pour les articles bien approvisionnés.

### 5.3 Vérifie la prévision

**✅ Liste de vérification**

- ✅ `forecast_demand` retourne `daily_avg`, `forecast_total` et `confidence`.
- ✅ `restock_recommendations` combine la prévision avec les niveaux de stock actuels.
- ✅ Les produits avec un stock suffisant n'apparaissent pas dans les recommandations.

**🤔 Question(s) socratique(s)**

- La moyenne mobile traite chaque jour de façon égale. Un pic de ventes la semaine dernière serait dilué par les jours calmes d'il y a un mois. Comment le lissage exponentiel donnerait-il plus de poids aux données récentes ?
- Si un produit avait une vente groupée ponctuelle (100 unités en un jour), la moyenne mobile grimperait. Comment détecterais-tu et exclurais-tu les valeurs aberrantes de la prévision ?

## ⚠️ Pièges courants

- **Ne pas utiliser de transactions pour les transferts.** Si tu diminues le stock source mais que la mise à jour de destination échoue, tu as perdu de l'inventaire. Enveloppe toujours les changements de stock multi-étapes dans une transaction de base de données avec rollback.
- **Oublier de journaliser les mouvements de stock.** Chaque changement de stock devrait avoir une piste d'audit. Sans `stock_movements`, tu ne peux pas déboguer les écarts ni répondre à « où sont passées ces 50 unités ? »
- **Prévoir à partir de données insuffisantes.** Une moyenne mobile avec 2 jours de données n'est pas fiable. La note de confiance aide, mais tu devrais aussi avertir les utilisateurs quand la prévision repose sur très peu d'historique.
- **Conditions de course sur les mises à jour de stock.** Deux appels `update_stock` simultanés pourraient lire la même quantité et s'écraser mutuellement. En production, utilise `SELECT ... FOR UPDATE` ou un verrouillage optimiste.
- **Ignorer les ruptures de stock par entrepôt.** Un produit peut avoir 100 unités au total mais 0 dans un entrepôt spécifique. Le total semble correct, mais les clients de cet emplacement ne peuvent pas l'acheter. Vérifie toujours les niveaux par entrepôt pour l'exécution des commandes.

## Ce que tu viens de construire

Un système de gestion d'inventaire avec un backend SQLite : catalogue de produits, suivi de stock multi-entrepôts, scan de type code-barres pour des mises à jour rapides, alertes de réapprovisionnement qui préviennent les ruptures de stock, transferts atomiques entre entrepôts avec journalisation d'audit et prévision des ventes à partir des données de mouvement historiques. L'architecture — produit, entrepôt, table de jonction de stock — est le même motif que celui utilisé par de vrais systèmes d'inventaire comme inFlow, Sortly et Odoo.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/inventory-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/inventory-manager) dans le dépôt du cours a une version plus riche avec plus de données d'exemple, un tableau de bord web et le CLI câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute un tableau de bord web avec Flask qui affiche les niveaux de stock, les alertes et les prévisions dans un navigateur.
- Implémente la génération de codes-barres : imprime des codes-barres SKU pour les articles physiques avec la bibliothèque `python-barcode`.
- Construis un pipeline d'import/export CSV pour pouvoir charger en masse des produits depuis une feuille de calcul.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓