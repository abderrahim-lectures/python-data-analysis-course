---
id: chat-with-pdfs
title: "Chatea con tus PDFs"
sidebar_label: "Chatea con tus PDFs"
slug: /projects/chat-with-pdfs
description: "Construye una app RAG multi-documento sobre una carpeta de PDFs, con embeddings locales, un LLM de nivel gratuito, y citas de número de página en cada respuesta."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Chatea con tus PDFs

<ProjectPublishedDate projectId="2027-chat-with-pdfs" />

<ProjectGreeting />

El [proyecto de App RAG](/docs/projects/rag-notes) chatea con una carpeta de notas de texto plano. Este proyecto lleva la misma idea a algo más útil: una carpeta de PDFs reales — informes, guías, manuales, papers — con respuestas que citan exactamente de qué documento y qué página proviene un hecho, como lo haría un asistente de investigación. Esto asume Python 101; también ayuda mucho haber construido ya el proyecto de App RAG, ya que este reutiliza toda su arquitectura y solo cambia cómo se leen y citan los documentos fuente, pero no es un requisito estricto si te sientes cómodo con los conceptos.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Extraer texto de una carpeta de PDFs, página por página, y dividirlo en pequeños fragmentos — manteniendo el nombre de archivo fuente y número de página adjuntos a cada fragmento.
2. Convertir cada fragmento en un vector, completamente local, sin clave de API y sin costo, usando `sentence-transformers`.
3. Recuperar los fragmentos más relevantes para una pregunta a través de *todos* los PDFs a la vez, luego pedirle a un LLM de nivel gratuito que responda usando solo ese contexto — con una cita `(fuente, página N)` requerida para cada hecho.
4. Envolver todo esto en un pequeño bucle interactivo para que puedas seguir haciendo preguntas sin volver a ejecutar un script cada vez.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado — es Python real corriendo en tu propia máquina, el mismo movimiento de "gradúate a Python real" que cualquier otro proyecto de esta sección. La sección de Configuración de abajo explica cómo instalarlo.

**GitHub Codespaces** es una alternativa de configuración cero si prefieres no instalar nada localmente todavía: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta los mismos comandos `uv` exactos desde una terminal en tu pestaña del navegador.

**Google Colab, Kaggle Notebooks, o Binder** también funcionan, ya que este proyecto no necesita GPU — una versión real y ejecutable en notebook del pipeline de este proyecto (el mismo fragmentado de PDF, embedding local, y generación de respuestas citadas que los pasos de abajo) vive en [`examples/chat-with-pdfs/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb). Haz clic en una insignia para lanzarlo directamente, sin instalación local en absoluto:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fchat-with-pdfs%2Fnotebook.ipynb)

Sé honesto contigo mismo sobre la compensación, sin embargo: esta es una forma de menor fidelidad de experimentar el proyecto que un proyecto `uv` local real — sin archivos separados, sin estructura de proyecto real, solo celdas en un notebook. Trátalo como una forma rápida de experimentar, no el camino principal.

## Configuración

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

Luego configura un proyecto:

```bash
uv init chat-with-pdfs
cd chat-with-pdfs
uv add pypdf sentence-transformers numpy openai python-dotenv
```

`pypdf` lee texto de archivos PDF. `sentence-transformers` es la biblioteca que convierte texto en vectores localmente, en tu propia CPU — sin llamada a API, sin clave. `numpy` hace las matemáticas reales para comparar vectores. `python-dotenv` te permite mantener tu clave de API de LLM en un archivo `.env` local.

### Obtén una clave de API de LLM gratuita

La generación (la última parte del Paso 3) necesita una API de LLM de nivel gratuito — la extracción, fragmentación, embedding y recuperación son todas completamente locales y no necesitan ninguna clave, pero es más simple configurar esto ahora, antes de empezar a construir, en lugar de pausar a mitad de camino.

**Elige el proveedor que prefieras** — ninguno requiere tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(sugerido por defecto)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el scope `models: read` | Sin registro aparte — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Sea cual sea el que elijas, el proceso es el mismo:

1. Inicia sesión y genera una clave de API en el sitio de ese proveedor.
2. **Nunca pegues esta clave directamente en el código ni la subas a un repositorio.** Ponla en un archivo `.env` en su lugar (ya en gitignore):

```bash
# .env
GITHUB_TOKEN=tu-clave-aquí
```

`python-dotenv` (instalado arriba) lee este archivo hacia `os.environ` automáticamente, el mismo patrón usado en el [proyecto de App RAG](/docs/projects/rag-notes) y el [proyecto de Agente de IA](/docs/projects/ai-agent) si has hecho alguno de esos — GitHub Models resulta que expone una API compatible con OpenAI, así que la librería cliente `openai` simple funciona para ello sin ningún paquete extra:

```bash
uv add openai
```

Si elegiste un proveedor diferente, cambia por el cliente propio de ese proveedor cuando llegues al paso de generación de abajo (mira el tip ahí).

### Consigue algunos PDFs

Pon un puñado de PDFs reales — informes, guías, papers, cualquier cosa con texto real en ella (no imágenes escaneadas) — en una carpeta `pdfs/` dentro de tu proyecto. Si no tienes ninguno a mano, copia los tres PDFs de ejemplo cortos de [`examples/chat-with-pdfs/pdfs/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/chat-with-pdfs/pdfs), o genera los tuyos propios con el script [`generate_sample_pdfs.py` del ejemplo](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/generate_sample_pdfs.py).

