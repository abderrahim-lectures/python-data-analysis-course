---

title: "Análisis Univariado Numérico"
description: "Analiza distribuciones, tendencia central, dispersión y forma de variables numéricas usando histogramas, gráficos KDE y diagramas de caja."
module: "univariate-analysis"
order: 3
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Calcular e interpretar media, mediana, moda, desviación estándar, asimetría y curtosis para columnas numéricas"
  - "Crear histogramas, gráficos KDE, diagramas de caja y de violín con matplotlib y seaborn"
  - "Leer las formas de distribución para identificar asimetría, modalidad y valores atípicos"
  - "Elegir el tipo de gráfico adecuado según las características de los datos y los objetivos del análisis"
prerequisites: ["02-dataset-profiling"]
tags: ["univariate", "matplotlib", "seaborn", "distributions", "histograms"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "¿Qué te dice describe() sobre una columna numérica?"
    options:
      - text: "Solo la media"
      - text: "Conteo, media, desviación estándar, mínimo, cuartiles y máximo"
        correct: true
      - text: "Solo la mediana"
      - text: "Solo la desviación estándar"
  - question: "¿Cuándo deberías usar un histograma en lugar de un diagrama de caja?"
    options:
      - text: "Siempre son intercambiables"
      - text: "El histograma muestra la forma de la distribución, el diagrama de caja muestra valores atípicos y cuartiles"
        correct: true
      - text: "El diagrama de caja es mejor para datos categóricos"
      - text: "El histograma es mejor para conjuntos de datos pequeños"
  - question: "¿Qué indica una distribución asimétrica?"
    options:
      - text: "Los datos están distribuidos normalmente"
      - text: "La mayoría de los valores se agrupan en un lado con una cola en el otro"
        correct: true
      - text: "Todos los valores son iguales"
      - text: "No hay valores atípicos"
---
El análisis univariado numérico examina una variable numérica a la vez. El objetivo es entender su distribución: dónde se agrupan los valores, cuán dispersos están, si la distribución es simétrica o asimétrica y si existen valores atípicos. Esta lección cubre los tipos de gráficos y los estadísticos de resumen fundamentales para los datos numéricos.

## Conceptos clave

### Estadísticos de resumen

Antes de graficar, calcula los números que describen la distribución:

```python
import pandas as pd
import numpy as np

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

scores = df["math score"]

# Central tendency
print(f"Mean:   {scores.mean():.2f}")
print(f"Median: {scores.median():.2f}")

# Spread
print(f"Std:    {scores.std():.2f}")
print(f"IQR:    {scores.quantile(0.75) - scores.quantile(0.25):.2f}")
print(f"Range:  {scores.max() - scores.min()}")

# Shape
print(f"Skewness:  {scores.skew():.2f}")
print(f"Kurtosis:  {scores.kurtosis():.2f}")
```

Interpretación:
- **Asimetría > 0**: cola sesgada a la derecha (p. ej., la mayoría de los puntajes bajos, unos pocos muy altos)
- **Asimetría < 0**: cola sesgada a la izquierda (p. ej., la mayoría de los puntajes altos, unos pocos muy bajos)
- **Curtosis > 0**: colas pesadas (más valores atípicos que lo normal)
- **Curtosis < 0**: colas ligeras (menos valores atípicos que lo normal)

### Histogramas

El histograma es la base del análisis univariado numérico. Muestra la distribución de frecuencias:

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Basic histogram
axes[0].hist(scores, bins=20, edgecolor="black", alpha=0.7)
axes[0].set_title("Math Score Distribution (histogram)")
axes[0].set_xlabel("Math Score")
axes[0].set_ylabel("Frequency")

# Histogram with KDE overlay
sns.histplot(scores, kde=True, bins=20, ax=axes[1], color="steelblue")
axes[1].set_title("Math Score Distribution (histogram + KDE)")

plt.tight_layout()
plt.show()
```

Decisiones clave:
- **Número de intervalos (bins)**: demasiado pocos ocultan detalles, demasiados crean ruido. `bins=20` es un valor predeterminado razonable para conjuntos de datos de menos de 10 000 filas. Usa `bins="auto"` para una selección automática.
- **Color del borde**: `edgecolor="black"` hace visibles los límites de los intervalos.

### Gráficos KDE (estimación de densidad por kernel)

Los gráficos KDE suavizan el histograma en una curva continua, lo que facilita comparar distribuciones e identificar la modalidad:

```python
fig, ax = plt.subplots(figsize=(8, 5))

# Single KDE
sns.kdeplot(scores, fill=True, alpha=0.5, ax=ax)
ax.set_title("Math Score KDE")
ax.set_xlabel("Math Score")
plt.show()

# Compare distributions
fig, ax = plt.subplots(figsize=(8, 5))
for subject in ["math score", "reading score", "writing score"]:
    sns.kdeplot(df[subject], fill=True, alpha=0.3, label=subject, ax=ax)
ax.set_title("Score Distributions by Subject")
ax.legend()
plt.show()
```

### Diagramas de caja

Los diagramas de caja muestran el resumen de cinco números (mínimo, Q1, mediana, Q3, máximo) y resaltan los valores atípicos:

```python
fig, ax = plt.subplots(figsize=(8, 5))

sns.boxplot(x=scores, ax=ax, color="lightblue", flierprops=dict(marker="o", markersize=5))
ax.set_title("Math Score Box Plot")
ax.set_xlabel("Math Score")
plt.show()
```

Cómo leer un diagrama de caja:
- **Caja**: rango intercuartílico (IQR), el 50% central de los datos
- **Línea dentro de la caja**: mediana
- **Bigotes**: 1.5 × IQR desde Q1 y Q3
- **Puntos más allá de los bigotes**: valores atípicos (típicamente > 1.5 × IQR)

### Diagramas de violín

Los diagramas de violín combinan el diagrama de caja con el KDE, mostrando tanto los estadísticos de resumen como la forma completa de la distribución:

```python
fig, ax = plt.subplots(figsize=(8, 5))

sns.violinplot(x=scores, ax=ax, inner="quartile", color="lightgreen")
ax.set_title("Math Score Violin Plot")
ax.set_xlabel("Math Score")
plt.show()
```

El parámetro `inner` controla lo que se dibuja dentro del violín:
- `"quartile"`: muestra las líneas de Q1, la mediana y Q3
- `"box"`: muestra un diagrama de caja en miniatura
- `"stick"`: muestra todos los puntos de datos como marcas

### Cómo elegir el gráfico adecuado

| Gráfico | Ideal para | Muestra |
|------|----------|-------|
| Histograma | Distribución de frecuencias, forma | Intervalos y conteos |
| KDE | Distribución suave, comparar grupos | Curva de densidad continua |
| Diagrama de caja | Estadísticos de resumen, valores atípicos | Resumen de cinco números |
| Diagrama de violín | Distribución completa + resumen | KDE + diagrama de caja combinados |

### Comparar distribuciones entre grupos

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5), sharey=True)

for i, subject in enumerate(["math score", "reading score", "writing score"]):
    sns.boxplot(data=df, x="gender", y=subject, ax=axes[i])
    axes[i].set_title(subject.replace(" score", " Scores").title())

plt.tight_layout()
plt.show()
```

## Inténtalo

Analiza la distribución del puntaje de lectura del conjunto de datos Students Performance.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

reading = df["reading score"]

# Summary statistics
print("Summary Statistics:")
print(f"  Mean:   {reading.mean():.2f}")
print(f"  Median: {reading.median():.2f}")
print(f"  Std:    {reading.std():.2f}")
print(f"  Skew:   {reading.skew():.2f}")

# Distribution plots
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

sns.histplot(reading, kde=True, bins=20, ax=axes[0], color="steelblue")
axes[0].set_title("Histogram + KDE")

sns.kdeplot(reading, fill=True, ax=axes[1], color="coral")
axes[1].set_title("KDE Only")

sns.boxplot(x=reading, ax=axes[2], color="lightgreen")
axes[2].set_title("Box Plot")

plt.tight_layout()
plt.show()
```

## Conclusiones clave

- Siempre calcula los estadísticos de resumen antes de graficar, te dicen qué buscar en la visualización
- Los histogramas muestran frecuencias; los gráficos KDE muestran densidad; los diagramas de caja muestran estadísticos de resumen; los diagramas de violín combinan ambos
- La asimetría y la curtosis cuantifican la forma de la distribución en números
- Los diagramas de caja hacen obvios los valores atípicos; los histogramas revelan la modalidad (unimodal vs bimodal)
- Compara distribuciones entre grupos graficándolas lado a lado con ejes compartidos

## Desafío de práctica

Crea una sola figura con cuatro subgráficos que muestren la distribución de `math score` usando: (1) un histograma, (2) un gráfico KDE, (3) un diagrama de caja y (4) un diagrama de violín. Añade una línea vertical en la media en cada gráfico. Establece el título de la figura como "Math Score Distribution Analysis".

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

math = df["math score"]
mean_val = math.mean()

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
fig.suptitle("Math Score Distribution Analysis", fontsize=14, fontweight="bold")

# Histogram
sns.histplot(math, kde=False, bins=20, ax=axes[0, 0], color="steelblue", edgecolor="black")
axes[0, 0].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[0, 0].set_title("Histogram")
axes[0, 0].legend()

# KDE
sns.kdeplot(math, fill=True, ax=axes[0, 1], color="coral")
axes[0, 1].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[0, 1].set_title("KDE Plot")
axes[0, 1].legend()

# Box plot
sns.boxplot(x=math, ax=axes[1, 0], color="lightgreen", flierprops=dict(marker="o", markersize=5))
axes[1, 0].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[1, 0].set_title("Box Plot")
axes[1, 0].legend()

# Violin
sns.violinplot(x=math, ax=axes[1, 1], inner="quartile", color="lightyellow")
axes[1, 1].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[1, 1].set_title("Violin Plot")
axes[1, 1].legend()

plt.tight_layout()
plt.show()
```

</div>
</details>
