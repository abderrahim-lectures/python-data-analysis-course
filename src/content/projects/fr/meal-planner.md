---
title: "Planificateur de Repas"
description: "Planifiez les repas avec suivi nutritionnel, base de données de recettes et génération de listes de courses."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "data-structures", "csv"]
learningObjectives:
  - "Modéliser une base de données de recettes comme une liste de dictionnaires"
  - "Construire un plan de repas hebdomadaire en plaçant une recette par jour"
  - "Additionner la nutrition par recette en totaux quotidiens avec des accumulateurs incrémentaux"
  - "Dériver une liste de courses consolidée en fusionnant les ingrédients répétés"
prerequisites: ["python-101/data-structures", "python-101/reading-files", "python-101/dicts-and-sets"]
---

# 🍽️ Construire un Planificateur de Repas

Planifier les repas semble simple sur le papier — décider sept dîners, écrire une liste de courses — mais c'est exactement là que l'arithmétique s'effondre : trois recettes partagent du riz, deux partagent du poulet, et la colonne des calories passe tranquillement inaperçue. Ce projet construit un CLI qui fait la comptabilité : une base de données de recettes, un plan de semaine de repas, des totaux quotidiens de calories et de macros, et une liste de courses qui fusionne les ingrédients partagés en un seul récapitulatif consolidé au lieu de sept listes qui se chevauchent.

Ceci suppose Python 101 — listes, dicts, lecture de fichiers et fonctions. Rien au-delà : pas de base de données, pas de web, pas de services externes. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Stocker une petite base de données de recettes pour que chaque recette ait son nom de plat, ses portions, ses ingrédients et sa nutrition.
2. Planifier une semaine en assignant une recette par jour et en imprimant le plan.
3. Calculer le total calorique et les macros de chaque jour à partir des recettes choisies.
4. Générer une seule liste de courses consolidée qui fusionne les ingrédients partagés au lieu de les répéter.
5. Charger la base de données depuis un CSV pour pouvoir l'agrandir sans éditer de code.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal ici et le seul avec un vrai bénéfice de système de fichiers : la base de données de recettes vit réellement sur disque (CSV), et « ajouter un fichier de recette, relancer, nouvelle liste de courses » est une boucle authentique. Les étapes ci-dessous supposent un petit dossier avec `uv`.

**GitHub Codespaces** fonctionne à l'identique : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et Node, Python et `uv` sont déjà installés dans un vrai clone du dépôt du cours.

**Google Colab, Kaggle Notebooks et Binder peuvent *exécuter* chaque fonction, et pour un projet purement données comme celui-ci ils sont tout à fait corrects** — pas de secrets, pas de GPU, pas de fichiers géants. La seule chose qui ne passe pas, c'est « les fichiers de ta session sont éphémères », ce qui compte surtout si tu voulais que ton CSV personnel de recettes survive. Le notebook ci-dessous inclut une base de démarrage pour que tout le pipeline plan → totaux → courses tourne de bout en bout sans aucune configuration. Essaie-le là d'abord, puis passe en local quand tu as tes propres recettes.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meal-planner/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meal-planner/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeal-planner%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant de planifier un seul repas : `uv`, et une petite base de données de recettes que tu peux étendre.

### Installe `uv` et mets en place le projet

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis :

```bash
uv --version
mkdir meal-planner && cd meal-planner
uv init --bare
```

Aucun package supplémentaire — ce projet est en pur bibliothèque standard.

### Crée la base de données de recettes

Colle ceci dans `recipes.py` comme base de démarrage (quatre recettes, chacune avec totaux caloriques et macros par portion, plus une liste d'ingrédients avec un élément partagé pour rendre la fusion de l'étape 4 visible) :