## Paso 1: Carga y fragmenta tus PDFs

`pypdf` extrae texto de un PDF una página a la vez, que es exactamente la granularidad que este proyecto necesita — es lo que hace posible decir *de qué página* vino una respuesta más tarde. Como con el proyecto de App RAG, una página completa suele ser todavía demasiado grande y desenfocada para hacer embedding bien, así que cada página se divide en fragmentos más pequeños — pero a diferencia de ese proyecto, cada fragmento aquí también debe recordar de qué archivo y qué página vino.

```python
# load_pdfs.py
"""Loads every PDF in pdfs/, extracts text page by page, and splits each
page into small chunks -- keeping the source filename and page number
attached to every chunk, so later answers can cite exactly where a fact
came from.

Run with: uv run python load_pdfs.py

This only prints a summary -- build_index.py (Step 2) imports load_chunks()
from this file and does the actual embedding.
"""

from pathlib import Path

from pypdf import PdfReader

PDFS_DIR = Path("pdfs")
TARGET_CHUNK_SIZE = 500  # characters -- small enough to stay focused,
                         # large enough to hold a full thought


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs. Falls back to
    splitting on single newlines if a page has no blank-line breaks at
    all, which is common in PDFs extracted from single-column layouts."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    paragraphs = [p for p in paragraphs if p]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in text.split("\n")]
        paragraphs = [p for p in paragraphs if p]
    return paragraphs


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size
    characters, so a chunk isn't just one short line with barely any
    context in it."""
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
    """Returns a list of {"text", "source", "page"} dicts, one per chunk,
    across every PDF in PDFS_DIR. `page` is 1-indexed, matching what a
    human reading the PDF would call "page N" -- pypdf's own page indices
    are 0-based, so every page number here has +1 applied."""
    chunks = []
    for path in sorted(PDFS_DIR.glob("*.pdf")):
        reader = PdfReader(str(path))
        for page_index, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            paragraphs = split_into_paragraphs(text)
            for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
                chunks.append({
                    "text": chunk_text,
                    "source": path.name,
                    "page": page_index + 1,
                })
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {PDFS_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']} p{chunk['page']}] {preview}...")
```

```bash
uv run python load_pdfs.py
```

