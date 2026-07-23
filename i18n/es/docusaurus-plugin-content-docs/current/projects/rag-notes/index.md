---
id: rag-notes
title: "Construye una App RAG Sobre Tus Propias Notas"
sidebar_label: "Construye una App RAG"
slug: /projects/rag-notes
description: "Gradúate del playground en el navegador a Python de verdad: construye una app de generación aumentada por recuperación que te permita chatear con tus propias notas, con embeddings locales y un LLM de nivel gratuito."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye una App RAG Sobre Tus Propias Notas

<ProjectPublishedDate projectId="rag-notes" />

<ProjectGreeting />

Todo en el curso hasta ahora se ejecutó en un playground aislado dentro del navegador — para que pudieras empezar a escribir Python desde el primer día sin ninguna configuración. Este proyecto es el paso de graduación: instala Python de verdad en tu propia máquina, y luego úsalo para construir una herramienta que quizás sigas usando de verdad — una app que responde preguntas sobre una carpeta de tus propias notas, buscando primero en ellas y solo después pidiéndole a un modelo de lenguaje que responda usando lo que encontró. Esto asume Python 101; nada de Data Analysis es necesario, aunque ayuda si los arrays de `numpy` ya te resultan familiares.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para ver la lista completa, que sigue creciendo.

## 🎯 Qué harás

1. Instalar `uv`, una herramienta rápida y moderna para gestionar el propio Python y las dependencias de tu proyecto.
2. Tomar una carpeta de tus propias notas `.md`/`.txt` y dividirlas en fragmentos pequeños y buscables.
3. Convertir cada fragmento en un vector — una lista de números que captura su significado — enteramente en local, sin clave de API y sin costo, usando `sentence-transformers`.
4. Escribir una pequeña función de búsqueda local que encuentre los fragmentos más relevantes para una pregunta, usando solo `numpy`.
5. Obtener una clave de API de LLM de nivel gratuito y escribir un script que recupere fragmentos relevantes, y luego le pida al modelo que responda *usando solo ese contexto*.

## Dónde ejecutar esto

**En local con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado — es Python real corriendo en tu propia máquina, el mismo movimiento de "graduarse a Python real" que cada otro proyecto de esta sección. El Paso 1 de abajo te guía por la instalación.

**GitHub Codespaces** es una alternativa sin configuración si prefieres no instalar nada en local todavía: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta exactamente los mismos comandos de `uv` desde una terminal en tu pestaña del navegador.

**Google Colab o Kaggle Notebooks** también funcionan, ya que este proyecto — a diferencia del de ajuste fino — no necesita GPU: crea un notebook nuevo, ejecuta `!pip install sentence-transformers numpy` en una celda, y luego pega los scripts de abajo como celdas del notebook, adaptando las rutas de archivo según sea necesario. Sé honesto contigo mismo sobre la contrapartida, eso sí: esta es una forma de menor fidelidad de vivir el proyecto que un proyecto real local con `uv` — sin archivos separados, sin estructura de proyecto real, solo celdas en un notebook. Trátalo como una forma rápida de experimentar, no como el camino principal.

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

Luego configura un proyecto:

```bash
uv init rag-notes
cd rag-notes
uv add sentence-transformers numpy python-dotenv
```

`sentence-transformers` es la biblioteca que convierte texto en vectores en local, en tu propia CPU — sin llamada de API, sin clave. `numpy` hace el cálculo real para comparar vectores. `python-dotenv` te permite mantener tu clave de API del LLM (Paso 5) en un archivo `.env` local.

## Paso 2: Prepara tus notas

Pon tus notas en una carpeta `notes/` como archivos `.md` o `.txt` simples — apuntes de clase, un diario, documentación que hayas escrito, lo que sea. La app que estás construyendo solo responde a partir de lo que realmente está en estos archivos.

No puedes entregarle un archivo completo a un modelo de embeddings y esperar un resultado de búsqueda útil. Dos razones:

- **Los modelos de embeddings tienen un límite de contexto.** `all-MiniLM-L6-v2`, el modelo que usa este proyecto, trunca la entrada más allá de 256 fragmentos de palabra — dale un archivo de 2.000 palabras y todo lo que pase el límite se ignora silenciosamente.
- **El vector de un fragmento grande es un promedio borroso.** Si una nota cubre cinco subtemas distintos, su único vector de embedding termina en algún punto intermedio entre los cinco — cerca de ninguno de ellos con precisión. Busca una pregunta sobre solo uno de esos subtemas, y ese vector podría no rankear alto aunque la respuesta esté justo ahí en el texto. Los fragmentos más pequeños y enfocados obtienen cada uno un vector más nítido y específico, así que la recuperación encuentra el pasaje *realmente* relevante en lugar de un archivo entero que solo es parcialmente relevante.

Divide cada archivo en fragmentos por párrafo, y luego vuelve a fusionar los párrafos diminutos hasta un tamaño objetivo, para que no termines con docenas de fragmentos de una sola línea:

```python
# prepare_notes.py
"""Splits every .md/.txt file in notes/ into a list of text chunks.

Run with: uv run python prepare_notes.py

This only prints a summary -- build_index.py (Step 3) imports load_chunks()
from this file and does the actual embedding.
"""

from pathlib import Path

NOTES_DIR = Path("notes")
TARGET_CHUNK_SIZE = 500  # characters -- small enough to stay focused,
                         # large enough to hold a full thought


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size characters,
    so a chunk isn't just one short line with barely any context in it."""
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
    """Returns a list of {"text": ..., "source": ...} dicts, one per chunk,
    across every .md/.txt file in NOTES_DIR."""
    chunks = []
    for path in sorted(NOTES_DIR.glob("*.md")) + sorted(NOTES_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        paragraphs = split_into_paragraphs(text)
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": path.name})
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {NOTES_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']}] {preview}...")
```

```bash
uv run python prepare_notes.py
```