```python
# recipes.py
RECIPES = [
    {"name": "Chicken stir-fry", "servings": 2, "calories": 480, "protein": 38,
     "ingredients": ["chicken breast", "rice", "broccoli", "soy sauce"]},
    {"name": "Veggie curry", "servings": 4, "calories": 410, "protein": 16,
     "ingredients": ["chickpeas", "rice", "coconut milk", "curry powder"]},
    {"name": "Tacos", "servings": 4, "calories": 520, "protein": 24,
     "ingredients": ["ground beef", "tortillas", "lettuce", "salsa"]},
    {"name": "Tofu bowl", "servings": 2, "calories": 450, "protein": 30,
     "ingredients": ["tofu", "rice", "broccoli", "soy sauce"]},
]
```

Exécute :

```bash
uv run python -c "from recipes import RECIPES; print(len(RECIPES), 'recipes loaded')"
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `recipes.py` existe et `uv run python -c "from recipes import RECIPES; print(len(RECIPES))"` affiche `4`.
- ✅ Remarque que `rice`, `broccoli` et `soy sauce` apparaissent dans *plus d'une* recette — ce sont les ingrédients que l'étape 4 doit fusionner.

## Étape 1 : Charge et inspecte la base de recettes

« Données » ici désigne une liste de dicts, chaque dict étant une recette. Avant de planifier quoi que ce soit, tu veux une fonction qui *montre* la base — parce que chaque étape ultérieure (totaux, fusion) sera fausse si deux recettes sont silencieusement en désaccord sur leurs champs.

### 1.1 Requête la base par nom

```python
# planner.py
from recipes import RECIPES

def find_recipe(name: str) -> dict:
    matches = [r for r in RECIPES if r["name"].lower() == name.lower()]
    if not matches:
        raise ValueError(f"No recipe named {name!r}")
    return matches[0]

def list_recipes() -> None:
    for r in RECIPES:
        print(f"{r['name']:<18} {r['calories']:>4} kcal  {r['protein']:>3} g protein")

if __name__ == "__main__":
    list_recipes()
    print()
    print(find_recipe("tacos"))
```

`find_recipe` met les deux côtés en minuscules avant de comparer, donc `find_recipe("TACOS")` et `find_recipe("tacos")` atteignent le même dict — une petite habitude de robustesse bien réelle. La recherche est une compréhension de liste parce que quatre recettes n'ont pas besoin d'un index par dict ; si la base atteignait des milliers d'entrées, la correction serait un dict indexé par nom, pas une compréhension plus rapide.

**👟 Indice de départ :** Exécute `planner.py` pour lister les quatre recettes, puis appelle `find_recipe("tacos")` et inspecte le dict renvoyé champ par champ.

**🎯 Résultat attendu :** Les quatre recettes imprimées en tableau soigné (nom + calories + protéines), puis un dict nommé `Tacos` avec les six clés — dont `ingredients` sous forme de liste.

**🩹 Si ça ne marche pas :** Si `ImportError: cannot import name 'RECIPES'`, le fichier s'appelle `recipes.py` mais le nom du module est `recipes` — vérifie que tu ne l'as pas nommé `recipe.py`. Si `find_recipe("tacos")` lève une erreur alors que Tacos existe, le `.lower()` des deux côtés compare les bonnes valeurs — ajoute un print pour confirmer les noms avant de « corriger » la version fonctionnelle en supprimant la minuscule qui n'est pas un bug.

### 1.2 Vérifie la requête

**✅ Liste de vérification**

- ✅ `list_recipes()` imprime les quatre recettes avec calories et protéines.
- ✅ `find_recipe` lève une `ValueError` claire pour un nom qui n'existe pas, et renvoie le bon dict quelle que soit la casse.
- ✅ Chaque dict de recette a les mêmes clés — tu peux écrire une vérification d'une ligne affirmant que les quatre partagent un même ensemble de clés.

**🤔 Question(s) socratique(s)**

- `find_recipe` renvoie une référence au *dict réel* de `RECIPES`, pas une copie. Si du code ultérieur modifiait ce qu'elle renvoie, qu'est-ce qui se corrompt en silence — et y a-t-il un argument pour renvoyer une copie ?
- Quatre recettes justifient un parcours linéaire. À partir de quelle taille de base « renommer le dict indexé par nom » cesse-t-il d'être optionnel — et qu'est-ce que cela t'apprend sur le moment de choisir un changement de structure plutôt que la force brute qui est honnêtement suffisante ?

## Étape 2 : Construis le plan hebdomadaire

Le plan est le modèle le plus simple possible d'une semaine : un dictionnaire qui associe chaque jour à un nom de recette. Tout le reste — totaux, liste de courses — prend ce plan comme *unique* entrée. Garder les données du plan séparées des fonctions de totaux est ce qui rend chaque étape testable indépendamment.

### 2.1 Assigne une recette à chaque jour

```python
# planner.py (continued)

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

