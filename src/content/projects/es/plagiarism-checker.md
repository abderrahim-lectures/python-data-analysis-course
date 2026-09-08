---
title: "Detector de Plagio"
description: "Detecta plagio en presentaciones de texto con puntuación de similitud e identificación de fuentes."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "text-processing", "algorithm", "csv"]
learningObjectives:
  - "Normalizar el texto por mayúsculas/minúsculas y tokenización de palabras"
  - "Construir un conjunto de shingles (n-gramas) para un documento"
  - "Puntuar la similitud por pares con la intersección de Jaccard entre conjuntos de shingles"
  - "Ejecutar un informe por lotes sobre un corpus y marcar pares de alta similitud"
prerequisites: ["python-101/strings", "python-101/sets", "python-101/loops", "python-101/functions"]
---

# 🔍 Construye un Detector de Plagio

Cada plataforma de tareas se centra en un solo número: cuánto de este ensayo se copió. Detrás de ese número hay un algoritmo sorprendentemente simple y honesto — el **shingle**. Un documento se trocea en secuencias de palabras superpuestas de longitud N, y dos documentos se comparan por cuántas de esas secuencias comparten. Este proyecto construye un CLI que puntúa un ensayo contra todo un corpus de documentos fuente — convirtiendo texto crudo en conjuntos de tokens, calculando una similitud de Jaccard para cada par e imprimiendo un informe ordenado con los pares sospechosos arriba. Sin ML, sin API, sin magia.

Esto asume Python 101 — cadenas, conjuntos, bucles y funciones. Nada más allá de eso. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Tokenizar y normalizar un documento en listas de palabras en minúsculas.
2. Trocear un documento en shingles superpuestos de N palabras (la "huella digital" del texto).
3. Calcular una puntuación de similitud entre dos documentos como el solapamiento de Jaccard de sus conjuntos de shingles.
4. Ejecutar un ensayo contra todo un corpus de fuentes y ordenar cada par por puntuación.
5. Marcar los pares por encima de un umbral e imprimir un informe legible — más las frases superpuestas exactas como evidencia.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal aquí — este es un algoritmo de texto puro y stdlib pura sobre archivos que controlas, así que "deja dos ensayos en una carpeta, ejecuta un comando, obtén el informe" es exactamente el flujo de trabajo para el que está hecho, y los archivos de salida aterrizan en un sistema de archivos real.

**GitHub Codespaces** es la misma experiencia: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y los comandos de abajo se ejecutan en una pestaña del navegador con Node, Python y `uv` preinstalados.

**Google Colab, Kaggle Notebooks y Binder ejecutan todo el pipeline con honestidad** — normalización, shingling, puntuación de Jaccard, informes — contra el corpus de muestra incluido en el curso, porque nada aquí necesita una GPU, una clave o un archivo grande. La salvedad honesta es el alcance: el notebook puntúa los ensayos de muestra fijos en lugar de tu propia carpeta de presentaciones, así que piensa en él como la pista de pruebas del algoritmo, y pasa a local cuando quieras ejecutarlo sobre documentos reales.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/plagiarism-checker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/plagiarism-checker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fplagiarism-checker%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de puntuar una sola frase: `uv`, y un corpus pequeño con un ensayo obviamente copiado más dos honestos.

### Instala `uv` y crea el andamiaje

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego:

```bash
uv --version
mkdir plagiarism-checker && cd plagiarism-checker
uv init --bare
```

Cero paquetes extra — biblioteca estándar pura.

### Construye el corpus de fuentes

Escribe tres documentos fuente en `sources/` (cópiame estas tal cual):

`sources/origin_ecology.txt`:

```
The kelp forest is a foundation of coastal biodiversity. Otters control the
urchin population, and where otters vanish the urchins strip the kelp to bare
rock. Removing one species can collapse an entire ecosystem within a decade.
```

`sources/origin_urbanism.txt`:

```
Cities concentrate talent because dense proximity lowers the cost of exchanging
ideas. A walking neighborhood outperforms a highway suburb at innovation, since
casual collisions between workers seed collaborations that commuting never allows.
```

`sources/origin_renewables.txt`:

```
Solar generation rises in the late morning and peaks at noon, while wind output
tends to strengthen overnight. Storage smooths the daily gap, but a grid that
overbuilds one intermittent source still faces scarcity in the other's trough.
```

Ahora escribe un ensayo que esté **obviamente plagiado** de la primera fuente, y un segundo que sea una versión honesta y original. Luego ejecútalos a ambos desde una carpeta `submissions/`:

`submissions/essay_ours.txt`:

```
The kelp forest is a foundation of coastal biodiversity. Otters control the
urchin population, and where otters vanish the urchins strip the kelp to bare
rock. I would also argue that rewilding otter populations is the cheapest
conservation investment we can make in temperate seas.
```

`submissions/essay_original.txt`:

```
I want to write about where we keep losing coastlines, and why a single fishy
manager per hectare beats ten committees. The short answer is that small teams
acting locally catch damage faster, and I will defend that claim from my own
observations of tidal restoration projects this year.
```

```bash
mkdir sources submissions
# save the three files into sources/ and the two into submissions/
ls sources submissions
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `sources/` contiene tres documentos de origen distintos y `submissions/` un ensayo con sensación de copiado y uno original.
- ✅ Ya sabes — solo con leer — que `essay_ours.txt` debería puntuar alto contra `origin_ecology.txt`. El Paso 4 existe para confirmar que el número coincide con tu intuición.

## Paso 1: Normaliza y tokeniza el texto

La detección de plagio es ruidosa antes de ser precisa: los ensayos difieren en mayúsculas, puntuación y saltos de línea incluso cuando las palabras son idénticas. El primer paso elimina todo eso — poner todo en minúsculas, dividir en palabras, quitar la puntuación — para que "The Kelp" y "the kelp" sean finalmente las mismas dos palabras.

### 1.1 Escribe el tokenizador

```python
# normalize.py
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    text = text.lower()
    words = re.findall(r"[a-z']+", text)
    return words

def load_document(path: str) -> list[str]:
    return tokenize(Path(path).read_text(encoding="utf-8"))

if __name__ == "__main__":
    toks = load_document("submissions/essay_ours.txt")
    print(f"{len(toks)} tokens")
    print(toks[:12])
```

`re.findall(r"[a-z']+", text)` — después de pasar a minúsculas — es toda la normalización: conserva solo ejecuciones de letras y apóstrofos, así que comas, puntos y saltos de línea desaparecen mientras que `don't` sobrevive como un token (importa para hacer coincidir "don't" consigo mismo, no para la puntuación). El patrón produce la *lista* de tokens directamente — sin dividir, sin pase de filtrado — lo que es a la vez más rápido y más correcto que `text.split()` + quitar.

**👟 Pista inicial :** Ejecuta el tokenizador sobre el ensayo copiado y cuenta — buscas que "the kelp forest is a foundation of coastal biodiversity" salga como 9 tokens limpios, no 12 con fragmentos de puntuación.

**🎯 Resultado esperado :** `35 tokens` (aproximadamente) para `essay_ours.txt`, y los primeros 12 tokens leen `['the', 'kelp', 'forest', 'is', 'a', 'foundation', 'of', 'coastal', 'biodiversity', 'otters', 'control', 'the']` — sin `'` ni `,` en ninguna parte.

**🩹 Si sale mal :** Si los tokens aún contienen puntuación, la regex se ejecutó antes de `lower()` o no encontró nada que quitar — la clase `[a-z']+` solo coincide con letras, así que cualquier otra cosa ya se descartó. Si desaparecieron números que te importan (`2026`), la clase excluye deliberadamente dígitos — decide, y documenta, si los años y los conteos importan para tu corpus (normalmente no para la prosa).

### 1.2 Verifica la normalización

**✅ Lista de verificación**

- ✅ `tokenize("The Kelp. Forest!")` devuelve `['the', 'kelp', 'forest']` — 3 tokens, todos en minúsculas, sin puntuación.
- ✅ `tokenize("don't stop")` conserva `don't` como un solo token.
- ✅ El conteo de tokens para el mismo texto es idéntico sin importar cómo caigan los saltos de línea — la normalización borra el formato, no el contenido.

**🤔 Pregunta(s) socrática(s)**

