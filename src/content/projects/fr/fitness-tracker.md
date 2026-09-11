---
title: "Suivi de Forme"
description: "Suivez les entraînements, la nutrition et les métriques de santé avec visualisation des progrès et fixation d'objectifs."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["classes", "pandas", "matplotlib", "data-analysis"]
learningObjectives:
  - "Modéliser des exercices et des repas comme des dataclasses avec propriétés dérivées"
  - "Enregistrer des séances d'entraînement complètes et calculer le volume d'entraînement total"
  - "Suivre la nutrition quotidienne avec les totaux de macros et la répartition calorique"
  - "Rouler un historique dans pandas et calculer une moyenne mobile"
  - "Tracer les tendances du poids corporel et du volume d'entraînement côte à côte"
prerequisites: ["Les bases de Python (classes, dictionnaires, listes)", "pip install pandas matplotlib"]
---

# 🛠️ 💪 Construis un Suivi de Forme

Un journal d'entraînement est le projet d'analyse de données le plus simple qui soit : tu collectes des nombres chaque jour, et la partie intéressante est de les regarder changer au fil du temps. Ce projet construit cette boucle à partir de zéro — tu modéliseras les exercices et les repas comme des dataclasses typées, tu enregistreras les séances et calculeras le volume d'entraînement, tu suivras les macros et les pourcentages de calories, tu rouleras le tout dans un DataFrame pandas et tu traceras côte à côte les tendances de poids et de force avec matplotlib. Aucune clé API, aucun identifiant, aucun service externe : juste tes propres données structurées et une séquence de questions de plus en plus intelligentes à leur sujet.

Ce projet suppose que tu maîtrises Python 101 et que tu as une familiarité de base avec les listes et les dicts — rien de la formation Data Analysis n'est requis. Il est facultatif et non noté ; consulte [Real-World Projects](/fr/projets) pour la liste complète, qui ne cesse de s'allonger.

## 🎯 Ce que tu vas faire

1. Modéliser les exercices et les repas individuels comme des types `@dataclass` avec une propriété `volume` qui calcule le poids total soulevé.
2. Enregistrer une séance d'entraînement complète — une liste d'exercices — et calculer le volume et la durée totaux.
3. Suivre les repas d'une journée, additionner les totaux de macros et calculer le pourcentage de calories que chaque macro contribue.
4. Rouler ton historique quotidien dans un `DataFrame` pandas et calculer une moyenne mobile.
5. Tracer les tendances du poids corporel et du volume d'entraînement côte à côte dans une figure matplotlib à deux panneaux.

## Où exécuter ceci

**Localement avec `uv`** est le chemin principal, recommandé — `pandas` et `matplotlib` sont tous deux des installations Python pures, et tout vrai terminal rendra les graphiques et sauvegardera les PNG.

