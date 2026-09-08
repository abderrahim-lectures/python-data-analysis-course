---

title: "Analyse de corrélation"
description: "Mesurer et visualiser les relations entre variables numériques avec le coefficient de Pearson, les nuages de points, les matrices de corrélation et les heatmaps."
module: "bivariate-analysis"
order: 6
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Calculer et interpréter le coefficient de corrélation de Pearson"
  - "Construire des nuages de points et des matrices de corrélation avec seaborn"
  - "Distinguer corrélation, causation et variables de confusion"
  - "Reconnaître les relations non linéaires que Pearson ne détecte pas"
prerequisites: ["05-bivariate-numerical"]
tags: ["corrélation", "pearson", "heatmap", "scatter", "seaborn"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Une corrélation de Pearson de -0,8 signifie que :"
    options:
      - text: "Une forte relation positive linéaire"
      - text: "Une forte relation négative linéaire"
        correct: true
      - text: "Aucune relation"
      - text: "Une relation exponentielle positive"
  - question: "Quelle affirmation est correcte ?"
    options:
      - text: "La corrélation implique toujours la causalité"
      - text: "La corrélation n'est pas la causalité"
        correct: true
      - text: "Une corrélation de 1,2 est très forte"
      - text: "Pearson détecte toutes les relations, y compris les non linéaires"
  - question: "Comment visualise-t-on la relation entre deux variables numériques ?"
    options:
      - text: "Un histogramme"
      - text: "Un nuage de points (scatter plot)"
        correct: true
      - text: "Un camembert"
      - text: "Un graphique en barres"
---

La corrélation mesure la force et la direction d'une relation linéaire entre deux variables numériques. Cette leçon couvre les corrélations de Pearson et de Spearman, la construction et la lecture des heatmaps de corrélation, et la détection de la multicolinéarité — le destructeur silencieux des modèles de régression.

## Concepts clés

### Corrélation de Pearson

La corrélation de Pearson (r) mesure l'association linéaire entre deux variables continues :

```python
import pandas as pd
import numpy as np

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

# Compute Pearson correlation between two variables
r = df["math score"].corr(df["reading score"], method="pearson")
print(f"Pearson r (math vs reading): {r:.4f}")
```

Interprétation de r :
| Plage | Force | Direction |
|-------|----------|-----------|
| 0,00 – 0,19 | Très faible | — |
| 0,20 – 0,39 | Faible | — |
| 0,40 – 0,59 | Modérée | — |
| 0,60 – 0,79 | Forte | — |
| 0,80 – 1,00 | Très forte | — |

Le signe indique la direction : positive (les deux augmentent ensemble) ou négative (l'une augmente quand l'autre diminue).

### Corrélation de Spearman

La corrélation de Spearman (ρ) mesure les relations monotones — elle fonctionne avec les données ordinales et est robuste aux valeurs aberrantes :

```python
rho = df["math score"].corr(df["reading score"], method="spearman")
print(f"Spearman ρ (math vs reading): {rho:.4f}")

# Compare Pearson vs Spearman
pearson = df["math score"].corr(df["reading score"], method="pearson")
spearman = df["math score"].corr(df["reading score"], method="spearman")
print(f"Pearson: {pearson:.4f}  |  Spearman: {spearman:.4f}")
```

Lorsque Pearson et Spearman divergent :
- **Spearman > Pearson** : la relation est monotone mais pas linéaire (courbe)
- **Pearson > Spearman** : les valeurs aberrantes gonflent la corrélation linéaire
- **Les deux similaires** : la relation est linéaire et monotone

### Matrice de corrélation

Calculez les corrélations de toutes les colonnes numériques d'un coup :

```python
# Full correlation matrix
num_cols = df.select_dtypes(include="number")
corr_matrix = num_cols.corr(method="pearson")
print(corr_matrix.round(3))
```

### Visualisation par heatmap

Une heatmap rend la matrice de corrélation visuelle et facile à parcourir du regard :

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

### Heatmap triangulaire (supprimer la redondance)

La matrice complète est symétrique — le triangle supérieur répète le triangle inférieur. Supprimez-le :

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

### Pair plot pour une vue multivariée

Les pair plots montrent toutes les relations par paires dans une seule figure :

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

### La corrélation n'implique pas la causalité

L'avertissement le plus important en statistiques. Trois raisons pour lesquelles une corrélation peut être trompeuse :

1. **Variable de confusion** : une troisième variable pilote les deux. Exemple : le niveau d'éducation des parents corrèle avec les notes des étudiants, mais c'est peut-être le revenu qui pilote les deux.
2. **Causalité inversée** : la direction est inversée. Exemple : la préparation aux tests cause-t-elle de meilleures notes, ou les étudiants qui réussissent bien choisissent-ils la préparation aux tests ?
3. **Corrélation fortuite** : deux variables sans lien corrèlent par hasard. Exemple : les ventes de glaces et les noyades augmentent toutes deux en été (la température est le facteur de confusion).

```python
# Check for confounders
# Does the math-reading correlation change after controlling for gender?
for gender in df["gender"].unique():
    subset = df[df["gender"] == gender]
    r = subset["math score"].corr(subset["reading score"])
    print(f"{gender}: math-reading r = {r:.3f}")
```

### Détection de la multicolinéarité

Lorsque deux caractéristiques ou plus d'un modèle de régression sont fortement corrélées, la multicolinéarité gonfle les erreurs types et rend les estimations de coefficients instables.

Règles empiriques :
- |r| > 0,7 : à investiguer — il faudra peut-être supprimer une variable
- |r| > 0,9 : multicolinéarité sérieuse — supprimer ou combiner

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

## Essayez-le

Construisez une analyse de corrélation complète pour le jeu de données Students Performance.

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

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

## Points clés à retenir

- Pearson mesure la corrélation linéaire ; Spearman mesure la corrélation monotone — utilisez les deux quand la relation peut être non linéaire
- Les heatmaps rendent les matrices de corrélation visuelles ; les heatmaps triangulaires suppriment les informations redondantes
- Les pair plots donnent un aperçu multivarié complet avec les distributions marginales
- Une corrélation n'implique jamais la causalité — variables de confusion, causalité inversée et corrélations fortuites sont toujours possibles
- La multicolinéarité (|r| > 0,7) gonfle les erreurs types des modèles de régression et doit être traitée

## Défi pratique

Calculez les corrélations de Pearson et de Spearman pour toutes les paires de notes. Créez une figure avec deux heatmaps côte à côte (une pour chaque méthode). Annotez les paires ayant le plus grand écart entre Pearson et Spearman, et expliquez ce que cet écart signifie.

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

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