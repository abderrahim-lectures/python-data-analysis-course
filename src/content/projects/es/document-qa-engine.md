---
title: "Motor de Preguntas y Respuestas sobre Documentos"
description: "Haz preguntas sobre PDFs, documentos y hojas de cálculo y obtén respuestas precisas con citas de fuentes."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "retrieval", "indexing", "nlp-basics"]
prerequisites:
  - "Fundamentos de Python (dicts, conjuntos, comprehensions)"
  - "Expresiones regulares y lectura de archivos con pathlib"
learningObjectives:
  - "Fragmentar un corpus en unidades de texto consultables con ids estables"
  - "Construir un índice invertido que mapea términos a chunks"
  - "Puntuar y clasificar chunks para una consulta arbitraria con frecuencia de término"
  - "Extraer una respuesta a nivel de oración del mejor chunk con una cita de fuente"
  - "Envolver recuperación + respuestas en una CLI interactiva que nunca depende de una red"
---

# 📄 Construir un Motor de Preguntas y Respuestas sobre Documentos

En el mundo previo a los LLM — y en cada entorno de borde donde un LLM es demasiado pesado, demasiado lento o demasiado caro — "haz preguntas a tus documentos" es un *problema de búsqueda con formato bonito*. La maquinaria es honesta y te enseña más que el wrapper de chat: divide el corpus en chunks, indexa cada término a los chunks en los que aparece, puntúa chunks para una consulta, elige la oración que mejor la responde, y cita de dónde salió. Este proyecto construye las cinco capas en Python puro, y verás a un motor real hacer algo real: nadie adivinando, cada respuesta lleva el archivo del que vino.

