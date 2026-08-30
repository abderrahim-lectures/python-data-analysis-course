---
title: "Semana 4: Funciones"
section: python-101
track: normal
week: 4
description: "Escribe y razona sobre funciones en Python: parámetros, valores de retorno y alcance, con retos de programación reales."
---


# Semana 4: Funciones

<span class="gamified-flourish">🧮 Ya conoces $f(x)$. Esta semana aprenderás a escribir tu propia $f$.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Definir una función con `def`, parámetros y un valor de `return`.
- Explicar la diferencia entre el **valor por defecto** de un parámetro y un argumento pasado en el momento de la llamada.
- Razonar sobre el **alcance (scope)** de variables: qué puede y qué no puede ver una función desde fuera de sí misma.
- Devolver más de un valor desde una función, y documentar lo que hace una función con un docstring.
- Reconocer la recursión, y saber cuándo refleja de forma natural una definición matemática.

## Lección

### Las funciones como $f(x)$

Ya has leído $f(x) = x^2 + 1$ como "una regla que toma un número y devuelve otro número". Una función de Python es exactamente eso:

```python
def f(x):
    return x**2 + 1

f(3)   # 10
f(0)   # 1
```

`def` nombra la función y sus parámetros; el cuerpo calcula un resultado; `return` envía ese resultado de vuelta a quien la llamó. Una función sin sentencia `return` devuelve implícitamente `None`.

Es buena práctica documentar lo que hace una función con un **docstring** — un string literal justo después de la línea `def`, que las herramientas (y otros programadores, incluido tú en el futuro) pueden leer sin abrir el cuerpo de la función:

```python
def f(x):
    """Return x squared, plus one."""
    return x**2 + 1
```

### Varios parámetros, valores por defecto

Las funciones pueden tomar varias entradas, algunas con valores por defecto — el equivalente a $f(x, y) = x + y$ pero donde $y$ tiene un valor asumido si quien llama no proporciona uno:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Amina")               # "Hello, Amina!"
greet("Youssef", "Hi")        # "Hi, Youssef!"
greet(name="Sara", greeting="Hey")   # argumentos por palabra clave — el orden no importa
```

Los parámetros con valor por defecto deben ir *después* de los parámetros sin él — `def greet(greeting="Hello", name):` es un `SyntaxError`, ya que Python necesita saber cuáles argumentos son obligatorios antes de poder averiguar cuáles son opcionales.

### Devolver más de un valor

Una función solo puede hacer `return` de una cosa, pero esa "una cosa" puede ser una `tuple` — y la sintaxis de desempaquetado de tuplas de Python (de la Semana 3) hace que esto se lea casi como si se devolvieran varios valores directamente:

```python
def min_and_max(numbers):
    return min(numbers), max(numbers)   # esto construye una tupla: (min, max)

lowest, highest = min_and_max([4, 8, 1, 9, 3])
print(lowest, highest)   # 1 9
```

Este es el mismo patrón que usarás durante el resto del curso cada vez que un cálculo produzca de forma natural más de un resultado relacionado.

### Alcance (scope): qué puede ver una función

Una variable creada *dentro* de una función solo existe dentro de ella — esto es **alcance local**:

```python
def compute():
    total = 42
    return total

compute()
print(total)   # NameError: total solo existía dentro de compute()
```

Una función *sí puede* leer variables definidas fuera de ella (**alcance global**), pero reasignar una variable global desde dentro de una función sin sintaxis especial crea en su lugar una variable local nueva — una fuente común de confusión:

```python
counter = 0

def increment():
    counter = counter + 1   # ¡UnboundLocalError! Python ve la asignación
                             # y trata a counter como local en TODA la función,
                             # incluida la lectura anterior a la asignación.
```

La solución (`global counter`) existe pero rara vez es el diseño correcto — prefiere pasar valores como entrada y devolver resultados como salida, lo cual también es más fácil de probar y razonar.

### Funciones que llaman a otras funciones

Como una función es simplemente un valor como cualquier otro, las funciones pueden llamar a otras funciones, construyendo complejidad a partir de piezas pequeñas — de la misma forma en que $h(x) = g(f(x))$ compone dos funciones:

```python
def double(x):
    return x * 2

def add_one(x):
    return x + 1

def double_then_add_one(x):
    return add_one(double(x))

