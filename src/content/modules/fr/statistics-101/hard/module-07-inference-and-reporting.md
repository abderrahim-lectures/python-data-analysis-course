---
title: "Inférence et rédaction"
description: "Régression multiple et rééchantillonnage : ajuster sur des facteurs de confusion, et énoncer une incertitude qu'un relecteur peut vérifier."
order: 7
section: "statistics-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 3
lessonCount: 2
tags: ["régression-multiple", "facteur-de-confusion", "bootstrap", "rapport"]
prerequisites: []
icon: "🧪"
---

## Pourquoi c'est important

Les deux dernières leçons avancées portent sur la défendabilité. Un coefficient à une variable est le nombre le plus facile à produire en statistique et le plus facile à renverser ; un intervalle bâti sur une hypothèse que personne n'a vérifiée peut sembler précis et être faux.

Les deux leçons remplacent un raccourci par une procédure : ajuster sur un facteur de confusion mesuré plutôt que rassembler, et rééchantillonner plutôt que supposer une forme. Ni l'une ni l'autre n'est compliquée, et chacune transforme une affirmation en quelque chose qu'un relecteur peut examiner.

## Ce que vous allez apprendre

- Lire un coefficient ajusté avec sa clause « à autres variables fixées », et savoir quand l'ajustement est une erreur
- Distinguer un facteur de confusion d'un médiateur et d'un collider
- Construire un intervalle par rééchantillonnage quand les hypothèses d'une formule ne tiennent pas
- Séparer l'erreur d'échantillonnage du biais, et rédiger une analyse qui nomme ses propres limites
