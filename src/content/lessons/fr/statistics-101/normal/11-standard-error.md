---
title: "L'erreur type"
description: "De combien une moyenne d'échantillon oscillerait si vous répétiez l'étude : l'écart type divisé par la racine carrée de n."
module: "samples-and-uncertainty"
order: 11
difficulty: "intermediate"
estimatedMinutes: 20
learningObjectives:
  - "Distinguer l'écart type des données de l'erreur type de la moyenne"
  - "Calculer une erreur type à la main à partir d'un échantillon"
  - "Expliquer pourquoi quadrupler n ne fait que diviser l'erreur par deux"
  - "Voir la distribution d'échantillonnage de la moyenne dans une expérience que vous pouvez mener vous-même"
prerequisites: []
tags: ["erreur-type", "distribution-d-échantillonnage", "incertitude", "théorème-central-limite"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

L'**écart type** décrit à quel point les *données* sont dispersées. L'**erreur type** décrit à quel point *la moyenne elle-même* serait dispersée si vous répétiez l'étude de nombreuses fois.

$$
\text{ET} = \frac{s}{\sqrt{n}}
$$

où $s$ est l'écart type de l'échantillon et $n$ la taille de l'échantillon.

Les deux répondent à des questions différentes. Si une classe de 30 étudiants a un écart type de 12 points à un examen, les étudiants varient d'environ 12 points. Si vous répétiez la classe avec 30 nouveaux étudiants, la *moyenne* de la classe ne varierait que de $12/\sqrt{30} \approx 2.2$ points. Le premier nombre parle des personnes ; le second parle de votre estimation.

## Ce que cela apporte

Toute moyenne que vous calculez est un tirage unique dans une distribution de moyennes possibles. L'erreur type est la largeur de cette distribution, elle vous dit donc à quel point faire confiance au nombre que vous vous apprêtez à rapporter.

C'est aussi l'ingrédient de presque tous les intervalles en statistique appliquée : un intervalle de confiance à 95 % pour une moyenne vaut à peu près $\bar{x} \pm 2\,\text{ET}$, et le test t est un rapport entre une différence et une erreur type. Comprendre cette seule quantité démystifie la plupart des formules que vous rencontrerez ensuite.

## Calcul à la main

Un échantillon de $n = 25$ durées de livraison a une moyenne de 18 minutes et un écart type d'échantillon de 15,3 minutes.

**Étape 1 — la racine carrée de n.**

$$
\sqrt{25} = 5
$$

**Étape 2 — divisez.**

$$
\text{ET} = \frac{15.3}{5} = 3.06 \text{ minutes}
$$

**Étape 3 — lisez.** Les livraisons individuelles varient d'environ 15 minutes, mais la *moyenne* de 25 d'entre elles n'est incertaine que d'environ 3 minutes. Si l'étude était répétée avec un nouvel ensemble de 25 livraisons, la nouvelle moyenne tomberait typiquement à environ 3 minutes de 18.

## Pourquoi la racine carrée

La racine carrée est la partie la plus importante de la formule, car elle fixe la vitesse à laquelle des données supplémentaires achètent de la précision. Pour diviser l'erreur par deux, il faut **quadrupler** l'échantillon :

| $n$ | ET pour $s = 15.3$ |
|---|---|
| 25 | 3,06 |
| 100 | 1,53 |
| 400 | 0,77 |
| 2500 | 0,31 |

Dix fois plus de données donnent environ trois fois plus de précision. C'est pourquoi les sondages s'arrêtent autour de mille répondants : au-delà, la courbe s'aplatit, et l'erreur restante est dominée par le biais plutôt que par l'échantillonnage.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Un sondage de 400 personnes estime le soutien à 52 % avec une erreur type de 2,5 points de pourcentage. Un concurrent interroge 1 600 personnes. Quelle est son erreur type, et cela change-t-il beaucoup la conclusion probable ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Quadrupler $n$ divise l'erreur par deux : environ 1,25 point. L'estimation est bien plus nette, mais si les deux sondages trouvaient 52 %, la conclusion est la même — la précision supplémentaire ne déplace pas le centre, elle ne fait que resserrer l'intervalle autour de lui.</p>

</div>
</details>

## La même chose en Python

```python
import statistics as st

times = [8, 10, 12, 15, 45]
n = len(times)
s = st.stdev(times)
se = s / (n ** 0.5)
print(round(s, 2), round(se, 2))    # 15.31 6.85
```

Et l'expérience qui rend le concept concret : tirez de nombreux échantillons de la même population et mesurez combien les moyennes d'échantillon varient. Cette dispersion devrait correspondre à l'erreur type.

```python
import random, statistics as st

population = [random.gauss(50, 10) for _ in range(10_000)]
means = [st.mean(random.sample(population, 25)) for _ in range(2000)]

print(round(st.pstdev(means), 2))                                  # ≈ 2.0
print(round(st.pstdev(population) / 25 ** 0.5, 2))                 # ≈ 2.0
```

L'accord des deux nombres est toute la leçon, et cela vaut la peine de l'exécuter une fois de vos propres yeux.

## Le voir géométriquement

La distribution d'échantillonnage est une courbe en cloche tracée autour de votre estimation, et l'erreur type en est la demi-largeur. Resserre-la en augmentant $n$ dans la [démonstration de distribution d'échantillonnage de GeoGebra](https://www.geogebra.org/m/tqjfjzpt) et observez la courbe se resserrer au rythme de la racine carrée de la taille de l'échantillon.

## Quand l'utiliser

- Rapporter **la précision** d'une estimation, sous forme de nombre ou d'intervalle de confiance.
- Comparer une différence à son **niveau de bruit**, ce que font les tests de signification ultérieurs.
- Planifier une étude : résolvez $\text{ET} = s/\sqrt{n}$ pour trouver le $n$ qui donne une erreur acceptable.

## Limites

- **Elle ne mesure que l'erreur d'échantillonnage.** Si l'échantillon est biaisé, une petite erreur type ne fait que rendre la mauvaise réponse plus précise.
- **Elle suppose des observations indépendantes.** Des mesures répétées sur la même personne ne sont pas indépendantes, et la formule simple sous-estime l'erreur.
- **Les petits échantillons exigent la loi t**, pas le multiplicateur normal de 2,0.
- **Elle ne dit rien des données elles-mêmes.** Une erreur type de 1 ne signifie pas que les valeurs individuelles sont proches de la moyenne.

## Pièges courants

- **La confondre avec l'écart type.** C'est la confusion la plus fréquente de toute la statistique : « les barres d'erreur sont minuscules » décrit souvent l'erreur type d'une moyenne, pas la dispersion des cas.
- **Diviser par n au lieu de √n.** L'erreur diminue bien plus lentement que ce que les gens attendent.
- **Rapporter l'erreur type comme une plage ± autour de chaque valeur.** C'est une plage pour la moyenne, pas pour les données.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Deux études estiment la même moyenne. L'étude A a $n = 100$ et $s = 20$ ; l'étude B a $n = 100$ et $s = 5$. Quelle estimation est la plus précise, et de combien ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> A : ET $= 20/10 = 2$. B : ET $= 5/10 = 0.5$. B est quatre fois plus précise alors que les deux ont utilisé 100 observations — la précision dépend aussi de la variabilité propre aux données, pas seulement de la taille de l'échantillon. C'est pourquoi maîtriser le bruit de mesure vaut mieux que simplement collecter davantage.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi l'erreur type diminue-t-elle tandis que l'écart type reste à peu près constant quand $n$ augmente ?
- Si l'erreur type est petite, la moyenne est-elle exacte ? Que faut-il d'autre ?
- Pourquoi la racine carrée figure-t-elle au dénominateur plutôt que l'effectif lui-même ?
- Que signifierait une erreur type nulle, et qu'est-ce qui la rendrait suspecte ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-standard-error-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Que mesure l'erreur type de la moyenne ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">À quel point les valeurs individuelles sont dispersées.</button>
      <button class="quiz-q__opt" data-idx="1">La taille de l'échantillon.</button>
      <button class="quiz-q__opt" data-idx="2">De combien la moyenne d'échantillon varierait entre des études répétées.</button>
      <button class="quiz-q__opt" data-idx="3">La distance moyenne à la médiane.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Un échantillon de 36 a un écart type de 12. Quelle est l'erreur type ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0,33</button>
      <button class="quiz-q__opt" data-idx="1">2,0</button>
      <button class="quiz-q__opt" data-idx="2">6,0</button>
      <button class="quiz-q__opt" data-idx="3">12,0</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
