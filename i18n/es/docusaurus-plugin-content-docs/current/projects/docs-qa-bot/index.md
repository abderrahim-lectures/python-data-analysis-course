---
id: docs-qa-bot
title: "Construye un Bot de Discord de Preguntas y Respuestas Respaldado por RAG"
sidebar_label: "Construye un Bot de Discord de Preguntas y Respuestas"
slug: /projects/docs-qa-bot
description: "Gradúate del playground del navegador a Python real: envuelve el pipeline de recuperación del proyecto de App RAG en un bot de Discord en vivo que responde preguntas de una carpeta de documentación."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Bot de Discord de Preguntas y Respuestas Respaldado por RAG

<ProjectPublishedDate projectId="docs-qa-bot" />

<ProjectGreeting />

Este proyecto toma el pipeline de generación aumentada por recuperación de [Construye una App RAG](/docs/projects/rag-notes) — embeddings locales, búsqueda de similitud de coseno con NumPy, un LLM de nivel gratuito para la respuesta final — y le pone un front end diferente: en lugar de un script que ejecutas desde una terminal una pregunta a la vez, el mismo pipeline responde preguntas en vivo, dentro de un servidor de Discord, cada vez que alguien menciona al bot. Nada sobre *cómo* recupera o genera cambia; solo la interfaz lo hace.

Esto asume Python 101. Haber construido primero [Construye una App RAG](/docs/projects/rag-notes) se recomienda encarecidamente — este proyecto reutiliza directamente su código de embedding/recuperación y avanza rápido por las partes que ya explicó en profundidad.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Crear una aplicación de bot de Discord y obtener su token del portal de desarrolladores gratuito de Discord.
2. Instalar `uv`, configurar un proyecto, y añadir `discord.py` junto con las mismas librerías de embedding/recuperación del proyecto de App RAG.
3. Reutilizar y adaptar el pipeline de recuperación de la App RAG sobre una carpeta de documentación en lugar de notas personales.
4. Conectar un manejador de mensajes de `discord.py` para que el bot recupere documentos relevantes y genere una respuesta cada vez que se lo mencione.
5. Invitar al bot a un servidor de prueba y hacerle preguntas reales, de principio a fin.

## Dónde ejecutar esto

**Localmente con `uv`** es realmente la única opción práctica aquí, más que para la mayoría de otros proyectos de esta serie. Un bot de Discord no es un script que se ejecuta una vez y termina — mantiene una conexión abierta a Discord y necesita seguir corriendo mientras quieras que el bot responda, lo que significa un proceso local (u hospedado) real y de larga duración, no un comando de una sola vez.

**GitHub Codespaces** también funciona, y es un sustituto razonable si prefieres no instalar nada localmente: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta `uv run python bot.py` en una terminal ahí — se mantiene corriendo mientras esa terminal (y el Codespace) permanezca abierto, el mismo requisito de "proceso de larga duración" que ejecutarlo localmente.

**Google Colab, Kaggle Notebooks, y Binder son un mal ajuste para el bot real** — sé honesto contigo mismo sobre eso en lugar de luchar contra ello. Los notebooks están construidos alrededor de ejecutar una celda, obtener salida, y pasar a la siguiente celda; no están diseñados para un proceso en segundo plano que se sienta y espera eventos indefinidamente. *Puedes* iniciar el bucle de eventos de un bot en una celda de notebook, pero en el momento en que el runtime del notebook se recicla, se desconecta, o cierras la pestaña, el bot se cae con él — omite Colab/Kaggle/Binder para el bot en vivo y usa un proceso local real o Codespaces en su lugar.

Dicho esto, el pipeline RAG *debajo* del bot — fragmentación, embedding, recuperación, y generación — es solo código regular que se ejecuta una celda a la vez, que es exactamente en lo que los notebooks son buenos. Las insignias de abajo abren un notebook que recorre ese pipeline central contra la documentación de muestra del proyecto e imprime respuestas reales recuperadas y generadas, así puedes verlo funcionar sin instalar nada localmente. Deliberadamente se detiene antes de la capa de Discord — para eso, vuelve aquí y ejecuta `bot.py` localmente o en Codespaces como se describe arriba.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/docs-qa-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/docs-qa-bot/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocs-qa-bot%2Fnotebook.ipynb)

