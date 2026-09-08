---
title: "Optimiseur de Prompts LLM"
description: "Affine automatiquement les prompts en utilisant des tests A/B, des exemples few-shot et des modèles de chaîne de pensée."
---

# ✨ Construire un Optimiseur de Prompts LLM

Un prompt médiocre produit des réponses médiocres. Les ingénieurs ajustent souvent les prompts à la main par essais et erreurs, mais c'est lent et non reproductible. Ce projet construit un outil CLI qui prend un prompt brut, génère plusieurs variantes structurées (few-shot, chaîne de pensée, basé sur un rôle), les note contre un ensemble de réponses de référence et rapporte quelle variante performe le mieux.

Cela suppose Python 101 et l'aisance avec pandas issu de Analyse de Données. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Mettre en place un projet avec `uv` et installer les dépendances d'optimisation.
2. Définir un harnais de notation avec entrées de test et réponses attendues.
3. Générer des variantes de prompts : few-shot, chaîne de pensée et basé sur un rôle.
4. Noter chaque variante contre l'ensemble de référence.
5. Classer les variantes et exporter le meilleur prompt.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — c'est un outil CLI qui tourne hors ligne contre un modèle simulé.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/llm-prompt-optimizer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/llm-prompt-optimizer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fllm-prompt-optimizer%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python, pandas et click. Le projet s'exécute contre un modèle simulé pour que toute la boucle fonctionne hors ligne, sans clés API.

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
uv init llm-prompt-optimizer
cd llm-prompt-optimizer
uv add pandas click
```

### Crée la structure du projet

```bash
mkdir -p optimizer
touch optimizer/__init__.py optimizer/data.py optimizer/variants.py optimizer/model.py optimizer/scoring.py optimizer/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `llm-prompt-optimizer/` existe avec `pyproject.toml` et les dépendances installées.
- ✅ Le répertoire `optimizer/` a tous les fichiers de modules requis.

## Étape 1 : Définis le jeu de données de référence

Pour noter les prompts, tu as besoin d'entrées de test avec des réponses connues-bonnes. C'est le benchmark contre lequel tes variantes de prompts sont mesurées.

### 1.1 Crée l'ensemble de référence

**👟 Indice de départ :** Crée `optimizer/data.py`.

```python
# optimizer/data.py
from dataclasses import dataclass

@dataclass
class Question:
    input: str
    expected: str

def gold_set() -> list[Question]:
    return [
        Question("What is 6 * 7?", "42"),
        Question("Capital of Japan?", "Tokyo"),
        Question("What is 9 + 4?", "13"),
        Question("How many sides does a triangle have?", "3"),
    ]
```

**🎯 Résultat attendu :** `gold_set()` retourne quatre questions avec réponses attendues.

**🩹 Si ça ne marche pas :** Si les réponses attendues sont fausses, la notation devient dénuée de sens. Vérifie que `6 * 7` fait bien `42`.

### 1.2 Vérifie l'ensemble de référence

**✅ Liste de vérification**

- ✅ Toutes les questions ont des entrées et réponses attendues non vides.
- ✅ Les réponses couvrent les catégories maths et faits.

**🤔 Question(s) socratique(s)**

- Pourquoi est-il important que l'ensemble de référence couvre plus d'un type de question ?

## Étape 2 : Génère des variantes de prompts

Différentes structures de prompt déclenchent différents comportements. Génère quelques variantes standard de façon programmatique.

### 2.1 Construis le générateur de variantes

**👟 Indice de départ :** Crée `optimizer/variants.py`.

```python
# optimizer/variants.py
from dataclasses import dataclass

@dataclass
class PromptVariant:
    name: str
    build: object


def build_few_shot() -> PromptVariant:
    examples = (
        "Q: What is 2 + 2?\nA: 4\n"
        "Q: What is the capital of Italy?\nA: Rome\n"
    )
    def make(q: str) -> str:
        return f"{examples}Q: {q}\nA:"
    return PromptVariant("few-shot", make)


def build_chain_of_thought() -> PromptVariant:
    def make(q: str) -> str:
        return f"Think step by step.\nQ: {q}\nA:"
    return PromptVariant("chain-of-thought", make)


def build_role_based() -> PromptVariant:
    def make(q: str) -> str:
        return f"You are a precise mathematics and trivia assistant.\nQ: {q}\nA:"
    return PromptVariant("role-based", make)
```

