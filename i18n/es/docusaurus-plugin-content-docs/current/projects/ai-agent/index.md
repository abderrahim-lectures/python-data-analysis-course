---
id: 2026-ai-agent
title: "Construye un Agente de IA"
sidebar_label: "Construye un Agente de IA"
slug: /projects/ai-agent
description: "Da el salto del entorno de práctica en el navegador a Python real: instala Python localmente y construye tu primer agente de IA con deepagents de LangChain."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';

# 🌍 Construye un Agente de IA

<ProjectPublishedDate projectId="2026-ai-agent" />

Todo hasta ahora se ejecutó en un playground aislado dentro del navegador — para que pudieras empezar a escribir Python desde el primer día sin ninguna configuración. Este proyecto es el paso de graduación: instala Python de verdad en tu propia máquina, y luego úsalo para construir algo que el playground nunca pudo ejecutar — un agente de IA con su propia clave de API, llamando a un modelo de lenguaje real.

Esto es opcional y no calificado — una buena opción una vez que hayas terminado Python 101 (los fundamentos de manejo de datos de Data Analysis son un plus, no un requisito). Consulta [Proyectos del mundo real](/docs/projects) para ver la lista completa, que sigue creciendo.

## 🎯 Qué harás

1. Instalar `uv`, una herramienta rápida y moderna para gestionar el propio Python y las dependencias de tu proyecto — sin necesitar un instalador de Python separado.
2. Obtener una clave de API de IA de nivel gratuito. **Eres libre de usar el proveedor que prefieras** — GitHub Models es el valor por defecto sugerido abajo ya que no necesita un registro separado (ya tienes una cuenta de GitHub), pero Gemini, Groq, Mistral, Cerebras y OpenRouter también tienen niveles gratuitos utilizables.
3. Configurar un pequeño proyecto e instalar `deepagents` de LangChain.
4. Escribir y ejecutar un pequeño agente, localmente, desde tu propia terminal.

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

### Instalar un intérprete de Python real

A diferencia de los playgrounds dentro del navegador, `uv` puede obtener y gestionar un intérprete de Python real en tu máquina directamente — no necesitas visitar python.org por separado:

```bash
uv python install 3.12
```

Este es tu momento de graduación: un Python real, instalado y gestionado en tu propia computadora, no dentro de un sandbox de navegador.

## Paso 2: Obtener una clave de API de IA gratuita

