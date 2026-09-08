---
title: "Structures de données"
description: "Travaillez avec les listes, les tuples, les dictionnaires et les ensembles — les conteneurs de base de Python."
order: 6
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 4
lessonCount: 3
tags: ["listes", "tuples", "dicts", "ensembles", "compréhensions"]
prerequisites: ["module-05-strings"]
icon: "📦"
---

## Pourquoi c'est important

Une seule variable contient une valeur. Mais les vraies données arrivent en collections — une liste d'étudiants, un dictionnaire qui associe des noms d'utilisateur à des adresses e-mail, un ensemble de tags uniques sur un article de blog. Les structures de données sont la façon dont vous organisez et travaillez avec des groupes de données, et choisir la bonne détermine la vitesse d'exécution de votre programme et la lisibilité de votre code.

Pensez à construire un carnet de contacts. Vous pourriez stocker les noms dans une liste, les e-mails dans une autre et les numéros de téléphone dans une troisième :

```python
names = ["Alice", "Bob", "Charlie"]
emails = ["alice@example.com", "bob@example.com", "charlie@example.com"]
```

Mais que se passe-t-il quand vous ajoutez un nouveau contact ? Vous devez penser à ajouter aux trois listes — et si vous en oubliez une, vos données sont désynchronisées. Un dictionnaire (`contacts = {"Alice": "alice@example.com"}`) garde les données liées ensemble. Les listes vous donnent des séquences ordonnées avec un indexage rapide. Les tuples protègent les données des modifications accidentelles. Les ensembles suppriment automatiquement les doublons et répondent à « cet élément est-il dans la collection ? » instantanément.

Les quatre structures de données centrales de Python — listes, tuples, dictionnaires et ensembles — résolvent chacune des problèmes différents. Les apprendre, c'est comme apprendre les outils d'un atelier : un marteau n'est pas supérieur à un tournevis, mais utiliser le bon outil pour le travail fait toute la différence.

## Ce que vous allez apprendre

- **Listes** : séquences ordonnées et mutables avec des méthodes comme `append`, `sort`, `pop`, `extend`
- **Tuples** : séquences immuables pour des données fixes, le déballage et les tuples nommés
- **Dicts** : associations clé-valeur avec méthodes, motifs d'itération et compréhensions de dictionnaire
- **Ensembles** : collections non ordonnées pour les tests d'appartenance, la déduplication et les opérations d'ensemble (union, intersection, différence)
- **Compréhensions de listes** : syntaxe concise pour construire des listes à partir de données existantes
- **Quand utiliser quoi** : choisir la structure de données adaptée au problème

## La dérivation

**Le problème :** Les vrais programmes traitent des collections de données, pas des valeurs uniques. Un panier d'achat a plusieurs articles. Une classe a plusieurs étudiants. Un fichier a plusieurs lignes. Sans structures de données, vous auriez besoin de variables séparées pour chaque élément : `item1`, `item2`, `item3`... Cela ne passe pas à l'échelle. Que faire s'il y a 100 articles ?

**L'approche naïve :** Utiliser des tableaux — des conteneurs à taille fixe indexés par des entiers. Les tableaux de C fonctionnent, mais ils sont rigides : vous déclarez la taille à l'avance, vous ne pouvez pas mélanger les types, et ajouter/retirer des éléments exige une gestion manuelle de la mémoire.

**La solution élégante :** Les listes de Python sont des tableaux dynamiques. Elles grandissent et rétrécissent automatiquement. `my_list.append(item)` ajoute à la fin. `my_list.pop()` retire de la fin. Vous ne pensez jamais à l'allocation mémoire. Les listes supportent aussi les types mixtes (même si c'est généralement une mauvaise pratique) et l'indexage puissant de Python : `my_list[-1]` obtient le dernier élément, `my_list[1:3]` obtient une tranche.

**Tuples pour l'immutabilité :** Parfois, vous avez besoin d'une séquence qui *ne peut pas* changer. Une paire de coordonnées `(x, y)` ne devrait jamais devenir accidentellement `(x, y, z)`. Les tuples sont immuables — toute « modification » crée un nouveau tuple. Cela les rend sûrs pour les clés de dictionnaire, les valeurs de retour de fonction et les données qui ne doivent pas être altérées. Les tuples nommés (`Point = namedtuple("Point", ["x", "y"])`) ajoutent la lisibilité : `point.x` au lieu de `point[0]`.

**Dictionnaires pour les paires clé-valeur :** Le dictionnaire est la structure la plus polyvalente de Python. Il associe des clés à des valeurs — comme un vrai dictionnaire associe des mots à des définitions. La recherche est en O(1) — instantanée, quelle que soit la taille. Un dictionnaire de 10 000 entrées trouve une clé aussi vite qu'un dictionnaire de 10 entrées. Cela rend les dictionnaires essentiels pour la mise en cache, la configuration et toute opération lourde en recherches.

**Ensembles pour l'unicité :** Un ensemble est une collection non ordonnée d'éléments *uniques*. `set([1, 1, 2, 3])` devient `{1, 2, 3}`. Le test d'appartenance (`x in my_set`) est en O(1) — instantané. Les ensembles supportent aussi les opérations mathématiques : union (`|`), intersection (`&`), différence (`-`). Utilisez-les pour la déduplication, trouver des éléments communs ou vérifier l'appartenance.

**Compréhensions :** La syntaxe de compréhension de Python construit des collections en une seule expression. `[x**2 for x in range(10)]` crée une liste de carrés. `{name: age for name, age in people}` crée un dictionnaire à partir d'une liste de paires. Les compréhensions sont plus rapides que les boucles et se lisent plus clairement — elles expriment l'*intention* de la transformation sans le code rébarbatif.

## Gamification

- **Récompense XP** : +100 XP par leçon terminée (300 XP au total pour ce module)
- **Défis** : Chaque leçon inclut des défis interactifs sur les structures de données
- **Progression** : Terminez les 3 leçons pour débloquer le Module 07 (Entrées/sorties de fichiers)
- **Bonus de série** : Terminez ce module d'une traite pour un bonus de +10 XP
- **Succès débloqué** : « Organisateur de données » — utilisez les quatre structures de données dans un seul programme

### Défis de leçons

| Leçon | Défi | XP |
|--------|-----------|-----|
| Listes et tuples | Construisez une liste de tâches avec append, remove, sort et l'empaquetage de tuple | +100 |
| Dicts et ensembles | Créez un compteur de fréquence de mots avec des dicts et trouvez des mots uniques avec des ensembles | +100 |
| Compréhensions | Réécrivez 3 boucles for comme compréhensions de liste/dict/ensemble | +100 |

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 📒 **Carnet de contacts** — les dictionnaires associent les noms aux numéros de téléphone et aux e-mails
- 🎵 **Liste de lecture musicale** — les listes gèrent l'ordre des chansons, les ensembles suivent les artistes uniques
- 📊 **Analyseur de fréquence de mots** — les dictionnaires comptent les occurrences de mots dans un texte
- 🃏 **Jeu de cartes** — les listes représentent les mains, les tuples représentent les paires de cartes, les ensembles suivent les cartes jouées

## Leçons

1. **Listes et tuples** — création, indexage, découpage, méthodes, déballage et quand utiliser des tuples plutôt que des listes
2. **Dictionnaires et ensembles** — associations clé-valeur, opérations d'ensemble, tests d'appartenance et motifs de dictionnaire
3. **Compréhensions et choix des structures de données** — compréhensions de liste/dict/ensemble, expressions génératrices et sélection de la bonne structure