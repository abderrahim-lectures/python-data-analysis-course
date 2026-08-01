---
id: multi-agent-research
title: "Construye un Asistente de Investigación Multi-Agente"
sidebar_label: "Construye un Asistente de Investigación Multi-Agente"
slug: /projects/multi-agent-research
description: "Da el salto del playground en el navegador a Python real: construye un pequeño sistema multi-agente — un planificador, un investigador y un escritor — que descompone una pregunta de investigación y sintetiza un informe real, usando los sub-agentes de deepagents de LangChain y un LLM de nivel gratuito."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Asistente de Investigación Multi-Agente

<ProjectPublishedDate projectId="multi-agent-research" />

<ProjectGreeting />

Un único agente con una pila de herramientas y un largo prompt de sistema funciona bien para tareas pequeñas, pero empieza a flaquear una vez que una tarea tiene *fases* genuinamente distintas que piden instrucciones diferentes — planificar en qué indagar, investigar de verdad cada pieza, y luego escribir todo. Este proyecto divide ese trabajo entre tres agentes pequeños y con instrucciones estrechas en lugar de uno grande: un **planificador** que descompone una pregunta de investigación en un puñado de sub-preguntas, un **investigador** que responde cada sub-pregunta por su cuenta, y un **escritor** que sintetiza todo en un informe final — coordinados con la función de sub-agentes `deepagents` de LangChain.

Esto asume Python 101, y se construye directamente sobre el [proyecto Agente de IA](/docs/projects/ai-agent) — misma librería `deepagents`, misma configuración de API de nivel gratuito, misma idea de un modelo decidiendo qué llamar y cuándo, solo que aplicada a delegar sub-tareas completas en lugar de llamar herramientas individuales. Hacer ese proyecto primero no es estrictamente requerido, pero es una vía de entrada mucho más suave que empezar aquí en frío.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv`, una herramienta rápida y moderna para gestionar el propio Python y las dependencias de tu proyecto.
2. Obtener una clave de API de IA de nivel gratuito — la misma elección de seis proveedores que el proyecto Agente de IA.
3. Configurar un pequeño proyecto e instalar `deepagents`.
4. Definir tres sub-agentes — planificador, investigador, escritor — cada uno con su propio prompt de sistema estrecho.
5. Cablearlos juntos en un solo agente de nivel superior y ejecutarlo sobre una pregunta de investigación real, de principio a fin.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado — es Python real ejecutándose en tu propia máquina, el mismo movimiento de "graduarte a Python real" que cada otro proyecto de esta sección. La sección de Configuración de abajo explica cómo instalarlo.

**GitHub Codespaces** es una alternativa de configuración cero si prefieres no instalar nada localmente todavía: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta exactamente los mismos comandos `uv` desde una terminal en la pestaña de tu navegador.

**Google Colab, Kaggle Notebooks, o Binder** también funcionan, ya que nada aquí necesita GPU — cada paso es solo una llamada API a un LLM de nivel gratuito. Una versión real y ejecutable en notebook de este proyecto vive en el repositorio en [`examples/multi-agent-research/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multi-agent-research/notebook.ipynb) — haz clic en una insignia de abajo para lanzarlo con cero configuración local, sin necesidad de archivo `.env` (pide tu clave API interactivamente con `getpass` en su lugar):


