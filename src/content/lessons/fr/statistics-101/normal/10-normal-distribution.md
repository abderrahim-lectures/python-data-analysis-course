---
title: "La distribution normale"
description: "La courbe en cloche, la règle 68–95–99,7, et ce que signifie qu'une valeur soit à deux écarts types."
module: "samples-and-uncertainty"
order: 10
difficulty: "intermediate"
estimatedMinutes: 20
learningObjectives:
  - "Reconnaître la courbe normale à sa forme, son centre et sa dispersion"
  - "Appliquer la règle 68–95–99,7 sans table"
  - "Standardiser une valeur en score z et le lire comme une position"
  - "Nommer les situations où supposer la normalité est une erreur"
prerequisites: []
tags: ["distribution-normale", "score-z", "courbe-en-cloche", "probabilité"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

La **distribution normale** est une famille de courbes symétriques en forme de cloche, chacune fixée par deux nombres : son centre $\mu$ et sa dispersion $\sigma$. Sa densité a une forme précise,

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}}\, e^{-\frac{(x-\mu)^2}{2\sigma^2}},
$$

mais vous avez rarement besoin de l'évaluer à la main. Ce qui compte, c'est la conséquence de cette forme sur les distances.

Comme la courbe est symétrique et que sa dispersion est mesurée par $\sigma$, les distances à la moyenne ont des probabilités fixes :

- environ **68 %** des valeurs se situent à $1\sigma$ de la moyenne ;
- environ **95 %** à $2\sigma$ ;
- environ **99,7 %** à $3\sigma$.

C'est la règle 68–95–99,7, et c'est la raison pour laquelle l'écart type mérite d'être rapporté.

## Ce que cela apporte

La courbe normale est le modèle de référence qui transforme une mesure brute en affirmation sur sa rareté. Un bébé de 3,1 kg ne signifie rien en soi ; le même poids à 1,9 écart type sous la moyenne est une situation clinique entièrement différente.

C'est aussi la distribution derrière l'erreur type et la plupart des formules d'intervalle des leçons suivantes, parce que les moyennes de nombreuses choses indépendantes tendent vers une forme normale, quelle que soit la forme des données d'origine. C'est le théorème central limite, et c'est pourquoi cette courbe apparaît même quand les données ne sont pas du tout en cloche.

## Calcul à la main : un score z

Les tailles adultes d'une population ont une moyenne $\mu = 170$ cm et un écart type $\sigma = 10$ cm. Une personne mesure 185 cm. À quel point est-ce inhabituel ?

**Étape 1 — standardisez.**

$$
z = \frac{x - \mu}{\sigma} = \frac{185 - 170}{10} = 1.5
$$

**Étape 2 — lisez la position.** La taille se situe à 1,5 écart type au-dessus de la moyenne. Selon la règle 68–95–99,7, 68 % des personnes se situent entre $160$ et $180$ cm, donc 32 % sont en dehors ; la moitié d'entre elles sont au-dessus de 180, soit environ 16 %. Notre personne est plus loin que 180 mais moins loin que 190 (deux écarts types), donc environ 7 % des personnes sont plus grandes.

**Étape 3 — dites-le en mots.** « Environ 7 adultes sur 100 sont plus grands que cette taille. » C'est la phrase qu'une table ou une fonction de bibliothèque donne exactement, et que la règle approxime sans elles.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Une machine remplit des bocaux avec une moyenne de 500 g et un écart type de 4 g, selon une loi normale. Quelle proportion approximative de bocaux pèse plus de 508 g ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> $z = (508-500)/4 = 2$, donc le bocal est à deux écarts types au-dessus de la moyenne. La règle 68–95–99,7 place environ 5 % en dehors de deux écarts types, dont la moitié au-dessus, soit environ 2,5 % — à peu près 1 bocal sur 40.</p>

</div>
</details>

## La même chose en Python

```python
import statistics as st

heights = [158, 162, 165, 167, 170, 171, 174, 176, 179, 188]
mu = st.mean(heights)
sigma = st.pstdev(heights)      # forme population, comme le modèle ci-dessus

z = (185 - mu) / sigma
print(round(mu, 1), round(sigma, 2), round(z, 2))
```

