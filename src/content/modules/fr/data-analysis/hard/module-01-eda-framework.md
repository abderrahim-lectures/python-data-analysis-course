---

title: "Cadre EDA & Profilage"
description: "Apprendre à formuler des questions analytiques, évaluer la qualité d'un jeu de données et construire un flux de travail de profilage systématique avant toute visualisation."
order: 1
section: "data-analysis"
track: "hard"
difficulty: "advanced"
estimatedHours: 5
lessonCount: 2
tags: ["eda", "profiling", "data-quality", "framework"]
prerequisites: []
icon: "🔍"
---

## Pourquoi c'est important

Avant de construire un modèle de machine learning, avant d'écrire une ligne de code de visualisation, avant de présenter un seul graphique à une partie prenante, vous devez comprendre vos données. L'analyse exploratoire de données est le travail de détective qui évite des erreurs coûteuses. Des entreprises comme Netflix passent des semaines en EDA avant de construire des systèmes de recommandation. Spotify effectue un profilage approfondi des données d'écoute avant de concevoir des playlists. La raison est simple : des données de mauvaise qualité produisent des résultats de mauvaise qualité. Si vous sautez l'EDA, vous construisez sur du sable.

Considérez un scénario réel : une start-up de santé reçoit des données patients pour prédire le risque de réadmission. Sans profilage, elle rate le fait que 40 % de la colonne `age` est remplie avec la chaîne « Unknown » au lieu de nombres. Son modèle s'entraîne sur des données corrompues, produit des prédictions confiantes mais fausses, et l'entreprise fait face à un examen réglementaire. Ce n'est pas une hypothèse, cela arrive régulièrement. L'EDA est le système immunitaire de la science des données. Il attrape les infections avant qu'elles ne se propagent.

La dure vérité est que la plupart des débutants sautent directement à la modélisation ou à la visualisation. Ils sautent le profilage. Ils supposent que les données sont propres. Ils font confiance aux noms de colonnes. Ce module impose une discipline : ralentir, regarder attentivement et comprendre ce que vous avez avant de décider quoi en faire. Le cadre que vous apprendrez ici devient le fondement de chaque analyse de ce parcours.

## Ce que vous allez apprendre

- Formuler des questions EDA ciblées et testables à partir d'énoncés de problèmes métier vagues
- Profiler la structure, les types, les données manquantes et la cardinalité d'un jeu de données en quelques minutes
- Identifier les pièges courants de la qualité des données : doublons, incohérences de types, colonnes constantes, champs à cardinalité élevée
- Documenter les constats du profilage dans un flux de travail de notebook reproductible
- Construire une liste de contrôle EDA réutilisable que vous pouvez appliquer à n'importe quel jeu de données

## La dérivation

Le problème que l'EDA résout est d'une simplicité trompeuse : vous avez un jeu de données, et vous n'avez aucune idée de ce qu'il contient. L'approche naïve consiste à commencer à construire, choisir un modèle, lui jeter des données, espérer le meilleur. Cela échoue en silence. La solution élégante est le profilage systématique : une séquence structurée de vérifications qui révèle la forme réelle du jeu de données.

Commencez par les bases. Combien de lignes et de colonnes ? Quels sont les types de données ? Cela semble trivial, mais les incohérences de types sont partout, des dates stockées comme des chaînes, des nombres stockés comme des objets, des colonnes catégorielles déguisées en entiers. Une colonne nommée `zip_code` qui semble numérique est en réalité catégorielle. Se tromper ici corrompt chaque calcul en aval.

Puis demandez-vous : que manque-t-il ? Les schémas d'absence vous disent si les données sont manquantes complètement au hasard (MCAR), manquantes au hasard (MAR) ou manquantes non aléatoirement (MNAR). Chaque schéma exige un traitement différent. Une colonne où 90 % des valeurs sont nulles est inutile. Une colonne où 5 % est nulle selon un schéma prévisible (par exemple, les nouveaux utilisateurs ont une `tenure` manquante) révèle quelque chose de significatif sur vos données.

Enfin, examinez la cardinalité. Une colonne avec 2 millions de valeurs uniques sur 10 000 lignes est un identifiant, pas une caractéristique. Une colonne avec exactement une valeur unique sur toutes les lignes est une constante, elle ajoute du bruit aux modèles et de la confusion à l'analyse. Les trouver tôt évite des heures de travail gaspillé plus tard.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : chaque leçon comprend des défis interactifs, profiler un jeu de données mystère, attraper des problèmes de qualité cachés, construire une liste de contrôle EDA complète de zéro
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Déblocage du projet de synthèse** : terminer ce module contribue à la pièce de portfolio du Module 5

## Projets que vous pouvez construire

Une fois ce module terminé, vous serez prêt à aborder ces projets réels :

- 🏠 **Profileur de prix immobiliers**, profiler un jeu de données immobilier et identifier les problèmes de qualité des données avant la modélisation
- 🛒 **Audit de données e-commerce**, évaluer systématiquement un jeu de données de transactions clients pour son exhaustivité et sa cohérence
- 🏥 **Validateur de données de santé**, construire un pipeline de profilage réutilisable pour les jeux de données cliniques
- 📊 **Réviseur de statistiques sportives**, profiler des données de performance d'athlètes et signaler les anomalies
- 🌍 **Contrôle des indicateurs de développement mondial**, évaluer des données économiques mondiales pour les données manquantes et la fiabilité

## Leçons

1. Formuler des questions EDA, Traduire des problèmes vagues en questions analytiques structurées et en hypothèses
2. Profilage de jeu de données, Évaluer systématiquement la structure, les types, les données manquantes et les problèmes de qualité des données