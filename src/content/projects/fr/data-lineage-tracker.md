---
title: "Suiveur de Lignée des Données"
description: "Visualise comment les données circulent dans tes systèmes — de la source au tableau de bord avec analyse d'impact."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "graph", "csv", "json"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, ensembles)"
  - "Lire des fichiers CSV avec le module csv"
learningObjectives:
  - "Modéliser les flux de données comme un graphe dirigé de nœuds source, transformation et dérivé"
  - "Charger des arêtes de lignée depuis un CSV et les persister en JSON"
  - "Parcourir le graphe en aval et en amont avec garde-cycles"
  - "Exécuter une analyse d'impact qui rapporte le chemin de dépendance vers chaque actif affecté"
  - "Rendre la lignée sous forme de diagramme Mermaid ou d'arbre terminal indenté"
---

# 🌊 Construire un Suiveur de Lignée des Données

Chaque jeu de données arrive de quelque part et coule vers ailleurs — un CSV est nettoyé, la table nettoyée alimente un agrégat, l'agrégat alimente un tableau de bord, et le tableau de bord alimente une décision. Quand quelqu'un change le schéma source, la question « qu'est-ce qui est affecté ? » est urgente et, sans outils, terrifiante. Un suiveur de lignée y répond en rendant le pipeline un graphe que tu peux *parcourir* : les nœuds sont des jeux de données, les arêtes sont des transformations, et l'analyse d'impact est une expansion en largeur d'abord depuis n'importe quel nœud du graphe. Ce projet construit ce suiveur depuis les premiers principes — graphe, chargeurs, parcours, chemins d'impact, et deux moteurs de rendu — avec zéro dépendance.

Ceci suppose Python 101 plus une lecture confortable des imports `csv` et `json` — ensembles et boucles maîtrisés. Rien du module Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser la lignée comme un graphe dirigé d'arêtes `(source, transform, derived)`.
2. Charger des arêtes depuis un CSV dans le graphe et les persister en JSON.
3. Écrire des parcours de graphe en aval et en amont, sûrs contre les cycles.
4. Calculer une carte d'impact qui rapporte le *chemin complet de dépendance* vers chaque actif en aval.
5. Rendre le graphe sous forme de diagramme Mermaid ou d'arbre terminal indenté, et l'exposer comme une CLI.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — les outils de lignée ne prouvent leur valeur que pointés vers *ton* pipeline de transformation, donc un vrai dossier sur le disque est l'honnête foyer.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés) et exécute les mêmes commandes depuis un terminal navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent bien pour la moitié parcours-de-graphe — le notebook dans [`examples/data-lineage-tracker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb) exécute chaque étape sur un pipeline d'exemple fourni et affiche les mêmes arbres. La note honnête : il ne peut pas surveiller les vrais fichiers de *ton* pipeline comme la CLI locale.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-lineage-tracker%2Fnotebook.ipynb)

## Configuration

`uv` est un outil unique qui remplace toute la chaîne « install Python, puis pip, puis un outil d'environnement virtuel » — et ce projet est pure bibliothèque standard.

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
uv init data-lineage-tracker
cd data-lineage-tracker
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `data-lineage-tracker/` existe avec un `pyproject.toml`.
- ✅ `python -c "import csv, json"` réussit — aucun paquet tiers.

## Étape 1 : Modéliser la lignée comme un graphe dirigé

Le graphe le plus simple et correct pour la lignée est une liste d'*arêtes dirigées* : chaque arête dit `source --transform--> derived`. Dirigé est important — les données coulent en un seul sens, donc « A alimente B » n'*implique pas* « B alimente A ». Tout le reste de ce projet (parcours, impact, rendu) est du code sur cette seule liste.

### 1.1 Écris la classe graphe

**👟 Indice de départ :** Un `LineageGraph` possédant une liste `edges` plus `add`, `nodes`, `save` (JSON), et une méthode de classe `load` qui se dégrade en graphe vide quand le fichier manque :

