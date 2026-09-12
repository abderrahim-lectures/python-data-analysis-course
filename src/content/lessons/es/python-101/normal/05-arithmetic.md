---
title: "Operadores aritméticos"
description: "Suma, resta, multiplica, divide, división de piso, módulo y exponente — los ocho operadores aritméticos."
module: "operators"
order: 5
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar los ocho operadores aritméticos: +, -, *, /, //, %, **"
  - "Comprender la división de piso frente a la división verdadera"
  - "Aplicar la precedencia de operadores (PEMDAS)"
  - "Usar paréntesis para anular la precedencia"
prerequisites: ["04-type-conversion"]
tags: ["aritmética", "división", "módulo", "exponente", "precedencia"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Los operadores que una máquina toma prestados de la matemática

Ya escribiste funciones auxiliares en lecciones anteriores: guardar un valor, imprimirlo, cambiarle el tipo. Nada de eso sirve hasta que un programa pueda *hacer algo* con los números. Así que haz una pausa y observa: una computadora existe para evaluar expresiones, y toda expresión se construye con **operadores** que unen valores. Ya conoces los de aritmética del papel — pero la máquina corta dos de ellos por la mitad.

## Los operadores y sus significados

Python ofrece ocho. Los primeros cuatro son exactamente lo que esperas:

```python
7 + 2    # 9   — suma
7 - 2    # 5   — resta
7 * 2    # 14  — multiplicación
7 / 2    # 3.5 — división verdadera (siempre devuelve un float)
```

Después vienen tres que responden a preguntas que solo hiciste en los deberes:

```python
7 // 2   # 3   — división de piso (redondea hacia −∞)
7 % 2    # 1   — módulo (el resto)
7 ** 2   # 49  — potenciación (7²)
```

`**` es cómo Python escribe la potencia: $7^2 = 49$. Los dos recién llegados son `//` y `%`, y no son variaciones — son las dos mitades de una misma pregunta legítima.

## Dos mitades de una misma división

Haz una pregunta real: *¿cuántos grupos enteros de 4 caben en 15, y cuánto sobra?*

$$
15 = 4 \cdot 3 + 3.
$$

La respuesta tiene dos partes — el cociente $3$ y el resto $3$. El `//` de Python responde la primera parte y el `%` responde la segunda:

$$
a = (a \mathbin{//} b) \cdot b + (a \mathbin{\%} b)
$$

```python
15 // 4   # 3   — cuántos grupos de 4
15 % 4    # 3   — cuánto sobra
4 * 3 + 3 # 15  ✓ la identidad se cumple
```

Esa identidad no es decoración — es la definición de ambos operadores, y no puede fallar mientras las dos partes las calcule la misma máquina.

Hay un pliegue. ¿Qué cociente da Python para $-7 \div 2$? Escríbelo como pregunta de agrupación:

$$
-7 = 2 \cdot ? + ?.
$$

Las opciones son $2 \cdot (-3) + (-1)$ o $2 \cdot (-4) + 1$. Python toma el piso, como la función matemática $\lfloor x \rfloor$:

```python
-7 // 2   # -4 — floor(-3.5) = -4, no -3
-7 % 2    # 1  — coherente con el piso: -7 = 2·(-4) + 1
```

Los dos operadores se mantienen fieles entre sí: la identidad $a = (a//b)\cdot b + (a\%b)$ se cumple sin excepciones, y eso vale más que "la respuesta intuitiva".

## El orden de las operaciones, zanjado

Si una expresión contiene varios operadores, hace falta una secuencia fija, o cada lector calcularía un valor distinto para $2 + 3 \cdot 4$. Python adopta el orden que aprendiste como PEMDAS:

- `**` primero (potenciación)
- luego `*`, `/`, `//`, `%` (de izquierda a derecha)
- luego `+`, `-` (de izquierda a derecha)

```python
2 + 3 * 4      # 14, no 20
(2 + 3) * 4    # 20 — los paréntesis anulan
2 ** 3 ** 2    # 512, no 64
```

Ese último es una auténtica sorpresa. `**` es **asociativo a la derecha**, así que `2 ** 3 ** 2` se lee como $2^{(3^2)} = 2^9 = 512$, igual que en la notación apilada donde las potencias escalan en una sola dirección. Ante la duda, escribe los paréntesis — un lector que no los ve no adivinará tu intención.

## Un ejemplo resuelto: el cambio del plan de lectura

El par cociente/resto administra un plan de lectura:

```python
pages = 301
per_day = 30
days = pages // per_day      # 10 — días enteros de lectura
leftover = pages % per_day   # 1  — el resto del undécimo día

print(f"{days} full days, {leftover} leftover")
days * per_day + leftover    # 301 — la identidad se cumple
```

La identidad de la división $a = (a \mathbin{//} b) \cdot b + (a \mathbin{\%} b)$ se vuelve un libro mayor: `days` y `leftover` son sus dos columnas, y la identidad es el recibo que prueba que nada se perdió.

## Errores comunes

- **`/` frente a `//`.** `7 / 2` es `3.5` (un float); `7 // 2` es `3` (un int). Recurre a `//` solo cuando el cociente entero sea lo que pide el problema.
- **División de piso con negativos.** `-7 // 2` es `-4`, no `-3`. El piso va hacia $-\infty$, no hacia cero.
- **El `%` también funciona con floats.** `7.5 % 2` es `1.5` — la identidad de arriba vale para reales tanto como para enteros.
- **`**` enlaza más fuerte que `*`.** `2 * 3 ** 2` es `18`, no `36` — la potencia se calcula primero. Pon paréntesis cuando quieras decir `(2 * 3) ** 2` = 36.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Sin ejecutarlo, calcula `15 // 4` y `15 % 4` a mano y luego verifica que $4 \cdot (15 // 4) + (15 \% 4)$ reproduce $15$.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>15 // 4</code> es <code>3</code> (el piso de $3.75$), y <code>15 % 4</code> es <code>3</code>, ya que $15 = 4\cdot 3 + 3$. Juntos, <code>4 * 3 + 3 = 15</code> — la identidad de la división, verificada.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

¿Cómo extraerías la cifra de las centenas de cualquier número? Dado `n = 4567`, obtén `5` usando solo aritmética, sin cadenas.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>(n // 100) % 10</code> — primero divide por 100 para desplazar la cifra a la derecha (<code>4567 → 45</code>), luego módulo 10 para quedarte solo con la última (<code>45 → 5</code>).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

¿Por qué Python usa `**` para la potenciación en lugar de `^`? ¿Qué hace `^` en realidad en Python?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>^</code> es el operador XOR bit a bit en Python, no la potenciación. Python usa <code>**</code> para evitar chocar con la convención de los lenguajes donde <code>^</code> significa XOR.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué la división de piso redondea hacia menos infinito y no hacia cero? ¿Qué beneficio práctico se desprende de esa elección (pista: piensa en `divmod()` devolviendo un par coherente)?
- `2 ** 3 ** 2` es `512`, no `64`. ¿Por qué `**` es asociativo a la derecha cuando `+` y `*` lo son a la izquierda?
- ¿Dónde gana el pan la aritmética modular en la vida real? Piensa en relojes, días del calendario o índices de un arreglo.

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-arithmetic">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Cuánto es -7 // 2?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">-3</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">-4</button>
      <button class="quiz-q__opt" data-idx="3">-3.5</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ¿Cuál es el resultado de 2 ** 3 ** 2?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">512</button>
      <button class="quiz-q__opt" data-idx="1">64</button>
      <button class="quiz-q__opt" data-idx="2">36</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. ¿Cuánto es 7 % 3?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">2</button>
      <button class="quiz-q__opt" data-idx="1">1</button>
      <button class="quiz-q__opt" data-idx="2">3</button>
      <button class="quiz-q__opt" data-idx="3">0</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>