---
id: recipe-planner-agent
title: "Construye un Agente Planificador de Recetas"
sidebar_label: "Agente Planificador de Recetas"
slug: /projects/recipe-planner-agent
description: "Graduéate del playground en el navegador al Python real: construye un agente de IA que usa herramientas con los deepagents de LangChain, que sugiere comidas a partir de los ingredientes que tienes a la mano, anclado a una base de datos de recetas local real."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Agente Planificador de Recetas

<ProjectPublishedDate projectId="recipe-planner-agent" />

<ProjectGreeting />

Escribes una lista de ingredientes que de hecho tienes a la mano — digamos, huevos, tomates, ajo y pan — y un agente sugiere 2-3 comidas reales que podrías hacer con ellos, luego arma una lista de compras de lo que falta para la mejor opción. El giro que hace de esto un agente genuinamente útil, no solo un chatbot: nunca inventa una receta. Llama a una herramienta que busca en una base de datos de recetas local real y solo puede sugerir lo que esa herramienta realmente devuelve — la misma idea de anclaje detrás de sistemas mucho más serios de "no dejes que el modelo invente cosas", reducida a algo que puedes construir en una tarde.

Esto asume Python a nivel 101. Haber hecho el [proyecto de Agente de IA](/docs/projects/ai-agent) primero es una ayuda real, no un requisito duro — este proyecto reutiliza el mismo framework `deepagents` y el mismo patrón de llamada a herramientas, solo con una herramienta más estructurada y con forma del mundo real. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv`, obtener una clave de API de IA de nivel gratuito, y configurar un pequeño proyecto con `deepagents` — todo por adelantado, en Configuración abajo.
2. Definir una pequeña "base de datos de recetas" local — una lista de Python simple de dicts, 10-15 recetas, cada una con su propia lista de ingredientes.
3. Escribir una función de herramienta que el agente pueda llamar para buscar en esa base de datos por los ingredientes que tienes a la mano.
4. Conectar esa herramienta a un agente `deepagents` con un prompt de sistema que lo mantenga anclado solo a recetas reales.
5. Pedirle al agente sugerencias de comidas a partir de una lista de ingredientes real, luego hacer que arme una lista de compras para la que elijas.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — Python real instalado en tu propia máquina, el mismo movimiento de "gradúate a Python real" que todos los demás proyectos de esta sección. Los pasos 1 en adelante asumen este camino.

**GitHub Codespaces** funciona igual de bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta exactamente los mismos comandos `uv` desde una terminal en tu pestaña del navegador.

**Google Colab, Kaggle Notebooks, o Binder** también funcionan bien — esto es un script ligero que solo llama a una API, sin GPU ni instalación pesada. Una versión lista para ejecutar de este proyecto ([`examples/recipe-planner-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)) está a un clic de distancia:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frecipe-planner-agent%2Fnotebook.ipynb)

Es una forma de menor fidelidad de experimentar el proyecto que un proyecto `uv` local real — sin archivos separados, sin estructura de proyecto real — pero perfectamente factible para probar la idea. Configura tu clave de API con `os.environ["GITHUB_TOKEN"] = "..."` en la celda de getpass (o usa el panel de Secretos de Colab).

## Configuración

Todo lo necesario antes de que escribas una sola línea del agente mismo vive aquí — instalar `uv`, obtener una clave de API, crear el proyecto, y configurar tu archivo `.env`. Los pasos 1 en adelante asumen que todo esto ya está hecho.

### Instala `uv`

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

Si aún no tienes un intérprete de Python real instalado y gestionado por `uv` (de un proyecto anterior de esta serie), obtén uno ahora:

```bash
uv python install 3.12
```

### Obtén una clave de API de IA gratuita

**Elige el proveedor que prefieras** — ninguno requiere tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(sugerido por defecto)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el alcance `models: read` | Sin registro por separado — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que los de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más referenciada comúnmente. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen de tokens diarios, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Sea cual elijas, el proceso es el mismo: inicia sesión, genera una clave en el sitio de ese proveedor, y **nunca la pegues directamente en el código ni la confirmes en un repositorio**. Este proyecto la mantiene en un archivo `.env` (abajo) en su lugar.

### Configura el proyecto con `uv`

