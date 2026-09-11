---
title: "Carnet de Notes"
description: "Gérez les notes des étudiants avec catégories pondérées, calcul du GPA et portails parents."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["pandas", "csv", "classes", "statistics"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, dictionnaires)"
  - "Les bases de pandas (DataFrames, groupby)"
---

# Carnet de Notes

Chaque enseignant a besoin d'un moyen de suivre la performance des étudiants, de calculer des moyennes pondérées et de transformer des scores bruts en bulletins significatifs. Dans ce projet, tu construiras un système de carnet de notes complet en Python qui gère les dossiers étudiants, le calcul du GPA pondéré, les statistiques de classe, la persistance CSV et même la visualisation de base. Tu pratiqueras l'utilisation de classes pour modéliser des entités du monde réel, de pandas pour la manipulation de données et des statistiques pour l'analyse.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt — ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/gradebook/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/gradebook/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgradebook%2Fnotebook.fr.ipynb)

## 🎯 Ce que tu vas apprendre

1. **Modélisation de données avec des classes** — Représenter des étudiants, des notes et des catégories comme des objets avec des responsabilités claires
2. **Calcul de moyenne pondérée** — Calculer des GPA qui respectent les pondérations des catégories de devoirs
3. **Analyse statistique** — Trouver les moyennes, médianes et distributions de notes de la classe
4. **Persistance CSV** — Enregistrer et charger les données du carnet de notes pour qu'elles survivent entre les sessions
5. **Visualisation** — Générer des diagrammes en barres pour les distributions de notes avec matplotlib

## Ce que tu vas construire

Une application de carnet de notes en ligne de commande qui te permet d'ajouter des étudiants, d'enregistrer des notes dans des catégories (devoirs, quiz, examens), de calculer des GPA pondérés, de générer des bulletins formatés, d'enregistrer le tout en CSV et de visualiser les distributions de notes avec des diagrammes.

## Configuration

```bash
mkdir gradebook && cd gradebook
pip install pandas matplotlib
touch gradebook.py
```

## Étape 1 : Définir le modèle de données

La fondation de tout carnet de notes est son modèle de données. Nous devons représenter trois concepts centraux :

- **Étudiant** — une personne avec un nom et une collection de notes
- **Note** — un score unique lié à une catégorie et une pondération
- **Catégorie** — un groupement nommé (comme « devoirs » ou « examen ») avec une pondération vers la note finale

Utiliser des classes garde cela organisé et rend chaque pièce facile à tester et à étendre.

### 1.1 Créer la classe Grade

**👟 Indice de départ :** Crée une classe `Grade` avec les attributs `category`, `score` et `weight`.

```python
class Grade:
    def __init__(self, category, score, weight):
        self.category = category
        self.score = score
        self.weight = weight

    def __repr__(self):
        return f"Grade(category='{self.category}', score={self.score}, weight={self.weight})"
```

**🎯 Résultat attendu :**

```python
>>> g = Grade("homework", 95, 0.3)
>>> g
Grade(category='homework', score=95, weight=0.3)
>>> g.score
95
```

**🩹 Si ça ne marche pas :**
- Assure-toi que `weight` est un nombre décimal (0,3 pour 30 %), pas un pourcentage (30)
- La méthode `__repr__` utilise des guillemets simples dans le f-string — assure-toi qu'ils correspondent

### 1.2 Créer la classe Student

**👟 Indice de départ :** La classe `Student` stocke un nom et une liste vide de notes. Ajoute une méthode pour ajouter des notes et une autre pour les lister.

```python
class Student:
    def __init__(self, name):
        self.name = name
        self.grades = []

    def add_grade(self, category, score, weight):
        grade = Grade(category, score, weight)
        self.grades.append(grade)

    def __repr__(self):
        return f"Student(name='{self.name}', grades={len(self.grades)})"
```

**🎯 Résultat attendu :**

```python
>>> s = Student("Alice")
>>> s.add_grade("homework", 92, 0.3)
>>> s.add_grade("exam", 88, 0.7)
>>> s
Student(name='Alice', grades=2)
>>> s.grades
[Grade(category='homework', score=92, weight=0.3), Grade(category='exam', score=88, weight=0.7)]
```

**🩹 Si ça ne marche pas :**
- La méthode `add_grade` devrait créer un nouvel objet `Grade` et l'ajouter à `self.grades`
- N'oublie pas `self.grades = []` dans `__init__` — sans cela, tous les étudiants partageraient la même liste

