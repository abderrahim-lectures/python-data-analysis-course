---
title: "Rastreador de Tiempo"
description: "Rastrea el tiempo dedicado a tareas con sesiones de inicio y parada, entradas manuales, reportes diarios y semanales y un resumen de tareas principales, todo persistido a CSV con la biblioteca estándar."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "csv", "productivity"]
learningObjectives:
  - Modelar una entrada de tiempo y persistir las entradas a CSV
  - Rastrear una sesión con marcas de tiempo de inicio y parada
  - Calcular duraciones a partir de dos marcas de tiempo
  - Reportar totales diarios y semanales
  - Resumir el tiempo dedicado por tarea
prerequisites:
  - "Fundamentos de Python (funciones, listas, diccionarios)"
  - "Comodidad con los fundamentos de date y datetime"
  - "Opcional: un poco de experiencia ejecutando scripts desde la terminal"
---

# 🛠️ ⏱️ Rastreador de Tiempo

Nadie sabe a dónde va un día de trabajo hasta que lo registra. Este proyecto construye un rastreador de tiempo diminuto: inicia una sesión, trabaja, detenla y los minutos aterrizan en un CSV; añade una entrada perdida a mano, luego extrae reportes diarios y semanales y un resumen de "top 3 tareas". Es solo biblioteca estándar, dataclasses, `csv` y `datetime`, así que aprenderás el ritmo de cargar/añadir/guardar y matemática real de marcas de tiempo, y terminarás con una herramienta para responder "¿a dónde va realmente mi tiempo?"

Esto asume Python 101 y comodidad con los fundamentos de `datetime`, no se requiere nada más allá de eso. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Modelar una entrada de tiempo y persistir una lista de entradas a CSV.
2. Iniciar y detener una sesión, calculando su duración automáticamente.
3. Añadir una entrada perdida a mano y listar el trabajo reciente.
4. Reportar totales por día y por semana.
5. Resumir a dónde fue el tiempo, por tarea.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal, y honesta. Todo el valor de un rastreador de tiempo es *persistencia más tu reloj real*, y ambos necesitan un disco y un `datetime.now()` que signifique algo. Ejecútalo en tu propia máquina.

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada celda de código perfectamente bien (biblioteca estándar pura), y el notebook refleja cada paso con un ejemplo sembrado. La salvedad honesta: el sistema de archivos efímero y el reloj en sandbox de un notebook lo convierten en un camino de prueba, el `.csv` de *tus sesiones* no sobrevivirá, y `datetime.now()` en un notebook sigue siendo un reloj real si lo quieres. Usa las insignias para ver la lógica y cambia a `uv` local para la herramienta a la que confías tu semana.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-tracker/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-tracker/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftime-tracker%2Fnotebook.es.ipynb)

## Configuración

Crea el proyecto. El rastreador usa solo la biblioteca estándar, así que no hay nada que instalar.

```bash
uv init time-tracker
cd time-tracker
```

```bash
uv run python -c "import csv, json; from datetime import datetime; print('ok')"
```

`csv` es tu capa de persistencia, un `entries.csv` legible por humanos que Excel o cualquier editor de texto puede abrir. `json` no es estrictamente requerido aquí, pero aparece en los ejemplos del notebook para datos tipo configuración, y `datetime` es el módulo que convierte dos momentos de reloj de pared en "minutos trabajados".

**✅ Lista de verificación**

- ✅ `uv init time-tracker` creó una carpeta con un `pyproject.toml`.
- ✅ La comprobación de import imprime `ok`, cero paquetes añadidos.

## Paso 1: Modela una entrada de tiempo y persístela a CSV

Cada comando de esta herramienta lee y escribe la misma tienda. Primero necesitas una forma para una entrada, una tarea, un momento de inicio, un momento de fin opcional y una duración calculada, más un par guardar/cargar alrededor de un archivo CSV.

### 1.1 Crea el dataclass `Entry` y la tienda CSV

**👟 Pista inicial :** Define un dataclass `Entry` con `id`, `task`, `start`, `end`, `minutes`; luego carga vía `csv.DictReader` y guarda vía `csv.DictWriter` más `asdict`.

