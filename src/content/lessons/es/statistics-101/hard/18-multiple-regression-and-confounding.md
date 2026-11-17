---
title: "Ajustar por una segunda variable"
description: "La regresión múltiple como cura de la paradoja de Simpson: qué significa un coeficiente ajustado, y cuándo ajustar empeora las cosas."
module: "applied-statistics"
order: 18
difficulty: "advanced"
estimatedMinutes: 35
learningObjectives:
  - "Leer un coeficiente de regresión múltiple como un efecto manteniendo las demás variables fijas"
  - "Mostrar cómo una comparación sin ajustar se invierte al incluir una variable de agrupación"
  - "Distinguir un confusor de un mediador y de un colisionador"
  - "Explicar por qué ajustar por la variable equivocada crea sesgo en lugar de eliminarlo"
prerequisites: []
tags: ["regresión-múltiple", "confusión", "ajuste", "inferencia-causal"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "statistics-101"
track: "hard"
---

## Qué significa

La **regresión múltiple** ajusta un modelo con más de un predictor:

$$
\hat{y} = b_0 + b_1 x_1 + b_2 x_2 + \cdots
$$

Cada coeficiente se lee con una cláusula adjunta: *manteniendo fijos los demás predictores*, un aumento de una unidad en $x_1$ se asocia con $b_1$ unidades de cambio en $y$. Esa cláusula es todo el asunto. Incluir $x_2$ quita de $b_1$ la parte de la relación que podría atribuirse igualmente a $x_2$.

Esta es la forma numérica del análisis por grupos de la lección de la paradoja de Simpson. Juntar sin ajustar produce el número confundido; ajustar produce el número dentro del grupo.

## Qué aporta

Es la herramienta de trabajo de la estadística aplicada. Casi ninguna relación real es lo bastante limpia para leerse con una regresión de una sola variable, e informar un coeficiente sin ajustar es la manera en que los datos observacionales producen disparates con mucha seguridad.

También te da una forma de decir *por qué controlaste*, que es una frase mucho más útil que "encontramos una correlación".

## Ejemplo resuelto

Datos de tipo admisiones, dos programas y dos niveles de solicitante:

| Programa | Solicitantes fuertes | Admitidos | Solicitantes débiles | Admitidos |
|---|---|---|---|---|
| A | 20 | 18 | 80 | 24 |
| B | 90 | 72 | 10 | 2 |

**Paso 1: comparación sin ajustar.** Programa A: 42 admitidos de 100, es decir, el 42 %. Programa B: 74 de 100, es decir, el 74 %. B parece mucho más amable.

**Paso 2: dentro de cada nivel.** Entre los solicitantes fuertes, A admite al 90 % y B al 80 %. Entre los débiles, A admite al 30 % y B al 20 %. A es mejor en los dos.

**Paso 3: el mecanismo.** B recibió muchos más solicitantes fuertes (90 frente a 20), y los solicitantes fuertes son admitidos a una tasa mayor en todas partes. La tasa conjunta de B es alta por *quién se presentó*, no por cómo se le trató.

**Paso 4: ajusta.** Haz una regresión de la admisión sobre el programa *y* el nivel del solicitante. El coeficiente del programa mide ahora la diferencia entre solicitantes de igual nivel: cambia de signo y favorece a A.

```python
import pandas as pd
import statsmodels.formula.api as smf

df = pd.DataFrame({
    'programme': ['A']*100 + ['B']*100,
    'strength':  ['strong']*20 + ['weak']*80 + ['strong']*90 + ['weak']*10,
    'admitted':  [1]*18 + [0]*2 + [1]*24 + [0]*56 + [1]*72 + [0]*18 + [1]*2 + [0]*8,
})

# Sin ajustar: solo el programa
print(smf.logit('admitted ~ C(programme)', df).fit().params)

# Ajustado: mismos datos, controlando por la fortaleza del solicitante
print(smf.logit('admitted ~ C(programme) + C(strength)', df).fit().params)
```

El coeficiente del programa pasa de claramente positivo para B a negativo. Las mismas filas, la misma aritmética; solo cambió la pregunta.

## Confusor, mediador, colisionador

- Un **confusor** afecta tanto al predictor como al resultado. Ajustar por él es lo correcto: el nivel del solicitante en el ejemplo anterior.
- Un **mediador** está *en el camino* entre el predictor y el resultado (tratamiento → recuperación → supervivencia). Ajustar por él elimina parte del efecto mismo que estás midiendo, así que normalmente es un error.
- Un **colisionador** es causado por ambos (dos síntomas causados por la misma enfermedad). Ajustar por él puede *crear* una asociación que no existe.

La distinción es estructural, y no puede leerse en los datos. Exige saber qué causa qué.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Un estudio encuentra que, entre los pacientes hospitalizados, los que hacían más ejercicio tenían peores resultados. ¿Deberías concluir que el ejercicio es perjudicial?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> No. La hospitalización es aquí un colisionador: tanto una enfermedad grave como el ejercicio pueden llevar a ella. Condicionar por el ingreso hospitalario selecciona un grupo en el que las dos variables se asocian en la dirección opuesta a la realidad. El análisis ha ajustado por la variable equivocada por el mero acto de seleccionar la muestra.</p>

</div>
</details>

## Cuándo usarlo

- Comparar grupos que difieren de una manera medible por la que puedes controlar.
- Informar de un efecto que un lector llamaría confundido de otro modo.
- Comprobar si un hallazgo sin ajustar sobrevive al ajuste; si el coeficiente se mueve mucho, la cifra sin ajustar estaba midiendo otra cosa.

## Limitaciones

- **Solo ajusta por lo que mediste.** La confusión no medida permanece, y suele ser la amenaza dominante en el trabajo observacional.
- **Ajustar por un mediador o un colisionador añade sesgo** en lugar de quitarlo.
- **La colinealidad** entre predictores vuelve los coeficientes inestables y difíciles de interpretar por separado.
- **La forma funcional importa.** Ajustar rectas cuando la relación se dobla informa mal todos los coeficientes.
- **Un coeficiente ajustado sigue sin ser un efecto causal** salvo que el diseño lo justifique.

## Errores frecuentes

- **Ajustar por todo lo que tienes.** Más covariables no es más rigor; cada una necesita una justificación.
- **Leer un coeficiente sin su cláusula "manteniendo el resto fijo".**
- **Quitar una variable porque no es significativa**, lo que puede sesgar las demás.
- **Informar solo el modelo ajustado**, ocultando cuánto movió el ajuste la respuesta.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

El coeficiente sin ajustar de un programa de formación es +4 puntos. Después de ajustar por la capacidad previa es +1. ¿Cuáles son las dos lecturas posibles, y cómo las distinguirías?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> O el beneficio aparente del programa era sobre todo selección (se inscribieron personas más capaces, y su capacidad llevaba los 4 puntos), o la capacidad previa es un mediador que el programa mejora. Distínguelas preguntando si la capacidad previa se midió antes de que empezara el programa. Si era previa, es un confusor y +1 es la estimación honesta; si se midió después, puede estar en el camino causal y el ajuste elimina efecto real.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué el coeficiente ajustado elimina un confusor pero no un mediador?
- Si ajustar cambia un coeficiente de +4 a +1, ¿qué número informarías?
- ¿Pueden dos predictores estar tan correlacionados que ningún coeficiente sea interpretable? ¿Qué mirarías?
- ¿Por qué seleccionar la muestra puede equivaler a ajustar por una variable?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-adjustment-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Cómo se lee un coeficiente en una regresión múltiple?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">El efecto total de esa variable por sí sola.</button>
      <button class="quiz-q__opt" data-idx="1">La correlación entre esa variable y el resultado.</button>
      <button class="quiz-q__opt" data-idx="2">El cambio asociado con un aumento de una unidad, manteniendo fijos los demás predictores.</button>
      <button class="quiz-q__opt" data-idx="3">La proporción de varianza que explica.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ¿Por qué variable deberías ajustar?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Por todas las variables del conjunto de datos.</button>
      <button class="quiz-q__opt" data-idx="1">Por una causa medida tanto del predictor como del resultado.</button>
      <button class="quiz-q__opt" data-idx="2">Por una variable medida después del tratamiento que el tratamiento causó.</button>
      <button class="quiz-q__opt" data-idx="3">Solo por las variables que son estadísticamente significativas.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
