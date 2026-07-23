---
id: mcp-server
title: "Construye un Servidor MCP"
sidebar_label: "Construye un Servidor MCP"
slug: /projects/mcp-server
description: "Gradúate del playground en el navegador a Python de verdad: construye un servidor Model Context Protocol que expone tus propias herramientas, y conéctalo a un cliente de IA real como Claude Desktop."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Servidor MCP

<ProjectPublishedDate projectId="mcp-server" />

<ProjectGreeting />

El [Model Context Protocol](https://modelcontextprotocol.io) (MCP) es una forma estándar para que un asistente de IA llame a código, herramientas y datos que viven fuera de él. Un *servidor* MCP es un pequeño programa que escribes tú y que expone un puñado de herramientas; un *cliente* MCP — Claude Desktop, por ejemplo — se conecta a ese servidor y deja que el modelo llame a esas herramientas en tu nombre, de la misma forma en que un navegador web es un cliente que habla con un servidor web. Este proyecto construye el lado del servidor: tus propias funciones de Python, registradas como herramientas MCP, invocables por un asistente de IA real corriendo en tu propia máquina.

Esto asume Python 101 y comodidad escribiendo funciones simples — nada de Data Analysis es necesario. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para ver la lista completa, que sigue creciendo. Combina de forma natural con el [proyecto de Agente de IA](/docs/projects/ai-agent) — la misma idea subyacente, darle a una IA herramientas que puede llamar, abordada desde el lado opuesto: allí construiste el agente que llama a herramientas directamente, en el mismo proceso de Python; aquí construyes un servidor independiente al que *cualquier* cliente compatible con MCP puede conectarse, sin que ese cliente necesite saber nada de tu código más allá del protocolo.

MCP es uno de los patrones más activamente adoptados para extender asistentes de IA en este momento — vale la pena haber construido uno, aunque sea una versión mínima, mientras siga siendo así de vigente.

## 🎯 Qué harás

1. Instalar `uv` y configurar un pequeño proyecto con el SDK oficial de Python para MCP.
2. Escribir un servidor MCP que exponga dos de tus propias herramientas, usando la API `FastMCP` del SDK.
3. Ejecutar tu servidor en local y probar sus herramientas a mano con el MCP Inspector, antes de conectar cualquier cliente de IA real.
4. Registrar tu servidor con el nivel gratuito de Claude Desktop y ver cómo realmente llama a tu código.

## Dónde ejecutar esto

**En local con `uv`** es el camino principal y recomendado para este proyecto, más aún que para la mayoría de los otros proyectos de esta serie — el objetivo entero es conectar tu servidor a Claude Desktop, y Claude Desktop es una app instalada en tu propia máquina. No hay forma de evitar hacer al menos el último paso en local.

**GitHub Codespaces** es un lugar razonable para escribir y probar la *lógica de las herramientas en sí*: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio), escribe `server.py`, y llama a tus funciones de herramienta directamente en una shell de Python, o incluso ejecuta `mcp dev server.py` y usa el Inspector a través del puerto reenviado del Codespace. Lo que un Codespace *no puede* ser es tu punto de conexión final con Claude Desktop — Claude Desktop corre en tu propio escritorio y necesita lanzar un proceso local con el que pueda hablar directamente; llegar hasta un Codespace desde ahí necesitaría un túnel adicional que está fuera del alcance de este proyecto. Trata Codespaces como bueno para los Pasos 1–3, y haz el Paso 4 en local.

**Google Colab y Kaggle no son un buen ajuste para este proyecto**, a diferencia de la mayoría de los demás en esta serie — sáltatelos aquí. Ninguno de los dos te da un proceso local persistente al que un cliente de IA de escritorio pueda conectarse; una celda de notebook que "ejecuta un servidor" en Colab no es alcanzable en absoluto por Claude Desktop en tu propia máquina.

## Paso 1: Instalar `uv`

`uv` es una única herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, y luego confirma que se instaló:

```bash
uv --version
```

Luego configura un proyecto e instala el SDK oficial de Python para MCP, con su extra opcional `cli` (esto es lo que te da el comando `mcp dev` usado en el Paso 3):

```bash
uv init mcp-server
cd mcp-server
uv add "mcp[cli]"
```