- Descartamos números y aislamos `don't`. Para prosa con guiones, un término compuesto como `**self-organized**` se tokeniza como `self` y `organized` — dos tokens que nunca coinciden con `self-organized` con guion de la fuente. ¿Es una coincidencia que querrías conservar, y cuál es la forma normalizada (pista: quita el guion por un espacio o conserva la unión) que la preserva?
- `re.findall` pasa a minúsculas reescribiendo toda la cadena primero. Si un documento fuera de 10 MB, ¿a dónde va la memoria — y cuál es la alternativa de una sola bandera de `re` (`re.IGNORECASE`) que evita la copia si alguna vez te importara?

## Paso 2: Trocea un documento en shingles

Las palabras crudas son demasiado granulares: dos documentos que comparten la palabra "the" comparten mucho sin ser similares. La solución es el **shingle** — una ventana superpuesta de N palabras consecutivas — donde dos documentos son similares solo cuando comparten *ventanas enteras*, docenas de palabras, en el mismo orden relativo. Esta es la única idea sobre la que se construye todo el verificador.

### 2.1 Construye la ventana de shingles

```python
# shingle.py
from normalize import tokenize
from pathlib import Path

N = 4

def shingles(tokens: list[str], n: int = N) -> set[tuple]:
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

if __name__ == "__main__":
    toks = tokenize(Path("submissions/essay_ours.txt").read_text())
    print(f"{len(toks)} tokens -> {len(shingles(toks))} shingles of size {N}")
    print(sorted(shingles(toks))[:2])
```

`tuple(tokens[i:i+n])` sobre `range(len(tokens) - n + 1)` es la ventana deslizante: para un documento de 35 tokens y n=4, son 32 ventanas, cada una el trozo de 4 palabras que empieza en la posición i. El *conjunto* (set) es deliberado — el verificador pregunta "¿qué ventanas existen aquí?", no "¿cuántas veces?" — y la semántica de conjunto es lo que hace que el solapamiento de Jaccard del Paso 3 sea una sola línea.

**👟 Pista inicial :** Antes de ejecutar, predice: para 35 tokens y n=4 esperas `35 - 4 + 1 = 32` shingles. Verifica que el conteo aterrice exactamente ahí, luego prueba n=3 y siente cómo el conjunto *crece*.

**🎯 Resultado esperado :** `35 tokens -> 32 shingles of size 4`, y los dos primeros shingles son 4-tuplas como `('the', 'kelp', 'forest', 'is')`.

**🩹 Si sale mal :** Si el conteo es 35, tu ventana es `tokens[i:i+n]` sobre `range(len(tokens))` sin el `- n + 1` — las últimas tres ventanas son trozos cortos que no deberían existir; el `- n + 1` es el off-by-one que hace cada ventana exactamente de n palabras. Si los shingles parecen cadenas en lugar de tuplas, envolviste el trozo en `tuple()` pero devolviste una lista — los conjuntos necesitan miembros hashables, y un conjunto de listas lanza `TypeError`.

### 2.2 Verifica el shingling

**✅ Lista de verificación**

- ✅ Un documento de 35 tokens con n=4 produce exactamente 32 shingles; n=3 produce 33; n=35 produce... 1. Ejecuta los tres y confirma el patrón `len - n + 1`.
- ✅ Cada shingle es una tupla de exactamente `n` palabras — sin colas cortas, sin duplicados en el conjunto.
- ✅ Hacer shingle del mismo documento dos veces devuelve conjuntos idénticos — la determinismo es el punto.

**🤔 Pregunta(s) socrática(s)**

- Almacenamos las 4-tuplas completas, así que la memoria crece con `len(tokens) - n + 1`. Los verificadores de plagio reales almacenan solo un *hash* de cada shingle (un entero de 64 bits) — ¿qué se rompe si dos 4-tuplas diferentes chocan al mismo hash, y por qué vale la pena ese intercambio a escala de corpus?
- El tamaño de ventana n es la única perilla libre de toda esta herramienta. ¿Qué cambia sobre la sensibilidad a medida que n se encoge (n=2: solapamiento disparatado entre dos ensayos cualquiera) frente a que crece (n=12: solo coinciden las citas textuales)? Escribe la frase que esperarías que se "capturara" a n=4 pero se "perdiera" a n=8.

