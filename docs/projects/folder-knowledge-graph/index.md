---
id: folder-knowledge-graph
title: "Turn a Folder of PDFs, Configs, and SQL Schemas Into a Queryable Knowledge Graph"
sidebar_label: "Turn a Folder of PDFs, Configs, and SQL Schemas Into a Knowledge Graph"
slug: /projects/folder-knowledge-graph
description: "Graduate from the in-browser playground to real Python: walk a folder of mixed PDFs, config files, and SQL schemas, extract the hidden references between them with pypdf and the standard library, and build a queryable networkx graph — no API key, no LLM, no network access needed."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Turn a Folder of PDFs, Configs, and SQL Schemas Into a Queryable Knowledge Graph

<ProjectPublishedDate projectId="folder-knowledge-graph" />

<ProjectGreeting />

You have a folder full of documents — a couple of SQL schema files, a few config files, some PDFs describing how everything fits together. You need an answer to a question the docs don't have a heading for: "which configs reference the `users` table?", "what exactly does this PDF touch?". A keyword search over the raw files fails on the second question instantly and only half-answers the first. This project builds the tool that *does* answer both: it walks a **heterogeneous folder** — PDFs via `pypdf`, config files with the standard library, SQL schemas with a couple of regexes — and turns the references hiding inside those documents into a **graph**: files, tables, and config keys as nodes; "defines", "references", and "mentions" as edges. Then you ask the graph questions, using real graph traversal, no AI required.

The teaching core is the reframe: **a heterogeneous folder is a knowledge-graph problem, not a search problem.** The structure you want is already in the documents — a config value names a table, a foreign key points at another table, a PDF's prose names a config key — and it can be extracted deterministically, offline, with tools you've already met (`re`, `pathlib`, and a couple of tiny parsers). Once it's a graph, questions that need *indirect* knowledge — "which config keys end up touching the `books` table?" — become a one-liner, where they're nearly impossible to answer by searching file text.

The honest framing: every relationship here comes from **hand-written extraction rules**, so the graph is only as good as its rules. Things the rules don't look for are invisible to it — that's a real limitation, and an important one to internalize before you ever bolt an LLM onto a pipeline like this. (An optional extension, mentioned in Next steps but not built here, is an LLM doing the relation extraction.)

This assumes Python 101 and comfort with functions, dictionaries, and loops; a little regex helps but isn't required. Nothing from Data Analysis is required, and nothing here calls any model or web service. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv` and set up a small project with `pypdf`, `networkx`, and `pyvis` — no API key, no signup, nothing to configure.
2. Read a config file's keys with the standard library (`tomllib` for TOML, `configparser` for INI) and turn each key into an entity.
3. Parse SQL schema files with a couple of regexes: `CREATE TABLE` names become tables, `REFERENCES` becomes edges between tables.
4. Extract text from the PDFs with `pypdf`, using a tiny hand-written PDF writer to generate the sample ones.
5. Build the `networkx` graph and resolve the cross-file references — config values naming tables, PDFs mentioning tables and keys — with a two-pass approach.
6. Visualize the graph with `pyvis` and query it: "which configs reference table `users`?", "list all entities that mention `auth`".

## Where to run this

**Locally with `uv`** is the primary, recommended path — real Python, on your own machine, reading real files from a real folder on disk.

**GitHub Codespaces** works great here too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab — and the sample folder is already sitting there in the repo to point the tool at.

**Google Colab or Kaggle Notebooks** are a genuinely easy option too, not just a fallback — this project needs no GPU, no API key, and no server, just `pip install`s and pure computation. `!pip install pypdf networkx pyvis` in a cell, and the rest of the code below works essentially unchanged (pyvis's HTML output can even be displayed inline in a notebook cell).

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/folder-knowledge-graph/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/folder-knowledge-graph/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffolder-knowledge-graph%2Fnotebook.ipynb)

