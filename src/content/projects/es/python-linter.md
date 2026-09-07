---
title: "Linter de Código Python"
description: "Motor de reglas de linting personalizado para Python con capacidades de auto-corrección e integración con IDE."
difficulty: "advanced"
estimatedMinutes: 90
tags: ["cli", "ast", "static-analysis", "tooling"]
learningObjectives:
  - "Parse Python source into an abstract syntax tree with the ast module"
  - "Traverse the tree with an ast.NodeVisitor and collect nodes by type"
  - "Dot-map imported names to their uses to detect unused imports"
  - "Grade findings by severity and emit an exit-code report for CI"
prerequisites: ["python-101/functions", "python-101/data-structures", "python-101/file-io", "python-101/scope-and-lambdas"]
---

# 🧹 Construye un Linter de Python

Todo proyecto serio de Python ejecuta un linter antes de hacer merge, y el primer trabajo del linter no es ciencia espacial — es *leer la forma del código*. Python incluye un módulo de la biblioteca estándar llamado `ast` que analiza un archivo `.py` en un árbol de nodos — imports, definiciones de funciones, llamadas, excepciones — que puedes recorrer e inspeccionar. Este proyecto construye un linter funcional encima de él: analiza un archivo, recorre el árbol e informa tres problemas reales — imports sin usar, cláusulas `except:` desnudas y funciones más largas que un límite de líneas — con un grado de severidad por hallazgo y un código de salida que permite que un script de CI falle por ellos. Estás construyendo el motor, y es lo suficientemente pequeño como para entender cada línea.

Esto asume Python 101 — funciones, dicts, E/S de archivos y una sensación del ámbito de variables. Nada más allá de eso: sin paquetes, sin framework, sin servicios externos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Analizar un archivo Python en un AST e inspeccionar cómo se ve realmente el árbol.
2. Recorrer el árbol con `ast.NodeVisitor` para encontrar imports y definiciones de funciones.
3. Ampliar eso al patrón de linting: recoger cada nombre que un archivo define y cada nombre que *usa*, luego hacer un diff.
4. Convertir los hallazgos recogidos en un informe con calificación y números de línea.
5. Envolver el informe en un CLI que devuelva un código de salida no cero cuando haya hallazgos graves — el hábito de integración con CI.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — la razón de existir de un linter es apuntarlo a un archivo `.py` real en un repo real, y nada de `ast` se preocupa de dónde vive el archivo. Los pasos de abajo escriben el linter en una carpeta pequeña con `uv`; apuntarlo a tus otros proyectos del curso es la autoprueba obvia.

**GitHub Codespaces** funciona de forma idéntica: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y los mismos comandos exactos se ejecutan en una pestaña del navegador — incluso puedes hacer lint de los scripts raíz del propio repo del curso.

**Google Colab, Kaggle Notebooks y Binder ejecutan cada paso del motor con honestidad** — `ast` es stdlib pura, sin GPU, sin claves — pero el *producto* aquí es un CLI sobre archivos, y los notebooks son el sustrato equivocado para "ejecuta esto sobre mi carpeta de proyecto entera". El notebook hace lint de su propio archivo de borrador incluido para que puedas ver el motor trabajar de principio a fin; cambia a local para el caso de uso real estilo `python -m pylint`.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/python-linter/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/python-linter/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpython-linter%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes del primer análisis: `uv` y un archivo de prueba deliberadamente descuidado que demuestre las tres reglas a la vez.

### Instala `uv` y crea el andamiaje

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego:

```bash
uv --version
mkdir python-linter && cd python-linter
uv init --bare
```

Cero paquetes extra — `ast` está en la biblioteca estándar.

### Escribe un archivo de prueba descuidado

Pega en `sloppy.py`:

```python
import os
from math import sqrt, floor

def compute(x):
    unused = 42
    result = sqrt(x) + floor(x)
    return result

def process(data):
    try:
        return data["key"]
    except:
        return None

# 11+ line function, to blow past any sane limit
def long_function_start(a, b, c, d):
    one = a
    two = b
    three = c
    four = d
    five = one + two
    six = three + four
    seven = five + six
    eight = seven
    nine = eight
    ten = nine + a
    eleven = ten
    return eleven
```

