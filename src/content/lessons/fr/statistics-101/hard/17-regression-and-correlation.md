---
title: "Régression et corrélation, faites correctement"
description: "Ajuster une droite, lire sa pente comme un taux, vérifier les quatre hypothèses, et voir pourquoi r et la pente sont deux vues d'une même chose."
module: "applied-statistics"
order: 17
difficulty: "advanced"
estimatedMinutes: 40
learningObjectives:
  - "Ajuster une droite des moindres carrés à la main sur un petit jeu de données"
  - "Lire la pente comme un taux avec unités, et l'ordonnée à l'origine comme une moyenne conditionnelle"
  - "Calculer r et expliquer sa relation exacte avec la pente et les écarts types"
  - "Vérifier les quatre hypothèses de la régression sur un graphique des résidus"
  - "Expliquer quand une droite ajustée ne doit pas être extrapolée"
prerequisites: []
tags: ["régression", "moindres-carrés", "résidus", "hypothèses"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 25
section: "statistics-101"
track: "hard"
---

## Ce que cela signifie

Une **droite de régression** résume comment une réponse $y$ varie avec un prédicteur $x$. La droite des moindres carrés minimise la somme des distances verticales au carré entre les points et la droite :

$$
\hat{y} = b_0 + b_1 x, \qquad
b_1 = r\,\frac{s_y}{s_x}, \qquad
b_0 = \bar{y} - b_1 \bar{x}.
$$

La pente est la corrélation remise à l'échelle des unités des données : multipliez $r$ par le rapport des deux écarts types et vous obtenez « de combien d'unités $y$ bouge par unité de $x$ ». C'est pourquoi $r$ et $b_1$ ont toujours le même signe : ils expriment la même relation sur des échelles différentes.

## Ce que cela apporte

La corrélation dit *que* deux variables varient ensemble ; la régression dit *de combien*, dans des unités exploitables. « Corrélation 0,7 » est difficile à utiliser ; « chaque heure d'étude supplémentaire est associée à 6,3 points de plus » est une phrase sur laquelle une décision peut se construire.

La régression produit aussi les résidus — les parties de $y$ que la droite n'explique pas — et c'est sur ces résidus que se fait toute vérification des hypothèses.

## Calcul à la main

Encore les cinq étudiants : heures $x = 1,2,3,4,5$ ; scores $y = 50,55,65,70,80$.

D'après la leçon sur la corrélation : $\bar{x} = 3$, $\bar{y} = 64$, $s_x \approx 1.581$, $s_y \approx 11.94$, $r \approx 0.987$.

**Étape 1 — la pente.**

$$
b_1 = 0.987 \times \frac{11.94}{1.581} \approx 0.987 \times 7.55 \approx 7.45
$$

**Étape 2 — l'ordonnée à l'origine.**

$$
b_0 = 64 - 7.45 \times 3 = 64 - 22.35 = 41.65
$$

**Étape 3 — la droite.** $\hat{y} = 41.65 + 7.45x$.

**Étape 4 — lisez-la.** Chaque heure d'étude supplémentaire est associée à environ 7,5 points de plus. L'ordonnée à l'origine, 41,65, est le score prédit pour zéro heure — une moyenne conditionnelle, pas l'affirmation qu'un étudiant qui ne fait rien obtient 41,65 au sens causal.

**Étape 5 — les résidus.** Prédit contre réel :

| $x$ | $y$ | $\hat{y}$ | résidu |
|---|---|---|---|
| 1 | 50 | 49,1 | +0,9 |
| 2 | 55 | 56,6 | −1,6 |
| 3 | 65 | 64,0 | +1,0 |
| 4 | 70 | 71,4 | −1,4 |
| 5 | 80 | 78,9 | +1,1 |

Les résidus s'annulent (aux arrondis près), alternent de signe et restent petits — un ajustement sain pour une droite.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Prédisez le score pour 10 heures d'étude. Quelle est la prédiction, et pourquoi faut-il s'en méfier ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> $\hat{y} = 41.65 + 74.5 = 116.15$ — au-dessus du score maximal possible. C'est une extrapolation : la droite a été ajustée sur 1 à 5 heures et rien ne montre que la relation reste linéaire au-delà de cette plage. Un score ne peut pas dépasser 100, donc le modèle est déjà en dehors de son domaine valide.</p>

</div>
</details>

## Les quatre hypothèses

Vérifiez-les sur les résidus, pas sur le nuage brut :

1. **Linéarité** — les résidus ne montrent aucune courbe. Un motif en U signifie que la relation se courbe.
2. **Dispersion égale** — les résidus s'évasent (ou se resserrent) quand $x$ augmente, c'est l'hétéroscédasticité ; les erreurs types issues de l'ajustement seront alors fausses.
3. **Indépendance** — les résidus ne sont pas corrélés à l'ordre de collecte, au groupe ou au temps.
4. **Normalité approximative des résidus** — nécessaire pour les valeurs p et les intervalles, moins critique pour l'estimation de la pente elle-même.

```python
import numpy as np

x = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([50, 55, 65, 70, 80], dtype=float)

b1, b0 = np.polyfit(x, y, 1)
print(round(b1, 2), round(b0, 2))         # 7.45 41.65

resid = y - (b0 + b1 * x)
print(np.round(resid, 2))                  # [ 0.9 -1.6  1.0 -1.4  1.1]
```

Avec pandas et scipy, vous obtenez la même pente plus l'erreur type que vous rapporteriez :

```python
from scipy import stats
res = stats.linregress(x, y)
print(res.slope, res.intercept, res.rvalue, res.pvalue, res.stderr)
```

## Le voir géométriquement

La droite des moindres carrés est celle qui minimise l'aire totale des carrés dessinés sur chaque résidu. Déplacez un point dans l'[explorateur de régression de GeoGebra](https://www.geogebra.org/m/dcpcyc3t) et regardez la droite basculer — et observez qu'un seul point éloigné à l'extrémité de la plage la fait levier bien plus fort qu'un point proche du milieu.

## Quand l'utiliser

- Quantifier une relation dans les unités des données, avec une pente que vous pouvez citer.
- Ajuster sur une seconde variable, ce que fait la régression multiple et qui vous sauve du paradoxe de Simpson.
- Produire des prédictions à l'intérieur de la plage observée, avec l'incertitude attachée.

## Limites

- **Une droite ne peut pas représenter une courbe.** Si les résidus montrent une courbure, le modèle est faux quel que soit le $r$.
- **La corrélation n'est toujours pas la causalité.** Une pente de régression hérite de tous les facteurs de confusion de la corrélation.
- **Des points influents peuvent fixer la pente.** Un point à un $x$ extrême peut déplacer la droite de façon spectaculaire ; vérifiez en réajustant sans lui.
- **L'extrapolation est dangereuse** au-delà de la plage ajustée, comme le montre l'exemple des 10 heures.
- **Une plage restreinte atténue la pente.** Ajustez seulement parmi les meilleurs et la pente s'aplatit.

## Pièges courants

- **Rapporter $r$ alors que vous avez ajusté une pente** (ou l'inverse) sans dire lequel.
- **Lire l'ordonnée à l'origine comme une référence réelle** quand $x = 0$ est en dehors des données.
- **Ignorer le graphique des résidus** parce que $r$ était élevé.
- **Qualifier la pente de causale** quand le plan d'étude était observationnel.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Deux variables ont $r = 0.6$, $s_x = 2$ et $s_y = 10$. Quelle est la pente de $y$ sur $x$ ? Et celle de $x$ sur $y$ ? Pourquoi ne sont-elles pas réciproques ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> $b_{y \mid x} = 0.6 \times 10/2 = 3$ ; $b_{x \mid y} = 0.6 \times 2/10 = 0.12$. Leur produit vaut $r^2 = 0.36$, pas 1. Les moindres carrés minimisent les distances verticales, donc inverser la variable placée en ordonnée ajuste une autre droite ; les deux droites ne coïncident que lorsque $r = \pm1$.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi la droite des moindres carrés passe-t-elle par le point $(\bar{x}, \bar{y})$ ?
- Si $r = 0$, quelle est la pente des moindres carrés, et que prédit la droite pour chaque $x$ ?
- Pourquoi les résidus s'annulent-ils toujours pour un modèle avec ordonnée à l'origine ?
- Qu'implique un graphique de résidus en éventail sur l'intervalle de confiance de la pente ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-regression-fr">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Une régression du score sur les heures donne une pente de 7,45. Que signifie-t-elle ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Un étudiant sans aucune heure obtient 7,45.</button>
      <button class="quiz-q__opt" data-idx="1">Chaque heure supplémentaire est associée à environ 7,45 points de plus.</button>
      <button class="quiz-q__opt" data-idx="2">La corrélation est de 7,45.</button>
      <button class="quiz-q__opt" data-idx="3">74,5 % de la variation est expliquée.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Le graphique des résidus montre un U net. Quel est le problème ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">L'échantillon est trop petit.</button>
      <button class="quiz-q__opt" data-idx="1">La pente est négative.</button>
      <button class="quiz-q__opt" data-idx="2">La relation est courbe, donc une droite est le mauvais modèle.</button>
      <button class="quiz-q__opt" data-idx="3">L'ordonnée à l'origine n'est pas nulle.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">3. Pourquoi extrapoler une droite ajustée au-delà de la plage des données est-il risqué ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">L'arithmétique devient plus difficile.</button>
      <button class="quiz-q__opt" data-idx="1">La corrélation tombe à zéro.</button>
      <button class="quiz-q__opt" data-idx="2">L'ordonnée à l'origine change.</button>
      <button class="quiz-q__opt" data-idx="3">Rien dans les données ne montre que le schéma linéaire se poursuit là-bas.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
