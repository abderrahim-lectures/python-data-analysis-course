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

## Definir una función

Usa `def` seguido de un nombre, paréntesis y dos puntos:

```python
def greet(name):
    """Print a greeting for the given name."""
    print(f"Hello, {name}!")

greet("Alice")  # Hello, Alice!
```

## Parámetros y argumentos

Los parámetros son las variables listadas en la definición de la función. Los argumentos son los valores que pasas al llamarla.

```python
def add(a, b):
    return a + b

result = add(3, 5)  # 8
```

## Parámetros con valor predeterminado

Dale a un parámetro un valor predeterminado — quien llame puede anularlo de forma opcional:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # Hello, Alice!
print(greet("Bob", "Hey"))         # Hey, Bob!
```

**Regla**: los parámetros con valor predeterminado deben aparecer después de los parámetros sin valor predeterminado.

## Argumentos de palabra clave

Llama a las funciones por nombre de parámetro para mayor claridad:

```python
def create_user(name, age, role="student"):
    return {"name": name, "age": age, "role": role}

user = create_user(age=25, name="Alice", role="admin")
```

## *args y **kwargs

Acepta cualquier cantidad de argumentos posicionales o de palabra clave:

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4))  # 10

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)
```

## Retornos anticipados

Devuelve pronto para los guard clauses — reduce el anidamiento:

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

## Errores comunes

- **Argumentos mutables por defecto**: `def f(items=[])` comparte la misma lista entre llamadas. Usa `None` en su lugar: `def f(items=None): items = items or []`
- **Olvidar el retorno**: una función sin `return` produce `None`
- **Demasiados parámetros** (4+): considera usar un diccionario o un dataclass

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe una función `is_palindrome(text)` que devuelva `True` si la cadena se lee igual hacia delante y hacia atrás (ignora las mayúsculas).

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>def is_palindrome(text): return text.lower() == text.lower()[::-1]</code></p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe una función `fizzbuzz(n)` que devuelva una lista del 1 a n, pero reemplace los múltiplos de 3 por "Fizz", los múltiplos de 5 por "Buzz", y los múltiplos de ambos por "FizzBuzz".

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else i for i in range(1, n+1)]</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué Python exige los parámetros con valor predeterminado después de los que no lo tienen? ¿Qué ocurriría si la regla estuviera invertida?
- ¿Qué problema resuelve `*args` que un parámetro de lista no resuelve? ¿Cuándo preferirías uno sobre el otro?
- ¿Cómo decide Python a qué función llamar cuando tienes tanto `def f(x)` como `def f(x, y=5)`?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

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

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Cuál es la salida? <code>def f(a, b=[]): b.append(a); return b; print(f(1)); print(f(2))</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1] then [2]</button>
      <button class="quiz-q__opt" data-idx="1">[1] then [1, 2]</button>
      <button class="quiz-q__opt" data-idx="2">[1, 2] then [1, 2]</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>