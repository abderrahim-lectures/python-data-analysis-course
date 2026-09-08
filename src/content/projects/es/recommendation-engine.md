---
title: "Motor de Recomendaciones"
description: "Construye recomendadores colaborativos y basados en contenido a partir de datos de calificaciones reales — similitud, predicción, ranking y mezcla híbrida con NumPy, pandas y scikit-learn."
difficulty: "advanced"
estimatedMinutes: 240
tags: ["numpy", "pandas", "scikit-learn", "machine-learning", "cosine-similarity"]
learningObjectives:
  - "Representa un conjunto de datos de calificaciones como una matriz de utilidad usuario-elemento"
  - "Calcula vecindarios de similitud de coseno entre usuarios y entre elementos"
  - "Predice calificaciones faltantes a partir de promedios de vecinos más cercanos y mide el error"
  - "Construye perfiles basados en contenido a partir de atributos de elementos y mezcla un recomendador híbrido"
prerequisites: ["python-101/libraries", "data-analysis/pandas", "data-analysis/groupby-aggregation", "numpy-101/arrays"]
---

# 🎯 Construye un Motor de Recomendaciones

Un motor de recomendaciones es el motor silencioso de la economía de internet: el "Viste dos episodios, aquí tienes una serie que terminarás este fin de semana" de Netflix, el "Los clientes como tú también compraron" de Amazon, el autoplay de YouTube. Por debajo es sorprendentemente poco glamoroso — una matriz de usuarios por elementos, la mayoría de las celdas vacías, y todo el truco es llenar los huecos de manera plausible con una matemática llamada *similitud*. La misma álgebra lineal que impulsa el trabajo de pandas del curso escala hacia las dos grandes familias que construirás aquí: **filtrado colaborativo** (derivar el gusto de las calificaciones de otros usuarios) y **filtrado basado en contenido** (hacer coincidir elementos nuevos contra los perfiles de lo que ya calificaste). Al final tendrás un híbrido funcional que hace recomendaciones genuinamente sensatas sobre un conjunto de datos real de 100k calificaciones.

Esto asume Python 101 más un conocimiento práctico de `pandas` y la matemática de arrays de NumPy — los módulos de análisis de datos del curso. Sin aprendizaje profundo, sin sistemas de escala industrial. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Cargar un conjunto de datos de calificaciones real en una matriz de utilidad usuario-elemento y explorar su valentía (escasez).
2. Calcular la similitud de coseno entre usuarios y entre elementos con operaciones vectoriales de NumPy.
3. Predecir calificaciones faltantes a partir de promedios de vecinos más cercanos y puntuar tu precisión con MAE.
4. Construir perfiles basados en contenido a partir de géneros/atributos de elementos y generar recomendaciones de elementos.
5. Mezclar las puntuaciones colaborativas y basadas en contenido en un recomendador híbrido y comprobarlo con el sentido común.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal: el conjunto de datos MovieLens se carga como CSV planos que puedes pinchar con `pandas`, y todo el pipeline (recorrer conteos de vecinos más cercanos, comparar errores, imprimir razones explicables de "porque te gustó") es interactivo en una terminal. `uv add numpy pandas scikit-learn` cubre todo.

**GitHub Codespaces** te da la experiencia idéntica: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y cada comando se ejecuta en una pestaña del navegador contra el mismo conjunto de datos.

**Google Colab, Kaggle Notebooks y Binder ejecutan el pipeline de cómputo con honestidad** — la matriz de calificaciones tiene ~100k calificaciones reales que caben cómodamente en memoria, la similitud de coseno es álgebra lineal, y el conjunto de datos es el mismo archivo MovieLens público que los estudiantes siempre usan, así que los números de tu notebook coinciden con los números de tu cabeza. Sin claves de API, sin GPU. Lo único que no puedes hacer en un notebook es importar tu propio diseño de archivo — y en el momento en que quieras un servicio que sirva recomendaciones sobre HTTP, ese pico es local.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recommendation-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recommendation-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frecommendation-engine%2Fnotebook.ipynb)

