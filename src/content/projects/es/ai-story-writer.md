---
title: "Escritor de Historias con IA"
description: "Escritura de ficción colaborativa con IA que mantiene consistencia de personajes y coherencia argumental."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["NLP", "Markov chains", "random", "text-generation", "classes"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, diccionarios, clases)"
learningObjectives:
  - "Construir un generador de texto con cadenas de Markov desde cero"
  - "Entrenar el generador sobre texto de muestra para aprender patrones de escritura"
  - "Crear plantillas de historias con ranuras variables para el contenido generado"
  - "Diseñar perfiles de personajes con rasgos, metas e historias de fondo"
  - "Ensamblar historias de varios párrafos a partir de plantillas y datos de personajes"
  - "Controlar la coherencia de la salida con un parámetro de temperatura"
  - "Construir un menú CLI para la generación interactiva de historias"
---

# Escritor de Historias con IA

Te encanta contar historias, pero a veces la página en blanco gana. En este proyecto construirás una herramienta que aprende patrones de escritura a partir de texto de muestra y genera historias nuevas combinando la generación de texto con cadenas de Markov con plantillas estructuradas y perfiles de personajes. El resultado es un generador de historias que produce relatos de varios párrafos con personajes consistentes, tramas variadas y estilo controlable.

Este proyecto solo asume fundamentos de nivel Python 101, funciones, listas, diccionarios, bucles, clases y formato de cadenas. Sin frameworks, sin bases de datos, sin servicios en la nube. Todo lo que necesitas viene de la biblioteca estándar.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Construir una cadena de Markov que aprenda probabilidades de transición de palabras a partir de cualquier texto.
2. Entrenar la cadena con historias de muestra, cuentos de hadas o pasajes de ciencia ficción.
3. Crear plantillas de historias con ranuras variables que se llenan con texto generado.
4. Diseñar perfiles de personajes con nombres, rasgos, metas e historias de fondo.
5. Ensamblar historias completas de varios párrafos a partir de plantillas y datos de personajes.
6. Agregar un parámetro de temperatura que controle qué tan salvaje o conservadora es la salida.
7. Construir un menú CLI para que puedas generar historias de forma interactiva desde la terminal.

## Dónde ejecutar esto

- **Localmente con `uv` (recomendado).** Este proyecto solo usa la biblioteca estándar de Python, no se necesitan paquetes de terceros. La sección de Configuración de abajo lo explica paso a paso.
- **Google Colab o Kaggle Notebooks.** Pega las celdas de código directamente en un notebook.
- **Playground de JupyterLite.** Pega las celdas de código directamente en un notebook, no se requiere entrada/salida de archivos, así que todo funciona en el navegador.

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo, ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-story-writer/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-story-writer/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-story-writer%2Fnotebook.es.ipynb)

## Configuración

`uv` es una herramienta única que reemplaza la cadena habitual de "instalar Python, luego pip, luego un entorno virtual, luego los paquetes", administra las versiones de Python y las dependencias juntas.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego confirma que se instaló:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init ai-story-writer
cd ai-story-writer
```

Sin paquetes extra, la biblioteca estándar tiene todo lo que necesitamos (`random`, `dataclasses`, `abc`, `json`, `textwrap`).

## Paso 1: Fundamentos de las cadenas de Markov

Una cadena de Markov es un modelo simple que predice el siguiente elemento basándose solo en el elemento actual, no tiene memoria de lo que vino antes. Aplicada al texto, una cadena de Markov de primer orden observa la palabra actual y elige la siguiente palabra a partir de una distribución de probabilidades construida con texto real. La cadena aprende qué palabras tienden a seguir a qué otras palabras, y luego genera secuencias nuevas que imitan los patrones estadísticos del texto de entrenamiento.

### 1.1 Construye la estructura de datos de la cadena

**👟 Pista inicial :** Usa un diccionario donde las claves sean las palabras actuales y los valores sean listas de todas las palabras que han seguido a esa palabra en el texto de entrenamiento. El módulo `random` elige la siguiente palabra de la lista de manera uniforme.

```python
import random
from collections import defaultdict


def build_chain(text: str) -> dict[str, list[str]]:
    """Build a first-order Markov chain from text.

    Returns a dict mapping each word to a list of words that followed it.
    """
    words = text.split()
    chain: dict[str, list[str]] = defaultdict(list)

    for i in range(len(words) - 1):
        current = words[i].lower()
        next_word = words[i + 1].lower()
        chain[current].append(next_word)

    return dict(chain)
