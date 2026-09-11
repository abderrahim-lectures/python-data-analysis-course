---
title: "Moteur de Quiz"
description: "Construisez une plateforme de quiz avec banques de questions, tests chronométrés, scoring et analyses de performance."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["classes", "random", "pandas", "matplotlib"]
learningObjectives:
  - "Modéliser des questions avec des classes supportant plusieurs types de questions"
  - "Implémenter des sessions de quiz chronométrées avec logique de compte à rebours"
  - "Construire un moteur de scoring avec notation pondérée et crédit partiel"
  - "Analyser les performances avec pandas et visualiser les résultats"
  - "Conserver l'historique des quiz en JSON entre les sessions"
  - "Construire un menu CLI pour des sessions de quiz interactives"
prerequisites: ["Bases de Python (classes, dictionnaires, listes)", "Pandas et matplotlib basiques"]
---

# Moteur de Quiz

Construis une plateforme de quiz avec des questions aléatoires, des sessions chronométrées, une notation automatique et des rapports de performance détaillés.

## 🎯 Ce que tu vas faire

1. Modéliser trois types de questions — choix multiple, vrai/faux et texte à trous — en utilisant des classes abstraites et des dataclasses.
2. Construire un moteur de quiz qui gère une banque de questions, sélectionne des questions aléatoires et exécute des sessions chronométrées.
3. Noter les réponses automatiquement avec des ventilations par catégorie et des pourcentages de précision.
4. Visualiser les performances avec des diagrammes en barres et en secteurs en utilisant matplotlib.
5. Conserver l'historique des quiz dans un fichier JSON pour que les résultats survivent entre les sessions.
6. Construire un menu CLI pour créer des quiz, voir l'historique et examiner les résultats passés.
7. Polir la sortie avec un retour coloré par code couleur et des rapports de score formatés.

## Où exécuter ceci

- **En local avec `uv` (recommandé).** Ce projet a besoin de pandas et matplotlib — un bon candidat pour tourner sur ta propre machine. La section Configuration ci-dessous explique comment.
- **Google Colab ou les notebooks Kaggle.** Colle les cellules de code directement dans un notebook. Les graphiques se rendent en intégré, et `input()` fonctionne pour les invites de quiz.
- **Terrain de jeu JupyterLite.** Colle les cellules de code directement dans un notebook — à noter que les entrées-sorties de fichiers (Étape 5) fonctionnent différemment dans le navigateur ; la persistance JSON ne fonctionnera qu'en local.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt — ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/quiz-engine/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/quiz-engine/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fquiz-engine%2Fnotebook.fr.ipynb)

## Configuration

```bash
uv init quiz-engine
cd quiz-engine
uv add pandas matplotlib
```

## Étape 1 : Définis les types de questions

Le fondement de tout moteur de quiz : chaque question connaît son texte, sa catégorie, sa valeur en points, comment s'afficher elle-même et comment vérifier une réponse. Nous utiliserons une classe de base abstraite pour que chaque type de question suive la même interface, puis nous construirons trois types concrets par-dessus.

### 1.1 Écris la classe de base abstraite

**👟 Indice de départ :** Utilise `dataclasses` pour des valeurs par défaut d'attribut propres et `abc.ABC` pour imposer l'interface. Chaque question stocke `text`, `category`, et `points`, et doit implémenter `check(answer) -> (bool, int)` et `display()`.

```python
from dataclasses import dataclass, field
from abc import ABC, abstractmethod

@dataclass
class Question(ABC):
    text: str
    category: str
    points: int = 10

    @abstractmethod
    def check(self, answer: str) -> tuple[bool, int]:
        """Return (is_correct, points_awarded)."""
        ...

    @abstractmethod
    def display(self) -> None:
        """Print the question to the terminal."""
        ...
```

**🎯 Résultat attendu :** Définir cette classe ne devrait pas produire de sortie visible — c'est un plan. Tu peux vérifier qu'elle fonctionne en définissant une sous-classe concrète minimale et en l'instanciant (sous-étape suivante).

**🩹 Si ça ne marche pas :** Si tu obtiens `TypeError: Can't instantiate abstract class`, tu as oublié d'implémenter `check` ou `display` dans ta sous-classe concrète. Si tu vois `TypeError: __init__() missing required arguments`, revérifie que les champs de ta dataclass ont des valeurs par défaut là où c'est nécessaire.

### 1.2 Implémente MultipleChoice

