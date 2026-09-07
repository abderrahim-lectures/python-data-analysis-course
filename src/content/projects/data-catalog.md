---
title: "Build a Data Catalog"
description: "Searchable metadata catalog that indexes datasets, schemas, and data lineage across your organization."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "csv", "json", "metadata"]
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries)"
  - "Reading CSV files with the csv module"
learningObjectives:
  - "Extract schema metadata (columns, inferred types, row counts) from CSV datasets"
  - "Persist a searchable catalog index as JSON"
  - "Score and rank dataset search results by term matches"
  - "Record data lineage edges and walk upstream and downstream dependency chains"
  - "Expose add, search, and lineage as CLI subcommands"
---

# 🗂️ Build a Data Catalog

Before anyone can use data, someone has to be able to *find* it, trust what it is, and know where it came from. That's the job of a data catalog — an organization's index of its own datasets. This project builds a real, small one: it scans CSV files and records their schema (columns, inferred types, row counts) into a persistent JSON index, answers free-text searches across dataset and column names, and tracks *lineage* — which dataset feeds which transformation, so you can answer "what breaks if this CSV changes?" with a traversal instead of a guess.

This assumes Python 101 plus comfortable `csv` reading — collections, dicts, and functions. Nothing from the Data Analysis module is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Write a metadata extractor that turns a CSV file into a catalog entry — column names, inferred types, row count.
2. Build a persistent `CatalogIndex` that saves and reloads itself as JSON.
3. Implement a scored full-text search over dataset names and column names.
4. Record lineage edges and walk dependency chains both forwards and backwards.
5. Wrap the whole thing in a `catalog.py` CLI with `add`, `search`, and `lineage` subcommands.

## Where to run this

**Locally with `uv`** is the recommended path — a catalog is about *your* folders of CSVs on disk, and the CLI's whole point is being pointed at real files. Setup is standard-library-only (plus `tomllib`-free, so a plain recent Python suffices).

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed) and run the same commands — there are plenty of CSVs inside `examples/` to point it at.

