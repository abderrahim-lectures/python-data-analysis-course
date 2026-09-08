---
title: "Gestor de Tareas CLI"
description: "Gestiona tareas desde la terminal con prioridades, fechas límite, agrupación por proyecto y un tablero estilo kanban — todo persistido a un archivo JSON con la biblioteca estándar."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["cli", "json", "productivity"]
learningObjectives:
  - Modelar una tarea con un dataclass y persistirla a JSON
  - Añadir tareas con campos de prioridad, proyecto y fecha límite
  - Listar y filtrar tareas por proyecto
  - Marcar tareas como completadas y detectar fechas límite vencidas
  - Renderizar las tareas como un tablero agrupado por estado
prerequisites:
  - "Fundamentos de Python (funciones, listas, diccionarios)"
  - "Comodidad con sys.argv y ejecutar scripts desde una terminal"
  - "Opcional: un toque ligero de datetime y date"
---

# 🛠️ 🗂️ Gestor de Tareas CLI

Una tarea que no vive en ningún lado no se hace. Este proyecto construye el gestor de tareas más pequeño y genuinamente útil: una herramienta de línea de comandos que almacena tareas en un archivo JSON, te deja añadirlas con una prioridad, un proyecto y una fecha límite, listarlas y filtrarlas, marcarlas como hechas y renderizar todo el backlog como un tablero estilo kanban justo en la terminal. Es biblioteca estándar pura — aprenderás dataclasses, persistencia JSON y un poco de matemáticas de fechas, y terminarás con una herramienta que realmente ejecutarás a diario.

Esto asume Python 101 y comodidad ejecutando scripts desde una terminal — no se requiere nada más allá de eso. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Modelar una tarea como un dataclass y guardar las tareas en un archivo JSON.
2. Añadir tareas con prioridad, proyecto y fecha límite.
3. Listar tareas y filtrarlas por proyecto.
4. Marcar tareas como hechas y marcar las fechas límite vencidas.
5. Renderizar el backlog como un tablero estilo kanban por estado.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal — y, honestamente, la única *real* — para este. Todo el propósito de un gestor de tareas es sobrevivir entre sesiones de terminal, y eso significa escribir `tasks.json` en un disco que conservas. Ejecútalo ahí para que tus tareas persistan.

**Google Colab, Kaggle Notebooks y Binder** pueden cada uno ejecutar las celdas de código perfectamente bien — todos tienen Python y la biblioteca estándar. La salvedad honesta es que el sistema de archivos de un notebook es efímero: tu `tasks.json` puede no sobrevivir entre sesiones, así que trata esos caminos como "ver la lógica correr una vez" en lugar de "guardar mis tareas reales". Usa las insignias para probar el código y cambia a `uv` local para la herramienta en la que realmente confías.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/task-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/task-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftask-manager%2Fnotebook.ipynb)

## Configuración

Crea el proyecto. Esta herramienta usa solo la biblioteca estándar, así que no hay nada que instalar.

```bash
uv init task-manager
cd task-manager
```

```bash
uv run python -c "import json; from pathlib import Path; print('ok')"
```

`json` es toda tu capa de base de datos — tus tareas vivirán en un archivo `tasks.json` legible por humanos en la carpeta del proyecto. `pathlib.Path` te da una forma limpia y multiplataforma de comprobar si ese archivo existe todavía.

**✅ Lista de verificación**

- ✅ `uv init task-manager` creó una carpeta con un `pyproject.toml`.
- ✅ `uv run python -c "import json; from pathlib import Path"` imprime `ok` — cero paquetes añadidos.

## Paso 1: Modela una tarea y persístela a JSON

Cada comando de esta herramienta — añadir, listar, completar, tablero — lee y escribe en la misma tienda. Primero necesitas una forma para una tarea, y un par de funciones que guarden y carguen una lista de tareas.

### 1.1 Crea el dataclass `Task` y la tienda JSON

