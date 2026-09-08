---
title: "Panel de Soporte al Cliente"
description: "Gestiona tickets de soporte con enrutamiento, seguimiento de SLA, respuestas predefinidas y métricas de satisfacción."
difficulty: "beginner"
estimatedMinutes: 55
tags: ["cli", "csv", "dataclasses", "stdlib"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, diccionarios)"
learningObjectives:
  - "Modelar tickets como dataclasses y ordenar una cola por prioridad"
  - "Enrutar tickets a agentes por coincidencia de habilidades y carga de trabajo"
  - "Rastrear tiempos de respuesta y resolución contra límites de SLA a partir de registros CSV"
  - "Calcular puntuaciones CSAT por agente a partir de datos de encuestas"
  - "Imprimir un informe resumido combinado de soporte"
---

# 🎧 Construir un Panel de Soporte al Cliente

La realidad de un equipo de soporte llega como un flujo de eventos *desordenados* — una queja de facturación frenética, un soñoliento "¿cómo restablezco mi contraseña?", un deseo de funcionalidad — y todo el arte de las herramientas de soporte es imponer orden a ese flujo: qué ticket recibe un agente primero, qué agente es siquiera *capaz* de manejarlo, si el equipo está respondiendo dentro de su promesa de tiempo de respuesta, y si los clientes están realmente satisfechos. Este proyecto construye el motor detrás de un panel de soporte — una cola de prioridad para tickets, enrutamiento por habilidad y carga, detección de violaciones de SLA medida en horas desde un archivo de registro real, y un resumen de CSAT, todo renderizado en un informe de terminal único.

