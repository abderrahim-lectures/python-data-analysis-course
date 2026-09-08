---

title: "Principios de Narración de Datos"
description: "Estructura narrativas visuales, anota los gráficos para mayor claridad y diseña presentaciones que impulsen la acción."
module: "storytelling-viz"
order: 8
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Aplicar el arco narrativo (situación → complicación → resolución) a las presentaciones de datos"
  - "Usar el diseño anotación-primero para que los gráficos se expliquen solos"
  - "Elegir paletas de colores, títulos y tipografía de forma intencional para impactar al público"
  - "Estructurar un dashboard multipanel que guíe al espectador a través de una historia"
prerequisites: ["07-advanced-plots"]
tags: ["storytelling", "annotations", "color-palettes", "presentation", "dashboard"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "¿Cuál es el objetivo principal de la narración de datos?"
    options:
      - text: "Mostrar todos los gráficos que hiciste"
      - text: "Guiar al público de los datos al conocimiento y a la acción"
        correct: true
      - text: "Usar las visualizaciones más complejas posibles"
      - text: "Presentar números crudos sin contexto"
  - question: "¿Qué es el principio Y qué importa en la presentación de datos?"
    options:
      - text: "Mostrar los datos y dejar que el público los interprete"
      - text: "Por cada gráfico, explicar qué significa y por qué es importante"
        correct: true
      - text: "Usar siempre gráficos circulares"
      - text: "Mantener las presentaciones cortas"
  - question: "¿Por qué deberías empezar por el hallazgo clave en lugar de la metodología?"
    options:
      - text: "La metodología no es importante"
      - text: "Quienes toman decisiones necesitan primero la conclusión y luego los detalles"
        correct: true
      - text: "Ahorra tiempo en el diseño de gráficos"
      - text: "Hace que el análisis se vea mejor"
---
Un gráfico que nadie lee es peor que ningún gráfico. La narración de datos es la habilidad de convertir el análisis en conocimiento que cambia decisiones. Esta lección cubre la estructura narrativa, las técnicas de anotación, las decisiones de color y los principios de diseño de dashboards que hacen persuasivas tus visualizaciones.

## Conceptos clave

### El arco narrativo

Toda historia de datos sigue una estructura de tres partes:

1. **Situación**: ¿Cuál es el contexto? ¿Qué sabe ya el público?
2. **Complicación**: ¿Cuál es el problema, la sorpresa o la tensión que revelan los datos?
3. **Resolución**: ¿Qué sugieren los datos que deberíamos hacer al respecto?

```python
# Example narrative for Students Performance analysis
narrative = {
    "situation": "We analyzed exam scores for 1000 students across math, reading, and writing.",
    "complication": "Students who didn't complete test preparation scored 7-10 points lower on average.",
    "resolution": "Expanding test preparation access could close the performance gap."
}
```

### Diseño anotación-primero

Los mejores gráficos se explican solos sin título. Añade anotaciones directamente en el gráfico:

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

fig, ax = plt.subplots(figsize=(10, 6))

# Box plot
sns.boxplot(data=df, x="test preparation course", y="math score", ax=ax, palette="Set2")

# Annotation: mean difference
mean_completed = df[df["test preparation course"] == "completed"]["math score"].mean()
mean_none = df[df["test preparation course"] == "none"]["math score"].mean()
diff = mean_completed - mean_none

ax.annotate(
    f"Average difference: +{diff:.1f} points",
    xy=(1, mean_completed),
    xytext=(0.5, mean_completed + 5),
    fontsize=12,
    fontweight="bold",
    color="darkgreen",
    arrowprops=dict(arrowstyle="->", color="darkgreen", lw=2),
    bbox=dict(boxstyle="round,pad=0.3", facecolor="lightyellow", edgecolor="darkgreen")
)

ax.set_title("Test Preparation Impact on Math Scores", fontsize=14, fontweight="bold")
ax.set_xlabel("Test Preparation Course")
ax.set_ylabel("Math Score")
plt.tight_layout()
plt.show()
```

### Elección de paletas de colores

El color no es decoración — es comunicación. Elige las paletas según el tipo de datos:

```python
# Sequential: for ordered data (low to high)
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Sequential
sns.color_palette("Blues_r", n_colors=5)
axes[0, 0].bar(range(5), range(5), color=sns.color_palette("Blues_r", 5))
axes[0, 0].set_title("Sequential (ordered)")

# Diverging: for data with a meaningful midpoint
sns.color_palette("RdBu_r", n_colors=5)
axes[0, 1].bar(range(5), [3, 1, 4, 2, 5], color=sns.color_palette("RdBu_r", 5))
axes[0, 1].set_title("Diverging (midpoint)")

# Qualitative: for categorical data
sns.color_palette("Set2", n_colors=5)
axes[1, 0].bar(range(5), [4, 2, 5, 3, 1], color=sns.color_palette("Set2", 5))
axes[1, 0].set_title("Qualitative (categorical)")

# Custom palette
custom = ["#2E86AB", "#A23B72", "#F18F01", "#C73E1D", "#3B1F2B"]
axes[1, 1].bar(range(5), [3, 5, 2, 4, 1], color=custom)
axes[1, 1].set_title("Custom Brand Palette")

plt.tight_layout()
plt.show()
```

Reglas de color:
- **Secuencial** para valores numéricos (más oscuro = más alto)
- **Divergente** al comparar con un punto medio (rojo = malo, azul = bueno)
- **Cualitativa** para categorías (colores distintos, sin orden inherente)
- **Nunca uses el color como única codificación** — añade siempre etiquetas o patrones para la accesibilidad de las personas con daltonismo

### Diseño de título y subtítulo

Los buenos títulos enuncian el hallazgo, no el tipo de gráfico:

```python
# Bad title
ax.set_title("Math Score Distribution by Gender")

# Good title
ax.set_title("Female Students Score 6 Points Higher on Reading Tests")

# Even better: subtitle with context
fig, ax = plt.subplots(figsize=(10, 6))
fig.suptitle("Gender Gap Varies by Subject", fontsize=16, fontweight="bold", y=1.02)
ax.set_title("Female students outperform in reading (+6.2) and writing (+5.6),\n"
             "while male students lead in math (+3.2)", fontsize=11, style="italic")
```

### Estructura del dashboard

Un dashboard es una colección de gráficos que cuenta una historia coherente. Estructúralo como una narración:

```python
import matplotlib.gridspec as gridspec

fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(3, 3, hspace=0.4, wspace=0.3, height_ratios=[0.5, 1.5, 1.5])

# Title banner
ax_title = fig.add_subplot(gs[0, :])
ax_title.axis("off")
ax_title.text(0.5, 0.5,
              "Students Performance in Exams — Key Findings",
              fontsize=18, fontweight="bold", ha="center", va="center",
              transform=ax_title.transAxes)
ax_title.text(0.5, 0.1,
              "Analysis of 1000 students across demographics and exam scores",
              fontsize=12, ha="center", va="center", style="italic",
              transform=ax_title.transAxes)

# Finding 1: Test prep impact
ax1 = fig.add_subplot(gs[1, 0])
sns.boxplot(data=df, x="test preparation course", y="math score",
            ax=ax1, palette="Set2")
ax1.set_title("Finding 1: Test Prep Boosts Scores", fontsize=10, fontweight="bold")

# Finding 2: Gender differences
ax2 = fig.add_subplot(gs[1, 1])
scores_by_gender = df.groupby("gender")[["math score", "reading score", "writing score"]].mean()
scores_by_gender.plot(kind="bar", ax=ax2, rot=0)
ax2.set_title("Finding 2: Gender Patterns by Subject", fontsize=10, fontweight="bold")
ax2.legend(fontsize=8)

# Finding 3: Lunch type matters
ax3 = fig.add_subplot(gs[1, 2])
sns.boxplot(data=df, x="lunch", y="math score", ax=ax3, palette="Set3")
ax3.set_title("Finding 3: Lunch Type Correlates with Scores", fontsize=10, fontweight="bold")

# Insight banner
ax_insight = fig.add_subplot(gs[2, :])
ax_insight.axis("off")
ax_insight.text(0.5, 0.5,
                "KEY INSIGHT: Test preparation and lunch type are the strongest predictors.\n"
                "Targeted interventions in these areas could improve outcomes for underserved students.",
                fontsize=14, ha="center", va="center",
                bbox=dict(boxstyle="round,pad=1", facecolor="lightyellow", edgecolor="orange"),
                transform=ax_insight.transAxes)

plt.tight_layout()
plt.show()
```

### Diseño consciente del público

Diseña para tu público:

| Público | Lo que les importa | Enfoque de diseño |
|----------|---------------------|-----------------|
| Ejecutivos | Resultado final, acciones | Hallazgos contundentes, mínimo detalle |
| Analistas | Método, reproducibilidad | Código, estadísticas, metodología |
| Público general | Historias claras y simples | Menos gráficos, lenguaje llano |

```python
# Executive-friendly: big numbers with context
fig, axes = plt.subplots(1, 3, figsize=(14, 4))

metrics = {
    "Avg Math Score": df["math score"].mean(),
    "Avg Reading Score": df["reading score"].mean(),
    "Test Prep Effect": diff,
}

for i, (label, value) in enumerate(metrics.items()):
    axes[i].text(0.5, 0.6, f"{value:.1f}", fontsize=48, fontweight="bold",
                 ha="center", va="center", transform=axes[i].transAxes)
    axes[i].text(0.5, 0.2, label, fontsize=14,
                 ha="center", va="center", transform=axes[i].transAxes, style="italic")
    axes[i].axis("off")

plt.suptitle("Students Performance Dashboard — Executive Summary", fontsize=16, fontweight="bold")
plt.tight_layout()
plt.show()
```

## Inténtalo

Crea un gráfico anotado que cuente una historia de datos sobre el conjunto de datos Students Performance.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

# Story: Test preparation closes the gap
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle("Test Preparation Impact Across Subjects", fontsize=16, fontweight="bold")

for i, subject in enumerate(["math score", "reading score", "writing score"]):
    means = df.groupby("test preparation course")[subject].mean()
    diff = means["completed"] - means["none"]

    sns.boxplot(data=df, x="test preparation course", y=subject,
                ax=axes[i], palette="Set2")
    axes[i].set_title(subject.replace(" score", "").title())

    axes[i].annotate(
        f"+{diff:.1f} points",
        xy=(1, means["completed"]),
        xytext=(1.3, means["completed"] + 2),
        fontsize=11, fontweight="bold", color="darkgreen",
        arrowprops=dict(arrowstyle="->", color="darkgreen"),
        bbox=dict(boxstyle="round,pad=0.3", facecolor="lightyellow", edgecolor="darkgreen")
    )

plt.tight_layout()
plt.show()
```

## Conclusiones clave

- Sigue el arco narrativo: situación → complicación → resolución
- Anota los gráficos directamente — el gráfico debe explicarse solo sin un título
- Elige las paletas de colores según el tipo de datos: secuencial para lo ordenado, divergente para comparaciones con punto medio, cualitativa para categorías
- Los títulos deben enunciar el hallazgo, no el tipo de gráfico
- Estructura los dashboards como historias: titular → evidencia → conclusión
- Diseña para tu público — los ejecutivos quieren hallazgos, los analistas quieren metodología

## Desafío de práctica

Crea un dashboard de 3 paneles que cuente una historia sobre la brecha de género en los puntajes de los exámenes: (1) un gráfico de barras agrupado de los puntajes medios por género y asignatura, (2) un diagrama de caja de la brecha (matemáticas menos escritura) por género, y (3) un banner de hallazgos que resuma la conclusión. Usa anotaciones en cada gráfico.

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

fig = plt.figure(figsize=(16, 10))
gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3, height_ratios=[1.5, 1])