```python
# tracker.py
import csv
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

FILE = "entries.csv"
FIELDS = ["id", "task", "start", "end", "minutes"]

@dataclass
class Entry:
    id: int
    task: str
    start: str        # ISO-like: "2026-09-06 09:15" or "manual"
    end: str = ""
    minutes: int = 0

def load_entries() -> list[Entry]:
    """Load all entries from entries.csv, or [] if the file doesn't exist."""
    if not Path(FILE).exists():
        return []
    with open(FILE, newline="") as f:
        return [Entry(**row) for row in csv.DictReader(f)]

def save_entries(entries: list[Entry]) -> None:
    """Write all entries to entries.csv."""
    with open(FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(asdict(e) for e in entries)

print(load_entries())
```

`csv.DictWriter` con `fieldnames=FIELDS` escribe una fila de encabezado que `csv.DictReader` luego mapea de vuelta sobre cada fila futura, así el propio archivo documenta el esquema, y `Entry(**row)` reconstruye los objetos con cero parseo de cadenas manual. `asdict(e)` convierte cada dataclass en un dict simple, que es exactamente lo que quiere `writerows`. Almacenar las marcas de tiempo como cadenas ISO-like (`"2026-09-06 09:15"`) mantiene el archivo buscable y se ordena léxicamente por fecha, el orden cronológico es gratuito hasta que el Paso 4 necesite parseo real.

**🎯 Resultado esperado :** `[]` en un proyecto fresco, una lista de entradas vacía, sin bloqueo.

**🩹 Si sale mal :** Si `csv.DictReader` devuelve filas vacías, falta la fila de encabezado de `writeheader()` así que las claves no existen. Si `Entry(**row)` lanza `TypeError`, a una fila guardada le falta uno de los cinco `FIELDS`. Si los números llegan como cadenas (`id: "1"`), eso es normal para CSV, la conversión a int puede ocurrir en el sitio de uso o vía un paso `Entry(**{...cast...})`.

### 1.2 Verifica la tienda

**✅ Lista de verificación**

- ✅ `uv run python tracker.py` imprime `[]` en una ejecución fresca.
- ✅ Guardar una `Entry`, y luego `load_entries()`, hace un round-trip de los cinco campos.
- ✅ Puedes afirmar qué hace `asdict(e)` y por qué importa `fieldnames`.

**🤔 Pregunta(s) socrática(s)**

- El CSV almacena `end` como una cadena vacía para una sesión en ejecución. ¿Por qué es esa una representación *mejor* que almacenar un centinela como `-1` para "aún en curso", y qué se rompe en el Paso 4 si se cuela un centinela?
- `writerows(asdict(e) for e in entries)` escribe cada entrada, cada vez. ¿Cuál es el escenario exacto donde ese enfoque de reemplazo total pierde datos, y qué cambiarías para añadir en su lugar?

## Paso 2: Inicia y detén una sesión

El corazón de un rastreador de tiempo: `start` estampa una entrada con el momento actual; `stop` encuentra la sesión en ejecución, estampa su fin y calcula la duración.

### 2.1 Escribe `start_task`, `stop_active` y `compute_minutes`

**👟 Pista inicial :** Rastrea la hora actual con un `datetime.now()` por estampa, encuentra la entrada en ejecución escaneando un `end` vacío y calcula los minutos como `(end - start) // 60s`.

```python
# tracker.py (continuación)
def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")

def next_id(entries: list[Entry]) -> int:
    return max((e.id for e in entries), default=0) + 1

def start_task(entries: list[Entry], task: str) -> None:
    entries.append(Entry(id=next_id(entries), task=task, start=now_str()))
    save_entries(entries)
    print(f"started #{entries[-1].id}: {task} at {entries[-1].start}")

def compute_minutes(start: str, end: str) -> int:
    start_t = datetime.strptime(start, "%Y-%m-%d %H:%M")
    end_t = datetime.strptime(end, "%Y-%m-%d %H:%M")
    return max(0, int((end_t - start_t).total_seconds() // 60))

def stop_active(entries: list[Entry]) -> None:
    for e in reversed(entries):
        if e.end == "":
            e.end = now_str()
            e.minutes = compute_minutes(e.start, e.end)
            save_entries(entries)
            print(f"stopped #{e.id}: {e.task} ({e.minutes} min)")
            return
    print("nothing is running.")

stop_active(load_entries())
```