:::tip[Múltiples documentos, un solo pipeline]
Nada aguas abajo de `load_chunks()` necesita saber o importarle cuántos PDFs hay, o de cuál vino un fragmento — cada fragmento lleva su propia `source` y `page`, así que la recuperación naturalmente busca a través de *todos* tus PDFs a la vez, y la respuesta eventual puede mezclar hechos de varios documentos diferentes en una sola respuesta, cada uno correctamente atribuido.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python load_pdfs.py` se ejecuta sin errores e imprime un conteo de fragmentos distinto de cero.</StepChecklistItem>
<StepChecklistItem>Las vistas previas impresas se ven como fragmentos reales del texto de tus PDFs, no cadenas vacías o caracteres corruptos.</StepChecklistItem>
<StepChecklistItem>Cada fragmento impreso muestra tanto un nombre de archivo como un número de página que coinciden con lo que verías abriendo el PDF tú mismo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué extraer texto *por página* en lugar de leer todo el PDF en una gran cadena y fragmentar eso? ¿Qué información perderías?
- Un PDF escaneado (una foto de un documento en papel, sin texto real incrustado) haría que `page.extract_text()` devolviera una cadena vacía para cada página. ¿Cómo notarías que esto había pasado, y qué necesitarías añadir para manejarlo (pista: busca "OCR")?

## Paso 2: Haz embedding de tus fragmentos localmente

Este paso es idéntico en espíritu al paso de embedding del proyecto de App RAG — el mismo modelo, el mismo razonamiento, solo haciendo embedding de fragmentos derivados de PDF en lugar de fragmentos de notas. `all-MiniLM-L6-v2` mapea cada fragmento a un punto en espacio de 384 dimensiones, entrenado para que fragmentos con significado similar terminen cerca uno del otro. Es pequeño (unos 80MB), corre completamente en tu CPU en aproximadamente un segundo por fragmento en una laptop típica, no necesita clave de API, y no cuesta nada.

```python
# build_index.py
"""Embeds every chunk from load_pdfs.py and saves the vectors + text
(including source filename and page number) locally, so retrieve() (Step 3)
doesn't need to re-embed anything at query time.

Run with: uv run python build_index.py
Re-run this any time you add, remove, or edit files in pdfs/ -- the saved
index doesn't update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from load_pdfs import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .pdf files to pdfs/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata (source + page) to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py
```

Igual que el proyecto de App RAG, esto deliberadamente evita una base de datos vectorial — para una carpeta personal de PDFs (docenas a cientos bajos de documentos, no millones), un array simple de NumPy es más simple, no tiene servicio extra que instalar o correr, y es completamente transparente. `normalize_embeddings=True` escala cada vector a longitud 1, que es lo que hace que la similitud de coseno del Paso 3 se reduzca a un solo producto punto.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py` se completó sin errores.</StepChecklistItem>
<StepChecklistItem>Un archivo `index.npy` y un archivo `chunks.json` ahora existen en la carpeta de tu proyecto.</StepChecklistItem>
<StepChecklistItem>Al abrir `chunks.json`, cada entrada tiene un campo `text`, `source`, y `page`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si dos PDFs diferentes resultan contener oraciones casi idénticas (digamos, ambos citan la misma regulación), ¿qué esperarías que se vieran sus vectores de embedding relativos entre ellos?
- ¿Por qué volver a hacer embedding de los *fragmentos* aquí pero no de los PDFs mismos? ¿Qué perdería hacer embedding de un PDF completo como un solo vector, comparado con hacer embedding de cada uno de sus fragmentos por separado?

## Paso 3: Recupera y genera una respuesta citada

La recuperación funciona exactamente como el proyecto de App RAG — haz embedding de la pregunta, clasifica cada fragmento por similitud de coseno, toma los primeros pocos — excepto que ahora la clasificación corre a través de cada fragmento de cada PDF a la vez, así que el resultado más relevante para una pregunta podría venir de cualquiera de tus documentos.

```python
# retrieve.py
"""Given a question, finds the PDF chunks most relevant to it, across every
document in pdfs/ -- each result carries its source filename and page number.

Imported by ask.py -- not meant to be run directly, though the __main__
block below lets you try it standalone.
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


def retrieve(question: str, top_k: int = 4) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    similarity score, source document, and page number, ranked highest
    first -- possibly drawn from several different PDFs at once."""
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]

    # Every row of `embeddings` is already unit-length (Step 2), and so is
    # question_vector, so this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("How many days of paid time off do employees get?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']} p{r['page']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

Ahora la generación. El prompt es toda la idea de RAG-con-citas en un solo lugar: le entrega al modelo los fragmentos recuperados *etiquetados con su fuente y página*, y requiere que cada hecho en la respuesta sea seguido por una cita `(fuente, página N)` copiada de esa etiqueta — el modelo no está inventando citas, está repitiendo las que ya estaban adjuntas al texto que se le dio.

```python
# ask.py
"""Retrieves relevant chunks across every PDF in pdfs/, then asks a
free-tier LLM to answer using only that context -- citing which document
and page each part of the answer came from.

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

