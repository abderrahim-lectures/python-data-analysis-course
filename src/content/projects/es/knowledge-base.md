---
title: 'Base de Conocimiento'
description: 'Construye una base de conocimiento personal que permita buscar y recuperar información de forma semántica usando embeddings.'
difficulty: intermediate
estimatedMinutes: 120
learningObjectives:
  - Entender los conceptos de embeddings y búsqueda semántica
  - Implementar un sistema de indexación de documentos
  - Crear un motor de búsqueda semántica con ChromaDB
  - Construir una interfaz de usuario para consultar la base de conocimiento
  - Gestionar la actualización y mantenimiento de documentos
prerequisites:
  - Python a nivel intermedio
  - Conocimientos básicos de NLP
  - familiaridad con ChromaDB o bases de datos vectoriales
  - Terminal yeditor de código
---

## 🎯 Lo que harás

Vas a construir una base de conocimiento personal que te permita almacenar documentos y buscar información de forma semántica. A diferencia de la búsqueda por palabras clave, tu sistema entenderá el *significado* de las consultas.

**Objetivo principal:** Crear un sistema que indexe documentos, genere embeddings y recupere información relevante basándose en el significado semántico.

**Tu sistema podrá:**

- **Indexar documentos** de diferentes formatos (texto, markdown)
- **Generar embeddings** para representar el significado semántico
- **Buscar información** usando consultas en lenguaje natural
- **Gestionar la actualización** y eliminación de documentos
- **Presentar resultados** en una interfaz limpia y funcional

Pasos:

- Paso 1: Configura el entorno del proyecto
- Paso 2: Implementa el sistema de embeddings
- Paso 3: Construye el motor de indexación
- Paso 4: Crea el motor de búsqueda semántica
- Paso 5: Implementa la gestión de documentos
- Paso 6: Construye la interfaz de usuario
- Paso 7: Optimiza y extiende el sistema

Dónde ejecutar esto:

Trabaja desde la carpeta `projects/` de tu repo `pyda-course`.

## Configuración

1. Crea un entorno virtual:

```bash
cd projects/knowledge-base
uv venv
source .venv/bin/activate
```

2. Instala las dependencias:

```bash
uv pip install chromadb sentence-transformers rich
```

3. Verifica la instalación:

```bash
python -c "import chromadb; print('ChromaDB listo')"
```

---

## Paso 1: Configura el entorno del proyecto

Establece la estructura base del proyecto y configura los parámetros iniciales.

### 1.1 Crea la estructura de directorios

```bash
mkdir -p data indexes logs
```

### 1.2 Crea el archivo de configuración

Crea `config.py`:

```python
from pathlib import Path

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
INDEX_DIR = BASE_DIR / "indexes"
LOGS_DIR = BASE_DIR / "logs"

# Configuración del modelo de embeddings
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHROMA_PERSIST_DIR = str(INDEX_DIR / "chroma_db")

# Configuración de búsqueda
DEFAULT_TOP_K = 5
SIMILARITY_THRESHOLD = 0.3

# Configuración de documentos
SUPPORTED_FORMATS = [".txt", ".md", ".py", ".json"]
MAX_FILE_SIZE_MB = 10
```

### Verifica

- Los directorios se crean correctamente
- `config.py` carga sin errores
- Las rutas son consistentes

### Checklist

- [ ] Estructura de directorios creada
- [ ] Configuración del modelo de embeddings definida
- [ ] Parámetros de búsqueda configurados

---

## Paso 2: Implementa el sistema de embeddings

Los embeddings son la representación vectorial del significado semántico. Este paso crea la capa que convierte texto en vectores.

### 2.1 Crea el generador de embeddings

Crea `embeddings.py`:

```python
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

class EmbeddingGenerator:
    def __init__(self, model_name: str = EMBEDDING_MODEL):
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()

    def generate(self, texts: list[str]) -> list[list[float]]:
        """Genera embeddings para una lista de textos."""
        embeddings = self.model.encode(texts, show_progress_bar=True)
        return embeddings.tolist()

    def generate_single(self, text: str) -> list[float]:
        """Genera embedding para un solo texto."""
        return self.generate([text])[0]

    def get_dimension(self) -> int:
        """Retorna la dimensión de los embeddings."""
        return self.dimension
```

### 2.2 Verifica que los embeddings funcionen

```python
if __name__ == "__main__":
    generator = EmbeddingGenerator()
    texts = ["Python es un lenguaje de programación", "Machine Learning con scikit-learn"]
    embeddings = generator.generate(texts)

    print(f"Dimensión: {generator.get_dimension()}")
    print(f"Embeddings generados: {len(embeddings)}")
    print(f"Cada embedding tiene {len(embeddings[0])} dimensiones")
```

### Verifica

- Los embeddings se generan correctamente
- La dimensión coincide con el modelo seleccionado
- Los vectores son consistentes para textos similares

### Checklist

- [ ] `EmbeddingGenerator` carga el modelo correctamente
- [ ] Los embeddings tienen la dimensión correcta
- [ ] Textos similares generan embeddings cercanos
- [ ] El generador funciona con un solo texto y con listas

---

## Paso 3: Construye el motor de indexación

Ahora necesitamos un sistema que tome documentos, los divida en fragmentos y los almacene en ChromaDB.

### 3.1 Implementa el chunker de documentos

Crea `indexer.py`:

```python
from pathlib import Path
from config import SUPPORTED_FORMATS, MAX_FILE_SIZE_MB

class DocumentChunker:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def read_file(self, filepath: str) -> str | None:
        """Lee un archivo y retorna su contenido."""
        path = Path(filepath)

        if not path.exists():
            print(f"Archivo no encontrado: {filepath}")
            return None

        if path.suffix not in SUPPORTED_FORMATS:
            print(f"Formato no soportado: {path.suffix}")
            return None

        if path.stat().st_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            print(f"Archivo demasiado grande: {path.stat().st_size / 1024 / 1024:.1f}MB")
            return None

        return path.read_text(encoding="utf-8")

    def chunk_text(self, text: str) -> list[dict]:
        """Divide el texto en fragmentos con overlap."""
        chunks = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size
            chunk = text[start:end]

            chunks.append({
                "text": chunk,
                "start": start,
                "end": min(end, len(text)),
            })

            start = end - self.chunk_overlap
            if start >= len(text):
                break

        return chunks

    def process_file(self, filepath: str) -> list[dict]:
        """Procesa un archivo completo y retorna fragmentos."""
        content = self.read_file(filepath)
        if content is None:
            return []

        chunks = self.chunk_text(content)
        for chunk in chunks:
            chunk["source"] = filepath
            chunk["filename"] = Path(filepath).name

        return chunks
```

### 3.2 Implementa el indexador con ChromaDB

```python
import chromadb
from chromadb.config import Settings
from embeddings import EmbeddingGenerator
from config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL

class KnowledgeBaseIndexer:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        self.collection = self.client.get_or_create_collection(
            name="knowledge_base",
            metadata={"hnsw:space": "cosine"},
        )
        self.chunker = DocumentChunker()
        self.embedding_generator = EmbeddingGenerator()

    def index_file(self, filepath: str) -> int:
        """Indexa un archivo en la base de conocimiento."""
        chunks = self.chunker.process_file(filepath)
        if not chunks:
            return 0

        texts = [c["text"] for c in chunks]
        embeddings = self.embedding_generator.generate(texts)

        ids = [f"{Path(filepath).stem}_{i}" for i in range(len(chunks))]
        metadatas = [
            {"source": c["source"], "filename": c["filename"],
             "start": c["start"], "end": c["end"]}
            for c in chunks
        ]

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )

        return len(chunks)

    def index_directory(self, dirpath: str) -> int:
        """Indexa todos los archivos soportados en un directorio."""
        total_chunks = 0
        path = Path(dirpath)

        for filepath in path.rglob("*"):
            if filepath.is_file() and filepath.suffix in SUPPORTED_FORMATS:
                chunks = self.index_file(str(filepath))
                total_chunks += chunks
                print(f"Indexado {filepath.name}: {chunks} fragmentos")

        return total_chunks

    def get_stats(self) -> dict:
        """Retorna estadísticas de la base de conocimiento."""
        count = self.collection.count()
        return {
            "total_chunks": count,
            "collection": self.collection.name,
            "persist_directory": CHROMA_PERSIST_DIR,
        }
```

