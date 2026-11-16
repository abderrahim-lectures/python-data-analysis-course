"""File-Organizer Bot.

Sorts every file directly inside a target folder into category subfolders
(documents/, images/, archives/, code/, audio/, video/, other/) based on
file extension, with a real --dry-run mode and a JSON operations log that
--undo can replay in reverse.

Usage:
    uv run python organizer.py <folder> --dry-run
    uv run python organizer.py <folder>
    uv run python organizer.py <folder> --undo
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

# Extension -> category folder name. Extensions are matched lowercase,
# without the leading dot. Anything not listed here lands in "other".
EXTENSION_CATEGORIES: dict[str, str] = {
    # documents
    "pdf": "documents",
    "doc": "documents",
    "docx": "documents",
    "txt": "documents",
    "md": "documents",
    "rtf": "documents",
    "odt": "documents",
    "xls": "documents",
    "xlsx": "documents",
    "csv": "documents",
    "ppt": "documents",
    "pptx": "documents",
    # images
    "jpg": "images",
    "jpeg": "images",
    "png": "images",
    "gif": "images",
    "svg": "images",
    "webp": "images",
    "bmp": "images",
    "heic": "images",
    # archives
    "zip": "archives",
    "tar": "archives",
    "gz": "archives",
    "rar": "archives",
    "7z": "archives",
    # code
    "py": "code",
    "js": "code",
    "ts": "code",
    "html": "code",
    "css": "code",
    "json": "code",
    "sh": "code",
    "ipynb": "code",
    # audio
    "mp3": "audio",
    "wav": "audio",
    "flac": "audio",
    "m4a": "audio",
    # video
    "mp4": "video",
    "mov": "video",
    "mkv": "video",
    "avi": "video",
}

DEFAULT_CATEGORY = "other"
LOG_FILENAME = ".organizer_log.json"


def category_for(path: Path) -> str:
    """Returns the category folder name for a file, based on its extension."""
    ext = path.suffix.lower().lstrip(".")
    return EXTENSION_CATEGORIES.get(ext, DEFAULT_CATEGORY)


def scan_folder(folder: Path) -> list[Path]:
    """Returns the real, organizable files directly inside `folder`.

    Skips subfolders (including category folders from a previous run),
    hidden/dotfiles, and the operations log itself.
    """
    files = []
    for entry in sorted(folder.iterdir()):
        if entry.is_dir():
            continue
        if entry.name.startswith("."):
            continue
        if entry.name == LOG_FILENAME:
            continue
        files.append(entry)
    return files


def plan_moves(folder: Path) -> list[tuple[Path, Path]]:
    """Returns [(source, destination)] pairs for every file that would move.

    Destination collisions (a same-named file already sitting in the
    category folder) are resolved by appending " (1)", " (2)", etc. to the
    destination filename until it's free.
    """
    moves = []
    reserved: set[Path] = set()
    for source in scan_folder(folder):
        category = category_for(source)
        dest_dir = folder / category
        destination = resolve_collision(dest_dir / source.name, reserved)
        reserved.add(destination)
        moves.append((source, destination))
    return moves


def resolve_collision(destination: Path, reserved: set[Path]) -> Path:
    """Returns a destination path guaranteed not to already exist on disk
    and not already claimed by an earlier move planned in this same run.
    """
    if not destination.exists() and destination not in reserved:
        return destination
    stem, suffix, parent = destination.stem, destination.suffix, destination.parent
    counter = 1
    while True:
        candidate = parent / f"{stem} ({counter}){suffix}"
        if not candidate.exists() and candidate not in reserved:
            return candidate
        counter += 1


def print_plan(moves: list[tuple[Path, Path]], folder: Path) -> None:
    if not moves:
        print("Nothing to organize -- no loose files found directly inside the folder.")
        return
    print(f"Planned moves ({len(moves)}):")
    for source, destination in moves:
        print(f"  {source.relative_to(folder)}  ->  {destination.relative_to(folder)}")


def apply_moves(moves: list[tuple[Path, Path]], folder: Path) -> list[dict]:
    """Performs the real moves on disk and returns the operations log entries."""
    log_entries = []
    for source, destination in moves:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(source), str(destination))
        log_entries.append(
            {
                "source": str(source.relative_to(folder)),
                "destination": str(destination.relative_to(folder)),
            }
        )
        print(f"Moved: {source.relative_to(folder)}  ->  {destination.relative_to(folder)}")
    return log_entries


def write_log(folder: Path, entries: list[dict]) -> Path:
    log_path = folder / LOG_FILENAME
    run = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "moves": entries,
    }
    log_path.write_text(json.dumps(run, indent=2))
    return log_path


def undo_last_run(folder: Path) -> None:
    log_path = folder / LOG_FILENAME
    if not log_path.exists():
        print(f"No operations log found at {log_path} -- nothing to undo.")
        sys.exit(1)

    run = json.loads(log_path.read_text())
    moves = run.get("moves", [])
    if not moves:
        print("Log file has no recorded moves -- nothing to undo.")
        log_path.unlink()
        return

    print(f"Undoing {len(moves)} move(s) from run at {run.get('timestamp', 'unknown time')}:")
    skipped = []
    for entry in reversed(moves):
        destination = folder / entry["destination"]
        source = folder / entry["source"]
        if not destination.exists():
            print(f"  SKIPPED (file no longer at destination): {entry['destination']}")
            skipped.append(entry)
            continue
        source.parent.mkdir(parents=True, exist_ok=True)
        if source.exists():
            print(f"  SKIPPED (a file already exists at the original location): {entry['source']}")
            skipped.append(entry)
            continue
        shutil.move(str(destination), str(source))
        print(f"  Restored: {entry['destination']}  ->  {entry['source']}")

    # Clean up now-empty category folders created by the original run.
    for category in set(EXTENSION_CATEGORIES.values()) | {DEFAULT_CATEGORY}:
        category_dir = folder / category
        if category_dir.is_dir() and not any(category_dir.iterdir()):
            category_dir.rmdir()

    log_path.unlink()
    if skipped:
        print(f"\n{len(skipped)} move(s) could not be undone automatically -- see messages above.")
    else:
        print("\nUndo complete. All files restored to their original locations.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sort a messy folder into category subfolders.")
    parser.add_argument("folder", type=Path, help="Folder to organize.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would move without moving anything.",
    )
    parser.add_argument(
        "--undo",
        action="store_true",
        help="Reverse the moves from this folder's last real run.",
    )
    args = parser.parse_args()

    folder = args.folder.resolve()
    if not folder.is_dir():
        print(f"Error: {folder} is not a folder.")
        sys.exit(1)

    if args.undo:
        undo_last_run(folder)
        return

    moves = plan_moves(folder)

    if args.dry_run:
        print(f"[DRY RUN] No files will be moved. Target: {folder}\n")
        print_plan(moves, folder)
        return

    if not moves:
        print("Nothing to organize -- no loose files found directly inside the folder.")
        return

    log_entries = apply_moves(moves, folder)
    log_path = write_log(folder, log_entries)
    print(f"\nDone. {len(log_entries)} file(s) organized. Operations log written to {log_path.name}.")
    print("Run with --undo to reverse this run.")


if __name__ == "__main__":
    main()
