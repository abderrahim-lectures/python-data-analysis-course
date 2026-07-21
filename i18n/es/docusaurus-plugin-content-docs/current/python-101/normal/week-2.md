---
title: "Semana 2: Flujo de Control"
sidebar_position: 2
section: python-101
track: normal
week: 2
description: "Domina el flujo de control en Python: condicionales if/else y bucles for/while, con retos prácticos en tu navegador."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 2: Flujo de Control

<span className="gamified-flourish">🔀 Esta semana tus programas dejan de ejecutar siempre las mismas tres líneas y empiezan a tomar decisiones.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Ramificar el comportamiento de un programa con `if` / `elif` / `else`.
- Combinar condiciones con `and`, `or` y `not`.
- Repetir trabajo con bucles `while` y `for`, y elegir el correcto.
- Usar `range()` para iterar un número fijo de veces, y `break`/`continue` para controlar un bucle antes de tiempo.
- Anidar bucles y condicionales para resolver problemas con más de una parte móvil.

## Lección

### Ramificación: `if` / `elif` / `else`

Una sentencia `if` es una definición por partes. Compara:

$$
f(x) = \begin{cases} \text{"negative"} & x < 0 \\ \text{"zero"} & x = 0 \\ \text{"positive"} & x > 0 \end{cases}
$$

```python
x = -3
if x < 0:
    print("negative")
elif x == 0:
    print("zero")
else:
    print("positive")
```

La indentación aquí no es un asunto de estilo — **es** la sintaxis. Todo lo indentado bajo `if` pertenece a esa rama; Python no tiene `{ }` para marcar bloques. Un bloque necesita al menos una sentencia — si quieres una rama que deliberadamente no haga nada (por ejemplo, mientras esbozas la forma de un programa antes de completarlo), usa `pass`, una sentencia cuyo único trabajo es no hacer nada:

```python
if x < 0:
    pass   # TODO: manejar números negativos más adelante
else:
    print("non-negative")
```

### Combinar condiciones: `and`, `or`, `not`

Igual que $\land$, $\lor$, $\neg$ en lógica, Python tiene `and`, `or`, `not` para combinar expresiones booleanas:

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Welcome in")

if age < 13 or age > 65:
    print("Discount applies")

if not has_ticket:
    print("Buy a ticket first")
```

Siguen las mismas tablas de verdad que esperarías: `and` es verdadero solo cuando *ambos* lados son verdaderos; `or` es verdadero cuando *al menos uno* de los lados es verdadero; `not` invierte un booleano. Python también hace evaluación de cortocircuito: en `a and b`, si `a` ya es `False`, Python ni siquiera evalúa `b`, ya que la expresión completa debe ser `False` sin importar lo demás. Esto importa cuando evaluar `b` podría ser costoso o inseguro — por ejemplo, `x != 0 and 10 / x > 1` nunca corre el riesgo de dividir entre cero, porque si `x != 0` es `False`, la división se omite por completo.

### `while`: repetir hasta que una condición falle

Un bucle `while` es lo más parecido a una recurrencia matemática con una condición de parada:

```python
n = 5
while n > 0:
    print(n)
    n = n - 1
print("liftoff!")
```

Esto imprime `5 4 3 2 1 liftoff!`. El bucle vuelve a comprobar `n > 0` antes de cada iteración — si olvidas actualizar `n` dentro del bucle, nunca se vuelve falso, y obtienes un bucle infinito.

`while` es la herramienta correcta cuando no sabes de antemano cuántas iteraciones necesitarás — la condición de parada depende de algo que ocurre *durante* el bucle, como la entrada del usuario o una búsqueda que podría terminar antes:

```python
guess = None
target = 42
while guess != target:
    guess = int(input("Guess the number: "))
print("Correct!")
```

### `for`: repetir sobre una secuencia conocida

Un bucle `for` recorre directamente una secuencia de valores — piénsalo como $\sum_{i \in S}$ donde $S$ es lo que sea que estés recorriendo, salvo que estás ejecutando código para cada $i$ en lugar de sumar números:

```python
for letter in "cat":
    print(letter)   # c, a, t — uno por línea
```

`range(n)` produce la secuencia $0, 1, \dots, n-1$ — exactamente el conjunto de índices que usarías para $\sum_{i=0}^{n-1}$:

```python
total = 0
for i in range(5):
    total = total + i
