---
title: "Leer un conjunto de datos con honestidad"
description: "Un flujo de trabajo que detecta los errores que describen las lecciones anteriores: mira primero, agrupa después, resume al final."
module: "samples-and-uncertainty"
order: 15
difficulty: "intermediate"
estimatedMinutes: 22
learningObjectives:
  - "Ejecutar una secuencia fija de comprobaciones sobre un conjunto de datos desconocido"
  - "Comparar media y mediana y usar la diferencia como diagnóstico"
  - "Detectar valores sospechosos con vallas e inspeccionarlos antes de eliminar nada"
  - "Publicar un resumen que declare sus propias limitaciones"
prerequisites: []
tags: ["flujo-de-trabajo", "calidad-de-datos", "valores-atípicos", "informes"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

Esta lección es una lista de comprobación y no una cantidad nueva. Cada medida de este curso es fácil de calcular y fácil de usar mal, y el mal uso es casi siempre un paso omitido y no una fórmula equivocada.

La secuencia que evita la mayor parte:

1. **Mira los datos** antes de resumirlos: recuentos, valores faltantes, tipos y un histograma.
2. **Calcula el centro de dos maneras** y compáralas; una diferencia grande es información sobre la forma.
3. **Mide la dispersión de dos maneras** y compáralas; la misma diferencia aparece.
4. **Señala los valores sospechosos** e inspecciona cada uno en lugar de borrarlo.
5. **Agrupa antes de juntar** cuando los datos llegaron en lotes o categorías.
6. **Publica el resumen con su incertidumbre y sus limitaciones.**

## Qué aporta

Un análisis que se salta el paso 1 es un cálculo, no un análisis. La lista convierte las lecciones individuales en un hábito, y el hábito es lo que detecta la paradoja de Simpson, un valor atípico que era una errata y una media que no describe a nadie.

## Ejemplo resuelto

Un conjunto de datos de 12 tickets de soporte, con tiempos de resolución en horas:

$$
1,\;2,\;2,\;3,\;3,\;4,\;5,\;6,\;8,\;12,\;20,\;96
$$

**Paso 1: mira.** Doce valores, todos numéricos, sin entradas faltantes evidentes. El máximo está muy lejos de todo lo demás.

**Paso 2: el centro de dos maneras.** Media: total 162, así que 13,5. Mediana: $(4+5)/2 = 4{,}5$. Una diferencia de 9 horas: los datos tienen una cola derecha larga.

**Paso 3: la dispersión de dos maneras.** Desviación típica de unos 27,6; RIC: $Q_1 = 2{,}75$, $Q_3 = 11$, así que 8,25. La desviación típica es más de tres veces el RIC, que es otra manera de decir que la cola la domina.

**Paso 4: señala e inspecciona.** Valla superior: $11 + 1{,}5(8{,}25) \approx 23{,}4$. El 96 se señala. Inspecciónalo: si es un ticket que se reabrió después de un mes, puede ser un caso genuino pero pertenece a otro proceso; si es un error de entrada de datos (96 minutos registrados como horas), corrígelo. No lo borres en silencio.

**Paso 5: agrupa.** ¿Estos tickets vienen de un equipo o de varios? Una mezcla de colas fáciles y difíciles produciría exactamente esta forma.

**Paso 6: informa.** Algo como: "El tiempo de resolución mediano fue de 4,5 horas (RIC 2,75–11). La media, 13,5 horas, está inflada por un ticket de 96 horas; no describe un ticket típico. Excluyendo ese caso, la mediana no cambia y la media baja a 6,0".

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Un colega informa de "tiempo de respuesta medio 13,5 horas" para estos tickets. ¿Qué único número adicional le pedirías primero, y por qué?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> La mediana. Aquí es 4,5 horas frente a una media de 13,5, y esa diferencia dice al lector más sobre el conjunto de datos de lo que dice la media por sí sola. Si el caso de 96 horas es real es la segunda pregunta.</p>

</div>
</details>

## Lo mismo en Python

```python
from statistics import mean, median, stdev, quantiles

hours = [1, 2, 2, 3, 3, 4, 5, 6, 8, 12, 20, 96]

q1, _, q3 = quantiles(hours, n=4)
iqr = q3 - q1
print('n', len(hours))
print('mean', round(mean(hours), 2), 'median', median(hours))
print('sd', round(stdev(hours), 2), 'iqr', iqr)
print('fences', round(q1 - 1.5*iqr, 2), round(q3 + 1.5*iqr, 2))
print('flagged', [h for h in hours if h < q1 - 1.5*iqr or h > q3 + 1.5*iqr])
```

pandas da el mismo resumen en una sola llamada y hace trivial la comprobación de valores faltantes:

```python
import pandas as pd

s = pd.Series(hours)
print(s.describe())
print(s.isna().sum())
```

## Una plantilla de informe

La forma de un resumen que sobrevive a una revisión:

- **qué se midió**, con unidades y tamaño de muestra;
- **el centro**, dando primero la mediana cuando los datos están sesgados;
- **la dispersión**, eligiendo el RIC o la desviación típica de acuerdo con el centro;
- **qué se excluyó y por qué**, nunca un borrado silencioso;
- **qué no puede decirte**, en una frase.

## Cuándo usarla

Siempre. La lista es más valiosa con datos que no recogiste tú, que son la mayoría.

## Limitaciones

- **La lista no sustituye al conocimiento del dominio.** Que un ticket de 96 horas sea plausible depende de qué es un ticket.
- **Detecta mejor los problemas de una sola variable.** Las relaciones necesitan un diagrama de dispersión, y la agrupación necesita datos suficientes por grupo para tener sentido.
- **Es un punto de partida, no un análisis completo.** Las preguntas sobre el cambio a lo largo del tiempo, o sobre una afirmación causal concreta, necesitan sus propios diseños.

## Errores frecuentes

- **Borrar valores atípicos antes de inspeccionarlos.** A menudo son los casos más informativos, y el borrado sesga todos los números posteriores.
- **Publicar solo la media**, lo que oculta la forma por completo.
- **Juntar grupos** antes de comprobar si los grupos difieren.
- **Publicar dos decimales** en una medición registrada a la hora más cercana.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Diseña el resumen de tres líneas que enviarías a una persona responsable que nunca ha oído hablar de una mediana, usando los datos de los tickets de soporte, sin usar jerga estadística.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> "La mitad de los tickets se cerraron en 4,5 horas o menos, y la otra mitad tardó más. Un ticket típico está entre unas 3 y 11 horas. Un ticket tardó 96 horas, y es lo que arrastra el promedio hasta 13,5; conviene revisar ese caso antes de dar el promedio a los clientes". Sin jerga, y cada número lleva su significado.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué comparar la media y la mediana es un diagnóstico barato de la forma de los datos?
- ¿Cuándo es la desviación típica una mejor compañera de la media que el RIC?
- ¿Cuál es la diferencia entre un error y un valor atípico?
- Si tienes que publicar un único número para un conjunto de datos sesgado, ¿cuál elegirías, y qué le añadirías?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-reading-data-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. La media es 40 y la mediana 25. ¿Qué sugiere la diferencia?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Un error de cálculo.</button>
      <button class="quiz-q__opt" data-idx="1">Que los datos son simétricos.</button>
      <button class="quiz-q__opt" data-idx="2">Una distribución sesgada a la derecha, con valores grandes que empujan la media hacia arriba.</button>
      <button class="quiz-q__opt" data-idx="3">Que la muestra es demasiado pequeña.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Encuentras un valor por encima de la valla de 1,5 × RIC. ¿Qué haces primero?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Borrarlo y recalcular.</button>
      <button class="quiz-q__opt" data-idx="1">Inspeccionarlo para decidir si es un error, un proceso distinto o un caso extremo genuino.</button>
      <button class="quiz-q__opt" data-idx="2">Sustituirlo por la media.</button>
      <button class="quiz-q__opt" data-idx="3">Publicar solo la media, ignorándolo.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