[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multi-agent-research/notebook.ipynb)
[![Open in Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multi-agent-research/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmulti-agent-research%2Fnotebook.ipynb)

Es una forma de menor fidelidad de experimentar el proyecto que un proyecto `uv` local real, pero perfectamente funcional para probar la idea rápidamente.

## Configuración

Todo lo siguiente deja tu entorno completamente listo antes de que empiece cualquier construcción: instalar `uv`, obtener una clave API gratuita, configurar el proyecto, y configurar tu archivo `.env`.

### Instalar `uv`

`uv` es una única herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

### Obtener una clave de API de IA gratuita

**Elige el proveedor que prefieras** — ninguno de ellos requiere una tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro. El agente de ejemplo en el repositorio del curso ([`examples/multi-agent-research/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/multi-agent-research)) soporta los seis de fábrica, seleccionados con un solo ajuste, el mismo patrón que el proyecto Agente de IA.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(valor por defecto sugerido)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el alcance `models: read` | Sin registro separado — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que los de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — buena para comparar proveedores. |

Sea cual sea el que elijas, el proceso es el mismo:

1. Inicia sesión y genera una clave de API en el sitio de ese proveedor.
2. **Nunca pegues esta clave directamente en el código ni la subas a un repositorio.** En su lugar, configúrala como una variable de entorno:

```bash
# macOS / Linux (add to ~/.bashrc or ~/.zshrc to persist it)
export GITHUB_TOKEN="your-key-here"   # or GOOGLE_API_KEY, GROQ_API_KEY, etc. -- match your provider

# Windows (PowerShell)
$env:GITHUB_TOKEN = "your-key-here"
```

:::tip[Un archivo .env suele ser más conveniente que export]
En lugar de hacer `export` de una clave en cada nueva sesión de terminal, puedes ponerla en un archivo `.env` en la carpeta de tu proyecto (mira el `.env.example` del ejemplo del repositorio) y cargarla automáticamente con el paquete `python-dotenv` — cubierto más abajo.
:::

### Configurar el proyecto con `uv`

```bash
uv init multi-agent-research
cd multi-agent-research
uv add deepagents langchain-openai python-dotenv
```

`deepagents` es el mismo framework de LangChain usado en el proyecto Agente de IA, y es lo que hace que todo este proyecto sea pequeño: además del uso de herramientas, tiene una función integrada de **sub-agentes** — una forma de entregar parte de una tarea a un agente con instrucciones separadas, en lugar de escribir a mano tu propio bucle que llama al modelo tres veces con tres prompts diferentes y cose los resultados tú mismo. `langchain-openai` habla con GitHub Models (su API es compatible con OpenAI); cámbialo por `langchain-google-genai`, `langchain-groq`, o `langchain-mistralai` si elegiste un proveedor diferente arriba — Cerebras y OpenRouter también son compatibles con OpenAI, así que `langchain-openai` los cubre también, solo que con un `base_url` diferente, exactamente como en el proyecto Agente de IA.

Crea un archivo `.env` (nunca lo subas al repositorio) con la clave del proveedor que elegiste:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv add deepagents langchain-openai python-dotenv` completado sin errores.</StepChecklistItem>
<StepChecklistItem>Existe un archivo `.env` en la carpeta del proyecto con una clave real, y git no lo rastrea (`uv init` te da un `.gitignore` — confirma que `.env` está en él).</StepChecklistItem>
</StepChecklist>

## Paso 1: Define los sub-agentes planificador, investigador y escritor

Cada sub-agente en `deepagents` es solo un dict simple: un `name`, un `description` (usado por el agente de nivel superior para decidir cuándo delegarle), un `system_prompt` (sus propias instrucciones estrechas), y opcionalmente sus propios `tools`. Crea `agent.py`:

```python
import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

planner_subagent = {
    "name": "planner",
    "description": "Breaks a research question down into 3-5 focused, independently-answerable sub-questions.",
    "system_prompt": (
        "You are a research planner. Given a broad research question, break it "
        "into 3 to 5 specific, independently-answerable sub-questions that together "
        "cover the topic well. Output ONLY a numbered list of sub-questions -- no "
        "preamble, no answers, just the questions themselves."
    ),
}

researcher_subagent = {
    "name": "researcher",
    "description": "Answers one specific sub-question at a time, concisely and factually.",
    "system_prompt": (
        "You are a researcher. Answer the single sub-question you are given as "
        "accurately and concisely as you can, using your own knowledge. You have "
        "no web search tool in this version -- if you are not confident about a "
        "fact, say so explicitly rather than guessing. Answer in 2-4 sentences."
    ),
}

writer_subagent = {
    "name": "writer",
    "description": "Synthesizes a set of sub-question answers into one coherent final report.",
    "system_prompt": (
        "You are a writer. Given a research question and a set of sub-question/answer "
        "pairs, synthesize them into one coherent, well-organized report of a few "
        "paragraphs. Do not just concatenate the answers -- connect them into prose "
        "that reads as a single piece of writing, and note plainly if the underlying "
        "research flagged low confidence anywhere."
    ),
}
```

:::tip[Sé honesto sobre lo que "investigación" significa aquí]
El sub-agente investigador de arriba responde desde el propio conocimiento de entrenamiento del modelo — no hay ninguna herramienta real de búsqueda web conectada. Esa es una simplificación deliberada, no un atajo oculto: mantiene este proyecto pequeño y amigable con el nivel gratuito, pero significa que las respuestas pueden estar desactualizadas o ser incorrectas en cualquier cosa en la que el modelo no fue bien entrenado, sin forma de verificarlas contra una fuente en vivo. Consulta "A dónde ir desde aquí" para ver cómo conectar una herramienta de búsqueda real una vez que te sientas cómodo con esta versión.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`agent.py` define `planner_subagent`, `researcher_subagent` y `writer_subagent`, cada uno con un `system_prompt` distinto.</StepChecklistItem>
<StepChecklistItem>Cada `system_prompt` dice claramente qué hace y qué *no* hace ese rol — p. ej. el prompt del planificador dice que no responda las sub-preguntas que genera.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- El prompt de sistema del planificador le prohíbe explícitamente responder sus propias sub-preguntas. ¿Qué crees que le pasaría al resto del pipeline si ignorara esa instrucción y las respondiera de todos modos?
- ¿Por qué podría importar que el `description` de cada sub-agente esté escrito para que lo lea el *agente de nivel superior*, no un humano? ¿Qué te costaría aquí un `description` vago ("hace cosas de investigación")?

## Paso 2: Conecta los sub-agentes y ejecútalo

El agente de nivel superior no hace ninguna investigación por sí mismo — todo su trabajo es delegación, en orden: planificar, luego investigar cada sub-pregunta, luego escribir. Añade esto al final de `agent.py`:

```python
agent = create_deep_agent(
    model=model,
    subagents=[planner_subagent, researcher_subagent, writer_subagent],
    system_prompt=(
        "You coordinate a research task using your sub-agents, strictly in this order: "
        "1) delegate to the 'planner' sub-agent to get a numbered list of sub-questions. "
        "2) delegate each sub-question, one at a time, to the 'researcher' sub-agent. "
        "3) delegate to the 'writer' sub-agent, giving it the original question plus every "
        "sub-question/answer pair, and have it produce the final report. "
        "Return ONLY the writer's final report as your answer -- no intermediate steps."
    ),
)

if __name__ == "__main__":
    question = "What makes a programming language good for beginners to learn first?"
    result = agent.invoke({"messages": [{"role": "user", "content": question}]})
    print(result["messages"][-1].content)
```

Ejecútalo:

```bash
uv run python agent.py
```

`subagents=[...]` es todo el mecanismo: el agente de nivel superior ve el `name` y el `description` de cada sub-agente de la misma manera que vería el nombre y docstring de una herramienta, y decide cuándo entregar a cuál, basándose en las instrucciones del `system_prompt` de nivel superior y el estado de la conversación hasta ahora. Esta es la misma idea enseñada en la sección "A dónde ir desde aquí" del proyecto Agente de IA, solo que aquí se usa para todo el pipeline en lugar de para un especialista extra junto a un agente de propósito general.

### Qué deberías ver

Un único bloque de texto impreso — el informe final sintetizado del escritor, unos pocos párrafos cubriendo las sub-preguntas que se le ocurrieron al planificador. Si imprimes la lista completa de `result["messages"]` en su lugar (el mismo patrón que el proyecto Agente de IA), verás toda la traza: la lista numerada del planificador, cada llamada del investigador y su respuesta, y luego la pasada final del escritor — todas como mensajes reales pasados entre el agente de nivel superior y cada sub-agente.

Si en cambio ves un traceback, comprueba de qué tipo — las mismas tres categorías que el proyecto Agente de IA: una variable de entorno faltante/incorrecta (`KeyError`), una clave mala (401/403), o un límite de tasa (429, mira el escollo de abajo).

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python agent.py` imprime un informe final, no un traceback.</StepChecklistItem>
<StepChecklistItem>El informe realmente se lee como una síntesis de varias sub-preguntas, no un solo párrafo superficial.</StepChecklistItem>
<StepChecklistItem>Imprimir la lista completa de `result["messages"]` muestra que los tres roles fueron realmente invocados — planificador, investigador (varias veces), luego escritor.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Prueba una pregunta de investigación mucho más estrecha (algo con básicamente una sub-pregunta obvia) y una mucho más amplia (algo que podría dividirse en diez sub-preguntas). ¿Cómo cambia el comportamiento del planificador, y sigue la calidad del informe final a qué tan bien se descompone la pregunta realmente?
- El `system_prompt` de nivel superior dice "devuelve SOLO el informe final del escritor." ¿Qué esperarías ver en la salida si eliminaras esa instrucción?

:::tip[Consulta la documentación actual antes de confiar en esto]
La API de sub-agentes de `deepagents` es más nueva y menos probada en batalla que su API de llamada de herramientas simple, y ambas ya cambiaron de forma una vez desde borradores anteriores del proyecto Agente de IA. Antes de construir sobre esto más allá de la lección, hojea el propio README de `deepagents` para su forma actual de `subagents=[...]`, el mismo consejo dado en el proyecto Agente de IA para los otros argumentos de palabra clave de `create_deep_agent`.
:::

## ⚠️ Errores comunes

- **Fuga de roles.** Si el `system_prompt` de un sub-agente no es lo suficientemente estrecho, empieza a hacer el trabajo de otro rol — un planificador que también responde sus propias preguntas, o un escritor que inventa nuevas sub-preguntas en lugar de sintetizar las que se le dieron. Si la salida se ve rara, la solución es casi siempre apretar el prompt del sub-agente ofensor, no añadir más instrucciones al de nivel superior.
- **Los límites de tasa se multiplican rápido.** Una pregunta de investigación aquí cuesta al menos una llamada del planificador, una llamada del investigador *por sub-pregunta* (típicamente 3-5), y una llamada del escritor — seis a ocho idas y vueltas como mínimo, contra las llamadas de un solo dígito que hace un agente simple de llamada de herramientas. Espera chocar con un 429 antes de lo que lo hiciste en el proyecto Agente de IA; el mismo patrón de reintento con retraso de la función `ask()` de ese proyecto aplica aquí sin cambios.
- **El investigador alucinando con confianza.** Sin una herramienta de búsqueda real, el sub-agente investigador puede producir una respuesta fluida y de sonido correcto pero errónea sobre cualquier cosa oscura o reciente. Su prompt de sistema le pide señalar baja confianza explícitamente, pero no está garantizado que un modelo de lenguaje siga esa instrucción perfectamente cada vez — verifica las respuestas en preguntas donde ya sabes la respuesta.
- **El escritor perdiendo sub-preguntas en lugar de citarlas.** Si el `system_prompt` de nivel superior no le dice claramente al agente de nivel superior que le pase *cada* par sub-pregunta/respuesta al escritor, puede resumir solo algunas, o inventar conexiones entre respuestas que nunca vio realmente. Imprime la traza completa (Paso 2) para confirmar que el escritor recibió realmente todo lo que produjo el investigador.

## Lo que acabas de construir

Un pequeño pipeline donde tres agentes con instrucciones estrechas, cada uno con un prompt de sistema acotado exactamente a un trabajo, producen un resultado que ninguno de ellos podría producir bien solo — un planificador bueno descomponiendo, no respondiendo; un investigador bueno respondiendo una pregunta enfocada, no gestionando un informe completo; un escritor bueno sintetizando, no investigando. Esta es la misma idea detrás de los sistemas multi-agente más grandes en producción: no un prompt enorme intentando hacerlo todo, sino varios pequeños, cada uno fácil de razonar y depurar por su cuenta, coordinados por un agente de nivel superior que solo decide *quién* va después.

## A dónde ir desde aquí

- **Dale al investigador una herramienta de búsqueda real.** La mayor brecha de honestidad en esta versión es que "investigación" aquí significa "el propio conocimiento de entrenamiento del modelo," no una búsqueda web real. Varios proveedores tienen APIs de búsqueda de nivel gratuito (Tavily y la API no oficial de DuckDuckGo son puntos de partida comunes) — conéctala como una herramienta en `researcher_subagent["tools"]`, el mismo patrón `tools=[...]` del proyecto Agente de IA, y el investigador podrá citar fuentes reales y actuales en lugar de recordar datos de entrenamiento.
- **Añade un cuarto rol**, como un sub-agente crítico que revise el informe del escritor contra las sub-preguntas originales y marque las brechas antes de la salida final — un patrón común una vez que un pipeline tiene más de un par de etapas.
- **Transmite la salida intermedia** en lugar de solo imprimir el informe final, para que puedas ver llegar las sub-preguntas del planificador y cada respuesta del investigador en tiempo real en lugar de esperar a que todo el pipeline termine en silencio.
- Revisita la sección del proyecto Agente de IA sobre la traza interna completa (`result["messages"]`) — la misma técnica para convertir un resultado crudo ruidoso en una cuenta legible paso a paso aplica aquí, solo que con los mensajes de tres roles entrelazados en lugar de uno.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, subir tus archivos, y abrir el PR, un paso a la vez. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="multi-agent-research" />
