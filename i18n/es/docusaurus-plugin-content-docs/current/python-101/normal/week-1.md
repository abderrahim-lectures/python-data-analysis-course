---
title: "Semana 1: Variables, Tipos y E/S"
sidebar_position: 1
section: python-101
track: normal
week: 1
description: "Aprende variables, tipos de datos, operadores y entrada/salida en Python — la primera semana del recorrido Normal de Python 101, sin instalaciones necesarias."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 1: Variables, Tipos y E/S

<span className="gamified-flourish">🐍 Todo lenguaje empieza nombrando cosas. Esta semana aprenderás la versión de Python de "sea $x$...".</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Almacenar un valor bajo un nombre (una **variable**) y explicar por qué ese nombre es solo una etiqueta, no una caja.
- Identificar los tipos básicos incorporados de Python: `int`, `float`, `str`, `bool`.
- Usar correctamente los operadores aritméticos, de comparación y de asignación aumentada.
- Leer entrada del estudiante desde el teclado e imprimir salida formateada.
- Escribir tu primer programa interactivo pequeño y completo que combine todo lo anterior.

## Lección

### Las variables como nombres de valores

En matemáticas, cuando escribes "sea $x = 5$", estás vinculando un nombre a un valor para el resto del razonamiento. Python hace exactamente esto:

```python
x = 5
```

El lado derecho se evalúa primero (`5`), y luego el nombre `x` se apunta hacia él. A diferencia de las matemáticas, `x` puede **reasignarse** — escribir `x = 5` y luego más adelante `x = x + 1` no es una contradicción, simplemente redirige la etiqueta:

```python
x = 5
x = x + 1  # ahora x referencia a 6
```

Lee `x = x + 1` como "el nuevo valor de $x$ es el valor anterior de $x$ más uno", de la misma forma en que leerías una relación de recurrencia $x_{n+1} = x_n + 1$.

Verás este patrón —leer el valor actual, calcular algo a partir de él, y volver a guardarlo bajo el mismo nombre— con tanta frecuencia que Python le da un atajo: los operadores de **asignación aumentada**:

```python
x = 5
x += 1     # igual que x = x + 1  -> 6
x -= 2     # igual que x = x - 2  -> 4
x *= 3     # igual que x = x * 3  -> 12
x /= 4     # igual que x = x / 4  -> 3.0
```

#### Cómo nombrar tus variables

Un nombre (un **identificador**) debe comenzar con una letra o un guion bajo, y después solo puede contener letras, dígitos y guiones bajos — `2nd_score` no es válido, `second_score` sí. La convención de Python (y el estilo de este curso en su totalidad) es `snake_case`: palabras en minúscula separadas por guiones bajos, como `student_name` o `total_score`, en lugar de `studentName` o `TotalScore`. Un puñado de palabras están **reservadas** por el propio lenguaje (`if`, `for`, `class`, `True`, y otras) y no pueden usarse como nombres de variable en absoluto.

Los nombres deben describir *qué significa un valor*, no solo satisfacer la sintaxis. `x = 87.5` no le dice nada al lector; `quiz_score = 87.5` le dice todo lo que necesita de un vistazo. Esto importa más de lo que parece: releerás tu propio código con mucha más frecuencia de la que lo escribes.

### Tipos: ¿qué clase de valor es este?

Todo valor tiene un tipo — el conjunto al que pertenece, en términos matemáticos:

| Tipo | Analogía matemática | Ejemplo |
|---|---|---|
| `int` | $\mathbb{Z}$ (enteros) | `42`, `-7` |
| `float` | $\mathbb{R}$ (reales, aproximados) | `3.14`, `-0.5` |
| `str` | una secuencia finita de caracteres | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

Comprueba el tipo de un valor con `type(...)`:

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

Python es un lenguaje de **tipado dinámico**: un nombre no está permanentemente ligado a un solo tipo. Escribir `x = 5` y luego `x = "five"` es legal — `x` simplemente apunta a otro lugar. Esto es cómodo, pero también significa que el *tipo* de un nombre solo puede conocerse observando a qué apunta actualmente, no declarándolo de antemano.

#### Conversión entre tipos

Puedes convertir explícitamente un valor de un tipo a otro usando `int(...)`, `float(...)`, `str(...)` y `bool(...)` como funciones:

```python
int("42")       # 42        — str -> int
int(3.9)        # 3         — float -> int, trunca (¡NO redondea!)
float("3.14")   # 3.14      — str -> float
str(42)         # "42"      — int -> str
bool(0)         # False     — 0 (y también 0.0, y "") son "falsy"
bool(1)         # True      — cualquier número distinto de cero (y cualquier string no vacío) es "truthy"
```

Que `int(3.9)` dé `3`, y no `4`, confunde a la gente constantemente — la conversión a `int` siempre trunca hacia cero, nunca redondea. Usa la función incorporada `round(3.9)` (que da `4`) si lo que en realidad quieres es redondear.

