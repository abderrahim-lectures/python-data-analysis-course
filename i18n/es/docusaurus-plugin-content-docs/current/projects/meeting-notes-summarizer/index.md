---
id: meeting-notes-summarizer
title: "Construye un Resumidor de Notas de Reuniones"
sidebar_label: "Resumidor de Notas de Reuniones"
slug: /projects/meeting-notes-summarizer
description: "Da el salto del entorno de práctica en el navegador a Python real: escribe un script que convierte una transcripción de reunión en bruto en un resumen estructurado — decisiones, elementos de acción y preguntas abiertas — usando un LLM de nivel gratuito y un diseño cuidadoso del prompt."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Resumidor de Notas de Reuniones

<ProjectPublishedDate projectId="meeting-notes-summarizer" />

<ProjectGreeting />

Todo en el curso hasta ahora se ejecutó en un playground aislado dentro del navegador — para que pudieras empezar a escribir Python desde el primer día sin ninguna configuración. Este proyecto es el paso de graduación: instala Python de verdad en tu propia máquina, y luego úsalo para construir una herramienta que resuelve un problema del mundo real genuinamente molesto — convertir una pared de texto en bruto de transcripción de reunión en un resumen corto y estructurado: qué se decidió, quién es responsable de qué, y qué sigue sin resolver. Esto asume Python 101; nada de Data Analysis es requerido.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Qué harás

1. Instalar `uv`, una herramienta rápida y moderna para gestionar el propio Python y las dependencias de tu proyecto.
2. Obtener una clave de API de LLM de nivel gratuito — cualquiera de seis proveedores funciona.
3. Cargar una transcripción de reunión real (tres muestras realistas se incluyen con este proyecto, así que se ejecuta sin ninguna configuración).
4. Diseñar un prompt que le pide al modelo devolver **JSON estructurado**, no prosa fluida — la habilidad central y transferible de este proyecto.
5. Llamar al modelo, y luego analizar y validar su respuesta JSON — manejando el caso en que vuelve ligeramente malformada, lo cual sucede más a menudo de lo que quisieras.
6. Formatear el resultado estructurado tanto como Markdown legible como un archivo `.json`, y ejecutar todo de principio a fin sobre una transcripción real.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado — es Python real ejecutándose en tu propia máquina, el mismo movimiento de "graduarte a Python real" que cada otro proyecto de esta sección. La sección de Configuración de abajo explica cómo instalarlo.

**GitHub Codespaces** es una alternativa sin configuración si prefieres no instalar nada localmente todavía: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta exactamente los mismos comandos `uv` desde una terminal en la pestaña de tu navegador.

**Google Colab, Kaggle Notebooks o Binder** también funcionan bien, y son opciones genuinamente buenas aquí — este proyecto es un script ligero que hace un puñado de llamadas API, no algo que necesite una GPU o una estructura de proyecto real para ser útil. Una versión de notebook lista para ejecutarse se incluye con este proyecto — haz clic en una insignia abajo para abrirla, sin configuración local requerida — o crea tu propio notebook, ejecuta `!pip install openai python-dotenv` en una celda, pega los scripts de abajo como celdas, y establece tu clave de API con un secreto de notebook (Colab) o una variable de entorno en lugar de un archivo `.env`.

{/* TODO: update these badge links to point at main once this PR merges */}
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-notes-summarizer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-notes-summarizer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeeting-notes-summarizer%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de escribir cualquier código de resumen — instalar `uv`, crear el proyecto, obtener una clave API gratuita y configurarla como variable de entorno — vive en esta sección, para que solo tengas que hacerlo una vez.

### 1. Instala `uv`

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

`uv` también puede obtener y gestionar un intérprete de Python real directamente:

```bash
uv python install 3.12
```

### 2. Crea el proyecto

```bash
uv init meeting-notes-summarizer
cd meeting-notes-summarizer
uv add openai python-dotenv
```

`uv init` crea un proyecto pequeño (un `pyproject.toml` que rastrea tus dependencias) y `uv add` instala paquetes en un entorno aislado automáticamente — sin configuración manual de entorno virtual. `openai` se usa aquí porque varios proveedores de nivel gratuito, incluyendo el predeterminado sugerido, exponen una API compatible con OpenAI, así que la única biblioteca de cliente funciona en todos ellos, solo apuntada a un `base_url` diferente. `python-dotenv` te permite mantener tu clave de API en un archivo `.env` local en lugar de hacer `export` de ella en cada sesión.

