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

## ¿Dónde vive un nombre?

Una variable es un nombre ligado a un valor, pero *dónde* vale ese vínculo es el alcance. Las matemáticas también lo marcan: en $f(x) = x^2$, la letra $x$ es un comodín que vive solo dentro de la definición. Fuera, $x$ puede significar algo completamente distinto. Python dibuja las mismas paredes alrededor de los cuerpos de las funciones: una variable creada dentro de una función es **local**, existe dentro de las paredes y en ningún otro sitio.

```python
def my_func():
    x = 10
    print(x)  # funciona

my_func()
# print(x)  # NameError: x is not defined
```

Las variables definidas a nivel de módulo, en cambio, son visibles en todo lo que hay debajo, son **globales**:

```python
counter = 0

def increment():
    global counter
    counter += 1

increment()
print(counter)  # 1
```

El problema de `global` es que deja que una función reescriba el mundo desde dentro. El vínculo cambia donde nada en la llamada te dijo que cambiaría. **Prefiere devolver valores antes que alcanzar `global`**, una función que devuelve es una función que puedes probar y razonar de forma aislada.

## Alcance anidado y nonlocal

Las funciones pueden anidar, y una función interna puede *leer* una variable externa. Reescribirla, en cambio, exige la palabra clave `nonlocal`, una confesión de que el nombre pertenece al alcance envolvente:

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

El `increment` interno lleva su propia memoria: cada llamada empuja el `count` capturado. Esto es una clausura, una función con un bolsillo de estado que arrastra consigo después de que su función envolvente haya terminado.

## Lambda: la función en línea

Una función que cabe en una línea tiene taquigrafía. `lambda` crea una pequeña función anónima, una fórmula en forma de expresión:

```python
add = lambda a, b: a + b
print(add(3, 5))  # 8
```

Es equivalente al `def` que ya conoces:

```python
def add(a, b):
    return a + b
```

La diferencia es de peso: `def` escribe toda la ceremonia para cualquier cosa con pasos; `lambda` se queda en línea para una sola expresión, sin documento posterior, sin `return`, la expresión tras los dos puntos *es* el valor devuelto.

## Lambdas con funciones de orden superior

Las lambdas ganan su sustento cuando se entregan a funciones que toman una función como entrada. Ordenar por puntuación, mapear cada elemento, quedarse con los que pasan una prueba, cada una es notación de construcción de conjuntos en código:

```python
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]

# Ordena por puntuación (segundo elemento)
by_score = sorted(students, key=lambda s: s[1])
print(by_score)  # [('Charlie', 78), ('Alice', 85), ('Bob', 92)]

# Map: aplicar una función a cada elemento — $\{2x \mid x \in \text{nums}\}$
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))
# [2, 4, 6, 8]

# Filter: quedarse con los que pasan una prueba — $\{x \in \text{nums} \mid x \equiv 0 \pmod{2}\}$
evens = list(filter(lambda x: x % 2 == 0, nums))
# [2, 4]
```

`map` transforma cada elemento; `filter` conserva los que un predicado aprueba; `sorted` ordena por una clave elegida. Tres operaciones comunes sobre datos, cada una aceptando una función diminuta como su perilla de personalización.

## Un ejemplo resuelto: la función limpia

El consejo del alcance, preferir `return` a `global`, tiene una forma lista: un precio con la tasa como parámetro:

```python
def price_with_tax(price, rate=0.2):
    return round(price * (1 + rate), 2)

price_with_tax(10.0)        # 12.0
price_with_tax(10.0, 0.08)  # 10.8
```

La función limpia no necesita `global`: la tasa llega como parámetro, el mundo exterior queda intacto, y la fórmula se lee, $\text{precio} \cdot (1 + \text{tasa})$. Todo ocurre dentro de las paredes, y el resultado vuelve por `return`.

## Errores comunes

- **Usar `global` cuando bastaría un `return`.** Oculta el efecto secundario y acopla la función a su entorno.
- **Abusar de las lambdas.** Solo una expresión; en cuanto una lambda necesite dos pasos, hazla `def`.
- **Confundir el alcance en funciones anidadas.** Cuando se lee una variable, Python sale hacia afuera buscándola; un grito `nonlocal` o `global` cambia quién puede escribirla. Lee esta lógica antes de suponer el vínculo.
- **`sorted` sin `key` ordena por el propio elemento.** Las tuplas se ordenan léxicamente por su primer elemento primero; para ordenar por el segundo, la `key` es obligatoria, `sorted(students, key=lambda s: s[1])`.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Ordena las palabras `words = ["banana", "pie", "Washington", "a"]` por longitud.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>sorted(words, key=lambda w: len(w))</code> → <code>['a', 'pie', 'banana', 'Washington']</code>, la función clave eleva cada palabra al número que se compara.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Usa `filter` con una lambda para conservar las palabras de más de tres caracteres de `["hi", "hello", "hey", "howdy", "yo"]`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>list(filter(lambda w: len(w) > 3, words))</code> → <code>['hello', 'howdy']</code>, el predicado es tu condición de pertenencia, y <code>filter</code> es el constructor de conjuntos.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué Python exige `nonlocal` en vez de dejar que las funciones internas reasignen libremente una variable externa? ¿Qué errores previene el requisito?
- `map`/`filter` con lambda frente a una comprensión de listas, ¿cuándo es cada una la grafía más clara?
- Una lambda admite solo una expresión. ¿Qué limitación se esconde tras esa regla?

## ✅ Comprobación rápida

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
    <p class="quiz-q__prompt">2. ¿Qué palabra clave permite a una función interna modificar una variable externa?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nonlocal</button>
      <button class="quiz-q__opt" data-idx="1">global</button>
      <button class="quiz-q__opt" data-idx="2">outer</button>
      <button class="quiz-q__opt" data-idx="3">closure</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>