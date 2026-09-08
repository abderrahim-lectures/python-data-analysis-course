---

title: "Fundamentos de tokenización"
description: "Construye una función tokenize() que divida el texto crudo en tokens de palabras limpios usando solo métodos de cadenas."
module: "tokenization-frequency"
order: 3
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Escribir una función tokenize(text) usando str.lower(), str.split() y str.strip()"
  - "Eliminar la puntuación del texto antes de dividirlo"
  - "Comprender por qué las decisiones de tokenización afectan la salida del modelo"
  - "Comparar diferentes estrategias de tokenización y sus pros y contras"
prerequisites: ["02-exploring-corpus"]
tags: ["python", "tokenización", "métodos-de-cadenas", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "¿Qué hace text.lower().split()?"
    options:
      - text: "Divide por puntuación y luego pasa a minúsculas"
      - text: "Pasa a minúsculas y luego divide por espacios en blanco"
        correct: true
      - text: "Divide por espacios en blanco y luego elimina la puntuación"
      - text: "Pasa a minúsculas y elimina todos los caracteres no alfabéticos"
  - question: "¿Por qué reemplazamos la puntuación con espacios en lugar de simplemente eliminarla?"
    options:
      - text: "Es más rápido"
      - text: "Eliminarla juntaría palabras adyacentes"
        correct: true
      - text: "Los espacios son necesarios para que funcione split()"
      - text: "Conserva la longitud original del texto"
  - question: "¿Qué token produce la cadena can't con nuestra función tokenize()?"
    options:
      - text: "cant"
      - text: "cant"
      - text: "can, t"
        correct: true
      - text: "can, t"
---
Del texto crudo a los tokens

El texto crudo es solo una cadena de caracteres. Para construir un modelo de lenguaje, necesitas dividirlo en unidades discretas — **tokens** — que el modelo pueda contar y predecir. Por simplicidad, usaremos palabras como tokens. Los modelos más avanzados usan tokens de subpalabras (BPE, SentencePiece), pero la tokenización a nivel de palabra basta para demostrar las ideas centrales.

## Conceptos clave

### El tokenizador más simple

El enfoque más básico es `str.split()`:

```python
text = "The cat sat on the mat"
tokens = text.split()
print(tokens)  # ['The', 'cat', 'sat', 'on', 'the', 'mat']
```

Esto funciona, pero observa: "The" y "the" se tratan como tokens diferentes por las mayúsculas. Para un modelo basado en frecuencias, queremos que se cuenten como la misma palabra.

### Pasar a minúsculas

Convertir todo a minúsculas fusiona las variantes con mayúsculas:

```python
text = "The cat sat on the Mat"
tokens = text.lower().split()
print(tokens)  # ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

Ahora "The" y "Mat" corresponden a los mismos tokens que "the" y "mat" en cualquier otro lugar del corpus.

### Eliminar la puntuación

La puntuación unida a las palabras crea tokens falsos — "hola," y "hola" se convierten en palabras distintas. Elimínala antes de dividir:

```python
import string

def strip_punctuation(text):
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text

text = "Hello, world! How's it going?"
clean = strip_punctuation(text)
print(clean.lower().split())
# ['hello', 'world', 'how', 's', 'it', 'going']
```

Cada carácter de puntuación se reemplaza con un espacio, y luego dividir da tokens limpios. Observa que "How's" se convierte en dos tokens: "how" y "s". Esta es una desventaja conocida de la tokenización simple — las herramientas más avanzadas manejan las contracciones de otra manera.

### Combinar en una función tokenize()

Júntalo todo:

```python
import string

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text.split()

# Test it
sample = "The quick brown fox jumps over the lazy dog."
print(tokenize(sample))
# ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog']
```

Esta función hace tres cosas en secuencia: pasar a minúsculas, eliminar la puntuación y dividir por espacios en blanco. Es simple, rápida y suficiente para un modelo de lenguaje pequeño.

### Por qué importa la tokenización

Las diferentes estrategias de tokenización producen vocabularios diferentes y comportamientos distintos del modelo:

| Entrada | Resultado del split | Resultado en minúsculas |
|---------|---------------------|-------------------------|
| "New York" | ["New", "York"] | ["new", "york"] |
| "can't" | ["can't"] | ["can't"] |
| "hello,world" | ["hello,world"] | ["hello,world"] |

El último ejemplo muestra un problema: sin eliminar primero la puntuación, "hello,world" permanece como un solo token. Nuestro paso `strip_punctuation` se encarga de esto. No existe una única tokenización "correcta" — depende de lo que tu modelo necesite aprender.

## Inténtalo

Tokeniza el siguiente texto y cuenta los tokens resultantes:

```python
text = "To be, or not to be, that is the question. To be is to exist."
tokens = tokenize(text)
print(f"Tokens: {tokens}")
print(f"Count: {len(tokens)}")
```

¿Cuántos tokens únicos obtienes? ¿Qué palabra aparece con más frecuencia?

## Conclusiones clave

- `str.split()` divide por espacios en blanco — el tokenizador más simple
- Pasar a minúsculas fusiona las variantes con mayúsculas, así que "The" y "the" cuentan como un solo token
- Eliminar la puntuación evita que tokens como "hello," y "hello" sean diferentes
- La tokenización es una decisión de diseño — no hay una única respuesta correcta para todos los modelos

## Reto de práctica

Extiende `tokenize()` para que también elimine los tokens numéricos (palabras que son solo dígitos). Escribe una prueba:

```python
import string

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    tokens = text.split()
    return [t for t in tokens if not t.isdigit()]

sample = "I have 3 cats and 2 dogs in year 2024"
print(tokenize(sample))
# ['i', 'have', 'cats', 'and', 'dogs', 'in', 'year']
```