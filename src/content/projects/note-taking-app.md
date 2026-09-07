---
title: "Markdown Note-Taking App"
description: "A terminal-based note-taking app with full-text search, tags, and Markdown export."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["cli", "file-io", "json", "search"]
prerequisites: ["Python basics (variables, loops, functions, dictionaries)", "Basic file I/O"]
---

# Markdown Note-Taking App

Build a terminal-based note-taking application that stores notes as JSON, supports full-text search, tag-based organization, and exports to clean Markdown files. This project reinforces dictionary manipulation, file I/O, string processing, and building a user-facing CLI from scratch.

## What You'll Learn

1. Design a data model for notes using dictionaries and JSON serialization
2. Implement full-text search across multiple fields
3. Build a tag system for flexible organization and filtering
4. Create a menu-driven CLI with colored output and input validation
5. Export structured data to Markdown files for sharing

## What You'll Build

A command-line note manager that lets you:

- **Create notes** with a title, body text, and tags, stored as JSON on disk
- **List and search** notes with full-text matching across titles and content
- **Tag and filter** notes to organize them by topic
- **Edit and delete** existing notes interactively
- **Export notes** to individual `.md` files or a single combined document
- **Use a polished CLI** with a numbered menu, colored output, and graceful error handling

## Setup

```bash
uv init note-taking-app
cd note-taking-app
```

No external packages needed — the app uses only the Python standard library (`json`, `os`, `datetime`, `pathlib`).

## Step 1 — Set Up the Project Structure

Every note needs a consistent shape so the rest of the app can rely on the same fields. We'll store notes as a list of dictionaries in a JSON file. Each note will have an `id`, `title`, `content`, `tags`, `created_at`, and `updated_at` field.

Create a file called `notes.py` and define the data model and storage layer:

```python
import json
import os
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path("data")
NOTES_FILE = DATA_DIR / "notes.json"

def ensure_data_dir():
    """Create the data directory if it doesn't exist."""
    DATA_DIR.mkdir(exist_ok=True)

def load_notes() -> list[dict]:
    """Load all notes from the JSON file."""
    ensure_data_dir()
    if not NOTES_FILE.exists():
        return []
    with open(NOTES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_notes(notes: list[dict]) -> None:
    """Save all notes to the JSON file."""
    ensure_data_dir()
    with open(NOTES_FILE, "w", encoding="utf-8") as f:
        json.dump(notes, f, indent=2, ensure_ascii=False)

def generate_id(notes: list[dict]) -> int:
    """Return the next available note ID."""
    if not notes:
        return 1
    return max(note["id"] for note in notes) + 1

# Quick test
ensure_data_dir()
notes = load_notes()
print(f"Data directory: {DATA_DIR.resolve()}")
print(f"Notes loaded: {len(notes)}")
print(f"Notes file: {NOTES_FILE}")
```

**🎯 Expected output:**

```
Data directory: /home/user/note-taking-app/data
Notes loaded: 0
Notes file: data/notes.json
```

**🩹 If it's off:**

- If you see a `FileNotFoundError`, check that `DATA_DIR.mkdir(exist_ok=True)` is called before accessing the file.
- If the path looks wrong, make sure you're running the script from the project root.

**✅ Checklist**

- ✅ `data/` directory is created automatically when the script runs
- ✅ `load_notes()` returns an empty list when no file exists yet
- ✅ `save_notes()` writes a valid JSON file

**🤔 Socratic Question(s)**

- Why store notes as JSON instead of plain text? What would you lose if each note were a separate `.txt` file?

---

## Step 2 — Create Notes

Now that we can load and save, let's build the function that creates a new note. It takes a title, content, and optional tags, assigns an ID and timestamps, and appends it to the list.

Add this to `notes.py`:

```python
def create_note(title: str, content: str, tags: list[str] | None = None) -> dict:
    """Create a new note and save it."""
    notes = load_notes()
    now = datetime.now(timezone.utc).isoformat()
    note = {
        "id": generate_id(notes),
        "title": title.strip(),
        "content": content.strip(),
        "tags": [tag.strip().lower() for tag in (tags or [])],
        "created_at": now,
        "updated_at": now,
    }
    notes.append(note)
    save_notes(notes)
    return note

# Test it out
note1 = create_note(
    "Python List Comprehensions",
    "List comprehensions provide a concise way to create lists.\nExample: [x**2 for x in range(10)]",
    tags=["python", "basics"]
)
note2 = create_note(
    "Git Rebase vs Merge",
    "Rebase rewrites commit history to create a linear timeline.\nMerge preserves the full branch history with a merge commit.",
    tags=["git", "workflow"]
)
note3 = create_note(
    "Python Virtual Environments",
    "Use venv to create isolated Python environments.\nCommands: python -m venv .venv && source .venv/bin/activate",
    tags=["python", "tools"]
)

print(f"Created note {note1['id']}: {note1['title']}")
print(f"Created note {note2['id']}: {note2['title']}")
print(f"Created note {note3['id']}: {note3['title']}")
print(f"\nTotal notes: {len(load_notes())}")
```

**🎯 Expected output:**

```
Created note 1: Python List Comprehensions
Created note 2: Git Rebase vs Merge
Created note 3: Python Virtual Environments

Total notes: 3
```

After running, inspect `data/notes.json` — you'll see all three notes stored with IDs, tags, and timestamps.

**🩹 If it's off:**

- If IDs aren't sequential, check that `load_notes()` reads the current list before generating the next ID.
- Tags should be lowercase — if you see mixed case, the list comprehension in `create_note` isn't running.

**✅ Checklist**

- ✅ Each note gets a unique, incrementing ID
- ✅ Tags are normalized to lowercase and stripped of whitespace
- ✅ `created_at` and `updated_at` are set to UTC ISO timestamps
- ✅ Notes persist in `data/notes.json` after the script finishes

**🤔 Socratic Question(s)**

- What happens if two users create notes at the same time? How could you make IDs more robust?

---

## Step 3 — List and Search Notes

A note-taking app is useless if you can't find anything. We'll implement two things: listing all notes in a readable format, and full-text search that matches against both titles and content.

Add these functions to `notes.py`:

```python
def list_notes(sort_by: str = "updated_at") -> None:
    """Print all notes in a readable format."""
    notes = load_notes()
    if not notes:
        print("  No notes yet. Create one with option 1!")
        return

    notes.sort(key=lambda n: n[sort_by], reverse=True)
    print(f"\n  {'ID':<4} {'Title':<35} {'Tags':<20} {'Updated':<12}")
    print(f"  {'-'*4} {'-'*35} {'-'*20} {'-'*12}")
    for note in notes:
        tags_str = ", ".join(note["tags"]) if note["tags"] else "—"
        updated = note["updated_at"][:10]
        print(f"  {note['id']:<4} {note['title'][:34]:<35} {tags_str[:19]:<20} {updated:<12}")
    print(f"\n  {len(notes)} note(s) total")

def search_notes(query: str) -> list[dict]:
    """Search notes by matching query against title and content (case-insensitive)."""
    notes = load_notes()
    query_lower = query.lower()
    results = [
        note for note in notes
        if query_lower in note["title"].lower()
        or query_lower in note["content"].lower()
    ]
    return results

def display_search_results(query: str) -> None:
    """Search and display matching notes."""
    results = search_notes(query)
    if not results:
        print(f'  No notes matching "{query}"')
        return

    print(f'\n  Found {len(results)} note(s) matching "{query}":')
    for note in results:
        tags_str = ", ".join(note["tags"]) if note["tags"] else "—"
        print(f"\n  [{note['id']}] {note['title']}")
        print(f"      Tags: {tags_str}")
        preview = note["content"][:80].replace("\n", " ")
        if len(note["content"]) > 80:
            preview += "..."
        print(f"      {preview}")

# Test listing
list_notes()

# Test search
print("\n--- Search: 'python' ---")
display_search_results("python")

print("\n--- Search: 'git' ---")
display_search_results("git")

print("\n--- Search: 'docker' ---")
display_search_results("docker")
```

**🎯 Expected output:**