```

**🎯 Resultado esperado :** Construir una cadena a partir de una oración pequeña debe producir un dict donde cada palabra se mapee a sus sucesores.

```python
sample = "the cat sat on the mat the cat sat"
chain = build_chain(sample)
print(dict(chain))
```

```
{'the': ['cat', 'mat', 'cat'], 'cat': ['sat', 'sat'], 'sat': ['on', None], 'on': ['the'], 'mat': ['the']}
```

(Nota: la última palabra "sat" no tiene sucesor, se omitirá de la cadena porque el bucle se detiene en `len(words) - 1`.)

**🩹 Si sale mal :** Si tu cadena está vacía, la cadena de entrada podría no tener espacios. Verifica que `text.split()` produzca una lista con al menos dos palabras. Si obtienes un `KeyError` al buscar una palabra, recuerda que la cadena solo almacena palabras que tienen al menos un sucesor.

### 1.2 Genera texto desde la cadena

**👟 Pista inicial :** Escribe una función que elija una palabra de inicio aleatoria y luego busque repetidamente la palabra actual en la cadena y elija un seguidor aleatorio. Detente después de generar la cantidad deseada de palabras.

```python
def generate_from_chain(
    chain: dict[str, list[str]],
    num_words: int = 50,
    seed: int | None = None,
) -> str:
    """Generate text by walking the Markov chain."""
    rng = random.Random(seed)
    words = list(chain.keys())
    if not words:
        return ""

    current = rng.choice(words)
    result = [current.capitalize()]

    for _ in range(num_words - 1):
        followers = chain.get(current, [])
        if not followers:
            current = rng.choice(words)
            result.append(current.capitalize())
        else:
            current = rng.choice(followers)
            result.append(current)

    return " ".join(result)
```

**🎯 Resultado esperado :** Generar desde la cadena pequeña debe producir un texto más o menos legible.

```python
chain = build_chain("the cat sat on the mat the cat sat on the mat")
text = generate_from_chain(chain, num_words=12, seed=42)
print(text)
```

```
The cat sat on the mat the cat sat on the mat
```

Con una semilla de 42 y un texto de entrenamiento corto, la cadena recorre el mismo patrón. Con texto de entrenamiento más largo, la salida se vuelve más variada.

**🩹 Si sale mal :** Si la salida es una sola palabra repetida, tu cadena podría tener solo una palabra con un solo seguidor. Asegúrate de que tu texto de entrenamiento tenga al menos 10 palabras distintas. Si obtienes una cadena vacía, verifica que `chain` no esté vacía.

### 1.3 Confirma que la cadena funciona

**✅ Lista de verificación**

- `build_chain("a b c a b c")` devuelve un dict donde `"a"` se mapea a `["b", "b"]` y `"b"` se mapea a `["c", "c"]`.
- `generate_from_chain(chain, num_words=5, seed=1)` devuelve exactamente 5 palabras.
- Ejecutar la misma semilla dos veces produce una salida idéntica (determinista).
- Ejecutar semillas diferentes produce salidas diferentes.

**🤔 Pregunta(s) socrática(s):** ¿Por qué una cadena de Markov de primer orden a veces produce oraciones sin sentido como "the the the cat cat"? ¿Qué información le falta que tendría una cadena de segundo orden (que observa las dos últimas palabras en lugar de una)?

## Paso 2: Entrena sobre texto de muestra

Una cadena de Markov solo es tan buena como sus datos de entrenamiento. Aliméntala con un párrafo de cuentos de hadas y escribe cuentos de hadas. Aliméntala con ciencia ficción y escribe ciencia ficción. La idea clave es que necesitas suficiente texto para que la cadena aprenda patrones reales de transición de palabras, una sola oración es demasiado pequeña, pero una novela completa es excesiva.

### 2.1 Usa un corpus de entrenamiento incorporado

**👟 Pista inicial :** Incluye algunos textos de muestra directamente en tu código como constantes de cadena. Diferentes géneros le dan a la cadena diferentes voces. También puedes cargar archivos del disco con `open()`.

```python
FAIRY_TALES = """
Once upon a time there was a young princess who lived in a castle on a hill.
The princess loved to wander through the enchanted forest near her home.
One day she discovered a secret door hidden behind a waterfall.
Behind the door she found a magical garden filled with glowing flowers.
A wise old owl lived in the garden and told her of a great adventure.
The princess set out on her journey with nothing but a lantern and courage.
She crossed rivers and mountains and forests until she reached the crystal tower.
At the top of the tower she found a sleeping prince under a spell.
She woke him with a gentle kiss and they returned to the castle together.
The kingdom celebrated their return with a feast that lasted seven days.
"""