double_then_add_one(3)   # double(3)=6, add_one(6)=7
```

### Recursión: una función que se llama a sí misma

Algunas funciones se definen de la forma más natural en términos de sí mismas — exactamente igual que una relación de recurrencia. El factorial, $n! = n \cdot (n-1)!$ con el caso base $0! = 1$, se traduce casi palabra por palabra:

```python
def factorial(n):
    if n == 0:
        return 1              # caso base — detiene la recursión
    return n * factorial(n - 1)   # caso recursivo

factorial(5)   # 5 * factorial(4) = 5 * 4 * factorial(3) = ... = 120
```

Toda función recursiva necesita un **caso base** que no se llame a sí mismo (de lo contrario recurre para siempre, terminando en un `RecursionError`) y un caso recursivo que se *acerque* a ese caso base con cada llamada — aquí, `n - 1` se reduce hacia `0` cada vez. Todo lo que puede hacer la recursión, también puede hacerlo un bucle (y a menudo de forma más eficiente, ya que cada llamada recursiva tiene cierto costo adicional) — pero para definiciones que ya son naturalmente recursivas, como el factorial o la canalización de procesamiento de CSV de la Semana 5, la versión recursiva puede ser la más clara de leer.

## ⚠️ Errores comunes

- **Olvidar `return`.** Una función que calcula un valor pero nunca hace `return` devuelve `None` — `result = add(2, 3)` se convierte silenciosamente en `None` si `add` olvidó su sentencia `return`, y el error a menudo no aparece hasta mucho después, cuando intentas usar `result`.
- **Usar un argumento por defecto mutable.** `def add_item(item, items=[]):` parece razonable, pero esa lista por defecto se crea *una sola vez*, cuando se define la función, y se reutiliza en *todas* las llamadas que no proporcionen su propio `items` — los elementos de una llamada pueden filtrarse a la siguiente. La solución: usar `None` por defecto y crear una lista nueva dentro de la función si hace falta.
- **No tener caso base en una función recursiva.** Olvidar el `if n == 0: return 1` en `factorial` hace que cada llamada vuelva a recurrir, sin fin, hasta que Python se rinde con un `RecursionError: maximum recursion depth exceeded`.
- **Sombrear (shadowing) un nombre incorporado.** Nombrar tu propia función `sum` o `list` funciona, pero luego oculta el `sum()`/`list()` real de Python durante el resto de ese archivo — un error confuso de rastrear más adelante.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Escribe una función `is_even(n)` que devuelva `True` si `n` es par, `False` en caso contrario.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>def is_even(n): return n % 2 == 0</code> — el cuerpo de la función es exactamente la misma comprobación de divisibilidad que ya conoces, envuelta para poder reutilizarla.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Escribe una función `average(numbers)` que tome una lista de números y devuelva su media. ¿Qué ocurre si la llamas con una lista vacía?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>def average(numbers): return sum(numbers) / len(numbers)</code>. Llamarla con una lista vacía lanza <code>ZeroDivisionError</code> — vale la pena notarlo aunque manejarlo con elegancia sea el material de bonus de la próxima semana.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Convierte la lógica de "¿es primo este número?" de la semana pasada en una función `is_prime(n)`, y luego úsala dentro de una comprensión de lista para construir una lista de todos los primos menores que 50.

<p class="challenge__answer">💡 <strong>Answer:</strong> Define <code>def is_prime(n): ...</code> reutilizando el bucle de primalidad de la semana pasada dentro del cuerpo de la función, y luego llámala en una comprensión: <code>[n for n in range(2, 50) if is_prime(n)]</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Escribe una función `f(x, y=1)` que devuelva `x + y`. Llámala una vez solo con `x` y otra vez con ambos argumentos, y explica por qué los dos resultados difieren.

<p class="challenge__answer">💡 <strong>Answer:</strong> def f(x, y=1): return x + y — llamar a f(5) usa el valor por defecto (6), f(5, 10) lo sobrescribe (15).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Escribe una función recursiva `fibonacci(n)` que devuelva el `n`-ésimo número de Fibonacci, usando la definición $F(0) = 0$, $F(1) = 1$, $F(n) = F(n-1) + F(n-2)$.

<p class="challenge__answer">💡 <strong>Answer:</strong> def fibonacci(n): if n &lt;= 1: return n; return fibonacci(n - 1) + fibonacci(n - 2) — refleja directamente la definición matemática F(n) = F(n-1) + F(n-2), con F(0)=0 y F(1)=1 como los dos casos base.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Escribe una función `stats(numbers)` que devuelva tres valores a la vez —el mínimo, el máximo y el promedio— y llámala usando desempaquetado de tuplas para capturar los tres en variables separadas.

<p class="challenge__answer">💡 <strong>Answer:</strong> def stats(numbers): return min(numbers), max(numbers), sum(numbers) / len(numbers) — devuelve una tupla de 3 elementos, desempaquetada en el punto de llamada como lo, hi, avg = stats(numbers).</p>

</div>
</details>

## 🤔 Preguntas socráticas

- Dos funciones usan internamente una variable llamada `total`. ¿Interfieren entre sí? ¿Por qué sí o por qué no, dado lo que aprendiste sobre el alcance (scope)?
- ¿Por qué `return` sale inmediatamente de una función, aunque haya más código después? Intenta escribir una función con código inalcanzable después de un `return` y observa qué hace el playground con ello.
- `double_then_add_one` compone `double` y `add_one`. ¿Podrías escribir una función general `compose(f, g)` que devuelva *una nueva función* combinando dos funciones cualesquiera? (No necesitas `class`es para esto — una función puede devolver otra función.)
- Tu `factorial` recursivo y una versión iterativa usando un bucle `for` calculan el mismo resultado. Prueba a cronometrar ambos con una entrada grande (por ejemplo `factorial(900)`) — ¿notas alguna diferencia? ¿Qué crees que ocurre en cada llamada recursiva que una iteración de bucle no necesita hacer?
- El error del argumento por defecto mutable ocurre porque un valor por defecto se crea *una sola vez*, en el momento de definir la función, no de nuevo en cada llamada. ¿Por qué crees que Python fue diseñado así, en lugar de recrear el valor por defecto en cada llamada (lo que evitaría la trampa pero costaría un poco más de trabajo cada vez)?

## ✅ Cuestionario semanal

<div class="quiz" data-quiz="python-101-normal-week-4">
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">1. ¿Qué devuelve una función si no tiene una sentencia return explícita?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">0</button>
        <button class="quiz-q__opt" data-idx="1">Un string vacío</button>
        <button class="quiz-q__opt" data-idx="2">None</button>
        <button class="quiz-q__opt" data-idx="3">Un SyntaxError</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. En def greet(name, greeting=&quot;Hello&quot;), ¿qué es &quot;Hello&quot;?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Un argumento obligatorio</button>
        <button class="quiz-q__opt" data-idx="1">Un valor por defecto usado cuando no se proporciona greeting</button>
        <button class="quiz-q__opt" data-idx="2">Una variable global</button>
        <button class="quiz-q__opt" data-idx="3">Un valor de retorno</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. Una variable creada dentro de una función es, por defecto:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Global</button>
        <button class="quiz-q__opt" data-idx="1">Local a esa función</button>
        <button class="quiz-q__opt" data-idx="2">Compartida entre todas las funciones</button>
        <button class="quiz-q__opt" data-idx="3">Una constante</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">4. ¿Qué usa greet(name=&quot;Sara&quot;) para pasar el argumento?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Argumento posicional</button>
        <button class="quiz-q__opt" data-idx="1">Parámetro por defecto</button>
        <button class="quiz-q__opt" data-idx="2">Argumento por palabra clave</button>
        <button class="quiz-q__opt" data-idx="3">Alcance global</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. Toda función recursiva debe tener:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Un bucle for dentro</button>
        <button class="quiz-q__opt" data-idx="1">Un caso base que detenga la recursión</button>
        <button class="quiz-q__opt" data-idx="2">Un parámetro por defecto</button>
        <button class="quiz-q__opt" data-idx="3">Un docstring</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

## 🎁 Bono: manejo de errores con try/except

<div class="bonus">

En este momento, llamar a `average([])` hace que todo tu programa se caiga con un `ZeroDivisionError`. Python te permite *capturar* errores en lugar de fallar por completo:

```python
def average(numbers):
    try:
        return sum(numbers) / len(numbers)
    except ZeroDivisionError:
        return 0

average([])   # 0, en lugar de un fallo
```

`try` envuelve código que podría fallar; `except <ErrorType>` captura ese fallo específico y ejecuta código alternativo en su lugar. Esto no forma parte del currículo principal (es fácil abusar de ello y ocultar errores reales), pero es un siguiente paso natural una vez que las funciones pueden fallar de maneras predecibles. Intenta envolver tus funciones `average` e `is_prime` de los retos de esta semana con un `try`/`except` que maneje con elegancia una entrada inválida, como un valor no numérico en la lista.

</div>