### Verifica

- Los documentos se dividen correctamente en fragmentos
- ChromaDB almacena los fragmentos con sus embeddings
- Las estadísticas muestran el conteo correcto

### Checklist

- [ ] `DocumentChunker` lee y divide archivos correctamente
- [ ] Los fragmentos tienen metadatos útiles (fuente, posición)
- [ ] `KnowledgeBaseIndexer` almacena en ChromaDB
- [ ] La indexación funciona con archivos individuales y directorios

---

## Paso 4: Crea el motor de búsqueda semántica

Con los documentos indexados, necesitamos un motor que recupere información relevante basándose en consultas en lenguaje natural.

### 4.1 Implementa el buscador

Crea `search.py`:

```python
from embeddings import EmbeddingGenerator
from config import DEFAULT_TOP_K, SIMILARITY_THRESHOLD

class SemanticSearcher:
    def __init__(self, collection):
        self.collection = collection
        self.embedding_generator = EmbeddingGenerator()

    def search(self, query: str, top_k: int = DEFAULT_TOP_K) -> list[dict]:
        """Busca documentos relevantes para una consulta."""
        query_embedding = self.embedding_generator.generate_single(query)

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        formatted_results = []
        for i in range(len(results["ids"][0])):
            distance = results["distances"][0][i]
            similarity = 1 - distance  # Convertir distancia a similaridad

            if similarity >= SIMILARITY_THRESHOLD:
                formatted_results.append({
                    "id": results["ids"][0][i],
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "similarity": similarity,
                    "rank": i + 1,
                })

        return formatted_results

    def search_with_context(self, query: str, context_window: int = 2) -> list[dict]:
        """Busca y expande los resultados con contexto adicional."""
        results = self.search(query, top_k=3)

        expanded_results = []
        for result in results:
            all_chunks = self.collection.get(
                where={"source": result["metadata"]["source"]},
                include=["documents", "metadatas"],
            )

            # Encontrar chunks cercanos
            current_idx = None
            for i, doc_id in enumerate(all_chunks["ids"]):
                if doc_id == result["id"]:
                    current_idx = i
                    break

            if current_idx is not None:
                start = max(0, current_idx - context_window)
                end = min(len(all_chunks["ids"]), current_idx + context_window + 1)
                context_text = " ".join(all_chunks["documents"][start:end])
                result["context"] = context_text

            expanded_results.append(result)

        return expanded_results
```

### 4.2 Prueba el motor de búsqueda

```python
if __name__ == "__main__":
    from indexer import KnowledgeBaseIndexer

    indexer = KnowledgeBaseIndexer()
    searcher = SemanticSearcher(indexer.collection)

    queries = [
        "¿Cómo funciona Python?",
        "¿Qué es machine learning?",
    ]

    for query in queries:
        print(f"\nBuscando: {query}")
        results = searcher.search(query)
        for r in results:
            print(f"  [{r['similarity']:.3f}] {r['text'][:80]}...")
```

### Verifica

- Las consultas en lenguaje natural recuperan resultados relevantes
- Los scores de similaridad son significativos
- Los resultados incluyen metadatos útiles

### Checklist

