---
title: "Constructeur de Graphe de Connaissances"
description: "Extrayez des entités et des relations du texte pour construire des graphes de connaissances interactifs."
---

# 🕸️ Construire un Constructeur de Graphe de Connaissances

Un graphe de connaissances transforme du texte non structuré en un réseau de faits connectés : « Ada Lovelace » et « machine analytique » deviennent des nœuds, et « a conçu » devient l'arête qui les relie. Ce projet construit un pipeline qui extrait les entités nommées des phrases, détecte les relations entre elles et rend l'ensemble comme un graphe interactif que tu peux explorer et interroger.

Cela suppose Python 101 et l'aisance avec pandas issu de Analyse de Données. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Mettre en place un projet avec `uv` et installer les dépendances NLP et de graphes.
2. Extraire les entités nommées du texte avec un modèle NLP pré-entraîné.
3. Détecter les relations entre les entités extraites.
4. Visualiser le graphe avec un diagramme nœuds-liens interactif.
5. Interroger le graphe pour trouver des chemins connectés et des voisins.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-graph-builder/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-graph-builder/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fknowledge-graph-builder%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python, spaCy et NetworkX.

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
uv init knowledge-graph-builder
cd knowledge-graph-builder
uv add spacy networkx matplotlib
```

`spacy` fournit la reconnaissance d'entités nommées. `networkx` contient la structure du graphe. `matplotlib` le rend. Tu auras aussi besoin du modèle spaCy :

```bash
uv run python -m spacy download en_core_web_sm
```

### Crée la structure du projet

```bash
mkdir -p kgraph
touch kgraph/__init__.py kgraph/entities.py kgraph/graph.py kgraph/build.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `knowledge-graph-builder/` existe avec `pyproject.toml` et toutes les dépendances installées.
- ✅ `spacy download en_core_web_sm` se termine sans erreur.
- ✅ Le répertoire `kgraph/` a tous les fichiers de modules requis.

## Étape 1 : Extrais les entités nommées

La reconnaissance d'entités nommées identifie les personnes (PER), les organisations (ORG) et les lieux (LOC) dans le texte. spaCy fait cela nativement.

### 1.1 Charge le modèle et extrais les entités

**👟 Indice de départ :** Crée `kgraph/entities.py`.

```python
# kgraph/entities.py
import spacy

class EntityExtractor:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")

    def extract(self, text: str) -> list[dict]:
        doc = self.nlp(text)
        entities = []
        for ent in doc.ents:
            entities.append({"label": ent.label_, "text": ent.text})
        return entities

    def unique_entities(self, text: str) -> list[dict]:
        seen = {}
        for ent in self.extract(text):
            key = (ent["label"], ent["text"].lower())
            if key not in seen:
                seen[key] = {"label": ent["label_"], "id": len(seen) + 1}
        return list(seen.values())
```

**🎯 Résultat attendu :** `EntityExtractor().extract("Ada Lovelace worked at Babbage's Analytical Engine in London.")` retourne des entités incluant une personne et un lieu.

**🩹 Si ça ne marche pas :** Si tu n'obtiens aucune entité, le modèle ne reconnaît peut-être pas les noms propres de ta phrase d'exemple, essaie une phrase plus riche.

### 1.2 Vérifie l'extraction d'entités

**✅ Liste de vérification**

- ✅ `extract` retourne une liste non vide pour une phrase avec des noms propres.
- ✅ Les étiquettes d'entités comme `PER`, `ORG`, `LOC` apparaissent.
- ✅ `unique_entities` déduplique les mentions répétées.

**🤔 Question(s) socratique(s)**

- Le petit modèle reconnaît mieux les figures politiques que les noms techniques de niche. Comment l'étendrais-tu avec des règles personnalisées pour ton domaine ?

## Étape 2 : Construis la structure du graphe

Les entités deviennent des nœuds ; la co-occurrence dans une phrase devient une arête.

### 2.1 Crée le graphe

**👟 Indice de départ :** Crée `kgraph/graph.py`.

```python
# kgraph/graph.py
import networkx as nx

class KnowledgeGraph:
    def __init__(self):
        self.graph = nx.Graph()

    def add_node(self, entity_id: int, label: str, text: str):
        self.graph.add_node(entity_id, label=label, text=text)

    def add_edge(self, a: int, b: int, sentence: str):
        if self.graph.has_edge(a, b):
            self.graph[a][b]["weight"] += 1
        else:
            self.graph.add_edge(a, b, sentence=sentence, weight=1)

    def neighbors(self, entity_text: str) -> list[str]:
        node = self._find(entity_text)
        if node is None:
            return []
        return [self.graph.nodes[n]["text"] for n in self.graph.neighbors(node)]

    def _find(self, entity_text: str) -> int | None:
        lower = entity_text.lower()
        for n, data in self.graph.nodes(data=True):
            if data["text"].lower() == lower:
                return n
        return None
```

**🎯 Résultat attendu :** Ajouter quelques entités et arêtes construit un graphe que tu peux interroger avec `neighbors()`.

**🩹 Si ça ne marche pas :** Si `neighbors` retourne vide, le texte de l'entité ne correspond à aucun nœud, vérifie la casse et l'orthographe exacte.

### 2.2 Vérifie le graphe

**✅ Liste de vérification**

- ✅ `add_node` crée des nœuds de graphe avec `label` et `text`.
- ✅ `add_edge` incrémente `weight` sur les connexions répétées.
- ✅ `neighbors` retourne le texte des entités connectées.

**🤔 Question(s) socratique(s)**

- Pourquoi suivre le poids des arêtes ? Quelle information une arête de poids élevé te donne-t-elle sur un graphe de connaissances ?

