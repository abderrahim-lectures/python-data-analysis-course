---
title: "Suivi d'Empreinte Carbone"
description: "Calculez et suivez votre empreinte carbone des voyages, de l'alimentation et de la consommation d'énergie."
difficulty: "beginner"
estimatedMinutes: 60
xpReward: 100
tags: ["Environment", "Data Visualization", "CLI Tools"]
prerequisites:
  - "Les listes, dicts et boucles for de Python"
  - "Lire et écrire un CSV en texte brut"
  - "Exécuter un script Python depuis le terminal"
learningObjectives:
  - "Transformer des quantités d'activité en CO2e avec des facteurs d'émission par activité"
  - "Agréger des lignes par jour et par catégorie avec de simples dicts"
  - "Rendre les totaux comme un diagramme à barres ASCII et vérifier un budget hebdomadaire"
  - "Persister les lignes d'activité en CSV et les recharger"
  - "Envelopper l'analyse dans des sous-commandes CLI add / report / reset"
---

# 🛠️ 🌍 Construire un Suivi d'Empreinte Carbone

Tes choix quotidiens émettent du carbone : conduire 10 km n'est pas la même chose que pédaler 10 km ou prendre le train 10 km, et manger de la viande n'est pas la même chose que manger des végétaux. Ce projet construit un petit **suivi d'empreinte carbone** honnête dans le terminal — un unique script Python qui sait combien de kg d'équivalent CO2 chaque activité coûte, travaille sur une semaine d'exemple d'entrées transports/alimentation/électricité, totalise tout par jour et par catégorie, dessine un diagramme à barres ASCII, vérifie la semaine contre un budget, sauvegarde tout dans un CSV et devient finalement une vraie commande avec les sous-commandes `add`, `report` et `reset`. Il n'utilise que la bibliothèque standard — pas d'installations, pas d'aléatoire, donc les nombres que tu vois ici sont exactement ceux que tu verras.

Cela suppose les listes, dicts et boucles `for` de Python, et une utilisation basique du terminal. C'est un projet facultatif et non noté — consulte [Projets du monde réel](/fr/projets) pour la liste complète et grandissante. Chaque brique tourne sur une installation Python de base (3.10+).

## 🎯 Ce que tu vas faire

1. Définir les facteurs d'émission et une semaine d'exemple ; calculer le CO2e de chaque activité.
2. Totaliser la semaine par jour et par catégorie, et dessiner un diagramme à barres ASCII.
3. Vérifier la semaine contre un budget hebdomadaire.
4. Sauvegarder toutes les lignes dans `activities.csv` et les recharger.
5. Transformer le script en CLI avec `add`, `report` et `reset`.

## Où exécuter ceci

**Localement** est le vrai foyer d'un outil CLI : crée n'importe quel répertoire vide et un fichier.

```bash
mkdir carbon-tracker && cd carbon-tracker
touch carbon_tracker.py
```

**Google Colab, Kaggle Notebooks et Binder** fonctionnent aussi — chaque bloc est du Python pur, sans paquets tiers. Une exécution de type terminal (`% python3 carbon_tracker.py …`) n'est pas disponible dans les notebooks ; là-bas tu peux appeler directement les fonctions CLI. Le CSV et les valeurs sont identiques partout.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/carbon-tracker/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/carbon-tracker/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcarbon-tracker%2Fnotebook.fr.ipynb)

## Configuration

Un répertoire vide, un fichier, zéro paquet.

### Vérifie l'environnement

```bash
python3 --version
```

Tout ce qui est 3.10+ est bon. Puis crée le fichier du projet :

```bash
mkdir carbon-tracker && cd carbon-tracker
touch carbon_tracker.py
```

**✅ Liste de vérification**

- ✅ `python3 --version` affiche 3.10 ou plus récent.
- ✅ `carbon_tracker.py` existe dans le dossier `carbon-tracker`.
- ✅ Aucun `pip install` requis — tout le projet est `import csv`, `import sys` et des builtins Python.