## Paso 2: Escribe tu primer servidor MCP

La API de alto nivel del SDK, `FastMCP`, convierte una función de Python ordinaria en una herramienta MCP con un solo decorador — sin código a nivel de protocolo que escribir a mano. Crea `server.py`:

```python
# server.py
from pathlib import Path

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("course-tools")  # the name your AI client will show for this server

DOCS_DIR = Path.home() / "path" / "to" / "python-data-analysis-course" / "docs"  # adjust this


@mcp.tool()
def search_course_topics(query: str) -> str:
    """Search this course's lesson files for a topic and report which pages mention it.

    Looks through every .md file under docs/ for `query` (case-insensitive) and
    returns each matching file's name plus one line of context. Call this when
    someone asks whether, or where, a topic is covered in the course.
    """
    query_lower = query.lower()
    matches = []
    for path in sorted(DOCS_DIR.rglob("*.md")):
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            if query_lower in line.lower():
                matches.append(f"{path.name}: \"{line.strip()[:120]}\"")
                break
        if len(matches) >= 5:
            break
    return "Found in:\n" + "\n".join(matches) if matches else f"No lesson pages mention '{query}'."


@mcp.tool()
def count_words(text: str) -> int:
    """Count the words in a piece of text, splitting on whitespace."""
    return len(text.split())


if __name__ == "__main__":
    mcp.run()
```

`@mcp.tool()` está haciendo todo el trabajo de registro aquí: inspecciona el nombre de la función, sus parámetros con anotaciones de tipo, y su docstring, y construye una definición de herramienta MCP a partir de ellos automáticamente — nunca escribes un esquema a mano. Esta es la misma idea que enseña el [proyecto de Agente de IA](/docs/projects/ai-agent) para las herramientas de LangChain: **el modelo lee tu docstring, no tu código, para decidir cuándo una herramienta encaja con una solicitud.** Un docstring vago no le da al modelo nada con qué guiarse; un docstring que dice claramente qué hace la herramienta y cuándo llamarla es lo que realmente hace que funcione la selección de herramientas.

`search_course_topics` es deliberadamente la misma idea que la herramienta de juguete del proyecto de Agente de IA — buscar en los propios archivos de este curso un tema — pero expuesta a través del decorador de herramientas de MCP en lugar de pasada directamente a la lista `tools=[...]` de un agente. `count_words` es una utilidad más pequeña e independiente, incluida para mostrar un servidor que expone más de una herramienta a la vez — un cliente MCP ve ambas y elige la que encaje con una pregunta dada.