**👟 Indice de départ :** Stocke une liste de `options` et le `correct_index` (basé sur 1 pour l'affichage, mais basé sur 0 en interne). La méthode `check` convertit l'entrée numérique de l'utilisateur en un index.

```python
@dataclass
class MultipleChoice(Question):
    options: list[str] = field(default_factory=list)
    correct_index: int = 0

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts]")
        for i, opt in enumerate(self.options, 1):
            print(f"    {i}. {opt}")

    def check(self, answer: str) -> tuple[bool, int]:
        try:
            is_correct = int(answer) == self.correct_index + 1
        except ValueError:
            is_correct = False
        return is_correct, self.points if is_correct else 0
```

**🎯 Résultat attendu :** En exécutant ceci :

```python
mc = MultipleChoice("What is 2 + 2?", category="math",
                     options=["3", "4", "5", "6"], correct_index=1)
mc.display()
correct, pts = mc.check("2")
print(f"Correct: {correct}, Points: {pts}")
```

Devrait imprimer :

```
  What is 2 + 2? [10 pts]
    1. 3
    2. 4
    3. 5
    4. 6
Correct: True, Points: 10
```

**🩹 Si ça ne marche pas :** Si `check("4")` retourne `False`, tu compares la chaîne brute — assure-toi d'appeler `int(answer)` avant de comparer à `correct_index + 1` (le +1 tient compte de la numérotation d'affichage basée sur 1).

### 1.3 Implémente TrueFalse et FillInBlank

**👟 Indice de départ :** TrueFalse stocke une `correct_answer` booléenne et vérifie si l'utilisateur a tapé « true »/« t » ou « false »/« f ». FillInBlank stocke une liste de `accepted_answers` et normalise à la fois l'entrée de l'utilisateur et chaque réponse acceptée en minuscules pour la comparaison.

```python
@dataclass
class TrueFalse(Question):
    correct_answer: bool = True

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts] (True / False)")

    def check(self, answer: str) -> tuple[bool, int]:
        normalised = answer.strip().lower()
        user_says_true = normalised in ("true", "t")
        user_says_false = normalised in ("false", "f")
        is_correct = (user_says_true == self.correct_answer)
        return is_correct, self.points if is_correct else 0


@dataclass
class FillInBlank(Question):
    accepted_answers: list[str] = field(default_factory=list)

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts]")

    def check(self, answer: str) -> tuple[bool, int]:
        normalised = answer.strip().lower()
        is_correct = any(normalised == a.lower() for a in self.accepted_answers)
        return is_correct, self.points if is_correct else 0
```

**🎯 Résultat attendu :** En exécutant ceci :

```python
tf = TrueFalse("Python is statically typed.", category="python", correct_answer=False)
fib = FillInBlank("The keyword to define a function is ___", category="python",
                   accepted_answers=["def"])

for q in [tf, fib]:
    q.display()
    correct, pts = q.check("false" if isinstance(q, TrueFalse) else "def")
    print(f"  Correct: {correct}, Points: {pts}")
```

Devrait imprimer :

```
  Python is statically typed. [10 pts] (True / False)
  Correct: True, Points: 10

  The keyword to define a function is ___ [10 pts]
  Correct: True, Points: 10
```

**🩹 Si ça ne marche pas :** Si `TrueFalse` accepte une entrée « yes »/« no », tu as oublié de restreindre à l'ensemble `("true", "t", "false", "f")` — un « yes » contournerait ta vérification et marquerait silencieusement faux. Si `FillInBlank` est sensible à la casse, assure-toi d'appeler `.lower()` des deux côtés de la comparaison.

### 1.4 Vérifie les trois types

**✅ Liste de vérification**

- ✅ `MultipleChoice` affiche des options numérotées et accepte une chaîne numérique comme entrée.
- ✅ `TrueFalse` accepte « true »/« t »/« false »/« f » (insensible à la casse) et rejette les autres entrées.
- ✅ `FillInBlank` accepte n'importe laquelle des réponses de la liste `accepted_answers`, insensiblement à la casse.
- ✅ Les trois retournent `(bool, int)` depuis `check()` — `True` avec pleins points pour correct, `False` avec 0 pour faux.
- ✅ Chacun affiche le texte de la question et la valeur en points avant de demander une réponse.

**🤔 Question(s) socratique(s)**

Pourquoi `MultipleChoice` stocke-t-il `correct_index` basé sur 0 mais ajoute-t-il 1 lors de la comparaison de l'entrée utilisateur ? Qu'est-ce qui casserait si tu demandais à l'utilisateur « 0, 1, 2 ou 3 » au lieu de « 1, 2, 3 ou 4 » ?

## Étape 2 : Construis le moteur de quiz

