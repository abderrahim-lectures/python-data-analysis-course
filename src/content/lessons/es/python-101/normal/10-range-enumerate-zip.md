---
title: "Range, Enumerate y Zip"
description: "Genera secuencias de números, rastrea índices y combina iterables."
module: "control-flow"
order: 10
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar range() para generar secuencias de números"
  - "Usar enumerate() para obtener índice + valor durante la iteración"
  - "Usar zip() para iterar sobre varias secuencias en paralelo"
  - "Escribir bucles pitónicos que eviten el rastreo manual de índices"
prerequisites: ["09-for-while-loops"]
tags: ["range", "enumerate", "zip", "iteración"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Tres herramientas que superan al conteo manual

Los bucles te dieron la repetición; esta lección te entrega los tres ayudantes que te quitan el conteo de las manos. Cada uno reemplaza un hábito que te enseñaron a escribir a mano, y cada uno es la respuesta a una irritación recurrente: generar números, necesitar la posición de un elemento y emparejar dos listas. Juntos son la diferencia entre un bucle que teclea y un bucle que se lee.

## Range: la secuencia aritmética, perezosa

En la lección anterior sumaste con `range(5)`. Merece una mirada de cerca, es la herramienta clásica para *"hacer esto un número conocido de veces"*:

```python
for i in range(5):
    print(i)  # 0 1 2 3 4
```

`range` tiene tres formas, espejo de la progresión aritmética $a, a+d, a+2d, \ldots$:

```python
range(5)        # 0, 1, 2, 3, 4
range(2, 8)     # 2, 3, 4, 5, 6, 7
range(0, 20, 3) # 0, 3, 6, 9, 12, 15, 18
```

Un argumento da $0, 1, \ldots, n-1$; dos dan el intervalo semiabierto $[\text{start}, \text{stop})$; tres añaden la diferencia común $d$. Por lo decisivo, `range` es **perezoso**: registra los parámetros y calcula cada valor solo cuando el bucle lo pide. Pedir un millón de pasos cuesta en memoria lo mismo que pedir cinco, la secuencia jamás se materializa.

## Enumerate: la posición, sin el contador

¿Quieres la posición de cada elemento? El instinto de novato es un contador manual:

```python
fruits = ["apple", "banana", "cherry"]

i = 0
for fruit in fruits:
    print(f"{i}: {fruit}")
    i += 1
```

El `i += 1` es una tentación a desincronizarse: olvida uno y las etiquetas de posición se desordenan. `enumerate` produce ambas mitades en un paso, el índice y el elemento, así que no hay nada que mantener al día:

```python
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# Los encuestadores numeran a la gente desde 1:
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}: {fruit}")
```

Donde un matemático escribe $b_i = a_i + i$ para pegar la posición al valor, `enumerate` entrega el par $(i, a_i)$ directo al cuerpo del bucle.

## Zip: alineación por posición

Dos listas paralelas, nombres y notas, suplican leerse juntas. `zip` las alinea elemento por elemento:

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 85
# Bob: 92
# Charlie: 78
```

El emparejamiento es el truco cartesiano de correr por ambas listas con un solo cursor, formando las tuplas $(n_0, s_0), (n_1, s_1), \ldots$. Cuando las listas difieren en longitud, el emparejamiento se detiene en la más corta, así que nada queda a medio emparejar. Si también necesitas la cola torcida, `itertools.zip_longest` la rellena:

```python
import itertools
for pair in itertools.zip_longest([1, 2], [3, 4, 5], fillvalue=0):
    print(pair)  # (1, 3), (2, 4), (0, 5) — ninguna valor se pierde
```

## Un ejemplo resuelto: el registro de la clase

Observa cómo se componen las tres herramientas. Una profesora tiene una lista de nombres y una lista paralela de notas, y quiere un informe numerado:

```python
names = ["Dina", "Omar", "Sara"]
scores = [78, 91, 85]

for i, (name, score) in enumerate(zip(names, scores), start=1):
    print(f"#{i} {name}: {score}")
# #1 Dina: 78
# #2 Omar: 91
# #3 Sara: 85

print(f"Top score: {max(scores)}")   # Top score: 91
```

Lee el encabezado del bucle de dentro hacia afuera: `zip` empareja cada nombre con su nota; los paréntesis `(name, score)` desempaquetan ese par; `enumerate` numera los pares empezando en uno. Cuatro gestos que te habrían costado un contador escrito a mano ahora se leen como la frase que describen, la posición se une al valor, par por par, exactamente como $b_i = a_i + i$ une un índice a cada término.

## Errores comunes

- **`range` es excluyente arriba.** `range(5)` produce $0, 1, 2, 3, 4$, cinco números, ninguno igual a $5$. Piensa en intervalo semiabierto, $[0, 5)$.
- **`enumerate` sobre un dict.** Iterar un dict da sus claves; `enumerate` numeraría las claves, no los pares. Usa `dict.items()` cuando quieras clave y valor.
- **`zip` con longitudes desiguales.** Los elementos más allá de la entrada corta se desvanecen en silencio. Nota la pérdida, o rellena con `zip_longest`.
- **`zip` es un iterador de un solo uso.** En Python 3, `p = zip(a, b)` te da un iterador, no una lista: `list(p)` lo consume, y un segundo `list(p)` queda vacío. Convierte con prisas con `list(zip(a, b))` cuando vayas a volver a visitar los pares.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Usa `enumerate` para imprimir cada color de `colors = ["red", "green", "blue"]` con su posición empezando en 1.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>for i, color in enumerate(colors, 1): print(f"{i}. {color}")</code>, el argumento <code>start</code> renumera los pares desde uno.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Con `keys = ["a", "b"]` y `values = [1, 2]`, usa `zip` para construir un diccionario.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>dict(zip(keys, values))</code> → <code>{"a": 1, "b": 2}</code>, los pares alineados se vuelven las entradas del mapeo.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué preferir `range` a deletrear la lista `[0, 1, 2, 3, 4]`? ¿Qué cambia cuando la lista tendría un millón de números?
- Puesto que `zip` se detiene en la entrada más corta, ¿cómo detectarías qué lado fue el corto? ¿Cuándo importa esa distinción?
- ¿Puede `enumerate` pasearse por un dict? ¿Qué numeran exactamente los índices?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-range-enumerate-zip">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué es <code>list(range(1, 10, 2))</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2, 3, 4, 5, 6, 7, 8, 9]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 3, 5, 7, 9]</button>
      <button class="quiz-q__opt" data-idx="2">[2, 4, 6, 8]</button>
      <button class="quiz-q__opt" data-idx="3">[1, 2, 4, 8]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Qué devuelve <code>list(zip([1, 2], [3, 4, 5]))</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[(1, 3), (2, 4), (5,)]</button>
      <button class="quiz-q__opt" data-idx="1">[(1, 3, 5), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="2">[(1, 3), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="3">[(1, 2), (3, 4, 5)]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>