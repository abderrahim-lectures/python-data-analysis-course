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

## El mapeo

Los matemáticos llaman *función* a una tabla que empareja cada entrada con una única salida; Python la llama **dict**. Las claves apuntan a valores, exactamente como un diccionario de palabras apunta a sus definiciones:

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}
print(scores["Alice"])       # 85
print(scores.get("Dave", 0)) # 0 (valor por defecto si falta la clave)
```

Indexar con `[]` es la búsqueda impaciente: exige que la clave exista. `.get(clave, defecto)` es la variante cortés: si la clave falta, devuelve el plan B en lugar de lanzar `KeyError`. La distinción es la diferencia entre una reclamación y una pregunta.

## El arsenal del dict

```python
scores = {"Alice": 85, "Bob": 92}

scores.keys()         # dict_keys(['Alice', 'Bob'])
scores.values()       # dict_values([85, 92])
scores.items()        # dict_items([('Alice', 85), ('Bob', 92)])

scores["Dave"] = 78   # añade un par nuevo
del scores["Bob"]     # elimina por clave
scores.pop("Alice")   # elimina y devuelve el valor

scores.update({"Eve": 95, "Frank": 88})  # fusiona
scores.setdefault("Grace", 0)  # asigna solo si falta la clave
```

`keys`, `values` y `items` son tres vistas de la misma relación — el dominio, el rango y la gráfica. `update` fusiona un segundo dict; `setdefault` escribe solo cuando la clave está ausente, la asignación condicional que no necesita `if`.

## Caminar sobre el mapeo

La iteración sobre un dict recorre el dominio por defecto; para ver las dos mitades, pide `items`:

```python
for name in scores:           # claves
    print(name)

for name, score in scores.items():  # pares clave-valor
    print(f"{name}: {score}")
```

`items` te entrega el par directamente — sin indexar a mano — porque desempaquetar una entrada en `name, score` es la lectura natural de una fila.

## Sets: el conjunto matemático

Un **set** es un conjunto en el sentido matemático: una colección sin orden y sin duplicados. La repetición se disuelve a la entrada:

```python
colors = {"red", "blue", "green", "red"}
print(colors)  # {'red', 'blue', 'green'}  (duplicados eliminados)
```

La unicidad se aplica estructuralmente — no hay segunda copia esperando a contaminar una comprobación de pertenencia. La pertenencia a un set es $x \in S$ exactamente: un elemento está dentro o fuera, sin términos medios ni asomos.

## Operaciones de conjuntos

El álgebra de conjuntos está deletreada directamente. Con $A = \{1, 2, 3, 4\}$ y $B = \{3, 4, 5, 6\}$:

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

a | b    # {1, 2, 3, 4, 5, 6}  (unión)
a & b    # {3, 4}              (intersección)
a - b    # {1, 2}              (diferencia)
a ^ b    # {1, 2, 5, 6}       (diferencia simétrica)
```

$$
A \cup B = \{1, 2, 3, 4, 5, 6\}, \quad A \cap B = \{3, 4\}, \quad A \setminus B = \{1, 2\}, \quad A \mathbin{\triangle} B = \{1, 2, 5, 6\}.
$$

Los operadores son la notación que ya conoces. Y donde la teoría promete velocidad, la implementación cumple: probar la pertenencia a un set corre en $O(1)$ frente a los $O(n)$ de una lista, porque un set almacena elementos por una huella calculada, no por posición.

## El requisito del hash

Las huellas exigen estabilidad. Las claves de dict y los elementos de set deben ser **hashables** — en la práctica, inmutables — para que sus cálculos sigan siendo reproducibles. Las cadenas, los números y las tuplas cumplen; las listas y los demás dicts no:

```python
{[1, 2]: "bad"}   # TypeError: unhashable type: 'list'
{(1, 2): "good"}  # Funciona — la tupla es hasheable
```

Una lista no podría ser una clave fiable ni aunque se le permitiera: su hash cambiaría en el instante en que cambiara su contenido, convirtiendo el mapeo en un campo de minas de búsquedas caducas.

## Un ejemplo resuelto: la libreta de notas

La relación, el dominio y el rango — una sola tabla recorrida en tres posturas:

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}

for name, score in scores.items():
    print(f"{name}: {score}")

print(scores.get("Dave", "absent"))   # absent — sin KeyError

roles = {"student", "teacher", "admin"}
print("student" in roles)             # True — pertenencia O(1)
```

`items` camina el grafo entero, `.get` pregunta con cortesía cuando no sabes si la clave existe, y el `in` sobre un conjunto es la pertenencia $x \in S$ — tres preguntas que las estructuras de la lección responden directas.

## Errores comunes

- **Acceder a claves ausentes.** `.get()` o un chequeo con `in` te ahorran un `KeyError`.
- **Confiarte del orden del dict.** Python 3.7+ conserva el orden de inserción, pero trátalo como una conveniencia, no como un contrato.
- **Confiar en el orden de un set.** Un set no guarda orden alguno; jamás conviertas el orden de iteración en una dependencia.
- **`{}` es un dict vacío; `set()` es el conjunto vacío.** `{}` no es un conjunto. Escribe `set()` para el vacío y `{"a", "b"}` para un literal — un símbolo, dos significados.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Cuenta la frecuencia de cada carácter de `"hello world"` con un dict.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>freq = {}; for c in "hello world": freq[c] = freq.get(c, 0) + 1</code> — el plan B de <code>.get</code> con $0$ convierte la primera aparición en un incremento desde cero.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Dadas dos listas, encuentra los elementos que aparecen en ambas usando sets.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>set(a) & set(b)</code> o <code>set(a).intersection(b)</code> — la intersección es $A \cap B$, y la maquinaria de conjuntos hace el trabajo.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué una lista no puede servir de clave de dict? ¿Qué propiedad debe portar una clave?
- ¿Cuándo supera un set a una lista — qué pierdes y qué ganas?
- ¿Cómo difiere `dict.get(clave, defecto)` de `dict[clave]`, y cuándo prefieres cada uno?

## ✅ Comprobación rápida

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