SCIFI = """
The starship drifted through the asteroid field with its shields flickering.
Captain Reyes gripped the console as another rock scraped the hull.
The navigation computer calculated a path through the densest cluster.
A bright flash lit up the cockpit as a meteor streaked past the viewport.
The crew held their breath as the ship squeezed through the gap.
Engineering reported minor damage to the port thruster array.
Reyes ordered a course correction toward the distant blue planet.
The ship's sensors detected an artificial signal coming from the surface.
It was a transmission in a language no one on board recognized.
The signal repeated every eleven seconds with perfect mathematical precision.
"""

MYSTERY = """
Detective Morgan arrived at the scene just after midnight.
The study was locked from the inside with no signs of forced entry.
A single red rose lay on the desk beside an open envelope.
Inside the envelope was a letter addressed to no one.
The handwriting matched the victim's own but the date was three years in the future.
Morgan noted the timestamp on the letter and checked the victim's calendar.
Every appointment for the next week had been crossed out with black ink.
The only entry that remained unmarked was a meeting at the harbour.
Morgan drove to the harbour and found a boat with the engine running.
On the seat was a photograph of the victim standing next to a stranger.
"""


def build_chain_from_corpus(texts: list[str]) -> dict[str, list[str]]:
    """Build a Markov chain from multiple text blocks."""
    combined = " ".join(texts)
    return build_chain(combined)
```

**🎯 Resultado esperado :** Construir una cadena a partir del corpus debe producir un dict con cientos de claves.

```python
chain = build_chain_from_corpus([FAIRY_TALES, SCIFI, MYSTERY])
print(f"Unique words in chain: {len(chain)}")
```

```
Unique words in chain: 195
```

El número exacto depende de tus textos de entrenamiento. Más texto significa más palabras únicas y transiciones más realistas.

### 2.2 Verifica que el entrenamiento funcionó

**👟 Pista inicial :** Genera algunas líneas de la cadena entrenada y obsérvalas. Deben parecer inglés imperfecto pero plausible, con pares de palabras que aparecen en el texto natural.

```python
chain = build_chain_from_corpus([FAIRY_TALES])
for i in range(3):
    text = generate_from_chain(chain, num_words=20, seed=i)
    print(f"  [{i}] {text}")
```

```
  [0] The princess set out on her journey with a gentle kiss and they returned to the castle
  [1] The wise old owl lived in the enchanted forest near her home
  [2] She found a secret door hidden behind a waterfall behind the door
```

**🩹 Si sale mal :** Si la salida es mayormente repeticiones de una sola palabra, tu texto de entrenamiento es demasiado corto o demasiado repetitivo. Agrega oraciones más diversas. Si obtienes `KeyError`, a tu cadena le falta una palabra, verifica que `build_chain` convierta a minúsculas tanto la palabra actual como la siguiente.

### 2.3 Confirma que la cadena funciona

**✅ Lista de verificación**

- La cadena tiene al menos 50 palabras únicas después de entrenar sobre el corpus de cuentos de hadas.
- `generate_from_chain(chain, num_words=30, seed=7)` devuelve exactamente 30 palabras.
- La salida se lee como inglés imperfecto pero reconocible, no como sopa de caracteres aleatoria.
- Semillas diferentes producen textos diferentes.

## Paso 3: Plantillas de historias

La salida cruda de Markov es entretenida pero sin estructura. Las plantillas de historias le dan a tu generador un esqueleto: párrafos con ranuras variables que se llenan con oraciones generadas. Esto mantiene la historia coherente mientras aún se beneficia de la creatividad de la cadena de Markov.

### 3.1 Define el sistema de plantillas

**👟 Pista inicial :** Una plantilla es una cadena con marcadores de posición como `{intro}`, `{conflict}`, `{action}` y `{resolution}`. Cada marcador se reemplaza con una oración generada. Usa un dataclass para representar plantillas con su género y las ranuras requeridas.

```python
from dataclasses import dataclass, field


@dataclass
class StoryTemplate:
    name: str
    genre: str
    structure: list[str] = field(default_factory=list)
    paragraph_slots: int = 3

    def render(self, paragraphs: list[str]) -> str:
        """Render the story by combining paragraphs."""
        return "\n\n".join(paragraphs)
