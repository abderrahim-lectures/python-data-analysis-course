---
title: "Varianza y desviación típica"
description: "La distancia cuadrática media a la media, y la raíz cuadrada que la devuelve a las unidades de los datos."
module: "spread-and-shape"
order: 6
difficulty: "beginner"
estimatedMinutes: 22
learningObjectives:
  - "Calcular las desviaciones respecto de la media y comprobar que suman cero"
  - "Calcular una varianza muestral a mano, paso a paso"
  - "Convertir la varianza en desviación típica e interpretarla en las unidades originales"
  - "Explicar por qué el divisor es n − 1 en una muestra"
  - "Decir a cuántas desviaciones típicas de la media se encuentra un valor dado"
prerequisites: []
tags: ["varianza", "desviación-típica", "dispersión", "desviación"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

Una medida de **dispersión** responde: ¿a qué distancia del centro suelen estar los valores? La más sencilla es el **rango**, el mayor menos el menor. Es fácil y casi inútil, porque se construye con solo dos valores y una entrada extrema puede fijarlo.

Las medidas útiles se construyen a partir de la distancia de *cada* valor a la media. Para los valores $x_1,\dots,x_n$ con media $\bar{x}$, la **desviación** de cada valor es

$$
d_i = x_i - \bar{x}.
$$

Unas desviaciones son positivas, otras negativas, y siempre se compensan:

$$
\sum_{i=1}^{n} (x_i - \bar{x}) = 0.
$$

Eso es una propiedad de la media misma, y es la razón por la que no puedes simplemente promediar las desviaciones: la respuesta siempre es cero. Elevar al cuadrado elimina el signo. La **varianza** es la desviación cuadrática media:

$$
s^2 = \frac{1}{n-1}\sum_{i=1}^{n} (x_i - \bar{x})^2 .
$$

La **desviación típica** es su raíz cuadrada:

$$
s = \sqrt{s^2}.
$$

Elevar al cuadrado estropeó las unidades (los minutos pasaron a minutos al cuadrado), así que la raíz cuadrada las restaura. Esa es toda la razón de que existan los dos números: la varianza es la cantidad que se comporta bien en el álgebra, y la desviación típica es la que un humano puede interpretar.

## Qué aporta

Un centro te dice dónde están los datos. La dispersión te dice cuánta confianza puedes depositar en ese centro como descripción, cuánto de insólito es un valor cualquiera y si dos grupos que parecen iguales en promedio de verdad lo son.

También es cómo se expresa la incertidumbre en el resto de la estadística: un intervalo de confianza, una prueba t y una correlación consumen todos una desviación típica. Domina esta cantidad y el resto del curso es, en su mayor parte, contabilidad.

## A mano, paso a paso

Otra vez cinco tiempos de entrega: $8,\;10,\;12,\;15,\;45$ minutos. La media es 18.

**Paso 1: desviaciones respecto de la media.**

$$
8-18 = -10,\quad 10-18 = -8,\quad 12-18 = -6,\quad 15-18 = -3,\quad 45-18 = 27
$$

**Paso 2: comprueba que se compensan.** $-10-8-6-3+27 = 0$. Si tus desviaciones no suman cero, la media que restaste está mal; es la comprobación aritmética más barata de la estadística.

**Paso 3: eleva cada desviación al cuadrado.**

$$
100,\quad 64,\quad 36,\quad 9,\quad 729
$$

**Paso 4: suma los cuadrados.** $100 + 64 + 36 + 9 + 729 = 938$.

**Paso 5: divide entre $n-1 = 4$.**

$$
s^2 = \frac{938}{4} = 234{,}5
$$

**Paso 6: saca la raíz cuadrada.**

$$
s = \sqrt{234{,}5} \approx 15{,}3 \text{ minutos}
$$

Interpretación: una entrega típica está a unos 15 minutos de la media de 18. Ese número es grande al lado de la media, y debería serlo: cuatro de los cinco tiempos están a menos de 10 minutos entre sí y el quinto está a 27 minutos.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Quita la entrega de 45 minutos y repite los pasos 5 y 6 con los cuatro valores restantes, cuya media es 11,25. ¿Qué cambió más, la media o la desviación típica?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Las desviaciones son $-3{,}25, -1{,}25, 0{,}75, 3{,}75$; la suma de sus cuadrados es $10{,}5625 + 1{,}5625 + 0{,}5625 + 14{,}0625 = 26{,}75$; $s^2 = 26{,}75/3 \approx 8{,}92$; $s \approx 2{,}99$ minutos. La media bajó de 18 a 11,25, pero la desviación típica se desplomó de 15,3 a 3,0. Un solo valor era responsable de la mayor parte de la inconsistencia aparente.</p>

</div>
</details>

## Por qué n − 1

Cuando calculas una media a partir de una muestra ya has usado los datos una vez, y las desviaciones se miden respecto de *esa* media y no respecto de la verdadera, que es desconocida. La media muestral se coloca lo más cerca posible de los datos, así que las desviaciones al cuadrado que calculas son sistemáticamente un poco demasiado pequeñas. Dividir entre $n-1$ en lugar de entre $n$ corrige eso.

Dos lecturas honestas:

- con $n = 5$ la diferencia es grande (dividir entre 4, no entre 5, un aumento del 25 %); con $n = 1000$ es despreciable;
- algunas cantidades (describir una población entera, no estimar a partir de una muestra) sí dividen entre $n$, y por eso verás las dos fórmulas.

En este curso usamos $n-1$ siempre que los datos son una muestra, que es casi siempre.

## Lo mismo en Python

```python
times = [8, 10, 12, 15, 45]
n = len(times)
mean = sum(times) / n

squared = [(x - mean) ** 2 for x in times]
variance = sum(squared) / (n - 1)
sd = variance ** 0.5

print(round(variance, 2))   # 234.5
print(round(sd, 2))         # 15.31
```

La biblioteca estándar da lo mismo, con el divisor $n-1$ por defecto:

```python
import statistics as st

print(st.variance(times))       # 234.5
print(st.stdev(times))          # 15.313...
print(st.pstdev(times))         # 13.693...  ← divides by n (population)
```

Fíjate en la última línea: `pstdev` es la forma poblacional, y mezclar las dos es una fuente habitual de respuestas que discrepan de un libro de texto en unos puntos porcentuales.

## ¿A partir de qué distancia es insólito?

Una vez tienes una media y una desviación típica, puedes decir cuánto de insólito es un valor en unidades de la dispersión:

$$
z = \frac{x - \bar{x}}{s}.
$$

Para la entrega de 45 minutos, $z = (45-18)/15{,}3 \approx 1{,}76$: está a 1,76 desviaciones típicas por encima de la media. Como guía aproximada para datos más o menos acampanados, unos dos tercios de los valores caen dentro de una desviación típica y cerca del 95 % dentro de dos. El 45 está dentro de dos, lo cual es un aviso razonable de que esta muestra es pequeña y que "insólito" requiere cuidado.

## Verlo geométricamente

Cada desviación al cuadrado es el área de un cuadrado dibujado sobre esa distancia. La varianza es el área media; la desviación típica es el lado de un cuadrado con esa área media. En el [explorador de desviación típica de GeoGebra](https://www.geogebra.org/m/xwqpnvfy) puedes arrastrar un punto y ver cómo el área media crece mucho más rápido que la distancia misma, y por eso un único valor extremo infla la varianza con tanta fuerza.

## Cuándo usarla

- Comparar la **consistencia** entre grupos con las mismas unidades (dos máquinas, dos clases, dos meses).
- Convertir un valor bruto en uno **estandarizado**, que es como los métodos posteriores (correlación, regresión, pruebas z) ponen variables distintas en una misma escala.
- Informar de la **incertidumbre** alrededor de una media: el error típico que verás más adelante es $s/\sqrt{n}$.

## Limitaciones

- **Sensible a los valores atípicos, más que la media.** Las desviaciones se elevan al cuadrado, así que un valor al doble de distancia contribuye cuatro veces más.
- **Solo tiene sentido para datos numéricos** y solo es comparable cuando las unidades son las mismas. Una desviación típica de 5 significa cosas distintas en minutos y en dólares.
- **Supone un centro razonable.** Para datos muy sesgados, una desviación típica alrededor de la media puede engañar; el rango intercuartílico suele ser el mejor resumen.
- **No es un rango.** "Dentro de una desviación típica" no es una promesa sobre cada valor; es una distancia típica.

## Errores frecuentes

- **Dividir entre $n$ cuando querías $n-1$.** Tu respuesta será un poco baja y discrepará de casi todo el software.
- **Olvidar la raíz cuadrada** e informar una varianza como si fuera una desviación típica.
- **Comparar desviaciones típicas entre unidades distintas.** Convierte antes al coeficiente de variación ($s/\bar{x}$).
- **Redondear por el camino.** Conserva toda la precisión hasta el paso 5; redondear las desviaciones pronto puede cambiar el último dígito de la respuesta.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Suma 10 a cada valor del conjunto de datos. ¿Qué les pasa a la media, a la varianza y a la desviación típica?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> La media sube en 10; cada desviación $x_i - \bar{x}$ queda igual, así que la varianza y la desviación típica son exactamente las mismas. Desplazar los datos no cambia la dispersión. Multiplicar cada valor por 2, en cambio, duplica la media y la desviación típica, y multiplica la varianza por 4.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Dos máquinas llenan botellas. La máquina A entrega 500 ml con una desviación típica de 2 ml; la B entrega 505 ml con una desviación típica de 8 ml. ¿Cuál comprarías si llenar de menos es un problema legal, y cuál si llenar de más desperdicia dinero?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Para llenar de menos, la A: su media es más baja pero su dispersión es pequeña, así que los peores casos están más cerca del objetivo; con la B, un déficit de dos desviaciones típicas ronda los 489 ml. Para el desperdicio, la B desperdicia 5 ml de media, pero la dispersión estrecha de la A permite apuntar con seguridad más cerca del mínimo legal. La comparación es sobre toda la distribución, no solo sobre el promedio.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué las desviaciones siempre suman cero, sean cuales sean los datos?
- ¿Puede una desviación típica ser mayor que la media? ¿Qué implica eso sobre los datos?
- ¿Por qué elevar al cuadrado hace la medida más sensible a los valores extremos que tomar distancias absolutas?
- Si dos conjuntos de datos tienen medias iguales y desviaciones típicas iguales, ¿tienen que parecerse? ¿Qué más podría diferir?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-variance-es">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Por qué elevamos las desviaciones al cuadrado antes de promediarlas?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Para que los números sean más grandes.</button>
      <button class="quiz-q__opt" data-idx="1">Porque si no, las desviaciones positivas y negativas se compensarían hasta cero.</button>
      <button class="quiz-q__opt" data-idx="2">Porque los valores al cuadrado son más fáciles de calcular.</button>
      <button class="quiz-q__opt" data-idx="3">Para eliminar los valores atípicos del conjunto de datos.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Una muestra tiene varianza 49. ¿Cuál es su desviación típica?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">49</button>
      <button class="quiz-q__opt" data-idx="1">2401</button>
      <button class="quiz-q__opt" data-idx="2">7</button>
      <button class="quiz-q__opt" data-idx="3">24,5</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. ¿Por qué se divide entre n − 1 y no entre n en una varianza muestral?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Porque las desviaciones se miden respecto de la media muestral, que a su vez se ajusta a los datos y queda un poco demasiado cerca de ellos.</button>
      <button class="quiz-q__opt" data-idx="1">Porque a una muestra siempre le falta un valor.</button>
      <button class="quiz-q__opt" data-idx="2">Porque hace que la respuesta sea redonda.</button>
      <button class="quiz-q__opt" data-idx="3">Porque la mediana necesita un ajuste.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