```python
# graph.py
import json
from pathlib import Path

class LineageGraph:
    def __init__(self, edges: list[tuple[str, str, str]] | None = None):
        self.edges: list[tuple[str, str, str]] = edges or []

    def add(self, source: str, transform: str, derived: str) -> None:
        self.edges.append((source, transform, derived))

    def nodes(self) -> set[str]:
        nodes: set[str] = set()
        for src, _transform, derived in self.edges:
            nodes.add(src)
            nodes.add(derived)
        return nodes

    def save(self, path: str = "lineage.json") -> None:
        payload = [{"source": s, "transform": t, "derived": d}
                   for s, t, d in self.edges]
        Path(path).write_text(json.dumps(payload, indent=2))

    @classmethod
    def load(cls, path: str = "lineage.json") -> "LineageGraph":
        if not Path(path).exists():
            return cls()
        raw = json.loads(Path(path).read_text())
        return cls([(e["source"], e["transform"], e["derived"]) for e in raw])

if __name__ == "__main__":
    graph = LineageGraph()
    graph.add("products.csv", "clean", "products_clean")
    graph.add("products_clean", "aggregate", "revenue_by_category")
    graph.add("customers.csv", "join", "rich_customers")
    graph.add("products_clean", "join", "rich_customers")
    graph.save()
    print(sorted(graph.nodes()))
    print(graph.edges)
```

Le choix sans dataclass (`edges or []`) est délibéré pour un graphe qui grossit par ajouts : pas de défauts de champs à discuter, et `edges or []` protège le piège de la valeur par défaut mutable en la paramétrant dans le *constructeur*. `nodes()` retournant un `set` (pas une liste) est une promesse silencieuse — l'identité des nœuds concerne l'unicité, et tout ce qui suit (parcours) veut la sémantique de l'ensemble.

**🎯 Résultat attendu :**

```
['customers.csv', 'products.csv', 'products_clean', 'revenue_by_category', 'rich_customers']
[('products.csv', 'clean', 'products_clean'), ('products_clean', 'aggregate', 'revenue_by_category'), ('customers.csv', 'join', 'rich_customers'), ('products_clean', 'join', 'rich_customers')]
```

**🩹 Si ça ne marche pas :** Si `nodes()` contient des doublons, tu as construit une liste au lieu d'un `set` — `nodes.add` ne déduplique pas. Si `save` écrit un fichier mais `load` retourne un graphe vide, les clés dans `lineage.json` ne correspondent pas à `source`/`transform`/`derived` — ouvre le fichier et compare.

### 1.2 Vérifie le modèle

**✅ Liste de vérification**

- ✅ `graph.nodes()` retourne exactement les cinq nœuds distincts ci-dessus, dédupliqués.
- ✅ `save()` puis `LineageGraph.load()` dans un nouveau processus produit la même liste d'arêtes.
- ✅ `LineageGraph.load()` sur un fichier manquant retourne un graphe vide, pas une exception.

**🤔 Question(s) socratique(s)**

- Les nœuds sont collectés depuis les extrémités des arêtes. Quelle entité réelle dans un système de lignée touche des nœuds mais *pas d'arêtes* — et ce modèle te permet-il de le représenter ? Est-ce un bug ou une décision de portée ?
- L'arête porte une étiquette `transform` ("clean", "aggregate"). Que le graphe *perdrait-il* si tu supprimais l'étiquette pour économiser de l'espace — et quelle fonctionnalité future (raisonnement d'impact, pas juste le listing) perdrait silencieusement son vocabulaire ?

## Étape 2 : Charger un pipeline depuis le CSV

Écrire des graphes à la main en Python est correct pour les démos ; les vrais pipelines déclarent la lignée comme un fichier. Cette étape ajoute l'autre côté du livre : `transformations.csv`, avec une arête par ligne — `source,transform,derived` — lu par `csv.DictReader` pour que l'en-tête nomme les champs au lieu d'index magiques.

### 2.1 Écris le chargeur CSV

**👟 Indice de départ :** Écris un CSV d'exemple `transformations.csv` avec cinq arêtes (y compris une *division* : `products_clean` alimente deux choses), puis un `load_csv_edges` qui construit un graphe ligne par ligne :

