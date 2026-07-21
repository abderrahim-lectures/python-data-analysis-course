---
title: "Semaine 9 : Groupby, agrégation et fusion"
sidebar_position: 4
section: data-analysis
track: normal
week: 9
description: "Groupez, agrégez et fusionnez des jeux de données avec pandas pour répondre à des questions impliquant plusieurs tables."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 9 : Groupby, agrégation et fusion

<span className="gamified-flourish">🗂️ « Découper le jeu de données en groupes, puis résumer chaque groupe » tient en une phrase en pandas et environ dix lignes en Python pur.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Partitionner un DataFrame en groupes avec `.groupby()`, et expliquer le lien avec le partitionnement d'un ensemble.
- Calculer des agrégats par groupe (`.mean()`, `.sum()`, `.count()`, et plusieurs à la fois avec `.agg()`).
- Grouper par plus d'une colonne à la fois, et retransformer un résultat groupé en un DataFrame ordinaire.
- Combiner deux DataFrames avec `.merge()`, en faisant correspondre les lignes par une clé commune.

## Leçon

### `.groupby()` : partitionner un ensemble

Rappelez-vous qu'une **partition** d'un ensemble $S$ le divise en sous-ensembles disjoints dont l'union est $S$. `.groupby("column")` fait exactement cela : elle divise les lignes d'un DataFrame en groupes, un par valeur distincte de cette colonne :

```python
df.groupby("lunch")               # a GroupBy object — groups formed, nothing computed yet
df.groupby("lunch")["math_score"].mean()   # mean math_score within each lunch group
```

Rien n'est calculé tant que vous n'y attachez pas une agrégation — `.groupby()` seul ne fait que décrire *comment* diviser les lignes.

### Agréger

Les agrégations standard correspondent directement à des statistiques que vous connaissez déjà :

```python
df.groupby("lunch")["math_score"].mean()     # average math_score per lunch type
df.groupby("lunch")["math_score"].count()     # how many rows (students) per group
df.groupby("lunch").agg({                      # multiple columns/stats at once
    "math_score": "mean",
    "reading_score": "mean",
})
```

`.groupby(...)[...]` se lit de gauche à droite comme « partitionne par cette colonne, puis regarde cette autre colonne au sein de chaque partie » — la formulation pandas de « pour chaque groupe, calcule une statistique sur une variable différente ».

### Grouper par plus d'une colonne

Passer une *liste* de noms de colonnes groupe par chaque combinaison unique de leurs valeurs à la fois — la même idée que partitionner par une paire $(a, b)$ au lieu d'une seule valeur :

```python
df.groupby(["lunch", "gender"])["math_score"].mean()
```

Cela répond à une question plus spécifique que chaque colonne prise isolément : l'effet de `lunch` sur `math_score` se maintient-il de la même façon au sein de chaque `gender`, ou semble-t-il différent une fois que vous les séparez ?

### Récupérer un DataFrame ordinaire

Un résultat groupby-agrégat utilise la ou les colonnes groupées comme index plutôt qu'un simple index de lignes `0, 1, 2, ...` — pratique pour d'autres recherches, mais parfois vous voulez récupérer un DataFrame ordinaire (par exemple, pour le trier, ou le fusionner avec autre chose). `.reset_index()` fait cela :

```python
summary = df.groupby("lunch")["math_score"].mean().reset_index()
# lunch          math_score
# free/reduced   58.2
# standard       66.9

summary.sort_values("math_score", ascending=False)   # now a plain column you can sort by
```

### Fusionner : combiner deux DataFrames

`.merge()` joint deux DataFrames sur une colonne clé commune, la même idée qu'une jointure de base de données ou faire correspondre des entrées entre deux tables de recherche par un identifiant commun :

```python
students = pd.DataFrame({"student_id": [1, 2, 3], "name": ["Amina", "Youssef", "Sara"]})
grades = pd.DataFrame({"student_id": [1, 2, 3], "grade": ["A", "B", "A"]})

merged = students.merge(grades, on="student_id")
# student_id | name    | grade
#     1      | Amina   |   A
#     2      | Youssef |   B
#     3      | Sara    |   A
```

