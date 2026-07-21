---
title: "Semana 9: Groupby, Agregación y Fusión"
sidebar_position: 4
section: data-analysis
track: normal
week: 9
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 9: Groupby, Agregación y Fusión

<span className="gamified-flourish">🗂️ "Divide el dataset en grupos, luego resume cada grupo" es una sola frase en pandas y unas diez líneas en Python puro.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Particionar un DataFrame en grupos con `.groupby()`, y explicar la conexión con particionar un conjunto.
- Calcular agregados por grupo (`.mean()`, `.sum()`, `.count()`, y varios a la vez con `.agg()`).
- Agrupar por más de una columna a la vez, y convertir un resultado agrupado de vuelta en un DataFrame simple.
- Combinar dos DataFrames con `.merge()`, emparejando filas por una clave compartida.

## Lección

### `.groupby()`: particionar un conjunto

Recuerda que una **partición** de un conjunto $S$ lo divide en subconjuntos disjuntos cuya unión es $S$. `.groupby("column")` hace exactamente esto: divide las filas de un DataFrame en grupos, uno por cada valor distinto en esa columna:

```python
df.groupby("lunch")               # un objeto GroupBy — grupos formados, nada calculado todavía
df.groupby("lunch")["math_score"].mean()   # media de math_score dentro de cada grupo de lunch
```

No se calcula nada hasta que adjuntas una agregación — `.groupby()` solo describe *cómo* dividir las filas.

### Agregar

Las agregaciones estándar se corresponden directamente con estadísticas que ya conoces:

```python
df.groupby("lunch")["math_score"].mean()     # promedio de math_score por tipo de lunch
df.groupby("lunch")["math_score"].count()     # cuántas filas (estudiantes) por grupo
df.groupby("lunch").agg({                      # varias columnas/estadísticas a la vez
    "math_score": "mean",
    "reading_score": "mean",
})
```

`.groupby(...)[...]` se lee de izquierda a derecha como "particiona por esta columna, y luego mira esta otra columna dentro de cada parte" — la forma en que pandas expresa "para cada grupo, calcula una estadística sobre una variable distinta".

### Agrupar por más de una columna

Pasar una *lista* de nombres de columnas agrupa por cada combinación única de sus valores a la vez — la misma idea que particionar por un par $(a, b)$ en lugar de un solo valor:

```python
df.groupby(["lunch", "gender"])["math_score"].mean()
```

Esto responde una pregunta más específica que cualquiera de las dos columnas por separado: ¿el efecto de `lunch` sobre `math_score` se mantiene igual dentro de cada `gender`, o se ve diferente una vez que los separas?

### Recuperar un DataFrame simple

Un resultado de groupby-agregación usa la(s) columna(s) agrupada(s) como su índice en lugar de un índice de fila simple `0, 1, 2, ...` — conveniente para búsquedas posteriores, pero a veces quieres recuperar un DataFrame ordinario (por ejemplo, para ordenarlo, o para fusionarlo con algo más). `.reset_index()` hace eso:

```python
summary = df.groupby("lunch")["math_score"].mean().reset_index()
# lunch          math_score
# free/reduced   58.2
# standard       66.9

summary.sort_values("math_score", ascending=False)   # ahora una columna simple por la que puedes ordenar
```

### Fusionar: combinar dos DataFrames

`.merge()` une dos DataFrames en una columna clave compartida, la misma idea que un join de base de datos o emparejar entradas entre dos tablas de referencia por un ID común:

```python
students = pd.DataFrame({"student_id": [1, 2, 3], "name": ["Amina", "Youssef", "Sara"]})
grades = pd.DataFrame({"student_id": [1, 2, 3], "grade": ["A", "B", "A"]})

merged = students.merge(grades, on="student_id")
# student_id | name    | grade
#     1      | Amina   |   A
#     2      | Youssef |   B
#     3      | Sara    |   A
```

`how="inner"` (el valor por defecto) conserva solo las filas donde la clave existe en *ambos* DataFrames; `how="left"`/`"right"`/`"outer"` controlan qué ocurre con las filas cuya clave falta del otro lado — vale la pena comprobarlo explícitamente cada vez que los conteos de filas podrían no coincidir después de una fusión. Si las columnas clave tienen nombres distintos en cada DataFrame, usa `left_on`/`right_on` en lugar de `on`:

```python
students.merge(scores, left_on="student_id", right_on="id")
```

## ⚠️ Errores comunes

- **Olvidar que `.groupby()` por sí solo no calcula nada.** `df.groupby("lunch")` por sí solo es solo una descripción de la división — siempre necesitas una agregación (`.mean()`, `.agg(...)`, etc.) adjunta para realmente ver números.
- **Asumir que una fusión conserva el conteo de filas original.** Un `merge` con una clave duplicada en cualquiera de los lados puede producir *más* filas de las que tenía cualquiera de las entradas — siempre verifica `.shape` después de una fusión de la que no estés 100% seguro.
- **No comprobar `how=` explícitamente.** El valor por defecto `"inner"` descarta silenciosamente cualquier fila cuya clave no exista del otro lado — está bien cuando eso es genuinamente lo que quieres, pero vale la pena que sea una elección deliberada, no un accidente.
- **Olvidar `.reset_index()` cuando necesitas recuperar una columna simple.** Intentar usar `.sort_values()` o `.merge()` con el índice de un resultado de groupby (en lugar de una columna regular) como si fuera una columna normal fallará o se comportará de forma inesperada hasta que hagas `.reset_index()`.

## 🧩 Retos

