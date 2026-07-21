---
title: "Semana 9: Visualizaciones Avanzadas y Narrativas"
sidebar_position: 4
section: data-analysis
track: hard
week: 9
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 9: Visualizaciones Avanzadas y Narrativas

<span className="gamified-flourish">🎨 Un gráfico correcto y un gráfico *convincente* no son automáticamente lo mismo. Esta semana se trata de la diferencia.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Construir visualizaciones facetadas/multipanel que muestren una relación desglosada por una tercera variable categórica.
- Usar el color, el orden y la anotación deliberadamente para que el punto de un gráfico quede claro de un vistazo.
- Elegir una paleta de colores intencional y apta para daltónicos en lugar de la primera por defecto.
- Criticar un gráfico por lo que muestra honestamente y lo que no.
- Guardar un gráfico terminado en un archivo para incluirlo en un informe.

## Lección

### Facetado: añadir una tercera dimensión con paneles

Un diagrama de dispersión muestra dos variables numéricas; las herramientas de facetado de `seaborn` añaden una tercera dimensión —normalmente categórica— dividiendo en una cuadrícula de paneles pequeños y comparables en lugar de amontonar todo en un solo gráfico:

```python
import seaborn as sns
import matplotlib.pyplot as plt

sns.relplot(
    data=df,
    x="reading_score",
    y="writing_score",
    col="test_preparation_course",   # un panel por categoría, lado a lado
    hue="gender",                     # color dentro de cada panel
)
plt.show()
```

Esto responde una pregunta genuinamente multivariada en una sola figura: ¿se ve distinta la relación lectura/escritura para los estudiantes que completaron la preparación del examen frente a los que no, *y* eso difiere según el género — todo a la vez, comparable lado a lado porque cada panel comparte las mismas escalas de eje. Añadir `row=` junto con `col=` extiende esto a una cuadrícula completa — una dimensión a través de columnas, otra a través de filas:

```python
sns.relplot(
    data=df, x="reading_score", y="writing_score",
    col="test_preparation_course", row="lunch", hue="gender",
)
```

Esta ahora es una figura genuinamente de 4 variables (lectura, escritura, preparación del examen, lunch, género — cinco, en realidad) — impresionante, pero vale la pena sopesarla frente al error de "demasiadas dimensiones en un gráfico" de abajo.

### Ordenar las categorías deliberadamente

Por defecto, los ejes categóricos a menudo se ordenan alfabéticamente o por orden de aparición — rara vez el orden más legible. Ordenar explícitamente por un valor significativo (como la media del grupo) hace que el patrón de un gráfico de barras sea inmediatamente legible en lugar de requerir que el lector lo busque:

```python
order = df.groupby("parental_level_of_education")["math_score"].mean().sort_values().index

sns.barplot(data=df, x="parental_level_of_education", y="math_score", order=order)
plt.xticks(rotation=45, ha="right")
plt.title("Average math score by parental education level (ordered)")
plt.tight_layout()
plt.show()
```

`sns.barplot` (a diferencia de un gráfico de barras de matplotlib simple) calcula automáticamente la media por categoría y añade barras de error que representan la incertidumbre — vale la pena saberlo para no confundirlo con conteos crudos.

### Elegir una paleta deliberada y apta para daltónicos

La paleta por defecto de Seaborn es un punto de partida razonable, pero las elecciones de color intencionales comunican más: usa una paleta **secuencial** (de claro a oscuro) para una variable numérica ordenada, una paleta **divergente** (dos colores que se encuentran en un punto medio neutro) para valores que significativamente van tanto por encima como por debajo de algún punto central (como el `"coolwarm"` del mapa de calor de correlación de la Semana 8), y una paleta **cualitativa** para categorías sin orden. La paleta `"colorblind"` de Seaborn es un valor por defecto seguro y deliberado cada vez que el color necesita distinguir categorías de forma confiable para todo lector:

```python
sns.barplot(data=df, x="parental_level_of_education", y="math_score", order=order, palette="colorblind")
```

Aproximadamente 1 de cada 12 hombres tiene alguna forma de deficiencia en la visión del color — usar por defecto una paleta apta para daltónicos no cuesta nada y no excluye a nadie, que es por qué es un valor por defecto razonable en lugar de una elección de caso especial.

### Anotar el punto directamente

Un gráfico con una afirmación específica ("los estudiantes que completaron la preparación del examen obtuvieron, en promedio, N puntos más") es más convincente cuando ese número es visible en el propio gráfico, no dejado para que el lector lo calcule a partir de posiciones de eje:

