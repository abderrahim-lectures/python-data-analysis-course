---
title: "Listas y tuplas"
description: "Domina las secuencias ordenadas de Python — listas mutables y tuplas inmutables."
module: "data-structures"
order: 15
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Crear y acceder a listas y tuplas"
  - "Usar métodos de lista: append, extend, pop, sort, reverse"
  - "Comprender la inmutabilidad de las tuplas y cuándo usarlas"
  - "Desempaquetar secuencias con asignación y *rest"
prerequisites: ["14-string-slicing"]
tags: ["listas", "tuplas", "append", "sort", "desempaquetado"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Listas

Las listas son secuencias ordenadas y mutables:

```python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])       # apple
print(fruits[-1])      # cherry
print(fruits[0:2])     # ['apple', 'banana']
```

## Métodos de lista

```python
nums = [3, 1, 4, 1, 5]
nums.append(9)       # [3, 1, 4, 1, 5, 9]
nums.insert(0, 0)    # [0, 3, 1, 4, 1, 5, 9]
nums.extend([2, 6])  # [0, 3, 1, 4, 1, 5, 9, 2, 6]
nums.pop()           # removes 9, returns it
nums.remove(1)       # removes first 1
nums.sort()          # sorts in place
nums.reverse()       # reverses in place
len(nums)            # current length
```

## Modificar en su lugar frente a devolver algo nuevo

Algunos métodos modifican la lista (`append`, `sort`, `reverse`) y devuelven `None`.
Otros devuelven una lista nueva (`sorted()`, `list.copy()`):

```python
nums = [3, 1, 2]
result = nums.sort()   # result is None! nums is now [1, 2, 3]
result = sorted(nums)  # result is [1, 2, 3], nums unchanged
```

## Tuplas

Las tuplas son secuencias ordenadas e **inmutables**:

```python
point = (3, 4)
print(point[0])   # 3
# point[0] = 5   # TypeError!
```

Usa tuplas para datos fijos: coordenadas, colores RGB, filas de base de datos.

## Desempaquetado

Asigna elementos de una secuencia a variables en una línea:

```python
x, y = (3, 4)         # x=3, y=4
a, b, *rest = [1, 2, 3, 4, 5]  # a=1, b=2, rest=[3, 4, 5]
first, *_, last = (1, 2, 3, 4)  # first=1, last=4
```

## Errores comunes

- **`sort()` devuelve None** — asigna el resultado de `sorted()` en su lugar si quieres una lista nueva
- **Copias superficiales**: `a = b` no copia la lista; usa `a = b.copy()` o `a = list(b)`
- **Mezclar tipos**: `[1, "two", 3.0]` funciona pero dificulta razonar sobre el código

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Elimina todos los duplicados de una lista conservando el orden: `[1, 3, 2, 3, 1, 4, 2]` → `[1, 3, 2, 4]`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>list(dict.fromkeys(nums))</code> — un dict conserva el orden de inserción en Python 3.7+.</p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Intercambia dos variables sin variable temporal usando desempaquetado de tuplas.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>a, b = b, a</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Cuándo elegirías una tupla en lugar de una lista? ¿Qué te da la inmutabilidad?
- ¿Por qué `sort()` modifica en su lugar mientras que `sorted()` devuelve una lista nueva? ¿Cuándo preferirías cada uno?
- ¿Cómo funciona `*rest` en el desempaquetado? ¿Puedes usar `*_` para descartar con nombre?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-lists-tuples">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué imprime <code>a = [1, 2]; b = a; b.append(3); print(a)</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 2, 3]</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Cuál es el resultado de <code>a, b, c = [1, 2]</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">a=1, b=2, c=None</button>
      <button class="quiz-q__opt" data-idx="1">a=1, b=2, c=0</button>
      <button class="quiz-q__opt" data-idx="2">ValueError</button>
      <button class="quiz-q__opt" data-idx="3">a=1, b=2, c=[]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>