```
  ID   Title                               Tags                 Updated
  ---- ----------------------------------- -------------------- ------------
  3    Python Virtual Environments         python, tools        2026-09-06
  2    Git Rebase vs Merge                 git, workflow        2026-09-06
  1    Python List Comprehensions          python, basics       2026-09-06

  3 note(s) total

--- Search: 'python' ---
  Found 2 note(s) matching "python":

  [1] Python List Comprehensions
      Tags: python, basics
      List comprehensions provide a concise way to create lists. Example: [x**2...

  [3] Python Virtual Environments
      Tags: python, tools
      Use venv to create isolated Python environments. Commands: python -m v...

--- Search: 'git' ---
  Found 1 note(s) matching "git":

  [2] Git Rebase vs Merge
      Tags: git, workflow
      Rebase rewrites commit history to create a linear timeline. Merge pre...

--- Search: 'docker' ---
  No notes matching "docker"
```

**🩹 If it's off:**

- If search returns nothing for "python", check that `query_lower` is being compared to `note["title"].lower()` — case sensitivity is the usual culprit.
- If the table columns are misaligned, make sure the f-string width specifiers (`:<4`, `:<35`, etc.) match the header widths.

**✅ Checklist**

- ✅ `list_notes()` displays all notes sorted by most recently updated
- ✅ `search_notes()` returns notes matching the query in title or content
- ✅ Case-insensitive search works for partial matches
- ✅ Search results show a content preview truncated to 80 characters

**🤔 Socratic Question(s)**

- How would you extend the search to also match against tags? What about searching for notes created this week?

---

## Step 4 — Organize with Tags

Tags let you group notes without rigid categories. We'll add functions to add and remove tags from existing notes, and to filter the note list by a specific tag.

Add these functions to `notes.py`:

```python
def add_tag_to_note(note_id: int, tag: str) -> bool:
    """Add a tag to a note. Returns True if successful."""
    notes = load_notes()
    for note in notes:
        if note["id"] == note_id:
            tag_clean = tag.strip().lower()
            if tag_clean not in note["tags"]:
                note["tags"].append(tag_clean)
                note["updated_at"] = datetime.now(timezone.utc).isoformat()
                save_notes(notes)
                print(f'  Added tag "{tag_clean}" to note {note_id}')
            else:
                print(f'  Note {note_id} already has tag "{tag_clean}"')
            return True
    print(f"  Note {note_id} not found")
    return False

def remove_tag_from_note(note_id: int, tag: str) -> bool:
    """Remove a tag from a note. Returns True if successful."""
    notes = load_notes()
    for note in notes:
        if note["id"] == note_id:
            tag_clean = tag.strip().lower()
            if tag_clean in note["tags"]:
                note["tags"].remove(tag_clean)
                note["updated_at"] = datetime.now(timezone.utc).isoformat()
                save_notes(notes)
                print(f'  Removed tag "{tag_clean}" from note {note_id}')
            else:
                print(f'  Note {note_id} does not have tag "{tag_clean}"')
            return True
    print(f"  Note {note_id} not found")
    return False

def get_all_tags() -> dict[str, int]:
    """Return a dictionary of all tags and how many notes use each."""
    notes = load_notes()
    tag_counts: dict[str, int] = {}
    for note in notes:
        for tag in note["tags"]:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    return dict(sorted(tag_counts.items(), key=lambda x: x[1], reverse=True))

def filter_by_tag(tag: str) -> list[dict]:
    """Return all notes that have the given tag."""
    notes = load_notes()
    tag_clean = tag.strip().lower()
    return [note for note in notes if tag_clean in note["tags"]]

# Test tag operations
add_tag_to_note(1, "reference")
add_tag_to_note(1, "reference")  # duplicate — should warn

print("\nAll tags:")
for tag, count in get_all_tags().items():
    print(f"  {tag}: {count} note(s)")

print("\nNotes tagged 'python':")
for note in filter_by_tag("python"):
    print(f"  [{note['id']}] {note['title']}")

remove_tag_from_note(1, "basics")
print("\nTags on note 1 after removal:")
note = [n for n in load_notes() if n["id"] == 1][0]
print(f"  {note['title']}: {note['tags']}")
```

