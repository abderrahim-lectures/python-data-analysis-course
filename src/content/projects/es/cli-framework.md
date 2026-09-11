---
title: "Constructor de Framework CLI"
description: "Construir un framework CLI compuesto con subcomandos, ayuda auto-generada y soporte de plugins."
difficulty: "intermediate"
estimatedMinutes: 50
xpReward: 50
tags: ["cli", "argparse", "classes", "json"]
prerequisites: ["Python básico (variables, bucles, funciones, clases)", "Familiaridad con terminales de línea de comandos"]
learningObjectives:
  - "Parsear argumentos posicionales y opcionales con argparse"
  - "Construir una arquitectura de subcomandos que enrute comandos como task add, task list, task remove y task search"
  - "Agregar salida de terminal en color usando códigos ANSI crudos"
  - "Implementar validación de entrada con mensajes de error claros y amigables"
  - "Cargar y guardar ajustes desde un archivo de configuración JSON"
  - "Agregar indicadores de progreso para operaciones de larga duración"
---

# Constructor de Framework CLI

Toda herramienta Python seria vive en la línea de comandos. En este proyecto construirás desde cero un framework CLI reutilizable — un gestor de tareas con subcomandos para añadir, listar, eliminar y buscar tareas. En el camino aprenderás cómo `argparse` parsea argumentos, cómo enrutar subcomandos, cómo colorear la salida del terminal, cómo validar entrada, cómo cargar ajustes desde un archivo JSON y cómo mostrar barras de progreso para operaciones lentas. Sin frameworks de terceros como Click o Typer — solo la biblioteca estándar de Python y unas pocas líneas de diseño cuidadoso.

Este proyecto asume que conoces lo básico de Python: variables, bucles, funciones, clases y diccionarios. También deberías sentirte cómodo abriendo un terminal y ejecutando scripts de Python desde la línea de comandos. Es opcional y no calificado. Consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Parsear argumentos posicionales y opcionales con `argparse`.
2. Construir una arquitectura de subcomandos que enrute comandos como `task add`, `task list`, `task remove` y `task search`.
3. Agregar salida de terminal en color usando códigos ANSI crudos.
4. Implementar validación de entrada con mensajes de error claros y amigables.
5. Cargar y guardar ajustes desde un archivo de configuración JSON.
6. Agregar indicadores de progreso para operaciones de larga duración.

## Lo que construirás

Un framework CLI que:

- Parseas argumentos posicionales y opcionales
- Soporta subcomandos (add, list, remove, search)
- Muestra texto en color y salida formateada
- Valida la entrada con mensajes de error claros
- Carga ajustes desde un archivo de configuración
- Muestra barras de progreso para operaciones largas

## Dónde ejecutar esto

