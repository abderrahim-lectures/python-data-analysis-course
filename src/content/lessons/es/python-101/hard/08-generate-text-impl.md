---

title: "Implementar generate_text()"
description: "Encadena el bucle de muestreo en una función completa que construye una secuencia de palabras a partir del modelo de bigramas."
module: "generate-text"
order: 8
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Escribir una función generate_text(bigrams, start_word, length)"
  - "Encadenar llamadas a sample_next() en un bucle para construir secuencias de palabras"
  - "Manejar los caminos sin salida (sin seguidores conocidos) con elegancia"
  - "Controlar la longitud de salida y depurar la generación con registros"
prerequisites: ["07-sampling-next-word"]
tags: ["python", "función", "generación-de-texto", "bucle", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "¿Cuál es el bucle central de la generación de texto?"
    options:
      - text: "Leer el archivo completo de una vez"
      - text: "Buscar los bigramas de la palabra actual, muestrear la siguiente palabra, repetir"
        correct: true
      - text: "Elegir al azar cualquier palabra del vocabulario"
      - text: "Ordenar todas las palabras alfabéticamente"
  - question: "¿Cómo sabe el generador qué palabras pueden seguir a la palabra actual?"
    options:
      - text: "Adivina según la longitud de la palabra"
      - text: "Busca la tabla de bigramas de la palabra actual"
        correct: true
      - text: "Siempre elige la palabra más frecuente"
      - text: "Lee del archivo original cada vez"
  - question: "¿Qué limita la longitud del texto generado?"
    options:
      - text: "Un número fijo de palabras (num_words)"
        correct: true
      - text: "El tamaño del archivo"
      - text: "El límite de recursión de Python"
      - text: "El número de palabras únicas"
---
Ponlo todo junto

Ya puedes cargar datos, tokenizar, contar palabras, construir bigramas, normalizar probabilidades y muestrear la siguiente palabra. Ahora combina todo esto en una función única que genera texto: elige una palabra inicial, muestrea la siguiente palabra, vuelve a alimentarla y repite hasta haber producido suficientes palabras.

Las celdas siguientes reutilizan las funciones `load_corpus`, `tokenize`, `build_bigrams` y `normalize_bigrams` de las lecciones 01 a 06 y la función `sample_next` de la lección 07. Cada página de lección inicia una sesión de Python nueva, así que ejecuta primero esta celda de configuración:

```python
import csv
import string
import random
from collections import defaultdict

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

def build_bigrams(tokens):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    return dict(bigrams)

def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        if not followers:
            continue
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized

def sample_next(model, current_word):
    if current_word not in model:
        return None
    followers = model[current_word]
    words = list(followers.keys())
    weights = list(followers.values())
    return random.choices(words, weights=weights, k=1)[0]

model = normalize_bigrams(build_bigrams(tokenize(" ".join(texts))))
```

## Conceptos clave

### El bucle de generación

La lógica central es un bucle simple:

```python
import random

def generate_text(model, start_word, length=20):
    word = start_word
    result = [word]

    for _ in range(length - 1):
        next_word = sample_next(model, word)
        if next_word is None:
            break  # dead end
        result.append(next_word)
        word = next_word

    return " ".join(result)
```

Empieza con `start_word`, muestrea la siguiente palabra, agrégala al resultado y conviértela en la nueva palabra actual. Repite `length - 1` veces (la primera palabra ya está en la lista).

### Manejar los caminos sin salida

Cuando `sample_next()` devuelve `None` (la palabra actual no tiene seguidores conocidos), tienes tres opciones. La más simple es detenerse:

```python
import random
random.seed(7)

word = "the"
result = [word]
for _ in range(10):
    next_word = sample_next(model, word)
    if next_word is None:
        break  # dead end — stop
    result.append(next_word)
    word = next_word

print(" ".join(result))
```

Esto produce una salida más corta pero garantiza la corrección. Para una salida más larga, reinicia desde una palabra común:

```python
import random
random.seed(7)

word = "the"
result = [word]
for _ in range(10):
    next_word = sample_next(model, word)
    if next_word is None:
        next_word = random.choice(["the", "and", "to", "of", "a"])  # restart
    result.append(next_word)
    word = next_word

print(" ".join(result))
```

### Elegir una palabra inicial

La palabra inicial da forma drásticamente a la salida. Empezar con "the" produce inglés genérico; empezar con una palabra rara puede producir una salida inusual:

```python
def generate_from_random(model, length=20):
    start = random.choice(list(model.keys()))
    return generate_text(model, start, length)
```

Para más control, deja que la persona usuaria especifique la palabra inicial.

### Probar con una semilla fija

Depurar la generación requiere una salida reproducible. Configura la semilla antes de llamar:

```python
random.seed(42)
print(generate_text(model, "the", length=10))
# Always produces the same output with seed 42
```

### Una versión más robusta

Añade registros para rastrear lo que ocurre:

```python
def generate_text(model, start_word, length=20, verbose=False):
    word = start_word
    result = [word]

    for i in range(length - 1):
        next_word = sample_next(model, word)
        if verbose:
            print(f"  Step {i+1}: '{word}' → '{next_word}'")
        if next_word is None:
            if verbose:
                print(f"  Dead end at step {i+1}")
            break
        result.append(next_word)
        word = next_word

    return " ".join(result)
```

Con `verbose=True`, puedes ver la generación paso a paso.

### Cómo se ve la salida

Al ejecutarlo sobre el corpus:

```python
random.seed(123)
text = generate_text(model, "the", length=15)
print(text)
```

Podría producir algo así:

```
the old man had been a good teacher and he had a
```

La salida no será gramaticalmente perfecta — este es un modelo diminuto con solo contexto de bigramas. Pero captura secuencias reales de palabras en inglés porque las probabilidades de los bigramas provienen de texto real.

## Inténtalo

Genera 5 textos diferentes de longitud 20, cada uno empezando con una palabra distinta:

```python
random.seed(42)
starts = ["the", "a", "he", "she", "it"]
for word in starts:
    text = generate_text(model, word, length=20)
    print(f"\n[{word}] {text}")
```

## Conclusiones clave

- `generate_text()` encadena llamadas a `sample_next()` en un bucle para construir secuencias de palabras
- Los caminos sin salida ocurren cuando una palabra no tiene seguidores conocidos — se maneja deteniéndose o reiniciando
- La selección de la palabra inicial afecta drásticamente la calidad de la salida
- Usa `random.seed()` y `verbose=True` para depurar

## Reto de práctica

Escribe `generate_until(model, start_word, stop_words)` que genere texto hasta que encuentre una palabra de `stop_words` o alcance 50 palabras. Úsala para generar texto que se detenga en palabras que terminan oraciones:

```python
def generate_until(model, start_word, stop_words=None, max_length=50):
    if stop_words is None:
        stop_words = set()
    word = start_word
    result = [word]
    for _ in range(max_length - 1):
        next_word = sample_next(model, word)
        if next_word is None or next_word in stop_words:
            break
        result.append(next_word)
        word = next_word
    return " ".join(result)
```