A ready-made notebook with all of the code below — including the sample files and PDFs written out inline, so there's nothing to upload or clone — is at [`examples/folder-knowledge-graph/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/folder-knowledge-graph/notebook.ipynb). Click a badge above to launch it directly.

> **opencode** *(optional)* — a free, open-source AI coding agent that runs in your terminal. If you'd rather have an agent write and run this project for you than type the code yourself, install it with `curl -fsSL https://opencode.ai/install | bash` (or `npm install -g opencode-ai`) and point it at this repo with the same API key from Setup below. It's optional — this project's whole point is building it yourself, so treat it as a bonus, not a shortcut.

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
uv init folder-graph
cd folder-graph
uv add pypdf networkx pyvis
```

`pypdf` is a free, pure-Python library for reading and writing PDFs — it extracts the text that PDFs don't otherwise give you as a plain string. `networkx` handles the actual graph data structure (nodes, edges, traversal). `pyvis` turns a `networkx` graph into an interactive HTML page you can drag around and zoom in a browser.

That's the whole setup. **No API key, no `.env` file, no free-tier signup, no environment variable to configure** — every step from here on reads local files and runs local computation.

:::tip[No internet access needed after installation]
Once `uv add` finishes downloading these three packages, the entire rest of this project can run with your network disconnected. Everything else in this section of the course revolves around calling a remote model or a remote website, so it's easy to start assuming every "real" Python project needs a network call somewhere. This one is a useful counterexample — deterministic document parsing and graph theory are entirely offline.
:::

## Step 1: Read a config file's keys with the standard library

Your folder's config files are the easiest win, because the standard library already ships parsers for the two most common formats. TOML (used by `pyproject.toml`, Cargo, and many modern tools) is parsed by `tomllib` — built into Python 3.11+; INI (older but everywhere) by `configparser`.

```python
# explore_config.py
import tomllib
from pathlib import Path

with open("app.toml", "rb") as f:
    data = tomllib.load(f)

# data is a nested dict: {"database": {"port": 8080}, ...}
for section, values in data.items():
    print(section, "->", values)
```

For the sample project you'll build this folder for, a config file looks like this:

```toml
# app.toml
[database]
dbname = "bookstore"
seed_tables = ["users", "books"]

[auth]
jwt_secret = "change-me-in-prod"
```

The key insight for the graph: each config key — `database.seed_tables`, `auth.jwt_secret` — is an *entity* in its own right, and its *value* may name other entities in the folder ("users", "books" are table names from the SQL files). That's a reference waiting to become a graph edge. So the first extraction step flattens the nested dict into dotted key paths and records each one:

```python
def flatten_toml(data, prefix=""):
    """Flattens nested TOML into dotted key paths, e.g. {"database": {"port": 8080}}
    becomes {"database.port": 8080}. Values keep their native types."""
    flat = {}
    for key, value in data.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            flat.update(flatten_toml(value, path))
        else:
            flat[path] = value
    return flat
```

INI is the same idea with `configparser` — for every section, for every key inside it, the dotted path is `section.key`:

```python
import configparser

parser = configparser.ConfigParser()
parser.read_string(Path("auth.ini").read_text(encoding="utf-8"))
keys = {f"{section}.{key}": value
        for section in parser.sections()
        for key, value in parser.items(section)}
