# Build a File-Organizer Bot Example

The local companion to the course's [Build a File-Organizer Bot](https://pyda-course.online/projects/file-organizer/) project — a real, runnable script that sorts a folder into category subfolders by file type, with a genuine `--dry-run` mode and a JSON operations log that `--undo` can replay in reverse.

## What's here

- `organizer.py` — the whole bot. Scans a folder's loose files, maps each one to a category (`documents`, `images`, `archives`, `code`, `audio`, `video`, `other`) via its extension, and either prints the plan (`--dry-run`) or actually moves the files, handling name collisions by appending `(1)`, `(2)`, etc., and writing a `.organizer_log.json` operations log after every real run.
- `generate_sample.py` — creates a small, safe, throwaway messy folder (default: `sample_messy_folder/`) to test `organizer.py` against, including a deliberate name collision, a couple of extensionless files, and a dotfile the organizer should ignore. Never risk your real Downloads folder on a first try — generate a sample folder instead.

Nothing here needs an API key or any external package — it's pure Python standard library (`pathlib`, `shutil`, `json`).

## How to run this

```bash
# 1. Generate a safe sample folder to experiment on.
uv run python generate_sample.py

# 2. See what WOULD happen -- nothing is moved yet.
uv run python organizer.py sample_messy_folder --dry-run

# 3. Actually organize it.
uv run python organizer.py sample_messy_folder

# 4. Changed your mind? Undo the last real run.
uv run python organizer.py sample_messy_folder --undo
```

Example `--dry-run` output:

```
[DRY RUN] No files will be moved. Target: /path/to/sample_messy_folder

Planned moves (10):
  README  ->  other/README
  archive.zip  ->  archives/archive.zip
  mystery  ->  other/mystery
  notes.txt  ->  documents/notes.txt
  photo1.jpg  ->  images/photo1.jpg
  photo2.png  ->  images/photo2.png
  report.pdf  ->  documents/report (1).pdf
  script.py  ->  code/script.py
  song.mp3  ->  audio/song.mp3
  spreadsheet.csv  ->  documents/spreadsheet.csv
```

Notice `report.pdf` renamed to `report (1).pdf` in the plan — `generate_sample.py` deliberately pre-creates a `documents/report.pdf` so the very first run exercises real collision handling, not a hand-wavy hypothetical.

`uv run` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed, and no third-party dependencies to install either.

## Once you trust it

After you've dry-run it and organized the sample folder a few times, `organizer.py` works exactly the same way against any real folder — just point it at the real path instead of `sample_messy_folder`. Always `--dry-run` first, on any folder you haven't organized before.

See the full [Build a File-Organizer Bot lesson](https://pyda-course.online/projects/file-organizer/) for the step-by-step walkthrough, including how the extension-to-category mapping, collision handling, and undo log are each built up.

## Built your own organizer?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
