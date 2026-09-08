---
title: "Nettoyeur de Données IA"
description: "Détectez et corrigez automatiquement les problèmes de qualité des données — valeurs manquantes, outliers, doublons et erreurs de format."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Data Visualization", "Developer Tools", "Pandas"]
prerequisites:
  - "Bases de Python (variables, boucles, fonctions, dictionnaires)"
  - "Analyse de Données avec pandas (charger un CSV, filtrer des lignes, sélectionner des colonnes)"
learningObjectives:
  - "Profiler un DataFrame pour les valeurs manquantes, les lignes en double et les types incohérents sans le modifier"
  - "Concevoir un pipeline de transformations documenté où chaque changement est enregistré, pas seulement appliqué"
  - "Choisir des stratégies de remplissage sensées pour les colonnes numériques par rapport aux colonnes de texte"
  - "Détecter les valeurs aberrantes avec la règle IQR et les plafonner au lieu de supprimer des données"
  - "Normaliser les dates et les chaînes pour que les valeurs se comparent proprement"
  - "Construire un pipeline de nettoyage complet qui retourne un DataFrame propre plus un résumé d'audit"
---


# 🛠️ 🐼 Construire un Nettoyeur de Données IA

Tout analyste a déjà rencontré le même jeu de données : des lignes en double, des cellules vides, une colonne `price` où une valeur vaut `"2.5 USD"` et une autre vaut `2.5`, et une date de commande où certaines lignes disent `2024-01-05` et certaines disent `05/01/2024`. Ces problèmes cachent du vrai signal et cassent les outils en aval de façon confuse. Ce projet construit un nettoyeur de données en ligne de commande qui prend un CSV en désordre, trouve ces problèmes automatiquement, applique la bonne correction par colonne et — la partie qui le rend digne de confiance — enregistre chaque changement dans une trace d'audit que tu peux lire comme un reçu.

Cela suppose Python 101 et les bases de pandas du module Analyse de Données — rien au-delà. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Profiler un CSV en désordre avec pandas et produire un rapport de qualité couvrant les valeurs manquantes, les doublons et les problèmes de type — sans modifier les données.
2. Supprimer les lignes en double et prouver exactement combien de lignes ont disparu.
3. Remplir les valeurs manquantes avec une stratégie choisie par colonne (médiane pour les nombres, mode pour le texte) et journaliser la décision.
4. Trouver les valeurs aberrantes avec la règle IQR et les plafonner dans un corridor raisonnable.
5. Normaliser les dates et les chaînes pour que `2.5 USD` et `2.5` se comparent enfin à égalité.
6. Assembler le tout dans une fonction `clean_dataset()` qui retourne un DataFrame propre plus un dict d'audit lisible.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — le nettoyeur est un script pandas déterministe et le flux de travail principal consiste à l'exécuter contre des fichiers CSV présents sur ton propre disque, donc un vrai environnement Python avec pandas installé est exactement le bon endroit pour lui. La section Configuration ci-dessous passe en revue `uv` et un environnement virtuel.

**GitHub Codespaces** fonctionne bien aussi : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — pandas et `uv` sont déjà installés, et chaque étape ci-dessous s'exécute sans changement.

**Google Colab, Kaggle Notebooks et Binder sont un moyen réellement bon d'exécuter ceci** — contrairement aux projets qui ont besoin d'un dépôt git local ou d'un état de vrai système de fichiers, un nettoyeur de données n'a besoin que d'un CSV en mémoire. Le notebook ci-dessous construit un petit DataFrame volontairement en désordre pour que chaque détection et correction s'exécute pour de vrai ; utilise un notebook pour expérimenter rapidement, puis passe au `uv` local quand tu veux pointer l'outil vers de vrais fichiers `.csv` sur ta machine.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-data-cleaner/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-data-cleaner/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-data-cleaner%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant une ligne du nettoyeur lui-même : un environnement Python avec pandas, et un CSV volontairement en désordre à pointer.

### Mets en place le projet

```bash
uv init ai-data-cleaner
cd ai-data-cleaner
uv add pandas
```

`uv` installe Python pour toi, crée le projet et ajoute pandas à son environnement virtuel — une chaîne de commandes unique au lieu du tour habituel « installe Python, installe pip, crée un venv, pip install ».

### Crée un CSV en désordre pour tester

Esquisse un petit fichier avec les problèmes que l'outil existe pour attraper — colle ceci dans `messy.csv` :

```csv
order_id,customer,units,price,order_date
1,  alice ,2,2.50,2024-01-05
2,alice,,,05/01/2024
1,  alice ,2,2.50,2024-01-05
3,bob,10,2.5 USD,2024-02-01
4,carol,0,1.00,2024-01-31
5,dave,2,0.75,2024/03/15
5,dave,2,0.75,2024/03/15
2,alice,2,3.50,05/01/2024
6,erin,2,4.00,2024-03-20
7,frank,2,3.50,2024-03-22
8,grace,,2.25,2024-03-25
9,henry,1000,9.99,2024-04-01
```

