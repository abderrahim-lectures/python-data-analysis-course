---
id: 2027-mcp-notes-server
title: "Construye un Servidor MCP para tus Notas"
sidebar_label: "Construye un Servidor MCP para tus Notas"
slug: /projects/mcp-notes-server
description: "Indexa una carpeta real de notas Markdown y expónla a Claude Desktop como herramientas buscables con el Model Context Protocol -- un servidor MCP de base de conocimiento personal genuinamente útil, no un juguete."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Servidor MCP para tus Notas

<ProjectPublishedDate projectId="2027-mcp-notes-server" />

<ProjectGreeting />

Esto asume Python 101 y comodidad escribiendo funciones simples -- y ayuda mucho haber construido ya el proyecto [Construye un Servidor MCP](/docs/projects/mcp-server) primero, ya que este reutiliza el mismo patrón de decorador `FastMCP` y solo añade contenido real sobre el cual buscar en lugar de dos herramientas de juguete. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

Si mantienes notas en Obsidian, Notion, o simplemente una carpeta simple de archivos Markdown, este proyecto convierte esa carpeta en algo que un asistente de IA realmente puede buscar y leer directamente -- no pegando contenido de notas en una ventana de chat, sino dándole a Claude Desktop herramientas reales: buscar tus notas por palabra clave, extraer una nota completa por título, o listar lo que has tocado más recientemente. Es la misma idea de Model Context Protocol que el proyecto MCP anterior, dirigida a algo que probablemente seguirás usando después.

## 🎯 Lo que harás

1. Instalar `uv` y configurar un pequeño proyecto con el SDK oficial de Python para MCP.
2. Indexar una carpeta real de notas Markdown de muestra -- cargarlas desde disco, extraer títulos y tiempos de modificación.
3. Escribir funciones de búsqueda y consulta como Python simple, y probarlas antes de que esté involucrado cualquier código MCP.
4. Conectar esas funciones como herramientas MCP con `FastMCP`, y conectar el servidor a Claude Desktop.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado aquí, más que la mayoría de proyectos de esta serie -- todo el punto es conectar tu servidor a Claude Desktop, y Claude Desktop es una app instalada en tu propia máquina que necesita lanzar un proceso local con el que pueda hablar directamente. No hay forma de evitar hacer al menos el último paso localmente.

**GitHub Codespaces** es un lugar razonable para escribir y probar la lógica de indexación y búsqueda en sí: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio), escribe `server.py` y una carpeta de notas de muestra, y llama a tus funciones directamente en un shell de Python, o ejecuta `mcp dev server.py` y usa el Inspector a través del puerto reenviado del Codespace. Lo que un Codespace *no puede* ser es tu punto de conexión final de Claude Desktop -- alcanzar un Codespace desde una app de escritorio necesitaría túneles extra que están fuera del alcance de este proyecto. Trata Codespaces como bueno para los Pasos 1–3, y haz el Paso 4 localmente.

**Google Colab y Kaggle no son un buen ajuste para el servidor real**, igual que el proyecto MCP anterior -- sáltatelos para lo real. Ninguno te da un proceso local persistente al que un cliente de IA de escritorio pueda conectarse; una celda de notebook que "ejecuta un servidor" en Colab no es alcanzable por Claude Desktop en tu propia máquina en absoluto.

Dicho esto, si solo quieres explorar las funciones de búsqueda y consulta como Python simple -- sin protocolo MCP, sin proceso de servidor, sin Claude Desktop -- existe un notebook más limitado exactamente para eso. Demuestra las funciones subyacentes de búsqueda/consulta de forma aislada, no el servidor MCP en vivo:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-notes-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-notes-server/notebook.ipynb)

Llama a la misma lógica de herramientas directamente como funciones ordinarias, sin decorador, sin servidor, y sin conexión de cliente -- útil para experimentar con el código, no un sustituto del proyecto real de abajo.

## Configuración

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" -- puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

Luego configura un proyecto e instala el SDK oficial de Python para MCP, con su extra opcional `cli` (esto es lo que te da el comando `mcp dev` usado más adelante):

```bash
uv init mcp-notes-server
cd mcp-notes-server
uv add "mcp[cli]"
```

