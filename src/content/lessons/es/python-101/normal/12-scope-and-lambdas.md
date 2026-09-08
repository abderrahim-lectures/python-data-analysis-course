---
title: "Alcance y lambdas"
description: "Comprende el alcance de las variables y escribe funciones en línea concisas."
module: "functions"
order: 12
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Comprender el alcance local frente al global"
  - "Usar las palabras clave global y nonlocal"
  - "Escribir funciones lambda para operaciones cortas"
  - "Aplicar lambdas con sorted(), map(), filter()"
prerequisites: ["11-defining-functions"]
tags: ["alcance", "global", "lambda", "sorted", "map", "filter"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Alcance local

Las variables creadas dentro de una función son locales — no existen fuera:

```python
def my_func():
    x = 10
    print(x)  # works

my_func()
# print(x)  # NameError: x is not defined
```

## Alcance global

Las variables definidas a nivel de módulo son accesibles en todas partes:

```python
counter = 0

def increment():
    global counter
    counter += 1

increment()
print(counter)  # 1
```

**Prefiere devolver valores a usar `global`** — hace que el código sea más fácil de probar y razonar.

## Alcance anidado y nonlocal

Las funciones internas pueden leer variables de la función externa, pero no pueden reasignarlas sin `nonlocal`:

```python
def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter()
print(counter())  # 1
print(counter())  # 2
```

## Funciones lambda

`lambda` crea una pequeña función anónima en una línea:

```python
add = lambda a, b: a + b
print(add(3, 5))  # 8
```

Equivalente a:

```python
def add(a, b):
    return a + b
```

## Lambdas con funciones de orden superior

Las lambdas brillan cuando se pasan como argumentos a otras funciones:

```python
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]

# Sort by score (second element)
by_score = sorted(students, key=lambda s: s[1])
print(by_score)  # [('Charlie', 78), ('Alice', 85), ('Bob', 92)]

# Map: apply a function to every item
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))
# [2, 4, 6, 8]

# Filter: keep items that pass a test
evens = list(filter(lambda x: x % 2 == 0, nums))
# [2, 4]
```

## Errores comunes

- **Usar `global` cuando deberías devolver un valor** — oculta efectos secundarios
- **Abusar de las lambdas** — si necesita más de una expresión, usa `def`
- **Confundir el alcance en funciones anidadas** — comprueba siempre dónde está definida una variable

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Ordena esta lista de palabras por su longitud: `words = ["banana", "pie", "Washington", "a"]`

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>sorted(words, key=lambda w: len(w))</code> → <code>['a', 'pie', 'banana', 'Washington']</code></p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Usa `filter` con una lambda para extraer todas las palabras de más de 3 caracteres de `["hi", "hello", "hey", "howdy", "yo"]`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>list(filter(lambda w: len(w) > 3, words))</code> → <code>['hello', 'howdy']</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué Python usa `nonlocal` en lugar de simplemente dejar que las funciones internas reasignen variables externas? ¿Qué problema resuelve esto?
- ¿Cuándo usarías `map`/`filter` con lambdas en lugar de una comprensión de lista? ¿Es una mejor que la otra?
- ¿Puede una lambda tener varias instrucciones? ¿Por qué sí o por qué no?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-scope-lambdas">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Qué devuelve <code>sorted(["banana", "pie", "a"], key=len)</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="1">['banana', 'pie', 'a']</button>
      <button class="quiz-q__opt" data-idx="2">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ¿Qué palabra clave permite que una función interna modifique una variable externa?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nonlocal</button>
      <button class="quiz-q__opt" data-idx="1">global</button>
      <button class="quiz-q__opt" data-idx="2">outer</button>
      <button class="quiz-q__opt" data-idx="3">closure</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>