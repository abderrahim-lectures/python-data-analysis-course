---
title: "Range, Enumerate y Zip"
description: "Genera secuencias de números, rastrea índices y combina iterables."
module: "control-flow"
order: 10
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar range() para generar secuencias de números"
  - "Usar enumerate() para obtener índice + valor durante la iteración"
  - "Usar zip() para iterar sobre varias secuencias en paralelo"
  - "Escribir bucles pitónicos que eviten el rastreo manual de índices"
prerequisites: ["09-for-while-loops"]
tags: ["range", "enumerate", "zip", "iteración"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Range

`range()` genera una secuencia de enteros — útil para repetir código un número específico de veces:

```python
for i in range(5):
    print(i)  # 0 1 2 3 4
```

Tres formas:

```python
range(5)       # 0, 1, 2, 3, 4
range(2, 8)    # 2, 3, 4, 5, 6, 7
range(0, 20, 3) # 0, 3, 6, 9, 12, 15, 18
```

`range` es perezoso — no crea todos los números de una vez. Esto la hace eficiente en memoria para secuencias grandes.

## Enumerate

`enumerate()` añade un contador a cualquier iterable, para que no necesites variables de índice manuales:

```python
fruits = ["apple", "banana", "cherry"]

# Clunky:
i = 0
for fruit in fruits:
    print(f"{i}: {fruit}")
    i += 1

# Pythonic:
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# Start counting from 1:
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}: {fruit}")
```

## Zip

`zip()` combina varios iterables, emparejando los elementos por posición:

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 85
# Bob: 92
# Charlie: 78
```

Se detiene en el iterable más corto de forma predeterminada, o usa `itertools.zip_longest` para llegar hasta el más largo.

## Errores comunes

- **Olvidar que `range` es exclusiva** en el extremo superior: `range(5)` da 0–4, no 0–5
- **Usar `enumerate` sobre un `dict`** — iterar un dict da las claves por defecto; usa `.items()` para obtener pares clave-valor
- **Combinar con zip longitudes desiguales** — pierdes elementos en silencio; considera `zip_longest` con un valor de relleno

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Usa `enumerate` para imprimir cada elemento de `colors = ["red", "green", "blue"]` con su posición empezando en 1.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>for i, color in enumerate(colors, 1): print(f"{i}. {color}")</code></p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Dados `keys = ["a", "b"]` y `values = [1, 2]`, usa `zip` para crear un diccionario.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>dict(zip(keys, values))</code> → <code>{"a": 1, "b": 2}</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué se prefiere `range` a crear una lista `[0, 1, 2, 3, 4]`? ¿Qué ocurre cuando necesitas un millón de números?
- Si `zip` se detiene en el iterable más corto, ¿cómo detectarías qué entradas eran más cortas? ¿Cuándo importaría eso?
- ¿Puedes usar `enumerate` sobre un `dict`? ¿Qué representan los índices?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-range-enumerate-zip">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué es <code>list(range(1, 10, 2))</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2, 3, 4, 5, 6, 7, 8, 9]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 3, 5, 7, 9]</button>
      <button class="quiz-q__opt" data-idx="2">[2, 4, 6, 8]</button>
      <button class="quiz-q__opt" data-idx="3">[1, 2, 4, 8]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Qué devuelve <code>list(zip([1, 2], [3, 4, 5]))</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[(1, 3), (2, 4), (5,)]</button>
      <button class="quiz-q__opt" data-idx="1">[(1, 3, 5), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="2">[(1, 3), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="3">[(1, 2), (3, 4, 5)]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>