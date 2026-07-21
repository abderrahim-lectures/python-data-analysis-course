---
title: "Semaine 6 : Le cadre de l'EDA"
sidebar_position: 1
section: data-analysis
track: hard
week: 6
description: "Apprenez le cadre de l'analyse exploratoire : formuler des questions et profiler un jeu de données avant de l'analyser."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 6 : Le cadre de l'EDA

<span className="gamified-flourish">🕵️ L'analyse exploratoire des données (EDA) n'est pas « faire quelques graphiques ». C'est une façon disciplinée de poser des questions à un jeu de données avant de faire confiance à une quelconque conclusion qui en découle.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Expliquer ce qu'est l'analyse exploratoire des données (EDA) et pourquoi elle précède toute modélisation ou conclusion.
- Profiler systématiquement un nouveau jeu de données : forme, dtypes, valeurs manquantes, et distributions de base.
- Formuler un ensemble de questions analytiques concrètes avant de vous lancer dans les graphiques.
- Reconnaître une distribution asymétrique à partir des seules statistiques descriptives, avant même de la tracer.
- Repérer les valeurs aberrantes probables en utilisant l'écart interquartile (IQR).

## Leçon

### Qu'est-ce que l'EDA ?

L'EDA est la pratique consistant à examiner la structure, la qualité et les motifs d'un jeu de données *avant* d'en tirer des conclusions — une liste de vérification contre le fait de sauter directement à « voici ma conclusion » sans d'abord vérifier que les données la soutiennent réellement. Le statisticien John Tukey, qui a popularisé le terme, l'a présenté comme un travail de détective : chercher des indices, formuler des hypothèses, puis les vérifier, plutôt que de supposer que le premier motif remarqué est réel.

Ce parcours de 5 semaines construit vers un seul livrable : un rapport d'EDA complet sur le jeu de données **Students Performance in Exams** à la semaine 10. Cette semaine met en place le *cadre* que vous appliquerez chaque semaine ensuite.

### Étape 1 : Profiler le jeu de données

Avant de poser une question intéressante quelconque, établissez les bases — le même premier geste qu'aux semaines 6/10 du parcours normal, mais traité ici comme une première étape formelle et reproductible de tout projet :

```python
import pandas as pd

df = pd.read_csv("students-performance.csv")
df.shape
df.dtypes
df.isna().sum()
df.describe()
df.head()
```

Pour chaque colonne, demandez-vous : de quel type de variable s'agit-il ?
- **Numérique/continue** (`math_score`, `reading_score`, `writing_score`) : résumée par moyenne, médiane, écart-type, forme de distribution.
- **Catégorielle** (`gender`, `lunch`, `test_preparation_course`, `parental_level_of_education`) : résumée par des comptages/proportions par catégorie, en utilisant `.value_counts()`.

```python
df["gender"].value_counts()
df["parental_level_of_education"].value_counts()
df["gender"].value_counts(normalize=True)   # as proportions (0-1) instead of raw counts
```

`normalize=True` est la version vectorisée de ce que vous calculeriez sinon à la main comme `count / total` — la même idée que les probabilités de mots du parcours difficile de Python 101, appliquée aux catégories plutôt qu'aux mots.

### Étape 2 : Formuler des questions avant de tracer des graphiques

Une erreur courante en EDA est de générer des dizaines de graphiques sans question directrice, puis de décider rétroactivement lesquels « semblent intéressants » — cela invite à voir des motifs qui ne sont que du bruit. À la place, notez un petit ensemble de questions spécifiques *avant* de visualiser, en vous basant sur ce à quoi les colonnes se rapportent plausiblement :

- La réussite de `test_preparation_course` est-elle associée à des scores plus élevés ?
- Le type de `lunch` (une approximation grossière du statut socio-économique dans ce jeu de données) est-il associé aux scores ?
- Les trois colonnes de score (`math`, `reading`, `writing`) sont-elles corrélées entre elles ?

Les semaines 7 à 9 construisent les outils pour répondre rigoureusement à exactement ce genre de questions ; la semaine 10 y répond de façon plus complète pour le rapport final.

### Étape 3 : Lire l'asymétrie à partir des seules statistiques descriptives

Avant même de tracer une distribution, `mean` contre `median` en suggère déjà la forme. Pour une distribution parfaitement symétrique, moyenne et médiane sont égales (ou très proches). Une moyenne notablement *supérieure* à la médiane suggère une asymétrie à droite (positive) — une poignée de valeurs inhabituellement élevées tirant la moyenne vers le haut ; une moyenne notablement *inférieure* à la médiane suggère une asymétrie à gauche (négative) :

```python
mean_score = df["math_score"].mean()
median_score = df["math_score"].median()
print(f"Mean: {mean_score:.1f}, Median: {median_score:.1f}")
```