**🎯 Expected output:**

```
  Added tag "reference" to note 1
  Note 1 already has tag "reference"

All tags:
  python: 2 note(s)
  reference: 1 note(s)
  basics: 1 note(s)
  tools: 1 note(s)
  git: 1 note(s)
  workflow: 1 note(s)

Notes tagged 'python':
  [1] Python List Comprehensions
  [3] Python Virtual Environments

  Removed tag "basics" from note 1

Tags on note 1 after removal:
  Python List Comprehensions: ['python', 'reference']
```

**🩹 If it's off:**

- If duplicate tags appear, check that the `if tag_clean not in note["tags"]` guard is in place before appending.
- If `get_all_tags()` shows unexpected counts, verify that `filter_by_tag` uses the same `.lower()` normalization as `add_tag_to_note`.

**✅ Checklist**

- ✅ Adding a duplicate tag prints a warning instead of duplicating it
- ✅ Removing a tag updates `updated_at` and persists the change
- ✅ `get_all_tags()` returns a sorted dictionary of tag usage counts
- ✅ `filter_by_tag()` returns only notes containing the exact tag

**🤔 Socratic Question(s)**

- How would you implement nested tags (e.g., `python/django` and `python/flask` under a `python` parent)?

---

## Step 5 — Edit and Delete Notes

Users need to correct mistakes and remove stale notes. We'll add functions to update specific fields of an existing note and to delete notes by ID.

Add these functions to `notes.py`:

```python
def get_note_by_id(note_id: int) -> dict | None:
    """Return a single note by its ID, or None if not found."""
    notes = load_notes()
    for note in notes:
        if note["id"] == note_id:
            return note
    return None

def edit_note(note_id: int, title: str | None = None, content: str | None = None) -> bool:
    """Update the title and/or content of an existing note."""
    notes = load_notes()
    for note in notes:
        if note["id"] == note_id:
            if title is not None:
                note["title"] = title.strip()
            if content is not None:
                note["content"] = content.strip()
            note["updated_at"] = datetime.now(timezone.utc).isoformat()
            save_notes(notes)
            print(f"  Updated note {note_id}: {note['title']}")
            return True
    print(f"  Note {note_id} not found")
    return False

def delete_note(note_id: int) -> bool:
    """Delete a note by ID. Returns True if deleted."""
    notes = load_notes()
    original_count = len(notes)
    notes = [note for note in notes if note["id"] != note_id]
    if len(notes) < original_count:
        save_notes(notes)
        print(f"  Deleted note {note_id}")
        return True
    print(f"  Note {note_id} not found")
    return False

# Test edit
print("Before edit:")
note = get_note_by_id(2)
print(f"  [{note['id']}] {note['title']}")
print(f"  {note['content'][:60]}...")

edit_note(2, title="Git: Rebase vs Merge", content="Rebase rewrites commit history for a linear timeline.\nMerge preserves full branch history with a merge commit.\n\nWhen to rebase: local cleanup before sharing.\nWhen to merge: shared branches where history matters.")

print("\nAfter edit:")
note = get_note_by_id(2)
print(f"  [{note['id']}] {note['title']}")
print(f"  {note['content'][:80]}...")

# Test delete
print("\nDeleting note 3...")
delete_note(3)
list_notes()
```

**🎯 Expected output:**

```
Before edit:
  [2] Git Rebase vs Merge
  Rebase rewrites commit history to create a linear timeline. Merge pre...

  Updated note 2: Git: Rebase vs Merge

After edit:
  [2] Git: Rebase vs Merge
  Rebase rewrites commit history for a linear timeline. Merge preserves full branch hist...

  Deleted note 3

  ID   Title                               Tags                 Updated
  ---- ----------------------------------- -------------------- ------------
  2    Git: Rebase vs Merge                git, workflow        2026-09-06
  1    Python List Comprehensions          python, reference    2026-09-06

  2 note(s) total
```

**🩹 If it's off:**

