---

title: "Muestrear la siguiente palabra"
description: "Usa random.choices() para elegir la siguiente palabra de una distribución de probabilidad ponderada por probabilidades de bigramas."
module: "generate-text"
order: 7
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Usar random.choices(población, pesos) para realizar una selección aleatoria ponderada"
  - "Comprender cómo los pesos influyen en la probabilidad de cada resultado"
  - "Configurar una semilla aleatoria para resultados reproducibles"
  - "Muestrear de una tabla de bigramas para elegir la siguiente palabra dada la palabra actual"
prerequisites: ["06-normalizing-bigrams"]
tags: ["python", "random", "muestreo", "ponderado", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "¿Qué hace random.choices() para el muestreo de palabras?"
    options:
      - text: "Elige una palabra al azar"
      - text: "Selecciona una palabra ponderada por probabilidad"
        correct: true
      - text: "Ordena las palabras por frecuencia"
      - text: "Elimina las palabras duplicadas"
  - question: "¿Por qué usar pesos en lugar de probabilidades iguales para muestrear?"
    options:
      - text: "Es más rápido"
      - text: "Las palabras más frecuentes deberían tener más probabilidad de ser elegidas"
        correct: true
      - text: "Usa menos memoria"
      - text: "Hace que la salida sea más corta"
  - question: "¿Qué ocurre si muestreas con pesos=[0.5, 0.3, 0.2]?"
    options:
      - text: "Cada palabra tiene la misma probabilidad"
      - text: "La primera palabra tiene 50 % de probabilidad, la segunda 30 %, la tercera 20 %"
        correct: true
      - text: "Las palabras se ordenan por peso"
      - text: "Solo se elige siempre la primera palabra"
---
El motor de la generación de texto

La generación de texto es, en esencia, un problema de muestreo. Dada una palabra actual, necesitas elegir la siguiente palabra de una distribución de posibilidades — algunas palabras son probables, otras raras, pero todas son posibles. `random.choices()` hace exactamente esto.

## Conceptos clave

### Fundamentos de random.choices()

`random.choices()` elige uno o más elementos de una lista, ponderados por sus probabilidades:

```python
import random

words = ["cat", "dog", "bird"]
weights = [0.5, 0.3, 0.2]  # probabilities must sum to 1

# Pick one word
result = random.choices(words, weights=weights, k=1)
print(result[0])  # e.g. 'cat'
```

El parámetro `k` controla cuántos elementos elegir. Para la generación de texto, eliges una palabra a la vez.

### Muestreo repetido

Para ver la distribución en acción, muestrea muchas veces:

```python
import random

words = ["cat", "dog", "bird"]
weights = [0.5, 0.3, 0.2]

counts = {w: 0 for w in words}
for _ in range(1000):
    pick = random.choices(words, weights=weights, k=1)[0]
    counts[pick] += 1

print(counts)
# e.g. {'cat': 502, 'dog': 298, 'bird': 200}
```

Con 1000 muestras, "cat" debería aparecer aproximadamente 500 veces (50 %), "dog" unas 300 veces (30 %) y "bird" unas 200 veces (20 %).

### Muestrear del modelo de bigramas

Dada una palabra actual, busca sus seguidores en el modelo normalizado y muestrea:

```python
def sample_next(model, current_word):
    if current_word not in model:
        return None  # no followers known
    followers = model[current_word]
    words = list(followers.keys())
    weights = list(followers.values())
    return random.choices(words, weights=weights, k=1)[0]

# Example
current = "the"
next_word = sample_next(model, current)
print(f"After '{current}' comes '{next_word}'")
```

Si la palabra actual no está en el modelo (no tiene seguidores conocidos), devuelve `None`. Quien llama debe manejar esto — ya sea detener la generación o elegir una palabra aleatoria para continuar.

### Reproducibilidad con semillas

`random.choices()` usa el estado aleatorio global de Python. Configurar una semilla hace que la salida sea reproducible — útil para depurar y probar:

```python
random.seed(42)
print(sample_next(model, "the"))  # always the same word with seed 42

random.seed(99)
print(sample_next(model, "the"))  # might be different
```

### Manejar el caso límite: sin seguidores

Algunas palabras solo aparecen al final del corpus y no tienen seguidores conocidos. Cuando `sample_next` devuelve `None`, tienes opciones:

1. **Detener la generación** — la opción más conservadora
2. **Reiniciar desde una palabra aleatoria** — mantiene la salida en marcha
3. **Reiniciar desde una palabra común** — elige de las N palabras más frecuentes

La opción 3 suele producir los mejores resultados:

```python
import random

top_words = ["the", "and", "to", "of", "a"]

def sample_next_or_restart(model, current_word):
    result = sample_next(model, current_word)
    if result is None:
        return random.choice(top_words)  # restart
    return result
```

## Inténtalo

Carga el modelo de bigramas normalizado y muestrea la siguiente palabra 10 veces después de "the":

```python
random.seed(42)
model = load_model("bigram_model.json")  # from previous lesson

for _ in range(10):
    next_word = sample_next(model, "the")
    print(f"the → {next_word}")
```

¿Qué tan consistentes son los resultados? Prueba a cambiar la semilla — ¿obtienes palabras diferentes?

## Conclusiones clave

- `random.choices(población, pesos, k=1)` realiza una selección aleatoria ponderada
- Los pesos deben sumar 1.0 para una interpretación correcta de la probabilidad
- `random.seed()` hace que la salida sea reproducible para depurar
- Maneja los seguidores faltantes reiniciando desde una palabra común

## Reto de práctica

Escribe una función `sample_n(model, palabra, n)` que devuelva una lista de n siguientes palabras muestreadas para una palabra actual dada. Úsala para ver la distribución de seguidores de "the":

```python
def sample_n(model, word, n=100):
    results = []
    for _ in range(n):
        results.append(sample_next(model, word))
    from collections import Counter
    return Counter(results).most_common()
```