def build_plan(assignments: dict[str, str]) -> dict[str, dict]:
    plan = {}
    for day, name in assignments.items():
        if day not in DAYS:
            raise ValueError(f"{day!r} is not a day of the week")
        plan[day] = find_recipe(name)
    return plan

if __name__ == "__main__":
    week = build_plan(
        {"Mon": "Chicken stir-fry", "Tue": "Tacos", "Wed": "Veggie curry",
         "Thu": "Tofu bowl", "Fri": "Chicken stir-fry", "Sat": "Tacos", "Sun": "Veggie curry"}
    )
    for day, recipe in week.items():
        print(f"{day}: {recipe['name']}")
```

`build_plan` valide deux choses avant de stocker : le jour est l'un des sept noms connus (une faute de frappe comme `"monday"` est attrapée bruyamment), et chaque recette se résout via `find_recipe` (donc un plan référençant une recette supprimée échoue *au moment de la planification*, pas au moment des totaux trois étapes plus tard). Associer jour → dict de recette complet, plutôt que jour → chaîne, est la décision qui permet à l'étape 3 de lire la nutrition du plan sans une seconde recherche.

**👟 Indice de départ :** Garde le plan dans un simple `dict[str, str]` une minute *avant* de passer à `dict[str, dict]` — exécute la boucle, puis fais la bascule et ré-exécute ; ressens la différence de ce que l'étape 3 pourra accéder.

**🎯 Résultat attendu :** Sept lignes, de `Mon: Chicken stir-fry` à `Sun: Veggie curry`, dans l'ordre des jours, sans `KeyError` et tous les noms en accord avec la base.

**🩹 Si ça ne marche pas :** Si `ValueError: 'monday' is not a day of the week`, tes clés ne sont pas exactement les chaînes `DAYS` — la vérification est délibérément stricte, donc soit corrige la clé soit (mieux) laisse la vérification continuer de te protéger. Si `find_recipe` lève `No recipe named 'Taco'`, ton plan référence un nom que la base ne possède pas — l'échec au moment du plan est la correction, pas le bug.

### 2.2 Vérifie le plan

**✅ Liste de vérification**

- ✅ `build_plan` renvoie un dict avec exactement sept clés, une par jour, chaque valeur étant un dict de recette complet.
- ✅ Un nom de jour inconnu lève une `ValueError` au lieu de créer silencieusement un jour fantôme.
- ✅ Le même nom de recette peut apparaître plusieurs jours — le plan n'exige pas sept plats distincts.
- ✅ Éditer le plan pour référencer une recette manquante échoue *au moment de la construction*, pas au moment des totaux.

**🤔 Question(s) socratique(s)**

- Le plan stocke des dicts de recette complets, donc le plan et `RECIPES` peuvent dériver : si tu modifies les calories d'une recette, les *anciens* plans construits avant la modification détiennent toujours l'ancien dict — et les nouveaux plans obtiennent le nouveau. Est-ce une fonctionnalité ou un bug pour un planificateur de repas, et quel comportement voudrais-tu si les recettes changeaient chaque semaine ?
- Nous avons choisi les noms de jours comme clés du plan. Qu'est-ce qui casse si quelqu'un veut un plan uniquement pour les jours ouvrés — et comment `build_plan` devrait-elle changer pour accepter « tout itérable de (créneau, recette) » ?

## Étape 3 : Totalise la nutrition du jour

Les calories et macros de chaque recette sont *par portion* ; un plan contient des *repas*, et un repas est généralement « la recette entière » ou un nombre déclaré de portions. Cette étape est celle où la planification des repas devient utile : non pas « j'ai choisi de jolies recettes » mais « ma semaine arrive à 2 180 kcal par jour ».

### 3.1 Additionne la nutrition par repas sur la journée

```python
# planner.py (continued)