**👟 Pista inicial :** Define un dataclass `Task` con los campos que necesitarás (id, title, project, priority, deadline, done), y luego escribe `load_tasks`/`save_tasks` alrededor de un archivo `tasks.json`.

```python
# tasks.py
import json
from dataclasses import dataclass, asdict
from pathlib import Path

DB = "tasks.json"

@dataclass
class Task:
    id: int
    title: str
    project: str = "Inbox"
    priority: str = "medium"
    deadline: str = ""
    done: bool = False

def load_tasks() -> list[Task]:
    """Load all tasks from tasks.json, or [] if the file doesn't exist yet."""
    if not Path(DB).exists():
        return []
    with open(DB) as f:
        return [Task(**row) for row in json.load(f)]

def save_tasks(tasks: list[Task]) -> None:
    """Write the task list to tasks.json."""
    with open(DB, "w") as f:
        json.dump([asdict(t) for t in tasks], f, indent=2)

print(load_tasks())
```

`@dataclass` escribe el `__init__`, `__repr__` y los métodos de igualdad por ti — describes los campos una vez y obtienes un objeto real. El par de persistencia es toda la capa de almacenamiento: `asdict(t)` convierte cada `Task` en un diccionario simple que JSON puede entender, `json.dump(..., indent=2)` escribe un archivo legible, y de vuelta, `Task(**row)` desempaqueta cada diccionario guardado de vuelta en un `Task`. El guard `if not Path(DB).exists()` es lo que hace segura la *primera* ejecución: aún no hay archivo significa no hay tareas, no un error.

**🎯 Resultado esperado :** `[]` en un proyecto fresco — una lista de tareas vacía, sin bloqueo.

**🩹 Si sale mal :** Si obtienes un `FileNotFoundError`, falta el guard `exists()`. Si la salida del guardado es una línea gigante ilegible, falta `indent=2` en `json.dump`. Si `Task(**row)` lanza `TypeError: unexpected keyword argument`, el dict guardado tiene una clave que el dataclass no tiene — comprueba que los campos estén escritos igual en ambos lados.

### 1.2 Verifica la tienda

**✅ Lista de verificación**

- ✅ `uv run python tasks.py` imprime `[]` en una ejecución fresca.
- ✅ `save_tasks([Task(id=1, title="hi")])` y luego `load_tasks()` hacen un round-trip de la tarea intacta.
- ✅ Puedes explicar para qué sirve `asdict(t)`, con tus propias palabras.

**🤔 Pregunta(s) socrática(s)**

- Después de `save_tasks`, los datos de la tarea existen como texto literal que podrías abrir en cualquier editor. ¿Qué te da eso que un guardado basado en `pickle` no daría — y qué cuesta en velocidad?
- `Task(**row)` desempaqueta un diccionario en argumentos de palabra clave. ¿Qué se rompe si un `tasks.json` guardado pierde el campo `done` en una fila, dado que `done` tiene un valor predeterminado pero `id` y `title` no?

## Paso 2: Añade tareas con prioridad, proyecto y fecha límite

Con una tienda funcional, puedes empezar a llenarla. Este paso añade el comando `add`: le da a cada tarea nueva un id fresco, la mete en la lista, guarda y te dice qué pasó.

### 2.1 Escribe el comando `add_task` y un generador de ids auxiliar

**👟 Pista inicial :** Calcula el siguiente id desde el id más grande ya presente (predeterminando a 0 en una lista vacía), construye un `Task`, añádelo, guarda e imprime una confirmación.

```python
# tasks.py (continuación)
def next_id(tasks: list[Task]) -> int:
    return max((t.id for t in tasks), default=0) + 1

def add_task(tasks: list[Task], title: str,
             project: str = "Inbox", priority: str = "medium",
             deadline: str = "") -> None:
    task = Task(id=next_id(tasks), title=title,
                project=project, priority=priority, deadline=deadline)
    tasks.append(task)
    save_tasks(tasks)
    print(f"Added #{task.id}: {task.title} [{task.priority}] ({task.project})")

add_task(load_tasks(), "Review pull requests", project="Work", priority="high")
add_task(load_tasks(), "Buy groceries", project="Home", deadline="2026-09-10")
```