Les histogrammes de la semaine prochaine vous laisseront *voir* cette forme directement, mais savoir la lire à partir de deux nombres seulement est une habitude utile avant même d'avoir chargé une bibliothèque de tracé.

### Étape 4 : Repérer les valeurs aberrantes avec l'IQR

L'**écart interquartile** (IQR) est l'intervalle entre le 25e et le 75e centile — les 50% du milieu des données — et offre un moyen robuste (non déformé par des valeurs extrêmes) de signaler des valeurs inhabituellement extrêmes :

$$
\text{IQR} = Q_3 - Q_1, \quad \text{aberrante si } x < Q_1 - 1.5 \cdot \text{IQR} \text{ ou } x > Q_3 + 1.5 \cdot \text{IQR}
$$

```python
q1 = df["math_score"].quantile(0.25)
q3 = df["math_score"].quantile(0.75)
iqr = q3 - q1
lower_bound = q1 - 1.5 * iqr
upper_bound = q3 + 1.5 * iqr

outliers = df[(df["math_score"] < lower_bound) | (df["math_score"] > upper_bound)]
len(outliers)
```

La règle $1.5 \times \text{IQR}$ est une convention largement utilisée (c'est aussi exactement ce que marquent les moustaches d'une boîte à moustaches, que la semaine 7 couvre) — pas une loi de la nature, juste un défaut raisonnable et standard pour « inhabituellement loin des 50% du milieu ».

### Étape 5 : Vérifier avant de faire confiance à un motif

Chaque statistique descriptive mérite un moment de scepticisme : sur combien de lignes celle-ci est-elle réellement basée ? Des données manquantes pourraient-elles la fausser ? Une différence entre deux groupes est-elle assez grande pour être intéressante, ou pourrait-elle plausiblement être du bruit issu d'un petit échantillon ?

```python
df.groupby("test_preparation_course")["math_score"].agg(["mean", "count"])
```

Vérifier `count` à côté de `mean` compte : une moyenne d'apparence frappante basée sur seulement 3 lignes mérite bien moins de confiance que la même moyenne basée sur 300.

## ⚠️ Erreurs courantes

- **Traiter la règle de valeur aberrante $1.5 \times \text{IQR}$ comme une vérité absolue.** C'est une convention, pas une loi — une « valeur aberrante » signalée pourrait être un point de donnée authentiquement correct, bien qu'inhabituel, pas une erreur à supprimer.
- **Confondre la direction de l'asymétrie.** Une asymétrie à droite (positive) signifie une *queue plus longue vers les valeurs élevées*, avec la moyenne tirée au-dessus de la médiane — il est facile de mal se souvenir de quelle direction est laquelle ; s'ancrer sur « moyenne contre médiane » plutôt que d'essayer de mémoriser « gauche/droite » évite la confusion.
- **Tracer des graphiques avant de formuler une question.** Il est tentant de sauter directement à `df.plot()` — résistez-y tant que vous n'avez pas noté ce que vous essayez réellement de découvrir, selon l'étape 2.

## 🧩 Défis