Maintenant que les questions savent se vérifier elles-mêmes, nous avons besoin de quelque chose qui les collecte, sélectionne un sous-ensemble aléatoire et exécute une session chronométrée. La classe `QuizEngine` relie tout ensemble.

### 2.1 Crée le moteur et peuple une banque de questions

**👟 Indice de départ :** Le moteur démarre avec une liste vide. `add_question` l'ajoute. `build_quiz` filtre par catégorie (si donnée) puis utilise `random.sample` pour choisir sans remplacement.

```python
import random

class QuizEngine:
    def __init__(self):
        self.questions: list[Question] = []

    def add_question(self, question: Question) -> None:
        self.questions.append(question)

    def build_quiz(self, num_questions: int = 5,
                   categories: list[str] | None = None) -> list[Question]:
        pool = self.questions if not categories else [
            q for q in self.questions if q.category in categories
        ]
        if len(pool) < num_questions:
            raise ValueError(
                f"Only {len(pool)} questions available in pool, need {num_questions}"
            )
        return random.sample(pool, num_questions)
```

**🎯 Résultat attendu :** Peupler le moteur et construire un quiz devrait retourner un sous-ensemble aléatoire :

```python
engine = QuizEngine()
engine.add_question(MultipleChoice("What is 2 + 2?", "math", options=["3", "4", "5", "6"], correct_index=1))
engine.add_question(TrueFalse("Python is statically typed.", "python", correct_answer=False))
engine.add_question(FillInBlank("The keyword to define a function is ___", "python", accepted_answers=["def"]))
engine.add_question(MultipleChoice("Capital of France?", "geography", options=["London", "Paris", "Berlin"], correct_index=1))

quiz = engine.build_quiz(num_questions=2)
print(f"Quiz has {len(quiz)} questions")
for q in quiz:
    q.display()
```

**🩹 Si ça ne marche pas :** Si tu obtiens `ValueError: Only N questions available in pool, need M`, tu demandes plus de questions qu'il n'en existe dans le pool filtré — soit ajoute plus de questions, soit réduis `num_questions`. Si la même question apparaît deux fois, tu utilises `random.choices` (avec remplacement) au lieu de `random.sample` (sans remplacement).

### 2.2 Exécute une session de quiz chronométrée

**👟 Indice de départ :** Suis un temps de départ avec `time.time()`. Avant chaque question, calcule le temps restant. S'il atteint zéro, termine tôt. Collecte les résultats sous forme de liste de dicts avec le texte de la question, la catégorie, la correction et les points.

```python
import time

def run_quiz(engine: QuizEngine, questions: list[Question],
             time_limit: int = 300) -> list[dict]:
    print(f"\n{'='*50}")
    print(f"  QUIZ — {len(questions)} questions | {time_limit}s time limit")
    print(f"{'='*50}")
    results = []
    start = time.time()

    for i, q in enumerate(questions, 1):
        remaining = time_limit - (time.time() - start)
        if remaining <= 0:
            print("\n  TIME'S UP!")
            break
        print(f"\n  Question {i}/{len(questions)} (time left: {remaining:.0f}s)")
        q.display()
        answer = input("  Your answer: ").strip()
        is_correct, pts = q.check(answer)
        results.append({
            "question": q.text,
            "category": q.category,
            "correct": is_correct,
            "points": pts,
            "max_points": q.points,
        })
        print(f"  {'Correct!' if is_correct else 'Wrong.'} (+{pts} pts)")

    elapsed = time.time() - start
    print(f"\n  Quiz finished in {elapsed:.1f}s")
    return results
```

**🎯 Résultat attendu :** Exécuter un quiz imprime chaque question, accepte une entrée, et imprime correct/faux après chaque réponse. Quand la minuterie expire, il imprime `TIME'S UP!` et s'arrête. La liste de dicts retournée a une entrée par question répondue.

**🩹 Si ça ne marche pas :** Si la minuterie n'arrête pas le quiz, vérifie que `remaining <= 0` utilise `time.time() - start` (écoulé), pas `start - time.time()`. Si le quiz s'arrête toujours à la première question, ton calcul de `remaining` est faux — assure-toi de calculer `time_limit - (time.time() - start)`, pas juste `time.time() - start`.

### 2.3 Vérifie le moteur

**✅ Liste de vérification**

- ✅ `build_quiz(3)` retourne exactement 3 questions aléatoires de la banque.
- ✅ `build_quiz(3, categories=["python"])` n'inclut que les questions de la catégorie spécifiée.
- ✅ `run_quiz` imprime une minuterie de compte à rebours et s'arrête tôt quand le temps est écoulé.
- ✅ Chaque réponse est enregistrée avec le texte de la question, la catégorie, la correction et les points.
- ✅ Demander plus de questions que disponibles lève un `ValueError` clair.

