---
id: codebase-knowledge-graph
title: "Convierte un Código Base en un Grafo de Conocimiento"
sidebar_label: "Convierte un Código Base en un Grafo de Conocimiento"
slug: /projects/codebase-knowledge-graph
description: "Gradúate del playground del navegador a Python real: analiza los archivos Python de un código base real con el módulo ast, construye un grafo de su estructura con networkx, y visualízalo y consúltalo — sin clave de API, sin acceso a red."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Convierte un Código Base en un Grafo de Conocimiento

<ProjectPublishedDate projectId="codebase-knowledge-graph" />

<ProjectGreeting />

Cada otro proyecto de esta sección eventualmente recurre a una clave de API, un registro de nivel gratuito, o un sitio web en vivo. Este no necesita nada de eso. Escribirás una herramienta que lee código fuente Python de la misma forma que lo hace el propio intérprete — analizándolo en un **AST** (árbol de sintaxis abstracta) con el módulo `ast` integrado de la biblioteca estándar — luego convierte lo que encuentra en un **grafo**: archivos, funciones y clases como nodos, relaciones "importa"/"llama"/"definido en" como aristas. Ese es un ejemplo real y funcional de una estructura de datos de muy atrás en el curso apareciendo en una herramienta genuinamente útil, no un ejercicio de clase: un grafo es solo nodos y aristas, y resulta que la propia estructura de un código base ya es uno.

Esto asume Python 101 y comodidad con funciones e imports — no se requiere nada de Análisis de Datos, y nada aquí llama a ningún modelo de IA o servicio web. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv` y configurar un pequeño proyecto con `networkx` y `pyvis` — sin clave de API, sin registro, nada que configurar.
2. Analizar el AST de un solo archivo Python para encontrar sus definiciones de función, definiciones de clase, e imports.
3. Recorrer un repositorio completo y construir un grafo con todo lo que encuentres, usando `networkx`.
4. Añadir aristas para relaciones de **import** y **llamada**, para que el grafo capture cómo las piezas realmente se conectan, no solo qué existe.
5. Visualizar el grafo como una página HTML interactiva con `pyvis` (y, opcionalmente, una imagen estática con `matplotlib`).
6. Escribir una pequeña función de consulta — "¿qué llama esta función?", "¿qué importa este módulo?" — y ejecutar todo contra un repositorio real.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — Python real, en tu propia máquina, leyendo archivos reales de una carpeta real en disco.

**GitHub Codespaces** también funciona genial aquí: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta los mismos comandos `uv` exactos desde una terminal en tu pestaña del navegador — y ya tienes un repositorio real ahí mismo para apuntar la herramienta.

**Google Colab o Kaggle Notebooks** son una opción genuinamente fácil también, no solo un respaldo — este proyecto no necesita GPU, ni un proceso de servidor de larga duración, ni clave de API, solo `pip install`s y computación pura. Haz `!pip install networkx pyvis` en una celda, luego ya sea `!git clone` de un repositorio público para analizar o sube una pequeña carpeta de archivos `.py`, y el resto del código de abajo funciona esencialmente sin cambios (la salida HTML de pyvis incluso puede mostrarse en línea en una celda de notebook).

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-knowledge-graph/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-knowledge-graph/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcodebase-knowledge-graph%2Fnotebook.ipynb)

Un notebook listo con todo el código de abajo — incluyendo los archivos de juguete `sample_repo/` escritos en línea, así que no hay nada que subir o clonar — está en [`examples/codebase-knowledge-graph/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-knowledge-graph/notebook.ipynb). Haz clic en una insignia de arriba para lanzarlo directamente.

## Configuración

Ya que no hay clave de API ni archivo `.env` en ningún lugar de este proyecto, la configuración es inusualmente corta.

**Instala `uv`**, una sola herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes":

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

**Configura un proyecto e instala dependencias:**

```bash
uv init codebase-graph
cd codebase-graph
uv add networkx pyvis matplotlib
```

`networkx` es una biblioteca de grafos gratuita y de Python puro — maneja la estructura de datos de grafo real (nodos, aristas, recorrido) para que no tengas que escribir una desde cero. `pyvis` convierte un grafo de `networkx` en una página HTML interactiva que puedes arrastrar y hacer zoom en un navegador. `matplotlib` es opcional, usado para una alternativa de imagen estática en el Paso 5.