**GitHub Codespaces** fonctionne parfaitement aussi : ouvre [le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute de là. Tout se comporte à l'identique.

**Google Colab, Kaggle Notebooks et Binder sont réellement bien adaptés à ce projet** — rien ici ne dépend de polices système, de binaires externes ou d'un système de fichiers local. Le notebook ci-dessous utilise la même semaine synthétique de données que les étapes construisent, donc les DataFrames `pandas` et les graphiques matplotlib se rendent en ligne avec zéro configuration. C'est l'un des projets qui s'intègrent réellement proprement au modèle notebook, de bout en bout.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/fitness-tracker/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/fitness-tracker/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffitness-tracker%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin est deux bibliothèques PyPI — aucun binaire externe, aucune clé API.

### Installe `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets » — il peut installer et gérer lui-même les versions de Python, aux côtés des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme l'installation :

```bash
uv --version
```

### Configure le projet

```bash
uv init fitness-tracker
cd fitness-tracker
uv add pandas matplotlib
```

`pandas` te donne le `DataFrame` — la structure adaptée aux données tabulaires et de séries temporelles — et `matplotlib` dessine les graphiques. Tout ce qui suit est du pur Python plus ces deux bibliothèques.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `fitness-tracker/` existe avec un `pyproject.toml`, et `pandas` et `matplotlib` sont installés.

## Étape 1 : Modélise les exercices et les repas comme des dataclasses

Chaque exercice a la même forme : un nom, un nombre de séries, de répétitions, un poids et une durée optionnelle. Un `@dataclass` impose cette forme et te donne une propriété `volume` calculée — le poids total soulevé dans une série — pour que tu ne le recalculés jamais à la main.

### 1.1 Définit Exercise et Meal

**👟 Indice de départ :** Utilise `@dataclass` avec un `@property` pour `volume` (séries × répétitions × poids), et écris une méthode `summary()` lisible par un humain sur chaque classe pour l'affichage.

```python
# fitness_tracker.py
from datetime import date
from dataclasses import dataclass

@dataclass
class Exercise:
    name: str
    sets: int
    reps: int
    weight_kg: float
    duration_min: int = 0

    @property
    def volume(self) -> float:
        """Total weight lifted: sets × reps × weight."""
        return self.sets * self.reps * self.weight_kg

    def summary(self) -> str:
        return f"{self.name}: {self.sets}x{self.reps} @ {self.weight_kg}kg (vol: {self.volume:.0f})"

@dataclass
class Meal:
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

    def summary(self) -> str:
        return f"{self.name}: {self.calories} kcal (P:{self.protein_g}g C:{self.carbs_g}g F:{self.fat_g}g)"

bench = Exercise("Bench Press", sets=4, reps=8, weight_kg=60)
print(bench.summary())
print(f"Volume: {bench.volume:.0f} kg")

chicken = Meal("Grilled Chicken", calories=350, protein_g=40, carbs_g=5, fat_g=10)
print(chicken.summary())
```

`volume` comme `@property` plutôt qu'une méthode régulière signifie que tu écris `bench.volume`, pas `bench.volume()` — la différence d'appel avec parenthèses est cosmétique, mais le motif `@property` signale « ceci est un fait dérivé de l'état actuel, pas une commande qui fait quelque chose ». Les deux méthodes `summary()` sont des méthodes régulières car elles produisent une *chaîne d'affichage*, qui est un service, pas une propriété — la distinction de nom garde l'API prévisible.

**🎯 Résultat attendu :** Affiche `Bench Press: 4x8 @ 60kg (vol: 1920)` suivi de `Volume: 1920 kg`, puis `Grilled Chicken: 350 kcal (P:40g C:5g F:10g)`.

**🩹 Si ça ne marche pas :** Si `volume` affiche `0.0` malgré des entrées non nulles, tu l'appelles avec `()` — c'est une propriété, donc des parenthèses appelleraient le getter de la propriété et *renverraient* la valeur, mais imprimer le résultat est très bien. L'erreur est `volume = sets * reps * weight` dans le corps de la classe sans décorateur `@property` — vérifie que la ligne `@property` est directement au-dessus de `def volume`.

### 1.2 Vérifie les modèles

**✅ Liste de vérification**

- ✅ Les instances `Exercise` et `Meal` se construisent proprement et `volume` calcule le bon produit.
- ✅ Tu peux expliquer pourquoi `@property` est le bon choix pour `volume` et une méthode régulière pour `summary()`.

**🤔 Question(s) socratique(s)**

- Si tu stockais `volume` comme un attribut régulier (calculé dans `__post_init__`) au lieu d'un `@property`, que se passe-t-il quand tu changes `sets` ou `weight_kg` après la construction — et cela importe-t-il pour ce projet ?
- `Exercise` a `duration_min: int = 0` avec une valeur par défaut, tandis que `name` n'a pas de défaut. Pourquoi `duration_min` doit-il venir après `name` dans la liste de champs, et quelle règle Python l'impose ?

## Étape 2 : Enregistre les séances d'entraînement

Un exercice est un mouvement unique ; une séance d'entraînement est une collection d'exercices faits un seul jour. La classe `WorkoutSession` enveloppe cette collection et calcule le volume et la durée totaux du jour — les deux premiers nombres qui valent la peine d'être suivis dans le temps.

### 2.1 Définit WorkoutSession

**👟 Indice de départ :** Stocke les exercices dans une simple liste, et calcule `total_volume()` comme une somme de la propriété `volume` de chaque exercice — pas besoin de boucles si tu utilises une expression génératrice.

```python
# fitness_tracker.py (continued)
class WorkoutSession:
    def __init__(self, session_date: str | None = None):
        self.date = session_date or date.today().isoformat()
        self.exercises: list[Exercise] = []

    def add_exercise(self, exercise: Exercise) -> None:
        self.exercises.append(exercise)
        print(f"  + {exercise.summary()}")

    def total_volume(self) -> float:
        return sum(ex.volume for ex in self.exercises)

    def duration(self) -> int:
        return sum(ex.duration_min for ex in self.exercises)

    def display(self) -> str:
        lines = [f"Workout — {self.date}", "-" * 40]
        for ex in self.exercises:
            lines.append(f"  {ex.summary()}")
        lines.append(f"  Total volume: {self.total_volume():.0f} kg")
        lines.append(f"  Total duration: {self.duration()} min")
        return "\n".join(lines)

session = WorkoutSession("2025-01-13")
session.add_exercise(Exercise("Bench Press", 4, 8, 60, 15))
session.add_exercise(Exercise("Overhead Press", 3, 10, 30, 10))
session.add_exercise(Exercise("Lateral Raise", 3, 15, 10, 8))
print(session.display())
```

`session_date or date.today().isoformat()` est un défaut pratique : chaque séance est horodatée, mais tu peux le remplacer pour remplir un journal à partir d'un jour précis. `sum(ex.volume for ex in self.exercises)` est une expression génératrice qui évite de construire une liste intermédiaire — pour trois exercices, cela n'a pas d'importance, mais c'est la bonne forme quand tu en as des dizaines et que tu veux que le surcoût mémoire soit nul.

**🎯 Résultat attendu :** Affiche chaque exercice au fur et à mesure qu'il est ajouté, puis un résumé montrant le volume total (`1920 + 900 + 450 = 3270 kg`) et la durée totale (`15 + 10 + 8 = 33 min`).

**🩹 Si ça ne marche pas :** Si `total_volume()` est `0.0` malgré de vrais exercices, les exercices ont été ajoutés à une liste différente (vérifie que tu utilises `self.exercises`, pas une variable locale). Si `display()` s'exécute mais ne montre aucun exercice, `add_exercise` n'a jamais été appelé entre la construction de `session` et l'appel à `display()` — les exercices sont ajoutés manuellement, pas magiquement.

### 2.2 Vérifie la séance

**✅ Liste de vérification**

- ✅ `session.total_volume()` renvoie 3270,0 et `session.duration()` renvoie 33.
- ✅ La sortie `display()` inclut les trois exercices, leurs volumes individuels et les totaux.

**🤔 Question(s) socratique(s)**

- Si tu enregistrais le *même* exercice deux fois (double ajout), `total_volume()` le compterait deux fois en silence. Quelle simple garde pourrais-tu ajouter à l'intérieur de `add_exercise` pour empêcher les doublons exacts, et quand cette garde serait-elle *fausse* (c'est-à-dire que tu veux réellement enregistrer le même exercice deux fois) ?
- `duration_min` est par défaut à `0` pour les exercices où tu ne suis que les séries et les répétitions. `total_volume()` devrait-il quand même compter la durée comme part de l'« effort » d'un entraînement — et si oui, comment changerais-tu le calcul ?

