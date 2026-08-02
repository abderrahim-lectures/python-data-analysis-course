"""Turn a folder of PDFs, configs, and SQL schemas into a queryable knowledge graph.

Walks a folder of mixed document types -- PDFs (via pypdf), config files
(TOML/INI/YAML with the standard library), and SQL schema files -- and builds
a directed networkx graph out of the *references* hidden inside them:
a schema defines a table, a table references another table, a config value
names a table, a PDF mentions a table or a config key. Then you can query it
("which configs reference table 'users'?", "what does this PDF mention?") in
ways a plain keyword search over files can't -- the graph knows *indirect*
relationships.

Honest framing: the extraction below is hand-written rules, so the graph is
only as good as its rules. See the lesson for what that buys you and where it
breaks. Runs entirely locally -- no API key, no LLM, no network access.

Usage:
    uv run python build_graph.py data/sample
    uv run python build_graph.py data/sample --html graph.html
    uv run python build_graph.py data/sample --configs-for-table users
    uv run python build_graph.py data/sample --mentions auth
    uv run python build_graph.py data/sample --neighbors "table:books"
    uv run python build_graph.py data/sample --query "which configs reference table users"
"""

from __future__ import annotations

import argparse
import configparser
import re
import tomllib
from pathlib import Path

import networkx as nx

# ---------------------------------------------------------------------------
# Extraction: SQL schemas
# ---------------------------------------------------------------------------


def _table_node(graph: nx.DiGraph, name: str) -> str:
    """Returns the node id for a table, creating the node if it's new.

    A table can be referenced (by a config, a PDF, or another table's FK)
    before it's ever *defined*, so references must be allowed to create nodes.
    """
    node = f"table:{name}"
    if node not in graph:
        graph.add_node(node, kind="table", short_name=name)
    return node


def extract_sql(path: Path, graph: nx.DiGraph, rel: str) -> None:
    """Finds CREATE TABLE definitions and REFERENCES foreign keys in a .sql file.

    Table nodes get a "defines" edge from the file that declares them; a
    REFERENCES clause produces a "references" edge from the table being
    declared to the table it points at.
    """
    text = path.read_text(encoding="utf-8", errors="ignore")
    current_table: str | None = None
    for line in text.splitlines():
        create = re.match(r"(?i)^\s*create\s+table\s+([a-z0-9_]+)", line)
        if create:
            current_table = create.group(1).lower()
            graph.add_edge(rel, _table_node(graph, current_table), kind="defines")
        ref = re.search(r"(?i)references\s+([a-z0-9_]+)", line)
        if ref and current_table:
            graph.add_edge(
                _table_node(graph, current_table),
                _table_node(graph, ref.group(1).lower()),
                kind="references",
            )


# ---------------------------------------------------------------------------
# Extraction: config files
# ---------------------------------------------------------------------------


def _flatten_toml(data: dict, prefix: str = "") -> dict[str, object]:
    """Flattens nested TOML into dotted key paths, e.g. {"database": {"port": 8080}}
    becomes {"database.port": 8080}. Values keep their native types.
    """
    flat: dict[str, object] = {}
    for key, value in data.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            flat.update(_flatten_toml(value, path))
        else:
            flat[path] = value
    return flat


def extract_config(path: Path, graph: nx.DiGraph, rel: str) -> list[tuple[str, str]]:
    """Parses one config file into (config_key_node, value_as_text) pairs.

    TOML uses tomllib; INI uses configparser; YAML gets a simple, honest
    line-based key extractor (see the lesson's pitfalls for its limits).
    Each key becomes a node with a "defines" edge from its file; the returned
    pairs are resolved into "references" edges in a later pass, once every
    table in the folder is known.
    """
    suffix = path.suffix.lower()
    text = path.read_text(encoding="utf-8", errors="ignore")
    keys: dict[str, object] = {}

    if suffix in {".toml"}:
        keys = _flatten_toml(tomllib.loads(text))
    elif suffix in {".ini", ".cfg"}:
        parser = configparser.ConfigParser()
        parser.read_string(text)
        for section in parser.sections():
            for key, value in parser.items(section):
                keys[f"{section}.{key}"] = value
    elif suffix in {".yaml", ".yml"}:
        # Top-level `key: value` lines only -- nested YAML would need a real
        # YAML parser (PyYAML), which this deliberately-lean project skips.
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith(("#", ";", "-", " ")):
                continue
            match = re.match(r"^([A-Za-z0-9_.-]+)\s*:\s*(.*)$", stripped)
            if match:
                keys[match.group(1)] = match.group(2)
    else:
        print(f"⚠️  Skipping {path}: unsupported config extension '{suffix}'")
        return []

    parsed: list[tuple[str, str]] = []
    for key, value in keys.items():
        node = f"key:{rel}:{key}"
        graph.add_node(node, kind="config_key", short_name=key, file=rel)
        graph.add_edge(rel, node, kind="defines")
        parsed.append((node, f"{key} {value}"))
    return parsed


