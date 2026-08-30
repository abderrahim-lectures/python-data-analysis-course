---
title: "Semana 6: El Marco de Trabajo del EDA"
section: data-analysis
track: hard
week: 6
description: "Aprende el marco de trabajo del análisis exploratorio: formular preguntas y perfilar un conjunto de datos antes de analizarlo."
---


# Semana 6: El Marco de Trabajo del EDA

<span class="gamified-flourish">🕵️ El Análisis Exploratorio de Datos no es "hacer algunos gráficos". Es una forma disciplinada de hacerle preguntas a un dataset antes de confiar en cualquier conclusión que salga de él.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Explicar qué es el Análisis Exploratorio de Datos (EDA) y por qué precede a cualquier modelado o conclusión.
- Perfilar un dataset nuevo sistemáticamente: forma, dtypes, datos faltantes y distribuciones básicas.
- Formular un conjunto de preguntas analíticas concretas antes de lanzarte a los gráficos.
- Reconocer una distribución sesgada solo a partir de estadísticas resumen, antes de siquiera graficarla.
- Detectar posibles valores atípicos usando el rango intercuartílico (IQR).

## Lección

### ¿Qué es el EDA?

El EDA es la práctica de investigar la estructura, calidad y patrones de un dataset *antes* de sacar conclusiones de él — una lista de verificación contra saltar directo a "aquí está mi hallazgo" sin primero verificar que los datos realmente lo respaldan. El estadístico John Tukey, quien popularizó el término, lo enmarcó como trabajo de detective: buscar pistas, formar hipótesis, y luego comprobarlas, en lugar de asumir que el primer patrón que notas es real.

Este track de 5 semanas construye hacia un solo entregable: un informe de EDA completo sobre el dataset **Students Performance in Exams** en la Semana 10. Esta semana establece el *marco de trabajo* que aplicarás cada semana después.

### Paso 1: Perfilar el dataset

Antes de hacer cualquier pregunta interesante, establece lo básico — el mismo primer movimiento que la Semana 6/10 del track Normal, pero tratado aquí como un primer paso formal y repetible de cualquier proyecto:

```python
import pandas as pd

df = pd.read_csv("students-performance.csv")
df.shape
df.dtypes
df.isna().sum()
df.describe()
df.head()
```

Para cada columna, pregunta: ¿qué tipo de variable es esta?
- **Numérica/continua** (`math_score`, `reading_score`, `writing_score`): resumida por media, mediana, desviación estándar, forma de la distribución.
- **Categórica** (`gender`, `lunch`, `test_preparation_course`, `parental_level_of_education`): resumida por conteos/proporciones por categoría, usando `.value_counts()`.

```python
df["gender"].value_counts()
df["parental_level_of_education"].value_counts()
df["gender"].value_counts(normalize=True)   # como proporciones (0-1) en lugar de conteos crudos
```

`normalize=True` es la versión vectorizada de lo que de otro modo calcularías a mano como `count / total` — la misma idea que las probabilidades de palabras del track Difícil de Python 101, aplicada a categorías en lugar de palabras.

### Paso 2: Formular preguntas antes de graficar

Un error común de EDA es generar docenas de gráficos sin una pregunta que los guíe, y luego decidir retroactivamente cuáles "se ven interesantes" — esto invita a ver patrones que son solo ruido. En su lugar, anota un pequeño conjunto de preguntas específicas *antes* de visualizar, basadas en con qué se relacionan plausiblemente las columnas:

- ¿Completar `test_preparation_course` se asocia con calificaciones más altas?
- ¿El tipo de `lunch` (un indicador aproximado del estatus socioeconómico en este dataset) se asocia con las calificaciones?
- ¿Están correlacionadas entre sí las tres columnas de calificación (`math`, `reading`, `writing`)?

Las Semanas 7 a 9 construyen las herramientas para responder rigurosamente exactamente este tipo de preguntas; la Semana 10 responde un conjunto más completo de ellas para el informe final.

### Paso 3: Leer el sesgo solo a partir de estadísticas resumen

Antes de siquiera graficar una distribución, `mean` frente a `median` ya insinúa su forma. Para una distribución perfectamente simétrica, la media y la mediana son iguales (o muy cercanas). Una media notablemente *más alta* que la mediana sugiere un sesgo a la derecha (positivo) — un puñado de valores inusualmente altos que jalan el promedio hacia arriba; una media notablemente *más baja* que la mediana sugiere un sesgo a la izquierda (negativo):

```python
mean_score = df["math_score"].mean()
median_score = df["math_score"].median()
print(f"Mean: {mean_score:.1f}, Median: {median_score:.1f}")
```