**Elige el proveedor que prefieras** — ninguno de ellos requiere una tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro. El agente de ejemplo en el repositorio del curso ([`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent)) soporta los seis de fábrica, seleccionados con un solo ajuste.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(valor por defecto sugerido)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el alcance `models: read` | Sin registro separado — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que los de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada; usada en borradores anteriores de esta página. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — buena para comparar proveedores. |

Cualquiera que elijas, el proceso es el mismo:

1. Inicia sesión y genera una clave de API en el sitio de ese proveedor.
2. **Nunca pegues esta clave directamente en el código ni la subas a un repositorio.** En su lugar, configúrala como una variable de entorno:

```bash
# macOS / Linux (agrégalo a ~/.bashrc o ~/.zshrc para que persista)
export GITHUB_TOKEN="your-key-here"   # o GOOGLE_API_KEY, GROQ_API_KEY, etc. -- según tu proveedor

# Windows (PowerShell)
$env:GITHUB_TOKEN = "your-key-here"
```

Una clave de API es un secreto, exactamente igual que una contraseña — cualquiera que la tenga puede usar la cuota de tu cuenta. Tratarla como una variable de entorno en lugar de un string fijo en el código es la práctica estándar exactamente por esta razón, y es el primer hábito de seguridad del mundo real que este curso te pide construir.

:::tip[Un archivo .env suele ser más conveniente que export]
En lugar de usar `export` para una clave en cada nueva sesión de terminal, puedes ponerla en un archivo `.env` en la carpeta de tu proyecto (mira el `.env.example` del ejemplo del repositorio) y cargarla automáticamente con el paquete `python-dotenv` — cubierto en el Paso 4.
:::

## Paso 3: Configurar el proyecto con `uv`

```bash
uv init ai-agent
cd ai-agent
uv add deepagents langchain-openai python-dotenv
```

`uv init` crea un pequeño proyecto (un `pyproject.toml` que rastrea tus dependencias) y `uv add` instala paquetes en un entorno aislado para ese proyecto — automáticamente, sin configuración manual de entorno virtual. `deepagents` es el framework de LangChain para construir agentes con planificación, uso de herramientas y delegación a sub-agentes incorporados; `langchain-openai` es el paquete de integración que usa este ejemplo para hablar con GitHub Models (su API es compatible con OpenAI, así que el paquete de integración de OpenAI funciona para él — mira el consejo abajo si elegiste un proveedor distinto); `python-dotenv` te permite mantener tu clave de API en un archivo `.env` local en lugar de hacer `export` en cada sesión.

Si elegiste un proveedor distinto en el Paso 2, cambia `langchain-openai` por el paquete propio de ese proveedor — `langchain-google-genai` (Gemini), `langchain-groq` (Groq), o `langchain-mistralai` (Mistral). Cerebras y OpenRouter también son compatibles con OpenAI, así que también usan `langchain-openai`, solo que con un `base_url` distinto.

:::tip[Verifica la documentación actual — y el nombre del modelo]
Los frameworks de agentes se mueven rápido, y también los nombres de los modelos: se renombran y se retiran en una escala de meses, no de años. Los propios argumentos de palabra clave de `create_deep_agent` ya cambiaron una vez desde borradores anteriores de esta página (es `system_prompt`, no `instructions`) — un recordatorio de que este fragmento puede quedar desactualizado incluso después de haberlo verificado una vez. Usa un ID de modelo explícito y versionado en lugar de un alias `-latest`: varios proveedores, incluyendo Google, han dejado de dar soporte a esos alias porque cambian silenciosamente a una nueva versión del modelo, lo que puede romper código que funcionaba sin ninguna advertencia. Antes de ejecutar esto, verifica la página actual de precios/modelos de tu proveedor, y hojea el propio README de `deepagents` para su API actual.
:::

## Paso 4: Escribe tu primer agente

Crea un archivo `.env` (nunca lo subas al repositorio) con la clave del proveedor que elegiste:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

Luego crea `agent.py`:

```python
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent

load_dotenv()  # reads .env into the environment, if present

def search_course_topics(query: str) -> str:
    """A toy tool: pretends to look up whether a topic was covered in this course."""
    topics = ["variables", "loops", "functions", "csv files", "pandas", "dataframes", "groupby"]
    matches = [t for t in topics if query.lower() in t]
    return f"Matching topics: {matches}" if matches else "No matching topics found."

def count_weeks_remaining(current_week: int) -> str:
    """A second toy tool: how many weeks are left in the 10-week course."""
    remaining = max(0, 10 - current_week)
    return f"{remaining} week(s) remaining out of 10."

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running — see the tip above
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics, count_weeks_remaining],
    system_prompt="You help students figure out whether a topic was covered in their course.",
)

if __name__ == "__main__":
    result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
    print(result["messages"][-1].content)  # just the final answer, not the full internal trace