```python
# load_edges.py
import csv

from graph import LineageGraph

def load_csv_edges(path: str = "transformations.csv") -> LineageGraph:
    graph = LineageGraph()
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            graph.add(row["source"], row["transform"], row["derived"])
    return graph

if __name__ == "__main__":
    csv_text = """source,transform,derived
products.csv,clean,products_clean
products_clean,aggregate,revenue_by_category
customers.csv,join,rich_customers
products_clean,join,rich_customers
raw_events,dedupe,events_daily
"""
    with open("transformations.csv", "w") as f:
        f.write(csv_text)
    graph = load_csv_edges()
    print(f"{len(graph.edges)} edges, {len(graph.nodes())} nodes")
```

`DictReader` transformant chaque ligne en `{en-tête: valeur}` est la décision de conception qui maintient ce chargeur à deux lignes de long — l'ordre des colonnes dans le CSV est désormais sans importance, car `row["source"]` cible la colonne par nom. Pour gâcher légèrement les étapes suivantes : l'exemple inclut délibérément `products_clean → rich_customers` *et* `products_clean → revenue_by_category`, donc tu auras une vraie division à parcourir dans l'Étape 4 au lieu d'une ligne droite.

**🎯 Résultat attendu :**

```
5 edges, 7 nodes
```

**🩹 Si ça ne marche pas :** Un `KeyError: 'source'` signifie que la ligne d'en-tête du CSV ne contient pas ce mot exact — vérifie la présence d'un BOM ou d'espaces en fin de ligne dans l'en-tête. Si le compte d'arêtes est 4 au lieu de 5, il manque un saut de ligne en fin de dernière ligne du CSV — la dernière ligne de données est tombée du lecteur.

### 2.2 Vérifie le chargement

**✅ Liste de vérification**

- ✅ `load_csv_edges()` affiche `5 edges, 7 nodes`.
- ✅ Le JSON original de l'Étape 1 n'est *pas* requis — `transformations.csv` seul reconstruit le graphe entier.
- ✅ Modifier le CSV et recharger produit des comptes de nœuds différents sans toucher à Python.

**🤔 Question(s) socratique(s)**

- Le chargeur CSV et le constructeur de l'Étape 1 produisent tous deux des `LineageGraph`s. Pourquoi faire d'une « source unique de vérité » un fichier, pas du code, est la meilleure conception à long terme pour la lignée — et que coûte-t-il à court terme ?
- `products_clean` apparaît comme à la fois `derived` (ligne 1) et `source` (lignes 3-4). Quelle invariante du pipeline est *convenablement vraie* dans l'exemple mais PAS imposée par le chargeur — où une faute de frappe sur un nom de nœud briserait silencieusement le parcours plus tard ?

## Étape 3 : Parcourir le graphe dans les deux sens

L'analyse d'impact est un parcours. En aval s'élargit le long des arêtes *sortantes* d'un nœud (« qu'est-ce qui casse si `products.csv` change ? ») ; en amont s'élargit le long des arêtes *entrantes* d'un nœud (« d'où cette table tire-t-elle ses données ? »). Les deux sont la même boucle avec une comparaison inversée, et les deux *doivent* dédupliquer avec un ensemble `seen` — les vrais graphes contiennent des cycles, et un cycle est une boucle infinie si tu ne fais pas attention.

### 3.1 Écris les deux parcours

