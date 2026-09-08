---
title: "Analizador de Dependencias"
description: "Visualizar y auditar las dependencias de tu proyecto — encontrar vulnerabilidades, paquetes obsoletos y riesgos de licencia."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "re", "dependency-management", "file-scanning"]
prerequisites:
  - "Fundamentos de Python (conjuntos, rutas, regex)"
  - "Comodidad ejecutando archivos de Python desde una terminal"
learningObjectives:
  - "Analizar requirements.txt en registros de dependencia estructurados con tipos de especificación"
  - "Escanear un árbol de fuentes en busca de imports y clasificarlos en estándar vs terceros vs locales"
  - "Cruzarse declarado vs importado para encontrar dependencias no utilizadas"
  - "Verificar versiones declaradas contra una línea de base de advisory local"
  - "Empaquetar el pipeline como una CLI cuyo código de salida habilite una puerta de build"
---

# 🧩 Construir un Analizador de Dependencias

Un `requirements.txt` dice que un equipo *tiene la intención* de usar cinco paquetes. Los archivos que realmente se escribieron dicen qué paquetes se importan *de verdad*. La diferencia entre los dos es donde viven el desperdicio y el riesgo: los pins no utilizados inflan las instalaciones hasta hoy, y un `numpy==1.26.0` fijado puede quedarse dos releases menores detrás del mínimo de seguridad sin que nadie lo note hasta que un bot escanea el manifiesto. Este proyecto construye el pequeño analizador que cierra la brecha — analiza el manifiesto, escanea los imports y reporta en qué difieren los dos, todo con la biblioteca estándar.