`now_str()` normaliza el reloj de pared en el mismo formato `"%Y-%m-%d %H:%M"` que eligió el Paso 1, así que las estampas de inicio y fin siempre se parsean de vuelta. `stop_active` escanea la lista *en reversa* para agarrar primero la sesión en ejecución más reciente. La línea clave es `compute_minutes`: `strptime` parsea ambas estampas en objetos `datetime` reales, restarlos produce un `timedelta`, y `.total_seconds() // 60` convierte a minutos enteros, con `max(0, ...)` como guard para que un reloj movido manualmente hacia atrás no pueda producir tiempo negativo.

**🎯 Resultado esperado :** En una ejecución fresca `nothing is running.` Después de `start_task(load_entries(), "Learn dataclasses")` y luego `stop_active(...)`, una línea `stopped #1: Learn dataclasses (N min)` donde N son los minutos reales transcurridos.

**🩹 Si sale mal :** Si `strptime` lanza `ValueError`, una estampa almacenada no está en forma `%Y-%m-%d %H:%M` (meses vs nombres de mes son el desajuste clásico). Si detener reporta `0 min` incluso después de pasar tiempo real, ambas estampas vinieron de la misma llamada a `now_str()`, cada estampa debe llamarla por separado. Si el escaneo `reverse` detiene la sesión equivocada, el `end` de una entrada completada no es realmente `""`; las sesiones más antiguas necesitan limpieza o el bucle necesita comprobar primero la entrada *última*.

### 2.2 Verifica inicio/parada

**✅ Lista de verificación**

- ✅ Un inicio y luego una parada hacen un round-trip escribiendo `start`, `end` y un `minutes` positivo en el CSV.
- ✅ Iniciar dos sesiones y detener una vez deja exactamente una entrada en ejecución.
- ✅ `stop_active` en una lista completamente detenida imprime `nothing is running.`

**🤔 Pregunta(s) socrática(s)**

- `start_task` no rechaza nada, puedes iniciar una segunda sesión mientras una corre. ¿Qué le pasaría al escaneo de `stop_active` si un usuario iniciara dos y detuviera una, y qué regla añadirías en el momento de `start` para prevenirlo?
- La duración usa minutos enteros, truncando los segundos (`// 60`). Cuando una sesión dura 2 minutos 59 segundos, ¿qué afirma el reporte, y es esa una corrección de redondeo o un diseño razonable para un rastreador humano?

## Paso 3: Añade entradas a mano y listalas

Las sesiones se olvidan. Este paso añade el camino de entrada manual, `add` te deja registrar una tarea y los minutos directamente, con `start="manual"`, y una vista `list` que muestra tus entradas más recientes.

### 3.1 Escribe `add_manual` y `list_entries`

**👟 Pista inicial :** Construye una `Entry` con `minutes` proporcionado y `start="manual"` (un marcador deliberado), y lista las entradas ordenadas más-recientes-primero con un formato legible de una línea.

```python
# tracker.py (continuación)
from datetime import timedelta

def add_manual(entries: list[Entry], task: str, minutes: int) -> None:
    entries.append(Entry(id=next_id(entries), task=task,
                         start="manual", minutes=int(minutes)))
    save_entries(entries)
    print(f"added #{entries[-1].id}: {task} ({minutes} min)")

def list_entries(entries: list[Entry], n: int = 8) -> None:
    recent = sorted(entries, key=lambda e: e.id, reverse=True)[:n]
    for e in recent:
        when = e.start[:10] if e.start != "manual" else "manual"
        marker = f"{e.minutes:>4} min" if e.minutes else "running"
        print(f"#{e.id:>3}  {marker:>7}  {e.task:<24} {when}")

add_manual(load_entries(), "Write tracker docs", 25)
list_entries(load_entries())
```