```

Ejecútalo — con `uv`, no hace falta activación manual de entorno:

```bash
uv run python agent.py
```

`load_dotenv()` lee tu archivo `.env` hacia `os.environ` antes de que se ejecute cualquier otra cosa, así que `os.environ["GITHUB_TOKEN"]` encuentra la clave que configuraste en el Paso 2 — el mismo concepto del módulo `os` que `input()` leyendo del teclado, solo que leyendo de un archivo en su lugar. `create_deep_agent` conecta el modelo con una lista de funciones de Python que el agente puede llamar como **herramientas** — esta es la idea central detrás de los agentes: un modelo de lenguaje que no solo puede responder con texto, sino decidir llamar a tu código, leer el resultado, y usarlo para informar su respuesta.

Fíjate en `tools=[search_course_topics, count_weeks_remaining]` — dos herramientas, no una. El modelo elige *cuál* herramienta (si acaso) encaja con la pregunta, completamente por su cuenta: pregunta "¿Cubrimos groupby?" y llama a `search_course_topics`; pregunta "¿Cuántas semanas quedan si estoy en la semana 4?" y llama a `count_weeks_remaining` en su lugar. Nunca escribes tú mismo una cadena `if`/`elif` que dirija preguntas a herramientas — el docstring en cada función (el string entre triples comillas justo después de `def`) es lo que el modelo lee para decidir qué herramienta encaja con qué solicitud, exactamente igual que los docstrings de la Semana 4 de Python 101, salvo que aquí es un modelo de lenguaje quien los lee, no un humano hojeando tu código.

### Cómo decide realmente el agente qué hacer

Nada aquí es magia — `create_deep_agent` construye un bucle, y cada iteración de ese bucle es una llamada de API ordinaria al modelo que configuraste:

1. Tu pregunta va al modelo, junto con la *lista* de herramientas disponibles (sus nombres, parámetros y docstrings — no su código).
2. El modelo responde ya sea con una respuesta de texto final, **o** con una solicitud para llamar a una herramienta específica con argumentos específicos.
3. Si solicitó una llamada a herramienta, tu propio código de Python (no el modelo) es el que realmente ejecuta esa función y obtiene un resultado real.
4. Ese resultado vuelve al modelo como contexto nuevo, y el bucle se repite desde el paso 2 — el modelo podría llamar a otra herramienta, o ahora tener suficiente información para responder.
5. Una vez que el modelo responde con texto y sin más solicitudes de herramienta, el bucle se detiene y esa es tu respuesta final.

Esto es exactamente por qué un error de límite de tasa (ver abajo) puede ocurrir incluso para lo que se siente como "una sola pregunta" — una pregunta que necesita dos llamadas a herramientas cuesta al menos tres idas y vueltas al modelo (decidir llamar a la herramienta A, decidir llamar a la herramienta B, producir la respuesta final), no una.

### Qué deberías ver

Una sola línea impresa — la respuesta final del agente, algo como:

```
Yes, "groupby" was covered in the course.
```

Si en cambio ves un traceback de Python, comprueba de qué tipo:

- **`KeyError: 'GITHUB_TOKEN'`** — la variable de entorno/valor de `.env` no se está encontrando. Confirma que `.env` está en la misma carpeta que `agent.py` y no tiene un error tipográfico en el nombre de la variable, o que realmente ejecutaste `export` en la misma sesión de terminal desde la que estás ejecutando el script.
- **Un error de autenticación (401/403)** — la clave en sí está mal, expiró, o (para GitHub Models) le falta el alcance `models: read`. Regenérala.
- **Un error de límite de tasa (429)** — ver la siguiente sección. Este es común y esperado, no una señal de que algo esté roto.

### Entender la traza interna completa

`result["messages"][-1].content` arriba muestra deliberadamente solo la respuesta final. Si en cambio imprimes el `result` *completo*, verás algo mucho más ruidoso — cada mensaje que LangGraph rastreó internamente, cada uno con campos de contabilidad interna junto al contenido real:

```python
result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
for message in result["messages"]:
    print(type(message).__name__, "->", message)