**🤔 Question(s) socratique(s)**

Si tu appelais `build_quiz(5)` sur un moteur avec seulement 3 questions, que devrait-il se passer ? Lever une erreur est-il le bon choix, ou préférerais-tu retourner silencieusement les 3 ? Quels compromis chaque approche a-t-elle ?

## Étape 3 : Note et analyse les résultats

Les résultats bruts ne sont qu'une liste de dicts. Pour les transformer en quelque chose d'utile, nous devons agréger les scores, calculer des ventilations par catégorie et identifier les points faibles. C'est aussi là que pandas commence à justifier son existence.

### 3.1 Construis un résumé sans pandas

**👟 Indice de départ :** Parcours les résultats une fois, en totalisant les points, les points max et les statistiques par catégorie. Retourne un dict de résumé avec la précision globale et les ventilations par catégorie.

```python
def analyse_results(results: list[dict]) -> dict:
    total_points = sum(r["points"] for r in results)
    max_points = sum(r["max_points"] for r in results)
    accuracy = total_points / max_points * 100 if max_points else 0

    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"correct": 0, "total": 0, "points": 0, "max": 0}
        categories[cat]["total"] += 1
        categories[cat]["max"] += r["max_points"]
        categories[cat]["points"] += r["points"]
        if r["correct"]:
            categories[cat]["correct"] += 1

    summary = {
        "total_score": total_points,
        "max_score": max_points,
        "accuracy": round(accuracy, 1),
        "questions_answered": len(results),
        "categories": categories,
    }

    print(f"\n{'='*50}")
    print(f"  SCORE: {total_points}/{max_points} ({accuracy:.1f}%)")
    print(f"{'='*50}")
    for cat, data in categories.items():
        cat_pct = data["points"] / data["max"] * 100 if data["max"] else 0
        label = "Strong" if cat_pct >= 70 else "Needs Review"
        print(f"  {cat}: {data['correct']}/{data['total']} correct "
              f"({cat_pct:.0f}%) — {label}")

    return summary
```

**🎯 Résultat attendu :** En exécutant ceci sur des données d'exemple :

```python
sample = [
    {"question": "What is 2+2?", "category": "math", "correct": True, "points": 10, "max_points": 10},
    {"question": "Capital of France?", "category": "geo", "correct": False, "points": 0, "max_points": 10},
    {"question": "def defines functions?", "category": "python", "correct": True, "points": 10, "max_points": 10},
]
analyse_results(sample)
```

Devrait imprimer :

```
==================================================
  SCORE: 20/30 (66.7%)
==================================================
  math: 1/1 correct (100%) — Strong
  geo: 0/1 correct (0%) — Needs Review
  python: 1/1 correct (100%) — Strong
```

**🩹 Si ça ne marche pas :** Si la précision est 0 alors que tu avais des bonnes réponses, vérifie que `"points"` et `"max_points"` sont les clés de tes dicts de résultats — une faute de frappe comme `"max_point"` donne silencieusement 0 via `sum`. Si des catégories manquent, ta boucle `for r in results` n'initialise pas les nouvelles entrées de catégorie à la première rencontre.

### 3.2 Convertis en un DataFrame pandas pour une analyse plus profonde

**👟 Indice de départ :** Une fois que tu as un résumé, pandas te permet de faire facilement des opérations groupby. Convertis la liste de résultats en DataFrame et utilise `groupby` pour les statistiques par catégorie.

```python
import pandas as pd

def results_to_dataframe(results: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(results)

def category_breakdown(df: pd.DataFrame) -> pd.DataFrame:
    breakdown = df.groupby("category").agg(
        total_questions=("correct", "count"),
        correct_answers=("correct", "sum"),
        total_points=("points", "sum"),
        max_points=("max_points", "sum"),
    ).reset_index()
    breakdown["accuracy_pct"] = (
        breakdown["total_points"] / breakdown["max_points"] * 100
    ).round(1)
    breakdown["status"] = breakdown["accuracy_pct"].apply(
        lambda x: "Strong" if x >= 70 else "Needs Review"
    )
    return breakdown
```

**🎯 Résultat attendu :**

```python
df = results_to_dataframe(sample)
print(category_breakdown(df))
```

```
  category  total_questions  correct_answers  total_points  max_points  accuracy_pct       status
0      geo                1                0             0          10           0.0  Needs Review
1     math                1                1            10          10         100.0        Strong
2   python                1                1            10          10         100.0        Strong
```