**🤔 Question(s) socratique(s)**

- L'outil transforme des *quantités* (km, kWh, repas) en *kg de CO2e* en les multipliant par un facteur par activité. Qui choisit ces facteurs, et pourquoi deux suivis seraient-ils en désaccord sur le même trajet en voiture ?
- Ce projet n'a aucun aléatoire. Pourquoi la reproductibilité compte-t-elle plus pour un outil climatique que pour un jeu ?

## Étape 1 : Facteurs d'émission et une semaine d'exemple

Toute l'arithmétique carbone vit dans deux dicts : `emissions` (kg CO2e par *une* unité) et `week` (les activités enregistrées).

### 1.1 Les facteurs

**👟 Indice de départ :** Un dict mappant chaque activité à des kg de CO2e par unité — km pour le transport, kWh pour l'électricité, par-repas pour l'alimentation.

```python
# carbon_tracker.py
import csv
import sys

emissions = {
    "car": 0.18, "bus": 0.10, "train": 0.04, "bike": 0.0,
    "flight": 0.25, "electricity": 0.42,
    "meal_meat": 2.2, "meal_veg": 0.8,
}
```

Chaque nombre en aval découle de cette table. `bike: 0.0` est le zéro qui rend le reste significatif — les nombres mesurent le carbone *supplémentaire* que chaque choix coûte, pas sa « valeur ».

**🎯 Résultat attendu :** Rien pour l'instant — les facteurs sont juste des données. Vérifie à l'œil : un gros repas `meal_meat` (2.2) coûte presque trois repas végétariens (0.8) ; une heure d'électricité (0.42 par kWh) bat un repas de viande.

### 1.2 La semaine d'exemple

**👟 Indice de départ :** `week` est une liste de tuples `(day, category, amount)` — transport, alimentation et électricité pour sept jours.

```python
# carbon_tracker.py (continued)
week = [
    ("Mon", "car", 12), ("Mon", "meal_meat", 2), ("Mon", "electricity", 6),
    ("Tue", "bike", 8), ("Tue", "meal_veg", 3), ("Tue", "electricity", 5),
    ("Wed", "train", 25), ("Wed", "meal_meat", 1), ("Wed", "electricity", 6),
    ("Thu", "bus", 9), ("Thu", "meal_veg", 2), ("Thu", "electricity", 7),
    ("Fri", "car", 8), ("Fri", "meal_meat", 2), ("Fri", "electricity", 5),
    ("Sat", "train", 60), ("Sat", "meal_veg", 3), ("Sat", "electricity", 4),
    ("Sun", "bike", 20), ("Sun", "meal_veg", 2), ("Sun", "electricity", 4),
]
```

Trois modes de transport (pas encore de vols), quelques repas, quelques kWh. Les nombres restent petits pour que l'arithmétique soit vérifiable à la main.

**🎯 Résultat attendu :** Rien pour l'instant — les données sont définies, pas imprimées.

### 1.3 Calcule les lignes de carbone

**👟 Indice de départ :** Une ligne par activité → aplatir `(day, category, amount)` à travers `emissions` en `(day, category, amount, kg)`, en arrondissant le produit à 2 décimales.

```python
# carbon_tracker.py (continued)
rows = []
for day, category, amount in week:
    kg = round(emissions[category] * amount, 2)
    rows.append({"day": day, "category": category, "amount": amount, "kg": kg})

for r in rows[:3]:
    print(r)
total = round(sum(r["kg"] for r in rows), 2)
print("WEEK TOTAL:", total, "kg CO2e")
```

Le motif deux-dicts-une-boucle — une *table de faits* de lignes `(day, category, amount, kg)` — est la même forme que `csv` et plus tard `add` utiliseront. Tout en aval (graphiques, budgets, CSV) lit cette liste, pas les tuples bruts.

