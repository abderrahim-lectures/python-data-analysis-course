"""Walks a cloned repo, collects indexable files, and splits them into
chunks that remember their source file and line range.

Run with: uv run python prepare_repo.py /path/to/repo
This prints a summary -- build_index.py (Step 2) imports load_chunks()
from this file.
"""

import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "__pycache__", "venv", ".venv", "dist", "build"}
CODE_EXTS = {".py", ".js", ".ts", ".go", ".rs", ".java", ".md", ".mdx", ".txt"}

TARGET_CHUNK_SIZE = 500  # characters


def walk_repo(repo_root: Path) -> list[Path]:
    """Returns every indexable file under repo_root, skipping junk dirs."""
    files = []
    for path in sorted(repo_root.rglob("*")):
        if path.is_dir():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(repo_root).parts):
            continue
        if path.suffix.lower() in CODE_EXTS:
            files.append(path)
    return files


def chunk_code(text: str, source: str) -> list[dict]:
    """Splits a code file at top-level function/class boundaries, so each
    chunk is a self-contained unit -- not a random window that could start
    mid-function."""
    lines = text.splitlines()
    boundaries = [0]
    for i, line in enumerate(lines):
        if line.startswith(("def ", "class ")) and not line.startswith(("    ", "\t")):
            if i > 0:
                boundaries.append(i)
    boundaries.append(len(lines))

    chunks = []
    for start, end in zip(boundaries, boundaries[1:]):
        body = "\n".join(lines[start:end]).strip()
        if not body:
            continue
        chunks.append(
            {"source": source, "start": start + 1, "end": end, "text": body}
        )
    return chunks


def chunk_prose(text: str, source: str) -> list[dict]:
    """Splits a Markdown/text file into paragraph chunks merged up to
    TARGET_CHUNK_SIZE, tracking the line range of each chunk."""
    lines = text.splitlines()
    chunks = []
    current, start = [], None
    for i, line in enumerate(lines):
        if not line.strip():
            if current:
                chunks.append(
                    {
                        "source": source,
                        "start": start + 1,
                        "end": i,
                        "text": "\n".join(current).strip(),
                    }
                )
                current, start = [], None
            continue
        if start is None:
            start = i
        current.append(line)
        if sum(len(l) for l in current) >= TARGET_CHUNK_SIZE:
            chunks.append(
                {
                    "source": source,
                    "start": start + 1,
                    "end": i + 1,
                    "text": "\n".join(current).strip(),
                }
            )
            current, start = [], None
    if current:
        chunks.append(
            {
                "source": source,
                "start": start + 1,
                "end": len(lines),
                "text": "\n".join(current).strip(),
            }
        )
    return chunks


def load_chunks(repo_root: Path) -> list[dict]:
    chunks = []
    for path in walk_repo(repo_root):
        text = path.read_text(encoding="utf-8", errors="replace")
        source = str(path.relative_to(repo_root))
        if path.suffix.lower() in {".md", ".mdx", ".txt"}:
            chunks.extend(chunk_prose(text, source))
        else:
            chunks.extend(chunk_code(text, source))
    return chunks


if __name__ == "__main__":
    root = Path(sys.argv[1])
    chunks = load_chunks(root)
    print(f"Indexed {len(chunks)} chunks from {len(walk_repo(root))} files")
    for c in chunks[:3]:
        print(f"  {c['source']}:{c['start']}-{c['end']}  {c['text'][:60]}...")