```

Flattening matters because a graph node needs a *unique, stable id*: `database.seed_tables` and `auth.seed_tables` in the same file are different keys, and if you just used `seed_tables` as the node id, `networkx` would silently merge them — the same "qualified id" lesson as the codebase version of this project, where `utils.py::run` and `models.py::run` must not become the same node.

:::tip[What about YAML?]
The sample folder uses TOML and INI on purpose, because both have first-class parsers in the standard library. YAML does not — and this project deliberately avoids `PyYAML` to stay dependency-light. The companion example handles simple `key: value` YAML with a tiny regex fallback and warns that nested YAML is out of scope; if you need real YAML, that's an honest place to add a dependency.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`flatten_toml({"a": {"b": 1}})` returns `{"a.b": 1}` — dotted key paths, not nested dicts.</StepChecklistItem>
<StepChecklistItem>Running the INI snippet on `auth.ini` yields keys like `auth.provider` and `auth.session_table`.</StepChecklistItem>
<StepChecklistItem>You can explain why `database.seed_tables` is a better node id than `seed_tables`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `tomllib.load` requires the file to be opened in binary mode (`"rb"`); `configparser.read_string` takes a string. Why does the TOML parser care about bytes while the INI parser doesn't?
- The flattened key path uses a dot as a separator. What would go wrong if a key itself contained a dot (e.g. `"my.key"`), and how would you disambiguate?

## Step 2: Parse SQL schemas — tables and foreign keys

Config keys are half the story. The SQL schema files define the *tables* that config values and PDFs keep naming — the other half. A full SQL parser is a big project; a schema parser needs almost nothing, because schemas are heavily conventional:

```python
# explore_sql.py (excerpt)
import re

def extract_sql(text):
    """Every CREATE TABLE name in the file, plus, for each table, every table
    its foreign keys REFERENCES."""
    current_table = None
    for line in text.splitlines():
        create = re.match(r"(?i)^\s*create\s+table\s+([a-z0-9_]+)", line)
        if create:
            current_table = create.group(1).lower()
            print("table:", current_table)
        ref = re.search(r"(?i)references\s+([a-z0-9_]+)", line)
        if ref and current_table:
            print(f"  {current_table} references {ref.group(1).lower()}")
```

```bash
uv run python explore_sql.py < 001_users.sql
```

For the sample schema file this prints:

```
table: users
table: sessions
  sessions references users
```

Two relationships live in one line: `CREATE TABLE sessions` *defines* the `sessions` node, and `user_id INTEGER NOT NULL REFERENCES users(id)` *connects* `sessions` to `users`. Notice the `references` match doesn't depend on the line being a `CREATE TABLE` line — tracking `current_table` as you scan, so a `REFERENCES` clause knows which table it belongs to, is the whole trick. (Also notice it doesn't matter that `users` is defined in a *different file* — `sessions` in `001_users.sql` can reference `users` in the same file or `books` in `003_books.sql`; the graph doesn't care, and neither should your extractor.)

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Running `extract_sql` on `001_users.sql` prints `table: users`, `table: sessions`, and `sessions references users`.</StepChecklistItem>
<StepChecklistItem>A table referenced by a foreign key is still reported even if it's defined in a different `.sql` file.</StepChecklistItem>
<StepChecklistItem>You can explain what `current_table` is tracking and why the scan is line-by-line rather than a single regex over the whole file.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The regexes here are case-insensitive (`(?i)`) and anchored at line start. What schema formatting would these regexes *miss* — and is that an acceptable tradeoff for a learning project?
- If a `REFERENCES` clause pointed at a table that appears nowhere in the folder, should the extractor crash, warn, or silently create the node? Which choice keeps the tool most robust on a real folder?

## Step 3: Extract text from the PDFs with pypdf

PDFs are the hard file type, because unlike SQL and configs there's no standard-library parser and no structured syntax — a PDF is a binary container, and the text inside it is only reconstructed by the viewer. `pypdf` is the friendly entry point:

```python
# explore_pdf.py
from pypdf import PdfReader

reader = PdfReader("architecture.pdf")
for page in reader.pages:
    print(page.extract_text())
