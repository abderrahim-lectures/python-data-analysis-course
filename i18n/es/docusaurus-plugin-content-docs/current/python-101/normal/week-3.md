---
title: "Semana 3: Estructuras de Datos"
sidebar_position: 3
section: python-101
track: normal
week: 3
description: "Trabaja con las estructuras de datos fundamentales de Python — listas, diccionarios, tuplas y conjuntos — mediante retos y ejemplos guiados."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 3: Listas, Diccionarios, Tuplas y Conjuntos

<span className="gamified-flourish">📦 Una variable guarda un valor. Esta semana, una variable guarda una colección entera.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Almacenar colecciones ordenadas y mutables en una `list`, e indexarlas, seccionarlas y modificarlas.
- Almacenar asociaciones clave-valor en un `dict`, el análogo en Python de la tabla de valores de una función.
- Explicar cuándo una `tuple` (inmutable) o un `set` (sin orden, sin duplicados) encaja mejor que una `list`.
- Escribir comprensiones de listas y de diccionarios para construir nuevas colecciones en una sola línea.
- Trabajar con strings como secuencias, y anidar colecciones unas dentro de otras.

## Lección

### Listas: secuencias ordenadas

Una `list` es una secuencia ordenada y mutable — piénsala como una secuencia finita $(a_0, a_1, \dots, a_{n-1})$:

```python
scores = [88, 92, 74, 95]
scores[0]        # 88 — la indexación empieza en 0
scores[-1]       # 95 — los índices negativos cuentan desde el final
scores[1:3]      # [92, 74] — seccionado: [inicio, fin)
scores.append(100)   # añade al final
len(scores)       # 5
```

El seccionado `scores[1:3]` sigue la misma convención de intervalo semiabierto que `range` — es la misma idea de "inicio incluido, fin excluido" que ya usaste la semana pasada. El seccionado también acepta un paso, `scores[start:stop:step]`, y omitir un límite significa "desde el principio" o "hasta el final":

```python
scores[:2]     # [88, 92]         — todo antes del índice 2
scores[2:]     # [74, 95, 100]    — todo desde el índice 2 en adelante
scores[::2]    # [88, 74, 100]    — cada dos elementos
scores[::-1]   # [100, 95, 74, 92, 88]  — la lista entera, invertida
```

Las listas son **mutables** — puedes modificarlas en su lugar, no solo construir nuevas:

```python
scores[0] = 90          # reemplazar un elemento
scores.insert(1, 100)   # inserta 100 en el índice 1, desplazando el resto a la derecha
scores.remove(74)        # elimina el primer 74 encontrado (por valor, no por índice)
last = scores.pop()       # elimina y devuelve el último elemento
scores.sort()              # ordena en su lugar, ascendente
scores.sort(reverse=True)  # descendente
```

`.sort()` modifica la lista misma y devuelve `None`; la función incorporada `sorted(scores)` en cambio devuelve una lista *nueva*, ordenada, y deja la original sin tocar — recurre a `sorted()` cuando necesites conservar también el orden original.

Las **comprensiones de listas** son la forma pitónica de la notación de construcción de conjuntos. Compara $\{x^2 : x \in \{1,\dots,5\}\}$ con:

```python
squares = [x**2 for x in range(1, 6)]   # [1, 4, 9, 16, 25]
```

Añadir una condición refleja $\{x \in S : P(x)\}$:

```python
evens = [x for x in range(20) if x % 2 == 0]
```

Una comprensión puede transformar *y* filtrar a la vez — la expresión antes de `for` no tiene por qué ser la variable del bucle sin cambios:

```python
passing_doubled = [s * 2 for s in scores if s >= 60]
```

### Los strings como secuencias

Un `str` también se comporta como una secuencia — la indexación, el seccionado y `len()` funcionan igual que con una `list`, porque un string en realidad es una secuencia fija de caracteres:

```python
name = "Amina"
name[0]      # "A"
name[-1]     # "a"
name[1:3]    # "mi"
len(name)    # 5
```

La única diferencia: los strings son **inmutables** — `name[0] = "B"` lanza un `TypeError`. Para "cambiar" un string, construyes uno nuevo, a menudo con un método: `name.upper()`, `name.lower()`, `name.strip()` (elimina los espacios en blanco alrededor), `name.replace("A", "B")`, o `name.split(",")` (divide en una `list` de partes — la herramienta que la Semana 5 del track Normal de Python 101 usará para procesar manualmente las filas de un archivo CSV). Ninguna de estas modifica `name` en sí; cada una devuelve un string (o lista) nuevo.

### Diccionarios: asociaciones clave-valor

Un `dict` asocia claves con valores, como una función $f: K \to V$ definida solo sobre un dominio finito:

```python
ages = {"amina": 21, "youssef": 23}
ages["amina"]          # 21
ages["sara"] = 19       # añade una clave nueva
"sara" in ages          # True — prueba de pertenencia
for name, age in ages.items():
    print(name, "is", age)
```

Buscar una clave inexistente con `ages["missing"]` lanza un `KeyError` — usa `.get("missing", default)` cuando una clave pueda no existir. Algunas otras operaciones de diccionarios que usarás constantemente:

```python
ages.keys()      # una vista de todas las claves: dict_keys(['amina', 'youssef', 'sara'])
ages.values()     # una vista de todos los valores: dict_values([21, 23, 19])
del ages["sara"]   # elimina una clave por completo
ages.update({"karim": 25, "amina": 22})   # añade/sobrescribe varias claves a la vez
```

Las **comprensiones de diccionarios** reflejan las comprensiones de listas, pero construyen un `dict` en lugar de una `list`:

```python
name_lengths = {name: len(name) for name in ages}
# {'amina': 5, 'youssef': 7, 'karim': 5}
```

### Tuplas: secuencias inmutables de forma fija

Una `tuple` se parece a una lista pero no puede modificarse después de creada — útil para valores que naturalmente forman un grupo fijo, como un par de coordenadas:

```python
point = (3, 4)
x, y = point            # desempaquetado (unpacking)
```

Como las tuplas son inmutables, pueden usarse como claves de diccionario; las listas no. Esto hace que un `dict` con claves de tipo tuple sea una forma natural de representar una asociación *desde pares de cosas*, como una coordenada de una cuadrícula hacia un valor:

```python
grid = {(0, 0): "start", (2, 3): "treasure"}
grid[(0, 0)]   # "start"
```

El desempaquetado de tuplas también aparece constantemente al recorrer `.items()` de un diccionario, como ya viste arriba: `for name, age in ages.items():` desempaqueta cada tupla `(name, age)` en dos variables en una sola línea.

### Conjuntos: colecciones únicas y sin orden

Un `set` es el equivalente directo en Python del concepto matemático de conjunto — sin orden, sin duplicados:

```python
a = {1, 2, 3}
b = {2, 3, 4}
a | b   # unión: {1, 2, 3, 4}
a & b   # intersección: {2, 3}
a - b   # diferencia: {1}
```

Un `{}` vacío es en realidad un `dict`, no un `set` (una peculiaridad histórica de la sintaxis) — usa `set()` para crear un conjunto vacío. Convertir una `list` a `set` y de vuelta es el truco estándar para eliminar duplicados manteniendo (en su mayoría) la idea de "solo los valores únicos":

```python
names = ["amina", "youssef", "amina", "sara"]
unique_names = list(set(names))   # el orden no está garantizado que coincida con el original
```

### Anidar colecciones

Las colecciones pueden contener otras colecciones —una lista de diccionarios, un diccionario de listas, y así sucesivamente— que es como se representan datos genuinamente estructurados, como varios estudiantes cada uno con varias calificaciones:

```python
students = [
    {"name": "Amina", "scores": [88, 92, 79]},
    {"name": "Youssef", "scores": [74, 68, 81]},
]

for student in students:
    average = sum(student["scores"]) / len(student["scores"])
    print(student["name"], round(average, 1))
```

Esta forma exacta —una lista de diccionarios, un diccionario por registro— es muy parecida a lo que obtendrás al leer un archivo CSV en la Semana 5, y es esencialmente una versión en miniatura, construida a mano, de lo que representa un `DataFrame` de pandas en la Sección 2.

## ⚠️ Errores comunes

- **Confundir `.sort()` y `sorted()`.** `scores.sort()` modifica y devuelve `None` — `x = scores.sort()` deja a `x` como `None`, una fuente común de confusión. Usa `sorted(scores)` si necesitas el resultado como un valor.
- **Modificar una lista mientras la recorres.** Eliminar elementos de una lista dentro de un bucle `for item in my_list:` se salta elementos, porque los índices se desplazan bajo tus pies durante la iteración. Recorre una copia (`for item in my_list[:]:`) o construye una lista nueva en su lugar.
- **Olvidar que las claves de un `dict` deben ser inmutables.** `grid[[0, 0]] = "x"` lanza un `TypeError: unhashable type: 'list'` — usa una tupla `(0, 0)` en su lugar.
- **Asumir que `set`/`dict` conservan el orden de inserción como esperarías de matemáticas.** Los diccionarios modernos de Python *sí* conservan el orden de inserción como detalle de implementación, pero los conjuntos no garantizan ningún orden particular — nunca confíes en el orden que obtienes de un `set`.

## 🧩 Retos

<Challenge id="python101-normal-w3-c1" answer={<>[grade for grade in grades if grade &gt;= 60] — una comprensión de lista que filtra con una condición, la forma en código de {'{'}g ∈ grades : g ≥ 60{'}'}.</>}>

