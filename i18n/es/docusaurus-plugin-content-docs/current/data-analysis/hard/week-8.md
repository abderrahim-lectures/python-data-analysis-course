---
title: "Semana 8: Análisis Bivariado y Multivariado"
sidebar_position: 3
section: data-analysis
track: hard
week: 8
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 8: Análisis Bivariado y Multivariado, Correlación

<span className="gamified-flourish">🔗 La semana pasada: una variable a la vez. Esta semana: ¿cómo se mueven juntas dos (o más) variables?</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Calcular e interpretar un **coeficiente de correlación** entre dos variables numéricas.
- Visualizar una relación entre dos variables numéricas con un diagrama de dispersión, y entre una variable numérica y una categórica con diagramas de caja agrupados.
- Usar una tercera variable (color, o una segunda columna categórica) para añadir una dimensión a un gráfico de dos variables.
- Comparar dos variables categóricas con una tabulación cruzada.
- Explicar, con precisión, por qué la correlación no implica causalidad.

## Lección

### Correlación: ¿cómo se mueven juntas dos variables numéricas?

El **coeficiente de correlación de Pearson** $r$ mide la fuerza y dirección de una relación *lineal* entre dos variables numéricas, en un rango de $-1$ (negativa perfecta) pasando por $0$ (sin relación lineal) hasta $+1$ (positiva perfecta):

```python
df["math_score"].corr(df["reading_score"])   # un único número entre -1 y 1
```

Una regla aproximada (no universalmente acordada, pero comúnmente usada) para interpretar $|r|$:

| $|r|$ | Interpretación aproximada |
|---|---|
| 0.0 – 0.2 | Muy débil / insignificante |
| 0.2 – 0.4 | Débil |
| 0.4 – 0.6 | Moderada |
| 0.6 – 0.8 | Fuerte |
| 0.8 – 1.0 | Muy fuerte |

Trata esto como una intuición de partida, no como un corte rígido — lo que cuenta como "fuerte" puede depender mucho del campo y de la pregunta específica que se esté haciendo.

Para todo el conjunto de columnas numéricas a la vez, `.corr()` sobre el DataFrame produce una matriz de correlación completa — el valor $r$ de cada par, incluyendo cada variable trivialmente correlacionada $1.0$ consigo misma:

```python
df[["math_score", "reading_score", "writing_score"]].corr()
```

Un mapa de calor (heatmap) visualiza esta matriz de un vistazo, usando la intensidad del color para la fuerza de la correlación:

```python
import seaborn as sns
import matplotlib.pyplot as plt

corr_matrix = df[["math_score", "reading_score", "writing_score"]].corr()
sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1)
plt.title("Correlation between score types")
plt.show()
```

`annot=True` imprime los valores reales de $r$ en cada celda; `vmin=-1, vmax=1` fija la escala de color al rango real del coeficiente, de modo que la intensidad del color sea comparable entre distintos mapas de calor en lugar de reescalarse a cualquier rango que resulte aparecer en esta matriz en particular.

### Diagramas de dispersión: visualizar una relación numérica-numérica

Un diagrama de dispersión muestra la relación cruda que un coeficiente de correlación solo resume con un número:

```python
plt.scatter(df["reading_score"], df["writing_score"], alpha=0.5)
plt.xlabel("Reading score")
plt.ylabel("Writing score")
plt.title("Reading vs. writing scores")
plt.show()
```

`alpha=0.5` hace que los puntos sean semitransparentes, de modo que los puntos superpuestos (comunes con calificaciones enteras que se repiten en muchos estudiantes) aparecen como regiones más oscuras en lugar de ocultarse por completo unos a otros.

### Añadir una tercera variable con color

Un diagrama de dispersión solo muestra dos variables directamente, pero el parámetro `hue` de `seaborn` colorea cada punto según una tercera columna (típicamente categórica), permitiéndote comprobar si una relación se mantiene de la misma forma entre grupos:

```python
sns.scatterplot(data=df, x="reading_score", y="writing_score", hue="gender", alpha=0.6)
plt.title("Reading vs. writing scores, by gender")
plt.show()
```

Si las dos nubes de puntos coloreadas parecen seguir la misma tendencia general, la relación lectura/escritura probablemente no depende mucho del género; si la nube de un color está claramente desplazada o tiene una forma distinta, eso vale la pena investigarlo más a fondo — exactamente el tipo de pregunta que los gráficos facetados de la Semana 9 están construidos para responder más a fondo.

### Diagramas de caja agrupados: variable numérica a través de categorías