# ---------------------------------------------------------------------------
# Extraction: PDFs
# ---------------------------------------------------------------------------


def extract_pdf(path: Path, graph: nx.DiGraph, rel: str) -> str:
    """Extracts all text from a PDF with pypdf and returns it (also stored on the node).

    If pypdf can't read the file -- a scanned PDF, say -- we warn and keep
    going, exactly like skipping a file with a syntax error in the codebase
    version of this project.
    """
    try:
        from pypdf import PdfReader
    except ImportError:
        print("⚠️  pypdf not installed -- run `uv add pypdf` (see README).")
        return ""

    try:
        reader = PdfReader(str(path))
    except Exception as exc:  # noqa: BLE001 -- any PDF parse failure just skips the file
        print(f"⚠️  Skipping {path}: could not read PDF ({exc})")
        return ""

    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    graph.add_node(rel, kind="pdf", short_name=path.name, text=text)
    return text


# ---------------------------------------------------------------------------
# Graph building
# ---------------------------------------------------------------------------


def _mentions(haystack: str, name: str) -> bool:
    """Word-boundary substring match -- `users` matches "users table" but not
    "user_id" or "idx_sessions_user"."""
    return re.search(rf"\b{re.escape(name)}\b", haystack.lower()) is not None


def build_graph(folder: Path) -> nx.DiGraph:
    """Walks `folder` and builds a directed graph from every document's references.

    Node kinds: "file" (config/sql containers), "table", "config_key", "pdf".
    Edge kinds: "defines" (file declares a table/key), "references"
    (table FK or config value naming a table), "mentions" (PDF naming a table
    or config key).

    Cross-file edges ("references", "mentions") need a *second pass*: a config
    value can name a table defined in another file, and a PDF can mention a
    config key from yet another file, so nothing is resolvable until every
    file has been scanned -- the same two-pass shape as the codebase version
    of this project resolves call edges only after every file is known.
    """
    graph = nx.DiGraph()
    config_keys: list[tuple[str, str]] = []
    pdf_files: list[str] = []

    for path in sorted(folder.rglob("*")):
        if not path.is_file():
            continue
        if any(part.startswith(".") or part == "__pycache__" for part in path.parts):
            continue
        rel = str(path.relative_to(folder))

        if path.suffix.lower() in {".sql"}:
            graph.add_node(rel, kind="file", doc_type="sql", short_name=path.name)
            extract_sql(path, graph, rel)
        elif path.suffix.lower() in {".toml", ".ini", ".cfg", ".yaml", ".yml"}:
            graph.add_node(rel, kind="file", doc_type="config", short_name=path.name)
            config_keys.extend(extract_config(path, graph, rel))
        elif path.suffix.lower() == ".pdf":
            if extract_pdf(path, graph, rel):
                pdf_files.append(rel)
        else:
            print(f"Skipping unsupported file: {path}")

    # Second pass: resolve references now that every table is a known node.
    tables = {
        node.removeprefix("table:"): node
        for node in graph.nodes
        if node.startswith("table:")
    }

    # Config keys are referable two ways: by their full dotted path
    # ("auth.jwt_secret") or by their leaf name ("jwt_secret"). Multiple keys
    # can share a leaf name across files, so this maps each name to a list of
    # candidate nodes -- the same "match by name, resolve by list" approach
    # the codebase version uses for call edges.
    keys_by_name: dict[str, list[str]] = {}
    for node, data in graph.nodes(data=True):
        if data.get("kind") == "config_key":
            short = data["short_name"]
            keys_by_name.setdefault(short, []).append(node)
            keys_by_name.setdefault(short.rsplit(".", 1)[-1], []).append(node)

    for key_node, value_text in config_keys:
        for table_name, table_node in tables.items():
            if _mentions(value_text, table_name):
                graph.add_edge(key_node, table_node, kind="references")

    for rel in pdf_files:
        text = graph.nodes[rel].get("text", "")
        for table_name, table_node in tables.items():
            if _mentions(text, table_name):
                graph.add_edge(rel, table_node, kind="mentions")
        for key_short, key_nodes in keys_by_name.items():
            if _mentions(text, key_short):
                for key_node in key_nodes:
                    if key_node not in graph:
                        continue
                    graph.add_edge(rel, key_node, kind="mentions")

    return graph


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------