```bash
uv init recipe-planner-agent
cd recipe-planner-agent
uv add deepagents langchain-openai python-dotenv
```

`uv init` crea un pequeño proyecto (un `pyproject.toml` que rastrea tus dependencias) y `uv add` instala paquetes en un entorno aislado para ese proyecto automáticamente, sin configuración manual de entorno virtual. `deepagents` es el framework de LangChain para construir agentes con uso de herramientas incorporado — el mismo usado en el [proyecto de Agente de IA](/docs/projects/ai-agent); `langchain-openai` es el paquete de integración que usa este ejemplo para hablar con GitHub Models (su API es compatible con OpenAI, así que el paquete de integración de OpenAI funciona para él también — mira el consejo abajo si elegiste un proveedor distinto); `python-dotenv` te permite mantener tu clave de API en un archivo `.env` local.

Si elegiste un proveedor distinto arriba, cambia `langchain-openai` por el paquete de ese proveedor — `langchain-google-genai` (Gemini), `langchain-groq` (Groq), o `langchain-mistralai` (Mistral). Cerebras y OpenRouter también son compatibles con OpenAI, así que usan `langchain-openai` también, solo con un `base_url` diferente.

:::tip[Revisa la documentación actual — y el nombre del modelo]
Los frameworks de agentes avanzan rápido, y los nombres de los modelos también: se renombran y retiran en una escala de meses, no de años. Usa un ID de modelo explícito y versionado en lugar de un alias `-latest` — varios proveedores, incluyendo Google, han dejado de lado esos alias porque cambian silenciosamente a una nueva versión del modelo, lo que puede romper código que funciona sin aviso. Antes de ejecutar esto, revisa la página de precios/modelo actual de tu proveedor, y echa un vistazo al propio README de `deepagents` para su API actual.
:::

### Crea tu archivo `.env`

En tu carpeta de proyecto, crea un archivo llamado `.env` (nunca lo confirmes) con la clave del proveedor que elegiste:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` (instalado arriba) lee este archivo en `os.environ` al inicio de tu script, así tu código nunca tiene la clave escrita directamente en él.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv --version` imprime un número de versión.</StepChecklistItem>
<StepChecklistItem>Tienes una clave de API real de un proveedor, guardada en un archivo `.env` — no pegada en ningún archivo `.py`.</StepChecklistItem>
<StepChecklistItem>`uv add deepagents langchain-openai python-dotenv` (o el paquete de tu proveedor) se completó sin errores.</StepChecklistItem>
</StepChecklist>

## Paso 1: Construye tu base de datos de recetas local

Todo lo que el agente sugerirá alguna vez viene de esta única estructura de datos — una lista de Python simple de dicts, sin servidor de base de datos, sin API externa. Crea `recipes.py`:

```python
# recipes.py
RECIPES = [
    {
        "name": "Tomato Egg Stir-Fry",
        "ingredients": ["eggs", "tomatoes", "garlic", "salt", "oil"],
        "instructions": "Scramble the eggs, set aside. Saute garlic and chopped tomatoes "
        "until soft, stir the eggs back in, season with salt.",
    },
    {
        "name": "Garlic Butter Pasta",
        "ingredients": ["pasta", "butter", "garlic", "parmesan", "salt"],
        "instructions": "Boil the pasta. Melt butter with minced garlic, toss the pasta "
        "in it, top with grated parmesan and salt.",
    },
    {
        "name": "Classic Grilled Cheese",
        "ingredients": ["bread", "cheese", "butter"],
        "instructions": "Butter one side of each bread slice, add cheese between the "
        "unbuttered sides, grill in a pan until golden on both sides.",
    },
    {
        "name": "Simple Fried Rice",
        "ingredients": ["rice", "eggs", "soy sauce", "onion", "oil"],
        "instructions": "Scramble the eggs and set aside. Fry chopped onion in oil, add "
        "cooked rice, stir in soy sauce and the eggs.",
    },
    {
        "name": "Chickpea Salad",
        "ingredients": ["chickpeas", "cucumber", "tomatoes", "olive oil", "lemon", "salt"],
        "instructions": "Drain the chickpeas, dice the cucumber and tomatoes, toss "
        "everything with olive oil, lemon juice, and salt.",
    },
    # ... a real database keeps going. See examples/recipe-planner-agent/recipes.py
    # in the course repo for the full 13-recipe version this lesson uses.
]
```

