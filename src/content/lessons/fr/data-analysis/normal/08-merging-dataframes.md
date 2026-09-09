---

title: "Fusionner des DataFrames"
description: "Combiner des jeux de données apparentés avec merge(), join() et concat() pour construire des tables d'analyse complètes."
module: "groupby-aggregation"
order: 8
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Fusionner deux DataFrames sur une clé partagée avec merge()"
  - "Comprendre les jointures inner, left, right et outer"
  - "Concaténer des DataFrames verticalement avec concat()"
  - "Gérer les conflits de fusion lorsque des colonnes portent des noms qui se chevauchent"
prerequisites: ["data-cleaning", "groupby-basics"]
tags: ["pandas", "merge", "join", "concat", "combinaison"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Qu'est-ce qu'une fusion pandas ?"
    options:
      - text: "Combiner deux DataFrames par des colonnes ou indices communs"
        correct: true
      - text: "Ajouter des lignes à un DataFrame"
      - text: "Supprimer des lignes en double"
      - text: "Trier un DataFrame"
  - question: "Quel type de fusion ne conserve que les lignes qui correspondent ?"
    options:
      - text: "outer"
      - text: "inner"
        correct: true
      - text: "left"
      - text: "right"
  - question: "Que se passe-t-il avec une fusion left si le DataFrame de droite n'a pas de correspondance ?"
    options:
      - text: "La ligne est supprimée"
      - text: "Des valeurs NaN remplissent les colonnes de droite"
        correct: true
      - text: "Une erreur se produit"
      - text: "La ligne est dupliquée"
---

## Pourquoi fusionner ?

Les analyses réelles exigent souvent des données provenant de plusieurs sources. La fusion combine deux DataFrames en fonction d'une clé partagée — comme une jointure SQL ou un RECHERCHEV dans Excel.

```python
import pandas as pd

# Create sample DataFrames
passengers = pd.DataFrame({
    "passenger_id": [1, 2, 3, 4, 5],
    "name": ["Alice", "Bob", "Carol", "David", "Eve"],
    "class": [1, 3, 2, 3, 1]
})

tickets = pd.DataFrame({
    "passenger_id": [1, 2, 3, 6],
    "fare": [100.0, 15.5, 26.0, 30.0],
    "embarked": ["S", "C", "S", "Q"]
})
```

## Fusion de base

```python
merged = pd.merge(passengers, tickets, on="passenger_id")
print(merged)
```

Sortie :

```
   passenger_id   name  class   fare embarked
0             1  Alice      1  100.0        S
1             2    Bob      3   15.5        C
2             3  Carol      2   26.0        S
```

Seuls les passagers 1, 2 et 3 apparaissent — c'est une **jointure interne** (le comportement par défaut). Les passagers 4 et 5 n'ont aucune donnée de billet ; le passager 6 n'a aucune donnée de passager.

## Types de jointure

**Jointure interne** (par défaut) — uniquement les lignes correspondantes des deux côtés :

```python
pd.merge(passengers, tickets, on="passenger_id")
```

**Jointure gauche** — conserve toutes les lignes du DataFrame de gauche :

```python
pd.merge(passengers, tickets, on="passenger_id", how="left")
```

Sortie :

```
   passenger_id   name  class   fare embarked
0             1  Alice      1  100.0        S
1             2    Bob      3   15.5        C
2             3  Carol      2   26.0        S
3             4  David      3    NaN      NaN
4             5    Eve      1    NaN      NaN
```

**Jointure droite** — conserve toutes les lignes du DataFrame de droite :

```python
pd.merge(passengers, tickets, on="passenger_id", how="right")
```

**Jointure externe** — conserve toutes les lignes des deux côtés :

```python
pd.merge(passengers, tickets, on="passenger_id", how="outer")
```

Sortie :

```
   passenger_id   name  class   fare embarked
0             1  Alice    1.0  100.0        S
1             2    Bob    3.0   15.5        C
2             3  Carol    2.0   26.0        S
3             4  David    3.0    NaN      NaN
4             5    Eve    1.0    NaN      NaN
5             6    NaN    NaN   30.0        Q
```

## Fusionner sur des noms de colonnes différents

Lorsque les colonnes clés portent des noms différents, utilisez `left_on` et `right_on` :

```python
df1 = pd.DataFrame({"id_a": [1, 2, 3], "val": ["x", "y", "z"]})
df2 = pd.DataFrame({"id_b": [1, 2, 3], "score": [10, 20, 30]})

merged = pd.merge(df1, df2, left_on="id_a", right_on="id_b")
print(merged)
```

## Gérer les noms de colonnes qui se chevauchent

Lorsque les deux DataFrames ont des colonnes portant le même nom (autre que la clé), pandas ajoute des suffixes :

```python
merged = pd.merge(passengers, tickets, on="passenger_id", suffixes=("_pass", "_tick"))
```

## Fusionner sur l'index

Si la clé est l'index, utilisez `left_index` et `right_index` :

```python
passengers_idx = passengers.set_index("passenger_id")
tickets_idx = tickets.set_index("passenger_id")

merged = pd.merge(passengers_idx, tickets_idx, left_index=True, right_index=True)
```

## Concatenation

`concat()` empile des DataFrames verticalement ou horizontalement :

**Vertical (empilement de lignes) :**

```python
df_top = pd.DataFrame({"name": ["Alice", "Bob"], "score": [88, 92]})
df_bottom = pd.DataFrame({"name": ["Carol", "David"], "score": [79, 95]})

combined = pd.concat([df_top, df_bottom], ignore_index=True)
print(combined)
```

**Horizontal (ajout de colonnes) :**

```python
df_a = pd.DataFrame({"name": ["Alice", "Bob"]})
df_b = pd.DataFrame({"score": [88, 92]})

combined = pd.concat([df_a, df_b], axis=1)
```

## Exemple pratique : les données Titanic

```python
# titanic.csv ships with the course — load it from the browser file system.
titanic = pd.read_csv("titanic.csv")

# Create a summary DataFrame
class_stats = titanic.groupby("Pclass").agg(
    avg_fare=("Fare", "mean"),
    avg_age=("Age", "median"),
    survival_rate=("Survived", "mean")
).reset_index()

print(class_stats)
```

`reset_index()` reconvertit l'index groupé en colonne normale, ce qui est nécessaire avant une fusion.

## Essayez-le

Créez deux DataFrames : `students` avec les colonnes `id`, `name` et `grades` avec les colonnes `id`, `math`, `english`. Fusionnez-les sur `id` avec une jointure gauche. Concaténez ensuite deux petits DataFrames verticalement.

```python
import pandas as pd

students = pd.DataFrame({"id": [1, 2, 3], "name": ["Alice", "Bob", "Carol"]})
grades = pd.DataFrame({"id": [1, 2, 4], "math": [88, 92, 75], "english": [90, 85, 80]})

merged = pd.merge(students, grades, on="id", how="left")
print(merged)

df1 = pd.DataFrame({"name": ["X", "Y"], "val": [1, 2]})
df2 = pd.DataFrame({"name": ["Z"], "val": [3]})
print(pd.concat([df1, df2], ignore_index=True))
```

## Points clés à retenir

- `merge()` combine des DataFrames sur des clés partagées ; `concat()` les empile verticalement ou horizontalement
- Le paramètre `how` contrôle le type de jointure : inner (par défaut), left, right, outer
- Utilisez `left_on`/`right_on` lorsque les colonnes clés portent des noms différents
- Appliquez toujours `reset_index()` après un groupby avant de fusionner

## Défi pratique

À partir du jeu de données Titanic, créez un DataFrame de synthèse groupé par Pclass avec les colonnes : Pclass, avg_fare, survival_rate, passenger_count. Créez ensuite une autre synthèse groupée par Embarked. Fusionnez ces deux synthèses sur Pclass avec une jointure gauche. Quelle information est perdue ou gagnée ?
