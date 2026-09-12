---
title: "If / Elif / Else"
description: "Ramifica tu código según condiciones, el fundamento de la toma de decisiones en Python."
module: "control-flow"
order: 8
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Escribir bloques if/elif/else para ramificar la lógica"
  - "Usar operadores de comparación y booleanos en las condiciones"
  - "Comprender los valores truthy y falsy en Python"
  - "Escribir condiciones anidadas cuando sea necesario"
prerequisites: ["07-boolean-operators"]
tags: ["if", "elif", "else", "condicionales", "truthiness"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## De la condición a la decisión

La aritmética evalúa; la comparación decide; pero un programa que solo evalúa recorre una línea recta de arriba abajo. La vida no es una línea recta. Una nota es una *función a trozos*: su fórmula cambia en ciertos umbrales. En matemáticas escribes

$$
\mathrm{grade}(s) =
\begin{cases}
A & s \geq 90,\\
B & s \geq 80,\\
C & s \geq 70,\\
F & \text{en otro caso}.
\end{cases}
$$

El `if`/`elif`/`else` de Python es la transcripción de una fórmula a trozos. Cada pieza custodia su rango, y exactamente una pieza se dispara.

## La horquilla simple

La rama más sencilla ejecuta su cuerpo solo cuando la condición es `True`:

```python
score = 85
if score >= 60:
    print("Passing!")
```

La sentencia comienza con `if`, luego la condición, luego dos puntos, los dos puntos son lo que le dice a Python que viene un bloque. Todo lo indentado bajo ellos pertenece a esa rama y corre solo si la condición se cumplió.

## La horquilla doble

`else` atrapa todo lo que el `if` no:

```python
score = 45
if score >= 60:
    print("Passing!")
else:
    print("Needs more work")
```

Una rama doble es una partición de los resultados: la condición divide el espacio de valores en dos mitades, y cada caso aterriza en exactamente una.

## La horquilla múltiple: elif

Las fórmulas a trozos reales tienen más de dos piezas. `elif`, una contracción de "else if", añade más condiciones, comprobadas en orden y deteniéndose en la primera que sea `True`:

```python
score = 78
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(grade)  # B
```

Observa la economía: cada condición `elif` solo necesita una cota inferior, porque los casos de arriba ya están decididos. Con $s = 85$, la primera pieza falla y la segunda acierta, las ramas posteriores nunca corren. Solo **una** rama puede dispararse, lo que la convierte en una función de verdad.

## Verosimilitud: valores como condiciones

La condición tras `if` no tiene por qué ser una comparación. Python pregunta: *"¿este valor es verdadero o falso?"*, y la respuesta es uniforme:

```python
# Todos estos son falsy — se comportan como False en una condición:
bool(0)       # False
bool(0.0)     # False
bool("")      # False
bool([])      # False
bool(None)    # False

# Todo lo demás es truthy — se comporta como True:
bool(1)       # True
bool("hello") # True
bool([1, 2])  # True
```

La colección de valores falsy es deliberadamente pequeña: cero, texto vacío, contenedores vacíos y `None`. Todo lo demás cuenta. Eso compra condiciones concisas que se leen como una comprobación en lenguaje natural:

```python
name = ""
if not name:
    print("Name is empty")

items = [1, 2, 3]
if items:
    print("We have items")
```

Una cadena vacía es falsy, así que `not name` es `True`; una lista no vacía es truthy, así que `if items` dispara. Te ahorras el explícito `== ""` y `!= []`, la comprobación es el vacío mismo.

## Anidar: cuando una pregunta depende de otra

Algunas decisiones son secuenciales: *primero*, ¿eres mayor de edad?; *luego*, ¿llevas identificación? Eso anida:

```python
age = 25
has_id = True

if age >= 21:
    if has_id:
        print("Entry allowed")
    else:
        print("Need ID")
else:
    print("Too young")
```

Anidar funciona, pero cada nivel duplica los caminos que el lector debe sostener en la cabeza. Las cadenas `elif` planas se leen como la propia fórmula a trozos; recurre a ellas primero y reserva el anidamiento para preguntas de verdad dependientes.

## Un ejemplo resuelto: el termostato

Un termostato es una función por tramos con tres tramos. La cadena la transcribe directamente:

```python
temperature = 22

if temperature <= 10:
    state = "heating"
elif temperature >= 30:
    state = "cooling"
else:
    state = "steady"
print(state)  # steady
```

Se lee como la fórmula que es. El orden de los tramos importa: cada `elif` supone que los de arriba fallaron, así que dispara exactamente una rama y se imprime exactamente un estado.

## Errores comunes

- **Olvidar los dos puntos** tras `if`, `elif` o `else`, sin ellos, el bloque nunca empieza.
- **`=` en lugar de `==`.** `if score = 60` es un error de sintaxis, a propósito.
- **Sobre-anidar** cuando una cadena `elif` (o un retorno temprano) expondría la forma de la fórmula de un solo vistazo.
- **Gana el primer `True`, no la coincidencia más específica.** En `if x > 5: ... elif x > 3: ...`, un `x = 4` entra en la segunda rama solo porque la primera falló, y cualquier cosa menor a 3 cae al `else`. Ordenar los tramos de estrecho a ancho mantiene correcta la fórmula.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe `classify_temp(temp)` que devuelva `"freezing"` bajo $0$, `"cold"` en $[0,15)$, `"warm"` en $[15,30)$ y `"hot"` desde $30$.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Una cadena <code>elif</code>, aprovechando que cada comprobación posterior asume que las anteriores fallaron: <code>if temp &lt; 0: return "freezing" elif temp &lt; 15: return "cold" elif temp &lt; 30: return "warm" else: return "hot"</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Con `text = "Hello, World!"`, imprime `"uppercase"` si el texto está todo en mayúsculas, `"lowercase"` si todo en minúsculas, `"mixed"` de lo contrario.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>if text.isupper(): print("uppercase") elif text.islower(): print("lowercase") else: print("mixed")</code>, el conjunto completo de condiciones forma una partición.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué `elif` y no `else if`? ¿Qué haría Python con las dos palabras apareciendo lado a lado?
- Con $s = 85$, ¿cuántas condiciones evalúa la cadena de notas antes de entrar en una rama? (Pista: ¿qué pieza falla y cuál acierta?)
- ¿Cuál es la diferencia entre `if x:` e `if x is not None:`? ¿Cuándo importa cada una?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-control-flow">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Qué imprime esto? <code>x = 0; if x: print("yes") else: print("no")</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">yes</button>
      <button class="quiz-q__opt" data-idx="1">Error</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ¿Qué condición se comprueba primero? <code>if x > 5: ... elif x > 10: ... elif x > 3: ...</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x > 10</button>
      <button class="quiz-q__opt" data-idx="1">x > 5</button>
      <button class="quiz-q__opt" data-idx="2">x > 3</button>
      <button class="quiz-q__opt" data-idx="3">Corren en paralelo</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>