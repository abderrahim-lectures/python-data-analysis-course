---
title: "Constructor de Pipeline ETL"
description: "Extrae, transforma y carga datos de múltiples fuentes con programación y recuperación de errores."
difficulty: "intermediate"
estimatedMinutes: 85
tags: ["cli", "csv", "json", "sqlite", "pipeline"]
prerequisites:
  - "Fundamentos de Python (listas, diccionarios, bucles, funciones)"
  - "Comodidad con archivos csv/json y la terminal"
learningObjectives:
  - "Extraer datos de fuentes CSV y JSON hacia registros simples"
  - "Limpiar y unir dos fuentes, señalando cada fila omitida"
  - "Agregar totales de línea por ciudad en un reporte de ingresos"
  - "Cargar registros en SQLite de forma idempotente con claves primarias"
  - "Proteger el pipeline contra una fuente faltante y re-ejecutar de forma segura"
---

# 🔄 Construye un Pipeline ETL

Todo trabajo de datos real se ve así: toma pedidos de un CSV y clientes de un JSON, únelos, descarta las filas que no pertenecen, suma las cosas, y escribe el resultado en algún lugar que una herramienta pueda consultar. Ese patrón — **Extraer, Transformar, Cargar** — es lo que este proyecto construye con nada más que la biblioteca estándar: un extractor CSV, un extractor JSON, una transformación que limpia y une con cada omisión reportada, una agregación que responde "ingresos por ciudad", y una carga SQLite que es *idempotente*: ejecútala cinco veces, siguen siendo exactamente cuatro filas. El paso final endurece todo contra su fallo de producción más común — un archivo fuente faltante — sin dejar el almacén a medio escribir. Sin pandas. Sin framework. Solo `csv`, `json` y `sqlite3` haciendo un trabajo real.

