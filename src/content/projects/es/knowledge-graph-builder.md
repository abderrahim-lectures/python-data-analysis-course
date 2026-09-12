---
title: "Constructor de Grafos de Conocimiento"
description: "Extrae entidades y relaciones de texto para construir grafos de conocimiento interactivos."
---

# 🕸️ Construye un Constructor de Grafos de Conocimiento

Un grafo de conocimiento convierte el texto no estructurado en una red de hechos conectados: "Ada Lovelace" y "analytical engine" se convierten en nodos, y "diseñó" se convierte en la arista entre ellos. Este proyecto construye una canalización que extrae entidades nombradas de las oraciones, detecta las relaciones entre ellas y renderiza todo como un grafo interactivo que puedes explorar y consultar.

Esto asume Python 101 y comodidad con pandas de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias de NLP y de grafos.
2. Extraer entidades nombradas del texto usando un modelo NLP preentrenado.
3. Detectar relaciones entre las entidades extraídas.
4. Visualizar el grafo con un diagrama interactivo de nodos y enlaces.
5. Consultar el grafo buscando rutas conectadas y vecinos.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-graph-builder/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-graph-builder/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fknowledge-graph-builder%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python, spaCy y NetworkX.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init knowledge-graph-builder
cd knowledge-graph-builder
uv add spacy networkx matplotlib
```

`spacy` proporciona el reconocimiento de entidades nombradas. `networkx` guarda la estructura del grafo. `matplotlib` lo renderiza. También necesitarás el modelo de spaCy:

```bash
uv run python -m spacy download en_core_web_sm
```

### Crea la estructura del proyecto

```bash
mkdir -p kgraph
touch kgraph/__init__.py kgraph/entities.py kgraph/graph.py kgraph/build.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `knowledge-graph-builder/` existe con un `pyproject.toml` y todas las dependencias instaladas.
- ✅ `spacy download en_core_web_sm` se completa sin errores.
- ✅ El directorio `kgraph/` tiene todos los archivos de módulo requeridos.

## Paso 1: Extrae las entidades nombradas

El reconocimiento de entidades nombradas identifica personas (PER), organizaciones (ORG) y ubicaciones (LOC) en el texto. spaCy hace esto sin configuración adicional.

### 1.1 Carga el modelo y extrae entidades

**👟 Pista inicial :** Crea `kgraph/entities.py`.

```python
# kgraph/entities.py
import spacy

class EntityExtractor:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")

    def extract(self, text: str) -> list[dict]:
        doc = self.nlp(text)
        entities = []
        for ent in doc.ents:
            entities.append({"label": ent.label_, "text": ent.text})
        return entities

    def unique_entities(self, text: str) -> list[dict]:
        seen = {}
        for ent in self.extract(text):
            key = (ent["label"], ent["text"].lower())
            if key not in seen:
                seen[key] = {"label": ent["label_"], "id": len(seen) + 1}
        return list(seen.values())
```

**🎯 Resultado esperado :** `EntityExtractor().extract("Ada Lovelace worked at Babbage's Analytical Engine in London.")` devuelve entidades que incluyen una persona y una ubicación.

**🩹 Si sale mal :** Si no obtienes entidades, el modelo puede no reconocer los nombres propios de tu oración de muestra, prueba con una oración más rica.

### 1.2 Verifica la extracción de entidades

**✅ Lista de verificación**

- ✅ `extract` devuelve una lista no vacía para una oración con nombres propios.
- ✅ Aparecen etiquetas de entidad como `PER`, `ORG`, `LOC`.
- ✅ `unique_entities` elimina duplicados de las menciones repetidas.

**🤔 Pregunta(s) socrática(s)**

- El modelo pequeño reconoce mejor las figuras políticas que los nombres técnicos de nicho. ¿Cómo lo extenderías con reglas personalizadas para tu dominio?

## Paso 2: Construye la estructura del grafo

Las entidades se convierten en nodos; la co-ocurrencia dentro de una oración se convierte en una arista.

### 2.1 Crea el grafo

**👟 Pista inicial :** Crea `kgraph/graph.py`.

```python
# kgraph/graph.py
import networkx as nx

class KnowledgeGraph:
    def __init__(self):
        self.graph = nx.Graph()

    def add_node(self, entity_id: int, label: str, text: str):
        self.graph.add_node(entity_id, label=label, text=text)

    def add_edge(self, a: int, b: int, sentence: str):
        if self.graph.has_edge(a, b):
            self.graph[a][b]["weight"] += 1
        else:
            self.graph.add_edge(a, b, sentence=sentence, weight=1)

    def neighbors(self, entity_text: str) -> list[str]:
        node = self._find(entity_text)
        if node is None:
            return []
        return [self.graph.nodes[n]["text"] for n in self.graph.neighbors(node)]

    def _find(self, entity_text: str) -> int | None:
        lower = entity_text.lower()
        for n, data in self.graph.nodes(data=True):
            if data["text"].lower() == lower:
                return n
        return None
```

**🎯 Resultado esperado :** Añadir unas cuantas entidades y aristas construye un grafo que puedes consultar con `neighbors()`.

**🩹 Si sale mal :** Si `neighbors` devuelve vacío, el texto de la entidad no coincide con ningún nodo, revisa las mayúsculas y la ortografía exacta.

### 2.2 Verifica el grafo

**✅ Lista de verificación**

- ✅ `add_node` crea nodos del grafo con `label` y `text`.
- ✅ `add_edge` incrementa `weight` en las conexiones repetidas.
- ✅ `neighbors` devuelve el texto de las entidades conectadas.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué hacer seguimiento del peso de las aristas? ¿Qué información te da una arista de alto peso sobre un grafo de conocimiento?

## Paso 3: Conecta la extracción con el grafo