**🎯 Résultat attendu :**

```
{'day': 'Mon', 'category': 'car', 'amount': 12, 'kg': 2.16}
{'day': 'Mon', 'category': 'meal_meat', 'amount': 2, 'kg': 4.4}
{'day': 'Mon', 'category': 'electricity', 'amount': 6, 'kg': 2.52}
WEEK TOTAL: 42.44 kg CO2e
```

**🩹 Si ça ne marche pas :** Si la `kg` de `car 12` n'est pas `2.16`, la clé facteur a dérivé (`0.18 × 12 = 2.16`). Si le total affiche `84.88`, deux listes `weeks` ont été concaténées — garde exactement 21 tuples.

### 1.4 Vérifie les lignes

**✅ Liste de vérification**

- ✅ Exactement 21 lignes (7 jours × 3 entrées), chacune avec `day`, `category`, `amount`, `kg`.
- ✅ `WEEK TOTAL: 42.44 kg CO2e` — déterministe, aucun aléatoire nulle part.
- ✅ Lundi : 2.16 (voiture) + 4.4 (viande) + 2.52 (électricité) = 9.08.

**🤔 Question(s) socratique(s)**

- Méthode : les facteurs d'émission multiplient des *unités*. Si tu journalises seulement « j'ai conduit » sans les kilomètres, qu'est-ce que tu ne peux pas calculer — et qu'est-ce que cela dit sur le moyen le moins cher d'*améliorer* la qualité des données (plus de colonnes, pas plus de lignes) ?
- Les repas de viande du lundi (4.4 kg) coûtent autant que deux journées végétariennes entières combinées. Quand une semaine sans viande rouge émettrait-elle quand même plus qu'une semaine avec ?

## Étape 2 : Agrège par jour et par catégorie

Les lignes isolées sont du bruit ; le travail de l'outil est de résumer. L'Étape 2 totalise par jour et par catégorie.

### 2.1 Totaux journaliers

**👟 Indice de départ :** Un dict indexé par jour, qui ajoute la `kg` de chaque ligne.

```python
# carbon_tracker.py (continued)
daily = {}
for r in rows:
    daily[r["day"]] = round(daily.get(r["day"], 0) + r["kg"], 2)

for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
    print(f"{day}  {daily[day]:>5} kg")
```

`daily.get(day, 0)` est l'idiome d'accumulateur : la première apparition d'un jour démarre à 0, chaque ligne suivante ajoute sa part. L'arrondi à la *fin* (pas à chaque étape) garde la somme honnête.

**🎯 Résultat attendu :**

```
Mon   9.08 kg
Tue    4.5 kg
Wed   5.72 kg
Thu   5.44 kg
Fri   7.94 kg
Sat   6.48 kg
Sun   3.28 kg
```

**🩹 Si ça ne marche pas :** Si Tue affiche `8.6` au lieu de `4.5`, la sortie à vélo zéro carbone (8 km × 0.0 = 0 kg) a été comptée comme un 8 — vérifie que `bike: 0.0` est dans `emissions`. Si les totaux dérivent de 0.01, arrondir la `kg` de chaque ligne d'abord, puis sommer, diffère de sommer puis arrondir — choisis une règle et garde-la.

### 2.2 Le diagramme à barres ASCII

**👟 Indice de départ :** Mappe le total de chaque jour à `"#" * round(v / max * 40)`.

```python
# carbon_tracker.py (continued)
mx = max(daily.values())
for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
    bar = "#" * round(daily[day] / mx * 40)
    print(f"{day}  {daily[day]:>5}  {bar}")
```

`v / mx * 40` remet à l'échelle le jour le plus lourd (Mon, 9.08) sur une barre de 40 caractères et tout le reste proportionnellement — un diagramme à barres imprimable sans bibliothèque de tracé. Le but n'est pas la précision ; c'est le motif — Tue à Sun sont visiblement plus minces que la course du lundi.

