---

title: "Charger et explorer le Titanic"
description: "Charger le jeu de données Titanic, inspecter sa structure, comprendre chaque colonne et se préparer à l'analyse."
module: "titanic-eda"
order: 9
difficulty: "intermediate"
estimatedMinutes: 30
learningObjectives:
  - "Charger le jeu de données Titanic et inspecter sa structure"
  - "Inspecter la structure du jeu de données avec head(), info(), describe() et value_counts()"
  - "Identifier les problèmes de qualité des données : valeurs manquantes, types erronés, incohérences"
  - "Documenter les observations initiales avant le nettoyage"
prerequisites: ["groupby-aggregation"]
tags: ["pandas", "eda", "titanic", "exploration"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "Comment charger un fichier CSV avec pandas ?"
    options:
      - text: "pd.read_csv('fichier.csv')"
        correct: true
      - text: "pd.load('fichier.csv')"
      - text: "pd.open('fichier.csv')"
      - text: "pd.import_csv('fichier.csv')"
  - question: "Que montre df.head() ?"
    options:
      - text: "Les 5 dernières lignes"
      - text: "Les 5 premières lignes"
        correct: true
      - text: "Toutes les lignes"
      - text: "Uniquement les noms des colonnes"
  - question: "Comment vérifier les types de données de toutes les colonnes ?"
    options:
      - text: "df.types"
      - text: "df.dtypes"
        correct: true
      - text: "df.info.types"
      - text: "df.schema()"
---

## Le jeu de données Titanic

Le RMS Titanic a coulé le 15 avril 1912 après avoir heurté un iceberg. Ce jeu de données contient des informations sur 891 passagers, y compris la question de savoir s'ils ont survécu. C'est le jeu de données le plus utilisé pour apprendre l'analyse de données car il mêle des données numériques, catégorielles et manquantes de manière réaliste.

## Charger les données

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Premier aperçu des données

Commencez toujours par `head()` pour voir avec quoi vous travaillez :

```python
print(df.head(10))
```

Sortie :

```
   PassengerId  Survived  Pclass  \
0            1         0       3   
1            2         1       1   
2            3         1       3   
3            4         1       1   
4            5         0       3   
...

                                                Name     Sex   Age  SibSp  \
0                            Braund, Mr. Owen Harris    male  22.0      1   
1  Cumings, Mrs. John Bradley (Florence Briggs Th...  female  38.0      1   
2                             Heikkinen, Miss. Laina  female  26.0      0   
3       Futrelle, Mrs. Jacques Heath (Lily May Peel)  female  35.0      1   
4                           Allen, Mr. William Henry    male  35.0      0   

   Parch            Ticket     Fare Cabin Embarked  
0      0         A/5 21171   7.2500   NaN        S  
1      0          PC 17599  71.2833   C85        C  
2      0  STON/O2. 3101282   7.9250   NaN        S  
3      0            113803  53.1000  C123        S  
4      0            373450   8.0500   NaN        S  
```

## Comprendre chaque colonne

| Colonne | Description | Type |
|---|---|---|
| PassengerId | Identifiant unique de chaque passager | int |
| Survived | Survie (0 = Non, 1 = Oui) | int (binaire) |
| Pclass | Classe du billet (1 = 1ère, 2 = 2e, 3 = 3e) | int (ordinal) |
| Name | Nom du passager | string |
| Sex | Sexe | string (binaire) |
| Age | Âge en années | float (avec valeurs manquantes) |
| SibSp | Nombre de frères/sœurs/conjoints à bord | int |
| Parch | Nombre de parents/enfants à bord | int |
| Ticket | Numéro du billet | string |
| Fare | Tarif du passager | float |
| Cabin | Numéro de cabine | string (surtout manquant) |
| Embarked | Port d'embarquement (C, Q, S) | string (catégorielle) |

## Inspection approfondie avec info()

```python
print(df.info())
```

Sortie :

```
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 891 entries, 0 to 890
Data columns (total 12 columns):
 #   Column       Non-Null Count  Dtype  
---  ------       --------------  -----  
 0   PassengerId  891 non-null    int64  
 1   Survived     891 non-null    int64  
 2   Pclass       891 non-null    int64  
 3   Name         891 non-null    object 
 4   Sex          891 non-null    object 
 5   Age          714 non-null    float64
 6   SibSp        891 non-null    int64  
 7   Parch        891 non-null    int64  
 8   Ticket       891 non-null    object 
 9   Fare         891 non-null    float64
 10  Cabin        204 non-null    object 
 11  Embarked     889 non-null    object 
dtypes: float64(2), int64(5), object(5)
```

Observations clés :
- **Age** : 177 valeurs manquantes (20 %)
- **Cabin** : 687 valeurs manquantes (77 %) — trop pour être comblées
- **Embarked** : seulement 2 valeurs manquantes — facile à corriger

## Résumé statistique

```python
print(df.describe())
```

Cela montre le count, la moyenne, l'écart-type, le min, les quartiles et le max pour toutes les colonnes numériques. Remarquez :
- `Fare` a une large plage (0 à 512) avec un max élevé — probablement des valeurs aberrantes
- `Age` varie de 0,42 (nourrisson) à 80 ans
- `Survived` est binaire — une moyenne de 0,38 signifie que 38 % ont survécu

## Distributions catégorielles

```python
print(df["Sex"].value_counts())
# male      577
# female    314

print(df["Pclass"].value_counts().sort_index())
# 1    216
# 2    184
# 3    491

print(df["Embarked"].value_counts())
# S    644
# C    168
# Q     77
```

## Résumé des valeurs manquantes

```python
missing = df.isna().sum()
missing_pct = (missing / len(df) * 100).round(1)
print(pd.DataFrame({"count": missing, "percent": missing_pct}).query("count > 0"))
```

Sortie :

```
        count  percent
Age       177     19.9
Cabin     687     77.1
Embarked    2      0.2
```

## Observations initiales

Avant toute analyse, notez ces schémas :
1. **Écart de survie selon la classe** — la première classe avait probablement des taux de survie plus élevés
2. **Biais de genre** — la politique « les femmes et les enfants d'abord » pourrait apparaître dans les données
3. **Age manquant** — 20 % manquant, une stratégie de comblement est nécessaire
4. **Cabin inutile** — 77 % manquant, cette colonne devrait probablement être supprimée
5. **Valeurs aberrantes de Fare** — certains passagers ont payé bien plus que d'autres

## Essayez-le

Chargez le jeu de données Titanic et répondez à ces questions :
1. Combien de passagers voyageaient seuls (SibSp == 0 et Parch == 0) ?
2. Quel est l'âge moyen des passagers hommes par rapport aux femmes ?
3. Quel port d'embarquement a enregistré le taux de survie le plus élevé ?

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

alone = ((df["SibSp"] == 0) & (df["Parch"] == 0)).sum()
print(f"Traveling alone: {alone}")

print(df.groupby("Sex")["Age"].mean())

print(df.groupby("Embarked")["Survived"].mean())
```

## Points clés à retenir

- Commencez toujours une EDA par `head()`, `info()` et `describe()` pour comprendre la structure
- `value_counts()` révèle la distribution des colonnes catégorielles
- L'analyse des valeurs manquantes doit précéder toute décision de nettoyage
- Documentez vos observations — elles guident l'ensemble de votre plan d'analyse

## Défi pratique

Créez un « rapport de qualité des données » pour le jeu de données Titanic : pour chaque colonne, notez le type de données, le nombre de valeurs manquantes et un fait intéressant (par exemple, « Fare varie de 0 à 512 »). Ce rapport guidera vos étapes de nettoyage dans la prochaine leçon.