Cada receta es solo un dict con un `name`, una lista de `ingredients` (en minúsculas, sin cantidades — solo lo que se necesita), e `instructions` cortas. Esta es exactamente la misma forma que la lista de juguete `topics` del `search_course_topics` del proyecto de Agente de IA, solo más rica: una lista de registros estructurados sobre la que tu función de herramienta puede buscar.

:::tip[Más grande es genuinamente mejor aquí]
Una base de datos de recetas con 3-4 entradas hará que tu agente parezca roto incluso cuando el código está bien — la mayoría de las listas de ingredientes que un estudiante escribe simplemente no se cruzarán con nada. Apunta a las 10-15 recetas completas (la copia del repositorio tiene 13), cubriendo una mezcla real de proteínas, carbohidratos y verduras, para que una lista típica de "qué hay en mi refrigerador" tenga una oportunidad decente de coincidir con algo.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`recipes.py` define `RECIPES` como una lista de al menos 10 dicts.</StepChecklistItem>
<StepChecklistItem>Cada receta tiene `name`, `ingredients` (una lista), e `instructions`.</StepChecklistItem>
<StepChecklistItem>Los nombres de ingredientes están en minúsculas y son consistentes entre recetas (p. ej. siempre `"tomatoes"`, nunca una mezcla de `"tomatoes"` y `"Tomato"`).</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué una lista de dicts en lugar de, digamos, un dict claveado por nombre de receta? ¿Qué ganarías o perderías con cualquiera de los dos?
- Si dos recetas comparten casi todos sus ingredientes, ¿cómo podría afectar eso a cuál tiende a sugerir primero el agente?

## Paso 2: Escribe una herramienta con la que el agente pueda buscar recetas

El agente no puede leer `recipes.py` directamente — solo puede ver lo que devuelve una función de herramienta, exactamente como `search_course_topics` en el proyecto de Agente de IA. Agrega esto a `recipes.py`, o a un archivo nuevo que importe `RECIPES`:

```python
def search_recipes_by_ingredients(ingredients: list[str]) -> str:
    """Search the local recipe database for recipes that best match the given ingredients.

    `ingredients` should be a list of ingredient names the caller already
    has on hand (e.g. ["eggs", "tomatoes", "garlic"]). Returns the top
    matching recipes, ranked by how many of their ingredients are already
    covered, each with its full ingredient list and the ingredients still
    missing -- so a shopping list can be built from the result without
    guessing. Returns a plain "no matches" message if nothing overlaps at
    all, so the caller never has to invent a recipe out of thin air.
    """
    have = {i.strip().lower() for i in ingredients}
    scored = []
    for recipe in RECIPES:
        needed = {i.lower() for i in recipe["ingredients"]}
        overlap = have & needed
        if not overlap:
            continue
        missing = sorted(needed - have)
        scored.append((len(overlap), recipe, missing))

    if not scored:
        return "No matching recipes found in the database for those ingredients."

    scored.sort(key=lambda row: row[0], reverse=True)
    top = scored[:5]

    lines = []
    for _, recipe, missing in top:
        missing_text = ", ".join(missing) if missing else "nothing -- you have it all!"
        lines.append(
            f"- {recipe['name']} | full ingredient list: {', '.join(recipe['ingredients'])} "
            f"| missing: {missing_text}"
        )
    return "Matching recipes (best match first):\n" + "\n".join(lines)
```

La idea central: `have & needed` (intersección de conjuntos) cuenta cuántos de los ingredientes de una receta ya tienes, `needed - have` (diferencia de conjuntos) es exactamente lo que aún falta. Ordenar por tamaño de superposición, del mayor al menor, significa que las recetas más cercanas a "listas para cocinar ahora mismo" vienen primero — y como la herramienta devuelve los ingredientes faltantes para *cada* candidato, no solo el mejor, el agente tiene todo lo que necesita para armar una lista de compras más tarde sin una segunda búsqueda.

