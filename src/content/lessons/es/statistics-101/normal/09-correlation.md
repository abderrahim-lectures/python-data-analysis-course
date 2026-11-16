---
title: "Correlación"
description: "La r de Pearson y la rho de Spearman: cómo se mueven juntas dos variables, cómo calcularlo a mano y las cuatro formas en que engaña."
module: "relationships"
order: 9
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Leer la dirección y el ajuste de un diagrama de dispersión antes de calcular nada"
  - "Calcular una correlación de Pearson a mano con la fórmula estandarizada"
  - "Interpretar r como un número entre −1 y 1, tanto en signo como en tamaño"
  - "Calcular una correlación de rangos de Spearman y decir cuándo supera a la de Pearson"
  - "Explicar por qué r² describe la variación explicada y r no"
prerequisites: []
tags: ["correlación", "pearson", "spearman", "diagrama-de-dispersión", "causalidad"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 15
section: "statistics-101"
track: "normal"
---

## Qué significa

Dos variables están **correlacionadas** cuando tienden a moverse juntas. Un coeficiente de correlación comprime esa tendencia en un número entre $-1$ y $+1$.

La **correlación de Pearson** mide lo cerca que quedan los puntos de una *recta*:

$$
r = \frac{1}{n-1}\sum_{i=1}^{n}
\left(\frac{x_i - \bar{x}}{s_x}\right)
\left(\frac{y_i - \bar{y}}{s_y}\right)
$$

Cada valor se convierte en una puntuación estandarizada —a cuántas desviaciones típicas está de su media— y la fórmula es el producto medio de las dos puntuaciones estandarizadas. Cuando $x$ está por encima de su media al mismo tiempo que $y$ está por encima de la suya, ese producto es positivo; cuando no coinciden, es negativo. La media de esos productos es $r$.

La **correlación de Spearman** es la misma fórmula calculada sobre *rangos* en lugar de valores. Eso la hace robusta frente a los valores atípicos y capaz de captar cualquier relación que siga yendo en una dirección, no solo las rectas.

## Qué aporta

Describir una variable es la mitad del trabajo. Casi toda afirmación interesante es relacional: un tratamiento se asocia con mejores resultados, el precio con la demanda, la temperatura con las ventas. Una correlación es la respuesta cuantitativa más barata, y conocer sus límites te protege de la mala inferencia más común en el trabajo con datos: leer una causa en una coincidencia.

También alimenta casi todo lo que viene después: la regresión, la selección de variables y las comprobaciones de fiabilidad que se hacen antes de ajustar cualquier modelo.

## A mano, paso a paso

Cinco estudiantes, horas de estudio $x$ y nota $y$:

$$
x = 1,2,3,4,5 \qquad y = 50,55,65,70,80
$$

**Paso 1: las medias.** $\bar{x} = 3$, $\bar{y} = 64$.

**Paso 2: desviaciones respecto de cada media.**

| $x$ | $y$ | $x - \bar{x}$ | $y - \bar{y}$ |
|---|---|---|---|
| 1 | 50 | −2 | −14 |
| 2 | 55 | −1 | −9 |
| 3 | 65 | 0 | +1 |
| 4 | 70 | +1 | +6 |
| 5 | 80 | +2 | +16 |

**Paso 3: desviaciones típicas.** $\sum (x-\bar{x})^2 = 10$, así que $s_x = \sqrt{10/4} \approx 1{,}581$. $\sum (y-\bar{y})^2 = 196 + 81 + 1 + 36 + 256 = 570$, así que $s_y = \sqrt{570/4} \approx 11{,}94$.

**Paso 4: estandariza y multiplica, fila a fila.** Para la primera fila, $(-2/1{,}581)(-14/11{,}94) \approx 1{,}265 \times 1{,}173 \approx 1{,}484$. Haciendo las cinco y sumando:

$$
\sum \left(\frac{x-\bar{x}}{s_x}\right)\left(\frac{y-\bar{y}}{s_y}\right) \approx 4{,}949
$$

**Paso 5: divide entre $n-1$.**

$$
r = \frac{4{,}949}{4} \approx 0{,}987
$$

Casi 1. Las horas de estudio y la nota suben juntas casi a la perfección en esta muestra.

**Paso 6: eleva al cuadrado.** $r^2 \approx 0{,}975$: el 97,5 % de la variación de las notas va con la tendencia lineal de las horas de estudio. Fíjate en que $r^2$ es el número que hay que citar cuando quieres decir "cuánto de ello está explicado"; $r$ por sí mismo exagera esa cifra.

## Leer el signo y el tamaño

| $r$ | Lectura |
|---|---|
| $+1$ | aumento perfecto en línea recta |
| $+0{,}7$ | tendencia ascendente fuerte, con dispersión visible |
| $+0{,}2$ | tendencia ascendente débil, casi perdida en el ruido |
| $0$ | ninguna tendencia *lineal* (aún puede haber una curva) |
| $-0{,}6$ | tendencia descendente moderada |

El signo dice la dirección, la magnitud dice lo ajustado que es el encaje en línea recta, y nada más. $r = 0$ no es "ninguna relación"; es "ninguna relación en línea recta": una relación perfecta en forma de U tiene $r \approx 0$.

## Cuándo Pearson engaña: usa Spearman

Considera estos cinco puntos: $x = 1,2,3,4,5$ e $y = 1,4,9,16,25$. La relación es perfecta y ascendente, pero curva. La $r$ de Pearson es de unos $0{,}98$: alta pero no 1, porque la curva no es recta. La correlación de rangos de Spearman sobre los mismos datos es exactamente 1: cada rango en $x$ coincide con un rango en $y$.

La regla práctica:

- usa **Pearson** cuando ambas variables son numéricas, más o menos continuas, y la dispersión parece una línea o una elipse;
- usa **Spearman** cuando la relación es monótona pero curva, cuando hay valores atípicos o cuando una variable es ordinal (una valoración de satisfacción de 1 a 5, una posición en una competición).

## Lo mismo en Python

```python
x = [1, 2, 3, 4, 5]
y = [50, 55, 65, 70, 80]

import statistics as st
mx, my = st.mean(x), st.mean(y)
sx, sy = st.stdev(x), st.stdev(y)

zx = [(v - mx) / sx for v in x]
zy = [(v - my) / sy for v in y]
r = sum(a * b for a, b in zip(zx, zy)) / (len(x) - 1)
print(round(r, 3))        # 0.987
print(round(r ** 2, 3))   # 0.975
```

NumPy y pandas hacen lo mismo en una sola llamada, y `corr(method='spearman')` cambia a la versión de rangos:

```python
import numpy as np
print(np.corrcoef(x, y)[0, 1])

import pandas as pd
df = pd.DataFrame({'hours': x, 'score': y})
print(df.corr(method='pearson'))
print(df.corr(method='spearman'))
```

## Verlo geométricamente

En un diagrama de dispersión, la $r$ de Pearson describe lo estrecha que es la nube alrededor de una recta. Gira la nube y $r$ cambia; dóbala en una U y $r$ cae a cero mientras la relación se hace más fuerte. El [explorador de correlación de GeoGebra](https://www.geogebra.org/m/gtxfmqsf) te deja arrastrar puntos y ver cómo reacciona $r$, incluido el momento en que un punto arrastra una recta antes ajustada y la convierte en una débil.

## Cuándo usarla

- **Filtrar relaciones** antes de decidir qué modelar.
- **Validar** que una variable lleva información sobre un objetivo.
- **Informar** de una asociación con honestidad, junto a un diagrama de dispersión para que el lector vea qué resume el número.

## Limitaciones

- **Correlación no es causalidad.** Las ventas de helado correlacionan con los ahogamientos; ambas siguen al tiempo.
- **Solo mide rectas.** Relaciones curvas fuertes pueden mostrar una $r$ cercana a cero.
- **Es sensible a los valores atípicos.** Un solo punto lejano puede subir $r$ de 0,2 a 0,8, o destruir una relación real.
- **Los rangos restringidos la encogen.** Correlacionar solo entre el 10 % de valores más altos puede ocultar una relación que es fuerte en conjunto.
- **Combinar grupos puede inventarla** (la paradoja de Simpson): dos grupos sin tendencia cada uno pueden mostrar una tendencia fuerte al juntarlos.

## Errores frecuentes

- **Leer $r^2$ como un porcentaje y luego citar también $r$ como si lo fuera.** $r = 0{,}5$ significa el 25 % de la variación, no el 50 %.
- **Comparar correlaciones entre poblaciones distintas** sin comprobar que los rangos son comparables.
- **Ignorar el diagrama de dispersión.** El número no puede hablarte de curvatura, grupos ni valores atípicos; la imagen sí.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Explica por qué es falso lo siguiente: "la correlación entre las ventas de helado y las muertes por ahogamiento es 0,9, así que el helado hace que la gente nade mal".

<p class="challenge__answer">💡 <strong>Respuesta:</strong> La correlación mide el movimiento conjunto, no el mecanismo. Ambas variables siguen a una tercera, el calor, que aumenta tanto el consumo como los baños. La lectura correcta de $r = 0{,}9$ es "estas dos se mueven juntas"; atribuir una dirección de causa requiere un experimento o un argumento mucho más fuerte que un coeficiente.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Calculas la r de Pearson sobre 12 puntos y obtienes 0,1, pero el diagrama de dispersión muestra una U limpia. ¿Qué informarías, y qué daría Spearman?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Informaría de que hay una relación no lineal fuerte sin componente lineal; $r \approx 0$ es técnicamente correcto pero engañoso como resumen. Spearman también estaría cerca de 0 aquí, porque los rangos no aumentan de forma monótona (suben y después bajan). El siguiente paso correcto es modelar la curvatura —ajustar $y$ frente a $x$ y $x^2$, o dibujar una curva suavizada— en lugar de citar cualquiera de los dos coeficientes como hallazgo.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué $r$ no cambia si sumas 10 a cada valor de $x$, o multiplicas cada $y$ por 3?
- ¿Puede $r$ ser 0,9 mientras casi todos los puntos están lejos de la recta de mejor ajuste? ¿Cuándo?
- Si dos variables son independientes, ¿su correlación tiene que ser cero? Si su correlación es cero, ¿tienen que ser independientes?
- ¿Qué significa que una correlación sea "estadísticamente significativa" cuando $r = 0{,}05$ y $n$ es 100.000?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-correlation-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. La r de Pearson es 0,8. ¿Qué fracción de la variación de y se asocia con la tendencia lineal de x?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">80 %</button>
      <button class="quiz-q__opt" data-idx="1">0,8 %</button>
      <button class="quiz-q__opt" data-idx="2">64 %</button>
      <button class="quiz-q__opt" data-idx="3">20 %</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ¿Cuándo deberías preferir Spearman a Pearson?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Cuando ambas variables se distribuyen normalmente.</button>
      <button class="quiz-q__opt" data-idx="1">Cuando la relación es monótona pero no recta, o los datos tienen valores atípicos.</button>
      <button class="quiz-q__opt" data-idx="2">Cuando quieres demostrar causalidad.</button>
      <button class="quiz-q__opt" data-idx="3">Cuando la muestra es grande.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">3. Una correlación de 0,95 entre dos variables, ¿qué establece?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que una causa a la otra.</button>
      <button class="quiz-q__opt" data-idx="1">Que ambas se distribuyen normalmente.</button>
      <button class="quiz-q__opt" data-idx="2">Que una recta predice y a la perfección.</button>
      <button class="quiz-q__opt" data-idx="3">Que se mueven juntas a lo largo de una tendencia lineal fuerte.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
