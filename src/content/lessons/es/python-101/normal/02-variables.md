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

## ¿Por qué necesita un valor un nombre?

Escribe un programa que calcule la media de tres puntuaciones de un control:

$$
\bar{x} = \frac{7.5 + 8.5 + 9.0}{3} = \frac{25.0}{3} \approx 8.33.
$$

Ahora supón que cambian las puntuaciones, la profe quiere la media de $9.5, 8.5, 10.0$. Sin nombres, la expresión de la media aparece en varios sitios y tienes que localizar y editar cada uno a mano. Eso es una receta para olvidarse de alguno.

Un matemático resuelve eso *nombrando las cantidades*: escribe $x_1, x_2, x_3$ una vez y refiérete a ellas para siempre. Un programa tiene la misma necesidad: los valores aparecen una y otra vez, y la máquina debe encontrar el actual en cada ocasión. La respuesta de Python es la **variable**, un nombre que apunta a un valor. Una vez que `score1` nombra a $7.5$, puedes escribir `score1` cuantas veces quieras y Python mira su valor actual cada vez.

## `=` ata un nombre a un valor

En matemáticas, "sea $x = 5$" fija el símbolo $x$ al número $5$. Python hace lo mismo con exactamente el mismo símbolo:

```python
score1 = 7.5
score2 = 8.5
score3 = 9.0

average = (score1 + score2 + score3) / 3
print(f"{average:.2f}")    # 8.33
```

El lado derecho se evalúa *primero*, y solo entonces el nombre de la izquierda empieza a apuntar al resultado. Si cambias las puntuaciones y ejecutas el archivo otra vez, el mismo cálculo usará los valores nuevos, los nombres le dan a la máquina un sitio donde buscar "el valor actual de $7.5$".

## Los nombres se pueden redirigir

Aquí es donde una variable *no* se parece a un símbolo matemático. En matemáticas, $x = x + 1$ es una afirmación sin solución. En Python es una instrucción perfectamente normal, que se lee de derecha a izquierda:

$$
x_{n+1} = x_n + 1
$$

dice "el siguiente valor de $x$ es el actual, más uno". En cuanto ves esto en Python, estás contando:

```python
count = 0
count = count + 1    # se leyó el valor anterior 0, se calculó 1, el nombre apunta ahora a 1
count = count + 1    # ahora count nombra a 2
```

Reasignar es *redirigir una etiqueta*, no llenar una caja. El valor antiguo no se "cambia" ni se "reemplaza", el nombre simplemente mira a otro valor distinto.

## Leer-actualizar-guardar es un solo gesto: `+=`

El patrón anterior, leer `count`, sumar `1`, apuntar `count` al resultado, es tan común que Python tiene una abreviatura. Digamos que el paso es $h$ y que te mueves por una sucesión genérica:

$$
x_{n+1} = x_n + h.
$$

Escrita, la actualización es `x = x + h`. Python fusiona la lectura y el guardado en un solo operador:

```python
x = 5
x += 1     # igual que x = x + 1   -> 6
x -= 2     # igual que x = x - 2   -> 4
x *= 3     # igual que x = x * 3   -> 12
x /= 4     # igual que x = x / 4   -> 3.0
```

Lee `x += h` en voz alta como *"avanza x en h"*, un solo movimiento, como hace la recurrencia.

## Un nombre que puedas decir en voz alta

Casi cualquier palabra vale como nombre, pero que algo sea *válido* no es lo mismo que sea *bueno*. ¿Qué resulta más informativo al leer un guion de notas?

```python
x = 87.5                 # nombra un número, nada más
quiz_score = 87.5        # nombra la cantidad
```

Unas pocas reglas y un hábito:

- Un nombre empieza con una letra o un guion bajo y solo puede contener letras, dígitos y guiones bajos, `second_score` ✓, `2nd_score` ✗.
- La convención de Python es **snake_case**: palabras en minúscula unidas por `_`, como `student_name`, no `studentName`. Coincide con cómo se leen en voz alta: `quiz_score` es la puntuación del control.
- Un pequeño conjunto de palabras está **reservado**, `if`, `for`, `class`, `True`, `False`, y no puede usarse como nombre.

