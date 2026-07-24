# Codebase Knowledge Graph Example

The local companion to the course's [Turn a Codebase into a Knowledge Graph](../../docs/projects/codebase-knowledge-graph/index.md) project — a real, runnable tool that parses a Python repo's own source with the built-in `ast` module, builds a graph of its files/functions/classes with `networkx`, and visualizes it as an interactive HTML page with `pyvis`.

## What's here

- `build_graph.py` — parses every `.py` file under a target folder, builds a directed graph (nodes: files, functions, classes, methods, imported modules; edges: "defines", "imports", "calls"), then visualizes it and/or answers simple queries like "what does this function call?".
- `sample_repo/` — three tiny toy files (`utils.py`, `models.py`, `main.py`) with deliberate import and call relationships, so the tool has something small and self-contained to run against without needing any other repo.

No API key, no signup, no network access needed — this is pure static analysis and graph theory, running entirely on your own machine.

## How to run this

```bash
uv run python build_graph.py sample_repo --html graph.html
```

Open `graph.html` in a browser afterward — it's a self-contained interactive page (drag nodes around, zoom, hover for details).

Other things to try:

```bash
# A static PNG instead of/alongside the interactive HTML
uv run python build_graph.py sample_repo --png graph.png

# Query: what does Order.total_with_tax call?
uv run python build_graph.py sample_repo --calls total_with_tax

# Query: what imports utils?
uv run python build_graph.py sample_repo --imports utils

# Point it at a real repo instead of the toy sample -- e.g. this course itself
uv run python build_graph.py /path/to/python-data-analysis-course/examples
```

`uv run` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed.

See the full [Turn a Codebase into a Knowledge Graph lesson](../../docs/projects/codebase-knowledge-graph/index.md) for the step-by-step walkthrough, including how the AST parsing and call-resolution logic work.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