```bash
uv run python -c "import ast; print('ast ready')"
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `sloppy.py` existe con un `import os` sin usar, una variable `unused` sin usar, un `except:` desnudo y un `long_function_start` demasiado largo.
- ✅ `uv run python -c "import ast"` tiene éxito — todo el proyecto es la biblioteca de esa línea.

## Paso 1: Analiza un archivo en un AST

Un linter ve el código como lo ve un compilador: un árbol de nodos, no líneas de texto. `ast.parse` convierte el código fuente en ese árbol, y `ast.dump` te muestra la forma — la forma más rápida de creer en todo el enfoque es un `print(ast.dump(tree))`.

### 1.1 Analiza e inspecciona

```python
# parse_ast.py
import ast
from pathlib import Path

def parse_source(path: str) -> ast.Module:
    source = Path(path).read_text(encoding="utf-8")
    return ast.parse(source)

if __name__ == "__main__":
    tree = parse_source("sloppy.py")
    print("module body has", len(tree.body), "statements")
    for node in tree.body:
        print(f"  {type(node).__name__}: {node.__dict__.get('name', '')!r} at line {node.lineno}")
```

`ast.parse` devuelve un `ast.Module` cuyo `.body` es una lista de nodos de sentencia de nivel superior — `Import`, `ImportFrom`, `FunctionDef`. Cada nodo lleva un atributo `.lineno`, que es lo que te permite informar *números de línea* sin trackearlos tú mismo; el vistazo `node.__dict__.get('name', '')` muestra que los diferentes tipos de nodo tienen campos diferentes, que es por lo que los linters ramifican por tipo de nodo en lugar de esperar una forma uniforme.

**👟 Pista inicial :** Ejecútalo y solo *lee* las cinco líneas de salida — los imports, dos funciones y `long_function_start` volvieron todos como nodos tipados con números de línea, antes de que siquiera se haya pensado en hacer lint.

**🎯 Resultado esperado :** `module body has 3 statements`, luego líneas que nombran `Import` / `ImportFrom` / `FunctionDef` / `FunctionDef` / `FunctionDef` con los números de línea de inicio correctos (1, 2, 4, 9, 14).

**🩹 Si sale mal :** Si se dispara `SyntaxError`, el archivo de prueba tiene un problema de sintaxis — `ast.parse` es un analizador estricto por diseño; arregla el código fuente (esto también es el primer trabajo de un linter: un archivo que no se analiza es el hallazgo de mayor severidad). Si aparece `AttributeError: 'Import' object has no attribute 'name'`, tu protección `.get('name', '')` no se usa en todas partes — cada rama que imprime nodos debe usar `.get`, no `.name`, porque los nodos `Import` llevan `names`, no `name`.

### 1.2 Verifica el análisis

**✅ Lista de verificación**

- ✅ `ast.parse` tiene éxito en `sloppy.py` y devuelve un módulo cuyo `.body` tiene exactamente 3 sentencias de nivel superior.
- ✅ Cada nodo impreso muestra `type.__name__` y un `lineno` numérico.
- ✅ `node.__dict__` para un `ImportFrom` muestra `module='math'` y `names` conteniendo `sqrt` y `floor`.
- ✅ Puedes explicar por qué se prefiere el árbol sobre regex sobre el texto fuente (pista: indentación y cadenas).

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué fallaría un linter construido sobre regex donde `ast` tiene éxito — señala una cosa concreta en `sloppy.py` (pista: `import os` dentro de una *cadena* coincidiría con una regex pero no es un import)? ¿Qué hace inmune al árbol?
- El linting lee el árbol, así que tu linter solo puede ver cosas que el analizador pudo. ¿Qué propiedad de código del mundo real es invisible para `ast` por diseño (pista: involucra nombres que aún no existen)? ¿Eso te hace sentir *cómodo* limitando qué reglas escribes primero?

## Paso 2: Recorre el árbol con NodeVisitor

La recursión manual sobre `tree.body` funciona para un nivel y se desmorona en profundidad: un import dentro de una función, o una función dentro de una clase, está anidado dos niveles hacia abajo. `ast.NodeVisitor` es la respuesta de la biblioteca estándar — dices "llama a este método cada vez que veas un nodo X", y hace la recursión por ti.

### 2.1 Visita imports y definiciones de funciones

```python
# walk.py
import ast
from parse_ast import parse_source