**✅ Liste de vérification**
- ✅ `Grade` stocke la catégorie, le score et la pondération
- ✅ `Student` stocke un nom et une liste de notes
- ✅ `add_grade` crée une `Grade` et l'ajoute à la liste de l'étudiant
- ✅ Les deux classes ont des méthodes `__repr__`

**🤔 Question(s) socratique(s)**
- Pourquoi stocker les notes comme une liste sur l'étudiant plutôt que comme un dictionnaire indexé par catégorie ?

---

## Étape 2 : Ajouter des notes

Maintenant que nous avons le modèle de données, construisons un système pour réellement saisir des notes. Nous créerons une classe `Gradebook` qui contient tous les étudiants et fournit des méthodes pour ajouter des étudiants et des notes.

### 2.1 Créer la classe Gradebook

**👟 Indice de départ :** La classe `Gradebook` contient un dictionnaire mappant les noms d'étudiants aux objets `Student`.

```python
class Gradebook:
    def __init__(self, name):
        self.name = name
        self.students = {}

    def add_student(self, name):
        if name in self.students:
            print(f"Student '{name}' already exists.")
            return self.students[name]
        student = Student(name)
        self.students[name] = student
        return student

    def get_student(self, name):
        if name not in self.students:
            print(f"Student '{name}' not found.")
            return None
        return self.students[name]

    def add_grade(self, student_name, category, score, weight):
        student = self.get_student(student_name)
        if student:
            student.add_grade(category, score, weight)

    def __repr__(self):
        return f"Gradebook(name='{self.name}', students={len(self.students)})"
```

**🎯 Résultat attendu :**

```python
>>> gb = Gradebook("CS101 Fall 2025")
>>> gb.add_student("Alice")
Student(name='Alice', grades=0)
>>> gb.add_grade("Alice", "homework", 95, 0.3)
>>> gb.add_grade("Alice", "exam", 87, 0.7)
>>> gb.add_grade("Alice", "homework", 88, 0.3)
>>> gb.add_student("Bob")
Student(name='Bob', grades=0)
>>> gb.add_grade("Bob", "homework", 78, 0.3)
>>> gb.add_grade("Bob", "exam", 92, 0.7)
>>> gb
Gradebook(name='CS101 Fall 2025', students=2)
```

**🩹 Si ça ne marche pas :**
- `get_student` devrait imprimer un message et renvoyer `None` quand l'étudiant n'existe pas
- Assure-toi que `add_student` vérifie les doublons avant de créer un nouvel étudiant

**✅ Liste de vérification**
- ✅ `Gradebook` stocke les étudiants dans un dictionnaire indexé par nom
- ✅ `add_student` crée un étudiant et gère les doublons
- ✅ `get_student` récupère un étudiant ou imprime un message introuvable
- ✅ `add_grade` ajoute une note à un étudiant spécifique par nom

**🤔 Question(s) socratique(s)**
- Que changerait-il si des étudiants pouvaient avoir le même nom ? Comment gérerais-tu cela ?

---

## Étape 3 : Calculer le GPA

La fonctionnalité centrale de tout carnet de notes est le calcul du GPA. Un GPA pondéré multiplie chaque score par sa pondération, somme ces produits, et divise par la pondération totale. Cela garantit que les examens comptent plus que les devoirs quand ils ont des pondérations plus élevées.

### 3.1 Moyenne pondérée pour un seul étudiant

**👟 Indice de départ :** Parcours les notes d'un étudiant, multiplie chaque score par sa pondération, somme-les, et divise par la pondération totale.

```python
def weighted_average(grades):
    if not grades:
        return 0.0
    total_weighted = sum(g.score * g.weight for g in grades)
    total_weight = sum(g.weight for g in grades)
    if total_weight == 0:
        return 0.0
    return round(total_weighted / total_weight, 2)

# Add this method to the Student class:
# def gpa(self):
#     return weighted_average(self.grades)
```

**🎯 Résultat attendu :**

```python
>>> alice = gb.get_student("Alice")
>>> alice.grades
[Grade(category='homework', score=95, weight=0.3), Grade(category='exam', score=87, weight=0.7), Grade(category='homework', score=88, weight=0.3)]
>>> weighted_average(alice.grades)
90.54
```

**🩹 Si ça ne marche pas :**
- Vérifie que tu utilises `g.weight` et pas `g.score` comme diviseur
- Assure-toi de gérer le cas de liste vide — la division par zéro fera planter le programme
- La pondération totale ici est 1,3 (0,3 + 0,7 + 0,3), pas 1,0 — c'est correct car les devoirs apparaissent deux fois