<Challenge id="dataanalysis-normal-w9-c1" answer={<><code>df.groupby("gender")["math_score"].mean()</code> — agrupa a los estudiantes por género, y luego promedia math_score dentro de cada grupo.</>}>

Usando un DataFrame al estilo students-performance (con columnas que incluyen `gender` y `math_score`), calcula el `math_score` promedio para cada `gender`.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c2" answer={<><code>df.groupby("test_preparation_course")["math_score"].agg(["mean", "count"])</code> — <code>.agg</code> con una lista calcula varias estadísticas para la misma columna a la vez, como columnas de resultado separadas.</>}>

Agrupa por `test_preparation_course` y calcula *tanto* la media como el conteo de `math_score` para cada grupo, en una sola llamada a `.agg(...)`.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c3" answer={<>Compara <code>df.groupby("lunch")["reading_score"].mean()</code> entre las dos categorías de lunch directamente — la que tenga la media más alta responde la pregunta.</>}>

¿Qué categoría de `lunch` tiene un `reading_score` promedio más alto? Responde usando `.groupby()`, no filtrado manual.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c4" answer={<>Crea dos DataFrames pequeños que compartan una columna clave (p. ej. <code>student_id</code>) y llama a <code>left.merge(right, on="student_id")</code>; prueba claves no coincidentes en cada lado para ver cómo <code>how="inner"</code> descarta silenciosamente las filas sin coincidencia comparado con <code>how="outer"</code>.</>}>

Crea dos DataFrames pequeños a mano (p. ej. uno con nombres de estudiantes, otro con una calificación separada para cada uno), que compartan una columna clave común, y fusiónalos. Luego, a propósito, haz que no coincida una clave y observa qué hace `how="inner"` con ella frente a `how="outer"`.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c5" answer={<><code>df.groupby(["lunch", "test_preparation_course"])["math_score"].mean()</code> — agrupa por cada combinación de las dos columnas, mostrando si los efectos se combinan, se cancelan, o se mantienen independientes.</>}>

Agrupa tanto por `lunch` como por `test_preparation_course` juntos, y calcula el `math_score` promedio para cada combinación. ¿Se mantiene el patrón del Reto 3 dentro de *ambos* grupos de preparación para el examen, o se ve distinto?

</Challenge>

<Challenge id="dataanalysis-normal-w9-c6" answer={<>Encadena .reset_index() después del groupby-agregación, luego .sort_values("math_score", ascending=False) sobre la columna simple resultante, p. ej. df.groupby("lunch")["math_score"].mean().reset_index().sort_values("math_score", ascending=False).</>}>

Toma tu resultado del Reto 1 (`math_score` promedio por `gender`), conviértelo en un DataFrame simple con `.reset_index()`, y ordénalo de mayor a menor promedio.

</Challenge>

## 🤔 Preguntas socráticas

- `.groupby("lunch")` solo (sin agregación adjunta) no imprime una tabla de números — ¿qué crees que devuelve realmente, y por qué pandas espera a calcular algo hasta que especificas una agregación?
- Si dos DataFrames que se están fusionando comparten una columna clave pero uno de los DataFrames tiene una clave *duplicada* (dos filas con el mismo `student_id`), ¿qué predices que ocurre con el conteo de filas después de fusionar? Pruébalo.
- `.groupby(...).agg({...})` te permite aplicar una agregación *distinta* a cada columna (p. ej. media de una, máximo de otra) en una sola llamada. ¿Por qué promediar cada columna con la misma estadística podría no tener siempre sentido para un dataset real?
- Agrupar por dos columnas a la vez (`["lunch", "test_preparation_course"]`) puede revelar un patrón que agrupar por cualquiera de las columnas por separado esconde, o hacer que un patrón que parecía fuerte en realidad se vea más débil una vez que tienes en cuenta el segundo factor. ¿Por qué dividir en grupos más finos a veces cambia tanto la historia?
- Un resultado de groupby-agregación usa la columna agrupada como su índice en lugar de un índice entero simple. ¿Qué diferencia práctica marca eso la primera vez que intentas usar `.iloc[0]` en él, comparado con un DataFrame ordinario?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="data-analysis-normal-week-9"
  questions={[
    {
      id: 'q1',
      prompt: '¿Qué hace df.groupby("lunch") por sí solo (sin agregación adjunta)?',
      options: [
        'Imprime inmediatamente las medias de los grupos',
        'Describe cómo dividir las filas en grupos, sin calcular nada todavía',
        'Lanza un error',
        'Elimina filas con valores de lunch faltantes',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: '¿Qué tipo de fusión conserva solo las filas cuya clave existe en ambos DataFrames?',
      options: ['outer', 'left', 'inner', 'cross'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'df.groupby("lunch").agg({"math_score": "mean", "reading_score": "mean"}) calcula:',
      options: [
        'Un promedio combinado entre ambas columnas',
        'La media de cada columna listada, por separado, dentro de cada grupo',
        'Una fusión entre math_score y reading_score',
        'La media general, ignorando los grupos',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Un .merge() de DataFrame es conceptualmente más parecido a:',
      options: [
        'Un filtro de máscara booleana',
        'Ordenar por una columna',
        'Un join al estilo de base de datos sobre una clave compartida',
        'Eliminar valores faltantes',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: '¿Qué hace .reset_index() después de un groupby-agregación?',
      options: [
        'Elimina los valores agregados',
        'Convierte la columna agrupada de vuelta en una columna simple, con un índice entero normal',
        'Agrupa los datos de nuevo',
        'Fusiona con otro DataFrame',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-9" />