**🎯 Résultat attendu :** Chaque `build_*` retourne une variante nommée dont `build(prompt)` injecte une structure autour de la question brute.

**🩹 Si ça ne marche pas :** Si les variantes semblent identiques, la structure injectée ne fait rien d'utile — élargis les différences.

### 2.2 Vérifie les variantes

**✅ Liste de vérification**

- ✅ Les variantes `few-shot`, `chain-of-thought` et `role-based` existent toutes.
- ✅ Le constructeur de chaque variante accepte une question et retourne un prompt complet.

**🤔 Question(s) socratique(s)**

- Les exemples few-shot sont codés en dur. Quand sélectionner automatiquement des exemples par entrée serait-il meilleur ?

## Étape 3 : Construis le modèle simulé

Un modèle qui répond correctement quand le prompt contient un indice (comme le mot-clé de la réponse) te permet de voir comment la structure du prompt change les résultats, hors ligne.

### 3.1 Définis le modèle

**👟 Indice de départ :** Crée `optimizer/model.py`.

```python
# optimizer/model.py
import re

class MockModel:
    name = "mock-llm"

    def generate(self, prompt: str) -> str:
        numbers = re.findall(r"(\d+)\s*[*+]\s*(\d+)", prompt)
        if numbers:
            a, b = numbers[-1]
            op = "*" if "*" in prompt else "+"
            a, b = int(a), int(b)
            return str(a * b) if op == "*" else str(a + b)
        if "capital" in prompt.lower():
            return "Tokyo"
        return "unknown"
```

Le simulé retourne le résultat mathématique quand une expression arithmétique apparaît et les faits depuis une petite table de correspondance. Il est délibérément naïf — c'est suffisant pour démontrer l'optimisation.

**🎯 Résultat attendu :** `MockModel().generate("Think step by step. Q: What is 6 * 7? A:")` retourne `"42"`.

**🩹 Si ça ne marche pas :** Si la détection `*`/`+` choisit le mauvais opérateur, vérifie que l'expression régulière capture les deux opérandes.

### 3.2 Vérifie le modèle

**✅ Liste de vérification**

- ✅ Le modèle répond à l'arithmétique depuis le prompt.
- ✅ Le modèle répond à un fait connu.
- ✅ Le modèle retourne `"unknown"` pour une entrée non reconnue.

**🤔 Question(s) socratique(s)**

- Comment le simulé devrait-il changer pour simuler un modèle qui devient *meilleur* avec la chaîne de pensée ?

## Étape 4 : Note les variantes de prompts

Exécute chaque variante contre l'ensemble de référence et mesure la précision.

### 4.1 Implémente le scoreur

**👟 Indice de départ :** Crée `optimizer/scoring.py`.

```python
# optimizer/scoring.py
import re
import pandas as pd
from optimizer.data import Question


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def evaluate(variant, model, gold: list[Question]) -> dict:
    correct = 0
    total = len(gold)
    for q in gold:
        full = variant.build(q.input)
        answer = model.generate(full)
        if normalize(answer) == normalize(q.expected):
            correct += 1
    return {"variant": variant.name, "correct": correct, "total": total,
            "accuracy": correct / total}


def evaluate_all(variants, model, gold: list[Question]) -> pd.DataFrame:
    rows = [evaluate(v, model, gold) for v in variants]
    return pd.DataFrame(rows).sort_values("accuracy", ascending=False, kind="stable")
```

**🎯 Résultat attendu :** `evaluate_all([v1, v2, v3], model, gold_set())` retourne un DataFrame classant les variantes par précision.

**🩹 Si ça ne marche pas :** Si tout obtient le même score, les réponses du simulé ne dépendent pas de la structure du prompt — c'est correct pour la démo, mais ajoute une variante à laquelle le simulé répond différemment.

### 4.2 Vérifie la notation

**✅ Liste de vérification**

- ✅ Chaque variante a une précision calculée.
- ✅ Les résultats sont triés du meilleur au premier.
- ✅ Chaque variante est évaluée sur tout l'ensemble de référence.

