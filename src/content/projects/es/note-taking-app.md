---
title: 'App de Notas'
description: 'Crea una aplicación de notas en la terminal con búsqueda avanzada, etiquetas y exportación a múltiples formatos.'
difficulty: intermediate
estimatedMinutes: 120
learningObjectives:
  - Diseñar una arquitectura CLI robusta con manejo de comandos
  - Implementar persistencia de datos con SQLite
  - Crear un sistema de búsqueda full-text
  - Diseñar un sistema de etiquetas flexible
  - Implementar exportación a múltiples formatos
prerequisites:
  - Python a nivel intermedio
  - Conocimiento básico de SQL
  - familiaridad con argparse o click
  - Terminal yeditor de código
---

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo — ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/note-taking-app/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/note-taking-app/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fnote-taking-app%2Fnotebook.es.ipynb)

## 🎯 Lo que harás

Vas a construir una aplicación de notas en la terminal que permita crear, buscar, organizar y exportar notas de forma eficiente. La app usará SQLite para persistencia y tendrá una interfaz de comandos intuitiva.

**Objetivo principal:** Crear una herramienta CLI completa para gestión de notas con búsqueda avanzada y exportación.

**Tu app podrá:**

- **Crear y gestionar** notas con título, contenido y metadatos
- **Buscar** notas por contenido, etiquetas o fechas
- **Organizar** notas con etiquetas flexibles
- **Exportar** a Markdown, JSON y HTML
- **Persistir** datos de forma segura con SQLite

Pasos:

- Paso 1: Diseña la arquitectura del proyecto
- Paso 2: Implementa la capa de persistencia
- Paso 3: Crea los comandos de la CLI
- Paso 4: Implementa búsqueda y filtrado
- Paso 5: Agrega exportación a múltiples formatos
- Paso 6: Integra con Git para control de versiones
- Paso 7: Testing y documentación

Dónde ejecutar esto:

Trabaja desde la carpeta `projects/` de tu repo `pyda-course`.

## Configuración

1. Crea un entorno virtual:

```bash
cd projects/note-taking-app
uv venv
source .venv/bin/activate
```

2. Instala las dependencias:

```bash
uv pip install click rich sqlite-utils
```

3. Verifica la instalación:

```bash
python -c "import click, rich; print('Dependencias listas')"
```

---

## Paso 1: Diseña la arquitectura del proyecto

Antes de escribir código, establece la estructura del proyecto y los componentes principales.

### 1.1 Crea la estructura de directorios

```bash
mkdir -p src tests data
```

### 1.2 Diseña el esquema de la base de datos

Crea `src/models.py`:

```python
import sqlite3
from datetime import datetime
from pathlib import Path

DATABASE_PATH = Path(__file__).parent.parent / "data" / "notes.db"

def init_db():
    """Inicializa la base de datos con el esquema necesario."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS note_tags (
            note_id INTEGER,
            tag_id INTEGER,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (note_id, tag_id)
        )
    """)

    # Índices para búsqueda rápida
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)")

    conn.commit()
    conn.close()

class Note:
    def __init__(self, id: int, title: str, content: str,
                 created_at: str, updated_at: str, tags: list[str] = None):
        self.id = id
        self.title = title
        self.content = content
        self.created_at = created_at
        self.updated_at = updated_at
        self.tags = tags or []

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "tags": self.tags,
        }

if __name__ == "__main__":
    init_db()
    print(f"Base de datos creada en {DATABASE_PATH}")
```

### Verifica

- La estructura de directorios se crea correctamente
- La base de datos se inicializa sin errores
- Las tablas e índices se crean correctamente

### Checklist

- [ ] Estructura de directorios creada
- [ ] Esquema de base de datos definido
- [ ] Tablas e índices creados correctamente
- [ ] Modelo Note con métodos de serialización

---

## Paso 2: Implementa la capa de persistencia

Ahora implementaremos las operaciones CRUD para notas y etiquetas.

### 2.1 Implementa el repositorio de notas

Crea `src/repository.py`:

```python
import sqlite3
from datetime import datetime
from models import DATABASE_PATH, Note, init_db

class NoteRepository:
    def __init__(self):
        init_db()
        self.conn = sqlite3.connect(DATABASE_PATH)
        self.conn.row_factory = sqlite3.Row

    def create(self, title: str, content: str, tags: list[str] = None) -> Note:
        """Crea una nueva nota."""
        cursor = self.conn.cursor()

        cursor.execute(
            "INSERT INTO notes (title, content) VALUES (?, ?)",
            (title, content)
        )
        note_id = cursor.lastrowid

        # Agregar etiquetas
        if tags:
            for tag_name in tags:
                self._add_tag_to_note(note_id, tag_name)

        self.conn.commit()
        return self.get_by_id(note_id)

    def get_by_id(self, note_id: int) -> Note | None:
        """Obtiene una nota por su ID."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        row = cursor.fetchone()

        if row is None:
            return None

        tags = self._get_tags_for_note(note_id)
        return Note(
            id=row["id"],
            title=row["title"],
            content=row["content"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            tags=tags,
        )

    def get_all(self) -> list[Note]:
        """Obtiene todas las notas."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM notes ORDER BY updated_at DESC")
        rows = cursor.fetchall()

        notes = []
        for row in rows:
            tags = self._get_tags_for_note(row["id"])
            notes.append(Note(
                id=row["id"],
                title=row["title"],
                content=row["content"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                tags=tags,
            ))
        return notes

    def update(self, note_id: int, title: str = None, content: str = None,
               tags: list[str] = None) -> Note | None:
        """Actualiza una nota existente."""
        cursor = self.conn.cursor()

        updates = []
        params = []

        if title is not None:
            updates.append("title = ?")
            params.append(title)
        if content is not None:
            updates.append("content = ?")
            params.append(content)

        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())

        params.append(note_id)

        cursor.execute(
            f"UPDATE notes SET {', '.join(updates)} WHERE id = ?",
            params
        )

        # Actualizar etiquetas
        if tags is not None:
            cursor.execute("DELETE FROM note_tags WHERE note_id = ?", (note_id,))
            for tag_name in tags:
                self._add_tag_to_note(note_id, tag_name)

        self.conn.commit()
        return self.get_by_id(note_id)

    def delete(self, note_id: int) -> bool:
        """Elimina una nota."""
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        self.conn.commit()
        return cursor.rowcount > 0

    def search(self, query: str) -> list[Note]:
        """Busca notas por título o contenido."""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM notes WHERE title LIKE ? OR content LIKE ?",
            (f"%{query}%", f"%{query}%")
        )
        rows = cursor.fetchall()

        notes = []
        for row in rows:
            tags = self._get_tags_for_note(row["id"])
            notes.append(Note(
                id=row["id"],
                title=row["title"],
                content=row["content"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                tags=tags,
            ))
        return notes

    def _add_tag_to_note(self, note_id: int, tag_name: str):
        """Agrega una etiqueta a una nota."""
        cursor = self.conn.cursor()

        # Crear etiqueta si no existe
        cursor.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,))
        cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
        tag_id = cursor.fetchone()["id"]

        # Vincular
        cursor.execute(
            "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)",
            (note_id, tag_id)
        )

    def _get_tags_for_note(self, note_id: int) -> list[str]:
        """Obtiene las etiquetas de una nota."""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT t.name FROM tags t
            JOIN note_tags nt ON t.id = nt.tag_id
            WHERE nt.note_id = ?
        """, (note_id,))
        return [row["name"] for row in cursor.fetchall()]

    def get_all_tags(self) -> list[str]:
        """Obtiene todas las etiquetas únicas."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT DISTINCT name FROM tags ORDER BY name")
        return [row["name"] for row in cursor.fetchall()]

    def close(self):
        """Cierra la conexión a la base de datos."""
        self.conn.close()
```

### Verifica

- Las operaciones CRUD funcionan correctamente
- Las etiquetas se crean y vinculan automáticamente
- La búsqueda retorna resultados relevantes

### Checklist