`start="manual"` es un centinela deliberado, marca una entrada *sin* un reloj de sesión real, y el Paso 4 se ramificará sobre él. Almacenar un `minutes` simple para las entradas manuales es el intercambio honesto: registraste el número directamente, así que no hay matemática de marcas de tiempo que rehacer. Ordenar por `e.id` descendente da la ordenación más-recientes-primero de forma gratuita (los ids son monótonos), y la columna de formato `{e.minutes:>4}` alinea a la derecha los números para que una lista mixta de `running`/`25 min` se lea limpiamente.

**🎯 Resultado esperado :** `added #1: Write tracker docs (25 min)`, y luego una salida de `list` con `25 min` visible y un marcador `manual` en la columna de fecha.

**🩹 Si sale mal :** Si `int(minutes)` lanza con `"25"` vs `25`, el código llamante pasó una cadena, haz el cast una vez en el límite. Si las entradas manuales muestran `0 min`, el cast `int` corrió antes de que aterrizara la asignación del dataclass. Si el listado no es más-recientes-primero, la clave de ordenación `reverse=True` está invertida.

### 3.2 Verifica la entrada manual y el listado

**✅ Lista de verificación**

- ✅ `add_manual(...)` persiste una entrada con `start="manual"` y los minutos correctos.
- ✅ `list_entries` muestra las sesiones manuales y cronometradas en una vista legible.
- ✅ Truncar a `n=3` nunca se lanza en un archivo de 1 entrada.

**🤔 Pregunta(s) socrática(s)**

- Una entrada manual no tiene inicio/fin, y sin embargo comparte el tipo `Entry`. ¿Qué lógica de reporte se vuelve *más simple* porque las entradas manuales se declaran a sí mismas con `"manual"`, y qué podría salir mal si nunca validaras ese centinela?
- `list_entries` muestra `running` para minutes==0. ¿Es ese marcador confiable, y cuándo tendría una entrada legítima también exactamente 0 minutos?

## Paso 4: Reporta totales diarios y semanales

Los reportes convierten las entradas crudas en el resumen que una auditoría de tiempo realmente lee: cuántos minutos este día, esta semana. La disciplina clave, omitir las entradas `"manual"` al dividir por fecha, se enseña de frente porque los datos reales no siempre serán ordenados.

### 4.1 Escribe los reportes diarios y semanales

**👟 Pista inicial :** Para los reportes basados en fecha, parsea cada `start` real, agrupa los minutos por fecha (diario) o por ISO `(year, week)` (semanal); mantén las entradas manuales fuera de ambos.

```python
# tracker.py (continuación)
from collections import defaultdict

def daily_total(entries: list[Entry]) -> dict:
    total = defaultdict(int)
    for e in entries:
        if e.start == "manual":
            continue
        day = datetime.strptime(e.start, "%Y-%m-%d %H:%M").date()
        total[day] += e.minutes
    return dict(total)

def weekly_total(entries: list[Entry]) -> dict:
    total = defaultdict(int)
    for e in entries:
        if e.start == "manual":
            continue
        day = datetime.strptime(e.start, "%Y-%m-%d %H:%M").date()
        y, w, _ = day.isocalendar()
        total[(y, w)] += e.minutes
    return dict(total)

for day, minutes in sorted(daily_total(load_entries()).items()):
    print(day.isoformat(), minutes, "min")
print("---")
for (y, w), minutes in sorted(weekly_total(load_entries()).items()):
    print(f"{y}-W{w:02d}", minutes, "min")
```

El `if e.start == "manual": continue` en la parte superior de ambas funciones es el diseño: el `start` de una entrada manual es el centinela, no una fecha, así que parsearlo lanzaría, omitirlo hace que el reporte sea robusto *y* honesto (los minutos aún se cuentan en otro lugar, en el resumen de tareas del Paso 5). `defaultdict(int)` hace que "añadir minutos a una fecha quizá no vista" sea una línea en lugar de un baile de `get`. `day.isocalendar()` devuelve `(ISO-year, ISO-week, weekday)`, agrupar en los dos primeros es la forma estándar de decir "esta semana" a través de los límites de año.

**🎯 Resultado esperado :** Una fila por cada fecha de sesión real y una por cada semana ISO, con los minutos sumados, con las entradas manuales ausentes de ambas tablas y sin `ValueError`.