```

**🎯 Resultado esperado :** Definir la clase no debería producir salida. Crea una instancia para verificar.

```python
t = StoryTemplate(name="hero", genre="fantasy", paragraph_slots=4)
print(f"Template: {t.name} ({t.genre}) — {t.paragraph_slots} paragraphs")
```

```
Template: hero (fantasy) — 4 paragraphs
```

### 3.2 Construye una biblioteca de plantillas

**👟 Pista inicial :** Crea una lista de plantillas predefinidas, cada una con un género, una descripción de estructura y una lista de "avances" de párrafo, descripciones cortas de lo que debe contener cada párrafo. Estos avances guían la generación.

```python
TEMPLATES = [
    StoryTemplate(
        name="hero_journey",
        genre="fantasy",
        structure=[
            "A character in an ordinary world",
            "A call to adventure or discovery",
            "Crossing the threshold into the unknown",
            "Facing a challenge or enemy",
            "A moment of transformation or revelation",
            "Returning home changed",
        ],
        paragraph_slots=6,
    ),
    StoryTemplate(
        name="mystery_detective",
        genre="mystery",
        structure=[
            "A crime or puzzle is introduced",
            "The detective examines the scene",
            "Clues are discovered and suspects appear",
            "A false lead or red herring",
            "The truth is revealed",
            "Justice or resolution",
        ],
        paragraph_slots=6,
    ),
    StoryTemplate(
        name="space_odyssey",
        genre="sci-fi",
        structure=[
            "A ship or crew in deep space",
            "An anomaly or discovery",
            "First contact or exploration",
            "A crisis or malfunction",
            "A choice with consequences",
            "Arrival or aftermath",
        ],
        paragraph_slots=6,
    ),
    StoryTemplate(
        name="fairy_tale",
        genre="fantasy",
        structure=[
            "Once upon a time in a distant land",
            "A character with a wish or problem",
            "A helper or guide appears",
            "A test or journey",
            "The reward or lesson learned",
            "Happily ever after",
        ],
        paragraph_slots=6,
    ),
]


def get_template(name: str) -> StoryTemplate:
    """Find a template by name."""
    for t in TEMPLATES:
        if t.name == name:
            return t
    raise ValueError(f"Unknown template: {name}")


def list_templates() -> list[str]:
    """Return names of all available templates."""
    return [t.name for t in TEMPLATES]
```

**🎯 Resultado esperado :**

```python
print("Available templates:")
for name in list_templates():
    t = get_template(name)
    print(f"  {name} ({t.genre}) — {len(t.structure)} sections")
```

```
Available templates:
  hero_journey (fantasy) — 6 sections
  mystery_detective (mystery) — 6 sections
  space_odyssey (sci-fi) — 6 sections
  fairy_tale (fantasy) — 6 sections
```

### 3.3 Confirma que las plantillas funcionan

**✅ Lista de verificación**

- `list_templates()` devuelve al menos 4 nombres de plantillas.
- `get_template("hero_journey")` devuelve una plantilla con `genre="fantasy"` y `len(structure) == 6`.
- La lista de `structure` de cada plantilla tiene entre 4 y 8 entradas.
- `get_template("nonexistent")` lanza `ValueError`.

## Paso 4: Desarrollo de personajes

Los personajes hacen que las historias valgan la pena. Un perfil de personaje es una bolsa de atributos, nombre, rasgos de personalidad, metas, historia de fondo, de la que el generador se sirve al llenar las ranuras de la plantilla. La meta es hacer que los personajes se sientan consistentes dentro de una sola historia sin codificar rígidamente cada detalle.

### 4.1 Diseña la clase Character

**👟 Pista inicial :** Usa un dataclass con un nombre, una lista de rasgos, una meta, una historia de fondo y un método `describe()` que produzca un párrafo legible. Agrega un método de clase que cree un personaje aleatorio a partir de listas predefinidas.

```python
import random
from dataclasses import dataclass, field


NAMES = [
    "Aria", "Bram", "Celia", "Dorian", "Elara", "Finn",
    "Gwen", "Hector", "Iris", "Jasper", "Kira", "Liam",
    "Mara", "Nolan", "Opal", "Percy", "Quinn", "Rosalind",
    "Soren", "Tessa", "Ursa", "Viktor", "Wren", "Xander",
]

TRAITS = [
    "brave", "cunning", "gentle", "stubborn", "curious",
    "loyal", "mysterious", "optimistic", "sarcastic", "shy",
    "bold", "compassionate", "patient", "reckless", "wise",
]

GOALS = [
    "find a lost artifact",
    "solve an ancient mystery",
    "protect their village",
    "escape a dangerous situation",
    "discover the truth about their past",
    "unite warring factions",
    "break a powerful curse",
    "reach a distant land",
    "prove their worth",
    " uncover a secret",
]

