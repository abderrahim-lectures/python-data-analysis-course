"""Builds an exact symbol index of a Python repo using only `ast`.

Run with: uv run python symbols.py /path/to/repo
This prints a summary -- build_index.py (Step 2) imports load_symbols()
from this file.
"""

import ast
import json
import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "__pycache__", "venv", ".venv", "dist", "build"}


def walk_py_files(repo_root: Path) -> list[Path]:
    files = []
    for path in sorted(repo_root.rglob("*.py")):
        if any(part in SKIP_DIRS for part in path.relative_to(repo_root).parts):
            continue
        files.append(path)
    return files


def extract_symbols(path: Path) -> list[dict]:
    """Returns one record per top-level def/class/import in a file, each
    with its line number."""
    source = path.read_text(encoding="utf-8", errors="replace")
    try:
        tree = ast.parse(source, filename=str(path))
    except SyntaxError as exc:
        print(f"Skipping {path}: syntax error ({exc.msg} at line {exc.lineno})")
        return []

    symbols = []
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            symbols.append({"kind": "function", "name": node.name, "line": node.lineno, "file": str(path)})
        elif isinstance(node, ast.ClassDef):
            symbols.append({"kind": "class", "name": node.name, "line": node.lineno, "file": str(path)})
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    symbols.append(
                        {"kind": "method", "name": f"{node.name}.{item.name}", "line": item.lineno, "file": str(path)}
                    )
        elif isinstance(node, ast.Import):
            for alias in node.names:
                symbols.append({"kind": "import", "name": alias.name.split(".")[0], "line": node.lineno, "file": str(path)})
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                symbols.append({"kind": "import", "name": node.module.split(".")[0], "line": node.lineno, "file": str(path)})
    return symbols


def load_symbols(repo_root: Path) -> list[dict]:
    symbols = []
    for path in walk_py_files(repo_root):
        symbols.extend(extract_symbols(path))
    return symbols


if __name__ == "__main__":
    symbols = load_symbols(Path(sys.argv[1]))
    print(f"Indexed {len(symbols)} symbols")
    for s in symbols[:5]:
        print(f"  {s['kind']:9s} {s['name']} @ {s['file']}:{s['line']}")