:::tip[El tamaño del fragmento es una contrapartida, no una regla fija]
Los fragmentos más pequeños recuperan con más precisión (una pregunta coincide con un trozo de texto estrecho y específico) pero pierden el contexto que los rodea (el modelo ve un fragmento aislado, no el párrafo que lo rodea). Los fragmentos más grandes conservan más contexto pero recuperan con menos precisión, por la misma razón que un archivo entero, solo que de forma menos severa. 500 caracteres es un punto de partida razonable para notas en prosa — no hay un número universalmente correcto, y vale la pena probar algunos tamaños distintos en tus propias notas para ver cuál recupera mejor.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python prepare_notes.py` se ejecuta sin errores e imprime un conteo de fragmentos distinto de cero.</StepChecklistItem>
<StepChecklistItem>Las vistas previas impresas parecen fragmentos reales de tus notas, no strings vacíos ni enormes bloques de texto fusionado.</StepChecklistItem>
<StepChecklistItem>`NOTES_DIR` apunta a una carpeta que realmente contiene archivos `.md`/`.txt`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si divides por líneas en blanco pero uno de tus archivos de notas no tiene ninguna línea en blanco (solo un párrafo gigante), ¿qué devolvería `split_into_paragraphs`, y qué le haría eso a la recuperación más adelante?
- ¿Qué le pasaría a la calidad de la recuperación si hicieras `TARGET_CHUNK_SIZE` mucho más grande — digamos, 5.000 caracteres? ¿Mucho más pequeño, como 50? ¿Por qué?

## Paso 3: Genera embeddings de tus notas en local

Un **embedding** es una lista de números — un vector — que representa el *significado* de un fragmento de texto, no su redacción exacta. `all-MiniLM-L6-v2` mapea cada fragmento a un punto en un espacio de 384 dimensiones, y está entrenado para que los fragmentos con significado similar terminen cerca entre sí en ese espacio, mientras que los fragmentos no relacionados terminen lejos. Ya tienes la intuición central para esto: es la misma idea que graficar datos numéricos en ejes, solo que con 384 ejes en lugar de 2, y "cerca entre sí" medido de la misma forma en que medirías distancia en cualquier espacio de números.

Este modelo es pequeño (unos 80MB), corre enteramente en tu CPU en aproximadamente un segundo por fragmento en una laptop típica, no necesita clave de API, y no cuesta nada — a diferencia del LLM del Paso 5, generar embeddings es totalmente local.

```python
# build_index.py
"""Embeds every chunk from prepare_notes.py and saves the vectors + text
locally, so retrieve() (Step 4) doesn't need to re-embed anything at query time.

Run with: uv run python build_index.py
Re-run this any time you add or edit files in notes/ -- the saved index
doesn't update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_notes import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .md/.txt files to notes/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py
```

Esto evita deliberadamente una base de datos vectorial — para una carpeta personal de notas (cientos o pocos miles de fragmentos, no millones), un simple array de NumPy que cabe cómodamente en memoria es más simple, no tiene ningún servicio adicional que instalar o ejecutar, y es totalmente transparente: `index.npy` es una matriz, `chunks.json` es el texto del que proviene, nada más.

`normalize_embeddings=True` escala cada vector a longitud 1 — vale la pena hacerlo ahora en lugar de en el momento de la consulta, ya que es lo que hace que la similitud de coseno del Paso 4 se reduzca a un simple producto punto.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py` se completó sin errores.</StepChecklistItem>
<StepChecklistItem>Ahora existen un archivo `index.npy` y un archivo `chunks.json` en la carpeta de tu proyecto.</StepChecklistItem>
<StepChecklistItem>El primer número de la forma (shape) impresa coincide con el conteo de fragmentos del Paso 2, y el segundo número es 384.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Dos fragmentos usan la palabra "Python" en sentidos completamente distintos — uno sobre el lenguaje de programación, otro sobre una serpiente. ¿Esperas que sus vectores de embedding terminen cerca entre sí o lejos? ¿Qué te dice eso sobre lo que realmente está capturando el modelo de embeddings?
- ¿Por qué guardar los embeddings en un archivo, en lugar de simplemente volver a generar embeddings de todas tus notas cada vez que haces una pregunta?

## Paso 4: Recupera fragmentos relevantes

Para encontrar qué fragmentos son relevantes a una pregunta, genera el embedding de la pregunta con el *mismo* modelo, y luego ordena cada fragmento según qué tan cerca esté su vector del vector de la pregunta. La forma estándar de medir "cercanía" para embeddings es la **similitud de coseno** — el coseno del ángulo entre dos vectores, que le importa la *dirección* (significado) e ignora la *magnitud* (aproximadamente, la longitud del texto):

$$
\text{cosine\_similarity}(a, b) = \frac{a \cdot b}{\|a\| \, \|b\|}
$$

Dado que cada vector ya fue normalizado a longitud 1 al guardarse ($\|a\| = \|b\| = 1$), el denominador es simplemente 1, y la similitud de coseno se colapsa a un simple producto punto — una razón para normalizar en el momento de generar el embedding en lugar de omitirlo:

```python
# retrieve.py
"""Given a question, finds the notes chunks most relevant to it.

Imported by ask.py (Step 5) -- not meant to be run directly, though the
__main__ block below lets you try it standalone.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