Nota que el tipo de retorno es una cadena simple, igual que `search_course_topics` y `count_words` en los proyectos anteriores — el modelo lee texto, no objetos de Python, así que una cadena claramente formateada es lo que una herramienta debería devolver.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`search_recipes_by_ingredients(["eggs", "tomatoes", "garlic"])` llamado directamente en Python (sin agente todavía) devuelve una cadena real y no vacía.</StepChecklistItem>
<StepChecklistItem>Llamarlo con ingredientes que no coinciden con nada en `RECIPES` devuelve el mensaje de "no matching recipes", no un error.</StepChecklistItem>
<StepChecklistItem>El docstring explica qué hace la función y qué devuelve — no un marcador de posición.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué la herramienta devuelve los ingredientes faltantes para las 5 mejores coincidencias, no solo la mejor única? ¿Qué perdería el agente si solo obtuviera la mejor coincidencia?
- ¿Qué pasa ahora mismo si alguien pasa `["Tomatoes"]` (con mayúscula) — ¿todavía coincide con `"tomatoes"` en la base de datos? ¿Por qué?

## Paso 3: Conecta la herramienta a un agente `deepagents`

Crea `planner.py`:

```python
import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from recipes import RECIPES, search_recipes_by_ingredients

load_dotenv()  # reads .env into the environment, if present

SYSTEM_PROMPT = """You are a helpful recipe-planning assistant.

You have exactly one source of truth for what recipes exist: the
search_recipes_by_ingredients tool. Never invent, guess, or recall a recipe
from your own training data -- only suggest recipes that tool actually
returned in its results for this conversation.

When a student lists what they have on hand:
1. Call search_recipes_by_ingredients with that ingredient list.
2. Suggest 2-3 recipes from the tool's results, explaining briefly why each
   is a good fit (how much they already have).
3. If the tool returns no matches, say so plainly and suggest the student
   try listing a few more ingredients -- do not make up a recipe to fill
   the gap.
4. If asked to build a shopping list for a specific recipe, use the
   "missing" ingredients the tool already reported for that recipe -- don't
   recompute or guess at what's missing.
"""

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running -- see the tip above
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[search_recipes_by_ingredients],
    system_prompt=SYSTEM_PROMPT,
)
```

Esta es la misma forma `create_deep_agent(model=..., tools=[...], system_prompt=...)` del proyecto de Agente de IA, con una herramienta en lugar de dos. Lo que es diferente, y vale la pena asimilar, es el **prompt de sistema**: no solo describe la herramienta, prohíbe explícitamente el modo de fallo que este proyecto entero está diseñado para demostrar — sugerir una receta que la herramienta nunca devolvió. Que una herramienta esté *disponible* no garantiza que el modelo siempre la use; el prompt de sistema es donde le dices que usar la herramienta, y solo la herramienta, no es opcional aquí.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`planner.py` importa `RECIPES` y `search_recipes_by_ingredients` de `recipes.py` sin errores.</StepChecklistItem>
<StepChecklistItem>`agent = create_deep_agent(...)` se ejecuta sin lanzar — esto solo construye el agente, aún no llama al modelo.</StepChecklistItem>
<StepChecklistItem>El prompt de sistema dice explícitamente no sugerir una receta que la herramienta no devolvió.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- El prompt de sistema le dice al modelo qué hacer si la herramienta no devuelve coincidencias. ¿Qué crees que pasa si dejas esa instrucción por completo — de dónde podría venir la respuesta del modelo en su lugar?
- ¿Por qué pasar `tools=[search_recipes_by_ingredients]` (la función misma) en lugar de, digamos, `tools=[RECIPES]` (los datos crudos)? ¿Qué podría hacer el modelo realmente con una lista cruda de dicts como "herramienta"?

## Paso 4: Pide sugerencias de comidas

Agrega un bloque de ejecución al final de `planner.py`:

```python
if __name__ == "__main__":
    on_hand = "I have eggs, tomatoes, garlic, bread, and cheese. What can I make?"
    print("🧑 You:", on_hand)
    result = agent.invoke({"messages": [{"role": "user", "content": on_hand}]})
    print("🤖 Agent:", result["messages"][-1].content)
```

Ejecútalo:

```bash
uv run python planner.py
```

