---
title: "Fonctions"
description: "Regroupez la logique en blocs réutilisables avec les paramètres, les valeurs de retour et la portée."
order: 4
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 3
lessonCount: 3
tags: ["def", "paramètres", "return", "portée", "lambda"]
prerequisites: ["module-03-control-flow"]
icon: "⚙️"
---

## Pourquoi c'est important

Sans fonctions, chaque programme est une séquence plate d'instructions. Besoin de calculer un pourboire ? Écrivez la formule. Besoin de le recalculer pour une facture différente ? Copiez-collez la formule. Besoin de changer la façon dont les pourboires sont calculés ? Trouvez et remplacez chaque copie. C'est ainsi que les bogues se multiplient, vous changez une copie et en ratez une autre.

Les fonctions résolvent cela en vous permettant d'écrire une logique une seule fois, de lui donner un nom, et de l'appeler quand vous en avez besoin. Une fonction `calculate_tip(bill, rate)` encapsule la logique en un seul endroit. Si l'algorithme de pourboire change, vous mettez à jour une fonction, pas vingt copies. C'est le principe DRY, Don't Repeat Yourself (Ne vous répétez pas), et les fonctions en sont l'outil principal.

Mais les fonctions font plus qu'éviter la répétition. Elles créent des *frontières d'abstraction*. Quand vous appelez `sorted(my_list)`, vous n'avez pas besoin de savoir comment le tri fonctionne en interne, vous savez juste qu'il renvoie une liste triée. Cela vous permet de construire des programmes en couches : une personne écrit la fonction de tri, une autre l'utilise, et aucune des deux n'a besoin de comprendre l'autre en détail. Les fonctions sont la façon dont les programmes Python passent de scripts à des systèmes logiciels.

## Ce que vous allez apprendre

- Définir des fonctions avec `def` et les appeler avec des parenthèses
- Les paramètres positionnels, par mot-clé, par défaut, et `*args`/`**kwargs`
- Les valeurs de `return` et les retours anticipés pour le contrôle de flux
- La portée des variables, locale vs. globale, et pourquoi `global` est généralement un anti-élément
- Les fonctions lambda pour de courtes opérations d'infixe
- Les docstrings pour documenter ce que font vos fonctions

## La dérivation

**Le problème :** À mesure que les programmes grandissent, la même logique apparaît à plusieurs endroits. Un programme qui calcule les frais de livraison pourrait avoir besoin de la formule à trois endroits : la page de paiement, le tableau de bord administrateur et le point de terminaison API. Changer la formule signifie tous les trouver.

**L'approche naïve :** Le copier-coller. Cela fonctionne jusqu'à ce que ça ne fonctionne plus. Le vrai problème n'est pas la duplication de code, c'est la duplication d'*intention*. Quand vous copiez-collez, vous dites « cela fait la même chose ». Mais une modification future pourrait rendre une copie différente des autres, et vous ne saurez jamais laquelle a changé.

**La solution élégante :** Une fonction est un bloc de code nommé et réutilisable. Vous la définissez une fois :

```python
def calculate_shipping(weight, destination):
    base_rate = 5.99
    per_kg = weight * 1.50
    zone_multiplier = get_zone_rate(destination)
    return base_rate + per_kg * zone_multiplier
```

Maintenant, chaque endroit qui a besoin des frais de livraison appelle `calculate_shipping()`. Une définition, une source de vérité. Quand la formule change, elle change partout automatiquement.

**Paramètres et flexibilité :** Les fonctions prennent des *paramètres*, des entrées qui les rendent générales. `calculate_tip(bill_amount, tip_percent)` fonctionne pour n'importe quelle facture et n'importe quel taux de pourboire. Sans paramètres, vous auriez besoin de fonctions séparées pour chaque combinaison possible : `calculate_tip_15()`, `calculate_tip_20()`, `calculate_tip_25()`. Les paramètres rendent les fonctions composables, vous les combinez comme des blocs de construction.

**Valeurs de retour :** Une fonction qui calcule quelque chose mais ne le renvoie pas est inutile. `return` renvoie le résultat à l'appelant. Les retours anticipés vous permettent de quitter une fonction avant d'atteindre la fin, utiles pour les clauses de garde : `if not data: return None`.

**Portée :** Les variables créées à l'intérieur d'une fonction vivent dans la *portée locale*, elles n'existent que pendant l'exécution de la fonction. Cela évite les collisions de noms. Deux fonctions peuvent toutes deux utiliser une variable nommée `result` sans conflit. Le mot-clé `global` brise cet isolement, mais en abuser mène au code spaghetti. La portée locale est la norme ; la portée globale est l'exception.

**Lambdas :** Parfois, vous avez besoin d'une minuscule fonction que vous utiliserez une seule fois. `lambda x: x * 2` crée une fonction anonyme qui double son entrée. Les lambdas sont courantes avec `sorted(key=lambda ...)`, `map()` et `filter()`. Elles ne remplacent pas `def`, elles sont un outil pour des opérations courtes et d'infixe.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (180 XP au total pour ce module)
- **Défis** : Chaque leçon inclut des défis interactifs de construction de fonctions
- **Progression** : terminez les 3 leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Succès débloqué** : « Architecte de fonctions », écrivez une fonction qui prend une autre fonction en argument

### Défis de leçons

| Leçon | Défi | XP |
|--------|-----------|-----|
| Définir des fonctions | Écrivez une fonction qui convertit des degrés Celsius en Fahrenheit et appelez-la 3 fois | +60 |
| Paramètres | Créez une fonction avec des paramètres par défaut, par mot-clé et *args | +60 |
| Portée et Lambda | Corrigez un bogue de portée dans un code donné, puis remplacez une ligne unique par une lambda | +60 |

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 🧮 **Convertisseur d'unités**, fonctions pour chaque conversion (miles↔km, lbs↔kg, etc.) appelées depuis un menu
- 🎲 **Lanceur de dés**, une fonction qui lance N dés et renvoie les résultats, utilisable dans n'importe quel jeu
- 📧 **Générateur de modèles d'e-mail**, fonctions qui formatent différents types d'e-mails avec des modèles réutilisables
- 🏋️ **Calculatrice d'entraînement**, fonctions pour les calories, l'IMC et les calculs de repère maximal

## Leçons

1. **Définir et appeler des fonctions**, `def`, paramètres, valeurs de retour et docstrings
2. **Motifs de paramètres**, positionnels, par mot-clé, par défaut, `*args`, `**kwargs` et l'ordre des paramètres
3. **Portée et lambdas**, portée locale vs. globale, fermetures et fonctions lambda