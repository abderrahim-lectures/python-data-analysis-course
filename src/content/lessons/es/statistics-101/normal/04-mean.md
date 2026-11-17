---
title: "La media"
description: "Sumar todos los valores y dividir entre cuántos hay: qué dice de verdad el promedio, y el único caso en que engaña."
module: "describing-data"
order: 4
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Calcular la media a mano a partir de una lista corta de números"
  - "Calcular la misma media en Python con código simple y con statistics.mean"
  - "Explicar la media como el punto de equilibrio de los datos"
  - "Reconocer cuándo un único valor extremo desplaza la media lejos del resto"
prerequisites: []
tags: ["media", "promedio", "estadística-descriptiva", "centro"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

La **media** es el número que tendrían todos los valores si fueran iguales y el total no cambiara. Se calcula sumando todo y dividiendo por cuántos valores hay.

Para los valores $x_1, x_2, \dots, x_n$:

$$
\bar{x} = \frac{x_1 + x_2 + \cdots + x_n}{n} = \frac{1}{n}\sum_{i=1}^{n} x_i
$$

Lee el lado derecho como una instrucción: *suma las $x$ y reparte el total a partes iguales entre $n$ sitios.* No hay nada escondido en esa fórmula, y esa es su virtud.

## Qué aporta

Un número resume muchos. En lugar de llevar 200 precios de bicicletas en la cabeza, llevas un número que conserva una propiedad importante de la lista entera: su total. Si conoces la media y el número de casos, puedes recuperar la suma exactamente:

$$
\text{suma} = n \cdot \bar{x}.
$$

Ninguna otra medida de centro conserva el total. Por eso la media aparece en todo lo que tiene que ver con dinero, desde el gasto medio por cliente hasta el PIB por persona: los totales importan, y la media es el total con el número de casos dividido.

## A mano, paso a paso

Cinco tiempos de entrega en minutos:

$$
8,\; 12,\; 10,\; 15,\; 45
$$

Paso 1 — súmalos:

$$
8 + 12 + 10 + 15 + 45 = 90
$$

Paso 2 — divide entre el número de casos, $n = 5$:

$$
\bar{x} = \frac{90}{5} = 18
$$

La media es 18 minutos. Comprueba el significado: si las cinco entregas hubieran tardado 18 minutos, el total seguiría siendo 90. Eso es exactamente lo que promete la media.

## Lo mismo en Python

```python
times = [8, 12, 10, 15, 45]

total = sum(times)
n = len(times)
print(total / n)                 # 18.0
```

Hacerlo a mano primero importa, porque la versión de librería esconde los dos pasos. La biblioteca estándar tiene el mismo cálculo:

```python
from statistics import mean

print(mean([8, 12, 10, 15, 45]))  # 18
```

Ambas son correctas. La forma larga vale la pena conocerla porque, cuando la respuesta parece rara, necesitas saber qué parte revisar.

## Cuando un solo valor la arrastra

Mira otra vez esos cinco tiempos. Cuatro están entre 8 y 15 minutos. El quinto es 45. La media, 18, es mayor que cuatro de los cinco valores: está por encima de casi todos los datos.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Quita la entrega de 45 minutos. ¿Cuál es la media de las cuatro restantes?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> $(8+12+10+15)/4 = 45/4 = 11{,}25$. Un valor de cinco movió la media de 11,25 a 18, un cambio de 6,75 minutos, mientras que los otros cuatro apenas cambiaron.</p>

</div>
</details>

Esa sensibilidad no es un defecto que haya que parchear; es la media haciendo su trabajo. Una entrega de 45 minutos contribuye de verdad con 45 minutos al total, y la media se construye a partir de totales. El problema aparece solo cuando usas la media para describir un valor *típico* mientras los datos contienen valores que no son típicos.

## Verlo geométricamente

Cada valor puede dibujarse como un punto en una recta, y la media es el punto donde la recta se equilibra, como un balancín con pesos:

- un valor lejos de la media tira más, porque su distancia cuenta más;
- las distancias por encima y por debajo se compensan exactamente.

Puedes arrastrar puntos en una recta numérica y ver cómo se mueve el punto de equilibrio en el [explorador de media y mediana de GeoGebra](https://www.geogebra.org/m/zsbf4jqm). Fíjate en qué ocurre al arrastrar un punto muy a la derecha: el punto de equilibrio lo sigue.

## Cuándo usarla

- Te importa el **total**, no los casos individuales: gasto medio por cliente, puntuación media, temperatura media.
- Los datos son aproximadamente simétricos, sin valores extremos por un solo lado.
- Vas a hacer aritmética con ella después: las medias se suman de una forma en que las medianas no, y por eso casi todas las fórmulas posteriores del curso usan la media.

## Limitaciones

- **La arrastran los valores atípicos.** Un valor muy grande o muy pequeño puede alejarla mucho del resto.
- **Necesita números.** No hay media de "rojo, verde, azul".
- **Puede ser un valor que nadie tiene.** La media de 2 y 3 es 2,5; si la variable solo toma enteros, 2,5 puede ser imposible.
- **No dice nada sobre la dispersión.** Dos conjuntos con variabilidad muy distinta pueden compartir media. El siguiente módulo lo corrige.

## Errores frecuentes

- **Dividir entre el número equivocado.** Incluir una fila de encabezado o una celda vacía es el error de media más común en el trabajo real.
- **Promediar promedios.** La media de tres medias de grupo solo es la media global cuando los grupos son del mismo tamaño. Si no, hay que ponderar por el tamaño.
- **Publicar más decimales de los que sostienen los datos.** Si los tiempos se registran al minuto, informa 18 minutos, no 18,0.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Tres grupos de estudiantes hacen un examen. El grupo A (10 estudiantes) promedia 70, el B (20) promedia 80 y el C (30) promedia 90. ¿Cuál es la media global? ¿Es 80?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> No. El promedio sin ponderar de las tres medias es 80, pero los grupos tienen tamaños distintos. La media global es $(10\cdot70 + 20\cdot80 + 30\cdot90)/60 = 5000/60 \approx 83{,}3$. El grupo C es el mayor, así que tira del resultado hacia 90.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- Si la media de cinco números es 10, ¿tiene que ser 10 alguno de ellos?
- ¿Qué le pasa a la media si añades un valor igual a la media actual?
- ¿Por qué multiplicar todos los valores por 2 duplica la media, mientras que sumar 5 a todos añade exactamente 5?
- Una tienda anuncia "el cliente medio gasta 40 $" pero la mayoría gasta menos de 20. ¿Qué preguntarías antes de creerlo?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-mean-es">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué representa la media de una lista de números?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">El valor que aparece más veces.</button>
      <button class="quiz-q__opt" data-idx="1">El valor que tendría cada entrada si el total se repartiera por igual.</button>
      <button class="quiz-q__opt" data-idx="2">El valor central una vez ordenada la lista.</button>
      <button class="quiz-q__opt" data-idx="3">El mayor menos el menor.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Los valores 4, 6, 8, 10, 52 tienen media 16. ¿Qué afirmación es cierta?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">16 es un valor típico de esta lista.</button>
      <button class="quiz-q__opt" data-idx="1">La media está mal; debería ser 10.</button>
      <button class="quiz-q__opt" data-idx="2">El único valor 52 empuja la media por encima de cuatro de las cinco entradas.</button>
      <button class="quiz-q__opt" data-idx="3">La media ignora el 52 porque es atípico.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
