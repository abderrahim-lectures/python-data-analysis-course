---
title: "Contraste de hipótesis"
description: "La hipótesis nula, el valor p y las cuatro decisiones que se derivan: qué establece una prueba y qué no establece nunca."
module: "samples-and-uncertainty"
order: 14
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Enunciar una hipótesis nula y una alternativa para una comparación concreta"
  - "Calcular a mano un estadístico t a partir de dos medias de grupo y sus errores"
  - "Interpretar correctamente un valor p, incluidas las tres lecturas erróneas habituales"
  - "Explicar la diferencia entre significación estadística y significación práctica"
prerequisites: []
tags: ["contraste-de-hipótesis", "valor-p", "prueba-t", "significación"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

Un **contraste de hipótesis** pregunta cuán sorprendentes serían los datos si no hubiera ningún efecto. Se enuncian dos hipótesis:

- $H_0$, la **nula**: no hay diferencia, el efecto es cero;
- $H_1$, la **alternativa**: hay una diferencia, en una dirección que declaras de antemano.

Después calculas un estadístico que mide lo lejos que los datos observados quedan de lo que predice $H_0$, lo conviertes en un **valor p** —la probabilidad de unos datos al menos tan extremos *si $H_0$ fuera cierta*— y lo comparas con un umbral que fijaste antes, convencionalmente 0,05.

Para comparar dos medias, el estadístico es un cociente:

$$
t = \frac{\bar{x}_1 - \bar{x}_2}{\text{ET de la diferencia}} .
$$

El numerador es el efecto que observaste. El denominador es cuánto oscilaría esa diferencia bajo $H_0$. Un cociente grande significa que el efecto es grande en relación con el ruido.

## Qué aporta

Da una respuesta disciplinada a "¿podría ser esto pura casualidad?", la pregunta que plantea toda comparación. Obliga a decidir la dirección y el umbral antes de ver los datos, y eso es lo que protege contra el talento humano para encontrar una historia en el ruido.

También es donde vive buena parte del error estadístico publicado, así que conocerlo es tan defensivo como constructivo.

## A mano, paso a paso

Dos grupos de entregas, uno con un sistema de rutas nuevo:

- Ruta actual: $n_1 = 30$, media 18,0 min, desviación típica 6,0.
- Ruta nueva: $n_2 = 30$, media 15,0 min, desviación típica 5,0.

**Paso 1: las hipótesis.** $H_0$: las medias son iguales. $H_1$: la ruta nueva es más rápida.

**Paso 2: los errores típicos.**

$$
\text{ET}_1 = \frac{6{,}0}{\sqrt{30}} \approx 1{,}10, \qquad \text{ET}_2 = \frac{5{,}0}{\sqrt{30}} \approx 0{,}91
$$

**Paso 3: el error típico de la diferencia.** Para grupos independientes las varianzas se suman:

$$
\text{ET}_{\text{diff}} = \sqrt{1{,}10^2 + 0{,}91^2} \approx \sqrt{1{,}21 + 0{,}83} \approx 1{,}43
$$

**Paso 4: el estadístico.**

$$
t = \frac{18{,}0 - 15{,}0}{1{,}43} \approx 2{,}10
$$

**Paso 5: el valor p.** Con unos 58 grados de libertad, un $t$ de 2,10 se supera en una cola con una probabilidad de aproximadamente 0,020. Como $H_1$ dice "más rápida", el valor p de una cola es de unos 0,02; de dos colas es de unos 0,04. En cualquier caso está por debajo de 0,05.

**Paso 6: la decisión, enunciada con honestidad.** "La ruta nueva se asocia con un tiempo medio de entrega 3 minutos más corto, $t \approx 2{,}10$, $p \approx 0{,}04$. El intervalo de confianza para la diferencia va aproximadamente de 0,1 a 5,9 minutos". Fíjate en cuánto más dice el intervalo que el veredicto: el efecto podría ser trivial o sustancial.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

La misma diferencia de 3 minutos se encuentra con $n = 300$ por grupo. ¿Qué le pasa al valor p, y se vuelve más importante el hallazgo?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Los errores típicos se reducen en un factor de unas 3,2, así que $t$ sube a aproximadamente 6,7 y el valor p se vuelve diminuto. El <em>efecto</em> no cambia en nada: sigue siendo 3 minutos. El hallazgo es más seguro, no más grande. Esta es la diferencia entre significación estadística (evidencia de que existe un efecto) y significación práctica (si merece la pena actuar sobre él).</p>

</div>
</details>

## Lo que un valor p no es

- **No es la probabilidad de que $H_0$ sea cierta.** Se calcula *suponiendo* que $H_0$ es cierta.
- **No es la probabilidad de que te equivoques.** Es una afirmación sobre los datos, no sobre tu conclusión.
- **No es una medida del tamaño del efecto.** Un efecto diminuto con una muestra enorme produce un valor p diminuto.
- **No es una licencia para pescar.** Probar muchas hipótesis e informar el valor p más pequeño garantiza falsos positivos; con 20 pruebas a 0,05 esperas un resultado "significativo" espurio.

## Lo mismo en Python

```python
from scipy import stats

current = [17, 18, 19, 18, 16, 20]        # illustrative samples
new     = [14, 15, 16, 15, 13, 17]

res = stats.ttest_ind(new, current, alternative='less')
print(round(res.statistic, 2), round(res.pvalue, 4))
```

Publica siempre el efecto y su intervalo junto a la prueba:

```python
import statistics as st

diff = st.mean(current) - st.mean(new)
se = (st.stdev(current)**2 / len(current) + st.stdev(new)**2 / len(new)) ** 0.5
print(round(diff, 2), round(diff - 2*se, 2), round(diff + 2*se, 2))
```

## Verlo geométricamente

El estadístico t es la distancia entre dos distribuciones muestrales medida en su propia dispersión. En el [explorador de pruebas t de GeoGebra](https://www.geogebra.org/m/qzxjhqde) puedes separar las medias de los grupos o agrandar las muestras y ver cómo se reduce el solapamiento: la misma imagen que el valor p cayendo.

## Cuándo usarlo

- Una comparación preespecificada entre dos grupos o contra una referencia.
- Comprobar si una diferencia observada es mayor de lo que produciría el ruido del muestreo.
- Como una de las entradas de una decisión que también pesa el coste, el tamaño del efecto y el contexto.

## Limitaciones

- **Responde a una pregunta estrecha** —"¿es el efecto cero?"— y no dice nada sobre el tamaño ni la importancia.
- **Los supuestos importan.** Independencia y datos más o menos normales o muestras grandes; violarlos invalida el valor p.
- **Las comparaciones múltiples inflan los falsos positivos** salvo que se corrijan.
- **Premia con significación a las muestras grandes** por efectos que a nadie le importan.
- **No puede rescatar un diseño sesgado.** Una prueba sobre una muestra sesgada da una respuesta precisa a la pregunta equivocada.

## Errores frecuentes

- **Elegir la hipótesis después de ver los datos**, lo que convierte en silencio un hallazgo exploratorio en una confirmación espuria.
- **Publicar p < 0,05 como "demostrado"**; es evidencia contra un modelo nulo, no prueba de un mecanismo.
- **Ocultar el tamaño del efecto.** Un valor p sin una diferencia de medias y un intervalo es ininterpretable.
- **Confundir pruebas de una y de dos colas**, lo que cambia el umbral sin cambiar los datos.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Un estudio informa "p = 0,049, significativo" y otro "p = 0,051, no significativo" para el mismo tamaño de efecto y el mismo tamaño de muestra. ¿Es real un hallazgo y el otro no?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> No. Los dos valores p son esencialmente el mismo número, y la línea de 0,05 es una convención, no un hecho sobre el mundo. Tratarlos como conclusiones opuestas es el error de "la diferencia entre significativo y no significativo no es en sí misma significativa". Informa de ambos con sus intervalos y deja que el lector vea cuán parecida es la evidencia.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué hay que enunciar la hipótesis antes de mirar los datos?
- Si una prueba no es significativa, ¿has demostrado que no hay efecto?
- ¿Qué añade un intervalo de confianza del 95 % que un valor p no añade?
- ¿Por qué probar veinte hipótesis garantiza aproximadamente un falso positivo al nivel de 0,05?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-hypothesis-es">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué significa un valor p de 0,03?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que hay un 3 % de probabilidad de que la hipótesis nula sea cierta.</button>
      <button class="quiz-q__opt" data-idx="1">Que si la hipótesis nula fuera cierta, unos datos al menos tan extremos aparecerían alrededor del 3 % de las veces.</button>
      <button class="quiz-q__opt" data-idx="2">Que el efecto es un 3 % grande.</button>
      <button class="quiz-q__opt" data-idx="3">Que hay un 97 % de probabilidad de que el resultado se replique.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Una diferencia es estadísticamente significativa con una muestra enorme. ¿Qué más tienes que comprobar?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Nada; la significación lo resuelve.</button>
      <button class="quiz-q__opt" data-idx="1">Si el valor p está por debajo de 0,01 en lugar de 0,05.</button>
      <button class="quiz-q__opt" data-idx="2">El tamaño del efecto y si importa en la práctica.</button>
      <button class="quiz-q__opt" data-idx="3">Si es mayor la media o la mediana.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