### 3.2 GPA cumulatif sur tous les étudiants

**👟 Indice de départ :** Ajoute une méthode à `Gradebook` qui moyenne les GPA de tous les étudiants.

```python
# Add this method to the Gradebook class:
def class_average(self):
    if not self.students:
        return 0.0
    averages = [weighted_average(s.grades) for s in self.students.values() if s.grades]
    if not averages:
        return 0.0
    return round(sum(averages) / len(averages), 2)
```

**🎯 Résultat attendu :**

```python
>>> gb.class_average()
87.07
```

**🩹 Si ça ne marche pas :**
- Filtre les étudiants sans notes — une liste de notes vide ne devrait pas compter dans la moyenne
- La moyenne de classe est la moyenne des moyennes des étudiants, pas la moyenne de toutes les notes individuelles

**✅ Liste de vérification**
- ✅ `weighted_average` gère les listes de notes vides avec élégance
- ✅ Chaque score est multiplié par sa pondération avant la somme
- ✅ `class_average` renvoie la moyenne des GPA de tous les étudiants
- ✅ Les résultats sont arrondis à 2 décimales

**🤔 Question(s) socratique(s)**
- Si deux devoirs ont tous deux une pondération de 0,3, chacun devrait-il compter pour 30 % ou les devoirs devraient-ils compter collectivement pour 30 % ? Comment repenserais-tu le modèle pour gérer les deux approches ?

---

## Étape 4 : Statistiques de classe

Les GPA bruts sont utiles, mais les enseignants ont aussi besoin de voir la vue d'ensemble : comment la classe se comporte-t-elle globalement ? Quelle est la note médiane ? Combien d'étudiants obtiennent des A contre des F ?

### 4.1 Conversion en note lettrée

**👟 Indice de départ :** Écris une fonction qui mappe un score numérique à une note lettrée en utilisant des seuils standards.

```python
def letter_grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"
```

**🎯 Résultat attendu :**

```python
>>> letter_grade(95)
'A'
>>> letter_grade(82)
'B'
>>> letter_grade(55)
'F'
```

### 4.2 Méthode de statistiques de classe

**👟 Indice de départ :** Ajoute une méthode à `Gradebook` qui calcule la moyenne, la médiane, le min, le max et la distribution des notes.

```python
import statistics

# Add this method to the Gradebook class:
def class_stats(self):
    student_averages = [
        weighted_average(s.grades)
        for s in self.students.values()
        if s.grades
    ]
    if not student_averages:
        return {"average": 0, "median": 0, "min": 0, "max": 0, "distribution": {}}

    dist = {}
    for avg in student_averages:
        lg = letter_grade(avg)
        dist[lg] = dist.get(lg, 0) + 1

    return {
        "average": round(statistics.mean(student_averages), 2),
        "median": round(statistics.median(student_averages), 2),
        "min": round(min(student_averages), 2),
        "max": round(max(student_averages), 2),
        "distribution": dist,
    }
```

**🎯 Résultat attendu :**

```python
>>> stats = gb.class_stats()
>>> stats
{'average': 87.07, 'median': 87.07, 'min': 81.31, 'max': 92.83, 'distribution': {'A': 1, 'B': 1}}
```

**🩹 Si ça ne marche pas :**
- Assure-toi d'importer `statistics` en haut du fichier
- La distribution compte les notes lettrées basées sur la moyenne pondérée de chaque étudiant, pas les notes individuelles
- Utilise `dist.get(lg, 0) + 1` pour gérer la première occurrence de chaque note lettrée

**✅ Liste de vérification**
- ✅ `letter_grade` mappe les scores en A/B/C/D/F
- ✅ `class_stats` renvoie la moyenne, la médiane, le min, le max et la distribution
- ✅ Les listes de notes vides sont filtrées avant le calcul des statistiques
- ✅ La distribution des notes est un dictionnaire mappant les lettres aux comptes

**🤔 Question(s) socratique(s)**
- La médiane est 87,07 dans cet exemple. Que te dit-elle sur la classe que la moyenne seule ne dit pas ?

---

## Étape 5 : Générer des bulletins

Un carnet de notes n'est utile que si tu peux présenter l'information clairement. Construisons des bulletins formatés qui montrent les notes de chaque étudiant, sa moyenne pondérée et sa note lettrée.