```

Reducida a lo que realmente importa, la traza detrás de esa única pregunta se ve así:

| # | Tipo de mensaje | Qué contiene |
|---|---|---|
| 1 | `HumanMessage` | Tu pregunta: `"Did we cover groupby?"` |
| 2 | `AIMessage` (sin texto) | El modelo decidió llamar a `search_course_topics(query="groupby")` — todavía sin respuesta, solo una solicitud de herramienta |
| 3 | `ToolMessage` | El valor de retorno *real* de tu función de Python: `"Matching topics: ['groupby']"` |
| 4 | `AIMessage` (final) | La respuesta real del modelo, ahora que tiene el resultado de la herramienta: `"Yes, groupby was covered."` |

Las partes ruidosas que puedes ignorar de forma segura al leer una traza cruda: los campos `id`/`tool_call_id` (contabilidad interna para hacer coincidir una llamada de herramienta con su resultado), trazas de razonamiento interno específicas del proveedor (no pensadas para ser legibles por humanos), y `usage_metadata` (conteos de tokens, útiles para rastrear costos, irrelevantes para la conversación en sí). Esta forma de 4 filas —pregunta, llamada a herramienta, resultado de herramienta, respuesta— es todo el bucle del agente de la sección anterior, solo que escrito como datos en lugar de como una lista numerada.

### Manejar límites de tasa

Cada nivel gratuito aquí limita cuántas solicitudes puedes hacer por minuto o por día, y cada turno del agente —decidir llamar a una herramienta, y luego leer el resultado— usa al menos una solicitud. Ejecuta unas cuantas preguntas seguidas y bien podrías ver algo como:

```
Error calling model ... (RESOURCE_EXHAUSTED): 429 RESOURCE_EXHAUSTED.
...Please retry in 41.7s.
```

Esto no es un error en tu código — es el proveedor diciéndote que vayas más despacio. Dos formas de manejarlo:

1. **La más simple**: simplemente espera el número de segundos sugerido y ejecuta el script de nuevo.
2. **Más robusta**: envuelve la llamada a `agent.invoke(...)` en un `try`/`except` que capture el error, espere, y reintente automáticamente — exactamente el patrón enseñado como contenido bono en la Semana 4 de Python 101. El ejemplo más completo del repositorio hace esto de verdad: mira `ask()` en [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent/agent.py) para una versión funcional que puedes copiar, incluyendo el análisis del retraso de reintento sugerido por el proveedor a partir del mensaje de error.

:::tip[¿Usas un proveedor distinto?]
Cambia el bloque `ChatOpenAI(...)` por el cliente propio de tu proveedor — p. ej. `ChatGoogleGenerativeAI(model="gemini-3.5-flash", google_api_key=os.environ["GOOGLE_API_KEY"])` para Gemini, o `ChatGroq(model="llama-3.3-70b-versatile", api_key=os.environ["GROQ_API_KEY"])` para Groq. Todo lo demás en este archivo se queda igual — `deepagents` no le importa qué proveedor esté detrás del modelo. Mira [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) en el repositorio del curso para ver los seis conectados lado a lado, seleccionables con una sola variable de entorno.
:::

## Lo que acabas de construir

`search_course_topics` es deliberadamente trivial — las herramientas de un agente real podrían buscar en la web, consultar una base de datos, o ejecutar código. Pero la forma es la misma que impulsa sistemas mucho más capaces: un modelo que razona sobre una tarea, decide qué herramienta llamar y con qué argumentos, lee el resultado de la herramienta, y continúa — a veces llamando a varias herramientas en secuencia antes de responder. Acabas de construir la versión más pequeña posible de ese bucle, localmente, con tu propia clave.

:::tip[Ejecuta una versión más completa sin ninguna configuración local]
[`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) en el repositorio del curso **no es una copia del código de arriba** — es una versión deliberadamente más completa, con herramientas reales (busca en los archivos de lección reales de este curso y analiza sus datasets reales con pandas, en lugar de una lista fija de temas) y soporte para los seis proveedores de la tabla de arriba, seleccionado con un solo ajuste. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya instalados) y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Dale a tu agente una herramienta genuinamente *útil*, no solo una de juguete — una que lea un archivo local real, o llame a una API pública real. La copia de [`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) en el repositorio ya hace esto: busca en los archivos de lección reales de este curso y analiza sus datasets reales con pandas, en lugar de adivinar.
- Mira el soporte de `deepagents` para **sub-agentes** — delegar parte de una tarea a un agente instruido por separado, similar a cómo un gerente podría delegar una subtarea a un especialista:

```python
from deepagents import create_deep_agent

research_subagent = {
    "name": "topic-researcher",
    "description": "Looks up whether a topic was covered in the course, in detail.",
    "system_prompt": "You research course topics thoroughly using the available tools.",
    "tools": [search_course_topics],
}

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics, count_weeks_remaining],
    subagents=[research_subagent],
    system_prompt="Delegate topic-research questions to the topic-researcher sub-agent.",
)
```

El agente principal ahora puede entregar una subtarea a `topic-researcher` en lugar de hacer todo él mismo — útil una vez que las instrucciones y la lista de herramientas de un solo agente empiezan a crecer demasiado como para razonar sobre ellas en un solo lugar.
- Revisa el contenido bono de `try`/`except` y `class` de Python 101 — el código de agentes real se apoya constantemente en ambos (capturar una llamada de herramienta fallida, envolver estado relacionado en una clase) de formas que el currículo principal de este curso evitó deliberadamente.

## Comparte tu agente con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de agentes que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes para agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, subir tus archivos, y abrir el PR, un paso a la vez. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2026-ai-agent" />
