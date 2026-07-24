---
id: codebase-knowledge-graph
title: "Turn a Codebase into a Knowledge Graph"
sidebar_label: "Turn a Codebase into a Knowledge Graph"
slug: /projects/codebase-knowledge-graph
description: "Graduate from the in-browser playground to real Python: parse a real codebase's Python files with the ast module, build a graph of its structure with networkx, and visualize and query it — no API key, no network access needed."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Turn a Codebase into a Knowledge Graph

<ProjectPublishedDate projectId="codebase-knowledge-graph" />

<ProjectGreeting />

Every other project in this section eventually reaches for an API key, a free-tier signup, or a live website. This one doesn't need any of that. You'll write a tool that reads Python source code the way the interpreter itself does — by parsing it into an **AST** (abstract syntax tree) with the standard library's built-in `ast` module — then turns what it finds into a **graph**: files, functions, and classes as nodes, "imports"/"calls"/"defined in" relationships as edges. That's a real, working example of a data structure from way back in the course showing up in a genuinely useful tool, not a classroom exercise: a graph is just nodes and edges, and a codebase's own structure turns out to already be one.

This assumes Python 101 and comfort with functions and imports — nothing from Data Analysis is required, and nothing here calls out to any AI model or web service. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv` and set up a small project with `networkx` and `pyvis` — no API key, no signup, nothing to configure.
2. Parse a single Python file's AST to find its function definitions, class definitions, and imports.
3. Walk an entire repository and build a graph out of everything you find, using `networkx`.
4. Add edges for **import** and **call** relationships, so the graph captures how the pieces actually connect, not just what exists.
5. Visualize the graph as an interactive HTML page with `pyvis` (and, optionally, a static image with `matplotlib`).
6. Write a small query function — "what does this function call?", "what imports this module?" — and run the whole thing against a real repository.

## Where to run this

**Locally with `uv`** is the primary, recommended path — real Python, on your own machine, reading real files from a real folder on disk.

**GitHub Codespaces** works great here too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab — and you've already got a real repository sitting right there to point the tool at.

**Google Colab or Kaggle Notebooks** are a genuinely easy option too, not just a fallback — this project needs no GPU, no long-running server process, and no API key, just `pip install`s and pure computation. `!pip install networkx pyvis` in a cell, then either `!git clone` a public repo to analyze or upload a small folder of `.py` files, and the rest of the code below works essentially unchanged (pyvis's HTML output can even be displayed inline in a notebook cell).

## Setup

Since there's no API key or `.env` file anywhere in this project, setup is unusually short.

**Install `uv`**, a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain:

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

**Set up a project and install dependencies:**

```bash
uv init codebase-graph
cd codebase-graph
uv add networkx pyvis matplotlib
```

`networkx` is a free, pure-Python graph library — it handles the actual graph data structure (nodes, edges, traversal) so you don't have to write one from scratch. `pyvis` turns a `networkx` graph into an interactive HTML page you can drag around and zoom in a browser. `matplotlib` is optional, used for a static image alternative in Step 5.

That's the whole setup. **No API key, no `.env` file, no free-tier signup, no environment variable to configure** — every step from here on reads local files and runs local computation.

:::tip[No internet access needed after installation]
Once `uv add` finishes downloading these three packages, the entire rest of this project can run with your network disconnected. That's worth noticing: everything else in this section of the course revolves around calling a remote model or a remote website, and it's easy to start assuming every "real" Python project needs a network call somewhere. This one is a useful counterexample — static analysis and graph theory are entirely offline.
:::

## Step 1: Parse a single file's AST

Before parsing an entire repository, get one file working. Python's built-in `ast` module turns source code into a tree of objects describing its structure — the same representation the interpreter itself builds before running your code. `ast.parse` gives you the root of that tree; `ast.walk` lets you visit every node in it.

Create a small test file, `sample.py`:

```python
# sample.py
import os

def greet(name):
    print(f"Hello, {name}")

