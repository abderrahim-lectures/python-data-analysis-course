---
title: "La paradoja de Simpson"
description: "Cómo una tendencia que se cumple en todos los grupos puede invertirse al juntarlos, y cómo detectarla antes de que te avergüence."
module: "samples-and-uncertainty"
order: 13
difficulty: "intermediate"
estimatedMinutes: 18
learningObjectives:
  - "Reconocer un conjunto de datos agrupado cuya tendencia conjunta contradice la de todos los grupos"
  - "Explicar cómo los tamaños desiguales de los grupos crean la inversión"
  - "Comprobar si existe la paradoja dibujando los grupos por separado antes de juntarlos"
  - "Decir qué resumen es el honesto que hay que publicar"
prerequisites: []
tags: ["paradoja-de-simpson", "confusión", "agrupación", "agregación"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

La **paradoja de Simpson** es la inversión de una tendencia que aparece cuando se combinan grupos. Un tratamiento puede parecer mejor que un control en todos los subgrupos, y peor cuando los subgrupos se juntan. Nada está mal calculado; el número conjunto es real, y responde a una pregunta distinta de la de los números por grupo.

Ocurre cuando los grupos difieren en tamaño *y* en su nivel de partida. El grupo mayor arrastra el promedio conjunto hacia su esquina, y si además resulta que recibe un tratamiento con más frecuencia, el tratamiento hereda la desventaja del grupo.

## Qué aporta

Es el ejemplo más claro de un resumen que es aritméticamente correcto y sustantivamente falso. Todo analista agrega; la paradoja es la razón para mirar los grupos antes de fiarse de una cifra conjunta. Reconocerla convierte un desacuerdo confuso entre dos informes en una explicación estructural.

## A mano, paso a paso

Dos hospitales, dos grupos de gravedad, tasas de recuperación:

| Hospital | Casos leves | Recuperados | Casos graves | Recuperados |
|---|---|---|---|---|
| A | 90 | 81 (90 %) | 10 | 6 (60 %) |
| B | 10 | 8 (80 %) | 90 | 45 (50 %) |

**Paso 1: compara dentro de cada nivel de gravedad.** El hospital A recupera el 90 % de los casos leves frente al 80 % de B, y el 60 % de los graves frente al 50 % de B. A gana en los dos grupos.

**Paso 2: junta los totales.** Hospital A: $81 + 6 = 87$ recuperaciones de 100, es decir, el 87 %. Hospital B: $8 + 45 = 53$ de 100, es decir, el 53 %.

**Paso 3: comprueba la aritmética.** A gana también en conjunto, así que esta tabla *no* es la paradoja, es el caso ordinario. Para ver la inversión, dale a B el grupo de casos leves más numeroso:

| Hospital | Casos leves | Recuperados | Casos graves | Recuperados |
|---|---|---|---|---|
| A | 20 | 18 (90 %) | 80 | 48 (60 %) |
| B | 90 | 72 (80 %) | 10 | 5 (50 %) |

Ahora A recupera el 90 % de los leves frente al 80 % de B, y el 60 % de los graves frente al 50 % de B: A sigue ganando en los dos grupos. En conjunto: A tiene $18+48 = 66$ de 100, es decir, el 66 %; B tiene $72+5 = 77$ de 100, es decir, el 77 %. **B gana en conjunto mientras pierde en todos los subgrupos.**

**Paso 4: di por qué.** A trata sobre todo casos graves, que tienen una tasa de recuperación baja en cualquier hospital. B trata sobre todo casos leves, que tienen una tasa alta. La cifra conjunta mide *a quién trata cada hospital* tanto como *cuán bien los trata*.

## Verlo geométricamente

Dibuja cada grupo como un punto con $x$ = tamaño del grupo e $y$ = tasa de recuperación. El promedio conjunto es una media ponderada, y su posición depende de dónde estén los pesos. En el [explorador de la paradoja de Simpson de GeoGebra](https://www.geogebra.org/m/dqzxhqzy) puedes arrastrar los tamaños de los grupos y ver cómo el punto conjunto cruza las líneas individuales.

## Lo mismo en Python

```python
a = {'mild': (20, 18), 'severe': (80, 48)}
b = {'mild': (90, 72), 'severe': (10, 5)}

for name, g in [('A', a), ('B', b)]:
    for sev, (n, rec) in g.items():
        print(name, sev, f"{rec/n:.0%}")
    total_n = sum(n for n, _ in g.values())
    total_r = sum(r for _, r in g.values())
    print(name, 'pooled', f"{total_r/total_n:.0%}")
```

Los porcentajes por grupo favorecen a A en las dos filas y el porcentaje conjunto favorece a B. Leer esa salida es todo el ejercicio; el código no añade nada salvo velocidad.

## Cuándo buscarla

- Cualquier comparación en la que los grupos sean **desiguales en tamaño** y difieran en riesgo de partida.
- Informar de una **tasa conjunta** a partir de datos que llegaron en lotes, sedes, semanas o cohortes.
- Un resultado que contradice la expectativa de un experto del dominio: la paradoja es una de las primeras cosas que hay que descartar.

## Limitaciones

- **No es un error que haya que "corregir".** El promedio conjunto es un número legítimo para la población combinada; la cuestión es qué población quieres decir.
- **El análisis por grupos puede ser el equivocado** si condicionas por una variable que es consecuencia del tratamiento y no una característica previa.
- **Necesita una variable de agrupación clara.** Si no conoces los grupos, no puedes ajustar por ellos.

## Errores frecuentes

- **Publicar la cifra conjunta sin los grupos**, lo que oculta la inversión por completo.
- **Ajustar por la variable equivocada**, lo que puede crear una paradoja en lugar de eliminarla.
- **Suponer que las muestras pequeñas son inmunes.** La paradoja es aritmética; el tamaño no la impide.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

La tasa de conversión global de una empresa bajó tras un rediseño, pero la conversión subió tanto en móvil como en escritorio por separado. ¿Cuál es la explicación más probable?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Cambió la mezcla de tráfico. Si el móvil (con una tasa de conversión más baja) creció como proporción de las visitas mientras el escritorio se mantenía, la tasa conjunta cae aunque cada plataforma mejore. Segmenta por dispositivo e informa de las dos tasas con sus volúmenes; la cifra conjunta está midiendo la mezcla, no el rediseño.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Puede aparecer la paradoja de Simpson con variables continuas, no solo con recuentos?
- ¿Cuál es la respuesta "verdadera", la tasa conjunta o las tasas por grupo?
- Si no supieras que los grupos existen, ¿a qué conclusión te llevaría la cifra conjunta?
- ¿Impide la paradoja que los grupos se asignen al azar a cada tratamiento?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-simpson-es">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. La paradoja de Simpson describe una situación en la que…</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">la aritmética de una tabla está mal.</button>
      <button class="quiz-q__opt" data-idx="1">la muestra es demasiado pequeña para concluir nada.</button>
      <button class="quiz-q__opt" data-idx="2">una tendencia presente en todos los grupos se invierte al juntar los grupos.</button>
      <button class="quiz-q__opt" data-idx="3">dos variables correlacionan sin vínculo causal.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ¿Qué suele provocar la inversión?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">El redondeo de los porcentajes.</button>
      <button class="quiz-q__opt" data-idx="1">Tamaños de grupo desiguales, con grupos que además difieren en su nivel de partida.</button>
      <button class="quiz-q__opt" data-idx="2">Usar la mediana en lugar de la media.</button>
      <button class="quiz-q__opt" data-idx="3">Valores atípicos dentro de cada grupo.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
