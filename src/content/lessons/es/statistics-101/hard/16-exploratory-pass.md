---
title: "Una pasada exploratoria"
description: "Doce comprobaciones sobre un conjunto de datos real, en orden, con el razonamiento de cada una escrito."
module: "applied-statistics"
order: 16
difficulty: "advanced"
estimatedMinutes: 35
learningObjectives:
  - "Perfilar los tipos, los valores faltantes y los rangos de un CSV antes de resumirlo"
  - "Comparar media, mediana y RIC y anotar la forma que implican"
  - "Justificar cada exclusión con una razón declarada, no solo con un umbral"
  - "Redactar un hallazgo exploratorio por separado de uno confirmado"
prerequisites: []
tags: ["eda", "perfilado-de-datos", "visualización", "informes"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "statistics-101"
track: "hard"
---

## Qué significa

Una **pasada exploratoria** es una secuencia fija de comprobaciones que se ejecuta antes de sacar cualquier conclusión. Su salida no es un resultado sino un conjunto de decisiones registradas: qué falta, qué es inverosímil, qué está agrupado y qué vas a afirmar y qué no como consecuencia.

La disciplina consiste en separar *mirar* de *concluir*. Los hallazgos exploratorios son hipótesis; los confirmatorios se prueban sobre datos en los que la hipótesis no se formó.

## Las doce comprobaciones

1. **Forma de la tabla**: filas, columnas y qué representa una fila.
2. **Tipos**: qué columnas son números que llegaron como texto.
3. **Valores faltantes**: recuento por columna, y si se agrupan por categoría.
4. **Rangos**: mínimo y máximo por columna numérica, buscando valores imposibles.
5. **Duplicados**: filas exactas e identificadores repetidos.
6. **Centro**: media y mediana una al lado de otra.
7. **Dispersión**: desviación típica y RIC una al lado de la otra.
8. **Cola**: cuántos valores quedan más allá de las vallas, y cuáles son.
9. **Grupos**: ¿difieren los resúmenes por categoría, sede o lote?
10. **Relaciones**: diagramas de dispersión antes de cualquier número de correlación.
11. **Decisiones**: cada exclusión, con una razón registrada.
12. **Afirmaciones**: un párrafo de lo que los datos respaldan, y otro de lo que no.

## Ejemplo resuelto

El curso incluye un conjunto de datos del rendimiento de estudiantes. Perfílalo primero:

```python
import pandas as pd

df = pd.read_csv('students-performance.csv')
print(df.shape)          # how many rows, columns
print(df.dtypes)         # check that scores are numbers
print(df.isna().sum())   # missing per column
print(df.describe())     # ranges, centre, spread in one view
```

**Qué te dice la salida, en orden.**

- Si `shape` muestra más filas de las que esperas, comprueba si hay duplicados antes de seguir.
- Si una columna de notas tiene tipo `object`, contiene un valor suelto como `"absent"` y toda operación aritmética posterior será errónea o se omitirá en silencio.
- Si `isna().sum()` no es cero, decide ahora si eliminar, rellenar o modelar los valores faltantes; la elección debe quedar registrada.
- Si `describe()` muestra un mínimo de 0 en una columna de notas, puede ser un marcador de ausencia y no un cero real.

Después comprueba la forma de una nota:

```python
score = df['math score']
print(score.mean(), score.median())
q1, q3 = score.quantile([.25, .75])
print(q1, q3, q3 - q1)
print((score < q1 - 1.5*(q3-q1)).sum(), (score > q3 + 1.5*(q3-q1)).sum())
```

**Cómo leerlo.** Si la media y la mediana difieren solo en un punto o dos, la distribución es casi simétrica y cualquiera de los dos centros vale. Si la desviación típica es mucho mayor que el RIC dividido entre 1,35, las colas pesan más que en una forma normal y la media está siendo arrastrada. Si los recuentos de las vallas no son cero, inspecciona esas filas una a una.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

`describe()` muestra un curso de preparación de exámenes con un mínimo de 0 y un máximo de 100, con una media de 35. ¿Justifica eso tratar el 0 como "sin preparación" o como dato faltante? ¿Qué mirarías?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> La distribución decide. Si la columna por lo demás es continua y una parte grande está exactamente en 0, probablemente sea una categoría genuina de "ninguno" o un valor por defecto; si solo unos pocos están en 0 mientras el resto se dispersa, es más probable que sean valores faltantes codificados como 0. Cruza los ceros con otra variable (por ejemplo, el nivel educativo de los padres, que no debería estar relacionado con que falte el dato) para comprobar si se comportan como observaciones reales.</p>

</div>
</details>

## Registrar las decisiones

La salida de esta lección es un registro breve, una línea por decisión:

```
Eliminadas 3 filas: IDs de estudiante duplicados (2) y una nota de 1000 (entrada de datos).
Conservadas 12 filas con test prep = 0: distribución continua, ninguna otra columna falta en ellas.
Agrupado por preparación: 'none' frente a 'completed' difieren en 8 puntos en lectura y en escritura.
```

Ese registro es lo que hace revisable el análisis. Sin él, un lector no puede distinguir una exclusión meditada de una cómoda.

## Cuándo usarla

Antes de cualquier análisis confirmatorio, y antes de entregar datos a otra persona. Es barata —minutos— comparada con el coste de una conclusión construida sobre una columna mal leída.

## Limitaciones

- **Los hallazgos exploratorios no son evidencia.** La misma pasada que encuentra un patrón también genera la hipótesis, así que hay que comprobar el patrón con datos nuevos.
- **Escala mal sin agrupar.** Con miles de categorías, las doce comprobaciones necesitan una estrategia de muestreo en lugar de un listado completo.
- **No puede detectar lo que no está en los datos.** Los grupos ausentes, los fracasos no registrados y el sesgo de supervivencia son invisibles para un perfil de lo que se recogió.

## Errores frecuentes

- **Coerción silenciosa.** Convertir texto en números con `pd.to_numeric(errors='coerce')` transforma los valores malos en faltantes, así que el recuento de faltantes salta; hay que registrar ambas cosas.
- **Dejar que `describe()` sustituya a un gráfico.** Oculta los picos múltiples por completo.
- **Borrar la cola antes de comprobar si es una subpoblación real.**

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Tu perfil muestra dos picos en el histograma de notas. ¿Cuáles son las dos explicaciones más probables, y qué las distinguiría?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> O el conjunto de datos contiene dos poblaciones distintas (por ejemplo, dos escuelas o dos aplicaciones del examen) o la medida está censurada o redondeada de una manera que amontona valores. Distínguelas coloreando el histograma según una variable de agrupación candidata; si los picos se separan limpiamente, son dos poblaciones, y todo resumen conjunto debería dividirse por esa variable.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué es importante registrar las decisiones y no solo sus resultados?
- ¿Cuál de las doce comprobaciones detectaría la paradoja de Simpson antes de que publiques nada?
- Si a una columna le falta el 30 % de los valores, ¿cuáles son tres maneras legítimas de proceder, y qué supone cada una?
- ¿Por qué un hallazgo exploratorio es evidencia más débil que uno confirmatorio, incluso cuando los números son idénticos?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-eda-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Una columna numérica llega con tipo object. ¿Qué es lo primero que hay que comprobar?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La media.</button>
      <button class="quiz-q__opt" data-idx="1">La correlación con otras columnas.</button>
      <button class="quiz-q__opt" data-idx="2">Qué entradas no son números analizables, y qué representan.</button>
      <button class="quiz-q__opt" data-idx="3">Si hay que eliminar la columna.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">2. ¿Por qué registrar una decisión de exclusión?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Para que el informe sea más largo.</button>
      <button class="quiz-q__opt" data-idx="1">Porque el software lo exige.</button>
      <button class="quiz-q__opt" data-idx="2">Para acelerar el siguiente análisis.</button>
      <button class="quiz-q__opt" data-idx="3">Para que un lector distinga una elección meditada de una cómoda, y pueda reproducirla.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