Ce seul fichier contient chaque mode de défaillance que le pipeline gère : deux lignes en double exactes, deux valeurs `units` manquantes, un `price` manquant, un espace blanc dans un nom de client, un `price` écrit sous trois formats différents, un `order_id` en double avec des détails différents (un doublon presque-réussi), une commande impossible à zéro unité, une valeur aberrante extrême et des dates sous trois formats.

**✅ Liste de vérification**

- ✅ `uv add pandas` se termine sans erreurs.
- ✅ `messy.csv` existe dans ton dossier de projet et a les treize lignes (en-tête plus douze lignes de données) montrées ci-dessus.

## Étape 1 : Profile le jeu de données sans le toucher

La première passe de tout script de nettoyage doit être *en lecture seule* — tu ne peux pas faire confiance aux corrections d'un outil tant qu'il ne peut pas décrire ce qui ne va pas, et tu ne peux pas décrire ce qui ne va pas dans un jeu de données que tu as déjà mutilé. Le profilage charge le CSV, puis parcourt colonne par colonne en posant trois questions : combien de valeurs sont manquantes, combien de lignes sont des doublons exacts, et quel dtype chaque colonne tient réellement.

### 1.1 Charge et évalue la taille des données

**👟 Indice de départ :** Charge `messy.csv` dans `df`, affiche sa forme, ses dtypes, le nombre de valeurs manquantes par colonne et son nombre de lignes en double — que des lectures, aucune écriture.

```python
# clean.py
import pandas as pd

df = pd.read_csv("messy.csv")
print("shape:", df.shape)
print("\ndtypes:\n", df.dtypes)
print("\nmissing per column:\n", df.isna().sum())
print("\nduplicate rows:", df.duplicated().sum())
print("\nfirst 3 rows:\n", df.head(3))
```

`df.isna().sum()` retourne un décompte par colonne des cellules manquantes et `df.duplicated().sum()` compte les lignes qui répètent exactement une ligne précédente — ce sont toutes deux de pures lectures qui produisent les nombres sur lesquels le pipeline agira. Le `head(3)` sur un DataFrame en désordre est l'habitude qui attrape les problèmes avant même les nombres : dans celui-ci, tu peux déjà voir `price` contenir du texte et un nom avec des espaces de tête.

**🎯 Résultat attendu :** Un rapport imprimé montrant `shape: (12, 5)`, `price` typé comme `object` (pas numérique) à cause de la ligne `"2.5 USD"`, exactement deux valeurs manquantes dans `units`, une valeur manquante dans `price`, et `duplicate rows: 2`.

**🩹 Si ça ne marche pas :** Si `price` s'affiche comme `int64`/`float64`, quelqu'un a édité le CSV à la main et a retiré la ligne `"2.5 USD"` sur laquelle la sonde s'appuie. Si `df` échoue complètement à charger, le CSV a un commentaire `#` ou une ligne d'en-tête parasite — ouvre `messy.csv` et vérifie que les deux premières lignes correspondent exactement à l'esquisse d'en-tête.

### 1.2 Transforme le profil en dict de rapport