### 5.1 Bulletin d'un étudiant individuel

**👟 Indice de départ :** Construis une méthode qui renvoie une chaîne formatée montrant toutes les notes et la moyenne finale d'un étudiant.

```python
# Add this method to the Student class:
def report_card(self):
    lines = [f"Report Card: {self.name}", "=" * 40]
    if not self.grades:
        lines.append("No grades recorded.")
        return "\n".join(lines)

    by_category = {}
    for g in self.grades:
        by_category.setdefault(g.category, []).append(g)

    for cat, grades in sorted(by_category.items()):
        avg = weighted_average(grades)
        lines.append(f"  {cat.title():12s}  avg: {avg:.1f}  ({len(grades)} grades)")

    overall = weighted_average(self.grades)
    lines.append("-" * 40)
    lines.append(f"  Overall GPA: {overall:.2f} ({letter_grade(overall)})")
    return "\n".join(lines)
```

**🎯 Résultat attendu :**

```python
>>> print(alice.report_card())
Report Card: Alice
========================================
  Exam         avg: 87.0  (1 grades)
  Homework     avg: 91.5  (2 grades)
----------------------------------------
  Overall GPA: 90.54 (A)
```

**🩹 Si ça ne marche pas :**
- Utilise `.title()` sur les noms de catégories pour que « homework » devienne « Homework »
- Le GPA global est la moyenne pondérée sur toutes les notes, pas une simple moyenne des moyennes de catégories

### 5.2 Bulletin de classe complet

**👟 Indice de départ :** Ajoute une méthode à `Gradebook` qui imprime le bulletin de chaque étudiant.

```python
# Add this method to the Gradebook class:
def full_report(self):
    print(f"\n{'=' * 50}")
    print(f"  {self.name} — Full Report")
    print(f"{'=' * 50}\n")
    for name in sorted(self.students):
        student = self.students[name]
        if student.grades:
            print(student.report_card())
            print()
    stats = self.class_stats()
    print(f"{'=' * 50}")
    print(f"  Class Statistics")
    print(f"{'=' * 50}")
    print(f"  Average: {stats['average']}")
    print(f"  Median:  {stats['median']}")
    print(f"  Min:     {stats['min']}")
    print(f"  Max:     {stats['max']}")
    print(f"  Distribution: {stats['distribution']}")
    print()
```

**🎯 Résultat attendu :**

```
==================================================
  CS101 Fall 2025 — Full Report
==================================================

Report Card: Alice
========================================
  Exam         avg: 87.0  (1 grades)
  Homework     avg: 91.5  (2 grades)
----------------------------------------
  Overall GPA: 90.54 (A)

Report Card: Bob
========================================
  Exam         avg: 92.0  (1 grades)
  Homework     avg: 78.0  (1 grades)
----------------------------------------
  Overall GPA: 81.31 (B)

==================================================
  Class Statistics
==================================================
  Average: 87.07
  Median:  87.07
  Min:     81.31
  Max:     92.83
  Distribution: {'A': 1, 'B': 1}
```

**🩹 Si ça ne marche pas :**
- Trie les étudiants alphabétiquement par nom avant d'imprimer
- Saute les étudiants sans notes dans la section par étudiant
- Assure-toi que la section des statistiques apparaît en bas

**✅ Liste de vérification**
- ✅ `report_card` montre les notes groupées par catégorie
- ✅ `full_report` imprime tous les étudiants et les statistiques de classe
- ✅ Les moyennes de catégories sont affichées à côté du GPA global
- ✅ La sortie est proprement formatée avec des séparateurs

**🤔 Question(s) socratique(s)**
- Comment modifierais-tu le bulletin pour montrer chaque score de devoir individuel au lieu de seulement la moyenne de catégorie ?

---

## Étape 6 : Enregistrer et charger

Un carnet de notes qui perd toutes ses données quand tu fermes le programme n'est pas très utile. Ajoutons la persistance CSV pour que les données survivent entre les sessions. Nous enregistrerons chaque note comme une ligne avec le nom de l'étudiant, la catégorie, le score et la pondération.

### 6.1 Enregistrer en CSV

**👟 Indice de départ :** Parcours tous les étudiants et leurs notes, en écrivant chacun comme une ligne CSV.

```python
import csv

# Add this method to the Gradebook class:
def save(self, filename):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["student", "category", "score", "weight"])
        for name in sorted(self.students):
            student = self.students[name]
            for grade in student.grades:
                writer.writerow([
                    student.name,
                    grade.category,
                    grade.score,
                    grade.weight,
                ])
    print(f"Saved {len(self.students)} students to {filename}")
```

