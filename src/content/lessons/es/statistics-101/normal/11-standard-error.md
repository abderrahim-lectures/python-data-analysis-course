---
title: "El error típico"
description: "Cuánto oscilaría una media muestral si repitieras el estudio: la desviación típica dividida por la raíz cuadrada de n."
module: "samples-and-uncertainty"
order: 11
difficulty: "intermediate"
estimatedMinutes: 20
learningObjectives:
  - "Distinguir la desviación típica de los datos del error típico de la media"
  - "Calcular a mano un error típico a partir de una muestra"
  - "Explicar por qué cuadruplicar n solo reduce el error a la mitad"
  - "Ver la distribución muestral de la media en un experimento que puedes ejecutar tú mismo"
prerequisites: []
tags: ["error-típico", "distribución-muestral", "incertidumbre", "límite-central"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

La **desviación típica** describe cuánto se dispersan los *datos*. El **error típico** describe cuánto se dispersaría *la media misma* si repitieras el estudio muchas veces.

$$
\text{ET} = \frac{s}{\sqrt{n}}
$$

donde $s$ es la desviación típica muestral y $n$ es el tamaño de la muestra.

Responden a preguntas distintas. Si una clase de 30 estudiantes tiene una desviación típica de 12 puntos en un examen, los estudiantes varían unos 12 puntos. Si repitieras la clase con 30 estudiantes nuevos, la *media* de la clase variaría solo unos $12/\sqrt{30} \approx 2{,}2$ puntos. El primer número es sobre personas; el segundo es sobre tu estimación.

## Qué aporta

Cualquier media que calcules es una extracción de una distribución de medias posibles. El error típico es la anchura de esa distribución, así que te dice cuánta confianza depositar en el número que estás a punto de publicar.

También es el ingrediente de casi todos los intervalos de la estadística aplicada: un intervalo de confianza del 95 % para una media es aproximadamente $\bar{x} \pm 2\,\text{ET}$, y la prueba t es el cociente entre una diferencia y un error típico. Entender esta única cantidad desmitifica la mayoría de las fórmulas que encontrarás después.

## A mano, paso a paso

Una muestra de $n = 25$ tiempos de entrega tiene una media de 18 minutos y una desviación típica muestral de 15,3 minutos.

**Paso 1: la raíz cuadrada de n.**

$$
\sqrt{25} = 5
$$

**Paso 2: divide.**

$$
\text{ET} = \frac{15{,}3}{5} = 3{,}06 \text{ minutos}
$$

**Paso 3: léelo.** Las entregas individuales varían unos 15 minutos, pero la *media* de 25 de ellas solo es incierta en unos 3 minutos. Si se repitiera el estudio con un nuevo conjunto de 25 entregas, la nueva media caería típicamente a unos 3 minutos de 18.

## Por qué la raíz cuadrada

La raíz cuadrada es la parte más importante de la fórmula, porque fija a qué velocidad se compra precisión con más datos. Para reducir el error a la mitad tienes que **cuadruplicar** la muestra:

| $n$ | ET para $s = 15{,}3$ |
|---|---|
| 25 | 3,06 |
| 100 | 1,53 |
| 400 | 0,77 |
| 2500 | 0,31 |

Diez veces más datos dan unas tres veces más precisión. Por eso las encuestas se detienen en torno a los mil encuestados: más allá la curva es plana, y el error restante está dominado por el sesgo y no por el muestreo.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Una encuesta a 400 personas estima un apoyo del 52 % con un error típico de 2,5 puntos porcentuales. Un rival encuesta a 1600 personas. ¿Cuál es su error típico, y cambia mucho la conclusión probable?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Cuadruplicar $n$ reduce el error a la mitad: unos 1,25 puntos. La estimación es mucho más precisa, pero si ambas encuestas encontraron un 52 %, la conclusión es la misma; la precisión extra no mueve el centro, solo estrecha el intervalo a su alrededor.</p>

</div>
</details>

## Lo mismo en Python

```python
import statistics as st

times = [8, 10, 12, 15, 45]
n = len(times)
s = st.stdev(times)
se = s / (n ** 0.5)
print(round(s, 2), round(se, 2))    # 15.31 6.85
```

Y el experimento que hace concreto el concepto: extrae muchas muestras de la misma población y mide cuánto varían las medias muestrales. Esa dispersión debería coincidir con el error típico.

```python
import random, statistics as st

population = [random.gauss(50, 10) for _ in range(10_000)]
means = [st.mean(random.sample(population, 25)) for _ in range(2000)]

print(round(st.pstdev(means), 2))                                  # ≈ 2.0
print(round(st.pstdev(population) / 25 ** 0.5, 2))                 # ≈ 2.0
```

Que los dos números coincidan es toda la lección, y merece la pena ejecutarlo una vez con tus propios ojos.

## Verlo geométricamente

La distribución muestral es una curva de campana dibujada alrededor de tu estimación, y el error típico es su semianchura. Estrecha la curva aumentando $n$ en la [demostración de distribución muestral de GeoGebra](https://www.geogebra.org/m/tqjfjzpt) y observa cómo se aprieta a razón de la raíz cuadrada del tamaño muestral.

## Cuándo usarlo

- Informar de **cuán precisa** es una estimación, como un número o un intervalo de confianza.
- Comparar una diferencia con su **nivel de ruido**, que es lo que hacen las pruebas de significación posteriores.
- Planificar un estudio: despeja $n$ de $\text{ET} = s/\sqrt{n}$ para obtener el $n$ que da un error aceptable.

## Limitaciones

- **Solo mide el error de muestreo.** Si la muestra está sesgada, un error típico pequeño solo hace que la respuesta equivocada sea más precisa.
- **Supone observaciones independientes.** Las mediciones repetidas de la misma persona no son independientes, y la fórmula simple subestima el error.
- **Las muestras pequeñas necesitan la distribución t**, no el multiplicador normal de 2,0.
- **No dice nada sobre los datos mismos.** Un error típico de 1 no significa que los valores individuales estén cerca de la media.

## Errores frecuentes

- **Confundirlo con la desviación típica.** La confusión más común de toda la estadística: "las barras de error son diminutas" a menudo describe el error típico de una media, no la dispersión de los casos.
- **Dividir entre n en lugar de entre √n.** El error cae mucho más despacio de lo que la gente espera.
- **Presentar el error típico como un rango ± alrededor de cada valor.** Es un rango para la media, no para los datos.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Dos estudios estiman la misma media. El estudio A tiene $n = 100$ y $s = 20$; el estudio B tiene $n = 100$ y $s = 5$. ¿Qué estimación es más precisa, y por cuánto?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> A: ET $= 20/10 = 2$. B: ET $= 5/10 = 0{,}5$. B es cuatro veces más precisa aunque ambos usaron 100 observaciones: la precisión depende de la variabilidad propia de los datos además del tamaño de la muestra. Por eso controlar el ruido de medición supera a simplemente recoger más datos.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué el error típico se encoge mientras la desviación típica se mantiene más o menos igual a medida que $n$ crece?
- Si el error típico es pequeño, ¿es exacta la media? ¿Qué más tiene que ser cierto?
- ¿Por qué la raíz cuadrada va en el denominador y no el recuento mismo?
- ¿Qué significaría un error típico de cero, y qué lo haría sospechoso?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-standard-error-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Qué mide el error típico de la media?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Cuánto se dispersan los valores individuales.</button>
      <button class="quiz-q__opt" data-idx="1">Cuán grande es la muestra.</button>
      <button class="quiz-q__opt" data-idx="2">Cuánto variaría la media muestral entre estudios repetidos.</button>
      <button class="quiz-q__opt" data-idx="3">La distancia media a la mediana.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Una muestra de 36 tiene una desviación típica de 12. ¿Cuál es el error típico?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0,33</button>
      <button class="quiz-q__opt" data-idx="1">2,0</button>
      <button class="quiz-q__opt" data-idx="2">6,0</button>
      <button class="quiz-q__opt" data-idx="3">12,0</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