def day_totals(recipes: list[dict]) -> dict:
    total = {"calories": 0, "protein": 0, "meals": 0}
    for r in recipes:
        total["calories"] += r["calories"]
        total["protein"] += r["protein"]
        total["meals"] += 1
    return total

def week_totals(plan: dict[str, dict]) -> dict:
    return {day: day_totals([r]) for day, r in plan.items()}

if __name__ == "__main__":
    week = build_plan(
        {"Mon": "Chicken stir-fry", "Tue": "Tacos", "Wed": "Veggie curry",
         "Thu": "Tofu bowl", "Fri": "Chicken stir-fry", "Sat": "Tacos", "Sun": "Veggie curry"}
    )
    totals = week_totals(week)
    for day, t in totals.items():
        print(f"{day}: {t['calories']:>4} kcal, {t['protein']:>2} g protein")
    daily_mean = sum(t["calories"] for t in totals.values()) / len(totals)
    print(f"daily mean: {daily_mean:.0f} kcal")
```

L'accumulateur est un simple dict dans lequel tu additionnes — le modèle du « total incrémental », écrit en toutes lettres pour que la forme soit visible (la première fois que tu l'écris, tu *vois* que `+=` sur une entrée de dict est légal, et que tu dois initialiser la clé à `0` d'abord). `week_totals` est juste `day_totals` appliquée à une liste d'une recette par jour — envelopper `[r]` est une façon un peu étrange mais honnête de dire « ce jour utilise exactement une recette », et cela signifie que `day_totals` pourra plus tard accepter plusieurs recettes (un vrai déjeuner *et* dîner) sans aucune modification.

**👟 Indice de départ :** Ajoute `day_totals(["a", "b"])` avec deux dicts de recette *avant* de construire ta semaine — confirme que la fonction les additionne correctement toute seule, puis branche-la dans `week_totals`.

**🎯 Résultat attendu :** Sept lignes de totaux au format `Mon: 480 kcal, 38 g protein`, puis une ligne `daily mean: ... kcal` — avec notre plan, exactement `(480+520+410+450+480+520+410)/7 = 467 kcal` comme moyenne.

**🩹 Si ça ne marche pas :** Si les calories s'additionnent silencieusement à zéro, le `+=` écrit dans une clé jamais initialisée — chaque clé doit d'abord apparaître comme `total = {"calories": 0, ...}` avant la boucle. Si la moyenne quotidienne s'imprime avec un `.6666` final, c'est un comportement flottant correct — convertis en int ou arrondis explicitement quand tu veux afficher `467`.

### 3.2 Vérifie les totaux

**✅ Liste de vérification**

- ✅ `day_totals` sur deux dicts de recette renvoie la somme arithmétique des deux recettes — vérifie à la main avec deux minuscules dicts inventés.
- ✅ `week_totals` couvre chaque jour du plan, ni plus ni moins.
- ✅ La moyenne quotidienne correspond à la moyenne calculée à la main des sept valeurs quotidiennes.
- ✅ Exécuter `day_totals([])` renvoie l'accumulateur tout à zéro, pas une erreur.

**🤔 Question(s) socratique(s)**

- La nutrition par portion est traitée comme « nutriments du plat entier ». Si une recette a `servings: 4` et que tu n'en manges qu'un quart, de combien notre outil surévalue-t-il d'un facteur 4 — et quelle multiplication unique le corrige ?
- `day_totals` prend une *liste* de recettes. Quel changement du modèle de données du plan permettrait à un jour de contenir petit-déjeuner, déjeuner et dîner, et quelle réécriture minimale de `week_totals` le supporte ?

## Étape 4 : Fusionne les ingrédients en une liste de courses

La planification et les totaux sont de la comptabilité ; la liste de courses est la récompense. Une liste naïve « le sauté de poulet a besoin de riz, les tacos ont besoin de riz, le curry a besoin de riz » te met trois sacs de riz entre les mains. Fusionner les ingrédients partagés par nom — compter combien de recettes en ont besoin — transforme cela en une seule entrée honnête.

### 4.1 Compte les mentions d'ingrédients sur la semaine

```python
# planner.py (continued)

