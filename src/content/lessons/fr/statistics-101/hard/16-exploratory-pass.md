---
title: "Une passe exploratoire"
description: "Douze vérifications sur un jeu de données réel, dans l'ordre, avec le raisonnement de chacune consigné."
module: "applied-statistics"
order: 16
difficulty: "advanced"
estimatedMinutes: 35
learningObjectives:
  - "Profiler les types, les manques et les plages d'un CSV avant de le résumer"
  - "Comparer la moyenne, la médiane et l'écart interquartile et consigner la forme qu'ils impliquent"
  - "Justifier chaque exclusion par une raison énoncée, pas par un seuil seul"
  - "Rédiger une découverte exploratoire séparément d'une découverte confirmée"
prerequisites: []
tags: ["eda", "profilage-de-données", "visualisation", "rapport"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 20
section: "statistics-101"
track: "hard"
---

## Ce que cela signifie

Une **passe exploratoire** est une séquence fixe de vérifications exécutée avant de tirer quelque conclusion que ce soit. Son produit n'est pas un résultat mais un ensemble de décisions consignées : ce qui manque, ce qui est invraisemblable, ce qui est groupé, et ce que vous affirmez et n'affirmez pas par conséquent.

La discipline consiste à séparer *regarder* de *conclure*. Les découvertes exploratoires sont des hypothèses ; les découvertes confirmatoires sont testées sur des données sur lesquelles l'hypothèse n'a pas été formée.

## Les douze vérifications

1. **La forme du tableau** — lignes, colonnes, et ce que représente une ligne.
2. **Les types** — quelles colonnes sont des nombres arrivés en texte.
3. **Les manques** — le compte par colonne, et s'ils se concentrent par groupe.
4. **Les plages** — minimum et maximum par colonne numérique, à la recherche de valeurs impossibles.
5. **Les doublons** — lignes exactes et identifiants répétés.
6. **Le centre** — moyenne et médiane côte à côte.
7. **La dispersion** — écart type et écart interquartile côte à côte.
8. **La queue** — combien de valeurs dépassent les bornes, et lesquelles.
9. **Les groupes** — les résumés diffèrent-ils selon la catégorie, le site ou le lot ?
10. **Les relations** — des nuages de points avant tout nombre de corrélation.
11. **Les décisions** — chaque exclusion, avec une raison consignée.
12. **Les affirmations** — un paragraphe sur ce que les données soutiennent, et un sur ce qu'elles ne soutiennent pas.

## Exemple travaillé

Le cours fournit un jeu de données de résultats d'étudiants. Profilez-le d'abord :

```python
import pandas as pd

df = pd.read_csv('students-performance.csv')
print(df.shape)          # how many rows, columns
print(df.dtypes)         # check that scores are numbers
print(df.isna().sum())   # missing per column
print(df.describe())     # ranges, centre, spread in one view
```

**Ce que la sortie vous dit, dans l'ordre.**

- Si `shape` affiche plus de lignes que prévu, vérifiez les doublons avant d'aller plus loin.
- Si une colonne de score a le type `object`, elle contient une valeur parasite comme `"absent"` et toute opération arithmétique après cela sera fausse ou silencieusement ignorée.
- Si `isna().sum()` n'est pas nul, décidez maintenant s'il faut supprimer, remplir ou modéliser les manques ; le choix doit être consigné.
- Si `describe()` affiche un minimum de 0 dans une colonne de score, ce peut être un marqueur d'absence plutôt qu'un vrai zéro.

Vérifiez ensuite la forme d'un score :

```python
score = df['math score']
print(score.mean(), score.median())
q1, q3 = score.quantile([.25, .75])
print(q1, q3, q3 - q1)
print((score < q1 - 1.5*(q3-q1)).sum(), (score > q3 + 1.5*(q3-q1)).sum())
```

**Lecture.** Si la moyenne et la médiane ne diffèrent que d'un point ou deux, la distribution est proche de la symétrie et l'un ou l'autre centre convient. Si l'écart type est bien plus grand que l'écart interquartile divisé par 1,35, les queues sont plus lourdes qu'une forme normale et la moyenne est tirée. Si les comptes aux bornes ne sont pas nuls, inspectez ces lignes individuellement.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

`describe()` affiche un minimum de 0 et un maximum de 100 pour un cours de préparation à l'examen, avec une moyenne de 35. Cela justifie-t-il de traiter 0 comme « aucune préparation » ou comme donnée manquante ? Que regarderiez-vous ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> La distribution décide. Si la colonne est par ailleurs continue et qu'une grande part se situe exactement à 0, c'est probablement une catégorie « aucun » réelle ou une valeur par défaut ; si seulement une poignée se situent à 0 tandis que le reste est étalé, ce sont plus probablement des valeurs manquantes codées en 0. Croisez les 0 avec une autre variable (par exemple le niveau d'éducation des parents, qui devrait être sans lien avec les manques) pour vérifier s'ils se comportent comme de vraies observations.</p>