**🤔 Question(s) socratique(s)**

- La précision seule confond « jamais répondu » avec « répondu faux ». Quelle seconde métrique suivrais-tu ?

## Étape 5 : Exporte le meilleur prompt

L'optimisation n'est utile que si elle change ce que tu exécutes réellement. Exporte la meilleure variante pour une utilisation en aval.

### 5.1 Construis l'exporteur

**👟 Indice de départ :** Crée `optimizer/cli.py`.

```python
# optimizer/cli.py
import json
import click
from optimizer.data import gold_set
from optimizer.variants import build_few_shot, build_chain_of_thought, build_role_based
from optimizer.model import MockModel
from optimizer.scoring import evaluate_all


@click.command()
@click.option("--out", default="best_prompt.json", help="Output file")
def optimize(out: str):
    model = MockModel()
    variants = [build_few_shot(), build_chain_of_thought(), build_role_based()]
    result = evaluate_all(variants, model, gold_set())
    best = result.iloc[0]
    payload = {
        "best_variant": best["variant"],
        "accuracy": float(best["accuracy"]),
        "full_report": result.to_dict(orient="records"),
    }
    with open(out, "w") as f:
        json.dump(payload, f, indent=2)
    click.echo(click.style(f"Best: {best['variant']} ({best['accuracy']:.0%})", fg="green"))
```

**🎯 Résultat attendu :** Exécuter `uv run python -m optimizer.cli` écrit `best_prompt.json` avec la variante gagnante et le rapport complet.

**🩹 Si ça ne marche pas :** Si aucun fichier de sortie n'apparaît, vérifie le répertoire de travail et que `out` s'y résout.

### 5.2 Vérifie le CLI

**✅ Liste de vérification**

- ✅ `uv run python -m optimizer.cli` écrit `best_prompt.json`.
- ✅ Le rapport classe toutes les variantes par précision.
- ✅ La meilleure variante est identifiée dans la sortie du terminal.

**🤔 Question(s) socratique(s)**

- Comment rapporterais-tu des ventilations par question, pas seulement des totaux, pour voir sur *quelles* questions chaque variante gagne ?

## ⚠️ Pièges courants

- **Imports circulaires.** Un `optimizer/router.py` qui importe à la fois le modèle et les variantes peut se bloquer. Importe le modèle au fond de la fonction qui en a besoin, ou garde `cli.py` comme orchestrateur de premier niveau.
- **Attentes excessivement simulées.** Un simulé qui répond parfaitement à tout masque les vraies différences de prompts. Fais répondre le simulé à la structure du prompt pour que l'optimiseur optimise réellement.
- **Égalités de tri.** Si toutes les variantes obtiennent le même score, le tri est arbitraire. Ajoute une métrique secondaire (par exemple, l'efficacité des tokens) pour départager.
- **Exemples codés en dur.** Des exemples few-shot qui fuient la réponse du test (« que fait 6*7 → 42 ») gonflent la précision. Garde l'ensemble de référence séparé du réservoir few-shot.
- **Garde-fou `__main__`.** `app.run` et les points d'entrée CLI ne s'exécutent que quand le module est lancé directement. Enveloppe-les dans `if __name__ == "__main__"` ou exécute via `python -m`.

## Ce que tu viens de construire

Une boucle d'optimisation de prompts : un jeu de données de référence, des générateurs de variantes programmatiques (few-shot, chaîne de pensée, basé sur un rôle), un modèle simulé hors ligne, un scoreur de précision et un CLI qui classe les variantes et exporte la meilleure. C'est la version automatisée de ce que les ingénieurs de prompts font à la main — et cela rend tout le processus reproductible et mesurable.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/llm-prompt-optimizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/llm-prompt-optimizer) dans le dépôt du cours a une version plus riche avec de vrais adaptateurs de modèles, une notation de l'efficacité des tokens et le CLI câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Pointe l'optimiseur vers une vraie API LLM pour le voir optimiser sur des tâches réellement dépendantes du modèle.
- Ajoute une métrique de comptage de tokens pour pouvoir préférer le prompt le moins cher qui atteint quand même la précision cible.
- Construis une couche de versionnage qui enregistre chaque variante de prompt et son score, comme un historique git pour les prompts.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