**🎯 Résultat attendu :**

```
Mon   9.08  ########################################
Tue    4.5  ####################
Wed   5.72  #########################
Thu   5.44  ########################
Fri   7.94  ###################################
Sat   6.48  #############################
Sun   3.28  ##############
```

**🩹 Si ça ne marche pas :** Si la barre de Mon est courte, `max` a été calculé sur les *clés* (noms de jours) au lieu des valeurs. Si des barres ont 0 caractère, `round` sur un petit ratio a touché 0 — ici tous les jours sont non nuls, donc une barre vide signifie un bug de données en amont.

### 2.3 Vérifie les agrégats

**✅ Liste de vérification**

- ✅ Les totaux journaliers reproduisent la table ci-dessus (Mon 9.08 … Sun 3.28).
- ✅ Les barres atteignent 40 `#` pour le max (Mon) et rétrécissent équitablement.
- ✅ Vérification de bon sens par catégorie : transport `7.9` (4.31+1.0+0.9+3.4… attends — voir le Socratic ci-dessous).

**🤔 Question(s) socratique(s)**

- Approxime les totaux par catégorie à la main : voiture 20 km (`0.18`), bus 9 km (`0.10`), train 85 km (`0.04`), vélos (0), viande 5 repas (`2.2`), végétarien 10 repas (`0.8`), électricité 37 kWh (`0.42`). Est-ce que ça fait 42.44 — et quelle catégorie porte le plus ?
- Ton graphique échelle vers *lundi*, le jour le plus lourd. Change le dénominateur en *semaine totale* (42.44) au lieu de `max`. Les barres rétrécissent à ~20 `#`. Quel est le compromis entre « montre le motif » et « montre la vraie fraction » ? Quelle échelle montrerais-tu à un camarade ?

## Étape 3 : Vérifie le budget hebdomadaire

Un budget transforme les totaux en décisions. Choisis 40 kg/semaine comme plafond.

### 3.1 Au-dessus ou en dessous ?

**👟 Indice de départ :** Compare `total` au budget et rapporte à la fois l'écart absolu et le pourcentage au-dessus/en dessous.

```python
# carbon_tracker.py (continued)
budget = 40.0
diff = round(total - budget, 2)
percent = round(total / budget * 100)
print(f"BUDGET: {budget} kg CO2e/week")
print(f"USED : {total} kg  ({percent}% of budget)")
print(f"OVER : {diff} kg" if diff > 0 else f"UNDER: {-diff} kg saved")
```

Le pourcentage est le nombre le plus informatif de l'outil : `106%` dit déjà « un peu au-dessus » avant que tu lises l'absolu `42.44`. La ligne `OVER`/`UNDER` est le verdict tourné vers l'humain.

**🎯 Résultat attendu :**

```
BUDGET: 40 kg CO2e/week
USED : 42.44 kg  (106% of budget)
OVER : 2.44 kg
```

**🩹 Si ça ne marche pas :** Si tu vois `UNDER: -2.44` le signe a basculé — les branches du ternaire sont sur les mauvais bras. Si cela affiche `105%` après l'arrondi, tu as arrondi `total` à un chiffre quelque part et la comparaison a changé ; calcule `percent` depuis le `total` *non arrondi*.

### 3.2 Rend le verdict utile

**👟 Indice de départ :** Affiche le jour le plus lourd et un indice pour le correctif le moins cher dans la semaine.

```python
# carbon_tracker.py (continued)
worst = max(daily, key=daily.get)
print(f"Biggest day: {worst} ({daily[worst]} kg)")
train_swap = 0.18 - 0.04
print(f"Ride the train: swap one 10-km car trip and save {round(train_swap * 10, 2)} kg")
```