Dos detalles hacen que esto sea seguro en lugar de bonito. `max((t.id for t in tasks), default=0)` satisface dos casos a la vez — una lista vacía no tiene ids, así que `default=0` hace que la primera tarea sea `#1` — y recalcular desde la lista almacenada significa que el id nunca puede chocar con uno que ya guardaste. Añadir *antes* de guardar es intencional: si algo en esa lista cambia a lo largo de una sesión, solo importa el estado final escrito.

**🎯 Resultado esperado :** En la primera ejecución, `Added #1: Review pull requests [high] (Work)` y `Added #2: Buy groceries [medium] (Home)`.

**🩹 Si sale mal :** Si ambas tareas se imprimen como `#1`, `next_id` no está recalculando contra la lista *guardada* — comprueba que cada llamada a `add_task` cargue tareas frescas en lugar de reutilizar el mismo objeto de lista. Si los ids saltan a números grandes, falta el `default=0` de la lista vacía. Si las prioridades nunca aparecen en la confirmación, el f-string tiene `task.priority` intercambiado por `priority`.

### 2.2 Verifica `add`

**✅ Lista de verificación**

- ✅ Ejecutar las dos llamadas a `add_task` dos veces seguidas produce ids `1, 2`, luego `3, 4` — sin colisiones.
- ✅ `tasks.json` ahora contiene dos objetos de tarea legibles.
- ✅ El proyecto y la fecha límite vacíos caen a `"Inbox"` y `""` sin error.

**🤔 Pregunta(s) socrática(s)**

- El argumento `priority` tiene un valor predeterminado, así que un usuario que olvida pasarlo obtiene `"medium"` en silencio. ¿Es ese un valor predeterminado amigable o una trampa de calidad de datos, y qué añadirías para mantener las prioridades malas fuera del archivo?
- Una fecha límite se almacena como una cadena simple. ¿Cuándo crees que esa cadena dejará de ser suficiente (pista: piensa en el Paso 4), y qué tipo usarías en su lugar?

## Paso 3: Lista y filtra tareas por proyecto

Añadir tareas es inútil si no puedes verlas. Este paso añade el listado — ordenado por prioridad para que lo importante salga a la superficie — y un filtro `project` para que cada proyecto sea su propia vista clara.

### 3.1 Escribe el comando de listado y filtrado

**👟 Pista inicial :** Ordena las tareas cargadas por un orden de prioridad que definas, y luego opcionalmente reduce a un solo proyecto antes de imprimir cada fila.

```python
# tasks.py (continuación)
PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}

def list_tasks(tasks: list[Task], project: str | None = None) -> None:
    items = tasks if project is None else [t for t in tasks if t.project == project]
    items.sort(key=lambda t: (PRIORITY_ORDER[t.priority], t.id))
    if not items:
        print("Nothing here yet.")
        return
    for t in items:
        flag = "[x]" if t.done else "[ ]"
        print(f"{t.id:>3} {flag} {t.priority:<6} {t.project:<8} {t.title}")

print("-- all --")
list_tasks(load_tasks())
print("-- Home only --")
list_tasks(load_tasks(), project="Home")
```

La clave de ordenación `(PRIORITY_ORDER[t.priority], t.id)` está haciendo dos trabajos: ordenación primaria por el mapa de prioridad numérico (así que `high` viene antes de `medium` — el orden alfabético lo pondría al revés), y una ordenación secundaria estable por id para que las tareas con prioridad igual mantengan el orden de inserción. La marca `[x]`/`[ ]` es un marcador de hecha estilo tablero sobre el que construirás en el Paso 5. Filtrar con una comprensión de lista mantiene el bucle de impresión simple — un camino de código, dos entradas.

**🎯 Resultado esperado :** "all" muestra ambas tareas con `#1 Review pull requests [high]` sobre `#2 Buy groceries [medium]`; "Home only" muestra solo la tarea de compras.

