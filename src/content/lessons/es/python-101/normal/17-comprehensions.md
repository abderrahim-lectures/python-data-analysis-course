---
title: "Comprensiones"
description: "Construye listas, dicts y sets de forma concisa con la sintaxis de comprensión."
module: "data-structures"
order: 17
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Escribir comprensiones de lista con filtrado y condiciones"
  - "Crear comprensiones de dict y de set"
  - "Usar comprensiones anidadas para estructuras 2D"
  - "Saber cuándo usar una comprensión frente a un bucle normal"
prerequisites: ["16-dicts-and-sets"]
tags: ["comprensiones", "comp-lista", "comp-dict", "comp-set"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## La notación de construcción de conjuntos, hecha código

Las matemáticas tienen una forma compacta de describir una colección construida desde otra: el constructor de conjuntos. La comprensión es esa notación, tecleada directamente:

$$
\{x^2 \mid x \in \{0, 1, \ldots, 5\}\} = \{0, 1, 4, 9, 16, 25\}.
$$

Lee *"el conjunto de $x^2$, para cada $x$ en esta fuente"* — y el Python es la misma frase invertida en código:

```python
# Bucle normal
squares = []
for x in range(6):
    squares.append(x ** 2)

# Comprensión
squares = [x ** 2 for x in range(6)]
# [0, 1, 4, 9, 16, 25]
```

El bucle deletrea tres movimientos — empezar vacío, añadir, repetir; la comprensión enuncia toda la colección en una línea que refleja la anatomía del constructor: la expresión al frente, la variable recorrida detrás.

## Filtrar con condiciones

La notación de construcción también lleva pruebas de pertenencia. $\{w \in words \mid |w| > 2\}$ se vuelve un `if` final:

```python
evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]

long_words = [w.upper() for w in ["hi", "hello", "hey"] if len(w) > 2]
# ['HELLO', 'HEY']
```

Un `if` al final es un *filtro*: solo los elementos que lo superan llegan a la expresión. El elemento viaja expresión → filtro → lista, en el orden en que la frase se lee.

## If/else como expresión

El `if...else` que ya conoces es una *expresión* — produce un valor. Pegar uno *antes* del `for` lo planta en la línea de construcción, eligiendo por elemento en lugar de filtrar por elemento:

```python
labels = ["even" if x % 2 == 0 else "odd" for x in range(5)]
# ['even', 'odd', 'even', 'odd', 'even']
```

Las dos posiciones son una bifurcación con trabajos distintos: después del `for`, la cláusula *vota* sobre los elementos; antes del `for`, los *etiqueta*. Uno descarta, el otro transforma.

## Comprensiones de dict

La misma forma construye mapeos — la expresión a la izquierda de los dos puntos se vuelve la clave, y la de la derecha el valor:

```python
squares_dict = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Invierte un dict
original = {"a": 1, "b": 2}
inverted = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b'}
```

La inversión es el clásico elegante: recorre `items()` e intercambia qué mitad de cada par pasa a ser la clave.

## Comprensiones de set

Las llaves con una comprensión producen un set — unicidad aplicada automáticamente:

```python
lengths = {len(word) for word in ["hello", "hi", "hey"]}
# {2, 3, 5}  (longitudes únicas)
```

Tres longitudes colapsan a un conjunto de valores, dejando caer el duplicado como un set debe.

## Comprensiones anidadas: la aplanadora

Una matriz es una lista de filas, y aplanarla son dos bucles en una expresión — lee las cláusulas `for` de izquierda a derecha, la exterior primero:

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

Cada `for` desenvuelve un nivel: `row` recorre la lista exterior, `num` recorre cada fila, y el orden de la colección sigue a los bucles exactamente.

## Un ejemplo resuelto: tres líneas desde el constructor de conjuntos

Los tres movimientos de la lección — construir, filtrar, etiquetar — una línea cada uno:

```python
squares = [x ** 2 for x in range(2, 9)]
# [4, 9, 16, 25, 36, 49, 64]

numbers = [x for x in range(1, 11) if x % 3 == 0]
# [3, 6, 9]

labels = ["even" if x % 2 == 0 else "odd" for x in numbers]
# ['odd', 'even', 'odd']
```

El primero es $\{x^2 \mid x \in [2, 9)\}$, tipeado a secas; el segundo filtra los divisores de $3$; el tercero etiqueta a cada sobreviviente. Lo que el constructor de conjuntos dice de un aliento, la comprensión lo deletrea en una línea.

## Cuándo NO usar comprensiones

- Cuando la lógica se anuda — un bucle `for` normal se gana su legibilidad.
- Cuando el cuerpo necesita `try/except` — las comprensiones no tienen sitio para él.
- Cuando importan los efectos secundarios — imprimir o escribir archivos deben ser sentencias deliberadas, no expresiones silenciosas.
- **Poner `if` antes del `for` etiqueta en vez de filtrar.** `[x if x % 2 == 0 else 'odd' for x in ...]` conserva todo elemento, apenas renombrado; solo un `if` después del `for` descarta. Mal ubicado, los rechazados se quedan callados.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Aplana `[[1, 2], [3, 4], [5, 6]]` hasta `[1, 2, 3, 4, 5, 6]` con una comprensión.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>[num for row in matrix for num in row]</code> — el <code>for</code> exterior abre cada fila, el interior la extiende.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Mapea palabras a sus longitudes con una comprensión de dict: `["hi", "hello", "hey"]` → `{"hi": 2, "hello": 5, "hey": 3}`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>{w: len(w) for w in words}</code> — la palabra es la clave y su longitud el valor, un par por entrada.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué va `if...else` antes del `for` en una comprensión mientras que el `if` de filtro va detrás?
- ¿Dónde cruza una comprensión la línea hacia una lectura más dura que un bucle? ¿Dónde la trazas?
- ¿Puede aparecer `await` dentro de una comprensión — y qué sintaxis hace posible toda una versión asíncrona?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-comprehensions">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Qué produce <code>[x * 2 for x in range(4) if x > 1]</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[0, 2, 4, 6]</button>
      <button class="quiz-q__opt" data-idx="1">[2, 4]</button>
      <button class="quiz-q__opt" data-idx="2">[4, 6]</button>
      <button class="quiz-q__opt" data-idx="3">[0, 2]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ¿Cuál es la comprensión de dict correcta?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{k: v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="1">{k, v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="2">{k: v in items}</button>
      <button class="quiz-q__opt" data-idx="3">dict(k: v for k, v in items)</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>