class Greeter:
    def greet_twice(self, name):
        greet(name)
        greet(name)
```

Then write `explore_ast.py` to poke at it:

```python
# explore_ast.py
import ast
from pathlib import Path

source = Path("sample.py").read_text(encoding="utf-8")
tree = ast.parse(source, filename="sample.py")

for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        print("function:", node.name)
    elif isinstance(node, ast.ClassDef):
        print("class:", node.name)
    elif isinstance(node, ast.Import):
        for alias in node.names:
            print("import:", alias.name)
    elif isinstance(node, ast.ImportFrom):
        print("import from:", node.module)
```

```bash
uv run python explore_ast.py
```

You should see `function: greet`, `class: Greeter`, and `import: os` printed — plus `function: greet_twice`, since `ast.walk` visits *every* node in the tree, including a method definition nested inside a class. That nesting matters for Step 2: a function found this way could be a genuine top-level function, or it could be a method that only makes sense attached to its class, and the graph needs to keep that distinction rather than flattening everything into one undifferentiated pile of "functions."

:::tip[ast.parse can fail — and that's expected, not a bug in your code]
Not every `.py` file in a real repository parses cleanly: a file might be Python 2 code left over in an old repo, a template file with a `.py` extension that isn't valid Python at all, or genuinely have a syntax error someone forgot to fix. `ast.parse` raises `SyntaxError` in exactly this case. Wrapping it in `try`/`except SyntaxError` and skipping the file with a warning — rather than letting the whole tool crash on file one of two thousand — is standard practice for any tool that walks a real codebase, and it's built into the version in Step 2.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python explore_ast.py` runs without errors and prints `function: greet`, `class: Greeter`, and `import: os`.</StepChecklistItem>
<StepChecklistItem>`function: greet_twice` also gets printed, even though it's nested inside `Greeter` — confirming `ast.walk` visits every node, not just top-level ones.</StepChecklistItem>
<StepChecklistItem>You can explain, in one sentence, the difference between `ast.Import` (`import os`) and `ast.ImportFrom` (`from x import y`).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `ast.walk` visits nodes in no particular guaranteed order relative to nesting depth. If you needed to know specifically which class a method belongs to, would flat `ast.walk` iteration alone give you that, or would you need to walk `tree.body` (top-level only) and then each class's own `.body` separately? Why does Step 2 end up doing the latter?
- What would `ast.parse` do if you fed it a `.txt` file full of English prose instead of Python code? Try it and see whether the resulting error message would actually help someone debugging a real "why did my scan skip this file" problem.

## Step 2: Walk a whole repo and build the graph