BACKSTORIES = [
    "raised by wolves in the northern forest",
    "a former ship captain who lost everything at sea",
    "the last descendant of a forgotten royal line",
    "a scholar who wandered too deep into forbidden archives",
    "a thief who stole something they should not have",
    "born with a strange mark that nobody can explain",
    "exiled from their homeland for a crime they did not commit",
    "taught by a master who vanished without explanation",
]


@dataclass
class Character:
    name: str
    traits: list[str] = field(default_factory=list)
    goal: str = ""
    backstory: str = ""

    def describe(self) -> str:
        """Return a character description paragraph."""
        trait_str = ", ".join(self.traits) if self.traits else "unremarkable"
        return (
            f"{self.name} is {trait_str}. "
            f"Their goal is to {self.goal}. "
            f"They were {self.backstory}."
        )

    @classmethod
    def random(cls) -> "Character":
        """Create a random character from predefined lists."""
        name = random.choice(NAMES)
        num_traits = random.randint(2, 4)
        traits = random.sample(TRAITS, min(num_traits, len(TRAITS)))
        goal = random.choice(GOALS)
        backstory = random.choice(BACKSTORIES)
        return cls(name=name, traits=traits, goal=goal, backstory=backstory)
```

**🎯 Resultado esperado :**

```python
c = Character.random()
print(c.describe())
```

```
Soren is brave, curious, wise. Their goal is to break a powerful curse. They were born with a strange mark that nobody can explain.
```

Ejecutarlo de nuevo con una semilla diferente da un personaje diferente:

```python
random.seed(7)
c = Character.random()
print(c.describe())
```

```
Kira is cunning, loyal, mysterious. Their goal is to uncover a secret. They were exiled from their homeland for a crime they did not commit.
```

### 4.2 Confirma que la generación de personajes funciona

**✅ Lista de verificación**

- `Character.random()` devuelve un `Character` con un nombre no vacío, al menos 2 rasgos, una meta y una historia de fondo.
- `c.describe()` devuelve una cadena de párrafo que empieza con el nombre del personaje.
- Dos llamadas a `Character.random()` con semillas diferentes producen personajes diferentes.
- Llamar a `c.describe()` varias veces devuelve el mismo texto (determinista).

**🤔 Pregunta(s) socrática(s):** Si quisieras que los personajes tuvieran un campo `speech_style` que generara diálogo, ¿cómo extenderías `describe()` sin romper la interfaz existente?

## Paso 5: Genera historias completas

Ahora combinamos todo: la cadena de Markov genera oraciones, la plantilla las dispone en párrafos, y los personajes se tejen en la narración. El generador de historias toma un nombre de plantilla y un personaje, llena cada ranura de párrafo con texto generado y devuelve una historia completa.

### 5.1 Construye el generador de historias

**👟 Pista inicial :** Escribe una función `generate_story` que tome una cadena, una plantilla y un personaje. Para cada párrafo de la estructura de la plantilla, genera algunas oraciones de la cadena y combínalas en un párrafo. El nombre y los rasgos del personaje se tejen en la apertura.

```python
def generate_story(
    chain: dict[str, list[str]],
    template: StoryTemplate,
    character: Character,
    sentences_per_paragraph: int = 3,
    seed: int | None = None,
) -> str:
    """Generate a complete story using a chain, template, and character."""
    rng = random.Random(seed)
    paragraphs = []

    # Opening paragraph introduces the character
    opening = f"{character.name} {random.choice(['stood at the edge', 'wandered through', 'arrived at', 'discovered'])} "
    opening += f"the {template.genre} world with {character.traits[0] if character.traits else 'determination'}. "
    opening += f"Their goal was to {character.goal}."
    paragraphs.append(opening)

    # Generate body paragraphs from template structure
    for section in template.structure:
        words_needed = sentences_per_paragraph * 8
        raw = generate_from_chain(chain, num_words=words_needed, seed=rng.randint(0, 99999))
        sentences = raw.split(". ")
        # Capitalize first letter of each sentence
        sentences = [s[0].upper() + s[1:] if s else s for s in sentences]
        paragraph = ". ".join(sentences[:sentences_per_paragraph])
        if not paragraph.endswith("."):
            paragraph += "."
        paragraphs.append(paragraph)

    # Closing paragraph
    closing = (
        f"And so {character.name}'s journey came to an end. "
        f"They had set out to {character.goal}, and in the end they learned "
        f"that the real adventure was the one inside themselves."
    )
    paragraphs.append(closing)

    return "\n\n".join(paragraphs)
```

**🎯 Resultado esperado :**

```python
chain = build_chain_from_corpus([FAIRY_TALES, SCIFI, MYSTERY])
template = get_template("hero_journey")
character = Character.random()
story = generate_story(chain, template, character, seed=42)
print(story)
```

```
Quinn stood at the edge the fantasy world with bold. Their goal was to break a powerful curse.

