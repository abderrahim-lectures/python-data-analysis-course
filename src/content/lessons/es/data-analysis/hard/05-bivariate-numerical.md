---

title: "Análisis Bivariado Numérico"
description: "Explora las relaciones entre dos variables numéricas con gráficos de dispersión, líneas de regresión y comparaciones agrupadas."
module: "bivariate-analysis"
order: 5
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Crear gráficos de dispersión, regplot y jointplot para visualizar relaciones numérico-numéricas"
  - "Interpretar líneas de regresión, valores R-cuadrado y patrones de residuos"
  - "Construir diagramas de caja y de violín agrupados para comparaciones numérico-categóricas"
  - "Identificar relaciones no lineales, heterocedasticidad y puntos influyentes a partir de los gráficos"
prerequisites: ["04-univariate-categorical"]
tags: ["bivariate", "scatter-plots", "regression", "joint-plots", "seaborn"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "¿Qué revela un gráfico de dispersión sobre dos variables numéricas?"
    options:
      - text: "Sus distribuciones individuales"
      - text: "Su relación y patrón de correlación"
        correct: true
      - text: "Solo la media de cada variable"
      - text: "El número de valores faltantes"
  - question: "¿Qué indica un coeficiente de correlación de -0.8?"
    options:
      - text: "Una relación positiva fuerte"
      - text: "Una relación negativa fuerte"
        correct: true
      - text: "No hay relación"
      - text: "Una relación positiva débil"
  - question: "¿Cuándo deberías usar un mapa de calor en lugar de gráficos de dispersión individuales?"
    options:
      - text: "Cuando solo tienes 2 variables"
      - text: "Cuando quieres ver las correlaciones de muchas variables a la vez"
        correct: true
      - text: "Cuando solo tienes datos categóricos"
      - text: "Cuando tienes valores faltantes"
---
Al examinar cómo se relacionan dos variables numéricas entre sí, entras en el dominio del análisis bivariado. Esta lección cubre los gráficos de dispersión (el caballo de batalla del análisis bivariado), las líneas de regresión que cuantifican la relación, los jointplots que combinan distribuciones marginales y conjuntas, y los gráficos agrupados que introducen una dimensión categórica.

## Conceptos clave

### Gráficos de dispersión

El gráfico de dispersión es la visualización bivariada más fundamental. Cada punto representa una observación, representada en dos ejes numéricos:

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, ax = plt.subplots(figsize=(8, 6))
ax.scatter(df["math score"], df["reading score"], alpha=0.5, edgecolors="black", linewidth=0.5)
ax.set_title("Math vs Reading Scores")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
plt.show()
```

La transparencia alfa (`alpha=0.5`) es crítica, revela la densidad de puntos donde los puntos se superponen.

### Gráficos de regresión

El `regplot` de seaborn añade una línea de regresión que cuantifica la relación lineal:

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

pairs = [
    ("math score", "reading score"),
    ("math score", "writing score"),
    ("reading score", "writing score"),
]

for i, (x, y) in enumerate(pairs):
    sns.regplot(data=df, x=x, y=y, ax=axes[i], scatter_kws={"alpha": 0.4})
    axes[i].set_title(f"{x.split()[0].title()} vs {y.split()[0].title()}")

plt.tight_layout()
plt.show()
```

Cómo leer un gráfico de regresión:
- **Pendiente**: una pendiente positiva significa correlación positiva; cuanto más pronunciada, más fuerte
- **Intervalo de confianza** (región sombreada): más ancho significa más incertidumbre
- **Residuos**: los puntos lejos de la línea están mal predichos

### Joint plots

Los joint plots combinan el gráfico de dispersión con distribuciones marginales en cada eje:

```python
sns.jointplot(
    data=df,
    x="math score",
    y="reading score",
    kind="scatter",      # or "reg", "kde", "hist"
    height=7,
    alpha=0.4
)
plt.suptitle("Math vs Reading (Joint Plot)", y=1.02)
plt.show()
```

El parámetro `kind` cambia el tipo de joint plot:
- `"scatter"`: dispersión cruda con histogramas marginales
- `"reg"`: dispersión con línea de regresión e histogramas marginales
- `"kde"`: densidad kernel 2D con KDE marginales
- `"hist"`: histograma 2D con histogramas marginales

### Gráficos hexbin para densidad

Cuando los conjuntos de datos son grandes, los gráficos de dispersión se sobrecargan de puntos. Los gráficos hexbin resuelven esto:

```python
fig, ax = plt.subplots(figsize=(8, 6))
hb = ax.hexbin(df["math score"], df["reading score"], gridsize=20, cmap="YlOrRd")
ax.set_title("Math vs Reading (Hexbin Density)")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
plt.colorbar(hb, label="Count")
plt.show()
```

### Comparaciones numérico-categóricas

Cuando una variable es categórica, compara las distribuciones entre grupos:

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Grouped box plots
sns.boxplot(data=df, x="gender", y="math score", ax=axes[0], palette="Set2")
axes[0].set_title("Math Scores by Gender")

# Grouped violin plots
sns.violinplot(data=df, x="lunch", y="reading score", ax=axes[1], palette="Set3")
axes[1].set_title("Reading Scores by Lunch Type")

# Grouped with multiple categories
sns.boxplot(
    data=df,
    x="test preparation course",
    y="writing score",
    hue="gender",
    ax=axes[2],
    palette="Set1"
)
axes[2].set_title("Writing Scores by Test Prep & Gender")

plt.tight_layout()
plt.show()
```

### Gráficos swarm y strip

Para conjuntos de datos más pequeños, muestra los puntos individuales con jitter:

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Strip plot (jittered points)
sns.stripplot(data=df, x="gender", y="math score", ax=axes[0],
              alpha=0.3, jitter=True, palette="Set2")
axes[0].set_title("Math Scores — Strip Plot")

# Swarm plot (non-overlapping points — slower for large datasets)
sns.swarmplot(data=df, x="gender", y="math score", ax=axes[1],
              size=3, palette="Set2")
axes[1].set_title("Math Scores — Swarm Plot")

plt.tight_layout()
plt.show()
```

### Identificar relaciones a partir de los gráficos

| Patrón | Qué significa | Gráfico a usar |
|---------|---------------|-------------|
| Tendencia lineal | Las variables aumentan juntas | Dispersión + regplot |
| Tendencia no lineal | La relación cambia a lo largo del rango | Dispersión con LOWESS |
| Heterocedasticidad | La dispersión cambia a lo largo del rango | Gráfico de residuos |
| Grupos | Existen subgrupos distintos | Dispersión con hue |
| Valores atípicos | Puntos lejos del patrón | Dispersión con anotaciones |

```python
# Highlighting clusters with hue
fig, ax = plt.subplots(figsize=(8, 6))
sns.scatterplot(
    data=df,
    x="math score",
    y="reading score",
    hue="gender",
    style="test preparation course",
    alpha=0.6,
    ax=ax
)
ax.set_title("Math vs Reading: Gender and Test Prep")
plt.show()
```

## Inténtalo

Explora la relación entre los puntajes de matemáticas y lectura, agrupados por género y preparación para el examen.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Scatter with regression
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

sns.regplot(data=df, x="math score", y="reading score", ax=axes[0],
            scatter_kws={"alpha": 0.3}, line_kws={"color": "red"})
axes[0].set_title("Math vs Reading (Regression)")

sns.jointplot(data=df, x="math score", y="reading score",
              kind="kde", height=7)
plt.suptitle("Math vs Reading (Density)", y=1.02)
plt.show()

# Grouped comparison
fig, axes = plt.subplots(1, 2, figsize=(12, 5))
sns.boxplot(data=df, x="gender", y="math score", ax=axes[0], palette="Set2")
axes[0].set_title("Math by Gender")
sns.violinplot(data=df, x="lunch", y="math score", ax=axes[1], palette="Set3")
axes[1].set_title("Math by Lunch Type")
plt.tight_layout()
plt.show()
```

## Conclusiones clave

- Los gráficos de dispersión son la base del análisis bivariado; usa siempre transparencia alfa para los puntos superpuestos
- Las líneas de regresión cuantifican las relaciones lineales; la región sombreada muestra la incertidumbre
- Los joint plots combinan los gráficos de dispersión con distribuciones marginales para una imagen completa
- Los gráficos hexbin resuelven la sobrecarga de puntos en datos grandes mostrando la densidad
- Los diagramas de caja y de violín agrupados comparan distribuciones numéricas entre grupos categóricos
- Usa hue y style para añadir una tercera y cuarta dimensión a los gráficos de dispersión

## Desafío de práctica

Crea una figura con 4 paneles que muestren: (1) un gráfico de dispersión de puntajes de matemáticas vs escritura, (2) una dispersión con línea de regresión, (3) un gráfico de densidad hexbin y (4) una dispersión coloreada por tipo de almuerzo. Añade títulos y etiquetas de ejes adecuados.

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, axes = plt.subplots(2, 2, figsize=(14, 12))
fig.suptitle("Math vs Writing Scores — Four Views", fontsize=14, fontweight="bold")

# Panel 1: Basic scatter
axes[0, 0].scatter(df["math score"], df["writing score"], alpha=0.4, edgecolors="black", linewidth=0.5)
axes[0, 0].set_title("Basic Scatter")
axes[0, 0].set_xlabel("Math Score")
axes[0, 0].set_ylabel("Writing Score")

# Panel 2: Regression
sns.regplot(data=df, x="math score", y="writing score", ax=axes[0, 1],
            scatter_kws={"alpha": 0.3}, line_kws={"color": "red"})
axes[0, 1].set_title("With Regression Line")

# Panel 3: Hexbin
hb = axes[1, 0].hexbin(df["math score"], df["writing score"], gridsize=20, cmap="YlOrRd")
axes[1, 0].set_title("Hexbin Density")
axes[1, 0].set_xlabel("Math Score")
axes[1, 0].set_ylabel("Writing Score")
plt.colorbar(hb, ax=axes[1, 0], label="Count")

# Panel 4: Colored by lunch
sns.scatterplot(data=df, x="math score", y="writing score", hue="lunch",
                alpha=0.5, ax=axes[1, 1], palette="Set1")
axes[1, 1].set_title("Colored by Lunch Type")

plt.tight_layout()
plt.show()
```

</div>
</details>
