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

## Las cadenas son inmutables

Todo método de cadenas devuelve una cadena **nueva** — la original nunca se modifica:

```python
name = "alice"
upper = name.upper()
print(name)    # alice  (unchanged)
print(upper)   # ALICE
```

## Dividir y unir

Convierte entre cadenas y listas:

```python
sentence = "hello world python"
words = sentence.split()       # ['hello', 'world', 'python']
back = " ".join(words)         # 'hello world python'

csv_line = "apple,banana,cherry"
fruits = csv_line.split(",")   # ['apple', 'banana', 'cherry']
```

## Buscar y comprobar

```python
text = "Hello, World!"

text.startswith("Hello")   # True
text.endswith("!")         # True
text.find("World")         # 7  (index of first match, -1 if not found)
text.count("l")            # 3
text.replace("World", "Python")  # 'Hello, Python!'
```

## Mayúsculas y espacios en blanco

```python
"hello".upper()        # 'HELLO'
"HELLO".lower()        # 'hello'
"  hi  ".strip()       # 'hi'  (removes leading/trailing whitespace)
"  hi  ".lstrip()      # 'hi ' (left only)
"  hi  ".rstrip()      # '  hi' (right only)
"hello world".title()  # 'Hello World'
```

## Formato avanzado de f-strings

```python
price = 19.999
name = "Widget"

# Width and alignment
print(f"|{name:<15}|")   # |Widget          |  (left-align, width 15)
print(f"|{name:>15}|")   # |          Widget|  (right-align)
print(f"|{name:^15}|")   # |     Widget     |  (center)

# Number formatting
print(f"{price:.2f}")     # 20.00
print(f"{42:05d}")        # 00042  (zero-padded)
print(f"{0.857:.1%}")     # 85.7%  (percentage)
```

## Errores comunes

- **Olvidar que split() sin argumentos** divide por espacios en blanco, no por la cadena vacía
- **Esperar que find() lance un error** — devuelve -1 en su lugar
- **Intentar modificar una cadena en su lugar** — reasigna siempre el resultado

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe una función `title_case(s)` que capitalice la primera letra de cada palabra: `title_case("hello world")` → `"Hello World"`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>return s.title()</code> — el método integrado de Python hace exactamente esto.</p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Dado `"one,two,,three"`, escribe código que divida por comas y elimine las cadenas vacías.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>[x for x in s.split(",") if x]</code> o <code>list(filter(None, s.split(",")))</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué `find()` devuelve -1 en lugar de lanzar un error? ¿Cuál es el equilibrio entre ambas opciones?
- ¿Cómo invertirías una cadena en Python? ¿Existe un método para eso, o necesitas un enfoque distinto?
- ¿Cuándo es `str.replace()` la herramienta equivocada? ¿Qué usarías en su lugar?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

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
</section>