# Panel 1: Grouped bar chart
ax1 = fig.add_subplot(gs[0, 0])
means = df.groupby("gender")[["math score", "reading score", "writing score"]].mean()
means.plot(kind="bar", ax=ax1, rot=0, colormap="Set2")
ax1.set_title("Average Scores by Gender and Subject", fontweight="bold")
ax1.set_ylabel("Mean Score")
ax1.legend(title="Subject")

# Panel 2: Score gap box plot
ax2 = fig.add_subplot(gs[0, 1])
df["math_writing_gap"] = df["math score"] - df["writing score"]
sns.boxplot(data=df, x="gender", y="math_writing_gap", ax=ax2, palette="Set1")
ax2.axhline(0, color="gray", linestyle="--", alpha=0.5)
ax2.set_title("Math-Writing Score Gap by Gender", fontweight="bold")
gap_means = df.groupby("gender")["math_writing_gap"].mean()
for i, gender in enumerate(["female", "male"]):
    ax2.annotate(
        f"Mean: {gap_means[gender]:+.1f}",
        xy=(i, gap_means[gender]),
        xytext=(i + 0.3, gap_means[gender] + 0.5),
        fontsize=10, fontweight="bold",
        arrowprops=dict(arrowstyle="->", color="black"),
    )

# Insight banner
ax_insight = fig.add_subplot(gs[1, :])
ax_insight.axis("off")
ax_insight.text(0.5, 0.5,
    "INSIGHT: Female students outperform in reading (+6.2) and writing (+5.6),\n"
    "while male students lead in math (+3.2). The math-writing gap is +8.8 for males\n"
    "and -5.0 for females — a 13.8 point swing. Interventions should target subject-specific gaps.",
    fontsize=13, ha="center", va="center",
    bbox=dict(boxstyle="round,pad=1", facecolor="lightyellow", edgecolor="orange"),
    transform=ax_insight.transAxes)

fig.suptitle("Gender Performance Gap — Data Story", fontsize=16, fontweight="bold", y=1.02)
plt.show()
```

</div>
</details>