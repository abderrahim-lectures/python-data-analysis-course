---
title: "Métodos de cadenas"
description: "Divide, une, reemplaza y transforma texto con el completo arsenal de cadenas de Python."
module: "strings"
order: 13
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Usar split() y join() para convertir entre cadenas y listas"
  - "Aplicar strip(), replace(), find(), startswith(), endswith()"
  - "Dar formato a cadenas con sintaxis avanzada de f-strings"
  - "Comprender la inmutabilidad — los métodos de cadenas devuelven cadenas nuevas"
prerequisites: ["12-scope-and-lambdas"]
tags: ["cadenas", "métodos", "split", "join", "strip", "replace"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## La cadena inmutable

Una cadena termina en el instante de su creación. Todo método que parece editarla en realidad devuelve una cadena **nueva**, dejando la original intacta:

```python
name = "alice"
upper = name.upper()
print(name)    # alice  (sin cambios)
print(upper)   # ALICE
```

Merece la pena interiorizarlo como ley: los métodos de cadenas nunca mutan; entregan copias recién construidas. Una vez que esperas cadenas nuevas, el arsenal se vuelve predecible — y el ocasional bucle `while` que parece no hacer nada se colapsa en una reasignación.

## Dividir y unir

Las dos operaciones más portátiles son inversas exactas. Dividir rompe una cadena por un delimitador; unir pega una secuencia de vuelta con un delimitador:

```python
sentence = "hello world python"
words = sentence.split()       # ['hello', 'world', 'python']
back = " ".join(words)         # 'hello world python'

csv_line = "apple,banana,cherry"
fruits = csv_line.split(",")   # ['apple', 'banana', 'cherry']
```

Escritas como ecuaciones, se deshacen mutuamente:

$$
\text{split}(s, \text{sep}) = [w_1, w_2, \ldots, w_n] \qquad \text{join}(\text{sep}, [w_1, \ldots, w_n]) = w_1 + \text{sep} + w_2 + \cdots + w_n.
$$

Nota la asimetría: `split()` sin argumento divide en tramos de espacio en blanco — varios espacios colapsan —, mientras que un espacio en minúscula es tu delimitador en `" ".join(words)`. El delimitador de join es lo que quieres *entre* piezas; por eso `","`, y no `""`.

## Buscar y probar

```python
text = "Hello, World!"

text.startswith("Hello")   # True
text.endswith("!")         # True
text.find("World")         # 7  (índice de la primera coincidencia, -1 si no está)
text.count("l")            # 3
text.replace("World", "Python")  # 'Hello, Python!'
```

`startswith` y `endswith` son preguntas de sí/no sobre los bordes de la cadena — guardias baratos que sustituyen a las rebanadas. `find` responde *dónde*, devolviendo el índice donde comienza la subcadena, o $-1$ cuando la búsqueda fracasa. `count` enumera las apariciones no solapadas; `replace` canjea cada coincidencia por un sustituto.

## Mayúsculas/minúsculas y espacios

```python
"hello".upper()        # 'HELLO'
"HELLO".lower()        # 'hello'
"  hi  ".strip()       # 'hi'  (elimina los espacios de los bordes)
"  hi  ".lstrip()      # 'hi ' (solo izquierda)
"  hi  ".rstrip()      # '  hi' (solo derecha)
"hello world".title()  # 'Hello World'
```

`strip` recorta el relleno que añade la contaminación — los espacios sueltos alrededor de un texto pegado. `title` capitaliza la primera letra de cada palabra, el disfraz suburbano para la desidia al introducir datos. Cada una es una transformación con un propósito, a la que se llega por su nombre más que memorizándola.

## Formato avanzado de f-strings

El f-string es una función de maquetación: columnas declarativas y precisión. Alineación con una anchura, y formato de números con una especificación:

```python
price = 19.999
name = "Widget"

# Anchura y alineación
print(f"|{name:<15}|")   # |Widget          |  (izquierda, anchura 15)
print(f"|{name:>15}|")   # |          Widget|  (derecha)
print(f"|{name:^15}|")   # |     Widget     |  (centro)

# Formato de números
print(f"{price:.2f}")     # 20.00
print(f"{42:05d}")        # 00042  (relleno con ceros)
print(f"{0.857:.1%}")     # 85.7%  (porcentaje)
```

La especificación `%` es una pequeña multiplicación por $100$ con un signo: $\{0.857 \mapsto 85.7\%\}$. `.2f` redondea a dos decimales en la pantalla mientras el número subyacente queda entero. La alineación convierte una columna irregular de valores en una tabla con nombre — presentación sin aritmética en el cuerpo.

## Un ejemplo resuelto: limpiar la línea pegada

Las herramientas se ensamblan en un circuito para la entrada más sucia del mundo real — una línea pegada desde una tabla:

```python
raw = "  apple, banana, cherry  "
cleaned = raw.strip()
fruits = cleaned.split(", ")
print(fruits)          # ['apple', 'banana', 'cherry']
back = ", ".join(fruits)
print(back)            # 'apple, banana, cherry'
```

Tres gestos, un circuito: `strip` pela el padding que trae el pegado, `split` corta en piezas, `join` vuelve a pegar con el separador elegido. La dupla inversa `split`/`join` es el puente entre texto y lista — la misma relación que la ecuación de la apertura.

## Errores comunes

- **Olvidar qué es `split()` sin argumento.** Divide en tramos de espacios; pedirle que divida por la cadena vacía no es una opción que ofrezca.
- **Esperar que `find()` lance un error ante subcadenas ausentes.** Devuelve $-1$. Comprueba antes de rebanar sobre él.
- **Intentar modificar una cadena en su sitio.** No existe la edición en el sitio; reasigna el resultado.
- **`join` se sienta sobre el delimitador, `split` sobre la cadena.** `" ".join(words)`, no `words.join(" ")` — el separador es dueño del método, y olvidar cuál es cuál te da un `AttributeError`.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe `title_case(s)` que capitalice la primera letra de cada palabra: `title_case("hello world")` → `"Hello World"`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>return s.title()</code> — el método incorporado de Python hace exactamente esto; a veces una línea es la solución entera.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Dado `"one,two,,three"`, divide por comas y descarta las cadenas vacías.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>[x for x in s.split(",") if x]</code> o <code>list(filter(None, s.split(",")))</code> — la cadena vacía es falsy, así que el filtro de veracidad la descarta sin comprobar la longitud.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué `find()` devuelve $-1$ en lugar de lanzar un error? ¿Qué cuesta cada elección?
- ¿Cómo inviertes una cadena? ¿Existe un método para ello, o la respuesta vive en otra parte?
- ¿Cuándo es `str.replace()` la herramienta equivocada — y qué encaja para una sustitución más delicada?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-string-methods">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué devuelve <code>"a,b,c".split(",")</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['abc']</button>
      <button class="quiz-q__opt" data-idx="1">['a', 'b', 'c']</button>
      <button class="quiz-q__opt" data-idx="2">'abc'</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Qué devuelve <code>"hello".find("xyz")</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>