- **Localmente con `uv` (recomendado).** Las herramientas CLI necesitan un terminal real — este proyecto no funciona en notebooks.
- **Google Colab.** Limitado — puedes probar funciones individuales, pero la experiencia CLI completa requiere un terminal local.
- **JupyterLite.** No es adecuado para la ejecución de CLI.

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo — ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/cli-framework/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/cli-framework/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcli-framework%2Fnotebook.es.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego pip, luego un entorno virtual" — gestiona versiones de Python y dependencias juntas.

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
uv init cli-framework
cd cli-framework
```

No se necesitan paquetes de terceros — todo en este proyecto usa la biblioteca estándar de Python.

## Paso 1: Parsear argumentos con argparse

**Objetivo:**

Aprende cómo `argparse` lee la línea de comandos y convierte cadenas crudas en un namespace estructurado que tu código puede usar.

**Explicación:**

Cuando escribes `python task.py add "Buy milk" --priority high`, Python ve `sys.argv` como la lista `["task.py", "add", "Buy milk", "--priority", "high"]`. `argparse` convierte esa lista en un objeto con nombre donde puedes acceder a `args.command == "add"`, `args.title == "Buy milk"` y `args.priority == "high"` — sin dividir cadenas a mano, sin errores de índice.

Los dos conceptos clave son **argumentos posicionales** (obligatorios, identificados por posición) y **argumentos opcionales** (flags como `--priority` que tienen valores por defecto).

**👟 Pista inicial :**

Importa `argparse` y `sys`. Crea una función `build_parser()` que devuelva un `argparse.ArgumentParser`. Usa `add_argument` para definir lo que la herramienta acepta. Llama a `parser.parse_args()` para obtener un objeto namespace.

**Código funcional:**

Crea un archivo llamado `task.py`:

```python
import argparse
import sys


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser for the task manager."""
    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    parser.add_argument(
        "title",
        nargs="?",
        help="Task title (interactive prompt if omitted)",
    )
    parser.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default="medium",
        help="Task priority (default: medium)",
    )
    parser.add_argument(
        "-c", "--category",
        default="general",
        help="Task category (default: general)",
    )
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.title:
        print(f"Task:      {args.title}")
        print(f"Priority:  {args.priority}")
        print(f"Category:  {args.category}")
    else:
        title = input("Enter task title: ").strip()
        if not title:
            print("Error: title cannot be empty.")
            sys.exit(1)
        print(f"Task:      {title}")
        print(f"Priority:  {args.priority}")
        print(f"Category:  {args.category}")


if __name__ == "__main__":
    main()
```

**🎯 Resultado esperado :**

Ejecuta desde el terminal:

```bash
python task.py "Buy milk" --priority high --category shopping
```

```
Task:      Buy milk
Priority:  high
Category:  shopping
```

Omite el título para disparar el prompt interactivo:

```bash
python task.py -p low
```

```
Enter task title: Clean the garage
Task:      Clean the garage
Priority:  low
Category:  general
```

Pasa `--help` para ver el texto de ayuda autogenerado:

```bash
python task.py --help
```

```
usage: task [-h] [-p {low,medium,high}] [-c CATEGORY] [title]

A simple task manager from the command line.

positional arguments:
  title                 Task title (interactive prompt if omitted)

options:
  -h, --help            show this help message and exit
  -p {low,medium,high}, --priority {low,medium,high}
                        Task priority (default: medium)
  -c CATEGORY, --category CATEGORY
                        Task category (default: general)
```

**🩹 Si sale mal :**

**Error de "argumentos no reconocidos".** Pasaste un flag antes de un argumento posicional en el orden equivocado, o escribiste mal el nombre de un flag. Ejecuta `python task.py --help` para ver las opciones válidas.

**`title` siempre es `None`.** El `nargs="?"` hace que el argumento posicional sea opcional. Si lo quieres obligatorio, elimina `nargs="?"` y la comprobación `if args.title`.

**El flag de prioridad acepta valores no válidos.** La restricción `choices=["low", "medium", "high"]` rechaza cualquier otra cosa. Si necesitas prioridades personalizadas, usa `type=str` en lugar de `choices`.

**✅ Lista de verificación**

- `python task.py "Write report" --priority high` imprime el título, la prioridad y la categoría.
- `python task.py --help` muestra un mensaje de ayuda formateado con todos los flags.
- `python task.py -p low` sin título le pide entrada al usuario.
- Los valores de prioridad no válidos como `--priority urgent` producen un error claro.
- `python task.py` sin argumentos y sin stdin dispara el prompt.

**🤔 Pregunta(s) socrática(s)**

¿Por qué `argparse` maneja el flag `--help` automáticamente? ¿Qué tendrías que escribir manualmente si tuvieras que parsear `sys.argv` tú mismo y detectar `-h` o `--help`?

## Paso 2: Construir subcomandos

**Objetivo:**

Extiende el parser para soportar múltiples comandos — `add`, `list`, `remove`, `search` — cada uno con sus propios argumentos, todos enrutados a través de un único punto de entrada.

**Explicación:**

Las herramientas CLI reales no vuelcan todo en un solo parser. Usan subcomandos: `git commit`, `docker run`, `pip install`. `argparse` soporta esto con `add_subparsers()`. Cada subparser es su propio mini-parser con sus propios argumentos, pero todos viven bajo un padre común. El parámetro `dest="command"` almacena qué subcomando se eligió.

**👟 Pista inicial :**

Dentro de `build_parser()`, llama a `parser.add_subparsers(dest="command")`. Luego agrega cada subcomando con `sub.add_parser("add", ...)`. Dale a cada subparser sus propios argumentos. En `main()`, usa `args.command` para despachar al manejador correcto.

**Código funcional:**

Reemplaza el contenido de `task.py` con:

```python
import argparse
import sys
import json
from datetime import datetime


TASKS_FILE = "tasks.json"


def load_tasks() -> list[dict]:
    """Load tasks from the JSON file."""
    try:
        with open(TASKS_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_tasks(tasks: list[dict]) -> None:
    """Save tasks to the JSON file."""
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f, indent=2)


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser with subcommands."""
    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # add
    add_p = sub.add_parser("add", help="Add a new task")
    add_p.add_argument("title", help="Task title")
    add_p.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default="medium",
        help="Task priority (default: medium)",
    )
    add_p.add_argument(
        "-c", "--category",
        default="general",
        help="Task category (default: general)",
    )

    # list
    list_p = sub.add_parser("list", help="List all tasks")
    list_p.add_argument(
        "--category",
        help="Filter by category",
    )
    list_p.add_argument(
        "--priority",
        choices=["low", "medium", "high"],
        help="Filter by priority",
    )
    list_p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of tasks to show (0 = all)",
    )

    # remove
    remove_p = sub.add_parser("remove", help="Remove a task by index")
    remove_p.add_argument("index", type=int, help="Task index (from list)")

    # search
    search_p = sub.add_parser("search", help="Search tasks by keyword")
    search_p.add_argument("keyword", help="Search term")

    return parser


def cmd_add(args):
    """Add a new task."""
    tasks = load_tasks()
    task = {
        "title": args.title,
        "priority": args.priority,
        "category": args.category,
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)
    print(f"Added: {task['title']} [{task['priority']}]")


def cmd_list(args):
    """List tasks with optional filters."""
    tasks = load_tasks()
    if not tasks:
        print("No tasks found.")
        return

    if args.category:
        tasks = [t for t in tasks if t["category"] == args.category]
    if args.priority:
        tasks = [t for t in tasks if t["priority"] == args.priority]
    if args.limit > 0:
        tasks = tasks[: args.limit]

    if not tasks:
        print("No tasks match the filters.")
        return

    print(f"\n  {'#':<4} {'Title':<30} {'Priority':<10} {'Category':<12} {'Status'}")
    print(f"  {'─'*4} {'─'*30} {'─'*10} {'─'*12} {'─'*10}")
    for i, t in enumerate(tasks, 1):
        status = "done" if t["done"] else "open"
        print(f"  {i:<4} {t['title']:<30} {t['priority']:<10} {t['category']:<12} {status}")
    print()


def cmd_remove(args):
    """Remove a task by its index."""
    tasks = load_tasks()
    if not tasks:
        print("No tasks to remove.")
        return

    idx = args.index - 1
    if idx < 0 or idx >= len(tasks):
        print(f"Error: index {args.index} is out of range (1-{len(tasks)}).")
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"Removed: {removed['title']}")


def cmd_search(args):
    """Search tasks by keyword in the title."""
    tasks = load_tasks()
    keyword = args.keyword.lower()
    matches = [t for t in tasks if keyword in t["title"].lower()]

    if not matches:
        print(f"No tasks contain '{args.keyword}'.")
        return

    print(f"\n  Found {len(matches)} task(s) matching '{args.keyword}':")
    for i, t in enumerate(matches, 1):
        print(f"  {i}. {t['title']} [{t['priority']}]")
    print()