Ahora conecta los dos: analiza las oraciones, extrae las entidades por oración y crea aristas para las entidades que comparten una oración.

### 3.1 Construye la canalización

**👟 Pista inicial :** Crea `kgraph/build.py`.

```python
# kgraph/build.py
import re
from kgraph.entities import EntityExtractor
from kgraph.graph import KnowledgeGraph


def build_graph(text: str) -> KnowledgeGraph:
    extractor = EntityExtractor()
    graph = KnowledgeGraph()
    for sentence in re.split(r'[.!?\n]+', text):
        sentence = sentence.strip()
        if not sentence:
            continue
        ents = extractor.unique_entities(sentence)
        for ent in ents:
            graph.add_node(ent["id"], ent["label"], ent["text"])
        for i in range(len(ents)):
            for j in range(i + 1, len(ents)):
                if ents[i]["id"] != ents[j]["id"]:
                    graph.add_edge(ents[i]["id"], ents[j]["id"], sentence)
    return graph
```

**🎯 Resultado esperado :** `build_graph(long_text)` devuelve un grafo donde las entidades de la misma oración están conectadas.

**🩹 Si sale mal :** Si no se forman aristas, la expresión regular de división puede estar produciendo oraciones vacías.

### 3.2 Verifica la canalización

**✅ Lista de verificación**

- ✅ Las entidades se añaden como nodos.
- ✅ Las entidades que comparten una oración se conectan con una arista.
- ✅ Los pares repetidos incrementan el peso.

**🤔 Pregunta(s) socrática(s)**

- La co-ocurrencia es un detector de relaciones ingenuo pero efectivo. ¿Qué añadiría un enfoque basado en el análisis de dependencias?

## Paso 4: Visualiza el grafo

Dibujar el grafo hace que la estructura sea legible: los hubs aparecen de inmediato.

### 4.1 Grafica el grafo

**👟 Pista inicial :** Añade una función de visualización.

```python
# kgraph/graph.py (continued)
import matplotlib.pyplot as plt

class KnowledgeGraph:
    # ... existing methods ...

    def draw(self, title="Knowledge Graph", figsize=(12, 8)):
        pos = nx.spring_layout(self.graph, seed=42)
        labels = {n: data["text"] for n, data in self.graph.nodes(data=True)}
        plt.figure(figsize=figsize)
        nx.draw_networkx_edges(self.graph, pos, alpha=0.3)
        nx.draw_networkx_nodes(self.graph, pos, node_size=800,
                               node_color="skyblue", alpha=0.9)
        nx.draw_networkx_labels(self.graph, pos, labels, font_size=9)
        plt.title(title)
        plt.axis("off")
        plt.tight_layout()
        return plt
```

**🎯 Resultado esperado :** `graph.draw()` renderiza un diagrama interactivo de layout de resortes con nodos etiquetados.

**🩹 Si sale mal :** Si los nodos se superponen mucho, aumenta `figsize` o ajusta `k` en `spring_layout`.

### 4.2 Verifica la visualización

**✅ Lista de verificación**

- ✅ Los nodos se dibujan con etiquetas de texto de las entidades.
- ✅ Las aristas conectan entidades relacionadas.
- ✅ El layout es legible (sin superposición severa de nodos).

**🤔 Pregunta(s) socrática(s)**

- ¿Qué nodo sería un "hub" en tu grafo, y por qué podría ser central esa entidad?

## ⚠️ Errores comunes

- **Falta la descarga del modelo.** `spacy.load("en_core_web_sm")` lanza `OSError` si omites `spacy download`. Instala el modelo antes de ejecutar.
- **Búsquedas sensibles a mayúsculas.** La entidad `"Lovelace"` no coincidirá con `"lovelace"` a menos que normalices las mayúsculas en las búsquedas. El auxiliar `_find` maneja esto, reutilízalo en todas partes.
- **Grafos desconectados.** Las entradas cortas suelen producir nodos aislados sin aristas. Usa un texto con múltiples entidades co-ocurrentes para ver una estructura interesante.
- **Tamaño del modelo vs precisión.** `en_core_web_sm` es pequeño y rápido pero pierde entidades de nicho. Prueba `en_core_web_md` o `_lg` para mejor recall (recuperación) a costa de memoria.
- **IDs de entidad duplicados.** `unique_entities` asigna los IDs por llamada. Entre oraciones, la misma persona puede obtener IDs diferentes a menos que elimines los duplicados globalmente, la canalización construye un solo extractor pero los IDs por oración se reinician.

## Lo que acabas de construir

Una canalización de texto-a-grafo: spaCy extrae las entidades nombradas, un divisor de expresiones regulares aísla las oraciones, la co-ocurrencia convierte las oraciones compartidas en aristas ponderadas y NetworkX almacena y matplotlib renderiza el resultado. Ahora puedes tomar cualquier párrafo y convertirlo en una red de hechos conectados explorable, el mismo patrón detrás de los sistemas de respuesta a preguntas y de los motores de recomendación.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/knowledge-graph-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/knowledge-graph-builder) en el repositorio del curso tiene una versión más rica con detección de tipos de relación, detección de comunidades y el CLI conectado de principio a fin. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Usa el análisis de dependencias de spaCy para etiquetar las aristas con el verbo ("designed", "located in") en lugar de la co-ocurrencia sin etiquetar.
- Ejecuta la detección de comunidades con `networkx.algorithms.community` para encontrar grupos de temas.
- Exporta el grafo a GraphML y cárgalo en Gephi para exploración avanzada.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene una guía completa y apta para principiantes sobre cómo añadir el tuyo mediante una **pull request**, incluso si nunca has usado git: hacer un fork del repositorio, crear una rama, hacer commit de tus archivos y abrir la PR, paso a paso. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