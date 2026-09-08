---
title: "Diccionarios y conjuntos"
description: "Asigna claves a valores con dicts y almacena elementos únicos con sets."
module: "data-structures"
order: 16
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Crear y acceder a diccionarios con [] y .get()"
  - "Iterar sobre claves, valores y elementos de un dict"
  - "Usar operaciones de conjuntos: unión, intersección, diferencia"
  - "Comprender los requisitos de hash de dicts y sets"
prerequisites: ["15-lists-and-tuples"]
tags: ["dict", "set", "claves", "valores", "elementos", "unión", "intersección"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Diccionarios

Los dicts asignan claves a valores — como un diccionario real asigna palabras a definiciones:

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}
print(scores["Alice"])       # 85
print(scores.get("Dave", 0)) # 0 (default if key missing)
```

## Métodos de dict

```python
scores = {"Alice": 85, "Bob": 92}

scores.keys()         # dict_keys(['Alice', 'Bob'])
scores.values()       # dict_values([85, 92])
scores.items()        # dict_items([('Alice', 85), ('Bob', 92)])

scores["Dave"] = 78   # add new pair
del scores["Bob"]     # remove by key
scores.pop("Alice")   # remove and return value

scores.update({"Eve": 95, "Frank": 88})  # merge
scores.setdefault("Grace", 0)  # set only if key missing
```

## Iterar sobre dicts

```python
for name in scores:           # keys
    print(name)

for name, score in scores.items():  # key-value pairs
    print(f"{name}: {score}")
```

## Conjuntos

Los sets almacenan valores **únicos** y sin orden:

```python
colors = {"red", "blue", "green", "red"}
print(colors)  # {'red', 'blue', 'green'}  (duplicates removed)
```

## Operaciones de conjuntos

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

a | b    # {1, 2, 3, 4, 5, 6}  (union)
a & b    # {3, 4}              (intersection)
a - b    # {1, 2}              (difference)
a ^ b    # {1, 2, 5, 6}       (symmetric difference)
```

Los sets son rápidos para probar la pertenencia: `x in my_set` es O(1) frente a O(n) para las listas.

## Requisito de hash

Las claves de dict y los elementos de set deben ser **hashables** (inmutables): las cadenas, los números y las tuplas funcionan. Las listas y otros dicts no:

```python
{[1, 2]: "bad"}   # TypeError: unhashable type: 'list'
{(1, 2): "good"}  # Works — tuple is hashable
```

## Errores comunes

- **Acceder a claves faltantes**: usa `.get()` o `in` para evitar un `KeyError`
- **Orden de los dicts**: Python 3.7+ conserva el orden de inserción, pero no confíes en él para la igualdad
- **Los sets pierden el orden**: nunca dependas del orden de iteración de un set

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Cuenta la frecuencia de cada carácter en `"hello world"` usando un dict.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>freq = {}; for c in "hello world": freq[c] = freq.get(c, 0) + 1</code></p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Dadas dos listas, encuentra los elementos que aparecen en ambas usando un set.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>set(a) & set(b)</code> o <code>set(a).intersection(b)</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué no puedes usar una lista como clave de dict? ¿Qué propiedad necesita tener una clave?
- ¿Cuándo usarías un set en lugar de una lista? ¿Qué pierdes y qué ganas?
- ¿En qué se diferencia `dict.get(clave, predeterminado)` de `dict[clave]`? ¿Cuándo preferirías uno?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-dicts-sets">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. ¿Qué devuelve <code>{"a": 1, "b": 2}.get("c", 0)</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">KeyError</button>
      <button class="quiz-q__opt" data-idx="3">'c'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ¿Qué es <code>{1, 2, 3} ^ {2, 3, 4}</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{2, 3}</button>
      <button class="quiz-q__opt" data-idx="1">{1, 4}</button>
      <button class="quiz-q__opt" data-idx="2">{1, 2, 3, 4}</button>
      <button class="quiz-q__opt" data-idx="3">{1, 2, 3}</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>