**👟 Indice de départ :** Un helper paramétré `_walk` : pioche dans un ensemble `frontier`, suit la direction appropriée de chaque arête, ajoute les voisins non vus à la fois à `seen` (pour le rapport) et `frontier` (pour l'exploration) — puis deux wrappers publics fins :

```python
# walks.py
from graph import LineageGraph

def _walk(graph: LineageGraph, start: str, reverse: bool = False) -> set[str]:
    """BFS-style traversal. reverse=False follows source -> derived."""
    seen: set[str] = set()
    frontier: set[str] = {start}
    while frontier:
        current = frontier.pop()
        for src, _transform, derived in graph.edges:
            if reverse:
                src, derived = derived, src  # follow edges backwards
            if src == current and derived not in seen:
                seen.add(derived)
                frontier.add(derived)
    return seen

def downstream(graph: LineageGraph, node: str) -> set[str]:
    return _walk(graph, node, reverse=False)

def upstream(graph: LineageGraph, node: str) -> set[str]:
    return _walk(graph, node, reverse=True)

if __name__ == "__main__":
    from load_edges import load_csv_edges
    graph = load_csv_edges()
    print("downstream of products.csv:", sorted(downstream(graph, "products.csv")))
    print("upstream of rich_customers:", sorted(upstream(graph, "rich_customers")))
```

La boucle `while frontier` est l'expansion en largeur d'abord du manuel scolaire revêtue de Python simple : chaque itération vide la frontière actuelle et sème la suivante, et `seen` fait double service — c'est la *réponse* (l'ensemble accessible) et la *garantie d'arrêt* (les cycles deviennent des opérations à rien). Compare les deux wrappers : `downstream` et `upstream` partagent chaque ligne ; la seule comparaison inversée `derived, src = src, derived` est toute la différence, ce qui est exactement pourquoi un helper paramétré bat deux fonctions copiées-collées.

**🎯 Résultat attendu :**

```
downstream of products.csv: ['products_clean', 'revenue_by_category', 'rich_customers']
upstream of rich_customers: ['customers.csv', 'products.csv', 'products_clean']
```

**🩹 Si ça ne marche pas :** Si l'aval de `products.csv` manque `rich_customers`, le parcours n'est pas transitif — confirme que `frontier.add(derived)` existe aux côtés de `seen.add(derived)` ; sans re-semis, tu n'obtiens que les voisins directs. Si la démo se bloque, tu as un cycle que tu n'as pas ajouté — la garde `seen` de `_walk` est ce qui rend une boucle infinie impossible, donc confirme qu'elle est à l'intérieur de la bouche sur *chaque* ajout.

### 3.2 Vérifie les parcours

**✅ Liste de vérification**