class ImportVisitor(ast.NodeVisitor):
    def __init__(self):
        self.imports = []
        self.functions = []

    def visit_Import(self, node):
        self.imports.append((node.lineno, node.names[0].name))

    def visit_ImportFrom(self, node):
        self.imports.append((node.lineno, f"{node.module}.{node.names[0].name}"))

    def visit_FunctionDef(self, node):
        self.functions.append((node.lineno, node.name, len(node.body)))

if __name__ == "__main__":
    v = ImportVisitor()
    v.visit(parse_source("sloppy.py"))
    print("imports:", v.imports)
    print("functions:", v.functions)
```

El patrón son métodos `visit_X` + una llamada `.visit(tree)`: el framework del visitante despacha cada tipo de nodo a su método y recorre el árbol automáticamente — incluyendo imports anidados dentro de funciones, que `tree.body` solo nunca ve. Cada método es libre de *recoger* en una lista plana; la división "callbacks como métodos, recorrido de árbol como convención" es todo el diseño, y es más fuerte que el recorrido manual porque la profundidad no cuesta nada.

**👟 Pista inicial :** Ejecútalo y comprueba que `long_function_start` se registró con su `len(node.body)` completo — el visitante recurrió dentro de su `body`, que es exactamente lo que la iteración manual de nivel superior no podía.

**🎯 Resultado esperado :** `imports: [(1, 'os'), (2, 'math.sqrt')]`, `functions: [(4, 'compute', 4), (9, 'process', 4), (14, 'long_function_start', 11)]` — nota el `11` para la función larga.

**🩹 Si sale mal :** Si `functions` está vacío, nunca se llamó `.visit()` — el visitante solo *define* los métodos; el despacho ocurre cuando le pasas el árbol. Si solo aparecen funciones de nivel superior, tu visitante recurrió manualmente en lugar de heredar `ast.NodeVisitor` — el recorrido `super()` (que NodeVisitor hace gratis) es lo que desciende a cuerpos anidados.

### 2.2 Verifica el recorrido

**✅ Lista de verificación**

- ✅ `ImportVisitor` recoge tanto un `Import` como un `ImportFrom` desde nivel superior *y* desde cualquier posición anidada.
- ✅ El `len(node.body)` de cada función refleja su conteo real de sentencias (11 para `long_function_start`).
- ✅ El visitante recurre — añadir una función dentro de una función dentro de una función aún la saca a la luz.
- ✅ Puedes explicar por qué `visit_FunctionDef` recoge pero *no* recurre por sí mismo (NodeVisitor hace la recursión).

**🤔 Pregunta(s) socrática(s)**

- `NodeVisitor` despacha por nombre de tipo de nodo. Si dos versiones diferentes de Python añaden un *nuevo* tipo de sentencia para el que tu linter no tiene método `visit_`, ¿qué hace el visitante con él — y es ignorar silenciosamente la sintaxis nueva una característica o un precipicio para una herramienta de linting?
- Nuestro visitante registra `(lineno, name, body_len)`. ¿Qué debes almacenar en su lugar si más tarde quieres hacer lint de funciones *anidadas* dentro de un `ClassDef` — y te lo da `.visit()` gratis? Lo que sea que almacenes, ¿qué *no* captura?

## Paso 3: Detecta imports sin usar

El lint con sabor. Un `import os` arriba no significa nada si nada lo usa; el detector es un diff de nombres: recoge cada nombre que el archivo *define* al importar, recoge cada nombre que el archivo *usa* como nombre (`ast.Name`), y los imports cuyos alias nunca aparecen en el conjunto de usados están sin usar. Es aritmética de conjuntos sobre árboles.

### 3.1 Construye el diff de nombres

```python
# unused.py
import ast
from parse_ast import parse_source

class NameCollector(ast.NodeVisitor):
    def __init__(self):
        self.imported = {}
        self.used = set()

    def visit_Import(self, node):
        for alias in node.names:
            self.imported[alias.asname or alias.name.split(".")[0]] = node.lineno

    def visit_ImportFrom(self, node):
        for alias in node.names:
            self.imported[alias.asname or alias.name] = node.lineno

    def visit_Name(self, node):
        self.used.add(node.id)