print(total)   # 0+1+2+3+4 = 10
```

`range(start, stop)` y `range(start, stop, step)` generalizan esto, reflejando una secuencia aritmética $a, a+d, a+2d, \dots$:

```python
for i in range(2, 10, 2):
    print(i)   # 2, 4, 6, 8 — empieza en 2, se detiene antes de 10, avanza de 2 en 2
```

Un paso negativo cuenta hacia atrás: `range(5, 0, -1)` produce `5, 4, 3, 2, 1`, la misma secuencia que el ejemplo de "liftoff" con `while` de la Semana 1 construyó a mano.

### `break` y `continue`

`break` sale de un bucle inmediatamente; `continue` salta a la siguiente iteración sin terminar la actual:

```python
for i in range(10):
    if i == 5:
        break        # se detiene por completo cuando i llega a 5
    if i % 2 == 0:
        continue     # se salta la impresión de los números pares
    print(i)          # imprime 1, 3
```

### Anidamiento: bucles y condicionales unos dentro de otros

El cuerpo de un bucle —o una rama de `if`— puede contener otro bucle u otro `if`, exactamente igual que los casos de una función por partes pueden a su vez involucrar más condiciones. Cada nivel de anidamiento añade un nivel más de indentación:

```python
for row in range(1, 4):
    for col in range(1, 4):
        print(row * col, end=" ")   # end=" " imprime un espacio en vez de un salto de línea
    print()                          # pasa a la siguiente línea después de cada fila