Los histogramas de la próxima semana te permitirán *ver* esta forma directamente, pero poder leerla a partir de solo dos números es un hábito útil incluso antes de haber cargado una biblioteca de graficación.

### Paso 4: Detectar valores atípicos con el IQR

El **rango intercuartílico** (IQR) es el intervalo entre el percentil 25 y el percentil 75 — el 50% central de los datos— y da una forma robusta (no distorsionada por valores extremos) de marcar valores inusualmente extremos:

$$
\text{IQR} = Q_3 - Q_1, \quad \text{atípico si } x < Q_1 - 1.5 \cdot \text{IQR} \text{ o } x > Q_3 + 1.5 \cdot \text{IQR}
$$

```python
q1 = df["math_score"].quantile(0.25)
q3 = df["math_score"].quantile(0.75)
iqr = q3 - q1
lower_bound = q1 - 1.5 * iqr
upper_bound = q3 + 1.5 * iqr

outliers = df[(df["math_score"] < lower_bound) | (df["math_score"] > upper_bound)]
len(outliers)
```

La regla $1.5 \times \text{IQR}$ es una convención ampliamente usada (también es exactamente lo que marcan los bigotes de un diagrama de caja, que la Semana 7 cubre) — no una ley de la naturaleza, solo un valor por defecto razonable y estándar para "inusualmente lejos del 50% central".

### Paso 5: Verificar la cordura antes de confiar en un patrón

Toda estadística resumen merece un momento de escepticismo: ¿en cuántas filas se basa realmente esto? ¿Podrían los datos faltantes estar sesgándola? ¿Es una diferencia entre dos grupos lo bastante grande como para ser interesante, o podría plausiblemente ser ruido de una muestra pequeña?

```python
df.groupby("test_preparation_course")["math_score"].agg(["mean", "count"])
```

Comprobar `count` junto con `mean` importa: un promedio que se ve llamativo basado en solo 3 filas merece mucha menos confianza que el mismo promedio basado en 300.

## ⚠️ Errores comunes

- **Tratar la regla del atípico $1.5 \times \text{IQR}$ como una verdad absoluta.** Es una convención, no una ley — un "atípico" marcado podría ser un dato genuinamente correcto, aunque inusual, no un error que eliminar.
- **Confundir la dirección del sesgo.** Un sesgo a la derecha (positivo) significa una *cola más larga hacia valores altos*, con la media jalada por encima de la mediana — es fácil recordar mal cuál dirección es cuál; anclarse en "media frente a mediana" en lugar de intentar memorizar "izquierda/derecha" evita la confusión.
- **Graficar antes de formular una pregunta.** Es tentador saltar directo a `df.plot()` — resístete hasta haber anotado qué es lo que realmente estás tratando de averiguar, según el Paso 2.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Carga `students-performance.csv` y usa `.value_counts()` para ver la distribución de las categorías de la columna `lunch`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["lunch"].value_counts()</code> — cuenta cada categoría distinta y con qué frecuencia aparece, ordenadas de más a menos común por defecto.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Antes de escribir cualquier código de análisis, anota (en una celda de markdown, o simplemente como comentarios) tres preguntas específicas que este dataset podría plausiblemente responder, basándote solo en los nombres de sus columnas.

<p class="challenge__answer">💡 <strong>Answer:</strong> Anota al menos 2–3 preguntas específicas en español llano (p. ej. "¿Se asocia el nivel educativo de los padres con reading_score?") antes de escribir cualquier código de pandas para responderlas — la disciplina está en el orden, no en el código en sí.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Calcula el `writing_score` promedio agrupado por `parental_level_of_education`, junto con el conteo de estudiantes en cada grupo. ¿Hay algún grupo lo bastante pequeño como para que su promedio merezca menos confianza?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.groupby("parental_level_of_education")["writing_score"].agg(["mean", "count"])</code> — comprobar count junto con mean revela si el promedio de algún grupo se basa en muy pocas filas como para confiar en él.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Calcula la media, la mediana y la desviación estándar de `math_score`. Basándote solo en estos tres números (todavía sin gráfico), ¿esperas que la distribución sea aproximadamente simétrica, o sesgada?

<p class="challenge__answer">💡 <strong>Answer:</strong> Calcula los tres: <code>df["math_score"].mean()</code>, <code>.median()</code>, <code>.std()</code>. Una media bastante por encima o por debajo de la mediana, o una desviación estándar muy grande en relación al rango de calificaciones (0–100), serían señales de una distribución sesgada o dispersa digna de investigarse con un histograma la próxima semana.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Repite la comprobación de valores atípicos con IQR del Paso 4, pero para la columna `reading_score` en lugar de `math_score`. ¿Cuántos valores atípicos encuentras?