Esa es toda la configuración. **Sin clave de API, sin archivo `.env`, sin registro de nivel gratuito, sin variable de entorno que configurar** — cada paso de aquí en adelante lee archivos locales y ejecuta computación local.

:::tip[No se necesita acceso a internet después de la instalación]
Una vez que `uv add` termine de descargar estos tres paquetes, el resto completo de este proyecto puede correr con tu red desconectada. Vale la pena notar esto: todo lo demás en esta sección del curso gira alrededor de llamar a un modelo remoto o un sitio web remoto, y es fácil empezar a asumir que cada proyecto Python "real" necesita una llamada de red en algún lugar. Este es un contraejemplo útil — el análisis estático y la teoría de grafos son completamente offline.
:::

## Paso 1: Analiza el AST de un solo archivo

Antes de analizar un repositorio completo, haz que un archivo funcione. El módulo `ast` integrado de Python convierte código fuente en un árbol de objetos que describe su estructura — la misma representación que el propio intérprete construye antes de ejecutar tu código. `ast.parse` te da la raíz de ese árbol; `ast.walk` te permite visitar cada nodo en él.

Crea un pequeño archivo de prueba, `sample.py`:

```python
# sample.py
import os

def greet(name):
    print(f"Hello, {name}")

class Greeter:
    def greet_twice(self, name):
        greet(name)
        greet(name)
```

Luego escribe `explore_ast.py` para explorarlo:

```python
# explore_ast.py
import ast
from pathlib import Path

source = Path("sample.py").read_text(encoding="utf-8")
tree = ast.parse(source, filename="sample.py")

for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        print("function:", node.name)
    elif isinstance(node, ast.ClassDef):
        print("class:", node.name)
    elif isinstance(node, ast.Import):
        for alias in node.names:
            print("import:", alias.name)
    elif isinstance(node, ast.ImportFrom):
        print("import from:", node.module)
```

```bash
uv run python explore_ast.py
```

Deberías ver `function: greet`, `class: Greeter`, e `import: os` impresos — más `function: greet_twice`, ya que `ast.walk` visita *cada* nodo en el árbol, incluyendo una definición de método anidada dentro de una clase. Ese anidamiento importa para el Paso 2: una función encontrada de esta forma podría ser una función genuina de nivel superior, o podría ser un método que solo tiene sentido adjunto a su clase, y el grafo necesita mantener esa distinción en lugar de aplanar todo en un montón indiferenciado de "funciones."

:::tip[ast.parse puede fallar — y eso es esperado, no un bug en tu código]
No todo archivo `.py` en un repositorio real se analiza limpiamente: un archivo podría ser código Python 2 sobrante en un repositorio antiguo, un archivo de plantilla con extensión `.py` que no es Python válido en absoluto, o genuinamente tener un error de sintaxis que alguien olvidó arreglar. `ast.parse` lanza `SyntaxError` exactamente en este caso. Envolverlo en `try`/`except SyntaxError` y saltar el archivo con una advertencia — en lugar de dejar que toda la herramienta falle en el archivo uno de dos mil — es práctica estándar para cualquier herramienta que recorra un código base real, y está incorporado en la versión del Paso 2.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python explore_ast.py` se ejecuta sin errores e imprime `function: greet`, `class: Greeter`, e `import: os`.</StepChecklistItem>
<StepChecklistItem>`function: greet_twice` también se imprime, aunque está anidada dentro de `Greeter` — confirmando que `ast.walk` visita cada nodo, no solo los de nivel superior.</StepChecklistItem>
<StepChecklistItem>Puedes explicar, en una frase, la diferencia entre `ast.Import` (`import os`) y `ast.ImportFrom` (`from x import y`).</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `ast.walk` visita nodos sin ningún orden particular garantizado relativo a la profundidad de anidamiento. Si necesitaras saber específicamente a qué clase pertenece un método, ¿te daría eso la iteración plana de `ast.walk` sola, o necesitarías recorrer `tree.body` (solo de nivel superior) y luego el propio `.body` de cada clase por separado? ¿Por qué el Paso 2 termina haciendo lo segundo?
- ¿Qué haría `ast.parse` si le dieras un archivo `.txt` lleno de prosa en inglés en lugar de código Python? Pruébalo y observa si el mensaje de error resultante realmente ayudaría a alguien depurando un problema real de "por qué mi escaneo se saltó este archivo."

## Paso 2: Recorre un repositorio completo y construye el grafo

La estructura de un solo archivo es un comienzo; el valor de todo un repositorio de archivos, funciones, clases y sus relaciones es lo que hace de esto un verdadero *grafo de conocimiento* en lugar de una lista. `networkx.DiGraph` (grafo dirigido — las aristas tienen una dirección, ya que "el archivo A importa el módulo B" no es la misma afirmación que "el módulo B importa el archivo A") es la estructura de datos que contiene todo esto.

```python
# build_graph.py (excerpt -- Step 2)
import ast
from pathlib import Path

