---
title: "Le contrôle de flux"
description: "Prenez des décisions avec if/elif/else et répétez des actions avec les boucles for et while."
order: 3
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 3
lessonCount: 3
tags: ["if", "elif", "else", "for", "while", "boucles", "conditionnelles"]
prerequisites: ["module-02-operators"]
icon: "🔀"
---

## Pourquoi c'est important

Un programme qui fait toujours la même chose n'est qu'un script. Un programme qui *décide* est un logiciel. Le contrôle de flux est ce qui rend les programmes intelligents, il permet à votre code de répondre à différentes entrées, de répéter des tâches et de gérer les cas limites.

Pensez à un système de connexion. Si le nom d'utilisateur existe ET que le mot de passe correspond, laissez-le entrer. Si le nom d'utilisateur existe mais que le mot de passe est faux, affichez « mot de passe incorrect ». Si le nom d'utilisateur n'existe pas, affichez « compte introuvable ». Sans `if/elif/else`, vous auriez besoin d'opérateurs ternaires imbriqués qui ressemblent à du charabia. La syntaxe de contrôle de flux de Python existe pour que vous puissiez écrire une logique qui se lit comme un arbre de décision humain.

Imaginez maintenant traiter un fichier CSV de 10 000 lignes. Vous ne pouvez pas écrire 10 000 lignes de code, une par ligne. Les boucles (`for` et `while`) vous permettent d'écrire la logique une fois et de l'appliquer à chaque ligne automatiquement. La boucle `for` itère sur une séquence. La boucle `while` répète jusqu'à ce qu'une condition change. Ensemble, elles gèrent la répétition à n'importe quelle échelle, du traitement d'une liste de 5 noms à l'analyse de millions de points de données.

## Ce que vous allez apprendre

- Les blocs `if`, `elif`, `else` pour une logique conditionnelle avec des branchements clairs
- Les boucles `for` pour itérer sur des séquences (listes, chaînes, ranges, dictionnaires)
- Les boucles `while` pour une exécution répétée jusqu'à ce qu'une condition soit remplie
- `break`, `continue` et `pass` pour un contrôle fin des boucles
- Les conditionnelles imbriquées et quand les aplatir avec des clauses de garde
- La fonction `range()` pour des motifs d'itération numériques

## La dérivation

**Le problème :** La logique du monde réel a des branches. « S'il pleut, prends un parapluie. Sinon, mets des lunettes de soleil. » Un ordinateur a besoin de la même capacité de prise de décision. Et parfois la décision est « fais ceci 100 fois », comme vérifier la note de chaque étudiant.

**L'approche naïve :** Sans contrôle de flux structuré, vous utiliseriez des instructions `goto` (comme dans les premiers BASIC ou l'assembleur). `goto line 50` saute à un numéro de ligne. Les programmes devenaient des toiles enchevêtrées de sauts, impossibles à lire, à déboguer ou à maintenir. C'était l'ère du « code spaghetti ».

**La solution élégante :** Le `if/elif/else` de Python se lit comme un arbre de décision écrit en anglais. L'indentation n'est pas qu'un détail cosmétique, elle définit la structure. Contrairement aux accolades `{}` de C, les espaces blancs de Python rendent la logique visuellement claire. Vous pouvez voir d'un coup d'œil ce qui se trouve dans chaque branche.

```python
if temperature > 100:
    status = "dangerously hot"
elif temperature > 80:
    status = "warm"
else:
    status = "comfortable"
```

**For contre While :** La boucle `for` est faite pour les séquences *connues*, « fais ceci pour chaque élément de cette liste ». La boucle `while` est faite pour les durées *inconnues*, « demande une entrée jusqu'à ce qu'ils tapent 'quit' ». Cette distinction compte parce que les boucles `for` se terminent toujours (la liste finit), tandis que les boucles `while` peuvent tourner indéfiniment si la condition de sortie n'est jamais atteinte. Choisissez la mauvaise, et vous obtenez des boucles infinies ou une complexité inutile.

**Le contrôle des boucles :** `break` quitte la boucle immédiatement. `continue` passe à l'itération suivante. `pass` ne fait rien, c'est un espace réservé. Ces mots-clés existent parce que les vraies boucles ne sont pas toujours propres. Parfois vous devez sortir tôt (`break` en trouvant une cible), sauter de mauvaises données (`continue` sur une entrée invalide) ou réserver une place pour une logique future (`pass` dans un bloc vide).

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (180 XP au total pour ce module)
- **Défis** : Chaque leçon inclut des défis de codage interactifs
- **Progression** : terminez les 3 leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Succès débloqué** : « Ramification », écrivez un programme avec 3 branches if/elif/else imbriquées

### Défis de leçons

| Leçon | Défi | XP |
|--------|-----------|-----|
| Conditionnelles | Construisez un classifieur de niveaux (bronze/argent/or) basé sur les intervalles de score | +60 |
| Boucles for | Itérez sur une liste de noms et affichez un salut pour chacun | +60 |
| Boucles while | Créez une boucle de devinette de nombre qui sort sur la bonne réponse | +60 |

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 🎮 **Jeu d'aventure texte**, les branches if/elif/else créent différents chemins narratifs selon les choix du joueur
- 🔍 **Défi FizzBuzz**, les boucles for avec la logique modulo résolvent le problème classique d'entretien
- 🎯 **Jeu de devinette de nombre**, les boucles while avec break pour un gameplay interactif
- 📋 **Gestionnaire de tâches en CLI**, les boucles traitent les commandes utilisateur jusqu'à ce qu'ils choisissent de quitter

## Leçons

1. **Conditionnelles**, `if`, `elif`, `else`, conditionnelles imbriquées et clauses de garde
2. **Boucles for**, itérer sur des séquences, `range()`, `enumerate()` et les motifs de boucle
3. **Boucles while et contrôle des boucles**, `while`, `break`, `continue`, `pass` et éviter les boucles infinies