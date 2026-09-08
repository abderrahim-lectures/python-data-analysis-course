---
title: "Operadores de comparación"
description: "Comprueba igualdad, desigualdad y orden — y encadena comparaciones en una sola expresión."
module: "operators"
order: 6
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar ==, !=, <, <=, >, >= para comparar valores"
  - "Encadenar comparaciones como 0 <= x < 10"
  - "Comprender en qué se diferencia == de is"
  - "Comparar valores de tipos distintos"
prerequisites: ["05-arithmetic"]
tags: ["comparación", "igualdad", "encadenamiento", "bool"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Seis operadores de comparación

Los operadores de comparación producen un `bool` — `True` o `False`:

```python
5 == 5      # True   — equal
5 != 3      # True   — not equal
5 < 10      # True   — less than
5 <= 5      # True   — less than or equal
5 > 10      # False  — greater than
5 >= 5      # True   — greater than or equal
```

## Comparaciones encadenadas

Python te permite encadenar comparaciones como lo harías en matemáticas:

```python
x = 5
0 <= x < 10    # True — both conditions hold
0 <= x < 3     # False — x < 3 fails
```

Esto se evalúa como una sola expresión, no como dos separadas unidas por `and`. Es equivalente a `0 <= x and x < 10`, pero se lee de forma más natural.

## `==` frente a `is`

`==` comprueba la **igualdad de valor** — ¿estas dos cosas tienen el mismo contenido?
`is` comprueba la **identidad** — ¿son exactamente el mismo objeto en memoria?

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b    # True  — same content
a is b    # False — different objects

c = a
a is c    # True  — same object
```

**Regla práctica:** usa siempre `==` para la comparación de valores. Solo usa `is` cuando compruebes `None`:

```python
if x is None:    # correct
if x == None:    # works but non-idiomatic
```

## Comparar tipos distintos

Python permite comparar valores de tipos distintos, pero el resultado puede sorprender:

```python
5 == 5.0      # True  — int and float compared numerically
"5" == 5      # False — string and int are never equal
"5" < 6       # TypeError: '<' not supported between str and int
```

En Python 3, las comparaciones de orden (`<`, `>`) entre tipos incompatibles lanzan un `TypeError`. Solo `==` y `!=` funcionan entre tipos.

## Errores comunes

- **`=` frente a `==`.** `if score = 60:` es un error de sintaxis — Python no te deja asignar dentro de una condición por accidente. Usa `==`.
- **Comparación de punto flotante.** `0.1 + 0.2 == 0.3` es `False` por la imprecisión del punto flotante. Usa `abs((0.1 + 0.2) - 0.3) < 1e-10` en su lugar.
- **`==` con `None`.** `x == None` funciona, pero `x is None` es la forma pitónica.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Predice el resultado de cada uno sin ejecutarlos: `5 == 5.0`, `"5" == 5`, `5 < "6"`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>5 == 5.0</code> → True (igualdad numérica), <code>"5" == 5</code> → False (tipos distintos), <code>5 < "6"</code> → TypeError (la comparación de orden entre int y str no está permitida en Python 3).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe una comparación encadenada que compruebe si un número `n` está entre 1 y 100 inclusive, usando una sola expresión (sin `and`).

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>1 <= n <= 100</code> — la comparación encadenada de Python hace que esto se lea como notación matemática.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

¿Por qué `0.1 + 0.2 == 0.3` evalúa a `False`? ¿Cómo escribirías una comprobación correcta de igualdad de punto flotante?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> 0.1 y 0.2 no tienen representación binaria exacta, así que su suma es 0.30000000000000004, no exactamente 0.3. Comprobación correcta: <code>abs((0.1 + 0.2) - 0.3) < 1e-10</code> — verifica si la diferencia está dentro de una tolerancia mínima.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- Si `a == b` es `True`, ¿significa eso que `a is b` también debe ser `True`? ¿Bajo qué circunstancias pueden dos objetos ser iguales pero no idénticos?
- ¿Por qué Python prohíbe `5 < "6"` pero permite que `5 == "5.0"` sea `False`? ¿Qué principio de diseño está en juego?
- ¿En qué escenarios podría `is` ser más útil que `==` para comprobar la igualdad? (Piensa en singletons como `None`.)

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-comparison">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. ¿Qué es 5 == 5.0?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">TypeError</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿A qué evalúa 0 <= 5 < 10?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">False</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. ¿Cuál es la forma pitónica de comprobar si x es None?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x == None</button>
      <button class="quiz-q__opt" data-idx="1">x is None</button>
      <button class="quiz-q__opt" data-idx="2">x = None</button>
      <button class="quiz-q__opt" data-idx="3">None is x</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>