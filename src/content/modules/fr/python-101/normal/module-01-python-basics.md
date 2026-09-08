---
title: "Python - Les bases"
description: "Vos premières étapes : afficher une sortie, nommer des valeurs, comprendre les types et convertir entre eux."
order: 1
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 2
lessonCount: 4
tags: ["fondamentaux", "sortie", "variables", "types"]
prerequisites: []
icon: "🐍"
---

## Pourquoi c'est important

Imaginez que vous construisez un tableau de bord météo. Vous devez stocker la température du jour (72.5), un nom de ville ("Portland"), savoir s'il pleut (True) et le nombre de stations météo actives (14). Sans moyen de stocker ces valeurs sous des noms lisibles, il faudrait coder en dur `72.5` partout — et au moment où vous voudriez la changer, vous devriez fouiller tout votre programme, en remplaçant les nombres un par un. Les variables résolvent cela en vous donnant des poignées nommées pour chaque donnée.

Mais cela va plus loin. Python ne stocke pas seulement des valeurs — il suit quel *genre* de valeur chaque variable contient. Le nombre `72.5` se comporte différemment du texte `"72.5"`. Vous pouvez multiplier deux nombres, mais vous ne pouvez pas multiplier deux chaînes de la même façon. Vous pouvez comparer un booléen à `True`, mais vous ne pouvez pas l'ajouter à un entier sans erreur. Comprendre les types — `int`, `float`, `str`, `bool` — est ce qui vous permet de prédire ce que votre code va réellement faire au lieu de deviner.

Chaque programme que vous écrirez commence par ces briques : stocker des données, vérifier de quel type de données il s'agit, et parfois convertir entre les types. Sautez cette fondation, et chaque module suivant devient plus difficile. Maîtrisez-la, et vous écrirez un code prévisible, lisible et facile à déboguer.

## Ce que vous allez apprendre

- Afficher une sortie à l'écran avec `print()` et comprendre ce qu'elle renvoie
- Stocker des valeurs sous des noms (variables) et les réaffecter en toute sécurité
- Identifier les quatre types de base de Python : `int`, `float`, `str`, `bool`
- Convertir explicitement entre les types avec `int()`, `float()`, `str()`, `bool()`
- Comprendre le typage dynamique et pourquoi Python n'exige pas de déclarations de types
- Reconnaître les erreurs de type courantes avant qu'elles ne surviennent

## La dérivation

**Le problème :** Les ordinateurs doivent travailler avec des données — nombres, texte, indicateurs. Mais les adresses mémoire brutes (comme `0x7FFF5FBFF8D0`) n'ont aucun sens pour les humains. Vous ne pouvez pas construire une app météo en vous souvenant que la température vit à l'adresse `0x7FFF5FBFF8D0` tandis que le nom de ville est à `0x7FFF5FBFF8E0`.

**L'approche naïve :** Les premiers langages de programmation (comme l'assembleur) vous forçaient à gérer la mémoire directement. Vous allouiez des octets, suiviez des adresses et espériez que rien ne se chevauche. C'était sujet aux erreurs et lent à développer.

**La solution élégante :** Python (et la plupart des langages modernes) a introduit les *variables* — des noms lisibles par les humains qui pointent vers des valeurs. Quand vous écrivez `temperature = 72.5`, Python crée un objet float en mémoire et fait référence au nom `temperature`. Vous ne pensez plus jamais aux adresses mémoire.

**Pourquoi le typage dynamique ?** Python va plus loin. Contrairement à C ou Java, vous ne déclarez pas `float temperature = 72.5`. Vous écrivez simplement `temperature = 72.5` et Python déduit le type automatiquement. C'est le *typage dynamique* — le type vit avec la valeur, pas avec le nom de la variable. La même variable peut contenir un nombre, puis une chaîne, puis une liste. Cette flexibilité rend Python rapide à écrire et facile à prototyper, même si cela signifie que vous devez comprendre les types pour éviter les surprises.

**La conversion de types :** Parfois vous devez relier des types. Un utilisateur tape `"72.5"` dans un formulaire — c'est une chaîne. Vous devez faire des calculs avec, donc vous la convertissez en float avec `float("72.5")`. Python appelle cela le *casting*. C'est explicite : vous savez toujours quand une conversion survient, parce que vous écrivez vous-même la fonction de conversion.

## Gamification

- **Récompense XP** : +100 XP par leçon terminée (400 XP au total pour ce module)
- **Défis** : Chaque leçon inclut des défis de codage interactifs dans le terrain de jeu du navigateur
- **Progression** : Terminez les 4 leçons pour débloquer le Module 02 (Opérateurs et expressions)
- **Bonus de série** : Terminez ce module d'une traite pour un bonus de +10 XP
- **Succès débloqué** : « Premiers pas » — affichez votre première sortie dans la console

### Défis de leçons

| Leçon | Défi | XP |
|--------|-----------|-----|
| Impression | Affichez un message de bienvenue formaté avec plusieurs appels `print()` | +100 |
| Variables | Stockez 5 valeurs différentes et réaffectez deux d'entre elles | +100 |
| Types | Identifiez le type de 10 valeurs différentes sans exécuter le code | +100 |
| Conversion de types | Convertissez l'entrée texte d'un utilisateur en nombre et calculez un résultat | +100 |

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 🎮 **Clone de Wordle** — utilise des variables pour stocker les suppositions, suivre les tentatives et gérer l'état du jeu
- 📝 **Application de prise de notes** — stocke des données texte dans des variables et les réaffiche à l'utilisateur
- 🔐 **Générateur de mots de passe** — combine des variables de chaîne, des boucles et des choix aléatoires pour construire des mots de passe sûrs
- 💰 **Suivi de dépenses** — stocke des valeurs numériques et calcule des totaux cumulés

## Leçons

1. **Afficher une sortie** — `print()`, arguments de chaîne, plusieurs arguments et le paramètre `end`
2. **Variables** — affectation, règles de nommage, réaffectation et pourquoi les noms de variables comptent
3. **Types de données** — `int`, `float`, `str`, `bool`, `type()` et le concept de typage dynamique
4. **Conversion de types** — casting entre les types avec `int()`, `float()`, `str()`, `bool()` et les pièges courants