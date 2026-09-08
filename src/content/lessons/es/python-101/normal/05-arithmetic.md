---
title: "Operadores aritméticos"
description: "Suma, resta, multiplica, divide, división de piso, módulo y exponente — los ocho operadores aritméticos."
module: "operators"
order: 5
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar los ocho operadores aritméticos: +, -, *, /, //, %, **"
  - "Comprender la división de piso frente a la división verdadera"
  - "Aplicar la precedencia de operadores (PEMDAS)"
  - "Usar paréntesis para anular la precedencia"
prerequisites: ["04-type-conversion"]
tags: ["aritmética", "división", "módulo", "exponente", "precedencia"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Los ocho operadores aritméticos

Python tiene los cuatro estándar más cuatro adicionales:

```python
7 + 2    # 9   — addition
7 - 2    # 5   — subtraction
7 * 2    # 14  — multiplication
7 / 2    # 3.5 — true division (always returns float)
7 // 2   # 3   — floor division (rounds toward -∞)
7 % 2    # 1   — modulo (remainder)
7 ** 2   # 49  — exponentiation (7²)
```

## División de piso frente a división verdadera

`/` siempre da un `float`, incluso cuando ambos operandos son enteros y el resultado es un número entero:

```python
4 / 2    # 2.0  — float, not int
```

`//` da el cociente **con piso** — siempre redondea hacia el infinito negativo:

```python
7 // 2    # 3   — floor(3.5)
-7 // 2   # -4  — floor(-3.5) = -4, not -3
```

Esa última línea suele sorprender. La división de piso sigue la función de piso matemática $\lfloor x \rfloor$, que redondea *hacia abajo* (hacia $-\infty$), no hacia cero.

## Módulo: el residuo

`%` da el residuo después de la división de piso. La identidad clave:

```
a == (a // b) * b + (a % b)
```

```python
15 % 4    # 3   — since 15 = 4×3 + 3
15 // 4   # 3
4 * 3 + 3 # 15  ✓
```

## Precedencia de operadores

Python sigue PEMDAS — el mismo orden que conoces de las matemáticas:

1. `**` primero (exponenciación)
2. `*`, `/`, `//`, `%` (de izquierda a derecha)
3. `+`, `-` (de izquierda a derecha)

```python
2 + 3 * 4      # 14, not 20
(2 + 3) * 4    # 20 — parentheses override
2 ** 3 ** 2     # 512, not 64 — ** is right-associative: 2 ** (3 ** 2) = 2 ** 9
```

## Errores comunes

- **`/` frente a `//`.** `7 / 2` es `3.5` (float), `7 // 2` es `3` (entero). Usa `//` cuando quieras un resultado entero.
- **División de piso con negativos.** `-7 // 2` es `-4`, no `-3`. Esto sigue el piso matemático, no el truncamiento.
- **`%` con floats.** `7.5 % 2` es `1.5` — el módulo también funciona con floats, no solo con enteros.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Sin ejecutarlo, calcula `15 // 4` y `15 % 4` a mano. Luego verifica: ¿`4 * (15 // 4) + (15 % 4)` es igual a `15`?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> 15 // 4 es 3 (el piso de 3.75), y 15 % 4 es 3 (ya que 15 = 4·3 + 3). Juntos: 4 × 3 + 3 = 15. Esta es la identidad del algoritmo de división.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

¿Cómo extraerías el dígito de las centenas de un número? Por ejemplo, dado `n = 4567`, extrae `5` usando solo aritmética (sin cadenas).

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>(n // 100) % 10</code> — primero divide por 100 para desplazarlo a la derecha (4567 → 45), luego aplica módulo 10 para obtener el último dígito (45 → 5).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

¿Por qué Python usa `**` para la exponenciación en lugar de `^`? ¿Qué hace realmente `^` en Python? (Pista: no es exponenciación.)

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>^</code> es el operador XOR bit a bit en Python, no exponenciación. Python usa <code>**</code> para evitar ambigüedades con los lenguajes de estilo C, donde <code>^</code> significa XOR.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué la división de piso de Python redondea hacia el infinito negativo en lugar de hacia cero? ¿Qué beneficio práctico te da (pista: piensa en cómo funciona `divmod()`)?
- `2 ** 3 ** 2` es `512`, no `64`. ¿Por qué `**` es asociativo por la derecha cuando `+` y `*` son asociativos por la izquierda?
- ¿Se te ocurre un escenario real donde la aritmética de módulo sea esencial? (Piensa en relojes, días del calendario o indexación de arreglos.)

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-arithmetic">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Qué es -7 // 2?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">-3</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">-4</button>
      <button class="quiz-q__opt" data-idx="3">-3.5</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ¿Cuál es el resultado de 2 ** 3 ** 2?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">512</button>
      <button class="quiz-q__opt" data-idx="1">64</button>
      <button class="quiz-q__opt" data-idx="2">36</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. ¿Qué es 7 % 3?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">2</button>
      <button class="quiz-q__opt" data-idx="1">1</button>
      <button class="quiz-q__opt" data-idx="2">3</button>
      <button class="quiz-q__opt" data-idx="3">0</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>