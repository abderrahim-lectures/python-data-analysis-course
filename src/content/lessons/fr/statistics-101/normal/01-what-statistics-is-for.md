---
title: "À quoi sert la statistique"
description: "La statistique comme discipline pour répondre à des questions avec des données incertaines : le vocabulaire, les deux familles, et les questions auxquelles elle ne peut pas répondre."
module: "foundations"
order: 1
difficulty: "beginner"
estimatedMinutes: 16
learningObjectives:
  - "Énoncer en une phrase à quoi sert la statistique"
  - "Distinguer la statistique descriptive de la statistique inférentielle avec un exemple de chacune"
  - "Nommer les six mots que toute leçon ultérieure suppose connus : population, échantillon, paramètre, statistique, variable, observation"
  - "Reconnaître une question à laquelle la statistique ne peut pas répondre"
prerequisites: []
tags: ["vocabulaire", "définitions", "descriptive", "inférentielle"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

La **statistique** est la discipline qui consiste à répondre à des questions à l'aide de données incomplètes et incertaines.

Cette phrase comporte trois parties qu'il vaut la peine de séparer, car chacune est le lieu d'un type d'erreur différent.

- **Répondre à des questions.** S'il n'y a pas de question, il n'y a pas de statistique — seulement de l'arithmétique. « Quelle est la moyenne de ces nombres ? » est de l'arithmétique. « Le nouveau système de routage est-il plus rapide *en général* ? » est une question statistique, parce que vous ne voyez jamais que quelques livraisons.
- **À l'aide de données.** La réponse doit venir d'observations plutôt que d'une opinion ou d'une autorité.
- **Incomplètes et incertaines.** Vous ne voyez jamais tout. Un échantillon, un mois sur douze, trente pièces sur un million. Chaque conclusion porte donc une réserve sur l'ampleur de son erreur possible.

La statistique comporte deux familles :

| | Descriptive | Inférentielle |
|---|---|---|
| Question | À quoi ressemblent *ces* données ? | Que disent ces données du monde plus large ? |
| Outils | moyenne, médiane, dispersion, graphiques | erreur type, intervalles de confiance, tests |
| Risque | Résumer mal | Généraliser à tort |

La première moitié de ce cours est descriptive ; la seconde est inférentielle. Aucune n'est plus difficile, mais elles répondent à des questions différentes et la seconde repose toujours sur la première.

## Ce que cela apporte

Sans statistique, il ne vous reste que des anecdotes. « Notre dernier client était satisfait » et « la plupart de nos clients sont satisfaits » sont des affirmations différentes, et seule la seconde peut soutenir une décision. La statistique est la machinerie qui transforme un tas d'observations en une affirmation défendable et — tout aussi important — qui vous dit quand ce tas est trop petit ou trop peu représentatif pour défendre quoi que ce soit.

## Les six mots que tout le reste emploie

Apprenez-les maintenant ; chaque leçon ultérieure les utilise sans les définir.

- **Population** — l'ensemble complet des choses dont vous voulez parler. Toutes les livraisons de cette année. Tous les adultes du pays. Chaque pièce que l'usine produira un jour.
- **Échantillon** — le sous-ensemble que vous avez réellement observé. Les 25 livraisons que vous avez chronométrées. Les 400 personnes que vous avez interrogées.
- **Paramètre** — un nombre qui décrit la **population**. Le vrai temps de livraison moyen. Généralement inconnu, et c'est ce que vous cherchez à estimer.
- **Statistique** — un nombre qui décrit l'**échantillon**. La moyenne de vos 25 livraisons. Connue, mais qui oscille.
- **Variable** — une caractéristique qui peut différer entre les cas. Temps de livraison, note de satisfaction, colis endommagé ou non.
- **Observation** (ou cas, ou ligne) — une chose mesurée. Une livraison, une personne, une pièce.

Le couple paramètre/statistique est le plus important. Un paramètre est fixe et inconnu ; une statistique est connue et variable. Toute méthode inférentielle de ce cours est une façon de passer du second au premier.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Une université interroge 500 de ses 20 000 étudiants et trouve que 62 % utiliseraient une nouvelle bibliothèque ouverte tard le soir. Identifiez la population, l'échantillon, le paramètre et la statistique.

<p class="challenge__answer">💡 <strong>Réponse :</strong> Population : les 20 000 étudiants. Échantillon : les 500 interrogés. Paramètre : la vraie part des 20 000 qui l'utiliseraient — inconnue. Statistique : 62 %, la part dans l'échantillon — connue, et seulement une estimation du paramètre. L'écart entre les deux est tout le sujet de la statistique inférentielle.</p>

</div>
</details>

## Descriptive et inférentielle en une image

Vous mesurez 25 livraisons et calculez une moyenne de 18 minutes. C'est décrire vos données.

Ensuite vous demandez si la moyenne de *toutes* les livraisons est probablement proche de 18, et vous y attachez une plage. C'est inférer.

La seconde étape n'est légitime que si l'échantillon a été tiré sans biais. Un intervalle parfait autour d'un échantillon biaisé décrit une population que vous ne rencontrerez jamais. C'est pourquoi la conception de la collecte des données compte plus que la sophistication de l'analyse.

## Ce que la statistique ne peut pas faire

- **Elle ne peut pas transformer une mauvaise question en bonne question.** « Notre produit est-il bon ? » n'a pas de réponse mesurable tant que « bon » n'est pas défini comme une variable.
- **Elle ne peut pas corriger un échantillon biaisé.** Le rééchantillonner reproduit le biais avec précision.
- **Elle ne peut pas établir une causalité à partir de seules données observationnelles**, quelle que soit la force de l'association ou la sortie du logiciel.
- **Elle ne peut pas inventer une information qui n'a jamais été enregistrée.** Une variable manquante le reste ; aucune méthode ne la retrouve.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Lesquelles de ces questions sont statistiques ? (a) Quelle est la taille moyenne dans cette salle ? (b) Les habitants de cette ville sont-ils plus grands que ceux de cette autre ville ? (c) Combien font 7 × 6 ? (d) Faut-il augmenter le prix ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> (a) est descriptive : c'est de l'arithmétique sur un ensemble complet. (b) est inférentielle : les habitants de chaque ville sont des populations que vous échantillonnez, et la comparaison exige une incertitude. (c) est de l'arithmétique. (d) est une décision, pas une question statistique — des données peuvent l'éclairer (l'élasticité-prix), mais la question porte sur des objectifs, pas sur des nombres.</p>