</div>
</details>

## Consigner les décisions

Le produit de cette leçon est un court journal, une ligne par décision :

```
Supprimé 3 lignes : identifiants d'étudiants en double (2) et un score de 1000 (saisie).
Conservé 12 lignes avec test prep = 0 : distribution continue, aucune autre colonne manquante pour elles.
Groupé par préparation à l'examen : « none » et « completed » diffèrent de 8 points en lecture comme en écriture.
```

Ce journal est ce qui rend l'analyse vérifiable. Sans lui, un lecteur ne peut pas distinguer une exclusion réfléchie d'une exclusion commode.

## Quand l'utiliser

Avant toute analyse confirmatoire, et avant de transmettre des données à quiconque. Elle coûte peu — quelques minutes — comparée au coût d'une conclusion bâtie sur une colonne mal lue.

## Limites

- **Les découvertes exploratoires ne sont pas des preuves.** La même passe qui trouve un motif engendre aussi l'hypothèse, donc le motif doit être vérifié sur des données fraîches.
- **Elle passe mal à l'échelle sans groupement.** Pour des milliers de catégories, les douze vérifications exigent une stratégie d'échantillonnage plutôt qu'une liste complète.
- **Elle ne peut pas détecter ce qui n'est pas dans les données.** Les groupes manquants, les échecs non enregistrés et le biais de survie sont invisibles pour un profil de ce qui a été collecté.

## Pièges courants

- **La conversion silencieuse.** Convertir du texte en nombres avec `pd.to_numeric(errors='coerce')` transforme les valeurs invalides en manquantes, donc le compte des manques bondit ; les deux doivent être consignés.
- **Laisser `describe()` tenir lieu de graphique.** Il cache entièrement les pics multiples.
- **Supprimer la queue avant de vérifier s'il s'agit d'une vraie sous-population.**

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Votre profil montre deux pics dans l'histogramme des scores. Quelles sont les deux explications les plus probables, et qu'est-ce qui les distinguerait ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Soit le jeu de données contient deux populations différentes (par exemple deux écoles, ou deux sessions d'examen), soit la mesure est censurée ou arrondie d'une manière qui entasse les valeurs. Distinguez-les en colorant l'histogramme selon une variable de groupement candidate ; si les pics se séparent nettement, ce sont deux populations, et tout résumé rassemblé doit être scindé selon cette variable.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi est-il important de consigner les décisions plutôt que seulement leurs résultats ?
- Laquelle des douze vérifications attraperait le paradoxe de Simpson avant que vous ne rapportiez quoi que ce soit ?
- Si une colonne a 30 % de valeurs manquantes, quelles sont trois façons légitimes de procéder, et que suppose chacune ?
- Pourquoi une découverte exploratoire est-elle une preuve plus faible qu'une découverte confirmatoire, même quand les nombres sont identiques ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-eda-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Une colonne numérique arrive avec le type object. Quelle est la première chose à vérifier ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La moyenne.</button>
      <button class="quiz-q__opt" data-idx="1">La corrélation avec les autres colonnes.</button>
      <button class="quiz-q__opt" data-idx="2">Quelles entrées ne sont pas des nombres analysables, et ce qu'elles représentent.</button>
      <button class="quiz-q__opt" data-idx="3">S'il faut supprimer la colonne.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">2. Pourquoi consigner une décision d'exclusion ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Pour allonger le rapport.</button>
      <button class="quiz-q__opt" data-idx="1">Parce que le logiciel l'exige.</button>
      <button class="quiz-q__opt" data-idx="2">Pour accélérer l'analyse suivante.</button>
      <button class="quiz-q__opt" data-idx="3">Pour qu'un lecteur distingue un choix réfléchi d'un choix commode, et puisse le reproduire.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
