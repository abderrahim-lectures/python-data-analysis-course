---
title: "Build a Feature Store"
description: "Build a lightweight feature store that computes, versions, and serves ML features for both training batches and real-time inference."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["ml", "data-pipeline", "database"]
learningObjectives:
  - "Design a feature registry with versioned metadata"
  - "Compute features from raw data and persist them to a local store"
  - "Serve features by point-in-time key lookup for training and inference"
  - "Expose a simple CLI for registering, computing, and fetching features"
prerequisites: ["Python 101", "Data Analysis"]
---

# 🗄️ Build a Feature Store

Machine learning models break when the code that computes features during training drifts from the code that computes them in production. A feature store fixes this by computing features once, versioning them, and serving the same values whether you're fitting a model or scoring a request. This project builds a lightweight, file-backed feature store with a CLI: you register feature definitions, compute them from raw data, and fetch them by entity key with point-in-time correctness.

This assumes Python 101 and comfort with pandas from Data Analysis — nothing beyond. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a small project with `uv` and install the dependencies you'll need.
2. Define a feature registry that stores feature names, versions, and source descriptions as JSON.
3. Write a feature computation function that transforms raw data into a reusable DataFrame.
4. Persist computed features to a local Parquet store with versioned snapshots.
5. Fetch features by entity key with point-in-time correctness so training never sees future data.
6. Wire everything into a CLI that registers, computes, and fetches from the command line.

## Where to run this

**Locally with `uv`** is the primary path here — this project reads and writes files on disk (Parquet snapshots, a JSON registry), which works most naturally outside a notebook.

**Google Colab, Kaggle Notebooks, and Binder** work fine for trying the tool. The notebook installs the same dependencies and uses the same code; file-backed storage works in a notebook's ephemeral filesystem for the duration of the session.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/feature-store/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/feature-store/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffeature-store%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment, two packages, and a small project directory.

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
uv init feature-store
cd feature-store
uv add pandas pyarrow click
```

`pandas` handles the feature computation, `pyarrow` lets us write and read Parquet files efficiently, and `click` builds the CLI interface. `python-dotenv` is not needed here since no API keys are involved.

### Create the project structure

```bash
mkdir -p store
touch store/__init__.py store/registry.py store/compute.py store/io.py store/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `feature-store/` exists with a `pyproject.toml`, and `pandas`, `pyarrow`, and `click` are installed.
- ✅ The `store/` directory has `__init__.py`, `registry.py`, `compute.py`, `io.py`, and `cli.py`.

## Step 1: Define the feature registry

A feature registry is the catalog of everything your store knows how to compute. Each entry records the feature's name, its version, a human-readable description, and the entity key it's keyed on. Keeping this as a simple JSON file means you can inspect it by hand, diff it across versions, and load it fast.

### 1.1 Write the registry schema

**👟 Starter hint:** Create a `Feature` dataclass and a `Registry` class that loads and saves a JSON file.

```python
# store/registry.py
import json
from dataclasses import dataclass, asdict
from pathlib import Path

REGISTRY_PATH = Path("feature_registry.json")

@dataclass
class Feature:
    name: str
    version: int
    description: str
    entity_key: str  # the column used to look up this feature

class Registry:
    def __init__(self, path: Path = REGISTRY_PATH):
        self.path = path
        self.features: dict[str, Feature] = {}
        if path.exists():
            self._load()

    def _load(self):
        raw = json.loads(self.path.read_text())
        for entry in raw:
            feat = Feature(**entry)
            self.features[feat.name] = feat

    def register(self, name: str, version: int, description: str, entity_key: str):
        feat = Feature(name, version, description, entity_key)
        self.features[name] = feat
        self._save()

    def _save(self):
        data = [asdict(f) for f in self.features.values()]
        self.path.write_text(json.dumps(data, indent=2))
```

The registry is a dictionary keyed by feature name, backed by a flat JSON file. Each `Feature` carries a `version` integer so you can roll forward without destroying old definitions. The `entity_key` field records which column serves as the lookup key — this matters later when fetching features for a specific entity.

**🎯 Expected output:** `Registry().register("avg_order_value", 1, "Mean order value", "user_id")` creates a `feature_registry.json` file containing one entry with all four fields.

