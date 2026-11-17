---
title: "L'incertitude dans le monde réel"
description: "Intervalles bootstrap, les hypothèses derrière chaque test, et comment rédiger une analyse à laquelle un relecteur peut se fier."
module: "applied-statistics"
order: 19
difficulty: "advanced"
estimatedMinutes: 35
learningObjectives:
  - "Construire un intervalle de confiance par rééchantillonnage quand les hypothèses de la formule échouent"
  - "Expliquer ce que le bootstrap suppose et ce qu'il ne peut pas corriger"
  - "Distinguer l'erreur d'échantillonnage du biais, avec un exemple de chacun"
  - "Rédiger un résumé d'analyse qui énonce ses hypothèses et ses limites"
prerequisites: []
tags: ["bootstrap", "rééchantillonnage", "biais", "rapport", "robustesse"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "statistics-101"
track: "hard"
---

## Ce que cela signifie

Chaque intervalle de ce cours jusqu'ici venait d'une formule qui suppose quelque chose : la normalité, l'indépendance, une forme connue. Quand ces hypothèses échouent, l'arithmétique produit encore un nombre, et ce nombre n'est plus digne de confiance.

Le **bootstrap** évite la formule. Pour estimer de combien une statistique oscillerait, rééchantillonnez vos propres données avec remise de nombreuses fois, recalculez la statistique sur chaque rééchantillon, et regardez la dispersion de ce que vous obtenez :

$$
\text{rééchantillon} \to \hat{\theta}^* \quad\text{de nombreuses fois} \to \text{dispersion de } \hat{\theta}^* .
$$

Un intervalle bootstrap à 95 % est la partie centrale à 95 % de ces valeurs recalculées. Il n'utilise aucune hypothèse distributionnelle au-delà de « l'échantillon ressemble à la population » — ce qui est la même hypothèse que toute estimation fondée sur un échantillon fait déjà.

## Ce que cela apporte

Il étend les intervalles à des statistiques qui n'ont pas de formule simple : une médiane, une corrélation, un rapport de deux moyennes, la différence entre deux 90e centiles. Au lieu de chercher une formule de manuel, vous rééchantillonnez.

Il rend aussi concret le sens de l'incertitude. Vous pouvez *voir* la variation de l'estimation plutôt que de faire confiance à une démonstration.

## Calcul à la main, conceptuellement

La médiane de $1,2,2,3,3,4,5,6,8,12,20,96$ vaut 4,5. À quel point est-elle incertaine ?

Vous ne pouvez pas le calculer par une formule sans une hypothèse sur la forme. Faites un bootstrap :

1. tirez 12 valeurs des données, avec remise ;
2. calculez la médiane de ce rééchantillon ;
3. répétez quelques milliers de fois ;
4. prenez les 2,5e et 97,5e centiles des médianes.

Avec remise compte : sans remise, chaque rééchantillon serait les données d'origine et chaque médiane identique.

```python
import random, statistics as st

hours = [1, 2, 2, 3, 3, 4, 5, 6, 8, 12, 20, 96]
medians = []

for _ in range(5000):
    resample = random.choices(hours, k=len(hours))   # with replacement
    medians.append(st.median(resample))

medians.sort()
lo, hi = medians[125], medians[-126]                # queues de 2,5 % et 97,5 %
print(round(st.median(hours), 1), round(lo, 1), round(hi, 1))
```

L'intervalle autour de 4,5 est large — avec 12 valeurs et un cas extrême, la médiane n'est pas fixée aussi étroitement qu'une formule supposant la normalité le prétendrait.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Faites un bootstrap de la moyenne des mêmes données et comparez son intervalle avec celui de la médiane. Lequel est le plus large, et pourquoi ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> L'intervalle de la moyenne est bien plus large, parce que le rééchantillonnage tire parfois le 96 deux ou trois fois et la moyenne saute en conséquence. La médiane le remarque à peine. C'est la même sensibilité aux valeurs aberrantes que celle de l'écart type, désormais visible comme incertitude.</p>

</div>
</details>

## Ce que le bootstrap ne peut pas faire

- **Il ne peut pas corriger le biais.** Si l'échantillon n'est pas représentatif, le rééchantillonner reproduit la même mauvaise réponse avec un intervalle serré autour.
- **Il suppose que l'échantillon est un tirage équitable** de la population qui vous intéresse. C'est cette hypothèse qui fait tout le travail.
- **Il peine sur de très petits échantillons**, où le rééchantillonnage a trop peu de variété pour travailler.
- **Il suppose l'indépendance.** Des données regroupées exigent un bootstrap par blocs, et les séries temporelles exigent de l'attention à l'ordre.

La distinction à garder claire :

| | Erreur d'échantillonnage | Biais |
|---|---|---|
| Ce que c'est | Une oscillation aléatoire entre échantillons | Un décalage systématique par rapport à la vérité |
| Corrigée par | Plus de données | Un meilleur plan d'étude |
| Visible dans | Les intervalles, les erreurs types | Généralement rien — les intervalles restent étroits |

Un intervalle serré autour d'une estimation biaisée est le résultat le plus dangereux de la statistique, parce qu'il ressemble à de la certitude.

## La même chose en Python

```python
import numpy as np

rng = np.random.default_rng(42)
hours = np.array([1, 2, 2, 3, 3, 4, 5, 6, 8, 12, 20, 96])

def bootstrap(stat, data, n=5000):
    idx = rng.integers(0, len(data), size=(n, len(data)))
    return np.array([stat(data[i]) for i in idx])

for name, fn in [('mean', np.mean), ('median', np.median)]:
    vals = bootstrap(fn, hours)
    print(name, np.round(np.percentile(vals, [2.5, 97.5]), 2))
```

La même fonction fonctionne pour n'importe quelle statistique, ce qui est la raison pratique de la garder à portée de main.

## La rédaction

Un résumé auquel un relecteur peut se fier répond à ces points dans l'ordre :

1. **Quelle était la question**, énoncée avant de regarder les données.
2. **Ce qui a été mesuré**, avec la taille de l'échantillon et la façon dont il a été tiré.
3. **Ce qui a été trouvé**, sous forme d'effet avec un intervalle, pas d'une valeur p seule.
4. **Ce qui a été supposé**, y compris chaque exclusion et chaque ajustement.
5. **Ce qui pourrait être faux**, en nommant le biais le plus plausible plutôt qu'en disant « il faut plus de recherche ».
6. **Ce qui s'ensuit pour une décision**, énoncé dans les unités de la décision.

## Quand l'utiliser

- Toute statistique sans formule propre.
- Tout jeu de données où l'hypothèse de normalité est douteuse.
- Comme vérification de robustesse en marge d'un intervalle fondé sur une formule : si les deux concordent, la conclusion est plus solide ; s'ils divergent, l'hypothèse portait le poids.

## Limites

- **Les intervalles bootstrap ne sont pas à l'abri des petits échantillons ni du biais**, comme ci-dessus.
- **Ils peuvent sous-estimer l'incertitude quand les données sont dépendantes**, sauf si le schéma de rééchantillonnage respecte la dépendance.
- **Ils sont computationnels**, ce qui est bon marché aujourd'hui mais ajoute des pièces mobiles à un rapport.
- **Ils ne remplacent pas la réflexion sur le plan d'étude.** Aucun schéma de rééchantillonnage ne corrige un échantillon biaisé.

## Pièges courants

- **Rééchantillonner sans remise**, ce qui produit une variation nulle et un intervalle réduit à un point.
- **Utiliser le bootstrap pour masquer un échantillon biaisé.**
- **Rapporter l'estimation ponctuelle et abandonner l'intervalle**, ce qui jette tout le résultat.
- **Citer une valeur p sans taille d'effet**, dans quelque rédaction que ce soit.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Une enquête auprès des visiteurs d'un site web rapporte « satisfaction moyenne 4,6 sur 5, IC 95 % [4,55 ; 4,65] ». Pourquoi l'intervalle peut-il être trompeur bien qu'étroit ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> L'échantillon est constitué des visiteurs — des gens qui sont restés. Quiconque est parti sans répondre manque, et sa satisfaction est plausiblement bien plus basse. C'est un biais de sélection : l'intervalle décrit correctement l'incertitude de la moyenne parmi les répondants, et ne dit rien de la population de tous les visiteurs.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi un rééchantillonnage avec remise imite-t-il le tirage d'un échantillon frais ?
- Qu'est-il pire de rapporter : un intervalle large ou un intervalle étroit autour d'une estimation biaisée ?
- Qu'est-ce qu'un intervalle bootstrap suppose qu'un intervalle de formule ne suppose pas, et inversement ?
- Si un intervalle de formule et un intervalle bootstrap divergent sur les mêmes données, auquel feriez-vous confiance, et qu'étudieriez-vous ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-uncertainty-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Pourquoi le bootstrap doit-il rééchantillonner avec remise ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Pour rendre le calcul plus rapide.</button>
      <button class="quiz-q__opt" data-idx="1">Parce que la statistique l'exige.</button>
      <button class="quiz-q__opt" data-idx="2">Sans remise, chaque rééchantillon est les données d'origine, donc il n'y a aucune variation à mesurer.</button>
      <button class="quiz-q__opt" data-idx="3">Pour retirer les valeurs aberrantes.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Un intervalle de confiance étroit autour d'une estimation biaisée vous apprend quoi ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que l'estimation est exacte.</button>
      <button class="quiz-q__opt" data-idx="1">Que l'estimation est précise, et que le biais est en dehors de ce que l'intervalle mesure.</button>
      <button class="quiz-q__opt" data-idx="2">Que l'échantillon est assez grand pour éliminer toute erreur.</button>
      <button class="quiz-q__opt" data-idx="3">Absolument rien.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
