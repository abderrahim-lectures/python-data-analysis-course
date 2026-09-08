---
title: "Comprensiones"
description: "Construye listas, dicts y sets de forma concisa con la sintaxis de comprensión."
module: "data-structures"
order: 17
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Escribir comprensiones de lista con filtrado y condiciones"
  - "Crear comprensiones de dict y de set"
  - "Usar comprensiones anidadas para estructuras 2D"
  - "Saber cuándo usar una comprensión frente a un bucle normal"
prerequisites: ["16-dicts-and-sets"]
tags: ["comprensiones", "comp-lista", "comp-dict", "comp-set"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Comprensiones de lista

Una forma concisa de crear listas a partir de iterables:

```python
# Regular loop
squares = []
for x in range(6):
    squares.append(x ** 2)

# Comprehension
squares = [x ** 2 for x in range(6)]
# [0, 1, 4, 9, 16, 25]
```

## Filtrar con condiciones

Añade una cláusula `if` para filtrar elementos:

```python
evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]

long_words = [w.upper() for w in ["hi", "hello", "hey"] if len(w) > 2]
# ['HELLO', 'HEY']
```

## If/else en comprensiones

Usa `if...else` **antes** del `for` (es una expresión, no un filtro):

```python
labels = ["even" if x % 2 == 0 else "odd" for x in range(5)]
# ['even', 'odd', 'even', 'odd', 'even']
```

## Comprensiones de dict

```python
squares_dict = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Invert a dict
original = {"a": 1, "b": 2}
inverted = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b'}
```

## Comprensiones de set

```python
lengths = {len(word) for word in ["hello", "hi", "hey"]}
# {2, 3, 5}  (unique lengths)
```

## Comprensiones anidadas

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## Cuándo NO usar comprensiones

- Cuando la lógica es compleja — un bucle `for` normal es más legible
- Cuando necesitas `try/except` dentro del bucle
- Cuando los efectos secundarios importan (imprimir, escribir archivos)

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Usa una comprensión de lista para aplanar `[[1, 2], [3, 4], [5, 6]]` en `[1, 2, 3, 4, 5, 6]`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>[num for row in matrix for num in row]</code></p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Usa una comprensión de dict para asignar palabras a sus longitudes: `["hi", "hello", "hey"]` → `{"hi": 2, "hello": 5, "hey": 3}`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>{w: len(w) for w in words}</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué `if...else` va antes del `for` en una comprensión pero después del `for` en un bucle normal?
- ¿Cuándo una comprensión se vuelve más difícil de leer que un bucle normal? ¿Dónde trazas la línea?
- ¿Puedes usar `await` dentro de una comprensión? ¿Qué sintaxis especial necesitas?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-comprehensions">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Qué produce <code>[x * 2 for x in range(4) if x > 1]</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[0, 2, 4, 6]</button>
      <button class="quiz-q__opt" data-idx="1">[2, 4]</button>
      <button class="quiz-q__opt" data-idx="2">[4, 6]</button>
      <button class="quiz-q__opt" data-idx="3">[0, 2]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ¿Cuál es la comprensión de dict correcta?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{k: v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="1">{k, v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="2">{k: v in items}</button>
      <button class="quiz-q__opt" data-idx="3">dict(k: v for k, v in items)</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>