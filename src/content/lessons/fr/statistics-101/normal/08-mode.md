---
title: "Le mode"
description: "La valeur la plus fréquente : la seule mesure de centre qui fonctionne pour des étiquettes, et celle qui peut être absente."
module: "relationships"
order: 8
difficulty: "beginner"
estimatedMinutes: 14
learningObjectives:
  - "Trouver le mode d'une liste de nombres et d'une liste de catégories"
  - "Reconnaître des données sans mode ou avec plusieurs modes"
  - "Expliquer quand le mode est la seule mesure de centre valable"
  - "Décrire ce qu'une distribution bimodale suggère sur les données"
prerequisites: []
tags: ["mode", "catégoriel", "fréquence", "bimodal"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

Le **mode** est la valeur qui apparaît le plus souvent. Contrairement à la moyenne et à la médiane, il n'exige aucune arithmétique, seulement du comptage, ce qui en fait la seule mesure de centre qui fonctionne sur des noms, des couleurs et des catégories.

$$
\text{mode} = \text{la valeur dont la fréquence est la plus élevée.}
$$

Une liste peut n'avoir aucun mode (chaque valeur apparaît une fois) ou plusieurs modes (deux valeurs ou plus à égalité de fréquence maximale). Les deux cas sont normaux, et aucun n'est une erreur.

## Ce que cela apporte

Demandez « quelle est la couleur moyenne d'une voiture ? » et la moyenne ne veut rien dire tandis que la médiane n'est pas définie. Le mode répond : blanc, parce que le blanc se vend le plus.

Le mode vous dit aussi quelque chose que la moyenne et la médiane ne peuvent pas dire : où se trouve le *gros* des données. Si une distribution a deux sommets, la moyenne atterrit entre les deux, dans une vallée où presque aucune donnée ne se situe. Le mode pointe vers les sommets, et deux modes sont un fort indice que votre jeu de données est en réalité deux groupes collés ensemble.

## Calcul à la main

Pointures vendues dans une boutique en une journée :

$$
38,\;39,\;39,\;40,\;40,\;40,\;41,\;42,\;42
$$

Comptez chaque valeur : 38 une fois, 39 deux fois, 40 trois fois, 41 une fois, 42 deux fois. Le mode est 40, la pointure dont la boutique doit garder le plus de stock.

Maintenant la journée d'une seconde boutique :

$$
38,\;39,\;40,\;41,\;42
$$

Chaque valeur apparaît une fois. Il n'y a **aucun mode**, et c'est un résultat utile : aucune pointure ne domine, donc stockez de façon régulière plutôt que de surcharger une seule pointure.

## Données bimodales

Temps d'attente dans deux cliniques, rassemblés en une seule liste :

$$
5,\;6,\;6,\;7,\;8,\;30,\;31,\;31,\;32,\;33
$$

Il y a deux groupes, l'un autour de 6 minutes et l'autre autour de 31. La liste est **bimodale**. La moyenne vaut environ 18,9, une attente que personne n'a réellement vécue ; la médiane vaut environ 19,5, elle aussi non représentative. Les modes (6 et 31) sont les seuls résumés qui correspondent à ce qui se passe.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Une liste de clinique rassemblée montre deux groupes. Que feriez-vous avant de rapporter un seul nombre pour cette liste ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Séparer les données en deux groupes et décrire chacun séparément — probablement deux cliniques différentes, deux équipes ou deux types de patients. Une moyenne unique sur un jeu de données bimodal décrit un groupe qui n'existe pas, et rapporter seulement les modes cache la taille des deux groupes.</p>

</div>
</details>

## La même chose en Python

```python
sizes = [38, 39, 39, 40, 40, 40, 41, 42, 42]

from collections import Counter
counts = Counter(sizes)
print(counts.most_common(1))       # [(40, 3)]

from statistics import multimode
print(multimode([38, 39, 40, 41, 42]))   # [] — no mode at all
print(multimode([1, 1, 2, 2, 3]))        # [1, 2] — two modes
```

`Counter` est la manière honnête de voir la forme avant de la résumer ; `multimode` renvoie toutes les valeurs à égalité plutôt que d'en choisir une en silence.

## Quand l'utiliser

- **Données catégorielles** : couleurs, marques, services, types d'appareils — tout ce qui n'a ni ordre ni arithmétique.
- **Données discrètes avec une valeur dominante** : la pointure la plus courante, le code d'erreur le plus fréquent.
- **Trouver des sous-groupes** avant de résumer : deux modes sont un signal pour séparer les données.

## Limites

- **Il peut être absent** (rien ne se répète) ou ambigu (de nombreuses égalités), ce qui le rend inutilisable comme résumé unique dans ces cas.
- **Il ignore tout sauf le sommet.** Un petit changement dans une valeur peut créer ou détruire une égalité.
- **Pour des données continues, il est instable.** L'arrondi et la largeur des classes changent la réponse, donc il est rarement utilisé pour des mesures.
- **Il ne dit rien du reste de la distribution.**

## Pièges courants

- **Rapporter « aucun mode » comme une erreur.** C'est un résultat valable et il vaut la peine d'être énoncé.
- **Utiliser le mode pour des données numériques parce que c'est facile.** Pour des mesures, la moyenne ou la médiane portent bien plus d'information.
- **Ignorer un second mode** alors que c'est la chose la plus intéressante des données.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Réponses à une enquête : 12 personnes ont choisi « e-mail », 12 ont choisi « téléphone », 5 ont choisi « chat ». Quel est le mode, et que rapporteriez-vous ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Il y a deux modes, e-mail et téléphone, à égalité avec 12. Rapportez les deux, avec les effectifs : « e-mail et téléphone sont à égalité comme canaux préférés (12 chacun), le chat arrive loin derrière (5) ». N'en rapporter qu'un arbitrairement fait perdre une information que l'enquête a payée.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi le mode peut-il exister pour des données où la moyenne n'est pas définie ?
- Un jeu de données peut-il avoir un mode mais pas de moyenne ? Une moyenne mais pas de mode ?
- Si une distribution est bimodale, la moyenne est-elle fausse, ou est-ce la question qui est fausse ?
- Pourquoi le regroupement en classes de données continues change-t-il le mode ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-mode-fr">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Quand le mode est-il la seule mesure de centre appropriée ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Quand les données suivent une loi normale.</button>
      <button class="quiz-q__opt" data-idx="1">Quand les données sont catégorielles, sans ordre numérique.</button>
      <button class="quiz-q__opt" data-idx="2">Quand il y a des valeurs aberrantes.</button>
      <button class="quiz-q__opt" data-idx="3">Quand l'échantillon est très grand.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Les valeurs 1, 2, 2, 3, 4, 4, 5 ont quel(s) mode(s) ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">2 seulement.</button>
      <button class="quiz-q__opt" data-idx="1">Aucun mode.</button>
      <button class="quiz-q__opt" data-idx="2">2 et 4, à égalité.</button>
      <button class="quiz-q__opt" data-idx="3">3, la valeur du milieu.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
