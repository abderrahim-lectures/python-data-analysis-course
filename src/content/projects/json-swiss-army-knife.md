---
title: "Build a JSON Swiss Army Knife"
description: "A CLI tool that formats, validates, queries, and transforms JSON files with JQ-like power."
difficulty: "beginner"
tags: ["cli", "data-pipeline", "developer-tools"]
---

# 🔧 Build a JSON Swiss Army Knife

Any developer who works with JSON has a dozen small operations: format this file, validate that one, extract this field, convert to YAML. This project builds a single Click CLI that handles all of them. It's the kind of tool that saves minutes every day and pays for itself in a week.

This assumes Python 101 and comfort with CLI workflows from [Developer Tools](/projects). Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install CLI + format conversion dependencies.
2. Implement JSON formatting with configurable indentation.
3. Add validation with error location reporting.
4. Build a JQ-style dot-notation query engine.
5. Implement format conversion between JSON, YAML, and TOML.

## Where to run this

**Locally with `uv`** is the primary path — this is a CLI tool that reads and writes files.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/json-swiss-army-knife/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/json-swiss-army-knife/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fjson-swiss-army-knife%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment, Click, and format libraries.

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
uv init json-swiss-army-knife
cd json-swiss-army-knife
uv add click pyyaml tomli rich
```

`click` handles CLI routing. `pyyaml` and `tomli` handle format conversion. `rich` provides colored output.

### Create the project structure

```bash
touch json_knife/__init__.py json_knife/formatter.py json_knife/validator.py json_knife/query.py json_knife/converter.py json_knife/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `json-swiss-army-knife/` exists with a `pyproject.toml`, and all dependencies installed.
- ✅ The `json_knife/` directory has all required module files.

## Step 1: Format JSON with configurable indentation

Formatting makes minified JSON human-readable. This is the simplest feature but the most frequently used.

### 1.1 Implement the formatter

**👟 Starter hint:** Create `json_knife/formatter.py` with a function that pretty-prints JSON.

```python
# json_knife/formatter.py
import json

def format_json(data: str, indent: int = 2) -> str:
    parsed = json.loads(data)
    return json.dumps(parsed, indent=indent, ensure_ascii=False, sort_keys=False)
```

This loads the JSON string, then dumps it back with the specified indentation. `ensure_ascii=False` preserves Unicode characters.

**🎯 Expected output:** `format_json('{"b":1,"a":2}', indent=2)` returns:
```json
{
  "b": 1,
  "a": 2
}
```

**🩹 If it's off:** If you get `json.JSONDecodeError`, the input isn't valid JSON.

### 1.2 Verify the formatter

**✅ Checklist**

- ✅ `format_json('{"a":1}')` returns pretty-printed output.
- ✅ Custom indent is respected.

**🤔 Socratic Question(s)**

- What's the difference between `sort_keys=True` and leaving it false? When might you want sorted keys?

## Step 2: Validate JSON with error locations

Validation catches syntax errors before they propagate. The key value is reporting *where* the error occurred.

### 2.1 Implement the validator

**👟 Starter hint:** Create `json_knife/validator.py`.

```python
# json_knife/validator.py
import json

def validate_json(data: str) -> tuple[bool, str]:
    try:
        json.loads(data)
        return True, "Valid JSON"
    except json.JSONDecodeError as e:
        return False, f"Line {e.lineno}, Column {e.colno}: {e.msg}"
```

`json.JSONDecodeError` includes `lineno` and `colno` attributes that pinpoint the error.

**🎯 Expected output:** `validate_json('{"a": 1,}')` returns `(False, "Line 1, Column 10: ...")`.

**🩹 If it's off:** If you don't get line/column info, you're not catching `JSONDecodeError`.

### 2.2 Verify the validator

**✅ Checklist**

- ✅ Valid JSON returns `(True, "Valid JSON")`.
- ✅ Invalid JSON returns `(False, ...)` with line and column.

**🤔 Socratic Question(s)**

- How would you extend this to validate against a JSON Schema? What library would you use?

## Step 3: Build a dot-notation query engine

This is the Swiss Army Knife's killer feature: `$.users[*].name` to extract nested values.

### 3.1 Implement the query parser

**👟 Starter hint:** Create `json_knife/query.py`.