def main():
    parser = build_parser()
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
```

**🎯 Resultado esperado :**

```bash
python task.py add "Buy milk" --priority high --category shopping
python task.py add "Write report" --category work
python task.py add "Clean garage" --priority low --category home
```

```
Added: Buy milk [high]
Added: Write report [medium]
Added: Clean garage [low]
```

```bash
python task.py list
```

```
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Buy milk                       high       shopping     open
  2    Write report                   medium     work         open
  3    Clean garage                   low        home         open
```

```bash
python task.py list --category work --priority medium
```

```
  Found 1 task(s):
  1. Write report [medium]
```

```bash
python task.py search milk
```

```
  Found 1 task(s) matching 'milk':
  1. Buy milk [high]
```

```bash
python task.py remove 2
```

```
Removed: Write report
```

```bash
python task.py list
```

```
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Buy milk                       high       shopping     open
  2    Clean garage                   low        home         open
```

**🩹 Si sale mal :**

**Error "los siguientes argumentos son obligatorios: command".** Olvidaste el nombre del subcomando. Cada invocación debe comenzar con un subcomando: `python task.py add ...`, no `python task.py ...`.

**Índice fuera de rango al eliminar.** El comando `remove` usa indexación basada en 1 (que coincide con lo que el usuario ve en `list`). Si pasas `0` o un número mayor que el total de tareas, obtienes un error claro. Revisa la salida de `list` para confirmar el índice correcto.

**Error de decodificación JSON al inicio.** Si `tasks.json` contiene JSON no válido (quizá lo editaste a mano), la función `load_tasks` devuelve una lista vacía y empieza de nuevo. Para recuperarte, elimina el archivo y vuelve a añadir las tareas.

**Los filtros no devuelven nada.** `--category work` distingue mayúsculas y minúsculas. Una tarea con la categoría "Work" no coincidirá con "work". Considera agregar normalización `.lower()` en el filtro si quieres coincidencias sin distinguir mayúsculas.

**✅ Lista de verificación**

- `python task.py add "Test" --priority high` crea una tarea y confirma con salida.
- `python task.py list` muestra todas las tareas en una tabla formateada.
- `python task.py list --category work` muestra solo las tareas de la categoría "work".
- `python task.py remove 1` elimina la primera tarea y confirma el título.
- `python task.py remove 99` imprime un error claro de fuera de rango.
- `python task.py search keyword` encuentra tareas con títulos coincidentes.
- Las tareas persisten entre comandos — añade tres, lista, y las tres aparecen.

**🤔 Pregunta(s) socrática(s)**

¿Por qué la función `load_tasks` devuelve una lista vacía ante `FileNotFoundError` en lugar de fallar? ¿Qué patrón de diseño representa esto — y cómo cambia la experiencia del usuario cuando ejecutan la herramienta por primera vez?

## Paso 3: Agregar salida en color

**Objetivo:**

Hacer que la salida del terminal sea visualmente distinta envolviendo el texto en códigos de color ANSI — para que las prioridades, estados y errores sean reconocibles al instante.

**Explicación:**

Los terminales interpretan secuencias de escape especiales como comandos de color. La secuencia `\033[91m` le dice al terminal que cambie a texto rojo, y `\033[0m` restablece el valor por defecto. Al envolver la salida en estos códigos, haces que las tareas de alta prioridad se vean rojas, las de baja prioridad atenuadas y los mensajes de éxito verdes — sin librerías de terceros.

**👟 Pista inicial :**

Define una clase `Color` con constantes de cadena a nivel de clase para cada color. Escribe un helper `colored(text, color)` que envuelva el texto en los códigos de escape. Úsalo en tus funciones `cmd_list` y `cmd_add` para resaltar diferentes partes de la salida.

**Código funcional:**

Agrega la siguiente clase `Color` y función `colored` al inicio de `task.py`, después de los imports:

```python
class Color:
    """ANSI color codes for terminal output."""
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def colored(text: str, color: str) -> str:
    """Wrap text in an ANSI color code."""
    return f"{color}{text}{Color.RESET}"
```

Ahora actualiza `cmd_add` para usar colores:

```python
def cmd_add(args):
    """Add a new task with colored confirmation."""
    tasks = load_tasks()
    task = {
        "title": args.title,
        "priority": args.priority,
        "category": args.category,
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }
    p_color = priority_colors.get(args.priority, "")
    print(f"  {colored('+', Color.GREEN)} {task['title']} [{colored(args.priority, p_color)}]")
```

Actualiza `cmd_list` para codificar por color las prioridades y el estado:

```python
def cmd_list(args):
    """List tasks with colored output."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks found.", Color.DIM))
        return

    if args.category:
        tasks = [t for t in tasks if t["category"] == args.category]
    if args.priority:
        tasks = [t for t in tasks if t["priority"] == args.priority]
    if args.limit > 0:
        tasks = tasks[: args.limit]

    if not tasks:
        print(colored("  No tasks match the filters.", Color.DIM))
        return

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }

    print()
    header = f"  {'#':<4} {'Title':<30} {'Priority':<10} {'Category':<12} {'Status'}"
    print(colored(header, Color.BOLD))
    print(f"  {'─'*4} {'─'*30} {'─'*10} {'─'*12} {'─'*10}")

    for i, t in enumerate(tasks, 1):
        status = colored("done", Color.GREEN) if t["done"] else colored("open", Color.CYAN)
        p_color = priority_colors.get(t["priority"], "")
        p_display = colored(t["priority"], p_color)
        print(f"  {i:<4} {t['title']:<30} {p_display:<19} {t['category']:<12} {status}")
    print()
```

Actualiza `cmd_remove` para colorear la confirmación:

```python
def cmd_remove(args):
    """Remove a task with colored confirmation."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks to remove.", Color.DIM))
        return

    idx = args.index - 1
    if idx < 0 or idx >= len(tasks):
        print(colored(f"  Error: index {args.index} is out of range (1-{len(tasks)}).", Color.RED))
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"  {colored('-', Color.RED)} {removed['title']}")
```

Actualiza `cmd_search` para resaltar las coincidencias:

```python
def cmd_search(args):
    """Search tasks and highlight matches."""
    tasks = load_tasks()
    keyword = args.keyword.lower()
    matches = [t for t in tasks if keyword in t["title"].lower()]

    if not matches:
        print(colored(f"  No tasks contain '{args.keyword}'.", Color.DIM))
        return

    print(f"\n  {colored('Found', Color.GREEN)} {len(matches)} task(s) matching '{args.keyword}':")
    for i, t in enumerate(matches, 1):
        print(f"  {i}. {colored(t['title'], Color.CYAN)} [{t['priority']}]")
    print()
