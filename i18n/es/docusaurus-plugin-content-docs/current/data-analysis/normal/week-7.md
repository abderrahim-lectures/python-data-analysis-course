---
title: "Semana 7: Selección, Filtrado e Indexación"
sidebar_position: 2
section: data-analysis
track: normal
week: 7
description: "Selecciona, filtra e indexa DataFrames de pandas para responder preguntas reales sobre un conjunto de datos."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 7: Selección, Filtrado e Indexación

<span className="gamified-flourish">🔍 La semana pasada miraste la tabla completa. Esta semana aprendes a hacerle preguntas.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Seleccionar filas y columnas con `.loc` y `.iloc`.
- Filtrar filas usando una **máscara booleana**, el equivalente en pandas de la notación de construcción de conjuntos.
- Combinar múltiples condiciones con `&`, `|` y `~`.
- Usar `.isin()` y `.between()` para atajos comunes de filtrado.

## Lección

### `.loc` frente a `.iloc`

Ambos seleccionan filas/columnas, pero por distintos tipos de dirección:

```python
df.loc[0, "name"]      # por etiqueta: fila etiquetada 0, columna etiquetada "name"
df.iloc[0, 0]           # por posición: primera fila, primera columna, sin importar las etiquetas
df.loc[0:2]             # filas etiquetadas 0 a 2, INCLUSIVE
df.iloc[0:2]             # filas en las posiciones 0, 1 — fin EXCLUSIVO, como el slicing de Python
```

`.loc` es inclusivo en ambos extremos porque direcciona por *etiqueta*, no por posición — una diferencia importante y fácil de pasar por alto respecto al slicing semiabierto habitual de Python (que sí sigue `.iloc`). Ambos aceptan una *combinación* de selectores de filas y columnas, filtrando ambos ejes en una sola llamada:

```python
df.loc[0:2, "name"]              # filas 0-2, solo la columna name, como una Series
df.loc[0:2, ["name", "quiz1"]]    # filas 0-2, dos columnas, como un DataFrame
```

### Máscaras booleanas: la notación de construcción de conjuntos de pandas

Recuerda la notación de construcción de conjuntos: $\{x \in S : P(x)\}$. En pandas, una condición como `df["score"] >= 60` produce una `Series` de valores `True`/`False` — una **máscara booleana**— e indexar un DataFrame con esa máscara conserva solo las filas donde es `True`:

```python
mask = df["quiz1"] >= 60
mask                   # una Series de True/False, una por fila
df[mask]                # solo las filas donde quiz1 >= 60

# más comúnmente escrito en una sola línea:
df[df["quiz1"] >= 60]
```

Esta es directamente la forma en código de $\{ \text{fila} \in df : \text{fila.quiz1} \ge 60 \}$ — exactamente la misma idea que un filtro de comprensión de lista de Python 101, solo que operando sobre una columna entera a la vez en lugar de recorrer elemento por elemento con un bucle. Una máscara también puede combinarse con `.loc` para filtrar filas *y* elegir columnas en una sola llamada:

```python
df.loc[df["quiz1"] >= 60, ["name", "quiz1"]]   # solo los estudiantes aprobados, solo estas 2 columnas
```

### Combinar condiciones

Usa `&` (y), `|` (o), `~` (no) — **no** los `and`/`or`/`not` de Python, que no funcionan elemento a elemento sobre Series. Cada condición necesita sus propios paréntesis debido a la precedencia de operadores:

```python
df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]    # aprobó ambos quizzes
df[(df["quiz1"] < 60) | (df["quiz2"] < 60)]       # reprobó al menos uno
df[~(df["quiz1"] >= 60)]                            # NO aprobó quiz1 — igual que df["quiz1"] < 60
```

### Atajos de filtrado: `.isin()` y `.between()`

Dos patrones de filtrado comunes tienen métodos dedicados, más legibles, en lugar de cadenas de `|`/comparaciones:

```python
df[df["name"].isin(["Amina", "Sara"])]        # filas donde name es uno de una lista de valores
df[df["quiz1"].between(60, 80)]                 # filas donde 60 <= quiz1 <= 80, inclusive
```

`df["name"].isin([...])` es el equivalente vectorizado de la prueba de pertenencia `value in some_list` de Python 101, aplicada al `name` de cada fila a la vez — y te ahorra tener que escribir `(df["name"] == "Amina") | (df["name"] == "Sara")` a mano.

### Seleccionar columnas

```python
df["name"]                    # una columna, como una Series
df[["name", "quiz1"]]          # varias columnas, como un DataFrame (nota los corchetes dobles)
```

## ⚠️ Errores comunes

- **Usar los `and`/`or` de Python en lugar de `&`/`|`.** `df["quiz1"] >= 60 and df["quiz2"] >= 60` lanza `ValueError: The truth value of a Series is ambiguous` — los `and`/`or` de Python esperan un único `True`/`False`, no una Series completa de ellos.
- **Olvidar los paréntesis alrededor de cada condición.** `df[df["quiz1"] >= 60 & df["quiz2"] >= 60]` (sin paréntesis) es una trampa de precedencia — `&` se une *más fuerte* que `>=`, así que esto se analiza de forma muy distinta a lo que pretendías. Siempre pon entre paréntesis cada condición al combinar con `&`/`|`.
- **Confundir `.loc[0:2]` (inclusivo) con `.iloc[0:2]` (exclusivo).** Este es el error de `.loc`/`.iloc` más común de todos — verifica dos veces cuál estás usando cada vez que el conteo de filas de un slice se vea desfasado por uno.
- **Corchetes simples cuando querías un DataFrame.** `df["name", "quiz1"]` (corchetes simples, coma adentro) no es válido — necesitas la forma de corchetes dobles `df[["name", "quiz1"]]`.

