---
title: "Regresión y correlación bien hechas"
description: "Ajusta una recta, lee su pendiente como una tasa, comprueba los cuatro supuestos y entiende por qué r y la pendiente son dos vistas de lo mismo."
module: "applied-statistics"
order: 17
difficulty: "advanced"
estimatedMinutes: 40
learningObjectives:
  - "Ajustar a mano una recta de mínimos cuadrados sobre un conjunto de datos pequeño"
  - "Leer la pendiente como una tasa con unidades, y la ordenada en el origen como una media condicional"
  - "Calcular r y explicar su relación exacta con la pendiente y las desviaciones típicas"
  - "Comprobar los cuatro supuestos de la regresión en un gráfico de residuos"
  - "Explicar cuándo no debe extrapolarse una recta ajustada"
prerequisites: []
tags: ["regresión", "mínimos-cuadrados", "residuos", "supuestos"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 25
section: "statistics-101"
track: "hard"
---

## Qué significa

Una **recta de regresión** resume cómo cambia una respuesta $y$ con un predictor $x$. La recta de mínimos cuadrados minimiza la suma de las distancias verticales al cuadrado de los puntos a la recta:

$$
\hat{y} = b_0 + b_1 x, \qquad
b_1 = r\,\frac{s_y}{s_x}, \qquad
b_0 = \bar{y} - b_1 \bar{x}.
$$

La pendiente es la correlación reescalada a las unidades de los datos: multiplica $r$ por el cociente de las dos desviaciones típicas y obtienes "cuántas unidades se mueve $y$ por cada unidad de $x$". Por eso $r$ y $b_1$ siempre comparten el signo: son la misma relación expresada en escalas distintas.

## Qué aporta

La correlación dice *que* dos variables se mueven juntas; la regresión dice *cuánto*, en unidades sobre las que puedes actuar. "Correlación 0,7" es difícil de usar; "cada hora extra de estudio se asocia con 6,3 puntos más" es una frase sobre la que se puede construir una decisión.

La regresión también produce los residuos —las partes de $y$ que la recta no logra explicar—, y es en esos residuos donde ocurre toda la comprobación de supuestos.

## A mano, paso a paso

Otra vez cinco estudiantes: horas $x = 1,2,3,4,5$; notas $y = 50,55,65,70,80$.

De la lección de correlación: $\bar{x} = 3$, $\bar{y} = 64$, $s_x \approx 1{,}581$, $s_y \approx 11{,}94$, $r \approx 0{,}987$.

**Paso 1: la pendiente.**

$$
b_1 = 0{,}987 \times \frac{11{,}94}{1{,}581} \approx 0{,}987 \times 7{,}55 \approx 7{,}45
$$

**Paso 2: la ordenada en el origen.**

$$
b_0 = 64 - 7{,}45 \times 3 = 64 - 22{,}35 = 41{,}65
$$

**Paso 3: la recta.** $\hat{y} = 41{,}65 + 7{,}45x$.

**Paso 4: léela.** Cada hora adicional de estudio se asocia con unos 7,5 puntos más. La ordenada en el origen, 41,65, es la nota prevista para cero horas: una media condicional, no la afirmación de que un estudiante que no hace nada saque 41,65 en sentido causal.

**Paso 5: los residuos.** Previsto frente a real:

| $x$ | $y$ | $\hat{y}$ | residuo |
|---|---|---|---|
| 1 | 50 | 49,1 | +0,9 |
| 2 | 55 | 56,6 | −1,6 |
| 3 | 65 | 64,0 | +1,0 |
| 4 | 70 | 71,4 | −1,4 |
| 5 | 80 | 78,9 | +1,1 |

Los residuos suman cero (salvo redondeo), alternan de signo y se mantienen pequeños: un ajuste sano para una recta.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Predice la nota para 10 horas de estudio. ¿Cuál es la predicción, y por qué deberías ser prudente con ella?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> $\hat{y} = 41{,}65 + 74{,}5 = 116{,}15$, por encima de la nota máxima posible. Esto es extrapolación: la recta se ajustó con 1–5 horas y no hay evidencia de que la relación siga siendo recta fuera de ese rango. Una nota no puede superar 100, así que el modelo ya está fuera de su dominio válido.</p>

</div>
</details>

## Los cuatro supuestos

Compruébalos sobre los residuos, no sobre la nube bruta:

1. **Linealidad**: los residuos no muestran curva. Un patrón en forma de U significa que la relación se dobla.
2. **Dispersión constante**: los residuos se abren en abanico (o se estrechan) a medida que $x$ crece, lo que es heterocedasticidad; los errores típicos del ajuste serán entonces incorrectos.
3. **Independencia**: los residuos no están correlacionados con el orden de recogida, el grupo ni el tiempo.
4. **Normalidad aproximada de los residuos**: necesaria para los valores p y los intervalos, menos crítica para la estimación de la pendiente en sí.

```python
import numpy as np

x = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([50, 55, 65, 70, 80], dtype=float)

b1, b0 = np.polyfit(x, y, 1)
print(round(b1, 2), round(b0, 2))         # 7.45 41.65

resid = y - (b0 + b1 * x)
print(np.round(resid, 2))                  # [ 0.9 -1.6  1.0 -1.4  1.1]
```

Con pandas y scipy obtienes la misma pendiente más el error típico que publicarías:

```python
from scipy import stats
res = stats.linregress(x, y)
print(res.slope, res.intercept, res.rvalue, res.pvalue, res.stderr)
```

## Verlo geométricamente

La recta de mínimos cuadrados es la que minimiza el área total de los cuadrados dibujados sobre cada residuo. Arrastra un punto en el [explorador de regresión de GeoGebra](https://www.geogebra.org/m/dcpcyc3t) y observa cómo gira la recta, y cómo un único punto lejano en el extremo del rango la hace palanca con mucha más fuerza que un punto cercano al centro.

## Cuándo usarla

- Cuantificar una relación en las unidades propias de los datos, con una pendiente que puedas citar.
- Ajustar por una segunda variable, que es lo que hace la regresión múltiple y lo que te salva de la paradoja de Simpson.
- Producir predicciones dentro del rango observado, con la incertidumbre adjunta.

## Limitaciones

- **Una recta no puede representar una curva.** Si los residuos muestran curvatura, el modelo está mal por muy alta que sea $r$.
- **Correlación sigue sin ser causalidad.** Una pendiente de regresión hereda todos los confusores que tenía la correlación.
- **Los puntos influyentes pueden fijar la pendiente.** Un punto en un $x$ extremo puede mover la recta de forma espectacular; compruébalo reajustando sin él.
- **La extrapolación es peligrosa** fuera del rango ajustado, como muestra el ejemplo de las 10 horas.
- **El rango restringido atenúa la pendiente.** Ajusta solo entre los de mejor rendimiento y la pendiente se aplana.

## Errores frecuentes

- **Informar $r$ cuando ajustaste una pendiente** (o al revés) sin decir cuál.
- **Leer la ordenada en el origen como una línea base del mundo real** cuando $x = 0$ queda fuera de los datos.
- **Ignorar el gráfico de residuos** porque $r$ era alta.
- **Llamar causal a la pendiente** cuando el diseño era observacional.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Dos variables tienen $r = 0{,}6$, $s_x = 2$ y $s_y = 10$. ¿Cuál es la pendiente de $y$ sobre $x$? ¿Y la de $x$ sobre $y$? ¿Por qué no son recíprocas?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> $b_{y \mid x} = 0{,}6 \times 10/2 = 3$; $b_{x \mid y} = 0{,}6 \times 2/10 = 0{,}12$. Su producto es $r^2 = 0{,}36$, no 1. Los mínimos cuadrados minimizan distancias verticales, así que intercambiar qué variable va en el eje y ajusta una recta distinta; solo cuando $r = \pm1$ coinciden las dos rectas.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué la recta de mínimos cuadrados pasa por el punto $(\bar{x}, \bar{y})$?
- Si $r = 0$, ¿cuál es la pendiente de mínimos cuadrados, y qué predice la recta para todo $x$?
- ¿Por qué los residuos siempre suman cero en un modelo con ordenada en el origen?
- ¿Qué implica un gráfico de residuos en forma de abanico para el intervalo de confianza de la pendiente?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-regression-es">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Una regresión de la nota sobre las horas da una pendiente de 7,45. ¿Qué significa?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que un estudiante con cero horas saca 7,45.</button>
      <button class="quiz-q__opt" data-idx="1">Que cada hora extra se asocia con unos 7,45 puntos más.</button>
      <button class="quiz-q__opt" data-idx="2">Que la correlación es 7,45.</button>
      <button class="quiz-q__opt" data-idx="3">Que está explicado el 74,5 % de la variación.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. El gráfico de residuos muestra una U clara. ¿Cuál es el problema?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que la muestra es demasiado pequeña.</button>
      <button class="quiz-q__opt" data-idx="1">Que la pendiente es negativa.</button>
      <button class="quiz-q__opt" data-idx="2">Que la relación es curva, así que una recta es el modelo equivocado.</button>
      <button class="quiz-q__opt" data-idx="3">Que la ordenada en el origen no es cero.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">3. ¿Por qué es arriesgado extrapolar una recta ajustada fuera del rango de los datos?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Porque la aritmética se vuelve más difícil.</button>
      <button class="quiz-q__opt" data-idx="1">Porque la correlación cae a cero.</button>
      <button class="quiz-q__opt" data-idx="2">Porque la ordenada en el origen cambia.</button>
      <button class="quiz-q__opt" data-idx="3">Porque nada en los datos muestra que el patrón lineal continúe ahí fuera.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