```

That's the whole extraction: `extract_text()` returns whatever text the PDF's content streams actually draw. For a text-based PDF (created by typing, not scanning) this gives you clean, searchable prose — which is exactly what the "mentions" edges in Step 4 will scan. For a *scanned* PDF it gives you nothing, because the "text" is just an image of a page; handling that case means OCR, which is a genuinely different problem (the [Chat with PDFs](/docs/projects/chat-with-pdfs) project's indexing pipeline is where that starts to matter).

Where do the sample PDFs come from? `pypdf` reads PDFs but doesn't ship a text-layout writer, so the sample folder's PDFs are generated by a small committed script, `make_pdf_data.py`, that hand-crafts minimal valid PDFs — a catalog object, a page object, two font objects, and a content stream that draws text with the classic `BT`/`ET` operators. It's a genuinely useful trick to have seen once: a valid PDF is just a few objects plus an `xref` offset table, and a pure-Python writer is ~60 lines. The generated files are tiny (a couple of KB each) and are committed to the repo so everything works out of the box; the script is there so you can inspect or regenerate them.

:::tip[If a PDF won't parse, skip it — don't crash the run]
`PdfReader` can raise on corrupt, encrypted, or otherwise unusual PDFs. The full tool in Step 4 wraps extraction in `try`/`except` and skips the file with a warning — exactly like the codebase version of this project skips a `.py` file that `ast.parse` can't handle. One bad file out of a hundred shouldn't end the run.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`pypdf` extracts readable prose from at least one of the sample PDFs in `data/sample/pdfs/`.</StepChecklistItem>
<StepChecklistItem>You can run `make_pdf_data.py` and regenerate identical PDFs (same byte sizes) deterministically.</StepChecklistItem>
<StepChecklistItem>You can explain, in one sentence, why a scanned PDF returns empty text from `extract_text()`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The hand-written PDF writer draws every line with the same built-in font. What would a real PDF generator like `reportlab` give you that this minimal writer doesn't — and why is "good enough to extract text back out" the right bar for sample data?
- `extract_text()` returns text *in the order the PDF draws it*, which for a multi-column layout can be wrong. If your folder's PDFs were two-column documents, what would that do to the "mentions" edges in Step 4 — would they still be correct?

## Step 4: Build the graph and resolve the references

Now the parts connect. Everything so far extracted *entities*; this step turns them into a **graph** and, crucially, resolves the *references* that only become visible once the whole folder is in view. `networkx.DiGraph` (directed — "config references table" isn't the same claim as "table references config") is the data structure.

```python
# build_graph.py (excerpt -- Step 4)
import networkx as nx

def build_graph(folder):
    graph = nx.DiGraph()
    config_keys = []   # (config_key_node, value_as_text) -- resolved later
    pdf_files = []     # file nodes whose text we scan for mentions later

    for path in sorted(folder.rglob("*")):
        if not path.is_file():
            continue
        rel = str(path.relative_to(folder))

        if path.suffix == ".sql":
            graph.add_node(rel, kind="file", doc_type="sql")
            extract_sql(path, graph, rel)          # Step 2
        elif path.suffix in {".toml", ".ini", ".cfg"}:
            graph.add_node(rel, kind="file", doc_type="config")
            config_keys.extend(extract_config(path, graph, rel))   # Step 1
        elif path.suffix == ".pdf":
            graph.add_node(rel, kind="pdf")
            extract_pdf_text_onto_node(path, graph, rel)           # Step 3
            pdf_files.append(rel)
    ...
```

Each extractor does two things: adds nodes with a stable id (`table:users`, `key:config/app.toml:database.seed_tables`, or just the file's relative path) and adds the local edges it can see immediately — a file *defines* the tables and keys inside it, a table *references* the table its foreign key points at.

The second pass is where the *knowledge* shows up. A config value can name a table defined in another file; a PDF can mention a config key from a third file. None of those edges are resolvable until every file has been scanned — the exact same reason the codebase version of this project resolves "calls" edges only after every function is known:

```python
# build_graph.py (excerpt -- Step 4, second pass)
def mentions(haystack, name):
    """Word-boundary match: `users` matches "users table" but not "user_id"
    or "idx_sessions_user"."""
    return re.search(rf"\b{re.escape(name)}\b", haystack.lower()) is not None

# Every table in the folder is now a known node -- index them by name.
tables = {node.removeprefix("table:"): node for node in graph.nodes
          if node.startswith("table:")}

# 1. Config values that name a table -> "references" edge.
for key_node, value_text in config_keys:
    for table_name, table_node in tables.items():
        if mentions(value_text, table_name):
            graph.add_edge(key_node, table_node, kind="references")

