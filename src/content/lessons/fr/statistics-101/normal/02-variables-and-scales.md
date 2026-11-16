---
title: "Les variables et leurs échelles"
description: "Catégorielles ou numériques, et sur laquelle des quatre échelles de mesure : la classification qui décide quelles mesures sont seulement permises."
module: "foundations"
order: 2
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Classer une variable comme catégorielle ou numérique"
  - "Nommer les quatre échelles de mesure et placer une variable sur l'une d'elles"
  - "Dire quelles mesures de centre et de dispersion sont valables pour chaque échelle"
  - "Repérer un code numérique qui est en réalité une catégorie"
prerequisites: []
tags: ["variables", "échelles-de-mesure", "nominale", "ordinale", "contexte"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Ce que cela signifie

Une **variable** est une caractéristique qui peut prendre différentes valeurs selon les cas. Avant de la résumer, il faut savoir de quel type elle est, car le type décide quelle arithmétique a un sens.

La première séparation est **catégorielle contre numérique** :

- Les valeurs **catégorielles** nomment un groupe : couleur, service, oui/non, type d'appareil. Vous pouvez les compter et trouver la plus fréquente, mais « la couleur moyenne » n'a aucun sens.
- Les valeurs **numériques** sont des nombres sur lesquels l'arithmétique a un sens : temps, prix, effectif, température.

Les variables numériques se subdivisent ensuite par **échelle**, qui enregistre combien de structure les nombres portent.

| Échelle | Structure | Exemples | Résumés permis |
|---|---|---|---|
| **Nominale** | des noms seuls, sans ordre | couleur, ville, oui/non | mode, effectifs, proportions |
| **Ordinale** | des noms avec un ordre significatif | petit/moyen/grand, satisfaction de 1 à 5, échelle de douleur | médiane, mode, IQR |
| **D'intervalle** | ordonnée, écarts égaux, pas de zéro vrai | température en °C, année, score de QI | moyenne, médiane, écart type |
| **De rapport** | ordonnée, écarts égaux, zéro vrai | temps, prix, poids, effectif | tout, y compris les rapports |

La règle pratique : **l'échelle décide quelles mesures sont permises.** Une moyenne d'une variable nominale est une erreur. Un rapport entre deux valeurs d'intervalle (« il fait deux fois plus chaud aujourd'hui qu'hier ») n'a aucun sens, car 0 °C n'est pas une absence de température.

## Ce que cela apporte

Presque toutes les histoires de « les statistiques sont fausses » dans la presse se ramènent à une variable employée à la mauvaise échelle. Faire la moyenne d'étoiles n'est défendable que si vous acceptez de traiter une échelle ordinale comme une échelle d'intervalle. Citer « la température a augmenté de 50 % » n'a pas de sens sans énoncer les unités. Coder des services en 1, 2, 3 puis faire la moyenne des codes produit un nombre qui ne veut absolument rien dire.

Connaître l'échelle vous dit quelle question vous êtes même autorisé à poser.

## Exemple travaillé

Un jeu de données de tickets de support :

| Colonne | Valeurs | Type | Échelle |
|---|---|---|---|
| ticket_id | T-1001, T-1002 | catégorielle | nominale |
| priority | low, medium, high | catégorielle | **ordinale** |
| response_minutes | 3, 45, 1200 | numérique | **de rapport** |
| satisfaction | 1, 2, 3, 4, 5 | numérique | **ordinale** |
| agent_id | 12, 47, 3 | d'apparence numérique | **nominale** |
| opened_at | 2026-03-01 | date | d'intervalle |

**Lecture du tableau.**

- `ticket_id` est une étiquette qui se trouve contenir des chiffres. Le trier n'a aucun sens.
- `priority` a un ordre, donc une médiane a un sens, mais les écarts entre low et medium ne sont pas égaux aux écarts entre medium et high, donc une moyenne est déjà un pas de trop.
- `response_minutes` a un zéro vrai (une réponse instantanée) et des unités égales, donc toute mesure et tout rapport sont permis. « Deux fois plus lent » est une affirmation réelle.
- `satisfaction` est le piège classique : les nombres de 1 à 5 sont des étiquettes ordonnées, pas des mesures. Beaucoup d'équipes en font la moyenne, ce qui est une convention plutôt qu'un fait — à faire en connaissance de cause.
- `agent_id` est le piège le plus net. Il est stocké comme un nombre, donc le logiciel calculera volontiers sa moyenne, et la réponse n'a aucun sens.
- `opened_at` est d'intervalle : la différence entre deux dates a un sens, mais « 2026 vaut deux fois 1013 » n'en a pas.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Un jeu de données enregistre la taille de chemise par 1, 2, 3, 4. Est-ce numérique ? Que pouvez-vous calculer, et que ne devez-vous pas calculer ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> C'est un <em>encodage</em> numérique d'une variable catégorielle ordinale. La médiane et le mode ont un sens ; la moyenne (2,3 par exemple) n'a aucune interprétation car les pas de taille ne sont pas égaux. Le compte du nombre de personnes dans chaque taille est le résumé le plus utile.</p>

</div>
</details>

## Comment l'échelle change l'analyse

La même question — « la satisfaction est-elle plus élevée pour l'équipe A ? » — a des réponses différentes selon l'échelle :

- sur une variable **nominale**, vous comparez des proportions (« une part plus grande des clients de A a choisi "très satisfait" ») ;
- sur une variable **ordinale**, vous comparez des médianes ou des distributions, ou vous utilisez un test de rang ;
- sur une variable **d'intervalle ou de rapport**, une différence de moyennes et un test t conviennent.

Choisir la mauvaise ne change pas seulement le nombre ; cela peut inverser la conclusion. C'est pourquoi la leçon de vocabulaire précède l'arithmétique.

## La même chose en Python

```python
import pandas as pd

df = pd.DataFrame({
    'priority': pd.Categorical(['low', 'high', 'medium'], categories=['low', 'medium', 'high'], ordered=True),
    'response': [3, 45, 1200],
    'agent_id': [12, 47, 3],
})

print(df['priority'].cat.ordered)      # True — an ordered categorical
print(df['response'].mean())           # legal: ratio scale
print(df['agent_id'].mean())           # runs, but meaningless — nominal
```

pandas calculera une moyenne pour `agent_id` sans avertir. Le système de types ne vous protège pas ici ; l'échelle le fait, et seulement si vous la vérifiez.

## Quand l'utiliser

Avant tout résumé dans toute analyse. Étiqueter le type et l'échelle de chaque colonne prend une minute et prévient la plupart des erreurs du reste du cours.

## Limites

- **Les frontières relèvent parfois du jugement.** Une note de satisfaction de 1 à 10 est-elle ordinale ou d'intervalle ? Sans doute ordinale, couramment traitée comme d'intervalle. Énoncez votre choix.
- **L'échelle peut changer avec la question.** L'âge en années est de rapport ; une tranche d'âge est ordinale.
- **Les données réelles mélangent souvent les types dans une colonne** — une colonne numérique contenant `"n/a"` est à la fois numérique et manquante.
- **La classification ne vous dit rien de la qualité des données**, seulement quelle arithmétique est permise.

## Pièges courants

- **Faire la moyenne de codes.** Les codes postaux, numéros de service et identifiants d'agents sont nominaux.
- **Traiter une échelle ordinale comme d'intervalle sans le dire.**
- **Calculer des rapports sur des données d'intervalle.** « Deux fois le QI » et « deux fois la température » n'ont pas de sens.
- **Appeler une variable numérique parce qu'elle est stockée comme telle.** Vérifiez ce que les valeurs signifient, pas comment elles sont typées.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Classez chacune : (a) nombre d'enfants, (b) rang de naissance (1er, 2e, 3e), (c) taille en cm, (d) groupe sanguin, (e) note d'examen A–F, (f) année civile.

<p class="challenge__answer">💡 <strong>Réponse :</strong> (a) de rapport — un zéro vrai et des pas égaux. (b) ordinale — l'ordre compte, l'écart entre 1er et 2e n'est pas le même qu'entre 2e et 3e. (c) de rapport. (d) nominale. (e) ordinale. (f) d'intervalle — les différences ont un sens, les rapports non.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi pouvez-vous prendre une médiane d'une variable ordinale mais pas une moyenne ?
- Pourquoi 0 °C n'est-il pas « pas de température » alors que 0 kg est « pas de masse » ?
- Qu'est-ce qui casse si vous faites la moyenne d'une note de satisfaction de 1 à 5, et cela vaut-il quand même la peine ?
- Une variable peut-elle être catégorielle et numérique à la fois ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="statistics-101-variables-fr">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Quelle échelle a un ordre significatif mais des écarts inégaux ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nominale</button>
      <button class="quiz-q__opt" data-idx="1">d'intervalle</button>
      <button class="quiz-q__opt" data-idx="2">ordinale</button>
      <button class="quiz-q__opt" data-idx="3">de rapport</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Pourquoi une température moyenne en °C pose-t-elle problème comme affirmation de rapport (« deux fois plus chaud ») ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Les températures sont toujours ordinales.</button>
      <button class="quiz-q__opt" data-idx="1">Le Celsius est une échelle d'intervalle sans zéro vrai, donc les rapports n'ont pas de sens.</button>
      <button class="quiz-q__opt" data-idx="2">Les nombres sont trop petits.</button>
      <button class="quiz-q__opt" data-idx="3">La température ne peut pas être moyennée.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