_model = None  # loaded lazily so importing this module doesn't load the model


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def retrieve(question: str, top_k: int = 3) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    similarity score, ranked highest first."""
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]

    # Every row of `embeddings` is already unit-length (Step 3), and so is
    # question_vector, so this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("What is this course about?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

`embeddings @ question_vector` es multiplicación matriz-vector: cada fila de la matriz multiplicada por producto punto con el vector de la pregunta, todo a la vez, en una sola llamada de NumPy — la misma operación del material de álgebra lineal del curso, aquí haciendo el trabajo real de comparar una pregunta contra cada fragmento de las notas.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` imprime `top_k` resultados, cada uno con una puntuación de similitud y un nombre de archivo de origen.</StepChecklistItem>
<StepChecklistItem>El fragmento mejor clasificado para una pregunta de prueba fácil y obvia realmente se ve relevante cuando lo lees.</StepChecklistItem>
<StepChecklistItem>Las puntuaciones están entre -1 y 1 (el rango válido para la similitud de coseno) — si ves números muy fuera de ese rango, probablemente uno de los vectores no estaba normalizado.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `np.argsort(similarities)[::-1][:top_k]` ordena *todas* las similitudes antes de tomar las mejores pocas. Para una carpeta personal de notas esto está bien, pero ¿por qué podría convertirse en un problema ordenar el array entero si tuvieras diez millones de fragmentos en lugar de unos pocos cientos?
- ¿Qué esperarías que le pasara a la puntuación del mejor resultado si hicieras una pregunta que no tiene respuesta real en ninguna parte de tus notas? Pruébalo — ¿la puntuación confirma tu predicción?

## Paso 5: Genera una respuesta con un LLM gratuito

La recuperación por sí sola te devuelve fragmentos crudos de tus propias notas — útil, pero no una respuesta redactada. El último paso le entrega esos fragmentos a un modelo de lenguaje como contexto y le pide que responda *usándolos*. Esto es lo que significa "RAG" (generación aumentada por recuperación): generación, aumentada por un paso de recuperación ejecutado primero.

**Elige el proveedor que prefieras** — ninguno de ellos requiere una tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(valor por defecto sugerido)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el alcance `models: read` | Sin registro separado — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que los de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — buena para comparar proveedores. |

Cualquiera que elijas, el proceso es el mismo:

1. Inicia sesión y genera una clave de API en el sitio de ese proveedor.
2. **Nunca pegues esta clave directamente en el código ni la subas a un repositorio.** Ponla en un archivo `.env` en su lugar (ya ignorado por git si seguiste el Paso 1):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` (instalado en el Paso 1) lee este archivo hacia `os.environ` automáticamente, el mismo patrón usado a lo largo del [proyecto de Agente de IA](/docs/projects/ai-agent) si ya hiciste ese — GitHub Models expone una API compatible con OpenAI, así que la biblioteca cliente `openai` normal funciona para él sin ningún paquete adicional:

```bash
uv add openai
```

```python
# ask.py
"""Retrieves relevant chunks for a question, then asks a free-tier LLM to
answer using only that context.

