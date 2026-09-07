---
title: "Base de connaissances personnelle"
description: "Construis une base de connaissances consultable avec recherche en texte complet, tags, et notes en Markdown."
difficulty: beginner
---

# Base de connaissances personnelle

Construis une base de connaissances personnelle qui stocke des notes avec des métadonnées riches, te permet de chercher dans tout instantanément, organise les idées avec des tags, affiche le contenu avec Markdown, et exporte le tout en un site HTML statique. Ce projet assemble des dictionnaires, des entrées/sorties fichiers, du traitement de chaînes, et de la génération de templates en un outil que tu peux réellement utiliser.

## Ce que tu vas apprendre

1. Concevoir un schéma pour le stockage de connaissances avec des dictionnaires et JSON
2. Implémenter la recherche en texte complet sur tout le contenu des notes
3. Construire un système de tags pour une organisation flexible
4. Prendre en charge l'affichage de Markdown dans le terminal
5. Exporter la base de connaissances en un site HTML statique

## Ce que tu vas construire

Une base de connaissances personnelle qui te permet de :

- **Stocker des notes** avec titre, contenu, tags, et horodatages en JSON sur le disque
- **Recherche en texte complet** sur tout le contenu des notes avec correspondance insensible à la casse
- **Filtrer par tags** et plages de dates pour trouver exactement ce dont tu as besoin
- **Afficher du Markdown** avec coloration syntaxique dans le terminal
- **Exporter en HTML** — un seul site statique que tu peux ouvrir dans n'importe quel navigateur

## Configuration

```bash
uv init knowledge-base
cd knowledge-base
```

Aucun paquet externe nécessaire — l'application utilise uniquement la bibliothèque standard de Python (`json`, `os`, `datetime`, `pathlib`, `html`).

## Étape 1 — Concevoir le modèle de données

Chaque note a besoin d'une forme cohérente pour que le reste de l'application puisse compter sur les mêmes champs. Nous stockerons les notes comme une liste de dictionnaires dans un fichier JSON. Chaque note aura un champ `id`, `title`, `content`, `tags`, `created_at`, et `updated_at`.

Crée un fichier appelé `knowledge.py` et définit le modèle de données et la couche de stockage :

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

**🎯 Résultat attendu :**

```
Data directory: /home/user/knowledge-base/data
Notes loaded: 0
Notes file: data/knowledge.json
```

**🩹 Si ça ne marche pas :**

- Si tu vois un `FileNotFoundError`, vérifie que `DATA_DIR.mkdir(exist_ok=True)` est appelé avant d'accéder au fichier.
- Si le chemin semble incorrect, assure-toi d'exécuter le script depuis la racine du projet.

**✅ Liste de vérification**

- ✅ Le répertoire `data/` est créé automatiquement quand le script s'exécute
- ✅ `load_notes()` retourne une liste vide quand aucun fichier n'existe encore
- ✅ `save_notes()` écrit un fichier JSON valide

**🤔 Question(s) socratique(s)**

- Pourquoi stocker les notes en JSON plutôt qu'en texte brut ? Que perdrais-tu si chaque note était un fichier `.txt` séparé ?

---

## Étape 2 — Ajouter et modifier des notes

Maintenant que nous pouvons charger et sauvegarder, construisons la fonction qui crée une nouvelle note. Elle prend un titre, un contenu, et des tags optionnels, assigne un ID et des horodatages, et l'ajoute à la liste. Nous ajouterons aussi des fonctions pour modifier et supprimer des notes.

Ajoute ces fonctions à `knowledge.py` :

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

**🎯 Résultat attendu :**

```
Created note 1: Python List Comprehensions
Created note 2: Git Rebase vs Merge
Created note 3: Python Virtual Environments

Total notes: 3
  Updated note 2: Git: Rebase vs Merge
After edit: Git: Rebase vs Merge
```

**🩹 Si ça ne marche pas :**

- Si les IDs ne sont pas séquentiels, vérifie que `load_notes()` lit la liste courante avant de générer le prochain ID.
- Les tags doivent être en minuscules — si tu vois des majuscules/minuscules mélangées, la liste de compréhension dans `create_note` ne s'exécute pas.
- Si `edit_note` ne semble pas sauvegarder, vérifie que tu passes `title=` et `content=` comme arguments nommés.

**✅ Liste de vérification**

- ✅ Chaque note reçoit un ID unique et croissant
- ✅ Les tags sont normalisés en minuscules et débarrassés des espaces
- ✅ `created_at` et `updated_at` sont définis en horodatages UTC ISO
- ✅ `edit_note()` ne met à jour que les champs que tu passes, laissant les autres inchangés
- ✅ `delete_note()` supprime la note du fichier JSON et confirme la suppression

**🤔 Question(s) socratique(s)**

- Qu'arrive-t-il si deux utilisateurs créent des notes en même temps ? Comment rendrais-tu les IDs plus robustes ?

---

## Étape 3 — Recherche en texte complet

