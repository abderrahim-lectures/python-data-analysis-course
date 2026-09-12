---
title: "Build a Data Lineage Tracker"
description: "Visualize how data flows through your systems, from source to dashboard with impact analysis."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "graph", "csv", "json"]
prerequisites:
  - "Python basics (variables, loops, functions, sets)"
  - "Reading CSV files with the csv module"
learningObjectives:
  - "Model data flows as a directed graph of source, transform, and derived nodes"
  - "Load lineage edges from a CSV record and persist them as JSON"
  - "Traverse the graph downstream and upstream with cycle guards"
  - "Run impact analysis that reports the dependency path to every affected asset"
  - "Render lineage as a Mermaid diagram or an indented terminal tree"
---

# 🌊 Build a Data Lineage Tracker

Every dataset arrives from somewhere and flows somewhere else, a CSV gets cleaned, the cleaned table feeds an aggregate, the aggregate feeds a dashboard, and the dashboard feeds a decision. When someone changes the source schema, the question "what is affected?" is urgent and, without tooling, terrifying. A lineage tracker answers it by making the pipeline a graph you can *walk*: nodes are datasets, edges are transformations, and impact analysis is a breadth-first fan-out from any node in the graph. This project builds that tracker from first principles, graph, loaders, traversals, impact paths, and two renderers, with zero dependencies.

This assumes Python 101 plus comfortable `csv` and `json` imports, sets and loops at home. Nothing from the Data Analysis module is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Model lineage as a directed graph of `(source, transform, derived)` edges.
2. Load edges from a CSV log into the graph and persist them as JSON.
3. Write cycle-safe downstream and upstream traversals over that graph.
4. Compute an impact map that reports *the full dependency path* to every downstream asset.
5. Render the graph as a Mermaid diagram or an indented terminal tree, and expose it as a CLI.

## Where to run this