## Configuración

Consigue el conjunto de herramientas y el conjunto de datos en disco antes del primer producto punto de vectores.

### Instala `uv` y las dependencias

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
mkdir recommendation-engine && cd recommendation-engine
uv init --bare
uv add numpy pandas scikit-learn
```

### Descarga el conjunto de datos MovieLens 100k

```bash
mkdir -p data
curl -L -o data/ml-100k.zip https://files.grouplens.org/datasets/movielens/ml-100k.zip
unzip -o data/ml-100k.zip -d data
ls data/ml-100k/ | head -20
```

Los tres archivos que realmente necesitas: `u.data` (calificaciones: `user item rating timestamp`), `u.item` (metadatos de películas, delimitados por `|`, géneros en las últimas 19 columnas) y `u.user` (`user age ... occupancy`). Todo lo demás es documentación.

**✅ Lista de verificación**

- ✅ `uv --version` imprime una versión; `numpy`, `pandas`, `scikit-learn` instalados vía `uv add`.
- ✅ `data/ml-100k/u.data` existe y `head -3` muestra filas `user item rating timestamp`.
- ✅ `data/ml-100k/u.item` existe (pipes), `data/ml-100k/u.user` existe (también delimitado por `|`).

## Paso 1: Carga las calificaciones en una matriz de usuario-elemento

Los motores de recomendación viven y mueren por cómo el registro de eventos crudo se convierte en una matriz. Un array `usuario × elemento` con calificaciones en las celdas — y una abrumadora mayoría de celdas vacías, porque cada usuario califica solo unas pocas de mil películas — es la forma canónica. Este paso la produce y mide qué tan valiente (escasa) es.

**👟 Pista inicial:** Empieza escribiendo `load_ratings(path)` que lea `u.data` con `pd.read_csv(..., sep="\t", header=None)` y los cuatro nombres de columna, luego imprime `head()` — ve las filas de evento crudas antes de remodelarlas en una matriz.

```python
# engine.py
import numpy as np
import pandas as pd

RATINGS = "data/ml-100k/u.data"
ITEMS = "data/ml-100k/u.item"

def load_ratings(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep="\t", header=None,
                     names=["user", "item", "rating", "ts"])
    return df

ratings = load_ratings(RATINGS)
print(ratings.head())
print(f"users={ratings['user'].nunique()} items={ratings['item'].nunique()} "
      f"total={len(ratings)}")

