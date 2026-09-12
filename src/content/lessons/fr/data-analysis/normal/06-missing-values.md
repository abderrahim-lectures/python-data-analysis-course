---

title: "Gérer les valeurs manquantes"
description: "Détecter, supprimer et combler les valeurs manquantes avec isna(), dropna() et fillna() pour préparer les données à l'analyse."
module: "data-cleaning"
order: 6
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Détecter les valeurs manquantes avec isna() et notna()"
  - "Supprimer des lignes ou colonnes contenant des valeurs manquantes avec dropna()"
  - "Combler les valeurs manquantes avec des nombres spécifiques, des statistiques ou des stratégies via fillna()"
  - "Choisir la bonne stratégie pour gérer les données manquantes"
prerequisites: ["selection-filtering"]
tags: ["pandas", "valeurs-manquantes", "nettoyage", "fillna"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Comment vérifier la présence de valeurs manquantes dans un DataFrame ?"
    options:
      - text: "df.isnull()"
        correct: true
      - text: "df.missing()"
      - text: "df.hasna()"
      - text: "df.nodata()"
  - question: "Que fait df.dropna() ?"
    options:
      - text: "Comble les valeurs manquantes avec 0"
      - text: "Supprime les lignes contenant des valeurs manquantes"
        correct: true
      - text: "Supprime les colonnes contenant des valeurs manquantes"
      - text: "Compte les valeurs manquantes"
  - question: "Comment combler les valeurs manquantes avec la moyenne de la colonne ?"
    options:
      - text: "df.fillna(0)"
      - text: "df.fillna(df.mean())"
        correct: true
      - text: "df.replace(nan, mean)"
      - text: "df.mean().fill()"
---

## Pourquoi les valeurs manquantes sont importantes

Presque tous les jeux de données réels contiennent des valeurs manquantes. Si vous les ignorez, les agrégations renvoient NaN, les visualisations échouent et les modèles de machine learning tombent en panne. La première étape de toute analyse consiste à comprendre et traiter les données manquantes.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Détecter les valeurs manquantes

**Vérifier une colonne unique :**

```python
print(df["Age"].isna().sum())   # 177 missing Age values
```

**Vérifier toutes les colonnes d'un coup :**

```python
print(df.isna().sum())
```

Sortie :

```
PassengerId      0
Survived         0
Pclass           0
Name             0
Sex              0
Age            177
SibSp            0
Parch            0
Ticket           0
Fare             0
Cabin          687
Embarked         2
dtype: int64
```

**Voir le pourcentage manquant :**

```python
print((df.isna().sum() / len(df) * 100).round(1))
```

Sortie :

```
Cabin          77.1%
Age            19.9%
Embarked        0.2%
...
```

Cabin est manquant à 77 %, trop pour être comblé de manière pertinente. Age est manquant à 20 %, cela vaut la peine de tenter de le combler. Embarked n'a que 2 valeurs manquantes, facile à gérer.

## Supprimer les valeurs manquantes

**Supprimer les lignes avec des valeurs manquantes :**

```python
df_clean = df.dropna()
print(df_clean.shape)   # (183, 12) — lost most rows
```

C'est trop agressif pour la plupart des jeux de données. Vous perdez 708 lignes sur 891.

**Supprimer les lignes où toutes les valeurs sont manquantes :**

```python
df_clean = df.dropna(how="all")
```

**Supprimer les lignes manquant de valeurs dans des colonnes spécifiques :**

```python
df_clean = df.dropna(subset=["Age", "Embarked"])
print(df_clean.shape)   # (712, 12) — much better
```

**Supprimer les colonnes avec trop de valeurs manquantes :**

```python
# Drop columns where more than 50% is missing
threshold = len(df) * 0.5
df_clean = df.dropna(thresh=threshold, axis=1)
```

## Combler les valeurs manquantes

**Combler avec une constante :**

```python
df["Embarked"] = df["Embarked"].fillna("S")   # most common port
```

**Combler avec une statistique :**

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
```

**Comblement vers l'avant ou vers l'arrière**, utile pour les séries temporelles :

```python
# Use the previous valid value to fill gaps
df["Price"] = df["Price"].ffill()

# Use the next valid value
df["Price"] = df["Price"].bfill()
```

**Combler avec des valeurs différentes par colonne :**

```python
fill_values = {"Age": df["Age"].median(), "Embarked": "S", "Cabin": "Unknown"}
df = df.fillna(fill_values)
```

## Choisir une stratégie

| Scénario | Stratégie |
|---|---|
| Valeurs manquantes aléatoires et peu nombreuses (< 5 %) | Supprimer avec `dropna(subset=[...])` |
| Valeurs manquantes dans une colonne numérique | Combler avec la médiane (robuste aux valeurs aberrantes) |
| Valeurs manquantes dans une colonne catégorielle | Combler avec le mode ou « Unknown » |
| Colonne manquante à plus de 50 % | Supprimer toute la colonne |
| Données de séries temporelles | Utiliser `ffill()` ou `bfill()` |

## Pièges courants

**Combler avant de diviser entraînement/test**, cela fuit des informations. Calculez les valeurs de comblement uniquement sur les données d'entraînement, puis appliquez-les aux deux ensembles.

**Supprimer trop agressivement**, vérifiez toujours combien de lignes vous perdez. `dropna()` sans arguments supprime souvent beaucoup plus que prévu.

**Oublier de vérifier**, exécutez toujours `df.isna().sum()` après le comblement pour confirmer qu'aucune valeur NaN ne subsiste.

## Essayez-le

À partir du jeu de données Titanic :
1. Calculez le pourcentage de valeurs manquantes pour chaque colonne
2. Supprimez la colonne Cabin (trop de valeurs manquantes)
3. Comblez Age avec l'âge médian
4. Comblez Embarked avec la valeur la plus courante
5. Vérifiez qu'il ne reste aucune valeur manquante

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

print((df.isna().sum() / len(df) * 100).round(1))

df = df.drop(columns=["Cabin"])
df["Age"] = df["Age"].fillna(df["Age"].median())
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

print(df.isna().sum())
```

## Points clés à retenir

- Inspectez toujours les valeurs manquantes d'abord avec `isna().sum()` avant de décider d'une stratégie
- `dropna()` est puissant mais souvent trop agressif sans `subset` ou `thresh`
- `fillna()` avec la médiane ou le mode est la stratégie de comblement la plus courante
- Les colonnes manquantes à plus de 50 % sont généralement mieux supprimées que comblées

## Défi pratique

Chargez le jeu de données Titanic et créez une version nettoyée : supprimez Cabin, comblez Age avec la médiane, comblez Embarked avec le mode. Comparez ensuite le taux de survie avant et après nettoyage. Le nettoyage a-t-il modifié le taux de survie global ? Pourquoi ou pourquoi pas ?
