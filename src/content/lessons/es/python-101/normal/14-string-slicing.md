---
title: "Corte de cadenas"
description: "Extrae subcadenas con la potente notación de corte de Python."
module: "strings"
order: 14
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar la notación de corte [inicio:fin:paso] para extraer subcadenas"
  - "Invertir cadenas y saltar caracteres con paso"
  - "Usar índices negativos para contar desde el final"
  - "Aplicar el corte a listas (la misma sintaxis)"
prerequisites: ["13-string-methods"]
tags: ["corte", "subcadena", "índices", "paso"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Corte básico

La sintaxis es `cadena[inicio:fin:paso]` — `inicio` es inclusivo, `fin` es exclusivo:

```python
text = "Python"
text[0:3]    # 'Pyt'
text[2:5]    # 'tho'
text[:4]     # 'Pyth'  (start defaults to 0)
text[3:]     # 'hon'   (stop defaults to end)
text[:]      # 'Python' (full copy)
```

## Índices negativos

Cuenta desde el final con números negativos:

```python
text = "Python"
text[-1]     # 'n'  (last character)
text[-3:]    # 'hon' (last 3 characters)
text[:-2]    # 'Pyth' (all except last 2)
text[-4:-1]  # 'tho'
```

## Paso

El tercer parámetro controla la zancada:

```python
text = "abcdefghij"
text[::2]    # 'acegi'   (every 2nd character)
text[1::2]   # 'bdfhj'   (every 2nd, starting at index 1)
text[::-1]   # 'jihgfedcba'  (reversed!)
text[::-2]   # 'jhfdb'   (every 2nd, reversed)
```

## El corte nunca da errores

A diferencia del indexado, el corte nunca lanza `IndexError` — simplemente devuelve lo que puede:

```python
text = "hi"
text[0:100]   # 'hi'  (no error, just stops at end)
text[100:200] # ''    (empty string)
```

## El corte también funciona en listas

La misma sintaxis funciona para cualquier secuencia:

```python
nums = [0, 1, 2, 3, 4, 5]
nums[1:4]     # [1, 2, 3]
nums[::-1]    # [5, 4, 3, 2, 1, 0]
```

## Errores comunes

- **Confundir `text[3]` (indexado, un carácter) con `text[3:4]` (corte, sigue siendo un carácter pero es una cadena nueva)**
- **Asumir que `fin` es inclusivo** — `text[0:3]` da los caracteres en las posiciones 0, 1, 2
- **Usar asignación de corte en cadenas** — las cadenas no la soportan (las listas sí: `nums[1:3] = [9, 9]`)

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Invierte la cadena `"racecar"` usando corte.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>"racecar"[::-1]</code> → <code>"racecar"</code> (¡es un palíndromo!)</p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Dado `"abcdefghij"`, extrae cada 3er carácter: `a`, `d`, `g`, `j`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>"abcdefghij"[::3]</code> → <code>"adgj"</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué el corte nunca lanza un error pero el indexado sí? ¿Qué filosofía de diseño refleja esto?
- ¿Cómo intercambiarías dos elementos de una lista usando solo asignación de corte?
- Si `text[::-1]` invierte una cadena, ¿cómo comprobarías si una cadena es un palíndromo en una sola línea?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-string-slicing">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. ¿Qué devuelve <code>"Python"[1:4]</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">'yth'</button>
      <button class="quiz-q__opt" data-idx="1">'Pyt'</button>
      <button class="quiz-q__opt" data-idx="2">'ytho'</button>
      <button class="quiz-q__opt" data-idx="3">'Pyth'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Cómo inviertes una cadena <code>s</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">s.reverse()</button>
      <button class="quiz-q__opt" data-idx="1">s[::-0]</button>
      <button class="quiz-q__opt" data-idx="2">s[::-1]</button>
      <button class="quiz-q__opt" data-idx="3">s[::1]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>