---
title: "Semana 7: Análisis Univariado y Visualización"
sidebar_position: 2
section: data-analysis
track: hard
week: 7
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 7: Análisis Univariado y Visualización

<span className="gamified-flourish">📈 "Univariado" suena intimidante. Solo significa: mira una variable a la vez, correctamente, antes de compararla con cualquier otra cosa.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Visualizar la distribución de una columna numérica con un histograma, y la de una columna categórica con un gráfico de barras.
- Leer un diagrama de caja (boxplot) como un resumen compacto de los cuartiles y valores atípicos de una distribución.
- Elegir el tipo de gráfico correcto para el tipo de una variable, y etiquetar los gráficos para que sean legibles por sí solos.
- Explicar por qué el número de bins de un histograma es en sí mismo una elección significativa, no un valor por defecto arbitrario.

## Lección

### ¿Por qué visualizar, y no solo resumir con números?

El `mean`/`median`/`std` de la Semana 6 describe una distribución con tres números — pero distribuciones muy distintas pueden compartir la misma media y desviación estándar. Un gráfico muestra la *forma*: ¿es simétrica, sesgada, bimodal (dos jorobas), llena de valores atípicos? Esta es la razón central por la que la visualización univariada viene antes que cualquier cosa más avanzada.

### Histogramas: distribución de una variable numérica

Un histograma agrupa en bins los valores de una columna numérica y muestra cuántos caen en cada bin — un visual directo de la distribución de frecuencias, la versión graficada de los números de `mean`/`median`/`std` de la semana pasada:

```python
import matplotlib.pyplot as plt

df["math_score"].hist(bins=20, edgecolor="black")
plt.xlabel("Math score")
plt.ylabel("Number of students")
plt.title("Distribution of math scores")
plt.show()
```

Siempre etiqueta tus ejes y ponle título a tu gráfico — un gráfico que solo tiene sentido con el código que lo produjo al lado no está terminado.

#### El número de bins es una elección real, no un valor por defecto que ignorar

Muy pocos bins esconde estructura real (todo se difumina en uno o dos bultos); demasiados bins muestra ruido como si fuera estructura significativa (cada bin tiene demasiado pocos puntos como para decir algo confiable). No hay un único número universalmente correcto — prueba un par de valores y observa cuál cuenta la historia más clara y honesta:

```python
fig, axes = plt.subplots(1, 3, figsize=(12, 4))
for ax, n_bins in zip(axes, [5, 20, 50]):
    df["math_score"].hist(bins=n_bins, ax=ax, edgecolor="black")
    ax.set_title(f"{n_bins} bins")
plt.tight_layout()
plt.show()
```

`plt.subplots(1, 3, figsize=(12, 4))` crea una figura con 3 paneles lado a lado (`axes` es entonces una lista de 3 áreas de gráfico individuales) — un patrón útil cada vez que quieres comparar unas cuantas variaciones del mismo gráfico a la vez, algo que reutilizarás en la Semana 9.

### Diagramas de caja: cuartiles y valores atípicos de un vistazo

Un diagrama de caja (boxplot) dibuja el percentil 25, la mediana y el percentil 75 como una caja, con "bigotes" que se extienden hasta el rango típico y puntos individuales más allá de eso marcados como posibles valores atípicos — un visual compacto de exactamente los números de cuartiles que `.describe()` ya te dio, y exactamente la misma regla $1.5 \times \text{IQR}$ de la semana pasada, dibujada visualmente:

```python
df.boxplot(column="math_score")
plt.ylabel("Math score")
plt.title("Math score spread")
plt.show()
```

Los diagramas de caja se vuelven especialmente útiles una vez que comparas las distribuciones de *varios* grupos lado a lado — que es exactamente el tema bivariado de la próxima semana.

### Gráficos de barras: distribución de una variable categórica

Para una columna categórica, `.value_counts()` (Semana 6) graficado directamente como un gráfico de barras muestra qué categorías son comunes frente a raras:

```python
df["parental_level_of_education"].value_counts().plot(kind="bar")
plt.xlabel("Parental level of education")
plt.ylabel("Number of students")
plt.title("Parental education levels in the dataset")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.show()
```

`plt.xticks(rotation=45, ha="right")` rota las etiquetas de categoría largas para que no se superpongan — un arreglo pequeño pero común para la legibilidad una vez que las etiquetas se vuelven más largas que un par de caracteres. `plt.tight_layout()` evita que las etiquetas rotadas/largas queden cortadas en el borde de la figura.

### Elegir el gráfico correcto

| Tipo de variable | Gráfico |
|---|---|
| Numérica, quieres la forma de la distribución | Histograma |
| Numérica, quieres cuartiles/valores atípicos, especialmente entre grupos | Diagrama de caja |
| Categórica, quieres la frecuencia de cada categoría | Gráfico de barras |

Un gráfico de barras de una columna numérica (tratando cada calificación única como su propia "categoría") o un histograma de una columna categórica suelen ser ambos elecciones equivocadas — hacer coincidir el gráfico con el tipo real de la variable es la primera decisión de diseño, antes que cualquier estilo.

## ⚠️ Errores comunes

- **Olvidar las etiquetas de los ejes y un título.** Un gráfico que requiere que el lector ya sepa qué muestra no está terminado — siempre etiqueta ambos ejes y añade un título, incluso para un gráfico de "solo estoy explorando" que borrarás después.
- **Elegir un número de bins y nunca cuestionarlo.** Como se mostró arriba, los mismos datos pueden contar historias visuales notablemente distintas a 5 frente a 20 frente a 50 bins — siempre verifica la cordura con al menos dos números de bins antes de confiar en lo que parece decir la forma de un histograma.
- **Usar el gráfico equivocado para el tipo de variable.** Un histograma de una columna categórica (como `gender`) o un gráfico de barras de valores numéricos crudos sin agregar son ambos señales de que no se consultó primero la tabla de elección de gráfico de arriba.
- **Olvidar `plt.show()` (o una expresión final sin asignar) para mostrar realmente el gráfico**, especialmente al encadenar varias llamadas de graficación — dependiendo de tu entorno, un gráfico construido a través de varias líneas puede no renderizarse hasta que se muestre explícitamente.

## 🧩 Retos

<Challenge id="dataanalysis-hard-w7-c1" answer={<><code>df["reading_score"].hist(bins=20, edgecolor="black")</code> con etiquetas de ejes y un título — un histograma directo de la columna numérica.</>}>

Grafica un histograma de `reading_score` con ejes etiquetados y un título.

</Challenge>

<Challenge id="dataanalysis-hard-w7-c2" answer={<><code>df.boxplot(column="writing_score")</code> — lee las tres líneas de la caja como el percentil 25, la mediana y el percentil 75, y cualquier punto más allá de los bigotes como posible valor atípico.</>}>

Crea un diagrama de caja de `writing_score`. Al mirarlo, ¿la distribución parece simétrica, o la mediana está notablemente más cerca de un borde de la caja?

</Challenge>

<Challenge id="dataanalysis-hard-w7-c3" answer={<><code>df["test_preparation_course"].value_counts().plot(kind="bar")</code> con etiquetas de ejes/título — como esta columna solo tiene dos categorías, la rotación normalmente no es necesaria.</>}>

Grafica un gráfico de barras de los conteos de categorías de la columna `test_preparation_course`, con ejes etiquetados.

</Challenge>

<Challenge id="dataanalysis-hard-w7-c4" answer={<>Un histograma de <code>gender</code> tiene poco sentido: es categórica (solo "male"/"female"), así que agruparla numéricamente en bins no tiene significado — el gráfico correcto es un gráfico de barras de <code>.value_counts()</code>, exactamente como <code>test_preparation_course</code> arriba.</>}>