No se necesita ninguna clave de API en ningún lugar de este proyecto -- es búsqueda local pura sobre archivos ya en tu disco, sin ninguna llamada a modelo de lenguaje involucrada en la lógica de indexación o búsqueda en sí.

## Paso 1: Indexa una carpeta de notas de muestra

Crea una carpeta `notes/` junto a donde vivirá `server.py`, y pon un puñado de archivos `.md` reales en ella -- una receta, un par de notas de libros, una lista de ideas de proyectos, lo que sea que realmente tengas por ahí. Cada nota solo necesita un encabezado `# Título` cerca del principio; nada más sobre su estructura importa. Si aún no tienes notas reales a mano, escribe 4–5 cortas ahora -- temas genuinamente diferentes, no cuatro variaciones de lo mismo, para que los resultados de búsqueda más adelante realmente signifiquen algo.

Luego escribe el código de carga en `server.py`:

```python
# server.py
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

NOTES_DIR = Path.home() / "path" / "to" / "notes"  # adjust this to your real notes folder


@dataclass
class Note:
    path: Path
    title: str
    body: str
    modified: float


def _load_note(path: Path) -> Note:
    """Read one .md file off disk and pull its title from the first '# ' heading."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    title = path.stem
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            break
    return Note(path=path, title=title, body=text, modified=path.stat().st_mtime)


def _all_notes() -> list[Note]:
    """Load every .md file in NOTES_DIR fresh each call -- cheap at personal-notes
    scale, and it means edits on disk show up immediately, with no cache to invalidate."""
    if not NOTES_DIR.exists():
        return []
    return [_load_note(p) for p in sorted(NOTES_DIR.glob("*.md"))]
```

Nada aquí es específico de MCP todavía -- es E/S de archivos ordinaria. Eso es deliberado: haz que la indexación funcione correctamente por sí sola, con un shell de Python simple, antes de que entre en juego cualquier código de protocolo.

```bash
uv run python -c "from server import _all_notes; print([n.title for n in _all_notes()])"
```

Deberías ver el título de cada nota impreso de vuelta. Si la lista está vacía, `NOTES_DIR` está mal antes que cualquier otra cosa.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`notes/` contiene al menos 4 notas `.md` reales y genuinamente diferentes, cada una con un encabezado `# Título`.</StepChecklistItem>
<StepChecklistItem>`_all_notes()` devuelve un `Note` por archivo, con el título correcto extraído de cada encabezado.</StepChecklistItem>
<StepChecklistItem>`NOTES_DIR` apunta a una carpeta real que realmente existe en tu máquina.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `_all_notes()` recarga cada archivo del disco en cada llamada, sin caché. ¿En qué punto -- cientos de notas? miles? -- eso dejaría de ser "suficientemente barato," y qué cambiarías primero?
- ¿Qué pasa ahora mismo si una nota no tiene ningún encabezado `# ` en absoluto? ¿Es ese el comportamiento que quieres, o preferirías que fallara ruidosamente?

## Paso 2: Construye las funciones de búsqueda y consulta

Con las notas cargando correctamente, escribe las funciones que realmente responden preguntas sobre ellas -- todavía Python simple, todavía probable sin ningún cliente de IA en el ciclo:

```python
import time


def search_notes(query: str) -> str:
    """Search every note for a keyword and report which notes mention it."""
    query_lower = query.lower()
    matches = []
    for note in _all_notes():
        for line in note.body.splitlines():
            if query_lower in line.lower():
                matches.append(f'"{note.title}": {line.strip()[:160]}')
                break  # one hit per note is enough context
    if not matches:
        return f"No notes mention '{query}'."
    return "Found in:\n" + "\n".join(matches)


def get_note_by_title(title: str) -> str:
    """Return the full text of one note, matched by exact or partial title."""
    title_lower = title.lower()
    notes = _all_notes()

    exact = [n for n in notes if n.title.lower() == title_lower]
    if len(exact) == 1:
        return exact[0].body

    partial = [n for n in notes if title_lower in n.title.lower()]
    if len(partial) == 1:
        return partial[0].body
    if len(partial) > 1:
        titles = ", ".join(f'"{n.title}"' for n in partial)
        return f"Multiple notes match '{title}': {titles}. Be more specific."

    return f"No note titled '{title}' found."


def list_recent_notes(limit: int = 5) -> str:
    """List the most recently modified notes, newest first."""
    notes = sorted(_all_notes(), key=lambda n: n.modified, reverse=True)[:limit]
    if not notes:
        return "No notes found."

    now = time.time()
    lines = []
    for note in notes:
        age_days = (now - note.modified) / 86400
        age = "today" if age_days < 1 else f"{int(age_days)} days ago"
        lines.append(f'"{note.title}" ({age})')
    return "\n".join(lines)
```