Esto asume Python 101 más `re` y `pathlib` cómodos. No se requiere nada del módulo de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Ingerir un corpus de markdown de tres archivos y dividirlo en chunks con ids estables.
2. Construir un índice invertido — para cada término, la lista de chunks en los que aparece y cuántas veces.
3. Clasificar chunks para una consulta por frecuencia de término normalizada.
4. Extraer la mejor oración del chunk principal y citar su archivo fuente.
5. Envolverlo en una CLI interactiva `ask.py` — escribe una pregunta, obtén aciertos clasificados y una respuesta con fuente.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — un índice es un objeto vivo que cargas una vez y consultas repetidamente, y una CLI hace eso mejor que una celda de notebook.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks, o Binder** funcionan para cada paso — el notebook en [`examples/document-qa-engine/notebook.es.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.es.ipynb) ejecuta el mismo motor sobre el corpus incluido en memoria.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocument-qa-engine%2Fnotebook.es.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entornos virtuales" — y este proyecto es biblioteca estándar pura.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, y confirma que quedó instalado:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init document-qa-engine
cd document-qa-engine
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `document-qa-engine/` existe con un `pyproject.toml`.
- ✅ `python -c "import re, pathlib, collections"` tiene éxito — sin paquetes de terceros.

## Paso 1: Ingerir el corpus en chunks

Antes de que se pueda hacer cualquier pregunta, los documentos tienen que convertirse en una lista de *chunks* — unidades de texto pequeñas y autocontenidas que el motor pueda puntuar y citar. Fragmentar por párrafos separados por líneas en blanco es deliberadamente simple: una página wiki sobre geckos se convierte en un chunk, y la identidad del chunk es su `source#index`, que es exactamente lo que una respuesta cita más adelante.

### 1.1 Crear el corpus y el lector

**👟 Pista inicial :** Tres archivos de markdown de un párrafo son todo el corpus; `load_corpus` los lee, divide por líneas en blanco, y sella cada chunk con un id estable:

```bash
mkdir -p docs
cat > docs/gecko.md <<'EOF'
Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
EOF
cat > docs/hamster.md <<'EOF'
Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
EOF
cat > docs/hermit.md <<'EOF'
Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
EOF
```

```python
# ingest.py
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z']+", text.lower())

def load_corpus(directory: str = "docs") -> list[dict]:
    chunks = []
    for path in sorted(Path(directory).glob("*.md")):
        paragraphs = [p.strip() for p in path.read_text().split("\n\n") if p.strip()]
        for i, text in enumerate(paragraphs):
            chunks.append({"id": f"{path.name}#{i}", "source": path.name, "text": text})
    return chunks

if __name__ == "__main__":
    for chunk in load_corpus():
        print(f"{chunk['id']:<12} {len(tokenize(chunk['text'])):>3} words  {chunk['text'][:38]}...")
```

`tokenize` es la única frase que comparten la ingesta y (más adelante) la consulta: todo en minúsculas, conserva solo letras y apóstrofes — así `Climb`, `climb` y `climb,` se indexan todos como el mismo término `climb`. La división de párrafos por línea en blanco es la *unidad* de fragmentación; los sistemas de producción dividen por oraciones o por ventanas de tamaño fijo, pero el contrato es idéntico (id + source + text), que es exactamente por qué podrías intercambiar el fragmentador sin tocar el índice ni el respondedor.

**🎯 Resultado esperado :**

```
gecko.md#0    25 words  Geckos are nocturnal lizards. They can...
hamster.md#0  21 words  Hamsters are nocturnal rodents. They h...
hermit.md#0   23 words  Hermit crabs are decapod crustaceans. ...
```

**🩹 Si sale mal :** Si los archivos no aparecen en absoluto, `Path(directory).glob("*.md")` no encontró ninguno — confirma que `docs/` queda *al lado de* `ingest.py` (el mismo directorio que el script desde el que ejecutas). Si los ids de chunk muestran `docs/gecko.md#0`, pasaste `directory="docs"` pero `path.name` incluye la ruta — usa `path.name`, no `str(path)`.

### 1.2 Verifica la ingesta

**✅ Lista de verificación**

- ✅ `load_corpus()` produce exactamente tres chunks: `gecko.md#0`, `hamster.md#0`, `hermit.md#0`.
- ✅ `tokenize("Climb, CLIMB climb") == ["climb", "climb", "climb"]` — insensible a mayúsculas y puntuación.
- ✅ Los conteos de palabras (25 / 21 / 23) te dicen el tamaño del corpus sin leer prosa — los conteos impulsan la normalización del Paso 3.

**🤔 Pregunta(s) socrática(s)**

- Párrafo = un chunk significa que un párrafo *largo* dominará la recuperación más adelante. ¿Qué unidad de fragmentación elegirías para que el motor de respuestas pueda distinguir "la página menciona lagartos" de "*en dos oraciones* son nocturnos"? ¿Cómo cambia el esquema de ids?
- El corpus tiene tres archivos de un párrafo, así que todo es `#0`. ¿Cuándo se volverían ambiguos los ids `source#index` — y cuál es el primer fragmentador que produciría un `#1`?

## Paso 2: Construir el índice invertido

La forma de fuerza bruta de encontrar "dónde vive 'nocturnal'" es releer los tres archivos cada vez. El índice invertido da vuelta eso: *término → {id de chunk: recuento}*, así que una búsqueda de cualquier término es un solo acierto de dict que devuelve exactamente los chunks en los que está y cuántas veces. Memoria intercambiada por velocidad, y toda la velocidad del motor de respuestas construida en unas diez líneas de construcción.

### 2.1 Escribir `build_index`

**👟 Pista inicial :** Por chunk, cuenta las apariciones de cada término, y luego empuja `(término → id de chunk → recuento)` dentro de un defaultdict anidado:

```python
# index.py
from collections import defaultdict

from ingest import load_corpus, tokenize

def build_index(chunks: list[dict]) -> dict[str, dict[str, int]]:
    index: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for chunk in chunks:
        seen = {}
        for term in tokenize(chunk["text"]):
            seen[term] = seen.get(term, 0) + 1
        for term, count in seen.items():
            index[term][chunk["id"]] = count
    return index

def word_counts(chunks: list[dict]) -> dict[str, int]:
    return {c["id"]: len(tokenize(c["text"])) for c in chunks}

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    for term in ("nocturnal", "climb", "humidity", "shell"):
        print(f"{term:<10} -> {dict(index[term]) if term in index else {}}")
    print("word counts:", word_counts(chunks))
```

El `defaultdict(lambda: defaultdict(int))` es toda la forma: un dict exterior con clave por término que, para claves faltantes, hace surgir de la nada un dict *anidado* con clave por chunk que empieza a contar en 0. Leer `index["nocturnal"]` es rápido tanto si el término tiene un acierto como un millón, y nunca verificas membresía antes de tocarlo. Dos estructuras salen de este paso: `index` responde *"dónde aparece este término"* y `word_counts` responde *"cuánto mide este chunk"* — el Paso 3 necesita ambas.

**🎯 Resultado esperado :**

```
nocturnal  -> {'gecko.md#0': 1, 'hamster.md#0': 1}
climb      -> {'gecko.md#0': 1}
humidity   -> {'hermit.md#0': 1}
shell      -> {'hermit.md#0': 1}
word counts: {'gecko.md#0': 25, 'hamster.md#0': 21, 'hermit.md#0': 23}
```

**🩹 Si sale mal :** Si la demo imprime cada término con un dict vacío, `build_index` tokenizó un texto vacío (un `path.read_text()` sobre un archivo que el glob no encontró) — verifica que estás en el directorio `document-qa-engine/`. Si `index["climb"]` devuelve basura de defaultdict al imprimirse, estás imprimiendo un defaultdict que nunca se convirtió con `dict(...)` — cosmético, pero la conversión `dict(index[term])` es lo que lo hace renderizar como una lectura real del índice.

### 2.2 Verifica el índice

**✅ Lista de verificación**

- ✅ `nocturnal` mapea tanto al chunk de gecko como al de hamster; `climb`/`humidity` mapean cada uno a exactamente uno.
- ✅ Un término que aparece dos veces en un chunk (como `geckos`) tiene recuento `2` en la entrada de ese chunk.
- ✅ Consultar un término que no existe devuelve un mapeo vacío en lugar de lanzar.

**🤔 Pregunta(s) socrática(s)**

- El índice es un *dict plano de dicts*. ¿Qué haría falta para soportar "encontrar chunks por cualquiera de varios términos en una sola búsqueda" (una unión de claves de dict) sin ninguna dependencia nueva — y por qué es ese el siguiente tipo de consulta natural?
- Este índice recuerda *cuántas veces* aparece un término pero no *dónde en el chunk* (posición). ¿Qué desbloquearía conocer la posición — y vale la pena la memoria cuando un chunk tiene 25 palabras?

## Paso 3: Puntuar y clasificar chunks para una consulta

"¿Qué chunk responde mi pregunta?" ahora tiene una respuesta mecánica: tokeniza la consulta, busca el recuento por chunk de cada término, y dale a cada chunk un **puntaje normalizado** = (suma de recuentos de términos coincidentes) ÷ (conteo de palabras del chunk). Los chunks largos son penalizados por su longitud, que es exactamente el punto de la división, y es la diferencia entre "coincidencias" y "coincidencias *densas*".

### 3.1 Escribir `search`

**👟 Pista inicial :** Términos de consulta únicos, un doble bucle sobre los chunks, puntaje normalizado, luego `sorted(... reverse=True)`:

```python
# search.py
from ingest import load_corpus, tokenize
from index import build_index, word_counts

def search(query: str, chunks: list[dict], index: dict, counts: dict[str, int]) -> list[tuple[float, dict]]:
    terms = set(tokenize(query))
    scored = []
    for chunk in chunks:
        score = sum(index[t].get(chunk["id"], 0) for t in terms) / counts[chunk["id"]]
        scored.append((score, chunk))
    return sorted(scored, key=lambda pair: pair[0], reverse=True)

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    for i, (score, chunk) in enumerate(search("nocturnal", chunks, index, counts)[:3], 1):
        print(f"{i}. {chunk['id']:<12} score {score:.4f}  {chunk['text'][:30]}...")
```

El puntaje de frecuencia de término (TF) es deliberadamente básico — sin ponderación de posición, sin bonus de frase — y su basicidad es la lección: incluso este TF+normalización desnudo ya produce *clasificaciones que simplemente son correctas* para una pregunta de palabras clave en un corpus pequeño. Consultar `nocturnal` lo encuentra en dos archivos, y — aquí está el detalle sutil — el archivo de hamster *supera* al de gecko (0.0476 → 0.0400) no porque mencione la palabra dos veces, sino porque `normalized` divide por la longitud del chunk y el chunk de hamster es más corto. La calidad de la recuperación es un argumento constante sobre las funciones de puntuación; ahora eres dueño de la más simple y honesta.

**🎯 Resultado esperado :**

```
1. hamster.md#0 score 0.0476  Hamsters are nocturnal rodents...
2. gecko.md#0   score 0.0400  Geckos are nocturnal lizards. ...
3. hermit.md#0  score 0.0000  Hermit crabs are decapod crust...
```

**🩹 Si sale mal :** Si todos los puntajes son `inf`/`ZeroDivisionError`, falta la entrada `counts` de un chunk (los ids de chunk no coinciden entre `load_corpus` y `word_counts` — ambos deben derivar de la misma lista `chunks`). Si un chunk obtiene `nan`, se coló una división por `0` — un chunk vacío; `load_corpus` filtra con `if p.strip()`, así que confirma que tu fragmentador conservó esa guardia.

### 3.2 Verifica la clasificación

**✅ Lista de verificación**

- ✅ `nocturnal` clasifica a hamster y gecko por puntaje *normalizado* — hamster (21 palabras) por encima de gecko (25 palabras) con recuentos de término idénticos.
- ✅ Una consulta de varias palabras suma los recuentos por término: `geckos eat` puntúa a gecko en `(2+1)/25 = 0.120`.
- ✅ `sorted(..., reverse=True)` devuelve el puntaje más alto primero; los empates conservan el orden del corpus.

**🤔 Pregunta(s) socrática(s)**

- `nocturnal` aparece una vez en dos chunks, y sin embargo se clasifican distinto. ¿Es ese un comportamiento *correcto* o un artefacto — qué pregunta sobre los dos documentos codifica genuinamente la clasificación?
- Esto es solo frecuencia de término, sin IDF (frecuencia inversa de documento). Un término como `the`, presente en cada chunk, puntuaría a todos por igual con un montón de aciertos repetidos. ¿Qué le resta IDF al puntaje de cada chunk — y qué te compra en su lugar una lista de stop-words, al costo de codificar una lista?

## Paso 4: Extraer una oración como respuesta

La clasificación encontró el *chunk*; la pregunta merece una *oración*. Dividir el chunk principal en oraciones y puntuar cada una por cuántos términos de la consulta contiene es la respuesta extractiva, la segunda capa honesta: los términos de consulta presentes en una oración significan que esa oración probablemente lleva la respuesta. Lo que ganas es una cita ("gecko.md") que ningún paso de generación de hechos puede falsificar — y lo que aprendes es precisamente dónde la extracción deja de ser impresionante.

### 4.1 Escribir `extract_answer`

**👟 Pista inicial :** Reutiliza `search` para el chunk principal, divide por límites de oración con una regex de lookbehind, puntúa las oraciones por los tokens de consulta distintos presentes:

```python
# answer.py
import re

from ingest import load_corpus, tokenize
from index import build_index, word_counts
from search import search

def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

def extract_answer(query: str, chunks: list[dict], index: dict, counts: dict[str, int]):
    top = search(query, chunks, index, counts)[0][1]
    terms = set(tokenize(query))
    best_sentence, best_score = "", -1.0
    for sentence in sentences(top["text"]):
        score = sum(1 for t in terms if t in tokenize(sentence))
        if score > best_score:
            best_score, best_sentence = score, sentence
    return best_sentence, top["source"]

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    for query in ("what is nocturnal", "geckos eat", "climb"):
        answer, source = extract_answer(query, chunks, index, counts)
        print(f"Q: {query}")
        print(f"A: {answer}")
        print(f"  source: {source}\n")
```

La regex `(?<=[.!?])\s+` divide *después* de la puntuación y se come el espacio en blanco siguiente — un divisor de oraciones suficientemente bueno para prosa ordenada. Puntuar una oración por tokens de consulta *distintos* (`geckos` cuenta una vez, no dos) evita que una oración que meramente repite el sujeto le gane a una que responde el verbo. La honestidad gratuita del extractor: pregunta "climb" y devuelve "They can climb smooth glass using tiny lamellae." *y el archivo del que vino* — la cita es la función, porque el lector puede verificar el trabajo.

**🎯 Resultado esperado :**

```
Q: what is nocturnal
A: Hamsters are nocturnal rodents.
  source: hamster.md

Q: geckos eat
A: Geckos eat insects such as crickets.
  source: gecko.md

Q: climb
A: They can climb smooth glass using tiny lamellae.
  source: gecko.md
```

**🩹 Si sale mal :** Si "what is nocturnal" responde desde gecko.md en lugar de hamster.md, la clasificación de *chunks* cambió — el respondedor no puede ser más inteligente que su búsqueda, y `search` actualmente favorece el chunk más corto. Si falta una mejor oración, `sentences()` encogió la división (la regex no encontró un `\n\n` dentro del texto del párrafo) — ese es exactamente el momento en que moverías la fragmentación a unidades de oración.

### 4.2 Verifica la extracción

**✅ Lista de verificación**

- ✅ Cada respuesta cita `source` del chunk en el que se encontró — nunca fabricado.
- ✅ Para `what is nocturnal`, source = el chunk de rango 1 (`hamster.md`), consistente con el Paso 3.
- ✅ La puntuación de oraciones lee términos distintos, así que `geckos` apareciendo tres veces en una oración no domina puramente por repetición.

**🤔 Pregunta(s) socrática(s)**

- "What do hamsters eat?" buscaría el chunk de `hamsters` y extraería "Hamsters are nocturnal rodents." — una oración que *contiene la palabra* pero no *responde la pregunta*. ¿Qué rompe ese comportamiento (granularidad chunk → oración, semántica faltante), y qué arreglaría un paso de stop-words más sinónimos?
- La cita es toda la capa de responsabilidad: cada respuesta apunta a un archivo fuente que un humano puede abrir. ¿Qué cambia sobre confiar en la respuesta si la cita fuera *resumida* ("de hamster.md más o menos") en lugar de exacta?

## Paso 5: La CLI interactiva

Todo hasta ahora son funciones; el producto es un bucle. `ask.py` carga el corpus una vez, construye el índice una vez, y luego hace el prompt: clasifica los tres chunks principales para una pregunta escrita, imprime la respuesta extractiva con su fuente, acepta la siguiente pregunta, y solo se detiene en una línea vacía (o Ctrl-D). Un "chatea con tus documentos" real que corre completamente fuera de línea.

### 5.1 Escribir `ask.py`

**👟 Pista inicial :** Compón silenciosamente ingesta + índice + búsqueda + extracción bajo el capó; itera sobre `input()` hasta que esté vacío o EOF:

```python
# ask.py
from answer import extract_answer
from ingest import load_corpus
from index import build_index, word_counts
from search import search

def main() -> None:
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    while True:
        try:
            query = input("ask> ").strip()
        except EOFError:
            break
        if not query:
            break
        for rank, (score, chunk) in enumerate(search(query, chunks, index, counts)[:3], 1):
            print(f"{rank}. {chunk['id']} ({score:.3f})")
            print(f"   {chunk['text']}")
        answer, source = extract_answer(query, chunks, index, counts)
        print(f"answer: {answer} [{source}]")

if __name__ == "__main__":
    main()
```

```bash
uv run python ask.py
```

`while True:` con `break` en la entrada vacía es todo el contrato interactivo — una pregunta por turno, silencio cuando el humano termina, y un `try/except EOFError` para que Ctrl-D (EOF) salga tan elegante como una línea vacía. El bucle de tres líneas sobre `search(...)[:3]` es donde los chunks clasificados *se convierten* en el chat, y la línea final `answer:` es donde la recuperación se convierte en una respuesta. Prueba `nocturnal`, luego `climb`, luego `humidity`, y nota que el motor cita archivos diferentes para hechos diferentes.

**🎯 Resultado esperado** (una sesión genuina, una consulta tras otra):

```
ask> geckos eat
1. gecko.md#0 (0.120)
   Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
2. hermit.md#0 (0.043)
   Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
3. hamster.md#0 (0.000)
   Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
answer: Geckos eat insects such as crickets. [gecko.md]
ask> nocturnal
1. hamster.md#0 (0.048)
   Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
2. gecko.md#0 (0.040)
   Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
3. hermit.md#0 (0.000)
   Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
answer: Hamsters are nocturnal rodents. [hamster.md]
ask> 
```

**🩹 Si sale mal :** Si el prompt se repite sin aceptar entrada, el `input` está dentro del bucle pero falta el `break` en vacío — toda línea vacía que no esté en blanco continúa. Si `ask.py` se estrella en la primera consulta, una cadena de imports está rota (uno de los cuatro módulos) — `uv run python -c "import ask"` revela exactamente cuál.

### 5.2 Verifica la CLI

**✅ Lista de verificación**

- ✅ `uv run python ask.py` arranca, responde `geckos eat` como en la sesión de arriba, y sale en una línea vacía.
- ✅ Una respuesta vacía nunca aparece: `extract_answer` siempre devuelve la mejor oración (posiblemente débil), nunca `""`.
- ✅ Terminar con Ctrl-D sale limpiamente sin traceback.

**🤔 Pregunta(s) socrática(s)**

- La CLI compone cuatro módulos pero depende de ellos *por nombre de archivo*. ¿Qué se rompería si un compañero renombrara `answer.py` a `answers.py` — y qué te dice eso sobre importar módulos completos versus importar funciones?
- La transcripción de la sesión es determinista *porque* el corpus y el índice son deterministas. ¿Cuál es la primera cosa que hace la salida no determinista (pista: el `sorted()` del Paso 1 y el top-3 fijo del Paso 5) — y qué elección protege tus pruebas?

## ⚠️ Errores comunes

- **Ids de chunk desde rutas.** `f"{path}"` sella `docs/gecko.md#0` en cada id y rompe silenciosamente el contrato de citas. Usa `path.name` — corto, estable, legible por humanos.
- **Puntuar antes de normalizar.** Los recuentos crudos de términos hacen que el chunk de gecko de 25 palabras parezca más fuerte que el de hamster de 21 palabras por el mismo acierto único. Divide por la longitud del chunk, o la "calidad de recuperación" que depuras es mayormente "sesgo de longitud".
- **Re-indexar por consulta.** Un índice construido dentro de `search()` corre la parte cara en cada pregunta. Construye una vez, consulta muchas — el `main()` de la CLI lo carga antes del bucle exactamente por esa razón.
- **Oraciones que eran conscientes de puntuación y luego no.** `text.split(". ")` se pierde `!`, `?` y el espacio en blanco al final; el lookbehind `(?<=[.!?])\s+` los maneja los tres. Divide descuidadamente, responde tarde.
- **Tratar el índice como la respuesta.** El índice encuentra chunks; `extract_answer` elige oraciones; ninguno "entiende". Si una respuesta de demo está mal, verifica si la búsqueda clasificó correctamente y si el puntuador de oraciones colocó mal los términos — el bug suele estar una capa más abajo que el síntoma.

## Lo que acabas de construir

Un motor de recuperación de cuatro capas sin dependencias: fragmentador → índice invertido → clasificador → extractor, envuelto en una CLI interactiva, y cada respuesta cita su archivo fuente. La arquitectura transferible es el *recuerdo en capas*: nunca le pides al índice una respuesta — le pides candidatos, puntúas los candidatos, y extraes del mejor. Intercambia el fragmentador, el puntuador (IDF, BM25) o el extractor (sumarizador) de forma independiente, y la forma del pipeline — candidatos, no respuestas — es lo que sobrevive.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/document-qa-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/document-qa-engine) en el repositorio del curso tiene los scripts completos más el mismo corpus de tres archivos. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Añade **ponderación IDF**: los términos raros aumentan el puntaje de un chunk mientras que los ubicuos (`the`) lo encogen — el salto de precisión más grande en menos de una docena de líneas en `search`.
- Mueve el fragmentador a **unidades de oración**: divide con `sentences()` en `load_corpus` para que "qué oración menciona X" esté precalculado, quemando memoria de chunks por calidad de respuesta.
- Añade una **tabla de sinónimos** map (`lizard → gecko`, `crustacean → hermit crab`) expandida en tiempo de indexado — recall barato, y la siguiente ganancia natural en respuestas.
- Persiste el índice (**dump/load de `index.json`**) para que un corpus grande se construya una vez y `ask.py` reinicie al instante sin releer cada archivo.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