---
id: mcp-sqlite-server
title: "Consultar una base de datos en lenguaje natural con MCP"
sidebar_label: "Consultar una base de datos en lenguaje natural con MCP"
slug: /projects/mcp-sqlite-server
description: "Construye un servidor MCP que expone una base de datos SQLite local, y observa a un cliente LLM escribir y ejecutar su propio SQL para responder preguntas en lenguaje natural sobre ella."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Consultar una base de datos en lenguaje natural con MCP

<ProjectPublishedDate projectId="2027-mcp-sqlite-server" />

<ProjectGreeting />

Las bases de datos suelen estar detrás de un muro de SQL que solo quienes lo escribieron pueden consultar con comodidad. MCP cambia esa forma: en lugar de enseñarle SQL a todo el mundo, expones una base de datos mediante un puñado de herramientas bien descritas, y dejas que un cliente LLM escriba y ejecute el SQL él mismo, en tu nombre, una pregunta a la vez. Este proyecto construye exactamente eso: una pequeña base de datos SQLite local (una biblioteca de barrio: libros, autores, socios, préstamos) y un servidor MCP que permite a un asistente de IA listar sus tablas, inspeccionar el esquema de una tabla y ejecutar consultas **de solo lectura** sobre ella, de modo que puedas preguntar algo como "¿qué libros no ha devuelto todavía la biblioteca?" en lenguaje natural y verlo respondido correctamente.

Este proyecto asume Python 101, idealmente también Análisis de Datos (sentirte cómodo con tablas, columnas y consultas sobre datos estructurados hará que la parte de SQL encaje más rápido), y haber construido ya el proyecto [Construye un servidor MCP](/docs/projects/mcp-server) — este proyecto reutiliza la configuración de `FastMCP` de ese proyecto y no la vuelve a explicar desde cero. Es opcional y no se califica; consulta [Proyectos del mundo real](/docs/projects) para ver la lista completa y creciente.

## 🎯 Qué vas a hacer

1. Construir una base de datos SQLite pequeña y realista con varias tablas relacionadas, usando únicamente el módulo `sqlite3` de la biblioteca estándar.
2. Escribir funciones simples de Python para listar tablas, describir el esquema de una tabla y ejecutar una consulta — con una verificación de seguridad real, nada superficial, que rechace cualquier cosa que no sea un `SELECT` de solo lectura.
3. Conectar esas funciones como herramientas MCP con `FastMCP`, la misma API basada en decoradores del proyecto Construye un servidor MCP.
4. Conectar tu servidor a Claude Desktop y hacerle una pregunta genuina en lenguaje natural, observando cómo escribe y ejecuta su propio SQL a través de tus herramientas.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal recomendada, por la misma razón que en el proyecto Construye un servidor MCP: la recompensa aquí es conectar tu servidor a Claude Desktop, y Claude Desktop es una aplicación instalada en tu propia máquina — no hay forma de evitar hacer al menos el paso final localmente. Este es un proceso local de larga duración pensado para esperar a que un cliente MCP real se conecte a él, no algo que un notebook alojado pueda ser.

**GitHub Codespaces** funciona para construir la base de datos y escribir las funciones de herramientas y el propio servidor: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados), escribe `seed.py`, `db_tools.py` y `server.py`, y prueba con el MCP Inspector a través del puerto reenviado del Codespace. Lo que no puede ser es tu punto final de conexión con Claude Desktop, por la misma razón que en el proyecto MCP anterior.