Run with: uv run python ask.py "your question here"
"""

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so -- do not make something up.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)
    return PROMPT_TEMPLATE.format(context=context, question=question)


def ask(question: str, top_k: int = 3) -> str:
    chunks = retrieve(question, top_k=top_k)
    prompt = build_prompt(question, chunks)

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "What is this course about?"
    print(ask(question))
```

```bash
uv run python ask.py "What is this course about?"
```

`build_prompt` es toda la idea de RAG en una sola función: no le pide al modelo que responda desde lo que ya sabe, le entrega al modelo el *texto realmente recuperado* y le pide que responda a partir de eso — por lo que una app RAG puede responder correctamente preguntas sobre notas que el modelo subyacente nunca vio, escritas ayer, en tu propia máquina.

:::tip[¿Usas un proveedor distinto?]
Cambia el bloque `OpenAI(...)` por el cliente propio de tu proveedor, siguiendo el mismo patrón que el [proyecto de Agente de IA](/docs/projects/ai-agent#paso-4-escribe-tu-primer-agente) — p. ej. el paquete `google-genai` de Google para Gemini, o el cliente propio de `groq` para Groq. Cerebras y OpenRouter también son compatibles con OpenAI, así que el paquete `openai` también funciona para ellos, solo que con un `base_url` distinto.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python ask.py "una pregunta real sobre tus notas"` imprime una respuesta, no un traceback.</StepChecklistItem>
<StepChecklistItem>La respuesta realmente refleja el contenido de tus notas, no conocimiento genérico que el modelo ya tenía.</StepChecklistItem>
<StepChecklistItem>Preguntar algo que tus notas claramente no cubren hace que el modelo lo diga, en lugar de inventar algo con confianza.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- La plantilla del prompt dice explícitamente "using ONLY the context below" y "if the context doesn't contain the answer, say so". ¿Qué crees que pasaría si quitaras esa instrucción y simplemente le entregaras al modelo el contexto y la pregunta sin ninguna guía? Pruébalo.
- Si `retrieve()` devuelve los fragmentos *equivocados* para una pregunta — que se ven relevantes pero no son realmente la respuesta — ¿puede un buen modelo de lenguaje seguir acertando la respuesta? ¿Qué sugiere eso sobre qué parte de este pipeline importa más cuando algo sale mal: la recuperación o la generación?

## ⚠️ Errores comunes

- **Fragmentos demasiado grandes o demasiado pequeños.** Demasiado grandes y la recuperación se vuelve borrosa (Paso 2); demasiado pequeños y un fragmento pierde el contexto que rodea lo que el modelo necesita para responder bien. Si las respuestas se sienten raras, prueba un `TARGET_CHUNK_SIZE` distinto y vuelve a ejecutar `build_index.py`.
- **Olvidar reconstruir el índice después de editar `notes/`.** `build_index.py` solo se ejecuta cuando tú lo ejecutas — agrega una nota nueva, y `retrieve()` no encontrará nada en ella hasta que vuelvas a ejecutar `uv run python build_index.py`. No hay ningún vigilante de archivos aquí; este es un paso manual por diseño, para que siempre sepas exactamente qué está indexado.
- **Generar el embedding de la pregunta con un modelo distinto al usado para construir el índice.** `retrieve.py` y `build_index.py` fijan a propósito `MODEL_NAME = "all-MiniLM-L6-v2"` en el código — los vectores de dos modelos de embeddings distintos no son comparables entre sí en absoluto, incluso si ambos son "de 384 dimensiones". Cambia el modelo en un archivo y debes cambiarlo en ambos, y luego reconstruir el índice.
- **Límites de tasa en el nivel gratuito del LLM.** La recuperación (Pasos 3-4) es local e ilimitada; solo la llamada de `ask()` del Paso 5 cuenta contra la cuota de nivel gratuito de tu proveedor. Un error 429 ahí es el proveedor diciéndote que vayas más despacio, no un bug — mira el [proyecto de Agente de IA](/docs/projects/ai-agent#manejar-límites-de-tasa) para el mismo patrón y un enfoque de reintento que puedes copiar.

## Lo que acabas de construir

Un pipeline RAG pequeño pero completo: fragmentación, embeddings locales, búsqueda de similitud en memoria, y un paso final de generación anclado en tu propio texto recuperado — la misma arquitectura detrás de sistemas de producción mucho más grandes, solo que con un array plano de NumPy en lugar de una base de datos vectorial y una API de nivel gratuito en lugar de una de pago. Nada aquí fue falseado o simplificado a un juguete que no generaliza; cambia por una carpeta de notas más grande y un modelo de pago, y los mismos cuatro pasos siguen siendo todo el pipeline.

## A dónde ir desde aquí

- Una vez que tu carpeta de notas crezca más allá de lo que cabe cómodamente en memoria (decenas de miles de fragmentos), mira una base de datos vectorial real como [ChromaDB](https://www.trychroma.com/) — hace la misma búsqueda de vecinos más cercanos que `retrieve()` de arriba, solo que indexada para velocidad a una escala mucho mayor, con la persistencia en disco y el filtrado que esta versión de archivo plano no tiene.
- Prueba el **re-ranking**: recupera un top-k más grande (digamos, 10) con la búsqueda rápida por embeddings, y luego usa un modelo cross-encoder más lento y preciso para volver a puntuar solo esos 10 antes de elegir los 3 finales que se envían al LLM — un patrón común de dos etapas en sistemas RAG de producción.
- Extiende `prepare_notes.py` para manejar más tipos de archivo — PDFs (`pypdf`), o incluso tus propias exportaciones de chats pasados — a los pasos de fragmentación y embeddings que vienen después no les importa de dónde vino el texto.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes para agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, hacer commit de tus archivos, y abrir el PR, un paso a la vez. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="rag-notes" />