import networkx as nx


def parse_file(path):
    """Parses one file's AST; returns None and warns instead of crashing on a syntax error."""
    try:
        tree = ast.parse(path.read_text(encoding="utf-8", errors="ignore"), filename=str(path))
    except SyntaxError as exc:
        print(f"Skipping {path}: syntax error ({exc.msg} at line {exc.lineno})")
        return None
    return tree


def build_graph(repo_path):
    graph = nx.DiGraph()

    for path in sorted(repo_path.rglob("*.py")):
        tree = parse_file(path)
        if tree is None:
            continue

        rel = str(path.relative_to(repo_path))
        graph.add_node(rel, kind="file")

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module = alias.name.split(".")[0]
                    graph.add_node(module, kind="module")
                    graph.add_edge(rel, module, kind="imports")
            elif isinstance(node, ast.ImportFrom) and node.module:
                module = node.module.split(".")[0]
                graph.add_node(module, kind="module")
                graph.add_edge(rel, module, kind="imports")

        # Only tree.body -- top-level statements -- so a method nested in a
        # class isn't mistaken for a module-level function (see Step 1).
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                qualified = f"{rel}::{node.name}"
                graph.add_node(qualified, kind="function", short_name=node.name)
                graph.add_edge(rel, qualified, kind="defines")
            elif isinstance(node, ast.ClassDef):
                class_qualified = f"{rel}::{node.name}"
                graph.add_node(class_qualified, kind="class", short_name=node.name)
                graph.add_edge(rel, class_qualified, kind="defines")

    return graph


if __name__ == "__main__":
    graph = build_graph(Path("sample_repo"))
    print(f"{graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges")
```

Cada nodo en un grafo de `networkx` es solo un valor hasheable — aquí, una cadena simple como `"models.py"` o `"models.py::Order"` — con un diccionario opcional de atributos (`kind`, `short_name`) adjunto. Usar `"file.py::name"` como id del nodo, en lugar de solo `"name"`, importa tan pronto como un repositorio tenga dos archivos que ambos definan una función llamada `helper` — sin el prefijo de archivo, `networkx` silenciosamente los trataría como el *mismo* nodo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Ejecutar `build_graph.py` contra una pequeña carpeta de archivos `.py` imprime un conteo de nodos y aristas distinto de cero.</StepChecklistItem>
<StepChecklistItem>Un archivo que define dos funciones e importa un módulo produce al menos 4 nodos solo para ese archivo (el archivo mismo, el módulo, y las dos funciones).</StepChecklistItem>
<StepChecklistItem>Rompe deliberadamente la sintaxis de un archivo (un corchete sin cerrar) y confirma que la herramienta lo salta con una advertencia en lugar de fallar.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué usar `"file.py::function_name"` como id de nodo en lugar de solo `"function_name"`? ¿Qué específicamente saldría mal en un repositorio con dos archivos `utils.py` en subcarpetas diferentes, cada uno definiendo una función llamada `run`?
- `graph.add_node(module, kind="module")` corre cada vez que se encuentra un import, incluso si ese módulo ya fue añadido por un archivo anterior. ¿`networkx` crea un nodo duplicado, o simplemente deja el existente en paz? Revisa la documentación de `networkx` (o simplemente pruébalo) — ¿por qué ese comportamiento hace que este código sea seguro de llamar repetidamente sin verificar "¿he visto este módulo antes" tú mismo?

## Paso 3: Añade aristas de llamada

Archivos, funciones, clases e imports describen lo que *existe*. Para capturar cómo las piezas realmente *se usan* entre sí, necesitas una relación más: qué función llama a cuál. Esta es la parte menos precisa de la herramienta — el análisis estático no siempre puede estar seguro de a qué apunta una llamada (más sobre esto en los pitfalls de abajo) — pero una versión de "mejor esfuerzo, emparejada por nombre" sigue siendo genuinamente útil.

```python
# build_graph.py (excerpt -- Step 3, extends parse_file's per-function work)
def called_names(func_node):
    """Best-effort list of names a function/method's body calls."""
    names = []
    for node in ast.walk(func_node):
        if isinstance(node, ast.Call):
            target = node.func
            if isinstance(target, ast.Name):          # add(...)
                names.append(target.id)
            elif isinstance(target, ast.Attribute):    # utils.add(...) or self.total()
                names.append(target.attr)
    return names
