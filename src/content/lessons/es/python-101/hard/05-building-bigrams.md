---

title: "Construir tablas de bigramas"
description: "Cuenta pares de palabras consecutivas en un diccionario anidado que asigna cada palabra a su distribución de seguidores."
module: "bigram-tables"
order: 5
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Comprender qué captura un bigrama sobre las transiciones palabra a palabra"
  - "Construir un dict anidado bigrams = {'the': {'cat': 3, 'dog': 1}, ...} a partir de una lista de tokens"
  - "Manejar los límites de oración y las palabras iniciales desconocidas"
  - "Inspeccionar la tabla de bigramas para verificar su corrección"
prerequisites: ["04-word-frequency"]
tags: ["python", "bigramas", "dict-anidado", "transiciones", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "¿Qué es un bigrama?"
    options:
      - text: "Una palabra con dos sílabas"
      - text: "Un par de palabras consecutivas"
        correct: true
      - text: "Una palabra de dos letras"
      - text: "Una palabra que aparece dos veces"
  - question: "¿Cómo creas bigramas a partir de una lista de tokens?"
    options:
      - text: "tokens[0:2]"
      - text: "zip(tokens, tokens[1:])"
        correct: true
      - text: "tokens * 2"
      - text: "tokens.split()"
  - question: "Si tokens = the, cat, sat, ¿qué bigramas obtienes?"
    options:
      - text: "the, cat, sat"
      - text: "(the, cat), (cat, sat)"
        correct: true
      - text: "(the, the), (cat, cat), (sat, sat)"
      - text: "(the, cat, sat)"
---
De los recuentos de palabras a las transiciones de palabras

La frecuencia de palabras te dice *qué* palabras aparecen. Los bigramas te dicen *qué sigue a qué*. "The cat" es mucho más común que "the refrigerator" — una tabla de bigramas captura esa relación. Es la forma más simple de un modelo de lenguaje: dada una palabra, ¿qué palabras tienden a venir después?

Las celdas siguientes reutilizan las funciones `load_corpus` y `tokenize` de las lecciones 01 y 03. Cada página de lección inicia una sesión de Python nueva, así que ejecuta primero esta celda de configuración:

```python
import csv
import string

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    texts = [row["text"] for row in reader]

def load_corpus(path):
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        return [row["text"] for row in reader]

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text.split()

tokens = tokenize(" ".join(texts))
```

## Conceptos clave

### ¿Qué es un bigrama?

Un bigrama es un par de palabras consecutivas. En la oración "the cat sat on the mat", los bigramas son:

```
(the, cat), (cat, sat), (sat, on), (on, the), (the, mat)
```

Cada par representa una transición de una palabra a la siguiente. Al contar todas las transiciones del corpus, construyes un modelo estadístico de secuencias de palabras.

### Construir el dict anidado

La tabla de bigramas es un dict de dicts. La clave externa es la palabra actual; el dict interno asigna las palabras seguidoras a sus recuentos:

```python
def build_bigrams(tokens):
    bigrams = {}
    for i in range(len(tokens) - 1):
        current = tokens[i]
        next_word = tokens[i + 1]
        if current not in bigrams:
            bigrams[current] = {}
        bigrams[current][next_word] = bigrams[current].get(next_word, 0) + 1
    return bigrams
```

Recorre la lista de tokens con una ventana deslizante de tamaño 2. Para cada par `(tokens[i], tokens[i+1])`, incrementa el recuento en `bigrams[tokens[i]][tokens[i+1]]`.

### Ejemplo paso a paso

Para los tokens `["the", "cat", "sat", "the", "dog"]`:

```
i=0: current="the", next="cat" → bigrams["the"]["cat"] = 1
i=1: current="cat", next="sat" → bigrams["cat"]["sat"] = 1
i=2: current="sat", next="the" → bigrams["sat"]["the"] = 1
i=3: current="the", next="dog" → bigrams["the"]["dog"] = 1
```

Resultado:
```python
{
    "the": {"cat": 1, "dog": 1},
    "cat": {"sat": 1},
    "sat": {"the": 1},
}
```

### Usar defaultdict para un código más limpio

```python
from collections import defaultdict

def build_bigrams(tokens):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    return dict(bigrams)
```

La expresión `lambda: defaultdict(int)` crea un dict interno nuevo automáticamente para cada palabra, así que nunca necesitas comprobar si una clave existe.

### Inspeccionar la tabla de bigramas

Verifica que tu tabla tenga buena pinta:

```python
bigrams = build_bigrams(tokens)

# How many words have followers?
print(f"Words with followers: {len(bigrams)}")

# Show the top word's followers
top_word = max(bigrams, key=lambda w: sum(bigrams[w].values()))
print(f"Most connected word: '{top_word}'")
print(f"  Followers: {bigrams[top_word]}")
```

### Límites de oración

Al construir bigramas a partir de varias oraciones, la última palabra de una oración y la primera de la siguiente se convierten en un bigrama. Esto suele estar bien para un modelo pequeño — el modelo no sabe nada de la estructura de oraciones de todos modos. Pero si quieres resultados más limpios, puedes añadir marcadores de límite de oración:

```python
def build_bigrams(tokens, add_boundaries=True):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    if add_boundaries:
        bigrams["<END>"] = defaultdict(int)
        bigrams[tokens[-1]]["<END>"] = bigrams[tokens[-1]].get("<END>", 0) + 1
    return dict(bigrams)
```

Esto te permite rastrear qué palabras suelen terminar oraciones.

## Inténtalo

Construye una tabla de bigramas a partir del corpus y responde:
1. ¿Cuántos pares de bigramas únicos existen?
2. ¿Cuáles son los 3 pares (palabra, seguidor) más comunes?
3. ¿Tiene "the" más seguidores que cualquier otra palabra?

```python
from collections import defaultdict

texts = load_corpus("slm-corpus.csv")
tokens = tokenize(" ".join(texts))
bigrams = build_bigrams(tokens)

total_pairs = sum(sum(f.values()) for f in bigrams.values())
print(f"Unique bigram pairs: {total_pairs}")
```

## Conclusiones clave

- Un bigrama es un par de palabras consecutivas — el modelo de secuencias más simple
- La tabla de bigramas es un dict anidado: `bigrams[word] = {seguidor: recuento}`
- `defaultdict(lambda: defaultdict(int))` simplifica el conteo anidado
- Los límites de oración se pueden rastrear con tokens especiales como `<END>`

## Reto de práctica

Escribe una función `most_common_bigram(bigrams)` que devuelva el par `(palabra, seguidor)` más frecuente como tupla. Luego úsala para encontrar el bigrama más común del corpus.

```python
def most_common_bigram(bigrams):
    best = (None, None)
    best_count = 0
    for word, followers in bigrams.items():
        for follower, count in followers.items():
            if count > best_count:
                best = (word, follower)
                best_count = count
    return best, best_count
```