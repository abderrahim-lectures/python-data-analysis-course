---
title: 'RAG con Notas'
description: 'Combina búsqueda semántica con generación de texto para crear un asistente que responda preguntas sobre tus notas personales.'
difficulty: advanced
estimatedMinutes: 150
learningObjectives:
  - Entender la arquitectura RAG (Retrieval-Augmented Generation)
  - Implementar un sistema de recuperación semántica con ChromaDB
  - Integrar modelos de lenguaje para generación de respuestas
  - Agregar memoria conversacional para contexto multi-turno
  - Conectar con Claude Code para uso en producción
prerequisites:
  - Python a nivel intermedio
  - Conocimientos básicos de embeddings y bases de datos vectoriales
  - familiaridad con LLMs y prompting
  - Acceso a una API de LLM (OpenAI, Anthropic o local)
---

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo — ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rag-notes/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rag-notes/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frag-notes%2Fnotebook.es.ipynb)

## 🎯 Lo que harás

Vas a construir un sistema RAG completo que combine la recuperación semántica de notas con generación de texto. Podrás hacer preguntas en lenguaje natural y recibir respuestas fundamentadas en tu contenido personal.

**Objetivo principal:** Crear un asistente que recupere notas relevantes y genere respuestas coherentes basadas en tu conocimiento personal.

**Tu sistema podrá:**

- **Indexar notas** con embeddings semánticos
- **Recuperar contexto** relevante para cada pregunta
- **Generar respuestas** fundamentadas en tus notas
- **Mantener contexto** conversacional multi-turno
- **Conectar con Claude** para uso en producción

Pasos:

- Paso 1: Diseña la arquitectura RAG
- Paso 2: Implementa el sistema de recuperación
- Paso 3: Agrega generación de respuestas con LLM
- Paso 4: Integra memoria conversacional

Dónde ejecutar esto:

Trabaja desde la carpeta `projects/` de tu repo `pyda-course`. Necesitas acceso a una API de LLM.

## Configuración

1. Crea un entorno virtual:

```bash
cd projects/rag-notes
uv venv
source .venv/bin/activate
```

2. Instala las dependencias:

```bash
uv pip install chromadb sentence-transformers openai rich
```

3. Configura tu API key:

```bash
export OPENAI_API_KEY="tu-api-key"
```

---

## Paso 1: Diseña la arquitectura RAG

RAG (Retrieval-Augmented Generation) es un patrón que combina recuperación de información con generación de texto. Primero busca contexto relevante, luego genera una respuesta basada en ese contexto.

### 1.1 Crea la estructura del proyecto

```bash
mkdir -p data indexes config
```

### 1.2 Crea el archivo de configuración

Crea `config/settings.py`:

```python
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
INDEX_DIR = BASE_DIR / "indexes"

# Configuración de embeddings
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Configuración de ChromaDB
CHROMA_PERSIST_DIR = str(INDEX_DIR / "chroma_db")
COLLECTION_NAME = "personal_notes"

# Configuración de LLM
LLM_MODEL = "gpt-3.5-turbo"
MAX_CONTEXT_LENGTH = 4000
TEMPERATURE = 0.7

# Configuración de recuperación
TOP_K_RESULTS = 5
SIMILARITY_THRESHOLD = 0.3
```

### 1.3 Diseña el esquema de notas

```python
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Note:
    id: str
    title: str
    content: str
    tags: list[str]
    created_at: datetime
    metadata: dict = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "tags": self.tags,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata or {},
        }
```

### Verifica

- La estructura del proyecto está configurada
- Los parámetros son consistentes
- El esquema de notas soporta metadatos flexibles

### Checklist

- [ ] Estructura de directorios creada
- [ ] Configuración del LLM definida
- [ ] Esquema de notas con soporte para metadatos
- [ ] Parámetros de recuperación configurados

---

## Paso 2: Implementa el sistema de recuperación

El sistema de recuperación es el corazón de RAG. Necesita indexar documentos y encontrar los más relevantes para cada consulta.

### 2.1 Crea el indexador de notas

Crea `retrieval/indexer.py`:

```python
import chromadb
from sentence_transformers import SentenceTransformer
from config.settings import (
    EMBEDDING_MODEL, CHROMA_PERSIST_DIR, COLLECTION_NAME
)

class NoteIndexer:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)

    def index_note(self, note) -> str:
        """Indexa una nota en la colección."""
        # Crear representación textual enriquecida
        text_representation = f"""
        Título: {note.title}
        Contenido: {note.content}
        Etiquetas: {', '.join(note.tags)}
        """

        # Generar embedding
        embedding = self.embedding_model.encode([text_representation])[0].tolist()

        # Almacenar en ChromaDB
        self.collection.add(
            ids=[note.id],
            embeddings=[embedding],
            documents=[text_representation],
            metadatas=[{
                "title": note.title,
                "tags": ",".join(note.tags),
                "created_at": note.created_at.isoformat(),
            }]
        )

        return note.id

    def index_multiple(self, notes: list) -> int:
        """Indexa múltiples notas."""
        count = 0
        for note in notes:
            self.index_note(note)
            count += 1
        return count

    def delete_note(self, note_id: str) -> bool:
        """Elimina una nota del índice."""
        try:
            self.collection.delete(ids=[note_id])
            return True
        except Exception:
            return False

    def get_stats(self) -> dict:
        """Retorna estadísticas del índice."""
        return {
            "total_notes": self.collection.count(),
            "collection": COLLECTION_NAME,
            "persist_directory": CHROMA_PERSIST_DIR,
        }
```

### 2.2 Crea el motor de recuperación

```python
from config.settings import TOP_K_RESULTS, SIMILARITY_THRESHOLD

class NoteRetriever:
    def __init__(self, indexer: NoteIndexer):
        self.indexer = indexer
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)

    def retrieve(self, query: str, top_k: int = TOP_K_RESULTS) -> list[dict]:
        """Recupera notas relevantes para una consulta."""
        # Generar embedding de la consulta
        query_embedding = self.embedding_model.encode([query])[0].tolist()

        # Buscar en ChromaDB
        results = self.indexer.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        # Formatear resultados
        retrieved = []
        for i in range(len(results["ids"][0])):
            distance = results["distances"][0][i]
            similarity = 1 - distance

            if similarity >= SIMILARITY_THRESHOLD:
                retrieved.append({
                    "id": results["ids"][0][i],
                    "content": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "similarity": similarity,
                    "rank": i + 1,
                })

        return retrieved

    def retrieve_with_context(self, query: str, context_window: int = 1) -> list[dict]:
        """Recupera notas con contexto expandido."""
        results = self.retrieve(query, top_k=3)

        expanded = []
        for result in results:
            # Buscar notas relacionadas
            related = self.retrieve(result["content"][:100], top_k=context_window + 1)
            result["related_notes"] = [r for r in related if r["id"] != result["id"]][:context_window]
            expanded.append(result)

        return expanded
```

### Verifica

- Las notas se indexan correctamente
- La recuperación retorna notas relevantes
- Los scores de similaridad son significativos

### Checklist

- [ ] `NoteIndexer` almacena notas con embeddings
- [ ] `NoteRetriever` recupera notas relevantes
- [ ] La búsqueda por similaridad funciona
- [ ] El contexto expandido incluye notas relacionadas

---

## Paso 3: Agrega generación de respuestas con LLM

Ahora conectaremos la recuperación con generación de texto para crear respuestas fundamentadas.

### 3.1 Implementa el generador de respuestas

Crea `generation/responder.py`:

```python
from openai import OpenAI
from config.settings import LLM_MODEL, MAX_CONTEXT_LENGTH, TEMPERATURE

class RAGResponder:
    def __init__(self, retriever):
        self.retriever = retriever
        self.client = OpenAI()
        self.conversation_history = []

    def build_prompt(self, query: str, context_notes: list[dict]) -> str:
        """Construye el prompt con contexto de las notas."""
        context_parts = []
        for note in context_notes:
            context_parts.append(f"""
Nota: {note['metadata'].get('title', 'Sin título')}
Contenido: {note['content'][:500]}
Similitud: {note['similarity']:.2f}
""")

        context = "\n".join(context_parts)

        # Agregar historial conversacional
        history = ""
        if self.conversation_history:
            history = "\n\nConversación previa:\n"
            for msg in self.conversation_history[-4:]:  # Últimos 4 mensajes
                role = "Usuario" if msg["role"] == "user" else "Asistente"
                history += f"{role}: {msg['content']}\n"

        prompt = f"""Eres un asistente personal inteligente que responde preguntas basándose en las notas del usuario.

Contexto de notas relevantes:
{context}
{history}

Pregunta del usuario: {query}

Instrucciones:
1. Responde SOLO usando la información de las notas proporcionadas
2. Si la información no está en las notas, di honestamente que no tienes esa información
3. Cita las fuentes cuando sea posible
4. Sé conciso y directo
5. Si la pregunta requiere información de múltiples notas, combínala coherentemente

Respuesta:"""

        return prompt

    def generate_response(self, query: str) -> dict:
        """Genera una respuesta usando RAG."""
        # Recuperar notas relevantes
        context_notes = self.retriever.retrieve_with_context(query)

        if not context_notes:
            return {
                "response": "No encontré notas relevantes para tu pregunta.",
                "sources": [],
                "query": query,
            }

        # Construir prompt
        prompt = self.build_prompt(query, context_notes)

        # Llamar al LLM
        response = self.client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=TEMPERATURE,
            max_tokens=1000,
        )

        answer = response.choices[0].message.content

        # Actualizar historial
        self.conversation_history.append({"role": "user", "content": query})
        self.conversation_history.append({"role": "assistant", "content": answer})

        return {
            "response": answer,
            "sources": [
                {
                    "title": n["metadata"].get("title", "Sin título"),
                    "similarity": n["similarity"],
                }
                for n in context_notes
            ],
            "query": query,
        }

    def clear_history(self):
        """Limpia el historial conversacional."""
        self.conversation_history = []
```

