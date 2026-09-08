---
title: "Rastreador de Linaje de Datos"
description: "Visualiza cómo fluyen los datos a través de tus sistemas — del origen al dashboard con análisis de impacto."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "graph", "csv", "json"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, conjuntos)"
  - "Leer archivos CSV con el módulo csv"
learningObjectives:
  - "Modelar flujos de datos como un grafo dirigido de nodos fuente, transformación y derivados"
  - "Cargar aristas de linaje desde un registro CSV y persistirlas como JSON"
  - "Recorrer el grafo hacia abajo y hacia arriba con guardias de ciclos"
  - "Ejecutar análisis de impacto que reporten la ruta de dependencia a cada activo afectado"
  - "Renderizar el linaje como un diagrama Mermaid o un árbol de terminal indentado"
---

# 🌊 Construir un Rastreador de Linaje de Datos

Cada conjunto de datos llega de algún lugar y fluye a otro — un CSV se limpia, la tabla limpia alimenta un agregado, el agregado alimenta un dashboard, y el dashboard alimenta una decisión. Cuando alguien cambia el esquema fuente, la pregunta "¿qué está afectado?" es urgente y, sin herramientas, aterradora. Un rastreador de linaje la responde haciendo del pipeline un grafo que puedes *recorrer*: los nodos son conjuntos de datos, las aristas son transformaciones, y el análisis de impacto es una expansión amplitud-primero desde cualquier nodo del grafo. Este proyecto construye ese rastreador desde primeros principios — grafo, cargadores, recorridos, rutas de impacto y dos renderizadores — con cero dependencias.

