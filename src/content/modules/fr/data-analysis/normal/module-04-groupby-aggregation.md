---

title: "GroupBy, Agrégation & Fusion"
description: "Split-apply-combine avec groupby, calculer des agrégations et combiner des DataFrames avec merge, join et concat."
order: 4
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "groupby", "aggregation", "merge", "concat"]
prerequisites: ["module-03-data-cleaning"]
icon: "🔗"
---

## Pourquoi c'est important

Une fois vos données propres, la vraie analyse commence, et presque chaque question d'analyse est en réalité une question de groupby. « Quel est le chiffre d'affaires moyen par région ? » « Combien de clients se sont inscrits chaque mois ? » « Quel est le taux de survie par classe de passagers ? » Chacune de ces questions exige de diviser vos données en groupes, de calculer une statistique pour chaque groupe et de combiner les résultats en un résumé. Sans pandas, vous écririez des boucles imbriquées : boucle externe sur les groupes, boucle interne pour collecter les valeurs, puis calcul de la statistique à la main. Avec pandas, `df.groupby('region')['revenue'].mean()` fait tout le split-apply-combine en une ligne. Mais groupby n'est que la moitié de l'histoire. Les jeux de données réels arrivent rarement dans un tableau unique. Vous avez des données client dans un fichier et des transactions dans un autre. Des chiffres de vente dans une feuille et des détails de produits dans une autre. La fusion, joindre deux DataFrames sur une clé partagée, est la manière de rassembler les données apparentées. Ensemble, groupby et merge sont les bêtes de somme de l'analyse de données. Ils transforment des lignes brutes en enseignements et des tableaux séparés en vues unifiées.

La motivation plus profonde : l'analyse de données se résume à la comparaison. Vous comparez des régions, des périodes, des segments de clients, des conditions expérimentales. Chaque comparaison exige un regroupement. Et chaque enseignement au niveau d'un groupe doit être remis en contexte, ce qui exige une fusion. Un groupby sans fusion vous donne des tableaux de synthèse. Une fusion sans groupby vous donne des DataFrames larges et non structurés. Ensemble, ils vous donnent le pouvoir de répondre à des questions comme : « Quelle catégorie de produits a le taux de croissance le plus élevé par rapport au trimestre dernier ? », une question qui exige de grouper par catégorie et par période, de calculer la croissance et de fusionner le résultat avec les métadonnées des produits. Ce module vous enseigne les deux compétences et montre comment elles se composent en pipelines analytiques.

## Ce que vous allez apprendre

- Le paradigme split-apply-combine : comment `groupby()` divise les données, applique une fonction à chaque groupe et combine les résultats
- Les agrégations courantes : `mean()`, `sum()`, `count()`, `min()`, `max()`, `std()` et les agrégations personnalisées avec `agg()`
- Grouper par plusieurs colonnes et calculer des agrégations différentes par colonne
- Fusionner deux DataFrames sur une clé partagée avec `merge()` en utilisant les jointures inner, left, right et outer
- Concaténer des DataFrames verticalement avec `concat()` pour empiler des jeux de données apparentés
- La différence entre `merge()` (jointure basée sur les colonnes) et `concat()` (empilement basé sur les lignes) et quand utiliser chacun

## La dérivation

Commencez par le problème : vous avez un DataFrame de ventes avec les colonnes `region`, `product`, `revenue` et `date`. Vous voulez le chiffre d'affaires total par région. La méthode brute-force consiste à collecter les régions uniques, à parcourir chacune, à filtrer les lignes correspondant à cette région et à additionner le chiffre d'affaires. C'est O(n * k) opérations, lent pour les grands jeux de données et verbeux en code. `groupby()` de pandas résout cela avec le schéma split-apply-combine. D'abord, diviser : `df.groupby('region')` crée un objet GroupBy qui partitionne en interne le DataFrame en groupes, un par valeur de région unique. Ensuite, appliquer : lorsque vous appelez `['revenue'].sum()`, pandas applique la fonction somme à la colonne revenue de chaque groupe indépendamment. Enfin, combiner : les résultats sont assemblés dans une nouvelle Series (ou un DataFrame) avec les clés de groupe comme index. Toute l'opération s'exécute dans du code compilé, sans boucles Python.

Maintenant la seconde moitié : la fusion. Vous avez un DataFrame `customers` avec `customer_id`, `name` et `region`, et un DataFrame `transactions` avec `customer_id`, `amount` et `date`. Vous voulez connaître la dépense totale par nom de client. Vous devez joindre ces tableaux sur `customer_id`. `pd.merge(customers, transactions, on='customer_id', how='inner')` fait cela, il fait correspondre les lignes où `customer_id` est le même dans les deux tableaux. Le paramètre `how` contrôle quelles lignes survivent : `inner` ne conserve que les correspondances, `left` conserve toutes les lignes du tableau de gauche (en remplissant avec NaN là où il n'y a pas de correspondance), `right` conserve tout du tableau de droite et `outer` conserve tout. La concaténation est plus simple : `pd.concat([df1, df2])` empile les DataFrames verticalement, utile lorsque vous avez les mêmes colonnes dans plusieurs fichiers (par exemple, des fichiers de ventes mensuels). L'idée clé : groupby résume, merge connecte, concat empile. Chaque pipeline de données utilise au moins deux de ces trois opérations.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : calculer le salaire moyen par département et trouver quel département a le plus élevé ; fusionner un tableau de clients avec un tableau de commandes et calculer la dépense totale par client ; concaténer 12 CSV mensuels en un seul DataFrame annuel
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Défi Groupby** : étant donné un jeu de données complexe, écrivez une seule chaîne groupby → agg → merge qui répond à une question analytique en plusieurs parties

## Projets que vous pouvez construire

Une fois ce module terminé, vous serez prêt à aborder ces projets réels :

- 📊 **Générateur de rapports de ventes**, grouper les données de ventes par région et produit, calculer des agrégations et générer un rapport de synthèse
- 🐼 **Consolidateur multi-fichiers**, fusionner les tableaux de clients, de commandes et de produits en un jeu de données d'analyse unifié
- 🕷️ **Analytique e-commerce**, récupérer plusieurs pages de produits, concaténer les résultats et grouper par catégorie pour les comparer
- 📈 **Agrégateur de portefeuille financier**, fusionner les cours boursiers avec les données de détention et calculer des agrégations au niveau du portefeuille
- 💰 **Prévisionniste de revenus**, grouper le chiffre d'affaires historique par mois, calculer les tendances et fusionner avec des indicateurs économiques

## Leçons

1. Bases de GroupBy, Diviser les données en groupes et calculer des agrégations avec split-apply-combine
2. Fusionner des DataFrames, Combiner des jeux de données apparentés avec merge (jointures) et concat (empilement)