---
title: "Bucles for y while"
description: "Repite acciones sobre secuencias y hasta que las condiciones cambien."
module: "control-flow"
order: 9
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Iterar sobre listas, cadenas y rangos con bucles for"
  - "Usar bucles while para la repetición basada en condiciones"
  - "Controlar el flujo del bucle con break, continue y pass"
  - "Evitar los bucles infinitos"
prerequisites: ["08-if-elif-else"]
tags: ["for", "while", "bucles", "break", "continue"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Bucles for

Un bucle `for` itera sobre cada elemento de una secuencia:

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
# apple
# banana
# cherry
```

También funciona con cadenas: itera sobre los caracteres:

```python
for letter in "Python":
    print(letter)
```

## Bucles while

Un bucle `while` se ejecuta mientras su condición sea `True`:

```python
count = 0
while count < 5:
    print(count)
    count += 1
# 0 1 2 3 4
```

**Asegúrate siempre de que la condición eventualmente se vuelva `False`**, o crearás un bucle infinito.

## Break y continue

`break` sale del bucle inmediatamente. `continue` salta a la siguiente iteración:

```python
# break — stop at the first even number
for n in [1, 3, 4, 7, 8]:
    if n % 2 == 0:
        print(f"Found even: {n}")
        break

# continue — skip odd numbers
for n in range(6):
    if n % 2 != 0:
        continue
    print(n)  # 0 2 4
```

## Pass

`pass` es un espacio reservado que no hace nada. Úsalo cuando necesites un bloque sintácticamente válido:

```python
for n in range(10):
    if n % 3 == 0:
        pass  # TODO: handle multiples of 3 later
    else:
        print(n)
```

## Errores comunes

- **Bucles `while` infinitos**: olvidar actualizar la variable de condición
- **Modificar una lista durante la iteración**: usa una copia o una comprensión de lista en su lugar
- **`for` con `range(len(...))`**: el código pitónico por lo general itera directamente sobre la secuencia

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe un bucle `for` que imprima los primeros 10 números divisibles entre 3 (3, 6, 9, ..., 30).

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>for i in range(3, 31, 3): print(i)</code> — <code>range(3, 31, 3)</code> empieza en 3, llega hasta 30, avanzando de 3 en 3.</p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe un bucle `while` que pida repetidamente una entrada (simúlalo con una lista) y se detenga cuando vea `"quit"`. Imprime cada entrada.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>inputs = ["hello", "world", "quit"]; i = 0; while i < len(inputs) and inputs[i] != "quit": print(inputs[i]); i += 1</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Cuándo elegirías `while` en lugar de `for`? Da un ejemplo real de cada uno.
- ¿Qué ocurre si modificas una lista dentro de un bucle `for` que la está iterando? ¿Cómo podrías evitar el problema?
- ¿Por qué Python no tiene un bucle `do...while` como C o JavaScript? ¿Cómo lo simularías?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-loops">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué imprime <code>for i in range(0, 10, 3): print(i, end=" ")</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0 1 2 3 4 5 6 7 8 9</button>
      <button class="quiz-q__opt" data-idx="1">0 3 6 9</button>
      <button class="quiz-q__opt" data-idx="2">3 6 9</button>
      <button class="quiz-q__opt" data-idx="3">0 3 6</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Qué palabra clave omite el resto de la iteración actual del bucle?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">break</button>
      <button class="quiz-q__opt" data-idx="1">pass</button>
      <button class="quiz-q__opt" data-idx="2">continue</button>
      <button class="quiz-q__opt" data-idx="3">skip</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>