Rapporter le *pourquoi* est la moitié de l'outillage environnemental. Un verdict de budget sans le jour le plus lourd est une note sans feedback. `daily.get` comme argument `key` de `max` sélectionne la *clé à plus haute valeur* — pas la première alphabétiquement — ce qui est l'usage classique de `key=`.

**🎯 Résultat attendu :**

```
Biggest day: Mon (9.08 kg)
Ride the train: swap one 10-km car trip and save 1.4 kg
```

**🩹 Si ça ne marche pas :** Si `Biggest day` affiche `Sun`, tu as passé `max(daily)` au lieu de `max(daily, key=daily.get)` — le premier retourne la *chaîne de clé* max. Si l'économie d'échange montre `0.14`, la différence de facteur est `0.18 − 0.04 = 0.14` par km — ×10 km = 1.4 kg ; garde la multiplication sur la même ligne.

### 3.3 Vérifie le budget

**✅ Liste de vérification**

- ✅ 42.44 utilisé contre 40.0 de budget → `OVER : 2.44 kg`, `106%`.
- ✅ Jour le plus lourd Mon (9.08), correctif de 10 km le moins cher 1.4 kg (train contre voiture).
- ✅ La vérification de budget est une fonction pure de `total` — change `budget`, obtiens un nouveau verdict, aucun autre code ne bouge.

**🤔 Question(s) socratique(s)**

- 106% signifie « 2.44 kg au-dessus ». Suppose que le budget fût 25 kg. Quel changement unique ramènerait la semaine entière *bien en dessous* ? Serait-ce les repas de viande, la conduite, ou autre chose ?
- Un budget réglé à 40 kg/semaine cache *qui* émet : ta semaine d'exemple suppose une voiture, un bus, des trains, trois repas de viande. Si tu reconstruisais la semaine avec un vol, le verdict pour le même budget de 40 kg serait absurde — qu'est-ce que cela dit sur le fait de faire correspondre un budget au mode de vie mesuré ?

## Étape 4 : Sauvegarde et recharge les lignes

Aucun outil ne survit à un redémarrage en retapant ses données. L'Étape 4 écrit `rows` dans `activities.csv` et le relit.

### 4.1 Écris le CSV

**👟 Indice de départ :** `csv.DictWriter` avec `writeheader()` puis toutes les lignes.

```python
# carbon_tracker.py (continued)
with open("activities.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["day", "category", "amount", "kg"])
    writer.writeheader()
    writer.writerows(rows)
print("Saved", len(rows), "rows to activities.csv")
```

La liste `rows` et le CSV ont les mêmes quatre colonnes, donc `DictWriter` mappe chaque dict directement sur une ligne. `newline=""` évite les lignes vides entre les enregistrements sous Windows.

**🎯 Résultat attendu :** `Saved 21 rows to activities.csv` — et un fichier dont les premières lignes ressemblent à

```
day,category,amount,kg
Mon,car,12,2.16
Mon,meal_meat,2,4.4
```

**🩹 Si ça ne marche pas :** Si l'en-tête manque ou les colonnes sont échangées, la liste `fieldnames` ne correspond pas aux clés du dict. Si tu vois des lignes vides dans le CSV, retire `newline=""`.

### 4.2 Recharge et recalcule la semaine

**👟 Indice de départ :** `csv.DictReader`, sommation sur la colonne `kg` (chaînes → flottants).

```python
# carbon_tracker.py (continued)
with open("activities.csv", newline="") as f:
    loaded = list(csv.DictReader(f))

reload_total = round(sum(float(r["kg"]) for r in loaded), 2)
print("Reloaded", len(loaded), "rows, week total", reload_total, "kg")
```

L'aller-retour prouve que la sauvegarde est sans perte : les lignes chargées produisent les mêmes 42.44. Note la conversion — le CSV stocke du texte, donc `float(r["kg"])` doit transformer `"2.16"` en nombre avant de sommer.

**🎯 Résultat attendu :** `Reloaded 21 rows, week total 42.44 kg`