matrix = ratings.pivot_table(index="user", columns="item", values="rating")
print("matrix shape:", matrix.shape)
print("sparsity  :", f"{(1 - matrix.notna().sum().sum() / (matrix.shape[0] * matrix.shape[1])):.4%}")
```

`pivot_table` es la fábrica de matrices de una línea: index=usuarios, columns=elementos, values=calificaciones, y cada par no calificado cae como `NaN` — que es exactamente lo que queremos, porque `NaN` *es* el problema de la recomendación: llena los huecos. La línea de escasez es la comprobación de realidad de ingeniería: en ~94–95% responde "¿cuánto de la matriz realmente conocemos?" antes de cualquier recomendación — y la respuesta es la excusa para todo el campo del *filtrado colaborativo* (debemos inferir de los votos de otros usuarios).

**🎯 Resultado esperado:** Cinco filas de calificaciones separadas por tabuladores, `users=943 items=1682 total=100000`, una matriz escasa `943×1682` y una escasez de ~94-95%.

**🩹 Si sale mal:** Si `u.data` falla al analizarse, la descarga no se completó — comprueba el tamaño del archivo (≈1.9 MB) y vuelve a ejecutar el `curl`. Si la escasez imprime ~0%, `pivot_table` llenó los huecos con 0 en lugar de `NaN` — no pases un `fill_value` (el valor por defecto deja los huecos como `NaN`, mientras que un `fill_value=0` explícito marca silenciosamente cada elemento no calificado como "odiado", lo que corrompe toda similitud posterior).

**✅ Lista de verificación**

- ✅ `matrix.shape == (943, 1682)` con huecos `NaN`.
- ✅ Puedes imprimir la columna general de un usuario (`matrix.loc[1].nunique()`) y es ~20-30.
- ✅ Puedes afirmar por qué un 94% de vacío es *interesante* en lugar de un bug.

**🤔 Pregunta(s) socrática(s)**

- Una densidad de ~6% significa que el 94% de la cuadrícula es desconocido. Si un usuario ha votado en 30 películas, una "recomendación" podría significar "mayormente adivinar". ¿Qué supuesto necesita mantener el filtrado colaborativo entre usuarios (sobre el gusto compartido) antes de que esas adivinanzas merezcan confianza?
- `pivot_table` nos da `NaN` para lo no calificado. ¿Por qué es un riesgo real pre-llenar con `0`? ¿Qué le haría a la similitud de coseno a un usuario que por casualidad no le gusta todo lo que probó?

## Paso 2: Calcula la similitud de coseno usuario-usuario

La moneda central del motor es la *similitud* — un número que dice qué tan cerca están los gustos de dos usuarios. La similitud de coseno compara dos vectores de calificación como direcciones: los usuarios que califican cosas de manera similar (escalada) obtienen un coseno alto independientemente de si usan toda la escala 0–5, porque el coseno ignora la magnitud. La vectorización de NumPy convierte una comparación `fila × fila` en una multiplicación broadcast sobre una matriz.

**👟 Pista inicial:** Empieza escribiendo `cosine_similarity(a, b)` que enmascare `NaN` con `~np.isnan` antes del producto punto, y compruébala con el sentido común en dos vectores de calificación idénticos — deben devolver `1.0` — antes de apuntarla a la matriz de usuarios completa.

```python
# engine.py (continued)
import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a = a[~np.isnan(a)]
    b = b[~np.isnan(b)]
    # NaNs collapse — compare only the pair's common ratings
    a0, b0 = a[: min(len(a), len(b))], b[: min(len(a), len(b))]
    if a0.size == 0:
        return 0.0
    denom = np.linalg.norm(a0) * np.linalg.norm(b0)
    return float(np.dot(a0, b0) / denom) if denom > 0 else 0.0

