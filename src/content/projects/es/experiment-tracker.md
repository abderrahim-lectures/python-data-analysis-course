---
title: "Rastreador de Experimentos"
description: "Rastrea experimentos de ML con métricas, parámetros, artefactos y paneles de comparación."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["cli", "json", "dataclasses", "logging"]
prerequisites:
  - "Fundamentos de Python (listas, diccionarios, funciones, clases)"
  - "Comodidad con archivos y ejecución de scripts en la terminal"
learningObjectives:
  - "Modelar una ejecución de experimento como un dataclass"
  - "Anexar ejecuciones a un registro JSONL con una protección contra IDs duplicados"
  - "Clasificar ejecuciones y elegir la mejor por métrica con una tabla de dirección"
  - "Registrar archivos de artefactos con resúmenes SHA-256"
  - "Controlar add / list / best desde una interfaz de línea de comandos pequeña"
---

# 🧪 Rastreador de Experimentos

"¿Qué modelo ganó?" es la pregunta recurrente de cualquier proyecto que entrena modelos — y un `results.txt` simple no puede responderla: el mismo nombre de ejecución, reejecutado dos veces, columnas editadas, y la respuesta se desvía según lo que alguien escribió al final. Este proyecto construye la alternativa honesta: un registro `runs.jsonl` donde cada ejecución es un dataclass (modelo, métrica, valor, ruta del artefacto), los IDs duplicados son rechazados en la puerta, la mejor ejecución por métrica viene de una tabla de dirección ("un rmse menor es mejor, una precisión mayor es mejor"), los artefactos obtienen una huella SHA-256 que puedes verificar más tarde, y una CLI de cinco comandos (`add`, `list`, `best`) hace que todo se sienta como una herramienta real. Todo es de la biblioteca estándar y basado en archivos — sin base de datos, sin biblioteca de ML requerida.

Esto asume Python 101 — listas, dicts, funciones — más dataclasses (`from dataclasses import dataclass`) y manejo cómodo de archivos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Definir un dataclass `Run` y ver un registro real.
2. Anexar ejecuciones a JSONL con una protección contra IDs duplicados que bloquea el re-registro.
3. Reportar todas las ejecuciones y elegir la mejor para una métrica usando una tabla de dirección.
4. Hashear un archivo de artefacto con SHA-256 y copiarlo al almacén.
5. Conectarlo todo en una CLI y registrar una competencia de tres modelos.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — un registro de experimentos es una herramienta de archivos (un archivo entra, `runs.jsonl` sale), y los archivos pertenecen a tu terminal.