- If `edit_note` doesn't seem to save, check that you're passing `title=` and `content=` as keyword arguments — the function uses `None` as a sentinel to skip unchanged fields.
- If `delete_note` says "not found" but the note exists, verify the ID is an integer, not a string.

**✅ Checklist**

- ✅ `edit_note()` updates only the fields you pass, leaving others unchanged
- ✅ `edit_note()` updates the `updated_at` timestamp
- ✅ `delete_note()` removes the note from the JSON file and confirms deletion
- ✅ `get_note_by_id()` returns `None` for non-existent IDs

**🤔 Socratic Question(s)**

- How could you implement an "undo" for delete? What data would you need to keep?

---

## Step 6 — Export to Markdown

Markdown files are easy to share, preview on GitHub, or import into other tools. We'll convert notes to clean `.md` files — one file per note, or a single combined document.

Add these functions to `notes.py`:

```python
EXPORT_DIR = Path("exports")

def export_note_to_markdown(note: dict, output_dir: Path | None = None) -> Path:
    """Export a single note to a Markdown file."""
    output_dir = output_dir or EXPORT_DIR
    output_dir.mkdir(exist_ok=True)

    safe_title = note["title"].replace(" ", "-").replace("/", "-").lower()
    filename = f"{note['id']:03d}-{safe_title}.md"
    filepath = output_dir / filename

    tags_line = ", ".join(f"`{tag}`" for tag in note["tags"]) if note["tags"] else "None"
    created = note["created_at"][:10]
    updated = note["updated_at"][:10]

    md_content = f"""# {note['title']}

> **Tags:** {tags_line}
> **Created:** {created} | **Updated:** {updated}

---

{note['content']}
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md_content)
    return filepath

def export_all_notes(combined: bool = False) -> list[Path]:
    """Export all notes to Markdown. If combined, write a single file."""
    notes = load_notes()
    if not notes:
        print("  No notes to export")
        return []

    EXPORT_DIR.mkdir(exist_ok=True)
    paths = []

    if combined:
        filepath = EXPORT_DIR / "all-notes.md"
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("# All Notes\n\n")
            f.write(f"*Exported on {datetime.now(timezone.utc).strftime('%Y-%m-%d')}*\n\n")
            f.write("---\n\n")
            for note in notes:
                tags_line = ", ".join(f"`{tag}`" for tag in note["tags"]) if note["tags"] else "None"
                f.write(f"## {note['title']}\n\n")
                f.write(f"**Tags:** {tags_line} | **Created:** {note['created_at'][:10]}\n\n")
                f.write(f"{note['content']}\n\n---\n\n")
        paths.append(filepath)
        print(f"  Exported combined file: {filepath}")
    else:
        for note in notes:
            path = export_note_to_markdown(note)
            paths.append(path)
            print(f"  Exported: {path}")

    print(f"\n  {len(paths)} file(s) exported to {EXPORT_DIR}/")
    return paths

# Test individual export
note = get_note_by_id(1)
path = export_note_to_markdown(note)
print(f"Exported to: {path}")

# Print the generated Markdown
with open(path, "r") as f:
    print(f"\n--- Content of {path.name} ---")
    print(f.read())

# Test combined export
print("--- Exporting all notes as one file ---")
export_all_notes(combined=True)
```

**🎯 Expected output:**

```
Exported to: exports/001-python-list-comprehensions.md

--- Content of 001-python-list-comprehensions.md ---
# Python List Comprehensions

> **Tags:** `python`, `reference`
> **Created:** 2026-09-06 | **Updated:** 2026-09-06

---

List comprehensions provide a concise way to create lists.
Example: [x**2 for x in range(10)]

--- Exporting all notes as one file ---
  Exported combined file: exports/all-notes.md

  1 file(s) exported to exports/
```

**🩹 If it's off:**

- If the exported file is empty, check that `note["content"]` is a string — a `None` value would silently produce no output.
- If `safe_title` contains weird characters, add more replacements: `note["title"].replace(":", "").replace("'", "")`.

**✅ Checklist**