# 2. PDF text that names a table or a config key -> "mentions" edge.
for rel in pdf_files:
    text = graph.nodes[rel]["text"]
    for table_name, table_node in tables.items():
        if mentions(text, table_name):
            graph.add_edge(rel, table_node, kind="mentions")
```

Config keys are referable two ways — by their full dotted path (`auth.jwt_secret`) or by their leaf name (`jwt_secret`, which is how prose usually says it) — so the real script indexes both, the same "match by name, resolve by list" approach the codebase version uses for call edges. The `\b...\b` word boundaries matter more than they look like they should: without them, `users` would "mention"-match `user_id` and `idx_sessions_user`, and the graph would be full of edges that describe strings, not relationships.

When this runs on the sample folder you get a graph with three kinds of nodes — files, tables, and config keys — and three kinds of edges:

| Edge kind | Source | Target | Meaning |
|---|---|---|---|
| `defines` | a `.sql`/config file | a table / config key | "this file declares this entity" |
| `references` | a table or config key | a table | "this foreign key / config value points at that table" |
| `mentions` | a PDF | a table / config key | "this document talks about that entity" |

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`build_graph` on the sample folder returns a graph with a nonzero number of `references` and `mentions` edges, not just `defines` edges.</StepChecklistItem>
<StepChecklistItem>`table:books` has incoming edges from config keys, from PDFs, *and* from `table:order_items`'s foreign key.</StepChecklistItem>
<StepChecklistItem>Removing the `\b` word boundaries from `mentions()` produces visible extra (wrong) edges — proving the boundaries were doing real work.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why must the `references`/`mentions` pass run *after* every file is scanned, not file-by-file as you go? What specific edge would a single top-to-bottom pass miss?
- The second pass iterates every config key against every table name — `O(keys × tables)`. On a folder with thousands of files that's still fast at this scale, but can you sketch the change (indexing names by word, for example) that would make it `O(keys + tables)`?

## Step 5: Visualize the graph

A graph you can only print as a list of edges is hard to actually *see* — a small one like this, with ~30 nodes, is already borderline. `pyvis` wraps the `networkx` graph into a self-contained, interactive HTML page: drag nodes, zoom, hover for details, no server needed.

```python
# build_graph.py (excerpt -- Step 5)
from pyvis.network import Network

COLORS = {"file": "#3b82f6", "pdf": "#f59e0b", "table": "#10b981", "config_key": "#8b5cf6"}

def visualize_pyvis(graph, output_path="graph.html"):
    net = Network(height="800px", width="100%", directed=True, notebook=False)
    net.barnes_hut()  # a physics layout that spaces nodes apart instead of overlapping

    for node, data in graph.nodes(data=True):
        kind = data.get("kind", "file")
        net.add_node(node, label=data.get("short_name", node),
                     title=f"{kind}: {node}", color=COLORS.get(kind, "#9ca3af"))
    for source, target, data in graph.edges(data=True):
        kind = data.get("kind", "")
        net.add_edge(source, target, title=kind)

    net.write_html(output_path)