**🩹 Si ça ne marche pas :** Si `correct_answers` montre des flottants (comme `1.0` au lieu de `1`), c'est une coercition d'entier pandas normale avec NaN — cela n'affectera pas les calculs. Si tu obtiens un `KeyError`, le nom de colonne dans ton DataFrame ne correspond pas à ce que `groupby` attend — vérifie les clés exactes dans tes dicts de résultats.

## Étape 4 : Visualise les performances

Les graphiques rendent les schémas évidents d'un coup d'œil. Nous en construirons deux : un diagramme en barres horizontales montrant la précision par catégorie (coloré en vert pour fort, en rouge pour faible), et un diagramme en secteurs montrant la répartition globale correct-contre-faux.

### 4.1 Construis le diagramme en barres

**👟 Indice de départ :** Utilise `matplotlib.pyplot`. Extrais les étiquettes de catégorie et leurs pourcentages de précision. Colore les barres en vert si ≥70 %, sinon en rouge. Ajoute une ligne verticale en pointillés au seuil de réussite de 70 % pour référence.

```python
import matplotlib.pyplot as plt

def plot_category_bars(summary: dict) -> None:
    cats = summary["categories"]
    labels = list(cats.keys())
    scores = [cats[c]["points"] / cats[c]["max"] * 100 for c in labels]
    colors = ["#2ecc71" if s >= 70 else "#e74c3c" for s in scores]

    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.barh(labels, scores, color=colors)
    ax.set_xlim(0, 100)
    ax.set_xlabel("Accuracy (%)")
    ax.set_title("Score by Category")
    ax.axvline(x=70, color="gray", linestyle="--", alpha=0.5, label="Pass threshold (70%)")
    ax.legend()

    for bar, score in zip(bars, scores):
        ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height() / 2,
                f"{score:.0f}%", va="center", fontsize=10)

    plt.tight_layout()
    plt.savefig("category_bars.png", dpi=150)
    plt.show()
```

**🎯 Résultat attendu :** Un diagramme en barres horizontales avec les noms de catégories sur l'axe des ordonnées, les pourcentages de précision sur l'axe des abscisses, des barres vertes pour les catégories ≥70 %, des barres rouges en dessous, et une ligne grise en pointillés à 70 %.

**🩹 Si ça ne marche pas :** Si le diagramme est vide, tu appelles probablement `plt.show()` avant d'ajouter des données — assure-toi de créer la figure et les axes d'abord. Si les barres sont verticales au lieu d'horizontales, tu as utilisé `bar` au lieu de `barh`. Si l'axe des abscisses dépasse 100, ajoute `ax.set_xlim(0, 100)`.

### 4.2 Construis le diagramme en secteurs

**👟 Indice de départ :** Compte le total correct et le total faux à travers toutes les catégories. Utilise `plt.pie` avec des tranches verte et rouge et une étiquette de pourcentage.

```python
def plot_overall_pie(summary: dict) -> None:
    total_correct = sum(d["correct"] for d in summary["categories"].values())
    total_wrong = summary["questions_answered"] - total_correct

    fig, ax = plt.subplots(figsize=(6, 6))
    ax.pie(
        [total_correct, total_wrong],
        labels=["Correct", "Wrong"],
        colors=["#2ecc71", "#e74c3c"],
        autopct="%1.1f%%",
        startangle=90,
        textprops={"fontsize": 12},
    )
    ax.set_title(f"Overall Accuracy — {summary['accuracy']}%")
    plt.tight_layout()
    plt.savefig("overall_pie.png", dpi=150)
    plt.show()
```

**🎯 Résultat attendu :** Un diagramme en secteurs avec deux tranches — verte pour correct, rouge pour faux — avec des étiquettes de pourcentage et la précision globale dans le titre.

**🩹 Si ça ne marche pas :** Si `total_wrong` est négatif, ton compte de `questions_answered` est faux — assure-toi de compter `len(results)`, pas seulement les bonnes. Si le diagramme en secteurs n'a pas d'étiquettes, vérifie que tu as bien passé le paramètre `labels` à `plt.pie`.

### 4.3 Combine les deux diagrammes

**👟 Indice de départ :** Utilise `plt.subplots(1, 2)` pour placer les deux diagrammes côte à côte dans une seule figure.