No toda conversión es posible: `int("hello")` lanza un `ValueError`, ya que `"hello"` no es un número en ninguna base. Python falla ruidosamente aquí en lugar de adivinar en silencio — una decisión de diseño que aprenderás a apreciar cuando estés depurando datos reales en la Sección 2.

### Operadores

Los operadores aritméticos reflejan los que ya conoces, con dos adiciones propias de Python:

```python
7 // 2   # 3   — división entera: floor(7/2)
7 % 2    # 1   — resto, es decir 7 mod 2
7 ** 2   # 49  — exponenciación, es decir 7^2
-7 // 2  # -4  — la división entera siempre redondea hacia menos infinito, no hacia cero
```

Esa última línea es una sorpresa común: `-7 // 2` es `-4`, no `-3`, porque la división entera sigue la función matemática piso $\lfloor x \rfloor$, que redondea *hacia abajo* (hacia $-\infty$), no hacia cero.

Los operadores de comparación (`==`, `!=`, `<`, `<=`, `>`, `>=`) producen un `bool`. Nota que `==` (prueba de igualdad) no es `=` (asignación) — un error muy común al empezar. También puedes encadenar comparaciones tal como lo harías en matemáticas: `0 <= x < 10` significa exactamente lo mismo que $0 \le x < 10$, evaluado como una sola expresión, no como dos expresiones separadas que necesitarías unir con `and` (conocerás `and`/`or` correctamente la próxima semana).

Los operadores se combinan con la precedencia habitual: primero `**`, luego `*`, `/`, `//`, `%`, después `+`, `-`, de izquierda a derecha — el mismo orden PEMDAS que ya conoces. Los paréntesis lo anulan exactamente igual que en matemáticas:

```python
2 + 3 * 4      # 14, no 20
(2 + 3) * 4    # 20
```

### Entrada y salida

`input()` lee una línea de texto escrita por el estudiante — **siempre devuelve un `str`**, incluso si escribió un número:

```python
name = input("What's your name? ")
print("Hello,", name)
```

Como `input()` siempre te da un `str`, convertir es algo común:

```python
age_text = input("How old are you? ")
age = int(age_text)      # str -> int
print("In 10 years you'll be", age + 10)
```

`print()` acepta múltiples argumentos separados por comas (que se unen con un espacio) o un f-string para más control:

```python
score = 87.5
print(f"Your score is {score}%")   # los f-strings interpolan {expresiones} directamente
```

Un f-string puede contener más que un simple nombre de variable — cualquier expresión funciona dentro de `{ }`, y puedes formatear números con precisión:

```python
price = 19.999
print(f"Total: ${price:.2f}")        # "Total: $20.00" — :.2f redondea a 2 decimales
print(f"Double: {price * 2}")         # cualquier expresión, no solo una variable
print(f"{'yes' if price > 10 else 'no'}")  # incluso una expresión condicional funciona en línea
```

### ⚠️ Errores comunes

- **Confundir `=` y `==`.** `if score = 60:` es un error de sintaxis (conocerás `if` correctamente la próxima semana) — Python no te deja asignar dentro de una condición por accidente, pero el instinto de escribir `=` cuando quieres decir "es igual a" es común al principio.
- **Olvidar que `input()` devuelve un string.** `age = input("Age? ")` y luego `age + 1` lanza `TypeError: can only concatenate str (not "int") to str` — convierte primero: `age = int(input("Age? "))`.
- **Esperar que `int()` redondee.** `int(4.7)` es `4`, no `5`. Usa `round(4.7)` para redondear.
- **Confundir `/` y `//`.** `/` siempre da un `float` (incluso `4 / 2` es `2.0`); `//` da el cociente truncado hacia abajo.

## Ejemplo práctico: un pequeño programa interactivo

Juntando todo lo aprendido esta semana —variables, tipos, conversión, operadores y E/S— en un programa corto que calcula una calculadora de propina simple:

```python
bill = float(input("Bill amount: $"))
tip_percent = int(input("Tip percent (e.g. 15): "))

tip_amount = bill * tip_percent / 100
total = bill + tip_amount

print(f"Tip: ${tip_amount:.2f}")
print(f"Total: ${total:.2f}")
```

Fíjate cómo cada línea hace una cosa clara: leer un valor, convertirlo al tipo adecuado, calcular con él, e imprimir un resultado formateado. Este patrón "leer → calcular → reportar" es uno que reutilizarás constantemente, a lo largo de todo este curso.

## 🧩 Retos

<Challenge id="python101-normal-w1-c1" answer={<><code>type(7 / 2)</code> es <code>float</code> — la división real (<code>/</code>) siempre produce un float en Python 3, incluso cuando ambos operandos son int y el resultado es un número entero.</>}>

