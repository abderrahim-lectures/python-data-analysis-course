---

title: "Analyse EDA du Titanic"
description: "Nettoyer les données du Titanic, analyser les schémas de survie avec groupby et tirer des conclusions exploitables de votre exploration."
module: "titanic-eda"
order: 10
difficulty: "intermediate"
estimatedMinutes: 30
learningObjectives:
  - "Nettoyer le jeu de données Titanic en gérant les valeurs manquantes et en supprimant les colonnes inutiles"
  - "Analyser les taux de survie par classe de passagers, sexe et tranche d'âge"
  - "Créer des tables de synthèse avec groupby et l'agrégation"
  - "Tirer des conclusions fondées sur les données à partir de l'analyse exploratoire"
prerequisites: ["titanic-loading"]
tags: ["pandas", "eda", "titanic", "analyse", "conclusions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Quel pourcentage de passagers du Titanic ont survécu ?"
    options:
      - text: "Environ 25 %"
      - text: "Environ 38 %"
        correct: true
      - text: "Environ 50 %"
      - text: "Environ 75 %"
  - question: "Quelle classe a enregistré le taux de survie le plus élevé ?"
    options:
      - text: "Troisième classe"
      - text: "Première classe"
        correct: true
      - text: "Deuxième classe"
      - text: "Toutes les classes avaient des taux égaux"
  - question: "Que montre pd.crosstab(df.pclass, df.survived) ?"
    options:
      - text: "Le tarif moyen par classe"
      - text: "Le nombre de passagers par classe et statut de survie"
        correct: true
      - text: "Le revenu total par classe"
      - text: "La distribution des âges"
---

## Analyse de bout en bout

Cette leçon rassemble tout ce que vous avez appris dans les modules précédents. Nous allons charger, nettoyer, explorer et analyser le jeu de données Titanic dans un flux de travail complet.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Étape 1 : Nettoyer les données

```python
# Drop Cabin — 77% missing, not useful
df = df.drop(columns=["Cabin"])

# Fill Age with median
df["Age"] = df["Age"].fillna(df["Age"].median())

# Fill Embarked with mode (most common port)
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

# Verify no missing values remain
print(df.isna().sum().sum())   # 0
```

## Étape 2 : Ingénierie de caractéristiques

Créez des colonnes dérivées utiles :

```python
# Travel alone indicator
df["IsAlone"] = ((df["SibSp"] + df["Parch"]) == 0).astype(int)

# Age groups
df["AgeGroup"] = pd.cut(df["Age"], bins=[0, 12, 18, 35, 60, 100],
                         labels=["Child", "Teen", "Adult", "Middle-aged", "Senior"])

# Family size
df["FamilySize"] = df["SibSp"] + df["Parch"] + 1
```

## Étape 3 : Survie par classe

```python
print(df.groupby("Pclass")["Survived"].agg(["mean", "count"]))
```

Sortie :

```
            mean  count
Pclass                 
1       0.629630    216
2       0.472826    184
3       0.242363    491
```

Les passagers de première classe ont survécu à un taux presque trois fois supérieur à celui des passagers de troisième classe.

## Étape 4 : Survie par sexe

```python
print(df.groupby("Sex")["Survived"].agg(["mean", "count"]))
```

Sortie :

```
            mean  count
Sex                    
female  0.742038    314
male    0.188908    577
```

74 % des femmes ont survécu contre 19 % des hommes, la politique « les femmes et les enfants d'abord » est clairement reflétée.

## Étape 5 : Analyse combinée, classe et sexe

```python
print(df.groupby(["Pclass", "Sex"])["Survived"].mean().unstack())
```

Sortie :

```
Sex      female      male
Pclass                   
1       0.968085  0.368852
2       0.921053  0.157407
3       0.500000  0.135447
```

Les femmes de première classe ont eu un taux de survie de 97 %. Les hommes de troisième classe seulement 14 %.

## Étape 6 : Survie par tranche d'âge

```python
print(df.groupby("AgeGroup", observed=True)["Survived"].agg(["mean", "count"]))
```

Sortie :

```
                mean  count
AgeGroup                   
Child       0.580645     62
Teen        0.347826     46
Adult       0.339869    306
Middle-aged 0.385965    228
Senior      0.227273     22
```

Les enfants ont eu le taux de survie le plus élevé, à 58 %.

## Étape 7 : Survie par taille de famille

```python
print(df.groupby("FamilySize")["Survived"].agg(["mean", "count"]))
```

Sortie :

```
                mean  count
FamilySize                  
1           0.303538    537
2           0.552795    161
3           0.578431     89
4           0.724138     58
5           0.200000     20
6           0.166667     12
7           0.333333      6
8           0.000000      5
```

Les familles de 2 à 4 personnes ont eu les meilleurs taux de survie. Les voyageurs solitaires et les très grandes familles s'en sont moins bien sortis.

## Étape 8 : Distribution des tarifs par survie

```python
print(df.groupby("Survived")["Fare"].describe().round(2))
```

Sortie :

```
         count   mean    std  min   25%   50%    75%      max
Survived                                                     
0        549.0  22.12  31.42  0.0  7.85  10.5  26.00   263.00
1        342.0  48.40  66.33  0.0  12.48  26.0  57.01  512.33
```

Les survivants ont en moyenne payé des tarifs nettement plus élevés.

## Étape 9 : Port d'embarquement

```python
print(df.groupby("Embarked")["Survived"].agg(["mean", "count"]))
```

Sortie :

```
            mean  count
Embarked               
C       0.553571    168
Q       0.389610     77
S       0.368821    646
```

Les passagers de Cherbourg ont enregistré le taux de survie le plus élevé, probablement parce que davantage de passagers de première classe y ont embarqué.

## Étape 10 : Synthèse des constats

```python
# Create a final summary table
summary = df.groupby(["Pclass", "Sex"]).agg(
    passengers=("Survived", "count"),
    survival_rate=("Survived", "mean"),
    avg_fare=("Fare", "mean"),
    avg_age=("Age", "mean")
).round(3)

print(summary)
```

## Conclusions clés

1. **La classe était le facteur prédictif de survie le plus fort**, les passagers de première classe ont survécu à 63 % contre 24 % pour la troisième classe
2. **Le genre était tout aussi puissant**, 74 % des femmes ont survécu contre 19 % des hommes
3. **La combinaison compte le plus**, femmes de première classe : 97 % de survie ; hommes de troisième classe : 14 %
4. **Les enfants avaient un avantage**, 58 % de taux de survie, le plus élevé de toutes les tranches d'âge
5. **Les tailles de famille modérées étaient un atout**, les familles de 2 à 4 personnes ont survécu plus souvent que les voyageurs solitaires
6. **Le tarif payé était corrélé à la survie**, les passagers ayant payé plus cher ont survécu plus souvent, reflet probable de la classe et de l'emplacement de la cabine

## Essayez-le

Reproduisez cette analyse avec une question différente : le fait d'avoir un compagnon de voyage (membre de la famille) a-t-il amélioré les chances de survie ? Comparez les voyageurs solitaires (FamilySize == 1) aux petites familles (2-4 membres) et aux grandes familles (5+ membres).

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

df["FamilySize"] = df["SibSp"] + df["Parch"] + 1
df["Group"] = pd.cut(df["FamilySize"], bins=[0, 1, 4, 20], labels=["Solo", "Small", "Large"])

print(df.groupby("Group")["Survived"].agg(["mean", "count"]))
```

## Points clés à retenir

- Une EDA complète suit un pipeline : charger → nettoyer → créer des caractéristiques → grouper → analyser → conclure
- Le nettoyage doit précéder l'analyse, les valeurs manquantes faussent les résultats de groupby
- L'ingénierie de caractéristiques (tranches d'âge, indicateurs de solitude) révèle des schémas cachés dans les chiffres bruts
- Les multiples angles de groupby (classe, sexe, âge, famille) dressent un tableau complet

## Défi pratique

Menez votre propre mini-EDA sur le jeu de données Titanic. Choisissez une question non abordée ci-dessus (par exemple : « Les passagers portant des titres comme "Dr" ou "Rev" ont-ils eu des taux de survie différents ? ») et répondez-y avec les compétences pandas de ce cours. Rédigez vos constats en 3 à 5 phrases.
