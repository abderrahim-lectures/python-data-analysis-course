---
title: "Constructeur de Cours"
description: "Créez des cours en ligne avec modules, quiz, suivi des progrès et génération de certificats."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "dataclasses", "json", "stdlib"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, dictionnaires)"
learningObjectives:
  - "Modéliser un cours comme des dataclasses imbriquées et le charger depuis du JSON"
  - "Suivre l'achèvement des leçons par élève et calculer des pourcentages"
  - "Noter les quiz contre un corrigé avec un seuil de réussite"
  - "Rendre un tableau de bord textuel des progrès et des notes de quiz"
  - "Générer un certificat d'achèvement seulement quand le cours est terminé"
---

# 🎓 Construire un Constructeur de Cours

Un cours est, sous la surface, juste des données structurées : des modules faits de leçons, des leçons avec du contenu, et des élèves avec un ensemble de jalons atteints. Ce projet construit le moteur derrière une plateforme de cours en ligne — un ensemble de classes et fonctions Python qui charge un cours depuis du JSON, suit les progrès d'un vrai élève, note ses quiz contre un corrigé, affiche un tableau de bord des progrès, et délivre enfin un certificat d'achèvement quand — et *seulement* quand — le cours est réellement terminé. Pas de navigateur, pas de base de données : juste le modèle de données et les règles qui vivent au-dessus.

Ceci suppose Python 101 — fonctions, dictionnaires et un import `json` aisé. Rien de l'Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser un cours comme des dataclasses `Lesson`, `Module` et `Course` et en charger un depuis un fichier JSON.
2. Suivre les leçons terminées d'un élève et calculer les pourcentages d'achèvement des modules et du cours.
3. Noter un quiz contre un corrigé et juger réussite/échec contre un seuil.
4. Afficher un tableau de bord montrant les progrès des modules et les notes de quiz pour un élève.
5. Générer un certificat textuel, en refusant poliment quand le cours n'est pas complet.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — ce projet est de la bibliothèque standard pure (dataclasses, JSON, `datetime`), donc la configuration est une seule commande, et la CLI locale est là où tu la pointeras sur *ton* fichier de cours.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal de navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent bien pour la moitié de modelisation de données de ce projet — le notebook dans [`examples/course-builder/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.ipynb) exécute chaque étape sur un cours d'exemple fourni. La note honnête : les *fichiers* de certificat (`certificate.txt`) se sauvegardent proprement dans un notebook, mais le code est identique dans les deux cas.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcourse-builder%2Fnotebook.ipynb)

## Configuration

`uv` est un outil unique qui remplace toute la chaîne « install Python, puis pip, puis un outil d'environnement virtuel » — et ce projet n'a besoin d'aucun paquet tiers, donc la configuration est vraiment brève.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme son installation :

```bash
uv --version
```

Ensuite, configure le projet :

```bash
uv init course-builder
cd course-builder
```

Tout ce qui est utilisé à partir d'ici — `dataclasses`, `json`, `datetime` — est intégré à Python, donc il n'y a pas d'étape `uv add`.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `course-builder/` existe avec un `pyproject.toml`.
- ✅ `python -c "from dataclasses import dataclass"` réussit.

## Étape 1 : Modéliser un cours avec des dataclasses

Un cours a une hiérarchie propre — un cours *contient* des modules, chaque module *contient* des leçons — et les `dataclasses` de Python existent pour transformer exactement cela en objets typés et auto-documentés. Le JSON, de son côté, est le format d'échange réel dans lequel voyagent les cours. Cette étape les fait se rencontrer : un `Course` que tu peux construire en Python et recharger depuis un fichier.

### 1.1 Écris les trois dataclasses et un chargeur JSON

**👟 Indice de départ :** Définis de minuscules dataclasses `Lesson`, `Module` et `Course` — imbriquées avec un `default_factory` — puis `load_course`, qui lit le JSON et réhydrate les classes avec une compréhension de liste :

