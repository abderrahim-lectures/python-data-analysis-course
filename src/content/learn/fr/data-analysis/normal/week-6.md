---
title: "Semaine 6 : Bases des Series et DataFrame"
section: data-analysis
track: normal
week: 6
description: "Apprenez les bases des Series et DataFrame de pandas et comment lire des fichiers CSV — la première semaine du parcours Normal d'Analyse de Données."
---


# Semaine 6 : Bases des Series et DataFrame

<span class="gamified-flourish">📐 Un tableau n'est pas une idée nouvelle pour vous — c'est une matrice avec des étiquettes. Pandas donne simplement à Python un support natif pour cela.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Expliquer ce que sont une `Series` et un `DataFrame`, et comment ils se rapportent à un vecteur et une matrice.
- Construire un `DataFrame` à partir de structures de données Python, et en charger un depuis un CSV avec `pd.read_csv`.
- Inspecter la forme, les colonnes, les dtypes, l'index et les statistiques descriptives d'un `DataFrame`.
- Sélectionner une seule colonne comme `Series`, et connaître la différence entre les deux principales façons de le faire.

## Leçon

### Du dict de listes au DataFrame

Le mini-projet de la semaine 5 de Python 101 calculait des moyennes par étudiant à l'aide d'un `dict`. Un `DataFrame` est la structure conçue par pandas exactement pour ce genre de données tabulaires — des lignes et des colonnes, avec des étiquettes sur les deux axes :

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["Amina", "Youssef", "Sara"],
    "score": [88, 74, 95],
})
df
```

Vous pouvez aussi en construire un à partir d'une liste de dicts — exactement la forme « liste d'enregistrements » de l'exemple de collections imbriquées de la semaine 3 du parcours normal de Python 101 :

```python
records = [
    {"name": "Amina", "score": 88},
    {"name": "Youssef", "score": 74},
]
pd.DataFrame(records)
```

Les deux formes produisent le même genre d'objet ; laquelle est la plus pratique dépend simplement de la façon dont vos données sont déjà structurées — dict de listes quand vous pensez « colonne par colonne », liste de dicts quand vous pensez « enregistrement par enregistrement ».

Une **`Series`** est une seule colonne étiquetée — pensez-y comme à un vecteur $\mathbf{v} \in \mathbb{R}^n$, sauf que chaque entrée a aussi une étiquette (son index), pas seulement une position :

```python
df["score"]        # a Series
type(df["score"])   # pandas.core.series.Series
```

Un **`DataFrame`** est un tableau 2D de telles colonnes partageant un même index de lignes — l'analogue tabulaire d'une matrice $A \in \mathbb{R}^{m \times n}$, sauf que les colonnes peuvent avoir des dtypes différents et que les deux axes portent des étiquettes, pas seulement des positions numériques.

### L'index

Chaque `DataFrame` (et `Series`) a un **index** de lignes — les étiquettes le long du bord gauche — visible chaque fois que vous en affichez un. Par défaut, c'est simplement `0, 1, 2, ...`, mais ça n'a pas à l'être :

```python
df.index                       # RangeIndex(start=0, stop=3, step=1) by default
df_named = df.set_index("name")   # use the "name" column as the index instead
df_named.loc["Amina"]              # now you can look up a row by name directly
```

`set_index` ne modifie pas `df` en place par défaut — elle retourne un *nouveau* DataFrame avec le changement, le même motif « retourne une nouvelle valeur, ne modifie pas » que vous avez déjà vu avec `sorted()` en Python 101.

### Lire un CSV

Le même `students-normal.csv` de Python 101 se charge en un seul appel — pas de boucle manuelle avec `csv.DictReader`, pas de conversions manuelles avec `int(...)` :

```python
df = pd.read_csv("students-normal.csv")
df.head()      # first 5 rows
df.tail(3)      # last 3 rows
```

`pd.read_csv` déduit automatiquement le dtype de chaque colonne (les nombres deviennent `int64`/`float64`, le texte reste `object`), ce qui correspond à la majeure partie de ce que la semaine 5 du parcours normal de Python 101 faisait à la main, réalisé pour vous en une seule ligne.

### Inspecter un DataFrame

Une poignée de méthodes répondent à « à quoi ressemble réellement ce jeu de données ? » avant que vous ne fassiez quoi que ce soit d'autre avec :

```python
df.shape        # (rows, columns) — e.g. (10, 4)
df.columns      # column names
df.dtypes       # each column's data type
df.info()       # shape + dtypes + non-null counts, all at once
df.describe()   # count, mean, std, min, quartiles, max — for numeric columns
```

`df.describe()` vaut la peine qu'on s'y attarde : moyenne et écart-type sont exactement les statistiques que vous connaissez déjà d'un cours de statistiques, calculées instantanément sur une colonne entière plutôt qu'à la main. Vous pouvez renommer des colonnes après coup si les noms du fichier source ne sont pas pratiques à utiliser :

```python
df = df.rename(columns={"quiz1": "quiz_1"})
```

## ⚠️ Erreurs courantes

- **Oublier que la plupart des opérations sur un DataFrame retournent un nouvel objet.** `df.rename(...)`, `df.set_index(...)`, et beaucoup d'autres ne changent pas `df` lui-même, sauf si vous réaffectez (`df = df.rename(...)`) ou passez `inplace=True`.
- **Confondre `df.shape` (sans parenthèses) avec un appel de méthode.** `.shape` est un attribut, pas une fonction — `df.shape()` lève une `TypeError`.
- **Supposer que `.describe()` couvre chaque colonne.** Par défaut, elle ne résume que les colonnes numériques ; les colonnes de texte nécessitent un regard différent (la semaine 8 couvre le nettoyage et l'inspection de celles-ci).

## 🧩 Défis

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Chargez `students-normal.csv` (de la semaine 5 de Python 101 — réutilisez le même fichier) dans un DataFrame et affichez combien de lignes et de colonnes il contient.

<p class="challenge__answer">💡 <strong>Answer:</strong> Utilisez <code>pd.read_csv("students-normal.csv")</code> puis <code>df.shape</code> — le premier élément du tuple est le nombre de lignes, le second le nombre de colonnes.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Sélectionnez uniquement la colonne `quiz1` comme Series. Quelles sont les deux syntaxes différentes pour faire cela ?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["quiz1"]</code> ou <code>df.quiz1</code> sélectionnent tous deux la colonne comme Series ; le second ne fonctionne que parce que <code>quiz1</code> est un identifiant Python valide, sans espaces.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Calculez la moyenne de la colonne `quiz1` en utilisant une méthode de Series (pas `sum()`/`len()` à la main).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["quiz1"].mean()</code> — chaque Series a des méthodes statistiques intégrées comme <code>.mean()</code>, <code>.median()</code>, <code>.std()</code>, sans besoin de sum()/len() manuel.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Exécutez `df.describe()` sur le DataFrame des étudiants. Inclut-il la colonne `name` ? Pourquoi, ou pourquoi pas ?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.describe()</code> ne résume par défaut que les colonnes numériques (count/mean/std/min/quartiles/max) et saute silencieusement la colonne <code>name</code>, puisqu'aucune de ces statistiques n'a de sens pour du texte — pandas déduit cela du dtype de chaque colonne.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Définissez `name` comme index du DataFrame des étudiants, puis recherchez directement la ligne d'Amina par son nom plutôt que par numéro de ligne.

<p class="challenge__answer">💡 <strong>Answer:</strong> Appelez df.set_index("name") et stockez le résultat (par ex. df_by_name = df.set_index("name")), puis utilisez df_by_name.loc["Amina"] pour récupérer directement cette ligne par étiquette au lieu de chercher le numéro de ligne correspondant.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Construisez à la main un petit DataFrame (pas depuis un CSV) avec deux colonnes, `city` et `population`, pour 3 villes de votre choix — en utilisant soit le style dict-de-listes, soit le style liste-de-dicts.

<p class="challenge__answer">💡 <strong>Answer:</strong> Construisez-le soit comme un dict de listes (une clé par colonne), soit comme une liste de dicts (un dict par ville) passé à <code>pd.DataFrame(...)</code> — les deux sont valides, selon la forme dans laquelle les données ont commencé.</p>

</div>
</details>

## 🤔 Questions socratiques

- Une `Series` est souvent comparée à une `list` Python avec des étiquettes. Que pouvez-vous faire avec `.mean()`/`.std()` d'une Series en un seul appel que vous ne pourriez pas faire avec une simple `list` sans écrire votre propre fonction ?
- `df.dtypes` montre le type déduit de chaque colonne. Que pourrait-il aller de travers si une colonne d'apparence numérique (comme `quiz1`) contenait en fait une ligne avec du texte dedans, comme `"absent"` ? Quel dtype pandas déduirait-il probablement pour toute la colonne ?
- Vous avez passé 5 semaines de Python 101 à construire à la main de la logique de lecture de CSV et de calcul de moyenne. Quelles lignes précises de cette logique `pd.read_csv(...).describe()` remplace-t-il ? Perd-on réellement quelque chose en utilisant ce raccourci, ou seulement du temps qui est gagné ?
- `df.set_index("name")` remplace l'index numérique par défaut par un index significatif. Qu'irait-il de travers si la colonne `name` avait une valeur en double — pourrait-on encore distinguer deux étudiants différents ensuite ?

## ✅ Quiz de la semaine

<div class="quiz" data-quiz="data-analysis-normal-week-6">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. Une Series pandas se décrit le mieux comme :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Un tableau 2D de lignes et de colonnes</button>
        <button class="quiz-q__opt" data-idx="1">Une seule colonne étiquetée de données</button>
        <button class="quiz-q__opt" data-idx="2">Un fichier CSV sur disque</button>
        <button class="quiz-q__opt" data-idx="3">Un dict Python sans étiquettes</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. Quelle fonction charge un fichier CSV dans un DataFrame ?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">pd.load_csv()</button>
        <button class="quiz-q__opt" data-idx="1">pd.read_csv()</button>
        <button class="quiz-q__opt" data-idx="2">pd.DataFrame.open()</button>
        <button class="quiz-q__opt" data-idx="3">pd.csv()</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. df.describe() résume par défaut :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Chaque colonne, texte inclus</button>
        <button class="quiz-q__opt" data-idx="1">Seulement les colonnes numériques</button>
        <button class="quiz-q__opt" data-idx="2">Seulement la première ligne</button>
        <button class="quiz-q__opt" data-idx="3">Seulement les noms de colonnes</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. df.shape retourne :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Les noms des colonnes</button>
        <button class="quiz-q__opt" data-idx="1">Un tuple (lignes, colonnes)</button>
        <button class="quiz-q__opt" data-idx="2">Les types de données de chaque colonne</button>
        <button class="quiz-q__opt" data-idx="3">Les 5 premières lignes</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. df.set_index(&quot;name&quot;) par défaut :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Modifie df en place et retourne None</button>
        <button class="quiz-q__opt" data-idx="1">Retourne un nouveau DataFrame, en laissant le df original inchangé</button>
        <button class="quiz-q__opt" data-idx="2">Supprime entièrement la colonne name</button>
        <button class="quiz-q__opt" data-idx="3">Ne fonctionne que sur des colonnes numériques</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