**🩹 Si sale mal :** Si `low` se ordena sobre `high`, la clave de ordenación está usando la cadena cruda en lugar de `PRIORITY_ORDER`. Si "Home only" imprime también la tarea de Work, la comprensión compara `t.project == project` pero los valores de proyecto tienen espacios finales. Si `t.priority:<6` se ve desaliñado, falta el ancho del formato.

### 3.2 Verifica el listado y el filtrado

**✅ Lista de verificación**

- ✅ `list_tasks` ordena primero las tareas de alta prioridad en todos los proyectos.
- ✅ Pasar `project="Home"` muestra solo las tareas de Home.
- ✅ Un resultado vacío imprime `Nothing here yet.` en lugar de un encabezado vacío.

**🤔 Pregunta(s) socrática(s)**

- La ordenación es *estable* en id una vez que la prioridad es igual. ¿Por qué importa depender de la ordenación estable para el orden de inserción, y dónde sorprendería visiblemente una ordenación inestable a un usuario?
- El filtrado ocurre antes de la ordenación. ¿Alguna vez sería correcto ordenar primero y filtrar después — y qué implicaría el orden de salida sobre cómo la herramienta "lee" tus proyectos?

## Paso 4: Completa tareas y marca las fechas límite vencidas

Un gestor de tareas que solo añade y lista es solo un estante. Este paso añade `done` — completar realmente una tarea — más la matemática de fechas que marca las fechas límite que se han convertido en vencidas.

### 4.1 Escribe `complete_task` y la comprobación de vencimiento

**👟 Pista inicial :** Encuentra la tarea por id, invierte su marca `done`, guarda y confirma. Luego añade `is_overdue`, que devuelve `False` para las tareas hechas y las tareas sin fecha límite y compara una fecha real parseada con la de hoy.

```python
# tasks.py (continuación)
from datetime import date, datetime

def complete_task(tasks: list[Task], task_id: int) -> None:
    for t in tasks:
        if t.id == task_id:
            t.done = True
            save_tasks(tasks)
            print(f"Completed #{task_id}: {t.title}")
            return
    print(f"No task with id {task_id}.")

def is_overdue(t: Task) -> bool:
    if t.done or not t.deadline:
        return False
    deadline = datetime.strptime(t.deadline, "%Y-%m-%d").date()
    return deadline < date.today()

tasks = load_tasks()
complete_task(tasks, 2)
for t in tasks:
    status = "OVERDUE" if is_overdue(t) else ("done" if t.done else "open")
    print(f"#{t.id} {t.title}: {status}")
```

`complete_task` es deliberadamente lineal — escanea el id, muta en el lugar, guarda una vez, devuelve. El `return` temprano dentro del bucle es todo el camino de éxito: a la vez previene el doble-guardado y deja que el `print` final sirva como la rama "no encontrado". `is_overdue` toma dos decisiones de guard deliberadas primero: una tarea hecha no puede estar vencida, y una tarea sin fecha límite no puede estar vencida — ambas son *ausencia de programación*, no fallos de programación. `strptime` convirtiendo la cadena almacenada en un `date` real es lo que hace posible la comparación `<` en absoluto.

**🎯 Resultado esperado :** `Completed #2: Buy groceries`; el bucle imprime `#1 Review pull requests: open` y `#2 Buy groceries: done` — más `OVERDUE` para cualquier tarea cuya fecha límite preceda a hoy.

**🩹 Si sale mal :** Si `strptime` lanza `ValueError`, una fecha límite almacenada no está en forma `%Y-%m-%d` (p. ej., `"2026/09/10"`) — esa es la trampa de fecha-límite-como-cadena del Paso 2. Si *cada* tarea lee OVERDUE, `is_overdue` está comparando un `datetime` con un `date` o le falta el guard `not t.deadline` para que las cadenas vacías se parseen y fallen. Si completar una tarea marca varias como hechas, el bucle está mutando la comparación equivocada — los ids deben compararse exactamente.