Every fact you use MUST be followed by a citation in the form
(source, page N), taken from the [source, page N] tag on the context chunk
it came from. If your answer draws on more than one chunk, cite each one.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(
        f"[{c['source']}, page {c['page']}] {c['text']}" for c in chunks
    )
    return PROMPT_TEMPLATE.format(context=context, question=question)


def ask(question: str, top_k: int = 4) -> str:
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
    question = " ".join(sys.argv[1:]) or "How many days of paid time off do employees get?"
    print(ask(question))
```

```bash
uv run python ask.py "How many days of paid time off do employees get?"
```

:::tip[¿Usando un proveedor diferente?]
Cambia el bloque `OpenAI(...)` por el propio cliente de tu proveedor, siguiendo el mismo patrón que el [proyecto de App RAG](/docs/projects/rag-notes) y el [proyecto de Agente de IA](/docs/projects/ai-agent) — ej. el paquete `google-genai` de Google para Gemini, o el propio cliente de `groq` para Groq. Cerebras y OpenRouter también son compatibles con OpenAI, así que el paquete `openai` también funciona para ellos, solo con una `base_url` diferente.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` imprime resultados de tus PDFs con nombres de archivo fuente y números de página con apariencia plausible.</StepChecklistItem>
<StepChecklistItem>`uv run python ask.py "una pregunta real"` imprime una respuesta, no un traceback.</StepChecklistItem>
<StepChecklistItem>Cada afirmación factual en la respuesta es seguida por una cita `(fuente, página N)`, y la página de cada cita realmente contiene ese hecho cuando revisas el PDF.</StepChecklistItem>
<StepChecklistItem>Preguntar algo que tus PDFs claramente no cubren hace que el modelo lo diga, en lugar de inventar algo con confianza (incluyendo una cita falsa).</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- El prompt requiere una cita para *cada* hecho. ¿Qué esperas que pase si eliminas ese requisito — el modelo tendería a seguir respondiendo con precisión, o pedir citas realmente cambia cuán cuidadosamente se apega al contexto? Prueba ambos y compara.
- Si `retrieve()` extrae el fragmento superior de la página correcta pero el PDF *equivocado* (digamos, dos productos diferentes ambos mencionan "garantía"), ¿lo notarías solo leyendo la cita? ¿Qué sugiere eso sobre siempre verificar citas en lugar de confiar en una respuesta solo porque tiene una?

## Paso 4: Un pequeño bucle interactivo

Volver a ejecutar `ask.py` con un nuevo argumento de línea de comandos para cada pregunta funciona, pero es lento para iterar. Envuélvelo en un pequeño bucle en su lugar, para que puedas seguir chateando con tus PDFs en una sesión en ejecución.

```python
# chat.py
"""A small interactive loop: keep asking questions about the PDFs in pdfs/
until you type "quit" or "exit".

Run with: uv run python chat.py
"""

from ask import ask


def main() -> None:
    print("Chat with your PDFs -- ask a question, or type 'quit' to stop.\n")
    while True:
        question = input("> ").strip()
        if not question:
            continue
        if question.lower() in {"quit", "exit"}:
            break
        answer = ask(question)
        print(f"\n{answer}\n")


if __name__ == "__main__":
    main()
```

```bash
uv run python chat.py
```