## Paso 3: Puntúa la similitud entre dos documentos

Dos documentos son "similares" cuando sus conjuntos de shingles se solapan mucho. La medida estándar es **Jaccard**: tamaño de la intersección dividido por el tamaño de la unión — un número entre 0 y 1 que es el mismo ya sean ambos documentos cortos o largos, porque la unión normaliza la longitud. 1.0 es idéntico, 0.0 es no compartir ninguna ventana en absoluto.

### 3.1 Calcula la puntuación de Jaccard

```python
# score.py
from shingle import shingles, N
from normalize import load_document

def jaccard(a: set, b: set) -> float:
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 1.0

def score_pair(path_a: str, path_b: str) -> float:
    return jaccard(shingles(load_document(path_a)), shingles(load_document(path_b)))

if __name__ == "__main__":
    print("ours vs ecology:", round(score_pair("submissions/essay_ours.txt",
                                               "sources/origin_ecology.txt"), 3))
    print("ours vs renewables:", round(score_pair("submissions/essay_ours.txt",
                                                  "sources/origin_renewables.txt"), 3))
    print("ours vs itself:", round(score_pair("submissions/essay_ours.txt",
                                              "submissions/essay_ours.txt"), 3))
```

`a & b` y `a | b` son la intersección y la unión de conjuntos — los operadores de Python leen exactamente como las matemáticas, y la protección `if union else 1.0` maneja dos documentos vacíos (ambas uniones están vacías: define ese caso límite como "idéntico", o dividirías por cero). El codo de la curva es el momento de aprendizaje: `essay_ours` comparte ~9 shingles con los ~40 de ecology, mientras que el vocabulario de propósito general ("I would also argue that...") comparte cero con renewables.

**👟 Pista inicial :** Calcula `essay_ours` contra ecology *a mano* primero: cuenta las ventanas de 4 palabras compartidas en el solapamiento de los dos primeros párrafos, luego comprueba que la herramienta coincidió dentro del redondeo.

**🎯 Resultado esperado :** `ours vs ecology: ≈0.31`, `ours vs renewables: 0.0` (sin ventanas compartidas), `ours vs itself: 1.0`. La puntuación exacta de ecology aterriza entre 0.25 y 0.4 — por encima de cero, muy por debajo de uno, claramente *diferente* del cero de renewables.

**🩹 Si sale mal :** Si la puntuación de ecology también es 0.0, las dos tokenizaciones difieren en algún lugar — un guion o apóstrofo en un archivo que el otro no tiene; imprime ambas listas de tokens y haz un diff (la solución suele ser un carácter en el texto fuente). Si `ours vs itself` no es 1.0, `jaccard` no está comparando el mismo par de conjuntos — comprueba que estás haciendo shingle del *mismo* archivo dos veces en lugar de dos rutas diferentes.

### 3.2 Verifica la puntuación

**✅ Lista de verificación**

- ✅ `score_pair(essay_ours, origin_ecology)` ≈ 0.31 — solapamiento no trivial, ni de cerca 1.
- ✅ `score_pair(essay_ours, origin_renewables)` == 0.0 exactamente.
- ✅ `score_pair(x, x) == 1.0` para cualquier documento — el caso de identidad es la comprobación de cordura.
- ✅ Dos documentos *completamente no relacionados* puntúan exactamente 0.0, no un suelo de ruido pequeño pero positivo.

**🤔 Pregunta(s) socrática(s)**

- Jaccard divide por la unión, así que un *párrafo copiado oculto en un ensayo original largo* puntúa más bajo que un ensayo corto que lo copia entero. ¿Cuál dirección es el "falso negativo" — y qué denominador (pista: intersección ÷ el tamaño del *acusado*) preferiría ver un profesor para decidir si leer de cerca?
- La identidad "ours vs itself = 1.0" es tautológicamente cierta para archivos idénticos. Pero un archivo re-guardado con 100 líneas en blanco insertadas tiene los *mismos tokens* (la normalización las borra) — así que también puntúa 1.0. ¿Es esa sobre-coincidencia correcta para una herramienta de plagio, y qué tendrías que cambiar para detectar copias con el diseño alterado?