### 4.2 Verifica la lógica de completar y vencido

**✅ Lista de verificación**

- ✅ Completar un id real invierte `done` a `true` en `tasks.json`.
- ✅ Completar un id inexistente imprime `No task with id …` y no escribe nada.
- ✅ Una tarea con una fecha límite pasada y `done=False` reporta `OVERDUE`; la misma tarea marcada como hecha no lo hace.

**🤔 Pregunta(s) socrática(s)**

- `is_overdue` ignora una fecha límite que es *hoy* — solo `< hoy` cuenta. Una tarea con vencimiento hoy se ve exactamente como una tarea con vencimiento la próxima semana en esta salida. ¿Qué imprimirías en su lugar para hacer de "vence hoy" un estado distintivo y urgente?
- La fecha límite se compara contra el `date.today()` de tu máquina. ¿En qué escenario real es el reloj de la máquina el reloj *equivocado*, y cómo cambiarían las zonas horarias lo que significa "vencido"?

## Paso 5: Renderiza un tablero estilo kanban

El tablero es la recompensa — la vista diaria que un usuario de kanban realmente mira. Agrupa el backlog en columnas de estado, marca las partes urgentes y funciona también como el comando principal de la herramienta.

### 5.1 Escribe el tablero y un pequeño enrutador de comandos

**👟 Pista inicial :** Divide las tareas en columnas "To do" y "Done", marca los elementos vencidos en la columna To-do y construye un `main` que enrute `add` / `done` / `board` desde `sys.argv`.

```python
# tasks.py (continuación)
import sys

def show_board(tasks: list[Task]) -> None:
    todo = [t for t in tasks if not t.done]
    done = [t for t in tasks if t.done]

    print("┌─ TO DO ─────────────────────────────┐")
    for t in sorted(todo, key=lambda t: (is_overdue(t) is not True,
                                         PRIORITY_ORDER[t.priority], t.id)):
        flag = "OVERDUE!" if is_overdue(t) else "        "
        print(f"  {t.id:>2} {flag} {t.title}")
    if not todo:
        print("  (nothing to do)")

    print("┌─ DONE ──────────────────────────────┐")
    for t in done:
        print(f"  {t.id:>2}  [x] {t.title}")

def main() -> None:
    args = sys.argv[1:]
    if not args or args[0] == "board":
        show_board(load_tasks())
    elif args[0] == "add":
        title = " ".join(args[1:])
        add_task(load_tasks(), title)
    elif args[0] == "done":
        complete_task(load_tasks(), int(args[1]))
    else:
        print("Commands: board | add <title> | done <id>")

if __name__ == "__main__":
    main()
```

La clave de ordenación en `show_board` es la línea interesante: `(is_overdue(t) is not True, PRIORITY_ORDER[t.priority], t.id)` pone `False` antes de `True` en una ordenación booleana — así que las tareas *no* vencidas se ordenan primero y las tareas `OVERDUE!` flotan hacia la parte superior de la columna, por delante incluso de la alta prioridad. Renderizar el tablero como texto de dibujo de cajas es presentación pura, pero la partición (`todo`/`done`) reutiliza la misma marca `done` que el Paso 4 mutó, así que el tablero *es* los datos. El enrutador `main` mantiene cada comando de una línea de alto para que la herramienta se lea como una pequeña aplicación en lugar de un script.

**🎯 Resultado esperado :** `uv run python tasks.py` imprime un tablero de dos columnas: las tareas vencidas primero en TO DO con una marca `OVERDUE!`, las tareas hechas bajo DONE. `board`, `add` y `done` funcionan todos desde la terminal.

**🩹 Si sale mal :** Si un error de ordenación menciona ordenar `bool` contra `int`, la tupla de clave está ensamblada mal — `is_overdue(t) is not True` debe seguir siendo un bool. Si el enrutador nunca llega a `done`, `sys.argv[1]` fue consumido por `args[0] == "add"` que coincidía con un título vacío. Si el tablero se ve deformado en algunas terminales, los caracteres de dibujo de cajas `┌─` no se están renderizando — las líneas `==` simples son el fallback portátil.