- ✅ Les deux parcours retournent exactement les ensembles triés ci-dessus (chacun un résultat d'accessibilité *transitif*).
- ✅ `downstream(graph, "raw_events")` retourne `{'events_daily'}`, et `upstream(graph, "raw_events")` retourne un ensemble vide — l'amont d'une source est vide.
- ✅ Ajouter un cycle (`events_daily → raw_events`) au CSV et re-parcourir se termine avec une sortie finie.

**🤔 Question(s) socratique(s)**

- Le parcours visite le *même* nœud une seule fois quel que soit le nombre de chemins qui l'atteignent. Quelle information sur « il y a deux routes indépendantes de `products.csv` à `rich_customers` » un ensemble jette-t-il silencieusement — et pourquoi `impact` dans l'étape suivante a besoin exactement de cette structure plus riche ?
- `reverse=True` échange les extrémités, pas juste la comparaison. Inverser `src == current` en `derived == current` *sans* l'échange d'extrémité produirait-il la même réponse ? Raisonne sur une arête pour décider.

## Étape 4 : Analyse d'impact avec de vrais chemins

« Rich customers est affecté » est une *affirmation* ; « rich_customers est affecté, et voici `products.csv → products_clean → rich_customers` » est une *preuve*. L'analyse d'impact met à jour l'ensemble d'accessibilité de l'Étape 3 en une carte de `actif affecté → chemin de dépendance`, pour qu'un rapport puisse montrer *comment* le rayon d'explosion atteint chaque table.

### 4.1 Écris la carte d'impact

**👟 Indice de départ :** Transporte des paires `(nœud, chemin)` dans la frontière, enregistre le premier chemin trouvé vers chaque actif, et réutilise le dict `seen`-comme-chemins pour arrêter les revisites :

```python
# impact.py
from graph import LineageGraph

def impact(graph: LineageGraph, start: str) -> dict[str, list[str]]:
    """Map every downstream asset to the first path reaching it."""
    paths: dict[str, list[str]] = {}
    frontier: list[tuple[str, list[str]]] = [(start, [start])]
    while frontier:
        current, path = frontier.pop()
        for src, _transform, derived in graph.edges:
            if src == current and derived not in paths:
                paths[derived] = [*path, derived]
                frontier.append((derived, paths[derived]))
    return paths

if __name__ == "__main__":
    from load_edges import load_csv_edges
    graph = load_csv_edges()
    for asset, path in sorted(impact(graph, "products.csv").items()):
        print(f"{asset}:  {' -> '.join(path)}")
```

Le chemin est l'innovation par rapport à l'Étape 3 : la frontière transporte désormais l'historique (`[start, ..., current]`), et `paths[derived] = [*path, derived]` enregistre une *copie* dans la carte de réponse quand un nœud est premièrement atteint. La vérification `derived not in paths` est l'ensemble `seen` sous un autre nom — les clés du dict *sont* l'ensemble visité, donc le premier chemin trouvé vers un actif est préservé et les cycles se terminent.

**🎯 Résultat attendu :**

```
revenue_by_category:  products.csv -> products_clean -> revenue_by_category
rich_customers:  products.csv -> products_clean -> rich_customers
```

**🩹 Si ça ne marche pas :** Si les chemins sont tronqués (manque `products.csv`), `[*path, derived]` construit depuis un `path` périmé — tu dois déballer le *chemin transporté*, pas `paths[current]`, car la valeur transportée enregistre la route vers `current` lui-même. Si deux actifs apparaissent mais l'*ordre* change entre exécutions, la frontière est une `list` utilisée comme pile (LIFO) — l'ordre n'est pas garanti ; trie la sortie comme la démo.

### 4.2 Vérifie l'impact

**✅ Liste de vérification**

- ✅ Les deux actifs accessibles depuis `products.csv` apparaissent avec leurs chemins complets en trois nœuds.
- ✅ La carte d'impact contient le même ensemble de nœuds que `downstream("products.csv")` de l'Étape 3.
- ✅ Ajouter `events_daily` au graphe apparaît dans `impact(graph, "raw_events")` — comme chemin en deux étapes, pas une arête en une.

**🤔 Question(s) socratique(s)**

- La carte ne stocke que le *premier* chemin trouvé. Dans un graphe avec deux routes vers la même table, la deuxième — possiblement plus courte ou plus critique — est silencieusement abandonnée. « Premier enregistré » est-il acceptable pour un outil de rayon d'explosion de migration, et que faudrait-il pour « tous les chemins » au-delà de ce dict ?
- Le chemin inclut les *nœuds* mais pas les *transformations* ("clean", "aggregate"). Où exposer la transformation à chaque étape te rendrait honnête sur *quel type de panne* attendre — schéma vs. sémantique ?

## Étape 5 : Rendre et exposer comme CLI

Un graphe est analysé ; un *diagramme* est communiqué. Deux moteurs couvrent la vraie répartition du public : Mermaid (`graph TD`, collable directement dans les issues GitHub et Notion) pour le partage, et un arbre terminal indenté pour la lecture locale instantanée. La CLI lie chargement de données, impact et rendu en trois verbes actionnables.

### 5.1 Écris les moteurs de rendu

**👟 Indice de départ :** `to_mermaid` est un f-string par arête ; `render_tree` est un DFS récursif qui émet des lignes de nœuds indentés pendant qu'un ensemble de préfixes de chemin empêche la récursion infinie sur les cycles :

```python
# render.py
from graph import LineageGraph
from impact import impact

def to_mermaid(graph: LineageGraph) -> str:
    lines = ["graph TD"]
    for src, transform, derived in graph.edges:
        lines.append(f'    "{src}" -->|"{transform}"| "{derived}"')
    return "\n".join(lines)

def render_tree(graph: LineageGraph, root: str) -> str:
    paths = impact(graph, root)

    def emit(node: str, depth: int, ancestors: set[str]) -> None:
        yield "    " * depth + node
        for src, _transform, derived in graph.edges:
            if src == node and derived not in ancestors:
                yield from emit(derived, depth + 1, ancestors | {node})

    return "\n".join(emit(root, 0, set()))

if __name__ == "__main__":
    from load_edges import load_csv_edges
    graph = load_csv_edges()
    print(to_mermaid(graph))
    print()
    print(render_tree(graph, "products.csv"))
```

`render_tree` est un *générateur* (note les `yield`/`yield from`) — l'arbre indenté émet ses lignes au lieu de construire une énorme chaîne, ce qui maintient la mémoire plate même pour les pipelines profonds. L'ensemble `ancestors` est la garde-cycle reformulée pour le *chemin* plutôt que l'ensemble visité : `products_clean → rich_customers` n'est valide que si `rich_customers` n'est pas déjà un ancêtre du nœud courant — donc l'arbre montre la vraie hiérarchie, pas un écho de lui-même.

**🎯 Résultat attendu :**

Un bloc Mermaid avec cinq flèches `-->` (noms de nœuds entre guillemets, étiquettes de transformation), puis l'arbre indenté :

```
products.csv
    products_clean
        revenue_by_category
        rich_customers
```

**🩹 Si ça ne marche pas :** Si l'arbre indente chaque nœud au *même* niveau, `emit` retourne de la boucle avant de récursiver — vérifie `yield from emit(...)`, pas un simple `emit(...)` (qui crée le générateur et l'abandonne). Si Mermaid rend avec des guillemets manquants, entoure chaque nom de nœud entre doubles guillemets à l'intérieur du f-string — les noms avec des points ou des espaces sont ceux qui cassent autrement.

