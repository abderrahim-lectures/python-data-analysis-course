---

title: "Analyse univariée des variables catégorielles"
description: "Analyser la distribution des fréquences, les proportions et les schémas des variables catégorielles avec des graphiques en barres et en comptage."
module: "univariate-analysis"
order: 4
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Utiliser value_counts() et normalize=True pour analyser des fréquences et des proportions"
  - "Construire et interpréter des graphiques en barres et des camemberts"
  - "Détecter les catégories rares et les étiquettes incohérentes"
  - "Comparer les distributions catégorielles entre groupes avec crosstab()"
prerequisites: ["03-univariate-numerical"]
tags: ["univarié", "catégoriel", "fréquences", "matplotlib", "pandas"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Quel code calcule la proportion de chaque valeur dans une colonne catégorielle ?"
    options:
      - text: "df['col'].value_counts()"
      - text: "df['col'].value_counts(normalize=True)"
        correct: true
      - text: "df['col'].count()"
      - text: "df['col'].describe()"
  - question: "Quel graphique est le plus approprié pour comprendre la distribution d'une variable catégorielle avec de nombreuses catégories ?"
    options:
      - text: "Un histogramme"
      - text: "Un graphique en barres"
        correct: true
      - text: "Un nuage de points"
      - text: "Une boîte à moustaches"
  - question: "Quel est le risque principal de l'analyse d'une variable catégorielle avec des centaines de valeurs uniques ?"
    options:
      - text: "Les valeurs non pertinentes"
      - text: "La redondance des catégories et la rareté des données par groupe"
        correct: true
      - text: "Il n'y a aucun risque"
      - text: "La cartographie des valeurs distinctes en nombres"
---

Les variables catégorielles décrivent des groupes, des catégories ou des étiquettes — genre, origine ethnique, type de repas, niveau d'éducation. Contrairement aux données numériques, on ne peut pas calculer de moyennes ni d'écarts-types. On analyse plutôt les fréquences, les proportions et le mode. Cette leçon couvre les outils et les techniques pour comprendre les données catégorielles.

## Concepts clés

### Tables de fréquences

Le fondement de l'analyse catégorielle est la table de fréquences :

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

### Nominal, ordinal et binaire

Comprendre le type de variable catégorielle détermine la façon dont vous l'analysez et la visualisez :

| Type | Description | Exemple | Analyse |
|------|-------------|---------|----------|
| **Binaire** | Deux catégories | genre | Proportion, rapport de cotes |
| **Nominal** | Pas d'ordre naturel | origine ethnique | Fréquence, mode |
| **Ordinal** | Un ordre naturel existe | niveau d'éducation | Catégorie médiane, corrélation de rang |

Les variables ordinales nécessitent un ordre explicite — ne laissez pas pandas les trier alphabétiquement :

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

### Graphiques en comptage avec seaborn

Les graphiques en comptage sont l'équivalent catégoriel des histogrammes — ils montrent les fréquences :

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

### Graphiques en barres horizontaux

Lorsque les étiquettes de catégories sont longues, les barres horizontales améliorent la lisibilité :

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

### Graphiques de proportions

Lorsque les tailles d'échantillon diffèrent, les proportions sont plus informatives que les comptages :

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

### Gérer les catégorielles à forte cardinalité

Lorsqu'une colonne catégorielle possède de nombreuses valeurs uniques, regroupez les catégories rares dans une catégorie « Other » :

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

### Annoter les comptages sur les barres

Ajouter les comptages aux barres rend les graphiques auto-explicatifs :

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

## Essayez-le

Analysez les variables catégorielles du jeu de données Students Performance.

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

## Points clés à retenir

- Les tables de fréquences sont le fondement de l'analyse catégorielle — calculez-les toujours en premier
- Distinguez les variables nominales, ordinales et binaires ; les variables ordinales nécessitent un ordre explicite
- Les graphiques en barres horizontaux sont meilleurs que les verticaux lorsque les étiquettes de catégories sont longues
- Utilisez des proportions plutôt que des comptages lorsque vous comparez des groupes de tailles différentes
- Regroupez les catégories rares dans « Other » lorsque la cardinalité est élevée
- Annotez les comptages sur les barres pour rendre les graphiques auto-explicatifs

## Défi pratique

Créez une figure montrant la distribution des types de `lunch`, avec des barres colorées selon la réalisation du `test preparation course`. Ajoutez des annotations de comptage à chaque segment de barre. Calculez ensuite la proportion d'étudiants ayant réalisé la préparation aux tests pour chaque type de repas.

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
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
