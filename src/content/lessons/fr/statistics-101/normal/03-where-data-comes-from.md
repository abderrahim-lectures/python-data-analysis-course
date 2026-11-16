---
title: "D'où viennent les données"
description: "Enquêtes, capteurs, journaux et expériences : comment la méthode de collecte décide de ce à quoi les données peuvent et ne peuvent pas répondre."
module: "foundations"
order: 3
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Nommer les principales façons de collecter des données et ce à quoi chacune est bonne"
  - "Expliquer le biais d'échantillonnage et donner deux exemples concrets"
  - "Distinguer une étude observationnelle d'une expérience"
  - "Poser les quatre questions qui précèdent toute analyse"
prerequisites: []
tags: ["collecte-de-données", "échantillonnage", "biais", "contexte", "expérience"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

Chaque jeu de données a une **provenance** : qui ou quoi a produit chaque ligne, quand, et dans quelles conditions. La provenance décide de ce à quoi les données peuvent répondre, et aucune quantité d'analyse ne peut ajouter une information que l'étape de collecte n'a jamais capturée.

Les principales sources que vous rencontrerez :

| Source | Ce qu'elle donne | Ce qui lui manque souvent |
|---|---|---|
| **Enquête** | des opinions, des faits auto-déclarés | l'honnêteté, les personnes qui n'ont pas répondu |
| **Capteur / journal** | des horaires précis, des comptages | le contexte — pourquoi la valeur est apparue |
| **Dossiers administratifs** | une couverture complète d'un processus | tout ce qui sort de ce processus |
| **Expérience** | une preuve sur la cause | le réalisme — le cadre est artificiel |
| **Analytique web** | le comportement à grande échelle | l'identité, et la raison derrière un clic |

Le **biais d'échantillonnage** est ce qui se produit quand les cas observés diffèrent systématiquement de la population. Deux exemples le rendent concret :

- une enquête de satisfaction en ligne à laquelle ne répondent que les gens qui n'ont pas quitté le site — les utilisateurs partis sont exactement les mécontents, et ils manquent ;
- une étude de l'usage d'une application à partir des journaux, où quiconque n'a jamais installé l'application ne peut pas apparaître.

Dans les deux cas, l'échantillon est grand, propre et mesuré avec précision, et il répond à une autre question que celle qui avait été posée.

## Ce que cela apporte

Cela fixe le plafond de ce que toute analyse ultérieure peut affirmer. Un intervalle de confiance vous dit avec quelle précision vous avez mesuré *la population de l'échantillon* ; il ne peut pas vous dire si cette population est celle qui vous intéresse. Connaître la provenance vous dit quelle réserve attacher avant même de calculer une moyenne.

L'autre distinction qui compte est **observationnel contre expérimental** :

- dans une étude **observationnelle**, vous regardez ce qui se passe : certaines personnes ont choisi de faire de l'exercice, d'autres non, et vous les comparez ;
- dans une **expérience**, vous attribuez le traitement : vous décidez qui fait de l'exercice et qui n'en fait pas.

Seule la seconde peut soutenir une affirmation causale à elle seule, parce que l'attribution aléatoire rompt le lien entre le traitement et tout le reste de la personne.

## Exemple travaillé

Une entreprise veut savoir si un nouveau parcours de paiement augmente les achats.

- **Si elle compare les clients qui ont vu le nouveau parcours par hasard avec ceux qui ne l'ont pas vu**, elle a une comparaison observationnelle. Les deux groupes diffèrent de façons qui comptent : le nouveau parcours a peut-être été déployé sur un appareil particulier, ou auprès des comptes les plus récents, et ces différences se mêlent au résultat. Toute différence est un mélange du parcours et du déploiement.
- **Si elle attribue au hasard les visiteurs à l'ancien ou au nouveau parcours**, elle a une expérience. Les groupes ne diffèrent que par le hasard, donc une différence de taux d'achat est attribuable au parcours — dans les limites de l'erreur d'échantillonnage.

L'arithmétique ensuite est identique. La différence tient entièrement à l'étape de collecte, et c'est la différence entre une suggestion et une preuve.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Une ville mesure la qualité de l'air avec 10 capteurs, tous placés près d'écoles. Les données peuvent-elles répondre à « quelle est la qualité moyenne de l'air dans la ville » ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Pas sans nuance. Les capteurs forment un échantillon biaisé : les écoles peuvent se situer loin des zones industrielles ou, à l'inverse, le long de routes très fréquentées aux heures de dépose. Les données décrivent bien la qualité de l'air près des écoles, et ne se généralisent à la ville que si le placement des capteurs est sans lien avec les niveaux de pollution — ce qui n'est visiblement pas le cas. Rapportez « la qualité de l'air près des écoles » tant qu'un plan d'échantillonnage indépendant du placement n'est pas utilisé.</p>

</div>
</details>

## Les quatre questions avant toute analyse

1. **Qu'est-ce qu'une ligne ?** Une livraison, une personne, une session, une journée ? Se tromper là-dessus rend tout comptage faux.
2. **Qui manque dans ces données ?** Les non-répondants, les utilisateurs qui n'ont pas installé l'application, les transactions échouées avant l'enregistrement.
3. **Comment les cas ont-ils été sélectionnés ?** Au hasard, par commodité, par qui était connecté ?
4. **Quelque chose a-t-il été attribué, ou seulement observé ?** Cela décide si une affirmation causale est disponible.

## La même chose en Python

La provenance figure rarement dans le fichier, donc consignez-la à côté des données. Une habitude minimale :

```python
meta = {
    'source': 'checkout-log',
    'one_row': 'one completed checkout attempt',
    'window': '2026-10-01 to 2026-10-31',
    'missing': 'abandoned carts before payment are not logged',
    'assignment': 'observational — flow determined by device',
}

for k, v in meta.items():
    print(f'{k}: {v}')
```

Dix lignes qui préviennent la catégorie d'erreur la plus coûteuse : analyser une colonne qui ne signifie pas ce que tout le monde supposait.

## Quand l'utiliser

Chaque fois que vous ouvrez un jeu de données inconnu, et chaque fois qu'un résultat s'apprête à éclairer une décision. La vérification de provenance coûte peu et c'est l'étape qui ne peut pas être rattrapée plus tard.

## Limites

- **La provenance est souvent non documentée.** Il faut alors la reconstituer, ou traiter les conclusions comme provisoires.
- **Même un échantillon propre ne corrige pas une variable manquante.** Si la satisfaction n'a jamais été enregistrée pour les annulations, aucune analyse ne la retrouve.
- **La randomisation n'est pas toujours éthique ni possible.** Les méthodes observationnelles avec un ajustement soigné sont alors l'alternative honnête, avec leurs limites énoncées.

## Pièges courants

- **Confondre un grand échantillon avec un échantillon représentatif.** Un million de lignes biaisées reste biaisé.
- **Supposer que les journaux sont complets.** L'enregistrement échoue, les bloqueurs de publicité existent, et le trafic de robots est réel.
- **Lire une causalité dans une comparaison observationnelle** parce que l'arithmétique était sophistiquée.
- **Ignorer les non-répondants**, qui sont généralement le groupe le plus informatif d'une enquête.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Un service de streaming constate que les utilisateurs qui regardent plus de 10 heures par semaine lui donnent les meilleures notes, et conclut qu'encourager davantage de visionnage améliorera la satisfaction. Qu'est-ce qui cloche dans le raisonnement ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> La comparaison est observationnelle et plausiblement inversée : les gens qui aiment déjà le service regardent davantage. La satisfaction peut causer le visionnage plutôt que l'inverse, et les deux peuvent être poussés par un troisième facteur, comme avoir du temps libre. Pour tester l'affirmation, il faudrait encourager le visionnage dans un groupe randomisé et comparer la satisfaction.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi un grand échantillon ne compense-t-il pas un échantillon biaisé ?
- Qu'est-ce qu'une expérience peut vous dire qu'une étude observationnelle ne peut pas, et que ne peut-elle pas ?
- Si les non-répondants diffèrent des répondants, qu'estime réellement l'enquête ?
- Pourquoi « une ligne = une personne » est-il parfois une mauvaise hypothèse, même quand les données portent sur des personnes ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-provenance-fr">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que signifie le biais d'échantillonnage ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">L'échantillon est trop petit.</button>
      <button class="quiz-q__opt" data-idx="1">Les cas observés diffèrent systématiquement de la population d'intérêt.</button>
      <button class="quiz-q__opt" data-idx="2">Les mesures contiennent des erreurs aléatoires.</button>
      <button class="quiz-q__opt" data-idx="3">Les données ont été collectées trop vite.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">2. Quel plan d'étude peut soutenir une affirmation causale à lui seul ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Un grand échantillon observationnel.</button>
      <button class="quiz-q__opt" data-idx="1">Une enquête à fort taux de réponse.</button>
      <button class="quiz-q__opt" data-idx="2">Un jeu de données avec beaucoup de variables.</button>
      <button class="quiz-q__opt" data-idx="3">Une expérience randomisée.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