Pour des proportions exactes, la fonction de répartition de la loi normale centrée réduite donne l'aire sous un score z :

```python
from statistics import NormalDist

normal = NormalDist(mu=170, sigma=10)
print(normal.cdf(185))              # ≈ 0,9332, la proportion sous 185
print(1 - normal.cdf(185))          # ≈ 0,0668, la proportion au-dessus
```

`NormalDist` est livré avec la bibliothèque standard de Python, donc aucune installation n'est nécessaire.

## Le voir géométriquement

L'aire sous la courbe est la probabilité, et la règle 68–95–99,7 n'est qu'une affirmation sur les aires entre des droites verticales. Dans l'[outil de distribution normale de GeoGebra](https://www.geogebra.org/m/yjz6bqtn), vous pouvez fixer la moyenne et l'écart type et déplacer la borne pour voir l'aire colorée changer — y compris au moment où vous passez d'un à deux écarts types et où l'aire s'effondre du tiers au vingtième.

## Quand l'utiliser

- Les données sont **symétriques et unimodales**, et vous voulez des proportions approximatives dans les queues.
- Vous travaillez avec des **moyennes de nombreuses observations**, où le théorème central limite s'applique même si les données brutes sont asymétriques.
- Vous avez besoin d'une **échelle standard** pour comparer des mesures d'unités différentes, ce que les scores z fournissent exactement.

## Limites

- **La plupart des données réelles ne sont pas normales.** Revenus, prix, temps d'attente, populations et comptages sont asymétriques ; forcer une courbe en cloche sur eux produit des absurdités confiantes.
- **Elle est non bornée.** Le modèle autorise des tailles négatives et des temps d'attente négatifs, ce qui ne peut pas arriver.
- **Les queues sont plus fines que la réalité.** Les données réelles produisent des événements extrêmes bien plus souvent que ne le prédit la courbe normale.
- **Elle ne dit rien du mécanisme.** Une forme en cloche est une description, pas une explication.

## Pièges courants

- **Utiliser l'écart type de l'échantillon là où celui de la population convient** (ou l'inverse en construisant des scores z), ce qui décale légèrement chaque probabilité.
- **Supposer la normalité parce que les statistiques descriptives semblent plausibles.** Tracez les données ; vérifiez d'abord l'asymétrie et les pics multiples.
- **Citer des scores z pour des données fortement asymétriques** et les interpréter comme des proportions.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Les scores d'un examen ont une moyenne de 60 et un écart type de 8. Deux étudiants obtiennent 76 et 52. Lequel est le plus inhabituel, et quels sont leurs scores z ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Les deux sont à deux écarts types de la moyenne, en sens opposés : $(76-60)/8 = +2$ et $(52-60)/8 = -1$. Le 76 est le plus inhabituel en termes de queue ; un score 16 points au-dessus de la moyenne s'enfonce plus loin dans la queue que 8 points en dessous, et la règle normale n'est pas symétrique en distance *brute*, seulement en distance standardisée.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi la règle donne-t-elle les mêmes pourcentages quels que soient la moyenne et l'écart type ?
- Si un jeu de données n'est pas normal, un score z peut-il encore être calculé ? Que signifie-t-il alors ?
- Pourquoi les moyennes de nombreuses valeurs tendent-elles vers une forme en cloche même quand les valeurs elles-mêmes ne le font pas ?
- Que chercheriez-vous dans un histogramme avant de croire une conclusion fondée sur la normalité ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-normal-fr">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Quelle part approximative d'une distribution normale se situe à un écart type de la moyenne ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">50 %</button>
      <button class="quiz-q__opt" data-idx="1">68 %</button>
      <button class="quiz-q__opt" data-idx="2">95 %</button>
      <button class="quiz-q__opt" data-idx="3">99,7 %</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Une valeur a z = −2,4. Qu'est-ce que cela signifie ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Elle est 2,4 unités sous la moyenne.</button>
      <button class="quiz-q__opt" data-idx="1">Elle vaut 2,4 % de la moyenne.</button>
      <button class="quiz-q__opt" data-idx="2">Elle est à 2,4 écarts types sous la moyenne.</button>
      <button class="quiz-q__opt" data-idx="3">C'est le 24e centile.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
