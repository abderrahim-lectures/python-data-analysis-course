---
id: voice-to-task-agent
title: "Construye un Agente de Voz a Tarea"
sidebar_label: "Agente de Voz a Tarea"
slug: /projects/voice-to-task-agent
description: "Pasa del playground en el navegador al Python real: transcribe una nota de voz localmente y gratis con el modelo de código abierto Whisper de OpenAI, y luego usa un LLM de nivel gratuito para convertirla en una lista de tareas estructurada."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Agente de Voz a Tarea

<ProjectPublishedDate projectId="voice-to-task-agent" />

<ProjectGreeting />

Todo en el curso hasta ahora corrió en un playground aislado dentro del navegador — así que pudiste empezar a escribir Python desde el día uno con cero configuración. Este proyecto es el paso de graduación: instala Python de verdad en tu propia máquina, y luego úsalo para construir algo genuinamente útil — un pequeño pipeline que toma una nota de voz divagante y la convierte en una lista de tareas corta y estructurada, sin que tengas que escribir u organizar nada de eso a mano. Esto asume Python 101; no se requiere nada de Análisis de Datos.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Transcribir una nota de voz corta a texto, completamente local y gratis, usando el modelo *open-source* Whisper de OpenAI (`openai-whisper`, ejecutándose en tu propio CPU) — no la API de Whisper de pago.
2. Escribir un prompt que pida a un LLM de nivel gratuito leer esa transcripción y extraer elementos de acción estructurados: una tarea, una fecha límite opcional, una prioridad opcional.
3. Ejecutar todo el pipeline de principio a fin en una grabación de muestra provista (o la tuya), y guardar el resultado como una lista de tareas simple.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — la transcripción es trabajo de CPU (no se necesita GPU para un clip corto con un modelo Whisper pequeño), así que corre cómodamente en un portátil normal. La configuración de abajo explica cómo instalar `uv`.

**GitHub Codespaces** también funciona: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados) y ejecuta los mismos comandos `uv` exactos desde una terminal en tu pestaña del navegador. Es un poco más lento que un portátil moderno para el paso de transcripción, ya que las máquinas de Codespaces son solo CPU, pero perfectamente funcional para los clips de muestra cortos de aquí.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-to-task-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-to-task-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fvoice-to-task-agent%2Fnotebook.ipynb)

**Google Colab es un ajuste notablemente bueno para este** — mejor que para la mayoría de los otros proyectos de esta serie. La velocidad de transcripción de Whisper escala mucho con el hardware, y Colab te da una GPU gratuita que un portátil local solo-CPU no tiene: `!pip install openai-whisper` en una celda, luego un runtime con GPU, y hasta los tamaños de modelo Whisper más grandes (más precisos, normalmente demasiado lentos para considerar en una CPU) se vuelven prácticos. Si quieres experimentar con el tamaño del modelo vs. precisión (ver el tip en el Paso 1), Colab es dónde hacerlo. Las insignias de arriba abren un [`notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-to-task-agent/notebook.ipynb) listo que ejecuta todo el pipeline con cero configuración local — el mismo pipeline de dos pasos, el mismo audio de muestra, solo que en un notebook alojado en lugar de una terminal.

## Configuración

Todo lo necesario antes de que escribas cualquier código de pipeline — instalar `uv`, crear el proyecto, y obtener una clave de API de LLM — vive aquí, una vez, por adelantado. La construcción real comienza en el Paso 1, asumiendo que todo esto ya está en su lugar.

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

### Configurar el proyecto

```bash
uv init voice-to-task-agent
cd voice-to-task-agent
uv add openai-whisper openai python-dotenv
```

`openai-whisper` es el modelo de código abierto de voz a texto en sí — a pesar del nombre del paquete, esto se instala y corre *localmente*, sin clave de API y sin costo por minuto; solo pasa que está publicado por OpenAI y comparte nombre con su API alojada, de pago, separada. `openai` es el cliente de API simple usado en el Paso 2 para llamar al proveedor de LLM de nivel gratuito que elijas — varios de ellos exponen un endpoint compatible con OpenAI, así que una sola biblioteca de cliente cubre los seis. `python-dotenv` te permite mantener tu clave de API de LLM en un archivo `.env` local en lugar de `export`-arla en cada sesión.

:::tip[La primera ejecución descarga el modelo]
`openai-whisper` no incluye los pesos de su modelo — la primera vez que tu código llame a `whisper.load_model(...)` (Paso 1), descarga los pesos a `~/.cache/whisper` (unos 140MB para el tamaño `"base"` usado en este proyecto) y los reutiliza en cada ejecución posterior. La primera transcripción se sentirá lenta; eso es la descarga, no la transcripción en sí.
:::

### Obtener una clave de API de LLM gratuita

**Elige el proveedor que prefieras** — ninguno requiere una tarjeta de crédito al momento de escribir esto, y este curso no favorece uno sobre otro. El ejemplo en el repositorio del curso ([`examples/voice-to-task-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent)) soporta los seis listos para usar, seleccionados con una sola configuración.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(sugerido por defecto)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el alcance `models: read` | Sin registro separado — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que los de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada; usada en borradores anteriores de esta página. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen de tokens diario, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Elijas el que elijas, el proceso es el mismo:

1. Inicia sesión y genera una clave de API en el sitio de ese proveedor.
2. **Nunca pegues esta clave directamente en el código ni la confirmes en un repositorio.** Crea un archivo `.env` en tu carpeta de proyecto en su lugar (nunca lo confirmes):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

Una clave de API es un secreto, exactamente como una contraseña — cualquiera con ella puede usar la cuota de tu cuenta. Tratarla como una variable de entorno en lugar de una cadena hardcodeada es la práctica estándar por exactamente esta razón, y es el mismo hábito construido en el [proyecto AI Agent](/docs/projects/ai-agent) si has hecho ese.

:::tip[Un archivo .env a menudo es más conveniente que export]
En lugar de `export`-ar una clave en cada sesión de terminal nueva, un archivo `.env` en tu carpeta de proyecto, cargado automáticamente con `python-dotenv`, persiste entre sesiones sin que tengas que recordarlo. Consulta el `.env.example` del ejemplo en el repositorio para la lista completa de nombres de variables, uno por proveedor.
:::

Con la configuración hecha, todo lo de abajo asume: `uv` está instalado, tu proyecto tiene `openai-whisper`, `openai`, y `python-dotenv`, y `.env` tiene una clave real para el proveedor que elegiste.

## Paso 1: Transcribe una nota de voz de muestra localmente