Para comparar la *distribución* de una variable numérica entre categorías (no solo su promedio), usa el diagrama de caja agrupado de `seaborn` — la extensión multigrupo del diagrama de caja individual de la semana pasada:

```python
sns.boxplot(data=df, x="test_preparation_course", y="math_score")
plt.title("Math score by test preparation status")
plt.show()
```

Esto muestra más que una simple media de groupby: si la *dispersión* también difiere entre grupos, y si los valores atípicos se agrupan más en un grupo que en otro.

### Comparar dos variables categóricas: tabulación cruzada

`.corr()` solo funciona con columnas numéricas — para dos variables *categóricas*, `pd.crosstab` construye una tabla de con qué frecuencia ocurre cada combinación, el análogo categórico de una comprobación de correlación:

```python
pd.crosstab(df["gender"], df["test_preparation_course"])
pd.crosstab(df["gender"], df["test_preparation_course"], normalize="index")   # proporciones de fila en lugar de conteos
```

`normalize="index"` convierte cada fila en proporciones que suman 1 — útil para preguntar "dentro de cada género, ¿qué fracción completó la preparación del examen?" en lugar de solo conteos crudos, que pueden ser engañosos si los tamaños de los grupos en sí difieren.

### La correlación no es causalidad

Un $r$ cercano a $1$ o $-1$ te dice que dos variables se mueven juntas — no dice nada sobre si una *causa* la otra, o si ambas son impulsadas por algún tercer factor. Un ejemplo clásico de libro de texto: las ventas de helado y los incidentes de ahogamiento se correlacionan fuertemente a lo largo de un año, pero el helado no causa los ahogamientos — ambos aumentan en verano, impulsados por un tercer factor (el clima cálido, más gente nadando). Cada vez que encuentres una correlación fuerte en este dataset, pregúntate explícitamente: ¿hay un tercer factor plausible que podría explicar que ambas variables se muevan juntas?

## ⚠️ Errores comunes

- **Tratar un $r$ alto como prueba de causalidad.** Vale la pena repetir esto tan a menudo como aparezca — la correlación es una descripción de asociación, nunca una prueba de un mecanismo causal por sí sola.
- **Ignorar las diferencias de tamaño de grupo al leer una tabulación cruzada.** Los conteos crudos de `pd.crosstab` pueden verse dramáticos puramente porque un grupo es mucho más grande — `normalize="index"` (o `"columns"`) corrige esto.
- **Añadir demasiadas categorías de `hue` a un solo diagrama de dispersión.** Más de 4-5 colores en un solo gráfico suele volverse más difícil de leer, no más fácil — considera el facetado de la Semana 9 (paneles separados) en su lugar una vez que un solo gráfico codificado por color se sature.
- **Calcular `.corr()` en un DataFrame que incluye columnas no numéricas sin seleccionar primero.** Las versiones recientes de pandas manejan esto descartando silenciosamente las columnas no numéricas, pero es más claro (y más seguro entre versiones) seleccionar explícitamente solo las columnas numéricas que realmente quieres, como se mostró arriba.

## 🧩 Retos

<Challenge id="dataanalysis-hard-w8-c1" answer={<><code>df["math_score"].corr(df["writing_score"])</code> — un único coeficiente de correlación de Pearson entre las dos columnas.</>}>

Calcula el coeficiente de correlación entre `math_score` y `writing_score`.

</Challenge>

<Challenge id="dataanalysis-hard-w8-c2" answer={<><code>df[["math_score","reading_score","writing_score"]].corr()</code> y luego <code>sns.heatmap(..., annot=True)</code> — la matriz por pares visualizada con color y números impresos juntos.</>}>

Construye la matriz de correlación 3x3 completa para las tres columnas de calificación y visualízala como un mapa de calor con los valores reales anotados en cada celda.

</Challenge>

<Challenge id="dataanalysis-hard-w8-c3" answer={<><code>sns.boxplot(data=df, x="lunch", y="math_score")</code> — un diagrama de caja agrupado que compara la distribución de math_score entre las dos categorías de lunch lado a lado.</>}>

Crea un diagrama de caja agrupado que compare las distribuciones de `math_score` entre las dos categorías de `lunch`.

</Challenge>

<Challenge id="dataanalysis-hard-w8-c4" answer={<>Un tercer factor plausible es el estatus socioeconómico: podría afectar independientemente tanto al tipo de <code>lunch</code> (los programas de almuerzo gratis/reducido están ligados al ingreso del hogar) como a la preparación/recursos académicos (afectando las calificaciones) — así que el tipo de lunch y las calificaciones podrían correlacionarse sin que el lunch en sí cause las diferencias de calificación.</>}>