**👟 Indice de départ :** Étends le script avec `profile(df)` qui retourne un dictionnaire décrivant les problèmes de chaque colonne, pour que les étapes suivantes (et la trace d'audit) puissent lire les constats comme des données plutôt que comme du texte de terminal.

```python
# clean.py (continued)
from typing import Any

import pandas as pd

def profile(df: pd.DataFrame) -> dict[str, dict[str, Any]]:
    report: dict[str, dict[str, Any]] = {}
    for col in df.columns:
        report[col] = {
            "dtype": str(df[col].dtype),
            "missing": int(df[col].isna().sum()),
            "n_unique": int(df[col].nunique()),
            "issues": [],
        }
        if df[col].dtype == object:
            non_blank = df[col].dropna().astype(str)
            if non_blank.str.strip().ne(non_blank).any():
                report[col]["issues"].append("leading/trailing whitespace")
    return report

print(profile(df))
```

Le rapport cesse de décrire les problèmes en prose et commence à les décrire comme des données — chaque fonction suivante peut consommer `report[col]["missing"]` et décider quoi faire. La vérification d'espace blanc est la subtile : `.str.strip().ne(elle-même)` est vrai pour toute valeur qui change quand les espaces environnants sont retirés.

**🎯 Résultat attendu :** `profile(df)` retourne un dict dans lequel `price` liste `dtype: object`, `units` liste `missing: 2`, et `customer` liste `leading/trailing whitespace` dans sa liste d'issues.

**🩹 Si ça ne marche pas :** Si aucune colonne ne signale d'espace blanc, le CSV a été réenregistré avec des guillemets autour des valeurs et les espaces de fin sont devenus partie du texte — vérifie les valeurs de `df["customer"]` directement avec `.repr()`. Si une colonne numérique s'affiche comme `object`, au moins une cellule contient une chaîne ; la bonne correction est de décider quoi faire de cette chaîne, pas de forcer le cast pour l'instant.

### 1.3 Vérifie le profil

**✅ Liste de vérification**

- ✅ `df.shape` se lit `(12, 5)` et `df.duplicated().sum()` se lit `2`.
- ✅ `units` signale deux valeurs manquantes, `price` signale une valeur manquante et un dtype `object`.
- ✅ `profile(df)` retourne ses constats sous forme d'un dictionnaire que le code suivant peut lire.
- ✅ Aucun avertissement de pandas concernant les `mixed types` au chargement — c'est ton premier signal de dérive.

**🤔 Question(s) socratique(s)**

- Pourquoi commencer délibérément par un profil en lecture seule plutôt que de corriger au fur et à mesure ? Quelle information précise un script qui corrige tout à la hâte détruit-il avant qu'elle puisse être enregistrée ?
- `profile()` signale `n_unique` pour chaque colonne. Que te dirait une colonne `customer` avec `n_unique` égal à 6 (son nombre de lignes) que `duplicated().sum()` seul pourrait manquer ? Indice : pense à ce à quoi ressemble `customer` après la correction des espaces blancs.

## Étape 2 : Supprime les doublons — et compte ce que tu as retiré

Les doublons sont le problème le moins cher à corriger, et celui que les gens corrigent le plus souvent à la main (« laisse-moi juste supprimer les répétitions évidentes »). La version du pipeline est meilleure qu'une passe manuelle parce qu'elle enregistre le compte, pour que quiconque audite le résultat sache que des données ont été retirées — une transparence qu'une édition manuelle d'un tableur ne te donne jamais.

### 2.1 Supprime les doublons exacts avec un reçu

**👟 Indice de départ :** `df.drop_duplicates()` une seule fois, mais capture le compte-avant moins le compte-après dans la trace d'audit avant que le DataFrame ne soit muté.

```python
# clean.py
import pandas as pd

def drop_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    before = len(df)
    df = df.drop_duplicates()
    removed = before - len(df)
    return df, {"action": "drop_duplicates", "removed_rows": removed, "before": before, "after": len(df)}

df = pd.read_csv("messy.csv")
df, audit = drop_duplicates(df)
print(audit)
print("rows now:", len(df))
```

`drop_duplicates()` garde la première occurrence de chaque ligne répétée par défaut — déterministe, ce qui compte, parce que la trace d'audit prétend un nombre spécifique de lignes retirées. Capturer `before` et `after` autour de l'appel transforme « je pense avoir retiré quelques-unes » en un compte exact et prouvable.

**🎯 Résultat attendu :** Le dict d'audit signale `removed_rows: 2`, et `rows now:` se lit `10`. Les deux lignes précédemment signalées par `duplicated()` (la répétition de `order_id` 1 et la répétition de `order_id` 5) ont disparu et le DataFrame a toujours la première copie de chacune.

**🩹 Si ça ne marche pas :** Si `removed_rows` se lit `0`, tes lignes en double diffèrent par un caractère invisible (un espace de fin sur l'une d'elles) — la normalisation d'espaces blancs de l'Étape 5 doit s'exécuter *avant* la passe des doublons sur des données que tu n'as pas écrites. Si la ligne 3 (la répétition de `1, alice, 2, 2.50`) survit, les valeurs diffèrent encore quelque part — imprime `df.iloc[[0, 2]]` ligne par ligne pour repérer la différence exacte.

### 2.2 Réfléchis à ce que « doublon » signifie

**👟 Indice de départ :** Explore une vérification de doublon *partielle* — `df.drop_duplicates(subset=["order_id"])` — et compare son compte de retraits au compte de doublons exacts.

```python
# clean.py (continued)
df_partial = pd.read_csv("messy.csv")
print("exact duplicates:", df_partial.duplicated().sum())
print("duplicates by order_id only:", df_partial.duplicated(subset=["order_id"]).sum())
```

`subset=[...]` change la définition du doublon de « chaque colonne égale » à « les colonnes clés égales ». Les deux nombres sont presque toujours en désaccord, et choisir la bonne définition est une décision métier, pas une décision de code : uniquement-exact est sûr, uniquement-clé est agressif et peut supprimer deux clients différents qui partagent un même ID.

**🎯 Résultat attendu :** Le compte exact s'imprime `2` ; le compte par sous-ensemble `order_id` s'imprime `3` (les lignes 2, 3 et 8 sont toutes des répétitions d'un `order_id` existant), ce qui est plus de lignes qu'un humain n'était probablement prêt à supprimer.

**🩹 Si ça ne marche pas :** Si le compte du sous-ensemble égale le compte exact, revois le CSV pour un quatrième `order_id` que tu n'avais pas prévu. Si l'approche par sous-ensemble supprime plus que ce avec quoi tu es à l'aise, cette réaction est le propos — opte pour `keep="last"` ou une règle explicite quand les données valent plus que le raccourci.

### 2.3 Vérifie la passe de suppression des doublons

**✅ Liste de vérification**

- ✅ La suppression des doublons exacts retire exactement 2 lignes et enregistre `removed_rows: 2` dans un dict d'audit.
- ✅ Tu peux expliquer ce qui change quand `subset=["order_id"]` est utilisé, et pourquoi c'est plus agressif.
- ✅ La trace d'audit contient maintenant une entrée à chaque fois que le DataFrame perd des lignes.

**🤔 Question(s) socratique(s)**

- Qu'arriverait-il à l'honnêteté de la trace d'audit si `drop_duplicates()` retirait silencieusement 4 lignes au lieu de 2 parce que le CSV avait deux versions du même client avec des orthographes de `price` différentes ? Où le pipeline te permet-il d'attraper cela avant que quiconque ne s'appuie sur le fichier nettoyé ?
- Le compte du sous-ensemble `3` dépasse le compte exact `2`. La version exacte est-elle toujours la « bonne » réponse ? Donne un scénario réel où une suppression basée sur un sous-ensemble est le comportement correct et où la version exacte laisse le jeu de données faux.

## Étape 3 : Remplis les valeurs manquantes, colonne par colonne

Les cellules manquantes sont remplies différemment selon ce que la colonne signifie. Un prix numérique auquel il manque une valeur se devine mieux par la médiane de ses pairs ; un champ de texte libre manquant (comme un deuxième prénom) est souvent mieux laissé comme un « inconnu » explicite. Le travail du pipeline est de *décider par colonne* et de journaliser le raisonnement, pour qu'un lecteur sache que `units = 4.0` était un remplissage à la médiane et non une valeur d'origine.

### 3.1 Remplis les numériques avec la médiane, le texte avec le mode

**👟 Indice de départ :** Écris `fill_missing(df)` qui remplit chaque colonne numérique avec sa médiane et chaque colonne de texte avec sa valeur la plus fréquente, en sautant toute colonne sans rien à remplir.

```python
# clean.py (continued)
def fill_missing(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.columns:
        if df[col].isna().sum() == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = df[col].fillna(df[col].mode()[0])
    return df
```

La forme de la boucle est le pattern : regarde une colonne, compte ses cellules manquantes, et agis seulement si le compte est non nul. Sauter les colonnes sans valeurs manquantes évite les entrées d'audit bruyantes qui enregistreraient un « remplissage » de rien, et `is_numeric_dtype` garde la stratégie honnête — les nombres obtiennent une médiane, le texte obtient un mode, et aucune stratégie n'est jamais appliquée au mauvais type de colonne.

**🎯 Résultat attendu :** Exécuter ceci sur le DataFrame sans doublons met les deux cellules `units` manquantes à `2` (la médiane des valeurs `[2, 10, 0, 2, 2, 2, 1000]`), et un `price` numérique voit son unique cellule manquante remplie avec `2.5`.

**🩹 Si ça ne marche pas :** Si les cellules manquantes restent `NaN` après l'appel, le chemin de remplissage n'a jamais été atteint — confirme que `isna().sum()` était réellement non nul pour cette colonne (les cellules `units` manquantes vivent dans les lignes `alice` et `grace` ; confirme que ce sont les doublons qui ont été supprimés, pas les lignes porteuses). Si une colonne de texte comme `customer` a été remplie médiane-comme-mode et que tu trouves cela étrange, c'est le comportement correct ici — le choix de stratégie ne se comporte mal que lorsque des identifiants sont impliqués, ce que l'Étape 5 adresse.

### 3.2 Enregistre la décision dans la trace d'audit

**👟 Indice de départ :** Maintenant que le remplissage fonctionne, ajoute les entrées d'audit à l'intérieur de la boucle — une par colonne remplie — nommant la colonne, la stratégie, et combien de cellules ont été remplies, puis imprime la trace grandissante.

```python
# clean.py (continued)
def fill_missing_audited(df: pd.DataFrame, audit: list[dict]) -> pd.DataFrame:
    for col in df.columns:
        n = int(df[col].isna().sum())
        if n == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
            strategy = f"median ({df[col].median():.2f})"
        else:
            df[col] = df[col].fillna(df[col].mode()[0])
            strategy = f"mode ({df[col].mode()[0]!r})"
        audit.append({"action": "fill_missing", "column": col, "cells_filled": n, "strategy": strategy})
    return df

audit = []
df = pd.read_csv("messy.csv")
df, a1 = drop_duplicates(df)
audit.append(a1)
df = fill_missing_audited(df, audit)
print(*audit, sep="\n")
```

`pd.api.types.is_numeric_dtype(df[col])` est la branche qui garde la stratégie honnête : les nombres obtiennent une médiane, le texte obtient un mode. Chaque remplissage atterrit maintenant dans `audit` comme une ligne avec sa propre chaîne de stratégie, pour que le jeu de données nettoyé final parte accompagné d'un document compagnon de exactement ce qui a été inventé et pourquoi.

**🎯 Résultat attendu :** Une entrée de remplissage `units` se lisant `"median (2.00)"` avec `cells_filled: 2`, plus une entrée de remplissage `price` utilisant la stratégie `mode` — sa présence avec une stratégie de texte est le signe que `price` est *encore du texte à ce stade*, ce qui est précisément le bug d'ordre que le pipeline complet empêche en normalisant les formats d'abord (Étape 5).

**🩹 Si ça ne marche pas :** Si l'entrée de `price` affiche inexplicablement une stratégie de style numérique, tu as exécuté le remplissage après avoir converti `price` hors ordre — un résultat correct, mais note que la démo dépend de texte-en, texte-out. Si les cellules sont remplies mais que l'audit ne les contient jamais, l'append de liste est dans la mauvaise branche `if` ou la fonction est retournée sans ajouter.

### 3.3 Vérifie la passe de remplissage

**✅ Liste de vérification**

- ✅ Les colonnes numériques sont remplies avec leur médiane ; les colonnes de texte avec leur mode.
- ✅ Une entrée d'audit existe par colonne remplie, chacune nommant stratégie et nombre de cellules.
- ✅ Les colonnes sans valeur manquante ne produisent aucune entrée d'audit.

**🤔 Question(s) socratique(s)**

- Pourquoi remplir `units` avec la médiane est-il défendable alors que remplir `order_id` avec la médiane est absurde ? Quelle information le dtype porte-t-il que la fonction de remplissage doit respecter ?
- L'audit stocke la chaîne de *stratégie*, pas seulement l'action. Quelle question future cela te permet-il de répondre qu'un audit de `action: fill_missing` seul ne le pourrait pas ?

## Étape 4 : Attrape les valeurs aberrantes avec la règle IQR

Une valeur `units` de `1000` à côté de pairs de `0` et `2` est presque certainement une faute de frappe, mais la supprimer à l'aveugle perd les autres colonnes de la ligne. La règle IQR trouve le corridor des valeurs raisonnables — tout ce qui est à plus de `1.5 × IQR` sous le premier quartile ou au-dessus du troisième — et *plafonne* les fautifs au bord du corridor, préservant la ligne tout en neutralisant la distorsion.

### 4.1 Calcule le corridor et signale les fautifs

**👟 Indice de départ :** Pour les colonnes numériques d'un DataFrame, calcule `Q1`, `Q3` et `IQR`, puis liste chaque ligne en dehors de `[Q1 - 1.5*IQR, Q3 + 1.5*IQR]`.

```python
# clean.py (continued)
def flag_outliers(df: pd.DataFrame, columns: list[str]) -> dict[str, list]:
    outliers: dict[str, list] = {}
    for col in columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
        q1, q3 = df[col].quantile([0.25, 0.75])
        iqr = q3 - q1
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        found = df[(df[col] < lo) | (df[col] > hi)]
        if len(found):
            outliers[col] = [found.index.tolist(), round(lo, 2), round(hi, 2)]
    return outliers

df = pd.read_csv("messy.csv")
df, _ = drop_duplicates(df)
print(flag_outliers(df, ["units", "price"]))
```

`df[col].quantile([0.25, 0.75])` retourne les deux quartiles en un appel, et le masque booléen `(df[col] < lo) | (df[col] > hi)` sélectionne les lignes en dehors du corridor — note l'opérateur `|`, pas `or`, parce que pandas a besoin de masques combinés élément par élément, et que `or` de Python les réduit à une seule valeur de vérité.

**🎯 Résultat attendu :** La fonction signale `units` avec une ligne aberrante (la valeur `1000` à l'index d'origine `11`) dans un corridor d'environ `(-1.0, 7.0)` — et `price` est entièrement sauté parce qu'à ce stade c'est encore du texte et la branche numérique décline correctement de le juger.

**🩹 Si ça ne marche pas :** Si chaque colonne ne signale aucune valeur aberrante, la garde numérique te saute silencieusement — un dtype `object` produit un masque vide sous cette règle, ce qui est pourquoi `price` ne montre délibérément rien ; exécute ceci *après* l'étape de normalisation de `price` et la garde le laissera enfin passer. Si `ValueError: The truth value of a Series is ambiguous` apparaît, tu as utilisé `or` là où `|` est requis.

### 4.2 Plafonne au lieu de supprimer

**👟 Indice de départ :** Remplace les valeurs fautives avec `Series.clip(lower=lo, upper=hi)` et enregistre à la fois l'ancienne et la nouvelle valeur dans la trace d'audit — le cas rare où la trace stocke une paire avant/après.

```python
# clean.py (continued)
def clip_outliers(df: pd.DataFrame, columns: list[str], audit: list[dict]) -> pd.DataFrame:
    for col in columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
        q1, q3 = df[col].quantile([0.25, 0.75])
        lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
        mask = (df[col] < lo) | (df[col] > hi)
        clipped = df.loc[mask, col].tolist()
        df[col] = df[col].clip(lower=lo, upper=hi)
        if clipped:
            audit.append({"action": "clip_outlier", "column": col, "from": clipped, "to": round(hi, 2)})
    return df

audit = []
df = pd.read_csv("messy.csv")
df, _ = drop_duplicates(df)
df = clip_outliers(df, ["units", "price"], audit)
print(*audit, sep="\n")
```

`clip(lower=lo, upper=hi)` pousse chaque valeur à l'intérieur du corridor en un appel vectorisé — pas de boucle, et il garde `1000` comme `7.0` plutôt que de supprimer les quatre autres champs de la ligne. Stocker la liste `from` à côté de `to` rend la trace d'audit un cran meilleure que la plupart des journaux de production : elle peut répondre à « qu'avons-nous réellement changé pour cette ligne ? » au lieu de seulement « qu'avons-nous touché ? ».

**🎯 Résultat attendu :** Le `1000` dans `units` devient `12.0`, et une entrée d'audit `{"action": "clip_outlier", "column": "units", "from": [1000], "to": 7.0}` apparaît. La colonne `price` est sautée tant qu'elle est du texte et reste intacte.

**🩹 Si ça ne marche pas :** Si aucun plafonnement ne se produit malgré un `1000` clair, confirme que la conversion numérique de l'Étape 5 a bien tourné en premier. Si l'entrée d'audit enregistre un plafonnement mais que le DataFrame affiche toujours `1000`, l'affectation `df[col] = df[col].clip(...)` a été abandonnée et tu imprimes le DataFrame d'avant-plafonnement.

### 4.3 Vérifie la passe des valeurs aberrantes

**✅ Liste de vérification**

- ✅ `units = 1000` est plafonné à `7.0`, et les autres colonnes de la ligne sont préservées.
- ✅ La trace d'audit enregistre une paire avant/après pour la valeur plafonnée.
- ✅ Tu peux dire pourquoi plafonner bat la suppression de toute la ligne ici.

**🤔 Question(s) socratique(s)**

- Le corridor cache un jugement : `1.5` est une convention, pas une loi. Qu'arriverait-il à `units` si tu utilisais `3.0` à la place ? Quel type de données se tiendrait *légitimement* en dehors du corridor `1.5` et serait aplati à tort par cette règle ?
- Pourquoi plafonner plutôt que supprimer la ligne ? Quelle information survit dans la ligne qui serait autrement perdue, et dans quelle analyse en aval cette survie compte-t-elle réellement ?

## Étape 5 : Normalise les formats pour que les valeurs se comparent proprement

La colonne numérique tient `"2.5 USD"` à côté de `3.00`, et les dates utilisent `2024-01-05`, `05/01/2024` et `2024/03/15` dans la même colonne. Un `mean()` sur l'une ou l'autre colonne échoue ou ment aujourd'hui. La normalisation de format force chaque valeur dans une seule forme — un float pour `price`, une `datetime.date` pour les dates, du texte épuré pour les noms — et c'est cette étape qui explique *pourquoi* les remplissages et vérifications de valeurs aberrantes précédents ont commencé à fonctionner sur le DataFrame.

### 5.1 Convertit price en une seule forme numérique

**👟 Indice de départ :** Écris `normalize_price(series)` qui retire le bruit non numérique, force le résultat, et signale chaque cellule qu'elle ne peut pas convertir comme un problème séparé.

```python
# clean.py (continued)
import pandas as pd

def normalize_price(s: pd.Series) -> tuple[pd.Series, list[str]]:
    cleaned = s.astype(str).str.replace(r"[^\d.]", "", regex=True)
    converted = pd.to_numeric(cleaned, errors="coerce")
    undecodable = s[converted.isna() & s.notna()].tolist()
    return converted, [str(v) for v in undecodable]

df = pd.read_csv("messy.csv")
df, _ = drop_duplicates(df)
p, stuck = normalize_price(df["price"])
df["price"] = p
print(df["price"].tolist())
print("could not convert:", stuck)
```

Le regex `[^\d.]` retire tout ce qui n'est pas un chiffre ou un point décimal — c'est la largeur de la hache ici, et c'est honnête : il gère `"2.5 USD"`, mais il détruirait aussi une valeur de devise véritablement différente comme `"2,50€"`. `errors="coerce"` transforme tout ce qui reste non analysable en `NaN` au lieu de planter, et ces cellules restantes sont remontées comme la liste `stuck` pour que le pipeline ne brûle jamais silencieusement une valeur qu'il n'a pas pu lire.

**🎯 Résultat attendu :** `df["price"]` devient `[2.5, nan, 2.5, 1.0, 0.75, 3.5, 4.0, 3.5, 2.25, 9.99]` — la cellule `"2.5 USD"` est maintenant un float — et `stuck` est vide pour ce CSV.

**🩹 Si ça ne marche pas :** Si une valeur survit comme `"2.5 USD"`, le regex `[^\d.]` n'a pas tourné sur cette ligne parce que la série tenait un non-chaîne (une cellule déjà numérique) — force avec `.astype(str)` d'abord comme montré. Si `stuck` est non vide, ton CSV a une valeur que le regex a mutilée plutôt que nettoyée — décide une règle par devise et étends le regex délibérément, ou laisse la ligne signalée plutôt que de la supprimer.

### 5.2 Normalise les dates et le texte en une passe

**👟 Indice de départ :** Livre les dates avec `pd.to_datetime(..., format="mixed")` et épure les colonnes de texte, en ajoutant des notes de nettoyage à la liste d'audit grandissante.

```python
# clean.py (continued)
def normalize_formats(df: pd.DataFrame, audit: list[dict]) -> pd.DataFrame:
    for col in df.columns:
        if df[col].dtype == object and "date" in col.lower():
            before = df[col].nunique()
            df[col] = pd.to_datetime(df[col], format="mixed")
            audit.append({"action": "normalize_date", "column": col, "unique_before": before, "dtype": str(df[col].dtype)})
        elif df[col].dtype == object:
            stripped = df[col].astype(str).str.strip().astype("string")
            if stripped.ne(df[col].astype(str)).any():
                audit.append({"action": "strip_text", "column": col})
            df[col] = stripped
    return df

df = pd.read_csv("messy.csv")
_, a1 = drop_duplicates(df)
audit = [a1]
df = normalize_formats(df, audit)
print(df[["order_date", "customer"]])
print(*audit, sep="\n")
```

`fast-date` gagne la course ici tout en gardant les trois formes d'entrée : `format="mixed"` laisse pandas deviner par cellule au lieu d'insister qu'un seul format décrit chaque ligne. Le `astype("string")` final utilise le propre type de chaîne nullable de pandas, pour qu'une colonne épurée cesse de stocker silencieusement `NaN` comme le type float et enregistre honnêtement l'absence.

**🎯 Résultat attendu :** `order_date` s'imprime comme une colonne `datetime64` cohérente, `customer` montre `alice`, `bob`, `carol`, `dave`, `erin`, `frank`, `grace`, `henry` sans espaces environnants, et l'audit gagne des entrées `normalize_date` et `strip_text`.

**🩹 Si ça ne marche pas :** Si l'analyse `Mixed format` lève une erreur, une cellule contient une ambiguïté réelle comme `02/03/2024` où le mois et le jour pourraient s'inverser — `format="mixed"` la garde analysable mais a silencieusement choisi une lecture ; épingle le format avec `format="%d/%m/%Y"` quand tu connais tes données. Si les colonnes de texte restent épurées dans la sortie écran mais gardent des espaces dans le DataFrame, le DataFrame n'a pas été ré-affecté depuis `stripped`.

### 5.3 Vérifie la passe de normalisation

**✅ Liste de vérification**

- ✅ `price` est une seule colonne numérique ; `stuck` ne signale rien d'illisible.
- ✅ Toutes les cellules `order_date` sont un seul dtype `datetime64`, quelle que soit leur orthographe d'origine.
- ✅ Les colonnes de texte sont épurées et stockées comme dtype pandas `string`.
- ✅ Des entrées d'audit existent pour chaque normalisation qui a réellement changé des données.

**🤔 Question(s) socratique(s)**

- Le regex `[^\d.]` convertit `"2.5 USD"` proprement — mais que fait-il à une valeur comme `"2,500.00"` provenant d'une locale qui utilise des séparateurs de milliers ? Qu'est-ce que cela dit du fait de remplacer une décision humaine par un regex ?
- Après la normalisation, des doublons peuvent apparaître qui n'existaient pas avant (deux lignes dont les prix étaient `"2.5 USD"` et `2.5`). Pourquoi la suppression des doublons et la normalisation des formats devraient-elles partager une passe finale unique plutôt que d'être deux étapes séparées ?

## Étape 6 : Assemble le pipeline complet avec sa trace d'audit

Chaque pièce jusqu'ici corrige un problème en isolation ; le pipeline les câble dans un ordre qui a du sens — profile, puis normalise les formats, puis supprime les doublons (maintenant fiables), puis remplit par colonne, puis plafonne les valeurs aberrantes — et retourne un DataFrame propre *plus* la liste d'audit complète comme enregistrement sérialisable en JSON.

### 6.1 Écris `clean_dataset(path)`

**👟 Indice de départ :** Compose les fonctions dans l'ordre de dépendance dans `clean_dataset(path)` qui retourne `(clean_df, audit)` et ajoute un bloc `__main__` qui imprime les deux ; assure-toi que toute fonction qui échoue lève une erreur claire nommant la colonne sur laquelle elle était.

```python
# clean.py (final -- every helper from Steps 1-5 now lives in this same file)
import json

import pandas as pd

def clean_dataset(path: str) -> tuple[pd.DataFrame, list[dict]]:
    df = pd.read_csv(path)
    report = profile(df)
    if not report:
        raise ValueError(f"Cannot profile {path} -- is the file empty?")
    audit: list[dict] = [{"action": "profile", "issues": report}]
    df = normalize_formats(df, audit)
    price, _stuck = normalize_price(df["price"])
    df["price"] = price
    df, a = drop_duplicates(df)
    audit.append(a)
    df = fill_missing_audited(df, audit)
    df = clip_outliers(df, ["units", "price"], audit)
    return df, audit
if __name__ == "__main__":
    clean, trail = clean_dataset("messy.csv")
    print(clean)
    print("\naudit:\n", json.dumps(trail, indent=2, default=str))
```

L'ordre encode du jugement, pas de l'habitude : les formats se normalisent *d'abord* pour que la passe des doublons voie des valeurs comparables, et le plafonnement des valeurs aberrantes s'exécute *en dernier* pour qu'il opère sur des données numériques remplies. Échouer vite à l'intérieur de `clean_dataset` avec `raise ValueError(...)` bat l'expédition d'un fichier à moitié nettoyé en silence qu'un tableur ne révèle que plus tard. Le `json.dumps(trail, indent=2, default=str)` unique imprime l'audit comme un reçu lisible.

**🎯 Résultat attendu :** Un DataFrame propre imprimé avec exactement 10 lignes (12 moins les deux doublons), `price` numérique, des noms épurés, des dates uniformes, `units` et `price` remplis à la médiane, une valeur aberrante `units` plafonnée à `7.0`, et une liste d'audit contenant chaque action du pipeline, dans l'ordre d'exécution.

**🩹 Si ça ne marche pas :** Si un `KeyError: 'price'` remonte, la colonne price du CSV ne s'appelle pas `price` — le pipeline code en dur un nom ; fais-en un paramètre `column` quand les données ne sont pas d'accord. Si la suppression des doublons supprime plus de `2` lignes dans le pipeline complet, une passe de normalisation a fusionné deux chaînes auparavant distinctes — compare quelles lignes ont disparu en ré-exécutant sur le fichier original.

### 6.2 Vérifie le pipeline complet

**✅ Liste de vérification**

- ✅ `clean_dataset("messy.csv")` retourne un DataFrame propre avec 10 lignes et des colonnes typées.
- ✅ La liste d'audit contient des entrées en ordre : profil, normalisation de format, suppression de doublons, remplissages de valeurs manquantes, plafonnement des valeurs aberrantes.
- ✅ Tu peux reconstruire à partir de l'audit exactement ce que chaque valeur d'origine est devenue.

**🤔 Question(s) socratique(s)**

- Le pipeline exécute la normalisation de format avant la suppression des doublons. Trace ce qui se passe si tu échanges ces deux étapes sur le `messy.csv` original : quelles lignes survivent, et quelle décision devient différente à propos de `price` ?
- `clean_dataset` retourne une liste fixe de colonnes numériques pour le plafonnement. Que changerais-tu dans la signature de la fonction pour qu'elle reste correcte sur un jeu de données sans colonne `price` — une liste spécifique de colonnes, ou une règle ? Auquel fais-tu confiance à un coéquipier pour maintenir ?

## ⚠️ Pièges courants

- **Corriger des données avant de pouvoir les décrire.** Un script qui impute et plafonne au chargement détruit la preuve qu'une correction était nécessaire — profile d'abord, toujours, et garde ce premier rapport dans l'audit.
- **Remplir des identifiants avec des statistiques.** Remplir `order_id` à la médiane ou `timestamp` au mode produit des valeurs qui ont l'air réelles et ne veulent rien dire. Restreins les remplissages par dtype et par une liste blanche de colonnes.
- **Supprimer au lieu de plafonner.** Supprimer des lignes aberrantes perd silencieusement les colonnes non-aberrantes de ces lignes. Quand un champ est absurde mais que le reste est digne de confiance, plafonne le champ.
- **Portée excessive des regex sur les formats.** Un nettoyage `[^\d.]` convertit `"2,500.00"` et `"2.50€"` en nombres surprenants. Remonte les valeurs irrécupérables via une liste `stuck` au lieu de prétendre que le regex les a comprises.
- **Transformations intraçables.** Des données propres sans trace d'audit sont impossibles à distinguer de données qui étaient fausses dès le départ. Chaque mutation — suppression, remplissage, plafonnement, normalisation — est une action auditable, et ce pipeline la traite comme telle.

## Ce que tu viens de construire

Un CLI de nettoyage de données fonctionnel : il charge un CSV vraiment en désordre, signale ce qui ne va pas avant de toucher une cellule, puis corrige les doublons, les valeurs manquantes, les valeurs aberrantes et le chaos de formats dans un ordre délibéré — retournant à la fois un DataFrame propre et un audit complet de chaque changement. La compétence transférable ici survit à l'outil : l'habitude d'enregistrer chaque transformation comme données, pour qu'un jeu de données nettoyé puisse toujours répondre « que m'as-tu fait, et pourquoi ? ».

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/ai-data-cleaner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-data-cleaner) dans le dépôt du cours est le même pipeline conditionné pour un notebook, avec les étapes de profilage et d'audit imprimées à chaque stade. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Transforme la liste `stuck` en point de décision : un drapeau `--strict` qui *refuse d'écrire la sortie* tant que toute valeur est irrécupérable, pour que le pipeline ne puisse pas livrer un fichier qu'il n'a pas entièrement compris.
- Ajoute la gestion des espaces en fenêtre entière et des encodages mixtes avec l'option argparse `--encoding`, et normalise les fichiers UTF-8 BOM que pandas lit mal silencieusement.
- Alimente la trace d'audit dans le module [Visualisation de Données](/fr/projets) du cours : rends un graphique à barres des problèmes par colonne et stratégie pour qu'un humain puisse approuver les remplissages d'un coup d'œil.
- Pointe le pipeline vers l'API du projet [Tableau de Bord de Qualité de l'Air](/projects/air-quality) et nettoie les réponses `/api` avant qu'elles n'atteignent tes graphiques.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