No necesitas un micrófono o una grabación real para empezar — el repositorio del curso incluye tres clips de muestra de notas de voz cortos en [`examples/voice-to-task-agent/sample_audio/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent/sample_audio). Toma uno (o graba el tuyo con cualquier app de notas de voz de teléfono/portátil y cópialo en tu proyecto — `.wav` y `.mp3` funcionan ambos).

Crea `voice_to_tasks.py`:

```python
# voice_to_tasks.py
import sys

import whisper

WHISPER_MODEL_SIZE = "base"  # tiny / base / small / medium / large -- see the tip below

_whisper_model = None  # loaded lazily so importing this module doesn't load it


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper '{WHISPER_MODEL_SIZE}' model...")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
    return _whisper_model


def transcribe(audio_path: str) -> str:
    """Transcribes an audio file to plain text, entirely locally."""
    model = get_whisper_model()
    result = model.transcribe(audio_path)
    return result["text"].strip()


if __name__ == "__main__":
    audio_path = sys.argv[1] if len(sys.argv) > 1 else "sample_audio/memo_1_work_followups.wav"
    print(transcribe(audio_path))
```

```bash
uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav
```

`whisper.load_model("base")` carga una red neuronal entrenada en una gran cantidad de datos de habla multilingüe; `model.transcribe(audio_path)` lo ejecuta en tu archivo de audio y devuelve un dict cuya clave `"text"` es la transcripción completa — Whisper maneja la decodificación de audio en sí (vía `ffmpeg` bajo el capó) y funciona en `.wav`, `.mp3`, y la mayoría de los otros formatos comunes sin que tengas que convertir nada a mano primero.

:::tip[El tamaño del modelo es una compensación velocidad/precisión]
Whisper viene en cinco tamaños — `tiny`, `base`, `small`, `medium`, `large` — cada uno más preciso y más lento que el anterior. `"base"` es un valor por defecto razonable en un CPU de portátil para habla inglesa corta y clara como los clips de muestra; audio ruidoso, acentos que el modelo maneja peor, o habla no inglesa a menudo se benefician de `"small"` o `"medium"`, al costo de un tiempo de transcripción notablemente más largo. Este es exactamente el tipo de compensación que vale la pena probar con una GPU — ver "Dónde ejecutar esto" arriba para saber por qué Colab es un buen ajuste aquí específicamente.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav` imprime una transcripción real, no un traceback.</StepChecklistItem>
<StepChecklistItem>El texto impreso coincide aproximadamente con lo que la nota de muestra realmente dice — Whisper no será perfecto, pero debería ser claramente reconocible.</StepChecklistItem>
<StepChecklistItem>Ejecutarlo de nuevo es notablemente más rápido que la primera vez (los pesos del modelo ahora están cacheados localmente, no re-descargados).</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `transcribe()` nunca envía tu audio a ningún lugar por la red. ¿Qué significa eso para usar esto en una nota de voz genuinamente privada, comparado con una API de transcripción alojada en la nube?
- Si ejecutaras esto en una nota con música de fondo sonando, o dos personas hablando a la vez, ¿qué esperarías que pasara con la calidad de la transcripción? Pruébalo en tu propia grabación si tienes una que encaje.

## Paso 2: Extrae elementos de acción estructurados con un LLM gratuito

Una transcripción es solo un muro de texto — útil, pero aún no una lista de tareas. Este paso le entrega la transcripción a un LLM de nivel gratuito con un prompt pidiéndole que la lea y devuelva datos estructurados reales: una entrada por elemento de acción, cada una con una descripción de tarea y, donde la transcripción los implica, una fecha límite y una prioridad.

Añade la llamada al LLM a `voice_to_tasks.py`:

```python
# voice_to_tasks.py (additions)
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# All six free-tier providers from the table above happen to expose an
# OpenAI-compatible chat completions endpoint, so one client class covers
# all of them -- only base_url and model change.
PROVIDERS = {
    "github": {"env": "GITHUB_TOKEN", "base_url": "https://models.github.ai/inference", "model": "gpt-4o-mini"},
    "gemini": {"env": "GOOGLE_API_KEY", "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/", "model": "gemini-3.5-flash"},
    "groq": {"env": "GROQ_API_KEY", "base_url": "https://api.groq.com/openai/v1", "model": "llama-3.3-70b-versatile"},
    "mistral": {"env": "MISTRAL_API_KEY", "base_url": "https://api.mistral.ai/v1", "model": "mistral-small-latest"},
    "cerebras": {"env": "CEREBRAS_API_KEY", "base_url": "https://api.cerebras.ai/v1", "model": "llama-3.3-70b"},
    "openrouter": {"env": "OPENROUTER_API_KEY", "base_url": "https://openrouter.ai/api/v1", "model": "meta-llama/llama-3.3-70b-instruct:free"},
}

EXTRACTION_PROMPT = """You extract action items from a voice memo transcript.

Return a JSON object shaped exactly like this, with no other text before or
after it, and no markdown code fences:

{{"tasks": [{{"task": "...", "due_date": "...", "priority": "..."}}]}}

Rules:
- "task" is a short, clear action (e.g. "Email the client the revised
  proposal"), not a raw quote from the transcript.
- "due_date" is null if the transcript doesn't mention one -- do not invent
  a specific date that was never said.
- "priority" is "high", "medium", or "low" only if the transcript implies
  one; otherwise null.
- If there are no action items at all, return {{"tasks": []}}.

Transcript:
\"\"\"
{transcript}
\"\"\"
"""


def extract_action_items(transcript: str, provider: str | None = None) -> list[dict]:
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    config = PROVIDERS[provider]
    client = OpenAI(api_key=os.environ[config["env"]], base_url=config["base_url"])

    response = client.chat.completions.create(
        model=config["model"],
        messages=[{"role": "user", "content": EXTRACTION_PROMPT.format(transcript=transcript)}],
    )
    return json.loads(response.choices[0].message.content)["tasks"]
```

```bash
uv run python -c "
from voice_to_tasks import transcribe, extract_action_items
transcript = transcribe('sample_audio/memo_1_work_followups.wav')
print(extract_action_items(transcript))
"
```

El prompt es el que hace el trabajo real aquí: le dice al modelo exactamente qué forma devolver (un objeto JSON con una lista `"tasks"`, no prosa de forma libre), y da reglas explícitas para las partes difíciles — no inventes una fecha límite que nunca se dijo, no adivines una prioridad que no está realmente implicada. Esta es la misma idea que el prompt del [proyecto RAG](/docs/projects/rag-notes) diciéndole al modelo responder *solo* del contexto recuperado: una instrucción clara y específica estrecha lo que el modelo hace, en lugar de esperar que infiera la forma correcta por su cuenta.

`json.loads(...)["tasks"]` asume que el modelo siguió la instrucción y devolvió JSON limpio — los modelos de nivel gratuito ocasionalmente no lo hacen (una oración suelta antes del JSON, un fence de markdown alrededor a pesar de que se le dijo que no). La versión más completa en [`examples/voice-to-task-agent/voice_to_tasks.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent) elimina un fence de código si aparece y lanza un error claro en lugar de un traceback confuso si el JSON aún no se puede parsear — vale la pena copiarla si planeas ejecutarlo en más de un par de notas.

:::tip[¿Usando un proveedor diferente?]
Todo lo de arriba ya funciona para los seis proveedores de la tabla — solo configura `LLM_PROVIDER` en tu `.env` (o pasa un nombre de proveedor directamente a `extract_action_items`). Esto funciona porque GitHub Models, Gemini, Groq, Mistral, Cerebras, y OpenRouter todos exponen un endpoint compatible con OpenAI; a diferencia del [proyecto AI Agent](/docs/projects/ai-agent), no necesitas una biblioteca de cliente diferente por proveedor aquí, ya que este script no usa LangChain.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`extract_action_items(transcript)` devuelve una lista de dicts de Python, no un error.</StepChecklistItem>
<StepChecklistItem>Cada dict tiene las claves `"task"`, `"due_date"`, y `"priority"` — incluso cuando un valor es `None`.</StepChecklistItem>
<StepChecklistItem>Ejecutarlo en `memo_1_work_followups.wav` encuentra aproximadamente tres tareas separadas, coincidiendo con los tres seguimientos mencionados en esa nota.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- El prompt dice explícitamente "no inventes una fecha específica que nunca se dijo." ¿Qué esperarías que pasara si quitaras esa instrucción y la transcripción dijera "en algún momento de la próxima semana"? Pruébalo — ¿añade el modelo una fecha de calendario real de todos modos?
- Si la transcripción menciona la misma tarea dos veces, formulada de manera ligeramente diferente cada vez (la gente hace esto cuando piensa en voz alta), ¿esperarías una tarea en la salida o dos? ¿Qué sugiere tu respuesta sobre una limitación de pedirle a un modelo que haga esto en una sola pasada, sin paso de deduplicación propio?

## Paso 3: Ejecútalo de principio a fin y guarda una lista de tareas

Junta las dos piezas en un script que transcribe, extrae, imprime una lista legible, y la guarda como JSON:

```python
# voice_to_tasks.py (additions)
def print_tasks(tasks: list[dict]) -> None:
    if not tasks:
        print("No action items found in this memo.")
        return
    markers = {"high": "\U0001f534", "medium": "\U0001f7e1", "low": "\U0001f7e2"}
    for item in tasks:
        marker = markers.get((item.get("priority") or "").lower(), "⚪")
        due = f" (due: {item['due_date']})" if item.get("due_date") else ""
        print(f"{marker} {item['task']}{due}")


def main() -> None:
    audio_path = sys.argv[1] if len(sys.argv) > 1 else "sample_audio/memo_1_work_followups.wav"

    print(f"Transcribing {audio_path} ...")
    transcript = transcribe(audio_path)
    print("\n--- Transcript ---")
    print(transcript)

    print("\nExtracting action items...")
    tasks = extract_action_items(transcript)

    print("\n--- Action items ---")
    print_tasks(tasks)

    with open("tasks.json", "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {len(tasks)} task(s) to tasks.json")


if __name__ == "__main__":
    main()
```

```bash
uv run python voice_to_tasks.py sample_audio/memo_3_project_planning.mp3
```

Prueba los tres clips de muestra, y — si tienes forma de grabar uno — tu propia nota de voz también. Una lista corta de compras, un conjunto de seguimientos de reunión, o una lista de tareas del hogar son todas buenas pruebas: cualquier cosa con un puñado de elementos de acción distintos de longitud de oración, hablados como realmente te hablarías a ti mismo, no una lista formalmente estructurada.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python voice_to_tasks.py` (con cualquiera de los tres clips de muestra) imprime una transcripción, luego una lista de tareas con marcado, luego una línea "Saved N task(s)".</StepChecklistItem>
<StepChecklistItem>Un archivo `tasks.json` ahora existe en tu carpeta de proyecto, y su contenido coincide con lo que se imprimió.</StepChecklistItem>
<StepChecklistItem>Ejecutarlo en una nota sin elementos de acción reales (prueba solo describir tu día) imprime "No action items found" en lugar de inventar unos falsos.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `tasks.json` se sobreescribe a sí mismo en cada ejecución, sin combinar una lista vieja y una nueva. ¿Qué necesitarías añadir para hacer esto una lista de tareas continua genuinamente útil a través de múltiples notas, grabadas en días diferentes?
- Este pipeline tiene dos puntos de falla que se comportan muy diferente: Whisper escuchando mal una palabra, y el LLM leyendo mal una oración correctamente transcrita. Si una tarea sale mal, ¿cómo distinguirías cuál de las dos etapas realmente la causó?

## ⚠️ Errores comunes

- **Confundir Whisper de código abierto con la API de Whisper de pago.** `openai-whisper` (este proyecto) corre completamente en tu propia máquina, gratis, sin clave de API — no es lo mismo que `client.audio.transcriptions.create(...)`, el endpoint de transcripción *alojado* y de pago de OpenAI. Ambos se llaman "Whisper" y ambos vienen de OpenAI, que es exactamente por qué vale la pena ser explícito sobre cuál está usando un código dado.
- **Una primera ejecución muy larga, confundida con un cuelgue.** La primera llamada a `whisper.load_model(...)` descarga los pesos del modelo (ver el tip de Configuración) — en una conexión lenta esto puede tardar un buen rato sin barra de progreso en versiones más antiguas. Déjala terminar una vez; cada ejecución después es rápida.
- **La respuesta JSON del LLM no es JSON válido.** Los modelos de nivel gratuito ocasionalmente envuelven su respuesta en un fence de código markdown, o añaden una oración suelta, a pesar de una instrucción explícita de no hacerlo. Trata el fallo de `json.loads(...)` aquí como una ocurrencia esperada y ocasional — no una señal de que tu prompt está fundamentalmente roto — y mira el `_parse_tasks_response` del ejemplo más completo para una solución de eliminación de fence.
- **Límites de tasa en el nivel gratuito del LLM.** La transcripción (Paso 1) es local e ilimitada; solo la llamada de extracción del Paso 2 cuenta contra la cuota de nivel gratuito de tu proveedor. Un error 429 ahí es el proveedor diciéndote que bajes la velocidad, no un bug — ver el [proyecto AI Agent](/docs/projects/ai-agent#manejar-límites-de-tasa) para el mismo patrón y un enfoque de reintento que puedes copiar.

## Lo que acabas de construir

Un pipeline pequeño pero completo que conecta dos tipos genuinamente diferentes de modelo de IA: un modelo de voz a texto local, gratuito y de pesos abiertos haciendo la escucha, y un modelo de lenguaje alojado de nivel gratuito haciendo la lectura-y-estructuración. Nada aquí fue falso — intercambia una grabación real más larga y desordenada, y los mismos dos pasos (transcribe, luego extrae) siguen siendo todo el pipeline. Esto es también un pequeño ejemplo concreto de un patrón más amplio que vale la pena notar: no toda tarea de IA necesita un modelo alojado gigante. Whisper es lo suficientemente pequeño para correr localmente gratis; solo la parte del trabajo que realmente se beneficia del razonamiento de un modelo de lenguaje grande — convertir lenguaje hablado suelto en datos estructurados limpios — recurre a uno.

:::tip[Ejecuta una versión más completa sin configuración local para el código]
[`examples/voice-to-task-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent) en el repositorio del curso es una versión un poco más completa del código de arriba — el mismo pipeline de dos pasos, más la solución de eliminación de fence mencionada arriba y mensajes de error más claros. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo contra cualquiera de los tres clips de muestra en `sample_audio/`.
:::

## A dónde ir desde aquí

- Prueba un tamaño de modelo Whisper más grande (`"small"` o `"medium"`) en una grabación más larga y desordenada — ruido de fondo, varios hablantes, o una nota no inglesa — y mira dónde `"base"` empieza a quedarse corto. Esta es una gran excusa para probar el camino de GPU de Colab de "Dónde ejecutar esto" arriba.
- Agrupa las tareas extraídas por prioridad, o ordénalas por cómo el modelo reporta las fechas límite, en lugar de imprimirlas en orden de transcripción.
- Haz `tasks.json` acumulativo: carga el archivo existente (si hay), agrega las tareas recién extraídas en lugar de sobreescribir, y deduplica cualquier cosa que parezca la misma tarea dicha dos veces.
- Conecta esto a algo que realmente consuma la lista de tareas — agregando a la API de una app de tareas real, un calendario, o incluso solo un archivo Markdown de lista de verificación en ejecución — en lugar de un archivo JSON que nada más lee todavía.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="voice-to-task-agent" />