## Étape 3 : Suis la nutrition quotidienne

Un entraînement te dit combien tu as soulevé ; la nutrition te dit ce que tu construis avec. Un `DailyLog` collecte tous les repas du jour et calcule les calories totales plus la répartition protéines/glucides/graisses — le pourcentage macro de chaque source calorique, en tenant compte du fait que les protéines et les glucides font 4 kcal/g tandis que les graisses font 9.

### 3.1 Définit DailyLog

**👟 Indice de départ :** `totals()` additionne les quantités brutes en grammes de tous les repas ; une nouvelle méthode `macro_split()` convertit les grammes en calories en utilisant les facteurs 4/4/9, puis divise par le total pour obtenir des pourcentages.

```python
# fitness_tracker.py (continued)
class DailyLog:
    def __init__(self, log_date: str | None = None):
        self.date = log_date or date.today().isoformat()
        self.meals: list[Meal] = []

    def add_meal(self, meal: Meal) -> None:
        self.meals.append(meal)
        print(f"  + {meal.summary()}")

    def totals(self) -> dict:
        return {
            "calories": sum(m.calories for m in self.meals),
            "protein": sum(m.protein_g for m in self.meals),
            "carbs": sum(m.carbs_g for m in self.meals),
            "fat": sum(m.fat_g for m in self.meals),
        }

    def macro_split(self) -> dict:
        """Percentage of total calories coming from protein, carbs, and fat."""
        grams = self.totals()
        by_macro_cal = {
            "protein": grams["protein"] * 4,
            "carbs":   grams["carbs"]   * 4,
            "fat":     grams["fat"]     * 9,
        }
        total_cal = sum(by_macro_cal.values()) or 1
        return {k: round(v / total_cal * 100, 1) for k, v in by_macro_cal.items()}

    def display(self) -> str:
        t = self.totals()
        s = self.macro_split()
        lines = [f"Daily Log — {self.date}", "-" * 40]
        for m in self.meals:
            lines.append(f"  {m.summary()}")
        lines.append(f"  TOTAL: {t['calories']} kcal  |  P:{t['protein']}g  C:{t['carbs']}g  F:{t['fat']}g")
        lines.append(f"  SPLIT: P:{s['protein']}%  C:{s['carbs']}%  F:{s['fat']}%")
        return "\n".join(lines)

log = DailyLog("2025-01-13")
log.add_meal(Meal("Breakfast Oats", 300, 10, 50, 8))
log.add_meal(Meal("Grilled Chicken", 350, 40, 5, 10))
log.add_meal(Meal("Protein Shake", 120, 25, 5, 1))
print(log.display())
```