**Google Colab, Kaggle Notebooks, or Binder** work well for the *search logic* half of this project — the notebook at [`examples/data-catalog/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.ipynb) runs every step on bundled sample datasets. The honest note: a notebook's sample CSVs are fixed, so the "scan *my* folder" magic is a local-`uv` experience.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-catalog%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the "install Python, then pip, then a virtual environment tool" chain — and nothing in this project needs a third-party package.

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
uv init data-catalog
cd data-catalog
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `data-catalog/` exists with a `pyproject.toml`.
- ✅ `python -c "import csv, json"` succeeds — no third-party packages.

## Step 1: Extract schema metadata from CSVs

A catalog entry is the *description of a dataset*, not the data itself: which columns exist, what kind of values each holds, how many rows. Extracting that is the moment a raw file becomes a findable asset — and the trickiest part is *inferring a type* from a column's values without being lied to by one stray number.

### 1.1 Write the extractor and an inference helper

**👟 Starter hint:** Create two sample CSVs, then `extract_metadata`, which uses `csv.DictReader` to grab headers and rows, and `_infer_type`, which asks "can every non-empty value become a float?" before it dares label a column numeric:

```python
# metadata.py
import csv
from dataclasses import dataclass, field
from pathlib import Path

@dataclass
class CatalogEntry:
    name: str
    source: str
    columns: list[str] = field(default_factory=list)
    dtypes: list[str] = field(default_factory=list)
    row_count: int = 0

def _infer_type(values: list[str]) -> str:
    if not values:
        return "empty"
    if all(v.lower() in {"true", "false"} for v in values):
        return "boolean"
    try:
        for v in values:
            float(v)
        return "numeric"
    except ValueError:
        return "text"

def extract_metadata(path: str) -> CatalogEntry:
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []
        rows = list(reader)
    dtypes = [
        _infer_type([row[col] for row in rows if row.get(col, "").strip()])
        for col in columns
    ]
    return CatalogEntry(
        name=Path(path).stem,
        source=path,
        columns=columns,
        dtypes=dtypes,
        row_count=len(rows),
    )

if __name__ == "__main__":
    products = """id,name,price,stock,active\n1,Keyboard,49.99,120,true\n2,Mouse,24.50,300,false\n"""
    customers = """id,full_name,region\n7,Ada Wong,north\n8,Grace Hopper,south\n"""
    with open("products.csv", "w") as f:
        f.write(products)
    with open("customers.csv", "w") as f:
        f.write(customers)

    for csv_file in ["products.csv", "customers.csv"]:
        entry = extract_metadata(csv_file)
        print(f"{entry.name}: {entry.row_count} rows")
        for col, dtype in zip(entry.columns, entry.dtypes):
            print(f"  {col}: {dtype}")
```

The order of checks in `_infer_type` is a small decision tree: booleans are a *subset* of things you could call numeric (`"true"` isn't a float, actually — the `try float` guards that), so boolean is checked first, and the `"empty"` case returns early so an all-blank column never scores as oddly-numeric. `reader.fieldnames or []` is a quiet defense: an empty file has `None` fieldnames, and every later loop assumes a list.

**🎯 Expected output:**

```
products: 2 rows
  id: numeric
  name: text
  price: numeric
  stock: numeric
  active: boolean
customers: 2 rows
  id: numeric
  full_name: text
  region: text
```

**🩹 If it's off:** If `price` infers as `text`, a cell somewhere holds a value like `"49,99"` or `"$49.99"` that `float()` rejects — clean the data or accept "text" as the honest answer. If `active` infers as `text`, one value isn't `true`/`false` — check for a literal `"1"` mixed in with booleans.

### 1.2 Verify extraction

**✅ Checklist**

- ✅ Both sample CSVs produce entries with the correct column and dtype lists above.
- ✅ `row_count` equals the number of data rows, counting the header row *not* included.
- ✅ `_infer_type([])` returns `"empty"` without crashing.

**🤔 Socratic Question(s)**

- An "all numeric" verdict comes from *one* `float(...)` succeeding for every value. What does an `id` column of `["001", "002"]` get classified as — and why is that arguably *wrong* for a catalog where IDs are meant to be opaque labels, not arithmetic?
- The extractor loads every row into memory (`rows = list(reader)`). What part of the code would need to change to catalog a 50 GB CSV, and which parts (headers, dtypes) survive unchanged?

## Step 2: Persist a searchable index

An in-memory dict of entries evaporates when the process ends, which makes it useless as an *organization's* catalog. The fix is a `CatalogIndex` that serializes itself to JSON on every change and reloads on startup — the same durability trick real catalogs get from databases, scaled down to a file.

### 2.1 Write the JSON-backed index

**👟 Starter hint:** A class whose constructor tries to load `catalog.json` and degrades to an empty dict when the file is missing; `add`/`remove` mutate then immediately `_save`:

```python
# index.py
import json
from pathlib import Path

from metadata import CatalogEntry, extract_metadata

class CatalogIndex:
    def __init__(self, path: str = "catalog.json"):
        self.path = path
        self.entries: dict[str, CatalogEntry] = self._load()

    def _load(self) -> dict[str, CatalogEntry]:
        p = Path(self.path)
        if not p.exists():
            return {}
        data = json.loads(p.read_text())
        return {name: CatalogEntry(**payload) for name, payload in data.items()}

    def add(self, entry: CatalogEntry) -> None:
        self.entries[entry.name] = entry
        self._save()

    def remove(self, name: str) -> bool:
        removed = self.entries.pop(name, None) is not None
        if removed:
            self._save()
        return removed

    def _save(self) -> None:
        payload = {name: entry.__dict__ for name, entry in self.entries.items()}
        Path(self.path).write_text(json.dumps(payload, indent=2))

if __name__ == "__main__":
    index = CatalogIndex()
    index.remove("products")
    index.add(extract_metadata("products.csv"))
    index.add(extract_metadata("customers.csv"))
    index.remove("customers")
    for name, entry in index.entries.items():
        print(f"{name}: {entry.columns}")
```

`entry.__dict__` is the low-effort serialization trick: dataclass instances store their fields in a plain `__dict__`, so `json.dumps` of a dict-of-`__dict__` needs no custom encoder, and `CatalogEntry(**payload)` on the way back in rehydrates it with the exact keys. The JSON file becomes the *source of trust* across runs — close the terminal, reopen it, and `CatalogIndex()` rebuilds the same dict.

**🎯 Expected output:**

```
products: ['id', 'name', 'price', 'stock', 'active']
```

**🩹 If it's off:** If a `TypeError: __init__() got an unexpected keyword argument` appears on reload, `catalog.json` holds a key the dataclass doesn't define — delete the stale file or rename the field to match. If `catalog.json` never appears on disk, `_save()` isn't being called from `add` — every mutation path must persist, or "saved" state is a lie.

### 2.2 Verify persistence

**✅ Checklist**

- ✅ `add`ing two entries then reopening `CatalogIndex()` (in a *new* process) shows both without re-extracting.
- ✅ `remove` returns `True` for an existing entry, `False` for a never-added name, and saves either way.
- ✅ `catalog.json` is valid JSON that `json.load` reads back into the same structure.

**🤔 Socratic Question(s)**

- Adding and removing both call `_save`. Why is per-mutation saving the honest default for a small tool, and at what scale would it become wasteful enough to justify a "save on exit" instead — and what does *that* lose on a crash?
- The index maps `name → CatalogEntry`, so a second CSV whose filename collides overwrites the first silently. Should `add` refuse on collision, or is overwrite the right behavior — and who should decide?

## Step 3: Search with scoring

A catalog that can't be searched is a museum. The honest, dependency-free version of search: split the query into terms, count how many times each term appears in a per-dataset "haystack" of its name plus column names, and rank by that count. It's the same shape as a search engine's tf-counting at the very smallest scale.

### 3.1 Write the scorer

**👟 Starter hint:** Join each entry's identity into one lowercase string, sum term *occurrences* within it, and return only entries scoring above zero, best first:

```python
# search.py
from index import CatalogIndex

def search(index: CatalogIndex, query: str, top_k: int = 5) -> list[tuple[str, int]]:
    terms = [term.lower() for term in query.split()]
    scored = []
    for name, entry in index.entries.items():
        haystack = " ".join([name, *entry.columns]).lower()
        score = sum(haystack.count(term) for term in terms)
        scored.append((name, score))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return [(name, score) for name, score in scored if score > 0][:top_k]

if __name__ == "__main__":
    index = CatalogIndex()
    for query in ["price", "region", "id price"]:
        results = search(index, query)
        print(f"{query!r}: {results if results else 'no matches'}")
```

The single lowercase `haystack = " ".join([name, *entry.columns])` is the whole engine: search scores against *both* the dataset name and its schema, which is what lets `"region"` find `customers` without the word appearing in the filename at all — the column surface is indexable metadata. `haystack.count(term)` is deliberately liberal (counts overlapped matches) rather than token-aware, because for a catalog of a few hundred entries the extra precision isn't worth the tokenizer.

**🎯 Expected output:**

```
'price': [('products', 1)]
'region': [('customers', 1)]
'id price': [('products', 2)]
```

**🩹 If it's off:** If mult-word queries score oddly, remember the sum counts each term *separately* — `'id price'` finds 1 + 1 in `products`. If a query matches nothing that should match, check whether a term contains uppercase or punctuation (e.g. `"Price"` lowercasing both sides is handled — but `"price,"` with a comma is not).

### 3.2 Verify search

**✅ Checklist**

- ✅ All three queries above return the expected best-first tuples.
- ✅ A query like `"zzz"` returns `[]` rather than an error.
- ✅ Searching by a *column* name (`region`) finds the dataset whose schema has that column, even if the filename doesn't.

**🤔 Socratic Question(s)**

- Counting *occurrences* rewards columns that repeat a term. What definition of "relevant" does that miss — and what would a `count` that penalized longer haystacks (dividing by dataset size, a mini-tf-idf) change about the ranking?
- Search is limited to name + columns. What metadata *you've already computed* in Step 1 (dtypes, row_count) would you want searchable, and what query would it answer that this version can't?

## Step 4: Track data lineage

Knowing *what a dataset is* is half the job; knowing *where it came from and what it feeds* is the part that saves migrations. Lineage is a directed graph — `source → transform → derived` — and the operations it needs are the two graph walks: downstream ("what breaks if `products.csv` changes?") and upstream ("what does this dashboard's table depend on?").

### 4.1 Write the lineage store and both walks

**👟 Starter hint:** A list of `(source, transform, derived)` triples, plus two breadth-first-style searches that fan out from a node along outgoing or incoming edges, both guarding against cycles with a `seen` set:

```python
# lineage.py
import json
from pathlib import Path

class Lineage:
    def __init__(self, path: str = "lineage.json"):
        self.path = path
        self.edges: list[tuple[str, str, str]] = []  # (source, transform, derived)
        if Path(path).exists():
            raw = json.loads(Path(path).read_text())
            self.edges = [(e["source"], e["transform"], e["derived"]) for e in raw]

    def record(self, source: str, transform: str, derived: str) -> None:
        self.edges.append((source, transform, derived))
        Path(self.path).write_text(json.dumps(
            [{"source": s, "transform": t, "derived": d} for s, t, d in self.edges],
            indent=2))

    def downstream(self, node: str) -> set[str]:
        seen, frontier = set(), {node}
        while frontier:
            current = frontier.pop()
            for src, _transform, derived in self.edges:
                if src == current and derived not in seen:
                    seen.add(derived)
                    frontier.add(derived)
        return seen

    def upstream(self, node: str) -> set[str]:
        seen, frontier = set(), {node}
        while frontier:
            current = frontier.pop()
            for src, _transform, derived in self.edges:
                if derived == current and src not in seen:
                    seen.add(src)
                    frontier.add(src)
        return seen

if __name__ == "__main__":
    lineage = Lineage("lineage.json")
    lineage.edges = []  # reset for a clean demo
    lineage.record("products.csv", "clean", "products_clean")
    lineage.record("products_clean", "aggregate", "revenue_by_category")
    lineage.record("customers.csv", "join", "rich_customers")
    lineage.record("products_clean", "join", "rich_customers")
    print("downstream of products.csv:", sorted(lineage.downstream("products.csv")))
    print("upstream of revenue_by_category:", sorted(lineage.upstream("revenue_by_category")))
```

The `while frontier:` loop is a genuine graph traversal (BFS-style) hiding in plain Python: each polled node adds its unseen neighbors to both `seen` (so they're reported) and `frontier` (so they're explored), which is exactly how "what depends on `products.csv`" discovers the *transitive* answer — `revenue_by_category` is downstream even though nothing points directly at it. The `seen` set doubling as cycle-guard means a mis-declared loop in lineage data terminates instead of hanging your report.

**🎯 Expected output:**

```
downstream of products.csv: ['products_clean', 'revenue_by_category']
upstream of revenue_by_category: ['products.csv', 'products_clean']
```

**🩹 If it's off:** If downstream returns *only* `products_clean`, the frontier loop isn't revisiting newly-added nodes — confirm `frontier.add(derived)` exists inside the loop, not just `seen.add`. If the demo re-adds edges on every run, the `lineage.edges = []` reset line is doing real work — a persistent store that never resets grows unboundedly.

### 4.2 Verify lineage

**✅ Checklist**

- ✅ Both walks return exactly the sorted sets above (transitive both directions).
- ✅ A node with no edges (e.g. `"ghost.db"`) returns an empty set, not an error.
- ✅ `lineage.json` reloads into the same edge list in a new process.

**🤔 Socratic Question(s)**

- The walk is *breadth-first via a set*. What would change if you wanted the *shortest dependency path* from `products.csv` to `revenue_by_category` — the set intentionally discards which information, and what structure would preserve it?
- Both walks live in one class over the same edges. Where does `upstream` use `derived == current` while `downstream` uses `src == current` — and how would you explain "reverse the comparison, reuse all the plumbing" to a junior teammate?

## Step 5: The catalog CLI

The library is done; the *tool* needs to be a command someone can type. `argparse` subcommands turn the whole project into three verbs — `add`, `search`, `lineage` — each reusing exactly one function from the steps above.

### 5.1 Wire up the subcommands

**👟 Starter hint:** Create the parser with `add_subparsers(required=True)`, register one subparser per verb, and dispatch in a `main()` that instantiates `CatalogIndex`/`Lineage` per command:

```python
# catalog.py
import argparse

from index import CatalogIndex
from lineage import Lineage
from metadata import extract_metadata
from search import search

def main() -> None:
    parser = argparse.ArgumentParser(description="Catalog datasets; answer search and lineage queries.")
    sub = parser.add_subparsers(dest="command", required=True)

    add_cmd = sub.add_parser("add", help="Add a CSV dataset to the catalog")
    add_cmd.add_argument("csv_path")

    search_cmd = sub.add_parser("search", help="Search datasets by name or column")
    search_cmd.add_argument("query")

    lineage_cmd = sub.add_parser("lineage", help="Show what depends on, or feeds, a dataset")
    lineage_cmd.add_argument("dataset")
    lineage_cmd.add_argument("--direction", choices=["downstream", "upstream"], default="downstream")

    args = parser.parse_args()
    index = CatalogIndex()

    if args.command == "add":
        entry = extract_metadata(args.csv_path)
        index.add(entry)
        print(f"added {entry.name}: {len(entry.columns)} cols, {entry.row_count} rows")
    elif args.command == "search":
        for name, score in search(index, args.query):
            print(f"{name}  (score {score})")
        if not index.entries:
            print("catalog is empty -- run 'add' first")
    elif args.command == "lineage":
        lineage = Lineage()
        result = lineage.downstream(args.dataset) if args.direction == "downstream" \
            else lineage.upstream(args.dataset)
        print(f"{args.direction} of {args.dataset}:", sorted(result) or "nothing")

if __name__ == "__main__":
    main()
```

```bash
uv run python catalog.py add products.csv
uv run python catalog.py search price
uv run python catalog.py lineage products.csv --direction downstream
```

The pattern to internalize: each subcommand *composes* the earlier library functions rather than re-implementing them — `add` is `extract_metadata` + `index.add`, `search` is one function call, `lineage` is one class call. The `required=True` on `add_subparsers` is the difference between `catalog.py` with no verb printing a helpful usage list versus silently doing nothing.

**🎯 Expected output:** `added products: 5 cols, 2 rows`, then `products  (score 1)`, then `downstream of products.csv: ['products_clean', 'revenue_by_category']`.

**🩹 If it's off:** If running `add` twice on the same file prints the same line twice, that's *correct* — `add` overwrites the same catalog key. If `--direction upstream` returns nothing, the edges under `lineage.json` were recorded with `derived`/`source` roles you expect the other way — the walk follows the recorded direction, so re-check the `record` calls.

### 5.2 Verify the CLI

**✅ Checklist**

- ✅ `add` on both sample CSVs, then `search price`, reproduces the Step-3 result from the terminal.
- ✅ `catalog.py --help` and `catalog.py search --help` list the expected verbs and flags.
- ✅ `lineage --direction upstream` on `rich_customers` reports both `customers.csv` and `products_clean`.

**🤔 Socratic Question(s)**

- `search` on an empty catalog prints a hint, while `lineage` on an empty file quietly reports "nothing". Why is the empty case genuinely *different* for the two commands — what's the asymmetry between "no data to search" and "no lineage recorded"?
- Each command builds its own `CatalogIndex()`/`Lineage()`. When would sharing one instance matter — and for a CLI where every run is one command, why is per-command state the *right* default here?

## ⚠️ Common pitfalls

- **Labeling columns numeric because *some* values are numbers.** One `"42"` doesn't make a column numeric; every non-empty value must parse. An `id` column of `["001", "002"]` is likely a *text* identifier in disguise — infer carefully or let the catalog say "text" honestly.
- **Calling `_save` anywhere but on mutation.** A search that "forgets" to persist or a load that never writes both create a catalog whose disk state disagrees with its memory state. Save on every mutation, load on every start.
- **Searching case-sensitively.** `Price` vs `price` is one forgotten `.lower()` away from "empty results". Lowercase the haystack and the query together.
- **Graph walks without a `seen` set.** Every BFS/DFS over a graph with any cycle — real lineage occasionally loops — hangs forever without dedup. The `seen`/`frontier` split is not optional.
- **Recording lineage but never replaying it.** A `record` API with no `downstream`/`upstream` consumers produces a JSON file nobody reads. Build the walk in the same step as the store, as done here.

## What you just built

A real data catalog: CSV files scanned into structured, typed metadata entries; a persistent JSON index that survives restarts; a scoring search over names *and* schemas; and a lineage graph traversed both directions so you can answer "what breaks if I change this?" with evidence — all standard library, all exposed as three CLI verbs. The transferable skill is the catalog architecture itself: descriptors (metadata) kept separate from data, persisted indexes with a query layer, and *explicit provenance edges* that turn "I think this is connected" into a graph walk anyone can audit.

:::tip[Run a fuller version without any local setup]
[`examples/data-catalog/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-catalog) in the course repo has these complete scripts plus sample CSVs and a pre-seeded index. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a `refresh` subcommand that re-scans every `source` path stored in the index and updates row counts/dtypes — drift detection over your catalog with one walk over `entry.source`.
- Upgrade `_infer_type` with a `date` verdict (parse with `datetime.fromisoformat`) so catalogs distinguish real dates from text — a three-line change to the decision tree.
- Invert the search scorer toward **tf-idf** (divide term counts by how many datasets contain the term) so generic column names like `id` stop dominating results.
- Render lineage as a **Mermaid `graph TD`** block (one line per edge) so `catalog.py lineage --format mermaid` produces a diagram any GitHub issue can embed.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