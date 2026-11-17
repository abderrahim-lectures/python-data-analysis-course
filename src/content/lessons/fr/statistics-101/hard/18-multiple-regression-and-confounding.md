---
title: "Ajuster pour une seconde variable"
description: "La régression multiple comme remède au paradoxe de Simpson : ce que signifie un coefficient ajusté, et quand l'ajustement empire les choses."
module: "applied-statistics"
order: 18
difficulty: "advanced"
estimatedMinutes: 35
learningObjectives:
  - "Lire un coefficient de régression multiple comme un effet à autres variables fixées"
  - "Montrer comment une comparaison non ajustée s'inverse quand une variable de groupement est incluse"
  - "Distinguer un facteur de confusion d'un médiateur et d'un collider"
  - "Expliquer pourquoi ajuster sur la mauvaise variable crée du biais au lieu d'en retirer"
prerequisites: []
tags: ["régression-multiple", "facteur-de-confusion", "ajustement", "inférence-causale"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "statistics-101"
track: "hard"
---

## Ce que cela signifie

La **régression multiple** ajuste un modèle avec plus d'un prédicteur :

$$
\hat{y} = b_0 + b_1 x_1 + b_2 x_2 + \cdots
$$

Chaque coefficient se lit avec une clause attachée : *à autres prédicteurs fixés*, une augmentation d'une unité de $x_1$ est associée à $b_1$ unités de variation de $y$. Cette clause est tout l'intérêt. Inclure $x_2$ retire de $b_1$ la partie de la relation qui pourrait tout aussi bien être attribuée à $x_2$.

C'est la forme numérique de l'analyse par groupes de la leçon sur le paradoxe de Simpson. Rassembler sans ajustement produit le nombre confondu ; ajuster produit celui à l'intérieur des groupes.

## Ce que cela apporte

C'est la bête de somme de la statistique appliquée. Presque aucune relation réelle n'est assez propre pour se lire dans une régression à une variable, et rapporter un coefficient non ajusté est la façon dont les données observationnelles produisent des absurdités confiantes.

Cela vous donne aussi une façon d'énoncer *ce que vous avez contrôlé*, ce qui est une phrase bien plus utile que « nous avons trouvé une corrélation ».

## Exemple travaillé

Données de type admissions, deux programmes et deux niveaux de candidats :

| Programme | Candidats forts | Admis | Candidats faibles | Admis |
|---|---|---|---|---|
| A | 20 | 18 | 80 | 24 |
| B | 90 | 72 | 10 | 2 |

**Étape 1 — comparaison non ajustée.** Programme A : 42 admis sur 100, soit 42 %. Programme B : 74 sur 100, soit 74 %. B semble bien plus accueillant.

**Étape 2 — à l'intérieur de chaque niveau.** Parmi les candidats forts, A admet 90 % et B 80 %. Parmi les candidats faibles, A admet 30 % et B 20 %. A est meilleur dans les deux cas.

**Étape 3 — le mécanisme.** B a reçu bien plus de candidats forts (90 contre 20), et les candidats forts sont admis à un taux plus élevé partout. Le taux rassemblé de B est élevé à cause de *qui a postulé*, pas de la façon dont les candidats ont été traités.

**Étape 4 — ajustez.** Régressez l'admission sur le programme *et* le niveau du candidat. Le coefficient du programme mesure maintenant la différence entre candidats de même niveau : il change de signe, en faveur de A.

```python
import pandas as pd
import statsmodels.formula.api as smf

df = pd.DataFrame({
    'programme': ['A']*100 + ['B']*100,
    'strength':  ['strong']*20 + ['weak']*80 + ['strong']*90 + ['weak']*10,
    'admitted':  [1]*18 + [0]*2 + [1]*24 + [0]*56 + [1]*72 + [0]*18 + [1]*2 + [0]*8,
})

# Sans ajustement : programme seul
print(smf.logit('admitted ~ C(programme)', df).fit().params)

# Ajusté : mêmes données, en contrôlant par la force du candidat
print(smf.logit('admitted ~ C(programme) + C(strength)', df).fit().params)
```

Le coefficient du programme passe de fortement positif pour B à négatif. Mêmes lignes, même arithmétique ; seule la question a changé.

## Facteur de confusion, médiateur, collider

- Un **facteur de confusion** affecte à la fois le prédicteur et le résultat. Ajuster dessus est le bon geste — le niveau du candidat ci-dessus.
- Un **médiateur** se situe *sur le chemin* entre prédicteur et résultat (traitement → guérison → survie). Ajuster dessus retire une partie de l'effet même que vous mesurez, donc c'est généralement une erreur.
- Un **collider** est causé par les deux (deux symptômes causés par la même maladie). Ajuster dessus peut *créer* une association qui n'existe pas.

La distinction est structurelle, et elle ne se lit pas dans les données. Elle exige de savoir ce qui cause quoi.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Une étude trouve que, parmi les patients hospitalisés, ceux qui faisaient plus d'exercice avaient de moins bons résultats. Faut-il conclure que l'exercice est nocif ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Non. L'hospitalisation est ici un collider : une maladie grave comme l'exercice peuvent y mener. Conditionner sur l'admission à l'hôpital sélectionne un groupe où les deux deviennent associés dans la direction opposée à la réalité. L'analyse a ajusté sur la mauvaise variable par l'acte même de sélectionner l'échantillon.</p>

</div>
</details>

## Quand l'utiliser

- Comparer des groupes qui diffèrent d'une manière mesurable que vous pouvez contrôler.
- Rapporter un effet qu'un lecteur qualifierait sinon de confondu.
- Vérifier si une découverte non ajustée survit à l'ajustement ; si le coefficient bouge beaucoup, le nombre non ajusté mesurait autre chose.

## Limites

- **Cela n'ajuste que sur ce que vous avez mesuré.** La confusion non mesurée subsiste, et c'est généralement la menace dominante dans le travail observationnel.
- **Ajuster sur un médiateur ou un collider ajoute du biais** au lieu d'en retirer.
- **La colinéarité** entre prédicteurs rend les coefficients instables et difficiles à interpréter séparément.
- **La forme fonctionnelle compte.** Ajuster des droites quand la relation se courbe déforme chaque coefficient.
- **Un coefficient ajusté n'est toujours pas un effet causal** à moins que le plan d'étude ne le justifie.

## Pièges courants

- **Ajuster sur tout ce que vous avez.** Plus de covariables n'est pas plus de rigueur ; chacune exige une justification.
- **Lire un coefficient sans sa clause « à autres variables fixées ».**
- **Supprimer une variable parce qu'elle n'est pas significative**, ce qui peut biaiser les autres.
- **Rapporter seulement le modèle ajusté**, en cachant combien l'ajustement a déplacé la réponse.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Le coefficient non ajusté d'un programme de formation est de +4 points. Après ajustement sur l'aptitude préalable, il est de +1. Quelles sont les deux lectures possibles, et comment les distingueriez-vous ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Soit le bénéfice apparent du programme était surtout de la sélection (des personnes plus capables se sont inscrites, et leur aptitude portait les 4 points), soit l'aptitude préalable est un médiateur que le programme améliore. Distinguez en demandant si l'aptitude préalable a été mesurée avant le début du programme. Si elle est antérieure, c'est un facteur de confusion et +1 est l'estimation honnête ; si elle a été mesurée après, elle peut se situer sur le chemin causal et l'ajustement retire un effet réel.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi le coefficient ajusté retire-t-il un facteur de confusion mais pas un médiateur ?
- Si l'ajustement fait passer un coefficient de +4 à +1, lequel rapporteriez-vous ?
- Deux prédicteurs peuvent-ils être si corrélés qu'aucun coefficient n'est interprétable ? Que regarderiez-vous ?
- Pourquoi sélectionner l'échantillon peut-il équivaloir à ajuster sur une variable ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-adjustment-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Comment lire un coefficient dans une régression multiple ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">L'effet total de cette variable seule.</button>
      <button class="quiz-q__opt" data-idx="1">La corrélation entre cette variable et le résultat.</button>
      <button class="quiz-q__opt" data-idx="2">La variation associée à une augmentation d'une unité, à autres prédicteurs fixés.</button>
      <button class="quiz-q__opt" data-idx="3">La part de variance qu'elle explique.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Sur quelle variable faut-il ajuster ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Toutes les variables du jeu de données.</button>
      <button class="quiz-q__opt" data-idx="1">Une cause mesurée à la fois du prédicteur et du résultat.</button>
      <button class="quiz-q__opt" data-idx="2">Une variable mesurée après le traitement et causée par lui.</button>
      <button class="quiz-q__opt" data-idx="3">Seulement les variables statistiquement significatives.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