**🩹 Si sale mal :** Si una entrada `Manual` bloquea el reporte, falta el guard `continue` o está comprobando `e.keyword` escrito de forma diferente a `"manual"`. Si el total de una semana desaparece en la víspera de Año Nuevo, los bordes `(y, w)` de `day.isocalendar()` no se alinean con el año calendario, esa es la peculiaridad estándar horneada en las semanas ISO, no un error. Si todo se suma en un día gigante, no se llamó a `day.isocalendar()` y la agrupación colapsó sobre la tupla `(y, w)` completa.

### 4.2 Verifica los reportes

**✅ Lista de verificación**

- ✅ Las tablas diarias y semanales se imprimen sin bloquearse, con las entradas manuales excluidas.
- ✅ Sumar las sesiones de un día conocido coincide con lo que escribiste.
- ✅ Puedes explicar el trío `(year, week)` de `isocalendar()` y por qué "semana" es ambiguo.

**🤔 Pregunta(s) socrática(s)**

- Estos reportes mantienen las entradas manuales completamente fuera. ¿Por qué ocultarlas es una elección *peor* para una auditoría de tiempo real que mostrarlas bajo un bucket explícito `(manual)`, y qué imprimirías para hacer visible la omisión?
- Una sesión que empieza el lunes a las 23:50 y termina el martes a las 00:40 se divide por **hora de inicio** en el lunes. ¿Qué reportes merecen un división por minuto entre días, y por qué eso solo importa en la granularidad diaria?

## Paso 5: Construye el resumen de tareas principales y el enrutador CLI

La última función responde a la pregunta que empezó el proyecto: *¿a dónde fue mi tiempo?*, más un pequeño enrutador de comandos para que cada función sea alcanzable desde la terminal con una palabra.

### 5.1 Escribe `summarize` y el enrutador `main`

**👟 Pista inicial :** Agrega los minutos por tarea en todas las entradas (las manuales incluidas, son trabajo real), y enruta `start` / `stop` / `add` / `list` / `daily` / `weekly` / `summary` desde `sys.argv`.

```python
# tracker.py (continuación)
import sys

def summarize(entries: list[Entry], n: int = 3) -> None:
    by_task = defaultdict(int)
    for e in entries:
        by_task[e.task] += e.minutes
    print("top", n, "tasks by time:")
    for task, minutes in sorted(by_task.items(), key=lambda x: x[1], reverse=True)[:n]:
        print(f"  {minutes:>5} min  {task}")
    print(f"  TOTAL {sum(by_task.values())} min across {len(by_task)} tasks")

def main() -> None:
    args = sys.argv[1:]
    entries = load_entries()
    cmd = args[0] if args else "list"
    if cmd == "start":
        start_task(entries, args[1])
    elif cmd == "stop":
        stop_active(load_entries())
    elif cmd == "add":
        add_manual(entries, args[1], int(args[2]))
    elif cmd == "list":
        list_entries(entries)
    elif cmd == "daily":
        for day, m in sorted(daily_total(entries).items()):
            print(day.isoformat(), m, "min")
    elif cmd == "weekly":
        for (y, w), m in sorted(weekly_total(entries).items()):
            print(f"{y}-W{w:02d}", m, "min")
    elif cmd == "summary":
        summarize(entries)
    else:
        print("commands: start <task> | stop | add <task> <min> | list | daily | weekly | summary")

if __name__ == "__main__":
    main()
```

`summarize` deliberadamente cuenta las entradas manuales junto a las cronometradas, a diferencia de los reportes de fecha, porque "la tarea tomó 125 minutos en total" es verdad ya sea que viniera de un cronómetro o de una nota. El enrutador es intencionalmente delgado: cada comando una línea, cada uno reutilizando las mismas `entries` cargadas. Observa que `stop_active(load_entries())` recarga en lugar de mutar la copia del llamante, una asimetría deliberada para que "stop" siempre vea el estado de disco más fresco, y un buen ejemplo de por qué los enrutadores de comandos recargan en cada límite.

**🎯 Resultado esperado :** `uv run python tracker.py summary` imprime las tareas principales con minutos más un total; cada otro comando de arriba funciona de forma idéntica desde un shell.