```python
def plot_results(summary: dict) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    cats = summary["categories"]
    labels = list(cats.keys())
    scores = [cats[c]["points"] / cats[c]["max"] * 100 for c in labels]
    colors = ["#2ecc71" if s >= 70 else "#e74c3c" for s in scores]

    axes[0].barh(labels, scores, color=colors)
    axes[0].set_xlim(0, 100)
    axes[0].set_title("Score by Category (%)")
    axes[0].axvline(x=70, color="gray", linestyle="--", alpha=0.5, label="Pass threshold")
    axes[0].legend()

    total_correct = sum(d["correct"] for d in cats.values())
    total_wrong = summary["questions_answered"] - total_correct
    axes[1].pie(
        [total_correct, total_wrong],
        labels=["Correct", "Wrong"],
        colors=["#2ecc71", "#e74c3c"],
        autopct="%1.1f%%",
        startangle=90,
    )
    axes[1].set_title("Overall Accuracy")

    plt.tight_layout()
    plt.savefig("quiz_results.png", dpi=150)
    plt.show()
```

**🎯 Résultat attendu :** Une seule figure avec un diagramme en barres horizontales à gauche et un diagramme en secteurs à droite, enregistrée sous `quiz_results.png`.

**🩹 Si ça ne marche pas :** Si un seul diagramme apparaît, l'autre axe est peut-être caché — vérifie que tu indexes `axes[0]` et `axes[1]`, pas `axes` directement. Si la figure est écrasée, augmente la largeur de `figsize` (par ex. `(14, 5)`).

## Étape 5 : Enregistre les résultats en JSON

Un quiz n'est utile que si tu peux te souvenir de ce qui s'est passé. Enregistrer les résultats dans un fichier JSON signifie qu'un étudiant peut suivre sa progression sur des jours ou des semaines.

### 5.1 Écris des fonctions de chargement et de sauvegarde

**👟 Indice de départ :** Utilise `json` plus `pathlib.Path`. Crée une classe `HistoryFile` qui charge l'historique existant (ou recommence à zéro) et enregistre après chaque quiz. Stocke une liste de sessions de quiz, chacune avec un horodatage et ses résultats.

```python
import json
from pathlib import Path
from datetime import datetime

HISTORY_FILE = Path("quiz_history.json")

class HistoryFile:
    def __init__(self, path: Path = HISTORY_FILE):
        self.path = path
        self.sessions: list[dict] = self._load()

    def _load(self) -> list[dict]:
        if not self.path.exists():
            return []
        with self.path.open() as f:
            return json.load(f)

    def save(self) -> None:
        with self.path.open("w") as f:
            json.dump(self.sessions, f, indent=2)

    def add_session(self, results: list[dict], summary: dict) -> None:
        session = {
            "timestamp": datetime.now().isoformat(),
            "num_questions": summary["questions_answered"],
            "accuracy": summary["accuracy"],
            "total_score": summary["total_score"],
            "max_score": summary["max_score"],
            "results": results,
        }
        self.sessions.append(session)
        self.save()
```

**🎯 Résultat attendu :** Exécuter ceci crée `quiz_history.json` sur disque :

```python
history = HistoryFile()
history.add_session(sample, analyse_results(sample))
print(f"Saved {len(history.sessions)} session(s)")
print(f"File exists: {HISTORY_FILE.exists()}")
```

**🩹 Si ça ne marche pas :** Si tu obtiens `TypeError: Object of type datetime is not JSON serializable`, tu stockes directement l'objet datetime — convertis-le en chaîne avec `.isoformat()` d'abord. Si le fichier est vide après l'enregistrement, tu appelles `save()` avant `add_session()`, ou `self.sessions` est réassigné au lieu d'être ajouté par append.

### 5.2 Charge et affiche les sessions passées

**👟 Indice de départ :** Ajoute une méthode qui imprime un tableau récapitulatif de toutes les sessions passées — horodatage, précision, score — pour que l'étudiant voie sa progression d'un coup d'œil.

```python
def show_history(history: HistoryFile) -> None:
    if not history.sessions:
        print("\n  No quiz history yet. Take a quiz first!")
        return

    print(f"\n{'='*60}")
    print(f"  QUIZ HISTORY ({len(history.sessions)} sessions)")
    print(f"{'='*60}")
    for i, session in enumerate(history.sessions, 1):
        ts = session["timestamp"][:10]  # just the date part
        acc = session["accuracy"]
        score = f"{session['total_score']}/{session['max_score']}"
        print(f"  {i}. {ts}  |  {score}  |  {acc}%")
    print(f"{'='*60}")
```

**🎯 Résultat attendu :**

```
============================================================
  QUIZ HISTORY (3 sessions)
============================================================
  1. 2026-09-06  |  35/50  |  70.0%
  2. 2026-09-06  |  40/50  |  80.0%
  3. 2026-09-06  |  45/50  |  90.0%
============================================================
```