def find_unused_imports(src_path: str) -> list[tuple]:
    v = NameCollector()
    v.visit(parse_source(src_path))
    return [(name, lineno) for name, lineno in v.imported.items()
            if name not in v.used]

if __name__ == "__main__":
    for name, line in find_unused_imports("sloppy.py"):
        print(f"line {line}: unused import {name!r}")
```

Las dos colecciones crecieron simétricamente: `imported` es un `dict` de alias → línea (los alias son a lo que se refiere otro código — `import os` enlaza `os`, `import math.sqrt` enlaza `sqrt` como `asname or name.split(".")[0]`, y `from math import sqrt` enlaza `sqrt` directamente), y `used` es el conjunto de cada id de `ast.Name` que el archivo menciona. Un import está "sin usar" exactamente cuando su alias enlazado está ausente del conjunto de usados — y un nombre *re-exportado* deliberadamente (`__all__`) es el falso positivo clásico que esta versión simple invita (mira los errores).

**👟 Pista inicial :** Antes de ejecutar, predice qué debería marcarse: `os` se importó (línea 1) y nunca se usó — un hallazgo. `sqrt` y `floor` se usan ambos en `compute`. Confirma que la herramienta está de acuerdo, luego añade `print(floor(2.7))` en algún lugar y mira cómo `math.floor` se vuelve "usado" — ver el conjunto actualizarse es todo el modelo.

**🎯 Resultado esperado :** Exactamente una línea: `line 1: unused import 'os'`. `sqrt` y `floor` no aparecen.

**🩹 Si sale mal :** Si `sqrt` se marca erróneamente sin usar, tu `visit_Name` recogió deliberadamente *solo* nombres de nivel superior o nunca visitaste los cuerpos de `FunctionDef` — el visitante debe recoger el uso de `Name` de *cada* ámbito; la recursión vía `NodeVisitor` lo maneja. Si `os` no se marca, estás haciendo diff de la colección equivocada — `os` está en `imported`, pero `used` necesita *no* contenerlo; imprime ambos conjuntos y el diff se filtra solo.

### 3.2 Verifica la regla de import sin usar

**✅ Lista de verificación**

- ✅ `sloppy.py` produce exactamente el único hallazgo de `os`.
- ✅ Usar `floor` en cualquier parte de un cuerpo de función limpia `floor` de los resultados — el ámbito no importa.
- ✅ `from x import y as z` enlaza `z`, no `y` — el respaldo `asname or ...` está haciendo su trabajo.
- ✅ Puedes expresar la regla en una frase: un import está sin usar si y solo si su alias enlazado nunca aparece como nombre usado.

**🤔 Pregunta(s) socrática(s)**

- Un nombre usado en una *cadena* (`"os.path.join..."`) o como un *literal* no es un `ast.Name` — pero un archivo que hace `__all__ = ["os"]` *sí* es un uso. ¿Cuál dirección es el falso positivo, y qué tendría que añadir el código para tratar `__all__` correctamente? ¿Cuál es el cambio más pequeño que conserva tu versión simple?
- `visit_Name` recoge *cada* nombre, incluyendo lecturas sin efecto secundario como la variable desnuda `unused = 42`, cuya *definición* también es un `Name`. ¿Es suficiente "el nombre aparece en algún lugar" para "el import está usado" — o tu regla necesita distinguir *lecturas* de *escrituras* (pista: `ast.Name` tiene un campo `ctx` — `Store` vs `Load`)?

## Paso 4: Califica e informa los hallazgos

Los linters ganan su sustento *calificando*: un `except:` desnudo es peor que una función larga, y un candidato a mantenimiento es peor que una nitidez de estilo. Este paso amplía el recolector de una regla a tres, asigna una severidad a cada una y produce el informe imprimible que tu CLI devolverá.

### 4.1 Recoge tres familias de reglas

```python
# rules.py
from unused import NameCollector, find_unused_imports
from walk import ImportVisitor
from parse_ast import parse_source
import ast

SEVERITY = {"error": 2, "warning": 1, "suggestion": 0}
LIMIT_FUNCTION_LINES = 10