- [ ] `SemanticSearcher` recupera resultados relevantes
- [ ] Los scores de similaridad son útiles
- [ ] `search_with_context` expande con contexto adicional
- [ ] Los metadatos se mantienen en los resultados

---

## Paso 5: Implementa la gestión de documentos

Un sistema de base de conocimiento necesita operaciones de CRUD completas.

### 5.1 Implementa las operaciones de gestión

Crea `management.py`:

```python
from pathlib import Path
from indexer import KnowledgeBaseIndexer
from config import SUPPORTED_FORMATS

class KnowledgeBaseManager:
    def __init__(self):
        self.indexer = KnowledgeBaseIndexer()

    def add_document(self, filepath: str) -> dict:
        """Agrega un documento a la base de conocimiento."""
        path = Path(filepath)

        if not path.exists():
            return {"success": False, "error": "Archivo no encontrado"}

        if path.suffix not in SUPPORTED_FORMATS:
            return {"success": False, "error": f"Formato no soportado: {path.suffix}"}

        chunks = self.indexer.index_file(filepath)
        return {
            "success": True,
            "filename": path.name,
            "chunks_indexed": chunks,
        }

    def remove_document(self, filename: str) -> dict:
        """Elimina un documento de la base de conocimiento."""
        try:
            # Buscar todos los chunks del archivo
            results = self.indexer.collection.get(
                where={"filename": filename},
                include=["metadatas"],
            )

            if not results["ids"]:
                return {"success": False, "error": "Documento no encontrado"}

            # Eliminar chunks
            self.indexer.collection.delete(ids=results["ids"])
            return {
                "success": True,
                "filename": filename,
                "chunks_removed": len(results["ids"]),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def list_documents(self) -> list[dict]:
        """Lista todos los documentos indexados."""
        all_data = self.indexer.collection.get(include=["metadatas"])

        documents = {}
        for metadata in all_data["metadatas"]:
            filename = metadata.get("filename", "unknown")
            if filename not in documents:
                documents[filename] = {
                    "filename": filename,
                    "source": metadata.get("source"),
                    "chunks": 0,
                }
            documents[filename]["chunks"] += 1

        return list(documents.values())

    def get_stats(self) -> dict:
        """Retorna estadísticas de la base de conocimiento."""
        stats = self.indexer.get_stats()
        stats["documents"] = len(self.list_documents())
        return stats
```

### Verifica

- Se pueden agregar documentos individuales
- La eliminación funciona correctamente
- El listado muestra todos los documentos indexados

### Checklist

- [ ] `add_document` indexa archivos correctamente
- [ ] `remove_document` elimina todos los chunks de un archivo
- [ ] `list_documents` muestra documentos con conteo de chunks
- [ ] Las operaciones son atómicas y consistentes

---

## Paso 6: Construye la interfaz de usuario

Ahora necesitamos una interfaz para interactuar con la base de conocimiento de forma cómoda.

### 6.1 Crea la interfaz de terminal

Crea `ui.py`:

```python
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt
from management import KnowledgeBaseManager
from search import SemanticSearcher

console = Console()

def display_results(results: list[dict]):
    """Muestra los resultados de búsqueda de forma formateada."""
    if not results:
        console.print("[yellow]No se encontraron resultados[/yellow]")
        return

    table = Table(title="Resultados de Búsqueda")
    table.add_column("Rank", style="cyan", width=6)
    table.add_column("Similitud", style="green", width=10)
    table.add_column("Fuente", style="magenta", width=20)
    table.add_column("Contenido", width=60)

    for result in results:
        table.add_row(
            str(result["rank"]),
            f"{result['similarity']:.3f}",
            result["metadata"].get("filename", "N/A"),
            result["text"][:100] + "...",
        )

    console.print(table)

def search_mode(manager: KnowledgeBaseManager):
    """Modo de búsqueda interactiva."""
    searcher = SemanticSearcher(manager.indexer.collection)

    console.print("\n[bold]Modo de Búsqueda[/bold] (escribe 'salir' para terminar)\n")

    while True:
        query = Prompt.ask("🔍 Buscar")

        if query.lower() in ["salir", "exit", "quit"]:
            break

        results = searcher.search_with_context(query)
        display_results(results)

def manage_mode(manager: KnowledgeBaseManager):
    """Modo de gestión de documentos."""
    console.print("\n[bold]Modo de Gestión[/bold]")
    console.print("Comandos: agregar <archivo>, listar, eliminar <archivo>, stats, salir\n")

    while True:
        command = Prompt.ask("📁 Comando")

        if command.lower() in ["salir", "exit", "quit"]:
            break

        parts = command.split(maxsplit=1)
        if not parts:
            continue

        action = parts[0].lower()

        if action == "agregar" and len(parts) > 1:
            result = manager.add_document(parts[1])
            if result["success"]:
                console.print(f"[green]✓ {result['filename']}: {result['chunks_indexed']} fragmentos indexados[/green]")
            else:
                console.print(f"[red]✗ Error: {result['error']}[/red]")

        elif action == "eliminar" and len(parts) > 1:
            result = manager.remove_document(parts[1])
            if result["success"]:
                console.print(f"[green]✓ {result['filename']}: {result['chunks_removed']} fragmentos eliminados[/green]")
            else:
                console.print(f"[red]✗ Error: {result['error']}[/red]")

        elif action == "listar":
            docs = manager.list_documents()
            if docs:
                table = Table(title="Documentos Indexados")
                table.add_column("Archivo", style="cyan")
                table.add_column("Fragmentos", style="green")
                for doc in docs:
                    table.add_row(doc["filename"], str(doc["chunks"]))
                console.print(table)
            else:
                console.print("[yellow]No hay documentos indexados[/yellow]")

        elif action == "stats":
            stats = manager.get_stats()
            console.print(Panel(
                f"Documentos: {stats['documents']}\n"
                f"Fragmentos totales: {stats['total_chunks']}\n"
                f"Colección: {stats['collection']}",
                title="Estadísticas",
            ))

def main():
    manager = KnowledgeBaseManager()

    console.print(Panel.fit(
        "[bold]Base de Conocimiento Personal[/bold]\n"
        "Busca y gestiona documentos de forma semántica",
        border_style="blue",
    ))

    while True:
        console.print("\n[bold]Menú Principal[/bold]")
        console.print("1. Buscar información")
        console.print("2. Gestionar documentos")
        console.print("3. Salir")

        choice = Prompt.ask("Selecciona una opción", choices=["1", "2", "3"])

        if choice == "1":
            search_mode(manager)
        elif choice == "2":
            manage_mode(manager)
        elif choice == "3":
            console.print("[green]¡Hasta luego![/green]")
            break

if __name__ == "__main__":
    main()
```

### Verifica

- La interfaz muestra menús claros
- La búsqueda retorna resultados formateados
- La gestión de documentos funciona correctamente

### Checklist

- [ ] La interfaz es usable e intuitiva
- [ ] La búsqueda muestra resultados en tabla
- [ ] La gestión permite agregar, listar y eliminar
- [ ] Los mensajes de error son claros

---

## Paso 7: Optimiza y extiende el sistema

El último paso es mejorar el rendimiento y agregar funcionalidades avanzadas.

### 7.1 Optimiza la indexación

