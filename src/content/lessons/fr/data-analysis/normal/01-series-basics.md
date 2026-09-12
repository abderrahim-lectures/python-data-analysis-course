---

title: "Créer des Series"
description: "Construire des tableaux étiquetés unidimensionnels à partir de listes, de dictionnaires et de valeurs scalaires avec les Series de pandas."
module: "series-dataframe"
order: 1
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Créer une Series à partir d'une liste, d'un dictionnaire ou d'une valeur scalaire"
  - "Comprendre le rôle de l'index dans une Series"
  - "Accéder aux valeurs et aux indices d'une Series"
  - "Effectuer des opérations vectorisées sur les données d'une Series"
prerequisites: ["python-basics"]
tags: ["pandas", "series", "structures-de-données"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Qu'est-ce qu'une Series pandas ?"
    options:
      - text: "Un tableau de données en 2D"
      - text: "Un tableau étiqueté en 1D"
        correct: true
      - text: "Une liste Python"
      - text: "Une table SQL"
  - question: "Comment créer une Series à partir d'une liste ?"
    options:
      - text: "pd.Series([1, 2, 3])"
        correct: true
      - text: "pd.array([1, 2, 3])"
      - text: "pd.List([1, 2, 3])"
      - text: "pd.DataFrame([1, 2, 3])"
  - question: "Que vous indique s.dtype ?"
    options:
      - text: "La longueur de la Series"
      - text: "Le type de données de chaque élément"
        correct: true
      - text: "La somme de toutes les valeurs"
      - text: "Les étiquettes de l'index"
---

## Qu'est-ce qu'une Series ?

Une **Series** pandas est un tableau unidimensionnel étiqueté. Considérez-la comme une seule colonne d'un tableur, chaque valeur possède une étiquette (l'index) et les données peuvent être de n'importe quel type : entiers, flottants, chaînes de caractères, ou même des objets Python.

```python
import pandas as pd

scores = pd.Series([88, 92, 75, 81])
print(scores)
```

Sortie :

```
0    88
1    92
2    75
3    81
dtype: int64
```

La colonne de gauche est l'**index** (0, 1, 2, 3 par défaut). La colonne de droite constitue les données. Ensemble, elles forment une Series.

## Créer des Series à partir de différentes sources

**À partir d'une liste**, l'index prend par défaut une plage d'entiers :

```python
temperatures = pd.Series([22.5, 24.1, 19.8, 26.3])
print(temperatures)
```

**À partir d'un dictionnaire**, les clés deviennent l'index :

```python
population = pd.Series({
    "Lagos": 15_400_000,
    "Cairo": 20_900_000,
    "Johannesburg": 5_600_000,
})
print(population)
```

Sortie :

```
Lagos           15400000
Cairo           20900000
Johannesburg     5600000
dtype: int64
```

**À partir d'un scalaire**, une valeur unique est répétée pour remplir l'index :

```python
zeros = pd.Series(0, index=["a", "b", "c", "d"])
print(zeros)
```

## Accéder aux valeurs

Utilisez l'index pour récupérer des valeurs. Avec un index étiqueté, vous pouvez utiliser la notation entre crochets ou l'accès par point :

```python
print(population["Cairo"])           # 20900000
print(population[["Lagos", "Johannesburg"]])  # subset with multiple labels
```

Avec un index entier, vous pouvez découper comme une liste :

```python
print(scores[1:3])   # select index 1 and 2
```

## Opérations vectorisées

Les Series prennent en charge les opérations élément par élément sans boucles :

```python
celsius = pd.Series([22, 25, 18, 30])
fahrenheit = celsius * 9 / 5 + 32
print(fahrenheit)
```

Sortie :

```
0    71.6
1    77.0
2    64.4
3    86.0
dtype: float64
```

Les opérateurs de comparaison renvoient une Series booléenne :

```python
print(celsius > 24)
```

Sortie :

```
0    False
1     True
2    False
3     True
dtype: bool
```

## Attributs et méthodes utiles des Series

| Attribut/Méthode | Description |
|---|---|
| `.values` | Renvoie le tableau NumPy sous-jacent |
| `.index` | Renvoie l'objet index |
| `.dtype` | Renvoie le type de données |
| `.shape` | Renvoie un tuple `(n,)` |
| `.mean()`, `.sum()`, `.max()` | Méthodes d'agrégation |
| `.value_counts()` | Compte les valeurs uniques |

```python
print(scores.mean())       # 84.0
print(scores.max())        # 92
print(scores.shape)        # (4,)
```

## Essayez-le

Créez une Series nommée `grades` avec les notes d'étudiants suivantes : Alice : 87, Bob : 92, Carol : 78, David : 95. Affichez la Series, puis calculez et affichez la note moyenne. Enfin, créez une Series booléenne qui montre quels étudiants ont obtenu plus de 85.

```python
import pandas as pd

grades = pd.Series({"Alice": 87, "Bob": 92, "Carol": 78, "David": 95})
print(grades)
print(f"Mean: {grades.mean()}")
print(grades > 85)
```

## Points clés à retenir

- Une Series est un tableau unidimensionnel étiqueté, le fondement de pandas
- L'index fournit des étiquettes pour accéder aux données et les découper
- Les opérations vectorisées vous permettent de transformer des colonnes entières sans boucles
- Les dictionnaires sont une source naturelle de Series avec des étiquettes significatives

## Défi pratique

Vous disposez d'un dictionnaire représentant les précipitations mensuelles en millimètres : `{"Jan": 45, "Feb": 38, "Mar": 52, "Apr": 61, "May": 48, "Jun": 35}`. Créez une Series à partir de celui-ci, puis calculez le total des précipitations et les précipitations mensuelles moyennes. Quel mois a enregistré le plus de pluie ? Lequel en a enregistré le moins ?
