---

title: "loc et iloc"
description: "Accéder à des lignes et colonnes spécifiques avec loc basé sur les étiquettes et iloc basé sur les positions, pour une sélection précise des données."
module: "data-cleaning"
order: 5
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Utiliser loc pour sélectionner des lignes et colonnes par étiquette"
  - "Utiliser iloc pour sélectionner des lignes et colonnes par position entière"
  - "Combiner la sélection de lignes et de colonnes dans une seule opération"
  - "Utiliser loc pour l'affectation et l'édition ciblées"
prerequisites: ["selection-filtering"]
tags: ["pandas", "loc", "iloc", "indexation"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Quelle est la différence entre loc et iloc ?"
    options:
      - text: "loc utilise des étiquettes, iloc utilise des positions entières"
        correct: true
      - text: "loc est plus rapide que iloc"
      - text: "iloc utilise des étiquettes, loc utilise des positions"
      - text: "Il n'y a aucune différence"
  - question: "Comment sélectionner les 3 premières lignes avec iloc ?"
    options:
      - text: "df.iloc[0:3]"
        correct: true
      - text: "df.iloc[0, 3]"
      - text: "df.loc[0:3]"
      - text: "df.head(3).iloc"
  - question: "Comment sélectionner une cellule spécifique avec loc ?"
    options:
      - text: "df.iloc[ligne, colonne]"
      - text: "df.loc[index, colonne]"
        correct: true
      - text: "df.get(ligne, colonne)"
      - text: "df.select(ligne, colonne)"
---

## Le problème de l'indexation entre crochets

L'indexation de base entre crochets `df[mask]` fonctionne pour filtrer des lignes et `df["col"]` pour sélectionner des colonnes. Mais lorsque vous devez sélectionner des lignes spécifiques **et** des colonnes spécifiques en une seule étape, ou modifier des cellules individuelles, vous avez besoin de `loc` et `iloc`.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## loc : sélection basée sur les étiquettes

`loc` sélectionne par **étiquette**, les étiquettes de l'index des lignes et les noms des colonnes :

```python
# Select row at index label 0, columns "Name" and "Age"
print(df.loc[0, ["Name", "Age"]])
```

Sortie :

```
Name    Braund, Mr. Owen Harris
Age                        22.0
Name: 0, dtype: object
```

**Découpe par étiquette**, l'extrémité est incluse (contrairement au découpage Python) :

```python
# Rows 0 through 4, columns Name through Age
print(df.loc[0:4, "Name":"Age"])
```

**Sélectionner toutes les lignes pour des colonnes spécifiques :**

```python
print(df.loc[:, ["Name", "Survived"]].head())
```

**Sélectionner toutes les colonnes pour des lignes spécifiques :**

```python
print(df.loc[[0, 5, 10]])
```

## iloc : sélection basée sur les positions

`iloc` sélectionne par **position entière**, le numéro de ligne/colonne en commençant par 0 :

```python
# First row, first three columns
print(df.iloc[0, :3])
```

Sortie :

```
PassengerId                            1
Survived                               0
Pclass                                 3
Name: 0, dtype: object
```

**Découpe par position**, l'extrémité est exclue (comportement Python standard) :

```python
# Rows 0-4 (5 rows), columns 0-2 (3 columns)
print(df.iloc[0:5, 0:3])
```

**Sélectionner des lignes et colonnes spécifiques :**

```python
# Rows 0, 1, 5; columns 3 (Name) and 4 (Age)
print(df.iloc[[0, 1, 5], [3, 4]])
```

## loc vs iloc : différences clés

| Caractéristique | loc | iloc |
|---|---|---|
| Sélection par | Étiquettes (noms) | Positions entières |
| Extrémité de découpe | Inclusive | Exclusive |
| Sélection de colonnes | Par nom | Par position |
| Idéal pour | Indices nommés | Index entier par défaut |

```python
# These are different:
df.loc[0:5]       # rows with labels 0 through 5 (inclusive) — 6 rows
df.iloc[0:5]      # rows at positions 0 through 4 (exclusive) — 5 rows
```

## Utiliser loc pour l'affectation

`loc` n'est pas réservé à la lecture, vous pouvez l'utiliser pour **modifier** des cellules spécifiques :

```python
# Set Age to 0 for the first passenger
df.loc[0, "Age"] = 0

# Set Fare to -1 for rows where Fare is negative
df.loc[df["Fare"] < 0, "Fare"] = 0

# Create a new column based on conditions
df.loc[df["Age"] < 18, "Category"] = "Minor"
df.loc[df["Age"] >= 18, "Category"] = "Adult"
```

Cette édition ciblée est essentielle pour le nettoyage des données.

## Schémas pratiques

**Récupérer la valeur d'une cellule spécifique :**

```python
# The name of the passenger at position 100
name = df.loc[100, "Name"]
print(name)
```

**Sélectionner une plage de colonnes :**

```python
# All rows, columns from "Name" to "Fare"
print(df.loc[:, "Name":"Fare"].head())
```

**Sélection conditionnelle sur les deux axes :**

```python
# Female passengers, only Name and Age columns
women = df.loc[df["Sex"] == "female", ["Name", "Age"]]
print(women.head())
```

## Essayez-le

À partir du jeu de données Titanic :
1. Utilisez `iloc` pour afficher les 3 premières lignes et les 4 premières colonnes
2. Utilisez `loc` pour afficher le Name et la Fare du passager à l'index 50
3. Utilisez `loc` pour mettre l'Age du passager à l'index 0 à 25

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

# First 3 rows, first 4 columns
print(df.iloc[0:3, 0:4])

# Name and Fare at index 50
print(df.loc[50, ["Name", "Fare"]])

# Set Age to 25
df.loc[0, "Age"] = 25
print(df.loc[0, "Age"])
```

## Points clés à retenir

- `loc` sélectionne par étiquette (noms) ; `iloc` sélectionne par position entière
- Les découpes `loc` sont inclusives aux deux extrémités ; les découpes `iloc` suivent la convention Python (extrémité exclue)
- `loc` prend en charge l'affectation pour l'édition ciblée de cellules
- Combiner la sélection de lignes et colonnes dans un seul appel `loc` est plus propre que l'indexation enchaînée

## Défi pratique

À partir du jeu de données Titanic, utilisez `iloc` pour extraire les lignes 100-109 et les colonnes 2-5 (de Pclass à Age). Ensuite, utilisez `loc` pour trouver les noms de tous les passagers avec les étiquettes d'index 0, 50, 100 et 500. Enfin, utilisez `loc` pour changer la Fare du passager à l'index 7 en 999 et vérifiez le changement.
