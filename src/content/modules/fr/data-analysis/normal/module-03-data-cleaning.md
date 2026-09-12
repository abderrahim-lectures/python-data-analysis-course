---

title: "Nettoyage de données"
description: "Réparer le désordre du monde réel : gérer les valeurs manquantes, convertir les dtypes, appliquer des opérations sur les chaînes et utiliser loc/iloc pour des modifications ciblées."
order: 3
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "missing-values", "dtypes", "string-ops"]
prerequisites: ["module-02-selection-filtering"]
icon: "🧹"
---

## Pourquoi c'est important

Les données du monde réel sont désordonnées. Une colonne de sondage censée contenir des nombres contient des chaînes `"N/A"`. Une colonne de dates est stockée comme un objet au lieu d'un datetime. Une colonne de noms a des espaces de tête et une casse incohérente. Un jeu de données financier a des valeurs manquantes dans 40 % de ses lignes. Si vous essayez de calculer la moyenne d'une colonne qui contient des chaînes `"N/A"`, pandas soit lève une erreur, soit renvoie silencieusement du charabia. Les scientifiques des données passent 60 à 80 % de leur temps à nettoyer les données, non parce que le nettoyage est glamour, mais parce que toute analyse construite sur des données sales est fausse. Les conséquences vont de l'embarrassant (des moyennes qui incluent des littéraux de chaîne) au dangereux (des dossiers médicaux avec des dosages manquants). Ce module vous enseigne les techniques de nettoyage essentielles qui transforment des imports bruts en DataFrames prêts pour l'analyse.

La philosophie est simple : vous ne pouvez pas analyser ce que vous ne pouvez pas croire. Les valeurs manquantes faussent les statistiques. Les mauvais dtypes empêchent l'arithmétique sur les dates et les opérations sur les chaînes. Un formatage incohérent casse les opérations de groupby. Le nettoyage n'est pas une phase séparée, c'est une conversation permanente avec vos données. Vous les chargez, les inspectez, trouvez des problèmes, les corrigez et vérifiez la correction. Pandas vous donne une boîte à outils riche pour cela : `isna()` pour détecter les valeurs manquantes, `fillna()` et `dropna()` pour les gérer, `astype()` et `pd.to_numeric()` pour corriger les types, et l'accesseur `.str` pour nettoyer les colonnes de texte. Combinés avec `loc` et `iloc` du module précédent, vous pouvez cibler des cellules précises pour des modifications chirurgicales. Ce module vous rend redoutable, dans le bon sens, pour transformer le chaos en données propres et fiables.

## Ce que vous allez apprendre

- Détecter les valeurs manquantes avec `isna()`, `isnull()` et leurs inverses, et les compter par colonne
- Supprimer les valeurs manquantes avec `dropna()` en utilisant les paramètres `axis`, `thresh` et `subset` pour un contrôle précis
- Combler les valeurs manquantes avec `fillna()` en utilisant des constantes, le remplissage vers l'avant, le remplissage vers l'arrière et des stratégies spécifiques à chaque colonne
- Convertir les types de colonnes avec `astype()` et convertir en toute sécurité en numérique avec `pd.to_numeric(errors='coerce')`
- Appliquer des opérations de nettoyage sur les chaînes via l'accesseur `.str` : `strip()`, `lower()`, `replace()`, `contains()`, `split()`
- Utiliser `loc` et `iloc` pour des modifications ciblées sur des cellules précises lorsque les opérations globales sont trop larges

## La dérivation

Commencez par le problème : un fichier CSV où la colonne `age` contient des types mixtes, des nombres, des chaînes `"N/A"`, des chaînes vides. Lorsque vous le chargez avec `pd.read_csv()`, pandas lit toute la colonne comme un dtype `object` (chaînes). Vous ne pouvez calculer ni la moyenne, ni la médiane, ni aucune statistique. La première étape est la détection : `df['age'].isna()` renvoie une Series booléenne marquant les cellules NaN. `df.isna().sum()` vous dit exactement combien de valeurs manquantes possède chaque colonne. Cette étape de diagnostic est non négociable, vous devez connaître l'ampleur du problème avant de le corriger.

Maintenant la correction. La suppression est l'instrument brut : `df.dropna(subset=['age'])` retire toute ligne où l'âge est manquant. Cela fonctionne si les valeurs manquantes sont rares et aléatoires, mais si 40 % de vos données ont un âge manquant, vous venez de perdre 40 % de votre jeu de données. Remplir est souvent mieux : `df['age'].fillna(df['age'].median())` remplace les âges manquants par la médiane, une estimation raisonnable qui ne fausse pas la distribution. Pour les séries temporelles, le remplissage vers l'avant (`method='ffill'`) propage la dernière valeur connue, ce qui a du sens pour les métriques cumulatives. Pour les colonnes de texte, `.str.strip()` supprime les espaces, `.str.lower()` normalise la casse, et `.str.replace()` corrige les problèmes connus comme le remplacement de `"N/A"` par un vrai NaN pour que `isna()` puisse le détecter. L'idée clé : le nettoyage n'est pas une opération mais une séquence, détecter, décider, corriger, vérifier. Chaque étape informe la suivante. Ce module vous enseigne la séquence complète pour que vous puissiez gérer n'importe quel jeu de données sale avec confiance.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : nettoyer un jeu de données où 30 % des valeurs sont manquantes, choisir la bonne stratégie pour chaque colonne ; corriger une colonne où les dates sont stockées comme des chaînes et les convertir en datetime ; appliquer cinq opérations différentes sur les chaînes pour normaliser une colonne de texte désordonnée
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Course de nettoyage** : étant donné un CSV volontairement sale, identifiez tous les problèmes et corrigez-les dans un pipeline reproductible, visez moins de 10 lignes de code de nettoyage

## Projets que vous pouvez construire

Une fois ce module terminé, vous serez prêt à aborder ces projets réels :

- 📊 **Nettoyeur de sondages**, construire un pipeline qui ingère des réponses de sondage désordonnées et produit un CSV propre, prêt pour l'analyse
- 🐼 **Préparation de données de santé**, nettoyer des dossiers patients avec des types mixtes, des diagnostics manquants et un formatage incohérent
- 🕷️ **Du récupéré à l'analyse**, récupérer des données web (souvent des tableaux HTML sales) et les nettoyer pour l'analyse en aval
- 📈 **Normaliseur de données financières**, normaliser des données boursières ou crypto provenant de plusieurs sources avec des formats différents
- 💰 **Catégoriseur de dépenses**, nettoyer et standardiser les descriptions de transactions bancaires pour une catégorisation cohérente

## Leçons

1. loc et iloc, Accès par étiquette et par position pour des modifications ciblées sur des cellules et plages précises
2. Gérer les valeurs manquantes, Détecter, supprimer et combler les valeurs NaN avec des stratégies adaptées au rôle de chaque colonne