```

Esto imprime una pequeña tabla de multiplicar de 3×3:

```
1 2 3
2 4 6
3 6 9
```

El bucle interno se ejecuta hasta completarse en *cada* iteración del bucle externo — con 3 iteraciones externas y 3 internas cada una, son $3 \times 3 = 9$ sentencias `print` en total, el mismo principio de conteo detrás de una suma doble $\sum_{r=1}^{3}\sum_{c=1}^{3}$.

## ⚠️ Errores comunes

- **Errores de desfase (off-by-one) con `range`.** `range(1, 10)` se detiene *antes* de 10, dando `1..9`. Si quieres incluir el 10, necesitas `range(1, 11)`.
- **Olvidar actualizar la variable del bucle en un `while`.** `while n > 0: print(n)` sin `n -= 1` dentro nunca termina.
- **Usar `=` en lugar de `==` en una condición.** Python en realidad te protege de esto (`if x = 5:` es un `SyntaxError`), a diferencia de otros lenguajes — pero sigue valiendo la pena saber por qué sería un error si estuviera permitido.
- **Asumir que las cadenas de `elif` comprueban todas las ramas.** En cuanto una condición `elif`/`if` coincide, el resto se omite por completo — el orden importa, especialmente con condiciones superpuestas como el caso "divisible entre 3 y 5 a la vez" de FizzBuzz.

## 🧩 Retos

<Challenge id="python101-normal-w2-c1" answer={<>Usa un bucle <code>for</code> sobre <code>range(1, 11)</code>, y dentro una cadena <code>if/elif/else</code> que compruebe la divisibilidad entre 15, luego 3, luego 5, con un <code>else</code> final que imprima el número mismo.</>}>

Escribe "FizzBuzz" para los números del 1 al 10: imprime `"Fizz"` si es divisible entre 3, `"Buzz"` si es divisible entre 5, `"FizzBuzz"` si es divisible entre ambos, y en caso contrario el número mismo.

</Challenge>

<Challenge id="python101-normal-w2-c2" answer={<>Un bucle <code>while</code> que siga llamando a <code>input()</code> y comprobando <code>== "quit"</code> para decidir si hace <code>break</code>, ya que no sabes de antemano cuántas veces responderá el estudiante.</>}>

Escribe un bucle que siga preguntando `"Type 'quit' to stop: "` hasta que el estudiante escriba exactamente `quit`. ¿Encajaría mejor `for` o `while` para esta tarea, y por qué?

</Challenge>

<Challenge id="python101-normal-w2-c3" answer={<>Inicializa <code>total = 0</code>, itera con <code>for i in range(1, 101)</code>, suma <code>i</code> a <code>total</code> en cada paso, y luego imprímelo. La fórmula de suma en forma cerrada n(n+1)/2 con n=100 da 5050, lo que te permite verificar la respuesta del bucle sin volver a ejecutarlo.</>}>

Suma los enteros del 1 al 100 usando un bucle, y verifica la respuesta de tu programa contra la fórmula en forma cerrada $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$.

</Challenge>

<Challenge id="python101-normal-w2-c4" answer={<>Itera sobre <code>range(2, n)</code> y comprueba si <code>n % i == 0</code> para alguno de ellos usando una bandera o <code>break</code>; si no se encuentra ningún divisor, <code>n</code> es primo. Esta es la misma definición de primalidad "para todo i desde 2 hasta n-1, n mod i no es 0" escrita como código.</>}>

Escribe un programa que lea un número `n` e indique si es primo, comprobando si algún entero desde 2 hasta (sin incluir) `n` lo divide exactamente.

</Challenge>

<Challenge id="python101-normal-w2-c5" answer={<>Usa bucles for anidados como en el ejemplo de la tabla de multiplicar: un bucle externo sobre filas y uno interno sobre columnas, imprimiendo un carácter fijo (por ejemplo <code>"*"</code>) con <code>end=""</code> en el bucle interno, y un <code>print()</code> simple después del bucle interno para pasar a la siguiente fila.</>}>

Usando bucles anidados, imprime un cuadrado de asteriscos, `n` filas por `n` columnas, para un número `n` que elijas (por ejemplo, un bloque de 4×4 de caracteres `*`).

</Challenge>

<Challenge id="python101-normal-w2-c6" answer={<>if 18 &lt;= age &lt; 65 and has_ticket: ... — combina la comparación encadenada de la Semana 1 con and, reflejando exactamente 18 ≤ age {"<"} 65.</>}>

Escribe una condición usando `and` que compruebe si una variable `age` está entre 18 y 65 (incluyendo el 18, excluyendo el 65) *y* un booleano `has_ticket` es `True`.

</Challenge>

## 🤔 Preguntas socráticas

- ¿Qué ocurre si escribes `while True:` sin ningún `break` dentro? Pruébalo con cuidado en el playground (puede que necesites detener la ejecución manualmente) — ¿por qué esto es distinto de un bucle `for` sobre un `range` fijo?
- En FizzBuzz, ¿por qué el caso de divisibilidad entre ambos (`FizzBuzz`) necesita comprobarse *antes* de las comprobaciones separadas de `Fizz`/`Buzz`, o manejarse con `and`? ¿Qué saldría mal con un orden ingenuo de `elif`?
- `for i in range(5):` y `i = 0; while i < 5: ...; i += 1` hacen lo mismo. ¿En qué circunstancias *tendrías* que usar `while` porque `for` genuinamente no puede expresarlo?
- La evaluación de cortocircuito significa que `a and b` se salta la evaluación de `b` si `a` ya es `False`. ¿Se te ocurre una situación (además del ejemplo de división entre cero de arriba) donde esto importe por algo más que rendimiento —donde evaluar `b` cuando no debería evaluarse en realidad sería *incorrecto*, no solo innecesario?
- El ejemplo de la tabla de multiplicar anida un `for` dentro de otro `for`. ¿Cómo se vería anidar un `while` dentro de un `for`, y se te ocurre una tarea real (no un ejemplo inventado) donde esa combinación sería la elección natural?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="python-101-normal-week-2"
  questions={[
    {
      id: 'q1',
      prompt: '¿Qué produce range(5)?',
      options: ['1,2,3,4,5', '0,1,2,3,4', '0,1,2,3,4,5', '5,4,3,2,1'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: '¿Qué sentencia sale inmediatamente del bucle más cercano que la contiene?',
      options: ['continue', 'return', 'break', 'pass'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: "¿Qué determina qué líneas pertenecen a un bloque if en Python?",
      options: ['Llaves {}', 'La indentación', 'Los punto y coma', 'Los paréntesis'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Un bucle while con una condición que nunca se vuelve False:',
      options: [
        'Lanza un SyntaxError inmediatamente',
        'Se ejecuta una vez y se detiene',
        'Se repite para siempre (bucle infinito)',
        'Se convierte automáticamente en un bucle for',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'En "a and b", si a se evalúa como False, ¿qué pasa con b?',
      options: [
        'Se evalúa igualmente, pero se ignora',
        'Nunca se evalúa (cortocircuito)',
        'Lanza un SyntaxError',
        'Se evalúa primero, antes que a',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-2" />
