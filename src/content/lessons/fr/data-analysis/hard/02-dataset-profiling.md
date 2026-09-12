---

title: "Profil du jeu de données"
description: "Évaluer systématiquement la structure, les types, les données manquantes, la cardinalité et les problèmes de qualité des données avant toute analyse."
module: "eda-framework"
order: 2
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Profiler la structure, les dimensions et les types de colonnes d'un jeu de données en moins de 2 minutes"
  - "Détecter les valeurs manquantes, les doublons, les colonnes constantes et les caractéristiques à cardinalité élevée"
  - "Utiliser pandas-profiling ou le profilage manuel pour générer un rapport complet de qualité des données"
  - "Documenter les constats du profilage comme fondement de l'analyse à venir"
prerequisites: ["01-framing-questions"]
tags: ["eda", "profilage", "qualité-des-données", "pandas"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Vous constatez que 40 % des valeurs d'une colonne sont manquantes. Que devriez-vous faire d'abord ?"
    options:
      - text: "Supprimer toutes les lignes avec des valeurs manquantes"
      - text: "Les combler avec la moyenne"
      - text: "Enquêter pour savoir si l'absence de données est aléatoire ou systématique"
        correct: true
      - text: "Supprimer complètement la colonne"
  - question: "Une colonne a 10 000 lignes et seulement 1 valeur unique. Qu'est-ce que cela signifie ?"
    options:
      - text: "C'est une colonne à cardinalité élevée"
      - text: "C'est une colonne constante sans valeur analytique"
        correct: true
      - text: "Elle doit être imputée"
      - text: "C'est la colonne la plus importante"
  - question: "Quelle est la première étape du profilage d'un jeu de données ?"
    options:
      - text: "Commencer à construire des modèles"
      - text: "Vérifier la forme, les dtypes et head du DataFrame"
        correct: true
      - text: "Supprimer toutes les valeurs manquantes"
      - text: "Normaliser toutes les colonnes numériques"
---
Le profilage est l'évaluation systématique d'un jeu de données avant le début de toute analyse. Il répond aux questions de base : combien de lignes ? Quelles colonnes ? Lesquelles sont incomplètes ? Lesquelles sont redondantes ? Cette leçon enseigne un flux de travail de profilage reproductible qui détecte les problèmes de qualité des données avant qu'ils ne corrompent vos résultats.

## Concepts clés

### Le profil en 60 secondes

Lorsque vous chargez un jeu de données pour la première fois, exécutez cette séquence pour vous repérer :

```python
import pandas as pd

df = pd.read_csv("students-performance.csv")

# 1. Shape — how much data do we have?
print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")

# 2. Column names and types
print(df.dtypes)

# 3. First and last rows
df.head(3)
df.tail(3)

# 4. Basic statistics for numerical columns
df.describe()

# 5. Categorical value counts
for col in df.select_dtypes(include="object").columns:
    print(f"\n{col}:")
    print(df[col].value_counts())
```

Cela vous donne la structure, les types de données, les distributions numériques et les fréquences catégorielles, tout ce dont vous avez besoin pour décider de la suite.

### Évaluation des données manquantes

Les données manquantes sont le problème de qualité le plus courant. Détectez-les systématiquement :

```python
# Count and percentage of missing values per column
missing = df.isnull().sum()
missing_pct = (missing / len(df) * 100).round(2)
missing_report = pd.DataFrame({
    "missing_count": missing,
    "missing_pct": missing_pct
})
print(missing_report[missing_report["missing_count"] > 0])
```

Interprétez les schémas d'absence :
- **MCAR (Manquantes complètement au hasard)** : l'absence n'a aucune relation avec les autres variables, il est sûr de supprimer les lignes
- **MAR (Manquantes au hasard)** : l'absence est liée à des variables observées, elle peut être imputée
- **MNAR (Manquantes non aléatoires)** : l'absence est liée à la valeur manquante elle-même, cela nécessite une connaissance du domaine

```python
# Visualize missing data with a heatmap
import seaborn as sns
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
sns.heatmap(df.isnull(), cbar=True, yticklabels=False, cmap="viridis")
plt.title("Missing Data Pattern")
plt.tight_layout()
plt.show()
```

### Détection des doublons

Les doublons gonflent silencieusement les comptages et faussent les statistiques :

```python
# Exact duplicates
n_dupes = df.duplicated().sum()
print(f"Exact duplicate rows: {n_dupes}")

# Near-duplicates on key columns
key_cols = ["gender", "race/ethnicity", "parental level of education"]
n_near = df.duplicated(subset=key_cols).sum()
print(f"Near-duplicates on demographic columns: {n_near}")
```

### Colonnes constantes et à faible variance

Les colonnes à valeur unique ne portent aucune information :

```python
# Find constant columns
constant_cols = [col for col in df.columns if df[col].nunique() == 1]
print(f"Constant columns: {constant_cols}")

# Find near-constant columns (>95% same value)
for col in df.columns:
    top_pct = df[col].value_counts(normalize=True).iloc[0]
    if top_pct > 0.95:
        print(f"  Near-constant: {col} — {top_pct:.1%} same value")
```

### Évaluation de la cardinalité

Une cardinalité élevée (beaucoup de valeurs uniques) dans les colonnes catégorielles peut provoquer du sur-apprentissage dans les modèles et des visualisations encombrées :

```python
# Cardinality for each categorical column
cat_cols = df.select_dtypes(include="object").columns
for col in cat_cols:
    n_unique = df[col].nunique()
    print(f"{col}: {n_unique} unique values")
    if n_unique > 10:
        print(f"  WARNING: High cardinality — consider grouping")
```

### Le rapport de profilage complet

Combinez tout dans une fonction réutilisable :

```python
def profile_dataset(df, name="Dataset"):
    """Generate a complete profiling report for a DataFrame."""
    print(f"{'='*60}")
    print(f"  PROFILING REPORT: {name}")
    print(f"{'='*60}")

    # Structure
    print(f"\nSTRUCTURE")
    print(f"  Rows: {df.shape[0]:,}")
    print(f"  Columns: {df.shape[1]}")
    print(f"  Memory usage: {df.memory_usage(deep=True).sum() / 1e6:.2f} MB")

    # Types
    print(f"\nCOLUMN TYPES")
    print(df.dtypes.value_counts().to_string())

    # Missing
    missing = df.isnull().sum()
    if missing.any():
        print(f"\nMISSING VALUES")
        for col in missing[missing > 0].index:
            pct = missing[col] / len(df) * 100
            print(f"  {col}: {missing[col]:,} ({pct:.1f}%)")
    else:
        print(f"\nMISSING VALUES: None detected")

    # Duplicates
    n_dupes = df.duplicated().sum()
    print(f"\nDUPLICATES: {n_dupes} rows ({n_dupes/len(df)*100:.1f}%)")

    # Numerical summary
    num_df = df.select_dtypes(include="number")
    if not num_df.empty:
        print(f"\nNUMERICAL SUMMARY")
        print(num_df.describe().round(2).to_string())

    # Categorical summary
    cat_df = df.select_dtypes(include="object")
    if not cat_df.empty:
        print(f"\nCATEGORICAL SUMMARY")
        for col in cat_df.columns:
            n_unique = df[col].nunique()
            print(f"  {col}: {n_unique} unique values")

    print(f"\n{'='*60}")

# Usage:
# profile_dataset(df, "Students Performance")
```

## Essayez-le

Profilez le jeu de données Students Performance avec le flux de travail ci-dessus. Répondez à ces questions à partir de la seule sortie du profilage, ne tracez encore aucun graphique.

```python
import pandas as pd

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Quick profile
print("Shape:", df.shape)
print("\nDtypes:\n", df.dtypes)
print("\nMissing:\n", df.isnull().sum())
print("\nNumerical stats:\n", df.describe())
print("\nCategorical values:")
for col in df.select_dtypes(include="object").columns:
    print(f"\n{col}:")
    print(df[col].value_counts())
```

Questions à répondre :
1. Combien de lignes et de colonnes ?
2. Quelles colonnes ont des valeurs manquantes ?
3. Combien de valeurs uniques chaque colonne catégorielle possède-t-elle ?
4. Quelles sont les notes minimales et maximales en maths ?
5. Y a-t-il des colonnes constantes ou quasi constantes ?

## Points clés à retenir

- Profilez avant de tracer, un passage de profilage de 60 secondes détecte des problèmes qui feraient perdre des heures plus tard
- Les données manquantes relèvent de trois mécanismes (MCAR, MAR, MNAR) ; identifiez lequel s'applique avant de choisir une stratégie
- Les doublons et les colonnes constantes dégradent silencieusement la qualité de l'analyse
- La cardinalité compte, les catégorielles à cardinalité élevée nécessitent un regroupement avant visualisation
- Construisez une fonction de profilage réutilisable pour que chaque nouveau jeu de données reçoive le même traitement systématique

## Défi pratique

Écrivez une fonction `quick_profile(df)` qui renvoie un dictionnaire avec les clés : `shape`, `dtypes`, `missing_cols`, `duplicate_count`, `constant_cols` et `cardinality`. Testez-la sur le jeu de données Students Performance.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

```python
import pandas as pd

def quick_profile(df):
    """Return a profiling summary dictionary."""
    missing = df.isnull().sum()
    return {
        "shape": df.shape,
        "dtypes": df.dtypes.value_counts().to_dict(),
        "missing_cols": {
            col: {"count": int(missing[col]), "pct": round(missing[col] / len(df) * 100, 2)}
            for col in missing[missing > 0].index
        },
        "duplicate_count": int(df.duplicated().sum()),
        "constant_cols": [col for col in df.columns if df[col].nunique() == 1],
        "cardinality": {
            col: df[col].nunique()
            for col in df.select_dtypes(include="object").columns
        },
    }

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")
report = quick_profile(df)

for key, value in report.items():
    print(f"\n{key}:")
    if isinstance(value, dict):
        for k, v in value.items():
            print(f"  {k}: {v}")
    elif isinstance(value, list):
        print(f"  {value if value else 'None'}")
    else:
        print(f"  {value}")
```

</div>
</details>
