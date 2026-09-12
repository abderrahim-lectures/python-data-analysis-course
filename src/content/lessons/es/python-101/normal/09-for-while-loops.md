---
title: "Bucles for y while"
description: "Repite acciones sobre secuencias y hasta que las condiciones cambien."
module: "control-flow"
order: 9
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Iterar sobre listas, cadenas y rangos con bucles for"
  - "Usar bucles while para la repetición basada en condiciones"
  - "Controlar el flujo del bucle con break, continue y pass"
  - "Evitar los bucles infinitos"
prerequisites: ["08-if-elif-else"]
tags: ["for", "while", "bucles", "break", "continue"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Las dos máquinas que repiten

Escribe un programa para sumar los primeros cien enteros y se te acalambran las manos. Los matemáticos abstrajeron la repetición en un símbolo mucho antes de que existieran las computadoras:

$$
\sum_{i=1}^{100} i = 1 + 2 + \cdots + 100
$$

El signo $\sum$ es una instrucción de repetir. Un bucle es el $\sum$ de la computadora — y Python parte la idea en dos máquinas para dos clases de repetición. `for` repite sobre una *secuencia conocida*. `while` repite *hasta que una condición deje de ser verdadera*.

## For: repetición sobre una secuencia

Un bucle `for` visita cada elemento de una secuencia, uno por ronda:

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
# apple
# banana
# cherry
```

Léelo como corre: *"para cada fruta **en** la lista, haz esto."* La variable del bucle, `fruit`, toma un valor nuevo cada ronda hasta agotar la lista.

Las cadenas también son secuencias — los elementos son caracteres:

```python
for letter in "Python":
    print(letter)
```

Como un carácter es un elemento único, la matemática y la máquina coinciden: iterar sobre una cadena de longitud $n$ corre exactamente $n$ rondas.

## La secuencia numérica: range

La mayoría de las sumas van sobre números, así que Python ofrece `range` — una secuencia que puedes recorrer a saltos:

```python
for n in range(5):
    print(n)   # 0 1 2 3 4
```

`range(5)` produce la progresión aritmética $0, 1, 2, 3, 4$, como el conjunto de índices de $\sum_{i=0}^{4} a_i$. Dos argumentos más le dan la forma que necesitas: `range(start, stop, step)` camina desde `start`, en pasos de `step`, deteniéndose antes de `stop`:

```python
for n in range(10, 0, -2):
    print(n)   # 10 8 6 4 2
```

Vale la pena enunciar la regla de parada con exactitud: $n$ viaja mientras $n < \text{stop}$ (o $n > \text{stop}$ con paso negativo), como un intervalo semiabierto $[\text{start}, \text{stop})$.

## While: repetición hasta una condición

Algunas tareas no pueden enumerar sus rondas de antemano — sigues hasta que alguna condición se voltea. La aproximación de Newton es el prototipo: refina hasta que el cambio encaje por debajo de una tolerancia. Eso es un bucle `while`:

```python
count = 0
while count < 5:
    print(count)
    count += 1
# 0 1 2 3 4
```

La condición está arriba y se reexamina cada ronda. **Asegúrate de que con el tiempo se vuelva `False`** — si nada en el cuerpo cambia las variables que lee la condición, el bucle no termina jamás. Una suma que debe terminar se escribe con `for`; una búsqueda que solo acaba al hallar su respuesta se escribe con `while`.

## Break y continue

Dos palabras clave ajustan el flujo desde dentro.

`break` abandona el bucle de inmediato, sin importar cuántas rondas queden:

```python
for n in [1, 3, 4, 7, 8]:
    if n % 2 == 0:
        print(f"Found even: {n}")
        break
```

`continue` abandona solo *esta* ronda, saltando a la siguiente:

```python
for n in range(6):
    if n % 2 != 0:
        continue
    print(n)  # 0 2 4
```

Entre ellos caben en la recta numérica: `break` corta la cola $\{n \in \mathbb{Z} : n \geq m\}$; `continue` excava un subconjunto de rondas, como filtrar una progresión con una criba.

## Pass: un marcador vacío

Todo cuerpo de `if`, `for`, `while` y función necesita al menos una sentencia, pero a veces aún no la has escrito. `pass` es el no-op que ocupa el espacio:

```python
for n in range(10):
    if n % 3 == 0:
        pass  # TODO: handle multiples of 3 later
    else:
        print(n)
```

No hace nada — que es precisamente su trabajo: mantener el bloque sintácticamente válido mientras se redacta la sentencia real.

## Un ejemplo resuelto: la máquina Σ trabajando

Las herramientas de la lección se componen en el símbolo de suma de la apertura:

```python
total = 0
for n in range(1, 11):
    if n % 2 != 0:
        continue          # solo pares
    total += n
print(total)              # 2 + 4 + 6 + 8 + 10 = 30
```

El bucle es $\sum$ mecanizado: cada vuelta suma un término, `continue` cuela las vueltas impares, y `total` se acumula igual que el total corrido de la lección 02.

## Errores comunes

- **Bucles `while` infinitos.** Olvida actualizar la variable que lee la condición y el bucle girará para siempre. Verifica que el cuerpo mueva el estado hacia `False`.
- **Modificar una lista mientras la iteras.** Rebanar o borrar elementos a mitad de camino desplaza los índices bajo tus pies. Itera sobre una copia, o construye una lista nueva.
- **`for i in range(len(items))`.** A menos que necesites el índice en sí, itera sobre la secuencia directamente — `for fruit in fruits` dice lo que quieres.
- **`continue` se salta la vuelta; `break` abandona el bucle.** `continue` se salta solo la iteración actual; `break` termina el bucle entero. Confundirlos es cómo un bucle que debía parar sigue girando.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe un bucle `for` que imprima los primeros diez múltiplos de 3: $3, 6, 9, \ldots, 30$.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>for i in range(3, 31, 3): print(i)</code> — <code>range(3, 31, 3)</code> empieza en 3, avanza de 3 en 3 y se detiene antes de 31, así que cae exactamente en $3, 6, \ldots, 30$.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe un bucle `while` que recorra una cola (simúlala con una lista) y se detenga en el elemento `"quit"`, imprimiendo cada elemento que pise.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>inputs = ["hello", "world", "quit"]; i = 0; while inputs[i] != "quit": print(inputs[i]); i += 1</code> — la condición guarda el centinela y el índice mueve el estado hacia él.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Cuándo recurres a `while` en lugar de `for`? Da una tarea real para cada uno — una que puedas contar de antemano y otra que no.
- ¿Qué le pasa a una lista que modificas mientras un bucle `for` la recorre? ¿Cómo lo esquivas?
- Python no tiene `do…while` como C. ¿Cómo escribes un cuerpo que debe correr al menos una vez antes de comprobar condición alguna?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-loops">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué imprime <code>for i in range(0, 10, 3): print(i, end=" ")</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0 1 2 3 4 5 6 7 8 9</button>
      <button class="quiz-q__opt" data-idx="1">0 3 6 9</button>
      <button class="quiz-q__opt" data-idx="2">3 6 9</button>
      <button class="quiz-q__opt" data-idx="3">0 3 6</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Qué palabra clave salta el resto de la iteración actual del bucle?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">break</button>
      <button class="quiz-q__opt" data-idx="1">pass</button>
      <button class="quiz-q__opt" data-idx="2">continue</button>
      <button class="quiz-q__opt" data-idx="3">skip</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>