### 5.2 Verifica la aplicación de extremo a extremo

**✅ Lista de verificación**

- ✅ `uv run python tasks.py board` (o sin argumento) renderiza el tablero de dos columnas.
- ✅ `uv run python tasks.py add "Ship v1"`, `done 3` y `board` hacen un round-trip a través de `tasks.json`.
- ✅ Las tareas vencidas aparecen en la parte superior de TO DO con la marca.
- ✅ Has usado la herramienta al menos una vez con tus propias tareas reales.

**🤔 Pregunta(s) socrática(s)**

- El tablero tiene exactamente dos columnas porque un `Task` almacena solo un booleano `done`. ¿Qué campo único añadiría una tercera columna "In progress", y qué cambio de flujo de trabajo sugeriría eso a los usuarios?
- `show_board` llama a `is_overdue` tres veces por tarea de tipo to-do. Para unas pocas docenas de tareas eso no es nada — ¿a qué escala almacenarías en caché ese resultado, y cómo lo almacenarías *correctamente* (para que se recalcule cuando una tarea se complete)?

## ⚠️ Errores comunes

- **Leer una vez, usar la misma lista para todo.** Llamar a `add_task(load_tasks(), …)` dos veces en una sesión — reutiliza el mismo objeto de lista cargado para ambas llamadas y el segundo guardado pisa el trabajo nuevo del primero. Solución: recarga (o re-guarda) en cada límite de comando, exactamente como hace `main`.
- **Fechas límite como cadenas de forma libre.** Tanto `"9/10/2026"` como `"next week"` se parsean en un `ValueError` en el `strptime` del Paso 4. Solución: acepta un formato canónico `%Y-%m-%d` y rechaza cualquier otra cosa en el momento de añadir.
- **Borrar el archivo entre ejecuciones.** Un gestor de tareas que se bloquea con un `tasks.json` faltante está roto en su primer arranque. El guard `exists()` en `load_tasks` es lo que convierte un archivo vacío en una lista vacía.
- **Ids adivinados en lugar de derivados.** Codificar `id=1` garantiza una colisión la segunda vez que añades. Deriva desde `max(..., default=0) + 1` para que la tienda sea la única fuente de verdad.
- **Ordenar la prioridad alfabéticamente.** `"high"` se ordena *antes* de `"medium"` como texto pero una corrección `low` se ordena después de ambos — el orden equivocado para una lista de tareas. Ordena siempre a través de un mapa `PRIORITY_ORDER` explícito.

## Lo que acabas de construir

Un gestor de tareas real y funcional que sobrevive a los reinicios: modelado con dataclass, persistencia JSON, listado ordenado por prioridad, filtros de proyecto, completado, detección de vencidos y un render de tablero kanban — toda la aplicación en un solo script de biblioteca estándar que realmente ejecutarás. La habilidad transferible es la *persistencia*: el trío cargar/modificar/guardar detrás de `tasks.json` es la misma forma detrás de tus futuros archivos de configuración, aplicaciones de notas y cualquier función de "haz que mis cambios sobrevivan a un reinicio".

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/task-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/task-manager) en el repo del curso es una versión más completa del código anterior, con comandos de editar y borrar y un tablero más rico. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Añade comandos `rm <id>` y `edit <id>` con el mismo patrón cargar/guardar — la eliminación es solo un filtro de lista y un guardado.
- Muestra "vence hoy" por separado de OVERDUE imprimiendo la fecha real, no solo la marca.
- Ordena cada columna también por *fecha límite*, de modo que una tarea de alta prioridad vencida y una media que vence mañana se ordenen por presión de tiempo.
- Añade una vista `--due` que imprima solo las tareas sin completar con fechas límite, el filtro matutino preferido una vez que tienes tareas reales en el archivo.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
