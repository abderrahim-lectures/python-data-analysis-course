---

title: "Visualisations avancées & narration"
description: "Aller au-delà des graphiques par défaut vers des figures de qualité publication et une narration de données qui conduit à l'action."
order: 4
section: "data-analysis"
track: "hard"
difficulty: "advanced"
estimatedHours: 5
lessonCount: 2
tags: ["storytelling", "advanced-plots", "matplotlib", "presentation"]
prerequisites: ["module-03-bivariate-analysis"]
icon: "🎨"
---

## Pourquoi c'est important

Un graphique que personne ne lit est pire que pas de graphique du tout. L'écart entre l'exploration et la communication est là où échouent la plupart des scientifiques des données. Vous pouvez produire un nuage de points parfait avec le bon coefficient de corrélation, la bonne taille d'échantillon, la bonne p-value — et votre auditoire voit un nuage de points et hausse les épaules. L'enseignement meurt dans l'écart entre votre analyse et leur compréhension.

Ce n'est pas un problème technique. C'est un problème de conception. Les couleurs par défaut de matplotlib ne sont pas choisies pour l'accessibilité aux daltoniens. La police de titre par défaut n'est pas choisie pour l'impact. La disposition par défaut n'est pas choisie pour le flux narratif. Chaque valeur par défaut travaille contre la communication. La visualisation avancée est la discipline de délibérément remplacer chaque valeur par défaut.

La narration de données est le pont entre l'analyse et l'action. Le Wall Street Journal ne publie pas de sorties matplotlib brutes. Le New York Times ne remet pas une matrice de corrélation aux lecteurs. Ils façonnent des récits : une question claire, une réponse visuelle, des annotations qui guident l'œil et une conclusion qui exige une réponse. Ce module vous apprend à faire de même.

La récompense est immédiate. Un tableau de bord bien conçu peut faire changer une décision d'entreprise. Un mal conçu est ignoré. La différence n'est pas l'analyse sous-jacente — c'est la présentation. Si vous voulez que votre travail compte, vous devez maîtriser cette compétence.

## Ce que vous allez apprendre

- Construire des figures multi-panels avec gridspec, subplots et axes encastrés
- Personnaliser les titres, les annotations, les légendes et les palettes de couleurs pour la clarté et l'impact
- Appliquer les principes de la narration de données : arc narratif, conception orientée annotation d'abord et conscience de l'auditoire
- Combiner plusieurs types de graphiques en une disposition de tableau de bord cohérente
- Choisir entre les types de graphiques en fonction de l'histoire que vous devez raconter

## La dérivation

Le problème est simple : les graphiques matplotlib par défaut sont fonctionnels mais laids. Ils utilisent une palette de couleurs atténuée, des polices par défaut, des étiquettes minimales et aucune structure narrative. Ils répondent à la question « à quoi ressemblent les données ? » mais pas « que devrait penser le spectateur ? »

La première étape est le contrôle des couches. Un graphique de base a un seul panel avec un seul jeu de données. Les graphiques avancés utilisent des subplots — plusieurs panneaux dans une figure unique. Cela vous permet de montrer des vues apparentées côte à côte : un histogramme à côté d'une boîte à moustaches, un nuage de points au-dessus d'une série temporelle. Le module gridspec vous donne un contrôle fin sur les tailles et positions des panneaux. Les axes encastrés vous permettent de zoomer sur des régions d'intérêt précises.

Ensuite, l'annotation. Chaque graphique devrait avoir un titre qui énonce la conclusion, non le contenu. « Le chiffre d'affaires a doublé après la restructuration du T3 » bat « Chiffre d'affaires par trimestre ». Les étiquettes d'axes devraient être descriptives, non abrégées. Les annotations — flèches, encadrés de texte, régions surlignées — guident l'œil du spectateur vers les points de données les plus importants. L'objectif est de réduire la charge cognitive : le spectateur ne devrait pas avoir à travailler pour trouver l'enseignement.

La couleur est l'outil le plus sous-utilisé en visualisation de données. La colormap par défaut de matplotlib (viridis) est uniforme perceptuellement mais pas intuitive pour les données catégorielles. Les palettes catégorielles (Set2, Paired) regroupent les éléments apparentés. Les palettes séquentielles (Blues, Reds) montrent la magnitude. Les palettes divergentes (RdBu) surlignent les écarts par rapport à un point central. Choisir la bonne palette, c'est choisir ce que le spectateur perçoit en premier.

Enfin, la structure narrative. Une bonne visualisation suit un arc narratif : mise en place (contexte et question), tension (le constat surprenant), résolution (la conclusion). Cela signifie que le premier panneau établit la ligne de base, les panneaux du milieu révèlent le retournement et le panneau final délivre l'enseignement à emporter. La disposition devrait guider le spectateur à travers cet arc spatialement, pas seulement conceptuellement.

## Gamification

- **Récompense XP** : +150 XP par leçon (bonus de parcours avancé)
- **Défis** : redessiner un graphique par défaut laid en qualité publication, construire un tableau de bord à 4 panneaux, créer un graphique annoté qui raconte une histoire complète, concevoir pour l'accessibilité aux daltoniens
- **Progression** : terminez les deux leçons pour débloquer le projet de synthèse du Module 5
- **Bonus de série** : terminez les Modules 1 à 4 en séquence pour un bonus de +20 XP
- **Déblocage du projet de synthèse** : le Module 5 est le couronnement — votre rapport EDA soigné et prêt pour la présentation

## Projets que vous pouvez construire

Une fois ce module terminé, vous serez prêt à aborder ces projets réels :

- 📊 **Constructeur de tableaux de bord exécutifs** — créer des visualisations multi-panels pour les parties prenantes de l'entreprise
- 📰 **Portfolio de journaliste de données** — produire des graphiques de qualité publication pour des articles et rapports
- 🏥 **Présentateur de résultats cliniques** — visualiser les constats d'études médicales pour des auditoires non techniques
- 🌍 **Communicateur sur le changement climatique** — construire des visualisations convaincantes des tendances de données environnementales
- 📈 **Concepteur de rapports financiers** — élaborer des graphiques prêts pour les investisseurs et des tableaux de bord d'analyse

## Leçons

1. Types de graphiques avancés — Grilles à facettes, pair plots, pair grids et combinaison de plusieurs types de graphiques
2. Principes de la narration de données — Structure narrative, stratégies d'annotation et conception orientée auditoire