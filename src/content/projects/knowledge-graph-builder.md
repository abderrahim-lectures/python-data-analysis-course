---
title: "Build a Knowledge Graph Builder"
description: "Extract entities and relationships from text to build interactive knowledge graphs."
---
# 🕸️ Build a Knowledge Graph Builder

A knowledge graph turns unstructured text into a network of connected facts: "Ada Lovelace" and "analytic engine" become nodes, and "designed" becomes the edge between them. This project builds a pipeline that extracts named entities from sentences, detects relationships between them, and renders the whole thing as an interactive graph you can explore and query.

This assumes Python 101 and comfort with pandas from Data Analysis. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the NLP + graph dependencies.
2. Extract named entities from text using a pretrained NLP model.
3. Detect relationships between extracted entities.
4. Visualize the graph with an interactive node-link diagram.
5. Query the graph for connected paths and neighbors.

## Where to run this

**Locally with `uv`** is the primary path.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-graph-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-graph-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fknowledge-graph-builder%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment, spaCy, and NetworkX.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init knowledge-graph-builder
cd knowledge-graph-builder
uv add spacy networkx matplotlib
```

`spacy` provides named entity recognition. `networkx` holds the graph structure. `matplotlib` renders it. You'll also need the spaCy model:

```bash
uv run python -m spacy download en_core_web_sm
```

### Create the project structure

```bash
mkdir -p kgraph
touch kgraph/__init__.py kgraph/entities.py kgraph/graph.py kgraph/build.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `knowledge-graph-builder/` exists with `pyproject.toml` and all dependencies installed.
- ✅ `spacy download en_core_web_sm` completes without error.
- ✅ The `kgraph/` directory has all required module files.

## Step 1: Extract named entities

Named entity recognition identifies persons (PER), organizations (ORG), and locations (LOC) in text. spaCy does this out of the box.

### 1.1 Load the model and extract entities

**👟 Starter hint:** Create `kgraph/entities.py`.

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

**🎯 Expected output:** `EntityExtractor().extract("Ada Lovelace worked at Babbage's Analytical Engine in London.")` returns entities including a person and a location.

**🩹 If it's off:** If you get no entities, the model may not recognize proper nouns in your sample sentence — try a richer sentence.

### 1.2 Verify entity extraction

**✅ Checklist**

- ✅ `extract` returns a non-empty list for a sentence with proper nouns.
- ✅ Entity labels like `PER`, `ORG`, `LOC` appear.
- ✅ `unique_entities` deduplicates repeated mentions.

**🤔 Socratic Question(s)**

- The small model recognizes political figures better than niche tech names. How would you extend it with custom rules for your domain?

## Step 2: Build the graph structure

Entities become nodes; co-occurrence within a sentence becomes an edge.

### 2.1 Create the graph

**👟 Starter hint:** Create `kgraph/graph.py`.

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

**🎯 Expected output:** Adding a few entities and edges builds a graph you can query with `neighbors()`.

**🩹 If it's off:** If `neighbors` returns empty, the entity text doesn't match any node — check case and exact spelling.

### 2.2 Verify the graph

**✅ Checklist**

- ✅ `add_node` creates graph nodes with `label` and `text`.
- ✅ `add_edge` increments `weight` on repeated connections.
- ✅ `neighbors` returns connected entity text.

**🤔 Socratic Question(s)**

- Why track edge weight? What insight does a high-weight edge give you about a knowledge graph?

## Step 3: Wire extraction to graph

Now connect the two: parse sentences, extract entities per sentence, and create edges for entities sharing a sentence.

### 3.1 Build the pipeline

**👟 Starter hint:** Create `kgraph/build.py`.

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

**🎯 Expected output:** `build_graph(long_text)` returns a graph where entities in the same sentence are connected.

**🩹 If it's off:** If no edges form, the split regex may be producing empty sentences.

### 3.2 Verify the pipeline

**✅ Checklist**

- ✅ Entities are added as nodes.
- ✅ Entities sharing a sentence are connected by an edge.
- ✅ Repeated pairs increment the weight.

**🤔 Socratic Question(s)**

- Co-occurrence is a naive but effective relation detector. What would a dependency-parsing approach add?

## Step 4: Visualize the graph

Drawing the graph makes the structure legible: hubs show up immediately.

### 4.1 Plot the graph

**👟 Starter hint:** Add a visualization function.

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

**🎯 Expected output:** `graph.draw()` renders an interactive spring-layout diagram with labeled nodes.

**🩹 If it's off:** If nodes overlap badly, increase `figsize` or tweak `k` in `spring_layout`.

### 4.2 Verify visualization

**✅ Checklist**

- ✅ Nodes are drawn with entity text labels.
- ✅ Edges connect related entities.
- ✅ Layout is legible (no severe node overlap).

**🤔 Socratic Question(s)**

- Which node would be a "hub" in your graph, and why might that entity be central?

## ⚠️ Common pitfalls

- **Missing model download.** `spacy.load("en_core_web_sm")` raises `OSError` if you skip `spacy download`. Install the model before running.
- **Case-sensitive lookups.** Entity `"Lovelace"` won't match `"lovelace"` unless you normalize case in lookups. The `_find` helper handles this — reuse it everywhere.
- **Disconnected graphs.** Short inputs often yield isolated nodes with no edges. Use a text with multiple co-occurring entities to see interesting structure.
- **Model size vs accuracy.** `en_core_web_sm` is small and fast but misses niche entities. Try `en_core_web_md` or `_lg` for better recall at the cost of memory.
- **Duplicate entity IDs.** `unique_entities` assigns IDs per call. Across sentences the same person may get different IDs unless you dedupe globally — the pipeline builds one extractor but per-sentence IDs reset.

## What you just built

A text-to-graph pipeline: spaCy extracts named entities, a regex splitter isolates sentences, co-occurrence turns shared sentences into weighted edges, and NetworkX stores plus matplotlib renders the result. You can now take any paragraph and turn it into an explorable network of connected facts — the same pattern behind question-answering systems and recommendation engines.

:::tip[Run a fuller version without any local setup]
[`examples/knowledge-graph-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/knowledge-graph-builder) in the course repo has a richer version with relation-type detection, community finding, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Use spaCy dependency parsing to label edges with the verb ("designed", "located in") instead of unlabeled co-occurrence.
- Run community detection with `networkx.algorithms.community` to find topic clusters.
- Export the graph to GraphML and load it in Gephi for advanced exploration.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
