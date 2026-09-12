---

title: "Analyse univariée des variables numériques"
description: "Analyser une seule colonne numérique avec des statistiques descriptives, des histogrammes, des boîtes à moustaches et des mesures d'asymétrie."
module: "univariate-analysis"
order: 3
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Résumer une colonne numérique avec des statistiques descriptives appropriées"
  - "Construire et interpréter des histogrammes pour comprendre la forme d'une distribution"
  - "Utiliser les boîtes à moustaches pour détecter les valeurs aberrantes et comparer des groupes"
  - "Mettre en évidence l'asymétrie avec des métriques numériques et des graphiques"
prerequisites: ["02-dataset-profiling"]
tags: ["univarié", "statistiques", "asymétrie", "histogramme", "pandas"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Comment détectez-vous rapidement une distribution asymétrique à droite ?"
    options:
      - text: "La moyenne est nettement supérieure à la médiane"
        correct: true
      - text: "La médiane est nettement supérieure à la moyenne"
      - text: "La moyenne et la médiane sont égales"
      - text: "L'écart-type est égal à zéro"
  - question: "Dans une distribution asymétrique à droite, où se situe la queue ?"
    options:
      - text: "À gauche, vers les valeurs faibles"
      - text: "À droite, vers les valeurs élevées"
        correct: true
      - text: "Elle est symétrique, il n'y a pas de queue"
      - text: "La queue se trouve au centre"
  - question: "Quel graphique montre le mieux les valeurs aberrantes individuelles ?"
    options:
      - text: "Un histogramme"
      - text: "Un diagramme de dispersion"
      - text: "Une boîte à moustaches (boxplot)"
        correct: true
      - text: "Un nuage de points"
---

L'analyse univariée des variables numériques examine une seule variable numérique à la fois. L'objectif est de comprendre sa distribution : où les valeurs se regroupent, comment elles sont dispersées, si la distribution est symétrique ou asymétrique et si des valeurs aberrantes existent. Cette leçon couvre les principaux types de graphiques et les statistiques récapitulatives pour les données numériques.

## Concepts clés

### Statistiques récapitulatives

Avant de tracer des graphiques, calculez les nombres qui décrivent la distribution :

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

Interprétation :
- **Asymétrie > 0** : queue asymétrique à droite (par ex. la plupart des notes basses, quelques très hautes)
- **Asymétrie < 0** : queue asymétrique à gauche (par ex. la plupart des notes hautes, quelques très basses)
- **Aplatissement > 0** : queues épaisses (plus de valeurs aberrantes qu'une distribution normale)
- **Aplatissement < 0** : queues fines (moins de valeurs aberrantes qu'une distribution normale)

### Histogrammes

L'histogramme est le fondement de l'analyse univariée des variables numériques. Il montre la distribution des fréquences :

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

Décisions clés :
- **Nombre de classes (bins)** : trop peu de classes masque les détails, trop en crée du bruit. `bins=20` est une valeur par défaut raisonnable pour des jeux de données de moins de 10 000 lignes. Utilisez `bins="auto"` pour une sélection automatique.
- **Couleur des bords** : `edgecolor="black"` rend les limites des classes visibles.

### Diagrammes KDE (estimation de la densité par noyau)

Les diagrammes KDE lissent l'histogramme en une courbe continue, ce qui facilite la comparaison des distributions et l'identification de la modalité :

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

### Boîtes à moustaches

Les boîtes à moustaches montrent le résumé en cinq nombres (min, Q1, médiane, Q3, max) et mettent en évidence les valeurs aberrantes :

```python
fig, ax = plt.subplots(figsize=(8, 5))

sns.boxplot(x=scores, ax=ax, color="lightblue", flierprops=dict(marker="o", markersize=5))
ax.set_title("Math Score Box Plot")
ax.set_xlabel("Math Score")
plt.show()
```

Lecture d'une boîte à moustaches :
- **Boîte** : intervalle interquartile (IQR), les 50 % du milieu des données
- **Ligne à l'intérieur de la boîte** : médiane
- **Moustaches** : 1,5 × IQR à partir de Q1 et Q3
- **Points au-delà des moustaches** : valeurs aberrantes (en général > 1,5 × IQR)

### Diagrammes en violon

Les diagrammes en violon combinent la boîte à moustaches avec le KDE, montrant à la fois les statistiques récapitulatives et la forme complète de la distribution :

```python
fig, ax = plt.subplots(figsize=(8, 5))

sns.violinplot(x=scores, ax=ax, inner="quartile", color="lightgreen")
ax.set_title("Math Score Violin Plot")
ax.set_xlabel("Math Score")
plt.show()
```

Le paramètre `inner` contrôle ce qui est dessiné à l'intérieur du violon :
- `"quartile"` : affiche les lignes Q1, médiane et Q3
- `"box"` : affiche une mini boîte à moustaches
- `"stick"` : affiche tous les points de données sous forme de bâtonnets

### Choisir le bon graphique

| Graphique | Idéal pour | Montre |
|------|----------|-------|
| Histogramme | Distribution des fréquences, forme | Classes et comptes |
| KDE | Distribution lissée, comparaison de groupes | Courbe de densité continue |
| Boîte à moustaches | Statistiques récapitulatives, valeurs aberrantes | Résumé en cinq nombres |
| Violon | Distribution complète + récapitulatif | KDE + boîte à moustaches combinés |

### Comparer les distributions entre groupes

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5), sharey=True)

for i, subject in enumerate(["math score", "reading score", "writing score"]):
    sns.boxplot(data=df, x="gender", y=subject, ax=axes[i])
    axes[i].set_title(subject.replace(" score", " Scores").title())

plt.tight_layout()
plt.show()
```

## Essayez-le

Analysez la distribution du score de lecture du jeu de données Students Performance.

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

## Points clés à retenir

- Calculez toujours les statistiques récapitulatives avant de tracer des graphiques, elles vous disent quoi chercher dans le visuel
- Les histogrammes montrent les fréquences ; les diagrammes KDE montrent la densité ; les boîtes à moustaches montrent les statistiques récapitulatives ; les diagrammes en violon combinent les deux
- L'asymétrie et l'aplatissement quantifient la forme d'une distribution en nombres
- Les boîtes à moustaches rendent les valeurs aberrantes évidentes ; les histogrammes révèlent la modalité (unimodale contre bimodale)
- Comparez les distributions entre groupes en les traçant côte à côte avec des axes partagés

## Défi pratique

Créez une figure unique avec quatre sous-graphiques montrant la distribution du `math score` en utilisant : (1) un histogramme, (2) un diagramme KDE, (3) une boîte à moustaches et (4) un diagramme en violon. Ajoutez une ligne verticale à la moyenne sur chaque graphique. Définissez le titre de la figure à « Math Score Distribution Analysis ».

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
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