**🎯 Résultat attendu :**

```python
>>> gb.save("grades.csv")
Saved 2 students to grades.csv
```

Le fichier CSV contiendra :

```
student,category,score,weight
Alice,homework,95,0.3
Alice,exam,87,0.7
Alice,homework,88,0.3
Bob,homework,78,0.3
Bob,exam,92,0.7
```

### 6.2 Charger depuis le CSV

**👟 Indice de départ :** Lis le fichier CSV et reconstruis les étudiants et les notes. Gère le cas où le fichier n'existe pas.

```python
# Add this class method to the Gradebook class:
@classmethod
def load(cls, filename):
    gb = cls(filename.replace(".csv", ""))
    try:
        with open(filename, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                gb.add_student(row["student"])
                gb.add_grade(
                    row["student"],
                    row["category"],
                    float(row["score"]),
                    float(row["weight"]),
                )
    except FileNotFoundError:
        print(f"File '{filename}' not found. Starting with empty gradebook.")
    return gb
```

**🎯 Résultat attendu :**

```python
>>> loaded = Gradebook.load("grades.csv")
>>> loaded.class_average()
87.07
>>> len(loaded.students)
2
```

**🩹 Si ça ne marche pas :**
- Utilise `csv.DictReader` pour pouvoir accéder aux colonnes par nom (`row["student"]`) plutôt que par index
- Convertis `score` et `weight` en `float` — le CSV lit tout comme des chaînes
- Utilise un `@classmethod` pour pouvoir appeler `Gradebook.load(...)` sans avoir d'instance existante

**✅ Liste de vérification**
- ✅ `save` écrit une ligne d'en-tête plus une ligne par note
- ✅ `load` utilise `DictReader` et reconstruit le carnet de notes complet
- ✅ Les fichiers manquants sont gérés avec élégance avec un message
- ✅ Les valeurs numériques sont converties de chaînes en flottants

**🤔 Question(s) socratique(s)**
- Que se passe-t-il si tu enregistres un carnet de notes, édites le CSV à la main avec un score invalide, puis le charges ? Comment ajouterais-tu la validation ?

---

## Étape 7 : Visualiser les résultats

Les nombres dans un terminal vont bien, mais un graphique rend les distributions de notes immédiatement claires. Nous utiliserons matplotlib pour créer un diagramme en barres montrant combien d'étudiants ont obtenu chaque note lettrée.

### 7.1 Diagramme en barres de la distribution des notes

**👟 Indice de départ :** Utilise le dictionnaire de distribution de `class_stats` et passe-le à `plt.bar`.

```python
import matplotlib.pyplot as plt

# Add this method to the Gradebook class:
def plot_distribution(self):
    stats = self.class_stats()
    dist = stats["distribution"]
    if not dist:
        print("No data to plot.")
        return

    grades_order = ["A", "B", "C", "D", "F"]
    counts = [dist.get(g, 0) for g in grades_order]
    colors = ["#2ecc71", "#3498db", "#f1c40f", "#e67e22", "#e74c3c"]

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(grades_order, counts, color=colors, edgecolor="white", linewidth=1.2)

    for bar, count in zip(bars, counts):
        if count > 0:
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.1,
                str(count),
                ha="center",
                va="bottom",
                fontweight="bold",
                fontsize=12,
            )

    ax.set_title(f"{self.name} — Grade Distribution", fontsize=14, fontweight="bold")
    ax.set_xlabel("Letter Grade")
    ax.set_ylabel("Number of Students")
    ax.set_ylim(0, max(counts) + 1)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    plt.savefig("grade_distribution.png", dpi=150)
    plt.show()
    print("Chart saved as grade_distribution.png")
```

**🎯 Résultat attendu :**

Une fenêtre de diagramme apparaîtra montrant :

```
Number of Students
  2 |
  1 |        ■
    |     ■     ■
  0 +--+--+--+--+--
       A  B  C  D  F
     Letter Grade
```

Le graphique sera aussi enregistré comme `grade_distribution.png`.

**🩹 Si ça ne marche pas :**
- Assure-toi d'avoir `matplotlib` installé (`pip install matplotlib`)
- Si aucun graphique n'apparaît, essaie `plt.show()` dans un terminal séparé ou utilise `plt.savefig` uniquement
- L'appel `tight_layout()` empêche les étiquettes d'être coupées