- [ ] `create` guarda notas con etiquetas
- [ ] `get_by_id` y `get_all` recuperan notas correctamente
- [ ] `update` modifica notas existentes
- [ ] `delete` elimina notas de forma segura
- [ ] `search` encuentra notas por título o contenido

---

## Paso 3: Crea los comandos de la CLI

Ahora implementaremos la interfaz de línea de comandos con Click.

### 3.1 Implementa la CLI principal

Crea `cli.py`:

```python
import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown
from src.repository import NoteRepository

console = Console()
repo = NoteRepository()

@click.group()
def cli():
    """📝 NoteApp - Gestión de notas en la terminal"""
    pass

@cli.command()
@click.argument("title")
@click.option("--content", "-c", default="", help="Contenido de la nota")
@click.option("--tags", "-t", multiple=True, help="Etiquetas")
def create(title: str, content: str, tags: tuple):
    """Crea una nueva nota."""
    note = repo.create(title, content, list(tags))
    console.print(f"[green]✓[/green] Nota creada: [bold]{note.title}[/bold] (ID: {note.id})")

@cli.command()
def list():
    """Lista todas las notas."""
    notes = repo.get_all()
    if not notes:
        console.print("[yellow]No hay notas[/yellow]")
        return

    table = Table(title="📝 Notas")
    table.add_column("ID", style="cyan", width=6)
    table.add_column("Título", style="bold")
    table.add_column("Etiquetas", style="green")
    table.add_column("Actualizado", style="dim")

    for note in notes:
        tags = ", ".join(note.tags) if note.tags else "-"
        updated = note.updated_at[:10]
        table.add_row(str(note.id), note.title, tags, updated)

    console.print(table)

@cli.command()
@click.argument("note_id", type=int)
def show(note_id: int):
    """Muestra el contenido de una nota."""
    note = repo.get_by_id(note_id)
    if note is None:
        console.print(f"[red]Nota {note_id} no encontrada[/red]")
        return

    console.print(Panel(
        Markdown(note.content) if note.content else "[dim]Sin contenido[/dim]",
        title=f"[bold]{note.title}[/bold]",
        subtitle=f"ID: {note.id} | Creado: {note.created_at[:10]} | Tags: {', '.join(note.tags) or '-'}",
    ))

@cli.command()
@click.argument("note_id", type=int)
@click.option("--title", "-t", help="Nuevo título")
@click.option("--content", "-c", help="Nuevo contenido")
@click.option("--tags", multiple=True, help="Nuevas etiquetas")
def update(note_id: int, title: str, content: str, tags: tuple):
    """Actualiza una nota existente."""
    note = repo.update(note_id, title, content, list(tags) if tags else None)
    if note:
        console.print(f"[green]✓[/green] Nota {note_id} actualizada")
    else:
        console.print(f"[red]Nota {note_id} no encontrada[/red]")

@cli.command()
@click.argument("note_id", type=int)
def delete(note_id: int):
    """Elimina una nota."""
    if repo.delete(note_id):
        console.print(f"[green]✓[/green] Nota {note_id} eliminada")
    else:
        console.print(f"[red]Nota {note_id} no encontrada[/red]")

@cli.command()
@click.argument("query")
def search(query: str):
    """Busca notas por contenido."""
    notes = repo.search(query)
    if not notes:
        console.print(f"[yellow]No se encontraron notas para '{query}'[/yellow]")
        return

    console.print(f"[bold]Resultados para '{query}':[/bold]")
    for note in notes:
        console.print(f"  [cyan]{note.id}[/cyan] - {note.title}")

@cli.command()
def tags():
    """Lista todas las etiquetas."""
    tags = repo.get_all_tags()
    if not tags:
        console.print("[yellow]No hay etiquetas[/yellow]")
        return

    console.print("[bold]Etiquetas:[/bold]")
    for tag in tags:
        console.print(f"  • {tag}")

if __name__ == "__main__":
    cli()
```

### 3.2 Agrega el punto de entrada

Crea `__init__.py` en `src/` (vacío) y actualiza `pyproject.toml` o crea un script de entrada:

```python
# note_app.py (en la raíz)
from cli import cli

if __name__ == "__main__":
    cli()
```

### Verifica

- Cada comando funciona correctamente
- Los mensajes son claros y formateados
- La CLI maneja errores de forma robusta

### Checklist

- [ ] `create` guarda notas con etiquetas
- [ ] `list` muestra todas las notas en tabla
- [ ] `show` muestra el contenido de una nota
- [ ] `update` modifica notas existentes
- [ ] `delete` elimina notas con confirmación
- [ ] `search` encuentra notas por contenido

---

## Paso 4: Implementa búsqueda y filtrado

Ahora mejoraremos el sistema de búsqueda con más opciones de filtrado.

### 4.1 Extiende el repositorio con búsqueda avanzada

```python
# Agregar al repositorio
def search_advanced(self, query: str = None, tags: list[str] = None,
                    date_from: str = None, date_to: str = None) -> list[Note]:
    """Búsqueda avanzada con múltiples filtros."""
    cursor = self.conn.cursor()

    conditions = []
    params = []

    if query:
        conditions.append("(title LIKE ? OR content LIKE ?)")
        params.extend([f"%{query}%", f"%{query}%"])

    if date_from:
        conditions.append("created_at >= ?")
        params.append(date_from)

    if date_to:
        conditions.append("created_at <= ?")
        params.append(date_to)

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    sql = f"SELECT DISTINCT n.* FROM notes n"
    if tags:
        sql += """
            JOIN note_tags nt ON n.id = nt.note_id
            JOIN tags t ON nt.tag_id = t.id
            WHERE t.name IN ({})
        """.format(", ".join("?" * len(tags)))
        params.extend(tags)

    sql += f" ORDER BY n.updated_at DESC"

    cursor.execute(sql, params)
    rows = cursor.fetchall()

    notes = []
    for row in rows:
        note_tags = self._get_tags_for_note(row["id"])
        notes.append(Note(
            id=row["id"],
            title=row["title"],
            content=row["content"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            tags=note_tags,
        ))
    return notes
```

### 4.2 Agrega comandos de búsqueda avanzada a la CLI

```python
@cli.command()
@click.option("--query", "-q", help="Buscar en título y contenido")
@click.option("--tags", "-t", multiple=True, help="Filtrar por etiquetas")
@click.option("--from-date", help="Desde fecha (YYYY-MM-DD)")
@click.option("--to-date", help="Hasta fecha (YYYY-MM-DD)")
def find(query: str, tags: tuple, from_date: str, to_date: str):
    """Búsqueda avanzada de notas."""
    notes = repo.search_advanced(
        query=query,
        tags=list(tags) if tags else None,
        date_from=from_date,
        date_to=to_date,
    )

    if not notes:
        console.print("[yellow]No se encontraron notas con esos filtros[/yellow]")
        return

    table = Table(title=f"🔍 Búsqueda ({len(notes)} resultados)")
    table.add_column("ID", style="cyan", width=6)
    table.add_column("Título", style="bold")
    table.add_column("Etiquetas", style="green")
    table.add_column("Creado", style="dim")

    for note in notes:
        tags_str = ", ".join(note.tags) if note.tags else "-"
        table.add_row(str(note.id), note.title, tags_str, note.created_at[:10])

    console.print(table)
```

### Verifica

- La búsqueda avanzada filtra por múltiples criterios
- Los resultados se muestran de forma clara
- Los filtros combinan correctamente

### Checklist

- [ ] `search_advanced` soporta filtros múltiples
- [ ] La búsqueda por etiquetas funciona correctamente
- [ ] Los filtros de fecha funcionan
- [ ] Los comandos de CLI reflejan las nuevas capacidades

---

## Paso 5: Agrega exportación a múltiples formatos

Las notas deben poder exportarse a diferentes formatos para uso externo.

### 5.1 Implementa exportadores

Crea `src/exporters.py`:

```python
import json
from pathlib import Path
from datetime import datetime
from models import Note

class MarkdownExporter:
    @staticmethod
    def export(notes: list[Note], output_path: str):
        """Exporta notas a Markdown."""
        content = f"# Notas exportadas\n\n"
        content += f"*Exportado: {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n\n"

        for note in notes:
            tags = f" | Tags: {', '.join(note.tags)}" if note.tags else ""
            content += f"## {note.title}\n\n"
            content += f"*Creado: {note.created_at[:10]}{tags}*\n\n"
            content += f"{note.content}\n\n---\n\n"

        Path(output_path).write_text(content, encoding="utf-8")
        return output_path

class JSONExporter:
    @staticmethod
    def export(notes: list[Note], output_path: str):
        """Exporta notas a JSON."""
        data = [note.to_dict() for note in notes]
        Path(output_path).write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
        return output_path

class HTMLExporter:
    @staticmethod
    def export(notes: list[Note], output_path: str):
        """Exporta notas a HTML."""
        html = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Notas</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .note { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .note h2 { margin-top: 0; color: #333; }
        .tags { color: #666; font-size: 0.9em; }
        .meta { color: #999; font-size: 0.8em; }
    </style>
</head>
<body>
    <h1>📝 Mis Notas</h1>
"""
        for note in notes:
            tags_html = f'<div class="tags">Tags: {", ".join(note.tags)}</div>' if note.tags else ""
            html += f"""
    <div class="note">
        <h2>{note.title}</h2>
        <div class="meta">Creado: {note.created_at[:10]}</div>
        {tags_html}
        <pre>{note.content}</pre>
    </div>
"""
        html += "</body></html>"

        Path(output_path).write_text(html, encoding="utf-8")
        return output_path

EXPORTERS = {
    "markdown": MarkdownExporter,
    "json": JSONExporter,
    "html": HTMLExporter,
}
```

### 5.2 Agrega comandos de exportación a la CLI

```python
@cli.command()
@click.argument("format", type=click.Choice(["markdown", "json", "html"]))
@click.option("--output", "-o", default=None, help="Archivo de salida")
@click.option("--tags", "-t", multiple=True, help="Exportar solo notas con estas etiquetas")
def export(format: str, output: str, tags: tuple):
    """Exporta notas a un formato específico."""
    from exporters import EXPORTERS

    # Obtener notas a exportar
    if tags:
        notes = repo.search_advanced(tags=list(tags))
    else:
        notes = repo.get_all()

    if not notes:
        console.print("[yellow]No hay notas para exportar[/yellow]")
        return

    # Generar nombre de archivo por defecto
    if output is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output = f"notas_export_{timestamp}.{format.split('_')[0]}"

    # Exportar
    exporter = EXPORTERS[format]()
    result = exporter.export(notes, output)

    console.print(f"[green]✓[/green] Notas exportadas a [bold]{result}[/bold]")
    console.print(f"  {len(notes)} notas exportadas en formato {format}")
```

### Verifica

- Cada exportador genera archivos válidos
- Los archivos se guardan en la ubicación correcta
- La exportación filtrada funciona correctamente

### Checklist

- [ ] `MarkdownExporter` genera archivos .md válidos
- [ ] `JSONExporter` genera JSON estructurado
- [ ] `HTMLExporter` genera HTML con estilos
- [ ] La exportación filtrada por etiquetas funciona

---

## Paso 6: Integra con Git para control de versiones

Agrega la posibilidad de versionar notas con Git.

### 6.1 Implementa el control de versiones

Crea `src/versioning.py`:

```python
import subprocess
from pathlib import Path
from datetime import datetime

class NoteVersioner:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.notes_dir = self.repo_path / "data"

    def init_git(self) -> bool:
        """Inicializa un repositorio Git para las notas."""
        try:
            subprocess.run(
                ["git", "init"],
                cwd=str(self.notes_dir),
                capture_output=True, check=True
            )

            # Crear .gitignore
            gitignore = self.notes_dir / ".gitignore"
            gitignore.write_text("__pycache__/\n*.pyc\n.DS_Store\n")

            # Commit inicial
            subprocess.run(
                ["git", "add", "."],
                cwd=str(self.notes_dir),
                capture_output=True, check=True
            )
            subprocess.run(
                ["git", "commit", "-m", "Initial commit"],
                cwd=str(self.notes_dir),
                capture_output=True, check=True
            )

            return True
        except subprocess.CalledProcessError:
            return False

    def save_snapshot(self, message: str = None) -> bool:
        """Guarda un snapshot de las notas."""
        try:
            subprocess.run(
                ["git", "add", "."],
                cwd=str(self.notes_dir),
                capture_output=True, check=True
            )

            if message is None:
                message = f"Notas actualizadas: {datetime.now().strftime('%Y-%m-%d %H:%M')}"

            subprocess.run(
                ["git", "commit", "-m", message],
                cwd=str(self.notes_dir),
                capture_output=True, check=True
            )

            return True
        except subprocess.CalledProcessError:
            return False

    def get_history(self, limit: int = 10) -> list[dict]:
        """Obtiene el historial de versiones."""
        try:
            result = subprocess.run(
                ["git", "log", f"--oneline", f"-{limit}"],
                cwd=str(self.notes_dir),
                capture_output=True, text=True, check=True
            )

            history = []
            for line in result.stdout.strip().split("\n"):
                if line:
                    parts = line.split(" ", 1)
                    history.append({
                        "hash": parts[0],
                        "message": parts[1] if len(parts) > 1 else "",
                    })
            return history
        except subprocess.CalledProcessError:
            return []
```

### 6.2 Agrega comandos de Git a la CLI

```python
@cli.command()
def git_init():
    """Inicializa Git para las notas."""
    from versioning import NoteVersioner
    versioner = NoteVersioner(str(Path(__file__).parent.parent))

    if versioner.init_git():
        console.print("[green]✓[/green] Repositorio Git inicializado")
    else:
        console.print("[red]Error al inicializar Git[/red]")

@cli.command()
@click.option("--message", "-m", default=None, help="Mensaje del commit")
def git_save(message: str):
    """Guarda un snapshot en Git."""
    from versioning import NoteVersioner
    versioner = NoteVersioner(str(Path(__file__).parent.parent))

    if versioner.save_snapshot(message):
        console.print("[green]✓[/green] Snapshot guardado")
    else:
        console.print("[red]Error al guardar snapshot[/red]")

@cli.command()
def git_log():
    """Muestra el historial de versiones."""
    from versioning import NoteVersioner
    versioner = NoteVersioner(str(Path(__file__).parent.parent))

    history = versioner.get_history()
    if not history:
        console.print("[yellow]No hay historial[/yellow]")
        return

    table = Table(title="Historial de Versiones")
    table.add_column("Hash", style="cyan")
    table.add_column("Mensaje")

    for entry in history:
        table.add_row(entry["hash"], entry["message"])

    console.print(table)
```

### Verifica

- Git se inicializa correctamente en el directorio de notas
- Los snapshots se guardan con mensajes descriptivos
- El historial se muestra correctamente

### Checklist

- [ ] `git_init` crea el repositorio Git
- [ ] `git_save` guarda snapshots atómicos
- [ ] `git_log` muestra el historial de versiones
- [ ] Los commits tienen mensajes descriptivos

---

## Paso 7: Testing y documentación

El último paso es agregar tests y documentación para garantizar la calidad.

### 7.1 Crea tests unitarios

Crea `tests/test_notes.py`:

```python
import pytest
from src.repository import NoteRepository
from models import Note, init_db

@pytest.fixture
def repo():
    """Fixture que crea un repositorio temporal."""
    import tempfile
    import os

    with tempfile.TemporaryDirectory() as tmpdir:
        os.environ["DATABASE_PATH"] = os.path.join(tmpdir, "test.db")
        r = NoteRepository()
        yield r
        r.close()

def test_create_note(repo):
    """Test de creación de notas."""
    note = repo.create("Test Title", "Test content", ["tag1", "tag2"])
    assert note.title == "Test Title"
    assert note.content == "Test content"
    assert "tag1" in note.tags
    assert "tag2" in note.tags

def test_get_note(repo):
    """Test de obtención de notas."""
    created = repo.create("Title", "Content")
    retrieved = repo.get_by_id(created.id)
    assert retrieved is not None
    assert retrieved.title == "Title"

def test_search_notes(repo):
    """Test de búsqueda de notas."""
    repo.create("Python Tips", "Aprende Python")
    repo.create("JavaScript Guide", "Guía de JavaScript")

    results = repo.search("Python")
    assert len(results) == 1
    assert results[0].title == "Python Tips"

def test_delete_note(repo):
    """Test de eliminación de notas."""
    note = repo.create("To Delete", "Content")
    assert repo.delete(note.id) is True
    assert repo.get_by_id(note.id) is None

def test_tags(repo):
    """Test de gestión de etiquetas."""
    repo.create("Note 1", "Content", ["python", "tips"])
    repo.create("Note 2", "Content", ["javascript"])

    tags = repo.get_all_tags()
    assert "python" in tags
    assert "javascript" in tags
```

### 7.2 Crea documentación

Crea `README.md`:

```markdown
# 📝 NoteApp

Aplicación de gestión de notas en la terminal con búsqueda avanzada y exportación.

## Instalación

```bash
cd projects/note-taking-app
uv venv
source .venv/bin/activate
uv pip install click rich
```

## Uso

```bash
# Crear nota
python cli.py create "Mi Nota" -c "Contenido" -t "python" -t "tips"

# Listar notas
python cli.py list

# Buscar
python cli.py search "Python"

# Búsqueda avanzada
python cli.py find -q "tips" -t "python" --from-date 2024-01-01

# Exportar
python cli.py export markdown -o notas.md
python cli.py export json -o notas.json
python cli.py export html -o notas.html

# Git
python cli.py git init
python cli.py git save -m "Mis primeras notas"
python cli.py git log
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `create` | Crea una nueva nota |
| `list` | Lista todas las notas |
| `show <id>` | Muestra el contenido de una nota |
| `update <id>` | Actualiza una nota existente |
| `delete <id>` | Elimina una nota |
| `search <query>` | Busca notas por contenido |
| `find` | Búsqueda avanzada con filtros |
| `tags` | Lista todas las etiquetas |
| `export` | Exporta notas a múltiples formatos |
| `git init` | Inicializa Git para las notas |
| `git save` | Guarda un snapshot |
| `git log` | Muestra historial de versiones |
```

### Verifica

- Los tests pasan correctamente
- La documentación es completa y clara
- La app funciona según lo documentado

### Checklist

- [ ] Tests unitarios cubren las operaciones principales
- [ ] La documentación incluye instalación y uso
- [ ] Los comandos están documentados con ejemplos
- [ ] La app funciona según lo documentado

---

## 🩹 Si sale mal

**Error de base de datos:**
Verifica que el directorio `data/` exista. La app lo crea automáticamente, pero puede fallar por permisos.

**Exportación no genera archivos:**
Verifica que tengas permisos de escritura en el directorio de salida. Prueba con una ruta absoluta.

**Git no funciona:**
Verifica que Git esté instalado y configurado. Ejecuta `git --version` para verificar.

---

## 🧠 Preguntas socráticas

- ¿Cómo escalarías esta app para manejar millones de notas?
- ¿Qué mejoras harías al sistema de búsqueda para hacerlo más rápido?
- ¿Cómo implementarías sincronización entre dispositivos?
- ¿Qué funcionalidades agregarías para hacer la app más productiva?

---

## 🎓 ¿Qué sigue?

Tu app de notas está lista. Ahora puedes:

- **Agregar sincronización**: Conectar con iCloud, Google Drive o Dropbox
- **Implementar colaboración**: Compartir notas con otros usuarios
- **Crear plugins**: Extender la app con funcionalidades adicionales
- **Integrar con otras apps**: Conectar con calendarios, tareas, etc.

Si quieres crear una app similar pero con interfaz web, revisa la skill de **Sentiment Dashboard** para aprender a construir dashboards interactivos.
