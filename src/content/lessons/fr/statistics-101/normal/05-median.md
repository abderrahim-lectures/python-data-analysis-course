---
title: "La médiane"
description: "Triez d'abord, puis prenez le milieu : la mesure qu'une valeur extrême ne peut pas déplacer."
module: "describing-data"
order: 5
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Calculer une médiane à la main pour un nombre impair et un nombre pair de valeurs"
  - "Calculer la même médiane en Python et expliquer le cas des deux valeurs centrales"
  - "Comparer moyenne et médiane sur les mêmes données et dire ce que l'écart révèle"
  - "Décider quand la médiane est la mesure à rapporter"
prerequisites: []
tags: ["médiane", "statistique-descriptive", "centre", "valeurs-aberrantes"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

La **médiane** est la valeur du milieu une fois les données triées. La moitié des valeurs sont inférieures ou égales à elle, la moitié sont supérieures ou égales. Seule la position compte ; la grandeur des valeurs proches du milieu est sans importance, tout comme celle des valeurs aux extrémités.

Pour $n$ valeurs en ordre trié $x_{(1)} \le x_{(2)} \le \cdots \le x_{(n)}$ :

$$
\text{médiane} =
\begin{cases}
x_{\left(\frac{n+1}{2}\right)} & n \text{ impair} \\[4pt]
\dfrac{x_{\left(\frac{n}{2}\right)} + x_{\left(\frac{n}{2}+1\right)}}{2} & n \text{ pair}
\end{cases}
$$

En mots : avec un effectif impair, il y a un milieu exact ; avec un effectif pair, il y a deux valeurs centrales, et vous prenez leur moyenne.

## Ce que cela apporte

La moyenne peut être entraînée par une seule valeur. La médiane ne peut être déplacée par *aucune* valeur unique, aussi extrême soit-elle, car déplacer une valeur à 1 000 000 ne change pas quelle entrée occupe le milieu. Elle répond à une autre question : non pas « quel est le total partagé ? » mais « à quoi ressemble un cas typique ? »

Cela fait de la médiane le résumé honnête de tout ce qui est asymétrique : revenus, prix des logements, temps d'attente à l'hôpital, tailles de fichiers, temps de réponse. Dans chacun de ces cas, un petit nombre de cas très grands existe et dominerait une moyenne.

## Calcul à la main, effectif impair

Encore les durées de livraison, triées :

$$
8,\; 10,\; 12,\; 15,\; 45
$$

Il y a $n = 5$ valeurs, donc le milieu est la position $(5+1)/2 = 3$ :

$$
x_{(3)} = 12
$$

La médiane est de 12 minutes. Comparez avec la moyenne, 18. La médiane est ce qu'un client appellerait une livraison normale ; la moyenne porte le poids de celle de 45 minutes.

## Calcul à la main, effectif pair

Retirez la livraison la plus lente :

$$
8,\; 10,\; 12,\; 15
$$

Maintenant $n = 4$, et les deux positions centrales sont $4/2 = 2$ et $3$ :

$$
\text{médiane} = \frac{x_{(2)} + x_{(3)}}{2} = \frac{10 + 12}{2} = 11.
$$

Remarquez ce qui s'est passé : avec un effectif pair, la médiane peut être une valeur absente des données (11 ne fait partie d'aucune des quatre durées). Elle reste le milieu correct.

## La même chose en Python

```python
times = [8, 12, 10, 15, 45]
ordered = sorted(times)
n = len(ordered)

if n % 2 == 1:
    median = ordered[n // 2]
else:
    median = (ordered[n // 2 - 1] + ordered[n // 2]) / 2

print(median)      # 12
```

La bibliothèque standard fait la même chose, y compris la moyenne du cas pair :

```python
from statistics import median

print(median([8, 12, 10, 15, 45]))   # 12
print(median([8, 10, 12, 15]))       # 11.0
```

## Lire l'écart entre les deux

Une habitude utile : calculez les deux, puis regardez la différence.

| Données | Moyenne | Médiane | Ce que dit l'écart |
|---|---|---|---|
| 8, 10, 12, 15, 45 | 18 | 12 | Une longue queue à droite : quelques grandes valeurs |
| 10, 11, 12, 12, 13 | 11,6 | 12 | À peu près symétrique : moyenne et médiane concordent |
| −5, 10, 11, 12, 12 | 8 | 11 | Une longue queue à gauche : quelques petites valeurs |