```

```bash
uv run python build_graph.py data/sample
```

Open the resulting `graph.html` in a browser. Blue nodes are schema/config files, amber are PDFs, green are tables, purple are config keys; hovering any node or edge shows its full id and relationship kind. The most interesting thing to look for: which tables have *both* a blue `defines` edge from a schema file *and* amber `mentions` edges from multiple PDFs and purple `references` edges from config keys — those are the entities the whole folder agrees are important, and that agreement is exactly the kind of signal a keyword search can't give you.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`graph.html` opens in a browser and shows a real, non-empty graph — not a blank page.</StepChecklistItem>
<StepChecklistItem>Dragging a node moves it, and the connected edges follow it.</StepChecklistItem>
<StepChecklistItem>Hovering a node shows its kind and full id in a tooltip; hovering an edge shows its kind (`defines`, `references`, or `mentions`).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Node *labels* use the short name (`seed_tables`) while the *title tooltip* shows the full id (`key:config/app.toml:database.seed_tables`). Why not label nodes with the full id? What would the visualization look like if it did?
- The graph is directed, and `pyvis` draws arrows. For a `mentions` edge (PDF → table) the arrow direction is obvious; what would an undirected version of this graph cost you when you get to Step 6's queries?

## Step 6: Query the graph

A graph you can only look at is already useful; a graph you can *ask questions of* is the whole point. `networkx` gives you real traversal, so both directions of "what's connected to this node" are a handful of lines:

```python
# build_graph.py (excerpt -- Step 6)
def configs_for_table(graph, table_name):
    """Which config keys reference this table? Returns (config_key_node, file)."""
    table_node = f"table:{table_name}"
    if table_node not in graph:
        return []
    return [(src, graph.nodes[src].get("file", "?"))
            for src, _, data in graph.in_edges(table_node, data=True)
            if data.get("kind") == "references"
            and graph.nodes[src].get("kind") == "config_key"]

def entities_mentioning(graph, keyword):
    """Every entity whose id, label, or extracted text contains `keyword`."""
    needle = keyword.lower()
    return [node for node, data in graph.nodes(data=True)
            if needle in f"{node} {data.get('short_name', '')} {data.get('text', '')}".lower()]
```

```bash
uv run python build_graph.py data/sample --configs-for-table users
uv run python build_graph.py data/sample --mentions auth
```

`graph.in_edges(node, data=True)` walks every edge *pointing at* a node — the exact operation "what refers to this table?" needs. `entities_mentioning` is a keyword search, but over the graph's *content*: a PDF's extracted text lives on its node, so a match is an *entity* you can then expand with its neighbors, not a raw file you'd have to re-read.

The companion example runs two canonical queries by default, and supports a `--query` flag that routes a few natural-language phrasings to the right function:

```bash
uv run python build_graph.py data/sample