```python
# models.py
from dataclasses import dataclass, field
import json

@dataclass
class Lesson:
    title: str
    minutes: int

@dataclass
class Module:
    title: str
    lessons: list[Lesson] = field(default_factory=list)

@dataclass
class Course:
    title: str
    modules: list[Module] = field(default_factory=list)

def load_course(path: str) -> Course:
    with open(path) as f:
        data = json.load(f)
    modules = [
        Module(title=m["title"], lessons=[Lesson(**l) for l in m["lessons"]])
        for m in data["modules"]
    ]
    return Course(title=data["title"], modules=modules)

if __name__ == "__main__":
    sample = {
        "title": "Python 101",
        "modules": [
            {"title": "Basics", "lessons": [
                {"title": "Variables", "minutes": 12},
                {"title": "Loops", "minutes": 15},
            ]},
            {"title": "Functions", "lessons": [
                {"title": "def and return", "minutes": 10},
            ]},
        ],
    }
    with open("course.json", "w") as f:
        json.dump(sample, f, indent=2)
    course = load_course("course.json")
    print(course.title)
    for module in course.modules:
        print(f"- {module.title}: " + ", ".join(l.title for l in module.lessons))
```

`Lesson(**l)` est l'astuce délibérée : chaque dict JSON sous `lessons` a exactement les mêmes clés que les champs de la dataclass `Lesson`, donc le déballage `**` les mappe position-par-nom gratuitement. Le `field(default_factory=list)` sur les *conteneurs* compte à cause d'un piège classique de dataclass — un `= []` nu serait partagé par chaque instance de `Module` et `Course` jamais créée.

**🎯 Résultat attendu :**

```
Python 101
- Basics: Variables, Loops
- Functions: def and return
```

**🩹 Si ça ne marche pas :** Une `TypeError: __init__() got an unexpected keyword argument` de `Lesson(**l)` signifie qu'un dict JSON a une clé qui ne correspond à aucun champ (une faute de frappe comme `minuts`) — aligne les clés JSON avec les noms de champs. Si chaque module semble partager une seule liste de leçons, tu as utilisé `= []` au lieu de `field(default_factory=list)` — c'est le bug de défaut mutable partagé rendu concret.

### 1.2 Vérifie

**✅ Liste de vérification**

- ✅ `load_course("course.json")` produit trois objets dont les attributs `title` s'affichent comme ci-dessus.
- ✅ `course.modules[0].lessons` est une `list[Lesson]` de longueur 2, pas une liste de dicts.
- ✅ Ajouter un second `Module()` sans arguments ne *partage pas* la liste de leçons du premier module.

**🤔 Question(s) socratique(s)**

- Pourquoi un dict JSON `{"title": "Variables", "minutes": 12}` a-t-il « la même forme » qu'une dataclass `Lesson`, et que se passe-t-il le jour où un fichier de cours expédie un *nouveau* champ que la dataclass ne connaît pas — où cela échoue-t-il, et à quel volume sonore ?
- La dataclass stocke `minutes` par leçon. Qui devrait calculer « le total de minutes », la classe ou le code qui imprime un rapport — et quel est l'argument pour garder `Course` un pur détenteur de données ?

## Étape 2 : Suivre les progrès des élèves

Les élèves ont besoin d'un état par élève — *quelles* leçons ils ont terminées — séparé de la définition du cours. Ici, être sobre et correct signifie : l'objet cours ne change jamais selon l'élève ; à la place un `ProgressTracker` possède un `set` de paires `(module_index, lesson_index)` et répond à la question « quel pourcentage est fait ? » avec un peu de comptage.

### 2.1 Écris le suiveur

**👟 Indice de départ :** Une classe avec trois méthodes — `complete_lesson` (stockant une clé tuple), `module_percent` et `course_percent` — puis pilote-la avec le cours de l'Étape 1 :

```python
# progress.py
from models import Course

class ProgressTracker:
    def __init__(self, course: Course, student: str):
        self.course = course
        self.student = student
        self.completed: set[tuple[int, int]] = set()

    def complete_lesson(self, module_index: int, lesson_index: int) -> None:
        self.completed.add((module_index, lesson_index))

    def module_percent(self, module_index: int) -> float:
        lessons = self.course.modules[module_index].lessons
        done = sum(1 for (mi, _) in self.completed if mi == module_index)
        return 100.0 * done / len(lessons)

    def course_percent(self) -> float:
        total = sum(len(m.lessons) for m in self.course.modules)
        return 100.0 * len(self.completed) / total

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    tracker.complete_lesson(0, 0)
    tracker.complete_lesson(0, 1)
    print(f"{tracker.student}: {tracker.course_percent():.0f}% complete")
    print(f"Module 0: {tracker.module_percent(0):.0f}% | Module 1: {tracker.module_percent(1):.0f}%")
```