<Challenge id="dataanalysis-hard-w6-c1" answer={<><code>df["lunch"].value_counts()</code> — compte chaque catégorie distincte et sa fréquence d'apparition, triée par défaut de la plus à la moins courante.</>}>

Chargez `students-performance.csv` et utilisez `.value_counts()` pour voir la distribution des catégories de la colonne `lunch`.

</Challenge>

<Challenge id="dataanalysis-hard-w6-c2" answer={<>Notez au moins 2 à 3 questions spécifiques en langage clair (par ex. « Le niveau d'éducation parentale est-il associé à reading_score ? ») avant d'écrire le moindre code pandas pour y répondre — la discipline est dans l'ordre, pas dans le code lui-même.</>}>

Avant d'écrire le moindre code d'analyse, notez (dans une cellule markdown, ou simplement en commentaires) trois questions spécifiques auxquelles ce jeu de données pourrait plausiblement répondre, basées uniquement sur les noms de ses colonnes.

</Challenge>

<Challenge id="dataanalysis-hard-w6-c3" answer={<><code>df.groupby("parental_level_of_education")["writing_score"].agg(["mean", "count"])</code> — vérifier count à côté de mean révèle si la moyenne d'un groupe est basée sur trop peu de lignes pour être fiable.</>}>

Calculez le `writing_score` moyen groupé par `parental_level_of_education`, avec le nombre d'étudiants dans chaque groupe. Certains groupes sont-ils assez petits pour que leur moyenne mérite moins de confiance ?

</Challenge>

<Challenge id="dataanalysis-hard-w6-c4" answer={<>Calculez les trois : <code>df["math_score"].mean()</code>, <code>.median()</code>, <code>.std()</code>. Une moyenne bien au-dessus ou en dessous de la médiane, ou un écart-type très grand par rapport à l'intervalle de scores (0-100), seraient des signes d'une distribution asymétrique ou étalée qui mérite d'être investiguée avec un histogramme la semaine prochaine.</>}>

Calculez la moyenne, la médiane, et l'écart-type de `math_score`. En vous basant sur ces trois nombres seuls (pas encore de graphique), vous attendez-vous à ce que la distribution soit à peu près symétrique, ou asymétrique ?

</Challenge>

<Challenge id="dataanalysis-hard-w6-c5" answer={<>Calculez Q1, Q3, et l'IQR pour reading_score de la même façon que l'exemple math_score, puis filtrez les valeurs hors de [Q1 - 1.5*IQR, Q3 + 1.5*IQR] et comptez combien de lignes qualifient.</>}>

Répétez la vérification de valeurs aberrantes par IQR de l'étape 4, mais pour la colonne `reading_score` au lieu de `math_score`. Combien de valeurs aberrantes trouvez-vous ?

</Challenge>

<Challenge id="dataanalysis-hard-w6-c6" answer={<>Appelez df["test_preparation_course"].value_counts(normalize=True) pour obtenir la proportion ayant terminé contre n'ayant pas terminé la préparation au test, et multipliez par 100 (ou formatez en pourcentage) pour le lire comme un pourcentage.</>}>

En utilisant `.value_counts(normalize=True)`, quelle proportion d'étudiants a terminé le `test_preparation_course` ?

</Challenge>

## 🤔 Questions socratiques

- La présentation de Tukey de l'EDA comme « travail de détective » implique que vous formulez et testez des hypothèses, pas seulement que vous décrivez des données. Quelle est la différence pratique entre « les étudiants ayant terminé la préparation au test ont obtenu des scores plus élevés en moyenne » (une description) et traiter cela comme preuve que la préparation au test *cause* des scores plus élevés (une affirmation) ? De quoi auriez-vous besoin pour être plus confiant quant à la causalité ?
- Pourquoi la leçon insiste-t-elle pour noter les questions analytiques *avant* de générer des graphiques, plutôt qu'après ? Quel biais le fait de regarder les graphiques en premier introduit-il dans les « questions » que vous finissez par poser ?
- `df.groupby(...).agg(["mean", "count"])` a été utilisé spécifiquement pour qu'un groupe à petit échantillon ne soit pas confondu avec un motif fort. Pouvez-vous imaginer un groupe dans ce jeu de données où une grande différence de moyenne pourrait quand même ne pas être très significative, même avec un compte raisonnablement grand ?
- La règle de valeur aberrante $1.5 \times \text{IQR}$ signale des points comme « inhabituels » purement en fonction de leur position dans la distribution, sans aucune connaissance de *pourquoi* ils sont inhabituels. Pouvez-vous imaginer une raison légitime pour laquelle le score d'un étudiant pourrait être une véritable valeur aberrante sans être une erreur de saisie de données ?
- Comparer moyenne et médiane est un moyen peu coûteux de détecter l'asymétrie sans rien tracer. Quelle information cette astuce ne vous donne-t-elle *pas* qu'un véritable histogramme (la semaine prochaine) révélerait ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="data-analysis-hard-week-6"
  questions={[
    {
      id: 'q1',
      prompt: 'L\'EDA se décrit le mieux comme :',
      options: [
        'Construire un modèle prédictif le plus vite possible',
        'Examiner systématiquement la structure et la qualité d\'un jeu de données avant d\'en tirer des conclusions',
        'Faire autant de graphiques que possible',
        'Nettoyer les données uniquement, sans analyse',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Pour une colonne catégorielle, quelle méthode résume la distribution de ses catégories ?',
      options: ['.describe()', '.mean()', '.value_counts()', '.std()'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'Pourquoi vérifier count à côté de mean en comparant des groupes ?',
      options: [
        'Ce n\'est en fait pas utile',
        'Une moyenne frappante basée sur très peu de lignes mérite moins de confiance',
        'count est une syntaxe requise pour .groupby()',
        'Cela convertit la moyenne en pourcentage',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'La leçon recommande de formuler les questions analytiques :',
      options: [
        'Après avoir fait tous vos graphiques',
        'Seulement à la toute fin du rapport',
        'Avant de générer des graphiques, pour éviter de choisir rétroactivement des motifs "intéressants"',
        'Le moment n\'a pas d\'importance',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'Une moyenne notablement supérieure à la médiane suggère :',
      options: [
        'Une asymétrie à gauche (négative)',
        'Une asymétrie à droite (positive)',
        'Une distribution parfaitement symétrique',
        'Rien — moyenne et médiane ne sont pas liées',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-hard-week-6" />