**🩹 If it's off:** If the JSON file doesn't appear, `self._save()` may not be called after `register()`. If loading a corrupted file raises a confusing error, add a `try/except json.JSONDecodeError` around `_load()` and print a clear message.

### 1.2 Verify the registry round-trips

```python
# Quick smoke test
from store.registry import Registry

reg = Registry()
reg.register("avg_order_value", 1, "Mean order value per user", "user_id")
reg2 = Registry()  # re-load from disk
assert reg2.features["avg_order_value"].version == 1
```

Re-loading the registry from disk should produce the same `Feature` you just registered — this confirms the JSON round-trip works end to end.

**🎯 Expected output:** The assertion passes silently; `feature_registry.json` contains the registered entry.

**🩹 If it's off:** If `reg2` is empty, the `_load()` path isn't running — check `self.path.exists()` returns `True` at load time.

### 1.3 Verify the registry

**✅ Checklist**

- ✅ `Registry().register(...)` creates a `feature_registry.json` file with the correct fields.
- ✅ Re-loading a `Registry()` from the same path gives back the same feature data.
- ✅ Two features with different names can coexist in the same registry file.

**🤔 Socratic Question(s)**

- Why use a version integer instead of just overwriting the feature definition in place? What breaks if you always mutate the latest version?
- The registry stores feature metadata but not the computed values. What advantage does separating metadata from data give you when you later add a second storage backend?

## Step 2: Compute features from raw data

Now that the registry knows *what* features exist, you need code that *computes* them from raw data. A feature computation function takes a raw DataFrame and returns a new DataFrame with the computed feature as a column, joined on the entity key.

### 2.1 Write the first computation function

**👟 Starter hint:** Write a function that groups raw transaction data by `user_id` and computes the average order value.

```python
# store/compute.py
import pandas as pd

def compute_avg_order_value(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute the average order value per user from a transactions DataFrame."""
    return (
        transactions
        .groupby("user_id")["amount"]
        .mean()
        .reset_index(name="avg_order_value")
    )
```

The computation is a single pandas `groupby` + `mean` — the same pattern you'd use in any data analysis. The function returns a DataFrame with exactly two columns: the entity key (`user_id`) and the feature value (`avg_order_value`). This two-column shape is the standard output format every computation function should follow.

**🎯 Expected output:** Given a DataFrame with columns `user_id` and `amount`, the function returns a DataFrame with columns `user_id` and `avg_order_value` where each row is one user's mean.

**🩹 If it's off:** If the output has extra columns, the `groupby` is selecting too many. If the index looks wrong, make sure `.reset_index(name="avg_order_value")` is chained on.

### 2.2 Add a second computation function

```python
# store/compute.py (continued)
def compute_purchase_count(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute the total number of purchases per user."""
    return (
        transactions
        .groupby("user_id")
        .size()
        .reset_index(name="purchase_count")
    )
```

Adding a second function confirms the pattern: each computation is a standalone function that takes raw data and returns a two-column DataFrame keyed on the entity.

**🎯 Expected output:** `compute_purchase_count(df)` returns a DataFrame with columns `user_id` and `purchase_count`.

**🩹 If it's off:** If `.size()` returns a Series instead of a DataFrame, you forgot `.reset_index(name="purchase_count")`.

### 2.3 Verify the computations

**✅ Checklist**

- ✅ `compute_avg_order_value(df)` returns a two-column DataFrame with `user_id` and `avg_order_value`.
- ✅ `compute_purchase_count(df)` returns a two-column DataFrame with `user_id` and `purchase_count`.
- ✅ Both functions work on the same input DataFrame without modifying it.

**🤔 Socratic Question(s)**

- Why enforce a two-column output (entity key + feature value) instead of returning a Series or a dict? How does that shape simplify the storage and retrieval steps?
- What happens if two different raw tables share the same entity key but have different entity types — say `user_id` in orders and `product_id` in inventory?

## Step 3: Persist features to Parquet with versioned snapshots

Computed features need to land on disk so they can be fetched later. Parquet is the right format here: it's columnar, fast to read, and pandas writes it with one function call. Each version of a feature gets its own file, so fetching "version 1" means reading a specific file.