¿Qué es `type(7 / 2)`? Predícelo antes de ejecutarlo en el playground, luego compruébalo.

</Challenge>

<Challenge id="python101-normal-w1-c2" answer={<>Sí: <code>"3" + "4"</code> es el string <code>"34"</code> (concatenación), no <code>7</code>. Sumar un <code>str</code> y un <code>int</code> directamente (<code>"3" + 4</code>) lanza un <code>TypeError</code> — debes convertir primero.</>}>

Predice la salida de `"3" + "4"`. ¿Es la misma que la de `3 + 4`?

</Challenge>

<Challenge id="python101-normal-w1-c3" answer={<>Escribe un pequeño programa: lee un nombre y un año de nacimiento con dos llamadas a <code>input()</code>, convierte el año a <code>int</code>, réstalo del año actual, e imprime una frase usando un f-string, por ejemplo <code>{"f\"{name}, you are about {age} years old.\""}</code>.</>}>

Escribe un programa que pida un nombre y un año de nacimiento (como dos prompts separados de `input()`), calcule una edad aproximada, e imprima una frase como `"Amina, you are about 21 years old."` Pruébalo en el playground.

</Challenge>

<Challenge id="python101-normal-w1-c4" answer={<>15 // 4 es 3 (piso de 3.75), y 15 % 4 es 3 (ya que 15 = 4·3 + 3). Juntos satisfacen 15 = 4·(15 // 4) + (15 % 4), la misma identidad del algoritmo de la división que conoces de teoría de números.</>}>

Sin ejecutarlo, calcula `15 // 4` y `15 % 4` a mano. Luego verifica: ¿`4 * (15 // 4) + (15 % 4)` es igual a `15`?

</Challenge>

<Challenge id="python101-normal-w1-c5" answer={<>int(-7.9) es -7 (trunca hacia cero — elimina la parte decimal), mientras que -7.9 // 1 es -8.0 (redondea hacia abajo, hacia menos infinito). Coinciden para números positivos pero difieren para los negativos, que es exactamente el error del que advierte la sección "Errores comunes" de arriba.</>}>

Predice `int(-7.9)` y `-7.9 // 1`. ¿Son iguales? Prueba ambos en el playground y explica cualquier diferencia usando lo que aprendiste sobre truncar versus redondear hacia abajo.

</Challenge>

<Challenge id="python101-normal-w1-c6" answer={<>Extiende la calculadora de propina: lee una tercera entrada con el número de personas, conviértela a <code>int</code>, y divide <code>total</code> entre ese número para obtener <code>per_person</code>, impreso con formato <code>:.2f</code> como los demás montos.</>}>

Extiende la calculadora de propina del ejemplo práctico para que también pregunte cuántas personas van a repartirse la cuenta, e imprime la parte que corresponde a cada persona.

</Challenge>

## 🤔 Preguntas socráticas

- `input()` siempre devuelve un `str`. ¿Qué saldría mal si intentaras `age + 10` *sin* convertir primero con `age = int(input(...))`? ¿Qué te dice en realidad el mensaje de error?
- Si `x = 5` y luego `y = x`, y después `x = 10`, ¿cuál es el valor de `y`? Explícalo en términos de "los nombres apuntan a valores" en lugar de "las cajas contienen valores".
- `0.1 + 0.2` en Python **no** se imprime exactamente como `0.3`. Pruébalo en el playground. ¿Por qué un `float` —que aproxima $\mathbb{R}$ usando dígitos binarios finitos— podría no representar $0.1$ con exactitud, de la misma forma en que $\frac{1}{3}$ no tiene una expansión decimal finita?
- `bool(0)` es `False` y `bool(1)` es `True` — pero ¿qué predices que son `bool(-1)` y `bool(2)`? Comprueba tu predicción. ¿Qué única regla explica los cuatro resultados?
- La asignación aumentada `x += 1` y la forma normal `x = x + 1` producen el mismo resultado con números. ¿Se te ocurre alguna razón por la que un lenguaje se moleste en ofrecer ambas formas, en lugar de exigir que todos escriban siempre `x = x + 1`?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="python-101-normal-week-1"
  questions={[
    {
      id: 'q1',
      prompt: "¿Cuál es el tipo del resultado de 7 / 2 en Python 3?",
      options: ['int', 'float', 'str', 'bool'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: "¿Qué devuelve siempre input(), sin importar lo que escriba el usuario?",
      options: ['int', 'float', 'str', 'bool'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: '¿Cuál es el resultado de 17 % 5?',
      options: ['3', '2', '5', '0'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: "¿Qué operador prueba igualdad (y no asignación)?",
      options: ['=', '==', '===', 'is'],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: '¿Cuál es el resultado de int(4.9)?',
      options: ['5', '4', '4.9', 'Un TypeError'],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-1" />
