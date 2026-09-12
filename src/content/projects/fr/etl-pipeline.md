---
title: "Constructeur de Pipeline ETL"
description: "Extrayez, transformez et chargez des données de sources multiples avec planification et récupération d'erreurs."
difficulty: "intermediate"
estimatedMinutes: 85
tags: ["cli", "csv", "json", "sqlite", "pipeline"]
prerequisites:
  - "Les bases de Python (listes, dictionnaires, boucles, fonctions)"
  - "À l'aise avec les fichiers csv/json et le terminal"
learningObjectives:
  - "Extraire des données de sources CSV et JSON en enregistrements simples"
  - "Nettoyer et joindre deux sources, en signalant chaque ligne ignorée"
  - "Agréger les totaux de lignes par ville dans un rapport de revenus"
  - "Charger les enregistrements dans SQLite de façon idempotente avec des clés primaires"
  - "Protéger le pipeline contre une source manquante et le relancer en sécurité"
---

# 🔄 Construis un Pipeline ETL

Chaque vrai travail de données ressemble à cela : prendre des commandes d'un CSV et des clients d'un JSON, les joindre, laisser tomber les lignes qui n'appartiennent pas, totaliser les choses, et écrire le résultat quelque part où un outil peut l'interroger. Ce schéma, **Extract, Transform, Load**, est ce que ce projet construit avec rien de plus que la bibliothèque standard : un extracteur CSV, un extracteur JSON, une transformation qui nettoie et joint en signalant chaque saut, une agrégation qui répond à « revenus par ville », et un chargement SQLite qui est *idempotent* : exécute-le cinq fois, il reste exactement quatre lignes. L'étape finale durcit le tout contre sa défaillance de production la plus courante, un fichier source manquant, sans laisser l'entrepôt dans un état à moitié écrit. Pas de pandas. Pas de framework. Juste `csv`, `json` et `sqlite3` qui font un vrai travail.

Ce projet suppose que tu maîtrises Python 101, listes, dicts, boucles, fonctions, plus une lecture aisée des fichiers et un terminal. Rien ici n'a besoin de numpy ou pandas. Il est facultatif et non noté ; consulte [Real-World Projects](/fr/projets) pour la liste complète, qui ne cesse de s'allonger.

## 🎯 Ce que tu vas faire

1. Extraire un `orders.csv` et un `customers.json` en enregistrements Python simples.
2. Transformer : nettoyer les lignes, joindre les noms et villes des clients, calculer `line_total`, et rapporter les deux commandes ignorées.
3. Agréger les revenus par ville, triés du plus élevé au plus bas.
4. Charger les enregistrements nettoyés dans SQLite avec un upsert idempotent, exécute-le deux fois, toujours 4 lignes.
5. Durcir l'extraction contre un fichier manquant et relancer tout le pipeline en sécurité.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé, un travail ETL est un pipeline fichier-en/fichier-out (CSV/JSON en entrée, SQLite en sortie) et les fichiers SQLite appartiennent à ton terminal.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal de navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent, le notebook à [`examples/etl-pipeline/notebook.fr.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.fr.ipynb) exécute l'ETL identique sur les sources d'échantillon fournies en mémoire.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fetl-pipeline%2Fnotebook.fr.ipynb)

## Configuration

`uv` est un outil unique qui remplace la chaîne « installer Python, puis pip, puis un outil d'environnement virtuel », et ce projet est du pur standard library.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme l'installation :

```bash
uv --version
```

Puis configure le projet :