### 3.1 Write the persistence layer

**👟 Starter hint:** Create `store/io.py` with functions to write a DataFrame to a versioned Parquet file and read it back.

```python
# store/io.py
import pandas as pd
from pathlib import Path

STORE_DIR = Path("feature_store_data")

def save_features(feature_name: str, version: int, df: pd.DataFrame):
    """Write a feature DataFrame to a versioned Parquet file."""
    STORE_DIR.mkdir(exist_ok=True)
    path = STORE_DIR / f"{feature_name}_v{version}.parquet"
    df.to_parquet(path, index=False)

def load_features(feature_name: str, version: int) -> pd.DataFrame:
    """Read a feature DataFrame from a versioned Parquet file."""
    path = STORE_DIR / f"{feature_name}_v{version}.parquet"
    return pd.read_parquet(path)
```

The file naming convention `{name}_v{version}.parquet` is simple and human-readable. `mkdir(exist_ok=True)` means the function works on first run without a separate setup step. Writing with `index=False` keeps the Parquet file clean — the entity key is a regular column, not an index, which makes downstream joins simpler.

**🎯 Expected output:** `save_features("avg_order_value", 1, df)` creates `feature_store_data/avg_order_value_v1.parquet`, and `load_features("avg_order_value", 1)` returns an identical DataFrame.

**🩹 If it's off:** If `load_features` raises `FileNotFoundError`, the file path doesn't match — check that `STORE_DIR` and the naming pattern are consistent between save and load. If the loaded DataFrame has an extra `__index_level_0__` column, you saved with `index=True` instead of `False`.

### 3.2 Verify the round-trip

```python
# Quick round-trip test
import pandas as pd
from store.io import save_features, load_features

df = pd.DataFrame({"user_id": [1, 2], "avg_order_value": [45.0, 82.5]})
save_features("avg_order_value", 1, df)
loaded = pd.read_parquet("feature_store_data/avg_order_value_v1.parquet")
assert loaded.equals(df)
```

The saved file should read back as an identical DataFrame. This round-trip test catches format mismatches, index issues, and path inconsistencies early.

**🎯 Expected output:** The assertion passes; the Parquet file exists on disk with the correct size.

**🩹 If it's off:** If the assertion fails, check for a pandas version mismatch or an unwanted index column.

### 3.3 Verify persistence

**✅ Checklist**

- ✅ `save_features` creates a `.parquet` file in `feature_store_data/`.
- ✅ `load_features` reads back an identical DataFrame from that file.
- ✅ Two different versions of the same feature exist as separate files on disk.

**🤔 Socratic Question(s)**

- Why use separate files per version instead of a single file with a `version` column? What tradeoff does that create for storage vs. read speed?
- Parquet compresses data by column. For a feature store with many features per entity, why might columnar storage be faster than row-based storage like CSV?

## Step 4: Fetch features by entity key with point-in-time correctness

The critical feature of a feature store is point-in-time correctness: when training a model on historical data, you must not leak future feature values into the past. This step builds a fetch function that reads a versioned feature file and filters to exactly the entity keys you request.

### 4.1 Write the fetch function

**👟 Starter hint:** Create `fetch_features` in `store/io.py` that loads a versioned feature and filters to requested entity keys.

```python
# store/io.py (continued)
def fetch_features(
    feature_name: str,
    version: int,
    entity_keys: list,
    key_column: str = "user_id",
) -> pd.DataFrame:
    """Fetch feature values for specific entity keys from a versioned snapshot."""
    df = load_features(feature_name, version)
    return df[df[key_column].isin(entity_keys)].reset_index(drop=True)
```

The `isin` filter is the simplest form of point-in-time correctness: you load a snapshot that was written at a specific time, and you fetch only the entities you care about. The `key_column` parameter lets this function work for any entity type, not just `user_id`.

**🎯 Expected output:** `fetch_features("avg_order_value", 1, [1, 3])` returns a DataFrame with only the rows where `user_id` is 1 or 3.

**🩹 If it's off:** If the result includes keys you didn't request, the filter column name is wrong. If the result is empty, the keys might not exist in the stored snapshot — check the version number.

### 4.2 Build the `FeatureStore` facade

