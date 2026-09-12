---

title: "Analyse bivariée & multivariée"
description: "Explorer les relations entre variables avec des nuages de points, des pair plots et des matrices de corrélation."
order: 3
section: "data-analysis"
track: "hard"
difficulty: "advanced"
estimatedHours: 5
lessonCount: 2
tags: ["bivariate", "correlation", "scatter-plots", "pair-plots"]
prerequisites: ["module-02-univariate-analysis"]
icon: "🔗"
---

## Pourquoi c'est important

Les variables vivent rarement en isolation. Le véritable enseignement de tout jeu de données émerge lorsque vous examinez comment deux variables ou plus interagissent. Un hôpital connaît l'âge des patients, mais la question qui compte est : comment l'âge se rapporte-t-il au temps de récupération ? Une école connaît les notes de tests, mais l'enseignement exploitable est : comment les notes diffèrent-elles selon les méthodes d'enseignement ? L'analyse bivariée et multivariée est là où les colonnes individuelles deviennent des histoires.

Le danger de sauter cette étape est énorme. Une équipe marketing pourrait remarquer que les taux d'ouverture des e-mails ont augmenté après une refonte de campagne. Mais sans vérifier la relation entre le taux d'ouverture et le segment de clients, elle rate le fait que l'augmentation vient entièrement des nouveaux abonnés, les clients existants se sont en réalité désengagés. La pensée à une seule variable les a menés à une conclusion fausse. La pensée à deux variables aurait attrapé le problème.

L'analyse de corrélation ajoute de la rigueur quantitative. La corrélation de Pearson vous dit si deux variables se déplacent ensemble linéairement. La corrélation de Spearman capture les relations monotones que Pearson rate. Mais les deux peuvent induire en erreur, la corrélation n'implique pas la causalité, et une forte corrélation peut émerger de facteurs de confusion. Ce module vous apprend à voir les relations visuellement et à les interpréter statistiquement, tout en gardant un scepticisme sain sur ce que ces relations signifient réellement.

L'extension multivariée, les pair plots, les heatmaps de corrélation et les comparaisons groupées, vous permet d'examiner de nombreuses relations simultanément. C'est là que vous découvrez la multicolinéarité avant qu'elle ne casse un modèle de régression, et là que vous trouvez les sous-groupes cachés que les moyennes simples masquent.

## Ce que vous allez apprendre

- Créer des nuages de points, des reg plots et des joint plots pour les relations numérique-numérique
- Construire des boîtes à moustaches groupées, des swarm plots et des diagrammes violons pour les comparaisons numérique-catégorielle
- Calculer et visualiser les matrices de corrélation de Pearson et de Spearman avec des heatmaps
- Identifier la multicolinéarité, les facteurs de confusion et le paradoxe de Simpson dans les vues multivariées
- Distinguer corrélation et causalité en utilisant la connaissance du domaine et la conception de l'étude

## La dérivation

Le problème central que l'analyse bivariée adresse est celui-ci : connaître deux variables indépendamment ne vous dit rien sur la manière dont elles se rapportent. L'approche naïve consiste à regarder deux statistiques récapitulatives côte à côte, le salaire moyen des hommes et le salaire moyen des femmes. Mais cela cache la distribution. Peut-être que les hommes ont un écart plus large. Peut-être que le chevauchement est énorme. Peut-être qu'il y a une troisième variable (les années d'expérience) qui explique tout l'écart.

Les nuages de points résolvent cela en traçant chaque observation comme un point dans un espace bidimensionnel. L'axe des x est une variable, l'axe des y en est une autre. Les schémas émergent immédiatement : une pente positive suggère une relation positive, une pente négative suggère une relation inverse, un nuage sans direction suggère l'absence de relation linéaire. L'ajout d'une ligne de régression quantifie la tendance. L'ajout d'un intervalle de confiance montre son incertitude.

Considérez maintenant les paires numérique-catégorielle. Vous ne pouvez pas tracer en nuage de points une variable continue contre des catégories. À la place, les boîtes à moustaches groupées ou les diagrammes violons vous permettent de comparer les distributions entre les groupes. Cela révèle si les catégories expliquent la variation de la variable continue, le fondement de l'ANOVA et des tests t.

Les matrices de corrélation compressent toutes les relations par paires en un tableau unique. Chaque cellule contient un coefficient de -1 (négatif parfait) à +1 (positif parfait), 0 signifiant l'absence de relation linéaire. Visualisée comme une heatmap, vous pouvez repérer instantanément quelles variables sont fortement corrélées, lesquelles sont indépendantes, et lesquelles pourraient être redondantes. Cela est essentiel avant de construire un quelconque modèle de régression : une multicolinéarité élevée gonfle les erreurs types et rend les coefficients peu fiables.

L'enseignement final est le paradoxe de Simpson : une tendance qui apparaît dans les données agrégées peut s'inverser lorsque vous regardez les sous-groupes. Les notes de tests pourraient sembler plus élevées pour le Groupe A dans l'ensemble, mais dans chaque tranche d'âge, le Groupe B obtient des notes plus élevées. L'agrégation a caché la vérité. L'analyse bivariée à plusieurs niveaux la révèle.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : construire une heatmap de corrélation de zéro, détecter le paradoxe de Simpson dans un jeu de données, identifier la multicolinéarité et proposer une correction, créer un tableau de bord de comparaison appariée
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Déblocage du projet de synthèse** : vos compétences bivariées sont essentielles pour le projet de synthèse du Module 5

## Projets que vous pouvez construire

Une fois ce module terminé, vous serez prêt à aborder ces projets réels :

- 🏠 **Prédicteur de prix immobiliers**, explorer les relations entre les caractéristiques et les prix de vente
- 🩺 **Analyseur de résultats cliniques**, examiner comment les facteurs patients corrèlent avec les résultats de traitement
- 📈 **Corrélateur de tendances de marché**, analyser les relations entre les indicateurs économiques
- 🎓 **Cartographe de résultats éducatifs**, étudier comment les facteurs démographiques se rapportent à la performance académique
- 🏋️ **Corrélateur de performance fitness**, explorer comment les variables d'entraînement se rapportent aux gains de performance

## Leçons

1. Analyse numérique bivariée, Nuages de points, lignes de régression, joint plots et stratégies de regroupement
2. Analyse de corrélation, Pearson contre Spearman, visualisation par heatmap et détection de la multicolinéarité