```

`node.func` en un `ast.Call` es o un `ast.Name` (una llamada directa como `add(...)`) o un `ast.Attribute` (una llamada con punto como `utils.add(...)` o `self.total()`) — obteniendo `.id` o `.attr` respectivamente te da el nombre corto de cualquier forma, aunque nota que tanto `utils.add(...)` como `some_other_object.add(...)` colapsan a la misma cadena, `"add"`. Esa es una limitación real, no un descuido, y es exactamente por qué el emparejamiento del siguiente paso es por *nombre*, no por certeza.

Una vez que cada función/clase/método en el repositorio ha sido añadido como un nodo (Paso 2), una segunda pasada resuelve cada llamada registrada contra cualquier nodo que comparta ese nombre corto, y añade una arista `"calls"`:

```python
# build_graph.py (excerpt -- Step 3, second pass over the whole graph)
def add_call_edges(graph, calls_by_function):
    by_short_name = {}
    for node, data in graph.nodes(data=True):
        if data.get("kind") in {"function", "method"}:
            by_short_name.setdefault(data["short_name"], []).append(node)

    for caller, called_names_list in calls_by_function.items():
        for name in called_names_list:
            for target in by_short_name.get(name, []):
                if target != caller:
                    graph.add_edge(caller, target, kind="calls")
```

Esta estructura de dos pasadas — primero recolectar cada definición, *luego* resolver llamadas contra el conjunto completo — es necesaria porque una función definida cerca de la parte superior de un archivo puede llamar a una definida cerca del final; una sola pasada de arriba a abajo se perdería completamente las referencias hacia adelante.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Después de ejecutar la herramienta completa en `sample_repo/` (del ejemplo complementario, o tus propios archivos de prueba), existe al menos una arista `"calls"` entre dos funciones en archivos diferentes.</StepChecklistItem>
<StepChecklistItem>Puedes señalar una llamada específica en tu código de prueba y encontrar la arista correspondiente en el grafo.</StepChecklistItem>
<StepChecklistItem>Puedes explicar por qué el paso de resolución de llamadas tiene que correr *después* de que cada archivo haya sido escaneado, no archivo por archivo a medida que avanzas.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Dos clases no relacionadas en tu repositorio de prueba ambas definen un método llamado `run`. Si una tercera función llama `some_object.run()`, ¿añadirá el emparejamiento por nombre de esta herramienta una arista `"calls"` a *ambos* métodos `run`, o solo al correcto? ¿Qué haría falta para arreglar eso — y vale la pena la complejidad añadida para una herramienta de aprendizaje como esta?
- `add_call_edges` evita crear un self-loop (`if target != caller`). ¿Qué patrón real de Python crearía un self-loop aquí si esa verificación fuera eliminada, y sería un self-loop realmente *incorrecto*, o solo visualmente ruidoso en el renderizado del Paso 4?

## Paso 4: Visualiza el grafo

Un grafo con unos pocos cientos de nodos es ilegible como una lista de aristas — visualizarlo es lo que realmente te permite *ver* la forma de un código base. `pyvis` envuelve la salida de `networkx` en una página HTML autocontenida e interactiva: arrastra nodos, haz zoom, pasa el cursor para detalles, sin servidor necesario más allá de abrir el archivo en un navegador.

```python
# build_graph.py (excerpt -- Step 4)
from pyvis.network import Network

COLORS = {"file": "#3b82f6", "module": "#9ca3af", "class": "#f59e0b", "function": "#10b981", "method": "#10b981"}


