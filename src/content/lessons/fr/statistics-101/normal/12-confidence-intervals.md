---
title: "Les intervalles de confiance"
description: "Une plage qui contient généralement la vérité, construite à partir d'une moyenne, d'une erreur type et d'un multiplicateur justifiable."
module: "samples-and-uncertainty"
order: 12
difficulty: "intermediate"
estimatedMinutes: 22
learningObjectives:
  - "Construire un intervalle de confiance à 95 % pour une moyenne à la main"
  - "Interpréter correctement un intervalle de confiance, y compris ce qu'il ne dit pas"
  - "Expliquer à quoi se rapporte le 95 %, à l'aide d'échantillonnages répétés"
  - "Choisir un intervalle plus large ou plus étroit et dire ce que chacun apporte"
prerequisites: []
tags: ["intervalle-de-confiance", "inférence", "marge-d-erreur", "incertitude"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 15
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

Un **intervalle de confiance** est une plage de valeurs plausibles pour un paramètre de population, construite à partir d'une estimation d'échantillon plus et moins une marge :

$$
\bar{x} \pm t_{n-1,\,0.975}\cdot \frac{s}{\sqrt{n}}
$$

Pour de grands échantillons, le multiplicateur $t$ est proche de 2, d'où le fameux « ±2 erreurs types ». Son interprétation est la partie délicate :

> Si vous répétiez l'étude de nombreuses fois, environ 95 % des intervalles construits de cette façon contiendraient le vrai paramètre.

Le 95 % décrit la **procédure**, pas votre intervalle particulier. Un intervalle donné contient la vérité ou ne la contient pas, et vous ne pouvez pas savoir lequel. Ce que vous pouvez dire, c'est que la méthode est juste 95 % du temps.

## Ce que cela apporte

Une estimation ponctuelle prétend à une précision qu'elle n'a pas. « Le temps de livraison moyen est de 18 minutes » sonne exact et est presque certainement faux au troisième chiffre. « Entre 11,7 et 24,3 minutes, avec 95 % de confiance » est une affirmation sur laquelle on peut agir : elle dit à un responsable qu'il ne peut pas encore promettre un service en 15 minutes, car 15 se situe dans la plage plausible.

Les intervalles rendent aussi les comparaisons honnêtes. Deux groupes dont les intervalles se chevauchent nettement ne sont pas clairement différents, quelles que soient leurs moyennes.

## Calcul à la main

Échantillon de $n=25$ livraisons : moyenne 18 minutes, écart type 15,3 minutes, erreur type 3,06 minutes.

**Étape 1 — choisissez le niveau de confiance.** 95 % est la convention. Pour $n=25$, le multiplicateur correct est la valeur $t$ à 24 degrés de liberté, soit environ 2,064.

**Étape 2 — la marge.**

$$
2.064 \times 3.06 \approx 6.3 \text{ minutes}
$$

**Étape 3 — l'intervalle.**

$$
18 \pm 6.3 \;=\; (11.7,\; 24.3) \text{ minutes}
$$

**Étape 4 — dites ce que cela signifie.** « Nous estimons le temps de livraison moyen à 18 minutes, avec un intervalle de confiance à 95 % de 11,7 à 24,3. » Une promesse de service sous 12 minutes est à l'extrême limite de la plausibilité ; une promesse à 30 est confortablement au-dessus.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

La même étude avec $n=100$ livraisons donne la même moyenne et le même écart type. Quel est le nouvel intervalle, et de combien est-il plus étroit ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> L'erreur type devient $15.3/10 = 1.53$, le multiplicateur $t$ diminue légèrement jusqu'à environ 1,984, et la marge vaut environ 3,0 minutes. L'intervalle est $(15.0, 21.0)$, soit à peu près la moitié de la largeur. Quatre fois plus de données divisent l'incertitude par deux — la même loi de racine carrée que l'erreur type.</p>

</div>
</details>

## Ce qu'il ne dit pas

Quatre lectures erronées courantes, toutes utiles à reconnaître dans les rapports des autres :

- **« Il y a 95 % de chances que la vraie moyenne soit entre 11,7 et 24,3. »** Dans la lecture fréquentiste, la vraie moyenne est un nombre fixe ; c'est l'intervalle qui est incertain.
- **« 95 % des livraisons prennent entre 11,7 et 24,3 minutes. »** Non — ce serait un intervalle de prédiction, bien plus large.
- **« L'intervalle contient 95 % des données. »** Il contient la moyenne, pas les données.
- **« Des intervalles qui se chevauchent signifient aucune différence. »** Le chevauchement est un indice grossier, pas un test ; des intervalles peuvent se chevaucher alors que la différence reste nette.

## La même chose en Python

Le calcul à la main, puis la version de bibliothèque :

```python
import statistics as st

times = [8, 10, 12, 15, 45]
n = len(times)
m = st.mean(times)
se = st.stdev(times) / n ** 0.5
margin = 2.064 * se            # t pour 24 ddl, 95 % ; pour n=5 utilisez vos propres ddl
print(round(m - margin, 1), round(m + margin, 1))
```

`scipy` calcule le multiplicateur pour toute taille d'échantillon et tout niveau de confiance :

```python
from scipy import stats

lo, hi = stats.t.interval(0.95, df=n - 1, loc=m, scale=se)
print(round(lo, 1), round(hi, 1))
```

Et l'expérience derrière l'interprétation : construisez de nombreux intervalles à partir de nombreux échantillons et comptez combien de fois ils contiennent la vérité.

```python
import random, statistics as st
from scipy import stats

population = [random.gauss(50, 10) for _ in range(10_000)]
truth = st.mean(population)
hits = 0
for _ in range(500):
    sample = random.sample(population, 25)
    lo, hi = stats.t.interval(0.95, df=24, loc=st.mean(sample), scale=st.stdev(sample) / 5)
    hits += lo <= truth <= hi
print(hits / 500)      # ≈ 0.95
```

Cette sortie — autour de 95 % — est tout le sens de la phrase.

## Le voir géométriquement

Reprenez la distribution d'échantillonnage de la leçon précédente : l'intervalle en est les 95 % centraux, ramenés à l'échelle des données. Dans la [démonstration d'intervalle de confiance de GeoGebra](https://www.geogebra.org/m/sfqjzhcm), vous pouvez changer le niveau de confiance et voir l'intervalle s'élargir quand vous exigez plus de certitude, puis se resserrer en augmentant $n$.

## Quand l'utiliser

- Rapporter toute estimation dont la précision compte : résultats de sondage, temps de référence, mesures de qualité.
- Comparer deux groupes quand vous voulez montrer la taille d'une différence plausible.
- Décider si une décision reste sûre sous la pire valeur plausible, pas seulement sous la meilleure estimation.

## Limites

- **Valable seulement si l'échantillonnage est non biaisé.** Un intervalle de confiance autour d'une estimation biaisée est une affirmation précise sur la mauvaise chose.
- **Supposé l'indépendance.** Des mesures regroupées ou répétées exigent une formule différente.
- **Des intervalles étroits ne sont pas des intervalles importants.** Avec un $n$ énorme, une différence triviale peut avoir un intervalle serré.
- **Ce n'est pas un intervalle de prédiction.** Les valeurs individuelles varient bien plus que la moyenne.

## Pièges courants

- **Utiliser 1,96 pour de petits échantillons.** C'est la valeur des grands échantillons ; avec $n=5$, le multiplicateur correct dépasse 2,7.
- **Rapporter l'intervalle sans dire à quoi il sert.** La moyenne, une différence ou une proportion — chacun a son propre intervalle.
- **Prendre le non-chevauchement pour une preuve de différence.** C'est suggestif ; une comparaison correcte est le bon outil.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Un rapport indique « score moyen 70, IC 95 % [69,5 ; 70,5] » à partir d'un échantillon de 10 000 étudiants, et conclut « la méthode d'enseignement est clairement efficace ». Qu'est-ce qui manque à cet argument ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Une comparaison. L'intervalle dit que la moyenne est connue avec précision, pas qu'elle soit bonne. Sans groupe témoin, sans référence de départ ni intervalle de comparaison, « 70 ± 0,5 » établit seulement que l'estimation est serrée — un grand $n$ rend presque toute différence statistiquement visible, et c'est précisément pourquoi les intervalles de confiance doivent se lire avec la taille d'effet.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi un intervalle à 99 % doit-il être plus large qu'un intervalle à 95 % sur les mêmes données ?
- Si deux études donnent des intervalles très différents pour la même quantité, qu'est-ce qui pourrait l'expliquer à part une erreur ?
- Pourquoi un intervalle de confiance ne peut-il jamais vous dire la probabilité que votre intervalle précis soit correct ?
- Que vous faudrait-il pour construire un intervalle de confiance pour une médiane au lieu d'une moyenne ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-ci-fr">
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">1. À quoi se rapporte « 95 % de confiance » ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La probabilité que cet intervalle précis contienne la vérité.</button>
      <button class="quiz-q__opt" data-idx="1">La part des données à l'intérieur de l'intervalle.</button>
      <button class="quiz-q__opt" data-idx="2">La probabilité que la moyenne de l'échantillon soit correcte.</button>
      <button class="quiz-q__opt" data-idx="3">La part des intervalles construits de cette façon qui contiendraient la vraie valeur.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Quel changement rend un intervalle de confiance plus étroit ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Passer le niveau de confiance de 95 % à 99 %.</button>
      <button class="quiz-q__opt" data-idx="1">Augmenter la taille de l'échantillon.</button>
      <button class="quiz-q__opt" data-idx="2">Augmenter la variabilité de l'échantillon.</button>
      <button class="quiz-q__opt" data-idx="3">Prélever un échantillon biaisé.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