Esto asume Python 101 más `pathlib` y `re` cómodos. No se requiere nada del módulo de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Analizar `requirements.txt` en registros `(name, spec)` y clasificar cada pin como fijo, con rango o sin fijar.
2. Escanear un árbol de fuentes `myapp/`, clasificar cada import como estándar, tercero o local.
3. Cruzar referencias de los dos: dependencias declaradas que nunca se importan.
4. Comparar versiones declaradas contra una línea de base de advisory local de versiones mínimas.
5. Llevarlo a CLI con códigos de salida (`0` = saludable, `1` = deps no utilizadas, `2` = violación de política) para que un build pueda actuar sin analizar texto.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — todo el trabajo de la herramienta es recorrer *tu* directorio, y un escáner de directorios funciona mejor como CLI local.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan para cada paso — el notebook en [`examples/dependency-analyzer/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ipynb) ejecuta el mismo analizador sobre un proyecto de muestra incluido. El trade-off honesto: los notebooks no pueden recorrer un repo arbitrario como sí puede una CLI local.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdependency-analyzer%2Fnotebook.ipynb)

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
uv init dependency-analyzer
cd dependency-analyzer
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `dependency-analyzer/` existe con un `pyproject.toml`.
- ✅ `python -c "import re, sys, pathlib"` se ejecuta — sin paquetes de terceros.

## Paso 1: Analizar `requirements.txt`

Todo comienza desde el manifiesto: una dependencia por línea, a veces fijada (`==2.31.0`), a veces con rango (`>=2.0`, `~=3.0`), a veces suelta (sin especificación). Analizar significa extraer `(name, spec)` y clasificar la especificación, porque "¿está viejo ese pin?" significa cosas diferentes para una versión bloqueada que para un rango abierto.

### 1.1 Escribir el analizador

**👟 Pista inicial :** Separa los comentarios inline y las líneas de opciones, toma el nombre del paquete antes del primer espacio en blanco, y clasifica la especificación con dos pequeñas regex:

```python
# parse_req.py
import re

def parse_requirements(path: str) -> list[dict]:
    deps: list[dict] = []
    with open(path) as f:
        for line in f:
            line = line.split("#", 1)[0].strip()
            if not line or line.startswith(("-", ".", "[")):
                continue
            m = re.match(r"^([A-Za-z0-9_.\-]+)\s*(.*)$", line)
            if not m:
                continue
            deps.append({"name": m.group(1).lower(), "spec": m.group(2).strip()})
    return deps

def classify_spec(spec: str) -> str:
    if re.fullmatch(r"==[\d.]+", spec):
        return "pinned"
    return "ranged" if spec else "unpinned"

if __name__ == "__main__":
    for d in parse_requirements("myapp/requirements.txt"):
        print(f"{d['name']:<12} {d['spec'] or '<any>':<16} {classify_spec(d['spec'])}")
```

`line.split("#", 1)[0]` elimina los comentarios inline (`requests==2.31.0  # prod`) antes que nada; la guardia `line.startswith(...)` omite líneas de maquinaria como `--index-url` y `.` (una dependencia de ruta local). La regex `classify_spec` es deliberadamente estricta sobre qué cuenta como pin: `==2.31.0` está bloqueado, mientras que `>=2.0` y `~=3.0` son rangos que derivan.

**🎯 Resultado esperado :**

```
requests     ==2.31.0         pinned
pandas       >=2.0            ranged
numpy        ==1.26.0         pinned
flask        ~=3.0            ranged
click        >=8.0            ranged
```

**🩹 Si sale mal :** Si los nombres salen capitalizados, falta el `.lower()` en `m.group(1)` — los nombres de paquete no distinguen mayúsculas en PyPI pero las rutas de archivo sí, así que normaliza a minúsculas por adelantado. Si `--index-url https://...` termina como "dependencia", la guardia `-` solo se dispara antes de que `.strip()` la rebanara — verifica el orden de las guardias: dividir → limpiar → saltar vacías → saltar líneas con aspecto de opción.

### 1.2 Verifica el analizador

**✅ Lista de verificación**

- ✅ Un comentario `#` en su propia línea y uno inline después de un pin se ignoran ambos.
- ✅ `package==1.2.3` estilo `pip freeze` y el PEP 440 `package>=1.2,<2` producen ambos pares `(name, spec)`.
- ✅ Las líneas que nunca aparecen en `requirements.txt` — en blanco, de opción, `-r other.txt` — se omiten sin fallar.

**🤔 Pregunta(s) socrática(s)**

- Fijo vs rango vs sin fijar es una clasificación de *un bit*. Un `~=3.0` (release compatible) y un `>=20,<21` (superior acotado) fijan diferente pero ambos dicen "ranged". ¿Qué necesitaría añadir un analizador de especificaciones más rico para distinguir "deriva acotada" de "deriva abierta" — y cuál de los dos debería tratar un escaneo de seguridad como más riesgoso?
- `-e .` (instalaciones locales editables) y `-r base.txt` (incluye otro archivo) comienzan ambos con `-` y se omiten. ¿Qué está mal en agruparlos bajo "opciones" — qué significan *en realidad* esos dos para el conjunto de dependencias?

## Paso 2: Escanear los imports

El manifiesto es un lado de la verdad; el código es el otro. Escanear significa recorrer cada `.py` bajo tu raíz de proyecto, sacar el nombre del módulo de cada `import x` / `from x import y`, y clasificar cada nombre como *estándar* (verificar contra `sys.stdlib_module_names`), *tuyo* (un prefijo de proyecto), o *tercero*. El tercer grupo es el que se compara contra el manifiesto.

### 2.1 Escribir el escáner

**👟 Pista inicial :** Una regex anclada a línea para sentencias de import, `Path.rglob("*.py")` para el recorrido, y `sys.stdlib_module_names` para la clasificación — todo estándar:

```python
# scan.py
import re
import sys
from pathlib import Path

IMPORT_RE = re.compile(r"^\s*(?:import|from)\s+([\w.]+)", re.M)
STDLIB = set(sys.stdlib_module_names)

def scan_directory(root: str) -> set[str]:
    imports: set[str] = set()
    for path in Path(root).rglob("*.py"):
        imports |= {m for m in IMPORT_RE.findall(path.read_text())}
    return {name.split(".")[0] for name in imports}

def classify(imports: set[str], project: str) -> tuple[set[str], set[str], set[str]]:
    stdl, third, local = set(), set(), set()
    for name in imports:
        if name in STDLIB:
            stdl.add(name)
        elif name == project or name.startswith(project + "."):
            local.add(name)
        else:
            third.add(name)
    return stdl, third, local

if __name__ == "__main__":
    Path("myapp").mkdir(exist_ok=True)
    Path("myapp/app.py").write_text(
        "import os\nimport sys\nimport requests\nimport pandas as pd\n"
        "from myapp.utils import normalize\n")
    Path("myapp/utils.py").write_text(
        "import datetime\nimport numpy as np\n"
        "def normalize(value):\n    return value\n")

    imports = scan_directory("myapp")
    stdl, third, local = classify(imports, project="myapp")
    print("stdlib:", sorted(stdl))
    print("third-party:", sorted(third))
    print("local:", sorted(local))
```

El escaneo normaliza `from pandas import DataFrame` y `import pandas as pd` al mismo nombre de nivel superior `pandas` — `name.split(".")[0]` corta también `myapp.utils` a `myapp`, así que cada import colapsa a la única palabra que declararía el manifiesto. `sys.stdlib_module_names` es todo el punto de esta generación de Python: un conjunto curado de nombres estándar, sin lista dura de mantener. Los dos archivos demo existen para que se *escaneen*, no para que se ejecuten — `app.py` usa `pandas` que no está instalado aquí, y eso es exactamente por qué no ejecutas el código que estás analizando.

**🎯 Resultado esperado :**

```
stdlib: ['datetime', 'os', 'sys']
third-party: ['numpy', 'pandas', 'requests']
local: ['myapp']
```

**🩹 Si sale mal :** Si `myapp` aparece en el grupo estándar, `sys.stdlib_module_names` no está presente (Python < 3.10) — entonces todo el conjunto `STDLIB` está vacío, así que todo cae a terceros; ejecuta en 3.10+. Si se pierden imports en medio de un archivo, `IMPORT_RE` usa `^` *con* el flag `re.M` — quita el `re.M` y solo coinciden los imports que *empiezan* línea, lo que omite silenciosamente los imports indentados dentro de funciones (Python válido, y la regex no puede diferenciarlos).

### 2.2 Verifica el escaneo

**✅ Lista de verificación**

- ✅ Los nombres de biblioteca estándar (`os`, `sys`, `datetime`) caen en estándar, no en terceros — la clasificación usa `sys.stdlib_module_names`, no una conjetura de máquina de escribir.
- ✅ `import pandas as pd`, `from myapp.utils import normalize` e `import requests` colapsan todos a `pandas`/`myapp`/`requests`.
- ✅ Un directorio sin archivos `.py` produce un conjunto de imports vacío, no un fallo.

**🤔 Pregunta(s) socrática(s)**

- El escáner está basado en texto: lee *tokens* de `import`, no código. Se atraparía `import numpy as np  # in a comment`, y también `if False: import numpy`. ¿Qué añade un escáner basado en AST (el módulo `ast`) sobre la regex — y qué sigue *sin* saber que un perfil de ejecución (`import foo` y luego `foo()` en tiempo de ejecución) sabría?
- Los imports relativos (`from . import x`, `from ..y import z`) desaparecen silenciosamente de este escáner. ¿Por qué `.` falla la regex anclada a `\w` — y es perder un import relativo un fallo *seguro* para un informe de "dependencia no utilizada" o un fallo *peligroso*?

## Paso 3: Encontrar dependencias no utilizadas

Ahora la recompensa de tener ambos lados: **declarado** (de `requirements.txt`) menos **importado** (lo que el código realmente trae). Cualquier cosa declarada-pero-no-importada es peso muerto que cortar o una señal de que el escaneo se pierde algo — ambos merecen que un humano mire. La verificación es una diferencia de conjuntos; la honestidad está en admitir que la diferencia de conjuntos es tan buena como el escáner.

### 3.1 Escribir `find_unused`

**👟 Pista inicial :** Una función, una resta de conjuntos, una lista ordenada de salida — el valor no es la aritmética, es que *tienes* dos conjuntos confiables que restar:

```python
# unused.py
def find_unused(declared: set[str], imported: set[str]) -> list[str]:
    return sorted(declared - imported)
```

### 3.2 Ejecútalo en el proyecto

```python
# step3.py
from parse_req import parse_requirements
from scan import scan_directory
from unused import find_unused

declared = {d["name"] for d in parse_requirements("myapp/requirements.txt")}
imported = scan_directory("myapp")
for name in find_unused(declared, imported):
    print(f"unused: {name}")
```

Tres paquetes importados (`requests`, `pandas`, `numpy`) coinciden con tres declarados; `flask` y `click` están declarados pero nunca se importan. La dirección inversa — *importado pero no declarado* — es igual de jugosa y un cambio de una línea (`imported - declared`), pero es un bug diferente: tu código no se instalará en un entorno nuevo en absoluto. El alcance decidido aquí es "declarado pero no utilizado", porque es la rama sobre la que puedes actuar de inmediato (borrar las líneas) y porque el trabajo del entorno nuevo suele ser de una herramienta separada.

**🎯 Resultado esperado :**

```
unused: click
unused: flask
```

**🩹 Si sale mal :** Si pandas aparece como no utilizado, el clasificador lo envió al grupo *local* (¿coincidió el prefijo de proyecto con `pandas.`?) — entonces nunca cae en `imported` para la resta. Verifica el orden del `elif` en `classify`. Si *todo* es no utilizado, `scan_directory` recorrió la raíz equivocada — la demo escanea `myapp/`, así que confirma que la ruta de `requirements.txt` y el `--dir` son el mismo árbol.

### 3.3 Verifica la lista de no utilizados

**✅ Lista de verificación**

- ✅ El conjunto declarado es `{requests, pandas, numpy, flask, click}`; el conjunto importado es `{os, sys, datetime, requests, pandas, numpy, myapp}`; la diferencia es exactamente `{click, flask}`.
- ✅ La salida no utilizada está alfabetizada (ordenada), para que las pruebas puedan depender del orden.
- ✅ Eliminar `flask~=3.0` y `click>=8.0` de `requirements.txt` vacía la lista de no utilizados — la herramienta encuentra pins muertos, no los imagina.

**🤔 Pregunta(s) socrática(s)**

- Colisión de nombre regional: declaras `requests` (el paquete de PyPI) pero *también* tienes un módulo local `requests/` — la resta de conjuntos ve una dependencia usada y se queda callada. ¿Qué tiene que añadir una herramienta (escenario: verificar *cómo* se importa un nombre, p. ej., `from requests import Session` vs `import requests.utils` eligiendo un archivo local) antes de poder llamar a esa columna "usado verificado"?
- `click` y `flask` están "no utilizados" según el escaneo, pero `flask` a menudo carga otro plugin declarado por *punto de entrada*, no por import. ¿Qué dice eso sobre un analizador que solo ve líneas `import` — es "no utilizado" un veredicto o una alerta?

## Paso 4: Verificar versiones contra la línea de base de advisory

No utilizado es desperdicio; *fuera de política* es riesgo. Este paso compara cada especificación declarada contra un registro de advisory local — un dict de versiones mínimas aceptables. Representa la fontanería del mundo real (`pip-audit`, OSV, metadatos de PyPI), que necesita llamadas de red; misma forma, honesta sobre la sustitución. Un `==1.26.0` fijado por debajo del piso `>=1.30` recibe la línea roja.

### 4.1 Escribir el verificador de versiones

**👟 Pista inicial :** Extrae una versión numérica de cada lado de la especificación con una regex laxa, compara como tuplas de enteros, y describe el resultado por dependencia:

```python
# health.py
import re

ADVISORY = {
    "requests": ">=2.28",
    "numpy": ">=1.30",
    "flask": ">=2.2",
    "pandas": ">=1.5",
}

def version_tuple(spec_part: str) -> tuple[int, ...]:
    m = re.search(r"\d+(?:\.\d+)*", spec_part)
    return tuple(int(p) for p in m.group(0).split(".")) if m else (0,)

def check_advisories(name: str, spec: str) -> str:
    rule = ADVISORY.get(name)
    if not rule:
        return "not in advisory registry"
    mine = version_tuple(spec) if spec else (0,)
    minimum = version_tuple(rule)
    state = "ok" if mine >= minimum else "BELOW ADVISORY MINIMUM"
    have = ".".join(map(str, mine))
    return f"{state} (have {have}, min {'.'.join(map(str, minimum))})"
```

```python
# step4.py
from parse_req import parse_requirements
from health import check_advisories

for d in sorted(parse_requirements("myapp/requirements.txt"), key=lambda d: d["name"]):
    print(f"{d['name']:<12} {d['spec'] or '<any>':<16} {check_advisories(d['name'], d['spec'])}")
```

`version_tuple` es toda la comparación en ocho líneas: toma la primera corrida `major.minor(.patch)` de cualquier string de especificación, así que `==2.31.0`, `~=3.0` y `>=2.28` se vuelven todos tuplas de enteros comparables. La comparación de tuplas de enteros es el ordenamiento de versiones integrado de Python: `(2, 31, 0) >= (2, 28)` es `True`, `(1, 26, 0) >= (1, 30)` es `False` — sin trampas de ordenamiento de strings. Una dep declarada *sin fijar* (`click` sin especificación) obtiene `(0, ...)` — tratada como "podría ser cualquier cosa", así que la letra del registro decide.

**🎯 Resultado esperado :**

```
click        >=8.0            not in advisory registry
flask        ~=3.0            ok (have 3.0, min 2.2)
numpy        ==1.26.0         BELOW ADVISORY MINIMUM (have 1.26.0, min 1.30)
pandas       >=2.0            ok (have 2.0, min 1.5)
requests     ==2.31.0         ok (have 2.31.0, min 2.28)
```

**🩹 Si sale mal :** Si `version_tuple("~=3.0")` devuelve `(0,)`, la regex busca dígitos *anclados* (`^\d+`) en lugar de una búsqueda — el `~` precede al `3`. Si `click` muestra `ok` en lugar de `not in advisory registry`, `ADVISORY.get(name)` está dando default, lo que significa que una clave estilo `numpy` no es `click` — las claves de string son exactas; los misses del registro son el resultado *diseñado*, no un respaldo.

### 4.2 Verifica la verificación de advisory

**✅ Lista de verificación**

- ✅ Un paquete por debajo de su mínimo (`numpy`) se marca; uno en/por encima (`requests`, `flask`, `pandas`) es "ok".
- ✅ Un paquete sin entrada de registro (`click`) se reporta como no revisado, no silenciosamente ausente.
- ✅ Sin trucos de strings `--no ad`: `~=3.1` y `>=3.1` comparan igual como tuplas, y `2.28` ≠ `2.28.1` — la longitud de la tupla es parte del ordenamiento.

**🤔 Pregunta(s) socrática(s)**

- `version_tuple("~=3.0")` devuelve `(3, 0)` y lo compara como *al menos* 3.0. En PEP 440, `~=3.0` realmente significa `>=3.0, <4` — "release compatible". ¿Qué hace que tu analizador afirme ignorar el límite superior que en realidad no puede prometer?
- El registro es un dict local. En un proyecto real vendría de un feed consultable (JSON de PyPI, OSV). ¿Qué cambia sobre la *forma* de la comparación cuando la fuente de verdad es una API en vivo — y qué empieza a fallar cuando no hay red en CI?

## Paso 5: La CLI y el código de salida

El trabajo del analizador está terminado cuando un script de build puede tratar la respuesta como un *veredicto*, no un volcado de texto. La CLI toma `--dir`, compone analizar → escanear → no utilizadas → advisory, imprime tres líneas de resumen, y devuelve `0` (saludable), `1` (deps no utilizadas) o `2` (violación de advisory) — para que CI pueda fallar en `$?` sin leer tu informe en absoluto.

### 5.1 Escribir `analyze.py`

**👟 Pista inicial :** `argparse` para `--dir`, reutiliza cada función de los pasos anteriores, y establece `sys.exit` desde los dos cubos de fallo:

```python
# analyze.py
import argparse
import sys
from pathlib import Path

from health import check_advisories
from parse_req import parse_requirements
from scan import scan_directory
from unused import find_unused

def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze a project's Python dependencies.")
    parser.add_argument("--dir", default=".")
    args = parser.parse_args()

    root = Path(args.dir)
    req = parse_requirements(root / "requirements.txt")
    imported = scan_directory(str(root))
    declared = {d["name"] for d in req}

    unused = find_unused(declared, imported)
    policy_budget = 0
    warnings = []
    for d in sorted(req, key=lambda d: d["name"]):
        report = check_advisories(d["name"], d["spec"])
        if "BELOW" in report:
            policy_budget = 2
            warnings.append(f"{d['name']} {d['spec']}: {report}")

    print(f"declared: {len(req)}  used: {len(declared & imported)}  unused: {len(unused)}")
    for name in unused:
        print(f"unused: {name}")
    for w in warnings:
        print(f"advisory: {w}")
    print("result:", "FAIL" if (unused or policy_budget) else "OK")
    sys.exit(1 if unused else policy_budget)

if __name__ == "__main__":
    main()
```

```bash
uv run python analyze.py --dir myapp
```

La política de código de salida es una *elección*, escrita donde un revisor pueda verla: no utilizado gana (`1`) sobre advisory (`2`); limpio gana (`0`). Componer todo el pipeline desde funciones que posees significa que un futuro ajuste de "bloquear en no utilizado" es un cambio de una línea en `.py`, no una reescritura.

**🎯 Resultado esperado :**

```
declared: 5  used: 3  unused: 2
unused: click
unused: flask
advisory: numpy ==1.26.0: BELOW ADVISORY MINIMUM (have 1.26.0, min 1.30)
result: FAIL
```

Re-ejecuta el comando de la terminal y `echo $?` imprime `1`.

**🩹 Si sale mal :** Si `FileNotFoundError` se dispara para `requirements.txt`, `--dir` apunta a un directorio que no contiene uno — la CLI espera tu manifiesto *dentro* de la raíz escaneada, coincidiendo con lo que verifica el analizador. Si `exit code: 0` se imprime a pesar de paquetes no utilizados, falta `sys.exit(1 if unused else policy_budget)` — la línea `print("result: ...")` es verdadera, pero el código de salida es el contrato.

### 5.2 Verifica la CLI

**✅ Lista de verificación**

- ✅ `uv run python --dir myapp` imprime el resumen de arriba y `echo $?` es `1`.
- ✅ Eliminar `click`/`flask` de `requirements.txt` convierte la corrida en `result: OK`, salida `0`.
- ✅ Subir el pin de `numpy` a `==1.30.0` limpia el advisory *y* mantiene `unused` en cero — el código de salida deriva de datos y lee los mismos archivos que hojeas.

**🤔 Pregunta(s) socrática(s)**

- Los códigos de salida 1 y 2 colapsan cuando ambas condiciones se cumplen (el resuelto `1` gana). Si un build quiere distinguir "código muerto, bloquea" de "release de seguridad pendiente, advierte", los códigos necesitan componerse (p. ej., 1 = no utilizado, 2 = advisory, 3 = ambos). ¿Qué cambia en `sys.exit(...)` para hacer de 3 = ambos una línea — y a CI le importa?
- `declared & imported` cuenta un paquete usado *una vez* como usado; no hay señal de intensidad de "importado once veces en nueve archivos". ¿Qué añadiría una dimensión de *frecuencia* al ordenamiento del informe — y quién es el lector del informe que realmente la usaría?

## ⚠️ Errores comunes

- **Coincidencia de import por subcadena.** Coincidir `import os` contra `os.path` u `osx-tools` necesita límites de palabra — la regex de tokens `([\w.]+)` justo después de `import|from` ya te da el nombre de nivel superior, así que no hagas pruebas `in` con nombres de módulo.
- **Confiar en un solo lado.** Declarado-sin-importado = no utilizado; importado-sin-declarado = installs nuevos rotos. Un analizador que solo responde una dirección escribe un medio informe. (Invierte la resta y el segundo bug es gratis.)
- **Ruido del manifiesto.** Las líneas `--index-url`, `-r`, `.`, `#comment` no son dependencias. Un analizador que acuña una "dependencia" llamada `--index-url` corrompe cada número posterior a ella.
- **Las tuplas de versión no son strings.** `"9.0" < "10.0"` es `False` léxicamente pero `(9,0) < (10,0)` es `True` numéricamente — compara siempre vía tuplas de enteros en este proyecto.
- **Tragar prefijos de especificación.** Que `version_tuple` tome `29` de `>=29,<30` pierde el tope `<30` y el hueco del mapeo de nombres (`python-dateutil` se importa como `dateutil`) significa que un analizador "inofensivo" bendice silenciosamente un paquete realmente usado como no utilizado. El informe lee como un escaneo, juzga como un humano.

## Lo que acabas de construir

Un analizador de dependencias sin dependencias propias: analizador de manifiesto, escáner de imports, diferenciador de conjuntos, verificador de versiones de advisory y una puerta de código de salida — cinco archivos, un verbo de CLI, y un informe que tres líneas resumen. La lección transferible es la *triangulación*: un manifiesto y un escaneo de código cuentan cada uno una historia parcial, y el valor de la herramienta está precisamente en los lugares donde los dos discrepan — pins no utilizados que recortar, versiones fuera de política que subir y (con la resta invertida) dependencias que olvidaste declarar por completo.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/dependency-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/dependency-analyzer) en el repositorio del curso tiene los scripts completos, el proyecto de muestra `myapp/` y un registro de advisory de muestra. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Escanea la **dirección inversa** (`imported - declared`) como una segunda columna de informe: "declarado en ningún lado pero importado en todas partes = installs nuevos crash"-fidedigno — buscador de bugs gratis ahora que la maquinaria existe.
- Publica el **resumen como JSON** (`--json`), para que un dashboard o un bot de PR puedan renderizar veredictos sin re-analizar tu informe humano.
- Añade un **escáner basado en `ast`** como segunda fuente de imports, y marca los paquetes donde la regex y los escáneres AST discrepan — triaje de dónde viven los imports sospechosos.
- Cierra el **hueco del mapeo de nombres** con un dict de alias (`python-dateutil` → `dateutil`, `beautifulsoup4` → `bs4`) para que la diferencia de conjuntos deje de disparar en falso sobre la mitad de los nombres de PyPI.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