```python
# store/io.py (continued)
class FeatureStore:
    """Convenience wrapper tying registry, computation, and storage together."""

    def __init__(self, registry: "Registry"):
        self.registry = registry

    def compute_and_store(self, name: str, raw_df: pd.DataFrame, compute_fn):
        """Register a feature, compute it, and persist the result."""
        feat = self.registry.features[name]
        df = compute_fn(raw_df)
        save_features(name, feat.version, df)
        return df

    def get(self, name: str, entity_keys: list, key_column: str = "user_id") -> pd.DataFrame:
        """Fetch feature values for specific entity keys."""
        feat = self.registry.features[name]
        return fetch_features(name, feat.version, entity_keys, key_column)
```

The facade ties the three layers together: `compute_and_store` calls the computation function and persists the result under the version from the registry. `get` reads back the stored feature for specific entities. This separation of compute, store, and fetch is the same architecture used in production feature stores — it's just smaller here.

**🎯 Expected output:** `store.get("avg_order_value", [1, 2])` returns a two-column DataFrame with values for those two users.

**🩹 If it's off:** If `get` raises a `KeyError`, the feature isn't in the registry — register it before fetching. If the returned DataFrame has all rows instead of just the requested keys, check that `fetch_features` is filtering, not returning the full DataFrame.

### 4.3 Verify point-in-time fetch

**✅ Checklist**

- ✅ `fetch_features` returns only the requested entity keys, not the full stored DataFrame.
- ✅ `FeatureStore.get` reads the correct version from the registry.
- ✅ Computing and fetching the same feature returns consistent values.

**🤔 Socratic Question(s)**

- In a real ML pipeline, you might train on data from January but serve predictions in March. How does the version-number scheme help you serve the January-trained model with the January feature values, even though March values now exist?
- What breaks if two features share the same entity key column but one feature's computation groups on a different column?

## Step 5: Wire it all into a CLI

A CLI lets you register features, compute them, and fetch results without writing Python scripts. This step uses `click` to build three subcommands.

### 5.1 Build the CLI

**👟 Starter hint:** Create `store/cli.py` with `register`, `compute`, and `fetch` subcommands.

```python
# store/cli.py
import click
import pandas as pd
from store.registry import Registry
from store.compute import compute_avg_order_value, compute_purchase_count
from store.io import FeatureStore

COMPUTE_MAP = {
    "avg_order_value": compute_avg_order_value,
    "purchase_count": compute_purchase_count,
}

@click.group()
def cli():
    """Feature Store CLI — register, compute, and fetch ML features."""
    pass

@cli.command()
@click.option("--name", required=True, help="Feature name")
@click.option("--version", default=1, help="Feature version")
@click.option("--description", default="", help="Human-readable description")
@click.option("--entity-key", default="user_id", help="Column to key on")
def register(name, version, description, entity_key):
    reg = Registry()
    reg.register(name, version, description, entity_key)
    click.echo(f"Registered '{name}' v{version}")

@cli.command()
@click.option("--name", required=True, help="Feature name to compute")
@click.option("--input", "input_file", required=True, help="Path to CSV input")
def compute(name, input_file):
    reg = Registry()
    store = FeatureStore(reg)
    fn = COMPUTE_MAP.get(name)
    if fn is None:
        click.echo(f"Unknown feature: {name}. Available: {list(COMPUTE_MAP)}")
        return
    df = pd.read_csv(input_file)
    result = store.compute_and_store(name, df, fn)
    click.echo(f"Computed {len(result)} rows for '{name}'")

@cli.command()
@click.option("--name", required=True, help="Feature name to fetch")
@click.option("--keys", required=True, help="Comma-separated entity keys")
@click.option("--key-column", default="user_id", help="Column to filter on")
def fetch(name, keys, key_column):
    reg = Registry()
    store = FeatureStore(reg)
    key_list = [int(k.strip()) for k in keys.split(",")]
    result = store.get(name, key_list, key_column)
    click.echo(result.to_string(index=False))

if __name__ == "__main__":
    cli()
```

The `COMPUTE_MAP` dictionary is the dispatch table: it maps feature names to their computation functions. Adding a new feature means writing a computation function and adding one line to this map. The CLI is thin — it parses arguments, delegates to the library code, and prints results — which makes it easy to test each subcommand independently.