- ✅ Each exported `.md` file has a heading, metadata block, and the note content
- ✅ Filenames are safe for all operating systems (no special characters)
- ✅ Combined export produces a single `all-notes.md` with all notes separated by horizontal rules
- ✅ Exported Markdown renders correctly in any Markdown viewer

**🤔 Socratic Question(s)**

- How would you add a table of contents to the combined export that links to each note heading?

---

## Step 7 — Polish the CLI

The final step ties everything together with a menu-driven interface. We'll add colored output using ANSI codes, input validation, and clean error handling so the app feels polished.

Replace the bottom of `notes.py` (or add to a new `main.py` and import from `notes.py`) with:

```python
# ── Colors (ANSI escape codes) ──────────────────────────────────
BOLD = "\033[1m"
GREEN = "\033[32m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
RED = "\033[31m"
RESET = "\033[0m"

def colored(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"

def print_header():
    print(f"\n{colored('=' * 50, CYAN)}")
    print(colored("  📝  Markdown Note-Taking App", BOLD))
    print(colored('=' * 50, CYAN))

def print_menu():
    print(f"""
  {colored('1.', GREEN)} Create a new note
  {colored('2.', GREEN)} List all notes
  {colored('3.', GREEN)} Search notes
  {colored('4.', GREEN)} Add tag to a note
  {colored('5.', GREEN)} Remove tag from a note
  {colored('6.', GREEN)} Filter notes by tag
  {colored('7.', GREEN)} Edit a note
  {colored('8.', GREEN)} Delete a note
  {colored('9.', GREEN)} Export all notes to Markdown
  {colored('0.', RED)}  Exit
""")

def get_input(prompt: str) -> str:
    """Get input with colored prompt."""
    return input(colored(f"  {prompt}: ", CYAN)).strip()

def get_int(prompt: str) -> int | None:
    """Get an integer input, returning None on failure."""
    try:
        return int(get_input(prompt))
    except ValueError:
        print(colored("  Please enter a valid number.", RED))
        return None

def handle_create():
    title = get_input("Title")
    if not title:
        print(colored("  Title cannot be empty.", RED))
        return
    print("  Content (press Enter twice when done):")
    lines = []
    while True:
        line = input("  > ")
        if line == "" and lines and lines[-1] == "":
            break
        lines.append(line)
    content = "\n".join(lines).strip()
    tags_input = get_input("Tags (comma-separated, or leave empty)")
    tags = [t.strip() for t in tags_input.split(",") if t.strip()] if tags_input else []
    note = create_note(title, content, tags)
    print(colored(f"  ✓ Created note {note['id']}: {note['title']}", GREEN))

def handle_search():
    query = get_input("Search query")
    if query:
        display_search_results(query)

def handle_list():
    list_notes()

def handle_add_tag():
    note_id = get_int("Note ID")
    if note_id is None:
        return
    tag = get_input("Tag to add")
    if tag:
        add_tag_to_note(note_id, tag)

def handle_remove_tag():
    note_id = get_int("Note ID")
    if note_id is None:
        return
    tag = get_input("Tag to remove")
    if tag:
        remove_tag_from_note(note_id, tag)

def handle_filter_tag():
    tag = get_input("Tag to filter by")
    if tag:
        results = filter_by_tag(tag)
        if results:
            print(f"\n  Notes tagged '{tag}':")
            for note in results:
                print(f"    [{note['id']}] {note['title']}")
        else:
            print(f"  No notes with tag '{tag}'")

def handle_edit():
    note_id = get_int("Note ID to edit")
    if note_id is None:
        return
    note = get_note_by_id(note_id)
    if not note:
        print(colored(f"  Note {note_id} not found.", RED))
        return
    print(f"  Current title: {note['title']}")
    new_title = get_input("New title (leave blank to keep)")
    print(f"  Current content preview: {note['content'][:50]}...")
    new_content = get_input("New content (leave blank to keep)")
    edit_note(
        note_id,
        title=new_title if new_title else None,
        content=new_content if new_content else None,
    )

def handle_delete():
    note_id = get_int("Note ID to delete")
    if note_id is None:
        return
    note = get_note_by_id(note_id)
    if not note:
        print(colored(f"  Note {note_id} not found.", RED))
        return
    confirm = get_input(f'Delete "{note["title"]}"? (yes/no)')
    if confirm.lower() == "yes":
        delete_note(note_id)
        print(colored("  ✓ Deleted.", GREEN))
    else:
        print("  Cancelled.")

def handle_export():
    export_all_notes(combined=True)

HANDLERS = {
    1: handle_create,
    2: handle_list,
    3: handle_search,
    4: handle_add_tag,
    5: handle_remove_tag,
    6: handle_filter_tag,
    7: handle_edit,
    8: handle_delete,
    9: handle_export,
}

def main():
    """Run the note-taking app."""
    ensure_data_dir()
    print_header()

    while True:
        print_menu()
        choice = get_int("Choose an option")
        if choice == 0:
            print(colored("\n  Goodbye! 👋\n", YELLOW))
            break
        if choice is None or choice not in HANDLERS:
            print(colored("  Invalid option. Try again.", RED))
            continue
        try:
            HANDLERS[choice]()
        except KeyboardInterrupt:
            print(colored("\n\n  Interrupted. Goodbye!", YELLOW))
            break
        except Exception as e:
            print(colored(f"  Error: {e}", RED))

if __name__ == "__main__":
    main()
```

