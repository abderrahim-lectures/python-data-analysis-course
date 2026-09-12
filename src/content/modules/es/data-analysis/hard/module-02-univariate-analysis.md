---
title: "Análisis y Visualización Univariados"
description: "Domina distribuciones, resúmenes y codificación visual para variables individuales con matplotlib y seaborn."
order: 2
section: "data-analysis"
track: "hard"
difficulty: "advanced"
estimatedHours: 5
lessonCount: 2
tags: ["univariate", "matplotlib", "seaborn", "distributions"]
prerequisites: ["module-01-eda-framework"]
icon: "📊"
---

## Por qué importa

Mirar una variable a la vez parece aburrido. Se siente como un calentamiento antes del trabajo real. Pero todo insight en la ciencia de datos comienza con el análisis univariado. Si no comprendes la distribución de tus variables individuales, cualquier análisis que construyas encima está construido sobre arena.

Considera un conjunto de datos salariales. Antes de poder comparar salarios entre departamentos, necesitas saber: ¿Cómo se ve la distribución salarial general? ¿Es simétrica o fuertemente sesgada a la derecha? ¿Hay valores atípicos sospechosos, quizás alguien que gana 10 millones de dólares cuando todos los demás ganan entre 40 000 y 150 000? ¿Hay un segundo pico que sugiera dos poblaciones distintas? Ninguna de estas preguntas involucra una segunda variable. Todas exigen que mires con cuidado una sola columna.

Las consecuencias de saltarse el análisis univariado son reales. Un salario medio de 85 000 dólares suena razonable hasta que te das cuenta de que está jalado hacia arriba por un puñado de salarios de CEOs en un conjunto de datos de ingresos medianos. Un modelo entrenado con características no examinadas aprenderá de estas distorsiones. La visualización revela lo que las estadísticas resumidas ocultan: la forma, los huecos, los clústeres, las colas. Un histograma te dice más que una media jamás lo hará.

Este módulo entrena tu intuición. Después de completarlo, podrás mirar una distribución y reconocer al instante asimetría, multimodalidad, colas pesadas y valores atípicos, patrones que guían cada decisión, desde la ingeniería de características hasta la selección de modelos.

## Qué aprenderás

- Selecciona y calcula estadísticas resumidas apropiadas para variables numéricas y categóricas
- Crea histogramas, gráficos de KDE, gráficos de caja y de violín para distribuciones numéricas
- Construye gráficos de conteo, de barras y de pastel para el análisis de frecuencia categórica
- Lee las formas de las distribuciones y detecta asimetría, valores atípicos y multimodalidad solo con los gráficos
- Elige entre pruebas estadísticas según las características de la distribución

## La derivación

El problema que resuelve el análisis univariado es fundamental: los números crudos son difíciles de interpretar. Mirar una columna de 10 000 valores no te dice nada. Necesitas comprimir esa información en algo legible para humanos.

El enfoque ingenuo es calcular la media y dar el asunto por terminado. Pero la media es frágil. Un solo valor atípico extremo puede jalarla salvajemente. Considera los ingresos: {30K, 35K, 40K, 45K, 50K, 500K}. La media es 116 667 dólares, lo que no representa a nadie. La mediana es 42 500, lo que representa a la mayoría. Por eso necesitas tanto medidas de tendencia central como medidas de dispersión, desviación estándar, rango intercuartílico, rango, para comprender el carácter verdadero de una distribución.

Ahora considera el enfoque visual. Un histograma agrupa valores en intervalos y los cuenta. Revela al instante: ¿La distribución tiene forma de campana (normal)? ¿Sesgada a la derecha (como los ingresos)? ¿Sesgada a la izquierda (como la edad de jubilación)? ¿Bimodal (sugiriendo dos subgrupos ocultos)? Esta huella visual guía todo lo que sigue. Una distribución normal justifica pruebas paramétricas. Una distribución sesgada exige transformación o alternativas no paramétricas.

El KDE (Estimación de Densidad de Kernel) suaviza el histograma en una curva continua, lo que facilita leer y comparar distribuciones. Los gráficos de caja comprimen la distribución en cinco números más los valores atípicos. Los gráficos de violín combinan el gráfico de caja con el KDE, mostrando tanto estadísticas resumidas como la forma completa. Cada visualización cumple un propósito analítico distinto. Dominarlas significa que puedes extraer la máxima información de una sola variable con el mínimo esfuerzo.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (120 XP en total para este módulo)
- **Desafíos**: Identifica el tipo de distribución a partir de un histograma misterioso, detecta valores atípicos sin código, construye un panel de estadísticas resumidas desde cero
- **Progreso**: completa ambas lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Desbloqueo del capstone**: Tus habilidades univariadas alimentan directamente el capstone del Módulo 5

## Proyectos que puedes construir

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 💰 **Analizador de distribución salarial**, visualiza y analiza datos de compensación entre industrias
- 🎮 **Explorador de calificaciones de juegos**, perfila puntuaciones de reseñas de juegos e identifica patrones de calificación
- 🏋️ **Perfilador de rastreadores de fitness**, analiza pasos diarios, calorías y distribuciones de sueño
- 📚 **Analista de longitud de libros**, explora distribuciones de conteo de páginas entre géneros
- 🌡️ **Perfilador de datos climáticos**, visualiza distribuciones de temperatura y precipitación por región

## Lecciones

1. Análisis Univariado Numérico, Distribuciones, histogramas, KDE, gráficos de caja y estadísticas resumidas para columnas numéricas
2. Análisis Univariado Categórico, Tablas de frecuencia, gráficos de conteo, gráficos de barras y manejo de ordinal vs. nominal