---
title: "Semaine 7 : Sélection, filtrage et indexation"
sidebar_position: 2
section: data-analysis
track: normal
week: 7
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 7 : Sélection, filtrage et indexation

<span className="gamified-flourish">🔍 La semaine dernière, vous regardiez la table entière. Cette semaine, vous apprenez à lui poser des questions.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Sélectionner des lignes et des colonnes avec `.loc` et `.iloc`.
- Filtrer des lignes en utilisant un **masque booléen**, l'équivalent pandas de la notation en compréhension d'ensemble.
- Combiner plusieurs conditions avec `&`, `|`, et `~`.
- Utiliser `.isin()` et `.between()` pour des raccourcis de filtrage courants.

## Leçon

### `.loc` contre `.iloc`

Les deux sélectionnent des lignes/colonnes, mais par des types d'adresse différents :

```python
df.loc[0, "name"]      # by label: row labeled 0, column labeled "name"
df.iloc[0, 0]           # by position: first row, first column, regardless of labels
df.loc[0:2]             # rows labeled 0 through 2, INCLUSIVE
df.iloc[0:2]             # rows at positions 0, 1 — EXCLUSIVE stop, like Python slicing
```

`.loc` est inclusif aux deux bornes car il adresse par *étiquette*, pas par position — une différence importante et facile à manquer par rapport au découpage semi-ouvert habituel de Python (que `.iloc` suit). Les deux acceptent une *combinaison* de sélecteurs de lignes et de colonnes, filtrant les deux axes en un seul appel :

```python
df.loc[0:2, "name"]              # rows 0-2, just the name column, as a Series
df.loc[0:2, ["name", "quiz1"]]    # rows 0-2, two columns, as a DataFrame
```

### Masques booléens : la notation en compréhension d'ensemble de pandas

Rappelez-vous la notation en compréhension d'ensemble : $\{x \in S : P(x)\}$. En pandas, une condition comme `df["score"] >= 60` produit une `Series` de valeurs `True`/`False` — un **masque booléen** — et indexer un DataFrame avec ce masque ne garde que les lignes où il vaut `True` :

```python
mask = df["quiz1"] >= 60
mask                   # a Series of True/False, one per row
df[mask]                # only the rows where quiz1 >= 60

# more commonly written in one line:
df[df["quiz1"] >= 60]
```

C'est directement la forme code de $\{ \text{ligne} \in df : \text{ligne.quiz1} \ge 60 \}$ — exactement la même idée qu'un filtre en compréhension de liste de Python 101, opérant simplement sur une colonne entière d'un coup au lieu de boucler élément par élément. Un masque peut aussi être combiné avec `.loc` pour filtrer les lignes *et* choisir des colonnes en un seul appel :

```python
df.loc[df["quiz1"] >= 60, ["name", "quiz1"]]   # only passing students, just these 2 columns
```

### Combiner des conditions

Utilisez `&` (et), `|` (ou), `~` (non) — **pas** les `and`/`or`/`not` de Python, qui ne fonctionnent pas élément par élément sur des Series. Chaque condition a besoin de ses propres parenthèses à cause de la priorité des opérateurs :

```python
df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]    # passed both quizzes
df[(df["quiz1"] < 60) | (df["quiz2"] < 60)]       # failed at least one
df[~(df["quiz1"] >= 60)]                            # NOT passing quiz1 — same as df["quiz1"] < 60
```

### Raccourcis de filtrage : `.isin()` et `.between()`

Deux motifs de filtrage courants ont des méthodes dédiées, plus lisibles, plutôt que des chaînes de `|`/comparaisons :

```python
df[df["name"].isin(["Amina", "Sara"])]        # rows where name is one of a list of values
df[df["quiz1"].between(60, 80)]                 # rows where 60 <= quiz1 <= 80, inclusive
```

`df["name"].isin([...])` est l'équivalent vectorisé du test d'appartenance `value in some_list` de Python 101, appliqué à la colonne `name` de chaque ligne à la fois — et cela vous évite d'écrire à la main `(df["name"] == "Amina") | (df["name"] == "Sara")`.

### Sélectionner des colonnes

```python
df["name"]                    # one column, as a Series
df[["name", "quiz1"]]          # multiple columns, as a DataFrame (note the double brackets)
```

## ⚠️ Erreurs courantes