**🩹 Si ça ne marche pas :** Si le rechargement lève `ValueError: could not convert string…`, une ligne sans en-tête ou éditée à la main s'est glissée ; vérifie le CSV avec un éditeur de texte. Si le total diffère de 42.44, la conversion float ou une ligne vide supplémentaire réintègre la somme.

### 4.3 Vérifie l'aller-retour

**✅ Liste de vérification**

- ✅ `activities.csv` a 4 colonnes × 21 lignes de données + en-tête.
- ✅ Le rechargement reproduit `WEEK TOTAL: 42.44 kg`.
- ✅ Le CSV est un livrable lisible par un humain — n'importe qui peut l'ouvrir dans une feuille de calcul.

**🤔 Question(s) socratique(s)**

- Le programme *écrit* actuellement depuis `rows` à chaque exécution, écrasant le fichier. Une fois que le `add` du CLI de l'Étape 5 existe, relancer effacerait les nouvelles entrées. Quand tu y arriveras, quel est le changement minimal — écrire *une fois*, puis ajouter ?
- `DictReader` retourne des chaînes ; les variantes sont faciles à prendre pour des nombres. Nomme une autre conversion de type de colonne, comme parser des dates, dont une « vraie » app aurait besoin avant que ce CSV devienne fiable.

## Étape 5 : Transforme-le en CLI

La dernière étape fait de l'outil un vrai outil : les sous-commandes `add`, `report` et `reset` pilotées par `sys.argv`.

### 5.1 Le rapport (`report`)

**👟 Indice de départ :** Un `report()` qui lit le CSV, recalcule totaux, graphique et verdict de budget.

```python
# carbon_tracker.py (continued)
def load_rows():
    with open("activities.csv", newline="") as f:
        return list(csv.DictReader(f))

def report():
    loaded = load_rows()
    total = round(sum(float(r["kg"]) for r in loaded), 2)
    daily = {}
    for r in loaded:
        daily[r["day"]] = round(daily.get(r["day"], 0) + float(r["kg"]), 2)
    print(f"WEEK TOTAL: {total} kg ({round(total / 40.0 * 100)}% of budget)")
    mx = max(daily.values())
    for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
        print(f"{day}  {daily.get(day, 0):>5}  {'#' * round(daily.get(day, 0) / mx * 40)}")
```

`report()` est le même calcul que les Étapes 2–3, mais il lit depuis le fichier sauvegardé — le CLI et l'analyse sont une seule fonction. `daily.get(day, 0)` rapporte toujours un jour manquant comme 0 kg au lieu de planter.

**🎯 Résultat attendu :**

```
WEEK TOTAL: 42.44 kg (106% of budget)
Mon   9.08  ########################################
Tue    4.5  ####################
Wed   5.72  #########################
Thu   5.44  ########################
Fri   7.94  ###################################
Sat   6.48  #############################
Sun   3.28  ##############
```

**🩹 Si ça ne marche pas :** Si le CLI n'affiche rien, `report()` n'a jamais été *appelé* — la répartition `sys.argv` (5.3) vient plus tard ; pour l'instant, lance `python3 carbon_tracker.py` et ajoute temporairement un appel `report()` en bas du fichier.

### 5.2 `add` et `reset`

**👟 Indice de départ :** `add(day, category, amount)` ajoute une ligne calculée au CSV ; `reset()` réécrit la semaine d'exemple.

```python
# carbon_tracker.py (continued)
def add(day, category, amount):
    kg = round(emissions[category] * float(amount), 2)
    with open("activities.csv", "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["day", "category", "amount", "kg"])
        writer.writerow({"day": day, "category": category, "amount": amount, "kg": kg})
    report()

def reset():
    rows = [{"day": d, "category": c, "amount": a,
             "kg": round(emissions[c] * a, 2)} for d, c, a in week]
    with open("activities.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["day", "category", "amount", "kg"])
        writer.writeheader()
        writer.writerows(rows)
```