**🩹 Si ça ne marche pas :** Si `timestamp[:10]` te donne la mauvaise sous-chaîne, vérifie que tu l'as stocké comme une chaîne au format ISO, pas comme un objet `datetime`. Si l'historique montre 0 sessions après en avoir ajouté une, ta méthode `add_session` crée une nouvelle liste au lieu de faire `append` à `self.sessions`.

### 5.3 Vérifie la persistance

**✅ Liste de vérification**

- ✅ Après avoir exécuté un quiz et appelé `add_session`, `quiz_history.json` existe sur disque avec du JSON valide.
- ✅ Redémarrer le programme et créer un nouveau `HistoryFile` charge les sessions précédentes.
- ✅ `show_history` affiche toutes les sessions passées avec date, score et précision.
- ✅ Supprimer `quiz_history.json` et réexécuter ne plante pas — il démarre avec une liste vide.

## Étape 6 : Interface CLI

La pièce finale : un menu qui relie tout ensemble pour qu'un étudiant puisse interagir avec le moteur de quiz sans modifier le code.

### 6.1 Construis le menu principal

**👟 Indice de départ :** Utilise une boucle `while True` avec des options numérotées. Charge le moteur et l'historique une fois au démarrage, puis dispatche vers la bonne fonction selon l'entrée utilisateur.

```python
def build_default_engine() -> QuizEngine:
    engine = QuizEngine()
    engine.add_question(MultipleChoice("What is 2 + 2?", "math",
                         options=["3", "4", "5", "6"], correct_index=1))
    engine.add_question(MultipleChoice("Capital of France?", "geography",
                         options=["London", "Paris", "Berlin"], correct_index=1))
    engine.add_question(MultipleChoice("Largest planet?", "science",
                         options=["Earth", "Mars", "Jupiter"], correct_index=2))
    engine.add_question(TrueFalse("Python is statically typed.", "python",
                         correct_answer=False))
    engine.add_question(TrueFalse("The Earth orbits the Sun.", "science",
                         correct_answer=True))
    engine.add_question(FillInBlank("The keyword to define a function is ___",
                         "python", accepted_answers=["def"]))
    engine.add_question(FillInBlank("The keyword to import a module is ___",
                         "python", accepted_answers=["import"]))
    engine.add_question(MultipleChoice("Which data structure is FIFO?", "cs",
                         options=["Stack", "Queue", "Tree", "Graph"], correct_index=1))
    return engine

def main():
    engine = build_default_engine()
    history = HistoryFile()

    while True:
        print(f"\n{'='*40}")
        print("  QUIZ ENGINE")
        print(f"{'='*40}")
        print("  1. Take a quiz")
        print("  2. View history")
        print("  3. Quit")
        print(f"{'='*40}")

        choice = input("  Choose (1-3): ").strip()

        if choice == "1":
            num = input("  How many questions? (default 5): ").strip()
            num = int(num) if num.isdigit() else 5
            try:
                questions = engine.build_quiz(num_questions=num)
            except ValueError as e:
                print(f"  Error: {e}")
                continue
            results = run_quiz(engine, questions)
            summary = analyse_results(results)
            plot_results(summary)
            history.add_session(results, summary)
        elif choice == "2":
            show_history(history)
        elif choice == "3":
            print("  Goodbye!")
            break
        else:
            print("  Invalid choice. Enter 1, 2, or 3.")
```

**🎯 Résultat attendu :** Exécuter `main()` montre un menu, te permet de passer un quiz (avec des questions chronométrées, une notation et des graphiques), de voir l'historique passé, ou de quitter. Chaque quiz est enregistré automatiquement.

**🩹 Si ça ne marche pas :** Si le menu boucle à l'infini sans accepter d'entrée, tu utilises `input` dans un `try/except` qui avale `EOFError` — retire l'exception large. Si « Passer un quiz » plante avec un `IndexError`, ton `build_quiz` essaie d'échantillonner plus de questions que la banque n'en contient — le `try/except ValueError` autour devrait l'attraper.

### 6.2 Ajoute un retour coloré

**👟 Indice de départ :** Utilise des codes d'échappement ANSI pour les couleurs du terminal. Enveloppe les messages correct/faux en vert/rouge, et ajoute de la couleur au résumé de score. Aucune bibliothèque externe nécessaire.

```python
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def coloured(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"

def print_feedback(is_correct: bool, points: int) -> None:
    if is_correct:
        print(coloured(f"  Correct! (+{pts} pts)", GREEN))
    else:
        print(coloured(f"  Wrong. (+{pts} pts)", RED))

def print_score_bar(summary: dict) -> None:
    acc = summary["accuracy"]
    bar_length = 30
    filled = int(bar_length * acc / 100)
    bar = "█" * filled + "░" * (bar_length - filled)
    color = GREEN if acc >= 70 else RED
    print(f"\n  {coloured(bar, color)} {acc}%")
    print(f"  Score: {summary['total_score']}/{summary['max_score']}")
```

