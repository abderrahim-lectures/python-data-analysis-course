---
title: "Semana 10: Entregable Final — Informe de EDA de Students Performance"
sidebar_position: 5
section: data-analysis
track: hard
week: 10
description: "Entrega un informe completo de análisis exploratorio sobre el conjunto de datos Students Performance in Exams."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 10: Entregable Final — Informe de EDA de Students Performance

<span className="gamified-flourish">🏁 Todo de las Semanas 6 a 9 —el marco de trabajo, los gráficos univariados, el análisis de correlación, el pulido narrativo— converge en un solo informe esta semana.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Planificar y ejecutar de forma independiente un proyecto de EDA completo sobre un dataset nuevo, desde formular preguntas hasta los gráficos finales.
- Producir un informe escrito corto que combine hallazgos, evidencia (gráficos/estadísticas) e interpretación apropiadamente cautelosa.
- Identificar las limitaciones del mundo real de este dataset y qué conclusiones no puede respaldar.
- Ensamblar una estructura de informe completa a partir de las técnicas individuales de las Semanas 6 a 9.

## Lección

### El dataset: Students Performance in Exams

[`students-performance.csv`](pathname:///datasets/students-performance.csv) ([créditos aquí](/credits)) es uno de los datasets de EDA para principiantes más usados de Kaggle, con 8 columnas: `gender`, `race_ethnicity`, `parental_level_of_education`, `lunch`, `test_preparation_course`, y tres columnas de resultado numéricas — `math_score`, `reading_score`, `writing_score`.

### El entregable requerido

Produce un informe corto de EDA (un notebook con celdas de markdown explicando cada paso, o un resumen escrito junto a tu código) que incluya, como mínimo:

1. **Perfil del dataset** (Semana 6): forma, dtypes, datos faltantes, distribuciones básicas de cada columna.
2. **Al menos 3 preguntas formuladas**, escritas antes de analizarlas, cubriendo tanto:
   - una pregunta univariada (Semana 7) — p. ej. "¿cómo se ve la distribución de math_score?"
   - una pregunta bivariada o multivariada (Semana 8/9) — p. ej. "¿se asocia test_preparation_course con las calificaciones, y eso se mantiene entre géneros?"
3. **Un análisis de correlación** (Semana 8) de las tres columnas de calificación, con un mapa de calor.
4. **Al menos un gráfico narrativo facetado o anotado** (Semana 9).
5. **Una conclusión escrita corta** para cada pregunta: qué encontraste, cuánta confianza tienes (referenciando el tamaño de muestra por grupo, según la Semana 6), y una explicación alternativa plausible que no puedes descartar (según la discusión de correlación-no-es-causalidad de la Semana 8).

### El kit de herramientas completo, de un vistazo

Cada técnica de esta sección se corresponde con una parte del informe:

| Sección del informe | Técnicas (de) |
|---|---|
| Perfil del dataset | `.shape`, `.dtypes`, `.isna().sum()`, `.value_counts()`, comprobación de sesgo media-mediana (Semana 6) |
| Pregunta univariada | Histograma, diagrama de caja, gráfico de barras, sensibilidad al número de bins (Semana 7) |
| Pregunta bivariada/multivariada | `.corr()`, mapa de calor, diagrama de dispersión con `hue`, diagrama de caja agrupado, `pd.crosstab` (Semana 8) |
| Gráfico narrativo | Facetado (`col=`/`row=`), orden deliberado, paleta apta para daltónicos, anotación (Semana 9) |
| Conclusión | Hallazgo + confianza (tamaño de muestra) + explicación alternativa, por pregunta |

Trata esta tabla como el esquema de tu informe antes de escribir una sola celda — la misma disciplina de "formular la estructura antes de sumergirse" que la Semana 6 introdujo para preguntas individuales, ahora aplicada a todo el entregable.

### Un ejemplo resuelto inicial

Aquí hay un mini-ejemplo completo del patrón que debería seguir cada una de tus preguntas — perfilar → visualizar → interpretar con precaución apropiada:

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

df = pd.read_csv("students-performance.csv")

# Question: does completing test preparation associate with a higher average score
# across all three subjects?
df["average_score"] = df[["math_score", "reading_score", "writing_score"]].mean(axis=1)

summary = df.groupby("test_preparation_course")["average_score"].agg(["mean", "count"])
print(summary)

sns.boxplot(data=df, x="test_preparation_course", y="average_score")
plt.title("Average score by test preparation status")
plt.show()
```

> **Hallazgo:** Los estudiantes que completaron la preparación del examen tuvieron una calificación promedio más alta que los que no, basándose en una muestra de tamaño razonable en ambos grupos (ver `count`).
> **Advertencia:** Esto es una asociación, no una prueba de que la preparación del examen *causó* la diferencia — los estudiantes suficientemente motivados como para completar una preparación opcional del examen podrían diferir de los que no lo hicieron en otros aspectos (p. ej. hábitos generales de estudio, apoyo familiar) que afectan las calificaciones de forma independiente.

`.mean(axis=1)` calcula una media por fila a través de las tres columnas de calificación (`axis=1` significa "a través de las columnas, para cada fila" — a diferencia del `axis=0` por defecto, "a lo largo de cada columna"), produciendo un `average_score` combinado por estudiante.

### Un segundo ejemplo resuelto: un gráfico narrativo multivariado

Combinando el trabajo de correlación de la Semana 8 con el facetado de la Semana 9 en una sola figura lista para el informe:

```python
sns.relplot(
    data=df, x="reading_score", y="writing_score",
    col="test_preparation_course", hue="lunch", palette="colorblind",
)
plt.show()
```

> **Hallazgo:** La fuerte relación positiva entre las calificaciones de lectura y escritura se mantiene en ambos paneles de preparación del examen, sugiriendo que no es específica de ninguno de los dos grupos — probablemente reflejando un factor subyacente compartido (habilidad verbal/alfabetización general) en lugar de que la calificación de una materia influya directamente en la otra.
> **Advertencia:** Facetar por dos variables categóricas (`col` y `hue`) a la vez empieza a forzar cuánto puede asimilar un lector de una sola figura — vale la pena una frase reconociendo eso, y considerar si esto sería más claro dividido en dos figuras más simples para un informe real.

### Cerrando: lo que este dataset no puede decirte

Antes de finalizar tu informe, anota explícitamente qué conclusiones este dataset *no* respalda: es una única instantánea (no un estudio a lo largo del tiempo), la población exacta y la metodología de recolección no se especifican en la versión del dataset usada aquí, y —como se enfatizó a lo largo de las Semanas 8-9— ninguna de estas asociaciones establece causalidad. Un informe de EDA riguroso es honesto sobre estos límites, no solo sobre lo que encontró.

## ⚠️ Errores comunes

- **Saltarse el paso de perfilado porque el dataset "se ve limpio".** Siempre ejecuta primero los pasos de perfilado de la Semana 6, incluso en un dataset que parece ordenado — confirmar que no falta nada ni está mal codificado es parte del entregable, no una formalidad opcional.
- **Escribir conclusiones antes de comprobar los tamaños de muestra.** Una diferencia que se ve dramática en un subgrupo pequeño (p. ej. una categoría de `race_ethnicity` con pocos estudiantes) merece una advertencia sobre el tamaño de muestra, la misma disciplina de la Semana 6.
- **Tratar "correlación no es causalidad" como una nota al pie en lugar de algo central.** Cada hallazgo en el entregable requerido necesita su propia advertencia honesta, no un único descargo genérico al final que lo cubra todo.
- **Quedarse sin tiempo para el pulido antes de terminar el contenido requerido.** Las 5 piezas del entregable (perfil, 3 preguntas, análisis de correlación, gráfico narrativo, conclusiones) importan más que hacer perfecto un solo gráfico — consigue primero un borrador completo, y luego mejóralo.

## 🧩 Retos

<Challenge id="dataanalysis-hard-w10-c1" answer={<>Siguiendo el patrón del ejemplo resuelto: agrupa por <code>parental_level_of_education</code>, calcula la media y el conteo de <code>average_score</code> por grupo, luego visualiza con un gráfico de barras ordenado o un diagrama de caja agrupado (técnicas de la Semana 9), y escribe un par hallazgo + advertencia como el ejemplo resuelto.</>}>

Responde esta pregunta para tu informe: ¿se asocia `parental_level_of_education` con `average_score`? Sigue el patrón completo — tabla resumen, gráfico, hallazgo y advertencia.

</Challenge>

<Challenge id="dataanalysis-hard-w10-c2" answer={<>Usa <code>sns.relplot</code> o <code>sns.boxplot</code> con tanto <code>col="gender"</code> (o <code>hue="gender"</code>) como agrupando por <code>test_preparation_course</code>, siguiendo el patrón de facetado de la Semana 9, para ver si el efecto de la preparación del examen sobre las calificaciones se ve similar para ambos géneros o difiere.</>}>

Extiende la pregunta de preparación del examen del ejemplo resuelto para comprobar si el efecto se ve igual entre `gender` — ¿parece la preparación del examen asociarse con una mayor ganancia de calificación para un género que para el otro?

</Challenge>

<Challenge id="dataanalysis-hard-w10-c3" answer={<>Construye la matriz de correlación de 3 columnas y el mapa de calor exactamente como en la Semana 8, y luego escribe una interpretación corta señalando qué par se correlaciona más fuertemente y ofreciendo una explicación plausible de causa compartida (p. ej. preparación académica general) en lugar de afirmar que una calificación causa la otra.</>}>

Produce el mapa de calor de correlación requerido para las tres columnas de calificación, y escribe una frase interpretando la correlación por pares más fuerte, siendo explícito sobre qué implica y qué no.

</Challenge>

<Challenge id="dataanalysis-hard-w10-c4" answer={<>Una respuesta razonable señala al menos una limitación real, p. ej.: el dataset no registra cuándo/dónde se recolectó, así que los resultados podrían no generalizarse a otras escuelas, regiones o años; las "calificaciones de examen" como resultado capturan solo una medida estrecha del éxito educativo; y los tamaños de grupo para algunas categorías pueden ser lo bastante pequeños como para que los promedios lleven una incertidumbre real.</>}>

Escribe un párrafo para la conclusión de tu informe, listando al menos una limitación específica de este dataset que debería hacer que un lector sea cauteloso al generalizar tus hallazgos más allá de él.

</Challenge>

<Challenge id="dataanalysis-hard-w10-c5" answer={<>Usa la comprobación de sesgo media-vs-mediana y el conteo de valores atípicos por IQR de la Semana 6 sobre average_score, y luego un histograma de la Semana 7 para confirmar visualmente -- combinando una comprobación numérica "antes de graficar" con el gráfico que la verifica, exactamente el flujo de trabajo sobre el que se construyó la Semana 7.</>}>

Completa la sección requerida de "perfil del dataset" para tu informe: usa la comprobación de sesgo media-vs-mediana y el conteo de valores atípicos por IQR de la Semana 6 sobre la columna `average_score`, y confirma lo que encuentres con un histograma de la Semana 7.

</Challenge>

<Challenge id="dataanalysis-hard-w10-c6" answer={<>Ensambla una sola sección de markdown/texto combinando: un resumen de una frase del perfil, las 3+ preguntas con hallazgos y advertencias, el hallazgo principal del mapa de calor de correlación, y el párrafo de limitaciones de cierre -- esencialmente copiando las piezas requeridas del informe en una narrativa continua que un lector de primera vez pueda seguir de principio a fin.</>}>

Ensambla todo lo de los retos de esta semana en una sola narrativa escrita continua (no solo una lista de celdas de código separadas) que un lector pueda seguir de principio a fin sin necesitar ver tu código.

</Challenge>

## 🤔 Preguntas socráticas

- A lo largo de todo tu informe, ¿en qué hallazgo te sientes más seguro, y en cuál te sientes menos seguro? ¿Qué específicamente (tamaño de muestra, tamaño del efecto, plausibilidad de una variable de confusión) impulsa esa diferencia de confianza?
- Si tuvieras que elegir solo *un* gráfico de todo tu informe para mostrarle a alguien con 10 segundos de atención, ¿cuál sería, y por qué? ¿Qué te dice esa elección sobre cuál hallazgo es realmente el más importante?
- Ahora has completado un ciclo completo de EDA —pregunta, evidencia, interpretación honesta— sobre un dataset con forma real. ¿En qué material de qué semana específica (de la 6 a la 9) te apoyaste más personalmente al hacerlo? ¿Coincide eso con lo que esperabas al empezar?
- La advertencia del segundo ejemplo resuelto admite que facetar por dos variables a la vez podría ya ser "demasiado" para una figura. Mirando hacia atrás en tu propio informe, ¿hay algún gráfico que hiciste que ahora considerarías simplificar, habiendo pasado por todo este proceso?
- Ahora que has construido un informe de EDA completo desde cero, ¿cómo explicarías la *diferencia* entre "análisis exploratorio de datos" y "solo hacer algunos gráficos" a alguien que no ha tomado este curso — con tus propias palabras, no las de la lección?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="data-analysis-hard-week-10"
  questions={[
    {
      id: 'q1',
      prompt: 'df[["math_score","reading_score","writing_score"]].mean(axis=1) calcula:',
      options: [
        'La media de cada columna por separado',
        'Una media por fila a través de las tres columnas, un valor por estudiante',
        'La media general de todo el DataFrame',
        'Una matriz de correlación',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: "La conclusión de un informe de EDA riguroso debería:",
      options: [
        'Presentar los hallazgos como hechos probados sin advertencias',
        'Incluir hallazgos, nivel de confianza y explicaciones alternativas plausibles',
        'Incluir solo gráficos, sin interpretación escrita',
        'Evitar mencionar los tamaños de muestra',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: '¿Cuál de estos NO es algo que este dataset pueda respaldar, según la lección?',
      options: [
        'Asociaciones entre la preparación del examen y las calificaciones',
        'Una descripción de las distribuciones de calificación',
        'Una afirmación causal de que la preparación del examen causa directamente calificaciones más altas',
        'Una comparación de calificaciones promedio entre categorías',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q4',
      prompt: 'El entregable requerido esta semana debe incluir como mínimo:',
      options: [
        'Solo un mapa de calor de correlación',
        'Perfil del dataset, preguntas formuladas, análisis de correlación, un gráfico narrativo y conclusiones escritas',
        'Un modelo de aprendizaje automático entrenado con los datos',
        'Solo la salida cruda de pandas sin interpretación',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'Según la lección, ¿cuándo deberías comprobar el tamaño de muestra (count) por grupo?',
      options: [
        'Solo para el gráfico final',
        'Nunca — la media sola siempre es suficiente',
        'Cada vez que compares medias de grupo, ya que los grupos pequeños merecen menos confianza',
        'Solo si el dataset tiene valores faltantes',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-10" />

---

**🎉 Completaste el track Difícil de Pandas y Análisis de Datos — y todo el curso, si tomaste Difícil/Difícil o cualquier combinación entre ambas secciones.** Ve a [Mi Progreso](/progress) para ver tus insignias, y descubre los [proyectos del mundo real](/docs/projects): instala Python de verdad y construye algo que el playground nunca pudo ejecutar.
