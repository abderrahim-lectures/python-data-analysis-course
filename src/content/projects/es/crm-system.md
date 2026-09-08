---
title: "Sistema CRM"
description: "Gestión de relaciones con clientes con contactos, negocios, seguimiento de pipeline e integración de correo electrónico."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["classes", "sqlite3", "rich", "cli"]
learningObjectives:
  - "Modelar contactos, negocios y actividades como dataclasses tipadas"
  - "Diseñar y consultar una base de datos SQLite con claves foráneas y SQL parametrizado"
  - "Insertar, buscar y filtrar registros entre tablas relacionadas"
  - "Registrar etapas de los negocios con validación y leer de vuelta un resumen de pipeline por etapa"
  - "Registrar actividades y reconstruir la línea de tiempo cronológica de un contacto"
  - "Renderizar cada vista como una tabla rich con estilos"
prerequisites: ["Fundamentos de Python (clases, funciones, dicts)", "pip install rich"]
---

# 🛠️ 🤝 Construir un Sistema CRM

Un CRM es la fuente de verdad compartida de un equipo de ventas: cada contacto, cada negocio, cada llamada y correo viven en un solo lugar para que nada se escape. Este proyecto construye un CRM ligero desde cero — modelarás contactos, negocios y actividades como dataclasses tipadas de Python, diseñarás un esquema SQLite con claves foráneas reales, escribirás consultas parametrizadas para búsqueda y filtrado, empujarás negocios por un pipeline validado, reconstruirás la línea de tiempo de un contacto y lo mostrarás todo en salidas limpia de tablas `rich`.

Esto asume Python 101 y suficiente comodidad con SQL para leer un SELECT — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Modelar contactos, negocios y actividades como tipos `@dataclass` limpios con auto-relleno de fecha.
2. Diseñar un esquema SQLite con tres tablas relacionadas y claves foráneas entre ellas.
3. Insertar registros con consultas parametrizadas y buscar por nombre, correo o empresa.
4. Empujar negocios por un pipeline validado y leer de vuelta un resumen de valor por etapa.
5. Registrar actividades y reconstruir la línea de tiempo cronológica completa de un contacto.
6. Renderizar cada vista como tablas `rich` con estilos en la terminal.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal, recomendado — SQLite escribe al disco cuando eliges una ruta de archivo, y `rich` renderiza tablas a todo color solo en una terminal real (las celdas de los notebooks las truncan).