`get_note_by_title` deliberadamente se niega a adivinar cuando un título parcial coincide con más de una nota, en lugar de devolver silenciosamente la primera coincidencia -- devolver el contenido completo de la nota equivocada a un asistente de IA (y, más adelante, a ti) es peor que pedir un título más específico.

Prueba las tres a mano antes de continuar, de la misma forma que probaste `_all_notes()`:

```bash
uv run python -c "from server import search_notes; print(search_notes('your-keyword'))"
```

:::tip[Prueba funciones simples antes de que cualquier código de protocolo las toque]
Cada bug es más fácil de encontrar aquí que después de que `@mcp.tool()`, el Inspector, y Claude Desktop están todos mezclados a la vez. Si `search_notes` devuelve lo incorrecto ahora mismo, sabes con certeza que el bug está en esta función -- no en una conexión, un archivo de configuración, o la propia selección de herramientas del modelo.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`search_notes` encuentra una palabra clave que sabes que está en una de tus notas, y devuelve un fragmento real y correcto.</StepChecklistItem>
<StepChecklistItem>`get_note_by_title` devuelve el texto completo de la nota para un título exacto, y un mensaje real de "sé más específico" para uno parcial ambiguo.</StepChecklistItem>
<StepChecklistItem>`list_recent_notes` devuelve notas en el orden correcto -- editadas más recientemente primero.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `search_notes` devuelve como máximo un fragmento por nota, incluso si una palabra clave aparece muchas veces en el mismo archivo. ¿Qué perderías, o ganarías, devolviendo cada línea coincidente en su lugar?
- Si tuvieras dos notas con títulos idénticos (en carpetas diferentes, digamos), ¿cuál de las tres funciones de hoy se comportaría mal primero, y cómo?

## Paso 3: Conéctalas como herramientas MCP con FastMCP

Todo hasta ahora ha sido Python simple. Convertirlo en un servidor MCP es un decorador por función -- sin código a nivel de protocolo que escribir a mano:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("notes")  # the name your AI client will show for this server


@mcp.tool()
def search_notes(query: str) -> str:
    """Search every note for a keyword and report which notes mention it.

    Looks through each .md file in the notes folder (case-insensitive) and
    returns each matching note's title plus one line of surrounding context.
    Call this when someone asks whether, or where, a topic comes up in their
    notes -- e.g. "do I have any notes about sourdough?".
    """
    ...  # same body as Step 2


@mcp.tool()
def get_note_by_title(title: str) -> str:
    """Return the full text of one note, matched by title.

    Matching is case-insensitive and allows a partial match as long as
    exactly one note matches; ambiguous partial matches are reported
    instead of guessed. Call this once search_notes (or the user) has
    identified which note they want in full, not as a first-pass search tool.
    """
    ...  # same body as Step 2


@mcp.tool()
def list_recent_notes(limit: int = 5) -> str:
    """List the most recently modified notes, newest first.

    Reports each note's title and how long ago it was last edited. Call
    this when someone asks what they've been working on lately, or wants
    a quick overview of the notes folder without searching for anything
    specific.
    """
    ...  # same body as Step 2


if __name__ == "__main__":
    mcp.run()