Deberías ver la respuesta final del agente: 2-3 nombres de recetas reales sacados directamente de `RECIPES`, cada uno con una razón corta de por qué encaja con tus ingredientes. Si tienes curiosidad sobre *cómo* llegó ahí — qué llamada de herramienta ocurrió, con qué argumentos, y qué devolvió la herramienta antes de que el modelo escribiera su respuesta — imprime la lista completa `result["messages"]` en lugar de solo la última, la misma técnica cubierta en la sección "Entender la traza interna completa" del proyecto de Agente de IA: un `HumanMessage` (tu pregunta), un `AIMessage` solicitando la llamada a la herramienta, un `ToolMessage` con la cadena real que devolvió `search_recipes_by_ingredients`, y luego un `AIMessage` final con la respuesta.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Ejecutar `uv run python planner.py` imprime una respuesta real, no un traceback.</StepChecklistItem>
<StepChecklistItem>Cada nombre de receta en la respuesta aparece de hecho en `RECIPES` — verifica a simple vista, o buscando en `recipes.py`.</StepChecklistItem>
<StepChecklistItem>Probaste al menos una lista de ingredientes que coincide mal, y el agente la manejó razonablemente (lo dijo, o sugirió opciones vagamente relacionadas) en lugar de inventar algo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si cambias `on_hand` a ingredientes que no se cruzan con nada en tu base de datos, ¿qué dice el agente? ¿Sigue la instrucción del prompt de sistema, o se desliza de vuelta a adivinar?
- La herramienta devuelve sus 5 mejores coincidencias, pero el prompt de sistema pide 2-3 sugerencias. ¿Dónde ocurre ese estrechamiento — en tu código de Python, o dentro del razonamiento del modelo?

## Paso 5: Arma una lista de compras y ejecútalo de extremo a extremo

Como `search_recipes_by_ingredients` ya calculó los ingredientes faltantes para cada receta candidata, obtener una lista de compras es solo una pregunta de seguimiento en la misma conversación — no se necesita una herramienta nueva. Extiende el bloque de ejecución para continuar la conversación en lugar de comenzar una nueva cada vez:

```python
if __name__ == "__main__":
    conversation = []

    on_hand = "I have eggs, tomatoes, garlic, bread, and cheese. What can I make?"
    print("🧑 You:", on_hand)
    conversation.append({"role": "user", "content": on_hand})
    result = agent.invoke({"messages": conversation})
    conversation = result["messages"]  # carry the full history forward
    print("🤖 Agent:", conversation[-1].content)

    print()
    follow_up = "Great, let's go with the first one -- what's my shopping list?"
    print("🧑 You:", follow_up)
    conversation.append({"role": "user", "content": follow_up})
    result = agent.invoke({"messages": conversation})
    conversation = result["messages"]
    print("🤖 Agent:", conversation[-1].content)
```

`conversation = result["messages"]` es la línea importante: cada llamada a `agent.invoke(...)` no tiene estado por sí sola, así que la *única* manera de que la segunda pregunta sepa a qué se refiere "el primero" es si devuelves todo el historial de mensajes — incluyendo la respuesta anterior del propio modelo y cualquier llamada a herramienta que haya hecho — como parte de la entrada de la siguiente llamada. Elimina esa línea y vuelve a ejecutar: la segunda pregunta no podrá resolver "el primero" a nada, porque para esa llamada, nunca existió un primer mensaje.

Ejecútalo de nuevo con `uv run python planner.py` y deberías ver un intercambio completo y real: una sugerencia, luego una lista de compras armada a partir de los ingredientes "missing" exactos que la herramienta reportó para la receta que elegiste — no una suposición nueva.