```bash
uv init etl-pipeline
cd etl-pipeline
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `etl-pipeline/` existe avec un `pyproject.toml`.
- ✅ `python -c "import csv, json, sqlite3"` réussit, toute la pile, stdlib uniquement.

## Étape 1 : Extraire les deux sources

Le premier acte de l'ETL est *juste* de la lecture : les commandes CSV arrivent comme des dicts via `csv.DictReader`, les clients JSON comme une liste via `json.load`. Rien n'est encore nettoyé, l'extraction est délibérément stupide, donc la transformation possède tout jugement et les deux ne se brouillent jamais. Les vrais pipelines extraient d'abord et *échouent durement si une source manque* plus tard (étape 5) ; ici, l'étape 1 prouve les deux lecteurs.

### 1.1 Écris les fichiers sources et l'extracteur

**👟 Indice de départ :** Une fonction lisant un CSV, un `json.load` lisant le JSON, renvoyant des enregistrements simples :

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

`csv.DictReader` consomme une ligne d'en-tête pour les clés, donc chaque ligne sort déjà nommée par champ, `{"order_id": "o1", ...}`, et `list(...)` photographie les six lignes d'un coup. `json.load` analyse le tableau en une liste de dicts. Les annotations de type de retour (un tuple de deux listes) sont le contrat en aval : la transformation reçoit exactement ce qu'elle attend, et toute autre chose casse au site d'appel, bruyamment. Note que les valeurs `order_id: o1` et `customer_id: c1` sont encore des *chaînes*, l'extraction ne fait aucun calcul, aucune conversion float, aucun jugement.

**🎯 Résultat attendu :**

```
extracted 6 orders, 3 customers
first order: {'order_id': 'o1', 'customer_id': 'c1', 'product': 'laptop', 'qty': '1', 'price': '1200.00', 'status': 'delivered'}
first customer: {'customer_id': 'c1', 'name': 'Ada Lovelace', 'city': 'London'}
```

**🩹 Si ça ne marche pas :** Si `customers` s'imprime comme une chaîne ou un dict au lieu d'une liste, `customers.json` n'est pas un tableau de premier niveau (la ligne d'ouverture `[`), `json.load` renvoie ce que le fichier est réellement. Si `orders` est `[]`, le CSV n'a pas de lignes avec des valeurs ou la ligne d'en-tête manque du saut de ligne final, imprime `open("orders.csv").read()` pour voir exactement ce que `DictReader` a vu.

### 1.2 Vérifie l'extracteur

**✅ Liste de vérification**

- ✅ 6 commandes et 3 clients s'extraient ; o1/o2/o3/o5 portent les mêmes clés que la ligne d'en-tête.
- ✅ `price` est encore la chaîne `"1200.00"`, aucun calcul au moment de l'extraction.
- ✅ `customers.json` se charge comme une liste de dicts, un par client.

**🤔 Question(s) socratique(s)**

- L'extraction est « stupide » exprès, mais elle a quand même choisi une forme : des lignes de dict avec des valeurs en chaînes. Qu'est-ce qu'un extracteur *typé par schéma* (nombres analysés, énums appliqués) changerait à la confiance en aval, et à quel coût quand le fournisseur CSV renomme une colonne ?
- `csv.DictReader` est en virgule par défaut. Nomme les deux valeurs que cette étape code déjà en dur implicitement (délimiteur, guillemets) et comment un vrai travail en ferait des *intrants de pipeline explicites* plutôt que des accidents de format de fichier.

## Étape 2 : Transformer, nettoyer et joindre

La transformation possède le jugement : les commandes `cancelled` ne comptent pas comme revenus, une commande dont le client n'existe pas ne peut pas être jointe, `qty ≤ 0` ou `price < 0` est du rebut, et chaque saut est *rapporté*, jamais avalé en silence. Les lignes qui passent deviennent des enregistrements enrichis avec les noms de clients, les villes et un `line_total` calculé. Deux des six commandes sont rejetées exactement comme conçu, et le pipeline le dit.

### 2.1 Écris le nettoyeur/jointeur

**👟 Indice de départ :** Construis d'abord la recherche `customer_by_id` (un dict), puis boucle, décide *sauter ou garder*, et rapporte chaque saut :

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

Le dict `customer_by_id` est la jointure : `customer_by_id.get(o["customer_id"])` transforme une recherche de client CSV de O(n) par commande en O(1), et `None` sert doublement de signal « suspendu » pour o6. La liste des sauts est la piste d'audit, `("o4", "cancelled")`, `("o6", "no customer")`, et elle est renvoyée aux côtés des lignes propres, pour que l'analyse puisse *aussi* porter sur ce qui a été jeté. Les conversions `float()` arrivent ici, à la frontière : de « chaînes moyennement fiables » à des nombres sous notre contrôle, juste avant l'arithmétique.

**🎯 Résultat attendu :**

```
cleaned: 4  skipped: 2
  o1 Ada Lovelace   laptop     1 x $1200.00 = $1200.00 (delivered)
  o2 Grace Hopper   mouse      2 x $25.00 = $50.00 (delivered)
  o3 Ada Lovelace   monitor    1 x $300.00 = $300.00 (delivered)
  o5 Grace Hopper   laptop     1 x $1200.00 = $1200.00 (pending)
skipped: [('o4', 'cancelled'), ('o6', 'no customer')]
```

**🩹 Si ça ne marche pas :** Si o6 apparaît dans `cleaned` avec un nom vide, le `continue` après `customer is None` manque et `customer["name"]` percute `None`, le saut doit `continue, pas retomber. Si rien n'est sauté du tout, `CLEAN_STATUSES` manque `"pending"`, attends, cela saute o5, pas o4, donc revérifie la chaîne `"cancelled"` contre la valeur `status` réelle du CSV.

### 2.2 Vérifie la transformation

**✅ Liste de vérification**

- ✅ 4 propres / 2 sautés ; o1/o2/o3/o5 reçoivent de vrais noms et villes de clients.
- ✅ o4 (cancelled) et o6 (client inconnu) apparaissent dans `skipped` avec des raisons.
- ✅ `line_total` = `qty × price`, arrondi à 2 décimales : o2 = `2 × 25 = $50.00`.

**🤔 Question(s) socratique(s)**

- o6 a un id de client *jamais défini*, une violation de clé étrangère que le côté CSV ne peut pas corriger. Où doit vivre l'enregistrement autoritaire « qui est c4 », et quel côté du pipeline (extraction, transformation ou la source clients) *aurait dû* l'attraper ?
- Une raison de saut est une chaîne (`"cancelled"`). Si le fournisseur changeait le vocabulaire de statut le mois prochain (`"refunded"`, `"reversed"`), chaque nouvelle valeur *passe* silencieusement le contrôle `not in CLEAN_STATUSES` comme revenus. Quel est le défaut conservateur pour un statut inconnu, et que te donne la piste d'audit des sauts qu'un compte silencieux ne donnerait jamais ?

## Étape 3 : Agréger les revenus par ville

Les enregistrements propres en main, l'agrégation répond à la question métier : *qui génère les revenus ?* Un `defaultdict(float)` accumule `line_total` par ville, et le tri par revenus décroissants met Londres en premier. C'est le second acte de la transformation, même liste nettoyée, nouvelle forme, pas de re-nettoyage.

### 3.1 Écris l'agrégation par ville

**👟 Indice de départ :** `by_city[record["city"]] += record["line_total"]` sur les lignes nettoyées, puis `sorted(..., reverse=True)` :

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

`defaultdict(float)` est l'accumulateur classique : une clé de ville inconnue naît à `0.0` et s'incrémente à partir de là. `sum(by_city.values())` re-dérive le total de l'agrégation elle-même, donc le grand total ne peut jamais être en désaccord avec les lignes par ville, une source unique de vérité pour les deux. Et `sorted(..., key=lambda kv: kv[1], reverse=True)` regarde les paires `(ville, revenus)` et trie sur le second élément décroissant, un rang, pas un ordre alphabétique.

**🎯 Résultat attendu :**

```
== revenue by city ==
  London     $ 1,500.00
  New York   $ 1,250.00

total revenue: $2,750.00
```

**🩹 Si ça ne marche pas :** Si Londres et New York s'échangent dans l'ordre, `reverse=True` manque (rang croissant). Si Manchester affiche `$ 0.00`, la vente annulée d'o4 a fuité comme un zéro, ou les deux n'apparaissent même pas parce que *toute* la liste propre est vide (un bug de transformation de l'étape 2 remonterait ici comme `total revenue: $0.00`).

### 3.2 Vérifie l'agrégation

**✅ Liste de vérification**

- ✅ `London 1500.00` (o1 + o3), `New York 1250.00` (o2 + o5), triées par revenus décroissants.
- ✅ `total revenue: $2,750.00` correspond à `sum` des deux lignes à la main.
- ✅ La commande annulée de Manchester ne contribue à rien, l'annulation et l'appartenance à une ville sont des jugements sans rapport.

**🤔 Question(s) socratique(s)**

- Les villes à revenus zéro sont *absentes de la carte*, pas listées à zéro. Si la question était « chaque ville, y compris aucune » (un Manchester avec seulement des commandes annulées), de quelle seconde structure de données aurais-tu besoin, et que dit la différence de rapport sur les agrégats qui remplissent les zéros ?
- `revenue_by_city` additionne `line_total`, qui additionne `qty × price`. Nomme deux endroits où une étape antérieure aurait pu *silencieusement* corrompre ce nombre (arrondi flottant, prix en chaîne), et lequel des deux le `round(..., 2)` de la transformation protège réellement.

## Étape 4 : Charger dans SQLite, de façon idempotente

Le chargement est l'endroit où les pipelines tournent mal : exécute un travail deux fois et chaque commande devient deux lignes. Le correctif est une **clé primaire**, `order_id` déclaré `TEXT PRIMARY KEY`, plus `INSERT OR REPLACE`, l'upsert de SQLite. Relancer exactement le même chargement produit exactement la même table : exactement 4 commandes, 0 doublons, les deux fois. C'est l'idempotence, et c'est la propriété qui rend l'ETL planifié digne de confiance.

### 4.1 Écris le schéma et le chargeur

**👟 Indice de départ :** `CREATE TABLE IF NOT EXISTS` avec la PK, et `conn.executemany` avec un INSERT nommé `:key` :

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

Deux détails portent l'idempotence. D'abord, `order_id TEXT PRIMARY KEY`, SQLite impose l'unicité, et tout vrai doublon *remplaçant* l'ancienne ligne PK est tout le point positif. Ensuite, `:order_id` etc. sont des paramètres nommés liés par un dict, un INSERT paramétré qui positionne les champs par nom, donc un réarrangement de colonnes dans le dict ne décale jamais les colonnes latéralement dans la table. `CREATE TABLE IF NOT EXISTS` laisse le même script s'exécuter contre une base fraîche et une base préexistante sans erreur. `conn.commit()` est ce qui rend tout le lot durable.

**🎯 Résultat attendu :**

```
rows after load #1: 4
```

**🩹 Si ça ne marche pas :** Si le compte affiche `0`, `build_cleaned()` a renvoyé `[]`, la connexion/SQLite va bien, ta transformation de l'étape 2 s'est vidée en silence (vérifie les chemins `continue`). Si le compte augmente à chaque exécution (4 → 8 → 12), ton INSERT n'a pas de `OR REPLACE` et la PK manque au schéma, revérifie `CREATE TABLE` : sans `order_id TEXT PRIMARY KEY`, rien ne déduplique.

### 4.2 Vérifie l'idempotence en relançant

**👟 Indice de départ :** Relance le même chargement contre la même base et inspecte, les doublons doivent rester à 0 et les revenus ne doivent pas doubler :

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

**🎯 Résultat attendu :**

```
rows after load #2 (all records): 4
duplicate check: 0
total revenue in db: 2750.0
```

**🩹 Si ça ne marche pas :** Si `duplicate check` affiche autre chose que `0`, le chemin de chargement que tu relances diffère de celui de la section 4.1 (par ex. un script a `OR REPLACE`, l'autre un insert simple). Si `total revenue` est `5500.0`, l'upsert ne remplace pas, supprime la table avec `conn.execute("DROP TABLE IF EXISTS orders")` et relance 4.1 pour que le schéma retrouve sa PK.

### 4.3 Vérifie la sémantique de chargement

**✅ Liste de vérification**

- ✅ Premier chargement → 4 lignes ; second chargement → toujours 4 lignes ; compte de doublons 0.
- ✅ `SUM(line_total) = 2750.0`, inchangé par la relance, exactement le total par ville de l'étape 3.
- ✅ Une commande qui *a changé* (disons la qty d'o1) est remplacée, pas doublée, car `order_id` est la PK.

**🤔 Question(s) socratique(s)**

- `INSERT OR REPLACE` supprime et réinsère l'ancienne ligne PK. Si en amont o1 voyait son `price` passé de `1200.00` à `1100.00`, qu'est-ce que la relance du pipeline *gère déjà*, et que ne gère-t-elle *pas* (il n'y a pas d'audit de « o1 a changé mardi dernier ») ?
- Charger un jour de commandes dans `warehouse.db` chaque minuit est correct. Qu'est-ce qui casse si deux pipelines s'exécutent contre la même base en même temps (le verrou d'écriture), et quel est le correctif au niveau transaction (`BEGIN`/`COMMIT` autour de l'executemany) ?

## Étape 5 : Se protéger contre une source manquante

La défaillance que tout travail planifié finit par avoir : `orders.csv` n'est pas là. Non géré, `FileNotFoundError` plante au milieu du pipeline et l'entrepôt se retrouve avec ce que la *précédente* exécution partielle a écrit. Le pipeline durci **extrait de manière défensive**, un `try/except` renvoie `None` pour un fichier manquant, et l'exécuteur traite `None` comme « abandon, entrepôt inchangé ». Puis le même pipeline se relance proprement une fois le fichier revenu : l'idempotence signifie que la récupération est *juste une relance*.

### 5.1 Écris l'extracteur protégé et l'exécution abandonnée

**👟 Indice de départ :** `extract_or_none(path)` renvoie `None` sur `FileNotFoundError` ; le script A démontre l'abandon :

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

Simule la défaillance en éloignant la source, puis exécute :

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

`extract_or_none` réduit la défaillance à un symptôme (`FileNotFoundError`) et l'exprime comme une *valeur* (`None`) au lieu d'une exception, donc l'appelant peut *décider*, bifurquer dessus et le journaliser, sans plantage dur. L'annotation de retour `| None` déclare le contrat : « ceci peut légitimement ne pas exister. » Simuler le fichier manquant par `mv` est la manière honnête de le tester, pas de framework de test, juste le vrai système de fichiers faisant une vraie mutilation d'arrêt et le pipeline restant intact.

**🎯 Résultat attendu** (pendant que `orders.csv` est éloigné) :

```
extract result: None
pipeline short-circuits: True
```

**🩹 Si ça ne marche pas :** Si le script lève `FileNotFoundError` au lieu d'imprimer `None`, `except FileNotFoundError` manque ou attrape une classe *différente* (`IOError` ne correspondra pas). Si le `mv` de retour échoue (`No such file`), tu es dans le mauvais dossier, `orders.csv.bak` doit se trouver à côté d'`orders.csv` dans `etl-pipeline/`.

### 5.2 Câble tout le pipeline avec la protection

**👟 Indice de départ :** `run_pipeline()` compose extraire → protection → transformer → charger, imprime `ABORTED` sur source manquante, et une relance finale prouve la stabilité :

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

Exécute-le (deux fois, dans un seul script, la seconde exécution est la preuve d'idempotence) :

```bash
uv run run_pipeline.py
```

La protection rend la différence visible : avec `orders.csv` supprimé, `run_pipeline` imprime `ABORTED` et retourne *avant qu'aucune connexion de base de données ne s'ouvre*, le compte de lignes de l'entrepôt reste à 4, intact. Une fois le fichier revenu, la même fonction exécute tout l'ETL et rapporte à nouveau 4 lignes, **aucun doublon**, car `order_id TEXT PRIMARY KEY` plus `INSERT OR REPLACE` font que « deux fois la même entrée » égale « une fois la même sortie ». L'idempotence effondre la récupération en une relance.

**🎯 Résultat attendu :**

```
OK: loaded 4 rows; warehouse now has 4 (no duplicates)
OK: loaded 4 rows; warehouse now has 4 (no duplicates)
```

**🩹 Si ça ne marche pas :** Si la première ligne affiche `ABORTED`, `orders.csv` est encore renommé depuis la 5.1, restaure-le avec `mv orders.csv.bak orders.csv`. Si la seconde ligne affiche un compte différent, les deux exécutions ne se connectent pas au même `warehouse.db` (vérifie le chemin, ou un mélange `db_path` absolu contre relatif).

### 5.3 Vérifie le pipeline durci

**✅ Liste de vérification**

- ✅ `mv orders.csv ...` éloigné → `ABORTED: orders.csv missing`, compte de lignes de l'entrepôt inchangé.
- ✅ `mv ... back` → `OK: loaded 4 rows`, et la seconde exécution reste à 4.
- ✅ Aucune exception ne s'échappe de l'extracteur ; une source manquante est un événement rapportable, pas un plantage.

**🤔 Question(s) socratique(s)**

- `run_pipeline` abandonne *avant* d'ouvrir la connexion de base de données. Nomme la défaillance alternative qu'un pipeline de production doit encore protéger : la source est présente mais une *transformation* lève (un mauvais `float`). Où appartiendrait le log-et-saute, et quel est le danger d'attraper largement (`except Exception`) contre étroitement sur `FileNotFoundError` ?
- La relance a imprimé `OK` deux fois, mais une *corruption délibérée* (monter le prix d'o1 à 9 999 $) est aussi « gérée » en silence par `REPLACE`. Quel est le premier artefact qui transforme un script en *pipeline de données auditable* (comptes de lignes par exécution, condensés de sources, horodatages) ?

## ⚠️ Pièges courants

- **L'extraction qui fait la transformation.** Caster `float()` ou filtrer au moment de l'extraction brouille les deux étapes, les transformations possèdent le jugement, les extractions possèdent la *lecture*. Garde l'extraction stupide ou l'audit des sauts cesse d'être l'endroit unique à regarder.
- **Des sauts silencieux.** Nettoyer sans liste `skipped` dissimule la perte de données dans une exécution verte. Rapporte chaque ligne laissée tomber avec une raison ; « 4 gardés, 2 sautés : [('o4','cancelled')...] » est un pipeline auquel tu peux te fier.
- **Des chargements non idempotents.** Un `INSERT` simple (sans `OR REPLACE`, sans PK) transforme chaque relance en doublon complet. La PK est tout le jeu ; sans elle, « exécuter deux fois » signifie « deux fois les lignes ».
- **L'analyse d'échappement.** Attraper `FileNotFoundError` mais *ne pas* bifurquer dessus, l'impression `ABORTED` de la démo existe parce que le pipeline *vérifie* `orders is None` et retourne. Une protection qui ne décide pas est un plantage dans un plus beau manteau.
- **Des fuites de colonnes style `18:00`.** `line_total` calculé dans la transformation, puis *recalculé* ailleurs avec un arrondi différent, produit un SUM en désaccord avec lui-même. Calcule une fois, réutilise partout.

## Ce que tu viens de construire

Un pipeline Extract-Transform-Load complet sur la bibliothèque standard : extraction CSV/JSON stupide, une transformation qui nettoie, joint, calcule et *rapporte* chaque ligne ignorée, une agrégation de revenus par ville qui s'accorde avec son propre total, un chargement SQLite idempotent qui survit aux relances, et un exécuteur protégé qui survit à une source manquante. La compétence transférable est la *forme* du pipeline, pas les outils : chaque étape possède une tâche, chaque saut est audible, et l'idempotence rend la récupération ennuyeuse, ce qui est le plus grand compliment qu'un travail de données puisse recevoir.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/etl-pipeline/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/etl-pipeline) dans le dépôt du cours contient les scripts complets (extract, transform, aggregate, load, exécuteur protégé) plus les sources d'échantillon. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller ensuite

- Ajoute un **pilote de lot quotidien** : une boucle qui relance `run_pipeline()` sur des dates croissantes (`orders_2026_09_01.csv` → même table), et rapporte `loaded N rows for 2026-09-01` par date, la graine d'un rapport planifié.
- Rends le pipeline **auditable** : après chaque `load`, écris `loads.log` en JSONL avec horodatage, compte de lignes et un SHA-256 du fichier source. Les relances deviennent une histoire, pas un mystère.
- Passe le chargement à **deux tables** : `orders` (détail) plus `city_revenue` (agrégat), et laisse l'agrégat se dériver de la table (pas de la transformation), l'entrepôt possède ses rapports.
- Ajoute un **contrôle de schéma** dans l'extraction : affirme que les en-têtes d'`orders.csv` égaux l'ensemble attendu avant de renvoyer les lignes, échouer vite sur un renommage de colonne du fournisseur bat échouer à `float(float(o['qty']))` au fond de la transformation.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants, et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