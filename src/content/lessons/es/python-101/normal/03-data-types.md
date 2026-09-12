---
title: "Tipos de datos"
description: "Identifica los tipos centrales de Python, int, float, str, bool, y comprende qué representa cada uno."
module: "python-basics"
order: 3
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Identificar valores int, float, str y bool"
  - "Usar type() para comprobar el tipo de un valor"
  - "Comprender el tipado dinámico de Python"
  - "Reconocer valores truthy y falsy"
prerequisites: ["02-variables"]
tags: ["tipos", "int", "float", "str", "bool", "tipado-dinámico"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## El conjunto al que pertenece un número

Responde dos preguntas: tienes $7$ manzanas y partes una por la mitad. ¿Sostienes ahora $7 + \frac{1}{2}$ manzanas *en el mismo sentido* que sostenías $7$? Media manzana no es un número entero de manzanas, el $7$ vive en $\mathbb{Z}$, y el $7\frac{1}{2}$ vive en $\mathbb{Q}$.

Un matemático responde preguntándose a qué **conjunto** pertenece un valor. La misma distinción persigue a todo programa: la máquina almacena $42$ de forma distinta a $42.5$, y $42$ de forma distinta a `"42"`. La palabra que Python usa para "en qué conjunto vive este valor" es **tipo**.

Entonces: ¿cuántos conjuntos merece la pena distinguir? Cuatro, al principio.

| Tipo | Qué es, matemáticamente | Ejemplos |
|---|---|---|
| `int` | $\mathbb{Z}$, los enteros, guardados con exactitud | `42`, `-7` |
| `float` | $\mathbb{R}$, aproximado con un número fijo de dígitos binarios | `3.14`, `-0.5` |
| `str` | una secuencia finita de caracteres | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

La fila de `float` tiene una reserva deliberada, *aproximado*. Un entero se guarda exacto, siempre. Un número real casi nunca: ¿cómo guardarías $1/3 = 0.333\ldots$ con un número finito de dígitos? No puedes, así que Python mantiene una aproximación finita y las cuentas divergen en los últimos dígitos. Ese único hecho explica una sorpresa famosa que verás enseguida.

## Preguntar a qué conjunto pertenece

Dada una valor, puedes preguntar su tipo directamente:

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

Dos notas de notación. Primera, `type(...)` *es* una función, le entregas un valor y te devuelve el *objeto de tipo* al que pertenece ese valor. Segunda, la respuesta imprime `<class 'int'>`; la palabra `class` es el término de Python para tipo, y la palabra entre comillas es el nombre del conjunto. Lee `<class 'float'>` como *"pertenece al conjunto float"*.

## Un nombre no se compromete con un conjunto

Aquí empiezan los beneficios. En un lenguaje de tipado estático declararías por adelantado: *x es un entero*. Python, en cambio, deja que un nombre apunte donde quiera:

```python
x = 5
print(type(x))    # <class 'int'>
x = "hello"
print(type(x))    # <class 'str'>
```

Redirigir un nombre a otro conjunto es legal, así que el tipo de `x` no se lee de ninguna declaración, solo preguntando a qué apunta ahora. Esto es el **tipado dinámico**. Es cómodo, y es también la razón por la que tu programa puede, en silencio, entregar una cadena a una función que espera números: nada lo impide hasta que la propia operación falla.

## ¿Qué valores actúan como True?

Todo valor es **truthy** o **falsy**, o bien se comporta como `True` en una condición, o bien como `False`. La regla es compacta y merece la pena verificarla:

- **Falsy**: el $0$, el $0.0$, la cadena vacía `""` y `None`
- **Truthy**: todo lo demás

```python
bool(0)         # False
bool(1)         # True
bool(-1)        # True   — cualquier número no nulo es truthy
bool("")        # False
bool("hello")   # True   — cualquier cadena no vacía es truthy
```

Fíjate en lo que está en la lista y en lo que queda fuera. `-1` es True; `0` no. La cadena `"0"` es True, es no vacía, y para las cadenas el criterio es la vacuidad, no el valor de su contenido. Esta regla se paga sola en cuanto escribes tu primer `if`: `if score:` significa *si score no es cero*.

## Un ejemplo resuelto: auditar una expresión

Los conjuntos pagan en cuanto una expresión los mezcla. Lee el recibo línea a línea y pregunta el conjunto de cada resultado:

```python
unit_price = 4.75
quantity = 4
bill = unit_price * quantity     # float: el float absorbe al int
type(bill)                       # <class 'float'>
bool(bill)                       # True — todo lo distinto de cero es truthy

type(10 / 2)                     # <class 'float'> — la división real nunca da int
```

Lee `bill` como el producto de dos conjuntos distintos. Los conjuntos no se "mezclan", gana el `float`, porque la proporción no es un número entero de ninguna escala y el conjunto más ancho debe contenerla. La costumbre de auditoría es preguntar al conjunto directamente: `type(...)` confirma lo que sospechabas en vez de apostar a la suerte.

## Errores comunes

- **`4 / 2` es `2.0`, no `2`.** La división real (`/`) siempre devuelve un `float` en Python 3, incluso cuando la división es exacta. Para un resultado entero pide división entera: `4 // 2` → `2`.
- **`True + True` es `2`.** `bool` es una subclase de `int` en Python: `True` se comporta como $1$ y `False` como $0$ en aritmética. Los dos conjuntos se solapan, pero `type(True)` sigue respondiendo `bool`.
- **`type()` informa el tipo concreto.** `type(True)` es `bool`, no `int`, por mucho que `True` colabore en las sumas.
- **`type()` describe el resultado, no los operandos.** `type(2 * 3.0)` es `float`, un `int` multiplicado por un `float` vive en el conjunto `float`. No lo predigas de las piezas; pregúntale a la respuesta.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Predice `type(7 / 2)` y luego compruébalo.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>type(7 / 2)</code> es <code>float</code>, la división real (<code>/</code>) siempre produce un float en Python 3, incluso cuando ambos operandos son enteros y el cociente es un número entero.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Predice `bool(0)`, `bool(0.0)`, `bool("")` y `bool("0")`. ¿Cuáles son truthy y cuáles falsy?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>bool(0)</code> → False, <code>bool(0.0)</code> → False, <code>bool("")</code> → False (cadena vacía), <code>bool("0")</code> → True (cadena no vacía, aunque su contenido sea el carácter "0").</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

En Python, `0.1 + 0.2` **no** es igual a `0.3`. Aquí está el mismo problema en papel: ¿qué ocurre al representar $1/3 = 0.333\ldots$ con dos dígitos decimales? Ahora explica por qué un `float`, que aproxima $\mathbb{R}$ con finitos dígitos binarios, no puede representar $0.1$ exactamente.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Con dos dígitos, el $1/3$ debe convertirse en $0.33$, una pérdida ya cometida antes de cualquier operación. Igualmente, el $0.1$ no tiene forma binaria exacta; el float guarda un valor cercano, y sumar dos de esos valores arrastra errores diminutos: <code>0.1 + 0.2</code> da <code>0.30000000000000004</code>, no <code>0.3</code>. Precisión finita, no un error de Python.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- Si `bool(-1)` es `True`, ¿qué regla única explica que $-1$ sea truthy pero el $0$ sea falsy? ¿Se generaliza la regla de los números a las cadenas?
- Python tiene `isinstance(42, int)` que devuelve `True`. ¿Sería `isinstance` más fiable que `type(x) == int` para comprobar tipos? ¿Por qué?
- ¿Por qué Python escribe `True` y `False` en mayúsculas en lugar de `true` y `false`? ¿Qué otras palabras capitalizadas reserva Python?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-types">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Cuál es el tipo de 3.14?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Cuál es el resultado de True + True?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">2</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. ¿Cuál de estos es falsy?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">""</button>
      <button class="quiz-q__opt" data-idx="1">"0"</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">1</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>