### 3. Obtén una clave de API de LLM gratuita

**Elige el proveedor que quieras** — ninguno requiere una tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(predeterminado sugerido)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el alcance `models: read` | Sin registro separado — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que los de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen de tokens diario, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Cualquiera que elijas, el proceso es el mismo: inicia sesión y genera una clave de API en el sitio de ese proveedor.

### 4. Crea tu archivo `.env`

**Nunca pegues una clave de API directamente en el código ni la hagas commit a un repositorio.** Crea un archivo `.env` en la carpeta de tu proyecto en su lugar (y asegúrate de que `.env` esté listado en `.gitignore`, justo junto a `.venv`):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

:::tip[Un archivo `.env` supera hacer `export` en cada sesión]
`load_dotenv()` de `python-dotenv` lee `.env` en `os.environ` automáticamente en el momento en que tu script arranca, así que nunca tienes que recordar hacer `export` de una clave en cada nueva ventana de terminal. Consulta el [`examples/meeting-notes-summarizer/.env.example`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer) de este curso para ver una plantilla que cubre los seis proveedores.
:::

Con la configuración lista, todo lo de abajo trata sobre el resumidor en sí.

## Paso 1: Carga una transcripción de reunión de muestra

Crea una carpeta `transcripts/` y coloca una transcripción de reunión en texto plano en ella — o copia una de las tres muestras realistas que se incluyen con el ejemplo del repositorio de este proyecto: una reunión diaria de pie, una reunión de planificación de producto y una revisión de incidente (consulta [`examples/meeting-notes-summarizer/sample_transcripts/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer/sample_transcripts)). Una transcripción es solo texto plano etiquetado por hablante, nada más sofisticado:

```text
Maria: Let's start with the API migration. Where are we?
James: About 70% done. I should finish the auth endpoints by Friday.
Maria: Good. Can you also write the migration guide for the team?
James: Yeah, I'll own that too.
Priya: Quick question -- are we still deprecating the v1 endpoints next month?
Maria: Let's hold off on that decision until James finishes the migration. I don't want to commit to a date yet.
```

Cargarla es el paso más pequeño posible, deliberadamente:

```python
# load_transcript.py
"""Loads a plain-text meeting transcript from disk.

Run with: uv run python load_transcript.py transcripts/standup.txt
"""

import sys
from pathlib import Path


def load_transcript(path: str) -> str:
    """Reads a transcript file and returns its raw text."""
    text = Path(path).read_text(encoding="utf-8")
    if not text.strip():
        raise ValueError(f"{path} is empty -- nothing to summarize.")
    return text


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    transcript = load_transcript(path)
    print(f"Loaded {len(transcript)} characters from {path}")
    print(transcript[:200] + ("..." if len(transcript) > 200 else ""))
```

```bash
uv run python load_transcript.py transcripts/standup.txt
```

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python load_transcript.py <path>` imprime un recuento de caracteres no cero y una vista previa que parece texto de transcripción real.</StepChecklistItem>
<StepChecklistItem>Ejecutarlo sobre una ruta que no existe levanta un error de Python claro en lugar de no hacer nada silenciosamente.</StepChecklistItem>
<StepChecklistItem>Ejecutarlo sobre un archivo vacío levanta el `ValueError` que escribiste, no un error confuso en una etapa posterior.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué verificar una transcripción vacía aquí, en el Paso 1, en lugar de simplemente dejar que un prompt en blanco llegue al LLM en un paso posterior y ver qué pasa?
- Esta función asume que la transcripción completa cabe cómodamente en un solo prompt. ¿Qué transcripción del mundo real rompería esa suposición, y aproximadamente cómo lo sabrías antes de ejecutarla?

## Paso 2: Diseña un prompt de extracción estructurada

Esta es la habilidad real que enseña este proyecto: en lugar de pedirle a un modelo un resumen en párrafo de forma libre ("Por favor resume esta reunión"), le pides que devuelva **JSON con una forma específica** — un esquema que tú defines — para que la salida sea algo que tu propio código pueda analizar, almacenar y sobre lo que pueda actuar de forma confiable después. Esta es la misma idea que un contrato de API, solo que aplicado a través de la redacción del prompt en lugar de un sistema de tipos.

El esquema para este proyecto: tres listas — `decisions`, `action_items` (cada uno con un `task` y un `owner` opcional, cuando la transcripción realmente nombra a uno) y `open_questions`.

```python
# extract_prompt.py
"""Builds the structured-extraction prompt sent to the LLM.

Imported by summarize.py (Step 3) -- not meant to be run directly.
"""

SYSTEM_PROMPT = """You are an assistant that extracts structured information \
from meeting transcripts. You always respond with a single JSON object and \
nothing else -- no markdown code fences, no commentary before or after it."""

# The exact shape we require back. Spelling this out in the prompt itself,
# field by field, is what makes a small/free-tier model actually follow it --
# vague instructions like "return the decisions and action items as JSON"
# produce far less consistent shapes across runs.
JSON_SCHEMA_DESCRIPTION = """Respond with a JSON object with EXACTLY these keys:

{
  "decisions": ["short string describing one decision that was made", ...],
  "action_items": [
    {"task": "short string describing the task", "owner": "person's name, or null if not stated"},
    ...
  ],
  "open_questions": ["short string describing one unresolved question", ...]
}

Rules:
- Only include a decision if the transcript shows the group actually agreeing on something -- not just discussing an option.
- Only include an action item if someone (or the group) commits to doing it.
- "owner" must be null (not the string "null", not "TBD") when no specific person is named for that task.
- If a category has nothing to report, use an empty list -- never omit the key.
- Do not invent information that isn't in the transcript."""


def build_prompt(transcript: str) -> list[dict]:
    """Returns the chat messages list ready to send to the LLM."""
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"{JSON_SCHEMA_DESCRIPTION}\n\nTranscript:\n{transcript}",
        },
    ]
```

Tres cosas hacen que este diseño de prompt sea deliberado, no accidental:

1. **El esquema se escribe literalmente**, clave por clave, con una forma de ejemplo — no se describe en prosa. Los modelos son mucho más consistentes igualando un ejemplo que infiriendo un esquema de una descripción.
2. **`owner` explícitamente puede ser `null`**, con una regla explícita sobre cuándo usarlo. Sin esa regla, los modelos tienden a inventar un nombre que suena plausible, o escribir la cadena `"TBD"` — un valor que tu código Python tendría que tratar de forma especial para siempre.
3. **El prompt del sistema declara el formato de salida como una restricción dura** ("nada más -- sin cercas de código markdown, sin comentarios"), porque la forma más común en que esto sale mal (ver Paso 3) es un modelo envolviendo su JSON en una cerca de código ```` ```json ```` por costumbre, incluso cuando se le dice que no lo haga.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`build_prompt(transcript)` devuelve una lista de dos dicts de mensaje (`system`, `user`), con el texto de la transcripción realmente incrustado en el mensaje de usuario.</StepChecklistItem>
<StepChecklistItem>Puedes señalar la oración exacta en `JSON_SCHEMA_DESCRIPTION` que le dice al modelo qué hacer cuando no se nombra ningún owner.</StepChecklistItem>
<StepChecklistItem>Podrías explicar, en una oración, por qué el esquema se escribe como un ejemplo JSON literal en lugar de una descripción en párrafo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si quitaras la regla "Solo incluye una decisión si el grupo realmente acordó algo -- no solo discutir una opción", ¿qué tipo de elementos crees que empezarían a filtrarse en `decisions` en una transcripción llena de debate de ida y vuelta?
- El prompt pide `owner: null` en lugar de omitir el campo por completo. ¿Por qué podría eso ser más fácil de manejar para tu código Python que un esquema donde un campo a veces está presente y a veces simplemente ausente?

## Paso 3: Llama al LLM y analiza la respuesta JSON

Ahora envía el prompt y convierte cualquier texto que vuelva en datos reales de Python — un `dict` sobre el que puedes iterar, no una cadena que tengas que inspeccionar con los ojos. Aquí es donde los proyectos de extracción estructurada se rompen más a menudo en la práctica: incluso un prompt bien diseñado ocasionalmente recibe una respuesta envuelta en una cerca de código, con un comentario final, o con una coma extraviada — y un `json.loads()` ingenuo se estrella con los tres.

```python
# summarize.py (part 1 -- LLM call + parsing)
"""Calls a free-tier LLM to extract a structured summary from a transcript,
then parses and validates the JSON it returns.

Run with: uv run python summarize.py transcripts/standup.txt
"""

import json
import os
import re
import sys

from dotenv import load_dotenv
from openai import OpenAI

from extract_prompt import build_prompt
from load_transcript import load_transcript

load_dotenv()

REQUIRED_KEYS = {"decisions", "action_items", "open_questions"}


def call_llm(transcript: str) -> str:
    """Sends the structured-extraction prompt and returns the model's raw text reply."""
    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=build_prompt(transcript),
        temperature=0,  # deterministic-as-possible extraction, not creative writing
    )
    return response.choices[0].message.content


def extract_json(raw_text: str) -> str:
    """Strips common wrapping the model adds around JSON despite being told not to.

    Handles the two most frequent offenders: a ```json ... ``` markdown fence,
    and leading/trailing prose sentences around an otherwise-valid object.
    """
    text = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fenced:
        return fenced.group(1).strip()
    # No fence -- fall back to grabbing everything between the first "{" and
    # the last "}", in case the model added a sentence before or after the object.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def parse_summary(raw_text: str) -> dict:
    """Parses and validates the model's response, raising a clear error if it
    doesn't match the schema after the best-effort cleanup in extract_json()."""
    cleaned = extract_json(raw_text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Model response wasn't valid JSON even after cleanup: {error}\n"
            f"Raw response was:\n{raw_text}"
        ) from error

    if not isinstance(data, dict) or not REQUIRED_KEYS.issubset(data.keys()):
        raise ValueError(f"Response is missing required keys {REQUIRED_KEYS}. Got: {data!r}")

    # Normalize: make sure each list field really is a list, even if the
    # model returned a single object instead of a one-item list somewhere.
    for key in ("decisions", "action_items", "open_questions"):
        if not isinstance(data[key], list):
            data[key] = [data[key]]

    return data


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    transcript = load_transcript(path)
    raw = call_llm(transcript)
    summary = parse_summary(raw)
    print(json.dumps(summary, indent=2))
```

```bash
uv run python summarize.py transcripts/standup.txt
```

:::tip[Nunca confíes a ciegas en la forma de la salida de un LLM]
Trata la respuesta de un modelo de lenguaje igual que tratarías datos de una API no confiable o un CSV subido por un usuario: valídalos antes de usarlos, no los asumas. `extract_json` maneja los problemas comunes de envoltura, y `parse_summary` aún levanta un error claro y específico — con el texto en bruto adjunto — si el resultado realmente no coincide con el esquema, en lugar de dejar que un `KeyError` tres funciones después te haga adivinar qué salió mal. Devolver silenciosamente un resumen vacío en un fallo de análisis sería peor que estrellarse: nunca notarías que la extracción dejó de funcionar silenciosamente.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python summarize.py transcripts/standup.txt` imprime JSON válido y legible con las tres claves requeridas.</StepChecklistItem>
<StepChecklistItem>Puedes explicar qué hace `extract_json` con una respuesta envuelta en ```` ```json ... ``` ````, versus una sin ninguna cerca.</StepChecklistItem>
<StepChecklistItem>Cambiar temporalmente `REQUIRED_KEYS` para incluir una clave que sabes que no está en el esquema y re-ejecutar produce tu propio `ValueError` claro, no un crash en otro lugar.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- El fallback de `extract_json` — tomar todo entre el primer `{` y el último `}` — se rompería en una transcripción que literalmente contenga llaves en el texto hablado de alguien (ej. citando un fragmento de código). ¿Puedes pensar en un enfoque más robusto, aunque sea más trabajo de implementar?
- ¿Por qué `parse_summary` levanta una excepción con la respuesta en bruto adjunta, en lugar de simplemente devolver `None` cuando el análisis falla?

## Paso 4: Formatea el resultado como Markdown legible

El `dict` analizado es exactamente lo que querrías para guardar en una base de datos o alimentar a otro script, pero no es algo que un compañero de equipo quiera leer en un mensaje de Slack. Conviértelo también en un resumen Markdown corto y escaneable — los mismos datos, formateados para un humano en lugar de un programa.

```python
# format_summary.py
"""Formats a parsed summary dict as readable Markdown.

Imported by summarize.py (Step 5) -- not meant to be run directly.
"""


def format_markdown(summary: dict, source: str) -> str:
    lines = [f"# Meeting Summary — {source}", ""]

    lines.append("## Decisions")
    if summary["decisions"]:
        lines += [f"- {d}" for d in summary["decisions"]]
    else:
        lines.append("_No decisions recorded._")
    lines.append("")

    lines.append("## Action Items")
    if summary["action_items"]:
        for item in summary["action_items"]:
            owner = item.get("owner") or "unassigned"
            lines.append(f"- [ ] {item['task']} — **{owner}**")
    else:
        lines.append("_No action items recorded._")
    lines.append("")

    lines.append("## Open Questions")
    if summary["open_questions"]:
        lines += [f"- {q}" for q in summary["open_questions"]]
    else:
        lines.append("_No open questions recorded._")

    return "\n".join(lines)
```

`item.get("owner") or "unassigned"` está haciendo doble trabajo: maneja tanto un `None` literal (lo que el prompt le pide al modelo usar cuando no se nombra ningún owner) y, defensivamente, una cadena vacía o la palabra `"null"` que algunos modelos más pequeños ocasionalmente producen a pesar de las instrucciones — de cualquier manera, el lector ve "unassigned" en lugar de un espacio en blanco o un `null` literal confuso.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`format_markdown(summary, "standup.txt")` devuelve una cadena que comienza con un encabezado `# Meeting Summary`.</StepChecklistItem>
<StepChecklistItem>Un elemento de acción sin owner nombrado se muestra como "unassigned", no un espacio en blanco o la palabra "None".</StepChecklistItem>
<StepChecklistItem>Pasar un resumen donde cada lista está vacía aún produce Markdown válido y legible (las líneas `_No ... recorded._`), no una sección vacía o rota.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Los elementos de acción se muestran como `- [ ] task` — sintaxis de casilla de verificación de Markdown con sabor a GitHub. ¿Dónde podría eso ser genuinamente útil versus puramente decorativo, dependiendo de dónde termine este archivo (un issue de GitHub, un mensaje de Slack, un archivo de texto plano)?
- ¿Por qué construir el Markdown a partir del `dict` *ya analizado*, en lugar de pedirle al LLM que genere Markdown directamente en el Paso 3 y omitir este paso?

## Paso 5: Ejecútalo de principio a fin

Conecta las piezas: carga una transcripción, llama al modelo, analiza y valida el JSON, y luego escribe tanto un archivo `.md` como un `.json` junto al input.

```python
# summarize.py (part 2 -- appended to part 1 above)

from pathlib import Path

from format_summary import format_markdown


def summarize(path: str) -> dict:
    """Runs the full pipeline for one transcript and writes both output files."""
    transcript = load_transcript(path)
    raw = call_llm(transcript)
    summary = parse_summary(raw)

    stem = Path(path).stem
    Path(f"{stem}_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    Path(f"{stem}_summary.md").write_text(format_markdown(summary, source=path), encoding="utf-8")

    return summary


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    summary = summarize(path)
    print(format_markdown(summary, source=path))
    print(f"\n(also wrote {Path(path).stem}_summary.json and {Path(path).stem}_summary.md)")
```

```bash
uv run python summarize.py transcripts/standup.txt
uv run python summarize.py transcripts/product_planning.txt
uv run python summarize.py transcripts/incident_review.txt
```

Ejecútalo sobre las tres transcripciones de muestra (o la versión más completa de [`examples/meeting-notes-summarizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer) del repositorio, que viene con las tres listas) y compara las salidas: una reunión de pie, una reunión de planificación y una revisión de incidente cada una estresa el esquema de manera diferente — la revisión de incidente, por ejemplo, tiende a producir mucho más preguntas abiertas que elementos de acción.

:::tip[Los límites de tasa son esperados, no un error]
Cada nivel gratuito limita las solicitudes por minuto o por día, y cada llamada a `summarize()` es exactamente una llamada API — así que ejecutar esto sobre varias transcripciones seguidas ocasionalmente puede chocar con un error `429`. Eso es el proveedor diciéndote que vayas más lento, no una señal de que algo esté roto; espera el número de segundos sugerido y vuelve a ejecutar. Consulta el proyecto [AI Agent](/docs/projects/ai-agent#manejar-límites-de-tasa) para ver un patrón de `try`/`except`-con-reintento que puedes copiar directamente si quieres que esto se recupere automáticamente.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python summarize.py transcripts/standup.txt` imprime un resumen Markdown legible y reporta escribir dos archivos de salida.</StepChecklistItem>
<StepChecklistItem>Tanto `standup_summary.json` como `standup_summary.md` existen después, y el archivo JSON es válido (ábrelo, o re-analízalo con `json.load`).</StepChecklistItem>
<StepChecklistItem>Ejecutarlo sobre una segunda transcripción diferente produce un resumen que realmente refleja el contenido de *esa* transcripción — no una copia de la salida de la primera.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si un compañero te pasara una transcripción sin decisiones claras en absoluto — solo lluvia de ideas abierta — ¿qué esperarías que pareciera `decisions`, y la redacción de tu prompt realmente garantiza eso?
- ¿Qué se rompería si ejecutaras esto sobre una transcripción de dos horas y 15,000 palabras en lugar de estas muestras cortas? ¿En qué punto necesitarías una estrategia como el enfoque de fragmentación del proyecto [RAG](/docs/projects/rag-notes) en lugar de enviar todo en un solo prompt?

## ⚠️ Errores comunes

- **El modelo envuelve su JSON en una cerca de código markdown de todos modos**, incluso cuando se le dice explícitamente que no — especialmente en modelos más pequeños/de nivel gratuito. `extract_json` en el Paso 3 lo elimina automáticamente; no lo omitas y llames a `json.loads()` directamente sobre la respuesta en bruto.
- **`owner` vuelve como la cadena `"null"`, `"TBD"` o `"N/A"`** en lugar de un `null`/`None` real. `item.get("owner") or "unassigned"` de `format_markdown` atrapa los casos falsy, pero una cadena literal como `"TBD"` se colará tal cual — vale la pena normalizarla explícitamente (ej. `if owner in ("null", "TBD", "N/A", ""): owner = None`) si lo ves ocurrir a menudo con tu proveedor elegido.
- **Olvidar `temperature=0`.** Las tareas de extracción quieren que la misma transcripción produzca un resumen consistente y repetible — no variación creativa entre ejecuciones. Dejar el predeterminado (a menudo `~1.0`) hace que los resultados sean notablemente menos estables de ejecución en ejecución, lo que dificulta depurar tu prompt porque no puedes saber si un cambio en la salida vino de tu edición del prompt o solo de la aleatoriedad.
- **Límites de tasa en el nivel gratuito del LLM.** Cada llamada a `summarize()` cuesta una solicitud contra la cuota de tu proveedor; ejecutarlo sobre muchas transcripciones rápidamente puede disparar un 429. Consulta el consejo de arriba.

## Lo que acabas de construir

Un pipeline de extracción estructurada pequeño y completo: carga texto en bruto, diseña un prompt que fija un esquema de salida exacto, llama a un LLM de nivel gratuito, analiza y valida defensivamente lo que vuelve, y renderiza el resultado tanto para máquinas (JSON) como para humanos (Markdown). Esto no es una simplificación de juguete — exactamente la misma forma (prompt restringido por esquema → analizar → validar → degradarse con gracia) es como los sistemas de producción extraen datos estructurados de currículos, facturas, tickets de soporte y contratos. Cambia el esquema y el prompt, y este pipeline todavía funciona.

## A dónde ir desde aquí

- Extiende el esquema con un campo `sentiment` o `meeting_type`, o una `priority` en cada elemento de acción — el patrón (describe el campo en el prompt, valídalo después del análisis) es idéntico al que ya construiste.
- Prueba alimentar al modelo una transcripción en un formato completamente diferente (una exportación de chat, un archivo de subtítulos cerrados `.vtt` en bruto) y observa cuánta limpieza necesita `load_transcript` antes de que los resultados sigan siendo buenos.
- Investiga una biblioteca de validación de esquemas como `pydantic` para una versión mucho más estricta de `parse_summary` — en lugar de verificar las claves a mano, define un modelo `Summary` una vez y deja que valide (e incluso fuerce) los tipos por ti, levantando un error estructurado sobre cualquier cosa que no encaje.
- Combina esto con el proyecto [AI Agent](/docs/projects/ai-agent): dale al agente una herramienta que llame a `summarize()` sobre un archivo de transcripción, para que pueda decidir *cuándo* resumir como parte de una tarea más grande en lugar de que siempre ejecutes el script a mano.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="meeting-notes-summarizer" />