## Étape 3 : Relie l'extraction au graphe

Maintenant connecte les deux : analyse les phrases, extrais les entités par phrase et crée des arêtes pour les entités partageant une phrase.

### 3.1 Construis le pipeline

**👟 Indice de départ :** Crée `kgraph/build.py`.

```python
# kgraph/build.py
import re
from kgraph.entities import EntityExtractor
from kgraph.graph import KnowledgeGraph


def build_graph(text: str) -> KnowledgeGraph:
    extractor = EntityExtractor()
    graph = KnowledgeGraph()
    for sentence in re.split(r'[.!?\n]+', text):
        sentence = sentence.strip()
        if not sentence:
            continue
        ents = extractor.unique_entities(sentence)
        for ent in ents:
            graph.add_node(ent["id"], ent["label"], ent["text"])
        for i in range(len(ents)):
            for j in range(i + 1, len(ents)):
                if ents[i]["id"] != ents[j]["id"]:
                    graph.add_edge(ents[i]["id"], ents[j]["id"], sentence)
    return graph
```

**🎯 Résultat attendu :** `build_graph(long_text)` retourne un graphe où les entités de la même phrase sont connectées.

**🩹 Si ça ne marche pas :** Si aucune arête ne se forme, l'expression régulière de découpe produit peut-être des phrases vides.

### 3.2 Vérifie le pipeline

**✅ Liste de vérification**

- ✅ Les entités sont ajoutées comme nœuds.
- ✅ Les entités partageant une phrase sont connectées par une arête.
- ✅ Les paires répétées incrémentent le poids.

**🤔 Question(s) socratique(s)**

- La co-occurrence est un détecteur de relations naïf mais efficace. Qu'apporterait une approche par analyse de dépendances ?

## Étape 4 : Visualise le graphe

Dessiner le graphe rend la structure lisible : les hubs apparaissent immédiatement.

### 4.1 Trace le graphe

**👟 Indice de départ :** Ajoute une fonction de visualisation.

```python
# kgraph/graph.py (continued)
import matplotlib.pyplot as plt

class KnowledgeGraph:
    # ... existing methods ...

    def draw(self, title="Knowledge Graph", figsize=(12, 8)):
        pos = nx.spring_layout(self.graph, seed=42)
        labels = {n: data["text"] for n, data in self.graph.nodes(data=True)}
        plt.figure(figsize=figsize)
        nx.draw_networkx_edges(self.graph, pos, alpha=0.3)
        nx.draw_networkx_nodes(self.graph, pos, node_size=800,
                               node_color="skyblue", alpha=0.9)
        nx.draw_networkx_labels(self.graph, pos, labels, font_size=9)
        plt.title(title)
        plt.axis("off")
        plt.tight_layout()
        return plt
```

**🎯 Résultat attendu :** `graph.draw()` rend un diagramme à ressort interactif avec des nœuds étiquetés.

**🩹 Si ça ne marche pas :** Si les nœuds se chevauchent beaucoup, augmente `figsize` ou ajuste `k` dans `spring_layout`.

### 4.2 Vérifie la visualisation

**✅ Liste de vérification**

- ✅ Les nœuds sont dessinés avec les étiquettes de texte des entités.
- ✅ Les arêtes connectent les entités liées.
- ✅ La mise en page est lisible (pas de chevauchement sévère de nœuds).

**🤔 Question(s) socratique(s)**

- Quel nœud serait un « hub » dans ton graphe, et pourquoi cette entité pourrait-elle être centrale ?

## ⚠️ Pièges courants

- **Téléchargement du modèle manquant.** `spacy.load("en_core_web_sm")` lève une `OSError` si tu sautes `spacy download`. Installe le modèle avant d'exécuter.
- **Recherches sensibles à la casse.** L'entité `"Lovelace"` ne correspondra pas à `"lovelace"` sauf si tu normalises la casse dans les recherches. L'aide `_find` gère cela, réutilise-la partout.
- **Graphes déconnectés.** Les entrées courtes produisent souvent des nœuds isolés sans arêtes. Utilise un texte avec plusieurs entités en co-occurrence pour voir une structure intéressante.
- **Taille du modèle vs précision.** `en_core_web_sm` est petit et rapide mais manque les entités de niche. Essaie `en_core_web_md` ou `_lg` pour un meilleur rappel au prix de la mémoire.
- **IDs d'entités en double.** `unique_entities` attribue les IDs par appel. À travers les phrases, la même personne peut recevoir des IDs différents sauf si tu dédupliques globalement, le pipeline construit un seul extracteur mais les IDs par phrase se réinitialisent.

## Ce que tu viens de construire

Un pipeline texte-vers-graphe : spaCy extrait les entités nommées, un découpage par expression régulière isole les phrases, la co-occurrence transforme les phrases partagées en arêtes pondérées, et NetworkX stocke plus matplotlib rend le résultat. Tu peux maintenant prendre n'importe quel paragraphe et le transformer en un réseau explorable de faits connectés, le même schéma derrière les systèmes de questions-réponses et les moteurs de recommandation.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/knowledge-graph-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/knowledge-graph-builder) dans le dépôt du cours a une version plus riche avec la détection de types de relations, la découverte de communautés et le CLI câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Utilise l'analyse de dépendances de spaCy pour étiqueter les arêtes avec le verbe (« a conçu », « situé à ») au lieu de la co-occurrence non étiquetée.
- Lance la détection de communautés avec `networkx.algorithms.community` pour trouver des grappes de sujets.
- Exporte le graphe en GraphML et charge-le dans Gephi pour une exploration avancée.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