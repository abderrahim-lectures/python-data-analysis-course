---
title: "La incertidumbre en el mundo real"
description: "Intervalos por remuestreo, los supuestos detrás de cada prueba y cómo redactar un análisis en el que un revisor pueda confiar."
module: "applied-statistics"
order: 19
difficulty: "advanced"
estimatedMinutes: 35
learningObjectives:
  - "Construir un intervalo de confianza por remuestreo cuando fallan los supuestos de la fórmula"
  - "Explicar qué supone el bootstrap y qué no puede arreglar"
  - "Distinguir el error de muestreo del sesgo, con un ejemplo de cada uno"
  - "Redactar un resumen de análisis que declare sus supuestos y sus límites"
prerequisites: []
tags: ["bootstrap", "remuestreo", "sesgo", "informes", "robustez"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 25
section: "statistics-101"
track: "hard"
---

## Qué significa

Todos los intervalos de este curso hasta ahora venían de una fórmula que supone algo: normalidad, independencia, una forma conocida. Cuando esos supuestos fallan, la aritmética sigue produciendo un número, y el número deja de ser fiable.

El **bootstrap** evita la fórmula. Para estimar cuánto oscilaría un estadístico, remuestrea tus propios datos con reemplazo muchas veces, recalcula el estadístico en cada remuestra y mira la dispersión de lo que obtienes:

$$
\text{remuestra} \to \hat{\theta}^* \quad\text{muchas veces} \to \text{dispersión de } \hat{\theta}^* .
$$

Un intervalo bootstrap del 95 % es el 95 % central de esos valores recalculados. No usa ningún supuesto de distribución más allá de "la muestra se parece a la población", que es el mismo supuesto que ya hace toda estimación basada en muestras.

## Qué aporta

Extiende los intervalos a estadísticos que no tienen fórmula simple: una mediana, una correlación, un cociente de dos medias, la diferencia entre dos percentiles 90. En lugar de buscar una fórmula en un libro de texto, remuestreas.

También hace concreto el significado de la incertidumbre. Puedes *ver* la variación de la estimación en lugar de fiarte de una derivación.

## A mano, conceptualmente

La mediana de $1,2,2,3,3,4,5,6,8,12,20,96$ es 4,5. ¿Cuán incierta es?

No puedes calcularlo con una fórmula sin suponer una forma. Hazle bootstrap:

1. extrae 12 valores de los datos, con reemplazo;
2. calcula la mediana de esa remuestra;
3. repite unos miles de veces;
4. toma los percentiles 2,5 y 97,5 de las medianas.

"Con reemplazo" es importante: sin él cada remuestra sería los datos originales y todas las medianas idénticas.

```python
import random, statistics as st

hours = [1, 2, 2, 3, 3, 4, 5, 6, 8, 12, 20, 96]
medians = []

for _ in range(5000):
    resample = random.choices(hours, k=len(hours))   # with replacement
    medians.append(st.median(resample))

medians.sort()
lo, hi = medians[125], medians[-126]                # colas del 2,5% y 97,5%
print(round(st.median(hours), 1), round(lo, 1), round(hi, 1))
```

El intervalo alrededor de 4,5 es ancho: con 12 valores y un caso extremo, la mediana no queda fijada ni de lejos con la precisión que afirmaría una fórmula que supusiera normalidad.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Calcula por bootstrap la media de los mismos datos y compara su intervalo con el de la mediana. ¿Cuál es más ancho, y por qué?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> El intervalo de la media es mucho más ancho, porque el remuestreo a veces extrae el 96 dos o tres veces y la media salta en consecuencia. La mediana apenas lo nota. Es la misma sensibilidad a los valores atípicos que tiene la desviación típica, ahora visible como incertidumbre.</p>

</div>
</details>

## Lo que el bootstrap no puede hacer

- **No puede arreglar el sesgo.** Si la muestra no es representativa, remuestrearla reproduce la misma respuesta equivocada con un intervalo estrecho a su alrededor.
- **Supone que la muestra es una extracción justa** de la población que te importa. Ese supuesto es el que hace todo el trabajo.
- **Le cuesta con muestras muy pequeñas**, donde el remuestreo tiene demasiado poca variedad con la que trabajar.
- **Supone independencia.** Los datos agrupados necesitan un bootstrap por bloques, y las series temporales necesitan cuidado con el orden.

La distinción que conviene tener clara:

| | Error de muestreo | Sesgo |
|---|---|---|
| Qué es | Oscilación aleatoria entre muestras | Desplazamiento sistemático respecto de la verdad |
| Se corrige con | Más datos | Un diseño mejor |
| Se ve en | Intervalos, errores típicos | Normalmente en nada: los intervalos siguen estrechos |

Un intervalo estrecho alrededor de una estimación sesgada es la salida más peligrosa de la estadística, porque parece certeza.

## Lo mismo en Python

```python
import numpy as np

rng = np.random.default_rng(42)
hours = np.array([1, 2, 2, 3, 3, 4, 5, 6, 8, 12, 20, 96])

def bootstrap(stat, data, n=5000):
    idx = rng.integers(0, len(data), size=(n, len(data)))
    return np.array([stat(data[i]) for i in idx])

for name, fn in [('mean', np.mean), ('median', np.median)]:
    vals = bootstrap(fn, hours)
    print(name, np.round(np.percentile(vals, [2.5, 97.5]), 2))
```

La misma función sirve para cualquier estadístico, y esa es la razón práctica para tenerla a mano.

## Redactarlo

Un resumen en el que un revisor puede confiar responde a esto en orden:

1. **Cuál era la pregunta**, enunciada antes de mirar los datos.
2. **Qué se midió**, con el tamaño de la muestra y cómo se extrajo.
3. **Qué se encontró**, como un efecto con un intervalo, no solo un valor p.
4. **Qué se supuso**, incluidas todas las exclusiones y ajustes.
5. **Qué podría estar mal**, nombrando el sesgo más plausible en lugar de decir "se necesita más investigación".
6. **Qué se deriva para una decisión**, expresado en las unidades de la decisión.

## Cuándo usarlo

- Cualquier estadístico sin una fórmula limpia.
- Cualquier conjunto de datos donde el supuesto normal sea dudoso.
- Como comprobación de robustez junto a un intervalo basado en fórmula: si los dos coinciden, la conclusión es más firme; si discrepan, el supuesto era determinante.

## Limitaciones

- **Los intervalos bootstrap no son inmunes a las muestras pequeñas ni al sesgo**, como se ha dicho.
- **Pueden subestimar la incertidumbre cuando los datos son dependientes**, salvo que el esquema de remuestreo respete la dependencia.
- **Son computacionales**, lo que hoy es barato pero añade piezas móviles a un informe.
- **No sustituyen a pensar en el diseño.** Ningún esquema de remuestreo arregla una muestra sesgada.

## Errores frecuentes

- **Remuestrear sin reemplazo**, lo que produce variación cero y un intervalo que es un punto.
- **Usar el bootstrap para tapar una muestra sesgada.**
- **Publicar la estimación puntual y descartar el intervalo**, lo que tira toda la salida.
- **Citar un valor p sin tamaño del efecto**, en cualquier redacción.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Una encuesta a visitantes de un sitio web informa "satisfacción media 4,6 sobre 5, IC del 95 % [4,55; 4,65]". ¿Por qué podría engañar el intervalo a pesar de ser estrecho?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> La muestra son visitantes, es decir, personas que se quedaron. Falta todo el que se fue sin responder, y su satisfacción es verosímilmente mucho más baja. Eso es sesgo de selección: el intervalo describe correctamente la incertidumbre de la media entre los que respondieron, y no dice nada sobre la población de todos los visitantes.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué el remuestreo con reemplazo imita la extracción de una muestra nueva?
- ¿Qué es peor publicar: un intervalo ancho o un intervalo estrecho alrededor de una estimación sesgada?
- ¿Qué supone un intervalo bootstrap que no supone un intervalo basado en fórmula, y viceversa?
- Si un intervalo de fórmula y uno bootstrap discrepan con los mismos datos, ¿en cuál confiarías, y qué investigarías?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-uncertainty-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Por qué el bootstrap debe remuestrear con reemplazo?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Para que el cálculo sea más rápido.</button>
      <button class="quiz-q__opt" data-idx="1">Porque la estadística lo exige.</button>
      <button class="quiz-q__opt" data-idx="2">Sin reemplazo cada remuestra es los datos originales, así que no hay variación que medir.</button>
      <button class="quiz-q__opt" data-idx="3">Para eliminar los valores atípicos.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Un intervalo de confianza estrecho alrededor de una estimación sesgada, ¿qué te dice?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que la estimación es exacta.</button>
      <button class="quiz-q__opt" data-idx="1">Que la estimación es precisa, y que el sesgo queda fuera de lo que mide el intervalo.</button>
      <button class="quiz-q__opt" data-idx="2">Que la muestra es lo bastante grande para eliminar todo el error.</button>
      <button class="quiz-q__opt" data-idx="3">Nada en absoluto.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
