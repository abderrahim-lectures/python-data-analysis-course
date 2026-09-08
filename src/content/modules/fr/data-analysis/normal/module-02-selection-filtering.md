---

title: "Sélection, Filtrage & Indexation"
description: "Extraire les données dont vous avez besoin : sélectionner des colonnes, filtrer des lignes avec des conditions booléennes et utiliser loc/iloc pour un accès précis."
order: 2
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "selection", "filtering", "indexing"]
prerequisites: ["module-01-series-dataframe"]
icon: "🔍"
---

## Pourquoi c'est important

Charger des données dans un DataFrame n'est que le début. Dans toute analyse réelle, vous travaillez sur un sous-ensemble : clients d'une tranche d'âge donnée, transactions au-dessus d'un certain montant, enregistrements d'une date particulière. Sans pandas, extraire ces sous-ensembles signifie écrire des boucles avec des contrôles conditionnels, ajouter manuellement les lignes correspondantes à une nouvelle liste et prier pour ne pas avoir introduit d'erreur d'index. Avec 100 000 lignes, cette approche n'est pas seulement lente — elle est source d'erreurs. Pandas vous donne l'indexation booléenne, `loc` et `iloc` pour que les sélections complexes deviennent des expressions simples et lisibles. « Donne-moi toutes les lignes où `age > 30` ET `salary < 50000` » tient en une ligne. « Donne-moi les 100 premières lignes et les colonnes 2 à 5 » en tient une autre. Ces opérations sont le pont entre les données brutes et les sous-ensembles ciblés qui pilotent chaque analyse.

La raison plus profonde : l'analyse de données est une conversation itérative avec votre jeu de données. Vous le chargez, jetez un œil à quelques lignes, posez une question, filtrez les lignes pertinentes, calculez quelque chose, puis affinez votre question. Chaque étape d'affinement exige une sélection. Si la sélection est maladroite, la conversation stagne. Si elle est fluide, vous explorez plus vite et trouvez des enseignements plus vite. Ce module rend la sélection fluide. Vous apprendrez à sélectionner des colonnes par nom, à filtrer des lignes avec des conditions booléennes composées et à utiliser `loc` et `iloc` pour un accès précis par étiquette et par position. À la fin, vous naviguerez dans un DataFrame aussi naturellement que dans une feuille de calcul — mais avec la puissance de la logique programmatique derrière chaque clic.

## Ce que vous allez apprendre

- Sélectionner des colonnes uniques (renvoie une Series) et des colonnes multiples (renvoie un DataFrame) avec la notation entre crochets
- Construire des masques booléens avec les opérateurs de comparaison (`>`, `<`, `==`, `!=`) et les combiner avec `&`, `|`, `~`
- Utiliser `loc` pour la sélection par étiquette de lignes et de colonnes, y compris la notation par tranches avec bornes inclusives
- Utiliser `iloc` pour la sélection par position entière, indépendamment des étiquettes d'index
- Enchaîner les opérations de sélection et de filtrage pour construire des extractions de données précises étape par étape
- Comprendre la différence entre renvoyer une copie ou une vue et pourquoi `SettingWithCopyWarning` compte

## La dérivation

Considérez le problème : vous avez un DataFrame avec 50 000 lignes et vous avez besoin des lignes où la colonne `status` vaut `"active"`. La méthode brute-force est une boucle for : parcourir chaque ligne, vérifier la condition et ajouter les lignes correspondantes à une nouvelle liste. C'est 50 000 itérations en Python — lent, verbeux et difficile à lire. L'indexation booléenne de pandas résout cela en vous laissant exprimer la condition une seule fois : `df[df['status'] == 'active']`. En coulisses, pandas crée une Series booléenne (True/False pour chaque ligne) et l'utilise pour sélectionner les lignes dont la valeur est True. C'est vectorisé — la comparaison s'exécute dans du code C compilé, pas dans une boucle Python — donc c'est des ordres de grandeur plus rapide.

Mais que faire si vous avez besoin des lignes où `status == "active"` ET `age > 30` ? L'indexation booléenne s'étend naturellement : combinez les conditions avec `&` (et) ou `|` (ou), et mettez chaque condition entre parenthèses en raison de la priorité des opérateurs de Python : `df[(df['status'] == 'active') & (df['age'] > 30)]`. Maintenant, que faire si vous avez besoin aussi de colonnes spécifiques ? C'est là qu'interviennent `loc` et `iloc`. `loc` utilise un accès par étiquette : `df.loc[df['age'] > 30, ['name', 'salary']]` vous donne les colonnes `name` et `salary` pour toutes les lignes où l'âge dépasse 30. Les bornes des tranches sont inclusives — `df.loc[0:5]` inclut la ligne 5. `iloc` utilise les positions entières : `df.iloc[0:5, 1:3]` vous donne les 5 premières lignes et les colonnes aux positions 1 et 2 (exclusive de 3). L'idée clé : `loc` pense en étiquettes, `iloc` pense en positions. Les mélanger est l'erreur pandas la plus courante. Ce module les répète toutes les deux jusqu'à ce que la distinction soit automatique.

## Gamification

- **Récompense XP** : +100 XP par leçon terminée (200 XP au total pour ce module)
- **Défis** : filtrer un jeu de données de ventes pour trouver toutes les transactions de plus de 1 000 $ dans la catégorie Électronique ; utiliser `loc` pour sélectionner des lignes et colonnes précises dans un DataFrame de notes d'étudiants ; combiner trois conditions booléennes pour isoler un segment de niche
- **Progression** : terminez les deux leçons pour débloquer le Module 03 (Nettoyage de données)
- **Bonus de série** : terminez ce module immédiatement après le Module 01 pour un bonus de série de +10 XP
- **Défi de rapidité** : étant donné un DataFrame de 10 000 lignes, écrivez un filtre en une seule ligne qui renvoie les lignes correspondant à trois conditions — faites-le en moins de 60 secondes

## Projets que vous pouvez construire

Une fois ce module terminé, vous serez prêt à aborder ces projets réels :

- 📊 **Segmentation client** — filtrer les clients par âge, dépenses et date d'inscription pour construire des segments ciblés
- 🐼 **Analyseur de journaux** — sélectionner des niveaux de journal spécifiques (ERROR, WARNING) et des fenêtres temporelles dans les journaux serveur
- 🕷️ **Filtre de récupération d'offres** — récupérer des offres d'emploi et les filtrer par fourchette salariale, lieu et statut de télétravail
- 📈 **Cribleur d'actions** — sélectionner les actions répondant à plusieurs critères financiers (ratio P/E, capitalisation boursière, volume)
- 💰 **Filtreur budgétaire** — filtrer les transactions par catégorie, plage de montants et date pour trouver des anomalies de dépenses

## Leçons

1. Sélectionner des colonnes — Extraire des colonnes uniques ou multiples par nom avec la notation entre crochets
2. Filtrer des lignes — Utiliser les conditions booléennes, les expressions composées, `loc` et `iloc` pour ne conserver que les lignes dont vous avez besoin