:::tip[Revisa la documentación actual del SDK de MCP antes de confiar en esto]
MCP es una especificación joven y de rápido movimiento — el protocolo mismo, y la propia API del SDK de Python, han cambiado desde las primeras versiones. El estilo basado en decoradores de `FastMCP` ha sido estable por un tiempo, pero antes de construir algo más allá de esta lección, hojea el [README y la documentación propios del SDK](https://github.com/modelcontextprotocol/python-sdk) en lugar de asumir que los detalles de este fragmento siguen coincidiendo exactamente.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`server.py` se guarda sin errores de sintaxis y define tanto `search_course_topics` como `count_words`.</StepChecklistItem>
<StepChecklistItem>Cada herramienta tiene un docstring real, en inglés/español simple — no un placeholder.</StepChecklistItem>
<StepChecklistItem>`DOCS_DIR` apunta a una carpeta `docs/` real que realmente existe en tu máquina.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Qué pasaría si dos de tus herramientas tuvieran docstrings muy parecidos? ¿Cómo podría un modelo elegir entre ellas, y qué sugiere eso sobre escribir docstrings para un servidor con muchas herramientas?
- `search_course_topics` devuelve un string, no datos estructurados. ¿Qué perderías, o ganarías, devolviendo en su lugar una lista de coincidencias?

## Paso 3: Ejecuta y prueba tu servidor en local

Antes de conectar esto a cualquier cliente de IA real, ejecútalo por su cuenta y confirma que las herramientas realmente funcionan. El SDK trae un comando **dev/inspector** exactamente para esto:

```bash
uv run mcp dev server.py
```

Esto arranca tu servidor y abre el **MCP Inspector** — una herramienta gratuita basada en navegador que te permite llamar a `search_course_topics` y `count_words` a mano, pasar argumentos de prueba, y ver los valores de retorno reales, sin ningún modelo de IA involucrado en absoluto. (La primera ejecución podría pedirte instalar un pequeño paquete proxy basado en `npx` que usa el Inspector; acéptalo.)

Prueba ambas herramientas aquí antes de continuar: llama a `search_course_topics` con una consulta que sepas que aparece en `docs/` (p. ej. `"groupby"`), y a `count_words` con una oración corta. Si alguna se comporta mal, estás ante un bug en tu función de Python — arréglalo aquí, donde la única pieza móvil es tu propio código, en lugar de depurarlo más tarde con Claude Desktop en el bucle, donde un resultado incorrecto podría ser igual de fácilmente un problema de conexión, un error tipográfico de configuración, o el modelo eligiendo la herramienta equivocada.

También puedes simplemente ejecutar el servidor directamente, sin el Inspector, para confirmar que arranca limpiamente:

```bash
uv run python server.py
```

No imprimirá nada por sí solo — un servidor MCP se queda esperando a que un cliente se conecte por stdio. El silencio aquí es esperado, no un bug; usa `Ctrl+C` para detenerlo.

:::tip[Prueba con el Inspector antes de tocar un cliente real]
Es tentador saltar directo a Claude Desktop. Resiste eso — el Inspector aísla el código de tu herramienta de todo lo demás que puede salir mal en una conexión de cliente real (rutas de configuración, reinicios, la propia selección de herramientas del modelo). Consigue que ambas herramientas funcionen ahí primero.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run mcp dev server.py` arranca sin errores y abre el Inspector en tu navegador.</StepChecklistItem>
<StepChecklistItem>El Inspector lista tanto `search_course_topics` como `count_words`.</StepChecklistItem>
<StepChecklistItem>Llamar a cada herramienta a mano en el Inspector devuelve un resultado real y correcto — no un error.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si `search_course_topics` devolviera un error en lugar de un resultado, ¿cómo distinguirías si el bug está en tu código de Python o en la propia conexión MCP? ¿Qué te da probar primero con el Inspector?
- ¿Por qué podría importar que el Inspector no necesite ningún modelo de IA en absoluto para probar tus herramientas?

## Paso 4: Conéctalo a Claude Desktop

El nivel gratuito de [Claude Desktop](https://claude.ai/download) admite conectarse a servidores MCP locales. Lee un archivo de configuración JSON que le indica qué servidores lanzar y cómo:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Si el archivo todavía no existe, créalo. Agrega tu servidor, usando una ruta **absoluta** a la carpeta de tu proyecto:

```json
{
  "mcpServers": {
    "course-tools": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-server", "python", "server.py"]
    }
  }
}
```

`command` y `args` describen exactamente el proceso que Claude Desktop va a lanzar para hablar con tu servidor — la misma invocación de `uv run` que ya probaste en el Paso 3, solo que iniciada por Claude Desktop en lugar de por ti. Usar `uv run` (en lugar de un `python` a secas) importa aquí: Claude Desktop lanza este comando en su propio entorno, sin ninguna garantía de que el entorno virtual de tu proyecto ya esté activo, y `uv run` encuentra y usa el correcto por su cuenta.

**Cierra completamente y reinicia Claude Desktop** — una instancia en ejecución no vuelve a leer este archivo por su cuenta. Una vez que reinicie, tu servidor debería aparecer en su lista de herramientas/conectores (usualmente detrás de un pequeño ícono cerca de la caja de mensajes). Pídele algo que debería disparar una llamada a herramienta, p. ej.:

> Does the Python course cover groupby? Use the course-tools search if you have it.

Claude Desktop debería mostrar que llama a `search_course_topics` (a menudo como un pequeño bloque colapsable de "usó una herramienta" en la conversación, con los argumentos y el resultado visibles si lo expandes), y luego responder usando el resultado real que devolvió tu función — no una suposición de los datos de entrenamiento del modelo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`course-tools` (o el nombre de servidor que elegiste) aparece en la lista de herramientas/conectores de Claude Desktop después de un reinicio completo.</StepChecklistItem>
<StepChecklistItem>Preguntar algo que debería disparar `search_course_topics` realmente muestra a Claude llamándola, no solo respondiendo de memoria.</StepChecklistItem>
<StepChecklistItem>El resultado que Claude muestra usar coincide con lo que viste al probar la misma llamada en el Inspector.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Claude Desktop decide por su cuenta si llama a tu herramienta para un mensaje dado. ¿Qué frase en tu pregunta de prueba hizo eso más o menos probable, y por qué crees que es así?
- Si preguntaras algo completamente ajeno al curso, ¿esperarías que Claude llamara a `search_course_topics` de todas formas? ¿Qué te diría eso sobre cómo está decidiendo realmente el modelo cuándo una herramienta es relevante?

## ⚠️ Errores comunes

- **Una ruta relativa o incorrecta en el archivo de configuración.** `claude_desktop_config.json` necesita una ruta absoluta a la carpeta de tu proyecto — una relativa no tiene ningún "directorio actual" consistente contra el cual resolverse cuando Claude Desktop lanza tu servidor, y simplemente fallará al iniciarlo.
- **Olvidar reiniciar completamente Claude Desktop después de editar la configuración.** Guardar el archivo JSON por sí solo no hace nada — la app solo lo lee al arrancar, así que cerrar y volver a abrir una ventana tampoco es suficiente; cierra la app por completo primero.
- **Un docstring demasiado vago para que el modelo elija la herramienta correcta.** `"""Does stuff with text."""` no le da al modelo nada con qué comparar una pregunta real. Di claramente qué hace la herramienta e, idealmente, cuándo llamarla — exactamente como el docstring de `search_course_topics` de arriba.
- **Ejecutar el servidor con `python server.py` a secas en lugar de `uv run python server.py`.** Sin `uv run`, el intérprete que arranca podría no ser aquel en el que `uv add` instaló `mcp`, y obtendrás un `ModuleNotFoundError` para `mcp` aunque `uv add` haya dicho claramente que se instaló con éxito.

## Lo que acabas de construir

Dos pequeñas herramientas son un ejemplo de juguete, pero la forma es real: un proceso independiente que expone funciones de Python a través de un protocolo estándar, conectable a cualquier cliente compatible con MCP sin que ese cliente sepa nada de tu código más allá de los nombres de las herramientas, sus argumentos y sus docstrings. Ese es el punto real de MCP — el mismo servidor que acabas de construir funcionaría sin modificaciones con un cliente MCP completamente distinto, algo que no es cierto de la lista `tools=[...]` fuertemente acoplada del proyecto de Agente de IA.

## A dónde ir desde aquí

- Dale a `search_course_topics` (o a una herramienta nueva) acceso a algo genuinamente más útil que texto de lecciones — un pequeño archivo local, un dataset real, un script que ejecute un cálculo que realmente necesites.
- Lee sobre **recursos** y **prompts** de MCP — esta lección solo cubre *herramientas*, pero el protocolo también define formas de exponer datos legibles (recursos) y plantillas de prompt reutilizables (prompts) a un cliente. La [documentación propia del SDK](https://github.com/modelcontextprotocol/python-sdk) cubre ambos, con el mismo estilo de decorador `FastMCP`.
- Ya que la especificación está evolucionando activamente, revisa periódicamente la [documentación oficial de MCP](https://modelcontextprotocol.io) por si algo cambió desde que construiste esto — nuevas opciones de transporte y capacidades de cliente han estado llegando a un ritmo constante.

:::tip[Ejecuta una versión más completa sin ninguna configuración local — al menos para la lógica de las herramientas]
[`examples/mcp-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-server) en el repositorio del curso es una versión ligeramente más completa del código de arriba, con `search_course_topics` conectado a la carpeta `docs/` real del repositorio en el que se ejecuta (sin ninguna ruta que editar a mano). Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), para probar ambas herramientas con `uv run mcp dev server.py` — recordando que la conexión real a Claude Desktop todavía necesita ocurrir en local, según "Dónde ejecutar esto" arriba.
:::

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes para agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, hacer commit de tus archivos, y abrir el PR, un paso a la vez. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="mcp-server" />