</div>
</details>

## La même chose en Python

La distinction se retrouve dans le code que vous écrivez. Décrire un échantillon tient en une ligne :

```python
deliveries = [8, 12, 10, 15, 45]
mean = sum(deliveries) / len(deliveries)
print(mean)            # 18,0 — une statistique sur l’échantillon
```

Dire quelque chose de la population demande davantage : une erreur type, un intervalle et une hypothèse sur la façon dont l'échantillon a été tiré. C'est le sujet des modules 4 et suivants.

## Quand l'utiliser

Ce vocabulaire sert à toute conversation sur des données. Quand quelqu'un dit « l'utilisateur moyen », demandez : la moyenne de quel échantillon, représentant quelle population ?

## Limites

- **Les définitions sont précises et le monde ne l'est pas.** Décider ce qui compte comme population est un jugement, et un autre jugement donne une autre réponse.
- **La séparation descriptive/inférentielle n'est pas un classement de qualité.** Une description soignée d'un jeu de données complet vaut mieux qu'une inférence bâclée.
- **Le vocabulaire ne vous dit pas comment concevoir une étude.** Cela relève du domaine et du plan expérimental.

## Pièges courants

- **Dire « population » quand vous voulez dire « échantillon »**, ce qui rend fausse ensuite chaque affirmation d'incertitude.
- **Traiter un échantillon de convenance comme s'il était aléatoire.** Ceux qui répondent sont rarement ceux que vous vouliez.
- **Rapporter une statistique en la nommant paramètre.** « La moyenne est 18 » est une affirmation sur votre échantillon ; la moyenne de la population est inconnue.
- **Sauter la question.** « Analysons les données » sans question produit des graphiques que personne n'a demandés.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Un hôpital annonce « notre temps d'attente médian est de 4 semaines ». Quelqu'un le répète comme « le temps d'attente médian du pays est de 4 semaines ». Qu'est-ce qui a mal tourné, dans le vocabulaire de cette leçon ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Une statistique sur l'échantillon d'un hôpital a été rapportée comme un paramètre de la population nationale. C'est une généralisation sans fondement d'échantillonnage : les patients de l'hôpital ne sont pas un échantillon aléatoire du pays, donc la statistique n'estime que la population de cet hôpital — et même pas cela, si l'hôpital dessert une région ou une pathologie particulière.</p>

</div>
</details>

## 🤔 Questions socratiques

- Si vous pouviez mesurer toute la population, auriez-vous encore besoin de la statistique ?
- Pourquoi la moyenne d'échantillon est-elle « connue mais variable » tandis que la moyenne de population est « fixe mais inconnue » ?
- Quel type de question avez-vous vu rapporté avec des statistiques alors qu'elle aurait mieux valu sans ?
- Pourquoi la qualité de l'échantillon compte-t-elle plus que la complexité de la méthode ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-what-is-stats-fr">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Qu'est-ce qui distingue la statistique inférentielle de la descriptive ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">L'inférentielle utilise une arithmétique plus difficile.</button>
      <button class="quiz-q__opt" data-idx="1">L'inférentielle généralise d'un échantillon à une population, avec une incertitude énoncée.</button>
      <button class="quiz-q__opt" data-idx="2">La descriptive utilise des graphiques et l'inférentielle non.</button>
      <button class="quiz-q__opt" data-idx="3">L'inférentielle ne s'applique qu'aux données médicales.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Un nombre calculé à partir de votre échantillon s'appelle un…</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">paramètre</button>
      <button class="quiz-q__opt" data-idx="1">population</button>
      <button class="quiz-q__opt" data-idx="2">statistique</button>
      <button class="quiz-q__opt" data-idx="3">variable</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
