---
title: "Cuartiles y rango intercuartílico"
description: "Parte los datos ordenados en cuatro y mide la mitad central: una dispersión que un solo valor extremo no puede inflar."
module: "spread-and-shape"
order: 7
difficulty: "beginner"
estimatedMinutes: 20
learningObjectives:
  - "Hallar a mano los tres cuartiles de un conjunto de datos ordenado y pequeño"
  - "Calcular el rango intercuartílico y decir qué mide"
  - "Usar la regla de 1,5 × RIC para señalar posibles valores atípicos"
  - "Dibujar y leer un resumen de cinco números y un diagrama de caja"
prerequisites: []
tags: ["cuartiles", "ric", "diagrama-de-caja", "valores-atípicos"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

La mediana parte en dos los datos ordenados. Parte cada mitad otra vez y tienes los **cuartiles**: tres puntos de corte que dividen los datos en cuatro grupos de tamaño aproximadamente igual.

- $Q_1$, el primer cuartil: el 25 % de los valores están en él o por debajo.
- $Q_2$, el segundo cuartil: la mediana, con el 50 % por debajo.
- $Q_3$, el tercer cuartil: el 75 % por debajo.

El **rango intercuartílico** es la distancia entre los dos extremos:

$$
\text{RIC} = Q_3 - Q_1 .
$$

Es la anchura de la mitad central de los datos: el rango que contiene el caso típico e ignora las dos colas.

## Qué aporta

La desviación típica eleva al cuadrado sus distancias, así que un valor extremo puede dominarla. El RIC usa posiciones, exactamente como la mediana, así que ningún valor por extremo que sea puede moverlo. Recurre al RIC cuando las colas de los datos son largas o cuando sospechas que algunas entradas están mal pero no lo has confirmado.

El RIC también ofrece una manera con fundamento de decir "este valor está sospechosamente lejos": la **regla de 1,5 × RIC**. Todo lo que quede por debajo de $Q_1 - 1{,}5\,\text{RIC}$ o por encima de $Q_3 + 1{,}5\,\text{RIC}$ se señala. Es una convención, no una ley, pero es la que dibujan los diagramas de caja.

## A mano, paso a paso

Once tiempos de espera ordenados, en minutos:

$$
2,\;4,\;4,\;5,\;7,\;9,\;11,\;12,\;14,\;18,\;40
$$

**Paso 1: la mediana.** Con $n=11$ la posición central es 6, así que $Q_2 = 9$.

**Paso 2: divide en mitades.** Por debajo de la mediana: $2,4,4,5,7$. Por encima: $11,12,14,18,40$.

**Paso 3: los cuartiles son las medianas de esas mitades.** Cada mitad tiene cinco valores, así que $Q_1 = 4$ y $Q_3 = 14$.

**Paso 4: el RIC.**

$$
\text{RIC} = 14 - 4 = 10 \text{ minutos}
$$

**Paso 5: las vallas de valores atípicos.** Valla inferior $4 - 15 = -11$; valla superior $14 + 15 = 29$. El valor 40 queda por encima de 29, así que se señala. La desviación típica de estos datos es de unos 10,6, inflada por ese mismo 40; el RIC no se mueve.

Fíjate en que las vallas no son instrucciones de "borra este valor". Marcan un valor que merece la pena revisar: una errata, otra unidad o un caso genuinamente insólito.

## El resumen de cinco números y el diagrama de caja

Cinco números describen la forma sin suponer nada sobre ella:

$$
\text{mín},\; Q_1,\; Q_2,\; Q_3,\; \text{máx}
= 2,\; 4,\; 9,\; 14,\; 40 .
$$

Un diagrama de caja dibuja exactamente eso: una caja desde $Q_1$ hasta $Q_3$ con una línea en la mediana, bigotes hasta los valores más extremos que quedan dentro de las vallas, y puntos para todo lo que va más allá. La anchura de la caja *es* el RIC, así que el gráfico hace visible la dispersión de un vistazo.

Puedes construir uno y arrastrar los valores en la [herramienta de diagramas de caja de GeoGebra](https://www.geogebra.org/m/b5cct2aq); ver la caja quieta mientras un bigote se estira es la manera más clara de entender qué tolera el RIC.

## Lo mismo en Python

```python
times = [2, 4, 4, 5, 7, 9, 11, 12, 14, 18, 40]

import statistics as st
q1 = st.quantiles(times, n=4)      # [4, 9, 14]
iqr = q1[2] - q1[0]
print(q1, iqr)                      # [4, 9, 14] 10

low, high = q1[0] - 1.5 * iqr, q1[2] + 1.5 * iqr
print(low, high)                    # -11.0 29.0
print([t for t in times if t < low or t > high])   # [40]
```

Con pandas las mismas cantidades salen de `describe()`, que imprime el resumen de cinco números más la media y la desviación típica en una sola llamada:

```python
import pandas as pd

s = pd.Series(times)
print(s.describe())
```

## Cuándo usarlo

- **Datos sesgados**: ingresos, precios, latencias, cualquier cosa con una cola larga.
- **Datos sospechosos**: la regla de las vallas encuentra entradas que conviene revisar antes de que distorsionen una media.
- **Comparar grupos** con tamaños de muestra distintos, donde un diagrama de caja por grupo informa más que dos medias.

## Limitaciones

- **Tira las colas.** Dos conjuntos de datos pueden compartir un resumen de cinco números y diferir en todo lo demás.
- **Las definiciones de cuartil difieren.** Software distintos calculan $Q_1$ y $Q_3$ de forma ligeramente distinta en muestras pequeñas, así que una respuesta a mano puede quedar un paso por detrás de la de un paquete. El RIC es lo bastante estable para el uso práctico.
- **Nada de aritmética.** Como la mediana, no se suma entre grupos.
- **Las muestras pequeñas dan cuartiles gruesos.** Con menos de unos ocho valores los cuartiles apenas informan más que el mínimo y el máximo.

## Errores frecuentes

- **No ordenar antes.** Los cuartiles son posicionales como la mediana; con datos sin ordenar dan disparates.
- **Leer los bigotes de un diagrama de caja como mínimo y máximo.** Los bigotes se detienen en la valla; los puntos que quedan más allá se dibujan aparte.
- **Tratar una marca de valor atípico como un error.** Es una invitación a mirar, no un veredicto.
- **Comparar RIC entre unidades.** Minutos y dólares no son comparables; usa el coeficiente de variación si necesitas comparar dispersiones.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Datos: $1, 2, 3, 4, 5, 6, 7, 8, 9, 100$. Calcula el RIC y la desviación típica. ¿Qué resumen describe mejor el centro, y qué informarías a un lector?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> $Q_1 = 3$, $Q_3 = 8$, RIC $= 5$; la media es 14,5 y la desviación típica de unos 29,4, ambas dominadas por el 100. Informa la mediana (5,5) y el RIC (5), y menciona el 100 como una observación aparte. El resumen de cinco números sigue siendo honesto donde la media y la desviación típica describen un conjunto de datos que no existe.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué ningún valor individual puede cambiar el RIC como cambia el rango?
- Si la caja de un diagrama de caja es muy estrecha pero los bigotes son largos, ¿cómo son los datos?
- ¿Por qué el multiplicador 1,5 es una convención y no una regla derivada de los datos?
- ¿Qué muestra un diagrama de caja que no muestra un histograma, y qué oculta?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-iqr-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Qué mide el rango intercuartílico?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La distancia del valor menor al mayor.</button>
      <button class="quiz-q__opt" data-idx="1">La distancia media a la media.</button>
      <button class="quiz-q__opt" data-idx="2">La anchura de la mitad central de los datos ordenados.</button>
      <button class="quiz-q__opt" data-idx="3">El valor más frecuente.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Q1 = 20 y Q3 = 50. ¿Por encima de qué valor señala un punto la regla de 1,5 × RIC?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">50</button>
      <button class="quiz-q__opt" data-idx="1">95</button>
      <button class="quiz-q__opt" data-idx="2">80</button>
      <button class="quiz-q__opt" data-idx="3">125</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
