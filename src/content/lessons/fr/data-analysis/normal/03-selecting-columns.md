---

title: "Sélectionner des colonnes"
description: "Extraire une ou plusieurs colonnes d'un DataFrame à l'aide de la notation entre crochets, de l'accès par point et de loc."
module: "selection-filtering"
order: 3
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Sélectionner une colonne unique par nom avec la notation entre crochets et par point"
  - "Sélectionner plusieurs colonnes en passant une liste de noms"
  - "Utiliser loc pour sélectionner des colonnes par étiquette"
  - "Comprendre quand privilégier une méthode plutôt qu'une autre"
prerequisites: ["series-dataframe"]
tags: ["pandas", "sélection", "colonnes", "loc"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Comment sélectionner une colonne unique dans un DataFrame ?"
    options:
      - text: "df[0]"
      - text: "df.nom_de_colonne"
        correct: true
      - text: "df.get(0)"
      - text: "df.select(0)"
  - question: "Quel type retourne df['colonne'] ?"
    options:
      - text: "DataFrame"
      - text: "Series"
        correct: true
      - text: "Liste"
      - text: "Dictionnaire"
  - question: "Comment sélectionner plusieurs colonnes ?"
    options:
      - text: "df[0, 1]"
      - text: "df[['col1', 'col2']]"
        correct: true
      - text: "df.select('col1', 'col2')"
      - text: "df.get(['col1', 'col2'])"
---

## Pourquoi la sélection de colonnes est importante

Les jeux de données comptent souvent des dizaines de colonnes. La plupart des analyses se concentrent sur un sous-ensemble. Sélectionner les bonnes colonnes réduit l'utilisation de la mémoire, accélère les calculs et rend votre code plus clair.

Nous utiliserons le jeu de données Titanic tout au long de cette leçon :

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Sélectionner une colonne unique

**Notation entre crochets**, l'approche la plus courante :

```python
ages = df["Age"]
print(type(ages))   # <class 'pandas.core.series.Series'>
```

**Notation par point**, plus courte mais ne fonctionne que lorsque le nom de la colonne ne contient ni espaces ni caractères spéciaux :

```python
print(df.Age.head())   # first 5 ages
```

Les deux renvoient une **Series** (unidimensionnelle). Le nom de la colonne devient le nom de la Series, et l'index du DataFrame est conservé.

## Sélectionner plusieurs colonnes

Passez une **liste de noms de colonnes** entre crochets. Cela renvoie un **DataFrame**, et non une Series :

```python
subset = df[["Name", "Age", "Fare"]]
print(type(subset))   # <class 'pandas.core.frame.DataFrame'>
print(subset.head())
```

Sortie :

```
                                                Name   Age     Fare
0                            Braund, Mr. Owen Harris  22.0   7.2500
1  Cumings, Mrs. John Bradley (Florence Briggs Th...  38.0  71.2833
2                             Heikkinen, Miss. Laina  26.0   7.9250
3       Futrelle, Mrs. Jacques Heath (Lily May Peel)  35.0  53.1000
0                           Allen, Mr. William Henry  35.0   8.0500
```

L'ordre des colonnes dans la liste détermine leur ordre dans la sortie.

## Utiliser loc pour la sélection de colonnes

`loc` sélectionne par étiquette et peut gérer à la fois les lignes et les colonnes :

```python
# select all rows, specific columns
subset = df.loc[:, ["Name", "Survived"]]
```

`:` signifie « toutes les lignes ». La liste de noms de colonnes sélectionne des colonnes spécifiques. Cela équivaut à `df[["Name", "Survived"]]` mais devient indispensable quand on combine la sélection de lignes et de colonnes en une seule étape.

## Schémas pratiques

**Renommer après la sélection**, ne gardez que ce dont vous avez besoin avec des noms plus clairs :

```python
demographics = df[["Name", "Age", "Sex"]].copy()
demographics.columns = ["passenger", "age", "gender"]
```

**Sélectionner des colonnes par type de données**, utile lorsque vous avez beaucoup de colonnes :

```python
numeric_cols = df.select_dtypes(include=["number"])
print(numeric_cols.columns.tolist())
# ['PassengerId', 'Survived', 'Pclass', 'Age', 'SibSp', 'Parch', 'Fare']

categorical_cols = df.select_dtypes(include=["object"])
print(categorical_cols.columns.tolist())
# ['Name', 'Ticket', 'Cabin', 'Embarked']
```

**Sélectionner des colonnes contenant une sous-chaîne** :

```python
# useful for wide datasets with naming conventions
age_cols = [col for col in df.columns if "age" in col.lower()]
```

## Quand utiliser quoi

| Méthode | Renvoie | Idéale pour |
|---|---|---|
| `df["col"]` | Series | Accès à une colonne unique |
| `df[["col1", "col2"]]` | DataFrame | Plusieurs colonnes |
| `df.loc[:, cols]` | DataFrame | Combinaison sélection de lignes + colonnes |
| `df.col` | Series | Accès rapide, sans caractères spéciaux |
| `df.select_dtypes()` | DataFrame | Sélection par type |

## Essayez-le

À partir du jeu de données Titanic, sélectionnez uniquement les colonnes `Name`, `Pclass` et `Fare`. Affichez les 5 premières lignes. Ensuite, sélectionnez uniquement les colonnes numériques et affichez leurs noms.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

subset = df[["Name", "Pclass", "Fare"]]
print(subset.head())

numeric = df.select_dtypes(include=["number"])
print(numeric.columns.tolist())
```

## Points clés à retenir

- La notation entre crochets `df["col"]` est la méthode standard pour sélectionner une colonne unique
- `df[["col1", "col2"]]` renvoie un DataFrame avec plusieurs colonnes
- `loc` devient essentiel pour combiner la sélection de lignes et colonnes
- `select_dtypes()` est puissant pour sélectionner des colonnes par type de données

## Défi pratique

À partir du jeu de données Titanic, créez un nouveau DataFrame appelé `passenger_info` contenant uniquement `Name`, `Age`, `Sex` et `Survived`. Combien de lignes ont des valeurs Age manquantes dans ce sous-ensemble ? (Indice : utilisez `.isna().sum()`)
