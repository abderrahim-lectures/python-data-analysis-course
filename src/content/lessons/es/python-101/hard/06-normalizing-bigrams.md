---

title: "Normalizar recuentos de bigramas"
description: "Convierte los recuentos crudos de bigramas en distribuciones de probabilidad que suman 1.0 para cada palabra."
module: "bigram-tables"
order: 6
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Normalizar los recuentos crudos de bigramas en probabilidades dividiendo por el total de seguidores"
  - "Comprender por qué se necesitan distribuciones de probabilidad para el muestreo ponderado"
  - "Manejar casos límite: recuentos cero, palabras con un solo seguidor, claves faltantes"
  - "Verificar que las probabilidades suman 1.0 para cada palabra"
prerequisites: ["05-building-bigrams"]
tags: ["python", "probabilidad", "normalización", "bigramas", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "¿Por qué normalizar los recuentos de bigramas?"
    options:
      - text: "Para que parezcan porcentajes"
      - text: "Para comparar probabilidades en diferentes contextos"
        correct: true
      - text: "Para reducir el uso de memoria"
      - text: "Para ordenarlos alfabéticamente"
  - question: "¿Qué es P(palabra2 | palabra1) para un bigrama?"
    options:
      - text: "recuento(palabra1, palabra2) / recuento(palabra1)"
        correct: true
      - text: "recuento(palabra1) / recuento(palabra2)"
      - text: "recuento(palabra1, palabra2) / total_palabras"
      - text: "recuento(palabra1) * recuento(palabra2)"
  - question: "Si the aparece 1000 veces y (the, cat) aparece 50 veces, ¿qué es P(cat | the)?"
    options:
      - text: "0.05"
        correct: true
      - text: "0.5"
      - text: "50"
      - text: "0.005"
---
De recuentos a probabilidades

Los recuentos crudos te dicen que "the" → "cat" apareció 15 veces y "the" → "dog" apareció 5 veces. Pero para **muestrear** la siguiente palabra, necesitas probabilidades: "cat" debería elegirse el 75 % de las veces y "dog" el 25 %. Normalizar convierte los recuentos en una distribución donde todos los seguidores suman 1.0.

## Conceptos clave

### Normalizar con un bucle

Para cada palabra, suma los recuentos de sus seguidores y luego divide cada recuento por ese total:

```python
def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized
```

Ahora `normalized["the"]["cat"]` devuelve un float entre 0 y 1 — la probabilidad de que "cat" siga a "the".

### Ejemplo

```python
raw_bigrams = {"the": {"cat": 15, "dog": 5, "bird": 10}}
norm = normalize_bigrams(raw_bigrams)

print(norm["the"])
# {'cat': 0.5, 'dog': 0.1667, 'bird': 0.3333}
```

Las probabilidades suman 1.0:
```python
print(sum(norm["the"].values()))  # 1.0
```

### Por qué importa la normalización para el muestreo

`random.choices()` necesita pesos que representen la probabilidad relativa. Si pasas recuentos crudos (15, 5, 10), funciona — pero tener las probabilidades correctas (0.5, 0.167, 0.333) hace que el modelo sea portable y comparable entre distintos tamaños de corpus.

```python
import random

followers = list(norm["the"].keys())
weights = list(norm["the"].values())
next_word = random.choices(followers, weights=weights, k=1)[0]
print(f"Next word: {next_word}")
```

### Manejar casos límite

Algunas palabras no tienen seguidores (la última palabra del corpus, o palabras que solo aparecen al final de una oración). La tabla de bigramas no tendrá entradas para ellas:

```python
def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        if not followers:
            continue  # skip words with no followers
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized
```

Omitir las entradas vacías evita errores de división por cero.

### Un pipeline completo

Así encaja la normalización en el pipeline completo:

```python
texts = load_corpus("slm-corpus.csv")
tokens = tokenize(" ".join(texts))
bigrams = build_bigrams(tokens)
model = normalize_bigrams(bigrams)

# Check a sample
print(f"Words in model: {len(model)}")
print(f"Followers of 'the': {list(model.get('the', {}).keys())[:5]}")
```

### Guardar el modelo

Es posible que quieras guardar la tabla de bigramas normalizada para reutilizarla. Como es un dict anidado de floats, `json` funciona bien:

```python
import json

with open("bigram_model.json", "w") as f:
    json.dump(model, f)

# Reload later
with open("bigram_model.json") as f:
    model = json.load(f)
```

## Inténtalo

Construye y normaliza la tabla de bigramas, luego verifica:
1. ¿Suman 1.0 las probabilidades de "the"?
2. ¿Cuántas palabras tienen cero seguidores?
3. ¿Cuál es la palabra más probable que siga a "the"?

```python
model = normalize_bigrams(bigrams)
the_followers = model.get("the", {})
top_follower = max(the_followers, key=the_followers.get)
print(f"Most likely after 'the': '{top_follower}' ({the_followers[top_follower]:.3f})")
```

## Conclusiones clave

- La normalización convierte los recuentos crudos en probabilidades que suman 1.0 por palabra
- `random.choices()` usa estas probabilidades como pesos para el muestreo ponderado
- Omite las palabras sin seguidores para evitar la división por cero
- Guarda los modelos normalizados con `json.dump()` para reutilizarlos entre scripts

## Reto de práctica

Escribe una función `bigram_stats(model)` que imprima para cada palabra: la palabra, el número de seguidores y la siguiente palabra más probable. Limita la salida a las 10 palabras principales por recuento total de seguidores.

```python
def bigram_stats(model, top_n=10):
    words = sorted(model, key=lambda w: sum(model[w].values()), reverse=True)
    for word in words[:top_n]:
        followers = model[word]
        total = sum(followers.values())
        best = max(followers, key=followers.get)
        print(f"'{word}': {len(followers)} followers, best=''{best}'' ({followers[best]:.3f})")
```