def configs_for_table(graph: nx.DiGraph, table_name: str) -> list[tuple[str, str]]:
    """Which config keys reference this table? Returns (config_key_node, file)."""
    table_node = f"table:{table_name}"
    if table_node not in graph:
        return []
    results = []
    for src, _, data in graph.in_edges(table_node, data=True):
        if data.get("kind") == "references" and graph.nodes[src].get("kind") == "config_key":
            results.append((src, graph.nodes[src].get("file", "?")))
    return sorted(results)


def entities_mentioning(graph: nx.DiGraph, keyword: str) -> list[str]:
    """Every entity whose id, label, or extracted text contains `keyword`.

    This is a keyword search over the graph's *content*, not over raw files:
    a PDF's extracted text lives on its node, so a match here is an entity in
    the graph -- which you can then expand with neighbors().
    """
    needle = keyword.lower()
    hits = []
    for node, data in graph.nodes(data=True):
        haystack = f"{node} {data.get('short_name', '')} {data.get('text', '')}".lower()
        if needle in haystack:
            hits.append(node)
    return sorted(hits)


def neighbors(graph: nx.DiGraph, node: str) -> tuple[list[str], list[str]]:
    """(outgoing, incoming) neighbor labels for a node, with edge kinds."""
    if node not in graph:
        return [], []
    out = sorted(f"{data.get('kind', '?')} -> {target}" for _, target, data in graph.out_edges(node, data=True))
    inc = sorted(f"{source} -> {data.get('kind', '?')}" for source, _, data in graph.in_edges(node, data=True))
    return out, inc