users = ratings["user"].unique()
test = matrix.loc[[users[0], users[1]]].to_numpy()
print("cos(user 1, user 2):", cosine_similarity(test[0], test[1]))
```

El detalle crítico es la máscara: `~np.isnan` elimina los huecos, así que comparamos solo las películas que ambos usuarios calificaron de verdad — una intersección, no el vector completo. `np.dot(a0, b0) / (|a0|·|b0|)` es el coseno de libro de texto; la protección `0.0` atrapa el caso degenerado de todo-ceros donde el denominador explotaría. La comparación entera es ~4 líneas de NumPy, y esa es la verdad de la matemática de recomendadores: el algoritmo es simple, la higiene de datos es donde aterriza el trabajo real.

**🎯 Resultado esperado:** Un flotante típicamente en `[0, 0.3]` para usuarios emparejados al azar — la mayoría de las puntuaciones de similitud acogedora aterrizan bajo, y eso es correcto: los usuarios comparten un par de géneros, no todo el gusto del otro.

**🩹 Si sale mal:** Si obtienes `nan`, dos usuarios no compartieron *ningún* elemento calificado en común y los arrays enmascarados tienen longitud 0 — el corte `min(...)` colapsó ambos a 0 y la protección `size == 0` debería haber devuelto `0.0`; si eliminaste la protección, restáurala. Si las puntuaciones se aprietan en `1.0` para todos, la máscara está rota y los `NaN` se están filtrando al producto punto.

**✅ Lista de verificación**

- ✅ La llamada de juguete imprime un flotante en `[0, 1]`, y para pares de usuarios al azar es pequeño.
- ✅ Dos vectores de calificación idénticos producen `1.0` (comprobación de consola: `cosine_similarity(np.array([5.,5.,0.]), np.array([5.,5.,0.]))`).

**🤔 Pregunta(s) socrática(s)**

- El coseno ignora la magnitud — un usuario que califica todo 4–5 y uno que califica 0–1 aún pueden estar cerca de `1.0` en coseno si sus *rankings* coinciden. ¿Cuándo es correcta esa amabilidad para las recomendaciones, y cuándo sería la *correlación de Pearson* (calificaciones centradas) la elección más segura — nombra un escenario real de gusto por películas?
- Eliminar los `NaN` para comparar solo la intersección es vecino más cercano para un subconjunto de calificaciones conjuntas. Si dos usuarios comparten una película, el coseno en ese par es `1.0` (cualquier cosa es similar a un punto único). ¿Qué umbral deberías imponer (elementos comunes mínimos), y dónde se pelea contra "vecindarios más grandes al rescate"?

## Paso 3: Predicciones colaborativas — promedio de k-vecinos más cercanos

La similitud sola no recomienda; *la agregación* lo hace. Dado un usuario y una película que no ha calificado, la predicción colaborativa es: encuentra los k usuarios más similares a él, promedia las calificaciones de esos usuarios para esa película (ponderada por similitud si quieres ponerte elegante), y ese promedio es la adivinanza. La razón por la que funciona es la apuesta del "círculo de confianza": las personas con gusto idéntico en lo que tenemos coinciden en lo que no tenemos.

**👟 Pista inicial:** Empieza escribiendo `predict_rating(ratings, matrix, u, m, k)`: recorre a cada otro usuario, calcula `cosine_similarity`, conserva a los usuarios que han calificado la película `m` y que superan el umbral `sim > 0.1`, luego devuelve el promedio ponderado por similitud de sus calificaciones para `m`.

```python
# engine.py (continued)

def predict_rating(root: pd.DataFrame, matrix: pd.DataFrame, u: int, m: int, k: int = 10) -> float:
    target = matrix.loc[u]
    scores = {}
    for v in matrix.index:
        if v == u:
            continue
        sim = cosine_similarity(target.to_numpy(), matrix.loc[v].to_numpy())
        if pd.notna(matrix.loc[v, m]) and sim > 0.1:
            scores[v] = sim
    neighbors = sorted(scores, key=scores.get, reverse=True)[:k]
    if not neighbors:
        return float("nan")
    numer = sum(scores[v] * matrix.loc[v, m] for v in neighbors)
    return numer / sum(scores[v] for v in neighbors)

movie = 50
for u in [1, 42, 200]:
    print(f"user {u} predict movie {movie}: "
          f"{predict_rating(ratings, matrix, u, movie, k=10):.2f}")
