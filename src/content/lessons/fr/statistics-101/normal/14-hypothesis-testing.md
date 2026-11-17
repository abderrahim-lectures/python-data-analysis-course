---
title: "Les tests d'hypothèse"
description: "L'hypothèse nulle, la valeur p et les quatre décisions qui s'ensuivent : ce qu'un test établit et ce qu'il n'établit jamais."
module: "samples-and-uncertainty"
order: 14
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Énoncer une hypothèse nulle et une hypothèse alternative pour une comparaison concrète"
  - "Calculer une statistique t à la main à partir de deux moyennes de groupe et de leurs erreurs"
  - "Interpréter correctement une valeur p, y compris les trois lectures erronées courantes"
  - "Expliquer la différence entre signification statistique et signification pratique"
prerequisites: []
tags: ["test-d-hypothèse", "valeur-p", "test-t", "signification"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

Un **test d'hypothèse** demande à quel point les données seraient surprenantes s'il n'y avait aucun effet. Vous énoncez deux hypothèses :

- $H_0$, l'**hypothèse nulle** : il n'y a pas de différence, l'effet est nul ;
- $H_1$, l'**hypothèse alternative** : il y a une différence, dans une direction que vous énoncez à l'avance.

Ensuite vous calculez une statistique mesurant à quel point les données observées s'écartent de ce que prédit $H_0$, vous la convertissez en **valeur p** — la probabilité d'obtenir des données au moins aussi extrêmes *si $H_0$ était vraie* — et vous la comparez à un seuil fixé à l'avance, conventionnellement 0,05.

Pour comparer deux moyennes, la statistique est un rapport :

$$
t = \frac{\bar{x}_1 - \bar{x}_2}{\text{ET de la différence}} .
$$

Le numérateur est l'effet que vous avez observé. Le dénominateur est de combien cette différence oscillerait sous $H_0$. Un rapport élevé signifie que l'effet est grand par rapport au bruit.

## Ce que cela apporte

Il donne une réponse disciplinée à la question « est-ce que ce ne serait pas simplement le hasard ? », que toute comparaison soulève. Il force à décider la direction et le seuil avant de voir les données, ce qui protège contre le talent humain à trouver une histoire dans le bruit.

C'est aussi là que réside une grande partie des erreurs statistiques publiées, donc le connaître est autant défensif que constructif.

## Calcul à la main

Deux groupes de livraisons, l'un avec un nouveau système de routage :

- Itinéraire actuel : $n_1 = 30$, moyenne 18,0 min, écart type 6,0.
- Nouvel itinéraire : $n_2 = 30$, moyenne 15,0 min, écart type 5,0.

**Étape 1 — les hypothèses.** $H_0$ : les moyennes sont égales. $H_1$ : le nouvel itinéraire est plus rapide.

**Étape 2 — les erreurs types.**

$$
\text{ET}_1 = \frac{6.0}{\sqrt{30}} \approx 1.10, \qquad \text{ET}_2 = \frac{5.0}{\sqrt{30}} \approx 0.91
$$

**Étape 3 — l'erreur type de la différence.** Pour des groupes indépendants, les variances s'additionnent :

$$
\text{ET}_{\text{diff}} = \sqrt{1.10^2 + 0.91^2} \approx \sqrt{1.21 + 0.83} \approx 1.43
$$

**Étape 4 — la statistique.**

$$
t = \frac{18.0 - 15.0}{1.43} \approx 2.10
$$

**Étape 5 — la valeur p.** Avec environ 58 degrés de liberté, un $t$ de 2,10 est dépassé dans une queue avec une probabilité d'environ 0,020. Comme $H_1$ dit « plus rapide », la valeur p unilatérale vaut environ 0,02 ; bilatérale, environ 0,04. Dans les deux cas, elle est inférieure à 0,05.

**Étape 6 — la décision, énoncée honnêtement.** « Le nouvel itinéraire est associé à un temps de livraison moyen inférieur de 3 minutes, $t \approx 2.10$, $p \approx 0.04$. L'intervalle de confiance pour la différence va approximativement de 0,1 à 5,9 minutes. » Remarquez combien l'intervalle en dit plus que le verdict : l'effet pourrait être trivial ou substantiel.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

La même différence de 3 minutes est trouvée avec $n = 300$ par groupe. Que devient la valeur p, et la conclusion devient-elle plus importante ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Les erreurs types diminuent d'un facteur d'environ 3,2, donc $t$ monte à environ 6,7 et la valeur p devient minuscule. L'<em>effet</em> reste inchangé à 3 minutes — la conclusion est plus certaine, pas plus grande. C'est la différence entre la signification statistique (la preuve qu'un effet existe) et la signification pratique (savoir s'il vaut la peine d'agir).</p>

</div>
</details>

## Ce qu'une valeur p n'est pas

- **Pas la probabilité que $H_0$ soit vraie.** Elle est calculée *en supposant* $H_0$ vraie.
- **Pas la probabilité que vous ayez tort.** C'est une affirmation sur les données, pas sur votre conclusion.
- **Pas une mesure de la taille d'effet.** Un effet minuscule avec un échantillon énorme donne une valeur p minuscule.
- **Pas une licence pour pêcher.** Tester de nombreuses hypothèses et rapporter la plus petite valeur p garantit des faux positifs ; avec 20 tests à 0,05, attendez-vous à un résultat « significatif » fallacieux.

## La même chose en Python

```python
from scipy import stats

current = [17, 18, 19, 18, 16, 20]        # illustrative samples
new     = [14, 15, 16, 15, 13, 17]

res = stats.ttest_ind(new, current, alternative='less')
print(round(res.statistic, 2), round(res.pvalue, 4))
```

Affichez toujours l'effet et son intervalle en même temps que le test :

```python
import statistics as st

diff = st.mean(current) - st.mean(new)
se = (st.stdev(current)**2 / len(current) + st.stdev(new)**2 / len(new)) ** 0.5
print(round(diff, 2), round(diff - 2*se, 2), round(diff + 2*se, 2))
```

## Le voir géométriquement

La statistique t est la distance entre deux distributions d'échantillonnage mesurée dans leur propre dispersion. Dans l'[explorateur de test t de GeoGebra](https://www.geogebra.org/m/qzxjhqde), vous pouvez écarter les moyennes de groupe ou agrandir les échantillons et voir le chevauchement diminuer — la même image que la valeur p qui baisse.

## Quand l'utiliser

- Une comparaison spécifiée à l'avance entre deux groupes ou par rapport à une référence.
- Vérifier si une différence observée est plus grande que ce que produirait le bruit d'échantillonnage.
- Comme une entrée d'une décision qui pèse aussi le coût, la taille d'effet et le contexte.

## Limites

- **Il répond à une question étroite** — « l'effet est-il nul ? » — et ne dit rien de sa taille ni de son importance.
- **Les hypothèses comptent.** L'indépendance, et des données à peu près normales ou de grands échantillons ; les violer invalide la valeur p.
- **Les comparaisons multiples gonflent les faux positifs** sauf correction.
- **Il récompense les grands échantillons par de la signification** pour des effets dont personne ne se soucie.
- **Il ne peut pas sauver un plan biaisé.** Un test sur un échantillon biaisé donne une réponse précise à la mauvaise question.

## Pièges courants

- **Choisir l'hypothèse après avoir vu les données**, ce qui convertit discrètement une découverte exploratoire en confirmation fallacieuse.
- **Rapporter p < 0,05 comme une « preuve »** ; c'est une preuve contre un modèle nul, pas la preuve d'un mécanisme.
- **Cacher la taille d'effet.** Une valeur p sans différence de moyennes ni intervalle est ininterprétable.
- **Confondre tests unilatéraux et bilatéraux**, ce qui change le seuil sans changer les données.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Une étude rapporte « p = 0,049, significatif » et une autre « p = 0,051, non significatif » pour la même taille d'effet et la même taille d'échantillon. L'une des conclusions est-elle réelle et l'autre non ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Non. Les deux valeurs p sont essentiellement le même nombre, et la ligne de 0,05 est une convention, pas un fait sur le monde. Les traiter comme des conclusions opposées est l'erreur du « la différence entre significatif et non significatif n'est pas elle-même significative ». Rapportez les deux avec leurs intervalles et laissez le lecteur voir à quel point les preuves sont similaires.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi l'hypothèse doit-elle être énoncée avant de regarder les données ?
- Si un test n'est pas significatif, avez-vous montré qu'il n'y a aucun effet ?
- Qu'apporte un intervalle de confiance à 95 % qu'une valeur p n'apporte pas ?
- Pourquoi tester vingt hypothèses garantit-il environ un faux positif au seuil de 0,05 ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-hypothesis-fr">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que signifie une valeur p de 0,03 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Il y a 3 % de chances que l'hypothèse nulle soit vraie.</button>
      <button class="quiz-q__opt" data-idx="1">Si l'hypothèse nulle était vraie, des données au moins aussi extrêmes se produiraient environ 3 % du temps.</button>
      <button class="quiz-q__opt" data-idx="2">L'effet est de 3 %.</button>
      <button class="quiz-q__opt" data-idx="3">Il y a 97 % de chances que le résultat se reproduise.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Une différence est statistiquement significative avec un échantillon énorme. Que devez-vous vérifier d'autre ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Rien ; la signification tranche la question.</button>
      <button class="quiz-q__opt" data-idx="1">Si la valeur p est inférieure à 0,01 plutôt qu'à 0,05.</button>
      <button class="quiz-q__opt" data-idx="2">La taille de l'effet et son importance en pratique.</button>
      <button class="quiz-q__opt" data-idx="3">Si la moyenne ou la médiane est la plus grande.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
