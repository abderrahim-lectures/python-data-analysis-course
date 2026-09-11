---
title: "Cahier de Laboratoire Numérique"
description: "Enregistrez des expériences avec des données structurées, des calculs et des pipelines d'analyse reproductibles."
---

# 📓 Construire un Cahier de Laboratoire Numérique

Les scientifiques suivent les expériences, les hypothèses et les résultats versionnés. Un cahier de laboratoire numérique fait la même chose mais de façon structurée : chaque expérience reçoit un modèle, les mesures alimentent les calculs et les résultats s'exportent comme des rapports reproductibles. Ce projet construit exactement cela.

Cela suppose Python 101 et l'aisance avec pandas issu de Analyse de Données. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Mettre en place un projet avec `uv` et installer les dépendances du cahier et de l'export.
2. Définir des modèles d'expériences structurés avec des champs typés.
3. Ajouter un moteur de calcul intégré pour exécuter des analyses sur les mesures.
4. Implémenter un historique de versions qui suit chaque modification.
5. Exporter les expériences vers un rapport PDF prêt pour la publication.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — c'est un outil CLI qui écrit des fichiers d'expériences et des PDF.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lab-notebook/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lab-notebook/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flab-notebook%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python, pandas et ReportLab.

### Installe `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Met en place le projet

```bash
uv init lab-notebook
cd lab-notebook
uv add pandas reportlab click
```

`pandas` alimente le moteur de calcul. `reportlab` génère les exports PDF. `click` fournit le CLI.

### Crée la structure du projet

```bash
mkdir -p notebook
touch notebook/__init__.py notebook/model.py notebook/calculations.py notebook/store.py notebook/export.py notebook/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `lab-notebook/` existe avec `pyproject.toml` et toutes les dépendances installées.
- ✅ Le répertoire `notebook/` a tous les fichiers de modules requis.

## Étape 1 : Définis des modèles d'expériences structurés

Une expérience a une hypothèse, des conditions, des mesures et un résultat. Les encoder comme une dataclass typée donne à chaque expérience une forme cohérente.

### 1.1 Crée le modèle d'expérience

**👟 Indice de départ :** Crée `notebook/model.py`.

```python
# notebook/model.py
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Measurement:
    label: str
    value: float
    unit: str = ""

@dataclass
class Experiment:
    title: str
    hypothesis: str
    measurements: list[Measurement] = field(default_factory=list)
    created: str = field(default_factory=lambda: datetime.now().isoformat())
    versions: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "hypothesis": self.hypothesis,
            "measurements": [m.__dict__ for m in self.measurements],
            "created": self.created,
            "versions": self.versions,
        }
```

**🎯 Résultat attendu :** `Experiment("Grow rate", "Light increases growth")` crée une expérience structurée et sérialisable.

**🩹 Si ça ne marche pas :** Si `to_dict` échoue, vérifie l'ordre des champs de la dataclass.

### 1.2 Vérifie le modèle

**✅ Liste de vérification**

- ✅ `Experiment` accepte un titre, une hypothèse et des mesures optionnelles.
- ✅ `to_dict()` retourne un dict sérialisable simple.
- ✅ `created` a pour défaut l'horodatage courant.

**🤔 Question(s) socratique(s)**

- Comment ajouterais-tu une validation pour que les mesures ne puissent pas être négatives quand cela casse le sens physique de l'expérience ?

## Étape 2 : Construis le moteur de calcul

Le moteur exécute une analyse sur les mesures : moyenne, écart type et une formule de ligne de tendance.

### 2.1 Crée les calculs

**👟 Indice de départ :** Crée `notebook/calculations.py`.

```python
# notebook/calculations.py
import statistics
from notebook.model import Experiment


def analyze(exp: Experiment) -> dict:
    values = [m.value for m in exp.measurements]
    if not values:
        return {"error": "no measurements"}
    result = {
        "count": len(values),
        "min": min(values),
        "max": max(values),
        "mean": statistics.mean(values),
        "stdev": statistics.stdev(values) if len(values) > 1 else 0.0,
    }
    result["cv"] = result["stdev"] / result["mean"] if result["mean"] else 0
    return result


def trend_formula(values: list[float]) -> str:
    """Least-squares slope/intercept as a readable y = mx + b string."""
    n = len(values)
    if n < 2:
        return "y = N/A (need >= 2 points)"
    xs = list(range(n))
    x_mean = sum(xs) / n
    y_mean = sum(values) / n
    slope = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, values)) / \
            sum((x - x_mean) ** 2 for x in xs)
    intercept = y_mean - slope * x_mean
    return f"y = {slope:.3f}x + {intercept:.3f}"
```

**🎯 Résultat attendu :** `analyze(exp)` retourne count, min, max, moyenne et écart type ; `trend_formula` retourne une équation lisible.

**🩹 Si ça ne marche pas :** Si `stdev` échoue sur un point unique, le garde-fou `len(values) > 1` gère le cas.

### 2.2 Vérifie les calculs

**✅ Liste de vérification**

- ✅ `analyze` retourne des statistiques pour une expérience peuplée.
- ✅ Les expériences vides retournent un dict d'erreur convivial.
- ✅ `trend_formula` produit une chaîne `y = mx + b` pour ≥2 points.

**🤔 Question(s) socratique(s)**

- Quelle statistique supplémentaire un scientifique de paillasse attendrait-il au-delà de la moyenne et de l'écart type ?

## Étape 3 : Suis les versions

À chaque fois qu'une expérience change, fais-en une photographie. Cela rend chaque état antérieur récupérable.

### 3.1 Ajoute le versionnage

**👟 Indice de départ :** Crée `notebook/store.py`.

```python
# notebook/store.py
import json, copy
from datetime import datetime
from notebook.model import Experiment


