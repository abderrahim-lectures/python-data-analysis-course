---
title: "Para qué sirve la estadística"
description: "La estadística como disciplina para responder preguntas con datos inciertos: el vocabulario, las dos familias y las preguntas que no puede responder."
module: "foundations"
order: 1
difficulty: "beginner"
estimatedMinutes: 16
learningObjectives:
  - "Decir para qué sirve la estadística en una frase"
  - "Distinguir estadística descriptiva de inferencial con un ejemplo de cada una"
  - "Nombrar las seis palabras que todas las lecciones posteriores dan por sabidas: población, muestra, parámetro, estadístico, variable, observación"
  - "Reconocer una pregunta que la estadística no puede responder"
prerequisites: []
tags: ["vocabulario", "definiciones", "descriptiva", "inferencial"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

La **estadística** es la disciplina de responder preguntas usando datos incompletos e inciertos.

Esa frase tiene tres partes que conviene separar, porque en cada una ocurre un tipo distinto de error.

- **Responder preguntas.** Sin pregunta no hay estadística, solo aritmética. "¿Cuál es la media de estos números?" es aritmética. "¿El nuevo sistema de rutas es más rápido *en general*?" es una pregunta estadística, porque solo ves algunas entregas.
- **Usar datos.** La respuesta tiene que venir de observaciones y no de la opinión ni de la autoridad.
- **Incompletos e inciertos.** Nunca lo ves todo. Una muestra, un mes de un año, treinta piezas de un millón. Por eso toda conclusión lleva una advertencia sobre cuánto podría estar equivocada.

La estadística tiene dos familias:

| | Descriptiva | Inferencial |
|---|---|---|
| Pregunta | ¿Cómo son *estos* datos? | ¿Qué dicen estos datos del mundo en general? |
| Herramientas | media, mediana, dispersión, gráficos | error típico, intervalos de confianza, contrastes |
| Riesgo | Resumir mal | Generalizar mal |

La primera mitad de este curso es descriptiva; la segunda es inferencial. Ninguna es más difícil, pero responden preguntas distintas y la segunda siempre se apoya en la primera.

## Qué aporta

Sin estadística te quedas con anécdotas. "Nuestro último cliente quedó contento" y "la mayoría de nuestros clientes está contenta" son afirmaciones distintas, y solo la segunda puede sostener una decisión. La estadística es la maquinaria que convierte un montón de observaciones en una afirmación defendible y, lo que es igual de importante, te dice cuándo el montón es demasiado pequeño o poco representativo para defender nada.

## Las seis palabras que todo lo demás usa

Apréndelas ahora; cada lección posterior las usa sin definirlas.

- **Población**: el conjunto completo de cosas de las que quieres hablar. Todas las entregas de este año. Todos los adultos del país. Cada pieza que la fábrica hará alguna vez.
- **Muestra**: el subconjunto que realmente observaste. Las 25 entregas que cronometraste. Las 400 personas a las que encuestaste.
- **Parámetro**: un número que describe la **población**. El verdadero tiempo medio de entrega. Normalmente desconocido, y es lo que intentas estimar.
- **Estadístico**: un número que describe la **muestra**. La media de tus 25 entregas. Conocido, pero oscila.
- **Variable**: una característica que puede diferir entre casos. Tiempo de entrega, valoración de satisfacción, si un paquete llegó dañado.
- **Observación** (o caso, o fila): una cosa medida. Una entrega, una persona, una pieza.

El par parámetro/estadístico es el que más importa. Un parámetro es fijo y desconocido; un estadístico es conocido y variable. Todos los métodos inferenciales de este curso son formas de ir del segundo al primero.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Una universidad encuesta a 500 de sus 20.000 estudiantes y encuentra que el 62% usaría una nueva biblioteca nocturna. Identifica la población, la muestra, el parámetro y el estadístico.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Población: los 20.000 estudiantes. Muestra: los 500 encuestados. Parámetro: la proporción real de los 20.000 que la usaría, desconocida. Estadístico: el 62% de la muestra, conocido y solo una estimación del parámetro. La distancia entre ambos es todo el tema de la estadística inferencial.</p>

</div>
</details>

## Descriptiva e inferencial en una imagen

Mides 25 entregas y calculas una media de 18 minutos. Eso describe tus datos.

Después preguntas si la media de *todas* las entregas está probablemente cerca de 18, y le adjuntas un rango. Eso es inferir.

El segundo paso solo es legítimo si la muestra se tomó sin sesgo. Un intervalo perfecto alrededor de una muestra sesgada describe una población que nunca conocerás. Por eso el diseño de la recogida de datos importa más que la sofisticación del análisis.

## Lo que la estadística no puede hacer

- **No puede convertir una mala pregunta en buena.** "¿Nuestro producto es bueno?" no tiene respuesta medible hasta que "bueno" se define como una variable.
- **No puede arreglar una muestra sesgada.** El remuestreo reproduce el sesgo con precisión.
- **No puede establecer causalidad solo con datos observacionales**, por fuerte que sea la asociación o el resultado del programa.
- **No puede inventar información que nunca se registró.** Una variable ausente sigue ausente; ningún método la recupera.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

¿Cuáles de estas son preguntas estadísticas? (a) ¿Cuál es la altura media de esta sala? (b) ¿Las personas de esta ciudad son más altas que las de esa otra? (c) ¿Cuánto es 7 × 6? (d) ¿Deberíamos subir el precio?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> (a) es descriptiva: aritmética sobre un conjunto completo. (b) es inferencial: la gente de cada ciudad es una población que muestreas, y la comparación necesita incertidumbre. (c) es aritmética. (d) es una decisión, no una pregunta estadística: los datos pueden informarla (la elasticidad al precio), pero la pregunta trata de objetivos, no de números.</p>

</div>
</details>

## Lo mismo en Python

La distinción aparece en el código que escribes. Describir una muestra es una línea:

```python
deliveries = [8, 12, 10, 15, 45]
mean = sum(deliveries) / len(deliveries)
print(mean)            # 18,0 — un estadístico de la muestra
```

Decir algo sobre la población requiere más: un error típico, un intervalo y un supuesto sobre cómo se tomó la muestra. Ese es el tema del módulo 5 en adelante.

## Cuándo usarlo

Este vocabulario sirve para toda conversación sobre datos. Cuando alguien dice "el usuario medio", pregunta: ¿la media de qué muestra, en representación de qué población?

## Limitaciones

- **Las definiciones son precisas y el mundo no.** Decidir qué cuenta como población es un juicio, y otro juicio da otra respuesta.
- **La división descriptiva/inferencial no es una escala de calidad.** Una descripción cuidadosa de un conjunto completo vale más que una inferencia descuidada.
- **El vocabulario no te dice cómo diseñar un estudio.** Eso pertenece al dominio y al diseño experimental.

## Errores frecuentes

- **Decir "población" cuando quieres decir "muestra"**, lo que invalida toda afirmación posterior sobre incertidumbre.
- **Tratar una muestra de conveniencia como si fuera aleatoria.** Quien respondió rara vez es quien querías.
- **Publicar un estadístico y llamarlo parámetro.** "La media es 18" es una afirmación sobre tu muestra; la media poblacional es desconocida.
- **Saltarse la pregunta.** "Vamos a analizar los datos" sin una pregunta produce gráficos que nadie pidió.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Un hospital informa "nuestra mediana de espera es de 4 semanas". Alguien lo repite como "la mediana de espera en el país es de 4 semanas". ¿Qué salió mal, en el vocabulario de esta lección?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Se presentó un estadístico sobre la muestra de un hospital como un parámetro de la población nacional. Es una generalización sin base muestral: los pacientes de ese hospital no son una muestra aleatoria del país, así que el estadístico estima solo la población de ese hospital, y ni siquiera eso si atiende a una región o condición concreta.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- Si pudieras medir la población entera, ¿seguirías necesitando la estadística?
- ¿Por qué la media muestral es "conocida pero variable" mientras que la media poblacional es "fija pero desconocida"?
- ¿Qué pregunta has visto publicada con estadísticas que se habría respondido mejor sin ellas?
- ¿Por qué importa más la calidad de la muestra que la complejidad del método?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-what-is-stats-es">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué distingue la estadística inferencial de la descriptiva?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La inferencial usa aritmética más difícil.</button>
      <button class="quiz-q__opt" data-idx="1">La inferencial generaliza de una muestra a una población, con incertidumbre declarada.</button>
      <button class="quiz-q__opt" data-idx="2">La descriptiva usa gráficos y la inferencial no.</button>
      <button class="quiz-q__opt" data-idx="3">La inferencial solo se aplica a datos médicos.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Un número calculado sobre tu muestra se llama…</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">parámetro</button>
      <button class="quiz-q__opt" data-idx="1">población</button>
      <button class="quiz-q__opt" data-idx="2">estadístico</button>
      <button class="quiz-q__opt" data-idx="3">variable</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
