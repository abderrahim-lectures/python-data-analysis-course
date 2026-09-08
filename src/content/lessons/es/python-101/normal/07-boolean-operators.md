---
title: "Operadores booleanos"
description: "Combina condiciones con and, or y not — las conectivas lógicas de Python."
module: "operators"
order: 7
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar and, or y not para combinar expresiones booleanas"
  - "Comprender la evaluación por cortocircuito"
  - "Aplicar las leyes de De Morgan en Python"
  - "Escribir condiciones complejas con claridad"
prerequisites: ["06-comparison-operators"]
tags: ["booleano", "and", "or", "not", "cortocircuito", "lógica"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Tres operadores booleanos

Python tiene `and`, `or` y `not` — las conectivas lógicas de la lógica proposicional:

```python
True and True      # True
True and False     # False
False or True      # True
not True           # False
```

## Combinar condiciones

Son más útiles junto con los operadores de comparación:

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Welcome in")

temperature = 30
if temperature < 0 or temperature > 40:
    print("Extreme weather!")

is_weekend = False
if not is_weekend:
    print("Time to work")
```

## Evaluación por cortocircuito

Python evalúa `and` y `or` de izquierda a derecha y **se detiene en cuanto el resultado queda determinado**:

- `A and B` — si `A` es `False`, `B` nunca se evalúa (el resultado ya es `False`)
- `A or B` — si `A` es `True`, `B` nunca se evalúa (el resultado ya es `True`)

```python
x = 0
# This is safe — division never happens because 0 is falsy
result = x != 0 and 10 / x > 2
```

Por eso Python usa palabras (`and`, `or`) en lugar de símbolos (`&&`, `||`): el comportamiento de cortocircuito te permite protegerte de errores sin instrucciones `if` extra.

## Las leyes de De Morgan

Las identidades de la lógica se aplican directamente en Python:

- `not (A and B)` ≡ `(not A) or (not B)`
- `not (A or B)` ≡ `(not A) and (not B)`

```python
# These are equivalent:
not (age >= 18 and has_ticket)
age < 18 or not has_ticket
```

Es útil para simplificar condiciones negadas complejas.

## Tablas de verdad

| `A` | `B` | `A and B` | `A or B` |
|-----|-----|-----------|----------|
| True | True | True | True |
| True | False | False | True |
| False | True | False | True |
| False | False | False | False |

`not` simplemente invierte: `not True` → `False`, `not False` → `True`.

## Errores comunes

- **`and`/`or` no devuelven `True`/`False` — devuelven uno de los operandos.** `0 and 5` devuelve `0`, no `False`. `0 or 5` devuelve `5`, no `True`. Python usa el valor "truthy/falsy", no un booleano.
- **Olvidar la precedencia de `not`.** `not a == b` se parsea como `not (a == b)`, no como `(not a) == b`. Usa paréntesis ante la duda.
- **Usar `and`/`or` en lugar de `&`/`|` bit a bit.** `True and False` es `False`, pero `True & False` lanza un error. Usa `and`/`or` para booleanos y `&`/`|` para bits.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Sin ejecutarlo, predice: `0 and 5`, `0 or 5`, `3 and 5`, `3 or 5`. ¿Qué patrón observas?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>0 and 5</code> → 0, <code>0 or 5</code> → 5, <code>3 and 5</code> → 5, <code>3 or 5</code> → 3. Patrón: <code>and</code> devuelve el primer valor falsy (o el último valor si todos son truthy); <code>or</code> devuelve el primer valor truthy (o el último valor si todos son falsy).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Reescribe `not (x > 5 and y < 10)` usando la ley de De Morgan. ¿La versión reescrita se lee más fácil?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>not (x > 5 and y < 10)</code> ≡ <code>x <= 5 or y >= 10</code> — se lee directamente sin negar una expresión compuesta.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe una condición que compruebe si un año es bisiesto: divisible entre 4, excepto los años de siglo (divisibles entre 100) a menos que también sean divisibles entre 400. Usa `and`, `or` y `not` para expresarlo con claridad.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)</code> — divisible entre 4 pero no entre 100, O divisible entre 400.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- `0 and 5` devuelve `0`, no `False`. ¿Por qué Python devuelve el valor real en lugar de convertirlo a booleano? ¿Cuándo es útil este comportamiento?
- Si `or` devuelve el primer valor truthy, ¿qué devuelve `"hello" or "world"`? ¿Y `"" or "world"`?
- ¿Por qué Python usa palabras (`and`, `or`, `not`) en lugar de símbolos (`&&`, `||`, `!`)? ¿Qué beneficio aporta esto a la legibilidad?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-boolean">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué es True and False?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">None</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ¿A qué evalúa 0 or 5?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">False</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">3. ¿Cuál es equivalente a not (a and b)?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">not a and not b</button>
      <button class="quiz-q__opt" data-idx="1">a or b</button>
      <button class="quiz-q__opt" data-idx="2">not a or not b</button>
      <button class="quiz-q__opt" data-idx="3">a and not b</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>