def visualize_pyvis(graph, output_path="graph.html"):
    net = Network(height="800px", width="100%", directed=True, notebook=False)
    net.barnes_hut()  # a physics layout that spaces nodes apart instead of overlapping

    for node, data in graph.nodes(data=True):
        kind = data.get("kind", "module")
        label = data.get("short_name", node)
        net.add_node(node, label=label, title=f"{kind}: {node}", color=COLORS.get(kind, "#9ca3af"))

    for source, target, data in graph.edges(data=True):
        net.add_edge(source, target, title=data.get("kind", ""))

    net.write_html(output_path)
```

```bash
uv run python build_graph.py
```

Abre el `graph.html` resultante en un navegador. Los nodos están coloreados por tipo (archivos azules, clases ámbar, funciones/métodos verdes, módulos externos grises); al pasar el cursor sobre cualquier nodo o arista se muestra su id completo y tipo de relación en un tooltip.

Si prefieres tener una imagen estática (para incrustar en un documento, o para un repositorio demasiado grande para que el layout interactivo se mantenga legible), `matplotlib` y las propias funciones de dibujo de `networkx` también cubren ese caso:

```python
# build_graph.py (excerpt -- Step 4, matplotlib alternative)
import matplotlib.pyplot as plt

def visualize_matplotlib(graph, output_path="graph.png"):
    fig, ax = plt.subplots(figsize=(12, 9))
    layout = nx.spring_layout(graph, seed=42, k=0.6)  # seed -> reproducible layout between runs
    node_colors = [COLORS.get(graph.nodes[n].get("kind", "module"), "#9ca3af") for n in graph.nodes]
    labels = {n: graph.nodes[n].get("short_name", n) for n in graph.nodes}
    nx.draw_networkx_nodes(graph, layout, node_color=node_colors, node_size=500, ax=ax)
    nx.draw_networkx_labels(graph, layout, labels=labels, font_size=7, ax=ax)
    nx.draw_networkx_edges(graph, layout, ax=ax, arrows=True)
    ax.axis("off")
    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
```

:::tip[pyvis para explorar, matplotlib para compartir una única vista fija]
La interactividad de `pyvis` (arrastrar, hacer zoom, pasar el cursor) es genuinamente mejor para *explorar* un grafo desconocido — puedes separar un clúster denso para ver qué está realmente conectado con qué. La imagen estática de `matplotlib` es mejor una vez que ya sabes qué quieres mostrar y solo necesitas una imagen fija e incrustable — una captura de pantalla de una página `pyvis` no refleja un layout que elegiste a propósito. Ninguna es estrictamente mejor; resuelven momentos diferentes en el mismo flujo de trabajo.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`graph.html` se abre en un navegador y muestra un grafo real y no vacío — no una página en blanco.</StepChecklistItem>
<StepChecklistItem>Arrastrar un nodo lo mueve, y las aristas conectadas lo siguen.</StepChecklistItem>
<StepChecklistItem>Pasar el cursor sobre un nodo muestra su tipo e id completo en un tooltip.</StepChecklistItem>
<StepChecklistItem>(Si probaste la versión de matplotlib) `graph.png` existe y se abre como una imagen real, con colores de nodo distinguibles.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `net.barnes_hut()` ejecuta una simulación física para distribuir los nodos. ¿Qué esperarías que le pase a la utilidad de ese layout mientras el grafo crece de 20 nodos a 2,000 — y es eso una limitación específica de `pyvis`, o una limitación de *cualquier* algoritmo de layout de grafo de propósito general en un grafo grande y densamente conectado?
- La versión de matplotlib pasa `seed=42` a `spring_layout`. ¿Qué cambiaría sobre la imagen resultante, ejecución tras ejecución, si eliminaras la semilla? ¿Por qué podría importar un layout reproducible si estás comparando dos versiones del mismo grafo a lo largo del tiempo (ej. "cómo cambió la estructura de este repositorio después de una refactorización")?

## Paso 5: Consulta el grafo

Un grafo que solo puedes mirar ya es útil, pero un grafo al que puedes *hacerle preguntas* es más útil — y ya que `networkx` te da recorrido de grafo real, esto es un puñado de líneas, no un sistema nuevo.

```python
# build_graph.py (excerpt -- Step 5)
def what_does_it_call(graph, short_name):
    """Every node matching short_name, and everything it calls."""
    results = []
    for node, data in graph.nodes(data=True):
        if data.get("short_name") == short_name or node == short_name:
            callees = [t for _, t, d in graph.out_edges(node, data=True) if d.get("kind") == "calls"]
            results.append((node, callees))
    return results