Le `or 1` dans `macro_split` empêche la division par zéro sur un journal vide — Python te permet d'ajouter des repas plus tard, donc le premier appel pourrait n'avoir aucune donnée. Les facteurs 4/4/9 sont les facteurs Atwater standard : les protéines et les glucides contribuent chacun 4 kilocalories par gramme, les graisses contribuent 9. Se tromper sur ces nombres (disons, 4/4/4) décale silencieusement les pourcentages, donc les facteurs sont écrits explicitement plutôt qu'enterrés dans une constante — pour trois nombres, la lisibilité bat l'abstraction.

**🎯 Résultat attendu :** Affiche trois repas au fur et à mesure qu'ils sont ajoutés, puis un total (`770 kcal | P:75g C:60g F:19g`) et une répartition macro (`P:39.0% C:31.2% F:29.8%`).

**🩹 Si ça ne marche pas :** Si les pourcentages de macros ne totalisent pas 100 %, l'arrondi est légèrement décalé — `round(..., 1)` peut produire 99,9 ou 100,1 selon les valeurs, ce qui est acceptable. Si `totals()` renvoie tous des zéros malgré les repas, `add_meal` n'a jamais été appelé — remonte aux appels `log.add_meal(...)`.

### 3.2 Vérifie le journal quotidien

**✅ Liste de vérification**

- ✅ `log.totals()` renvoie `calories: 770, protein: 75, carbs: 60, fat: 19`.
- ✅ Les pourcentages de `log.macro_split()` totalisent ~100 % et les protéines sont la plus grande part.

**🤔 Question(s) socratique(s)**

- Si tu ne mangeais que des graisses (0 g protéines, 0 g glucides, 100 g graisses), que renverrait `macro_split`, et pourquoi ce cas dégénéré vaut-il la peine d'être pensé avant qu'il ne se produise dans de vraies données ?
- `totals()` recalcule à chaque appel. Pour un `DailyLog` qui reçoit 20 repas ajoutés tout au long de la journée, la mise en cache du résultat en vaudrait-elle la peine — et quelle fonctionnalité `dataclass` ou Python ferait cette mise en cache automatiquement ?