```

El bucle es de fuerza bruta (cada otro usuario, cada llamada) — horriblemente lento por diseño; la producción usa matemática vectorizada de matriz completa y búsquedas O(1). Pequeño y correcto gana a rápido e intrincado aquí. El umbral `sim > 0.1` más los k vecinos es el par de ajuste de dos perillas (qué tan "parecido" es "parecido" para contar, y qué tan grande es el círculo). El promedio ponderado `sum(sim·rating)/sum(sim)` es un predictor de apenas-3-líneas que ha llevado motores del mundo real.

**🎯 Resultado esperado:** Flotantes razonables alrededor de 3–4 para los tres usuarios — la muestra diminuta está dimensionada para "números sensatos", no para precisión de producción; una diferencia de calificación única de ±0.5 ya se ve en un decimal.

**🩹 Si sale mal:** Si imprime `nan`, ningún vecino superó el umbral `sim > 0.1` — la película o el usuario es demasiado escaso; baja el umbral a `0.05` o reduce a `k=5`. Si cada predicción es ~4.5 (poca varianza), el vecino más cercano está dominando; encoge `k` a 3 y observa cómo regresa la varianza. Si tarda 40s para tres predicciones, ese es el costo esperado de la fuerza bruta — codifica la lección de "tiempo-de-pared = complejidad", no la optimices todavía.

**✅ Lista de verificación**

- ✅ Tres predicciones se imprimen, todas en `[1, 5]`, y `nan` solo cuando no existe un vecino calificado.
- ✅ Un usuario que calificó la película objetivo con 5, predicho vía vecinos, aterriza cerca de 4-5: el círculo de confianza reproduce el gusto.
- ✅ Puedes explicar el rol de *ambos* `k` (valor) y el umbral (pureza) en una frase.

**🤔 Pregunta(s) socrática(s)**

- La predicción es un promedio ponderado donde los pesos son las similitudes. Si intercambias un promedio *no* ponderado (`1/k`), ¿qué le pasa a un usuario cuyo único vecino similar está muerto-equivocado para esta película en particular? ¿Cómo degrada la ponderación con gracia (y cuándo no — piensa en "un solo vecino de alta similitud con una calificación")?
- El caso `nan` es supervisión real de una esquina escasa. Para un arranque en frío de usuario nuevo (sin calificaciones), *toda* película devuelve `nan` con este método. Ese es el muro de ladrillo al que tu motor se enfrenta en el momento en que conoce a un usuario nuevo — y exactamente por qué existe el Paso 4 (basado en contenido). Articula cómo un híbrido cubre el hueco que la colaboración no puede ver.

## Paso 4: Filtrado basado en contenido desde atributos de elementos

El filtrado colaborativo muere en el arranque en frío — una película nueva (sin calificaciones todavía), un usuario nuevo (sin historial). El basado en contenido ignora a otros usuarios por completo: describe *elementos* por sus propios atributos (géneros, etiquetas, palabras clave) y predice "si te gustó el elemento A, te gustarán otros elementos cuyo perfil de atributos se parezca al de A". El motor cambia la multitud por la huella dactilar del propio elemento — y de repente las películas nuevas y los usuarios nuevos son recomendables en el momento en que existen.

**👟 Pista inicial:** Empieza escribiendo `load_items(path)` que lea `u.item` con `sep="|"` y conserve `item`, `title` y las columnas de género, luego construye `content_profile(items, rated)` como la suma ponderada por calificación de las filas de género de los elementos calificados.

```python
# engine.py (continued)
ITEMS_COLS = ["item", "title", "date", "video", "url"] + [f"g{i}" for i in range(19)]
GENRES = ["Action", "Adventure", "Animation", "Children's", "Comedy", "Crime",
          "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical",
          "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"]

def load_items(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep="|", header=None, names=ITEMS_COLS,
                     encoding="latin-1")
    df = df[["item", "title"] + GENRES].copy()
    for g in GENRES:
        df[g] = df[g].fillna(0)
    return df

items = load_items(ITEMS)
print(items.shape, items.head(2).loc[:, ["item", "title"]].to_dict("records"))

def content_profile(items: pd.DataFrame, rated: dict) -> np.ndarray:
    profile = np.zeros(len(GENRES))
    for item, r in rated.items():
        row = items.loc[items["item"] == item]
        if row.empty:
            continue
        profile += r * row.iloc[0][GENRES].to_numpy()
    return profile

profile = content_profile(items, {m: v for m, v in {
    1: 5, 50: 3, 100: 4}.items()})
