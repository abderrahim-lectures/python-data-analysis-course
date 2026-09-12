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

## Una respuesta encerrada dentro de la máquina

Prueba a calcular

$$
\frac{17 \cdot 3 + 4^2}{5}.
$$

A mano escribirías los pasos y la respuesta en papel:

$$
17 \cdot 3 + 4^2 = 51 + 16 = 67, \qquad \frac{67}{5} = 13{,}4.
$$

Obtener la respuesta es solo la mitad de resolver un problema, la otra mitad es **comunicarla**. Ahora dale esa misma expresión a un ordenador. Calcula $13{,}4$ en un parpadeo, e inmediatamente se olvida de decírtelo. El valor queda guardado en silencio dentro de la máquina y, a menos que le exijas que salga, nunca lo verás.

Esa operación invisible es el problema fundamental que resuelve esta lección. Un programa necesita una forma de *escribir sus resultados donde un humano pueda leerlos*, en Python, esa instrucción es `print()`.

## `print()`, revela un valor

`print()` toma un valor y lo envía a la pantalla. Cualquier valor sirve: Python lo convierte a texto primero.

```python
print(13.4)        # 13.4
print(42)          # 42
print("hello")     # hello
```

No tienes que imprimir un número terminado, `print()` acepta cualquier expresión y la evalúa primero:

```python
print((17 * 3 + 4**2) / 5)    # 13.4
```

El patrón a recordar: **calcula algo y luego entrégaselo a `print()`. Los valores no tienen salida de un programa por sí solos; imprimir es la puerta.**

## Un número, y su etiqueta

Un número suelto rara vez significa mucho. En papel no escribirías $13{,}4$ solo, escribirías "Puntaje: 13,4". Dales a `print()` varios argumentos y pondrá un espacio entre ellos:

```python
print("Score:", 87)    # Score: 87
```

El primer argumento es la etiqueta; el segundo, el valor. Puedes apilar tantos como quieras, y `print()` los mantiene separados por ti.

## Mostrar exactamente las cifras que quieres

Aquí empiezan los problemas: el valor

$$
\pi = 3.14159\ldots
$$

lleva todas sus cifras consigo en todo momento. Pero una tabla necesita $\pi \approx 3.14$, una línea del tiempo necesita `23.8°C`, no `23.7891°C`. El número de cifras mostradas es una *elección de cómo presentar* el número, y no debe cambiar el valor guardado, o perderás la precisión para siempre.

Por eso el redondeo debe vivir en la impresión, no en la operación. Un **f-string** te permite decidir en el momento de imprimir: escribe `f"..."`, mete la expresión dentro de `{...}` y añade un especificador de formato tras los dos puntos:

```python
price = 19.999
print(f"Total: ${price:.2f}")        # Total: $20.00   (se muestra redondeado)
print(price)                          # 19.999          (el valor intacto)
print(f"Double: {price * 2}")         # 39.998          (cualquier expresión vale)
```

Merece la pena desentrañar qué pasa en `{price:.2f}`:

- `{price}` dice *pon aquí el valor*, el f-string hace la conversión a texto por ti.
- `:.2f` dice *muéstralo como número de punto fijo con 2 cifras decimales*, el redondeo ocurre solo en la forma mostrada.

Los especificadores hacen más que redondear: también alinean. Una columna de `7.5`, `8.5`, `87.5` se ve irregular; dale a cada entrada el mismo ancho y la columna se alinea:

```python
print(f"{7.5:>6}")     # "    7.5"   alineado a la derecha con ancho 6
print(f"{87.5:>6}")    # "   87.5"
```

## Un ejemplo resuelto: la columna de precios

Un recibo de tienda quiere las etiquetas a la izquierda y los números alineados por sus decimales. Dos direcciones de formato hacen ambas cosas:

```python
print(f"{'item':<10}{'price':>7}")
print(f"{'coffee':<10}{3.5:>7.2f}")
print(f"{'croissant':<10}{2.95:>7.2f}")

# item       price
# coffee      3.50
# croissant   2.95
```

`<10` alinea la etiqueta a la izquierda a lo ancho de diez columnas; `>7.2f` alinea el número a la derecha a lo largo de siete, guardando dos decimales. La alineación es solo formato en la otra dirección, el mismo `{valor:especificación}` que ya conoces, con la flecha diciendo hacia dónde se inclina el texto. Esta es la semilla de toda tabla que el curso construirá: etiquetas a un lado, números al otro.

## Errores comunes

- **`print()` no devuelve nada.** `print("hi")` muestra texto pero se evalúa como `None`, no puedes capturar lo que imprime en una variable. Imprimir es el *final* de una operación, nunca un paso dentro de ella.
- **Mezclar tipos con `+`.** `print("Score: " + 87)` lanza un `TypeError`, porque una cadena y un número no se pueden sumar. Los f-strings existen precisamente para emparejar una etiqueta con un valor: `print(f"Score: {87}")`.
- **Un `{` literal en un f-string necesita `{{`.** `f"{{x}}"` imprime `{x}`; un `{` suelto se lee como el comienzo de una expresión. Doblar es la vía de escape.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Calcula $\dfrac{2^5 + 9}{5}$ en papel y luego imprímela *sin* escribir tú la respuesta, deja que el ordenador calcule e imprima en un solo paso.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>print((2**5 + 9) / 5)</code> → <code>8.2</code>. Una expresión, entregada directamente a <code>print()</code>: la máquina la evalúa y escribe el resultado.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Dado `temperature = 23.7891`, imprime `"Today: 23.8°C"` (un decimal) sin tocar el valor guardado.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>print(f"Today: {temperature:.1f}°C")</code> → <code>Today: 23.8°C</code>. El especificador <code>:.1f</code> redondea <em>solo al mostrar</em>; <code>temperature</code> sigue siendo <code>23.7891</code>.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué Python usa `print()` como función (con paréntesis) en lugar de una instrucción? ¿Qué ventaja te da?
- `print("A", "B", "C")` imprime `A B C` con espacios. ¿Cómo podrías imprimirlos sin espacios? ¿Con comas entre ellos?
- Si `x = 3.14`, ¿qué produce `f"{x}"`? ¿Y `f"{x:.0f}"`? Explica la diferencia en términos del valor frente a su representación.

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-printing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Tu fórmula se calcula, pero el programa no muestra nada. ¿Por qué?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">El valor se calculó mal.</button>
      <button class="quiz-q__opt" data-idx="1">El resultado nunca se entregó a print().</button>
      <button class="quiz-q__opt" data-idx="2">Python descarta los valores que ya no necesita.</button>
      <button class="quiz-q__opt" data-idx="3">print() necesita al menos dos argumentos.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ¿Cómo imprimes 3.14159 mostrando dos decimales, sin redondear el valor guardado?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f"{x:2f}"</button>
      <button class="quiz-q__opt" data-idx="1">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="2">f"{x:.2d}"</button>
      <button class="quiz-q__opt" data-idx="3">print(x, 2)</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>