**🩹 Si sale mal :** Si `summary` muestra el `TOTAL 0` vacío, el archivo cargado no tiene entradas o `e.minutes` se está leyendo como una cadena, las cadenas CSV necesitan un cast `int()` en el bucle de resumen. Si `start` con dos palabras como `"Learn dataclasses"` consume solo `args[1]`, necesitas `" ".join(args[1:])` para tareas de varias palabras. Si `stop` desde la CLI no afecta la sesión interactiva, los dos están sosteniendo listas diferentes, recarga después de cualquier escritura.

### 5.2 Verifica el rastreador terminado

**✅ Lista de verificación**

- ✅ `uv run python tracker.py summary` imprime las tareas principales y un total.
- ✅ `start` / `stop` / `add` / `list` / `daily` / `weekly` responden todos desde la terminal.
- ✅ Las entradas manuales cuentan en `summary` pero se excluyen de `daily`/`weekly`.
- ✅ Has registrado tú mismo al menos una sesión real y una entrada manual.

**🤔 Pregunta(s) socrática(s)**

- El enrutador recarga para cada comando; `stop` incluso recarga dos veces. ¿Qué **error de datos obsoletos** aparecería si el enrutador compartiera una lista entre dos comandos (p. ej., `add` y luego inmediatamente `list`), y por qué es recargar-por-comando la inmunidad barata contra eso?
- `summary` clasifica las tareas por minutos totales, así que una sesión de 5 horas supera a ocho de 30 minutos. ¿Qué graficarías en su lugar para mostrar *consistencia* en lugar de masa bruta, y qué cambiaría para un usuario que quiere ambas?

## ⚠️ Errores comunes

- **Estampas en formatos incompatibles.** `now_str()` escribe `%Y-%m-%d %H:%M`; si cualquier CSV editado a mano usa `%m/%d/%Y`, `strptime` lanza. Solución: una constante de formato, usada tanto por el escritor como por cada parser.
- **Estampar dos veces una sesión.** Llamar a `now_str()` una vez y reutilizar el valor para `start` *y* `end` produce una sesión de 0 minutos después de un tiempo real transcurrido. Solución: estampa cada marca de tiempo en su propio momento.
- **Entradas manuales con un `start` que parece real.** Si las entradas manuales reutilizan la hora actual en lugar de `"manual"`, los totales diarios afirman en silencio que un 25 minutos pegado sucedió hoy. Solución: mantén el centinela `"manual"`, no la fecha de hoy.
- **Contar cadenas como números.** CSV entrega todo como cadenas; `sum(by_task.values())` sobre minutos-cadena concatena (`"25" + "10"` = `"2510"`). Solución: cast `int()` una vez en la carga o en `summarize`.
- **Una lista compartida entre comandos.** Mutar la misma lista de Python en `add` y luego leerla en `list` sin re-guardar/recargar produce vistas obsoletas. Solución: recarga en cada límite de comando como hace `main`.

## Lo que acabas de construir

Un rastreador de tiempo funcional respaldado por CSV: seguimiento de sesiones de inicio/parada con matemática real de marcas de tiempo, entrada manual, reportes diarios y semanales ISO y un resumen de tareas principales enrutado por completo a través de una CLI de una palabra. La habilidad transferible es *registrar la realidad en lugar de adivinarla*: el mismo patrón de "estampa un momento, almacena una fila, agrega grupos" alimenta registros de hábitos, worklogs de jira, historiales de entrega de paquetes, cualquier pregunta con la forma "cuánto, y cuándo, y para qué?"

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/time-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/time-tracker) en el repo del curso es una versión más completa del código anterior, con un libro mayor editable y una opción de resumen día-a-día. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Añade `edit <id> <minutes>` para que una sesión olvidada pueda arreglarse en el lugar, reutilizando el patrón cargar-modificar-guardar del Paso 1.
- Renderiza el reporte diario como un gráfico de barras de texto (`10 min ██`) para que las tendencias sean visibles de un vistazo sin ninguna biblioteca de trazado.
- Divide las sesiones a través de la medianoche para que un bloque de 23:50–00:40 contribuya a ambos días, la corrección honesta de la pregunta socrática del Paso 4.
- Escribe los totales semanales a un `report.csv` que tu documento de facturación pueda importar, cerrando el bucle que la propuesta prometió originalmente.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
