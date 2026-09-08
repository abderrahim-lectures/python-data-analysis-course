---
title: "Catálogo de Datos"
description: "Catálogo de metadatos con búsqueda que indexa conjuntos de datos, esquemas y linaje de datos en tu organización."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "csv", "json", "metadata"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, diccionarios)"
  - "Leer archivos CSV con el módulo csv"
learningObjectives:
  - "Extraer metadatos de esquema (columnas, tipos inferidos, conteos de filas) de conjuntos de datos CSV"
  - "Persistir un índice de catálogo buscable como JSON"
  - "Puntuar y clasificar resultados de búsqueda de conjuntos de datos por coincidencias de términos"
  - "Registrar aristas de linaje de datos y recorrer cadenas de dependencia ascendentes y descendentes"
  - "Exponer add, search y lineage como subcomandos de CLI"
---

# 🗂️ Construir un Catálogo de Datos

Antes de que cualquiera pueda usar datos, alguien tiene que poder *encontrarlos*, confiar en lo que son y saber de dónde vinieron. Ese es el trabajo de un catálogo de datos — el índice de una organización sobre sus propios conjuntos de datos. Este proyecto construye uno pequeño y real: escanea archivos CSV y registra su esquema (columnas, tipos inferidos, conteos de filas) en un índice JSON persistente, responde búsquedas de texto libre entre nombres de conjuntos de datos y columnas, y rastrea el *linaje* — qué conjunto de datos alimenta qué transformación, para que puedas responder "¿qué se rompe si este CSV cambia?" con un recorrido en lugar de una suposición.

Esto asume Python 101 más una lectura cómoda de `csv` — colecciones, dicts y funciones. No se requiere nada del módulo de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Escribir un extractor de metadatos que convierta un archivo CSV en una entrada de catálogo — nombres de columnas, tipos inferidos, conteo de filas.
2. Construir un `CatalogIndex` persistente que se guarda y recarga a sí mismo como JSON.
3. Implementar una búsqueda de texto completo puntuada sobre nombres de conjuntos de datos y nombres de columnas.
4. Registrar aristas de linaje y recorrer cadenas de dependencia hacia adelante y hacia atrás.
5. Envolver todo en una CLI `catalog.py` con subcomandos `add`, `search` y `lineage`.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — un catálogo trata sobre *tus* carpetas de CSVs en disco, y todo el punto de la CLI es apuntarse a archivos reales. La configuración es solo biblioteca estándar (además de libre de `tomllib`, así que un Python reciente simple basta).

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados) y ejecuta los mismos comandos — hay muchos CSVs dentro de `examples/` a los que apuntarlo.

