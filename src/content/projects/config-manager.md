---
title: "Build a Configuration Manager"
description: "Manage application configs across environments with validation, layered merging, and secret redaction."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "config", "toml", "stdlib"]
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries)"
learningObjectives:
  - "Merge config from defaults, files, and environment variables into one dict"
  - "Read TOML config files with the standard library's tomllib"
  - "Validate required keys and types against a schema"
  - "Automatically redact secret values in any human-readable dump"
  - "Wrap loading, validation, and inspection in one CLI"
---

# ⚙️ Build a Configuration Manager

Every real application has configuration that should never be hardcoded: which port to bind, which log level to use, which API keys to trust. The standard way to organize it is *layered* — sensible defaults, overridden by a config file per environment, overridden by environment variables — so that "run it locally" and "run it in production" differ without anyone editing code. This project builds exactly that loader: a small library that merges defaults, JSON, and TOML with environment-variable overrides, validates the result against a schema, and — crucially — never prints a secret.

This assumes Python 101 (dictionaries, functions, and `json` at the `import` level) — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Write a recursive merge that combines three config layers in the right order.
2. Load a TOML config file with Python's built-in `tomllib` module.
3. Validate the merged config against a required-keys-and-types schema.
4. Detect secret-looking keys and redact them from any output.
5. Run it all as a CLI that prints a safe, validated config summary.

## Where to run this