:::tip[Esta es toda la app]
No hay servidor, no hay framework, no hay kit de herramientas de UI aquí — un bucle `while True` alrededor de `ask()` *es* una app de chat legítima. Cada producto de "chatea con tus datos" que has visto es este mismo bucle por debajo, con un frontend web, respuestas en streaming, e historial de conversación en capas encima. Ninguna de esas capas cambia lo que realmente está pasando: recuperar, luego generar, luego imprimir.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python chat.py` se inicia, acepta una pregunta, imprime una respuesta citada, y vuelve a un nuevo prompt `>`.</StepChecklistItem>
<StepChecklistItem>Escribir `quit` o `exit` termina el bucle limpiamente.</StepChecklistItem>
<StepChecklistItem>Puedes hacer dos preguntas diferentes sobre dos PDFs diferentes en la misma sesión sin reiniciar nada.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Cada llamada a `ask()` vuelve a cargar `index.npy` y `chunks.json` desde disco y vuelve a cargar el modelo de embedding. Para una sola pregunta eso está bien — ¿qué cambiarías en `chat.py` y `retrieve.py` si quisieras que el bucle se sintiera más ágil después de la primera pregunta?
- Este bucle no tiene memoria de preguntas anteriores — cada llamada a `ask()` es independiente. ¿Qué se rompería si preguntaras un seguimiento como "¿qué hay del segundo?" justo después de otra pregunta? ¿Qué necesitarías añadir para soportar eso?

## ⚠️ Errores comunes

- **Los PDFs escaneados y solo de imagen no devuelven texto.** El `extract_text()` de `pypdf` solo lee texto que está realmente incrustado en el PDF — un PDF hecho de páginas fotografiadas o escaneadas no tiene texto incrustado en absoluto, así que `load_pdfs.py` producirá silenciosamente cero fragmentos para ese archivo. Si un documento del que esperas ver respuestas nunca aparece, verifica primero si puedes seleccionar/copiar su texto en un visor de PDF normal; si no puedes, necesita OCR (fuera del alcance de este proyecto) antes de que este pipeline pueda usarlo.
- **Fragmentos demasiado grandes o demasiado pequeños.** Misma compensación que el proyecto de App RAG: demasiado grande y la recuperación se vuelve borrosa, demasiado pequeño y un fragmento pierde el contexto circundante que el modelo necesita para responder bien. Si las respuestas se sienten mal, prueba un `TARGET_CHUNK_SIZE` diferente y vuelve a ejecutar `build_index.py`.
- **Olvidar reconstruir el índice después de cambiar `pdfs/`.** `build_index.py` solo corre cuando lo ejecutas — añade, elimina, o edita un PDF, y `retrieve()` no reflejará el cambio hasta que vuelvas a ejecutar `uv run python build_index.py`.
- **Confiar en una cita sin verificarla.** El prompt *pide* al modelo citar solo lo que está realmente en el contexto recuperado, y en la práctica lo hace de forma confiable — pero nada aquí lo garantiza matemáticamente. Verifica algunas citas contra las páginas reales del PDF, especialmente antes de confiar en esto para algo que importe.
- **Límites de tasa en el nivel gratuito del LLM.** La extracción, fragmentación, embedding y recuperación son todas locales e ilimitadas; solo la llamada al LLM de `ask()` cuenta contra la cuota de nivel gratuito de tu proveedor. Un error 429 ahí es el proveedor diciéndote que reduzcas la velocidad, no un bug — mira el [proyecto de Agente de IA](/docs/projects/ai-agent) para el mismo patrón y un enfoque de reintento que puedes copiar.

## Lo que acabas de construir

Un pipeline RAG multi-documento con citas: extracción y fragmentación de PDF con conciencia de página, embedding local, búsqueda de similitud en memoria a través de un número arbitrario de documentos, y un paso final de generación que está obligado a señalar exactamente de dónde vino cada hecho — la misma forma de sistema detrás de los productos reales de "chatea con tus documentos", menos la base de datos vectorial y la API pagada, sustituidas por una gratuita y un array plano de NumPy.

## A dónde ir desde aquí

- Una vez que tu carpeta de PDFs supere lo que cabe cómodamente en memoria (decenas de miles de fragmentos), mira una base de datos vectorial real como [ChromaDB](https://www.trychroma.com/) — la misma búsqueda de vecinos más cercanos que `retrieve()` de arriba, indexada para velocidad a una escala mucho mayor, con filtrado de metadatos (ej. "buscar solo PDFs de 2024") que esta versión de archivo plano no tiene.
- Añade un **filtro de fuente**: deja que una pregunta restrinja la recuperación a solo un PDF (`retrieve(question, source="warranty.pdf")`), útil una vez que tu carpeta contenga documentos sobre temas muy diferentes que no deberían mezclarse.
- Prueba **OCR** con una biblioteca como `pytesseract` para PDFs escaneados, para que documentos solo de imagen puedan unirse al pipeline en lugar de contribuir silenciosamente cero fragmentos.
- Extiende las citas para incluir un **fragmento**, no solo un número de página — devuelve la oración exacta de donde vino el hecho junto a `(fuente, página N)`, para que puedas verificar una respuesta sin abrir el PDF tú mismo.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-chat-with-pdfs" />