def grocery_list(week: dict[str, dict]) -> dict[str, int]:
    needed = {}
    for recipe in week.values():
        for ingredient in recipe["ingredients"]:
            needed[ingredient] = needed.get(ingredient, 0) + 1
    return dict(sorted(needed.items()))

if __name__ == "__main__":
    week = build_plan(
        {"Mon": "Chicken stir-fry", "Tue": "Tacos", "Wed": "Veggie curry",
         "Thu": "Tofu bowl", "Fri": "Chicken stir-fry", "Sat": "Tacos", "Sun": "Veggie curry"}
    )
    for ingredient, count in grocery_list(week).items():
        print(f"{ingredient:<14} x{count}")
```

`needed.get(ingredient, 0) + 1` est l'idiome standard « compter les occurrences avec un dict » — le `.get(key, 0)` renvoie le total en cours, par défaut 0 à la première rencontre, puis on ajoute un. Remarque que `rice` devrait maintenant afficher `x3` (sauté, curry, bol de tofu) : la fusion est toute la fonctionnalité, et une passe finale triée rend la liste lisible quel que soit l'ordre du plan.

**👟 Indice de départ :** Exécute la fusion, puis compte *manuellement* `rice` dans le plan et confirme que ton comptage à la main correspond au `x3` imprimé par la fonction — cette égalité est ton moment « ça marche ».

**🎯 Résultat attendu :** Une liste triée où `rice x3`, `broccoli x2` et `soy sauce x2` apparaissent une fois chacun — pas répétés par recette — et les éléments à usage unique comme `tortillas x1` y figurent toujours.

**🩹 Si ça ne marche pas :** Si `rice x1` apparaît trois fois parce qu'un dict ne peut pas avoir de clés dupliquées, tu ajoutes à une *liste* au lieu de compter dans un *dict* — la fusion *est* le dict. Si le compte est faux mais les clés uniques, vérifie que le `+1` est à l'intérieur de l'affectation `needed[ingredient] = ...` et que le défaut `.get(..., 0)` est écrit `0`, pas `None` (qui planterait sur `None + 1`).

### 4.2 Vérifie la fusion

**✅ Liste de vérification**

- ✅ Les ingrédients partagés (`rice`, `broccoli`, `soy sauce`) apparaissent exactement une fois, avec des comptes correspondant à ton comptage du plan à la main.
- ✅ Chaque ingrédient utilisé par une recette quelconque apparaît dans la liste finale — rien n'est perdu.
- ✅ La sortie est triée alphabétiquement quel que soit l'ordre d'apparition des recettes dans le plan.

**🤔 Question(s) socratique(s)**

- Cette fusion compte *combien de recettes* ont besoin de riz, pas *quelle quantité* un supermarché devrait stocker (cela dépend des portions et des parts par personne). De quoi une fonction `grocery_stock(week, portion_per_person)` aurait-elle besoin, par ingrédient, que le dict actuel `nom -> count` ne peut pas répondre — et quelle forme les données devraient-elles prendre ?
- Deux ingrédients sont *le même article d'épicerie* sous des noms différents (« poitrine de poulet » vs « cuisses de poulet ») et la fusion les traite joyeusement séparément. L'outil devrait-il les fusionner ? Quel est le changement de données le plus simple (indice : un nom canonique par ingrédient) qui le lui permet — et quel problème cela introduit-il ailleurs ?

## Étape 5 : Charge les recettes depuis un CSV

Quatre recettes codées en dur dans `recipes.py` était bien pour apprendre ; un vrai planificateur grandit. L'étape 5 remplace la valeur littérale `RECIPES` par un CSV sur disque — la même compétence que « lire un CSV », mais appliquée pour faire de la base un *fichier que tu peux éditer sans toucher au code*.

### 5.1 Lis la base depuis le CSV

Crée `recipes.csv` :

```csv
name,servings,calories,protein,ingredients
Chicken stir-fry,2,480,38,"chicken breast, rice, broccoli, soy sauce"
Veggie curry,4,410,16,"chickpeas, rice, coconut milk, curry powder"
Tacos,4,520,24,"ground beef, tortillas, lettuce, salsa"
Tofu bowl,2,450,30,"tofu, rice, broccoli, soy sauce"
```

```python
# csv_loader.py
import csv
from recipes_data import RECIPES  # same dict structure, now built by load_recipes_csv