Dado `grades = [55, 72, 88, 40, 91, 60]`, escribe una comprensión de lista en una sola línea que produzca solo las calificaciones aprobatorias (≥ 60).

</Challenge>

<Challenge id="python101-normal-w3-c2" answer={<>Recorre las palabras, y para cada una haz <code>counts[word] = counts.get(word, 0) + 1</code> — esto es una tabla de frecuencias, la misma estructura sobre la que se construye el track Difícil en la Semana 2.</>}>

Dada una lista de palabras, construye un `dict` que asocie cada palabra única con el número de veces que aparece (un "conteo de frecuencia de palabras").

</Challenge>

<Challenge id="python101-normal-w3-c3" answer={<>Convierte ambas listas a conjuntos y usa la diferencia de conjuntos: <code>set(roster_a) - set(roster_b)</code> da los estudiantes que están en A pero no en B.</>}>

Tienes dos listas de nombres de estudiantes, `roster_a` y `roster_b`. Encuentra los estudiantes que están en `roster_a` pero *no* en `roster_b`, sin escribir un bucle manual.

</Challenge>

<Challenge id="python101-normal-w3-c4" answer={<>Las tuplas son la opción correcta: un par de coordenadas no debería modificarse en su lugar, y su forma fija de dos elementos encaja mejor con la naturaleza de forma fija de una tupla que con una lista, que implica "una secuencia que puede crecer".</>}>

¿Guardarías una coordenada 2D `(x, y)` como una `list` o una `tuple`? Justifica tu elección usando lo que distingue a cada tipo.

</Challenge>

<Challenge id="python101-normal-w3-c5" answer={<>{"{name: len(name) for name in ['Amina', 'Karim', 'Sara']}"} — una comprensión de diccionario que asocia cada nombre con su propia longitud, por ejemplo {"{'Amina': 5, 'Karim': 5, 'Sara': 4}"}.</>}>

Dada una lista de nombres, escribe una comprensión de diccionario que asocie cada nombre con la longitud de ese nombre.

</Challenge>

<Challenge id="python101-normal-w3-c6" answer={<>Recorre la lista de diccionarios de estudiantes, y para cada uno calcula <code>sum(student["scores"]) / len(student["scores"])</code>, luego usa <code>max(...)</code> con una función <code>key</code> (o lleva el seguimiento del mejor manualmente) para encontrar al estudiante con el promedio más alto.</>}>

Usando la lista de diccionarios `students` del ejemplo práctico, encuentra el nombre del estudiante con el promedio de calificaciones *más alto*, sin escribir directamente cuál es en el código.

</Challenge>

## 🤔 Preguntas socráticas

- `list1 = [1, 2, 3]; list2 = list1; list2.append(4)`. ¿Cuál es el valor de `list1` ahora? ¿Por qué esto difiere de lo que podrías esperar según la discusión de la Semana 1 sobre "los nombres apuntan a valores" con números simples?
- ¿Por qué no se puede usar una `list` como clave de diccionario, pero sí una `tuple`? ¿Qué propiedad necesita realmente un `dict` en la clave?
- `{1, 2, 2, 3}` — ¿a qué se evalúa esto, y por qué eso hace que un `set` sea una herramienta natural para "eliminar duplicados de esta lista"?
- Una `list` de `dict`s (como `students` arriba) y un `dict` de `list`s (por ejemplo `{"Amina": [88, 92, 79], "Youssef": [74, 68, 81]}`) pueden representar información muy similar. ¿Qué pregunta podrías responder fácilmente con una forma pero con dificultad con la otra?
- Los strings son inmutables pero las listas son mutables, aunque ambos soportan indexación y seccionado de la misma manera. ¿Qué diferencia práctica marca eso la primera vez que intentas "editar" un string en su lugar frente a una lista?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="python-101-normal-week-3"
  questions={[
    {
      id: 'q1',
      prompt: '¿Qué devuelve scores[1:3] cuando scores = [10, 20, 30, 40, 50]?',
      options: ['[10, 20]', '[20, 30]', '[20, 30, 40]', '[10, 20, 30]'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: '¿Qué tipo de colección no puede contener valores duplicados?',
      options: ['list', 'tuple', 'set', 'valores de dict'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: "¿Cuál es la forma más segura de buscar una clave que podría no existir en un dict?",
      options: ['d[key]', 'd.get(key, default)', 'd.find(key)', 'key in d[...]'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: '¿Qué tipo es inmutable (no puede cambiarse después de crearse)?',
      options: ['list', 'dict', 'set', 'tuple'],
      correctOptionIndex: 3,
    },
    {
      id: 'q5',
      prompt: '¿Qué devuelve scores.sort()?',
      options: ['La lista ordenada', 'None (ordena en su lugar)', 'Una lista nueva ordenada, con la original sin cambios', 'El número de elementos ordenados'],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-3" />
