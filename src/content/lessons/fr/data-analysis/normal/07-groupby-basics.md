---

title: "Les bases de GroupBy"
description: "Diviser les données en groupes et calculer des synthèses avec le schéma split-apply-combine via groupby()."
module: "groupby-aggregation"
order: 7
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Comprendre le schéma split-apply-combine"
  - "Grouper les données par une ou plusieurs colonnes avec groupby()"
  - "Appliquer des agrégations comme mean(), sum(), count() et describe()"
  - "Utiliser agg() pour plusieurs agrégations à la fois"
prerequisites: ["data-cleaning"]
tags: ["pandas", "groupby", "agrégation", "split-apply-combine"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Que fait df.groupby('col') ?"
    options:
      - text: "Trie le DataFrame"
      - text: "Groupe les lignes par valeurs uniques dans la colonne"
        correct: true
      - text: "Supprime les doublons"
      - text: "Crée une nouvelle colonne"
  - question: "Comment calculer la moyenne de chaque groupe ?"
    options:
      - text: "df.groupby('col').mean()"
        correct: true
      - text: "df.mean().groupby('col')"
      - text: "df.group('col').average()"
      - text: "df.groupby('col').sum() / df.groupby('col').count()"
  - question: "Que renvoie df.groupby('col').size() ?"
    options:
      - text: "Le nombre total de lignes"
      - text: "Le nombre de lignes par groupe"
        correct: true
      - text: "La taille mémoire de chaque groupe"
      - text: "Le nombre de colonnes"
---

## Le schéma split-apply-combine

GroupBy est l'une des fonctionnalités les plus puissantes de pandas. Il suit un schéma en trois étapes :

1. **Split (diviser)** — répartir le DataFrame en groupes en fonction d'une ou plusieurs colonnes
2. **Apply (appliquer)** — calculer une fonction sur chaque groupe indépendamment
3. **Combine (combiner)** — fusionner les résultats en un seul DataFrame

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Grouper par une colonne unique

```python
# Average survival rate by passenger class
print(df.groupby("Pclass")["Survived"].mean())
```

Sortie :

```
Pclass
1    0.629630
2    0.472826
3    0.242363
Name: Survived, dtype: float64
```

Les passagers de première classe avaient un taux de survie de 63 %, contre 24 % pour la troisième classe. Groupby a révélé une différence de classe flagrante en quelques secondes.

**Ce qui se passe étape par étape :**

```python
# This is conceptually what groupby does:
for pclass, group_df in df.groupby("Pclass"):
    print(f"Class {pclass}: {group_df['Survived'].mean():.3f}")
```

## Grouper par plusieurs colonnes

```python
# Survival rate by class and sex
print(df.groupby(["Pclass", "Sex"])["Survived"].mean())
```

Sortie :

```
Pclass  Sex   
1       female    0.968085
        male      0.368852
2       female    0.921053
        male      0.157407
3       female    0.500000
        male      0.135447
Name: Survived, dtype: float64
```

Utilisez `unstack()` pour rendre cela plus lisible :

```python
print(df.groupby(["Pclass", "Sex"])["Survived"].mean().unstack())
```

## Méthodes d'agrégation

Groupby prend en charge toutes les agrégations standard :

```python
# Mean fare by class
print(df.groupby("Pclass")["Fare"].mean())

# Total fare collected per class
print(df.groupby("Pclass")["Fare"].sum())

# Count of passengers per class
print(df.groupby("Pclass")["PassengerId"].count())
```

## Plusieurs agrégations avec agg()

La méthode `agg()` applique plusieurs fonctions à la fois :

```python
print(df.groupby("Pclass")["Fare"].agg(["mean", "median", "min", "max", "count"]))
```

Sortie :

```
              mean  median     min       max  count
Pclass                                             
1        84.154687  60.287  0.0000  512.3292    216
2        20.662183  19.575  0.0000   73.5000    184
3        13.675550   8.050  0.0000   56.4958    491
```

**Différentes agrégations par colonne :**

```python
print(df.groupby("Pclass").agg({
    "Survived": "mean",
    "Fare": ["mean", "max"],
    "Age": "median",
    "Name": "count"
}))
```

## Agréger toutes les colonnes numériques

```python
# Quick summary of all numeric columns per group
print(df.groupby("Pclass").mean(numeric_only=True))
```

## GroupBy avec des filtres

Après le regroupement, vous pouvez filtrer des groupes entiers :

```python
# Keep only groups with more than 50 passengers
large_groups = df.groupby("Pclass").filter(lambda x: len(x) > 50)
print(large_groups["Pclass"].value_counts())
```

## Essayez-le

À l'aide du jeu de données Titanic, calculez :
1. Le tarif moyen pour chaque port d'embarquement
2. Le taux de survie pour chaque combinaison de sexe et de port d'embarquement
3. Les statistiques d'âge (moyenne, médiane, min, max) pour chaque classe de passagers

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

print("Average fare by port:")
print(df.groupby("Embarked")["Fare"].mean())

print("\nSurvival by sex and port:")
print(df.groupby(["Sex", "Embarked"])["Survived"].mean().unstack())

print("\nAge stats by class:")
print(df.groupby("Pclass")["Age"].agg(["mean", "median", "min", "max"]))
```

## Points clés à retenir

- GroupBy suit le schéma split-apply-combine : diviser les données, appliquer une fonction, combiner les résultats
- Groupez par une colonne pour des synthèses simples, par plusieurs colonnes pour une analyse plus approfondie
- `agg()` permet de calculer plusieurs statistiques à la fois, par colonne si besoin
- Groupby révèle des schémas invisibles dans les données brutes

## Défi pratique

À partir du jeu de données Titanic, calculez le taux de survie pour chaque combinaison de Pclass, Sex et le fait que le passager voyageait seul (SibSp + Parch == 0). Quel groupe a enregistré le taux de survie le plus élevé ? Lequel le plus faible ?