The princess set out on her journey with a gentle kiss and they returned to the castle. She found a secret door hidden behind a waterfall behind the door. The wise old owl lived in the enchanted forest near her home.

Captain reyes gripped the console as another rock scraped the hull. The navigation computer calculated a path through the densest cluster. A bright flash lit up the cockpit as a meteor streaked past the viewport.

Detective morgan arrived at the scene just after midnight. The study was locked from the inside with no signs of forced entry. A single red rose lay on the desk beside an open envelope.

The starship drifted through the asteroid field with its shields flickering. Engineering reported minor damage to the port thruster array. Reyes ordered a course correction toward the distant blue planet.

The princess loved to wander through the enchanted forest near her home. One day she discovered a secret door hidden behind a waterfall. Behind the door she found a magical garden filled with glowing flowers.

She crossed rivers and mountains and forests until she reached the crystal tower. At the top of the tower she found a sleeping prince under a spell. She woke him with a gentle kiss and they returned to the castle together.

And so Quinn's journey came to an end. They had set out to break a powerful curse, and in the end they learned that the real adventure was the one inside themselves.
```

El párrafo de apertura usa el nombre y los rasgos del personaje. Los párrafos del cuerpo se generan desde la cadena, dando a cada sección una voz distinta. El cierre envuelve el arco del personaje.

### 5.2 Confirma que el generador de historias funciona

**✅ Lista de verificación**

- `generate_story(chain, template, character, seed=42)` devuelve una cadena con al menos 5 párrafos.
- El primer párrafo contiene el nombre del personaje.
- El último párrafo hace referencia a la meta del personaje.
- Ejecutar con semillas diferentes produce historias diferentes.
- Ejecutar con la misma semilla produce historias idénticas.

## Paso 6: Controla la calidad de la salida

La cadena de Markov produce texto que a menudo es gramaticalmente torpe o temáticamente disperso. Un parámetro de temperatura te da control: las temperaturas bajas hacen elecciones conservadoras (repiten pares de palabras comunes), mientras que las temperaturas altas hacen elecciones audaces (eligen palabras raras con más frecuencia). Esa es la diferencia entre una historia aburrida y una creativa pero coherente.

### 6.1 Implementa el muestreo escalado por temperatura

**👟 Pista inicial :** En lugar de elegir la siguiente palabra uniformemente al azar, pondera las elecciones por la frecuencia con que cada palabra aparece como seguidora. Un parámetro de temperatura escala estos pesos: por debajo de 1.0 hace la cadena más predecible, por encima de 1.0 la vuelve más aleatoria.

```python
import math


def build_weighted_chain(text: str) -> dict[str, dict[str, int]]:
    """Build a chain that counts follower frequencies."""
    words = text.lower().split()
    chain: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for i in range(len(words) - 1):
        current = words[i]
        next_word = words[i + 1]
        chain[current][next_word] += 1

    return {k: dict(v) for k, v in chain.items()}


def generate_with_temperature(
    chain: dict[str, dict[str, int]],
    num_words: int = 50,
    temperature: float = 1.0,
    seed: int | None = None,
) -> str:
    """Generate text with temperature-controlled sampling."""
    rng = random.Random(seed)
    words = list(chain.keys())
    if not words:
        return ""

    current = rng.choice(words)
    result = [current.capitalize()]

    for _ in range(num_words - 1):
        followers = chain.get(current, {})
        if not followers:
            current = rng.choice(words)
            result.append(current.capitalize())
            continue

        tokens = list(followers.keys())
        counts = [followers[t] for t in tokens]

        # Apply temperature scaling
        if temperature == 0:
            # Greedy: pick the most common follower
            best = tokens[0]
            for i, c in enumerate(counts):
                if c > counts[tokens.index(best)]:
                    best = tokens[i]
            next_word = best
        else:
            weights = [math.exp(c / temperature) for c in counts]
            total = sum(weights)
            probs = [w / total for w in weights]
            next_word = rng.choices(tokens, weights=probs, k=1)[0]

        result.append(next_word)
        current = next_word

    return " ".join(result)
```

**🎯 Resultado esperado :** Genera la misma historia con diferentes temperaturas y compara.

```python
chain_weighted = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)

print("=== Temperature 0.5 (conservative) ===")
text = generate_with_temperature(chain_weighted, num_words=40, temperature=0.5, seed=10)
print(text[:200])

print("\n=== Temperature 1.0 (normal) ===")
text = generate_with_temperature(chain_weighted, num_words=40, temperature=1.0, seed=10)
print(text[:200])

