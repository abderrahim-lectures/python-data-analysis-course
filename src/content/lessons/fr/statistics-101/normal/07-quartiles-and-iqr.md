---
title: "Quartiles et écart interquartile"
description: "Coupez les données triées en quatre, puis mesurez la moitié centrale : une dispersion qu'une seule valeur extrême ne peut pas gonfler."
module: "spread-and-shape"
order: 7
difficulty: "beginner"
estimatedMinutes: 20
learningObjectives:
  - "Trouver les trois quartiles d'un petit jeu de données trié à la main"
  - "Calculer l'écart interquartile et dire ce qu'il mesure"
  - "Utiliser la règle de 1,5 × IQR pour signaler les valeurs aberrantes probables"
  - "Dessiner et lire un résumé en cinq nombres et une boîte à moustaches"
prerequisites: []
tags: ["quartiles", "écart-interquartile", "boîte-à-moustaches", "valeurs-aberrantes"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

La médiane coupe les données triées en deux. Coupez chaque moitié à nouveau et vous obtenez les **quartiles** : trois points de coupe qui divisent les données en quatre groupes de taille à peu près égale.

- $Q_1$, le premier quartile : 25 % des valeurs sont inférieures ou égales à lui.
- $Q_2$, le deuxième quartile : la médiane, 50 % en dessous.
- $Q_3$, le troisième quartile : 75 % en dessous.

L'**écart interquartile** est la distance entre les deux extrêmes :

$$
\text{IQR} = Q_3 - Q_1 .
$$

C'est la largeur de la moitié centrale des données : l'intervalle qui contient le cas typique et ignore les deux queues.

## Ce que cela apporte

L'écart type élève ses distances au carré, donc une seule valeur extrême peut le dominer. L'écart interquartile repose sur des positions, exactement comme la médiane, donc aucune valeur unique, aussi extrême soit-elle, ne peut le déplacer. Recourez à l'écart interquartile quand les queues des données sont longues ou quand vous soupçonnez que quelques entrées sont fausses sans en avoir la confirmation.

L'écart interquartile offre aussi une manière fondée de dire « cette valeur est soupçonneusement éloignée » : la **règle de 1,5 × IQR**. Tout ce qui tombe sous $Q_1 - 1.5\,\text{IQR}$ ou au-dessus de $Q_3 + 1.5\,\text{IQR}$ est signalé. C'est une convention, pas une loi, mais c'est celle que dessinent les boîtes à moustaches.

## Calcul à la main

Onze temps d'attente triés, en minutes :

$$
2,\;4,\;4,\;5,\;7,\;9,\;11,\;12,\;14,\;18,\;40
$$

**Étape 1 — la médiane.** Avec $n=11$, la position centrale est 6, donc $Q_2 = 9$.

**Étape 2 — coupez en deux moitiés.** En dessous de la médiane : $2,4,4,5,7$. Au-dessus : $11,12,14,18,40$.

**Étape 3 — les quartiles sont les médianes de ces moitiés.** Chaque moitié a cinq valeurs, donc $Q_1 = 4$ et $Q_3 = 14$.

**Étape 4 — l'écart interquartile.**

$$
\text{IQR} = 14 - 4 = 10 \text{ minutes}
$$

**Étape 5 — les bornes de signalement.** Borne basse $4 - 15 = -11$ ; borne haute $14 + 15 = 29$. La valeur 40 se situe au-dessus de 29, elle est donc signalée. L'écart type de ces données vaut environ 10,6, gonflé par ce même 40 ; l'écart interquartile, lui, ne bouge pas.

Notez que les bornes ne sont pas des consignes « supprimez cette valeur ». Elles marquent une valeur qui mérite une vérification : une faute de frappe, une unité différente ou un cas réellement inhabituel.

## Le résumé en cinq nombres et la boîte à moustaches

Cinq nombres décrivent la forme sans aucune hypothèse sur celle-ci :

$$
\text{min},\; Q_1,\; Q_2,\; Q_3,\; \text{max}
= 2,\; 4,\; 9,\; 14,\; 40 .
$$

Une boîte à moustaches dessine exactement cela : une boîte de $Q_1$ à $Q_3$ avec une ligne à la médiane, des moustaches jusqu'aux valeurs les plus extrêmes à l'intérieur des bornes, et des points pour tout ce qui dépasse. La largeur de la boîte *est* l'écart interquartile, donc le graphique rend la dispersion visible d'un coup d'œil.

Vous pouvez en construire une et déplacer les valeurs dans l'[outil de boîte à moustaches de GeoGebra](https://www.geogebra.org/m/b5cct2aq) ; voir la boîte rester en place pendant qu'une moustache s'étire est la manière la plus claire de comprendre ce que l'écart interquartile tolère.

## La même chose en Python

```python
times = [2, 4, 4, 5, 7, 9, 11, 12, 14, 18, 40]

import statistics as st
q1 = st.quantiles(times, n=4)      # [4, 9, 14]
iqr = q1[2] - q1[0]
print(q1, iqr)                      # [4, 9, 14] 10

low, high = q1[0] - 1.5 * iqr, q1[2] + 1.5 * iqr
print(low, high)                    # -11.0 29.0
print([t for t in times if t < low or t > high])   # [40]
```

Avec pandas, les mêmes quantités viennent de `describe()`, qui affiche le résumé en cinq nombres plus la moyenne et l'écart type en un seul appel :

```python
import pandas as pd

s = pd.Series(times)
print(s.describe())
```

## Quand l'utiliser

- **Données asymétriques** : revenus, prix, latences, tout ce qui a une longue queue.
- **Données suspectes** : la règle des bornes trouve les entrées à vérifier avant qu'elles ne déforment une moyenne.
- **Comparer des groupes** de tailles d'échantillon différentes, où une boîte à moustaches par groupe est plus informative que deux moyennes.

## Limites

- **Il jette les queues.** Deux jeux de données peuvent partager un résumé en cinq nombres et différer sur tout le reste.
- **Les définitions des quartiles varient.** Différents logiciels calculent $Q_1$ et $Q_3$ légèrement différemment pour de petits échantillons, donc un résultat à la main peut être décalé d'un cran par rapport à celui d'un package. L'écart interquartile reste assez stable pour un usage pratique.
- **Pas d'arithmétique.** Comme la médiane, il ne s'additionne pas entre groupes.
- **Les petits échantillons donnent des quartiles grossiers.** Avec moins d'une huitaine de valeurs, les quartiles n'informent guère plus que le minimum et le maximum.

## Pièges courants

- **Ne pas trier d'abord.** Les quartiles sont positionnels comme la médiane ; des données non triées donnent des absurdités.
- **Lire les moustaches d'une boîte à moustaches comme le minimum et le maximum.** Les moustaches s'arrêtent à la borne ; les points au-delà sont dessinés séparément.
- **Prendre un signalement de valeur aberrante pour une erreur.** C'est une invitation à regarder, pas un verdict.
- **Comparer des écarts interquartiles d'unités différentes.** Les minutes et les euros ne sont pas comparables ; utilisez le coefficient de variation si vous devez comparer des dispersions.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Données : $1, 2, 3, 4, 5, 6, 7, 8, 9, 100$. Calculez l'écart interquartile et l'écart type. Quel résumé décrit mieux le milieu, et que rapporteriez-vous à un lecteur ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> $Q_1 = 3$, $Q_3 = 8$, IQR $= 5$ ; la moyenne vaut 14,5 et l'écart type environ 29,4, tous deux dominés par le 100. Rapportez la médiane (5,5) et l'écart interquartile (5), et signalez le 100 comme une observation à part. Le résumé en cinq nombres reste honnête là où la moyenne et l'écart type décrivent un jeu de données qui n'existe pas.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi aucune valeur unique ne peut-elle modifier l'écart interquartile comme elle modifie l'étendue ?
- Si la boîte d'une boîte à moustaches est très étroite mais les moustaches longues, à quoi ressemblent les données ?
- Pourquoi le multiplicateur 1,5 est-il une convention plutôt qu'une règle dérivée des données ?
- Que montre une boîte à moustaches qu'un histogramme ne montre pas, et que cache-t-elle ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-iqr-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Que mesure l'écart interquartile ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La distance de la plus petite à la plus grande valeur.</button>
      <button class="quiz-q__opt" data-idx="1">La distance moyenne à la moyenne.</button>
      <button class="quiz-q__opt" data-idx="2">La largeur de la moitié centrale des données triées.</button>
      <button class="quiz-q__opt" data-idx="3">La valeur la plus fréquente.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Q1 = 20 et Q3 = 50. Au-dessus de quelle valeur la règle de 1,5 × IQR signale-t-elle un point ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">50</button>
      <button class="quiz-q__opt" data-idx="1">95</button>
      <button class="quiz-q__opt" data-idx="2">80</button>
      <button class="quiz-q__opt" data-idx="3">125</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