Quand la moyenne est nettement au-dessus de la médiane, quelques grandes valeurs la tirent vers le haut. Quand elle est nettement en dessous, quelques petites valeurs la tirent vers le bas. Quand les deux concordent presque, les données sont proches de la symétrie et l'une ou l'autre mesure convient.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Une entreprise annonce « notre salaire médian est de 55 000, mais notre salaire moyen est de 95 000 ». Combien y a-t-il d'employés, au minimum, et que dit l'écart sur la structure salariale ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Au moins deux, mais la lecture utile porte sur la forme : la moyenne dépasse la médiane de 40 000, donc un petit nombre de personnes très bien payées existe tandis que l'employé typique gagne 55 000. Plus l'écart est grand, plus le haut de l'échelle est concentré.</p>

</div>
</details>

## Le voir géométriquement

La médiane est le point qui coupe l'effectif en deux, pas le point qui équilibre les poids. Déplacez le point le plus à droite très loin dans l'[explorateur moyenne et médiane de GeoGebra](https://www.geogebra.org/m/zsbf4jqm) et observez : la moyenne saute, la médiane reste là où se fait la coupure 50/50.

## Quand l'utiliser

- Les données sont **asymétriques** ou contiennent des valeurs aberrantes que vous ne pouvez pas justifier d'écarter.
- Vous voulez décrire un cas **typique**, pas un total.
- La variable est **ordinale** : des notes comme « mauvais, passable, bon » ont un ordre significatif mais pas d'arithmétique significative, donc la médiane est valide là où la moyenne ne l'est pas.

## Limites

- **Elle ignore la plupart des données.** Deux jeux de données très différents peuvent partager une même médiane.
- **Elle ne s'additionne pas.** La médiane d'un groupe combiné n'est pas une fonction simple des deux médianes, et c'est pourquoi les moyennes dominent les formules ultérieures.
- **Elle exige au moins une valeur.** Avec un effectif pair, elle peut rapporter un nombre qu'aucun cas ne possède réellement.
- **Elle est moins stable sur de très petits échantillons.** Avec trois valeurs, une seule entrée modifiée peut la déplacer beaucoup.

## Pièges courants

- **Oublier de trier.** La médiane de la liste dans l'ordre brut n'a aucun sens ; trier est la première étape, à chaque fois.
- **Couper au mauvais endroit dans le cas pair.** Faites la moyenne des deux entrées centrales, pas du milieu et de la dernière.
- **Croire que « médiane » signifie « le plus fréquent ».** C'est le mode, une mesure différente.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Les valeurs sont 3, 7, 7, 9, 20, 21. Calculez la moyenne et la médiane, puis ajoutez une nouvelle valeur, 100, et recalculez les deux. Laquelle a le plus bougé, en valeur absolue et en pourcentage ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Avant : somme 67, moyenne 11,17, médiane $(7+9)/2 = 8$. Après l'ajout de 100 : somme 167, moyenne 23,86, médiane toujours 8 (les deux valeurs centrales des six sont maintenant 7 et 9). La moyenne a plus que doublé ; la médiane n'a pas bougé du tout.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi la médiane a-t-elle besoin de données triées alors que la moyenne n'en a pas besoin ?
- Si la moitié de la classe a une note au-dessus de la médiane et l'autre moitié en dessous, tout le monde peut-il être au-dessus de la moyenne ?
- Un hôpital annonce « un temps d'attente médian de 4 semaines ». Que cela cache-t-il qu'une moyenne révélerait ?
- Deux jeux de données peuvent-ils avoir la même médiane et des formes complètement différentes ? Esquissez-les.

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-median-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Comment trouvez-vous la médiane d'un nombre pair de valeurs ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">On prend la valeur à la position n/2 sans faire de moyenne.</button>
      <button class="quiz-q__opt" data-idx="1">On prend la plus grande des deux valeurs centrales.</button>
      <button class="quiz-q__opt" data-idx="2">On fait la moyenne des deux valeurs centrales après tri.</button>
      <button class="quiz-q__opt" data-idx="3">On divise la somme par n et on arrondit à la valeur la plus proche.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Un jeu de données a une moyenne de 80 et une médiane de 45. Qu'est-ce que cela vous dit ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Les données sont symétriques.</button>
      <button class="quiz-q__opt" data-idx="1">Quelques grandes valeurs tirent la moyenne bien au-dessus de la valeur typique.</button>
      <button class="quiz-q__opt" data-idx="2">La plupart des valeurs se situent près de 80.</button>
      <button class="quiz-q__opt" data-idx="3">La médiane est mal calculée, puisqu'elle doit être proche de la moyenne.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
