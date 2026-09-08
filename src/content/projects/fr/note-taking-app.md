---
title: "Application de prise de notes en Markdown"
description: "Une application de prise de notes en terminal avec recherche plein texte, tags, et export Markdown."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["cli", "file-io", "json", "search"]
prerequisites: ["Python basics (variables, loops, functions, dictionaries)", "Basic file I/O"]
---

# 📝 Application de prise de notes en Markdown

Construisez une application de prise de notes en terminal qui stocke les notes au format JSON, supporte la recherche plein texte, l'organisation par tags, et l'export en fichiers Markdown propres. Ce projet renforce la manipulation de dictionnaires, les entrées/sorties de fichiers, le traitement de chaînes, et la construction d'un CLI orienté utilisateur à partir de zéro.

## 🎯 Ce que vous allez faire

1. Concevoir un modèle de données pour les notes en utilisant des dictionnaires et la sérialisation JSON.
2. Implémenter une recherche plein texte sur plusieurs champs.
3. Construire un système de tags pour une organisation et un filtrage flexibles.
4. Créer un CLI à menu avec sortie colorée et validation des entrées.
5. Exporter des données structurées en fichiers Markdown pour le partage.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal recommandé — ce projet n'a besoin d'aucun package externe, donc la configuration est minimaliste. Les étapes 1 à 7 ci-dessous supposent ce chemin.