Si el tipo de `lunch` y `math_score` muestran una diferencia notable en tu diagrama de caja del reto anterior, propón un tercer factor plausible que podría explicar ambos sin que el tipo de `lunch` cause directamente las diferencias de calificación.

</Challenge>

<Challenge id="dataanalysis-hard-w8-c5" answer={<>sns.scatterplot(data=df, x="math_score", y="reading_score", hue="test_preparation_course", alpha=0.6) -- colorea cada punto según el estado de preparación del examen, permitiéndote comparar visualmente si la relación matemáticas/lectura se ve similar para ambos grupos.</>}>

Crea un diagrama de dispersión de `math_score` frente a `reading_score`, coloreado (`hue`) por `test_preparation_course`. ¿Se ve similar la relación para ambos grupos, o los puntos de un grupo se ven desplazados?

</Challenge>

<Challenge id="dataanalysis-hard-w8-c6" answer={<>pd.crosstab(df["lunch"], df["test_preparation_course"], normalize="index") muestra, dentro de cada categoría de lunch, qué fracción completó frente a no completó la preparación del examen -- permitiéndote comprobar si las dos variables categóricas parecen relacionadas sin necesitar una correlación numérica.</>}>

Usando `pd.crosstab` con `normalize="index"`, comprueba si el tipo de `lunch` y la finalización de `test_preparation_course` parecen estar relacionados entre sí.

</Challenge>

## 🤔 Preguntas socráticas

- Es muy probable que las tres columnas de calificación (`math`, `reading`, `writing`) se correlacionen fuertemente entre sí. ¿Cuál es una explicación plausible para eso — es más probable que cada materia genuinamente mejore a las demás, o que ambas sean impulsadas por algún factor subyacente compartido (p. ej. preparación académica general, hábitos de estudio)? ¿Cómo empezarías siquiera a distinguir estas posibilidades?
- Un coeficiente de correlación cercano a 0 significa que no hay una relación *lineal*. ¿Podrían dos variables aun así tener una relación fuerte, real y no lineal (p. ej. una forma de U) y aun así mostrar $r \approx 0$? ¿Cómo se vería eso en un diagrama de dispersión que un solo número pasaría completamente por alto?
- ¿Por qué el mapa de calor fija explícitamente `vmin=-1, vmax=1`, en lugar de dejar que la escala de color se ajuste automáticamente a cualquier rango de valores que resulte aparecer en esta matriz en particular? ¿Qué podría salir mal al comparar dos mapas de calor distintos si sus escalas de color no estuvieran fijadas de la misma manera?
- `pd.crosstab(..., normalize="index")` y `normalize="columns"` dan tablas con apariencia distinta a partir de los mismos datos crudos. ¿Cuál es la diferencia en la *pregunta* que responde cada una?
- Añadir `hue` a un diagrama de dispersión es una forma de incorporar una tercera variable. ¿Qué perderías, comparado con el facetado de la Semana 9 (paneles separados lado a lado), si intentaras codificar por color una cuarta *y* quinta variable en el mismo gráfico único?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="data-analysis-hard-week-8"
  questions={[
    {
      id: 'q1',
      prompt: 'Un coeficiente de correlación de Pearson de -0.9 indica:',
      options: [
        'Ninguna relación en absoluto',
        'Una relación positiva fuerte',
        'Una relación negativa fuerte',
        'Que una variable causa la otra',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: 'El ejemplo de las ventas de helado / incidentes de ahogamiento ilustra:',
      options: [
        'Una relación causal perfecta',
        'Correlación sin causalidad, ambas impulsadas por un tercer factor (el clima)',
        'Una correlación negativa',
        'Un error de lectura de gráfico, no un concepto estadístico',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'Un diagrama de caja agrupado (variable numérica dividida por categoría) muestra más que una media de groupby porque también revela:',
      options: [
        'Solo el tamaño exacto de la muestra',
        'La dispersión/valores atípicos dentro de cada grupo, no solo el promedio',
        'Causalidad entre las variables',
        'Muestra exactamente la misma información que un gráfico de barras de medias',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: '¿Qué hace alpha=0.5 en un diagrama de dispersión de matplotlib?',
      options: [
        'Cambia la forma del marcador',
        'Hace que los puntos sean semitransparentes para que los puntos superpuestos sean visibles',
        'Filtra la mitad de los datos',
        'Establece el umbral de correlación',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'pd.crosstab es la herramienta correcta para comparar:',
      options: [
        'Dos columnas numéricas, vía un coeficiente de correlación',
        'Dos columnas categóricas, vía conteos de cada combinación',
        'La distribución de una sola columna numérica',
        'El orden de las filas en un DataFrame',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-8" />
