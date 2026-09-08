---
title: "Tipos de datos"
description: "Identifica los tipos centrales de Python — int, float, str, bool — y comprende qué representa cada uno."
module: "python-basics"
order: 3
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Identificar valores int, float, str y bool"
  - "Usar type() para comprobar el tipo de un valor"
  - "Comprender el tipado dinámico de Python"
  - "Reconocer valores truthy y falsy"
prerequisites: ["02-variables"]
tags: ["tipos", "int", "float", "str", "bool", "tipado-dinámico"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Todo valor tiene un tipo

Un tipo es el conjunto al que pertenece un valor — como en matemáticas, donde distingues enteros de reales:

| Tipo | Analogía matemática | Ejemplo |
|---|---|---|
| `int` | $\mathbb{Z}$ (enteros) | `42`, `-7` |
| `float` | $\mathbb{R}$ (reales, aproximados) | `3.14`, `-0.5` |
| `str` | una secuencia finita de caracteres | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

Comprueba el tipo de un valor con `type(...)`:

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

## Tipado dinámico

Python está **tipado dinámicamente**: un nombre no está atado permanentemente a un solo tipo. `x = 5` y luego `x = "five"` es legal — `x` simplemente apunta a algo nuevo:

```python
x = 5
print(type(x))    # <class 'int'>
x = "hello"
print(type(x))    # <class 'str'>
```

Esto es práctico, pero también significa que el *tipo* de un nombre solo se puede conocer mirando a qué apunta actualmente, no declarándolo de antemano.

## Valores truthy y falsy

`bool()` convierte cualquier valor en `True` o `False`. La regla es simple:

- **Falsy**: `0`, `0.0`, `""` (cadena vacía), `None`
- **Truthy**: todo lo demás

```python
bool(0)         # False
bool(1)         # True
bool(-1)        # True  — any nonzero number is truthy
bool("")        # False
bool("hello")   # True  — any non-empty string is truthy
```

Esto importa cuando escribas condiciones más adelante: `if score:` significa "si score no es cero".

## Errores comunes

- **`4 / 2` es `2.0`, no `2`.** La división verdadera (`/`) siempre devuelve un `float` en Python 3. Usa `4 // 2` para la división entera.
- **`True + True` es `2`.** Los booleanos son subclases de `int` en Python — `True` se comporta como `1` y `False` como `0` en la aritmética.
- **`type()` da el tipo concreto.** `type(True)` es `bool`, no `int`, aunque `True` funcione como `1` en matemáticas.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

¿Qué es `type(7 / 2)`? Predícelo antes de ejecutarlo y luego compruébalo.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>type(7 / 2)</code> es <code>float</code> — la división verdadera (<code>/</code>) siempre produce un float en Python 3, incluso cuando ambos operandos son enteros y el resultado es un número entero.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Predice `bool(0)`, `bool(0.0)`, `bool("")` y `bool("0")`. ¿Cuáles son truthy y cuáles falsy?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>bool(0)</code> → False, <code>bool(0.0)</code> → False, <code>bool("")</code> → False (cadena vacía), <code>bool("0")</code> → True (cadena no vacía, aunque contenga el carácter "0").</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

`0.1 + 0.2` en Python **no** es exactamente igual a `0.3`. Pruébalo. ¿Por qué un `float` — que aproxima $\mathbb{R}$ usando dígitos binarios finitos — podría no representar exactamente $0.1$?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> 0.1 no tiene una representación exacta en binario (igual que 1/3 no tiene una representación decimal exacta). Los floats usan fracciones binarias finitas, así que 0.1 + 0.2 acumula un pequeño error de redondeo: 0.30000000000000004, no 0.3. Esta es una limitación fundamental de la aritmética de punto flotante, no un error de Python.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- Si `bool(-1)` es `True`, ¿qué regla única explica por qué `-1` es truthy pero `0` es falsy?
- Python tiene `isinstance(42, int)` que devuelve `True`. ¿Sería `isinstance` más fiable que `type(x) == int` para comprobar tipos? ¿Por qué o por qué no?
- ¿Por qué Python usa `True` y `False` (con mayúscula inicial) en lugar de `true` y `false`? ¿Qué otras palabras capitalizadas reserva Python?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-types">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Cuál es el tipo de 3.14?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Cuál es el resultado de True + True?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">2</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. ¿Cuál de estos es falsy?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">""</button>
      <button class="quiz-q__opt" data-idx="1">"0"</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">1</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>