Esto asume Python 101 más imports cómodos de `csv` y `json` — conjuntos y bucles en casa. No se requiere nada del módulo de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Modelar el linaje como un grafo dirigido de aristas `(source, transform, derived)`.
2. Cargar aristas desde un registro CSV al grafo y persistirlas como JSON.
3. Escribir recorridos descendentes y ascendentes seguros ante ciclos sobre ese grafo.
4. Calcular un mapa de impacto que reporte *la ruta de dependencia completa* a cada activo descendente.
5. Renderizar el grafo como un diagrama Mermaid o un árbol de terminal indentado, y exponerlo como una CLI.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — la herramienta de linaje solo gana su lugar apuntando a *tu* pipeline de transformaciones, así que una carpeta real en disco es su hogar honesto.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan bien para la mitad de recorrido de grafo — el notebook en [`examples/data-lineage-tracker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb) ejecuta cada paso sobre un pipeline de muestra incluido e imprime los mismos árboles. La nota honesta: no puede vigilar los archivos reales de *tu* pipeline como sí puede la CLI local.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-lineage-tracker%2Fnotebook.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entorno virtual" — y este proyecto es biblioteca estándar pura.

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
uv init data-lineage-tracker
cd data-lineage-tracker
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `data-lineage-tracker/` existe con un `pyproject.toml`.
- ✅ `python -c "import csv, json"` se ejecuta — sin paquetes de terceros.

## Paso 1: Modelar el linaje como un grafo dirigido

El grafo más simple y correcto para el linaje es una lista de *aristas dirigidas*: cada arista dice `source --transform--> derived`. Lo dirigido importa — los datos fluyen en una dirección, así que "A alimenta B" *no* implica "B alimenta A". Todo lo demás en este proyecto (recorridos, impacto, renderizado) es código sobre esta única lista.

### 1.1 Escribir la clase del grafo

**👟 Pista inicial :** Un `LineageGraph` que posee una lista `edges` más `add`, `nodes`, `save` (JSON), y un método de clase `load` que degrada a un grafo vacío cuando el archivo falta:

```python
# graph.py
import json
from pathlib import Path

class LineageGraph:
    def __init__(self, edges: list[tuple[str, str, str]] | None = None):
        self.edges: list[tuple[str, str, str]] = edges or []

    def add(self, source: str, transform: str, derived: str) -> None:
        self.edges.append((source, transform, derived))

    def nodes(self) -> set[str]:
        nodes: set[str] = set()
        for src, _transform, derived in self.edges:
            nodes.add(src)
            nodes.add(derived)
        return nodes

    def save(self, path: str = "lineage.json") -> None:
        payload = [{"source": s, "transform": t, "derived": d}
                   for s, t, d in self.edges]
        Path(path).write_text(json.dumps(payload, indent=2))

    @classmethod
    def load(cls, path: str = "lineage.json") -> "LineageGraph":
        if not Path(path).exists():
            return cls()
        raw = json.loads(Path(path).read_text())
        return cls([(e["source"], e["transform"], e["derived"]) for e in raw])

if __name__ == "__main__":
    graph = LineageGraph()
    graph.add("products.csv", "clean", "products_clean")
    graph.add("products_clean", "aggregate", "revenue_by_category")
    graph.add("customers.csv", "join", "rich_customers")
    graph.add("products_clean", "join", "rich_customers")
    graph.save()
    print(sorted(graph.nodes()))
    print(graph.edges)
```

La elección sin dataclass (`edges or []`) es deliberada para un grafo que crece por append: sin defaults de campos que discutir, y `edges or []` protege la trampa del default mutable al asignarlo por default *en el constructor*. Que `nodes()` devuelva un `set` (no una lista) es una promesa silenciosa — la identidad de nodo trata sobre unicidad, y todo lo posterior (recorridos) quiere semántica de conjunto.

**🎯 Resultado esperado :**

```
['customers.csv', 'products.csv', 'products_clean', 'revenue_by_category', 'rich_customers']
[('products.csv', 'clean', 'products_clean'), ('products_clean', 'aggregate', 'revenue_by_category'), ('customers.csv', 'join', 'rich_customers'), ('products_clean', 'join', 'rich_customers')]
```

**🩹 Si sale mal :** Si `nodes()` contiene duplicados, construiste una lista en lugar de un `set` — `nodes.add` no tiene deduplicación. Si `save` escribe un archivo pero `load` devuelve un grafo vacío, las claves en `lineage.json` no coinciden con `source`/`transform`/`derived` — abre el archivo y compara.

### 1.2 Verifica el modelo

**✅ Lista de verificación**

- ✅ `graph.nodes()` devuelve exactamente los cinco nodos distintos de arriba, deduplicados.
- ✅ `save()` y luego `LineageGraph.load()` en un proceso nuevo producen la lista de aristas idéntica.
- ✅ `LineageGraph.load()` sobre un archivo inexistente devuelve un grafo vacío, no una excepción.

**🤔 Pregunta(s) socrática(s)**

- Los nodos se recolectan de los extremos de las aristas. ¿Qué entidad real en un sistema de linaje toca nodos pero *ninguna arista* — y este modelo te permite representarla del todo? ¿Es un bug o una decisión de alcance?
- La arista lleva una etiqueta `transform` ("clean", "aggregate"). ¿Qué *perdería* el grafo si soltaras la etiqueta para ahorrar espacio — y qué característica futura (el *razonamiento* de impacto, no solo el listado) perdería silenciosamente su vocabulario?

## Paso 2: Cargar un pipeline desde CSV

Escribir grafos a mano en Python está bien para demos; los pipelines reales declaran el linaje como un archivo. Este paso añade el otro lado del libro mayor: `transformations.csv`, con una arista por fila — `source,transform,derived` — leída por `csv.DictReader` para que el encabezado nombre los campos en lugar de índices mágicos.

### 2.1 Escribir el cargador CSV

**👟 Pista inicial :** Escribe un `transformations.csv` de muestra con cinco aristas (incluyendo un *fan-out*: `products_clean` alimenta dos cosas), luego un `load_csv_edges` que construye un grafo fila por fila:

```python
# load_edges.py
import csv

from graph import LineageGraph

def load_csv_edges(path: str = "transformations.csv") -> LineageGraph:
    graph = LineageGraph()
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            graph.add(row["source"], row["transform"], row["derived"])
    return graph

if __name__ == "__main__":
    csv_text = """source,transform,derived
products.csv,clean,products_clean
products_clean,aggregate,revenue_by_category
customers.csv,join,rich_customers
products_clean,join,rich_customers
raw_events,dedupe,events_daily
"""
    with open("transformations.csv", "w") as f:
        f.write(csv_text)
    graph = load_csv_edges()
    print(f"{len(graph.edges)} edges, {len(graph.nodes())} nodes")
```

Que `DictReader` convierta cada fila en `{header: value}` es la decisión de diseño que mantiene este cargador en dos líneas — el orden de las columnas en el CSV ahora es irrelevante, porque `row["source"]` direcciona la columna por nombre. Adelantando un poco los pasos posteriores: la muestra incluye intencionalmente `products_clean → rich_customers` *y* `products_clean → revenue_by_category`, así que tendrás un fan-out genuino que recorrer en el Paso 4 en lugar de una línea recta.

**🎯 Resultado esperado :**

```
5 edges, 7 nodes
```

**🩹 Si sale mal :** Un `KeyError: 'source'` significa que la fila de encabezado del CSV no incluye esa palabra exacta — verifica si hay un BOM o espacio en blanco final en la línea de encabezado. Si el conteo de aristas es 4 en lugar de 5, a una fila CSV le falta su nueva línea final — la última fila de datos se cayó del lector.

### 2.2 Verifica la carga

**✅ Lista de verificación**

- ✅ `load_csv_edges()` reporta `5 edges, 7 nodes`.
- ✅ El JSON original del Paso 1 *no* se requiere — `transformations.csv` solo reconstruye todo el grafo.
- ✅ Editar el CSV y re-cargar da conteos de nodos diferentes sin tocar Python.

**🤔 Pregunta(s) socrática(s)**

- El cargador CSV y el constructor del Paso 1 producen ambos `LineageGraph`s. ¿Por qué hacer que "una sola fuente de verdad" sea un archivo, no código, es el mejor diseño a largo plazo para el linaje — y qué cuesta a corto plazo?
- `products_clean` aparece como `derived` (fila 1) y como `source` (filas 3-4). ¿Qué invariante sobre el pipeline es *convenientemente cierta* en la muestra pero el cargador NO la impone — dónde podría un nombre de nodo con typo romper el recorrido silenciosamente más tarde?

## Paso 3: Recorrer el grafo en ambas direcciones

El análisis de impacto es un recorrido. El descendente se expande a lo largo de aristas que *salen* de un nodo ("¿qué se rompe si cambia `products.csv`?"); el ascendente se expande a lo largo de aristas que *entran* a un nodo ("¿de dónde saca sus datos esta tabla?"). Ambos son el mismo bucle con una comparación volteada, y ambos *deben* deduplicar con un conjunto `seen` — los grafos reales contienen ciclos, y un ciclo es un bucle infinito si no estás mirando.

### 3.1 Escribir los dos recorridos

**👟 Pista inicial :** Un auxiliar `_walk` parametrizado: sondea desde un conjunto `frontier`, sigue la dirección apropiada de cada arista, añade vecinos no vistos tanto a `seen` (reportar) como a `frontier` (explorar) — luego dos envoltorios públicos delgados:

```python
# walks.py
from graph import LineageGraph

def _walk(graph: LineageGraph, start: str, reverse: bool = False) -> set[str]:
    """BFS-style traversal. reverse=False follows source -> derived."""
    seen: set[str] = set()
    frontier: set[str] = {start}
    while frontier:
        current = frontier.pop()
        for src, _transform, derived in graph.edges:
            if reverse:
                src, derived = derived, src  # follow edges backwards
            if src == current and derived not in seen:
                seen.add(derived)
                frontier.add(derived)
    return seen

def downstream(graph: LineageGraph, node: str) -> set[str]:
    return _walk(graph, node, reverse=False)

def upstream(graph: LineageGraph, node: str) -> set[str]:
    return _walk(graph, node, reverse=True)

if __name__ == "__main__":
    from load_edges import load_csv_edges
    graph = load_csv_edges()
    print("downstream of products.csv:", sorted(downstream(graph, "products.csv")))
    print("upstream of rich_customers:", sorted(upstream(graph, "rich_customers")))
```

El bucle `while frontier` es la expansión amplitud-primero de libro de texto vistiendo Python simple: cada iteración agota la frontera actual y siembra la siguiente, y `seen` hace doble función — es la *respuesta* (el conjunto alcanzable) y la *garantía de terminación* (los ciclos se vuelven no-ops). Compara los dos envoltorios: `downstream` y `upstream` comparten cada línea; la única comparación volteada `derived, src = src, derived` es toda la diferencia, que es exactamente por qué un auxiliar parametrizado supera a dos funciones copiadas y pegadas.

**🎯 Resultado esperado :**

```
downstream of products.csv: ['products_clean', 'revenue_by_category', 'rich_customers']
upstream of rich_customers: ['customers.csv', 'products.csv', 'products_clean']
```

**🩹 Si sale mal :** Si el descendente de `products.csv` pierde `rich_customers`, el recorrido no es transitivo — confirma que `frontier.add(derived)` existe junto a `seen.add(derived)`; sin re-sembrar, solo obtienes vecinos directos. Si la demo se cuelga, tienes un ciclo que no añadiste — la guardia `seen` de `_walk` es lo que hace imposible un bucle infinito, así que confirma que está dentro del bucle en *cada* add.

### 3.2 Verifica los recorridos

**✅ Lista de verificación**

- ✅ Ambos recorridos devuelven los conjuntos ordenados exactos de arriba (cada uno un resultado de alcanzabilidad *transitivo*).
- ✅ `downstream(graph, "raw_events")` devuelve `{'events_daily'}`, y `upstream(graph, "raw_events")` devuelve un conjunto vacío — el ascendente de una fuente es nada.
- ✅ Añadir un ciclo (`events_daily → raw_events`) al CSV y re-recorrer termina con salida finita.

**🤔 Pregunta(s) socrática(s)**

- El recorrido visita el *mismo* nodo una vez sin importar cuántas rutas lo alcancen. ¿Qué información sobre "hay dos rutas independientes de `products.csv` a `rich_customers`" descarta silenciosamente un conjunto — y por qué `impact` en el siguiente paso necesita exactamente esa estructura más rica?
- `reverse=True` intercambia los extremos, no solo la comparación. ¿Produciría la misma respuesta voltear `src == current` a `derived == current` *sin* el intercambio de extremos? Razona sobre una arista para decidir.

## Paso 4: Análisis de impacto con rutas reales

"Rich customers está afectado" es una *afirmación*; "rich_customers está afectado, y aquí está `products.csv → products_clean → rich_customers`" es *evidencia*. El análisis de impacto mejora el conjunto de alcanzabilidad del Paso 3 hacia un mapa de `activo afectado → ruta de dependencia`, para que un informe pueda mostrar *cómo* el radio de explosión llega a cada tabla.

### 4.1 Escribir el mapa de impacto

**👟 Pista inicial :** Lleva pares `(node, path)` en la frontera, registra la primera ruta encontrada a cada activo, y reutiliza el dict `seen`-como-rutas para dejar de re-visitar:

```python
# impact.py
from graph import LineageGraph

def impact(graph: LineageGraph, start: str) -> dict[str, list[str]]:
    """Map every downstream asset to the first path reaching it."""
    paths: dict[str, list[str]] = {}
    frontier: list[tuple[str, list[str]]] = [(start, [start])]
    while frontier:
        current, path = frontier.pop()
        for src, _transform, derived in graph.edges:
            if src == current and derived not in paths:
                paths[derived] = [*path, derived]
                frontier.append((derived, paths[derived]))
    return paths

if __name__ == "__main__":
    from load_edges import load_csv_edges
    graph = load_csv_edges()
    for asset, path in sorted(impact(graph, "products.csv").items()):
        print(f"{asset}:  {' -> '.join(path)}")
```

La ruta es la innovación sobre el Paso 3: la frontera ahora lleva historia (`[start, ..., current]`), y `paths[derived] = [*path, derived]` guarda una *copia* en el mapa de respuestas cuando un nodo se alcanza por primera vez. La verificación `derived not in paths` es el conjunto `seen` con otro nombre — las claves del dict *son* el conjunto visitado, así que la primera ruta encontrada de un activo se preserva y los ciclos terminan.

**🎯 Resultado esperado :**

```
revenue_by_category:  products.csv -> products_clean -> revenue_by_category
rich_customers:  products.csv -> products_clean -> rich_customers
```

**🩹 Si sale mal :** Si las rutas están truncadas (falta `products.csv`), `[*path, derived]` está construyendo desde un `path` obsoleto — debes desempaquetar la ruta *transportada*, no `paths[current]`, porque el valor transportado registra la ruta hacia `current` mismo. Si dos activos se mapean pero el *orden* se baraja entre corridas, la frontera es una `list` usada como pila (LIFO) — el orden no está garantizado; ordena la salida como hace la demo.

### 4.2 Verifica el impacto

**✅ Lista de verificación**

- ✅ Ambos activos alcanzables desde `products.csv` aparecen con sus rutas completas de tres nodos.
- ✅ El mapa de impacto contiene el mismo conjunto de nodos que el `downstream("products.csv")` del Paso 3.
- ✅ Añadir `events_daily` al grafo aparece en `impact(graph, "raw_events")` — como una ruta de dos pasos, no una arista de un paso.

**🤔 Pregunta(s) socrática(s)**

- El mapa guarda solo la *primera* ruta encontrada. En un grafo con dos rutas a la misma tabla, la segunda — posiblemente más corta o más crítica — se descarta silenciosamente. ¿Es aceptable "la primera registrada" para una herramienta de radio de explosión en migraciones, y qué requeriría "todas las rutas" más allá de este dict?
- La ruta incluye los *nodos* pero no las *transformaciones* ("clean", "aggregate"). ¿Dónde te mantendría honesto exponer la transformación en cada salto sobre *qué tipo de rotura* esperar — esquema vs. semántica?

## Paso 5: Renderizar y exponerlo como una CLI

Un grafo se analiza; un *diagrama* se comunica. Dos renderizadores cubren la división real de audiencias: Mermaid (`graph TD`, pegable directamente en issues de GitHub y Notion) para compartir, y un árbol de terminal indentado para la lectura local instantánea. La CLI une la carga de datos, el impacto y el renderizado en tres verbos dados de puñetazo.

### 5.1 Escribir los renderizadores

**👟 Pista inicial :** `to_mermaid` es un f-string por arista; `render_tree` es un DFS recursivo que emite líneas de nodo indentadas mientras un conjunto de prefijos de ruta previene la recursión infinita en ciclos:

```python
# render.py
from graph import LineageGraph
from impact import impact

def to_mermaid(graph: LineageGraph) -> str:
    lines = ["graph TD"]
    for src, transform, derived in graph.edges:
        lines.append(f'    "{src}" -->|"{transform}"| "{derived}"')
    return "\n".join(lines)

def render_tree(graph: LineageGraph, root: str) -> str:
    paths = impact(graph, root)

    def emit(node: str, depth: int, ancestors: set[str]) -> None:
        yield "    " * depth + node
        for src, _transform, derived in graph.edges:
            if src == node and derived not in ancestors:
                yield from emit(derived, depth + 1, ancestors | {node})

    return "\n".join(emit(root, 0, set()))

if __name__ == "__main__":
    from load_edges import load_csv_edges
    graph = load_csv_edges()
    print(to_mermaid(graph))
    print()
    print(render_tree(graph, "products.csv"))
```

`render_tree` es un *generador* (nota los `yield`/`yield from`) — el árbol indentado transmite sus líneas en lugar de construir un string gigante, lo que mantiene la memoria plana incluso para pipelines profundos. El conjunto `ancestors` es la guardia de ciclos reexpresada para la *ruta* más que para el conjunto visitado: `products_clean → rich_customers` es válido solo si `rich_customers` ya no es un ancestro del nodo actual — así el árbol muestra la jerarquía real, no un eco de sí mismo.

**🎯 Resultado esperado :**

Un bloque Mermaid con cinco flechas `-->` (nombres de nodo entre comillas, etiquetas de transformación), luego el árbol indentado:

```
products.csv
    products_clean
        revenue_by_category
        rich_customers
```

**🩹 Si sale mal :** Si el árbol indenta cada nodo al *mismo* nivel, `emit` está retornando del bucle antes de recurrir — verifica `yield from emit(...)`, no un `emit(...)` pelado (que crea el generador y lo descarta). Si Mermaid renderiza con basura sin comillas, envuelve cada nombre de nodo en comillas dobles dentro del f-string — los nombres con puntos o espacios son los que se rompen si no.

### 5.2 Construir la CLI

**👟 Pista inicial :** Dos subcomandos que comparten un solo `load_csv_edges()` — `impact <node>` imprime líneas de activo + ruta, `dump <node> --format mermaid|tree` imprime el renderizado:

```python
# lineage.py
import argparse

from impact import impact
from load_edges import load_csv_edges
from render import render_tree, to_mermaid

def main() -> None:
    parser = argparse.ArgumentParser(description="Query and render data lineage.")
    sub = parser.add_subparsers(dest="command", required=True)

    impact_cmd = sub.add_parser("impact", help="List every downstream asset with its path")
    impact_cmd.add_argument("node")

    dump_cmd = sub.add_parser("dump", help="Render lineage as Mermaid or an indented tree")
    dump_cmd.add_argument("node")
    dump_cmd.add_argument("--format", choices=["mermaid", "tree"], default="mermaid")

    args = parser.parse_args()
    graph = load_csv_edges()

    if args.command == "impact":
        results = impact(graph, args.node)
        if not results:
            print(f"no downstream assets for {args.node}")
        for asset, path in sorted(results.items()):
            print(f"{asset}:  {' -> '.join(path)}")
    elif args.command == "dump":
        print(to_mermaid(graph) if args.format == "mermaid" else render_tree(graph, args.node))

if __name__ == "__main__":
    main()
```

```bash
uv run python lineage.py impact products.csv
uv run python lineage.py dump products.csv --format tree
```

La CLI es una capa delgada y honesta: cero lógica de dominio nueva, un grafo compartido `load_csv_edges()` por corrida, y cada rama delegando a exactamente una función de los pasos anteriores. `choices=["mermaid", "tree"]` convierte un `--format mermaide` con typo en un *error de uso útil* de `argparse` en lugar de un renderizado incorrecto silencioso.

**🎯 Resultado esperado :** `impact products.csv` imprime las dos líneas de activo/ruta del Paso 4; `dump ... --format tree` imprime el árbol indentado.

**🩹 Si sale mal :** Si cada rama imprime "no downstream assets", el directorio de trabajo de la terminal carece de `transformations.csv` — ejecuta desde la carpeta donde el Paso 2 lo escribió, o la CLI no puede ver las aristas en absoluto. Si `--format tree` no imprime nada para un nodo válido, estás pasando un nombre de nodo con typo — `products.csv` coincide con el `source` de la arista exactamente.

### 5.3 Verifica la CLI

**✅ Lista de verificación**

- ✅ `impact products.csv` coincide exactamente con la salida del Paso 4.
- ✅ `dump raw_events --format mermaid` imprime un bloque `graph TD` de cuatro líneas que podrías pegar en un issue de GitHub.
- ✅ `lineage.py --help` lista ambos subcomandos y las opciones de `--format`.

**🤔 Pregunta(s) socrática(s)**

- `impact` y `dump` llaman cada uno a `load_csv_edges()` una vez — pero si un comando futuro necesitara ejecutar *tanto* impacto como un renderizado, compartir un grafo se vuelve estructurar la CLI alrededor de un objeto de contexto. ¿Dónde está la línea donde "instanciar por rama" deja de estar bien?
- La salida Mermaid es texto que una persona pega; el árbol es texto que una persona lee. Para un *detector de cambios en CI* automatizado, ¿cuál de los dos renderizadores (si alguno) es el formato de salida incorrecto — y cómo se vería el correcto?

## ⚠️ Errores comunes

- **Olvidar que las aristas son dirigidas.** `A → B` nunca implica `B → A`. Si el ascendente y el descendente devuelven el mismo conjunto, construiste un recorrido *no dirigido* — verifica qué extremo sigue cada comparación.
- **Recorrer sin una guardia de visitados.** Cualquier ciclo en los datos (y el linaje real los acumula) convierte una recursión ingenua en un bucle infinito o un `RecursionError`. `seen` (recorridos) y `ancestors` (árbol) no son opcionales.
- **Registrando solo vecinos directos.** Un análisis de impacto que no re-siembra la frontera responde "¿qué *depende directamente* de esto?" — una pregunta útil pero diferente. Transitivo significa `frontier.add(...)` después de cada descubrimiento.
- **Almacenando identidad de nodo de forma inconsistente.** `Products.csv` en una fila y `products.csv` en otra crean dos nodos con una letra de diferencia. Normaliza los nombres en el momento de la carga o cada ruta se bifurca silenciosamente.
- **Dejar que el renderizador sea dueño del análisis.** Si `render_tree` recalcula su propia alcanzabilidad en lugar de reutilizar `impact`, el diagrama y el informe de impacto pueden discrepar sobre el mismo grafo. Un grafo, un recorrido, muchos renderizadores.

## Lo que acabas de construir

Un rastreador de linaje real: un grafo dirigido de conjuntos de datos y transformaciones, cargado desde CSV y persistido como JSON, recorrido hacia abajo y hacia arriba con recorridos seguros ante ciclos, analizado en mapas de impacto que *cargan rutas*, y renderizado tanto como Mermaid compartible y árboles legibles — todo biblioteca estándar, todo detrás de una CLI de dos verbos. La habilidad transferible es pensar en tu pipeline como un grafo en lugar de un orden de scripts: en el momento en que el flujo de datos se vuelve aristas recorribles, "¿qué se rompe si cambio esto?" deja de ser una reunión y se vuelve una llamada a función.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/data-lineage-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-lineage-tracker) en el repositorio del curso tiene estos scripts completos más un pipeline de muestra más grande y Mermaid pre-generado. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Extiende el CSV con una columna `schema_change` ("rename", "drop", "add") y haz que `impact` anote cada activo con *qué tipo* de rotura esperar — la respuesta a la pregunta socrática del Paso 4, ahora de primera clase.
- Añade un renderizador `.dot` (Graphviz) para que la CLI pueda emitir `lineage.dot` y dejar que Graphviz distribuya todo el grafo con `dot -Tpng`.
- Implementa el análisis de impacto de **todas las rutas** (un DFS acotado que registra cada ruta, no la primera), luego compara las cadenas de dependencia más cortas vs. las más largas para el mismo activo.
- Auto-descubre aristas: escanea una carpeta de archivos SQL/texto en busca de `INSERT INTO x SELECT ... FROM y` y alimenta las coincidencias al cargador CSV — extracción de linaje, no solo renderizado.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