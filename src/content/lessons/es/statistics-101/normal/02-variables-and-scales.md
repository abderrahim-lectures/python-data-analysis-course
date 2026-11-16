---
title: "Variables y sus escalas"
description: "Categórica o numérica, y en cuál de las cuatro escalas de medida: la clasificación que decide qué medidas son siquiera legales."
module: "foundations"
order: 2
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Clasificar una variable como categórica o numérica"
  - "Nombrar las cuatro escalas de medida y situar una variable en una de ellas"
  - "Decir qué medidas de centro y dispersión son válidas en cada escala"
  - "Detectar un código numérico que en realidad es una categoría"
prerequisites: []
tags: ["variables", "escalas-de-medida", "nominal", "ordinal", "contexto"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

Una **variable** es una característica que puede tomar valores distintos entre casos. Antes de resumirla necesitas saber qué tipo es, porque el tipo decide qué aritmética tiene sentido.

La primera división es **categórica frente a numérica**:

- **Categórica**: los valores nombran un grupo. Color, departamento, sí/no, tipo de dispositivo. Puedes contarlos y hallar el más frecuente, pero "color medio" no significa nada.
- **Numérica**: los valores son números sobre los que la aritmética tiene sentido. Tiempo, precio, recuento, temperatura.

Las variables numéricas se dividen otra vez por **escala**, que registra cuánta estructura llevan los números.

| Escala | Estructura | Ejemplos | Resúmenes válidos |
|---|---|---|---|
| **Nominal** | solo nombres, sin orden | color, ciudad, sí/no | moda, recuentos, proporciones |
| **Ordinal** | nombres con orden | bajo/medio/alto, satisfacción 1–5, escala de dolor | mediana, moda, rango intercuartílico |
| **De intervalo** | orden y huecos iguales, sin cero real | temperatura en °C, año, puntuación de CI | media, mediana, desviación típica |
| **De razón** | orden, huecos iguales y cero real | tiempo, precio, peso, recuento | todo, incluidos cocientes |

La regla práctica: **la escala decide qué medidas son legales.** Una media de una variable nominal es un error. Un cociente de dos valores de intervalo ("hoy hace el doble de calor que ayer") no tiene sentido, porque 0 °C no es ausencia de temperatura.

## Qué aporta

Casi toda historia de "las estadísticas están mal" se reduce a una variable usada en la escala equivocada. Promediar valoraciones por estrellas solo es defendible si aceptas tratar una escala ordinal como de intervalo. Citar "la temperatura subió un 50%" no significa nada sin unidades. Codificar departamentos como 1, 2, 3 y promediar los códigos produce un número que no significa nada.

Conocer la escala te dice qué pregunta tienes siquiera permiso para hacer.

## Ejemplo trabajado

Un conjunto de datos de tickets de soporte:

| Columna | Valores | Tipo | Escala |
|---|---|---|---|
| ticket_id | T-1001, T-1002 | categórica | nominal |
| priority | low, medium, high | categórica | **ordinal** |
| response_minutes | 3, 45, 1200 | numérica | **de razón** |
| satisfaction | 1, 2, 3, 4, 5 | numérica | **ordinal** |
| agent_id | 12, 47, 3 | parece numérica | **nominal** |
| opened_at | 2026-03-01 | fecha | de intervalo |

**Lectura de la tabla.**

- `ticket_id` es una etiqueta que casualmente contiene dígitos. Ordenarla no significa nada.
- `priority` tiene orden, así que la mediana es válida, pero los huecos entre bajo y medio no son iguales a los de medio y alto, así que la media es forzada.
- `response_minutes` tiene un cero real (respuesta instantánea) y unidades iguales, así que toda medida y todo cociente son legales. "El doble de lento" es una afirmación real.
- `satisfaction` es la trampa clásica: los números 1–5 son etiquetas ordenadas, no medidas. Muchos equipos los promedian, lo que es una convención y no un hecho; vale hacerlo a sabiendas.
- `agent_id` es la trampa más afilada. Está guardado como número, así que el software calculará su media encantado, y la respuesta no significa nada.
- `opened_at` es de intervalo: la diferencia entre dos fechas es válida, pero "2026 es el doble de 1013" no.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Un conjunto de datos registra la talla de camiseta como 1, 2, 3, 4. ¿Es numérica? ¿Qué puedes calcular y qué no deberías?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Es una <em>codificación</em> numérica de una variable categórica ordinal. La mediana y la moda son válidas; la media (2,3, por ejemplo) no tiene interpretación porque los pasos entre tallas no son iguales. Un recuento de cuántas personas hay en cada talla es el resumen más útil.</p>

</div>
</details>

## Cómo la escala cambia el análisis

La misma pregunta —"¿la satisfacción es mayor en el equipo A?"— tiene respuestas distintas según la escala:

- en una variable **nominal**, comparas proporciones ("una mayor parte de los clientes de A eligió 'muy satisfecho'");
- en una variable **ordinal**, comparas medianas o distribuciones, o usas un contraste de rangos;
- en una variable **de intervalo o de razón**, una diferencia de medias y una prueba t son apropiadas.

Elegir la equivocada no solo cambia el número; puede invertir la conclusión. Por eso la lección de vocabulario va antes que la aritmética.

## Lo mismo en Python

```python
import pandas as pd

df = pd.DataFrame({
    'priority': pd.Categorical(['low', 'high', 'medium'], categories=['low', 'medium', 'high'], ordered=True),
    'response': [3, 45, 1200],
    'agent_id': [12, 47, 3],
})

print(df['priority'].cat.ordered)      # True — una categórica ordenada
print(df['response'].mean())           # válido: escala de razón
print(df['agent_id'].mean())           # se ejecuta, pero no significa nada: nominal
```

pandas calculará una media para `agent_id` sin avisar. El sistema de tipos no te protege aquí; la escala sí, y solo si la compruebas.

## Cuándo usarlo

Antes de cualquier resumen en cualquier análisis. Etiquetar el tipo y la escala de cada columna lleva un minuto y evita la mayoría de los errores del resto del curso.

## Limitaciones

- **Las fronteras a veces son un juicio.** ¿Una puntuación de satisfacción de 1–10 es ordinal o de intervalo? Discutiblemente ordinal, tratada habitualmente como de intervalo. Declara tu elección.
- **La escala puede cambiar con la pregunta.** La edad en años es de razón; el tramo de edad es ordinal.
- **Los datos reales a menudo mezclan tipos en una columna**: una columna numérica con `"n/d"` dentro es a la vez numérica y ausente.
- **La clasificación no te dice la calidad de los datos**, solo qué aritmética es legal.

## Errores frecuentes

- **Promediar códigos.** Los códigos postales, los números de departamento y los identificadores de agente son nominales.
- **Tratar una escala ordinal como de intervalo sin decirlo.**
- **Calcular cocientes sobre datos de intervalo.** "El doble de CI" y "el doble de temperatura" no significan nada.
- **Llamar numérica a una variable porque está guardada como tal.** Mira qué significan los valores, no cómo están tipados.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Clasifica cada una: (a) número de hijos, (b) orden de nacimiento (1.º, 2.º, 3.º), (c) altura en cm, (d) grupo sanguíneo, (e) nota de examen A–F, (f) año natural.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> (a) de razón: cero real y pasos iguales. (b) ordinal: el orden importa, el hueco entre 1.º y 2.º no es el mismo que entre 2.º y 3.º. (c) de razón. (d) nominal. (e) ordinal. (f) de intervalo: las diferencias son válidas, los cocientes no.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué puedes tomar la mediana de una variable ordinal pero no la media?
- ¿Por qué 0 °C no es "nada de temperatura" mientras que 0 kg sí es "nada de masa"?
- ¿Qué se rompe si promedias una puntuación de satisfacción de 1–5, y merece la pena hacerlo igualmente?
- ¿Puede una variable ser categórica y numérica a la vez?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-variables-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ¿Qué escala tiene un orden válido pero huecos desiguales?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nominal</button>
      <button class="quiz-q__opt" data-idx="1">de intervalo</button>
      <button class="quiz-q__opt" data-idx="2">ordinal</button>
      <button class="quiz-q__opt" data-idx="3">de razón</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ¿Por qué es problemática una temperatura media en °C como afirmación de cociente ("el doble de calor")?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Las temperaturas siempre son ordinales.</button>
      <button class="quiz-q__opt" data-idx="1">Celsius es una escala de intervalo sin cero real, así que los cocientes no significan nada.</button>
      <button class="quiz-q__opt" data-idx="2">Los números son demasiado pequeños.</button>
      <button class="quiz-q__opt" data-idx="3">La temperatura no se puede promediar.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
