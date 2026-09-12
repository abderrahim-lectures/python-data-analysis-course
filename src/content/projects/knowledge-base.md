---
title: "Personal Knowledge Base"
description: "Build a searchable knowledge base with full-text search, tagging, and Markdown notes."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["cli", "json", "search", "file-io"]
prerequisites: ["Python basics (variables, loops, functions, dictionaries)", "Basic file I/O"]
---

# Personal Knowledge Base

Build a personal knowledge base that stores notes with rich metadata, lets you search across everything instantly, organizes ideas with tags, renders content with Markdown, and exports the whole thing to a static HTML site. This project puts together dictionaries, file I/O, string processing, and template generation into a tool you can actually use.

- **Run it in your browser.** An interactive companion notebook is ready, open it in Colab, Kaggle, or Binder and follow along top-to-bottom.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-base/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-base/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fknowledge-base%2Fnotebook.ipynb)

## What You'll Learn

1. Design a schema for knowledge storage with dictionaries and JSON
2. Implement full-text search across all note content
3. Build a tagging system for flexible organization
4. Support Markdown rendering in the terminal
5. Export the knowledge base to a static HTML site

## What You'll Build

A personal knowledge base that lets you:

- **Store notes** with title, content, tags, and timestamps as JSON on disk
- **Full-text search** across all note content with case-insensitive matching
- **Filter by tags** and date ranges to find exactly what you need
- **Render Markdown** with syntax highlighting in the terminal
- **Export to HTML**, a single static site you can open in any browser

## Setup

```bash
uv init knowledge-base
cd knowledge-base
```

No external packages needed, the app uses only the Python standard library (`json`, `os`, `datetime`, `pathlib`, `html`).

## Step 1, Design the Data Model

Every note needs a consistent shape so the rest of the app can rely on the same fields. We'll store notes as a list of dictionaries in a JSON file. Each note will have an `id`, `title`, `content`, `tags`, `created_at`, and `updated_at` field.

Create a file called `knowledge.py` and define the data model and storage layer:

```python
import json
import os
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path("data")
KB_FILE = DATA_DIR / "knowledge.json"

def ensure_data_dir():
    """Create the data directory if it doesn't exist."""
    DATA_DIR.mkdir(exist_ok=True)

def load_notes() -> list[dict]:
    """Load all notes from the JSON file."""
    ensure_data_dir()
    if not KB_FILE.exists():
        return []
    with open(KB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_notes(notes: list[dict]) -> None:
    """Save all notes to the JSON file."""
    ensure_data_dir()
    with open(KB_FILE, "w", encoding="utf-8") as f:
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
print(f"Notes file: {KB_FILE}")
```

**🎯 Expected output:**

```
Data directory: /home/user/knowledge-base/data
Notes loaded: 0
Notes file: data/knowledge.json
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

## Step 2, Add and Edit Notes

Now that we can load and save, let's build the function that creates a new note. It takes a title, content, and optional tags, assigns an ID and timestamps, and appends it to the list. We'll also add functions to edit and delete notes.

Add these functions to `knowledge.py`:

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

# Test edit
edit_note(2, title="Git: Rebase vs Merge")

# Verify the edit
note = get_note_by_id(2)
print(f"After edit: {note['title']}")
```

**🎯 Expected output:**

```
Created note 1: Python List Comprehensions
Created note 2: Git Rebase vs Merge
Created note 3: Python Virtual Environments

Total notes: 3
  Updated note 2: Git: Rebase vs Merge
After edit: Git: Rebase vs Merge
```

**🩹 If it's off:**

- If IDs aren't sequential, check that `load_notes()` reads the current list before generating the next ID.
- Tags should be lowercase, if you see mixed case, the list comprehension in `create_note` isn't running.
- If `edit_note` doesn't seem to save, check that you're passing `title=` and `content=` as keyword arguments.

**✅ Checklist**

- ✅ Each note gets a unique, incrementing ID
- ✅ Tags are normalized to lowercase and stripped of whitespace
- ✅ `created_at` and `updated_at` are set to UTC ISO timestamps
- ✅ `edit_note()` updates only the fields you pass, leaving others unchanged
- ✅ `delete_note()` removes the note from the JSON file and confirms deletion

**🤔 Socratic Question(s)**

- What happens if two users create notes at the same time? How could you make IDs more robust?

---

## Step 3, Full-Text Search

A knowledge base is useless if you can't find anything. We'll implement full-text search that matches against both titles and content, plus a function to list all notes in a readable format.

