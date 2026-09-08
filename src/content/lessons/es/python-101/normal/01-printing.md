---
title: "Impresión y salida"
description: "muestra resultados con print(), formatea texto con f-strings y controla lo que aparece en pantalla."
module: "python-basics"
order: 1
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar print() para mostrar valores y mensajes"
  - "Formatear la salida con f-strings y especificadores de formato"
  - "Combinar varios valores en una sola llamada a print()"
prerequisites: []
tags: ["salida", "print", "f-strings", "formato"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Imprimir valores

`print()` envía la salida a la pantalla. Pásale cualquier valor y Python lo convierte a texto:

```python
print(42)         # 42
print(3.14)       # 3.14
print("hello")    # hello
```

Los múltiples argumentos se unen con un espacio:

```python
print("Score:", 87)    # Score: 87
```

## F-strings: salida formateada

Prefija una cadena con `f` y coloca expresiones dentro de `{ }`:

```python
name = "Amina"
score = 87.5
print(f"{name} scored {score}%")    # Amina scored 87.5%
```

Los especificadores de formato controlan la precisión y la alineación:

```python
price = 19.999
print(f"Total: ${price:.2f}")       # Total: $20.00 — rounds to 2 decimal places
print(f"Double: {price * 2}")       # any expression works inside { }
```

Incluso los condicionales funcionan en línea:

```python
passing = "yes" if score >= 60 else "no"
print(f"Passing? {passing}")
```

## Errores comunes

- **Olvidar que `print()` no tiene valor de retorno.** `print("hi")` muestra texto pero evalúa a `None` — no puedes capturar su resultado.
- **Mezclar tipos en la concatenación.** `print("Score: " + 87)` lanza un `TypeError`. Usa f-strings en su lugar: `print(f"Score: {87}")`.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Imprime tu nombre, tu edad y un número favorito, cada uno en su propia línea, usando tres llamadas separadas a `print()`. Luego hazlo de nuevo con una sola f-string que incluya saltos de línea (`\n`).

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>print(f"Name: {name}\nAge: {age}\nFavorite: {num}")</code> — el <code>\n</code> dentro de la f-string produce un salto de línea.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Dado `temperature = 23.7891`, imprímelo como `"Today: 23.8°C"` (con un solo decimal).

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>print(f"Today: {temperature:.1f}°C")</code> — el especificador de formato <code>:.1f</code> redondea a un decimal.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué Python usa `print()` como función (con paréntesis) en lugar de una instrucción? ¿Qué ventaja te da eso?
- `print("A", "B", "C")` imprime `A B C` con espacios. ¿Cómo podrías imprimirlos sin espacios? ¿Con comas entre ellos?
- Si `x = 3.14`, ¿qué produce `f"{x}"`? ¿Y `f"{x:.0f}"`? Explica la diferencia.

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-printing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué muestra print(f"{'yes' if 5 > 3 else 'no'}")?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5 > 3</button>
      <button class="quiz-q__opt" data-idx="1">yes</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Cómo imprimes 3.14159 como 3.14 (con dos decimales)?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f"{x:2f}"</button>
      <button class="quiz-q__opt" data-idx="1">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="2">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="3">f"{x:2.0f}"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>