def who_imports(graph, module_name):
    """Every file with an 'imports' edge pointing at module_name."""
    if module_name not in graph:
        return []
    return [src for src, _, d in graph.in_edges(module_name, data=True) if d.get("kind") == "imports"]
```

```python
>>> what_does_it_call(graph, "total_with_tax")
[('models.py::Order.total_with_tax', ['utils.py::multiply', 'utils.py::add', 'models.py::Order.total'])]
>>> who_imports(graph, "utils")
['main.py', 'models.py']
```

`graph.out_edges(node, data=True)` y `graph.in_edges(node, data=True)` son las dos direcciones de "seguir una arista desde este nodo" — saliente para "qué llama/importa esto", entrante para "qué llama/importa a esto." Esa direccionalidad es exactamente por qué el Paso 2 construyó un `DiGraph` (dirigido) en lugar de un `Graph` no dirigido: "A importa B" y "B importa A" son afirmaciones diferentes y verificables, y un grafo no dirigido habría desechado esa distinción.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`what_does_it_call(graph, ...)` en una función que sabes que llama a otras dos devuelve ambas, por nombre.</StepChecklistItem>
<StepChecklistItem>`who_imports(graph, ...)` en un módulo que sabes que es importado por dos archivos devuelve ambos nombres de archivo.</StepChecklistItem>
<StepChecklistItem>Consultar un nombre que no existe en el grafo devuelve un resultado vacío, no un fallo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `what_does_it_call` empareja por `short_name`, que — como planteó la pregunta socrática del Paso 3 — puede colisionar entre clases no relacionadas con un método del mismo nombre. Escribe una consulta que en su lugar tome un id de nodo *completamente calificado* (ej. `"models.py::Order.total_with_tax"`) directamente. ¿Cuál es la compensación entre los dos estilos de consulta — uno es más fácil de escribir, el otro no es ambiguo?
- ¿Podrías escribir un `what_calls_it(graph, short_name)` — el reverso de `what_does_it_call` — usando `in_edges` en lugar de `out_edges`? ¿Qué te diría eso que `what_does_it_call` no puede?

## Paso 6: Ejecútalo de principio a fin contra un repositorio real

Todo hasta ahora ha estado construyendo hacia una sola cosa: apuntar la herramienta terminada a un código base que nadie construyó específicamente para esta lección, y ver qué resulta. El script de ejemplo complementario en [`examples/codebase-knowledge-graph/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/codebase-knowledge-graph) conecta todo de los Pasos 1–5 en un `build_graph.py` ejecutable, más una pequeña `sample_repo/` de archivos de juguete con relaciones de import/llamada deliberadas para probarlo primero:

```bash
uv run python build_graph.py sample_repo --html graph.html --calls total_with_tax --imports utils
```

Una vez que eso funcione, apúntalo a algo real — **el propio repositorio de este curso es un código base Python genuino y no trivial ya sentado en tu disco si lo has clonado**, o usa cualquier otro repositorio local que tengas:

```bash
uv run python build_graph.py /path/to/python-data-analysis-course/examples --html course_graph.html
```

Abre el HTML resultante y míralo de verdad: ¿qué archivos importan más otros módulos? ¿Qué función tiene más aristas entrantes de "calls" (un buen indicador de "código central, ampliamente usado")? ¿Coincide la forma con lo que ya sabías sobre cómo encaja el código base, o revela una conexión que no sabías que estaba ahí?

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>La herramienta corre contra un repositorio real de múltiples archivos (no solo el `sample_repo/` de juguete) sin fallar.</StepChecklistItem>
<StepChecklistItem>El grafo resultante tiene visiblemente más nodos y aristas que el ejemplo de juguete, y la visualización todavía se renderiza.</StepChecklistItem>
<StepChecklistItem>Puedes nombrar una cosa que el grafo te mostró sobre la estructura de ese código base que no sabías de antemano.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Elige el nodo con más aristas entrantes de `"calls"` en tu grafo de repositorio real. ¿Realmente se siente ese nodo como código "central" cuando abres el archivo real y lo lees? ¿Qué podría hacer que un nodo tenga muchas aristas entrantes *sin* ser realmente especialmente importante?
- Si ejecutaras esta herramienta contra el mismo repositorio de nuevo un mes a partir de ahora, después de que ocurriera desarrollo real en el medio, ¿qué te diría realmente un diff entre los dos grafos que un `git diff` simple no diría?

