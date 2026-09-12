---
title: "Definir funciones"
description: "Crea bloques de código reutilizables con def, parámetros y valores de retorno."
module: "functions"
order: 11
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Definir y llamar funciones con def"
  - "Usar parámetros posicionales, de palabra clave y con valor predeterminado"
  - "Devolver valores desde las funciones"
  - "Escribir docstrings para documentar las funciones"
prerequisites: ["10-range-enumerate-zip"]
tags: ["def", "parámetros", "return", "docstrings"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## De la fórmula a la máquina nombrada

Las matemáticas aborrecen la repetición. Aprendiste $f(x) = x^2 - 5x + 6$ como una *regla* — una definición, usada mil veces, sobre mil entradas distintas:

$$
f(x) = x^2 - 5x + 6, \qquad f(2) = 0.
$$

El `def` de Python es el mismo movimiento: ligar un nombre a un cálculo, para que cualquier llamador pueda aplicarlo. La función es una máquina con ranuras de entrada etiquetadas y una puerta de salida:

```python
def add(a, b):
    return a + b

result = add(3, 5)  # 8
```

El nombre, los paréntesis que sostienen los parámetros $a, b$, los dos puntos que inician la receta — esa es la definición. La llamada `add(3, 5)` es aplicar la regla en $a=3$, $b=5$, exactamente como $f(2)$ aplica una regla en $x=2$.

## Definir y llamar

La primera función que escribes cambia el mundo un saludo a la vez:

```python
def greet(name):
    """Print a greeting for the given name."""
    print(f"Hello, {name}!")

greet("Alice")  # Hello, Alice!
```

Tres partes merecen nombre. Los **parámetros** son las variables en la definición — las ranuras de entrada $x$. Los **argumentos** son los valores concretos aportados en el lugar de la llamada — la entrada $2$. Y la línea entre comillas triples de dentro es el **docstring**: documentación que vive al lado del código, para que `help(greet)` pueda responder qué hace la función.

## Return: la puerta de salida

`print` manda texto a la pantalla; `return` entrega un valor de vuelta al llamador. La distinción es sutil y decisiva:

```python
def add(a, b):
    return a + b

result = add(3, 5)          # result == 8
printed = print("8")        # printed es None — print no devuelve nada
```

Una función sin `return` devuelve `None` en silencio — la máquina no produce salida. Cuando quieras que el resultado aritmético de tu función siga fluyendo hacia delante, recuerda: `return`, no `print`.

## Parámetros con valor predeterminado

Algunos parámetros tienen un ajuste natural que la mayoría de las llamadas conservará. Dales un valor por defecto, y los llamadores podrán anularlo:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # Hello, Alice!
print(greet("Bob", "Hey"))         # Hey, Bob!
```

La regla de orden es rígida: **los parámetros con valor predeterminado van después de los que no lo tienen.** `def f(x, y=5)` es legal; `def f(x=1, y)` es un error de sintaxis, porque Python resuelve los argumentos por posición desde la izquierda y un hueco sería ambiguo.

## Argumentos de palabra clave

Los argumentos también pueden llegar con nombre, lo que compra claridad cuando el conjunto de parámetros crece:

```python
def create_user(name, age, role="student"):
    return {"name": name, "age": age, "role": role}

user = create_user(age=25, name="Alice", role="admin")
```

Los argumentos nombrados pueden ir en cualquier orden — el nombre del parámetro es la etiqueta de cada paquete. Una llamada que nombra sus entradas se lee como una frase, y no como un código por descifrar.

## *args y **kwargs

¿Y si el número de entradas no se conoce de antemano? Una suma no sabe cuántos sumandos recibirá. `*args` recoge cualquier número de argumentos posicionales en una tupla; `**kwargs` recoge los argumentos nombrados en un dict:

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4))  # 10

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)
```

La estrella es el gesto: `*` despliega la lista de argumentos en un haz. Es la diferencia entre una suma con firma fija y una suma que acepta $\sum_{i=1}^{n} a_i$ para cualquier $n$.

## Retorno temprano como guardia

Algún código empieza comprobando el único caso que no debe seguir. Razonamientos de la forma *"salvo que sea $b=0$"* se enuncian como una guardia arriba, retornando de inmediato:

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

Una cláusula de guardia comprime un par `if/else` en una línea recta: el caso de fallo sale pronto y el camino honesto corre sin anidar.

## Un ejemplo resuelto: la máquina f

La cuadrática que abrió la lección se vuelve tres declaraciones `return`:

```python
def quad(x):
    """Devuelve x² − 5x + 6."""
    return x * x - 5 * x + 6

quad(2)    # 0
quad(3)    # 0
quad(1)    # 2
```

La misma regla, tres entradas. La fórmula $f(x) = x^2 - 5x + 6$ se vuelve una máquina reutilizable: se define una vez, se aplica mil veces, y el docstring deja escrito qué regla encierra.

## Errores comunes

- **Argumentos mutables por defecto.** `def f(items=[])` crea *una* lista compartida entre todas las llamadas — los elementos se amontonan entre llamadas. Usa `None` por defecto y construye la lista dentro.
- **Olvidar `return`.** Una función sin él devuelve `None`; pediste un valor y recibiste una sombra.
- **Demasiados parámetros.** Pasados tres o cuatro, las ranuras se vuelven un rompecabezas. Agrupa los argumentos afines en un dict o en un dataclass.
- **Llamar a una función definida más abajo.** Python ejecuta de arriba a abajo; llamar a `f()` antes de que el `def f` llegue al intérprete lanza un `NameError`. Define antes de llamar.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe `is_palindrome(text)` que devuelva `True` cuando la cadena se lee igual de delante hacia atrás; ignora el caso de las letras.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>def is_palindrome(text): return text.lower() == text.lower()[::-1]</code> — pasar a minúsculas vuelve simétrica la comparación, y el rebanado invertido <code>[::-1]</code> es la imagen especular.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe `fizzbuzz(n)` que devuelva una lista de 1 a $n$, reemplazando los múltiplos de 3 por `"Fizz"`, los de 5 por `"Buzz"` y los de ambos por `"FizzBuzz"`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Los múltiplos de ambos son múltiplos de $\mathrm{lcm}(3,5) = 15$, así que prueba ese caso primero: <code>["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else i for i in range(1, n+1)]</code>.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué los parámetros con valor predeterminado deben ir detrás de los que no lo tienen? ¿Qué se rompería si la regla fuera la inversa?
- ¿Qué te da `*args` que no te dé un único parámetro lista? ¿Cuándo recurres a uno sobre el otro?
- ¿Cómo decide Python qué definición aplica cuando existen a la vez `def f(x)` y `def f(x, y=5)`?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-functions">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué devuelve esto? <code>def f(x, y=3): return x + y; f(5)</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">8</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ¿Cuál es la salida? <code>def f(a, b=[]): b.append(a); return b; print(f(1)); print(f(2))</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1] después [2]</button>
      <button class="quiz-q__opt" data-idx="1">[1] después [1, 2]</button>
      <button class="quiz-q__opt" data-idx="2">[1, 2] después [1, 2]</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>