### 5.2 Construis la CLI

**👟 Indice de départ :** Deux sous-commandes partageant un `load_csv_edges()` — `impact <nœud>` affiche des lignes actif + chemin, `dump <nœud> --format mermaid|tree` affiche le rendu :

```python
# lineage.py
import argparse

from impact import impact
from load_edges import load_csv_edges
from render import render_tree, to_mermaid

def main() -> None:
    parser = argparse.ArgumentParser(description="Query and render data lineage.")
    sub = parser.add_subparsers(dest="command", required=True)

    impact_cmd = sub.add_parser("impact", help="List every downstream asset with its path")
    impact_cmd.add_argument("node")

    dump_cmd = sub.add_parser("dump", help="Render lineage as Mermaid or an indented tree")
    dump_cmd.add_argument("node")
    dump_cmd.add_argument("--format", choices=["mermaid", "tree"], default="mermaid")

    args = parser.parse_args()
    graph = load_csv_edges()

    if args.command == "impact":
        results = impact(graph, args.node)
        if not results:
            print(f"no downstream assets for {args.node}")
        for asset, path in sorted(results.items()):
            print(f"{asset}:  {' -> '.join(path)}")
    elif args.command == "dump":
        print(to_mermaid(graph) if args.format == "mermaid" else render_tree(graph, args.node))

if __name__ == "__main__":
    main()
```

```bash
uv run python lineage.py impact products.csv
uv run python lineage.py dump products.csv --format tree
```

La CLI est une couche fine et honnête : zéro nouvelle logique métier, un graphe `load_csv_edges()` partagé par exécution, et chaque branche déléguant à exactement une fonction des étapes ci-dessus. `choices=["mermaid", "tree"]` fait qu'une faute de frappe `--format mermaide` produit une *erreur d'usage utile* depuis `argparse` plutôt qu'un mauvais rendu silencieux.

**🎯 Résultat attendu :** `impact products.csv` affiche les deux lignes actif/chemin de l'Étape 4 ; `dump ... --format tree` affiche l'arbre indenté.

**🩹 Si ça ne marche pas :** Si chaque branche affiche « no downstream assets », le répertoire courant du terminal ne contient pas `transformations.csv` — lance depuis le dossier où l'Étape 2 l'a écrit, sinon la CLI ne voit pas les arêtes du tout. Si `--format tree` n'affiche rien pour un nœud valide, tu passes un nom de nœud avec une faute de frappe — `products.csv` correspond exactement à l'arête `source`.

