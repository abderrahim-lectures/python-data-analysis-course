---
id: trivia-bot
title: "Construye un Bot de Trivia para Discord"
sidebar_label: "Construye un Bot de Trivia para Discord"
slug: /projects/trivia-bot
description: "Construye un bot de `discord.py` que ejecuta rondas de trivia en un servidor, lleva el seguimiento de los puntos en una tabla de clasificación persistente, y puede generar preguntas nuevas sobre cualquier tema con un LLM de nivel gratuito."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Bot de Trivia para Discord

<ProjectPublishedDate projectId="trivia-bot" />

<ProjectGreeting />

Un bot `discord.py` en vivo que ejecuta rondas de trivia en un servidor: publica una pregunta, recoge respuestas dentro de un límite de tiempo, revela quién acertó, y mantiene una tabla de clasificación persistente a lo largo de las rondas. La mayoría de los bots de trivia se detienen en un banco de preguntas fijo — este añade un giro que encaja con un curso de Python: también puede generar una pregunta nueva sobre cualquier tema en el momento con un LLM de nivel gratuito, en lugar de solo preguntar siempre desde una lista preparada.

Esto asume Python 101. No se requiere ningún otro Proyecto del Mundo Real primero, aunque si ya has construido [Construye una App de RAG](/docs/projects/rag-notes), la configuración del LLM de nivel gratuito de abajo te resultará familiar.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Crear una aplicación de bot de Discord y obtener su token desde el portal gratuito de desarrolladores de Discord.
2. Instalar `uv`, configurar un proyecto, y añadir `discord.py` junto con un cliente LLM de nivel gratuito.
3. Construir un banco de preguntas de trivia fijo y un comando básico de barra diagonal de Discord que publique una.
4. Añadir una tabla de clasificación persistente por jugador, almacenada entre reinicios.
5. Añadir un modo de preguntas generadas por LLM: dale un tema al bot, obtén una pregunta nueva.
6. Conectarlo todo en un bucle de ronda completo — publica una pregunta, recoge respuestas dentro de un límite de tiempo, revela la respuesta, actualiza la tabla de clasificación.
7. Invita el bot a un servidor de prueba y ejecuta rondas reales, de principio a fin.

## Dónde ejecutar esto

**Localmente con `uv`** es realmente la única opción práctica aquí, más que para la mayoría de los otros proyectos de esta serie. Un bot de Discord no es un script que se ejecuta una vez y termina — mantiene una conexión abierta con Discord y necesita seguir ejecutándose mientras quieras que responda a `/trivia` y recoja respuestas, lo que significa un proceso real local (o alojado) de larga duración, no un comando de una sola vez.

**GitHub Codespaces** también funciona, y es un sustituto razonable si prefieres no instalar nada localmente: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta `uv run python bot.py` en una terminal allí — sigue ejecutándose mientras esa terminal (y el Codespace) permanezcan abiertos, el mismo requisito de "proceso de larga duración" que ejecutarlo localmente.

**Google Colab y Kaggle Notebooks encajan mal con el bot real** — sé honesto contigo mismo sobre eso en lugar de luchar contra ello. Los notebooks están construidos en torno a ejecutar una celda, obtener la salida, y pasar a la siguiente celda; no están pensados para un proceso en segundo plano que se sienta y espera eventos indefinidamente. *Puedes* iniciar el bucle de eventos de un bot en una celda de notebook, pero en el momento en que el runtime del notebook se recicla, se desconecta, o cierras la pestaña, el bot se cae con él — omite Colab/Kaggle para el bot en vivo y usa un proceso local real o Codespaces en su lugar.

Dicho esto, la generación de preguntas y la puntuación *debajo* del bot son solo funciones normales que ejecutan una celda a la vez, que es exactamente para lo que los notebooks son buenos. Las insignias de abajo abren un notebook que genera preguntas LLM reales sobre algunos temas de muestra y ejecuta un par de "jugadores" falsos a través de la lógica de puntuación, para que puedas ver ambos funcionar sin instalar nada localmente. Se detiene deliberadamente antes de la capa de Discord — para eso, vuelve aquí y ejecuta `bot.py` localmente o en Codespaces como se describió arriba.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/trivia-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/trivia-bot/notebook.ipynb)

## Configuración

