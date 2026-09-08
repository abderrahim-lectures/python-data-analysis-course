---
title: "Variables y nombres"
description: "Almacena valores bajo nombres, comprende la asignación y sigue las convenciones de nombres de Python."
module: "python-basics"
order: 2
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Asignar valores a variables y reasignarlos"
  - "Explicar por qué las variables son etiquetas, no cajas"
  - "Usar operadores de asignación aumentada (+=, -=, *=, /=)"
  - "Seguir las convenciones de nombres snake_case"
prerequisites: ["01-printing"]
tags: ["variables", "asignación", "nombres", "snake_case"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Variables como nombres para valores

En matemáticas, "sea $x = 5$" vincula un nombre a un valor. Python hace exactamente esto:

```python
x = 5
```

Primero se evalúa el lado derecho (`5`), y luego se apunta el nombre `x` hacia él. A diferencia de las matemáticas, `x` se puede **reasignar**:

```python
x = 5
x = x + 1  # x now names 6
```

Lee `x = x + 1` como "el nuevo valor de $x$ es el valor anterior de $x$ más uno" — igual que leerías una relación de recurrencia $x_{n+1} = x_n + 1$.

## Asignación aumentada

El patrón leer-calcular-guardar-de-nuevo es tan común que Python ofrece una forma abreviada:

```python
x = 5
x += 1     # same as x = x + 1  -> 6
x -= 2     # same as x = x - 2  -> 4
x *= 3     # same as x = x * 3  -> 12
x /= 4     # same as x = x / 4  -> 3.0
```

## Convenciones de nombres

Un nombre (**identificador**) debe empezar con una letra o un guion bajo, y solo puede contener letras, dígitos y guiones bajos después — `2nd_score` es inválido, `second_score` está bien.

La convención de Python es el `snake_case`: palabras en minúsculas separadas por guiones bajos (`student_name`, `total_score`), no `studentName` ni `TotalScore`. Algunas palabras están **reservadas** por el lenguaje (`if`, `for`, `class`, `True`, etc.) y no se pueden usar como nombres de variables.

Los nombres deben describir *qué significa un valor*. `x = 87.5` no le dice nada a quien lea; `quiz_score = 87.5` se lo dice todo. Esto importa más de lo que parece — releerás tu propio código con mucha más frecuencia de la que lo escribes.

## Errores comunes

- **Usar una palabra reservada como nombre.** `class = "Math"` lanza un `SyntaxError` — `class` está reservado.
- **Empezar con un dígito.** `2nd_place = "B"` es inválido; `second_place = "B"` está bien.
- **Confundir `=` y `==`.** `=` asigna; `==` comprueba igualdad. Esto le pasa a todo el mundo, al menos una vez.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Si `x = 5` y luego `y = x`, y después `x = 10`, ¿cuánto vale `y`? Explica por qué en términos de "los nombres apuntan a valores" en lugar de "las cajas contienen valores".

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>y</code> sigue siendo <code>5</code>. Cuando se ejecutó <code>y = x</code>, ambos nombres apuntaban al valor <code>5</code>. Reasignar <code>x</code> a <code>10</code> mueve el puntero de <code>x</code>; <code>y</code> sigue apuntando a <code>5</code>. Los nombres son etiquetas, no cajas.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe un programa corto que intercambie dos variables: `a = 7`, `b = 3`. Después del intercambio, `a` debe ser `3` y `b` debe ser `7`. Hazlo sin una variable temporal (Python tiene un truco elegante para esto).

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>a, b = b, a</code> — Python evalúa primero el lado derecho y luego desempaqueta en el lado izquierdo. No se necesita variable temporal.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

¿Cuáles de estos son nombres de variables válidos? Explica por qué fallan los inválidos: `_count`, `2nd`, `my-name`, `total`, `class`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>_count</code> ✓ (empezar con guion bajo está bien), <code>2nd</code> ✗ (empieza con un dígito), <code>my-name</code> ✗ (el guion no está permitido — es el operador de resta), <code>total</code> ✓, <code>class</code> ✗ (palabra clave reservada).</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué Python usa `snake_case` en lugar de `camelCase`? ¿Qué sugiere la metáfora visual del guion bajo sobre cómo leer los nombres de variables?
- `x += 1` y `x = x + 1` producen el mismo resultado para números. ¿Se te ocurre una razón por la que un lenguaje podría ofrecer ambas formas?
- Si las variables son "etiquetas, no cajas", ¿qué ocurre cuando escribes `a = [1, 2, 3]` y luego `b = a` y después `b.append(4)`? ¿`a` ve el `4`? (Pruébalo — esto anticipa los objetos mutables, que se cubren más adelante.)

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-variables">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Cuál es el valor de y después de: x = 10; y = x; x = 20?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">20</button>
      <button class="quiz-q__opt" data-idx="1">10 and 20</button>
      <button class="quiz-q__opt" data-idx="2">10</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ¿Cuál es un nombre de variable válido en Python?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">_total</button>
      <button class="quiz-q__opt" data-idx="1">2nd</button>
      <button class="quiz-q__opt" data-idx="2">my-var</button>
      <button class="quiz-q__opt" data-idx="3">class</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. ¿A qué evalúa x después de: x = 5; x += 3; x -= 1?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">7</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
      <button class="quiz-q__opt" data-idx="3">3</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>