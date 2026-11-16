---
title: "De dónde vienen los datos"
description: "Encuestas, sensores, registros y experimentos: cómo el método de recogida decide qué puede y qué no puede responder el dato."
module: "foundations"
order: 3
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Nombrar las principales formas de recoger datos y para qué sirve cada una"
  - "Explicar el sesgo de muestreo y dar dos ejemplos concretos"
  - "Distinguir un estudio observacional de un experimento"
  - "Hacer las cuatro preguntas que deben preceder a cualquier análisis"
prerequisites: []
tags: ["recogida-de-datos", "muestreo", "sesgo", "contexto", "experimento"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "statistics-101"
track: "normal"
---

## Qué significa

Todo conjunto de datos tiene una **procedencia**: quién o qué produjo cada fila, cuándo y en qué condiciones. La procedencia decide qué puede responder el dato, y ningún análisis añade información que la recogida nunca capturó.

Las fuentes principales que encontrarás:

| Fuente | Qué da | Qué suele faltar |
|---|---|---|
| **Encuesta** | opiniones, hechos autoinformados | sinceridad, y quienes no respondieron |
| **Sensor / registro** | tiempos y recuentos precisos | contexto: por qué ocurrió el valor |
| **Registros administrativos** | cobertura completa de un proceso | todo lo que queda fuera de ese proceso |
| **Experimento** | evidencia sobre la causa | realismo: el entorno es artificial |
| **Analítica web** | comportamiento a escala | identidad, y el motivo detrás de un clic |

El **sesgo de muestreo** es lo que ocurre cuando los casos observados difieren sistemáticamente de la población. Dos ejemplos lo hacen concreto:

- una encuesta de satisfacción en línea respondida solo por quienes no abandonaron el sitio: los que abandonaron son justamente los descontentos, y faltan;
- un estudio del uso de una app a partir de registros, donde quien nunca instaló la app no puede aparecer.

En ambos, la muestra es grande, limpia y medida con precisión, y responde a una pregunta distinta de la que se hizo.

## Qué aporta

Fija el techo de lo que cualquier análisis posterior puede afirmar. Un intervalo de confianza dice con qué precisión mediste *la población de la muestra*; no puede decirte si esa población es la que te importa. Conocer la procedencia te dice qué advertencia adjuntar antes mismo de calcular una media.

La otra distinción que importa es **observacional frente a experimental**:

- en un estudio **observacional** observas lo que pasa: algunas personas decidieron hacer ejercicio y otras no, y las comparas;
- en un **experimento** asignas el tratamiento: tú decides quién hace ejercicio y quién no.

Solo el segundo puede sostener por sí mismo una afirmación causal, porque la asignación aleatoria rompe el vínculo entre el tratamiento y todo lo demás de la persona.

## Ejemplo trabajado

Una empresa quiere saber si un nuevo proceso de pago aumenta las compras.

- **Si compara clientes que vieron el nuevo proceso con los que no**, tiene una comparación observacional. Los dos grupos difieren en cosas que importan: puede que el nuevo proceso se desplegara en un dispositivo concreto, o para cuentas nuevas, y esas diferencias van mezcladas con el resultado. Cualquier diferencia es una mezcla del proceso y del despliegue.
- **Si asigna visitantes al azar al proceso antiguo o al nuevo**, tiene un experimento. Los grupos difieren solo por azar, así que una diferencia en la tasa de compra es atribuible al proceso, dentro del margen de error muestral.

La aritmética posterior es idéntica. La diferencia está enteramente en la recogida, y es la diferencia entre una sugerencia y una evidencia.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Una ciudad mide la calidad del aire con 10 sensores, todos colocados cerca de escuelas. ¿Pueden los datos responder "cuál es la calidad media del aire en la ciudad"?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> No sin matices. Los sensores son una muestra sesgada: las escuelas pueden estar lejos de zonas industriales o, al contrario, junto a calles con mucho tráfico de entrada. Los datos describen bien la calidad del aire cerca de escuelas y se generalizan a la ciudad solo si la colocación no está relacionada con los niveles de contaminación, cosa que es patentemente falsa. Repórtalo como "calidad del aire cerca de escuelas" salvo que uses un esquema de muestreo independiente de la colocación.</p>

</div>
</details>

## Las cuatro preguntas antes de cualquier análisis

1. **¿Qué es una fila?** ¿Una entrega, una persona, una sesión, un día? Equivocarse aquí hace que todos los recuentos estén mal.
2. **¿Quién falta en estos datos?** Quienes no respondieron, quienes desinstalaron, las transacciones fallidas antes del registro.
3. **¿Cómo se seleccionaron los casos?** ¿Al azar, por conveniencia, o quien estaba conectado?
4. **¿Se asignó algo, o solo se observó?** Esto decide si una afirmación causal está disponible.

## Lo mismo en Python

La procedencia rara vez está en el archivo, así que regístrala junto a los datos. Un hábito mínimo:

```python
meta = {
    'source': 'checkout-log',
    'one_row': 'un intento de pago completado',
    'window': '2026-10-01 a 2026-10-31',
    'missing': 'los carritos abandonados antes del pago no se registran',
    'assignment': 'observacional — el proceso dependía del dispositivo',
}

for k, v in meta.items():
    print(f'{k}: {v}')
```

Diez líneas que evitan la clase de error más cara: analizar una columna que no significa lo que todos suponían.

## Cuándo usarlo

Siempre que abras un conjunto de datos desconocido, y siempre que un resultado esté a punto de informar una decisión. La comprobación de procedencia es barata y es el único paso que no se recupera después.

## Limitaciones

- **La procedencia a menudo no está documentada.** Entonces hay que reconstruirla, o tratar las conclusiones como provisionales.
- **Ni siquiera una muestra limpia arregla una variable ausente.** Si la satisfacción nunca se registró para las cancelaciones, ningún análisis la recupera.
- **La aleatorización no siempre es ética ni posible.** Entonces los métodos observacionales con ajuste cuidadoso son la alternativa honesta, con sus límites declarados.

## Errores frecuentes

- **Confundir una muestra grande con una representativa.** Un millón de filas sesgadas sigue estando sesgado.
- **Suponer que los registros están completos.** El registro falla, los bloqueadores existen y el tráfico de bots es real.
- **Leer causalidad de una comparación observacional** porque la aritmética era sofisticada.
- **Ignorar a quienes no responden**, que suelen ser el grupo más informativo de una encuesta.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

Un servicio de streaming descubre que quienes ven más de 10 horas semanales lo valoran mejor, y concluye que fomentar más visionado mejorará la satisfacción. ¿Qué falla en el razonamiento?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> La comparación es observacional y probablemente invertida: quienes ya disfrutan del servicio ven más. Puede que la satisfacción cause el visionado y no al revés, y que ambos estén impulsados por un tercer factor como tener tiempo libre. Para contrastar la afirmación necesitarías fomentar el visionado en un grupo aleatorizado y comparar la satisfacción.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué una muestra grande no compensa que esté sesgada?
- ¿Qué puede decirte un experimento que un estudio observacional no puede, y qué no puede?
- Si quienes no responden difieren de quienes responden, ¿qué estima realmente la encuesta?
- ¿Por qué "una fila = una persona" es a veces un supuesto equivocado, incluso cuando los datos son sobre personas?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="statistics-101-provenance-es">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué significa sesgo de muestreo?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Que la muestra es demasiado pequeña.</button>
      <button class="quiz-q__opt" data-idx="1">Que los casos observados difieren sistemáticamente de la población de interés.</button>
      <button class="quiz-q__opt" data-idx="2">Que las mediciones contienen errores aleatorios.</button>
      <button class="quiz-q__opt" data-idx="3">Que los datos se recogieron demasiado rápido.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="3">
    <p class="quiz-q__prompt">2. ¿Qué diseño puede sostener por sí mismo una afirmación causal?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Una muestra observacional grande.</button>
      <button class="quiz-q__opt" data-idx="1">Una encuesta con alta tasa de respuesta.</button>
      <button class="quiz-q__opt" data-idx="2">Un conjunto de datos con muchas variables.</button>
      <button class="quiz-q__opt" data-idx="3">Un experimento aleatorizado.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
