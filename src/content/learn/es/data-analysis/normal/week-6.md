---
title: "Semana 6: Fundamentos de Series y DataFrame"
section: data-analysis
track: normal
week: 6
description: "Aprende los fundamentos de Series y DataFrame en pandas y cómo leer archivos CSV — la primera semana del recorrido Normal de Análisis de Datos."
---


# Semana 6: Fundamentos de Series y DataFrame

<span class="gamified-flourish">📐 Una tabla no es una idea nueva para ti — es una matriz con etiquetas. Pandas simplemente le da a Python soporte nativo para ella.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Explicar qué son una `Series` y un `DataFrame`, y cómo se relacionan con un vector y una matriz.
- Construir un `DataFrame` a partir de estructuras de datos de Python, y cargar uno desde un CSV con `pd.read_csv`.
- Inspeccionar la forma, columnas, dtypes, índice y estadísticas resumen de un `DataFrame`.
- Seleccionar una sola columna como una `Series`, y conocer la diferencia entre las dos formas principales de hacerlo.

## Lección

### De diccionario de listas a DataFrame

El mini-proyecto de la Semana 5 de Python 101 calculaba promedios por estudiante usando un `dict`. Un `DataFrame` es la estructura de pandas diseñada exactamente para este tipo de datos tabulares — filas y columnas, con etiquetas en ambos ejes:

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["Amina", "Youssef", "Sara"],
    "score": [88, 74, 95],
})
df
```

También puedes construir uno a partir de una lista de diccionarios — exactamente la forma de "lista de registros" del ejemplo de colecciones anidadas de la Semana 3 del track Normal de Python 101:

```python
records = [
    {"name": "Amina", "score": 88},
    {"name": "Youssef", "score": 74},
]
pd.DataFrame(records)
```

Ambas formas producen el mismo tipo de objeto; cuál es más conveniente depende solo de cómo ya estén estructurados tus datos — diccionario de listas cuando piensas "columna por columna", lista de diccionarios cuando piensas "registro por registro".

Una **`Series`** es una sola columna etiquetada — piénsala como un vector $\mathbf{v} \in \mathbb{R}^n$, salvo que cada entrada también tiene una etiqueta (su índice), no solo una posición:

```python
df["score"]        # una Series
type(df["score"])   # pandas.core.series.Series
```

Un **`DataFrame`** es una tabla 2D de esas columnas que comparten un índice de fila — el análogo tabular de una matriz $A \in \mathbb{R}^{m \times n}$, salvo que las columnas pueden tener distintos dtypes y ambos ejes llevan etiquetas, no solo posiciones numéricas.

### El índice

Todo `DataFrame` (y `Series`) tiene un **índice** de fila — las etiquetas a lo largo del borde izquierdo — visible cada vez que imprimes uno. Por defecto es simplemente `0, 1, 2, ...`, pero no tiene que serlo:

```python
df.index                       # RangeIndex(start=0, stop=3, step=1) por defecto
df_named = df.set_index("name")   # usa la columna "name" como índice en su lugar
df_named.loc["Amina"]              # ahora puedes buscar una fila por nombre directamente
```

`set_index` no modifica `df` in situ por defecto — devuelve un `DataFrame` *nuevo* con el cambio, el mismo patrón de "devuelve un valor nuevo, no muta" que ya viste con `sorted()` en Python 101.

### Leer un CSV

El mismo `students-normal.csv` de Python 101 se carga en una sola llamada — sin bucle manual con `csv.DictReader`, sin conversiones manuales con `int(...)`:

```python
df = pd.read_csv("students-normal.csv")
df.head()      # las primeras 5 filas
df.tail(3)      # las últimas 3 filas
```

`pd.read_csv` infiere automáticamente el dtype de cada columna (los números se vuelven `int64`/`float64`, el texto se queda como `object`), que es la mayor parte de lo que la Semana 5 del track Normal de Python 101 hizo a mano, resuelto para ti en una línea.

### Inspeccionar un DataFrame

Un puñado de métodos responden "¿cómo se ve realmente este dataset?" antes de que hagas cualquier otra cosa con él:

```python
df.shape        # (filas, columnas) — p. ej. (10, 4)
df.columns      # nombres de las columnas
df.dtypes       # el tipo de dato de cada columna
df.info()       # forma + dtypes + conteos de no nulos, todo a la vez
df.describe()   # count, mean, std, min, cuartiles, max — para columnas numéricas
```

Vale la pena detenerse en `df.describe()`: la media y la desviación estándar son exactamente las estadísticas que ya conoces de un curso de estadística, calculadas instantáneamente sobre una columna entera en lugar de a mano. Puedes renombrar columnas después del hecho si los nombres del archivo de origen no son convenientes para trabajar:

```python
df = df.rename(columns={"quiz1": "quiz_1"})
```

## ⚠️ Errores comunes

- **Olvidar que la mayoría de las operaciones de DataFrame devuelven un objeto nuevo.** `df.rename(...)`, `df.set_index(...)`, y muchas otras no cambian `df` en sí a menos que reasignes (`df = df.rename(...)`) o pases `inplace=True`.
- **Confundir `df.shape` (sin paréntesis) con una llamada a método.** `.shape` es un atributo, no una función — `df.shape()` lanza un `TypeError`.
- **Asumir que `.describe()` cubre todas las columnas.** Por defecto solo resume columnas numéricas; las columnas de texto necesitan una mirada diferente (la Semana 8 cubre limpiarlas e inspeccionarlas).

## 🧩 Retos

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Carga `students-normal.csv` (de la Semana 5 de Python 101 — reutiliza el mismo archivo) en un DataFrame e imprime cuántas filas y columnas tiene.

<p class="challenge__answer">💡 <strong>Answer:</strong> Usa <code>pd.read_csv("students-normal.csv")</code> y luego <code>df.shape</code> — el primer elemento de la tupla es el conteo de filas, el segundo es el conteo de columnas.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Selecciona solo la columna `quiz1` como una Series. ¿Cuáles son dos sintaxis distintas para hacer esto?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["quiz1"]</code> o <code>df.quiz1</code> ambos seleccionan la columna como una Series; el segundo solo funciona porque <code>quiz1</code> es un identificador de Python válido sin espacios.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Calcula la media de la columna `quiz1` usando un método de Series (no `sum()`/`len()` a mano).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["quiz1"].mean()</code> — toda Series tiene métodos estadísticos incorporados como <code>.mean()</code>, <code>.median()</code>, <code>.std()</code>, sin necesitar sum()/len() manuales.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Ejecuta `df.describe()` en el DataFrame de estudiantes. ¿Incluye la columna `name`? ¿Por qué sí o por qué no?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.describe()</code> resume solo las columnas numéricas por defecto (count/mean/std/min/cuartiles/max) y omite silenciosamente la columna <code>name</code>, ya que ninguna de esas estadísticas tiene sentido para texto — pandas infiere esto a partir del dtype de cada columna.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Establece `name` como el índice del DataFrame de estudiantes, y luego busca la fila de Amina directamente por su nombre en lugar de por número de fila.

<p class="challenge__answer">💡 <strong>Answer:</strong> Llama a df.set_index("name") y guarda el resultado (p. ej. df_by_name = df.set_index("name")), y luego usa df_by_name.loc["Amina"] para obtener esa fila directamente por etiqueta en lugar de buscar el número de fila correspondiente.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Construye un pequeño DataFrame a mano (no desde un CSV) con dos columnas, `city` y `population`, para 3 ciudades de tu elección — usando el estilo de diccionario de listas o el de lista de diccionarios.

<p class="challenge__answer">💡 <strong>Answer:</strong> Constrúyelo ya sea como un diccionario de listas (una clave por columna) o una lista de diccionarios (un diccionario por ciudad) pasado a <code>pd.DataFrame(...)</code> — ambos son válidos, según cuál sea la forma en que empezaron tus datos.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- Una `Series` a menudo se compara con una `list` de Python con etiquetas. ¿Qué puedes hacer con el `.mean()`/`.std()` de una Series en una sola llamada que no podrías hacer con una `list` simple sin escribir tu propia función?
- `df.dtypes` muestra el tipo inferido de cada columna. ¿Qué podría salir mal si una columna que parece numérica (como `quiz1`) en realidad tuviera una fila con texto, como `"absent"`? ¿Qué dtype probablemente inferiría pandas para toda la columna?
- Pasaste 5 semanas de Python 101 construyendo a mano la lógica de lectura de CSV y promediado. ¿Qué líneas específicas de esa lógica reemplaza `pd.read_csv(...).describe()`? ¿Se pierde realmente algo al usar el atajo, o solo se ahorra tiempo?
- `df.set_index("name")` cambia el índice numérico por defecto por uno con significado. ¿Qué saldría mal si la columna `name` tuviera un valor duplicado — se podría seguir distinguiendo a dos estudiantes distintos después?

## ✅ Cuestionario semanal

<div class="quiz" data-quiz="data-analysis-normal-week-6">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. Una Series de pandas se describe mejor como:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Una tabla 2D de filas y columnas</button>
        <button class="quiz-q__opt" data-idx="1">Una sola columna etiquetada de datos</button>
        <button class="quiz-q__opt" data-idx="2">Un archivo CSV en disco</button>
        <button class="quiz-q__opt" data-idx="3">Un dict de Python sin etiquetas</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. ¿Qué función carga un archivo CSV en un DataFrame?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">pd.load_csv()</button>
        <button class="quiz-q__opt" data-idx="1">pd.read_csv()</button>
        <button class="quiz-q__opt" data-idx="2">pd.DataFrame.open()</button>
        <button class="quiz-q__opt" data-idx="3">pd.csv()</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. df.describe() por defecto resume:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Todas las columnas, incluyendo texto</button>
        <button class="quiz-q__opt" data-idx="1">Solo columnas numéricas</button>
        <button class="quiz-q__opt" data-idx="2">Solo la primera fila</button>
        <button class="quiz-q__opt" data-idx="3">Solo los nombres de columnas</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. df.shape devuelve:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Los nombres de las columnas</button>
        <button class="quiz-q__opt" data-idx="1">Una tupla (filas, columnas)</button>
        <button class="quiz-q__opt" data-idx="2">Los tipos de datos de cada columna</button>
        <button class="quiz-q__opt" data-idx="3">Las primeras 5 filas</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. df.set_index(&quot;name&quot;) por defecto:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Modifica df in situ y devuelve None</button>
        <button class="quiz-q__opt" data-idx="1">Devuelve un nuevo DataFrame, dejando el df original sin cambios</button>
        <button class="quiz-q__opt" data-idx="2">Elimina la columna name por completo</button>
        <button class="quiz-q__opt" data-idx="3">Solo funciona con columnas numéricas</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

