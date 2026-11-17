---
title: "Lire un jeu de données honnêtement"
description: "Un enchaînement qui attrape les erreurs décrites dans les leçons précédentes : regarder d'abord, grouper ensuite, résumer en dernier."
module: "samples-and-uncertainty"
order: 15
difficulty: "intermediate"
estimatedMinutes: 22
learningObjectives:
  - "Appliquer une séquence fixe de vérifications à un jeu de données inconnu"
  - "Comparer moyenne et médiane et utiliser l'écart comme diagnostic"
  - "Détecter les valeurs suspectes avec des bornes et les inspecter avant de retirer quoi que ce soit"
  - "Rapporter un résumé qui énonce ses propres limites"
prerequisites: []
tags: ["flux-de-travail", "qualité-des-données", "valeurs-aberrantes", "rapport"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

Cette leçon est une liste de contrôle plutôt qu'une nouvelle quantité. Chaque mesure de ce cours est facile à calculer et facile à mal employer, et le mauvais emploi vient presque toujours d'une étape sautée plutôt que d'une formule fausse.

La séquence qui prévient la plupart des problèmes :

1. **Regardez les données** avant de les résumer : effectifs, valeurs manquantes, types et un histogramme.
2. **Calculez le centre de deux façons** et comparez-les ; un grand écart renseigne sur la forme.
3. **Mesurez la dispersion de deux façons** et comparez-les ; le même écart réapparaît.
4. **Signalez les valeurs suspectes** et inspectez chacune plutôt que de la supprimer.
5. **Groupez avant de rassembler** quand les données sont arrivées par lots ou par catégories.
6. **Rapportez le résumé avec son incertitude et ses limites.**

## Ce que cela apporte

Une analyse qui saute l'étape 1 est un calcul, pas une analyse. La liste transforme les leçons individuelles en habitude, et c'est l'habitude qui attrape le paradoxe de Simpson, une valeur aberrante qui était une faute de frappe, et une moyenne qui ne décrit personne.

## Exemple travaillé

Un jeu de données de 12 tickets de support, temps de résolution en heures :

$$
1,\;2,\;2,\;3,\;3,\;4,\;5,\;6,\;8,\;12,\;20,\;96
$$

**Étape 1 — regardez.** Douze valeurs, toutes numériques, aucune entrée manquante évidente. Le maximum est très loin du reste.

**Étape 2 — le centre de deux façons.** Moyenne : total 162, donc 13,5. Médiane : $(4+5)/2 = 4.5$. Un écart de 9 heures : les données ont une longue queue à droite.

**Étape 3 — la dispersion de deux façons.** Écart type environ 27,6 ; écart interquartile : $Q_1 = 2.75$, $Q_3 = 11$, donc 8,25. L'écart type vaut plus de trois fois l'écart interquartile, ce qui dit autrement que la queue le domine.

**Étape 4 — signalez et inspectez.** Borne haute : $11 + 1.5(8.25) \approx 23.4$. Le 96 est signalé. Inspectez-le : s'il s'agit d'un ticket rouvert après un mois, c'est peut-être un cas réel mais qui relève d'un autre processus ; si c'est une erreur de saisie (96 minutes enregistrées comme des heures), corrigez-la. Ne la supprimez pas en silence.

**Étape 5 — groupez.** Ces tickets viennent-ils d'une équipe ou de plusieurs ? Un mélange de files faciles et difficiles produirait exactement cette forme.

**Étape 6 — rapportez.** Quelque chose comme : « Le temps de résolution médian était de 4,5 heures (IQR 2,75–11). La moyenne, 13,5 heures, est tirée vers le haut par un ticket de 96 heures ; elle ne décrit pas un ticket typique. En excluant ce cas, la médiane ne change pas et la moyenne tombe à 6,0. »

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Un collègue rapporte « temps de réponse moyen 13,5 heures » pour ces tickets. Quel unique nombre supplémentaire demanderiez-vous en premier, et pourquoi ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> La médiane. Elle vaut 4,5 heures ici contre une moyenne de 13,5, et cet écart en dit plus au lecteur sur le jeu de données que la moyenne seule. Savoir si le cas de 96 heures est réel est la deuxième question.</p>

</div>
</details>

## La même chose en Python

```python
from statistics import mean, median, stdev, quantiles

hours = [1, 2, 2, 3, 3, 4, 5, 6, 8, 12, 20, 96]

q1, _, q3 = quantiles(hours, n=4)
iqr = q3 - q1
print('n', len(hours))
print('mean', round(mean(hours), 2), 'median', median(hours))
print('sd', round(stdev(hours), 2), 'iqr', iqr)
print('fences', round(q1 - 1.5*iqr, 2), round(q3 + 1.5*iqr, 2))
print('flagged', [h for h in hours if h < q1 - 1.5*iqr or h > q3 + 1.5*iqr])
```

pandas donne le même résumé en un appel et rend triviale la vérification des valeurs manquantes :

```python
import pandas as pd

s = pd.Series(hours)
print(s.describe())
print(s.isna().sum())
```

## Un modèle de rapport

La forme d'un résumé qui survit à la relecture :

- **ce qui a été mesuré**, avec les unités et la taille de l'échantillon ;
- **le centre**, en donnant la médiane d'abord quand les données sont asymétriques ;
- **la dispersion**, en choisissant l'écart interquartile ou l'écart type en cohérence avec le centre ;
- **ce qui a été exclu et pourquoi**, jamais une suppression silencieuse ;
- **ce qu'il ne peut pas vous dire**, en une phrase.

## Quand l'utiliser

À chaque fois. La liste est plus précieuse sur des données que vous n'avez pas collectées, c'est-à-dire la plupart des données.

## Limites

- **La liste ne remplace pas la connaissance du domaine.** Qu'un ticket de 96 heures soit plausible dépend de ce qu'est un ticket.
- **Elle attrape mieux les problèmes à une variable.** Les relations exigent un nuage de points, et le groupement exige assez de données par groupe pour être significatif.
- **C'est un point de départ, pas une analyse complète.** Les questions sur l'évolution dans le temps, ou sur une affirmation causale précise, exigent leurs propres plans d'étude.

## Pièges courants

- **Supprimer les valeurs aberrantes avant de les inspecter.** Souvent les cas les plus informatifs, et la suppression biaise chaque nombre qui suit.
- **Rapporter seulement la moyenne**, ce qui cache entièrement la forme.
- **Rassembler des groupes** avant de vérifier s'ils diffèrent.
- **Afficher deux décimales** sur une mesure enregistrée à l'heure près.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Concevez le résumé en trois lignes que vous enverriez à un responsable qui n'a jamais entendu parler de médiane, en utilisant les données de tickets de support, sans aucun jargon statistique.

<p class="challenge__answer">💡 <strong>Réponse :</strong> « La moitié des tickets ont été clos en 4,5 heures ou moins, et la moitié ont pris plus longtemps. Un ticket typique se situe entre environ 3 et 11 heures. Un ticket a pris 96 heures, et c'est lui qui fait monter la moyenne à 13,5 ; ce cas mérite une vérification avant d'annoncer la moyenne aux clients. » Aucun jargon, et chaque nombre porte son sens.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi comparer la moyenne et la médiane est-il un diagnostic peu coûteux de la forme des données ?
- Quand l'écart type est-il un meilleur compagnon de la moyenne que l'écart interquartile ?
- Quelle est la différence entre une erreur et une valeur aberrante ?
- S'il vous faut rapporter un seul nombre pour un jeu de données asymétrique, lequel choisiriez-vous, et qu'y ajouteriez-vous ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-reading-data-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. La moyenne est 40 et la médiane est 25. Que suggère l'écart ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Une erreur de calcul.</button>
      <button class="quiz-q__opt" data-idx="1">Les données sont symétriques.</button>
      <button class="quiz-q__opt" data-idx="2">Une distribution asymétrique à droite, avec de grandes valeurs qui tirent la moyenne vers le haut.</button>
      <button class="quiz-q__opt" data-idx="3">L'échantillon est trop petit.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Vous trouvez une valeur au-dessus de la borne 1,5 × IQR. Que devez-vous faire d'abord ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La supprimer et recalculer.</button>
      <button class="quiz-q__opt" data-idx="1">L'inspecter pour décider s'il s'agit d'une erreur, d'un autre processus ou d'un cas extrême réel.</button>
      <button class="quiz-q__opt" data-idx="2">La remplacer par la moyenne.</button>
      <button class="quiz-q__opt" data-idx="3">Rapporter seulement la moyenne, en l'ignorant.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
