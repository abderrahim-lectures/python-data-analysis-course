---

title: "Análisis Univariado Categórico"
description: "Analiza distribuciones de frecuencia, proporciones y patrones en variables categóricas con gráficos de conteo y gráficos de barras."
module: "univariate-analysis"
order: 4
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Calcular tablas de frecuencia, proporciones y frecuencias acumuladas para variables categóricas"
  - "Crear gráficos de conteo, gráficos de barras y gráficos de barras horizontales con matplotlib y seaborn"
  - "Distinguir entre variables categóricas nominales, ordinales y binarias"
  - "Manejar variables categóricas de alta cardinalidad con agrupación y filtrado top-N"
prerequisites: ["03-univariate-numerical"]
tags: ["univariate", "categorical", "count-plots", "bar-charts", "frequency"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Una columna categórica tiene 50 valores únicos. ¿Qué deberías hacer antes de graficar?"
    options:
      - text: "Graficar las 50 categorías en un gráfico de barras"
      - text: "Agrupar las categorías poco frecuentes en Otro y mostrar las top N"
        correct: true
      - text: "Convertir la columna en numérica"
      - text: "Eliminar la columna por completo"
  - question: "¿Por qué deberías ordenar explícitamente las categorías ordinales en lugar de dejar que pandas las ordene alfabéticamente?"
    options:
      - text: "El orden alfabético siempre es incorrecto"
      - text: "Preserva el orden de rango lógico que revela patrones significativos"
        correct: true
      - text: "Hace que los colores del gráfico se vean mejor"
      - text: "Evita los valores faltantes"
  - question: "¿Cuál es la diferencia entre datos categóricos nominales y ordinales?"
    options:
      - text: "Lo nominal tiene números, lo ordinal tiene texto"
      - text: "Lo ordinal tiene un orden de rango natural, lo nominal no"
        correct: true
      - text: "Lo nominal siempre es binario"
      - text: "Lo ordinal solo puede tener 3 categorías"
---
Las variables categóricas describen grupos, categorías o etiquetas — género, etnia, tipo de almuerzo, nivel educativo. A diferencia de los datos numéricos, no puedes calcular medias ni desviaciones estándar. En su lugar, analizas frecuencias, proporciones y moda. Esta lección cubre las herramientas y técnicas para entender los datos categóricos.

## Conceptos clave

### Tablas de frecuencia

La base del análisis categórico es la tabla de frecuencia:

```python
import pandas as pd

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Absolute frequencies
print("Gender counts:")
print(df["gender"].value_counts())

# Relative frequencies (proportions)
print("\nGender proportions:")
print(df["gender"].value_counts(normalize=True).round(3))

# Parental education — ordinal, so sort logically
edu_order = [
    "some high school",
    "high school",
    "some college",
    "associate's degree",
    "master's degree",
    "bachelor's degree",
]
print("\nParental education:")
print(df["parental level of education"].value_counts().reindex(edu_order))
```

### Nominal vs ordinal vs binario

Entender el tipo de variable categórica determina cómo la analizas y visualizas:

| Tipo | Descripción | Ejemplo | Análisis |
|------|-------------|---------|----------|
| **Binaria** | Dos categorías | gender | Proporción, razón de probabilidades |
| **Nominal** | Sin orden natural | race/ethnicity | Frecuencia, moda |
| **Ordinal** | Existe un orden natural | education level | Categoría mediana, correlación de rangos |

Las variables ordinales necesitan un ordenamiento explícito — no dejes que pandas las ordene alfabéticamente:

```python
import seaborn as sns
import matplotlib.pyplot as plt

# Without ordering — misleading
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

sns.countplot(data=df, x="parental level of education", ax=axes[0])
axes[0].set_title("Without explicit order")
axes[0].tick_params(axis="x", rotation=45)

# With ordering — correct
sns.countplot(
    data=df,
    x="parental level of education",
    order=edu_order,
    ax=axes[1],
    palette="viridis"
)
axes[1].set_title("With explicit order")
axes[1].tick_params(axis="x", rotation=45)

plt.tight_layout()
plt.show()
```

### Gráficos de conteo con seaborn

Los gráficos de conteo son el equivalente categórico de los histogramas — muestran frecuencias:

```python
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Binary variable
sns.countplot(data=df, x="gender", ax=axes[0, 0], palette="Set2")
axes[0, 0].set_title("Gender Distribution")

# Nominal variable
sns.countplot(data=df, x="race/ethnicity", ax=axes[0, 1], palette="Set3")
axes[0, 1].set_title("Ethnicity Distribution")

# Ordinal variable
sns.countplot(
    data=df,
    x="parental level of education",
    order=edu_order,
    ax=axes[1, 0],
    palette="viridis"
)
axes[1, 0].set_title("Parental Education Level")
axes[1, 0].tick_params(axis="x", rotation=45)

# Binary with hue
sns.countplot(data=df, x="test preparation course", hue="gender", ax=axes[1, 1], palette="Set1")
axes[1, 1].set_title("Test Prep by Gender")

plt.tight_layout()
plt.show()
```

### Gráficos de barras horizontales

Cuando las etiquetas de las categorías son largas, las barras horizontales mejoran la legibilidad:

```python
# Ethnicity with horizontal bars
ethnicity_counts = df["race/ethnicity"].value_counts()

fig, ax = plt.subplots(figsize=(8, 5))
ethnicity_counts.plot(kind="barh", ax=ax, color="steelblue", edgecolor="black")
ax.set_title("Ethnicity Distribution")
ax.set_xlabel("Count")
ax.set_ylabel("Ethnicity Group")
plt.show()
```

### Gráficos de proporciones

Cuando los tamaños de muestra difieren, las proporciones aportan más información que los conteos:

```python
# Proportion by gender
gender_prop = df["gender"].value_counts(normalize=True)

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Bar chart of proportions
gender_prop.plot(kind="bar", ax=axes[0], color=["#4ECDC4", "#FF6B6B"], edgecolor="black")
axes[0].set_title("Gender Proportions")
axes[0].set_ylabel("Proportion")
axes[0].set_ylim(0, 1)

# Pie chart (use sparingly — bar charts are almost always better)
axes[1].pie(gender_prop, labels=gender_prop.index, autopct="%1.1f%%", colors=["#4ECDC4", "#FF6B6B"])
axes[1].set_title("Gender Split")

plt.tight_layout()
plt.show()
```

### Cómo manejar variables categóricas de alta cardinalidad

Cuando una columna categórica tiene muchos valores únicos, agrupa las categorías poco frecuentes en una categoría "Otro":

```python
def top_n_with_other(series, n=5):
    """Keep top n categories, merge the rest into 'Other'."""
    top = series.value_counts().head(n).index
    return series.where(series.isin(top), other="Other")

# Example with education level
df["education_grouped"] = top_n_with_other(df["parental level of education"], n=4)

print(df["education_grouped"].value_counts())

fig, ax = plt.subplots(figsize=(8, 5))
sns.countplot(data=df, x="education_grouped", palette="pastel", ax=ax)
ax.set_title("Parental Education (Top 4 + Other)")
plt.show()
```

### Anotar los conteos en las barras

Añadir los conteos a las barras hace que los gráficos se expliquen solos:

```python
fig, ax = plt.subplots(figsize=(8, 5))
counts = df["race/ethnicity"].value_counts()
bars = ax.bar(counts.index, counts.values, color=sns.color_palette("Set3", len(counts)), edgecolor="black")

for bar in bars:
    height = bar.get_height()
    ax.text(
        bar.get_x() + bar.get_width() / 2.,
        height + 0.5,
        f"{int(height)}",
        ha="center",
        va="bottom",
        fontweight="bold"
    )

ax.set_title("Ethnicity Distribution with Counts")
ax.set_ylabel("Count")
plt.show()
```

## Inténtalo

Analiza las variables categóricas del conjunto de datos Students Performance.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

cat_cols = ["gender", "race/ethnicity", "parental level of education",
            "lunch", "test preparation course"]

# Frequency tables
for col in cat_cols:
    print(f"\n{col}:")
    print(df[col].value_counts())

# Visualize all categorical variables
fig, axes = plt.subplots(2, 3, figsize=(15, 10))
axes = axes.flatten()

for i, col in enumerate(cat_cols):
    sns.countplot(data=df, x=col, ax=axes[i], palette="Set2")
    axes[i].set_title(col.title())
    axes[i].tick_params(axis="x", rotation=45)

# Hide unused subplot
axes[5].set_visible(False)

plt.tight_layout()
plt.show()
```

## Conclusiones clave

- Las tablas de frecuencia son la base del análisis categórico — calcúlalas siempre primero
- Distingue las variables nominales, ordinales y binarias; las variables ordinales necesitan un ordenamiento explícito
- Los gráficos de barras horizontales son mejores que los verticales cuando las etiquetas de las categorías son largas
- Usa proporciones en lugar de conteos al comparar grupos de diferentes tamaños
- Agrupa las categorías poco frecuentes en "Otro" cuando la cardinalidad es alta
- Anota los conteos en las barras para que los gráficos se expliquen solos

## Desafío de práctica

Crea una figura que muestre la distribución de los tipos de `lunch`, con barras coloreadas por la finalización de `test preparation course`. Añade anotaciones de conteo a cada segmento de barra. Luego calcula la proporción de estudiantes que completaron la preparación para el examen para cada tipo de almuerzo.

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, ax = plt.subplots(figsize=(8, 6))
sns.countplot(data=df, x="lunch", hue="test preparation course", ax=ax, palette="Set1")
ax.set_title("Lunch Type by Test Preparation Completion")
ax.set_xlabel("Lunch Type")
ax.set_ylabel("Count")
ax.legend(title="Test Prep")

# Add count annotations
for container in ax.containers:
    ax.bar_label(container, fontweight="bold")

plt.tight_layout()
plt.show()

# Proportions
print("\nTest prep completion by lunch type:")
print(df.groupby("lunch")["test preparation course"].value_counts(normalize=True).round(3))
```

</div>
</details>
