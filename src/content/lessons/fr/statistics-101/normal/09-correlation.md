---
title: "La corrélation"
description: "Le r de Pearson et le rho de Spearman : comment deux variables varient ensemble, comment le calculer à la main, et les quatre façons dont il trompe."
module: "relationships"
order: 9
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Lire la direction et l'étroitesse d'un nuage de points avant tout calcul"
  - "Calculer une corrélation de Pearson à la main avec la formule standardisée"
  - "Interpréter r comme un nombre entre −1 et 1, en signe et en grandeur"
  - "Calculer une corrélation de rang de Spearman et dire quand elle bat Pearson"
  - "Expliquer pourquoi r² décrit la variation expliquée et r non"
prerequisites: []
tags: ["corrélation", "pearson", "spearman", "nuage-de-points", "causalité"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

Deux variables sont **corrélées** quand elles tendent à varier ensemble. Un coefficient de corrélation comprime cette tendance en un nombre entre $-1$ et $+1$.

La **corrélation de Pearson** mesure à quel point les points se situent près d'une *droite* :

$$
r = \frac{1}{n-1}\sum_{i=1}^{n}
\left(\frac{x_i - \bar{x}}{s_x}\right)
\left(\frac{y_i - \bar{y}}{s_y}\right)
$$

Chaque valeur devient un score standardisé — combien d'écarts types la séparent de sa moyenne — et la formule est le produit moyen des deux scores standardisés. Quand $x$ est au-dessus de sa moyenne en même temps que $y$ est au-dessus de la sienne, ce produit est positif ; quand ils sont en désaccord, il est négatif. La moyenne de ces produits est $r$.

La **corrélation de Spearman** est la même formule calculée sur les *rangs* plutôt que sur les valeurs. Cela la rend robuste aux valeurs aberrantes et capable de saisir toute relation qui va toujours dans le même sens, pas seulement les relations linéaires.

## Ce que cela apporte

Décrire une variable ne fait que la moitié du travail. Presque toute affirmation intéressante est relationnelle : un traitement est associé à de meilleurs résultats, le prix à la demande, la température aux ventes. Une corrélation est la réponse quantitative la moins coûteuse, et connaître ses limites vous protège de l'inférence erronée la plus courante en science des données : lire une cause dans une coïncidence.

Elle alimente aussi presque tout ce qui suit : la régression, la sélection de variables et les vérifications de fiabilité qui précèdent l'ajustement de tout modèle.

## Calcul à la main

Cinq étudiants, heures d'étude $x$ et score $y$ :

$$
x = 1,2,3,4,5 \qquad y = 50,55,65,70,80
$$

**Étape 1 — les moyennes.** $\bar{x} = 3$, $\bar{y} = 64$.

**Étape 2 — les écarts à chaque moyenne.**

| $x$ | $y$ | $x - \bar{x}$ | $y - \bar{y}$ |
|---|---|---|---|
| 1 | 50 | −2 | −14 |
| 2 | 55 | −1 | −9 |
| 3 | 65 | 0 | +1 |
| 4 | 70 | +1 | +6 |
| 5 | 80 | +2 | +16 |

**Étape 3 — les écarts types.** $\sum (x-\bar{x})^2 = 10$, donc $s_x = \sqrt{10/4} \approx 1.581$. $\sum (y-\bar{y})^2 = 196 + 81 + 1 + 36 + 256 = 570$, donc $s_y = \sqrt{570/4} \approx 11.94$.

**Étape 4 — standardiser et multiplier, ligne par ligne.** Pour la première ligne, $(-2/1.581)(-14/11.94) \approx 1.265 \times 1.173 \approx 1.484$. En faisant les cinq et en additionnant :

$$
\sum \left(\frac{x-\bar{x}}{s_x}\right)\left(\frac{y-\bar{y}}{s_y}\right) \approx 4.949
$$

**Étape 5 — divisez par $n-1$.**

$$
r = \frac{4.949}{4} \approx 0.987
$$

Presque 1. Les heures d'étude et le score augmentent ensemble presque parfaitement dans cet échantillon.

**Étape 6 — élevez au carré.** $r^2 \approx 0.975$ : 97,5 % de la variation des scores va de pair avec la tendance linéaire des heures d'étude. Notez que $r^2$ est le nombre à citer quand vous voulez dire « quelle part est expliquée » ; $r$ seul surestime cette part.

## Lire le signe et la grandeur

| $r$ | Lecture |
|---|---|
| $+1$ | croissance parfaitement linéaire |
| $+0.7$ | forte tendance à la hausse, avec une dispersion visible |
| $+0.2$ | faible tendance à la hausse, presque noyée dans le bruit |
| $0$ | aucune tendance *linéaire* (il peut subsister une courbe) |
| $-0.6$ | tendance à la baisse modérée |

Le signe indique la direction, la grandeur indique à quel point l'ajustement linéaire est serré, et rien de plus. $r = 0$ ne signifie pas « aucune relation » ; cela signifie « aucune relation linéaire » : une relation en U parfaite a $r \approx 0$.

## Quand Pearson trompe : recourir à Spearman

Considérez ces cinq points : $x = 1,2,3,4,5$ et $y = 1,4,9,16,25$. La relation est parfaite et croissante, mais courbe. Le $r$ de Pearson vaut environ $0.98$ : élevé mais pas 1, parce que la courbe n'est pas une droite. La corrélation de rang de Spearman sur les mêmes données vaut exactement 1 : chaque rang en $x$ correspond à un rang en $y$.

La règle pratique :

- utilisez **Pearson** quand les deux variables sont numériques, à peu près continues, et que le nuage ressemble à une droite ou à une ellipse ;
- utilisez **Spearman** quand la relation est monotone mais courbe, quand il y a des valeurs aberrantes, ou quand une variable est ordinale (une note de satisfaction de 1 à 5, un classement de compétition).

## La même chose en Python

```python
x = [1, 2, 3, 4, 5]
y = [50, 55, 65, 70, 80]

import statistics as st
mx, my = st.mean(x), st.mean(y)
sx, sy = st.stdev(x), st.stdev(y)

zx = [(v - mx) / sx for v in x]
zy = [(v - my) / sy for v in y]
r = sum(a * b for a, b in zip(zx, zy)) / (len(x) - 1)
print(round(r, 3))        # 0.987
print(round(r ** 2, 3))   # 0.975
```

NumPy et pandas font la même chose en un appel, et `corr(method='spearman')` bascule vers la version des rangs :

```python
import numpy as np
print(np.corrcoef(x, y)[0, 1])

import pandas as pd
df = pd.DataFrame({'hours': x, 'score': y})
print(df.corr(method='pearson'))
print(df.corr(method='spearman'))
```

## Le voir géométriquement

Sur un nuage de points, le $r$ de Pearson décrit la finesse du nuage autour d'une droite. Tournez le nuage et $r$ change ; courbez-le en U et $r$ tombe à zéro tandis que la relation devient plus forte. L'[explorateur de corrélation de GeoGebra](https://www.geogebra.org/m/gtxfmqsf) vous permet de déplacer des points et de voir $r$ réagir, y compris au moment où un seul point transforme une droite jusque-là serrée en relation faible.

## Quand l'utiliser

- **Repérer des relations** avant de décider ce qu'il faut modéliser.
- **Valider** qu'une variable porte de l'information sur une cible.
- **Rapporter** une association honnêtement, accompagnée d'un nuage de points pour que le lecteur voie ce que le nombre résume.

## Limites

- **Corrélation n'est pas causalité.** Les ventes de glaces sont corrélées aux noyades ; les deux suivent la météo.
- **Elle ne mesure que les droites.** Des relations courbes fortes peuvent afficher un $r$ proche de zéro.
- **Elle est sensible aux valeurs aberrantes.** Un point très éloigné peut faire passer $r$ de 0,2 à 0,8, ou détruire une corrélation réelle.
- **Les plages restreintes la réduisent.** Corréler parmi les 10 % de valeurs les plus élevées peut cacher une relation forte globalement.
- **Combiner des groupes peut l'inventer** (paradoxe de Simpson) : deux groupes sans tendance peuvent afficher une forte tendance une fois rassemblés.

## Pièges courants

- **Lire $r^2$ comme un pourcentage puis aussi citer $r$ comme s'il en était un.** $r = 0.5$ signifie 25 % de la variation, pas 50 %.
- **Comparer des corrélations entre populations différentes** sans vérifier que les plages sont comparables.
- **Ignorer le nuage de points.** Le nombre ne peut pas vous parler de courbure, de groupes ou de valeurs aberrantes ; l'image, si.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Expliquez pourquoi l'affirmation suivante est fausse : « la corrélation entre les ventes de glaces et les morts par noyade est de 0,9, donc la glace fait mal nager les gens ».

<p class="challenge__answer">💡 <strong>Réponse :</strong> La corrélation mesure la co-variation, pas le mécanisme. Les deux variables suivent une troisième, la météo chaude, qui augmente à la fois la consommation et la baignade. La lecture correcte de $r = 0.9$ est « ces deux choses varient ensemble » ; attribuer une direction de causalité exige une expérience ou un argument bien plus solide qu'un coefficient.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Vous calculez le r de Pearson sur 12 points et obtenez 0,1, mais le nuage de points montre un U bien net. Que devriez-vous rapporter, et que donnerait Spearman ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Rapportez qu'il existe une forte relation non linéaire sans composante linéaire ; $r \approx 0$ est techniquement correct mais trompeur comme résumé. Spearman serait aussi proche de 0 ici, car les rangs n'augmentent pas de façon monotone (ils montent puis redescendent). La bonne étape suivante est de modéliser la courbure — ajuster $y$ contre $x$ et $x^2$, ou tracer une courbe lissée — plutôt que de citer l'un ou l'autre coefficient comme conclusion.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi $r$ reste-t-il inchangé si vous ajoutez 10 à chaque valeur de $x$, ou si vous multipliez chaque $y$ par 3 ?
- $r$ peut-il valoir 0,9 alors que presque tous les points sont loin de la droite d'ajustement ? Quand ?
- Si deux variables sont indépendantes, leur corrélation doit-elle être nulle ? Si leur corrélation est nulle, doivent-elles être indépendantes ?
- Que signifie qu'une corrélation est « statistiquement significative » quand $r = 0.05$ et $n$ vaut 100 000 ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-correlation-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Le r de Pearson vaut 0,8. Quelle fraction de la variation de y est associée à la tendance linéaire de x ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">80 %</button>
      <button class="quiz-q__opt" data-idx="1">0,8 %</button>
      <button class="quiz-q__opt" data-idx="2">64 %</button>
      <button class="quiz-q__opt" data-idx="3">20 %</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Quand faut-il préférer Spearman à Pearson ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Quand les deux variables suivent une loi normale.</button>
      <button class="quiz-q__opt" data-idx="1">Quand la relation est monotone mais pas linéaire, ou que les données ont des valeurs aberrantes.</button>
      <button class="quiz-q__opt" data-idx="2">Quand vous voulez prouver une causalité.</button>
      <button class="quiz-q__opt" data-idx="3">Quand l'échantillon est grand.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">3. Une corrélation de 0,95 entre deux variables établit quoi ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que l'une cause l'autre.</button>
      <button class="quiz-q__opt" data-idx="1">Que les deux suivent une loi normale.</button>
      <button class="quiz-q__opt" data-idx="2">Qu'une droite prédit y parfaitement.</button>
      <button class="quiz-q__opt" data-idx="3">Qu'elles varient ensemble le long d'une forte tendance linéaire.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