## 🧩 Retos

<Challenge id="dataanalysis-normal-w7-c1" answer={<><code>df[df["quiz1"] &gt;= 90]</code> — una máscara booleana que conserva solo las filas donde quiz1 es al menos 90.</>}>

Usando `students-normal.csv`, selecciona todas las filas donde `quiz1` sea 90 o más.

</Challenge>

<Challenge id="dataanalysis-normal-w7-c2" answer={<><code>df[(df["quiz1"] &gt;= 60) &amp; (df["quiz2"] &gt;= 60) &amp; (df["quiz3"] &gt;= 60)]</code> — tres condiciones encadenadas combinadas con <code>&amp;</code>, cada una entre paréntesis.</>}>

Selecciona los estudiantes que aprobaron (≥60) *los tres* quizzes a la vez, combinando tres condiciones.

</Challenge>

<Challenge id="dataanalysis-normal-w7-c3" answer={<><code>df.iloc[0:3]</code> selecciona las primeras tres filas por posición; <code>df.loc[0:3]</code> seleccionaría las filas etiquetadas 0, 1, 2 y 3 — cuatro filas — ya que el fin del slice de <code>.loc</code> es inclusivo.</>}>

Selecciona las primeras 3 filas del DataFrame usando `.iloc`. Luego prueba `.loc[0:3]` — ¿cuántas filas devuelve, y por qué difiere eso de `.iloc[0:3]`?

</Challenge>

<Challenge id="dataanalysis-normal-w7-c4" answer={<><code>df[["name", "quiz1"]]</code> — corchetes dobles: los corchetes externos indexan el DataFrame, los corchetes internos son una lista de Python de nombres de columnas.</>}>

Selecciona juntas solo las columnas `name` y `quiz1`, como un DataFrame (no una Series individual).

</Challenge>

<Challenge id="dataanalysis-normal-w7-c5" answer={<><code>df[df["name"].isin(["Amina", "Karim", "Sara"])]</code> — filtra solo las filas cuyo nombre coincide con uno de los tres valores dados.</>}>

Usando `.isin()`, selecciona las filas de tres estudiantes específicos por nombre (elige cualesquiera tres nombres del dataset).

</Challenge>

<Challenge id="dataanalysis-normal-w7-c6" answer={<><code>df.loc[df["quiz1"] &lt; 60, ["name", "quiz1"]]</code> — combina una máscara booleana (filas) con una lista de columnas, en una sola llamada a .loc.</>}>

Usando `.loc` con una máscara booleana *y* una lista de columnas en la misma llamada, selecciona solo las columnas `name` y `quiz1` para los estudiantes que reprobaron `quiz1` (por debajo de 60).

</Challenge>

## 🤔 Preguntas socráticas

- ¿Por qué `df[df["quiz1"] >= 60 and df["quiz2"] >= 60]` (usando el `and` de Python) lanza un error, mientras que `df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]` (usando `&`) funciona? ¿Qué está tratando de hacer `and` con dos Series completas que no tiene sentido?
- Una máscara booleana en sí misma es solo una `Series` de valores `True`/`False`, con la misma forma que el índice de filas del DataFrame. ¿Qué calcularía `mask.sum()`, y por qué sería significativo ese número?
- Que `.loc[0:2]` sea inclusivo mientras que `.iloc[0:2]` es exclusivo es una fuente común de errores de desfase por uno. ¿Se te ocurre un caso donde las *etiquetas* de fila ni siquiera sean enteros (p. ej. después de algún filtrado) — qué significaría entonces `.loc[0:2]`?
- `df["name"].isin([...])` y una cadena de comparaciones con `|` producen las mismas filas. Más allá de ser más corto de escribir, ¿se te ocurre alguna razón por la que `.isin()` también podría ser *menos* propenso a errores para una lista con muchos valores?
- `~` niega una máscara booleana. ¿Es `~(df["quiz1"] >= 60)` siempre exactamente lo mismo que `df["quiz1"] < 60`? ¿Qué podría hacer que difirieran si la columna tuviera valores faltantes (`NaN`) — un tema que la próxima semana cubre en profundidad?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="data-analysis-normal-week-7"
  questions={[
    {
      id: 'q1',
      prompt: '¿Qué operador combina dos máscaras booleanas en pandas (no el and/or de Python)?',
      options: ['and / or', '&& / ||', '& / |', 'ambos funcionan igual'],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: '.loc selecciona por:',
      options: ['Solo posición', 'Etiqueta', 'Acceso aleatorio', 'Dtype de columna'],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'df[df["score"] >= 60] funciona porque df["score"] >= 60 produce:',
      options: [
        'Un único valor True/False',
        'Una Series booleana, usada para filtrar filas',
        'Un nuevo DataFrame con una columna',
        'Un SyntaxError',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'df[["name", "quiz1"]] (corchetes dobles) devuelve:',
      options: ['Una Series', 'Un DataFrame con esas dos columnas', 'Un único valor', 'Una lista de nombres de columnas'],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'df["quiz1"].between(60, 80) selecciona filas donde quiz1 está:',
      options: [
        'Exactamente en 60 o exactamente en 80',
        'Entre 60 y 80, inclusive',
        'Solo mayor que 80',
        'No es igual ni a 60 ni a 80',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-7" />
