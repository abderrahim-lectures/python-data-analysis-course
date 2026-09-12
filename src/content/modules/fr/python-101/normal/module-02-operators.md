---
title: "Opérateurs et expressions"
description: "Opérateurs arithmétiques, de comparaison et booléens, les briques de chaque expression."
order: 2
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 2
lessonCount: 3
tags: ["opérateurs", "arithmétique", "comparaison", "booléen", "précédence"]
prerequisites: ["module-01-python-basics"]
icon: "🔢"
---

## Pourquoi c'est important

Chaque fois que vous écrivez `x + y`, vous utilisez un opérateur. Les opérateurs sont les verbes de la programmation, ils prennent vos données et *font quelque chose* avec elles. Sans eux, vous pourriez stocker des valeurs mais jamais rien calculer. Une application de calculatrice qui ne sait pas additionner n'est qu'un écran d'affichage.

Pensez à construire un panier d'achat. Vous devez calculer les sous-totaux (`price * quantity`), appliquer des réductions (`subtotal * 0.9`), vérifier si l'utilisateur a assez d'argent (`total <= balance`) et déterminer si la livraison est gratuite (`subtotal >= 50`). Chacun de ces calculs est une expression d'opérateur. Et l'ordre dans lequel vous les évaluez compte, `3 + 4 * 2` vaut 11, pas 14, parce que la multiplication a lieu avant l'addition. Mal comprendre la précédence, et vos totaux sont faux.

Les opérateurs booléens (`and`, `or`, `not`) vous permettent de combiner des conditions. « L'utilisateur est-il connecté ET a-t-il un abonnement valide ? », c'est `is_logged_in and has_subscription`. Sans comprendre comment ces opérateurs fonctionnent ensemble, vous ne pouvez pas exprimer la logique du monde réel en code.

## Ce que vous allez apprendre

- Les opérateurs arithmétiques, y compris la division entière (`//`) et le modulo (`%`) de Python
- Les opérateurs de comparaison (`==`, `!=`, `<`, `>`, `<=`, `>=`) et les comparaisons enchaînées (`1 < x < 10`)
- Les opérateurs booléens (`and`, `or`, `not`) pour combiner des conditions
- La précédence des opérateurs et quand utiliser des parenthèses pour plus de clarté
- L'évaluation en court-circuit : comment Python évite les calculs inutiles
- Les opérateurs d'affectation (`+=`, `-=`, `*=`) pour des mises à jour concises

## La dérivation

**Le problème :** Vous avez des données, et vous devez les transformer. Un prix doit être multiplié par une quantité. Une température doit être comparée à un seuil. Deux conditions doivent être vérifiées ensemble. Sans opérateurs, vous devriez appeler des fonctions pour chaque minuscule opération : `multiply(price, quantity)` ou `is_greater_than(temp, 100)`. Le code serait verbeux et illisible.

**L'approche naïve :** Certains langages (comme Lisp) utilisent la notation préfixée partout : `(* price quantity)`. C'est cohérent mais difficile à lire quand on est habitué à la notation mathématique.

**La solution élégante :** Python utilise la notation infixe, `price * quantity`, tout comme les mathématiques. Cela rend les expressions de lecture naturelle. Vous disposez aussi de comparaisons enchaînées : `0 < temperature < 100` se lit exactement comme l'inégalité mathématique qu'elle représente. Aucun autre langage grand public ne fait cela aussi proprement.

**L'arithmétique au-delà des mathématiques de base :** Les `//` (division entière) et `%` (modulo) de Python existent parce que les problèmes du monde réel en ont besoin. `//` vous donne la partie entière d'une division, essentielle pour répartir des éléments en pages (100 éléments / 10 par page = 10 pages). `%` vous donne le reste, essentiel pour vérifier les nombres pairs/impairs (`x % 2 == 0`) ou cycler dans des valeurs (`x % 3` tourne sur 0, 1, 2).

**La logique booléenne comme langage :** `and`, `or`, `not` se lisent comme de l'anglais. `if is_admin and has_permission` est clair pour tout le monde. Mais il y a un mécanisme plus profond : l'*évaluation en court-circuit*. `if x != 0 and y / x > 1`, Python s'arrête à `x != 0` s'il est faux, n'évaluant jamais `y / x` et évitant une erreur de division par zéro. Les opérateurs ne sont pas que de la syntaxe ; ce sont des mécanismes de sécurité.

**La précédence :** L'ordre des opérations (`*` avant `+`) est hérité des mathématiques. Python ajoute `not` avant `and` avant `or`. En cas de doute, utilisez des parenthèses, elles ne coûtent rien et évitent des bogues.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (180 XP au total pour ce module)
- **Défis** : Chaque leçon inclut des défis interactifs de construction d'expressions
- **Progression** : terminez les 3 leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Succès débloqué** : « Moteur d'expression », écrivez une chaîne de 5 opérateurs dans une seule expression

### Défis de leçons

| Leçon | Défi | XP |
|--------|-----------|-----|
| Arithmétique | Construisez une calculatrice de pourboire avec la division entière et le modulo | +60 |
| Comparaison | Enchaînez 3 comparaisons pour valider un format de numéro de téléphone | +60 |
| Logique booléenne | Combinez 4 conditions avec et/ou/non pour modéliser une règle de jeu | +60 |

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 🛒 **Calculatrice de panier d'achat**, les opérateurs arithmétiques calculent les totaux, les réductions et la taxe
- 🎯 **Jeu de devinette de nombre**, les opérateurs de comparaison donnent des indices « plus grand » ou « plus petit »
- 📊 **Calculatrice de notes**, les opérateurs booléens déterminent réussite/échec avec plusieurs critères
- ⏰ **Minuteur de compte à rebours**, l'opérateur modulo convertit les secondes en heures, minutes, secondes

## Leçons

1. **Opérateurs arithmétiques**, `+`, `-`, `*`, `/`, `//`, `%`, `**` et les opérateurs d'affectation (`+=`, `-=`, etc.)
2. **Opérateurs de comparaison**, `==`, `!=`, `<`, `>`, `<=`, `>=`, comparaisons enchaînées et `is` vs `==`
3. **Opérateurs booléens et précédence**, `and`, `or`, `not`, évaluation en court-circuit et règles de précédence des opérateurs