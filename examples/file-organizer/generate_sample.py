"""Generates a small, safe, throwaway messy folder to test organizer.py against.

Never point organizer.py at your real Downloads folder on your first try --
run this script instead, then experiment on the sample folder it creates.

Usage:
    uv run python generate_sample.py [target_folder]
"""

from __future__ import annotations

import sys
from pathlib import Path

# (filename, contents) -- deliberately mixed types, including a name
# collision (two "report.pdf"-flavored files) to exercise collision
# handling, a couple of files with no extension, and a dotfile that a
# real organizer should ignore.
SAMPLE_FILES = [
    ("report.pdf", "Quarterly report placeholder.\n"),
    ("notes.txt", "Random notes.\n"),
    ("photo1.jpg", "not a real jpg, just sample bytes\n"),
    ("photo2.png", "not a real png, just sample bytes\n"),
    ("archive.zip", "not a real zip, just sample bytes\n"),
    ("script.py", "print('hello from a sample script')\n"),
    ("song.mp3", "not a real mp3, just sample bytes\n"),
    ("spreadsheet.csv", "col1,col2\n1,2\n"),
    ("README", "A file with no extension.\n"),
    ("mystery", "Another file with no extension.\n"),
    (".hidden_config", "A dotfile that organizer.py should skip.\n"),
]


def generate(target: Path) -> None:
    target.mkdir(parents=True, exist_ok=True)
    for name, contents in SAMPLE_FILES:
        (target / name).write_text(contents)

    # A pre-existing file in the destination "documents" folder, to force a
    # real collision the first time organizer.py runs: report.pdf will want
    # to land at documents/report.pdf, which already exists.
    documents_dir = target / "documents"
    documents_dir.mkdir(exist_ok=True)
    (documents_dir / "report.pdf").write_text("An older report.pdf already living here.\n")

    print(f"Sample messy folder created at: {target}")
    print(f"  {len(SAMPLE_FILES)} loose files, plus a pre-existing documents/report.pdf")
    print("  (that pre-existing file is there on purpose, to exercise collision handling)")


if __name__ == "__main__":
    destination = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("sample_messy_folder")
    generate(destination.resolve())
