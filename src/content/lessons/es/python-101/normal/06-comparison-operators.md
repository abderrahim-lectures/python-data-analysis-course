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

## La computadora, puesta a decidir

Una evaluación `2 + 3` produce un número. Pero la mayor parte de lo que un programa necesita saber no es un número — es una *decisión*. ¿La nota aprueba? ¿El nombre de usuario está tomado? ¿La temperatura está dentro del rango? Los operadores de comparación son la rama de la familia aritmética que produce una respuesta del conjunto $\{\mathrm{True}, \mathrm{False}\}$ en lugar de $\mathbb{R}$.

## Los seis operadores de comparación

Cada uno compara dos valores y produce un `bool`:

```python
5 == 5      # True   — igual
5 != 3      # True   — distinto
5 < 10      # True   — menor que
5 <= 5      # True   — menor o igual
5 > 10      # False  — mayor que
5 >= 5      # True   — mayor o igual
```

En matemáticas escribirías $\leq$, $\geq$, $\neq$; Python opta por el `<=`, `>=`, `!=` amigable con teclado. El significado no cambia. El doble igual `==` exige una pausa deliberada: es la pregunta *"¿son iguales?"*, mientras que un solo `=` es una orden de asignación. El signo duplicado evita que jamás colisionen.

## Encadena comparaciones como un matemático

Supón que $x$ pertenece al intervalo $[0, 10)$. En papel escribes la condición de tres partes de un tirón, $0 \leq x < 10$. Python te deja escribirlo exactamente así:

```python
x = 5
0 <= x < 10    # True — se cumplen ambas condiciones
0 <= x < 3     # False — falla la segunda
```

Es una sola expresión, evaluada con el mismo emparejamiento que leerías: $0 \leq x$ y después $x < 10$, con el valor del medio calculado una sola vez. La comparación encadenada equivale a $0 \leq x$ `and` $x < 10$ — pero la forma encadenada se lee como la matemática de la que salió.

## `==` pregunta por el contenido; `is` pregunta por la identidad

Dos preguntas suenan parecido y responden distinto:

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b    # True  — mismo contenido
a is b    # False — objetos distintos en memoria

c = a
a is c    # True  — el mismo objeto
```

`==` compara los valores que se llevan; `is` compara las direcciones de memoria. Varias cajas pueden por casualidad tener la misma lista; solo hay un objeto. Los dos coinciden para cosas pequeñas (como los enteros pequeños que Python cachea) y divergen para todo lo demás, así que la regla es firme: usa `==` para contenido y reserva `is` para el único singleton que no tiene contenido que comparar — `None`:

```python
if x is None:    # correcto
if x == None:    # funciona, pero te haces la pregunta equivocada
```

## Comparar entre tipos

Traer valores de conjuntos distintos a una comparación — $\mathbb{Z}$ frente a $\mathbb{S}$ — sigue una política fija:

```python
5 == 5.0      # True  — la igualdad numérica ignora el tipo
"5" == 5      # False — una cadena y un int nunca son iguales
"5" < 6       # TypeError: '<' not supported between str and int
```

Salen dos reglas. Para la igualdad, los valores numéricos se comparan por valor, no por tipo, mientras que valores de clases ajenas simplemente nunca son iguales. Para el orden, Python se niega a adivinar: no hay orden total que tenga sentido entre una cadena y un entero, así que lanza `TypeError` en lugar de inventar uno.

## Un ejemplo resuelto: la tolerancia del recibo

La trampa del ruido de floats tiene respuesta constructiva. Compara con tolerancia como haría un físico, o cambia a unidades enteras exactas:

```python
expected = 0.3
price = 0.1 + 0.2                    # 0.30000000000000004
price == expected                    # False — ruido del float
abs(price - expected) < 1e-9         # True — dentro de la tolerancia
```

El patrón es un par de preguntas y una decisión: ¿son exactamente iguales? `False`. ¿Y dentro de una proximidad razonable? `True`. La segunda pregunta es la que el mundo real suele significar.

## Errores comunes

- **`=` frente a `==`.** `if score = 60:` es un error de sintaxis — Python no te deja asignar dentro de una condición por accidente. El signo duplicado es una barandilla, no una formalidad.
- **Igualdad de punto flotante.** `0.1 + 0.2 == 0.3` es `False`. La representación binaria de $0.1$ es infinita, así que la suma cae en $0.30000000000000004$. Compara dentro de una tolerancia en su lugar: `abs((0.1 + 0.2) - 0.3) < 1e-10`.
- **`==` con `None`.** `x == None` funciona de casualidad; `x is None` es la pregunta que de verdad quieres hacer.
- **La igualdad de floats necesita tolerancia; el dinero necesita unidades enteras.** `0.1 + 0.2 == 0.3` falla (`False`), así que compara dentro de `abs(a - b) < 1e-9` o cuenta en centavos — `120 == 12 * 10` es exacto.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Predice cada resultado sin ejecutar: `5 == 5.0`, `"5" == 5`, `5 < "6"`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>5 == 5.0</code> → True (igualdad numérica entre tipos), <code>"5" == 5</code> → False (una cadena nunca es igual a un int), <code>5 &lt; "6"</code> → TypeError (el orden no está definido entre int y str en Python 3).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe una sola comparación encadenada que compruebe si un número $n$ está en $[1, 100]$, sin usar `and`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>1 &lt;= n &lt;= 100</code> — la forma encadenada se lee exactamente como el intervalo $1 \leq n \leq 100$.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

¿Por qué `0.1 + 0.2 == 0.3` da `False`? ¿Cómo escribirías una prueba de igualdad de punto flotante correcta?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Ni $0.1$ ni $0.2$ tienen representación binaria exacta, así que su suma es $0.30000000000000004$, no exactamente $0.3$. Prueba dentro de una tolerancia: <code>abs((0.1 + 0.2) - 0.3) &lt; 1e-10</code>.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- Si `a == b` es `True`, ¿debe ser `a is b` también `True`? ¿En qué circunstancias dos objetos pueden ser iguales en contenido y distintos en identidad?
- ¿Por qué Python prohíbe `5 < "6"` y a la vez permite que `5 == "5"` sea `False`? ¿Qué principio de diseño mantiene ambos comportamientos coherentes?
- ¿Cuándo es `is` de verdad la herramienta adecuada para la igualdad? Piensa en el singleton `None`, y por qué comparar contenido ahí no tiene sentido.

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-comparison">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. ¿Cuánto es 5 == 5.0?</p>
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