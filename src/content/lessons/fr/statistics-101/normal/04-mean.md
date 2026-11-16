---
title: "La moyenne"
description: "Additionnez toutes les valeurs, divisez par leur nombre : ce que dit vraiment la moyenne, et le cas où elle ment."
module: "describing-data"
order: 4
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Calculer la moyenne à la main à partir d'une petite liste de nombres"
  - "Calculer la même moyenne en Python avec du code simple et avec statistics.mean"
  - "Expliquer la moyenne comme le point d'équilibre des données"
  - "Reconnaître quand une seule valeur extrême éloigne la moyenne du reste"
prerequisites: []
tags: ["moyenne", "moyenne-arithmétique", "statistique-descriptive", "centre"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

La **moyenne** est le nombre que chaque valeur devrait avoir si toutes étaient égales et que le total restait le même. On la calcule en additionnant toutes les valeurs et en divisant par leur nombre.

Pour les valeurs $x_1, x_2, \dots, x_n$ :

$$
\bar{x} = \frac{x_1 + x_2 + \cdots + x_n}{n} = \frac{1}{n}\sum_{i=1}^{n} x_i
$$

Lisez le membre de droite comme une consigne : *additionnez les $x$, puis partagez le total à parts égales entre $n$ places.* Rien n'est caché dans cette formule, et c'est sa force.

## Ce que cela apporte

Un seul nombre résume beaucoup de nombres. Au lieu de garder en tête 200 prix de vélos, vous retenez un nombre qui préserve une propriété importante de la liste entière : son total. Si vous connaissez la moyenne et l'effectif, vous pouvez retrouver la somme exactement :

$$
\text{somme} = n \cdot \bar{x}.
$$

Aucune autre mesure de centre ne conserve le total. C'est pourquoi la moyenne apparaît partout où l'argent est en jeu, du panier moyen au PIB par habitant : les totaux comptent, et la moyenne est le total divisé par l'effectif.

## Calcul à la main

Prenez cinq durées de livraison en minutes :

$$
8,\; 12,\; 10,\; 15,\; 45
$$

Étape 1 — additionnez-les :

$$
8 + 12 + 10 + 15 + 45 = 90
$$

Étape 2 — divisez par l'effectif, $n = 5$ :

$$
\bar{x} = \frac{90}{5} = 18
$$

La durée moyenne de livraison est de 18 minutes. Vérifiez le sens : si les cinq livraisons avaient pris 18 minutes chacune, le total serait toujours de 90. C'est exactement ce que promet la moyenne.

## La même chose en Python

```python
times = [8, 12, 10, 15, 45]

total = sum(times)
n = len(times)
print(total / n)                 # 18.0
```

Passer d'abord par le calcul à la main compte, parce que la version de bibliothèque cache les deux étapes. La bibliothèque standard de Python fait le même calcul :

```python
from statistics import mean

print(mean([8, 12, 10, 15, 45]))  # 18
```

Les deux sont correctes. La forme longue vaut la peine d'être connue, car lorsque le résultat semble faux, il faut savoir quelle partie vérifier.

## Quand une valeur la tire

Regardez à nouveau ces cinq durées. Quatre d'entre elles se situent entre 8 et 15 minutes. La cinquième vaut 45. La moyenne, 18, est supérieure à quatre des cinq valeurs : elle se situe au-dessus de la plupart des données.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Retirez la livraison de 45 minutes. Quelle est la moyenne des quatre restantes ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> $(8+12+10+15)/4 = 45/4 = 11.25$. Une valeur sur cinq a fait passer la moyenne de 11,25 à 18, un déplacement de 6,75 minutes, tandis que quatre valeurs n'ont presque pas bougé. Retirez le 45 de l'image et la moyenne retombe.</p>

</div>
</details>

Cette sensibilité n'est pas un défaut à corriger ; c'est la moyenne qui fait son travail. Une livraison de 45 minutes contribue réellement 45 minutes au total, et la moyenne est construite à partir des totaux. Le problème n'apparaît que lorsque vous utilisez la moyenne pour décrire une valeur *typique* alors que les données contiennent quelques valeurs qui ne sont pas typiques.

## Le voir géométriquement

Chaque valeur peut être représentée par un point sur une droite, et la moyenne est le point où la droite s'équilibre, comme une balançoire avec des poids :

- une valeur éloignée de la moyenne tire plus fort, car sa distance pèse davantage ;
- les distances au-dessus et en dessous de la moyenne s'annulent exactement.

Vous pouvez déplacer des points sur une droite graduée et regarder le point d'équilibre bouger dans l'[explorateur moyenne et médiane de GeoGebra](https://www.geogebra.org/m/zsbf4jqm). Remarquez ce qui se passe quand vous déplacez un point loin vers la droite : le point d'équilibre le suit.

## Quand l'utiliser

- Vous vous intéressez au **total**, pas aux individus : dépense moyenne par client, score moyen, température moyenne.
- Les données sont à peu près symétriques, sans valeurs extrêmes d'un côté.
- Vous ferez des calculs avec ensuite : les moyennes s'additionnent d'une manière que les médianes ne permettent pas, et c'est pourquoi presque toutes les formules de la suite de ce cours utilisent la moyenne.

## Limites

- **Elle est tirée par les valeurs aberrantes.** Une seule valeur très grande ou très petite peut l'éloigner fortement du reste des données.
- **Elle exige des nombres.** Il n'y a pas de moyenne de « rouge, vert, bleu ».
- **Elle peut être une valeur que personne n'a.** La moyenne de 2 et 3 est 2,5 ; si la variable ne prend que des nombres entiers, 2,5 peut être impossible.
- **Elle ne dit rien de la dispersion.** Deux jeux de données de variabilité très différente peuvent partager une même moyenne. Le module suivant corrige cela.

## Pièges courants

- **Diviser par le mauvais effectif.** L'erreur d'un cran, causée par une ligne d'en-tête ou une cellule vide, est le bug de moyenne le plus fréquent dans le travail réel.
- **Faire la moyenne des moyennes.** La moyenne de trois moyennes de groupe n'est la moyenne globale que si les groupes ont la même taille. Sinon, il faut pondérer par la taille du groupe.
- **Afficher plus de chiffres que les données n'en justifient.** Si les durées sont enregistrées à la minute près, affichez 18 minutes, pas 18,0.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Trois groupes d'étudiants passent un examen. Le groupe A (10 étudiants) a une moyenne de 70, le groupe B (20 étudiants) une moyenne de 80, le groupe C (30 étudiants) une moyenne de 90. Quelle est la moyenne globale ? Est-ce 80 ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Non. La moyenne non pondérée des trois moyennes est 80, mais les groupes ont des tailles différentes. La moyenne globale est $(10\cdot70 + 20\cdot80 + 30\cdot90)/60 = (700 + 1600 + 2700)/60 = 5000/60 \approx 83.3$. Le groupe C est le plus grand, il tire donc le chiffre global vers 90.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Un jeu de données de salaires a une moyenne de 62 000 et une médiane de 48 000. Quelle mesure citeriez-vous dans une annonce d'emploi, et laquelle un syndicat citerait-il en négociation ? Expliquez la différence en termes de qui bénéficie de chaque nombre.

<p class="challenge__answer">💡 <strong>Réponse :</strong> L'annonce cite la moyenne, parce qu'elle est plus élevée et flatte l'employeur ; le syndicat cite la médiane, parce qu'elle décrit ce que gagne réellement un travailleur typique. Quand la moyenne et la médiane divergent à ce point, la distribution a une longue queue à droite : quelques salaires très élevés tirent la moyenne vers le haut tandis que la plupart des gens se situent près de 48 000.</p>

</div>
</details>

## 🤔 Questions socratiques

- Si la moyenne de cinq nombres est 10, l'un des nombres doit-il être 10 ?
- Que devient la moyenne si vous ajoutez une nouvelle valeur égale à la moyenne actuelle ?
- Pourquoi doubler chaque valeur double-t-il la moyenne, alors qu'ajouter 5 à chaque valeur ajoute exactement 5 à la moyenne ?
- Un magasin annonce « un client dépense en moyenne 40 $ », mais la plupart des clients dépensent moins de 20 $. Que demanderiez-vous avant de le croire ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-mean-fr">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que représente la moyenne d'une liste de nombres ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La valeur qui apparaît le plus souvent.</button>
      <button class="quiz-q__opt" data-idx="1">La valeur que chaque entrée aurait si le total était partagé équitablement.</button>
      <button class="quiz-q__opt" data-idx="2">La valeur du milieu une fois la liste triée.</button>
      <button class="quiz-q__opt" data-idx="3">La plus grande valeur moins la plus petite.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Les valeurs 4, 6, 8, 10, 52 ont une moyenne de 16. Quelle affirmation est vraie ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">16 est une valeur typique de cette liste.</button>
      <button class="quiz-q__opt" data-idx="1">La moyenne est fausse ; elle devrait être 10.</button>
      <button class="quiz-q__opt" data-idx="2">La valeur 52 tire à elle seule la moyenne au-dessus de quatre des cinq entrées.</button>
      <button class="quiz-q__opt" data-idx="3">La moyenne ignore 52 parce que c'est une valeur aberrante.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
