---

title: "Filtrer les lignes"
description: "Utiliser des conditions booléennes pour ne conserver que les lignes qui correspondent à vos critères dans un DataFrame pandas."
module: "selection-filtering"
order: 4
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Filtrer des lignes à l'aide d'une condition booléenne unique"
  - "Combiner plusieurs conditions avec les opérateurs & et |"
  - "Utiliser .isin() et .between() pour les schémas de filtrage courants"
  - "Filtrer avec des méthodes de chaîne à l'aide de l'accesseur .str"
prerequisites: ["series-dataframe", "selecting-columns"]
tags: ["pandas", "filtrage", "booléen", "conditions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Comment filtrer les lignes où age > 30 ?"
    options:
      - text: "df.filter(age > 30)"
      - text: "df[df.age > 30]"
        correct: true
      - text: "df.where('age > 30')"
      - text: "df.select(age > 30)"
  - question: "Que renvoie df[df.age > 30] ?"
    options:
      - text: "Une Series"
      - text: "Un DataFrame contenant uniquement les lignes où age > 30"
        correct: true
      - text: "Une valeur unique"
      - text: "Une liste d'indices"
  - question: "Comment filtrer avec plusieurs conditions ?"
    options:
      - text: "df[df.age > 30 and df.salary > 50000]"
      - text: "df[(df.age > 30) & (df.salary > 50000)]"
        correct: true
      - text: "df.filter(age > 30, salary > 50000)"
      - text: "df.where(age > 30 and salary > 50000)"
---

## Filtrer avec des conditions booléennes

Le filtrage vous permet de vous concentrer sur le sous-ensemble de données qui compte. Vous créez un **masque booléen** — une Series de valeurs True/False — et vous l'utilisez pour sélectionner des lignes.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

# Filter passengers older than 30
older = df[df["Age"] > 30]
print(older.shape)   # fewer rows than original 891
```

L'expression `df["Age"] > 30` produit une Series booléenne :

```
0       True
1       True
2      False
3       True
...
```

La passer à l'intérieur de `df[...]` ne conserve que les lignes où la valeur est `True`.

## Combiner des conditions

Utilisez `&` (et) et `|` (ou) pour combiner des conditions. **Chaque condition doit être entourée de parenthèses :**

```python
# Female passengers in first class
first_class_female = df[(df["Sex"] == "female") & (df["Pclass"] == 1)]
print(first_class_female.head())
```

```python
# Passengers younger than 25 OR older than 60
young_or_old = df[(df["Age"] < 25) | (df["Age"] > 60)]
print(young_or_old.shape)
```

Erreur courante : utiliser `and`/`or` au lieu de `&`/`|`. Les opérateurs `and`/`or` de Python ne fonctionnent pas élément par élément sur les Series pandas et provoqueront une erreur.

## Utiliser .isin() pour plusieurs valeurs

Lorsque vous devez comparer une liste de valeurs, utilisez `.isin()` :

```python
# Passengers who embarked from Cherbourg or Southampton
embarked_filter = df[df["Embarked"].isin(["C", "S"])]
```

```python
# Passengers in class 1 or 2
upper_classes = df[df["Pclass"].isin([1, 2])]
```

## Utiliser .between() pour les plages

La méthode `.between()` est plus propre que l'enchaînement de deux comparaisons :

```python
# Passengers aged 20 to 30 (inclusive by default)
twenties = df[df["Age"].between(20, 30)]
print(twenties.shape)
```

Cela équivaut à `df[(df["Age"] >= 20) & (df["Age"] <= 30)]` mais c'est plus lisible.

## Filtrer avec des méthodes de chaîne

L'accesseur `.str` permet d'appliquer des opérations sur les chaînes à toute une colonne :

```python
# Passengers whose name contains "Master" (a title)
masters = df[df["Name"].str.contains("Master", na=False)]
print(masters.shape)
```

```python
# Passengers whose ticket starts with "A"
a_tickets = df[df["Ticket"].str.startswith("A", na=False)]
```

Le paramètre `na=False` gère les valeurs manquantes avec élégance — sans lui, les entrées NaN provoqueraient des erreurs.

## Filtrer avec .query()

Pour les filtres complexes, `.query()` offre une alternative lisible :

```python
# Equivalent to df[(df["Age"] > 25) & (df["Survived"] == 1)]
survivors_over_25 = df.query("Age > 25 and Survived == 1")
```

Cela se lit presque comme de l'anglais et évite la syntaxe répétitive `df["colonne"]`.

## Stocker les filtres dans des variables

Pour les conditions complexes, stockez d'abord le masque booléen dans une variable :

```python
is_female = df["Sex"] == "female"
is_first_class = df["Pclass"] == 1
is_survived = df["Survived"] == 1

# Combine them
result = df[is_female & is_first_class & is_survived]
print(f"Female first-class survivors: {len(result)}")
```

Cette approche rend votre code beaucoup plus facile à lire et à déboguer.

## Essayez-le

À partir du jeu de données Titanic, filtrez pour trouver :
1. Tous les passagers qui ont payé plus de 100 de tarif
2. Toutes les passagères femmes en troisième classe
3. Tous les passagers dont le nom contient le titre « Mrs »

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

high_fare = df[df["Fare"] > 100]
print(f"High fare passengers: {len(high_fare)}")

third_class_female = df[(df["Sex"] == "female") & (df["Pclass"] == 3)]
print(f"Third-class females: {len(third_class_female)}")

mrs = df[df["Name"].str.contains("Mrs", na=False)]
print(f"Passengers with title Mrs: {len(mrs)}")
```

## Points clés à retenir

- L'indexation booléenne `df[mask]` est le principal mécanisme de filtrage dans pandas
- Utilisez `&` pour ET, `|` pour OU — entourez toujours les conditions individuelles de parenthèses
- `.isin()` compare une liste ; `.between()` gère proprement les plages
- `.str.contains()` filtre par correspondance de sous-chaîne — utilisez `na=False` par sécurité

## Défi pratique

À partir du jeu de données Titanic, trouvez tous les passagers qui : (1) étaient de sexe masculin, (2) voyageaient en deuxième ou troisième classe, (3) avaient entre 18 et 35 ans, et (4) ont survécu. Combien de passagers satisfont les quatre conditions ?