<p class="challenge__answer">💡 <strong>Answer:</strong> Calcula Q1, Q3 e IQR para reading_score de la misma forma que el ejemplo de math_score, luego filtra los valores fuera de [Q1 - 1.5*IQR, Q3 + 1.5*IQR] y cuenta cuántas filas califican.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Usando `.value_counts(normalize=True)`, ¿qué proporción de estudiantes completó el `test_preparation_course`?

<p class="challenge__answer">💡 <strong>Answer:</strong> Llama a df["test_preparation_course"].value_counts(normalize=True) para obtener la proporción que completó frente a la que no completó la preparación del examen, y multiplica por 100 (o formatea como porcentaje) para leerlo como porcentaje.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- El enfoque de Tukey del EDA como "trabajo de detective" implica que estás formando y probando hipótesis, no solo describiendo datos. ¿Cuál es la diferencia práctica entre "los estudiantes que completaron la preparación del examen obtuvieron calificaciones más altas en promedio" (una descripción) y tratar eso como evidencia de que la preparación del examen *causa* calificaciones más altas (una afirmación)? ¿Qué necesitarías para tener más confianza sobre la causalidad?
- ¿Por qué la lección insiste en anotar las preguntas analíticas *antes* de generar gráficos, en lugar de después? ¿Qué sesgo introduce mirar los gráficos primero en qué "preguntas" terminas haciendo?
- `df.groupby(...).agg(["mean", "count"])` se usó específicamente para que un grupo de muestra pequeña no se confundiera con un patrón fuerte. ¿Se te ocurre un grupo en este dataset donde una gran diferencia promedio podría seguir sin ser muy significativa, incluso con un conteo razonablemente grande?
- La regla de valores atípicos $1.5 \times \text{IQR}$ marca puntos como "inusuales" puramente basándose en su posición en la distribución, sin ningún conocimiento de *por qué* son inusuales. ¿Se te ocurre una razón legítima por la que la calificación de un estudiante podría ser un atípico genuino sin ser un error de captura de datos?
- Comparar la media y la mediana es una forma económica de detectar sesgo sin graficar nada. ¿Qué información *no* te da este truco que un histograma real (la próxima semana) revelaría?

## ✅ Cuestionario semanal

<div class="quiz" data-quiz="data-analysis-hard-week-6">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. El EDA se describe mejor como:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Construir un modelo predictivo lo más rápido posible</button>
        <button class="quiz-q__opt" data-idx="1">Investigar sistemáticamente la estructura y calidad de un dataset antes de sacar conclusiones</button>
        <button class="quiz-q__opt" data-idx="2">Hacer tantos gráficos como sea posible</button>
        <button class="quiz-q__opt" data-idx="3">Solo limpiar datos, sin análisis</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">2. Para una columna categórica, ¿qué método resume la distribución de sus categorías?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">.describe()</button>
        <button class="quiz-q__opt" data-idx="1">.mean()</button>
        <button class="quiz-q__opt" data-idx="2">.value_counts()</button>
        <button class="quiz-q__opt" data-idx="3">.std()</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. ¿Por qué comprobar count junto con mean al comparar grupos?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">En realidad no es útil</button>
        <button class="quiz-q__opt" data-idx="1">Una media llamativa basada en muy pocas filas merece menos confianza</button>
        <button class="quiz-q__opt" data-idx="2">count es sintaxis requerida para .groupby()</button>
        <button class="quiz-q__opt" data-idx="3">Convierte la media en un porcentaje</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">4. La lección recomienda formular las preguntas analíticas:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Después de hacer todos tus gráficos</button>
        <button class="quiz-q__opt" data-idx="1">Solo al final del informe</button>
        <button class="quiz-q__opt" data-idx="2">Antes de generar gráficos, para evitar elegir retroactivamente patrones &quot;interesantes&quot;</button>
        <button class="quiz-q__opt" data-idx="3">No importa cuándo</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. Una media notablemente más alta que la mediana sugiere:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Un sesgo a la izquierda (negativo)</button>
        <button class="quiz-q__opt" data-idx="1">Un sesgo a la derecha (positivo)</button>
        <button class="quiz-q__opt" data-idx="2">Una distribución perfectamente simétrica</button>
        <button class="quiz-q__opt" data-idx="3">Nada — la media y la mediana no están relacionadas</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