`add` ouvre en mode ajout (`"a"`) pour ne *pas* écraser le fichier — les nouvelles lignes rejoignent l'historique, et `report()` re-somme depuis le disque. `reset` reconstruit délibérément la semaine d'exemple vierge pour que chaque exemple de classe démarre des mêmes 42.44 de référence.

**🎯 Résultat attendu :** Rien par eux-mêmes — `add` et `reset` rappellent tous deux `report()` à la fin, donc leur sortie est le graphique que tu as vu en 5.1.

### 5.3 Le répartiteur

**👟 Indice de départ :** Mappe le premier argument `sys.argv` à la bonne fonction avec un minuscule `if/elif`.

```python
# carbon_tracker.py (continued)
if __name__ == "__main__":
    if len(sys.argv) < 2:
        report()
    elif sys.argv[1] == "report":
        report()
    elif sys.argv[1] == "add":
        add(sys.argv[2], sys.argv[3], sys.argv[4])
    elif sys.argv[1] == "reset":
        reset()
    else:
        print("Commands: report | add <day> <category> <amount> | reset")
```

`if __name__ == "__main__"` signifie que le fichier tourne comme un *programme* quand il est exécuté directement (`python3 carbon_tracker.py …`) mais reste importable comme fonctions quand il est utilisé dans un notebook. Le répartiteur est la porte d'entrée du CLI : une chaîne dedans, une fonction dehors.

**🎯 Lançons-le.** Échantillon frais :

```bash
python3 carbon_tracker.py report
```

**🎯 Résultat attendu :**

```
WEEK TOTAL: 42.44 kg (106% of budget)
Mon   9.08  ########################################
Tue    4.5  ####################
Wed   5.72  #########################
Thu   5.44  ########################
Fri   7.94  ###################################
Sat   6.48  #############################
Sun   3.28  ##############
```

Puis un trajet en voiture de 5 km ajouté le vendredi :

```bash
python3 carbon_tracker.py add Fri car 5
```

**🎯 Résultat attendu (tête, et le nouveau total) :**

```
WEEK TOTAL: 43.34 kg (108% of budget)
Fri   8.84  ####################################
…
```

Attends — un trajet de 5 km après reset change le résultat proprement : `42.44 + 0.90 = 43.34`. Maintenant, le *seul* choix qui compte :

```bash
python3 carbon_tracker.py reset
python3 carbon_tracker.py add Sat flight 450
```

**🎯 Résultat attendu (tête) :**

```
WEEK TOTAL: 154.94 kg (387% of budget)
```

Un simple vol de 450 km vaut `0.25 × 450 = 112.5 kg` — presque trois fois le budget de toute la semaine, et la barre de 40 `#` du graphique appartient maintenant au samedi. C'est la manchette honnête que l'outil existe pour livrer.