```

**🎯 Resultado esperado :**

```bash
python task.py add "Deploy to production" --priority high --category work
python task.py add "Read a book" --priority low --category personal
python task.py list
```

```
  + Deploy to production [high]
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Deploy to production           high       work         open
  2    Read a book                    low        personal     open
```

En un terminal que soporta colores ANSI, "high" aparece en rojo, "low" está atenuado, "open" en cian y la fila de encabezado en negrita. El signo `+` es verde y el signo `-` en remove es rojo.

**🩹 Si sale mal :**

**Los colores aparecen como códigos de escape crudos como `[91m`.** Tu terminal no interpreta códigos ANSI. Prueba `export TERM=xterm-256color` antes de ejecutar. En Windows, usa Windows Terminal o PowerShell 7+ — el antiguo `cmd.exe` no soporta ANSI por defecto.

**Los colores aparecen en archivos pero no en el terminal.** Podrías estar redirigiendo la salida a un archivo (`python task.py list > output.txt`). Los códigos ANSI son solo para terminales interactivos. Si necesitas escribir en archivos, elimina los códigos o usa un flag como `--no-color`.

**La función `colored` devuelve una cadena vacía.** Verifica que estás pasando una constante de `Color`, no un atributo de `Color` que no existe. Por ejemplo, `Color.RED` funciona, pero `Color.rED` no.

**El texto en negrita no se ve en negrita.** Algunos temas de terminal reemplazan la negrita ANSI por un tono más claro en lugar de negrita real. Prueba otro tema de terminal o usa `\033[1m` combinado con un código de color para el énfasis.

**✅ Lista de verificación**

- Las tareas de alta prioridad se muestran en rojo en la salida de lista.
- Las tareas de baja prioridad están atenuadas.
- La confirmación `+` de añadir es verde.
- La confirmación `-` de eliminar es roja.
- La fila de encabezado de la tabla está en negrita.
- La etiqueta de estado "open" está en cian.
- Ejecutar `python task.py list > out.txt` produce un archivo sin secuencias de escape si viene de una tubería que las elimina, o con secuencias de escape si la tubería las conserva — en cualquier caso, la herramienta no se cae.

**🤔 Pregunta(s) socrática(s)**

¿Por qué los códigos de color solo deberían aplicarse a la salida del terminal y nunca escribirse en archivos de registro o de datos? ¿Qué pasa si un usuario canaliza tu salida en color hacia `less`, `grep` o un parser de logs de CI/CD?

## Paso 4: Validación de entrada

**Objetivo:**

Rechazar la entrada mala temprano con mensajes claros y accionables en lugar de dejar que los datos no válidos corrompan tu lista de tareas.

**Explicación:**

La validación de entrada es el límite entre el error del usuario y el fallo del programa. Una tarea con título vacío, una prioridad fuera del conjunto permitido o una categoría con caracteres especiales debería detectarse *antes* de guardarse. La meta es producir mensajes de error que le digan al usuario exactamente qué está mal y cómo arreglarlo — sin tracebacks, sin corrupción silenciosa.

**👟 Pista inicial :**

Escribe una función `validate_task_input(title, priority, category)` que revise cada campo. Lanza `ValueError` con un mensaje descriptivo para cualquier entrada no válida. Llámala al inicio de `cmd_add` antes de guardar.

**Código funcional:**

Agrega una función de validación y actualiza `cmd_add`:

```python
def validate_task_input(title: str, priority: str, category: str) -> None:
    """Validate task fields before saving. Raises ValueError on failure."""
    if not title or not title.strip():
        raise ValueError("Title cannot be empty or whitespace.")
    if len(title) > 200:
        raise ValueError(f"Title is too long ({len(title)} chars, max 200).")
    if priority not in ("low", "medium", "high"):
        raise ValueError(f"Invalid priority '{priority}'. Use: low, medium, high.")
    if not category or not category.strip():
        raise ValueError("Category cannot be empty.")
    if len(category) > 50:
        raise ValueError(f"Category is too long ({len(category)} chars, max 50).")
    # Check for characters that break JSON storage or display
    forbidden = set('/\\:"*?<>|')
    bad_chars = set(category) & forbidden
    if bad_chars:
        raise ValueError(
            f"Category contains invalid characters: {''.join(bad_chars)}"
        )


def cmd_add(args):
    """Add a new task with input validation."""
    try:
        validate_task_input(args.title, args.priority, args.category)
    except ValueError as e:
        print(colored(f"  Error: {e}", Color.RED))
        sys.exit(1)

    tasks = load_tasks()
    task = {
        "title": args.title.strip(),
        "priority": args.priority,
        "category": args.category.strip(),
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }
    p_color = priority_colors.get(args.priority, "")
    print(f"  {colored('+', Color.GREEN)} {task['title']} [{colored(args.priority, p_color)}]")
```

También valida el índice de `remove` en `cmd_remove`:

```python
def cmd_remove(args):
    """Remove a task with input validation."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks to remove.", Color.DIM))
        return

    if args.index < 1:
        print(colored("  Error: index must be 1 or greater.", Color.RED))
        sys.exit(1)

    idx = args.index - 1
    if idx >= len(tasks):
        print(colored(
            f"  Error: index {args.index} is out of range (1-{len(tasks)}).",
            Color.RED,
        ))
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"  {colored('-', Color.RED)} {removed['title']}")
```

**🎯 Resultado esperado :**

```bash
python task.py add "" --priority high
```

```
  Error: Title cannot be empty or whitespace.
```

```bash
python task.py add "A" * 50 --priority extreme
```

```
  Error: Invalid priority 'extreme'. Use: low, medium, high.
```

```bash
python task.py add "Valid task" --category "work/special"
```

```
  Error: Category contains invalid characters: /
```

```bash
python task.py remove 0
```

```
  Error: index must be 1 or greater.
```

```bash
python task.py remove 999
```

```
  Error: index 999 is out of range (1-3).
```

La entrada válida pasa limpiamente:

```bash
python task.py add "Write documentation" --priority medium --category work
```

```
  + Write documentation [medium]
```

**🩹 Si sale mal :**

**La validación pasa pero los datos están corruptos.** Asegúrate de que `validate_task_input` se llame *antes* de añadir la tarea a la lista. Si validas después de añadirla, los datos malos ya están guardados.

**El mensaje de error se corta.** Si el título es muy largo, el mensaje de error incluye el conteo de caracteres. Esto es intencional — le dice al usuario exactamente cuánto debe acortarlo.

**`strip()` elimina espacio en blanco útil.** Si un usuario introduce intencionalmente un título con espacios iniciales, `strip()` los elimina. Esto suele ser el comportamiento correcto para un título de tarea, pero si necesitas preservar el espacio, elimina las llamadas `.strip()` y documenta la política.

**La validación de categoría es demasiado estricta.** La lista de caracteres prohibidos es conservadora. Si necesitas categorías con diagonales (como "work/urgent"), ajusta la validación para permitir `/` pero prohibir `\`, `"` y otros caracteres que rompan JSON.

**✅ Lista de verificación**

- El título vacío produce un error claro, no un traceback.
- El título de más de 200 caracteres se rechaza con el conteo de caracteres.
- Los valores de prioridad no válidos se rechazan con la lista de opciones válidas.
- La categoría vacía produce un error.
- La categoría con caracteres prohibidos (`/`, `\`, `"`, etc.) se rechaza.
- Eliminar el índice 0 produce un mensaje de error útil.
- Eliminar un índice mayor que el conteo de tareas muestra el rango válido.
- La entrada válida se guarda correctamente y se confirma con salida.

**🤔 Pregunta(s) socrática(s)**

¿Por qué es mejor validar la entrada en el límite (cuando el usuario la proporciona) en lugar de dentro de la función de guardado? ¿Qué pasa con la dificultad de depuración si la validación y el almacenamiento están enredados juntos?

## Paso 5: Soporte de archivos de configuración

**Objetivo:**

Permitir que los usuarios personalicen el comportamiento por defecto — prioridad por defecto, categoría por defecto, preferencias de color — cargando ajustes desde un archivo JSON.

**Explicación:**

Los valores por defecto codificados funcionan para una demo, pero las herramientas reales necesitan configuración. Un archivo de configuración JSON permite a los usuarios fijar sus preferencias una vez y olvidarse de ellas. El patrón es: busca un archivo de configuración en una ruta conocida, cárgalo si existe, úsalo para establecer los valores por defecto, y recurre a los valores incorporados si el archivo falta o está incompleto.

**👟 Pista inicial :**

Escribe una clase `Config` que cargue `~/.taskconfig.json` (o una ruta que especifiques). El método `get(key, default)` devuelve el valor de configuración o el valor por defecto. Llámala en `build_parser` para sobrescribir los valores por defecto de `--priority` y `--category`.

**Código funcional:**

Agrega una clase `Config` y conéctala al CLI:

```python
import os
from pathlib import Path


DEFAULT_CONFIG_PATH = Path.home() / ".taskconfig.json"

DEFAULT_SETTINGS = {
    "default_priority": "medium",
    "default_category": "general",
    "colors_enabled": True,
    "date_format": "%Y-%m-%d",
}


class Config:
    """Load and access settings from a JSON config file."""

    def __init__(self, path: str | Path | None = None):
        self.path = Path(path) if path else DEFAULT_CONFIG_PATH
        self.settings: dict = {}
        self.load()

    def load(self) -> None:
        """Load settings from disk, falling back to defaults."""
        self.settings = dict(DEFAULT_SETTINGS)
        if self.path.exists():
            try:
                with open(self.path) as f:
                    user_settings = json.load(f)
                self.settings.update(user_settings)
            except (json.JSONDecodeError, KeyError) as e:
                print(colored(f"  Warning: config file error ({e}), using defaults.", Color.YELLOW))

    def save(self) -> None:
        """Save current settings to disk."""
        with open(self.path, "w") as f:
            json.dump(self.settings, f, indent=2)

    def get(self, key: str, default=None):
        """Get a setting value with a fallback default."""
        return self.settings.get(key, default)


def build_parser(config: Config | None = None) -> argparse.ArgumentParser:
    """Build the argument parser, optionally using config for defaults."""
    default_priority = config.get("default_priority", "medium") if config else "medium"
    default_category = config.get("default_category", "general") if config else "general"

    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # add
    add_p = sub.add_parser("add", help="Add a new task")
    add_p.add_argument("title", help="Task title")
    add_p.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default=default_priority,
        help=f"Task priority (default: {default_priority})",
    )
    add_p.add_argument(
        "-c", "--category",
        default=default_category,
        help=f"Task category (default: {default_category})",
    )

    # list
    list_p = sub.add_parser("list", help="List all tasks")
    list_p.add_argument("--category", help="Filter by category")
    list_p.add_argument(
        "--priority",
        choices=["low", "medium", "high"],
        help="Filter by priority",
    )
    list_p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of tasks to show (0 = all)",
    )

    # remove
    remove_p = sub.add_parser("remove", help="Remove a task by index")
    remove_p.add_argument("index", type=int, help="Task index (from list)")

    # search
    search_p = sub.add_parser("search", help="Search tasks by keyword")
    search_p.add_argument("keyword", help="Search term")

    # config (new subcommand)
    cfg_p = sub.add_parser("config", help="Show or update configuration")
    cfg_p.add_argument(
        "--show",
        action="store_true",
        help="Show current configuration",
    )
    cfg_p.add_argument(
        "--set",
        nargs=2,
        metavar=("KEY", "VALUE"),
        help="Set a configuration value",
    )
    cfg_p.add_argument(
        "--init",
        action="store_true",
        help="Create a default config file",
    )

    return parser
```

Agrega el manejador del subcomando config:

```python
def cmd_config(args, config: Config):
    """Handle the config subcommand."""
    if args.init:
        if config.path.exists():
            print(colored(f"  Config already exists at {config.path}", Color.YELLOW))
        else:
            config.save()
            print(f"  Created config at {config.path}")
    elif args.show:
        print(f"\n  {colored('Configuration', Color.BOLD)} ({config.path})")
        print(f"  {'─' * 40}")
        for key, value in sorted(config.settings.items()):
            print(f"  {key:<25} {value}")
        print()
    elif args.set:
        key, value = args.set
        if key not in config.settings:
            print(colored(f"  Unknown setting: {key}", Color.RED))
            print(f"  Valid settings: {', '.join(sorted(config.settings.keys()))}")
            sys.exit(1)
        # Type-coerce value to match the default's type
        default = config.settings[key]
        if isinstance(default, bool):
            value = value.lower() in ("true", "1", "yes")
        elif isinstance(default, int):
            value = int(value)
        config.settings[key] = value
        config.save()
        print(f"  Set {key} = {value}")
    else:
        print(colored("  Use --show, --set KEY VALUE, or --init.", Color.DIM))
```

Actualiza `main()` para crear la config y pasarla:

```python
def main():
    config = Config()
    parser = build_parser(config)
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
    }

    if args.command == "config":
        cmd_config(args, config)
    else:
        commands[args.command](args)
```

**🎯 Resultado esperado :**

Inicializa un archivo de configuración:

```bash
python task.py config --init
```

```
  Created config at /home/you/.taskconfig.json
```

Ve la configuración:

```bash
python task.py config --show
```

```
  Configuration (/home/you/.taskconfig.json)
  ────────────────────────────────────────
  colors_enabled            True
  date_format               %Y-%m-%d
  default_category          general
  default_priority          medium
```

Cambia la prioridad por defecto:

```bash
python task.py config --set default_priority high
```

```
  Set default_priority = high
```

Ahora las nuevas tareas usan el valor por defecto configurado:

```bash
python task.py add "Urgent task"
```

```
  + Urgent task [high]
```

Si el archivo de configuración tiene JSON no válido, la herramienta advierte y continúa con los valores por defecto:

```bash
echo "not json" > ~/.taskconfig.json
python task.py config --show
```

```
  Warning: config file error (...), using defaults.

  Configuration (/home/you/.taskconfig.json)
  ────────────────────────────────────────
  colors_enabled            True
  date_format               %Y-%m-%d
  default_category          general
  default_priority          medium
```

**🩹 Si sale mal :**

**Archivo de configuración no encontrado en Windows.** `Path.home()` devuelve `C:\Users\YourName` en Windows. La ruta `~/.taskconfig.json` se traduce correctamente, pero si estás ejecutando en un contenedor o WSL, el directorio home podría diferir. Imprime `config.path` para ver la ruta real.

**La coerción de tipo falla.** Si estableces `default_priority` en `3` (una cadena), seguirá siendo una cadena en lugar de convertirse en entero. La lógica de coerción verifica el tipo del valor *por defecto* — si el valor por defecto es una cadena, el nuevo valor seguirá siendo una cadena. Esto es intencional: no puedes cambiar un ajuste de cadena a int a través de `--set`.

**El archivo de configuración se sobrescribe en cada guardado.** El método `save` escribe todo el dict de ajustes. Si agregas claves personalizadas a mano, se perderán en el siguiente guardado. Solo se preservan las claves de `DEFAULT_SETTINGS`.

**Error de permisos al escribir en el directorio home.** En algunos sistemas, el directorio home tiene permisos estrictos. Verifica con `ls -la ~` y asegúrate de que tu usuario pueda escribir archivos allí.

**✅ Lista de verificación**

- `python task.py config --init` crea `~/.taskconfig.json` con valores por defecto.
- `python task.py config --show` imprime todos los ajustes con sus valores actuales.
- `python task.py config --set default_priority low` actualiza el archivo.
- Después de cambiar `default_priority`, `python task.py add "Task"` usa el nuevo valor por defecto.
- Un archivo de configuración corrupto produce una advertencia, no un fallo.
- Los nombres de ajustes desconocidos producen un error con la lista de claves válidas.
- `python task.py add "Task"` sin archivo de configuración funciona con valores por defecto integrados.

**🤔 Pregunta(s) socrática(s)**

¿Por qué el cargador de configuración recurre a los valores por defecto en lugar de exigir que el usuario arregle el archivo? ¿Qué equilibrio hace esto entre robustez y corrección de datos?

## Paso 6: Indicadores de progreso

**Objetivo:**

Mostrar una barra de progreso para operaciones que llevan tiempo — cargar, filtrar o simular trabajo — para que el usuario sepa que la herramienta está haciendo algo, no atascada.

**Explicación:**

Una barra de progreso es retroalimentación visual. Le dice al usuario cuánto trabajo está hecho y cuánto queda. Para un gestor de tareas, el caso de uso más realista son las operaciones por lotes: importar tareas desde un archivo, ejecutar una búsqueda en un gran conjunto de datos, o simular una operación lenta para aprender. La técnica es simple: imprime una línea con `\r` (retorno de carro) para sobrescribirse a sí misma a medida que el progreso avanza.

**👟 Pista inicial :**

Escribe una clase `ProgressBar` que rastree `current` y `total`. El método `update()` calcula el porcentaje, dibuja una barra de caracteres `#` y `-`, y la imprime en la misma línea usando `\r`. Agrega un método `finish()` que imprima una nueva línea cuando termine.

**Código funcional:**

Agrega una clase `ProgressBar` y úsala en una simulación de importación por lotes:

```python
import time


class ProgressBar:
    """A simple terminal progress bar."""

    def __init__(self, total: int, label: str = "Progress"):
        self.total = total
        self.current = 0
        self.label = label
        self.bar_width = 30

    def update(self, increment: int = 1) -> None:
        """Advance the progress bar by the given amount."""
        self.current = min(self.current + increment, self.total)
        percent = self.current / self.total if self.total > 0 else 1
        filled = int(self.bar_width * percent)
        bar = "#" * filled + "-" * (self.bar_width - filled)
        sys.stdout.write(f"\r  {self.label}: [{bar}] {self.current}/{self.total}")
        sys.stdout.flush()

    def finish(self) -> None:
        """Complete the progress bar and print a newline."""
        self.current = self.total
        self.update(0)
        sys.stdout.write("\n")
        sys.stdout.flush()
```

Agrega un subcomando `cmd_import` y un generador de archivos de datos de muestra:

```python
def generate_sample_data(filename: str, count: int = 50) -> None:
    """Generate a sample tasks file for import."""
    import random

    titles = [
        "Review pull request", "Write documentation", "Fix login bug",
        "Deploy to staging", "Update dependencies", "Run test suite",
        "Clean up unused imports", "Refactor database queries",
        "Add error handling", "Write unit tests",
    ]
    priorities = ["low", "medium", "high"]
    categories = ["work", "personal", "urgent", "learning"]

    tasks = []
    for _ in range(count):
        tasks.append({
            "title": random.choice(titles),
            "priority": random.choice(priorities),
            "category": random.choice(categories),
        })

    with open(filename, "w") as f:
        json.dump(tasks, f, indent=2)
```

Agrega el subcomando import a `build_parser`:

```python
    # import (new subcommand)
    import_p = sub.add_parser("import", help="Import tasks from a JSON file")
    import_p.add_argument("file", help="JSON file with tasks to import")
    import_p.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be imported without saving",
    )
```

Agrega el manejador de importación:

```python
def cmd_import(args):
    """Import tasks from a JSON file with a progress bar."""
    try:
        with open(args.file) as f:
            new_tasks = json.load(f)
    except FileNotFoundError:
        print(colored(f"  Error: file '{args.file}' not found.", Color.RED))
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(colored(f"  Error: invalid JSON in '{args.file}': {e}", Color.RED))
        sys.exit(1)

    if not isinstance(new_tasks, list):
        print(colored("  Error: expected a JSON array of tasks.", Color.RED))
        sys.exit(1)

    print(f"  Importing {len(new_tasks)} tasks from {args.file}...")
    progress = ProgressBar(len(new_tasks), label="Importing")

    existing = load_tasks() if not args.dry_run else []
    imported = 0

    for task in new_tasks:
        # Validate each task before importing
        try:
            validate_task_input(
                task.get("title", ""),
                task.get("priority", "medium"),
                task.get("category", "general"),
            )
            cleaned = {
                "title": task["title"].strip(),
                "priority": task.get("priority", "medium"),
                "category": task.get("category", "general"),
                "created_at": task.get("created_at", datetime.now().isoformat()),
                "done": task.get("done", False),
            }
            if not args.dry_run:
                existing.append(cleaned)
            imported += 1
        except ValueError as e:
            print(f"\n  {colored('Skipped', Color.YELLOW)}: {task.get('title', '?')} — {e}")
        progress.update()

    progress.finish()

    if not args.dry_run:
        save_tasks(existing)

    status = "would import" if args.dry_run else "imported"
    print(f"  {colored('Done!', Color.GREEN)} {status} {imported}/{len(new_tasks)} tasks.")
```

Agrega `import` al dict de comandos en `main()`:

```python
def main():
    config = Config()
    parser = build_parser(config)
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
        "import": cmd_import,
    }

    if args.command == "config":
        cmd_config(args, config)
    else:
        commands[args.command](args)
```

**🎯 Resultado esperado :**

Genera un archivo de datos de muestra:

```bash
python -c "
import json, random
titles = ['Review PR', 'Write docs', 'Fix bug', 'Deploy', 'Refactor']
priorities = ['low', 'medium', 'high']
categories = ['work', 'personal']
tasks = [{'title': random.choice(titles), 'priority': random.choice(priorities), 'category': random.choice(categories)} for _ in range(40)]
with open('sample_tasks.json', 'w') as f:
    json.dump(tasks, f, indent=2)
print('Created sample_tasks.json with 40 tasks')
"
```

Importa con una barra de progreso:

```bash
python task.py import sample_tasks.json
```

```
  Importing 40 tasks from sample_tasks.json...
  Importing: [##########################------] 34/40
```

(La barra se anima mientras se llena.)

```
  Importing: [##############################] 40/40
  Done! imported 40/40 tasks.
```

El dry run muestra lo que pasaría sin guardar:

```bash
python task.py import sample_tasks.json --dry-run
```

```
  Importing 40 tasks from sample_tasks.json...
  Importing: [##############################] 40/40
  Done! would import 40/40 tasks.
```

Las tareas con datos no válidos se omiten con una advertencia:

```bash
python -c "
import json
bad = [{'title': '', 'priority': 'high'}, {'title': 'Good task', 'priority': 'low'}]
with open('bad_tasks.json', 'w') as f:
    json.dump(bad, f)
"
python task.py import bad_tasks.json
```

```
  Importing 2 tasks from bad_tasks.json...
  Skipped: ? — Title cannot be empty or whitespace.
  Importing: [##########################------] 2/2
  Done! imported 1/2 tasks.
```

**🩹 Si sale mal :**

**La barra de progreso no se anima.** `sys.stdout.write("\r...")` solo funciona si stdout es un terminal. Si estás ejecutando en un panel de salida de IDE o redirigiendo a un archivo, el carácter `\r` se trata como literal y la barra aparece en líneas separadas. Ejecuta desde un terminal real.

**El texto de la barra de progreso se superpone con la salida anterior.** Si imprimes algo después de llamar a `update()` pero antes de `finish()`, la línea de la barra de progreso se mezcla con la nueva salida. Siempre llama a `finish()` antes de imprimir algo más.

**La importación es demasiado rápida para ver la barra de progreso.** Para archivos pequeños, la importación termina al instante. Para ver la barra animarse al probar, agrega `time.sleep(0.02)` dentro del bucle de importación. No dejes el sleep en el código de producción.

**Los conteos de la barra de progreso están mal.** El `min()` en `update()` evita que la barra exceda el 100%. Si el conteo está mal, verifica que `len(new_tasks)` coincida con el número de elementos en el bucle.

**✅ Lista de verificación**

- `python task.py import sample_tasks.json` muestra una barra de progreso animada que se llena de izquierda a derecha.
- La barra llega a `[##############################]` al completarse.
- `--dry-run` importa sin guardar en `tasks.json`.
- Las tareas no válidas en el archivo de importación se omiten con una advertencia, y el conteo refleja solo las importaciones válidas.
- La barra de progreso no deja caracteres `\r` huérfanos ni nuevas líneas extra.
- `python task.py import nonexistent.json` produce un error claro de archivo no encontrado.

**🤔 Pregunta(s) socrática(s)**

¿Por qué la barra de progreso usa `\r` (retorno de carro) en lugar de imprimir una nueva línea por cada actualización? ¿Cómo se vería la salida si imprimiera 40 líneas separadas en lugar de sobrescribir una?

## Desafíos

<details>
<summary><strong>Desafío 1: Marca las tareas como hechas</strong></summary>

Agrega un subcomando `done` que tome un índice de tarea y la marque como completa. Actualiza `cmd_list` para mostrar una marca de verificación o tachado para las tareas hechas. Maneja los casos límite: tareas ya hechas, índices no válidos.

</details>

<details>
<summary><strong>Desafío 2: Fechas de vencimiento y detección de vencidas</strong></summary>

Agrega un flag `--due` al subcomando `add` que acepte una cadena de fecha (YYYY-MM-DD). Al listar tareas, resalta las vencidas en rojo y las que vencen hoy en amarillo. Usa `datetime.strptime` para parsear fechas y compararlas con hoy.

</details>

<details>
<summary><strong>Desafío 3: Salida de ayuda en color</strong></summary>

Sobrescribe el formateador de ayuda por defecto de `argparse` para producir texto de ayuda en color. Los subcomandos deben aparecer en cian, los flags opcionales en amarillo y las descripciones en el color por defecto. Esto requiere escribir una subclase personalizada de `argparse.HelpFormatter`.

</details>

## Objetivos avanzados

- [ ] Agrega un subcomando `stats` que muestre los conteos de tareas por prioridad y categoría.
- [ ] Implementa la edición de tareas: `task edit 3 --title "New title" --priority low`.
- [ ] Construye un comando `task export --format csv` que escriba tareas en un archivo CSV.
- [ ] Agrega generación de completado de shell para bash y zsh.
- [ ] Implementa un comando `task log` que muestre un historial de operaciones de añadir/eliminar.

## Lo que acabas de construir

Un framework CLI reutilizable en Python puro: enrutamiento de subcomandos con `argparse`, salida de terminal en color usando códigos ANSI, validación de entrada con mensajes de error claros, soporte de archivos de configuración JSON y una barra de progreso para operaciones por lotes. Cada pieza usa solo la biblioteca estándar — sin Click, sin Typer, sin dependencias de terceros.

Los patrones aquí escalan directamente a herramientas de producción. Los subcomandos de `argparse` son cómo `pip`, `git` y `docker` estructuran sus CLIs. La validación de entrada en el límite evita que los datos malos lleguen a tu capa de almacenamiento. Los archivos de configuración separan las preferencias del usuario del código. Los indicadores de progreso convierten operaciones opacas en transparentes. Entender estos bloques de construcción significa que puedes construir cualquier herramienta CLI — y saber *por qué* existe cada parte.

## A dónde ir desde aquí

- **Cambia a Click o Typer.** Ahora que entiendes la mecánica cruda, explora cómo los frameworks de nivel superior automatizan el parseo de argumentos, la validación y la generación de ayuda. Apreciarás lo que hacen porque lo has construido a mano.
- **Agrega un backend de base de datos.** Reemplaza el archivo JSON con SQLite para acceso concurrente, consultas y mejor rendimiento en listas de tareas grandes.
- **Construye un sistema de plugins.** Carga subcomandos adicionales desde archivos Python en un directorio `plugins/`, similar a la versión original de este proyecto.
- **Agrega un modo interactivo.** Un comando `task interactive` que lea comandos en un bucle — como un REPL — sin relanzar el proceso cada vez.
- **Escribe tests.** Usa `unittest` o `pytest` para probar cada subcomando llamando directamente a las funciones manejadoras con namespaces de `argparse` simulados.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador.