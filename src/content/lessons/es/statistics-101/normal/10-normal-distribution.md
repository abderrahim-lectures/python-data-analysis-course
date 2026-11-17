---
title: "La distribución normal"
description: "La curva de campana, la regla 68–95–99,7 y qué significa que un valor está a dos desviaciones típicas."
module: "samples-and-uncertainty"
order: 10
difficulty: "intermediate"
estimatedMinutes: 20
learningObjectives:
  - "Reconocer la curva normal por su forma, su centro y su dispersión"
  - "Aplicar la regla 68–95–99,7 sin tabla"
  - "Estandarizar un valor en una puntuación z y leerla como una posición"
  - "Nombrar las situaciones en que suponer normalidad es un error"
prerequisites: []
tags: ["distribución-normal", "puntuación-z", "curva-de-campana", "probabilidad"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

La **distribución normal** es una familia de curvas simétricas en forma de campana, cada una fijada por dos números: su centro $\mu$ y su dispersión $\sigma$. Su densidad tiene una forma concreta,

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}}\, e^{-\frac{(x-\mu)^2}{2\sigma^2}},
$$

pero rara vez necesitas evaluarla a mano. Lo que importa es la consecuencia de la forma para las distancias.

Como la curva es simétrica y su dispersión se mide con $\sigma$, las distancias a la media tienen probabilidades fijas:

- alrededor del **68 %** de los valores quedan dentro de $1\sigma$ de la media;
- alrededor del **95 %** dentro de $2\sigma$;
- alrededor del **99,7 %** dentro de $3\sigma$.

Esa es la regla 68–95–99,7, y es la razón por la que merece la pena informar la desviación típica.

## Qué aporta

La curva normal es el modelo de referencia que convierte una medición bruta en una afirmación sobre su rareza. Un bebé que pesa 3,1 kg no significa nada por sí solo; ese mismo peso a 1,9 desviaciones típicas por debajo de la media es una situación clínica completamente distinta.

También es la distribución que está detrás del error típico y de la mayoría de las fórmulas de intervalos en las lecciones posteriores, porque los promedios de muchas cosas independientes tienden a una forma normal sea cual sea la forma de los datos originales. Ese es el teorema central del límite, y por eso esta curva aparece incluso cuando los datos no tienen forma de campana ni de lejos.

## A mano: una puntuación z

Las alturas adultas de una población tienen media $\mu = 170$ cm y desviación típica $\sigma = 10$ cm. Una persona mide 185 cm. ¿Cuánto de insólito es eso?

**Paso 1: estandariza.**

$$
z = \frac{x - \mu}{\sigma} = \frac{185 - 170}{10} = 1{,}5
$$

**Paso 2: lee la posición.** La altura está a 1,5 desviaciones típicas por encima de la media. Con la regla 68–95–99,7, el 68 % de las personas mide entre $160$ y $180$ cm, así que el 32 % queda fuera; la mitad de ese 32 % está por encima de 180, unos 16 %. Nuestra persona está más lejos que 180 pero menos que 190 (dos desviaciones típicas), así que aproximadamente el 7 % de las personas son más altas.

**Paso 3: dilo con palabras.** "Unas 7 de cada 100 personas adultas son más altas que esta". Esa es la frase que una tabla o una función de librería te dan con exactitud, y la regla la aproxima sin ninguna.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Una máquina llena tarros con una media de 500 g y una desviación típica de 4 g, con distribución normal. ¿Qué proporción aproximada de tarros pesa más de 508 g?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> $z = (508-500)/4 = 2$, así que el tarro está a dos desviaciones típicas por encima de la media. La regla 68–95–99,7 deja fuera de dos desviaciones típicas un 5 % aproximadamente, la mitad por arriba, así que alrededor del 2,5 %: aproximadamente 1 tarro de cada 40.</p>

</div>
</details>

## Lo mismo en Python

```python
import statistics as st

heights = [158, 162, 165, 167, 170, 171, 174, 176, 179, 188]
mu = st.mean(heights)
sigma = st.pstdev(heights)      # forma poblacional, como el modelo de arriba

z = (185 - mu) / sigma
print(round(mu, 1), round(sigma, 2), round(z, 2))
```

Para proporciones exactas, la función de distribución acumulada normal estándar da el área por debajo de una puntuación z:

```python
from statistics import NormalDist

normal = NormalDist(mu=170, sigma=10)
print(normal.cdf(185))              # ≈ 0,9332, la proporción por debajo de 185
print(1 - normal.cdf(185))          # ≈ 0,0668, la proporción por encima
```

`NormalDist` viene con la biblioteca estándar de Python, así que no necesita instalación.

## Verlo geométricamente

El área bajo la curva es probabilidad, y la regla 68–95–99,7 no es más que una afirmación sobre áreas entre líneas verticales. En la [herramienta de distribución normal de GeoGebra](https://www.geogebra.org/m/yjz6bqtn) puedes fijar la media y la desviación típica y arrastrar el límite para ver cambiar el área sombreada, incluido el momento en que pasas de una a dos desviaciones típicas y el área se desploma de un tercio a una vigésima parte.

## Cuándo usarla

- Los datos son **simétricos y unimodales**, y quieres proporciones aproximadas en las colas.
- Trabajas con **medias de muchas observaciones**, donde se aplica el teorema central del límite aunque los datos brutos estén sesgados.
- Necesitas una **escala estándar** para comparar mediciones con unidades distintas, que es exactamente lo que dan las puntuaciones z.

## Limitaciones

- **La mayoría de los datos reales no son normales.** Ingresos, precios, tiempos de espera, poblaciones y recuentos están sesgados; forzar una curva de campana sobre ellos produce disparates con mucha seguridad.
- **No está acotada.** El modelo permite alturas negativas y tiempos de espera negativos, cosas que no pueden ocurrir.
- **Las colas son más finas que la realidad.** Los datos reales producen sucesos extremos con mucha más frecuencia de la que predice la curva normal.
- **No dice nada del mecanismo.** Una forma de campana es una descripción, no una explicación.

## Errores frecuentes

- **Usar la desviación típica muestral donde corresponde la poblacional** (o al revés al construir puntuaciones z), lo que desplaza ligeramente todas las probabilidades.
- **Suponer normalidad porque los estadísticos de resumen parecen plausibles.** Dibuja los datos; comprueba primero el sesgo y los picos múltiples.
- **Citar puntuaciones z de datos muy sesgados** e interpretarlas como proporciones.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Las notas de un examen tienen media 60 y desviación típica 8. Dos estudiantes sacan 76 y 52. ¿Cuál es más insólito, y cuáles son sus puntuaciones z?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Las dos están a dos desviaciones típicas de la media en direcciones opuestas: $(76-60)/8 = +2$ y $(52-60)/8 = -1$. La de 76 es la más insólita en términos de cola; una nota 16 puntos por encima de la media entra más en la cola que 8 puntos por debajo, y la regla normal no es simétrica en la distancia *bruta*, solo en la distancia estandarizada.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué la regla da los mismos porcentajes sea cual sea la media y la desviación típica?
- Si un conjunto de datos no es normal, ¿puede calcularse igualmente una puntuación z? ¿Qué significa entonces?
- ¿Por qué los promedios de muchos valores tienden a una forma de campana incluso cuando los valores mismos no la tienen?
- ¿Qué buscarías en un histograma antes de fiarte de una conclusión basada en la normalidad?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-normal-es">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué proporción aproximada de una distribución normal queda dentro de una desviación típica de la media?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">50 %</button>
      <button class="quiz-q__opt" data-idx="1">68 %</button>
      <button class="quiz-q__opt" data-idx="2">95 %</button>
      <button class="quiz-q__opt" data-idx="3">99,7 %</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Un valor tiene z = −2,4. ¿Qué significa eso?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que está 2,4 unidades por debajo de la media.</button>
      <button class="quiz-q__opt" data-idx="1">Que es el 2,4 % de la media.</button>
      <button class="quiz-q__opt" data-idx="2">Que está 2,4 desviaciones típicas por debajo de la media.</button>
      <button class="quiz-q__opt" data-idx="3">Que es el percentil 24.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
