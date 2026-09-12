---
title: "Conversión de tipos"
description: "Convierte de forma explícita entre int, float, str y bool, y comprende cuándo fallan las conversiones."
module: "python-basics"
order: 4
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Convertir valores con int(), float(), str() y bool()"
  - "Comprender el truncamiento frente al redondeo"
  - "Reconocer cuándo las conversiones lanzan ValueError"
  - "Manejar correctamente el tipo de retorno de input()"
prerequisites: ["03-data-types"]
tags: ["conversión", "casting", "int", "float", "str", "input"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## ¿Por qué cambiaría un valor de conjunto?

Escribes tu año de nacimiento en un formulario. La `input()` de Python te devuelve una **cadena**, `"2004"`. Pero `"2004"` no es un número en ningún sentido aritmético: prueba `"2004" + 26` y Python responde `"200426"`, porque para una cadena `+` significa *unir*, no *sumar*.

Tienes los dígitos de un número sin tener el número. El conjunto al que pertenece es el equivocado. Un valor que cruza desde el teclado hasta un programa llega como texto, y el texto no puede hacer aritmética.

Así que un programa necesita **convertir** constantemente un valor de un conjunto a otro: de `str` a `int` antes de calcular un año, de `int` a `str` antes de imprimirlo junto a una etiqueta. Python te da cuatro funciones para ello, una por conjunto de destino.

## Cuatro funciones de conversión

Cada una se llama como el conjunto que produce:

```python
int("42")       # 42     — str -> int   "42" eran dígitos; ahora es un número
float("3.14")   # 3.14   — str -> float
str(42)         # "42"   — int -> str    el número se vuelve texto
bool(0)         # False  — número -> valor de verdad
```

Leerlas en voz alta dice lo que son: `str(42)` es "dame la versión en cadena de $42$". El nombre de la función es el nombre del conjunto de destino, y los paréntesis son la propia máquina de conversión.

## Convertir no es redondear: es truncar

Ahora una sutileza que cuesta errores reales a los principiantes. Quieres la parte entera de $3.9$. ¿Cuál debe ser la respuesta?

$$
3.9 = 3 + 0.9
$$

El instinto natural es redondear: $4$. El `int(3.9)` de Python devuelve en cambio **$3$**:

```python
int(3.9)        # 3   — la parte decimal se corta, no se redondea
round(3.9)      # 4   — esto sí es redondear
```

`int()` **trunca**: descarta la parte fraccionaria y se queda con el resto, moviéndose **hacia cero**. La diferencia aflora en cuanto los números se vuelven negativos:

```python
int(-3.9)       # -3  — hacia cero
import math
math.floor(-3.9)  # -4 — hacia menos infinito
```

La recta numérica lo zanja: truncar camina hacia $0$, `math.floor` camina hacia abajo (hacia $-\infty$) y `round` camina hacia el entero más próximo. Elige el que coincida con lo que *tú* querías decir con "la parte entera".

## Algunas conversiones deben fallar

Cruzar de un conjunto a otro no siempre es posible. ¿Cuáles de estas ves que pueden funcionar?

```python
int("hello")    # ValueError: invalid literal for int()
int("3.14")     # ValueError: invalid literal for int()  ("3.14" son dígitos con un punto)
float("hello")  # ValueError: could not convert string to float
```

`"hello"` no contiene ningún dígito, no hay nada que convertir, así que Python se niega. `int("3.14")` es más retorcido: *tiene* dígitos, pero la función de conversión `int` solo acepta un literal entero, y $3.14$ no es entero. Debes pasar por `float` si quieres empequeñecerlo:

```python
int(float("3.14"))   # 3  — analiza 3.14, trunca a 3
```

Fíjate en la filosofía: Python falla en voz alta en lugar de adivinar en silencio lo que querías. Un adivina en silencio corrompería tus datos; un error sonoro detiene el programa para que decidas *tú*.

## La trampa cotidiana: `input()` devuelve una cadena

En todas y cada una de las ocasiones, `input()` devuelve un `str`, incluso cuando el usuario teclea `2004`. El número que querías sigue al otro lado de una conversión:

```python
year_text = input("Birth year? ")   # str, siempre
year = int(year_text)                # ahora sí puede hacer aritmética
print(f"About {2026 - year} years old")
```

Olvidar la conversión es uno de los errores iniciales más comunes, y aquí está el aspecto exacto del olvido:

```python
age = input("Age? ")
print(age + 1)    # TypeError: can only concatenate str (not "int") to str
```

El error es la máquina siendo honesta: `age` vive en $\mathbb{S}$ (las cadenas), y `+` con una cadena no significa suma. La lección es un hábito: *si un valor vino del exterior, conviértelo antes de hacer cuentas con él.*

## Un ejemplo resuelto: la medida recortada

Un sensor reporta `"3.9"` como texto, y una pantalla muestra solo unidades enteras. Dos conversiones, una intención cada una:

```python
raw = "3.9"
numeric = float(raw)     # 3.9 — analiza el número real
whole = int(numeric)     # 3   — trunca hacia cero
print(f"{whole} units")  # 3 units — el .9 se corta, no se redondea
```

El embudo importa porque cada paso es una promesa distinta: `float(...)` transforma texto en un valor real, `int(...)` trocea después hacia cero, y nunca le pides a una función que haga ambas cosas. Di cuál promesa quieres decir y la conversión dejará de sorprenderte.

## Errores comunes

- **`int("3.14")` lanza un error.** No puedes convertir una cadena con decimales directamente a `int()`. Encógela a mano: `int(float("3.14"))`, o `round(float("3.14"))`.
- **`int()` trunca; `round()` redondea.** `int(4.7)` es `4`, no `5`. Pregúntate qué operación describes realmente cuando dices "convierte esto a entero".
- **`float("inf")` es válido.** Python conoce el infinito: `float('inf')`. Útil en algoritmos de optimización; desconcertante cuando se cuela en un resultado que esperabas finito.
- **`int()` y `bool()` truncan y reinterpretan en silencio.** `int(3.9)` trocea la fracción en silencio; `bool("")` devuelve `False` en silencio. Analizar texto falla ruidosamente (`ValueError`), pero las conversiones de número a número son calladas, el ojo en esas.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Predice `int(-7.9)` y `-7.9 // 1`. ¿Son iguales? Explica cualquier diferencia.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>int(-7.9)</code> es <code>-7</code> (trunca hacia cero, corta la parte decimal), mientras que <code>-7.9 // 1</code> es <code>-8.0</code> (piso hacia menos infinito). Coinciden para números positivos y difieren para los negativos.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe un programa que pida un nombre y un año de nacimiento (dos preguntas independientes con `input()`), calcule una edad aproximada e imprima una frase como `"Amina, you are about 21 years old."`

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Lee el nombre y el año con dos llamadas a <code>input()</code>, convierte el año con <code>int()</code>, réstalo del año actual (p. ej. <code>2026</code>) e imprime con un f-string: <code>print(f"{name}, you are about {2026 - year} years old.")</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Sin ejecutarlo, calcula `15 // 4` y `15 % 4` a mano y luego verifica si $4 \cdot (15 // 4) + (15 \% 4)$ reproduce $15$.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>15 // 4</code> es <code>3</code> (el piso de $3.75$), y <code>15 % 4</code> es <code>3</code>, ya que $15 = 4 \cdot 3 + 3$. Juntos, <code>4 * 3 + 3 = 15</code>, la identidad de la división $\text{dividendo} = \text{divisor} \cdot \text{cociente} + \text{resto}$.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- `input()` siempre devuelve un `str`. ¿Qué falla con `age + 10` si te saltas la conversión? ¿Qué te dice exactamente el mensaje de error?
- Para convertir `"3.14"` en entero, ¿por qué falla `int("3.14")` pero funciona `int(float("3.14"))`? ¿Qué hace el paso intermedio?
- Python tiene `math.floor()` y `math.ceil()`. ¿En qué difieren de `int()` con números negativos? ¿Cuándo elegirías cada uno?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-conversion">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Cuánto vale int(4.7)?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">4</button>
      <button class="quiz-q__opt" data-idx="2">4.7</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Qué devuelve siempre input("Name: ")?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. ¿Qué ocurre con int("3.14")?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">ValueError</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">4</button>
      <button class="quiz-q__opt" data-idx="3">3.14</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>