Esto asume Python 101 — listas, dicts, bucles, funciones — además de lectura cómoda de archivos y una terminal. Nada aquí necesita numpy o pandas. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Extraer un `orders.csv` y un `customers.json` hacia registros Python simples.
2. Transformar: limpiar las filas, unir los nombres y ciudades de clientes, calcular `line_total` — y reportar los dos pedidos omitidos.
3. Agregar ingresos por ciudad, ordenados de mayor a menor primero.
4. Cargar los registros limpios en SQLite con un upsert idempotente — ejecútalo dos veces, siguen siendo 4 filas.
5. Endurecer la extracción contra un archivo faltante y re-ejecutar el pipeline completo de forma segura.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — un trabajo ETL es un pipeline de archivo-fuera (CSV/JSON de entrada, SQLite de salida) y los archivos SQLite pertenecen a tu terminal.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan — el notebook en [`examples/etl-pipeline/notebook.es.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.es.ipynb) ejecuta el ETL idéntico sobre las fuentes de muestra incluidas, en memoria.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fetl-pipeline%2Fnotebook.es.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza "instala Python, luego pip, luego una herramienta de entorno virtual" — y este proyecto es biblioteca estándar pura.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego confirma que se instaló:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init etl-pipeline
cd etl-pipeline
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `etl-pipeline/` existe con un `pyproject.toml`.
- ✅ `python -c "import csv, json, sqlite3"` tiene éxito — toda la pila, solo stdlib.

## Paso 1: Extrae las dos fuentes

El primer acto del ETL es *solo* leer: los pedidos CSV llegan como dicts vía `csv.DictReader`, los clientes JSON como una lista vía `json.load`. Nada se limpia todavía — la extracción es intencionadamente tonta, de modo que la transformación es dueña de cada juicio y los dos nunca se mezclan. Los pipelines reales extraen primero y *fallan fuerte si una fuente falta* más tarde (Paso 5); aquí, el Paso 1 prueba ambos lectores.

### 1.1 Escribe los archivos fuente y el extractor

**👟 Pista inicial :** Una función leyendo un CSV, un `json.load` leyendo el JSON, devolviendo registros simples:

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

`csv.DictReader` consume una fila de encabezado para las claves, de modo que cada fila sale ya nombrada por campo — `{"order_id": "o1", ...}` — y `list(...)` toma una instantánea de las seis filas de una vez. `json.load` parsea el arreglo en una lista de dicts. Las sugerencias de tipo de retorno (una tupla de dos listas) son el contrato aguas abajo: la transformación recibe exactamente lo que espera, y cualquier otra cosa se rompe en el sitio de llamada, ruidosamente. Nota que los valores `order_id: o1` y `customer_id: c1` siguen siendo *cadenas* — la extracción no hace matemática, ni conversión de floats, ni juicio.

**🎯 Resultado esperado :**

```
extracted 6 orders, 3 customers
first order: {'order_id': 'o1', 'customer_id': 'c1', 'product': 'laptop', 'qty': '1', 'price': '1200.00', 'status': 'delivered'}
first customer: {'customer_id': 'c1', 'name': 'Ada Lovelace', 'city': 'London'}
```

**🩹 Si sale mal :** Si `customers` se imprime como una cadena o un dict en lugar de una lista, `customers.json` no es un arreglo de nivel superior (la línea de apertura `[`) — `json.load` devuelve lo que el archivo realmente sea. Si `orders` es `[]`, el CSV no tiene filas con valores o la fila de encabezado no tiene la nueva línea final — imprime `open("orders.csv").read()` para ver exactamente lo que vio `DictReader`.

### 1.2 Verifica el extractor

**✅ Lista de verificación**

- ✅ 6 pedidos y 3 clientes se extraen; o1/o2/o3/o5 llevan las mismas claves que la fila de encabezado.
- ✅ `price` sigue siendo la cadena `"1200.00"` — sin matemática en el momento de extraer.
- ✅ `customers.json` se carga como una lista de dicts, uno por cliente.

**🤔 Pregunta(s) socrática(s)**

- La extracción es "tonta" a propósito, pero aun así eligió una forma: filas de dict con valores de cadena. ¿Qué cambiaría un extractor *tipado por esquema* (números parseados, enums aplicados) sobre la confianza aguas abajo — y a qué costo cuando el vendedor del CSV renombra una columna?
- `csv.DictReader` usa coma por defecto. Nombra los dos valores que este paso ya fija implícitamente en el código (delimitador, comillas) y cómo haría un trabajo real que fueran entradas de pipeline *explícitas* en lugar de accidentes del formato de archivo.

## Paso 2: Transforma — limpia y une

La transformación es dueña del juicio: los pedidos `cancelled` no cuentan como ingresos, un pedido cuyo cliente no existe no puede unirse, `qty ≤ 0` o `price < 0` es basura, y cada omisión se *reporta* — nunca se traga silenciosamente. Las filas que pasan se convierten en registros enriquecidos con nombres de clientes, ciudades y un `line_total` calculado. Dos de los seis pedidos se rechazan exactamente como está diseñado, y el pipeline lo dice.

### 2.1 Escribe el limpiador/uniador

**👟 Pista inicial :** Construye primero la búsqueda `customer_by_id` (un dict), luego el bucle, decide *omitir o conservar*, y reporta cada omisión:

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

El dict `customer_by_id` es la unión: `customer_by_id.get(o["customer_id"])` convierte una búsqueda de cliente de O(n) por pedido en O(1), y `None` sirve doblemente como la señal de "colgante" para o6. La lista `skipped` es el rastro de auditoría — `("o4", "cancelled")`, `("o6", "no customer")` — y se devuelve junto a las filas limpias, de modo que el análisis también puede hacerse sobre lo que se tiró. Las conversiones `float()` ocurren aquí, en la frontera: de "cadenas algo confiables" a números bajo nuestro control, justo antes de la aritmética.

**🎯 Resultado esperado :**

```
cleaned: 4  skipped: 2
  o1 Ada Lovelace   laptop     1 x $1200.00 = $1200.00 (delivered)
  o2 Grace Hopper   mouse      2 x $25.00 = $50.00 (delivered)
  o3 Ada Lovelace   monitor    1 x $300.00 = $300.00 (delivered)
  o5 Grace Hopper   laptop     1 x $1200.00 = $1200.00 (pending)
skipped: [('o4', 'cancelled'), ('o6', 'no customer')]
```

**🩹 Si sale mal :** Si o6 aparece en `cleaned` con un nombre vacío, falta el `continue` después de `customer is None` y `customer["name"]` golpea a `None` — la omisión debe hacer `continue`, no caer hacia adelante. Si no se omite nada en absoluto, a `CLEAN_STATUSES` le falta `"pending"` — espera, eso omite a o5, no cancela a o4 — así que vuelve a revisar la cadena `"cancelled"` contra el valor real de `status` del CSV.

### 2.2 Verifica la transformación

**✅ Lista de verificación**

- ✅ 4 limpias / 2 omitidas; o1/o2/o3/o5 obtienen nombres y ciudades de clientes reales.
- ✅ o4 (cancelled) y o6 (cliente desconocido) aparecen en `skipped` con razones.
- ✅ `line_total` = `qty × price`, redondeado a 2 decimales: o2 = `2 × 25 = $50.00`.

**🤔 Pregunta(s) socrática(s)**

- o6 tiene un id de cliente *nunca definido* — una violación de clave foránea que el lado del CSV no puede arreglar. ¿Dónde debería vivir el registro autoritativo de "quién es c4", y qué lado del pipeline (extract, transform o la fuente de clientes) *debería* haberlo atrapado?
- Una razón de omisión es una cadena (`"cancelled"`). Si el vendedor cambiara el vocabulario de estados el próximo mes (`"refunded"`, `"reversed"`), cada valor nuevo *pasa* silenciosamente la verificación `not in CLEAN_STATUSES` como ingresos. ¿Cuál es el predeterminado conservador para un estado desconocido — y qué te da el rastro de auditoría de omisiones que un conteo silencioso nunca daría?

## Paso 3: Agrega ingresos por ciudad

Con los registros limpios en mano, la agregación responde la pregunta del negocio: *¿quién impulsa los ingresos?* Un `defaultdict(float)` acumula `line_total` por ciudad, y ordenar por ingresos descendentemente pone a Londres primero. Este es el segundo acto de la transformación — la misma lista limpia, nueva forma, sin re-limpiar.

### 3.1 Escribe la agregación por ciudad

**👟 Pista inicial :** `by_city[record["city"]] += record["line_total"]` sobre las filas limpias, luego `sorted(..., reverse=True)`:

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

`defaultdict(float)` es el acumulador clásico: una clave de ciudad desconocida nace como `0.0` y se incrementa desde ahí. `sum(by_city.values())` re-deriva el total de la propia agregación, de modo que el gran total nunca puede discrepar de las filas por ciudad — una única fuente de verdad para ambos. Y `sorted(..., key=lambda kv: kv[1], reverse=True)` mira los pares `(city, revenue)` y ordena por el segundo elemento descendentemente — rango, no alfabético.

**🎯 Resultado esperado :**

```
== revenue by city ==
  London     $ 1,500.00
  New York   $ 1,250.00

total revenue: $2,750.00
```

**🩹 Si sale mal :** Si Londres y Nueva York intercambian orden, falta `reverse=True` (rango ascendente). Si Manchester muestra `$ 0.00`, la venta cancelada de o4 se filtró como un cero — o los dos ni siquiera aparecen porque *toda* la lista limpia está vacía (un bug de transformación del Paso 2 saldría aquí a la superficie como `total revenue: $0.00`).

### 3.2 Verifica la agregación

**✅ Lista de verificación**

- ✅ `London 1500.00` (o1 + o3), `New York 1250.00` (o2 + o5), ordenadas por ingresos descendentes.
- ✅ `total revenue: $2,750.00` coincide con el `sum` de las dos filas a mano.
- ✅ El pedido cancelado de Manchester no contribuye nada — la cancelación y la membresía de ciudad son juicios sin relación.

**🤔 Pregunta(s) socrática(s)**

- Las ciudades de ingresos cero *están ausentes del mapa*, no listadas como cero. Si la pregunta fuera "cada ciudad, incluidas las de nada" (una Manchester con solo pedidos cancelados), ¿qué segunda estructura de datos necesitarías, y qué dice la diferencia de reporte sobre que los agregados rellenen ceros?
- `revenue_by_city` suma `line_total`, que suma `qty × price`. Nombra dos lugares donde un paso anterior podría haber *corrompido silenciosamente* este número (redondeo de floats, precio-como-cadena) — y cuál de los dos es el que el `round(..., 2)` de la transformación realmente protege.

## Paso 4: Carga en SQLite, de forma idempotente

Cargar es donde los pipelines se equivocan: ejecuta un trabajo dos veces y cada pedido se convierte en dos filas. El arreglo es una **clave primaria** — `order_id` declarado `TEXT PRIMARY KEY` — además de `INSERT OR REPLACE`, el upsert de SQLite. Re-ejecutar exactamente la misma carga produce exactamente la misma tabla: exactamente 4 pedidos, 0 duplicados, ambas veces. Eso es idempotencia, y es la propiedad que hace confiable el ETL programado.

### 4.1 Escribe el esquema y el cargador

**👟 Pista inicial :** `CREATE TABLE IF NOT EXISTS` con la PK, y `conn.executemany` con un INSERT con `:key` nombrada:

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

Dos detalles llevan la idempotencia. Primero, `order_id TEXT PRIMARY KEY` — SQLite impone la unicidad, y que cualquier duplicado real *reemplace* la fila PK vieja es el punto de la ventaja completa. Segundo, `:order_id` etc. son parámetros nombrados vinculados por dict — un INSERT parametrizado que posiciona los campos por nombre, de modo que una reorganización de columnas en el dict nunca desplace columnas de lado en la tabla. `CREATE TABLE IF NOT EXISTS` permite que el mismo script se ejecute contra una base de datos nueva y una preexistente sin errores. `conn.commit()` es lo que hace durable todo el lote.

**🎯 Resultado esperado :**

```
rows after load #1: 4
```

**🩹 Si sale mal :** Si el conteo muestra `0`, `build_cleaned()` devolvió `[]` — la conexión/SQLite está bien, tu transformación del Paso 2 se vació silenciosamente (revisa las rutas de `continue`). Si el conteo sube en cada ejecución (4 → 8 → 12), tu INSERT no tiene `OR REPLACE` y la PK falta en el esquema — vuelve a revisar `CREATE TABLE`: sin `order_id TEXT PRIMARY KEY`, nada deduplica.

### 4.2 Verifica la idempotencia re-ejecutando

**👟 Pista inicial :** Ejecuta la misma carga de nuevo contra la misma base de datos e inspecciona — los duplicados deben permanecer en 0 y los ingresos no deben duplicarse:

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

**🎯 Resultado esperado :**

```
rows after load #2 (all records): 4
duplicate check: 0
total revenue in db: 2750.0
```

**🩹 Si sale mal :** Si `duplicate check` muestra cualquier cosa salvo `0`, la ruta de carga que estás re-ejecutando difiere de la del 4.1 (ej. un script tiene `OR REPLACE`, el otro insert simple). Si `total revenue` es `5500.0`, el upsert no está reemplazando — borra la tabla con `conn.execute("DROP TABLE IF EXISTS orders")` y re-ejecuta 4.1 para que el esquema recupere su PK.

### 4.3 Verifica la semántica de la carga

**✅ Lista de verificación**

- ✅ Primera carga → 4 filas; segunda carga → siguen siendo 4 filas; conteo de duplicados 0.
- ✅ `SUM(line_total) = 2750.0` — sin cambios por la re-ejecución, exactamente el total por ciudad del Paso 3.
- ✅ Un pedido que *cambió* (digamos la qty de o1) se reemplaza, no se duplica, porque `order_id` es la PK.

**🤔 Pregunta(s) socrática(s)**

- `INSERT OR REPLACE` borra y re-inserta la fila PK vieja. Si el upstream limpió un `price` de o1 de `1200.00` a `1100.00`, ¿qué *ya maneja* re-ejecutar el pipeline — y qué *no* (no hay auditoría de "o1 cambió el martes pasado")?
- Cargar un día de pedidos en `warehouse.db` cada medianoche es correcto. ¿Qué se rompe si dos pipelines se ejecutan contra la misma BD a la vez (el bloqueo de escritura), y cuál es el arreglo a nivel de transacción (`BEGIN`/`COMMIT` alrededor del executemany)?

## Paso 5: Protégete contra una fuente faltante

El fallo que todo trabajo programado eventualmente tiene: `orders.csv` no está. Sin manejar, `FileNotFoundError` se estrella a mitad del pipeline y el almacén queda sosteniendo lo que sea que haya escrito la *ejecución parcial anterior*. El pipeline endurecido **extrae defensivamente** — un `try/except` devuelve `None` para un archivo faltante, y el ejecutor trata `None` como "abortar, almacén sin cambios". Luego el mismo pipeline se re-ejecuta limpiamente una vez que el archivo vuelve: la idempotencia significa que la recuperación es *solo una re-ejecución*.

### 5.1 Escribe el extractor protegido y la ejecución abortada

**👟 Pista inicial :** `extract_or_none(path)` devuelve `None` en `FileNotFoundError`; el script A demuestra el aborto:

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

Simula el fallo moviendo la fuente lejos, luego ejecuta:

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

`extract_or_none` reduce el fallo a un síntoma (`FileNotFoundError`) y lo expresa como un *valor* (`None`) en lugar de una excepción — de modo que quien llama puede *decidir*, ramificar sobre él y registrarlo, sin un crash duro. El tipo de retorno `| None` declara el contrato: "esto podría legítimamente no existir." Mockear el archivo faltante con `mv` es la forma honesta de probarlo — sin framework de tests, solo el sistema de archivos real haciendo mutilación real de apagado y el pipeline permaneciendo intacto.

**🎯 Resultado esperado** (mientras `orders.csv` está movido lejos):

```
extract result: None
pipeline short-circuits: True
```

**🩹 Si sale mal :** Si el script lanza `FileNotFoundError` en lugar de imprimir `None`, falta `except FileNotFoundError` o está atrapando una clase *distinta* (`IOError` no coincidirá). Si el `mv` de regreso falla (`No such file`), estás en el directorio equivocado — `orders.csv.bak` debe estar junto a `orders.csv` en `etl-pipeline/`.

### 5.2 Conecta el pipeline completo con el guardia

**👟 Pista inicial :** `run_pipeline()` compone extraer → guardia → transformar → cargar, imprime `ABORTED` en una fuente faltante, y una re-ejecución final prueba la estabilidad:

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

Ejecútalo (dos veces, en un solo script — la segunda ejecución es la prueba de idempotencia):

```bash
uv run run_pipeline.py
```

El guardia hace visible la diferencia: con `orders.csv` borrado, `run_pipeline` imprime `ABORTED` y retorna *antes de que se abra cualquier conexión de base de datos* — el conteo de filas del almacén se queda en 4, intacto. Con el archivo de vuelta, la misma función ejecuta todo el ETL y reporta 4 filas de nuevo — **sin duplicados**, porque `order_id TEXT PRIMARY KEY` más `INSERT OR REPLACE` hacen que "la misma entrada dos veces" equivalga a "la misma salida una vez". La idempotencia colapsa la recuperación en una re-ejecución.

**🎯 Resultado esperado :**

```
OK: loaded 4 rows; warehouse now has 4 (no duplicates)
OK: loaded 4 rows; warehouse now has 4 (no duplicates)
```

**🩹 Si sale mal :** Si la primera línea muestra `ABORTED`, `orders.csv` sigue renombrado desde 5.1 — restáuralo con `mv orders.csv.bak orders.csv`. Si la segunda línea muestra un conteo distinto, ambas ejecuciones no se están conectando al mismo `warehouse.db` (revisa la ruta, o una confusión de `db_path` absoluto vs relativo).

### 5.3 Verifica el pipeline endurecido

**✅ Lista de verificación**

- ✅ `mv orders.csv ...` lejos → `ABORTED: orders.csv missing`, el conteo de filas del almacén sin cambios.
- ✅ `mv ... de vuelta` → `OK: loaded 4 rows`, y la segunda ejecución se queda en 4.
- ✅ Ninguna excepción escapa del extractor; una fuente faltante es un evento reportable, no un crash.

**🤔 Pregunta(s) socrática(s)**

- `run_pipeline` aborta *antes* de abrir la conexión de base de datos. Nombra el fallo alternativo que un pipeline de producción debe aun así proteger: la fuente está presente pero una *transformación* lanza (un `float` malo). ¿Dónde pertenecería el registrar-y-omitir, y cuál es el peligro de atrapar ampliamente (`except Exception`) versus estrechamente en `FileNotFoundError`?
- La re-ejecución imprimió `OK` dos veces — pero una *corrupción deliberada* (subir el precio de o1 a $9999) también es "manejada" silenciosamente por `REPLACE`. ¿Cuál es el primer artefacto que convierte un script en un *pipeline de datos auditable* (conteos de filas por ejecución, digests de fuente, marcas de tiempo)?

## ⚠️ Errores comunes

- **La extracción haciendo la transformación.** Convertir `float()` o filtrar en el momento de extraer desdibuja las dos etapas — las transformaciones son dueñas del juicio, las extracciones son dueñas de *leer*. Mantén la extracción tonta o la auditoría de omisiones deja de ser el único lugar donde mirar.
- **Omitir silenciosamente.** Limpiar sin una lista `skipped` esconde la pérdida de datos dentro de una ejecución verde. Reporta cada fila descartada con una razón; "4 conservadas, 2 omitidas: [('o4','cancelled')...]" es un pipeline en el que puedes confiar.
- **Cargas no idempotentes.** Un `INSERT` simple (sin `OR REPLACE`, sin PK) convierte cada re-ejecución en un duplicado completo. La PK es todo el juego; sin ella, "ejecutar dos veces" significa "el doble de filas".
- **Análisis de escape.** Atrapar `FileNotFoundError` pero *no* ramificar sobre él — el print `ABORTED` de la demo existe porque el pipeline *verifica* `orders is None` y retorna. Un guardia que no decide es un crash con un abrigo más bonito.
- **Fugas de columnas estilo `18:00`.** `line_total` calculado en la transformación y luego *recalculado* en otro lugar con redondeo distinto produce un SUM que discrepa consigo mismo. Calcula una vez, reutiliza en todas partes.

## Lo que acabas de construir

Un pipeline completo de Extraer-Transformar-Cargar en la biblioteca estándar: extracción CSV/JSON tonta, una transformación que limpia, une, calcula y *reporta* cada fila omitida, agregación de ingresos a nivel de ciudad que coincide con su propio total, una carga SQLite idempotente que sobrevive re-ejecuciones, y un ejecutor protegido que sobrevive una fuente faltante. La habilidad transferible es la *forma* del pipeline, no las herramientas: cada etapa es dueña de un trabajo, cada omisión es audible, y la idempotencia hace aburrida la recuperación — que es el mayor elogio que puede recibir un trabajo de datos.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/etl-pipeline/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/etl-pipeline) en el repositorio del curso tiene los scripts completos (extract, transform, aggregate, load, ejecutor protegido) además de las fuentes de muestra. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega un **controlador de lote diario**: un bucle que re-ejecuta `run_pipeline()` con fechas incrementales (`orders_2026_09_01.csv` → misma tabla), y reporta `loaded N rows for 2026-09-01` por fecha — la semilla de un reporte programado.
- Haz el pipeline **auditable**: después de cada `load`, escribe `loads.log` como JSONL con marca de tiempo, conteo de filas y un SHA-256 del archivo fuente. Las re-ejecuciones se vuelven una historia, no un misterio.
- Cambia la etapa de carga a **dos tablas**: `orders` (detalle) más `city_revenue` (agregado), y deja que el agregado se derive de la tabla (no de la transformación) — el almacén es dueño de sus reportes.
- Agrega una **verificación de esquema** en extract: afirma que los encabezados de `orders.csv` igualan el conjunto esperado antes de devolver filas — fallar rápido ante un renombrado de columna del vendedor vence a fallar en `float(float(o['qty']))` en lo profundo de la transformación.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