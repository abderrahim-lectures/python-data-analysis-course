---
title: "La mediana"
description: "Ordena primero y toma el centro: la medida que ningún valor extremo puede mover."
module: "describing-data"
order: 5
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Calcular una mediana a mano para un número impar y un número par de valores"
  - "Calcular la misma mediana en Python y explicar el caso de los dos valores centrales"
  - "Comparar media y mediana sobre los mismos datos y decir qué informa su diferencia"
  - "Decidir cuándo la mediana es la medida que hay que publicar"
prerequisites: []
tags: ["mediana", "estadística-descriptiva", "centro", "valores-atípicos"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

La **mediana** es el valor central una vez ordenados los datos. La mitad de los valores están en ella o por debajo, y la mitad en ella o por encima. Solo importa la posición: el tamaño de los valores cercanos al centro es irrelevante, y el de los que están en los extremos también.

Para $n$ valores en orden $x_{(1)} \le x_{(2)} \le \cdots \le x_{(n)}$:

$$
\text{mediana} =
\begin{cases}
x_{\left(\frac{n+1}{2}\right)} & n \text{ impar} \\[4pt]
\dfrac{x_{\left(\frac{n}{2}\right)} + x_{\left(\frac{n}{2}+1\right)}}{2} & n \text{ par}
\end{cases}
$$

Dicho con palabras: con un número impar de casos hay un único centro exacto; con un número par hay dos valores centrales y tomas su media.

## Qué aporta

La media puede arrastrarla un solo valor. A la mediana no la puede arrastrar *ningún* valor por extremo que sea, porque llevar un dato a 1.000.000 no cambia qué entrada ocupa el centro. Responde a otra pregunta: no "¿cómo se reparte el total?" sino "¿cómo es un caso típico?".

Eso convierte a la mediana en el resumen honesto de todo lo que está sesgado: ingresos, precios de vivienda, tiempos de espera en un hospital, tamaños de archivo, tiempos de respuesta. En todos esos casos existe un pequeño número de casos muy grandes que dominaría una media.

## A mano, con un número impar de valores

Otra vez los tiempos de entrega, ordenados:

$$
8,\; 10,\; 12,\; 15,\; 45
$$

Hay $n = 5$ valores, así que el centro está en la posición $(5+1)/2 = 3$:

$$
x_{(3)} = 12
$$

La mediana es 12 minutos. Compárala con la media, 18. La mediana es lo que un cliente llamaría una entrega normal; la media carga con el peso de la de 45 minutos.

## A mano, con un número par de valores

Quita la entrega más lenta:

$$
8,\; 10,\; 12,\; 15
$$

Ahora $n = 4$, y las dos posiciones centrales son $4/2 = 2$ y $3$:

$$
\text{mediana} = \frac{x_{(2)} + x_{(3)}}{2} = \frac{10 + 12}{2} = 11.
$$

Fíjate en lo que ocurrió: con un número par de casos la mediana puede ser un valor que no está en los datos (11 no es ninguno de los cuatro tiempos). Sigue siendo el centro correcto.

## Lo mismo en Python

```python
times = [8, 12, 10, 15, 45]
ordered = sorted(times)
n = len(ordered)

if n % 2 == 1:
    median = ordered[n // 2]
else:
    median = (ordered[n // 2 - 1] + ordered[n // 2]) / 2

print(median)      # 12
```

La biblioteca estándar hace lo mismo, incluida la media del caso par:

```python
from statistics import median

print(median([8, 12, 10, 15, 45]))   # 12
print(median([8, 10, 12, 15]))       # 11.0
```

## Leer la distancia entre las dos

Una costumbre útil: calcula las dos y luego mira la diferencia.

| Datos | Media | Mediana | Qué dice la diferencia |
|---|---|---|---|
| 8, 10, 12, 15, 45 | 18 | 12 | Una cola derecha larga: unos pocos valores grandes |
| 10, 11, 12, 12, 13 | 11,6 | 12 | Aproximadamente simétricos: media y mediana coinciden |
| −5, 10, 11, 12, 12 | 8 | 11 | Una cola izquierda larga: unos pocos valores pequeños |

Cuando la media está bastante por encima de la mediana, unos pocos valores grandes la están tirando hacia arriba. Cuando está bastante por debajo, la tiran unos pocos pequeños. Cuando casi coinciden, los datos son casi simétricos y cualquiera de las dos medidas sirve.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Una empresa informa: "nuestro salario mediano es 55.000, pero nuestro salario medio es 95.000". ¿Cuántos empleados hay como mínimo, y qué dice la diferencia sobre la estructura salarial?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Al menos dos, pero la lectura útil es sobre la forma: la media está 40.000 por encima de la mediana, así que existe un pequeño número de personas con sueldos muy altos mientras el empleado típico gana 55.000. Cuanto mayor es la diferencia, más concentrado está el extremo superior.</p>

</div>
</details>

## Verlo geométricamente

La mediana es el punto que parte el recuento por la mitad, no el punto que equilibra los pesos. Arrastra el punto más a la derecha muy lejos en el [explorador de media y mediana de GeoGebra](https://www.geogebra.org/m/zsbf4jqm) y observa: la media salta, la mediana se queda donde está el corte 50/50.

## Cuándo usarla

- Los datos están **sesgados** o contienen valores atípicos que no puedes justificar eliminar.
- Quieres describir un caso **típico**, no un total.
- La variable es **ordinal**: valoraciones como "malo, regular, bueno" tienen un orden con sentido pero no aritmética con sentido, así que la mediana es válida donde la media no lo es.

## Limitaciones

- **Ignora la mayor parte de los datos.** Dos conjuntos muy distintos pueden compartir mediana.
- **No se suma.** La mediana de un grupo combinado no es una función simple de las dos medianas, y por eso las medias dominan las fórmulas posteriores.
- **Necesita al menos un valor.** Con un número par de casos puede informar un número que ningún caso tiene.
- **Es menos estable en muestras diminutas.** Con tres valores, cambiar una entrada puede desplazarla mucho.

## Errores frecuentes

- **Olvidar ordenar.** La mediana del orden original de la lista no significa nada; ordenar es el paso uno, siempre.
- **Partir mal en el caso par.** Promedia las dos entradas centrales, no la central y la última.
- **Suponer que "mediana" significa "lo más frecuente".** Eso es la moda, una medida distinta.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Los valores son 3, 7, 7, 9, 20, 21. Calcula la media y la mediana, luego añade un valor nuevo, 100, y vuelve a calcular ambas. ¿Cuál se movió más, en términos absolutos y porcentuales?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Antes: suma 67, media 11,17, mediana $(7+9)/2 = 8$. Después de añadir 100: suma 167, media 23,86, mediana todavía 8 (ahora los dos valores centrales de los seis son 7 y 9). La media más que se duplicó; la mediana no se movió nada.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué la mediana necesita los datos ordenados y la media no?
- Si la mitad de la clase saca por encima de la mediana y la mitad por debajo, ¿pueden todos estar por encima de la media?
- Un hospital dice "el tiempo de espera mediano es de 4 semanas". ¿Qué oculta eso que una media revelaría?
- ¿Podrían dos conjuntos de datos tener la misma mediana y formas completamente distintas? Dibújalos.

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-median-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Cómo se halla la mediana de un número par de valores?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Tomando el valor de la posición n/2 sin promediar.</button>
      <button class="quiz-q__opt" data-idx="1">Tomando el mayor de los dos valores centrales.</button>
      <button class="quiz-q__opt" data-idx="2">Promediando los dos valores centrales después de ordenar.</button>
      <button class="quiz-q__opt" data-idx="3">Dividiendo la suma entre n y redondeando al valor más cercano.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Un conjunto de datos tiene media 80 y mediana 45. ¿Qué te dice eso?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que los datos son simétricos.</button>
      <button class="quiz-q__opt" data-idx="1">Que unos pocos valores grandes empujan la media muy por encima del valor típico.</button>
      <button class="quiz-q__opt" data-idx="2">Que la mayoría de los valores están cerca de 80.</button>
      <button class="quiz-q__opt" data-idx="3">Que la mediana está mal calculada, porque debe estar cerca de la media.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
