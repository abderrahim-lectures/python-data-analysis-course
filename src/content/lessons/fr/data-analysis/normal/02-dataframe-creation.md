---

title: "Créer des DataFrames"
description: "Construire des données tabulaires bidimensionnelles à partir de dictionnaires, de listes d'enregistrements et de fichiers CSV avec les DataFrames de pandas."
module: "series-dataframe"
order: 2
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Créer un DataFrame à partir d'un dictionnaire de listes"
  - "Créer un DataFrame à partir d'une liste de dictionnaires"
  - "Lire un fichier CSV dans un DataFrame avec pd.read_csv()"
  - "Inspecter un DataFrame avec head(), info(), describe() et shape"
prerequisites: ["series-dataframe"]
tags: ["pandas", "dataframe", "csv", "inspection"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Qu'est-ce qu'un DataFrame pandas ?"
    options:
      - text: "Un tableau en 1D"
      - text: "Une structure de données étiquetée en 2D avec des colonnes"
        correct: true
      - text: "Un dictionnaire Python"
      - text: "Une requête SQL"
  - question: "Comment créer un DataFrame à partir d'un dictionnaire ?"
    options:
      - text: "pd.DataFrame({'col': [1, 2]})"
        correct: true
      - text: "pd.Table({'col': [1, 2]})"
      - text: "pd.Array({'col': [1, 2]})"
      - text: "pd.Series({'col': [1, 2]})"
  - question: "Que renvoie df.shape ?"
    options:
      - text: "Les noms des colonnes"
      - text: "(lignes, colonnes) sous forme de tuple"
        correct: true
      - text: "Les types de données"
      - text: "Les 5 premières lignes"
---

## Qu'est-ce qu'un DataFrame ?

Un **DataFrame** pandas est une structure de données bidimensionnelle étiquetée, pensez à un tableur, à une table SQL ou à un dictionnaire d'objets Series. Chaque colonne est une Series, et toutes les colonnes partagent le même index.

```python
import pandas as pd

df = pd.DataFrame({
    "Name": ["Alice", "Bob", "Carol"],
    "Age": [24, 30, 28],
    "Score": [88, 92, 79]
})
print(df)
```

Sortie :

```
    Name  Age  Score
0  Alice   24     88
1    Bob   30     92
2  Carol   28     79
```

## Créer des DataFrames à partir de différentes sources

**À partir d'un dictionnaire de listes**, chaque clé devient un nom de colonne :

```python
df = pd.DataFrame({
    "City": ["Lagos", "Nairobi", "Cairo"],
    "Population": [15_400_000, 4_400_000, 20_900_000],
    "Country": ["Nigeria", "Kenya", "Egypt"]
})
```

**À partir d'une liste de dictionnaires**, chaque dictionnaire est une ligne :

```python
records = [
    {"Name": "Alice", "Score": 88},
    {"Name": "Bob", "Score": 92},
    {"Name": "Carol", "Score": 79},
]
df = pd.DataFrame(records)
```

**À partir d'une Series**, plusieurs Series se combinent en colonnes :

```python
names = pd.Series(["Alice", "Bob", "Carol"])
scores = pd.Series([88, 92, 79])
df = pd.DataFrame({"Name": names, "Score": scores})
```

## Lire des fichiers CSV

La façon la plus courante de charger des données réelles est de partir d'un fichier CSV :

```python
df = pd.read_csv("titanic.csv")
```

Paramètres utiles pour `read_csv()` :

```python
df = pd.read_csv(
    "data.csv",
    index_col="id",        # use 'id' column as the index
    usecols=["name", "age", "fare"],  # load only these columns
    na_values=["?", ""],   # treat '?' and empty strings as NaN
    dtype={"age": "float"} # force column type
)
```

Pour ce cours, nous utiliserons le jeu de données Titanic, disponible à l'adresse suivante :

```python
# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Inspecter vos données

Après avoir chargé les données, inspectez-les toujours d'abord :

```python
df.head()        # first 5 rows
df.tail(3)       # last 3 rows
df.shape          # (rows, columns) — e.g. (891, 12)
df.info()         # column names, non-null counts, dtypes
df.describe()     # statistical summary of numeric columns
```

La méthode `info()` est particulièrement importante, elle révèle les valeurs manquantes et les types de données :

```
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 891 entries, 0 to 890
Data columns (total 12 columns):
 #   Column    Non-Null Count  Dtype  
---  ------    --------------  -----  
 0   PassengerId  891 non-null   int64  
 1   Survived     891 non-null   int64  
 2   Pclass       891 non-null   int64  
 3   Name         891 non-null   object 
 4   Age          714 non-null   float64
 5   SibSp        891 non-null   int64  
 ...
```

Remarquez que `Age` n'a que 714 valeurs non-null sur 891, cela signifie 177 valeurs manquantes. Nettoyer ces données est une compétence essentielle que vous apprendrez plus tard.

## Accès aux colonnes

Une fois que vous avez un DataFrame, vous pouvez accéder aux colonnes sous forme de Series :

```python
print(df["Age"])       # returns a Series
print(df.Age)          # dot notation also works (if column name has no spaces)
```

Sélectionnez plusieurs colonnes en passant une liste :

```python
df[["Name", "Age"]]
```

## Essayez-le

Créez un DataFrame représentant trois employés avec des colonnes pour le Nom, le Département et le Salaire. Affichez le DataFrame, puis affichez uniquement les colonnes Nom et Salaire.

```python
import pandas as pd

employees = pd.DataFrame({
    "Name": ["Amina", "Kofi", "Zara"],
    "Department": ["Engineering", "Marketing", "Engineering"],
    "Salary": [95000, 72000, 88000]
})
print(employees)
print(employees[["Name", "Salary"]])
```

## Points clés à retenir

- Un DataFrame est une table avec des lignes étiquetées (index) et des colonnes étiquetées
- Les dictionnaires de listes et les listes de dictionnaires sont les méthodes de construction les plus courantes
- `pd.read_csv()` charge des données externes, utilisez `index_col`, `usecols` et `na_values` pour un contrôle précis
- Inspectez toujours les nouvelles données avec `head()`, `info()` et `describe()` avant d'analyser

## Défi pratique

Chargez le jeu de données Titanic depuis l'URL ci-dessus. Combien de lignes et de colonnes possède-t-il ? Quels sont les noms des colonnes ? Combien de colonnes contiennent des valeurs manquantes ? Utilisez `info()` pour le découvrir.
