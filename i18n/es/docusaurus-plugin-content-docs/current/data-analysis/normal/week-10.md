---
title: "Semana 10: EDA Guiado — el Dataset del Titanic"
sidebar_position: 5
section: data-analysis
track: normal
week: 10
description: "Reproduce de principio a fin un cuaderno clásico de análisis exploratorio del Titanic con pandas."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 10: EDA Guiado — el Dataset del Titanic

<span className="gamified-flourish">🚢 Cada herramienta de las Semanas 6 a 9 se junta esta semana en uno de los datasets para principiantes más famosos de la ciencia de datos.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Cargar y limpiar un dataset con forma real ([`titanic.csv`](pathname:///datasets/titanic.csv)) de principio a fin.
- Responder preguntas analíticas concretas usando selección, filtrado y `.groupby()` juntos.
- Agrupar en categorías (bucketing) una columna continua en rangos con `pd.cut` para análisis agrupado.
- Reproducir la estructura de un notebook de EDA clásico al estilo Kaggle, una celda a la vez, y resumir hallazgos en español llano.

## Lección

Esta semana es deliberadamente menos "concepto nuevo, sintaxis nueva" y más "aplica todo, en secuencia, sobre un dataset". El dataset del Titanic ([créditos aquí](/credits)) se ha convertido en un punto de referencia estándar para principiantes exactamente por esta razón: es pequeño, tiene una columna de resultado clara (`Survived`), y tiene suficiente textura desordenada del mundo real (edades faltantes, tipos mixtos) para necesitar cada herramienta de esta sección.

### Paso 1: Cargar e inspeccionar

```python
import pandas as pd

df = pd.read_csv("titanic.csv")
df.shape
df.head()
df.info()
df.describe()
```

Antes de analizar cualquier cosa, siempre pregunta: ¿cuántas filas, qué columnas, qué dtypes, qué falta? Este es el material de la Semana 6 y la Semana 8, aplicado como el primerísimo paso de cualquier análisis real — no una formalidad, sino la base de la que depende todo lo que viene después.

### Paso 2: Manejar los datos faltantes

```python
df.isna().sum()
```

`Age` típicamente tiene valores faltantes en este dataset. En lugar de eliminar esas filas directamente (perdiendo otra información sobre esos pasajeros), una elección común es rellenar con la edad mediana — la mediana, no la media, porque las distribuciones de edad a menudo están sesgadas por unos pocos pasajeros muy jóvenes o muy mayores:

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
```

### Paso 3: Hacer preguntas, responder con filtrado + groupby

**Pregunta: ¿difirió la tasa de supervivencia según la clase del pasajero?**

```python
df.groupby("Pclass")["Survived"].mean()
```

La media de una columna 0/1 de cada grupo es exactamente la *tasa* de supervivencia de ese grupo — el mismo truco de "media de una columna tipo booleana = proporción" que usarás constantemente en análisis de datos.

**Pregunta: ¿difirió la tasa de supervivencia según el sexo?**

```python
df.groupby("Sex")["Survived"].mean()
```

**Pregunta: entre los pasajeros que pagaron el 25% superior de las tarifas, ¿cuál fue la tasa de supervivencia?**

```python
fare_threshold = df["Fare"].quantile(0.75)
top_fare_passengers = df[df["Fare"] >= fare_threshold]
top_fare_passengers["Survived"].mean()
```

Esto combina un filtro (Semana 7) con un agregado (`.mean()`, Semana 6) — el mismo patrón de dos pasos que casi cualquier pregunta que le harás a un dataset real: reducir a las filas que te interesan, y luego resumirlas.

### Paso 4: Combinar dimensiones de agrupación

`.groupby()` acepta una *lista* de columnas, particionando por cada combinación de sus valores a la vez:

```python
df.groupby(["Pclass", "Sex"])["Survived"].mean()
```

Esto responde una pregunta más específica que cualquiera de las agrupaciones por separado: ¿el efecto de la clase sobre la supervivencia se mantiene *dentro* de cada sexo, o desaparece una vez que controlas por sexo?

### Paso 5: Agrupar en categorías una columna continua con `pd.cut`

`Age` es continua, pero "tasa de supervivencia por edad exacta" es demasiado granular para leerse fácilmente — agrupar por *rangos* de edad (una discretización, la misma idea que los bins de un histograma) suele ser más útil. `pd.cut` hace exactamente esto:

```python
df["age_group"] = pd.cut(df["Age"], bins=[0, 12, 18, 35, 60, 100],
                          labels=["Child", "Teen", "Adult", "Middle-aged", "Senior"])
df.groupby("age_group")["Survived"].mean()
```

`bins` da los límites de cada rango; `labels` los nombra. Ahora `age_group` es simplemente otra columna categórica, usable con `.groupby()` exactamente igual que `Pclass` o `Sex`.

### Paso 6: Resumir hallazgos en español llano

Un EDA real no está terminado hasta que sus números se convierten en una frase que alguien más pueda leer sin volver a ejecutar tu código — la misma disciplina que el marco de EDA del track Difícil trata como central:

```python
class_survival = df.groupby("Pclass")["Survived"].mean()
sex_survival = df.groupby("Sex")["Survived"].mean()

print(f"Overall survival rate: {df['Survived'].mean():.1%}")
print(f"1st class survival rate: {class_survival[1]:.1%}, "
      f"3rd class survival rate: {class_survival[3]:.1%}")
print(f"Female survival rate: {sex_survival['female']:.1%}, "
      f"male survival rate: {sex_survival['male']:.1%}")
```

`{value:.1%}` es una especificación de formato de f-string — la Semana 1 de Python 101 introdujo `:.2f`; `.1%` significa de forma similar "como porcentaje, con un decimal", convirtiendo `0.629` en `"62.9%"` automáticamente.

## ⚠️ Errores comunes

- **Responder una pregunta con el corte incorrecto de datos.** Siempre verifica dos veces que la condición booleana de un filtro realmente diga lo que querías decir — `df["Age"] < 18` y `df["Age"] <= 18` dan respuestas distintas (aunque similares), y la diferencia importa en los casos límite.
- **Olvidar que los bins de `pd.cut` son semiabiertos en una dirección específica.** Por defecto, los bins de `pd.cut` son `(izquierda, derecha]` — el límite izquierdo excluido, el derecho incluido — vale la pena comprobarlo si un valor pudiera plausiblemente caer exactamente en un límite.
- **Reportar la media de un grupo sin también reportar su tamaño.** Una tasa de supervivencia que se ve dramática para un grupo de 3 pasajeros merece mucha menos confianza que la misma tasa para un grupo de 300 — siempre mira `.count()` junto con `.mean()` al comparar grupos, la misma precaución que enfatiza la Semana 6 del track Difícil.

## 🧩 Retos

<Challenge id="dataanalysis-normal-w10-c1" answer={<><code>df.groupby("Embarked")["Survived"].mean()</code> — el mismo patrón de una línea que clase/sexo, solo que agrupado por la columna del puerto de embarque en su lugar.</>}>

Calcula la tasa de supervivencia por puerto de `Embarked`. ¿Qué puerto tuvo la tasa de supervivencia más alta en este dataset?

</Challenge>

<Challenge id="dataanalysis-normal-w10-c2" answer={<><code>df[df["Age"] &lt; 18]["Survived"].mean()</code> comparado con <code>df[df["Age"] &gt;= 18]["Survived"].mean()</code> — dos subconjuntos filtrados, cada uno resumido con el mismo agregado.</>}>

Compara la tasa de supervivencia de los pasajeros menores de 18 años con la de los pasajeros de 18 años o más.

</Challenge>

<Challenge id="dataanalysis-normal-w10-c3" answer={<><code>df.groupby(["Pclass", "Sex"])["Survived"].mean()</code>, y luego lee las dos entradas donde Sex es "female" a través de los tres valores de Pclass.</>}>

Usando el groupby combinado `["Pclass", "Sex"]`, ¿sigue importando la clase del pasajero para la supervivencia *dentro* de las pasajeras femeninas específicamente? Lee las filas relevantes del resultado.

</Challenge>

<Challenge id="dataanalysis-normal-w10-c4" answer={<>Agrega una nueva columna: <code>df["family_size"] = df["SibSp"] + df["Parch"] + 1</code> (el +1 cuenta al propio pasajero), y luego agrupa por ella: <code>df.groupby("family_size")["Survived"].mean()</code>.</>}>

Crea una nueva columna `family_size` como `SibSp + Parch + 1` (hermanos/cónyuges + padres/hijos + el propio pasajero), y luego calcula la tasa de supervivencia agrupada por `family_size`.

</Challenge>

<Challenge id="dataanalysis-normal-w10-c5" answer={<>Usa la columna age_group del Paso 5 y lee su tasa de supervivencia; compárala con el filtro Age &lt; 18 crudo del Reto 2 -- deberían ser ampliamente consistentes, aunque el límite exacto (12 frente a 18) difiere, así que los números no coincidirán exactamente.</>}>

Usando la columna `age_group` del Paso 5, ¿cuál es la tasa de supervivencia para el grupo `"Child"`? ¿Cómo se compara con tu respuesta del Reto 2 para pasajeros menores de 18?

</Challenge>

<Challenge id="dataanalysis-normal-w10-c6" answer={<>Agrupa por Pclass y usa .agg(["mean", "count"]) sobre Survived, de modo que tanto la tasa de supervivencia como el tamaño del grupo sean visibles juntos -- así la tasa de un grupo pequeño puede juzgarse con la cautela apropiada.</>}>

Rehaz el groupby de tasa de supervivencia por Pclass, pero esta vez incluye tanto la media *como* el conteo de pasajeros en cada clase, en una sola llamada a `.agg(...)` — para que puedas juzgar cuánto confiar en el número de cada clase.

</Challenge>

## 🤔 Preguntas socráticas

- El resultado combinado de `.groupby(["Pclass", "Sex"])` generalmente muestra una brecha *mucho* mayor por sexo que por clase sola. ¿Qué sugiere eso sobre qué variable estaba haciendo más "trabajo" en los resultados de groupby de una sola variable de antes?
- Rellenar los valores faltantes de `Age` con la mediana asume que las edades faltantes no son sistemáticamente distintas de las conocidas. ¿Se te ocurre una razón por la que esa suposición podría estar equivocada para este dataset específico (es decir, una razón por la que ciertos *tipos* de pasajeros podrían tener más probabilidad de tener una edad faltante)?
- Acabas de responder varias preguntas analíticas reales usando solo herramientas de las Semanas 6 a 9. ¿Qué único método (`.groupby()`, enmascaramiento booleano, `.fillna()`, `.merge()`) terminaste usando más? ¿Coincide eso con tu expectativa de qué habilidad de pandas importa más en la práctica?
- Los límites de bins de `pd.cut` (`[0, 12, 18, 35, 60, 100]`) se eligieron de forma algo arbitraria en esta lección. ¿Cuánto crees que podría cambiar la tasa de supervivencia de "Child" si movieras el límite niño/adolescente de 12 a, digamos, 15? ¿Qué sugiere eso sobre ser transparente respecto a tus elecciones de agrupación en un informe real?
- El resumen en español llano del Paso 6 solo reporta dos variables (clase, sexo) aunque exploraste varias más en los retos. Si estuvieras escribiendo esto para alguien que nunca vio los números crudos, ¿qué *único* hallazgo adicional de los retos considerarías más digno de incluir, y por qué ese?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="data-analysis-normal-week-10"
  questions={[
    {
      id: 'q1',
      prompt: 'Para una columna 0/1 (sobrevivió/no sobrevivió), ¿qué representa .mean() dentro de un grupo?',
      options: [
        'El número total de sobrevivientes',
        'La tasa de supervivencia (proporción) dentro de ese grupo',
        'El valor más común',
        'Nada significativo — mean solo funciona con datos continuos',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: '¿Por qué rellenar Age faltante con la mediana en lugar de la media en esta lección?',
      options: [
        'La media no se puede calcular en una columna con valores faltantes',
        'La mediana es menos sensible a una distribución sesgada con valores atípicos',
        'Siempre dan resultados idénticos',
        'pandas no soporta .mean() con NaN presente',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'df.groupby(["Pclass", "Sex"]) agrupa las filas por:',
      options: [
        'Solo Pclass, ignorando Sex',
        'Cada combinación única de Pclass y Sex',
        'Solo Sex, ignorando Pclass',
        'Ninguno de los dos — esto lanza un error',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'El patrón general de EDA que se usó repetidamente esta semana fue:',
      options: [
        'Fusionar, luego ordenar',
        'Filtrar/agrupar, luego agregar',
        'Eliminar todos los datos faltantes, luego graficar',
        'Convertir cada columna a string',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: '¿Qué hace pd.cut?',
      options: [
        'Elimina filas con valores faltantes',
        'Divide una columna continua en rangos etiquetados (bins)',
        'Fusiona dos DataFrames',
        'Ordena una columna de forma ascendente',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-10" />

---

**🎉 Completaste el track Normal de Pandas y Análisis de Datos — y todo el curso, si tomaste Normal en ambas secciones.** Ve a [Mi Progreso](/progress) para ver tus insignias y, si terminaste cada semana, desbloquea el [Bono Capstone](/docs/bonus/capstone-ai-agent): instalar Python de verdad y construir tu primer agente de IA.