```python
# json_knife/query.py
import json, re

def query_json(data: str, path: str) -> list:
    parsed = json.loads(data)
    tokens = re.findall(r'[\w\[\]*$]+', path)
    tokens = [t for t in tokens if t not in ("$", "")]
    results = _traverse(parsed, tokens)
    return results if isinstance(results, list) else [results]

def _traverse(obj, tokens):
    if not tokens:
        return obj
    key, *rest = tokens
    if key == "*":
        if isinstance(obj, list):
            return [_traverse(item, rest) for item in obj]
        elif isinstance(obj, dict):
            return [_traverse(v, rest) for v in obj.values()]
        return []
    elif key.endswith("]"):
        idx = int(key.rstrip("]"))
        return _traverse(obj[idx], rest) if isinstance(obj, list) and idx < len(obj) else []
    elif isinstance(obj, dict) and key in obj:
        return _traverse(obj[key], rest)
    return []
```

The regex extracts path tokens like `"users"`, `"[*]"`, `"name"`. `_traverse` recursively walks the structure. `[*]` expands to all list elements.

**🎯 Expected output:** `query_json('[{"name":"Alice"},{"name":"Bob"}]', '$[*].name')` returns `["Alice", "Bob"]`.

**🩹 If it's off:** If you get empty results, check the regex is splitting tokens correctly.

### 3.2 Verify the query engine

**✅ Checklist**

- ✅ `$.users[*].name` extracts names from a list of user objects.
- ✅ Nested paths like `$.config.database.host` work.
- ✅ Wildcard `[*]` expands list elements.

**🤔 Socratic Question(s)**

- How would you add support for filters like `$.users[?(@.age > 30)]`?
- What happens if the path contains dots in key names?

## Step 4: Implement format conversion

Converting between JSON, YAML, and TOML saves manual tool-hopping.

### 4.1 Create the converter

**👟 Starter hint:** Create `json_knife/converter.py`.

```python
# json_knife/converter.py
import json, yaml, tomli

def convert_to_json(data: str, from_format: str) -> dict:
    if from_format == "yaml":
        return yaml.safe_load(data)
    elif from_format == "toml":
        return tomli.loads(data)
    elif from_format == "json":
        return json.loads(data)
    raise ValueError(f"Unknown format: {from_format}")

def convert_from_json(data: dict, to_format: str) -> str:
    if to_format == "yaml":
        return yaml.dump(data, default_flow_style=False, allow_unicode=True)
    elif to_format == "toml":
        import tomli_w
        return tomli_w.dumps(data)
    elif to_format == "json":
        return json.dumps(data, indent=2, ensure_ascii=False)
    raise ValueError(f"Unknown format: {to_format}")
```

**🎯 Expected output:** Converting JSON to YAML and back produces equivalent data.

**🩹 If it's off:** If TOML conversion fails, make sure you installed `tomli-w` for writing.

### 4.2 Verify the converter

**✅ Checklist**

- ✅ JSON → YAML preserves data types.
- ✅ YAML → JSON roundtrips correctly.
- ✅ TOML ↔ JSON works for simple structures.

**🤔 Socratic Question(s)**

- What data types can TOML represent that JSON can't (and vice versa)?

## ⚠️ Common pitfalls

- **Path injection in queries.** Always parse paths with a regex or tokenizer, never pass raw strings to `eval()` or dynamic attribute access.
- **YAML's default type coercion.** YAML silently converts `yes` to `True` and `1.0` to a float. Use `yaml.safe_load()` and never `yaml.load()` with untrusted input.
- **TOML only supports dicts.** Top-level arrays aren't valid TOML. Converting a JSON array to TOML requires wrapping it in a dict.
- **Streaming for large files.** All four features load the entire file into memory. For 100MB+ JSON files, use `ijson` for streaming queries.
- **Click arguments vs options.** Use arguments for the input file (positional, required) and options for flags like `--indent` and `--output-format`. This matches user expectations.

## What you just built

A single CLI tool that handles the four most common JSON operations: formatting, validation, querying, and format conversion. The dot-notation query engine recursively walks nested structures and expands wildcards. Format conversion bridges JSON, YAML, and TOML for data pipeline workflows. This tool solves real developer pain — every team has someone who keeps running `python -m json.tool` and wishing it did more.

:::tip[Run a fuller version without any local setup]
[`examples/json-swiss-army-knife/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/json-swiss-army-knife) in the course repo has a richer version with streaming queries, JSON diff, schema validation, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add streaming JSON parsing with `ijson` so you can query multi-GB files without loading them into memory.
- Implement JSON diff between two files, showing added, removed, and changed keys.
- Add a `--jq` flag that accepts real JQ expressions, not just dot-notation.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
