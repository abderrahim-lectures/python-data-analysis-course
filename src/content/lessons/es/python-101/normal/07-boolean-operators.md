---
title: "Operadores booleanos"
description: "Combina condiciones con and, or, not, los conectores lógicos de Python."
module: "operators"
order: 7
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar and, or y not para combinar expresiones booleanas"
  - "Entender la evaluación de cortocircuito"
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

## Construir condiciones a partir de condiciones

Los operadores de comparación te entregan un solo valor de verdad: `True` o `False`. La puerta del club hace dos preguntas a la vez,*"¿eres mayor de edad y llevas entrada?"*, y esa conjunción es en sí misma una condición. Python, como la lógica que conociste en matemáticas, ofrece los tres conectivos que combinan proposiciones:

- $A \land B$ se escribe `and`
- $A \lor B$ se escribe `or`
- $\lnot A$ se escribe `not`

## Los tres conectivos

Su comportamiento es la tabla de verdad que ya conoces. Escríbela en Python y se lee idéntica:

```python
True and True      # True
True and False     # False
False or True      # True
not True           # False
```

Dónde ganan su sal es pegando comparaciones en una sola compuerta. Un local, una alerta meteorológica, un día laborable:

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

Cada una es una pregunta única ensamblada a partir de otras menores, exactamente como $0 \leq x < 10$ armaba intervalos en la lección anterior.

## Evaluación de cortocircuito

La tabla de verdad completa lista cuatro filas, pero Python no siempre las necesita. Evalúa $A$ `and` $B$ con $A = \mathrm{False}$: la respuesta es `False` sea cual sea $B$, así que $B$ nunca se calcula. El mismo muro vale para `or`: una vez que $A$ es `True`, el resultado está decidido. Python lee de izquierda a derecha y **se detiene en la primera respuesta decisiva**.

No es una comodidad de rendimiento; es un dispositivo de seguridad:

```python
x = 0
# No hay división siquiera — 0 es falso, la segunda mitad se salta
result = x != 0 and 10 / x > 2
```

Si Python evaluara ambos lados, $10/x$ se rompería por división entre cero. La palabra `and` es una compuerta de pre-vuelo: se niega a volar la segunda condición salvo que la primera la libere. Por eso Python escribe `and`/`or` donde las familias C escriben `&&`/`||`, las palabras llevan el mismo cortocircuito sin los símbolos crípticos.

## Los dos intercambios de De Morgan

Las identidades más reutilizables de la lógica cruzan una negación por encima de un conectivo:

- $\neg(A \land B) \equiv (\neg A) \lor (\neg B)$, `not (A and B)` ≡ `not A or not B`
- $\neg(A \lor B) \equiv (\neg A) \land (\neg B)$, `not (A or B)` ≡ `not A and not B`

En Python, la negación de una condición unida se vuelve una condición unida de negaciones:

```python
# Son equivalentes:
not (age >= 18 and has_ticket)
age < 18 or not has_ticket
```

La forma reescrita se lee de corrido: la puerta no abre a ningún menor de edad ni a ningún sin entrada. Las leyes de De Morgan son la herramienta para convertir un denso `not (…)` que hay que desenmarañar en la lectura llana.

## Las tablas de verdad, de un vistazo

| $A$ | $B$ | $A \land B$ | $A \lor B$ |
|-----|-----|-------------|------------|
| True | True | True | True |
| True | False | False | True |
| False | True | False | True |
| False | False | False | False |

Y $\lnot$ voltea el único valor de verdad: `not True` → `False`, `not False` → `True`.

## Un ejemplo resuelto: la puerta del club, contada dos veces

Una puerta, un veredicto, dos redacciones. La regla de admisión rechaza a quien no sea mayor o no traiga boleto:

```python
age = 20
has_ticket = True

denied = not (age >= 18 and has_ticket)      # False
denied_again = age < 18 or not has_ticket    # False — De Morgan, equivale
```

La primera línea dice "no es cierto que (mayor Y con boleto)"; la segunda dice "menor O sin boleto", los dos lados de la ley de De Morgan, y ambos responden lo mismo. La versión desanudada se lee como la frase que describe.

## Errores comunes

- **`and`/`or` devuelven un operando, no un booleano.** `0 and 5` es `0`; `0 or 5` es `5`. Python entrega el valor que decidió. El 0 falso hizo la decisión, así que se devuelve 0.
- **`not` se anuda más fuerte que `==`.** `not a == b` se analiza como `not (a == b)`, no `(not a) == b`. Pon paréntesis cuando dudes.
- **Palabras, no símbolos bit a bit.** `True and False` es `False`; `True & False` es una operación bit a bit sobre booleanos con otro comportamiento. Reserva `&`/`|` para el trabajo a nivel de bits.
- **`and`/`or` son perezosos de un modo que esconde errores.** Si el lado decisivo ya es truthy/falsy, el otro lado jamás se ejecuta, `1 or missing_function()` nunca llama a la función. Una mitad muerta que no chocó puede esconder un nombre que olvidaste.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Sin ejecutarlo, predice: `0 and 5`, `0 or 5`, `3 and 5`, `3 or 5`. ¿Qué patrón ves?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>0 and 5</code> → 0, <code>0 or 5</code> → 5, <code>3 and 5</code> → 5, <code>3 or 5</code> → 3. Patrón: <code>and</code> entrega el primer operando falso (o el último si todos son verdaderos); <code>or</code> entrega el primer verdadero (o el último si todos son falsos).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Reescribe `not (x > 5 and y < 10)` con la ley de De Morgan. ¿Es más legible la versión reescrita?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>not (x &gt; 5 and y &lt; 10)</code> ≡ <code>x &lt;= 5 or y &gt;= 10</code>, una lectura directa sin negación compuesta que desenredar.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe la condición de año bisiesto: divisible por 4, salvo los siglos (divisibles por 100) a menos que también sean divisibles por 400. Usa `and`, `or`, `not`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)</code>, divisible por 4 pero no por 100, o divisible por 400.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- `0 and 5` da `0`, no `False`. ¿Por qué Python devuelve el valor que decide en lugar de un booleano? ¿Cuándo se vuelve útil esto?
- Si `or` devuelve el primer operando verdadero, ¿qué es `"hello" or "world"`? ¿Y `"" or "world"`?
- ¿Por qué Python prefiere las palabras `and`, `or`, `not` a los símbolos `&&`, `||`, `!`? ¿Qué compra el inglés llano al lector?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-boolean">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Cuánto es True and False?</p>
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
    <p class="quiz-q__prompt">3. ¿Cuál equivale a not (a and b)?</p>
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