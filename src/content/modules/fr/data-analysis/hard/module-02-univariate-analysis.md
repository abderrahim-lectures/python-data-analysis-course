---

title: "Analyse univariée & Visualisation"
description: "Maîtriser les distributions, les résumés et l'encodage visuel pour les variables uniques avec matplotlib et seaborn."
order: 2
section: "data-analysis"
track: "hard"
difficulty: "advanced"
estimatedHours: 5
lessonCount: 2
tags: ["univariate", "matplotlib", "seaborn", "distributions"]
prerequisites: ["module-01-eda-framework"]
icon: "📊"
---

## Pourquoi c'est important

Regarder une variable à la fois semble ennuyeux. Cela ressemble à un échauffement avant le vrai travail. Pourtant, chaque enseignement en science des données commence par une analyse univariée. Si vous ne comprenez pas la distribution de vos variables individuelles, toute analyse construite par-dessus est construite sur du sable.

Considérez un jeu de données salarial. Avant de pouvoir comparer les salaires entre départements, vous devez savoir : à quoi ressemble la distribution salariale globale ? Est-elle symétrique ou fortement asymétrique à droite ? Y a-t-il des valeurs aberrantes suspectes — par exemple quelqu'un qui gagne 10 millions de dollars alors que tout le monde gagne entre 40 000 et 150 000 dollars ? Y a-t-il un pic secondaire suggérant deux populations distinctes ? Aucune de ces questions n'implique une deuxième variable. Toutes exigent de regarder attentivement une seule colonne.

Les conséquences de sauter l'analyse univariée sont réelles. Un salaire moyen de 85 000 dollars semble raisonnable jusqu'à ce que vous réalisiez qu'il est tiré vers le haut par une poignée de salaires de PDG dans un jeu de données de revenus médians. Un modèle entraîné sur des caractéristiques non examinées apprendra de ces distorsions. La visualisation révèle ce que les statistiques récapitulatives cachent : la forme, les écarts, les regroupements, les queues. Un histogramme vous en dit plus qu'une moyenne ne le fera jamais.

Ce module entraîne votre intuition. Après l'avoir terminé, vous serez capable de regarder une distribution et de reconnaître instantanément l'asymétrie, la multimodalité, les queues lourdes et les valeurs aberrantes — des schémas qui guident chaque décision, de l'ingénierie des caractéristiques à la sélection du modèle.

## Ce que vous allez apprendre

- Sélectionner et calculer les statistiques récapitulatives appropriées pour les variables numériques et catégorielles
- Créer des histogrammes, des tracés KDE, des boîtes à moustaches et des diagrammes violons pour les distributions numériques
- Construire des graphiques de comptage, des graphiques en barres et des camemberts pour l'analyse de fréquences catégorielles
- Lire les formes de distribution et détecter l'asymétrie, les valeurs aberrantes et la multimodalité à partir des seuls graphiques
- Choisir entre les tests statistiques en fonction des caractéristiques de la distribution

## La dérivation

Le problème que l'analyse univariée résout est fondamental : les nombres bruts sont difficiles à interpréter. Regarder une colonne de 10 000 valeurs ne vous dit rien. Vous devez compresser cette information en quelque chose de lisible par un humain.

L'approche naïve consiste à calculer la moyenne et à en rester là. Mais la moyenne est fragile. Une seule valeur aberrante extrême peut l'entraîner sauvagement. Considérez les revenus : {30K, 35K, 40K, 45K, 50K, 500K}. La moyenne est de 116 667 dollars, ce qui ne représente personne. La médiane est de 42 500 dollars, ce qui représente la plupart des gens. C'est pourquoi vous avez besoin à la fois de mesures de tendance centrale et de mesures de dispersion — écart-type, intervalle interquartile, étendue — pour comprendre le véritable caractère d'une distribution.

Considérez maintenant l'approche visuelle. Un histogramme classe les valeurs en intervalles et les compte. Il révèle immédiatement : la distribution est-elle en forme de cloche (normale) ? Asymétrique à droite (comme le revenu) ? Asymétrique à gauche (comme l'âge à la retraite) ? Bimodale (suggérant deux sous-groupes cachés) ? Cette empreinte visuelle guide tout ce qui suit. Une distribution normale justifie les tests paramétriques. Une distribution asymétrique exige une transformation ou des alternatives non paramétriques.

Le KDE (estimation par noyau de densité) lisse l'histogramme en une courbe continue, ce qui facilite la lecture et la comparaison des distributions. Les boîtes à moustaches compressent la distribution en cinq nombres plus les valeurs aberrantes. Les diagrammes violons combinent la boîte à moustaches avec le KDE, montrant à la fois les statistiques récapitulatives et la forme complète. Chaque visualisation sert un objectif analytique différent. Les maîtriser signifie que vous pouvez extraire un maximum d'informations d'une variable unique avec un minimum d'effort.

## Gamification

- **Récompense XP** : +150 XP par leçon (bonus de parcours avancé)
- **Défis** : identifier le type de distribution à partir d'un histogramme mystère, détecter des valeurs aberrantes sans code, construire un tableau de bord de statistiques récapitulatives de zéro
- **Progression** : terminez les deux leçons pour débloquer le Module 3
- **Bonus de série** : terminez les Modules 1 et 2 en séquence pour un bonus de +15 XP
- **Déblocage du projet de synthèse** : vos compétences univariées alimentent directement le projet de synthèse du Module 5

## Projets que vous pouvez construire

Une fois ce module terminé, vous serez prêt à aborder ces projets réels :

- 💰 **Analyseur de distribution salariale** — visualiser et analyser les données de rémunération entre les industries
- 🎮 **Explorateur de notes de jeux** — profiler les notes de revues de jeux et identifier les schémas de notation
- 🏋️ **Profileur de suivi de fitness** — analyser les comptes de pas quotidiens, les calories et les distributions de sommeil
- 📚 **Analyste de longueur de livres** — explorer les distributions de nombre de pages entre les genres
- 🌡️ **Profileur de données climatiques** — visualiser les distributions de température et de précipitations par région

## Leçons

1. Analyse numérique univariée — Distributions, histogrammes, KDE, boîtes à moustaches et statistiques récapitulatives pour les colonnes numériques
2. Analyse catégorielle univariée — Tables de fréquences, graphiques de comptage, graphiques en barres et gestion ordinale vs nominale