**🎯 Expected output (interactive session):**

```
==================================================
  📝  Markdown Note-Taking App
==================================================

  1. Create a new note
  2. List all notes
  3. Search notes
  4. Add tag to a note
  5. Remove tag from a note
  6. Filter notes by tag
  7. Edit a note
  8. Delete a note
  9. Export all notes to Markdown
  0. Exit

  Choose an option: 2

  ID   Title                               Tags                 Updated
  ---- ----------------------------------- -------------------- ------------
  2    Git: Rebase vs Merge                git, workflow        2026-09-06
  1    Python List Comprehensions          python, reference    2026-09-06

  2 note(s) total

  Choose an option: 0

  Goodbye! 👋
```

**🩹 If it's off:**

- If colors don't appear, your terminal might not support ANSI codes — try a different terminal or check `$TERM` is set to `xterm-256color` or similar.
- If the input loop hangs, check that `handle_create` properly breaks out of the content input loop on two consecutive empty lines.
- If `Ctrl+C` doesn't exit cleanly, the `except KeyboardInterrupt` block should catch it.

**✅ Checklist**

- ✅ Menu displays with numbered options and colored text
- ✅ Invalid input prints an error and re-shows the menu
- ✅ Each menu option calls the correct handler function
- ✅ Ctrl+C exits the app gracefully without a traceback
- ✅ The app loops until the user chooses option 0

**🤔 Socratic Question(s)**

- How would you add command-line arguments so users can run `python notes.py search "python"` without entering the interactive menu?

---

## 🧩 Challenges

**Challenge 1 — Note pinning**
Add a `pinned` boolean field to each note. When listing, pinned notes always appear at the top regardless of sort order.

**Challenge 2 — Full export with table of contents**
Extend the combined Markdown export to include a table of contents at the top, with links to each note heading using Markdown anchor syntax (e.g., `[Python Basics](#python-basics)`).

**Challenge 3 — Search by date range**
Add a `--from` and `--to` filter to the search function so users can find notes created or updated within a specific date range. Parse dates with `datetime.fromisoformat()`.

## Stretch Goals

- [ ] Add note categories (folders) in addition to tags
- [ ] Implement fuzzy search using `difflib.SequenceMatcher`
- [ ] Build a simple web interface with `flask` to view and edit notes in a browser
- [ ] Add Markdown preview rendering in the terminal using `rich`

## What You Learned

- Designing a data model with dictionaries and JSON for persistent storage
- Implementing full-text search across multiple fields with case-insensitive matching
- Building a flexible tag system with add, remove, filter, and count operations
- Creating, editing, and deleting structured records with proper validation
- Exporting data to Markdown files with safe filename generation
- Building a polished CLI with a menu loop, colored output, input validation, and error handling