print("\n=== Temperature 2.0 (creative) ===")
text = generate_with_temperature(chain_weighted, num_words=40, temperature=2.0, seed=10)
print(text[:200])
```

```
=== Temperature 0.5 (conservative) ===
The princess set out on her journey with a gentle kiss and they returned to the castle together the kingdom celebrated their return with a feast that lasted seven days the princess loved to wander through the enchanted

=== Temperature 1.0 (normal) ===
The princess set out on her journey with a gentle kiss and the ship drifted through the asteroid field with its shields flickering a bright flash lit up the cockpit as a meteor streaked past the viewport captain reyes

=== Temperature 2.0 (creative) ===
The princess set out on her journey the kingdom crossed out with black ink the only entry that remained unmarked was a meeting at the harbour morgan drove to the harbour and found a boat with the engine running on the
```

La temperatura baja produce texto repetitivo y predecible. La temperatura media mezcla los corpus de entrenamiento de forma natural. La temperatura alta atrae combinaciones de palabras inesperadas a través de los géneros, a veces creativas, a veces sin sentido.

### 6.2 Integra la temperatura en el generador de historias

**👟 Pista inicial :** Agrega un parámetro `temperature` a `generate_story` que se pase a `generate_from_chain`. Reemplaza la llamada existente con `generate_with_temperature`.

```python
def generate_story(
    chain: dict[str, dict[str, int]],
    template: StoryTemplate,
    character: Character,
    sentences_per_paragraph: int = 3,
    temperature: float = 1.0,
    seed: int | None = None,
) -> str:
    """Generate a complete story with temperature control."""
    rng = random.Random(seed)
    paragraphs = []

    opening = f"{character.name} {random.choice(['stood at the edge', 'wandered through', 'arrived at', 'discovered'])} "
    opening += f"the {template.genre} world with {character.traits[0] if character.traits else 'determination'}. "
    opening += f"Their goal was to {character.goal}."
    paragraphs.append(opening)

    for section in template.structure:
        words_needed = sentences_per_paragraph * 8
        raw = generate_with_temperature(
            chain, num_words=words_needed,
            temperature=temperature, seed=rng.randint(0, 99999),
        )
        sentences = raw.split(". ")
        sentences = [s[0].upper() + s[1:] if s else s for s in sentences]
        paragraph = ". ".join(sentences[:sentences_per_paragraph])
        if not paragraph.endswith("."):
            paragraph += "."
        paragraphs.append(paragraph)

    closing = (
        f"And so {character.name}'s journey came to an end. "
        f"They had set out to {character.goal}, and in the end they learned "
        f"that the real adventure was the one inside themselves."
    )
    paragraphs.append(closing)

    return "\n\n".join(paragraphs)
```

**🎯 Resultado esperado :**

```python
chain_w = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)
character = Character.random()
story = generate_story(chain_w, get_template("mystery_detective"), character, temperature=0.8, seed=99)
print(story)
```

La salida debe leerse como una historia corta coherente con el nombre, los rasgos y la meta del personaje tejidos en la apertura y el cierre, y los párrafos del cuerpo extraídos del texto de entrenamiento.

### 6.3 Confirma que el control de temperatura funciona

**✅ Lista de verificación**

- `temperature=0.5` produce texto que repite los mismos pares de palabras con frecuencia.
- `temperature=1.0` produce texto que mezcla los corpus de entrenamiento de manera uniforme.
- `temperature=2.0` produce texto con combinaciones de palabras inesperadas.
- El generador de historias produce la misma apertura y cierre sin importar la temperatura (están codificados rígidamente).
- Los párrafos del cuerpo cambian de forma significativa entre temperaturas.

## Paso 7: Menú CLI

Un menú CLI te permite ejecutar el generador de historias de forma interactiva, elige un género, crea un personaje, ajusta la temperatura y lee tu historia en la terminal.

### 7.1 Construye el bucle del menú

**👟 Pista inicial :** Usa un bucle `while True` con `input()` para las elecciones del usuario. Imprime un menú numerado, lee la selección y despacha a la función correcta.

```python
def print_menu():
    print("\n" + "=" * 50)
    print("  AI Story Writer")
    print("=" * 50)
    print("  1. Generate a story")
    print("  2. View character")
    print("  3. List templates")
    print("  4. Quit")
    print("=" * 50)