### 3.2 Prueba el sistema completo

```python
if __name__ == "__main__":
    from retrieval.indexer import NoteIndexer, NoteRetriever
    from models import Note
    from datetime import datetime

    # Indexar notas de ejemplo
    indexer = NoteIndexer()

    sample_notes = [
        Note(
            id="1",
            title="Aprendizaje de Python",
            content="Python es excelente para principiantes. Sus puntos fuertes incluyen sintaxis clara, gran ecosistema de librerías y comunidad activa.",
            tags=["python", "programación"],
            created_at=datetime.now(),
        ),
        Note(
            id="2",
            title="Ideas de Proyecto",
            content="Quiero crear una app de notas con búsqueda semántica. Usaría ChromaDB para embeddings y FastAPI para la API.",
            tags=["proyectos", "ideas"],
            created_at=datetime.now(),
        ),
    ]

    indexer.index_multiple(sample_notes)

    # Crear retriever y responder
    retriever = NoteRetriever(indexer)
    responder = RAGResponder(retriever)

    # Hacer una pregunta
    result = responder.generate_response("¿Qué tan bueno es Python para principiantes?")
    print(f"Respuesta: {result['response']}")
    print(f"Fuentes: {result['sources']}")
```

### Verifica

- Las respuestas se generan correctamente
- Las fuentes se citan en la respuesta
- El sistema maneja preguntas sin contexto relevante

### Checklist

- [ ] `RAGResponder` genera respuestas fundamentadas
- [ ] Las fuentes se incluyen en la respuesta
- [ ] El sistema maneja preguntas sin contexto
- [ ] El historial conversacional funciona

---

## Paso 4: Integra memoria conversacional

Para conversaciones multi-turno, necesitamos mantener contexto entre preguntas.

### 4.1 Implementa la memoria conversacional

Crea `memory/conversation.py`:

```python
from datetime import datetime
from dataclasses import dataclass
import json
from pathlib import Path

@dataclass
class ConversationTurn:
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    sources: list[dict] = None

class ConversationMemory:
    def __init__(self, max_turns: int = 20):
        self.turns = []
        self.max_turns = max_turns
        self.summary = ""

    def add_turn(self, role: str, content: str, sources: list[dict] = None):
        """Agrega un turno a la conversación."""
        turn = ConversationTurn(
            role=role,
            content=content,
            timestamp=datetime.now(),
            sources=sources,
        )
        self.turns.append(turn)

        # Mantener límite de turnos
        if len(self.turns) > self.max_turns:
            self.turns = self.turns[-self.max_turns:]

    def get_context(self, n_turns: int = 6) -> list[dict]:
        """Retorna los últimos n_turns para contexto."""
        recent = self.turns[-n_turns:]
        return [
            {"role": t.role, "content": t.content}
            for t in recent
        ]

    def get_summary(self) -> str:
        """Genera un resumen de la conversación."""
        if not self.turns:
            return ""

        # Resumen simple: últimos 3 temas
        recent_topics = []
        for turn in self.turns[-6:]:
            if turn.role == "user":
                recent_topics.append(turn.content[:50])

        self.summary = "Temas recientes: " + "; ".join(recent_topics)
        return self.summary

    def save(self, filepath: str):
        """Guarda la conversación a archivo."""
        data = {
            "turns": [
                {
                    "role": t.role,
                    "content": t.content,
                    "timestamp": t.timestamp.isoformat(),
                    "sources": t.sources,
                }
                for t in self.turns
            ],
            "summary": self.summary,
        }
        Path(filepath).write_text(json.dumps(data, ensure_ascii=False, indent=2))

    def load(self, filepath: str):
        """Carga una conversación desde archivo."""
        data = json.loads(Path(filepath).read_text())
        self.turns = [
            ConversationTurn(
                role=t["role"],
                content=t["content"],
                timestamp=datetime.fromisoformat(t["timestamp"]),
                sources=t.get("sources"),
            )
            for t in data["turns"]
        ]
        self.summary = data.get("summary", "")

    def clear(self):
        """Limpia la memoria conversacional."""
        self.turns = []
        self.summary = ""
```

### 4.2 Integra la memoria con el sistema RAG