Alguien grafica `df["gender"].hist()`. Explica por qué esta es la elección de gráfico equivocada, y qué debería usar en su lugar.

</Challenge>

<Challenge id="dataanalysis-hard-w7-c5" answer={<>Grafica writing_score con un número de bins pequeño (p. ej. 5) y uno grande (p. ej. 50), comparándolos lado a lado usando el patrón de subplots de la lección. La versión de 5 bins probablemente se ve más suave/general; la versión de 50 bins puede verse más ruidosa/con picos, especialmente en regiones con menos estudiantes.</>}>

Grafica `writing_score` como un histograma con 5 bins, y luego de nuevo con 50 bins. Describe cómo cambia la forma aparente de la distribución entre los dos.

</Challenge>

<Challenge id="dataanalysis-hard-w7-c6" answer={<>Construye un diagrama de caja para cada una de las tres columnas de calificación usando df.boxplot(column=["math_score", "reading_score", "writing_score"]), que dibuja las tres lado a lado en una sola llamada para comparación visual directa.</>}>

Crea un único diagrama de caja mostrando las tres columnas de calificación (`math_score`, `reading_score`, `writing_score`) lado a lado, para que sus dispersiones puedan compararse de un vistazo.

</Challenge>

## 🤔 Preguntas socráticas

- Dos distribuciones pueden tener media y desviación estándar idénticas pero formas muy distintas (p. ej. una simétrica, otra con dos jorobas separadas). ¿Por qué un histograma capta esta diferencia mientras que `mean`/`std` solos no pueden?
- Un diagrama de caja marca los puntos más allá de los bigotes como posibles "valores atípicos". ¿Eso significa automáticamente que esos datos son errores que deberían eliminarse? ¿Qué más podría explicar un valor legítimamente inusual pero correcto?
- ¿Por qué `plt.xticks(rotation=45, ha="right")` importa más para `parental_level_of_education` (nombres de categoría largos) que para `gender` (cortos)? ¿Qué regla general sobre la longitud de las etiquetas y la legibilidad del gráfico sugiere esto?
- Si un colega te mostrara solo un histograma de 50 bins de una variable y afirmara ver "tres clústeres distintos", ¿qué querrías comprobar antes de confiar en esa afirmación, dado lo que ahora sabes sobre la sensibilidad al número de bins?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="data-analysis-hard-week-7"
  questions={[
    {
      id: 'q1',
      prompt: 'Un histograma es la elección correcta de gráfico para:',
      options: [
        'Los conteos de categoría de una columna categórica',
        'La forma de la distribución de una columna numérica',
        'Comparar dos DataFrames',
        'Mostrar conteos de valores faltantes',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'La caja de un diagrama de caja representa:',
      options: [
        'Solo el mínimo y el máximo',
        'El percentil 25, la mediana y el percentil 75',
        'La media y la desviación estándar',
        'Cada dato individual',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: '¿Por qué dos distribuciones con la misma media y desviación estándar aún necesitan un gráfico para compararse correctamente?',
      options: [
        'En realidad no pueden tener la misma media y desviación estándar',
        'Los gráficos siempre son más precisos que los números',
        'La misma media/desviación estándar puede provenir de distribuciones con formas muy distintas',
        'pandas requiere un gráfico antes de calcular estadísticas',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q4',
      prompt: 'El gráfico correcto para el value_counts() de una columna categórica es:',
      options: ['Un histograma', 'Un diagrama de caja', 'Un gráfico de barras', 'Un diagrama de dispersión'],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: '¿Por qué comprobar un histograma con más de un número de bins?',
      options: [
        'No es necesario, un número de bins siempre es suficiente',
        'Muy pocos bins pueden esconder estructura, demasiados pueden mostrar ruido como si fuera estructura',
        'matplotlib requiere al menos dos números de bins distintos para renderizar',
        'Solo importa para columnas categóricas',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-7" />
