---
title: "Le paradoxe de Simpson"
description: "Comment une tendance présente dans chaque groupe peut s'inverser une fois les groupes rassemblés, et comment la repérer avant qu'elle ne vous embarrasse."
module: "samples-and-uncertainty"
order: 13
difficulty: "intermediate"
estimatedMinutes: 18
learningObjectives:
  - "Reconnaître un jeu de données groupé dont la tendance rassemblée contredit la tendance de chaque groupe"
  - "Expliquer comment des tailles de groupe inégales créent l'inversion"
  - "Vérifier la présence du paradoxe en traçant les groupes séparément avant de les rassembler"
  - "Dire quel résumé est le plus honnête à rapporter"
prerequisites: []
tags: ["paradoxe-de-simpson", "facteur-de-confusion", "groupement", "agrégation"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

Le **paradoxe de Simpson** est l'inversion d'une tendance qui apparaît quand on combine des groupes. Un traitement peut sembler meilleur qu'un témoin dans chaque sous-groupe, et pire quand les sous-groupes sont rassemblés. Rien n'est mal calculé ; le nombre rassemblé est réel, et il répond à une question différente de celle des nombres par groupe.

Cela se produit quand les groupes diffèrent en taille *et* en niveau de référence. Le groupe le plus grand tire la moyenne rassemblée vers son propre coin, et s'il lui arrive aussi de recevoir un traitement plus souvent, le traitement hérite du désavantage du groupe.

## Ce que cela apporte

C'est l'exemple le plus clair d'un résumé arithmétiquement correct et substantiellement faux. Tout analyste agrège ; le paradoxe est la raison de regarder les groupes avant de faire confiance à un chiffre rassemblé. Le reconnaître transforme un désaccord déroutant entre deux rapports en une explication structurelle.

## Calcul à la main

Deux hôpitaux, deux groupes de gravité, taux de guérison :

| Hôpital | Cas légers | Guérisons | Cas graves | Guérisons |
|---|---|---|---|---|
| A | 90 | 81 (90 %) | 10 | 6 (60 %) |
| B | 10 | 8 (80 %) | 90 | 45 (50 %) |

**Étape 1 — comparez à l'intérieur de chaque gravité.** L'hôpital A guérit 90 % des cas légers contre 80 % pour B, et 60 % des cas graves contre 50 % pour B. A gagne dans les deux groupes.

**Étape 2 — rassemblez les totaux.** Hôpital A : $81 + 6 = 87$ guérisons sur 100, soit 87 %. Hôpital B : $8 + 45 = 53$ sur 100, soit 53 %.

**Étape 3 — vérifiez l'arithmétique.** A gagne aussi au global — donc ce tableau n'est *pas* le paradoxe, c'est le cas ordinaire. Pour voir l'inversion, donnez à B le groupe léger le plus grand :

| Hôpital | Cas légers | Guérisons | Cas graves | Guérisons |
|---|---|---|---|---|
| A | 20 | 18 (90 %) | 80 | 48 (60 %) |
| B | 90 | 72 (80 %) | 10 | 5 (50 %) |

Maintenant A guérit 90 % des cas légers contre 80 % pour B, et 60 % des cas graves contre 50 % pour B — A gagne toujours dans les deux groupes. Rassemblé : A a $18+48 = 66$ sur 100, soit 66 % ; B a $72+5 = 77$ sur 100, soit 77 %. **B gagne au global tout en perdant dans chaque sous-groupe.**

**Étape 4 — dites pourquoi.** A traite surtout des cas graves, qui ont un faible taux de guérison quel que soit l'hôpital. B traite surtout des cas légers, qui ont un taux élevé. Le chiffre rassemblé mesure *qui chaque hôpital traite* autant que *à quel point il le traite bien*.

## Le voir géométriquement

Tracez chaque groupe comme un point avec $x$ = taille du groupe et $y$ = taux de guérison. La moyenne rassemblée est une moyenne pondérée, et sa position dépend de où se situent les poids. Dans l'[explorateur du paradoxe de Simpson de GeoGebra](https://www.geogebra.org/m/dqzxhqzy), vous pouvez déplacer les tailles de groupe et voir le point rassemblé traverser les droites individuelles.

## La même chose en Python

```python
a = {'mild': (20, 18), 'severe': (80, 48)}
b = {'mild': (90, 72), 'severe': (10, 5)}

for name, g in [('A', a), ('B', b)]:
    for sev, (n, rec) in g.items():
        print(name, sev, f"{rec/n:.0%}")
    total_n = sum(n for n, _ in g.values())
    total_r = sum(r for _, r in g.values())
    print(name, 'pooled', f"{total_r/total_n:.0%}")
```

Les pourcentages par groupe favorisent A dans les deux lignes et le pourcentage rassemblé favorise B. Lire cette sortie est tout l'exercice ; le code n'ajoute que de la vitesse.

## Quand le chercher

- Toute comparaison où les groupes sont **de tailles inégales** et diffèrent par leur risque de référence.
- Rapporter un **taux rassemblé** à partir de données arrivées par lots, sites, semaines ou cohortes.
- Un résultat qui contredit l'attente d'un expert du domaine — le paradoxe est l'une des premières choses à écarter.

## Limites

- **Ce n'est pas une erreur à « corriger ».** La moyenne rassemblée est un nombre légitime pour la population rassemblée ; la question est de savoir quelle population vous visez.
- **L'analyse par groupes peut être la mauvaise** si vous conditionnez sur une variable qui est une conséquence du traitement plutôt qu'une caractéristique préexistante.
- **Il faut une variable de groupement claire.** Si vous ignorez les groupes, vous ne pouvez pas en tenir compte.

## Pièges courants

- **Rapporter le chiffre rassemblé sans les groupes**, ce qui cache entièrement l'inversion.
- **Ajuster sur la mauvaise variable**, ce qui peut créer un paradoxe plutôt que le supprimer.
- **Croire que les petits échantillons y échappent.** Le paradoxe est arithmétique ; la taille n'y change rien.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Le taux de conversion global d'une entreprise a baissé après une refonte, mais la conversion a augmenté séparément sur mobile et sur ordinateur. Quelle est l'explication la plus probable ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> La composition du trafic a changé. Si le mobile (au taux de conversion plus faible) a pris plus de place dans les visites tandis que l'ordinateur restait stable, le taux rassemblé baisse même si chaque plateforme s'améliore. Segmentez par appareil et rapportez les deux taux avec leurs volumes ; le chiffre rassemblé mesure la composition, pas la refonte.</p>

</div>
</details>

## 🤔 Questions socratiques

- Le paradoxe de Simpson peut-il apparaître avec des variables continues, pas seulement des effectifs ?
- Quelle est la « vraie » réponse, le taux rassemblé ou les taux par groupe ?
- Si vous ignoriez l'existence des groupes, à quelle conclusion le chiffre rassemblé vous mènerait-il ?
- Le fait de randomiser qui reçoit chaque traitement empêche-t-il le paradoxe ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-simpson-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Le paradoxe de Simpson décrit une situation où…</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">l'arithmétique d'un tableau est fausse.</button>
      <button class="quiz-q__opt" data-idx="1">l'échantillon est trop petit pour conclure quoi que ce soit.</button>
      <button class="quiz-q__opt" data-idx="2">une tendance présente dans chaque groupe s'inverse quand les groupes sont rassemblés.</button>
      <button class="quiz-q__opt" data-idx="3">deux variables sont corrélées sans lien causal.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Qu'est-ce qui cause habituellement l'inversion ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">L'arrondi des pourcentages.</button>
      <button class="quiz-q__opt" data-idx="1">Des tailles de groupe inégales, les groupes différant aussi par leur niveau de référence.</button>
      <button class="quiz-q__opt" data-idx="2">L'utilisation de la médiane au lieu de la moyenne.</button>
      <button class="quiz-q__opt" data-idx="3">Des valeurs aberrantes dans chaque groupe.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