Une base de connaissances est inutile si tu ne trouves rien. Nous implémenterons une recherche en texte complet qui correspond aux titres et au contenu, plus une fonction pour lister toutes les notes dans un format lisible.

Ajoute ces fonctions à `knowledge.py` :

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

**🩹 Si ça ne marche pas :**

- Si la recherche ne retourne rien pour « python », vérifie que `query_lower` est comparé à `note["title"].lower()` — la sensibilité à la casse est le coupable habituel.
- Si les colonnes du tableau sont mal alignées, assure-toi que les spécificateurs de largeur f-string (`:<4`, `:<35`, etc.) correspondent aux largeurs des en-têtes.

**✅ Liste de vérification**

- ✅ `list_notes()` affiche toutes les notes triées par mise à jour la plus récente
- ✅ `search_notes()` retourne les notes correspondant à la requête dans le titre ou le contenu
- ✅ La recherche insensible à la casse fonctionne pour les correspondances partielles
- ✅ Les résultats de recherche affichent un aperçu du contenu tronqué à 80 caractères

**🤔 Question(s) socratique(s)**

- Comment étendrais-tu la recherche pour correspondre aussi aux tags ? Et pour chercher les notes créées cette semaine ?

---

## Étape 4 — Système de tags

Les tags te permettent de regrouper des notes sans catégories rigides. Nous ajouterons des fonctions pour ajouter et supprimer des tags des notes existantes, filtrer par tag, et compter l'utilisation des tags dans toute la base de connaissances.

Ajoute ces fonctions à `knowledge.py` :

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

Notes created today:
  [3] Python Virtual Environments
  [2] Git: Rebase vs Merge
  [1] Python List Comprehensions
```

**🩹 Si ça ne marche pas :**

- Si des tags en double apparaissent, vérifie que la garde `if tag_clean not in note["tags"]` est en place avant d'ajouter.
- Si `get_all_tags()` affiche des comptages inattendus, vérifie que `filter_by_tag` utilise la même normalisation `.lower()` que `add_tag_to_note`.

**✅ Liste de vérification**

- ✅ Ajouter un tag en double affiche un avertissement au lieu de le dupliquer
- ✅ Supprimer un tag met à jour `updated_at` et persiste le changement
- ✅ `get_all_tags()` retourne un dictionnaire trié de comptages d'utilisation de tags
- ✅ `filter_by_tag()` retourne uniquement les notes contenant le tag exact
- ✅ `filter_by_date_range()` retourne les notes dans la plage de dates ISO spécifiée

**🤔 Question(s) socratique(s)**

- Comment implémenterais-tu des tags imbriqués (par ex. `python/django` et `python/flask` sous un tag parent `python`) ?

---

## Étape 5 — Affichage de Markdown

La sortie du terminal est bien pour la navigation rapide, mais les notes contiennent souvent du formatage Markdown. Nous construirons un afficheur qui convertit le Markdown en sortie adaptée au terminal avec du gras, de l'italique, et du formatage de code en utilisant les codes d'échappement ANSI.

Ajoute ces fonctions à `knowledge.py` :

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

**🎯 Résultat attendu :**

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

(Note : Dans un vrai terminal, les codes de formatage s'affichent en gras, italique, et texte inversé. Le texte brut ci-dessus montre la structure.)

**🩹 Si ça ne marche pas :**

- Si les codes ANSI apparaissent comme des séquences d'échappement brutes, ton terminal ne les supporte peut-être pas — essaie `echo $TERM` et assure-toi qu'il est défini sur `xterm-256color` ou similaire.
- Si les titres ne sont pas mis en surbrillance, vérifie que l'expression régulière correspond à `# ` avec un espace après le dièse.
- Les appels `re.sub` traitent le gras avant l'italique — si tu inverses l'ordre, `**gras**` est partiellement consommé par le motif italique.

**✅ Liste de vérification**

- ✅ Les titres s'affichent en texte cyan gras
- ✅ Le gras (`**texte**`) s'affiche avec le code ANSI gras
- ✅ L'italique (`*texte*`) s'affiche avec le code ANSI italique
- ✅ Le code en ligne (`` `texte` ``) s'affiche avec des couleurs inversées
- ✅ `display_note_full()` affiche une note complète avec un en-tête de métadonnées

**🤔 Question(s) socratique(s)**

- Comment étendrais-tu cela pour gérer les blocs de code (``` ... ```) avec une couleur différente ? Et les liens ?

---

## Étape 6 — Export en HTML

Un site HTML statique te permet de parcourir ta base de connaissances dans n'importe quel navigateur, de la partager avec d'autres, ou de l'héberger sur GitHub Pages. Nous convertirons toutes les notes en un seul fichier HTML avec recherche, filtrage par tags, et navigation.

Ajoute ces fonctions à `knowledge.py` :

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

**🎯 Résultat attendu :**

```
Exported to: exports/index.html
File size: 4,218 bytes
```

Ouvre `exports/index.html` dans ton navigateur pour voir le site complet avec :
- Une barre de recherche qui filtre les notes en temps réel
- Des boutons de tags qui filtrent par sujet
- Des cartes de notes cliquables qui se développent pour afficher le contenu complet
- Un thème sombre avec une typographie épurée