## Paso 4: Compara un ensayo contra todo el corpus

Puntuar un solo par es la primitiva; marcar una presentación es el producto. Este paso ejecuta un ensayo contra cada documento fuente, conserva la puntuación de cada par, ordena descendente e imprime un informe ordenado — el bucle que convierte `score_pair` en una comprobación de plagio.

### 4.1 Ordena cada par candidato

```python
# checker.py
from pathlib import Path
from score import jaccard
from shingle import shingles, N
from normalize import load_document

def check_against(essay: str, sources_dir: str) -> list[dict]:
    essay_sh = set(shingles(load_document(essay)))
    results = []
    for src in sorted(Path(sources_dir).glob("*.txt")):
        src_sh = set(shingles(load_document(str(src))))
        score = jaccard(essay_sh, src_sh)
        if score > 0:
            results.append({"source": src.name, "score": score})
    return sorted(results, key=lambda r: -r["score"])

if __name__ == "__main__":
    essay = "submissions/essay_ours.txt"
    for r in check_against(essay, "sources"):
        print(f"{r['score']:.3f}  {r['source']}")
```

Dos hábitos que vale la pena copiar: los documentos fuente se **hacen shingle una vez cada uno** (fuera del trabajo por par — sin re-leer ni re-hacer shingle tres veces), y el conjunto de shingles del ensayo se calcula *una vez* antes del bucle, no dentro de él. La clave de ordenación `-r["score"]` es solo la ordenación descendente de Python, y el filtro `score > 0` mantiene el informe legible — las fuentes irrelevantes quedan fuera de la lista ordenada en lugar de rellenarla con docenas de filas `0.000`.

**👟 Pista inicial :** Ejecútalo para `essay_ours` — la fuente de ecology debería ser la única fila, `0.31`. Luego ejecuta `check_against("submissions/essay_original.txt", "sources")` y confirma que no imprime nada en absoluto.

**🎯 Resultado esperado :** Para `essay_ours.txt`: exactamente una fila `≈0.310  origin_ecology.txt`. Para `essay_original.txt`: sin salida — el ensayo no comparte ninguna ventana de 4 palabras con ninguna fuente.

**🩹 Si sale mal :** Si ambos ensayos imprimen `0.000`, tu ensayo se tokenizó con un redactado diferente del que crees — imprime los tokens y compara contra los del corpus (un apóstrofo o guion perdido es el sospechoso habitual). Si `essay_original` muestra una puntuación no cero, los dos *deberían* ser cero — lee el shingle solapado: probablemente reutilizaste una frase del enunciado, y la herramienta ya ha encontrado una coincidencia real (aunque inocente).

### 4.2 Verifica la comprobación del corpus

**✅ Lista de verificación**

- ✅ `essay_ours` ordena `origin_ecology` primero (y solo) en ≈0.31.
- ✅ `essay_original` no coincide con nada — salida limpia, informe vacío.
- ✅ El orden de la carpeta fuente en disco no afecta el orden de salida — la ordenación es por puntuación, calculada por `key=lambda r: -r["score"]`.
- ✅ Cada fuente se hizo shingle una vez, no una vez por ensayo — la estructura del bucle lo garantiza.

**🤔 Pregunta(s) socrática(s)**

- El informe muestra solo filas `score > 0`. ¿Qué se pierde al ocultar los ceros — específicamente, ¿podrías aún *defender* una conclusión de 0.0 si la herramienta simplemente omitió la fila? ¿En qué sería mejor un informe que siempre liste cada fuente (con puntuaciones)?
- `check_against` hace shingle de cada fuente mientras la itera — eso es "perezoso" y está bien a escala de corpus, pero un `check_all(corpus_dir)` que precompute un dict de `nombre → conjunto de shingles` es la forma que usa un verificador real. Nombra la propiedad concreta de velocidad o corrección que compra la precomputación (pista: nada aquí, pero un corpus en crecimiento cambia la estructura del bucle).

## Paso 5: Marca los pares sospechosos y muestra la evidencia