`how="inner"` (par défaut) ne garde que les lignes où la clé existe dans les *deux* DataFrames ; `how="left"`/`"right"`/`"outer"` contrôlent ce qui arrive aux lignes dont la clé est absente de l'autre côté — à vérifier explicitement chaque fois que les nombres de lignes pourraient ne pas correspondre après une fusion. Si les colonnes clés ont des noms différents dans chaque DataFrame, utilisez `left_on`/`right_on` au lieu de `on` :

```python
students.merge(scores, left_on="student_id", right_on="id")
```

## ⚠️ Erreurs courantes

- **Oublier que `.groupby()` seul ne calcule rien.** `df.groupby("lunch")` seul n'est qu'une description de la division — il vous faut toujours une agrégation (`.mean()`, `.agg(...)`, etc.) attachée pour réellement voir des chiffres.
- **Supposer qu'une fusion préserve le nombre de lignes d'origine.** Une `merge` avec une clé dupliquée d'un côté ou de l'autre peut produire *plus* de lignes qu'aucune des entrées n'en avait — vérifiez toujours `.shape` après une fusion dont vous n'êtes pas sûr à 100%.
- **Ne pas vérifier `how=` explicitement.** Le `"inner"` par défaut supprime silencieusement toute ligne dont la clé n'existe pas de l'autre côté — correct quand c'est réellement ce que vous voulez, mais cela mérite d'être un choix délibéré, pas un accident.
- **Oublier `.reset_index()` quand vous avez besoin de récupérer une colonne ordinaire.** Essayer de faire `.sort_values()` ou `.merge()` en utilisant l'index d'un résultat groupby (plutôt qu'une colonne normale) comme si c'était une colonne normale échouera ou se comportera de façon inattendue tant que vous n'aurez pas fait `.reset_index()`.

## 🧩 Défis

<Challenge id="dataanalysis-normal-w9-c1" answer={<><code>df.groupby("gender")["math_score"].mean()</code> — groupe les étudiants par genre, puis fait la moyenne de math_score au sein de chaque groupe.</>}>

En utilisant un DataFrame de type performances d'étudiants (colonnes incluant `gender` et `math_score`), calculez le `math_score` moyen pour chaque `gender`.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c2" answer={<><code>df.groupby("test_preparation_course")["math_score"].agg(["mean", "count"])</code> — <code>.agg</code> avec une liste calcule plusieurs statistiques pour la même colonne à la fois, comme colonnes de résultat séparées.</>}>

Groupez par `test_preparation_course` et calculez *à la fois* la moyenne et le compte de `math_score` pour chaque groupe, en un seul appel `.agg(...)`.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c3" answer={<>Comparez <code>df.groupby("lunch")["reading_score"].mean()</code> entre les deux catégories de lunch directement — la catégorie dont la moyenne est la plus élevée répond à la question.</>}>

Quelle catégorie `lunch` a un `reading_score` moyen plus élevé ? Répondez en utilisant `.groupby()`, pas un filtrage manuel.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c4" answer={<>Créez deux petits DataFrames partageant une colonne clé (par ex. <code>student_id</code>) et appelez <code>left.merge(right, on="student_id")</code> ; essayez des clés non correspondantes de chaque côté pour voir comment <code>how="inner"</code> supprime silencieusement les lignes non appariées par rapport à <code>how="outer"</code>.</>}>

Créez deux petits DataFrames à la main (par ex. un avec des noms d'étudiants, un avec un score séparé pour chacun), partageant une colonne clé commune, et fusionnez-les. Essayez ensuite de désaccorder une clé exprès et observez ce que fait `how="inner"` avec elle par rapport à `how="outer"`.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c5" answer={<><code>df.groupby(["lunch", "test_preparation_course"])["math_score"].mean()</code> — groupe par chaque combinaison des deux colonnes, montrant si les effets se combinent, s'annulent, ou se maintiennent indépendamment.</>}>

Groupez à la fois par `lunch` et `test_preparation_course`, et calculez le `math_score` moyen pour chaque combinaison. Le motif du Défi 3 se maintient-il au sein des *deux* groupes de préparation au test, ou semble-t-il différent ?

</Challenge>

<Challenge id="dataanalysis-normal-w9-c6" answer={<>Enchaînez .reset_index() après le groupby-agrégat, puis .sort_values("math_score", ascending=False) sur la colonne ordinaire résultante, par ex. df.groupby("lunch")["math_score"].mean().reset_index().sort_values("math_score", ascending=False).</>}>

Prenez votre résultat du Défi 1 (`math_score` moyen par `gender`), transformez-le en DataFrame ordinaire avec `.reset_index()`, et triez-le du plus élevé au plus bas en moyenne.

</Challenge>

## 🤔 Questions socratiques

- `.groupby("lunch")` seul (sans agrégation attachée) n'affiche pas une table de chiffres — que pensez-vous qu'il retourne réellement, et pourquoi pandas attend-il de calculer quoi que ce soit jusqu'à ce que vous spécifiiez une agrégation ?
- Si deux DataFrames à fusionner partagent une colonne clé mais qu'un des DataFrames a une clé *dupliquée* (deux lignes avec le même `student_id`), que prédisez-vous qu'il arrive au nombre de lignes après fusion ? Testez-le.
- `.groupby(...).agg({...})` vous permet d'appliquer une agrégation *différente* à chaque colonne (par ex. la moyenne de l'une, le max d'une autre) en un seul appel. Pourquoi faire la moyenne de chaque colonne avec la même statistique pourrait-il ne pas toujours avoir de sens pour un vrai jeu de données ?
- Grouper par deux colonnes à la fois (`["lunch", "test_preparation_course"]`) peut révéler un motif que grouper par une seule colonne cache, ou faire qu'un motif qui semblait fort semble en réalité plus faible une fois que vous tenez compte du second facteur. Pourquoi diviser en groupes plus fins change-t-il parfois autant l'histoire ?
- Un résultat groupby-agrégat utilise la colonne groupée comme index au lieu d'un simple index entier. Quelle différence pratique cela fait-il la première fois que vous essayez d'utiliser `.iloc[0]` dessus, par rapport à sur un DataFrame ordinaire ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="data-analysis-normal-week-9"
  questions={[
    {
      id: 'q1',
      prompt: 'df.groupby("lunch") seul (sans agrégation attachée) fait quoi ?',
      options: [
        'Affiche immédiatement les moyennes des groupes',
        'Décrit comment diviser les lignes en groupes, sans rien calculer encore',
        'Lève une erreur',
        'Supprime les lignes avec des valeurs de lunch manquantes',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Quel type de fusion ne garde que les lignes dont la clé existe dans les deux DataFrames ?',
      options: ['outer', 'left', 'inner', 'cross'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'df.groupby("lunch").agg({"math_score": "mean", "reading_score": "mean"}) calcule :',
      options: [
        'Une seule moyenne combinée sur les deux colonnes',
        'La moyenne de chaque colonne listée, séparément, au sein de chaque groupe',
        'Une fusion entre math_score et reading_score',
        'La moyenne globale, en ignorant les groupes',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Un .merge() de DataFrame est conceptuellement le plus similaire à :',
      options: [
        'Un filtre par masque booléen',
        'Trier par une colonne',
        'Une jointure de type base de données sur une clé commune',
        'Supprimer les valeurs manquantes',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'Que fait .reset_index() après un groupby-agrégat ?',
      options: [
        'Supprime les valeurs agrégées',
        'Retransforme la colonne groupée en une colonne ordinaire, avec un index entier normal',
        'Regroupe les données à nouveau',
        'Fusionne avec un autre DataFrame',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-9" />
