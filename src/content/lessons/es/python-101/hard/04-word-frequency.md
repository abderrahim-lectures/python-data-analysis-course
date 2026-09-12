---

title: "Conteo de frecuencia de palabras"
description: "Acumula tokens en un dict de frecuencia, extrae estadísticas de vocabulario e identifica las palabras más y menos comunes."
module: "tokenization-frequency"
order: 4
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Construir una función word_frequency(tokens) que cuente las apariciones de tokens en un dict"
  - "Usar dict.get() o collections.defaultdict para contar de forma segura"
  - "Extraer estadísticas de vocabulario: token total, palabras únicas, top-N las más frecuentes"
  - "Comprender la ley de Zipf y por qué unas pocas palabras dominan los recuentos de frecuencia"
prerequisites: ["03-tokenization-basics"]
tags: ["python", "frecuencia", "dict", "vocabulario", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Según la ley de Zipf, la palabra más frecuente en un texto en inglés suele aparecer:"
    options:
      - text: "El 10 % de las veces"
      - text: "Alrededor del 7 % de las veces"
        correct: true
      - text: "El 50 % de las veces"
      - text: "El 1 % de las veces"
  - question: "¿Cuál es el propósito de ordenar los recuentos de palabras en orden descendente?"
    options:
      - text: "Eliminar duplicados"
      - text: "Ver primero las palabras más frecuentes"
        correct: true
      - text: "Contar el total de palabras"
      - text: "Calcular la longitud promedio de las palabras"
  - question: "Si la palabra A aparece 1000 veces y la palabra B aparece 500 veces, ¿cuál es su proporción de frecuencia?"
    options:
      - text: "1:2"
      - text: "2:1"
        correct: true
      - text: "1:1"
      - text: "1000:500"
---
Contar palabras

Una vez que tienes tokens, el siguiente paso es contar con qué frecuencia aparece cada palabra. Estos recuentos de frecuencia le dicen al modelo de lenguaje qué palabras son comunes (probables de aparecer en cualquier parte) y cuáles son raras (predictivas cuando aparecen).

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

full_text = " ".join(texts)
tokens = tokenize(full_text)
```

## Conceptos clave

### Construir un dict de frecuencia

El patrón de conteo usa un dict donde cada clave es una palabra y el valor es su recuento. El método `get()` maneja el caso "es la primera vez que vemos esta palabra":

```python
def word_frequency(tokens):
    freq = {}
    for token in tokens:
        freq[token] = freq.get(token, 0) + 1
    return freq

tokens = ["the", "cat", "sat", "the", "dog", "sat", "the"]
freq = word_frequency(tokens)
print(freq)
# {'the': 3, 'cat': 1, 'sat': 2, 'dog': 1}
```

`freq.get(token, 0)` devuelve el recuento actual si la palabra existe, o `0` si es la primera vez que la vemos. Sumar 1 incrementa el recuento.

### El enfoque con defaultdict

Una alternativa usa `collections.defaultdict`, que crea automáticamente las claves faltantes:

```python
from collections import defaultdict

def word_frequency(tokens):
    freq = defaultdict(int)
    for token in tokens:
        freq[token] += 1
    return dict(freq)
```

Ambos enfoques producen el mismo resultado. La versión con `defaultdict` es un poco más limpia pero requiere un import.

### Estadísticas de vocabulario

Con un dict de frecuencia puedes calcular estadísticas útiles:

```python
freq = word_frequency(tokenize(full_text))

total_tokens = sum(freq.values())
unique_words = len(freq)

print(f"Total tokens: {total_tokens:,}")
print(f"Unique words: {unique_words:,}")
print(f"Vocabulary richness: {unique_words / total_tokens:.4f}")
```

**La riqueza de vocabulario** (únicas / totales) mide cuán diverso es el texto. Un valor cercano a 1.0 significa que casi todas las palabras son únicas; un valor cercano a 0.0 significa una repetición intensa.

### Las palabras más y menos frecuentes

Ordena el dict de frecuencia para encontrar los extremos:

```python
sorted_words = sorted(freq.items(), key=lambda item: item[1], reverse=True)

print("Top 10 words:")
for word, count in sorted_words[:10]:
    print(f"  {word}: {count}")

print("\nBottom 10 words:")
for word, count in sorted_words[-10:]:
    print(f"  {word}: {count}")
```

En la mayoría de los textos en inglés, "the", "of", "and", "to" y "a" dominan la cima de la lista. Esto sigue la **ley de Zipf**, la palabra más frecuente aparece aproximadamente el doble de veces que la segunda, el triple que la tercera, y así sucesivamente.

### Por qué importa la frecuencia para la generación

Un modelo de lenguaje usa la frecuencia para ponderar las predicciones. Si "the" aparece 500 veces y "platypus" aparece 2 veces, "the" debería elegirse con más frecuencia, pero no siempre. El modelo de bigramas refina esto condicionando sobre la palabra anterior, que es lo que hace que el texto generado sea legible en lugar de solo un flujo de "the the the".

## Inténtalo

Carga el corpus, tokenízalo y construye un dict de frecuencia. Luego responde:
1. ¿Cuántos tokens totales hay?
2. ¿Cuáles son las 5 palabras más frecuentes?
3. ¿Qué porcentaje del vocabulario consiste en palabras que aparecen solo una vez?

```python
texts = load_corpus("slm-corpus.csv")
full_text = " ".join(texts)
tokens = tokenize(full_text)
freq = word_frequency(tokens)

total = sum(freq.values())
hapax = sum(1 for w, c in freq.items() if c == 1)
print(f"Total tokens: {total}")
print(f"Words appearing once: {hapax} ({hapax/len(freq)*100:.1f}%)")
```

## Conclusiones clave

- `dict.get(clave, predeterminado)` es la base del conteo de frecuencias
- La riqueza de vocabulario (únicas / totales) mide la diversidad del texto
- Ley de Zipf: un pequeño número de palabras domina la distribución de frecuencias
- Los recuentos de frecuencia son la materia prima para las tablas de probabilidad de bigramas

## Reto de práctica

Escribe una función `top_n(freq, n)` que devuelva las N palabras más frecuentes como una lista de tuplas `(word, count)`. Luego úsala para encontrar las 20 palabras principales del corpus.

```python
def top_n(freq, n):
    return sorted(freq.items(), key=lambda item: item[1], reverse=True)[:n]
```