def run_query(graph: nx.DiGraph, query: str) -> str:
    """A small, honest query router for --query. For precise answers use the
    dedicated flags (--configs-for-table / --mentions / --neighbors); this
    handles the two canonical questions plus a fallback keyword search."""
    q = query.lower()

    canonical = re.search(r"configs?\s+reference\s+table\s+'?([a-z0-9_]+)'?", q)
    if canonical:
        table = canonical.group(1)
        hits = configs_for_table(graph, table)
        if not hits:
            return f"No config key references table '{table}'."
        lines = [f"'{table}' is referenced by:"]
        for key_node, file in hits:
            lines.append(f"  {key_node}  (in {file})")
        return "\n".join(lines)

    mention = re.search(r"mention(s|ing)?\s+'?([a-z0-9_]+)'?", q)
    if mention:
        keyword = mention.group(2)
        hits = entities_mentioning(graph, keyword)
        if not hits:
            return f"No entity mentions '{keyword}'."
        return f"Entities mentioning '{keyword}':\n" + "\n".join(f"  {node}" for node in hits)

    words = [w for w in re.findall(r"[a-z0-9_]+", q) if len(w) >= 3]
    hits = entities_mentioning(graph, " ".join(words))
    if not hits:
        return f"No entity matched query: {query!r}"
    lines = [f"Entities matching {query!r}:"]
    for node in hits[:20]:
        out, inc = neighbors(graph, node)
        lines.append(f"  {node}")
        for item in out[:6]:
            lines.append(f"      references/mentions -> {item}")
        for item in inc[:6]:
            lines.append(f"      <- {item}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Visualization
# ---------------------------------------------------------------------------

_COLORS = {
    "file": "#3b82f6",  # blue -- schema/config container files
    "pdf": "#f59e0b",  # amber -- documents
    "table": "#10b981",  # green -- SQL tables
    "config_key": "#8b5cf6",  # purple -- configuration keys
}

_EDGE_COLORS = {
    "defines": "#d1d5db",
    "references": "#ef4444",
    "mentions": "#f59e0b",
}


def visualize_pyvis(graph: nx.DiGraph, output_path: Path) -> None:
    """Renders the graph as a self-contained, interactive HTML file with pyvis."""
    from pyvis.network import Network

    net = Network(height="800px", width="100%", directed=True, notebook=False)
    net.barnes_hut()

    for node, data in graph.nodes(data=True):
        kind = data.get("kind", "file")
        label = data.get("short_name", node)
        net.add_node(node, label=label, title=f"{kind}: {node}", color=_COLORS.get(kind, "#9ca3af"))

    for source, target, data in graph.edges(data=True):
        kind = data.get("kind", "")
        net.add_edge(source, target, title=kind, color=_EDGE_COLORS.get(kind, "#d1d5db"))

    net.write_html(str(output_path))
    print(f"Wrote interactive graph to {output_path} -- open it in a browser.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def summarize(graph: nx.DiGraph, folder: Path) -> None:
    """Prints a human-readable adjacency summary of the whole folder's graph."""
    kinds: dict[str, list[str]] = {}
    for node, data in graph.nodes(data=True):
        kinds.setdefault(data.get("kind", "file"), []).append(node)

    for kind in ["file", "pdf", "table", "config_key"]:
        count = len(kinds.get(kind, []))
        if count:
            print(f"  {kind}: {count}")
    print(f"Graph: {graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges.\n")

    for node in sorted(graph.nodes):
        if graph.nodes[node].get("kind") not in {"file", "pdf"}:
            continue
        out = [(target, data.get("kind")) for _, target, data in graph.out_edges(node, data=True)]
        if out:
            edges = ", ".join(f"{kind} {target}" for target, kind in out)
            print(f"  {node}: {edges}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("folder", type=Path, help="Path to the mixed-document folder to analyze")
    parser.add_argument("--html", type=Path, default=None, help="Write an interactive pyvis HTML file here")
    parser.add_argument("--query", type=str, default=None, help="Natural-ish query, e.g. \"which configs reference table users\"")
    parser.add_argument("--configs-for-table", type=str, default=None, help="Query: which config keys reference this table?")
    parser.add_argument("--mentions", type=str, default=None, help="Query: list all entities mentioning this keyword")
    parser.add_argument("--neighbors", type=str, default=None, help="Query: show in/out edges of this node id")
    args = parser.parse_args()

    graph = build_graph(args.folder)
    print(f"Parsed {args.folder} ({graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges):")
    summarize(graph, args.folder)

    if args.configs_for_table:
        hits = configs_for_table(graph, args.configs_for_table)
        if hits:
            print(f"'{args.configs_for_table}' is referenced by:")
            for key_node, file in hits:
                print(f"  {key_node}  (in {file})")
        else:
            print(f"No config key references table '{args.configs_for_table}'.")

    if args.mentions:
        hits = entities_mentioning(graph, args.mentions)
        if hits:
            print(f"Entities mentioning '{args.mentions}':")
            for node in hits:
                print(f"  {node}")
        else:
            print(f"No entity mentions '{args.mentions}'.")

    if args.neighbors:
        out, inc = neighbors(graph, args.neighbors)
        print(f"Neighbors of {args.neighbors}:")
        for item in out:
            print(f"  {item}")
        for item in inc:
            print(f"  {item}")
        if not out and not inc:
            print(f"  (no such node: {args.neighbors})")

    if args.query:
        print()
        print(f"Q: {args.query}")
        print(run_query(graph, args.query))

    if not (args.configs_for_table or args.mentions or args.neighbors or args.query):
        # No query flags given -- answer the two canonical built-in questions,
        # exactly like the codebase version prints its built-in queries.
        print("Q1: which configs reference table 'users'?")
        for key_node, file in configs_for_table(graph, "users"):
            print(f"  {key_node}  (in {file})")
        print("Q2: list all entities that mention 'auth'")
        for node in entities_mentioning(graph, "auth"):
            print(f"  {node}")

    if args.html:
        visualize_pyvis(graph, args.html)
    elif not (args.configs_for_table or args.mentions or args.neighbors or args.query):
        visualize_pyvis(graph, Path("graph.html"))


if __name__ == "__main__":
    main()
