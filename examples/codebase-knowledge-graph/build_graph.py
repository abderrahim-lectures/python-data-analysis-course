"""Turn a Python codebase into a knowledge graph: parse every .py file's AST,
build a networkx graph of files/functions/classes and their import/call
relationships, then visualize it (pyvis, interactive HTML) and/or query it.

See docs/projects/codebase-knowledge-graph/index.md for the full walkthrough
this file accompanies. Runs entirely locally, on static analysis alone --
no API key, no network access, no execution of the target code.

Usage:
    uv run python build_graph.py sample_repo
    uv run python build_graph.py sample_repo --html graph.html
    uv run python build_graph.py sample_repo --png graph.png
    uv run python build_graph.py sample_repo --calls multiply
    uv run python build_graph.py sample_repo --imports utils
    uv run python build_graph.py /path/to/any/other/repo
"""

from __future__ import annotations

import argparse
import ast
from dataclasses import dataclass, field
from pathlib import Path

import networkx as nx


@dataclass
class ParsedFile:
    """Everything extracted from one Python file's AST."""

    path: Path
    imports: list[str] = field(default_factory=list)  # module names imported by this file
    functions: list[str] = field(default_factory=list)  # top-level function names
    classes: dict[str, list[str]] = field(default_factory=dict)  # class name -> method names
    calls: dict[str, list[str]] = field(default_factory=dict)  # qualified def name -> called names