:::tip[Prueba una lista de ingredientes deliberadamente escasa]
Ejecútalo de nuevo con solo uno o dos ingredientes, algo como `"I have onions and salt. What can I make?"` Esta es la mejor manera de ver realmente el mecanismo de protección de tu prompt de sistema en acción: con casi nada que coincidir, obtendrás sugerencias honestas de "no es gran coincidencia, pero aquí está la opción más cercana", o (si el cruce es demasiado fino) el mensaje de "no matches" de la herramienta pasando directamente — de cualquier manera, observa si el agente aún se resiste a inventar algo que no esté en `RECIPES`.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>La segunda pregunta de la conversación se refiere correctamente de vuelta a "el primero" de la respuesta anterior.</StepChecklistItem>
<StepChecklistItem>La lista de compras que produce coincide con los ingredientes "missing" que la herramienta reportó para esa receta — no una lista diferente o inventada.</StepChecklistItem>
<StepChecklistItem>Ejecutaste la prueba de ingredientes escasos de arriba y el agente no inventó una receta que no esté presente en `RECIPES`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Qué se rompería de la pregunta de seguimiento si comenzaras una `conversation = []` completamente nueva para ella en lugar de reutilizar la de la primera pregunta?
- El paso de la lista de compras no llama ninguna herramienta nueva — reutiliza datos que la primera llamada a la herramienta ya devolvió. ¿Qué sugiere eso sobre diseñar el valor de retorno de una herramienta pensando en más que solo la pregunta inmediata?

## ⚠️ Errores comunes

- **Una base de datos de recetas demasiado pequeña.** Con solo un puñado de recetas, la mayoría de las listas de ingredientes que un estudiante escribe no se cruzarán con nada, y el agente parecerá roto incluso cuando el código sea correcto. Apunta a las 10-15 recetas completas cubriendo una variedad real.
- **Nombres de ingredientes que no coinciden.** `"tomato"` en tu lista escrita no coincidirá con `"tomatoes"` en la base de datos con esta herramienta simple basada en conjuntos — no hay coincidencia difusa aquí. Mantén los nombres de ingredientes consistentes (siempre en plural, siempre en minúsculas) tanto en la base de datos como en lo que le pides al agente, o extiende la herramienta con normalización básica (p. ej. eliminar una `"s"` final) si quieres ir más allá.
- **El agente inventando una receta cuando la herramienta no devuelve nada.** Este es exactamente el modo de fallo que el prompt de sistema del Paso 3 existe para prevenir. Si omites esa instrucción, o la redactas demasiado vagamente, un modelo capaz a menudo "ayudará" sugiriendo algo que suena plausible en lugar de admitir que no tiene nada — prueba específicamente el caso de ingredientes escasos del consejo de arriba para detectar esto.
- **Perder el historial de conversación entre preguntas.** Si una pregunta de seguimiento como "cuál es la lista de compras del primero" obtiene una respuesta confusa o genérica, verifica que estás pasando la lista `conversation` acumulada (Paso 5) a `agent.invoke(...)`, no solo el mensaje más nuevo por sí solo.

## Lo que acabas de construir

Un agente que responde una pregunta genuinamente abierta — "¿qué puedo hacer?" — anclando cada parte de su respuesta en datos locales reales y estructurados en lugar de su propio conocimiento de entrenamiento, y que se niega a llenar vacíos con detalles inventados cuando los datos no respaldan uno. Ese patrón de anclaje (una herramienta respaldada por datos reales, un prompt de sistema que prohíbe responder fuera de ella) es la misma forma detrás de sistemas mucho más serios que necesitan que una IA se mantenga factual: un bot de soporte restringido a documentación real, un asistente de codificación restringido a una base de código real, una herramienta de investigación restringida a fuentes recuperadas reales. Acabas de construir la versión más pequeña de esa idea, con recetas.

## A dónde ir desde aquí

- Haz crecer `recipes.py` muy por encima de las 13 entradas, o cárgalo de un archivo JSON o CSV real en lugar de una lista de Python codificada — la función de herramienta apenas tiene que cambiar.
- Agrega una segunda herramienta, p. ej. `get_recipe_instructions(name: str) -> str`, para que el agente pueda guiar a un estudiante a cocinar la receta que acaba de sugerir, no solo nombrarla.
- Mejora la coincidencia en `search_recipes_by_ingredients` — maneja plurales simples, ignora básicos comunes de despensa como sal y aceite al puntuar el cruce (la mayoría de las cocinas ya los tienen), o deja que el estudiante diga qué *no* quiere explícitamente.
- Revisita la sección sobre **sub-agentes** del proyecto de Agente de IA — podrías dividir esto en un sub-agente "buscador de recetas" y un sub-agente "lista de compras", cada uno con un trabajo más acotado.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía una **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="recipe-planner-agent" />