- **Utiliser les `and`/`or` de Python au lieu de `&`/`|`.** `df["quiz1"] >= 60 and df["quiz2"] >= 60` lève `ValueError: The truth value of a Series is ambiguous` — les `and`/`or` de Python attendent un seul `True`/`False`, pas une Series entière de ceux-ci.
- **Oublier les parenthèses autour de chaque condition.** `df[df["quiz1"] >= 60 & df["quiz2"] >= 60]` (sans parenthèses) est un piège de priorité — `&` se lie *plus fort* que `>=`, donc cela s'analyse très différemment de ce que vous vouliez. Mettez toujours chaque condition entre parenthèses lors d'une combinaison avec `&`/`|`.
- **Confondre `.loc[0:2]` (inclusif) et `.iloc[0:2]` (exclusif).** C'est le bug `.loc`/`.iloc` le plus courant — revérifiez lequel vous utilisez chaque fois que le nombre de lignes d'un découpage semble décalé d'un cran.
- **Crochets simples quand vous vouliez un DataFrame.** `df["name", "quiz1"]` (crochets simples, virgule à l'intérieur) n'est pas valide — il vous faut la forme à double crochets `df[["name", "quiz1"]]`.

## 🧩 Défis

<Challenge id="dataanalysis-normal-w7-c1" answer={<><code>df[df["quiz1"] &gt;= 90]</code> — un masque booléen ne gardant que les lignes où quiz1 vaut au moins 90.</>}>

En utilisant `students-normal.csv`, sélectionnez toutes les lignes où `quiz1` vaut 90 ou plus.

</Challenge>

<Challenge id="dataanalysis-normal-w7-c2" answer={<><code>df[(df["quiz1"] &gt;= 60) &amp; (df["quiz2"] &gt;= 60) &amp; (df["quiz3"] &gt;= 60)]</code> — trois conditions enchaînées combinées avec <code>&amp;</code>, chacune entre parenthèses.</>}>

Sélectionnez les étudiants qui ont réussi (≥60) *les trois* quiz à la fois, en combinant trois conditions.

</Challenge>

<Challenge id="dataanalysis-normal-w7-c3" answer={<><code>df.iloc[0:3]</code> sélectionne les trois premières lignes par position ; <code>df.loc[0:3]</code> sélectionnerait les lignes étiquetées 0, 1, 2 et 3 — quatre lignes — puisque la borne de fin du découpage de <code>.loc</code> est inclusive.</>}>

Sélectionnez les 3 premières lignes du DataFrame en utilisant `.iloc`. Essayez ensuite `.loc[0:3]` — combien de lignes retourne-t-elle, et pourquoi cela diffère-t-il de `.iloc[0:3]` ?

</Challenge>

<Challenge id="dataanalysis-normal-w7-c4" answer={<><code>df[["name", "quiz1"]]</code> — double crochets : les crochets extérieurs indexent le DataFrame, les crochets intérieurs sont une liste Python de noms de colonnes.</>}>

Sélectionnez juste les colonnes `name` et `quiz1` ensemble, comme un DataFrame (pas une seule Series).

</Challenge>

<Challenge id="dataanalysis-normal-w7-c5" answer={<><code>df[df["name"].isin(["Amina", "Karim", "Sara"])]</code> — filtre pour ne garder que les lignes dont le nom correspond à l'une des trois valeurs données.</>}>

En utilisant `.isin()`, sélectionnez les lignes de trois étudiants spécifiques par leur nom (choisissez trois noms quelconques du jeu de données).

</Challenge>

<Challenge id="dataanalysis-normal-w7-c6" answer={<><code>df.loc[df["quiz1"] &lt; 60, ["name", "quiz1"]]</code> — combine un masque booléen (lignes) avec une liste de colonnes, en un seul appel .loc.</>}>

En utilisant `.loc` avec un masque booléen *et* une liste de colonnes dans le même appel, sélectionnez juste les colonnes `name` et `quiz1` pour les étudiants qui ont échoué à `quiz1` (en dessous de 60).

</Challenge>

## 🤔 Questions socratiques

- Pourquoi `df[df["quiz1"] >= 60 and df["quiz2"] >= 60]` (utilisant le `and` de Python) lève-t-il une erreur, alors que `df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]` (utilisant `&`) fonctionne ? Qu'est-ce que `and` essaie de faire avec deux Series entières qui n'a pas de sens ?
- Un masque booléen est lui-même simplement une `Series` de valeurs `True`/`False`, de la même forme que l'index de lignes du DataFrame. Que calculerait `mask.sum()`, et pourquoi ce nombre serait-il significatif ?
- Le fait que `.loc[0:2]` soit inclusif alors que `.iloc[0:2]` est exclusif est une source courante de bugs de décalage d'un cran. Pouvez-vous imaginer un cas où les *étiquettes* de lignes ne sont même pas des entiers (par ex. après un certain filtrage) — que signifierait alors `.loc[0:2]` ?
- `df["name"].isin([...])` et une chaîne de comparaisons `|` produisent les mêmes lignes. Au-delà d'être plus court à écrire, pouvez-vous imaginer une raison pour laquelle `.isin()` pourrait aussi être *moins* sujet aux erreurs pour une liste avec beaucoup de valeurs ?
- `~` inverse un masque booléen. `~(df["quiz1"] >= 60)` est-il toujours exactement identique à `df["quiz1"] < 60` ? Qu'est-ce qui pourrait les faire différer si la colonne avait des valeurs manquantes (`NaN`) dedans — un sujet que la semaine prochaine couvre en profondeur ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="data-analysis-normal-week-7"
  questions={[
    {
      id: 'q1',
      prompt: 'Quel opérateur combine deux masques booléens en pandas (pas and/or de Python) ?',
      options: ['and / or', '&& / ||', '& / |', 'les deux fonctionnent de façon identique'],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: '.loc sélectionne par :',
      options: ['Position uniquement', 'Étiquette', 'Accès aléatoire', 'Le dtype de la colonne'],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'df[df["score"] >= 60] fonctionne car df["score"] >= 60 produit :',
      options: [
        'Une seule valeur True/False',
        'Une Series booléenne, utilisée pour filtrer les lignes',
        'Un nouveau DataFrame avec une colonne',
        'Une SyntaxError',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'df[["name", "quiz1"]] (double crochets) retourne :',
      options: ['Une Series', 'Un DataFrame avec ces deux colonnes', 'Une seule valeur', 'Une liste de noms de colonnes'],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'df["quiz1"].between(60, 80) sélectionne les lignes où quiz1 est :',
      options: [
        'Exactement 60 ou exactement 80',
        'Entre 60 et 80, inclusivement',
        'Supérieur à 80 seulement',
        'Différent à la fois de 60 et de 80',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-7" />