Add these functions to `knowledge.py`:

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
  2    Git: Rebase vs Merge                git, workflow        2026-09-06
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

  [2] Git: Rebase vs Merge
      Tags: git, workflow
      Rebase rewrites commit history for a linear timeline. Merge preserves full bran...

--- Search: 'docker' ---
  No notes matching "docker"
```

**🩹 If it's off:**

- If search returns nothing for "python", check that `query_lower` is being compared to `note["title"].lower()`, case sensitivity is the usual culprit.
- If the table columns are misaligned, make sure the f-string width specifiers (`:<4`, `:<35`, etc.) match the header widths.

**✅ Checklist**

- ✅ `list_notes()` displays all notes sorted by most recently updated
- ✅ `search_notes()` returns notes matching the query in title or content
- ✅ Case-insensitive search works for partial matches
- ✅ Search results show a content preview truncated to 80 characters

**🤔 Socratic Question(s)**

- How would you extend the search to also match against tags? What about searching for notes created this week?

---

## Step 4, Tag System

Tags let you group notes without rigid categories. We'll add functions to add and remove tags from existing notes, filter by tag, and count tag usage across the whole knowledge base.

Add these functions to `knowledge.py`:

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

def filter_by_date_range(start: str, end: str) -> list[dict]:
    """Return notes created within the given date range (ISO format strings)."""
    notes = load_notes()
    return [
        note for note in notes
        if start <= note["created_at"][:10] <= end
    ]

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
note = get_note_by_id(1)
print(f"  {note['title']}: {note['tags']}")

# Test date filtering
print("\nNotes created today:")
today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
for note in filter_by_date_range(today, today):
    print(f"  [{note['id']}] {note['title']}")
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

Notes created today:
  [3] Python Virtual Environments
  [2] Git: Rebase vs Merge
  [1] Python List Comprehensions
```

**🩹 If it's off:**

- If duplicate tags appear, check that the `if tag_clean not in note["tags"]` guard is in place before appending.
- If `get_all_tags()` shows unexpected counts, verify that `filter_by_tag` uses the same `.lower()` normalization as `add_tag_to_note`.

**✅ Checklist**

- ✅ Adding a duplicate tag prints a warning instead of duplicating it
- ✅ Removing a tag updates `updated_at` and persists the change
- ✅ `get_all_tags()` returns a sorted dictionary of tag usage counts
- ✅ `filter_by_tag()` returns only notes containing the exact tag
- ✅ `filter_by_date_range()` returns notes within the specified ISO date range

**🤔 Socratic Question(s)**

- How would you implement nested tags (e.g., `python/django` and `python/flask` under a `python` parent)?

---

## Step 5, Markdown Rendering

Terminal output is fine for quick browsing, but notes often contain Markdown formatting. We'll build a renderer that converts Markdown to terminal-friendly output with bold, italic, and code formatting using ANSI escape codes.

Add these functions to `knowledge.py`:

```python
import re

BOLD = "\033[1m"
ITALIC = "\033[3m"
CODE = "\033[7m"
HEADING = "\033[1;36m"
RESET = "\033[0m"

def render_markdown_terminal(text: str) -> str:
    """Render basic Markdown to terminal with ANSI formatting."""
    lines = text.split("\n")
    rendered = []
    for line in lines:
        # Headings
        if line.startswith("### "):
            line = f"{HEADING}{line[4:]}{RESET}"
        elif line.startswith("## "):
            line = f"{HEADING}{line[3:]}{RESET}"
        elif line.startswith("# "):
            line = f"{HEADING}{line[2:]}{RESET}"
        # Bold: **text**
        line = re.sub(r"\*\*(.+?)\*\*", rf"{BOLD}\1{RESET}", line)
        # Italic: *text*
        line = re.sub(r"\*(.+?)\*", rf"{ITALIC}\1{RESET}", line)
        # Inline code: `text`
        line = re.sub(r"`(.+?)`", rf"{CODE}\1{RESET}", line)
        rendered.append(line)
    return "\n".join(rendered)

def display_note_full(note_id: int) -> None:
    """Display a single note with rendered Markdown."""
    note = get_note_by_id(note_id)
    if not note:
        print(f"  Note {note_id} not found")
        return

    tags_str = ", ".join(f"`{t}`" for t in note["tags"]) if note["tags"] else "None"
    created = note["created_at"][:10]
    updated = note["updated_at"][:10]

    print(f"\n  {'='*50}")
    print(f"  {BOLD}{note['title']}{RESET}")
    print(f"  Tags: {tags_str} | Created: {created} | Updated: {updated}")
    print(f"  {'-'*50}")
    print(render_markdown_terminal(note["content"]))
    print(f"  {'='*50}")

# Create a note with Markdown to test rendering
create_note(
    "Markdown Formatting Guide",
    "# Headers\n\nUse `#` for headers.\n\n## Bold and Italic\n\n**Bold text** and *italic text*.\n\n### Code\n\nUse `backticks` for inline code.\n\n- Item 1\n- Item 2\n- Item 3",
    tags=["reference", "markdown"]
)

