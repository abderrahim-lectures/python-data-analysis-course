---

title: "Tracés avancés"
description: "Construire des visualisations multi-panels avec des sous-graphiques et facet grids, choisir le bon type de graphique pour chaque question, et fiabiliser l'analyse visuelle."
module: "storytelling-viz"
order: 7
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Construire des visualisations multi-panels avec matplotlib subplots et seaborn"
  - "Composer des tracés de comparaison filtrés par des sous-ensembles de variables"
  - "Appliquer un vocabulaire de choix d'axes commun pour optimiser l'analyse"
  - "Passer d'un graphique utile à un graphique de présentation soigné et limpide"
prerequisites: ["06-correlation-analysis"]
tags: ["visualisation", "matplotlib", "seaborn", "subplots", "facet grid"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Quel est le meilleur outil pour comparer deux distributions dans des panneaux séparés ?"
    options:
      - text: "Histplot avec hue"
      - text: "Distplot avec normalize=True"
      - text: "PairGrid utilisant displot, kdeplot, et histplot"
        correct: true
      - text: "Un camembert"
  - question: "Comment faciliter la reconnaissance des motifs graphiques ?"
    options:
      - text: "En utilisant huit à dix couleurs différentes"
      - text: "En configurant chaque panneau avec des axes nécessitant une lecture attentive"
      - text: "En utilisant différentes échelles pour chaque graphique"
      - text: "En partageant des limites et des échelles cohérentes entre les panneaux"
        correct: true
  - question: "Un graphique à facets nécessite :"
    options:
      - text: "Que les panneaux partagent des plages d'axes identiques afin que la comparaison soit fiable"
        correct: true
      - text: "Que chaque panneau s'ajuste automatiquement à sa propre plage pour un rendu optimal"
      - text: "Que les panneaux soient tracés sur des échelles variables d'un panneau à l'autre"
      - text: "Que les panneaux soient tracés dans des couleurs différentes les uns des autres"
---

Les graphiques simples révèlent des relations uniques. Les figures avancées à plusieurs panneaux révèlent la structure de l'ensemble de votre jeu de données. Cette leçon couvre le FacetGrid et le PairGrid de seaborn, le gridspec de matplotlib pour des mises en page personnalisées, et les techniques pour combiner plusieurs types de graphiques dans une seule figure.

## Concepts clés

### FacetGrid pour le découpage par catégories

Le FacetGrid répartit les données selon une ou plusieurs variables catégorielles et crée un panneau pour chaque combinaison :

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Single faceting variable
g = sns.FacetGrid(df, col="gender", row="lunch", height=4, aspect=1.2)
g.map(sns.histplot, "math score", kde=True, bins=15)
g.set_axis_labels("Math Score", "Count")
g.fig.suptitle("Math Score Distributions by Gender and Lunch Type", y=1.03)
plt.show()
```

### catplot (alternative plus simple à FacetGrid)

`catplot` est une interface de plus haut niveau qui gère le découpage en facets automatiquement :

```python
# Count plot faceted by gender and test prep
sns.catplot(
    data=df,
    x="race/ethnicity",
    col="gender",
    hue="test preparation course",
    kind="count",
    height=5,
    aspect=1.2,
    palette="Set2"
)
plt.show()

# Box plot faceted by lunch type
sns.catplot(
    data=df,
    x="gender",
    y="math score",
    col="lunch",
    kind="box",
    height=5,
    aspect=0.8,
    palette="Set2"
)
plt.show()
```

### PairGrid pour des graphiques par paires personnalisés

PairGrid vous donne un contrôle total sur ce qui apparaît sur la diagonale, le triangle supérieur et le triangle inférieur :

```python
g = sns.PairGrid(
    df,
    vars=["math score", "reading score", "writing score"],
    hue="gender",
    height=3
)

# Diagonal: KDE
g.map_diag(sns.kdeplot, fill=True, alpha=0.5)

# Upper triangle: scatter
g.map_upper(sns.scatterplot, alpha=0.4)

# Lower triangle: regression
g.map_lower(sns.regplot, scatter_kws={"alpha": 0.3})

g.add_legend()
g.fig.suptitle("Custom Pair Grid: Scores by Gender", y=1.02)
plt.show()
```

### Figures à plusieurs panneaux avec gridspec

Pour des mises en page où les sous-graphiques ont des tailles différentes, utilisez GridSpec :

```python
import matplotlib.gridspec as gridspec

fig = plt.figure(figsize=(14, 10))
gs = gridspec.GridSpec(2, 3, height_ratios=[1, 1.5], width_ratios=[1, 1, 1])

# Top row: three histograms
for i, subject in enumerate(["math score", "reading score", "writing score"]):
    ax = fig.add_subplot(gs[0, i])
    sns.histplot(df[subject], kde=True, ax=ax, bins=15, color="steelblue")
    ax.set_title(subject.replace(" score", " Scores"))

# Bottom row: wide scatter plot spanning two columns
ax_scatter = fig.add_subplot(gs[1, :2])
ax_scatter.scatter(df["math score"], df["reading score"], alpha=0.4, c="steelblue")
ax_scatter.set_title("Math vs Reading")
ax_scatter.set_xlabel("Math Score")
ax_scatter.set_ylabel("Reading Score")

# Bottom right: box plot
ax_box = fig.add_subplot(gs[1, 2])
sns.boxplot(data=df, x="gender", y="writing score", ax=ax_box, palette="Set2")
ax_box.set_title("Writing by Gender")

plt.tight_layout()
plt.show()
```

### Combiner plusieurs types de graphiques sur un même axe

Superposez différents types de graphiques pour ajouter des couches d'information :

```python
fig, ax = plt.subplots(figsize=(10, 6))

# Layer 1: scatter
ax.scatter(df["math score"], df["reading score"], alpha=0.3, label="Students", c="steelblue")

# Layer 2: regression line
z = np.polyfit(df["math score"], df["reading score"], 1)
p = np.poly1d(z)
x_line = np.linspace(df["math score"].min(), df["math score"].max(), 100)
ax.plot(x_line, p(x_line), "r--", linewidth=2, label=f"Trend (slope={z[0]:.2f})")

# Layer 3: means
mean_math = df["math score"].mean()
mean_reading = df["reading score"].mean()
ax.axvline(mean_math, color="green", linestyle=":", alpha=0.7, label=f"Mean Math: {mean_math:.1f}")
ax.axhline(mean_reading, color="orange", linestyle=":", alpha=0.7, label=f"Mean Reading: {mean_reading:.1f}")

ax.set_title("Math vs Reading Scores with Trend and Means")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
ax.legend()
plt.show()
```

### Axes insérés pour des vues zoomées

Affichez une vue agrandie d'une région à l'intérieur d'un graphique plus grand :

```python
from mpl_toolkits.axes_grid1.inset_locator import inset_axes

fig, ax = plt.subplots(figsize=(10, 6))
ax.scatter(df["math score"], df["reading score"], alpha=0.3, s=20)
ax.set_title("Math vs Reading (with inset zoom)")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")

# Inset: zoom into the dense center region
axins = inset_axes(ax, width="40%", height="40%", loc="upper left")
axins.scatter(df["math score"], df["reading score"], alpha=0.3, s=10)
axins.set_xlim(50, 70)
axins.set_ylim(50, 70)
axins.set_title("Zoomed Region", fontsize=8)

plt.show()
```

### Axes jumeaux (twin axes) pour des double échelles en y

Lorsque deux variables ont des échelles différentes mais partagent un axe x :

```python
fig, ax1 = plt.subplots(figsize=(10, 6))

# Left y-axis
color1 = "steelblue"
ax1.hist(df["math score"], bins=20, alpha=0.6, color=color1, label="Math Score")
ax1.set_xlabel("Score")
ax1.set_ylabel("Math Score Count", color=color1)
ax1.tick_params(axis="y", labelcolor=color1)

# Right y-axis
ax2 = ax1.twinx()
color2 = "coral"
ax2.hist(df["reading score"], bins=20, alpha=0.6, color=color2, label="Reading Score")
ax2.set_ylabel("Reading Score Count", color=color2)
ax2.tick_params(axis="y", labelcolor=color2)

ax1.set_title("Math vs Reading Score Distributions (Dual Axis)")
fig.legend(loc="upper right", bbox_to_anchor=(0.9, 0.9))
plt.show()
```

## Essayez-le

Construisez une figure complète à plusieurs panneaux pour le jeu de données Students Performance.

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(2, 3, hspace=0.35, wspace=0.3)

# Panel 1: Math score distribution by gender
ax1 = fig.add_subplot(gs[0, 0])
sns.histplot(data=df, x="math score", hue="gender", kde=True, ax=ax1, alpha=0.5, bins=15)
ax1.set_title("Math by Gender")

# Panel 2: Reading score distribution by lunch
ax2 = fig.add_subplot(gs[0, 1])
sns.violinplot(data=df, x="lunch", y="reading score", ax=ax2, palette="Set2")
ax2.set_title("Reading by Lunch Type")

# Panel 3: Ethnicity counts
ax3 = fig.add_subplot(gs[0, 2])
sns.countplot(data=df, x="race/ethnicity", ax=ax3, palette="Set3")
ax3.set_title("Ethnicity Distribution")
ax3.tick_params(axis="x", rotation=45)

# Panel 4: Math vs Writing scatter
ax4 = fig.add_subplot(gs[1, 0])
ax4.scatter(df["math score"], df["writing score"], alpha=0.3, c="steelblue")
ax4.set_title("Math vs Writing")
ax4.set_xlabel("Math Score")
ax4.set_ylabel("Writing Score")

# Panel 5: Correlation heatmap
ax5 = fig.add_subplot(gs[1, 1])
corr = df[["math score", "reading score", "writing score"]].corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, ax=ax5, cbar_kws={"shrink": 0.8})
ax5.set_title("Correlation Matrix")

# Panel 6: Test prep comparison
ax6 = fig.add_subplot(gs[1, 2])
sns.boxplot(data=df, x="test preparation course", y="math score",
            hue="gender", ax=ax6, palette="Set1")
ax6.set_title("Test Prep Effect")

fig.suptitle("Students Performance — Multi-Panel Overview", fontsize=16, fontweight="bold", y=1.01)
plt.show()
```

## Points clés à retenir

- FacetGrid et catplot créent des vues multi-panneaux réparties par variables catégorielles — essentiels pour comparer les distributions entre groupes
- PairGrid donne un contrôle total sur les types de graphiques de la diagonale, du triangle supérieur et du triangle inférieur
- GridSpec crée des mises en page personnalisées où les sous-graphiques ont des tailles différentes
- Combiner plusieurs types de graphiques sur un même axe (dispersion + régression + moyennes) empile l'information efficacement
- Les axes insérés et les axes jumeaux ajoutent des vues zoomées ou à double échelle sans créer de nouvelles figures

## Défi pratique

Créez une figure de 2×2 : (1) un FacetGrid d'histogrammes des notes de maths répartis par genre, (2) un PairGrid des trois notes avec KDE sur la diagonale et dispersion en dessous, (3) un graphique combiné dispersion + régression + lignes de moyennes et (4) une heatmap de corrélation. Définissez un titre de figure unique pour l'ensemble.

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig = plt.figure(figsize=(16, 14))
gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

# Panel 1: FacetGrid-like — math by gender (two histograms)
ax1 = fig.add_subplot(gs[0, 0])
for gender in df["gender"].unique():
    ax1.hist(df[df["gender"] == gender]["math score"], alpha=0.5, bins=15, label=gender)
ax1.set_title("Math Score by Gender")
ax1.set_xlabel("Math Score")
ax1.set_ylabel("Count")
ax1.legend()

# Panel 2: PairGrid-like — scatter below diagonal, KDE on diagonal
ax2 = fig.add_subplot(gs[0, 1])
ax2.scatter(df["math score"], df["reading score"], alpha=0.3, c="steelblue")
mean_m, mean_r = df["math score"].mean(), df["reading score"].mean()
ax2.axvline(mean_m, color="green", linestyle="--", alpha=0.7, label=f"Mean Math: {mean_m:.1f}")
ax2.axhline(mean_r, color="orange", linestyle="--", alpha=0.7, label=f"Mean Reading: {mean_r:.1f}")
ax2.set_title("Math vs Reading with Means")
ax2.set_xlabel("Math Score")
ax2.set_ylabel("Reading Score")
ax2.legend(fontsize=8)

# Panel 3: Scatter + regression + means
ax3 = fig.add_subplot(gs[1, 0])
sns.regplot(data=df, x="math score", y="writing score", ax=ax3,
            scatter_kws={"alpha": 0.3}, line_kws={"color": "red"})
ax3.set_title("Math vs Writing (Regression)")
ax3.set_xlabel("Math Score")
ax3.set_ylabel("Writing Score")

# Panel 4: Correlation heatmap
ax4 = fig.add_subplot(gs[1, 1])
corr = df[["math score", "reading score", "writing score"]].corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, ax=ax4, linewidths=0.5)
ax4.set_title("Correlation Matrix")

fig.suptitle("Students Performance — Comprehensive Overview", fontsize=16, fontweight="bold", y=1.01)
plt.show()
```

</div>
</details>