**🩹 Si ça ne marche pas :**

- Si le fichier HTML est vide, vérifie que `notes_json` est interpolé correctement — la f-string doit utiliser des doubles accolades `{{` pour échapper les accolades littérales dans le JavaScript.
- Si la recherche ne fonctionne pas dans le navigateur, ouvre la console du navigateur (F12) et vérifie les erreurs JavaScript — le problème le plus courant est une accolade de fermeture manquante dans la fonction `renderNotes`.
- Si des caractères spéciaux cassent le HTML, vérifie que `escapeHtml()` est appelé sur tout le contenu généré par l'utilisateur avant de l'insérer dans le template.

**✅ Liste de vérification**

- ✅ `generate_html_site()` produit un fichier HTML valide dans `exports/index.html`
- ✅ Le fichier inclut une entrée de recherche qui filtre les notes en temps réel
- ✅ Les boutons de tags filtrent les notes par le tag sélectionné
- ✅ Cliquer sur une carte de note la développe pour afficher le contenu complet
- ✅ Les caractères spéciaux dans les titres et contenus des notes sont correctement échappés

**🤔 Question(s) socratique(s)**

- Comment ajouterais-tu un volet de table des matières qui lie chaque note ? Et un bouton « retour en haut » ?

---

## Étape 7 — Interface CLI

La dernière étape assemble le tout avec une interface à menu. Nous ajouterons une sortie colorée, de la validation d'entrées, et une gestion propre des erreurs.

Remplace le bas de `knowledge.py` (ou ajoute dans un nouveau `main.py` et importe depuis `knowledge.py`) avec :

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

**🎯 Résultat attendu (session interactive) :**

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

**🩹 Si ça ne marche pas :**

- Si les couleurs n'apparaissent pas, ton terminal ne supporte peut-être pas les codes ANSI — essaie un terminal différent ou vérifie que `$TERM` est défini sur `xterm-256color` ou similaire.
- Si la boucle d'entrée se bloque, vérifie que `handle_create` sort correctement de la boucle de saisie de contenu sur deux lignes vides consécutives.
- Si `Ctrl+C` ne sort pas proprement, le bloc `except KeyboardInterrupt` devrait le capturer.

**✅ Liste de vérification**

- ✅ Le menu s'affiche avec des options numérotées et du texte coloré
- ✅ Une entrée invalide affiche une erreur et réaffiche le menu
- ✅ Chaque option du menu appelle la bonne fonction de gestion
- ✅ Ctrl+C sort de l'application gracieusement sans trace d'erreur
- ✅ L'application boucle jusqu'à ce que l'utilisateur choisisse l'option 0
- ✅ L'export affiche le chemin complet file:// pour une ouverture facile dans le navigateur

**🤔 Question(s) socratique(s)**

- Comment ajouterais-tu des arguments de ligne de commande pour que les utilisateurs puissent exécuter `python knowledge.py search "python"` sans entrer dans le menu interactif ?

---

## 🧩 Défis

**Défi 1 — Épinglage de notes**
Ajoute un champ booléen `pinned` à chaque note. Lors du listage, les notes épinglées apparaissent toujours en premier quel que soit l'ordre de tri.

**Défi 2 — Recherche en texte complet avec surbrillance**
Étends la fonction de recherche pour mettre en surbrillance les termes correspondants dans les résultats. Enveloppe les correspondances dans un marqueur coloré (par ex. `[MATCH]terme[/MATCH]`) pour que les utilisateurs puissent voir exactement où la requête apparaît.

**Défi 3 — Sauvegarde et restauration**
Ajoute une fonction qui crée une sauvegarde horodatée de `knowledge.json` (par ex. `data/backup-20260906-143022.json`), et une fonction de restauration qui charge un fichier de sauvegarde dans la base de connaissances.

## Objectifs avancés

- [ ] Ajouter le liage de notes — détecte la syntaxe `[[Titre de la note]]` et crée des références cliquables entre les notes
- [ ] Implémenter la recherche floue avec `difflib.SequenceMatcher` pour une correspondance tolérante aux fautes de frappe
- [ ] Ajouter l'export Markdown (un fichier `.md` par note) en plus de l'export HTML
- [ ] Construire une interface web simple avec `flask` pour l'accès via navigateur
- [ ] Ajouter une file d'attente des notes récentes qui suit les 10 dernières notes consultées

## Ce que tu as appris

- Concevoir un modèle de données avec des dictionnaires et JSON pour le stockage persistant
- Implémenter la recherche en texte complet sur plusieurs champs avec correspondance insensible à la casse
- Construire un système de tags flexible avec des opérations d'ajout, suppression, filtrage, et comptage
- Afficher du Markdown dans le terminal avec des codes d'échappement ANSI
- Générer un site HTML statique avec du JavaScript intégré pour la recherche et le filtrage
- Construire un CLI soigné avec une boucle de menu, une sortie colorée, de la validation d'entrées, et de la gestion d'erreurs