# Display it with rendering
display_note_full(4)
```

**🎯 Expected output:**

```
  ==================================================
  Markdown Formatting Guide
  Tags: `reference`, `markdown` | Created: 2026-09-06 | Updated: 2026-09-06
  --------------------------------------------------
  Headers

  Use `#` for headers.

  Bold and Italic

  **Bold text** and *italic text*.

  Code

  Use `backticks` for inline code.

  - Item 1
  - Item 2
  - Item 3
  ==================================================
```

(Note: In a real terminal, the formatting codes render as bold, italic, and reversed text. The plain text above shows the structure.)

**🩹 If it's off:**

- If ANSI codes appear as raw escape sequences, your terminal might not support them, try `echo $TERM` and ensure it's set to `xterm-256color` or similar.
- If headings aren't highlighted, check that the regex matches `# ` with a space after the hash.
- The `re.sub` calls process bold before italic, if you swap the order, `**bold**` gets partially consumed by the italic pattern.

**✅ Checklist**

- ✅ Headings render with cyan bold text
- ✅ Bold (`**text**`) renders with ANSI bold code
- ✅ Italic (`*text*`) renders with ANSI italic code
- ✅ Inline code (`` `text` ``) renders with reversed colors
- ✅ `display_note_full()` shows a complete note with metadata header

**🤔 Socratic Question(s)**

- How would you extend this to handle code blocks (``` ... ```) with a different color? What about links?

---

## Step 6, Export to HTML

A static HTML site lets you browse your knowledge base in any browser, share it with others, or host it on GitHub Pages. We'll convert all notes to a single HTML file with search, tag filtering, and navigation.

Add these functions to `knowledge.py`:

```python
import html as html_module

EXPORT_DIR = Path("exports")

def generate_html_site() -> Path:
    """Export the entire knowledge base to a static HTML site."""
    notes = load_notes()
    EXPORT_DIR.mkdir(exist_ok=True)
    filepath = EXPORT_DIR / "index.html"

    all_tags = get_all_tags()
    tags_json = json.dumps(list(all_tags.keys()))
    notes_json = json.dumps(notes, ensure_ascii=False)

    tag_buttons = "\n".join(
        f'<button class="tag-btn" onclick="filterByTag(\'{tag}\')">{tag} ({count})</button>'
        for tag, count in all_tags.items()
    )

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Knowledge Base</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         background: #0d1117; color: #c9d1d9; line-height: 1.6; padding: 2rem; }}
  h1 {{ color: #58a6ff; margin-bottom: 0.5rem; }}
  .subtitle {{ color: #8b949e; margin-bottom: 2rem; }}
  .search-box {{ width: 100%; padding: 0.75rem 1rem; font-size: 1rem;
                 background: #161b22; border: 1px solid #30363d; border-radius: 6px;
                 color: #c9d1d9; margin-bottom: 1rem; }}
  .search-box:focus {{ outline: none; border-color: #58a6ff; }}
  .tags {{ display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }}
  .tag-btn {{ background: #21262d; color: #8b949e; border: 1px solid #30363d;
              padding: 0.35rem 0.75rem; border-radius: 20px; cursor: pointer;
              font-size: 0.85rem; transition: all 0.2s; }}
  .tag-btn:hover, .tag-btn.active {{ background: #1f6feb; color: #fff; border-color: #1f6feb; }}
  .note-card {{ background: #161b22; border: 1px solid #30363d; border-radius: 8px;
                padding: 1.25rem; margin-bottom: 1rem; cursor: pointer; transition: border-color 0.2s; }}
  .note-card:hover {{ border-color: #58a6ff; }}
  .note-title {{ color: #58a6ff; font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem; }}
  .note-meta {{ color: #8b949e; font-size: 0.8rem; margin-bottom: 0.5rem; }}
  .note-preview {{ color: #8b949e; font-size: 0.9rem; }}
  .note-content {{ display: none; margin-top: 1rem; padding-top: 1rem;
                   border-top: 1px solid #30363d; white-space: pre-wrap; color: #c9d1d9; }}
  .note-content.open {{ display: block; }}
  .note-tags {{ display: flex; gap: 0.4rem; margin-top: 0.75rem; }}
  .note-tag {{ background: #1f6feb22; color: #58a6ff; padding: 0.15rem 0.5rem;
               border-radius: 12px; font-size: 0.75rem; }}
  .count {{ color: #8b949e; font-size: 0.85rem; margin-bottom: 1rem; }}
  .no-results {{ color: #8b949e; text-align: center; padding: 2rem; }}
</style>
</head>
<body>
<h1>Knowledge Base</h1>
<p class="subtitle">Personal knowledge base with {len(notes)} notes</p>
<input type="text" class="search-box" id="searchInput" placeholder="Search notes..."
       oninput="searchNotes()">
<div class="tags">
  <button class="tag-btn active" onclick="filterByTag('all')">All</button>
  {tag_buttons}
</div>
<div class="count" id="resultCount">{len(notes)} note(s)</div>
<div id="notesContainer"></div>

<script>
const NOTES = {notes_json};
const ALL_TAGS = {tags_json};
let activeTag = 'all';

function renderNotes(notes) {{
  const container = document.getElementById('notesContainer');
  const count = document.getElementById('resultCount');
  if (notes.length === 0) {{
    container.innerHTML = '<div class="no-results">No notes found.</div>';
    count.textContent = '0 note(s)';
    return;
  }}
  count.textContent = notes.length + ' note(s)';
  container.innerHTML = notes.map(note => `
    <div class="note-card" onclick="this.querySelector('.note-content').classList.toggle('open')">
      <div class="note-title">${{escapeHtml(note.title)}}</div>
      <div class="note-meta">Created: ${{note.created_at.slice(0,10)}} | Updated: ${{note.updated_at.slice(0,10)}}</div>
      <div class="note-preview">${{escapeHtml(note.content.slice(0, 120))}}${{note.content.length > 120 ? '...' : ''}}</div>
      <div class="note-content">${{escapeHtml(note.content)}}</div>
      <div class="note-tags">${{note.tags.map(t => `<span class="note-tag">${{t}}</span>`).join('')}}</div>
    </div>
  `).join('');
}}

function escapeHtml(text) {{
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}}

function searchNotes() {{
  const query = document.getElementById('searchInput').value.toLowerCase();
  let filtered = NOTES;
  if (activeTag !== 'all') {{
    filtered = filtered.filter(n => n.tags.includes(activeTag));
  }}
  if (query) {{
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query) ||
      n.tags.some(t => t.includes(query))
    );
  }}
  renderNotes(filtered);
}}

function filterByTag(tag) {{
  activeTag = tag;
  document.querySelectorAll('.tag-btn').forEach(btn => {{
    btn.classList.toggle('active', btn.textContent.includes(tag) || (tag === 'all' && btn.textContent.includes('All')));
  }});
  searchNotes();
}}

renderNotes(NOTES);
</script>
</body>
</html>"""

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)
    return filepath

# Test HTML export
path = generate_html_site()
print(f"Exported to: {path}")
print(f"File size: {path.stat().st_size:,} bytes")
```

**🎯 Expected output:**

```
Exported to: exports/index.html
File size: 4,218 bytes
```

Open `exports/index.html` in your browser to see the full site with:
- A search bar that filters notes in real time
- Tag buttons that filter by topic
- Clickable note cards that expand to show full content
- Dark theme with clean typography

**🩹 If it's off:**

- If the HTML file is empty, check that `notes_json` is being interpolated correctly, the f-string must use double curly braces `{{` to escape literal braces in the JavaScript.
- If search doesn't work in the browser, open the browser console (F12) and check for JavaScript errors, the most common issue is a missing closing brace in the `renderNotes` function.
- If special characters break the HTML, verify that `escapeHtml()` is called on all user-generated content before inserting it into the template.

**✅ Checklist**

- ✅ `generate_html_site()` produces a valid HTML file at `exports/index.html`
- ✅ The file includes a search input that filters notes in real time
- ✅ Tag buttons filter notes by the selected tag
- ✅ Clicking a note card expands it to show full content
- ✅ Special characters in note titles and content are properly escaped

**🤔 Socratic Question(s)**

- How would you add a table of contents sidebar that links to each note? What about adding a "back to top" button?

---

## Step 7, CLI Interface

The final step ties everything together with a menu-driven interface. We'll add colored output, input validation, and clean error handling.

Replace the bottom of `knowledge.py` (or add to a new `main.py` and import from `knowledge.py`) with:

```python
GREEN = "\033[32m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
RED = "\033[31m"
BOLD = "\033[1m"

def colored(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"

def print_header():
    print(f"\n{colored('=' * 50, CYAN)}")
    print(colored("  🧠  Personal Knowledge Base", BOLD))
    print(colored('=' * 50, CYAN))

def print_menu():
    print(f"""
  {colored('1.', GREEN)} Create a new note
  {colored('2.', GREEN)} List all notes
  {colored('3.', GREEN)} Search notes
  {colored('4.', GREEN)} View a note (with Markdown rendering)
  {colored('5.', GREEN)} Add tag to a note
  {colored('6.', GREEN)} Remove tag from a note
  {colored('7.', GREEN)} Filter notes by tag
  {colored('8.', GREEN)} Edit a note
  {colored('9.', GREEN)} Delete a note
  {colored('10.', GREEN)} Export to HTML site
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

def handle_list():
    list_notes()

def handle_search():
    query = get_input("Search query")
    if query:
        display_search_results(query)

def handle_view():
    note_id = get_int("Note ID to view")
    if note_id is not None:
        display_note_full(note_id)

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
    path = generate_html_site()
    print(colored(f"  ✓ Exported to {path}", GREEN))
    print(colored(f"    Open in browser: file://{path.resolve()}", YELLOW))

HANDLERS = {
    1: handle_create,
    2: handle_list,
    3: handle_search,
    4: handle_view,
    5: handle_add_tag,
    6: handle_remove_tag,
    7: handle_filter_tag,
    8: handle_edit,
    9: handle_delete,
    10: handle_export,
}

def main():
    """Run the knowledge base app."""
    ensure_data_dir()
    print_header()

    while True:
        print_menu()
        choice = get_int("Choose an option")
        if choice == 0:
            print(colored("\n  Goodbye! 🧠\n", YELLOW))
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
  🧠  Personal Knowledge Base
==================================================

  1. Create a new note
  2. List all notes
  3. Search notes
  4. View a note (with Markdown rendering)
  5. Add tag to a note
  6. Remove tag from a note
  7. Filter notes by tag
  8. Edit a note
  9. Delete a note
  10. Export to HTML site
  0.  Exit

  Choose an option: 2

  ID   Title                               Tags                 Updated
  ---- ----------------------------------- -------------------- ------------
  4    Markdown Formatting Guide           reference, markdown  2026-09-06
  3    Python Virtual Environments         python, tools        2026-09-06
  2    Git: Rebase vs Merge                git, workflow        2026-09-06
  1    Python List Comprehensions          python, reference    2026-09-06

  4 note(s) total

  Choose an option: 0

  Goodbye! 🧠
```

**🩹 If it's off:**

- If colors don't appear, your terminal might not support ANSI codes, try a different terminal or check `$TERM` is set to `xterm-256color` or similar.
- If the input loop hangs, check that `handle_create` properly breaks out of the content input loop on two consecutive empty lines.
- If `Ctrl+C` doesn't exit cleanly, the `except KeyboardInterrupt` block should catch it.

**✅ Checklist**

- ✅ Menu displays with numbered options and colored text
- ✅ Invalid input prints an error and re-shows the menu
- ✅ Each menu option calls the correct handler function
- ✅ Ctrl+C exits the app gracefully without a traceback
- ✅ The app loops until the user chooses option 0
- ✅ Export prints the full file:// path for easy browser opening

**🤔 Socratic Question(s)**

- How would you add command-line arguments so users can run `python knowledge.py search "python"` without entering the interactive menu?

---

## 🧩 Challenges

**Challenge 1, Note pinning**
Add a `pinned` boolean field to each note. When listing, pinned notes always appear at the top regardless of sort order.

**Challenge 2, Full-text search with highlighting**
Extend the search function to highlight matching terms in the results. Wrap matches in a colored marker (e.g., `[MATCH]term[/MATCH]`) so users can see exactly where the query appears.

**Challenge 3, Backup and restore**
Add a function that creates a timestamped backup of `knowledge.json` (e.g., `data/backup-20260906-143022.json`), and a restore function that loads a backup file back into the knowledge base.

## Stretch Goals

- [ ] Add note linking, detect `[[Note Title]]` syntax and create clickable references between notes
- [ ] Implement fuzzy search using `difflib.SequenceMatcher` for typo-tolerant matching
- [ ] Add Markdown export (one `.md` file per note) alongside the HTML export
- [ ] Build a simple web interface with `flask` for browser-based access
- [ ] Add a recents queue that tracks the last 10 notes you viewed

## What You Learned

- Designing a data model with dictionaries and JSON for persistent storage
- Implementing full-text search across multiple fields with case-insensitive matching
- Building a flexible tag system with add, remove, filter, and count operations
- Rendering Markdown in the terminal with ANSI escape codes
- Generating a static HTML site with embedded JavaScript for search and filtering
- Building a polished CLI with a menu loop, colored output, input validation, and error handling