class NotebookStore:
    def __init__(self, path="notebook.json"):
        self.path = path
        self.experiments: dict[str, Experiment] = {}

    def add(self, exp: Experiment):
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        self.experiments[exp.title] = exp

    def update(self, exp: Experiment, **changes):
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        for key, value in changes.items():
            setattr(exp, key, value)

    def history(self, title) -> list[dict]:
        exp = self.experiments.get(title)
        return exp.versions if exp else []

    def rollback(self, title, version_index):
        exp = self.experiments[title]
        version = exp.versions[version_index]["snapshot"]
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        exp.measurements = [type(exp.measurements[0])(**m) for m in version["measurements"]]
        exp.hypothesis = version["hypothesis"]

    def save(self):
        with open(self.path, "w") as f:
            json.dump({k: v.to_dict() for k, v in self.experiments.items()}, f, indent=2)
```

**🎯 Résultat attendu :** `store.update(exp, hypothesis="New idea")` enregistre l'état antérieur, et `rollback` le restaure.

**🩹 Si ça ne marche pas :** Si rollback plante, les mesures de la photographie peuvent ne pas se reconstruire proprement — vérifie les clés du dict.

### 3.2 Vérifie le versionnage

**✅ Liste de vérification**

- ✅ Chaque `add`/`update` ajoute une photographie de version.
- ✅ `history` retourne la piste des versions.
- ✅ `rollback` restaure un état antérieur et enregistre la transition.

**🤔 Question(s) socratique(s)**

- Le versionnage actuel garde des photographies complètes. Quand une approche par différences serait-elle meilleure, et pourquoi la complexité supplémentaire ?

## Étape 4 : Exporte vers le PDF

Un cahier de laboratoire n'est utile que si d'autres peuvent le lire. Génère un rapport propre à partir des données d'expérience.

### 4.1 Crée l'exporteur PDF

**👟 Indice de départ :** Crée `notebook/export.py`.

```python
# notebook/export.py
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from notebook.calculations import analyze
from notebook.model import Experiment


def export_pdf(exp: Experiment, out_path: str):
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(out_path, pagesize=A4)
    story = [
        Paragraph(exp.title, styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"<b>Hypothesis:</b> {exp.hypothesis}", styles["Normal"]),
        Spacer(1, 12),
    ]
    stats = analyze(exp)
    if "error" not in stats:
        story.append(Paragraph(f"Mean: {stats['mean']:.3f}  |  Stdev: {stats['stdev']:.3f}", styles["Normal"]))
    rows = [["Label", "Value", "Unit"]]
    rows += [[m.label, str(m.value), m.unit] for m in exp.measurements]
    story.append(Table(rows))
    doc.build(story)
```

**🎯 Résultat attendu :** `export_pdf(exp, "report.pdf")` écrit un PDF avec le titre, l'hypothèse, les statistiques et un tableau de mesures.

**🩹 Si ça ne marche pas :** Si le tableau est mal formé, vérifie les largeurs de rangées et que chaque rangée a le bon nombre de colonnes.

### 4.2 Vérifie l'export

**✅ Liste de vérification**

- ✅ Un fichier PDF est écrit dans `out_path`.
- ✅ Le titre, l'hypothèse et les statistiques y apparaissent.
- ✅ Les mesures se rendent comme un tableau.

**🤔 Question(s) socratique(s)**

- Qu'ajouterais-tu à un rapport « prêt pour la publication » : une section méthode ? Une figure ? Une déclaration de reproductibilité ?

## ⚠️ Pièges courants

- **Mesures par défaut mutables.** Une `list` comme valeur par défaut de dataclass est partagée entre les instances. Utilise `field(default_factory=list)` comme montré.
- **Oublier la photographie avant la mutation.** `update` tronque ou perd des données sauf si tu enregistres d'abord l'ancien état. Prends toujours la photographie avant de modifier.
- **Division par zéro dans le CV.** Quand la moyenne est 0, `cv` divise par zéro. Le garde-fou `if result["mean"] else 0` gère le cas.
- **Erreurs de saut de ligne de ReportLab.** Les longues chaînes sans coupure plantent Paragraph. Enveloppe le texte ou autorise le retour à la ligne dans les styles de cellules.
- **Données statistiquement vides.** `analyze` retourne `"error"` pour zéro mesure ; vérifie-le avant de supposer que les statistiques existent.

## Ce que tu viens de construire

Un cahier de laboratoire structuré : des modèles d'expériences typés, un moteur de statistiques qui calcule moyenne, écart type et lignes de tendance, un versionnage par photographies avec annulation et un exporteur PDF. Le résultat est un flux de travail d'analyse reproductible — enregistrer, calculer, versionner et partager — qui reflète la façon dont les équipes de recherche modernes travaillent réellement.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/lab-notebook/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/lab-notebook) dans le dépôt du cours a une version plus riche avec la génération de graphiques, un index de fiches consultable et le CLI câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute des graphiques matplotlib à l'export PDF pour que les résultats soient visuels, pas seulement tabulaires.
- Implémente une recherche en texte intégral sur toutes les expériences avec un simple index inversé.
- Persiste le cahier dans SQLite au lieu d'un fichier JSON plat pour des écritures concurrentes plus sûres.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