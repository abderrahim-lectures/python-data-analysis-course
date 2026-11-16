---
title: "La moda"
description: "El valor más frecuente: la única medida de centro que funciona con etiquetas, y la que puede no existir."
module: "relationships"
order: 8
difficulty: "beginner"
estimatedMinutes: 14
learningObjectives:
  - "Hallar la moda de una lista de números y de una lista de categorías"
  - "Reconocer datos sin moda o con varias modas"
  - "Explicar cuándo la moda es la única medida de centro válida"
  - "Describir qué sugiere una distribución bimodal sobre los datos"
prerequisites: []
tags: ["moda", "categórico", "frecuencia", "bimodal"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

La **moda** es el valor que aparece más veces. A diferencia de la media y de la mediana, no necesita aritmética alguna, solo contar, y eso la convierte en la única medida de centro que funciona con nombres, colores y categorías.

$$
\text{moda} = \text{el valor con la frecuencia más alta.}
$$

Una lista puede no tener moda (cada valor aparece una vez) o tener varias (dos o más valores empatan como el más frecuente). Ambas cosas son normales, y ninguna es un error.

## Qué aporta

Pregunta "¿cuál es el color medio de un coche?" y la media no significa nada mientras la mediana queda sin definir. La moda responde: blanco, porque el blanco es el que más se vende.

La moda también dice algo que la media y la mediana no pueden: dónde está el *grueso* de los datos. Si una distribución tiene dos picos, la media cae entre ellos, en un valle donde casi no hay datos. La moda apunta a los picos, y dos modas son una pista fuerte de que tu conjunto de datos son en realidad dos grupos pegados.

## A mano, paso a paso

Tallas de zapato vendidas en una tienda en un día:

$$
38,\;39,\;39,\;40,\;40,\;40,\;41,\;42,\;42
$$

Cuenta cada valor: 38 una vez, 39 dos veces, 40 tres veces, 41 una vez, 42 dos veces. La moda es 40, la talla de la que la tienda debería tener más existencias.

Ahora el día de una segunda tienda:

$$
38,\;39,\;40,\;41,\;42
$$

Cada valor aparece una vez. **No hay moda**, y eso es un hallazgo útil: ninguna talla domina, así que conviene surtir de forma uniforme en lugar de acumular existencias de una sola talla.

## Datos bimodales

Tiempos de espera en dos clínicas, juntados en una sola lista:

$$
5,\;6,\;6,\;7,\;8,\;30,\;31,\;31,\;32,\;33
$$

Hay dos grupos, uno alrededor de 6 minutos y otro alrededor de 31. La lista es **bimodal**. La media es de unos 18,9, una espera que nadie vivió; la mediana es de unos 19,5, también poco representativa. Las modas (6 y 31) son los únicos resúmenes que se corresponden con lo que pasa.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Una lista combinada de una clínica muestra dos grupos. ¿Qué harías antes de informar un único número para ella?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Separar los datos en los dos grupos y describir cada uno por su lado: probablemente son dos clínicas distintas, dos turnos o dos tipos de paciente. Un promedio único sobre un conjunto bimodal describe un grupo que no existe, e informar solo las modas oculta el tamaño de los dos grupos.</p>

</div>
</details>

## Lo mismo en Python

```python
sizes = [38, 39, 39, 40, 40, 40, 41, 42, 42]

from collections import Counter
counts = Counter(sizes)
print(counts.most_common(1))       # [(40, 3)]

from statistics import multimode
print(multimode([38, 39, 40, 41, 42]))   # [] — no mode at all
print(multimode([1, 1, 2, 2, 3]))        # [1, 2] — two modes
```

`Counter` es la manera honesta de ver la forma antes de resumirla; `multimode` devuelve todos los valores empatados en lugar de elegir uno en silencio.

## Cuándo usarla

- **Datos categóricos**: colores, marcas, departamentos, tipos de dispositivo, cualquier cosa sin orden ni aritmética.
- **Datos discretos con un valor dominante**: la talla de zapato más común, el código de error más frecuente.
- **Encontrar subgrupos** antes de resumir: dos modas son una señal de que hay que separar los datos.

## Limitaciones

- **Puede no existir** (nada se repite) o ser ambigua (muchos empates), lo que la vuelve inútil como resumen único en esos casos.
- **Ignora todo menos el pico.** Un cambio mínimo en un valor puede crear o destruir un empate.
- **En datos continuos es inestable.** El redondeo y la anchura de los intervalos cambian la respuesta, así que rara vez se usa para mediciones.
- **No dice nada del resto de la distribución.**

## Errores frecuentes

- **Informar "sin moda" como si fuera un error.** Es un resultado válido y merece decirse.
- **Usar la moda con datos numéricos porque es fácil.** Para mediciones, la media o la mediana llevan mucha más información.
- **Ignorar una segunda moda** cuando es lo más interesante de los datos.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Respuestas de una encuesta: 12 personas eligieron "correo electrónico", 12 eligieron "teléfono" y 5 eligieron "chat". ¿Cuál es la moda, y qué informarías?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Hay dos modas, correo electrónico y teléfono, empatadas a 12. Informa las dos, con los recuentos: "correo electrónico y teléfono empatan como el canal preferido (12 cada uno), el chat queda muy atrás en tercer lugar (5)". Informar uno de los dos de forma arbitraria pierde información que la encuesta pagó.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué la moda puede existir para datos en los que la media no está definida?
- ¿Puede un conjunto de datos tener moda pero no media? ¿Y media pero no moda?
- Si una distribución es bimodal, ¿está mal la media o está mal la pregunta?
- ¿Por qué agrupar datos continuos en intervalos cambia la moda?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-mode-es">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Cuándo es la moda la única medida de centro apropiada?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Cuando los datos se distribuyen normalmente.</button>
      <button class="quiz-q__opt" data-idx="1">Cuando los datos son categóricos, sin orden numérico.</button>
      <button class="quiz-q__opt" data-idx="2">Cuando hay valores atípicos.</button>
      <button class="quiz-q__opt" data-idx="3">Cuando la muestra es muy grande.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Los valores 1, 2, 2, 3, 4, 4, 5, ¿qué moda o modas tienen?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Solo 2.</button>
      <button class="quiz-q__opt" data-idx="1">Ninguna.</button>
      <button class="quiz-q__opt" data-idx="2">2 y 4, empatadas.</button>
      <button class="quiz-q__opt" data-idx="3">3, el valor central.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