**GitHub Codespaces** funciona perfectamente también: abre [el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecuta desde ahí. Una terminal real con soporte de color real.

**Google Colab y Kaggle Notebooks** son una forma genuina de ejecutar esto — SQLite funciona en memoria (`:memory:`), y el código Python es totalmente compatible. La advertencia honesta es `rich`: las celdas de notebook renderizan tablas en texto plano (los colores desaparecen), y no hay datos persistentes entre sesiones. El notebook de abajo usa una base de datos en memoria sembrada con dos contactos de muestra y sus negocios, así que cada consulta devuelve resultados de aspecto real aunque nada persista después de que el kernel se reinicie. Úsalo para ver que el esquema y las consultas funcionan de extremo a extremo; cambia a `uv` local o a un Codespace una vez que quieras que tus propios datos se queden.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/crm-system/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/crm-system/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcrm-system%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas vive en dos paquetes: una librería de PyPI para la UI de terminal, y un módulo de la stdlib para el almacenamiento.

### Instalar `uv`

`uv` es una sola herramienta que reemplaza la cadena usual "instalar Python, luego instalar pip, luego instalar una herramienta de entorno virtual, luego instalar paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

### Configurar el proyecto

```bash
uv init crm-system
cd crm-system
uv add rich
```

`rich` hace que las tablas y paneles de la terminal luzcan como una aplicación real — colores, bordes, columnas alineadas. `sqlite3` viaja con Python; no se necesita instalación extra. Los datos de tu CRM viven en un archivo `.db` al que apuntas al script, o en memoria si no especificas una ruta.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `crm-system/` existe con un `pyproject.toml`, y `rich` está instalado.

## Paso 1: Modelar los datos con dataclasses

Cada registro en un CRM tiene una forma rígida — un contacto siempre tiene nombre y correo; un negocio siempre tiene un valor y una etapa. `@dataclass` impone esa forma en tiempo de definición, previene la deriva accidental de atributos y te da un `repr` legible y serialización a dict gratis. El campo `id` `Optional[int]` permanece `None` hasta que un registro se inserta y la base de datos le asigna uno.

### 1.1 Definir Contact, Deal y Activity

**👟 Pista inicial :** Da a cada clase exactamente el conjunto de columnas al que mapea, haz de `id` un `Optional[int]` anulable con default `None`, y establece defaults sensatos de string vacío para los campos de texto opcionales.

```python
# crm_system.py
from dataclasses import dataclass
from datetime import date
from typing import Optional

@dataclass
class Contact:
    name: str
    email: str
    company: str = ""
    phone: str = ""
    id: Optional[int] = None

@dataclass
class Deal:
    contact_id: int
    title: str
    value: float
    stage: str = "lead"
    id: Optional[int] = None
    STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]

@dataclass
class Activity:
    contact_id: int
    deal_id: Optional[int]
    kind: str      # call, email, meeting
    summary: str
    activity_date: str = ""
    id: Optional[int] = None

    def __post_init__(self):
        if not self.activity_date:
            self.activity_date = date.today().isoformat()

c = Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp")
d = Deal(contact_id=1, title="Enterprise License", value=12_000, stage="proposal")
a = Activity(contact_id=1, deal_id=1, kind="meeting", summary="Discussed pricing")
print(f"Contact: {c.name} | Deal: {d.title} (${d.value:,.0f})")
```

El `__post_init__` en `Activity` es la única parte no trivial: auto-rellena la fecha con el string ISO de hoy cuando la olvidas, así cada actividad obtiene una marca de tiempo válida incluso en una corrida de prueba rápida. `Deal.STAGES` es una constante a nivel de clase — no un atributo de instancia — lo que significa que `Deal.STAGES` se lee limpiamente sin construir un `Deal`, y cada instancia conoce implícitamente la progresión permitida.

**🎯 Resultado esperado :** Imprime `Contact: Alice Chen | Deal: Enterprise License ($12,000)`.

**🩹 Si sale mal :** Si `Optional` de `typing` no se reconoce, tu Python es <3.10 — usa `from __future__ import annotations` al inicio, o `Optional[int]` sigue siendo válido de cualquier manera. Si `__post_init__` no se ejecuta, verifica que esté indentado bajo `Activity`, no como una función independiente — es un método mágico de dataclass, no un método regular.

### 1.2 Verifica los modelos

**✅ Lista de verificación**

- ✅ Construir `Contact`, `Deal` y `Activity` con argumentos de palabra clave nombrados produce un `repr` limpio y sin `TypeError`.
- ✅ Crear un `Activity` sin fecha auto-rellena `activity_date` con la fecha ISO de hoy.

**🤔 Pregunta(s) socrática(s)**

- Un `dict` simple como `{"name": "Alice", "email": "alice@acme.com"}` guardaría los mismos datos sin importar nada. ¿Qué *garantía* específica añade `@dataclass` que un dict no tiene, y cuándo importa esa garantía?
- `Deal.STAGES` se define directamente en el cuerpo de la clase. ¿Por qué es preferible a una lista `STAGES` de nivel superior, y qué le pasa a `move_deal` en el Paso 4 si un string de etapa no coincide con uno de esos valores?

## Paso 2: Diseñar el esquema SQLite e insertar contactos

`sqlite3` es la base de datos confiable más pequeña que existe — sin instalación, sin daemon, sin archivo de config — y está en la stdlib de Python. El esquema refleja tus dataclasses exactamente: tres tablas con una clave foránea de `deals` y `activities` hacia `contacts`, así que la base de datos misma impone la relación de la que depende tu código.

### 2.1 Crear la base de datos y el esquema

**👟 Pista inicial :** Usa `conn.row_factory = sqlite3.Row` para que cada resultado de `SELECT` actúe como un diccionario legible, y `executescript` para ejecutar múltiples sentencias `CREATE TABLE` en una sola llamada.

```python
# crm_system.py (continued)
import sqlite3

def init_db(db_path: str = ":memory:") -> sqlite3.Connection:
    """Create the three tables and return a ready-to-use connection."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            company TEXT DEFAULT '',
            phone TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            title TEXT NOT NULL,
            value REAL DEFAULT 0,
            stage TEXT DEFAULT 'lead'
        );
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            deal_id INTEGER,
            kind TEXT NOT NULL,
            summary TEXT NOT NULL,
            activity_date TEXT NOT NULL
        );
    """)
    conn.commit()
    return conn

conn = init_db()
```

`"references contacts(id)"` es una declaración de clave foránea, pero SQLite solo la impone si ejecutas `PRAGMA foreign_keys = ON` — y deliberadamente, no hacemos eso aquí. La imposición total de FKs es el default de producción correcto, pero para un CRM de enseñanza donde podrías insertar temporalmente un negocio antes de que exista su contacto, la elección pragmática es dejar que el código Python posea la restricción. `conn.row_factory = sqlite3.Row` significa que cada fila obtenida se comporta tanto como un dict como un objeto — puedes usar `row["name"]` y `row.name` indistintamente, que es la característica de `sqlite3` más útil de todas.

**🎯 Resultado esperado :** `init_db()` devuelve una `sqlite3.Connection` viva sin errores; llamar a `conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()` imprime los tres nombres de tabla.

**🩹 Si sale mal :** Si `executescript` lanza `ProgrammingError`, olvidaste `conn.commit()` — las escrituras del esquema son transacciones, y sin commit son invisibles para las consultas posteriores. Si una tabla ya existe de una corrida anterior contra un archivo (no `:memory:`), `CREATE TABLE IF NOT EXISTS` silenciosamente no hace nada — elimina el archivo o la tabla si necesitas un esquema nuevo.

### 2.2 Insertar y buscar contactos

**👟 Pista inicial :** Escribe `add_contact` y `search_contacts` como funciones puras de la conexión — nunca de una variable global — para que sean trivialmente testeables y componibles.

```python
# crm_system.py (continued)
def add_contact(conn: sqlite3.Connection, contact: Contact) -> int:
    cur = conn.execute(
        "INSERT INTO contacts (name, email, company, phone) VALUES (?, ?, ?, ?)",
        (contact.name, contact.email, contact.company, contact.phone),
    )
    conn.commit()
    return cur.lastrowid

def search_contacts(conn: sqlite3.Connection, query: str) -> list[dict]:
    """Search by name, email, or company using parameterized LIKE."""
    pattern = f"%{query}%"
    rows = conn.execute(
        "SELECT * FROM contacts WHERE name LIKE ? OR email LIKE ? OR company LIKE ?",
        (pattern, pattern, pattern),
    ).fetchall()
    return [dict(r) for r in rows]

alice_id = add_contact(conn, Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp"))
bob_id   = add_contact(conn, Contact(name="Bob Smith", email="bob@globex.com", company="Globex Inc"))
print(f"Added contacts: IDs {alice_id}, {bob_id}")
print(search_contacts(conn, "acme"))
```

Los placeholders `?` en el string SQL son todo el punto de las consultas parametrizadas: la base de datos nunca interpreta tus valores de string como fragmentos SQL, lo que es a la vez una regla de seguridad (sin inyección) y una regla de corrección (sin bugs de escape). `cur.lastrowid` es la clave primaria entera que la base de datos acaba de asignar — es el valor de clave foránea que tus negocios y actividades necesitan en los siguientes pasos, así que `add_contact` devolverlo es una elección de diseño deliberada.

**🎯 Resultado esperado :** Imprime `Added contacts: IDs 1, 2` seguido de una lista que contiene un dict para Alice Chen.

**🩹 Si sale mal :** Si `search_contacts(conn, "acme")` devuelve una lista vacía a pesar de que Alice fue insertada, verifica que ambas llamadas a `add_contact` corrieron antes de la consulta — si falta `conn.commit()` dentro de `add_contact`, los inserts son invisibles para las lecturas posteriores. Si obtienes `ProgrammingError: wrong number of arguments`, el string de consulta tiene un número de placeholders `?` distinto de los valores de la tupla — cuéntalos.

### 2.3 Verifica el esquema y el insert

**✅ Lista de verificación**

- ✅ Existen dos contactos con IDs auto-asignados (`1` y `2`), y `search_contacts(conn, "Globex")` devuelve exactamente a Bob.
- ✅ Puedes explicar por qué los placeholders `?` no son solo una buena práctica sino un límite de seguridad.

**🤔 Pregunta(s) socrática(s)**

- `search_contacts` devuelve `[dict(r) for r in rows]`, convirtiendo cada `sqlite3.Row` en un dict plano. ¿Qué cambiaría si devolvieras los objetos `Row` directamente — hay un caso donde eso es mejor, y un caso donde rompe algo?
- Una colega junior sugiere guardar la empresa como una clave foránea entera a una tabla `companies` "por normalización". ¿Cuáles son los trade-offs en un CRM pequeño donde un nombre de empresa es realmente solo una etiqueta?

## Paso 3: Buscar y filtrar con joins

Un CRM no es útil hasta que puedes hacer preguntas relacionales: "¿qué negocios están en la etapa de propuesta?" "¿qué contactos están asociados con un negocio de más de $5K?" Estos son JOINs — extraer filas de dos tablas usando la clave foránea que las conecta — y son el patrón de consulta que hace a una base de datos genuinamente más poderosa que un archivo plano.

### 3.1 Escribir consultas de negocios filtradas

**👟 Pista inicial :** Escribe una función que cuente contactos por empresa (un GROUP BY simple), y una función que liste negocios filtrados por etapa — ambas usando valores parametrizados.

```python
# crm_system.py (continued)
def contacts_by_company(conn: sqlite3.Connection, company: str) -> list[dict]:
    """Return all contacts whose company matches the query."""
    rows = conn.execute(
        "SELECT * FROM contacts WHERE company LIKE ?", (f"%{company}%",)
    ).fetchall()
    return [dict(r) for r in rows]

def deals_by_stage(conn: sqlite3.Connection, stage: str) -> list[dict]:
    """List deals at a given stage, joined with contact name."""
    rows = conn.execute(
        "SELECT d.id, d.title, d.value, d.stage, c.name AS contact_name "
        "FROM deals d JOIN contacts c ON d.contact_id = c.id "
        "WHERE d.stage = ? ORDER BY d.value DESC",
        (stage,),
    ).fetchall()
    return [dict(r) for r in rows]

# Demo: search contacts and list deals by stage
print("Acme contacts:", contacts_by_company(conn, "Acme"))
# (deals_by_stage will return [] until Step 4 inserts deals)
```

El `JOIN contacts c ON d.contact_id = c.id` es la línea clave: empareja cada negocio con el contacto que lo posee por clave foránea entera, y `c.name AS contact_name` trae el nombre al resultado para que tu lógica de visualización no necesite una segunda consulta. Ordenar por `value DESC` es un sesgo intencional hacia la información que querrías primero al escanear un pipeline — los números más grandes arriba.

**🎯 Resultado esperado :** `Acme contacts: [{'id': 1, 'name': 'Alice Chen', ...}]`; `deals_by_stage(conn, "proposal")` devuelve una lista vacía (los negocios todavía no existen — llegan en el Paso 4).

**🩹 Si sale mal :** Si `contacts_by_company` devuelve un desajuste sensible a mayúsculas (p. ej., buscar "ACME" por "Acme"), el `LIKE` de SQLite solo ignora mayúsculas para caracteres ASCII; usa `LOWER()` en la consulta si trabajas con entrada mixta. Si `deals_by_stage` lanza `OperationalError: no such column`, el alias de columna en tu JOIN no coincide con la lista SELECT.

### 3.2 Verifica las consultas filtradas

**✅ Lista de verificación**

- ✅ `contacts_by_company(conn, "Globex")` devuelve exactamente a Bob, y `contacts_by_company(conn, "Nonexistent")` devuelve `[]`.
- ✅ `deals_by_stage` devuelve una lista vacía antes de que se inserten negocios — confirmando que no está reutilizando silenciosamente datos obsoletos.

**🤔 Pregunta(s) socrática(s)**

- Tanto `search_contacts` como `contacts_by_company` filtran con un patrón `LIKE ?`. ¿Por qué no escribir simplemente una función con una cláusula `WHERE` que verifique cada columna con `OR` — hay una razón para mantenerlas separadas, o es solo estilo de código?
- `deals_by_stage` hace join pero `contacts_by_company` no. ¿Cuándo funciona una consulta de una sola tabla, y cuándo omitir el JOIN te da silenciosamente la respuesta equivocada?

## Paso 4: Registrar negocios a través del pipeline

La *etapa* de un negocio es su posición en el pipeline de ventas, y moverla hacia adelante sin validación es cómo los CRMs se convierten en basura. Este paso construye la lógica del pipeline: añadir negocios, validar transiciones de etapa, mover un negocio hacia adelante y leer de vuelta un resumen por etapa de cuántos negocios y cuánto valor hay en cada punto.

### 4.1 Insertar negocios y moverlos por el pipeline

**👟 Pista inicial :** `add_deal` y `move_deal` deben vivir sobre las constantes de clase de `Deal` — `deal_id` y `new_stage` son argumentos, no atributos — y `move_deal` debe rechazar etapas inválidas *antes* de que corra el UPDATE.

```python
# crm_system.py (continued)
def add_deal(conn: sqlite3.Connection, deal: Deal) -> int:
    cur = conn.execute(
        "INSERT INTO deals (contact_id, title, value, stage) VALUES (?, ?, ?, ?)",
        (deal.contact_id, deal.title, deal.value, deal.stage),
    )
    conn.commit()
    return cur.lastrowid

def move_deal(conn: sqlite3.Connection, deal_id: int, new_stage: str) -> None:
    if new_stage not in Deal.STAGES:
        raise ValueError(f"Invalid stage: {new_stage}. Choose from {Deal.STAGES}")
    conn.execute("UPDATE deals SET stage = ? WHERE id = ?", (new_stage, deal_id))
    conn.commit()

deal1_id = add_deal(conn, Deal(contact_id=alice_id, title="Enterprise License", value=12_000, stage="proposal"))
deal2_id = add_deal(conn, Deal(contact_id=bob_id, title="Consulting Package", value=5_000, stage="lead"))
move_deal(conn, deal1_id, "negotiation")
```

La verificación de validación — `if new_stage not in Deal.STAGES` — corre como una protección a nivel de Python, no una restricción de base de datos, porque SQLite no tiene restricciones `CHECK` en `DEFAULT`. Este es el trade-off deliberado: obtienes un `ValueError` claro con las opciones válidas impresas, en lugar de un `UPDATE` silencioso que escribe un string sin sentido y rompe la vista del pipeline más tarde.

**🎯 Resultado esperado :** Existen dos negocios; deal1 está ahora en `"negotiation"` después del movimiento; deal2 permanece en `"lead"`.

**🩹 Si sale mal :** Si `move_deal` lanza `ValueError` para una etapa válida, el string tiene un typo — las mayúsculas importan exactamente como se listan en `Deal.STAGES`. Si el UPDATE corre pero `deals_by_stage` aún muestra el negocio en su etapa anterior, olvidaste `conn.commit()` — la escritura pasó en memoria pero no se persistió.

### 4.2 Leer de vuelta el resumen del pipeline

**👟 Pista inicial :** Agrega con `GROUP BY stage` y `ORDER BY stage` para obtener una fila por etapa en orden de pipeline, incluyendo un conteo de negocios y un valor total.

```python
# crm_system.py (continued)
def pipeline_summary(conn: sqlite3.Connection) -> dict:
    """Return {stage: {count, total_value}} for every stage in the pipeline."""
    rows = conn.execute(
        "SELECT stage, COUNT(*) AS deals, SUM(value) AS total "
        "FROM deals GROUP BY stage ORDER BY stage"
    ).fetchall()
    return {r["stage"]: {"count": r["deals"], "value": r["total"] or 0.0} for r in rows}

for stage, info in pipeline_summary(conn).items():
    print(f"  {stage:<15} {info['count']} deals  ${info['value']:>10,.0f}")
```

`r["total"] or 0.0` maneja el caso donde una etapa no tiene ningún negocio — `SUM` devuelve `NULL` en un grupo vacío, y el `or` de Python lo captura. Ordenar por `stage` alfabéticamente es una simplificación para el pipeline de enseñanza; un CRM de producción definiría un orden explícito vía `CASE WHEN stage = 'lead' THEN 1 ...`.

**🎯 Resultado esperado :** Imprime cada etapa con su conteo de negocios y valor total — `negotiation` muestra 1 negocio ($12,000), `lead` muestra 1 negocio ($5,000), y todas las demás etapas muestran 0 negocios y $0.

**🩹 Si sale mal :** Si cada etapa muestra 0 negocios a pesar de los inserts, tu `GROUP BY` está trabajando contra una conexión o archivo de base de datos diferente — confirma que estás pasando el mismo objeto `conn`, no re-inicializando desde cero. Si los nombres de etapa no coinciden con la constante `STAGES`, el `SUM` sobre un grupo inexistente no devuelve nada — verifica espacios sueltos en los strings de etapa.

### 4.3 Verifica el pipeline

**✅ Lista de verificación**

- ✅ La etapa de `deal1_id` es `"negotiation"` después de `move_deal`, y la de `deal2_id` sigue siendo `"lead"`.
- ✅ `pipeline_summary(conn)` devuelve un dict con exactamente dos etapas no cero y sus conteos de negocios correctos.

**🤔 Pregunta(s) socrática(s)**

- Un usuario quiere mover un negocio *hacia atrás* de `"negotiation"` a `"qualified"`. ¿Es la función `move_deal` actual correcta para ese caso de uso, y qué lógica adicional prevendría el abuso si desplegaras esto como una herramienta de ventas real?
- El resumen del pipeline está ordenado alfabéticamente por nombre de etapa. ¿Qué está mal de ese orden para un pipeline de ventas real, y cómo lo arreglarías sin salir de SQL?

## Paso 5: Registrar actividades y leer de vuelta una línea de tiempo

Un negocio sin contexto es un número; un negocio con una línea de tiempo de llamadas, correos y reuniones es una *historia*. Este paso escribe actividades a la base de datos y reconstruye esa historia para cualquier contacto — ordenada por fecha, así un gerente puede leer el historial de relación sin desplazarse.

### 5.1 Insertar actividades y obtener la línea de tiempo

**👟 Pista inicial :** `add_activity` es casi idéntica en forma a `add_deal` — el patrón es siempre `INSERT con placeholders ?, commit, devolver lastrowid`. Escribe un `timeline_for_contact` que haga join de actividades con contactos y ordene por `activity_date, id`.

```python
# crm_system.py (continued)
def add_activity(conn: sqlite3.Connection, activity: Activity) -> int:
    cur = conn.execute(
        "INSERT INTO activities (contact_id, deal_id, kind, summary, activity_date) "
        "VALUES (?, ?, ?, ?, ?)",
        (activity.contact_id, activity.deal_id, activity.kind, activity.summary, activity.activity_date),
    )
    conn.commit()
    return cur.lastrowid

def timeline_for_contact(conn: sqlite3.Connection, contact_id: int) -> list[dict]:
    """Return all activities for a contact, ordered by date then insertion order."""
    rows = conn.execute(
        "SELECT kind, summary, activity_date FROM activities "
        "WHERE contact_id = ? ORDER BY activity_date, id",
        (contact_id,),
    ).fetchall()
    return [dict(r) for r in rows]

add_activity(conn, Activity(contact_id=alice_id, deal_id=deal1_id, kind="meeting", summary="Reviewed contract"))
add_activity(conn, Activity(contact_id=bob_id,   deal_id=deal2_id, kind="call",    summary="Initial outreach call"))
add_activity(conn, Activity(contact_id=alice_id, deal_id=deal1_id, kind="email",   summary="Sent revised terms"))

print("Alice's timeline:")
for a in timeline_for_contact(conn, alice_id):
    print(f"  {a['activity_date']}  [{a['kind']}]  {a['summary']}")
```

`ORDER BY activity_date, id` es un orden de dos partes: fechas primero, luego el orden de inserción para actividades del mismo día. Sin el desempate `, id`, las actividades del mismo día aparecen en orden arbitrario, lo que está bien para un juguete pero es confuso en cualquier línea de tiempo real. Que `deal_id` sea `Optional[int]` importa aquí — una actividad puede ser sobre un contacto en general, no atada a un negocio específico.

**🎯 Resultado esperado :** Imprime la línea de tiempo de Alice: la reunión en la fecha de hoy, luego el correo, ambos listados con la etiqueta de tipo y el resumen.

**🩹 Si sale mal :** Si las actividades de Alice muestran entradas de Bob (o viceversa), el valor `contact_id` pasado a `timeline_for_contact` no coincide — rastrea los IDs devueltos por `add_contact` en el Paso 2. Si la línea de tiempo está vacía a pesar de los inserts, estás consultando una conexión diferente que no ha hecho commit — usa siempre el mismo objeto `conn`.

### 5.2 Verifica el registro de actividades

**✅ Lista de verificación**

- ✅ Alice tiene exactamente dos actividades y Bob exactamente una, cada una mostrando el tipo, resumen y fecha de hoy correctos.
- ✅ Las actividades del mismo día se ordenan por su orden de inserción (reunión antes que correo), no alfabéticamente por resumen.

**🤔 Pregunta(s) socrática(s)**

- `deal_id` es `Optional[int]` en `Activity`, pero la tabla `activities` lo guarda como un `INTEGER` pelado sin cláusula `REFERENCES`. ¿Qué podría salir mal en producción si alguien inserta una actividad con un `deal_id` que no existe en la tabla `deals`?
- ¿Cómo extenderías `timeline_for_contact` para incluir el título del negocio junto a cada actividad (para actividades que tienen un `deal_id`), y por qué eso requiere un `LEFT JOIN` en lugar de un `JOIN` regular?

## Paso 6: Mostrarlo todo con tablas rich

El CRM es funcional — los contactos se guardan, los negocios fluyen por un pipeline, las actividades se registran. Pero toda la salida hasta ahora son sentencias `print()` peladas. `rich` convierte eso en una aplicación de terminal real: tablas con color, columnas alineadas, bordes visibles y encabezados que hacen el escaneo rápido.

### 6.1 Renderizar contactos y el pipeline como tablas rich

**👟 Pista inicial :** Importa `Console` y `Table` de `rich`, crea una tabla por vista, añade columnas con `style` para el código de colores e imprime cada tabla con `console.print(table)`.

```python
# crm_system.py (continued)
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

def show_contacts(conn: sqlite3.Connection) -> None:
    table = Table(title="Contacts")
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="green")
    table.add_column("Email")
    table.add_column("Company", style="yellow")
    for row in conn.execute("SELECT * FROM contacts"):
        table.add_row(str(row["id"]), row["name"], row["email"], row["company"])
    console.print(table)

def show_pipeline(conn: sqlite3.Connection) -> None:
    table = Table(title="Deal Pipeline")
    table.add_column("Deal", style="cyan")
    table.add_column("Contact", style="green")
    table.add_column("Value", justify="right")
    table.add_column("Stage", style="yellow")
    for row in conn.execute(
        "SELECT d.title, d.value, d.stage, c.name AS contact_name "
        "FROM deals d JOIN contacts c ON d.contact_id = c.id "
        "ORDER BY d.stage, d.value DESC"
    ):
        table.add_row(row["title"], row["contact_name"], f"${row['value']:,.0f}", row["stage"])
    console.print(table)

show_contacts(conn)
show_pipeline(conn)
```

`style="cyan"` y `style="green"` son directivas de color de `rich` — añaden significado sin sobrecargar la salida: los IDs son siempre de un color, los nombres de otro, las etapas de un tercero. El `justify="right"` en Value hace que las cantidades de dólares se alineen por decimal, no por primer dígito, que es lo que tu ojo espera de una hoja de cálculo. Una instancia `Console()` compartida por todas las funciones mantiene consistentes las configuraciones de color y ancho.

**🎯 Resultado esperado :** Dos tablas `rich` en la terminal — una listando ambos contactos con columnas de ID/Nombre/Empresa en color, la segunda mostrando ambos negocios con el nombre del contacto unido, los valores en dólares alineados a la derecha y las etapas con código de colores.

**🩹 Si sale mal :** Si la salida es texto plano incrustado, estás ejecutando en una celda de notebook en lugar de una terminal real — `rich` detecta salida no-TTY y elimina los colores. Usa una terminal o un Codespace. Si la columna Value tiene decimales desalineados, falta el `justify="right"` o los valores se están formateando como strings antes de la inserción.

### 6.2 Verifica la visualización rich

**✅ Lista de verificación**

- ✅ Dos tablas con estilos se renderizan con color — una para contactos, una para el pipeline de negocios.
- ✅ Los valores en dólares de la tabla del pipeline están alineados a la derecha, con comas en los miles.

**🤔 Pregunta(s) socrática(s)**

- `rich.Console()` auto-detecta el ancho de la terminal y trunca columnas demasiado largas. ¿Qué pasa si el correo de un contacto tiene 80 caracteres, y cómo lo arreglarías sin perder datos?
- La tabla del pipeline ordena por `stage, value DESC`. ¿Por qué no ordenar solo por etapa, y qué problema visual crearía eso al escanear un pipeline con varios negocios en la misma etapa?

## ⚠️ Errores comunes

- **Inyección SQL vía f-strings.** `"SELECT * FROM contacts WHERE name LIKE f'%{query}%'"` es un vector de inyección de libro de texto — usa siempre placeholders `?` con una tupla de parámetros separada. La función `search_contacts` de arriba demuestra la forma correcta; cualquier consulta que interpole entrada de usuario directamente está mal, no importa lo rápido que sea el prototipo.
- **Olvidar `conn.commit()`.** Cada `INSERT` y `UPDATE` es una transacción; sin un commit, la escritura es invisible para el siguiente `SELECT` y desaparece silenciosamente. El síntoma es "inserté una fila pero la consulta no devuelve nada" — casi siempre es un commit faltante.
- **Typos en los strings de etapa crean nuevas etapas silenciosamente.** `move_deal` rechaza etapas inválidas en la protección de Python, pero si la omites con un `UPDATE` crudo, SQLite guardará felizmente cualquier string como etapa — y `deals_by_stage` nunca encontrará esas filas bajo el nombre de etapa esperado. Mantén la protección.
- **Orden alfabético de las etapas del pipeline.** `ORDER BY stage` ordena "lead" antes que "negotiation" — que *por casualidad* coincide con el orden del pipeline en este pequeño ejemplo, pero es frágil. Un CRM de producción necesita un orden de etapas explícito, ya sea vía una expresión `CASE` o una tabla de búsqueda.
- **`dict(row)` en sqlite3.Row no anida.** Las relaciones de clave foránea (`contact_name` del JOIN) aparecen como claves planas, no una estructura anidada `{"contact": {"name": ...}}`. Cualquier código que espere anidación obtendrá silenciosamente `KeyError`; trabaja con la forma plana del dict o construye la anidación explícitamente.

## Lo que acabas de construir

Un CRM de línea de comandos funcional: guarda contactos, registra negocios a través de un pipeline validado de seis etapas, registra actividades con fechas, reconstruye líneas de tiempo de contactos y presenta todo a través de tablas `rich` con estilos — todo respaldado por una base de datos SQLite real con consultas parametrizadas y claves foráneas. Apúntalo a tu propio archivo `.db` y los datos persisten entre corridas; sin simulación, sin datos falsos.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/crm-system/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/crm-system) en el repositorio del curso es una versión de notebook ejecutable: una base de datos SQLite en memoria sembrada con contactos y negocios de muestra, cada consulta y tabla de los Pasos 1–6 ejecutándose de extremo a extremo, y la salida rich renderizada en línea. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Construye un **panel de reporte de valor del pipeline**: usa `rich.panel.Panel` para imprimir el valor total del pipeline, el conteo de negocios abiertos y el tamaño promedio de negocio — todo desde `pipeline_summary` — dentro de un único panel de color que encaje en la parte superior de cada llamada a `show_pipeline`.
- Añade **reasignación de negocios**: escribe `reassign_deal(conn, deal_id, new_contact_id)` que cambie el contacto, y luego registra la reasignación como una actividad para que la línea de tiempo muestre a quién perteneció el negocio antes y después.
- Implementa **importación/exportación CSV**: añade `import_csv(conn, path)` usando el `csv.DictReader` de Python para cargar contactos en bloque, y `export_deals(conn, path)` para volcar el pipeline a una hoja de cálculo — el camino más simple de un CRM a una herramienta de reportes.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python que registra relaciones reales. 🎓