def parse_file(path: Path) -> ParsedFile | None:
    """Parses one Python file's AST and extracts its structure.

    Returns None (and prints a warning) instead of raising if the file has a
    syntax error `ast.parse` can't handle -- see the "Common pitfalls"
    section of the lesson for why that matters on a real repo.
    """
    try:
        source = path.read_text(encoding="utf-8", errors="ignore")
        tree = ast.parse(source, filename=str(path))
    except SyntaxError as exc:
        print(f"⚠️  Skipping {path}: syntax error ({exc.msg} at line {exc.lineno})")
        return None

    parsed = ParsedFile(path=path)

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                parsed.imports.append(alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                parsed.imports.append(node.module.split(".")[0])

    # Only walk top-level statements for defs, so a nested helper function
    # doesn't get mistaken for a module-level one -- ast.walk() would flatten
    # that distinction away.
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            parsed.functions.append(node.name)
            parsed.calls[node.name] = _called_names(node)
        elif isinstance(node, ast.ClassDef):
            methods = []
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    methods.append(item.name)
                    qualified = f"{node.name}.{item.name}"
                    parsed.calls[qualified] = _called_names(item)
            parsed.classes[node.name] = methods

    return parsed


def _called_names(func_node: ast.FunctionDef) -> list[str]:
    """Best-effort list of names called inside a function/method body.

    Static analysis can't always tell what a call target really is (see the
    lesson's pitfalls section on dynamic dispatch) -- this grabs the simple
    name a call *looks* like it targets: `add(...)` -> "add",
    `utils.multiply(...)` -> "multiply", `self.total()` -> "total". Good
    enough to link calls to same-named definitions elsewhere in the repo,
    not a guarantee of correctness the way a real type-checker would give you.
    """
    names = []
    for node in ast.walk(func_node):
        if isinstance(node, ast.Call):
            target = node.func
            if isinstance(target, ast.Name):
                names.append(target.id)
            elif isinstance(target, ast.Attribute):
                names.append(target.attr)
    return names


def build_graph(repo_path: Path) -> nx.DiGraph:
    """Walks every .py file under `repo_path` and builds a directed graph.

    Node kinds: "file", "class", "function"/"method".
    Edge kinds: "defines" (file/class contains a function/method),
    "imports" (file imports a module), "calls" (function/method calls another
    known function/method, resolved by simple name).
    """
    graph = nx.DiGraph()
    parsed_files: dict[Path, ParsedFile] = {}

    py_files = sorted(p for p in repo_path.rglob("*.py") if ".venv" not in p.parts)
    for path in py_files:
        parsed = parse_file(path)
        if parsed is None:
            continue
        parsed_files[path] = parsed

        rel = str(path.relative_to(repo_path))
        graph.add_node(rel, kind="file")

        for module in parsed.imports:
            graph.add_node(module, kind="module")
            graph.add_edge(rel, module, kind="imports")

        for func_name in parsed.functions:
            qualified = f"{rel}::{func_name}"
            graph.add_node(qualified, kind="function", short_name=func_name, file=rel)
            graph.add_edge(rel, qualified, kind="defines")

        for class_name, methods in parsed.classes.items():
            class_qualified = f"{rel}::{class_name}"
            graph.add_node(class_qualified, kind="class", short_name=class_name, file=rel)
            graph.add_edge(rel, class_qualified, kind="defines")
            for method_name in methods:
                method_qualified = f"{rel}::{class_name}.{method_name}"
                graph.add_node(
                    method_qualified, kind="method", short_name=method_name, file=rel
                )
                graph.add_edge(class_qualified, method_qualified, kind="defines")

    # Second pass: now that every function/method/class in the repo is a known
    # node, resolve each recorded call target to any node with a matching
    # short name and add a "calls" edge. A repo-wide index by short name
    # keeps this an O(1) lookup per call instead of rescanning the graph.
    by_short_name: dict[str, list[str]] = {}
    for node, data in graph.nodes(data=True):
        if data.get("kind") in {"function", "method"}:
            by_short_name.setdefault(data["short_name"], []).append(node)

    for path, parsed in parsed_files.items():
        rel = str(path.relative_to(repo_path))
        for def_name, called_names in parsed.calls.items():
            caller = f"{rel}::{def_name}"
            if caller not in graph:
                continue
            for called_name in called_names:
                for target in by_short_name.get(called_name, []):
                    if target != caller:
                        graph.add_edge(caller, target, kind="calls")

    return graph


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------


def what_does_it_call(graph: nx.DiGraph, short_name: str) -> list[str]:
    """Every node whose short name matches `short_name`, and everything it calls."""
    results = []
    for node, data in graph.nodes(data=True):
        if data.get("short_name") == short_name or node == short_name:
            callees = [t for _, t, d in graph.out_edges(node, data=True) if d.get("kind") == "calls"]
            results.append((node, callees))
    return results


def who_imports(graph: nx.DiGraph, module_name: str) -> list[str]:
    """Every file node with an "imports" edge pointing at `module_name`."""
    if module_name not in graph:
        return []
    return [src for src, _, d in graph.in_edges(module_name, data=True) if d.get("kind") == "imports"]


# ---------------------------------------------------------------------------
# Visualization
# ---------------------------------------------------------------------------

_COLORS = {
    "file": "#3b82f6",  # blue
    "module": "#9ca3af",  # gray -- imported, but not a file we parsed ourselves
    "class": "#f59e0b",  # amber
    "function": "#10b981",  # green
    "method": "#10b981",
}

_EDGE_COLORS = {
    "defines": "#d1d5db",
    "imports": "#9ca3af",
    "calls": "#ef4444",
}


def visualize_pyvis(graph: nx.DiGraph, output_path: Path) -> None:
    """Renders the graph as a self-contained, interactive HTML file with pyvis."""
    from pyvis.network import Network

    net = Network(height="800px", width="100%", directed=True, notebook=False)
    net.barnes_hut()  # a physics layout that spaces nodes out instead of overlapping

    for node, data in graph.nodes(data=True):
        kind = data.get("kind", "module")
        label = data.get("short_name", node)
        net.add_node(node, label=label, title=f"{kind}: {node}", color=_COLORS.get(kind, "#9ca3af"))

    for source, target, data in graph.edges(data=True):
        kind = data.get("kind", "")
        net.add_edge(source, target, title=kind, color=_EDGE_COLORS.get(kind, "#d1d5db"))

    net.write_html(str(output_path))
    print(f"Wrote interactive graph to {output_path} -- open it in a browser.")


def visualize_matplotlib(graph: nx.DiGraph, output_path: Path) -> None:
    """Renders a static PNG with matplotlib -- a decent fallback for a small repo."""
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(12, 9))
    layout = nx.spring_layout(graph, seed=42, k=0.6)

    node_colors = [_COLORS.get(graph.nodes[n].get("kind", "module"), "#9ca3af") for n in graph.nodes]
    labels = {n: graph.nodes[n].get("short_name", n) for n in graph.nodes}

    nx.draw_networkx_nodes(graph, layout, node_color=node_colors, node_size=500, ax=ax)
    nx.draw_networkx_labels(graph, layout, labels=labels, font_size=7, ax=ax)
    for kind, color in _EDGE_COLORS.items():
        edges = [(u, v) for u, v, d in graph.edges(data=True) if d.get("kind") == kind]
        nx.draw_networkx_edges(graph, layout, edgelist=edges, edge_color=color, ax=ax, arrows=True)

    ax.set_title("Codebase knowledge graph")
    ax.axis("off")
    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
    print(f"Wrote static graph image to {output_path}.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("repo_path", type=Path, help="Path to the repo/folder to analyze")
    parser.add_argument("--html", type=Path, default=None, help="Write an interactive pyvis HTML file here")
    parser.add_argument("--png", type=Path, default=None, help="Write a static matplotlib PNG here")
    parser.add_argument("--calls", type=str, default=None, help="Query: what does this function/method call?")
    parser.add_argument("--imports", type=str, default=None, help="Query: what files import this module?")
    args = parser.parse_args()

    graph = build_graph(args.repo_path)
    print(f"Parsed {args.repo_path}: {graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges.")

    if args.calls:
        for node, callees in what_does_it_call(graph, args.calls):
            if callees:
                print(f"{node} calls: {', '.join(callees)}")
            else:
                print(f"{node} calls nothing this tool could resolve.")

    if args.imports:
        importers = who_imports(graph, args.imports)
        if importers:
            print(f"'{args.imports}' is imported by: {', '.join(importers)}")
        else:
            print(f"No parsed file imports '{args.imports}'.")

    if args.html:
        visualize_pyvis(graph, args.html)
    if args.png:
        visualize_matplotlib(graph, args.png)

    if not (args.html or args.png or args.calls or args.imports):
        # No flags given -- default to writing the interactive HTML, since
        # that's the most useful "just show me something" output.
        visualize_pyvis(graph, Path("graph.html"))


if __name__ == "__main__":
    main()