Todo en esta sección solo necesita suceder una vez, antes de que escribas una sola línea del bot en sí: instalar `uv`, crear la aplicación de bot de Discord y obtener su token, conseguir una clave LLM gratuita, y configurar el proyecto. Cada paso después de este asume que todo eso ya está hecho.

### Instalar `uv`

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

### Crear una aplicación de bot de Discord y obtener un token

El [Portal de Desarrolladores](https://discord.com/developers/applications) de Discord es gratuito y no necesita tarjeta:

1. Inicia sesión y haz clic en **New Application**, dale un nombre (ej. "trivia-bot"), y créala.
2. Abre la pestaña **Bot** a la izquierda. Discord añade un usuario bot a tu aplicación automáticamente.
3. Haz clic en **Reset Token** (o **View Token** si es la primera vez) y cópialo. Este token es exactamente como una contraseña — cualquiera que lo tenga puede controlar tu bot — así que trátalo igual que tratarías una clave API de LLM: nunca lo pegues en código, nunca lo confirmes.
4. En la misma pestaña **Bot**, desplázate hasta **Privileged Gateway Intents** y activa **Message Content**. Esto es necesario para que el bot realmente lea la letra con la que responde un jugador — sin ello, `discord.py` recibe una cadena vacía para el contenido de cada mensaje sin importar el código que escribas.
5. Abre **OAuth2 → URL Generator**. Bajo **Scopes**, marca tanto `bot` como `applications.commands` (los comandos de barra diagonal necesitan específicamente el segundo); bajo **Bot Permissions**, marca al menos **Send Messages** y **Read Message History**. Mantén la URL generada a mano — la usarás en el último paso para invitar realmente el bot a un servidor.

:::tip[Un token de bot es un secreto, exactamente como una clave API]
Nunca codifiques el token del bot, nunca lo confirmes, y mantenlo en un archivo `.env` local (abajo) en su lugar — un token de bot filtrado permite a cualquiera hacerse pasar por tu bot en cada servidor en el que está, exactamente como una clave LLM filtrada permite a cualquiera gastar tu cuota.
:::

### Obtener una clave API de LLM gratuita

El modo de generación de preguntas necesita una clave LLM de nivel gratuito — **elige el proveedor que prefieras**, ninguno requiere tarjeta de crédito al momento de escribir esto:

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(predeterminado sugerido)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el ámbito `models: read` | Sin registro separado — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que los de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

El banco de preguntas fijo (Paso 1) no necesita ninguna clave LLM en absoluto — solo necesitas una una vez que llegues a la generación de preguntas por tema del Paso 3.

### Configurar el proyecto

```bash
uv init trivia-bot
cd trivia-bot
uv add discord.py openai python-dotenv
```

`discord.py` es la biblioteca que habla con Discord — conectándose a su Gateway, registrando comandos de barra diagonal, y recibiendo/enviando mensajes. `openai` habla con el endpoint compatible con OpenAI de GitHub Models para el proveedor predeterminado de arriba; cámbialo por el paquete de tu propio proveedor si elegiste uno diferente. `python-dotenv` carga secretos desde un archivo `.env` local.

Crea un archivo `.env` en la carpeta del proyecto (nunca lo confirmes) con **ambos** secretos de esta sección:

```bash
# .env
DISCORD_BOT_TOKEN=your-bot-token-here
GITHUB_TOKEN=your-llm-key-here
```

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Existen una aplicación de Discord y un bot en el Portal de Desarrolladores, y has copiado su token.</StepChecklistItem>
<StepChecklistItem>"Message Content" está activado bajo Privileged Gateway Intents.</StepChecklistItem>
<StepChecklistItem>Tienes una clave API de LLM de nivel gratuito de un proveedor de tu elección.</StepChecklistItem>
<StepChecklistItem>`uv init`/`uv add` se completaron sin errores, y `.env` tiene tanto `DISCORD_BOT_TOKEN` como tu clave LLM configurados.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué Discord requiere que habilites explícitamente "Message Content" como una intención *privilegiada*, en lugar de darle a cada bot acceso al texto de los mensajes por defecto?
- El token del bot y la clave API del LLM son ambos secretos, pero autentican contra dos servicios completamente diferentes. ¿Qué saldría mal si accidentalmente intercambiaras qué variable de entorno contiene qué valor?

## Paso 1: Un banco de preguntas fijo y un comando básico de barra diagonal

Empieza con la fuente de preguntas más simple posible — una lista plana de Python de diccionarios — y suficiente cableado de Discord para publicar una:

```python
# questions.py
"""A small fixed bank of trivia questions. Every question, from this bank
or later generated by an LLM, is the same shape:
{"question": str, "options": list[str], "answer_index": int}."""

import random

QUESTION_BANK = [
    {
        "question": "What year was Python first released?",
        "options": ["1989", "1991", "1995", "2000"],
        "answer_index": 1,
    },
    {
        "question": "Which planet is known as the Red Planet?",
        "options": ["Venus", "Jupiter", "Mars", "Saturn"],
        "answer_index": 2,
    },
    # ... a handful more, see examples/trivia-bot/questions.py for the full bank
]


def random_question() -> dict:
    return random.choice(QUESTION_BANK)
```

La interfaz moderna de `discord.py` para esto es un **comando de barra diagonal**: en lugar de vigilar cada mensaje buscando algo que parezca un comando, registras `/trivia` con Discord mismo, y Discord lo muestra en la interfaz con autocompletado. Eso necesita un `Client` además de un `app_commands.CommandTree` adjunto a él:

```python
# bot.py (Step 1 version — grows through the rest of this project)
import os

import discord
from discord import app_commands
from dotenv import load_dotenv

from questions import random_question

load_dotenv()

intents = discord.Intents.default()
intents.message_content = True  # requires the portal toggle from Setup, too

client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)


@tree.command(name="trivia", description="Start a trivia round")
async def trivia_command(interaction: discord.Interaction) -> None:
    question = random_question()
    lines = [f"**{question['question']}**"]
    for letter, option in zip("ABCD", question["options"]):
        lines.append(f"{letter}) {option}")
    await interaction.response.send_message("\n".join(lines))


@client.event
async def on_ready() -> None:
    await tree.sync()  # registers /trivia with Discord -- can take a minute the first time
    print(f"Logged in as {client.user} -- ready in {len(client.guilds)} server(s).")


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
```

`tree.sync()` es lo que realmente publica `/trivia` en Discord para que aparezca cuando alguien escribe `/` en tu servidor — omítelo y el comando existe en tu código pero en ningún lugar donde la interfaz de Discord pueda encontrarlo.

:::tip[Los comandos de barra diagonal necesitan un segundo ámbito de OAuth2]
Una invitación de bot normal solo necesita el ámbito `bot`. Los comandos de barra diagonal necesitan específicamente también `applications.commands` — si generaste tu URL de invitación antes de añadir `/trivia`, regenérala con ambos ámbitos marcados (ver Configuración arriba) o el comando nunca aparecerá en silencio en tu servidor.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`questions.py` define `QUESTION_BANK` y `random_question()`.</StepChecklistItem>
<StepChecklistItem>`bot.py` registra un comando de barra diagonal `/trivia` vía `app_commands.CommandTree`.</StepChecklistItem>
<StepChecklistItem>`on_ready` llama a `await tree.sync()` antes de imprimir su mensaje de listo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `tree.sync()` re-registra cada comando de barra diagonal con los servidores de Discord, lo que está limitado por velocidad. ¿Qué saldría mal si lo llamaras dentro de `trivia_command` en lugar de una vez en `on_ready`?
- El `answer_index` del dict de la pregunta apunta a `options` por posición en lugar de almacenar el texto de la respuesta correcta directamente. ¿Cuál es una ventaja de almacenarlo de esta manera?

## Paso 2: Seguimiento de puntos, persistido a lo largo de las rondas

Una tabla de clasificación solo significa algo si sobrevive al reinicio del bot, así que los puntos van a un pequeño archivo JSON en lugar de vivir solo en memoria:

```python
# scores.py
"""Per-player score persistence in scores.json. Keyed by Discord user id
(not username), so a player's score survives a nickname change."""

import json
from pathlib import Path

SCORES_PATH = Path("scores.json")


def load_scores() -> dict:
    if not SCORES_PATH.exists():
        return {}
    return json.loads(SCORES_PATH.read_text(encoding="utf-8"))


def save_scores(scores: dict) -> None:
    SCORES_PATH.write_text(json.dumps(scores, indent=2), encoding="utf-8")


def award_point(scores: dict, user_id: int, display_name: str) -> dict:
    key = str(user_id)
    entry = scores.get(key, {"name": display_name, "score": 0})
    entry["name"] = display_name
    entry["score"] += 1
    scores[key] = entry
    save_scores(scores)
    return scores


def leaderboard_text(scores: dict, top_n: int = 10) -> str:
    if not scores:
        return "No scores yet -- play a round with `/trivia`!"
    ranked = sorted(scores.values(), key=lambda entry: entry["score"], reverse=True)
    lines = [f"{i}. {entry['name']} — {entry['score']}" for i, entry in enumerate(ranked[:top_n], start=1)]
    return "\n".join(lines)
```

Pruébalo de forma independiente antes de conectarlo a `bot.py` en absoluto — el mismo patrón de "prueba que la pieza funciona por sí sola primero" que cualquier proyecto de varias partes:

```bash
uv run python -c "
from scores import award_point, leaderboard_text
s = {}
s = award_point(s, 111, 'Alice')
s = award_point(s, 222, 'Bob')
s = award_point(s, 111, 'Alice')
print(leaderboard_text(s))
"
```

Luego añade un segundo comando de barra diagonal que solo lea el archivo:

```python
@tree.command(name="leaderboard", description="Show the trivia leaderboard")
async def leaderboard_command(interaction: discord.Interaction) -> None:
    scores = load_scores()
    await interaction.response.send_message(f"**Leaderboard:**\n{leaderboard_text(scores)}")
```

Nada otorga un punto todavía — `trivia_command` del Paso 1 no verifica respuestas en absoluto — eso es lo que añade el bucle de ronda del Paso 4. Este paso es deliberadamente solo la mitad de almacenamiento, probada y funcionando por sí sola primero.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`scores.py` define `load_scores()`, `award_point()`, y `leaderboard_text()`.</StepChecklistItem>
<StepChecklistItem>Ejecutar la prueba independiente de `scores.py` imprime una tabla de clasificación con Alice por encima de Bob.</StepChecklistItem>
<StepChecklistItem>`/leaderboard` está registrado en `bot.py` y responde con la tabla de clasificación (aún vacía).</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Los puntos se indexan por `str(user_id)` en lugar de por el nombre mostrado del jugador. ¿Qué escenario real rompería una tabla de clasificación indexada por nombre que una indexada por ID de usuario sobrevive?
- `save_scores()` reescribe todo el archivo en cada punto individual. Para un bot pequeño de un solo servidor esto está bien — ¿en qué punto dejaría de estarlo, y qué usarías en su lugar?

## Paso 3: Genera una pregunta nueva sobre cualquier tema con un LLM

El banco fijo del Paso 1 solo pregunta desde el mismo puñado de preguntas. Este paso añade una segunda fuente de preguntas: dale un tema al bot, y le pide a un LLM una pregunta de opción múltiple completamente nueva sobre él, en el momento.

```python
# generate.py
"""Generates a fresh trivia question on a topic via a free-tier LLM.
Returns the exact same shape as questions.py's bank entries, so the rest
of the bot doesn't need to know or care where a question came from."""

import json
import os

from openai import OpenAI

llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

PROMPT_TEMPLATE = """Write one multiple-choice trivia question about: {topic}

Respond with ONLY a JSON object, no other text, in exactly this shape:
{{"question": "...", "options": ["...", "...", "...", "..."], "answer_index": 0}}

Requirements:
- Exactly 4 options.
- Exactly one is correct; put its index (0-3) in answer_index.
- The wrong options must be plausible, not obviously silly.
- Keep the question and every option short enough to fit in a Discord message."""


def generate_question(topic: str) -> dict:
    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(topic=topic)}],
        response_format={"type": "json_object"},
    )
    question = json.loads(response.choices[0].message.content)

    options = question.get("options")
    answer_index = question.get("answer_index")
    if not question.get("question") or not isinstance(options, list) or len(options) != 4:
        raise ValueError(f"LLM returned a malformed question: {question!r}")
    if not isinstance(answer_index, int) or not (0 <= answer_index < 4):
        raise ValueError(f"LLM returned an invalid answer_index: {question!r}")
    return question
```

La verificación explícita de la forma después del análisis importa: `response_format={"type": "json_object"}` garantiza que la salida del LLM sea *JSON válido*, no que sea el *JSON correcto* — aún podría devolver tres opciones en lugar de cuatro, u omitir `answer_index` por completo. Capturarlo aquí, con un error claro, es mejor que descubrirlo más tarde como un mensaje confuso de Discord con una opción D que falta.

Conecta un parámetro `topic` en `/trivia` para que pueda extraer de cualquiera de las dos fuentes:

```python
from round import pick_question  # combines random_question() and generate_question()
```

```python
# round.py
"""Non-Discord round logic shared by bot.py and the notebook."""

from generate import generate_question
from questions import random_question


def pick_question(topic: str | None = None) -> dict:
    if topic:
        return generate_question(topic)
    return random_question()
```

```python
@tree.command(name="trivia", description="Start a trivia round, optionally on a topic")
@app_commands.describe(topic="Optional topic for a freshly generated question")
async def trivia_command(interaction: discord.Interaction, topic: str | None = None) -> None:
    question = pick_question(topic)
    ...
```

Prueba ambos caminos desde una terminal antes de confiar en ellos dentro de Discord:

```bash
uv run python -c "from round import pick_question; print(pick_question())"
uv run python -c "from round import pick_question; print(pick_question('classic video games'))"
```

:::tip[Valida el contenido generado por LLM antes de que llegue a un canal en vivo]
Un LLM al que se le pide una pregunta de trivia aún puede equivocarse en los hechos, especialmente en temas oscuros — no hay `try`/`except` que capture "equivocado con confianza". La validación de la forma en `generate_question()` solo protege contra una *estructura* malformada; para un servidor público, hojea un puñado de preguntas generadas sobre temas que realmente conozcas antes de confiar en el modo en temas que no conoces.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`generate_question(topic)` de `generate.py` devuelve un dict con 4 opciones y un `answer_index` válido, o lanza un error claro.</StepChecklistItem>
<StepChecklistItem>`pick_question()` de `round.py` devuelve una pregunta del banco cuando `topic` está vacío, y una generada en caso contrario.</StepChecklistItem>
<StepChecklistItem>`/trivia` acepta un argumento `topic` opcional y lo usa visiblemente.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `generate_question()` valida que `answer_index` sea un int en `0..3` y que haya exactamente 4 opciones, pero no valida que el *contenido* sea realmente trivia correcta. ¿Dónde está la línea entre lo que el código puede verificar razonablemente y lo que solo un humano que revise la salida puede hacer?
- Si un jugador elige un tema intencionalmente ofensivo o sin sentido, ¿cuál es lo peor plausible que `generate_question()` podría devolver, y qué añadirías para protegerte contra ello?

## Paso 4: Un bucle de ronda de trivia completo

Todo hasta ahora han sido piezas probadas de forma aislada: una fuente de preguntas, almacenamiento de puntos, generación. Este paso las conecta en lo que una ronda realmente parece en vivo — publica una pregunta, espera la primera respuesta correcta dentro de un límite de tiempo, revélala, actualiza la tabla de clasificación:

```python
# bot.py (relevant part -- see examples/trivia-bot/bot.py for the full file)
import asyncio

from round import OPTION_LETTERS, check_answer, format_question, pick_question
from scores import award_point, leaderboard_text, load_scores

ROUND_TIME_LIMIT = 30  # seconds


async def run_round(channel: discord.abc.Messageable, topic: str | None = None) -> None:
    question = pick_question(topic)
    valid_letters = OPTION_LETTERS[: len(question["options"])]
    await channel.send(
        f"{format_question(question)}\n\nYou have {ROUND_TIME_LIMIT}s -- "
        f"reply with just the letter ({'/'.join(valid_letters)})."
    )

    def is_candidate_answer(message: discord.Message) -> bool:
        return (
            message.channel == channel
            and not message.author.bot
            and message.content.strip().upper() in valid_letters
        )

    loop = asyncio.get_event_loop()
    deadline = loop.time() + ROUND_TIME_LIMIT
    winner = None

    while True:
        remaining = deadline - loop.time()
        if remaining <= 0:
            break
        try:
            message = await client.wait_for("message", check=is_candidate_answer, timeout=remaining)
        except asyncio.TimeoutError:
            break
        if check_answer(question, message.content):
            winner = message.author
            break
        await message.add_reaction("❌")

    correct_letter = OPTION_LETTERS[question["answer_index"]]
    correct_text = question["options"][question["answer_index"]]

    if winner is not None:
        scores = award_point(load_scores(), winner.id, str(winner.display_name))
        await channel.send(
            f"✅ {winner.mention} got it! The answer was **{correct_letter}) {correct_text}**.\n\n"
            f"**Leaderboard:**\n{leaderboard_text(scores)}"
        )
    else:
        await channel.send(f"⏰ Time's up! Nobody got it. The answer was **{correct_letter}) {correct_text}**.")
```

`client.wait_for("message", check=..., timeout=...)` es la forma de `discord.py` de pausar una función `async` hasta que ocurra un tipo específico de evento — aquí, cualquier mensaje en el mismo canal cuyo contenido sea exactamente una de las letras de respuesta válidas. El bucle `while` lo vuelve a llamar con un timeout `remaining` decreciente, de modo que el presupuesto de tiempo *total* de la ronda sea `ROUND_TIME_LIMIT`, no `ROUND_TIME_LIMIT` por suposición incorrecta — sin recalcular `remaining`, un canal lleno de suposiciones incorrectas entusiastas podría mantener la ronda abierta indefinidamente.

Solo la *primera* respuesta correcta puntúa; haz `break` tan pronto como se establezca `winner`. Las suposiciones incorrectas obtienen una reacción ❌ en lugar de un mensaje de error — retroalimentación gratuita sin saturar el canal con respuestas.

Finalmente, `trivia_command` del Paso 1 se convierte en un envoltorio delgado alrededor de `run_round`:

```python
@tree.command(name="trivia", description="Start a trivia round, optionally on a topic")
@app_commands.describe(topic="Optional topic for a freshly generated question")
async def trivia_command(interaction: discord.Interaction, topic: str | None = None) -> None:
    starting_text = f"🎲 Starting a round about **{topic}**..." if topic else "🎲 Starting a round..."
    await interaction.response.send_message(starting_text)
    try:
        await run_round(interaction.channel, topic)
    except Exception as error:  # keep the bot alive even if one round fails
        print(f"Error running trivia round: {error!r}")
        await interaction.channel.send("Something went wrong running that round -- see the bot's console log.")
```

:::tip[Prueba el tiempo de la ronda con un ROUND_TIME_LIMIT corto primero]
Establece `ROUND_TIME_LIMIT = 5` mientras ajustas el bucle, para no esperar 30 segundos por ciclo de prueba para descubrir que `check_answer` tiene un error. Súbelo de nuevo a algo razonable para el juego real una vez que el bucle en sí funcione.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`/trivia` publica una pregunta y luego realmente espera una respuesta en lugar de resolverse al instante.</StepChecklistItem>
<StepChecklistItem>La primera respuesta correcta dentro del límite de tiempo se anuncia como ganadora y recibe un punto vía `award_point()`.</StepChecklistItem>
<StepChecklistItem>Dejar que el temporizador se agote sin respuesta correcta revela la respuesta sin bloquearse ni colgarse.</StepChecklistItem>
<StepChecklistItem>Ejecutar `/trivia` dos veces seguidas inicia una ronda nueva cada vez, usando la tabla de clasificación actualizada.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `is_candidate_answer` verifica `message.channel == channel` para que las respuestas de otros canales del servidor no cuenten. ¿Qué le pasaría a una ronda en un servidor ocupado si esa verificación faltara?
- El `try`/`except Exception` alrededor de `run_round(...)` captura *cualquier* excepción y publica un error genérico en lugar de bloquearse. ¿Cuál es el compromiso de capturar tan ampliamente en un bot de larga duración frente a dejar que un error real bloquee el proceso ruidosamente?

## Invita el bot y juega una ronda real

Usando la URL de OAuth2 que generaste en Configuración (con ambos ámbitos `bot` y `applications.commands`), ábrela en un navegador y elige un servidor que controles — crea un servidor de prueba gratuito si no tienes uno todavía.

```bash
uv run python bot.py
```

Deberías ver impreso `Logged in as trivia-bot#1234 -- ready in 1 server(s).`. En el servidor de prueba, escribe `/trivia` y elígelo del menú de autocompletado de Discord — con o sin `topic`. En unos segundos deberías ver la pregunta publicada, y después de responder correctamente (o dejar que el temporizador se agote) la respuesta revelada y la tabla de clasificación actualizada. Ejecuta `/leaderboard` en cualquier momento para verificar los puntos sin iniciar una ronda nueva.

## ⚠️ Errores comunes

- **Olvidar la intención privilegiada "Message Content".** Esto tiene que estar habilitado en *dos* lugares — `intents.message_content = True` en el código, **y** el interruptor bajo Bot → Privileged Gateway Intents en el Portal de Desarrolladores. Omite el interruptor del portal y `message.content` es silenciosamente una cadena vacía para cada mensaje, así que `is_candidate_answer` nunca coincide con ninguna respuesta sin importar cómo se escriba.
- **Confundir el token del bot con el secreto de cliente de OAuth2.** El Portal de Desarrolladores muestra ambos en pestañas diferentes. El token del bot (pestaña Bot) es lo que necesita `client.run(...)`; el secreto de cliente (pestaña OAuth2) es para un flujo de autenticación completamente diferente que este proyecto nunca usa. Pegar el secreto de cliente en `DISCORD_BOT_TOKEN` falla al iniciar sesión con un error confuso.
- **`/trivia` nunca aparece en la interfaz de Discord.** Usualmente una de dos causas: `tree.sync()` nunca se llamó (o no se esperó) en `on_ready`, o la URL de invitación del bot se generó antes de añadir el ámbito `applications.commands`. Regenera la URL de invitación con ambos ámbitos y re-invita al bot si el segundo es el problema.
- **Límites de velocidad en el nivel gratuito del LLM, peores con varias rondas seguidas.** Cada llamada `/trivia <topic>` es una solicitud LLM separada contra la cuota de nivel gratuito de tu proveedor, y un servidor ocupado que ejecuta varias rondas consecutivas puede alcanzarla más rápido de lo que esperarías solo de las pruebas. Un error 429 no es un bug — añade un reintento corto con retroceso alrededor de `generate_question()`, o recurre al banco fijo cuando la generación falle.
- **Una ronda que nunca termina porque `remaining` no se recalcula.** Si copias el bucle de ronda pero llamas a `client.wait_for(..., timeout=ROUND_TIME_LIMIT)` (la constante fija) en lugar del valor decreciente `remaining`, cada suposición incorrecta efectivamente reinicia el reloj — la ronda puede durar mucho más de lo que `ROUND_TIME_LIMIT` realmente promete.

## Lo que acabas de construir

Un bot de trivia de Discord en vivo con dos fuentes de preguntas — un banco fijo y generación por LLM de nivel gratuito sobre cualquier tema — un bucle de ronda completo con tiempo real, y una tabla de clasificación persistente por jugador que sobrevive a los reinicios. La fuente de preguntas, la puntuación, y la lógica de ronda (`questions.py`, `generate.py`, `scores.py`, `round.py`) son todo Python simple sin `discord`, probados de forma independiente antes de tocar cualquier canal en vivo; solo `bot.py` sabe que Discord existe en absoluto. Esa división vale la pena tenerla en cuenta en general: los mismos cuatro módulos podrían estar detrás de un bot de Slack, un formulario web, o un juego de CLI en su lugar, sin cambios en ninguno de ellos.

## A dónde ir desde aquí

- Añade un **modo de juego de múltiples rondas** — `/trivia rounds:5` que juega varias preguntas consecutivas y anuncia un ganador general al final, en lugar de una pregunta por comando.
- Rastrea **etiquetas de dificultad o categoría** en las preguntas generadas (pide al LLM que incluya una en su respuesta JSON) y deja que los jugadores elijan una categoría con `/trivia topic:... difficulty:hard`.
- Añade una **tabla de clasificación por servidor** en lugar de un `scores.json` global — indexa `scores.json` por `(guild_id, user_id)` en lugar de solo `user_id`, para que dos servidores diferentes de Discord que ejecuten este bot no compartan una tabla de clasificación.
- Despliega el bot en algún lugar que permanezca activo sin tu portátil encendido — una VM pequeña siempre activa, o un nivel gratuito en una plataforma como Railway o Fly.io — para que siga alojando noches de trivia incluso cuando no estás en tu máquina.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes para añadir el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="trivia-bot" />
