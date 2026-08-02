# Folder Knowledge Graph Example

The local companion to the course's [Turn a Folder of PDFs, Configs, and SQL Schemas Into a Queryable Knowledge Graph](../../docs/projects/folder-knowledge-graph/index.md) project — a real, runnable tool that walks a folder of mixed document types (PDFs via `pypdf`, config files with the standard library, SQL schemas) and builds a `networkx` graph out of the *references* hidden inside them: a schema defines a table, a table references another table, a config value names a table, a PDF mentions a table or a config key. Then you query it — "which configs reference table `users`?" — and get answers a keyword search over raw files can't give you, because the graph knows **indirect** relationships.

<!-- TODO: update these badge links to point at main once this PR merges -->
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/folder-knowledge-graph/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/folder-knowledge-graph/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffolder-knowledge-graph%2Fnotebook.ipynb)

## What's here

- `data/sample/` — a small, realistic project folder: three `.sql` schema files, three config files (`app.toml`, `auth.ini`, `reporting.toml`), and three short text-based PDFs about the same bookstore app. The PDFs are committed (a few KB each) so everything works out of the box.
- `build_graph.py` — the main tool: walks the folder, extracts entities + edges per file type, builds the `networkx` graph, writes an interactive `graph.html` (pyvis, gitignored), and answers the built-in questions.
- `make_pdf_data.py` — deterministically regenerates the sample PDFs with a tiny hand-rolled pure-Python PDF writer (no `reportlab` needed), so you can inspect or recreate them.
- `notebook.ipynb` — the same walkthrough as a self-contained notebook: it writes the sample files (including the PDFs) inline, builds the graph, shows the pyvis output plus a printed adjacency summary, and runs the same queries. Click a badge above to launch it in Colab, Kaggle, or Binder with zero local setup.

No API key, no signup, no network access needed after `uv add` — this is deterministic, hand-written extraction running entirely on your own machine.

## How to run this

```bash
uv run python build_graph.py data/sample
```

This prints the graph summary, answers the two canonical questions ("which configs reference table `users`?", "list all entities that mention `auth`"), and writes `graph.html` — open it in a browser (drag nodes, zoom, hover for tooltips).

Other things to try:

```bash
# Answer one specific question precisely
uv run python build_graph.py data/sample --configs-for-table orders
uv run python build_graph.py data/sample --mentions auth
uv run python build_graph.py data/sample --neighbors "table:books"

# Natural-ish query routing (handles the two canonical questions + a keyword fallback)
uv run python build_graph.py data/sample --query "which configs reference table users"

# Regenerate the sample PDFs (they're committed, so this is only needed to tweak them)
uv run python make_pdf_data.py

# Point it at your own mixed folder of PDFs/configs/SQL
uv run python build_graph.py /path/to/some/folder --html my_graph.html
```

`uv run` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed.

## Where's the AI?

There isn't any, on purpose. Every relationship in this graph comes from hand-written extraction rules — regexes over SQL, `tomllib`/`configparser` for configs, `pypdf` text extraction for PDFs — and those rules are the whole point: they show how much structure you can pull out of a heterogeneous folder deterministically, with only the standard library plus `pypdf`. The tradeoff is real and explicit: the graph is only as good as its rules, and things the rules don't look for are invisible to it. An LLM doing the relation extraction is a genuinely useful upgrade, and the [lesson's Next steps](../../docs/projects/folder-knowledge-graph/index.md) point at it — but it's not needed to get a working, queryable knowledge graph out of this folder.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
