---
title: "If / Elif / Else"
description: "Ramifica tu código según condiciones — el fundamento de la toma de decisiones en Python."
module: "control-flow"
order: 8
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Escribir bloques if/elif/else para ramificar la lógica"
  - "Usar operadores de comparación y booleanos en las condiciones"
  - "Comprender los valores truthy y falsy en Python"
  - "Escribir condiciones anidadas cuando sea necesario"
prerequisites: ["07-boolean-operators"]
tags: ["if", "elif", "else", "condicionales", "truthiness"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Instrucciones if

Un bloque `if` ejecuta su cuerpo solo cuando la condición es `True`:

```python
score = 85
if score >= 60:
    print("Passing!")
```

## Añadir else

`else` captura todo lo que el `if` no encontró:

```python
score = 45
if score >= 60:
    print("Passing!")
else:
    print("Needs more work")
```

## Elif para múltiples ramas

`elif` (abreviatura de "else if") comprueba las condiciones en orden, deteniéndose en la primera coincidencia:

```python
score = 78
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(grade)  # B
```

Solo se ejecuta una rama: la primera condición que sea `True`.

## Valores truthy y falsy

Python trata algunos valores como `True` y otros como `False` en un contexto booleano:

```python
# These are all "falsy":
bool(0)       # False
bool(0.0)     # False
bool("")      # False
bool([])      # False
bool(None)    # False

# Everything else is "truthy":
bool(1)       # True
bool("hello") # True
bool([1, 2])  # True
```

Esto significa que puedes escribir condiciones limpias sin comparaciones explícitas:

```python
name = ""
if not name:
    print("Name is empty")

items = [1, 2, 3]
if items:
    print("We have items")
```

## Anidamiento

Puedes poner bloques `if` dentro de otros bloques `if`, pero mantén el anidamiento poco profundo para la legibilidad:

```python
age = 25
has_id = True

if age >= 21:
    if has_id:
        print("Entry allowed")
    else:
        print("Need ID")
else:
    print("Too young")
```

## Errores comunes

- **Olvidar los dos puntos** después de `if`, `elif` o `else`
- **Usar `=` en lugar de `==`** en las condiciones (`=` asigna, `==` compara)
- **Anidar en exceso** cuando `elif` o un `return` temprano serían más limpios

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe una función `classify_temp(temp)` que devuelva:
- `"freezing"` si temp < 0
- `"cold"` si 0 <= temp < 15
- `"warm"` si 15 <= temp < 30
- `"hot"` si temp >= 30

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Usa una cadena de <code>elif</code>: <code>if temp &lt; 0: return "freezing" elif temp &lt; 15: return "cold" elif temp &lt; 30: return "warm" else: return "hot"</code></p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Dado `text = "Hello, World!"`, escribe una comprobación que imprima `"uppercase"` si el texto está todo en mayúsculas, `"lowercase"` si está todo en minúsculas, o `"mixed"` en caso contrario.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>if text.isupper(): print("uppercase") elif text.islower(): print("lowercase") else: print("mixed")</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué Python usa `elif` en lugar de `else if`? ¿Qué ocurriría si escribieras `else if`?
- Si `score = 85`, ¿cuántas condiciones evalúa `if score >= 90: ... elif score >= 80: ... elif score >= 70: ...` antes de entrar en una rama?
- ¿Cuál es la diferencia entre `if x:` y `if x is not None:`? ¿Cuándo importa cada una?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-control-flow">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Qué imprime esto? <code>x = 0; if x: print("yes") else: print("no")</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">yes</button>
      <button class="quiz-q__opt" data-idx="1">Error</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ¿Qué condición se comprueba primero? <code>if x > 5: ... elif x > 10: ... elif x > 3: ...</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x > 10</button>
      <button class="quiz-q__opt" data-idx="1">x > 5</button>
      <button class="quiz-q__opt" data-idx="2">x > 3</button>
      <button class="quiz-q__opt" data-idx="3">Se ejecutan en paralelo</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>