Una lista de puntuaciones ordenadas es un hallazgo; **las frases solapadas son la evidencia** — la diferencia entre "confía en mí, 0.31" y "aquí están las tres frases que copió". Este paso imprime, para cada par marcado, las ventanas compartidas reales que produjeron la puntuación, para que un profesor pueda *verificar* el número antes de actuar sobre él.

### 5.1 Imprime las ventanas coincidentes

```python
# evidence.py
from pathlib import Path
from shingle import shingles, N
from normalize import load_document
from score import jaccard

THRESHOLD = 0.25

def evidence(essay: str, sources_dir: str) -> None:
    essay_sh = set(shingles(load_document(essay)))
    for src in sorted(Path(sources_dir).glob("*.txt")):
        src_sh = set(shingles(load_document(str(src))))
        score = jaccard(essay_sh, src_sh)
        if score < THRESHOLD:
            continue
        shared = essay_sh & src_sh
        print(f"\n{essay}  vs  {src.name}  score={score:.3f}  ({len(shared)} shared windows)")
        for sh in sorted(shared)[:5]:
            print("   " + " ".join(sh))

if __name__ == "__main__":
    evidence("submissions/essay_ours.txt", "sources")
```

La línea `shared = essay_sh & src_sh` es la joya: la misma intersección que produjo la puntuación también es la lista de evidencia, así que el número del informe y sus citas nunca pueden discrepar — son literalmente el mismo conjunto. El tope `sorted(shared)[:5]` (un puñado de ejemplos, no cada ventana) mantiene la salida escaneable mientras el conteo `len(shared)` sigue siendo honesto en el encabezado.

**👟 Pista inicial :** Ejecútalo y luego lee en voz alta las ventanas impresas de 4 palabras — cada una debería ser una *frase* genuina de tu ensayo que también existe en la fuente, no una ejecución de stopwords coincidente por casualidad como "the kelp forest is".

**🎯 Resultado esperado :** Un encabezado para `grass_ours vs origin_ecology.txt` en ≈0.31 con el conteo de ventanas compartidas, seguido de ventanas de ejemplo ordenadas — las primeras siendo variantes de `the kelp forest is a`, `otters control the urchin`, `urchins strip the kelp to` — y *sin salida para las otras dos fuentes*.

**🩹 Si sale mal :** Si no se imprime nada aunque el Paso 4 mostró 0.31, `THRESHOLD = 0.25` está por encima de la puntuación — baja la constante, no borres la compuerta; la compuerta es lo que mantiene honesto el informe. Si las ventanas incluyen `is a foundation of` (una frase genérica), es una coincidencia verdadera — los verificadores de plagio reales filtran ventanas cargadas de stopwords igual que tú aprenderías a leerlas con escepticismo.

### 5.2 Verifica el informe de evidencia

**✅ Lista de verificación**

- ✅ Cada par marcado muestra puntuación + un conteo de ventanas compartidas + frases de ejemplo legibles.
- ✅ Las frases impresas son solapamientos genuinos que puedes verificar contra ambos archivos a simple vista.
- ✅ Los pares por debajo de `THRESHOLD` nunca aparecen, y el umbral es una constante nombrada, no un número mágico.
- ✅ La puntuación del encabezado coincide exactamente con el número del Paso 4 para el mismo par — la intersección es el mismo conjunto ambas veces.

**🤔 Pregunta(s) socrática(s)**

- Imprimimos las primeras 5 ventanas ordenadas como ejemplos. ¿Qué pasa si la ventana *más condenatoria* es la 31? ¿Cuál es el cambio (ordenar por algo distinto del alfabeto, o informar la *ejecución más larga* de ventanas solapadas) que saca a la luz primero la evidencia más fuerte?
- `THRESHOLD` decide quién sale nombrado. Dos humanos con la misma herramienta podrían elegir 0.2 y 0.3. ¿Qué contribuye la impresión de evidencia que permite a un *profesor* anular el umbral — y es "marcar todo, dejar que la evidencia arbitre" un diseño alternativo defendible?

## ⚠️ Errores comunes