```python
class ConversationalRAG:
    def __init__(self, responder):
        self.responder = responder
        self.memory = ConversationMemory()

    def chat(self, query: str) -> dict:
        """Procesa una pregunta con memoria conversacional."""
        # Agregar pregunta a la memoria
        self.memory.add_turn("user", query)

        # Obtener contexto conversacional
        conv_context = self.memory.get_context()

        # Generar respuesta (el responder ya usa sus propios turnos)
        result = self.responder.generate_response(query)

        # Agregar respuesta a la memoria
        self.memory.add_turn("assistant", result["response"], result["sources"])

        # Agregar contexto conversacional al resultado
        result["conversation_context"] = conv_context
        result["memory_summary"] = self.memory.get_summary()

        return result

    def save_conversation(self, filepath: str):
        """Guarda la conversación."""
        self.memory.save(filepath)

    def load_conversation(self, filepath: str):
        """Carga una conversación."""
        self.memory.load(filepath)
        # Sincronizar con el responder
        self.responder.conversation_history = [
            {"role": t.role, "content": t.content}
            for t in self.memory.turns
        ]

    def clear(self):
        """Limpia toda la memoria."""
        self.memory.clear()
        self.responder.clear_history()
```

### 4.3 Crea la interfaz de usuario

```python
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

def run_chat_interface(responder):
    """Ejecuta la interfaz de chat."""
    from retrieval.indexer import NoteIndexer, NoteRetriever

    indexer = NoteIndexer()
    retriever = NoteRetriever(indexer)
    rag = ConversationalRAG(responder)

    console = Console()
    console.print(Panel.fit(
        "[bold]🤖 RAG Notes - Asistente Personal[/bold]\n"
        "Haz preguntas sobre tus notas. Escribe 'salir' para terminar.",
        border_style="blue",
    ))

    while True:
        query = console.input("\n[bold green]Tú:[/bold green] ")

        if query.lower() in ["salir", "exit", "quit"]:
            console.print("[dim]¡Hasta luego![/dim]")
            break

        if query.lower() == "limpiar":
            rag.clear()
            console.print("[yellow]Memoria limpiada[/yellow]")
            continue

        result = rag.chat(query)

        console.print("\n[bold blue]Asistente:[/bold blue]")
        console.print(Markdown(result["response"]))

        if result["sources"]:
            console.print("\n[dim]Fuentes:[/dim]")
            for source in result["sources"]:
                console.print(f"  • {source['title']} (similitud: {source['similarity']:.2f})")

if __name__ == "__main__":
    from retrieval.indexer import NoteIndexer
    from generation.responder import RAGResponder
    from retrieval.indexer import NoteRetriever

    indexer = NoteIndexer()
    retriever = NoteRetriever(indexer)
    responder = RAGResponder(retriever)

    run_chat_interface(responder)
```

### Verifica

- La memoria conversacional mantiene contexto
- Las respuestas consideran preguntas anteriores
- La interfaz es usable e intuitiva

### Checklist

- [ ] `ConversationMemory` guarda y carga conversaciones
- [ ] `ConversationalRAG` integra memoria con RAG
- [ ] La interfaz de chat funciona correctamente
- [ ] La memoria se persiste entre sesiones

---

## 🩹 Si sale mal

**Las respuestas no son relevantes:**
Verifica que las notas estén bien indexadas. Aumenta `TOP_K_RESULTS` para recuperar más contexto. Ajusta `SIMILARITY_THRESHOLD` para ser más inclusivo.

**El LLM no genera respuestas útiles:**
Mejora el prompt. Sé más específico sobre el formato de respuesta esperado. Agrega ejemplos de respuestas ideales.

**La memoria conversacional pierde contexto:**
Aumenta `max_turns` en `ConversationMemory`. Verifica que el historial se esté sincronizando correctamente entre el memory y el responder.

---

## 🧠 Preguntas socráticas

- ¿Cómo decidirías cuántas notas recuperar para cada pregunta?
- ¿Qué estrategia usarías para manejar preguntas que requieren información de muchas notas?
- ¿Cómo evaluarías la calidad de las respuestas RAG?
- ¿Qué mejoras harías para reducir la latencia de las respuestas?

---

## 🎓 ¿Qué sigue?

Tu sistema RAG está funcionando. Ahora puedes:

- **Agregar más fuentes**: Indexar emails, documentos, bookmarks
- **Mejorar la recuperación**: Usar re-ranking, HyDE, o búsqueda híbrida
- **Personalizar el LLM**: Fine-tuning para tu dominio específico
- **Crear una API**: Servir el RAG como servicio web

Si quieres profundizar en la parte de embeddings, revisa la skill de **Knowledge Base** para aprender a crear índices vectoriales eficientes.
