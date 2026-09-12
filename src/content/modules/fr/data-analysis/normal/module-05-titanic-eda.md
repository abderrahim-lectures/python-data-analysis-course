---

title: "EDA guidée du Titanic"
description: "Assembler le tout : charger le jeu de données Titanic, explorer sa structure, le nettoyer et répondre à de vraies questions analytiques."
order: 5
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "eda", "titanic", "end-to-end"]
prerequisites: ["module-04-groupby-aggregation"]
icon: "🚢"
---

## Pourquoi c'est important

Vous avez appris les Series, les DataFrames, la sélection, le filtrage, le nettoyage, le groupby et la fusion, cinq modules de blocs de construction. Mais un bloc de construction n'est pas un bâtiment. L'écart entre connaître des opérations pandas individuelles et mener une analyse réelle est l'écart entre savoir utiliser un marteau et savoir construire une maison. Ce module comble cet écart. Vous prendrez un jeu de données brut, le manifeste des passagers du Titanic, et parcourrez le cycle de vie complet d'une analyse exploratoire de données (EDA) : chargement, inspection, nettoyage, sélection, regroupement, agrégation et conclusions. Le jeu de données Titanic est idéal pour cela parce qu'il contient chaque défi que vous rencontrerez dans le monde réel : des valeurs manquantes (Age, Cabin, Embarked), des types mixtes (tarif numérique, sexe catégoriel, noms textuels) et des questions qui exigent de combiner les techniques (taux de survie par classe ET sexe ET tranche d'âge). À la fin, vous aurez une analyse complète et reproductible, pas une collection de bouts de code isolés.

La motivation plus profonde : l'EDA est la compétence la plus importante de l'analyse de données. Avant de construire des modèles, avant de créer des tableaux de bord, avant de présenter des constats, vous devez comprendre vos données. L'EDA est la manière de construire cette compréhension. C'est une conversation structurée : que contient ce jeu de données ? À quel point est-il complet ? Quelles distributions suivent les variables clés ? Quelles relations existent entre les variables ? Quelles anomalies ou surprises apparaissent ? Le jeu de données Titanic vous laisse pratiquer cette conversation avec de vrais enjeux, les questions sont concrètes (qui a survécu et pourquoi ?), les données sont assez désordonnées pour exiger un nettoyage, et les enseignements sont assez interprétables pour être validés. Ce module ne porte pas seulement sur la syntaxe pandas. Il porte sur la construction du schéma de pensée analytique qui sépare les analystes compétents des excellents.

## Ce que vous allez apprendre

- Charger le jeu de données Titanic (ou n'importe quel CSV) et inspecter sa structure avec `info()`, `describe()` et `value_counts()`
- Identifier et gérer les valeurs manquantes dans plusieurs colonnes avec des stratégies différentes (suppression, remplissage, imputation)
- Créer de nouvelles colonnes dérivées à partir des données existantes (par exemple, tranches d'âge, taille de famille, extraction du titre depuis les noms)
- Mener une analyse groupby multidimensionnelle : taux de survie par classe, sexe, tranche d'âge et port d'embarquement
- Construire des tableaux de synthèse et des tableaux croisés qui révèlent des schémas dans les données
- Tirer et communiquer des conclusions exploitables de l'analyse avec un raisonnement clair et fondé sur les preuves

## La dérivation

Commencez avec les données brutes. Le jeu de données Titanic a 891 lignes et 12 colonnes : PassengerId, Survived, Pclass, Name, Sex, Age, SibSp, Parch, Ticket, Fare, Cabin, Embarked. Un premier passage naïf révèle des problèmes : Age est manquant pour 177 passagers (20 %), Cabin est manquant pour 687 (77 %) et Embarked est manquant pour 2. Sans nettoyage, toute analyse de la survie par âge est incomplète. La phase de nettoyage s'y attaque : supprimer Cabin (trop éparse pour être conservée), combler Age avec la médiane (robuste aux valeurs aberrantes) et combler Embarked avec le mode (seulement 2 manquants). Les données sont maintenant prêtes pour l'analyse.

Ensuite, les questions analytiques. « Les femmes ont-elles survécu plus que les hommes ? » exige de grouper par Sex et de calculer le taux de survie. « La classe de passagers comptait-elle ? » exige de grouper par Pclass. Mais le véritable enseignement vient du groupby multidimensionnel : grouper par Sex ET Pclass simultanément. Le résultat révèle que 96,8 % des femmes de première classe ont survécu mais seulement 50 % des femmes de troisième classe, la classe et le sexe interagissent. Pour aller plus loin, vous créez une colonne AgeGroup en découpant Age en catégories (Child, Teen, Adult, Senior) avec `pd.cut()`. Vous pouvez maintenant grouper par AgeGroup et découvrir que les enfants ont eu des taux de survie plus élevés quelle que soit la classe. Chaque technique des quatre modules précédents apparaît naturellement : Series/DataFrame pour le chargement, la sélection pour isoler les colonnes, le nettoyage pour gérer les valeurs manquantes et le groupby pour calculer les taux de survie. La dérivation est le pipeline entier qui travaille ensemble, pas une technique isolée, mais toutes composées en une analyse cohérente.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : réaliser le pipeline EDA complet sans regarder vos notes ; répondre à cinq questions analytiques sur les schémas de survie ; identifier et communiquer trois constats surprenants issus des données
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Défi de synthèse** : rédigez un résumé d'analyse de 200 mots qui raconte l'histoire de la survie du Titanic en utilisant uniquement les preuves de vos résultats groupby, aucune spéculation, seulement les données
- **Combat final** : étendez l'analyse avec une question non couverte dans les leçons (par exemple, la présence de membres de famille à bord affecte-t-elle la survie ?) et présentez vos constats

## Projets que vous pouvez construire

Une fois ce module terminé, vous serez prêt à aborder ces projets réels :

- 📊 **Pipeline EDA complet**, prendre n'importe quel jeu de données brut et produire une analyse exploratoire complète avec nettoyage, groupby et conclusions
- 🐼 **Préparation du prédicteur de survie**, utiliser vos enseignements de l'EDA Titanic pour concevoir des caractéristiques pour un modèle de machine learning
- 🕷️ **Explorateur de jeux de données**, construire un modèle EDA réutilisable qui fonctionne sur n'importe quel CSV : charger, inspecter, nettoyer, grouper, résumer
- 📈 **Analyse comparative**, comparer les schémas de survie sur plusieurs jeux de données historiques (par exemple, Titanic contre Lusitania)
- 💰 **Générateur de rapports d'enseignements**, écrire une fonction qui prend un DataFrame et une liste de questions et produit un rapport EDA formaté

## Leçons

1. Charger et explorer le Titanic, Charger le jeu de données, inspecter la structure, identifier les valeurs manquantes et comprendre les types de colonnes
2. Analyse EDA du Titanic, Nettoyer, grouper, créer des colonnes dérivées et répondre à des questions analytiques sur les schémas de survie