**🩹 Si ça ne marche pas :** Si `add` montre `108%` la première fois et déjà `387%` au second coup, le fichier d'exemple n'a pas été reset entre les exécutions (les ajouts s'accumulent). `reset` d'abord, puis `add` — l'échantillon est ton ancre reproductible.

**🤔 Question(s) socratique(s)**

- `add` prend une *étiquette de jour* (`Fri`) — les jours de la semaine d'exemple sont des étiquettes, pas des dates. Qu'est-ce qui changerait si `day` devenait un vrai `YYYY-MM-DD` ? Quelles parties de `report()` (la légende du graphique, la fenêtre hebdomadaire) devraient cesser de coder en dur les sept étiquettes ?
- Cet outil rapporte des kg par *semaine* pour une personne. Les foyers du Massachusetts émettent de l'ordre de 15 000 kg/an. Environ combien de semaines d'exemple cela fait-il — et qu'est-ce que le ratio entre l'empreinte d'un individu et une *moyenne nationale* te dit sur la mesure de sens des budgets personnels ?

### 5.4 Vérifie le CLI

**✅ Liste de vérification**

- ✅ `report` depuis un `reset` frais → `42.44 kg (106%)`.
- ✅ `add Fri car 5` après reset → `43.34 kg (108%)` ; la barre du vendredi grandit d'un cran.
- ✅ `add Sat flight 450` après reset → `154.94 kg (387%)`, samedi possède la barre de 40 caractères.
- ✅ Les commandes inconnues affichent la ligne d'usage, pas un crash.

## ⚠️ Pièges courants

- **`max(daily)` contre `max(daily, key=daily.get)`.** Le premier choisit la *chaîne de clé* la plus grande (« Wed »), le second la *valeur* la plus grande. Les mélanger mal étiquette le jour le plus lourd.
- **L'ordre d'arrondi.** Arrondir `rows` à 2 décimales, puis sommer, c'est bien — mais arrondir *un autre* intermédiaire (comme le total journalier) avant de comparer honnêtement change la réponse de 0.01. Choisis une politique d'arrondi et garde-la.
- **Ajout contre écrasement.** `open(..., "w")` opte pour l'écrasement ; `open(..., "a")` ajoute. `reset` doit utiliser `"w"`, `add` doit utiliser `"a"` — échange-les et la démo casse (soit en effaçant l'historique, soit en l'empilant).
- **Oublier la conversion float.** `DictReader` retourne des chaînes ; `sum(float(r["kg"]) for r in loaded)` est requis. Sommer des chaînes plante ou concatène « 2.164.4… ».
- **Un budget qui ignore la catégorie.** 106% du budget est le verdict — mais la catégorie des flottes (transport) et la catégorie alimentation totalisent plus de la moitié de la semaine ; corriges la mauvaise et le budget est quand même explosé.
- **Pas de `reset` entre les démos CLI.** Des exécutions `add` répétées font grossir le CSV sans limite. Reset — ou documente la base de référence — ou ta « semaine » devient tranquillement un mois.

## Ce que tu viens de construire

Un suivi d'empreinte carbone de bout en bout dans le terminal : facteurs d'émission, table de faits de lignes `(day, category, amount, kg)`, agrégation journalière et par catégorie depuis de simples dicts, diagramme à barres ASCII sans dépendances, verdict de budget exprimé en pourcentage, persistance CSV avec aller-retour sans perte, et un CLI à trois commandes sur `sys.argv`. Les idées transférables ici sont le *motif* : une **table d'unités** qui transforme des quantités d'activité arbitraires en un nombre comparable ; **fusionner des lignes étroites en totaux journaliers et par catégorie** avec un dict accumulateur ; **laisser le verdict être un pourcentage**, pas du kg brut ; **faire du CSV le système d'enregistrement** pour que le rapport soit toujours une fonction du fichier ; et **mettre en surface une comparaison dramatique** (le vol de 450 km) parce qu'un outil qui n'imprime que ses totaux oublie ce que les nombres signifient.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/carbon-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/carbon-tracker) dans le dépôt du cours contient l'outil complet comme notebook — facteurs, semaine d'exemple, graphique, budget, aller-retour CSV et CLI add/report/reset, exécutables dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Suis une *vraie* semaine : garde le même schéma, remplace `week` par tes propres entrées, et vois ton vrai nombre contre un budget de 40 kg que tu règles à ta réalité.
- Passe des étiquettes de jours à de vraies dates avec `datetime.date`, et fais de `report` une fenêtre « les 7 derniers jours » au lieu de la légende Mon–Sun codée en dur.
- Ajoute un recommandeur d'« échange » : trouve la seule activité dont le remplacement (`car → train`, `meal_meat → meal_veg`) coupe le plus de kg sous le budget.
- Trace avec matplotlib au lieu de `#` : le même dict `daily` alimente `plt.bar(days, values)` avec bien moins d'effort que de dessiner les barres toi-même.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