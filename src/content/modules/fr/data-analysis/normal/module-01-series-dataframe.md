---

title: "Bases de Series & DataFrame"
description: "Structures de données fondamentales de pandas : créer des Series à partir de listes et de dictionnaires, construire des DataFrames, lire des fichiers CSV et inspecter vos données."
order: 1
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "series", "dataframe", "csv"]
prerequisites: ["module-01-python-basics"]
icon: "📊"
---

## Pourquoi c'est important

Chaque projet d'analyse de données commence par une question simple : comment conserver mes données pour pouvoir travailler avec ? Vous pourriez stocker les nombres dans des listes Python, les noms dans des variables séparées et les colonnes dans des dictionnaires, mais dès que vous devez les combiner, les filtrer ou calculer des statistiques, vous écrivez des boucles fragiles et illisibles. Imaginez une feuille de calcul avec 10 000 lignes de transactions de vente. Vous devez calculer le chiffre d'affaires total par région, trouver les 5 meilleurs clients et repérer les tendances dans le temps. Faire cela en Python pur exigerait des boucles imbriquées, un suivi manuel des indices et des dizaines de lignes faciles à casser. Pandas résout cela en vous donnant deux structures fondatrices, Series et DataFrame, qui enveloppent vos données dans des conteneurs étiquetés, indicés et vectorisés. Une ligne de `df.groupby('region')['revenue'].sum()` remplace cinquante lignes de comptabilité manuelle.

La véritable puissance est que ces structures ne sont pas de simples enveloppes pratiques. Elles sont conçues pour refléter la façon dont les humains pensent réellement aux données. Une Series est une colonne unique avec un nom et un index, comme une liste où chaque élément possède une étiquette. Un DataFrame est un tableau où chaque colonne est une Series, chaque ligne possède un index, et les opérations se propagent automatiquement à toute la structure. Lorsque vous chargez un fichier CSV avec `pd.read_csv()`, vous obtenez instantanément un DataFrame : les noms de colonnes deviennent des clés, les lignes deviennent des entrées indexées, et chaque opération, filtrage, tri, regroupement, s'exprime en une ligne lisible. Ce module construit le modèle mental qui rend tout le reste de pandas naturel.

## Ce que vous allez apprendre

- Ce qu'est une Series et comment en créer une à partir d'une liste, d'un dictionnaire ou d'une valeur scalaire
- Comment fonctionne l'indexation sur les Series et pourquoi les indices étiquetés comptent pour l'alignement et la recherche
- Ce qu'est un DataFrame et comment en construire un à partir de dictionnaires, de listes de dictionnaires ou de tableaux NumPy
- Comment lire des fichiers CSV dans des DataFrames avec `pd.read_csv()` et gérer les problèmes d'import courants comme les en-têtes, les dtypes et l'encodage
- Les méthodes d'inspection essentielles : `head()`, `tail()`, `info()`, `describe()`, `shape`, `columns` et `dtypes`
- La relation entre Series et DataFrame, comment un DataFrame est simplement un dict de Series alignées

## La dérivation

Commencez par le problème : vous avez des données et vous voulez les analyser. L'approche naïve consiste à stocker chaque colonne comme une liste Python séparée. Cela fonctionne jusqu'à ce que vous ayez besoin de filtrer des lignes selon une condition dans une colonne tout en conservant les valeurs d'une autre. Là, vous suivez manuellement les indices entre les listes, une recette pour des erreurs de décalage d'un. Pandas introduit la Series pour résoudre cela. Une Series est un tableau étiqueté unidimensionnel. Vous lui donnez une liste de valeurs et un index, les étiquettes qui identifient chaque élément. Lorsque vous créez une Series à partir d'un dictionnaire, les clés deviennent automatiquement l'index. Cela signifie que `series['Alice']` récupère la valeur d'Alice, comme un dictionnaire mais avec des mathématiques vectorisées : `series * 2` double chaque élément d'un coup.

Imaginez maintenant avoir dix Series, une par colonne d'un tableau. Vous devez les aligner toutes selon le même index. C'est exactement ce qu'est un DataFrame : une collection de Series partageant un index commun. Vous pouvez en construire un en passant un dictionnaire où les clés sont les noms de colonnes et les valeurs sont des listes (ou des Series). L'alignement des indices signifie que les opérations sur le DataFrame maintiennent automatiquement la cohérence des lignes. Lorsque vous lisez un CSV, pandas fait cet alignement pour vous : il analyse chaque colonne, attribue un index numérique (0, 1, 2, ...) et vous remet un DataFrame où chaque cellule est accessible par étiquette de ligne et nom de colonne. La méthode `info()` vous montre la forme et les types de vos données. `describe()` fournit un résumé statistique. `head()` montre les premières lignes pour que vous puissiez examiner la structure à l'œil. Ces outils d'inspection ne sont pas facultatifs, ils sont la manière de vérifier que les données se sont chargées correctement avant de commencer l'analyse.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : chaque leçon comprend des exercices pratiques, construire une Series à partir d'un dictionnaire et calculer sa moyenne, charger un CSV et rapporter sa forme et ses types de colonnes, créer un DataFrame manuellement et l'inspecter avec `info()`
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Point de contrôle du projet final** : à la fin, vérifiez que vous savez charger n'importe quel fichier CSV, l'inspecter et décrire ce que contient chaque colonne en langage simple

## Projets que vous pouvez construire

Une fois ce module terminé, vous serez prêt à aborder ces projets réels :

- 📊 **Tableau de bord des ventes**, charger un CSV de ventes, inspecter sa structure et calculer des statistiques récapitulatives par région
- 🐼 **Inspecteur de CSV**, construire un utilitaire qui lit n'importe quel CSV et imprime un profil de données formaté (types, comptages manquants, statistiques de base)
- 🕷️ **Récupération & chargement**, récupérer un tableau depuis le web et le charger dans un DataFrame pour l'analyser
- 📈 **Journal météo**, lire des journaux météo quotidiens dans un DataFrame et calculer des moyennes mensuelles
- 💰 **Suivi des dépenses**, importer des CSV de transactions bancaires et inspecter la structure avant le nettoyage

## Leçons

1. Créer des Series, Construire des tableaux unidimensionnels étiquetés à partir de listes, de dictionnaires et de scalaires
2. Créer des DataFrames, Données tabulaires à partir de dictionnaires, de listes de dictionnaires et de fichiers CSV avec `pd.read_csv()`