**GitHub Codespaces** es una alternativa de configuración cero: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder funcionan** — el notebook en [`examples/experiment-tracker/notebook.es.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.es.ipynb) ejecuta el rastreador sobre registros estilo `runs.jsonl` en memoria con la misma forma.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fexperiment-tracker%2Fnotebook.es.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza "instala Python, luego pip, luego una herramienta de entorno virtual" — y este proyecto es puramente de la biblioteca estándar.

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
uv init experiment-tracker
cd experiment-tracker
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `experiment-tracker/` existe con un `pyproject.toml`.
- ✅ `python -c "import json, hashlib, shutil"` tiene éxito — stdlib, nada que instalar.

## Paso 1: Modela una ejecución como un dataclass

El vocabulario del rastreador es un registro: una **ejecución** — un modelo + un conjunto de datos + una puntuación. Guardarla como un dict simple funciona, pero un `@dataclass` te da los campos como *atributos tipados*: `run.model` en lugar de `run["model"]`, una lista requerida en la clase, y `repr` gratuito para imprimir. El campo `sha256` tiene por defecto `""` para que una ejecución pueda crearse antes de que tenga un resumen de artefacto real.

### 1.1 Define el registro Run

**👟 Pista inicial :** `@dataclass` sobre una clase de campos; `asdict(run)` después la entregará a `json.dumps`:

```python
# tracker.py
import json
from dataclasses import asdict, dataclass
from pathlib import Path

LOG_FILE = "runs.jsonl"

@dataclass
class Run:
    run_id: str
    model: str
    metric: str
    value: float
    artifact: str
    sha256: str = ""

if __name__ == "__main__":
    run = Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib")
    print(run)
    print(run.model, run.value)
```

Ejecútalo:

```bash
uv run tracker.py
```

El dataclass hace un trabajo estructural silencioso: `value: float` significa que una ejecución que lleva `value="3.42"` (cadena) está mal tipada en la creación, `sha256: str = ""` documenta un estado deliberado de "aún no hasheado", y `print(run)` renderiza todo el registro de una manera que un dict simple imprime indirectamente. Construir el vocabulario como un tipo — no como un comentario — significa que cada función posterior (`log_run`, `best_run`) nombra sus expectativas en la firma.

**🎯 Resultado esperado :**

```
Run(run_id='run_001', model='ridge', metric='rmse', value=3.42, artifact='artifacts/run_001.joblib', sha256='')
ridge 3.42
```

**🩹 Si sale mal :** Si `print(run)` lanza un error de orden posicional, los campos del dataclass se declararon en un orden distinto al de la llamada al constructor — la posición importa sin argumentos de palabra clave. Si `run.model` da `AttributeError`, la clase no fue decorada en realidad (falta la línea `@dataclass` sobre `class Run`).

### 1.2 Verifica la forma del registro

**✅ Lista de verificación**

- ✅ `run.run_id`, `run.model`, `run.metric`, `run.value`, `run.artifact` acceden todos limpiamente.
- ✅ `run.sha256 == ""` por defecto — el centinela "no registrado" funciona.
- ✅ `asdict(run)` devuelve un dict simple con los seis campos, listo para JSON.

**🤔 Pregunta(s) socrática(s)**

- Son seis atributos hoy. ¿Qué haría un *séptimo* campo — `timestamp`, `params` como dict anidado — a este dataclass, y por qué JSONL sobrevive al cambio mientras un CSV de columnas fijas no lo haría?
- `value: float` fuerza un número, pero no qué métrica es — `metric` es un campo hermano, no un tipo. ¿Dónde está la línea donde una *clase por métrica* (RmsRun, AccuracyRun) se vuelve mejor que un campo genérico, y qué se rompe cuando la cruzas (add, compare)?

## Paso 2: Registra ejecuciones en JSONL con una protección contra duplicados

Un registro que acepta la misma ejecución dos veces es un registro que miente — "run_001 ridge" luego dice "run_001 ridge, ¡mejor!" dos veces y todos confían en un conteo duplicado. JSONL (JSON por línea) es el formato amigable para anexar: `log_run` lee el registro existente, determina si `run_id` ya existe, y **lanza** una excepción si es así. Anexar una línea es atómico a nivel de archivo y sobrevive a `Ctrl+C`.

### 2.1 Escribe el registrador y prueba la protección

**👟 Pista inicial :** `load_runs` lee cada línea existente; `log_run` verifica duplicados *antes* de anexar con `"a"` (modo append):

```python
# tracker.py
import json
from dataclasses import asdict, dataclass
from pathlib import Path

LOG_FILE = "runs.jsonl"

@dataclass
class Run:
    run_id: str
    model: str
    metric: str
    value: float
    artifact: str
    sha256: str = ""

def load_runs(path: str = LOG_FILE) -> list[Run]:
    if not Path(path).exists():
        return []
    return [Run(**json.loads(line)) for line in
            Path(path).read_text().splitlines() if line.strip()]

def log_run(run: Run, path: str = LOG_FILE) -> None:
    if any(r.run_id == run.run_id for r in load_runs(path)):
        raise ValueError(f"duplicate run_id: {run.run_id}")
    with open(path, "a") as f:
        f.write(json.dumps(asdict(run)) + "\n")

if __name__ == "__main__":
    log_run(Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib"))
    log_run(Run("run_002", "lasso", "rmse", 4.05, "artifacts/run_002.joblib"))
    print(Path("runs.jsonl").read_text())
    try:
        log_run(Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib"))
    except ValueError as e:
        print("duplicate blocked:", e)
    print("loaded runs:", [r.run_id for r in load_runs()])
```

`load_runs` devuelve `[]` para un archivo que no existe — un directorio de experimentos *sin* registro aún es legítimo, no un error. `Run(**json.loads(line))` desempaqueta cada objeto JSON directo en el dataclass, así que serializar/deserializar son cada uno una línea en direcciones opuestas. La protección lee el registro *completo* primero — O(n) por anexo, correcto para cientos de ejecuciones a escala de notebook — y `any(...)` corta-circuita en la primera coincidencia de `run_001`. El `try/except` en la demo es deliberado: la negativa es *audible* (`duplicate blocked:`), nunca una sobrescritura silenciosa ni una fila duplicada.

**🎯 Resultado esperado :**

```
{"run_id": "run_001", "model": "ridge", "metric": "rmse", "value": 3.42, "artifact": "artifacts/run_001.joblib", "sha256": ""}
{"run_id": "run_002", "model": "lasso", "metric": "rmse", "value": 4.05, "artifact": "artifacts/run_002.joblib", "sha256": ""}

duplicate blocked: duplicate run_id: run_001
loaded runs: ['run_001', 'run_002']
```

**🩹 Si sale mal :** Si el segundo `log_run("run_001")` anexa en lugar de lanzar, el `if any(...)` lanza solo para una coincidencia *exacta* — verifica que `r.run_id == run.run_id` es la comparación y que `load_runs(path)` recibe el mismo `path`. Si `Run(**json.loads(line))` lanza un error de tipo, alguna línea no es un objeto JSON (una línea en blanco suelta la maneja `if line.strip()`, pero un `{"run_id"` truncado por un crash no — borra esa línea a mano).

### 2.2 Verifica el registrador

**✅ Lista de verificación**

- ✅ La primera ejecución de `tracker.py` crea `runs.jsonl` con 2 líneas; ejecutarla de nuevo se bloquea, no se duplica.
- ✅ `loaded runs: ['run_001', 'run_002']` — la deserialización hace un round-trip limpio.
- ✅ `LOG_FILE` es una constante a nivel de módulo — cambiar el nombre del archivo es una edición, usada en todas partes.

**🤔 Pregunta(s) socrática(s)**

- La protección es O(n) — lee todo el registro por anexo. ¿En qué conteo de ejecuciones se vuelve lo bastante lento como para importar, y cuál es la mejora de dos líneas (`run.ids in {r.run_id for r in load_runs()}` — mismo costo, historia distinta) frente a un archivo hash por adelantado?
- `log_run` *lanza* en duplicados. Nombra un flujo de trabajo donde lanzar sea la negativa correcta (una protección de reproducción) y uno donde un ID duplicado deba *reemplazar* la línea vieja (una reejecución con `value` nuevo) — y qué necesita el segundo que `add` no tiene.

## Paso 3: Reporta ejecuciones y elige la mejor

Ahora el rastreador responde su pregunta central. `report` imprime cada ejecución; `best_run` toma una métrica y devuelve la ganadora — pero "mejor" necesita una *dirección*: rmse es menor-mejor, accuracy es mayor-mejor. Una tabla `BEST_DIRECTION` convierte ese juicio en datos, así que `min` vs `max` sale de una sola búsqueda en lugar de redecidirse en cada sitio de llamada.

### 3.1 Escribe la clasificación

**👟 Pista inicial :** Filtra primero por la métrica, luego `min(...) if direction == "min" else max(...)` — misma forma, una perilla:

```python
# rank.py
from tracker import Run, load_runs

BEST_DIRECTION = {"rmse": "min", "mae": "min", "accuracy": "max"}

def report(runs: list[Run]) -> None:
    for r in runs:
        print(f"  {r.run_id}  {r.model:<18} {r.metric}={r.value:.2f}")

def best_run(runs: list[Run], metric: str) -> Run | None:
    candidates = [r for r in runs if r.metric == metric]
    if not candidates:
        return None
    is_min = BEST_DIRECTION[metric] == "min"
    return (min if is_min else max)(candidates, key=lambda r: r.value)

if __name__ == "__main__":
    runs = load_runs()
    report(runs)
    best = best_run(runs, "rmse")
    print("best:", best.run_id, best.model, best.value)
```

`best_run` hace dos trabajos independientes en orden: **filtrar** a las ejecuciones de la métrica (para que una ejecución de `accuracy` nunca compita con una de `rmse`), luego **seleccionar** con la tabla de dirección. El `| None` en el tipo de retorno declara el caso vacío deliberadamente correcto — una métrica con cero ejecuciones devuelve `None`, nunca un crash de `max([])`. `report` es solo de visualización: mismos registros, sin mutación, sin re-clasificación.

**🎯 Resultado esperado :**

```
  run_001  ridge              rmse=3.42
  run_002  lasso              rmse=4.05
best: run_001 ridge 3.42
```

**🩹 Si sale mal :** Si "best" selecciona `run_002` (la mayor), `is_min` está invertido — `BEST_DIRECTION[metric] == "max"` seleccionaría la mayor para rmse. Si se estrella en una métrica vacía, falta la protección `if not candidates: return None` debajo del filtro.

### 3.2 Verifica la clasificación

**✅ Lista de verificación**

- ✅ `best_run(load_runs(), "rmse")` devuelve run_001 (3.42 < 4.05).
- ✅ `report` imprime ambas ejecuciones con `metric=value` alineado a 2 decimales.
- ✅ Agregar `Run("x", "...", "accuracy", 0.9, ...)` hace que `best_run(..., "accuracy")` elija la *mayor* — dirección respetada.

**🤔 Pregunta(s) socrática(s)**

- "Mejor" depende de la métrica *y* la dirección — una tabla que quien llama podría olvidar (`BEST_DIRECTION[metric]` KeyError para una métrica no rastreada). ¿Qué *le enseña al operador* un `KeyError` aquí frente a un `min` incorrecto silencioso, y dónde debería aparecer el caso de métrica desconocida (validación en tiempo de `add`)?
- Los empates son silenciosos: dos ejecuciones con el mismo `value` devuelven la que venga primero en el registro. Si el desempate debiera ser *la ejecución más nueva*, ¿qué campo necesita el registro y en qué se convierte la expresión del filtro?

## Paso 4: Hashea y registra artefactos

Las puntuaciones mienten por sí solas. "rmse 3.42" no significa nada si mañana el registro dice el mismo número para un *pickle* distinto. La solución es una **huella digital**: `sha256_of` hashea el archivo de artefacto en un resumen de 64 hex, almacenado *en el registro de la ejecución*. Después, re-hashear `artifacts/run_002.joblib` y compararlo contra el resumen registrado te dice al instante si el artefacto fue tocado desde el registro.

### 4.1 Hashea un artefacto candidato

**👟 Pista inicial :** `hashlib.sha256(Path(path).read_bytes()).hexdigest()` — contenido dentro, 64 caracteres hex fuera:

```python
# artifacts.py
import hashlib
import shutil
from pathlib import Path

def sha256_of(path: str) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

if __name__ == "__main__":
    src = "candidates/ridge.joblib"
    print("sha256 of artifact:", sha256_of(src))
    shutil.copy(src, "artifacts/run_candidate.joblib")
    print("copied:", Path("artifacts/run_candidate.joblib").exists())
    print("same digest after copy:",
          sha256_of(src) == sha256_of("artifacts/run_candidate.joblib"))
```

`read_bytes()` lee todo el archivo a bytes — bien para un modelo serializado, el instinto correcto para verificar integridad. Hashear después del `shutil.copy` prueba una propiedad que vale la pena conocer: **la copia preserva el contenido**, así que el resumen es estable a través del límite del almacén. La cadena hex de 64 caracteres es la firma del *contenido* del archivo: cambia un byte del pickle y el resumen cambia más allá del reconocimiento (avalancha), y — en la práctica — resúmenes que coinciden significan archivos idénticos byte a byte.

**🎯 Resultado esperado :**

```
sha256 of artifact: ff863fe836434899105f08c56435c6bd35561416798f30465ccd22653e9ec950
copied: True
same digest after copy: True
```

**🩹 Si sale mal :** Si el resumen imprime menos de 64 caracteres, `hexdigest()` se cambió por una vista truncada (`digest()[:16]`) en algún lugar. Si `copied: False`, `artifacts/` no existía antes de la copia — `Path("artifacts").mkdir(exist_ok=True)` va antes de `shutil.copy`, o la copia falla por un directorio faltante.

### 4.2 Verifica el hasheo

**✅ Lista de verificación**

- ✅ `ff863fe8...e9ec950` — el resumen *no* es aleatorio: es el SHA-256 de esa cadena de bytes exacta, reproducible entre máquinas.
- ✅ El resumen de la copia coincide con el de la fuente — dos rutas, un contenido.
- ✅ Editar un byte del artefacto cambia el resumen por completo — la verificación "¿fue tocado?" funciona.

**🤔 Pregunta(s) socrática(s)**

- El resumen vive *junto* al artefacto (en el registro). Un atacante que puede editar `run_002.joblib` también puede editar `runs.jsonl` — cadenas de hash en la misma carpeta son "teatro de evidencia". ¿Cuál es la mejora de un paso (hash almacenado en un archivo `.sha256` separado que no regeneras) y su debilidad residual?
- Hashear lee todo el archivo. Para un archivo de pesos de 4 GB eso es una lectura completa de disco por registro — aceptable una vez. ¿Dónde está la línea donde el hasheo incremental por fragmentos (leer en fragmentos de 1 MB) supera al `read_bytes()` de un solo golpe?

## Paso 5: Conéctalo en una CLI

El paso final une todo en una herramienta que de verdad puedes ejecutar: `add RIDGE RMSE 3.42 candidates/ridge.joblib` registra una ejecución (copia el artefacto, calcula su resumen), `list` imprime la tabla, `best rmse` corona al ganador. El segmento final del pipeline — pocos argumentos, la lectura del registro, la tabla de dirección — vive en `cli.py`, importando el rastreador y reutilizando todo lo construido arriba.

### 5.1 Escribe la CLI

**👟 Pista inicial :** `sys.argv[1:]` separa el nombre del programa; cada rama de `cmd` es una operación:

```python
# cli.py
import hashlib
import shutil
import sys
from pathlib import Path

from tracker import Run, load_runs, log_run

ART_DIR = "artifacts"
BEST = {"rmse": "min", "mae": "min", "accuracy": "max"}

def digest(path: str) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def register(model: str, metric: str, value: float, src: str) -> Run:
    run_id = f"run_{len(load_runs()) + 1:03d}"
    Path(ART_DIR).mkdir(exist_ok=True)
    dest = f"{ART_DIR}/{run_id}.joblib"
    shutil.copy(src, dest)
    run = Run(run_id, model, metric, value, dest, digest(dest))
    log_run(run)
    return run

if __name__ == "__main__":
    cmd, *args = sys.argv[1:]
    if cmd == "add":
        run = register(args[0], args[1], float(args[2]), args[3])
        print(f"registered {run.run_id} ({run.model}) sha256={run.sha256[:16]}...")
    elif cmd == "list":
        for r in load_runs():
            print(f"{r.run_id:<9} {r.model:<18} {r.metric:<10} {r.value:>8.3f}  {r.artifact}")
    elif cmd == "best":
        cand = [r for r in load_runs() if r.metric == args[0]]
        if not cand:
            print(f"no runs tracked for metric {args[0]}")
        else:
            key = BEST[args[0]]
            best = min(cand, key=lambda r: r.value) if key == "min" \
                else max(cand, key=lambda r: r.value)
            print(f"best {args[0]} ({key}): {best.run_id} {best.model} = {best.value:.3f}")
    else:
        print("usage: cli.py add MODEL METRIC VALUE ARTIFACT | list | best METRIC")
```

`register` es el único lugar que *crea* estado: numera la ejecución desde la longitud del registro (`run_003` después de dos ejecuciones), copia el candidato a `artifacts/` bajo el nombre de la ejecución, hashea la *copia almacenada* (`digest(dest)`, no la fuente — lo que vive es lo que se marca con la huella), y llama al `log_run` con protección del Paso 2. El `best` de la CLI protege el caso de la métrica vacía ("no runs tracked for accuracy" maneja con cortesía la no rastreada) e imprime la dirección con el ganador para que el operador vea *por qué* (`best rmse (min)`).

### 5.2 Ejecuta la competencia de tres modelos

**👟 Pista inicial :** Desde un registro limpio, tres artefactos candidatos en `candidates/`, luego tres `add`, un list y la corona (un `runs.jsonl` fresco mantiene la numeración de ejecuciones empezando en `run_001` — en tu propio directorio te saltarías la primera línea, ya que la protección de duplicados la protege igual):

```bash
rm -f runs.jsonl
mkdir -p candidates artifacts
printf 'serialized ridge weights [0.2, -0.1, 0.4]'  > candidates/ridge.joblib
printf 'serialized lasso weights [0.1, 0.3]'        > candidates/lasso.joblib
printf 'serialized gb weights   [0.15, -0.2, 0.5]'  > candidates/gb.joblib
uv run cli.py add ridge rmse 3.42 candidates/ridge.joblib
uv run cli.py add lasso rmse 4.05 candidates/lasso.joblib
uv run cli.py add gradient_boosting rmse 2.87 candidates/gb.joblib
uv run cli.py list
uv run cli.py best rmse
uv run cli.py best accuracy
```

**🎯 Resultado esperado :**

```
registered run_001 (ridge) sha256=ff863fe836434899...
registered run_002 (lasso) sha256=5ac5290c4de57d97...
registered run_003 (gradient_boosting) sha256=6a542a94df7113c3...
run_001   ridge              rmse          3.420  artifacts/run_001.joblib
run_002   lasso              rmse          4.050  artifacts/run_002.joblib
run_003   gradient_boosting  rmse          2.870  artifacts/run_003.joblib
best rmse (min): run_003 gradient_boosting = 2.870
no runs tracked for metric accuracy
```

**🩹 Si sale mal :** Si `add` reporta dos resúmenes idénticos para modelos distintos, el mismo archivo se pasó como `src` dos veces (candidatos distintos deben ser *cadenas de bytes* distintas). Si `best accuracy` lanza en lugar de imprimir, falta la protección `if not cand` — `max([])` no puede ocurrir con ella en su lugar.

### 5.3 Verifica la competencia

**✅ Lista de verificación**

- ✅ Tres ejecuciones registradas con IDs consecutivos `run_001/2/3` y resúmenes distintos; `list` las coincide.
- ✅ `best rmse` elige run_003 (2.87) — la dirección "min" respetada.
- ✅ `best accuracy` sobre una métrica nunca registrada imprime un mensaje amigable, no un traceback.
- ✅ `artifacts/` ahora contiene tres copias `.joblib` con huella además de las líneas del registro que las referencian.

**🤔 Pregunta(s) socrática(s)**

- `register` numera las ejecuciones desde `len(load_runs())` — el orden depende del registro, no de una garantía. ¿Qué pasa cuando se *borran* ejecuciones del registro (run_002 eliminada, el siguiente ID es `run_003` otra vez → la protección de duplicados se dispara), y cuál es la alternativa robusta (contador por prefijo, IDs con marca de tiempo)?
- La CLI lee el registro en cada `best` y `list` — barato hoy, O(n) para siempre. ¿Cuál es la forma de una *vista de pares única* que podría construirse una vez y compartirse (`best_of("rmse")` sobre una sesión cargada)? ¿Eso es un cambio de corrección o de eficiencia?

## ⚠️ Errores comunes

- **Ejecuciones duplicadas por falta de deduplicación.** `log_run` sin la verificación de duplicados convierte una reejecución en una mentira. La protección es la característica; el append es la plomería.
- **Min vs. max de memoria.** Elegir el rmse *menor* es obvio; elegir la precisión *mayor* es la misma forma con un `max`. Omite la tabla de dirección y la respuesta "best" se voltea por métrica, silenciosamente.
- **Hashear el archivo equivocado.** Marcar la huella *antes* de copiar, o hashear la ruta fuente y almacenarla contra la copia del almacén, no verifica nada una vez que la copia diverge. Hashea lo que vive: `digest(dest)`.
- **Candidatos vacíos.** `min([], key=...)` es un crash, no un veredicto. Protege antes de seleccionar — `"no runs tracked for metric accuracy"` es un dato sobre el que un operador puede actuar.
- **IDs secuenciales desde la longitud del registro.** `len(load_runs()) + 1` reutiliza un ID si se borran ejecuciones, y la protección de duplicados se dispara entonces sobre un append legítimo. Los números de orden pertenecen a un contador, no a un conteo.

## Lo que acabas de construir

Un rastreador de experimentos de cinco comandos que se comporta como una herramienta real de MLE: un registro `Run` tipado, un registro JSONL de solo anexado con protección de duplicados, un selector `best` consciente de la dirección, registro de artefactos con huellas SHA-256, y una CLI que lo une todo sin importar un framework. Las ideas transferibles — registros como dataclasses, registros de solo anexado, tablas de dirección, hashes de contenido — son los átomos de todo sistema serio de gestión de experimentos, y los has construido en ~65 líneas de stdlib.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/experiment-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/experiment-tracker) en el repositorio del curso tiene los scripts completos además de los artefactos candidatos de muestra. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega un comando **`compare`** — `best` elige uno; `compare rmse` imprime la clasificación completa con deltas contra el ganador (`+0.55`, `+0.18`), la salida que consumiría un gráfico de valle.
- Persiste **`params`** como un dict anidado por ejecución y regístralo — `Run(... , params={"alpha": 0.1})` hace que el rastreador responda "¿qué configuración ganó?", no solo "¿qué modelo?".
- Agrega un comando **`verify`** que re-hashee cada `artifacts/*.joblib` y reporte discrepancias contra el registro en una sola pasada — la verificación de integridad se convierte en un hábito programado, no en una corazonada.
- Cambia el ID de `register` a una **marca de tiempo UTC** (`time.strftime("%Y%m%d_%H%M%S")`) — las colisiones se vuelven imposibles en la práctica y las reejecuciones obtienen identidad ordenable.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