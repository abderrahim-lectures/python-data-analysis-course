---
title: "Motor de Búsqueda Semántica"
description: "Construye un motor de búsqueda que entiende significado, no solo palabras clave, para cualquier colección de documentos."
difficulty: "advanced"
estimatedMinutes: 240
tags: ["machine-learning", "numpy", "embeddings", "search", "cosine-similarity", "sentence-transformers"]
learningObjectives:
  - "Integra una pequeña colección de documentos en vectores densos con un modelo transformer alojado"
  - "Almacena y consulta la matriz de embeddings con NumPy"
  - "Clasifica documentos por similitud coseno con una consulta en lenguaje natural"
  - "Diagnostica cuándo las palabras clave superan a la semántica (y viceversa) con una sonda híbrida"
prerequisites: ["python-101/libraries", "numpy-101/arrays", "data-analysis/pandas"]
---

# 🧠 Construye un Motor de Búsqueda Semántica

La búsqueda por palabras clave es literal: escribe "motor de auto" y el sistema busca esos dos tokens exactos. La búsqueda semántica es *perezosa con el lenguaje*: escribe "máquina de vehículo" y debería encontrar igualmente el párrafo sobre motores, porque representa el significado como un vector en un espacio de alta dimensión donde las ideas similares se sientan cerca. En 2026 ese truco corre en modelos transformer pequeños que puedes ejecutar en un notebook, así que todo el pipeline cabe en tus manos: integra una colección de documentos en vectores densos, consérvalos en una matriz NumPy y luego responde una consulta en lenguaje natural calculando qué párrafos integrados están más cerca en distancia coseno. Este proyecto construye ese motor de punta a punta, luego confronta el límite honesto, cuando el brillo semántico falla y una coincidencia de palabras clave simple gana en un nombre propio, y te muestra cómo una sonda híbrida detecta en qué régimen estás.

Esto asume Python 101 más los módulos del curso de NumPy y pandas. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Cargar una colección pequeña y real de trozos de documentos e inspeccionarlos.
2. Integrar cada trozo en un vector denso con un modelo transformer pequeño.
3. Almacenar los vectores en una matriz NumPy y normalizarlos una vez.
4. Responder consultas en lenguaje natural clasificando la similitud coseno con el embedding de la consulta.
5. Construir un híbrido de palabras clave vs semántica y encontrar la consulta donde cada enfoque gana.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal para el modelo *pequeño*, `sentence-transformers` descarga un modelo de ~100 MB una vez, luego integra y busca en CPU en milisegundos. `uv add sentence-transformers numpy pandas` cubre todo; la primera ejecución descarga los pesos, las siguientes usan la caché.

**GitHub Codespaces** da la experiencia idéntica: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y los mismos comandos corren en una pestaña del navegador contra un corpus pequeño empaquetado.

**Google Colab, Kaggle Notebooks y Binder manejan este proyecto mejor que cualquier otro del curso**, un transformer pequeño corre feliz en la CPU gratuita de Colab/Kaggle (a veces CUDA), el modelo clase-`all-MiniLM-L6-v2` se descarga automáticamente y el bucle completo integrar→buscar se renderiza en línea con los vectores visibles. La única advertencia honesta: descargas los pesos en la primera ejecución (unos pocos cientos de MB), y si estás sin conexión, el modelo no cargará, así que las partes de *matemática vectorial pura* siguen funcionando con `numpy` que hayas precalculado, pero el paso de integración en vivo necesita un alcance de red hasta Hugging Face.