**Google Colab y Kaggle tampoco pueden ejecutar el servidor real** — el mismo razonamiento que en Construye un servidor MCP: una celda de notebook no puede ser un proceso local persistente al que se conecte un cliente de escritorio. Lo que un notebook sí puede hacer aquí es demostrar las funciones subyacentes de consulta e inspección de esquema de forma aislada, con simples llamadas a funciones y sin ningún protocolo MCP de por medio — para eso está [`examples/mcp-sqlite-server/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb). Haz clic en una insignia para abrirlo directamente, sin ninguna instalación local:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb)

## Configuración

Si ya tienes `uv` del proyecto Construye un servidor MCP, sáltate este paso. Si no:

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

Después configura un proyecto e instala el SDK oficial de Python para MCP, con su extra opcional `cli`:

```bash
uv init mcp-sqlite-server
cd mcp-sqlite-server
uv add "mcp[cli]"
```

`sqlite3`, la biblioteca de base de datos que este proyecto realmente consulta, forma parte de la biblioteca estándar de Python — no hay nada que instalar para ella. Tampoco se necesita ninguna clave de API externa para ejecutar el propio servidor: es una herramienta puramente local, y el cliente LLM que se conecta a ella (Claude Desktop, en el Paso 4) aporta su propio modelo y, si lo necesita, su propia clave.

## Paso 1: Construye una base de datos de ejemplo pequeña

Crea `seed.py` — un script que construye una pequeña base de datos de biblioteca con cuatro tablas relacionadas:

```python
# seed.py
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "library.db"

SCHEMA = """
CREATE TABLE authors (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL,
    country TEXT
);

CREATE TABLE books (
    id         INTEGER PRIMARY KEY,
    title      TEXT NOT NULL,
    author_id  INTEGER NOT NULL REFERENCES authors(id),
    year       INTEGER,
    genre      TEXT
);

CREATE TABLE members (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    joined_on  TEXT NOT NULL
);

CREATE TABLE loans (
    id          INTEGER PRIMARY KEY,
    book_id     INTEGER NOT NULL REFERENCES books(id),
    member_id   INTEGER NOT NULL REFERENCES members(id),
    borrowed_on TEXT NOT NULL,
    returned_on TEXT
);
"""

def build_database(db_path: Path = DB_PATH) -> None:
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(SCHEMA)
        # ... insert a handful of authors, books, members, and loans here —
        # see examples/mcp-sqlite-server/seed.py for a full sample dataset.
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    build_database()
    print(f"Built sample database at {DB_PATH}")
```

Ejecútalo una vez:

```bash
uv run python seed.py
```

Que `returned_on` sea `NULL` en una fila es intencional — es lo que hace que "¿qué libros siguen prestados?" sea una pregunta real y respondible más adelante, en lugar de que todos los préstamos se vean idénticos.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python seed.py` se ejecuta sin errores y crea `library.db`.</StepChecklistItem>
<StepChecklistItem>La base de datos tiene al menos tres tablas relacionadas, conectadas por claves foráneas (no una sola tabla plana).</StepChecklistItem>
<StepChecklistItem>Al menos una fila tiene `NULL` en una columna que lo permite (por ejemplo, un préstamo no devuelto) — los datos reales tienen huecos.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué este proyecto usa varias tablas pequeñas y relacionadas en lugar de una sola tabla ancha con todas las columnas? ¿Cómo sería una consulta para "qué socio pidió prestado qué libro" en cada forma?
- ¿Qué se rompería, más adelante, si `book_id` en `loans` no hiciera referencia realmente a una fila real en `books`?

## Paso 2: Escribe las funciones de consulta y esquema, de forma segura

Crea `db_tools.py` — funciones de Python simples, sin ningún import de MCP, que el servidor envolverá en el Paso 3:

```python
# db_tools.py
import re
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "library.db"

_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|PRAGMA|VACUUM)\b",
    re.IGNORECASE,
)


class UnsafeQueryError(ValueError):
    """Raised when a query isn't a single, read-only SELECT."""


def list_tables(db_path: Path = DB_PATH) -> list[str]:
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()


def run_read_only_query(sql: str, db_path: Path = DB_PATH) -> list[dict]:
    stripped = sql.strip().rstrip(";")
    if not stripped:
        raise UnsafeQueryError("Empty query.")
    if ";" in stripped:
        raise UnsafeQueryError("Only a single statement is allowed -- no ';' inside the query.")
    if not stripped.upper().startswith("SELECT"):
        raise UnsafeQueryError("Only SELECT queries are allowed.")
    if _FORBIDDEN_KEYWORDS.search(stripped):
        raise UnsafeQueryError("Query contains a write/DDL keyword, which isn't allowed.")

    # A second, independent layer of defense: open the file itself read-only
    # at the OS/SQLite level, so even a query that slipped past the text
    # checks above still can't write anything.
    uri = f"file:{Path(db_path).resolve()}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(stripped).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
```

Dos cosas que vale la pena notar. Primero, `run_read_only_query` no intenta ser un analizador SQL completo — no puede serlo, no en unas pocas líneas — pero tampoco necesita serlo: rechazar cualquier cosa con una segunda sentencia encadenada por punto y coma, cualquier cosa que no sea un `SELECT`, y cualquier cosa que contenga una palabra clave de escritura o de esquema cierra las formas realistas en que una consulta compuesta por un modelo podría hacer daño, sin pretender atrapar cada truco SQL concebible. Segundo, abrir la propia conexión con el parámetro URI `mode=ro` de SQLite es una segunda capa real, independiente de la verificación de texto — si la expresión regular alguna vez pasara algo por alto, que el archivo de la base de datos sea genuinamente de solo lectura a nivel del sistema operativo sigue impidiendo que ocurra una escritura. (`describe_table`, la tercera función que necesita este proyecto, es una adición breve — consulta `examples/mcp-sqlite-server/db_tools.py` para la versión completa, que la incluye.)

:::tip[No te saltes la aplicación de solo lectura, ni siquiera para una base de datos de juguete]
Es tentador pensar "es solo una demo, nadie va a escribir `DROP TABLE`". El punto no es un *usuario* malicioso — es que el texto de la consulta aquí lo escribe un LLM, no tú, y los LLM ocasionalmente producen exactamente la consulta que parecía razonable dada una petición ambigua pero hace algo que no pretendías. Trata cualquier herramienta que ejecute SQL compuesto por un modelo contra una base de datos real como si necesitara esta verificación de verdad, no como una idea tardía — esta es la misma disciplina que importa (con mucho más en juego) la primera vez que apuntes una herramienta como esta a una base de datos que no es solo una muestra que construiste para una lección.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`db_tools.py` no tiene ningún `import` de `mcp` en ninguna parte — es puro `sqlite3` y biblioteca estándar.</StepChecklistItem>
<StepChecklistItem>`run_read_only_query("DROP TABLE books")` lanza `UnsafeQueryError` en lugar de ejecutarse.</StepChecklistItem>
<StepChecklistItem>`run_read_only_query("SELECT * FROM books; DROP TABLE books")` también lanza `UnsafeQueryError` — la verificación del punto y coma detecta las sentencias encadenadas.</StepChecklistItem>
<StepChecklistItem>Una consulta `SELECT` real contra tu base de datos devuelve las filas correctas como una lista de diccionarios.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Tanto la verificación de URI `mode=ro` como la verificación de palabras clave basada en texto rechazan consultas inseguras. Si tuvieras que quedarte solo con una, ¿cuál mantendrías, y qué perderías al eliminar la otra?
- `describe_table` construye una consulta con una f-string (`f"PRAGMA table_info({table_name})"`) en lugar de un marcador de posición parametrizado `?`. ¿Por qué no pueden los nombres de tablas y columnas usar el mismo enfoque de marcador `?` que usan los valores, y qué tiene que suceder en su lugar para mantener eso seguro?

## Paso 3: Conecta las funciones como herramientas MCP

Crea `server.py`, importando las funciones del Paso 2 y envolviendo cada una con `@mcp.tool()`, exactamente igual que el patrón `FastMCP` del proyecto Construye un servidor MCP:

```python
# server.py
from mcp.server.fastmcp import FastMCP

from db_tools import DB_PATH, UnsafeQueryError, describe_table, list_tables, run_read_only_query

mcp = FastMCP("library-db")


@mcp.tool()
def list_db_tables() -> list[str]:
    """List every table in the library database.

    Call this first when you don't yet know what data is available.
    """
    return list_tables(DB_PATH)


@mcp.tool()
def describe_db_table(table_name: str) -> list[dict]:
    """Describe a table's columns: name, type, nullability, and primary key.

    Call this after list_db_tables() to learn a table's shape before
    writing a SELECT query against it.
    """
    return describe_table(table_name, DB_PATH)


@mcp.tool()
def query_db(sql: str) -> list[dict]:
    """Run a read-only SELECT query against the library database.

    Only a single SELECT statement is allowed -- no chained statements and
    no write/DDL keywords. Call list_db_tables() and describe_db_table()
    first if you're unsure what tables or columns exist.
    """
    try:
        return run_read_only_query(sql, DB_PATH)
    except UnsafeQueryError as exc:
        return [{"error": str(exc)}]


if __name__ == "__main__":
    mcp.run()
```

Pruébalo exactamente igual que en el proyecto MCP anterior, con el Inspector, antes de tocar ningún cliente real:

```bash
uv run mcp dev server.py
```

Llama a `list_db_tables`, luego a `describe_db_table` con `"books"`, y luego a `query_db` con un `SELECT` real — y, deliberadamente, una vez con algo como `DROP TABLE books`, para verlo regresar como un rechazo claro en lugar de un error a nivel del Inspector.

Fíjate en que `query_db` captura `UnsafeQueryError` él mismo y devuelve un resultado simple `{"error": ...}`, en lugar de dejar que la excepción se propague a través de MCP. Esa es una elección de diseño pequeña pero real: una excepción no manejada de una llamada a herramienta generalmente aparece ante el cliente como un fallo opaco a nivel de protocolo, mientras que un mensaje de error devuelto es algo que el modelo puede leer, entender y ante lo cual reaccionar — por ejemplo, reformulando su propia consulta.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run mcp dev server.py` arranca sin problemas y el Inspector lista las tres herramientas.</StepChecklistItem>
<StepChecklistItem>`list_db_tables` y `describe_db_table` devuelven ambas datos reales y correctos en el Inspector.</StepChecklistItem>
<StepChecklistItem>`query_db` con un `SELECT` real devuelve filas; `query_db` con una consulta de escritura/DDL devuelve un claro `{"error": ...}` en lugar de fallar.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- El docstring de cada herramienta le dice al modelo tanto qué hace como, en el caso de `list_db_tables`, más o menos cuándo llamarla primero. ¿Qué le pasaría a las elecciones de herramientas del modelo si los tres docstrings simplemente dijeran `"""Database tool."""`?
- ¿Por qué envolver `UnsafeQueryError` en un valor devuelto `{"error": ...}` en lugar de dejar que se propague hasta arriba?

## Paso 4: Conéctate a Claude Desktop y haz una pregunta real

Añade tu servidor a `claude_desktop_config.json` (el mismo archivo que usó el proyecto Construye un servidor MCP; macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "library-db": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-sqlite-server", "python", "server.py"]
    }
  }
}
```

**Cierra por completo y vuelve a abrir Claude Desktop.** Una vez que esté de vuelta, hazle una pregunta genuina en lenguaje natural que necesite más de una tabla para responderse, por ejemplo:

> Usando las herramientas de library-db, ¿qué libros están actualmente prestados y aún no han sido devueltos? Dame los títulos y quién los tiene.

Observa lo que sucede: Claude debería llamar a `list_db_tables`, luego a `describe_db_table` sobre `books`, `loans` y `members` para aprender los nombres de las columnas, y después componer y ejecutar su propio `SELECT ... JOIN ...` a través de `query_db` — y responder usando el resultado real, no una suposición. Esta es la recompensa real de todo el proyecto: nunca escribiste ese join tú mismo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`library-db` aparece en la lista de herramientas de Claude Desktop tras un reinicio completo.</StepChecklistItem>
<StepChecklistItem>Al hacer la pregunta de ejemplo anterior se ve a Claude realmente llamando a `list_db_tables`, `describe_db_table` y `query_db` en secuencia, no solo respondiendo de memoria.</StepChecklistItem>
<StepChecklistItem>El SQL que escribió Claude (visible en los detalles expandidos de la llamada a la herramienta) es un join genuino de varias tablas, y la respuesta coincide con lo que obtendrías ejecutando esa consulta tú mismo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Claude escribió su propio SQL aquí, sin que nunca le mostraras una consulta para imitar. ¿Qué en los docstrings de las herramientas y en el esquema que devuelve `describe_db_table` le dio suficiente con lo que trabajar?
- Si hicieras una pregunta ambigua — "muéstrame los libros populares", digamos, sin ninguna definición de "popular" en tu esquema — ¿qué esperarías que hiciera Claude: adivinar una definición, pedirte que aclares, o algo distinto? Pruébalo.

## ⚠️ Errores comunes

- **Confiar en `table_name` directamente en una f-string sin verificarlo primero contra `list_tables()`.** `PRAGMA table_info(...)` no puede aceptar un marcador de posición `?` para un nombre de tabla, así que es tentador simplemente interpolarlo — pero solo después de confirmar que es un nombre de tabla real que tu propio código ya conoce, nunca una cadena cruda proporcionada por el modelo sin verificar.
- **Olvidar la verificación del punto y coma.** Un filtro de palabras clave por sí solo (bloqueando `DROP`, `DELETE`, etc.) no detiene `SELECT * FROM books; DROP TABLE books` si solo buscas palabras clave en la *primera* sentencia — rechaza ante cualquier punto y coma en la consulta, no solo ante palabras clave prohibidas.
- **Una ruta relativa, u olvidar reiniciar completamente Claude Desktop, en el Paso 4.** Los mismos dos errores que en el proyecto Construye un servidor MCP — Claude Desktop necesita una ruta absoluta en la configuración y solo la lee tras un reinicio completo, no al cerrar y reabrir la ventana.
- **Ejecutar el servidor con `python server.py` en lugar de `uv run python server.py`.** Sin `uv run`, puede que no estés en el entorno virtual donde `uv add` instaló `mcp`, y obtengas un `ModuleNotFoundError`.

## Lo que acabas de construir

Una instancia real, aunque pequeña, de un patrón genuinamente útil más allá de una lección: un cliente LLM respondiendo preguntas en lenguaje natural sobre datos estructurados que nunca ha visto antes, descubriendo el esquema y escribiendo su propio SQL a través de herramientas que expusiste — con un límite de seguridad real entre "lectura" y "escritura" aplicado en tu propio código, no dado por supuesto. La base de datos aquí es una biblioteca de juguete, pero nada en `list_db_tables`, `describe_db_table`, ni en la aplicación de solo lectura en `query_db` es específico del juguete — apunta el mismo servidor a un archivo SQLite distinto y funciona sin modificaciones.

## Hacia dónde ir desde aquí

- Apunta este servidor a una base de datos SQLite real que uses de verdad — una exportación de finanzas personales, los datos de un proyecto pequeño, cualquier cosa que ya tengas como archivo `.db` — y observa cómo se comportan las mismas tres herramientas frente a un esquema real y preguntas reales.
- Añade un límite de tamaño de resultado o número de filas a `run_read_only_query`, para que un `SELECT *` amplio sobre una tabla mucho más grande no pueda devolver un resultado desproporcionadamente grande al modelo.
- Lee sobre los **recursos** de MCP — este proyecto solo cubre *herramientas*, pero la información de esquema que devuelve `describe_db_table` es discutiblemente más apta para un recurso (datos legibles) que para una herramienta (una acción). La [documentación del propio SDK](https://github.com/modelcontextprotocol/python-sdk) cubre la diferencia.

:::tip[Ejecuta una versión más completa sin ninguna instalación local — al menos para la lógica de las herramientas]
[`examples/mcp-sqlite-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-sqlite-server) en el repositorio del curso tiene el `seed.py`, `db_tools.py` y `server.py` completos de esta lección, además de un notebook que demuestra las funciones de consulta/esquema de forma aislada. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), para probar las tres herramientas con `uv run mcp dev server.py` — recordando que la conexión real con Claude Desktop igual tiene que ocurrir localmente, según "Dónde ejecutar esto" más arriba.
:::

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: bifurcar el repositorio, crear una rama, hacer commit de tus archivos y abrir el PR, paso a paso. No se asume ninguna experiencia previa con git.

Bienvenido a dejar que una IA escriba su propio SQL — con cuidado. 🎓

<ProjectProgressCheckbox projectId="2027-mcp-sqlite-server" />