**Google Colab, Kaggle Notebooks o Binder** funcionan bien para la mitad de la *lógica de búsqueda* de este proyecto — el notebook en [`examples/data-catalog/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.ipynb) ejecuta cada paso sobre conjuntos de datos de muestra incluidos. La nota honesta: los CSVs de muestra de un notebook son fijos, así que la magia de "escanear *mi* carpeta" es una experiencia del `uv` local.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-catalog%2Fnotebook.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entorno virtual" — y nada en este proyecto necesita un paquete de terceros.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, y confirma que quedó instalado:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init data-catalog
cd data-catalog
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `data-catalog/` existe con un `pyproject.toml`.
- ✅ `python -c "import csv, json"` se ejecuta — sin paquetes de terceros.

## Paso 1: Extraer metadatos de esquema de los CSVs

Una entrada de catálogo es la *descripción de un conjunto de datos*, no los datos en sí: qué columnas existen, qué tipo de valores contiene cada una, cuántas filas. Extraer eso es el momento en que un archivo crudo se convierte en un activo encontrable — y la parte más difícil es *inferir un tipo* de los valores de una columna sin que un único número perdido te engañe.

### 1.1 Escribir el extractor y un auxiliar de inferencia

**👟 Pista inicial :** Crea dos CSVs de muestra, luego `extract_metadata`, que usa `csv.DictReader` para obtener encabezados y filas, y `_infer_type`, que pregunta "¿puede cada valor no vacío convertirse en float?" antes de atreverse a etiquetar una columna como numérica:

```python
# metadata.py
import csv
from dataclasses import dataclass, field
from pathlib import Path

@dataclass
class CatalogEntry:
    name: str
    source: str
    columns: list[str] = field(default_factory=list)
    dtypes: list[str] = field(default_factory=list)
    row_count: int = 0

def _infer_type(values: list[str]) -> str:
    if not values:
        return "empty"
    if all(v.lower() in {"true", "false"} for v in values):
        return "boolean"
    try:
        for v in values:
            float(v)
        return "numeric"
    except ValueError:
        return "text"

def extract_metadata(path: str) -> CatalogEntry:
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []
        rows = list(reader)
    dtypes = [
        _infer_type([row[col] for row in rows if row.get(col, "").strip()])
        for col in columns
    ]
    return CatalogEntry(
        name=Path(path).stem,
        source=path,
        columns=columns,
        dtypes=dtypes,
        row_count=len(rows),
    )

if __name__ == "__main__":
    products = """id,name,price,stock,active\n1,Keyboard,49.99,120,true\n2,Mouse,24.50,300,false\n"""
    customers = """id,full_name,region\n7,Ada Wong,north\n8,Grace Hopper,south\n"""
    with open("products.csv", "w") as f:
        f.write(products)
    with open("customers.csv", "w") as f:
        f.write(customers)

    for csv_file in ["products.csv", "customers.csv"]:
        entry = extract_metadata(csv_file)
        print(f"{entry.name}: {entry.row_count} rows")
        for col, dtype in zip(entry.columns, entry.dtypes):
            print(f"  {col}: {dtype}")
```

El orden de las verificaciones en `_infer_type` es un pequeño árbol de decisión: los booleanos son un *subconjunto* de lo que podrías llamar numérico (`"true"` no es un float, en realidad — el `try float` protege eso), así que el booleano se verifica primero, y el caso `"empty"` retorna temprano para que una columna totalmente en blanco nunca puntúe como extrañamente numérica. `reader.fieldnames or []` es una defensa silenciosa: un archivo vacío tiene `fieldnames` `None`, y cada bucle posterior asume una lista.

**🎯 Resultado esperado :**

```
products: 2 rows
  id: numeric
  name: text
  price: numeric
  stock: numeric
  active: boolean
customers: 2 rows
  id: numeric
  full_name: text
  region: text
```

**🩹 Si sale mal :** Si `price` se infiere como `text`, alguna celda tiene un valor como `"49,99"` o `"$49.99"` que `float()` rechaza — limpia los datos o acepta "text" como la respuesta honesta. Si `active` se infiere como `text`, un valor no es `true`/`false` — verifica si hay un `"1"` literal mezclado con booleanos.

### 1.2 Verifica la extracción

**✅ Lista de verificación**

- ✅ Ambos CSVs de muestra producen entradas con las listas correctas de columnas y dtypes de arriba.
- ✅ `row_count` es igual al número de filas de datos, contando la fila de encabezado *no* incluida.
- ✅ `_infer_type([])` devuelve `"empty"` sin fallar.

**🤔 Pregunta(s) socrática(s)**

- Un veredicto "todo numérico" proviene de que *un* `float(...)` tenga éxito para cada valor. ¿Qué se clasifica en una columna `id` de `["001", "002"]` — y por qué eso es discutiblemente *incorrecto* para un catálogo donde los IDs están destinados a ser etiquetas opacas, no aritmética?
- El extractor carga cada fila en memoria (`rows = list(reader)`). ¿Qué parte del código necesitaría cambiar para catalogar un CSV de 50 GB, y qué partes (encabezados, dtypes) sobreviven sin cambios?

## Paso 2: Persistir un índice buscable

Un dict de entradas en memoria se evapora cuando el proceso termina, lo que lo hace inútil como catálogo de una *organización*. La solución es un `CatalogIndex` que se serializa a JSON en cada cambio y recarga al inicio — el mismo truco de durabilidad que los catálogos reales obtienen de las bases de datos, reducido a un archivo.

### 2.1 Escribir el índice respaldado por JSON

**👟 Pista inicial :** Una clase cuyo constructor intenta cargar `catalog.json` y degrada a un dict vacío cuando el archivo falta; `add`/`remove` mutan y luego `_save` inmediatamente:

```python
# index.py
import json
from pathlib import Path

from metadata import CatalogEntry, extract_metadata

class CatalogIndex:
    def __init__(self, path: str = "catalog.json"):
        self.path = path
        self.entries: dict[str, CatalogEntry] = self._load()

    def _load(self) -> dict[str, CatalogEntry]:
        p = Path(self.path)
        if not p.exists():
            return {}
        data = json.loads(p.read_text())
        return {name: CatalogEntry(**payload) for name, payload in data.items()}

    def add(self, entry: CatalogEntry) -> None:
        self.entries[entry.name] = entry
        self._save()

    def remove(self, name: str) -> bool:
        removed = self.entries.pop(name, None) is not None
        if removed:
            self._save()
        return removed

    def _save(self) -> None:
        payload = {name: entry.__dict__ for name, entry in self.entries.items()}
        Path(self.path).write_text(json.dumps(payload, indent=2))

if __name__ == "__main__":
    index = CatalogIndex()
    index.remove("products")
    index.add(extract_metadata("products.csv"))
    index.add(extract_metadata("customers.csv"))
    index.remove("customers")
    for name, entry in index.entries.items():
        print(f"{name}: {entry.columns}")
```

`entry.__dict__` es el truco de serialización de bajo esfuerzo: las instancias de dataclass guardan sus campos en un `__dict__` simple, así que `json.dumps` de un dict-de-`__dict__` no necesita un codificador personalizado, y `CatalogEntry(**payload)` a la vuelta lo rehidrata con las claves exactas. El archivo JSON se convierte en la *fuente de confianza* entre corridas — cierra la terminal, vuelve a abrirla, y `CatalogIndex()` reconstruye el mismo dict.

**🎯 Resultado esperado :**

```
products: ['id', 'name', 'price', 'stock', 'active']
```

**🩹 Si sale mal :** Si un `TypeError: __init__() got an unexpected keyword argument` aparece al recargar, `catalog.json` tiene una clave que la dataclass no define — elimina el archivo obsoleto o renombra el campo para que coincida. Si `catalog.json` nunca aparece en disco, `_save()` no se está llamando desde `add` — cada ruta de mutación debe persistir, o el estado "guardado" es una mentira.

### 2.2 Verifica la persistencia

**✅ Lista de verificación**

- ✅ Agregar dos entradas y luego reabrir `CatalogIndex()` (en un proceso *nuevo*) muestra ambas sin re-extraer.
- ✅ `remove` devuelve `True` para una entrada existente, `False` para un nombre nunca agregado, y guarda de cualquier manera.
- ✅ `catalog.json` es JSON válido que `json.load` lee de vuelta en la misma estructura.

**🤔 Pregunta(s) socrática(s)**

- Agregar y eliminar ambas llaman a `_save`. ¿Por qué guardar por mutación es el default honesto para una herramienta pequeña, y a qué escala se volvería suficientemente derrochador como para justificar un "guardar al salir" en su lugar — y qué pierde *eso* en un fallo?
- El índice mapea `name → CatalogEntry`, así que un segundo CSV cuyo nombre de archivo colisiona sobrescribe silenciosamente al primero. ¿Debería `add` rechazar en colisión, o sobrescribir es el comportamiento correcto — y quién debería decidir?

## Paso 3: Buscar con puntuación

Un catálogo que no se puede buscar es un museo. La versión honesta y sin dependencias de la búsqueda: divide la consulta en términos, cuenta cuántas veces aparece cada término en un "pajar" por conjunto de datos hecho de su nombre más los nombres de columnas, y clasifica por ese conteo. Tiene la misma forma que el conteo de tf de un buscador a la escala más pequeña.

### 3.1 Escribir el puntuador

**👟 Pista inicial :** Une la identidad de cada entrada en un solo string en minúsculas, suma las *ocurrencias* de los términos dentro de él, y devuelve solo las entradas con puntuación mayor que cero, mejores primero:

```python
# search.py
from index import CatalogIndex

def search(index: CatalogIndex, query: str, top_k: int = 5) -> list[tuple[str, int]]:
    terms = [term.lower() for term in query.split()]
    scored = []
    for name, entry in index.entries.items():
        haystack = " ".join([name, *entry.columns]).lower()
        score = sum(haystack.count(term) for term in terms)
        scored.append((name, score))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return [(name, score) for name, score in scored if score > 0][:top_k]

if __name__ == "__main__":
    index = CatalogIndex()
    for query in ["price", "region", "id price"]:
        results = search(index, query)
        print(f"{query!r}: {results if results else 'no matches'}")
```

El único `haystack = " ".join([name, *entry.columns])` en minúsculas es todo el motor: la búsqueda puntúa contra *ambos*, el nombre del conjunto de datos y su esquema, que es lo que permite que `"region"` encuentre `customers` sin que la palabra aparezca en el nombre de archivo en absoluto — la superficie de columnas es metadatos indexables. `haystack.count(term)` es deliberadamente liberal (cuenta coincidencias superpuestas) en lugar de consciente de tokens, porque para un catálogo de unos pocos cientos de entradas la precisión extra no vale el tokenizador.

**🎯 Resultado esperado :**

```
'price': [('products', 1)]
'region': [('customers', 1)]
'id price': [('products', 2)]
```

**🩹 Si sale mal :** Si las consultas de varias palabras puntúan extraño, recuerda que la suma cuenta cada término *por separado* — `'id price'` encuentra 1 + 1 en `products`. Si una consulta no coincide con algo que debería, verifica si un término contiene mayúsculas o puntuación (p. ej., `"Price"` en minúsculas por ambos lados se maneja — pero `"price,"` con una coma no).

### 3.2 Verifica la búsqueda

**✅ Lista de verificación**

- ✅ Las tres consultas de arriba devuelven las tuplas mejores primero esperadas.
- ✅ Una consulta como `"zzz"` devuelve `[]` en lugar de un error.
- ✅ Buscar por un nombre de *columna* (`region`) encuentra el conjunto de datos cuyo esquema tiene esa columna, incluso si el nombre de archivo no lo tiene.

**🤔 Pregunta(s) socrática(s)**

- Contar *ocurrencias* recompensa a las columnas que repiten un término. ¿Qué definición de "relevante" se pierde — y qué cambiaría sobre la clasificación un `count` que penalizara papajes más largos (dividiendo por el tamaño del conjunto de datos, un mini-tf-idf)?
- La búsqueda está limitada a nombre + columnas. ¿Qué metadatos *que ya calculaste* en el Paso 1 (dtypes, row_count) querrías que fueran buscables, y qué consulta respondería que esta versión no puede?

## Paso 4: Rastrear el linaje de datos

Saber *qué es* un conjunto de datos es la mitad del trabajo; saber *de dónde vino y qué alimenta* es la parte que salva migraciones. El linaje es un grafo dirigido — `fuerte → transformación → derivado` — y las operaciones que necesita son los dos recorridos de grafo: descendente ("¿qué se rompe si cambia `products.csv`?") y ascendente ("¿de qué depende la tabla de este dashboard?").

### 4.1 Escribir el almacén de linaje y ambos recorridos

**👟 Pista inicial :** Una lista de triplas `(source, transform, derived)`, más dos búsquedas de estilo amplitud-primero que se extienden desde un nodo a lo largo de aristas salientes o entrantes, ambas protegiéndose contra ciclos con un conjunto `seen`:

```python
# lineage.py
import json
from pathlib import Path

class Lineage:
    def __init__(self, path: str = "lineage.json"):
        self.path = path
        self.edges: list[tuple[str, str, str]] = []  # (source, transform, derived)
        if Path(path).exists():
            raw = json.loads(Path(path).read_text())
            self.edges = [(e["source"], e["transform"], e["derived"]) for e in raw]

    def record(self, source: str, transform: str, derived: str) -> None:
        self.edges.append((source, transform, derived))
        Path(self.path).write_text(json.dumps(
            [{"source": s, "transform": t, "derived": d} for s, t, d in self.edges],
            indent=2))

    def downstream(self, node: str) -> set[str]:
        seen, frontier = set(), {node}
        while frontier:
            current = frontier.pop()
            for src, _transform, derived in self.edges:
                if src == current and derived not in seen:
                    seen.add(derived)
                    frontier.add(derived)
        return seen

    def upstream(self, node: str) -> set[str]:
        seen, frontier = set(), {node}
        while frontier:
            current = frontier.pop()
            for src, _transform, derived in self.edges:
                if derived == current and src not in seen:
                    seen.add(src)
                    frontier.add(src)
        return seen

if __name__ == "__main__":
    lineage = Lineage("lineage.json")
    lineage.edges = []  # reset for a clean demo
    lineage.record("products.csv", "clean", "products_clean")
    lineage.record("products_clean", "aggregate", "revenue_by_category")
    lineage.record("customers.csv", "join", "rich_customers")
    lineage.record("products_clean", "join", "rich_customers")
    print("downstream of products.csv:", sorted(lineage.downstream("products.csv")))
    print("upstream of revenue_by_category:", sorted(lineage.upstream("revenue_by_category")))
```

El bucle `while frontier:` es un recorrido de grafo genuino (estilo BFS) escondido en Python simple: cada nodo sondeado añade sus vecinos no vistos tanto a `seen` (para que se reporten) como a `frontier` (para que se exploren), que es exactamente cómo "¿qué depende de `products.csv`?" descubre la respuesta *transitiva* — `revenue_by_category` es descendente aunque nada apunte directamente a él. El conjunto `seen` que además sirve como guardia de ciclos significa que un bucle mal declarado en los datos de linaje termina en lugar de colgar tu informe.

**🎯 Resultado esperado :**

```
downstream of products.csv: ['products_clean', 'revenue_by_category']
upstream of revenue_by_category: ['products.csv', 'products_clean']
```

**🩹 Si sale mal :** Si el descendente devuelve *solo* `products_clean`, el bucle de la frontera no está revisando los nodos recién añadidos — confirma que `frontier.add(derived)` existe dentro del bucle, no solo `seen.add`. Si la demo re-añade aristas en cada corrida, la línea de reinicio `lineage.edges = []` está haciendo trabajo real — un almacén persistente que nunca se reinicia crece sin límite.

### 4.2 Verifica el linaje

**✅ Lista de verificación**

- ✅ Ambos recorridos devuelven exactamente los conjuntos ordenados de arriba (transitivo en ambas direcciones).
- ✅ Un nodo sin aristas (p. ej., `"ghost.db"`) devuelve un conjunto vacío, no un error.
- ✅ `lineage.json` recarga en la misma lista de aristas en un proceso nuevo.

**🤔 Pregunta(s) socrática(s)**

- El recorrido es *amplitud-primero mediante un conjunto*. ¿Qué cambiaría si quisieras la *ruta de dependencia más corta* de `products.csv` a `revenue_by_category` — el conjunto descarta intencionalmente qué información, y qué estructura la preservaría?
- Ambos recorridos viven en una sola clase sobre las mismas aristas. ¿Dónde usa `upstream` `derived == current` mientras `downstream` usa `src == current` — y cómo le explicarías "invierte la comparación, reutiliza toda la fontanería" a un compañero junior?

## Paso 5: La CLI del catálogo

La librería está hecha; la *herramienta* necesita ser un comando que alguien pueda escribir. Los subcomandos `argparse` convierten todo el proyecto en tres verbos — `add`, `search`, `lineage` — cada uno reutilizando exactamente una función de los pasos anteriores.

### 5.1 Conectar los subcomandos

**👟 Pista inicial :** Crea el analizador con `add_subparsers(required=True)`, registra un subanalizador por verbo, y despacha en un `main()` que instancia `CatalogIndex`/`Lineage` por comando:

```python
# catalog.py
import argparse

from index import CatalogIndex
from lineage import Lineage
from metadata import extract_metadata
from search import search

def main() -> None:
    parser = argparse.ArgumentParser(description="Catalog datasets; answer search and lineage queries.")
    sub = parser.add_subparsers(dest="command", required=True)

    add_cmd = sub.add_parser("add", help="Add a CSV dataset to the catalog")
    add_cmd.add_argument("csv_path")

    search_cmd = sub.add_parser("search", help="Search datasets by name or column")
    search_cmd.add_argument("query")

    lineage_cmd = sub.add_parser("lineage", help="Show what depends on, or feeds, a dataset")
    lineage_cmd.add_argument("dataset")
    lineage_cmd.add_argument("--direction", choices=["downstream", "upstream"], default="downstream")

    args = parser.parse_args()
    index = CatalogIndex()

    if args.command == "add":
        entry = extract_metadata(args.csv_path)
        index.add(entry)
        print(f"added {entry.name}: {len(entry.columns)} cols, {entry.row_count} rows")
    elif args.command == "search":
        for name, score in search(index, args.query):
            print(f"{name}  (score {score})")
        if not index.entries:
            print("catalog is empty -- run 'add' first")
    elif args.command == "lineage":
        lineage = Lineage()
        result = lineage.downstream(args.dataset) if args.direction == "downstream" \
            else lineage.upstream(args.dataset)
        print(f"{args.direction} of {args.dataset}:", sorted(result) or "nothing")

if __name__ == "__main__":
    main()
```

```bash
uv run python catalog.py add products.csv
uv run python catalog.py search price
uv run python catalog.py lineage products.csv --direction downstream
```

El patrón a interiorizar: cada subcomando *compone* las funciones de la librería anteriores en lugar de reimplementarlas — `add` es `extract_metadata` + `index.add`, `search` es una llamada a función, `lineage` es una llamada a clase. El `required=True` en `add_subparsers` es la diferencia entre `catalog.py` sin verbo imprimiendo una lista de uso útil versus no hacer nada silenciosamente.

**🎯 Resultado esperado :** `added products: 5 cols, 2 rows`, luego `products  (score 1)`, luego `downstream of products.csv: ['products_clean', 'revenue_by_category']`.

**🩹 Si sale mal :** Si ejecutar `add` dos veces sobre el mismo archivo imprime la misma línea dos veces, eso es *correcto* — `add` sobrescribe la misma clave del catálogo. Si `--direction upstream` no devuelve nada, las aristas bajo `lineage.json` se registraron con roles de `derived`/`source` que esperas al revés — el recorrido sigue la dirección registrada, así que re-verifica las llamadas `record`.

### 5.2 Verifica la CLI

**✅ Lista de verificación**

- ✅ `add` en ambos CSVs de muestra, luego `search price`, reproduce el resultado del Paso 3 desde la terminal.
- ✅ `catalog.py --help` y `catalog.py search --help` listan los verbos y flags esperados.
- ✅ `lineage --direction upstream` en `rich_customers` reporta tanto `customers.csv` como `products_clean`.

**🤔 Pregunta(s) socrática(s)**

- `search` en un catálogo vacío imprime una pista, mientras que `lineage` en un archivo vacío reporta silenciosamente "nothing". ¿Por qué el caso vacío es genuinamente *diferente* para los dos comandos — cuál es la asimetría entre "sin datos que buscar" y "sin linaje registrado"?
- Cada comando construye su propio `CatalogIndex()`/`Lineage()`. ¿Cuándo importaría compartir una sola instancia — y para una CLI donde cada corrida es un comando, por qué el estado por comando es el default *correcto* aquí?

## ⚠️ Errores comunes

- **Etiquetar columnas como numéricas porque *algunos* valores son números.** Un `"42"` solo no hace numérica a una columna; cada valor no vacío debe analizarse. Una columna `id` de `["001", "002"]` es probablemente un identificador *texto* disfrazado — infiere cuidadosamente o deja que el catálogo diga "text" honestamente.
- **Llamar `_save` en cualquier lugar que no sea una mutación.** Una búsqueda que "olvida" persistir o una carga que nunca escribe crean un catálogo cuyo estado en disco no está de acuerdo con su estado en memoria. Guarda en cada mutación, carga en cada inicio.
- **Buscar con sensibilidad a mayúsculas.** `Price` vs `price` está a un `.lower()` olvidado de "resultados vacíos". Pon en minúsculas el pajar y la consulta juntos.
- **Recorridos de grafo sin un conjunto `seen`.** Cada BFS/DFS sobre un grafo con cualquier ciclo — el linaje real ocasionalmente hace bucles — se cuelga para siempre sin deduplicación. La división `seen`/`frontier` no es opcional.
- **Registrar linaje pero nunca reproducirlo.** Un API `record` sin consumidores `downstream`/`upstream` produce un archivo JSON que nadie lee. Construye el recorrido en el mismo paso que el almacén, como se hace aquí.

## Lo que acabas de construir

Un catálogo de datos real: archivos CSV escaneados en entradas de metadatos estructurados y tipados; un índice JSON persistente que sobrevive reinicios; una búsqueda puntuada sobre nombres *y* esquemas; y un grafo de linaje recorrido en ambas direcciones para que puedas responder "¿qué se rompe si cambio esto?" con evidencia — todo biblioteca estándar, todo expuesto como tres verbos de CLI. La habilidad transferible es la arquitectura del catálogo en sí: descriptores (metadatos) mantenidos separados de los datos, índices persistidos con una capa de consulta, y *aristas de procedencia explícitas* que convierten "creo que esto está conectado" en un recorrido de grafo que cualquiera puede auditar.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/data-catalog/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-catalog) en el repositorio del curso tiene estos scripts completos más CSVs de muestra y un índice presembrado. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Añade un subcomando `refresh` que re-escanea cada ruta `source` almacenada en el índice y actualiza los conteos de filas/dtypes — detección de deriva sobre tu catálogo con un recorrido sobre `entry.source`.
- Mejora `_infer_type` con un veredicto `date` (analiza con `datetime.fromisoformat`) para que los catálogos distingan fechas reales de texto — un cambio de tres líneas en el árbol de decisión.
- Invierte el puntuador de búsqueda hacia **tf-idf** (divide los conteos de términos por cuántos conjuntos de datos contienen el término) para que los nombres genéricos de columnas como `id` dejen de dominar los resultados.
- Renderiza el linaje como un bloque **Mermaid `graph TD`** (una línea por arista) para que `catalog.py lineage --format mermaid` produzca un diagrama que cualquier issue de GitHub pueda incrustar.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