### 7.2 Diagramme de comparaison des GPA des étudiants

**👟 Indice de départ :** Crée un diagramme en barres horizontal comparant les GPA de tous les étudiants.

```python
# Add this method to the Gradebook class:
def plot_student_comparison(self):
    names = []
    averages = []
    for name in sorted(self.students):
        student = self.students[name]
        if student.grades:
            names.append(name)
            averages.append(weighted_average(student.grades))

    if not names:
        print("No data to plot.")
        return

    fig, ax = plt.subplots(figsize=(8, max(3, len(names) * 0.6)))
    colors = ["#2ecc71" if avg >= 90 else "#3498db" if avg >= 80 else "#f1c40f" if avg >= 70 else "#e74c3c" for avg in averages]
    bars = ax.barh(names, averages, color=colors, edgecolor="white", height=0.5)

    for bar, avg in zip(bars, averages):
        ax.text(
            bar.get_width() + 0.5,
            bar.get_y() + bar.get_height() / 2,
            f"{avg:.1f} ({letter_grade(avg)})",
            va="center",
            fontsize=10,
        )

    ax.set_title(f"{self.name} — Student GPAs", fontsize=14, fontweight="bold")
    ax.set_xlabel("Weighted Average")
    ax.set_xlim(0, 100)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    plt.savefig("student_comparison.png", dpi=150)
    plt.show()
    print("Chart saved as student_comparison.png")
```

**🎯 Résultat attendu :**

Un diagramme en barres horizontal montrant le GPA de chaque étudiant avec un code couleur (vert pour A, bleu pour B, jaune pour C, rouge pour en dessous de C).

**🩹 Si ça ne marche pas :**
- Si les barres sont trop fines, augmente le paramètre `height` dans `barh`
- Les couleurs sont déterminées par la plage de GPA — vérifie la compréhension de liste conditionnelle
- Si les noms se chevauchent, augmente la hauteur de la figure selon le nombre d'étudiants

**✅ Liste de vérification**
- ✅ `plot_distribution` crée un diagramme en barres des comptes de notes lettrées
- ✅ `plot_student_comparison` crée un diagramme en barres horizontal des GPA des étudiants
- ✅ Les graphiques sont enregistrés comme fichiers PNG
- ✅ Les données vides sont gérées avec élégance

**🤔 Question(s) socratique(s)**
- Comment ajouterais-tu une ligne de repère à la moyenne de classe pour rendre plus facile de voir qui est au-dessus ou au-dessous de la moyenne ?

---

## 🧩 Défis

Prêt à aller plus loin ? Essaie ceci :

1. **Validation des pondérations** — Assure-toi que les pondérations des catégories totalisent 1,0 pour chaque étudiant. Si elles ne le font pas, préviens l'utilisateur et liste le total.

2. **Configuration des pondérations de catégories** — Permets à l'enseignant de définir des pondérations de catégories par défaut (par ex. devoirs = 30 %, examen = 70 %) pour ne pas avoir à spécifier la pondération à chaque fois qu'il ajoute une note.

3. **Export en HTML** — Génère un bulletin HTML imprimable avec des tableaux stylisés et des couleurs pour les notes lettrées. Utilise le formatage de chaîne de Python pour construire le HTML, puis ouvre-le dans un navigateur avec `webbrowser.open`.

---

## Ce que tu as appris

- **Modélisation de données par classes** — Représenté les étudiants, les notes et le carnet de notes lui-même comme des classes Python avec des méthodes claires
- **Moyennes pondérées** — Calculé des GPA qui respectent les pondérations de catégories, en gérant les cas limites comme les listes de notes vides
- **Analyse statistique** — Utilisé le module `statistics` de Python pour la moyenne et la médiane, et construit un compteur de distribution de notes personnalisé
- **Persistance CSV** — Enregistré et chargé les données du carnet de notes avec `csv.DictReader` et `csv.writer`
- **Visualisation de données** — Créé des diagrammes en barres avec matplotlib pour les distributions de notes et les comparaisons d'étudiants
- **Génération de bulletins** — Construit des bulletins texte formatés avec des notes groupées et des statistiques de synthèse

Tu as maintenant un carnet de notes pleinement fonctionnel que tu peux étendre avec des fonctionnalités comme des notifications par email, la gestion des courbes ou une interface web. L'architecture basée sur les classes rend chaque pièce facile à tester, modifier et réutiliser.