```python
import hashlib
from datetime import datetime

class IncrementalIndexer(KnowledgeBaseIndexer):
    def __init__(self):
        super().__init__()
        self.change_log = []

    def file_hash(self, filepath: str) -> str:
        """Calcula el hash de un archivo para detectar cambios."""
        content = Path(filepath).read_bytes()
        return hashlib.md5(content).hexdigest()

    def needs_reindexing(self, filepath: str) -> bool:
        """Verifica si un archivo necesita re-indexación."""
        current_hash = self.file_hash(filepath)

        # Buscar si ya está indexado
        results = self.collection.get(
            where={"source": filepath},
            include=["metadatas"],
        )

        if not results["ids"]:
            return True

        # Verificar si el hash cambió
        stored_hash = results["metadatas"][0].get("hash")
        return stored_hash != current_hash

    def reindex_if_needed(self, filepath: str) -> dict:
        """Re-indexa un archivo solo si ha cambiado."""
        if not self.needs_reindexing(filepath):
            return {"action": "skipped", "reason": "No changes detected"}

        # Eliminar versiones anteriores
        self.collection.delete(where={"source": filepath})

        # Re-indexar
        chunks = self.index_file(filepath)

        self.change_log.append({
            "timestamp": datetime.now().isoformat(),
            "file": filepath,
            "action": "reindexed",
            "chunks": chunks,
        })

        return {"action": "reindexed", "chunks": chunks}

    def sync_directory(self, dirpath: str) -> dict:
        """Sincroniza un directorio completo."""
        stats = {"indexed": 0, "skipped": 0, "errors": 0}

        for filepath in Path(dirpath).rglob("*"):
            if filepath.is_file() and filepath.suffix in SUPPORTED_FORMATS:
                try:
                    result = self.reindex_if_needed(str(filepath))
                    if result["action"] == "reindexed":
                        stats["indexed"] += 1
                    else:
                        stats["skipped"] += 1
                except Exception as e:
                    print(f"Error procesando {filepath}: {e}")
                    stats["errors"] += 1

        return stats
```

### 7.2 Agrega exportación de resultados

```python
import json
from datetime import datetime

def export_results(results: list[dict], query: str, output_dir: str):
    """Exporta los resultados de búsqueda a JSON."""
    output = {
        "query": query,
        "timestamp": datetime.now().isoformat(),
        "total_results": len(results),
        "results": results,
    }

    output_path = Path(output_dir) / f"search_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return output_path
```

### Verifica

- La indexación incremental solo procesa archivos modificados
- La sincronización funciona con directorios completos
- Los resultados se exportan correctamente

### Checklist

- [ ] `IncrementalIndexer` detecta cambios en archivos
- [ ] `sync_directory` procesa solo archivos modificados
- [ ] Los resultados se exportan a JSON
- [ ] El change log registra todas las operaciones

---

## 🩹 Si sale mal

**Error de memoria con ChromaDB:**
Si tienes muchos documentos, ChromaDB puede consumir mucha memoria. Usa `chromadb.PersistentClient` en lugar de `EphemeralClient` para persistir en disco.

**Los embeddings son lentos:**
El modelo `all-MiniLM-L6-v2` es rápido pero puede ser lento para muchos documentos. Considera usar un modelo más pequeño o procesar documentos en lotes.

**Los resultados de búsqueda no son relevantes:**
Verifica que los documentos estén bien indexados. Aumenta `chunk_size` para tener fragmentos más grandes con más contexto.

---

## 🧠 Preguntas socráticas

- ¿Cómo decidirías el tamaño de fragmento óptimo para tu tipo de documentos?
- ¿Qué estrategia usarías para indexar documentos que se actualizan frecuentemente?
- ¿Cómo manejarías documentos en múltiples idiomas?
- ¿Qué mejoras harías para escalar a millones de documentos?

---

## 🎓 ¿Qué sigue?

Tu base de conocimiento está lista. Ahora puedes:

- **Conectarla con Claude Code**: Crear una skill que consulte la base de conocimiento
- **Agregar más formatos**: PDFs, emails, notas de reuniones
- **Implementar RAG**: Combinar la búsqueda con generación de texto
- **Crear una API**: Servir la base de conocimiento como servicio web

Si quieres profundizar en RAG (Retrieval-Augmented Generation), revisa la skill de **RAG Notes** para aprender a combinar búsqueda semántica con generación de texto.
