---

title: "Análisis de Correlación"
description: "Calcula y visualiza las correlaciones de Pearson y Spearman, detecta la multicolinealidad e interpreta las matrices de correlación."
module: "bivariate-analysis"
order: 6
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Calcular los coeficientes de correlación de Pearson y Spearman e interpretar sus valores"
  - "Construir matrices de correlación y mapas de calor para un panorama general de las relaciones multivariadas"
  - "Distinguir la correlación de la causalidad e identificar los factores de confusión"
  - "Detectar la multicolinealidad y decidir cuándo eliminar o combinar características correlacionadas"
prerequisites: ["05-bivariate-numerical"]
tags: ["correlation", "heatmap", "pearson", "spearman", "multicollinearity"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "¿Cuál es la diferencia entre la correlación de Pearson y la de Spearman?"
    options:
      - text: "Pearson mide relaciones lineales, Spearman mide relaciones monótonas"
        correct: true
      - text: "Pearson siempre es más preciso"
      - text: "Spearman solo funciona con datos binarios"
      - text: "No hay diferencia"
  - question: "¿Qué significa una correlación de 0?"
    options:
      - text: "Las variables son idénticas"
      - text: "No hay relación lineal entre las variables"
        correct: true
      - text: "Una variable siempre es cero"
      - text: "Las variables están perfectamente correlacionadas"
  - question: "¿Por qué deberías comprobar la multicolinealidad?"
    options:
      - text: "Hace que los gráficos se vean mal"
      - text: "Los predictores muy correlacionados pueden desestabilizar los modelos estadísticos"
        correct: true
      - text: "Reduce el tamaño de la muestra"
      - text: "Causa valores faltantes"
---
La correlación mide la fuerza y la dirección de una relación lineal entre dos variables numéricas. Esta lección cubre la correlación de Pearson y de Spearman, cómo construir y leer mapas de calor de correlación, y cómo detectar la multicolinealidad, el destructor silencioso de los modelos de regresión.

## Conceptos clave

### Correlación de Pearson

La correlación de Pearson (r) mide la asociación lineal entre dos variables continuas:

```python
import pandas as pd
import numpy as np

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Compute Pearson correlation between two variables
r = df["math score"].corr(df["reading score"], method="pearson")
print(f"Pearson r (math vs reading): {r:.4f}")
```

Interpretación de r:
| Rango | Fuerza | Dirección |
|-------|----------|-----------|
| 0.00 – 0.19 | Muy débil |, |
| 0.20 – 0.39 | Débil |, |
| 0.40 – 0.59 | Moderada |, |
| 0.60 – 0.79 | Fuerte |, |
| 0.80 – 1.00 | Muy fuerte |, |

El signo indica la dirección: positiva (ambas aumentan juntas) o negativa (una aumenta mientras la otra disminuye).

### Correlación de Spearman

La correlación de Spearman (ρ) mide las relaciones monótonas, funciona con datos ordinales y es robusta a los valores atípicos:

```python
rho = df["math score"].corr(df["reading score"], method="spearman")
print(f"Spearman ρ (math vs reading): {rho:.4f}")

# Compare Pearson vs Spearman
pearson = df["math score"].corr(df["reading score"], method="pearson")
spearman = df["math score"].corr(df["reading score"], method="spearman")
print(f"Pearson: {pearson:.4f}  |  Spearman: {spearman:.4f}")
```

Cuando Pearson y Spearman divergen:
- **Spearman > Pearson**: la relación es monótona pero no lineal (curva)
- **Pearson > Spearman**: los valores atípicos están inflando la correlación lineal
- **Ambos similares**: la relación es lineal y monótona

### Matriz de correlación

Calcula las correlaciones de todas las columnas numéricas a la vez:

```python
# Full correlation matrix
num_cols = df.select_dtypes(include="number")
corr_matrix = num_cols.corr(method="pearson")
print(corr_matrix.round(3))
```

### Visualización con mapa de calor

Un mapa de calor hace que la matriz de correlación sea visual y escaneable:

```python
import seaborn as sns
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    corr_matrix,
    annot=True,          # show correlation values
    fmt=".2f",           # two decimal places
    cmap="RdBu_r",       # red-blue diverging colormap
    center=0,            # center colormap at zero
    vmin=-1, vmax=1,     # full correlation range
    square=True,         # square cells
    linewidths=0.5,      # cell borders
    ax=ax
)
ax.set_title("Correlation Matrix — Students Performance")
plt.tight_layout()
plt.show()
```

### Mapa de calor triangular (eliminar la redundancia)

La matriz completa es simétrica, el triángulo superior repite el triángulo inferior. Elimínalo:

```python
import numpy as np

mask = np.triu(np.ones_like(corr_matrix, dtype=bool))

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    corr_matrix,
    mask=mask,
    annot=True,
    fmt=".2f",
    cmap="RdBu_r",
    center=0,
    vmin=-1, vmax=1,
    square=True,
    linewidths=0.5,
    ax=ax
)
ax.set_title("Correlation Matrix (Lower Triangle)")
plt.tight_layout()
plt.show()
```

### Gráfico de pares para un panorama multivariado

Los gráficos de pares muestran cada relación por pares en una sola figura:

```python
sns.pairplot(
    df,
    vars=["math score", "reading score", "writing score"],
    hue="gender",
    diag_kind="kde",
    plot_kws={"alpha": 0.4},
    height=3
)
plt.suptitle("Pair Plot: Scores by Gender", y=1.02)
plt.show()
```

### La correlación no implica causalidad

La advertencia más importante de la estadística. Tres razones por las que una correlación puede ser engañosa:

1. **Confusión**: una tercera variable impulsa ambas. Ejemplo: la educación de los padres se correlaciona con los puntajes de los estudiantes, pero podría ser el ingreso lo que impulsa ambas.
2. **Causalidad inversa**: la dirección está al revés. Ejemplo: ¿la preparación para el examen causa puntajes más altos, o los estudiantes de alto rendimiento se autoseleccionan en la preparación?
3. **Correlación espuria**: dos variables no relacionadas se correlacionan por casualidad. Ejemplo: las ventas de helado y las tasas de ahogamiento aumentan ambas en verano (la temperatura es el factor de confusión).

```python
# Check for confounders
# Does the math-reading correlation change after controlling for gender?
for gender in df["gender"].unique():
    subset = df[df["gender"] == gender]
    r = subset["math score"].corr(subset["reading score"])
    print(f"{gender}: math-reading r = {r:.3f}")
```

### Detección de multicolinealidad

Cuando dos o más características de un modelo de regresión están muy correlacionadas, la multicolinealidad infla los errores estándar y vuelve inestables las estimaciones de los coeficientes.

Reglas prácticas:
- |r| > 0.7: investiga, puede que necesites eliminar una variable
- |r| > 0.9: multicolinealidad grave, elimina o combina

```python
# Find highly correlated pairs
high_corr_pairs = []
for i in range(len(corr_matrix.columns)):
    for j in range(i+1, len(corr_matrix.columns)):
        if abs(corr_matrix.iloc[i, j]) > 0.7:
            high_corr_pairs.append((
                corr_matrix.columns[i],
                corr_matrix.columns[j],
                corr_matrix.iloc[i, j]
            ))

print("Highly correlated pairs (|r| > 0.7):")
for col1, col2, r in high_corr_pairs:
    print(f"  {col1} <-> {col2}: r = {r:.3f}")
```

## Inténtalo

Construye un análisis de correlación completo para el conjunto de datos Students Performance.

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

num_cols = df.select_dtypes(include="number")
corr = num_cols.corr()

# Triangular heatmap
mask = np.triu(np.ones_like(corr, dtype=bool))
fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(corr, mask=mask, annot=True, fmt=".2f", cmap="RdBu_r",
            center=0, vmin=-1, vmax=1, square=True, linewidths=0.5, ax=ax)
ax.set_title("Correlation Heatmap")
plt.tight_layout()
plt.show()

# Pair plot
sns.pairplot(df, vars=["math score", "reading score", "writing score"],
             hue="gender", diag_kind="kde", plot_kws={"alpha": 0.4}, height=3)
plt.suptitle("Pair Plot: Scores by Gender", y=1.02)
plt.show()

# Find high correlations
for i in range(len(corr.columns)):
    for j in range(i+1, len(corr.columns)):
        if abs(corr.iloc[i, j]) > 0.5:
            print(f"{corr.columns[i]} <-> {corr.columns[j]}: r = {corr.iloc[i, j]:.3f}")
```

## Conclusiones clave

- Pearson mide la correlación lineal; Spearman mide la correlación monótona, usa ambos cuando la relación podría ser no lineal
- Los mapas de calor hacen visuales las matrices de correlación; los mapas de calor triangulares eliminan la información redundante
- Los gráficos de pares dan un panorama multivariado completo con distribuciones marginales
- La correlación nunca implica causalidad, los factores de confusión, la causalidad inversa y las correlaciones espurias siempre son posibles
- La multicolinealidad (|r| > 0.7) infla los errores estándar en los modelos de regresión y debe abordarse

## Desafío de práctica

Calcula las correlaciones de Pearson y de Spearman para todos los pares de puntajes. Crea una figura con dos mapas de calor lado a lado (uno para cada método). Anota qué pares tienen la mayor discrepancia entre Pearson y Spearman y explica qué significa esa discrepancia.

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

scores = df[["math score", "reading score", "writing score"]]

pearson_corr = scores.corr(method="pearson")
spearman_corr = scores.corr(method="spearman")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Pearson
sns.heatmap(pearson_corr, annot=True, fmt=".3f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, linewidths=0.5, ax=axes[0])
axes[0].set_title("Pearson Correlation")

# Spearman
sns.heatmap(spearman_corr, annot=True, fmt=".3f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, linewidths=0.5, ax=axes[1])
axes[1].set_title("Spearman Correlation")

plt.tight_layout()
plt.show()

# Find discrepancies
mask = np.triu(np.ones_like(pearson_corr, dtype=bool))
diff = (pearson_corr - spearman_corr).abs()
for i in range(len(diff.columns)):
    for j in range(i+1, len(diff.columns)):
        d = diff.iloc[i, j]
        if d > 0.01:
            print(f"{diff.columns[i]} <-> {diff.columns[j]}: "
                  f"Pearson={pearson_corr.iloc[i,j]:.3f}, "
                  f"Spearman={spearman_corr.iloc[i,j]:.3f}, "
                  f"Diff={d:.3f}")
```

</div>
</details>