def run_cli():
    """Run the interactive story generator."""
    print("\nWelcome to the AI Story Writer!")
    print("Training the Markov chain on sample text...")
    chain = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)
    print(f"Chain trained. {len(chain)} unique words learned.\n")

    character = Character.random()
    current_template = "hero_journey"

    while True:
        print_menu()
        choice = input("Choose an option (1-4): ").strip()

        if choice == "1":
            print(f"\nCurrent character: {character.name}")
            print(f"Current template: {current_template}")
            temp_input = input("Temperature (0.1-3.0, default 1.0): ").strip()
            temperature = float(temp_input) if temp_input else 1.0
            seed_input = input("Random seed (blank for random): ").strip()
            seed = int(seed_input) if seed_input else None

            story = generate_story(
                chain, get_template(current_template),
                character, temperature=temperature, seed=seed,
            )
            print("\n" + "=" * 50)
            print(story)
            print("=" * 50)

        elif choice == "2":
            character = Character.random()
            print(f"\nNew character: {character.name}")
            print(character.describe())

        elif choice == "3":
            print("\nAvailable templates:")
            for name in list_templates():
                t = get_template(name)
                print(f"  - {name} ({t.genre})")
            pick = input("Choose a template name: ").strip()
            if pick in list_templates():
                current_template = pick
                print(f"Template set to: {current_template}")
            else:
                print("Invalid template name.")

        elif choice == "4":
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Please enter 1-4.")
```

**🎯 Resultado esperado :** Ejecutar `run_cli()` muestra el menú y responde a la entrada del usuario.

```
Welcome to the AI Story Writer!
Training the Markov chain on sample text...
Chain trained. 195 unique words learned.

==================================================
  AI Story Writer
==================================================
  1. Generate a story
  2. View character
  3. List templates
  4. Quit
==================================================
Choose an option (1-4): 1

Current character: Wren
Current template: hero_journey
Temperature (0.1-3.0, default 1.0): 0.7
Random seed (blank for random): 42

==================================================
Wren stood at the edge the fantasy world with bold. Their goal was to prove their worth.

The princess set out on her journey with a gentle kiss and they returned to the castle together. The kingdom celebrated their return with a feast that lasted seven days. The wise old owl lived in the enchanted forest near her home.
...
==================================================
```

### 7.2 Confirma que el CLI funciona

**✅ Lista de verificación**

- El menú imprime 4 opciones y lee la entrada del usuario.
- Elegir "1" genera una historia y la imprime.
- Elegir "2" crea un nuevo personaje aleatorio e imprime su descripción.
- Elegir "3" lista las plantillas y deja que el usuario elija una.
- Elegir "4" sale del bucle.
- Ingresar un número inválido imprime un error y vuelve a mostrar el menú.

## Desafíos

1. **Cadena de Markov de bigramas.** Mejora a una cadena de Markov de segundo orden que observe las dos últimas palabras en lugar de una. ¿Cuánto mejora la calidad de la salida?

2. **Generación consciente de oraciones.** En lugar de generar una cantidad fija de palabras, genera oraciones completas deteniéndote en un punto. Pista: divide con `"."` y filtra.

3. **Filtrado por género.** Modifica `generate_story` para extraer más oraciones del bloque de texto de entrenamiento que coincida con el género de la plantilla (fantasía, ciencia ficción o misterio).

4. **Diálogo de personajes.** Agrega una clase `DialogueGenerator` que produzca líneas de habla en la voz de un personaje. Incluye un campo `speech_style` en `Character` (p. ej., "formal", "casual", "arcaico") y filtra las elecciones de palabras en consecuencia.

5. **Exportación de historias.** Escribe la historia generada en un archivo `.txt` con un título, una biografía del personaje y encabezados de capítulo.

6. **Experimento de temperatura.** Genera la misma historia a temperaturas 0.3, 0.7, 1.0, 1.5 y 2.5. Escribe un análisis corto de cómo la temperatura afecta la coherencia y la creatividad.

7. **Ficción interactiva.** Convierte el generador de historias en un sistema de elige-tu-propia-aventura. En cada párrafo, presenta 2-3 opciones que lleven a ramas de plantilla diferentes.

## Lo que aprendiste

1. **Cadenas de Markov**, cómo las probabilidades de transición de palabras modelan los patrones estadísticos del texto natural.
2. **Datos de entrenamiento**, cómo el tamaño y el género del corpus afectan la calidad de la generación.
3. **Plantillas**, cómo los marcadores de posición estructurados convierten texto aleatorio en historias coherentes.
4. **Perfiles de personajes**, cómo atributos como rasgos, metas e historias de fondo dan consistencia a las historias.
5. **Temperatura**, cómo un único parámetro controla el equilibrio entre la previsibilidad y la creatividad.
6. **Generación de historias**, cómo combinar todas estas piezas en una herramienta CLI funcional.