print("genre profile:", dict(zip(GENRES, profile.round(2))))
```

El cambio se reduce a *vectores de características*: cada película es un vector binario sobre géneros (1 si es un Drama, si no 0), y un "perfil de usuario" es la *suma ponderada por calificación* de los géneros de todo lo que le gustó — `Documentary: 5.0` junto a `Horror: 0.0` dice "este usuario vio un documental y lo calificó con 5". Después de eso, el emparejamiento película-a-perfil es solo similitud de coseno otra vez — la misma matemática del Paso 2, aplicada a atributos de elementos en lugar de calificaciones de usuarios. `encoding="latin-1"` maneja los bytes de títulos de finales de los 90; el `fillna(0)` se traga los strings vacíos que ocultan algunas celdas.

**🎯 Resultado esperado:** Un marco `1682×20` de elementos (`item`, `title`, 18 banderas de género) y un perfil de género para las calificaciones de juguete — p. ej. `{'Documentary': 5.0, 'Drama': 4.0, ...}` donde los géneros que alimentaste con calificaciones altas dominan.

**🩹 Si sale mal:** Si `items` no tiene columnas de género, `GENRES` no coincide con los 19 campos de pipe finales de `u.item` — cuenta las columnas en una línea cruda; el nombre de archivo `u.item` usa `|`, así que `sep="|"` es obligatorio. Si el perfil es todo ceros, `row.empty` se alcanzó para cada elemento — los IDs de `item` de tu dict `rated` no existen en `u.item`; imprime `items["item"].min()/max()` y alinea los IDs.

**✅ Lista de verificación**

- ✅ `items.shape == (1682, 20)` y las columnas de género son flotantes 0/1.
- ✅ El perfil es un vector de longitud 19 donde dominan los géneros de los elementos calificados.
- ✅ Puedes rankear películas para el perfil de juguete por coseno y obtener coincidencias de género (perfil alto en drama → dramas primero).

**🤔 Pregunta(s) socrática(s)**

- El perfil es un promedio ponderado de banderas de género — y los géneros son un lenguaje *grueso* (una película es a la vez Drama y Romance). Cuando sumas vectores, un usuario que solo le gusta la mitad romántica de los Romántico-Dramas ve también el peso del Drama. Nombra el giro del mundo real donde eso confunde el gusto, y un segundo atributo más allá de los géneros que reduciría el ruido (¿director? ¿actores? ¿palabras clave? ¿década de estreno?).
- Todo en basado-en-contenido orbita los *propios descriptores* del elemento, así que una recomendación de película es explicable: "te gustó Drama + Documental". Declara el fallo el momento en que el basado-en-contenido *solo* sea la respuesta en una plataforma donde millones califican todo — ¿cuál es el punto ciego que hace indispensable a la colaboración?

## Paso 5: Mezcla híbrida — combina ambas señales

Deja caer un motor de recomendaciones en un codebase real y la pregunta no es "¿colaborativo o basado en contenido?" — es "¿cómo mezclamos ambos, y cuándo gana cada uno?" El híbrido es una *mezcla*: elige vecinos para la predicción colaborativa, construye un perfil de contenido desde el historial del usuario, y combina los dos en una sola lista rankeada con un peso `α` (0 = solo contenido, 1 = solo colaboración). La perilla alfa es toda la historia del ajuste — giro pequeño, salto grande.

**👟 Pista inicial:** Empieza escribiendo `recommend(items, matrix, u, k, alpha, n)`: reúne los elementos calificados del usuario, construye un perfil de contenido, luego puntúa cada película no calificada como `alpha * collab + (1 - alpha) * content` y rankea las top `n`.

```python
# engine.py (continued)

def recommend(items: pd.DataFrame, matrix: pd.DataFrame, u: int, k: int = 10,
              alpha: float = 0.5, n: int = 5) -> list[tuple]:
    rated = {m: matrix.loc[u, m] for m in matrix.columns if pd.notna(matrix.loc[u, m])}
    profile = content_profile(items, rated)
    scores = {}
    for m in matrix.columns:
        if m in rated:
            continue  # don't recommend what's already seen
        collab = predict_rating(ratings, matrix, u, m, k=k)
        content = cosine_similarity(profile, items.loc[items["item"] == m, GENRES].to_numpy()[0]) if not items.loc[items["item"] == m].empty else 0.0
        scores[m] = (alpha * collab if pd.notna(collab) else 0) + (1 - alpha) * content
    ranked = sorted(scores, key=scores.get, reverse=True)[:n]
    return [(items.loc[items["item"] == m, "title"].iloc[0], round(scores[m], 3)) for m in ranked]