**GitHub Codespaces** fonctionne bien aussi : ouvrez [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et les mêmes commandes `uv` fonctionnent depuis un onglet de navigateur.

**Google Colab et les notebooks Kaggle** ne conviennent pas à ce projet — c'est une application CLI interactive qui nécessite un terminal persistant. Considérez-les comme inadaptés ici.

## Setup

```bash
uv init note-taking-app
cd note-taking-app
```

Aucun package externe n'est requis — l'application utilise uniquement la bibliothèque standard Python (`json`, `os`, `datetime`, `pathlib`).

## Étape 1 — Mettre en place la structure du projet

Chaque note a besoin d'une forme cohérente pour que le reste de l'application puisse compter sur les mêmes champs. Nous stockerons les notes comme une liste de dictionnaires dans un fichier JSON. Chaque note aura un champ `id`, `title`, `content`, `tags`, `created_at`, et `updated_at`.

Créez un fichier appelé `notes.py` et définissez le modèle de données et la couche de stockage :

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

**🎯 Résultat attendu :**

```
Data directory: /home/user/note-taking-app/data
Notes loaded: 0
Notes file: data/notes.json
```

**🩹 Si ça ne marche pas :**

- Si vous voyez un `FileNotFoundError`, vérifiez que `DATA_DIR.mkdir(exist_ok=True)` est appelé avant d'accéder au fichier.
- Si le chemin semble incorrect, assurez-vous d'exécuter le script depuis la racine du projet.

**✅ Liste de vérification**

- ✅ Le répertoire `data/` est créé automatiquement lors de l'exécution du script.
- ✅ `load_notes()` retourne une liste vide quand aucun fichier n'existe encore.
- ✅ `save_notes()` écrit un fichier JSON valide.

**🤔 Question(s) socratique(s)**

- Pourquoi stocker les notes en JSON plutôt qu'en texte brut ? Que perdriez-vous si chaque note était un fichier `.txt` séparé ?

---

## Étape 2 — Créer des notes

Maintenant que nous pouvons charger et sauvegarder, construisons la fonction qui crée une nouvelle note. Elle prend un titre, un contenu, et des tags optionnels, assigne un ID et des horodatages, et l'ajoute à la liste.

Ajoutez ceci à `notes.py` :

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

**🎯 Résultat attendu :**

```
Created note 1: Python List Comprehensions
Created note 2: Git Rebase vs Merge
Created note 3: Python Virtual Environments

Total notes: 3
```

Après l'exécution, inspectez `data/notes.json` — vous verrez les trois notes stockées avec des IDs, des tags, et des horodatages.

**🩹 Si ça ne marche pas :**

- Si les IDs ne sont pas séquentiels, vérifiez que `load_notes()` lit la liste courante avant de générer le prochain ID.
- Les tags devraient être en minuscules — si vous voyez de la casse mixte, la compréhension de liste dans `create_note` ne s'exécute pas.

**✅ Liste de vérification**

- ✅ Chaque note reçoit un ID unique et croissant.
- ✅ Les tags sont normalisés en minuscules et dépouillés des espaces.
- ✅ `created_at` et `updated_at` sont définis sur des horodatages UTC au format ISO.
- ✅ Les notes persistent dans `data/notes.json` après l'arrêt du script.

**🤔 Question(s) socratique(s)**

- Que se passe-t-il si deux utilisateurs créent des notes en même temps ? Comment pourriez-vous rendre les IDs plus robustes ?

---

## Étape 3 — Lister et rechercher des notes

Une application de prise de notes est inutile si vous ne trouvez rien. Nous implémenterons deux choses : lister toutes les notes dans un format lisible, et une recherche plein texte qui correspond à la fois aux titres et au contenu.

Ajoutez ces fonctions à `notes.py` :

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

**🎯 Résultat attendu :**

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

**🩹 Si ça ne marche pas :**

- Si la recherche ne retourne rien pour "python", vérifiez que `query_lower` est comparé à `note["title"].lassement` — la sensibilité à la casse est le coupable habituel.
- Si les colonnes du tableau sont mal alignées, assurez-vous que les spécificateurs de largeur de f-string (`:<4`, `:<35`, etc.) correspondent aux largeurs des en-têtes.

**✅ Liste de vérification**

- ✅ `list_notes()` affiche toutes les notes triées par mise à jour la plus récente.
- ✅ `search_notes()` retourne les notes correspondant à la requête dans le titre ou le contenu.
- ✅ La recherche insensible à la casse fonctionne pour les correspondances partielles.
- ✅ Les résultats de recherche affichent un aperçu du contenu tronqué à 80 caractères.

**🤔 Question(s) socratique(s)**

- Comment étendriez-vous la recherche pour correspondre aussi aux tags ? Et pour rechercher les notes créées cette semaine ?

---

## Étape 4 — Organiser avec des tags

Les tags vous permettent de regrouper des catégories sans catégories rigides. Nous ajouterons des fonctions pour ajouter et supprimer des tags à des notes existantes, et pour filtrer la liste des notes par un tag spécifique.

Ajoutez ces fonctions à `notes.py` :

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

**🎯 Résultat attendu :**

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

**🩹 Si ça ne marche pas :**

- Si des tags en double apparaissent, vérifiez que la garde `if tag_clean not in note["tags"]` est en place avant l'ajout.
- Si `get_all_tags()` affiche des compteurs inattendus, vérifiez que `filter_by_tag` utilise la même normalisation `.lower()` que `add_tag_to_note`.

**✅ Liste de vérification**

- ✅ L'ajout d'un tag en double affiche un avertissement au lieu de le dupliquer.
- ✅ La suppression d'un tag met à jour `updated_at` et persiste le changement.
- ✅ `get_all_tags()` retourne un dictionnaire trié de compteurs d'utilisation des tags.
- ✅ `filter_by_tag()` retourne uniquement les notes contenant le tag exact.

**🤔 Question(s) socratique(s)**

- Comment implémenteriez-vous des tags imbriqués (par ex. `python/django` et `python/flask` sous un tag parent `python`) ?

---

## Étape 5 — Modifier et supprimer des notes

Les utilisateurs ont besoin de corriger des erreurs et de supprimer des notes obsolètes. Nous ajouterons des fonctions pour mettre à jour des champs spécifiques d'une note existante et pour supprimer des notes par ID.

Ajoutez ces fonctions à `notes.py` :

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

**🎯 Résultat attendu :**

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

**🩹 Si ça ne marche pas :**

- Si `edit_note` ne semble pas sauvegarder, vérifiez que vous passez `title=` et `content=` comme arguments de mot-clé — la fonction utilise `None` comme sentinelle pour ignorer les champs inchangés.
- Si `delete_note` dit « not found » mais la note existe, vérifiez que l'ID est un entier, pas une chaîne.

**✅ Liste de vérification**

- ✅ `edit_note()` met à jour uniquement les champs que vous passez, laissant les autres inchangés.
- ✅ `edit_note()` met à jour l'horodatage `updated_at`.
- ✅ `delete_note()` supprime la note du fichier JSON et confirme la suppression.
- ✅ `get_note_by_id()` retourne `None` pour les IDs inexistants.

**🤔 Question(s) socratique(s)**

- Comment pourriez-vous implémenter un « annuler » pour la suppression ? Quelles données devriez-vous conserver ?

---

## Étape 6 — Exporter en Markdown

Les fichiers Markdown sont faciles à partager, à prévisualiser sur GitHub, ou à importer dans d'autres outils. Nous convertirons les notes en fichiers `.md` propres — un fichier par note, ou un seul document combiné.

Ajoutez ces fonctions à `notes.py` :

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

**🎯 Résultat attendu :**

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

**🩹 Si ça ne marche pas :**

- Si le fichier exporté est vide, vérifiez que `note["content"]` est une chaîne — une valeur `None` produirait silencieusement aucune sortie.
- Si `safe_title` contient des caractères étranges, ajoutez plus de remplacements : `note["title"].replace(":", "").replace("'", "")`.

**✅ Liste de vérification**

- ✅ Chaque fichier `.md` exporté a un en-tête, un bloc de métadonnées, et le contenu de la note.
- ✅ Les noms de fichiers sont sûrs pour tous les systèmes d'exploitation (pas de caractères spéciaux).
- ✅ L'export combiné produit un seul fichier `all-notes.md` avec toutes les notes séparées par des lignes horizontales.
- ✅ Le Markdown exporté s'affiche correctement dans n'importe quel afficheur Markdown.

**🤔 Question(s) socratique(s)**

- Comment ajoutereriez-vous une table des matières à l'export combiné avec des liens vers chaque en-tête de note ?

---

## Étape 7 — Peaufiner le CLI

La dernière étape réunit le tout avec une interface à menu. Nous ajouterons une sortie colorée en utilisant des codes ANSI, de la validation des entrées, et une gestion propre des erreurs pour que l'application soit polie.

Remplacez le bas de `notes.py` (ou ajoutez à un nouveau `main.py` et importez depuis `notes.py`) avec :

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

**🎯 Résultat attendu (session interactive) :**

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

**🩹 Si ça ne marche pas :**

- Si les couleurs n'apparaissent pas, votre terminal ne supporte peut-être pas les codes ANSI — essayez un terminal différent ou vérifiez que `$TERM` est défini sur `xterm-256color` ou similaire.
- Si la boucle d'entrée se bloque, vérifiez que `handle_create` sort correctement de la boucle de saisie du contenu sur deux lignes vides consécutives.
- Si `Ctrl+C` ne quitte pas proprement, le bloc `except KeyboardInterrupt` devrait le capturer.

**✅ Liste de vérification**

- ✅ Le menu s'affiche avec des options numérotées et du texte coloré.
- ✅ Une entrée invalide affiche une erreur et réaffiche le menu.
- ✅ Chaque option du menu appelle la bonne fonction de gestionnaire.
- ✅ Ctrl+C quitte l'application gracieusement sans traceback.
- ✅ L'application boucle jusqu'à ce que l'utilisateur choisisse l'option 0.

**🤔 Question(s) socratique(s)**

- Comment ajoutereriez-vous des arguments de ligne de commande pour que les utilisateurs puissent exécuter `python notes.py search "python"` sans entrer dans le menu interactif ?

---

## 🧩 Défis

**Défi 1 — Épinglage des notes**
Ajoutez un champ booléen `pinned` à chaque note. Lors du listage, les notes épinglées apparaissent toujours en haut quel que soit l'ordre de tri.

**Défi 2 — Export complet avec table des matières**
Étendez l'export Markdown combiné pour inclure une table des matières en haut, avec des liens vers chaque en-tête de note en utilisant la syntaxe d'ancre Markdown (par ex. `[Python Basics](#python-basics)`).

**Défi 3 — Recherche par plage de dates**
Ajoutez des filtres `--from` et `--to` à la fonction de recherche pour que les utilisateurs puissent trouver les notes créées ou mises à jour dans une plage de dates spécifique. Analysez les dates avec `datetime.fromisoformat()`.

## Objectifs avancés

- [ ] Ajouter des catégories de notes (dossiers) en plus des tags.
- [ ] Implémenter une recherche floue en utilisant `difflib.SequenceMatcher`.
- [ ] Construire une interface web simple avec `flask` pour visualiser et modifier des notes dans un navigateur.
- [ ] Ajouter un prévisualiseur Markdown dans le terminal en utilisant `rich`.

## Ce que vous avez appris

- Concevoir un modèle de données avec des dictionnaires et du JSON pour un stockage persistant.
- Implémenter une recherche plein texte sur plusieurs champs avec correspondance insensible à la casse.
- Construire un système de tags flexible avec des opérations d'ajout, de suppression, de filtrage, et de comptage.
- Créer, modifier, et supprimer des enregistrements structurés avec une validation appropriée.
- Exporter des données en fichiers Markdown avec génération de noms de fichiers sûrs.
- Construire un CLI poli avec une boucle de menu, une sortie colorée, de la validation des entrées, et de la gestion des erreurs.