# Q1: which configs reference table 'users'?
#   key:config/app.toml:database.migrate_tables  (in config/app.toml)
#   key:config/app.toml:database.seed_tables    (in config/app.toml)
# Q2: list all entities that mention 'auth'
#   ...every config key under auth.*, both auth-related PDFs, auth.ini itself...
```

The answer to Q1 is the project's whole thesis in one output line: `app.toml`'s `seed_tables` key references the `users` table — a relationship between a config file and a schema file that exists nowhere in either file's *text* as a direct statement. It's manufactured by the graph from two documents that happen to name the same thing. That's the "indirect relationship" a keyword search can't answer.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`--configs-for-table users` lists `key:config/app.toml:database.seed_tables` and `key:config/app.toml:database.migrate_tables`.</StepChecklistItem>
<StepChecklistItem>`--mentions auth` returns a non-empty list including at least one PDF and at least one config key.</StepChecklistItem>
<StepChecklistItem>Querying a table that doesn't exist in the graph returns an empty result, not a crash.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `configs_for_table` answers "what refers to this table?" using `in_edges`. Write the reverse — "what does this config key's value touch?" — using `out_edges`. Which one is more natural for a *PDF* node, and why?
- The `entities_mentioning` search matches substrings in a node's full text, so `--mentions auth` also matches `authentication` and `author`. Is that a bug or a feature? How would you make it exact if the question really meant the `auth` config section?

## ⚠️ Common pitfalls

- **One bad file shouldn't kill the whole scan.** A corrupt or encrypted PDF, or a config file with a TOML parse error, will raise if you let it. Catch, warn, skip, keep going — exactly the discipline the codebase version of this project applies to `SyntaxError`s. Step 3's `try`/`except` and a `try` around `tomllib.loads` are there for that reason.
- **Word boundaries or your edges lie.** Matching `users` without `\b` boundaries creates edges against `user_id`, `idx_sessions_user`, and any other string that happens to contain the name as a substring. The "references"/"mentions" edges are only as trustworthy as the matcher that made them.
- **Config keys can share a leaf name.** Two config files can both define a `port` key. If you index config keys by leaf name only, mentions of `port` resolve to a guess — the full script maps each name to a *list* of candidate nodes and links them all, exactly like the codebase version's `by_short_name` for calls. Same tradeoff, same honest resolution.
- **The graph is only as good as its rules.** A table name written as "the login table" in a PDF, a foreign key inside a `CONSTRAINT` on its own line, a schema with `CREATE TABLE` split across lines — the hand-written extractors here miss all of those, and that's the point: this is a rules-based tool, and understanding exactly where its blind spots are is the lesson. This is also the strongest argument for the LLM extension in the next section — but notice that the LLM then becomes a *replacement for the extractors*, not an addition to them.
- **Scanned PDFs have no text to extract.** `extract_text()` returns empty for a PDF that's just images. Don't debug that as a pypdf bug; it's a missing OCR step, which is a different (and much heavier) kind of tool.

## What you just built

A tool that walks a heterogeneous folder — PDFs, config files, SQL schemas — and rebuilds the *relationships* between its documents as an honest graph data structure: files, tables, and config keys as nodes, "defines"/"references"/"mentions" as edges, all extracted deterministically with `pypdf` and the standard library. You can *see* it (interactively, with `pyvis`) and *query* it (with `networkx` traversal), and the queries answer questions — "which configs reference table `users`?", "which documents touch `books`?" — that a keyword search over raw files cannot, because the graph knows relationships that only exist *between* documents. The whole pipeline runs offline, with no API key, and nothing about it was simplified into a toy: the same three-step shape — extract entities, build a graph, query it — is how a real "internal knowledge base" over a real documentation folder would start.

## Where to go from here

- Point `build_graph` at your own folder of PDFs/configs/SQL (or just two file types) and see which relationships it surfaces that you didn't already know. The [codebase knowledge graph](/docs/projects/codebase-knowledge-graph) project is the sibling version of this tool for Python code — the graph-building structure transfers almost line for line.
- Add a file type or a rule: an `INSERT INTO`/`SELECT FROM` edge in the SQL extractor, a `key: value` YAML fallback, or an "inherits from" style relationship for your own document format. Each rule is a few lines, and each one makes the graph answer a question it previously couldn't.
- Use real graph algorithms instead of eyeballing: `nx.pagerank` or in-degree centrality on the table nodes to find the most-referenced tables (a decent proxy for "core schema"), or `nx.weakly_connected_components` to find documents that nothing else touches.
- **The LLM upgrade (mentioned, not built):** let an LLM do the relation extraction — give it each PDF's text and the known entity names, and ask it to emit `(source, relation, target)` triples, which you then feed straight into the same `networkx` graph. You'd lose the guarantee of determinism but gain the ability to catch synonyms and prose references the hand-written rules miss. If you want a working LLM-with-retrieval pipeline to model the surrounding system on, the [RAG over your own notes](/docs/projects/rag-notes) project shows the shape.
- Export the graph as JSON with `nx.readwrite.json_graph.node_link_data` so another tool (or a web frontend) can consume it without needing `networkx`.

## Related projects

- [Chat with PDFs](/docs/projects/chat-with-pdfs) — the same "PDFs are hard to get text out of" starting point, taken in the RAG direction: chunk, embed, and ask a model questions about your documents.
- [Codebase Knowledge Graph](/docs/projects/codebase-knowledge-graph) — the sibling project this one's two-pass graph-building structure is modeled on, applied to a folder of Python files instead of mixed documents.
- [RAG App Over Your Own Notes](/docs/projects/rag-notes) — retrieval over a document folder with local embeddings, where the extraction step of this project would slot in before the embedding step.
- [MCP Notes Server](/docs/projects/mcp-notes-server) — expose a searchable index over a folder of documents to an LLM client, a different answer to the same "my knowledge is stuck in files" problem.
- [Docs Q&A Bot](/docs/projects/docs-qa-bot) — wraps a document-retrieval pipeline in a Discord bot, end-to-end.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="folder-knowledge-graph" />