- **El problema de la ventana sobre-coincidente "the/a/of".** A n=2 o n=3, cada par de ensayos en inglés comparte shingles hechos de stopwords puras ("the kelp", "is a"), y la puntuación afirma similitud donde no existe ninguna. El núcleo de la solución es un n mayor (4+ para prosa) o descartar los shingles cuyas palabras están todas en un conjunto de stopwords antes de intersecar.
- **Deriva de normalización entre archivos.** Un archivo dice "self-organized", el otro "self organized"; uno usa comillas inteligentes "’", el otro ASCII. El verificador entonces ve *tokens diferentes* y pierde una copia obvia. Normaliza ambos lados con el mismo tokenizador, *y* normaliza el corpus una vez (almacena las listas de tokens), para que los dos nunca diverjan a mitad de ejecución.
- **Off-by-one en la ventana deslizante.** `range(len(tokens) - n + 1)` no perdona: olvida el `- n + 1` y las últimas ventanas son trozos cortos que no coinciden con nada y bajan silenciosamente cada puntuación. Prueba el conteo (Paso 2.2) antes de confiar en cualquier número posterior.
- **El párrafo copiado ahogado en un ensayo largo.** La unión de Jaccard promedia todo lo que tienen la fuente *y* el ensayo, así que un párrafo textual del 40% dentro de un ensayo original largo puede puntuar 0.15 y colarse bajo cualquier umbral razonable. Informa *tanto* Jaccard como el `shared_window_count` crudo — el conteo es la señal más fuerte de "ve a leerlo".
- **Olvidar que el umbral es un juicio, no una ley.** Una puntuación de 0.24 y 0.26 son el mismo caso; un umbral de 0.25 es una línea que trazaron humanos, no un oráculo. El trabajo de la herramienta es *ordenar y mostrar evidencia*, y el de un profesor juzgar — la impresión de evidencia (Paso 5) existe precisamente para que la herramienta nunca tenga que fingir una autoridad que no tiene.

## Lo que acabas de construir

Un detector de plagio funcional: tokenizador, shingler, puntuador de Jaccard, informe de todo el corpus y una impresión de evidencia que muestra las frases exactas detrás de cada puntuación. El ensayo copiado se enciende en 0.31; el ensayo original puntúa un cero plano; y *tú* puedes reproducir cada número a mano, porque todo el algoritmo es aritmética de conjuntos sobre palabras. La habilidad transferible es el shingling mismo — la idea de "huella de ventana superpuesta" está bajo la detección de plagio, la deduplicación web de casi-duplicados, la comparación difusa de archivos y las líneas base de la mayoría de los sistemas de búsqueda semántica, y ahora puedes construir toda la cadena desde texto crudo en lugar de importar el `similarity_score` de otro.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/plagiarism-checker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/plagiarism-checker) en el repositorio del curso agrupa los módulos de tokenizador, shingler, puntuador, verificador y evidencia más el corpus de muestra y un notebook que ejecuta cada paso en orden. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y puntúa los ensayos incluidos en una pestaña del navegador.
:::

## A dónde ir desde aquí

- **Agrupación difusa de sospechosos:** ejecuta cada documento contra los demás (ensayo-vs-ensayo, no solo ensayo-vs-fuente) e imprime "este par de estudiantes comparte 0.4" — el bucle del Paso 4, cruzado consigo mismo, con un `if` que salta cada documento contra sí mismo.
- **Evidencia normalizada por longitud:** informa `shared_count / len(essay_shingles)` como el ángulo de "cuánto de *tu* ensayo está copiado" — el cambio de denominador que insinué en el Paso 3, y el número que un profesor lee primero realmente.
- **Una bandera `--min-shared-windows`** que marque por conteo de solapamiento crudo en lugar de por proporción, para que una sola copia de media página en una fuente grande aún salga a la luz — la solución dura para el escollo del "párrafo ahogado".
- **Pruébalo con ruido de inicio real:** ejecuta el verificador sobre una carpeta de *notas de lectura* que escribiste para dos cursos, y prepárate para la sorpresa honesta — tu propio resumen de una fuente puntúa 0.2+. Eso no es un bug; es la herramienta midiendo correctamente lo que significa "recordar una fuente".

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso — un verificador que atrapó un solapamiento real, un informe de evidencia en el que confiarías? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo agregar el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