def bare_excepts(src_path: str) -> list[tuple]:
    findings = []
    for node in ast.walk(parse_source(src_path)):
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            findings.append((node.lineno, "bare except: catches everything"))
    return findings

def long_functions(src_path: str, limit: int = LIMIT_FUNCTION_LINES) -> list[tuple]:
    v = ImportVisitor()
    v.visit(parse_source(src_path))
    return [(ln, f"{name} is {bl} lines (>{limit})")
            for ln, name, bl in v.functions if bl > limit]

def lint(src_path: str) -> list[tuple[str, int, str]]:
    report = []
    for name, line in find_unused_imports(src_path):
        report.append(("suggestion", line, f"unused import {name!r}"))
    for line, msg in bare_excepts(src_path):
        report.append(("error", line, msg))
    for line, msg in long_functions(src_path):
        report.append(("warning", line, msg))
    return sorted(report, key=lambda r: (-SEVERITY[r[0]], r[1]))

if __name__ == "__main__":
    for sev, line, msg in lint("sloppy.py"):
        print(f"{sev:>10}  line {line:>3}  {msg}")
```

`ast.walk` es el gemelo no visitado de `NodeVisitor` — un generador de una sola pasada que produce *cada* nodo del árbol, perfecto para una regla a la que solo le importa un tipo de nodo en cualquier parte del archivo (`ExceptHandler` sin `type`). El informe es una lista ordenada de tripletas `(severity, line, message)` — ordenada primero por peso de severidad, luego por línea — así que los `error`s salen a la superficie antes que las `suggestion`s dentro de una pasada consistente. Las funciones de regla permanecen independientes y no comparten nada salvo la lista del informe, que es cómo un motor de reglas se mantiene *aditivo*: las reglas nuevas son tests independientes nuevos, no ediciones a una función espagueti.

**👟 Pista inicial :** Ejecuta el informe y confirma que las *tres* familias de reglas se disparan en `sloppy.py` — el import sin usar, el except desnudo (error, el más alto) y la función larga (warning). Luego añade `os.getcwd()` a `compute` y mira cómo la sugerencia de import sin usar desaparece mientras las otras dos se quedan — cada regla es independiente.

**🎯 Resultado esperado :** Tres líneas — `error  line 11: bare except: catches everything`, `warning  line 14: long_function_start is 11 lines (>10)`, `suggestion  line 1: unused import 'os'` — en exactamente ese orden de severidad.

**🩹 Si sale mal :** Si el orden de severidad sale mal, la clave de ordenación `(-SEVERITY[r[0]], r[1])` valora `error=2` → `-2`, y los pesos más altos deben ordenar primero — comprueba que los números del dict `SEVERITY` coinciden con el significado. Si la función larga informa `11 (>10)` pero pusiste `LIMIT_FUNCTION_LINES = 10`, el conteo `body = 11` es correcto — el límite es un *umbral*, así que `> limit` es lo correcto; cambia `>` a `>=` solo si quieres que exactamente-10 cuente como demasiado largo.

### 4.2 Verifica el informe calificado

**✅ Lista de verificación**

- ✅ Las tres familias de reglas se disparan en `sloppy.py`, ninguna regla suprime a otra.
- ✅ Las líneas del informe se ordenan por severidad (error → warning → suggestion), cada una con un número de línea real.
- ✅ Borrar la línea `except` desnuda elimina el error y nada más — las reglas son funciones independientes.
- ✅ La elección `ast.walk` vs `NodeVisitor` es deliberada: `walk` para escaneos de una sola pasada de todo el árbol, un visitante cuando una regla necesita estado acumulado (como el diff de nombres).

**🤔 Pregunta(s) socrática(s)**

- Aumentar `LIMIT_FUNCTION_LINES` es una perilla de configuración dentro de la firma de la función. Si un proyecto quiere límites *por archivo*, ¿cuál es el cambio más pequeño (pista: un dict `config` pasado a `lint`) que mantiene pura cada regla? ¿Cuándo empieza a valer la pena "config" — 3 reglas o 30?
- Nuestro `ast.walk` para excepts desnudos escanea todo el árbol por un tipo de nodo. La regla de import sin usar *necesita* la recogida de dos pasadas del Paso 3. ¿Qué costaría una sesión de linting que tuviera que re-analizar el archivo por *cada regla* a 50 reglas — y cuál es la refactorización (analizar una vez, pasar el árbol a cada regla) que lo evita?

## Paso 5: Envía el CLI

Una biblioteca de linting que nadie puede ejecutar desde una terminal es una hoja de trabajo, no una herramienta. El Paso 5 envuelve `lint` en un comando real: `argparse` para la ruta, una impresión orientada a humanos, un conteo y — la obra maestra del CI — un código de salida no cero cuando hay algún hallazgo de `error` o peor, para que un script de build pueda *fallar* por el informe.

### 5.1 Escribe el punto de entrada con código de salida

```python
# linter.py
import argparse
import sys
from rules import lint, SEVERITY

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="lint a Python file with ast-based rules")
    parser.add_argument("path", help="path to the .py file to lint")
    parser.add_argument("--fail-on", choices=["error", "warning", "suggestion"],
                        default="error", help="minimum severity that sets a non-zero exit")
    args = parser.parse_args(argv)
    report = lint(args.path)
    for sev, line, msg in report:
        print(f"{args.path}:{line}: {sev}: {msg}")
    failures = [r for r in report if SEVERITY[r[0]] >= SEVERITY[args.fail_on]]
    print(f"{len(report)} finding(s), {len(failures)} at/above '{args.fail_on}'")
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
```

El contrato del código de salida es todo el paso: `main` *devuelve* un entero (0 limpio, 1 sucio) y la protección `sys.exit(main())` convierte el valor de retorno en el estado del proceso. `--fail-on` hace del umbral una decisión que posee el llamador — `linter.py sloppy.py` sale 1 por defecto (existe un error) mientras que `--fail-on suggestion` saldría 1 solo por el import sin usar, dándole al CI exactamente el interruptor que un proyecto necesita a medida que evolucionan sus estándares.

**👟 Pista inicial :** Ejecuta `uv run python linter.py sloppy.py` y comprueba inmediatamente `$?` (o imprime el valor de retorno) — el archivo *tiene* un error, así que el código de salida debe ser 1. Luego arregla el except desnudo en `sloppy.py` y vuelve a ejecutar para ver el código de salida caer a 0.

**🎯 Resultado esperado :** Cinco líneas en total — tres hallazgos, luego `3 finding(s), 1 at/above 'error'` — y el `$?` del shell (equivalentemente, el retorno de `main()`) es `1`. Después del arreglo del except: la salida se vuelve `0`.

**🩹 Si sale mal :** Si el código de salida es siempre 0 a pesar de los hallazgos, `sys.exit(main())` no es la última línea — el valor de retorno debe aterrizar en `sys.exit`, no en un print. Si `--fail-on suggestion` no voltea la salida, la comparación `>=` contra los pesos de severidad está invertida o los números de `SEVERITY` están revertidos — compruébalo imprimiendo `SEVERITY[args.fail_on]`.

### 5.2 Verifica el CLI

**✅ Lista de verificación**

- ✅ `uv run python linter.py sloppy.py` imprime hallazgos con `path:line: severity: message` y sale `1`.
- ✅ `--fail-on warning` y `--fail-on suggestion` amplían ambos el conjunto que falla; `--fail-on error` lo mantiene estrecho.
- ✅ Un archivo limpio (o un `sloppy.py` arreglado) sale `0` con `0 finding(s)`.
- ✅ Un archivo con *error de sintaxis* — si no se analiza, el `SyntaxError` del Paso 1 realmente se propaga como un crash ruidoso en lugar de un informe vacío silencioso; decides después si lo capturas e imprimes un mensaje más agradable.

**🤔 Pregunta(s) socrática(s)**

- El código de salida distingue "0 hallazgos" de "hallazgos por debajo de mi umbral" — ambos pueden devolver 0. Para un script de CI, ¿es ese el contrato que quieres, o preferirías códigos de salida 0/1/2 para distinguir limpio-de-advertencias y limpio-de-limpio? ¿Qué se rompe en el shell de cualquiera de las dos maneras?
- `--fail-on` alterna la *estrictez* en tiempo de ejecución. ¿Cuál es el argumento para mantener los umbrales en el código fuente del linter (config por proyecto) en su lugar — y cuál es el inconveniente concreto de la bandera cuando el linter corre en un pipeline de 30 jobs, cada uno con su propio umbral?

## ⚠️ Errores comunes

- **Omitir el caso de fallo de análisis.** El primer hallazgo en el linting real es "el archivo no se analiza" — el `SyntaxError` de `ast.parse` es un crash, y un linter que se bloquea con sintaxis mala es peor que uno que la informa. Decide pronto: captura `SyntaxError` e imprímelo como el hallazgo de mayor severidad (la elección honesta), o deja que se bloquee ruidosamente (tolerable mientras posees cada archivo de entrada).
- **Reglas basadas en nombres que tropiezan con `__all__` y re-exportaciones.** Un módulo que hace `from .utils import retry` *para re-exportarlo* tiene un nombre de apariencia usada solo dentro de `__all__` — el diff ingenuo lo marca sin usar y una base de código real se inunda de falsos positivos. La solución es permitir explícitamente los nombres listados en `__all__`, o documentar que tu linter cambia esa precisión por simplicidad.
- **Confundir `Store` y `Load`.** `unused = 42` *define* un nombre en un contexto `Store`; `print(the_name)` *lo lee* en un contexto `Load`. Una regla que cuenta cualquier `ast.Name` como un "uso" no puede distinguir "importado y leído" de "importado y sobrescrito" — comprueba `node.ctx` y decide por regla si ambos lados cuentan.
- **Re-analizar por regla.** Un `ast.parse` por regla está bien con 3 reglas y se siente cuadrático con 50. Como *cada* regla quiere el mismo árbol, analiza una vez y pasa el árbol (o cachealo por ruta) a cada regla independiente — la misma disciplina que la composición del informe del Paso 4.
- **Amnesia del código de salida.** Un linter que *imprime* hallazgos pero sale 0 es teatro en CI — el pipeline ve verde y fusiona el `except` desnudo. El código de salida es el producto; devolverlo desde `main()` y hacer `sys.exit` de él es el inseparable último 1% que hace importar al otro 99%.

## Lo que acabas de construir

Un linter de Python funcional: `ast.parse` dentro, un informe calificado con números de línea fuera, con tres reglas independientes — imports sin usar vía un diff de nombres, excepts desnudos vía escaneos de todo el árbol, funciones sobredimensionadas vía conteos de visitante — y un CLI cuyo código de salida puede realmente compuertar un build. Cada hallazgo es directamente trazable a un nodo del árbol, así que nada aquí es magia; puedes apuntar el mismo motor a una regla nueva de marca en diez minutos. La habilidad transferible es la programación de AST misma — recorrer un árbol de sentencias es el backend de linters, formateadores, transpiladores, herramientas de cobertura de tests y generadores de código, y el patrón "analiza una vez, recorre deliberadamente, hace diff de nombres" ahora vive en tus manos para cada uno de ellos.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/python-linter/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/python-linter) en el repositorio del curso agrupa los módulos de visitante, diff de nombres, reglas y CLI más `sloppy.py` y un notebook que ejecuta el motor paso a paso. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y haz lint del archivo incluido en una pestaña del navegador.
:::

## A dónde ir desde aquí

- **Añade una cuarta regla:** detecta código inalcanzable con análisis estilo `ast.After` — recorre buscando `return` seguido de más sentencias en el mismo cuerpo, la regla que atrapa la limpieza de `print` muerta antes de que se envíe.
- **Auto-arregla la fácil:** `--fix` que reescribe el archivo con las líneas de import sin usar eliminadas — ya conoces sus números de línea, y eliminar mientras *también* haces lint es el honesto paso de dos.
- **Multi-archivo con `--recursive`:** recorre un directorio con `pathlib.Path.rglob("*.py")` y fusiona el informe de cada archivo en un solo flujo, ordenado globalmente por severidad — el paso que lo hace un linter de proyecto real en lugar de un juguete de un solo archivo.
- **Haz lint de tu propio código:** apunta `linter.py` a `examples/` del repo del curso y mira qué dicen las reglas sobre una base de código madura — luego elige el hallazgo que arreglarías primero y haz un PR en tu propio fork con él.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso — una regla que atrapó un bug real en tu propio código, un linter que adoptaron tus compañeros? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo agregar el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