def load_recipes_csv(path: str) -> list[dict]:
    recipes = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            recipes.append({
                "name": row["name"],
                "servings": int(row["servings"]),
                "calories": int(row["calories"]),
                "protein": int(row["protein"]),
                "ingredients": [i.strip() for i in row["ingredients"].split(",")],
            })
    return recipes
```

Deux conversions rendent cette cellule différente de « juste lire un fichier » : les colonnes numériques sont converties avec `int(...)` (le lecteur CSV renvoie des *chaînes* par conception — oublier cela produit `'480'` au lieu de `480` et une erreur silencieuse dans l'arithmétique de l'étape 3), et la *chaîne* unique `ingredients` devient une liste en découpant sur les virgules et en retirant les espaces. Le dict de recette a maintenant exactement la forme attendue par les étapes précédentes — le chargeur est un remplaçant direct de `RECIPES` codé en dur, ce qui est tout l'intérêt de garder un schéma stable.

**👟 Indice de départ :** Écris le CSV, exécute `load_recipes_csv`, puis *remplace* `from recipes import RECIPES` dans `planner.py` par `import csv_loader as recipes` et ré-exécute `list_recipes` — sortie identique, nouvelle source de vérité.

**🎯 Résultat attendu :** `load_recipes_csv("recipes.csv")` renvoie quatre dicts identiques à ceux codés en dur, et `list_recipes()` de `planner.py` imprime le même tableau qu'avant — maintenant issu du fichier.

**🩹 Si ça ne marche pas :** Si les totaux s'impriment comme `480 38` mais que l'analyse montre des chaînes, les conversions `int(...)` ont été sautées — chaque colonne numérique en a besoin. Si les ingrédients ressortent en une seule longue chaîne, `split(",")` n'a pas été appliqué ou tes lignes CSV ne mettent pas la colonne d'ingrédients entre guillemets (les virgules non citées découpent la *ligne*, donc `csv` casse la ligne à chaque virgule). Si `KeyError: 'name'`, ta ligne d'en-tête a un premier nom de colonne différent de ce que `row["name"]` attend — imprime `row` depuis `DictReader` pour voir les vraies clés.

### 5.2 Vérifie le chargeur CSV

**✅ Liste de vérification**

- ✅ `load_recipes_csv` renvoie des recettes dont les champs numériques sont des `int`, pas des `str`.
- ✅ Le `ingredients` de chaque dict est une vraie liste, sans espaces de tête ou de fin parasites.
- ✅ Supprimer une ligne CSV retire cette recette de `list_recipes()` au *prochain* lancement — une édition de fichier, pas une édition de code.
- ✅ Ajouter une nouvelle ligne avec les cinq mêmes colonnes se charge sans toucher à aucun Python.

**🤔 Question(s) socratique(s)**

- Le CSV te donne une base éditable à la main. Que ne te donne-t-il *pas* qu'une vraie base (ou même un fichier JSON) donnerait — pense au citation, à l'échappement, et à ce qui arrive quand un ingrédient contient lui-même une virgule ?
- `csv.DictReader` a utilisé la ligne d'en-tête pour les clés. Si l'en-tête passait de `name` à `dish`, chaque `row["name"]` casse. Cette résistance est-elle bonne (honnêteté du schéma) ou mauvaise (couplage fragile) ? Qu'est-ce qui ferait échouer le chargeur *bruyamment* au lieu d'échouer *mal* ?

## ⚠️ Pièges courants

- **Oublier les conversions `int()` du CSV.** `csv` renvoie des chaînes ; `calories: "480"` additionnée à `protein: "38"` peut même ne pas lever d'erreur — elle peut concaténer ou faire de l'arithmétique de chaînes en silence — pendant qu'un `"480" * 4` ultérieur vit dans un monde où tout est texte. Convertis toujours les champs numériques au moment du chargement, à un seul endroit, et fais confiance à tout ce qui suit.
- **Traiter le dict de recette comme sa propre autorité.** `find_recipe` renvoyant une référence vivante signifie qu'une mutation accidentelle corrompt toute la base pour chaque étape ultérieure. Soit renvoie des copies, soit — plus strict — rends `recipes` en lecture seule via `MappingProxyType` et conçois pour que le plan n'ait jamais besoin d'écrire.
- **Un article par recette dans la liste de courses.** La fonctionnalité « fusionner par nom d'ingrédient » est exactement ce qui distingue un planificateur d'un post-it ; un plan qui produit trois lignes `rice` n'a pas fini. Si ta sortie de fusion montre des doublons, tu comptes dans une liste, pas un dict (voir la correction de l'étape 4).
- **Math par portion ignorée.** Une recette est `servings: 4` ; le plan traite les repas comme des recettes entières. Des décisions comme « manger la moitié du curry » nécessitent un nombre de portions explicite par entrée de plan — construis le créneau dans le modèle de plan *avant* d'en avoir besoin, ou accepte les totaux plat-entier comme défaut documenté.
- **Dérive des noms d'ingrédients.** `"rice"` dans quatre recettes est un plaisir à fusionner ; `"rice "`, `"Rice"` et `"basmati rice"` sont trois articles séparés. La vraie correction est une liste canonique d'ingrédients que chaque recette référence (une clé étrangère, même en CSV), et une étape de normalisation au moment du chargement (strip + minuscules) comme version économique.

## Ce que tu viens de construire

Un planificateur de repas fonctionnel : une base de quatre recettes, un plan de sept jours, des totaux quotidiens de calories et de protéines, et une liste de courses fusionnée où `rice x3` signifie *une seule* ligne d'achat honnête. La compétence transférable est tout le pipeline « planifier → dériver → rapporter » : tu gardes une petite source de vérité (les recettes), tu prends une décision (la semaine), et tu calcules chaque sortie (totaux, liste de courses) à partir de ces deux-là — rien de périmé, rien de maintenu à la main. Cette même forme couvre la préparation des repas, les budgets, les plannings d'équipe et à peu près toute tâche « entrées répétables, rapport dérivé » que tu rencontreras.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/meal-planner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meal-planner) dans le dépôt du cours regroupe les bases et un notebook qui exécute bâtir → totaux → liste de courses cellule par cellule. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et lance le pipeline dans un onglet du navigateur.
:::

## Où aller à partir d'ici

- Ajoute la conscience des portions : une entrée de plan comme `("Veggie curry", 2)` qui met les ingrédients à l'échelle et double ou divise la nutrition par deux — la multiplication unique de l'étape 3 rendue réelle.
- Suis le coût des courses : donne à chaque ingrédient un prix par unité, et imprime un total pour la semaine — une seconde dérivation accrochée aux mêmes données.
- Ajoute une fonctionnalité de semaine aléatoire : `plan --random` choisit sept recettes (sans répétition, ou délibérément homogénéisées sur les jours ouvrés) et imprime instantanément le plan dérivé.
- Porte la base vers JSON au lieu de CSV — `json.load` garde les nombres typés gratuitement et gère les ingrédients contenant des virgules sans casse-tête de citation, et c'est un échange de cinq minutes maintenant que le chargeur a déjà un schéma stable.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier — un plan de semaine, une liste de courses, une base de recettes avec laquelle tu cuisines vraiment ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README guide l'ajout du tien via une **pull request** du début à la fin : fork, branche, commit et ouverture de la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