```python
means = df.groupby("test_preparation_course")["math_score"].mean()
ax = means.plot(kind="bar")
for i, value in enumerate(means):
    ax.text(i, value + 1, f"{value:.1f}", ha="center")
plt.ylabel("Average math score")
plt.title("Average math score by test preparation status")
plt.show()
```

### Guardar un gráfico para tu informe

Una vez que un gráfico está terminado, `plt.savefig` lo escribe en un archivo de imagen — útil para incluirlo en un informe escrito en lugar de solo verlo en línea:

```python
plt.savefig("math_score_by_prep.png", dpi=150, bbox_inches="tight")
```

`dpi=150` controla la resolución de la imagen (más alto = más nítido, pero un archivo más grande); `bbox_inches="tight"` recorta el espacio en blanco sobrante alrededor de la figura. Llama a `plt.savefig(...)` *antes* de `plt.show()` en la misma celda — algunos entornos limpian la figura actual una vez que se ha mostrado.

### Gráficos honestos: qué vigilar

Algunas formas comunes en que los gráficos engañan, incluso sin ningún número fabricado:
- **Eje y truncado**: empezar el eje y de un gráfico de barras por encima de 0 exagera visualmente las diferencias pequeñas. Los gráficos de barras casi siempre deberían empezar en 0; los gráficos de línea/dispersión que comparan *cambio* son una excepción más defendible.
- **Rango de eje seleccionado a conveniencia**: hacer zoom en un rango de eje x estrecho puede hacer que el ruido parezca una tendencia significativa.
- **Escalas de color sin etiquetar o engañosas**: la escala de color de un mapa de calor debería estar etiquetada y, según la Semana 8, fijada a un rango consistente para una comparabilidad genuina.
- **Sobretrazado (overplotting)**: demasiados puntos superpuestos (corregido con `alpha`, según la Semana 8, o agregación) pueden esconder visualmente la densidad real de una relación.

Un gráfico narrativo gana confianza haciendo que su honestidad sea fácil de verificar, no solo luciendo pulido.

## ⚠️ Errores comunes

- **Apilar demasiadas dimensiones en un solo gráfico.** `row=`/`col=`/`hue=` juntos técnicamente pueden mostrar 4-5 variables a la vez, pero un gráfico que necesita un párrafo de explicación para descifrarse por lo general ya pasó el punto de ser genuinamente más informativo que dos gráficos más simples.
- **Elegir una paleta por apariencia en lugar de significado.** Una paleta arcoíris sobre una variable ordenada (como calificaciones de examen divididas en 5 rangos) hace que el *orden* sea más difícil de percibir de lo que lo haría una paleta secuencial apropiada.
- **Olvidar que `plt.savefig()` debe ir antes de `plt.show()`.** Llamarlos en el orden equivocado puede guardar una imagen en blanco en algunos entornos.
- **Confundir las barras de error de `sns.barplot` con otra cosa.** Representan la incertidumbre en la media estimada (por defecto, un intervalo de confianza bootstrap) — no la dispersión cruda de los datos, que es lo que muestra en su lugar un diagrama de caja (Semana 7/8).

## 🧩 Retos

<Challenge id="dataanalysis-hard-w9-c1" answer={<><code>sns.relplot(data=df, x="math_score", y="reading_score", col="lunch")</code> — un panel de dispersión por categoría de lunch, compartiendo escalas de eje para comparación directa.</>}>

Crea un diagrama de dispersión facetado de `math_score` frente a `reading_score`, con un panel por categoría de `lunch`.

</Challenge>

<Challenge id="dataanalysis-hard-w9-c2" answer={<>Calcula <code>order = df.groupby("race_ethnicity")["writing_score"].mean().sort_values().index</code> y luego pasa <code>order=order</code> a <code>sns.barplot</code> — esto ordena las barras de menor a mayor promedio en lugar de un orden arbitrario por defecto.</>}>

Construye un gráfico de barras del `writing_score` promedio por `race_ethnicity`, con las barras explícitamente ordenadas de menor a mayor promedio.

</Challenge>

<Challenge id="dataanalysis-hard-w9-c3" answer={<>Un eje y que no empieza en 0 en un gráfico de barras exagera el tamaño visual de las diferencias entre barras — dos barras que difieren en solo unos pocos puntos pueden verse dramáticamente distintas en altura si el eje está truncado cerca de sus valores.</>}>

Toma uno de tus gráficos de barras de esta semana y deliberadamente establece `plt.ylim(bottom=some_value_above_0)`. Compara las dos versiones lado a lado — ¿cómo engaña visualmente la versión truncada sobre el tamaño de la diferencia?

</Challenge>