## Étape 4 : Roule ton historique dans pandas

Les jours individuels sont des données ; une *semaine* de jours est une tendance. Cette étape construit un `DataFrame` pandas à partir d'une liste de résumés quotidiens — volume, calories, poids corporel — et ajoute une moyenne mobile pour lisser le bruit jour après jour. Cette moyenne mobile est le premier vrai geste d'analyse de données du projet, et elle transforme une liste bruyante de nombres en quelque chose que tu peux réellement lire.

### 4.1 Construis un DataFrame d'historique

**👟 Indice de départ :** Construis un `DataFrame` à partir d'une liste de dicts, convertis la colonne `date` en objets datetime, définis-la comme index, et calcule une moyenne mobile avec `df["volume"].rolling(3, min_periods=1).mean()`.

```python
# fitness_tracker.py (continued)
import pandas as pd

def build_history(rows: list[dict]) -> pd.DataFrame:
    """Turn daily {date, volume, calories, weight_kg} dicts into a sorted DataFrame."""
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    df["volume_roll3"] = df["volume"].rolling(3, min_periods=1).mean()
    return df

history = build_history([
    {"date": "2025-01-06", "volume": 3270.0, "calories": 2550, "weight_kg": 82.0},
    {"date": "2025-01-08", "volume": 3420.0, "calories": 2600, "weight_kg": 81.5},
    {"date": "2025-01-10", "volume": 3560.0, "calories": 2500, "weight_kg": 81.0},
    {"date": "2025-01-12", "volume": 3640.0, "calories": 2480, "weight_kg": 80.8},
    {"date": "2025-01-14", "volume": 3780.0, "calories": 2520, "weight_kg": 80.5},
])
print(history[["volume", "volume_roll3", "weight_kg"]])
```

`rolling(3, min_periods=1)` est la ligne importante : elle prend une fenêtre glissante de 3 rangées et calcule la moyenne, mais `min_periods=1` laisse les première et deuxième rangées avoir une moyenne partielle (taille de fenêtre 1 et 2) au lieu de `NaN` — pour que tu ne perdes pas le début de ta tendance à cause de données manquantes. `sort_index()` garantit que les dates sont en ordre chronologique avant que la fenêtre glissante se déplace à travers elles ; sans cela, la moyenne mobile reflète un ordre d'entrée arbitraire, pas le temps.

**🎯 Résultat attendu :** Affiche un DataFrame de 5 rangées avec les colonnes `volume`, `volume_roll3` (la moyenne mobile sur 3 jours) et `weight_kg`, trié par date — `volume_roll3` est proche de `volume` pour la plupart des rangées mais plus lisse.

**🩹 Si ça ne marche pas :** Si `volume_roll3` contient des valeurs `NaN` en haut, `min_periods` est trop élevé (le défaut est la taille de fenêtre, ce qui signifie que les deux premières rangées obtiennent `NaN`) ; confirme que `min_periods=1` est dans l'appel. Si l'index n'est pas trié par date, `sort_index()` manque ou a été retiré — la fenêtre glissante a besoin de l'ordre chronologique pour avoir un sens.

### 4.2 Vérifie l'historique

**✅ Liste de vérification**