Esto asume Python 101 — funciones, diccionarios, listas e importar el módulo estándar `csv`. No se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Modelar tickets como dataclasses con una enumeración de prioridad y sacar la prioridad más alta de una cola.
2. Enrutar cada ticket al agente libre cuyas habilidades coinciden con su asunto, recurriendo al menos ocupado.
3. Medir tiempos de respuesta y resolución desde un registro CSV y marcar cada violación de SLA.
4. Calcular promedios de CSAT por agente desde un CSV de encuestas.
5. Imprimir un informe combinado: violaciones + satisfacción de los agentes en una sola lectura.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — este proyecto lee archivos CSV reales del disco, y todo es la biblioteca estándar, así que la configuración es un solo comando.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan bien para la lógica de la cola y el enrutamiento — el notebook en [`examples/customer-support/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.ipynb) ejecuta cada función sobre CSVs de muestra incluidos. La limitación honesta: los archivos CSV del notebook son muestras fijas, mientras que la versión local te permite alimentarle *tus* registros de soporte.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcustomer-support%2Fnotebook.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entorno virtual" — y este proyecto no tiene imports de terceros, así que la configuración es genuinamente un solo paso.

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
uv init customer-support
cd customer-support
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `customer-support/` existe con un `pyproject.toml`.
- ✅ `python -c "import csv"` se ejecuta — no se necesitan paquetes de terceros.

## Paso 1: Modelar tickets y construir una cola de prioridad

Una cola que sirve tickets en orden de *llegada* sería una buena cola pero una mala cola de soporte: un problema urgente de facturación esperaría detrás de tres solicitudes de funcionalidad. La solución es un orden de prioridad — urgente sobre alta sobre media sobre baja, con *orden de llegada dentro de la misma prioridad*, que es exactamente lo que te da un ordenamiento por un valor invertido de `Priority`.

### 1.1 Escribir el modelo de ticket y la cola

**👟 Pista inicial :** Define una enumeración `Priority` (un `IntEnum`, para que ordene numéricamente), una dataclass `Ticket`, y una `SupportQueue` que agrega en `add` y saca la `priority` más alta en `next`:

```python
# tickets.py
from dataclasses import dataclass
from enum import IntEnum

class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

@dataclass
class Ticket:
    ticket_id: int
    customer: str
    subject: str
    priority: Priority
    assigned_to: str | None = None

class SupportQueue:
    def __init__(self) -> None:
        self._items: list[Ticket] = []

    def add(self, ticket: Ticket) -> None:
        self._items.append(ticket)

    def next(self) -> Ticket | None:
        if not self._items:
            return None
        self._items.sort(key=lambda t: t.priority, reverse=True)
        return self._items.pop(0)

    def __len__(self) -> int:
        return len(self._items)

if __name__ == "__main__":
    queue = SupportQueue()
    queue.add(Ticket(1, "Ana", "Can't log in", Priority.MEDIUM))
    queue.add(Ticket(2, "Bo", "Billing charge", Priority.URGENT))
    queue.add(Ticket(3, "Cam", "Feature idea", Priority.LOW))
    while (ticket := queue.next()) is not None:
        print(f"#{ticket.ticket_id} {ticket.priority.name}: {ticket.subject}")
```

`IntEnum` justifica su existencia aquí: `Priority.URGENT > Priority.LOW` funciona *porque* es un entero por debajo, así que `sort(key=lambda t: t.priority, reverse=True)` ordena toda la lista con una sola expresión — sin comparador personalizado. El `pop(0)` dentro de `next` elimina deliberadamente el ticket servido, así que un bucle de panel "sigue sirviendo" hasta que quede vacío: el patrón `while (ticket := queue.next()) is not None` es el centinela que detiene el bucle cuando la cola finalmente devuelve `None`.

**🎯 Resultado esperado :**

```
#2 URGENT: Billing charge
#1 MEDIUM: Can't log in
#3 LOW: Feature idea
```

**🩹 Si sale mal :** Si sale primero LOW, falta el `reverse=True` — sin él, el número más bajo ordena primero. Si los tickets desaparecen entre corridas, recuerda que `next()` es *destructivo*: elimina el ticket, así que una cola vacía no imprime nada la segunda vez que recorres el bucle.

### 1.2 Verifica la cola

**✅ Lista de verificación**

- ✅ Servir la cola de muestra produce `#2`, luego `#1`, luego `#3`, en ese orden.
- ✅ `len(queue)` disminuye exactamente en uno después de cada llamada a `next()`.
- ✅ El `next()` de una cola vacía devuelve `None` en lugar de lanzar `IndexError`.

**🤔 Pregunta(s) socrática(s)**

- Dos tickets comparten `Priority.URGENT`. El código actual ordena por prioridad y saca el `índice 0` — ¿eso garantiza la preservación del *orden de llegada* entre ellos, o algo más reescribe las posiciones? Lee el par ordenar+sacar y decide.
- La cola guarda tickets en una lista simple y ordena en *cada* salida. Para un escritorio de soporte pequeño está bien — pero ¿qué operación se volvería el cuello de botella con 10,000 tickets en cola, y qué estructura de datos existe precisamente para "eliminar el máximo" sin reordenar?

## Paso 2: Enrutar tickets al agente correcto

Ordenar responde "¿qué ticket primero?"; el enrutamiento responde "¿qué *agente*?". El conjunto de restricciones real: el agente debe estar libre (bajo una carga de trabajo máxima) e idealmente *capacitado* para este ticket. La heurística pragmática es la coincidencia de texto — cuenta cuántas de las habilidades de un agente aparecen en el asunto del ticket y enruta al agente libre con mejor coincidencia.

### 2.1 Escribir `Agent` y la función `assign`

**👟 Pista inicial :** Una dataclass `Agent` con una lista de habilidades y un contador de carga de trabajo en vivo, luego `assign` que filtra a los agentes libres, los puntúa por solapamiento de habilidades con el asunto, y devuelve la mejor coincidencia:

```python
# routing.py
from dataclasses import dataclass, field

from tickets import Ticket

@dataclass
class Agent:
    name: str
    skills: list[str] = field(default_factory=list)
    active_tickets: int = 0
    max_work: int = 3

    def is_free(self) -> bool:
        return self.active_tickets < self.max_work

def assign(ticket: Ticket, agents: list[Agent]) -> Agent | None:
    """Route to the best free skill match; returns None only if every
    agent is at max_work."""
    needle = ticket.subject.lower()

    def skill_score(agent: Agent) -> int:
        return sum(1 for skill in agent.skills if skill.lower() in needle)

    free = [a for a in agents if a.is_free()]
    if not free:
        return None
    best = max(free, key=skill_score)
    best.active_tickets += 1
    return best

if __name__ == "__main__":
    agents = [
        Agent("Priya", skills=["billing", "refund"]),
        Agent("Tom", skills=["login", "password"]),
        Agent("Una", skills=["feature"]),
    ]
    subjects = ["Billing charge gone wrong", "Can't log in",
                "New feature idea", "Refund request"]
    for subject in subjects:
        ticket = Ticket(hash(subject) % 1000, "customer", subject, 2)
        agent = assign(ticket, agents)
        print(f"-> {subject!r}: {agent.name if agent else 'no free agent'}")
```

Dos decisiones se esconden en doce líneas. `skill_score` cuenta *solapamientos* en lugar de exigir una coincidencia exacta de etiqueta, así que un asunto como "Billing charge gone wrong" puntúa 1 para la habilidad `billing` aunque las palabras difieran — un comparador deliberadamente indulgente para una demo, que vale la pena revisar en cuanto las coincidencias falsas importen. `active_tickets` se incrementa cuando se asigna un ticket, así que la decisión ocupado/libre refleja la *carga de trabajo aceptada*, y `max(free, key=skill_score)` elige la mejor coincidencia puramente declarativamente, con los empates recayendo en el primer agente libre de la lista.

**🎯 Resultado esperado :**

```
-> 'Billing charge gone wrong': Priya
-> 'Can't log in': Tom
-> 'New feature idea': Una
-> 'Refund request': Priya
```

**🩹 Si sale mal :** Si *cada* ticket se enruta a Priya, `max(free, key=skill_score)` está eligiendo la suma más alta — verifica que `score` use `in needle`, no `== needle`. Si un ticket se enruta a un agente que ya está en `max_work`, el filtro `is_free()` no está en la comprensión de lista — un agente ocupado nunca es siquiera un candidato.

### 2.2 Verifica el enrutamiento

**✅ Lista de verificación**

- ✅ Los cuatro asuntos de muestra se enrutan al agente con habilidades coincidentes.
- ✅ Poner el `active_tickets` de cada agente en `max_work` hace que `assign` devuelva `None` — el caso "todos ocupados" degrada a una cola, no a un fallo.
- ✅ Después de que se asigna un ticket, el `active_tickets` de ese agente aumentó exactamente en uno.

**🤔 Pregunta(s) socrática(s)**

- El comparador de habilidades cuenta coincidencias de subcadenas. ¿Qué asunto real daría un *falso positivo* para una habilidad (pista: "password reset" contiene "pass") — y qué te costaría en esfuerzo una estrategia de coincidencia más exacta?
- `active_tickets` se incrementa en la asignación y nunca se decrementa en este proyecto. ¿Qué comportamiento se rompe si nunca liberas agentes — y dónde ocurriría ese decremento en un sistema de soporte real?

## Paso 3: Rastrear el cumplimiento de SLA en el tiempo

Las SLAs son promesas con matemática de reloj adjunta: responder en 4 horas, resolver en 24. La materia prima es un *registro* — por cada ticket, cuándo se abrió, cuándo alguien respondió por primera vez, cuándo se resolvió. Este paso convierte texto CSV en diferencias de horas y compara cada una contra la promesa.

### 3.1 Cargar el registro y medir violaciones

**👟 Pista inicial :** Escribe un `support_log.csv` de muestra con una fila por ticket, cárgalo con `csv.DictReader`, convierte marcas de tiempo con formato ISO a flotantes horarios con una pequeña función auxiliar, y compara las horas de `response`/`resolution` contra los umbrales:

```python
# sla.py
import csv
from datetime import datetime

LOG = """ticket_id,opened_at,responded_at,resolved_at
1,2026-09-01 09:00,2026-09-01 09:30,2026-09-01 10:00
2,2026-09-01 09:00,,2026-09-01 09:15
3,2026-09-01 09:00,2026-09-01 20:00,
4,2026-09-01 09:00,2026-09-01 09:05,2026-09-02 11:00
"""

def load_activity(path: str = "support_log.csv") -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def hours(ts: str, fmt: str = "%Y-%m-%d %H:%M") -> float | None:
    """Parse a timestamp to hours-since-epoch; None for an empty cell."""
    if not ts.strip():
        return None
    return datetime.strptime(ts, fmt).timestamp() / 3600

def sla_report(log: list[dict], response_sla: int = 4, resolution_sla: int = 24) -> list[str]:
    breaches = []
    for row in log:
        opened = hours(row["opened_at"])
        responded = hours(row["responded_at"])
        resolved = hours(row["resolved_at"])
        if opened is not None and responded is not None and (responded - opened) > response_sla:
            breaches.append(
                f"ticket {row['ticket_id']}: response {(responded - opened):.1f}h > {response_sla}h SLA"
            )
        if opened is not None and resolved is not None and (resolved - opened) > resolution_sla:
            breaches.append(
                f"ticket {row['ticket_id']}: resolution {(resolved - opened):.1f}h > {resolution_sla}h SLA"
            )
    return breaches

if __name__ == "__main__":
    with open("support_log.csv", "w") as f:
        f.write(LOG)
    for breach in sla_report(load_activity()):
        print(breach)
```

La política de celdas vacías es la decisión de corrección sutil: `hours("")` devuelve `None`, y cada comparación se protege con `is not None` — un ticket sin resolver es `None`, *no* cero, lo que significa que nunca reportas una violación "instantánea" falsa para un ticket que nadie ha tocado jamás. El formato `.1f` es cosmético pero significativo: alguien que lee "11.0h" ve de inmediato "más de 4h", mientras que un flotante crudo como `11.000000000000002` invita a segundas dudas innecesarias.

**🎯 Resultado esperado :**

```
ticket 3: response 11.0h > 4h SLA
ticket 4: resolution 26.0h > 24h SLA
```

**🩹 Si sale mal :** Si *cada* ticket reporta una violación con valores horarios absurdos, `hours` probablemente analizó el formato mal y `strptime` está silenciosamente... no lo está — un desajuste de formato lanza `ValueError`. Si nada viola incluso para el ticket 3, verifica si `LOG` realmente contiene el `responded_at` del ticket 3 de `2026-09-01 20:00`, y que el archivo se reescribió antes de que `load_activity` lo lea.

### 3.2 Verifica las matemáticas del SLA

**✅ Lista de verificación**

- ✅ Exactamente dos violaciones se imprimen: respuesta del ticket 3, resolución del ticket 4.
- ✅ La celda de respuesta *vacía* del ticket 2 no produce una violación de respuesta — un ticket aún sin responder no es una infracción instantánea.
- ✅ Conversión: `hours("2026-09-02 11:00") - hours("2026-09-01 09:00")` es igual a `26.0`.

**🤔 Pregunta(s) socrática(s)**

- Un ticket sin responder tiene `responded_at=""`, así que el tiempo de respuesta es `None` — pero espera, ¿un ticket sin responder está *violando ahora mismo* o meramente *sin ser medible ahora mismo*? ¿Cuál elección es más honesta, y qué afirmaría de forma incorrecta una implementación que trata el vacío como `0`?
- `sla_report` fija las promesas como argumentos predeterminados. ¿Qué cambia sobre la utilidad de la función si un SLA *por ticket* (prioridad URGENTE obtiene 1 hora, BAJA obtiene 24) reemplaza al umbral único — y qué capa debería poseer ese mapeo?

## Paso 4: Calcular CSAT desde encuestas

El rendimiento no dice nada sobre los *sentimientos*; la CSAT (satisfacción del cliente) sí — típicamente una encuesta posterior al ticket donde un cliente califica de 1 a 5. La agregación honesta promedia por agente para que el informe responda tanto "¿cómo estamos en general?" como "¿quién está sosteniendo la calificación?".

### 4.1 Cargar encuestas y resumirlas por agente

**👟 Pista inicial :** Un `csat.csv` de filas de encuesta `agent,rating`, cargado con `csv.DictReader`, agrupado con `defaultdict(list)`, luego promediado por agente:

```python
# csat.py
import csv
from collections import defaultdict

SURVEYS = """agent,rating
Priya,5
Tom,4
Priya,4
Una,3
Tom,5
Priya,5
"""

def load_surveys(path: str = "csat.csv") -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def summarize(surveys: list[dict]) -> dict[str, float]:
    per_agent: dict[str, list[int]] = defaultdict(list)
    for row in surveys:
        per_agent[row["agent"]].append(int(row["rating"]))
    return {name: sum(vals) / len(vals) for name, vals in per_agent.items()}

if __name__ == "__main__":
    with open("csat.csv", "w") as f:
        f.write(SURVEYS)
    for agent, avg in summarize(load_surveys()).items():
        print(f"{agent}: {avg:.1f}/5")
```

`defaultdict(list)` elimina toda la ceremonia de `if agent not in per_agent: per_agent[agent] = []`: agregar a una clave que no existe crea automáticamente una lista. La comprensión de una línea a la salida convierte cada lista en su media. El molde `int(row["rating"])` es toda la apuesta de "confiar en el archivo": el CSV te da *strings*, y dividir un string haría fallar un `sum` plano; el molde mueve ese fallo al punto de carga donde es legible.

**🎯 Resultado esperado :**

```
Priya: 4.7/5
Tom: 4.5/5
Una: 3.0/5
```

**🩹 Si sale mal :** Si aparece un `TypeError: unsupported operand type(s) for/: 'int' and 'str'`, una celda de calificación está sin el molde `int(...)`. Si el promedio de Priya se ve mal, verifica que *las tres* de sus filas de encuesta (5, 4, 5) llegaron al CSV — una línea faltante cambia silenciosamente la media.

### 4.2 Verifica la CSAT

**✅ Lista de verificación**

- ✅ `summarize(load_surveys())` devuelve `{'Priya': 4.666..., 'Tom': 4.5, 'Una': 3.0}`.
- ✅ Un archivo de encuesta con una sola fila sigue funcionando (sin división por cero en entrada no vacía).
- ✅ Cada calificación se moldea a `int` *antes* de la aritmética — el string `"5"` + `"4"` concatenaría, no sumaría.

**🤔 Pregunta(s) socrática(s)**

- La CSAT se agrega por *agente*. ¿Qué otra agrupación querría un gerente de soporte (por cola, por turno, por área de producto) — y cuánto de `summarize` debe cambiar por agrupación, o ya *significa* "agrupar por cualquier columna"?
- La media recompensa la consistencia y castiga todo por igual. ¿Qué *oculta* un promedio de 3.5 sobre un equipo de 30 agentes donde la mitad puntúa 5 y la mitad puntúa 2 — y qué agregado mostraría eso?

## Paso 5: El informe combinado

Cada métrica hasta ahora vive en su propio script. El paso final las compone en el artefacto que un interesado realmente lee: un único `report.py` que saca a la superficie las violaciones de SLA y la CSAT de los agentes juntas, porque un equipo de soporte que responde rápido pero enfurece a los clientes necesita ver *ambos* números a la vez.

### 5.1 Componer el informe

**👟 Pista inicial :** Reutiliza cada cargador y agregador que construiste — `load_activity` → `sla_report`, `load_surveys` → `summarize` — e imprime ambas secciones con encabezados simples de `===`, ordenando a los agentes por CSAT para que la lista se lea de arriba hacia abajo:

```python
# report.py
from csat import load_surveys, summarize
from sla import load_activity, sla_report

def build_report(log_csv: str = "support_log.csv", csat_csv: str = "csat.csv") -> None:
    print("=== SLA breaches ===")
    breaches = sla_report(load_activity(log_csv))
    print("\n".join(breaches) if breaches else "no breaches - all within SLA")

    print("\n=== CSAT by agent (best first) ===")
    for agent, avg in sorted(
        summarize(load_surveys(csat_csv)).items(),
        key=lambda pair: pair[1],
        reverse=True,
    ):
        print(f"  {agent}: {avg:.1f}/5")

if __name__ == "__main__":
    build_report()
```

Cada línea aquí es reutilización — el informe contiene *ninguna lógica de negocio nueva*, solo presentación. Ese es el diseño que vale la pena copiar: la capa compuesta se mantiene inmune a errores al poseer solo "llamar a las funciones existentes, ordenar la salida". `sorted(..., key=lambda pair: pair[1], reverse=True)` ordena por el *promedio*, el índice `[1]` de cada par `(agent, avg)`, lo que mantiene la visualización "mejores primero" sin tocar la función CSAT.

**🎯 Resultado esperado :**

```
=== SLA breaches ===
ticket 3: response 11.0h > 4h SLA
ticket 4: resolution 26.0h > 24h SLA

=== CSAT by agent (best first) ===
  Priya: 4.7/5
  Tom: 4.5/5
  Una: 3.0/5
```

**🩹 Si sale mal :** Un `FileNotFoundError` significa que el informe no encuentra los CSVs — ejecútalo desde la carpeta donde los Pasos 3–4 los escribieron, o pasa rutas (`build_report("logs/support_log.csv", ...)`). Si el orden de los agentes es alfabético en lugar de mejores primero, falta el `reverse=True` en el `sorted`.

### 5.2 Verifica el informe

**✅ Lista de verificación**

- ✅ `uv run python report.py` imprime ambas secciones exactamente en el orden de arriba.
- ✅ Eliminar el argumento de archivo de la llamada `sla_report` y pasar una ruta de registro vacío muestra `no breaches`.
- ✅ `report.py` no contiene código duplicado de lectura CSV o agregación — lo importa.

**🤔 Pregunta(s) socrática(s)**

- El informe ordena a los agentes mejores primero, pero un gerente que ordene así podría recompensar al nombre superior sin preguntar *por qué* Una puntúa 3.0 — ¿cuál es el argumento de que el informe debería imprimir también el volumen (número de encuestas) junto al promedio, y qué aparece cuando lo haces?
- `build_report` une dos análisis independientes con `print`. ¿Dónde está la presión para evolucionar esto hacia la producción de un *archivo* (JSON/HTML) en lugar de texto de terminal — y qué permanece igual si eso ocurre?

## ⚠️ Errores comunes

- **Sacar del extremo equivocado de la cola.** `pop(0)` después de un ordenamiento descendente es correcto; `pop()` (último elemento) después de un ordenamiento *ascendente* sirve el extremo opuesto. Una palabra invertida voltea silenciosamente el triaje al revés.
- **Dejar que los agentes ocupados permanezcan en el grupo de candidatos.** El filtro de enrutamiento `is_free()` no es una sugerencia — eliminarlo enruta tickets hacia agentes sobrecargados y todo el sistema de carga miente. Mantén el filtro dentro de `assign`.
- **Tratar las celdas vacías como cero.** `hours("")` debe significar "no medido", nunca `0`. Sumar un ticket sin responder como resuelto al instante fabrica datos de SLA falsos. Las protecciones `is not None` son el contrato.
- **Olvidar que el CSV da strings.** `row["rating"]` es `"5"`, no `5`. La división y la comparación se rompen hasta que moldeas; moldea en el momento de la carga para que un fallo sea legible.
- **Mezclar *formatos* de fecha.** `%Y-%m-%d %H:%M` y `%Y/%m/%d` son ambas marcas de tiempo válidas y mutuamente no analizables. Estandariza en un formato en el registro antes de que corra cualquier `strptime`.

## Lo que acabas de construir

Un motor real de panel de soporte: tickets modelados como datos, una cola de prioridad que ordena *y* sirve, enrutamiento consciente de habilidades y carga, matemática de SLA medida en horas desde un registro CSV real, CSAT por agente, y un informe compuesto único — todo biblioteca estándar, todo ejecutable desde una terminal. La habilidad transferible es medir un servicio contra promesas: cualquier operación con líneas de tiempo (entregas, despliegues, respuestas) puede modelarse como "registrar marcas de tiempo, calcular deltas, comparar con un umbral, sacar a la superficie las violaciones".

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/customer-support/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/customer-support) en el repositorio del curso tiene estos scripts completos más CSVs de muestra. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Añade **equilibrio de carga al enrutamiento**: entre puntuaciones empatadas, prefiere al agente con menos `active_tickets` — una línea extra en la función clave de `max(...)`.
- Persiste la cola entre corridas volcando `SupportQueue` a JSON al salir y recargándola al iniciar — los tickets ya son dataclasses serializables.
- Emite el informe como un **archivo HTML estático** que un equipo podría abrir en un navegador, usando una plantilla f-string envuelta alrededor de los mismos datos de `SLA breaches`/`CSAT`.
- Añade SLAs por prioridad (URGENTE 1h, ALTA 4h, MEDIA 8h, BAJA 24h) pasando el `Priority` del ticket a través de `sla_report` — la respuesta honesta a la pregunta socrática del Paso 3.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