Releerás tu propio código más veces de las que lo escribes; el nombre que eliges al escribir es lo que devuelve el significado cuando lo lees después.

## Un ejemplo resuelto: el total acumulado

Reasignar paga en cuanto una cantidad debe construirse paso a paso, la recurrencia $x_{n+1} = x_n + h$ con la suma en curso como $x_n$:

```python
total = 0
total += 8.5     # total pasa a 8.5
total += 9.0     # luego a 17.5
total += 10.0    # luego a 27.5
average = total / 3
print(f"{average:.2f}")   # 9.17
```

Cada `+=` avanza un paso: lee el valor actual, suma, y vuelve a apuntar el nombre al resultado. Los nombres `total` y `average` mantienen distintas las dos cantidades, así la receta se lee como lo que hace.

## Errores comunes

- **Usar una palabra reservada como nombre.** `class = "Math"` lanza un `SyntaxError`, `class` está reservado.
- **Empezar con un dígito.** `2nd_place = "B"` es inválido; `second_place = "B"` es correcto.
- **Confundir `=` y `==`.** `=` apunta un nombre a un valor; `==` pregunta si dos valores son iguales. El desliz de un carácter convierte una afirmación en una pregunta.
- **`+=` escribe sobre un nombre que ya debe existir.** `total += 1` sobre un nombre nunca asignado lanza un `NameError`. El gesto lee primero el valor actual; un nombre sin valor no tiene nada que leer.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Si `x = 5` y luego `y = x`, y después `x = 10`, ¿cuánto vale `y`? Explícalo en términos de "los nombres apuntan a valores" y no de "las cajas contienen valores".

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>y</code> sigue siendo <code>5</code>. Cuando se ejecutó <code>y = x</code>, ambos nombres apuntaban a <code>5</code>. Redirigir <code>x</code> hacia <code>10</code> mueve la etiqueta de <code>x</code>; <code>y</code> sigue apuntando a <code>5</code>. Las etiquetas apuntan; nada se "copia en una caja".</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe un programa que intercambie dos variables: `a = 7`, `b = 3`. Tras el intercambio, `a` debe valer `3` y `b` debe valer `7`. Hazlo sin variable temporal (Python tiene un truco elegante).

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>a, b = b, a</code>, Python evalúa primero el lado derecho (ambos valores antiguos) y luego apunta los nombres de la izquierda a ellos. Sin variable temporal.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

¿Cuáles de estos nombres de variable son válidos y por qué fallan los inválidos: `_count`, `2nd`, `my-name`, `total`, `class`?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>_count</code> ✓ (empezar con guion bajo vale), <code>2nd</code> ✗ (empieza con dígito), <code>my-name</code> ✗ (el guion es el operador de resta, no se permite en un nombre), <code>total</code> ✓, <code>class</code> ✗ (palabra reservada).</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué Python elige `snake_case` en lugar de `camelCase`? ¿Qué sugiere la metáfora visual del guion bajo sobre cómo leer los nombres de variable?
- `x += 1` y `x = x + 1` dan el mismo resultado para números. ¿Se te ocurre una razón por la que un lenguaje ofrezca las dos formas?
- Si las variables son *etiquetas, no cajas*, ¿qué ocurre cuando escribes `a = [1, 2, 3]`, luego `b = a` y después `b.append(4)`? ¿Ve `a` el `4`? (Pruébalo, esto anticipa los objetos mutables, que se ven mucho más adelante.)

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-variables">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Cuánto vale y después de: x = 10; y = x; x = 20?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">20</button>
      <button class="quiz-q__opt" data-idx="1">10 y 20</button>
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
    <p class="quiz-q__prompt">3. ¿Qué vale x después de: x = 5; x += 3; x -= 1?</p>
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