- ✅ `history` a exactement 5 rangées, indexées par date, avec `volume_roll3` montrant une tendance lissée.
- ✅ `volume_roll3` de la première rangée est égal à `volume` de cette rangée (une fenêtre de 1 n'a pas de lissage).

**🤔 Question(s) socratique(s)**

- Si tu changes `rolling(3)` en `rolling(5)`, que se passe-t-il pour la moyenne mobile des quatre premières rangées, et quand une fenêtre plus grande serait-elle meilleure ou pire pour un jeu de données aussi court que celui-ci ?
- `set_index("date")` fait de la date l'identifiant de rangée. Quelle requête écrirais-tu en pandas pour ne sélectionner que les séances de la seconde moitié de janvier — et comment cela se compare-t-il à une clause SQL `WHERE` sur une colonne de dates ?

## Étape 5 : Trace la progression au fil du temps

Un DataFrame est un tableau ; un graphique est une image des mêmes données qui rend les tendances visibles d'un coup d'œil — le poids qui descend, le volume qui monte, et où sont les points d'inflexion. Cette étape construit une figure matplotlib à deux panneaux : une tendance de poids à gauche et une tendance de volume d'entraînement à droite.

### 5.1 Construis le graphique à deux panneaux

**👟 Indice de départ :** Utilise `plt.subplots(1, 2, ...)` pour créer des axes côte à côte, trace chaque métrique sur son propre axe avec `marker="o"` pour des points de données distincts, et sauvegarde la figure en PNG.

```python
# fitness_tracker.py (continued)
import matplotlib.pyplot as plt

def plot_progress(history: pd.DataFrame, filepath: str = "fitness_progress.png") -> None:
    """Plot body weight and training volume trends side by side."""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    axes[0].plot(history.index, history["weight_kg"], marker="o", color="#2ecc71")
    axes[0].set_title("Body Weight Trend")
    axes[0].set_ylabel("kg")
    axes[0].tick_params(axis="x", rotation=45)

    axes[1].plot(history.index, history["volume"], marker="o", color="#3498db", label="Daily")
    axes[1].plot(history.index, history["volume_roll3"], marker="s", color="#e74c3c", linestyle="--", label="3-day avg")
    axes[1].set_title("Training Volume")
    axes[1].set_ylabel("Volume (kg)")
    axes[1].legend()
    axes[1].tick_params(axis="x", rotation=45)

    plt.tight_layout()
    plt.savefig(filepath, dpi=150)
    print(f"Chart saved to {filepath}")
    plt.show()

plot_progress(history)
```

Deux panneaux partagent un `figsize=(12, 5)` pour que la figure soit assez large pour deux graphiques sans les écraser. `plt.tight_layout()` empêche les deux étiquettes d'axe y de se chevaucher — sans cela, le `ylabel` du graphique de droite entre souvent en collision avec les graduations du graphique de gauche. `marker="o"` et `marker="s"` (carré) avec `linestyle="--"` pour la moyenne mobile te permettent de distinguer la valeur quotidienne de sa version lissée même en niveaux de gris, ce qui compte quand quelqu'un imprime le graphique.

**🎯 Résultat attendu :** Un graphique sauvegardé dans `fitness_progress.png` — le panneau de gauche montre le poids corporel qui décline régulièrement de 82 à 80,5 kg ; le panneau de droite montre le volume d'entraînement qui augmente, avec la moyenne mobile rouge en pointillés sur 3 jours qui lisse la tendance à la hausse.

**🩹 Si ça ne marche pas :** Si le graphique montre un cadre vide sans lignes de données, le `DataFrame` `history` est vide ou les noms de colonnes ne correspondent pas — confirme que `weight_kg` et `volume` existent comme noms de colonnes. Si les étiquettes de l'axe x se chevauchent mal, `rotation=45` manque dans `tick_params`. Si la fenêtre du graphique s'ouvre mais se ferme immédiatement dans un script, ajoute `plt.show()` à la fin (elle bloque jusqu'à ce que tu fermes la fenêtre) ou sauvegarde sans afficher.

### 5.2 Vérifie la visualisation

**✅ Liste de vérification**

- ✅ `fitness_progress.png` existe et montre deux panneaux côte à côte : le poids tendant vers le bas, le volume tendant vers le haut.
- ✅ La ligne rouge en pointillés (moyenne sur 3 jours) est plus lisse que la ligne bleue pleine (volume quotidien) — tu peux voir l'effet de lissage directement.

**🤔 Question(s) socratique(s)**

- Le panneau de poids a une seule ligne. Si tu ajoutais un second axe (via `ax.twinx()`) pour montrer les calories sur l'axe y droit, comment interpréterais-tu un jour où le poids monte mais les calories sont faibles — et ce graphique serait-il trompeur ou utile ?
- Le graphique de volume montre les valeurs quotidiennes et une moyenne sur 3 jours. Si un coach te demandait d'ajouter une moyenne sur *7* jours sur le même graphique, comment la calculerais-tu, et quel est le coût du chevauchement de trop de lignes sur un seul graphique ?

## ⚠️ Pièges courants

- **Les graisses font 9 kcal/g, pas 4.** Utiliser 4 pour les trois macros est le bug de nutrition sportive de loin le plus courant : il sous-estime les calories des graisses de plus de la moitié, ce qui rend silencieusement la répartition macro équilibrée alors qu'elle est déséquilibrée. La fonction `macro_split` utilise les facteurs corrects (4, 4, 9) — ne les arrondis jamais à une constante unique.
- **Moyenne mobile sur des données non triées.** `df.rolling(3).mean()` opère sur l'ordre des rangées, pas l'ordre temporel. Si ton DataFrame n'est pas trié par date, la moyenne mobile mélange valeurs futures et passées, produisant une ligne qui semble plausible mais qui est fausse. Fais toujours `sort_index()` avant de rouler.
- **Ordre des champs de dataclass.** Dans un `@dataclass`, les champs avec valeurs par défaut doivent venir après les champs sans elles — `name: str = ""` avant `sets: int` est une `SyntaxError`. Python l'impose parce que la construction positionnelle serait ambiguë autrement.
- **Division par zéro dans `macro_split`.** Un `DailyLog` vide sans repas renvoie zéro pour chaque total de macro. `sum(...) or 1` attrape cela avec élégance ; sans lui, la division lève `ZeroDivisionError`, techniquement correcte mais pas conviviale.
- **`plt.show()` qui bloque dans les scripts.** Dans un fichier `.py` exécuté depuis un terminal, `plt.show()` ouvre une fenêtre et bloque jusqu'à ce que tu la fermes — très bien pour l'exploration interactive, mais cela stoppe le reste de ton script. Sauvegarde la figure avec `plt.savefig()` d'abord pour que le fichier existe même si tu ne fermes jamais la fenêtre.

## Ce que tu viens de construire

Une application d'enregistrement de forme fonctionnelle : tu modélises les exercices et les repas individuels avec des propriétés dérivées, tu les agrèges en séances et journaux quotidiens, tu calcules le volume d'entraînement et les pourcentages de macros, tu roules un historique de plusieurs semaines dans un DataFrame pandas et tu visualises les tendances de poids et de force dans un graphique à deux panneaux sauvegardé en PNG. Rien ici n'est une simulation — les dataclasses sont réutilisables, les opérations pandas sont les mêmes que celles que tu utiliserais sur un vrai export de n'importe quelle application de suivi, et le graphique est le commencement d'un vrai tableau de bord de progression.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/fitness-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/fitness-tracker) dans le dépôt du cours est une version notebook exécutable : une semaine complète de données synthétiques d'entraînement et de nutrition, chaque classe et fonction des étapes 1 à 5, et le graphique à deux panneaux rendu en ligne. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le de là.
:::

## Où aller ensuite

- Écris un **calculateur de série d'entraînements** : à partir d'une liste de dates de séances, calcule la série actuelle de jours consécutifs et la plus longue série de tous les temps — une simple boucle qui teste ton instinct de traitement des dates.
- Ajoute une classe **WeeklyGoal** qui définit un nombre cible d'entraînements par semaine et un budget calorique, compare les données réellement enregistrées à l'objectif et imprime un résumé réussi/échoué — le premier pas du « suivi » vers la « responsabilisation ».
- Calcule et trace un **1RM (une répétition maximale)** en utilisant la formule d'Epley — `weight × (1 + reps / 30)` — pour chaque exercice au fil du temps pour suivre la progression de force indépendamment du volume.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans le monde où les données travaillent pour tes propres objectifs. 🎓