[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/semantic-search-engine/notebook.es.ipynb)
[![Abrir en Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/semantic-search-engine/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsemantic-search-engine%2Fnotebook.es.ipynb)

## Configuración

Cadena de herramientas, una librería con una descarga de modelo y un corpus pequeño de trozos de documentos para buscar.

### Instala `uv` y `sentence-transformers`

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
mkdir semantic-search-engine && cd semantic-search-engine
uv init --bare
uv add sentence-transformers numpy pandas
```

Descarga del modelo en la primera ejecución (una vez):

```python
# fetch_model.py
from sentence_transformers import SentenceTransformer
SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
print("model ready")
```

```bash
uv run python fetch_model.py
```

### Corpus de muestra diminuto

El repositorio del curso incluye una pequeña colección de párrafos cortos de "datos sobre animales", lo suficientemente concretos para distinguir la semántica de las palabras clave:

```python
# corpus.py
CORPUS = {
    0: "Dolphins communicate using clicks and whistles underwater.",
    1: "The tallest mountain on Earth is Mount Everest in Asia.",
    2: "Octopuses have three hearts and blue blood.",
    3: "Cats spend most of their day sleeping.",
    4: "Mount Kilimanjaro is a dormant volcano in Africa.",
    5: "Dogs are descendants of gray wolves, domesticated over thousands of years.",
}
```

Siéntete libre de cambiar por tu propio texto (notas del curso, historias), cualquier trozo corto funciona.

**✅ Lista de verificación**

- ✅ `uv --version` imprime una versión; `sentence-transformers`, `numpy`, `pandas` instalados.
- ✅ `uv run python fetch_model.py` imprime `model ready` (unos pocos cientos de MB cacheados en la primera ejecución).
- ✅ Tu corpus es un dict de Python con unos pocos strings de trozos cortos.

## Paso 1: Carga e inspecciona los trozos

Antes de que cualquier matemática toque un modelo, mira el material crudo, el corpus es pequeño a propósito, para que puedas *conocer* cada trozo a simple vista. El hábito de "imprime tus datos antes de transformarlos" es lo que separa un script que confía en el modelo de uno que puede *leer* los insumos del modelo.

**👟 Pista inicial:** Empieza importando `CORPUS`, construyendo listas paralelas `ids` y `texts` desde sus claves y valores, e imprimiendo el conteo de trozos con el texto de cada trozo antes de que corra cualquier integración.

```python
# search.py
from corpus import CORPUS

ids = list(CORPUS.keys())
texts = list(CORPUS.values())
print(f"{len(ids)} chunks, {sum(len(t.split()) for t in texts)} words total")
for i, (cid, t) in enumerate(CORPUS.items()):
    print(f"{cid:>2}  {t[:70]}")
```

El mapeo `id → text` es la referencia que mantendrás a través de cada paso posterior: el *embedding* es la forma legible por máquina, pero el *texto* es la respuesta orientada a humanos, y un motor de búsqueda devuelve el que cree que una persona quiere leer. Mantener `ids` y `texts` como listas paralelas (o el dict con el que empezaste) es la disciplina que te impide devolver "vector 14.7" cuando el usuario hizo una pregunta.

**🎯 Resultado esperado:** Un conteo (6 trozos, ~40 palabras en total) y una lista numerada de los strings de los párrafos, el contenido exacto que buscarás en los Pasos 2–5.

**🩹 Si sale mal:** Si el import falla, `corpus.py` no está en la ruta de import, ejecuta desde el mismo directorio, o pon `CORPUS` directamente en `search.py`. Si la impresión muestra menos líneas de las esperadas, una barra invertida final escapó silenciosamente un salto de línea, el literal `CORPUS` necesita que `\{` se maneje; citar con `"""` es el arreglo robusto.

**✅ Lista de verificación**

- ✅ El corpus se imprime completo con ids enteros estables.
- ✅ Puedes recitar, de memoria, un trozo "complicado" (un concepto compartido como `mountains` entre 1 y 4) para probar la semántica después.
- ✅ `ids`, `texts` están sincronizados (mismo orden) para el resto del pipeline.

**🤔 Pregunta(s) socrática(s)**

- Dos trozos mencionan "mountain" (1 y 4) pero describen montañas *diferentes*. Una búsqueda por palabras clave no puede distinguirlos por ese token; ¿qué los hace *semánticamente* distintos, y por qué esa distinción es exactamente lo que se supone que capturan los embeddings?
- El corpus es diminuto. ¿Cuál es la razón *práctica* para prototipar con 6 oraciones antes de escalar a 6,000, qué bug revelaría un corpus de 6 docs que uno de 6,000 enterraría?

## Paso 2: Integra cada trozo

El salto de palabras a números es el núcleo del proyecto. Un modelo sentence-transformer lee cada trozo y produce un vector denso de tamaño fijo (aquí 384 flotantes) donde oraciones semánticamente similares aterrizan cerca y las no relacionadas aterrizan lejos. "Significado" se vuelve geometría: una dirección en el espacio de embeddings.

**👟 Pista inicial:** Empieza cargando el modelo una vez (`SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")`) y llamando a `model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)`, luego imprime `X.shape` y la norma de la primera fila.

```python
# search.py (continuación)
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed(texts: list[str]) -> np.ndarray:
    return model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)

X = embed(texts)
print("embedding matrix:", X.shape)          # (6, 384) in this model
print("row norm[0]     :", round(float(np.linalg.norm(X[0])), 4))
```

`model.encode(..., normalize_embeddings=True)` devuelve una matriz `(n_chunks, 384)`, cada fila un vector unitario (norma ≈ 1.0). Normalizar una vez al inicio significa que cada similitud posterior es un *coseno*, y con vectores unitarios, la similitud coseno colapsa en un producto punto simple, así que la aritmética de búsqueda completa del Paso 3 es un solo `X @ q`. El número de 384 dimensiones es la elección de diseño del modelo; no ajustas *eso*, eliges un modelo, pero sí *ingenieras alrededor* de su salida.

**🎯 Resultado esperado:** `embedding matrix: (6, 384)` y `row norm[0]`: `1.0` (dentro del redondeo de punto flotante).

**🩹 Si sale mal:** Si la descarga del modelo se atasca o da error, el acceso de red a Hugging Face está bloqueado, el paso `fetch_model.py` de la Configuración debe tener éxito primero; detrás de un proxy, apunta `HF_ENDPOINT` a un espejo. Si `X` no es `(6, 384)`, enrutaste los textos equivocados hacia `encode`, `convert_to_numpy=True` garantiza una matriz; una lista-de-listas descarriada significa que te perdiste la conversión de array.

**✅ Lista de verificación**

- ✅ `X.shape == (6, 384)` y cada norma de fila ≈ 1.0.
- ✅ Dos trozos semánticamente similares producen vectores cercanos, comprueba que `np.dot(X[1], X[4])` (par "mountain") es más alto que `np.dot(X[1], X[2])`.
- ✅ Puedes decir qué te compra el "vector unitario" después (coseno == producto punto).

**🤔 Pregunta(s) socrática(s)**

- `normalize_embeddings=True` fuerza longitud unitaria, así que "cuánto dijo este texto" se descarta y solo queda "hacia qué dirección apunta". ¿Cuándo sería la *longitud* una señal significativa que *querrías* conservar (una consulta que exige una respuesta súper larga y sinuosa vs una concisa)? ¿Por qué la búsqueda generalmente prefiere solo-dirección?
- El mismo modelo integra una *palabra* y su *contexto completo*. Un trozo sobre un "script python" y uno sobre una "serpiente python", mismo token, embeddings diferentes, porque el modelo mira las palabras circundantes. Traza qué significa eso para un dominio con palabras clave ambiguas, y dónde falla silenciosamente (homónimos que el modelo no ha desambiguado bien).

## Paso 3: Busca por similitud coseno

El motor, en dos líneas de matemática: integra la consulta del usuario, luego clasifica cada trozo almacenado por similitud coseno con ella. Como el Paso 2 normalizó las filas, coseno y producto punto son lo mismo, y `X @ q` devuelve un puntaje para cada trozo en un solo paso vectorizado. La clasificación es el producto completo.

**👟 Pista inicial:** Empieza escribiendo `search(query, X, texts, ids, k)` que codifica la consulta exactamente como los documentos, puntúa cada trozo con `X @ q` y devuelve el top `k` con `np.argsort(scores)[::-1]`.

```python
# search.py (continuación)

def search(query: str, X: np.ndarray, texts: list[str], ids: list[int],
           k: int = 3) -> list[tuple[int, float, str]]:
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    scores = X @ q
    order = np.argsort(scores)[::-1][:k]
    return [(ids[i], float(scores[i]), texts[i]) for i in order]

for q in ["an animal that lives in the sea", "a very tall landform", "sleeping pet"]:
    print(f"\nquery: {q!r}")
    for cid, score, text in search(q, X, texts, ids):
        print(f"   {score:>0.3f}  [{cid}] {text[:60]}")
```

La consulta sigue el *camino de integración idéntico* al de los documentos, mismo modelo, misma normalización, así que el vector de la consulta vive en el mismo espacio semántico, y `X @ q` es el producto punto de similitud coseno. `np.argsort(scores)[::-1]` clasifica descendente y corta el top `k`. El pago es visible en la primera consulta: "an animal that lives in the sea" debería clasificar el trozo del *delfín* (0) y el del *pulpo* (2), aunque ningún trozo contenga las palabras "sea" o "animal". Eso es semántica: la nube dio significado, el producto punto clasificó por él.

**🎯 Resultado esperado:** Para `"an animal that lives in the sea"`, los hits top son los trozos del delfín (0) y del pulpo (2) con puntajes muy por encima de las montañas (1, 4); para `"sleeping pet"`, el trozo del gato (3) debería encabezar, como tus palabras de consulta ("sea", "pet") no aparecen en *ningún* documento, la coincidencia es puramente semántica.

**🩹 Si sale mal:** Si la consulta del mar aterriza al fondo en los trozos de montaña, el modelo no generalizó como esperabas, prueba una consulta más idiomática ("marine creature"); la calidad del embedding varía con el fraseado. Si todos los puntajes son 0, la normalización de la consulta difiere de la del corpus, ambas deben usar `normalize_embeddings=True`. Si `np.argsort` devuelve un desajuste de forma `IndexError`, `X` y `q` no son ambos `(..., 384)`, un pipeline de modelo equivocado (p. ej. un modelo diferente que produce una dim diferente) choca; vuelve a comprobar la forma de la matriz del Paso 2.

**✅ Lista de verificación**

- ✅ La consulta del mar clasifica delfín + pulpo por encima de las montañas, significado, no tokens.
- ✅ Los puntajes están en `[0, 1]` (vectores unitarios), y el orden de clasificación es estable entre ejecuciones.
- ✅ Puedes apuntar a la línea *exacta* que hace la búsqueda (`X @ q` + `argsort`).

**🤔 Pregunta(s) socrática(s)**

- Toda la búsqueda es `X @ q` después de la normalización. Si *no* hubieras normalizado, ¿qué dos cantidades estarías mezclando (magnitud de documentos × magnitud de consulta) y por qué eso desclasificaría visiblemente un doc largo e informativo contra uno corto para el mismo tema?
- `argsort(scores)[::-1]` ordena ascendente y luego voltea. ¿Cuál es la diferencia sutil entre eso y `scores.argsort()[: -(k+1) : -1]`, y por qué funciona cualquiera aquí? (Piensa en qué hace "invertir un array ascendente ordenado" con los empates.)

## Paso 4: Un híbrido, palabras clave cuando importan

La búsqueda semántica es poderosa pero no omnipotente: cuando la consulta contiene un *nombre propio o un token exacto raro*, la coincidencia léxica puede ser más confiable que la suposición del modelo. Un motor real combina ambas, un puntaje de palabras clave (tokens exactos/solapados) fusionado con un puntaje semántico, y expone la perilla para que puedas ver ganar a cada lado. Este paso construye el híbrido y confronta el fracaso honesto.

**👟 Pista inicial:** Empieza escribiendo `keyword_score(query, text)` que cuenta los tokens de la consulta encontrados en el trozo dividido por el conteo de tokens del trozo, luego mézclalo en `hybrid(...)` como `alpha * sem + (1 - alpha) * kw`.

```python
# search.py (continuación)
import re

TOK = re.compile(r"[a-z0-9]+")

def keyword_score(query: str, text: str) -> float:
    q = set(TOK.findall(query.lower()))
    t = TOK.findall(text.lower())
    return sum(1 for w in t if w in q) / max(1, len(t))

def hybrid(query: str, X: np.ndarray, texts: list[str], ids: list[int],
           alpha: float = 0.5, k: int = 3) -> list[tuple[int, float, str]]:
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    sem = X @ q
    kw = np.array([keyword_score(query, t) for t in texts])
    blended = alpha * sem + (1 - alpha) * kw
    order = np.argsort(blended)[::-1][:k]
    return [(ids[i], float(blended[i]), texts[i]) for i in order]

for q in ["Mount Everest", "an animal that lives in the sea"]:
    print(f"\nquery: {q!r}")
    for alpha in (0.0, 1.0):
        print(f"  alpha={alpha}")
        for cid, s, text in hybrid(q, X, texts, ids, alpha=alpha):
            print(f"     {s:>0.3f}  [{cid}] {text[:50]}")
```

`keyword_score` cuenta cuántos de los tokens del trozo aparecen en la consulta, normalizado por el conteo de tokens del trozo, una señal léxica ingenua pero honesta. `hybrid` la mezcla con los puntajes semánticos (ya normalizados en `[0,1]`, así que la suma `alpha` sigue siendo comparable) y clasifica. El drama está en las dos consultas: para "Mount Everest" (un nombre propio que el modelo *puede haber visto* pero el emparejador de palabras clave clava por exactitud), la búsqueda por palabras clave `alpha=0` debería ir tan bien como o mejor que el brazo semántico; para el parafraseable "animal that lives in the sea", las palabras clave son *impotentes* (esas palabras no están en ningún documento) y solo funciona la semántica `alpha=1`. El trabajo del híbrido es sostener *ambas*, y la brecha de puntaje impresa es tu evidencia de en qué régimen estás.

**🎯 Resultado esperado:** Para "Mount Everest", el trozo de Everest (1) encabeza ambos brazos alpha, pero la *brecha* entre el rank-1 y un rank-2 (Kilimanjaro, 4) es típicamente más aguda para palabras clave (`alpha=0`); para la consulta del mar, `alpha=0` no encuentra nada (las palabras no están en ningún doc), mientras que `alpha=1` clasifica delfín+pulpo primero, los dos regímenes visibles en una tabla.

**🩹 Si sale mal:** Si la consulta del mar en `alpha=0` devuelve *algo* (un trozo con un token compartido aleatorio como "a"), tu `keyword_score` empareja artículos/stopwords, añade un pequeño filtro de stopwords, o acéptalo como el sesgo conocido del modelo y deja que la brecha te enseñe. Si "Mount Everest" clasifica *peor* en `alpha=1` que en 0, el transformer sub-pondera nombres propios raros, exactamente el fallo que remienda la búsqueda por palabras clave, que es el remate: alpha mezcla, ningún brazo siempre tiene razón.

**✅ Lista de verificación**

- ✅ Las consultas con nombres propios se clasifican bien vía palabras clave; las parafraseables solo vía semántica.
- ✅ `alpha` desplaza visiblemente la clasificación entre las dos clases de consulta.
- ✅ `keyword_score` está acotado en `[0, 1]`, mismo rango que `sem`, así que la mezcla es manzanas con manzanas.

**🤔 Pregunta(s) socrática(s)**

- La mezcla asume que ambos puntajes viven en `[0, 1]`. `keyword_score` divide por la longitud del trozo para que los docs largos no ganen por volumen. Pero ¿*qué* cuesta normalizar por max(1, len) cuando un trozo de 3 palabras merece coincidir, y no es el *sin*-normalizar "cuántos términos de consulta aparecen aquí" a veces la mejor señal de negocio?
- `alpha` no tiene un valor "correcto" en general. ¿Cuál es la forma *experimental* de elegirlo para *tu* corpus, un conjunto pequeño de consultas con respuestas correctas conocidas, luego elegir el alpha que las clasifica correctamente la mayoría de las veces, y la trampa de ajustar alpha en las mismas consultas que reportas?

## Paso 5: Diagnostica cuándo se rompe

El último paso es honestidad intelectual: un motor de búsqueda que solo te muestra ganadores esconde los momentos en que está *equivocado*. Este paso caza deliberadamente el fallo, una consulta cuyo top rank está semánticamente cerca pero fácticamente mal, o una paráfrasis que el modelo lee mal, y lo caracteriza, para que te vayas entendiendo tanto el poder *como* el límite.

**👟 Pista inicial:** Empieza escribiendo `show_all(query, X, texts, ids)`, integra la consulta, puntúa con `X @ q` e imprime cada trozo con su puntaje en orden descendente en lugar de solo el top `k`.

```python
# search.py (continuación)

def show_all(query: str, X: np.ndarray, texts: list[str], ids: list[int]) -> None:
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    scores = X @ q
    order = np.argsort(scores)[::-1]
    print(f"\nquery: {query!r}")
    for i in order:
        print(f"   {scores[i]:>0.3f}  [{ids[i]}] {texts[i][:60]}")

show_all("the tallest mountain in Africa", X, texts, ids)
show_all("a creature with three hearts", X, texts, ids)
```

`show_all` imprime *cada* trozo con su puntaje en lugar de solo el top-k, para que puedas *ver* la clasificación completa y localizar el caso límite. La sonda "the tallest mountain in Africa" es la trampa: el modelo *probablemente* ha atado "mountain" fuertemente a Everest (1) por sus datos de entrenamiento, así que el rank-1 puede ser el trozo de Everest aunque la respuesta *fáctica* correcta sea Kilimanjaro (4). Ese es el diagnóstico honesto, los embeddings miden *asociación estadística*, no *hecho de verdad fundamental*, y nombrarlo es la habilidad real.

**🎯 Resultado esperado:** Para "the tallest mountain in Africa", una clasificación completa donde Everest (1) puede superar a Kilimanjaro (4), una ilustración perfecta de que este motor mide *cercanía a la frase "tallest mountain"*, no *verificación del hecho*. "A creature with three hearts" debería encabezar limpiamente el pulpo (2).

**🩹 Si sale mal:** Si la sonda de África clasifica inesperadamente Kilimanjaro primero, nuestra evaluación de riesgo estaba equivocada *a tu favor*, el modelo eligió el contexto correctamente; ese es el paso de varianza, y re-ejecutar con una frase ligeramente diferente ("very high peak in Africa") normalmente lo devolverá a la trampa. Si *todo* es una línea plana limpia (cada trozo ≈ 0.5), tu corpus es demasiado homogéneo, cambia por temas más distintos para que los puntajes se extiendan.

**✅ Lista de verificación**

- ✅ `show_all` imprime cada trozo con un puntaje, no solo el top-3.
- ✅ La sonda de África *puede* clasificar Everest por encima de Kilimanjaro, y puedes explicar por qué (asociación ≠ hecho).
- ✅ Puedes articular el límite de una palabra de este motor: busca *texto asociado*, no *verdad*.

**🤔 Pregunta(s) socrática(s)**

- El modelo codifica "tallest mountain in Africa" con fuertes lazos residuales a Everest del entrenamiento. ¿Es eso un *bug* del modelo, o una *característica de los modelos de lenguaje estadísticos* que una capa de verificación de hechos tendría que corregir? Argumenta ambos lados brevemente.
- Cada trozo está clasificado, pero que el puntaje top sea el *más alto* no significa que sea *bueno*, un párrafo correlacionado-pero-equivocado puede aún puntuar 0.8. ¿Qué añadiría un *umbral* (sin respuesta si max score < θ), y cuál es su riesgo cuando la respuesta verdadera simplemente no está en el corpus?

## ⚠️ Errores comunes

- **Olvidar normalizar.** Sin `normalize_embeddings=True` en los documentos *y* la consulta, el coseno degenera en un producto punto crudo que grita "documento largo, puntaje más alto" y desclasifica por longitud. Normaliza una vez, en todos lados.
- **Modelos desemparejados.** Integrar con un modelo y consultar con otro (dim diferente, espacio diferente) desclasifica silenciosamente. Codifica documentos y consultas con la *misma* instancia de `SentenceTransformer`.
- **Devolver vectores, no texto.** Una búsqueda que devuelve "trozo 3, puntaje 0.9" es UX rota. Mantén `id → text` sincronizado (listas paralelas) para que cada hit clasificado mapee de vuelta a algo que un humano pueda leer.
- **Tratar los puntajes semánticos como verdad.** Los embeddings codifican *asociación estadística*, no *hechos*, "tallest mountain in Africa" puede clasificar Everest porque el modelo aprendió que Everest es famoso. Añade una capa de verificación (comprobación de palabras clave o recuperación sobre un campo factual) para cualquier cosa sensible a los hechos.
- **Ajustar alpha en la consulta, no en el corpus.** Elegir α para halagar una consulta de demo sobreajusta. Elígelo con un conjunto separado de pares (consulta, hit-esperado) y reporta la tasa de aciertos, la misma disciplina que hizo confiable al híbrido.

## Lo que acabas de construir

Un motor de búsqueda semántica funcional: integraste un corpus pequeño en una matriz NumPy 6×384, normalizaste las filas para que el coseno se volviera un solo producto punto `X @ q`, clasificaste consultas en lenguaje natural por similitud, mezclaste un brazo de palabras clave con un `alpha` ajustable y luego, la parte más difícil, *miraste la clasificación completa* y nombraste exactamente dónde es ingenua. Las ideas transferibles van mucho más allá de la búsqueda: el hábito de "normaliza una vez, luego la geometría es aritmética", el límite de "asocia, no verifiques" con el que viene cada modelo de embeddings, y la disciplina de imprimir todos tus puntajes, no solo los ganadores.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/semantic-search-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/semantic-search-engine) en el repositorio del curso agrupa un corpus más rico, el módulo de integrar-y-buscar y un notebook que carga, integra, clasifica, mezcla y muestra la extensión completa de puntajes en línea. Clona el repo, o ábrelo en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecuta los cinco pasos de punta a punta.
:::

## A dónde ir desde aquí

- **Un corpus más grande:** lee documentos de una carpeta (`pathlib.glob`) y trocéalos en párrafos antes de integrar, el juguete de 6 elementos se vuelve un índice real.
- **Persiste el índice:** guarda `X` con `np.save` y cárgalo sin re-integrar, para que los arranques en frío sean una lectura de archivo, no una llamada al modelo.
- **Una API:** envuelve `search` en un endpoint `FastAPI` `/search?q=...` que devuelva JSON `{id, score, text}`, la misma función, ahora alcanzable sobre HTTP.
- **Verifica-fácticamente el hit top:** añade una re-comprobación por palabras clave (el `keyword_score` del Paso 4) como guardia antes de que el rank-1 llegue a un usuario, cerrando la brecha de "asociación no es hecho".

## Comparte tu proyecto con la clase

¿Integraste una colección, encontraste una victoria semántica, o fotografiaste un fallo de nombre propio? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo añadir el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