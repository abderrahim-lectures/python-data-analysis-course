---
title: "Listas y tuplas"
description: "Domina las secuencias ordenadas de Python, listas mutables y tuplas inmutables."
module: "data-structures"
order: 15
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Crear y acceder a listas y tuplas"
  - "Usar métodos de lista: append, extend, pop, sort, reverse"
  - "Comprender la inmutabilidad de las tuplas y cuándo usarlas"
  - "Desempaquetar secuencias con asignación y *rest"
prerequisites: ["14-string-slicing"]
tags: ["listas", "tuplas", "append", "sort", "desempaquetado"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## La secuencia ordenada y editable

Una lista es una secuencia que puedes hacer crecer, encoger y reordenar. El acceso obedece a todo lo que te enseñó el corte:

```python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])       # apple
print(fruits[-1])      # cherry
print(fruits[0:2])     # ['apple', 'banana']
```

Indexar desde $0$, índices negativos contando hacia atrás, rebanadas tomando ventanas, las mismas tres habilidades, ahora apuntadas a una colección de objetos cualesquiera. Donde una cadena estaba congelada, la lista es arcilla.

## El arsenal de la lista

Los métodos son un taller de ediciones:

```python
nums = [3, 1, 4, 1, 5]
nums.append(9)       # [3, 1, 4, 1, 5, 9]
nums.insert(0, 0)    # [0, 3, 1, 4, 1, 5, 9]
nums.extend([2, 6])  # [0, 3, 1, 4, 1, 5, 9, 2, 6]
nums.pop()           # quita 9 y lo devuelve
nums.remove(1)       # quita el primer 1
nums.sort()          # ordena en su sitio
nums.reverse()       # invierte en su sitio
len(nums)            # longitud actual
```

`append` añade un ítem al final; `extend` vierte una secuencia entera; `insert` desliza uno en una posición elegida. `pop` retira del final (o de un índice dado) y te entrega el valor retirado; `remove` borra el primer ítem coincidente. La lista es el primo mutable de caballos de trabajo como la expansión decimal de $\pi$, una cuerda creciente de valores que sigues editando.

## Listas de listas: tablas y matrices

Los elementos de una lista pueden ser a su vez listas, lo que convierte una secuencia plana en una tabla, una matriz es una lista de filas, y cada fila es una lista de números:

```python
matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]
print(matrix[1][2])     # 6  — fila 1, columna 2
print(matrix[1])        # [4, 5, 6]
```

`matrix[1]` elige la segunda fila; añadir `[2]` baja a esa fila y elige su tercer elemento. Dos índices direccionan una celda exactamente como el subíndice $M_{1,2}$ nombra una entrada de una matriz en papel. El mismo truco construye retículas, tableros de juego y filas de hojas de cálculo.

## Mutación vs. lista nueva: una bifurcación que muerde

Aquí hay un desajuste que magulla a los principiantes. **Algunos métodos mutan la lista y devuelven `None`; otros devuelven una lista nueva y dejan la original intacta.** La voz de un método no te dice cuál es:

```python
nums = [3, 1, 2]
result = nums.sort()   # ¡result es None! nums ahora es [1, 2, 3]
result = sorted(nums)  # result es [1, 2, 3], nums sin cambios
```

`nums.sort()` reordena en su sitio y no devuelve nada, el valor de tu expresión es `None`. `sorted(nums)` calcula una lista nueva y ordenada y deja `nums` intacta. El nombre es la señal: verbos como `sort` y `reverse` tocan el objeto; `sorted` y `list.copy()` producen una copia para un nuevo dueño.

## Tuplas: la secuencia congelada

Una tupla es una secuencia ordenada, **inmutable**, una lista que perdió sus herramientas de edición:

```python
point = (3, 4)
print(point[0])   # 3
# point[0] = 5   # TypeError!
```

La inmutabilidad no es una desventaja; es una promesa. El punto $(3, 4)$ es un único objeto matemático que no debe cambiar bajo tus pies. Coordenadas, colores RGB, filas de base de datos, datos que son *fijos por definición* pertenecen a las tuplas, donde la reasignación accidental se vuelve una excepción en lugar de una corrupción silenciosa.

## Desempaquetado: una línea, muchos nombres

Una secuencia puede plegarse en varias variables en una sola asignación. Python incluso recoge el sobrante con un nombre estrellado:

```python
x, y = (3, 4)         # x=3, y=4
a, b, *rest = [1, 2, 3, 4, 5]  # a=1, b=2, rest=[3, 4, 5]
first, *_, last = (1, 2, 3, 4)  # first=1, last=4
```

`*rest` traga todo lo que hay entre las ranuras nombradas; `*_` es el mismo gesto luciendo el nombre convencional de "descarta esto". Es la versión de lista de evaluar una función en un punto, entradas y salidas se alinean por posición.

## Un ejemplo resuelto: la libreta de notas

Observa el arsenal trabajando en una tarea real, las notas de un examen del grupo:

```python
scores = []
scores.append(8)
scores.append(6)
scores.extend([9, 7, 10])

total = sum(scores)       # sum() suma cada elemento
best = max(scores)        # max() halla el mayor
count = len(scores)       # len() los cuenta
average = total / count

print(average)            # 8.0
print(best)               # 10
```

Recoge con `append`/`extend` y luego lee con `sum`, `max` y `len`. Fíjate en la división: `total / count` es la media aritmética, el mismo $\frac{\text{suma}}{\text{recuento}}$ que conoces de las matemáticas, ahora en una línea de código. Una lista es un lugar para *acumular* datos, y el bucle entre hacerla crecer y leerla es el patrón que repite todo programa real.

## Errores comunes

- **`sort()` devuelve `None`.** Si quieres una lista nueva, deja que `sorted()` cargue con el valor.
- **Confusión con la copia superficial.** `a = b` hace dos nombres para una lista; `a = b.copy()` o `a = list(b)` construyen una lista aparte.
- **Mezclar tipos.** `[1, "two", 3.0]` es legal pero dificulta comparaciones y razonamientos; mantén las colecciones honestas sobre sus contenidos.
- **`append` vs `extend`.** `nums.append([1, 2])` anida una lista como un solo elemento; `nums.extend([1, 2])` vierte sus ítems como elementos separados.
- **`remove` borra solo la primera coincidencia.** `[1, 2, 1].remove(1)` deja `[2, 1]`; eliminar cada copia requiere un bucle (lección para más adelante).

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Elimina los duplicados conservando el orden: `[1, 3, 2, 3, 1, 4, 2]` → `[1, 3, 2, 4]`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>list(dict.fromkeys(nums))</code>, un dict mantiene el orden de inserción (desde 3.7+), y las claves duplicadas colapsan a su primera posición.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Intercambia dos variables sin variable temporal, usando desempaquetado de tuplas.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>a, b = b, a</code>, el lado derecho se evalúa como tupla primero, así que el canje es simultáneo, no secuencial.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Cuándo recurres a una tupla en vez de a una lista, y qué te compra la inmutabilidad?
- ¿Por qué `sort()` muta donde `sorted()` devuelve algo nuevo, y cuándo prefieres cada uno?
- ¿Cómo recoge `*rest` el sobrante? ¿Puede `*_` hacer de descarte nombrado?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-lists-tuples">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué imprime <code>a = [1, 2]; b = a; b.append(3); print(a)</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 2, 3]</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Cuál es correcta? <code>a, b, c = [1, 2]</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">a=1, b=2, c=None</button>
      <button class="quiz-q__opt" data-idx="1">a=1, b=2, c=0</button>
      <button class="quiz-q__opt" data-idx="2">ValueError</button>
      <button class="quiz-q__opt" data-idx="3">a=1, b=2, c=[]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>