Un `set` est la bonne structure de données deux fois : re-marquer la même leçon est un *no-op* (idempotent — appeler `complete_lesson(0, 0)` deux fois ne compte encore qu'une fois), et `len(self.completed)` est le total à l'échelle du cours gratuitement, car aucun tuple ne peut apparaître deux fois. La somme à l'intérieur de `module_percent` sur `self.completed` calcule « combien de paires terminées appartiennent à ce module » sans aucun comptage séparé par module.

**🎯 Résultat attendu :**

```
Ada: 67% complete
Module 0: 100% | Module 1: 0%
```

**🩹 Si ça ne marche pas :** Si les pourcentages sortent comme des flottants du genre `66.66666666666666`, c'est un diagnostic, pas une panne — cela signifie que tu as imprimé le flottant sans le format `:.0f` ; formate-le. Si marquer deux fois la même leçon fait grimper un pourcentage, le stockage n'est pas un `set` — une `list` de tuples re-compte les doublons.

### 2.2 Vérifie

**✅ Liste de vérification**

- ✅ Terminer les deux leçons de Basics fait afficher `67%` à `course_percent()` et `100%` à `module_percent(0)`.
- ✅ Appeler `complete_lesson(0, 0)` deux fois ne lève rien et ne gonfle pas le compte.
- ✅ Un nouveau suiveur frais sur le même cours signale `0%`, prouvant que le progrès est un état par élève.

**🤔 Question(s) socratique(s)**

- Pourquoi le progrès est-il stocké comme des *coordonnées* (`(module 0, leçon 1)`) au lieu des titres de leçons ? Que devient le système basé sur les coordonnées si une leçon est renommée — et le suivi basé sur les titres survivrait-il à cela ?
- Le suiveur ne sait rien des modules sauf leur index. Que changerait-il si un cours insérait un *nouveau* module au début — deux semaines après le début des élèves, avec leurs ensembles `completed` déjà pleins ? Une clé basée sur les coordonnées y résiste-t-elle ?

## Étape 3 : Noter les quiz

Le progrès répond à « l'ont-ils lu ? », les quiz répondent à « est-ce que ça tient ? ». Un quiz est un ensemble de questions — énoncé, choix, l'index de la bonne réponse — et la notation est un `zip` sur les réponses de l'élève comparant chacune au corrigé. La décision réussite/échec applique ensuite un seuil au ratio.

### 3.1 Écris le modèle de question et le correcteur

**👟 Indice de départ :** Une dataclass `Question`, un `score_quiz` qui zippe les réponses données contre le corrigé en une liste de booléens, et un helper `passed` qui compare les points obtenus au total contre une marque :

```python
# quizzes.py
from dataclasses import dataclass

@dataclass
class Question:
    prompt: str
    choices: list[str]
    answer_index: int
    points: int = 1

def score_quiz(questions: list[Question], answers: list[int]) -> tuple[int, int, list[bool]]:
    """Returns (earned, total, per-question correctness)."""
    correct = [given == q.answer_index for q, given in zip(questions, answers)]
    earned = sum(q.points for q, ok in zip(questions, correct) if ok)
    total = sum(q.points for q in questions)
    return earned, total, correct

def passed(results: tuple[int, int, list[bool]], pass_mark_pct: int = 70) -> bool:
    earned, total, _ = results
    return 100 * earned / total >= pass_mark_pct

if __name__ == "__main__":
    quiz = [
        Question("What is 2+2?", ["3", "4", "5"], 1),
        Question("Which type is a boolean?", ["int", "bool", "str"], 1),
    ]
    results = score_quiz(quiz, [1, 1])
    print(f"score: {results[0]}/{results[1]}")          # 2/2
    print("passed at 70%:", passed(results))             # True
    print("passed at 100%:", passed(results, 100))       # False
```

`zip` fait le travail honnête : il apparie chaque question à la réponse *positionnelle* correspondante de l'élève, et la compréhension de liste d'une ligne transforme cet appariement en drapeaux de justesse. Il vaut la peine de remarquer que `score_quiz` retourne *trois* choses — obtenu, total et drapeaux par question — car un correcteur qui ne signale qu'un nombre est inutile pour dire à un élève *où* il s'est trompé ; les drapeaux alimentent le verdict « refaire » plus tard.

**🎯 Résultat attendu :**

```
score: 2/2
passed at 70%: True
passed at 100%: False
```

**🩹 Si ça ne marche pas :** Un `score: 0/2` faux avec des réponses d'aspect correct signifie d'habitude que les index de la liste `answers` sont décalés d'un — les réponses sont données comme des *index de choix* (`1` = "4"), pas le texte du choix. Si `passed at 100%` affiche `True` pour un 2/2... c'est juste ; fabrique un vrai cas d'erreur, ou vérifie l'opérateur de comparaison — `>=` vs `>` change si un exactement-70% passe.

### 3.2 Vérifie

**✅ Liste de vérification**

- ✅ Un quiz parfait affiche `score: 2/2` et ton appel `passed()` retourne `True` à chaque seuil raisonnable.
- ✅ La liste de justesse par question peut te dire exactement quelle question l'élève a manquée.
- ✅ `passed()` avec une seule mauvaise réponse sur un quiz de deux questions retourne `False` à 70 %.

**🤔 Question(s) socratique(s)**

- `score_quiz` retourne des drapeaux de justesse *et* un score. Si une UI construit son écran « révise tes réponses » à partir de `correct`, que casserait-elle si tu simplifiais le retour à juste `(earned, total)` — et est-ce une régression de conception ou une simplification fine pour un petit projet ?
- `passed` compare un pourcentage à un seuil. Pourquoi un quiz de 10 questions dont le seuil est 70 % pourrait-il se comporter de façon surprenante avec ce calcul entier exact (indice : essaie d'ingénier un score qui *arrondit* à exactement 70 %) ?

## Étape 4 : Construire le tableau de bord

Les pièces séparées — cours, progrès, quiz — ont besoin d'une surface de lecture unique : le tableau de bord. C'est la « vue produit » de tout ce qui a été construit jusqu'ici, rendant l'état des modules, les pourcentages et les résultats de quiz en un seul panneau terminal, et cela introduit la petite idée de transformer un nombre en un *mot de statut* (« done »/« active »/« todo »).

### 4.1 Rends le tableau de bord

**👟 Indice de départ :** Une fonction `render_dashboard` qui formate les en-têtes avec `"=" * 40`, mappe le pourcentage de chaque module à une étiquette de statut, et note chaque résultat de quiz stocké via le helper `passed` :

```python
# dashboard.py
from progress import ProgressTracker
from quizzes import passed

def _status(pct: float) -> str:
    if pct == 100.0:
        return "done"
    if pct > 0:
        return "active"
    return "todo"

def render_dashboard(tracker: ProgressTracker, quiz_results: dict[str, tuple[int, int, list[bool]]]) -> None:
    print(f"Dashboard for {tracker.student}")
    print("=" * 40)
    for i, module in enumerate(tracker.course.modules):
        pct = tracker.module_percent(i)
        print(f"[{_status(pct):>6}] {module.title}: {pct:.0f}%")
    print("-" * 40)
    for name, (earned, total, _) in quiz_results.items():
        grade = "pass" if passed((earned, total, [])) else "retake"
        print(f"Quiz '{name}': {earned}/{total}  {grade}")
    print("=" * 40)
    print(f"Course complete: {tracker.course_percent():.0f}%")

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    tracker.complete_lesson(0, 0)
    tracker.complete_lesson(0, 1)
    render_dashboard(tracker, {"Basics quiz": (1, 2, [])})
```

Le helper de statut est un minuscule morceau de « logique de rendu » — il transforme un flottant en un mot pour que l'écran se lise comme un produit plutôt qu'un tableur. `quiz_results` arrive comme un *dict* indexé par nom de quiz car le tableau de bord est en lecture seule : il montre l'obtenu/total stocké de chaque quiz et re-juge le verdict de réussite à l'affichage, plutôt que de muter un quelconque état de quiz.

**🎯 Résultat attendu :**

```
Dashboard for Ada
========================================
[  done] Basics: 100%
[  todo] Functions: 0%
----------------------------------------
Quiz 'Basics quiz': 1/2  retake
========================================
Course complete: 67%
```

**🩹 Si ça ne marche pas :** Si un module à 0 % s'affiche comme `[  done]`, la comparaison `== 100.0` dans `_status` tourne sur un flottant non formaté qui frôle le raté — les pourcentages sont calculés comme des flottants, donc compare contre `100.0` exactement comme écrit. Si la ligne `Quiz 'Basics quiz'` montre une réussite qui contredit ton correcteur, le `tuple` passé à `passed()` a `average` échangé avec `earned` — garde l'ordre `(earned, total, flags)` cohérent partout.

### 4.2 Vérifie

**✅ Liste de vérification**

- ✅ L'en-tête du tableau de bord nomme l'élève et les deux lignes de modules montrent les mots de statut attendus.
- ✅ Les résultats de quiz se rendent comme `X/Y` avec un verdict `pass` ou `retake` qui correspond au correcteur de l'Étape 3 sur les mêmes nombres.
- ✅ `render_dashboard` s'imprime sans erreur pour un dict `quiz_results` vide.

**🤔 Question(s) socratique(s)**

- `render_dashboard` ajoute le poli d'en-tête/statut/verdict, mais il ne change aucun état du suiveur. Pourquoi garder le *rendu* séparé de la *mutation* est-il un choix de conception qui vaut d'être défendu à mesure que le cours grandit avec un drapeau de sortie `--json` ?
- Le type `tuple[int, int, list[bool]]` revient partout où un résultat de quiz se déplace. Que changerait-il si un résultat de quiz devenait une `@dataclass` — où un tuple nu cesse-t-il d'être assez expressif ?

## Étape 5 : Les certificats — gagnés, pas supposés

Un certificat qui s'imprime à chaque demande ne vaut rien ; celui qui s'imprime *seulement quand le cours est complet* a du sens. L'étape finale impose l'invariant à la frontière : construis le texte du certificat, mais refuse avec une raison claire si `course_percent()` n'a pas atteint 100.

### 5.1 Écris `build_certificate`

**👟 Indice de départ :** Garde avec un `raise ValueError` précoce utilisant un message précis, puis construit le certificat avec les données réelles du suiveur et la date du jour :

```python
# certificate.py
from datetime import date

from progress import ProgressTracker

def build_certificate(tracker: ProgressTracker) -> str:
    pct = tracker.course_percent()
    if pct < 100.0:
        raise ValueError(
            f"{tracker.student} is only {pct:.0f}% complete -- finish the course first."
        )
    module_line = ", ".join(m.title for m in tracker.course.modules)
    return f"""
================================================
            COURSE COMPLETION CERTIFICATE
================================================

  This certifies that

        {tracker.student}

  has completed the course

        {tracker.course.title}

  covering: {module_line}

  Date: {date.today().isoformat()}
  Signature: Course Instructor
================================================
"""

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    for mi, module in enumerate(tracker.course.modules):
        for li in range(len(module.lessons)):
            tracker.complete_lesson(mi, li)
    with open("certificate.txt", "w") as f:
        f.write(build_certificate(tracker))
    print("Wrote certificate.txt")
```

Chaque règle de ce projet converge sur cette garde. Le `if pct < 100.0: raise` est un *invariant métier appliqué dans le code* — aucun chemin n'imprime un certificat pour un cours achevé à 89 %, car la garde siège avant que le moindre texte du certificat ne soit assemblé. `date.today().isoformat()` te donne une vraie chaîne de date triable sans aucun formatage de chaîne, et le bloc `__main__` parcourt les modules par index pour tout marquer complet — la même clé de coordonnées que le suiveur comprend depuis l'Étape 2.

**🎯 Résultat attendu :** `Wrote certificate.txt` — et ouvrir `certificate.txt` montre le certificat ASCII avec `Ada`, `Python 101`, la liste des modules, la date du jour et une ligne de signature.

**🩹 Si ça ne marche pas :** Une `ValueError` disant `finish the course first` est un *comportement correct* pour un cours incomplet — complète entièrement la boucle dans `__main__` (les deux modules) si tu veux un certificat. Si le certificat affiche les titres des modules dans le mauvais ordre, `tracker.course.modules` est itéré sur une liste que tu as mutée entre le chargement et l'affichage — recharge le cours à neuf dans la démo.

### 5.2 Vérifie

**✅ Liste de vérification**

- ✅ Terminer chaque leçon du cours écrit `certificate.txt` et affiche `Wrote certificate.txt`.
- ✅ Retirer un appel `complete_lesson` fait lever `ValueError` au même script avant d'écrire le moindre fichier.
- ✅ Le certificat contient le vrai nom de l'élève, le vrai titre du cours et la date du jour — rien de codé en dur.

**🤔 Question(s) socratique(s)**

- La garde lève `ValueError`. Que changerait-il si un appelant *attrapait* silencieusement cette erreur pour afficher « en cours » à la place — lever est-il le choix honnête, ou une valeur de retour comme `None` est-elle plus indulgente pour le code d'UI ?
- `build_certificate` calcule le pourcentage *lui-même* plutôt que de faire confiance à un booléen `fully_complete` passé en entrée. Pourquoi vérifier la vérité dérivée est-il plus robuste que de se fier à un drapeau qui pourrait être posé de façon optimiste ?

## ⚠️ Pièges courants

- **Défauts mutables partagés.** `lessons=[]` sur un champ de dataclass est évalué *une fois* — chaque `Module()` partage une liste, donc ajouter une leçon à un module « apparaît » dans tous. Toujours `field(default_factory=list)`.
- **Stocker le progrès comme des titres, pas des coordonnées.** Renommer « Loops » réinitialise chaque élève qui l'a terminée. Les tuples d'index survivent aux renommages et à la sérialisation de façon identique.
- **Des corrigés en chaînes plutôt qu'en index.** Noter `answers = ["4", "bool"]` contre un corrigé d'entiers ne correspond jamais. Décide une fois que les choix sont identifiés par *index*, et garde les comparaisons du correcteur index-à-index.
- **Comparer des flottants exactement.** `pct == 100` où `pct` est `99.9999999` issu d'arithmétique à virgule flottante retourne `False`. Compare avec `< 100.0` pour la garde et un `>=` pour les marques de réussite, comme le code ci-dessus le fait.
- **Laisser n'importe quel code imprimer des secrets ou des certificats tôt.** Comme la garde du certificat, chaque artefact « qui n'a de sens que s'il est gagné » mérite une vérification de frontière avant que le texte ne soit construit — le même instinct qui empêche `config-manager` (le projet compagnon de ce cours) d'imprimer des secrets.

## Ce que tu viens de construire

Un moteur de cours fonctionnel : des dataclasses imbriquées hydratées depuis du JSON, un suivi de progrès par élève avec achèvement idempotent, un correcteur de quiz avec un seuil de réussite, un tableau de bord lisible, et un certificat gagné-et-pas-supposé — tout en bibliothèque standard, tout exécutable depuis un terminal. La compétence transférable est la *modélisation d'un domaine du monde réel en structures de données et invariants* : transformer « un élève a terminé son cours » d'un ressenti en un `course_percent() == 100.0` vérifiable, appliqué par le code plutôt que par la bonne volonté.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/course-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/course-builder) dans le dépôt du cours contient ces scripts complets plus un `course.json` d'exemple. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Écris le progrès sur le disque en JSON (`tracker.completed` est déjà un ensemble sérialisable de tuples) pour qu'un élève puisse fermer le terminal et reprendre — la couche de persistance sur un modèle déjà propre.
- Ajoute une fabrique `Course` qui *valide* le JSON au chargement (titres de leçons uniques, minutes non négatives) au lieu de se fier au fichier — une assurance bon marché qui réutilise les formes de l'Étape 1.
- Imprime le certificat comme un **PDF** en émettant à la main un PDF minimal valide, ou va par la voie pragmatique et rends du Markdown qu'une plateforme de cours rend.
- Ajoute un second élève et laisse le tableau de bord accepter `--student ada|grace` — tu découvriras que le progrès est entièrement décomposé du cours (l'Étape 2 a fait cela exprès).

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