**🎯 Résultat attendu :** Exécuter `print_score_bar({"accuracy": 75.0, "total_score": 30, "max_score": 40})` imprime une barre de progression colorée dans le terminal — verte si ≥70 %, rouge si en dessous.

**🩹 Si ça ne marche pas :** Si tu vois des codes d'échappement bruts comme `[92m` au lieu de couleurs, ton terminal ne supporte pas les codes ANSI — la plupart des terminaux modernes le font, mais l'invite de commande Windows peut avoir besoin d'un `os.system("")` appelé une fois au démarrage pour les activer. Si la barre est mal alignée, vérifie que `filled` ne dépasse pas `bar_length`.

### 6.3 Vérifie l'application complète

**✅ Liste de vérification**

- ✅ Le menu affiche trois options et accepte une entrée sans planter.
- ✅ « Passer un quiz » exécute un quiz chronométré, le note, montre les graphiques et enregistre les résultats.
- ✅ « Voir l'historique » montre toutes les sessions passées avec dates et scores.
- ✅ « Quitter » sort proprement.
- ✅ Le retour coloré apparaît dans le terminal pour les réponses correctes/fausses et les barres de score.
- ✅ Les résultats persistent dans `quiz_history.json` entre les redémarrages du programme.

## ⚠️ Pièges courants

- **Oublier de normaliser l'entrée.** `"True"` et `"true"` sont des chaînes différentes en Python. Chaque méthode `check()` devrait `.strip().lower()` l'entrée utilisateur avant de comparer. Cela s'applique aussi aux réponses à trous — `"def"` et `"Def"` devraient tous deux être acceptés.
- **Dérive de minuterie.** Si tu calcules `time.time() - start` seulement au début de chaque question (pas avant chaque réponse), la minuterie ne tiendra pas compte du temps que l'utilisateur met à taper. Appelle `remaining = time_limit - (time.time() - start)` juste avant chaque invite.
- **Muter la liste par défaut.** Si `build_quiz` modifie `self.questions` au lieu de filtrer dans une nouvelle liste `pool`, tu retireras définitivement des questions de la banque. Utilise toujours une compréhension de liste pour créer une copie filtrée.
- **N'enregistrer qu'à la sortie.** Si tu n'écris `quiz_history.json` que lorsque l'utilisateur quitte, un plantage ou un `Ctrl+C` perd toute la session. Appelle `history.save()` dans `add_session`, immédiatement après l'append — le même principe que le motif de statistiques Wordle.
- **`random.sample` contre `random.choices`.** `sample` choisit sans remplacement (chaque question apparaît au plus une fois). `choices` choisit avec remplacement (la même question peut apparaître deux fois dans un quiz). Utilise `sample` sauf si tu veux explicitement des répétitions.

## Ce que tu viens de construire

Une plateforme de quiz complète : trois types de questions soutenus par des classes abstraites, un moteur de quiz avec sélection aléatoire et sessions chronométrées, une notation automatique avec ventilations par catégorie, des visualisations matplotlib, une persistance JSON entre les sessions, et un menu CLI coloré qui relie tout ensemble. Chaque pièce repose sur le Python de base — classes, dictionnaires, listes, `random`, `time`, `json` — plus pandas et matplotlib pour la couche d'analyse et de visualisation.

## Où aller à partir d'ici

- **Niveaux de difficulté.** Ajoute un attribut `difficulty` aux questions (facile/moyen/difficile) et filtre à la fois par catégorie et difficulté lors de la construction d'un quiz.
- **Répétition espacée.** Suis les questions mal répondues et augmente leur probabilité d'apparaître dans les futurs quiz en utilisant un échantillonnage aléatoire pondéré.
- **Import/export de questions.** Laisse les utilisateurs écrire des banques de questions sous forme de fichiers CSV ou JSON et les charger au démarrage, pour que les quiz puissent être partagés entre les étudiants.
- **Quiz adaptatifs.** Commence par des questions faciles, et ne progresse vers des plus difficiles qu'une fois que l'étudiant a prouvé sa maîtrise — une forme simple de tests adaptatifs par ordinateur.
- **GUI avec Streamlit.** Remplace le CLI par une interface web avec Streamlit — la même logique de backend fonctionne, remplace juste `input()` par des widgets Streamlit.
