---

title: "Analyse bivariée des variables numériques"
description: "Explorer les relations entre deux variables numériques avec des diagrammes de dispersion, des droites de régression et des comparaisons groupées."
module: "bivariate-analysis"
order: 5
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Analyser la distribution d'une variable numérique à travers les catégories d'une variable catégorielle"
  - "Utiliser les boîtes à moustaches et les diagrammes violons pour comparer des groupes"
  - "Calculer les statistiques descriptives par groupe avec groupby() et crosstab()"
  - "Interpréter les différences entre groupes et vérifier leur signification"
prerequisites: ["04-univariate-categorical"]
tags: ["bivarié", "boxplot", "comparaison de groupes", "groupby", "pandas"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Lequel de ces tests évalue si les moyennes de deux groupes diffèrent significativement ?"
    options:
      - text: "Le test du chi carré (chi-squared)"
      - text: "Le test t (t-test)"
        correct: true
      - text: "Le coefficient de corrélation (r)"
      - text: "Le coefficient de détermination (R²)"
  - question: "Quelle visualisation compare simultanément la médiane, la dispersion et les valeurs aberrantes de plusieurs groupes ?"
    options:
      - text: "Un histogramme"
      - text: "Un boxplot"
        correct: true
      - text: "Un nuage de points"
      - text: "Un camembert"
  - question: "Quelle est la différence principale entre le boxplot et le violinplot pour comparer des groupes ?"
    options:
      - text: "Le violinplot montre la forme de la distribution, pas seulement les quartiles"
        correct: true
      - text: "Le boxplot affiche plus de valeurs aberrantes"
      - text: "Le violinplot convient mieux aux données multiples"
      - text: "Ils sont identiques"
---

Lorsque vous examinez comment deux variables numériques sont liées l'une à l'autre, vous entrez dans le domaine de l'analyse bivariée. Cette leçon couvre les diagrammes de dispersion (le cheval de trait de l'analyse bivariée), les droites de régression qui quantifient la relation, les joint plots qui combinent les distributions marginales et conjointes, et les graphiques groupés qui introduisent une dimension catégorielle.

## Concepts clés

### Diagrammes de dispersion

Le diagramme de dispersion est la visualisation bivariée la plus fondamentale. Chaque point représente une observation, tracée sur deux axes numériques :

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

fig, ax = plt.subplots(figsize=(8, 6))
ax.scatter(df["math score"], df["reading score"], alpha=0.5, edgecolors="black", linewidth=0.5)
ax.set_title("Math vs Reading Scores")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
plt.show()
```

La transparence alpha (`alpha=0.5`) est essentielle — elle révèle la densité des points là où ils se chevauchent.

### Graphiques de régression

Le `regplot` de seaborn ajoute une droite de régression qui quantifie la relation linéaire :

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

Lecture d'un graphique de régression :
- **Pente** : une pente positive signifie une corrélation positive ; plus elle est forte, plus la relation est forte
- **Intervalle de confiance** (zone ombrée) : plus il est large, plus l'incertitude est grande
- **Résidus** : les points éloignés de la droite sont mal prédits

### Joint plots

Les joint plots combinent le diagramme de dispersion avec les distributions marginales sur chaque axe :

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

Le paramètre `kind` change le type de joint plot :
- `"scatter"` : dispersion brute avec histogrammes marginaux
- `"reg"` : dispersion avec droite de régression et histogrammes marginaux
- `"kde"` : densité de noyau 2D avec KDE marginaux
- `"hist"` : histogramme 2D avec histogrammes marginaux

### Hexbin plots pour la densité

Lorsque les jeux de données sont volumineux, les diagrammes de dispersion deviennent surchargés. Les hexbin plots résolvent ce problème :

```python
fig, ax = plt.subplots(figsize=(8, 6))
hb = ax.hexbin(df["math score"], df["reading score"], gridsize=20, cmap="YlOrRd")
ax.set_title("Math vs Reading (Hexbin Density)")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
plt.colorbar(hb, label="Count")
plt.show()
```

### Comparaisons numérique-catégorielle

Lorsqu'une variable est catégorielle, comparez les distributions entre les groupes :

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

### Swarm plots et strip plots

Pour les jeux de données plus petits, montrez les points individuels avec un léger décalage (jitter) :

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

### Identifier les relations à partir des graphiques

| Motif | Ce que cela signifie | Graphique à utiliser |
|---------|---------------|-------------|
| Tendance linéaire | Les variables augmentent ensemble | Dispersion + reg plot |
| Tendance non linéaire | La relation change selon la plage | Dispersion avec LOWESS |
| Hétéroscédasticité | La dispersion change selon la plage | Graphique des résidus |
| Groupes (clusters) | Des sous-groupes distincts existent | Dispersion avec hue |
| Valeurs aberrantes | Points éloignés du motif | Dispersion avec annotations |

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

## Essayez-le

Explorez la relation entre les notes de maths et de lecture, groupée par genre et par préparation aux tests.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

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

## Points clés à retenir

- Les diagrammes de dispersion sont le fondement de l'analyse bivariée ; utilisez toujours une transparence alpha pour les points qui se chevauchent
- Les droites de régression quantifient les relations linéaires ; la zone ombrée montre l'incertitude
- Les joint plots combinent les diagrammes de dispersion avec les distributions marginales pour une image complète
- Les hexbin plots résolvent la surcharge de points des grands jeux de données en montrant la densité
- Les boîtes à moustaches et les violons groupés comparent les distributions numériques entre groupes catégoriels
- Utilisez hue et style pour ajouter une troisième et une quatrième dimension aux diagrammes de dispersion

## Défi pratique

Créez une figure avec 4 panneaux montrant : (1) un diagramme de dispersion des notes de maths contre les notes de rédaction, (2) une dispersion avec droite de régression, (3) un hexbin plot de densité et (4) une dispersion colorée par type de repas. Ajoutez des titres et des étiquettes d'axes appropriés.

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

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