<Challenge id="dataanalysis-hard-w9-c4" answer={<>Recorre con un bucle usando <code>enumerate</code> sobre las medias de los grupos y llama a <code>ax.text(i, value + 1, f"{'{'}value:.1f{'}'}", ha="center")</code> para cada barra — colocando el valor numérico justo encima de cada barra, centrado horizontalmente.</>}>

Toma un gráfico de barras de medias de grupo y anota cada barra con su valor numérico directamente encima de ella, como se muestra en la lección.

</Challenge>

<Challenge id="dataanalysis-hard-w9-c5" answer={<>Añade palette="colorblind" a cualquiera de los gráficos de esta semana que usen hue o colores de categoría, p. ej. sns.barplot(..., palette="colorblind") o sns.relplot(..., hue="gender", palette="colorblind"), y compara visualmente con la paleta por defecto.</>}>

Toma un gráfico de esta semana que use color para distinguir categorías, y rehazlo con `palette="colorblind"`. ¿Se sigue leyendo claramente la distinción entre categorías?

</Challenge>

<Challenge id="dataanalysis-hard-w9-c6" answer={<>Llama a plt.savefig("my_chart.png", dpi=150, bbox_inches="tight") justo después de construir un gráfico y antes de plt.show(), luego confirma que el archivo existe (p. ej. mediante un listado de archivos) con un tamaño razonable, distinto de cero.</>}>

Guarda uno de los gráficos terminados de esta semana en un archivo PNG usando `plt.savefig`, con `dpi=150` y `bbox_inches="tight"`.

</Challenge>

## 🤔 Preguntas socráticas

- Facetar por `test_preparation_course` y colorear por `gender` pone cuatro combinaciones de información en una figura. ¿En qué punto añadir más dimensiones a un solo gráfico empieza a hacerlo *más difícil* de leer en lugar de más informativo? ¿Cómo decidirías cuándo dividir en figuras separadas en su lugar?
- `sns.barplot` muestra *medias con barras de error*, mientras que un gráfico de barras simple de conteos crudos muestra algo totalmente distinto. ¿Qué podría salir mal si un lector asumiera que un `sns.barplot` estaba mostrando conteos?
- Ahora conoces varias formas en que un gráfico puede engañar sin ningún número fabricado (ejes truncados, rangos seleccionados a conveniencia, escalas sin etiquetar). Dado eso, ¿cuál es tu estándar para decidir si un gráfico que hiciste para tu propio informe de la Semana 10 es "honesto", más allá de solo "los números son correctos"?
- Las paletas secuenciales, divergentes y cualitativas encajan cada una con un tipo distinto de variable. ¿Qué saldría mal visualmente si usaras una paleta divergente (dos colores que se encuentran en un punto medio neutro) sobre una variable categórica simple sin orden como `race_ethnicity`?
- Una paleta apta para daltónicos no cuesta nada usar por defecto. ¿Se te ocurren otras elecciones de "accesible por defecto, no cuesta nada" de semanas anteriores (etiquetas de eje, títulos de gráfico, evitar el color como la *única* forma de distinguir grupos) que sigan el mismo principio?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="data-analysis-hard-week-9"
  questions={[
    {
      id: 'q1',
      prompt: 'El facetado (p. ej. sns.relplot con col=...) se usa para:',
      options: [
        'Eliminar valores atípicos automáticamente',
        'Añadir una tercera dimensión (a menudo categórica) mediante una cuadrícula de paneles comparables',
        'Convertir columnas numéricas a categóricas',
        'Calcular la correlación automáticamente',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: '¿Por qué el eje y de un gráfico de barras casi siempre debería empezar en 0?',
      options: [
        'Es un requisito de matplotlib',
        'Empezar por encima de 0 exagera visualmente las diferencias entre barras',
        'Hace que el gráfico se renderice más rápido',
        'Es solo una preferencia de estilo sin efecto real',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'sns.barplot, a diferencia de un gráfico de barras simple de valores crudos, muestra automáticamente:',
      options: [
        'Solo conteos crudos',
        'La media por categoría con barras de error',
        'Una matriz de correlación',
        'Un diagrama de caja en lugar de barras',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Ordenar explícitamente las barras por su valor medio (en lugar de alfabéticamente) principalmente mejora:',
      options: [
        'Las estadísticas subyacentes',
        'La legibilidad — el patrón se vuelve inmediatamente visible',
        'Nada — el orden no afecta la interpretación',
        'El coeficiente de correlación',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'Una paleta "colorblind" es una elección por defecto razonable porque:',
      options: [
        'Es la única paleta que seaborn soporta',
        'Asegura que las distinciones de categoría sigan siendo visibles para lectores con deficiencia en la visión del color, sin costo real',
        'Solo funciona con datos numéricos',
        'Es requerida por matplotlib',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-9" />
