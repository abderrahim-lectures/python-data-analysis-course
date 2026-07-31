# server.py
"""An MCP server exposing a folder of Markdown notes as searchable tools.

Every note in NOTES_DIR is a plain .md file with a title on its first
`# `-heading line. No database, no embeddings, no external service --
just reading real files off disk each time a tool is called.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("notes")  # the name your AI client will show for this server

NOTES_DIR = Path(__file__).parent / "notes"  # adjust this to point at your own notes folder


@dataclass
class Note:
    path: Path
    title: str
    body: str
    modified: float


def _load_note(path: Path) -> Note:
    """Read one .md file off disk and pull its title from the first '# ' heading."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    title = path.stem
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            break
    return Note(path=path, title=title, body=text, modified=path.stat().st_mtime)


def _all_notes() -> list[Note]:
    """Load every .md file in NOTES_DIR fresh -- cheap enough at personal-notes scale
    that there's no need to cache anything, and edits on disk show up immediately."""
    if not NOTES_DIR.exists():
        return []
    return [_load_note(p) for p in sorted(NOTES_DIR.glob("*.md"))]


@mcp.tool()
def search_notes(query: str) -> str:
    """Search every note for a keyword and report which notes mention it.

    Looks through each .md file in the notes folder (case-insensitive) and
    returns each matching note's title plus one line of surrounding context.
    Call this when someone asks whether, or where, a topic comes up in their
    notes -- e.g. "do I have any notes about sourdough?".
    """
    query_lower = query.lower()
    matches = []
    for note in _all_notes():
        for line in note.body.splitlines():
            if query_lower in line.lower():
                snippet = line.strip()[:160]
                matches.append(f'"{note.title}": {snippet}')
                break  # one hit per note is enough context
    if not matches:
        return f"No notes mention '{query}'."
    return "Found in:\n" + "\n".join(matches)


@mcp.tool()
def get_note_by_title(title: str) -> str:
    """Return the full text of one note, matched by title.

    Matching is case-insensitive and allows a partial match (e.g. "pasta"
    matches a note titled "Weeknight Garlic Pasta") as long as exactly one
    note matches; ambiguous partial matches are reported instead of guessed.
    Call this once search_notes (or the user) has identified which note they
    want in full, not as a first-pass search tool.
    """
    title_lower = title.lower()
    notes = _all_notes()

    exact = [n for n in notes if n.title.lower() == title_lower]
    if len(exact) == 1:
        return exact[0].body

    partial = [n for n in notes if title_lower in n.title.lower()]
    if len(partial) == 1:
        return partial[0].body
    if len(partial) > 1:
        titles = ", ".join(f'"{n.title}"' for n in partial)
        return f"Multiple notes match '{title}': {titles}. Be more specific."

    return f"No note titled '{title}' found."


@mcp.tool()
def list_recent_notes(limit: int = 5) -> str:
    """List the most recently modified notes, newest first.

    Reports each note's title and how long ago it was last edited, based on
    the file's modification time on disk. Call this when someone asks what
    they've been working on lately, or wants a quick overview of the notes
    folder without searching for anything specific.
    """
    notes = sorted(_all_notes(), key=lambda n: n.modified, reverse=True)[:limit]
    if not notes:
        return "No notes found."

    now = time.time()
    lines = []
    for note in notes:
        age_days = (now - note.modified) / 86400
        if age_days < 1:
            age = "today"
        elif age_days < 2:
            age = "1 day ago"
        else:
            age = f"{int(age_days)} days ago"
        lines.append(f'"{note.title}" ({age})')
    return "\n".join(lines)


if __name__ == "__main__":
    # stdio is the transport an MCP client like Claude Desktop expects for a
    # local server -- it talks to this process over stdin/stdout, not a port.
    mcp.run()