## Configuración

Todo en esta sección solo necesita pasar una vez, antes de que escribas una línea del bot en sí: instalar `uv`, crear la aplicación de bot de Discord y obtener su token, conseguir una clave de LLM gratuita, y configurar el proyecto. Cada paso después de este asume que todo ya está hecho.

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

### Crea una aplicación de bot de Discord y obtén un token

El [Portal de Desarrolladores](https://discord.com/developers/applications) de Discord es gratuito y no necesita tarjeta:

1. Inicia sesión y haz clic en **New Application**, dale un nombre (ej. "docs-qa-bot"), y créala.
2. Abre la pestaña **Bot** a la izquierda. Discord añade un usuario bot a tu aplicación automáticamente.
3. Haz clic en **Reset Token** (o **View Token** si es la primera vez) y cópialo. Este token es exactamente como una contraseña — cualquiera que lo tenga puede controlar tu bot — así que trátalo de la misma forma que ya tratas una clave de API de LLM: nunca lo pegues en código, nunca lo subas.
4. En la misma pestaña **Bot**, desplázate hasta **Privileged Gateway Intents** y activa **Message Content**. Esto es requerido para que el bot realmente vea el texto de los mensajes en los que se le menciona — sin esto, `discord.py` recibe una cadena vacía para el contenido de cada mensaje sin importar qué código escribas.

:::tip[Un token de bot es un secreto, exactamente como una clave de API]
Todo lo que el [proyecto de App RAG](/docs/projects/rag-notes) enseñó sobre manejar claves de API de LLM se aplica aquí también, para un segundo secreto: nunca codifiques el token del bot de forma fija, nunca lo subas, y mantenlo en un archivo `.env` local (abajo) en su lugar.
:::

### Obtén una clave de API de LLM gratuita

La mitad de generación de este pipeline necesita el mismo tipo de clave de LLM de nivel gratuito que el [proyecto de App RAG](/docs/projects/rag-notes) — **elige el proveedor que prefieras**, ninguno requiere tarjeta de crédito al momento de escribir esto:

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(sugerido por defecto)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el scope `models: read` | Sin registro aparte — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Si ya tienes una clave de haber hecho el proyecto de App RAG, la misma funciona aquí — no necesitas generar una segunda.

### Configura el proyecto

```bash
uv init docs-qa-bot
cd docs-qa-bot
uv add discord.py sentence-transformers numpy python-dotenv openai
```

`discord.py` es la librería que realmente habla con Discord — conectándose a su Gateway, recibiendo eventos de mensajes, y enviando respuestas. `sentence-transformers` y `numpy` son las mismas librerías de recuperación del proyecto de App RAG, haciendo el mismo trabajo aquí: embeddings locales y búsqueda de similitud de coseno, solo sobre documentación en lugar de notas. `openai` habla con el endpoint compatible con OpenAI de GitHub Models para el proveedor por defecto de arriba; cámbialo por el paquete propio de tu proveedor si elegiste uno diferente, exactamente como describe el proyecto de App RAG.

Crea un archivo `.env` en la carpeta del proyecto (nunca lo subas) con **ambos** secretos de esta sección:

```bash
# .env
DISCORD_BOT_TOKEN=tu-token-de-bot-aquí
GITHUB_TOKEN=tu-clave-de-llm-aquí
```

`python-dotenv` lee este archivo hacia `os.environ` automáticamente, el mismo patrón que cualquier otro proyecto de esta serie.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Una aplicación y bot de Discord existen en el Portal de Desarrolladores, y has copiado su token.</StepChecklistItem>
<StepChecklistItem>"Message Content" está activado bajo Privileged Gateway Intents.</StepChecklistItem>
<StepChecklistItem>Tienes una clave de API de LLM de nivel gratuito de un proveedor de tu elección.</StepChecklistItem>
<StepChecklistItem>`uv init`/`uv add` se completó sin errores, y `.env` tiene tanto `DISCORD_BOT_TOKEN` como tu clave de LLM configurados.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué requiere Discord que actives explícitamente "Message Content" como un intent *privilegiado*, en lugar de dar a todos los bots acceso al texto de los mensajes por defecto?
- El token del bot y la clave de API del LLM son ambos secretos, pero autentican con dos servicios completamente diferentes. ¿Qué saldría mal si accidentalmente intercambiaras qué variable de entorno contenía qué valor?

## Paso 1: Prepara y haz embedding de una carpeta de documentación

Este paso son los Pasos 2 y 3 del proyecto de App RAG, sin cambios en su sustancia, solo apuntados a una carpeta `docs/` de documentación en lugar de notas personales:

```python
# prepare_docs.py
"""Splits every .md/.txt file in docs/ into a list of text chunks.

Run with: uv run python prepare_docs.py
Same chunking approach as prepare_notes.py in the RAG App project.
"""

from pathlib import Path

DOCS_DIR = Path("docs")
TARGET_CHUNK_SIZE = 500  # characters


def split_into_paragraphs(text: str) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) > target_size:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n\n{paragraph}" if current else paragraph
    if current:
        chunks.append(current)
    return chunks


def load_chunks() -> list[dict]:
    chunks = []
    for path in sorted(DOCS_DIR.glob("*.md")) + sorted(DOCS_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        paragraphs = split_into_paragraphs(text)
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": path.name})
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {DOCS_DIR}/")
```

Pon cualquier documentación de la que quieras que el bot responda en una carpeta `docs/` como archivos `.md`/`.txt` — el README y páginas de wiki de un proyecto, el manual interno de un equipo, los propios archivos de lección de este curso, cualquier cosa real. Luego haz embedding de ella, reutilizando el `build_index.py` del proyecto de App RAG textualmente (solo el import cambia, de `prepare_notes` a `prepare_docs`):

```python
# build_index.py
"""Embeds every chunk from prepare_docs.py and saves the vectors + text
locally. Run with: uv run python build_index.py
Re-run any time docs/ changes -- nothing rebuilds this automatically.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_docs import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .md/.txt files to docs/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python prepare_docs.py
uv run python build_index.py
```

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Una carpeta `docs/` existe con al menos un par de archivos `.md`/`.txt` reales en ella.</StepChecklistItem>
<StepChecklistItem>`uv run python build_index.py` se ejecuta sin errores y reporta un conteo de fragmentos distinto de cero.</StepChecklistItem>
<StepChecklistItem>`index.npy` y `chunks.json` ahora existen en la carpeta de tu proyecto.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Este es exactamente el mismo código de fragmentación y embedding que el proyecto de App RAG, con solo un nombre de carpeta cambiado. ¿Qué te dice eso sobre cuán reutilizable es la mitad de recuperación de un pipeline RAG a través de casos de uso completamente diferentes?
- Si tu carpeta de documentación tiene un archivo con formato muy inconsistente (sin líneas en blanco, un bloque gigante de texto), ¿qué esperarías que pase con la calidad de los fragmentos que produce?

## Paso 2: Recupera fragmentos relevantes

La recuperación también permanece sin cambios respecto al proyecto de App RAG — haz embedding de la pregunta con el mismo modelo, luego clasifica cada fragmento por similitud de coseno, lo cual se reduce a un producto punto simple ya que cada vector ya fue normalizado a longitud 1 en el momento del embedding:

```python
# retrieve.py
"""Given a question, finds the docs chunks most relevant to it.
Identical retrieval logic to the RAG App project's retrieve.py.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def retrieve(question: str, top_k: int = 3) -> list[dict]:
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("How do I enable the message content intent?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

Si esto se siente demasiado rápido, es deliberado — el [proyecto de App RAG](/docs/projects/rag-notes#step-4-retrieve-relevant-chunks) cubre exactamente por qué la similitud de coseno funciona así, qué te da la normalización, y cómo las matemáticas se conectan a una multiplicación matriz-vector, con mucha más profundidad de la que repetirlo aquí añadiría.

:::tip[Prueba la recuperación antes de tocar Discord en absoluto]
Haz que `retrieve.py` devuelva fragmentos genuinamente relevantes para algunas preguntas de prueba *antes* de escribir cualquier código de bot. Si la recuperación está mal, un bot envuelto alrededor de ella simplemente entregará respuestas incorrectas con confianza en un canal de Discord — mucho más difícil de depurar en vivo que un script de terminal silencioso.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` imprime resultados clasificados con puntuaciones de similitud reales.</StepChecklistItem>
<StepChecklistItem>El resultado principal para una pregunta de prueba fácil realmente se ve relevante cuando lo lees.</StepChecklistItem>
<StepChecklistItem>Has intentado al menos una pregunta que tu carpeta de documentación claramente no cubre, y confirmado que la puntuación principal es notablemente más baja.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Un bot de Discord podría recibir la misma o preguntas muy similares repetidamente de diferentes usuarios en un servidor ocupado. `retrieve()` actualmente vuelve a hacer embedding de la pregunta y recarga `index.npy`/`chunks.json` desde disco en cada llamada. ¿Qué cachearías para hacer las preguntas repetidas más baratas, y cuál es el riesgo de cachear demasiado agresivamente?
- Si dos archivos de documentación dicen cosas ligeramente contradictorias (uno desactualizado y uno actualizado), ¿qué esperarías que hiciera `retrieve()`, y cómo notarías el problema solo a partir de las respuestas del bot?

## Paso 3: Conecta el manejador de mensajes del bot

Esta es la parte realmente nueva de este proyecto: un manejador de eventos de `discord.py` que llama a `retrieve()`, construye el mismo prompt de "responde usando solo este contexto" del proyecto de App RAG, y responde con la respuesta del modelo.

El patrón central de `discord.py` es un bucle de eventos: creas un `Client` con un conjunto de `intents` (qué categorías de eventos tiene permitido recibir), luego registras funciones `async def` decoradas con `@client.event` para los eventos que te importan — más comúnmente `on_ready` (se dispara una vez, cuando se establece la conexión) y `on_message` (se dispara para cada mensaje que el bot puede ver):

```python
# bot.py
import os

import discord
from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so -- do not make something up.
Keep the answer concise; this will be posted in a Discord message.

Context:
{context}

Question: {question}

Answer:"""

MAX_DISCORD_MESSAGE_LENGTH = 2000  # Discord's hard cap on a single message

intents = discord.Intents.default()
intents.message_content = True  # requires the portal toggle from Setup, too

client = discord.Client(intents=intents)
llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)
    return PROMPT_TEMPLATE.format(context=context, question=question)


def answer(question: str, top_k: int = 3) -> str:
    chunks = retrieve(question, top_k=top_k)
    prompt = build_prompt(question, chunks)
    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


@client.event
async def on_ready():
    print(f"Logged in as {client.user} -- ready in {len(client.guilds)} server(s).")


@client.event
async def on_message(message: discord.Message):
    if message.author == client.user:
        return  # never reply to yourself -- avoids an infinite reply loop

    if client.user not in message.mentions:
        return  # only answer when actually mentioned

    question = message.content.replace(f"<@{client.user.id}>", "").strip()
    if not question:
        await message.reply("Mention me with a question, e.g. `@docs-qa-bot how do I install uv?`")
        return

    async with message.channel.typing():
        try:
            reply = answer(question)
        except Exception as error:
            print(f"Error answering question: {error!r}")
            reply = "Something went wrong answering that -- see the bot's console log for details."

    if len(reply) > MAX_DISCORD_MESSAGE_LENGTH:
        reply = reply[: MAX_DISCORD_MESSAGE_LENGTH - 1] + "…"
    await message.reply(reply)


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
```

`answer()` es línea por línea la misma idea que `ask()` del proyecto de App RAG — recuperar, construir un prompt, llamar al LLM — solo que devuelve una cadena en lugar de imprimirla, para que `on_message` pueda entregar esa cadena a `message.reply(...)`. Todo por encima de `on_ready`/`on_message` corre una vez al inicio; todo dentro de esas dos funciones corre una vez por evento, mientras `client.run(...)` mantenga la conexión viva.

La protección `if message.author == client.user: return` importa más de lo que podría parecer: sin ella, si la propia respuesta del bot resultara mencionarse a sí mismo (no lo hará aquí, pero es un error fácil en general), dispararía `on_message` de nuevo sobre su propia salida — un bucle infinito de un bot respondiéndose a sí mismo.

:::tip[async def y await no son opcionales aquí]
`discord.py` está construido enteramente sobre `asyncio` de Python — cada manejador de eventos debe declararse `async def`, y cualquier llamada que espere en la red (enviar un mensaje, obtener datos) debe tener `await`. Olvidar cualquiera de los dos es uno de los primeros errores más comunes: omitir `async` en `on_message` lanza un error inmediatamente, y olvidar `await` en `message.reply(...)` no hace absolutamente nada silenciosamente, ya que solo crea una corrutina sin `await` en lugar de realmente ejecutarla.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`bot.py` define `on_ready` y `on_message`, ambos como `async def`, ambos decorados con `@client.event`.</StepChecklistItem>
<StepChecklistItem>`on_message` verifica `message.author == client.user` antes de hacer cualquier otra cosa.</StepChecklistItem>
<StepChecklistItem>`answer()` llama al mismo `retrieve()` del Paso 2, sin cambios.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué verificar `client.user not in message.mentions` en lugar de simplemente verificar si el nombre del bot aparece en algún lugar de `message.content` como una subcadena?
- El `try`/`except` alrededor de `answer(reply)` captura *cualquier* excepción y responde con un mensaje de error genérico en lugar de fallar. ¿Cuál es la compensación de capturar tan ampliamente en un bot de larga duración versus dejar que un bug real falle el proceso ruidosamente?

## Paso 4: Invita al bot y pruébalo de principio a fin

De vuelta en el Portal de Desarrolladores de Discord, abre **OAuth2 → URL Generator**. Bajo **Scopes**, marca `bot`; bajo **Bot Permissions**, marca al menos **Send Messages** y **Read Message History**. Copia la URL generada, ábrela en un navegador, y elige un servidor que controles (crea un servidor de prueba gratuito si aún no tienes uno) para añadir el bot.

Ejecútalo:

```bash
uv run python bot.py
```

Deberías ver `Logged in as docs-qa-bot#1234 -- ready in 1 server(s).` impreso — el silencio después de eso es normal; el proceso simplemente está sentado y esperando eventos del Gateway de Discord, la misma idea de "sin salida significa que está funcionando" que un servidor MCP esperando en stdio. En el servidor de prueba, menciona al bot con una pregunta real sobre lo que sea que esté en tu carpeta `docs/`:

```
@docs-qa-bot how do I enable the message content intent?
```

En pocos segundos deberías ver un indicador de "escribiendo", luego una respuesta fundamentada en tu documentación real — no una suposición de los datos generales de entrenamiento del modelo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>El bot aparece en línea en la lista de miembros de tu servidor de prueba después de ejecutar `uv run python bot.py`.</StepChecklistItem>
<StepChecklistItem>Mencionarlo con una pregunta real produce un indicador de "escribiendo", luego una respuesta.</StepChecklistItem>
<StepChecklistItem>El contenido de la respuesta realmente refleja tu carpeta `docs/`, y una pregunta que tus documentos no cubren obtiene un honesto "no sé" en lugar de una suposición confiada.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si detienes `bot.py` (`Ctrl+C`) y mencionas al bot de nuevo, ¿qué pasa del lado de Discord? ¿Qué te dice eso sobre dónde vive realmente la "presencia" del bot?
- Probaste la recuperación y la llamada al LLM por separado en los Pasos 1–2 antes de conectarlas a Discord en el Paso 3. Si el bot ahora da una respuesta equivocada, ¿cómo usarías `retrieve.py` por sí solo para averiguar si el bug está en la recuperación o en la conexión de Discord alrededor de ella?

## ⚠️ Errores comunes

- **Olvidar el intent privilegiado de "Message Content".** Esto tiene que habilitarse en *dos* lugares — `intents.message_content = True` en el código, **y** el interruptor bajo Bot → Privileged Gateway Intents en el Portal de Desarrolladores. Pierde el interruptor del portal y `message.content` es silenciosamente una cadena vacía para cada mensaje, sin ningún error que te diga por qué.
- **Límites de tasa en el nivel gratuito del LLM, empeorados por el tráfico real del bot.** Un script CLI como el `ask.py` del proyecto de App RAG solo llama al LLM cuando lo ejecutas; un bot en vivo puede recibir varias preguntas en rápida sucesión de diferentes personas en un servidor ocupado, y cada una es una llamada separada contra la cuota de nivel gratuito de tu proveedor. Un error 429 bajo carga no es un bug — mira los [pitfalls del proyecto de App RAG](/docs/projects/rag-notes#️-common-pitfalls) para el mismo patrón de límite de tasa y cómo añadir un reintento.
- **No reconstruir el índice después de cambiar `docs/`.** Exactamente como el proyecto de App RAG: `build_index.py` solo corre cuando lo ejecutas. Añade o edita un documento y el bot sigue respondiendo desde el índice *antiguo* hasta que vuelvas a ejecutar `uv run python build_index.py` y reinicies el bot.
- **Ejecutar el bot con un token obsoleto o incorrecto después de regenerarlo.** Hacer clic en "Reset Token" en el Portal de Desarrolladores invalida el token antiguo inmediatamente — si `.env` todavía tiene el valor antiguo, `client.run(...)` falla al iniciar sesión. Actualiza `.env` cada vez que reinicies el token, y nunca asumas que el valor que copiaste una vez sigue siendo válido.

## Lo que acabas de construir

Un bot de Discord en vivo que responde preguntas reales de documentación real, fundamentado en texto recuperado en lugar del conocimiento general del modelo — el mismo pipeline RAG exacto que el [proyecto de App RAG](/docs/projects/rag-notes), con un bucle de eventos de `discord.py` sustituyendo a un script CLI como interfaz. El código de recuperación y generación no cambió de ninguna forma significativa; solo cambió cómo entra una pregunta y sale una respuesta. Eso es algo útil de notar en general: la lógica central de un pipeline RAG es independiente de la interfaz, y el mismo par `retrieve()`/`answer()` aquí podría igual de fácilmente estar detrás de un bot de Slack, un formulario web, o un endpoint de API en su lugar.

## A dónde ir desde aquí

- Añade un **comando slash** (`/ask <pregunta>`) usando `app_commands` de `discord.py` junto con, o en lugar de, respuestas basadas en mención — los comandos slash aparecen en la UI de Discord con autocompletado y no requieren escribir una `@mención`, al costo de una pequeña cantidad de código de registro extra.
- Rastrea qué fuente de `docs/` realmente citó cada respuesta, y haz que el bot incluya una línea "Fuente: archivo.md" en su respuesta — una característica pequeña pero real de construcción de confianza para cualquiera que lea la respuesta.
- Una vez que tu carpeta de documentación supere lo que cabe cómodamente en memoria, mira una base de datos vectorial real como [ChromaDB](https://www.trychroma.com/), exactamente como se sugiere en el ["A dónde ir desde aquí" del proyecto de App RAG](/docs/projects/rag-notes#where-to-go-from-here) — nada sobre la capa de Discord necesita cambiar para soportarlo.
- Despliega el bot en algún lugar que se mantenga activo sin que tu propia laptop esté corriendo — una pequeña VM siempre activa, o un nivel gratuito en una plataforma como Railway o Fly.io — para que siga respondiendo preguntas incluso cuando no estés en tu máquina.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="docs-qa-bot" />
