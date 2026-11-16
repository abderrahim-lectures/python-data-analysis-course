---
title: "Variance et écart type"
description: "La distance quadratique moyenne à la moyenne, et la racine carrée qui la ramène dans les unités des données."
module: "spread-and-shape"
order: 6
difficulty: "beginner"
estimatedMinutes: 22
learningObjectives:
  - "Calculer les écarts à la moyenne et vérifier qu'ils s'annulent"
  - "Calculer une variance d'échantillon à la main, étape par étape"
  - "Convertir une variance en écart type et l'interpréter dans les unités d'origine"
  - "Expliquer pourquoi le diviseur est n − 1 pour un échantillon"
  - "Dire combien d'écarts types séparent une valeur donnée de la moyenne"
prerequisites: []
tags: ["variance", "écart-type", "dispersion", "écart"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

Une mesure de **dispersion** répond à la question : à quelle distance du centre les valeurs se situent-elles typiquement ? La plus simple est l'**étendue**, la plus grande valeur moins la plus petite. Elle est facile et presque inutile, car elle ne repose que sur deux valeurs et une seule entrée extrême peut la fixer.

Les mesures utiles se construisent à partir de la distance de *chaque* valeur à la moyenne. Pour des valeurs $x_1,\dots,x_n$ de moyenne $\bar{x}$, l'**écart** de chaque valeur est

$$
d_i = x_i - \bar{x}.
$$

Certains écarts sont positifs, d'autres négatifs, et ils s'annulent toujours :

$$
\sum_{i=1}^{n} (x_i - \bar{x}) = 0.
$$

C'est une propriété de la moyenne elle-même, et c'est la raison pour laquelle vous ne pouvez pas simplement faire la moyenne des écarts : le résultat est toujours zéro. Le fait de les élever au carré supprime le signe. La **variance** est la moyenne des écarts au carré :

$$
s^2 = \frac{1}{n-1}\sum_{i=1}^{n} (x_i - \bar{x})^2 .
$$

L'**écart type** est sa racine carrée :

$$
s = \sqrt{s^2}.
$$

L'élévation au carré a faussé les unités (les minutes sont devenues des minutes au carré), donc la racine carrée les rétablit. C'est toute la raison d'être des deux nombres : la variance est la quantité qui se comporte bien en algèbre, l'écart type est celle qu'un humain peut interpréter.

## Ce que cela apporte

Un centre vous dit où se situent les données. La dispersion vous dit à quel point vous pouvez faire confiance à ce centre comme description, à quel point une valeur isolée est inhabituelle, et si deux groupes qui se ressemblent en moyenne le sont réellement.

C'est aussi la manière dont l'incertitude s'exprime partout ailleurs en statistique : un intervalle de confiance, un test t et une corrélation consomment tous un écart type. Maîtrisez cette quantité et le reste du cours relève surtout de la comptabilité.

## Calcul à la main

Encore les cinq durées de livraison : $8,\;10,\;12,\;15,\;45$ minutes. La moyenne est 18.

**Étape 1 — les écarts à la moyenne.**

$$
8-18 = -10,\quad 10-18 = -8,\quad 12-18 = -6,\quad 15-18 = -3,\quad 45-18 = 27
$$

**Étape 2 — vérifiez qu'ils s'annulent.** $-10-8-6-3+27 = 0$. Si vos écarts ne s'annulent pas, la moyenne que vous avez soustraite est fausse ; c'est la vérification arithmétique la moins coûteuse en statistique.

**Étape 3 — élevez chaque écart au carré.**

$$
100,\quad 64,\quad 36,\quad 9,\quad 729
$$

**Étape 4 — additionnez les carrés.** $100 + 64 + 36 + 9 + 729 = 938$.

**Étape 5 — divisez par $n-1 = 4$.**

$$
s^2 = \frac{938}{4} = 234.5
$$

**Étape 6 — prenez la racine carrée.**

$$
s = \sqrt{234.5} \approx 15.3 \text{ minutes}
$$

Interprétation : une livraison typique se situe à environ 15 minutes de la moyenne de 18. Ce nombre est grand par rapport à la moyenne, et il doit l'être : quatre des cinq durées se tiennent à moins de 10 minutes les unes des autres et la cinquième est à 27 minutes.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Retirez la livraison de 45 minutes et refaites les étapes 5 et 6 avec les quatre valeurs restantes, dont la moyenne est 11,25. Qu'est-ce qui a le plus changé, la moyenne ou l'écart type ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Les écarts valent $-3.25, -1.25, 0.75, 3.75$ ; la somme des carrés vaut $10.5625 + 1.5625 + 0.5625 + 14.0625 = 26.75$ ; $s^2 = 26.75/3 \approx 8.92$ ; $s \approx 2.99$ minutes. La moyenne est passée de 18 à 11,25, mais l'écart type s'est effondré de 15,3 à 3,0. Une seule valeur était responsable de la majeure partie de l'incohérence apparente.</p>

</div>
</details>

## Pourquoi n − 1

Quand vous calculez une moyenne à partir d'un échantillon, vous avez déjà utilisé les données une fois, et les écarts sont mesurés à partir de *cette* moyenne plutôt que de la vraie moyenne inconnue. La moyenne de l'échantillon se place aussi près des données qu'elle le peut, donc les écarts au carré que vous calculez sont systématiquement un peu trop petits. Diviser par $n-1$ au lieu de $n$ corrige cela.

Deux lectures honnêtes :

- à $n = 5$ la différence est grande (diviser par 4, pas par 5, soit une inflation de 25 %) ; à $n = 1000$ elle est négligeable ;
- certaines quantités (décrire une population entière, pas estimer à partir d'un échantillon) divisent bien par $n$, et c'est pourquoi vous verrez les deux formules.

Dans ce cours, nous utilisons $n-1$ chaque fois que les données forment un échantillon, c'est-à-dire presque toujours.

## La même chose en Python

```python
times = [8, 10, 12, 15, 45]
n = len(times)
mean = sum(times) / n

squared = [(x - mean) ** 2 for x in times]
variance = sum(squared) / (n - 1)
sd = variance ** 0.5

print(round(variance, 2))   # 234.5
print(round(sd, 2))         # 15.31
```

La bibliothèque standard donne le même résultat, avec le diviseur $n-1$ par défaut :

```python
import statistics as st

print(st.variance(times))       # 234.5
print(st.stdev(times))          # 15.313...
print(st.pstdev(times))         # 13.693...  ← divides by n (population)
```

Attention à la dernière ligne : `pstdev` est la forme « population », et mélanger les deux est une source fréquente de résultats qui diffèrent de quelques pour cent d'un manuel.

## À quelle distance est-on inhabituel ?

Une fois que vous avez une moyenne et un écart type, vous pouvez dire à quel point une valeur est inhabituelle en unités de dispersion :

$$
z = \frac{x - \bar{x}}{s}.
$$

Pour la livraison de 45 minutes, $z = (45-18)/15.3 \approx 1.76$ : elle se situe 1,76 écart type au-dessus de la moyenne. Pour un repère approximatif sur des données à peu près en cloche, environ deux tiers des valeurs tombent à moins d'un écart type et environ 95 % à moins de deux. Le 45 est à l'intérieur de deux écarts types, ce qui rappelle utilement que l'échantillon est petit et que « inhabituel » demande de la prudence.

## Le voir géométriquement

Chaque écart au carré est l'aire d'un carré dessiné sur cet écart. La variance est l'aire moyenne ; l'écart type est la longueur du côté d'un carré ayant cette aire moyenne. Dans l'[explorateur d'écart type de GeoGebra](https://www.geogebra.org/m/xwqpnvfy), vous pouvez déplacer un point et voir l'aire moyenne croître bien plus vite que l'écart lui-même, ce qui explique pourquoi une seule valeur extrême gonfle si brutalement la variance.

## Quand l'utiliser

- Comparer la **cohérence** entre groupes de même unité (deux machines, deux classes, deux mois).
- Transformer une valeur brute en une valeur **standardisée**, ce qui permet aux méthodes ultérieures (corrélation, régression, tests z) de placer des variables différentes sur une même échelle.
- Rapporter l'**incertitude** autour d'une moyenne : l'erreur type que vous rencontrerez plus tard vaut $s/\sqrt{n}$.

## Limites

- **Sensible aux valeurs aberrantes, plus que la moyenne.** Les écarts sont au carré, donc une valeur deux fois plus éloignée contribue quatre fois plus.
- **Significatif uniquement pour des données numériques** et comparable seulement à unités égales. Un écart type de 5 ne signifie pas la même chose en minutes et en euros.
- **Suppose un centre raisonnable.** Pour des données fortement asymétriques, un écart type autour de la moyenne peut induire en erreur ; l'écart interquartile est souvent le meilleur résumé.
- **Ce n'est pas une étendue.** « À moins d'un écart type » n'est pas une promesse sur chaque valeur ; c'est une distance typique.

## Pièges courants

- **Diviser par $n$ quand vous vouliez $n-1$.** Votre résultat sera légèrement trop bas et différera de la plupart des logiciels.
- **Oublier la racine carrée** et rapporter une variance comme s'il s'agissait d'un écart type.
- **Comparer des écarts types d'unités différentes.** Convertissez d'abord en coefficient de variation ($s/\bar{x}$).
- **Arrondir en cours de route.** Gardez la précision complète jusqu'à l'étape 5 ; arrondir les écarts trop tôt peut déplacer le dernier chiffre du résultat.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Ajoutez 10 à chaque valeur du jeu de données. Que deviennent la moyenne, la variance et l'écart type ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> La moyenne augmente de 10 ; chaque écart $x_i - \bar{x}$ reste inchangé, donc la variance et l'écart type sont exactement identiques. Décaler les données ne change pas la dispersion. En revanche, multiplier chaque valeur par 2 double la moyenne et l'écart type, et multiplie la variance par 4.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Deux machines remplissent des bouteilles. La machine A délivre 500 ml avec un écart type de 2 ml ; la machine B délivre 505 ml avec un écart type de 8 ml. Laquelle achèteriez-vous si le sous-remplissage est un problème légal, et laquelle si le sur-remplissage gaspille de l'argent ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Contre le sous-remplissage, A : sa moyenne est plus basse mais sa dispersion est faible, donc les pires cas sont plus proches de la cible ; avec B, un manque de deux écarts types tombe près de 489 ml. Contre le gaspillage, B gaspille 5 ml en moyenne, mais la dispersion serrée de A permet de viser plus près du minimum légal en sécurité. La comparaison porte sur la distribution entière, pas sur la seule moyenne.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi les écarts s'annulent-ils toujours, quelles que soient les données ?
- Un écart type peut-il être plus grand que la moyenne ? Qu'est-ce que cela implique sur les données ?
- Pourquoi l'élévation au carré rend-elle la mesure plus sensible aux valeurs extrêmes que ne le feraient des distances absolues ?
- Si deux jeux de données ont des moyennes égales et des écarts types égaux, doivent-ils se ressembler ? Qu'est-ce qui pourrait encore différer ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-variance-fr">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Pourquoi élevons-nous les écarts au carré avant d'en faire la moyenne ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Pour rendre les nombres plus grands.</button>
      <button class="quiz-q__opt" data-idx="1">Parce que les écarts positifs et négatifs s'annuleraient sinon jusqu'à zéro.</button>
      <button class="quiz-q__opt" data-idx="2">Parce que les valeurs au carré sont plus faciles à calculer.</button>
      <button class="quiz-q__opt" data-idx="3">Pour retirer les valeurs aberrantes du jeu de données.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Un échantillon a une variance de 49. Quel est son écart type ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">49</button>
      <button class="quiz-q__opt" data-idx="1">2401</button>
      <button class="quiz-q__opt" data-idx="2">7</button>
      <button class="quiz-q__opt" data-idx="3">24,5</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. Pourquoi diviser par n − 1 plutôt que par n pour la variance d'un échantillon ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Parce que les écarts sont mesurés à partir de la moyenne de l'échantillon, elle-même ajustée aux données et légèrement trop proche d'elles.</button>
      <button class="quiz-q__opt" data-idx="1">Parce qu'une valeur manque toujours dans un échantillon.</button>
      <button class="quiz-q__opt" data-idx="2">Parce que cela rend le résultat rond.</button>
      <button class="quiz-q__opt" data-idx="3">Parce que la médiane a besoin d'un ajustement.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