```

`@mcp.tool()` inspecciona el nombre de cada función, sus parámetros con anotaciones de tipo, y el docstring, y construye una definición de herramienta MCP automáticamente -- el modelo lee tu docstring, no tu código, para decidir cuándo una herramienta coincide con una solicitud. Con tres herramientas ahora en lugar de una, los docstrings que distinguen claramente *cuándo* llamar a cada una importan más de lo que importaban con una sola herramienta: nota que el docstring de `get_note_by_title` dice explícitamente que es para después de la búsqueda, no en lugar de ella.

Antes de tocar cualquier cliente de IA real, ejecuta el comando dev/inspector del SDK y prueba las tres herramientas a mano:

```bash
uv run mcp dev server.py
```

Esto abre el **MCP Inspector** -- una herramienta gratuita basada en navegador que te permite llamar a cada herramienta con argumentos reales y ver valores de retorno reales, sin ningún modelo de IA involucrado. Confirma que las tres herramientas funcionan aquí primero.

:::tip[Tres herramientas son más que suficientes para ver que los docstrings importan]
Con una herramienta, el modelo no tiene nada entre qué elegir. Con tres, intenta preguntarle a los prompts subyacentes del Inspector (o, una vez conectado, al propio Claude Desktop) algo ambiguo, como "cuéntame sobre mi nota de pasta" -- y observa si recurre a `search_notes` o `get_note_by_title` primero. Si elige la "incorrecta", eso casi siempre es un problema de docstring, no un bug en tu función.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`server.py` define las tres herramientas con `@mcp.tool()` y docstrings reales y específicos.</StepChecklistItem>
<StepChecklistItem>`uv run mcp dev server.py` inicia sin errores y el Inspector lista las tres herramientas.</StepChecklistItem>
<StepChecklistItem>Llamar a cada herramienta a mano en el Inspector devuelve los mismos resultados correctos que ya viste en el Paso 2.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Ahora que hay tres herramientas en lugar de una, ¿cómo decidirías si una nueva herramienta pertenece a este servidor, o debería quedarse como una función auxiliar privada que ningún cliente ve nunca?
- Si el docstring de `list_recent_notes` no mencionara "qué he estado trabajando últimamente," ¿esperarías que el modelo la llamara igual para esa frase? ¿Qué sugiere eso sobre cuán literalmente escribir estos?

## Paso 4: Conéctalo a Claude Desktop y pruébalo

El nivel gratuito de [Claude Desktop](https://claude.ai/download) soporta conectarse a servidores MCP locales. Lee un archivo de configuración JSON que le dice qué servidores lanzar y cómo:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Si el archivo aún no existe, créalo. Añade tu servidor, usando una ruta **absoluta** a la carpeta de tu proyecto:

```json
{
  "mcpServers": {
    "notes": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-notes-server", "python", "server.py"]
    }
  }
}
```

`command` y `args` describen exactamente el proceso que Claude Desktop lanzará para hablar con tu servidor -- la misma invocación `uv run` que ya probaste en el Paso 3, solo iniciada por Claude Desktop en lugar de por ti. Usar `uv run` (en lugar de un `python` simple) importa aquí: Claude Desktop lanza este comando en su propio entorno, sin garantía de que el entorno virtual de tu proyecto ya esté activo, y `uv run` encuentra y usa el correcto por sí mismo.

**Cierra completamente y reinicia Claude Desktop** -- una instancia en ejecución no vuelve a leer este archivo por sí sola. Una vez que reinicie, tu servidor debería aparecer en su lista de herramientas/conectores. Prueba preguntas como:

> Do I have any notes about sourdough? Use the notes tools if you have them.
>
> What have I been working on most recently, based on my notes?
>
> Pull up my full "side project ideas" note.

Claude Desktop debería mostrar que está llamando a `search_notes`, `list_recent_notes`, o `get_note_by_title` (a menudo como un pequeño bloque colapsable "usó una herramienta", con los argumentos y resultado visibles si lo expandes), luego responder usando el resultado real que devolvió tu función -- no una suposición.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`notes` (o el nombre de servidor que elegiste) aparece en la lista de herramientas/conectores de Claude Desktop después de un reinicio completo.</StepChecklistItem>
<StepChecklistItem>Preguntar sobre un tema que sabes que está en una de tus notas realmente muestra a Claude llamando a una herramienta, no solo respondiendo de memoria o adivinando.</StepChecklistItem>
<StepChecklistItem>Pedirle a Claude que extraiga una nota específica por nombre devuelve su contenido real y completo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si le preguntaras a Claude Desktop algo sobre lo que tus notas no dicen nada, ¿esperarías que llamara a una herramienta de todas formas y reportara "nada encontrado," o que respondiera desde conocimiento general en su lugar? ¿Qué pasó, y por qué crees que es así?
- Ahora que esto está conectado de verdad, ¿cuál es la primera cosa sobre tu carpeta de notas real que rompería estas funciones si apuntaras `NOTES_DIR` a ella hoy?

## ⚠️ Errores comunes

- **Una ruta relativa o incorrecta en el archivo de configuración.** `claude_desktop_config.json` necesita una ruta absoluta a la carpeta de tu proyecto -- una relativa no tiene un "directorio actual" consistente contra el cual resolverse cuando Claude Desktop lanza tu servidor, y simplemente fallará al iniciarlo.
- **Olvidar reiniciar completamente Claude Desktop después de editar la configuración.** Guardar el archivo JSON solo no hace nada -- la app solo lo lee al iniciar, así que cerrar y reabrir una ventana tampoco es suficiente; cierra la app por completo primero.
- **`get_note_by_title` devolviendo silenciosamente la nota equivocada.** Si te saltas la verificación de "más de una coincidencia parcial" y simplemente devuelves la primera coincidencia, un título como "notes" coincidirá silenciosamente con el archivo equivocado en el momento en que tengas dos notas con nombres similares -- vale la pena probar con títulos intencionalmente ambiguos antes de confiar en ello.
- **Un docstring demasiado vago para que el modelo elija la herramienta correcta entre tres.** `"""Gets a note."""` no le da al modelo nada para distinguir `get_note_by_title` de `search_notes`. Di claramente qué hace cada herramienta y cuándo llamarla, de la forma en que lo hacen los docstrings de arriba.
- **Ejecutar el servidor con `python server.py` simple en lugar de `uv run python server.py`.** Sin `uv run`, el intérprete que se inicia puede no ser aquel en el que `uv add` instaló `mcp`, y obtendrás un `ModuleNotFoundError` para `mcp` aunque `uv add` claramente dijo que se instaló exitosamente.

## Lo que acabas de construir

Un servidor MCP independiente que convierte una carpeta real de tus propias notas en algo que un asistente de IA puede buscar y leer directamente, usando tres herramientas con trabajos genuinamente diferentes -- búsqueda por palabra clave, consulta exacta, y listado de recencia -- en lugar de una función que lo abarca todo. El mismo servidor funciona sin modificaciones con cualquier cliente compatible con MCP, no solo Claude Desktop, y la lógica de indexación subyacente no tiene nada específico de MCP en absoluto: son solo archivos en disco, leídos frescos en cada llamada.

## A dónde ir desde aquí

- Apunta `NOTES_DIR` a tu bóveda real de Obsidian, exportación de Notion, o carpeta simple de notas en lugar de las notas de muestra con las que empezaste, y ve qué se rompe -- estilos de encabezado inconsistentes, archivos enormes, adjuntos que no son Markdown mezclados.
- Añade una herramienta que filtre por etiqueta, si tus notas reales usan una convención `tags:` como lo hacen las notas de muestra aquí -- misma forma que `search_notes`, pero coincidiendo con un campo estructurado en lugar de texto libre.
- Lee sobre **recursos** y **prompts** de MCP -- esta lección solo cubre *herramientas*, pero el protocolo también define formas de exponer datos legibles (recursos) y plantillas de prompt reutilizables (prompts) a un cliente. La [propia documentación del SDK](https://github.com/modelcontextprotocol/python-sdk) cubre ambos, con el mismo estilo de decorador `FastMCP`.
- Ya que la especificación está evolucionando activamente, revisa periódicamente la [documentación oficial de MCP](https://modelcontextprotocol.io) por cualquier cosa que haya cambiado desde que construiste esto.

:::tip[Ejecuta una versión más completa sin configuración local -- para la lógica de herramientas, al menos]
[`examples/mcp-notes-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-notes-server) en el repositorio del curso es una versión ligeramente más completa del código de arriba, con 7 notas de muestra reales ya escritas y las tres herramientas implementadas. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), para probar las tres herramientas con `uv run mcp dev server.py` -- recordando que la conexión real de Claude Desktop todavía necesita suceder localmente, según "Dónde ejecutar esto" de arriba.
:::

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado -- y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-mcp-notes-server" />
