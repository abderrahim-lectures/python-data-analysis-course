---
title: "Conversión de tipos"
description: "Convierte de forma explícita entre int, float, str y bool — y comprende cuándo fallan las conversiones."
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

## Funciones de conversión explícita

Python ofrece `int(...)`, `float(...)`, `str(...)` y `bool(...)` para convertir entre tipos:

```python
int("42")       # 42        — str -> int
int(3.9)        # 3         — float -> int, truncates (does NOT round!)
float("3.14")   # 3.14      — str -> float
str(42)         # "42"      — int -> str
bool(0)         # False     — 0 (and 0.0, and "") are "falsy"
bool(1)         # True      — any nonzero number (and non-empty string) is "truthy"
```

## Truncamiento frente a redondeo

`int(3.9)` da `3`, no `4` — la conversión a `int` siempre **trunca hacia cero** (corta la parte decimal). Nunca redondea:

```python
int(3.9)        # 3  — truncates
int(-3.9)       # -3 — truncates toward zero, not toward negative infinity
round(3.9)      # 4  — this is rounding
```

La diferencia importa con los números negativos: `int(-3.9)` es `-3` (hacia cero), mientras que `math.floor(-3.9)` es `-4` (hacia el infinito negativo).

## Cuándo fallan las conversiones

No toda conversión es posible:

```python
int("hello")    # ValueError: invalid literal for int()
int("3.14")     # ValueError: invalid literal for int() — use float() first
float("hello")  # ValueError: could not convert string to float
```

Python falla de forma ruidosa aquí en lugar de adivinar en silencio — una decisión de diseño que aprenderás a apreciar cuando depures datos reales.

## La trampa de input()

`input()` **siempre devuelve un `str`**, incluso si el usuario tecleó un número:

```python
age_text = input("How old are you? ")   # always a string
age = int(age_text)                      # convert explicitly
print(f"In 10 years you'll be {age + 10}")
```

Olvidar esta conversión es uno de los errores más comunes en los inicios:

```python
age = input("Age? ")
print(age + 1)    # TypeError: can only concatenate str (not "int") to str
```

## Errores comunes

- **`int("3.14")` lanza un error.** No puedes parsear una cadena de float directamente con `int()`. Usa `int(float("3.14"))` o `round(float("3.14"))`.
- **`int()` trunca, no redondea.** `int(4.7)` es `4`, no `5`. Usa `round()` cuando quieras redondear.
- **`float("inf")` es válido.** Python representa el infinito como `float('inf')` — útil en algunos algoritmos, pero puede sorprenderte.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Predice `int(-7.9)` y `-7.9 // 1`. ¿Son lo mismo? Explica cualquier diferencia.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>int(-7.9)</code> es <code>-7</code> (trunca hacia cero — corta la parte decimal), mientras que <code>-7.9 // 1</code> es <code>-8.0</code> (redondea hacia el infinito negativo). Coinciden para los números positivos, pero difieren para los negativos.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe un programa que pida un nombre y un año de nacimiento (dos avisos separados de `input()`), calcule una edad aproximada e imprima una frase como `"Amina, you are about 21 years old."`

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Lee el nombre y el año de nacimiento con dos llamadas a <code>input()</code>, convierte el año a <code>int</code>, réstalo del año actual (por ejemplo, <code>2026</code>) e imprime con una f-string: <code>print(f"{name}, you are about {2026 - year} years old.")</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Sin ejecutarlo, calcula `15 // 4` y `15 % 4` a mano. Luego verifica: ¿`4 * (15 // 4) + (15 % 4)` es igual a `15`?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> 15 // 4 es 3 (el piso de 3.75), y 15 % 4 es 3 (ya que 15 = 4·3 + 3). Juntos: 4 × 3 + 3 = 15. Esta es la identidad del algoritmo de división.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- `input()` siempre devuelve un `str`. ¿Qué saldría mal si intentaras `age + 10` sin convertir antes `age = int(input(...))`? ¿Qué te dice realmente el mensaje de error?
- Si quieres convertir `"3.14"` a entero, ¿por qué `int("3.14")` falla pero `int(float("3.14"))` funciona? ¿Qué hace el paso intermedio?
- Python tiene `math.floor()` y `math.ceil()`. ¿En qué se diferencian de `int()` para números negativos? ¿Cuándo elegirías uno sobre otro?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-conversion">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué es int(4.7)?</p>
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