**Locally with `uv`** is the recommended path — the "real" version of this project reads actual files from disk and real environment variables, which is exactly what a notebook does not have, so the local CLI is the honest home for it. Setup is short because the whole project uses Python's standard library (plus `tomllib`, bundled since Python 3.11).

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** are a good way to *learn the concepts* — the notebook version at [`examples/config-manager/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.ipynb) runs every function with bundled sample files. The honest limitation: a notebook can't see the environment variables of your own machine, so the env-var layer is demonstrated with a simulated override instead.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fconfig-manager%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the "install Python, then pip, then a virtual environment tool" chain — and this project has no third-party packages at all, so once you have a Python you're genuinely ready.

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
uv init config-manager
cd config-manager
uv python pin 3.12
```

`uv python pin 3.12` (or any 3.11+) matters here: the TOML reader `tomllib` only exists from Python 3.11 onward, so pinning guarantees the feature you'll use in Step 2 is present.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `config-manager/` exists with a `pyproject.toml`.
- ✅ `python -c "import tomllib"` succeeds on the version `uv` pinned.

## Step 1: Merge layered configuration

Config systems are almost always a *pipeline of overrides*: start with `DEFAULTS`, overlay a per-environment file, then let environment variables win. The merge is the heart of it — and the subtlety is that config is *nested*, so `{"app": {"port": 9000}}` must update `{"app": {"name": "demo", "port": 8000}}` without wiping out `name`.

### 1.1 Write a deep merge and the first two layers

**👟 Starter hint:** Write `deep_merge` — recursing only when *both* sides are dicts, otherwise replacing, which is what preserves untouched keys — then combine it with a JSON file and coerced environment variables:

```python
# layers.py
import json
import os

DEFAULTS = {"app": {"name": "demo", "port": 8000}, "logging": {"level": "INFO"}}

def deep_merge(base: dict, override: dict) -> dict:
    """Merge override into a copy of base. Nested dicts merge recursively;
    anything on the right replaces the left for that key."""
    out = dict(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = value
    return out

def load_layer(path: str = "config.json") -> dict:
    with open(path) as f:
        return json.load(f)

def _coerce(raw: str):
    if raw.lower() in {"true", "false"}:
        return raw.lower() == "true"
    try:
        return int(raw)
    except ValueError:
        return raw

def apply_env(config: dict, prefix: str = "APP_") -> dict:
    """Overlay environment variables named APP_<KEY>, e.g. APP_PORT=9000.
    Double underscores mark nesting: APP_LOGGING__LEVEL=DEBUG."""
    for key, raw in os.environ.items():
        if not key.startswith(prefix):
            continue
        parts = key[len(prefix):].lower().split("__")
        target = config
        for part in parts[:-1]:
            target = target.setdefault(part, {})
        target[parts[-1]] = _coerce(raw)
    return config

if __name__ == "__main__":
    sample = json.dumps({"app": {"name": "api"}, "logging": {"level": "DEBUG"}})
    with open("config.json", "w") as f:
        f.write(sample)
    config = deep_merge(dict(DEFAULTS), load_layer("config.json"))
    config = apply_env(config)
    print(config)
```

The line `dict(base)` at the top of `deep_merge` is what makes this function *pure*: callers keep their defaults intact and get a new dict back, so "run once with a bad file, reload, overwrite again" is always safe. The env-var layer demonstrates the dark horse of config design — *everything is a string in the environment* — hence `_coerce` turning `"9000"` into `9000` and `"true"` into `True` before they land in the dict.

**🎯 Expected output:**

```
{'app': {'name': 'api', 'port': 8000}, 'logging': {'level': 'DEBUG'}}
```

**🩹 If it's off:** If `app` is missing `port`, your `deep_merge` flattened instead of recursing — check the `isinstance(value, dict)` branch. If the output *replaces* `logging` entirely, you swapped the merge order; `deep_merge(base, override)` keeps everything in `base` that `override` doesn't touch.

### 1.2 Try the environment override

```bash
APP_PORT=9000 APP_LOGGING__LEVEL=WARN uv run python layers.py
```

**👟 Starter hint:** Rerun with two env vars set on the command line and watch the port and log level change, with `app.name` undisturbed.

**🎯 Expected output:** `{'app': {'name': 'api', 'port': 9000}, 'logging': {'level': 'WARN'}}` — the two env vars override exactly their keys, nothing else.

**🩹 If it's off:** If nothing changes, the `APP_` prefix filter isn't matching — confirm the vars are set *in the same command* (`APP_PORT=9000 uv run ...`, not a separate `export` in another window). If `APP_LOGGING__LEVEL` lands as a *new* top-level key instead of nesting under `logging`, the `__` → dot-path loop isn't splitting.

### 1.3 Verify the layering

**✅ Checklist**

- ✅ Without env vars the merged output is `{'app': {'name': 'api', 'port': 8000}, 'logging': {'level': 'DEBUG'}}`.
- ✅ With `APP_PORT=9000`, the port changes and `app.name` stays `'api'`.
- ✅ `apply_env` coerces `"9000"` to the integer `9000`, not the string.

**🤔 Socratic Question(s)**

- Why is replacing-on-merge (instead of always recursing) the *correct* behavior for a key like `port`? What real data would silently break if you recursed into a list or a non-dict?
- Env vars are all strings. What class of bug does `_coerce` prevent, and what *new* risk does silently coercing introduce when a value like `"0012"` (meant to be a string ID) gets turned into `12`?

## Step 2: Read TOML config files

JSON suffers one practical problem as a config format: no comments, which makes config files read like data dumps rather than instructions. TOML — used by `pyproject.toml`, Cargo, and many modern tools — adds comments, friendly types, and the same nested structure. Python 3.11+ reads it with `tomllib`, the same way `json` reads JSON.

### 2.1 Write the TOML layer

**👟 Starter hint:** Write a `config.toml` with comments and nesting, then a `load_toml_layer` that reads it in binary mode (`tomllib` requires bytes) and merges it on top of the defaults:

```python
# toml_layer.py
from pathlib import Path
import tomllib

from layers import DEFAULTS, apply_env, deep_merge

def load_toml_layer(path: str = "config.toml") -> dict:
    with Path(path).open("rb") as f:
        return tomllib.load(f)

if __name__ == "__main__":
    toml_text = '''
# Production-like overrides
[app]
name = "prod-api"
port = 8080

[logging]
level = "PROD"
'''
    Path("config.toml").write_text(toml_text)
    config = deep_merge(dict(DEFAULTS), load_toml_layer())
    config = apply_env(config)
    print(config)
```

The pattern `deep_merge(dict(DEFAULTS), layer)` is deliberately identical to Step 1's JSON merge — once the merge function exists, every new source is the same two lines. Two small things are easy to miss: `tomllib.load` demands *binary* mode (`Path.open("rb")`), a quirk shared with no other popular format, and TOML's `[logging]` headers produce the same nested dicts your `deep_merge` already handles.

**🎯 Expected output:**

```
{'app': {'name': 'prod-api', 'port': 8080}, 'logging': {'level': 'PROD'}}
```

**🩹 If it's off:** A `TypeError: File must be opened in binary mode` means you opened with `"r"` instead of `"rb"`. A `TOMLDecodeError` usually points at the exact line — trailing commas *are* allowed in TOML, but a second `[app]` section or a stray `=` is a hard error at parse time.

### 2.2 Verify the TOML layer

**✅ Checklist**

- ✅ `load_toml_layer()` returns `{'app': {'name': 'prod-api', 'port': 8080}, 'logging': {'level': 'PROD'}}`.
- ✅ Settings from `config.toml` override `DEFAULTS`, and fields TOML doesn't mention (`app.port` untouched by the file would stay `8000`) survive intact.
- ✅ You can state why the file must open in binary mode.

**🤔 Socratic Question(s)**

- TOML lets you write `port = 8080` (an integer, no quotes). How would the *type* of `port` change if the file said `port = "8080"`, and where would that difference surface — silently breaking what later? (Hint: recall step 1's validation-free path.)
- The merge treats the TOML layer and the JSON layer as interchangeable. What would you have to change if you wanted *"TOML always beats JSON, no matter the load order"* — and is baking that in a good idea or a maintainability trap?

## Step 3: Validate the merged config

Once three sources feed into one dict, the merge can silently produce a config with a *missing key* or a *wrong-typed value* — and those fail later, far from the config, in confusing ways. Validation moves the failure to the front: check the merged config against a schema and raise a human-readable error list before anything runs.

### 3.1 Write flattening and the checker

**👟 Starter hint:** `flatten` turns nested dicts into dot-paths (`app.port`) so a flat schema can name exactly where it's wrong; `validate` compares against a `REQUIRED` dict of path → type and returns a list of human-readable problems:

```python
# validate.py
REQUIRED = {
    "app.name": str,
    "app.port": int,
    "logging.level": str,
}

def flatten(config: dict, prefix: str = "") -> dict[str, object]:
    out = {}
    for key, value in config.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            out.update(flatten(value, path))
        else:
            out[path] = value
    return out

def validate(config: dict) -> list[str]:
    errors = []
    flat = flatten(config)
    for path, wanted in REQUIRED.items():
        if path not in flat:
            errors.append(f"missing required key: {path}")
        elif not isinstance(flat[path], wanted):
            errors.append(
                f"{path} should be {wanted.__name__}, got {type(flat[path]).__name__}"
            )
    return errors

if __name__ == "__main__":
    broken = {"app": {"name": "api", "port": "8000"}}
    for error in validate(broken):
        print(error)
```

`flatten` is the quiet workhorse: it converts "where is the problem?" from a maze of nested lookups into one flat list, and it reuses the same walk in `secrets.py` (Step 4) — one traversal, two consumers. `isinstance(flat[path], wanted)` catches the *type* traps config is famous for, like a string port that will blow up in a socket binding: `ValueError` later instead of a clear sentence now.

**🎯 Expected output:**

```
app.port should be int, got str
```

**🩹 If it's off:** If nothing is reported for the broken dict, your `REQUIRED` schema spells the path differently than `flatten` produces — check for a `logging.level` vs `logging__level` mismatch (the env-var style) leaking into the schema. If you get `should be type, got str`, check whether `got {type(...).__name__}` in the f-string is printing the inherited name from a subclassed value.

### 3.2 Verify the validator

**✅ Checklist**

- ✅ `validate({"app": {"name": "x", "port": "8000"}, "logging": {"level": 5}})` reports both the wrong-typed `app.port` and the wrong-typed `logging.level`, one line each.
- ✅ A config missing `app.name` entirely reports `missing required key: app.name`.
- ✅ A fully-correct config returns an empty list.

**🤔 Socratic Question(s)**

- `flatten` is shared by validation and (next step) secret-redaction. What's the single responsibility argument for one traversal — and what would have to be duplicated if you'd inlined the walk twice?
- The schema checks *types*, not *ranges*. What failure would a `port` of `-1` or `65536` still sail through — and is a range check worth adding to the schema or is that the wrong layer for it?

## Step 4: Redact secrets before printing

A config *containing* a secret is normal; a config *printing* one is an incident. The rule of thumb in real tools is: treat any key that looks sensitive (`password`, `token`, `api_key`, …) as unprintable by default, and only reveal it when explicitly asked. This step makes that automatic.

### 4.1 Write the detector and redactor

**👟 Starter hint:** Use a compiled case-insensitive regex over key *names* (not values — matching values would be a guessing game), then `flatten` + rebuild as masked dot-paths:

```python
# secrets.py
import re

from validate import flatten

SENSITIVE = re.compile(r"(password|passwd|token|secret|api[_-]?key|apikey)", re.I)

def is_sensitive(path: str) -> bool:
    return bool(SENSITIVE.search(path))

def redact(config: dict) -> dict[str, object]:
    return {path: "***" if is_sensitive(path) else value
            for path, value in flatten(config).items()}

if __name__ == "__main__":
    sample = {
        "app": {"name": "api", "port": 8000, "api_key": "sk-live-abc123"},
        "database": {"password": "hunter2", "host": "db.internal"},
    }
    for path, value in redact(sample).items():
        print(f"{path} = {value}")
```

The regex is deliberately anchored the hard-but-safe way: it matches *substrings* of a path (`database.password` contains `password`), which catches `db_password`, `github_token`, and `api_key` without requiring a taxonomy of every possible name. And because masking happens on the *key*, not the value, it never needs to guess what a secret looks like — a value of `"sk-…"` or `"hunter2"` is redacted identically based purely on where it lives.

**🎯 Expected output:**

```
app.name = api
app.port = 8000
app.api_key = ***
database.host = db.internal
database.password = ***
```

**🩹 If it's off:** If `api_key` prints unhidden, your regex used `$`-anchoring or a word-boundary that the `api[_-]?key` alternative doesn't satisfy — `api_key` has an underscore, so the pattern must allow it (`[_-]?`). If `host` gets redacted, the pattern is too loose — a bare `key` alternative matches the tail of `monkey`; tighten it to `api[_-]?key` style forms only.

### 4.2 Verify redaction

**✅ Checklist**

- ✅ `database.password` and `app.api_key` print as `***`.
- ✅ `app.name`, `app.port`, and `database.host` print their real values.
- ✅ A value shaped like a secret stored under a *non-secret* key (e.g. `app.notes = "contains sk-abc"`) is not redacted — redaction is key-based.

**🤔 Socratic Question(s)**

- Why is matching key *names* fundamentally more reliable than matching key *values*? What's a real value you'd want to keep visible that happens to contain the substring `token`?
- Redaction returns `***` rather than deleting the key. What would break about Step 5's CLI (or any schema validator) if redaction *removed* secret paths entirely instead of masking them?

## Step 5: The final CLI

Every function so far is a library; this step turns them into a tool: `config.py --check` validates, `config.py --show` prints a flattened, redacted view. The CLI is where the "never print a secret" promise becomes behavior a human actually touches.

### 5.1 Build `load_config` and the argument handling

**👟 Starter hint:** Compose the pipeline in one function — defaults → JSON → TOML → env vars — then wire `--check` and `--show` through `argparse`:

```python
# config.py
import argparse

from layers import DEFAULTS, apply_env, deep_merge, load_layer
from secrets import redact
from toml_layer import load_toml_layer
from validate import validate

def load_config(json_path: str = "config.json", toml_path: str = "config.toml") -> dict:
    config = deep_merge(dict(DEFAULTS), load_layer(json_path))
    config = deep_merge(config, load_toml_layer(toml_path))
    return apply_env(config)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load, validate, and inspect layered config.")
    parser.add_argument("--check", action="store_true", help="Validate against the schema")
    parser.add_argument("--show", action="store_true", help="Print the merged config with secrets masked")
    args = parser.parse_args()

    if args.check:
        errors = validate(load_config())
        print("\n".join(errors) if errors else "config OK")
    if args.show:
        for path, value in redact(load_config()).items():
            print(f"{path} = {value}")
```

```bash
uv run python config.py --show
```

Each flag re-runs `load_config()` independently — cheap here, and it means `--show` never prints stale state from a `--check` run. The composition order is the entire behavior of the system in one function call chain: `DEFAULTS < JSON < TOML < env`, so the highest-precedence source is always the last merge.

**🎯 Expected output:** `app.name = prod-api`, `app.port = 8080`, `logging.level = PROD` (plus any key you add whose name matches a sensitive pattern printed as `***`).

**🩹 If it's off:** A `FileNotFoundError` for `config.json` or `config.toml` means you're running from the wrong folder — the files are in the folder where Steps 1–2 wrote them, so run the CLI from there, or pass the path. If `--show` and `--check` together print the validated config *and* the redaction together, remember the `action="store_true"` flags are independent — combine them with `&&`, or add an implicit `--show` when `--check` passes.

### 5.2 Verify the CLI

**✅ Checklist**

- ✅ `uv run python config.py --show` prints only redacted-and-merged values, with any sensitive key masked.
- ✅ `uv run python config.py --check` prints `config OK` for a valid config — or one `path should be…` line per broken field.
- ✅ `uv run python config.py --help` lists both flags and the tool's description.

**🤔 Socratic Question(s)**

- `--show` re-runs `load_config()` rather than sharing one config object with `--check`. When would that choice bite — what could differ between the two runs in a *real* deployment (hint: think about environment variables changing mid-process)?
- The CLI prints secrets only **as** `***`. If you added a `--reveal` flag to show real values, what guard would you want around it so no one accidentally dumps production credentials into CI logs?

## ⚠️ Common pitfalls

- **Merging shallowly and losing sibling keys.** `dict(base) | override` (or `base.update(override)`) replaces whole nested dicts, wiping `app.name` the moment `app.port` overrides. Always merge recursively — the `isinstance(value, dict)` branch in Step 1 is not optional.
- **Forgetting `tomllib` wants binary mode.** `tomllib.load(open("config.toml"))` fails with a `TypeError`; the file handle must open as `"rb"`. It's the one stdlib format loader with this quirk.
- **Hardcoding secrets in code "just for now".** An `API_KEY` inside `DEFAULTS` is exactly the value Step 4 would mask — which is the tool telling you it shouldn't be in code. Move it to an env var before the masking hides it from your own debugging anyway.
- **Validating after first use.** If you `socket.bind((host, port))` before checking `isinstance(port, int)`, a string port fails three files deep into your program. Validation belongs at the config *boundary*, not after the first hundred lines ran.
- **Detecting secrets by value shape.** Matching values (regexing for `sk-…`) looks clever and misleads: real values constantly surprise you, and key names are already the one stable thing. Match names.

## What you just built

A genuine layered config system — defaults, JSON, TOML, and environment variables merged in the correct precedence order, validated against a schema, and rendered with secrets safely masked — all pure standard-library Python plus `tomllib`. The transferable skill is the architecture itself: a *pipeline of overrides ending at the environment*, the shape behind config systems from Django settings to deployment tooling, and a defensible rule worth stealing wholesale: secrets get printed only when the tool's core job is to reveal them.

:::tip[Run a fuller version without any local setup]
[`examples/config-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/config-manager) in the course repo has these complete scripts plus sample `config.json`/`config.toml` files, runnable end to end. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add an `--env prod` flag that loads `config.prod.toml` instead of the default file — environment-specific overrides as a selection, not a hack — and watch the merge pipeline stay unchanged.
- Support an `include = ["shared.toml"]` key so one config file can import others — your `deep_merge` composes the includes for free.
- Emit the merged config as a **single flattened `key=value` file** for a 12-factor-style tool that consumes dots, not nesting — `flatten` from Step 3 is your starter.
- Write the redaction verdict as a `pytest` test asserting that `redact` never returns a value containing `sk-` — the same guarantee CI systems now run on real secret-scanning.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