## ⚠️ Errores comunes

- **Que `ast.parse` falle en un archivo no debería matar todo el escaneo.** Un solo archivo con un error de sintaxis, un archivo no-Python con extensión `.py`, o código Python 2 antiguo dejado en un repositorio lanzará `SyntaxError`. Captúralo, salta ese archivo con una advertencia, y continúa — el `try`/`except` del Paso 1 está ahí específicamente para que un archivo malo de dos mil no termine la ejecución.
- **El análisis estático no puede ver imports dinámicos o llamadas dinámicas.** `importlib.import_module("some_module")`, `__import__(name)`, o una llamada construida desde una variable (`getattr(obj, method_name)()`) no aparecen como un nodo `ast.Import`/`ast.Call` con un nombre literal de la forma en que lo hacen `import os` o `add(1, 2)` — esta herramienta, como cualquier analizador puramente estático, simplemente no verá esas aristas. Esa es una limitación real y permanente, no un bug que arreglar; un análisis completamente dinámico necesitaría realmente *ejecutar* el código y rastrear qué pasa, lo cual es un tipo diferente (y mucho más pesado) de herramienta.
- **La resolución de llamadas basada en nombre produce falsos positivos.** El `add_call_edges` del Paso 3 empareja llamadas solo por nombre corto, así que dos clases no relacionadas que cada una define un método `run` obtendrán ambas una arista de cualquier llamada que parezca `something.run()`, incluso si solo una de ellas era realmente la intencionada. Esta es una compensación legítima para un proyecto de aprendizaje — la resolución completa de llamadas necesita inferencia de tipos real, que es lo que hace un servidor de lenguaje o una herramienta como `pyright` internamente.
- **Los grafos en un repositorio grande se vuelven demasiado densos para leer visualmente.** Unos pocos cientos de archivos con imports cruzados pesados convierte el layout dirigido por fuerza de `pyvis` en un enredo ilegible — los layouts basados en física separan los nodos, pero no reducen el conteo de aristas. Filtra antes de visualizar: elige una subcarpeta, el vecindario de un archivo (solo sus imports/llamadores directos), o usa las funciones de consulta del Paso 5 para responder una pregunta específica en lugar de intentar renderizar todo el grafo a la vez.

## Lo que acabas de construir

Una herramienta que lee código fuente Python real de la misma forma en que lo analiza el propio intérprete, convierte relaciones de archivo/función/clase/import/llamada en una estructura de datos de grafo honesta, y te permite tanto *ver* esa estructura (interactivamente, con `pyvis`) como *consultarla* (programáticamente, con recorrido de `networkx`) — todo sin una sola llamada de red. La misma forma de tres pasos — analizar con `ast`, construir un grafo con `networkx`, consultarlo o visualizarlo — escala desde el `sample_repo/` de juguete hasta un código base real de miles de archivos; nada sobre el enfoque fue simplificado en algo que deja de funcionar a mayor escala, solo la *legibilidad* de una visualización completa sí lo hace.

## A dónde ir desde aquí

- Añade un nuevo tipo de arista: "hereda de," leyendo la lista `bases` de una definición de clase (`ast.ClassDef.bases`) — una adición genuinamente útil para entender la estructura de un código base orientado a objetos que esta lección no cubrió.
- Calcula métricas de grafo reales con los algoritmos integrados de `networkx` en lugar de estimar a ojo la visualización — `nx.pagerank` o centralidad de grado de entrada para encontrar las funciones más "centrales" de un código base, o `nx.weakly_connected_components` para encontrar clústeres aislados de código que nada más toca.
- Prueba `nx.readwrite.json_graph.node_link_data` para exportar el grafo como JSON, para que una herramienta separada (o un frontend web, si te sientes cómodo con uno) pueda consumirlo sin necesitar `networkx` instalado en absoluto.
- Compara dos grafos de dos puntos diferentes en el historial de git de un repositorio (`git worktree` o dos clones en commits diferentes) para ver, estructuralmente, cómo una refactorización realmente cambió la forma del código base — no solo qué líneas cambiaron, sino qué relaciones aparecieron o desaparecieron.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="codebase-knowledge-graph" />