**Locally with `uv`** is the recommended path, lineage tooling only earns its keep pointing at *your* transformation pipeline, so a real folder on disk is the honest home for it.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work well for the graph-traversal half, the notebook at [`examples/data-lineage-tracker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb) runs every step on a bundled sample pipeline and prints the same trees. The honest note: it cannot watch *your* pipeline's real files the way the local CLI can.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-lineage-tracker%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the "install Python, then pip, then a virtual environment tool" chain, and this project is pure standard library.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

Then set up the project:

```bash
uv init data-lineage-tracker
cd data-lineage-tracker
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `data-lineage-tracker/` exists with a `pyproject.toml`.
- ✅ `python -c "import csv, json"` succeeds, no third-party packages.

## Step 1: Model lineage as a directed graph

The simplest correct graph for lineage is a list of *directed edges*: each edge says `source --transform--> derived`. Directed matters, data flows one way, so "A feeds B" does *not* imply "B feeds A". Everything else in this project (walks, impact, rendering) is code over this one list.

### 1.1 Write the graph class

**👟 Starter hint:** A `LineageGraph` owning an `edges` list plus `add`, `nodes`, `save` (JSON), and a `load` classmethod that degrades to an empty graph when the file's missing:

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

The dataclass-free choice (`edges or []`) is deliberate for a graph that grows by appends: no field defaults to argue with, and `edges or []` guards the mutable-default trap by defaulting in the *constructor*. `nodes()` returning a `set` (not a list) is a quiet promise, node identity is about uniqueness, and everything downstream (walks) wants set semantics.

**🎯 Expected output:**

```
['customers.csv', 'products.csv', 'products_clean', 'revenue_by_category', 'rich_customers']
[('products.csv', 'clean', 'products_clean'), ('products_clean', 'aggregate', 'revenue_by_category'), ('customers.csv', 'join', 'rich_customers'), ('products_clean', 'join', 'rich_customers')]
```

**🩹 If it's off:** If `nodes()` contains duplicates, you built a list instead of a `set`, `nodes.add` has no dedup. If `save` writes a file but `load` returns an empty graph, the keys in `lineage.json` don't match `source`/`transform`/`derived`, open the file and compare.

### 1.2 Verify the model

**✅ Checklist**

- ✅ `graph.nodes()` returns exactly the five distinct nodes above, deduplicated.
- ✅ `save()` then `LineageGraph.load()` in a new process yields the identical edge list.
- ✅ `LineageGraph.load()` on a missing file returns an empty graph, not an exception.

**🤔 Socratic Question(s)**

- Nodes are collected from edge endpoints. What real entity in a lineage system touches nodes but *no edges*, and does this model let you represent it at all? Is that a bug or a scope decision?
- The edge carries a `transform` label ("clean", "aggregate"). What would the graph *lose* if you dropped the label to save space, and which future feature (impact *reasoning*, not just listing) would silently lose its vocabulary?

## Step 2: Load a pipeline from CSV

Hand-writing graphs in Python is fine for demos; real pipelines declare lineage as a file. This step adds the other side of the ledger: `transformations.csv`, with one edge per row, `source,transform,derived`, read in by `csv.DictReader` so the header names the fields instead of magic indexes.

### 2.1 Write the CSV loader

**👟 Starter hint:** Write a sample `transformations.csv` with five edges (including a *fan-out*: `products_clean` feeds two things), then a `load_csv_edges` that builds a graph one row at a time:

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

`DictReader` turning each row into `{header: value}` is the design decision that keeps this loader two lines long, column order in the CSV is now irrelevant, because `row["source"]` addresses the column by name. Spoiling the later steps slightly: the sample intentionally includes `products_clean → rich_customers` *and* `products_clean → revenue_by_category`, so you'll have a genuine fan-out to walk in Step 4 instead of a straight line.

**🎯 Expected output:**

```
5 edges, 7 nodes
```

**🩹 If it's off:** A `KeyError: 'source'` means the CSV's header row doesn't include that exact word, check for a BOM or trailing whitespace in the header line. If the edge count is 4 instead of 5, one CSV row is missing its trailing newline, the last data row fell off the reader.

### 2.2 Verify loading

**✅ Checklist**

- ✅ `load_csv_edges()` reports `5 edges, 7 nodes`.
- ✅ The original JSON from Step 1 is *not* required, `transformations.csv` alone rebuilds the whole graph.
- ✅ Editing the CSV and re-loading gives different node counts without touching Python.

**🤔 Socratic Question(s)**

- The CSV loader and the Step-1 constructor both produce `LineageGraph`s. Why is making "one source of truth" a file, not code, the better long-term design for lineage, and what does it cost in the short term?
- `products_clean` appears as both a `derived` (row 1) and a `source` (rows 3-4). What invariant about the pipeline is *conveniently true* in the sample but NOT enforced by the loader, where could a typo'd node name break the walk silently later?

## Step 3: Walk the graph both directions

Impact analysis is a traversal. Downstream fans out along edges *leaving* a node ("what breaks if `products.csv` changes?"); upstream fans out along edges *entering* a node ("where does this table get its data?"). Both are the same loop with one comparison flipped, and both *must* dedupe with a `seen` set, real graphs contain cycles, and a cycle is an infinite loop if you're not looking.

### 3.1 Write the two traversals

**👟 Starter hint:** One parameterized `_walk` helper: poll from a `frontier` set, follow the appropriate direction of each edge, add unseen neighbors to both `seen` (report) and `frontier` (explore), then two thin public wrappers:

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

The `while frontier` loop is textbook breadth-first expansion wearing plain Python: each iteration drains the current frontier and seeds the next, and `seen` does double duty, it's the *answer* (the reachable set) and the *termination guarantee* (cycles become no-ops). Compare the two wrappers: `downstream` and `upstream` share every line; the single flipped comparison `derived, src = src, derived` is the entire difference, which is exactly why a parameterized helper beats two copy-pasted functions.

**🎯 Expected output:**

```
downstream of products.csv: ['products_clean', 'revenue_by_category', 'rich_customers']
upstream of rich_customers: ['customers.csv', 'products.csv', 'products_clean']
```

**🩹 If it's off:** If downstream of `products.csv` misses `rich_customers`, the traversal isn't transitive, confirm `frontier.add(derived)` exists alongside `seen.add(derived)`; without re-seeding, you only get direct neighbors. If the demo hangs, you have a cycle you didn't add, `_walk`'s `seen` guard is what makes an infinite loop impossible, so confirm it's inside the loop on *every* add.

### 3.2 Verify the walks

**✅ Checklist**

- ✅ Both traversals return the exact sorted sets above (each a *transitive* reachability result).
- ✅ `downstream(graph, "raw_events")` returns `{'events_daily'}`, and `upstream(graph, "raw_events")` returns an empty set, a source's upstream is nothing.
- ✅ Adding a cycle (`events_daily → raw_events`) to the CSV and re-walking terminates with finite output.

**🤔 Socratic Question(s)**

- The walk visits the *same* node once no matter how many paths reach it. What information about "there are two independent routes from `products.csv` to `rich_customers`" does a set silently discard, and why does `impact` in the next step need exactly that richer structure?
- `reverse=True` swaps the endpoints, not just the comparison. Would flipping `src == current` to `derived == current` *without* the endpoint swap produce the same answer? Reason through one edge to decide.

## Step 4: Impact analysis with real paths

"Rich customers is affected" is a *claim*; "rich_customers is affected, and here's `products.csv → products_clean → rich_customers`" is *evidence*. Impact analysis upgrades the reachability set from Step 3 into a map of `affected asset → dependency path`, so a report can show *how* the blast radius reaches each table.

### 4.1 Write the impact map

**👟 Starter hint:** Carry `(node, path)` pairs in the frontier, record the first path found to each asset, and reuse the `seen`-as-paths dict to stop re-visiting:

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

The path is the innovation over Step 3: the frontier now carries history (`[start, ..., current]`), and `paths[derived] = [*path, derived]` saves a *copy* to the answer map when a node is first reached. The `derived not in paths` check is the `seen` set by another name, the dict's keys *are* the visited set, so an asset's first-found path is preserved and cycles terminate.

**🎯 Expected output:**

```
revenue_by_category:  products.csv -> products_clean -> revenue_by_category
rich_customers:  products.csv -> products_clean -> rich_customers
```

**🩹 If it's off:** If paths are truncated (missing `products.csv`), `[*path, derived]` is building from a stale `path`, you must unpack the *carried* path, not `paths[current]`, because the carried value records the route to `current` itself. If two assets map but the *order* shuffles between runs, the frontier is a `list` used as a stack (LIFO), order isn't guaranteed; sort the output like the demo does.

### 4.2 Verify impact

**✅ Checklist**

- ✅ Both assets reachable from `products.csv` appear with their full three-node paths.
- ✅ The impacted-map contains the same node set as Step 3's `downstream("products.csv")`.
- ✅ Adding `events_daily` to the graph shows in `impact(graph, "raw_events")`, as a two-step path, not a one-step edge.

**🤔 Socratic Question(s)**

- The map stores only the *first* path found. In a graph with two routes to the same table, the second, possibly shorter or more critical, is silently dropped. Is "first-recorded" acceptable for a migration blast-radius tool, and what would "all paths" require beyond this dict?
- The path includes the *nodes* but not the *transforms* ("clean", "aggregate"). Where would exposing the transform on each hop keep you honest about *what kind of breakage* to expect, schema vs. semantics?

## Step 5: Render and expose it as a CLI

A graph is analyzed; a *diagram* is communicated. Two renderers cover the real audience split: Mermaid (`graph TD`, paste-able straight into GitHub issues and Notion) for sharing, and an indented terminal tree for instant local reading. The CLI ties data loading, impact, and rendering into three punchable verbs.

### 5.1 Write the renderers

**👟 Starter hint:** `to_mermaid` is one f-string per edge; `render_tree` is a recursive DFS that emits indented node lines while a path-prefix set prevents infinite recursion on cycles:

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

`render_tree` is a *generator* (note the `yield`/`yield from`), the indented tree streams its lines instead of building one giant string, which keeps the memory flat even for deep pipelines. The `ancestors` set is the cycle guard restated for the *path* rather than the visited set: `products_clean → rich_customers` is valid only if `rich_customers` isn't already an ancestor of the current node, so the tree shows the real hierarchy, not an echo of itself.

**🎯 Expected output:**

A Mermaid block with five `-->` arrows (quoted node names, transform labels), then the indented tree:

```
products.csv
    products_clean
        revenue_by_category
        rich_customers
```

**🩹 If it's off:** If the tree indents every node to the *same* level, `emit` is returning from the loop before recursing, check `yield from emit(...)`, not a bare `emit(...)` (which creates the generator and discards it). If Mermaid renders with unquoted garbage, wrap every node name in double quotes inside the f-string, names with dots or spaces are the ones that break otherwise.

### 5.2 Build the CLI

**👟 Starter hint:** Two subcommands sharing one `load_csv_edges()`, `impact <node>` prints asset + path lines, `dump <node> --format mermaid|tree` prints the rendering:

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

The CLI is a thin, honest layer: zero new domain logic, one shared `load_csv_edges()` graph per run, and each branch delegating to exactly one function from the steps above. `choices=["mermaid", "tree"]` makes a typo'd `--format mermaide` a *helpful usage error* from `argparse` rather than a silent wrong-render.

**🎯 Expected output:** `impact products.csv` prints the two asset/path lines from Step 4; `dump ... --format tree` prints the indented tree.

**🩹 If it's off:** If every branch prints "no downstream assets", the terminal's working directory lacks `transformations.csv`, run from the folder where Step 2 wrote it, or the CLI can't see the edges at all. If `--format tree` prints nothing for a valid node, you're passing a node name with a typo, `products.csv` matches the edge `source` exactly.

### 5.3 Verify the CLI

**✅ Checklist**

- ✅ `impact products.csv` matches Step 4's output exactly.
- ✅ `dump raw_events --format mermaid` prints a four-line `graph TD` block you could paste into a GitHub issue.
- ✅ `lineage.py --help` lists both subcommands and the `--format` choices.

**🤔 Socratic Question(s)**

- `impact` and `dump` each call `load_csv_edges()` once, but if a future command needed to run *both* impact and a rendering, sharing one graph becomes structuring the CLI around a context object. Where's the line where "instantiate per branch" stops being fine?
- Mermaid output is text a human pastes; the tree is text a human reads. For an automated *CI change-detector*, which of the two renderers (if either) is the wrong output format, and what would the right one look like?

## ⚠️ Common pitfalls

- **Forgetting edges are directed.** `A → B` never implies `B → A`. If upstream and downstream return the same set, you built an *undirected* walk, check which endpoint each comparison follows.
- **Walking without a visited guard.** Any cycle in the data (and real lineage accumulates them) turns a naive recursion into an infinite loop or a `RecursionError`. `seen` (walks) and `ancestors` (tree) are not optional.
- **Recording only direct neighbors.** Impact analysis that doesn't re-seed the frontier answers "what *directly* depends on this?", a useful but different question. Transitive means `frontier.add(...)` after every discovery.
- **Storing node identity inconsistently.** `Products.csv` in one row and `products.csv` in another create two nodes with one letter of difference. Normalize names at load time or every path quietly forks.
- **Letting the renderer own the analysis.** If `render_tree` recomputes its own reachability instead of reusing `impact`, the diagram and the impact report can disagree on the same graph. One graph, one traversal, many renderers.

## What you just built

A real lineage tracker: a directed graph of datasets and transformations, loaded from CSV and persisted as JSON, traversed downstream and upstream with cycle-safe walks, analyzed into *path-carrying* impact maps, and rendered as both shareable Mermaid and readable trees, all standard library, all behind a two-verb CLI. The transferable skill is thinking of your pipeline as a graph instead of a script order: the moment data flow becomes walkable edges, "what breaks if I change this?" stops being a meeting and becomes a function call.

:::tip[Run a fuller version without any local setup]
[`examples/data-lineage-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-lineage-tracker) in the course repo has these complete scripts plus a bigger sample pipeline and pre-generated Mermaid. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Extend the CSV with a `schema_change` column ("rename", "drop", "add") and have `impact` annotate each asset with *what kind* of breakage to expect, the answer to the Step 4 Socratic question, now first-class.
- Add a `.dot` renderer (Graphviz) so the CLI can emit `lineage.dot` and let Graphviz lay out the whole graph with `dot -Tpng`.
- Implement **all-paths** impact analysis (a bounded DFS that records every route, not the first), then compare shortest vs. longest dependency chains for the same asset.
- Auto-discover edges: scan a folder of SQL/text files for `INSERT INTO x SELECT ... FROM y` and feed matches into the CSV loader, lineage extraction, not just rendering.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