### 5.3 Vérifie la CLI

**✅ Liste de vérification**

- ✅ `impact products.csv` correspond exactement à la sortie de l'Étape 4.
- ✅ `dump raw_events --format mermaid` affiche un bloc `graph TD` de quatre lignes que tu pourrais coller dans une issue GitHub.
- ✅ `lineage.py --help` liste les deux sous-commandes et les choix `--format`.

**🤔 Question(s) socratique(s)**

- `impact` et `dump` appellent chacun `load_csv_edges()` une fois — mais si une commande future devait exécuter *à la fois* impact et rendu, partager un seul graphe commence à structurer la CLI autour d'un objet contexte. Où est la ligne où « instancier par branche » cesse d'être correct ?
- La sortie Mermaid est du texte qu'un humain colle ; l'arbre est du texte qu'un humain lit. Pour un *détecteur de changement CI* automatisé, lequel des deux moteurs (s'il y en a un) est le mauvais format de sortie — et à quoi ressemblerait le bon ?

## ⚠️ Pièges courants

- **Oublier que les arêtes sont dirigées.** `A → B` n'implique jamais `B → A`. Si en amont et en aval retournent le même ensemble, tu as construit un parcours *non dirigé* — vérifie quelle extrémité suit chaque comparaison.
- **Parcourir sans garde de visite.** N'importe quel cycle dans les données (et la vraie lignée en accumule) transforme une récursion naïve en boucle infinie ou un `RecursionError`. `seen` (parcours) et `ancestors` (arbre) ne sont pas optionnels.
- **N'enregistrer que les voisins directs.** Une analyse d'impact qui ne re-sème pas la frontière répond « qu'est-ce qui *directement* dépend de cela ? » — une question utile mais différente. Transitif signifie `frontier.add(...)` après chaque découverte.
- **Stocker l'identité des nœuds de manière incohérente.** `Products.csv` dans une ligne et `products.csv` dans une autre créent deux nœuds avec une lettre de différence. Normalise les noms au chargement ou chaque chemin se bifurque silencieusement.
- **Laisser le moteur de rendu posséder l'analyse.** Si `render_tree` recalcule sa propre accessibilité au lieu de réutiliser `impact`, le diagramme et le rapport d'impact peuvent diverger sur le même graphe. Un graphe, un parcours, plusieurs moteurs.

## Ce que tu viens de construire

Un vrai suiveur de lignée : un graphe dirigé de jeux de données et de transformations, chargé depuis un CSV et persisté en JSON, parcouru en aval et en amont avec des parcours sûrs contre les cycles, analysé en des cartes d'impact *portant des chemins*, et rendu à la fois en Mermaid partageable et en arbres lisibles — tout en bibliothèque standard, tout derrière une CLI à deux verbes. La compétence transférable est de penser ton pipeline comme un graphe plutôt qu'un ordre de scripts : le moment où le flux de données devient des arêtes parcourables, « qu'est-ce qui casse si je change ceci ? » cesse d'être une réunion et devient un appel de fonction.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/data-lineage-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-lineage-tracker) dans le dépôt du cours contient ces scripts complets plus un pipeline d'exemple plus grand et du Mermaid pré-généré. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Étends le CSV avec une colonne `schema_change` ("rename", "drop", "add") et fais en sorte que `impact` annoté chaque actif avec le *type* de panne à attendre — la réponse à la question socratique de l'Étape 4, désormais primitive de premier ordre.
- Ajoute un moteur `.dot` (Graphviz) pour que la CLI puisse émettre `lineage.dot` et laisser Graphviz disposer le graphe entier avec `dot -Tpng`.
- Implémente une analyse d'impact **tous-chemins** (un DFS borné qui enregistre chaque route, pas la première), puis compare les chaînes de dépendance les plus courtes vs. les plus longues pour le même actif.
- Découvre automatiquement les arêtes : scanne un dossier de fichiers SQL/texte à la recherche de `INSERT INTO x SELECT ... FROM y` et alimente le chargeur CSV avec les correspondances — extraction de lignée, pas juste rendu.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