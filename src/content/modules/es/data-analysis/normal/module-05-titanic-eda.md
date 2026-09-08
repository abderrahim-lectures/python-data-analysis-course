---
title: "EDA Guiado del Titanic"
description: "Únelo todo: carga el conjunto de datos del Titanic, explora su estructura, límpialo y responde preguntas analíticas reales."
order: 5
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "eda", "titanic", "end-to-end"]
prerequisites: ["module-04-groupby-aggregation"]
icon: "🚢"
---

## Por qué importa

Has aprendido Series, DataFrames, selección, filtrado, limpieza, groupby y fusión — cinco módulos de bloques de construcción. Pero un bloque de construcción no es un edificio. La brecha entre conocer operaciones individuales de pandas y conducir un análisis real es la brecha entre saber usar un martillo y saber construir una casa. Este módulo cierra esa brecha. Tomarás un conjunto de datos crudo — el manifiesto de pasajeros del Titanic — y trabajarás el ciclo de vida completo de un análisis de datos exploratorio (EDA): cargar, inspeccionar, limpiar, seleccionar, agrupar, agregar y sacar conclusiones. El conjunto de datos del Titanic es ideal para esto porque contiene cada desafío que enfrentarás en el mundo real: valores faltantes (Age, Cabin, Embarked), tipos mixtos (tarifa numérica, sexo categórico, nombres de texto), y preguntas que exigen combinar técnicas (tasa de supervivencia por clase Y sexo Y grupo de edad). Al final, tendrás un análisis completo y reproducible — no una colección de fragmentos de código aislados.

La motivación más profunda: el EDA es la habilidad más importante del análisis de datos. Antes de construir modelos, antes de crear paneles, antes de presentar hallazgos, debes comprender tus datos. El EDA es cómo construyes esa comprensión. Es una conversación estructurada: ¿Qué contiene este conjunto de datos? ¿Qué tan completo es? ¿Qué distribuciones siguen las variables clave? ¿Qué relaciones existen entre variables? ¿Qué anomalías o sorpresas aparecen? El conjunto de datos del Titanic te permite practicar esta conversación con riesgos reales — las preguntas son concretas (¿quién sobrevivió y por qué?), los datos son suficientemente desordenados para exigir limpieza, y los insights son suficientemente interpretables para validarlos. Este módulo no trata solo de sintaxis de pandas. Trata de construir el patrón de pensamiento analítico que separa a los analistas competentes de los excelentes.

## Qué aprenderás

- Carga el conjunto de datos del Titanic (o cualquier CSV), inspecciona su estructura con `info()`, `describe()` y `value_counts()`
- Identifica y maneja valores faltantes en múltiples columnas con diferentes estrategias (eliminar, rellenar, imputar)
- Crea nuevas columnas derivadas a partir de datos existentes (por ejemplo, grupos de edad, tamaño de familia, extracción de títulos de los nombres)
- Realiza análisis de groupby multidimensional: tasas de supervivencia por clase, sexo, grupo de edad y puerto de embarque
- Construye tablas resumen y tabulaciones cruzadas que revelen patrones en los datos
- Extrae y comunica conclusiones accionables del análisis con razonamiento claro basado en evidencia

## La derivación

Comienza con los datos crudos. El conjunto de datos del Titanic tiene 891 filas y 12 columnas: PassengerId, Survived, Pclass, Name, Sex, Age, SibSp, Parch, Ticket, Fare, Cabin, Embarked. Una primera pasada ingenua revela problemas: Age falta en 177 pasajeros (20%), Cabin falta en 687 (77%) y Embarked falta en 2. Sin limpieza, cualquier análisis de supervivencia por edad es incompleto. La fase de limpieza aborda esto: eliminar Cabin (demasiado escasa para salvarla), rellenar Age con la mediana (robusta a valores atípicos) y rellenar Embarked con la moda (solo faltan 2). Ahora los datos están listos para analizar.

Luego, las preguntas analíticas. "¿Sobrevivieron más las mujeres que los hombres?" exige agrupar por Sex y calcular la tasa de supervivencia. "¿Importó la clase del pasajero?" exige agrupar por Pclass. Pero el insight real viene del groupby multidimensional: agrupar por Sex Y Pclass simultáneamente. El resultado revela que el 96.8% de las mujeres de primera clase sobrevivieron pero solo el 50% de las mujeres de tercera — clase y sexo interactúan. Para ir más profundo, creas una columna AgeGroup agrupando Age en categorías (Child, Teen, Adult, Senior) usando `pd.cut()`. Ahora puedes agrupar por AgeGroup y descubrir que los niños tuvieron tasas de supervivencia más altas independientemente de la clase. Cada técnica de los cuatro módulos anteriores aparece naturalmente: Series/DataFrame para cargar, selección para aislar columnas, limpieza para manejar valores faltantes y groupby para calcular tasas de supervivencia. La derivación es todo el pipeline trabajando junto — no una técnica aislada, sino todas compuestas en un análisis coherente.

## Gamificación

- **Recompensa de XP**: +150 XP por lección completada (300 XP en total para este módulo capstone)
- **Desafíos**: Completa el pipeline completo de EDA sin mirar notas; responde cinco preguntas analíticas sobre los patrones de supervivencia; identifica y comunica tres hallazgos sorprendentes de los datos
- **Progreso**: Completa ambas lecciones para ganar la insignia de finalización del track normal de Análisis de Datos
- **Bono de racha**: Completa este módulo inmediatamente después del Módulo 04 para un bono de racha de +10 XP
- **Desafío capstone**: Escribe un resumen de análisis de 200 palabras que cuente la historia de la supervivencia en el Titanic usando solo evidencia de tus resultados de groupby — sin especulación, solo datos
- **Jefe final**: Extiende el análisis con una pregunta nueva no cubierta en las lecciones (por ejemplo, ¿viajar con familiares a bordo afecta la supervivencia?) y presenta tus hallazgos

## Proyectos que puedes construir

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 📊 **Pipeline completo de EDA** — toma cualquier conjunto de datos crudo y produce un análisis exploratorio completo con limpieza, groupby y conclusiones
- 🐼 **Preparación de predictor de supervivencia** — usa tus insights del EDA del Titanic para diseñar características para un modelo de aprendizaje automático
- 🕷️ **Explorador de conjuntos de datos** — construye una plantilla de EDA reutilizable que funcione con cualquier CSV: cargar, inspeccionar, limpiar, agrupar, resumir
- 📈 **Análisis comparativo** — compara patrones de supervivencia en múltiples conjuntos de datos históricos (por ejemplo, Titanic vs. Lusitania)
- 💰 **Generador de informes de insights** — escribe una función que tome un DataFrame y una lista de preguntas y produzca un informe de EDA formateado

## Lecciones

1. Cargando y Explorando el Titanic — Carga el conjunto de datos, inspecciona la estructura, identifica valores faltantes y comprende los tipos de columna
2. Análisis EDA del Titanic — Limpia, agrupa, crea columnas derivadas y responde preguntas analíticas sobre los patrones de supervivencia