A single file's structure is a start; a whole repository's worth of files, functions, classes, and their relationships is what makes this a genuine *knowledge graph* instead of a list. `networkx.DiGraph` (directed graph — edges have a direction, since "file A imports module B" isn't the same claim as "module B imports file A") is the data structure that holds all of it.

```python
# build_graph.py (excerpt -- Step 2)
import ast
from pathlib import Path

import networkx as nx


def parse_file(path):
    """Parses one file's AST; returns None and warns instead of crashing on a syntax error."""
    try:
        tree = ast.parse(path.read_text(encoding="utf-8", errors="ignore"), filename=str(path))
    except SyntaxError as exc:
        print(f"Skipping {path}: syntax error ({exc.msg} at line {exc.lineno})")
        return None
    return tree


def build_graph(repo_path):
    graph = nx.DiGraph()

    for path in sorted(repo_path.rglob("*.py")):
        tree = parse_file(path)
        if tree is None:
            continue

        rel = str(path.relative_to(repo_path))
        graph.add_node(rel, kind="file")

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module = alias.name.split(".")[0]
                    graph.add_node(module, kind="module")
                    graph.add_edge(rel, module, kind="imports")
            elif isinstance(node, ast.ImportFrom) and node.module:
                module = node.module.split(".")[0]
                graph.add_node(module, kind="module")
                graph.add_edge(rel, module, kind="imports")

        # Only tree.body -- top-level statements -- so a method nested in a
        # class isn't mistaken for a module-level function (see Step 1).
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                qualified = f"{rel}::{node.name}"
                graph.add_node(qualified, kind="function", short_name=node.name)
                graph.add_edge(rel, qualified, kind="defines")
            elif isinstance(node, ast.ClassDef):
                class_qualified = f"{rel}::{node.name}"
                graph.add_node(class_qualified, kind="class", short_name=node.name)
                graph.add_edge(rel, class_qualified, kind="defines")

    return graph


if __name__ == "__main__":
    graph = build_graph(Path("sample_repo"))
    print(f"{graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges")
```

Every node in a `networkx` graph is just a hashable value — here, a plain string like `"models.py"` or `"models.py::Order"` — with an optional dict of attributes (`kind`, `short_name`) attached. Using `"file.py::name"` as the node id, rather than just `"name"`, matters as soon as a repo has two files that both define a function called `helper` — without the file prefix, `networkx` would silently treat them as the *same* node.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Running `build_graph.py` against a small folder of `.py` files prints a nonzero node and edge count.</StepChecklistItem>
<StepChecklistItem>A file that defines two functions and imports one module produces at least 4 nodes for that file alone (the file itself, the module, and the two functions).</StepChecklistItem>
<StepChecklistItem>Deliberately break one file's syntax (an unclosed bracket) and confirm the tool skips it with a warning instead of crashing.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why use `"file.py::function_name"` as a node id instead of just `"function_name"`? What specifically would go wrong on a repo with two `utils.py` files in different subfolders, each defining a function called `run`?
- `graph.add_node(module, kind="module")` runs every time an import is found, even if that module was already added by an earlier file. Does `networkx` create a duplicate node, or does it just leave the existing one alone? Check the `networkx` docs (or just test it) — why does that behavior make this code safe to call repeatedly without checking "have I seen this module before" yourself?

## Step 3: Add call edges

Files, functions, classes, and imports describe what *exists*. To capture how the pieces actually *use* each other, you need one more relationship: which function calls which. This is the least precise part of the tool — static analysis can't always be certain what a call targets (more on that in the pitfalls below) — but a "best effort, matched by name" version is still genuinely useful.

```python
# build_graph.py (excerpt -- Step 3, extends parse_file's per-function work)
def called_names(func_node):
    """Best-effort list of names a function/method's body calls."""
    names = []
    for node in ast.walk(func_node):
        if isinstance(node, ast.Call):
            target = node.func
            if isinstance(target, ast.Name):          # add(...)
                names.append(target.id)
            elif isinstance(target, ast.Attribute):    # utils.add(...) or self.total()
                names.append(target.attr)
    return names
```

`node.func` on an `ast.Call` is either an `ast.Name` (a bare call like `add(...)`) or an `ast.Attribute` (a dotted call like `utils.add(...)` or `self.total()`) — grabbing `.id` or `.attr` respectively gets you the short name either way, though notice both `utils.add(...)` and `some_other_object.add(...)` collapse down to the same string, `"add"`. That's a real limitation, not an oversight, and it's exactly why the next step's matching is by *name*, not by certainty.

Once every function/class/method in the repo has been added as a node (Step 2), a second pass resolves each recorded call to any node sharing that short name, and adds a `"calls"` edge:

```python
# build_graph.py (excerpt -- Step 3, second pass over the whole graph)
def add_call_edges(graph, calls_by_function):
    by_short_name = {}
    for node, data in graph.nodes(data=True):
        if data.get("kind") in {"function", "method"}:
            by_short_name.setdefault(data["short_name"], []).append(node)

    for caller, called_names_list in calls_by_function.items():
        for name in called_names_list:
            for target in by_short_name.get(name, []):
                if target != caller:
                    graph.add_edge(caller, target, kind="calls")
```

This two-pass structure — first collect every definition, *then* resolve calls against the full set — is necessary because a function defined near the top of a file can call one defined near the bottom; a single top-to-bottom pass would miss forward references entirely.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>After running the full tool on `sample_repo/` (from the companion example, or your own test files), at least one `"calls"` edge exists between two functions in different files.</StepChecklistItem>
<StepChecklistItem>You can point to one specific call in your test code and find the matching edge in the graph.</StepChecklistItem>
<StepChecklistItem>You can explain why the call-resolution step has to run *after* every file has been scanned, not file-by-file as you go.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Two unrelated classes in your test repo both define a method called `run`. If a third function calls `some_object.run()`, will this tool's name-matching add a `"calls"` edge to *both* `run` methods, or just the right one? What would it take to fix that — and is it worth the added complexity for a learning tool like this one?
- `add_call_edges` skips creating a self-loop (`if target != caller`). What real Python pattern would create a self-loop here if that check were removed, and would a self-loop actually be *wrong*, or just visually noisy in Step 4's rendering?

## Step 4: Visualize the graph

A graph with a few hundred nodes is unreadable as a list of edges — visualizing it is what actually lets you *see* a codebase's shape. `pyvis` wraps `networkx` output into a self-contained, interactive HTML page: drag nodes, zoom, hover for details, no server needed beyond opening the file in a browser.

```python
# build_graph.py (excerpt -- Step 4)
from pyvis.network import Network

COLORS = {"file": "#3b82f6", "module": "#9ca3af", "class": "#f59e0b", "function": "#10b981", "method": "#10b981"}


def visualize_pyvis(graph, output_path="graph.html"):
    net = Network(height="800px", width="100%", directed=True, notebook=False)
    net.barnes_hut()  # a physics layout that spaces nodes apart instead of overlapping

    for node, data in graph.nodes(data=True):
        kind = data.get("kind", "module")
        label = data.get("short_name", node)
        net.add_node(node, label=label, title=f"{kind}: {node}", color=COLORS.get(kind, "#9ca3af"))

    for source, target, data in graph.edges(data=True):
        net.add_edge(source, target, title=data.get("kind", ""))

    net.write_html(output_path)
```

```bash
uv run python build_graph.py
```

Open the resulting `graph.html` in a browser. Nodes are colored by kind (blue files, amber classes, green functions/methods, gray external modules); hovering any node or edge shows its full id and relationship kind in a tooltip.

If you'd rather have a static image (for embedding in a document, or for a repo too large for the interactive layout to stay readable), `matplotlib` and `networkx`'s own drawing functions cover that case too:

```python
# build_graph.py (excerpt -- Step 4, matplotlib alternative)
import matplotlib.pyplot as plt

def visualize_matplotlib(graph, output_path="graph.png"):
    fig, ax = plt.subplots(figsize=(12, 9))
    layout = nx.spring_layout(graph, seed=42, k=0.6)  # seed -> reproducible layout between runs
    node_colors = [COLORS.get(graph.nodes[n].get("kind", "module"), "#9ca3af") for n in graph.nodes]
    labels = {n: graph.nodes[n].get("short_name", n) for n in graph.nodes}
    nx.draw_networkx_nodes(graph, layout, node_color=node_colors, node_size=500, ax=ax)
    nx.draw_networkx_labels(graph, layout, labels=labels, font_size=7, ax=ax)
    nx.draw_networkx_edges(graph, layout, ax=ax, arrows=True)
    ax.axis("off")
    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
```

:::tip[pyvis for exploring, matplotlib for sharing a single fixed view]
`pyvis`'s interactivity (dragging, zooming, hovering) is genuinely better for *exploring* an unfamiliar graph — you can drag a dense cluster apart to see what's actually connected to what. `matplotlib`'s static image is better once you already know what you want to show and just need one fixed, embeddable picture — a screenshot of a `pyvis` page doesn't reflect a layout you chose on purpose. Neither is strictly better; they solve different moments in the same workflow.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`graph.html` opens in a browser and shows a real, non-empty graph — not a blank page.</StepChecklistItem>
<StepChecklistItem>Dragging a node moves it, and the connected edges follow it.</StepChecklistItem>
<StepChecklistItem>Hovering a node shows its kind and full id in a tooltip.</StepChecklistItem>
<StepChecklistItem>(If you tried the matplotlib version) `graph.png` exists and opens as a real image, with distinguishable node colors.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `net.barnes_hut()` runs a physics simulation to lay nodes out. What would you expect to happen to that layout's usefulness as the graph grows from 20 nodes to 2,000 — and is that a `pyvis` limitation specifically, or a limitation of *any* general-purpose graph layout algorithm on a large, densely connected graph?
- The matplotlib version passes `seed=42` to `spring_layout`. What would change about the resulting image, run to run, if you removed the seed? Why might a reproducible layout matter if you're comparing two versions of the same graph over time (e.g. "how did this repo's structure change after a refactor")?

## Step 5: Query the graph

A graph you can only look at is already useful, but a graph you can *ask questions of* is more useful — and since `networkx` gives you real graph traversal, this is a handful of lines, not a new system.

```python
# build_graph.py (excerpt -- Step 5)
def what_does_it_call(graph, short_name):
    """Every node matching short_name, and everything it calls."""
    results = []
    for node, data in graph.nodes(data=True):
        if data.get("short_name") == short_name or node == short_name:
            callees = [t for _, t, d in graph.out_edges(node, data=True) if d.get("kind") == "calls"]
            results.append((node, callees))
    return results


def who_imports(graph, module_name):
    """Every file with an 'imports' edge pointing at module_name."""
    if module_name not in graph:
        return []
    return [src for src, _, d in graph.in_edges(module_name, data=True) if d.get("kind") == "imports"]
```

```python
>>> what_does_it_call(graph, "total_with_tax")
[('models.py::Order.total_with_tax', ['utils.py::multiply', 'utils.py::add', 'models.py::Order.total'])]
>>> who_imports(graph, "utils")
['main.py', 'models.py']
```

`graph.out_edges(node, data=True)` and `graph.in_edges(node, data=True)` are the two directions of "follow an edge from this node" — outgoing for "what does this call/import", incoming for "what calls/imports this." That directionality is exactly why Step 2 built a `DiGraph` (directed) instead of an undirected `Graph`: "A imports B" and "B imports A" are different, checkable claims, and an undirected graph would have thrown that distinction away.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`what_does_it_call(graph, ...)` on a function you know calls two others returns both, by name.</StepChecklistItem>
<StepChecklistItem>`who_imports(graph, ...)` on a module you know is imported by two files returns both file names.</StepChecklistItem>
<StepChecklistItem>Querying a name that doesn't exist in the graph returns an empty result, not a crash.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `what_does_it_call` matches on `short_name`, which — as Step 3's Socratic question raised — can collide across unrelated classes with a same-named method. Write a query that instead takes a *fully qualified* node id (e.g. `"models.py::Order.total_with_tax"`) directly. What's the tradeoff between the two query styles — one is easier to type, the other is unambiguous?
- Could you write a `what_calls_it(graph, short_name)` — the reverse of `what_does_it_call` — using `in_edges` instead of `out_edges`? What would it tell you that `what_does_it_call` can't?

## Step 6: Run it end-to-end against a real repo

Everything so far has been building toward one thing: pointing the finished tool at a codebase nobody built specifically for this lesson, and seeing what comes back. The companion example script in [`examples/codebase-knowledge-graph/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/codebase-knowledge-graph) wires up everything from Steps 1–5 into one runnable `build_graph.py`, plus a small `sample_repo/` of toy files with deliberate import/call relationships to try it on first:

```bash
uv run python build_graph.py sample_repo --html graph.html --calls total_with_tax --imports utils
```

Once that works, point it at something real — **this course's own repository is a genuine, non-trivial Python codebase already sitting on your disk if you've cloned it**, or use any other local repo you have:

```bash
uv run python build_graph.py /path/to/python-data-analysis-course/examples --html course_graph.html
```

Open the resulting HTML and actually look at it: which files import the most other modules? Which function has the most incoming "calls" edges (a good proxy for "core, widely-used code")? Does the shape match what you already knew about how the codebase fits together, or does it surface a connection you didn't know was there?

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>The tool runs against a real, multi-file repository (not just the toy `sample_repo/`) without crashing.</StepChecklistItem>
<StepChecklistItem>The resulting graph has visibly more nodes and edges than the toy example, and the visualization still renders.</StepChecklistItem>
<StepChecklistItem>You can name one thing the graph showed you about that codebase's structure that you didn't already know going in.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Pick the node with the most incoming `"calls"` edges in your real-repo graph. Does that node actually feel like "core" code when you open the real file and read it? What might make a node have many incoming edges *without* actually being especially important?
- If you ran this tool against the same repo again a month from now, after real development happened in between, what would a diff between the two graphs actually tell you that a plain `git diff` wouldn't?

## ⚠️ Common pitfalls

- **`ast.parse` failing on one file shouldn't kill the whole scan.** A single file with a syntax error, a non-Python file with a `.py` extension, or old Python 2 code left in a repo will raise `SyntaxError`. Catch it, skip that file with a warning, and keep going — Step 1's `try`/`except` is there specifically so one bad file out of two thousand doesn't end the run.
- **Static analysis can't see dynamic imports or dynamic calls.** `importlib.import_module("some_module")`, `__import__(name)`, or a call built from a variable (`getattr(obj, method_name)()`) don't show up as an `ast.Import`/`ast.Call` node with a literal name the way `import os` or `add(1, 2)` do — this tool, like any purely static analyzer, simply won't see those edges. That's a real, permanent limitation, not a bug to fix; a fully dynamic analysis would need to actually *run* the code and trace what happens, which is a different (and much heavier) kind of tool.
- **Name-based call resolution produces false positives.** Step 3's `add_call_edges` matches calls by short name only, so two unrelated classes that each define a `run` method will both get an edge from any call that looks like `something.run()`, even if only one of them was really meant. This is a legitimate tradeoff for a learning project — full call resolution needs real type inference, which is what a language server or a tool like `pyright` does under the hood.
- **Graphs on a large repo get too dense to read visually.** A few hundred files with heavy cross-imports turns `pyvis`'s force-directed layout into an unreadable tangle — physics-based layouts space nodes apart, but they don't reduce edge count. Filter before visualizing: pick one subfolder, one file's neighborhood (its direct imports/callers only), or use the query functions from Step 5 to answer a specific question instead of trying to render the entire graph at once.

## What you just built

A tool that reads real Python source code the way the interpreter itself parses it, turns file/function/class/import/call relationships into an honest graph data structure, and lets you both *see* that structure (interactively, with `pyvis`) and *query* it (programmatically, with `networkx` traversal) — all without a single network call. The same three-step shape — parse with `ast`, build a graph with `networkx`, query or visualize it — scales from the toy `sample_repo/` up to a real, multi-thousand-file codebase; nothing about the approach was simplified into something that stops working at a larger scale, only the *readability* of a full visualization does.

## Where to go from here

- Add a new edge kind: "inherits from," by reading a class definition's `bases` list (`ast.ClassDef.bases`) — a genuinely useful addition for understanding an object-oriented codebase's structure that this lesson didn't cover.
- Compute real graph metrics with `networkx`'s built-in algorithms instead of eyeballing the visualization — `nx.pagerank` or in-degree centrality to find a codebase's most "central" functions, or `nx.weakly_connected_components` to find isolated clusters of code that nothing else touches.
- Try `nx.readwrite.json_graph.node_link_data` to export the graph as JSON, so a separate tool (or a web frontend, if you're comfortable with one) could consume it without needing `networkx` installed at all.
- Compare two graphs from two different points in a repo's git history (`git worktree` or two clones at different commits) to see, structurally, how a refactor actually changed the codebase's shape — not just which lines changed, but which relationships appeared or disappeared.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="codebase-knowledge-graph" />
