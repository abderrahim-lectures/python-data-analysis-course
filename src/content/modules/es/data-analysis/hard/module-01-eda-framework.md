---
title: "Marco EDA y Perfilado"
description: "Aprende a formular preguntas analíticas, evaluar la calidad de los conjuntos de datos y construir un flujo de trabajo de perfilado sistemático antes de tocar cualquier visualización."
order: 1
section: "data-analysis"
track: "hard"
difficulty: "advanced"
estimatedHours: 5
lessonCount: 2
tags: ["eda", "profiling", "data-quality", "framework"]
prerequisites: []
icon: "🔍"
---

## Por qué importa

Antes de construir cualquier modelo de aprendizaje automático, antes de escribir cualquier código de visualización, antes de presentar un solo gráfico a una parte interesada, necesitas comprender tus datos. El Análisis de Datos Exploratorio es el trabajo de detective que previene errores costosos. Empresas como Netflix dedican semanas al EDA antes de construir sistemas de recomendación. Spotify ejecuta un perfilado extenso sobre los datos de escucha antes de diseñar listas de reproducción. La razón es simple: basura entra, basura sale. Si te saltas el EDA, estás construyendo sobre arena.

Considera un escenario real: una startup de salud recibe datos de pacientes para predecir el riesgo de reingreso. Sin perfilado, no detectan que el 40% de la columna `age` está llena con la cadena "Unknown" en lugar de números. Su modelo se entrena con datos corruptos, produce predicciones seguras pero incorrectas, y la empresa enfrenta un escrutinio regulatorio. Esto no es hipotético, sucede habitualmente. El EDA es el sistema inmunológico de la ciencia de datos. Atrapa infecciones antes de que se propaguen.

La verdad incómoda es que la mayoría de los principiantes saltan directo al modelado o la visualización. Se saltan el perfilado. Asumen que los datos están limpios. Confían en los nombres de las columnas. Este módulo impone una disciplina: ir más lento, mirar con cuidado y comprender qué tienes antes de decidir qué hacer con ello. El marco que aprendes aquí se convierte en el cimiento de todo análisis de este track.

## Qué aprenderás

- Formula preguntas de EDA enfocadas y comprobables a partir de enunciados de problemas empresariales vagos
- Perfila la estructura, los tipos, la falta de valores y la cardinalidad de un conjunto de datos en minutos
- Identifica errores comunes de calidad de datos: duplicados, desajustes de tipos, columnas constantes, campos de alta cardinalidad
- Documenta los hallazgos del perfilado en un flujo de trabajo de notebook reproducible
- Construye una lista de verificación de EDA reutilizable que puedas aplicar a cualquier conjunto de datos

## La derivación

El problema que resuelve el EDA es engañosamente simple: tienes un conjunto de datos y no tienes idea de qué hay dentro. El enfoque ingenuo es comenzar a construir, elegir un modelo, lanzarle datos, esperar lo mejor. Esto falla en silencio. La solución elegante es el perfilado sistemático: una secuencia estructurada de verificaciones que revela la verdadera forma del conjunto de datos.

Comienza con lo básico. ¿Cuántas filas y columnas? ¿Cuáles son los tipos de datos? Suena trivial, pero los desajustes de tipos están por todas partes, fechas almacenadas como cadenas, números almacenados como objetos, columnas categóricas disfrazadas de enteros. Una columna llamada `zip_code` que parece numérica es en realidad categórica. Equivocarte en esto corrompe todo cálculo aguas abajo.

Luego pregunta: ¿qué falta? Los patrones de falta te dicen si los datos son Faltantes Completamente al Azar (MCAR), Faltantes al Azar (MAR) o Faltantes No al Azar (MNAR). Cada patrón exige un tratamiento distinto. Una columna donde el 90% de los valores es nulo es inútil. Una columna donde el 5% es nulo en un patrón predecible (por ejemplo, los usuarios nuevos tienen `tenure` faltante) revela algo significativo sobre tus datos.

Finalmente, examina la cardinalidad. Una columna con 2 millones de valores únicos en 10 000 filas es un identificador, no una característica. Una columna con exactamente un valor único entre todas las filas es una constante, añade ruido a los modelos y confusión al análisis. Encontrarlas temprano ahorra horas de trabajo desperdiciado después.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (120 XP en total para este módulo)
- **Desafíos**: Cada lección tiene desafíos interactivos, perfilar un conjunto de datos misterioso, detectar problemas ocultos de calidad, construir una lista de verificación de EDA completa desde cero
- **Progreso**: completa ambas lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Desbloqueo del capstone**: Completar este módulo contribuye a la pieza de portafolio del capstone del Módulo 5

## Proyectos que puedes construir

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🏠 **Perfilador de precios de vivienda**, perfila un conjunto de datos inmobiliarios e identifica problemas de calidad de datos antes del modelado
- 🛒 **Auditoría de datos de comercio electrónico**, evalúa sistemáticamente un conjunto de datos de transacciones de clientes por completitud y consistencia
- 🏥 **Validador de datos de salud**, construye un pipeline de perfilado reutilizable para conjuntos de datos clínicos
- 📊 **Revisor de estadísticas deportivas**, perfila datos de rendimiento de atletas y señala anomalías
- 🌍 **Verificación de indicadores de desarrollo mundial**, evalúa datos económicos globales por falta de valores y confiabilidad

## Lecciones

1. Formulando Preguntas de EDA, Traduce problemas vagos en preguntas analíticas estructuradas e hipótesis
2. Perfilado de Conjuntos de Datos, Evalúa sistemáticamente estructura, tipos, falta de valores y problemas de calidad de datos