**🎯 Expected output:** `uv run python -m store.cli register --name avg_order_value --version 1 --description "Mean order value" --entity-key user_id` prints "Registered 'avg_order_value' v1" and creates the registry file.

**🩹 If it's off:** If `click` can't find the command, you may need `if __name__ == "__main__": cli()` at the bottom. If the compute command fails with a missing feature, register it first.

### 5.2 End-to-end smoke test

```python
# Quick end-to-end test
import pandas as pd
from store.registry import Registry
from store.compute import compute_avg_order_value, compute_purchase_count
from store.io import FeatureStore

raw = pd.DataFrame({
    "user_id": [1, 1, 2, 2, 3],
    "amount": [10, 20, 30, 40, 50],
})
reg = Registry()
reg.register("avg_order_value", 1, "Mean order value per user", "user_id")
reg.register("purchase_count", 1, "Total purchases per user", "user_id")

store = FeatureStore(reg)
store.compute_and_store("avg_order_value", raw, compute_avg_order_value)
store.compute_and_store("purchase_count", raw, compute_purchase_count)

avg = store.get("avg_order_value", [1, 3])
cnt = store.get("purchase_count", [2])
print(avg)
print(cnt)
```

This runs the full pipeline: register, compute, store, fetch. Each piece was tested individually in earlier steps; this confirms they work together.

**🎯 Expected output:** The average order value table shows `user_id 1` at `15.0` and `user_id 3` at `50.0`. The purchase count for `user_id 2` is `2`.

**🩹 If it's off:** If the values are wrong, the computation function may not be grouping on the right column. If the fetch returns all rows, `fetch_features` isn't filtering by key.

### 5.3 Verify the CLI pipeline

**✅ Checklist**

- ✅ `register` creates a registry entry; `compute` reads a CSV and persists Parquet files; `fetch` prints filtered feature values.
- ✅ Running all three subcommands in sequence produces consistent results.
- ✅ The CLI prints helpful error messages for unknown features or missing files.

**🤔 Socratic Question(s)**

- The CLI dispatches feature computation via a hardcoded `COMPUTE_MAP`. In a real feature store with dozens of features, how would you avoid editing this map every time you add one?
- If you wanted to add a `--version` flag to the `fetch` command, what would change about how the registry is consulted?

## ⚠️ Common pitfalls

- **Computing features on the full dataset including future rows.** When training on historical data, your raw DataFrame must be filtered to the training period *before* passing it to the computation function. Point-in-time correctness lives in the input data, not in the feature store's fetch logic.
- **Overwriting feature files without versioning.** If `save_features` writes to the same path every time, you lose the ability to serve old versions. Always include the version number in the filename and bump it when the computation logic changes.
- **Index leakage in Parquet round-trips.** Pandas writes the DataFrame index to Parquet by default. Use `index=False` on save and `reset_index(drop=True)` on fetch to keep the entity key as a plain column, not a hidden index.
- **Hardcoding the entity key column name.** Different features may be keyed on different columns (`user_id`, `product_id`, `session_id`). The `key_column` parameter exists for this reason — don't assume every feature uses `user_id`.
- **Forgetting to register before computing.** `FeatureStore.compute_and_store` reads the version from the registry. If the feature isn't registered, you get a `KeyError` — always register first.

## What you just built

A lightweight but real feature store: a registry that catalogs feature definitions with versioning, computation functions that transform raw data into reusable features, Parquet-backed persistence for versioned snapshots, and a CLI that ties register-compute-fetch into one pipeline. The architecture — separating metadata, computation, storage, and serving — mirrors how production feature stores like Feast and Tecton work, just with files instead of a distributed database.

:::tip[Run a fuller version without any local setup]
[`examples/feature-store/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/feature-store) in the course repo has a richer version with more feature computation functions, a CSV sample dataset, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a freshness check that timestamps each feature snapshot and alerts when the data is older than a configurable threshold.
- Build a `compare` subcommand that diffs two versions of the same feature to detect training-serving skew.
- Integrate with a real model training script: fetch features for a set of entity keys, pass them to a scikit-learn model, and evaluate whether version drift changes accuracy.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