for alpha in [0.0, 1.0]:
    print(f"alpha={alpha}")
    for title, s in recommend(items, matrix, 1, k=10, alpha=alpha):
        print("  ", title, s)
```

El secreto de la mezcla es que `alpha` *molda la misma lista rankeada* — `0.0` rankea puramente por el gusto de género observado del usuario mientras que `1.0` rankea puramente por los votos del vecindario, y el punto dulce interpola los perfiles de riesgo: en usuarios escasos, el contenido rescata la cola; en usuarios densos, la colaboración gana la cabeza. Dos ejecuciones, mismo usuario, y observas cómo se baraja el top 5 — ese es todo el argumento de "por qué híbrido" medido en pantalla. `alpha * collab` protege el `nan` colaborativo faltante poniéndolo en cero, así que un elemento frío nunca arrastra una recomendación a cero por accidente.

**🎯 Resultado esperado:** Para `alpha=0.0` una lista impulsada por género (los géneros favoritos del usuario 1 visibles en los títulos); para `alpha=1.0` una lista impulsada por vecinos que difiere visiblemente; puntuaciones sensatas en `[0, 1]` después de la suma ponderada.

**🩹 Si sale mal:** Si un alfa imprime listas idénticas, `predict_rating` está devolviendo `nan` para cada elemento y `scores` es efectivamente solo-contenido — sube el umbral o encoge `k`; un `collab` cero no debería dominar. Si las puntuaciones suben más allá de 1, la suma ponderada por alfa añadió un desajuste de distribución (coseno `[0,1]` vs promedio de vecinos `[0,5]`) — normaliza el brazo collab (`/5`) para que alfa interpole manzanas con manzanas. Si tarda minutos para un usuario, la fuerza bruta de `predict_rating` por elemento se está acumulando — eso es esperado; vectoriza más tarde, o encoge `k` y el conteo de columnas candidatas para mantener viva la demo.

**✅ Lista de verificación**

- ✅ Dos ejecuciones de alfa producen listas top-5 visiblemente *diferentes* para el mismo usuario.
- ✅ Los elementos de arranque en frío (sin vecino calificado) aún rankean vía el brazo de contenido en `alpha < 1`.
- ✅ Las puntuaciones se mantienen en un rango comparable, y puedes afirmar cuándo gana cada brazo.

**🤔 Pregunta(s) socrática(s)**

- En `alpha=0` la lista es contenido puro; en `alpha=1` colaboración pura. Describe un experimento *medible* (un conjunto de retención, MAE en calificaciones retenidas) que te *diría* qué alfa gana para tu conjunto de datos — y la trampa de ajustar alfa en los mismos datos sobre los que informas.
- Los usuarios nuevos llegan con un puñado de clics desechables; el motor tiene que recomendar desde casi nada. La mezcla deja que el contenido cargue las primeras docenas de recomendaciones. ¿Cuál es la razón más profunda por la que una colaboración pura empeora *antes* de mejorar a medida que tu base de usuarios crece de 50 a 5.000 — y por qué "promedio de vecinos" envejece mal en los regímenes más densos?

## ⚠️ Errores comunes

- **Una cuadrícula `NaN` rellenada envenenando todo silenciosamente.** Pre-llenar las celdas no calificadas con `0` las marca como "odiadas", lo que arrastra la similitud de coseno hacia similitud-por-no-ver y infla cada producto punto con ceros. Conserva los huecos `NaN`; enmascáralos (`~np.isnan`) en cada comparación.
- **Comparar ceros crudos de una escala no normalizada.** Dos usuarios con gusto idéntico, uno calificando todo 4-5 y el otro 0-1, aparecen como coseno bajo aunque sus rankings coincidan. Centra las calificaciones (resta la media de cada usuario) antes de la similitud — es decir, Pearson — cuando la disciplina de escala importe.
- **Una calificación compartida ⇒ similitud 1.0.** Cualesquiera dos usuarios con una sola película en común son "idénticos" por coseno. Pon un umbral en el tamaño mínimo de intersección (p. ej., 3 calificaciones comunes) para evitar que los dobles degenerados dominen el vecindario.
- **Arranque en frío sin escape de contenido.** Una película recién estrenada (sin calificaciones) no puede predecirse por colaboración y un usuario recién estrenado no puede formar un vecindario. Ambos son exactamente lo que el brazo de contenido existe para cubrir — un híbrido que no mezcla atributos es un híbrido solo de nombre.
- **Ajustar alfa en el propio informe.** Elegir `α` a ojo por "lo que se ve bonito" en el conjunto de entrenamiento sobreajusta la demo. Reserva un trozo de calificaciones, elige el alfa que minimice el MAE en ese trozo retenido e informa *ese* número — la disciplina que realmente necesitarías en producción.

## Lo que acabas de construir

Un motor de recomendaciones real: cargaste el conjunto de datos MovieLens 100k en una matriz de usuario-elemento 943×1682, mediste su escasez del 94%, calculaste la similitud de coseno usuario-usuario en NumPy, predijiste calificaciones retenidas con un promedio ponderado de k-vecinos más cercanos, construiste un brazo de contenido basado en perfiles de género desde atributos de elementos, y mezclaste ambos en una lista rankeada ajustable. Dos familias de matemática de recomendación que impulsan sistemas de producción, un conjunto de datos, ~150 líneas de código visible. Las partes transferibles van mucho más allá de las películas: el hábito de similitud enmascarada, la disciplina de "mezcla, ajusta en una retención, informa" y el momento en que *sientes* el argumento de la escasez como un número en lugar de una metáfora.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/recommendation-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/recommendation-engine) en el repositorio del curso agrupa el motor completo, el cargador de datos MovieLens y un notebook que carga, des-pivota, puntúa y ajusta el híbrido en línea. Clona el repositorio, o ábrelo en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecuta los cinco pasos de principio a fin.
:::

## A dónde ir desde aquí

- **Añade evaluación de forma correcta:** divide las calificaciones 80/20 en entrenamiento/prueba, mide el MAE en el trozo retenido para ambos brazos (y cada alfa) desde config YAML, e imprime al ganador. Esa es la única adición que convierte una demo en un motor defendible.
- **Vectoriza el vecindario:** reemplaza la fuerza bruta del `for`-sobre-usuarios por una llamada de similitud de matriz completa (normaliza primero) — observarás un bucle de minutos-por-usuario caer a milisegundos y saborearás el pago de ingeniería del hábito de NumPy.
- **Sirve una API:** envuelve `recommend` en un endpoint `FastAPI` (`/recommend/{user_id}?alpha=0.6`) con una tabla de elementos compatible con consultas — la misma función, ahora alcanzable sobre HTTP, más una insignia que puedes abrir en un navegador.
- **Prueba el otro conjunto de datos:** intercambia `u.data` por las divisiones formales `u1.base`/`u1.test` incluidas en la misma descarga `ml-100k`, e informa el MAE del conjunto de prueba cuando el alfa se ajusta en la división de entrenamiento. La brecha entre números es una mirada honesta a la generalización.

## Comparte tu proyecto con la clase

¿Tienes un recomendador que gana al azar, una mezcla híbrida de la que estés orgulloso, o un motor evaluado con un MAE que puedas citar? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo agregar el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
